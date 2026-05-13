# Jalon 4b — Backend progression complet (fake user comme cobaye)
## Document technique pour Claude dans VS Code

---

## Objectif

Le jalon 4 a mis en place les fake users et la progression en localStorage.
Ce jalon branche tout sur un vrai backend FastAPI avec toutes les tables de
progression, skills, XP, badges, streaks.

Le fake user (`fake-student-01`) est traité exactement comme un vrai utilisateur.
Son uid est la clé dans toutes les tables. Le backend ne fait pas la différence.

**À la fin du jalon 4b :**
- Toutes les tables de progression existent en base (SQLite)
- Tous les endpoints de progression sont opérationnels
- `progressService.js` sync avec le backend (localStorage = cache)
- Le fake user accumule de vraies données en base
- Les logs ia_calls utilisent le vrai uid du fake user
- Tout est prêt pour le jalon 7 qui remplacera juste le token

**Ce qui ne change pas :** les écrans, les exercices, le parc SVG,
les composants, les tests existants.

---

## Auth temporaire côté backend

Pas de Firebase au jalon 4b. Le backend accepte les tokens fictifs
uniquement en mode `development` :

```python
# backend/auth.py

import os
from fastapi import HTTPException

def verify_token(token: str) -> dict:
    """
    Jalon 4b : accepte les fake tokens en mode development.
    Jalon 7  : remplace tout le corps par Firebase Admin SDK.
    ═══════════════════════════════════════════════════════
    JALON 7 — remplacer cette fonction par :
        decoded = firebase_admin.auth.verify_id_token(token)
        return { "uid": decoded["uid"], "fake": False }
    ═══════════════════════════════════════════════════════
    """
    env = os.getenv("ENV", "development")

    if env == "development" and token.startswith("fake-token-"):
        uid = token.replace("fake-token-", "")
        if not uid:
            raise HTTPException(status_code=401, detail="UID manquant dans le token fictif")
        return { "uid": uid, "fake": True }

    # En production : uniquement Firebase (activé au jalon 7)
    raise HTTPException(status_code=401, detail="Token invalide")
```

```bash
# backend/.env — ajouter
ENV=development
```

---

## Toutes les tables — backend/database.py

