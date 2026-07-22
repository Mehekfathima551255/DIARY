SUMMARIZE_PROMPT = """Summarize the following diary entry in a short paragraph:

{content}"""

MOOD_PROMPT = """Analyze the mood of the following diary entry. 
Return ONLY a single word representing the primary emotion (e.g., Happy, Sad, Neutral, Excited, Angry, Anxious, Love). Do not include any punctuation or extra text.

{content}"""

TITLE_PROMPT = """Generate a single catchy and meaningful title for the following diary entry. 
Do not use quotes or prefixes, just return the title itself.

{content}"""

TAGS_PROMPT = """Generate up to 5 relevant tags for the following diary entry. 
Return them as a comma-separated list without any prefixes or quotes.

{content}"""

IMPROVE_PROMPT = """Fix the grammar and improve the writing style of the following diary entry while keeping its original meaning and tone.

{content}"""

# --- Phase 5 Smart AI Prompts ---

WEEKLY_REFLECTION_PROMPT = """Based on the following diary entries from the past week, write a thoughtful, encouraging weekly reflection (1-2 paragraphs). 
Highlight the main themes, accomplishments, or recurring thoughts.

Memories:
{memories}"""

MONTHLY_REFLECTION_PROMPT = """Based on the following diary entries from the past month, write a comprehensive monthly reflection (2-3 paragraphs). 
Identify overarching themes, emotional growth, and major events. Provide a gentle, supportive tone.

Memories:
{memories}"""

MOOD_ANALYSIS_PROMPT = """Analyze the following list of moods recorded over the past 30 days.
Write a short paragraph summarizing the emotional trend, identifying any patterns (e.g., mostly positive, fluctuating, challenging period) and offer a brief word of encouragement.

Moods:
{moods}"""

HABIT_DETECTION_PROMPT = """Analyze the following list of local timestamps when the user wrote their diary entries.
Identify their writing habits (e.g., peak hours, days of the week, consistency).
Write a short, engaging 2-sentence summary of their habit.
Include a small unique observation or tip based on these patterns (e.g., "Your late-night entries suggest a deeply reflective wind-down routine" or "You love capturing mid-week moments!"). Do not be repetitive.

Timestamps:
{timestamps}"""

PRODUCTIVITY_PROMPT = """Analyze the following data about the user's diary entries, including counts per day of the week.
Identify the most productive day and provide a short, fun insight (e.g., "Your most productive day is Tuesday! You're a mid-week writer.").

Data:
{data}"""

SUGGESTION_PROMPT = """The user has not written a diary entry in {days_since_last} days (0 means they already wrote today).
Their longest writing streak is {longest_streak} days.
Their top journal tag is '{top_tag}'.
Today's dynamic inspiration focus is '{focus}'.

Write a short, friendly, and fresh 1-2 sentence suggestion or creative prompt for their journal.
If they wrote today (0 days), congratulate them warmly and suggest a light reflective question for tomorrow.
Otherwise, give them a motivating nudge and a writing prompt related to their top tag or today's focus. Do not include quotes.

Message:"""

# --- Phase 6 Chat With Diary (RAG) ---

CHAT_WITH_DIARY_PROMPT = """You are the user's personal diary companion — warm, friendly, and a little casual, like a close friend who has read all their journal entries. You remember everything they've written and genuinely care about their wellbeing.

Rules:
- Talk like a real friend, not a formal assistant. Use natural language, contractions, even light humor when appropriate.
- When asked about specific memories, answer using the provided diary entries. Be specific — mention actual dates, moods, or details from the entries.
- When nothing relevant is found in the entries, be honest and warm about it ("Hmm, I don't see anything about that in your journal yet!").
- Keep answers concise and human. Don't bullet-point everything — write in flowing sentences like you're texting a friend.
- Never say "Based on the provided memories" or "According to your entries" — just answer naturally.
- If they seem sad or stressed based on their entries, gently acknowledge it.

User asked: {query}

Their diary entries:
{memories}

Reply as their friendly diary companion:"""

COMPANION_PROMPT = """You are a quiet, empathetic companion for a personal diary. The user has just opened their journal.
Write exactly ONE short, thoughtful, and subtle sentence to greet them based on their recent activity (or inactivity).
Do not be overly chatty. Keep it extremely brief (max 10 words if possible).

Recent Context:
{context}"""
