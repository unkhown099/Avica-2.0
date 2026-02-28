import { useState, useEffect, useRef } from 'react';

const THUNDER_BOLTS = [
  { id:0, ox:-180, oy:-30, scale:0.9, delay:0.05, dur:0.12 },
  { id:1, ox:-120, oy:-55, scale:0.6, delay:0.18, dur:0.09 },
  { id:2, ox:-80,  oy:-15, scale:0.75,delay:0.0,  dur:0.14 },
  { id:3, ox:-200, oy:-45, scale:0.5, delay:0.22, dur:0.10 },
  { id:4, ox:-60,  oy:-50, scale:0.8, delay:0.12, dur:0.11 },
  { id:5, ox:-150, oy:-10, scale:0.65,delay:0.08, dur:0.13 },
  { id:6, ox:-240, oy:-35, scale:0.55,delay:0.25, dur:0.09 },
  { id:7, ox:-100, oy:-60, scale:0.7, delay:0.16, dur:0.12 },
];

const SPARKS = [
  { id:0,  ox:-60,  oy:10,  size:4, delay:0.05, dur:0.22 },
  { id:1,  ox:-140, oy:-20, size:3, delay:0.18, dur:0.17 },
  { id:2,  ox:-90,  oy:5,   size:5, delay:0.0,  dur:0.20 },
  { id:3,  ox:-200, oy:-10, size:2, delay:0.30, dur:0.15 },
  { id:4,  ox:-50,  oy:-30, size:3, delay:0.12, dur:0.18 },
  { id:5,  ox:-170, oy:15,  size:4, delay:0.22, dur:0.21 },
  { id:6,  ox:-110, oy:-40, size:3, delay:0.08, dur:0.16 },
  { id:7,  ox:-230, oy:0,   size:2, delay:0.35, dur:0.14 },
  { id:8,  ox:-80,  oy:20,  size:5, delay:0.15, dur:0.19 },
  { id:9,  ox:-150, oy:-25, size:3, delay:0.04, dur:0.23 },
  { id:10, ox:-190, oy:8,   size:4, delay:0.28, dur:0.17 },
  { id:11, ox:-70,  oy:-15, size:2, delay:0.20, dur:0.15 },
];

const CLOUDS = [
  { l:'0%',   t:'8px',  w:'220px', h:'75px', o:0.6  },
  { l:'10%',  t:'-8px', w:'170px', h:'65px', o:0.5  },
  { l:'22%',  t:'18px', w:'190px', h:'60px', o:0.55 },
  { l:'36%',  t:'4px',  w:'150px', h:'55px', o:0.4  },
  { l:'48%',  t:'22px', w:'130px', h:'48px', o:0.28 },
  { l:'58%',  t:'10px', w:'100px', h:'42px', o:0.15 },
];

// City building data - made wider for scrolling effect
const BG_BUILDINGS = [
  { x: 0,   w: 60,  h: 160, windows: [[8,10],[8,30],[8,50],[8,70],[28,10],[28,30],[28,50],[28,70],[48,10],[48,30]] },
  { x: 55,  w: 45,  h: 130, windows: [[8,12],[8,32],[8,52],[25,12],[25,32],[25,52]] },
  { x: 95,  w: 80,  h: 200, windows: [[10,10],[10,30],[10,50],[10,70],[10,90],[10,110],[35,10],[35,30],[35,50],[35,70],[35,90],[60,10],[60,30],[60,50],[60,70],[60,90]] },
  { x: 170, w: 50,  h: 145, windows: [[8,10],[8,30],[8,50],[8,70],[28,10],[28,30],[28,50],[28,70]] },
  { x: 215, w: 70,  h: 185, windows: [[10,10],[10,30],[10,50],[10,70],[10,90],[35,10],[35,30],[35,50],[35,70],[35,90],[55,10],[55,30],[55,50]] },
  { x: 280, w: 55,  h: 120, windows: [[8,12],[8,32],[8,52],[28,12],[28,32],[28,52]] },
  { x: 330, w: 90,  h: 210, windows: [[10,10],[10,30],[10,50],[10,70],[10,90],[10,110],[35,10],[35,30],[35,50],[35,70],[35,90],[60,10],[60,30],[60,50],[60,70],[60,90],[75,10],[75,30],[75,50]] },
  { x: 415, w: 48,  h: 140, windows: [[8,10],[8,30],[8,50],[8,70],[28,10],[28,30],[28,50]] },
  { x: 458, w: 65,  h: 170, windows: [[10,10],[10,30],[10,50],[10,70],[10,90],[35,10],[35,30],[35,50],[35,70],[45,10],[45,30]] },
  { x: 518, w: 55,  h: 125, windows: [[8,12],[8,32],[8,52],[28,12],[28,32],[28,52]] },
  { x: 568, w: 75,  h: 195, windows: [[10,10],[10,30],[10,50],[10,70],[10,90],[35,10],[35,30],[35,50],[35,70],[55,10],[55,30],[55,50],[55,70]] },
  { x: 638, w: 50,  h: 148, windows: [[8,10],[8,30],[8,50],[8,70],[28,10],[28,30],[28,50]] },
  { x: 683, w: 85,  h: 188, windows: [[10,10],[10,30],[10,50],[10,70],[10,90],[35,10],[35,30],[35,50],[35,70],[60,10],[60,30],[60,50],[60,70]] },
  { x: 763, w: 60,  h: 155, windows: [[8,10],[8,30],[8,50],[8,70],[28,10],[28,30],[28,50],[28,70],[45,10],[45,30]] },
  { x: 818, w: 95,  h: 215, windows: [[10,10],[10,30],[10,50],[10,70],[10,90],[10,110],[35,10],[35,30],[35,50],[35,70],[35,90],[65,10],[65,30],[65,50],[65,70],[65,90],[80,10],[80,30]] },
  { x: 908, w: 55,  h: 135, windows: [[8,12],[8,32],[8,52],[28,12],[28,32]] },
  // Extra buildings for seamless loop
  { x: 960, w: 70,  h: 180, windows: [[10,10],[10,30],[10,50],[10,70],[10,90],[35,10],[35,30],[35,50],[35,70],[50,10],[50,30]] },
  { x: 1025, w: 55, h: 145, windows: [[8,12],[8,32],[8,52],[28,12],[28,32],[28,52]] },
  { x: 1075, w: 85, h: 195, windows: [[12,10],[12,30],[12,50],[12,70],[12,90],[40,10],[40,30],[40,50],[40,70],[65,10],[65,30]] },
];

