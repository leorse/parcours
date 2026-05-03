# Jalon 3quater — Correction IA (exercice texte libre)
## Document technique pour Claude dans VS Code

---

## Objectif

Implémenter le type d'exercice `free_text` avec correction par IA.
Remplacer le placeholder `FreeTextExercise` du jalon 3 par une vraie implémentation.
Brancher le backend FastAPI sur l'API 1min.ai.
Logger tous les appels IA avec leurs métadonnées complètes.

**À la fin du jalon 3quater :**
- L'élève écrit une réponse libre
- L'app envoie au backend
- Le backend appelle 1min.ai avec un prompt structuré précis
- L'IA retourne un score + feedback en JSON
- L'app affiche le résultat comme les autres exercices
- Chaque appel est loggé en base avec tous les métadonnées

**Ce qui ne change pas :** tous les autres exercices, la navigation,
le parc SVG, le moteur d'exercices existant.

---

## Architecture du flux

```
App React (FreeTextExercise)
    │ POST /api/ai/correct
    │ { exercise_id, student_text, firebase_token }
    ▼
Backend FastAPI
    │ 1. Vérifie le token Firebase
    │ 2. Charge la rubrique depuis le YAML (ou la reçoit dans le body)
    │ 3. Construit le prompt système + utilisateur
    │ 4. Appelle POST https://api.1min.ai/api/chat-with-ai
    │ 5. Parse la réponse JSON de l'IA
    │ 6. Logge tout en base (ia_calls)
    │ 7. Retourne { score, feedback, flag, points_reussis, a_ameliorer }
    ▼
App React
    → Affiche ExerciseResult (même composant que les autres exercices)
```

---

## Partie 1 — YAML de l'exercice free_text

### Structure dans exercises.yaml

```yaml
- id: "exo-hist-libre-01"
  xp: 30
  skills:
    - tag: "histoire/expression-ecrite"
      weight: 0.6
    - tag: "histoire/antiquite"
      weight: 0.4
  difficulty: 3
  exercise:
    type: free_text
    instruction: "Explique avec tes mots pourquoi Rome est devenue un empire."
    placeholder: "Écris ta réponse ici..."
    min_words: 20
    max_words: 150
    ai_correction:
      # Contexte précis fourni à l'IA — elle ne doit pas réfléchir,
      # juste comparer la réponse aux éléments attendus
      context: |
        L'élève doit expliquer la transformation de Rome en empire.
        Éléments attendus (au moins 2 sur 3) :
        - La fin de la République romaine
        - Le rôle de Jules César ou Auguste
        - La notion de pouvoir centralisé / emperor
      scoring_guide: |
        10/10 : mentionne 3 éléments avec une explication cohérente
        7/10  : mentionne 2 éléments correctement
        4/10  : mentionne 1 élément ou réponse très partielle
        0/10  : hors sujet ou incompréhensible
      score_max: 10
      age_target: 11
      language: "fr"

- id: "exo-geo-photo-01"
  xp: 20
  skills:
    - tag: "geographie/observation"
      weight: 1.0
  difficulty: 2
  exercise:
    type: free_text
    instruction: "Décris ce que tu vois sur cette image."
    image: "courses/geographie/paris-monuments.webp"
    placeholder: "Décris les monuments et les lieux..."
    min_words: 10
    max_words: 80
    ai_correction:
      # L'IA sait exactement ce qui est sur l'image — pas besoin de le déduire
      context: |
        L'image montre : la Tour Eiffel, Notre-Dame de Paris, et le Louvre.
        L'élève doit identifier au moins 2 de ces 3 monuments.
        Une réponse acceptable peut utiliser des descriptions
        (ex: "la grande tour en métal") même sans connaître le nom exact.
      scoring_guide: |
        10/10 : identifie les 3 monuments (nom ou description précise)
        7/10  : identifie 2 monuments
        4/10  : identifie 1 monument
        0/10  : aucun monument identifié ou hors sujet
      score_max: 10
      age_target: 9
      language: "fr"
```

