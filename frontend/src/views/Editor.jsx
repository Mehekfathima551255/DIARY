import React, { useState } from 'react';
import { api } from '../api';

export default function Editor({ setCurrentView }) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [mood, setMood] = useState('Neutral');
    const [tags, setTags] = useState('');
    const [location, setLocation] = useState('');
    const [weather, setWeather] = useState('');
    const [favorite, setFavorite] = useState(false);
    
    const [isSaving, setIsSaving] = useState(false);
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [feedback, setFeedback] = useState('');

    const handleSave = async () => {
        if (!title.trim() || !content.trim()) {
            alert("Title and content are required!");
            return;
        }

        try {
            setIsSaving(true);
            await api.createMemory({ 
                title,
                content, 
                mood,
                tags,
                location,
                weather,
                favorite 
            });
            setCurrentView('memories');
        } catch (error) {
            console.error("Error saving entry:", error);
            alert("Failed to save entry. Please check your connection.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleEnhance = () => {
        setIsEnhancing(true);
        // Mock AI behavior for now
        setTimeout(() => {
            if (!title) setTitle('A Wonderful Day');
            setMood('Happy');
            setTags('happy, memories, journal');
            setFeedback("AI enhanced your entry! Added title, mood, and tags.");
            setIsEnhancing(false);
        }, 1000);
    };

    return (
        <div className="editor-container" style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Main Editor Card */}
            <div className="card glass">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <input 
                        type="text" 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Memory Title"
                        style={{ fontSize: '1.5rem', fontWeight: 600, background: 'transparent', border: 'none', color: 'var(--text-primary)', padding: '0.5rem 0', outline: 'none', fontFamily: 'var(--font-heading)' }}
                    />
                    <button 
                        onClick={() => setFavorite(!favorite)} 
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: favorite ? 'var(--danger)' : 'var(--text-secondary)' }}
                    >
                        <i className={favorite ? 'bx bxs-heart' : 'bx bx-heart'}></i>
                    </button>
                </div>
                
                <textarea 
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="What's on your mind today?" 
                    style={{ width: '100%', minHeight: '300px', fontSize: '1.1rem', border: 'none', resize: 'vertical', lineHeight: '1.6', background: 'transparent', color: 'var(--text-primary)', outline: 'none' }}
                />
            </div>

            {/* Metadata Card */}
            <div className="card glass" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Mood</label>
                    <select value={mood} onChange={(e) => setMood(e.target.value)}>
                        <option value="Neutral">😐 Neutral</option>
                        <option value="Happy">😊 Happy</option>
                        <option value="Sad">😢 Sad</option>
                        <option value="Anxious">😰 Anxious</option>
                        <option value="Excited">🤩 Excited</option>
                        <option value="Angry">😠 Angry</option>
                    </select>
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Tags (comma separated)</label>
                    <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="travel, work, happy" />
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Location</label>
                    <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g., San Francisco, CA" />
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Weather</label>
                    <input type="text" value={weather} onChange={(e) => setWeather(e.target.value)} placeholder="Sunny, 72°F" />
                </div>
            </div>
            
            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button onClick={handleEnhance} className="btn btn-secondary" title="Let AI suggest title, mood, and tags" disabled={isEnhancing}>
                    {isEnhancing ? <><i className='bx bx-loader-alt bx-spin'></i> Enhancing...</> : <><i className='bx bx-magic-wand'></i> AI Enhance</>}
                </button>
                
                <button onClick={handleSave} className="btn btn-primary" disabled={isSaving}>
                    {isSaving ? <><i className='bx bx-loader-alt bx-spin'></i> Saving...</> : <><i className='bx bx-save'></i> Save Entry</>}
                </button>
            </div>
            
            {feedback && (
                <div style={{ color: 'var(--success)', fontSize: '0.9rem', textAlign: 'center' }}>
                    {feedback}
                </div>
            )}
        </div>
    );
}
