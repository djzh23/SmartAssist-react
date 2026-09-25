# PrivatePrep Frontend

> Status: geschlossene Beta. Live-URL nicht öffentlich verlinkt. Für Zugang:
> zn.connec.team@gmail.com

React-Oberfläche für PrivatePrep: Onboarding, Profil, CV-Upload und die
Match-Analyse gegen eine Stellenausschreibung.

[![CI](https://github.com/djzh23/SmartAssist-react/actions/workflows/ci.yml/badge.svg)](https://github.com/djzh23/SmartAssist-react/actions/workflows/ci.yml)

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

## Live-Zugang

Aktuell nur für eingeladene Beta-Tester über [betweenatna.com](https://betweenatna.com).
Anfragen für Beta-Zugang: zn.connec.team@gmail.com

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

## Deploy-Prozess

Vor jedem Deploy wird die Release-Checkliste im Backend-Repo durchgegangen.
Siehe [PrivatePrep docs/deployment/RELEASE-CHECKLIST.md](https://github.com/djzh23/PrivatePrep/blob/main/docs/deployment/RELEASE-CHECKLIST.md)
und [docs/BRANCHES.md](https://github.com/djzh23/PrivatePrep/blob/main/docs/BRANCHES.md).

Live kommt von Branch `main` (Vercel).

## Verwandte Repos

- Backend: [PrivatePrep](https://github.com/djzh23/PrivatePrep)
