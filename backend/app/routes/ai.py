from fastapi import APIRouter
from app.schemas.ai_schema import DiaryContent, AIResponse, AITagsResponse, AIMoodResponse
from app.ai.gemini_service import (
    summarize_entry,
    detect_mood,
    generate_title,
    generate_tags,
    improve_grammar,
    generate_scrapbook_layout,
)
from pydantic import BaseModel
from typing import Optional

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


class ScrapbookRequest(BaseModel):
    title: Optional[str] = ""
    content: Optional[str] = ""
    mood: Optional[str] = "Neutral"
    location: Optional[str] = ""
    weather: Optional[str] = ""
    tags: Optional[str] = ""


@router.post("/scrapbook", response_model=AIResponse)
def get_scrapbook_layout(req: ScrapbookRequest):
    import json, re
    try:
        raw = generate_scrapbook_layout(
            title=req.title or "",
            content=req.content or "",
            mood=req.mood or "Neutral",
            location=req.location or "",
            weather=req.weather or "",
            tags=req.tags or "",
        )
        # Strip markdown code fences if present
        cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw.strip())
        # Validate it's parseable JSON
        json.loads(cleaned)
        return AIResponse(result=cleaned)
    except Exception as e:
        # Return a safe minimal fallback so the frontend always gets valid JSON
        fallback = json.dumps({
            "theme": "vintage",
            "paper_style": "cream-grid",
            "color_palette": ["#F5EBD9", "#C97B63", "#6B7B52", "#D7A73E", "#3F6389"],
            "title": req.title or "A Beautiful Memory",
            "stickers": [
                {"id": 1, "icon": "✨", "x": 120, "y": 80, "scale": 1.2, "rotation": -10, "type": "sparkle"},
                {"id": 2, "icon": "🌿", "x": 640, "y": 420, "scale": 1.0, "rotation": 15, "type": "leaf"}
            ],
            "decorations": [
                {"id": 1, "type": "paper_clip", "x": 680, "y": 60, "scale": 1.0, "rotation": 5}
            ],
            "washi_tapes": [
                {"id": 1, "x": 50, "y": 30, "width": 140, "height": 26, "rotation": -2, "color": "#D7A73E", "pattern": "stripes"}
            ],
            "text_elements": [
                {"id": 1, "text": "a moment to remember", "x": 200, "y": 490, "width": 220, "font": "handwritten", "size": "0.9rem", "color": "#5A554D", "rotation": -3}
            ]
        })
        return AIResponse(result=fallback)
