import React, { useState, useRef } from 'react';
import { api } from '../lib/api';
import { MOODS } from '../lib/demo';
import RichTextEditor from '../components/RichTextEditor';
import { useTTS } from '../lib/useTTS';

// Strip HTML tags to get plain text (for AI tools & char count)
function stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
}

const WEATHER_OPTIONS = [
    { value: '',              label: 'Not set' },
    { value: 'Sunny',         emoji: '☀️' },
    { value: 'Partly Cloudy', emoji: '⛅' },
    { value: 'Cloudy',        emoji: '☁️' },
    { value: 'Rainy',         emoji: '🌧️' },
    { value: 'Stormy',        emoji: '⛈️' },
    { value: 'Snowy',         emoji: '❄️' },
    { value: 'Foggy',         emoji: '🌫️' },
    { value: 'Windy',         emoji: '💨' },
    { value: 'Hot',           emoji: '🥵' },
    { value: 'Cold',          emoji: '🥶' },
];

// Map WMO weather codes (open-meteo) → our weather values
function wmoToWeather(code) {
    if (code === 0)   return 'Sunny';
    if (code <= 3)    return 'Partly Cloudy';
    if (code <= 48)   return 'Foggy';
    if (code <= 67)   return 'Rainy';
    if (code <= 77)   return 'Snowy';
    if (code <= 82)   return 'Rainy';
    if (code <= 99)   return 'Stormy';
    return '';
}

