import React, { useState } from 'react';
import { api } from '../api';

export default function Summary() {
    const [text, setText] = useState('Today was a really amazing day. I woke up early and went for a run. Then I had a healthy breakfast and started working on my project. I faced some challenges but I didn\'t give up and finally solved them. In the evening, I visited my friend and we had a great time talking about our future plans.');
    const [summary, setSummary] = useState('');
    const [busy, setBusy] = useState(false);
    const [copied, setCopied] = useState(false);

    const generate = async () => {
        if (!text.trim()) return;
        setBusy(true); setSummary('');
        try {
            const res = await api.aiTool('summarize', text);
            setSummary(res.result || 'No summary produced.');
        } catch { setSummary('AI is unavailable right now.'); }
        finally { setBusy(false); }
    };

    const copy = () => {
        navigator.clipboard?.writeText(summary);
        setCopied(true); setTimeout(() => setCopied(false), 1500);
    };

    return (
        <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="card">
                <label className="field-label">Memory to summarize</label>
                <textarea value={text} onChange={(e) => setText(e.target.value)}
                    style={{ minHeight: 160, lineHeight: 1.6 }} placeholder="Paste or write the entry you want summarized…" />
                <button className="btn btn-primary btn-block" style={{ marginTop: '1rem' }} onClick={generate} disabled={busy}>
                    {busy ? <><i className="bx bx-loader-alt bx-spin" /> Generating…</> : <><i className="bx bx-magic-wand" /> Generate Summary</>}
                </button>
            </div>

            <div className="card">
                <div className="card-head">
                    <span className="card-title">AI Generated Summary</span>
                    {summary && (
                        <div className="flex-center gap-sm">
                            <button className="icon-btn" style={{ width: 34, height: 34 }} title="Copy" onClick={copy}>
                                <i className={`bx ${copied ? 'bx-check' : 'bx-copy'}`} />
                            </button>
                            <button className="icon-btn" style={{ width: 34, height: 34 }} title="Save as memory"
                                onClick={() => api.createMemory({ title: 'AI Summary', content: summary, mood: 'Neutral', tags: 'summary' })}>
                                <i className="bx bx-save" />
                            </button>
                        </div>
                    )}
                </div>
                <div className="summary-out">
                    {busy
                        ? <span className="spinner"><i className="bx bx-loader-alt bx-spin" /> Summarizing your entry…</span>
                        : summary || <span className="muted">Your summary will appear here.</span>}
                </div>
            </div>
        </div>
    );
}
