import React, { useEffect, useState } from 'react';
import { api } from '../api';

function fmt(text) {
    if (!text) return { __html: '' };
    return {
        __html: text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n\n/g, '<br><br>')
            .replace(/\n- /g, '<br>• '),
    };
}

function InsightCard({ icon, color, title, loading, text, onView }) {
    return (
        <div className="card insight-card">
            <h4><i className={`bx ${icon}`} style={{ color }} /> {title}</h4>
            {loading
                ? <p className="spinner"><i className="bx bx-loader-alt bx-spin" /> Generating…</p>
                : <p dangerouslySetInnerHTML={fmt(text)} />}
            <button className="btn btn-secondary btn-block" onClick={onView}>View Details</button>
        </div>
    );
}

export default function Insights() {
    const [data, setData] = useState({ weekly: '', mood: '', writing: '', suggestions: [] });
    const [loading, setLoading] = useState(true);
    const [detail, setDetail] = useState(null);

    useEffect(() => {
        (async () => {
            const [w, m, h, s] = await Promise.all([
                api.getWeeklyReflection(), api.getMoodAnalysis(), api.getHabitDetection(), api.getSuggestions(),
            ]);
            setData({
                weekly: w.result, mood: m.result, writing: h.result,
                suggestions: (s.result || '').split('\n').filter(Boolean),
            });
            setLoading(false);
        })();
    }, []);

    return (
        <div>
            <div className="insight-grid">
                <InsightCard icon="bx-calendar-star" color="#7c6cff" title="Weekly Reflection"
                    loading={loading} text={data.weekly} onView={() => setDetail({ title: 'Weekly Reflection', text: data.weekly })} />
                <InsightCard icon="bx-happy-heart-eyes" color="#34d399" title="Mood Analysis"
                    loading={loading} text={data.mood} onView={() => setDetail({ title: 'Mood Analysis', text: data.mood })} />
                <InsightCard icon="bx-pen" color="#38bdf8" title="Writing Pattern"
                    loading={loading} text={data.writing} onView={() => setDetail({ title: 'Writing Pattern', text: data.writing })} />
            </div>

            <div className="card">
                <div className="card-head"><span className="card-title"><i className="bx bx-bulb" style={{ color: 'var(--warning)' }} /> Suggestions</span></div>
                {loading
                    ? <p className="spinner"><i className="bx bx-loader-alt bx-spin" /> Thinking of ideas…</p>
                    : data.suggestions.map((s, i) => (
                        <div className="suggest-item" key={i}><i className="bx bx-right-arrow-circle" /> <span>{s}</span></div>
                    ))}
            </div>

            {detail && (
                <div onClick={() => setDetail(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', display: 'grid', placeItems: 'center', zIndex: 200, padding: '1rem' }}>
                    <div className="card glass" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520, width: '100%' }}>
                        <div className="card-head">
                            <span className="card-title">{detail.title}</span>
                            <i className="bx bx-x" style={{ cursor: 'pointer', fontSize: '1.4rem' }} onClick={() => setDetail(null)} />
                        </div>
                        <p style={{ lineHeight: 1.7 }} dangerouslySetInnerHTML={fmt(detail.text)} />
                    </div>
                </div>
            )}
        </div>
    );
}
