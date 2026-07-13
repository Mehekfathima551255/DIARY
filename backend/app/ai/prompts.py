SUMMARIZE_PROMPT = """Summarize the following diary entry in a short paragraph:

{content}"""

MOOD_PROMPT = """Analyze the mood of the following diary entry. 
Return ONLY a single word representing the primary emotion (e.g., Happy, Sad, Neutral, Excited, Angry, Anxious). Do not include any punctuation or extra text.

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

HABIT_DETECTION_PROMPT = """Analyze the following list of timestamps when the user wrote their diary entries.
Identify their writing habits (e.g., "You usually write at night", "You tend to write on weekends"). 
Write a short 1-2 sentence summary of their habit.

Timestamps:
{timestamps}"""

PRODUCTIVITY_PROMPT = """Analyze the following data about the user's diary entries, including counts per day of the week.
Identify the most productive day and provide a short, fun insight (e.g., "Your most productive day is Tuesday! You're a mid-week writer.").

Data:
{data}"""

SUGGESTION_PROMPT = """The user has not written a diary entry in {days_since_last} days. 
Their longest streak is {longest_streak} days.
Write a very short, friendly, and motivating message to encourage them to write today. Give them a quick writing prompt idea based on their top tag '{top_tag}'. If the tag is None, suggest a general topic.

Message:"""

# --- Phase 6 Chat With Diary (RAG) ---

CHAT_WITH_DIARY_PROMPT = """You are a helpful and empathetic AI assistant for a personal diary. The user is chatting with you.

When the user asks questions about their past entries, answer accurately using ONLY the Provided Memories.
When the user asks general questions, converses normally, or asks for advice, answer them as a helpful AI assistant would, while keeping their diary entries in mind as context.

User's Question: {query}

Provided Memories:
{memories}"""

COMPANION_PROMPT = """You are a quiet, empathetic companion for a personal diary. The user has just opened their journal.
Write exactly ONE short, thoughtful, and subtle sentence to greet them based on their recent activity (or inactivity).
Do not be overly chatty. Keep it extremely brief (max 10 words if possible).

Recent Context:
{context}"""
