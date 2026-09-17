# PrivatePrep Frontend

React-Oberfläche für PrivatePrep: Onboarding, Profil, CV-Upload und die
Match-Analyse gegen eine Stellenausschreibung.

Live: [betweenatna.com](https://betweenatna.com)

[![CI](https://github.com/djzh23/SmartAssist-react/actions/workflows/ci.yml/badge.svg)](https://github.com/djzh23/SmartAssist-react/actions/workflows/ci.yml)

## Status

Version 1, September 2026. Aktive Routen sind Landing (`/`), Onboarding
(`/onboarding`), die Match-Analyse (`/analyze`), Profil (`/profile`,
`/career-profile`), Preise (`/pricing`) sowie Impressum und Datenschutz.
Ältere Routen aus dem Full-Scope-Prototyp (`/chat`, `/overview`,
`/applications/*`, `/guides/*`, `/notes`, `/cv-studio/*`, `/admin`) leiten in
`src/App.tsx` auf `/analyze` beziehungsweise `/career-profile` um; die
zugehörigen Seiten-Komponenten liegen noch im Code, werden aber nicht
verlinkt.

## About

PrivatePrep Frontend ruft das Backend-Repo
[PrivatePrep](https://github.com/djzh23/PrivatePrep) an. Nutzer durchlaufen
ein Onboarding, pflegen ein Kurzprofil und laden einen Lebenslauf hoch. Die
Analyze-Seite nimmt eine Stellenausschreibung entgegen und zeigt den vom
Backend erzeugten Match-Report (Score, Skill-Gap, Bullet-Rewrite-Vorschläge)
an. Stripe Checkout und Customer Portal steuern Free- und Premium-Zugriff.

## Tech Stack

| Bereich | Technologie |
|---|---|
| Framework | React 18, TypeScript, Vite 5 |
| Styling | Tailwind CSS 3 |
| Auth | Clerk |
| Routing | React Router 6 |
| PDF-Parsing | pdfjs-dist |
| Tests | Vitest, Testing Library |
| Deployment | Vercel (CI-gesteuert über die Vercel CLI) |

## Lokale Entwicklung

Voraussetzung: Node.js 20 oder höher.

```bash
git clone https://github.com/djzh23/SmartAssist-react.git
cd SmartAssist-react
cp .env.example .env.local
npm install
npm run dev
```

`.env.local`:

```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_API_BASE_URL=
VITE_PROXY_TARGET=http://localhost:5108
```

`VITE_API_BASE_URL` bleibt in der Entwicklung leer: Vite leitet `/api/*` an
`VITE_PROXY_TARGET` weiter, standardmäßig das lokale Backend unter
`http://localhost:5108`. Für Production-Builds wird die Variable auf die
Backend-Origin gesetzt.

```bash
npm run lint
npm test
npm run build
```

## Tests

```bash
npm test
```

5 Testdateien unter `src/`, ausgeführt mit Vitest und Testing Library.

## CI und Deployment

```
push auf main -> Type-Check (tsc) + Vitest + Vite-Build -> Vercel-Deploy (Production)
```

Der Deploy-Job läuft nur bei einem Push auf `main` und nutzt die Vercel CLI
direkt (`vercel build` und `vercel deploy --prebuilt`), nicht die
Git-Integration von Vercel. Benötigte Secrets in GitHub Actions:
`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.

## Verwandte Repos

- Backend: [PrivatePrep](https://github.com/djzh23/PrivatePrep)
