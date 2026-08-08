import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { api } from '../lib/api';
import { moodMeta } from '../lib/demo';

/* ─── Web Audio: Projector Sound ───────────────────────────────── */
function useProjectorSound() {
    const ctxRef = useRef(null);

    const start = useCallback(() => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            ctxRef.current = ctx;
            const sr = ctx.sampleRate;
            const buf = ctx.createBuffer(1, sr * 4, sr);
            const data = buf.getChannelData(0);

            for (let i = 0; i < sr * 4; i++) {
                let s = (Math.random() * 2 - 1) * 0.04;
                const cycle = Math.round(sr / 3);
                if (i % cycle < 4) s += (Math.random() > 0.5 ? 0.12 : -0.12);
                data[i] = s;
            }

            const src = ctx.createBufferSource();
            src.buffer = buf;
            src.loop = true;

            const lpf = ctx.createBiquadFilter();
            lpf.type = 'lowpass';
            lpf.frequency.value = 900;

            const gain = ctx.createGain();
            gain.gain.value = 0.28;

            src.connect(lpf);
            lpf.connect(gain);
            gain.connect(ctx.destination);
            src.start();
        } catch { /* audio not available */ }
    }, []);

    const stop = useCallback(() => {
        try { ctxRef.current?.close(); ctxRef.current = null; } catch {}
    }, []);

    useEffect(() => () => { try { ctxRef.current?.close(); } catch {} }, []);

    return { start, stop };
}

/* ─── Film Reel SVG ─────────────────────────────────────────────── */
function FilmReel({ size = 120, spinning = false, speed = '5s' }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 120 120"
            className={`tm-reel-svg${spinning ? ' tm-spin' : ''}`}
            style={spinning ? { animationDuration: speed } : {}}
            aria-hidden="true"
        >
            <defs>
                <radialGradient id="rg1" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#231a08" />
                    <stop offset="100%" stopColor="#0d0a04" />
                </radialGradient>
            </defs>
            <circle cx="60" cy="60" r="57" fill="url(#rg1)" stroke="#5a4010" strokeWidth="2" />
            {[0, 60, 120, 180, 240, 300].map((deg, i) => {
                const r = deg * Math.PI / 180;
                return (
                    <line key={i}
                        x1={60 + Math.cos(r) * 22} y1={60 + Math.sin(r) * 22}
                        x2={60 + Math.cos(r) * 50} y2={60 + Math.sin(r) * 50}
                        stroke="#8B6914" strokeWidth="3" strokeLinecap="round"
                    />
                );
            })}
            {Array.from({ length: 18 }, (_, i) => {
                const a = ((i / 18) * 360 - 90) * Math.PI / 180;
                return (
                    <circle key={i}
                        cx={60 + Math.cos(a) * 51} cy={60 + Math.sin(a) * 51}
                        r="3.8" fill="#0a0804" stroke="#3a2808" strokeWidth="1.2"
                    />
                );
            })}
            {[0, 120, 240].map((deg, i) => {
                const r = (deg - 90) * Math.PI / 180;
                const cx = 60 + Math.cos(r) * 35, cy = 60 + Math.sin(r) * 35;
                return (
                    <ellipse key={i} cx={cx} cy={cy} rx="7" ry="11"
                        fill="#080604" stroke="#4a3510" strokeWidth="1.2"
                        transform={`rotate(${deg}, ${cx}, ${cy})`}
                    />
                );
            })}
            <circle cx="60" cy="60" r="20" fill="url(#rg1)" stroke="#6B4F10" strokeWidth="2" />
            <circle cx="60" cy="60" r="7"  fill="#080604" stroke="#C4922A" strokeWidth="1.8" />
        </svg>
    );
}

