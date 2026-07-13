import React from 'react';
import { useAuth } from '../context/AuthContext';

const NAV = [
    { section: 'Main' },
    { id: 'dashboard', icon: 'bx-grid-alt', label: 'Dashboard' },
    { id: 'memories', icon: 'bx-book-bookmark', label: 'Memories' },
    { id: 'editor', icon: 'bx-edit-alt', label: 'New Memory' },
    { section: 'AI' },
    { id: 'assistant', icon: 'bx-bot', label: 'AI Assistant' },
    { id: 'insights', icon: 'bx-brain', label: 'AI Insights' },
    { id: 'summary', icon: 'bx-file', label: 'AI Summary' },
    { section: 'Explore' },
    { id: 'analytics', icon: 'bx-line-chart', label: 'Analytics' },
    { id: 'calendar', icon: 'bx-calendar', label: 'Calendar' },
    { id: 'settings', icon: 'bx-cog', label: 'Settings' },
];

export default function Sidebar({ currentView, setCurrentView, open }) {
    const { user, logout } = useAuth();
    const name = user?.name || 'User';
    const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7c6cff&color=fff`;

    return (
        <nav className={`sidebar ${open ? 'open' : ''}`}>
            <div className="logo">
                <i className="bx bxs-book-heart" />
                <span>Smart Diary</span>
            </div>
            <ul className="nav-links">
                {NAV.map((item, i) =>
                    item.section ? (
                        <div key={`s-${i}`} className="nav-section">{item.section}</div>
                    ) : (
                        <li key={item.id}>
                            <a
                                className={currentView === item.id ? 'active' : ''}
                                onClick={(e) => { e.preventDefault(); setCurrentView(item.id); }}
                            >
                                <i className={`bx ${item.icon}`} /> <span>{item.label}</span>
                            </a>
                        </li>
                    )
                )}
            </ul>
            <div className="sidebar-footer">
                <img className="avatar" src={avatar} alt={name} />
                <div className="who">
                    <div className="n">{name}</div>
                    <div className="e">{user?.email || ''}</div>
                </div>
                <i className="bx bx-log-out logout" title="Log out" onClick={logout} />
            </div>
        </nav>
    );
}
