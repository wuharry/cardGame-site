"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { mediaUrl } from "@/data/media";

/** Native dialog owns focus trapping, Escape and focus return to the image link. */
export function ScreenshotViewer({ source, alt, caption, sizes }: {
  source: string; alt: string; caption: string; sizes: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open || !dialog.current) return;
    dialog.current.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  return (
    <>
      <a className="screenshot-link" href={mediaUrl(source)} aria-label={`放大檢視：${alt}`}
        aria-haspopup="dialog" onClick={(event) => {
          // Keep opening the original image in a new tab available.
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          event.preventDefault(); setOpen(true);
        }}>
        <Image src={mediaUrl(source)} alt={alt} fill sizes={sizes} />
        <span className="screenshot-expand" aria-hidden="true">放大檢視 <span>↗</span></span>
      </a>
      {open && <dialog ref={dialog} className="screenshot-dialog" aria-label={`${alt}放大畫面`}
        onClose={() => setOpen(false)} onClick={(event) => {
          if (event.target === event.currentTarget) dialog.current?.close();
        }}>
        <div className="screenshot-dialog-inner">
          <div className="screenshot-dialog-toolbar"><span>{alt}</span>
            <button type="button" autoFocus onClick={() => dialog.current?.close()} aria-label="關閉放大畫面">關閉 <span aria-hidden="true">×</span></button>
          </div>
          <div className="screenshot-full-image"><Image src={mediaUrl(source)} alt={alt} fill
            sizes="(max-width: 1920px) 96vw, 1840px" loading="eager" /></div>
          <p>{caption}</p>
          <a className="screenshot-original" href={mediaUrl(source)} target="_blank" rel="noopener noreferrer">開啟原圖 ↗</a>
        </div>
      </dialog>}
    </>
  );
}
