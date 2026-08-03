import React, { useRef, useState, useEffect, useCallback } from 'react';

// SVG Paper Noise Textures
const SVG_NOISE = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E")`;
const SVG_WATERCOLOR_NOISE = `url("data:image/svg+xml,%3Csvg viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.03' numOctaves='4' stitchTiles='stitch'/%3E%3CfeDiffuseLighting in='noiseFilter' lighting-color='%23fff' surfaceScale='1.5'%3E%3CfeDistantLight azimuth='45' elevation='60'/%3E%3C/feDiffuseLighting%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.12'/%3E%3C/svg%3E")`;

// Helper HSL/RGB conversion
const hslToRgb = (h, s, l) => {
    let r, g, b;
    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
};

const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
};

const rgbToHex = (r, g, b) => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

const PRESET_COLORS = ['#3b82f6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#000000', '#ffffff'];

export default function DoodleModal({ isOpen, onClose, onSave, onAutosave, existingDoodleUrl }) {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const pointsRef = useRef([]);
    const isDrawingRef = useRef(false);
    const wheelCanvasRef = useRef(null);
    const wheelCacheRef = useRef(null); // Offscreen cache canvas for color wheel

    // Brush Settings
    const [brushType, setBrushType] = useState('pen'); // pencil | pen (fountain) | marker | watercolor | crayon | eraser
    const [color, setColor] = useState('#3b82f6');
    const [brushSize, setBrushSize] = useState(6);
    const [opacity, setOpacity] = useState(1);

    // Layout & Canvas Settings
    const [paperType, setPaperType] = useState('plain'); // plain | ruled | dot | graph | vintage | coffee | handmade | watercolor
    const [gradientType, setGradientType] = useState('none'); // none | sunrise | sunset | ocean | lavender | forest | peach | cream | sky
    const [isFullScreen, setIsFullScreen] = useState(false);

    // Advanced Color Picker State
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [hue, setHue] = useState(210); // HSL values
    const [saturation, setSaturation] = useState(100);
    const [lightness, setLightness] = useState(50);
    const [rgb, setRgb] = useState({ r: 59, g: 130, b: 246 });
    const [hexInput, setHexInput] = useState('#3b82f6');
    const [recentColors, setRecentColors] = useState(['#3b82f6', '#ec4899', '#f59e0b', '#10b981']);
    const [favoriteColors, setFavoriteColors] = useState(['#ef4444', '#8b5cf6', '#000000', '#ffffff']);
    const [isDraggingWheel, setIsDraggingWheel] = useState(false);

    // Popover Toggles
    const [showPaperSettings, setShowPaperSettings] = useState(false);
    const [showBrushControls, setShowBrushControls] = useState(false);

    // History stack (Undo/Redo)
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    // Sync HSL/RGB/HEX when color changes
    const updateColorSystem = (newColorHex) => {
        setColor(newColorHex);
        setHexInput(newColorHex);
        const rgbVal = hexToRgb(newColorHex);
        if (rgbVal) {
            setRgb(rgbVal);
            // HSL calculation
            let r = rgbVal.r / 255;
            let g = rgbVal.g / 255;
            let b = rgbVal.b / 255;
            let max = Math.max(r, g, b), min = Math.min(r, g, b);
            let h, s, l = (max + min) / 2;

            if (max === min) {
                h = s = 0; // achromatic
            } else {
                let d = max - min;
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                switch (max) {
                    case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                    case g: h = (b - r) / d + 2; break;
                    case b: h = (r - g) / d + 4; break;
                    default: break;
                }
                h /= 6;
            }
            setHue(Math.round(h * 360));
            setSaturation(Math.round(s * 100));
            setLightness(Math.round(l * 100));
        }
    };

    // Save state to Undo stack
    const saveToHistory = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const stateData = canvas.toDataURL();
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(stateData);
        if (newHistory.length > 25) {
            newHistory.shift();
        }
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);

        // Autosave stroke locally and to parent
        localStorage.setItem('sd_temp_doodle', stateData);
        triggerAutosave();
    };

    // Trigger parent autosave callback
    const triggerAutosave = () => {
        const canvas = canvasRef.current;
        if (!canvas || !onAutosave) return;
        
        // Export offscreen blended image or transparent drawing for autosave
        canvas.toBlob((blob) => {
            if (blob) {
                onAutosave(blob);
            }
        }, 'image/png');
    };

    // Restore state from index
    const restoreHistoryState = (idx) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            triggerAutosave();
        };
        img.src = history[idx];
    };

    // Undo
    const handleUndo = () => {
        if (historyIndex > 0) {
            const nextIdx = historyIndex - 1;
            setHistoryIndex(nextIdx);
            restoreHistoryState(nextIdx);
        }
    };

    // Redo
    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            const nextIdx = historyIndex + 1;
            setHistoryIndex(nextIdx);
            restoreHistoryState(nextIdx);
        }
    };

    // Draw the circular color wheel onto visible canvas (using cache)
    const drawColorWheel = useCallback(() => {
        const canvas = wheelCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;
        const cx = w / 2;
        const cy = h / 2;
        const maxRadius = Math.min(cx, cy) - 3;

        // If cache doesn't exist, draw color wheel on cache canvas first
        if (!wheelCacheRef.current) {
            const cache = document.createElement('canvas');
            cache.width = w;
            cache.height = h;
            const cctx = cache.getContext('2d');
            const img = cctx.createImageData(w, h);

            for (let x = 0; x < w; x++) {
                for (let y = 0; y < h; y++) {
                    const rx = x - cx;
                    const ry = y - cy;
                    const d = Math.hypot(rx, ry);
                    if (d <= maxRadius) {
                        const angle = Math.atan2(ry, rx);
                        let hVal = (angle * 180) / Math.PI;
                        if (hVal < 0) hVal += 360;
                        const sVal = d / maxRadius;
                        const rgbColor = hslToRgb(hVal / 360, sVal, 0.5);
                        const idx = (x + y * w) * 4;
                        img.data[idx] = rgbColor.r;
                        img.data[idx+1] = rgbColor.g;
                        img.data[idx+2] = rgbColor.b;
                        img.data[idx+3] = 255;
                    }
                }
            }
            cctx.putImageData(img, 0, 0);
            wheelCacheRef.current = cache;
        }

        // Draw cached color wheel
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(wheelCacheRef.current, 0, 0);

        // Draw target picker marker
        const angle = (hue * Math.PI) / 180;
        const r = (saturation / 100) * maxRadius;
        const mx = cx + Math.cos(angle) * r;
        const my = cy + Math.sin(angle) * r;

        ctx.save();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = 'rgba(0,0,0,0.4)';
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.arc(mx, my, 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
    }, [hue, saturation]);

    // Sync color wheel rendering when HSL state changes
    useEffect(() => {
        if (showColorPicker) {
            drawColorWheel();
        }
    }, [showColorPicker, drawColorWheel]);

    // Handle interaction on Color Wheel
    const handleWheelInteraction = (e) => {
        const canvas = wheelCanvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const x = clientX - rect.left - rect.width / 2;
        const y = clientY - rect.top - rect.height / 2;
        const r = rect.width / 2 - 3;
        const d = Math.hypot(x, y);

        let h = (Math.atan2(y, x) * 180) / Math.PI;
        if (h < 0) h += 360;
        const s = Math.min(Math.round((d / r) * 100), 100);

        handleHslChange(Math.round(h), s, lightness);
    };

    // Load initial draw canvas
    useEffect(() => {
        if (!isOpen) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        canvas.width = 1200;
        canvas.height = 800;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Load drawing
        if (existingDoodleUrl) {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                const initialData = canvas.toDataURL();
                setHistory([initialData]);
                setHistoryIndex(0);
            };
            img.src = existingDoodleUrl;
        } else {
            // Check temp recovery
            const temp = localStorage.getItem('sd_temp_doodle');
            if (temp) {
                const img = new Image();
                img.onload = () => {
                    ctx.drawImage(img, 0, 0);
                    setHistory([temp]);
                    setHistoryIndex(0);
                };
                img.src = temp;
            } else {
                const initialData = canvas.toDataURL();
                setHistory([initialData]);
                setHistoryIndex(0);
            }
        }

        // Reset settings
        setShowColorPicker(false);
        setShowPaperSettings(false);
        setShowBrushControls(false);
        setIsFullScreen(false);
    }, [isOpen, existingDoodleUrl]);

    // Color studio updates
    const handleHslChange = (h, s, l) => {
        setHue(h);
        setSaturation(s);
        setLightness(l);
        
        // Convert to RGB
        let hNorm = h / 360, sNorm = s / 100, lNorm = l / 100;
        let r, g, b;
        if (sNorm === 0) {
            r = g = b = lNorm;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            const q = lNorm < 0.5 ? lNorm * (1 + sNorm) : lNorm + sNorm - lNorm * sNorm;
            const p = 2 * lNorm - q;
            r = hue2rgb(p, q, hNorm + 1/3);
            g = hue2rgb(p, q, hNorm);
            b = hue2rgb(p, q, hNorm - 1/3);
        }
        const rgbVal = {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
        setRgb(rgbVal);
        const hex = rgbToHex(rgbVal.r, rgbVal.g, rgbVal.b);
        setColor(hex);
        setHexInput(hex);
    };

    const handleHexInput = (val) => {
        setHexInput(val);
        if (/^#[0-9A-F]{6}$/i.test(val)) {
            updateColorSystem(val);
        }
    };

    const addFavoriteColor = () => {
        if (!favoriteColors.includes(color)) {
            setFavoriteColors([color, ...favoriteColors.slice(0, 7)]);
        }
    };

    const addRecentColor = (c) => {
        if (c === '#ffffff' || c === '#000000') return;
        const filtered = recentColors.filter(x => x !== c);
        setRecentColors([c, ...filtered.slice(0, 3)]);
    };

    // Draw segment
    const drawSegment = (ctx, p1, p2) => {
        ctx.save();

        if (brushType === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.strokeStyle = 'rgba(0,0,0,1)';
            ctx.lineWidth = brushSize * 2.5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
            ctx.restore();
            return;
        }

        ctx.globalCompositeOperation = 'source-over';

        const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        const steps = Math.max(Math.floor(dist / 1.5), 1);

        switch (brushType) {
            case 'pencil':
                ctx.fillStyle = color;
                for (let i = 0; i <= steps; i++) {
                    const t = i / steps;
                    const cx = p1.x + (p2.x - p1.x) * t;
                    const cy = p1.y + (p2.y - p1.y) * t;

                    ctx.globalAlpha = opacity * 0.42;
                    ctx.beginPath();
                    ctx.arc(cx, cy, brushSize / 2, 0, Math.PI * 2);
                    ctx.fill();

                    // Lead grain noise
                    const grains = Math.ceil(brushSize * 0.7);
                    for (let j = 0; j < grains; j++) {
                        const nx = cx + (Math.random() - 0.5) * brushSize * 2.2;
                        const ny = cy + (Math.random() - 0.5) * brushSize * 2.2;
                        ctx.globalAlpha = opacity * Math.random() * 0.22;
                        ctx.fillRect(nx, ny, 1, 1);
                    }
                }
                break;

            case 'pen': {
                // fountain calligraphic pen
                const angle = -Math.PI / 4;
                const rad = brushSize * 0.65;
                const dx = Math.cos(angle) * rad;
                const dy = Math.sin(angle) * rad;

                ctx.fillStyle = color;
                ctx.globalAlpha = opacity;
                ctx.beginPath();
                ctx.moveTo(p1.x - dx, p1.y - dy);
                ctx.lineTo(p1.x + dx, p1.y + dy);
                ctx.lineTo(p2.x + dx, p2.y + dy);
                ctx.lineTo(p2.x - dx, p2.y - dy);
                ctx.closePath();
                ctx.fill();
                break;
            }

            case 'marker':
                ctx.strokeStyle = color;
                ctx.lineWidth = brushSize * 2.2;
                ctx.lineCap = 'square';
                ctx.lineJoin = 'miter';
                ctx.globalAlpha = opacity * 0.35;
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
                break;

            case 'watercolor':
                ctx.globalAlpha = opacity * 0.055;
                const rgbVal = hexToRgb(color) || { r: 59, g: 130, b: 246 };
                const edgeColor = `rgba(${rgbVal.r}, ${rgbVal.g}, ${rgbVal.b}, 0.28)`;

                for (let i = 0; i <= steps; i++) {
                    const t = i / steps;
                    const cx = p1.x + (p2.x - p1.x) * t;
                    const cy = p1.y + (p2.y - p1.y) * t;

                    const grad = ctx.createRadialGradient(cx, cy, brushSize * 0.15, cx, cy, brushSize * 1.5);
                    grad.addColorStop(0, color);
                    grad.addColorStop(0.85, edgeColor); // dried watercolor paint ring outline
                    grad.addColorStop(1, 'rgba(255,255,255,0)');

                    ctx.fillStyle = grad;
                    ctx.beginPath();
                    ctx.arc(cx, cy, brushSize * 1.5, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;

            case 'crayon':
                ctx.fillStyle = color;
                for (let i = 0; i <= steps; i++) {
                    const t = i / steps;
                    const cx = p1.x + (p2.x - p1.x) * t;
                    const cy = p1.y + (p2.y - p1.y) * t;

                    const density = Math.max(Math.floor(brushSize * 1.3), 5);
                    for (let j = 0; j < density; j++) {
                        const offsetAngle = Math.random() * Math.PI * 2;
                        const offsetRadius = Math.random() * (brushSize * 0.55);
                        const px = cx + Math.cos(offsetAngle) * offsetRadius;
                        const py = cy + Math.sin(offsetAngle) * offsetRadius;
                        ctx.globalAlpha = opacity * (Math.random() * 0.45);
                        ctx.fillRect(px, py, 1.5 + Math.random(), 1.5 + Math.random());
                    }
                }
                break;
            default:
                break;
        }

        ctx.restore();
    };

    const startDrawing = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (clientX - rect.left) * scaleX;
        const y = (clientY - rect.top) * scaleY;

        isDrawingRef.current = true;
        pointsRef.current = [{ x, y }];

        const ctx = canvas.getContext('2d');
        drawSegment(ctx, { x, y }, { x: x + 0.1, y: y + 0.1 });
    };

    const draw = (e) => {
        if (!isDrawingRef.current) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (clientX - rect.left) * scaleX;
        const y = (clientY - rect.top) * scaleY;

        const pts = pointsRef.current;
        pts.push({ x, y });

        const ctx = canvas.getContext('2d');
        if (pts.length >= 2) {
            drawSegment(ctx, pts[pts.length - 2], pts[pts.length - 1]);
        }
    };

    const stopDrawing = () => {
        if (isDrawingRef.current) {
            isDrawingRef.current = false;
            pointsRef.current = [];
            addRecentColor(color);
            saveToHistory();
        }
    };

    const clearCanvas = () => {
        if (!confirm('Clear all drawings on the page?')) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        saveToHistory();
    };

    const handleSave = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Clean temp recovery
        localStorage.removeItem('sd_temp_doodle');

        // Create temporary canvas to blend paper background + drawings
        const offscreen = document.createElement('canvas');
        offscreen.width = canvas.width;
        offscreen.height = canvas.height;
        const octx = offscreen.getContext('2d');

        // 1. Solid / Gradient fill
        if (gradientType && gradientType !== 'none') {
            const grad = octx.createLinearGradient(0, 0, 0, offscreen.height);
            const stops = {
                sunrise: ['#ff9a9e', '#fecfef'],
                sunset: ['#f43f5e', '#8b5cf6'],
                ocean: ['#e0f2fe', '#bae6fd'],
                lavender: ['#ebd5ff', '#faf5ff'],
                forest: ['#dcfce7', '#bbf7d0'],
                peach: ['#ffedd5', '#faf5ff'],
                cream: ['#fdfbf7', '#f5f5f4'],
                sky: ['#bae6fd', '#ffffff']
            }[gradientType];
            if (stops) {
                grad.addColorStop(0, stops[0]);
                grad.addColorStop(1, stops[1]);
                octx.fillStyle = grad;
            } else {
                octx.fillStyle = '#faf6ee';
            }
        } else {
            const colors = {
                plain: '#faf6ee',
                ruled: '#faf6ee',
                dot: '#faf6ee',
                graph: '#faf6ee',
                vintage: '#ebdcb9',
                coffee: '#e5d4b3',
                handmade: '#eedebd',
                watercolor: '#f7f5f0'
            };
            octx.fillStyle = colors[paperType] || '#faf6ee';
        }
        octx.fillRect(0, 0, offscreen.width, offscreen.height);

        // 2. Coffee stains
        if (paperType === 'coffee') {
            octx.save();
            let grad = octx.createRadialGradient(offscreen.width * 0.75, offscreen.height * 0.25, 0, offscreen.width * 0.75, offscreen.height * 0.25, 300);
            grad.addColorStop(0, 'rgba(94, 60, 27, 0.08)');
            grad.addColorStop(1, 'rgba(94, 60, 27, 0)');
            octx.fillStyle = grad;
            octx.beginPath();
            octx.arc(offscreen.width * 0.75, offscreen.height * 0.25, 300, 0, Math.PI * 2);
            octx.fill();

            octx.strokeStyle = 'rgba(94, 60, 27, 0.08)';
            octx.lineWidth = 4;
            octx.beginPath();
            octx.arc(offscreen.width * 0.3, offscreen.height * 0.6, 120, 0, Math.PI * 2);
            octx.stroke();
            octx.restore();
        }

        // 3. Grid lines
        if (paperType === 'ruled') {
            octx.save();
            octx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
            octx.lineWidth = 1;
            for (let y = 40; y < offscreen.height; y += 28) {
                octx.beginPath();
                octx.moveTo(0, y);
                octx.lineTo(offscreen.width, y);
                octx.stroke();
            }
            octx.strokeStyle = 'rgba(239, 68, 68, 0.15)';
            octx.lineWidth = 2;
            octx.beginPath();
            octx.moveTo(80, 0);
            octx.lineTo(80, offscreen.height);
            octx.stroke();
            octx.restore();
        } else if (paperType === 'dot') {
            octx.save();
            octx.fillStyle = 'rgba(0, 0, 0, 0.12)';
            for (let x = 24; x < offscreen.width; x += 24) {
                for (let y = 24; y < offscreen.height; y += 24) {
                    octx.beginPath();
                    octx.arc(x, y, 1.2, 0, Math.PI * 2);
                    octx.fill();
                }
            }
            octx.restore();
        } else if (paperType === 'graph') {
            octx.save();
            octx.strokeStyle = 'rgba(0, 0, 0, 0.04)';
            octx.lineWidth = 1;
            for (let x = 20; x < offscreen.width; x += 20) {
                octx.beginPath();
                octx.moveTo(x, 0);
                octx.lineTo(x, offscreen.height);
                octx.stroke();
            }
            for (let y = 20; y < offscreen.height; y += 20) {
                octx.beginPath();
                octx.moveTo(0, y);
                octx.lineTo(offscreen.width, y);
                octx.stroke();
            }
            octx.restore();
        }

        // 4. Noise texture
        octx.save();
        const pCanvas = document.createElement('canvas');
        pCanvas.width = 120;
        pCanvas.height = 120;
        const pctx = pCanvas.getContext('2d');
        const pimg = pctx.createImageData(120, 120);
        const opacityVal = paperType === 'watercolor' ? 24 : 14;
        for (let i = 0; i < pimg.data.length; i += 4) {
            const val = Math.floor(Math.random() * 255);
            pimg.data[i] = val;
            pimg.data[i+1] = val;
            pimg.data[i+2] = val;
            pimg.data[i+3] = Math.floor(Math.random() * opacityVal);
        }
        pctx.putImageData(pimg, 0, 0);
        const pattern = octx.createPattern(pCanvas, 'repeat');
        octx.fillStyle = pattern;
        octx.fillRect(0, 0, offscreen.width, offscreen.height);
        octx.restore();

        // 5. Draw drawings
        octx.drawImage(canvas, 0, 0);

        offscreen.toBlob((blob) => {
            if (blob) {
                onSave(blob);
                onClose();
            }
        }, 'image/png');
    };

    // Close sketchbook & clear recovery
    const handleClose = () => {
        if (confirm('Discard changes and close sketchbook?')) {
            localStorage.removeItem('sd_temp_doodle');
            onClose();
        }
    };

    if (!isOpen) return null;

    const getBackgroundStyle = () => {
        if (gradientType && gradientType !== 'none') {
            const gradients = {
                sunrise: 'linear-gradient(to bottom, #ff9a9e, #fecfef)',
                sunset: 'linear-gradient(to bottom, #f43f5e, #8b5cf6)',
                ocean: 'linear-gradient(to bottom, #e0f2fe, #bae6fd)',
                lavender: 'linear-gradient(to bottom, #ebd5ff, #faf5ff)',
                forest: 'linear-gradient(to bottom, #dcfce7, #bbf7d0)',
                peach: 'linear-gradient(to bottom, #ffedd5, #faf5ff)',
                cream: 'linear-gradient(to bottom, #fdfbf7, #f5f5f4)',
                sky: 'linear-gradient(to bottom, #bae6fd, #ffffff)'
            };
            return {
                backgroundImage: `${SVG_NOISE}, ${gradients[gradientType] || 'none'}`,
                backgroundBlendMode: 'multiply'
            };
        }

        const baseNoise = paperType === 'watercolor' ? SVG_WATERCOLOR_NOISE : SVG_NOISE;
        switch (paperType) {
            case 'plain':
                return { backgroundColor: '#faf6ee', backgroundImage: baseNoise };
            case 'ruled':
                return {
                    backgroundColor: '#faf6ee',
                    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.05) 1px, transparent 1px), linear-gradient(90deg, transparent 60px, rgba(239, 68, 68, 0.15) 60px, rgba(239, 68, 68, 0.15) 62px, transparent 62px), ${baseNoise}`,
                    backgroundSize: '100% 28px, 100% 100%, 100% 100%'
                };
            case 'dot':
                return {
                    backgroundColor: '#faf6ee',
                    backgroundImage: `radial-gradient(rgba(0, 0, 0, 0.08) 1.2px, transparent 1.2px), ${baseNoise}`,
                    backgroundSize: '24px 24px, 100% 100%'
                };
            case 'graph':
                return {
                    backgroundColor: '#faf6ee',
                    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.04) 1px, transparent 1px), ${baseNoise}`,
                    backgroundSize: '20px 20px, 20px 20px, 100% 100%'
                };
            case 'vintage':
                return {
                    backgroundColor: '#ebdcb9',
                    backgroundImage: `radial-gradient(circle, transparent 30%, rgba(0, 0, 0, 0.15) 100%), ${baseNoise}`,
                    backgroundBlendMode: 'multiply'
                };
            case 'coffee':
                return {
                    backgroundColor: '#e5d4b3',
                    backgroundImage: `radial-gradient(circle at 75% 25%, rgba(94, 60, 27, 0.1) 0%, rgba(94, 60, 27, 0.03) 40%, transparent 70%), radial-gradient(circle at 20% 80%, rgba(94, 60, 27, 0.12) 0%, rgba(94, 60, 27, 0.04) 30%, transparent 60%), radial-gradient(circle at 50% 50%, transparent 120px, rgba(94, 60, 27, 0.08) 122px, rgba(94, 60, 27, 0.02) 130px, transparent 140px), ${baseNoise}`
                };
            case 'handmade':
                return {
                    backgroundColor: '#eedebd',
                    backgroundImage: `repeating-linear-gradient(45deg, rgba(0, 0, 0, 0.02) 0px, rgba(0, 0, 0, 0.02) 2px, transparent 2px, transparent 10px), ${baseNoise}`
                };
            case 'watercolor':
                return {
                    backgroundColor: '#f7f5f0',
                    backgroundImage: baseNoise
                };
            default:
                return { backgroundColor: '#faf6ee', backgroundImage: baseNoise };
        }
    };

    const getThumbnailStyle = (pType, gType) => {
        if (gType && gType !== 'none') {
            const gradients = {
                sunrise: 'linear-gradient(to bottom, #ff9a9e, #fecfef)',
                sunset: 'linear-gradient(to bottom, #f43f5e, #8b5cf6)',
                ocean: 'linear-gradient(to bottom, #e0f2fe, #bae6fd)',
                lavender: 'linear-gradient(to bottom, #ebd5ff, #faf5ff)',
                forest: 'linear-gradient(to bottom, #dcfce7, #bbf7d0)',
                peach: 'linear-gradient(to bottom, #ffedd5, #faf5ff)',
                sky: 'linear-gradient(to bottom, #bae6fd, #ffffff)'
            };
            return {
                backgroundImage: `${SVG_NOISE}, ${gradients[gType] || 'none'}`,
                backgroundSize: 'cover'
            };
        }

        switch (pType) {
            case 'plain':
                return { backgroundColor: '#faf6ee', backgroundImage: SVG_NOISE };
            case 'ruled':
                return {
                    backgroundColor: '#faf6ee',
                    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.05) 1px, transparent 1px), ${SVG_NOISE}`,
                    backgroundSize: '100% 6px, 100% 100%'
                };
            case 'dot':
                return {
                    backgroundColor: '#faf6ee',
                    backgroundImage: `radial-gradient(rgba(0, 0, 0, 0.15) 0.5px, transparent 0.5px), ${SVG_NOISE}`,
                    backgroundSize: '6px 6px, 100% 100%'
                };
            case 'graph':
                return {
                    backgroundColor: '#faf6ee',
                    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.05) 1px, transparent 1px), ${SVG_NOISE}`,
                    backgroundSize: '5px 5px, 5px 5px, 100% 100%'
                };
            case 'vintage':
                return {
                    backgroundColor: '#ebdcb9',
                    backgroundImage: SVG_NOISE
                };
            case 'coffee':
                return {
                    backgroundColor: '#e5d4b3',
                    backgroundImage: `radial-gradient(circle at 50% 50%, rgba(94, 60, 27, 0.12) 0%, rgba(94, 60, 27, 0.03) 60%, transparent 80%), ${SVG_NOISE}`
                };
            case 'handmade':
                return {
                    backgroundColor: '#eedebd',
                    backgroundImage: `repeating-linear-gradient(45deg, rgba(0, 0, 0, 0.02) 0px, rgba(0, 0, 0, 0.02) 2px, transparent 2px, transparent 10px), ${SVG_NOISE}`
                };
            case 'watercolor':
                return {
                    backgroundColor: '#f7f5f0',
                    backgroundImage: SVG_WATERCOLOR_NOISE
                };
            default:
                return { backgroundColor: '#faf6ee' };
        }
    };

    return (
        <div 
            ref={containerRef}
            className={`sketchbook-overlay ${isFullScreen ? 'fullscreen' : ''}`}
            style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                backgroundColor: 'rgba(12, 10, 9, 0.92)',
                backdropFilter: 'blur(12px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: isFullScreen ? '0' : '2rem',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
        >
            {/* Sketchbook Container */}
            <div 
                className="sketchbook-notebook"
                style={{
                    background: 'linear-gradient(135deg, #231c19, #120e0d)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: isFullScreen ? '0' : '1.5rem',
                    width: '100%',
                    height: '100%',
                    maxWidth: isFullScreen ? '100vw' : '980px',
                    maxHeight: isFullScreen ? '100vh' : '700px',
                    boxShadow: '0 35px 90px rgba(0, 0, 0, 0.75)',
                    display: 'flex', flexDirection: 'column',
                    overflow: 'hidden',
                    position: 'relative'
                }}
            >
                {/* Header bar */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '0.85rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)',
                    background: 'rgba(0,0,0,0.25)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '1.25rem' }}>🎨</span>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#eae6e2', fontFamily: 'var(--font-sans)' }}>
                            Digital Sketchbook Studio
                        </h3>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <button
                            onClick={() => setIsFullScreen(!isFullScreen)}
                            title={isFullScreen ? "Exit Full Screen" : "Expand Canvas"}
                            style={{
                                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                color: '#eae6e2', width: '32px', height: '32px', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <i className={`bx ${isFullScreen ? 'bx-fullscreen-exit' : 'bx-fullscreen'}`} style={{ fontSize: '1.1rem' }} />
                        </button>
                        <button
                            onClick={handleClose}
                            style={{
                                background: 'none', border: 'none', color: '#a8a29e',
                                fontSize: '1.4rem', cursor: 'pointer', padding: '0.25rem'
                            }}
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Drawing Workspace with desk background */}
                <div style={{
                    flex: 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: '#0a0807', 
                    padding: '1.5rem',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    {/* Spiral bound notebook coils */}
                    {isFullScreen && (
                        <div style={{
                            position: 'absolute', left: 'calc(50% - 475px)',
                            top: '8%', bottom: '8%', width: '15px', zIndex: 10,
                            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                            pointerEvents: 'none'
                        }}>
                            {Array.from({ length: 18 }).map((_, i) => (
                                <div key={i} style={{
                                    width: '32px', height: '12px',
                                    background: 'linear-gradient(to right, #57534e, #d6d3d1, #292524)',
                                    borderRadius: '6px',
                                    border: '1px solid #1c1917',
                                    boxShadow: '0 5px 8px rgba(0,0,0,0.45)'
                                }} />
                            ))}
                        </div>
                    )}

                    {/* Paper sheet container */}
                    <div 
                        className="notebook-page"
                        style={{
                            ...getBackgroundStyle(),
                            width: '100%',
                            height: '100%',
                            aspectRatio: '3/2',
                            maxHeight: '100%',
                            maxWidth: isFullScreen ? '95%' : '90%',
                            borderRadius: '0.75rem 1.5rem 1.5rem 0.75rem',
                            boxShadow: '15px 15px 40px rgba(0, 0, 0, 0.7), inset -1px -1px 8px rgba(0,0,0,0.05)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            position: 'relative',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            border: '1px solid rgba(0,0,0,0.12)'
                        }}
                    >
                        <canvas
                            ref={canvasRef}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            onTouchStart={startDrawing}
                            onTouchMove={draw}
                            onTouchEnd={stopDrawing}
                            style={{
                                cursor: brushType === 'eraser' ? 'cell' : 'crosshair',
                                touchAction: 'none',
                                width: '100%',
                                height: '100%',
                                borderRadius: 'inherit'
                            }}
                        />
                    </div>
                </div>

                {/* Floating Glassmorphism Toolbar */}
                <div style={{
                    position: 'absolute', bottom: '1.5rem', left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(24, 20, 18, 0.85)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '1.5rem',
                    padding: '0.65rem 1.25rem',
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    boxShadow: '0 15px 50px rgba(0,0,0,0.6)',
                    zIndex: 100,
                    maxWidth: '92vw',
                    flexWrap: 'wrap',
                    justifyContent: 'center'
                }}>
                    {/* Brushes selection group */}
                    <div style={{ display: 'flex', gap: '0.35rem', borderRight: '1px solid rgba(255,255,255,0.1)', paddingRight: '0.75rem' }}>
                        {[
                            { key: 'pencil', icon: '📝', label: 'Pencil' },
                            { key: 'pen', icon: '🖋️', label: 'Fountain Pen' },
                            { key: 'marker', icon: '🖍️', label: 'Marker' },
                            { key: 'watercolor', icon: '🖌️', label: 'Watercolor' },
                            { key: 'crayon', icon: '🎨', label: 'Crayon' }
                        ].map((b) => (
                            <button
                                key={b.key}
                                onClick={() => setBrushType(b.key)}
                                title={b.label}
                                style={{
                                    width: '38px', height: '38px', borderRadius: '0.75rem',
                                    border: 'none',
                                    background: brushType === b.key ? 'rgba(255,255,255,0.12)' : 'transparent',
                                    fontSize: '1.3rem', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.15s'
                                }}
                            >
                                {b.icon}
                            </button>
                        ))}
                        
                        {/* Eraser Utility button */}
                        <button
                            onClick={() => setBrushType('eraser')}
                            title="Eraser"
                            style={{
                                width: '38px', height: '38px', borderRadius: '0.75rem',
                                border: 'none',
                                background: brushType === 'eraser' ? 'rgba(255,255,255,0.12)' : 'transparent',
                                fontSize: '1.3rem', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all 0.15s'
                            }}
                        >
                            🧽
                        </button>
                    </div>

                    {/* Active Color Preview & Color Picker Button */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button
                            onClick={() => {
                                setShowColorPicker(!showColorPicker);
                                setShowPaperSettings(false);
                                setShowBrushControls(false);
                            }}
                            title="Color wheel & settings"
                            style={{
                                width: '30px', height: '30px', borderRadius: '50%',
                                background: brushType === 'eraser' ? '#ffffff' : color,
                                border: '2.5px solid #ffffff',
                                cursor: 'pointer',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                                position: 'relative',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'transform 0.15s ease'
                            }}
                        >
                            {brushType === 'eraser' ? '❌' : ''}
                        </button>
                        
                        {/* Quick Presets (4 colors) */}
                        <div style={{ display: 'flex', gap: '0.3rem' }}>
                            {PRESET_COLORS.slice(0, 4).map((c) => (
                                <button
                                    key={c}
                                    onClick={() => {
                                        updateColorSystem(c);
                                        if (brushType === 'eraser') setBrushType('pen');
                                    }}
                                    style={{
                                        width: '18px', height: '18px', borderRadius: '50%',
                                        backgroundColor: c,
                                        border: color === c ? '1.5px solid #ffffff' : '1px solid rgba(255,255,255,0.2)',
                                        cursor: 'pointer'
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Brush controls trigger */}
                    <button
                        onClick={() => {
                            setShowBrushControls(!showBrushControls);
                            setShowColorPicker(false);
                            setShowPaperSettings(false);
                        }}
                        style={{
                            padding: '0.45rem 0.85rem', borderRadius: '0.75rem',
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: showBrushControls ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
                            color: '#eae6e2', fontSize: '0.82rem', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '0.35rem',
                            fontFamily: 'var(--font-sans)'
                        }}
                    >
                        ⚙️ size ({brushSize}px)
                    </button>

                    {/* Paper templates trigger */}
                    <button
                        onClick={() => {
                            setShowPaperSettings(!showPaperSettings);
                            setShowColorPicker(false);
                            setShowBrushControls(false);
                        }}
                        style={{
                            padding: '0.45rem 0.85rem', borderRadius: '0.75rem',
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: showPaperSettings ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
                            color: '#eae6e2', fontSize: '0.82rem', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '0.35rem',
                            fontFamily: 'var(--font-sans)'
                        }}
                    >
                        📄 templates
                    </button>

                    {/* Undo/Redo */}
                    <div style={{ display: 'flex', gap: '0.15rem', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '0.4rem' }}>
                        <button
                            onClick={handleUndo}
                            disabled={historyIndex <= 0}
                            title="Undo Stroke"
                            style={{
                                width: '32px', height: '32px', borderRadius: '0.5rem',
                                border: 'none', background: 'transparent',
                                color: historyIndex > 0 ? '#eae6e2' : 'rgba(255,255,255,0.25)',
                                cursor: historyIndex > 0 ? 'pointer' : 'not-allowed',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                        >
                            <i className="bx bx-undo" style={{ fontSize: '1.3rem' }} />
                        </button>
                        <button
                            onClick={handleRedo}
                            disabled={historyIndex >= history.length - 1}
                            title="Redo Stroke"
                            style={{
                                width: '32px', height: '32px', borderRadius: '0.5rem',
                                border: 'none', background: 'transparent',
                                color: historyIndex < history.length - 1 ? '#eae6e2' : 'rgba(255,255,255,0.25)',
                                cursor: historyIndex < history.length - 1 ? 'pointer' : 'not-allowed',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                        >
                            <i className="bx bx-redo" style={{ fontSize: '1.3rem' }} />
                        </button>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '0.35rem', marginLeft: '0.5rem' }}>
                        <button
                            onClick={clearCanvas}
                            style={{
                                padding: '0.45rem 0.85rem', borderRadius: '0.75rem',
                                border: 'none', background: 'rgba(239, 68, 68, 0.18)',
                                color: '#fca5a5', fontSize: '0.82rem', cursor: 'pointer',
                                fontFamily: 'var(--font-sans)'
                            }}
                        >
                            Clear
                        </button>
                        <button
                            onClick={handleSave}
                            style={{
                                padding: '0.45rem 1.2rem', borderRadius: '0.75rem',
                                border: 'none',
                                background: 'linear-gradient(135deg, #ca8a04, #a16207)',
                                color: '#ffffff',
                                fontSize: '0.82rem', fontWeight: 600,
                                cursor: 'pointer',
                                fontFamily: 'var(--font-sans)'
                            }}
                        >
                            Save
                        </button>
                    </div>

                    {/* --- ADVANCED COLOR PICKER POPOVER --- */}
                    {showColorPicker && (
                        <div style={{
                            position: 'absolute', bottom: '4.5rem', left: '5%',
                            background: '#1e1a18', border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '1.25rem', padding: '1rem', width: '280px',
                            boxShadow: '0 15px 45px rgba(0,0,0,0.6)',
                            display: 'flex', flexDirection: 'column', gap: '0.85rem',
                            zIndex: 101
                        }}>
                            <div className="between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.4rem' }}>
                                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#e7e5e4' }}>Color Studio</span>
                                <button onClick={addFavoriteColor} style={{ background: 'none', border: 'none', color: '#fbbf24', cursor: 'pointer', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                    ⭐ Star Color
                                </button>
                            </div>

                            {/* Circular Canvas Color Wheel */}
                            <div style={{ display: 'flex', justifyContent: 'center', margin: '0.25rem 0' }}>
                                <canvas
                                    ref={wheelCanvasRef}
                                    width={140}
                                    height={140}
                                    style={{ borderRadius: '50%', cursor: 'crosshair', touchAction: 'none' }}
                                    onMouseDown={(e) => { setIsDraggingWheel(true); handleWheelInteraction(e); }}
                                    onMouseMove={(e) => { if (isDraggingWheel) handleWheelInteraction(e); }}
                                    onMouseUp={() => setIsDraggingWheel(false)}
                                    onMouseLeave={() => setIsDraggingWheel(false)}
                                    onTouchStart={(e) => { setIsDraggingWheel(true); handleWheelInteraction(e); }}
                                    onTouchMove={(e) => { if (isDraggingWheel) handleWheelInteraction(e); }}
                                    onTouchEnd={() => setIsDraggingWheel(false)}
                                />
                            </div>

                            {/* Brightness slider */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.72rem', color: '#a8a29e', marginBottom: '0.25rem' }}>Brightness: {lightness}%</label>
                                <input
                                    type="range" min="5" max="95" value={lightness}
                                    onChange={(e) => handleHslChange(hue, saturation, Number(e.target.value))}
                                    style={{
                                        width: '100%', height: '8px', borderRadius: '4px',
                                        background: `linear-gradient(to right, #000, hsl(${hue}, ${saturation}%, 50%), #fff)`,
                                        appearance: 'none', outline: 'none', cursor: 'pointer'
                                    }}
                                />
                            </div>

                            {/* HEX & RGB Controls */}
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '0.65rem', color: '#78716c' }}>Hex Code</label>
                                    <input
                                        type="text" value={hexInput}
                                        onChange={(e) => handleHexInput(e.target.value)}
                                        style={{
                                            width: '100%', background: '#120e0d', border: '1px solid rgba(255,255,255,0.08)',
                                            borderRadius: '0.35rem', padding: '0.25rem 0.5rem', color: '#eae6e2',
                                            fontSize: '0.78rem', fontFamily: 'monospace'
                                        }}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '0.15rem', flexDirection: 'column', fontSize: '0.65rem', color: '#a8a29e', fontFamily: 'monospace' }}>
                                    <span>R: {rgb.r}</span>
                                    <span>G: {rgb.g}</span>
                                    <span>B: {rgb.b}</span>
                                </div>
                            </div>

                            {/* Favorites List */}
                            <div>
                                <span style={{ display: 'block', fontSize: '0.72rem', color: '#a8a29e', marginBottom: '0.25rem' }}>Starred Palette</span>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                                    {favoriteColors.map((c, i) => (
                                        <button
                                            key={i} onClick={() => updateColorSystem(c)}
                                            style={{
                                                width: '20px', height: '20px', borderRadius: '5px',
                                                backgroundColor: c, border: '1px solid rgba(255,255,255,0.15)',
                                                cursor: 'pointer'
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Recent List */}
                            <div>
                                <span style={{ display: 'block', fontSize: '0.72rem', color: '#a8a29e', marginBottom: '0.25rem' }}>Recent colors</span>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                                    {recentColors.map((c, i) => (
                                        <button
                                            key={i} onClick={() => updateColorSystem(c)}
                                            style={{
                                                width: '20px', height: '20px', borderRadius: '5px',
                                                backgroundColor: c, border: '1px solid rgba(255,255,255,0.15)',
                                                cursor: 'pointer'
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- BRUSH CONTROLS POPOVER --- */}
                    {showBrushControls && (
                        <div style={{
                            position: 'absolute', bottom: '4.5rem', left: '35%',
                            background: '#1e1a18', border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '1.25rem', padding: '1rem', width: '220px',
                            boxShadow: '0 15px 45px rgba(0,0,0,0.6)',
                            display: 'flex', flexDirection: 'column', gap: '0.75rem',
                            zIndex: 101
                        }}>
                            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#e7e5e4', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.25rem' }}>
                                Ink & Width Controls
                            </span>

                            <div>
                                <div className="between" style={{ fontSize: '0.72rem', color: '#a8a29e', marginBottom: '0.25rem' }}>
                                    <span>Size</span>
                                    <span>{brushSize}px</span>
                                </div>
                                <input
                                    type="range" min="1" max="60" value={brushSize}
                                    onChange={(e) => setBrushSize(Number(e.target.value))}
                                    style={{ width: '100%', cursor: 'pointer' }}
                                />
                            </div>

                            <div>
                                <div className="between" style={{ fontSize: '0.72rem', color: '#a8a29e', marginBottom: '0.25rem' }}>
                                    <span>Ink Flow</span>
                                    <span>{Math.round(opacity * 100)}%</span>
                                </div>
                                <input
                                    type="range" min="5" max="100" value={opacity * 100}
                                    onChange={(e) => setOpacity(Number(e.target.value) / 100)}
                                    style={{ width: '100%', cursor: 'pointer' }}
                                />
                            </div>

                            <div style={{ marginTop: '0.25rem' }}>
                                <span style={{ display: 'block', fontSize: '0.68rem', color: '#78716c', marginBottom: '0.25rem' }}>Nib Preview</span>
                                <div style={{
                                    height: '42px', background: '#120e0d', borderRadius: '0.5rem',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    border: '1px solid rgba(255,255,255,0.05)'
                                }}>
                                    <div style={{
                                        width: `${brushSize}px`,
                                        height: `${brushSize}px`,
                                        borderRadius: brushType === 'marker' ? '0' : '50%',
                                        background: color,
                                        opacity: opacity,
                                        boxShadow: '0 0 5px rgba(0,0,0,0.5)'
                                    }} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- PAPER TEMPLATES POPOVER --- */}
                    {showPaperSettings && (
                        <div style={{
                            position: 'absolute', bottom: '4.5rem', right: '5%',
                            background: '#1e1a18', border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '1.25rem', padding: '1rem', width: '310px',
                            boxShadow: '0 15px 45px rgba(0,0,0,0.6)',
                            display: 'flex', flexDirection: 'column', gap: '0.85rem',
                            maxHeight: '400px', overflowY: 'auto',
                            zIndex: 101
                        }}>
                            <div>
                                <span style={{ display: 'block', color: '#d6d3d1', fontSize: '0.8rem', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.25rem', marginBottom: '0.6rem' }}>
                                    Notebook Paper Templates
                                </span>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                                    {[
                                        { key: 'plain', label: 'Plain' },
                                        { key: 'ruled', label: 'Ruled' },
                                        { key: 'dot', label: 'Dot Grid' },
                                        { key: 'graph', label: 'Graph' },
                                        { key: 'vintage', label: 'Vintage' },
                                        { key: 'coffee', label: 'Coffee' },
                                        { key: 'handmade', label: 'Handmade' },
                                        { key: 'watercolor', label: 'Watercolor' }
                                    ].map((p) => (
                                        <button
                                            key={p.key}
                                            onClick={() => {
                                                setPaperType(p.key);
                                                setGradientType('none');
                                            }}
                                            title={p.label}
                                            style={{
                                                background: 'transparent', border: 'none', cursor: 'pointer',
                                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem',
                                                padding: '0.2rem'
                                            }}
                                        >
                                            <div style={{
                                                width: '52px', height: '38px', borderRadius: '4px',
                                                ...getThumbnailStyle(p.key, 'none'),
                                                border: paperType === p.key && gradientType === 'none' ? '2.5px solid #ca8a04' : '1px solid rgba(255,255,255,0.2)',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                                                boxSizing: 'border-box'
                                            }} />
                                            <span style={{ fontSize: '0.6rem', color: paperType === p.key && gradientType === 'none' ? '#ca8a04' : '#a8a29e', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', width: '100%', textAlign: 'center' }}>
                                                {p.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <span style={{ display: 'block', color: '#d6d3d1', fontSize: '0.8rem', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.25rem', marginBottom: '0.6rem' }}>
                                    Stationery Gradients
                                </span>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                                    {[
                                        { key: 'none', label: 'None' },
                                        { key: 'sunrise', label: 'Sunrise' },
                                        { key: 'sunset', label: 'Sunset' },
                                        { key: 'ocean', label: 'Ocean' },
                                        { key: 'lavender', label: 'Lavender' },
                                        { key: 'forest', label: 'Forest' },
                                        { key: 'peach', label: 'Peach' },
                                        { key: 'sky', label: 'Sky' }
                                    ].map((g) => (
                                        <button
                                            key={g.key}
                                            onClick={() => setGradientType(g.key)}
                                            title={g.label}
                                            style={{
                                                background: 'transparent', border: 'none', cursor: 'pointer',
                                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem',
                                                padding: '0.2rem'
                                            }}
                                        >
                                            <div style={{
                                                width: '52px', height: '38px', borderRadius: '4px',
                                                ...getThumbnailStyle('plain', g.key),
                                                border: gradientType === g.key ? '2.5px solid #ca8a04' : '1px solid rgba(255,255,255,0.2)',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                                                boxSizing: 'border-box'
                                            }} />
                                            <span style={{ fontSize: '0.6rem', color: gradientType === g.key ? '#ca8a04' : '#a8a29e', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', width: '100%', textAlign: 'center' }}>
                                                {g.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            <style>{`
                .sketchbook-overlay input[type="range"] {
                    accent-color: #ca8a04;
                }
                .sketchbook-notebook .between {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .fullscreen .notebook-page {
                    transform: rotate(0deg) !important;
                    max-width: 95% !important;
                    aspect-ratio: 3/2 !important;
                }
            `}</style>
        </div>
    );
}
