/** Blinkender Cursor während gedrosseltem Stream-Rendering (kein Backend-Eingriff). */
export default function StreamingTextCursor() {
  return (
    <span
      className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-slate-400 align-middle"
      aria-hidden
    />
  )
}
