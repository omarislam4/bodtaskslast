# Birth Of Dream (BOD) — Workspace Management App

React + Vite SPA for team task and space management, built on Firebase.

## Run & Operate

- **Dev**: `pnpm --filter @workspace/bod-app run dev`
- **Build**: `pnpm --filter @workspace/bod-app run build` (runs `tsc && vite build`)
- **Typecheck**: `cd artifacts/bod-app && npx tsc --noEmit`
- **Deploy**: Netlify — `netlify.toml` sets `command = "npm run build"` + SPA redirect
- **Admin login**: admin.bod@gmail.com / admin@123

## Stack

- React 19 + Vite 7 + TypeScript 5.9
- Tailwind CSS v4 (`@tailwindcss/vite` plugin)
- Firebase Auth + Firestore (no Replit DB)
- Framer Motion, Wouter routing, Sonner toasts, date-fns, Recharts

## Where things live

- `artifacts/bod-app/src/` — main app source
- `artifacts/bod-app/src/contexts/LangContext.tsx` — ALL EN/AR translations (single source of truth)
- `artifacts/bod-app/src/contexts/AuthContext.tsx` — Firebase auth + isAdmin logic
- `artifacts/bod-app/src/pages/` — route pages (Login, Signup, Dashboard, Spaces, SpaceDetail, TaskDetail, Members, Senders, History, Timeline, Settings)
- `artifacts/bod-app/src/hooks/` — Firebase hooks (useTasks, useSpaces, useMembers, useSenders, useSpaceData, useAllTasks)
- `artifacts/bod-app/src/assets/` — local logo assets (bod-logo.png, bod-logo2.png)
- `artifacts/bod-app/netlify.toml` — Netlify build config + SPA redirect
- `artifacts/bod-app/vite.config.ts` — `@assets` alias → `src/assets/` (Netlify-safe)

## Architecture decisions

- **@assets alias** → `src/assets/` (not `../../attached_assets`) so Netlify build works
- **Admin gate**: `isAdmin` = email matches admin list OR Firestore `role === "admin"`; admins see all spaces, members only see spaces where their UID is in `space.memberIds`
- **RTL support**: `document.dir` set on lang change; Topbar notification panel uses `isRTL ? "left-0" : "right-0"` to prevent overflow; inputs use `ps-`/`pe-` logical padding
- **Tasks sort**: client-side sort after Firestore `where` query (avoids composite index requirement)
- **i18n**: All text via `useLang()` → `t.key`; supports Arabic/English with full RTL layout

## Product

- **Dashboard**: Stats, status pie chart, upcoming deadlines, spaces summary, recent tasks table
- **Spaces**: Create/manage workspaces with color; admin sees all, members see assigned only
- **Space tabs**: Overview (stats + team), Tasks (grid + filters + create), Timeline (deadline sort), Members (add/remove + role toggle), Data (folders + links tree)
- **Task Detail**: Inline edit title/description, progress slider, assignees, deadline, activity log/comments, **Delete Task** (all members), **Send Reminder** (admin only via n8n webhook)
- **Delete Space**: Admin-only button in SpaceDetail header
- **Role management**: Admin can promote/demote members to admin in Members page
- **Members page**: Admin-only; space access toggles per member, role toggle (admin↔member)
- **Senders**: Admin-only; CRUD for task senders/sources
- **History**: Completed tasks with search + priority filter
- **Global search**: Cmd+K modal; searches tasks + spaces
- **i18n**: Arabic/English toggle in sidebar; full RTL layout

## User preferences

- Dark theme by default
- Arabic first language (app supports full AR/EN switch)

## Gotchas

- Package name must be `@workspace/bod-app` (not `bod-app`) for pnpm workspace filter to work
- Netlify needs `netlify.toml` with SPA `[[redirects]]` rule for client-side routing
- Send Reminder fetches webhook URL from Firestore `settings/global.webhookUrl` with fallback to n8n default
- `useTasks` uses `where` only (no `orderBy`) to avoid composite Firestore index requirement

## Pointers

- Skills: `react-vite`, `artifacts`, `workflows`
- n8n webhook: `https://n8n.bodhosting.com/webhook/manual-send-notification`
