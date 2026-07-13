// Sample data used for "Demo mode" and as a graceful fallback when the
// backend is unreachable, so every screen renders like the design mockup.

export const MOODS = [
    { key: 'Happy', emoji: '😊', color: '#34d399' },
    { key: 'Excited', emoji: '🤩', color: '#7c6cff' },
    { key: 'Calm', emoji: '😌', color: '#38bdf8' },
    { key: 'Sad', emoji: '😢', color: '#f59e0b' },
    { key: 'Angry', emoji: '😠', color: '#f87171' },
    { key: 'Neutral', emoji: '😐', color: '#9aa1c4' },
    { key: 'Anxious', emoji: '😰', color: '#a855f7' },
];

export const moodMeta = (mood) =>
    MOODS.find((m) => m.key === (mood || '').trim()) || { key: mood || 'Neutral', emoji: '📝', color: '#9aa1c4' };

export const demoUser = { id: 0, name: 'Mehek', email: 'mehek@demo.com' };

export const demoMemories = [
    { id: 1, title: 'A beautiful sunset at Marine Drive', content: 'Watched the sun dip into the Arabian Sea with friends. The sky turned every shade of orange and pink. One of those evenings you never forget.', mood: 'Happy', tags: 'travel,sunset,mumbai', favorite: true, created_at: '2024-05-16T18:30:00', updated_at: '2024-05-16T18:30:00', user_id: 0 },
    { id: 2, title: 'Project submission day', content: 'Finally submitted the semester project after weeks of work. Nervous but proud of what our team built together.', mood: 'Excited', tags: 'college,project', favorite: false, created_at: '2024-05-15T21:10:00', updated_at: '2024-05-15T21:10:00', user_id: 0 },
    { id: 3, title: 'Late night coding session', content: 'Debugged the API until 2am. Calm and focused with lo-fi music playing. Solved the bug that had been haunting me all week.', mood: 'Calm', tags: 'coding,work', favorite: false, created_at: '2024-05-14T23:50:00', updated_at: '2024-05-14T23:50:00', user_id: 0 },
    { id: 4, title: 'Weekend trip to Lonavala', content: 'Road trip with friends to the hills. Green everywhere, misty mornings, hot chai and endless conversations.', mood: 'Happy', tags: 'travel,friends', favorite: true, created_at: '2024-05-12T10:00:00', updated_at: '2024-05-12T10:00:00', user_id: 0 },
    { id: 5, title: 'A quiet rainy morning', content: 'Sat by the window with coffee and a book. The rain made everything feel slow and peaceful.', mood: 'Calm', tags: 'family,rain', favorite: false, created_at: '2024-05-10T08:20:00', updated_at: '2024-05-10T08:20:00', user_id: 0 },
    { id: 6, title: 'Frustrating traffic jam', content: 'Stuck for two hours on the way home. Lost my patience but tried to breathe through it.', mood: 'Angry', tags: 'work,commute', favorite: false, created_at: '2024-05-08T19:00:00', updated_at: '2024-05-08T19:00:00', user_id: 0 },
    { id: 7, title: 'Coffee with an old friend', content: 'Reconnected with a college friend I had not seen in years. Felt like no time had passed at all.', mood: 'Happy', tags: 'friends,family', favorite: false, created_at: '2024-05-05T16:00:00', updated_at: '2024-05-05T16:00:00', user_id: 0 },
    { id: 8, title: 'Morning run by the lake', content: 'Woke up early and ran 5k. The cool air and calm water reset my whole mood for the day.', mood: 'Excited', tags: 'health,morning', favorite: false, created_at: '2024-05-03T06:30:00', updated_at: '2024-05-03T06:30:00', user_id: 0 },
];

export const demoStats = {
    overview: { total_memories: 128, favorite_memories: 24 },
    weekly_memories: 12,
    monthly_memories: 45,
    moods: { Happy: 59, Excited: 26, Calm: 19, Sad: 13, Angry: 6, Neutral: 5 },
};

export const demoStreak = { current_streak: 14, longest_streak: 31 };

export const demoTopTags = [
    { tag: 'travel', count: 24 },
    { tag: 'friends', count: 18 },
    { tag: 'college', count: 16 },
    { tag: 'family', count: 14 },
    { tag: 'work', count: 12 },
];

export const demoMoodChart = { Happy: 46, Excited: 20, Calm: 15, Sad: 10, Angry: 5, Other: 4 };

// 4 weeks x 7 days of writing activity counts (0-4)
export const demoHeatmap = [
    2, 0, 3, 1, 4, 2, 1, 3, 2, 0, 1, 3, 4, 2, 0, 1, 2, 3, 1, 0, 2,
    4, 3, 2, 1, 0, 2, 3, 1, 2, 4, 3, 0, 1, 2, 3, 4, 2, 1, 0, 3, 2,
    1, 2, 0, 3, 4, 2, 1, 0, 2, 3, 1, 4, 2, 0, 1, 3, 2, 4,
];

// Mood trend line (values 0-100) across a month
export const demoMoodTrend = [55, 62, 58, 70, 65, 72, 60, 68, 75, 71, 80, 74, 69, 78, 82, 76, 84, 79, 88, 83, 90, 85, 92, 87, 94, 89, 96, 91, 98, 93];

export const demoAnalytics = {
    totalWords: 12450,
    avgWords: 415,
    bestDay: 'May 10',
    bestDayWords: 523,
    mostUsedMood: 'Happy',
    mostUsedPct: 46,
};

export const demoInsights = {
    weekly: 'You had a productive week! You wrote **12 memories** and your mood was mostly positive. Keep up the momentum — journaling consistently is clearly working for you.',
    mood: 'Your mood has been **improving** steadily this month. Happy (46%) and Excited (20%) dominate your entries. Keep capturing these bright moments!',
    writing: 'You usually write more on **weekends**. Your longest streak is 31 days — try to keep your current 14-day streak alive!',
    suggestions: [
        "You haven't written in a couple of days. How about capturing today's moments? ✍️",
        'You often write about "travel". Maybe plan your next adventure? ✈️',
        'Your happiest entries mention friends — reach out to someone today!',
    ],
};

export const demoChat = {
    'weekend': "Based on your memories, last weekend you went on a trip to Lonavala with your friends. You also visited some scenic points and enjoyed the weather!",
    'mood': "You have been mostly happy this month! 🎉 Happy (46%), Excited (20%), Calm (15%). Overall a great month!",
    'default': "That's a great question! Based on your diary, you've been journaling consistently and your entries lean positive. Ask me about your moods, recent trips, or writing habits.",
};

export const demoSummary =
    'You had a productive and fulfilling day. You started with a healthy routine, worked hard on your project, overcame challenges, and ended the day with quality time with your friend.';
