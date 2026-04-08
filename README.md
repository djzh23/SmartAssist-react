# SmartAssist Frontend

React Frontend für die SmartAssist KI Plattform.
Live unter: **[betweenatna.de](https://www.betweenatna.de)**
Backend Repo: [github.com/djzh23/SmartAIAssist](https://github.com/djzh23/SmartAIAssist)

---

## Was ist SmartAssist?

SmartAssist ist ein KI Assistent mit mehreren spezialisierten Chat Werkzeugen.
Der Nutzer wählt ein Werkzeug, schreibt eine Nachricht und erhält eine strukturierte, kontextbewusste Antwort vom KI Modell (Anthropic Claude).

---

## Werkzeuge

| Werkzeug | Beschreibung |
|---|---|
| Allgemeiner Chat | Freie KI Konversation |
| Sprachen lernen | KI antwortet strukturiert in Zielsprache mit Übersetzung und Lerntipp, Audio per Browser TTS |
| Stellenanalyse | Stellenbeschreibung einfügen und Schlüsselanforderungen, passende Keywords und CV Tipps erhalten |
| Vorstellungsgespräch | Interview Vorbereitung mit realistischen Fragen basierend auf Stelle und Lebenslauf |
| Programmierung | Code Hilfe, Debugging und Best Practices mit Syntax Highlighting |
| Wetter | Aktuelles Wetter für jede Stadt weltweit |

---

## Tech Stack

| Bereich | Technologie |
|---|---|
| Framework | React 18 + TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS v3 |
| Icons | Lucide React |
| Routing | React Router v6 |
| Authentifizierung | Clerk |
| Schriften | Google Fonts (Inter + Lora) |

---

## Projektstruktur

```
src/
├── api/
│   └── client.ts            Alle API Aufrufe zum Backend (SSE Streaming, Speech)
├── components/
│   ├── chat/                ChatSidebar, MessageList, MessageBubble, ChatInput,
│   │                        LearningResponse, JobAnalysisCard, CodeBlock, ...
│   ├── layout/              MainLayout, Sidebar
│   └── ui/                  UsageLimitModal, AuthButton
├── hooks/
│   ├── useChatSessions.ts   Session State (localStorage)
│   └── useUserPlan.ts       Nutzerlimit und Plan Verwaltung
├── pages/
│   ├── LandingPage.tsx      Startseite mit Live Demo
│   ├── ChatPage.tsx         Haupt Chat Seite
│   ├── ProfilePage.tsx      Profil und Verbrauchsanzeige
│   └── PricingPage.tsx      Preisübersicht
├── types/
│   └── index.ts             Gemeinsame Typen und Konstanten
└── utils/
    ├── parseLearningResponse.ts   Sprachlern Antwort Parser
    ├── markdownRenderer.ts        Markdown zu HTML
    └── jobMarkdown.ts             Stellenanalyse Formatierung
```

---

## Lokal starten

**Voraussetzungen:** Node.js 18+

```bash
git clone https://github.com/djzh23/SmartAssist-react.git
cd SmartAssist-react
npm install
npm run dev
```

Öffnet unter `http://localhost:5174`.

Der Vite Dev Server leitet `/api/*` automatisch an das gehostete Backend weiter.
Keine weitere Konfiguration nötig.

---

## Deployment

Das Projekt läuft auf **Vercel**. Die `vercel.json` leitet alle `/api/*` Anfragen an das Backend auf Render weiter.

```bash
vercel --prod --yes
```

---

## Umgebungsvariablen

| Variable | Beschreibung |
|---|---|
| `VITE_API_BASE_URL` | Backend URL (leer lassen für Proxy im Dev Modus) |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk Authentifizierung Key |

---

## Lizenz

MIT
