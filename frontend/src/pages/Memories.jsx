import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { moodMeta, MOODS } from '../lib/demo';

export default function Memories({ go }) {
    const [memories, setMemories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');
    const [moodFilter, setMoodFilter] = useState('all');
    const [tagFilter, setTagFilter] = useState('all');

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
        const q = query.toLowerCase();
        const matchesQ = !q || (m.title + m.content + (m.tags || '')).toLowerCase().includes(q);
        const matchesMood = moodFilter === 'all' || m.mood === moodFilter;
        const matchesTag = tagFilter === 'all' || (m.tags || '').split(',').map((t) => t.trim()).includes(tagFilter);
        return matchesQ && matchesMood && matchesTag;
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
                <div className="search input-icon" style={{ flexGrow: 1 }}>
                    <i className="bx bx-search" style={{ position: 'absolute', left: '.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input style={{ paddingLeft: '2.5rem' }} placeholder="Search memories…"
                        value={query} onChange={(e) => setQuery(e.target.value)} />
                </div>
                <select value={moodFilter} onChange={(e) => setMoodFilter(e.target.value)}>
                    <option value="all">All Moods</option>
                    {MOODS.map((m) => <option key={m.key} value={m.key}>{m.emoji} {m.key}</option>)}
                </select>
                <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)}>
                    <option value="all">All Tags</option>
                    {allTags.map((t) => <option key={t} value={t}>#{t}</option>)}
                </select>
                <button className="btn btn-primary" onClick={() => go('editor')}>
                    <i className="bx bx-plus" /> New Memory
                </button>
            </div>

            {loading ? (
                <div className="card"><span className="spinner"><i className="bx bx-loader-alt bx-spin" /> Loading memories…</span></div>
            ) : filtered.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <i className="bx bx-book-open" style={{ fontSize: '2.5rem', color: 'var(--text-muted)' }} />
                    <p className="muted" style={{ marginTop: '.5rem' }}>No memories match your filters.</p>
                </div>
            ) : (
                <div className="mem-list">
                    {filtered.map((m) => {
                        const mm = moodMeta(m.mood);
                        const tags = (m.tags || '').split(',').map((t) => t.trim()).filter(Boolean);
                        return (
                            <div className="card mem-item" key={m.id}>
                                <div className="thumb" style={{ background: `${mm.color}33`, color: mm.color }}>{mm.emoji}</div>
                                <div className="body">
                                    <h4>{m.title}</h4>
                                    <div className="meta">
                                        <span>{new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                        <span>·</span>
                                        <span className="mood-pill">{mm.emoji} {m.mood || 'Neutral'}</span>
                                    </div>
                                    <div className="tags">
                                        {tags.map((t) => <span className="pill tag" key={t}>{t}</span>)}
                                    </div>
                                </div>
                                <i className={`bx ${m.favorite ? 'bxs-star on' : 'bx-star'} star`}
                                    title="Favorite" onClick={() => toggleFav(m)} />
                                <i className="bx bx-trash kebab" title="Delete" onClick={() => remove(m)} />
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
