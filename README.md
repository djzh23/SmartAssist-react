# BetweenAtna — Frontend

React frontend for **BetweenAtna**, an AI-powered career platform that helps professionals manage their job search end-to-end.

Live: **[betweenatna.de](https://www.betweenatna.de)**
Backend: [github.com/djzh23/SmartAIAssist](https://github.com/djzh23/SmartAIAssist)

---

## What is BetweenAtna?

BetweenAtna is a career workspace that combines structured job application tracking with AI coaching and a built-in CV editor. Users manage the full journey from finding a role to signing an offer — all in one place.

---

## Core Features

### Job Applications
Track every application through a visual pipeline with 9 stages: Draft → Applied → Phone Screen → Interview → Assessment → Offer → Accepted / Rejected / Withdrawn. A Sankey flow diagram shows the distribution of your applications at a glance.

### CV.Studio
Create, organize, and export professional CVs directly in the browser:
- Category-based organization (e.g. "SAP Roles", "Startups", "Remote")
- Multiple CV variants per category
- PDF export with quota tracking
- Snapshot versioning — save named versions before major edits
- Link a CV directly to a job application

### AI Chat & Coaching
Specialized AI modes powered by Anthropic Claude:

| Mode | What it does |
|---|---|
| Career Coach | General career advice and job search strategy |
| Job Analysis | Paste a job description — get key requirements, relevant keywords, and CV tips |
| Interview Prep | Realistic interview questions tailored to your CV and the target role |
| Language Learning | Structured answers in the target language with translation and a learning tip |
| Programming | Code help, debugging, and best practices with syntax highlighting |

### Profile & Dashboard
- Overview cockpit with active pipeline count and archive stats
- Career profile with skills, languages, and experience level
- Application activity feed

### Subscriptions
Stripe-powered plans with daily message limits. Free tier included.

---

## Tech Stack

| Area | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite |
| Styling | Tailwind CSS v3 |
| Icons | Lucide React |
| Routing | React Router v6 |
| Auth | Clerk |
| Payments | Stripe (via backend) |
| Fonts | Google Fonts (Inter + Lora) |
| Deployment | Vercel (auto-deploy on push to `main`) |

---

## Project Structure

```
src/
├── api/
│   └── client.ts              Typed fetch wrapper for all backend calls
├── components/
│   ├── chat/                  ChatSidebar, MessageList, MessageBubble,
│   │                          LearningResponse, JobAnalysisCard, CodeBlock
│   ├── layout/                MainLayout, Sidebar, BottomTabBar, PageHeader
│   ├── overview/              ApplicationFlowSankey, ApplicationCard
│   └── ui/                    Modal, UsageLimitModal, InfoExplainerButton
├── cv-studio/
│   ├── CvStudioOverviewPage   Category chips + workspace + export panel
│   ├── CvStudioEditorPage     Live CV editor with template switching
│   └── components/            CategoryCard, ResumeCard, ExportList, dialogs
├── hooks/
│   ├── useCvResumeCategories  Category CRUD with optimistic updates
│   ├── useChatSessions        Chat session state (localStorage)
│   └── useMediaQuery          Responsive breakpoint detection
├── pages/
│   ├── OverviewPage           Cockpit: pipeline stats + Sankey + quick actions
│   ├── ApplicationsPage       Full pipeline board with status management
│   ├── CareerProfilePage      Skills, languages, experience
│   └── PricingPage            Plan overview with Stripe checkout
├── types/
│   └── index.ts               All shared TypeScript types
└── utils/
    ├── applicationOverview    Pipeline aggregation logic
    └── jobMarkdown            Job analysis card formatting
```

---

## Local Development

**Requirements:** Node.js 20+

```bash
git clone https://github.com/djzh23/SmartAssist-react.git
cd SmartAssist-react
npm install
npm run dev
```

Opens at `http://localhost:5174`. Vite proxies `/api/*` to the hosted backend — no local backend needed for basic UI work.

Copy `.env.example` to `.env.local` and set your Clerk key:

```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

---

## Deployment

Push to `main` — Vercel auto-deploys via GitHub Actions:

```
push to main → CI (lint + build) → deploy to Vercel
```

Manual deploy if needed:

```bash
npx vercel --prod
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Backend URL (leave empty in dev — uses Vite proxy) |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |

---

## License

MIT
