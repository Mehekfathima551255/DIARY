import React, { useState, useEffect } from 'react';
import { api } from '../api';

export default function Memories({ setCurrentView }) {
    const [memories, setMemories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all'); // all, favorite, mood, tag
    const [filterValue, setFilterValue] = useState('');
    const [sortBy, setSortBy] = useState('newest');

    const fetchMemories = async () => {
        setLoading(true);
        setError('');
        try {
            let data = [];
            
            if (searchQuery.trim()) {
                data = await api.searchMemories(searchQuery);
            } else if (filterType === 'favorite') {
                data = await api.getFavoriteMemories();
            } else if (filterType === 'mood' && filterValue) {
                data = await api.getMemoriesByMood(filterValue);
            } else if (filterType === 'tag' && filterValue) {
                data = await api.getMemoriesByTag(filterValue);
            } else {
                data = await api.getMemories();
            }

            // Apply manual sorting since backend doesn't have an explicit sort endpoint
            if (sortBy === 'newest') {
                data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            } else if (sortBy === 'oldest') {
                data.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            } else if (sortBy === 'title') {
                data.sort((a, b) => a.title.localeCompare(b.title));
            }

            setMemories(data);
        } catch (err) {
            console.error("Failed to fetch memories:", err);
            setError("Failed to load memories.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Debounce search
        const timeoutId = setTimeout(() => {
            fetchMemories();
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [searchQuery, filterType, filterValue, sortBy]);

    const handleFavoriteToggle = async (id, currentStatus) => {
        try {
            await api.updateMemory(id, { favorite: !currentStatus });
            fetchMemories(); // Refresh list to reflect state
        } catch (error) {
            alert("Failed to update favorite status.");
        }
    };

    return (
        <div className="memories-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Search and Filter Controls */}
            <div className="card glass" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ flex: '1', minWidth: '250px', position: 'relative' }}>
                    <i className='bx bx-search' style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}></i>
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search memories..." 
                        style={{ width: '100%', paddingLeft: '2.5rem' }}
                    />
                </div>
                
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <select value={filterType} onChange={(e) => { setFilterType(e.target.value); setFilterValue(''); }}>
                        <option value="all">All Memories</option>
                        <option value="favorite">Favorites Only</option>
                        <option value="mood">Filter by Mood</option>
                        <option value="tag">Filter by Tag</option>
                    </select>

                    {filterType === 'mood' && (
                        <select value={filterValue} onChange={(e) => setFilterValue(e.target.value)}>
                            <option value="">Select Mood</option>
                            <option value="Happy">Happy</option>
                            <option value="Sad">Sad</option>
                            <option value="Neutral">Neutral</option>
                            <option value="Anxious">Anxious</option>
                            <option value="Excited">Excited</option>
                            <option value="Angry">Angry</option>
                        </select>
                    )}

                    {filterType === 'tag' && (
                        <input 
                            type="text" 
                            value={filterValue} 
                            onChange={(e) => setFilterValue(e.target.value)} 
                            placeholder="Enter tag (e.g. work)"
                            style={{ width: '150px' }}
                        />
                    )}

                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                        <option value="newest">Sort: Newest</option>
                        <option value="oldest">Sort: Oldest</option>
                        <option value="title">Sort: Title</option>
                    </select>
                </div>
            </div>

            {/* Memories List */}
            {error && <div style={{ color: 'var(--danger)' }}>{error}</div>}
            
            {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}><i className='bx bx-loader-alt bx-spin' style={{ fontSize: '2rem', color: 'var(--accent-primary)' }}></i></div>
            ) : memories.length === 0 ? (
                <div className="card glass" style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-secondary)' }}>
                    <i className='bx bx-ghost' style={{ fontSize: '4rem', marginBottom: '1rem' }}></i>
                    <h3>No memories found</h3>
                    <p>Try adjusting your search or filters.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {memories.map(memory => (
                        <div key={memory.id} className="card glass" style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-heading)', margin: 0 }}>{memory.title}</h3>
                                <button 
                                    onClick={() => handleFavoriteToggle(memory.id, memory.favorite)}
                                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: memory.favorite ? 'var(--danger)' : 'var(--text-secondary)' }}
                                >
                                    <i className={memory.favorite ? 'bx bxs-heart' : 'bx bx-heart'}></i>
                                </button>
                            </div>
                            
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <span><i className='bx bx-calendar'></i> {new Date(memory.created_at).toLocaleDateString()}</span>
                                {memory.location && <span><i className='bx bx-map'></i> {memory.location}</span>}
                                {memory.weather && <span><i className='bx bx-cloud'></i> {memory.weather}</span>}
                            </div>
                            
                            <p style={{ flex: '1', color: 'var(--text-primary)', marginBottom: '1rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                                {memory.content}
                            </p>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                                <span style={{ background: 'rgba(108, 92, 231, 0.1)', color: 'var(--accent-primary)', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 500 }}>
                                    {memory.mood}
                                </span>
                                {memory.tags && (
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                        {memory.tags.split(',').slice(0, 2).map(t => `#${t.trim()}`).join(' ')}
                                        {memory.tags.split(',').length > 2 && ' ...'}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
