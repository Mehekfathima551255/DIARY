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
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef(null);
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

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
            return;
        }
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) { alert('Speech recognition not supported in this browser. Try Chrome.'); return; }
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = 'en-US';
        rec.onstart  = () => setIsListening(true);
        rec.onend    = () => setIsListening(false);
        rec.onerror  = () => setIsListening(false);
        rec.onresult = (e) => {
            const transcript = e.results[0][0].transcript;
            setInput((prev) => (prev + ' ' + transcript).trim());
        };
        recognitionRef.current = rec;
        rec.start();
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', padding: '1rem' }}>
            
            {/* Header */}
            <div className="torn-edge" style={{ background: 'var(--paper-cream)', padding: '1.5rem', marginBottom: '2rem', textAlign: 'center', position: 'relative', transform: 'rotate(-1deg)', boxShadow: 'var(--shadow)' }}>
                <div className="tape top-center"></div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--ink-0)', margin: 0 }}>Journal Companion</h2>
                <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.2rem', color: 'var(--text-muted)', margin: '0.5rem 0 0 0' }}>Ask me about your past entries, themes, or moods.</p>
            </div>

            {/* Message list */}
            <div ref={bodyRef} style={{ flexGrow: 1, overflowY: 'auto', padding: '1rem 0', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {messages.map((m, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                        
                        {m.role === 'bot' ? (
                            <div className="torn-edge" style={{ background: 'var(--paper-0)', padding: '1.5rem', maxWidth: '80%', position: 'relative', boxShadow: 'var(--shadow)', transform: `rotate(${i % 2 === 0 ? 1 : -1}deg)` }}>
                                <div className="tape top-center" style={{ width: '40px' }}></div>
                                <div style={{ fontFamily: 'var(--font-sans)', fontSize: '1.05rem', color: 'var(--ink-0)', lineHeight: 1.6 }}>
                                    <FormattedText text={m.text} />
                                </div>
                                <i 
                                    className={`bx ${speakingId === i ? 'bx-stop-circle' : 'bx-volume-full'}`}
                                    style={{position: 'absolute', right: '1rem', bottom: '1rem', cursor: 'pointer', color: speakingId === i ? 'var(--accent-terra)' : 'var(--text-muted)', fontSize: '1.2rem'}}
                                    onClick={() => speak(m.text, i)}
                                    title={speakingId === i ? 'Stop reading' : 'Read aloud'}
                                />
                            </div>
                        ) : (
                            <div className="sticky-note yellow" style={{ padding: '1rem 1.5rem', maxWidth: '70%', position: 'relative', transform: `rotate(${i % 2 === 0 ? -2 : 2}deg)` }}>
                                <div className="pin"></div>
                                <div style={{ fontFamily: 'var(--font-hand)', fontSize: '1.3rem', color: 'var(--ink-0)' }}>
                                    {m.text}
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {/* Typing indicator */}
                {busy && (
                    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                        <div className="torn-edge" style={{ background: 'var(--paper-0)', padding: '1rem 1.5rem', position: 'relative', boxShadow: 'var(--shadow)', transform: 'rotate(-1deg)' }}>
                            <div className="tape top-center" style={{ width: '30px' }}></div>
                            <span className="chat-typing">
                                <span className="typing-dot" />
                                <span className="typing-dot" style={{ animationDelay: '0.2s' }} />
                                <span className="typing-dot" style={{ animationDelay: '0.4s' }} />
                                <span style={{ marginLeft: '0.5rem', fontFamily: 'var(--font-hand)', fontSize: '1.2rem', color: 'var(--text-secondary)' }}>
                                    Flipping through your pages…
                                </span>
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Starter chips */}
            {messages.length <= 1 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center', marginBottom: '1rem' }}>
                    {STARTERS.map((s, i) => (
                        <button 
                            key={s} 
                            onClick={() => send(s)}
                            className={`stamp ${['black', 'red', 'blue', 'green'][i % 4]}`}
                            style={{ cursor: 'pointer', transform: `rotate(${i % 2 === 0 ? 2 : -2}deg)`, border: '2px solid' }}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            )}

            {/* Input bar */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1rem', background: 'var(--paper-cream)', border: '1px solid var(--border-light)', borderRadius: '4px', boxShadow: 'var(--shadow)', position: 'relative' }}>
                <div className="tape top-center" style={{ width: '50px', top: '-10px' }}></div>
                <input
                    placeholder={isListening ? 'Listening…' : 'Ask about your memories…'}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={onKey}
                    disabled={busy}
                    style={{ flexGrow: 1, background: 'transparent', border: 'none', borderBottom: '2px dashed var(--border-light)', fontFamily: 'var(--font-hand)', fontSize: '1.3rem', outline: 'none', padding: '0.5rem' }}
                />
                <button
                    type="button"
                    style={{
                        background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.5rem',
                        color: isListening ? 'var(--accent-terra)' : 'var(--text-muted)',
                        animation: isListening ? 'pulse 2s infinite' : 'none',
                    }}
                    onClick={toggleListening}
                    title={isListening ? 'Stop listening' : 'Speak your question'}
                >
                    <i className={`bx ${isListening ? 'bx-stop-circle' : 'bx-microphone'}`} />
                </button>
                <button
                    onClick={() => send()}
                    disabled={busy || !input.trim()}
                    style={{
                        background: 'var(--accent-olive)', color: '#fff', border: 'none', borderRadius: '4px',
                        padding: '0.5rem 1rem', cursor: (busy || !input.trim()) ? 'default' : 'pointer',
                        opacity: (busy || !input.trim()) ? 0.5 : 1, transform: 'rotate(2deg)'
                    }}
                >
                    <i className="bx bx-send" style={{ fontSize: '1.2rem' }} />
                </button>
            </div>

            <style>{`
                .typing-dot {
                    display: inline-block;
                    width: 6px; height: 6px;
                    background: var(--ink-0);
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
                @keyframes pulse {
                    0%   { transform: scale(1); }
                    50%  { transform: scale(1.1); }
                    100% { transform: scale(1); }
                }
            `}</style>
        </div>
    );
}
