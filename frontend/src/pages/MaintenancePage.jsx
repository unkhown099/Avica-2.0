import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/otokwikklogo.png";

const FuzzyText = ({
  children,
  fontSize = "clamp(2rem, 10vw, 10rem)",
  fontWeight = 900,
  fontFamily = "inherit",
  color = "#fff",
  enableHover = true,
  baseIntensity = 0.18,
  hoverIntensity = 0.5,
  fuzzRange = 30,
  fps = 60,
  direction = "horizontal",
  transitionDuration = 0,
  clickEffect = false,
  glitchMode = false,
  glitchInterval = 2000,
  glitchDuration = 200,
  gradient = null,
  letterSpacing = 0,
  className = "",
}) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    let animationFrameId;
    let isCancelled = false;
    let glitchTimeoutId;
    let glitchEndTimeoutId;
    let clickTimeoutId;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const init = async () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const computedFontFamily =
        fontFamily === "inherit"
          ? window.getComputedStyle(canvas).fontFamily || "sans-serif"
          : fontFamily;

      const fontSizeStr =
        typeof fontSize === "number" ? `${fontSize}px` : fontSize;
      const fontString = `${fontWeight} ${fontSizeStr} ${computedFontFamily}`;

      try {
        await document.fonts.load(fontString);
      } catch {
        await document.fonts.ready;
      }
      if (isCancelled) return;

      let numericFontSize;
      if (typeof fontSize === "number") {
        numericFontSize = fontSize;
      } else {
        const temp = document.createElement("span");
        temp.style.fontSize = fontSize;
        document.body.appendChild(temp);
        const computedSize = window.getComputedStyle(temp).fontSize;
        numericFontSize = parseFloat(computedSize);
        document.body.removeChild(temp);
      }

      const text = React.Children.toArray(children).join("");
      const offscreen = document.createElement("canvas");
      const offCtx = offscreen.getContext("2d");
      if (!offCtx) return;

      offCtx.font = `${fontWeight} ${fontSizeStr} ${computedFontFamily}`;
      offCtx.textBaseline = "alphabetic";

      let totalWidth = 0;
      if (letterSpacing !== 0) {
        for (const char of text) {
          totalWidth += offCtx.measureText(char).width + letterSpacing;
        }
        totalWidth -= letterSpacing;
      } else {
        totalWidth = offCtx.measureText(text).width;
      }

      const metrics = offCtx.measureText(text);
      const actualLeft = metrics.actualBoundingBoxLeft ?? 0;
      const actualRight =
        letterSpacing !== 0
          ? totalWidth
          : (metrics.actualBoundingBoxRight ?? metrics.width);
      const actualAscent = metrics.actualBoundingBoxAscent ?? numericFontSize;
      const actualDescent =
        metrics.actualBoundingBoxDescent ?? numericFontSize * 0.2;

      const textBoundingWidth = Math.ceil(
        letterSpacing !== 0 ? totalWidth : actualLeft + actualRight,
      );
      const tightHeight = Math.ceil(actualAscent + actualDescent);
      const extraWidthBuffer = 10;
      const offscreenWidth = textBoundingWidth + extraWidthBuffer;

      offscreen.width = offscreenWidth;
      offscreen.height = tightHeight;

      const xOffset = extraWidthBuffer / 2;
      offCtx.font = `${fontWeight} ${fontSizeStr} ${computedFontFamily}`;
      offCtx.textBaseline = "alphabetic";

      if (gradient && Array.isArray(gradient) && gradient.length >= 2) {
        const grad = offCtx.createLinearGradient(0, 0, offscreenWidth, 0);
        gradient.forEach((c, i) =>
          grad.addColorStop(i / (gradient.length - 1), c),
        );
        offCtx.fillStyle = grad;
      } else {
        offCtx.fillStyle = color;
      }

      if (letterSpacing !== 0) {
        let xPos = xOffset;
        for (const char of text) {
          offCtx.fillText(char, xPos, actualAscent);
          xPos += offCtx.measureText(char).width + letterSpacing;
        }
      } else {
        offCtx.fillText(text, xOffset - actualLeft, actualAscent);
      }

      const horizontalMargin = fuzzRange + 20;
      const verticalMargin =
        direction === "vertical" || direction === "both" ? fuzzRange + 10 : 0;
      canvas.width = offscreenWidth + horizontalMargin * 2;
      canvas.height = tightHeight + verticalMargin * 2;
      ctx.translate(horizontalMargin, verticalMargin);

      const interactiveLeft = horizontalMargin + xOffset;
      const interactiveTop = verticalMargin;
      const interactiveRight = interactiveLeft + textBoundingWidth;
      const interactiveBottom = interactiveTop + tightHeight;

      let isHovering = false,
        isClicking = false,
        isGlitching = false;
      let currentIntensity = baseIntensity,
        targetIntensity = baseIntensity;
      let lastFrameTime = 0;
      const frameDuration = 1000 / fps;

      const startGlitchLoop = () => {
        if (!glitchMode || isCancelled) return;
        glitchTimeoutId = setTimeout(() => {
          if (isCancelled) return;
          isGlitching = true;
          glitchEndTimeoutId = setTimeout(() => {
            isGlitching = false;
            startGlitchLoop();
          }, glitchDuration);
        }, glitchInterval);
      };
      if (glitchMode) startGlitchLoop();

      const run = (timestamp) => {
        if (isCancelled) return;
        if (timestamp - lastFrameTime < frameDuration) {
          animationFrameId = window.requestAnimationFrame(run);
          return;
        }
        lastFrameTime = timestamp;
        ctx.clearRect(
          -fuzzRange - 20,
          -fuzzRange - 10,
          offscreenWidth + 2 * (fuzzRange + 20),
          tightHeight + 2 * (fuzzRange + 10),
        );

        if (isClicking || isGlitching) targetIntensity = 1;
        else if (isHovering) targetIntensity = hoverIntensity;
        else targetIntensity = baseIntensity;

        if (transitionDuration > 0) {
          const step = 1 / (transitionDuration / frameDuration);
          currentIntensity =
            currentIntensity < targetIntensity
              ? Math.min(currentIntensity + step, targetIntensity)
              : Math.max(currentIntensity - step, targetIntensity);
        } else {
          currentIntensity = targetIntensity;
        }

        for (let j = 0; j < tightHeight; j++) {
          let dx = 0,
            dy = 0;
          if (direction === "horizontal" || direction === "both")
            dx = Math.floor(
              currentIntensity * (Math.random() - 0.5) * fuzzRange,
            );
          if (direction === "vertical" || direction === "both")
            dy = Math.floor(
              currentIntensity * (Math.random() - 0.5) * fuzzRange * 0.5,
            );
          ctx.drawImage(
            offscreen,
            0,
            j,
            offscreenWidth,
            1,
            dx,
            j + dy,
            offscreenWidth,
            1,
          );
        }
        animationFrameId = window.requestAnimationFrame(run);
      };
      animationFrameId = window.requestAnimationFrame(run);

      const isInside = (x, y) =>
        x >= interactiveLeft &&
        x <= interactiveRight &&
        y >= interactiveTop &&
        y <= interactiveBottom;

      const onMouseMove = (e) => {
        if (!enableHover) return;
        const r = canvas.getBoundingClientRect();
        isHovering = isInside(e.clientX - r.left, e.clientY - r.top);
      };
      const onMouseLeave = () => {
        isHovering = false;
      };
      const onClick = () => {
        if (!clickEffect) return;
        isClicking = true;
        clearTimeout(clickTimeoutId);
        clickTimeoutId = setTimeout(() => {
          isClicking = false;
        }, 150);
      };
      const onTouchMove = (e) => {
        if (!enableHover) return;
        e.preventDefault();
        const r = canvas.getBoundingClientRect();
        const t = e.touches[0];
        isHovering = isInside(t.clientX - r.left, t.clientY - r.top);
      };
      const onTouchEnd = () => {
        isHovering = false;
      };

      if (enableHover) {
        canvas.addEventListener("mousemove", onMouseMove);
        canvas.addEventListener("mouseleave", onMouseLeave);
        canvas.addEventListener("touchmove", onTouchMove, { passive: false });
        canvas.addEventListener("touchend", onTouchEnd);
      }
      if (clickEffect) canvas.addEventListener("click", onClick);

      canvas.cleanupFuzzyText = () => {
        window.cancelAnimationFrame(animationFrameId);
        clearTimeout(glitchTimeoutId);
        clearTimeout(glitchEndTimeoutId);
        clearTimeout(clickTimeoutId);
        if (enableHover) {
          canvas.removeEventListener("mousemove", onMouseMove);
          canvas.removeEventListener("mouseleave", onMouseLeave);
          canvas.removeEventListener("touchmove", onTouchMove);
          canvas.removeEventListener("touchend", onTouchEnd);
        }
        if (clickEffect) canvas.removeEventListener("click", onClick);
      };
    };

    init();

    return () => {
      isCancelled = true;
      window.cancelAnimationFrame(animationFrameId);
      clearTimeout(glitchTimeoutId);
      clearTimeout(glitchEndTimeoutId);
      clearTimeout(clickTimeoutId);
      if (canvas && canvas.cleanupFuzzyText) canvas.cleanupFuzzyText();
    };
  }, [
    children,
    fontSize,
    fontWeight,
    fontFamily,
    color,
    enableHover,
    baseIntensity,
    hoverIntensity,
    fuzzRange,
    fps,
    direction,
    transitionDuration,
    clickEffect,
    glitchMode,
    glitchInterval,
    glitchDuration,
    gradient,
    letterSpacing,
  ]);

  return <canvas ref={canvasRef} className={className} />;
};

