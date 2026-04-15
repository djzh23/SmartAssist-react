export type GuideCategory = 'grundlagen' | 'bewerbung' | 'chat' | 'interview'

export interface GuideStepBlock {
  title: string
  items: string[]
}

export interface GuideExample {
  label: string
  body: string
}

export interface GuideSection {
  heading: string
  paragraphs: string[]
}

export interface GuideArticle {
  slug: string
  title: string
  subtitle?: string
  category: GuideCategory
  readingMinutes?: number
  intro: string
  highlights?: string[]
  sections: GuideSection[]
  steps?: GuideStepBlock[]
  examples?: GuideExample[]
}

export const GUIDE_CATEGORY_ORDER: GuideCategory[] = ['grundlagen', 'bewerbung', 'chat', 'interview']

export const GUIDE_CATEGORY_META: Record<
  GuideCategory,
  { label: string; description: string; accentClass: string; chipClass: string }
> = {
  grundlagen: {
    label: 'Grundlagen',
    description: 'Profil, Kontext und sinnvolle Abläufe',
    accentClass: 'border-l-4 border-primary',
    chipClass: 'bg-primary-light text-primary',
  },
  bewerbung: {
    label: 'Bewerbung',
    description: 'Organisation, Texte, PDF und ATS',
    accentClass: 'border-l-4 border-teal-500',
    chipClass: 'bg-teal-50 text-teal-800',
  },
  chat: {
    label: 'Coaching & Chat',
    description: 'Tools, Prompts und Stellenanalyse',
    accentClass: 'border-l-4 border-amber-500',
    chipClass: 'bg-amber-50 text-amber-900',
  },
  interview: {
    label: 'Interview',
    description: 'Vorbereitung und Übung',
    accentClass: 'border-l-4 border-sky-500',
    chipClass: 'bg-sky-50 text-sky-900',
  },
}

