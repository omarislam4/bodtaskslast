# API Migration Guide

## API Documentation

All endpoint contracts live in `pages_endpoint/` at the repo root. Each file is named after the feature or page it covers (e.g. `AuthEndpoints.md`, `Settings.md`, `Tasks.md`). The central index is `pages_endpoint/api-doc.md`.

**Only read the file for the feature you are currently working on.** Do not read the full folder upfront.

---

## Overview

We are migrating from Firebase (Firestore realtime + Firebase Auth) to a custom REST API.
**All realtime communication (`onSnapshot`, `onAuthStateChanged`) is dropped.** Data is fetched
on demand and kept fresh through TanStack Query's caching and invalidation.

---

## The 4-Layer Pattern

Every feature must follow exactly this structure:

```
src/types/<domain>.ts          ← shared TypeScript types, no logic
src/services/<feature>.ts      ← raw API calls, no React
src/hooks/use<Feature>.ts      ← TanStack Query hooks + key factory
src/pages or components        ← just renders, only calls hooks
```

For features that need global state (e.g. auth), a context sits on top of the hook layer:

```
src/hooks/useAuthQueries.ts    ← queries, mutations, key factory
src/contexts/AuthContext.tsx   ← thin wrapper: wires hooks, owns navigation side-effects
```

---

### Layer 0 — Types (`src/types/<domain>.ts`)

- Only type and interface definitions — zero runtime code
- Shared across all layers (services, hooks, components can all import from here)
- One file per domain: `auth.ts`, `task.ts`, `space.ts`, etc.
- Re-exported through `src/types/index.ts` so consumers use `@/types`
- Payload types (request bodies) and response types both live here

```ts
// src/types/task.ts
export type TaskStatus = "todo" | "in-progress" | "done" | "blocked";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  spaceId: string;
  assigneeIds: string[];
  deadline?: string;
  createdAt: string;
}

export interface CreateTaskPayload {
  title: string;
  spaceId: string;
  priority?: TaskPriority;
  deadline?: string;
  assigneeIds?: string[];
}
```

```ts
// src/types/index.ts  — barrel export, always extend this as you add files
export * from "./auth";
export * from "./task";
export * from "./space";
// ...
```

**Rule:** if a type is used in more than one layer (or even in two files), it goes in `src/types/`. Types that are purely internal to a single file can stay local but should be moved once they're shared.

---

### Layer 1 — Service (`src/services/<feature>.ts`)

- Only raw `api.get / post / patch / delete` calls
- Imports types from `@/types`, never from hooks or contexts
- Returns plain promises (`.then(r => r.data)`)
- No React, no state, no side effects
- Export a single object grouping all calls for that resource
- **Do not include `/api` in paths** — the axios instance in `services/api.ts` appends it automatically via `baseURL`

```ts
// src/services/tasks.ts
import api from "./api";
import type { Task, CreateTaskPayload } from "@/types";

export const tasksService = {
  list: (spaceId: string): Promise<Task[]> =>
    api.get<Task[]>(`/spaces/${spaceId}/tasks`).then((r) => r.data),

  get: (taskId: string): Promise<Task> =>
    api.get<Task>(`/tasks/${taskId}`).then((r) => r.data),

  create: (payload: CreateTaskPayload): Promise<Task> =>
    api.post<Task>("/tasks", payload).then((r) => r.data),

  update: (taskId: string, payload: Partial<Task>): Promise<Task> =>
    api.patch<Task>(`/tasks/${taskId}`, payload).then((r) => r.data),

  remove: (taskId: string): Promise<void> =>
    api.delete(`/tasks/${taskId}`).then(() => undefined),
};
```

---

### Layer 2 — Hook (`src/hooks/use<Feature>.ts`)

- Wraps the service with `useQuery` (reads) and `useMutation` (writes)
- Imports types from `@/types`, imports the service from `@/services/<feature>`
- **Exports a key factory object** so other hooks can cross-invalidate without hardcoding strings
- **Does not contain `onSuccess` navigation or token side-effects** — those belong in the context or component that calls `mutateAsync`
- Handles loading and error state so components don't have to
- Never imports from Firebase

#### Query Key Factory

Every hook file exports a `<resource>Keys` object. All `queryKey` values inside the file use it — no raw string arrays anywhere.

