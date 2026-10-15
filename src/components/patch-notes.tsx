import { RELEASE_NOTES } from "@/data/releases";

/**
 * 開發更新紀錄；日期與下載成品資訊分開維護。
 * 只攤開最新一版：七版全開會在頁尾堆出上千字，沒有人會掃完。舊版收進 details，紀錄不丟。
 */
export function PatchNotes() {
  return (
    <section id="changelog" className="border-t border-rule-soft bg-ink">
      <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
        <header className="flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <p className="eyebrow">DEVELOPMENT LOG</p>
            <h2 className="section-title mt-4 text-3xl sm:text-4xl">開發更新紀錄</h2>
          </div>
          <p className="hud-label">
            {RELEASE_NOTES.length} updates · latest {RELEASE_NOTES[0].date.replaceAll("-", ".")}
          </p>
        </header>

        <ol className="mt-10 md:mt-12">
          {RELEASE_NOTES.slice(0, 1).map((note, index) => (
            <li
              key={`${note.date}-${note.title}`}
              className="border-t border-rule-soft py-8 md:grid md:grid-cols-[10rem_minmax(0,1fr)] md:gap-10"
            >
              <div className="flex items-baseline gap-3 md:block">
                <p
                  className={`text-2xl tabular-nums ${index === 0 ? "text-brass" : "text-faint"}`}
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {note.version}
                </p>
                <p className="hud-label md:mt-2">
                  {note.date.replaceAll("-", ".")}
                </p>
              </div>

              <div className="mt-4 md:mt-0">
                <h3
                  className="text-lg text-parchment"
                  style={{ fontFamily: "var(--font-serif)" }}
                >
                  {note.title}
                </h3>
                <ul className="mt-3 space-y-2">
                  {note.changes.map((change) => (
                    <li
                      key={change}
                      className="body-cjk relative pl-5 text-[0.9rem] before:absolute before:top-[0.85em] before:left-0 before:h-px before:w-3 before:bg-brass-dim"
                    >
                      {change}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>

        <details className="mt-6 border-t border-rule-soft pt-4">
          <summary
            className="cursor-pointer text-sm text-quill transition-colors hover:text-parchment"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            以前的 {RELEASE_NOTES.length - 1} 版更新紀錄
          </summary>
          <ol className="mt-4">
            {RELEASE_NOTES.slice(1).map((note) => (
              <li
                key={`${note.date}-${note.title}`}
                className="border-t border-rule-soft py-6 md:grid md:grid-cols-[10rem_minmax(0,1fr)] md:gap-10"
              >
                <div className="flex items-baseline gap-3 md:block">
                  <p className="text-xl tabular-nums text-faint" style={{ fontFamily: "var(--font-display)" }}>
                    {note.version}
                  </p>
                  <p className="hud-label md:mt-2">{note.date.replaceAll("-", ".")}</p>
                </div>
                <div className="mt-3 md:mt-0">
                  <h3 className="text-base text-parchment" style={{ fontFamily: "var(--font-serif)" }}>
                    {note.title}
                  </h3>
                  <ul className="mt-2 space-y-1.5">
                    {note.changes.map((change) => (
                      <li key={change} className="body-cjk pl-5 text-[0.86rem] text-quill">
                        {change}
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ol>
        </details>
      </div>
    </section>
  );
}
