# Design System — SmartAssist React

## Typography

| Use case         | Class                                    |
|------------------|------------------------------------------|
| Page title       | `text-2xl font-bold text-slate-800`      |
| Section heading  | `text-xs font-bold uppercase tracking-wider text-slate-400` |
| Body text        | `text-sm text-slate-700 leading-relaxed` |
| Muted / caption  | `text-xs text-slate-400`                 |
| Language boxes   | `font-serif` (Lora)                      |

## Colors (Tailwind config)

| Name             | Hex       | Usage                         |
|------------------|-----------|-------------------------------|
| primary          | #7C3AED   | buttons, active border, links |
| primary-hover    | #6D28D9   | hover state                   |
| primary-light    | #EDE9FE   | active session bg, badges     |
| sidebar          | #1e293b   | dark sidebar bg               |
| sidebar-muted    | #94a3b8   | inactive nav text             |
| sidebar-text     | #cbd5e1   | hover nav text                |

## Spacing

Use Tailwind's default scale. Common patterns:
- Page padding: `px-6 py-10`
- Card padding: `p-4` or `p-5`
- Section gap: `gap-4` or `mb-8`
- Input padding: `px-4 py-3`

## Buttons

```tsx
// Primary
<button className="bg-primary hover:bg-primary-hover text-white rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors">

// Ghost
<button className="border border-slate-200 hover:border-slate-300 text-slate-500 rounded-xl px-5 py-2.5 text-sm font-medium transition-colors">

// Icon only
<button className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
```

## Cards

```tsx
// Tool card
<div className="p-5 rounded-2xl border border-slate-200 bg-white hover:shadow-card hover:-translate-y-0.5 transition-all">

// Info card  
<div className="p-4 rounded-xl border border-slate-100 bg-white hover:shadow-chat transition-shadow">
```

## Chat bubbles

- User: `bg-primary text-white rounded-[18px_18px_4px_18px]`
- Assistant: `bg-slate-100 text-slate-800 rounded-[18px_18px_18px_4px]`

## Job Analysis Cards

Each section gets an inline style with `background`, `borderLeft`, and text `color`.
See `src/utils/jobMarkdown.ts` for the color map.

## Modals

```tsx
// Backdrop
<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
// Box
<div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-slide-up">
```

## Icons

Always use `lucide-react`. Size `size={15}` for nav, `size={16-18}` for buttons, `size={20-24}` for illustrations.
