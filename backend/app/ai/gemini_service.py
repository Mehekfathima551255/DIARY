from google import genai
from app.core.config import GEMINI_API_KEY
from app.ai.prompts import (
    SUMMARIZE_PROMPT, MOOD_PROMPT, TITLE_PROMPT, TAGS_PROMPT, IMPROVE_PROMPT,
    WEEKLY_REFLECTION_PROMPT, MONTHLY_REFLECTION_PROMPT, MOOD_ANALYSIS_PROMPT,
    HABIT_DETECTION_PROMPT, PRODUCTIVITY_PROMPT, SUGGESTION_PROMPT,
    CHAT_WITH_DIARY_PROMPT, COMPANION_PROMPT
)

client = genai.Client(api_key=GEMINI_API_KEY)

MODEL_ID = "gemini-2.0-flash"

def generate_ai_response(prompt: str) -> str:
    response = client.models.generate_content(
        model=MODEL_ID,
        contents=prompt
    )
    return response.text.strip()

# --- Phase 4 AI Features ---

def summarize_entry(content: str) -> str:
    prompt = SUMMARIZE_PROMPT.format(content=content)
    return generate_ai_response(prompt)

def detect_mood(content: str) -> str:
    prompt = MOOD_PROMPT.format(content=content)
    return generate_ai_response(prompt)

def generate_title(content: str) -> str:
    prompt = TITLE_PROMPT.format(content=content)
    return generate_ai_response(prompt)

def generate_tags(content: str) -> list[str]:
    prompt = TAGS_PROMPT.format(content=content)
    result = generate_ai_response(prompt)
    tags = [tag.strip() for tag in result.split(",") if tag.strip()]
    return tags

def improve_grammar(content: str) -> str:
    prompt = IMPROVE_PROMPT.format(content=content)
    return generate_ai_response(prompt)

# --- Phase 5 Smart AI Features ---

def generate_weekly_reflection(memories_text: str) -> str:
    prompt = WEEKLY_REFLECTION_PROMPT.format(memories=memories_text)
    return generate_ai_response(prompt)

def generate_monthly_reflection(memories_text: str) -> str:
    prompt = MONTHLY_REFLECTION_PROMPT.format(memories=memories_text)
    return generate_ai_response(prompt)

def generate_mood_analysis(moods_text: str) -> str:
    prompt = MOOD_ANALYSIS_PROMPT.format(moods=moods_text)
    return generate_ai_response(prompt)

def generate_habit_detection(timestamps_text: str) -> str:
    prompt = HABIT_DETECTION_PROMPT.format(timestamps=timestamps_text)
    return generate_ai_response(prompt)

def generate_productivity_insights(data_text: str) -> str:
    prompt = PRODUCTIVITY_PROMPT.format(data=data_text)
    return generate_ai_response(prompt)

def generate_ai_suggestion(days_since_last: int, longest_streak: int, top_tag: str, focus: str) -> str:
    prompt = SUGGESTION_PROMPT.format(
        days_since_last=days_since_last,
        longest_streak=longest_streak,
        top_tag=top_tag,
        focus=focus
    )
    return generate_ai_response(prompt)

# --- Phase 6 Chat With Diary (RAG) ---

def generate_diary_chat_response(query: str, memories_text: str) -> str:
    prompt = CHAT_WITH_DIARY_PROMPT.format(query=query, memories=memories_text)
    return generate_ai_response(prompt)

# --- Quiet Companion ---

def generate_companion_message(context: str) -> str:
    prompt = COMPANION_PROMPT.format(context=context)
    return generate_ai_response(prompt)
