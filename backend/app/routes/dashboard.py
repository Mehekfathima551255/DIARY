from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User

from app.services.dashboard_service import (
    get_dashboard_stats,
    get_mood_distribution,
    get_top_tags,
    get_recent_memories,
    get_writing_streak,
    get_calendar_heatmap
)

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get("/stats")
def dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_dashboard_stats(
        db=db,
        user_id=current_user.id
    )


@router.get("/mood-chart")
def mood_chart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_mood_distribution(
        db=db,
        user_id=current_user.id
    )


@router.get("/top-tags")
def top_tags(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_top_tags(
        db=db,
        user_id=current_user.id
    )


@router.get("/recent")
def recent_memories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_recent_memories(
        db=db,
        user_id=current_user.id
    )


@router.get("/streak")
def writing_streak(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_writing_streak(
        db=db,
        user_id=current_user.id
    )


@router.get("/calendar")
def calendar_heatmap(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_calendar_heatmap(
        db=db,
        user_id=current_user.id
    )