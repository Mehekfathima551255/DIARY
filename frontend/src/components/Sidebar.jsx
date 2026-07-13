import React from 'react';
import { useAuth } from '../context/AuthContext';

const NAV = [
    { section: 'Main' },
    { id: 'dashboard', icon: 'bx-grid-alt',       label: 'Dashboard' },
    { id: 'memories',  icon: 'bx-book-bookmark',   label: 'Memories' },
    { id: 'editor',    icon: 'bx-edit-alt',         label: 'New Memory' },
    { section: 'AI' },
    { id: 'assistant', icon: 'bx-bot',              label: 'AI Assistant' },
    { id: 'insights',  icon: 'bx-brain',            label: 'AI Insights' },
    { id: 'summary',   icon: 'bx-file',             label: 'AI Summary' },
    { section: 'Explore' },
    { id: 'analytics', icon: 'bx-line-chart',       label: 'Analytics' },
    { id: 'calendar',  icon: 'bx-calendar',         label: 'Calendar' },
    { id: 'settings',  icon: 'bx-cog',              label: 'Settings' },
];

export default function Sidebar({ currentView, setCurrentView, open }) {
    const { user, logout } = useAuth();
    const name   = user?.name  || 'User';
    const email  = user?.email || '';
    const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=D7A73E&color=fff&bold=true`;

    return (
        <nav className={`sidebar ${open ? 'open' : ''}`}>
            {/* ── Masthead / Logo ── */}
            <div className="sb-logo-wrap">
                <span className="sb-logo-title">Smart Diary</span>
                <span className="sb-logo-sub">My Personal Journal</span>
            </div>

            {/* ── Navigation links ── */}
            <ul className="sb-nav">
                {NAV.map((item, i) => {
                    if (item.section) {
                        return (
                            <li key={`sec-${i}`} className="sb-section-label">
                                {item.section}
                            </li>
                        );
                    }

                    const isActive = currentView === item.id;

                    return (
                        <li key={item.id} className="sb-nav-item">
                            <a
                                className={`sb-nav-link ${isActive ? 'sb-active' : ''}`}
                                onClick={(e) => { e.preventDefault(); setCurrentView(item.id); }}
                                title={item.label}
                            >
                                <i className={`bx ${item.icon}`} />
                                {item.label}
                            </a>
                        </li>
                    );
                })}
            </ul>

            {/* ── User profile card ── */}
            <div className="sb-profile-card">
                <img className="sb-avatar" src={avatar} alt={name} />
                <div style={{ flexGrow: 1 }}>
                    <div className="sb-profile-name">{name}</div>
                    <div className="sb-profile-email">{email}</div>
                </div>
                <button
                    className="icon-btn"
                    style={{ width: '32px', height: '32px', fontSize: '1rem', background: 'transparent', boxShadow: 'none' }}
                    title="Log out"
                    onClick={logout}
                >
                    <i className="bx bx-log-out" />
                </button>
            </div>
        </nav>
    );
}
