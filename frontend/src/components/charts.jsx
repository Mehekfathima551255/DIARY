import React from 'react';

// ---------- Donut / mood ring ----------
export function Donut({ data, size = 170, thickness = 26 }) {
    // data: [{ label, value, color }]
    const total = data.reduce((s, d) => s + d.value, 0) || 1;
    const r = (size - thickness) / 2;
    const cx = size / 2;
    const c = 2 * Math.PI * r;
    let offset = 0;

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={thickness} />
            {data.map((d, i) => {
                const frac = d.value / total;
                const dash = frac * c;
                const el = (
                    <circle
                        key={i}
                        cx={cx}
                        cy={cx}
                        r={r}
                        fill="none"
                        stroke={d.color}
                        strokeWidth={thickness}
                        strokeDasharray={`${dash} ${c - dash}`}
                        strokeDashoffset={-offset}
                        transform={`rotate(-90 ${cx} ${cx})`}
                        strokeLinecap="butt"
                    />
                );
                offset += dash;
                return el;
            })}
            <text x={cx} y={cx - 4} textAnchor="middle" fontSize="22" fontWeight="700"
                fill="var(--text-primary)" fontFamily="var(--font-heading)">{total}</text>
            <text x={cx} y={cx + 16} textAnchor="middle" fontSize="10"
                fill="var(--text-secondary)">entries</text>
        </svg>
    );
}

// ---------- Smooth line chart ----------
export function LineChart({ values, width = 520, height = 220, color = '#a855f7' }) {
    if (!values || values.length === 0) values = [0];
    const pad = 28;
    const w = width - pad * 2;
    const h = height - pad * 2;
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = max - min || 1;
    const stepX = w / (values.length - 1 || 1);
    const pts = values.map((v, i) => [pad + i * stepX, pad + h - ((v - min) / range) * h]);
    const path = pts.map((p, i) => (i === 0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`)).join(' ');
    const area = `${path} L ${pad + w} ${pad + h} L ${pad} ${pad + h} Z`;

    return (
        <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
            <defs>
                <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.35" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            {[0, 0.25, 0.5, 0.75, 1].map((g, i) => (
                <line key={i} x1={pad} x2={pad + w} y1={pad + h * g} y2={pad + h * g}
                    stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            ))}
            <path d={area} fill="url(#lineFill)" />
            <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            {pts.filter((_, i) => i === pts.length - 1).map((p, i) => (
                <circle key={i} cx={p[0]} cy={p[1]} r="4" fill={color} stroke="#fff" strokeWidth="1.5" />
            ))}
        </svg>
    );
}

// ---------- Heatmap (writing activity) ----------
export function Heatmap({ values, cols = 30 }) {
    const shade = (v) => {
        if (v <= 0) return 'rgba(124,108,255,0.08)';
        const a = 0.2 + Math.min(v, 4) / 4 * 0.8;
        return `rgba(124,108,255,${a})`;
    };
    return (
        <div>
            <div className="heat-grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
                {values.map((v, i) => (
                    <div key={i} className="heat-cell" style={{ background: shade(v) }} title={`${v} entries`} />
                ))}
            </div>
            <div className="heat-scale">
                <span>Less</span>
                {[0, 1, 2, 3, 4].map((v) => <span key={v} className="box" style={{ background: shade(v) }} />)}
                <span>More</span>
            </div>
        </div>
    );
}
