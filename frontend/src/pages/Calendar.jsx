import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function dotColor(count) {
    if (count >= 6) return '#a855f7';
    if (count >= 3) return '#7c6cff';
    return '#4b4f86';
}

export default function Calendar() {
    const [cursor, setCursor] = useState(() => new Date());
    const [heatmap, setHeatmap] = useState({});

    useEffect(() => { (async () => setHeatmap(await api.getCalendar()))(); }, []);

    const { cells, year, month } = useMemo(() => {
        const y = cursor.getFullYear();
        const m = cursor.getMonth();
        const first = new Date(y, m, 1);
        // Convert Sun=0 → Mon=0 based grid
        const startPad = (first.getDay() + 6) % 7;
        const daysInMonth = new Date(y, m + 1, 0).getDate();
        const arr = [];
        for (let i = 0; i < startPad; i++) arr.push(null);
        for (let d = 1; d <= daysInMonth; d++) arr.push(d);
        while (arr.length % 7 !== 0) arr.push(null);
        return { cells: arr, year: y, month: m };
    }, [cursor]);

    const today = new Date();
    const isToday = (d) => d && today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
    const countFor = (d) => {
        if (!d) return 0;
        const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        return heatmap[key] || 0;
    };
    const shift = (delta) => setCursor(new Date(year, month + delta, 1));

    return (
        <div className="card">
            <div className="between" style={{ marginBottom: '1.25rem' }}>
                <span className="card-title">{MONTHS[month]} {year}</span>
                <div className="flex-center gap-sm">
                    <button className="icon-btn" onClick={() => shift(-1)}><i className="bx bx-chevron-left" /></button>
                    <button className="btn btn-secondary" onClick={() => setCursor(new Date())}>Today</button>
                    <button className="icon-btn" onClick={() => shift(1)}><i className="bx bx-chevron-right" /></button>
                </div>
            </div>

            <div className="cal-head">{DAYS.map((d) => <div key={d}>{d}</div>)}</div>
            <div className="cal-grid">
                {cells.map((d, i) => {
                    const count = countFor(d);
                    return (
                        <div key={i} className={`cal-cell ${!d ? 'empty' : ''} ${isToday(d) ? 'today' : ''}`}>
                            {d && <>
                                <span className="num">{d}</span>
                                {count > 0 && <span className="dot" style={{ background: dotColor(count) }} title={`${count} memories`} />}
                            </>}
                        </div>
                    );
                })}
            </div>

            <div className="cal-legend">
                <span><span className="dot" style={{ width: 9, height: 9, borderRadius: '50%', display: 'inline-block', background: '#4b4f86' }} /> 1–2 memories</span>
                <span><span className="dot" style={{ width: 9, height: 9, borderRadius: '50%', display: 'inline-block', background: '#7c6cff' }} /> 3–5 memories</span>
                <span><span className="dot" style={{ width: 9, height: 9, borderRadius: '50%', display: 'inline-block', background: '#a855f7' }} /> 6+ memories</span>
            </div>
        </div>
    );
}