/* ─── Year Timeline ─────────────────────────────────────────────── */
function YearTimeline({ years, selected, onSelect }) {
    if (!years.length) return null;
    return (
        <div className="tm-timeline">
            <div className="tm-tl-track">
                <div className="tm-tl-rail" />
                {years.map(yr => (
                    <button key={yr} onClick={() => onSelect(yr)}
                        className={`tm-yr${selected === yr ? ' active' : ''}`}
                        id={`tm-yr-${yr}`}>
                        <span className="tm-yr-pip" />
                        <span className="tm-yr-txt">{yr}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

/* ─── Film Perforations ─────────────────────────────────────────── */
function Perfs({ n = 14 }) {
    return (
        <div className="tm-perfs">
            {Array.from({ length: n }, (_, i) => <div key={i} className="tm-perf" />)}
        </div>
    );
}

/* ─── Countdown Leader ──────────────────────────────────────────── */
function Leader({ num }) {
    return (
        <div className="tm-leader">
            <div className="tm-ldr-circle" key={num}>
                <div className="tm-crosshair h" />
                <div className="tm-crosshair v" />
                <span className="tm-ldr-num">{num}</span>
                <div className="tm-corner-tick tl" />
                <div className="tm-corner-tick tr" />
                <div className="tm-corner-tick bl" />
                <div className="tm-corner-tick br" />
            </div>
        </div>
    );
}

/* ─── Individual Film Frame ─────────────────────────────────────── */
function FilmFrame({ memory, idx, total, autoPlay, onNext, onEnd }) {
    const [visible, setVisible] = useState(false);
    const [progress, setProgress] = useState(0);
    const iRef = useRef(null);
    const DURATION = 5000;

    const mood = moodMeta(memory?.mood);
    const imgUrl = memory?.image_url ? api.imageUrl(memory.image_url) : null;

    const dateStr = memory?.created_at
        ? new Date(memory.created_at).toLocaleDateString('en-US', {
            weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
        }).toUpperCase()
        : '';

    const preview = (() => {
        if (!memory?.content) return '';
        const el = document.createElement('div');
        el.innerHTML = memory.content;
        return (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 140);
    })();

    const tags = (memory?.tags || '').split(',').map(t => t.trim()).filter(Boolean).slice(0, 3);

    useEffect(() => {
        const t = setTimeout(() => setVisible(true), 80);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        if (!autoPlay || !visible) return;
        const t0 = Date.now();
        setProgress(0);
        iRef.current = setInterval(() => {
            const pct = Math.min(((Date.now() - t0) / DURATION) * 100, 100);
            setProgress(pct);
            if (pct >= 100) {
                clearInterval(iRef.current);
                idx + 1 >= total ? onEnd() : onNext();
            }
        }, 40);
        return () => clearInterval(iRef.current);
    }, [visible, autoPlay, idx]);

    const isLast = idx + 1 >= total;

    return (
        <div className={`tm-frame${visible ? ' tm-fv' : ''}`}>
            <Perfs n={13} />

            <div className="tm-fhdr">
                <span className="tm-fnum">🎞 FRAME {String(idx + 1).padStart(2, '0')}</span>
                <span className="tm-fcount">{idx + 1} / {total}</span>
            </div>

            <div className="tm-fbody">
                <div className="tm-fmedia">
                    {imgUrl
                        ? <img src={imgUrl} alt={memory.title} className="tm-fimg" />
                        : <div className="tm-fmood-icon">{mood.emoji}</div>
                    }
                    <div className="tm-fphoto-vignette" />
                </div>

                <div className="tm-finfo">
                    <div className="tm-fdate">{dateStr}</div>
                    <div className="tm-ftitle">"{memory?.title}"</div>

                    <div className="tm-fmeta">
                        {memory?.mood && (
                            <span className="tm-ftag mood-tag">{mood.emoji} {memory.mood}</span>
                        )}
                        {memory?.location && (
                            <span className="tm-ftag">📍 {memory.location}</span>
                        )}
                        {memory?.weather && (
                            <span className="tm-ftag">🌤 {memory.weather}</span>
                        )}
                        {tags.map(t => (
                            <span key={t} className="tm-ftag hash-tag">#{t}</span>
                        ))}
                    </div>

                    {preview && (
                        <div className="tm-fpreview">
                            {preview}{preview.length >= 140 ? '…' : ''}
                        </div>
                    )}
                </div>
            </div>

            <Perfs n={13} />

            <div className="tm-fpbar">
                <div className="tm-fpbar-fill" style={{ width: `${progress}%` }} />
            </div>

            <div className="tm-fftr">
                {isLast ? (
                    <button className="tm-ctrl end" onClick={onEnd}>✦ THE END ✦</button>
                ) : (
                    <button className="tm-ctrl" onClick={onNext}>NEXT FRAME ▶</button>
                )}
            </div>
        </div>
    );
}

/* ─── End Screen ────────────────────────────────────────────────── */
function EndScreen({ count, year, onReplay, onReset, onExplore }) {
    return (
        <div className="tm-end">
            <div className="tm-end-inner">
                <div className="tm-end-reels">
                    <FilmReel size={56} spinning speed="9s" />
                    <FilmReel size={80} spinning speed="6s" />
                    <FilmReel size={56} spinning speed="9s" />
                </div>

                <div className="tm-end-rule" />
                <h1 className="tm-end-title">THE END</h1>
                <div className="tm-end-rule" />

                <div className="tm-end-caption">
                    <span className="tm-ec-num">{count}</span>
                    {count === 1 ? ' memory' : ' memories'} from{' '}
                    <span className="tm-ec-yr">{year}</span>
                </div>

                <div className="tm-end-quote">
                    "Every memory is a frame in the film of your life."
                </div>

                <div className="tm-end-actions">
                    <button className="tm-eb primary" onClick={onReplay} id="tm-replay-btn">
                        ↺ &nbsp;Replay
                    </button>
                    <button className="tm-eb" onClick={onReset} id="tm-choose-year-btn">
                        ◈ &nbsp;Choose Year
                    </button>
                    {onExplore && (
                        <button className="tm-eb accent" onClick={onExplore} id="tm-explore-btn">
                            ▸ &nbsp;Explore Memories
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ═══ MAIN COMPONENT ═══════════════════════════════════════════════ */
export default function TimeMachine({ go }) {
    const [memories, setMemories]     = useState([]);
    const [fetching, setFetching]     = useState(true);
    const [selectedYear, setYear]     = useState(null);
    const [phase, setPhase]           = useState('idle'); // idle | countdown | playing | end
    const [countNum, setCountNum]     = useState(5);
    const [frameIdx, setFrameIdx]     = useState(0);
    const [autoPlay, setAutoPlay]     = useState(true);
    const { start: sndStart, stop: sndStop } = useProjectorSound();

    const years = useMemo(() =>
        [...new Set(memories.map(m => new Date(m.created_at).getFullYear()))].sort(),
        [memories]
    );

    const yearMems = useMemo(() =>
        !selectedYear ? [] :
        memories
            .filter(m => new Date(m.created_at).getFullYear() === selectedYear)
            .sort((a, b) => new Date(a.created_at) - new Date(b.created_at)),
        [memories, selectedYear]
    );

    useEffect(() => {
        api.getMemories()
            .then(d => { setMemories(Array.isArray(d) ? d : []); setFetching(false); })
            .catch(() => setFetching(false));
    }, []);

    useEffect(() => {
        if (years.length && !selectedYear) setYear(years[years.length - 1]);
    }, [years]);

    useEffect(() => {
        if (phase !== 'countdown') return;
        let n = 5;
        setCountNum(n);
        sndStart();
        const iv = setInterval(() => {
            n--;
            setCountNum(n);
            if (n <= 0) {
                clearInterval(iv);
                setFrameIdx(0);
                setPhase('playing');
            }
        }, 900);
        return () => clearInterval(iv);
    }, [phase]);

    const handlePlay = () => {
        if (!yearMems.length) return;
        setPhase('countdown');
    };

    const handleNext = useCallback(() => setFrameIdx(i => i + 1), []);
    const handleEnd  = useCallback(() => { sndStop(); setPhase('end'); }, [sndStop]);
    const handleReplay = () => { setFrameIdx(0); setPhase('countdown'); };
    const handleReset  = () => { sndStop(); setPhase('idle'); setFrameIdx(0); };

    const inCinema = phase !== 'idle';

    return (
        <div className={`tm-root${inCinema ? ' tm-cinema' : ''}`}>
            <div className="tm-grain" aria-hidden="true" />
            {inCinema && <div className="tm-vignette" aria-hidden="true" />}

            {phase === 'idle' && (
                <div className="tm-idle">
                    <div className="tm-bgreel tm-bgrl" aria-hidden="true">
                        <FilmReel size={230} spinning speed="11s" />
                    </div>
                    <div className="tm-bgreel tm-bgrr" aria-hidden="true">
                        <FilmReel size={140} spinning speed="7s" />
                    </div>

                    <div className="tm-deco-strip top">
                        {Array.from({ length: 32 }, (_, i) => <div key={i} className="tm-ds-hole" />)}
                    </div>
                    <div className="tm-deco-strip bottom">
                        {Array.from({ length: 32 }, (_, i) => <div key={i} className="tm-ds-hole" />)}
                    </div>

                    <div className="tm-idle-body">
                        <div className="tm-title-wrap">
                            <div className="tm-title-reel">
                                <FilmReel size={72} spinning speed="5s" />
                            </div>
                            <div className="tm-title-text">
                                <p className="tm-eyebrow">◆ PRESENTING ◆</p>
                                <h1 className="tm-hero">
                                    <span className="tm-hero-top">MEMORY</span>
                                    <span className="tm-hero-btm">TIME MACHINE</span>
                                </h1>
                                <p className="tm-tagline">A cinematic journey through your diary</p>
                            </div>
                        </div>

                        <div className="tm-rule">
                            <span className="tm-rule-line" />
                            <span className="tm-rule-gem">✦</span>
                            <span className="tm-rule-line" />
                        </div>

                        {fetching ? (
                            <div className="tm-status-msg">
                                <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '1.4rem', color: '#8B6914' }} />
                                <span>Loading your memories…</span>
                            </div>
                        ) : memories.length === 0 ? (
                            <div className="tm-status-msg">
                                <p>No memories yet — write your first diary entry to begin your story.</p>
                                <button className="tm-playbtn" onClick={() => go?.('editor')}>
                                    ✎ &nbsp;Write First Memory
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="tm-year-section">
                                    <p className="tm-eyebrow" style={{ letterSpacing: '0.45em' }}>SELECT A YEAR</p>
                                    <YearTimeline years={years} selected={selectedYear} onSelect={setYear} />
                                    <div className="tm-year-info">
                                        {selectedYear && yearMems.length > 0 ? (
                                            <>
                                                <span className="tm-yi-n">{yearMems.length}</span>
                                                {yearMems.length === 1 ? ' memory' : ' memories'} waiting to be discovered from{' '}
                                                <span className="tm-yi-y">{selectedYear}</span>
                                            </>
                                        ) : selectedYear ? (
                                            <span className="tm-yi-empty">No memories recorded in {selectedYear}</span>
                                        ) : null}
                                    </div>
                                </div>

                                <button
                                    id="tm-play-btn"
                                    className={`tm-playbtn${!yearMems.length ? ' disabled' : ''}`}
                                    onClick={handlePlay}
                                    disabled={!yearMems.length}
                                >
                                    <span className="tm-play-icon">▶</span>
                                    PLAY
                                </button>

                                <label className="tm-autoplay">
                                    <input type="checkbox" checked={autoPlay}
                                        onChange={e => setAutoPlay(e.target.checked)} />
                                    <span>Auto-advance frames &nbsp;(5 seconds each)</span>
                                </label>
                            </>
                        )}
                    </div>
                </div>
            )}

            {phase === 'countdown' && (
                <div className="tm-countdown">
                    <div className="tm-beam" aria-hidden="true" />
                    <div className="tm-scratches" aria-hidden="true" />
                    <Leader num={countNum} />
                    <p className="tm-presenting-lbl">P R E S E N T I N G</p>
                    <p className="tm-presenting-yr">"{selectedYear}"</p>
                </div>
            )}

            {phase === 'playing' && yearMems[frameIdx] && (
                <div className="tm-playing">
                    <div className="tm-film-edge top">
                        {Array.from({ length: 28 }, (_, i) => <div key={i} className="tm-eh" />)}
                    </div>

                    <div className="tm-frame-wrap">
                        <FilmFrame
                            key={frameIdx}
                            memory={yearMems[frameIdx]}
                            idx={frameIdx}
                            total={yearMems.length}
                            autoPlay={autoPlay}
                            onNext={handleNext}
                            onEnd={handleEnd}
                        />
                    </div>

                    <div className="tm-film-edge bottom">
                        {Array.from({ length: 28 }, (_, i) => <div key={i} className="tm-eh" />)}
                    </div>

                    <button className="tm-exit" onClick={handleReset} title="Exit Time Machine" id="tm-exit-btn">✕</button>
                </div>
            )}

            {phase === 'end' && (
                <EndScreen
                    count={yearMems.length}
                    year={selectedYear}
                    onReplay={handleReplay}
                    onReset={handleReset}
                    onExplore={go ? () => go('memories') : null}
                />
            )}
        </div>
    );
}
