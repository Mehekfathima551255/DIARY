import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { moodMeta } from '../lib/demo';
import MemoryDetail from './MemoryDetail';

function getStarStyle(id) {
    // Deterministic pseudo-random position based on ID seed
    const seedX = Math.sin(id * 12.9898) * 43758.5453;
    const seedY = Math.cos(id * 78.233) * 43758.5453;
    const left = Math.floor((seedX - Math.floor(seedX)) * 80) + 10; // 10% to 90%
    const top = Math.floor((seedY - Math.floor(seedY)) * 60) + 20;  // 20% to 80%
    
    // Choose a size and animation delay
    const size = ((id % 3) * 0.4) + 1.2; // 1.2rem to 2.0rem
    const delay = (id % 5) * 0.4;
    return { left: `${left}%`, top: `${top}%`, fontSize: `${size}rem`, animationDelay: `${delay}s` };
}

export default function Favourites() {
    const [memories, setMemories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [viewDetail, setViewDetail] = useState(false);

    const loadFavs = async () => {
        setLoading(true);
        try {
            const data = await api.getMemories();
            setMemories(data.filter((m) => m.favorite));
        } catch (err) {
            console.error('Failed to load favorites', err);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadFavs();
    }, []);

    // Handle delete inside the detail view
    const handleDeleted = () => {
        setSelected(null);
        setViewDetail(false);
        loadFavs();
    };

    if (viewDetail && selected) {
        return (
            <MemoryDetail
                memory={selected}
                onBack={() => setViewDetail(false)}
                onDeleted={handleDeleted}
            />
        );
    }

    return (
        <div className="fav-root">
            <div className="between" style={{ marginBottom: '1.5rem' }}>
                <span className="muted">Hover and click golden stars in the night sky to revisit your favorite memories.</span>
                <span className="stamp red" style={{ transform: 'rotate(1deg)' }}>★ Stars in the Sky</span>
            </div>

            {/* ── Starry Sky Canvas ── */}
            <div className="fav-sky">
                {/* Nebula backdrop decoration */}
                <div className="fav-nebula nebula-1" />
                <div className="fav-nebula nebula-2" />

                {loading ? (
                    <div className="fav-loading">
                        <i className="bx bx-loader-alt bx-spin" />
                        <span>Painting the night sky…</span>
                    </div>
                ) : memories.length === 0 ? (
                    <div className="fav-empty">
                        <i className="bx bx-star" style={{ fontSize: '3rem', color: '#D7A73E', opacity: 0.5 }} />
                        <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.3rem', marginTop: '1rem' }}>
                            Your sky is quiet. Star a memory in your journal to make it shine here!
                        </p>
                    </div>
                ) : (
                    memories.map((m) => {
                        const style = getStarStyle(m.id);
                        const mm = moodMeta(m.mood);
                        const isClicked = selected?.id === m.id;
                        return (
                            <button
                                key={m.id}
                                className={`fav-star-btn ${isClicked ? 'active' : ''}`}
                                style={style}
                                onClick={() => setSelected(m)}
                                title={m.title}
                            >
                                <i className="bx bxs-star fav-star-icon" />
                                <span className="fav-star-glow" />
                                <span className="fav-star-tooltip">
                                    {mm.emoji} {m.title}
                                </span>
                            </button>
                        );
                    })
                )}
            </div>

            {/* ── Polaroid preview of the selected star ── */}
            {selected && !loading && (
                <div className="fav-preview-container animate-fade-in">
                    <div className="polaroid fav-polaroid">
                        <div className="tape top-center" />
                        <button className="fav-close-btn" onClick={() => setSelected(null)}>
                            <i className="bx bx-x" />
                        </button>
                        
                        <div className="fav-polaroid-inner">
                            <div className="fav-meta">
                                <span>{new Date(selected.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                <span className="stamp black">{moodMeta(selected.mood).emoji} {selected.mood || 'Neutral'}</span>
                            </div>

                            <h3 className="fav-title">{selected.title}</h3>
                            
                            <div 
                                className="fav-snippet"
                                dangerouslySetInnerHTML={{ __html: (selected.content || '').slice(0, 180) + ((selected.content || '').length > 180 ? '…' : '') }}
                            />

                            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.25rem' }}>
                                <button className="btn btn-primary" onClick={() => setViewDetail(true)}>
                                    <i className="bx bx-book-open" /> Read Full Page
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
