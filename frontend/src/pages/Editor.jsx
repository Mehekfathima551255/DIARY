import React, { useState } from 'react';
import { api } from '../lib/api';
import { MOODS } from '../lib/demo';

const TOOLBAR = ['bx-bold', 'bx-italic', 'bx-underline', 'bx-list-ul', 'bx-list-ol', 'bx-align-left', 'bx-align-middle', 'bx-link', 'bx-image-alt'];

export default function Editor({ go }) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [mood, setMood] = useState('Happy');
    const [tags, setTags] = useState([]);
    const [tagInput, setTagInput] = useState('');
    const [saving, setSaving] = useState(false);
    const [aiBusy, setAiBusy] = useState('');
    const [note, setNote] = useState('');

    const addTag = (e) => {
        if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
            e.preventDefault();
            if (!tags.includes(tagInput.trim())) setTags([...tags, tagInput.trim()]);
            setTagInput('');
        }
    };
    const removeTag = (t) => setTags(tags.filter((x) => x !== t));

    const runAI = async (kind) => {
        if (!content.trim()) { setNote('Write something first so the AI has context.'); return; }
        setAiBusy(kind); setNote('');
        try {
            const res = await api.aiTool(kind, content);
            if (kind === 'mood' && res.mood) { setMood(res.mood); setNote(`AI detected mood: ${res.mood}`); }
            else if (kind === 'tags' && res.tags) {
                const merged = [...new Set([...tags, ...res.tags])];
                setTags(merged); setNote('AI added suggested tags.');
            }
            else if (kind === 'title' && res.result) { setTitle(res.result); setNote('AI generated a title.'); }
            else if ((kind === 'improve' || kind === 'summarize') && res.result) {
                setContent(res.result); setNote(kind === 'improve' ? 'AI polished your writing.' : 'AI summarized your entry.');
            }
        } catch { setNote('AI is unavailable right now.'); }
        finally { setAiBusy(''); }
    };

    const save = async () => {
        if (!content.trim()) { setNote('Please write something first!'); return; }
        setSaving(true);
        try {
            await api.createMemory({
                title: title.trim() || 'Untitled memory',
                content, mood, tags: tags.join(','), favorite: false,
            });
            go('memories');
        } catch { setNote('Failed to save. Is the backend running?'); }
        finally { setSaving(false); }
    };

    const moodEmoji = MOODS.find((m) => m.key === mood)?.emoji || '😊';

    return (
        <div className="editor-grid">
            <div>
                <div className="card glass" style={{ marginBottom: '1rem', padding: '1rem' }}>
                    <input placeholder="Give your memory a title…" value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        style={{ fontSize: '1.2rem', fontWeight: 600, border: 'none', background: 'transparent', boxShadow: 'none' }} />
                </div>

                <div className="card glass" style={{ padding: 0, overflow: 'hidden' }}>
                    <div className="editor-toolbar">
                        {TOOLBAR.map((ic) => (
                            <button key={ic} type="button" title={ic.replace('bx-', '')}><i className={`bx ${ic}`} /></button>
                        ))}
                    </div>
                    <textarea className="editor-body" placeholder="What happened today? How did it make you feel?"
                        value={content} onChange={(e) => setContent(e.target.value)} />
                    <div className="editor-foot">
                        <div className="flex-center gap-sm">
                            <button className="icon-btn" style={{ width: 32, height: 32 }} title="Add image"><i className="bx bx-image-add" /></button>
                            <button className="icon-btn" style={{ width: 32, height: 32 }} title="Voice note"><i className="bx bx-microphone" /></button>
                        </div>
                        <span>Characters: {content.length}</span>
                    </div>
                </div>

                {note && <p style={{ marginTop: '.75rem', color: 'var(--success)', fontSize: '.85rem' }}>{note}</p>}
            </div>

            {/* Sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <button className="btn btn-primary btn-block" onClick={save} disabled={saving}>
                    {saving ? <><i className="bx bx-loader-alt bx-spin" /> Saving…</> : <><i className="bx bx-save" /> Save Memory</>}
                </button>

                <div className="card">
                    <label className="field-label">Mood {moodEmoji}</label>
                    <select value={mood} onChange={(e) => setMood(e.target.value)}>
                        {MOODS.map((m) => <option key={m.key} value={m.key}>{m.emoji} {m.key}</option>)}
                    </select>

                    <label className="field-label" style={{ marginTop: '1rem' }}>Tags</label>
                    <div className="tag-input-wrap">
                        {tags.map((t) => (
                            <span className="tag-chip" key={t}>{t}<i className="bx bx-x" onClick={() => removeTag(t)} /></span>
                        ))}
                        <input placeholder="+ Add tag" value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)} onKeyDown={addTag} />
                    </div>
                </div>

                <div className="card">
                    <div className="card-head"><span className="card-title" style={{ fontSize: '.95rem' }}><i className="bx bx-magic-wand" style={{ color: 'var(--accent-primary)' }} /> AI Tools</span></div>
                    {[
                        ['title', 'bx-heading', 'Generate title'],
                        ['mood', 'bx-smile', 'Detect mood'],
                        ['tags', 'bx-purchase-tag', 'Suggest tags'],
                        ['improve', 'bx-check-double', 'Improve writing'],
                        ['summarize', 'bx-text', 'Summarize'],
                    ].map(([kind, icon, label]) => (
                        <button key={kind} className="ai-tool-btn" onClick={() => runAI(kind)} disabled={!!aiBusy}>
                            <i className={`bx ${aiBusy === kind ? 'bx-loader-alt bx-spin' : icon}`} /> {label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
