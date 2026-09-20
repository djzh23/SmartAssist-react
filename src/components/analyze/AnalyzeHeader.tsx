interface Props {
  title: string
  subtitle?: string
}

export default function AnalyzeHeader({ title, subtitle }: Props) {
  return (
    <header className="mb-4 sm:mb-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">Analyse</p>
      <h1 className="mt-1 font-serif text-xl font-bold leading-tight text-stone-50 sm:text-2xl">
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-1 text-sm text-stone-400">{subtitle}</p>
      ) : null}
    </header>
  )
}