```python
# backend/database.py — version complète jalon 4b

from sqlalchemy import (
    create_engine, Column, String, Integer, Float,
    DateTime, Boolean, Text, ForeignKey
)
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime

engine = create_engine(
    "sqlite:///parcours.db",
    connect_args={"check_same_thread": False}
)
Base = declarative_base()
Session = sessionmaker(bind=engine)

# ── Utilisateurs ──────────────────────────────────────────────────────────────

class User(Base):
    """
    Jalon 4b : créé automatiquement au premier appel avec un uid.
    Jalon 7  : uid = vrai uid Firebase.
    """
    __tablename__ = "users"
    uid           = Column(String,  primary_key=True)
    pseudo        = Column(String,  nullable=True)
    avatar        = Column(String,  nullable=True)
    role          = Column(String,  default="student")  # student | admin
    created_at    = Column(DateTime, default=datetime.utcnow)
    last_seen_at  = Column(DateTime, default=datetime.utcnow)

# ── Progression ───────────────────────────────────────────────────────────────

class UserProgress(Base):
    """Une ligne par étape tentée par un utilisateur."""
    __tablename__ = "user_progress"
    id            = Column(Integer, primary_key=True)
    uid           = Column(String,  nullable=False, index=True)
    step_id       = Column(String,  nullable=False)
    course_id     = Column(String,  nullable=False)
    subject_id    = Column(String,  nullable=True)
    status        = Column(String,  nullable=False)  # in_progress | completed
    score         = Column(Float,   nullable=True)   # 0.0 à 1.0
    completed_at  = Column(DateTime, nullable=True)
    updated_at    = Column(DateTime, default=datetime.utcnow)

class UserExerciseHistory(Base):
    """Une ligne par exercice soumis."""
    __tablename__ = "user_exercise_history"
    id            = Column(Integer, primary_key=True)
    uid           = Column(String,  nullable=False, index=True)
    exercise_id   = Column(String,  nullable=False)
    course_id     = Column(String,  nullable=True)
    result        = Column(String,  nullable=False)  # success | partial | fail
    score         = Column(Float,   nullable=False)  # 0.0 à 1.0
    xp_earned     = Column(Integer, nullable=False, default=0)
    time_spent_sec= Column(Integer, nullable=True)
    submitted_at  = Column(DateTime, default=datetime.utcnow)

# ── XP et niveaux ─────────────────────────────────────────────────────────────

class UserXP(Base):
    """XP total et niveau courant de l'utilisateur."""
    __tablename__ = "user_xp"
    uid           = Column(String,  primary_key=True)
    total_xp      = Column(Integer, default=0)
    level         = Column(Integer, default=1)
    updated_at    = Column(DateTime, default=datetime.utcnow)

# ── Compétences ───────────────────────────────────────────────────────────────

class UserSkillScore(Base):
    """Score par compétence pour un utilisateur."""
    __tablename__ = "user_skill_scores"
    id            = Column(Integer, primary_key=True)
    uid           = Column(String,  nullable=False, index=True)
    skill_tag     = Column(String,  nullable=False)  # ex: "fraction/addition"
    score         = Column(Float,   default=0.0)     # 0.0 à 1.0
    attempts      = Column(Integer, default=0)
    confidence    = Column(String,  default="low")   # low | medium | high
    last_updated  = Column(DateTime, default=datetime.utcnow)

# ── Badges et trophées ────────────────────────────────────────────────────────

class UserBadge(Base):
    """Badges obtenus par un utilisateur."""
    __tablename__ = "user_badges"
    id            = Column(Integer, primary_key=True)
    uid           = Column(String,  nullable=False, index=True)
    badge_id      = Column(String,  nullable=False)
    earned_at     = Column(DateTime, default=datetime.utcnow)

class UserTrophy(Base):
    """Trophées obtenus par un utilisateur."""
    __tablename__ = "user_trophies"
    id            = Column(Integer, primary_key=True)
    uid           = Column(String,  nullable=False, index=True)
    trophy_id     = Column(String,  nullable=False)
    earned_at     = Column(DateTime, default=datetime.utcnow)

# ── Streak ────────────────────────────────────────────────────────────────────

class UserStreak(Base):
    """Suivi des jours consécutifs de connexion."""
    __tablename__ = "user_streaks"
    uid              = Column(String,  primary_key=True)
    current_streak   = Column(Integer, default=0)
    longest_streak   = Column(Integer, default=0)
    last_active_date = Column(String,  nullable=True)  # "2026-05-06" ISO date

# ── Événements déclenchés ─────────────────────────────────────────────────────

class UserEventHistory(Base):
    """Événements déjà déclenchés (pour éviter les doublons)."""
    __tablename__ = "user_event_history"
    id            = Column(Integer, primary_key=True)
    uid           = Column(String,  nullable=False, index=True)
    event_id      = Column(String,  nullable=False)
    triggered_at  = Column(DateTime, default=datetime.utcnow)

# ── Logs IA ───────────────────────────────────────────────────────────────────

class IACall(Base):
    """Log de chaque appel à l'IA (déjà existant depuis jalon 3quater)."""
    __tablename__ = "ia_calls"
    id                = Column(Integer,  primary_key=True)
    created_at        = Column(DateTime, nullable=False)
    uid               = Column(String,   nullable=True, index=True)
    exercise_id       = Column(String,   nullable=True)
    course_id         = Column(String,   nullable=True)
    prompt_system     = Column(Text,     nullable=True)
    prompt_user       = Column(Text,     nullable=True)
    student_text      = Column(Text,     nullable=True)
    prompt_length     = Column(Integer,  nullable=True)
    score_returned    = Column(Float,    nullable=True)
    feedback_returned = Column(Text,     nullable=True)
    flag              = Column(String,   nullable=True)
    response_raw      = Column(Text,     nullable=True)
    onemin_uuid       = Column(String,   nullable=True)
    model_used        = Column(String,   nullable=True)
    onemin_status     = Column(String,   nullable=True)
    tokens_input      = Column(Integer,  nullable=True)
    tokens_output     = Column(Integer,  nullable=True)
    tokens_total      = Column(Integer,  nullable=True)
    credit_input      = Column(Integer,  nullable=True)
    credit_output     = Column(Integer,  nullable=True)
    credit_total      = Column(Integer,  nullable=True)
    execution_time_ai = Column(Float,    nullable=True)
    duration_ms       = Column(Integer,  nullable=True)

# Créer toutes les tables
Base.metadata.create_all(engine)
```

