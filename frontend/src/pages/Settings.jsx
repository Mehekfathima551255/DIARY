import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

export default function Settings() {
    const { user, logout } = useAuth();
    const [name, setName]         = useState(user?.name || '');
    const [email]                 = useState(user?.email || '');
    const [savingProfile, setSavingProfile] = useState(false);
    const [profileNote, setProfileNote]     = useState('');

    const [remindersEnabled, setRemindersEnabled] = useState(false);
    const [reminderTime, setReminderTime]         = useState('20:00');
    const [reminderMessage, setReminderMessage]   = useState('Time to reflect on your day! 📔');
    const [reminderSchedule, setReminderSchedule] = useState('everyday');
    const [reminderDays, setReminderDays]         = useState([1,2,3,4,5]);

    const fileInputRef  = useRef(null);
    const [isImporting, setIsImporting] = useState(false);

    useEffect(() => {
        const storedEnabled  = localStorage.getItem('sd_reminders_enabled') === 'true';
        const storedTime     = localStorage.getItem('sd_reminder_time');
        const storedMsg      = localStorage.getItem('sd_reminder_msg');
        const storedSchedule = localStorage.getItem('sd_reminder_schedule');
        const storedDays     = localStorage.getItem('sd_reminder_days');
        if (storedEnabled)  setRemindersEnabled(true);
        if (storedTime)     setReminderTime(storedTime);
        if (storedMsg)      setReminderMessage(storedMsg);
        if (storedSchedule) setReminderSchedule(storedSchedule);
        if (storedDays)     { try { setReminderDays(JSON.parse(storedDays)); } catch {} }
    }, []);

    /* ── Profile save ── */
    const handleSaveProfile = async () => {
        if (!name.trim()) { setProfileNote('Name cannot be empty.'); return; }
        setSavingProfile(true); setProfileNote('');
        try {
            await api.updateProfile(name.trim());
            setProfileNote('✓ Profile saved!');
            setTimeout(() => setProfileNote(''), 2500);
        } catch {
            setProfileNote('Failed to save. Please try again.');
        } finally {
            setSavingProfile(false);
        }
    };

    /* ── Reminders ── */
    const handleReminderToggle = (e) => {
        const v = e.target.checked;
        setRemindersEnabled(v);
        localStorage.setItem('sd_reminders_enabled', v);
    };
    const handleTimeChange = (e) => {
        setReminderTime(e.target.value);
        localStorage.setItem('sd_reminder_time', e.target.value);
    };
    const handleMessageChange = (e) => {
        setReminderMessage(e.target.value);
        localStorage.setItem('sd_reminder_msg', e.target.value);
    };
    const handleScheduleChange = (s) => {
        setReminderSchedule(s);
        localStorage.setItem('sd_reminder_schedule', s);
        if (s !== 'today') localStorage.removeItem('sd_reminder_today_fired');
    };
    const toggleDay = (day) => {
        const updated = reminderDays.includes(day)
            ? reminderDays.filter((d) => d !== day)
            : [...reminderDays, day];
        setReminderDays(updated);
        localStorage.setItem('sd_reminder_days', JSON.stringify(updated));
    };
    const testReminder = () => {
        window.dispatchEvent(new CustomEvent('sd_test_reminder', {
            detail: { message: reminderMessage || 'Time to reflect on your day! 📔' },
        }));
    };

    /* ── Export / Import ── */
    const handleExport = async () => {
        try { await api.exportMemories(); }
        catch (err) { alert('Export failed: ' + err.message); }
    };
    const handleImportClick = () => fileInputRef.current?.click();
    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsImporting(true);
        try {
            await api.importMemories(file);
            alert('Imported successfully! Reloading…');
            window.location.reload();
        } catch (err) {
            alert('Import failed: ' + err.message);
            setIsImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'grid', gap: '2rem', padding: '1rem' }}>

            {/* Header */}
            <div className="torn-edge" style={{ background: 'var(--paper-cream)', padding: '1.5rem', textAlign: 'center', position: 'relative', transform: 'rotate(-1deg)', boxShadow: 'var(--shadow)' }}>
                <div className="tape top-center" />
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--ink-0)', margin: 0 }}>Journal Settings</h2>
                <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.2rem', color: 'var(--text-muted)', margin: '0.5rem 0 0' }}>Manage your preferences and backups.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>

                {/* ── Profile ── */}
                <div className="torn-edge" style={{ background: 'var(--paper-0)', padding: '2rem', position: 'relative', boxShadow: 'var(--shadow)', transform: 'rotate(1deg)' }}>
                    <div className="tape top-left" style={{ width: '40px' }} />
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--ink-0)', borderBottom: '2px solid var(--ink-0)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>Profile</h3>

                    <label style={{ fontFamily: 'var(--font-sans)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Name</label>
                    <input
                        value={name} onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveProfile()}
                        style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px dashed var(--border-mid)', fontFamily: 'var(--font-hand)', fontSize: '1.2rem', color: 'var(--ink-0)', padding: '0.5rem 0', marginBottom: '1.5rem', outline: 'none' }}
                    />

                    <label style={{ fontFamily: 'var(--font-sans)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Email</label>
                    <input
                        value={email} disabled
                        style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px dashed var(--border-mid)', fontFamily: 'var(--font-hand)', fontSize: '1.2rem', color: 'var(--text-muted)', padding: '0.5rem 0', marginBottom: '1.5rem', outline: 'none' }}
                    />

                    <button
                        onClick={handleSaveProfile}
                        disabled={savingProfile}
                        style={{ background: 'var(--accent-terra)', color: '#fff', border: 'none', borderRadius: '4px', padding: '0.75rem 1rem', fontFamily: 'var(--font-hand)', fontSize: '1.1rem', cursor: 'pointer', transform: 'rotate(-2deg)' }}
                    >
                        {savingProfile ? <><i className="bx bx-loader-alt bx-spin" /> Saving…</> : <><i className="bx bx-check" /> Save Changes</>}
                    </button>

                    {profileNote && (
                        <div style={{ marginTop: '0.75rem', fontFamily: 'var(--font-hand)', fontSize: '1rem', color: profileNote.startsWith('✓') ? 'var(--accent-olive)' : 'var(--danger)' }}>
                            {profileNote}
                        </div>
                    )}
                </div>

                {/* ── Reminders ── */}
                <div className="sticky-note yellow" style={{ padding: '2rem', position: 'relative', transform: 'rotate(-1deg)' }}>
                    <div className="pin" />
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--ink-0)', borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>Reminders</h3>

                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', cursor: 'pointer', marginBottom: '1rem' }}>
                        <input type="checkbox" checked={remindersEnabled} onChange={handleReminderToggle} style={{ marginTop: '0.3rem', width: '18px', height: '18px', accentColor: 'var(--accent-terra)' }} />
                        <div>
                            <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, color: 'var(--ink-0)' }}><i className="bx bx-bell" /> Enable daily reminder</div>
                            <div style={{ fontFamily: 'var(--font-hand)', fontSize: '1rem', color: 'var(--text-secondary)' }}>Get nudged to write on your schedule</div>
                        </div>
                    </label>

                    {remindersEnabled && (
                        <div style={{ marginLeft: '2rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input type="time" value={reminderTime} onChange={handleTimeChange}
                                    style={{ background: 'transparent', border: '1px solid rgba(0,0,0,0.2)', padding: '0.2rem 0.5rem', fontFamily: 'var(--font-mono)' }} />
                                <button onClick={testReminder}
                                    style={{ background: 'transparent', border: '1px solid rgba(0,0,0,0.3)', padding: '0.2rem 0.6rem', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '0.78rem', borderRadius: '4px' }}>
                                    Preview
                                </button>
                            </div>

                            <input type="text" value={reminderMessage} onChange={handleMessageChange}
                                placeholder="Custom reminder message..."
                                style={{ background: 'transparent', border: 'none', borderBottom: '1px dashed rgba(0,0,0,0.3)', fontFamily: 'var(--font-hand)', fontSize: '1rem', outline: 'none', padding: '0.2rem 0' }} />

                            <div>
                                <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(0,0,0,0.45)', marginBottom: '0.5rem' }}>Repeat</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                    {[{ key: 'everyday', label: 'Every day' }, { key: 'weekdays', label: 'Mon – Fri' }, { key: 'weekends', label: 'Sat & Sun' }, { key: 'today', label: 'Only today' }, { key: 'custom', label: 'Custom…' }].map(({ key, label }) => (
                                        <button key={key} onClick={() => handleScheduleChange(key)}
                                            style={{ padding: '0.25rem 0.7rem', borderRadius: '20px', border: reminderSchedule === key ? '1.5px solid #c0392b' : '1px solid rgba(0,0,0,0.22)', background: reminderSchedule === key ? '#c0392b' : 'transparent', color: reminderSchedule === key ? '#fff' : 'rgba(0,0,0,0.65)', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'var(--font-sans)', fontWeight: reminderSchedule === key ? 700 : 400, transition: 'all 0.15s' }}>
                                            {label}
                                        </button>
                                    ))}
                                </div>
                                {reminderSchedule === 'custom' && (
                                    <div style={{ marginTop: '0.6rem', display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                                        {['S','M','T','W','T','F','S'].map((d, i) => {
                                            const active = reminderDays.includes(i);
                                            return (
                                                <button key={i} onClick={() => toggleDay(i)}
                                                    title={['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][i]}
                                                    style={{ width: 32, height: 32, borderRadius: '50%', border: active ? '1.5px solid #c0392b' : '1px solid rgba(0,0,0,0.2)', background: active ? '#c0392b' : 'transparent', color: active ? '#fff' : 'rgba(0,0,0,0.55)', cursor: 'pointer', fontSize: '0.78rem', fontFamily: 'var(--font-sans)', fontWeight: 700, transition: 'all 0.15s' }}>
                                                    {d}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                                {reminderSchedule === 'today' && (
                                    <div style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: 'rgba(0,0,0,0.45)', fontFamily: 'var(--font-sans)' }}>
                                        Fires once today, then turns off automatically.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Archives ── */}
                <div className="torn-edge" style={{ background: 'var(--paper-cream)', padding: '2rem', position: 'relative', boxShadow: 'var(--shadow)', transform: 'rotate(2deg)' }}>
                    <div className="tape top-center" style={{ width: '40px' }} />
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

                {/* ── Sign out ── */}
                <div style={{ padding: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <button onClick={logout} style={{ background: 'transparent', border: '2px dashed rgba(0,0,0,0.3)', padding: '1rem 2rem', fontFamily: 'var(--font-hand)', fontSize: '1.2rem', color: 'var(--text-muted)', cursor: 'pointer', borderRadius: '4px' }}>
                        <i className="bx bx-log-out" /> Sign out
                    </button>
                </div>
            </div>
        </div>
    );
}
