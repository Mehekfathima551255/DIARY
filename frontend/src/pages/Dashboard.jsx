import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Donut } from '../components/charts';
import { moodMeta } from '../lib/demo';

const MOOD_COLORS = {
    Happy: '#34d399', Excited: '#7c6cff', Calm: '#38bdf8',
    Sad: '#f59e0b', Angry: '#f87171', Other: '#9aa1c4', Neutral: '#9aa1c4',
};

function StatCard({ icon, color, label, value, hint, onClick }) {
    return (
        <div
            className="card stat-card"
            onClick={onClick}
            style={{ cursor: onClick ? 'pointer' : 'default' }}
            title={onClick ? `Click to view ${label}` : undefined}
        >
            <div className="stat-top">
                <span className="label">{label}</span>
                <span className="stat-icon" style={{ background: `${color}22`, color }}>
                    <i className={`bx ${icon}`} />
                </span>
            </div>
            <span className="value">{value}</span>
            <span className="hint">{hint}</span>
        </div>
    );
}

export default function Dashboard({ go }) {
    const [stats, setStats] = useState(null);
    const [streak, setStreak] = useState(null);
    const [moodChart, setMoodChart] = useState(null);
    const [tags, setTags] = useState([]);
    const [recent, setRecent] = useState([]);

    useEffect(() => {
        (async () => {
            const [s, st, mc, tt, rc] = await Promise.all([
                api.getStats(), api.getStreak(), api.getMoodChart(), api.getTopTags(), api.getRecent(),
            ]);
            setStats(s); setStreak(st); setMoodChart(mc); setTags(tt); setRecent(rc);
        })();
    }, []);

    const total = stats?.overview?.total_memories ?? '—';
    const week = stats?.weekly_memories ?? '—';
    const month = stats?.monthly_memories ?? '—';
    const streakVal = streak?.current_streak ?? '—';

    const moodEntries = Object.entries(moodChart || {});
    const moodTotal = moodEntries.reduce((s, [, v]) => s + v, 0) || 1;
    const donutData = moodEntries.map(([label, value]) => ({
        label, value, color: MOOD_COLORS[label] || '#9aa1c4',
    }));

    return (
        <div>
            <div className="stat-grid">
                <StatCard icon="bx-book-heart"   color="#c8391a" label="Total Memories" value={total}     hint="Click to view all"          onClick={() => go('memories', 'all')} />
                <StatCard icon="bx-calendar-week" color="#2d6a4f" label="This Week"      value={week}      hint="Click to view this week"     onClick={() => go('memories', 'week')} />
                <StatCard icon="bx-calendar"      color="#1a3a6b" label="This Month"     value={month}     hint="Click to view this month"    onClick={() => go('memories', 'month')} />
                <StatCard icon="bx-trending-up"   color="#c4840a" label="Writing Streak" value={streakVal} hint="Days in a row 🔥" />
            </div>

            <div className="dash-grid">
                {/* Mood overview */}
                <div className="card">
                    <div className="card-head"><span className="card-title">Mood Overview</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {donutData.length > 0 && <Donut data={donutData} />}
                        <div className="legend" style={{ flexGrow: 1 }}>
                            {moodEntries.map(([label, value]) => (
                                <div className="legend-item" key={label}>
                                    <span className="legend-dot" style={{ background: MOOD_COLORS[label] || '#9aa1c4' }} />
                                    {label}
                                    <span className="pct">{Math.round((value / moodTotal) * 100)}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Top tags */}
                <div className="card">
                    <div className="card-head"><span className="card-title">Top Tags</span></div>
                    {tags.length === 0 && <p className="muted">No tags yet.</p>}
                    {tags.map((t) => (
                        <div className="tag-row" key={t.tag}>
                            <span className="pill tag">{t.tag}</span>
                            <span className="cnt">{t.count}</span>
                        </div>
                    ))}
                    <div className="card-foot"><a onClick={() => go('memories')}>View all</a></div>
                </div>

                {/* Recent memories */}
                <div className="card">
                    <div className="card-head"><span className="card-title">Recent Memories</span></div>
                    {recent.length === 0 && <p className="muted">Start writing to see entries here.</p>}
                    {recent.map((m) => {
                        const mm = moodMeta(m.mood);
                        return (
                            <div className="mem-mini" key={m.id} onClick={() => go('memories')} style={{ cursor: 'pointer' }}>
                                <div className="mem-thumb" style={{ background: `${mm.color}33`, color: mm.color }}>{mm.emoji}</div>
                                <div style={{ flexGrow: 1, minWidth: 0 }}>
                                    <div className="t">{m.title}</div>
                                    <div className="d">{new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                                </div>
                            </div>
                        );
                    })}
                    <div className="card-foot"><a onClick={() => go('memories')}>View all</a></div>
                </div>
            </div>
        </div>
    );
}