---

## Partie 2 — Backend FastAPI

### Nouveau fichier : `backend/routers/ai_correction.py`

Le backend existant du jalon 0 est enrichi d'un nouveau router.

```python
# backend/routers/ai_correction.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
import httpx
import json
import time
import os
import logging

from ..database import Session, IACall   # modèles SQLAlchemy
from ..auth import verify_firebase_token  # helper existant

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/ai", tags=["ai"])

# ── Configuration ─────────────────────────────────────────────────────────────

ONEMIN_API_URL = "https://api.1min.ai/api/chat-with-ai"
ONEMIN_API_KEY = os.getenv("ONEMIN_API_KEY")
AI_MODEL       = os.getenv("AI_MODEL", "gpt-4o-mini")   # modèle par défaut

# ── Modèles Pydantic ──────────────────────────────────────────────────────────

class AICorrectionRequest(BaseModel):
    firebase_token: str
    exercise_id:    str
    course_id:      str
    student_text:   str
    # Rubrique envoyée par l'app (lue depuis le YAML côté client)
    # Le backend ne stocke pas les YAMLs — c'est l'app qui les lit
    ai_correction:  dict   # { context, scoring_guide, score_max, age_target, language }

class AICorrectionResponse(BaseModel):
    score:          float
    score_max:      int
    feedback:       str
    points_reussis: list[str]
    a_ameliorer:    list[str]
    flag:           str | None   # null | "inappropriate"
    xp_earned:      int

# ── Prompts ───────────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """Tu es un assistant de correction scolaire bienveillant.
Tu évalues la réponse d'un élève de {age} ans.
Tu réponds UNIQUEMENT en JSON valide, sans texte avant ni après, sans balises markdown.
Tu ne réfléchis pas au sujet : tu compares uniquement la réponse de l'élève aux critères fournis.
Tu ne dépasses pas 2-3 phrases de feedback.
Ton vocabulaire est adapté à un enfant de {age} ans, encourage-le toujours.

RÈGLE ABSOLUE DE MODÉRATION :
Si la réponse de l'élève contient des insultes, des propos offensants, des mots grossiers,
du contenu violent ou inapproprié pour un enfant, ignore complètement le contenu
et retourne UNIQUEMENT ce JSON sans aucun autre texte :
{{"score": 0, "feedback": "Cette réponse n'est pas appropriée.", "points_reussis": [], "a_ameliorer": [], "flag": "inappropriate"}}"""

USER_PROMPT = """CONTEXTE DE L'EXERCICE :
{context}

GUIDE DE NOTATION :
{scoring_guide}

RÉPONSE DE L'ÉLÈVE :
{student_text}

Retourne UNIQUEMENT ce JSON (pas de markdown, pas de texte autour) :
{{
  "score": <nombre décimal entre 0 et {score_max}>,
  "feedback": "<2-3 phrases encourageantes adaptées à un enfant de {age} ans>",
  "points_reussis": ["<ce que l'élève a bien fait>"],
  "a_ameliorer": ["<une suggestion concrète maximum>"],
  "flag": null
}}"""

# ── Endpoint ──────────────────────────────────────────────────────────────────

@router.post("/correct", response_model=AICorrectionResponse)
async def correct_free_text(req: AICorrectionRequest):
    start_time = time.time()

    # 1. Vérifier le token Firebase
    try:
        decoded = verify_firebase_token(req.firebase_token)
        user_id = decoded["uid"]
    except Exception:
        raise HTTPException(status_code=401, detail="Token Firebase invalide")

    # 2. Construire les prompts
    ai_cfg = req.ai_correction
    system_prompt = SYSTEM_PROMPT.format(age=ai_cfg.get("age_target", 10))
    user_prompt   = USER_PROMPT.format(
        context       = ai_cfg.get("context", ""),
        scoring_guide = ai_cfg.get("scoring_guide", ""),
        student_text  = req.student_text,
        score_max     = ai_cfg.get("score_max", 10),
        age           = ai_cfg.get("age_target", 10),
    )
    full_prompt = f"{system_prompt}\n\n{user_prompt}"

    # 3. Appeler 1min.ai
    onemin_response_raw = None
    onemin_metadata     = {}
    ai_result           = None
    flag                = None
    error_detail        = None

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
                            "webSearchSettings": { "webSearch": False }
                        }
                    }
                }
            )
            response.raise_for_status()
            onemin_data = response.json()

    except httpx.TimeoutException:
        error_detail = "Timeout 1min.ai"
        raise HTTPException(status_code=504, detail="L'IA met trop de temps à répondre")
    except Exception as e:
        error_detail = str(e)
        raise HTTPException(status_code=502, detail="Erreur appel IA")

    # 4. Extraire les données de la réponse 1min.ai
    ai_record        = onemin_data.get("aiRecord", {})
    onemin_metadata  = ai_record.get("metadata", {})
    onemin_uuid      = ai_record.get("uuid")
    onemin_status    = ai_record.get("status")
    result_object    = ai_record.get("aiRecordDetail", {}).get("resultObject", [""])
    raw_text         = result_object[0] if result_object else ""
    onemin_response_raw = json.dumps(onemin_data)

    # 5. Parser la réponse JSON de l'IA
    try:
        # Nettoyer les éventuelles balises markdown que l'IA aurait ajoutées
        clean_text = raw_text.strip()
        if clean_text.startswith("```"):
            clean_text = clean_text.split("```")[1]
            if clean_text.startswith("json"):
                clean_text = clean_text[4:]
        ai_result = json.loads(clean_text)
        flag = ai_result.get("flag")
    except json.JSONDecodeError:
        logger.error(f"Impossible de parser la réponse IA : {raw_text}")
        raise HTTPException(status_code=502, detail="Réponse IA invalide")

    # 6. Calculer l'XP (0 si flag inappropriate)
    score_max  = ai_cfg.get("score_max", 10)
    score      = float(ai_result.get("score", 0))
    score_norm = score / score_max if score_max > 0 else 0
    xp_total   = 30   # sera fourni par l'app dans une future version
    xp_earned  = 0 if flag == "inappropriate" else round(xp_total * score_norm)

    duration_ms = round((time.time() - start_time) * 1000)

    # 7. Logger en base
    _log_ia_call(
        user_id          = user_id,
        exercise_id      = req.exercise_id,
        course_id        = req.course_id,
        prompt_system    = system_prompt,
        prompt_user      = user_prompt,
        student_text     = req.student_text,
        prompt_length    = len(full_prompt),
        score_returned   = score,
        feedback_returned= ai_result.get("feedback", ""),
        flag             = flag,
        response_raw     = onemin_response_raw,
        onemin_uuid      = onemin_uuid,
        model_used       = AI_MODEL,
        onemin_status    = onemin_status,
        duration_ms      = duration_ms,
        # Métadonnées 1min.ai
        tokens_input     = onemin_metadata.get("inputToken"),
        tokens_output    = onemin_metadata.get("outputToken"),
        tokens_total     = onemin_metadata.get("totalToken"),
        credit_input     = onemin_metadata.get("inputCredit"),
        credit_output    = onemin_metadata.get("outputCredit"),
        credit_total     = onemin_metadata.get("credit"),
        execution_time_ai= onemin_metadata.get("executionTime"),
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

# ── Logger ────────────────────────────────────────────────────────────────────

def _log_ia_call(**kwargs):
    """Sauvegarde un appel IA en base. Ne lève jamais d'exception."""
    try:
        session = Session()
        session.add(IACall(**kwargs, created_at=datetime.utcnow()))
        session.commit()
        session.close()
    except Exception as e:
        logger.error(f"Erreur logging IA call : {e}")
```

---

### Modèle SQLAlchemy — `backend/database.py`

Ajouter la table `ia_calls` :

```python
class IACall(Base):
    __tablename__ = "ia_calls"

    id               = Column(Integer,  primary_key=True)
    created_at       = Column(DateTime, nullable=False)

    # Contexte
    user_id          = Column(String,   nullable=False, index=True)
    exercise_id      = Column(String,   nullable=False)
    course_id        = Column(String,   nullable=True)

    # Prompt
    prompt_system    = Column(Text,     nullable=True)
    prompt_user      = Column(Text,     nullable=True)
    student_text     = Column(Text,     nullable=True)
    prompt_length    = Column(Integer,  nullable=True)

    # Résultat IA
    score_returned   = Column(Float,    nullable=True)
    feedback_returned= Column(Text,     nullable=True)
    flag             = Column(String,   nullable=True)   # null | "inappropriate"
    response_raw     = Column(Text,     nullable=True)   # JSON brut complet 1min.ai

    # Métadonnées 1min.ai
    onemin_uuid      = Column(String,   nullable=True)
    model_used       = Column(String,   nullable=True)
    onemin_status    = Column(String,   nullable=True)
    tokens_input     = Column(Integer,  nullable=True)
    tokens_output    = Column(Integer,  nullable=True)
    tokens_total     = Column(Integer,  nullable=True)
    credit_input     = Column(Integer,  nullable=True)
    credit_output    = Column(Integer,  nullable=True)
    credit_total     = Column(Integer,  nullable=True)
    execution_time_ai= Column(Float,    nullable=True)   # secondes, côté 1min.ai

    # Performance backend
    duration_ms      = Column(Integer,  nullable=True)   # temps total backend
```

### Variables d'environnement — `.env`

```
ONEMIN_API_KEY=<ta clé 1min.ai>
AI_MODEL=gpt-4o-mini
```

---

## Partie 3 — Frontend React

### FreeTextExercise.jsx — implémentation complète

```jsx
// src/components/exercise/types/FreeTextExercise.jsx

import { useState, useMemo } from 'react'
import MdBlock from '../../lesson/blocks/MdBlock'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL   // dans .env React

export default function FreeTextExercise({ exercise, onSubmit, exerciseData, courseId }) {
  const [text,     setText]     = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)

  const wordCount = useMemo(() =>
    text.trim().split(/\s+/).filter(Boolean).length,
    [text]
  )

  const minWords = exercise.min_words ?? 10
  const maxWords = exercise.max_words ?? 200
  const canSubmit = wordCount >= minWords && wordCount <= maxWords && !loading

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    try {
      // Récupérer le token Firebase
      const { getAuth } = await import('firebase/auth')
      const token = await getAuth().currentUser?.getIdToken()
      if (!token) throw new Error('Non connecté')

      const res = await fetch(`${BACKEND_URL}/api/ai/correct`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firebase_token: token,
          exercise_id:    exerciseData.id,
          course_id:      courseId,
          student_text:   text,
          ai_correction:  exercise.ai_correction,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail ?? 'Erreur serveur')
      }

      const result = await res.json()

      // Transformer la réponse IA en format attendu par useExerciseState
      onSubmit({
        type:     'ai_result',   // signal que c'est une réponse IA
        score:    result.score / result.score_max,
        feedback: result.feedback,
        points_reussis: result.points_reussis,
        a_ameliorer:    result.a_ameliorer,
        flag:     result.flag,
        xp_earned: result.xp_earned,
      })

    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="exercise-freetext">
      {exercise.instruction && (
        <MdBlock text={exercise.instruction} />
      )}

      {exercise.image && (
        <img
          src={exercise.image}
          alt="Exercice"
          className="freetext-image"
        />
      )}

      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder={exercise.placeholder ?? 'Écris ta réponse ici...'}
        disabled={loading}
        className="freetext-textarea"
        maxLength={maxWords * 10}
      />

      {/* Compteur de mots */}
      <div className={`word-counter ${wordCount < minWords ? 'under' : wordCount > maxWords ? 'over' : 'ok'}`}>
        {wordCount} / {minWords} mots minimum
        {maxWords && ` (max ${maxWords})`}
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="freetext-error">
          ⚠️ {error} — Réessaie dans quelques instants.
        </div>
      )}

      <button
        className="btn-validate"
        disabled={!canSubmit}
        onClick={handleSubmit}
      >
        {loading ? (
          <span className="loading-dots">
            ✏️ Correction en cours
            <span className="dots">...</span>
          </span>
        ) : (
          '✉️ Envoyer ma réponse'
        )}
      </button>
    </div>
  )
}
```

### Variable d'environnement React — `.env`

```
VITE_BACKEND_URL=https://ton-url.cloudflare.com
```

En dev local :
```
VITE_BACKEND_URL=http://localhost:8000
```

---

### Adapter exerciseService.js pour le type free_text

```js
// Dans exerciseService.js — ajouter le case
// Le free_text ne valide PAS localement, il passe par l'IA
// La validation est déjà faite par le backend, on retourne juste le résultat

