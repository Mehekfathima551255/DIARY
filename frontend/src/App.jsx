import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './views/Dashboard';
import Editor from './views/Editor';
import Insights from './views/Insights';
import Login from './views/Login';
import Memories from './views/Memories';
import Chat from './views/Chat';
import { useAuth } from './context/AuthContext';
import './index.css';

function App() {
    const { user, loading, logout } = useAuth();
    const [currentView, setCurrentView] = useState('dashboard');

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)' }}>
                <i className='bx bx-loader-alt bx-spin' style={{ fontSize: '3rem', color: 'var(--accent-primary)' }}></i>
            </div>
        );
    }

    if (!user) {
        return <Login />;
    }

    const renderView = () => {
        switch (currentView) {
            case 'dashboard':
                return <Dashboard setCurrentView={setCurrentView} />;
            case 'editor':
                return <Editor setCurrentView={setCurrentView} />;
            case 'insights':
                return <Insights />;
            case 'memories':
                return <Memories setCurrentView={setCurrentView} />;
            case 'chat':
                return <Chat />;
            default:
                return <div className="card"><p>View "{currentView}" not found.</p></div>;
        }
    };

    return (
        <div className="app-container">
            <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
            
            <main className="main-content">
                <header className="topbar">
                    <h2 id="page-title" style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 600, letterSpacing: '-0.02em', textTransform: 'capitalize' }}>
                        {currentView}
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button onClick={logout} className="btn" style={{ background: 'transparent', color: 'var(--text-secondary)' }} title="Logout">
                            <i className='bx bx-log-out' style={{ fontSize: '1.25rem' }}></i>
                        </button>
                        <div className="user-profile" title={user.email}>
                            <img 
                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.email)}&background=6c5ce7&color=fff`} 
                                alt="User" 
                                style={{ width: '44px', height: '44px', borderRadius: '50%', border: '2px solid var(--accent-primary)', cursor: 'pointer' }} 
                            />
                        </div>
                    </div>
                </header>

                <div id="view-container" className="view-container">
                    {renderView()}
                </div>
            </main>
        </div>
    );
}

export default App;
