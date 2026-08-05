import React, { useState, useRef, useCallback, useEffect } from 'react';
import { api } from '../lib/api';

// ── Constants ────────────────────────────────────────────────────────────────
const PAGE_W = 794;
const PAGE_H = 560;

const PAPER_STYLES = {
  'cream-grid':       { bg: '#F9F5EC', lines: 'grid',    label: 'Cream Grid'    },
  'aged-parchment':   { bg: '#F0E6C8', lines: 'none',    label: 'Aged Parchment'},
  'ruled-notebook':   { bg: '#FAFAF5', lines: 'ruled',   label: 'Ruled Notebook'},
  'kraft-brown':      { bg: '#C8A87A', lines: 'none',    label: 'Kraft Brown'   },
  'pink-floral':      { bg: '#FEF0F0', lines: 'none',    label: 'Pink Floral'   },
  'blue-watercolor':  { bg: '#EEF4FB', lines: 'none',    label: 'Blue Watercolor'},
  'green-linen':      { bg: '#EDF3EC', lines: 'none',    label: 'Green Linen'   },
};

const THEME_STICKER_SETS = {
  vintage:      ['🌹','📮','✉️','🕯️','📷','🎞️'],
  minimalist:   ['○','—','·','□','△','◇'],
  travel:       ['✈️','🗺️','🧭','🏕️','🌄','🎫'],
  magazine:     ['⭐','📌','✂️','📎','🖊️','📰'],
  junk_journal: ['🍂','🍁','🌾','🪶','🌿','🍄'],
  botanical:    ['🌸','🌺','🌻','🌼','🪴','🍃'],
  watercolor:   ['🌊','🌈','💧','☁️','🌙','⭐'],
  cozy:         ['☕','🕯️','📚','🧣','🪵','🍵'],
};

const EXTRA_STICKERS = ['🎀','💌','🗝️','🧸','🎵','🌙','☀️','❄️','🦋','🌺','🍓','🎪'];

function stripHtml(html) {
  const d = document.createElement('div');
  d.innerHTML = html || '';
  return d.textContent || '';
}

// ── Paper background component ───────────────────────────────────────────────
function PaperBackground({ style }) {
  const p = PAPER_STYLES[style] || PAPER_STYLES['cream-grid'];
  return (
    <div style={{ position: 'absolute', inset: 0, background: p.bg, zIndex: 0 }}>
      {p.lines === 'grid' && (
        <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.18 }}>
          <defs>
            <pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse">
              <path d="M 28 0 L 0 0 0 28" fill="none" stroke="#6B5B3E" strokeWidth="0.6"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      )}
      {p.lines === 'ruled' && (
        <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.15 }}>
          <defs>
            <pattern id="ruled" width="100%" height="28" patternUnits="userSpaceOnUse">
              <line x1="0" y1="27" x2="100%" y2="27" stroke="#3F6389" strokeWidth="0.7"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#ruled)" />
        </svg>
      )}
    </div>
  );
}

// ── Decorative elements renderer ─────────────────────────────────────────────
function DecoElem({ d }) {
  const icons = {
    coffee_stain:   <div style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid rgba(101,67,33,0.25)', boxShadow: 'inset 0 0 0 8px rgba(101,67,33,0.08)' }} />,
    paper_clip:     <div style={{ fontSize: 28, lineHeight: 1 }}>📎</div>,
    pressed_flower: <div style={{ fontSize: 28, lineHeight: 1 }}>🌸</div>,
    travel_stamp:   <div style={{ border: '2.5px solid #3F6389', padding: '3px 7px', fontSize: 11, color: '#3F6389', fontFamily: 'monospace', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.75 }}>STAMP</div>,
    weather_stamp:  <div style={{ border: '2.5px solid #C97B63', padding: '3px 7px', fontSize: 11, color: '#C97B63', fontFamily: 'monospace', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.75 }}>WEATHER</div>,
  };
  return (
    <div style={{ transform: `scale(${d.scale || 1}) rotate(${d.rotation || 0}deg)` }}>
      {icons[d.type] || <div style={{ fontSize: 24 }}>✦</div>}
    </div>
  );
}

