import type { ProfileData, ResumeData } from '../cvTypes'
import { normalizeContentSectionOrder } from './cvStudioSectionOrder'

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
    })),
    sectionTitles: r.sectionTitles ? { ...r.sectionTitles } : {},
    contentSectionOrder: normalizeContentSectionOrder(r.contentSectionOrder ?? undefined),
  }
}

export function normalizeResumeDto<T extends { resumeData: ResumeData }>(dto: T): T {
  return {
    ...dto,
    resumeData: coerceResumeData(dto.resumeData),
  }
}