---

## Tous les endpoints — backend/routers/progress.py

```python
# backend/routers/progress.py

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from datetime import datetime, date
from typing import Optional
from sqlalchemy.orm import Session as DBSession

from ..database import (
    Session, User, UserProgress, UserExerciseHistory,
    UserXP, UserSkillScore, UserBadge, UserStreak, UserEventHistory
)
from ..auth import verify_token

router = APIRouter(prefix="/api", tags=["progress"])

# ── Helpers ───────────────────────────────────────────────────────────────────

def get_or_create_user(session, uid: str, pseudo: str = None) -> User:
    user = session.query(User).filter_by(uid=uid).first()
    if not user:
        user = User(uid=uid, pseudo=pseudo or uid, created_at=datetime.utcnow())
        session.add(user)
    user.last_seen_at = datetime.utcnow()
    session.commit()
    return user

def get_or_create_xp(session, uid: str) -> UserXP:
    xp = session.query(UserXP).filter_by(uid=uid).first()
    if not xp:
        xp = UserXP(uid=uid, total_xp=0, level=1)
        session.add(xp)
        session.commit()
    return xp

def calc_level(total_xp: int) -> int:
    """Calcule le niveau depuis l'XP total. Remplacé au jalon 5 par levels.yaml"""
    thresholds = [0, 100, 300, 600, 1000, 1500, 2200, 3000]
    level = 1
    for i, threshold in enumerate(thresholds):
        if total_xp >= threshold:
            level = i + 1
    return level

def calc_confidence(attempts: int) -> str:
    if attempts < 3:  return "low"
    if attempts < 8:  return "medium"
    return "high"

def calc_skill_score(current: float, new_score: float, weight: float) -> float:
    """Moyenne glissante pondérée — les derniers résultats comptent plus."""
    weighted = new_score * weight
    return round(current * 0.7 + weighted * 0.3, 4)

# ── Modèles Pydantic ──────────────────────────────────────────────────────────

class AuthHeader(BaseModel):
    token: str

class StepProgressBody(BaseModel):
    token:      str
    step_id:    str
    course_id:  str
    subject_id: Optional[str] = None
    status:     str            # in_progress | completed
    score:      Optional[float] = None

class ExerciseResultBody(BaseModel):
    token:       str
    exercise_id: str
    course_id:   Optional[str] = None
    score:       float          # 0.0 à 1.0
    xp_earned:   int
    time_spent_sec: Optional[int] = None
    skills:      Optional[list] = []  # [{ tag, weight }]

class BadgeBody(BaseModel):
    token:    str
    badge_id: str

class EventBody(BaseModel):
    token:    str
    event_id: str

class StreakCheckBody(BaseModel):
    token: str

# ── Endpoints progression ─────────────────────────────────────────────────────

@router.post("/progress/step")
def save_step_progress(body: StepProgressBody):
    """Marque une étape comme in_progress ou completed."""
    user_data = verify_token(body.token)
    uid = user_data["uid"]

    session = Session()
    try:
        get_or_create_user(session, uid)

        # Upsert — mettre à jour si existe, créer sinon
        existing = session.query(UserProgress).filter_by(
            uid=uid, step_id=body.step_id
        ).first()

        if existing:
            # Ne pas rétrograder completed → in_progress
            if existing.status == "completed" and body.status == "in_progress":
                return { "status": "unchanged", "reason": "already_completed" }
            existing.status     = body.status
            existing.score      = body.score
            existing.updated_at = datetime.utcnow()
            if body.status == "completed":
                existing.completed_at = datetime.utcnow()
        else:
            session.add(UserProgress(
                uid        = uid,
                step_id    = body.step_id,
                course_id  = body.course_id,
                subject_id = body.subject_id,
                status     = body.status,
                score      = body.score,
                completed_at = datetime.utcnow() if body.status == "completed" else None,
            ))

        session.commit()
        return { "status": "ok" }
    finally:
        session.close()


@router.post("/progress/exercise")
def save_exercise_result(body: ExerciseResultBody):
    """Sauvegarde le résultat d'un exercice + met à jour XP et skills."""
    user_data = verify_token(body.token)
    uid = user_data["uid"]

    session = Session()
    try:
        get_or_create_user(session, uid)

        result_label = (
            "success" if body.score >= 0.8 else
            "partial" if body.score >= 0.5 else
            "fail"
        )

        # 1. Historique exercice
        session.add(UserExerciseHistory(
            uid            = uid,
            exercise_id    = body.exercise_id,
            course_id      = body.course_id,
            result         = result_label,
            score          = body.score,
            xp_earned      = body.xp_earned,
            time_spent_sec = body.time_spent_sec,
        ))

        # 2. XP
        xp_record = get_or_create_xp(session, uid)
        xp_record.total_xp  += body.xp_earned
        xp_record.level      = calc_level(xp_record.total_xp)
        xp_record.updated_at = datetime.utcnow()

        # 3. Skills
        for skill in (body.skills or []):
            tag    = skill.get("tag")
            weight = skill.get("weight", 1.0)
            if not tag:
                continue

            existing = session.query(UserSkillScore).filter_by(
                uid=uid, skill_tag=tag
            ).first()

            if existing:
                existing.score       = calc_skill_score(existing.score, body.score, weight)
                existing.attempts   += 1
                existing.confidence  = calc_confidence(existing.attempts)
                existing.last_updated = datetime.utcnow()
            else:
                session.add(UserSkillScore(
                    uid        = uid,
                    skill_tag  = tag,
                    score      = round(body.score * weight * 0.3, 4),
                    attempts   = 1,
                    confidence = "low",
                ))

        session.commit()
        return {
            "status":    "ok",
            "new_total_xp": xp_record.total_xp,
            "new_level":    xp_record.level,
        }
    finally:
        session.close()


@router.get("/progress/{uid}")
def get_progress(uid: str, token: str):
    """Retourne toute la progression d'un utilisateur."""
    user_data = verify_token(token)
    if user_data["uid"] != uid:
        raise HTTPException(status_code=403, detail="Accès refusé")

    session = Session()
    try:
        steps = session.query(UserProgress).filter_by(uid=uid).all()
        return {
            "uid":   uid,
            "steps": [
                {
                    "step_id":      s.step_id,
                    "course_id":    s.course_id,
                    "status":       s.status,
                    "score":        s.score,
                    "completed_at": s.completed_at.isoformat() if s.completed_at else None,
                }
                for s in steps
            ]
        }
    finally:
        session.close()

# ── Endpoints XP ──────────────────────────────────────────────────────────────

@router.get("/xp/{uid}")
def get_xp(uid: str, token: str):
    """Retourne l'XP total et le niveau."""
    user_data = verify_token(token)
    if user_data["uid"] != uid:
        raise HTTPException(status_code=403, detail="Accès refusé")

    session = Session()
    try:
        xp = get_or_create_xp(session, uid)
        return {
            "uid":      uid,
            "total_xp": xp.total_xp,
            "level":    xp.level,
        }
    finally:
        session.close()

# ── Endpoints Skills ──────────────────────────────────────────────────────────

@router.get("/skills/{uid}")
def get_skills(uid: str, token: str):
    """Retourne tous les scores de compétences."""
    user_data = verify_token(token)
    if user_data["uid"] != uid:
        raise HTTPException(status_code=403, detail="Accès refusé")

    session = Session()
    try:
        skills = session.query(UserSkillScore).filter_by(uid=uid).all()
        return {
            "uid":    uid,
            "skills": [
                {
                    "skill_tag":  s.skill_tag,
                    "score":      s.score,
                    "attempts":   s.attempts,
                    "confidence": s.confidence,
                }
                for s in skills
            ]
        }
    finally:
        session.close()

# ── Endpoints Badges ──────────────────────────────────────────────────────────

@router.get("/badges/{uid}")
def get_badges(uid: str, token: str):
    """Retourne les badges obtenus."""
    user_data = verify_token(token)
    if user_data["uid"] != uid:
        raise HTTPException(status_code=403, detail="Accès refusé")

    session = Session()
    try:
        badges = session.query(UserBadge).filter_by(uid=uid).all()
        return {
            "uid":    uid,
            "badges": [
                { "badge_id": b.badge_id, "earned_at": b.earned_at.isoformat() }
                for b in badges
            ]
        }
    finally:
        session.close()

@router.post("/badges/award")
def award_badge(body: BadgeBody):
    """Débloque un badge pour un utilisateur (si pas déjà obtenu)."""
    user_data = verify_token(body.token)
    uid = user_data["uid"]

    session = Session()
    try:
        existing = session.query(UserBadge).filter_by(
            uid=uid, badge_id=body.badge_id
        ).first()
        if existing:
            return { "status": "already_earned" }

        session.add(UserBadge(uid=uid, badge_id=body.badge_id))
        session.commit()
        return { "status": "earned", "badge_id": body.badge_id }
    finally:
        session.close()

# ── Endpoints Streak ──────────────────────────────────────────────────────────

@router.post("/streak/check")
def check_streak(body: StreakCheckBody):
    """
    Vérifie et met à jour le streak au lancement de l'app.
    À appeler une seule fois par jour au démarrage.
    """
    user_data = verify_token(body.token)
    uid = user_data["uid"]
    today = date.today().isoformat()

    session = Session()
    try:
        streak = session.query(UserStreak).filter_by(uid=uid).first()
        if not streak:
            streak = UserStreak(uid=uid, current_streak=1, longest_streak=1,
                                last_active_date=today)
            session.add(streak)
            session.commit()
            return { "current_streak": 1, "longest_streak": 1, "is_new_day": True }

        last = streak.last_active_date
        if last == today:
            # Déjà vérifié aujourd'hui
            return {
                "current_streak": streak.current_streak,
                "longest_streak": streak.longest_streak,
                "is_new_day":     False,
            }

        # Calculer le gap en jours
        last_date  = date.fromisoformat(last)
        today_date = date.fromisoformat(today)
        gap = (today_date - last_date).days

        if gap == 1:
            # Jour consécutif → streak continue
            streak.current_streak  += 1
        else:
            # Gap > 1 → streak repart à 1
            streak.current_streak   = 1

        streak.longest_streak    = max(streak.longest_streak, streak.current_streak)
        streak.last_active_date  = today

        session.commit()
        return {
            "current_streak": streak.current_streak,
            "longest_streak": streak.longest_streak,
            "is_new_day":     True,
            "gap_days":       gap,
        }
    finally:
        session.close()

@router.get("/streak/{uid}")
def get_streak(uid: str, token: str):
    user_data = verify_token(token)
    if user_data["uid"] != uid:
        raise HTTPException(status_code=403, detail="Accès refusé")

    session = Session()
    try:
        streak = session.query(UserStreak).filter_by(uid=uid).first()
        if not streak:
            return { "current_streak": 0, "longest_streak": 0 }
        return {
            "current_streak": streak.current_streak,
            "longest_streak": streak.longest_streak,
            "last_active_date": streak.last_active_date,
        }
    finally:
        session.close()

# ── Endpoints Événements ──────────────────────────────────────────────────────

@router.post("/events/log")
def log_event(body: EventBody):
    """Enregistre qu'un événement a été déclenché (pour éviter les doublons)."""
    user_data = verify_token(body.token)
    uid = user_data["uid"]

    session = Session()
    try:
        existing = session.query(UserEventHistory).filter_by(
            uid=uid, event_id=body.event_id
        ).first()
        if existing:
            return { "status": "already_triggered" }

        session.add(UserEventHistory(uid=uid, event_id=body.event_id))
        session.commit()
        return { "status": "logged" }
    finally:
        session.close()

@router.get("/events/{uid}")
def get_event_history(uid: str, token: str):
    """Retourne les événements déjà déclenchés."""
    user_data = verify_token(token)
    if user_data["uid"] != uid:
        raise HTTPException(status_code=403, detail="Accès refusé")

    session = Session()
    try:
        events = session.query(UserEventHistory).filter_by(uid=uid).all()
        return {
            "uid":    uid,
            "events": [e.event_id for e in events]
        }
    finally:
        session.close()
```

