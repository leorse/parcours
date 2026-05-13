import os
from datetime import datetime
from sqlalchemy import (
    create_engine, Column, Integer, String, Text, Float, DateTime, Boolean
)
from sqlalchemy.orm import DeclarativeBase, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./parcours.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
)
Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


# ── Utilisateurs ──────────────────────────────────────────────────────────────

class User(Base):
    """
    Jalon 4b : créé automatiquement au premier appel avec un uid.
    Jalon 7  : uid = vrai uid Firebase.
    """
    __tablename__ = "users"
    uid          = Column(String,  primary_key=True)
    pseudo       = Column(String,  nullable=True)
    avatar       = Column(String,  nullable=True)
    role         = Column(String,  default="student")
    created_at   = Column(DateTime, default=datetime.utcnow)
    last_seen_at = Column(DateTime, default=datetime.utcnow)


# ── Progression ───────────────────────────────────────────────────────────────

class UserProgress(Base):
    __tablename__ = "user_progress"
    id           = Column(Integer, primary_key=True)
    uid          = Column(String,  nullable=False, index=True)
    step_id      = Column(String,  nullable=False)
    course_id    = Column(String,  nullable=False)
    subject_id   = Column(String,  nullable=True)
    status       = Column(String,  nullable=False)   # in_progress | completed
    score        = Column(Float,   nullable=True)
    completed_at = Column(DateTime, nullable=True)
    updated_at   = Column(DateTime, default=datetime.utcnow)


class UserExerciseHistory(Base):
    __tablename__ = "user_exercise_history"
    id             = Column(Integer, primary_key=True)
    uid            = Column(String,  nullable=False, index=True)
    exercise_id    = Column(String,  nullable=False)
    course_id      = Column(String,  nullable=True)
    result         = Column(String,  nullable=False)   # success | partial | fail
    score          = Column(Float,   nullable=False)
    xp_earned      = Column(Integer, nullable=False, default=0)
    time_spent_sec = Column(Integer, nullable=True)
    submitted_at   = Column(DateTime, default=datetime.utcnow)


# ── XP et niveaux ─────────────────────────────────────────────────────────────

class UserXP(Base):
    __tablename__ = "user_xp"
    uid        = Column(String,  primary_key=True)
    total_xp   = Column(Integer, default=0)
    level      = Column(Integer, default=1)
    updated_at = Column(DateTime, default=datetime.utcnow)


# ── Compétences ───────────────────────────────────────────────────────────────

class UserSkillScore(Base):
    __tablename__ = "user_skill_scores"
    id           = Column(Integer, primary_key=True)
    uid          = Column(String,  nullable=False, index=True)
    skill_tag    = Column(String,  nullable=False)
    score        = Column(Float,   default=0.0)
    attempts     = Column(Integer, default=0)
    confidence   = Column(String,  default="low")   # low | medium | high
    last_updated = Column(DateTime, default=datetime.utcnow)


# ── Badges et trophées ────────────────────────────────────────────────────────

class UserBadge(Base):
    __tablename__ = "user_badges"
    id        = Column(Integer, primary_key=True)
    uid       = Column(String,  nullable=False, index=True)
    badge_id  = Column(String,  nullable=False)
    earned_at = Column(DateTime, default=datetime.utcnow)


class UserTrophy(Base):
    __tablename__ = "user_trophies"
    id        = Column(Integer, primary_key=True)
    uid       = Column(String,  nullable=False, index=True)
    trophy_id = Column(String,  nullable=False)
    earned_at = Column(DateTime, default=datetime.utcnow)


# ── Streak ────────────────────────────────────────────────────────────────────

class UserStreak(Base):
    __tablename__ = "user_streaks"
    uid              = Column(String,  primary_key=True)
    current_streak   = Column(Integer, default=0)
    longest_streak   = Column(Integer, default=0)
    last_active_date = Column(String,  nullable=True)   # "2026-05-06" ISO date


# ── Événements déclenchés ─────────────────────────────────────────────────────

class UserEventHistory(Base):
    __tablename__ = "user_event_history"
    id           = Column(Integer, primary_key=True)
    uid          = Column(String,  nullable=False, index=True)
    event_id     = Column(String,  nullable=False)
    triggered_at = Column(DateTime, default=datetime.utcnow)


# ── Logs IA ───────────────────────────────────────────────────────────────────

class IACall(Base):
    __tablename__ = "ia_calls"

    id                = Column(Integer,  primary_key=True)
    created_at        = Column(DateTime, nullable=False)

    # Contexte
    user_id           = Column(String,   nullable=True, index=True)
    exercise_id       = Column(String,   nullable=True)
    course_id         = Column(String,   nullable=True)

    # Prompt
    prompt_system     = Column(Text,     nullable=True)
    prompt_user       = Column(Text,     nullable=True)
    student_text      = Column(Text,     nullable=True)
    prompt_length     = Column(Integer,  nullable=True)

    # Résultat IA
    score_returned    = Column(Float,    nullable=True)
    feedback_returned = Column(Text,     nullable=True)
    flag              = Column(String,   nullable=True)
    response_raw      = Column(Text,     nullable=True)

    # Métadonnées 1min.ai
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

    # Performance backend
    duration_ms       = Column(Integer,  nullable=True)


# Crée toutes les tables au démarrage
Base.metadata.create_all(bind=engine)
