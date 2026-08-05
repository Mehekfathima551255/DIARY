import React, { useEffect, useMemo, useState, useRef } from 'react';
import { api } from '../lib/api';
import { moodMeta } from '../lib/demo';

const DAYS   = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['January','February','March','April','May','June','July',
                'August','September','October','November','December'];
const YEARS  = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);
const STICKERS = ['⭐', '🌸', '🌿', '☕', '📖', '🦋'];

// Confetti Component for 100% completions
function ConfettiEffect() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animId;
        
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;

        const colors = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
        const particles = Array.from({ length: 60 }).map(() => ({
            x: Math.random() * canvas.width,
            y: Math.random() * -canvas.height - 20,
            size: 4 + Math.random() * 6,
            color: colors[Math.floor(Math.random() * colors.length)],
            speedY: 1.5 + Math.random() * 3,
            speedX: -1 + Math.random() * 2,
            rotation: Math.random() * 360,
            rotationSpeed: -2 + Math.random() * 4
        }));

        const resize = () => {
            if (canvas) {
                canvas.width = canvas.parentElement.clientWidth;
                canvas.height = canvas.parentElement.clientHeight;
            }
        };
        window.addEventListener('resize', resize);

        const render = () => {
            if (!ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            let active = false;

            particles.forEach((p) => {
                p.y += p.speedY;
                p.x += p.speedX;
                p.rotation += p.rotationSpeed;
                if (p.y < canvas.height) {
                    active = true;
                    ctx.save();
                    ctx.translate(p.x, p.y);
                    ctx.rotate((p.rotation * Math.PI) / 180);
                    ctx.fillStyle = p.color;
                    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                    ctx.restore();
                }
            });

            if (active) {
                animId = requestAnimationFrame(render);
            }
        };
        render();

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener('resize', resize);
        };
    }, []);

    return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 99 }} />;
}

