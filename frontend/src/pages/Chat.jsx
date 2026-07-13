import React, { useState, useRef, useEffect } from 'react';
import { api } from '../lib/api';

export default function Chat() {
    const [messages, setMessages] = useState([
        { role: 'ai', content: "Hello! I'm your Smart Diary AI. I have access to your memories. What would you like to ask about your past?" }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

    const handleSend = async (e) => {
        e.preventDefault();
        
        if (!input.trim() || loading) return;

        const userMsg = input.trim();
        setInput('');
        
        // Add user message to UI
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);

        try {
            // Hit the backend RAG endpoint
            const response = await api.askDiary(userMsg);
            
            // Add AI response to UI
            setMessages(prev => [...prev, { role: 'ai', content: response.result }]);
        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev => [...prev, { role: 'ai', content: "Sorry, I had trouble accessing your memories right now. Please try again later." }]);
        } finally {
            setLoading(false);
        }
    };

    // Helper to format text with basic markdown (bold)
    const formatText = (text) => {
        if (!text) return null;
        
        // Very basic formatting for bold (**text**) and newlines
        const paragraphs = text.split('\n').filter(p => p.trim() !== '');
        
        return paragraphs.map((p, pIndex) => {
            const parts = p.split(/(\*\*.*?\*\*)/g);
            return (
                <p key={pIndex} style={{ margin: '0 0 0.5rem 0', lineHeight: '1.6' }}>
                    {parts.map((part, i) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                            return <strong key={i} style={{ color: 'var(--accent-primary)' }}>{part.slice(2, -2)}</strong>;
                        }
                        return part;
                    })}
                </p>
            );
        });
    };

    return (
        <div className="chat-container" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', maxWidth: '800px', margin: '0 auto' }}>
            
            {/* Chat History */}
            <div className="card glass" style={{ flex: '1', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1.5rem', marginBottom: '1rem', scrollBehavior: 'smooth' }}>
                {messages.map((msg, index) => (
                    <div 
                        key={index} 
                        style={{ 
                            display: 'flex', 
                            flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                            gap: '1rem',
                            alignItems: 'flex-start'
                        }}
                    >
                        {/* Avatar */}
                        <div style={{ 
                            width: '40px', 
                            height: '40px', 
                            borderRadius: '50%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            background: msg.role === 'user' ? 'var(--accent-primary)' : 'rgba(108, 92, 231, 0.1)',
                            color: msg.role === 'user' ? '#fff' : 'var(--accent-primary)',
                            flexShrink: 0,
                            border: msg.role === 'ai' ? '1px solid var(--accent-primary)' : 'none'
                        }}>
                            <i className={msg.role === 'user' ? 'bx bx-user' : 'bx bx-bot'} style={{ fontSize: '1.5rem' }}></i>
                        </div>
                        
                        {/* Message Bubble */}
                        <div style={{ 
                            background: msg.role === 'user' ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                            color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
                            padding: '1rem 1.25rem',
                            borderRadius: '1.2rem',
                            borderTopRightRadius: msg.role === 'user' ? '0' : '1.2rem',
                            borderTopLeftRadius: msg.role === 'ai' ? '0' : '1.2rem',
                            maxWidth: '75%',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                        }}>
                            {msg.role === 'user' ? (
                                <p style={{ margin: 0, lineHeight: '1.5' }}>{msg.content}</p>
                            ) : (
                                <div>{formatText(msg.content)}</div>
                            )}
                        </div>
                    </div>
                ))}
                
                {/* Loading Indicator */}
                {loading && (
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(108, 92, 231, 0.1)', color: 'var(--accent-primary)', flexShrink: 0, border: '1px solid var(--accent-primary)' }}>
                            <i className='bx bx-bot' style={{ fontSize: '1.5rem' }}></i>
                        </div>
                        <div style={{ background: 'var(--bg-secondary)', padding: '1rem 1.5rem', borderRadius: '1.2rem', borderTopLeftRadius: '0', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <div className="typing-dot"></div>
                            <div className="typing-dot" style={{ animationDelay: '0.2s' }}></div>
                            <div className="typing-dot" style={{ animationDelay: '0.4s' }}></div>
                            <span style={{ marginLeft: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Searching your memories...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSend} className="card glass" style={{ display: 'flex', gap: '1rem', padding: '1rem', alignItems: 'center' }}>
                <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about your past memories..." 
                    style={{ flex: '1', background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', fontSize: '1rem' }}
                    disabled={loading}
                />
                <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem', borderRadius: '50%', width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} disabled={!input.trim() || loading}>
                    <i className='bx bx-send' style={{ fontSize: '1.25rem' }}></i>
                </button>
            </form>
            
            {/* Minimal inline CSS for the typing animation */}
            <style>{`
                .typing-dot {
                    width: 6px;
                    height: 6px;
                    background: var(--accent-primary);
                    border-radius: 50%;
                    animation: bounce 1.4s infinite ease-in-out both;
                }
                @keyframes bounce {
                    0%, 80%, 100% { transform: scale(0); }
                    40% { transform: scale(1); }
                }
            `}</style>
        </div>
    );
}
