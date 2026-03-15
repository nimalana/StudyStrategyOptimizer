from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class StudySessionCreate(BaseModel):
    subject: str
    topic: str
    study_method: str
    duration_minutes: int = Field(..., ge=1, le=480)
    difficulty: int = Field(..., ge=1, le=5)
    confidence_after: int = Field(..., ge=1, le=5)
    notes: Optional[str] = None
    session_date: Optional[datetime] = None


class StudySessionResponse(BaseModel):
    id: int
    subject: str
    topic: str
    study_method: str
    duration_minutes: int
    difficulty: int
    confidence_after: int
    notes: Optional[str]
    session_date: datetime
    created_at: datetime

    model_config = {"from_attributes": True}


class PerformanceRecordCreate(BaseModel):
    subject: str
    topic: Optional[str] = None
    assessment_type: str
    score: float = Field(..., ge=0, le=100)
    notes: Optional[str] = None
    assessment_date: Optional[datetime] = None


class PerformanceRecordResponse(BaseModel):
    id: int
    subject: str
    topic: Optional[str]
    assessment_type: str
    score: float
    notes: Optional[str]
    assessment_date: datetime
    created_at: datetime

    model_config = {"from_attributes": True}