---

## Mise à jour main.py

```python
# backend/main.py — inclure le nouveau router

from routers import progress, ai_correction

app.include_router(progress.router)
app.include_router(ai_correction.router)
```

---

## Mise à jour progressService.js côté React

```js
// src/services/progressService.js
// Jalon 4b : sync backend en plus du localStorage
// Jalon 7  : remplacer getFirebaseToken() par le vrai token Firebase

import { getFirebaseToken } from './profileService'

const BACKEND = import.meta.env.VITE_BACKEND_URL

// ── Helper appel backend ──────────────────────────────────────────────────────

async function backendPost(path, body) {
  try {
    const token = await getFirebaseToken()
    const res = await fetch(`${BACKEND}${path}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ ...body, token }),
    })
    if (!res.ok) throw new Error(`Backend error ${res.status}`)
    return await res.json()
  } catch (e) {
    // Silencieux — le localStorage reste la source de vérité
    console.warn(`[progressService] Sync backend échoué (${path}) :`, e.message)
    return null
  }
}

async function backendGet(path) {
  try {
    const token = await getFirebaseToken()
    const res = await fetch(`${BACKEND}${path}?token=${token}`)
    if (!res.ok) throw new Error(`Backend error ${res.status}`)
    return await res.json()
  } catch (e) {
    console.warn(`[progressService] GET backend échoué (${path}) :`, e.message)
    return null
  }
}

