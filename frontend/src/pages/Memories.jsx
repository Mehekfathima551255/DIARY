import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { moodMeta, MOODS } from '../lib/demo';
import { useTTS } from '../lib/useTTS';

export default function Memories({ go, initialFilter = 'all' }) {
    const [memories, setMemories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');
    const [moodFilter, setMoodFilter] = useState('all');
    const [tagFilter, setTagFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState(initialFilter); // 'all' | 'week' | 'month'

    const { speak, speakingId } = useTTS();

    const load = async () => {
        setLoading(true);
        const data = await api.getMemories();
        setMemories(Array.isArray(data) ? data : []);
        setLoading(false);
    };
    useEffect(() => { load(); }, []);

    const allTags = useMemo(() => {
        const set = new Set();
        memories.forEach((m) => (m.tags || '').split(',').forEach((t) => t.trim() && set.add(t.trim())));
        return [...set];
    }, [memories]);

    const filtered = memories.filter((m) => {
        const q = query.toLowerCase().trim();

        // Build searchable date strings from created_at
        const d = new Date(m.created_at);
        const dateStrings = [
            d.toLocaleDateString('en-US', { month: 'long',  day: 'numeric', year: 'numeric' }),
            d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            d.toLocaleDateString('en-US', { month: 'long',  day: 'numeric' }),
            d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            d.toLocaleDateString('en-US'),
            d.toISOString().slice(0, 10),
            String(d.getFullYear()),
        ].join(' ').toLowerCase();

        const matchesQ    = !q ||
            (m.title + ' ' + m.content + ' ' + (m.tags || '')).toLowerCase().includes(q) ||
            dateStrings.includes(q) ||
            dateStrings.split(' ').some(part => part.startsWith(q));
        const matchesMood = moodFilter === 'all' || m.mood === moodFilter;
        const matchesTag  = tagFilter  === 'all' || (m.tags || '').split(',').map((t) => t.trim()).includes(tagFilter);

        // Date range filter
        let matchesDate = true;
        if (dateFilter === 'week' || dateFilter === 'month') {
            const created = new Date(m.created_at);
            const now     = new Date();
            if (dateFilter === 'week') {
                const weekAgo = new Date(now);
                weekAgo.setDate(now.getDate() - 7);
                matchesDate = created >= weekAgo;
            } else {
                matchesDate =
                    created.getMonth()    === now.getMonth() &&
                    created.getFullYear() === now.getFullYear();
            }
        }

        return matchesQ && matchesMood && matchesTag && matchesDate;
    });

    const toggleFav = async (m) => {
        const updated = { ...m, favorite: !m.favorite };
        setMemories((list) => list.map((x) => (x.id === m.id ? updated : x)));
        try { await api.updateMemory(m.id, { title: m.title, content: m.content, mood: m.mood, tags: m.tags, favorite: updated.favorite }); }
        catch { /* optimistic; ignore */ }
    };

    const remove = async (m) => {
        if (!confirm(`Delete "${m.title}"?`)) return;
        setMemories((list) => list.filter((x) => x.id !== m.id));
        try { await api.deleteMemory(m.id); } catch { /* ignore */ }
    };

    return (
        <div>
            {/* Scrapbook Toolbar */}
            <div style={{
                display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center',
                padding: '1rem', background: 'var(--paper-0)', borderBottom: '1px dashed var(--border-light)',
                marginBottom: '2rem', position: 'relative'
            }}>
                <div className="tape top-center" style={{ width: '40px' }}></div>
                <div style={{ flexGrow: 1, position: 'relative' }}>
                    <i className="bx bx-search" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                        style={{ paddingLeft: '2.5rem', fontFamily: 'var(--font-hand)', fontSize: '1.2rem', width: '100%', maxWidth: '400px', background: 'transparent', border: 'none', borderBottom: '2px solid var(--border-light)' }} 
                        placeholder="Search your journal..."
                        value={query} onChange={(e) => setQuery(e.target.value)} 
                    />
                </div>
                <select value={moodFilter} onChange={(e) => setMoodFilter(e.target.value)} style={{ fontFamily: 'var(--font-hand)', fontSize: '1.1rem', background: 'transparent', border: '1px solid var(--border-light)' }}>
                    <option value="all">All Moods</option>
                    {MOODS.map((m) => <option key={m.key} value={m.key}>{m.emoji} {m.key}</option>)}
                </select>
                <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} style={{ fontFamily: 'var(--font-hand)', fontSize: '1.1rem', background: 'transparent', border: '1px solid var(--border-light)' }}>
                    <option value="all">All Themes</option>
                    {allTags.map((t) => <option key={t} value={t}>#{t}</option>)}
                </select>
                <button 
                    onClick={() => go('editor')}
                    style={{ background: 'var(--accent-terra)', color: '#fff', padding: '0.5rem 1rem', borderRadius: '4px', fontFamily: 'var(--font-hand)', fontSize: '1.1rem', border: 'none', cursor: 'pointer', transform: 'rotate(2deg)' }}
                >
                    <i className="bx bx-plus" /> Write
                </button>
            </div>

            {/* Active date-range filter chip */}
            {dateFilter !== 'all' && (
                <div className="sticky-note" style={{ display: 'inline-block', padding: '0.5rem 1rem', marginBottom: '2rem', transform: 'rotate(-1deg)' }}>
                    <div className="pin"></div>
                    <span style={{ fontSize: '1.1rem' }}>
                        Showing: {dateFilter === 'week'  ? 'This Week'  : 'This Month'}
                    </span>
                    <i className="bx bx-x" style={{ cursor: 'pointer', marginLeft: '0.5rem' }} onClick={() => setDateFilter('all')} />
                </div>
            )}

            {loading ? (
                <div style={{textAlign: 'center', fontFamily: 'var(--font-hand)', fontSize: '1.5rem'}}><span className="spinner"><i className="bx bx-loader-alt bx-spin" /> Gathering pages…</span></div>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 2rem', fontFamily: 'var(--font-hand)', fontSize: '1.5rem' }}>
                    <p>The pages are blank here.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '3rem', padding: '1rem' }}>
                    {filtered.map((m, i) => {
                        const mm = moodMeta(m.mood);
                        const tags = (m.tags || '').split(',').map((t) => t.trim()).filter(Boolean);
                        
                        // Alternate rotations for an organic feel
                        const rotations = ['-3deg', '2deg', '-1deg', '4deg', '-4deg', '1deg'];
                        const rot = rotations[i % rotations.length];
                        const isPolaroid = !!m.image_url;

                        return (
                            <div 
                                key={m.id} 
                                className={isPolaroid ? 'polaroid' : 'torn-edge'} 
                                style={{ 
                                    background: isPolaroid ? '#fff' : 'var(--paper-cream)',
                                    padding: isPolaroid ? '10px 10px 40px 10px' : '1.5rem',
                                    boxShadow: 'var(--shadow)',
                                    transform: `rotate(${rot})`,
                                    position: 'relative',
                                    border: isPolaroid ? '1px solid var(--border-light)' : 'none',
                                }}
                            >
                                <div className="tape top-center"></div>
                                
                                {isPolaroid ? (
                                    <>
                                        <div style={{ width: '100%', height: '200px', background: 'var(--border-light)', overflow: 'hidden' }}>
                                            <img src={api.imageUrl(m.image_url)} alt={m.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                        <div className="caption" style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                            <strong style={{ fontSize: '1.3rem' }}>{m.title}</strong>
                                            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{new Date(m.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--ink-0)', marginBottom: '0.5rem' }}>{m.title}</h4>
                                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                                            {new Date(m.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                        </div>
                                        {/* Display content preview if no image */}
                                        <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {m.content || '...'}
                                        </div>
                                    </>
                                )}

                                {/* Metadata Stamps/Stickers */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: isPolaroid ? '10px' : '0' }}>
                                    <span className="stamp black" style={{ transform: 'rotate(-2deg)' }}>{mm.emoji} {m.mood || 'Neutral'}</span>
                                    {m.location && <span className="stamp blue" style={{ transform: 'rotate(3deg)' }}>{m.location}</span>}
                                    {m.weather && <span className="stamp green" style={{ transform: 'rotate(-4deg)' }}>{m.weather}</span>}
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                                    {tags.map((t, idx) => (
                                        <span className={`stamp ${idx%2===0?'red':'black'}`} key={t} style={{ transform: `rotate(${idx%2===0?'2deg':'-2deg'})`, fontSize: '0.65rem' }}>{t}</span>
                                    ))}
                                </div>

                                {/* Actions */}
                                <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '0.5rem' }}>
                                    <i className={`bx ${m.favorite ? 'bxs-star' : 'bx-star'}`}
                                        style={{ cursor: 'pointer', color: m.favorite ? 'var(--accent-mustard)' : 'var(--text-muted)', fontSize: '1.2rem' }}
                                        title="Favorite" onClick={() => toggleFav(m)} />
                                    <i className={`bx ${speakingId === m.id ? 'bx-stop-circle' : 'bx-volume-full'}`}
                                        style={{ cursor: 'pointer', color: speakingId === m.id ? 'var(--accent-terra)' : 'var(--text-muted)', fontSize: '1.2rem' }}
                                        title={speakingId === m.id ? "Stop reading" : "Read aloud"}
                                        onClick={() => speak(`${m.title}. ${m.content}`, m.id)} />
                                    <i className="bx bx-trash" style={{ cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.2rem' }} title="Delete" onClick={() => remove(m)} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
