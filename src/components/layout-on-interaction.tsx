"use client";

import { useEffect } from "react";

// "click" covers assistive tech that activates links without pointer or key events.
const EVENTS = ["pointerdown", "keydown", "touchstart", "wheel", "click"] as const;

/**
 * Home sections skip offscreen layout only until the first interaction.
 * Next Link fragment jumps use pushState, so :target alone cannot release it;
 * every jump starts with an interaction, which lays out real heights first.
 */
export function LayoutOnInteraction() {
  useEffect(() => {
    const release = () => {
      document.documentElement.dataset.fullLayout = "";
      for (const type of EVENTS) window.removeEventListener(type, release, true);
    };
    for (const type of EVENTS) window.addEventListener(type, release, { capture: true, passive: true });
    return () => { for (const type of EVENTS) window.removeEventListener(type, release, true); };
  }, []);
  return null;
}
