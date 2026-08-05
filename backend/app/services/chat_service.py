from sqlalchemy.orm import Session
from app.models.memory import Memory
from app.ai.gemini_service import generate_companion_chat_response
import json
import re

def chat_with_diary(db: Session, user_id: int, query: str) -> str:
    # Fetch all memories (or a reasonable limit like 1000) for context
    memories = db.query(Memory).filter(Memory.user_id == user_id).order_by(Memory.created_at.desc()).limit(1000).all()
    
    if not memories:
        # Return structured JSON fallback
        return json.dumps({
            "text": "You haven't written any memories yet, so I don't have anything to search through! Start writing your story, and I'll keep track of every detail.",
            "matched_dates": [],
            "timeline": []
        })
        
    memories_text_list = []
    for m in memories:
        clean_content = re.sub(r"<[^>]*>", "", m.content or "")
        mem_str = (
            f"Date: {m.created_at.date()}\n"
            f"Title: {m.title}\n"
            f"Mood: {m.mood or 'Neutral'}\n"
            f"Location: {m.location or ''}\n"
            f"Weather: {m.weather or ''}\n"
            f"Tags: {m.tags or ''}\n"
            f"Content: {clean_content}\n"
        )
        memories_text_list.append(mem_str)
        
    memories_text = "\n\n".join(memories_text_list)
    memories_text = memories_text[:50000]
    
    try:
        raw_json = generate_companion_chat_response(query, memories_text)
        # Validate parseability
        json.loads(raw_json)
        return raw_json
    except Exception:
        # Fallback to plain text wrapped in JSON
        try:
            from app.ai.gemini_service import generate_ai_response
            # Just generate a standard conversation response as fallback
            fallback_text = generate_ai_response(
                f"Answer the user query: '{query}' based on their memories context:\n{memories_text}\n"
                f"Keep your tone warm, friendly, and brief as a journal companion."
            )
            return json.dumps({
                "text": fallback_text,
                "matched_dates": [],
                "timeline": []
            })
        except Exception:
            return json.dumps({
                "text": "I ran into a small error reading your pages, but I'm here for you! What's on your mind?",
                "matched_dates": [],
                "timeline": []
            })

