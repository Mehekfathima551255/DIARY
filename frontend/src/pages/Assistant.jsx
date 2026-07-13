import React, { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { useTTS } from '../lib/useTTS';

const STARTERS = [
    'What did I do last weekend?',
    'How has my mood been this month?',
    'What do I write about most?',
    'Summarize my week',
    'Show my travel memories',
    'When was I last really happy?',
];

// Renders AI response text: supports **bold** and newlines
function FormattedText({ text }) {
    if (!text) return null;
    const paragraphs = text.split('\n').filter((p) => p.trim() !== '');
    return paragraphs.map((p, pi) => {
        const parts = p.split(/(\*\*.*?\*\*)/g);
        return (
            <p key={pi} style={{ margin: '0 0 0.5rem 0', lineHeight: 1.6 }}>
                {parts.map((part, i) =>
                    part.startsWith('**') && part.endsWith('**')
                        ? <strong key={i} style={{ color: 'var(--accent-primary)' }}>{part.slice(2, -2)}</strong>
                        : part
                )}
            </p>
        );
    });
}

export default function Assistant() {
    const { speak, speakingId } = useTTS();
    const [messages, setMessages] = useState([
        {
            role: 'bot',
            text: "Hi! I'm your diary assistant. I have access to all your memories. Ask me anything about your past, moods, or writing habits.",
        },
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
            setMessages((m) => [
                ...m,
                { role: 'bot', text: res.result || "I couldn't find an answer for that." },
            ]);
        } catch {
            setMessages((m) => [
                ...m,
                { role: 'bot', text: 'Sorry, I ran into an error. Please try again.' },
            ]);
        } finally {
            setBusy(false);
        }
    };

    const onKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            send();
        }
    };

    return (
        <div className="card chat-wrap">
            {/* Message list */}
            <div className="chat-body" ref={bodyRef}>
                {messages.map((m, i) => (
                    <div key={i} className={`chat-msg ${m.role}`}>
                        <div className="chat-avatar">
                            <i className={`bx ${m.role === 'bot' ? 'bx-bot' : 'bx-user'}`} />
                        </div>
                        <div className="bubble">
                            {m.role === 'bot' ? (
                                <>
                                    <FormattedText text={m.text} />
                                    <i 
                                        className={`bx ${speakingId === i ? 'bx-stop-circle' : 'bx-volume-full'}`}
                                        style={{position: 'absolute', right: '0.75rem', bottom: '0.75rem', cursor: 'pointer', color: speakingId === i ? 'var(--accent-terra)' : 'var(--text-muted)'}}
                                        onClick={() => speak(m.text, i)}
                                    />
                                </>
                            ) : m.text}
                        </div>
                    </div>
                ))}

                {/* Typing indicator */}
                {busy && (
                    <div className="chat-msg bot">
                        <div className="chat-avatar"><i className="bx bx-bot" /></div>
                        <div className="bubble">
                            <span className="chat-typing">
                                <span className="typing-dot" />
                                <span className="typing-dot" style={{ animationDelay: '0.2s' }} />
                                <span className="typing-dot" style={{ animationDelay: '0.4s' }} />
                                <span style={{ marginLeft: '0.4rem', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                                    Searching your memories…
                                </span>
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Starter chips — only shown before user sends anything */}
            {messages.length <= 1 && (
                <div className="chat-suggest">
                    {STARTERS.map((s) => (
                        <button key={s} onClick={() => send(s)}>{s}</button>
                    ))}
                </div>
            )}

            {/* Input bar */}
            <div className="chat-input">
                <input
                    placeholder="Ask about your memories…"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={onKey}
                    disabled={busy}
                />
                <button
                    className="btn btn-primary"
                    onClick={() => send()}
                    disabled={busy || !input.trim()}
                >
                    <i className="bx bx-send" />
                </button>
            </div>

            <style>{`
                .typing-dot {
                    display: inline-block;
                    width: 6px; height: 6px;
                    background: var(--accent-primary);
                    border-radius: 50%;
                    animation: tdBounce 1.4s infinite ease-in-out both;
                }
                @keyframes tdBounce {
                    0%, 80%, 100% { transform: scale(0); }
                    40%           { transform: scale(1); }
                }
                .chat-typing {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }
            `}</style>
        </div>
    );
}
