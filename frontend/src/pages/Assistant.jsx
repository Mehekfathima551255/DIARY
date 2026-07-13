import React, { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';

const STARTERS = [
    'What did I do last weekend?',
    'How has my mood been this month?',
    'What do I write about most?',
    'Summarize my week',
];

export default function Assistant() {
    const [messages, setMessages] = useState([
        { role: 'bot', text: "Hi! I'm your diary assistant. Ask me anything about your memories, moods, or writing habits." },
    ]);
    const [input, setInput] = useState('');
    const [busy, setBusy] = useState(false);
    const bodyRef = useRef(null);

    useEffect(() => {
        if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }, [messages, busy]);

    const send = async (text) => {
        const q = (text ?? input).trim();
        if (!q || busy) return;
        setMessages((m) => [...m, { role: 'user', text: q }]);
        setInput('');
        setBusy(true);
        try {
            const res = await api.chat(q);
            setMessages((m) => [...m, { role: 'bot', text: res.result || "I couldn't find an answer for that." }]);
        } catch {
            setMessages((m) => [...m, { role: 'bot', text: 'Sorry, I ran into an error. Please try again.' }]);
        } finally { setBusy(false); }
    };

    return (
        <div className="card chat-wrap">
            <div className="chat-body" ref={bodyRef}>
                {messages.map((m, i) => (
                    <div key={i} className={`chat-msg ${m.role}`}>
                        <div className="chat-avatar">
                            <i className={`bx ${m.role === 'bot' ? 'bx-bot' : 'bx-user'}`} />
                        </div>
                        <div className="bubble">{m.text}</div>
                    </div>
                ))}
                {busy && (
                    <div className="chat-msg bot">
                        <div className="chat-avatar"><i className="bx bx-bot" /></div>
                        <div className="bubble"><span className="spinner"><i className="bx bx-loader-alt bx-spin" /> Thinking…</span></div>
                    </div>
                )}
            </div>

            {messages.length <= 1 && (
                <div className="chat-suggest">
                    {STARTERS.map((s) => <button key={s} onClick={() => send(s)}>{s}</button>)}
                </div>
            )}

            <div className="chat-input">
                <input placeholder="Type your message…" value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && send()} />
                <button className="btn btn-primary" onClick={() => send()} disabled={busy}>
                    <i className="bx bx-send" />
                </button>
            </div>
        </div>
    );
}