// ── markStepComplete ──────────────────────────────────────────────────────────

export async function markStepComplete(userId, stepId, score, courseStructure) {
  const progress = loadProgress(userId)

  progress[stepId] = {
    status:      'completed',
    score,
    completedAt: new Date().toISOString(),
  }

  // Déverrouiller l'étape suivante
  const nextStep = findNextStep(stepId, courseStructure)
  if (nextStep && !progress[nextStep.id]) {
    progress[nextStep.id] = { status: 'in_progress' }
  }

  saveProgress(userId, progress)

  // Sync backend (fire and forget — pas de await bloquant)
  backendPost('/api/progress/step', {
    step_id:   stepId,
    course_id: courseStructure?.id ?? 'unknown',
    status:    'completed',
    score,
  })
}

// ── saveExerciseResult ────────────────────────────────────────────────────────

export async function saveExerciseResult(userId, exerciseId, result) {
  // result = { score, xpEarned, correct, skills: [{ tag, weight }] }
  const progress = loadProgress(userId)
  if (!progress.__exercises) progress.__exercises = {}
  progress.__exercises[exerciseId] = {
    ...result,
    submittedAt: new Date().toISOString(),
  }
  saveProgress(userId, progress)

  // Sync backend
  backendPost('/api/progress/exercise', {
    exercise_id: exerciseId,
    score:       result.score,
    xp_earned:   result.xpEarned ?? 0,
    skills:      result.skills   ?? [],
    time_spent_sec: result.timeSpentSec ?? null,
  })
}

