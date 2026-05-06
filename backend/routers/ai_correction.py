from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
import httpx
import json
import time
import os
import logging

from ..database import Session, IACall
from ..auth import verify_firebase_token

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/ai", tags=["ai"])

ONEMIN_API_URL = "https://api.1min.ai/api/chat-with-ai"
ONEMIN_API_KEY = os.getenv("ONEMIN_API_KEY")
AI_MODEL       = os.getenv("AI_MODEL", "gpt-4o-mini")


class AICorrectionRequest(BaseModel):
    firebase_token: str
    exercise_id:    str
    course_id:      str | None = None
    student_text:   str
    # Rubrique lue depuis le YAML côté client — le backend ne stocke pas les YAMLs
    ai_correction:  dict  # { context, scoring_guide, score_max, age_target, language }


class AICorrectionResponse(BaseModel):
    score:          float
    score_max:      int
    feedback:       str
    points_reussis: list[str]
    a_ameliorer:    list[str]
    flag:           str | None
    xp_earned:      int


SYSTEM_PROMPT = """Tu es un assistant de correction scolaire bienveillant pour des enfants de {age} ans.
Tu réponds UNIQUEMENT en JSON valide, sans texte avant ni après, sans balises markdown.
Tu évalues uniquement si la réponse correspond aux critères pédagogiques fournis.
Ton feedback fait 2-3 phrases maximum, dans un vocabulaire adapté à un enfant de {age} ans.
Tu encourages toujours l'élève, même si sa réponse est incomplète ou fausse.

IMPORTANT — distinction entre mauvaise réponse et réponse inappropriée :
- Une réponse hors sujet, incomplète, fausse ou sans rapport avec l'exercice → note normalement (score bas), flag=null.
- Une réponse contenant EXPLICITEMENT des insultes, gros mots, propos violents ou à caractère sexuel → flag="inappropriate".
  Dans ce cas uniquement, explique BRIÈVEMENT et avec bienveillance pourquoi tu ne peux pas la corriger,
  et retourne ce JSON :
  {{"score": 0, "feedback": "<1 phrase bienveillante expliquant pourquoi cette réponse ne peut pas être évaluée>", "points_reussis": [], "a_ameliorer": ["Essaie d'écrire une réponse respectueuse"], "flag": "inappropriate"}}"""

USER_PROMPT = """CONTEXTE DE L'EXERCICE :
{context}

GUIDE DE NOTATION :
{scoring_guide}

--- RÉPONSE DE L'ÉLÈVE (évalue uniquement ce texte) ---
{student_text}
--- FIN DE LA RÉPONSE ---

Retourne UNIQUEMENT ce JSON (pas de markdown, pas de texte autour) :
{{
  "score": <nombre décimal entre 0 et {score_max}>,
  "feedback": "<2-3 phrases encourageantes adaptées à un enfant de {age} ans>",
  "points_reussis": ["<ce que l'élève a bien fait, ou liste vide si rien de correct>"],
  "a_ameliorer": ["<une seule suggestion concrète et bienveillante>"],
  "flag": null
}}"""


