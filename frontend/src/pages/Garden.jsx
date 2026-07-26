import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../lib/api';
import { moodMeta } from '../lib/demo';

export default function Garden({ go }) {
    const [memories, setMemories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMemory, setSelectedMemory] = useState(null);
    const [selectedMonthKey, setSelectedMonthKey] = useState(''); // "YYYY-MM"
    const [introState, setIntroState] = useState('intro'); // 'intro' | 'fading' | 'garden'
    const [latestMemory, setLatestMemory] = useState(null);

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
        load();
    }, []);

    // Extract all unique month-years that contain memories (to populate the archive dropdown)
    const availableMonths = useMemo(() => {
        const monthsMap = {};
        
        // Add current month in case it has no memories yet
        const now = new Date();
        const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        monthsMap[currentKey] = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });

        memories.forEach(mem => {
            const d = new Date(mem.created_at);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            monthsMap[key] = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
        });

        // Convert to array and sort descending (newest first)
        return Object.entries(monthsMap)
            .map(([key, label]) => ({ key, label }))
            .sort((a, b) => b.key.localeCompare(a.key));
    }, [memories]);

    // Parse selected month details
    const { selectedYear, selectedMonthNum, selectedMonthName } = useMemo(() => {
        if (!selectedMonthKey) return { selectedYear: 2026, selectedMonthNum: 6, selectedMonthName: 'July' };
        const [y, m] = selectedMonthKey.split('-').map(Number);
        const dummyDate = new Date(y, m - 1, 1);
        return {
            selectedYear: y,
            selectedMonthNum: m - 1, // 0-indexed for JS Date
            selectedMonthName: dummyDate.toLocaleString('en-US', { month: 'long' })
        };
    }, [selectedMonthKey]);

    // Filter memories to display strictly the selected month's entries
    const monthlyMemories = useMemo(() => {
        return memories.filter(mem => {
            const date = new Date(mem.created_at);
            return date.getFullYear() === selectedYear && date.getMonth() === selectedMonthNum;
        });
    }, [memories, selectedYear, selectedMonthNum]);

    // Find the latest memory of the selected month
    const monthLatestMemory = useMemo(() => {
        if (!monthlyMemories.length) return null;
        // Sort newest first
        const sorted = [...monthlyMemories].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        return sorted[0];
    }, [monthlyMemories]);

    // Trigger the Intro Screen experience when the month is selected
    useEffect(() => {
        if (!loading) {
            if (monthLatestMemory) {
                setLatestMemory(monthLatestMemory);
                setIntroState('intro');
                
                // Transition to fading
                const fadeTimer = setTimeout(() => {
                    setIntroState('fading');
                }, 4000);

                // Transition to showing the garden
                const gardenTimer = setTimeout(() => {
                    setIntroState('garden');
                }, 4600);

                return () => {
                    clearTimeout(fadeTimer);
                    clearTimeout(gardenTimer);
                };
            } else {
                // If no memories exist this month, skip straight to empty garden
                setLatestMemory(null);
                setIntroState('garden');
            }
        }
    }, [loading, selectedMonthKey, monthLatestMemory]);

    // Skip intro and jump straight into garden
    const handleEnterGarden = () => {
        setIntroState('fading');
        setTimeout(() => setIntroState('garden'), 600);
    };

    // Format dates helper (e.g. "12 July")
    const formatIntroDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        const day = d.getDate();
        const monthName = d.toLocaleString('en-US', { month: 'long' });
        return `${day} ${monthName}`;
    };

    // Distribute flowers into coordinate slots grouped by emotional zones (flower beds)
    // Zones:
    // Left: Sad (Hydrangeas) ~ center X = 160
    // Center-Left: Love (Rose Bushes) ~ center X = 330
    // Center: Neutral / Excited / Anxious (Mixed Daisies) ~ center X = 500
    // Center-Right: Happy / Angry (Sunflower Patches & Distressed Sunflowers) ~ center X = 670
    // Right: Calm (Lavender Fields) ~ center X = 840
    const positionedFlowers = useMemo(() => {
        if (monthlyMemories.length === 0) return [];

        // Group memories by their mood/category
        const grouped = {
            Sad: [],
            Love: [],
            Neutral: [], // Neutral, Excited, Anxious
            HappyAngry: [], // Happy + Angry share the sunflower zone
            Calm: []
        };

        monthlyMemories.forEach(mem => {
            if (mem.mood === 'Sad') grouped.Sad.push(mem);
            else if (mem.mood === 'Love') grouped.Love.push(mem);
            else if (mem.mood === 'Calm') grouped.Calm.push(mem);
            else if (mem.mood === 'Happy' || mem.mood === 'Angry') grouped.HappyAngry.push(mem);
            else grouped.Neutral.push(mem); // Neutral, Anxious, Excited, etc.
        });

        const flowerList = [];

        // Distribute coordinates in each bed
        Object.entries(grouped).forEach(([bedKey, items]) => {
            const count = items.length;
            let centerX = 500;
            
            if (bedKey === 'Sad') centerX = 160;
            else if (bedKey === 'Love') centerX = 330;
            else if (bedKey === 'HappyAngry') centerX = 670;
            else if (bedKey === 'Calm') centerX = 840;

            items.forEach((mem, index) => {
                // Determine depth row (0, 1, 2)
                const row = index % 3;
                const y = 430 + row * 45 + (Math.sin(index * 2.3 + 1.2) * 8);

                // Horizontal spread: larger count leads to slightly wider beds
                const spreadWidth = Math.min(120, count * 28);
                let offsetX = 0;
                if (count > 1) {
                    offsetX = -spreadWidth / 2 + (index / (count - 1)) * spreadWidth;
                }
                
                // Add organic offset/jitter
                const x = centerX + offsetX + (Math.cos(index * 3.1 + 0.8) * 8);

                // Growth scale matures slightly as count grows, or remains healthy and randomized
                const scale = 0.85 + (Math.abs(Math.sin(index * 5.7)) * 0.25);

                flowerList.push({
                    memory: mem,
                    x,
                    y,
                    row,
                    scale,
                    bedKey
                });
            });
        });

        // Sort by y (depth) ascending, so background elements draw first
        return flowerList.sort((a, b) => a.y - b.y);
    }, [monthlyMemories]);

    // Local weather states: check if current selection contains Sad/Angry entries to show light ongoing ambient effects
    const hasSadness = useMemo(() => monthlyMemories.some(m => m.mood === 'Sad'), [monthlyMemories]);
    const hasAnger = useMemo(() => monthlyMemories.some(m => m.mood === 'Angry'), [monthlyMemories]);

    // Generate local rain lines over the Sad (hydrangea) section (x: 50 to 280)
    const hydrangeaRainDrops = useMemo(() => {
        return Array.from({ length: 18 }).map((_, i) => ({
            id: i,
            x: 60 + Math.random() * 210,
            y: Math.random() * -100,
            len: 10 + Math.random() * 15,
            delay: Math.random() * 2,
            duration: 1.0 + Math.random() * 0.6,
            opacity: 0.25 + Math.random() * 0.35
        }));
    }, []);

    // Generate local angry drifting petals over the Sunflowers section (x: 580 to 760)
    const sunflowerDriftingPetals = useMemo(() => {
        return Array.from({ length: 10 }).map((_, i) => ({
            id: i,
            x: 580 + Math.random() * 180,
            y: 250 + Math.random() * 100,
            delay: Math.random() * 6,
            duration: 4.5 + Math.random() * 3,
            scale: 0.5 + Math.random() * 0.5
        }));
    }, []);

    // Render individual flower types as SVG elements
    const renderFlowerSVG = (mood, scale) => {
        // Base stems and leaf templates
        const stemPath = `M0,0 Q\${Math.sin(scale * 1.5) * 8},-75 0,-125`;
        const leftLeaf = `M\${Math.sin(scale * 1.5) * 4},-40 Q-24,-52 -8,-70 Q-3,-58 \${Math.sin(scale * 1.5) * 4},-40`;
        const rightLeaf = `M\${Math.sin(scale * 1.5) * 4},-55 Q24,-67 8,-85 Q3,-72 \${Math.sin(scale * 1.5) * 4},-55`;

        const stemAndLeaves = (
            <g>
                <path d={stemPath} fill="none" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" />
                <path d={leftLeaf} fill="#16a34a" />
                <path d={rightLeaf} fill="#15803d" />
            </g>
        );

        switch (mood) {
            case 'Happy': // Bright Sunflower Patch
                return (
                    <g transform={`scale(${scale})`}>
                        {stemAndLeaves}
                        <g transform="translate(0, -125)">
                            {Array.from({ length: 12 }).map((_, i) => {
                                const angle = (i * 360) / 12;
                                return (
                                    <path
                                        key={i}
                                        d="M0,0 C-7,-10 -13,-28 0,-36 C13,-28 7,-10 0,0"
                                        fill="#eab308"
                                        transform={`rotate(${angle})`}
                                    />
                                );
                            })}
                            <circle cx="0" cy="0" r="12" fill="#451a03" stroke="#eab308" strokeWidth="1.2" />
                            <circle cx="0" cy="0" r="8" fill="#290700" />
                        </g>
                    </g>
                );

            case 'Angry': // Sunflower with petals missing / standing tall and healthy
                return (
                    <g transform={`scale(${scale})`}>
                        {stemAndLeaves}
                        <g transform="translate(0, -125)">
                            {/* Render sunflower with 4-5 petals missing (rendering only specific indices) */}
                            {[0, 1, 3, 4, 6, 7, 9, 10].map((idx) => {
                                const angle = (idx * 360) / 12;
                                return (
                                    <path
                                        key={idx}
                                        d="M0,0 C-7,-10 -13,-28 0,-36 C13,-28 7,-10 0,0"
                                        fill="#ea580c" /* slightly distressed orange-yellow */
                                        transform={`rotate(${angle})`}
                                    />
                                );
                            })}
                            <circle cx="0" cy="0" r="12" fill="#451a03" stroke="#ea580c" strokeWidth="1.2" />
                            <circle cx="0" cy="0" r="8" fill="#290700" />
                        </g>
                        {/* Two falling/detached petals near the flower stem */}
                        <g transform="translate(0, -125)" className="petal-sway-local">
                            <path d="M-10,45 C-15,53 -8,63 -3,70 C3,63 -5,53 -10,45" fill="#ea580c" opacity="0.85" />
                            <path d="M12,65 C8,73 18,80 20,88 C22,80 15,73 12,65" fill="#ea580c" opacity="0.75" />
                        </g>
                    </g>
                );

            case 'Love': // Red Rose Bush
                // Render a branching rose stem with leaves and multiple rose heads to represent a "bush"
                return (
                    <g transform={`scale(${scale})`}>
                        {/* Shrub-like green leaves outline */}
                        <path d="M-25,-90 Q-40,-115 -10,-130 Q15,-140 30,-110 Q40,-85 10,-80 Z" fill="#15803d" opacity="0.9" />
                        <path d="M-15,-70 Q-35,-85 -5,-105 Q15,-115 25,-90 Q30,-70 5,-65 Z" fill="#166534" opacity="0.95" />
                        
                        {/* Main trunk */}
                        <path d="M0,0 Q-5,-60 0,-100" fill="none" stroke="#166534" strokeWidth="4.5" strokeLinecap="round" />
                        {/* Branches */}
                        <path d="M-3,-50 Q-20,-75 -15,-95" fill="none" stroke="#166534" strokeWidth="3" />
                        <path d="M2,-60 Q20,-85 15,-105" fill="none" stroke="#166534" strokeWidth="3" />

                        {/* Rose Bud 1 (Left branch tip) */}
                        <g transform="translate(-15, -95) scale(0.85)">
                            <path d="M0,3 C-12,-3 -16,-20 -2,-24 C10,-20 8,-3 0,3" fill="#dc2626" />
                            <path d="M-2,3 C-10,-6 -12,-26 4,-27 C10,-20 6,-3 -2,3" fill="#991b1b" />
                            <path d="M2,3 C10,-6 12,-26 -4,-27 C-10,-20 -6,-3 2,3" fill="#ef4444" />
                            <circle cx="0" cy="-12" r="4" fill="#f87171" />
                        </g>
                        
                        {/* Rose Bud 2 (Center main tip) */}
                        <g transform="translate(0, -108)">
                            <path d="M0,4 C-15,-4 -20,-25 -2,-30 C12,-25 10,-4 0,4" fill="#dc2626" />
                            <path d="M-3,4 C-12,-7 -15,-32 5,-34 C12,-25 8,-4 -3,4" fill="#991b1b" />
                            <path d="M3,4 C12,-7 15,-32 -5,-34 C-12,-25 -8,-4 3,4" fill="#ef4444" />
                            <circle cx="0" cy="-14" r="5" fill="#f87171" />
                        </g>

                        {/* Rose Bud 3 (Right branch tip) */}
                        <g transform="translate(15, -105) scale(0.9)">
                            <path d="M0,3 C-12,-3 -16,-20 -2,-24 C10,-20 8,-3 0,3" fill="#dc2626" />
                            <path d="M-2,3 C-10,-6 -12,-26 4,-27 C10,-20 6,-3 -2,3" fill="#991b1b" />
                            <path d="M2,3 C10,-6 12,-26 -4,-27 C-10,-20 -6,-3 2,3" fill="#ef4444" />
                            <circle cx="0" cy="-12" r="4" fill="#f87171" />
                        </g>
                    </g>
                );

            case 'Sad': // Blue Hydrangea Bush
                // Hydrangea: circular shrub filled with multiple small blue petal heads
                return (
                    <g transform={`scale(${scale})`}>
                        {/* Main trunk */}
                        <path d="M0,0 Q-4,-50 0,-85" fill="none" stroke="#16a34a" strokeWidth="4.5" strokeLinecap="round" />
                        
                        {/* Dense leafy bush backplate */}
                        <path d="M-35,-80 C-50,-100 -25,-130 0,-130 C25,-130 50,-100 35,-80 C20,-60 -20,-60 -35,-80 Z" fill="#14532d" opacity="0.95" />
                        <path d="M-25,-75 C-40,-90 -20,-115 0,-115 C20,-115 40,-90 25,-75 C15,-60 -15,-60 -25,-75 Z" fill="#15803d" opacity="0.9" />

                        {/* Hydrangea blossom head 1 (Center-top) */}
                        <g transform="translate(0, -112)">
                            <circle cx="0" cy="0" r="15" fill="#2563eb" opacity="0.85" />
                            {/* Small 4-petal flower clusters */}
                            <g transform="scale(0.85)">
                                <path d="M-6,0 L6,0 M0,-6 L0,6" stroke="#93c5fd" strokeWidth="2.5" />
                                <circle cx="0" cy="0" r="2.5" fill="#fef08a" />
                                
                                <path d="M-11,-5 L-3,-5 M-7,-9 L-7,-1" stroke="#60a5fa" strokeWidth="2" />
                                <path d="M3,-6 L11,-6 M7,-10 L7,-2" stroke="#60a5fa" strokeWidth="2" />
                                <path d="M-4,7 L4,7 M0,3 L0,11" stroke="#60a5fa" strokeWidth="2" />
                            </g>
                        </g>

                        {/* Hydrangea blossom head 2 (Left side) */}
                        <g transform="translate(-20, -92) scale(0.9)">
                            <circle cx="0" cy="0" r="14" fill="#3b82f6" opacity="0.85" />
                            <g transform="scale(0.8)">
                                <path d="M-6,0 L6,0 M0,-6 L0,6" stroke="#93c5fd" strokeWidth="2" />
                                <circle cx="0" cy="0" r="2" fill="#fef08a" />
                                <path d="M-9,-4 L-3,-4 M-6,-7 L-6,-1" stroke="#60a5fa" strokeWidth="1.8" />
                                <path d="M3,-5 L9,-5 M6,-8 L6,-2" stroke="#60a5fa" strokeWidth="1.8" />
                            </g>
                        </g>

                        {/* Hydrangea blossom head 3 (Right side) */}
                        <g transform="translate(20, -90) scale(0.95)">
                            <circle cx="0" cy="0" r="14" fill="#1d4ed8" opacity="0.85" />
                            <g transform="scale(0.8)">
                                <path d="M-6,0 L6,0 M0,-6 L0,6" stroke="#93c5fd" strokeWidth="2" />
                                <circle cx="0" cy="0" r="2" fill="#fef08a" />
                                <path d="M-9,-4 L-3,-4 M-6,-7 L-6,-1" stroke="#60a5fa" strokeWidth="1.8" />
                                <path d="M3,-5 L9,-5 M6,-8 L6,-2" stroke="#60a5fa" strokeWidth="1.8" />
                            </g>
                        </g>
                    </g>
                );

            case 'Calm': // Lavender fields
                return (
                    <g transform={`scale(${scale})`}>
                        <path d="M0,0 Q-3,-65 0,-130" fill="none" stroke="#22c55e" strokeWidth="3.5" />
                        <g transform="translate(0, -60)">
                            <ellipse cx="0" cy="-60" rx="5" ry="9" fill="#c084fc" />
                            <ellipse cx="-4" cy="-50" rx="4.5" ry="8" fill="#a855f7" />
                            <ellipse cx="4" cy="-50" rx="4.5" ry="8" fill="#a855f7" />
                            <ellipse cx="-5" cy="-32" rx="6" ry="10" fill="#c084fc" />
                            <ellipse cx="5" cy="-32" rx="6" ry="10" fill="#a855f7" />
                            <ellipse cx="-5.5" cy="-14" rx="6" ry="10" fill="#a855f7" />
                            <ellipse cx="5.5" cy="-14" rx="6" ry="10" fill="#818cf8" />
                            <ellipse cx="-6" cy="4" rx="7" ry="11" fill="#8b5cf6" />
                            <ellipse cx="6" cy="4" rx="7" ry="11" fill="#7c3aed" />
                            <ellipse cx="0" cy="-70" rx="3.5" ry="6" fill="#e9d5ff" />
                        </g>
                    </g>
                );

            case 'Excited': // Cherry Blossom
                return (
                    <g transform={`scale(${scale})`}>
                        {stemAndLeaves}
                        <g transform="translate(0, -125)">
                            {Array.from({ length: 5 }).map((_, i) => {
                                const angle = (i * 360) / 5;
                                return (
                                    <path
                                        key={i}
                                        d="M0,0 C-10,-7 -20,-24 0,-32 C20,-24 10,-7 0,0"
                                        fill="#f472b6"
                                        transform={`rotate(${angle})`}
                                    />
                                );
                            })}
                            <circle cx="0" cy="0" r="6" fill="#fef08a" stroke="#f472b6" strokeWidth="1" />
                        </g>
                    </g>
                );

            default: // White Daisy (Neutral)
                return (
                    <g transform={`scale(${scale})`}>
                        {stemAndLeaves}
                        <g transform="translate(0, -125)">
                            {Array.from({ length: 8 }).map((_, i) => {
                                const angle = (i * 360) / 8;
                                return (
                                    <ellipse
                                        key={i}
                                        cx="0"
                                        cy="-18"
                                        rx="5"
                                        ry="14"
                                        fill="#f8fafc"
                                        transform={`rotate(${angle})`}
                                        style={{ transformOrigin: '0 0' }}
                                    />
                                );
                            })}
                            <circle cx="0" cy="0" r="8" fill="#facc15" stroke="#f1f5f9" strokeWidth="0.8" />
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
        <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-light)', position: 'relative', background: '#080d1a', height: '620px' }}>
            
            {/* Scoped CSS animations for weather, intro fades, sway, and living objects */}
            <style dangerouslySetInnerHTML={{ __html: `
                /* Ambient sway animations */
                .flower-bloom-box {
                    transform-origin: bottom center;
                    animation: growBloomEffect 1.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                }
                @keyframes growBloomEffect {
                    from { transform: scale(0); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }

                .wind-sway-wrap {
                    transform-origin: bottom center;
                    animation: gentleMeadowSway 5.5s ease-in-out infinite alternate;
                }
                .wind-sway-wrap:nth-child(2n) { animation-delay: -1.2s; animation-duration: 4.8s; }
                .wind-sway-wrap:nth-child(3n) { animation-delay: -2.5s; animation-duration: 6.2s; }

                @keyframes gentleMeadowSway {
                    0% { transform: rotate(-1.5deg) skewX(-0.5deg); }
                    100% { transform: rotate(1.6deg) skewX(0.6deg); }
                }

                /* Flower interactive glow hover */
                .flower-interactive-group {
                    cursor: pointer;
                }
                .flower-interactive-group:hover {
                    filter: brightness(1.2) drop-shadow(0 0 8px rgba(255, 255, 255, 0.4));
                }

                /* Rain Drop Animations */
                @keyframes rainLineDrop {
                    0% { transform: translateY(-120px); }
                    100% { transform: translateY(620px); }
                }
                .rain-stroke {
                    stroke: #60a5fa;
                    stroke-width: 1px;
                    stroke-linecap: round;
                    animation: rainLineDrop linear infinite;
                }

                /* Drifting Sunflower Petals */
                @keyframes angryPetalDrift {
                    0% { transform: translateY(-20px) translateX(0px) rotate(0deg); opacity: 0; }
                    10% { opacity: 0.8; }
                    90% { opacity: 0.8; }
                    100% { transform: translateY(350px) translateX(-200px) rotate(270deg); opacity: 0; }
                }
                .angry-petal-element {
                    fill: #ea580c;
                    animation: angryPetalDrift linear infinite;
                }

                .petal-sway-local {
                    animation: localPetalSway 2.5s ease-in-out infinite alternate;
                }
                @keyframes localPetalSway {
                    0% { transform: translateY(0) rotate(0deg); }
                    100% { transform: translateY(2px) rotate(6deg); }
                }

                /* Butterfly Flying Path Animations */
                .butterfly-flutter-g {
                    animation: bFlutter 0.15s linear infinite alternate;
                    transform-origin: center;
                }
                @keyframes bFlutter {
                    0% { transform: scaleX(1); }
                    100% { transform: scaleX(0.25); }
                }

                .butterfly-fly-1 {
                    animation: flyRoute1 24s linear infinite;
                }
                .butterfly-fly-2 {
                    animation: flyRoute2 28s linear infinite;
                }
                @keyframes flyRoute1 {
                    0% { transform: translate(-50px, 320px) rotate(15deg); }
                    25% { transform: translate(320px, 200px) rotate(-10deg); }
                    50% { transform: translate(620px, 360px) rotate(20deg); }
                    75% { transform: translate(820px, 220px) rotate(-5deg); }
                    100% { transform: translate(1050px, 280px) rotate(10deg); }
                }
                @keyframes flyRoute2 {
                    0% { transform: translate(1050px, 380px) scaleX(-1) rotate(-10deg); }
                    33% { transform: translate(700px, 220px) scaleX(-1) rotate(15deg); }
                    66% { transform: translate(350px, 320px) scaleX(-1) rotate(-15deg); }
                    100% { transform: translate(-50px, 250px) scaleX(-1) rotate(5deg); }
                }

                /* Sunbeam Pulse animation */
                @keyframes beamPulse {
                    0% { opacity: 0.15; }
                    100% { opacity: 0.35; }
                }
                .sunbeam-polygon {
                    animation: beamPulse 4s ease-in-out infinite alternate;
                }

                /* Bee buzzing orbits */
                .bee-path-wrap {
                    animation: beeOrbit 1.8s linear infinite;
                }
                @keyframes beeOrbit {
                    0% { transform: rotate(0deg) translate(8px) rotate(0deg); }
                    100% { transform: rotate(360deg) translate(8px) rotate(-360deg); }
                }

                /* Clouds drifting animation */
                @keyframes cloudDrift {
                    0% { transform: translateX(-150px); }
                    100% { transform: translateX(1100px); }
                }
                .cloud-shape {
                    animation: cloudDrift 95s linear infinite;
                }
                .cloud-shape-slow {
                    animation: cloudDrift 140s linear infinite;
                }

                /* Intro Overlay Screens */
                .intro-overlay-backdrop {
                    position: absolute;
                    top: 0; left: 0; right: 0; bottom: 0;
                    z-index: 100;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: #fff;
                    transition: opacity 0.6s ease-out;
                    pointer-events: auto;
                }
                .intro-content-container {
                    text-align: center;
                    max-width: 600px;
                    padding: 2rem;
                    z-index: 110;
                }
                .intro-title-text {
                    font-family: var(--font-display);
                    font-size: 2.2rem;
                    font-weight: 700;
                    margin-bottom: 1.5rem;
                    line-height: 1.3;
                    text-shadow: 0 4px 12px rgba(0,0,0,0.5);
                }
                .intro-subtitle-text {
                    font-size: 1.15rem;
                    color: #e2e8f0;
                    line-height: 1.6;
                    text-shadow: 0 2px 8px rgba(0,0,0,0.4);
                }
            `}} />

            {/* Topbar Selector Inside Panel */}
            <div style={{
                position: 'absolute', top: 20, left: 20, right: 20,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                zIndex: 80
            }}>
                {/* Title */}
                <div>
                    <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: '#fff' }}>
                        Memory Garden
                    </h3>
                    <div style={{ fontSize: '0.8rem', marginTop: '0.2rem', color: '#94a3b8' }}>
                        A living emotional history of your months.
                    </div>
                </div>

                {/* Date Dropdown Select */}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <label style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Choose Archive:</label>
                    <select
                        value={selectedMonthKey}
                        onChange={(e) => setSelectedMonthKey(e.target.value)}
                        style={{
                            background: 'rgba(15, 23, 42, 0.8)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '6px',
                            padding: '0.35rem 1.8rem 0.35rem 0.65rem',
                            color: '#f8fafc',
                            fontSize: '0.82rem',
                            cursor: 'pointer',
                            outline: 'none',
                            fontFamily: 'var(--font-sans)'
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
            {introState !== 'garden' && latestMemory && (
                <div 
                    className="intro-overlay-backdrop"
                    style={{
                        opacity: introState === 'fading' ? 0 : 1,
                        background: latestMemory.mood === 'Sad' ? '#0f172a' : 
                                    latestMemory.mood === 'Angry' ? '#1c1206' : 
                                    'radial-gradient(circle at top, #0f1c3f 0%, #070913 100%)',
                        pointerEvents: introState === 'fading' ? 'none' : 'auto'
                    }}
                >
                    {/* Full screen rain effect for Sad intro */}
                    {latestMemory.mood === 'Sad' && (
                        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                            {Array.from({ length: 50 }).map((_, idx) => (
                                <line
                                    key={idx}
                                    x1={Math.random() * 1000}
                                    y1={Math.random() * -300}
                                    x2={Math.random() * 1000 - 5}
                                    y2={Math.random() * 600}
                                    className="rain-stroke"
                                    style={{
                                        animationDelay: `${Math.random() * 2}s`,
                                        animationDuration: `${0.8 + Math.random() * 0.5}s`
                                    }}
                                />
                            ))}
                        </svg>
                    )}

                    {/* Drifting petals for Angry intro */}
                    {latestMemory.mood === 'Angry' && (
                        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                            {Array.from({ length: 25 }).map((_, idx) => (
                                <path
                                    key={idx}
                                    d="M0,0 C-4,-4 -10,-10 0,-15 C10,-10 4,-4 0,0"
                                    className="angry-petal-element"
                                    style={{
                                        transform: `scale(${0.5 + Math.random() * 0.7})`,
                                        animationDelay: `${Math.random() * 6}s`,
                                        animationDuration: `${4.5 + Math.random() * 3}s`
                                    }}
                                    transform={`translate(${Math.random() * 1100}, -20)`}
                                />
                            ))}
                        </svg>
                    )}

                    {/* Sunrise overlay for standard intro */}
                    {latestMemory.mood !== 'Sad' && latestMemory.mood !== 'Angry' && (
                        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                            {/* Sunbeams */}
                            <polygon points="500,200 420,0 580,0" fill="#fef08a" className="sunbeam-polygon" opacity="0.2" />
                            <polygon points="500,200 200,0 360,0" fill="#fef08a" className="sunbeam-polygon" opacity="0.15" style={{ animationDelay: '1s' }} />
                            <polygon points="500,200 640,0 800,0" fill="#fef08a" className="sunbeam-polygon" opacity="0.15" style={{ animationDelay: '2s' }} />
                            <polygon points="500,200 0,100 0,220" fill="#fef08a" className="sunbeam-polygon" opacity="0.1" />
                            <polygon points="500,200 1000,100 1000,220" fill="#fef08a" className="sunbeam-polygon" opacity="0.1" style={{ animationDelay: '1.5s' }} />
                        </svg>
                    )}

                    {/* Text box */}
                    <div className="intro-content-container">
                        <div className="intro-title-text">
                            {latestMemory.mood === 'Sad' ? '🌧️ A Gentle Rain Falls' :
                             latestMemory.mood === 'Angry' ? '🍂 Drifted Petals' :
                             '🌅 Golden Sunlight'}
                        </div>
                        <div className="intro-subtitle-text">
                            {latestMemory.mood === 'Sad' ? (
                                `On ${formatIntroDate(latestMemory.created_at)}, you carried a heavy heart. Today, your garden remembers with a gentle rain.`
                            ) : latestMemory.mood === 'Angry' ? (
                                `On ${formatIntroDate(latestMemory.created_at)}, strong emotions shaped your garden. The wind carries a few petals away, making room for new blooms.`
                            ) : (
                                `A soft sunrise greets your garden today. Watch your emotions for the month of ${selectedMonthName} blossom.`
                            )}
                        </div>
                    </div>

                    {/* Skip Intro button */}
                    <button
                        onClick={handleEnterGarden}
                        style={{
                            position: 'absolute', bottom: 30, right: 30, zIndex: 120,
                            padding: '0.45rem 1rem', border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '20px', background: 'rgba(255,255,255,0.08)',
                            color: '#e2e8f0', fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.18)'}
                        onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.08)'}
                    >
                        Skip Intro <i className="bx bx-right-arrow-alt" style={{ verticalAlign: 'middle', marginLeft: '2px' }} />
                    </button>
                </div>
            )}

            {/* Main Interactive Garden Canvas */}
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                <svg
                    viewBox="0 0 1000 600"
                    width="100%"
                    height="100%"
                    style={{ display: 'block' }}
                >
                    {/* Sky Gradients */}
                    <defs>
                        {/* If raining (Sad memory present), overcast purple/indigo sky */}
                        {hasSadness ? (
                            <linearGradient id="sky-paint" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#1e2433" />
                                <stop offset="60%" stopColor="#2d3748" />
                                <stop offset="100%" stopColor="#4a5568" />
                            </linearGradient>
                        ) : (
                            // Clear, glorious morning dawn gradient
                            <linearGradient id="sky-paint" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#0b0f19" />
                                <stop offset="60%" stopColor="#1e293b" />
                                <stop offset="85%" stopColor="#fda4af" opacity="0.75" /> {/* rose pink dawn highlight */}
                                <stop offset="100%" stopColor="#fed7aa" opacity="0.9" /> {/* soft peach */}
                            </linearGradient>
                        )}

                        <linearGradient id="meadow-grass" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#166534" />
                            <stop offset="100%" stopColor="#0f3d20" />
                        </linearGradient>
                    </defs>

                    {/* Sky */}
                    <rect width="1000" height="420" fill="url(#sky-paint)" />

                    {/* Sun or Overcast Cloud glow */}
                    {!hasSadness ? (
                        <g>
                            <circle cx="500" cy="270" r="130" fill="#fef08a" opacity="0.12" filter="blur(12px)" />
                            <circle cx="500" cy="270" r="70" fill="#ffffff" opacity="0.3" filter="blur(3px)" />
                        </g>
                    ) : (
                        <g fill="#475569" opacity="0.6">
                            {/* Clouds */}
                            <path d="M120,80 C140,50 190,50 210,80 C230,60 270,70 280,90 C295,85 315,100 300,115 C100,115 100,90 120,80 Z" />
                            <path d="M720,70 C740,40 790,40 810,70 C830,50 870,60 880,80 C895,75 915,90 900,105 C700,105 700,80 720,70 Z" className="cloud-shape" style={{ animationDuration: '160s' }} />
                        </g>
                    )}

                    {/* Sunlight Beams (Ambient glow - clear sky only) */}
                    {!hasSadness && (
                        <g opacity="0.25">
                            <polygon points="500,270 300,0 420,0" fill="#fde047" className="sunbeam-polygon" style={{ animationDuration: '4.5s' }} />
                            <polygon points="500,270 580,0 700,0" fill="#fde047" className="sunbeam-polygon" style={{ animationDuration: '5.5s', animationDelay: '0.5s' }} />
                            <polygon points="500,270 150,0 250,0" fill="#fde047" className="sunbeam-polygon" style={{ animationDuration: '3.5s', animationDelay: '1.2s' }} />
                        </g>
                    )}

                    {/* Ambient Clouds Drifting */}
                    <g fill="#f1f5f9" opacity="0.18">
                        <path d="M30,50 C45,25 70,25 85,50 C100,35 125,40 130,55 C142,50 155,60 145,72 C30,72 30,55 30,50 Z" className="cloud-shape" />
                        <path d="M500,30 C515,5 540,5 555,30 C570,15 595,20 600,35 C612,30 625,40 615,52 C500,52 500,35 500,30 Z" className="cloud-shape-slow" />
                    </g>

                    {/* Swaying grass hills layout */}
                    <path d="M-100,420 Q150,380 400,410 Q650,440 1100,420 L1100,650 L-100,650 Z" fill="#14532d" opacity="0.8" />
                    <path d="M-100,445 Q250,425 500,455 Q750,485 1100,445 L1100,650 L-100,650 Z" fill="#166534" opacity="0.9" />
                    <path d="M-100,475 Q300,455 600,485 Q900,515 1100,475 L1100,650 L-100,650 Z" fill="url(#meadow-grass)" />

                    {/* Ambient Flying Butterflies (Living element 1) */}
                    {introState === 'garden' && (
                        <g>
                            {/* Butterfly 1 (Blue/Orange fly route 1) */}
                            <g className="butterfly-fly-1">
                                <g className="butterfly-flutter-g">
                                    <path d="M-6,-4 C-8,-10 -2,-12 0,-3 C2,-12 8,-10 6,-4 C4,2 0,0 -6,-4" fill="#60a5fa" />
                                    <path d="M-4,-3 C-6,-8 -2,-10 0,-2 C2,-10 6,-8 4,-3 C2,1 0,0 -4,-3" fill="#f97316" />
                                    <line x1="0" y1="2" x2="-2" y2="-6" stroke="#1e293b" strokeWidth="0.8" />
                                    <line x1="0" y1="2" x2="2" y2="-6" stroke="#1e293b" strokeWidth="0.8" />
                                </g>
                            </g>
                            
                            {/* Butterfly 2 (Pink/Yellow fly route 2) */}
                            <g className="butterfly-fly-2">
                                <g className="butterfly-flutter-g" style={{ animationDelay: '0.08s' }}>
                                    <path d="M-6,-4 C-8,-10 -2,-12 0,-3 C2,-12 8,-10 6,-4 C4,2 0,0 -6,-4" fill="#ec4899" />
                                    <path d="M-4,-3 C-6,-8 -2,-10 0,-2 C2,-10 6,-8 4,-3 C2,1 0,0 -4,-3" fill="#facc15" />
                                    <line x1="0" y1="2" x2="-2" y2="-6" stroke="#1e293b" strokeWidth="0.8" />
                                    <line x1="0" y1="2" x2="2" y2="-6" stroke="#1e293b" strokeWidth="0.8" />
                                </g>
                            </g>
                        </g>
                    )}

                    {/* Render Clustered Flower Beds */}
                    {positionedFlowers.map((flower) => (
                        <g
                            key={flower.memory.id}
                            transform={`translate(${flower.x}, ${flower.y})`}
                            className={`flower-bloom-box`}
                        >
                            <g className="wind-sway-wrap">
                                <g className="flower-interactive-group" onClick={() => setSelectedMemory(flower.memory)}>
                                    {renderFlowerSVG(flower.memory.mood, flower.scale)}
                                </g>

                                {/* Ambient Bees (Living element 2) - orbits near happy sunflowers and calm lavenders */}
                                {(flower.memory.mood === 'Happy' || flower.memory.mood === 'Calm') && (
                                    <g transform="translate(0, -125)" className="bee-path-wrap">
                                        <circle cx="0" cy="0" r="1.8" fill="#eab308" stroke="#1e293b" strokeWidth="0.4" />
                                        <ellipse cx="-1.5" cy="-1.5" rx="1.2" ry="0.6" fill="rgba(255,255,255,0.7)" transform="rotate(-30)" />
                                    </g>
                                )}
                            </g>
                        </g>
                    ))}

                    {/* Local Ongoing Rain over Hydrangeas Section (Sad weather) */}
                    {hasSadness && (
                        <g>
                            {hydrangeaRainDrops.map((drop) => (
                                <line
                                    key={drop.id}
                                    x1={drop.x}
                                    y1={drop.y}
                                    x2={drop.x - 3}
                                    y2={drop.y + drop.len}
                                    className="rain-stroke"
                                    style={{
                                        animationDelay: `${drop.delay}s`,
                                        animationDuration: `${drop.duration}s`,
                                        opacity: drop.opacity
                                    }}
                                />
                            ))}
                        </g>
                    )}

                    {/* Local Ongoing Petals falling over Sunflowers Section (Angry wind) */}
                    {hasAnger && (
                        <g>
                            {sunflowerDriftingPetals.map((petal) => (
                                <path
                                    key={petal.id}
                                    d="M0,0 C-3,-3 -8,-8 0,-12 C8,-8 3,-3 0,0"
                                    className="angry-petal-element"
                                    style={{
                                        transform: `scale(${petal.scale})`,
                                        animationDelay: `${petal.delay}s`,
                                        animationDuration: `${petal.duration}s`,
                                        transformOrigin: 'center center'
                                    }}
                                    transform={`translate(${petal.x}, 200)`}
                                />
                            ))}
                        </g>
                    )}
                </svg>

                {/* Floating Ground Panel Legend (Color & Bed layout) */}
                <div style={{
                    position: 'absolute', bottom: 20, left: 20,
                    display: 'flex', gap: '0.8rem', flexWrap: 'wrap',
                    background: 'rgba(15, 23, 42, 0.75)', padding: '0.5rem 0.8rem',
                    borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)',
                    fontSize: '0.72rem', color: '#f8fafc', pointerEvents: 'none'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span style={{ fontSize: '0.9rem' }}>🌻</span> Happy Bed (Sunflower Patches)
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span style={{ fontSize: '0.9rem' }}>🥀</span> Angry Bed (Distressed Sunflowers)
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span style={{ fontSize: '0.9rem' }}>🌹</span> Love Bed (Red Rose Bushes)
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span style={{ fontSize: '0.9rem' }}>🪻</span> Calm Bed (Lavender Fields)
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span style={{ fontSize: '0.9rem' }}>🪷</span> Sad Bed (Blue Hydrangea Bushes)
                    </div>
                </div>

                {/* Empty State Banner (No memories logged for selected Month) */}
                {monthlyMemories.length === 0 && (
                    <div style={{
                        position: 'absolute', top: '55%', left: '50%', transform: 'translate(-50%, -50%)',
                        background: 'rgba(15, 23, 42, 0.88)', padding: '2rem', borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.15)', color: '#f8fafc', textAlign: 'center',
                        maxWidth: '420px', zIndex: 30
                    }}>
                        <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', margin: '0 0 0.5rem 0' }}>An Empty Meadow</h4>
                        <p style={{ fontSize: '0.88rem', color: '#94a3b8', margin: '0 0 1.25rem 0', lineHeight: 1.5 }}>
                            The garden is fresh and waiting for you! Log your first memory of {selectedMonthName} {selectedYear} to watch your emotional sanctuary begin to bloom.
                        </p>
                        <button
                            className="btn btn-primary"
                            style={{ background: 'var(--accent-primary)', color: '#fff', width: '100%' }}
                            onClick={() => go && go('editor')}
                        >
                            Log a Memory ✍️
                        </button>
                    </div>
                )}

                {/* Detail Overlay Card (Clicked Flower) */}
                {selectedMemory && (
                    <div className="garden-details-panel">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#94a3b8' }}>
                                {new Date(selectedMemory.created_at).toLocaleDateString('en-US', {
                                    weekday: 'long', year: 'numeric', month: 'short', day: 'numeric'
                                })}
                            </span>
                            <button
                                onClick={() => setSelectedMemory(null)}
                                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer', padding: 0 }}
                            >
                                <i className="bx bx-x" />
                            </button>
                        </div>

                        <h4 style={{ margin: '0 0 0.4rem 0', color: '#f8fafc', fontSize: '1.15rem', fontFamily: 'var(--font-display)', lineHeight: 1.3 }}>
                            {selectedMemory.title}
                        </h4>

                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.7rem' }}>
                            <span style={{
                                background: 'rgba(255,255,255,0.08)', padding: '0.15rem 0.45rem',
                                borderRadius: '4px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.25rem'
                            }}>
                                <span>{moodMeta(selectedMemory.mood).emoji}</span>
                                <span style={{ color: moodMeta(selectedMemory.mood).color }}>{selectedMemory.mood}</span>
                            </span>
                            {selectedMemory.favorite && (
                                <span style={{
                                    background: 'rgba(251,191,36,0.15)', color: '#fbbf24',
                                    padding: '0.15rem 0.45rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600
                                }}>
                                    ⭐ Starred
                                </span>
                            )}
                        </div>

                        <p style={{
                            color: '#cbd5e1', fontSize: '0.85rem', lineHeight: 1.45,
                            margin: '0 0 1rem 0', maxHeight: '90px', overflowY: 'auto',
                            borderLeft: '2px solid rgba(255,255,255,0.1)', paddingLeft: '0.5rem'
                        }}>
                            {selectedMemory.content.replace(/<[^>]*>/g, '').slice(0, 150)}
                            {selectedMemory.content.replace(/<[^>]*>/g, '').length > 150 ? '...' : ''}
                        </p>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                            <button
                                className="btn btn-secondary"
                                style={{
                                    fontSize: '0.72rem', padding: '0.25rem 0.55rem',
                                    color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.1)',
                                    background: 'transparent'
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
