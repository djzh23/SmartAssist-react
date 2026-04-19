/** German labels for “Letzte Gespräche” timestamps (de-DE). */
export function formatRecentChatTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''

  const now = new Date()
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate())

  const today = startOf(now)
  const msgDay = startOf(d)
  const diffDays = Math.round((today.getTime() - msgDay.getTime()) / 86400000)

  if (diffDays === 0) {
    return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  }
  if (diffDays === 1) {
    return 'gestern'
  }
  if (diffDays < 7) {
    return d.toLocaleDateString('de-DE', { weekday: 'short' })
  }
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
}
