import React, { useState, useRef, useEffect } from 'react';
import { api } from '../lib/api';
import { MOODS, moodMeta } from '../lib/demo';
import RichTextEditor from '../components/RichTextEditor';

function stripHtml(html) {
    const d = document.createElement('div');
    d.innerHTML = html;
    return d.textContent || d.innerText || '';
}

export default function MemoryDetail({ memory: initial, onBack, onDeleted }) {
    const [memory, setMemory]   = useState(initial);
    const [editing, setEditing] = useState(false);
    const [title, setTitle]     = useState(initial.title);
    const [content, setContent] = useState(initial.content || '');
    const [mood, setMood]       = useState(initial.mood || 'Neutral');
    const [saving, setSaving]   = useState(false);
    const [note, setNote]       = useState('');

    // TTS
    const [speaking, setSpeaking] = useState(false);
    const synthRef = useRef(null);

    const speak = () => {
        if (speaking) {
            window.speechSynthesis.cancel();
            setSpeaking(false);
            return;
        }
        const text = `${memory.title}. ${stripHtml(memory.content || '')}`;
        const utt = new SpeechSynthesisUtterance(text);
        utt.onend  = () => setSpeaking(false);
        utt.onerror = () => setSpeaking(false);
        synthRef.current = utt;
        window.speechSynthesis.speak(utt);
        setSpeaking(true);
    };

    // Stop TTS if navigating away
    useEffect(() => () => window.speechSynthesis.cancel(), []);

    const mm   = moodMeta(memory.mood);
    const tags = (memory.tags || '').split(',').map((t) => t.trim()).filter(Boolean);
    const date = new Date(memory.created_at).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    const save = async () => {
        setSaving(true); setNote('');
        try {
            const updated = await api.updateMemory(memory.id, {
                title: title.trim() || 'Untitled',
                content,
                mood,
                tags: memory.tags,
                location: memory.location,
                weather: memory.weather,
                favorite: memory.favorite,
            });
            setMemory((prev) => ({ ...prev, title, content, mood }));
            setEditing(false);
            setNote('Changes saved!');
            setTimeout(() => setNote(''), 2500);
        } catch {
            setNote('Failed to save. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm(`Delete "${memory.title}"? This cannot be undone.`)) return;
        try {
            await api.deleteMemory(memory.id);
            onDeleted(memory.id);
            onBack();
        } catch { alert('Failed to delete.'); }
    };

    return (
        <div style={{ maxWidth: 800, margin: '0 auto' }}>

            {/* ── Top bar ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <button
                    onClick={onBack}
                    style={{ background: 'transparent', border: '1px solid var(--border-mid)', borderRadius: '6px', padding: '0.4rem 0.9rem', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-secondary)' }}
                >
                    <i className="bx bx-arrow-back" /> Back
                </button>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.6rem' }}>
                    {/* TTS */}
                    <button
                        onClick={speak}
                        title={speaking ? 'Stop reading' : 'Listen to this memory'}
                        style={{ background: speaking ? 'var(--accent-terra)' : 'transparent', color: speaking ? '#fff' : 'var(--text-secondary)', border: '1px solid var(--border-mid)', borderRadius: '6px', padding: '0.4rem 0.9rem', cursor: 'pointer', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontFamily: 'var(--font-sans)' }}
                    >
                        <i className={`bx ${speaking ? 'bx-stop-circle' : 'bx-volume-full'}`} />
                        {speaking ? 'Stop' : 'Listen'}
                    </button>
                    {/* Edit / Save */}
                    {!editing ? (
                        <button
                            onClick={() => setEditing(true)}
                            style={{ background: 'var(--accent-terra)', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.4rem 0.9rem', cursor: 'pointer', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontFamily: 'var(--font-sans)', fontWeight: 600 }}
                        >
                            <i className="bx bx-edit" /> Edit
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={() => { setEditing(false); setTitle(memory.title); setContent(memory.content || ''); setMood(memory.mood || 'Neutral'); }}
                                style={{ background: 'transparent', border: '1px solid var(--border-mid)', borderRadius: '6px', padding: '0.4rem 0.9rem', cursor: 'pointer', fontSize: '0.88rem', fontFamily: 'var(--font-sans)' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={save}
                                disabled={saving}
                                style={{ background: 'var(--accent-olive)', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.4rem 0.9rem', cursor: 'pointer', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontFamily: 'var(--font-sans)', fontWeight: 600 }}
                            >
                                {saving ? <><i className="bx bx-loader-alt bx-spin" /> Saving…</> : <><i className="bx bx-check" /> Save</>}
                            </button>
                        </>
                    )}
                    {/* Delete */}
                    <button
                        onClick={handleDelete}
                        style={{ background: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)', borderRadius: '6px', padding: '0.4rem 0.9rem', cursor: 'pointer', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontFamily: 'var(--font-sans)' }}
                    >
                        <i className="bx bx-trash" /> Delete
                    </button>
                </div>
            </div>

            {/* ── Paper page ── */}
            <div className="torn-edge" style={{ background: 'var(--paper-cream)', padding: '3rem', boxShadow: 'var(--shadow-lg)', position: 'relative' }}>
                <div className="tape top-center" />

                {/* Image if exists */}
                {memory.image_url && (
                    <div className="polaroid" style={{ float: 'right', margin: '0 0 1.5rem 2rem', maxWidth: 220, transform: 'rotate(3deg)' }}>
                        <div className="tape top-center" />
                        <img src={api.imageUrl(memory.image_url)} alt={memory.title} style={{ width: '100%', display: 'block' }} />
                    </div>
                )}

                {/* Title */}
                {editing ? (
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', fontWeight: 700, border: 'none', borderBottom: '2px dashed var(--border-mid)', background: 'transparent', width: '100%', outline: 'none', marginBottom: '0.5rem', color: 'var(--ink-0)' }}
                    />
                ) : (
                    <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontWeight: 700, color: 'var(--ink-0)', marginBottom: '0.5rem', lineHeight: 1.2 }}>
                        {memory.title}
                    </h1>
                )}

                {/* Meta row */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', marginBottom: '2rem', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    <span>{date}</span>
                    {editing ? (
                        <select value={mood} onChange={(e) => setMood(e.target.value)} style={{ fontFamily: 'var(--font-hand)', fontSize: '1rem', background: 'transparent', border: '1px dashed var(--border-mid)', padding: '0.1rem 0.4rem' }}>
                            {MOODS.map((m) => <option key={m.key} value={m.key}>{m.emoji} {m.key}</option>)}
                        </select>
                    ) : (
                        <span className="stamp black" style={{ transform: 'rotate(-1deg)' }}>{mm.emoji} {memory.mood || 'Neutral'}</span>
                    )}
                    {memory.location && <span className="stamp blue" style={{ transform: 'rotate(2deg)' }}><i className="bx bx-map-pin" /> {memory.location}</span>}
                    {memory.weather  && <span className="stamp green" style={{ transform: 'rotate(-2deg)' }}>{memory.weather}</span>}
                </div>

                {/* Content */}
                {editing ? (
                    <div style={{ minHeight: 300 }}>
                        <RichTextEditor value={content} onChange={setContent} placeholder="What happened?" />
                    </div>
                ) : (
                    <div
                        style={{ fontFamily: 'var(--font-sans)', fontSize: '1.05rem', lineHeight: 1.85, color: 'var(--ink-0)' }}
                        dangerouslySetInnerHTML={{ __html: memory.content || '<p style="color:var(--text-muted)">No content written.</p>' }}
                    />
                )}

                {/* Tags */}
                {tags.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px dashed var(--border-mid)' }}>
                        {tags.map((t, i) => (
                            <span key={t} className={`stamp ${i % 2 === 0 ? 'red' : 'blue'}`} style={{ transform: `rotate(${i % 2 === 0 ? '-2deg' : '2deg'})`, fontSize: '0.72rem' }}>
                                #{t}
                            </span>
                        ))}
                    </div>
                )}

                {/* Audio player */}
                {memory.audio_url && (
                    <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px dashed var(--border-mid)' }}>
                        <div style={{ fontFamily: 'var(--font-hand)', fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                            <i className="bx bx-microphone" /> Voice recording
                        </div>
                        <audio controls src={api.imageUrl(memory.audio_url)} style={{ width: '100%' }} />
                    </div>
                )}
            </div>

            {/* Status note */}
            {note && (
                <div style={{ marginTop: '1rem', textAlign: 'center', fontFamily: 'var(--font-hand)', fontSize: '1.1rem', color: note.includes('Failed') ? 'var(--danger)' : 'var(--accent-olive)' }}>
                    {note}
                </div>
            )}
        </div>
    );
}
