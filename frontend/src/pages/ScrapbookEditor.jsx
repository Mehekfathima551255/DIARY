import React, { useState, useRef, useCallback, useEffect, useReducer } from 'react';
import { api } from '../lib/api';

// ─────────────────────────────────────────────────────────────────────────────
// Design constants
// ─────────────────────────────────────────────────────────────────────────────
const PAGE_BG = {
  aged_cream:       '#F4EDD8',
  kraft_brown:      '#C8A87A',
  watercolor_blue:  '#E3EEF7',
  floral_pink:      '#FEF0F0',
  grid_notebook:    '#FAFAF5',
  lined_ruled:      '#FAFAFA',
  parchment_yellow: '#F0E6C0',
  linen_green:      '#EDF3EC',
};

const THEME_PALETTE = {
  vintage_travel:       ['#8B6F47','#C97B63','#D7A73E','#4B6950','#3F6389'],
  birthday_celebration: ['#E84393','#FF6B35','#FFD700','#7BC67E','#9B59B6'],
  nature_botanical:     ['#4B6950','#6B8F5E','#A8C5A0','#D7A73E','#8B4513'],
  cozy_café:            ['#6B4423','#C97B63','#D7A73E','#8B7355','#4A3728'],
  rainy_day:            ['#4A6FA5','#7BA7BC','#A8C5D8','#C0C8D4','#6B7B8D'],
  beach_summer:         ['#4A90C4','#F5D06E','#E8C49A','#2D6B8E','#7EC8C8'],
  autumn_journal:       ['#C97B2E','#8B4513','#D7A73E','#6B4423','#A0522D'],
  adventure_hiking:     ['#4B6950','#8B7355','#C97B63','#6B8F5E','#3D5A3E'],
  city_life:            ['#2C3E50','#7F8C8D','#C97B63','#D7A73E','#95A5A6'],
  minimal_elegant:      ['#2D2A26','#8B8579','#C97B63','#D7A73E','#5A554D'],
};

const STICKER_SETS = {
  vintage_travel:       ['✈️','🗺️','🧭','📮','🎫','🪙','⚓','🌍'],
  birthday_celebration: ['🎂','🎈','🎁','🎉','🥳','🌟','🎀','🍰'],
  nature_botanical:     ['🌸','🌿','🍃','🌺','🦋','🐝','🌻','🍄'],
  cozy_café:            ['☕','🍵','📚','🕯️','🧁','🪴','🍂','✍️'],
  rainy_day:            ['🌧️','☂️','💧','🌊','☁️','🌈','🫖','🎵'],
  beach_summer:         ['🏖️','🐚','🌴','🐠','⛱️','🏄','🦀','🌊'],
  autumn_journal:       ['🍂','🍁','🎃','🌾','🪶','🦔','🍄','☕'],
  adventure_hiking:     ['🏕️','🧗','🌄','🦅','🪨','🌲','🏔️','🧭'],
  city_life:            ['🌆','📸','🎭','🚇','☕','🏛️','🎨','🌃'],
  minimal_elegant:      ['✦','○','—','·','△','◇','✿','❋'],
};

function stripHtml(html) {
  const d = document.createElement('div');
  d.innerHTML = html || '';
  return d.textContent || '';
}

