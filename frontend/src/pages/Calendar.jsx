import React, { useEffect, useMemo, useState, useRef } from 'react';
import { api } from '../lib/api';

const DAYS   = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['January','February','March','April','May','June','July',
                'August','September','October','November','December'];
const YEARS  = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);

export default function Calendar() {
    const [cursor, setCursor]       = useState(() => new Date());
    const [heatmap, setHeatmap]     = useState({});
    const [showPicker, setShowPicker] = useState(false);
    const pickerRef = useRef(null);

    useEffect(() => { (async () => setHeatmap(await api.getCalendar()))(); }, []);

    // Close picker on outside click
    useEffect(() => {
        if (!showPicker) return;
        const handler = (e) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target)) setShowPicker(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [showPicker]);

    const { cells, year, month } = useMemo(() => {
        const y = cursor.getFullYear();
        const m = cursor.getMonth();
        const startPad    = (new Date(y, m, 1).getDay() + 6) % 7;
        const daysInMonth = new Date(y, m + 1, 0).getDate();
        const arr = [];
        for (let i = 0; i < startPad; i++) arr.push(null);
        for (let d = 1; d <= daysInMonth; d++) arr.push(d);
        while (arr.length % 7 !== 0) arr.push(null);
        return { cells: arr, year: y, month: m };
    }, [cursor]);

    const today   = new Date();
    const isToday = (d) => d && today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
    const hasEntry = (d) => {
        if (!d) return false;
        const key = `${year}-${String(month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        return (heatmap[key] || 0) > 0;
    };
    const shift = (delta) => setCursor(new Date(year, month + delta, 1));

    return (
        <div className="card">
            {/* ── Header ── */}
            <div className="between" style={{ marginBottom: '1.25rem' }}>

                {/* Clickable month/year → shows picker */}
                <div ref={pickerRef} style={{ position: 'relative' }}>
                    <button
                        onClick={() => setShowPicker((v) => !v)}
                        style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700,
                            color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem',
                        }}
                        title="Click to jump to any month / year"
                    >
                        {MONTHS[month]} {year}
                        <i className="bx bx-chevron-down" style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }} />
                    </button>

                    {/* Month / Year picker dropdown */}
                    {showPicker && (
                        <div style={{
                            position: 'absolute', top: '110%', left: 0, zIndex: 200,
                            background: 'var(--bg-card, #fff)',
                            border: '1px solid var(--border-mid)',
                            borderRadius: '10px',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                            padding: '1rem',
                            display: 'flex', flexDirection: 'column', gap: '0.75rem',
                            minWidth: '260px',
                        }}>
                            {/* Year selector */}
                            <div>
                                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.4rem', fontFamily: 'var(--font-sans)' }}>Year</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                                    {YEARS.map((y) => (
                                        <button key={y} onClick={() => { setCursor(new Date(y, month, 1)); setShowPicker(false); }}
                                            style={{ padding: '0.2rem 0.55rem', borderRadius: '4px', border: y === year ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-light)', background: y === year ? 'var(--accent-primary)' : 'transparent', color: y === year ? '#fff' : 'var(--text-primary)', cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'var(--font-sans)', fontWeight: y === year ? 700 : 400 }}>
                                            {y}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {/* Month selector */}
                            <div>
                                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.4rem', fontFamily: 'var(--font-sans)' }}>Month</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.3rem' }}>
                                    {MONTHS.map((mn, idx) => (
                                        <button key={mn} onClick={() => { setCursor(new Date(year, idx, 1)); setShowPicker(false); }}
                                            style={{ padding: '0.25rem 0.3rem', borderRadius: '4px', border: idx === month ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-light)', background: idx === month ? 'var(--accent-primary)' : 'transparent', color: idx === month ? '#fff' : 'var(--text-primary)', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'var(--font-sans)', fontWeight: idx === month ? 700 : 400 }}>
                                            {mn.slice(0, 3)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Arrow nav */}
                <div className="flex-center gap-sm">
                    <button className="icon-btn" onClick={() => shift(-1)} title="Previous month"><i className="bx bx-chevron-left" /></button>
                    <button className="btn btn-secondary" onClick={() => { setCursor(new Date()); setShowPicker(false); }}>Today</button>
                    <button className="icon-btn" onClick={() => shift(1)} title="Next month"><i className="bx bx-chevron-right" /></button>
                </div>
            </div>

            {/* Day headers */}
            <div className="cal-head">{DAYS.map((d) => <div key={d}>{d}</div>)}</div>

            {/* Grid — NO dots, just highlight days that have entries */}
            <div className="cal-grid">
                {cells.map((d, i) => {
                    const wrote = hasEntry(d);
                    return (
                        <div
                            key={i}
                            className={`cal-cell ${!d ? 'empty' : ''} ${isToday(d) ? 'today' : ''}`}
                            style={wrote && d ? { background: 'rgba(75,105,80,0.12)', borderColor: 'var(--accent-olive)' } : {}}
                            title={wrote ? `You wrote on ${MONTHS[month]} ${d}` : undefined}
                        >
                            {d && (
                                <span className="num" style={{ color: wrote ? 'var(--accent-forest, #4B6950)' : undefined, fontWeight: wrote ? 700 : undefined }}>
                                    {d}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Minimal legend */}
            <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>
                <span style={{ width: 12, height: 12, borderRadius: '2px', background: 'rgba(75,105,80,0.12)', border: '1px solid var(--accent-olive)', display: 'inline-block' }} />
                Days you wrote
            </div>
        </div>
    );
}