@router.post("/correct", response_model=AICorrectionResponse)
async def correct_free_text(req: AICorrectionRequest):
    start_time = time.time()

    # 1. Vérifier le token Firebase
    try:
        decoded = verify_firebase_token(req.firebase_token)
        user_id = decoded["uid"]
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Token Firebase invalide")

    if not ONEMIN_API_KEY:
        raise HTTPException(status_code=503, detail="Clé API IA non configurée (ONEMIN_API_KEY manquant)")

    # 2. Construire les prompts
    ai_cfg = req.ai_correction
    age    = ai_cfg.get("age_target", 10)
    system_prompt = SYSTEM_PROMPT.format(age=age)
    user_prompt   = USER_PROMPT.format(
        context       = ai_cfg.get("context", ""),
        scoring_guide = ai_cfg.get("scoring_guide", ""),
        student_text  = req.student_text,
        score_max     = ai_cfg.get("score_max", 10),
        age           = age,
    )
    full_prompt = f"{system_prompt}\n\n{user_prompt}"

    # 3. Appeler 1min.ai
    onemin_response_raw = None
    onemin_metadata     = {}
    onemin_uuid         = None
    onemin_status       = None
    ai_result           = None
    flag                = None

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                ONEMIN_API_URL,
                headers={
                    "Content-Type": "application/json",
                    "API-KEY": ONEMIN_API_KEY,
                },
                json={
                    "type": "UNIFY_CHAT_WITH_AI",
                    "model": AI_MODEL,
                    "promptObject": {
                        "prompt": full_prompt,
                        "settings": {
                            "webSearchSettings": {"webSearch": False}
                        },
                    },
                },
            )
            response.raise_for_status()
            onemin_data = response.json()

    except httpx.TimeoutException:
        _log_ia_call(
            user_id=user_id, exercise_id=req.exercise_id, course_id=req.course_id,
            prompt_system=system_prompt, prompt_user=user_prompt,
            student_text=req.student_text, prompt_length=len(full_prompt),
            score_returned=None, feedback_returned=None, flag="error",
            response_raw="timeout", onemin_uuid=None, model_used=AI_MODEL,
            onemin_status="timeout", duration_ms=round((time.time() - start_time) * 1000),
        )
        raise HTTPException(status_code=504, detail="L'IA met trop de temps à répondre — réessaie dans quelques instants")

    except Exception as e:
        raise HTTPException(status_code=502, detail="Erreur lors de l'appel à l'IA")

    # 4. Extraire la réponse 1min.ai
    ai_record       = onemin_data.get("aiRecord", {})
    onemin_metadata = ai_record.get("metadata", {})
    onemin_uuid     = ai_record.get("uuid")
    onemin_status   = ai_record.get("status")
    result_object   = ai_record.get("aiRecordDetail", {}).get("resultObject", [""])
    raw_text        = result_object[0] if result_object else ""
    onemin_response_raw = json.dumps(onemin_data)

    # 5. Parser le JSON retourné par l'IA (nettoyer les éventuelles balises markdown)
    try:
        clean = raw_text.strip()
        if clean.startswith("```"):
            parts = clean.split("```")
            clean = parts[1] if len(parts) > 1 else clean
            if clean.startswith("json"):
                clean = clean[4:]
            clean = clean.strip()
        ai_result = json.loads(clean)
        flag = ai_result.get("flag")
    except json.JSONDecodeError:
        logger.error(f"Réponse IA non-parseable : {raw_text[:200]}")
        raise HTTPException(status_code=502, detail="Réponse IA invalide — réessaie")

    # 6. Calculer le score normalisé et l'XP
    score_max  = int(ai_cfg.get("score_max", 10))
    score      = float(ai_result.get("score", 0))
    score_norm = score / score_max if score_max > 0 else 0
    xp_total   = 30   # TODO: passer depuis le corps de la requête (future version)
    xp_earned  = 0 if flag == "inappropriate" else round(xp_total * score_norm)

    duration_ms = round((time.time() - start_time) * 1000)

    # 7. Logger en base
    _log_ia_call(
        user_id           = user_id,
        exercise_id       = req.exercise_id,
        course_id         = req.course_id,
        prompt_system     = system_prompt,
        prompt_user       = user_prompt,
        student_text      = req.student_text,
        prompt_length     = len(full_prompt),
        score_returned    = score,
        feedback_returned = ai_result.get("feedback", ""),
        flag              = flag,
        response_raw      = onemin_response_raw,
        onemin_uuid       = onemin_uuid,
        model_used        = AI_MODEL,
        onemin_status     = onemin_status,
        duration_ms       = duration_ms,
        tokens_input      = onemin_metadata.get("inputToken"),
        tokens_output     = onemin_metadata.get("outputToken"),
        tokens_total      = onemin_metadata.get("totalToken"),
        credit_input      = onemin_metadata.get("inputCredit"),
        credit_output     = onemin_metadata.get("outputCredit"),
        credit_total      = onemin_metadata.get("credit"),
        execution_time_ai = onemin_metadata.get("executionTime"),
    )

    logger.info(
        f"IA correction | user:{user_id} | exo:{req.exercise_id} | "
        f"score:{score}/{score_max} | tokens:{onemin_metadata.get('totalToken')} | "
        f"credit:{onemin_metadata.get('credit')} | {duration_ms}ms | flag:{flag}"
    )

    return AICorrectionResponse(
        score          = score,
        score_max      = score_max,
        feedback       = ai_result.get("feedback", ""),
        points_reussis = ai_result.get("points_reussis", []),
        a_ameliorer    = ai_result.get("a_ameliorer", []),
        flag           = flag,
        xp_earned      = xp_earned,
    )


def _log_ia_call(**kwargs):
    """Sauvegarde un appel IA en base. Ne propage jamais d'exception."""
    try:
        session = Session()
        record = IACall(**kwargs, created_at=datetime.utcnow())
        session.add(record)
        session.commit()
        session.close()
    except Exception as e:
        logger.error(f"Erreur logging IA call : {e}")
