# PrivatePrep

[![CI](https://github.com/djzh23/SmartAssist-react/actions/workflows/ci.yml/badge.svg)](https://github.com/djzh23/SmartAssist-react/actions/workflows/ci.yml)

React frontend for [PrivatePrep](https://www.betweenatna.de), an AI-powered career workspace.

**Backend:** [github.com/djzh23/SmartAIAssist](https://github.com/djzh23/SmartAIAssist)  
**API host:** `https://smartassist-api.onrender.com`

## Features

- **AI chat** with five modes (career coach, job analysis, interview prep, language learning, programming). Responses stream over SSE with a deliberate reveal animation; sessions and transcripts are persisted server-side.
- **CV Studio** — in-browser resume editor with templates, category management, snapshot versioning, and PDF/DOCX export with quota tracking.
- **Job applications** — pipeline board with six stages, archive, cover letter and interview notes per application.
- **Career profile** — guided onboarding wizard, skills, work experience, CV upload and AI parsing, target job tracking.
- **Subscriptions** — Stripe Checkout and Customer Portal; daily message quotas enforced and returned from the backend.

## Tech Stack

| Area | Technology |
|---|---|
| Framework | React 18, TypeScript, Vite 5 |
| Styling | Tailwind CSS v3 |
| Auth | Clerk |
| Routing | React Router v6 |
| Charts | Recharts |
| Markdown | react-markdown + DOMPurify |
| PDF parsing | pdfjs-dist |
| Tests | Vitest + Testing Library |
| Deployment | Vercel |

## Project Structure

```
src/
  api/
    agentClient.ts          Streaming, ask, usage, demo endpoints
    cvStudioClient.ts       CV Studio API
    applicationsClient.ts   Job application CRUD
    profileClient.ts        /api/profile endpoints
    client.ts               Sessions, notes, learning; re-exports all above
  components/
    chat/                   Message list, tool cards, context modal, thinking indicator
    cv-studio/              Resume editor, version panel, templates
    applications/           Pipeline board, detail view, status timeline
    ui/                     Buttons, modals, usage indicator
  hooks/
    useChatStreaming.ts      Streaming state machine (abort, deliberate reveal, stop)
    useChatSessions.ts      Session store backed by the API
    useCareerProfile.ts     Profile data and feature toggles
    useUserPlan.ts          Usage limits and Stripe plan
  utils/
    chatContextStorage.ts   Session context types and localStorage helpers
    chatPromptBuilders.ts   Interview and job-analyzer prompt assembly
  pages/                    Chat, Overview, Applications, CareerProfile, CvStudio, ...
```

## Local Development

Requires Node.js 20+.

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

Leave `VITE_API_BASE_URL` empty in development; Vite proxies `/api/*` to `VITE_PROXY_TARGET` (the local backend). Set it to the production API origin for staging or production builds.

```bash
npm run lint
npm test
npm run build
```

## Deployment

```
push to main -> CI (type-check + vitest + vite build) -> Vercel
```

Secrets required in Vercel: `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_API_BASE_URL`.

## License

MIT
