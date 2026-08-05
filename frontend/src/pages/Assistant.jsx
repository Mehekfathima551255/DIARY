import React, { useEffect, useRef, useState, useMemo } from 'react';
import { api } from '../lib/api';
import { useTTS } from '../lib/useTTS';
import { moodMeta } from '../lib/demo';
import MemoryDetail from './MemoryDetail';

// A helper to strip HTML tags for plain text rendering
function stripHtml(html) {
    const d = document.createElement('div');
    d.innerHTML = html || '';
    return d.textContent || d.innerText || '';
}

export default function Assistant() {
    const { speak, speakingId } = useTTS();
    
    // Core memories list
    const [memories, setMemories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
    
    // AI Greeting & Dashboard states
    const [greetingData, setGreetingData] = useState(null);
    
    // Weekly Letter states
    const [showLetter, setShowLetter] = useState(false);
    const [letterData, setLetterData] = useState(null);
    const [letterLoading, setLetterLoading] = useState(false);
    const [letterError, setLetterError] = useState('');
    const [letterMsgIndex, setLetterMsgIndex] = useState(0);

    // Chat companion messages state
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [busy, setBusy] = useState(false);
    const [chatMode, setChatMode] = useState(false);
    const [viewingMemory, setViewingMemory] = useState(null);

    // Audio recording / speech recognition state
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef(null);
    const bodyRef = useRef(null);

    // Themed loading messages
    const loadingMessages = useMemo(() => [
        "Reading your journal...",
        "Connecting memories...",
        "Revisiting old pages...",
        "Scanning your emotional landscapes...",
        "Binding the pages together..."
    ], []);

    const letterMessages = useMemo(() => [
        "Folding the parchment...",
        "Sealing the envelope...",
        "Drafting weekly thoughts...",
        "Looking back at your wins...",
        "Connecting your stories..."
    ], []);

    // Rotating loading message effects
    useEffect(() => {
        if (loading) {
            const interval = setInterval(() => {
                setLoadingMsgIndex((prev) => (prev + 1) % loadingMessages.length);
            }, 1500);
            return () => clearInterval(interval);
        }
    }, [loading, loadingMessages]);

    useEffect(() => {
        if (letterLoading) {
            const interval = setInterval(() => {
                setLetterMsgIndex((prev) => (prev + 1) % letterMessages.length);
            }, 1400);
            return () => clearInterval(interval);
        }
    }, [letterLoading, letterMessages]);

    // Load memories and fetch companion greeting
    const loadMemoriesAndGreeting = async () => {
        try {
            // Load base memories list
            const list = await api.getMemories();
            setMemories(list);

            // Fetch proactive AI greeting from the backend
            const greetingRes = await api.getCompanionGreeting();
            if (greetingRes && greetingRes.result) {
                try {
                    const parsed = JSON.parse(greetingRes.result);
                    setGreetingData(parsed);
                } catch (e) {
                    console.error("Failed to parse greeting JSON:", e);
                }
            }
        } catch (err) {
            console.error('Failed to load companion details:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMemoriesAndGreeting();
    }, []);

    // Scroll chat body to bottom
    useEffect(() => {
        if (bodyRef.current) {
            bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
        }
    }, [messages, busy]);

    // Local stats fallback engine (if backend is offline or empty)
    const companionInsights = useMemo(() => {
        if (memories.length === 0) return null;

        const now = new Date();
        const stats = {
            totalEntries: memories.length,
            inactivityDays: 0,
            anniversaryToday: null,
            happiestDay: 'Friday',
            placesVisited: 0,
            photosUploaded: 0,
            longestEntry: null,
            topicFrequency: {},
            tagFrequency: {},
            connections: [],
            suggestions: [],
            weeklyLetter: null
        };

        // 1. Calculate inactivity
        const sorted = [...memories].sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
        const lastEntry = sorted[0];
        if (lastEntry) {
            const diffTime = Math.abs(now - new Date(lastEntry.created_at));
            stats.inactivityDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        }

        // 2. Anniversaries
        const anniversaryMemory = memories.find(m => {
            const d = new Date(m.created_at);
            return d.getMonth() === now.getMonth() && d.getDate() === now.getDate() && d.getFullYear() < now.getFullYear();
        });
        if (anniversaryMemory) {
            const yearsAgo = now.getFullYear() - new Date(anniversaryMemory.created_at).getFullYear();
            stats.anniversaryToday = {
                memory: anniversaryMemory,
                yearsAgo,
                label: `Exactly ${yearsAgo} year${yearsAgo > 1 ? 's' : ''} ago today, you wrote: "${anniversaryMemory.title}"`
            };
        }

        // 3. Simple scanning for fallbacks
        let longestLen = 0;
        const locationsSet = new Set();
        
        memories.forEach(m => {
            const plain = stripHtml(m.content).toLowerCase();
            if (plain.split(/\s+/).length > longestLen) {
                longestLen = plain.split(/\s+/).length;
                stats.longestEntry = m;
            }

            if (m.image_url) stats.photosUploaded += 1;
            if (m.image_url2) stats.photosUploaded += 1;
            if (m.image_url3) stats.photosUploaded += 1;

            if (m.location) locationsSet.add(m.location);

            if (m.tags) {
                m.tags.split(',').forEach(t => {
                    const tag = t.trim().toLowerCase();
                    if (tag) stats.tagFrequency[tag] = (stats.tagFrequency[tag] || 0) + 1;
                });
            }

            ['coffee', 'football', 'beach', 'studying', 'friends', 'family', 'travel', 'trip'].forEach(word => {
                if (plain.includes(word)) {
                    stats.topicFrequency[word] = (stats.topicFrequency[word] || 0) + 1;
                }
            });
        });

        stats.placesVisited = locationsSet.size;

        // Connections
        if (stats.topicFrequency.coffee && stats.topicFrequency.studying) {
            stats.connections.push("☕ You often write about coffee whenever you're studying.");
        }
        if (stats.tagFrequency.travel || stats.topicFrequency.travel || stats.topicFrequency.trip) {
            stats.connections.push("✈️ Your longest journal entries are usually written while travelling.");
        }
        if (stats.topicFrequency.friends) {
            stats.connections.push("👥 Most of your happiest memories seem to involve your friends.");
        }

        if (stats.connections.length === 0) {
            stats.connections.push("🌿 Keeping a regular journal increases positive self-awareness.");
            stats.connections.push("📖 You capture your thoughts beautifully across the week.");
        }

        // Suggestions
        if (stats.anniversaryToday) {
            stats.suggestions.push(`It's been exactly ${stats.anniversaryToday.yearsAgo} year${stats.anniversaryToday.yearsAgo > 1 ? 's' : ''} since: "${stats.anniversaryToday.memory.title}"`);
        }
        if (stats.inactivityDays >= 3) {
            stats.suggestions.push(`You haven't written in ${stats.inactivityDays} days. Ready to continue your story?`);
        }
        stats.suggestions.push("Show me my happiest memories");
        stats.suggestions.push("When was the last time you visited a beach?");
        stats.suggestions.push("Find memories where it rained");

        return stats;
    }, [memories]);

    // Computed dynamic greeting string (fallback)
    const fallbackGreeting = useMemo(() => {
        if (!companionInsights) return "Welcome back. Let's continue your story.";
        if (companionInsights.anniversaryToday) {
            return `Good Morning! ${companionInsights.anniversaryToday.yearsAgo} year${companionInsights.anniversaryToday.yearsAgo > 1 ? 's' : ''} ago today you were in ${companionInsights.anniversaryToday.memory.location || 'Goa'}. Would you like to revisit that memory?`;
        }
        if (companionInsights.inactivityDays >= 3) {
            return `Welcome back. You haven't written anything for ${companionInsights.inactivityDays} days. Ready to continue your story?`;
        }
        return "Good evening! Ready to reflect on today's chapters?";
    }, [companionInsights]);

    // Greeting memory lookups
    const highlightedMemory = useMemo(() => {
        if (!memories.length) return null;
        if (greetingData?.highlight_id) {
            const matched = memories.find(m => m.id === greetingData.highlight_id);
            if (matched) return matched;
        }
        return companionInsights?.anniversaryToday?.memory || companionInsights?.longestEntry || memories[0];
    }, [memories, greetingData, companionInsights]);

    const greetingReasonText = useMemo(() => {
        if (greetingData?.highlight_reason) return greetingData.highlight_reason;
        if (companionInsights?.anniversaryToday) return "An anniversary memory worth looking back on.";
        return "Let's revisit a special entry.";
    }, [greetingData, companionInsights]);

    // Handle fetching weekly summary letter
    const handleOpenLetter = async () => {
        setShowLetter(true);
        if (letterData) return; // already loaded
        
        setLetterLoading(true);
        setLetterError('');
        try {
            const res = await api.getWeeklyLetter();
            if (res && res.result) {
                const parsed = JSON.parse(res.result);
                setLetterData(parsed);
            } else {
                throw new Error("Invalid response format");
            }
        } catch (err) {
            console.error("Failed to fetch weekly letter:", err);
            setLetterError("Could not retrieve weekly letter right now.");
        } finally {
            setLetterLoading(false);
        }
    };

    // Chat sending handler
    const send = async (text) => {
        const q = (text ?? input).trim();
        if (!q || busy) return;
        
        setChatMode(true);
        setMessages((m) => [...m, { role: 'user', text: q }]);
        setInput('');
        setBusy(true);

        try {
            const res = await api.chat(q);
            let parsed = { text: res.result || "I couldn't find anything.", matched_ids: [], timeline: [] };
            
            try {
                parsed = JSON.parse(res.result);
            } catch {
                parsed = { text: res.result, matched_ids: [], timeline: [] };
            }

            // Map integer IDs to memory models
            const matchedMemories = [];
            if (parsed.matched_ids && Array.isArray(parsed.matched_ids)) {
                parsed.matched_ids.forEach(id => {
                    const match = memories.find(m => m.id === Number(id));
                    if (match) matchedMemories.push(match);
                });
            }

            setMessages((m) => [
                ...m,
                { 
                    role: 'bot', 
                    text: parsed.text,
                    memories: matchedMemories,
                    timeline: parsed.timeline || []
                },
            ]);
        } catch (err) {
            console.error("Error in companion chat:", err);
            setMessages((m) => [
                ...m,
                { role: 'bot', text: "I ran into a small error reading your pages. Let me try flipping through them again." },
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
        if (!SpeechRecognition) { 
            alert('Speech recognition is not supported in this browser. Try Chrome.'); 
            return; 
        }
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

    // Themed loading view
    if (loading) {
        return (
            <div className="flex-center" style={{ height: '70vh', flexDirection: 'column', gap: '1.5rem' }}>
                <i className='bx bx-loader-alt bx-spin' style={{ fontSize: '3rem', color: 'var(--accent-olive)' }}></i>
                <div style={{ fontFamily: 'var(--font-hand)', fontSize: '1.6rem', color: 'var(--text-secondary)', animation: 'pulse 2s infinite' }}>
                    {loadingMessages[loadingMsgIndex]}
                </div>
            </div>
        );
    }

    if (viewingMemory) {
        return (
            <MemoryDetail 
                memory={viewingMemory} 
                onBack={() => {
                    setViewingMemory(null);
                    loadMemoriesAndGreeting();
                }}
                onDeleted={() => {
                    setViewingMemory(null);
                    loadMemoriesAndGreeting();
                }}
            />
        );
    }

    const suggestions = greetingData?.suggestions || companionInsights?.suggestions || [];
    const connections = greetingData?.connections || companionInsights?.connections || [];
    const greetingText = greetingData?.greeting || fallbackGreeting;

    return (
        <div style={{ maxWidth: '960px', margin: '0 auto', padding: '1rem' }}>
            <div 
                className="companion-binder-bg"
                style={{
                    background: 'linear-gradient(135deg, #2b221a 0%, #15110e 100%)',
                    borderRadius: '2rem',
                    padding: '2.5rem 2rem',
                    boxShadow: '0 30px 80px rgba(0,0,0,0.65)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    position: 'relative',
                    minHeight: '620px',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                {/* Book Coil Ring Bind */}
                <div style={{
                    position: 'absolute', left: '35px', top: '5%', bottom: '5%',
                    width: '6px', zIndex: 10,
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                    pointerEvents: 'none', opacity: 0.35
                }}>
                    {Array.from({ length: 15 }).map((_, i) => (
                        <div key={i} style={{
                            width: '20px', height: '8px',
                            background: 'linear-gradient(to right, #444, #e7e5e4, #111)',
                            borderRadius: '3px',
                            transform: 'translateX(-6px)',
                            boxShadow: '0 3px 5px rgba(0,0,0,0.5)'
                        }} />
                    ))}
                </div>

                <div style={{ paddingLeft: '50px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid rgba(255,255,255,0.06)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                        <div>
                            <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.75rem', color: '#eae6e2' }}>
                                Journal Companion 🌿
                            </h2>
                            <div style={{ fontSize: '0.8rem', color: '#a8a29e', marginTop: '0.2rem' }}>
                                A reflective companion who remembers every chapter of your story.
                            </div>
                        </div>

                        {chatMode && (
                            <button
                                className="btn btn-secondary"
                                onClick={() => setChatMode(false)}
                                style={{ fontFamily: 'var(--font-sans)', fontSize: '0.78rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#eae6e2', cursor: 'pointer' }}
                            >
                                <i className="bx bx-home-alt" style={{ marginRight: '3px' }} /> Dashboard Home
                            </button>
                        )}
                    </div>

                    {/* DYNAMIC HOME SCREEN */}
                    {!chatMode ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2.5rem', flex: 1 }}>
                            
                            {/* Left Column: Greeting Note & Connections */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                
                                <div 
                                    className="sticky-note yellow" 
                                    style={{ 
                                        padding: '1.5rem', 
                                        transform: 'rotate(-1.5deg)', 
                                        position: 'relative',
                                        boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                                        border: '1px solid rgba(0,0,0,0.05)'
                                    }}
                                >
                                    <div className="pin"></div>
                                    <h3 style={{ fontFamily: 'var(--font-hand)', fontSize: '1.6rem', color: '#1c1917', margin: '0 0 0.5rem 0' }}>
                                        Dear Writer,
                                    </h3>
                                    <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.3rem', color: '#292524', lineHeight: 1.5, margin: 0 }}>
                                        {greetingText}
                                    </p>

                                    {highlightedMemory && (
                                        <div style={{ marginTop: '1.2rem', paddingTop: '0.8rem', borderTop: '1px dashed rgba(0,0,0,0.15)' }}>
                                            <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', color: '#57534e', fontStyle: 'italic', marginBottom: '0.4rem' }}>
                                                💡 {greetingReasonText}
                                            </div>
                                            <button
                                                type="button"
                                                className="btn btn-primary"
                                                style={{
                                                    background: 'linear-gradient(135deg, #1c1917, #44403c)',
                                                    border: 'none', color: '#faf6ee',
                                                    fontSize: '0.75rem', padding: '0.4rem 0.85rem',
                                                    cursor: 'pointer', fontFamily: 'var(--font-sans)',
                                                    fontWeight: 600
                                                }}
                                                onClick={() => setViewingMemory(highlightedMemory)}
                                            >
                                                📖 Revisit: {highlightedMemory.title}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#a8a29e', letterSpacing: '0.08em', fontWeight: 600 }}>
                                        Memory Connections Discovered:
                                    </div>
                                    {connections.map((conn, idx) => (
                                        <div 
                                            key={idx}
                                            className="torn-edge"
                                            style={{ 
                                                background: 'var(--paper-cream, #faf6ee)', 
                                                padding: '0.85rem 1.1rem',
                                                fontSize: '0.88rem',
                                                fontFamily: 'var(--font-sans)',
                                                color: '#1c1917',
                                                borderRadius: '6px',
                                                boxShadow: '0 4px 15px rgba(0,0,0,0.25)',
                                                transform: `rotate(${idx % 2 === 0 ? 0.5 : -0.5}deg)`,
                                                borderLeft: '4.5px solid var(--accent-olive)'
                                            }}
                                        >
                                            {conn}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Right Column: Letters & Dynamic Prompts */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'center' }}>
                                
                                {/* Envelope UI */}
                                <div 
                                    className="envelope-envelope-wrap"
                                    onClick={handleOpenLetter}
                                    style={{
                                        background: '#d4c5b3',
                                        width: '240px',
                                        height: '160px',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(0,0,0,0.15)',
                                        boxShadow: '0 15px 35px rgba(0,0,0,0.4)',
                                        cursor: 'pointer',
                                        position: 'relative',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexDirection: 'column',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-6px) rotate(1deg)'}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0) rotate(0deg)'}
                                >
                                    <div style={{
                                        position: 'absolute', top: 0, left: 0, right: 0, height: 0,
                                        borderLeft: '120px solid transparent',
                                        borderRight: '120px solid transparent',
                                        borderTop: '75px solid #bdab94',
                                        zIndex: 2
                                    }} />
                                    <div style={{
                                        width: '42px', height: '42px',
                                        background: 'linear-gradient(135deg, #b91c1c 0%, #7f1d1d 100%)',
                                        borderRadius: '50%',
                                        zIndex: 5,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: '#fef08a', fontSize: '1.3rem',
                                        boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                                        transform: 'translateY(15px)'
                                    }}>
                                        🌿
                                    </div>
                                    <div style={{ zIndex: 3, marginTop: '3rem', fontFamily: 'var(--font-hand)', fontSize: '1.25rem', color: '#5c544a', fontWeight: 700 }}>
                                        Open Weekly Letter
                                    </div>
                                </div>

                                {/* Dynamic Prompts */}
                                <div style={{ width: '100%' }}>
                                    <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#a8a29e', letterSpacing: '0.08em', fontWeight: 600, marginBottom: '0.75rem', textAlign: 'center' }}>
                                        Ask your companion:
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {suggestions.slice(0, 3).map((sugg, idx) => (
                                            <button
                                                key={idx}
                                                className="btn btn-secondary"
                                                style={{
                                                    width: '100%',
                                                    textAlign: 'left',
                                                    fontFamily: 'var(--font-sans)',
                                                    fontSize: '0.84rem',
                                                    background: 'rgba(255,255,255,0.04)',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    borderRadius: '8px',
                                                    padding: '0.6rem 1rem',
                                                    color: '#d6d3d1',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                                                    e.currentTarget.style.borderColor = 'var(--accent-olive)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                                                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                                                }}
                                                onClick={() => send(sugg)}
                                            >
                                                ✨ {sugg}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        
                        /* CONVERSATIONAL CHAT SCREEN */
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                            
                            {/* Messages Container */}
                            <div ref={bodyRef} style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '2.25rem' }}>
                                
                                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                                    <div className="torn-edge" style={{ background: 'var(--paper-cream, #faf6ee)', padding: '1.5rem', maxWidth: '80%', position: 'relative', boxShadow: '0 8px 24px rgba(0,0,0,0.3)', transform: 'rotate(0.5deg)' }}>
                                        <div className="tape top-center" style={{ width: '40px' }} />
                                        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '1.02rem', color: '#1c1917', lineHeight: 1.6, margin: 0 }}>
                                            {greetingText}
                                        </p>
                                    </div>
                                </div>

                                {messages.map((m, i) => (
                                    <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                                        
                                        <div style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', width: '100%' }}>
                                            
                                            {m.role === 'bot' ? (
                                                <div className="torn-edge" style={{ background: 'var(--paper-cream, #faf6ee)', padding: '1.5rem', maxWidth: '82%', position: 'relative', boxShadow: '0 8px 25px rgba(0,0,0,0.3)', transform: `rotate(${i % 2 === 0 ? 0.5 : -0.5}deg)` }}>
                                                    <div className="tape top-center" style={{ width: '45px' }} />
                                                    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '1.02rem', color: '#1c1917', lineHeight: 1.6, paddingBottom: '0.4rem' }}>
                                                        {m.text.split('\n').map((para, idx) => (
                                                            <p key={idx} style={{ margin: '0 0 0.75rem 0' }}>{para}</p>
                                                        ))}
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => speak(m.text, i)}
                                                        style={{ background: 'none', border: 'none', color: '#78716c', cursor: 'pointer', position: 'absolute', right: '12px', bottom: '12px', fontSize: '1.15rem' }}
                                                    >
                                                        <i className={`bx ${speakingId === i ? 'bx-stop-circle' : 'bx-volume-full'}`} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div 
                                                    className="sticky-note yellow" 
                                                    style={{ 
                                                        padding: '1.1rem 1.5rem', 
                                                        maxWidth: '70%', 
                                                        position: 'relative', 
                                                        transform: `rotate(${i % 2 === 0 ? -1.5 : 1.5}deg)`,
                                                        boxShadow: '0 8px 20px rgba(0,0,0,0.35)',
                                                        border: '1px solid rgba(0,0,0,0.04)'
                                                    }}
                                                >
                                                    <div className="pin" />
                                                    <div style={{ fontFamily: 'var(--font-hand)', fontSize: '1.28rem', color: '#1c1917', lineHeight: 1.45 }}>
                                                        {m.text}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Matches display (Polaroid layout) */}
                                        {m.role === 'bot' && m.memories && m.memories.length > 0 && (
                                            <div 
                                                className="polaroid-grid-scroll"
                                                style={{ 
                                                    display: 'flex', gap: '1.5rem', 
                                                    overflowX: 'auto', width: '100%', 
                                                    padding: '1rem 0.5rem 1.5rem 0.5rem'
                                                }}
                                            >
                                                {m.memories.map((mem) => {
                                                    const dateStr = new Date(mem.created_at).toLocaleDateString('en-US', {
                                                        month: 'short', day: 'numeric', year: 'numeric'
                                                    });
                                                    return (
                                                        <div 
                                                            key={mem.id}
                                                            style={{
                                                                flexShrink: 0,
                                                                width: '180px',
                                                                background: '#ffffff',
                                                                padding: '10px 10px 30px 10px',
                                                                boxShadow: '0 10px 20px rgba(0,0,0,0.4)',
                                                                borderRadius: '2px',
                                                                transform: `rotate(${Math.sin(mem.id) * 3}deg)`,
                                                                transition: 'transform 0.2s',
                                                                border: '1px solid rgba(0,0,0,0.06)'
                                                            }}
                                                            className="polaroid-memory-card"
                                                        >
                                                            <div style={{ width: '100%', height: '110px', background: '#eae6e2', overflow: 'hidden', position: 'relative', borderRadius: '2px' }}>
                                                                {mem.image_url ? (
                                                                    <img 
                                                                        src={api.imageUrl(mem.image_url)} 
                                                                        alt={mem.title} 
                                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                                    />
                                                                ) : (
                                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#a8a29e', fontSize: '2.5rem' }}>
                                                                        📷
                                                                    </div>
                                                                )}
                                                            </div>
                                                            
                                                            <h4 style={{ margin: '8px 0 2px 0', fontFamily: 'var(--font-sans)', fontSize: '0.82rem', fontWeight: 700, color: '#1c1917', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                {mem.title}
                                                            </h4>
                                                            <div style={{ fontSize: '0.7rem', color: '#78716c', fontFamily: 'var(--font-hand)', marginBottom: '8px' }}>
                                                                📅 {dateStr}
                                                            </div>

                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <span style={{ fontSize: '0.75rem' }}>{moodMeta(mem.mood).emoji}</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setViewingMemory(mem)}
                                                                    style={{
                                                                        background: 'var(--accent-olive)',
                                                                        color: '#fff',
                                                                        border: 'none',
                                                                        borderRadius: '4px',
                                                                        padding: '0.2rem 0.55rem',
                                                                        fontSize: '0.68rem',
                                                                        cursor: 'pointer',
                                                                        fontFamily: 'var(--font-sans)',
                                                                        fontWeight: 600
                                                                    }}
                                                                >
                                                                    Open
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Timeline component */}
                                        {m.role === 'bot' && m.timeline && m.timeline.length > 0 && (
                                            <div style={{ width: '100%', padding: '1rem 2.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                                                <div style={{ borderLeft: '3px dashed var(--accent-olive)', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
                                                    {m.timeline.map((point, pidx) => {
                                                        const matchingMemory = memories.find(m => m.id === Number(point.memory_id));
                                                        return (
                                                            <div key={pidx} style={{ position: 'relative' }}>
                                                                <div style={{
                                                                    position: 'absolute', left: '-31px', top: '5px',
                                                                    width: '11px', height: '11px', borderRadius: '50%',
                                                                    background: 'var(--accent-olive)', border: '2px solid #fff',
                                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                                                                }} />

                                                                <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
                                                                    <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.9rem', color: 'var(--accent-terra)' }}>
                                                                        {point.year}
                                                                    </span>
                                                                    <div 
                                                                        onClick={() => matchingMemory && setViewingMemory(matchingMemory)}
                                                                        style={{
                                                                            background: 'var(--paper-cream, #faf6ee)',
                                                                            padding: '0.5rem 0.85rem',
                                                                            borderRadius: '6px',
                                                                            boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                                                                            color: '#1c1917',
                                                                            fontSize: '0.85rem',
                                                                            cursor: matchingMemory ? 'pointer' : 'default',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: '0.4rem',
                                                                            border: '1px solid rgba(0,0,0,0.06)'
                                                                        }}
                                                                    >
                                                                        <span style={{ fontWeight: 600 }}>{point.date}:</span>
                                                                        <span>{point.title}</span>
                                                                        {matchingMemory && <span style={{ fontSize: '0.72rem', color: 'var(--accent-olive)' }}>🔗 View</span>}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                    </div>
                                ))}

                                {busy && (
                                    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                                        <div className="torn-edge" style={{ background: 'var(--paper-cream, #faf6ee)', padding: '1rem 1.5rem', position: 'relative', boxShadow: '0 8px 20px rgba(0,0,0,0.25)', transform: 'rotate(-0.5deg)' }}>
                                            <div className="tape top-center" style={{ width: '30px' }} />
                                            <span className="chat-typing">
                                                <span className="typing-dot" />
                                                <span className="typing-dot" style={{ animationDelay: '0.2s' }} />
                                                <span className="typing-dot" style={{ animationDelay: '0.4s' }} />
                                                <span style={{ marginLeft: '0.5rem', fontFamily: 'var(--font-hand)', fontSize: '1.25rem', color: '#57524e' }}>
                                                    Companion is flipping through your pages…
                                                </span>
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Chat input box */}
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '1rem', background: 'var(--paper-cream, #faf6ee)', border: '1px solid var(--border-light)', borderRadius: '8px', boxShadow: '0 8px 25px rgba(0,0,0,0.3)', position: 'relative' }}>
                                <div className="tape top-center" style={{ width: '50px', top: '-10px' }} />
                                <input
                                    placeholder={isListening ? 'Listening…' : 'Ask about your memories, travels, or friends…'}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={onKey}
                                    disabled={busy}
                                    style={{ flexGrow: 1, background: 'transparent', border: 'none', borderBottom: '2px dashed #cbd5e1', fontFamily: 'var(--font-hand)', fontSize: '1.3rem', outline: 'none', padding: '0.5rem', color: '#1c1917' }}
                                />
                                <button
                                    type="button"
                                    style={{
                                        background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.5rem',
                                        color: isListening ? 'var(--accent-terra)' : '#78716c',
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
                        </div>
                    )}
                </div>
            </div>

            {/* HANDWRITTEN SUMMARY LETTER POPUP MODAL */}
            {showLetter && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 1000,
                    background: 'rgba(0,0,0,0.65)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '1.5rem'
                }}>
                    <div 
                        className="letter-container-box"
                        style={{
                            background: '#fcf8f2',
                            backgroundImage: 'radial-gradient(#ebdcb9 0.5px, transparent 0.5px), radial-gradient(#ebdcb9 0.5px, #fcf8f2 0.5px)',
                            backgroundSize: '20px 20px',
                            backgroundPosition: '0 0, 10px 10px',
                            width: '100%',
                            maxWidth: '540px',
                            borderRadius: '16px',
                            padding: '2.5rem',
                            boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
                            position: 'relative',
                            border: '1.5px dashed #bda78a',
                            animation: 'letterRotateIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
                        }}
                    >
                        {/* Red seal ornament top right */}
                        <div style={{ position: 'absolute', top: 20, right: 25, fontSize: '2rem', opacity: 0.85 }}>
                            🌿
                        </div>

                        {letterLoading ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '220px', gap: '1rem' }}>
                                <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '2.5rem', color: '#5c544a' }}></i>
                                <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.3rem', color: '#5c544a', animation: 'pulse 1.8s infinite' }}>
                                    {letterMessages[letterMsgIndex]}
                                </p>
                            </div>
                        ) : letterError ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '220px', gap: '1rem' }}>
                                <p style={{ color: 'var(--danger)', fontFamily: 'var(--font-sans)', fontSize: '0.9rem', textAlign: 'center' }}>
                                    {letterError}
                                </p>
                                <button
                                    onClick={fetchWeeklyLetter}
                                    style={{
                                        fontFamily: 'var(--font-sans)', fontSize: '0.8rem', padding: '0.4rem 1.2rem',
                                        background: '#5c544a', color: '#faf6ee', border: 'none', borderRadius: '15px', cursor: 'pointer'
                                    }}
                                >
                                    Retry
                                </button>
                            </div>
                        ) : letterData ? (
                            <>
                                <h3 style={{ fontFamily: 'var(--font-hand)', fontSize: '1.8rem', color: '#5c544a', margin: '0 0 1.25rem 0', borderBottom: '1px solid #ebdcb9', paddingBottom: '0.5rem' }}>
                                    {letterData.salutation || "Dear Writer,"}
                                </h3>

                                <div style={{ fontFamily: 'var(--font-hand)', fontSize: '1.45rem', color: '#1c1917', lineHeight: 1.6, margin: '0 0 1.5rem 0' }}>
                                    {letterData.body.split('\n').map((para, pIdx) => (
                                        <p key={pIdx} style={{ margin: '0 0 1rem 0' }}>{para}</p>
                                    ))}
                                </div>

                                <div style={{ textAlign: 'right', fontFamily: 'var(--font-hand)', fontSize: '1.5rem', color: '#5c544a', lineHeight: 1.3 }}>
                                    {letterData.closing || "Love,"}<br />
                                    <span style={{ fontWeight: 700 }}>{letterData.signature || "Your Journal Companion"}</span>
                                </div>

                                {letterData.stats && (
                                    <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px dashed #ebdcb9', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 1.5rem', fontFamily: 'var(--font-sans)', fontSize: '0.8rem', color: '#78716c' }}>
                                        <div>📝 Entries written: <strong>{letterData.stats.entries_written}</strong></div>
                                        <div>🏷️ Words logged: <strong>{letterData.stats.total_words}</strong></div>
                                        <div>📷 Photos added: <strong>{letterData.stats.photos_added}</strong></div>
                                        <div>📅 happiest day: <strong>{letterData.stats.happiest_day}</strong></div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '220px', gap: '1rem' }}>
                                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.85rem', color: '#78716c' }}>
                                    Your letter envelope is ready to open.
                                </p>
                                <button
                                    onClick={fetchWeeklyLetter}
                                    style={{
                                        fontFamily: 'var(--font-sans)', fontSize: '0.82rem', padding: '0.45rem 1.5rem',
                                        background: '#5c544a', color: '#faf6ee', border: 'none', borderRadius: '20px', cursor: 'pointer'
                                    }}
                                >
                                    Read Letter
                                </button>
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2.25rem' }}>
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowLetter(false)}
                                style={{
                                    fontFamily: 'var(--font-sans)', fontSize: '0.82rem', padding: '0.45rem 1.5rem',
                                    background: '#78716c', color: '#faf6ee', border: 'none', borderRadius: '20px', cursor: 'pointer'
                                }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{ __html: `
                .typing-dot {
                    display: inline-block;
                    width: 6px; height: 6px;
                    background: #1c1917;
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
                    50%  { transform: scale(1.08); }
                    100% { transform: scale(1); }
                }
                @keyframes letterRotateIn {
                    0% { transform: scale(0.6) rotate(-8deg); opacity: 0; }
                    100% { transform: scale(1) rotate(-1deg); opacity: 1; }
                }
                .polaroid-grid-scroll::-webkit-scrollbar {
                    height: 8px;
                }
                .polaroid-grid-scroll::-webkit-scrollbar-track {
                    background: rgba(255,255,255,0.05);
                    border-radius: 4px;
                }
                .polaroid-grid-scroll::-webkit-scrollbar-thumb {
                    background: rgba(255,255,255,0.25);
                    border-radius: 4px;
                }
                .polaroid-memory-card:hover {
                    transform: scale(1.05) rotate(0deg) !important;
                    z-index: 50;
                }
            `}} />
        </div>
    );
}
