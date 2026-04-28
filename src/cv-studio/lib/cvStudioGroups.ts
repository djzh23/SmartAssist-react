import type { CvStudioResumeSummary } from '../../types'

export interface CvResumeGroup {
  key: string
  label: string
  company: string | null
  role: string | null
  applicationId: string | null
  resumes: CvStudioResumeSummary[]
  latestUpdatedAt: string
  isUnlinked: boolean
}

export function groupResumes(resumes: CvStudioResumeSummary[]): CvResumeGroup[] {
  const map = new Map<string, CvResumeGroup>()

  for (const r of resumes) {
    let key: string
    let label: string
    const appId = r.linkedJobApplicationId ?? null
    const company = r.targetCompany ?? null
    const role = r.targetRole ?? null

    if (appId) {
      key = `app:${appId}`
    } else if (company || role) {
      key = `ctx:${(company ?? '').toLowerCase()}::${(role ?? '').toLowerCase()}`
    } else {
      key = '__unlinked__'
    }

    if (company && role) {
      label = `${company} - ${role}`
    } else if (company) {
      label = company
    } else if (role) {
      label = role
    } else if (appId) {
      label = 'Verknüpfte Bewerbung'
    } else {
      label = 'Allgemeine CVs'
    }

    if (!map.has(key)) {
      map.set(key, {
        key,
        label,
        company,
        role,
        applicationId: appId,
        resumes: [],
        latestUpdatedAt: r.updatedAtUtc,
        isUnlinked: key === '__unlinked__',
      })
    }

    const group = map.get(key)!
    group.resumes.push(r)
    if (r.updatedAtUtc > group.latestUpdatedAt) {
      group.latestUpdatedAt = r.updatedAtUtc
    }
  }

  return [...map.values()].sort((a, b) => {
    if (a.isUnlinked && !b.isUnlinked) return 1
    if (!a.isUnlinked && b.isUnlinked) return -1
    return b.latestUpdatedAt.localeCompare(a.latestUpdatedAt)
  })
}

export function filterGroups(groups: CvResumeGroup[], query: string): CvResumeGroup[] {
  if (!query.trim()) return groups
  const q = query.toLowerCase()
  return groups
    .map(g => ({
      ...g,
      resumes: g.resumes.filter(
        r =>
          r.title.toLowerCase().includes(q) ||
          (r.targetCompany ?? '').toLowerCase().includes(q) ||
          (r.targetRole ?? '').toLowerCase().includes(q),
      ),
    }))
    .filter(g => g.resumes.length > 0 || g.label.toLowerCase().includes(q))
}
