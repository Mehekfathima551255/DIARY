import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Donut } from '../components/charts';
import { moodMeta } from '../lib/demo';
import { useAuth } from '../context/AuthContext';

const MOOD_COLORS = {
    Happy: '#6B7B52', Excited: '#D7A73E', Calm: '#3F6389',
    Sad: '#3F6389', Angry: '#C97B63', Other: '#8B8579', Neutral: '#8B8579',
};

function Greeting({ name, streak }) {
    const days = streak?.days_since_last ?? null;
    const current = streak?.current_streak ?? 0;

    let line1 = `Hey ${name || 'there'} 👋`;
    let line2 = '';

    if (days === null) {
        line2 = "Your journal is waiting — write your first entry today!";
    } else if (days === 0) {
        line2 = current > 1
            ? `You're on a ${current}-day streak 🔥 Keep it going!`
            : "You wrote today — great job! ✍️";
    } else if (days === 1) {
        line2 = "You wrote yesterday. Ready to add today's page?";
    } else {
        line2 = `Last entry was ${days} days ago. Your journal misses you 💙`;
    }

    return (
        <div className="sticky-note" style={{ flex: '1 1 300px', maxWidth: '420px', marginTop: '1rem' }}>
            <div className="pin" />
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                {line1}
            </p>
            <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.15rem', color: 'var(--text-secondary)' }}>
                {line2}
            </p>
        </div>
    );
}

export default function Dashboard({ go }) {
    const { user } = useAuth();
    const [stats, setStats]       = useState(null);
    const [streak, setStreak]     = useState(null);
    const [moodChart, setMoodChart] = useState(null);
    const [recent, setRecent]     = useState([]);

    const loadData = async () => {
        const [s, st, mc, rc] = await Promise.all([
            api.getStats(), api.getStreak(), api.getMoodChart(), api.getRecent(),
        ]);
        setStats(s); setStreak(st); setMoodChart(mc); setRecent(rc);
    };

    useEffect(() => {
        loadData();
        window.addEventListener('sd_entry_created', loadData);
        return () => window.removeEventListener('sd_entry_created', loadData);
    }, []);

    const total      = stats?.overview?.total_memories ?? '—';
    const week       = stats?.weekly_memories  ?? '—';
    const month      = stats?.monthly_memories ?? '—';
    const streakVal  = streak?.current_streak  ?? '—';

    const moodEntries = Object.entries(moodChart || {});
    const moodTotal = moodEntries.reduce((s, [, v]) => s + v, 0) || 1;
    const donutData = moodEntries.map(([label, value]) => ({
        label, value, color: MOOD_COLORS[label] || '#8B8579',
    }));

    return (
        <div style={{ position: 'relative', paddingBottom: '4rem' }}>
            {/* Scrapbook Header Area */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', marginBottom: '3rem', alignItems: 'flex-start' }}>
                
                {/* Greeting */}
                <Greeting name={user?.name} streak={streak} />

                {/* Quick Stats on a ripped piece of paper */}
                <div style={{ 
                    flex: '1 1 300px', 
                    background: 'var(--paper-0)', 
                    padding: '1.5rem', 
                    boxShadow: 'var(--shadow)',
                    transform: 'rotate(1deg)'
                }} className="torn-edge">
                    <div className="tape top-center"></div>
                    <h3 style={{ fontFamily: 'var(--font-hand)', fontSize: '1.4rem', borderBottom: '1px solid var(--border-mid)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>My Journal Stats</h3>
                    <ul style={{ listStyle: 'none', fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        <li style={{ marginBottom: '0.5rem' }}>Total Entries: <strong style={{ color: 'var(--ink-0)'}}>{total}</strong></li>
                        <li style={{ marginBottom: '0.5rem' }}>Written This Week: <strong style={{ color: 'var(--ink-0)'}}>{week}</strong></li>
                        <li style={{ marginBottom: '0.5rem' }}>Written This Month: <strong style={{ color: 'var(--ink-0)'}}>{month}</strong></li>
                        <li style={{ marginBottom: '0.5rem' }}>Current Streak: <strong style={{ color: 'var(--accent-terra)'}}>{streakVal} days</strong> <i className="bx bx-fire" style={{ color: 'var(--accent-terra)' }}></i></li>
                    </ul>
                </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3rem', alignItems: 'flex-start' }}>
                
                {/* Recent Memories as Polaroids */}
                <div style={{ flex: '2 1 400px' }}>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--ink-0)', marginBottom: '2rem' }}>Recent Pages</h2>
                    {recent.length === 0 && <p className="muted" style={{ fontFamily: 'var(--font-hand)', fontSize: '1.2rem' }}>Start writing to see entries here...</p>}
                    
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
                        {recent.map((m, i) => {
                            const mm = moodMeta(m.mood);
                            const rot = i % 2 === 0 ? '-2deg' : '3deg';
                            return (
                                <div key={m.id} className="polaroid" onClick={() => go('memories')} style={{ cursor: 'pointer', width: '250px', transform: `rotate(${rot})` }}>
                                    <div className="tape top-center"></div>
                                    <div style={{
                                        width: '100%', height: '180px',
                                        background: 'var(--paper-cream)',
                                        border: '1px solid var(--border-light)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '3rem', overflow: 'hidden',
                                    }}>
                                        {m.image_url
                                            ? <img src={api.imageUrl(m.image_url)} alt={m.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            : <span style={{ fontSize: '3.5rem' }}>{mm.emoji}</span>
                                        }
                                    </div>
                                    <div className="caption">
                                        <div style={{ fontWeight: 'bold', marginBottom: '0.2rem' }}>{m.title}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            {new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {mm.emoji}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right Column: Mood only */}
                <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                    
                    {/* Mood Palette Sticky Note */}
                    <div className="sticky-note blue" style={{ transform: 'rotate(-2deg)' }}>
                        <div className="pin"></div>
                        <h3 style={{ borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Mood Palette</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontFamily: 'var(--font-mono)' }}>
                            {moodEntries.map(([label, value]) => (
                                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                                    <span style={{ width: 14, height: 14, borderRadius: '2px', background: MOOD_COLORS[label] || '#8B8579', border: '1px solid rgba(0,0,0,0.2)' }} />
                                    <span style={{ flexGrow: 1 }}>{label}</span>
                                    <span>{Math.round((value / moodTotal) * 100)}%</span>
                                </div>
                            ))}
                            {moodEntries.length === 0 && <span style={{ color: 'var(--text-muted)' }}>No moods tracked yet.</span>}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
