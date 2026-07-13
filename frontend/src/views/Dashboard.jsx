import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function Dashboard({ setCurrentView }) {
    const [memories, setMemories] = useState([]);
    const [suggestion, setSuggestion] = useState('Fetching ideas for you...');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const memData = await api.getMemories(0, 5);
                setMemories(memData);

                try {
                    const aiData = await api.getSuggestions();
                    if (aiData && aiData.suggestion) {
                        setSuggestion(aiData.suggestion);
                    } else {
                        setSuggestion('Write about your day today!');
                    }
                } catch (aiErr) {
                    console.error("AI not reachable", aiErr);
                    setSuggestion('Write about your day today!');
                }
            } catch (err) {
                console.error("Error loading dashboard data:", err);
                setError("Error loading data. Is the backend running?");
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    return (
        <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
            <div className="recent-memories">
                <h3 style={{ marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>Recent Entries</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {loading ? (
                        <div className="card"><p>Loading memories...</p></div>
                    ) : error ? (
                        <div className="card" style={{ borderColor: 'var(--danger)' }}><p>{error}</p></div>
                    ) : memories.length > 0 ? (
                        memories.map(memory => (
                            <div key={memory.id} className="card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <strong>{new Date(memory.timestamp).toLocaleDateString()}</strong>
                                    <span style={{ background: 'var(--bg-tertiary)', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.8rem' }}>
                                        {memory.mood}
                                    </span>
                                </div>
                                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.5', fontSize: '0.95rem' }}>
                                    {memory.content.substring(0, 150)}{memory.content.length > 150 ? '...' : ''}
                                </p>
                            </div>
                        ))
                    ) : (
                        <div className="card"><p>No entries yet. Start writing!</p></div>
                    )}
                </div>
            </div>

            <div className="ai-suggestions">
                <div className="card glass">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <i className='bx bx-bulb' style={{ color: 'var(--warning)', fontSize: '1.5rem' }}></i>
                        <h3 style={{ fontFamily: 'var(--font-heading)' }}>AI Inspiration</h3>
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>{suggestion}</p>
                    </div>
                    <button 
                        className="btn btn-primary" 
                        style={{ width: '100%', marginTop: '1.5rem' }} 
                        onClick={() => setCurrentView('editor')}
                    >
                        <i className='bx bx-edit'></i> Start Writing
                    </button>
                </div>
            </div>
        </div>
    );
}
