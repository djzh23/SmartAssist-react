import { parseJobAnalysis, bodyToHtml } from '../../utils/jobMarkdown'

interface Props {
  text: string
}

export default function JobAnalysisCard({ text }: Props) {
  const sections = parseJobAnalysis(text)

  if (sections.length === 0) {
    return <p className="text-sm text-slate-700 whitespace-pre-wrap">{text}</p>
  }

  return (
    <div className="flex flex-col gap-2.5 w-full">
      {sections.map((s, i) => (
        <div
          key={i}
          className="rounded-lg px-4 py-3.5"
          style={{ background: s.bg, borderLeft: `4px solid ${s.border}` }}
        >
          <p
            className="text-[0.78rem] font-bold mb-2 leading-snug"
            style={{ color: s.color }}
          >
            {s.title}
          </p>
          <div
            className="text-[0.875rem] leading-relaxed text-slate-700
                        [&_ul]:mt-0 [&_ul]:mb-0 [&_ul]:pl-5
                        [&_li]:mb-1
                        [&_p]:mb-1.5 [&_p:last-child]:mb-0
                        [&_strong]:font-semibold [&_strong]:text-slate-800"
            dangerouslySetInnerHTML={{ __html: bodyToHtml(s.body) }}
          />
        </div>
      ))}
    </div>
  )
}
