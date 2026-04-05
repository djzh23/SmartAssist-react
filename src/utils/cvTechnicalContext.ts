const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi
const PHONE_RE = /(?:\+?\d[\d\s().\-\/]{6,}\d)/g
const URL_RE = /\bhttps?:\/\/\S+\b/gi

const SENSITIVE_FIELD_RE = /\b(?:name|full\s*name|vorname|nachname|email|e-mail|mail|phone|telefon|mobile|address|anschrift|street|straße|birth(?:date)?|geburtsdatum|dob|nationality|kontakt|contact|linkedin|xing|github)\b\s*[:\-]\s*[^\n]{0,180}/gi
const SENSITIVE_WORD_RE = /\b(?:email|e-mail|phone|telefon|mobile|address|anschrift|street|straße|geburtsdatum|birthdate|dob|nationality|kontakt|contact|linkedin|xing)\b/gi

const EXPERIENCE_HINTS = [
  'experience', 'work experience', 'employment', 'berufserfahrung', 'erfahrung', 'berufliche laufbahn',
  'position', 'role', 'job title', 'responsibility', 'responsibilities', 'aufgaben', 'tätigkeit',
  'manager', 'specialist', 'assistant', 'consultant', 'coordinator', 'representative',
  'developer', 'engineer', 'architect', 'analyst', 'designer', 'researcher',
  'teacher', 'lecturer', 'trainer', 'coach', 'nurse', 'therapist', 'caregiver',
  'sales', 'account manager', 'business development', 'marketing', 'hr', 'recruiter',
  'finance', 'accounting', 'controller', 'procurement', 'logistics', 'operations',
  'project manager', 'product manager', 'customer service', 'support', 'administration',
  'praktikum', 'werkstudent', 'intern', 'apprentice', 'trainee',
]

const PROJECT_HINTS = [
  'project', 'projects', 'projekt', 'projekte', 'initiative', 'campaign', 'kampagne',
  'case study', 'portfolio', 'launch', 'rollout', 'implementation', 'implemented', 'built',
  'developed', 'created', 'optimiert', 'verbessert', 'migration', 'transformation',
]

const EDUCATION_HINTS = [
  'education', 'ausbildung', 'studium', 'academic', 'degree', 'diploma', 'certificate',
  'bachelor', 'master', 'mba', 'phd', 'b.sc', 'm.sc', 'b.a', 'm.a', 'b.eng', 'm.eng',
  'schule', 'hochschule', 'university', 'college', 'fachhochschule', 'training', 'weiterbildung',
]

const HEADING_HINTS: Record<SectionKey, string[]> = {
  skills: [
    'skills', 'core skills', 'kompetenzen', 'fähigkeiten', 'kenntnisse', 'tools',
    'technologien', 'tech stack', 'stärken', 'qualifikationen', 'expertise',
  ],
  experience: [
    'experience', 'work experience', 'professional experience', 'employment history',
    'berufserfahrung', 'erfahrung', 'berufliche laufbahn', 'stationen', 'tätigkeiten',
  ],
  projects: [
    'projects', 'project experience', 'project work', 'projekte', 'projekte und erfolge',
    'initiatives', 'kampagnen', 'referenzen',
  ],
  education: [
    'education', 'academic background', 'degrees', 'certifications', 'ausbildung',
    'studium', 'abschluss', 'weiterbildung',
  ],
}

