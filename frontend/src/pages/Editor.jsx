import React, { useState, useRef } from 'react';
import { api } from '../lib/api';
import { MOODS } from '../lib/demo';
import RichTextEditor from '../components/RichTextEditor';

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
        <div className="editor-grid">

            {/* ── Left column ── */}
            <div>
                {/* Title */}
                <div className="card glass" style={{ marginBottom: '1rem', padding: '1rem' }}>
                    <input
                        placeholder="Give your memory a title…"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        style={{ fontSize: '1.2rem', fontWeight: 600, border: 'none', background: 'transparent', boxShadow: 'none', color: 'var(--text-primary)' }}
                    />
                </div>

                {/* Writing area */}
                <div className="card glass" style={{ padding: 0, overflow: 'hidden' }}>
                    <RichTextEditor
                        value={content}
                        onChange={setContent}
                        placeholder="What happened today? How did it make you feel?"
                    />

                    {/* Image preview */}
                    {imagePreview && (
                        <div style={{ position: 'relative', margin: '0 1rem 1rem', borderRadius: '0.75rem', overflow: 'hidden', maxHeight: '280px' }}>
                            <img src={imagePreview} alt="Preview" style={{ width: '100%', maxHeight: '280px', objectFit: 'cover', display: 'block', borderRadius: '0.75rem' }} />
                            <button
                                type="button" onClick={removeImage}
                                style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                title="Remove image"
                            >
                                <i className="bx bx-x" style={{ fontSize: '1.1rem' }} />
                            </button>
                            <div style={{ position: 'absolute', bottom: '0.5rem', left: '0.5rem', background: 'rgba(0,0,0,0.55)', borderRadius: '0.4rem', padding: '0.2rem 0.6rem', fontSize: '0.75rem', color: '#fff' }}>
                                <i className="bx bx-image-alt" style={{ marginRight: 4 }} />{imageFile.name}
                            </div>
                        </div>
                    )}

                    {/* Footer bar */}
                    <div className="editor-foot">
                        <div className="flex-center gap-sm">
                            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
                            <button
                                className="icon-btn" type="button"
                                style={{ width: 32, height: 32, background: imageFile ? 'rgba(124,108,255,0.15)' : 'transparent', color: imageFile ? 'var(--accent-primary)' : 'inherit', border: imageFile ? '1px solid var(--accent-primary)' : '1px solid transparent' }}
                                onClick={handleImageClick}
                                title={imageFile ? 'Change image' : 'Add image'}
                            >
                                <i className={imageFile ? 'bx bx-image-check' : 'bx bx-image-add'} />
                            </button>
                            <button
                                className="icon-btn" type="button"
                                style={{ width: 32, height: 32, background: isRecording ? 'rgba(239,68,68,0.1)' : 'transparent', color: isRecording ? 'var(--danger)' : 'inherit', border: isRecording ? '1px solid var(--danger)' : '1px solid transparent', animation: isRecording ? 'pulse 2s infinite' : 'none' }}
                                onClick={toggleRecording}
                                title={isRecording ? 'Stop recording' : 'Voice Journal — records audio + transcribes'}
                            >
                                <i className={isRecording ? 'bx bx-stop-circle' : 'bx bx-microphone'} />
                            </button>
                            {/* Audio ready indicator */}
                            {audioBlob && !isRecording && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--success)', background: 'rgba(52,211,153,0.1)', padding: '0.2rem 0.5rem', borderRadius: '20px', border: '1px solid rgba(52,211,153,0.3)' }}>
                                    <i className="bx bx-music" />
                                    Audio saved
                                    <i className="bx bx-x" style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setAudioBlob(null)} title="Discard recording" />
                                </span>
                            )}
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{stripHtml(content).length} characters</span>
                    </div>
                </div>

                {/* Status note */}
                {note && (
                    <p style={{ marginTop: '.75rem', fontSize: '.85rem', color: (note.toLowerCase().includes('error') || note.includes('fail') || note.includes('denied')) ? 'var(--danger)' : 'var(--success)' }}>
                        {note}
                    </p>
                )}

                <style>{`
                    @keyframes pulse {
                        0%   { box-shadow: 0 0 0 0   rgba(239,68,68,0.4); }
                        70%  { box-shadow: 0 0 0 10px rgba(239,68,68,0); }
                        100% { box-shadow: 0 0 0 0   rgba(239,68,68,0); }
                    }
                `}</style>
            </div>

            {/* ── Right sidebar ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                <button className="btn btn-primary btn-block" onClick={save} disabled={saving}>
                    {saving ? <><i className="bx bx-loader-alt bx-spin" /> Saving…</> : <><i className="bx bx-save" /> Save Memory</>}
                </button>

                {/* Mood & Tags */}
                <div className="card glass">
                    <label className="field-label">Mood {moodEmoji}</label>
                    <select value={mood} onChange={(e) => setMood(e.target.value)}>
                        {MOODS.map((m) => <option key={m.key} value={m.key}>{m.emoji} {m.key}</option>)}
                    </select>

                    <label className="field-label" style={{ marginTop: '1rem' }}>Tags</label>
                    <div className="tag-input-wrap">
                        {tags.map((t) => (
                            <span className="tag-chip" key={t}>{t}<i className="bx bx-x" onClick={() => removeTag(t)} /></span>
                        ))}
                        <input placeholder="+ Add tag" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={addTag} />
                    </div>
                </div>

                {/* ── Location & Weather ── */}
                <div className="card glass">
                    <div className="card-head" style={{ alignItems: 'center' }}>
                        <span className="card-title" style={{ fontSize: '.95rem' }}>
                            <i className="bx bx-map" style={{ color: 'var(--accent-primary)' }} /> Location &amp; Weather
                        </span>
                        <button
                            className="btn btn-secondary"
                            type="button"
                            onClick={detectLocation}
                            disabled={locBusy}
                            style={{ padding: '0.25rem 0.6rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                            title="Auto-detect location and weather using GPS"
                        >
                            <i className={locBusy ? 'bx bx-loader-alt bx-spin' : 'bx bx-current-location'} />
                            {locBusy ? 'Detecting…' : 'Auto-detect'}
                        </button>
                    </div>

                    {/* Location */}
                    <label className="field-label" style={{ marginTop: '0.25rem' }}>
                        <i className="bx bx-map-pin" style={{ marginRight: '0.3rem', color: 'var(--accent-primary)' }} />
                        Location
                    </label>
                    <div style={{ position: 'relative' }}>
                        <input
                            placeholder="e.g. Bangalore, India"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            style={{ paddingRight: location ? '2rem' : undefined }}
                        />
                        {location && (
                            <i className="bx bx-x" onClick={() => setLocation('')}
                                style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1rem' }}
                            />
                        )}
                    </div>

                    {/* Weather */}
                    <label className="field-label" style={{ marginTop: '0.75rem' }}>
                        <i className="bx bx-cloud" style={{ marginRight: '0.3rem', color: 'var(--accent-primary)' }} />
                        Weather {weatherEmoji}
                    </label>
                    <select value={weather} onChange={(e) => setWeather(e.target.value)}>
                        {WEATHER_OPTIONS.map((w) => (
                            <option key={w.value} value={w.value}>
                                {w.emoji ? `${w.emoji} ${w.value}` : w.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* AI Tools */}
                <div className="card glass">
                    <div className="card-head">
                        <span className="card-title" style={{ fontSize: '.95rem' }}>
                            <i className="bx bx-magic-wand" style={{ color: 'var(--accent-primary)' }} /> AI Tools
                        </span>
                    </div>
                    {[
                        ['title',     'bx-heading',      'Generate title'],
                        ['mood',      'bx-smile',        'Detect mood'],
                        ['tags',      'bx-purchase-tag', 'Suggest tags'],
                        ['summarize', 'bx-text',         'Summarize'],
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
