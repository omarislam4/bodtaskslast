# Select Component Migration Guide

## Rule

Never use a native `<select>` element. Always use the Radix-based `Select` from `@/components/ui/select`.

---

## Import

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
```

---

## Basic Pattern

```tsx
// BEFORE — native select
<select
  value={value}
  onChange={(e) => setValue(e.target.value)}
  className="w-full px-3 py-2 text-sm bg-background border border-input rounded-xl"
>
  <option value="a">Option A</option>
  <option value="b">Option B</option>
</select>

// AFTER — UI Select
<Select value={value} onValueChange={setValue}>
  <SelectTrigger className="w-full text-sm">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="a">Option A</SelectItem>
    <SelectItem value="b">Option B</SelectItem>
  </SelectContent>
</Select>
```

**Key differences:**
| Native | UI Select |
|--------|-----------|
| `onChange={(e) => fn(e.target.value)}` | `onValueChange={fn}` — receives the value directly |
| `className` on `<select>` | `className` on `<SelectTrigger>` |
| `<option value="">Placeholder</option>` | `<SelectValue placeholder="..." />` |
| `required` attribute | JS validation (Radix does not support native `required`) |

---

## Size Variants

```tsx
// Default (h-9, text-sm)
<SelectTrigger className="w-full text-sm">

// Small — for inline/compact use (filter pills, table cells)
<SelectTrigger className="h-7 text-xs w-28">

// Full width with fixed width
<SelectTrigger className="w-40 text-sm">
```

---

## Placeholder (empty default)

When no initial value is selected:

```tsx
<Select value={value} onValueChange={setValue}>
  <SelectTrigger className="w-full text-sm">
    <SelectValue placeholder="Select a space..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="">None</SelectItem>
    {items.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
  </SelectContent>
</Select>
```

---

## Fire-and-Reset Pattern (one-shot action select)

Used when the select fires an action but should always display its placeholder (e.g. "Add to sprint"):

```tsx
<Select
  value=""
  onValueChange={(sprintId) => {
    const sprint = sprints.find(s => s.id === sprintId);
    if (sprint) addTaskToSprint(sprint, task);
  }}
>
  <SelectTrigger className="h-7 text-xs w-28">
    <SelectValue placeholder="Add to sprint" />
  </SelectTrigger>
  <SelectContent>
    {sprints.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
  </SelectContent>
</Select>
```

Keeping `value=""` means `SelectValue` always shows the placeholder after selection.

---

## RTL Support

The `Select` root automatically reads `isRTL` from `LangContext` and sets `dir` accordingly. No extra work needed.

---

## Using Status Configs

Import option lists from `@/config/status-config` instead of hardcoding arrays:

```tsx
import {
  taskStatusConfig, statusOptions,
  priorityStateConfig, priorityOptions,
  severityStatusConfig, severityOptions,
  taskTypeConfig, taskTypes,
} from "@/config/status-config";
import { useLang } from "@/contexts/LangContext";

// Inside component:
const { t } = useLang();
const statusConfig = taskStatusConfig(t);
const priorityConfig = priorityStateConfig(t);
```

### Status select (with translated labels)

```tsx
<Select value={task.status} onValueChange={(v) => updateTask({ status: v as TaskStatus })}>
  <SelectTrigger className="w-full text-sm"><SelectValue /></SelectTrigger>
  <SelectContent>
    {statusOptions.map((s) => (
      <SelectItem key={s} value={s}>{statusConfig[s].label}</SelectItem>
    ))}
  </SelectContent>
</Select>
```

### Priority select

```tsx
<Select value={task.priority} onValueChange={(v) => updateTask({ priority: v as TaskPriority })}>
  <SelectTrigger className="w-full text-sm"><SelectValue /></SelectTrigger>
  <SelectContent>
    {priorityOptions.map((p) => (
      <SelectItem key={p} value={p}>{priorityConfig[p].label}</SelectItem>
    ))}
  </SelectContent>
</Select>
```

### Bug severity select

```tsx
<Select value={form.bugSeverity} onValueChange={(v) => setForm(f => ({ ...f, bugSeverity: v as BugSeverity }))}>
  <SelectTrigger className="w-full text-sm"><SelectValue /></SelectTrigger>
  <SelectContent>
    {severityOptions.map((s) => (
      <SelectItem key={s} value={s}>{severityConfig[s].label}</SelectItem>
    ))}
  </SelectContent>
</Select>
```

### Task type select

```tsx
<Select value={form.type} onValueChange={(v) => setForm(f => ({ ...f, type: v as TaskType }))}>
  <SelectTrigger className="w-full text-sm"><SelectValue /></SelectTrigger>
  <SelectContent>
    {taskTypes.map((type) => (
      <SelectItem key={type} value={type}>{typeConfig[type].label}</SelectItem>
    ))}
  </SelectContent>
</Select>
```

---

## Status Config Shape Reference

```ts
// Each entry in taskStatusConfig(t), priorityStateConfig(t), etc.:
{
  label: string;      // translated label — use in SelectItem
  className: string;  // Tailwind classes — use in badges/pills
  color?: string;     // hex color — use in charts, dots
}
```

Exported option arrays keep the canonical order:
- `statusOptions`   → `["todo", "in-progress", "review", "done", "blocked"]`
- `priorityOptions` → `["low", "medium", "high", "urgent"]`
- `severityOptions` → `["low", "medium", "high", "critical"]`
- `taskTypes`       → `["task", "bug", "feature", "improvement"]`

---

## Dynamic items (spaces, members, senders)

```tsx
// Spaces
<Select value={form.spaceId} onValueChange={(v) => setForm(f => ({ ...f, spaceId: v }))}>
  <SelectTrigger className="w-full text-sm">
    <SelectValue placeholder="Select a space..." />
  </SelectTrigger>
  <SelectContent>
    {spaces.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
  </SelectContent>
</Select>

// Members
<Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
  <SelectTrigger className="flex-1 text-sm">
    <SelectValue placeholder={t.selectMember} />
  </SelectTrigger>
  <SelectContent>
    {members.map(m => (
      <SelectItem key={m.id} value={m.id}>
        {m.displayName || m.email}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```
