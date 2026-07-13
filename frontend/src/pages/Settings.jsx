import React, { useState } from 'react';
import { useAuth } from '../auth';

export default function Settings() {
    const { user, logout } = useAuth();
    const [name, setName] = useState(user?.name || '');
    const [email] = useState(user?.email || '');

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
                {[
                    ['bx-moon', 'Dark theme', 'Always on for that cozy journaling vibe'],
                    ['bx-bell', 'Daily reminders', 'Get nudged to write every evening'],
                    ['bx-lock', 'Private mode', 'Hide entry previews on the dashboard'],
                ].map(([icon, title, desc]) => (
                    <div className="between" key={title} style={{ padding: '.7rem 0', borderBottom: '1px solid var(--border-color)' }}>
                        <div className="flex-center gap"><i className={`bx ${icon}`} style={{ fontSize: '1.3rem', color: 'var(--accent-primary)' }} />
                            <div><div style={{ fontWeight: 500 }}>{title}</div><div className="muted" style={{ fontSize: '.8rem' }}>{desc}</div></div>
                        </div>
                        <label style={{ position: 'relative', display: 'inline-block', width: 40 }}>
                            <input type="checkbox" defaultChecked style={{ width: 'auto', accentColor: 'var(--accent-primary)' }} />
                        </label>
                    </div>
                ))}
            </div>

            <div className="card">
                <div className="card-head"><span className="card-title">Account</span></div>
                <button className="btn btn-secondary" onClick={logout}><i className="bx bx-log-out" /> Log out</button>
            </div>
        </div>
    );
}
