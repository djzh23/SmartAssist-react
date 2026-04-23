import type { CvSectionTitleOverrides, ProfileData, ResumeData } from '../cvTypes'
import { normalizeContentSectionOrder } from './cvStudioSectionOrder'

function migrateLegacySectionTitles(st: CvSectionTitleOverrides | null | undefined): CvSectionTitleOverrides {
  const out: CvSectionTitleOverrides = { ...(st ?? {}) }
  const combo = out.languagesAndInterests?.trim()
  if (!combo)
    return out
  if (!out.languages?.trim())
    out.languages = 'Sprachen'
  if (!out.interests?.trim())
    out.interests = 'Interessen'
  delete out.languagesAndInterests
  return out
}


const emptyProfile = (): ProfileData => ({
  firstName: '',
  lastName: '',
  headline: '',
  email: '',
  phone: '',
  location: '',
  profileImageUrl: '',
  gitHubUrl: '',
  linkedInUrl: '',
  portfolioUrl: '',
  workPermit: '',
  summary: '',
})

export function coerceResumeData(raw: ResumeData | undefined | null): ResumeData {
  const r = raw ?? ({} as ResumeData)
  return {
    profile: { ...emptyProfile(), ...r.profile },
    workItems: r.workItems ?? [],
    educationItems: r.educationItems ?? [],
    projects: r.projects ?? [],
    skills: r.skills ?? [],
    hobbies: r.hobbies ?? [],
    languageItems: (r.languageItems ?? []).map(li => ({
      label: li.label ?? '',
      level: li.level ?? '',
      rowKey: li.rowKey?.trim() || null,
    })),
    sectionTitles: migrateLegacySectionTitles(r.sectionTitles ? { ...r.sectionTitles } : {}),
    contentSectionOrder: normalizeContentSectionOrder(r.contentSectionOrder ?? undefined),
  }
}

export function normalizeResumeDto<T extends { resumeData: ResumeData }>(dto: T): T {
  return {
    ...dto,
    resumeData: coerceResumeData(dto.resumeData),
  }
}