export const GUIDE_ARTICLES: GuideArticle[] = [
  {
    slug: 'app-effizienz',
    title: 'PrivatePrep effizient nutzen',
    subtitle: 'Ein Profil, klare Bewerbungen, fokussierte Chats',
    category: 'grundlagen',
    readingMinutes: 5,
    intro:
      'Mit Karriereprofil und Bewerbungen arbeitest du fokussiert: ein Profil liefert Kontext für alle Chats, Bewerbungen bündeln alles pro Stelle.',
    highlights: [
      'Profil einmal pflegen — in allen Chats nutzbar',
      'Pro Stelle eine Bewerbung — weniger Chaos',
      'Tool aus der Bewerbung starten — Kontext bleibt zusammen',
    ],
    steps: [
      {
        title: 'Schritt 1 — Karriereprofil',
        items: [
          'Feld, Level, Ziele, Skills, Erfahrung und optional CV-Text ausfüllen.',
          'Zielstellen anlegen, wenn du dich auf konkrete Rollen bewirbst.',
        ],
      },
      {
        title: 'Schritt 2 — Bewerbung anlegen',
        items: [
          'Stellentext und Status speichern; später Anschreiben-Entwurf und Interview-Notizen.',
          'Von hier aus „Analyse“ oder „Interview“ starten, damit die Session verknüpft ist.',
        ],
      },
      {
        title: 'Schritt 3 — Chat wählen',
        items: [
          'Sidebar: passendes Tool (Stellenanalyse, Interview, Sprache, Code, Karriere-Chat).',
          'Getrennte Sessions für Analyse vs. Interview vermeiden lange, unübersichtliche Threads.',
        ],
      },
    ],
    sections: [
      {
        heading: 'Redundanz vermeiden',
        paragraphs: [
          'Wenn der Kontext-Dialog erscheint, Stellen- und CV-Daten einmalig ausfüllen; die Session arbeitet danach mit denselben Daten weiter.',
        ],
      },
    ],
    examples: [
      {
        label: 'Mini-Check vor dem ersten Chat',
        body: 'Habe ich Feld + 3 Skills + mindestens eine Erfahrung? Fehlt etwas, zuerst Karriereprofil speichern.',
      },
    ],
  },
  {
    slug: 'kontext-karriereprofil',
    title: 'Kontext-Schalter und Karriereprofil',
    subtitle: 'Was landet im System-Prompt — und wo du es steuerst',
    category: 'grundlagen',
    readingMinutes: 4,
    intro:
      'Über dem Eingabefeld im Chat siehst du, welche Profilteile aktiv in die KI einfließen. Dauerhafte Daten pflegst du im Karriereprofil.',
    highlights: [
      'Farbig = aktiv: diese Blöcke nutzt der Server im System-Prompt',
      'Pro Chat umschalten — ohne Karriereprofil neu einzutippen',
      'Zielstelle wählen, wenn du dich auf eine konkrete Anzeige beziehst',
    ],
    steps: [
      {
        title: 'So passt du den Kontext an',
        items: [
          'Im Chat: Leiste „Kontext einblenden“ öffnen, gewünschte Segmente (Profil, Skills, Erfahrung, Lebenslauf) an- oder abwählen.',
          'Für Zielstellen: genau eine Zielstelle aktivieren, wenn die Antworten sich auf eine Anzeige beziehen sollen.',
          'Im Karriereprofil: Inhalte bearbeiten; die Schalter im Chat entscheiden nur, was gesendet wird.',
        ],
      },
    ],
    sections: [
      {
        heading: 'Stellenanalyse und Interview',
        paragraphs: [
          'Zusätzlich zum Profil-Kontext kann Text aus dem Setup-Modal (Stelle, Lebenslauf-Auszug) in der Nachricht stecken — das siehst du am Kontext-Badge bzw. Setup.',
          'Nach Profil-Änderungen ggf. Seite neu laden, damit der Stand stimmt.',
        ],
      },
    ],
    examples: [
      {
        label: 'Typischer Fehler',
        body: 'Skills aus, aber „Warum fehlen React-Keywords?“ fragen — dann weiß die KI deinen Stack nicht. Entweder Skills aktivieren oder im Satz kurz nennen.',
      },
    ],
  },
  {
    slug: 'bewerbungen-organisieren',
    title: 'Bewerbungen organisieren',
    subtitle: 'Pipeline von Entwurf bis Archiv',
    category: 'bewerbung',
    readingMinutes: 4,
    intro: 'Die Bewerbungs-Pipeline hilft dir, den Überblick über Entwurf, Versand und Nachfassen zu behalten.',
    highlights: [
      'Status-Spalten spiegeln den realen Bewerbungsverlauf',
      'Chat aus der Bewerbung starten — weniger Copy-Paste',
    ],
    steps: [
      {
        title: 'Spalten durchklicken',
        items: [
          'Entwurf: Rohideen und erste Fassungen.',
          'Beworben: abgeschickt, warten auf Rückmeldung.',
          'Erstgespräch / Interview / Angebot: sobald der Arbeitgeber reagiert.',
          'Archiv: Absagen oder angenommene Stellen aus dem aktiven Blick entfernen.',
        ],
      },
    ],
    sections: [
      {
        heading: 'Verknüpfung mit dem Chat',
        paragraphs: [
          'Von der Bewerbung aus „Analyse starten“ oder „Interview-Training“ legt eine Session mit Stellenkontext an und verknüpft sie mit der Bewerbung.',
        ],
      },
    ],
  },
  {
    slug: 'bewerbung-schreiben',
    title: 'Sich richtig bewerben',
    subtitle: 'Anschreiben und Lebenslauf mit Wirkung',
    category: 'bewerbung',
    readingMinutes: 6,
    intro: 'Kurz und überzeugend: Anschreiben und Unterlagen sollten zur Stelle passen, nicht generisch wirken.',
    highlights: [
      'Motivation zur konkreten Firma, nicht zur „Branche im Allgemeinen“',
      '2–3 harte Belege statt Soft-Skill-Floskeln ohne Substanz',
    ],
    steps: [
      {
        title: 'Anschreiben in drei Blöcken',
        items: [
          'Einleitung: Rolle + warum genau diese Firma/Rolle.',
          'Kern: zwei bis drei Anforderungen aus der Anzeige mit deinen messbaren Ergebnissen verknüpfen.',
          'Schluss: klare nächste Schritte, höflicher Abschluss — oft eine Seite.',
        ],
      },
      {
        title: 'Lebenslauf',
        items: [
          'Umgekehrt chronologisch, messbare Ergebnisse, Skills zur Stelle sortiert.',
          'Begriffe aus der Anzeige natürlich verwenden — ohne zur Lüge zu werden.',
        ],
      },
    ],
    sections: [],
    examples: [
      {
        label: 'Beispiel-Satz für den Kern',
        body: 'In meiner Rolle als … habe ich [Metrik] um X % verbessert, indem ich [Technik/Prozess] eingeführt habe — vergleichbar mit Ihrer Anforderung „…“.',
      },
    ],
  },
  {
    slug: 'anschreiben-pdf-ats',
    title: 'Anschreiben, PDF und ATS',
    subtitle: 'Lesbarkeit schlägt Spielerei',
    category: 'bewerbung',
    readingMinutes: 5,
    intro: 'Viele Arbeitgeber parsen PDFs automatisch — Lesbarkeit und Struktur zählen mehr als Design-Spielereien.',
    highlights: [
      'Auswählbarer Text, klare Überschriften, eingebettete Schriftarten',
      'Keine exotischen Mehrspalt-Layouts für Parser',
    ],
    sections: [
      {
        heading: 'PDF',
        paragraphs: [
          'Dateiname: Name_Rolle_Firma.pdf. Export über das Karriereprofil, wenn verfügbar.',
        ],
      },
      {
        heading: 'ATS-freundlich',
        paragraphs: [
          '„ATS-frei“ im Sinne von garantiertem Parser-Erfolg gibt es nicht — konsistente Struktur und echte Passung zur Stelle sind der beste Hebel.',
        ],
      },
    ],
    steps: [
      {
        title: 'Kurz-Checkliste PDF',
        items: [
          'Schriftarten eingebettet, Text markierbar?',
          'Überschriften als echte Überschriften (nicht nur fett)?',
          'Skills lieber als Liste statt als Grafik-Tabelle?',
        ],
      },
    ],
  },
  {
    slug: 'prompting',
    title: 'Richtig prompten in PrivatePrep',
    subtitle: 'Rolle, Aufgabe, Format, Grenzen',
    category: 'chat',
    readingMinutes: 5,
    intro: 'Je klarer Kontext und Ziel, desto weniger Halluzinationen und Wiederholungen.',
    highlights: [
      'Format vorgeben (Bulletpoints, max. Wörter, Sprache)',
      'Tool passend wählen — der System-Kontext ist anders als im Freitext',
    ],
    sections: [
      {
        heading: 'Toolwahl',
        paragraphs: [
          'Karriere-Chat: offene Fragen und Texte verbessern.',
          'Code-Assistent: Sprache wählen, Fehlermeldung und erwartetes Verhalten angeben.',
        ],
      },
    ],
    steps: [
      {
        title: 'Grundformel',
        items: [
          'Rolle: „Du bist …“',
          'Aufgabe: „Analysiere / Formuliere / Vergleiche …“',
          'Format: „5 Bulletpoints, max. 120 Wörter, Deutsch.“',
          'Constraints: „Nur aus dem gelieferten Stellentext zitieren.“',
        ],
      },
    ],
    examples: [
      {
        label: 'Beispiel-Prompt',
        body: 'Du bist Karrierecoach. Aus dem Stellentext: nenne die drei härtesten Anforderungen und je eine Interviewfrage dazu. Antwort auf Deutsch, Markdown-Liste.',
      },
    ],
  },
  {
    slug: 'stellenanalyse-chat',
    title: 'Stellenanalyse im Chat',
    subtitle: 'Vom Stellentext zur strukturierten Auswertung',
    category: 'chat',
    readingMinutes: 6,
    intro:
      'Im Tool „Stellenanalyse“ bekommst du strukturierte Abschnitte (Match, Lücken, Keywords …). Am besten arbeitest du mit echtem Stellentext und klarer nächster Frage.',
    highlights: [
      'Stellentext im Setup oder aus der Bewerbung — einmal sauber, dann Folgefragen',
      'Tabellen (z. B. Keywords) im Chat als echte Tabelle lesbar',
      'Lücken ehrlich benennen lassen — dann gezielt nachbessern',
    ],
    steps: [
      {
        title: 'Ablauf in fünf Schritten',
        items: [
          'Sidebar: Stellenanalyse öffnen oder von der Bewerbung „Analyse starten“.',
          'Setup-Modal: Stellentitel, Firma, Stellentext; optional CV-Auszug ergänzen.',
          'Erste Nachricht: z. B. „Gib einen ersten Match-Score und die drei größten Lücken.“',
          'Antwort lesen; bei Keyword-Tabelle gezielt nach „wie im CV ausformulieren?“ fragen.',
          'Learnings im Karriereprofil oder in der Bewerbung festhalten.',
        ],
      },
    ],
    sections: [
      {
        heading: 'Folgefragen stellen',
        paragraphs: [
          'Kurze, konkrete Nachfragen liefern bessere Antworten als „noch mehr“ ohne Fokus.',
          'Wenn du nur einen Ausschnitt der Stelle hast, sag das dazu — sonst rät das Modell.',
        ],
      },
    ],
    examples: [
      {
        label: 'Beispiel erste Nachricht',
        body: 'Hier ist der Stellentext (siehe Setup). Schätze Match 0–100, dann eine Tabelle: Keyword | in meinem CV? | konkrete Empfehlung.',
      },
    ],
  },
  {
    slug: 'interview-vorbereitung',
    title: 'Interview vorbereiten',
    subtitle: 'STAR, Stories, Technik',
    category: 'interview',
    readingMinutes: 6,
    intro: 'Struktur schlägt Auswendiglernen: STAR für Verhaltensfragen, technische Tiefe für Fachrollen.',
    highlights: [
      '5–8 Stories mit Situation, Aufgabe, Aktion, Ergebnis',
      'Unternehmen und Stack recherchieren vor dem Gespräch',
    ],
    steps: [
      {
        title: 'Vor dem Termin',
        items: [
          'Unternehmen, Produkt, Tech-Stack recherchieren.',
          'Stories ausarbeiten; im Interview-Tool mit echten Anforderungen üben.',
        ],
      },
      {
        title: 'Am Tag',
        items: [
          'Kurze Notizen erlaubt, keine Roman-Skripte.',
          'Nach dem Gespräch Status in der Bewerbung setzen und Learnings notieren.',
        ],
      },
    ],
    sections: [],
  },
  {
    slug: 'interview-chat-anleitung',
    title: 'Interview-Training im Chat',
    subtitle: 'Setup, Fragen, Feedback-Schleifen',
    category: 'interview',
    readingMinutes: 5,
    intro:
      'Im Interview-Tool übst du mit Stellen- und Lebenslauf-Kontext. So holst du das meiste aus dem Chat heraus.',
    highlights: [
      'Setup mit Stellentext = realistische Fragen',
      'CV aktiv = Bezug auf deine echten Stationen',
      'Kurze Turns: eine Frage, deine Antwort, dann Feedback',
    ],
    steps: [
      {
        title: 'Schritt-für-Schritt',
        items: [
          'Interview-Chat in der Sidebar öffnen; Setup mit Rolle, Sprache, Stelle, CV füllen.',
          'Erste Bitte: „Stelle mir drei typische Fragen für diese Rolle, nacheinander.“',
          'Pro Frage: kurz antworten (2–4 Sätze), dann Feedback und verbesserte Formulierung holen.',
          'Abschluss: „Welche roten Flaggen könnte meine Antwort ausgelöst haben?“',
        ],
      },
    ],
    sections: [
      {
        heading: 'Sprache',
        paragraphs: [
          'Du kannst die Interview-Sprache im Setup wählen — halte Antworten in derselben Sprache, damit Feedback konsistent bleibt.',
        ],
      },
    ],
    examples: [
      {
        label: 'Beispiel nach deiner Antwort',
        body: 'Bewerte STAR-Struktur und Klarheit 1–10. Gib eine kürzere Alternative mit gleichem Inhalt.',
      },
    ],
  },
]

export function guideBySlug(slug: string): GuideArticle | undefined {
  return GUIDE_ARTICLES.find(g => g.slug === slug)
}
