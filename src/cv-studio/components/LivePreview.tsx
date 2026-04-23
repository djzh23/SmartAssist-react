import { Fragment } from 'react'
import { CvSectionTitleResolver } from '../lib/sectionTitles'
import { formatUrl } from '../lib/formatting'
import {
  buildLanguagePreviewLine,
  visibleSkillGroupsForPreview,
} from '../lib/cvStudioLanguages'
import { normalizeContentSectionOrder, type CvMainSectionKey } from '../lib/cvStudioSectionOrder'
import type { PdfDesign, ProfileData, ResumeData, ResumeDto } from '../cvTypes'

function hasSocialLinks(profile: ProfileData): boolean {
  return Boolean(profile.linkedInUrl?.trim() || profile.gitHubUrl?.trim() || profile.portfolioUrl?.trim())
}

interface Props {
  resume: ResumeDto | null
  pdfDesign: PdfDesign
}

function sectionHeadingClass(pdf: PdfDesign): string {
  if (pdf === 'A') {
    return 'mt-4 border-l-[3px] border-[#1A3A5C] bg-[#F2F6FA] px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-[#1A3A5C]'
  }
  if (pdf === 'B') {
    return 'mt-4 border-b border-stone-300 pb-1 text-[11px] font-bold uppercase tracking-wide text-stone-900'
  }
  return 'mt-4 border-b border-cyan-700/50 pb-1 text-[11px] font-bold uppercase tracking-wide text-slate-800'
}

function outerShellClass(pdf: PdfDesign): string {
  if (pdf === 'A') {
    return 'rounded-xl border border-[#C5D5E8] bg-[#F8FAFC] p-4 text-sm text-[#1C2833] shadow-md'
  }
  if (pdf === 'B') {
    return 'rounded-xl border border-stone-200 bg-white p-4 text-sm text-stone-900 shadow-md font-sans'
  }
  return 'rounded-xl border border-slate-200 bg-[#f8fafc] p-4 text-sm text-slate-800 shadow-md'
}

