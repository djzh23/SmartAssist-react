import { FileText } from 'lucide-react'
import AnalyzeAccordion from './AnalyzeAccordion'

interface Props {
  text: string
}

export default function AnalyzeRoleSummary({ text }: Props) {
  const trimmed = text.trim()
  if (!trimmed) return null

  return (
    <div className="mt-6 lg:hidden">
      <AnalyzeAccordion
        title="Rollenbeschreibung"
        subtitle="Zusammenfassung der Anzeige"
        icon={<FileText className="h-4 w-4" />}
      >
        <p className="text-sm leading-relaxed text-[#4a4238]">{trimmed}</p>
      </AnalyzeAccordion>
    </div>
  )
}
