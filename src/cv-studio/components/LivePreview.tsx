import { Fragment, useLayoutEffect, useRef, useState } from 'react'
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

function splitCompanyField(company: string): { org: string; location?: string } {
  const i = company.indexOf('|')
  if (i < 0)
    return { org: company.trim() }
  return { org: company.slice(0, i).trim(), location: company.slice(i + 1).trim() }
}

function ClassicHeaderA({ p }: { p: ProfileData }) {
  const contactLine = [p.email, p.phone, p.location].filter(x => x?.trim()).join('  |  ')
  return (
    <div className="mb-3 flex gap-2.5">
      <div className="h-[82px] w-[82px] shrink-0 overflow-hidden border border-[#C5D5E8] bg-slate-100">
        {p.profileImageUrl?.trim() ? (
          <img src={p.profileImageUrl} alt="" className="h-full w-full object-cover" />
        ) : null}
      </div>
      <div className="min-w-0 flex-1 border-l-[3px] border-[#1A3A5C] pl-2.5">
        <h3 className="text-[26px] font-bold leading-tight tracking-tight text-[#111827]">
          {p.firstName} {p.lastName}
        </h3>
        {p.headline?.trim() ? (
          <p className="mt-1 text-[11.5px] font-semibold tracking-wide text-[#4B5563]">{p.headline}</p>
        ) : null}
        {contactLine ? (
          <p className="mt-2 whitespace-normal break-words text-[10.5px] font-semibold leading-snug text-[#1C2833]">{contactLine}</p>
        ) : null}
        {hasSocialLinks(p) ? (
          <div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-0.5 text-[9.5px] font-semibold text-[#374151]">
            {p.linkedInUrl?.trim() ? <span>in: {formatUrl(p.linkedInUrl)}</span> : null}
            {p.gitHubUrl?.trim() ? <span>gh: {formatUrl(p.gitHubUrl)}</span> : null}
            {p.portfolioUrl?.trim() ? <span>web: {formatUrl(p.portfolioUrl)}</span> : null}
          </div>
        ) : null}
        {p.workPermit?.trim() ? (
          <div className="mt-2 inline-block max-w-full rounded border border-emerald-200 bg-emerald-50 px-1.5 py-1 text-[9px] font-semibold leading-snug text-emerald-800">
            ✓
            {' '}
            {p.workPermit}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function HeaderModernB({ p }: { p: ProfileData }) {
  const contacts = [p.email, p.phone, p.location].filter(x => x?.trim()).join('  |  ')
  return (
    <div className="mb-3">
      <div className="flex gap-3.5">
        <div className="h-[92px] w-[92px] shrink-0 overflow-hidden border border-[#D5D7DC] bg-[#F1F2F6]">
          {p.profileImageUrl?.trim() ? (
            <img src={p.profileImageUrl} alt="" className="h-full w-full object-cover" />
          ) : null}
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <h3 className="text-[25px] font-bold text-[#111827]">
            {p.firstName} {p.lastName}
          </h3>
          {p.headline?.trim() ? <p className="text-[14px] text-[#5F6C7A]">{p.headline}</p> : null}
        </div>
      </div>
      {contacts ? (
        <p className="mt-2 text-[8px] font-semibold text-[#6B7280]">{contacts}</p>
      ) : null}
      {hasSocialLinks(p) ? (
        <div className="mt-1 flex flex-wrap gap-x-2 text-[7.5px] font-semibold text-[#6B7280]">
          {p.linkedInUrl?.trim() ? <span>LinkedIn: {formatUrl(p.linkedInUrl)}</span> : null}
          {p.gitHubUrl?.trim() ? <span>GitHub: {formatUrl(p.gitHubUrl)}</span> : null}
          {p.portfolioUrl?.trim() ? <span>Portfolio: {formatUrl(p.portfolioUrl)}</span> : null}
        </div>
      ) : null}
      {p.workPermit?.trim() ? (
        <div className="mt-2 inline-block rounded border border-emerald-200 bg-emerald-50 px-1.5 py-1 text-[7.5px] font-semibold text-emerald-800">
          ✓
          {' '}
          {p.workPermit}
        </div>
      ) : null}
    </div>
  )
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
    return "rounded-xl border border-[#C5D5E8] bg-[#F8FAFC] p-3 text-[10.5px] leading-[1.2] text-[#1C2833] shadow-md font-['Lato',ui-sans-serif,'Segoe_UI',sans-serif]"
  }
  if (pdf === 'B') {
    return "rounded-xl border border-stone-200 bg-white p-3 text-[10.8px] leading-[1.22] text-[#222222] shadow-md font-['Lato',ui-sans-serif,'Segoe_UI',sans-serif]"
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
            d.workItems.map((work, idx) => {
              if (pdfDesign === 'A') {
                const { org, location: loc } = splitCompanyField(work.company)
                return (
                  <article key={idx} className="mb-3 break-inside-avoid border-b border-[#C5D5E8]/70 pb-2 last:border-0">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <strong className="font-bold text-[#1A3A5C]">{org}</strong>
                      <span className="shrink-0 text-right text-[9.2px] italic text-[#7D8A99]">
                        {work.startDate} - {work.endDate}
                      </span>
                    </div>
                    {(loc || work.role?.trim()) ? (
                      <div className="mt-0.5 text-[9.2px] text-[#7D8A99]">
                        {loc ? <span>{loc}</span> : null}
                        {loc && work.role?.trim() ? <span className="px-1"> </span> : null}
                        {work.role?.trim() ? (
                          <span className="font-bold italic text-[#1A7A6E]">{work.role.trim()}</span>
                        ) : null}
                      </div>
                    ) : null}
                    {work.description?.trim() ? (
                      <p className="mt-1 italic text-[#7D8A99]">{work.description}</p>
                    ) : null}
                    {work.bullets.length > 0 ? (
                      <ul className="mt-1 list-disc pl-4 text-[#1C2833]">
                        {work.bullets.map((b, i) => (
                          <li key={i}>{b}</li>
                        ))}
                      </ul>
                    ) : null}
                  </article>
                )
              }
              return (
                <article key={idx} className="mb-3 break-inside-avoid border-b border-stone-200/70 pb-2 last:border-0">
                  <strong className="text-inherit">{work.role} - {work.company}</strong>
                  <div className="text-xs opacity-70">
                    {work.startDate} - {work.endDate}
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
              )
            })
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
              <article key={idx} className="mb-2 break-inside-avoid">
                <strong>{edu.degree}</strong>
                <div>{edu.school}</div>
                <div className="text-xs opacity-70">
                  {edu.startDate} - {edu.endDate}
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

function PreviewBodyAB({ resume, pdfDesign }: { resume: ResumeDto; pdfDesign: 'A' | 'B' }) {
  const d = resume.resumeData
  const p = d.profile
  const order = normalizeContentSectionOrder(d.contentSectionOrder)
  return (
    <>
      {pdfDesign === 'A' ? (
        <>
          <ClassicHeaderA p={p} />
          <div className="mb-2 border-b-[1.2px] border-[#1A3A5C]" />
        </>
      ) : (
        <HeaderModernB p={p} />
      )}
      {order.map(key => renderOrderedBlock(key, d, p, pdfDesign))}
    </>
  )
}

export function LivePreview({ resume, pdfDesign }: Props) {
  const shellRef = useRef<HTMLDivElement>(null)
  const measureRef = useRef<HTMLDivElement>(null)
  const [innerW, setInnerW] = useState(0)
  const [needsSecondPage, setNeedsSecondPage] = useState(false)

  useLayoutEffect(() => {
    const el = shellRef.current
    if (!el)
      return
    const ro = new ResizeObserver(() => {
      setInnerW(el.clientWidth)
    })
    ro.observe(el)
    setInnerW(el.clientWidth)
    return () => ro.disconnect()
  }, [])

  const contentW = Math.max(0, innerW)
  const pageH = contentW > 0 ? contentW * (297 / 210) : 0

  useLayoutEffect(() => {
    if (pdfDesign === 'C' || !pageH)
      return
    const el = measureRef.current
    if (!el)
      return
    const measure = () => {
      setNeedsSecondPage(el.scrollHeight > pageH + 2)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [pdfDesign, pageH, resume?.id, resume?.updatedAtUtc, resume?.resumeData])

  if (!resume) return null
  const d = resume.resumeData
  const p = d.profile
  const order = normalizeContentSectionOrder(d.contentSectionOrder)
  const shell = outerShellClass(pdfDesign)

  const headerBlockC = (
    <>
      <div className="mb-3 flex gap-3 border-b border-stone-300/80 pb-3">
        {p.profileImageUrl?.trim() ? (
          <img src={p.profileImageUrl} alt="" className="h-16 w-16 rounded-lg object-cover" />
        ) : null}
        <div>
          <h3 className="text-lg font-semibold uppercase tracking-tight text-slate-900">
            {p.firstName} {p.lastName}
          </h3>
          <p className="text-xs font-semibold uppercase text-cyan-800">{p.headline}</p>
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

  const mainFlowC = <>{order.map(key => renderOrderedBlock(key, d, p, pdfDesign))}</>

  if (pdfDesign === 'C') {
    return (
      <div ref={shellRef} className={shell}>
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
            {headerBlockC}
            {mainFlowC}
          </div>
        </div>
      </div>
    )
  }

  const pageFrameClass =
    pdfDesign === 'A'
      ? 'overflow-hidden rounded-sm border border-[#C5D5E8] bg-white shadow-sm'
      : 'overflow-hidden rounded-sm border border-stone-200 bg-white shadow-sm'

  return (
    <div ref={shellRef} className={`${shell} relative`}>
      <div
        ref={measureRef}
        className="pointer-events-none absolute left-0 right-0 top-0 -z-10 opacity-0"
        aria-hidden
      >
        <PreviewBodyAB resume={resume} pdfDesign={pdfDesign} />
      </div>
      <p className="mb-1 text-center text-[9px] font-semibold uppercase tracking-wide text-stone-500">Seite 1</p>
      <div
        className={`mb-3 ${pageFrameClass}`}
        style={{ height: pageH > 0 ? `${pageH}px` : undefined }}
      >
        <PreviewBodyAB resume={resume} pdfDesign={pdfDesign} />
      </div>
      {needsSecondPage && pageH > 0 ? (
        <>
          <p className="mb-1 mt-2 text-center text-[9px] font-semibold uppercase tracking-wide text-stone-500">Seite 2</p>
          <div className={pageFrameClass} style={{ height: `${pageH}px` }}>
            <div style={{ marginTop: `-${pageH}px` }}>
              <PreviewBodyAB resume={resume} pdfDesign={pdfDesign} />
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
