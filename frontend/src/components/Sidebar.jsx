import React from 'react';

export default function Sidebar({ currentView, setCurrentView }) {
    const navItems = [
        { id: 'dashboard', icon: 'bx-grid-alt', label: 'Dashboard' },
        { id: 'editor', icon: 'bx-edit-alt', label: 'Write' },
        { id: 'insights', icon: 'bx-brain', label: 'Insights' },
        { id: 'memories', icon: 'bx-library', label: 'Memories' }
    ];

    return (
        <nav className="sidebar">
            <div className="logo">
                <i className='bx bxs-book-heart'></i>
                <span>Smart Diary</span>
            </div>
            <ul className="nav-links">
                {navItems.map(item => (
                    <li key={item.id}>
                        <a 
                            href="#" 
                            className={currentView === item.id ? 'active' : ''}
                            onClick={(e) => { e.preventDefault(); setCurrentView(item.id); }}
                        >
                            <i className={`bx ${item.icon}`}></i> <span>{item.label}</span>
                        </a>
                    </li>
                ))}
            </ul>
            <div className="theme-toggle">
                <i className='bx bx-moon' id="theme-icon"></i>
            </div>
        </nav>
    );
}
