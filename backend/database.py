import os
from sqlalchemy import create_engine, Column, Integer, String, Text, Float, DateTime
from sqlalchemy.orm import DeclarativeBase, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./parcours.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
)
Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


class IACall(Base):
    __tablename__ = "ia_calls"

    id                = Column(Integer,  primary_key=True)
    created_at        = Column(DateTime, nullable=False)

    # Contexte
    user_id           = Column(String,   nullable=False, index=True)
    exercise_id       = Column(String,   nullable=False)
    course_id         = Column(String,   nullable=True)

    # Prompt
    prompt_system     = Column(Text,     nullable=True)
    prompt_user       = Column(Text,     nullable=True)
    student_text      = Column(Text,     nullable=True)
    prompt_length     = Column(Integer,  nullable=True)

    # Résultat IA
    score_returned    = Column(Float,    nullable=True)
    feedback_returned = Column(Text,     nullable=True)
    flag              = Column(String,   nullable=True)   # null | "inappropriate"
    response_raw      = Column(Text,     nullable=True)   # JSON brut 1min.ai

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


# Crée les tables au démarrage
Base.metadata.create_all(bind=engine)