case 'free_text':
  return validateFreeText(exercise, userAnswer)

function validateFreeText(exercise, userAnswer) {
  // userAnswer = { type: 'ai_result', score, feedback, flag, ... }
  // Si c'est une réponse IA déjà traitée, on la passe directement
  if (userAnswer?.type === 'ai_result') {
    return {
      correct:  userAnswer.score >= 0.5,
      score:    userAnswer.score,
      feedback: userAnswer.feedback,
      flag:     userAnswer.flag,
      // Champs supplémentaires pour ExerciseResult
      points_reussis: userAnswer.points_reussis ?? [],
      a_ameliorer:    userAnswer.a_ameliorer    ?? [],
    }
  }
  return { correct: false, score: 0, feedback: null }
}
```

### Adapter ExerciseResult.jsx pour afficher les détails IA

```jsx
// Ajouter dans ExerciseResult.jsx si le résultat vient de l'IA

{state.points_reussis?.length > 0 && (
  <div className="result-points-reussis">
    <strong>✅ Ce que tu as bien fait :</strong>
    <ul>
      {state.points_reussis.map((p, i) => <li key={i}>{p}</li>)}
    </ul>
  </div>
)}

{state.a_ameliorer?.length > 0 && (
  <div className="result-ameliorer">
    <strong>💡 Pour progresser :</strong>
    <ul>
      {state.a_ameliorer.map((p, i) => <li key={i}>{p}</li>)}
    </ul>
  </div>
)}

