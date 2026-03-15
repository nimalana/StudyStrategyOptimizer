from sqlalchemy.orm import Session
from .. import models
import pandas as pd
from typing import Any, Optional


def _sessions_df(db: Session, subject: Optional[str] = None) -> pd.DataFrame:
    sessions = db.query(models.StudySession).all()
    if not sessions:
        return pd.DataFrame()
    df = pd.DataFrame([{
        "subject": s.subject,
        "topic": s.topic,
        "study_method": s.study_method,
        "duration_minutes": s.duration_minutes,
        "difficulty": s.difficulty,
        "confidence_after": s.confidence_after,
        "session_date": s.session_date,
    } for s in sessions])
    if subject:
        df = df[df["subject"] == subject]
    return df


def _perf_df(db: Session, subject: Optional[str] = None) -> pd.DataFrame:
    records = db.query(models.PerformanceRecord).all()
    if not records:
        return pd.DataFrame()
    df = pd.DataFrame([{
        "subject": p.subject,
        "topic": p.topic,
        "assessment_type": p.assessment_type,
        "score": p.score,
        "assessment_date": p.assessment_date,
    } for p in records])
    if subject:
        df = df[df["subject"] == subject]
    return df


def get_method_effectiveness(db: Session, subject: Optional[str] = None) -> list[dict]:
    s_df = _sessions_df(db, subject)
    p_df = _perf_df(db, subject)
    if s_df.empty or p_df.empty:
        return []

    merged = s_df.merge(p_df, on="subject", how="inner")
    if merged.empty:
        return []

    result = (
        merged.groupby(["subject", "study_method"])
        .agg(
            avg_score=("score", "mean"),
            avg_confidence=("confidence_after", "mean"),
            total_sessions=("study_method", "count"),
            avg_duration=("duration_minutes", "mean"),
        )
        .reset_index()
    )
    result["avg_score"] = result["avg_score"].round(1)
    result["avg_confidence"] = result["avg_confidence"].round(1)
    result["avg_duration"] = result["avg_duration"].round(0)
    return result.to_dict("records")


def get_optimal_session_length(db: Session) -> "dict[str, Any]":
    s_df = _sessions_df(db)
    p_df = _perf_df(db)
    if s_df.empty or p_df.empty:
        return {}

    merged = s_df.merge(p_df, on="subject", how="inner")
    if merged.empty:
        return {}

    merged["duration_bucket"] = pd.cut(
        merged["duration_minutes"],
        bins=[0, 30, 60, 90, 120, 480],
        labels=["< 30 min", "30–60 min", "60–90 min", "90–120 min", "> 120 min"],
    )

    bucket_stats = (
        merged.groupby("duration_bucket", observed=True)
        .agg(avg_score=("score", "mean"), avg_confidence=("confidence_after", "mean"), count=("score", "count"))
        .reset_index()
    )
    bucket_stats["avg_score"] = bucket_stats["avg_score"].round(1)

    best = bucket_stats.loc[bucket_stats["avg_score"].idxmax()]
    return {
        "optimal_range": str(best["duration_bucket"]),
        "avg_score": float(best["avg_score"]),
        "buckets": bucket_stats.to_dict("records"),
    }


def get_subject_summary(db: Session) -> "list[dict]":
    s_df = _sessions_df(db)
    if s_df.empty:
        return []

    session_summary = (
        s_df.groupby("subject")
        .agg(
            total_study_time=("duration_minutes", "sum"),
            avg_session_length=("duration_minutes", "mean"),
            total_sessions=("subject", "count"),
            avg_confidence=("confidence_after", "mean"),
            top_method=("study_method", lambda x: x.mode().iloc[0] if len(x) > 0 else "N/A"),
        )
        .reset_index()
    )

    p_df = _perf_df(db)
    if not p_df.empty:
        perf_summary = (
            p_df.groupby("subject")
            .agg(avg_score=("score", "mean"), total_assessments=("score", "count"))
            .reset_index()
        )
        perf_summary["avg_score"] = perf_summary["avg_score"].round(1)
        summary = session_summary.merge(perf_summary, on="subject", how="left")
    else:
        summary = session_summary
        summary["avg_score"] = None
        summary["total_assessments"] = 0

    summary["avg_session_length"] = summary["avg_session_length"].round(0)
    summary["avg_confidence"] = summary["avg_confidence"].round(1)
    return summary.to_dict("records")


def get_recommendations(db: Session) -> "list[dict]":
    recommendations: list[dict] = []

    effectiveness = get_method_effectiveness(db)
    if effectiveness:
        eff_df = pd.DataFrame(effectiveness)
        best_methods = eff_df.loc[eff_df.groupby("subject")["avg_score"].idxmax()]
        for _, row in best_methods.iterrows():
            method_label = str(row["study_method"]).replace("_", " ").title()
            recommendations.append({
                "type": "method",
                "subject": row["subject"],
                "recommendation": f"Use {method_label} for {row['subject']}",
                "reason": f"Highest avg score of {row['avg_score']}% with this method",
                "priority": "high" if row["avg_score"] >= 80 else "medium",
            })

    optimal = get_optimal_session_length(db)
    if optimal.get("optimal_range"):
        recommendations.append({
            "type": "duration",
            "subject": "All subjects",
            "recommendation": f"Target {optimal['optimal_range']} study sessions",
            "reason": f"Sessions in this range correlate with a {optimal['avg_score']}% avg score",
            "priority": "medium",
        })

    # Low-confidence subjects → flag for review
    summary = get_subject_summary(db)
    for row in summary:
        if row.get("avg_confidence") and row["avg_confidence"] < 3:
            recommendations.append({
                "type": "review",
                "subject": row["subject"],
                "recommendation": f"Increase review frequency for {row['subject']}",
                "reason": f"Average confidence after sessions is only {row['avg_confidence']}/5",
                "priority": "high",
            })

    return recommendations
