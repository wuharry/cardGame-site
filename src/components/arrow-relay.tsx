/** Both glyphs are decorative; the link's text remains its accessible name. */
export function ArrowRelay({ arrow = "→" }: { arrow?: "→" | "↗" | "↘" }) {
  return <span className="arrow-relay" aria-hidden="true">
    <span>{arrow}</span><span>{arrow}</span>
  </span>;
}