const FG_BUILDINGS = [
  { x: -20, w: 90,  h: 120, windows: [[10,15],[10,40],[10,65],[40,15],[40,40],[40,65],[65,15],[65,40]] },
  { x: 65,  w: 70,  h: 95,  windows: [[10,12],[10,37],[10,62],[40,12],[40,37],[40,62]] },
  { x: 130, w: 110, h: 140, windows: [[12,12],[12,37],[12,62],[12,87],[45,12],[45,37],[45,62],[45,87],[80,12],[80,37],[80,62]] },
  { x: 235, w: 60,  h: 100, windows: [[10,15],[10,40],[10,65],[38,15],[38,40],[38,65]] },
  { x: 290, w: 85,  h: 130, windows: [[10,12],[10,37],[10,62],[10,87],[40,12],[40,37],[40,62],[65,12],[65,37],[65,62]] },
  { x: 370, w: 75,  h: 110, windows: [[10,15],[10,40],[10,65],[38,15],[38,40],[38,65],[58,15],[58,40]] },
  { x: 440, w: 100, h: 145, windows: [[12,12],[12,37],[12,62],[12,87],[45,12],[45,37],[45,62],[45,87],[75,12],[75,37],[75,62]] },
  { x: 535, w: 65,  h: 105, windows: [[10,15],[10,40],[10,65],[40,15],[40,40],[40,65]] },
  { x: 595, w: 80,  h: 125, windows: [[10,12],[10,37],[10,62],[10,87],[45,12],[45,37],[45,62],[60,12],[60,37]] },
  { x: 670, w: 70,  h: 95,  windows: [[10,15],[10,40],[10,65],[40,15],[40,40],[40,65]] },
  { x: 735, w: 95,  h: 135, windows: [[12,12],[12,37],[12,62],[12,87],[45,12],[45,37],[45,62],[70,12],[70,37],[70,62]] },
  { x: 825, w: 55,  h: 90,  windows: [[10,15],[10,40],[10,65],[35,15],[35,40],[35,65]] },
  { x: 875, w: 90,  h: 120, windows: [[10,12],[10,37],[10,62],[10,87],[42,12],[42,37],[42,62],[68,12],[68,37]] },
  { x: 960, w: 65,  h: 100, windows: [[10,15],[10,40],[10,65],[40,15],[40,40]] },
  // Extra foreground buildings for seamless loop
  { x: 1020, w: 85, h: 115, windows: [[12,15],[12,40],[12,65],[45,15],[45,40],[65,15]] },
  { x: 1100, w: 70, h: 90, windows: [[10,12],[10,37],[10,62],[40,12],[40,37]] },
];

