import React, { useState, useEffect } from 'react';
import { api } from '../api';

export default function Insights() {
    const [weeklyReflection, setWeeklyReflection] = useState('');
    const [moodAnalysis, setMoodAnalysis] = useState('');
    const [loadingWeekly, setLoadingWeekly] = useState(true);
    const [loadingMood, setLoadingMood] = useState(true);
    const [errorWeekly, setErrorWeekly] = useState(null);
    const [errorMood, setErrorMood] = useState(null);

    useEffect(() => {
        const loadInsights = async () => {
            // Load Weekly Reflection
            try {
                const weeklyData = await api.getWeeklyReflection();
                if (weeklyData && weeklyData.reflection) {
                    setWeeklyReflection(weeklyData.reflection);
                } else {
                    setWeeklyReflection("Not enough data for a weekly reflection.");
                }
            } catch (e) {
                setErrorWeekly("Failed to load reflection.");
            } finally {
                setLoadingWeekly(false);
            }

            // Load Mood Analysis
            try {
                const moodData = await api.getAggregateMoodAnalysis();
                if (moodData && moodData.analysis) {
                    setMoodAnalysis(moodData.analysis);
                } else {
                    setMoodAnalysis("Not enough data for mood analysis.");
                }
            } catch (e) {
                setErrorMood("Failed to load mood analysis.");
            } finally {
                setLoadingMood(false);
            }
        };

        loadInsights();
    }, []);

    const formatText = (text) => {
        if (!text) return { __html: "" };
        const formatted = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n\n/g, '<br><br>')
            .replace(/\n- /g, '<br>• ');
        return { __html: formatted };
    };

    return (
        <div className="insights-container" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            <div className="card glass">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <i className='bx bx-calendar-star' style={{ color: 'var(--accent-primary)', fontSize: '1.75rem' }}></i>
                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem' }}>Weekly Reflection</h3>
                </div>
                <div>
                    {loadingWeekly ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                            <i className='bx bx-loader-alt bx-spin'></i> Generating AI reflection...
                        </div>
                    ) : errorWeekly ? (
                        <p style={{ color: 'var(--danger)' }}>{errorWeekly}</p>
                    ) : (
                        <div style={{ lineHeight: '1.7', fontSize: '1.05rem' }} dangerouslySetInnerHTML={formatText(weeklyReflection)} />
                    )}
                </div>
            </div>

            <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <i className='bx bx-bar-chart-alt-2' style={{ color: 'var(--success)', fontSize: '1.75rem' }}></i>
                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem' }}>Mood Analysis</h3>
                </div>
                <div>
                    {loadingMood ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                            <i className='bx bx-loader-alt bx-spin'></i> Analyzing your emotional trends...
                        </div>
                    ) : errorMood ? (
                        <p style={{ color: 'var(--danger)' }}>{errorMood}</p>
                    ) : (
                        <div style={{ lineHeight: '1.7', fontSize: '1.05rem' }} dangerouslySetInnerHTML={formatText(moodAnalysis)} />
                    )}
                </div>
            </div>

        </div>
    );
}
