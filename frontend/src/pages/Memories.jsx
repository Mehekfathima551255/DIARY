import React, { useEffect, useMemo, useState, useRef } from 'react';
import { api } from '../lib/api';
import { moodMeta, MOODS } from '../lib/demo';
import { useTTS } from '../lib/useTTS';
import { isLocked, setLock, removeLock, checkPassword } from '../lib/useEntryLock';

/* ─── Lock / Unlock dialogs ────────────────────────────────── */
function LockDialog({ memory, onClose, onLocked }) {
    const [pw, setPw]     = useState('');
    const [pw2, setPw2]   = useState('');
    const [err, setErr]   = useState('');
    const inputRef        = useRef(null);

    useEffect(() => { inputRef.current?.focus(); }, []);

    const submit = (e) => {
        e.preventDefault();
        if (pw.length < 4)  { setErr('Password must be at least 4 characters.'); return; }
        if (pw !== pw2)     { setErr('Passwords do not match.'); return; }
        setLock(memory.id, pw);
        onLocked(memory.id);
        onClose();
    };

    return (
        <div style={OVERLAY}>
            <div style={DIALOG}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                    🔒 Protect this entry
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                    "{memory.title}"
                </div>
                <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <input
                        ref={inputRef}
                        type="password"
                        placeholder="Set a password"
                        value={pw}
                        onChange={(e) => { setPw(e.target.value); setErr(''); }}
                        style={INPUT_STYLE}
                    />
                    <input
                        type="password"
                        placeholder="Confirm password"
                        value={pw2}
                        onChange={(e) => { setPw2(e.target.value); setErr(''); }}
                        style={INPUT_STYLE}
                    />
                    {err && <div style={{ color: 'var(--danger)', fontSize: '0.82rem' }}>{err}</div>}
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                        <button type="button" onClick={onClose} style={BTN_GHOST}>Cancel</button>
                        <button type="submit" style={BTN_PRIMARY}>Lock entry</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function UnlockDialog({ memory, onClose, onUnlocked }) {
    const [pw, setPw]   = useState('');
    const [err, setErr] = useState('');
    const inputRef      = useRef(null);

    useEffect(() => { inputRef.current?.focus(); }, []);

    const submit = (e) => {
        e.preventDefault();
        if (checkPassword(memory.id, pw)) {
            onUnlocked(memory.id);
            onClose();
        } else {
            setErr('Incorrect password. Try again.');
            setPw('');
        }
    };

    const handleRemoveLock = () => {
        if (checkPassword(memory.id, pw)) {
            removeLock(memory.id);
            onUnlocked(memory.id);
            onClose();
        } else {
            setErr('Incorrect password.');
            setPw('');
        }
    };

    return (
        <div style={OVERLAY}>
            <div style={DIALOG}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                    🔐 Protected entry
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                    "{memory.title}"
                </div>
                <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <input
                        ref={inputRef}
                        type="password"
                        placeholder="Enter password to view"
                        value={pw}
                        onChange={(e) => { setPw(e.target.value); setErr(''); }}
                        style={INPUT_STYLE}
                    />
                    {err && <div style={{ color: 'var(--danger)', fontSize: '0.82rem' }}>{err}</div>}
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                        <button type="button" onClick={onClose} style={BTN_GHOST}>Cancel</button>
                        <button
                            type="button"
                            onClick={handleRemoveLock}
                            style={{ ...BTN_GHOST, color: 'var(--danger)', fontSize: '0.8rem' }}
                            title="Enter password then click to permanently remove lock"
                        >
                            Remove lock
                        </button>
                        <button type="submit" style={BTN_PRIMARY}>Unlock</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ─── Shared dialog styles ──────────────────────────────────── */
const OVERLAY = {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 9999,
};
const DIALOG = {
    background: 'var(--paper-0, #fff)',
    border: '1px solid var(--border-mid, #ddd)',
    borderRadius: '12px',
    padding: '1.75rem',
    width: '100%', maxWidth: '380px',
    boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
};
const INPUT_STYLE = {
    width: '100%', padding: '0.7rem 0.9rem',
    border: '1.5px solid var(--border-mid, #ddd)',
    borderRadius: '8px',
    fontSize: '0.95rem',
    outline: 'none',
    background: 'var(--paper-0, #fafafa)',
    color: 'var(--text-primary, #222)',
};
const BTN_PRIMARY = {
    padding: '0.55rem 1.2rem', borderRadius: '8px',
    background: 'var(--accent-terra, #C97B63)',
    color: '#fff', border: 'none', cursor: 'pointer',
    fontWeight: 700, fontSize: '0.88rem',
};
const BTN_GHOST = {
    padding: '0.55rem 1rem', borderRadius: '8px',
    background: 'transparent', border: '1px solid var(--border-mid, #ddd)',
    cursor: 'pointer', fontSize: '0.88rem',
    color: 'var(--text-secondary, #666)',
};

/* ─── Main component ────────────────────────────────────────── */
export default function Memories({ go, initialFilter = 'all' }) {
    const [memories, setMemories]   = useState([]);
    const [loading, setLoading]     = useState(true);
    const [query, setQuery]         = useState('');
    const [moodFilter, setMoodFilter] = useState('all');
    const [tagFilter, setTagFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState(initialFilter);

    // Lock state
    const [lockedIds, setLockedIds]     = useState(() => {
        // initialise from localStorage
        try {
            const raw = JSON.parse(localStorage.getItem('sd_entry_locks') || '{}');
            return new Set(Object.keys(raw).map(Number));
        } catch { return new Set(); }
    });
    const [unlockedIds, setUnlockedIds] = useState(new Set()); // unlocked this session
    const [lockDialog, setLockDialog]   = useState(null); // memory object or null
    const [unlockDialog, setUnlockDialog] = useState(null);

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
        const d = new Date(m.created_at);
        const dateStr = [
            d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
            d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            d.toISOString().slice(0, 10),
            String(d.getFullYear()),
        ].join(' ').toLowerCase();

        const matchesQ    = !q || (m.title + ' ' + m.content + ' ' + (m.tags || '')).toLowerCase().includes(q) || dateStr.includes(q);
        const matchesMood = moodFilter === 'all' || m.mood === moodFilter;
        const matchesTag  = tagFilter  === 'all' || (m.tags || '').split(',').map((t) => t.trim()).includes(tagFilter);
        let matchesDate   = true;
        if (dateFilter === 'week' || dateFilter === 'month') {
            const created = new Date(m.created_at);
            const now = new Date();
            if (dateFilter === 'week') {
                const ago = new Date(now); ago.setDate(now.getDate() - 7);
                matchesDate = created >= ago;
            } else {
                matchesDate = created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
            }
        }
        return matchesQ && matchesMood && matchesTag && matchesDate;
    });

    const toggleFav = async (m) => {
        const updated = { ...m, favorite: !m.favorite };
        setMemories((list) => list.map((x) => (x.id === m.id ? updated : x)));
        try { await api.updateMemory(m.id, { title: m.title, content: m.content, mood: m.mood, tags: m.tags, favorite: updated.favorite }); }
        catch { /* optimistic */ }
    };

    const remove = async (m) => {
        if (!confirm(`Delete "${m.title}"?`)) return;
        setMemories((list) => list.filter((x) => x.id !== m.id));
        try { await api.deleteMemory(m.id); } catch { /* ignore */ }
    };

    // Called after user sets a password
    const handleLocked = (id) => {
        setLockedIds((prev) => new Set([...prev, id]));
        setUnlockedIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
    };

    // Called after user enters correct password
    const handleUnlocked = (id) => {
        setUnlockedIds((prev) => new Set([...prev, id]));
        setLockedIds((prev) => {
            // If lock was removed (not just unlocked for session), reflect it
            if (!isLocked(id)) { const s = new Set(prev); s.delete(id); return s; }
            return prev;
        });
    };

    const entryIsLocked   = (id) => lockedIds.has(id) && !unlockedIds.has(id);
    const entryHasLock    = (id) => lockedIds.has(id);

    return (
        <div>
            {/* Dialogs */}
            {lockDialog   && <LockDialog   memory={lockDialog}   onClose={() => setLockDialog(null)}   onLocked={handleLocked}   />}
            {unlockDialog && <UnlockDialog memory={unlockDialog} onClose={() => setUnlockDialog(null)} onUnlocked={handleUnlocked} />}

            {/* Toolbar */}
            <div style={{
                display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center',
                padding: '1rem', background: 'var(--paper-0)', borderBottom: '1px dashed var(--border-light)',
                marginBottom: '2rem',
            }}>
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
                <button
                    onClick={() => go('editor')}
                    style={{ background: 'var(--accent-terra)', color: '#fff', padding: '0.5rem 1rem', borderRadius: '4px', fontFamily: 'var(--font-hand)', fontSize: '1.1rem', border: 'none', cursor: 'pointer', transform: 'rotate(2deg)' }}
                >
                    <i className="bx bx-plus" /> Write
                </button>
            </div>

            {/* Active date-range chip */}
            {dateFilter !== 'all' && (
                <div className="sticky-note" style={{ display: 'inline-block', padding: '0.5rem 1rem', marginBottom: '2rem', transform: 'rotate(-1deg)' }}>
                    <div className="pin"></div>
                    <span style={{ fontSize: '1.1rem' }}>Showing: {dateFilter === 'week' ? 'This Week' : 'This Month'}</span>
                    <i className="bx bx-x" style={{ cursor: 'pointer', marginLeft: '0.5rem' }} onClick={() => setDateFilter('all')} />
                </div>
            )}

            {loading ? (
                <div style={{ textAlign: 'center', fontFamily: 'var(--font-hand)', fontSize: '1.5rem' }}>
                    <span className="spinner"><i className="bx bx-loader-alt bx-spin" /> Gathering pages…</span>
                </div>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 2rem', fontFamily: 'var(--font-hand)', fontSize: '1.5rem' }}>
                    <p>The pages are blank here.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '3rem', padding: '1rem' }}>
                    {filtered.map((m, i) => {
                        const mm = moodMeta(m.mood);
                        const tags = (m.tags || '').split(',').map((t) => t.trim()).filter(Boolean);
                        const rotations = ['-3deg','2deg','-1deg','4deg','-4deg','1deg'];
                        const rot = rotations[i % rotations.length];
                        const isPolaroid = !!m.image_url;
                        const locked = entryIsLocked(m.id);
                        const hasLock = entryHasLock(m.id);

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

                                {/* ── Locked overlay ── */}
                                {locked && (
                                    <div
                                        onClick={() => setUnlockDialog(m)}
                                        style={{
                                            position: 'absolute', inset: 0, zIndex: 10,
                                            borderRadius: 'inherit',
                                            backdropFilter: 'blur(8px)',
                                            WebkitBackdropFilter: 'blur(8px)',
                                            background: 'rgba(245,235,217,0.55)',
                                            display: 'flex', flexDirection: 'column',
                                            alignItems: 'center', justifyContent: 'center',
                                            cursor: 'pointer', gap: '0.5rem',
                                        }}
                                    >
                                        <i className="bx bxs-lock" style={{ fontSize: '2.5rem', color: 'var(--accent-terra)' }} />
                                        <span style={{ fontFamily: 'var(--font-hand)', fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
                                            Tap to unlock
                                        </span>
                                    </div>
                                )}

                                {/* ── Card content ── */}
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
                                        <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {m.content || '...'}
                                        </div>
                                    </>
                                )}

                                {/* Stamps */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: isPolaroid ? '10px' : '0' }}>
                                    <span className="stamp black" style={{ transform: 'rotate(-2deg)' }}>{mm.emoji} {m.mood || 'Neutral'}</span>
                                    {m.location && <span className="stamp blue"  style={{ transform: 'rotate(3deg)' }}>{m.location}</span>}
                                    {m.weather  && <span className="stamp green" style={{ transform: 'rotate(-4deg)' }}>{m.weather}</span>}
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                                    {tags.map((t, idx) => (
                                        <span className={`stamp ${idx % 2 === 0 ? 'red' : 'black'}`} key={t} style={{ transform: `rotate(${idx % 2 === 0 ? '2deg' : '-2deg'})`, fontSize: '0.65rem' }}>{t}</span>
                                    ))}
                                </div>

                                {/* ── Action icons (top-right) ── */}
                                <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '0.5rem', zIndex: 20 }}>
                                    {/* Lock / unlock toggle */}
                                    <i
                                        className={`bx ${hasLock ? 'bxs-lock' : 'bx-lock-open'}`}
                                        style={{
                                            cursor: 'pointer',
                                            color: hasLock ? 'var(--accent-terra)' : 'var(--text-muted)',
                                            fontSize: '1.2rem',
                                        }}
                                        title={hasLock ? 'Entry is locked — click to manage' : 'Protect this entry with a password'}
                                        onClick={() => {
                                            if (hasLock) setUnlockDialog(m);
                                            else         setLockDialog(m);
                                        }}
                                    />
                                    <i
                                        className={`bx ${m.favorite ? 'bxs-star' : 'bx-star'}`}
                                        style={{ cursor: 'pointer', color: m.favorite ? 'var(--accent-mustard)' : 'var(--text-muted)', fontSize: '1.2rem' }}
                                        title="Favourite"
                                        onClick={() => toggleFav(m)}
                                    />
                                    <i
                                        className={`bx ${speakingId === m.id ? 'bx-stop-circle' : 'bx-volume-full'}`}
                                        style={{ cursor: 'pointer', color: speakingId === m.id ? 'var(--accent-terra)' : 'var(--text-muted)', fontSize: '1.2rem' }}
                                        title={speakingId === m.id ? 'Stop reading' : 'Read aloud'}
                                        onClick={() => speak(`${m.title}. ${m.content}`, m.id)}
                                    />
                                    <i
                                        className="bx bx-trash"
                                        style={{ cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.2rem' }}
                                        title="Delete"
                                        onClick={() => remove(m)}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