// Lit window colors: warm yellow, cool blue-white, reddish
const WIN_COLORS = ['#ffe8a0', '#c8e4ff', '#ffd0b0', '#fff0c0', '#d0eaff'];
// Preassign window lit state and color
const assignWindows = (buildings) =>
  buildings.map(b => ({
    ...b,
    windows: b.windows.map((w, wi) => ({
      x: w[0], y: w[1],
      lit: (b.x * 7 + wi * 13) % 3 !== 0,
      color: WIN_COLORS[(b.x + wi * 5) % WIN_COLORS.length],
      blink: (b.x * 3 + wi * 7) % 11 === 0,
    }))
  }));

const BG_DATA = assignWindows(BG_BUILDINGS);
const FG_DATA = assignWindows(FG_BUILDINGS);

const LoadingScreen = ({ onLoadingComplete }) => {
  const [phase, setPhase] = useState('idle');
  const [fadeOut, setFadeOut] = useState(false);
  const [gone, setGone] = useState(false);
  const [scrollOffset, setScrollOffset] = useState(0);
  const animationRef = useRef();
  const lastTimeRef = useRef();

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase('enter'),   80),
      setTimeout(() => setPhase('race'),   900),
      setTimeout(() => setPhase('exit'),  2200),
      setTimeout(() => setPhase('logo'),  2750),
      setTimeout(() => setFadeOut(true), 4200),
      setTimeout(() => { setGone(true); onLoadingComplete?.(); }, 4900),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  // Scrolling animation for city background
  useEffect(() => {
    const racing = phase === 'race';
    const exiting = phase === 'exit';
    
    if (!racing && !exiting) {
      setScrollOffset(0);
      return;
    }

    const animate = (timestamp) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp;
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      // Scroll speed - faster during race, slower during exit
      const speed = exiting ? 0.15 : 0.25;
      setScrollOffset(prev => {
        const newOffset = prev + deltaTime * speed;
        // Reset offset to create seamless loop (buildings total width ~1200)
        return newOffset % 1200;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      lastTimeRef.current = undefined;
    };
  }, [phase]);

  const racing  = phase === 'race';
  const exiting = phase === 'exit';
  const showLogo = phase === 'logo';
  const carActive = racing || exiting;

  const carLeft = exiting
    ? '130%'
    : (phase === 'race' || phase === 'enter')
      ? '52%'
      : '-25%';

  const carTransition = exiting
    ? 'left 0.55s cubic-bezier(0.6,0,1,0.4)'
    : phase === 'enter'
      ? 'left 0.72s cubic-bezier(0.22,1.2,0.36,1)'
      : 'none';

  // Sky height: ~60% of screen. City ground line at ~40% from bottom.
  // SVG viewport: 1000 wide, 400 tall for city
  const CITY_H = 400;
  const GROUND_Y = CITY_H; // buildings sit on bottom

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#07070d',
      overflow: 'hidden',
      opacity: fadeOut ? 0 : 1,
      transition: fadeOut ? 'opacity 0.65s ease' : 'none',
      pointerEvents: fadeOut ? 'none' : 'auto',
    }}>

      {/* ── MOVING CITY BACKGROUND ── */}
      <div style={{
        position: 'absolute',
        left: 0, right: 0,
        top: 0,
        bottom: '36%', // align with car ground line
        overflow: 'hidden',
        zIndex: 1,
      }}>
        {/* Sky gradient — night with purple/teal city glow */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg, #02020f 0%, #0a0418 35%, #150a25 60%, #1a0e14 80%, #0f0608 100%)',
        }} />

        {/* Moon */}
        <div style={{
          position: 'absolute',
          top: '8%', right: '15%',
          width: 38, height: 38,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 35%, #f5f0e0, #c8c0a8)',
          boxShadow: '0 0 30px 10px rgba(200,190,160,0.18), 0 0 80px 20px rgba(180,170,140,0.08)',
        }} />
        {/* Moon crescent mask */}
        <div style={{
          position: 'absolute',
          top: 'calc(8% - 5px)', right: 'calc(15% - 8px)',
          width: 38, height: 38,
          borderRadius: '50%',
          background: '#050210',
        }} />

        {/* Stars */}
        {Array.from({ length: 60 }, (_, i) => {
          const tx = (i * 137.508) % 100;
          const ty = (i * 83.1) % 55;
          const size = i % 5 === 0 ? 2 : 1;
          const opacity = 0.3 + (i % 7) * 0.1;
          return (
            <div key={i} style={{
              position: 'absolute',
              left: `${tx}%`, top: `${ty}%`,
              width: size, height: size,
              borderRadius: '50%',
              background: '#fff',
              opacity,
              animation: i % 4 === 0 ? `starTwinkle ${1.5 + (i%3)*0.7}s ${(i%5)*0.3}s ease-in-out infinite alternate` : 'none',
            }} />
          );
        })}

        {/* City glow horizon */}
        <div style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          height: '45%',
          background: 'linear-gradient(0deg, rgba(220,30,30,0.12) 0%, rgba(150,20,80,0.08) 30%, transparent 100%)',
          pointerEvents: 'none',
        }} />

        {/* Scrolling Buildings Container */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: carActive ? -scrollOffset : 0,
          width: 'max-content',
          height: '65%',
          transition: carActive ? 'none' : 'left 0.3s ease-out',
          willChange: 'left',
        }}>
          {/* BG Buildings SVG - duplicated for seamless loop */}
          <svg
            style={{ display: 'inline-block', width: 'auto', height: '100%' }}
            viewBox={`0 0 1200 ${CITY_H}`}
            preserveAspectRatio="xMidYMax meet"
          >
            {BG_DATA.map((b, bi) => (
              <g key={bi}>
                {/* Building body */}
                <rect
                  x={b.x} y={GROUND_Y - b.h} width={b.w} height={b.h}
                  fill={`rgba(${12 + bi%4}, ${8 + bi%3}, ${18 + bi%5}, 1)`}
                  stroke="rgba(80,40,120,0.25)" strokeWidth="0.5"
                />
                {/* Roof detail line */}
                <rect x={b.x} y={GROUND_Y - b.h} width={b.w} height={2} fill="rgba(100,60,160,0.5)" />
                {/* Antenna on taller buildings */}
                {b.h > 160 && (
                  <>
                    <rect x={b.x + b.w/2 - 1} y={GROUND_Y - b.h - 18} width={2} height={18} fill="rgba(80,60,120,0.7)" />
                    <circle cx={b.x + b.w/2} cy={GROUND_Y - b.h - 20} r={3} fill="#dc1e1e" opacity="0.9"
                      style={{ animation: `antennaBlink 1.2s ${bi * 0.3}s ease-in-out infinite` }} />
                  </>
                )}
                {/* Windows */}
                {b.windows.map((w, wi) => (
                  <rect
                    key={wi}
                    x={b.x + w.x} y={GROUND_Y - b.h + w.y + 5}
                    width={10} height={8} rx={1}
                    fill={w.lit ? w.color : 'rgba(20,15,35,0.8)'}
                    opacity={w.lit ? (w.blink ? undefined : 0.75) : 0.4}
                    style={w.lit && w.blink ? { animation: `winBlink ${1.8 + wi * 0.4}s ${wi * 0.2}s ease-in-out infinite` } : {}}
                  />
                ))}
              </g>
            ))}
          </svg>
        </div>

        {/* Scrolling FG Buildings Container - faster parallax */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: carActive ? -scrollOffset * 1.5 : 0, // Foreground moves faster for parallax effect
          width: 'max-content',
          height: '45%',
          transition: carActive ? 'none' : 'left 0.3s ease-out',
          willChange: 'left',
        }}>
          {/* FG Buildings SVG */}
          <svg
            style={{ display: 'inline-block', width: 'auto', height: '100%' }}
            viewBox={`0 0 1200 ${CITY_H * 0.65}`}
            preserveAspectRatio="xMidYMax meet"
          >
            {FG_DATA.map((b, bi) => (
              <g key={bi}>
                <rect
                  x={b.x} y={CITY_H * 0.65 - b.h} width={b.w} height={b.h}
                  fill={`rgba(${6 + bi%3}, ${4 + bi%2}, ${10 + bi%4}, 1)`}
                  stroke="rgba(60,30,90,0.3)" strokeWidth="0.5"
                />
                <rect x={b.x} y={CITY_H * 0.65 - b.h} width={b.w} height={2} fill="rgba(80,40,120,0.4)" />
                {b.h > 110 && (
                  <>
                    <rect x={b.x + b.w/2 - 1} y={CITY_H * 0.65 - b.h - 14} width={2} height={14} fill="rgba(60,40,90,0.8)" />
                    <circle cx={b.x + b.w/2} cy={CITY_H * 0.65 - b.h - 16} r={2.5} fill="#ff4444" opacity="0.85"
                      style={{ animation: `antennaBlink 1.5s ${bi * 0.25}s ease-in-out infinite` }} />
                  </>
                )}
                {b.windows.map((w, wi) => (
                  <rect
                    key={wi}
                    x={b.x + w.x} y={CITY_H * 0.65 - b.h + w.y + 5}
                    width={12} height={9} rx={1}
                    fill={w.lit ? w.color : 'rgba(15,10,25,0.9)'}
                    opacity={w.lit ? (w.blink ? undefined : 0.8) : 0.35}
                    style={w.lit && w.blink ? { animation: `winBlink ${2.1 + wi * 0.35}s ${wi * 0.15}s ease-in-out infinite` } : {}}
                  />
                ))}
              </g>
            ))}
          </svg>
        </div>

        {/* Street glow at base */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px',
          background: 'linear-gradient(90deg, transparent, rgba(220,30,30,0.4) 20%, rgba(80,40,160,0.3) 50%, rgba(220,30,30,0.4) 80%, transparent)',
        }} />
      </div>

      {/* Road surface */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        height: '36%',
        background: 'linear-gradient(180deg, #0c0a10 0%, #080608 100%)',
        zIndex: 2,
      }}>
        {/* Road perspective lines - now moving too */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `
            linear-gradient(rgba(180,20,20,0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(180,20,20,0.07) 1px, transparent 1px)
          `,
          backgroundSize: '55px 55px',
          transform: 'perspective(700px) rotateX(38deg) scaleX(1.5)',
          transformOrigin: 'center 0%',
          ...(carActive && {
            backgroundPositionX: `${scrollOffset * 0.5}px`,
            transition: 'none',
          }),
        }} />
        {/* Road center dashes - moving */}
        <div style={{
          position: 'absolute', top: '15%', left: 0, right: 0,
          height: '2px',
          backgroundImage: 'repeating-linear-gradient(90deg, rgba(220,180,30,0.3) 0px, rgba(220,180,30,0.3) 40px, transparent 40px, transparent 80px)',
          ...(carActive && {
            backgroundPositionX: `${scrollOffset * 0.8}px`,
            transition: 'none',
          }),
        }} />
      </div>

      {/* Storm atmosphere top */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '60%',
        background: 'radial-gradient(ellipse at 25% 0%, rgba(50,20,100,0.4) 0%, rgba(10,10,20,0) 65%)',
        pointerEvents: 'none',
        zIndex: 3,
      }} />

      {/* Ground glow */}
      <div style={{
        position: 'absolute',
        bottom: '36%', left: 0, right: 0, height: '2px',
        background: 'linear-gradient(90deg,transparent,#dc1e1e 25%,#ff6060 50%,#dc1e1e 75%,transparent)',
        boxShadow: '0 0 28px 7px rgba(220,30,30,0.55)',
        opacity: carActive ? 1 : 0,
        transition: 'opacity 0.3s',
        zIndex: 6,
      }} />

      {/* Speed lines */}
      {racing && !exiting && Array.from({ length: 14 }, (_, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: `${20 + i * 4.5}%`,
          left: 0, right: 0,
          height: i % 4 === 0 ? '2px' : '1px',
          background: `linear-gradient(90deg,
            transparent 0%,
            rgba(220,30,30,${0.08 + (i%4)*0.07}) 25%,
            rgba(255,255,255,${0.05 + (i%3)*0.04}) 55%,
            transparent 100%)`,
          animation: `speedLine 0.35s ${i * 0.04}s ease-out both`,
          zIndex: 7,
        }} />
      ))}

      {/* ── LIGHTNING STRIPS ── */}
      {racing && !exiting && [
        { top: '28%', delay: '0s',    dur: '0.9s',  color: '#a0c8ff', width: '55%', left: '5%',  thick: 2 },
        { top: '44%', delay: '0.15s', dur: '1.1s',  color: '#c0d8ff', width: '40%', left: '18%', thick: 1 },
        { top: '58%', delay: '0.05s', dur: '0.75s', color: '#80aaff', width: '65%', left: '0%',  thick: 2 },
        { top: '35%', delay: '0.28s', dur: '1.0s',  color: '#b0ccff', width: '30%', left: '30%', thick: 1 },
        { top: '50%', delay: '0.42s', dur: '0.85s', color: '#90bbff', width: '48%', left: '10%', thick: 1 },
      ].map((s, i) => (
        <div key={`ls-${i}`} style={{
          position: 'absolute',
          top: s.top,
          left: s.left,
          width: s.width,
          height: `${s.thick}px`,
          background: `linear-gradient(90deg,
            transparent 0%,
            ${s.color} 20%,
            #ffffff 50%,
            ${s.color} 75%,
            transparent 100%)`,
          boxShadow: `0 0 6px 2px ${s.color}, 0 0 14px 4px ${s.color}55`,
          borderRadius: '2px',
          animation: `lightningStrip ${s.dur} ${s.delay}s ease-in-out infinite`,
          pointerEvents: 'none',
          zIndex: 7,
        }} />
      ))}

      {/* ── THUNDER STORM TRAIL ── */}
      {carActive && (
        <div style={{
          position: 'absolute',
          bottom: '34%',
          left: exiting ? '-40%' : '2%',
          width: '52%',
          height: '130px',
          transition: exiting ? 'left 0.45s ease-in' : 'none',
          pointerEvents: 'none',
          zIndex: 8,
          overflow: 'visible',
        }}>
          {CLOUDS.map((c, i) => (
            <div key={i} style={{
              position: 'absolute',
              left: c.l, top: c.t,
              width: c.w, height: c.h,
              borderRadius: '50%',
              background: 'radial-gradient(ellipse at 40% 40%, rgba(70,50,130,0.95), rgba(25,15,60,0.75))',
              filter: 'blur(20px)',
              opacity: c.o,
              animation: `cloudPulse ${0.7 + i * 0.18}s ${i * 0.09}s ease-in-out infinite alternate`,
            }} />
          ))}
          <div style={{
            position: 'absolute', left: '3%', top: '-5px',
            width: '55%', height: '100px',
            background: 'radial-gradient(ellipse, rgba(110,80,255,0.4), transparent 70%)',
            filter: 'blur(14px)',
            animation: 'cloudPulse 0.25s ease-in-out infinite alternate',
          }} />
          {THUNDER_BOLTS.map(b => (
            <div key={b.id} style={{
              position: 'absolute',
              left: `calc(95% + ${b.ox * 0.45}px)`,
              top: `${b.oy + 55}px`,
              transform: `scale(${b.scale})`,
              transformOrigin: 'top center',
              animation: `boltFlash ${b.dur}s ${b.delay}s ease-in-out infinite`,
              filter: 'drop-shadow(0 0 6px rgba(160,200,255,0.95))',
            }}>
              <svg width="24" height="46" viewBox="0 0 24 46" fill="none">
                <path d="M17 0 L3 26 L12 26 L6 46 L22 17 L13 17 Z" fill="url(#tbolt)" />
                <defs>
                  <linearGradient id="tbolt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#ffffff" />
                    <stop offset="30%"  stopColor="#d0e8ff" />
                    <stop offset="100%" stopColor="#6aabff" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          ))}
          {SPARKS.map(s => (
            <div key={s.id} style={{
              position: 'absolute',
              left: `calc(95% + ${s.ox * 0.45}px)`,
              top: `${s.oy + 70}px`,
              width: s.size, height: s.size,
              borderRadius: '50%',
              background: s.id % 3 === 0 ? '#ffe060' : s.id % 3 === 1 ? '#b8d8ff' : '#ff8040',
              boxShadow: `0 0 ${s.size * 3}px ${s.size}px ${
                s.id % 3 === 0 ? 'rgba(255,200,40,0.8)' : 'rgba(130,170,255,0.8)'
              }`,
              animation: `sparkFloat ${s.dur}s ${s.delay}s ease-in-out infinite`,
              opacity: 0,
            }} />
          ))}
          <div style={{
            position: 'fixed', inset: 0,
            background: 'rgba(80,60,200,0.04)',
            animation: 'screenFlash 0.55s 0.08s ease-in-out infinite',
            pointerEvents: 'none',
          }} />
        </div>
      )}

      {/* ── CAR SVG ── */}
      <div style={{
        position: 'absolute',
        bottom: '36%',
        left: carLeft,
        transform: 'translateX(-50%)',
        transition: carTransition,
        zIndex: 10,
        filter: carActive
          ? 'drop-shadow(0 0 18px rgba(220,30,30,0.9)) drop-shadow(0 4px 32px rgba(220,30,30,0.45))'
          : 'none',
      }}>
        <svg width="310" height="118" viewBox="0 0 310 118" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="152" cy="106" rx="142" ry="9" fill="rgba(0,0,0,0.55)" />
          <path d="M24 78 Q30 56 60 52 Q87 34 128 27 Q158 20 182 24 Q218 22 244 42 Q268 52 272 66 Q275 76 269 80 L24 80 Z" fill="url(#cBody)" />
          <path d="M100 52 Q116 24 162 18 Q198 14 220 31 Q244 42 250 52" fill="url(#cRoof)" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
          <path d="M160 22 Q175 15 210 24 Q234 34 246 51 L210 51 Q192 34 172 28 Z" fill="url(#cGlass)" opacity="0.85" />
          <path d="M104 51 Q118 24 154 20 L168 24 Q136 31 124 51 Z" fill="url(#cGlass)" opacity="0.65" />
          <path d="M32 70 Q145 65 268 70" stroke="rgba(220,30,30,0.7)" strokeWidth="2" />
          <line x1="164" y1="52" x2="164" y2="78" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
          <line x1="212" y1="46" x2="212" y2="78" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
          <rect x="238" y="58" width="20" height="8" rx="1.5" fill="none" stroke="rgba(220,30,30,0.3)" strokeWidth="0.5" />
          {[0,4,8,12,16].map(ox => (
            <line key={ox} x1={240+ox} y1="58" x2={240+ox} y2="66" stroke="rgba(220,30,30,0.4)" strokeWidth="1" />
          ))}
          <rect x="16" y="66" width="26" height="4" rx="2" fill="#161616" stroke="rgba(220,30,30,0.5)" strokeWidth="0.5" />
          <line x1="19" y1="66" x2="19" y2="78" stroke="#161616" strokeWidth="2.5" />
          <line x1="38" y1="66" x2="38" y2="78" stroke="#161616" strokeWidth="2.5" />
          <path d="M264 74 Q278 71 281 77 Q279 82 264 80 Z" fill="url(#cBumper)" />
          <path d="M256 61 Q270 58 278 67 Q274 63 256 65 Z" fill="url(#cHeadlight)" />
          {carActive && <path d="M279 64 L340 53 L340 73 Z" fill="url(#cBeam)" opacity="0.3" />}
          <rect x="22" y="62" width="16" height="10" rx="1.5" fill="url(#cTail)" />
          {carActive && <rect x="22" y="62" width="16" height="10" rx="1.5" fill="rgba(255,30,30,0.35)" filter="url(#tailGlw)" />}
          {carActive && !exiting && (
            <>
              <path d="M22 76 Q4 72 -16 77 Q-2 70 -22 68 Q-6 63 -18 58 Q0 65 7 70 Q14 67 22 73 Z"
                fill="url(#cFlame)"
                style={{ animation: 'flicker 0.08s ease-in-out infinite alternate' }} />
              <ellipse cx="2" cy="72" rx="20" ry="8" fill="rgba(200,30,30,0.22)" filter="url(#xBlur)" />
            </>
          )}
          <circle cx="228" cy="92" r="24" fill="#0b0b0b" stroke="#1a1a1a" strokeWidth="2" />
          <circle cx="228" cy="92" r="20" fill="url(#cW1)" />
          <circle cx="228" cy="92" r="9"  fill="#0e0e0e" />
          <circle cx="228" cy="92" r="5.5" fill="#dc1e1e" />
          {[0,60,120,180,240,300].map((a,i)=>(
            <line key={i}
              x1={228+Math.cos(a*Math.PI/180)*9}  y1={92+Math.sin(a*Math.PI/180)*9}
              x2={228+Math.cos(a*Math.PI/180)*19} y2={92+Math.sin(a*Math.PI/180)*19}
              stroke="#232323" strokeWidth="3.5" />
          ))}
          <circle cx="74" cy="92" r="24" fill="#0b0b0b" stroke="#1a1a1a" strokeWidth="2" />
          <circle cx="74" cy="92" r="20" fill="url(#cW2)" />
          <circle cx="74" cy="92" r="9"  fill="#0e0e0e" />
          <circle cx="74" cy="92" r="5.5" fill="#dc1e1e" />
          {[0,60,120,180,240,300].map((a,i)=>(
            <line key={i}
              x1={74+Math.cos(a*Math.PI/180)*9}  y1={92+Math.sin(a*Math.PI/180)*9}
              x2={74+Math.cos(a*Math.PI/180)*19} y2={92+Math.sin(a*Math.PI/180)*19}
              stroke="#232323" strokeWidth="3.5" />
          ))}
          <defs>
            <linearGradient id="cBody" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#282828" />
              <stop offset="45%"  stopColor="#161616" />
              <stop offset="100%" stopColor="#0a0a0a" />
            </linearGradient>
            <linearGradient id="cRoof" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#1e1e1e" />
              <stop offset="100%" stopColor="#0c0c0c" />
            </linearGradient>
            <linearGradient id="cGlass" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%"   stopColor="#1a3848" />
              <stop offset="100%" stopColor="#0a1e2c" />
            </linearGradient>
            <linearGradient id="cBumper" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#181818" />
              <stop offset="100%" stopColor="#2c2c2c" />
            </linearGradient>
            <radialGradient id="cHeadlight" cx="70%" cy="50%">
              <stop offset="0%"   stopColor="#fffbe0" />
              <stop offset="60%"  stopColor="#ffd700" />
              <stop offset="100%" stopColor="#ff8800" />
            </radialGradient>
            <linearGradient id="cBeam" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stopColor="rgba(255,248,180,0.55)" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
            <radialGradient id="cTail" cx="50%" cy="50%">
              <stop offset="0%"   stopColor="#ff2020" />
              <stop offset="100%" stopColor="#7a0000" />
            </radialGradient>
            <linearGradient id="cFlame" x1="1" y1="0" x2="0" y2="0">
              <stop offset="0%"   stopColor="#ff4000" />
              <stop offset="35%"  stopColor="#ff8800" />
              <stop offset="65%"  stopColor="#ffcc00" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
            <linearGradient id="cW1" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#242424" />
              <stop offset="100%" stopColor="#0e0e0e" />
            </linearGradient>
            <linearGradient id="cW2" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#161616" />
              <stop offset="100%" stopColor="#202020" />
            </linearGradient>
            <filter id="xBlur"><feGaussianBlur stdDeviation="4" /></filter>
            <filter id="tailGlw" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="4" />
            </filter>
          </defs>
        </svg>
      </div>

      {/* ── LOGO ── */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        display: 'flex', alignItems: 'center', gap: '1px',
        zIndex: 20, pointerEvents: 'none',
      }}>
        {'otokwikk'.split('').map((l, i) => (
          <span key={i} style={{
            fontSize: 'clamp(50px, 9.5vw, 90px)',
            fontWeight: 900,
            fontFamily: "'Bebas Neue', 'Impact', sans-serif",
            letterSpacing: '0.04em',
            display: 'inline-block',
            color: i < 3 ? '#dc1e1e' : '#f0f0f0',
            textShadow: i < 3
              ? '0 0 25px rgba(220,30,30,0.9), 0 0 55px rgba(220,30,30,0.5)'
              : '0 0 18px rgba(240,240,240,0.25)',
            opacity: showLogo ? 1 : 0,
            transform: showLogo ? 'translateY(0) scale(1)' : 'translateY(28px) scale(0.82)',
            transition: `opacity 0.45s cubic-bezier(0.34,1.56,0.64,1) ${i*60}ms,
                         transform 0.45s cubic-bezier(0.34,1.56,0.64,1) ${i*60}ms`,
          }}>{l}</span>
        ))}
      </div>

      {/* Tagline */}
      <div style={{
        position: 'absolute', bottom: '22%', left: '50%',
        transform: 'translateX(-50%)',
        color: 'rgba(255,255,255,0.28)',
        fontSize: '10px', letterSpacing: '0.45em',
        textTransform: 'uppercase',
        fontFamily: "'Helvetica Neue', sans-serif",
        whiteSpace: 'nowrap',
        opacity: showLogo ? 1 : 0,
        transition: 'opacity 0.7s ease 0.5s',
        zIndex: 20,
      }}>
        Auto Services Redefined
      </div>

      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.82) 100%)',
        pointerEvents: 'none', zIndex: 15,
      }} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');

        @keyframes boltFlash {
          0%   { opacity: 0.05; filter: drop-shadow(0 0 3px rgba(160,200,255,0.3)); }
          45%  { opacity: 1;    filter: drop-shadow(0 0 10px rgba(160,200,255,1)); }
          100% { opacity: 0.08; filter: drop-shadow(0 0 2px rgba(160,200,255,0.2)); }
        }
        @keyframes sparkFloat {
          0%   { opacity: 0;   transform: translate(0,0) scale(0.5); }
          40%  { opacity: 1;   transform: translate(-10px,-15px) scale(1.3); }
          100% { opacity: 0;   transform: translate(-22px,-8px) scale(0.3); }
        }
        @keyframes cloudPulse {
          0%   { opacity: 0.65; transform: scale(1); }
          100% { opacity: 1;    transform: scale(1.06); }
        }
        @keyframes screenFlash {
          0%   { opacity: 0; }
          8%   { opacity: 1; }
          20%  { opacity: 0; }
          100% { opacity: 0; }
        }
        @keyframes flicker {
          0%   { transform: scaleX(1)   scaleY(1);   opacity: 1; }
          100% { transform: scaleX(1.45) scaleY(0.78); opacity: 0.72; }
        }
        @keyframes speedLine {
          0%   { opacity: 0; transform: scaleX(0); }
          25%  { opacity: 1; }
          100% { opacity: 0.35; transform: scaleX(1); }
        }
        @keyframes lightningStrip {
          0%   { opacity: 0;    transform: scaleX(0.2) translateX(-30%); }
          15%  { opacity: 1;    transform: scaleX(1)   translateX(0%); }
          60%  { opacity: 0.85; transform: scaleX(1)   translateX(0%); }
          80%  { opacity: 0.2;  transform: scaleX(1.1) translateX(5%); }
          100% { opacity: 0;    transform: scaleX(0.3) translateX(20%); }
        }
        @keyframes starTwinkle {
          0%   { opacity: 0.2; transform: scale(0.8); }
          100% { opacity: 0.9; transform: scale(1.4); }
        }
        @keyframes antennaBlink {
          0%, 45%  { opacity: 0.9; }
          50%, 95% { opacity: 0.1; }
          100%     { opacity: 0.9; }
        }
        @keyframes winBlink {
          0%, 40%  { opacity: 0.8; }
          45%, 55% { opacity: 0.15; }
          60%, 100%{ opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;