{state.flag === 'inappropriate' && (
  <div className="result-inappropriate">
    ⚠️ Rappel : écris des réponses respectueuses.
  </div>
)}
```

---

### Ajouter answerGenerator pour free_text

```js
// Dans answerGenerator.js — ajouter le case free_text

case 'free_text':
  // Pas de réponse injectable automatiquement pour le free_text
  // Le dashboard debug affiche juste le contexte attendu
  return {
    __debug_info__: "Exercice texte libre — correction via IA",
    context: exercise.ai_correction?.context ?? "Pas de contexte défini",
    min_words: exercise.min_words,
    max_words: exercise.max_words,
  }
```

Dans le dashboard debug, `ExercisePreview` affiche le contexte
au lieu d'injecter une réponse pour ce type.

---

### Ajouter le test unitaire pour free_text

```js
// Dans exerciseService.test.js — ajouter

const FREE_TEXT_EXERCISE = {
  type: 'free_text',
  instruction: 'Explique...',
  min_words: 20,
  max_words: 150,
  ai_correction: { score_max: 10 },
}

describe('validateAnswer — free_text', () => {

  test('réponse IA correcte → correct=true si score >= 0.5', () => {
    const result = validateAnswer(FREE_TEXT_EXERCISE, {
      type: 'ai_result', score: 0.8, feedback: 'Bravo !',
      points_reussis: ['Bonne structure'], a_ameliorer: [], flag: null,
    })
    expect(result.correct).toBe(true)
    expect(result.score).toBe(0.8)
  })

  test('réponse IA score faible → correct=false', () => {
    const result = validateAnswer(FREE_TEXT_EXERCISE, {
      type: 'ai_result', score: 0.3, feedback: 'À revoir',
      points_reussis: [], a_ameliorer: ['Développe davantage'], flag: null,
    })
    expect(result.correct).toBe(false)
  })

  test('flag inappropriate → correct=false, score=0', () => {
    const result = validateAnswer(FREE_TEXT_EXERCISE, {
      type: 'ai_result', score: 0, feedback: 'Réponse non appropriée',
      points_reussis: [], a_ameliorer: [], flag: 'inappropriate',
    })
    expect(result.correct).toBe(false)
    expect(result.score).toBe(0)
    expect(result.flag).toBe('inappropriate')
  })

  test('réponse sans type ai_result → score=0', () => {
    const result = validateAnswer(FREE_TEXT_EXERCISE, 'texte brut sans traitement')
    expect(result.score).toBe(0)
  })
})
```

---

## Récapitulatif des variables d'environnement

### Backend `.env`

```
ONEMIN_API_KEY=<clé 1min.ai>
AI_MODEL=gpt-4o-mini
```

### Frontend `.env` (React)

```
VITE_BACKEND_URL=https://ton-domaine.cloudflare.com
```

### Frontend `.env.local` (dev local — ne pas committer)

```
VITE_BACKEND_URL=http://localhost:8000
```

---

## Ce qu'il ne faut PAS faire

```
✗ Ne pas mettre la clé ONEMIN_API_KEY dans le code React
  → elle doit rester sur le backend uniquement
