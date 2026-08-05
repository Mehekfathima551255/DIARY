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

SCRAPBOOK_PROMPT = """Analyze the following diary memory and generate a beautiful, context-aware digital scrapbook page layout.
Title: {title}
Mood: {mood}
Location: {location}
Weather: {weather}
Tags: {tags}
Content: {content}

Based on this content, return a JSON object with:
1. "theme": Choose from "vintage", "minimalist", "travel", "magazine", "junk_journal", "botanical", "watercolor", "cozy".
2. "paper_style": Choose a suitable paper style ("cream-grid", "aged-parchment", "ruled-notebook", "kraft-brown", "pink-floral", "blue-watercolor", "green-linen").
3. "color_palette": An array of 5 hex colors that coordinate with the theme and details (e.g. ocean colors for beach, earthy colors for hiking).
4. "title": A beautiful AI-generated title for the scrapbook page.
5. "stickers": An array of up to 6 custom stickers representing elements from the text (e.g. 🍰, 🎈, 🏖️, ☕, 🌿, ✈️, 🏕️, 🍂). Each sticker object must have:
   - "id": unique integer
   - "icon": emoji or symbol
   - "x": integer (between 50 and 750)
   - "y": integer (between 50 and 550)
   - "scale": float (between 0.8 and 1.5)
   - "rotation": integer (between -45 and 45 degrees)
   - "type": string description (e.g., "coffee", "leaf")
6. "decorations": An array of up to 4 elements of type "coffee_stain", "paper_clip", "pressed_flower", "travel_stamp", "weather_stamp" with layout fields:
   - "id": unique integer
   - "type": string
   - "x": integer (50 to 750)
   - "y": integer (50 to 550)
   - "scale": float (0.8 to 1.5)
   - "rotation": integer (-45 to 45)
7. "washi_tapes": An array of up to 3 washi tape segments:
   - "id": unique integer
   - "x": integer
   - "y": integer
   - "width": integer (80 to 160)
   - "height": integer (20 to 35)
   - "rotation": integer
   - "color": hex color
   - "pattern": "solid" | "stripes" | "dots" | "floral"
8. "text_elements": An array of 1 or 2 small handwritten notes, quotes, or annotations:
   - "id": unique integer
   - "text": string content
   - "x": integer (50 to 650)
   - "y": integer (100 to 500)
   - "width": integer (150 to 300)
   - "font": "handwritten" | "serif" | "cursive"
   - "size": string (e.g. "0.9rem")
   - "color": hex color
   - "rotation": integer (-10 to 10)

IMPORTANT: The response MUST be ONLY valid JSON. Return ONLY the raw JSON string.

JSON:"""

COMPANION_CHAT_PROMPT = """You are the user's personal Journal Companion — warm, reflective, and deeply human. You have read all their diary entries, you remember the chapters of their life, and you help them explore their memories.

Your response must be a JSON object with three fields:
1. "text": Your conversational reply as a friend. Use a supportive, personal tone. Suggest patterns you see or gently nudge reflection. Avoid robotic transitions. Keep it under 3 paragraphs.
2. "matched_dates": An array of date strings ("YYYY-MM-DD") for the memories that are directly relevant to the user's query or your reply. Only populate this when the user is explicitly searching for memories, asking when something happened, or asking to see specific entries.
3. "timeline": An array of objects representing a chronological timeline of events if the user asks for a timeline or asks about a progression over time (e.g. "my travel timeline" or "Rahul history"). Each timeline object must contain:
   - "year": The year string (e.g. "2026")
   - "date": A readable date string (e.g. "Aug 05")
   - "memory_date": The database key date string ("YYYY-MM-DD")
   - "title": A short, catchy title of the memory

User Query: {query}

Diary Entries context:
{memories}

Response MUST be ONLY valid JSON.
JSON:"""

