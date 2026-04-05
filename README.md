# SmartAssist — AI Chat Frontend

A React + TypeScript frontend for an AI-powered assistant with multiple specialized chat modes. Built as a portfolio project, it connects to a hosted ASP.NET Core backend and offers context-aware conversations across five distinct tools.

## Features

### Chat Modes
- **General** — open-ended AI conversation
- **Language Learning** — AI responds in your target language with native-language support notes; configurable source/target language pairs
- **Programming & DSA** — syntax-highlighted code responses, language selector (C#, Java, HTML/CSS, React/TSX, Design Patterns, Architecture)
- **Interview Coach** — structured career coaching with colored response cards (requirements, questions, prep tips, STAR pitch); bilingual (German / English)
- **Job Analyzer** — paste a job URL or description to get a structured role breakdown

### CV Integration (Interview mode)
- Upload a PDF resume — text extracted entirely in the browser via PDF.js (no data sent to a server at this stage)
- AI summarizes the CV to a compact SKILLS / EXPERIENCE / PROJECTS / EDUCATION profile
- Stored in `localStorage`; included in interview prompts for personalized advice
- Alias field lets you use a pseudonym instead of your real name

### UI
- Persistent chat sessions with per-tool history (localStorage)
- Responsive sidebar with mobile overlay
- Markdown rendering: bold, italic, inline code, headings, bullet/numbered lists, blockquotes, fenced code blocks
- Copy button on all code blocks

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 18 + TypeScript |
| Build | Vite |
| Styling | Tailwind CSS v3 |
| Icons | Lucide React |
| Routing | React Router v6 |
| Code highlighting | react-syntax-highlighter (Prism / vscDarkPlus) |
| PDF parsing | pdfjs-dist (browser-side, no server) |
| Fonts | Google Fonts — Inter + Lora |

## Project Structure

```
src/
├── api/           client.ts — typed fetch wrapper (all API calls live here)
├── components/
│   ├── chat/      ChatSidebar, MessageList, MessageBubble, ChatInput,
│   │              ProgrammingResponse, InterviewResponse, CodeBlock,
│   │              LearningResponse, JobAnalysisCard
│   ├── layout/    MainLayout, Sidebar
│   └── ui/        ToolCard, Modal
├── hooks/         useChatSessions — localStorage-persisted session state
├── pages/         HomePage, ChatPage, ToolsPage
├── types/         index.ts — all shared types and constants
└── utils/
    ├── markdownRenderer.ts  — shared parseBlocks / parseSegments utilities
    ├── pdfParser.ts         — browser-side PDF text extraction
    └── jobMarkdown.ts       — markdown → HTML for job analysis cards
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm or pnpm

### Installation

```bash
git clone https://github.com/djzh23/SmartAssist-react.git
cd SmartAssist-react
npm install
```

### Configuration

Copy the example env file and adjust if needed:

```bash
cp .env.example .env.local
```

By default, the Vite dev server proxies `/api/*` to the hosted backend at `https://smartassist-api.onrender.com`. No changes are required to run locally against the public backend.

### Development

```bash
npm run dev
```

Opens at `http://localhost:5174`.

### Production Build

```bash
npm run build
npm run preview
```

## Deployment (Vercel)

The included `vercel.json` rewrites all `/api/*` requests to the backend on Render, avoiding CORS issues without needing a proxy server:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://smartassist-api.onrender.com/api/:path*"
    }
  ]
}
```

Deploy steps:
1. Push to GitHub
2. Import the repo in [vercel.com](https://vercel.com)
3. No environment variables needed — the rewrite handles routing

## Backend

The API is a separate ASP.NET Core project: [SmartAssistApi](https://github.com/djzh23/SmartAssistApi).  
Hosted at: `https://smartassist-api.onrender.com`

## License

MIT