```ts
// src/hooks/useTasks.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tasksService } from "@/services/tasks";
import type { Task, CreateTaskPayload } from "@/types";

// Exported so other hooks can cross-invalidate
export const taskKeys = {
  bySpace: (spaceId: string) => ["tasks", spaceId] as const,
  detail: (taskId: string) => ["task", taskId] as const,
};

export const useTasks = (spaceId: string) =>
  useQuery({
    queryKey: taskKeys.bySpace(spaceId),
    queryFn: () => tasksService.list(spaceId),
    enabled: !!spaceId,
  });

export const useTask = (taskId: string) =>
  useQuery({
    queryKey: taskKeys.detail(taskId),
    queryFn: () => tasksService.get(taskId),
    enabled: !!taskId,
  });

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTaskPayload) => tasksService.create(payload),
    onSuccess: (newTask) => {
      queryClient.invalidateQueries({
        queryKey: taskKeys.bySpace(newTask.spaceId),
      });
    },
  });
};

export const useUpdateTask = (taskId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Task>) =>
      tasksService.update(taskId, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(taskKeys.detail(taskId), updated);
      queryClient.invalidateQueries({
        queryKey: taskKeys.bySpace(updated.spaceId),
      });
    },
  });
};
```

#### Cross-Hook Invalidation

When a mutation in one hook needs to invalidate a query owned by another hook, import that hook's key factory:

```ts
// src/hooks/useSprints.ts — a sprint update should also refresh the task list
import { taskKeys } from "@/hooks/useTasks";

export const useUpdateSprint = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => sprintsService.update(payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({
        queryKey: sprintKeys.bySpace(updated.spaceId),
      });
      // cross-invalidate: sprint changes affect task grouping
      queryClient.invalidateQueries({
        queryKey: taskKeys.bySpace(updated.spaceId),
      });
    },
  });
};
```

---

### Layer 3 — Component

- Calls hooks, never calls services or `api` directly
- Imports types from `@/types` when needed (e.g. for prop types)
- No Firebase imports

```tsx
// src/pages/SpaceDetail.tsx
import { useTasks, useCreateTask } from "@/hooks/useTasks";
import type { Task } from "@/types";

export default function SpaceDetail() {
  const { spaceId } = useParams();
  const { data: tasks = [], isLoading } = useTasks(spaceId);
  const createTask = useCreateTask();

  const handleCreate = () => createTask.mutate({ title: "New task", spaceId });

  if (isLoading) return <Spinner />;
  return <TaskList tasks={tasks} onAdd={handleCreate} />;
}
```

---

## Import Direction Rules

```
@/types        ← imported by everyone (services, hooks, components)
@/services     ← imported only by hooks (and AuthContext)
@/hooks        ← imported only by components and pages
@/contexts     ← imported by components and pages for global state
```

Never import a hook into a service. Never import a service into a component directly.

---

## Rules Summary

| Rule                                                                                                                   | Why                                                                                                                                                                                                                                                                                                                                                                                      |
| ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| All `toast.error()` and `setError()` calls must use `t.err*` keys from `LangContext` — never hardcoded English strings | Supports Arabic UI; error keys live in the `// Errors` section of `LangContext.tsx`                                                                                                                                                                                                                                                                                                      |
| ------                                                                                                                 | -----                                                                                                                                                                                                                                                                                                                                                                                    |
| No `onSnapshot` / `onAuthStateChanged`                                                                                 | Realtime is dropped — all reads are one-shot fetches                                                                                                                                                                                                                                                                                                                                     |
| No direct Firebase Auth calls in pages                                                                                 | Auth is handled exclusively by `AuthContext`                                                                                                                                                                                                                                                                                                                                             |
| No `api.get()` calls in components                                                                                     | Always go through a hook                                                                                                                                                                                                                                                                                                                                                                 |
| Types live in `src/types/`, not in hooks or services                                                                   | Shared across all layers without circular imports                                                                                                                                                                                                                                                                                                                                        |
| Services are pure functions                                                                                            | Easy to test, no hidden React dependencies                                                                                                                                                                                                                                                                                                                                               |
| Hooks own invalidation                                                                                                 | Mutations and their side effects stay in one place                                                                                                                                                                                                                                                                                                                                       |
| Query keys follow `[resource, id?, filters?]`                                                                          | Predictable cache keys across the app                                                                                                                                                                                                                                                                                                                                                    |
| Use `isPending` / `isLoading` from the query or mutation — never a parallel `useState(false)`                          | Single source of truth for loading state; manual state can get out of sync when errors are thrown                                                                                                                                                                                                                                                                                        |
| Use `mutate()` not `mutateAsync()` in components                                                                       | Toasts and cache invalidation belong in the hook's `onSuccess`/`onError` (hook calls `useLang()`). Component-specific UI effects (close modal, reset form, fire-and-forget side effects like n8n) go in the per-call callback: `mutate(payload, { onSuccess: () => { ... } })`. Using `mutateAsync` with try/catch scatters error handling and duplicates toast logic across components. |