// ── checkStreak ───────────────────────────────────────────────────────────────

export async function checkStreak() {
  return backendPost('/api/streak/check', {})
}

// ── logEvent ──────────────────────────────────────────────────────────────────

export async function logEvent(eventId) {
  return backendPost('/api/events/log', { event_id: eventId })
}

// ── Hydratation depuis le backend au démarrage ────────────────────────────────

export async function hydrateFromBackend(userId) {
  /**
   * Au démarrage, récupère la progression du backend
   * et l'écrit dans localStorage.
   * Utile si l'élève change d'appareil.
   * Jalon 7 : appelé après authentification Firebase.
   */
  const data = await backendGet(`/api/progress/${userId}`)
  if (!data?.steps) return

  const progress = loadProgress(userId)
  data.steps.forEach(step => {
    // Ne pas écraser des données locales plus récentes
    if (!progress[step.step_id]) {
      progress[step.step_id] = {
        status:      step.status,
        score:       step.score,
        completedAt: step.completed_at,
      }
    }
  })
  saveProgress(userId, progress)
}

// ── Reste des fonctions inchangées ────────────────────────────────────────────
// (getStepStatus, getStepScore, getCourseProgress, markStepInProgress,
//  resetProgress, getAllProgress, loadProgress, saveProgress, findNextStep)
// → copier depuis progressService.js du jalon 4
```

---

## Mise à jour scoreService.js

```js
// src/services/scoreService.js
// saveResult envoie maintenant les skills au backend

