import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { Donut } from '../components/charts';
import { moodMeta } from '../lib/demo';

const MOOD_COLORS = {
    Happy: '#6B7B52', Excited: '#D7A73E', Calm: '#3F6389',
    Sad: '#3F6389', Angry: '#C97B63', Other: '#8B8579', Neutral: '#8B8579',
};

function StatCard({ icon, label, value, hint, onClick }) {
    return (
        <div
            className="stat-card"
            onClick={onClick}
            style={{ cursor: onClick ? 'pointer' : 'default' }}
            title={onClick ? `Click to view ${label}` : undefined}
        >
            <div className="stat-top">
                <span className="label">{label}</span>
                <span className="stat-icon" style={{ color: 'var(--accent-terra)' }}>
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
    const [companion, setCompanion] = useState(null);
    const [companionLoaded, setCompanionLoaded] = useState(false);

    useEffect(() => {
        (async () => {
            const [s, st, mc, tt, rc] = await Promise.all([
                api.getStats(), api.getStreak(), api.getMoodChart(), api.getTopTags(), api.getRecent(),
            ]);
            setStats(s); setStreak(st); setMoodChart(mc); setTags(tt); setRecent(rc);
        })();
        // Fetch companion separately so dashboard doesn't block on it
        api.getCompanionMessage().then((r) => {
            setCompanion(r?.result || null);
            setCompanionLoaded(true);
        }).catch(() => setCompanionLoaded(true));
    }, []);

    const total = stats?.overview?.total_memories ?? '—';
    const week = stats?.weekly_memories ?? '—';
    const month = stats?.monthly_memories ?? '—';
    const streakVal = streak?.current_streak ?? '—';

    const moodEntries = Object.entries(moodChart || {});
    const moodTotal = moodEntries.reduce((s, [, v]) => s + v, 0) || 1;
    const donutData = moodEntries.map(([label, value]) => ({
        label, value, color: MOOD_COLORS[label] || '#8B8579',
    }));

    return (
        <div>
            {/* Quiet Companion Note */}
            {companionLoaded && companion && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    background: 'var(--paper-cream)', border: '1px solid var(--border-light)',
                    borderLeft: '3px solid var(--accent-terra)',
                    borderRadius: 'var(--radius-sm)', padding: '0.75rem 1.25rem',
                    marginBottom: '1.75rem', fontFamily: 'var(--font-display)',
                    fontSize: '1.05rem', color: 'var(--text-secondary)',
                    fontStyle: 'italic', boxShadow: 'var(--shadow-sm)',
                }}>
                    <i className="bx bx-bot" style={{ color: 'var(--accent-terra)', fontSize: '1.2rem', flexShrink: 0 }} />
                    {companion}
                </div>
            )}
            <div className="stat-grid">
                <StatCard icon="bx-book-heart"   label="Total Memories" value={total}     hint="All your entries"          onClick={() => go('memories', 'all')} />
                <StatCard icon="bx-calendar-week" label="This Week"      value={week}      hint="Recent thoughts"     onClick={() => go('memories', 'week')} />
                <StatCard icon="bx-calendar"      label="This Month"     value={month}     hint="Monthly reflection"    onClick={() => go('memories', 'month')} />
                <StatCard icon="bx-trending-up"   label="Writing Streak" value={streakVal} hint="Days in a row" />
            </div>

            <div className="dash-grid">
                {/* Mood overview */}
                <div className="card">
                    <div className="card-head"><span className="card-title">Mood Palette</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                        {donutData.length > 0 && <Donut data={donutData} />}
                        <div className="legend" style={{ flexGrow: 1 }}>
                            {moodEntries.map(([label, value]) => (
                                <div className="legend-item" key={label} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem'}}>
                                    <span style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                                        <span style={{ width: 12, height: 12, borderRadius: '50%', background: MOOD_COLORS[label] || '#8B8579' }} />
                                        {label}
                                    </span>
                                    <span style={{fontFamily: 'var(--font-mono)', color: 'var(--text-muted)'}}>{Math.round((value / moodTotal) * 100)}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Top tags */}
                <div className="card">
                    <div className="card-head"><span className="card-title">Themes</span></div>
                    {tags.length === 0 && <p className="muted">No themes yet.</p>}
                    {tags.map((t) => (
                        <div className="tag-row" key={t.tag}>
                            <span className="pill tag">{t.tag}</span>
                            <span style={{fontFamily: 'var(--font-mono)', color: 'var(--text-muted)'}}>{t.count}</span>
                        </div>
                    ))}
                </div>

                {/* Recent memories */}
                <div className="card" style={{gridColumn: '1 / -1'}}>
                    <div className="card-head"><span className="card-title">Recent Pages</span></div>
                    {recent.length === 0 && <p className="muted">Start writing to see entries here.</p>}
                    <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem'}}>
                        {recent.map((m) => {
                            const mm = moodMeta(m.mood);
                            return (
                                <div className="card" key={m.id} onClick={() => go('memories')} style={{ cursor: 'pointer', background: 'var(--paper-cream)', boxShadow: 'var(--shadow-sm)' }}>
                                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem'}}>
                                        <div style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>{new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                                        <div>{mm.emoji}</div>
                                    </div>
                                    <div style={{fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)'}}>{m.title}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
