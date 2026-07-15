import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

export default function Settings() {
    const { user, logout } = useAuth();
    const [name, setName] = useState(user?.name || '');
    const [email] = useState(user?.email || '');
    
    const [remindersEnabled, setRemindersEnabled] = useState(false);
    const [reminderTime, setReminderTime]         = useState('20:00');
    const [reminderMessage, setReminderMessage]   = useState('Time to reflect on your day! 📔');
    // Schedule: 'everyday' | 'today' | 'weekdays' | 'weekends' | 'custom'
    const [reminderSchedule, setReminderSchedule] = useState('everyday');
    // custom days: array of 0–6 (0=Sun,1=Mon...6=Sat)
    const [reminderDays, setReminderDays]         = useState([1,2,3,4,5]); // Mon–Fri default

    // Private Mode State
    const [privateMode, setPrivateMode] = useState(false);

    useEffect(() => {
        const storedEnabled  = localStorage.getItem('sd_reminders_enabled') === 'true';
        const storedTime     = localStorage.getItem('sd_reminder_time');
        const storedMsg      = localStorage.getItem('sd_reminder_msg');
        const storedPrivate  = localStorage.getItem('sd_private_mode') === 'true';
        const storedSchedule = localStorage.getItem('sd_reminder_schedule');
        const storedDays     = localStorage.getItem('sd_reminder_days');

        if (storedEnabled)  setRemindersEnabled(true);
        if (storedTime)     setReminderTime(storedTime);
        if (storedMsg)      setReminderMessage(storedMsg);
        if (storedPrivate)  setPrivateMode(true);
        if (storedSchedule) setReminderSchedule(storedSchedule);
        if (storedDays)     { try { setReminderDays(JSON.parse(storedDays)); } catch {} }
    }, []);

    const handleReminderToggle = (e) => {
        const isChecked = e.target.checked;
        setRemindersEnabled(isChecked);
        localStorage.setItem('sd_reminders_enabled', isChecked);
    };

    const handleTimeChange = (e) => {
        const time = e.target.value;
        setReminderTime(time);
        localStorage.setItem('sd_reminder_time', time);
    };

    const handleMessageChange = (e) => {
        const msg = e.target.value;
        setReminderMessage(msg);
        localStorage.setItem('sd_reminder_msg', msg);
    };

    const handleScheduleChange = (schedule) => {
        setReminderSchedule(schedule);
        localStorage.setItem('sd_reminder_schedule', schedule);
        // Reset "today only" fired flag so it can fire again if switched back
        if (schedule !== 'today') {
            localStorage.removeItem('sd_reminder_today_fired');
        }
    };

    const toggleDay = (day) => {
        const updated = reminderDays.includes(day)
            ? reminderDays.filter((d) => d !== day)
            : [...reminderDays, day];
        setReminderDays(updated);
        localStorage.setItem('sd_reminder_days', JSON.stringify(updated));
    };

    const handlePrivateModeToggle = (e) => {
        const isChecked = e.target.checked;
        setPrivateMode(isChecked);
        localStorage.setItem('sd_private_mode', isChecked);
        window.dispatchEvent(new Event('sd_settings_updated'));
    };

    const testReminder = () => {
        const msg = reminderMessage || 'Time to reflect on your day! 📔';
        // Show the in-app toast by dispatching a custom event
        window.dispatchEvent(new CustomEvent('sd_test_reminder', { detail: { message: msg } }));
    };

    // Data & Backups
    const fileInputRef = useRef(null);
    const [isImporting, setIsImporting] = useState(false);

    const handleExport = async () => {
        try {
            await api.exportMemories();
        } catch (err) {
            alert('Failed to export backup: ' + err.message);
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        setIsImporting(true);
        try {
            await api.importMemories(file);
            alert('Backup imported successfully! Reloading...');
            window.location.reload();
        } catch (err) {
            alert('Failed to import backup: ' + err.message);
            setIsImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'grid', gap: '2rem', padding: '1rem', gridTemplateColumns: '1fr' }}>
            
            {/* Header */}
            <div className="torn-edge" style={{ background: 'var(--paper-cream)', padding: '1.5rem', textAlign: 'center', position: 'relative', transform: 'rotate(-1deg)', boxShadow: 'var(--shadow)' }}>
                <div className="tape top-center"></div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--ink-0)', margin: 0 }}>Journal Settings</h2>
                <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.2rem', color: 'var(--text-muted)', margin: '0.5rem 0 0 0' }}>Manage your preferences and backups.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                
                {/* Profile Card */}
                <div className="torn-edge" style={{ background: 'var(--paper-0)', padding: '2rem', position: 'relative', boxShadow: 'var(--shadow)', transform: 'rotate(1deg)' }}>
                    <div className="tape top-left" style={{ width: '40px' }}></div>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--ink-0)', borderBottom: '2px solid var(--ink-0)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>Profile</h3>
                    
                    <label style={{ fontFamily: 'var(--font-sans)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Name</label>
                    <input 
                        value={name} onChange={(e) => setName(e.target.value)} 
                        style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px dashed var(--border-mid)', fontFamily: 'var(--font-hand)', fontSize: '1.2rem', color: 'var(--ink-0)', padding: '0.5rem 0', marginBottom: '1.5rem', outline: 'none' }}
                    />
                    
                    <label style={{ fontFamily: 'var(--font-sans)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Email</label>
                    <input 
                        value={email} disabled 
                        style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px dashed var(--border-mid)', fontFamily: 'var(--font-hand)', fontSize: '1.2rem', color: 'var(--text-muted)', padding: '0.5rem 0', marginBottom: '1.5rem', outline: 'none' }}
                    />
                    
                    <button style={{ background: 'var(--accent-terra)', color: '#fff', border: 'none', borderRadius: '4px', padding: '0.75rem 1rem', fontFamily: 'var(--font-hand)', fontSize: '1.1rem', cursor: 'pointer', transform: 'rotate(-2deg)' }}>
                        <i className="bx bx-check" /> Save Changes
                    </button>
                </div>

                {/* Preferences */}
                <div className="sticky-note yellow" style={{ padding: '2rem', position: 'relative', transform: 'rotate(-1deg)' }}>
                    <div className="pin"></div>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--ink-0)', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>Preferences</h3>
                    
                    {/* Daily Reminders */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', cursor: 'pointer' }}>
                            <input type="checkbox" checked={remindersEnabled} onChange={handleReminderToggle} style={{ marginTop: '0.3rem', width: '18px', height: '18px', accentColor: 'var(--accent-terra)' }} />
                            <div>
                                <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, color: 'var(--ink-0)' }}><i className="bx bx-bell" /> Reminders</div>
                                <div style={{ fontFamily: 'var(--font-hand)', fontSize: '1rem', color: 'var(--text-secondary)' }}>Get nudged to write on your schedule</div>
                            </div>
                        </label>

                        {remindersEnabled && (
                            <div style={{ marginLeft: '2rem', marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>

                                {/* Time + Preview */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input
                                        type="time" value={reminderTime} onChange={handleTimeChange}
                                        style={{ background: 'transparent', border: '1px solid rgba(0,0,0,0.2)', padding: '0.2rem 0.5rem', fontFamily: 'var(--font-mono)' }}
                                    />
                                    <button onClick={testReminder} style={{ background: 'transparent', border: '1px solid rgba(0,0,0,0.3)', padding: '0.2rem 0.6rem', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '0.78rem', borderRadius: '4px' }}>
                                        Preview
                                    </button>
                                </div>

                                {/* Custom message */}
                                <input
                                    type="text" value={reminderMessage} onChange={handleMessageChange}
                                    placeholder="Custom reminder message..."
                                    style={{ background: 'transparent', border: 'none', borderBottom: '1px dashed rgba(0,0,0,0.3)', fontFamily: 'var(--font-hand)', fontSize: '1rem', outline: 'none', padding: '0.2rem 0' }}
                                />

                                {/* Schedule selector */}
                                <div>
                                    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(0,0,0,0.45)', marginBottom: '0.5rem' }}>
                                        Repeat
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                        {[
                                            { key: 'everyday', label: 'Every day' },
                                            { key: 'weekdays', label: 'Mon – Fri' },
                                            { key: 'weekends', label: 'Sat & Sun' },
                                            { key: 'today',    label: 'Only today' },
                                            { key: 'custom',   label: 'Custom…' },
                                        ].map(({ key, label }) => (
                                            <button
                                                key={key}
                                                onClick={() => handleScheduleChange(key)}
                                                style={{
                                                    padding: '0.25rem 0.7rem',
                                                    borderRadius: '20px',
                                                    border: reminderSchedule === key ? '1.5px solid #c0392b' : '1px solid rgba(0,0,0,0.22)',
                                                    background: reminderSchedule === key ? '#c0392b' : 'transparent',
                                                    color: reminderSchedule === key ? '#fff' : 'rgba(0,0,0,0.65)',
                                                    cursor: 'pointer',
                                                    fontSize: '0.8rem',
                                                    fontFamily: 'var(--font-sans)',
                                                    fontWeight: reminderSchedule === key ? 700 : 400,
                                                    transition: 'all 0.15s',
                                                }}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Custom day picker */}
                                    {reminderSchedule === 'custom' && (
                                        <div style={{ marginTop: '0.6rem', display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                                            {['S','M','T','W','T','F','S'].map((d, i) => {
                                                const dayNum = i; // 0=Sun … 6=Sat
                                                const active = reminderDays.includes(dayNum);
                                                return (
                                                    <button
                                                        key={i}
                                                        onClick={() => toggleDay(dayNum)}
                                                        style={{
                                                            width: 32, height: 32,
                                                            borderRadius: '50%',
                                                            border: active ? '1.5px solid #c0392b' : '1px solid rgba(0,0,0,0.2)',
                                                            background: active ? '#c0392b' : 'transparent',
                                                            color: active ? '#fff' : 'rgba(0,0,0,0.55)',
                                                            cursor: 'pointer',
                                                            fontSize: '0.78rem',
                                                            fontFamily: 'var(--font-sans)',
                                                            fontWeight: 700,
                                                            transition: 'all 0.15s',
                                                        }}
                                                        title={['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][i]}
                                                    >
                                                        {d}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* "Only today" info */}
                                    {reminderSchedule === 'today' && (
                                        <div style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: 'rgba(0,0,0,0.45)', fontFamily: 'var(--font-sans)' }}>
                                            Will fire once today, then automatically turn off.
                                        </div>
                                    )}
                                </div>

                            </div>
                        )}
                    </div>

                    {/* Private Mode */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', cursor: 'pointer' }}>
                            <input type="checkbox" checked={privateMode} onChange={handlePrivateModeToggle} style={{ marginTop: '0.3rem', width: '18px', height: '18px', accentColor: 'var(--accent-terra)' }} />
                            <div>
                                <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, color: 'var(--ink-0)' }}><i className="bx bx-lock" /> Private Mode</div>
                                <div style={{ fontFamily: 'var(--font-hand)', fontSize: '1rem', color: 'var(--text-secondary)' }}>Hide entry previews on dashboard</div>
                            </div>
                        </label>
                    </div>
                </div>

                {/* Backups & Data */}
                <div className="torn-edge" style={{ background: 'var(--paper-cream)', padding: '2rem', position: 'relative', boxShadow: 'var(--shadow)', transform: 'rotate(2deg)' }}>
                    <div className="tape top-center" style={{ width: '40px' }}></div>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--ink-0)', borderBottom: '2px solid var(--ink-0)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>Archives</h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, color: 'var(--ink-0)' }}>Export Journal</div>
                                <div style={{ fontFamily: 'var(--font-hand)', fontSize: '1rem', color: 'var(--text-secondary)' }}>Download a JSON backup</div>
                            </div>
                            <button onClick={handleExport} className="stamp blue" style={{ cursor: 'pointer', transform: 'rotate(-2deg)' }}>
                                <i className="bx bx-download" /> Export
                            </button>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, color: 'var(--ink-0)' }}>Import Journal</div>
                                <div style={{ fontFamily: 'var(--font-hand)', fontSize: '1rem', color: 'var(--text-secondary)' }}>Restore from backup</div>
                            </div>
                            <input type="file" accept=".json" style={{ display: 'none' }} ref={fileInputRef} onChange={handleFileChange} />
                            <button onClick={handleImportClick} disabled={isImporting} className="stamp green" style={{ cursor: 'pointer', transform: 'rotate(1deg)' }}>
                                {isImporting ? <i className="bx bx-loader-alt bx-spin" /> : <i className="bx bx-upload" />} Import
                            </button>
                        </div>
                    </div>
                </div>

                {/* Account */}
                <div style={{ padding: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <button onClick={logout} style={{ background: 'transparent', border: '2px dashed rgba(0,0,0,0.3)', padding: '1rem 2rem', fontFamily: 'var(--font-hand)', fontSize: '1.2rem', color: 'var(--text-muted)', cursor: 'pointer', borderRadius: '4px' }}>
                        <i className="bx bx-log-out" /> Sign out
                    </button>
                </div>

            </div>
        </div>
    );
}
