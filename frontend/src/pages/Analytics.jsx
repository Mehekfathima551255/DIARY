import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { LineChart, Heatmap } from '../components/charts';
import { demoMoodTrend, demoHeatmap, demoAnalytics, moodMeta } from '../demo';

function MiniStat({ label, value, delta, emoji }) {
    return (
        <div className="card stat-card">
            <span className="label">{label}</span>
            <span className="value" style={{ fontSize: '1.5rem' }}>{value} {emoji}</span>
            {delta && <span className="hint" style={{ color: 'var(--success)' }}>{delta}</span>}
        </div>
    );
}

export default function Analytics() {
    const [range, setRange] = useState('This Month');
    const [memories, setMemories] = useState([]);

    useEffect(() => { (async () => setMemories(await api.getMemories()))(); }, []);

    // Use the rich demo figures in demo mode; otherwise derive from real memories.
    const words = memories.reduce((s, m) => s + (m.content || '').split(/\s+/).filter(Boolean).length, 0);
    const totalWords = api.isDemo ? demoAnalytics.totalWords : (words || demoAnalytics.totalWords);
    const avgWords = api.isDemo
        ? demoAnalytics.avgWords
        : (memories.length ? Math.round(words / memories.length) : demoAnalytics.avgWords);

    const moodCounts = {};
    memories.forEach((m) => { const k = m.mood || 'Neutral'; moodCounts[k] = (moodCounts[k] || 0) + 1; });
    const computedTop = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || demoAnalytics.mostUsedMood;
    const topMood = api.isDemo ? demoAnalytics.mostUsedMood : computedTop;
    const topMoodPct = api.isDemo
        ? demoAnalytics.mostUsedPct
        : (memories.length ? Math.round(((moodCounts[computedTop] || 0) / memories.length) * 100) : demoAnalytics.mostUsedPct);

    return (
        <div>
            <div className="between" style={{ marginBottom: '1.25rem' }}>
                <span className="muted">Insights from your journaling activity</span>
                <select style={{ width: 160 }} value={range} onChange={(e) => setRange(e.target.value)}>
                    <option>This Week</option><option>This Month</option><option>This Year</option>
                </select>
            </div>

            <div className="analytics-top">
                <div className="card">
                    <div className="card-head"><span className="card-title">Mood Trend</span></div>
                    <LineChart values={demoMoodTrend} />
                    <div className="between" style={{ marginTop: '.5rem', fontSize: '.72rem', color: 'var(--text-muted)' }}>
                        <span>Start of {range.replace('This ', '')}</span><span>Today</span>
                    </div>
                </div>

                <div className="card">
                    <div className="card-head"><span className="card-title">Writing Activity</span></div>
                    <Heatmap values={demoHeatmap} cols={30} />
                </div>
            </div>

            <div className="stat-grid">
                <MiniStat label="Total Words" value={totalWords.toLocaleString()} delta="+20% from last month" />
                <MiniStat label="Average Words / Day" value={avgWords} delta="+15% from last month" />
                <MiniStat label="Best Writing Day" value={demoAnalytics.bestDay} delta={`${demoAnalytics.bestDayWords} words`} />
                <MiniStat label="Most Used Mood" value={topMood} emoji={moodMeta(topMood).emoji} delta={`${topMoodPct}% of entries`} />
            </div>
        </div>
    );
}
