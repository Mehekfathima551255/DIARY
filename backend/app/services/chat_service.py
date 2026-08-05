from sqlalchemy.orm import Session
from app.models.memory import Memory
from app.ai.gemini_service import generate_companion_chat_response
import json
import re
import logging

logger = logging.getLogger(__name__)

def clean_json_text(text: str) -> str:
    # Strip markdown code blocks
    cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", text.strip(), flags=re.IGNORECASE)
    return cleaned.strip()

def chat_with_diary(db: Session, user_id: int, query: str) -> str:
    # Fetch all memories (or a reasonable limit like 1000) for context
    memories = db.query(Memory).filter(Memory.user_id == user_id).order_by(Memory.created_at.desc()).limit(1000).all()
    
    if not memories:
        # Return structured JSON fallback
        return json.dumps({
            "text": "You haven't written any memories yet, so I don't have anything to search through! Start writing your story, and I'll keep track of every detail.",
            "matched_ids": [],
            "timeline": []
        })
        
    memories_text_list = []
    for m in memories:
        clean_content = re.sub(r"<[^>]*>", "", m.content or "")
        attachments = []
        if m.image_url:
            attachments.append("photo")
        if m.audio_url:
            attachments.append("audio recording")
        if m.doodle_url:
            attachments.append("doodle/drawing")
        attachment_str = ", ".join(attachments) if attachments else "none"

        mem_str = (
            f"[ID: {m.id}]\n"
            f"Date: {m.created_at.date()}\n"
            f"Title: {m.title}\n"
            f"Mood: {m.mood or 'Neutral'}\n"
            f"Location: {m.location or 'none'}\n"
            f"Weather: {m.weather or 'none'}\n"
            f"Tags: {m.tags or 'none'}\n"
            f"Attachments: {attachment_str}\n"
            f"Content: {clean_content}\n"
        )
        memories_text_list.append(mem_str)
        
    memories_text = "\n\n".join(memories_text_list)
    memories_text = memories_text[:50000]
    
    try:
        raw_json = generate_companion_chat_response(query, memories_text)
        cleaned = clean_json_text(raw_json)
        # Validate parseability
        data = json.loads(cleaned)
        # Ensure correct keys
        if "text" not in data:
            data["text"] = "Here is what I found in your journal."
        if "matched_ids" not in data:
            data["matched_ids"] = []
        if "timeline" not in data:
            data["timeline"] = []
        return json.dumps(data)
    except Exception as e:
        logger.exception("Error generating/parsing companion chat response: %s", str(e))
        # Fallback to plain text wrapped in JSON
        try:
            from app.ai.gemini_service import generate_ai_response
            prompt = (
                f"You are the user's friendly, warm diary companion. Help answer their query based on their memories below.\n\n"
                f"User Query: {query}\n\n"
                f"Diary context:\n{memories_text}\n\n"
                f"Keep your tone warm, supportive, and natural. Keep it under 2 paragraphs."
            )
            fallback_text = generate_ai_response(prompt)
            matched_ids = []
            for m in memories:
                if m.location and m.location.lower() in query.lower():
                    matched_ids.append(m.id)
                elif m.title and m.title.lower() in query.lower():
                    matched_ids.append(m.id)
                    
            return json.dumps({
                "text": fallback_text,
                "matched_ids": matched_ids,
                "timeline": []
            })
        except Exception as fe:
            logger.exception("Fallback generation failed: %s", str(fe))
            return json.dumps({
                "text": "I ran into a small error reading your pages, but I'm here for you! What's on your mind?",
                "matched_ids": [],
                "timeline": []
            })


