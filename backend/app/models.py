from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from datetime import datetime, timezone
from .database import Base


class StudySession(Base):
    __tablename__ = "study_sessions"

    id = Column(Integer, primary_key=True, index=True)
    subject = Column(String, nullable=False)
    topic = Column(String, nullable=False)
    study_method = Column(String, nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    difficulty = Column(Integer, nullable=False)       # 1–5
    confidence_after = Column(Integer, nullable=False)  # 1–5
    notes = Column(Text, nullable=True)
    session_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class PerformanceRecord(Base):
    __tablename__ = "performance_records"

    id = Column(Integer, primary_key=True, index=True)
    subject = Column(String, nullable=False)
    topic = Column(String, nullable=True)
    assessment_type = Column(String, nullable=False)  # quiz, exam, assignment
    score = Column(Float, nullable=False)              # 0–100
    notes = Column(Text, nullable=True)
    assessment_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
