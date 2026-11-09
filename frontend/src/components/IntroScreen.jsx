import { useEffect, useState } from "react";

export default function IntroScreen({ onFinish }) {
  const [progress, setProgress] = useState(1);
  const [fading, setFading] = useState(false);

  // Animate progress counter from 1 to 100
  useEffect(() => {
    const duration = 2500; // 2.5 seconds total
    const startTime = performance.now();

    let animationFrameId;

    const updateProgress = (currentTime) => {
      const elapsed = currentTime - startTime;
      const pct = Math.min(1, elapsed / duration);
      
      // Easing curve: smooth start, brisk middle, gentle finish
      const eased = Math.sin((pct * Math.PI) / 2);
      const currentVal = Math.max(1, Math.min(100, Math.floor(eased * 100)));
      
      setProgress(currentVal);

      if (pct < 1) {
        animationFrameId = requestAnimationFrame(updateProgress);
      } else {
        // Reached 100%: brief hold then trigger dramatic exit
        setTimeout(() => {
          setFading(true);
        }, 280);

        setTimeout(() => {
          onFinish();
        }, 850);
      }
    };

    animationFrameId = requestAnimationFrame(updateProgress);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [onFinish]);

  const brandText = "DORMEASE";

  // Dynamic status text based on progress
  const getStatusText = (val) => {
    if (val < 30) return "กำลังเริ่มต้นระบบ DormEase...";
    if (val < 65) return "เชื่อมต่อฐานข้อมูล MySQL & ข้อมูลหอพัก...";
    if (val < 95) return "กำลังตรวจสอบข้อมูลห้องพักและสถานะ...";
    return "พร้อมใช้งาน • ยินดีต้อนรับสู่ DormEase";
  };

  return (
    <div className={`intro-overlay ${fading ? "intro-fade-out" : ""}`}>
      {/* Ambient background light orbs */}
      <div className="intro-ambient-orb intro-orb-1"></div>
      <div className="intro-ambient-orb intro-orb-2"></div>
      <div className="intro-ambient-orb intro-orb-3"></div>

      <div className="intro-content">
        {/* Glowing 3D Glass Badge */}
        <div className="intro-logo-container">
          <div className="intro-logo-glow"></div>
          <div className="intro-logo-badge">
            <svg
              className="intro-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
        </div>

        {/* Grand Bouncing DORMEASE Title - Staggered letter by letter */}
        <div className="intro-title-wrapper" aria-label="DORMEASE">
          {brandText.split("").map((char, index) => (
            <span
              key={index}
              className="intro-letter-bounce"
              style={{ animationDelay: `${0.1 + index * 0.07}s` }}
            >
              {char}
            </span>
          ))}
        </div>

        <p className="intro-subtitle">
          SMART DORMITORY MANAGEMENT SYSTEM
        </p>

        {/* High-tech Loading Bar & Counter (1-100) */}
        <div className="intro-progress-box">
          <div className="intro-counter-row">
            <span className="intro-status-label">{getStatusText(progress)}</span>
            <span className="intro-counter-number">
              <span className="intro-counter-digits">{progress}</span>
              <span className="intro-counter-unit">%</span>
            </span>
          </div>

          <div className="intro-track">
            <div
              className="intro-bar"
              style={{ width: `${progress}%` }}
            >
              <div className="intro-bar-head"></div>
              <div className="intro-bar-shimmer"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
