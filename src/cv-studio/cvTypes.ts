/** CV.Studio domain types (ported from cv-studio-react). */

export type PdfDesign = 'A' | 'B' | 'C'

export type JobCategory = 0 | 1 | 2 | 3

export interface CvSectionTitleOverrides {
  qualificationsProfile?: string | null
  workExperience?: string | null
  education?: string | null
  skills?: string | null
  projects?: string | null
  languagesAndInterests?: string | null
  contacts?: string | null
  languages?: string | null
  interests?: string | null
  languagesInlineLabel?: string | null
  interestsInlineLabel?: string | null
  designBLanguagesRowLabel?: string | null
  designBInterestsRowLabel?: string | null
}

export interface ProfileData {
  firstName: string
  lastName: string
  headline: string
  email: string
  phone: string
  location: string
  profileImageUrl: string
  gitHubUrl?: string | null
  linkedInUrl?: string | null
  portfolioUrl?: string | null
  workPermit?: string | null
  summary: string
}

export interface WorkItemData {
  company: string
  role: string
  startDate: string
  endDate: string
  description: string
  bullets: string[]
}

export interface EducationItemData {
  school: string
  degree: string
  startDate: string
  endDate: string
  /** Freitext zu Schwerpunkt, Abschlussarbeit, relevanten Modulen … */
  description?: string
}

export interface SkillGroupData {
  categoryName: string
  items: string[]
}

export interface LanguageItemData {
  label: string
  level?: string | null
  /** Stable id for React lists (optional, generated on add). */
  rowKey?: string | null
}

export interface ResumeProjectItem {
  name: string
  description: string
  technologies: string[]
}

export interface ResumeData {
  profile: ProfileData
  workItems: WorkItemData[]
  educationItems: EducationItemData[]
  projects: ResumeProjectItem[]
  skills: SkillGroupData[]
  hobbies: string[]
  /** Eigene Sprachen (Sektion „Sprachen“); leer = Fallback aus Kenntnissen mit Sprach-Kategorie. */
  languageItems: LanguageItemData[]
  sectionTitles?: CvSectionTitleOverrides | null
  /** Reihenfolge der Haupt-Sektionen in PDF/DOCX/Vorschau (Keys siehe cvStudioSectionOrder). */
  contentSectionOrder?: string[] | null
}

export interface ResumeDto {
  id: string
  title: string
  templateKey?: string | null
  resumeData: ResumeData
  updatedAtUtc: string
  linkedJobApplicationId?: string | null
  targetCompany?: string | null
  targetRole?: string | null
  notes?: string | null
}

export interface ResumeSummaryDto {
  id: string
  title: string
  templateKey?: string | null
  updatedAtUtc: string
  linkedJobApplicationId?: string | null
  targetCompany?: string | null
  targetRole?: string | null
  notes?: string | null
}

export interface LinkJobApplicationRequest {
  jobApplicationId?: string | null
  targetCompany?: string | null
  targetRole?: string | null
}

export interface PatchResumeNotesRequest {
  notes?: string | null
}

export interface ResumeVersionDto {
  id: string
  resumeId: string
  versionNumber: number
  label?: string | null
  resumeData: ResumeData
  createdAtUtc: string
}

export interface ResumeTemplateDto {
  key: string
  displayName: string
  description: string
}

export interface CreateResumeRequest {
  title: string
  templateKey?: string | null
  resumeData: ResumeData
}

export interface UpdateResumeRequest {
  title: string
  templateKey?: string | null
  resumeData: ResumeData
}

export interface CreateVersionRequest {
  label?: string | null
}

export interface UpdateVersionRequest {
  label?: string | null
}
