# PrivatePrep — Frontend

React SPA for **PrivatePrep** (live: [betweenatna.de](https://www.betweenatna.de)), an AI-powered career workspace: applications, CV editor, career profile, and coaching chats.

Backend: [github.com/djzh23/SmartAIAssist](https://github.com/djzh23/SmartAIAssist)  
API host: `https://smartassist-api.onrender.com`

Product name in the UI is **PrivatePrep**. The git org/repos still use SmartAssist / BetweenAtna.

---

## What the app does

### Job applications
Pipeline with six active stages plus three archive states: Draft → Applied → Phone Screen → Interview → Assessment → Offer, then Accepted / Rejected / Withdrawn. Overview shows a Sankey of the flow.

### CV.Studio
In-browser resumes: categories, templates, live editor, named snapshot versions, PDF/DOCX export with quota, link a CV to an application (`/cv-studio`, `/cv-studio/edit/:resumeId`, `/cv-studio/basis/:applicationId`).

### AI chat
Modes (Clerk session → `POST /api/agent/stream`): Career Coach, Job Analysis, Interview Prep, Language Learning, Programming. Sessions and transcripts live on the **API** (`/api/sessions`), not only in localStorage. Notes use `/api/chat-notes`. Streams continue in `ChatSessionsProvider` while you navigate away from `/chat`.

### Career profile & onboarding
Signed-in users complete onboarding (`/onboarding`) then edit skills, experience, languages, CV upload/parse, target jobs (`/career-profile`). Protected app routes wait on profile load to decide onboarding.

### Other surfaces
- Overview cockpit (`/overview`)
- Account (`/profile`), pricing/Stripe (`/pricing`)
- Guides (`/guides`), notes (`/notes`)
- Admin dashboard (`/admin`, Clerk allow-list on the API)

### Subscriptions
Stripe Checkout / Customer Portal via the backend. Daily message limits come from `GET /api/agent/usage`.

---

## How the browser talks to the API

| Environment | `VITE_API_BASE_URL` | Where `/api/*` goes |
|---|---|---|
| Local `npm run dev` | leave **empty** | Vite proxy → `VITE_PROXY_TARGET` (default local API) |
| Production build (current live bundle) | `https://smartassist-api.onrender.com` | **Direct** to Render (CORS) |
| `vercel.json` | n/a | Also rewrites `/api/(.*)` → Render (used only if the bundle calls same-origin `/api`) |

If the API is down or Supabase is paused, the **static site still loads** and Clerk login still works. Authenticated pages then spin until `fetch` fails — there is **no client timeout**.

To hit a local API, `VITE_PROXY_TARGET` must match `SmartAssistApi` `launchSettings.json` (**`http://localhost:5108`**). Remote Render from Vite requires `VITE_USE_REMOTE_API=1` (otherwise a production proxy target is ignored so unreleased routes are not 404s).

---

## Tech stack

| Area | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite 5 |
| Styling | Tailwind CSS v3 |
| Icons | Lucide React |
| Routing | React Router v6 |
| Auth | Clerk (`@clerk/clerk-react`) |
| Payments | Stripe via backend |
| Markdown | react-markdown + DOMPurify |
| Charts | Recharts |
| PDF parse (client) | pdfjs-dist |
| Fonts | Google Fonts: **Lato**, **Space Grotesk**, **Lora** |
| Tests | Vitest + Testing Library |
| Deployment | Vercel (GitHub Actions on `main`) |

---

## Routes

| Path | Auth |
|---|---|
| `/` | Public landing |
| `/onboarding` | Signed in |
| `/chat`, `/overview`, `/profile`, `/career-profile`, `/pricing` | Signed in + layout |
| `/applications`, `/applications/new`, `/applications/:id` | Signed in |
| `/cv-studio/*` | Signed in |
| `/guides`, `/guides/:slug`, `/notes` | Signed in |
| `/admin` | Signed in (API enforces admin) |

---

## Project structure

```
src/
├── api/
│   ├── client.ts           Agent, sessions, notes, applications, CV.Studio, learning
│   ├── profileClient.ts    /api/profile*
│   └── adminClient.ts      /api/admin*
├── components/
│   ├── chat/               Sidebar, messages, job-analysis / learning / interview cards
│   ├── layout/             MainLayout, Sidebar, BottomTabBar, nav
│   ├── overview/           Sankey + pipeline panel
│   ├── applications/       Board, table, archive
│   ├── onboarding/         Wizard + coach tour
│   └── ui/                 Buttons, usage modal, auth
├── context/
│   └── ChatSessionsProvider.tsx   Session state + background streams (API-backed)
├── cv-studio/              Overview, editor, application-basis, templates
├── hooks/
│   ├── useCareerProfile    GET /api/profile
│   ├── useChatSessions     re-export of ChatSessionsProvider
│   ├── useChatNotes        /api/chat-notes (+ one-time localStorage migrate)
│   ├── useCvResumeCategories
│   └── useUserPlan         usage + Stripe plan
├── pages/                  Landing, Chat, Overview, Applications, CareerProfile,
│                           Onboarding, Pricing, Notes, Guides, Admin, Profile
├── services/               StripeService, AuthService
└── types/                  Shared TS types
```

---

## Local development

**Requirements:** Node.js 20+

```bash
git clone https://github.com/djzh23/SmartAssist-react.git
cd SmartAssist-react
cp .env.example .env.local
npm install
npm run dev
```

Dev server: **`http://localhost:5174`**.

`.env.local`:

```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_API_BASE_URL=
VITE_PROXY_TARGET=http://localhost:5108
```

Run [SmartAIAssist](https://github.com/djzh23/SmartAIAssist) on port **5108**, or change `VITE_PROXY_TARGET`.

Optional:

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Empty in dev (proxy). Production: API origin, no trailing slash |
| `VITE_API_URL` | Alias used only by `StripeService` (falls back to `VITE_API_BASE_URL`) |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key (**`pk_live_` in production**) |
| `VITE_PROXY_TARGET` | Vite `/api` proxy target |
| `VITE_USE_REMOTE_API=1` | Allow proxying to Render/Vercel from `npm run dev` |
| `VITE_REMAINING_FREE_SLOTS` | Landing-page remaining-slots copy |

```bash
npm run lint
npm test
npm run build
```

---

## Deployment

```
push to main → CI (tsc + vitest + vite build) → vercel pull / build / deploy --prod
```

Secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`. Set **`VITE_API_BASE_URL`** and **`VITE_CLERK_PUBLISHABLE_KEY`** in the Vercel project (baked in at build time).

`vercel.json` SPA fallback + `/api` rewrite to Render. The current production JS also calls Render **directly**, so CORS on the API must allow `https://www.betweenatna.de`.

---

## License

MIT
