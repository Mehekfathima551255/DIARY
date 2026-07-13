import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
    const { user, logout } = useAuth();
    const [name, setName] = useState(user?.name || '');
    const [email] = useState(user?.email || '');
    
    // Reminders State
    const [remindersEnabled, setRemindersEnabled] = useState(false);
    const [reminderTime, setReminderTime] = useState('20:00'); // Default 8 PM
    const [permissionStatus, setPermissionStatus] = useState(Notification.permission);

    useEffect(() => {
        const storedEnabled = localStorage.getItem('sd_reminders_enabled') === 'true';
        const storedTime = localStorage.getItem('sd_reminder_time');
        if (storedEnabled) setRemindersEnabled(true);
        if (storedTime) setReminderTime(storedTime);
    }, []);

    const handleReminderToggle = async (e) => {
        const isChecked = e.target.checked;
        
        if (isChecked) {
            if (Notification.permission !== 'granted') {
                const permission = await Notification.requestPermission();
                setPermissionStatus(permission);
                if (permission !== 'granted') {
                    alert("Please allow notifications in your browser to use daily reminders.");
                    return;
                }
            }
        }
        
        setRemindersEnabled(isChecked);
        localStorage.setItem('sd_reminders_enabled', isChecked);
    };

    const handleTimeChange = (e) => {
        const time = e.target.value;
        setReminderTime(time);
        localStorage.setItem('sd_reminder_time', time);
    };

    const testNotification = () => {
        if (Notification.permission === 'granted') {
            new Notification('Smart Diary', {
                body: "This is a test reminder. Time to reflect on your day! 📔",
                icon: "https://cdn-icons-png.flaticon.com/512/3238/3238015.png" // placeholder book icon
            });
        } else {
            alert('Notification permission not granted.');
        }
    };

    return (
        <div style={{ maxWidth: 620, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="card">
                <div className="card-head"><span className="card-title">Profile</span></div>
                <label className="field-label">Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} />
                <label className="field-label" style={{ marginTop: '1rem' }}>Email</label>
                <input value={email} disabled />
                <button className="btn btn-primary" style={{ marginTop: '1rem' }}><i className="bx bx-check" /> Save changes</button>
            </div>

            <div className="card">
                <div className="card-head"><span className="card-title">Preferences</span></div>
                
                {/* Dark Theme */}
                <div className="between" style={{ padding: '.7rem 0', borderBottom: '1px solid var(--border-color)' }}>
                    <div className="flex-center gap"><i className="bx bx-moon" style={{ fontSize: '1.3rem', color: 'var(--accent-primary)' }} />
                        <div><div style={{ fontWeight: 500 }}>Dark theme</div><div className="muted" style={{ fontSize: '.8rem' }}>Always on for that cozy journaling vibe</div></div>
                    </div>
                    <label style={{ position: 'relative', display: 'inline-block', width: 40 }}>
                        <input type="checkbox" defaultChecked style={{ width: 'auto', accentColor: 'var(--accent-primary)' }} disabled />
                    </label>
                </div>

                {/* Daily Reminders */}
                <div className="between" style={{ padding: '.7rem 0', borderBottom: '1px solid var(--border-color)' }}>
                    <div className="flex-center gap"><i className="bx bx-bell" style={{ fontSize: '1.3rem', color: 'var(--accent-primary)' }} />
                        <div>
                            <div style={{ fontWeight: 500 }}>Daily reminders</div>
                            <div className="muted" style={{ fontSize: '.8rem' }}>Get nudged to write every evening</div>
                            {remindersEnabled && permissionStatus === 'granted' && (
                                <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input type="time" value={reminderTime} onChange={handleTimeChange} style={{ padding: '0.2rem 0.5rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '4px', color: 'var(--text-primary)' }} />
                                    <button onClick={testNotification} className="btn btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}>Test</button>
                                </div>
                            )}
                            {permissionStatus === 'denied' && (
                                <div style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.25rem' }}>Notifications blocked by browser.</div>
                            )}
                        </div>
                    </div>
                    <label style={{ position: 'relative', display: 'inline-block', width: 40, alignSelf: 'flex-start', marginTop: '0.5rem' }}>
                        <input type="checkbox" checked={remindersEnabled} onChange={handleReminderToggle} style={{ width: 'auto', accentColor: 'var(--accent-primary)' }} />
                    </label>
                </div>

                {/* Private Mode */}
                <div className="between" style={{ padding: '.7rem 0', borderBottom: '1px solid var(--border-color)' }}>
                    <div className="flex-center gap"><i className="bx bx-lock" style={{ fontSize: '1.3rem', color: 'var(--accent-primary)' }} />
                        <div><div style={{ fontWeight: 500 }}>Private mode</div><div className="muted" style={{ fontSize: '.8rem' }}>Hide entry previews on the dashboard</div></div>
                    </div>
                    <label style={{ position: 'relative', display: 'inline-block', width: 40 }}>
                        <input type="checkbox" style={{ width: 'auto', accentColor: 'var(--accent-primary)' }} />
                    </label>
                </div>
            </div>

            <div className="card">
                <div className="card-head"><span className="card-title">Account</span></div>
                <button className="btn btn-secondary" onClick={logout}><i className="bx bx-log-out" /> Log out</button>
            </div>
        </div>
    );
}
