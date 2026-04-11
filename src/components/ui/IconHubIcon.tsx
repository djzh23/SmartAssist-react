/**
 * Line-style SVG assets from `public/icons/iconhub` (Iconhub pack).
 */
export type IconHubName =
  | 'chat'
  | 'key'
  | 'laptop'
  | 'lightning'
  | 'star'
  | 'target'
  | 'trophy-award'
  | 'winner'
  | 'work'
  | 'world'

export type IconHubTone = 'default' | 'inverse' | 'onDark'

const toneClass: Record<IconHubTone, string> = {
  default: '',
  /** Black-stroke SVG → white (e.g. on amber gradient buttons). */
  inverse: 'brightness-0 invert',
  /** Softer white on dark brown / near-black sections. */
  onDark: 'brightness-0 invert opacity-85',
}

export function IconHubIcon({
  name,
  className = '',
  tone = 'default',
}: {
  name: IconHubName
  className?: string
  tone?: IconHubTone
}) {
  const root = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`

  return (
    <img
      src={`${root}icons/iconhub/${name}.svg`}
      alt=""
      className={['object-contain', toneClass[tone], className].filter(Boolean).join(' ')}
      decoding="async"
      loading="lazy"
      draggable={false}
      aria-hidden
    />
  )
}