function renderOrderedBlock(key: CvMainSectionKey, d: ResumeData, p: ProfileData, pdfDesign: PdfDesign) {
  const h = sectionHeadingClass(pdfDesign)

  switch (key) {
    case 'summary':
      if (!p.summary?.trim())
        return null
      return (
        <Fragment key={key}>
          <h4 className={h}>{CvSectionTitleResolver.qualificationsProfile(d)}</h4>
          <p className="whitespace-pre-wrap leading-snug text-inherit opacity-95">{p.summary}</p>
        </Fragment>
      )

    case 'work':
      return (
        <Fragment key={key}>
          <h4 className={h}>{CvSectionTitleResolver.workExperience(d)}</h4>
          {d.workItems.length === 0 ? (
            <p className="text-stone-500">Keine Einträge</p>
          ) : (
            d.workItems.map((work, idx) => (
              <article key={idx} className="mb-3 border-b border-stone-200/70 pb-2 last:border-0">
                <strong className="text-inherit">{work.role} — {work.company}</strong>
                <div className="text-xs opacity-70">
                  {work.startDate} — {work.endDate}
                </div>
                {work.description?.trim() ? <p className="mt-1">{work.description}</p> : null}
                {work.bullets.length > 0 ? (
                  <ul className="mt-1 list-disc pl-4">
                    {work.bullets.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                ) : null}
              </article>
            ))
          )}
        </Fragment>
      )

    case 'education':
      return (
        <Fragment key={key}>
          <h4 className={h}>{CvSectionTitleResolver.education(d)}</h4>
          {d.educationItems.length === 0 ? (
            <p className="text-stone-500">Keine Einträge</p>
          ) : (
            d.educationItems.map((edu, idx) => (
              <article key={idx} className="mb-2">
                <strong>{edu.degree}</strong>
                <div>{edu.school}</div>
                <div className="text-xs opacity-70">
                  {edu.startDate} — {edu.endDate}
                </div>
                {edu.description?.trim() ? (
                  <p className="mt-1 whitespace-pre-wrap">{edu.description}</p>
                ) : null}
              </article>
            ))
          )}
        </Fragment>
      )

    case 'skills': {
      const groups = visibleSkillGroupsForPreview(d)
      return (
        <Fragment key={key}>
          <h4 className={h}>{CvSectionTitleResolver.skills(d)}</h4>
          {groups.length === 0 ? (
            <p className="text-stone-500">Keine Einträge</p>
          ) : (
            groups.map((skill, idx) => (
              <div key={idx} className="mb-1">
                <strong>{skill.categoryName}:</strong> {skill.items.join(', ')}
              </div>
            ))
          )}
        </Fragment>
      )
    }

    case 'languages': {
      const line = buildLanguagePreviewLine(d)
      if (!line)
        return null
      return (
        <Fragment key={key}>
          <h4 className={h}>{CvSectionTitleResolver.languages(d)}</h4>
          <p className="leading-relaxed">{line}</p>
        </Fragment>
      )
    }

    case 'interests':
      if (!d.hobbies?.length)
        return null
      return (
        <Fragment key={key}>
          <h4 className={h}>{CvSectionTitleResolver.interests(d)}</h4>
          <p>{d.hobbies.join(' · ')}</p>
        </Fragment>
      )

    case 'projects':
      if (!d.projects?.length)
        return null
      return (
        <Fragment key={key}>
          <h4 className={h}>{CvSectionTitleResolver.projects(d)}</h4>
          {d.projects.map((proj, idx) => (
            <article key={idx} className="mb-2">
              <strong>{proj.name}</strong>
              {proj.description?.trim() ? <p className="mt-1">{proj.description}</p> : null}
            </article>
          ))}
        </Fragment>
      )

    default:
      return null
  }
}

export function LivePreview({ resume, pdfDesign }: Props) {
  if (!resume) return null
  const d = resume.resumeData
  const p = d.profile
  const order = normalizeContentSectionOrder(d.contentSectionOrder)
  const shell = outerShellClass(pdfDesign)

  const headerBlock = (
    <>
      <div className="mb-3 flex gap-3 border-b border-stone-300/80 pb-3">
        {p.profileImageUrl?.trim() ? (
          <img src={p.profileImageUrl} alt="" className="h-16 w-16 rounded-lg object-cover" />
        ) : null}
        <div>
          <h3 className={`text-lg font-semibold ${pdfDesign === 'C' ? 'uppercase tracking-tight text-slate-900' : 'text-inherit'}`}>
            {p.firstName} {p.lastName}
          </h3>
          <p className={pdfDesign === 'B' ? 'text-stone-600' : pdfDesign === 'C' ? 'text-xs font-semibold uppercase text-cyan-800' : 'text-stone-600'}>
            {p.headline}
          </p>
        </div>
      </div>
      <p className="mb-2 text-xs opacity-75">
        {p.email} | {p.phone} | {p.location}
      </p>
      {hasSocialLinks(p) ? (
        <div className="mb-2 flex flex-wrap gap-2 text-xs opacity-80">
          {p.linkedInUrl?.trim() ? <span>in {formatUrl(p.linkedInUrl)}</span> : null}
          {p.gitHubUrl?.trim() ? <span>gh {formatUrl(p.gitHubUrl)}</span> : null}
          {p.portfolioUrl?.trim() ? <span>web {formatUrl(p.portfolioUrl)}</span> : null}
        </div>
      ) : null}
      {p.workPermit?.trim() ? (
        <div className="mb-2 text-xs text-emerald-800">✓ {p.workPermit}</div>
      ) : null}
    </>
  )

  const mainFlow = <>{order.map(key => renderOrderedBlock(key, d, p, pdfDesign))}</>

  if (pdfDesign === 'C') {
    return (
      <div className={shell}>
        <div className="flex min-h-[220px] gap-0 overflow-hidden rounded-lg border border-slate-200">
          <aside className="w-[28%] shrink-0 bg-slate-800 p-2.5 text-[10px] leading-snug text-slate-100">
            {p.profileImageUrl?.trim() ? (
              <div className="mb-2 flex justify-center">
                <img src={p.profileImageUrl} alt="" className="h-14 w-14 rounded-full object-cover ring-2 ring-cyan-600/50" />
              </div>
            ) : (
              <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-slate-700 text-sm font-bold text-slate-200">
                {(p.firstName?.[0] ?? '')}{(p.lastName?.[0] ?? '')}
              </div>
            )}
            {p.phone?.trim() ? <p className="mb-1">{p.phone}</p> : null}
            {p.email?.trim() ? <p className="mb-1 break-all">{p.email}</p> : null}
            {p.location?.trim() ? <p className="opacity-80">{p.location}</p> : null}
          </aside>
          <div className="min-w-0 flex-1 bg-white/90 p-3">
            {headerBlock}
            {mainFlow}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={shell}>
      {headerBlock}
      {mainFlow}
    </div>
  )
}
