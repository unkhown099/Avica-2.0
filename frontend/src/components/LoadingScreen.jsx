import { useState, useEffect, useRef } from "react";

const RAIN_DROPS = Array.from({ length: 120 }, (_, i) => ({
  id: i,
  left: `${(i * 37.7) % 100}%`,
  delay: `${(i * 0.13) % 2}s`,
  dur: `${0.5 + ((i * 0.07) % 0.6)}s`,
  height: `${60 + ((i * 17) % 80)}px`,
  opacity: 0.08 + (i % 7) * 0.04,
  slant: `${-5 + (i % 3) * 2}deg`,
}));

const PUDDLE_RIPPLES = Array.from({ length: 5 }, (_, i) => ({
  id: i,
  left: `${15 + i * 17}%`,
  delay: `${i * 0.6}s`,
  dur: `${1.8 + i * 0.3}s`,
}));

const LoadingScreen = ({ onLoadingComplete }) => {
  const [phase, setPhase] = useState("idle");
  const [fadeOut, setFadeOut] = useState(false);
  const [gone, setGone] = useState(false);
  const [lightning, setLightning] = useState(false);
  const lightningRef = useRef();

  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase("enter"), 100),
      setTimeout(() => setPhase("logo"), 1800),
      setTimeout(() => setFadeOut(true), 3200),
      setTimeout(() => {
        document.body.style.overflow = "";
        document.documentElement.style.overflow = "";

        window.scrollTo({
          top: 0,
          left: 0,
          behavior: "instant",
        });

        setGone(true);
        onLoadingComplete?.();
      }, 3800),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  // Random lightning flashes
  useEffect(() => {
    const flash = () => {
      setLightning(true);
      setTimeout(() => setLightning(false), 120);
      lightningRef.current = setTimeout(flash, 2000 + Math.random() * 3000);
    };
    lightningRef.current = setTimeout(flash, 800);
    return () => clearTimeout(lightningRef.current);
  }, []);

  if (gone) return null;

  const driving = phase === "enter" || phase === "logo";
  const showLogo = phase === "logo";

  const carLeft = phase === "idle" ? "-25%" : "115%";
  const carTransition =
    phase === "enter" ? "left 2.8s cubic-bezier(0.25, 0.1, 0.25, 1)" : "none";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#04040a",
        overflow: "hidden",
        opacity: fadeOut ? 0 : 1,
        transition: fadeOut ? "opacity 0.55s ease" : "none",
      }}
    >
      {/* ── SKY GRADIENT ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, #03030d 0%, #080418 35%, #0e0520 60%, #080308 100%)",
        }}
      />

      {/* ── LIGHTNING FLASH ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(180,200,255,0.06)",
          opacity: lightning ? 1 : 0,
          transition: lightning ? "none" : "opacity 0.15s ease",
          pointerEvents: "none",
          zIndex: 2,
        }}
      />

      {lightning && (
        <div
          style={{
            position: "absolute",
            top: "5%",
            left: "40%",
            zIndex: 3,
            pointerEvents: "none",
            filter: "drop-shadow(0 0 8px rgba(180,210,255,1))",
          }}
        >
          <svg width="18" height="60" viewBox="0 0 18 60" fill="none">
            <path
              d="M14 0 L2 32 L9 32 L4 60 L17 24 L10 24 Z"
              fill="url(#lbolt)"
            />
            <defs>
              <linearGradient id="lbolt" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#90c0ff" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      )}

      {/* ── DISTANT CITY GLOW ── */}
      <div
        style={{
          position: "absolute",
          bottom: "34%",
          left: 0,
          right: 0,
          height: "180px",
          background:
            "linear-gradient(0deg, rgba(180,20,20,0.08) 0%, rgba(80,20,120,0.06) 40%, transparent 100%)",
          filter: "blur(2px)",
          zIndex: 1,
        }}
      />

      {/* ── CITY SILHOUETTE ── */}
      <div
        style={{
          position: "absolute",
          bottom: "34%",
          left: 0,
          right: 0,
          height: "140px",
          zIndex: 2,
        }}
      >
        <svg
          width="100%"
          height="140"
          viewBox="0 0 1200 140"
          preserveAspectRatio="none"
        >
          {[
            [0, 40, 80, 140],
            [75, 60, 50, 110],
            [120, 30, 70, 140],
            [185, 50, 45, 120],
            [225, 20, 90, 140],
            [310, 45, 55, 120],
            [360, 35, 65, 130],
            [420, 55, 40, 110],
            [455, 25, 75, 140],
            [525, 48, 50, 115],
            [570, 32, 85, 140],
            [650, 42, 55, 120],
            [700, 18, 95, 140],
            [790, 38, 60, 125],
            [845, 28, 70, 140],
            [910, 50, 50, 115],
            [955, 22, 80, 140],
            [1030, 44, 55, 120],
            [1080, 36, 70, 140],
            [1145, 52, 55, 115],
          ].map(([x, gap, w, h], i) => (
            <rect
              key={i}
              x={x}
              y={140 - h}
              width={w}
              height={h}
              fill={`rgba(${5 + (i % 3)},${3 + (i % 2)},${8 + (i % 4)},1)`}
              stroke="rgba(60,20,80,0.3)"
              strokeWidth="0.5"
            />
          ))}
          {[
            [240, 140],
            [460, 140],
            [575, 140],
            [705, 140],
            [960, 140],
          ].map(([x, h], i) => (
            <circle
              key={i}
              cx={x + 47}
              cy={140 - h - 4}
              r={2.5}
              fill="#dc1e1e"
              opacity="0.8"
              style={{
                animation: `antBlink 1.3s ${i * 0.4}s ease-in-out infinite`,
              }}
            />
          ))}
        </svg>
      </div>

      {/* ── WET ROAD ── */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "34%",
          zIndex: 3,
          background: "linear-gradient(180deg, #080608 0%, #060406 100%)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "60%",
            background:
              "linear-gradient(180deg, rgba(220,30,30,0.12) 0%, rgba(80,30,120,0.06) 50%, transparent 100%)",
            filter: "blur(1px)",
          }}
        />
        {driving && (
          <div
            style={{
              position: "absolute",
              top: 0,
              height: "30px",
              left: carLeft,
              width: "180px",
              transform: "translateX(-50%)",
              background:
                "radial-gradient(ellipse, rgba(220,30,30,0.25) 0%, transparent 70%)",
              filter: "blur(6px)",
              transition: carTransition,
            }}
          />
        )}
        <div
          style={{
            position: "absolute",
            top: "18%",
            left: 0,
            right: 0,
            height: "2px",
            backgroundImage:
              "repeating-linear-gradient(90deg, rgba(180,140,20,0.2) 0px, rgba(180,140,20,0.2) 40px, transparent 40px, transparent 90px)",
            animation: driving ? "dashMove 0.55s linear infinite" : "none",
          }}
        />
        {PUDDLE_RIPPLES.map((p) => (
          <div
            key={p.id}
            style={{
              position: "absolute",
              bottom: "20%",
              left: p.left,
              width: "60px",
              height: "8px",
              borderRadius: "50%",
              border: "1px solid rgba(220,30,30,0.15)",
              animation: `ripple ${p.dur} ${p.delay} ease-out infinite`,
            }}
          />
        ))}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "2px",
            background:
              "linear-gradient(90deg, transparent, rgba(220,30,30,0.5) 30%, rgba(220,30,30,0.7) 50%, rgba(220,30,30,0.5) 70%, transparent)",
            boxShadow: "0 0 18px 4px rgba(220,30,30,0.25)",
          }}
        />
      </div>

      {/* ── RAIN ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 5,
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        {RAIN_DROPS.map((d) => (
          <div
            key={d.id}
            style={{
              position: "absolute",
              left: d.left,
              top: "-80px",
              width: "1px",
              height: d.height,
              background:
                "linear-gradient(180deg, transparent, rgba(160,190,255,0.6), transparent)",
              opacity: d.opacity,
              transform: `rotate(${d.slant})`,
              animation: `rainFall ${d.dur} ${d.delay} linear infinite`,
            }}
          />
        ))}
      </div>

      {/* Rain mist */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 4,
          pointerEvents: "none",
          background:
            "radial-gradient(ellipse at 50% 40%, rgba(100,120,180,0.04) 0%, transparent 70%)",
        }}
      />

      {/* ── CAR ── */}
      <div
        style={{
          position: "absolute",
          top: "calc(66% - 94px)",
          left: carLeft,
          transform: "translateX(-50%)",
          transition: carTransition,
          zIndex: 10,
          filter: driving
            ? "drop-shadow(0 0 14px rgba(220,30,30,0.9)) drop-shadow(0 2px 28px rgba(220,30,30,0.45))"
            : "none",
        }}
      >
        <svg width="240" height="92" viewBox="0 0 310 118" fill="none">
          <ellipse cx="152" cy="106" rx="142" ry="9" fill="rgba(0,0,0,0.5)" />
          <path
            d="M24 78 Q30 56 60 52 Q87 34 128 27 Q158 20 182 24 Q218 22 244 42 Q268 52 272 66 Q275 76 269 80 L24 80 Z"
            fill="url(#cBody)"
          />
          <path
            d="M100 52 Q116 24 162 18 Q198 14 220 31 Q244 42 250 52"
            fill="url(#cRoof)"
          />
          <path
            d="M160 22 Q175 15 210 24 Q234 34 246 51 L210 51 Q192 34 172 28 Z"
            fill="url(#cGlass)"
            opacity="0.85"
          />
          <path
            d="M104 51 Q118 24 154 20 L168 24 Q136 31 124 51 Z"
            fill="url(#cGlass)"
            opacity="0.65"
          />
          <path
            d="M32 70 Q145 65 268 70"
            stroke="rgba(220,30,30,0.6)"
            strokeWidth="1.5"
          />
          <path
            d="M264 74 Q278 71 281 77 Q279 82 264 80 Z"
            fill="url(#cBumper)"
          />
          <path
            d="M256 61 Q270 58 278 67 Q274 63 256 65 Z"
            fill="url(#cHeadlight)"
          />
          {driving && (
            <path
              d="M279 64 L360 50 L360 76 Z"
              fill="url(#cBeam)"
              opacity="0.2"
            />
          )}
          <rect
            x="22"
            y="62"
            width="16"
            height="10"
            rx="1.5"
            fill="url(#cTail)"
          />
          {driving && (
            <path
              d="M22 76 Q4 72 -16 77 Q-2 70 -22 68 Q-6 63 -18 58 Q0 65 7 70 Q14 67 22 73 Z"
              fill="url(#cFlame)"
              style={{
                animation: "flicker 0.09s ease-in-out infinite alternate",
              }}
            />
          )}
          <circle
            cx="228"
            cy="92"
            r="24"
            fill="#0b0b0b"
            stroke="#1a1a1a"
            strokeWidth="2"
          />
          <circle cx="228" cy="92" r="20" fill="url(#cW1)" />
          <circle cx="228" cy="92" r="9" fill="#0e0e0e" />
          <circle cx="228" cy="92" r="5.5" fill="#dc1e1e" />
          {[0, 60, 120, 180, 240, 300].map((a, i) => (
            <line
              key={i}
              x1={228 + Math.cos((a * Math.PI) / 180) * 9}
              y1={92 + Math.sin((a * Math.PI) / 180) * 9}
              x2={228 + Math.cos((a * Math.PI) / 180) * 19}
              y2={92 + Math.sin((a * Math.PI) / 180) * 19}
              stroke="#232323"
              strokeWidth="3.5"
            />
          ))}
          <circle
            cx="74"
            cy="92"
            r="24"
            fill="#0b0b0b"
            stroke="#1a1a1a"
            strokeWidth="2"
          />
          <circle cx="74" cy="92" r="20" fill="url(#cW2)" />
          <circle cx="74" cy="92" r="9" fill="#0e0e0e" />
          <circle cx="74" cy="92" r="5.5" fill="#dc1e1e" />
          {[0, 60, 120, 180, 240, 300].map((a, i) => (
            <line
              key={i}
              x1={74 + Math.cos((a * Math.PI) / 180) * 9}
              y1={92 + Math.sin((a * Math.PI) / 180) * 9}
              x2={74 + Math.cos((a * Math.PI) / 180) * 19}
              y2={92 + Math.sin((a * Math.PI) / 180) * 19}
              stroke="#232323"
              strokeWidth="3.5"
            />
          ))}
          <defs>
            <linearGradient id="cBody" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#282828" />
              <stop offset="45%" stopColor="#161616" />
              <stop offset="100%" stopColor="#0a0a0a" />
            </linearGradient>
            <linearGradient id="cRoof" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1e1e1e" />
              <stop offset="100%" stopColor="#0c0c0c" />
            </linearGradient>
            <linearGradient id="cGlass" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1a3848" />
              <stop offset="100%" stopColor="#0a1e2c" />
            </linearGradient>
            <linearGradient id="cBumper" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#181818" />
              <stop offset="100%" stopColor="#2c2c2c" />
            </linearGradient>
            <radialGradient id="cHeadlight" cx="70%" cy="50%">
              <stop offset="0%" stopColor="#fffbe0" />
              <stop offset="60%" stopColor="#ffd700" />
              <stop offset="100%" stopColor="#ff8800" />
            </radialGradient>
            <linearGradient id="cBeam" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(255,248,180,0.5)" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
            <radialGradient id="cTail" cx="50%" cy="50%">
              <stop offset="0%" stopColor="#ff2020" />
              <stop offset="100%" stopColor="#7a0000" />
            </radialGradient>
            <linearGradient id="cFlame" x1="1" y1="0" x2="0" y2="0">
              <stop offset="0%" stopColor="#ff4000" />
              <stop offset="35%" stopColor="#ff8800" />
              <stop offset="65%" stopColor="#ffcc00" />
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
          </defs>
        </svg>
      </div>

      {/* Speed lines */}
      {driving &&
        !showLogo &&
        [...Array(5)].map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: `${55 + i * 3}%`,
              left: 0,
              right: 0,
              height: "1px",
              background: `linear-gradient(90deg, transparent 10%, rgba(220,30,30,${0.05 + i * 0.04}) 40%, rgba(255,255,255,0.04) 60%, transparent 90%)`,
              animation: `speedLine 0.4s ${i * 0.05}s ease-out infinite`,
              zIndex: 9,
            }}
          />
        ))}

      {/* ── LOGO — true center ── */}
      <div
        style={{
          position: "absolute",
          top: "58%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 20,
          pointerEvents: "none",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* reflection glow on the wet road */}
        <div
          style={{
            position: "absolute",
            top: "100%",
            width: "320px",
            height: "60px",
            background:
              "radial-gradient(ellipse, rgba(220,30,30,0.35) 0%, transparent 70%)",
            filter: "blur(8px)",
            zIndex: -1,
          }}
        />
        <div style={{ display: "flex", gap: "1px" }}>
          {"otokwikk".split("").map((l, i) => (
            <span
              key={i}
              style={{
                fontSize: "clamp(48px, 8vw, 82px)",
                fontWeight: 900,
                fontFamily: "'Bebas Neue', 'Impact', sans-serif",
                letterSpacing: "0.05em",
                color: i < 3 ? "#dc1e1e" : "#f0f0f0",
                textShadow:
                  i < 3
                    ? "0 0 30px rgba(220,30,30,0.9), 0 0 60px rgba(220,30,30,0.4)"
                    : "0 0 20px rgba(240,240,240,0.2)",
                opacity: showLogo ? 1 : 0,
                transform: showLogo
                  ? "translateY(0) scale(1)"
                  : "translateY(20px) scale(0.88)",
                transition: `opacity 0.4s cubic-bezier(0.34,1.56,0.64,1) ${i * 55}ms,
                           transform 0.4s cubic-bezier(0.34,1.56,0.64,1) ${i * 55}ms`,
              }}
            >
              {l}
            </span>
          ))}
        </div>
        <div
          style={{
            color: "rgba(255,255,255,0.3)",
            fontSize: "9px",
            letterSpacing: "0.5em",
            textTransform: "uppercase",
            fontFamily: "'Helvetica Neue', sans-serif",
            opacity: showLogo ? 1 : 0,
            transition: "opacity 0.6s ease 0.5s",
            marginTop: 4,
          }}
        >
          Auto Services Redefined
        </div>
      </div>

      {/* Vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.88) 100%)",
          pointerEvents: "none",
          zIndex: 18,
        }}
      />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
        @keyframes rainFall {
          0%   { transform: translateY(-80px); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateY(100vh); opacity: 0; }
        }
        @keyframes ripple {
          0%   { transform: scale(0.3); opacity: 0.6; }
          100% { transform: scale(3);   opacity: 0; }
        }
        @keyframes flicker {
          0%   { transform: scaleX(1) scaleY(1); opacity: 1; }
          100% { transform: scaleX(1.4) scaleY(0.8); opacity: 0.75; }
        }
        @keyframes speedLine {
          0%   { opacity: 0; transform: scaleX(0.2); }
          30%  { opacity: 1; }
          100% { opacity: 0.2; transform: scaleX(1); }
        }
        @keyframes dashMove {
          0%   { background-position-x: 0px; }
          100% { background-position-x: -130px; }
        }
        @keyframes antBlink {
          0%, 44%  { opacity: 0.85; }
          48%, 94% { opacity: 0.1; }
          100%     { opacity: 0.85; }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
