# My Tasks Page Endpoints

## Status

This contract is now implemented in the Laravel API for the My Tasks page.

## `GET /api/my-tasks`

Supports opt-in pagination with `page` and `perPage`. Without pagination parameters, it keeps returning the existing plain array response.

### Pagination Examples

Without pagination:

```http
GET /api/my-tasks
```

Returns a plain task array.

With pagination:

```http
GET /api/my-tasks?page=1&perPage=15
```

Returns `data`, `meta`, `links`, and `counts`.

```json
{
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

`counts` is computed over all tasks assigned to the authenticated user, independent of the current page and `scope` filter.

Returns active tasks assigned to the authenticated user, sorted by nearest deadline.

This endpoint is the backend replacement for the current `useMyTasks(userId)` Firebase hook behavior.

### Payload

None

### Query Parameters

- `scope`: `today`, `overdue`, `upcoming`, or `all`
- `search`: text filter on task title

### Success Response

```json
[
  {
    "id": "7",
    "spaceId": "5",
    "title": "Launch landing page",
    "description": "Ship the new homepage copy and QA.",
    "status": "in-progress",
    "priority": "high",
    "type": "task",
    "tags": ["frontend"],
    "checklistItems": [],
    "subtasks": [],
    "timeEntries": [],
    "dependencies": [],
    "recurrence": null,
    "storyPoints": 5,
    "startDate": "2026-05-20T08:00:00.000Z",
    "watchers": ["1", "12"],
    "sprintId": null,
    "milestone": false,
    "assigneeIds": ["12"],
    "senderId": "sender-1",
    "deadline": "2026-05-27T17:00:00.000Z",
    "estimatedHours": 8,
    "progress": 40,
    "createdAt": "2026-05-20T08:00:00.000Z",
    "createdBy": "1",
    "completedAt": null,
    "activityLog": []
  }
]
```

## Notes

- The page only displays active tasks, so completed tasks should be excluded by default unless explicitly requested.
- The page also resolves `spaceId` into space name and color using the spaces contract from [Spaces.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/Spaces.md).
- Clicking a task opens the detail screen documented in [TaskDetail.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/TaskDetail.md).

