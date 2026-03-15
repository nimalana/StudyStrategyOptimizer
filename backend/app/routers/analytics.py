from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional

from ..database import get_db
from ..services import analytics_service

router = APIRouter()


@router.get("/method-effectiveness")
def method_effectiveness(subject: Optional[str] = None, db: Session = Depends(get_db)):
    return analytics_service.get_method_effectiveness(db, subject)


@router.get("/optimal-session-length")
def optimal_session_length(db: Session = Depends(get_db)):
    return analytics_service.get_optimal_session_length(db)


@router.get("/subject-summary")
def subject_summary(db: Session = Depends(get_db)):
    return analytics_service.get_subject_summary(db)


@router.get("/recommendations")
def recommendations(db: Session = Depends(get_db)):
    return analytics_service.get_recommendations(db)