export default function Calendar({ go }) {
    const [cursor, setCursor]       = useState(() => new Date());
    const [memories, setMemories]   = useState([]);
    const [heatmap, setHeatmap]     = useState({});
    const [showPicker, setShowPicker] = useState(false);
    const pickerRef = useRef(null);

    // Selected Day inside month (defaults to current date if current month, else 1st of month)
    const [selectedDay, setSelectedDay] = useState(() => new Date().getDate());

    // Task Planner State
    const [plannerTasks, setPlannerTasks] = useState(() => {
        try {
            const saved = localStorage.getItem('sd_planner_tasks');
            return saved ? JSON.parse(saved) : {};
        } catch {
            return {};
        }
    });

    const [newTaskText, setNewTaskText] = useState('');
    const [editingTaskId, setEditingTaskId] = useState(null);
    const [editingText, setEditingText] = useState('');

    // Inline journal viewing state
    const [viewingJournal, setViewingJournal] = useState(null);

    // Load memories and heatmap
    const loadData = async () => {
        try {
            const list = await api.getMemories();
            setMemories(list);
            const cal = await api.getCalendar();
            setHeatmap(cal);
        } catch (err) {
            console.error('Failed to load daily data:', err);
        }
    };

    useEffect(() => {
        loadData();
        window.addEventListener('sd_entry_created', loadData);
        return () => window.removeEventListener('sd_entry_created', loadData);
    }, []);

    // Close picker dropdown on outside click
    useEffect(() => {
        if (!showPicker) return;
        const handler = (e) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target)) setShowPicker(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [showPicker]);

    // Active cursor year/month parameters
    const { cells, year, month } = useMemo(() => {
        const y = cursor.getFullYear();
        const m = cursor.getMonth();
        const startPad    = (new Date(y, m, 1).getDay() + 6) % 7;
        const daysInMonth = new Date(y, m + 1, 0).getDate();
        const arr = [];
        for (let i = 0; i < startPad; i++) arr.push(null);
        for (let d = 1; d <= daysInMonth; d++) arr.push(d);
        while (arr.length % 7 !== 0) arr.push(null);
        return { cells: arr, year: y, month: m };
    }, [cursor]);

    const today = new Date();
    const isToday = (d) => d && today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
    const hasEntry = (d) => {
        if (!d) return false;
        const key = `${year}-${String(month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        return (heatmap[key] || 0) > 0;
    };

    const shiftMonth = (delta) => {
        setCursor(new Date(year, month + delta, 1));
        // Reset default selected day to 1 when navigating months
        setSelectedDay(1);
        setViewingJournal(null);
    };

    // Construct Date Keys
    const selectedDateKey = useMemo(() => {
        return `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
    }, [year, month, selectedDay]);

    const formattedSelectedDate = useMemo(() => {
        const d = new Date(year, month, selectedDay);
        return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }, [year, month, selectedDay]);

    const selectedDayOfWeek = useMemo(() => {
        const d = new Date(year, month, selectedDay);
        return d.toLocaleDateString('en-US', { weekday: 'long' });
    }, [year, month, selectedDay]);

    // Retrieve tasks for selected day
    const dayTasks = useMemo(() => {
        return plannerTasks[selectedDateKey] || [];
    }, [plannerTasks, selectedDateKey]);

    // Progress percentage
    const progressStats = useMemo(() => {
        const total = dayTasks.length;
        if (total === 0) return { percent: 0, completed: 0, total: 0 };
        const completed = dayTasks.filter(t => t.completed).length;
        return {
            percent: Math.round((completed / total) * 100),
            completed,
            total
        };
    }, [dayTasks]);

    // Check if journal exists for selected date
    const journalEntry = useMemo(() => {
        return memories.find(m => {
            const entryDate = new Date(m.created_at);
            const entryKey = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, '0')}-${String(entryDate.getDate()).padStart(2, '0')}`;
            return entryKey === selectedDateKey;
        });
    }, [memories, selectedDateKey]);

    // Save tasks to localStorage helper
    const saveTasks = (dateKey, list) => {
        const updated = { ...plannerTasks, [dateKey]: list };
        setPlannerTasks(updated);
        localStorage.setItem('sd_planner_tasks', JSON.stringify(updated));
    };

    // Task checklist handles
    const handleAddTask = (e) => {
        e.preventDefault();
        if (!newTaskText.trim()) return;
        const newTask = {
            id: Date.now(),
            text: newTaskText.trim(),
            completed: false
        };
        const list = [...dayTasks, newTask];
        saveTasks(selectedDateKey, list);
        setNewTaskText('');
    };

    const handleToggleTask = (id) => {
        const list = dayTasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
        saveTasks(selectedDateKey, list);
    };

    const handleDeleteTask = (id) => {
        const list = dayTasks.filter(t => t.id !== id);
        saveTasks(selectedDateKey, list);
    };

    const startEditing = (task) => {
        setEditingTaskId(task.id);
        setEditingText(task.text);
    };

    const handleSaveEdit = (id) => {
        if (!editingText.trim()) return;
        const list = dayTasks.map(t => t.id === id ? { ...t, text: editingText.trim() } : t);
        saveTasks(selectedDateKey, list);
        setEditingTaskId(null);
    };

    // Drag & Drop reordering helpers
    const handleDragStart = (e, index) => {
        e.dataTransfer.setData('text/plain', index);
    };

    const handleDrop = (e, targetIndex) => {
        const sourceIndex = Number(e.dataTransfer.getData('text/plain'));
        if (sourceIndex === targetIndex) return;
        const reordered = [...dayTasks];
        const [removed] = reordered.splice(sourceIndex, 1);
        reordered.splice(targetIndex, 0, removed);
        saveTasks(selectedDateKey, reordered);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    // Keepsake sticker chooser
    const keepsakeSticker = useMemo(() => {
        const dateNum = selectedDay;
        return STICKERS[dateNum % STICKERS.length];
    }, [selectedDay]);

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div 
                className="planner-book-backdrop"
                style={{
                    background: 'linear-gradient(135deg, #2b221a 0%, #15110e 100%)',
                    borderRadius: '2rem',
                    padding: '2rem 1.5rem',
                    boxShadow: '0 30px 70px rgba(0,0,0,0.65)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    position: 'relative'
                }}
            >
                {/* Book spine / rings down center (Decorative bind separator) */}
                <div style={{
                    position: 'absolute', left: '50%', top: '5%', bottom: '5%',
                    width: '18px', zIndex: 10, transform: 'translateX(-50%)',
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                    pointerEvents: 'none'
                }}>
                    {Array.from({ length: 14 }).map((_, i) => (
                        <div key={i} style={{
                            width: '30px', height: '11px',
                            background: 'linear-gradient(to right, #44403c, #e7e5e4, #1c1917)',
                            borderRadius: '5px',
                            border: '1px solid #1c1917',
                            transform: 'translateX(-6px)',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.45)'
                        }} />
                    ))}
                </div>

                {/* Two-Column Grid representing opened pages */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3.5rem', position: 'relative' }}>
                    
                    {/* LEFT PAGE: MONTHLY CALENDAR */}
                    <div 
                        className="notebook-page left-page"
                        style={{
                            background: 'var(--paper-cream, #faf6ee)',
                            padding: '2rem 2.25rem 2.5rem 1.75rem',
                            borderRadius: '1.25rem 0.5rem 0.5rem 1.25rem',
                            boxShadow: 'inset 8px 0 15px rgba(0,0,0,0.06), 0 10px 25px rgba(0,0,0,0.15)',
                            borderRight: '1px solid rgba(0,0,0,0.1)'
                        }}
                    >
                        {/* ── Month & Year Navigation ── */}
                        <div className="between" style={{ marginBottom: '1.5rem', alignItems: 'center' }}>
                            <div ref={pickerRef} style={{ position: 'relative' }}>
                                <button
                                    onClick={() => setShowPicker((v) => !v)}
                                    style={{
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        fontFamily: 'var(--font-hand)', fontSize: '1.55rem', fontWeight: 700,
                                        color: 'var(--ink-0, #222)', display: 'flex', alignItems: 'center', gap: '0.35rem',
                                    }}
                                >
                                    {MONTHS[month]} {year}
                                    <i className="bx bx-chevron-down" style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }} />
                                </button>

                                {showPicker && (
                                    <div style={{
                                        position: 'absolute', top: '110%', left: 0, zIndex: 200,
                                        background: '#faf6ee',
                                        border: '1px solid var(--border-mid)',
                                        borderRadius: '10px',
                                        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                                        padding: '1rem',
                                        display: 'flex', flexDirection: 'column', gap: '0.75rem',
                                        minWidth: '260px',
                                    }}>
                                        <div>
                                            <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.4rem', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>Year</div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                                                {YEARS.map((y) => (
                                                    <button key={y} onClick={() => { setCursor(new Date(y, month, 1)); setShowPicker(false); setSelectedDay(1); }}
                                                        style={{ padding: '0.2rem 0.55rem', borderRadius: '4px', border: y === year ? '1.5px solid var(--accent-olive)' : '1px solid var(--border-light)', background: y === year ? 'var(--accent-olive)' : 'transparent', color: y === year ? '#fff' : 'var(--ink-0)', cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'var(--font-sans)' }}>
                                                        {y}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.4rem', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>Month</div>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.3rem' }}>
                                                {MONTHS.map((mn, idx) => (
                                                    <button key={mn} onClick={() => { setCursor(new Date(year, idx, 1)); setShowPicker(false); setSelectedDay(1); }}
                                                        style={{ padding: '0.25rem 0.3rem', borderRadius: '4px', border: idx === month ? '1.5px solid var(--accent-olive)' : '1px solid var(--border-light)', background: idx === month ? 'var(--accent-olive)' : 'transparent', color: idx === month ? '#fff' : 'var(--ink-0)', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'var(--font-sans)' }}>
                                                        {mn.slice(0, 3)}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex-center gap-xs">
                                <button className="icon-btn" onClick={() => shiftMonth(-1)} title="Previous month" style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.25rem' }}>
                                    <i className="bx bx-chevron-left" />
                                </button>
                                <button 
                                    className="btn btn-secondary" 
                                    onClick={() => { setCursor(new Date()); setSelectedDay(new Date().getDate()); setViewingJournal(null); }}
                                    style={{ fontFamily: 'var(--font-sans)', fontSize: '0.78rem', padding: '0.25rem 0.65rem' }}
                                >
                                    Today
                                </button>
                                <button className="icon-btn" onClick={() => shiftMonth(1)} title="Next month" style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.25rem' }}>
                                    <i className="bx bx-chevron-right" />
                                </button>
                            </div>
                        </div>

                        {/* Calendar Grid */}
                        <div className="cal-head" style={{ borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                            {DAYS.map((d) => <div key={d} style={{ fontFamily: 'var(--font-sans)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>{d}</div>)}
                        </div>

                        <div className="cal-grid" style={{ gridGap: '0.5rem' }}>
                            {cells.map((d, i) => {
                                const wrote = hasEntry(d);
                                const todayCell = isToday(d);
                                const isSelected = d === selectedDay;

                                return (
                                    <div
                                        key={i}
                                        onClick={() => {
                                            if (d) {
                                                setSelectedDay(d);
                                                setViewingJournal(null);
                                            }
                                        }}
                                        className={`cal-cell ${!d ? 'empty' : ''} ${todayCell ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                                        style={{
                                            height: '46px',
                                            display: 'flex', flexDirection: 'column',
                                            alignItems: 'center', justifyContent: 'center',
                                            cursor: d ? 'pointer' : 'default',
                                            borderRadius: '8px',
                                            position: 'relative',
                                            border: isSelected ? '2px solid var(--accent-olive)' : '1px solid transparent',
                                            background: isSelected ? 'rgba(75, 105, 80, 0.08)' : todayCell ? 'rgba(193, 92, 61, 0.1)' : 'transparent',
                                            transition: 'all 0.15s ease'
                                        }}
                                    >
                                        {d && (
                                            <>
                                                <span 
                                                    className="num" 
                                                    style={{ 
                                                        fontFamily: 'var(--font-sans)', 
                                                        fontSize: '0.95rem',
                                                        fontWeight: todayCell || isSelected || wrote ? 700 : 400,
                                                        color: todayCell ? 'var(--accent-terra)' : wrote ? 'var(--accent-olive)' : 'var(--ink-0)'
                                                    }}
                                                >
                                                    {d}
                                                </span>
                                                {wrote && (
                                                    <span 
                                                        title="Diary entry written"
                                                        style={{
                                                            position: 'absolute', bottom: '4px', width: '6px', height: '6px',
                                                            borderRadius: '50%', background: 'var(--accent-olive)'
                                                        }}
                                                    />
                                                )}
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Legend */}
                        <div style={{ marginTop: '2.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', borderTop: '1px dashed rgba(0,0,0,0.1)', paddingTop: '0.85rem' }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-olive)', display: 'inline-block' }} />
                            Days you logged a diary memory
                        </div>
                    </div>

                    {/* RIGHT PAGE: THE DAILY PLANNER */}
                    <div 
                        className="notebook-page right-page"
                        style={{
                            background: 'var(--paper-cream, #faf6ee)',
                            padding: '2rem 1.75rem 2.5rem 2.25rem',
                            borderRadius: '0.5rem 1.25rem 1.25rem 0.5rem',
                            boxShadow: 'inset -8px 0 15px rgba(0,0,0,0.06), 0 10px 25px rgba(0,0,0,0.15)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        {/* Confetti Explosion Canvas */}
                        {progressStats.total > 0 && progressStats.completed === progressStats.total && (
                            <ConfettiEffect />
                        )}

                        {/* Keepsake Sticker */}
                        {progressStats.total > 0 && progressStats.completed === progressStats.total && (
                            <div 
                                title="Completion Keepsake Sticker!"
                                className="planner-keepsake-sticker"
                                style={{
                                    position: 'absolute', top: '1.25rem', right: '1.25rem',
                                    fontSize: '2.5rem', zIndex: 80,
                                    transform: 'rotate(12deg) scale(1.15)',
                                    filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.25))',
                                    animation: 'popInSticker 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
                                }}
                            >
                                {keepsakeSticker}
                            </div>
                        )}

                        {/* Toggle journal view overlay */}
                        {viewingJournal ? (
                            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', zIndex: 90 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px dashed rgba(0,0,0,0.15)', paddingBottom: '0.5rem' }}>
                                    <button 
                                        onClick={() => setViewingJournal(null)}
                                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.2,rem', color: 'var(--text-secondary)' }}
                                    >
                                        <i className="bx bx-arrow-back" /> Back to Planner
                                    </button>
                                    <span className="stamp black">{moodMeta(viewingJournal.mood).emoji} {viewingJournal.mood}</span>
                                </div>

                                <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
                                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--ink-0)', margin: '0 0 0.5rem 0' }}>
                                        {viewingJournal.title}
                                    </h3>
                                    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.92rem', color: 'var(--ink-0)', lineHeight: 1.75 }}
                                        dangerouslySetInnerHTML={{ __html: viewingJournal.content }}
                                    />
                                    
                                    {viewingJournal.doodle_url && (
                                        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                                            <img src={api.imageUrl(viewingJournal.doodle_url)} alt="Doodle" style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
                                
                                {/* Date headers */}
                                <div style={{ borderBottom: '2px solid rgba(0,0,0,0.06)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
                                        {selectedDayOfWeek}
                                    </span>
                                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--ink-0)', margin: '0.1rem 0 0.4rem 0' }}>
                                        {formattedSelectedDate}
                                    </h2>

                                    {/* Open Journal button integration */}
                                    {journalEntry ? (
                                        <button
                                            type="button"
                                            onClick={() => setViewingJournal(journalEntry)}
                                            style={{
                                                background: 'rgba(75, 105, 80, 0.1)',
                                                border: '1px solid var(--accent-olive)',
                                                borderRadius: '6px',
                                                padding: '0.35rem 0.8rem',
                                                color: 'var(--accent-olive)',
                                                fontSize: '0.8rem',
                                                fontFamily: 'var(--font-sans)',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.3rem',
                                                marginTop: '0.15rem'
                                            }}
                                        >
                                            📖 Open Journal
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => go && go('editor')}
                                            style={{
                                                background: 'transparent',
                                                border: '1px dashed var(--accent-olive)',
                                                borderRadius: '6px',
                                                padding: '0.35rem 0.8rem',
                                                color: 'var(--accent-olive)',
                                                fontSize: '0.8rem',
                                                fontFamily: 'var(--font-sans)',
                                                fontWeight: 500,
                                                cursor: 'pointer',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.3rem',
                                                marginTop: '0.15rem'
                                            }}
                                        >
                                            ✍️ Write Diary Entry
                                        </button>
                                    )}
                                </div>

                                {/* Progress Section */}
                                <div style={{ marginBottom: '1.75rem' }}>
                                    <div className="between" style={{ fontSize: '0.82rem', fontFamily: 'var(--font-sans)', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                                        <span style={{ fontWeight: 600 }}>Today's Progress</span>
                                        <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                                            {progressStats.completed} / {progressStats.total} Tasks ({progressStats.percent}%)
                                        </span>
                                    </div>
                                    {/* Progress track */}
                                    <div style={{ width: '100%', height: '12px', background: 'rgba(0,0,0,0.06)', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.04)' }}>
                                        <div style={{
                                            width: `${progressStats.percent}%`,
                                            height: '100%',
                                            background: 'var(--accent-olive, #4B6950)',
                                            borderRadius: '6px',
                                            transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                                        }} />
                                    </div>

                                    {progressStats.total > 0 && progressStats.completed === progressStats.total && (
                                        <div style={{
                                            marginTop: '0.75rem',
                                            background: 'rgba(75, 105, 80, 0.08)',
                                            border: '1px dashed var(--accent-olive)',
                                            borderRadius: '8px',
                                            padding: '0.5rem 0.75rem',
                                            fontSize: '0.85rem',
                                            color: 'var(--accent-olive)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '0.1rem',
                                            animation: 'pulseGlow 1.8s infinite alternate'
                                        }}>
                                            <span style={{ fontWeight: 700 }}>🎉 Everything for today is complete!</span>
                                            <span>"Great job! You completed every task today."</span>
                                        </div>
                                    )}
                                </div>

                                {/* Task Checklist Area (Cream paper lists) */}
                                <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1.25rem', paddingRight: '0.2rem' }}>
                                    <h3 style={{ fontFamily: 'var(--font-hand)', fontSize: '1.35rem', color: 'var(--ink-0)', borderBottom: '1px dashed rgba(0,0,0,0.1)', paddingBottom: '0.35rem', marginBottom: '0.85rem' }}>
                                        To-Do List
                                    </h3>

                                    {dayTasks.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontFamily: 'var(--font-hand)', fontSize: '1.2rem' }}>
                                            No tasks listed for this day yet.
                                        </div>
                                    ) : (
                                        <div 
                                            onDragOver={handleDragOver}
                                            style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}
                                        >
                                            {dayTasks.map((task, idx) => (
                                                <div
                                                    key={task.id}
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, idx)}
                                                    onDrop={(e) => handleDrop(e, idx)}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: '0.65rem',
                                                        padding: '0.45rem 0.6rem',
                                                        borderRadius: '6px',
                                                        background: 'rgba(255,255,255,0.4)',
                                                        border: '1px solid rgba(0,0,0,0.03)',
                                                        cursor: 'grab',
                                                        transition: 'all 0.15s'
                                                    }}
                                                >
                                                    {/* Custom checkbox */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleTask(task.id)}
                                                        style={{
                                                            width: '18px', height: '18px',
                                                            borderRadius: '4px',
                                                            border: '2px solid var(--border-mid, #cbd5e1)',
                                                            background: task.completed ? 'var(--accent-olive)' : 'transparent',
                                                            cursor: 'pointer',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            padding: 0,
                                                            color: '#fff', fontSize: '0.7rem'
                                                        }}
                                                    >
                                                        {task.completed && '✓'}
                                                    </button>

                                                    {/* Text field / inline edit */}
                                                    {editingTaskId === task.id ? (
                                                        <input
                                                            value={editingText}
                                                            onChange={(e) => setEditingText(e.target.value)}
                                                            onBlur={() => handleSaveEdit(task.id)}
                                                            onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(task.id); }}
                                                            autoFocus
                                                            style={{
                                                                flex: 1, background: 'transparent',
                                                                border: 'none', borderBottom: '1px dashed var(--border-mid)',
                                                                color: 'var(--ink-0)', fontFamily: 'var(--font-sans)',
                                                                fontSize: '0.92rem', outline: 'none', padding: 0
                                                            }}
                                                        />
                                                    ) : (
                                                        <span
                                                            onClick={() => startEditing(task)}
                                                            style={{
                                                                flex: 1,
                                                                fontSize: '0.92rem',
                                                                fontFamily: 'var(--font-sans)',
                                                                color: task.completed ? 'var(--text-muted)' : 'var(--ink-0)',
                                                                textDecoration: task.completed ? 'line-through' : 'none',
                                                                cursor: 'text'
                                                            }}
                                                        >
                                                            {task.text}
                                                        </span>
                                                    )}

                                                    {/* Delete button */}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteTask(task.id)}
                                                        title="Delete Task"
                                                        style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', opacity: 0.6, fontSize: '1rem', padding: '0.1rem' }}
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Lined addition form */}
                                <form onSubmit={handleAddTask} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderTop: '1px dashed rgba(0,0,0,0.1)', paddingTop: '1rem' }}>
                                    <input
                                        type="text"
                                        placeholder="+ Add Task"
                                        value={newTaskText}
                                        onChange={(e) => setNewTaskText(e.target.value)}
                                        style={{
                                            flex: 1,
                                            background: 'transparent',
                                            border: 'none',
                                            borderBottom: '2px dashed var(--border-mid, #e2e8f0)',
                                            padding: '0.4rem 0',
                                            color: 'var(--ink-0)',
                                            fontFamily: 'var(--font-sans)',
                                            fontSize: '0.95rem',
                                            outline: 'none'
                                        }}
                                    />
                                    <button
                                        type="submit"
                                        style={{
                                            background: 'var(--accent-olive)',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '6px',
                                            padding: '0.45rem 1rem',
                                            fontSize: '0.85rem',
                                            fontWeight: 600,
                                            fontFamily: 'var(--font-sans)',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Add Task
                                    </button>
                                </form>

                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes popInSticker {
                    0% { transform: scale(0) rotate(0deg); opacity: 0; }
                    80% { transform: scale(1.25) rotate(15deg); opacity: 1; }
                    100% { transform: scale(1.15) rotate(12deg); opacity: 1; }
                }
                @keyframes pulseGlow {
                    0% { box-shadow: 0 0 2px rgba(75, 105, 80, 0.1); }
                    100% { box-shadow: 0 0 10px rgba(75, 105, 80, 0.35); }
                }
            `}} />
        </div>
    );
}