---

## Query Key Convention

Never write raw string arrays in `queryKey` — always use the exported key factory from the owning hook file.

| Hook file             | Key factory                                    | Example key                           |
| --------------------- | ---------------------------------------------- | ------------------------------------- |
| `AuthContext.tsx`     | `authKeys.me()`                                | `["auth", "me"]`                      |
| `useUsers.ts`         | `userKeys.all()` / `userKeys.detail(id)`       | `["users"]` / `["user", id]`          |
| `useSpaces.ts`        | `spaceKeys.all()` / `spaceKeys.detail(id)`     | `["spaces"]` / `["space", id]`        |
| `useTasks.ts`         | `taskKeys.bySpace(id)` / `taskKeys.detail(id)` | `["tasks", spaceId]` / `["task", id]` |
| `useMembers.ts`       | `memberKeys.all()`                             | `["members"]`                         |
| `useNotifications.ts` | `notificationKeys.all()`                       | `["notifications"]`                   |
| `useChatQueries.ts`   | `chatKeys.messages(id)`                        | `["chat", "messages", channelId]`     |
| `useGoalQueries.ts`   | `goalKeys.bySpace(id)`                         | `["goals", spaceId]`                  |
| `useSprintQueries.ts` | `sprintKeys.bySpace(id)`                       | `["sprints", spaceId]`                |

---

## staleTime Guidelines

| Data type                      | staleTime                   |
| ------------------------------ | --------------------------- |
| Auth session (`/me`)           | 5 min                       |
| Mostly static (spaces, users)  | 2 min                       |
| Frequently updated (tasks)     | 30 sec                      |
| Real-time-like (notifications) | 0 (always refetch on focus) |

---

## Migration Progress

| Feature                    | Types                 | Service                   | Hook                    | Components                       | Done |
| -------------------------- | --------------------- | ------------------------- | ----------------------- | -------------------------------- | ---- |
| Auth (login, register, me) | `types/auth.ts`       | `services/auth.ts`        | `AuthContext`           | Login, Signup, Sidebar, Settings | ✅   |
| Profile (update me)        | `types/user.ts`       | `services/users.ts`       | `useUserQueries.ts`     | Settings                         | ✅   |
| App Settings (webhook)     | `types/settings.ts`   | `services/settings.ts`    | `useSettingsQueries.ts` | Settings                         | ✅   |
| Users / Members            | ⬜                    | ⬜                        | ⬜                      | ⬜                               | ⬜   |
| Spaces                     | `types/space.ts`      | `services/spaces.ts`      | `useSpaces.ts`          | Spaces.tsx, Sidebar              | ✅   |
| Tasks (full)               | `types/task.ts`       | `services/tasks.ts`       | `useTaskQueries.ts`     | Spaces.tsx, TaskDetail.tsx       | ✅   |
| Notifications / Inbox      | ⬜                    | ⬜                        | ⬜                      | ⬜                               | ⬜   |
| Chat                       | `types/chat.ts`       | `services/chat.ts`        | `useChatQueries.ts`     | SpaceChatTab, ChatPanel          | ✅   |
| Goals                      | `types/goal.ts`       | `services/goals.ts`       | `useGoalQueries.ts`     | SpaceGoalsTab                    | ✅   |
| Sprints                    | `types/sprint.ts`     | `services/sprints.ts`     | `useSprintQueries.ts`   | SpaceSprintsTab                  | ✅   |
| Forms                      | ⬜                    | ⬜                        | ⬜                      | ⬜                               | ⬜   |
| Attendance / Weekly Report | `types/attendance.ts` | `services/attendance.ts`  | `useAttendance.ts`      | Attendance.tsx, WeeklyReport.tsx | ✅   |
| Automations                | `types/automation.ts` | `services/automations.ts` | `useAutomations.ts`     | Automations.tsx                  | ✅   |
