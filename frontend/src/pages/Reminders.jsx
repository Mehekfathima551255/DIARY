import React, { useState, useEffect } from 'react';

const DAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Reminders() {
    const [reminders, setReminders] = useState(() => {
        try {
            const list = localStorage.getItem('sd_reminders_list');
            if (list) return JSON.parse(list);
        } catch (e) {}
        
        // Migration from old single-reminder config
        const oldEnabled = localStorage.getItem('sd_reminders_enabled') === 'true';
        if (oldEnabled) {
            const time = localStorage.getItem('sd_reminder_time') || '20:00';
            const msg = localStorage.getItem('sd_reminder_msg') || 'Time to reflect on your day! 📔';
            const sched = localStorage.getItem('sd_reminder_schedule') || 'everyday';
            let days = [1,2,3,4,5];
            try {
                days = JSON.parse(localStorage.getItem('sd_reminder_days') || '[1,2,3,4,5]');
            } catch (e) {}
            return [{
                id: 'migrated',
                enabled: true,
                time,
                message: msg,
                schedule: sched,
                days
            }];
        }
        return [];
    });

    const [showAddForm, setShowAddForm] = useState(false);
    const [time, setTime] = useState('20:00');
    const [message, setMessage] = useState('Time to reflect on your day! 📔');
    const [schedule, setSchedule] = useState('everyday');
    const [days, setDays] = useState([1,2,3,4,5]);

    useEffect(() => {
        localStorage.setItem('sd_reminders_list', JSON.stringify(reminders));
        // Keep sd_reminders_enabled in sync: true if at least one enabled reminder exists
        const hasAnyEnabled = reminders.some(r => r.enabled);
        localStorage.setItem('sd_reminders_enabled', hasAnyEnabled ? 'true' : 'false');
    }, [reminders]);

    const toggleReminder = (id) => {
        setReminders(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
    };

    const deleteReminder = (id) => {
        setReminders(prev => prev.filter(r => r.id !== id));
    };

    const handleAdd = (e) => {
        e.preventDefault();
        const newRem = {
            id: 'rem-' + Date.now(),
            enabled: true,
            time,
            message: message.trim() || 'Time to reflect on your day! 📔',
            schedule,
            days: schedule === 'custom' ? days : []
        };
        setReminders(prev => [...prev, newRem]);
        
        // Reset form
        setTime('20:00');
        setMessage('Time to reflect on your day! 📔');
        setSchedule('everyday');
        setDays([1,2,3,4,5]);
        setShowAddForm(false);
    };

    const toggleDay = (dIdx) => {
        setDays(prev => prev.includes(dIdx) ? prev.filter(d => d !== dIdx) : [...prev, dIdx]);
    };

    const testReminder = (msg) => {
        window.dispatchEvent(new CustomEvent('sd_test_reminder', {
            detail: { message: msg || 'Time to reflect on your day! 📔' },
        }));
    };

    const getScheduleText = (r) => {
        if (r.schedule === 'everyday') return 'Every day';
        if (r.schedule === 'weekdays') return 'Weekdays (Mon–Fri)';
        if (r.schedule === 'weekends') return 'Weekends (Sat & Sun)';
        if (r.schedule === 'today') return 'Only today';
        if (r.schedule === 'custom' && r.days) {
            if (r.days.length === 7) return 'Every day';
            if (r.days.length === 0) return 'Never';
            return r.days.map(d => DAYS_SHORT[d]).join(', ');
        }
        return 'Custom';
    };

    return (
        <div className="rem-root">
            <div className="between" style={{ marginBottom: '2rem' }}>
                <span className="muted">Configure personalized prompts to nudging you to write entries.</span>
                <button 
                    className="btn btn-primary" 
                    onClick={() => setShowAddForm(prev => !prev)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                    <i className={showAddForm ? "bx bx-x" : "bx bx-plus"} />
                    {showAddForm ? 'Cancel' : 'Add Reminder'}
                </button>
            </div>

            {/* ── Add Reminder Form ── */}
            {showAddForm && (
                <div className="card torn-edge rem-add-card animate-fade-in" style={{ transform: 'rotate(-0.5deg)', marginBottom: '2rem' }}>
                    <div className="tape top-center" />
                    <h3 className="rem-card-title"><i className="bx bx-plus-circle" /> New Reminder</h3>
                    <form onSubmit={handleAdd} className="rem-form">
                        <div className="rem-form-row">
                            <div className="rem-form-group">
                                <label>Time</label>
                                <input 
                                    type="time" 
                                    value={time} 
                                    onChange={(e) => setTime(e.target.value)} 
                                    required 
                                />
                            </div>
                            <div className="rem-form-group">
                                <label>Schedule</label>
                                <select value={schedule} onChange={(e) => setSchedule(e.target.value)}>
                                    <option value="everyday">Every day</option>
                                    <option value="weekdays">Weekdays (Mon – Fri)</option>
                                    <option value="weekends">Weekends (Sat & Sun)</option>
                                    <option value="today">Only today</option>
                                    <option value="custom">Custom days…</option>
                                </select>
                            </div>
                        </div>

                        {schedule === 'custom' && (
                            <div className="rem-form-group">
                                <label>Select Days</label>
                                <div className="rem-days-grid">
                                    {DAYS_SHORT.map((d, idx) => {
                                        const selected = days.includes(idx);
                                        return (
                                            <button 
                                                key={d} 
                                                type="button"
                                                onClick={() => toggleDay(idx)}
                                                className={`rem-day-btn ${selected ? 'active' : ''}`}
                                            >
                                                {d}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="rem-form-group">
                            <label>Reminder Message</label>
                            <input 
                                type="text" 
                                value={message} 
                                onChange={(e) => setMessage(e.target.value)} 
                                placeholder="e.g. What is on your mind tonight?" 
                                required
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                            <button 
                                type="button" 
                                className="btn btn-secondary" 
                                onClick={() => testReminder(message)}
                            >
                                <i className="bx bx-play-circle" /> Test Msg
                            </button>
                            <button type="submit" className="btn btn-primary">
                                Save Reminder
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ── Reminders List ── */}
            <div className="rem-list">
                {reminders.length === 0 ? (
                    <div className="card rem-empty-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
                        <i className="bx bx-bell-off" style={{ fontSize: '3rem', color: 'var(--text-muted)', opacity: 0.5 }} />
                        <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.25rem', marginTop: '1rem' }}>
                            No reminders set. Click 'Add Reminder' above to stay on track!
                        </p>
                    </div>
                ) : (
                    reminders.map((r, idx) => {
                        const rot = idx % 2 === 0 ? 'rotate(-0.5deg)' : 'rotate(0.5deg)';
                        return (
                            <div 
                                key={r.id} 
                                className={`card rem-item-card torn-edge ${r.enabled ? '' : 'disabled'}`}
                                style={{ transform: rot }}
                            >
                                <div className="tape top-left" style={{ width: '40px' }} />
                                <div className="rem-item-main">
                                    <div className="rem-item-time">
                                        <i className="bx bx-time" /> {r.time}
                                    </div>
                                    <div className="rem-item-schedule">
                                        Repeat: <strong>{getScheduleText(r)}</strong>
                                    </div>
                                    <div className="rem-item-msg">
                                        "{r.message}"
                                    </div>
                                </div>
                                <div className="rem-item-actions">
                                    <button 
                                        onClick={() => testReminder(r.message)}
                                        className="rem-action-btn"
                                        title="Send test notification now"
                                    >
                                        <i className="bx bx-play-circle" />
                                    </button>
                                    <button 
                                        onClick={() => toggleReminder(r.id)}
                                        className={`rem-toggle-btn ${r.enabled ? 'active' : ''}`}
                                        title={r.enabled ? 'Disable' : 'Enable'}
                                    >
                                        <i className={r.enabled ? "bx bx-toggle-right" : "bx bx-toggle-left"} />
                                    </button>
                                    <button 
                                        onClick={() => deleteReminder(r.id)}
                                        className="rem-delete-btn"
                                        title="Delete"
                                    >
                                        <i className="bx bx-trash" />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
