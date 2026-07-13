from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.chat_schema import ChatRequest
from app.schemas.ai_schema import AIResponse
from app.services.chat_service import chat_with_diary

router = APIRouter(
    prefix="/chat",
    tags=["Chat With Diary (RAG)"]
)

@router.post("/ask", response_model=AIResponse)
def ask_diary(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    response_text = chat_with_diary(db, current_user.id, request.query)
    return AIResponse(result=response_text)