✗ Ne pas valider le texte libre localement dans exerciseService
  → toute la validation passe par l'IA via le backend
✗ Ne pas bloquer l'app si le backend est injoignable
  → afficher un message d'erreur clair et laisser l'élève réessayer
✗ Ne pas logger le student_text dans les logs console (données élève)
  → uniquement en base SQLite côté backend
✗ Ne pas oublier le nettoyage des balises markdown dans la réponse IA
  → l'IA peut ajouter ```json malgré la consigne
```

## Ce qu'il faut absolument faire

```
✓ Prompt système + utilisateur séparés et précis
✓ Nettoyage des balises markdown avant JSON.parse
✓ Gestion du flag "inappropriate" côté backend ET frontend
✓ Log complet dans ia_calls avec toutes les métadonnées 1min.ai
✓ Timeout de 30s sur l'appel httpx (l'IA peut être lente)
✓ Message de chargement pendant la correction ("✏️ Correction en cours...")
✓ Compteur de mots en temps réel avec min/max
✓ Tests unitaires ajoutés dans exerciseService.test.js
✓ answerGenerator mis à jour pour le type free_text
✓ Variable VITE_BACKEND_URL dans .env (pas en dur dans le code)
```

---

## Résumé des fichiers créés / modifiés

### Backend — nouveaux fichiers

```
backend/routers/ai_correction.py      ← nouveau router
```

### Backend — fichiers modifiés

```
backend/main.py                        ← inclure le nouveau router
backend/database.py                    ← ajouter table ia_calls
backend/.env                           ← ajouter ONEMIN_API_KEY + AI_MODEL
```

### Frontend — fichiers modifiés

```
src/components/exercise/types/FreeTextExercise.jsx   ← implémentation complète
src/services/exerciseService.js                      ← case free_text
src/components/exercise/ExerciseResult.jsx           ← points_reussis + a_ameliorer
src/debug/utils/answerGenerator.js                   ← case free_text debug
src/__tests__/exerciseService.test.js                ← tests free_text
.env                                                 ← VITE_BACKEND_URL
.env.local                                           ← VITE_BACKEND_URL local
```

### Fichiers non touchés

```
Tous les autres exercices
ExerciseEngine.jsx (free_text déjà enregistré au jalon 3)
contentService.js
Le parc SVG
Tous les écrans de navigation
```
