from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import Optional

from .. import models, schemas
from ..database import get_db

router = APIRouter()


@router.post("/", response_model=schemas.StudySessionResponse, status_code=201)
def create_session(session: schemas.StudySessionCreate, db: Session = Depends(get_db)):
    db_session = models.StudySession(
        subject=session.subject,
        topic=session.topic,
        study_method=session.study_method,
        duration_minutes=session.duration_minutes,
        difficulty=session.difficulty,
        confidence_after=session.confidence_after,
        notes=session.notes,
        session_date=session.session_date or datetime.now(timezone.utc),
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session


@router.get("/", response_model=list[schemas.StudySessionResponse])
def list_sessions(
    subject: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    query = db.query(models.StudySession)
    if subject:
        query = query.filter(models.StudySession.subject == subject)
    return query.order_by(models.StudySession.session_date.desc()).offset(skip).limit(limit).all()


@router.get("/{session_id}", response_model=schemas.StudySessionResponse)
def get_session(session_id: int, db: Session = Depends(get_db)):
    session = db.query(models.StudySession).filter(models.StudySession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.delete("/{session_id}", status_code=204)
def delete_session(session_id: int, db: Session = Depends(get_db)):
    session = db.query(models.StudySession).filter(models.StudySession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    db.delete(session)
    db.commit()
