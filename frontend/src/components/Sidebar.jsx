import React from 'react';
import { useAuth } from '../context/AuthContext';

const NAV = [
    { section: 'Main' },
    { id: 'dashboard', icon: 'bx-grid-alt',       label: 'Dashboard',  doodle: '📋' },
    { id: 'memories',  icon: 'bx-book-bookmark',   label: 'Memories',   doodle: '📖' },
    { id: 'editor',    icon: 'bx-edit-alt',         label: 'New Memory', doodle: '✏️' },
    { section: 'AI' },
    { id: 'assistant', icon: 'bx-bot',              label: 'AI Assistant', doodle: '🤖' },
    { id: 'insights',  icon: 'bx-brain',            label: 'AI Insights',  doodle: '🧠' },
    { id: 'summary',   icon: 'bx-file',             label: 'AI Summary',   doodle: '📄' },
    { section: 'Explore' },
    { id: 'analytics', icon: 'bx-line-chart',       label: 'Analytics', doodle: '📊' },
    { id: 'calendar',  icon: 'bx-calendar',         label: 'Calendar',  doodle: '🗓️' },
    { id: 'settings',  icon: 'bx-cog',              label: 'Settings',  doodle: '⚙️' },
];

/* Deterministic "random" tilt per item so it looks hand-placed */
const TILTS = [-1.2, 0.8, -0.5, 1.5, -0.9, 0.6, -1.8, 1.1, -0.4, 0.9, -1.3];

export default function Sidebar({ currentView, setCurrentView, open }) {
    const { user, logout } = useAuth();
    const name   = user?.name  || 'User';
    const email  = user?.email || '';
    const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=c8391a&color=fdfaf5&bold=true`;

    let itemIdx = 0;

    return (
        <nav className={`sidebar scrapbook-sidebar ${open ? 'open' : ''}`}>
            {/* ── Spiral binding holes ─────────────────────────── */}
            <div className="sb-spirals" aria-hidden="true">
                {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="sb-spiral-hole" />
                ))}
            </div>

            {/* ── Masthead / Logo ──────────────────────────────── */}
            <div className="sb-logo-wrap">
                {/* Red washi tape strip across the top */}
                <div className="sb-tape sb-tape--top" aria-hidden="true" />
                <div className="sb-logo">
                    <div className="sb-logo-stamp">
                        <i className="bx bxs-book-heart" />
                    </div>
                    <div className="sb-logo-text">
                        <span className="sb-logo-title">Smart Diary</span>
                        <span className="sb-logo-sub">est. 2024</span>
                    </div>
                </div>
            </div>

            {/* ── Navigation links ─────────────────────────────── */}
            <ul className="sb-nav">
                {NAV.map((item, i) => {
                    if (item.section) {
                        return (
                            <li key={`sec-${i}`} className="sb-section-label">
                                <span className="sb-section-tape" aria-hidden="true" />
                                <span>{item.section}</span>
                            </li>
                        );
                    }

                    const tilt = TILTS[itemIdx % TILTS.length];
                    itemIdx++;
                    const isActive = currentView === item.id;

                    return (
                        <li key={item.id} className="sb-nav-item">
                            <a
                                className={`sb-nav-link ${isActive ? 'sb-active' : ''}`}
                                style={{ '--item-tilt': `${tilt}deg` }}
                                onClick={(e) => { e.preventDefault(); setCurrentView(item.id); }}
                                title={item.label}
                            >
                                {/* Active = sticky note style; inactive = plain tab */}
                                <span className="sb-nav-icon">
                                    <i className={`bx ${item.icon}`} />
                                </span>
                                <span className="sb-nav-label">{item.label}</span>
                                {isActive && (
                                    <span className="sb-active-dot" aria-hidden="true" />
                                )}
                            </a>
                        </li>
                    );
                })}
            </ul>

            {/* ── Decorative doodle divider ─────────────────────── */}
            <div className="sb-doodle-rule" aria-hidden="true">
                <span>✦</span>
                <span>✦</span>
                <span>✦</span>
            </div>

            {/* ── User profile card ─────────────────────────────── */}
            <div className="sb-profile-card">
                {/* Paper tape accent on the card */}
                <div className="sb-tape sb-tape--profile" aria-hidden="true" />
                <img className="sb-avatar" src={avatar} alt={name} />
                <div className="sb-profile-info">
                    <div className="sb-profile-name">{name}</div>
                    <div className="sb-profile-email">{email}</div>
                </div>
                <button
                    className="sb-logout-btn"
                    title="Log out"
                    onClick={logout}
                    aria-label="Log out"
                >
                    <i className="bx bx-log-out" />
                </button>
            </div>
        </nav>
    );
}
