# Pagination Proposal

## Overview

Pagination contracts for endpoints that grow unbounded over time. Covers the response envelope and the server-side aggregates required alongside each paginated response.

---

## Response Envelope

All paginated endpoints use the same wrapper:

```json
{
  "data": [...],
  "meta": {
    "total": 150,
    "page": 1,
    "perPage": 25,
    "lastPage": 6
  }
}
```

Chat messages support an alternative cursor envelope — see its section below.

---

## Paginated Endpoints

---

### `GET /api/tasks`

**Response:**

```json
{
  "data": [...],
  "meta": {
    "total": 148,
    "page": 1,
    "perPage": 25,
    "lastPage": 6
  },
  "stats": {
    "total": 148,
    "byType": {
      "task": 20,
      "bug": 50,
      "feature": 30,
      "improvement": 48
    },
    "byStatus": {
      "todo": 45,
      "in-progress": 38,
      "review": 12,
      "done": 40,
      "blocked": 13
    },
    "bySeverity": {
      "critical": 9,
      "high": 15,
      "medium": 21,
      "low": 7
    }
  }
}
```

**`stats` rules:**

- Computed over **all matching records**, not just the current page. Always present regardless of page number.
- Respects all active query filters (`spaceId`, `type`, `status`, `bugSeverity`, `assigneeId`, `search`, `sprintId`). If the request is `?spaceId=5&type=bug`, `stats.total` counts only bugs in space 5.
- `stats.bySeverity` is always returned — use zeros for non-bug queries.

---

### `GET /api/inbox/notifications`

**Response:**

```json
{
  "data": [...],
  "meta": {
    "total": 120,
    "page": 1,
    "perPage": 30,
    "lastPage": 4
  },
  "unreadCount": 14
}
```

**Notes:**

- `unreadCount` is a top-level field computed over **all** notifications for the user, independent of the current page.
- `POST /api/inbox/notifications/mark-all-read` must return `"unreadCount": 0` in its response.

---

### `GET /api/chat/channels/{id}/messages`

Two strategies are viable — choose one.

---

#### Option A — Page / offset (recommended)

**Query parameters:** `page` (default: 1), `perPage` (default: 50)

**Response:**

```json
{
  "data": [...],
  "meta": {
    "total": 840,
    "page": 1,
    "perPage": 50,
    "lastPage": 17
  }
}
```

---

#### Option B — Cursor / ID-based

Better for high-volume real-time channels. Avoids page drift — a new message arriving shifts all pages by one, causing duplicates or gaps in page-based pagination.

**Query parameters:** `before` (message ID cursor, omit for initial load), `limit` (default: 50)

**Response:**

```json
{
  "data": [...],
  "meta": {
    "hasMore": true,
    "nextCursor": "6"
  }
}
```

**Notes:**

- `nextCursor` is the ID of the oldest message in the current batch.
- `hasMore: false` signals the beginning of the channel history.
- No `total` needed.

---

#### Option comparison

| | Option A (page/offset) | Option B (cursor) |
|---|---|---|
| Backend complexity | Low | Medium |
| Handles live inserts | No — pages shift | Yes — stable anchor |
| Returns total count | Yes | No |
| Recommended when | Volume is low | Channel is very active |

**Recommendation:** Start with Option A. Upgrade to Option B only if page drift becomes a visible problem.

---

### `GET /api/history`

**Response:**

```json
{
  "data": [...],
  "meta": {
    "total": 310,
    "filteredTotal": 87,
    "page": 1,
    "perPage": 25,
    "lastPage": 4
  }
}
```

**Notes:**

- `meta.total` — count of all completed tasks with no filters applied.
- `meta.filteredTotal` — count after `search` and `priority` filters are applied.

---

### `GET /api/my-tasks`

**Response:**

```json
{
  "data": [...],
  "meta": {
    "total": 47,
    "page": 1,
    "perPage": 25,
    "lastPage": 2
  },
  "counts": {
    "today": 3,
    "overdue": 5,
    "upcoming": 8,
    "all": 47,
    "done": 18,
    "inProgress": 11
  }
}
```

**Notes:**

- `counts` is computed over all tasks for the authenticated user, independent of the current page and the active `scope` filter.

---

### `GET /api/sprints`

**Response:**

```json
{
  "data": [...],
  "meta": {
    "total": 42,
    "page": 1,
    "perPage": 20,
    "lastPage": 3
  },
  "counts": {
    "total": 42,
    "active": 2,
    "planning": 1,
    "completed": 39
  }
}
```

**Notes:**

- `counts` is computed over all sprints matching the active filters, independent of the current page.
- Active and planning sprints are small by nature. The completed history is what grows. Paginate completed sprints separately via `?status=completed&page=N`.

---

### `GET /api/goals`

**Response:**

```json
{
  "data": [...],
  "meta": {
    "total": 24,
    "page": 1,
    "perPage": 25,
    "lastPage": 1
  },
  "stats": {
    "total": 24,
    "onTrack": 14,
    "atRisk": 6,
    "offTrack": 2,
    "completed": 2
  }
}
```

---

## What does not need pagination

| Endpoint | Reason |
|---|---|
| `GET /api/spaces` | Bounded by org structure |
| `GET /api/users` | Required in full for `@mention` autocomplete and ID resolution in chat — see note below |
| `GET /api/automations` | Bounded by user-created rules |
| `GET /api/senders` | Small, admin-managed list |
| `GET /api/chat/channels` | Bounded per space |
| `GET /api/forms` | Small, admin-managed list |
| `GET /api/spaces/{id}/members` | Bounded by org size |
| `GET /api/spaces/{id}/subspaces` | Bounded by space structure |
| `GET /api/spaces/{id}/data-items` | Bounded per space |

**Note on `GET /api/users`:** The global Chat page loads the full user list to power `@mention` autocomplete, highlight mentions in rendered messages, and resolve display names to user IDs when sending. Paginating this endpoint would silently break all three. Space chat uses `GET /api/spaces/{id}/members` which is scoped and bounded, so that context is not affected. If the org grows large enough that returning all users becomes a performance problem, the fix is a dedicated `GET /api/users/search?q=` endpoint for the autocomplete, not paginating the main list.

---

## Server-side aggregates required

Fields that must be computed over the full dataset and returned alongside every paginated response:

| Field | Endpoint |
|---|---|
| `stats.total`, `stats.byType`, `stats.byStatus`, `stats.bySeverity` | `GET /api/tasks` |
| `unreadCount` | `GET /api/inbox/notifications` |
| `counts.today`, `counts.overdue`, `counts.upcoming`, `counts.all`, `counts.done`, `counts.inProgress` | `GET /api/my-tasks` |
| `counts.total`, `counts.active`, `counts.planning`, `counts.completed` | `GET /api/sprints` |
| `stats.total`, `stats.onTrack`, `stats.atRisk`, `stats.offTrack`, `stats.completed` | `GET /api/goals` |
| `meta.total` (unfiltered), `meta.filteredTotal` | `GET /api/history` |