// Animated wrench/gear icon for maintenance
const MaintenanceIcon = () => (
  <div className="flex items-center justify-center mb-8">
    <div className="relative w-24 h-24">
      {/* Outer spinning ring */}
      <svg
        className="absolute inset-0 w-full h-full animate-spin"
        style={{ animationDuration: "8s" }}
        viewBox="0 0 96 96"
        fill="none"
      >
        <circle
          cx="48"
          cy="48"
          r="44"
          stroke="#dc2626"
          strokeWidth="2"
          strokeDasharray="8 6"
          opacity="0.4"
        />
      </svg>
      {/* Inner gear */}
      <svg
        className="absolute inset-0 w-full h-full animate-spin"
        style={{ animationDuration: "4s", animationDirection: "reverse" }}
        viewBox="0 0 96 96"
        fill="none"
      >
        <path
          d="M48 28a20 20 0 100 40 20 20 0 000-40zm0 8a12 12 0 110 24 12 12 0 010-24z"
          fill="#dc2626"
          opacity="0.15"
        />
        <path
          d="M56 8h-16l-2 8a28 28 0 00-8 4.6L22 17l-8 13.9 6.4 5.4a28.3 28.3 0 000 9.4L14 51 22 65l8.1-3.6A28 28 0 0038 66l2 8h16l2-8a28 28 0 008-4.6L74 65l8-13.9-6.4-5.4a28.3 28.3 0 000-9.4L82 31 74 17l-8.1 3.6A28 28 0 0058 16l-2-8z"
          stroke="#dc2626"
          strokeWidth="2"
          fill="none"
          opacity="0.6"
        />
      </svg>
      {/* Center wrench icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <svg
          className="w-10 h-10 text-red-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </div>
    </div>
  </div>
);

// Animated progress dots
const ProgressDots = () => (
  <div className="flex items-center justify-center gap-2 mt-6">
    {[0, 1, 2, 3, 4].map((i) => (
      <div
        key={i}
        className="w-2 h-2 rounded-full bg-red-600"
        style={{
          animation: "pulse 1.4s ease-in-out infinite",
          animationDelay: `${i * 0.2}s`,
          opacity: 0.3,
        }}
      />
    ))}
    <style>{`
      @keyframes pulse {
        0%, 100% { opacity: 0.3; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.4); }
      }
    `}</style>
  </div>
);

// Countdown timer (optional — set targetDate to your expected back-online time)
const CountdownTimer = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculate = () => {
      const diff = new Date(targetDate) - new Date();
      if (diff <= 0) return setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
      setTimeLeft({
        hours: Math.floor(diff / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    calculate();
    const id = setInterval(calculate, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  const pad = (n) => String(n).padStart(2, "0");

  return (
    <div className="flex items-center justify-center gap-4 mt-8">
      {[
        { label: "HRS", value: timeLeft.hours },
        { label: "MIN", value: timeLeft.minutes },
        { label: "SEC", value: timeLeft.seconds },
      ].map(({ label, value }, i) => (
        <React.Fragment key={label}>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-900 border border-gray-700 rounded-lg flex items-center justify-center shadow-inner shadow-black">
              <span className="text-2xl font-mono font-bold text-white">
                {pad(value)}
              </span>
            </div>
            <span className="text-xs text-gray-500 mt-1 tracking-widest">
              {label}
            </span>
          </div>
          {i < 2 && (
            <span className="text-2xl font-bold text-red-600 mb-4">:</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

function MaintenancePage({
  estimatedTime = null, // e.g. "2 hours"
  targetDate = null, // ISO string for countdown, e.g. "2025-12-01T18:00:00"
  showCountdown = false,
  customMessage = null,
}) {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background glows — same as ErrorPage */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        {/* Extra subtle center glow for maintenance mood */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "0.5s" }}
        />
      </div>

      <div className="relative z-10 max-w-4xl w-full text-center">
        {/* Logo */}
        <div className="mb-10 flex justify-center">
          <Link to="/">
            <img
              src={logo}
              alt="Otokwikk logo"
              className="h-16 md:h-20 object-contain"
            />
          </Link>
        </div>

        {/* Maintenance icon */}
        <MaintenanceIcon />

        {/* Fuzzy "Under Maintenance" heading */}
        <div className="mb-4 flex justify-center">
          <FuzzyText
            fontSize="clamp(2.5rem, 8vw, 5rem)"
            fontWeight={900}
            color="#fff"
            baseIntensity={0.15}
            hoverIntensity={0.4}
          >
            Under Maintenance
          </FuzzyText>
        </div>

        {/* Subheading */}
        <div className="mb-6 flex justify-center">
          <FuzzyText
            fontSize="clamp(1rem, 3vw, 1.5rem)"
            fontWeight={700}
            color="#dc2626"
            baseIntensity={0.12}
          >
            We'll be back shortly!
          </FuzzyText>
        </div>

        {/* Description */}
        <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
          {customMessage ||
            "We're currently performing scheduled maintenance to improve your experience. Our team is working hard under the hood — just like a well-tuned engine, we'll be running smoother than ever once we're done."}
        </p>

        {/* Animated progress dots */}
        <ProgressDots />

        {/* Estimated time badge */}
        {estimatedTime && (
          <div className="mt-8 inline-flex items-center gap-2 bg-gray-900 border border-gray-700 rounded-full px-5 py-2.5 text-sm text-gray-300">
            <svg
              className="w-4 h-4 text-red-500 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Estimated downtime:&nbsp;
            <span className="text-white font-semibold">{estimatedTime}</span>
          </div>
        )}

        {/* Optional countdown */}
        {showCountdown && targetDate && (
          <CountdownTimer targetDate={targetDate} />
        )}

        {/* What's happening section */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
          {[
            {
              icon: (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
                />
              ),
              label: "Database Upgrade",
            },
            {
              icon: (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              ),
              label: "Security Patches",
            },
            {
              icon: (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              ),
              label: "Performance Boost",
            },
          ].map(({ icon, label }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-2 bg-gray-900/60 border border-gray-800 rounded-xl px-4 py-5 hover:border-red-600/40 transition-colors duration-300"
            >
              <svg
                className="w-6 h-6 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {icon}
              </svg>
              <span className="text-sm text-gray-400 font-medium">{label}</span>
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12">
          <button
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-red-600/50 flex items-center justify-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Try Again
          </button>

          <a
            href="mailto:support@otokwikk.com"
            className="w-full sm:w-auto bg-gray-800 hover:bg-gray-700 text-white font-bold px-8 py-4 rounded-lg transition-all duration-300 shadow-xl flex items-center justify-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}

export default MaintenancePage;
