import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Memories from './pages/Memories';
import Editor from './pages/Editor';
import Calendar from './pages/Calendar';
import Assistant from './pages/Assistant';
import Insights from './pages/Insights';
import Summary from './pages/Summary';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';
import Favourites from './pages/Favourites';
import Reminders from './pages/Reminders';
import ReminderService from './components/ReminderService';
import NotificationBell from './components/NotificationBell';
import './index.css';

const META = {
    dashboard:     { title: 'Dashboard',       sub: 'Welcome back — here is your journaling overview.' },
    memories:      { title: 'My Memories',      sub: 'Every moment you have captured.' },
    favourites:    { title: 'Starred Sky',      sub: 'Your most cherished memories, shining bright.' },
    editor:        { title: 'New Memory',       sub: 'Write down what is on your mind.' },
    assistant:     { title: 'AI Assistant',     sub: 'Ask anything about your diary.' },
    insights:      { title: 'AI Insights',      sub: 'What your journal reveals about you.' },
    summary:       { title: 'AI Summary',       sub: 'Turn long entries into a clean summary.' },
    calendar:      { title: 'Calendar',         sub: 'Your writing across the month.' },
    reminders:     { title: 'Reminders',        sub: 'Configure notifications to capture your moments.' },
    settings:      { title: 'Settings',         sub: 'Manage your account and preferences.' },
    notifications: { title: 'Notifications',    sub: 'Your alerts, reminders and milestones.' },
};

function Shell() {
    const { user, loading, logout } = useAuth();
    const [currentView, setCurrentView] = useState('dashboard');
    const [navOpen, setNavOpen] = useState(false);
    const [memoriesFilter, setMemoriesFilter] = useState('all'); // 'all' | 'week' | 'month'
    const [privateMode, setPrivateMode] = useState(() => localStorage.getItem('sd_private_mode') === 'true');

    React.useEffect(() => {
        const updatePrivateMode = () => {
            setPrivateMode(localStorage.getItem('sd_private_mode') === 'true');
        };
        window.addEventListener('sd_settings_updated', updatePrivateMode);
        return () => window.removeEventListener('sd_settings_updated', updatePrivateMode);
    }, []);

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)' }}>
                <i className='bx bx-loader-alt bx-spin' style={{ fontSize: '3rem', color: 'var(--accent-primary)' }}></i>
            </div>
        );
    }

    if (!user) return <Login />;

    const [navCount, setNavCount] = useState(0);

    const go = (v, filter) => {
        if (filter) setMemoriesFilter(filter);
        setCurrentView(v);
        setNavOpen(false);
        setNavCount((c) => c + 1); // force remount of pages on every navigation
    };

    const renderView = () => {
        switch (currentView) {
            case 'dashboard': return <Dashboard key={`dash-${navCount}`} go={go} />;
            case 'memories': return <Memories go={go} initialFilter={memoriesFilter} />;
            case 'favourites': return <Favourites key={`fav-${navCount}`} />;
            case 'editor': return <Editor go={go} />;
            case 'assistant': return <Assistant />;
            case 'insights': return <Insights key={`insights-${navCount}`} />;
            case 'summary': return <Summary />;
            case 'calendar':       return <Calendar />;
            case 'reminders':      return <Reminders key={`rem-${navCount}`} />;
            case 'settings':       return <Settings />;
            case 'notifications':  return <Notifications />;
            default:               return <Dashboard key={`dash-${navCount}`} go={go} />;
        }
    };

    const meta = META[currentView] || { title: currentView, sub: '' };
    const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=c8391a&color=fdfaf5&bold=true`;

    return (
        <div className={`app-container ${privateMode ? 'private-mode-active' : ''}`}>
            <ReminderService />
            <Sidebar currentView={currentView} setCurrentView={go} open={navOpen} />
            <main className="main-content">
                <header className="topbar">
                    <div>
                        <h2>{meta.title}</h2>
                        <div className="sub">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                            <span style={{ margin: '0 8px', color: 'var(--border-mid)' }}>|</span>
                            {meta.sub}
                        </div>
                    </div>
                    <div className="topbar-actions">
                        <button className="icon-btn" title="New memory" onClick={() => go('editor')}>
                            <i className="bx bx-plus" />
                        </button>
                        <NotificationBell onNavigate={go} />
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
