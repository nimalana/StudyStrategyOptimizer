from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import Optional

from .. import models, schemas
from ..database import get_db

router = APIRouter()


@router.post("/", response_model=schemas.PerformanceRecordResponse, status_code=201)
def create_record(record: schemas.PerformanceRecordCreate, db: Session = Depends(get_db)):
    db_record = models.PerformanceRecord(
        subject=record.subject,
        topic=record.topic,
        assessment_type=record.assessment_type,
        score=record.score,
        notes=record.notes,
        assessment_date=record.assessment_date or datetime.now(timezone.utc),
    )
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return db_record


@router.get("/", response_model=list[schemas.PerformanceRecordResponse])
def list_records(
    subject: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    query = db.query(models.PerformanceRecord)
    if subject:
        query = query.filter(models.PerformanceRecord.subject == subject)
    return query.order_by(models.PerformanceRecord.assessment_date.desc()).offset(skip).limit(limit).all()


@router.get("/{record_id}", response_model=schemas.PerformanceRecordResponse)
def get_record(record_id: int, db: Session = Depends(get_db)):
    record = db.query(models.PerformanceRecord).filter(models.PerformanceRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    return record


@router.delete("/{record_id}", status_code=204)
def delete_record(record_id: int, db: Session = Depends(get_db)):
    record = db.query(models.PerformanceRecord).filter(models.PerformanceRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    db.delete(record)
    db.commit()
