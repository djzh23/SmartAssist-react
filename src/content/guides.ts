export interface GuideArticle {
  slug: string
  title: string
  intro: string
  sections: { heading: string; paragraphs: string[] }[]
}

export const GUIDE_ARTICLES: GuideArticle[] = [
  {
    slug: 'app-effizienz',
    title: 'PrivatePrep effizient nutzen',
    intro:
      'Mit Karriereprofil und Bewerbungen arbeitest du fokussiert: ein Profil liefert Kontext für alle Chats, Bewerbungen bündeln alles pro Stelle.',
    sections: [
      {
        heading: 'Ablauf in drei Schritten',
        paragraphs: [
          'Vervollständige zuerst dein Karriereprofil (Feld, Level, Ziele, Skills, Erfahrung, optional CV-Text). So weiß die KI, wer du bist.',
          'Lege für jede echte Stelle eine Bewerbung an. Dort speicherst du Stellentext, Status, Anschreiben-Entwurf und Interview-Notizen.',
          'Öffne den passenden Chat (Stellenanalyse, Interview, Karriere-Chat, Code) direkt aus der Bewerbung oder über die Sidebar — so bleibt der Kontext an einer Stelle gebündelt.',
        ],
      },
      {
        heading: 'Redundanz vermeiden',
        paragraphs: [
          'Nutze pro Stelle idealerweise getrennte Sessions für Analyse vs. Interview, statt alles in einen langen Thread zu mischen.',
          'Wenn du den Kontext-Dialog siehst, fülle Stellen- und CV-Daten einmalig aus; danach arbeitet die Session mit denselben Daten weiter.',
        ],
      },
    ],
  },
  {
    slug: 'bewerbungen-organisieren',
    title: 'Bewerbungen organisieren',
    intro: 'Die Bewerbungs-Pipeline hilft dir, den Überblick über Entwurf, Versand und Nachfassen zu behalten.',
    sections: [
      {
        heading: 'Spalten sinnvoll nutzen',
        paragraphs: [
          'Entwurf: Ideen und Rohfassungen. Beworben: abgeschickt, Warten auf Rückmeldung.',
          'Weitere Stufen (Erstgespräch, Interview, Angebot) ziehen, sobald der Arbeitgeber reagiert. Archiv für Absagen und angenommene Stellen.',
        ],
      },
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
    intro: 'Kurz und überzeugend: Anschreiben und Unterlagen sollten zur Stelle passen, nicht generisch wirken.',
    sections: [
      {
        heading: 'Anschreiben',
        paragraphs: [
          'Einleitung: Rolle + Motivation zur konkreten Firma. Hauptteil: 2–3 Belege, die Anforderungen mit deinen Erfahrungen verbinden.',
          'Schluss: klare nächste Schritte und Sign-off. Länge oft eine Seite; lieber präzise als ausufernd.',
        ],
      },
      {
        heading: 'Lebenslauf',
        paragraphs: [
          'Umkehr-chronologisch, messbare Ergebnisse, Skills zur Stelle sortiert. Gleiche Begriffe wie in der Anzeige helfen — ohne zu lügen.',
        ],
      },
    ],
  },
  {
    slug: 'prompting',
    title: 'Richtig prompten in PrivatePrep',
    intro: 'Je klarer Kontext und Ziel, desto weniger Halluzinationen und Wiederholungen.',
    sections: [
      {
        heading: 'Grundformel',
        paragraphs: [
          'Rolle + Aufgabe + Format + Constraints. Beispiel: „Du bist Coach für X. Analysiere die Anforderung Y. Gib 5 Bulletpoints, max. 120 Wörter, Deutsch.“',
        ],
      },
      {
        heading: 'Toolwahl',
        paragraphs: [
          'Stellenanalyse: Stellentext einfügen, dann gezielt nach Lücken fragen. Interview: Rolle + deine stärksten Belege nennen.',
          'Karriere-Chat: offene Fragen und Texte verbessern. Code-Assistent: Sprache wählen, Fehlermeldung und erwartetes Verhalten angeben.',
        ],
      },
    ],
  },
  {
    slug: 'interview-vorbereitung',
    title: 'Interview vorbereiten',
    intro: 'Struktur schlägt Auswendiglernen: STAR für Verhaltensfragen, technische Tiefe für Fachrollen.',
    sections: [
      {
        heading: 'Vor dem Termin',
        paragraphs: [
          'Unternehmen, Produkt, Tech-Stack recherchieren. 5–8 Stories aus deiner Erfahrung mit Situation, Aufgabe, Aktion, Ergebnis vorbereiten.',
          'Im Interview-Tool kannst du mit den echten Anforderungen üben und Feedback einholen.',
        ],
      },
      {
        heading: 'Am Tag',
        paragraphs: [
          'Kurze Notizen erlaubt, keine Roman-Skripte. Nach dem Gespräch Status in der Bewerbung aktualisieren und Learnings festhalten.',
        ],
      },
    ],
  },
  {
    slug: 'anschreiben-pdf-ats',
    title: 'Anschreiben, PDF und ATS',
    intro: 'Viele Arbeitgeber parsen PDFs automatisch — Lesbarkeit und Struktur zählen mehr als Design-Spielereien.',
    sections: [
      {
        heading: 'PDF',
        paragraphs: [
          'Eingebettete Schriftarten, auswählbarer Text, klare Überschriften. Keine mehrspaltigen Layouts, die Parser verwirren.',
          'Dateiname: Name_Rolle_Firma.pdf. Export über das Karriereprofil, wenn verfügbar.',
        ],
      },
      {
        heading: 'ATS-freundlich',
        paragraphs: [
          'Standard-Schriften, ausreichend Weißraum, Listen statt Tabellen für Skills. Keywords aus der Anzeige natürlich einstreuen.',
          '„ATS-frei“ im Sinne von garantiertem Parser-Erfolg gibt es nicht — konsistente Struktur und echte Passung zur Stelle sind der beste Hebel.',
        ],
      },
    ],
  },
]

export function guideBySlug(slug: string): GuideArticle | undefined {
  return GUIDE_ARTICLES.find(g => g.slug === slug)
}