export default function Editor({ go }) {
    const [title, setTitle]       = useState('');
    const [content, setContent]   = useState('');
    const [mood, setMood]         = useState('Happy');
    const [tags, setTags]         = useState([]);
    const [tagInput, setTagInput] = useState('');
    const [saving, setSaving]     = useState(false);
    const [aiBusy, setAiBusy]     = useState('');
    const [note, setNote]         = useState('');

    // Image
    const [imageFile, setImageFile]       = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const fileInputRef = useRef(null);

    // Location & Weather
    const [location, setLocation] = useState('');
    const [weather, setWeather]   = useState('');
    const [locBusy, setLocBusy]   = useState(false);

    // Voice
    const [isRecording, setIsRecording] = useState(false);
    const recognitionRef  = useRef(null);
    const mediaRecorderRef = useRef(null);   // records actual audio
    const audioChunksRef   = useRef([]);     // collected audio blobs
    const [audioBlob, setAudioBlob] = useState(null);  // final recording

    const { speak, speakingId } = useTTS();

    // ── Tags ──────────────────────────────────────────────────────────────────
    const addTag = (e) => {
        if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
            e.preventDefault();
            if (!tags.includes(tagInput.trim())) setTags([...tags, tagInput.trim()]);
            setTagInput('');
        }
    };
    const removeTag = (t) => setTags(tags.filter((x) => x !== t));

    // ── Image ─────────────────────────────────────────────────────────────────
    const handleImageClick = () => fileInputRef.current?.click();

    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setNote('Please select a valid image file (JPG, PNG, GIF, WebP).');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setNote('Image is too large. Please choose one under 5 MB.');
            return;
        }
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
        setNote('');
    };

    const removeImage = () => {
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // ── Location + Weather auto-detect ────────────────────────────────────────
    const detectLocation = () => {
        if (!navigator.geolocation) {
            setNote('Geolocation is not supported by this browser.');
            return;
        }
        setLocBusy(true);
        setNote('Detecting your location…');

        navigator.geolocation.getCurrentPosition(
            async ({ coords }) => {
                const { latitude: lat, longitude: lon } = coords;
                try {
                    // Reverse geocode — Nominatim (free, no API key)
                    const geoRes = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
                        { headers: { 'Accept-Language': 'en' } }
                    );
                    const geoData = await geoRes.json();
                    const city =
                        geoData.address?.city      ||
                        geoData.address?.town      ||
                        geoData.address?.village   ||
                        geoData.address?.county    ||
                        geoData.display_name?.split(',')[0] ||
                        'Unknown location';
                    setLocation(city);

                    // Current weather — open-meteo (free, no API key)
                    const wxRes = await fetch(
                        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
                    );
                    const wxData = await wxRes.json();
                    const code = wxData?.current_weather?.weathercode ?? -1;
                    const mapped = wmoToWeather(code);
                    if (mapped) setWeather(mapped);

                    setNote('📍 Location and weather detected.');
                } catch {
                    setNote('Could not fetch location details. You can type them manually.');
                } finally {
                    setLocBusy(false);
                }
            },
            (err) => {
                setLocBusy(false);
                if (err.code === 1) setNote('Location access denied. You can type it manually.');
                else setNote('Could not get location. Try typing it manually.');
            },
            { timeout: 10000 }
        );
    };

    // ── AI tools ──────────────────────────────────────────────────────────────
    const runAI = async (kind) => {
        const plainText = stripHtml(content);
        if (!plainText.trim()) { setNote('Write something first so the AI has context.'); return; }
        setAiBusy(kind); setNote('');
        try {
            const res = await api.aiTool(kind, plainText);
            if (kind === 'mood' && res.mood) {
                setMood(res.mood); setNote(`AI detected mood: ${res.mood}`);
            } else if (kind === 'tags' && res.tags) {
                setTags([...new Set([...tags, ...res.tags])]); setNote('AI added suggested tags.');
            } else if (kind === 'title' && res.result) {
                setTitle(res.result); setNote('AI generated a title.');
            } else if ((kind === 'improve' || kind === 'summarize') && res.result) {
                // Wrap plain-text result in <p> tags for the rich editor
                const html = res.result
                    .split('\n')
                    .filter((l) => l.trim())
                    .map((l) => `<p>${l}</p>`)
                    .join('');
                setContent(html);
                setNote(kind === 'improve' ? 'AI polished your writing.' : 'AI summarized your entry.');
            }
        } catch { setNote('AI is unavailable right now.'); }
        finally { setAiBusy(''); }
    };

    // ── Save ──────────────────────────────────────────────────────────────────
    const save = async () => {
        const plainText = stripHtml(content);
        if (!plainText.trim()) { setNote('Please write something first!'); return; }
        setSaving(true); setNote('');
        try {
            const memory = await api.createMemory({
                title: title.trim() || 'Untitled memory',
                content, // store HTML for rich display
                mood,
                tags: tags.join(','),
                location: location.trim() || null,
                weather: weather || null,
                favorite: false,
            });

            if (memory?.id) {
                // Upload image if selected
                if (imageFile) {
                    setNote('Uploading image…');
                    await api.uploadImage(memory.id, imageFile).catch((err) => {
                        console.warn('Image upload failed:', err.message);
                    });
                }
                // Upload audio recording if one was captured
                if (audioBlob) {
                    setNote('Saving voice recording…');
                    await api.uploadAudio(memory.id, audioBlob).catch((err) => {
                        console.warn('Audio upload failed:', err.message);
                    });
                }
            }

            go('memories');
        } catch (err) {
            setNote(err.message || 'Failed to save. Is the backend running?');
        } finally {
            setSaving(false);
        }
    };

    // ── Voice ─────────────────────────────────────────────────────────────────
    const toggleRecording = async () => {
        if (isRecording) {
            // Stop both speech recognition and media recorder
            recognitionRef.current?.stop();
            mediaRecorderRef.current?.stop(); // triggers onstop → sets audioBlob
            setIsRecording(false);
            setNote('Recording stopped. Audio will be saved with your memory.');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setNote('Speech recognition is not supported in this browser. Try Chrome.');
            return;
        }

        // Request mic access for MediaRecorder
        let stream = null;
        try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch {
            setNote('Microphone access denied. Please allow microphone access and try again.');
            return;
        }

        // ── MediaRecorder (save audio) ──
        audioChunksRef.current = [];
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
            ? 'audio/webm;codecs=opus'
            : MediaRecorder.isTypeSupported('audio/webm')
            ? 'audio/webm'
            : 'audio/ogg';
        const mediaRecorder = new MediaRecorder(stream, { mimeType });
        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };
        mediaRecorder.onstop = () => {
            const blob = new Blob(audioChunksRef.current, { type: mimeType });
            setAudioBlob(blob);
            stream.getTracks().forEach((t) => t.stop()); // release mic
        };
        mediaRecorder.start(250); // collect chunks every 250ms
        mediaRecorderRef.current = mediaRecorder;

        // ── SpeechRecognition (speech-to-text) ──
        const recognition = new SpeechRecognition();
        recognition.continuous     = true;
        recognition.interimResults = true;
        recognition.lang           = 'en-US';

        recognition.onstart  = () => { setIsRecording(true); setNote('Listening… Speak into your microphone.'); };
        recognition.onresult = (event) => {
            let final = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) final += event.results[i][0].transcript;
            }
            if (final) {
                setContent((prev) => {
                    const separator = prev && !prev.endsWith(' ') ? ' ' : '';
                    return prev + separator + final;
                });
            }
        };
        recognition.onerror = (event) => { setNote(`Microphone error: ${event.error}`); setIsRecording(false); };
        recognition.onend   = () => setIsRecording(false);
        recognitionRef.current = recognition;
        recognition.start();
    };

    const moodEmoji    = MOODS.find((m) => m.key === mood)?.emoji || '😊';
    const weatherEmoji = WEATHER_OPTIONS.find((w) => w.value === weather)?.emoji || '';

    return (
        <div className="editor-grid" style={{ gap: '3rem', maxWidth: '1200px', margin: '0 auto', alignItems: 'flex-start' }}>

            {/* ── Left column: The Notebook Page ── */}
            <div style={{ position: 'relative' }}>
                <div style={{
                    background: 'var(--paper-cream)',
                    padding: '3rem 4rem',
                    boxShadow: 'var(--shadow-lg)',
                    borderRadius: '2px',
                    border: '1px solid var(--border-light)',
                    position: 'relative',
                    minHeight: '70vh'
                }}>
                    {/* Notebook binding styling */}
                    <div style={{ position: 'absolute', top: 0, bottom: 0, left: '20px', width: '2px', background: 'rgba(0,0,0,0.05)', boxShadow: '1px 0 0 rgba(255,255,255,0.5)' }}></div>
                    <div style={{ position: 'absolute', top: '10%', bottom: '10%', left: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        {[...Array(6)].map((_,i) => <div key={i} style={{ width: '12px', height: '12px', background: 'var(--border-mid)', borderRadius: '50%', boxShadow: 'inset 1px 1px 3px rgba(0,0,0,0.2)' }}></div>)}
                    </div>

                    <div style={{ marginLeft: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '2px solid var(--ink-0)', paddingBottom: '1rem', marginBottom: '2rem' }}>
                            <input
                                placeholder="Give your memory a title…"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                style={{ 
                                    fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 700, 
                                    border: 'none', background: 'transparent', color: 'var(--ink-0)', width: '100%', outline: 'none' 
                                }}
                            />
                            <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', whiteSpace: 'nowrap', marginLeft: '1rem' }}>
                                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                            </div>
                        </div>

                        {/* Writing area */}
                        <div style={{ minHeight: '400px' }}>
                            <RichTextEditor
                                value={content}
                                onChange={setContent}
                                placeholder="What happened today? How did it make you feel?"
                            />
                        </div>

                        {/* Image preview */}
                        {imagePreview && (
                            <div className="polaroid" style={{ marginTop: '2rem', maxWidth: '300px', transform: 'rotate(-2deg)' }}>
                                <div className="tape top-center"></div>
                                <img src={imagePreview} alt="Preview" />
                                <button
                                    type="button" onClick={removeImage}
                                    style={{ position: 'absolute', top: '-10px', right: '-10px', background: 'var(--danger)', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', color: '#fff' }}
                                    title="Remove image"
                                >
                                    <i className="bx bx-x" />
                                </button>
                                <div className="caption">{imageFile.name}</div>
                            </div>
                        )}

                        {/* Footer / Stationery Tools */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '3rem', paddingTop: '1rem', borderTop: '1px solid rgba(0,0,0,0.1)' }}>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
                                <button
                                    type="button"
                                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: imageFile ? 'var(--accent-olive)' : 'var(--text-muted)', transform: 'rotate(5deg)' }}
                                    onClick={handleImageClick}
                                    title={imageFile ? 'Change photo' : 'Attach polaroid'}
                                >
                                    <i className={imageFile ? 'bx bx-image' : 'bx bx-image-add'} />
                                </button>
                                <button
                                    type="button"
                                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: isRecording ? 'var(--accent-terra)' : 'var(--text-muted)', animation: isRecording ? 'pulse 2s infinite' : 'none' }}
                                    onClick={toggleRecording}
                                    title={isRecording ? 'Stop recording' : 'Voice Journal'}
                                >
                                    <i className={isRecording ? 'bx bx-stop-circle' : 'bx bx-microphone'} />
                                </button>
                                <button
                                    type="button"
                                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: speakingId === 'editor' ? 'var(--accent-blue)' : 'var(--text-muted)' }}
                                    onClick={() => speak(stripHtml(content) || 'Please write something first.', 'editor')}
                                    title={speakingId === 'editor' ? 'Stop reading' : 'Read aloud'}
                                >
                                    <i className={speakingId === 'editor' ? 'bx bx-stop-circle' : 'bx bx-volume-full'} />
                                </button>
                                {audioBlob && !isRecording && (
                                    <span className="stamp blue" style={{ transform: 'rotate(-3deg)' }}>
                                        Audio Saved <i className="bx bx-x" style={{ cursor: 'pointer' }} onClick={() => setAudioBlob(null)} />
                                    </span>
                                )}
                            </div>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{stripHtml(content).length} chars</span>
                        </div>
                    </div>
                </div>

                {/* Status note */}
                {note && (
                    <div className="sticky-note" style={{ position: 'absolute', bottom: '-40px', left: '20px', padding: '0.75rem 1rem', fontSize: '1rem', transform: 'rotate(2deg)', background: note.toLowerCase().includes('error') ? '#f9d8d6' : '#d6eaf8' }}>
                        <div className="pin"></div>
                        {note}
                    </div>
                )}
            </div>

            {/* ── Right sidebar ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                
                {/* Save Button */}
                <button 
                    onClick={save} 
                    disabled={saving}
                    style={{ background: 'var(--accent-terra)', color: '#fff', padding: '1rem', borderRadius: '4px', fontFamily: 'var(--font-display)', fontSize: '1.3rem', border: 'none', cursor: 'pointer', boxShadow: 'var(--shadow)', transform: 'rotate(-1deg)' }}
                >
                    {saving ? <><i className="bx bx-loader-alt bx-spin" /> Saving…</> : <><i className="bx bx-save" /> Save Page</>}
                </button>

                {/* Mood & Tags (Sticky Note) */}
                <div className="sticky-note pink" style={{ transform: 'rotate(1deg)' }}>
                    <div className="pin"></div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Mood {moodEmoji}</label>
                    <select value={mood} onChange={(e) => setMood(e.target.value)} style={{ width: '100%', padding: '0.5rem', background: 'transparent', border: '1px dashed rgba(0,0,0,0.2)', fontFamily: 'var(--font-hand)', fontSize: '1.1rem', marginBottom: '1.5rem' }}>
                        {MOODS.map((m) => <option key={m.key} value={m.key}>{m.emoji} {m.key}</option>)}
                    </select>

                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Themes</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        {tags.map((t) => (
                            <span className="stamp black" key={t} style={{ transform: 'rotate(-2deg)' }}>{t} <i className="bx bx-x" onClick={() => removeTag(t)} style={{ cursor: 'pointer' }} /></span>
                        ))}
                    </div>
                    <input placeholder="+ Add tag (Enter)" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={addTag} style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px dashed rgba(0,0,0,0.3)', fontFamily: 'var(--font-hand)', fontSize: '1.1rem', outline: 'none' }} />
                </div>

                {/* Location & Weather (Paper card) */}
                <div style={{ background: 'var(--paper-0)', padding: '1.5rem', position: 'relative', boxShadow: 'var(--shadow)', transform: 'rotate(-1deg)' }} className="torn-edge">
                    <div className="tape top-center"></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--ink-0)' }}>Location & Weather</span>
                        <button onClick={detectLocation} disabled={locBusy} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--accent-blue)', fontSize: '1.2rem' }} title="Auto-detect">
                            <i className={locBusy ? 'bx bx-loader-alt bx-spin' : 'bx bx-current-location'} />
                        </button>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}><i className="bx bx-map-pin" /> Location</label>
                        <input
                            placeholder="e.g. A cozy cafe"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border-light)', padding: '0.5rem 0', fontFamily: 'var(--font-hand)', fontSize: '1.1rem', outline: 'none' }}
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}><i className="bx bx-cloud" /> Weather {weatherEmoji}</label>
                        <select value={weather} onChange={(e) => setWeather(e.target.value)} style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border-light)', padding: '0.5rem 0', fontFamily: 'var(--font-hand)', fontSize: '1.1rem', outline: 'none' }}>
                            {WEATHER_OPTIONS.map((w) => (
                                <option key={w.value} value={w.value}>{w.emoji ? `${w.emoji} ${w.value}` : w.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* AI Tools (Stamped Card) */}
                <div style={{ border: '2px dashed var(--accent-olive)', padding: '1.5rem', borderRadius: '4px', background: 'var(--paper-cream)' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--accent-olive)' }}><i className="bx bx-magic-wand" /> Writer's Block?</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        {[
                            ['title',     'bx-heading',      'Title'],
                            ['mood',      'bx-smile',        'Mood'],
                            ['tags',      'bx-purchase-tag', 'Tags'],
                            ['summarize', 'bx-text',         'Summary'],
                        ].map(([kind, icon, label]) => (
                            <button key={kind} onClick={() => runAI(kind)} disabled={!!aiBusy} style={{ background: 'transparent', border: '1px solid var(--border-mid)', borderRadius: '4px', padding: '0.5rem', fontFamily: 'var(--font-sans)', fontSize: '0.85rem', cursor: 'pointer' }}>
                                <i className={`bx ${aiBusy === kind ? 'bx-loader-alt bx-spin' : icon}`} style={{ marginRight: '4px' }} /> {label}
                            </button>
                        ))}
                    </div>
                </div>

            </div>

            <style>{`
                @keyframes pulse {
                    0%   { text-shadow: 0 0 0 rgba(239,68,68,0.4); }
                    70%  { text-shadow: 0 0 10px rgba(239,68,68,0); }
                    100% { text-shadow: 0 0 0 rgba(239,68,68,0); }
                }
            `}</style>
        </div>
    );
}
