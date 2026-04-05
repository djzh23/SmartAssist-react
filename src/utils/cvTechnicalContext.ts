const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi
const PHONE_RE = /(?:\+?\d[\d\s().\-\/]{6,}\d)/g
const URL_RE = /\bhttps?:\/\/\S+\b/gi

const SENSITIVE_FIELD_RE = /\b(?:name|full\s*name|vorname|nachname|email|e-mail|mail|phone|telefon|mobile|address|anschrift|birth(?:date)?|geburtsdatum|dob|nationality|kontakt|contact|linkedin|xing)\b\s*[:\-]\s*[^\n|•]{0,180}/gi
const SENSITIVE_WORD_RE = /\b(?:email|e-mail|phone|telefon|mobile|address|anschrift|geburtsdatum|birthdate|dob|nationality|kontakt|contact|linkedin|xing)\b/gi

const ROLE_HINTS = [
  'developer', 'engineer', 'intern', 'consultant', 'manager', 'architect', 'analyst',
  'software', 'full stack', 'frontend', 'backend', 'devops', 'student assistant',
  'werkstudent', 'praktikum', 'praktikant', 'entwickler', 'ingenieur', 'berater',
]

const PROJECT_HINTS = [
  'project', 'projects', 'projekt', 'projekte', 'built', 'developed', 'implemented',
  'created', 'github', 'application', 'app', 'platform', 'prototype',
]

const EDUCATION_HINTS = [
  'bachelor', 'master', 'b.sc', 'm.sc', 'b.eng', 'm.eng', 'university', 'hochschule',
  'studium', 'education', 'ausbildung', 'fachhochschule', 'schule',
]

const SKILL_PATTERNS: Array<{ label: string; re: RegExp }> = [
  { label: 'React', re: /\breact\b/i },
  { label: 'TypeScript', re: /\btypescript\b|\bts\b/i },
  { label: 'JavaScript', re: /\bjavascript\b|\bjs\b/i },
  { label: 'Node.js', re: /\bnode\.?js\b|\bnode\b/i },
  { label: 'Next.js', re: /\bnext\.?js\b/i },
  { label: 'Vue', re: /\bvue\b|\bvue\.js\b/i },
  { label: 'Angular', re: /\bangular\b/i },
  { label: 'HTML', re: /\bhtml\b/i },
  { label: 'CSS', re: /\bcss\b/i },
  { label: 'Tailwind CSS', re: /\btailwind\b/i },
  { label: 'Sass', re: /\bsass\b|\bscss\b/i },
  { label: 'C#', re: /\bc#\b|\bcsharp\b/i },
  { label: '.NET', re: /\b\.net\b|\bdotnet\b/i },
  { label: 'ASP.NET', re: /\basp\.?net\b/i },
  { label: 'Java', re: /\bjava\b/i },
  { label: 'Spring', re: /\bspring\b/i },
  { label: 'Python', re: /\bpython\b/i },
  { label: 'Django', re: /\bdjango\b/i },
  { label: 'Flask', re: /\bflask\b/i },
  { label: 'C++', re: /\bc\+\+\b/i },
  { label: 'Go', re: /\bgolang\b/i },
  { label: 'Rust', re: /\brust\b/i },
  { label: 'SQL', re: /\bsql\b/i },
  { label: 'PostgreSQL', re: /\bpostgres(?:ql)?\b/i },
  { label: 'MySQL', re: /\bmysql\b/i },
  { label: 'MongoDB', re: /\bmongodb\b|\bmongo\b/i },
  { label: 'Redis', re: /\bredis\b/i },
  { label: 'Docker', re: /\bdocker\b/i },
  { label: 'Kubernetes', re: /\bkubernetes\b|\bk8s\b/i },
  { label: 'AWS', re: /\baws\b|\bamazon web services\b/i },
  { label: 'Azure', re: /\bazure\b/i },
  { label: 'GCP', re: /\bgcp\b|\bgoogle cloud\b/i },
  { label: 'Git', re: /\bgit\b/i },
  { label: 'REST API', re: /\brest\b/i },
  { label: 'GraphQL', re: /\bgraphql\b/i },
  { label: 'Linux', re: /\blinux\b/i },
  { label: 'CI/CD', re: /\bci\/cd\b|\bcontinuous integration\b/i },
]

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
    .replace(/\b(?:linkedin|xing)\s*:\s*[^\n|•]{0,160}/gi, ' ')
}

function splitIntoChunks(text: string): string[] {
  const chunked = text
    .replace(/[•·●▪◦]/g, '\n')
    .replace(/[|;]+/g, '\n')
    .replace(/\s+-\s+/g, '\n')
    .replace(/\s{2,}/g, ' ')
    .replace(/\b(SKILLS?|TECH(?:NOLOGIES)?|TECH\s*STACK|EXPERIENCE|WORK\s*EXPERIENCE|PROJECTS?|EDUCATION|AUSBILDUNG|ERFAHRUNG|KENNTNISSE|FÄHIGKEITEN)\b\s*:?/gi, '\n$1: ')

  return chunked
    .split(/\n+/)
    .map(line => line.trim())
    .filter(Boolean)
}

function cleanChunk(chunk: string): string {
  return chunk
    .replace(/^[-*•]+\s*/, '')
    .replace(SENSITIVE_WORD_RE, ' ')
    .replace(/[ ]{2,}/g, ' ')
    .trim()
}

