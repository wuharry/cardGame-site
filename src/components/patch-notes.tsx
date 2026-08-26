import { RELEASE_NOTES } from "@/data/releases";

/**
 * Section 08 — 更新紀錄。
 * 一本流水帳：版號在左邊留白處，內容靠一條縱線串起來。
 * 不是卡片列表，也不做展開收合——這種東西應該一眼掃完。
 */
export function PatchNotes() {
  return (
    <section id="changelog" className="border-t border-rule-soft bg-ink">
      <div className="mx-auto max-w-6xl px-5 py-20 md:py-28">
        <header className="flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <p className="eyebrow">VIII — Log</p>
            <h2 className="section-title mt-4 text-3xl sm:text-4xl">更新紀錄</h2>
          </div>
          <p className="hud-label">
            {RELEASE_NOTES.length} releases · latest {RELEASE_NOTES[0].date.replaceAll("-", ".")}
          </p>
        </header>

        <ol className="mt-12 md:mt-14">
          {RELEASE_NOTES.map((note, index) => (
            <li
              key={note.version}
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
      </div>
    </section>
  );
}