// ─────────────────────────────────────────────────────────────────────────────
// Undo / Redo reducer
// ─────────────────────────────────────────────────────────────────────────────
function historyReducer(state, action) {
  switch (action.type) {
    case 'SET': {
      const past = state.past.slice(-30);
      return { past: [...past, state.present], present: action.layout, future: [] };
    }
    case 'UNDO': {
      if (!state.past.length) return state;
      const prev = state.past[state.past.length - 1];
      return { past: state.past.slice(0, -1), present: prev, future: [state.present, ...state.future] };
    }
    case 'REDO': {
      if (!state.future.length) return state;
      const next = state.future[0];
      return { past: [...state.past, state.present], present: next, future: state.future.slice(1) };
    }
    case 'INIT':
      return { past: [], present: action.layout, future: [] };
    default:
      return state;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components — decorative elements rendered in CSS/SVG
// ─────────────────────────────────────────────────────────────────────────────

function CoffeeStain({ color = '#C8A87A', scale = 1 }) {
  const c = color;
  return (
    <svg width={60*scale} height={60*scale} viewBox="0 0 60 60">
      <ellipse cx="30" cy="30" rx="28" ry="26" fill="none" stroke={c} strokeWidth="3" opacity="0.3"/>
      <ellipse cx="30" cy="30" rx="22" ry="20" fill="none" stroke={c} strokeWidth="1.5" opacity="0.2"/>
      <ellipse cx="30" cy="30" rx="16" ry="14" fill={c} opacity="0.08"/>
    </svg>
  );
}

function PressedFlower({ color = '#D89BA3', scale = 1 }) {
  return (
    <svg width={44*scale} height={44*scale} viewBox="0 0 44 44">
      {[0,60,120,180,240,300].map((a,i) => (
        <ellipse key={i} cx="22" cy="22" rx="8" ry="4"
          fill={color} opacity="0.75"
          transform={`rotate(${a} 22 22) translate(0 -10)`}/>
      ))}
      <circle cx="22" cy="22" r="5" fill="#F5D06E" opacity="0.9"/>
    </svg>
  );
}

function PaperClip({ color = '#8B8579', scale = 1 }) {
  return (
    <svg width={14*scale} height={40*scale} viewBox="0 0 14 40">
      <path d="M7 2 C3 2 1 5 1 8 L1 32 C1 36 4 39 7 39 C10 39 13 36 13 32 L13 10 C13 7 11 5 8 5 C5 5 3 7 3 10 L3 30 C3 32 4 33 5 33 C6 33 7 32 7 30 L7 12"
        fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

function FilmStrip({ photos = [], apiBase = '' }) {
  return (
    <div style={{ background: '#1a1a1a', padding: '4px', borderRadius: 2, display: 'inline-flex', flexDirection: 'column', gap: 2 }}>
      <div style={{ display: 'flex', gap: 3, padding: '2px 4px' }}>
        {[...Array(6)].map((_,i) => <div key={i} style={{ width: 6, height: 4, background: '#333', borderRadius: 1 }}/>)}
      </div>
      {photos.slice(0,3).map((url, i) => (
        <div key={i} style={{ width: 60, height: 44, background: '#222', overflow: 'hidden' }}>
          {url && <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }}/>}
        </div>
      ))}
      <div style={{ display: 'flex', gap: 3, padding: '2px 4px' }}>
        {[...Array(6)].map((_,i) => <div key={i} style={{ width: 6, height: 4, background: '#333', borderRadius: 1 }}/>)}
      </div>
    </div>
  );
}

function TicketStub({ color = '#D7A73E', text = 'ADMIT ONE' }) {
  return (
    <div style={{ background: color, padding: '5px 10px', borderRadius: 3, border: '1px dashed rgba(255,255,255,0.5)', display: 'inline-block', position: 'relative' }}>
      <div style={{ position: 'absolute', left: -1, top: '50%', transform: 'translateY(-50%)', width: 8, height: 8, background: 'var(--bg-app,#F7F2E8)', borderRadius: '50%', border: '1px solid rgba(0,0,0,0.1)' }}/>
      <div style={{ position: 'absolute', right: -1, top: '50%', transform: 'translateY(-50%)', width: 8, height: 8, background: 'var(--bg-app,#F7F2E8)', borderRadius: '50%', border: '1px solid rgba(0,0,0,0.1)' }}/>
      <div style={{ fontFamily: 'monospace', fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.9)', letterSpacing: 2, textTransform: 'uppercase' }}>{text}</div>
    </div>
  );
}

function PassportStamp({ color = '#3F6389', text = 'VISITED' }) {
  return (
    <div style={{ border: `2.5px solid ${color}`, borderRadius: '50%', width: 56, height: 56, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.6, position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 4, border: `1px solid ${color}`, borderRadius: '50%' }}/>
      <div style={{ fontFamily: 'monospace', fontSize: '0.5rem', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center', lineHeight: 1.2 }}>{text}</div>
    </div>
  );
}

function WashiTape({ tape }) {
  const { color, opacity = 0.7, pattern, orientation, width_rem } = tape;
  const w = `${width_rem}rem`;
  const h = '1.4rem';
  const id = `washi-${tape.id}`;
  const isVertical = orientation === 'vertical';
  return (
    <svg
      width={isVertical ? h : w}
      height={isVertical ? w : h}
      style={{ display: 'block', opacity }}
    >
      <defs>
        {pattern === 'stripes' && (
          <pattern id={id} width="12" height="100%" patternUnits="userSpaceOnUse">
            <rect width="6" height="100%" fill={color}/>
            <rect x="6" width="6" height="100%" fill={color} opacity="0.6"/>
          </pattern>
        )}
        {pattern === 'dots' && (
          <pattern id={id} width="10" height="10" patternUnits="userSpaceOnUse">
            <rect width="10" height="10" fill={color}/>
            <circle cx="5" cy="5" r="3" fill="rgba(255,255,255,0.45)"/>
          </pattern>
        )}
        {pattern === 'chevron' && (
          <pattern id={id} width="16" height="14" patternUnits="userSpaceOnUse">
            <rect width="16" height="14" fill={color}/>
            <polyline points="0,7 8,0 16,7" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2"/>
            <polyline points="0,14 8,7 16,14" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2"/>
          </pattern>
        )}
      </defs>
      <rect
        width={isVertical ? h : w}
        height={isVertical ? w : h}
        fill={['stripes','dots','chevron'].includes(pattern) ? `url(#${id})` : color}
        rx="2"
      />
    </svg>
  );
}

function TornPaper({ piece }) {
  const { color, width, height_rem } = piece;
  const w = `${width}%`;
  const h = `${height_rem}rem`;
  // Generate a random torn edge path
  const pts = [];
  const steps = 12;
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * 100;
    const y = i === 0 || i === steps ? 0 : (Math.sin(i * 2.3) * 8 + Math.cos(i * 1.7) * 5 + 8);
    pts.push(`${x}% ${y}px`);
  }
  return (
    <div style={{
      width: w, height: h,
      background: color,
      position: 'absolute',
      left: `${piece.x}%`, top: `${piece.y}%`,
      transform: `rotate(${piece.rotation || 0}deg)`,
      zIndex: piece.z_index || 1,
      boxShadow: '2px 3px 8px rgba(45,42,38,0.12)',
      clipPath: `polygon(0% 0%, ${pts.map(p => p).join(', ')}, 100% 0%)`,
    }}/>
  );
}

function DecorationElem({ d, photos }) {
  switch (d.type) {
    case 'coffee_stain':    return <CoffeeStain color={d.color} scale={d.scale}/>;
    case 'pressed_flower':  return <PressedFlower color={d.color} scale={d.scale}/>;
    case 'paper_clip':      return <PaperClip color={d.color} scale={d.scale}/>;
    case 'binder_clip':     return <PaperClip color="#666" scale={d.scale * 1.3}/>;
    case 'film_strip':      return <FilmStrip photos={photos}/>;
    case 'ticket_stub':     return <TicketStub color={d.color} text="ADMIT ONE"/>;
    case 'postage_stamp':   return (
      <div style={{ border: `2px dashed ${d.color}`, padding: '4px 6px', fontSize: '0.6rem', fontFamily: 'monospace', color: d.color, opacity: 0.75, textTransform: 'uppercase', letterSpacing: 1 }}>POSTAGE</div>
    );
    case 'passport_stamp':  return <PassportStamp color={d.color} text="VISITED"/>;
    case 'receipt_scrap':   return (
      <div style={{ background: '#fff', padding: '4px 6px', fontFamily: 'monospace', fontSize: '0.55rem', color: '#666', lineHeight: 1.6, opacity: 0.8, minWidth: 60 }}>
        <div>-----------</div><div>TOTAL $4.50</div><div>THANK YOU</div><div>-----------</div>
      </div>
    );
    case 'dried_leaf':      return <div style={{ fontSize: `${2.2 * (d.scale||1)}rem` }}>🍂</div>;
    case 'butterfly':       return <div style={{ fontSize: `${2 * (d.scale||1)}rem` }}>🦋</div>;
    case 'ink_splatter':    return (
      <svg width={36*(d.scale||1)} height={28*(d.scale||1)} viewBox="0 0 36 28">
        <circle cx="18" cy="14" r="8" fill={d.color||'#2D2A26'} opacity="0.18"/>
        <circle cx="28" cy="8"  r="3" fill={d.color||'#2D2A26'} opacity="0.12"/>
        <circle cx="10" cy="22" r="4" fill={d.color||'#2D2A26'} opacity="0.14"/>
        <circle cx="30" cy="20" r="2" fill={d.color||'#2D2A26'} opacity="0.1"/>
      </svg>
    );
    case 'string_bow':      return <div style={{ fontSize: `${1.8*(d.scale||1)}rem` }}>🎀</div>;
    default:                return <div style={{ fontSize: '1.2rem' }}>✦</div>;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Draggable wrapper
// ─────────────────────────────────────────────────────────────────────────────
function Draggable({ xPct, yPct, rotation = 0, onMove, onSelect, isSelected, children, zIndex = 10, pageW, pageH }) {
  const dragRef = useRef(null);

  const onMouseDown = (e) => {
    e.stopPropagation();
    onSelect();
    const startX = e.clientX;
    const startY = e.clientY;
    const startXPct = xPct;
    const startYPct = yPct;
    const move = (ev) => {
      const dx = ((ev.clientX - startX) / pageW) * 100;
      const dy = ((ev.clientY - startY) / pageH) * 100;
      onMove(Math.max(0, Math.min(90, startXPct + dx)), Math.max(0, Math.min(90, startYPct + dy)));
    };
    const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  return (
    <div
      ref={dragRef}
      onMouseDown={onMouseDown}
      style={{
        position: 'absolute',
        left: `${xPct}%`,
        top: `${yPct}%`,
        transform: `rotate(${rotation}deg)`,
        cursor: 'grab',
        zIndex: isSelected ? zIndex + 20 : zIndex,
        outline: isSelected ? '2px dashed rgba(63,99,137,0.7)' : 'none',
        outlineOffset: 3,
        userSelect: 'none',
        filter: isSelected ? 'drop-shadow(0 0 6px rgba(63,99,137,0.4))' : undefined,
      }}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Photo frame renderers
// ─────────────────────────────────────────────────────────────────────────────
function PhotoFrame({ photo, imgSrc, isSelected, onSelect, onMove, pageW, pageH, dispatch }) {
  const { style, x, y, width, rotation, caption, tape_color } = photo;
  const pxW = (width / 100) * pageW;

  const inner = (
    <div style={{ position: 'relative' }}>
      {/* Tape piece */}
      <div style={{
        position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%) rotate(-2deg)',
        width: '40%', height: 14,
        background: tape_color || '#D7A73E',
        opacity: 0.7, zIndex: 2, borderRadius: 2,
      }}/>

      {style === 'polaroid' && (
        <div style={{ background: '#fff', padding: '6px 6px 32px', boxShadow: '0 4px 14px rgba(45,42,38,0.22)', width: pxW }}>
          {imgSrc
            ? <img src={imgSrc} alt="" style={{ width: '100%', height: pxW * 0.72, objectFit: 'cover', display: 'block' }}/>
            : <div style={{ width: '100%', height: pxW * 0.72, background: '#EAE5D9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>📷</div>
          }
          {caption && <div style={{ textAlign: 'center', fontFamily: 'var(--font-hand)', fontSize: '0.82rem', color: '#5A554D', marginTop: 6, paddingBottom: 2 }}>{caption}</div>}
        </div>
      )}

      {style === 'instant_photo' && (
        <div style={{ background: '#fff', padding: '5px 5px 24px', boxShadow: '0 3px 10px rgba(45,42,38,0.2)', width: pxW, border: '1px solid #e8e8e8' }}>
          {imgSrc
            ? <img src={imgSrc} alt="" style={{ width: '100%', height: pxW * 0.8, objectFit: 'cover', display: 'block' }}/>
            : <div style={{ width: '100%', height: pxW * 0.8, background: '#EAE5D9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>📷</div>
          }
          {caption && <div style={{ textAlign: 'center', fontFamily: 'var(--font-hand)', fontSize: '0.75rem', color: '#5A554D', marginTop: 4 }}>{caption}</div>}
        </div>
      )}

      {style === 'torn_edge' && (
        <div style={{ position: 'relative', width: pxW, boxShadow: '0 4px 12px rgba(45,42,38,0.18)' }}>
          {imgSrc
            ? <img src={imgSrc} alt="" style={{ width: '100%', height: pxW * 0.75, objectFit: 'cover', display: 'block' }}/>
            : <div style={{ width: '100%', height: pxW * 0.75, background: '#EAE5D9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>📷</div>
          }
          {/* Torn bottom edge */}
          <div style={{ height: 8, background: 'var(--paper-cream,#F5EBD9)', position: 'relative', overflow: 'hidden' }}>
            <svg width="100%" height="8" preserveAspectRatio="none">
              <path d="M0,0 Q10,8 20,4 Q30,0 40,6 Q50,8 60,2 Q70,0 80,5 Q90,8 100,3 L100,8 L0,8 Z" fill="var(--paper-cream,#F5EBD9)"/>
            </svg>
          </div>
          {caption && <div style={{ fontFamily: 'var(--font-hand)', fontSize: '0.8rem', color: '#5A554D', padding: '3px 6px' }}>{caption}</div>}
        </div>
      )}

      {style === 'postcard_back' && (
        <div style={{ background: '#fff', width: pxW, padding: 8, border: '1px solid #ddd', boxShadow: '0 3px 10px rgba(45,42,38,0.15)' }}>
          {imgSrc
            ? <img src={imgSrc} alt="" style={{ width: '100%', height: pxW * 0.65, objectFit: 'cover', display: 'block' }}/>
            : <div style={{ width: '100%', height: pxW * 0.65, background: '#EAE5D9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>📷</div>
          }
          <div style={{ borderTop: '1px solid #eee', marginTop: 6, paddingTop: 4, display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, fontFamily: 'var(--font-hand)', fontSize: '0.72rem', color: '#999' }}>{caption || 'wish you were here'}</div>
            <div style={{ width: 30, height: 22, border: '1px solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.5rem', color: '#ccc' }}>STAMP</div>
          </div>
        </div>
      )}

      {(style === 'film_strip_single' || (!style && imgSrc)) && (
        <div style={{ background: '#1a1a1a', padding: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', width: pxW }}>
          <div style={{ display: 'flex', gap: 2, padding: '2px 0', justifyContent: 'center' }}>
            {[...Array(7)].map((_,i) => <div key={i} style={{ width: 7, height: 4, background: '#444', borderRadius: 1 }}/>)}
          </div>
          {imgSrc
            ? <img src={imgSrc} alt="" style={{ width: '100%', height: pxW * 0.7, objectFit: 'cover', display: 'block' }}/>
            : <div style={{ width: '100%', height: pxW * 0.7, background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🎞️</div>
          }
          <div style={{ display: 'flex', gap: 2, padding: '2px 0', justifyContent: 'center' }}>
            {[...Array(7)].map((_,i) => <div key={i} style={{ width: 7, height: 4, background: '#444', borderRadius: 1 }}/>)}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Draggable xPct={x} yPct={y} rotation={rotation} isSelected={isSelected}
      onSelect={onSelect} onMove={onMove} zIndex={12} pageW={pageW} pageH={pageH}>
      {inner}
    </Draggable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Paper background
// ─────────────────────────────────────────────────────────────────────────────
function PaperBg({ bg, texture }) {
  const bgColor = PAGE_BG[bg] || '#F4EDD8';
  return (
    <div style={{ position: 'absolute', inset: 0, background: bgColor, zIndex: 0 }}>
      {bg === 'grid_notebook' && (
        <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.15 }}>
          <defs><pattern id="sbgrid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#6B5B3E" strokeWidth="0.5"/>
          </pattern></defs>
          <rect width="100%" height="100%" fill="url(#sbgrid)"/>
        </svg>
      )}
      {bg === 'lined_ruled' && (
        <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.12 }}>
          <defs><pattern id="sblined" width="100%" height="26" patternUnits="userSpaceOnUse">
            <line x1="0" y1="25" x2="100%" y2="25" stroke="#3F6389" strokeWidth="0.6"/>
          </pattern></defs>
          <rect width="100%" height="100%" fill="url(#sblined)"/>
        </svg>
      )}
      {texture === 'light_grain' && (
        <div style={{ position: 'absolute', inset: 0, backgroundImage: "url(\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.045'/></svg>\")", backgroundRepeat: 'repeat', opacity: 0.8 }}/>
      )}
      {texture === 'heavy_grain' && (
        <div style={{ position: 'absolute', inset: 0, backgroundImage: "url(\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.08'/></svg>\")", backgroundRepeat: 'repeat' }}/>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Pre-generation checklist modal
// ─────────────────────────────────────────────────────────────────────────────
function PreGenChecklist({ memory, onProceed, onBack, onAddPhotos }) {
  const [note, setNote] = useState('');
  const photos = [memory.image_url, memory.image_url2, memory.image_url3].filter(Boolean);

  return (
    <div style={{ maxWidth: 540, margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ background: 'var(--paper-cream,#F5EBD9)', border: '1px solid var(--border-mid)', borderRadius: 12, padding: '2rem', boxShadow: '0 6px 24px rgba(45,42,38,0.1)', position: 'relative' }}>
        {/* Tape decoration */}
        <div style={{ position: 'absolute', top: -10, left: 40, width: 80, height: 16, background: '#D7A73E', opacity: 0.7, transform: 'rotate(-2deg)', borderRadius: 2 }}/>
        <div style={{ position: 'absolute', top: -8, right: 60, width: 60, height: 14, background: '#C97B63', opacity: 0.65, transform: 'rotate(1.5deg)', borderRadius: 2 }}/>

        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.7rem', fontWeight: 700, color: 'var(--ink-0)', marginBottom: 6 }}>✨ Create AI Scrapbook</h2>
        <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          AI will craft a handmade scrapbook page from your memory. The more details you add, the more personal it becomes.
        </p>

        {/* Memory summary */}
        <div style={{ background: 'var(--paper-0,#FBF8F1)', borderRadius: 8, padding: '0.9rem 1rem', marginBottom: '1.25rem', border: '1px solid var(--border-light)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 600, color: 'var(--ink-0)', marginBottom: 4 }}>📖 {memory.title}</div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {memory.mood     && <span>😊 {memory.mood}</span>}
            {memory.location && <span>📍 {memory.location}</span>}
            {memory.weather  && <span>🌤 {memory.weather}</span>}
            <span>📅 {new Date(memory.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>

        {/* Photos status */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            📷 Photos ({photos.length} / 10)
          </div>
          {photos.length > 0 ? (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {photos.map((url, i) => (
                <img key={i} src={api.imageUrl(url)} alt="" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 6, border: '2px solid var(--border-mid)', boxShadow: '0 2px 6px rgba(45,42,38,0.1)' }}/>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 60, height: 60, border: '2px dashed var(--border-mid)', borderRadius: 6, cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.5rem' }} onClick={onAddPhotos}>+</div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.8rem', background: 'rgba(215,167,62,0.08)', border: '1px dashed var(--accent-mustard,#D7A73E)', borderRadius: 8 }}>
              <span style={{ fontSize: '1.5rem' }}>📷</span>
              <div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--ink-0)' }}>No photos added yet</div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>Photos make your scrapbook much more personal!</div>
              </div>
              <button onClick={onAddPhotos} style={{ marginLeft: 'auto', padding: '0.35rem 0.8rem', background: 'var(--accent-mustard,#D7A73E)', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, fontFamily: 'var(--font-sans)', flexShrink: 0 }}>Add Photos</button>
            </div>
          )}
        </div>

        {/* Optional note */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ fontFamily: 'var(--font-sans)', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
            💬 Add a personal note <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span>
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. &quot;This was the best day of my life&quot; or &quot;I want it to feel like a travel journal&quot;"
            rows={3}
            style={{ width: '100%', background: 'var(--paper-0,#FBF8F1)', border: '1px solid var(--border-mid)', borderRadius: 8, padding: '0.6rem 0.8rem', fontFamily: 'var(--font-hand)', fontSize: '1rem', resize: 'none', outline: 'none', color: 'var(--ink-0)' }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button onClick={onBack} style={{ padding: '0.6rem 1.1rem', background: 'transparent', border: '1px solid var(--border-mid)', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            Cancel
          </button>
          <button
            onClick={() => onProceed(note)}
            style={{ padding: '0.65rem 1.4rem', background: 'linear-gradient(135deg,#C97B63,#D7A73E)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: '0.92rem', boxShadow: '0 3px 10px rgba(201,123,99,0.35)' }}
          >
            ✨ Generate Scrapbook
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main ScrapbookEditor
// ─────────────────────────────────────────────────────────────────────────────
const EXTRA_STICKERS = ['🎀','💌','🗝️','🧸','🎵','🌙','☀️','❄️','🦋','🌺','🍓','🎪','🪷','🌵','🦚','🪸'];
const WASHI_PRESETS = [
  { color: '#D7A73E', pattern: 'stripes', label: 'Mustard Stripes' },
  { color: '#C97B63', pattern: 'dots',    label: 'Terra Dots' },
  { color: '#6B7B52', pattern: 'solid',   label: 'Forest Solid' },
  { color: '#3F6389', pattern: 'chevron', label: 'Blue Chevron' },
  { color: '#D89BA3', pattern: 'dots',    label: 'Pink Dots' },
  { color: '#C8A87A', pattern: 'solid',   label: 'Kraft Solid' },
];

export default function ScrapbookEditor({ memory, onBack }) {
  const [stage, setStage]     = useState('checklist'); // 'checklist' | 'generating' | 'editor' | 'error'
  const [errorMsg, setErrorMsg] = useState('');
  const [selected, setSelected] = useState(null); // { type, id }
  const [panel, setPanel]     = useState('stickers');
  const [addTextVal, setAddTextVal] = useState('');
  const pageRef  = useRef(null);
  const [pageSize, setPageSize] = useState({ w: 820, h: 1100 });

  // Undo/redo history
  const [history, dispatch] = useReducer(historyReducer, { past: [], present: null, future: [] });
  const layout = history.present;

  // Measure the page container
  useEffect(() => {
    if (pageRef.current) {
      const rect = pageRef.current.getBoundingClientRect();
      setPageSize({ w: rect.width || 820, h: rect.height || 1100 });
    }
  }, [stage]);

  const setLayout = useCallback((updater) => {
    dispatch({ type: 'SET', layout: typeof updater === 'function' ? updater(history.present) : updater });
  }, [history.present]);

  // Generate
  const generate = useCallback(async (extraNote = '') => {
    setStage('generating');
    setErrorMsg('');
    setSelected(null);
    try {
      const memWithNote = extraNote ? { ...memory, content: (memory.content || '') + '\n\nPersonal note: ' + extraNote } : memory;
      const raw = await api.generateScrapbook(memWithNote);
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      parsed.photos          = parsed.photos          || [];
      parsed.torn_papers     = parsed.torn_papers     || [];
      parsed.washi_tapes     = parsed.washi_tapes     || [];
      parsed.stickers        = parsed.stickers        || [];
      parsed.decorations     = parsed.decorations     || [];
      parsed.handwritten_notes = parsed.handwritten_notes || [];
      dispatch({ type: 'INIT', layout: parsed });
      setStage('editor');
    } catch (e) {
      setErrorMsg('Could not generate scrapbook — please try again.');
      setStage('error');
    }
  }, [memory]);

  // ── Mutators ──────────────────────────────────────────────────────────────
  const moveItem = (type, id, nx, ny) => {
    setLayout((prev) => {
      const arr = [...prev[type]];
      const idx = arr.findIndex((el) => el.id === id);
      if (idx < 0) return prev;
      arr[idx] = { ...arr[idx], x: Math.max(0, Math.min(90, nx)), y: Math.max(0, Math.min(90, ny)) };
      return { ...prev, [type]: arr };
    });
  };

  const rotateSelected = (delta) => {
    if (!selected) return;
    setLayout((prev) => {
      const arr = [...prev[selected.type]];
      const idx = arr.findIndex((el) => el.id === selected.id);
      if (idx < 0) return prev;
      arr[idx] = { ...arr[idx], rotation: ((arr[idx].rotation || 0) + delta) % 360 };
      return { ...prev, [selected.type]: arr };
    });
  };

  const deleteSelected = () => {
    if (!selected) return;
    setLayout((prev) => ({ ...prev, [selected.type]: prev[selected.type].filter((el) => el.id !== selected.id) }));
    setSelected(null);
  };

  const addSticker = (emoji) => {
    setLayout((prev) => ({
      ...prev,
      stickers: [...prev.stickers, {
        id: Date.now(), emoji, x: 10 + Math.random() * 60, y: 10 + Math.random() * 70,
        size_rem: 2 + Math.random(), rotation: Math.round(Math.random() * 30 - 15), label: '',
      }],
    }));
  };

  const addWashi = ({ color, pattern }) => {
    setLayout((prev) => ({
      ...prev,
      washi_tapes: [...prev.washi_tapes, {
        id: Date.now(), color, pattern, opacity: 0.7, orientation: 'horizontal',
        x: 5 + Math.random() * 50, y: 5 + Math.random() * 70,
        width_rem: 8 + Math.random() * 8,
      }],
    }));
  };

  const addText = () => {
    if (!addTextVal.trim()) return;
    setLayout((prev) => ({
      ...prev,
      handwritten_notes: [...prev.handwritten_notes, {
        id: Date.now(), text: addTextVal,
        x: 5 + Math.random() * 40, y: 20 + Math.random() * 50,
        width_rem: 12, font_size_rem: 0.95, color: '#5A554D',
        rotation: Math.round(Math.random() * 8 - 4),
        style: 'kalam_handwritten', underline: false,
      }],
    }));
    setAddTextVal('');
  };

  const changePaper = (bg) => setLayout((prev) => ({ ...prev, paper_bg: bg }));

  // Photo urls in order
  const photos = [memory.image_url, memory.image_url2, memory.image_url3].filter(Boolean).map(u => api.imageUrl(u));

  // ── Stage: checklist ──────────────────────────────────────────────────────
  if (stage === 'checklist') {
    return (
      <PreGenChecklist
        memory={memory}
        onBack={onBack}
        onAddPhotos={() => { onBack(); }}
        onProceed={(note) => generate(note)}
      />
    );
  }

  // ── Stage: generating ─────────────────────────────────────────────────────
  if (stage === 'generating') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '55vh', gap: '1.25rem' }}>
        <div style={{ fontSize: '3rem', animation: 'sbSpin 2s linear infinite' }}>✂️</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--ink-0)' }}>Crafting your scrapbook…</h2>
        <p style={{ fontFamily: 'var(--font-hand)', fontSize: '1.05rem', color: 'var(--text-muted)', textAlign: 'center', maxWidth: 380 }}>
          AI is reading your memory, choosing paper textures, placing elements, and making it uniquely yours.
        </p>
        <style>{`@keyframes sbSpin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }`}</style>
      </div>
    );
  }

  // ── Stage: error ──────────────────────────────────────────────────────────
  if (stage === 'error') {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <p style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{errorMsg}</p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button onClick={() => setStage('checklist')} style={{ padding: '0.6rem 1.2rem', background: 'transparent', border: '1px solid var(--border-mid)', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>Back</button>
          <button onClick={() => generate()} style={{ padding: '0.6rem 1.4rem', background: 'var(--accent-terra)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>Try Again</button>
        </div>
      </div>
    );
  }

  if (!layout) return null;

  const accent    = layout.accent_colors || ['#C97B63','#D7A73E','#6B7B52','#3F6389'];
  const themeSets = STICKER_SETS[layout.theme] || EXTRA_STICKERS;
  const fontFor   = (s) => s === 'kalam_handwritten' ? 'var(--font-hand)' : s === 'cursive_italic' ? 'cursive' : 'var(--font-display)';

  // ── Stage: editor ─────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'var(--font-sans)' }}>

      {/* ── Top bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', flexWrap: 'wrap', flexShrink: 0 }}>
        <button onClick={onBack} style={BTN_GHOST}><i className="bx bx-arrow-back"/> Back</button>

        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--ink-0)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          ✨ {layout.page_title || memory.title}
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {/* Undo / Redo */}
          <button onClick={() => dispatch({ type: 'UNDO' })} disabled={!history.past.length} style={{ ...BTN_ICON, opacity: history.past.length ? 1 : 0.35 }} title="Undo"><i className="bx bx-undo"/></button>
          <button onClick={() => dispatch({ type: 'REDO' })} disabled={!history.future.length} style={{ ...BTN_ICON, opacity: history.future.length ? 1 : 0.35 }} title="Redo"><i className="bx bx-redo"/></button>

          {/* Selection tools */}
          {selected && (<>
            <button onClick={() => rotateSelected(-15)} style={BTN_ICON} title="Rotate left"><i className="bx bx-rotate-left"/></button>
            <button onClick={() => rotateSelected(15)}  style={BTN_ICON} title="Rotate right"><i className="bx bx-rotate-right"/></button>
            <button onClick={deleteSelected} style={{ ...BTN_ICON, color: '#C97B63', borderColor: '#C97B63' }} title="Delete"><i className="bx bx-trash"/></button>
          </>)}

          {/* Regenerate */}
          <button onClick={() => setStage('checklist')} style={{ ...BTN_ICON, background: 'var(--ink-0,#2D2A26)', color: '#fff', border: 'none', gap: '0.3rem' }}>
            <i className="bx bx-refresh"/> Regenerate
          </button>
        </div>
      </div>

      {/* ── Editor body: canvas + sidebar ── */}
      <div style={{ display: 'flex', gap: '1.25rem', flex: 1, minHeight: 0, overflow: 'hidden' }}>

        {/* ── Scrapbook page (scrollable) ── */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', display: 'flex', justifyContent: 'center' }}>
          <div
            ref={pageRef}
            onClick={() => setSelected(null)}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 820,
              minHeight: 1100,
              flexShrink: 0,
              boxShadow: '0 8px 40px rgba(45,42,38,0.22)',
              overflow: 'hidden',
              cursor: 'default',
            }}
          >
            {/* Paper background */}
            <PaperBg bg={layout.paper_bg} texture={layout.background_texture}/>

            {/* Accent color top strip */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 7, display: 'flex', zIndex: 6 }}>
              {accent.map((c, i) => <div key={i} style={{ flex: 1, background: c, opacity: 0.65 }}/>)}
            </div>

            {/* Torn papers — background layer */}
            {layout.torn_papers.map((piece) => <TornPaper key={`tp-${piece.id}`} piece={piece}/>)}

            {/* Washi tapes */}
            {layout.washi_tapes.map((w) => (
              <Draggable key={`washi-${w.id}`} xPct={w.x} yPct={w.y} rotation={w.rotation||0}
                isSelected={selected?.type==='washi_tapes' && selected?.id===w.id}
                onSelect={() => setSelected({ type:'washi_tapes', id:w.id })}
                onMove={(nx,ny) => moveItem('washi_tapes',w.id,nx,ny)}
                zIndex={8} pageW={pageSize.w} pageH={pageSize.h}>
                <WashiTape tape={w}/>
              </Draggable>
            ))}

            {/* Photos */}
            {(layout.photos || []).map((ph, i) => (
              <PhotoFrame
                key={`photo-${ph.id}`}
                photo={ph}
                imgSrc={photos[i] || null}
                isSelected={selected?.type==='photos' && selected?.id===ph.id}
                onSelect={() => setSelected({ type:'photos', id:ph.id })}
                onMove={(nx,ny) => moveItem('photos',ph.id,nx,ny)}
                pageW={pageSize.w} pageH={pageSize.h}
              />
            ))}

            {/* Decorations */}
            {layout.decorations.map((d) => (
              <Draggable key={`deco-${d.id}`} xPct={d.x} yPct={d.y} rotation={d.rotation||0}
                isSelected={selected?.type==='decorations' && selected?.id===d.id}
                onSelect={() => setSelected({ type:'decorations', id:d.id })}
                onMove={(nx,ny) => moveItem('decorations',d.id,nx,ny)}
                zIndex={9} pageW={pageSize.w} pageH={pageSize.h}>
                <DecorationElem d={d} photos={photos}/>
              </Draggable>
            ))}

            {/* Stickers */}
            {layout.stickers.map((s) => (
              <Draggable key={`sticker-${s.id}`} xPct={s.x} yPct={s.y} rotation={s.rotation||0}
                isSelected={selected?.type==='stickers' && selected?.id===s.id}
                onSelect={() => setSelected({ type:'stickers', id:s.id })}
                onMove={(nx,ny) => moveItem('stickers',s.id,nx,ny)}
                zIndex={14} pageW={pageSize.w} pageH={pageSize.h}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <div style={{ fontSize: `${(s.size_rem||2)}rem`, lineHeight: 1, userSelect: 'none' }}>{s.emoji}</div>
                  {s.label && <div style={{ fontFamily: 'var(--font-hand)', fontSize: '0.65rem', color: '#5A554D' }}>{s.label}</div>}
                </div>
              </Draggable>
            ))}

            {/* Handwritten notes */}
            {layout.handwritten_notes.map((t) => (
              <Draggable key={`note-${t.id}`} xPct={t.x} yPct={t.y} rotation={t.rotation||0}
                isSelected={selected?.type==='handwritten_notes' && selected?.id===t.id}
                onSelect={() => setSelected({ type:'handwritten_notes', id:t.id })}
                onMove={(nx,ny) => moveItem('handwritten_notes',t.id,nx,ny)}
                zIndex={16} pageW={pageSize.w} pageH={pageSize.h}>
                <div style={{
                  width: `${t.width_rem||14}rem`, fontFamily: fontFor(t.style),
                  fontSize: `${t.font_size_rem||0.9}rem`, color: t.color||'#2D2A26',
                  lineHeight: 1.6, userSelect: 'none',
                  textDecoration: t.underline ? 'underline' : 'none',
                  fontStyle: t.style === 'cursive_italic' ? 'italic' : 'normal',
                }}>
                  {t.text}
                </div>
              </Draggable>
            ))}

            {/* Page title area */}
            <div style={{ position: 'absolute', left: '4%', top: '3.5%', zIndex: 18, maxWidth: '46%' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.2rem,3.5vw,2rem)', fontWeight: 700, color: accent[0]||'var(--ink-0)', lineHeight: 1.2, textShadow: '1px 1px 0 rgba(255,255,255,0.55)' }}>
                {layout.page_title || memory.title}
              </div>
              {layout.caption && (
                <div style={{ fontFamily: 'var(--font-hand)', fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: 4, fontStyle: 'italic' }}>
                  {layout.caption}
                </div>
              )}
            </div>

            {/* Date stamp */}
            {layout.date_stamp && (
              <div style={{ position: 'absolute', left: '4%', top: '9%', zIndex: 18 }}>
                <div style={{ fontFamily: layout.date_stamp.style === 'typewriter' ? 'monospace' : 'var(--font-hand)', fontSize: '0.82rem', color: accent[3]||'#3F6389', border: `1.5px solid ${accent[3]||'#3F6389'}`, padding: '2px 8px', transform: 'rotate(-1deg)', opacity: 0.8, display: 'inline-block' }}>
                  {layout.date_stamp.text}
                </div>
              </div>
            )}

            {/* Location tag */}
            {layout.location_tag?.text && (
              <div style={{ position: 'absolute', left: '4%', top: '12.5%', zIndex: 18 }}>
                <div style={{ fontFamily: 'var(--font-hand)', fontSize: '0.85rem', color: accent[2]||'#6B7B52', display: 'flex', alignItems: 'center', gap: 4 }}>
                  📍 {layout.location_tag.text}
                </div>
              </div>
            )}

            {/* Mood badge */}
            {layout.mood_badge && (
              <div style={{ position: 'absolute', right: '3%', bottom: '3%', zIndex: 18 }}>
                <div style={{ background: layout.mood_badge.color||accent[0], color: '#fff', padding: '4px 12px', borderRadius: 20, fontFamily: 'var(--font-hand)', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 5, boxShadow: '0 2px 8px rgba(45,42,38,0.15)', transform: 'rotate(-3deg)' }}>
                  {layout.mood_badge.emoji} {layout.mood_badge.label}
                </div>
              </div>
            )}

            {/* Weather element */}
            {layout.weather_element?.label && (
              <div style={{ position: 'absolute', right: '3%', bottom: '7%', zIndex: 18, fontFamily: 'var(--font-hand)', fontSize: '0.8rem', color: 'var(--text-muted)', transform: 'rotate(2deg)' }}>
                {layout.weather_element.type === 'rain'  && '🌧️'}
                {layout.weather_element.type === 'sun'   && '☀️'}
                {layout.weather_element.type === 'cloud' && '☁️'}
                {layout.weather_element.type === 'snow'  && '❄️'}
                {layout.weather_element.type === 'wind'  && '💨'}
                {' '}{layout.weather_element.label}
              </div>
            )}

            {/* Doodle if exists */}
            {memory.doodle_url && (
              <div style={{ position: 'absolute', left: '3%', bottom: '8%', zIndex: 15, opacity: 0.85 }}>
                <img src={api.imageUrl(memory.doodle_url)} alt="doodle" style={{ maxWidth: 140, maxHeight: 100, objectFit: 'contain' }}/>
              </div>
            )}

            {/* Entry excerpt — bottom left */}
            <div style={{ position: 'absolute', left: '4%', top: '52%', width: '42%', zIndex: 15 }}>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '0.82rem', color: 'var(--ink-0)', lineHeight: 1.75, opacity: 0.82 }}>
                {stripHtml(memory.content||'').slice(0,400)}{stripHtml(memory.content||'').length>400?'…':''}
              </p>
            </div>
          </div>
        </div>

        {/* ── Right sidebar ── */}
        <div style={{ width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '0.65rem', overflowY: 'auto' }}>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
            {[['stickers','Stickers'],['tape','Tape'],['text','Text'],['paper','Paper']].map(([k,l]) => (
              <button key={k} onClick={() => setPanel(k)} style={{ padding: '0.28rem 0.65rem', borderRadius: 20, border: `1.5px solid ${panel===k?'var(--accent-terra)':'var(--border-mid)'}`, background: panel===k?'var(--accent-terra)':'transparent', color: panel===k?'#fff':'var(--text-secondary)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: panel===k?700:400 }}>{l}</button>
            ))}
          </div>

          {/* Stickers */}
          {panel === 'stickers' && (
            <div>
              <div style={PANEL_LABEL}>Theme</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.65rem' }}>
                {themeSets.map((s,i) => <button key={i} onClick={() => addSticker(s)} style={STICKER_BTN}>{s}</button>)}
              </div>
              <div style={PANEL_LABEL}>More stickers</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                {EXTRA_STICKERS.map((s,i) => <button key={i} onClick={() => addSticker(s)} style={STICKER_BTN}>{s}</button>)}
              </div>
            </div>
          )}

          {/* Washi tape */}
          {panel === 'tape' && (
            <div>
              <div style={PANEL_LABEL}>Add washi tape</div>
              {WASHI_PRESETS.map((w) => (
                <button key={w.label} onClick={() => addWashi(w)} style={{ display:'flex',alignItems:'center',gap:'0.5rem',width:'100%',background:'transparent',border:'1px solid var(--border-light)',borderRadius:6,padding:'5px 8px',cursor:'pointer',marginBottom:5 }}>
                  <div style={{ width:36, height:14, background:w.color, borderRadius:2, opacity:0.75 }}/>
                  <span style={{ fontFamily:'var(--font-sans)', fontSize:'0.78rem', color:'var(--text-secondary)' }}>{w.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Text */}
          {panel === 'text' && (
            <div>
              <div style={PANEL_LABEL}>Add handwritten note</div>
              <textarea value={addTextVal} onChange={(e) => setAddTextVal(e.target.value)}
                placeholder="Write something…" rows={4}
                style={{ width:'100%',background:'var(--paper-cream,#F5EBD9)',border:'1px solid var(--border-mid)',borderRadius:6,padding:'0.5rem',fontFamily:'var(--font-hand)',fontSize:'1rem',resize:'none',outline:'none',marginBottom:'0.5rem',color:'var(--ink-0)' }}/>
              <button onClick={addText} style={{ background:'var(--accent-terra)',color:'#fff',border:'none',borderRadius:6,padding:'0.4rem 1rem',cursor:'pointer',fontWeight:600,fontSize:'0.82rem',width:'100%' }}>Add Note</button>
            </div>
          )}

          {/* Paper */}
          {panel === 'paper' && (
            <div>
              <div style={PANEL_LABEL}>Paper background</div>
              {Object.entries(PAGE_BG).map(([key, col]) => (
                <button key={key} onClick={() => changePaper(key)} style={{ display:'flex',alignItems:'center',gap:'0.5rem',width:'100%',background:layout.paper_bg===key?'rgba(201,123,99,0.08)':'transparent',border:`1.5px solid ${layout.paper_bg===key?'var(--accent-terra)':'var(--border-light)'}`,borderRadius:6,padding:'5px 8px',cursor:'pointer',marginBottom:4 }}>
                  <div style={{ width:28,height:18,background:col,borderRadius:3,border:'1px solid var(--border-mid)' }}/>
                  <span style={{ fontFamily:'var(--font-sans)',fontSize:'0.78rem',color:'var(--text-secondary)',fontWeight:layout.paper_bg===key?700:400,textTransform:'capitalize' }}>{key.replace(/_/g,' ')}</span>
                </button>
              ))}
            </div>
          )}

          {/* Selection hint */}
          {selected && (
            <div style={{ marginTop:'auto',padding:'0.5rem 0.7rem',background:'rgba(63,99,137,0.06)',border:'1px dashed rgba(63,99,137,0.3)',borderRadius:6,fontFamily:'var(--font-hand)',fontSize:'0.85rem',color:'var(--text-muted)' }}>
              ✦ Drag · ↺ Rotate · 🗑 Delete
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Shared mini styles ─────────────────────────────────────────────────────
const BTN_GHOST = { display:'flex',alignItems:'center',gap:'0.3rem',padding:'0.35rem 0.75rem',borderRadius:6,border:'1px solid var(--border-mid)',background:'transparent',color:'var(--text-secondary)',cursor:'pointer',fontFamily:'var(--font-sans)',fontSize:'0.85rem' };
const BTN_ICON  = { display:'flex',alignItems:'center',gap:'0.25rem',padding:'0.32rem 0.7rem',borderRadius:6,border:'1px solid var(--border-mid)',background:'transparent',color:'var(--text-secondary)',cursor:'pointer',fontFamily:'var(--font-sans)',fontSize:'0.83rem' };
const STICKER_BTN = { fontSize:20,background:'var(--paper-cream,#F5EBD9)',border:'1px solid var(--border-light)',borderRadius:6,padding:'3px 5px',cursor:'pointer' };
const PANEL_LABEL = { fontFamily:'var(--font-hand)',fontSize:'0.95rem',color:'var(--text-muted)',marginBottom:'0.4rem' };