// ── Washi tape renderer ───────────────────────────────────────────────────────
function WashiTape({ w }) {
  const patternId = `washi-${w.id}`;
  const c = w.color || '#D7A73E';
  return (
    <svg width={w.width} height={w.height} style={{ display: 'block' }}>
      <defs>
        {w.pattern === 'stripes' && (
          <pattern id={patternId} width="10" height={w.height} patternUnits="userSpaceOnUse">
            <rect width="5" height={w.height} fill={c} opacity="0.7"/>
            <rect x="5" width="5" height={w.height} fill={c} opacity="0.45"/>
          </pattern>
        )}
        {w.pattern === 'dots' && (
          <pattern id={patternId} width="12" height="12" patternUnits="userSpaceOnUse">
            <rect width="12" height="12" fill={c} opacity="0.55"/>
            <circle cx="6" cy="6" r="3" fill="rgba(255,255,255,0.4)"/>
          </pattern>
        )}
      </defs>
      <rect width={w.width} height={w.height} fill={
        w.pattern === 'solid' ? c : `url(#${patternId})`
      } opacity={w.pattern === 'solid' ? 0.6 : 1} rx="2"/>
    </svg>
  );
}

// ── Draggable wrapper ─────────────────────────────────────────────────────────
function Draggable({ x, y, rotation = 0, onMove, onSelect, selected, children, zIndex = 10 }) {
  const ref = useRef(null);
  const dragStart = useRef(null);

  const onMouseDown = (e) => {
    e.stopPropagation();
    onSelect();
    dragStart.current = { mx: e.clientX, my: e.clientY, ox: x, oy: y };
    const move = (ev) => {
      const dx = ev.clientX - dragStart.current.mx;
      const dy = ev.clientY - dragStart.current.my;
      onMove(dragStart.current.ox + dx, dragStart.current.oy + dy);
    };
    const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  return (
    <div
      ref={ref}
      onMouseDown={onMouseDown}
      style={{
        position: 'absolute',
        left: x, top: y,
        transform: `rotate(${rotation}deg)`,
        cursor: 'grab',
        zIndex: selected ? zIndex + 10 : zIndex,
        outline: selected ? '2px dashed rgba(63,99,137,0.6)' : 'none',
        outlineOffset: 4,
        borderRadius: 3,
        userSelect: 'none',
      }}
    >
      {children}
    </div>
  );
}

// ── Main ScrapbookEditor ──────────────────────────────────────────────────────
export default function ScrapbookEditor({ memory, onBack }) {
  const [layout, setLayout]         = useState(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError]           = useState('');
  const [selected, setSelected]     = useState(null); // { type, id }
  const [panel, setPanel]           = useState('stickers'); // 'stickers' | 'paper' | 'text' | 'tape'
  const [addTextVal, setAddTextVal] = useState('');
  const pageRef = useRef(null);

  const generate = useCallback(async () => {
    setGenerating(true); setError(''); setSelected(null);
    try {
      const raw = await api.generateScrapbook(memory);
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      // Ensure arrays exist
      parsed.stickers      = parsed.stickers      || [];
      parsed.decorations   = parsed.decorations   || [];
      parsed.washi_tapes   = parsed.washi_tapes   || [];
      parsed.text_elements = parsed.text_elements || [];
      setLayout(parsed);
    } catch (e) {
      setError('Could not generate scrapbook. Please try again.');
    } finally {
      setGenerating(false);
    }
  }, [memory]);

  useEffect(() => { generate(); }, []);

  // ── Mutators ────────────────────────────────────────────────────────────────
  const moveItem = (type, id, nx, ny) => {
    setLayout((prev) => {
      const arr = [...prev[type]];
      const idx = arr.findIndex((i) => i.id === id);
      if (idx < 0) return prev;
      arr[idx] = { ...arr[idx], x: Math.max(0, nx), y: Math.max(0, ny) };
      return { ...prev, [type]: arr };
    });
  };

  const deleteSelected = () => {
    if (!selected) return;
    setLayout((prev) => ({
      ...prev,
      [selected.type]: prev[selected.type].filter((i) => i.id !== selected.id),
    }));
    setSelected(null);
  };

  const rotateSelected = (delta) => {
    if (!selected) return;
    setLayout((prev) => {
      const arr = [...prev[selected.type]];
      const idx = arr.findIndex((i) => i.id === selected.id);
      if (idx < 0) return prev;
      arr[idx] = { ...arr[idx], rotation: ((arr[idx].rotation || 0) + delta) % 360 };
      return { ...prev, [selected.type]: arr };
    });
  };

  const addSticker = (icon) => {
    setLayout((prev) => {
      const id = Date.now();
      return {
        ...prev,
        stickers: [...prev.stickers, {
          id, icon, x: 150 + Math.random() * 400, y: 100 + Math.random() * 300,
          scale: 1.1, rotation: Math.round(Math.random() * 30 - 15), type: 'custom',
        }],
      };
    });
  };

  const addWashi = (color, pattern) => {
    setLayout((prev) => ({
      ...prev,
      washi_tapes: [...prev.washi_tapes, {
        id: Date.now(), x: 60 + Math.random() * 400, y: 20 + Math.random() * 400,
        width: 120 + Math.random() * 60, height: 24, rotation: Math.round(Math.random() * 10 - 5),
        color, pattern,
      }],
    }));
  };

  const addText = () => {
    if (!addTextVal.trim()) return;
    setLayout((prev) => ({
      ...prev,
      text_elements: [...prev.text_elements, {
        id: Date.now(), text: addTextVal, x: 100 + Math.random() * 300, y: 150 + Math.random() * 200,
        width: 200, font: 'handwritten', size: '0.95rem', color: '#2D2A26', rotation: Math.round(Math.random() * 8 - 4),
      }],
    }));
    setAddTextVal('');
  };

  const changePaper = (style) => setLayout((prev) => ({ ...prev, paper_style: style }));

  // ── Photo layout positions ───────────────────────────────────────────────────
  const photos = [memory.image_url, memory.image_url2, memory.image_url3].filter(Boolean);

  const photoLayouts = [
    [{ x: 420, y: 60,  w: 280, h: 190, rot: 3   }],
    [{ x: 430, y: 40,  w: 190, h: 140, rot: 4   }, { x: 430, y: 200, w: 190, h: 140, rot: -3 }],
    [{ x: 430, y: 30,  w: 160, h: 120, rot: 3   }, { x: 600, y: 80,  w: 150, h: 120, rot: -4 }, { x: 510, y: 210, w: 170, h: 130, rot: 2 }],
  ];
  const photoLayout = photoLayouts[Math.min(photos.length - 1, 2)] || [];

  // ── Loading / Error screens ──────────────────────────────────────────────────
  if (generating) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'60vh', gap:'1.5rem' }}>
      <div style={{ fontSize:'3rem', animation:'spin 1.5s linear infinite' }}>✨</div>
      <p style={{ fontFamily:'var(--font-display)', fontSize:'1.6rem', color:'var(--ink-0)' }}>Crafting your scrapbook…</p>
      <p style={{ fontFamily:'var(--font-hand)', fontSize:'1.1rem', color:'var(--text-muted)' }}>AI is reading your memory and choosing the perfect style</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error) return (
    <div style={{ textAlign:'center', padding:'4rem' }}>
      <p style={{ color:'var(--danger)', marginBottom:'1rem', fontFamily:'var(--font-sans)' }}>{error}</p>
      <button onClick={generate} style={{ background:'var(--accent-terra)', color:'#fff', border:'none', padding:'0.6rem 1.4rem', borderRadius:'6px', cursor:'pointer', fontFamily:'var(--font-sans)', fontWeight:600 }}>Try Again</button>
    </div>
  );

  if (!layout) return null;

  const themeStickers = THEME_STICKER_SETS[layout.theme] || EXTRA_STICKERS;
  const palette = layout.color_palette || ['#F5EBD9','#C97B63','#6B7B52','#D7A73E','#3F6389'];

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>

      {/* ── Top bar ── */}
      <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'1.25rem', flexWrap:'wrap' }}>
        <button onClick={onBack} style={{ background:'transparent', border:'1px solid var(--border-mid)', borderRadius:'6px', padding:'0.4rem 0.9rem', cursor:'pointer', display:'flex', alignItems:'center', gap:'0.3rem', color:'var(--text-secondary)', fontFamily:'var(--font-sans)', fontSize:'0.88rem' }}>
          <i className="bx bx-arrow-back" /> Back
        </button>
        <h2 style={{ fontFamily:'var(--font-display)', fontSize:'1.5rem', fontWeight:700, color:'var(--ink-0)', flex:1 }}>
          ✨ {layout.title || memory.title}
        </h2>
        <div style={{ display:'flex', gap:'0.5rem' }}>
          {selected && (<>
            <button onClick={() => rotateSelected(-15)} title="Rotate left" style={BTN_TOOL}><i className="bx bx-rotate-left"/></button>
            <button onClick={() => rotateSelected(15)}  title="Rotate right" style={BTN_TOOL}><i className="bx bx-rotate-right"/></button>
            <button onClick={deleteSelected} title="Delete" style={{ ...BTN_TOOL, color:'var(--danger)', borderColor:'var(--danger)' }}><i className="bx bx-trash"/></button>
          </>)}
          <button onClick={generate} title="Regenerate" style={{ ...BTN_TOOL, background:'var(--ink-0)', color:'#fff', border:'none' }}>
            <i className="bx bx-refresh"/> Regenerate
          </button>
        </div>
      </div>

      {/* ── Main layout: canvas + sidebar ── */}
      <div style={{ display:'flex', gap:'1.5rem', flex:1, minHeight:0 }}>

        {/* ── Scrapbook canvas ── */}
        <div ref={pageRef} onClick={() => setSelected(null)}
          style={{ position:'relative', width:PAGE_W, height:PAGE_H, flexShrink:0, boxShadow:'0 8px 32px rgba(45,42,38,0.18)', overflow:'hidden', borderRadius:3, cursor:'default' }}>

          <PaperBackground style={layout.paper_style} />

          {/* Color palette accent strip top */}
          <div style={{ position:'absolute', top:0, left:0, right:0, height:6, display:'flex', zIndex:5 }}>
            {palette.map((c,i) => <div key={i} style={{ flex:1, background:c, opacity:0.7 }}/>)}
          </div>

          {/* Washi tapes */}
          {layout.washi_tapes.map((w) => (
            <Draggable key={`washi-${w.id}`} x={w.x} y={w.y} rotation={w.rotation||0}
              onMove={(nx,ny) => moveItem('washi_tapes',w.id,nx,ny)}
              onSelect={() => setSelected({ type:'washi_tapes', id:w.id })}
              selected={selected?.type==='washi_tapes' && selected?.id===w.id} zIndex={8}>
              <WashiTape w={w}/>
            </Draggable>
          ))}

          {/* Photos as polaroids */}
          {photos.map((url, i) => {
            const pl = photoLayout[i];
            if (!pl) return null;
            return (
              <div key={i} style={{ position:'absolute', left:pl.x, top:pl.y, transform:`rotate(${pl.rot}deg)`, zIndex:12, background:'#fff', padding:'6px 6px 28px 6px', boxShadow:'0 4px 12px rgba(45,42,38,0.2)', cursor:'default' }}>
                <img src={api.imageUrl(url)} alt="" style={{ width:pl.w, height:pl.h, objectFit:'cover', display:'block' }}/>
              </div>
            );
          })}

          {/* Decorations */}
          {layout.decorations.map((d) => (
            <Draggable key={`deco-${d.id}`} x={d.x} y={d.y} rotation={d.rotation||0}
              onMove={(nx,ny) => moveItem('decorations',d.id,nx,ny)}
              onSelect={() => setSelected({ type:'decorations', id:d.id })}
              selected={selected?.type==='decorations' && selected?.id===d.id} zIndex={9}>
              <DecoElem d={d}/>
            </Draggable>
          ))}

          {/* Stickers */}
          {layout.stickers.map((s) => (
            <Draggable key={`sticker-${s.id}`} x={s.x} y={s.y} rotation={s.rotation||0}
              onMove={(nx,ny) => moveItem('stickers',s.id,nx,ny)}
              onSelect={() => setSelected({ type:'stickers', id:s.id })}
              selected={selected?.type==='stickers' && selected?.id===s.id} zIndex={14}>
              <div style={{ fontSize: `${(s.scale||1) * 28}px`, lineHeight:1, userSelect:'none' }}>{s.icon}</div>
            </Draggable>
          ))}

          {/* Text elements */}
          {layout.text_elements.map((t) => (
            <Draggable key={`text-${t.id}`} x={t.x} y={t.y} rotation={t.rotation||0}
              onMove={(nx,ny) => moveItem('text_elements',t.id,nx,ny)}
              onSelect={() => setSelected({ type:'text_elements', id:t.id })}
              selected={selected?.type==='text_elements' && selected?.id===t.id} zIndex={16}>
              <div style={{ width:t.width||180, fontFamily: t.font==='handwritten' ? 'var(--font-hand)' : t.font==='serif' ? 'var(--font-display)' : 'cursive', fontSize:t.size||'0.9rem', color:t.color||'#2D2A26', lineHeight:1.5 }}>
                {t.text}
              </div>
            </Draggable>
          ))}

          {/* Page title */}
          <div style={{ position:'absolute', left:30, top:24, zIndex:17, maxWidth:360 }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:'1.55rem', fontWeight:700, color: palette[1]||'var(--ink-0)', lineHeight:1.2, textShadow:'1px 1px 0 rgba(255,255,255,0.6)' }}>
              {layout.title || memory.title}
            </div>
            <div style={{ fontFamily:'var(--font-hand)', fontSize:'0.9rem', color:'var(--text-muted)', marginTop:4 }}>
              {new Date(memory.created_at).toLocaleDateString('en-US',{ weekday:'long', month:'long', day:'numeric' })}
              {memory.location ? `  •  ${memory.location}` : ''}
              {memory.weather  ? `  ${memory.weather}`      : ''}
            </div>
          </div>

          {/* Entry excerpt */}
          <div style={{ position:'absolute', left:30, top:90, width:370, zIndex:15 }}>
            <p style={{ fontFamily:'var(--font-sans)', fontSize:'0.84rem', color:'var(--ink-0)', lineHeight:1.7, opacity:0.88 }}>
              {stripHtml(memory.content || '').slice(0, 320)}{stripHtml(memory.content||'').length > 320 ? '…' : ''}
            </p>
          </div>

          {/* Mood stamp */}
          {memory.mood && (
            <div style={{ position:'absolute', left:30, bottom:28, zIndex:18, border:`2px solid ${palette[1]||'#C97B63'}`, padding:'3px 10px', fontFamily:'var(--font-hand)', fontSize:'0.88rem', color:palette[1]||'#C97B63', transform:'rotate(-3deg)', opacity:0.85 }}>
              {memory.mood}
            </div>
          )}
        </div>

        {/* ── Right sidebar ── */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', gap:'0.75rem', minWidth:220, maxWidth:280, overflowY:'auto' }}>

          {/* Panel tabs */}
          <div style={{ display:'flex', gap:'0.4rem', flexWrap:'wrap' }}>
            {[['stickers','Stickers'],['tape','Washi'],['text','Text'],['paper','Paper']].map(([key,label]) => (
              <button key={key} onClick={() => setPanel(key)} style={{ padding:'0.3rem 0.75rem', borderRadius:20, border:`1.5px solid ${panel===key ? 'var(--accent-terra)' : 'var(--border-mid)'}`, background:panel===key ? 'var(--accent-terra)' : 'transparent', color:panel===key ? '#fff' : 'var(--text-secondary)', cursor:'pointer', fontFamily:'var(--font-sans)', fontSize:'0.8rem', fontWeight:panel===key?700:400 }}>{label}</button>
            ))}
          </div>

          {/* Stickers panel */}
          {panel === 'stickers' && (
            <div>
              <div style={{ fontFamily:'var(--font-hand)', fontSize:'1rem', color:'var(--text-muted)', marginBottom:'0.5rem' }}>Theme stickers</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'0.4rem', marginBottom:'0.75rem' }}>
                {themeStickers.map((s,i) => (
                  <button key={i} onClick={() => addSticker(s)} style={{ fontSize:22, background:'var(--paper-cream)', border:'1px solid var(--border-light)', borderRadius:6, padding:'4px 6px', cursor:'pointer' }}>{s}</button>
                ))}
              </div>
              <div style={{ fontFamily:'var(--font-hand)', fontSize:'1rem', color:'var(--text-muted)', marginBottom:'0.5rem' }}>More</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'0.4rem' }}>
                {EXTRA_STICKERS.map((s,i) => (
                  <button key={i} onClick={() => addSticker(s)} style={{ fontSize:22, background:'var(--paper-cream)', border:'1px solid var(--border-light)', borderRadius:6, padding:'4px 6px', cursor:'pointer' }}>{s}</button>
                ))}
              </div>
            </div>
          )}

          {/* Washi tape panel */}
          {panel === 'tape' && (
            <div>
              <div style={{ fontFamily:'var(--font-hand)', fontSize:'1rem', color:'var(--text-muted)', marginBottom:'0.75rem' }}>Add washi tape</div>
              {[
                ['#D7A73E','stripes','Mustard Stripes'],['#C97B63','dots','Terra Dots'],
                ['#6B7B52','solid','Forest Solid'],  ['#3F6389','stripes','Blue Stripes'],
                ['#D89BA3','dots','Pink Dots'],       ['#C8A87A','solid','Kraft Solid'],
              ].map(([color,pattern,label]) => (
                <button key={label} onClick={() => addWashi(color,pattern)}
                  style={{ display:'flex', alignItems:'center', gap:'0.6rem', width:'100%', background:'transparent', border:'1px solid var(--border-light)', borderRadius:6, padding:'6px 10px', cursor:'pointer', marginBottom:6 }}>
                  <div style={{ width:40, height:16, background:color, borderRadius:2, opacity:0.75 }}/>
                  <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', color:'var(--text-secondary)' }}>{label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Text panel */}
          {panel === 'text' && (
            <div>
              <div style={{ fontFamily:'var(--font-hand)', fontSize:'1rem', color:'var(--text-muted)', marginBottom:'0.5rem' }}>Add a note</div>
              <textarea value={addTextVal} onChange={(e) => setAddTextVal(e.target.value)}
                placeholder="Write something…" rows={3}
                style={{ width:'100%', background:'var(--paper-cream)', border:'1px solid var(--border-mid)', borderRadius:6, padding:'0.5rem', fontFamily:'var(--font-hand)', fontSize:'1rem', resize:'none', outline:'none', marginBottom:'0.5rem' }}/>
              <button onClick={addText} style={{ background:'var(--accent-terra)', color:'#fff', border:'none', borderRadius:6, padding:'0.4rem 1rem', cursor:'pointer', fontFamily:'var(--font-sans)', fontWeight:600, fontSize:'0.85rem', width:'100%' }}>Add Note</button>
            </div>
          )}

          {/* Paper panel */}
          {panel === 'paper' && (
            <div>
              <div style={{ fontFamily:'var(--font-hand)', fontSize:'1rem', color:'var(--text-muted)', marginBottom:'0.5rem' }}>Paper style</div>
              {Object.entries(PAPER_STYLES).map(([key, val]) => (
                <button key={key} onClick={() => changePaper(key)}
                  style={{ display:'flex', alignItems:'center', gap:'0.6rem', width:'100%', background: layout.paper_style===key ? 'rgba(201,123,99,0.1)' : 'transparent', border:`1.5px solid ${layout.paper_style===key ? 'var(--accent-terra)' : 'var(--border-light)'}`, borderRadius:6, padding:'6px 10px', cursor:'pointer', marginBottom:5 }}>
                  <div style={{ width:32, height:20, background:val.bg, borderRadius:3, border:'1px solid var(--border-mid)' }}/>
                  <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.82rem', color:'var(--text-secondary)', fontWeight: layout.paper_style===key ? 700 : 400 }}>{val.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Selection hint */}
          {selected && (
            <div style={{ marginTop:'auto', padding:'0.6rem 0.8rem', background:'rgba(63,99,137,0.06)', border:'1px dashed rgba(63,99,137,0.3)', borderRadius:6, fontFamily:'var(--font-hand)', fontSize:'0.9rem', color:'var(--text-muted)' }}>
              ✦ Drag to move &nbsp;·&nbsp; ↺ buttons to rotate &nbsp;·&nbsp; 🗑 to delete
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Shared styles ─────────────────────────────────────────────────────────────
const BTN_TOOL = {
  display:'flex', alignItems:'center', gap:'0.3rem',
  padding:'0.35rem 0.8rem', borderRadius:6,
  border:'1px solid var(--border-mid)', background:'transparent',
  color:'var(--text-secondary)', cursor:'pointer',
  fontFamily:'var(--font-sans)', fontSize:'0.83rem',
};