function isMostlyNoise(chunk: string): boolean {
  if (!chunk) return true
  if (chunk.length < 3) return true

  const letters = (chunk.match(/[A-Za-zÄÖÜäöüß]/g) ?? []).length
  const digits = (chunk.match(/\d/g) ?? []).length
  if (letters === 0 && digits > 0) return true

  const tokens = chunk.toLowerCase().split(/\s+/).filter(Boolean)
  const sensitiveTokenCount = tokens.filter(t => /^(email|phone|telefon|mobile|address|anschrift|kontakt|linkedin|xing)$/i.test(t)).length
  if (tokens.length > 0 && sensitiveTokenCount / tokens.length > 0.6) return true

  return false
}

function unique(values: string[]): string[] {
  return [...new Set(values)]
}

function truncateLine(line: string, max = 140): string {
  const v = line.trim()
  return v.length <= max ? v : `${v.slice(0, max - 1).trim()}…`
}

function hasAnyHint(line: string, hints: string[]): boolean {
  const lower = line.toLowerCase()
  return hints.some(h => lower.includes(h))
}

function extractSkills(text: string, chunks: string[]): string[] {
  const found = SKILL_PATTERNS
    .filter(entry => entry.re.test(text))
    .map(entry => entry.label)

  // Capture additional comma-separated items from explicit skill sections.
  const sectionItems = chunks
    .filter(chunk => /\b(skills?|technologies|tech stack|kenntnisse|fähigkeiten|tools?)\b/i.test(chunk))
    .flatMap(chunk => chunk.split(/[:,/|,]+/))
    .map(v => v.trim())
    .filter(v => v.length >= 2 && v.length <= 30)
    .filter(v => /[A-Za-zÄÖÜäöüß]/.test(v))
    .filter(v => !/^(skills?|technologies|tech stack|kenntnisse|fähigkeiten|tools?)$/i.test(v))

  return unique([...found, ...sectionItems]).slice(0, 20)
}

function extractExperience(chunks: string[]): string[] {
  const yearRangeRe = /\b(?:19|20)\d{2}\s*(?:-|–|to|bis|\/)\s*(?:present|current|heute|now|(?:19|20)\d{2})\b/i
  const hasAnyYearRe = /\b(19|20)\d{2}\b/

  const lines = chunks.filter(chunk => {
    const lower = chunk.toLowerCase()
    if (yearRangeRe.test(lower)) return true
    if (hasAnyYearRe.test(lower) && hasAnyHint(chunk, ROLE_HINTS)) return true
    return hasAnyHint(chunk, ROLE_HINTS)
  })

  return unique(lines.map(line => truncateLine(line))).slice(0, 4)
}

function extractProjects(chunks: string[]): string[] {
  const lines = chunks.filter(chunk => {
    if (hasAnyHint(chunk, PROJECT_HINTS)) return true
    return /\b(github|gitlab|portfolio|demo)\b/i.test(chunk)
  })

  return unique(lines.map(line => truncateLine(line))).slice(0, 4)
}

function extractEducation(chunks: string[]): string[] {
  const lines = chunks.filter(chunk => hasAnyHint(chunk, EDUCATION_HINTS))
  return unique(lines.map(line => truncateLine(line))).slice(0, 3)
}

function fallbackFromChunks(chunks: string[], existing: string[], limit: number): string[] {
  if (existing.length > 0) return existing

  const fallback = chunks
    .filter(chunk => chunk.length >= 10)
    .filter(chunk => /[A-Za-zÄÖÜäöüß]/.test(chunk))
    .slice(0, limit)
    .map(line => truncateLine(line))

  return unique(fallback)
}

function formatSection(title: string, lines: string[]): string {
  if (lines.length === 0) return `${title}:\n- n/a`
  return `${title}:\n${lines.map(line => `- ${line}`).join('\n')}`
}

export function sanitizeTechnicalContext(input: string): string {
  const normalized = normalizeWhitespace(input)
  const redacted = redactSensitive(normalized)
  const chunks = splitIntoChunks(redacted)
    .map(cleanChunk)
    .filter(chunk => !isMostlyNoise(chunk))

  return chunks.join('\n').slice(0, 2500)
}

export function buildTechnicalCvContext(rawText: string): string {
  const sanitized = sanitizeTechnicalContext(rawText)
  const chunks = sanitized
    .split('\n')
    .map(v => v.trim())
    .filter(Boolean)

  const skills = extractSkills(sanitized, chunks)

  const experience = fallbackFromChunks(chunks, extractExperience(chunks), 4)
  const projects = fallbackFromChunks(chunks, extractProjects(chunks), 3)
  const education = fallbackFromChunks(chunks, extractEducation(chunks), 2)

  // If extraction was weak, still avoid empty output by using diverse chunk samples.
  const allEmpty = skills.length === 0 && experience.length === 0 && projects.length === 0 && education.length === 0
  const safeChunks = allEmpty
    ? chunks.slice(0, 3).map(line => truncateLine(line))
    : []

  const finalExperience = experience.length > 0 ? experience : safeChunks.slice(0, 2)
  const finalProjects = projects.length > 0 ? projects : safeChunks.slice(1, 3)
  const finalEducation = education.length > 0 ? education : safeChunks.slice(0, 1)

  const skillsLine = skills.length > 0
    ? `SKILLS: ${skills.join(', ')}`
    : (safeChunks.length > 0 ? `SKILLS: ${safeChunks[0]}` : 'SKILLS: n/a')

  return [
    skillsLine,
    '',
    formatSection('EXPERIENCE', finalExperience),
    '',
    formatSection('PROJECTS', finalProjects),
    '',
    formatSection('EDUCATION', finalEducation),
  ].join('\n')
}
