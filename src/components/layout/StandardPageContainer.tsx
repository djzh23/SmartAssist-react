import type { CSSProperties, ReactNode } from 'react'

interface StandardPageContainerProps {
  children: ReactNode
  className?: string
  style?: CSSProperties
}

export default function StandardPageContainer({
  children,
  className,
  style,
}: StandardPageContainerProps) {
  return (
    <div
      className={[
        'mx-auto w-full max-w-[1360px] px-4 sm:px-6',
        className ?? '',
      ].join(' ')}
      style={style}
    >
      {children}
    </div>
  )
}
