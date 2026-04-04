# CLAUDE.md — SmartAssist React Frontend

React frontend for SmartAssist AI chat application.
Connects to the SmartAssistApi ASP.NET Core backend at `C:\Dev\projects\_active\SmartAssistApi`.

## Stack

- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS v3** — utility-first styling
- **Lucide React** — icons
- **React Router v6** — routing
- **Google Fonts** — Inter (UI) + Lora (language learning boxes)

## Project Structure

```
src/
├── api/          client.ts — typed fetch wrapper for the backend
├── components/
│   ├── layout/   MainLayout, Sidebar
│   ├── chat/     ChatSidebar, MessageList, MessageBubble, JobAnalysisCard,
│   │             LearningResponse, ChatInput
│   └── ui/       ToolCard, Modal (reusable)
├── hooks/        useChatSessions — localStorage-persisted session state
├── pages/        HomePage, ChatPage, ToolsPage
├── types/        index.ts — all shared types
└── utils/        jobMarkdown.ts — markdown→HTML for job analysis cards
docs/
├── agents/       ui-agent.md
├── skills/       design-system.md
└── playbooks/    add-page.md, add-tool.md
```

## Backend API

Base URL: configured in `.env` as `VITE_API_BASE_URL` (default `http://localhost:5194`).
In dev, Vite proxies `/api/*` → backend (see `vite.config.ts`).

| Method | Endpoint          | Body / Notes                        |
|--------|-------------------|-------------------------------------|
| POST   | /api/agent/ask    | `AgentRequest` → `AgentResponse`    |
| POST   | /api/speech/tts   | `{Text, LanguageCode}` → audio/mpeg |
| GET    | /api/agent/health | health check                        |

### AgentRequest
```ts
{
  message: string           // max 4000 chars
  sessionId?: string
  languageLearningMode?: boolean
  targetLanguage?: string
  nativeLanguage?: string
  targetLanguageCode?: string
  nativeLanguageCode?: string
  level?: string
  learningGoal?: string
}
```

### AgentResponse
```ts
{
  reply: string
  toolUsed?: string         // "get_weather" | "analyze_job" | "jokes" etc.
  learningData?: {
    targetLanguageText: string
    nativeLanguageText: string
    learnTip?: string
  }
}
```

## Non-Negotiable Rules

- ALWAYS write TypeScript — no `any` without a comment
- ALWAYS use Tailwind — no inline styles, no CSS modules unless unavoidable
- NEVER put business logic in page components — use hooks or utils
- NEVER hardcode the backend URL — use `import.meta.env.VITE_API_BASE_URL`
- Session state lives in `useChatSessions` hook only
- All API calls live in `src/api/client.ts` only
- Use Lucide React for all icons

## Design Tokens (Tailwind config)

| Token          | Value       | Usage                      |
|----------------|-------------|----------------------------|
| primary        | #7C3AED     | buttons, active states     |
| primary-light  | #EDE9FE     | active backgrounds         |
| sidebar-bg     | #1e293b     | dark sidebar               |
| muted          | #64748b     | secondary text             |

## Commit Convention

```
feat: add X
fix: resolve Y
refactor: restructure Z
chore: deps / config
```

## How to Add a New Tool

Read: `docs/playbooks/add-tool.md`

## How to Add a New Page

Read: `docs/playbooks/add-page.md`
