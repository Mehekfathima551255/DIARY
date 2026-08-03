import React, { useRef, useState, useEffect } from 'react';

// SVG Paper Noise Textures
const SVG_NOISE = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E")`;
const SVG_WATERCOLOR_NOISE = `url("data:image/svg+xml,%3Csvg viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.03' numOctaves='4' stitchTiles='stitch'/%3E%3CfeDiffuseLighting in='noiseFilter' lighting-color='%23fff' surfaceScale='1.5'%3E%3CfeDistantLight azimuth='45' elevation='60'/%3E%3C/feDiffuseLighting%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.12'/%3E%3C/svg%3E")`;

// Helper: Hex to RGB
const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
};

// Helper: RGB to Hex
const rgbToHex = (r, g, b) => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

// Preset colors
const PRESET_COLORS = ['#3b82f6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#000000', '#ffffff'];

export default function DoodleModal({ isOpen, onClose, onSave, existingDoodleUrl }) {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const pointsRef = useRef([]);
    const isDrawingRef = useRef(false);

    // Brush Settings
    const [brushType, setBrushType] = useState('pen'); // pencil | pen | fountain | marker | watercolor | crayon | calligraphy | eraser
    const [color, setColor] = useState('#3b82f6');
    const [brushSize, setBrushSize] = useState(6);
    const [opacity, setOpacity] = useState(1);

    // Layout & Canvas Settings
    const [paperType, setPaperType] = useState('plain'); // plain | ruled | dot | graph | vintage | coffee | handmade | watercolor
    const [gradientType, setGradientType] = useState('none'); // none | sunrise | sunset | ocean | lavender | forest | peach | cream | sky
    const [isFullScreen, setIsFullScreen] = useState(false);

    // Advanced Color Picker State
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [hue, setHue] = useState(210); // HSL hue
    const [saturation, setSaturation] = useState(100);
    const [lightness, setLightness] = useState(50);
    const [rgb, setRgb] = useState({ r: 59, g: 130, b: 246 });
    const [hexInput, setHexInput] = useState('#3b82f6');
    const [recentColors, setRecentColors] = useState(['#3b82f6', '#ec4899', '#f59e0b', '#10b981']);
    const [favoriteColors, setFavoriteColors] = useState(['#ef4444', '#8b5cf6', '#000000', '#ffffff']);

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
            // Rough HSL calculation
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
        // Limit history to 20 states
        if (newHistory.length > 20) {
            newHistory.shift();
        }
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
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

    // Initialize/Load Canvas
    useEffect(() => {
        if (!isOpen) return;
        
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        
        // Reset canvas dimensions to standard 1200x800 high res
        canvas.width = 1200;
        canvas.height = 800;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Load existing doodle
        if (existingDoodleUrl) {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                // Seed initial history
                const initialData = canvas.toDataURL();
                setHistory([initialData]);
                setHistoryIndex(0);
            };
            img.src = existingDoodleUrl;
        } else {
            // Seed blank initial state
            const initialData = canvas.toDataURL();
            setHistory([initialData]);
            setHistoryIndex(0);
        }

        // Reset toggles
        setShowColorPicker(false);
        setShowPaperSettings(false);
        setShowBrushControls(false);
        setIsFullScreen(false);
    }, [isOpen, existingDoodleUrl]);

    // Handle Color Picker Slider Updates
    const handleHslChange = (h, s, l) => {
        setHue(h);
        setSaturation(s);
        setLightness(l);
        // Calculate RGB
        h /= 360; s /= 100; l /= 100;
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
            const nextFavs = [color, ...favoriteColors.slice(0, 7)];
            setFavoriteColors(nextFavs);
        }
    };

    const addRecentColor = (c) => {
        if (c === '#ffffff' || c === '#000000') return;
        const filtered = recentColors.filter(x => x !== c);
        setRecentColors([c, ...filtered.slice(0, 3)]);
    };

    // Draw segment function
    const drawSegment = (ctx, p1, p2) => {
        ctx.save();
        
        // Handle eraser
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
        
        // Base interpolation for textured brushes
        const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        const steps = Math.max(Math.floor(dist / 1.5), 1);

        switch (brushType) {
            case 'pencil':
                ctx.fillStyle = color;
                // Multiple overlapping thin graphite marks
                for (let i = 0; i <= steps; i++) {
                    const t = i / steps;
                    const cx = p1.x + (p2.x - p1.x) * t;
                    const cy = p1.y + (p2.y - p1.y) * t;
                    
                    ctx.globalAlpha = opacity * 0.4;
                    ctx.beginPath();
                    ctx.arc(cx, cy, brushSize / 2, 0, Math.PI * 2);
                    ctx.fill();

                    // Lead noise
                    const noisePoints = Math.ceil(brushSize * 0.8);
                    for (let j = 0; j < noisePoints; j++) {
                        const nx = cx + (Math.random() - 0.5) * brushSize * 2;
                        const ny = cy + (Math.random() - 0.5) * brushSize * 2;
                        ctx.globalAlpha = opacity * Math.random() * 0.25;
                        ctx.fillRect(nx, ny, 1, 1);
                    }
                }
                break;

            case 'pen':
                // Classic smooth gel/ink pen
                ctx.strokeStyle = color;
                ctx.lineWidth = brushSize;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.globalAlpha = opacity;
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
                break;

            case 'fountain': {
                // Angled nib calligraphy/fountain pen
                const angle = -Math.PI / 4; // -45 deg
                const rad = brushSize * 0.6;
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
                // Flat transparent highlight marker
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
                // Radial soft bleed gradient along path
                ctx.globalAlpha = opacity * 0.06;
                const rgbVal = hexToRgb(color) || { r: 59, g: 130, b: 246 };
                const edgeColor = `rgba(${rgbVal.r}, ${rgbVal.g}, ${rgbVal.b}, 0.28)`;
                
                for (let i = 0; i <= steps; i++) {
                    const t = i / steps;
                    const cx = p1.x + (p2.x - p1.x) * t;
                    const cy = p1.y + (p2.y - p1.y) * t;

                    const grad = ctx.createRadialGradient(cx, cy, brushSize * 0.15, cx, cy, brushSize * 1.6);
                    grad.addColorStop(0, color);
                    grad.addColorStop(0.85, edgeColor); // watercolor dark bleed edge
                    grad.addColorStop(1, 'rgba(255,255,255,0)');

                    ctx.fillStyle = grad;
                    ctx.beginPath();
                    ctx.arc(cx, cy, brushSize * 1.6, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;

            case 'crayon':
                // Textured waxy crayon
                ctx.fillStyle = color;
                for (let i = 0; i <= steps; i++) {
                    const t = i / steps;
                    const cx = p1.x + (p2.x - p1.x) * t;
                    const cy = p1.y + (p2.y - p1.y) * t;

                    const density = Math.max(Math.floor(brushSize * 1.3), 6);
                    for (let j = 0; j < density; j++) {
                        const offsetAngle = Math.random() * Math.PI * 2;
                        const offsetRadius = Math.random() * (brushSize * 0.6);
                        const px = cx + Math.cos(offsetAngle) * offsetRadius;
                        const py = cy + Math.sin(offsetAngle) * offsetRadius;
                        ctx.globalAlpha = opacity * (Math.random() * 0.45);
                        ctx.fillRect(px, py, 1.5 + Math.random(), 1.5 + Math.random());
                    }
                }
                break;

            case 'calligraphy': {
                // Elegant broad flat ribbon nib
                const angle = -Math.PI / 6; // -30 deg
                const rad = brushSize * 1.1;
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
            default:
                break;
        }

        ctx.restore();
    };

    // Begin drawing stroke
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

        // Draw simple dot for click/taps
        const ctx = canvas.getContext('2d');
        drawSegment(ctx, { x, y }, { x: x + 0.1, y: y + 0.1 });
    };

    // Incremental drawing with smooth midpoint curves
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
        
        // Draw last segment
        if (pts.length >= 2) {
            const p1 = pts[pts.length - 2];
            const p2 = pts[pts.length - 1];
            drawSegment(ctx, p1, p2);
        }
    };

    // Stroke complete
    const stopDrawing = () => {
        if (isDrawingRef.current) {
            isDrawingRef.current = false;
            pointsRef.current = [];
            addRecentColor(color);
            saveToHistory();
        }
    };

    // Clear Canvas Drawing
    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        saveToHistory();
    };

    // Generate offscreen combined image (Background + Drawing)
    const handleSave = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Create temporary offscreen canvas to merge background texture + drawings
        const offscreen = document.createElement('canvas');
        offscreen.width = canvas.width;
        offscreen.height = canvas.height;
        const octx = offscreen.getContext('2d');

        // Draw Paper styles & textures onto offscreen
        // 1. Solid / Gradient background fill
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

        // 2. Draw Coffee Stains
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

        // 3. Draw Paper lines/grid overlays
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

        // 4. Fill noise pattern to match screen texture
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

        // 5. Draw transparent doodles on top of background
        octx.drawImage(canvas, 0, 0);

        // Export blob
        offscreen.toBlob((blob) => {
            if (blob) {
                onSave(blob);
                onClose();
            }
        }, 'image/png');
    };

    if (!isOpen) return null;

    // Get current background CSS based on selection
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

    const hasDrawn = historyIndex > 0;

    return (
        <div 
            ref={containerRef}
            className={`sketchbook-overlay ${isFullScreen ? 'fullscreen' : ''}`}
            style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                backgroundColor: 'rgba(15, 12, 10, 0.88)',
                backdropFilter: 'blur(12px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: isFullScreen ? '0' : '1.5rem',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
        >
            {/* Sketchbook Container */}
            <div 
                className="sketchbook-notebook"
                style={{
                    background: 'linear-gradient(135deg, #2b231f, #1b1513)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: isFullScreen ? '0' : '1.5rem',
                    width: '100%',
                    height: '100%',
                    maxWidth: isFullScreen ? '100vw' : '980px',
                    maxHeight: isFullScreen ? '100vh' : '680px',
                    boxShadow: '0 30px 80px rgba(0, 0, 0, 0.7)',
                    display: 'flex', flexDirection: 'column',
                    overflow: 'hidden',
                    position: 'relative'
                }}
            >
                {/* Header bar */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '0.85rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)',
                    background: 'rgba(0,0,0,0.2)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '1.25rem' }}>📒</span>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#f5f5f4', fontFamily: 'var(--font-display)' }}>
                            Digital Sketchbook
                        </h3>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <button
                            onClick={() => setIsFullScreen(!isFullScreen)}
                            title={isFullScreen ? "Exit Fullscreen" : "Fullscreen Mode"}
                            style={{
                                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                color: '#d6d3d1', width: '32px', height: '32px', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <i className={`bx ${isFullScreen ? 'bx-fullscreen-exit' : 'bx-fullscreen'}`} style={{ fontSize: '1.1rem' }} />
                        </button>
                        <button
                            onClick={onClose}
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
                    background: '#14110f', // deep warm desk wood dark background
                    padding: '1.5rem',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    {/* Ring binding coils (Simulates physical junk journal) */}
                    <div style={{
                        position: 'absolute', left: isFullScreen ? 'calc(50% - 470px)' : '2rem',
                        top: '10%', bottom: '10%', width: '15px', zIndex: 10,
                        display: isFullScreen ? 'flex' : 'none',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        pointerEvents: 'none'
                    }}>
                        {Array.from({ length: 15 }).map((_, i) => (
                            <div key={i} style={{
                                width: '32px', height: '10px',
                                background: 'linear-gradient(to right, #78716c, #e7e5e4, #44403c)',
                                borderRadius: '5px',
                                border: '1px solid #1c1917',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.4)',
                                transform: 'translateX(-8px)'
                            }} />
                        ))}
                    </div>

                    {/* Paper sheet */}
                    <div 
                        className="notebook-page"
                        style={{
                            ...getBackgroundStyle(),
                            width: '100%',
                            height: '100%',
                            aspectRatio: '3/2',
                            maxHeight: '100%',
                            maxWidth: '90%',
                            borderRadius: '0.5rem 1.25rem 1.25rem 0.5rem',
                            boxShadow: '10px 10px 30px rgba(0, 0, 0, 0.6), inset -2px -2px 10px rgba(0,0,0,0.05)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            position: 'relative',
                            transition: 'all 0.25s ease',
                            border: '1px solid rgba(0,0,0,0.1)'
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
                    background: 'rgba(28, 25, 23, 0.85)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '1.5rem',
                    padding: '0.65rem 1.25rem',
                    display: 'flex', alignItems: 'center', gap: '0.85rem',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                    zIndex: 100,
                    maxWidth: '90vw',
                    flexWrap: 'wrap',
                    justifyContent: 'center'
                }}>
                    {/* Brushes selection group */}
                    <div style={{ display: 'flex', gap: '0.35rem', borderRight: '1px solid rgba(255,255,255,0.1)', paddingRight: '0.75rem' }}>
                        {[
                            { key: 'pencil', icon: '📝', label: 'Pencil' },
                            { key: 'pen', icon: '🖋️', label: 'Gel Pen' },
                            { key: 'fountain', icon: '✒️', label: 'Fountain' },
                            { key: 'marker', icon: '🖍️', label: 'Marker' },
                            { key: 'watercolor', icon: '🎨', label: 'Watercolor' },
                            { key: 'crayon', icon: '✏️', label: 'Crayon' },
                            { key: 'calligraphy', icon: '✍️', label: 'Calligraphy' },
                            { key: 'eraser', icon: '🧽', label: 'Eraser' }
                        ].map((b) => (
                            <button
                                key={b.key}
                                onClick={() => setBrushType(b.key)}
                                title={b.label}
                                style={{
                                    width: '34px', height: '34px', borderRadius: '0.5rem',
                                    border: 'none',
                                    background: brushType === b.key ? 'rgba(255,255,255,0.15)' : 'transparent',
                                    fontSize: '1.25rem', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.15s'
                                }}
                            >
                                {b.icon}
                            </button>
                        ))}
                    </div>

                    {/* Active Color Preview / Open Color Picker */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button
                            onClick={() => {
                                setShowColorPicker(!showColorPicker);
                                setShowPaperSettings(false);
                                setShowBrushControls(false);
                            }}
                            title="Advanced Color Picker"
                            style={{
                                width: '30px', height: '30px', borderRadius: '50%',
                                background: brushType === 'eraser' ? '#ffffff' : color,
                                border: '2px solid #ffffff',
                                cursor: 'pointer',
                                boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
                                position: 'relative',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                        >
                            {brushType === 'eraser' ? '❌' : ''}
                        </button>
                        
                        {/* Quick Presets */}
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
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

                    {/* Size and Opacity Controls Trigger */}
                    <button
                        onClick={() => {
                            setShowBrushControls(!showBrushControls);
                            setShowColorPicker(false);
                            setShowPaperSettings(false);
                        }}
                        title="Brush Controls"
                        style={{
                            padding: '0.4rem 0.75rem', borderRadius: '0.75rem',
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: showBrushControls ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)',
                            color: '#e7e5e4', fontSize: '0.85rem', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '0.35rem'
                        }}
                    >
                        ⚙️ Brush ({brushSize}px)
                    </button>

                    {/* Paper settings trigger */}
                    <button
                        onClick={() => {
                            setShowPaperSettings(!showPaperSettings);
                            setShowColorPicker(false);
                            setShowBrushControls(false);
                        }}
                        title="Paper & Canvas settings"
                        style={{
                            padding: '0.4rem 0.75rem', borderRadius: '0.75rem',
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: showPaperSettings ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)',
                            color: '#e7e5e4', fontSize: '0.85rem', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '0.35rem'
                        }}
                    >
                        📄 Paper / Grad
                    </button>

                    {/* Undo/Redo Group */}
                    <div style={{ display: 'flex', gap: '0.25rem', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '0.5rem' }}>
                        <button
                            onClick={handleUndo}
                            disabled={historyIndex <= 0}
                            title="Undo"
                            style={{
                                width: '32px', height: '32px', borderRadius: '0.5rem',
                                border: 'none', background: 'transparent',
                                color: historyIndex > 0 ? '#e7e5e4' : 'rgba(255,255,255,0.25)',
                                cursor: historyIndex > 0 ? 'pointer' : 'not-allowed',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                        >
                            <i className="bx bx-undo" style={{ fontSize: '1.25rem' }} />
                        </button>
                        <button
                            onClick={handleRedo}
                            disabled={historyIndex >= history.length - 1}
                            title="Redo"
                            style={{
                                width: '32px', height: '32px', borderRadius: '0.5rem',
                                border: 'none', background: 'transparent',
                                color: historyIndex < history.length - 1 ? '#e7e5e4' : 'rgba(255,255,255,0.25)',
                                cursor: historyIndex < history.length - 1 ? 'pointer' : 'not-allowed',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                        >
                            <i className="bx bx-redo" style={{ fontSize: '1.25rem' }} />
                        </button>
                    </div>

                    {/* Actions Group */}
                    <div style={{ display: 'flex', gap: '0.35rem', marginLeft: '0.5rem' }}>
                        <button
                            onClick={clearCanvas}
                            title="Clear Paper"
                            style={{
                                padding: '0.4rem 0.75rem', borderRadius: '0.75rem',
                                border: 'none', background: 'rgba(239, 68, 68, 0.2)',
                                color: '#fca5a5', fontSize: '0.85rem', cursor: 'pointer'
                            }}
                        >
                            🗑️ Clear
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!hasDrawn}
                            style={{
                                padding: '0.4rem 1.1rem', borderRadius: '0.75rem',
                                border: 'none',
                                background: hasDrawn ? 'linear-gradient(135deg, #d97706, #b45309)' : 'rgba(255,255,255,0.05)',
                                color: hasDrawn ? '#ffffff' : 'rgba(255,255,255,0.3)',
                                fontSize: '0.85rem', fontWeight: 600,
                                cursor: hasDrawn ? 'pointer' : 'not-allowed'
                            }}
                        >
                            Save
                        </button>
                    </div>

                    {/* --- COLOR PICKER POPOVER --- */}
                    {showColorPicker && (
                        <div style={{
                            position: 'absolute', bottom: '4.5rem', left: '10%',
                            background: '#24201e', border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '1rem', padding: '1rem', width: '280px',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                            display: 'flex', flexDirection: 'column', gap: '0.75rem'
                        }}>
                            <div className="between" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#e7e5e4' }}>Color Studio</span>
                                <button onClick={addFavoriteColor} style={{ background: 'none', border: 'none', color: '#fbbf24', cursor: 'pointer', fontSize: '0.9rem' }}>
                                    ⭐️ Favorite
                                </button>
                            </div>

                            {/* Hue gradient slider */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: '#a8a29e', marginBottom: '0.25rem' }}>Hue: {hue}°</label>
                                <input
                                    type="range" min="0" max="360" value={hue}
                                    onChange={(e) => handleHslChange(Number(e.target.value), saturation, lightness)}
                                    style={{
                                        width: '100%', height: '10px', borderRadius: '5px',
                                        background: 'linear-gradient(to right, red, yellow, lime, cyan, blue, magenta, red)',
                                        appearance: 'none', outline: 'none', cursor: 'pointer'
                                    }}
                                />
                            </div>

                            {/* Saturation slider */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: '#a8a29e', marginBottom: '0.25rem' }}>Saturation: {saturation}%</label>
                                <input
                                    type="range" min="0" max="100" value={saturation}
                                    onChange={(e) => handleHslChange(hue, Number(e.target.value), lightness)}
                                    style={{
                                        width: '100%', height: '8px', borderRadius: '4px',
                                        background: `linear-gradient(to right, #808080, hsl(${hue}, 100%, 50%))`,
                                        appearance: 'none', outline: 'none', cursor: 'pointer'
                                    }}
                                />
                            </div>

                            {/* Lightness slider */}
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: '#a8a29e', marginBottom: '0.25rem' }}>Brightness: {lightness}%</label>
                                <input
                                    type="range" min="0" max="100" value={lightness}
                                    onChange={(e) => handleHslChange(hue, saturation, Number(e.target.value))}
                                    style={{
                                        width: '100%', height: '8px', borderRadius: '4px',
                                        background: `linear-gradient(to right, #000000, hsl(${hue}, ${saturation}%, 50%), #ffffff)`,
                                        appearance: 'none', outline: 'none', cursor: 'pointer'
                                    }}
                                />
                            </div>

                            {/* RGB Readout / HEX Input */}
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: '0.7rem', color: '#78716c' }}>Hex Code</label>
                                    <input
                                        type="text" value={hexInput}
                                        onChange={(e) => handleHexInput(e.target.value)}
                                        placeholder="#ffffff"
                                        style={{
                                            width: '100%', background: '#1c1917', border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '0.35rem', padding: '0.25rem 0.5rem', color: '#f5f5f4',
                                            fontSize: '0.8rem', fontFamily: 'monospace'
                                        }}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '0.2' + 'rem', flexDirection: 'column', fontSize: '0.65rem', color: '#a8a29e' }}>
                                    <span>R: {rgb.r}</span>
                                    <span>G: {rgb.g}</span>
                                    <span>B: {rgb.b}</span>
                                </div>
                            </div>

                            {/* Favorites Grid */}
                            <div>
                                <span style={{ display: 'block', fontSize: '0.75rem', color: '#a8a29e', marginBottom: '0.25rem' }}>Starred Colors</span>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                                    {favoriteColors.map((c, i) => (
                                        <button
                                            key={i} onClick={() => updateColorSystem(c)}
                                            style={{
                                                width: '20px', height: '20px', borderRadius: '4px',
                                                backgroundColor: c, border: '1px solid rgba(255,255,255,0.2)',
                                                cursor: 'pointer'
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Recents Grid */}
                            <div>
                                <span style={{ display: 'block', fontSize: '0.75rem', color: '#a8a29e', marginBottom: '0.25rem' }}>Recent Palette</span>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                                    {recentColors.map((c, i) => (
                                        <button
                                            key={i} onClick={() => updateColorSystem(c)}
                                            style={{
                                                width: '20px', height: '20px', borderRadius: '4px',
                                                backgroundColor: c, border: '1px solid rgba(255,255,255,0.2)',
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
                            position: 'absolute', bottom: '4.5rem', left: '40%',
                            background: '#24201e', border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '1rem', padding: '1rem', width: '220px',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                            display: 'flex', flexDirection: 'column', gap: '0.75rem'
                        }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#e7e5e4', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.25rem' }}>
                                Nib & Ink Controls
                            </span>

                            {/* Size Slider */}
                            <div>
                                <div className="between" style={{ fontSize: '0.75rem', color: '#a8a29e', marginBottom: '0.25rem' }}>
                                    <span>Thickness</span>
                                    <span>{brushSize}px</span>
                                </div>
                                <input
                                    type="range" min="1" max="60" value={brushSize}
                                    onChange={(e) => setBrushSize(Number(e.target.value))}
                                    style={{ width: '100%', accentColor: '#fb923c', cursor: 'pointer' }}
                                />
                            </div>

                            {/* Opacity Slider */}
                            <div>
                                <div className="between" style={{ fontSize: '0.75rem', color: '#a8a29e', marginBottom: '0.25rem' }}>
                                    <span>Flow / Transparency</span>
                                    <span>{Math.round(opacity * 100)}%</span>
                                </div>
                                <input
                                    type="range" min="1" max="100" value={opacity * 100}
                                    onChange={(e) => setOpacity(Number(e.target.value) / 100)}
                                    style={{ width: '100%', accentColor: '#fb923c', cursor: 'pointer' }}
                                />
                            </div>

                            {/* Live Stroke Preview */}
                            <div style={{ marginTop: '0.25rem' }}>
                                <span style={{ display: 'block', fontSize: '0.7rem', color: '#78716c', marginBottom: '0.25rem' }}>Live Preview</span>
                                <div style={{
                                    height: '40px', background: '#1c1917', borderRadius: '0.5rem',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)'
                                }}>
                                    <div style={{
                                        width: `${brushSize}px`,
                                        height: `${brushSize}px`,
                                        borderRadius: brushType === 'marker' ? '0' : '50%',
                                        background: color,
                                        opacity: opacity,
                                        boxShadow: '0 0 4px rgba(0,0,0,0.5)',
                                        transition: 'all 0.15s ease'
                                    }} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- PAPER SETTINGS POPOVER --- */}
                    {showPaperSettings && (
                        <div style={{
                            position: 'absolute', bottom: '4.5rem', right: '10%',
                            background: '#24201e', border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '1rem', padding: '1rem', width: '280px',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                            display: 'flex', flexDirection: 'column', gap: '0.85rem'
                        }}>
                            <div>
                                <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#e7e5e4', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.25rem', marginBottom: '0.5rem' }}>
                                    Paper Background Styles
                                </span>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.4rem' }}>
                                    {[
                                        { key: 'plain', label: 'Plain Sheet' },
                                        { key: 'ruled', label: 'Ruled Pad' },
                                        { key: 'dot', label: 'Dot Grid' },
                                        { key: 'graph', label: 'Graph Paper' },
                                        { key: 'vintage', label: 'Vintage Sepia' },
                                        { key: 'coffee', label: 'Coffee Stain' },
                                        { key: 'handmade', label: 'Handmade' },
                                        { key: 'watercolor', label: 'Watercolor' }
                                    ].map((p) => (
                                        <button
                                            key={p.key}
                                            onClick={() => {
                                                setPaperType(p.key);
                                                setGradientType('none');
                                            }}
                                            style={{
                                                padding: '0.4rem 0.5rem', fontSize: '0.75rem', borderRadius: '0.5rem',
                                                border: paperType === p.key && gradientType === 'none' ? '1.5px solid #fb923c' : '1px solid rgba(255,255,255,0.08)',
                                                background: paperType === p.key && gradientType === 'none' ? 'rgba(251,146,60,0.1)' : 'rgba(255,255,255,0.03)',
                                                color: paperType === p.key && gradientType === 'none' ? '#fb923c' : '#d6d3d1',
                                                cursor: 'pointer', textAlign: 'left'
                                            }}
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#e7e5e4', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.25rem', marginBottom: '0.5rem' }}>
                                    Luxury Ink Gradients
                                </span>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.4rem' }}>
                                    {[
                                        { key: 'none', label: 'No Gradient' },
                                        { key: 'sunrise', label: 'Sunrise Pink' },
                                        { key: 'sunset', label: 'Sunset Glow' },
                                        { key: 'ocean', label: 'Ocean Mist' },
                                        { key: 'lavender', label: 'Lavender Fields' },
                                        { key: 'forest', label: 'Forest Moss' },
                                        { key: 'peach', label: 'Peach Cream' },
                                        { key: 'sky', label: 'Sky Blue' }
                                    ].map((g) => (
                                        <button
                                            key={g.key}
                                            onClick={() => setGradientType(g.key)}
                                            style={{
                                                padding: '0.4rem 0.5rem', fontSize: '0.75rem', borderRadius: '0.5rem',
                                                border: gradientType === g.key ? '1.5px solid #fb923c' : '1px solid rgba(255,255,255,0.08)',
                                                background: gradientType === g.key ? 'rgba(251,146,60,0.1)' : 'rgba(255,255,255,0.03)',
                                                color: gradientType === g.key ? '#fb923c' : '#d6d3d1',
                                                cursor: 'pointer', textAlign: 'left'
                                            }}
                                        >
                                            {g.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Custom Range Styles */}
            <style>{`
                .sketchbook-overlay input[type="range"] {
                    accent-color: #fb923c;
                }
                .sketchbook-notebook .between {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                /* Desk details */
                .fullscreen .notebook-page {
                    transform: rotate(0deg) !important;
                }
            `}</style>
        </div>
    );
}
