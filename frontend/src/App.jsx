import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Memories from './pages/Memories';
import Editor from './pages/Editor';
import Analytics from './pages/Analytics';
import Calendar from './pages/Calendar';
import Assistant from './pages/Assistant';
import Insights from './pages/Insights';
import Summary from './pages/Summary';
import Settings from './pages/Settings';
import Chat from './pages/Chat';
import ReminderService from './components/ReminderService';
import './index.css';

const META = {
    dashboard: { title: 'Dashboard', sub: 'Welcome back — here is your journaling overview.' },
    memories: { title: 'My Memories', sub: 'Every moment you have captured.' },
    editor: { title: 'New Memory', sub: 'Write down what is on your mind.' },
    assistant: { title: 'AI Assistant', sub: 'Ask anything about your diary.' },
    chat: { title: 'Ask AI', sub: 'Chat with your diary.' },
    insights: { title: 'AI Insights', sub: 'What your journal reveals about you.' },
    summary: { title: 'AI Summary', sub: 'Turn long entries into a clean summary.' },
    analytics: { title: 'Analytics', sub: 'Your moods and writing, visualized.' },
    calendar: { title: 'Calendar', sub: 'Your writing across the month.' },
    settings: { title: 'Settings', sub: 'Manage your account and preferences.' },
};

function Shell() {
    const { user, loading, logout } = useAuth();
    const [currentView, setCurrentView] = useState('dashboard');
    const [navOpen, setNavOpen] = useState(false);

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)' }}>
                <i className='bx bx-loader-alt bx-spin' style={{ fontSize: '3rem', color: 'var(--accent-primary)' }}></i>
            </div>
        );
    }

    if (!user) return <Login />;

    const go = (v) => { setCurrentView(v); setNavOpen(false); };

    const renderView = () => {
        switch (currentView) {
            case 'dashboard': return <Dashboard go={go} />;
            case 'memories': return <Memories go={go} />;
            case 'editor': return <Editor go={go} />;
            case 'assistant': return <Assistant />;
            case 'chat': return <Chat />;
            case 'insights': return <Insights />;
            case 'summary': return <Summary />;
            case 'analytics': return <Analytics />;
            case 'calendar': return <Calendar />;
            case 'settings': return <Settings />;
            default: return <Dashboard go={go} />;
        }
    };

    const meta = META[currentView] || { title: currentView, sub: '' };
    const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=7c6cff&color=fff`;

    return (
        <div className="app-container">
            <ReminderService />
            <Sidebar currentView={currentView} setCurrentView={go} open={navOpen} />
            <main className="main-content">
                <header className="topbar">
                    <div>
                        <h2>{meta.title}</h2>
                        <div className="sub">{meta.sub}</div>
                    </div>
                    <div className="topbar-actions">
                        <button className="icon-btn" title="New memory" onClick={() => go('editor')}>
                            <i className="bx bx-plus" />
                        </button>
                        <button className="icon-btn" title="Notifications"><i className="bx bx-bell" /></button>
                        <div className="user-chip">
                            <img src={avatar} alt={user.name} />
                            <span>{user.name}</span>
                        </div>
                        <button onClick={logout} className="icon-btn" style={{ background: 'transparent', color: 'var(--text-secondary)' }} title="Logout">
                            <i className='bx bx-log-out' style={{ fontSize: '1.25rem' }}></i>
                        </button>
                    </div>
                </header>
                <div className="view-container">{renderView()}</div>
            </main>
        </div>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <Shell />
        </AuthProvider>
    );
}
