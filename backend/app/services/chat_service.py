from sqlalchemy.orm import Session
from app.models.memory import Memory
from app.ai.gemini_service import generate_diary_chat_response

def chat_with_diary(db: Session, user_id: int, query: str) -> str:
    # Fetch all memories (or a reasonable limit like 1000) for context
    memories = db.query(Memory).filter(Memory.user_id == user_id).order_by(Memory.created_at.desc()).limit(1000).all()
    
    if not memories:
        return "You haven't written any memories yet, so I don't have anything to search through!"
        
    memories_text = "\n\n".join([f"Date: {m.created_at.date()}\nContent: {m.content}" for m in memories])
    
    # Truncate to a safe limit just in case (e.g. 50,000 characters for Gemini Flash, though it can handle much more)
    memories_text = memories_text[:50000]
    
    return generate_diary_chat_response(query, memories_text)
