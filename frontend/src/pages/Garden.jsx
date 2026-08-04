import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../lib/api';
import { moodMeta } from '../lib/demo';

// Warm, peaceful welcome messages for the cinematic introduction
const WELCOME_MESSAGES = [
    "Every memory has found its place in your garden.",
    "Your garden has grown a little more today.",
    "Every feeling has helped something beautiful bloom."
];

export default function Garden({ go }) {
    const [memories, setMemories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMemory, setSelectedMemory] = useState(null);
    const [selectedMonthKey, setSelectedMonthKey] = useState(''); // "YYYY-MM"
    const [introState, setIntroState] = useState('intro'); // 'intro' | 'fading' | 'garden'
    const [welcomeMessage, setWelcomeMessage] = useState('');

    // Load memories and choose a random welcome message
    useEffect(() => {
        const load = async () => {
            try {
                const list = await api.getMemories();
                setMemories(list);

                // Set default month key to the current real month
                const now = new Date();
                const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                setSelectedMonthKey(currentKey);
            } catch (err) {
                console.error('Failed to load memories for garden:', err);
            } finally {
                setLoading(false);
            }
        };
        // Select a message randomly
        setWelcomeMessage(WELCOME_MESSAGES[Math.floor(Math.random() * WELCOME_MESSAGES.length)]);
        load();
    }, []);

    // Extract all unique month-years containing memories
    const availableMonths = useMemo(() => {
        const monthsMap = {};
        const now = new Date();
        const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        monthsMap[currentKey] = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });

        memories.forEach(mem => {
            const d = new Date(mem.created_at);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            monthsMap[key] = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
        });

        return Object.entries(monthsMap)
            .map(([key, label]) => ({ key, label }))
            .sort((a, b) => b.key.localeCompare(a.key));
    }, [memories]);

    // Selected month details
    const { selectedYear, selectedMonthNum, selectedMonthName } = useMemo(() => {
        if (!selectedMonthKey) return { selectedYear: 2026, selectedMonthNum: 7, selectedMonthName: 'August' };
        const [y, m] = selectedMonthKey.split('-').map(Number);
        const dummyDate = new Date(y, m - 1, 1);
        return {
            selectedYear: y,
            selectedMonthNum: m - 1,
            selectedMonthName: dummyDate.toLocaleString('en-US', { month: 'long' })
        };
    }, [selectedMonthKey]);

    // Filter memories strictly to the selected month
    const monthlyMemories = useMemo(() => {
        return memories.filter(mem => {
            const date = new Date(mem.created_at);
            return date.getFullYear() === selectedYear && date.getMonth() === selectedMonthNum;
        });
    }, [memories, selectedYear, selectedMonthNum]);

    // Trigger the Cinematic Intro Experience when the month is changed
    useEffect(() => {
        if (!loading) {
            setIntroState('intro');
            
            // Fading start
            const fadeTimer = setTimeout(() => {
                setIntroState('fading');
            }, 3000);

            // Complete transition to garden
            const gardenTimer = setTimeout(() => {
                setIntroState('garden');
            }, 3600);

            return () => {
                clearTimeout(fadeTimer);
                clearTimeout(gardenTimer);
            };
        }
    }, [loading, selectedMonthKey]);

    const handleEnterGarden = () => {
        setIntroState('fading');
        setTimeout(() => setIntroState('garden'), 400);
    };

    // Place flowers in 2.5D coordinate grids representing beautiful, named botanical areas
    const positionedFlowers = useMemo(() => {
        if (monthlyMemories.length === 0) return [];

        const grouped = {
            Happy: [],     // Sunrise Meadow
            Love: [],      // Rose Courtyard
            Calm: [],      // Lavender Walk
            Sad: [],       // Hydrangea Grove
            Angry: [],     // Marigold Terrace
            Neutral: [],   // Wildflower Field (White Daisies)
            Excited: []    // Wildflower Field (Cherry Blossoms)
        };

        monthlyMemories.forEach(mem => {
            const mood = mem.mood || 'Neutral';
            if (grouped[mood]) {
                grouped[mood].push(mem);
            } else {
                grouped.Neutral.push(mem);
            }
        });

        const flowerList = [];

        Object.entries(grouped).forEach(([moodKey, items]) => {
            const count = items.length;
            if (count === 0) return;

            // Center anchors for named botanical areas
            let centerX = 500;
            if (moodKey === 'Sad') centerX = 130;       // Hydrangea Grove (Far-Left)
            else if (moodKey === 'Love') centerX = 290;  // Rose Courtyard (Mid-Left)
            else if (moodKey === 'Calm') centerX = 440;  // Lavender Walk (Center-Left)
            else if (moodKey === 'Happy') centerX = 640; // Sunrise Meadow (Center-Right)
            else if (moodKey === 'Angry') centerX = 860; // Marigold Terrace (Far-Right)
            else if (moodKey === 'Neutral') centerX = 530;// Wildflower Field (Mid-Center)
            else if (moodKey === 'Excited') centerX = 580;// Wildflower Field (Mid-Center)

            items.forEach((mem, index) => {
                const row = index % 3;
                // Layering coordinates (midground to foreground path)
                const y = 430 + row * 45 + (Math.sin(index * 2.3 + 1.2) * 8);

                // Horizontal distribution spacing inside the flower bed
                const spreadWidth = Math.min(90, count * 22);
                let offsetX = 0;
                if (count > 1) {
                    offsetX = -spreadWidth / 2 + (index / (count - 1)) * spreadWidth;
                }

                // Add organic offset/jitter
                const x = centerX + offsetX + (Math.cos(index * 3.1 + 0.8) * 8);

                // Scale flowers: make them large and clearly visible (Closer camera feel)
                const scale = 1.35 + (Math.abs(Math.sin(index * 5.7)) * 0.22);

                flowerList.push({
                    memory: mem,
                    x,
                    y,
                    row,
                    scale,
                    mood: moodKey
                });
            });
        });

        // Sort by y (depth) ascending, so background flowers render behind foreground flowers
        return flowerList.sort((a, b) => a.y - b.y);
    }, [monthlyMemories]);

    // Ambient lifecycle items: bees, butterflies, birds
    const butterflies = useMemo(() => {
        return Array.from({ length: 4 }).map((_, i) => ({
            id: i,
            delay: i * 3,
            duration: 18 + i * 4,
            type: i % 2 === 0 ? 'flyRoute1' : 'flyRoute2'
        }));
    }, []);

    const birds = useMemo(() => {
        return Array.from({ length: 3 }).map((_, i) => ({
            id: i,
            x: -50 - i * 80,
            y: 40 + i * 35,
            scale: 0.4 + i * 0.15,
            delay: i * 4,
            duration: 14 + i * 3
        }));
    }, []);

    // SVG Render Helpers for High-Detail realistic flowers (All Healthy & Beautiful)
    const renderFlowerSVG = (mood, scale) => {
        const stemPath = `M0,0 Q\${Math.sin(scale * 1.5) * 5},-75 0,-115`;
        const leftLeaf = `M\${Math.sin(scale * 1.5) * 3},-35 Q-20,-48 -6,-65 Q-2,-54 \${Math.sin(scale * 1.5) * 3},-35`;
        const rightLeaf = `M\${Math.sin(scale * 1.5) * 3},-48 Q20,-60 6,-78 Q2,-66 \${Math.sin(scale * 1.5) * 3},-48`;

        const stemAndLeaves = (
            <g>
                <path d={stemPath} fill="none" stroke="#1b7a38" strokeWidth="4.5" strokeLinecap="round" />
                <path d={leftLeaf} fill="#16a34a" />
                <path d={rightLeaf} fill="#15803d" />
            </g>
        );

        switch (mood) {
            case 'Happy': // Sunflower (Sunrise Meadow)
                return (
                    <g transform={`scale(${scale})`}>
                        {stemAndLeaves}
                        <g transform="translate(0, -115)">
                            {/* Double layer of petals */}
                            {Array.from({ length: 16 }).map((_, i) => {
                                const angle = (i * 360) / 16;
                                return (
                                    <g key={i} transform={`rotate(${angle})`}>
                                        <path d="M0,0 C-6,-12 -12,-30 0,-38 C12,-30 6,-12 0,0" fill="#fbbf24" opacity="0.9" />
                                        <path d="M0,0 C-4,-10 -9,-26 0,-34 C9,-26 4,-10 0,0" fill="#f59e0b" transform="rotate(11.25) scale(0.9)" />
                                    </g>
                                );
                            })}
                            <circle cx="0" cy="0" r="14" fill="#3f1e04" stroke="#d97706" strokeWidth="1" />
                            <circle cx="0" cy="0" r="10" fill="#1c0a00" />
                            {/* Seeds grid detail */}
                            <circle cx="-3" cy="-3" r="1" fill="#78350f" opacity="0.8" />
                            <circle cx="3" cy="3" r="1" fill="#78350f" opacity="0.8" />
                            <circle cx="-2" cy="2" r="1" fill="#78350f" opacity="0.8" />
                            <circle cx="2" cy="-2" r="1" fill="#78350f" opacity="0.8" />
                        </g>
                    </g>
                );

            case 'Love': // Rose (Rose Courtyard)
                return (
                    <g transform={`scale(${scale})`}>
                        {stemAndLeaves}
                        <g transform="translate(0, -115)">
                            {/* Layered Blooming Rose Buds */}
                            <circle cx="0" cy="0" r="18" fill="#991b1b" />
                            <path d="M-15,-6 C-22,-20 -5,-25 0,-15 C5,-25 22,-20 15,-6 C10,5 -10,5 -15,-6 Z" fill="#dc2626" />
                            <path d="M-10,-4 C-15,-14 -3,-18 0,-10 C3,-18 15,-14 10,-4 C6,3 -6,3 -10,-4 Z" fill="#ef4444" />
                            <path d="M-6,-2 C-9,-8 -2,-11 0,-6 C2,-11 9,-8 6,-2 C4,2 -4,2 -6,-2 Z" fill="#f87171" />
                            <circle cx="0" cy="-6" r="4.5" fill="#fca5a5" />
                        </g>
                    </g>
                );

            case 'Calm': // Lavender Spikes (Lavender Walk)
                return (
                    <g transform={`scale(${scale})`}>
                        <path d={stemPath} fill="none" stroke="#16a34a" strokeWidth="4" strokeLinecap="round" />
                        <g transform="translate(0, -45)">
                            {/* Stacked tiers of lavender bulbs */}
                            {[0, 12, 24, 36, 48, 60, 72].map((offset) => (
                                <g key={offset} transform={`translate(0, -${offset})`}>
                                    <ellipse cx="-5.5" cy="0" rx="5" ry="9" fill="#8b5cf6" transform="rotate(-15)" />
                                    <ellipse cx="5.5" cy="0" rx="5" ry="9" fill="#7c3aed" transform="rotate(15)" />
                                    <ellipse cx="-4" cy="-5" rx="4" ry="7.5" fill="#a78bfa" transform="rotate(-30)" />
                                    <ellipse cx="4" cy="-5" rx="4" ry="7.5" fill="#a78bfa" transform="rotate(30)" />
                                    <circle cx="0" cy="-8" r="3.5" fill="#ddd6fe" />
                                </g>
                            ))}
                        </g>
                    </g>
                );

            case 'Sad': // Hydrangea Domes (Hydrangea Grove)
                return (
                    <g transform={`scale(${scale})`}>
                        {stemAndLeaves}
                        <g transform="translate(0, -112)">
                            {/* Large dome plate */}
                            <circle cx="0" cy="0" r="23" fill="#1d4ed8" opacity="0.3" />
                            {/* Small clusters */}
                            {[
                                { dx: 0, dy: -12, scale: 0.9 },
                                { dx: -13, dy: -6, scale: 0.8 },
                                { dx: 13, dy: -6, scale: 0.8 },
                                { dx: -8, dy: 8, scale: 0.85 },
                                { dx: 8, dy: 8, scale: 0.85 },
                                { dx: 0, dy: 0, scale: 1.0 }
                            ].map((h, idx) => (
                                <g key={idx} transform={`translate(${h.dx}, ${h.dy}) scale(${h.scale})`}>
                                    <circle cx="0" cy="0" r="9" fill="#3b82f6" opacity="0.8" />
                                    {/* 4 tiny petals */}
                                    <path d="M-6,0 L6,0 M0,-6 L0,6" stroke="#93c5fd" strokeWidth="2.5" />
                                    <circle cx="0" cy="0" r="2" fill="#fef08a" />
                                </g>
                            ))}
                        </g>
                    </g>
                );

            case 'Angry': // Orange Marigolds (Marigold Terrace - Healthy & Beautiful)
                return (
                    <g transform={`scale(${scale})`}>
                        {stemAndLeaves}
                        <g transform="translate(0, -115)">
                            {/* Dense ruffled marigold puffball */}
                            <circle cx="0" cy="0" r="20" fill="#ea580c" />
                            {/* Layered circular ruffles */}
                            {Array.from({ length: 8 }).map((_, i) => {
                                const angle = (i * 360) / 8;
                                return (
                                    <g key={i} transform={`rotate(${angle})`}>
                                        <path d="M-8,-14 C-12,-18 -4,-22 0,-15 C4,-22 12,-18 8,-14 C4,-10 -4,-10 -8,-14" fill="#f97316" />
                                        <path d="M-6,-8 C-10,-12 -3,-15 0,-10 C3,-15 10,-12 6,-8 C3,-5 -3,-5 -6,-8" fill="#fb923c" transform="scale(0.85)" />
                                    </g>
                                );
                            })}
                            <circle cx="0" cy="0" r="8" fill="#d97706" />
                            <circle cx="0" cy="0" r="4.5" fill="#f59e0b" />
                        </g>
                    </g>
                );

            case 'Excited': // Cherry Blossoms (Wildflower Field)
                return (
                    <g transform={`scale(${scale})`}>
                        {stemAndLeaves}
                        <g transform="translate(0, -115)">
                            {/* 5 rounded petals */}
                            {Array.from({ length: 5 }).map((_, i) => {
                                const angle = (i * 360) / 5;
                                return (
                                    <path
                                        key={i}
                                        d="M0,0 C-9,-6 -18,-22 0,-30 C18,-22 9,-6 0,0"
                                        fill="#ec4899"
                                        transform={`rotate(${angle})`}
                                    />
                                );
                            })}
                            {/* Pistil details */}
                            {Array.from({ length: 5 }).map((_, i) => {
                                const angle = (i * 360) / 5 + 36;
                                return (
                                    <line key={i} x1="0" y1="0" x2="0" y2="-12" stroke="#fbcfe8" strokeWidth="1" transform={`rotate(${angle})`} />
                                );
                            })}
                            <circle cx="0" cy="0" r="5" fill="#fef08a" stroke="#db2777" strokeWidth="0.8" />
                        </g>
                    </g>
                );

            default: // White Daisies (Wildflower Field - Neutral)
                return (
                    <g transform={`scale(${scale})`}>
                        {stemAndLeaves}
                        <g transform="translate(0, -115)">
                            {/* 12 radial petals */}
                            {Array.from({ length: 12 }).map((_, i) => {
                                const angle = (i * 360) / 12;
                                return (
                                    <ellipse
                                        key={i}
                                        cx="0" cy="-16" rx="4.5" ry="15"
                                        fill="#f8fafc"
                                        transform={`rotate(${angle})`}
                                        style={{ transformOrigin: '0 0' }}
                                    />
                                );
                            })}
                            <circle cx="0" cy="0" r="8" fill="#eab308" stroke="#f1f5f9" strokeWidth="0.8" />
                            <circle cx="0" cy="0" r="4.5" fill="#ca8a04" />
                        </g>
                    </g>
                );
        }
    };

    if (loading) {
        return (
            <div className="flex-center" style={{ height: '70vh', flexDirection: 'column', gap: '1rem' }}>
                <i className='bx bx-loader-alt bx-spin' style={{ fontSize: '2.5rem', color: 'var(--accent-primary)' }}></i>
                <div className="muted">Tending to your garden… loading layout</div>
            </div>
        );
    }

    return (
        <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-light)', position: 'relative', background: '#0a0908', height: '640px' }}>
            
            {/* Scoped CSS animations for landscape elements */}
            <style dangerouslySetInnerHTML={{ __html: `
                /* Ambient plant sway */
                .flower-bloom-box {
                    transform-origin: bottom center;
                    animation: growBloomEffect 1.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                }
                @keyframes growBloomEffect {
                    from { transform: scale(0); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }

                .wind-sway-wrap {
                    transform-origin: bottom center;
                    animation: gentleMeadowSway 6.5s ease-in-out infinite alternate;
                }
                .wind-sway-wrap:nth-child(2n) { animation-delay: -1.8s; animation-duration: 5.4s; }
                .wind-sway-wrap:nth-child(3n) { animation-delay: -3.2s; animation-duration: 7.0s; }

                @keyframes gentleMeadowSway {
                    0% { transform: rotate(-2deg) skewX(-0.5deg); }
                    100% { transform: rotate(2deg) skewX(0.5deg); }
                }

                /* Flower Hover details */
                .flower-interactive-group {
                    cursor: pointer;
                }
                .flower-interactive-group:hover {
                    filter: brightness(1.15) drop-shadow(0 0 10px rgba(253, 224, 71, 0.45));
                }

                /* Sunlight rays pulse */
                @keyframes raysPulse {
                    0% { opacity: 0.1; }
                    100% { opacity: 0.28; }
                }
                .sunray-beam {
                    animation: raysPulse 5s ease-in-out infinite alternate;
                }

                /* Birds flight routes */
                @keyframes birdFlight {
                    0% { transform: translate(0, 0) scale(1); }
                    100% { transform: translate(1100px, -40px) scale(0.65); }
                }
                .ambient-bird {
                    animation: birdFlight linear infinite;
                }

                /* Butterflies wing flapping & path */
                .butterfly-flutter-g {
                    animation: bFlutter 0.12s linear infinite alternate;
                    transform-origin: center;
                }
                @keyframes bFlutter {
                    0% { transform: scaleX(1); }
                    100% { transform: scaleX(0.2); }
                }

                .butterfly-fly-1 { animation: flyRoute1 22s linear infinite; }
                .butterfly-fly-2 { animation: flyRoute2 26s linear infinite; }
                @keyframes flyRoute1 {
                    0% { transform: translate(-50px, 320px) rotate(15deg); }
                    25% { transform: translate(280px, 180px) rotate(-15deg); }
                    50% { transform: translate(580px, 340px) rotate(20deg); }
                    75% { transform: translate(840px, 190px) rotate(-5deg); }
                    100% { transform: translate(1050px, 280px) rotate(10deg); }
                }
                @keyframes flyRoute2 {
                    0% { transform: translate(1050px, 360px) scaleX(-1) rotate(-10deg); }
                    33% { transform: translate(720px, 200px) scaleX(-1) rotate(15deg); }
                    66% { transform: translate(320px, 300px) scaleX(-1) rotate(-15deg); }
                    100% { transform: translate(-50px, 240px) scaleX(-1) rotate(5deg); }
                }

                /* Bee buzzing orbits */
                .bee-path-wrap {
                    animation: beeOrbit 1.6s linear infinite;
                }
                @keyframes beeOrbit {
                    0% { transform: rotate(0deg) translate(6px) rotate(0deg); }
                    100% { transform: rotate(360deg) translate(6px) rotate(-360deg); }
                }

                /* Lantern ambient pulse */
                @keyframes lanternGlow {
                    0% { opacity: 0.6; filter: blur(3px); }
                    100% { opacity: 0.95; filter: blur(5px); }
                }
                .lantern-glow-light {
                    animation: lanternGlow 2.5s ease-in-out infinite alternate;
                }

                /* Fountain Ripples */
                @keyframes fountainRipple {
                    0% { transform: scale(0.6); opacity: 0.8; }
                    100% { transform: scale(1.3); opacity: 0; }
                }
                .fountain-ring {
                    transform-origin: center;
                    animation: fountainRipple 2.2s linear infinite;
                }

                /* Intro Cinematic Transition */
                .intro-overlay-backdrop {
                    position: absolute;
                    top: 0; left: 0; right: 0; bottom: 0;
                    z-index: 100;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: #fff;
                    transition: opacity 0.5s ease-out;
                    pointer-events: auto;
                    background: radial-gradient(circle at top, #1c1510 0%, #0d0a08 100%);
                }
                .intro-content-container {
                    text-align: center;
                    max-width: 540px;
                    padding: 2rem;
                    background: rgba(24, 20, 18, 0.45);
                    backdrop-filter: blur(15px);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 1.5rem;
                    box-shadow: 0 25px 60px rgba(0,0,0,0.6);
                    z-index: 110;
                }
                .intro-title-text {
                    font-family: var(--font-display);
                    font-size: 2.1rem;
                    font-weight: 700;
                    margin-bottom: 1.25rem;
                    line-height: 1.3;
                    color: #fca5a5;
                    text-shadow: 0 4px 10px rgba(0,0,0,0.4);
                }
                .intro-subtitle-text {
                    font-size: 1.05rem;
                    color: #f3f4f6;
                    line-height: 1.6;
                    font-family: var(--font-hand);
                    text-shadow: 0 2px 6px rgba(0,0,0,0.3);
                }
            `}} />

            {/* Topbar Selector Inside Panel */}
            <div style={{
                position: 'absolute', top: 20, left: 20, right: 20,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                zIndex: 80
            }}>
                <div>
                    <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.45rem', color: '#eae6e2', textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>
                        Botanical Sanctuary
                    </h3>
                    <div style={{ fontSize: '0.8rem', marginTop: '0.15rem', color: '#a8a29e', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
                        A beautiful living tapestry of your emotional journey.
                    </div>
                </div>

                {/* Date Dropdown Select */}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <label style={{ fontSize: '0.78rem', color: '#a8a29e' }}>Archive Feed:</label>
                    <select
                        value={selectedMonthKey}
                        onChange={(e) => setSelectedMonthKey(e.target.value)}
                        style={{
                            background: 'rgba(28, 25, 23, 0.95)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            borderRadius: '8px',
                            padding: '0.35rem 1.8rem 0.35rem 0.65rem',
                            color: '#eae6e2',
                            fontSize: '0.82rem',
                            cursor: 'pointer',
                            outline: 'none',
                            fontFamily: 'var(--font-sans)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
                        }}
                    >
                        {availableMonths.map((m) => (
                            <option key={m.key} value={m.key}>
                                {m.label} {m.key === `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}` ? '(Active)' : ''}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Dynamic Intro Screen Experience */}
            {introState !== 'garden' && (
                <div 
                    className="intro-overlay-backdrop"
                    style={{
                        opacity: introState === 'fading' ? 0 : 1,
                        pointerEvents: introState === 'fading' ? 'none' : 'auto'
                    }}
                >
                    <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                        {/* Soft sunrise rays in intro background */}
                        <polygon points="500,300 250,0 350,0" fill="#fef08a" opacity="0.1" />
                        <polygon points="500,300 650,0 750,0" fill="#fef08a" opacity="0.08" />
                        <polygon points="500,300 100,0 180,0" fill="#fef08a" opacity="0.06" />
                    </svg>

                    <div className="intro-content-container">
                        <div className="intro-title-text">
                            🌸 Welcome to Your Sanctuary
                        </div>
                        <div className="intro-subtitle-text">
                            "{welcomeMessage}"
                            <div style={{ marginTop: '0.8rem', fontSize: '0.85rem', color: '#cbd5e1', fontFamily: 'var(--font-sans)' }}>
                                Loading the garden for <strong>{selectedMonthName} {selectedYear}</strong>...
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleEnterGarden}
                        style={{
                            position: 'absolute', bottom: 30, right: 30, zIndex: 120,
                            padding: '0.45rem 1.1rem', border: '1px solid rgba(255,255,255,0.18)',
                            borderRadius: '20px', background: 'rgba(255,255,255,0.06)',
                            color: '#eae6e2', fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.2s',
                            fontFamily: 'var(--font-sans)'
                        }}
                    >
                        Skip Intro <i className="bx bx-right-arrow-alt" style={{ verticalAlign: 'middle', marginLeft: '2px' }} />
                    </button>
                </div>
            )}

            {/* Botanical Garden SVG Board */}
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                <svg
                    viewBox="0 0 1000 600"
                    width="100%"
                    height="100%"
                    style={{ display: 'block' }}
                >
                    <defs>
                        {/* Sunbeams Sunrise/Sunset sky gradient */}
                        <linearGradient id="warm-sky" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#1e152a" />
                            <stop offset="45%" stopColor="#451e3e" />
                            <stop offset="70%" stopColor="#c15c3d" opacity="0.8" />
                            <stop offset="85%" stopColor="#f59e0b" opacity="0.9" />
                            <stop offset="100%" stopColor="#fed7aa" />
                        </linearGradient>

                        <linearGradient id="lush-grass" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#1b6e2e" />
                            <stop offset="100%" stopColor="#0a3c18" />
                        </linearGradient>

                        <linearGradient id="stone-paver" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#78716c" />
                            <stop offset="100%" stopColor="#44403c" />
                        </linearGradient>

                        <linearGradient id="lantern-light" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#fef08a" />
                            <stop offset="100%" stopColor="#ca8a04" opacity="0" />
                        </linearGradient>
                    </defs>

                    {/* 1. SKY */}
                    <rect width="1000" height="380" fill="url(#warm-sky)" />

                    {/* Sunset/Sunrise Glowing Sun disk */}
                    <g>
                        <circle cx="500" cy="270" r="140" fill="#fef08a" opacity="0.12" filter="blur(15px)" />
                        <circle cx="500" cy="270" r="80" fill="#ffffff" opacity="0.25" filter="blur(5px)" />
                    </g>

                    {/* Soft Sunray beams */}
                    <g opacity="0.2">
                        <polygon points="500,270 200,0 280,0" fill="#fde047" className="sunray-beam" />
                        <polygon points="500,270 680,0 780,0" fill="#fde047" className="sunray-beam" style={{ animationDelay: '1.2s' }} />
                        <polygon points="500,270 420,0 520,0" fill="#fde047" className="sunray-beam" style={{ animationDelay: '2.5s' }} />
                    </g>

                    {/* Drifting background clouds */}
                    <g fill="#f8fafc" opacity="0.15">
                        <path d="M-50,60 C-30,40 10,40 30,60 C50,45 80,50 90,65 C100,60 115,70 105,82 C-50,82 -50,65 -50,60 Z" className="cloud-shape" style={{ animation: 'cloudDrift 110s linear infinite' }} />
                        <path d="M450,40 C470,20 510,20 530,40 C550,25 580,30 590,45 C600,40 615,50 605,62 C450,62 450,45 450,40 Z" className="cloud-shape" style={{ animation: 'cloudDrift 160s linear infinite', animationDelay: '-40s' }} />
                    </g>

                    {/* Distant mountains/trees silhouettes */}
                    <path d="M-100,380 Q50,330 180,355 Q350,320 520,360 Q700,340 850,365 Q950,335 1100,380 L1100,450 L-100,450 Z" fill="#132c1c" opacity="0.9" />
                    <path d="M-100,385 Q100,350 300,375 Q550,350 720,380 Q880,360 1100,385 L1100,450 L-100,450 Z" fill="#0d2315" />

                    {/* 2. BACKGROUND STRUCTURES */}
                    {/* Beautiful wooden gazebo (Center-Right in midground) */}
                    <g transform="translate(680, 240)">
                        {/* Base platform */}
                        <polygon points="-50,110 50,110 40,125 -40,125" fill="#44403c" stroke="#292524" strokeWidth="1.5" />
                        {/* Pillars */}
                        <line x1="-42" y1="110" x2="-42" y2="40" stroke="#78716c" strokeWidth="4.5" />
                        <line x1="42" y1="110" x2="42" y2="40" stroke="#78716c" strokeWidth="4.5" />
                        <line x1="-18" y1="110" x2="-18" y2="40" stroke="#78716c" strokeWidth="3" opacity="0.85" />
                        <line x1="18" y1="110" x2="18" y2="40" stroke="#78716c" strokeWidth="3" opacity="0.85" />
                        {/* Railings */}
                        <rect x="-42" y="80" width="84" height="6" fill="#8c786a" stroke="#292524" />
                        {Array.from({ length: 9 }).map((_, i) => (
                            <line key={i} x1={-36 + i * 9} y1="86" x2={-36 + i * 9} y2="110" stroke="#292524" strokeWidth="1.5" />
                        ))}
                        {/* Roof arch */}
                        <path d="M-52,40 Q0,8 52,40 Z" fill="#2d3748" stroke="#1a202c" strokeWidth="2" />
                        <polygon points="-55,42 55,42 45,35 -45,35" fill="#78350f" />
                        <circle cx="0" cy="18" r="4.5" fill="#fbbf24" />
                    </g>

                    {/* 3. GROUND AND FIELDS LAYOUT */}
                    {/* Meadow ground paths */}
                    <path d="M-100,380 Q150,355 400,375 Q650,395 1100,380 L1100,650 L-100,650 Z" fill="#14532d" opacity="0.6" />
                    <path d="M-100,400 Q200,375 520,395 Q800,415 1100,400 L1100,650 L-100,650 Z" fill="#165b2d" opacity="0.8" />
                    <path d="M-100,425 Q300,405 600,430 Q900,455 1100,425 L1100,650 L-100,650 Z" fill="url(#lush-grass)" />

                    {/* Horizontal Wooden Fence border along back boundary */}
                    <g stroke="#292524" strokeWidth="1">
                        {/* Posts */}
                        {[0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000].map((px) => (
                            <rect key={px} x={px - 4} y={350} width="8" height="42" fill="#78350f" stroke="#451a03" strokeWidth="1.5" />
                        ))}
                        {/* Horizontal slats */}
                        <rect x="0" y="360" width="1000" height="5" fill="#8f3f15" stroke="#451a03" />
                        <rect x="0" y="375" width="1000" height="5" fill="#8f3f15" stroke="#451a03" />
                    </g>

                    {/* 4. CLASSICAL FOUNTAIN (Midground Left, x=180) */}
                    <g transform="translate(180, 355)">
                        {/* Concentric ripples */}
                        <ellipse cx="0" cy="45" rx="36" ry="14" fill="none" stroke="#60a5fa" strokeWidth="1" className="fountain-ring" />
                        <ellipse cx="0" cy="45" rx="36" ry="14" fill="none" stroke="#93c5fd" strokeWidth="1" className="fountain-ring" style={{ animationDelay: '1.1s' }} />

                        {/* Bottom basin */}
                        <ellipse cx="0" cy="45" rx="42" ry="16" fill="#78716c" stroke="#44403c" strokeWidth="2" />
                        <ellipse cx="0" cy="42" rx="38" ry="13" fill="#1e3a8a" opacity="0.85" />
                        
                        {/* Pedestal */}
                        <rect x="-10" y="5" width="20" height="38" fill="#57524e" stroke="#292524" />
                        
                        {/* Upper basin */}
                        <ellipse cx="0" cy="5" rx="26" ry="10" fill="#78716c" stroke="#44403c" strokeWidth="2" />
                        <ellipse cx="0" cy="3" rx="23" ry="8" fill="#1d4ed8" />

                        {/* Fountain water jets */}
                        <path d="M0,0 Q-28,-22 -20,40" fill="none" stroke="#93c5fd" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
                        <path d="M0,0 Q28,-22 20,40" fill="none" stroke="#93c5fd" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
                        <path d="M0,-8 Q-16,-34 -25,40" fill="none" stroke="#e0f2fe" strokeWidth="2.5" strokeLinecap="round" opacity="0.75" />
                        <path d="M0,-8 Q16,-34 25,40" fill="none" stroke="#e0f2fe" strokeWidth="2.5" strokeLinecap="round" opacity="0.75" />
                        {/* Center splash */}
                        <ellipse cx="0" cy="-5" rx="5" ry="8" fill="#ffffff" opacity="0.9" />
                    </g>

                    {/* 5. STONE PATHWAY Winding forward */}
                    <g fill="url(#stone-paver)" stroke="#292524" strokeWidth="1">
                        {/* Handcrafted stone layout to feel organic */}
                        <path d="M 720,380 C 700,410 650,430 630,470 C 600,510 540,550 500,600 L 590,600 C 620,560 670,520 700,480 C 730,440 760,415 765,380 Z" fill="#57534e" opacity="0.45" stroke="none" />
                        {/* Pavers overlay */}
                        <ellipse cx="738" cy="390" rx="14" ry="5" />
                        <ellipse cx="712" cy="400" rx="16" ry="5.5" />
                        <ellipse cx="740" cy="410" rx="18" ry="6" />
                        <ellipse cx="700" cy="422" rx="20" ry="7" />
                        <ellipse cx="732" cy="436" rx="23" ry="8" />
                        <ellipse cx="680" cy="452" rx="25" ry="9" />
                        <ellipse cx="718" cy="470" rx="28" ry="10" />
                        <ellipse cx="660" cy="492" rx="32" ry="11" />
                        <ellipse cx="702" cy="515" rx="36" ry="12.5" />
                        <ellipse cx="632" cy="542" rx="42" ry="14" />
                        <ellipse cx="680" cy="572" rx="48" ry="16" />
                        <ellipse cx="585" cy="595" rx="55" ry="18" />
                    </g>

                    {/* Cozy Wooden Bench (Midground Center, next to path) */}
                    <g transform="translate(480, 420)">
                        {/* Cast-iron legs */}
                        <line x1="-32" y1="20" x2="-32" y2="42" stroke="#1c1917" strokeWidth="4.5" />
                        <line x1="32" y1="20" x2="32" y2="42" stroke="#1c1917" strokeWidth="4.5" />
                        <line x1="-24" y1="20" x2="-24" y2="42" stroke="#1c1917" strokeWidth="4.5" />
                        <line x1="24" y1="20" x2="24" y2="42" stroke="#1c1917" strokeWidth="4.5" />
                        {/* Wood Planks */}
                        <rect x="-38" y="16" width="76" height="6" fill="#854d0e" rx="2" stroke="#451a03" strokeWidth="1.2" />
                        <rect x="-38" y="7" width="76" height="6" fill="#854d0e" rx="2" stroke="#451a03" strokeWidth="1.2" />
                        {/* Backrest */}
                        <rect x="-38" y="-12" width="76" height="15" fill="none" stroke="#1c1917" strokeWidth="2.5" rx="3" />
                        <rect x="-34" y="-8" width="68" height="7" fill="#a16207" stroke="#451a03" />
                    </g>

                    {/* Elegant Lamppost Lanterns (Glowing warm light) */}
                    {[
                        { x: 380, y: 360, size: 0.9, delay: '0s' },
                        { x: 830, y: 395, size: 1.0, delay: '1.2s' }
                    ].map((post, idx) => (
                        <g key={idx} transform={`translate(${post.x}, ${post.y}) scale(${post.size})`}>
                            {/* Base Post */}
                            <line x1="0" y1="50" x2="0" y2="-75" stroke="#1c1917" strokeWidth="4.5" />
                            <rect x="-6" y="45" width="12" height="8" fill="#1c1917" />
                            {/* Arm brackets */}
                            <path d="M0,-62 Q-14,-62 -14,-50" fill="none" stroke="#1c1917" strokeWidth="2.5" />
                            {/* Lantern housing */}
                            <rect x="-17" y="-50" width="6" height="12" fill="#1c1917" />
                            <polygon points="-19,-38 -11,-38 -13,-24 -17,-24" fill="none" stroke="#1c1917" strokeWidth="2" />
                            {/* Yellow glow light */}
                            <circle cx="-15" cy="-31" r="14" fill="url(#lantern-light)" className="lantern-glow-light" style={{ animationDelay: post.delay }} />
                            <circle cx="-15" cy="-31" r="3.5" fill="#fef08a" />
                        </g>
                    ))}

                    {/* Ambient Birds Flying (Living detail) */}
                    {introState === 'garden' && birds.map((b) => (
                        <g key={b.id} className="ambient-bird" style={{ animationDelay: `${b.delay}s`, animationDuration: `${b.duration}s` }}>
                            <g transform={`translate(${b.x}, ${b.y}) scale(${b.scale})`} stroke="#1e293b" strokeWidth="2.2" fill="none" strokeLinecap="round">
                                {/* Flying silhouette wing path */}
                                <path d="M-10,0 Q-4,-8 0,-2 Q4,-8 10,0" />
                            </g>
                        </g>
                    ))}

                    {/* Ambient Butterflies (Living detail) */}
                    {introState === 'garden' && butterflies.map((b) => (
                        <g key={b.id} className={b.type} style={{ animationDelay: `${b.delay}s`, animationDuration: `${b.duration}s` }}>
                            <g className="butterfly-flutter-g">
                                <path d="M-6,-4 C-8,-10 -2,-12 0,-3 C2,-12 8,-10 6,-4 C4,2 0,0 -6,-4" fill={b.id % 2 === 0 ? '#60a5fa' : '#f472b6'} />
                                <path d="M-4,-3 C-6,-8 -2,-10 0,-2 C2,-10 6,-8 4,-3 C2,1 0,0 -4,-3" fill={b.id % 2 === 0 ? '#fb7185' : '#fef08a'} />
                                <line x1="0" y1="2" x2="-2" y2="-5" stroke="#1e293b" strokeWidth="0.8" />
                                <line x1="0" y1="2" x2="2" y2="-5" stroke="#1e293b" strokeWidth="0.8" />
                            </g>
                        </g>
                    ))}

                    {/* 6. PLANTED FLOWER BEDS */}
                    {positionedFlowers.map((flower) => (
                        <g
                            key={flower.memory.id}
                            transform={`translate(${flower.x}, ${flower.y})`}
                            className="flower-bloom-box"
                        >
                            <g className="wind-sway-wrap">
                                <g className="flower-interactive-group" onClick={() => setSelectedMemory(flower.memory)}>
                                    {renderFlowerSVG(flower.mood, flower.scale)}
                                </g>

                                {/* Ambient Honey Bees hovering over Sunflowers, Roses, and Lavender */}
                                {(flower.mood === 'Happy' || flower.mood === 'Calm' || flower.mood === 'Love') && (
                                    <g transform="translate(0, -115)" className="bee-path-wrap">
                                        <circle cx="0" cy="0" r="2" fill="#f59e0b" stroke="#1c1917" strokeWidth="0.5" />
                                        {/* Wing */}
                                        <ellipse cx="-1.5" cy="-2" rx="1.2" ry="0.6" fill="rgba(255,255,255,0.75)" transform="rotate(-30)" />
                                    </g>
                                )}
                            </g>
                        </g>
                    ))}

                    {/* 7. IMMERSIVE CLOSE-UP FOREGROUND SHRUBS AND FRAMING LEAVES */}
                    {/* Generates a nice close-up depth of field and framing effect */}
                    <g fill="#0b2c15" opacity="0.95" stroke="#05160a" strokeWidth="1">
                        {/* Left corner foreground framing leaves */}
                        <path d="M-10,610 L80,560 C60,530 40,490 -10,480 Z" />
                        <path d="M-20,550 L110,490 C80,440 20,440 -20,460 Z" />
                        {/* Right corner foreground framing leaves */}
                        <path d="M1010,610 L920,560 C940,530 960,490 1010,480 Z" />
                        <path d="M1020,550 L890,490 C920,440 980,440 1020,460 Z" />
                    </g>
                </svg>

                {/* Floating Ground Botanical Area Legend Panel */}
                <div style={{
                    position: 'absolute', bottom: 20, left: 20,
                    display: 'flex', gap: '0.8rem', flexWrap: 'wrap',
                    background: 'rgba(28, 25, 23, 0.82)', padding: '0.55rem 0.9rem',
                    borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.1)',
                    fontSize: '0.72rem', color: '#eae6e2', pointerEvents: 'none',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(10px)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span style={{ fontSize: '0.9rem' }}>🌻</span> Sunrise Meadow
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span style={{ fontSize: '0.9rem' }}>🌹</span> Rose Courtyard
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span style={{ fontSize: '0.9rem' }}>🪻</span> Lavender Walk
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span style={{ fontSize: '0.9rem' }}>💙</span> Hydrangea Grove
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span style={{ fontSize: '0.9rem' }}>🧡</span> Marigold Terrace
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span style={{ fontSize: '0.9rem' }}>🌼</span> Wildflower Field
                    </div>
                </div>

                {/* Empty State Banner (No memories logged for selected Month) */}
                {monthlyMemories.length === 0 && (
                    <div style={{
                        position: 'absolute', top: '52%', left: '50%', transform: 'translate(-50%, -50%)',
                        background: 'rgba(28, 25, 23, 0.94)', padding: '2.5rem', borderRadius: '16px',
                        border: '1px solid rgba(255, 255, 255, 0.12)', color: '#eae6e2', textAlign: 'center',
                        maxWidth: '430px', zIndex: 30, boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
                        backdropFilter: 'blur(15px)'
                    }}>
                        <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', margin: '0 0 0.6rem 0', color: '#fbbf24' }}>An Empty Meadow</h4>
                        <p style={{ fontSize: '0.88rem', color: '#d6d3d1', margin: '0 0 1.5rem 0', lineHeight: 1.55 }}>
                            The landscape is fresh and waiting for you. Write your first diary entry for {selectedMonthName} {selectedYear} to watch your emotional sanctuary begin to bloom.
                        </p>
                        <button
                            className="btn btn-primary"
                            style={{ background: 'linear-gradient(135deg, #ca8a04, #a16207)', border: 'none', color: '#fff', width: '100%', padding: '0.65rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
                            onClick={() => go && go('editor')}
                        >
                            Write Today's Memory ✍️
                        </button>
                    </div>
                )}

                {/* Detail Overlay Card (Clicked Flower) */}
                {selectedMemory && (
                    <div className="garden-details-panel" style={{
                        position: 'absolute', top: 80, right: 20, width: '290px',
                        background: 'rgba(28, 25, 23, 0.95)', border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '14px', padding: '1rem', boxShadow: '0 15px 45px rgba(0,0,0,0.6)',
                        backdropFilter: 'blur(15px)', zIndex: 90
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#a8a29e', fontFamily: 'monospace' }}>
                                {new Date(selectedMemory.created_at).toLocaleDateString('en-US', {
                                    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
                                })}
                            </span>
                            <button
                                onClick={() => setSelectedMemory(null)}
                                style={{ background: 'none', border: 'none', color: '#a8a29e', fontSize: '1.25rem', cursor: 'pointer', padding: 0 }}
                            >
                                <i className="bx bx-x" />
                            </button>
                        </div>

                        <h4 style={{ margin: '0 0 0.4rem 0', color: '#eae6e2', fontSize: '1.15rem', fontFamily: 'var(--font-display)', lineHeight: 1.3 }}>
                            {selectedMemory.title}
                        </h4>

                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.85rem' }}>
                            <span style={{
                                background: 'rgba(255,255,255,0.08)', padding: '0.15rem 0.5rem',
                                borderRadius: '4px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.25rem'
                            }}>
                                <span>{moodMeta(selectedMemory.mood).emoji}</span>
                                <span style={{ color: moodMeta(selectedMemory.mood).color, fontWeight: 600 }}>{selectedMemory.mood}</span>
                            </span>
                            {selectedMemory.favorite && (
                                <span style={{
                                    background: 'rgba(251,191,36,0.15)', color: '#fbbf24',
                                    padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600
                                }}>
                                    ⭐ Starred
                                </span>
                            )}
                        </div>

                        <p style={{
                            color: '#d6d3d1', fontSize: '0.85rem', lineHeight: 1.5,
                            margin: '0 0 1.25rem 0', maxHeight: '110px', overflowY: 'auto',
                            borderLeft: '2px solid #ca8a04', paddingLeft: '0.5rem'
                        }}>
                            {selectedMemory.content.replace(/<[^>]*>/g, '').slice(0, 150)}
                            {selectedMemory.content.replace(/<[^>]*>/g, '').length > 150 ? '...' : ''}
                        </p>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                            <button
                                className="btn btn-secondary"
                                style={{
                                    fontSize: '0.72rem', padding: '0.3rem 0.65rem',
                                    color: '#eae6e2', border: '1px solid rgba(255,255,255,0.1)',
                                    background: 'rgba(255,255,255,0.04)', borderRadius: '6px', cursor: 'pointer'
                                }}
                                onClick={() => setSelectedMemory(null)}
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
