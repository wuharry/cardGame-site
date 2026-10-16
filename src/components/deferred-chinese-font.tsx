"use client";

import { useEffect } from "react";

/** Keep the existing typeface, but never make first paint wait for its CSS. */
export function DeferredChineseFont() {
  useEffect(() => {
    if (document.getElementById("chinese-font-css")) return;
    const stylesheet = document.createElement("link");
    stylesheet.id = "chinese-font-css";
    stylesheet.rel = "stylesheet";
    stylesheet.href = "https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@400;500;700&display=swap";
    document.head.appendChild(stylesheet);
  }, []);
  return null;
}
