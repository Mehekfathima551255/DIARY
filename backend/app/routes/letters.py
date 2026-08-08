import random
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.memory import Memory
from app.schemas.letter_schema import LetterResponse
from app.ai.gemini_service import generate_letter_from_past

router = APIRouter(
    prefix="/letters",
    tags=["Letters From Your Past"]
)

@router.get("/random", response_model=LetterResponse)
def get_random_letter(
    exclude_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Fetch all memories for the user
    memories = db.query(Memory).filter(Memory.user_id == current_user.id).all()
    if not memories:
        raise HTTPException(status_code=404, detail="No memories found to create letters.")

    # Filter out exclude_id if we have other choices
    choice_memories = memories
    if exclude_id is not None and len(memories) > 1:
        choice_memories = [m for m in memories if m.id != exclude_id]

    # Calculate prioritization scores
    scored_memories = []
    now = datetime.utcnow()
    for m in choice_memories:
        # Age score: older memories get more priority. max 30 points for ~1 year (360 days)
        age_days = (now - m.created_at).days
        age_score = min(age_days / 12, 30.0)

        # Favorite status: +15 points
        favorite_score = 15.0 if m.favorite else 0.0

        # Has photo: +15 points
        photo_score = 15.0 if m.image_url else 0.0

        # Length score: +1 point per 50 characters, up to 20 points
        length_score = min(len(m.content or "") / 50, 20.0)

        # Base score of 1.0 to ensure a non-zero probability
        total_score = 1.0 + age_score + favorite_score + photo_score + length_score
        scored_memories.append((m, total_score))

    # Weighted random selection
    weights = [sm[1] for sm in scored_memories]
    selected_memory = random.choices([sm[0] for sm in scored_memories], weights=weights, k=1)[0]

    # Generate letter content using Gemini
    formatted_date = selected_memory.created_at.strftime("%B %d, %Y")
    
    try:
        letter_text = generate_letter_from_past(
            title=selected_memory.title,
            content=selected_memory.content,
            date=formatted_date,
            mood=selected_memory.mood,
            location=selected_memory.location,
            weather=selected_memory.weather,
            tags=selected_memory.tags
        )
    except Exception as e:
        # Fallback in case AI service fails
        letter_text = (
            f"Dear Me,\n\n"
            f"I wanted to look back on this day. You titled it '{selected_memory.title}'.\n\n"
            f"{selected_memory.content[:300]}...\n\n"
            f"Thinking of you,\nYour past self"
        )

    return LetterResponse(
        id=selected_memory.id,
        title=selected_memory.title,
        content=selected_memory.content,
        mood=selected_memory.mood,
        location=selected_memory.location,
        weather=selected_memory.weather,
        tags=selected_memory.tags,
        image_url=selected_memory.image_url,
        favorite=selected_memory.favorite,
        created_at=selected_memory.created_at,
        letter_content=letter_text
    )
