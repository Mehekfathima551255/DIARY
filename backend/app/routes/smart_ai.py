from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.ai_schema import AIResponse

from app.services.smart_ai_service import (
    get_weekly_reflection,
    get_monthly_reflection,
    get_mood_analysis,
    get_habit_detection,
    get_productivity_insights,
    get_ai_suggestions
)

router = APIRouter(
    prefix="/smart-ai",
    tags=["Smart AI Features"]
)

@router.get("/weekly-reflection", response_model=AIResponse)
def weekly_reflection(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    reflection = get_weekly_reflection(db, current_user.id)
    return AIResponse(result=reflection)

@router.get("/monthly-reflection", response_model=AIResponse)
def monthly_reflection(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    reflection = get_monthly_reflection(db, current_user.id)
    return AIResponse(result=reflection)

@router.get("/mood-analysis", response_model=AIResponse)
def mood_analysis(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    analysis = get_mood_analysis(db, current_user.id)
    return AIResponse(result=analysis)

@router.get("/habit-detection", response_model=AIResponse)
def habit_detection(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    habit = get_habit_detection(db, current_user.id)
    return AIResponse(result=habit)

@router.get("/productivity", response_model=AIResponse)
def productivity_insights(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    insights = get_productivity_insights(db, current_user.id)
    return AIResponse(result=insights)

@router.get("/suggestions", response_model=AIResponse)
def ai_suggestions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    suggestions = get_ai_suggestions(db, current_user.id)
    return AIResponse(result=suggestions)
