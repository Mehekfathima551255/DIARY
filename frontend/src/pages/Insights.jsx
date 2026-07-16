import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';

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
        </div>
    );
}

export default function Insights() {
    const [data, setData] = useState({ weekly: '', mood: '', writing: '', suggestions: [] });
    const [loading, setLoading] = useState(true);

    const loadInsights = async () => {
        setLoading(true);
        const [w, m, h, s] = await Promise.all([
            api.getWeeklyReflection(), api.getMoodAnalysis(), api.getHabitDetection(), api.getSuggestions(),
        ]);
        setData({
            weekly: w.result, mood: m.result, writing: h.result,
            suggestions: (s.result || '').split('\n').filter(Boolean),
        });
        setLoading(false);
    };

    useEffect(() => {
        loadInsights();
        // Re-generate when a new diary entry is written
        window.addEventListener('sd_entry_created', loadInsights);
        return () => window.removeEventListener('sd_entry_created', loadInsights);
    }, []);

    return (
        <div>
            <div className="insight-grid">
                <InsightCard icon="bx-calendar-star" color="#7c6cff" title="Weekly Reflection"
                    loading={loading} text={data.weekly} />
                <InsightCard icon="bx-happy-heart-eyes" color="#34d399" title="Mood Analysis"
                    loading={loading} text={data.mood} />
                <InsightCard icon="bx-pen" color="#38bdf8" title="Writing Pattern"
                    loading={loading} text={data.writing} />
            </div>

            <div className="card">
                <div className="card-head"><span className="card-title"><i className="bx bx-bulb" style={{ color: 'var(--warning)' }} /> Suggestions</span></div>
                {loading
                    ? <p className="spinner"><i className="bx bx-loader-alt bx-spin" /> Thinking of ideas…</p>
                    : data.suggestions.map((s, i) => (
                        <div className="suggest-item" key={i}><i className="bx bx-right-arrow-circle" /> <span>{s}</span></div>
                    ))}
            </div>
        </div>
    );
}
