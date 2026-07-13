import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './views/Dashboard';
import Editor from './views/Editor';
import Insights from './views/Insights';
import './index.css';

function App() {
    const [currentView, setCurrentView] = useState('dashboard');

    const renderView = () => {
        switch (currentView) {
            case 'dashboard':
                return <Dashboard setCurrentView={setCurrentView} />;
            case 'editor':
                return <Editor setCurrentView={setCurrentView} />;
            case 'insights':
                return <Insights />;
            case 'memories':
                return <Dashboard setCurrentView={setCurrentView} />; // Placeholder
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
                    <div className="user-profile">
                        <img src="https://ui-avatars.com/api/?name=User&background=6c5ce7&color=fff" alt="User" style={{ width: '44px', height: '44px', borderRadius: '50%', border: '2px solid var(--accent-primary)', cursor: 'pointer' }} />
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
