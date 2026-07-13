import React, { useState } from 'react';
import { api } from '../api';

export default function Editor({ setCurrentView }) {
    const [content, setContent] = useState('');
    const [mood, setMood] = useState('Neutral');
    const [isSaving, setIsSaving] = useState(false);
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [feedback, setFeedback] = useState('');

    const handleSave = async () => {
        if (!content.trim()) {
            alert("Please write something first!");
            return;
        }

        try {
            setIsSaving(true);
            await api.createMemory({ content, mood });
            setCurrentView('dashboard');
        } catch (error) {
            console.error("Error saving entry:", error);
            alert("Failed to save entry. Is the backend running?");
        } finally {
            setIsSaving(false);
        }
    };

    const handleEnhance = () => {
        setIsEnhancing(true);
        // Mock AI behavior for now
        setTimeout(() => {
            setMood('Happy');
            setFeedback("AI detected a Happy mood based on your text!");
            setIsEnhancing(false);
        }, 1000);
    };

    return (
        <div className="editor-container" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="card glass" style={{ marginBottom: '1.5rem' }}>
                <textarea 
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="What's on your mind today?" 
                    style={{ width: '100%', minHeight: '400px', fontSize: '1.1rem', border: 'none', resize: 'vertical', lineHeight: '1.6', background: 'transparent', color: 'var(--text-primary)', outline: 'none' }}
                />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <select 
                        value={mood}
                        onChange={(e) => setMood(e.target.value)}
                        style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                    >
                        <option value="Neutral">😐 Neutral</option>
                        <option value="Happy">😊 Happy</option>
                        <option value="Sad">😢 Sad</option>
                        <option value="Anxious">😰 Anxious</option>
                        <option value="Excited">🤩 Excited</option>
                        <option value="Angry">😠 Angry</option>
                    </select>
                    
                    <button onClick={handleEnhance} className="btn btn-secondary" title="Let AI suggest mood and tags" disabled={isEnhancing}>
                        {isEnhancing ? <><i className='bx bx-loader-alt bx-spin'></i> Analyzing...</> : <><i className='bx bx-magic-wand'></i> Enhance</>}
                    </button>
                </div>
                
                <button onClick={handleSave} className="btn btn-primary" disabled={isSaving}>
                    {isSaving ? <><i className='bx bx-loader-alt bx-spin'></i> Saving...</> : <><i className='bx bx-save'></i> Save Entry</>}
                </button>
            </div>
            
            {feedback && (
                <div style={{ marginTop: '1rem', color: 'var(--success)', fontSize: '0.9rem' }}>
                    {feedback}
                </div>
            )}
        </div>
    );
}
