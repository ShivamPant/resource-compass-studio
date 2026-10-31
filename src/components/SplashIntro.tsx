import { useEffect, useState } from "react";
import logo from "@/assets/dride-logo.png";

// Module-level so the intro plays once per page load, not on every client-side visit to "/".
let played = false;

const PINES = [22, 30, 18, 34, 24, 16, 28];

export function SplashIntro() {
  const [show, setShow] = useState(!played);

  useEffect(() => {
    played = true;
  }, []);

  if (!show) return null;
  return (
    <div
      className="splash"
      role="presentation"
      onClick={() => setShow(false)}
      onAnimationEnd={(e) => e.target === e.currentTarget && setShow(false)}
    >
      <div className="splash-logo">
        <img src={logo} alt="D Ride" className="splash-mark" />
        <img src={logo} alt="" className="splash-word" />
      </div>
      <p className="splash-quote" aria-label="Go Big Green.">
        <span className="w"><span>Go</span></span>
        <span className="w"><span>Big</span></span>
        <span className="w"><span>Green.</span></span>
        <svg className="splash-brush" viewBox="0 0 300 40" preserveAspectRatio="none" aria-hidden>
          <path d="M6 28 C80 12 170 10 294 18" stroke="currentColor" strokeWidth="12" strokeLinecap="round" fill="none" />
        </svg>
      </p>
      <div className="splash-pines" aria-hidden>
        {PINES.map((h, i) => (
          <span key={i} style={{ height: h, animationDelay: `${1.8 + i * 0.07}s` }} />
        ))}
      </div>
      <p className="splash-place">Dartmouth · Hanover, NH</p>
      <div className="splash-curtain" />
    </div>
  );
}
