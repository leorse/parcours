from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime, date
from typing import Optional

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
    return round(current * 0.7 + new_score * weight * 0.3, 4)

# ── Modèles Pydantic ──────────────────────────────────────────────────────────

class StepProgressBody(BaseModel):
    token:      str
    step_id:    str
    course_id:  str
    subject_id: Optional[str] = None
    status:     str                      # in_progress | completed
    score:      Optional[float] = None

class ExerciseResultBody(BaseModel):
    token:          str
    exercise_id:    str
    course_id:      Optional[str] = None
    score:          float
    xp_earned:      int
    time_spent_sec: Optional[int] = None
    skills:         Optional[list] = []  # [{ tag, weight }]

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

        existing = session.query(UserProgress).filter_by(
            uid=uid, step_id=body.step_id
        ).first()

        if existing:
            if existing.status == "completed" and body.status == "in_progress":
                return {"status": "unchanged", "reason": "already_completed"}
            existing.status     = body.status
            existing.score      = body.score
            existing.updated_at = datetime.utcnow()
            if body.status == "completed":
                existing.completed_at = datetime.utcnow()
        else:
            session.add(UserProgress(
                uid          = uid,
                step_id      = body.step_id,
                course_id    = body.course_id,
                subject_id   = body.subject_id,
                status       = body.status,
                score        = body.score,
                completed_at = datetime.utcnow() if body.status == "completed" else None,
            ))

        session.commit()
        return {"status": "ok"}
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
            weight = float(skill.get("weight", 1.0))
            if not tag:
                continue

            existing = session.query(UserSkillScore).filter_by(
                uid=uid, skill_tag=tag
            ).first()

            if existing:
                existing.score        = calc_skill_score(existing.score, body.score, weight)
                existing.attempts    += 1
                existing.confidence   = calc_confidence(existing.attempts)
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
            "status":       "ok",
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
    user_data = verify_token(token)
    if user_data["uid"] != uid:
        raise HTTPException(status_code=403, detail="Accès refusé")

    session = Session()
    try:
        xp = get_or_create_xp(session, uid)
        return {"uid": uid, "total_xp": xp.total_xp, "level": xp.level}
    finally:
        session.close()

# ── Endpoints Skills ──────────────────────────────────────────────────────────

@router.get("/skills/{uid}")
def get_skills(uid: str, token: str):
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
    user_data = verify_token(token)
    if user_data["uid"] != uid:
        raise HTTPException(status_code=403, detail="Accès refusé")

    session = Session()
    try:
        badges = session.query(UserBadge).filter_by(uid=uid).all()
        return {
            "uid":    uid,
            "badges": [
                {"badge_id": b.badge_id, "earned_at": b.earned_at.isoformat()}
                for b in badges
            ]
        }
    finally:
        session.close()

@router.post("/badges/award")
def award_badge(body: BadgeBody):
    user_data = verify_token(body.token)
    uid = user_data["uid"]

    session = Session()
    try:
        existing = session.query(UserBadge).filter_by(uid=uid, badge_id=body.badge_id).first()
        if existing:
            return {"status": "already_earned"}

        session.add(UserBadge(uid=uid, badge_id=body.badge_id))
        session.commit()
        return {"status": "earned", "badge_id": body.badge_id}
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
            return {"current_streak": 1, "longest_streak": 1, "is_new_day": True}

        last = streak.last_active_date
        if last == today:
            return {
                "current_streak": streak.current_streak,
                "longest_streak": streak.longest_streak,
                "is_new_day":     False,
            }

        last_date  = date.fromisoformat(last)
        today_date = date.fromisoformat(today)
        gap = (today_date - last_date).days

        streak.current_streak  = streak.current_streak + 1 if gap == 1 else 1
        streak.longest_streak  = max(streak.longest_streak, streak.current_streak)
        streak.last_active_date = today

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
            return {"current_streak": 0, "longest_streak": 0}
        return {
            "current_streak":   streak.current_streak,
            "longest_streak":   streak.longest_streak,
            "last_active_date": streak.last_active_date,
        }
    finally:
        session.close()

# ── Endpoints Événements ──────────────────────────────────────────────────────

@router.post("/events/log")
def log_event(body: EventBody):
    user_data = verify_token(body.token)
    uid = user_data["uid"]

    session = Session()
    try:
        existing = session.query(UserEventHistory).filter_by(
            uid=uid, event_id=body.event_id
        ).first()
        if existing:
            return {"status": "already_triggered"}

        session.add(UserEventHistory(uid=uid, event_id=body.event_id))
        session.commit()
        return {"status": "logged"}
    finally:
        session.close()

@router.get("/events/{uid}")
def get_event_history(uid: str, token: str):
    user_data = verify_token(token)
    if user_data["uid"] != uid:
        raise HTTPException(status_code=403, detail="Accès refusé")

    session = Session()
    try:
        events = session.query(UserEventHistory).filter_by(uid=uid).all()
        return {"uid": uid, "events": [e.event_id for e in events]}
    finally:
        session.close()
