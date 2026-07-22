import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api';

/* ── Markdown-lite renderer ─────────────────────────────────── */
function fmt(text) {
    if (!text) return { __html: '' };
    return {
        __html: text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n- /g, '<br>• ')
            .replace(/\n/g, '<br>'),
    };
}

/* ── Skeleton shimmer ───────────────────────────────────────── */
function Skeleton({ lines = 4 }) {
    return (
        <div className="ins-skeleton">
            {Array.from({ length: lines }).map((_, i) => (
                <div
                    key={i}
                    className="ins-skeleton-line"
                    style={{ width: `${85 - i * 8}%` }}
                />
            ))}
        </div>
    );
}

/* ── Companion Banner ───────────────────────────────────────── */
function CompanionBanner({ text, loading }) {
    return (
        <div className="ins-companion">
            <div className="ins-companion-icon">
                <i className="bx bx-bot" />
            </div>
            <div className="ins-companion-body">
                {loading
                    ? <Skeleton lines={1} />
                    : <p dangerouslySetInnerHTML={fmt(text || 'Welcome back to your journal ✨')} />
                }
            </div>
            <div className="ins-companion-deco" aria-hidden="true">✦</div>
        </div>
    );
}

/* ── Insight Card ────────────────────────────────────────────── */
function InsightCard({ icon, color, title, badge, loading, text, accent }) {
    return (
        <div className="ins-card" style={{ '--ins-accent': color }}>
            <div className="ins-card-header">
                <span className="ins-card-icon" style={{ background: `${color}18`, color }}>
                    <i className={`bx ${icon}`} />
                </span>
                <div>
                    <h4 className="ins-card-title">{title}</h4>
                    {badge && <span className="ins-badge">{badge}</span>}
                </div>
                <div className="ins-card-deco" aria-hidden="true" style={{ color }}>{accent || '◆'}</div>
            </div>
            <div className="ins-card-body">
                {loading
                    ? <Skeleton lines={4} />
                    : <p dangerouslySetInnerHTML={fmt(text)} />
                }
            </div>
            <div className="ins-card-glow" aria-hidden="true" style={{ background: color }} />
        </div>
    );
}

/* ── Suggestions Panel ──────────────────────────────────────── */
function SuggestionsPanel({ loading, text }) {
    const items = (text || '').split('\n').filter(Boolean);
    return (
        <div className="ins-suggestions">
            <div className="ins-suggestions-header">
                <span className="ins-card-icon" style={{ background: '#D7A73E18', color: '#D7A73E' }}>
                    <i className="bx bx-bulb" />
                </span>
                <h4 className="ins-card-title">Personalized Suggestions</h4>
                <span className="ins-badge" style={{ background: '#D7A73E22', color: '#D7A73E' }}>For You</span>
            </div>
            <div className="ins-suggestions-body">
                {loading
                    ? <Skeleton lines={3} />
                    : items.length > 0
                        ? items.map((s, i) => (
                            <div className="ins-suggest-item" key={i}>
                                <span className="ins-suggest-num">{i + 1}</span>
                                <span>{s.replace(/^[-•*]\s*/, '')}</span>
                            </div>
                        ))
                        : <p className="ins-empty">Check back after writing a few more entries!</p>
                }
            </div>
        </div>
    );
}

/* ── Refresh Button ─────────────────────────────────────────── */
function RefreshBtn({ loading, onClick }) {
    return (
        <button
            id="insights-refresh-btn"
            className="ins-refresh-btn"
            onClick={onClick}
            disabled={loading}
            title="Regenerate all insights"
        >
            <i className={`bx bx-refresh ${loading ? 'bx-spin' : ''}`} />
            {loading ? 'Generating…' : 'Refresh'}
        </button>
    );
}

/* ── Main Page ──────────────────────────────────────────────── */
const CARDS = [
    { key: 'weekly',     icon: 'bx-calendar-star',    color: '#7c6cff', title: 'Weekly Reflection',    badge: '7 days',   accent: '★' },
    { key: 'monthly',    icon: 'bx-calendar-check',   color: '#C97B63', title: 'Monthly Reflection',   badge: '30 days',  accent: '◆' },
    { key: 'mood',       icon: 'bx-happy-heart-eyes', color: '#34d399', title: 'Mood Analysis',        badge: 'Emotional', accent: '♥' },
    { key: 'writing',    icon: 'bx-pen',              color: '#38bdf8', title: 'Writing Habits',       badge: 'Patterns', accent: '✎' },
    { key: 'productivity', icon: 'bx-trending-up',   color: '#D7A73E', title: 'Productivity Insights', badge: 'Stats',   accent: '▲' },
];

export default function Insights() {
    const [data, setData] = useState({
        companion: '', weekly: '', monthly: '', mood: '', writing: '', productivity: '', suggestions: '',
    });
    const [loading, setLoading] = useState(true);
    const [ts, setTs] = useState(null);

    const loadInsights = useCallback(async () => {
        setLoading(true);
        try {
            const [comp, w, mo, mood, habit, prod, sug] = await Promise.all([
                api.getCompanionMessage(),
                api.getWeeklyReflection(),
                api.getMonthlyReflection(),
                api.getMoodAnalysis(),
                api.getHabitDetection(),
                api.getProductivity(),
                api.getSuggestions(),
            ]);
            setData({
                companion:    comp?.result   || '',
                weekly:       w?.result      || '',
                monthly:      mo?.result     || '',
                mood:         mood?.result   || '',
                writing:      habit?.result  || '',
                productivity: prod?.result   || '',
                suggestions:  sug?.result    || '',
            });
        } catch (e) {
            console.error('Insights load error:', e);
        }
        setLoading(false);
        setTs(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, []);

    useEffect(() => {
        loadInsights();
        window.addEventListener('sd_entry_created', loadInsights);
        return () => window.removeEventListener('sd_entry_created', loadInsights);
    }, [loadInsights]);

    return (
        <div className="ins-root">

            {/* ── Page Header ── */}
            <div className="ins-page-header">
                <div>
                    <h1 className="ins-page-title">
                        <i className="bx bx-brain" style={{ color: 'var(--accent-terra)' }} />
                        AI Insights
                    </h1>
                    <p className="ins-page-sub">
                        What your journal reveals about you
                        {ts && <span className="ins-ts"> · Last updated {ts}</span>}
                    </p>
                </div>
                <RefreshBtn loading={loading} onClick={loadInsights} />
            </div>

            {/* ── Companion Banner ── */}
            <CompanionBanner text={data.companion} loading={loading} />

            {/* ── 2-column insight grid ── */}
            <div className="ins-grid">
                {CARDS.map(({ key, icon, color, title, badge, accent }) => (
                    <InsightCard
                        key={key}
                        icon={icon}
                        color={color}
                        title={title}
                        badge={badge}
                        accent={accent}
                        loading={loading}
                        text={data[key]}
                    />
                ))}
                {/* Suggestions takes full width */}
                <div className="ins-full-width">
                    <SuggestionsPanel loading={loading} text={data.suggestions} />
                </div>
            </div>

            {/* ── Decorative footer note ── */}
            <div className="ins-footer-note">
                <i className="bx bx-info-circle" />
                Insights are generated by Gemini AI from your journal entries and refresh automatically when you write a new memory.
            </div>
        </div>
    );
}
