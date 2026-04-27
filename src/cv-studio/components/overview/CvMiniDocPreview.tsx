/** Decorative „Seite“ — kein echtes PDF, nur Orientierung in der Karte. */
export default function CvMiniDocPreview() {
  return (
    <div
      className="relative flex h-[100px] w-full max-w-[200px] flex-col gap-1.5 rounded-lg border border-white/[0.08] bg-gradient-to-b from-white/[0.07] to-black/30 p-2.5"
      aria-hidden
    >
      <div className="h-1.5 w-2/5 rounded bg-white/20" />
      <div className="h-1 w-full rounded bg-white/10" />
      <div className="h-1 w-[92%] rounded bg-white/10" />
      <div className="h-1 w-[88%] rounded bg-white/10" />
      <div className="mt-1 h-1.5 w-1/3 rounded bg-primary/35" />
      <div className="h-1 w-full rounded bg-white/8" />
      <div className="h-1 w-4/5 rounded bg-white/8" />
      <div className="mt-auto flex gap-1">
        <div className="h-6 flex-1 rounded bg-white/[0.06]" />
        <div className="h-6 flex-1 rounded bg-white/[0.06]" />
      </div>
    </div>
  )
}
