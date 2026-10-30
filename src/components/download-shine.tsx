"use client";

import { useEffect, useRef, useState } from "react";

/** Decorative only: reveal each download CTA once, without delaying its action. */
export function DownloadShine() {
  const layer = useRef<HTMLSpanElement>(null);
  const [phase, setPhase] = useState("pending");

  useEffect(() => {
    const button = layer.current?.parentElement;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!button || motion.matches || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.6)) {
        observer.disconnect();
        if (!motion.matches && !button.matches(":disabled, [aria-disabled='true']")) {
          setPhase("playing");
        }
      }
    }, { threshold: 0.6 });
    const stop = () => {
      if (motion.matches) {
        observer.disconnect();
        setPhase("done");
      }
    };
    observer.observe(button);
    motion.addEventListener("change", stop);
    return () => {
      observer.disconnect();
      motion.removeEventListener("change", stop);
    };
  }, []);

  return <span ref={layer} aria-hidden="true" className="download-shine" data-state={phase}
    onAnimationEnd={() => setPhase("done")} />;
}
