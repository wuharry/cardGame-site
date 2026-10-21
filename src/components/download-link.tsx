"use client";

import Link from "next/link";
import type { ReactNode } from "react";

/** Repeated clicks must reach the download section even when the hash is unchanged. */
export function DownloadLink({ children, className, onClick }: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return <Link href="/#download" className={className} onClick={onClick} onNavigate={(event) => {
    const section = document.getElementById("download");
    if (window.location.pathname !== "/" || !section) return;
    event.preventDefault();
    // Native fragment navigation updates :target before the final layout/scroll.
    window.location.hash = "download";
    section.scrollIntoView({ block: "start" });
  }}>{children}</Link>;
}
