import { CvSectionTitleResolver } from '../lib/sectionTitles'
import { formatUrl } from '../lib/formatting'
import type { PdfDesign, ProfileData, ResumeDto } from '../cvTypes'

function hasSocialLinks(profile: ProfileData): boolean {
  return Boolean(profile.linkedInUrl?.trim() || profile.gitHubUrl?.trim() || profile.portfolioUrl?.trim())
}

interface Props {
  resume: ResumeDto | null
  pdfDesign: PdfDesign
}

export function LivePreview({ resume, pdfDesign }: Props) {
  if (!resume) return null
  const d = resume.resumeData
  const p = d.profile

  return (
    <div
      className={[
        'rounded-xl border border-white/10 bg-app-parchment/95 p-4 text-sm text-stone-900 shadow-inner',
        pdfDesign === 'B' ? 'font-sans' : '',
      ].join(' ')}
    >
      <div className="mb-3 flex gap-3 border-b border-stone-300/80 pb-3">
        {p.profileImageUrl?.trim() ? (
          <img src={p.profileImageUrl} alt="" className="h-16 w-16 rounded-lg object-cover" />
        ) : null}
        <div>
          <h3 className="text-lg font-semibold text-stone-900">
            {p.firstName} {p.lastName}
          </h3>
          <p className="text-stone-600">{p.headline}</p>
        </div>
      </div>
      <p className="mb-2 text-xs text-stone-600">
        {p.email} | {p.phone} | {p.location}
      </p>
      {hasSocialLinks(p) ? (
        <div className="mb-2 flex flex-wrap gap-2 text-xs text-stone-700">
          {p.linkedInUrl?.trim() ? <span>in {formatUrl(p.linkedInUrl)}</span> : null}
          {p.gitHubUrl?.trim() ? <span>gh {formatUrl(p.gitHubUrl)}</span> : null}
          {p.portfolioUrl?.trim() ? <span>web {formatUrl(p.portfolioUrl)}</span> : null}
        </div>
      ) : null}
      {p.workPermit?.trim() ? (
        <div className="mb-2 text-xs text-emerald-800">✓ {p.workPermit}</div>
      ) : null}
      {p.summary?.trim() ? (
        <>
          <h4 className="mt-3 text-xs font-bold uppercase tracking-wide text-stone-800">
            {CvSectionTitleResolver.qualificationsProfile(d)}
          </h4>
          <p className="whitespace-pre-wrap text-stone-800">{p.summary}</p>
        </>
      ) : null}

      <h4 className="mt-4 text-xs font-bold uppercase tracking-wide text-stone-800">
        {CvSectionTitleResolver.workExperience(d)}
      </h4>
      {d.workItems.length === 0 ? (
        <p className="text-stone-500">Keine Einträge</p>
      ) : (
        d.workItems.map((work, idx) => (
          <article key={idx} className="mb-3 border-b border-stone-200/80 pb-2 last:border-0">
            <strong className="text-stone-900">
              {work.role} — {work.company}
            </strong>
            <div className="text-xs text-stone-600">
              {work.startDate} — {work.endDate}
            </div>
            {work.description?.trim() ? <p className="mt-1 text-stone-800">{work.description}</p> : null}
            {work.bullets.length > 0 ? (
              <ul className="mt-1 list-disc pl-4 text-stone-800">
                {work.bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            ) : null}
          </article>
        ))
      )}

      <h4 className="mt-4 text-xs font-bold uppercase tracking-wide text-stone-800">
        {CvSectionTitleResolver.education(d)}
      </h4>
      {d.educationItems.length === 0 ? (
        <p className="text-stone-500">Keine Einträge</p>
      ) : (
        d.educationItems.map((edu, idx) => (
          <article key={idx} className="mb-2">
            <strong className="text-stone-900">{edu.degree}</strong>
            <div>{edu.school}</div>
            <div className="text-xs text-stone-600">
              {edu.startDate} — {edu.endDate}
            </div>
          </article>
        ))
      )}

      <h4 className="mt-4 text-xs font-bold uppercase tracking-wide text-stone-800">
        {CvSectionTitleResolver.skills(d)}
      </h4>
      {d.skills.length === 0 ? (
        <p className="text-stone-500">Keine Einträge</p>
      ) : (
        d.skills.map((skill, idx) => (
          <div key={idx} className="mb-1 text-stone-800">
            <strong>{skill.categoryName}:</strong> {skill.items.join(', ')}
          </div>
        ))
      )}

      <h4 className="mt-4 text-xs font-bold uppercase tracking-wide text-stone-800">
        {CvSectionTitleResolver.interests(d)}
      </h4>
      {d.hobbies.length === 0 ? (
        <p className="text-stone-500">Keine Einträge</p>
      ) : (
        <p className="text-stone-800">{d.hobbies.join(' | ')}</p>
      )}
    </div>
  )
}
