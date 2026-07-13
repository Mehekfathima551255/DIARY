from fastapi import APIRouter
from app.schemas.ai_schema import DiaryContent, AIResponse, AITagsResponse, AIMoodResponse
from app.ai.gemini_service import (
    summarize_entry,
    detect_mood,
    generate_title,
    generate_tags,
    improve_grammar
)

router = APIRouter(
    prefix="/ai",
    tags=["AI Features"]
)

@router.post("/summarize", response_model=AIResponse)
def get_ai_summary(entry: DiaryContent):
    summary = summarize_entry(entry.content)
    return AIResponse(result=summary)

@router.post("/mood", response_model=AIMoodResponse)
def get_ai_mood(entry: DiaryContent):
    mood = detect_mood(entry.content)
    return AIMoodResponse(mood=mood)

@router.post("/title", response_model=AIResponse)
def get_ai_title(entry: DiaryContent):
    title = generate_title(entry.content)
    return AIResponse(result=title)

@router.post("/tags", response_model=AITagsResponse)
def get_ai_tags(entry: DiaryContent):
    tags = generate_tags(entry.content)
    return AITagsResponse(tags=tags)

@router.post("/improve", response_model=AIResponse)
def get_ai_improve(entry: DiaryContent):
    improved = improve_grammar(entry.content)
    return AIResponse(result=improved)
