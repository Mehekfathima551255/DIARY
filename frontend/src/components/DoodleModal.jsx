import React, { useRef, useState, useEffect } from 'react';

export default function DoodleModal({ isOpen, onClose, onSave, existingDoodleUrl }) {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#6366f1');
    const [brushSize, setBrushSize] = useState(4);
    const [hasDrawn, setHasDrawn] = useState(false);

    const colors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ffffff', '#000000'];

    useEffect(() => {
        if (!isOpen) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        
        // Fill canvas with semi-transparent dark background
        ctx.fillStyle = '#1e1b4b';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (existingDoodleUrl) {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                setHasDrawn(true);
            };
            img.src = existingDoodleUrl;
        } else {
            setHasDrawn(false);
        }
    }, [isOpen, existingDoodleUrl]);

    if (!isOpen) return null;

    const startDrawing = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        ctx.beginPath();
        ctx.moveTo(clientX - rect.left, clientY - rect.top);
        ctx.strokeStyle = color;
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        setIsDrawing(true);
        setHasDrawn(true);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        ctx.lineTo(clientX - rect.left, clientY - rect.top);
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#1e1b4b';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        setHasDrawn(false);
    };

    const handleSave = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.toBlob((blob) => {
            if (blob) {
                onSave(blob);
                onClose();
            }
        }, 'image/png');
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
            <div style={{
                background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.95), rgba(15, 23, 42, 0.95))',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '1.25rem',
                padding: '1.5rem',
                maxWidth: '520px',
                width: '100%',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
                display: 'flex', flexDirection: 'column', gap: '1rem'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#f8fafc' }}>
                        🎨 Quick Doodle
                    </h3>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '1.25rem', cursor: 'pointer' }}
                    >
                        ✕
                    </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <canvas
                        ref={canvasRef}
                        width={460}
                        height={300}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        style={{
                            borderRadius: '0.75rem',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            cursor: 'crosshair',
                            touchAction: 'none',
                            width: '100%',
                            maxWidth: '460px',
                            height: 'auto',
                            aspectRatio: '460 / 300'
                        }}
                    />
                </div>

                {/* Toolbar */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between' }}>
                    {/* Colors */}
                    <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                        {colors.map((c) => (
                            <button
                                key={c}
                                onClick={() => setColor(c)}
                                style={{
                                    width: '24px', height: '24px', borderRadius: '50%',
                                    backgroundColor: c,
                                    border: color === c ? '2px solid #ffffff' : '1px solid rgba(255,255,255,0.3)',
                                    cursor: 'pointer',
                                    transform: color === c ? 'scale(1.15)' : 'scale(1)',
                                    transition: 'all 0.15s ease'
                                }}
                            />
                        ))}
                    </div>

                    {/* Brush Size */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#cbd5e1', fontSize: '0.85rem' }}>
                        <span>Size:</span>
                        <input
                            type="range"
                            min="1"
                            max="20"
                            value={brushSize}
                            onChange={(e) => setBrushSize(Number(e.target.value))}
                            style={{ width: '80px', accentColor: '#6366f1', cursor: 'pointer' }}
                        />
                    </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <button
                        onClick={clearCanvas}
                        style={{
                            padding: '0.5rem 1rem', borderRadius: '0.5rem',
                            border: '1px solid rgba(255,255,255,0.2)',
                            background: 'rgba(255,255,255,0.05)', color: '#cbd5e1',
                            cursor: 'pointer', fontSize: '0.9rem'
                        }}
                    >
                        🗑️ Clear
                    </button>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            onClick={onClose}
                            style={{
                                padding: '0.5rem 1rem', borderRadius: '0.5rem',
                                border: 'none', background: 'rgba(255,255,255,0.1)', color: '#cbd5e1',
                                cursor: 'pointer', fontSize: '0.9rem'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!hasDrawn}
                            style={{
                                padding: '0.5rem 1.25rem', borderRadius: '0.5rem',
                                border: 'none',
                                background: hasDrawn ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : '#475569',
                                color: '#ffffff', fontWeight: 600,
                                cursor: hasDrawn ? 'pointer' : 'not-allowed',
                                fontSize: '0.9rem'
                            }}
                        >
                            Save Doodle
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
