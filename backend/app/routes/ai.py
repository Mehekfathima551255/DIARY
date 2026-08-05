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
    title:    Optional[str] = ""
    content:  Optional[str] = ""
    mood:     Optional[str] = "Neutral"
    location: Optional[str] = ""
    weather:  Optional[str] = ""
    tags:     Optional[str] = ""
    date:     Optional[str] = ""


@router.post("/scrapbook", response_model=AIResponse)
def get_scrapbook_layout(req: ScrapbookRequest):
    import json, re
    from datetime import datetime

    try:
        raw = generate_scrapbook_layout(
            title=req.title    or "",
            content=req.content or "",
            mood=req.mood      or "Neutral",
            location=req.location or "",
            weather=req.weather   or "",
            tags=req.tags         or "",
            date=req.date         or datetime.utcnow().strftime("%B %d, %Y"),
        )
        cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw.strip())
        json.loads(cleaned)
        return AIResponse(result=cleaned)
    except Exception:
        from datetime import datetime
        fallback = json.dumps({
            "theme": "vintage_travel",
            "paper_bg": "aged_cream",
            "accent_colors": ["#C97B63", "#D7A73E", "#6B7B52", "#3F6389"],
            "page_title": req.title or "A Beautiful Memory",
            "caption": "moments worth keeping forever",
            "date_stamp": {"text": req.date or datetime.utcnow().strftime("%B %d, %Y"), "style": "vintage_ink"},
            "mood_badge": {"emoji": "✨", "label": req.mood or "Happy", "color": "#D7A73E"},
            "location_tag": {"text": req.location or "", "style": "postcard"},
            "weather_element": {"type": "sun", "label": req.weather or ""},
            "photos": [{"id": 1, "style": "polaroid", "x": 52, "y": 15, "width": 32, "rotation": 4, "caption": "cherished moment", "tape_color": "#D7A73E"}],
            "torn_papers": [
                {"id": 1, "color": "#F0E6C8", "x": 0, "y": 60, "width": 55, "height_rem": 8, "rotation": -2, "z_index": 2},
                {"id": 2, "color": "#E8DCC8", "x": 40, "y": 5, "width": 45, "height_rem": 6, "rotation": 3, "z_index": 1}
            ],
            "washi_tapes": [
                {"id": 1, "color": "#D7A73E", "opacity": 0.7, "pattern": "stripes", "orientation": "horizontal", "x": 5, "y": 3, "width_rem": 12},
                {"id": 2, "color": "#C97B63", "opacity": 0.65, "pattern": "dots", "orientation": "horizontal", "x": 60, "y": 8, "width_rem": 10}
            ],
            "stickers": [
                {"id": 1, "emoji": "🌿", "x": 8, "y": 75, "size_rem": 2.5, "rotation": -15, "label": ""},
                {"id": 2, "emoji": "✨", "x": 85, "y": 12, "size_rem": 2.0, "rotation": 10, "label": ""},
                {"id": 3, "emoji": "🎀", "x": 45, "y": 88, "size_rem": 2.2, "rotation": -8, "label": ""}
            ],
            "decorations": [
                {"id": 1, "type": "paper_clip", "x": 78, "y": 5, "scale": 1.0, "rotation": 5, "color": "#8B8579"},
                {"id": 2, "type": "pressed_flower", "x": 5, "y": 45, "scale": 1.2, "rotation": -20, "color": "#D89BA3"},
                {"id": 3, "type": "coffee_stain", "x": 70, "y": 70, "scale": 0.9, "rotation": 0, "color": "#C8A87A"}
            ],
            "handwritten_notes": [
                {"id": 1, "text": req.content[:80] if req.content else "a moment worth remembering", "x": 5, "y": 52, "width_rem": 16, "font_size_rem": 0.9, "color": "#5A554D", "rotation": -2, "style": "kalam_handwritten", "underline": False},
                {"id": 2, "text": "♡", "x": 82, "y": 82, "width_rem": 4, "font_size_rem": 2.0, "color": "#C97B63", "rotation": 5, "style": "cursive_italic", "underline": False}
            ],
            "background_texture": "light_grain"
        })
        return AIResponse(result=fallback)
