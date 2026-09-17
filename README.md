# PrivatePrep Frontend

React-Oberfläche für PrivatePrep: Onboarding, Profil, CV-Upload und die
Match-Analyse gegen eine Stellenausschreibung.

Live: [betweenatna.com](https://betweenatna.com)

[![CI](https://github.com/djzh23/SmartAssist-react/actions/workflows/ci.yml/badge.svg)](https://github.com/djzh23/SmartAssist-react/actions/workflows/ci.yml)

PrivatePrep befindet sich in aktiver Entwicklung. Einzelne Funktionen können
zeitweise eingeschränkt sein, während neue Verbesserungen eingebaut werden.

## Über das Projekt

Nutzer durchlaufen ein Onboarding, pflegen ein Kurzprofil und laden einen
Lebenslauf hoch. Die Analyze-Seite nimmt eine Stellenausschreibung entgegen
und zeigt den vom Backend erzeugten Match-Report (Score, Skill-Gap,
Formulierungsvorschläge) an. Stripe Checkout und Customer Portal steuern
Free- und Premium-Zugriff.

## Tech Stack

| Bereich | Technologie |
|---|---|
| Framework | React, TypeScript, Vite |
| Styling | Tailwind CSS |
| Auth | Clerk |
| Routing | React Router |
| Tests | Vitest, Testing Library |
| Deployment | Vercel |

## Lokale Entwicklung

Voraussetzung: Node.js 20 oder höher.

```bash
git clone https://github.com/djzh23/SmartAssist-react.git
cd SmartAssist-react
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

## Verwandte Repos

- Backend: [PrivatePrep](https://github.com/djzh23/PrivatePrep)
