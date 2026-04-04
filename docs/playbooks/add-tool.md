# Playbook: Add a New Tool

## 1. Add to ToolType union (`src/types/index.ts`)
```ts
export type ToolType = 'general' | 'weather' | 'jobanalyzer' | 'jokes' | 'language' | 'your_tool'
```

## 2. Add welcome message (`src/hooks/useChatSessions.ts` — `welcomeFor`)
```ts
case 'your_tool':
  return '🔧 Your tool is ready! ...'
```

## 3. Add placeholder (`src/components/chat/ChatInput.tsx` — `PLACEHOLDERS`)
```ts
your_tool: 'Type something specific…'
```

## 4. Add tool badge (`src/components/chat/ChatSidebar.tsx` — `TOOL_BADGE`)
```ts
your_tool: '🔧'
```

## 5. Add to sidebar nav (`src/components/layout/Sidebar.tsx` — `chatLinks`)
```ts
{ label: 'Your Tool', icon: <YourIcon size={15} />, to: '/chat?tool=your_tool' }
```

## 6. Add tool card (`src/pages/ToolsPage.tsx` — `TOOLS`)
```ts
{
  id: 'your_tool', name: 'Your Tool', chatParam: 'your_tool',
  shortDescription: '...',
  fullDescription: '...',
  examples: ['...'],
  icon: '🔧', iconBg: '#...',
}
```

## 7. (Optional) Add special response rendering
If the tool returns structured data, add a branch in `MessageBubble.tsx`.

## 8. Backend
The backend (SmartAssistApi) needs a new `Tool.FromFunc` registered in `AgentService.cs`
and a corresponding tool class in `Services/Tools/`.
Follow `SmartAssistApi/docs/playbooks/add-new-tool.md`.