const SKILL_PATTERNS: Array<{ label: string; re: RegExp }> = [
  // Tech
  { label: 'React', re: /\breact\b/i },
  { label: 'TypeScript', re: /\btypescript\b/i },
  { label: 'JavaScript', re: /\bjavascript\b/i },
  { label: 'Node.js', re: /\bnode\.?js\b|\bnode\b/i },
  { label: 'Python', re: /\bpython\b/i },
  { label: 'Java', re: /\bjava\b/i },
  { label: 'C#', re: /\bc#\b|\bcsharp\b/i },
  { label: '.NET', re: /\b\.net\b|\bdotnet\b/i },
  { label: 'SQL', re: /\bsql\b/i },
  { label: 'Docker', re: /\bdocker\b/i },
  { label: 'Kubernetes', re: /\bkubernetes\b|\bk8s\b/i },
  { label: 'AWS', re: /\baws\b|\bamazon web services\b/i },
  { label: 'Azure', re: /\bazure\b/i },
  { label: 'Git', re: /\bgit\b/i },

  // Business / office
  { label: 'Excel', re: /\bexcel\b/i },
  { label: 'PowerPoint', re: /\bpowerpoint\b/i },
  { label: 'Power BI', re: /\bpower\s*bi\b/i },
  { label: 'Tableau', re: /\btableau\b/i },
  { label: 'SAP', re: /\bsap\b/i },
  { label: 'Salesforce', re: /\bsalesforce\b/i },
  { label: 'HubSpot', re: /\bhubspot\b/i },
  { label: 'CRM', re: /\bcrm\b/i },
  { label: 'ERP', re: /\berp\b/i },

  // Marketing / sales
  { label: 'SEO', re: /\bseo\b/i },
  { label: 'SEM', re: /\bsem\b/i },
  { label: 'Google Ads', re: /\bgoogle ads\b/i },
  { label: 'Meta Ads', re: /\bmeta ads\b|\bfacebook ads\b/i },
  { label: 'Content Marketing', re: /\bcontent marketing\b/i },
  { label: 'B2B Sales', re: /\bb2b\b/i },
  { label: 'Negotiation', re: /\bnegotiation\b|\bverhandlung\b/i },

  // HR / people
  { label: 'Recruiting', re: /\brecruiting\b|\brecruitment\b/i },
  { label: 'Payroll', re: /\bpayroll\b|\blohnabrechnung\b/i },
  { label: 'Onboarding', re: /\bonboarding\b/i },

  // Finance / operations
  { label: 'Controlling', re: /\bcontrolling\b/i },
  { label: 'Accounting', re: /\baccounting\b|\bbuchhaltung\b/i },
  { label: 'Procurement', re: /\bprocurement\b|\beinkauf\b/i },
  { label: 'Logistics', re: /\blogistics\b|\blogistik\b/i },
  { label: 'Supply Chain', re: /\bsupply chain\b/i },

  // Healthcare / education / design
  { label: 'Patient Care', re: /\bpatient care\b|\bpatientenbetreuung\b/i },
  { label: 'EMR', re: /\bemr\b|\behr\b/i },
  { label: 'Didactics', re: /\bdidactics\b|\bdidaktik\b/i },
  { label: 'Figma', re: /\bfigma\b/i },
  { label: 'Adobe Photoshop', re: /\bphotoshop\b/i },
  { label: 'AutoCAD', re: /\bautocad\b/i },

  // Cross-functional
  { label: 'Project Management', re: /\bproject management\b|\bprojektmanagement\b/i },
  { label: 'Scrum', re: /\bscrum\b/i },
  { label: 'Kanban', re: /\bkanban\b/i },
  { label: 'Leadership', re: /\bleadership\b|\bführung\b/i },
  { label: 'Communication', re: /\bcommunication\b|\bkommunikation\b/i },
]

type SectionKey = 'skills' | 'experience' | 'projects' | 'education'

type Buckets = Record<SectionKey, string[]>

function normalizeWhitespace(text: string): string {
  return text
    .replace(/\r\n?/g, '\n')
    .replace(/[\t\f\v]+/g, ' ')
    .replace(/[ ]{2,}/g, ' ')
}

function redactSensitive(text: string): string {
  return text
    .replace(EMAIL_RE, ' ')
    .replace(PHONE_RE, ' ')
    .replace(URL_RE, ' ')
    .replace(SENSITIVE_FIELD_RE, ' ')
    .replace(/\b(?:linkedin|xing|github)\s*:\s*[^\n]{0,160}/gi, ' ')
}

function splitIntoLines(text: string): string[] {
  const exploded = text
    .replace(/[\u2022\u00B7\u25CF\u25AA\u25E6]/g, '\n')
    .replace(/[|;]+/g, '\n')
    .replace(/\s+-\s+/g, '\n')
    .replace(/\s{2,}/g, ' ')

  return exploded
    .split(/\n+/)
    .map(line => line.trim())
    .filter(Boolean)
}

function cleanLine(line: string): string {
  return line
    .replace(/^[-*•]+\s*/, '')
    .replace(SENSITIVE_WORD_RE, ' ')
    .replace(/[ ]{2,}/g, ' ')
    .trim()
}

function isNoiseLine(line: string): boolean {
  if (!line) return true
  if (line.length < 2) return true

  const letters = (line.match(/[A-Za-zÄÖÜäöüß]/g) ?? []).length
  const digits = (line.match(/\d/g) ?? []).length
  if (letters === 0 && digits > 0) return true

  return false
}

function unique(values: string[]): string[] {
  return [...new Set(values)]
}

function truncateLine(line: string, max = 160): string {
  const v = line.trim()
  return v.length <= max ? v : `${v.slice(0, max - 1).trim()}…`
}

function includesAny(haystack: string, needles: string[]): boolean {
  const lower = haystack.toLowerCase()
  return needles.some(n => lower.includes(n))
}

function detectHeading(line: string): { section: SectionKey; remainder: string } | null {
  const normalized = line.toLowerCase().replace(/[.:]/g, '').trim()

  for (const section of Object.keys(HEADING_HINTS) as SectionKey[]) {
    const isHeading = HEADING_HINTS[section].some(hint => normalized === hint || normalized.startsWith(`${hint} `) || normalized.startsWith(`${hint}:`))
    if (!isHeading) continue

    const split = line.split(':')
    const remainder = split.length > 1 ? split.slice(1).join(':').trim() : ''
    return { section, remainder }
  }

  return null
}

function tokenizeSkillItems(line: string): string[] {
  const cleaned = line
    .replace(/^\s*(skills?|core skills|tools?|technologien|kenntnisse|fähigkeiten)\s*:?\s*/i, '')
    .trim()

  if (!cleaned) return []

  return cleaned
    .split(/[,/|]+/)
    .map(v => v.trim())
    .filter(v => v.length >= 2 && v.length <= 40)
    .filter(v => /[A-Za-zÄÖÜäöüß]/.test(v))
    .filter(v => !/^\d+$/.test(v))
    .filter(v => !/^(skills?|tools?|technologien|kenntnisse|fähigkeiten)$/i.test(v))
    .filter(v => v.split(/\s+/).length <= 4)
}

function inferSection(line: string): SectionKey | null {
  const lower = line.toLowerCase()

  const yearRange = /\b(?:19|20)\d{2}\s*(?:-|–|to|bis|\/)\s*(?:present|current|heute|now|(?:19|20)\d{2})\b/i
  const hasYear = /\b(19|20)\d{2}\b/

  const educationScore = Number(includesAny(lower, EDUCATION_HINTS)) + Number(/\b(certified|zertifikat|diplom|degree|abschluss)\b/i.test(lower))
  const projectScore = Number(includesAny(lower, PROJECT_HINTS)) + Number(/\b(increased|reduced|improved|optimiert|verbessert|steigerte|senkte)\b/i.test(lower))
  const experienceScore =
    Number(yearRange.test(lower)) +
    Number(hasYear.test(lower)) +
    Number(includesAny(lower, EXPERIENCE_HINTS)) +
    Number(/\b(responsible|managed|led|betreut|geleitet|verantwortlich)\b/i.test(lower))

  if (educationScore >= 1 && educationScore >= projectScore && educationScore >= experienceScore) return 'education'
  if (projectScore >= 2 && projectScore >= experienceScore) return 'projects'
  if (experienceScore >= 1) return 'experience'

  const tokenCount = lower.split(/\s+/).length
  const looksLikeSkillList = tokenCount <= 10 && /[,/|]/.test(lower)
  if (looksLikeSkillList) return 'skills'

  return null
}

function collectBuckets(lines: string[]): { buckets: Buckets; misc: string[] } {
  const buckets: Buckets = { skills: [], experience: [], projects: [], education: [] }
  const misc: string[] = []

  let active: SectionKey | null = null

  for (const rawLine of lines) {
    const heading = detectHeading(rawLine)
    if (heading) {
      active = heading.section
      if (heading.remainder) buckets[heading.section].push(heading.remainder)
      continue
    }

    const line = rawLine.trim()
    if (!line) continue

    const inferred = inferSection(line)
    if (inferred) {
      buckets[inferred].push(line)
      continue
    }

    if (active) {
      buckets[active].push(line)
    } else {
      misc.push(line)
    }
  }

  return { buckets, misc }
}

function extractPatternSkills(text: string): string[] {
  return SKILL_PATTERNS
    .filter(entry => entry.re.test(text))
    .map(entry => entry.label)
}

function extractSkills(lines: string[], text: string): string[] {
  const explicit = lines.flatMap(tokenizeSkillItems)
  const pattern = extractPatternSkills(text)
  return unique([...pattern, ...explicit]).slice(0, 24)
}

function pickExperience(lines: string[], misc: string[]): string[] {
  const selected = lines
    .filter(line => {
      const lower = line.toLowerCase()
      return /\b(19|20)\d{2}\b/.test(lower) || includesAny(lower, EXPERIENCE_HINTS) || /\b(managed|led|responsible|geleitet|verantwortlich|betreut)\b/i.test(lower)
    })
    .map(v => truncateLine(v))

  if (selected.length > 0) return unique(selected).slice(0, 5)

  return unique(misc.map(v => truncateLine(v)).slice(0, 4))
}

function pickProjects(lines: string[], experience: string[], misc: string[]): string[] {
  const selected = lines
    .filter(line => includesAny(line.toLowerCase(), PROJECT_HINTS) || /\b(increased|reduced|improved|optimiert|verbessert|steigerte|senkte)\b/i.test(line))
    .map(v => truncateLine(v))

  if (selected.length > 0) return unique(selected).slice(0, 4)

  const fromExperience = experience
    .filter(line => /\b(increased|reduced|improved|optimiert|verbessert|steigerte|senkte|implemented|eingeführt)\b/i.test(line))
    .slice(0, 3)
  if (fromExperience.length > 0) return unique(fromExperience)

  return unique(misc.map(v => truncateLine(v)).slice(0, 3))
}

function pickEducation(lines: string[], misc: string[]): string[] {
  const selected = lines
    .filter(line => includesAny(line.toLowerCase(), EDUCATION_HINTS) || /\b(certified|zertifikat|diplom|degree|abschluss)\b/i.test(line))
    .map(v => truncateLine(v))

  if (selected.length > 0) return unique(selected).slice(0, 3)

  return unique(misc
    .filter(line => includesAny(line.toLowerCase(), EDUCATION_HINTS))
    .map(v => truncateLine(v))
    .slice(0, 2))
}

function formatSection(title: string, lines: string[]): string {
  if (lines.length === 0) return `${title}:\n- n/a`
  return `${title}:\n${lines.map(line => `- ${line}`).join('\n')}`
}

export function sanitizeTechnicalContext(input: string): string {
  const normalized = normalizeWhitespace(input)
  const redacted = redactSensitive(normalized)
  const lines = splitIntoLines(redacted)
    .map(cleanLine)
    .filter(line => !isNoiseLine(line))

  return lines.join('\n').slice(0, 3000)
}

export function buildTechnicalCvContext(rawText: string): string {
  const sanitized = sanitizeTechnicalContext(rawText)
  const lines = sanitized
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)

  const { buckets, misc } = collectBuckets(lines)

  const skills = extractSkills(buckets.skills, sanitized)
  const experience = pickExperience(buckets.experience, misc)
  const projects = pickProjects(buckets.projects, experience, misc)
  const education = pickEducation(buckets.education, misc)

  const fallbackSkill = misc.find(line => line.split(/\s+/).length <= 6)
  const skillsLine = skills.length > 0
    ? `SKILLS: ${skills.join(', ')}`
    : (fallbackSkill ? `SKILLS: ${truncateLine(fallbackSkill, 80)}` : 'SKILLS: n/a')

  return [
    skillsLine,
    '',
    formatSection('EXPERIENCE', experience),
    '',
    formatSection('PROJECTS', projects),
    '',
    formatSection('EDUCATION', education),
  ].join('\n')
}