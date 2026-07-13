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
            <div className="mem-toolbar">
                <div className="search input-icon" style={{ flexGrow: 1, position: 'relative' }}>
                    <i className="bx bx-search" style={{ position: 'absolute', left: '.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input style={{ paddingLeft: '2.5rem' }} placeholder="Search your journal..."
                        value={query} onChange={(e) => setQuery(e.target.value)} />
                </div>
                <select value={moodFilter} onChange={(e) => setMoodFilter(e.target.value)} style={{width: 'auto'}}>
                    <option value="all">All Moods</option>
                    {MOODS.map((m) => <option key={m.key} value={m.key}>{m.emoji} {m.key}</option>)}
                </select>
                <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} style={{width: 'auto'}}>
                    <option value="all">All Themes</option>
                    {allTags.map((t) => <option key={t} value={t}>#{t}</option>)}
                </select>
                <button className="btn btn-primary" onClick={() => go('editor')}>
                    <i className="bx bx-plus" /> New Entry
                </button>
            </div>

            {/* Active date-range filter chip */}
            {dateFilter !== 'all' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                        padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-sm)',
                        background: 'rgba(201, 123, 99, 0.10)', border: '1px solid rgba(201, 123, 99, 0.30)',
                        fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)',
                        color: 'var(--accent-terra)', textTransform: 'uppercase', letterSpacing: '0.08em',
                    }}>
                        <i className="bx bx-filter-alt" />
                        {dateFilter === 'week'  ? 'This Week'  : 'This Month'}
                        <i
                            className="bx bx-x"
                            style={{ cursor: 'pointer', marginLeft: '0.2rem' }}
                            title="Clear date filter"
                            onClick={() => setDateFilter('all')}
                        />
                    </span>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}
                    </span>
                </div>
            )}

            {loading ? (
                <div className="card" style={{textAlign: 'center'}}><span className="spinner" style={{color: 'var(--text-muted)'}}><i className="bx bx-loader-alt bx-spin" /> Gathering pages…</span></div>
            ) : filtered.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                    <i className="bx bx-book-open" style={{ fontSize: '3rem', color: 'var(--border-mid)', marginBottom: '1rem' }} />
                    <p className="muted" style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem' }}>The pages are blank here.</p>
                </div>
            ) : (
                <div className="mem-list">
                    {filtered.map((m) => {
                        const mm = moodMeta(m.mood);
                        const tags = (m.tags || '').split(',').map((t) => t.trim()).filter(Boolean);
                        
                        return (
                            <div className="card mem-item" key={m.id}>
                                {m.image_url ? (
                                    <div className="thumb">
                                        <img
                                            src={api.imageUrl(m.image_url)}
                                            alt={m.title}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    </div>
                                ) : (
                                    <div className="thumb" style={{ background: `${mm.color}11`, color: mm.color }}>
                                        {mm.emoji}
                                    </div>
                                )}
                                
                                <div className="body">
                                    <h4>{m.title}</h4>
                                    <div className="meta">
                                        <span>{new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                        <span style={{color: 'var(--border-mid)'}}>|</span>
                                        <span className="mood-pill">{mm.emoji} {m.mood || 'Neutral'}</span>
                                        
                                        {m.location && <span style={{display: 'flex', alignItems: 'center', gap: '2px'}}><i className="bx bx-map-pin" style={{ color: 'var(--accent-terra)' }} />{m.location}</span>}
                                        {m.weather  && <span>{m.weather}</span>}
                                    </div>
                                    <div className="tags" style={{display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem'}}>
                                        {tags.map((t) => <span className="pill tag" key={t}>{t}</span>)}
                                    </div>
                                </div>

                                <i className={`bx ${m.favorite ? 'bxs-star on' : 'bx-star'} star`}
                                    title="Favorite" onClick={() => toggleFav(m)} />
                                
                                <i className={`bx ${speakingId === m.id ? 'bx-stop-circle' : 'bx-volume-full'} tts-btn`}
                                    style={{color: speakingId === m.id ? 'var(--accent-terra)' : 'var(--text-muted)'}}
                                    title={speakingId === m.id ? "Stop reading" : "Read aloud"}
                                    onClick={() => speak(`${m.title}. ${m.content}`, m.id)} />

                                <i className="bx bx-trash kebab" title="Delete" onClick={() => remove(m)} />
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
