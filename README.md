# PrivatePrep Frontend

React-Oberfläche für PrivatePrep: Onboarding, Profil, CV-Upload und die
Match-Analyse gegen eine Stellenausschreibung.

[![CI](https://github.com/djzh23/privateprep-frontend/actions/workflows/ci.yml/badge.svg)](https://github.com/djzh23/privateprep-frontend/actions/workflows/ci.yml)

> Status: die App ist deployed und technisch erreichbar, aber noch nicht
> beworben oder öffentlich angekündigt. Stripe läuft im Testmodus, es werden
> keine echten Zahlungen verarbeitet. Das ist ein Pre-Launch-Stand, den der
> Autor selbst wie ein normaler Nutzer testet, kein fertig gelauntes
> öffentliches Produkt.

## Über das Projekt

Nutzer durchlaufen ein Onboarding, pflegen ein Kurzprofil und laden einen
Lebenslauf hoch. Die Analyze-Seite nimmt eine Stellenausschreibung entgegen
und zeigt den vom Backend erzeugten Match-Report (Score, Skill-Gap,
Formulierungsvorschläge) an. Stripe Checkout und Customer Portal steuern
Free- und Premium-Zugriff.

## Screenshots

Noch keine Screenshots hinterlegt.

## Tech Stack

| Bereich | Technologie |
|---|---|
| Framework | React, TypeScript, Vite |
| Styling | Tailwind CSS |
| Auth | Clerk |
| Routing | React Router |
| Tests | Vitest, Testing Library |
| Deployment | Vercel |

## Repository-Struktur

```
src/
  pages/        Seiten-Komponenten (Onboarding, Profil, Inbox, Analyze, Reports, ...)
  components/   Wiederverwendbare UI-Komponenten, gruppiert nach Bereich
  api/          Fetch-Clients für die Backend-Endpunkte
  hooks/        Geteilte React-Hooks (z. B. Nutzer-Plan, Inbox-Count)
  services/     Client-seitige Dienste (z. B. Stripe)
  context/      React-Context-Provider
  config/       Statische Konfiguration
  content/      Statische Texte/Inhalte
  test/         Test-Setup für Vitest
```

## Lokale Entwicklung

Voraussetzung: Node.js 20 oder höher.

```bash
git clone https://github.com/djzh23/privateprep-frontend.git
cd privateprep-frontend
npm install
npm run dev
```

Konfiguration erfolgt über eine lokale `.env.local` (siehe `.env.example`).

```bash
npm run lint
npm test
npm run build
```

## Tests

```bash
npm test
```

## Features

- Onboarding-Flow, Kurzprofil, CV-Upload
- Job-Inbox: Stellenausschreibungen manuell einfügen oder über die
  [Browser-Erweiterung](https://github.com/djzh23/privateprep-extension)
  sammeln
- Match-Analyse gegen eine Stellenausschreibung mit Score, Skill-Gap und
  Formulierungsvorschlägen
- Stripe Checkout und Customer Portal für Free- und Premium-Zugriff

## Architektur-Notizen

Das Frontend ist ein reiner Client gegen die PrivatePrep-API; sämtliche
Analyse-Logik (Scoring, Skill-Gap, Fakten-Prüfung) läuft im Backend. Die
Analyze-Seite und die Job-Reports rendern strukturierte Report-JSON-Daten,
die das Backend liefert, ohne eigene Geschäftslogik nachzubilden.

## Deploy-Prozess

Vor jedem Deploy wird die Release-Checkliste im Backend-Repo durchgegangen.
Siehe [PrivatePrep docs/deployment/RELEASE-CHECKLIST.md](https://github.com/djzh23/PrivatePrep/blob/main/docs/deployment/RELEASE-CHECKLIST.md)
und [docs/BRANCHES.md](https://github.com/djzh23/PrivatePrep/blob/main/docs/BRANCHES.md).

Live kommt von Branch `main`. Der eigentliche Deploy läuft über GitHub
Actions (`.github/workflows/ci.yml`), das per Vercel-CLI deployt, nicht über
Vercels Git-Integration direkt.

## Verwandte Repos

- Backend: [PrivatePrep](https://github.com/djzh23/PrivatePrep)
- Browser-Erweiterung: [privateprep-extension](https://github.com/djzh23/privateprep-extension)

## License

Proprietäre Software. Alle Rechte vorbehalten.

## Kontakt

zn.connec.team@gmail.com