import { saveExerciseResult } from './progressService'
import { getCurrentUser }     from './profileService'

export async function saveResult(exerciseId, result, userId) {
  const uid = userId ?? getCurrentUser()?.uid
  if (!uid) return

  await saveExerciseResult(uid, exerciseId, {
    score:       result.score,
    xpEarned:    result.xpEarned,
    correct:     result.correct,
    skills:      result.skills ?? [],      // ← transmis au backend
    timeSpentSec: result.timeSpentSec ?? null,
  })
}
```

---

## Appel à checkStreak au démarrage

```jsx
// src/screens/Splash/SplashScreen.jsx — ajouter après chargement du profil

import { checkStreak } from '../../services/progressService'
import { useProfile }  from '../../hooks/useProfile'

useEffect(() => {
  if (user?.uid) {
    checkStreak()   // fire and forget — met à jour le streak du jour
  }
}, [user?.uid])
```

---

## Variables d'environnement

```bash
# backend/.env — ajouter
ENV=development

# frontend .env.local — déjà présent depuis jalon 3quater
VITE_BACKEND_URL=http://localhost:8000
```

---

## Ce qu'il ne faut PAS faire

```
✗ Ne pas bloquer l'UI en attendant la réponse du backend
  → tous les appels backend sont fire and forget (pas de await bloquant)
  → localStorage reste la source de vérité pour l'affichage
✗ Ne pas faire échouer l'app si le backend est injoignable
  → backendPost attrape toutes les erreurs silencieusement
✗ Ne pas vérifier isAdmin côté backend
  → le backend traite tous les uids de la même façon
✗ Ne pas changer l'interface de useProgress ou useProfile
  → jalon 7 ready
```

## Ce qu'il faut absolument faire

```
✓ Toutes les tables créées dans parcours.db au démarrage
✓ verify_token accepte les fake tokens en mode development
✓ Commentaires JALON 7 dans auth.py et progressService.js
✓ backendPost silencieux — jamais d'erreur visible utilisateur
✓ checkStreak appelé au démarrage depuis SplashScreen
✓ saveExerciseResult transmet les skills au backend
✓ hydrateFromBackend prévu (même si pas appelé au jalon 4b)
✓ Tester avec le fake user : compléter un exercice → vérifier
  dans parcours.db que les lignes sont bien créées
```

---

## Résumé des fichiers créés / modifiés

### Backend — nouveaux fichiers

```
backend/auth.py                     ← vérification token (fake + jalon 7 ready)
backend/routers/progress.py         ← tous les endpoints progression
```

### Backend — fichiers modifiés

```
backend/database.py                 ← toutes les tables ajoutées
backend/main.py                     ← inclusion du router progress
backend/.env                        ← ajout ENV=development
```

### Frontend — fichiers modifiés

```
src/services/progressService.js     ← sync backend ajoutée
src/services/scoreService.js        ← skills transmis au backend
src/screens/Splash/SplashScreen.jsx ← checkStreak au démarrage
```

### Fichiers non touchés

```
Tous les écrans de navigation
Tous les composants d'exercices
useProfile.js / useProgress.js
profileService.js
AppContext.jsx
Le parc SVG
Les tests existants
```
