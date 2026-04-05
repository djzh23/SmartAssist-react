const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi
const PHONE_RE = /(?:\+?\d[\d\s().\-\/]{6,}\d)/g
const URL_RE = /\bhttps?:\/\/\S+\b/gi

const SENSITIVE_KEYWORDS = [
  'name',
  'full name',
  'vorname',
  'nachname',
  'email',
  'e-mail',
  'mail',
  'phone',
  'telefon',
  'mobile',
  'address',
  'anschrift',
  'birth',
  'geburt',
  'dob',
  'nationality',
  'kontakt',
  'contact',
  'linkedin',
  'xing',
]

const ROLE_HINTS = [
  'developer',
  'engineer',
  'intern',
  'consultant',
  'manager',
  'architect',
  'analyst',
]

const PROJECT_HINTS = [
  'project',
  'projekt',
  'built',
  'developed',
  'implemented',
  'created',
]

const EDUCATION_HINTS = [
  'bachelor',
  'master',
  'b.sc',
  'm.sc',
  'university',
  'hochschule',
  'studium',
  'education',
]

const TECH_KEYWORDS = [
  'react',
  'typescript',
  'javascript',
  'node',
  'next.js',
  'tailwind',
  'html',
  'css',
  'c#',
  'java',
  '.net',
  'asp.net',
  'python',
  'sql',
  'postgresql',
  'mongodb',
  'docker',
  'kubernetes',
  'aws',
  'azure',
  'gcp',
  'git',
  'rest',
  'graphql',
  'redis',
  'linux',
]

function cleanLine(line: string): string {
  return line
    .replace(/^[-*•]\s*/, '')
    .replace(EMAIL_RE, '')
    .replace(PHONE_RE, '')
    .replace(URL_RE, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function hasSensitiveKeyword(line: string): boolean {
  const lower = line.toLowerCase()
  return SENSITIVE_KEYWORDS.some(keyword => lower.includes(keyword))
}

function unique(values: string[]): string[] {
  return [...new Set(values)]
}

function pickSkills(text: string): string[] {
  const lower = text.toLowerCase()
  return TECH_KEYWORDS
    .filter(skill => lower.includes(skill.toLowerCase()))
    .map(skill => skill.replace(/\b\w/g, c => c.toUpperCase()))
}

function formatSection(title: string, lines: string[]): string {
  if (lines.length === 0) return `${title}:\n- n/a`
  return `${title}:\n${lines.map(line => `- ${line}`).join('\n')}`
}

export function sanitizeTechnicalContext(input: string): string {
  const sanitizedLines = input
    .split(/\r?\n/)
    .map(cleanLine)
    .filter(line => line.length >= 2)
    .filter(line => !hasSensitiveKeyword(line))

  return sanitizedLines.join('\n').slice(0, 2000)
}

export function buildTechnicalCvContext(rawText: string): string {
  const sanitized = sanitizeTechnicalContext(rawText)
  const lines = sanitized
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)

  const lowerLines = lines.map(line => line.toLowerCase())
  const skills = unique(pickSkills(sanitized)).slice(0, 20)

  const experience = unique(
    lines.filter((line, idx) => {
      const lower = lowerLines[idx]
      const hasYear = /\b(19|20)\d{2}\b/.test(line)
      return hasYear || ROLE_HINTS.some(hint => lower.includes(hint))
    }),
  ).slice(0, 4)

  const projects = unique(
    lines.filter((_, idx) => PROJECT_HINTS.some(hint => lowerLines[idx].includes(hint))),
  ).slice(0, 4)

  const education = unique(
    lines.filter((_, idx) => EDUCATION_HINTS.some(hint => lowerLines[idx].includes(hint))),
  ).slice(0, 3)

  const skillsLine = skills.length > 0 ? `SKILLS: ${skills.join(', ')}` : 'SKILLS: n/a'

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
