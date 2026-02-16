import { useState, useEffect } from 'react';

const LoadingScreen = ({ onLoadingComplete }) => {
  const [showLoading, setShowLoading] = useState(true);
  const logoText = "otokwikk";

  useEffect(() => {
    const lettersAnimationTime = logoText.length * 150 + 600;
    
    const completeTimer = setTimeout(() => {
      setShowLoading(false);
      if (onLoadingComplete) {
        onLoadingComplete();
      }
    }, lettersAnimationTime + 500);

    return () => {
      clearTimeout(completeTimer);
    };
  }, [onLoadingComplete, logoText.length]);

  if (!showLoading) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Logo Animation */}
      <div className="flex" style={{ fontFamily: "'Rubik', 'Nunito', sans-serif" }}>
        {logoText.split('').map((letter, index) => (
          <span
            key={index}
            className={`
              text-6xl md:text-7xl lg:text-8xl font-black
              opacity-0
              animate-letterDrop
              ${index < 3 ? 'text-red-600' : 'text-black'}
            `}
            style={{
              animationDelay: `${index * 150}ms`,
              animationFillMode: 'forwards'
            }}
          >
            {letter}
          </span>
        ))}
      </div>
    </div>
  );
};

export default LoadingScreen;