# Dashboard Page Endpoints

## Status

This contract is now implemented in the Laravel API for the dashboard aggregate and quick reassignment flow.

The current frontend dashboard mixes shared task data with page-specific aggregates and a quick reassignment flow.

## Main Page Data

### `GET /api/dashboard`

Returns the aggregated dashboard payload used by the overview cards, charts, deadlines list, recent tasks, space summary, and optional kanban view.

#### Payload

None

#### Query Parameters

- `spaceId`: limit the dashboard to one visible space
- `view`: `overview` or `kanban`
- `performanceSpaceId`: limit the member performance chart to one space

#### Success Response

```json
{
  "stats": {
    "total": 32,
    "done": 11,
    "inProgress": 9,
    "blocked": 2,
    "bugs": 5,
    "unassigned": 4
  },
  "statusBreakdown": [
    { "name": "To Do", "value": 8, "key": "todo" },
    { "name": "In Progress", "value": 9, "key": "in-progress" },
    { "name": "Review", "value": 2, "key": "review" },
    { "name": "Done", "value": 11, "key": "done" },
    { "name": "Blocked", "value": 2, "key": "blocked" }
  ],
  "upcoming": [
    {
      "id": "7",
      "spaceId": "5",
      "title": "Launch landing page",
      "status": "in-progress",
      "deadline": "2026-05-27T17:00:00.000Z"
    }
  ],
  "overdue": [
    {
      "id": "11",
      "spaceId": "5",
      "title": "Fix production login bug",
      "status": "blocked",
      "deadline": "2026-05-18T12:00:00.000Z"
    }
  ],
  "recent": [
    {
      "id": "7",
      "spaceId": "5",
      "title": "Launch landing page",
      "status": "in-progress",
      "priority": "high",
      "type": "task",
      "assigneeIds": ["12"],
      "deadline": "2026-05-27T17:00:00.000Z",
      "createdAt": "2026-05-20T08:00:00.000Z"
    }
  ],
  "spaces": [
    {
      "id": "5",
      "name": "Marketing",
      "color": "#3b82f6",
      "taskCount": 9,
      "doneCount": 4,
      "completionRate": 44
    }
  ],
  "memberPerformance": [
    {
      "userId": "12",
      "name": "Jane",
      "fullName": "Jane Doe",
      "todo": 2,
      "inProgress": 3,
      "review": 1,
      "done": 4,
      "blocked": 0,
      "total": 10,
      "completionRate": 40,
      "color": "#6366f1"
    },
    {
      "userId": null,
      "name": "Unassigned",
      "fullName": "Unassigned Tasks",
      "todo": 3,
      "inProgress": 1,
      "review": 0,
      "done": 0,
      "blocked": 0,
      "total": 4,
      "completionRate": 0,
      "color": "#94a3b8"
    }
  ],
  "kanbanTasks": []
}
```

## Quick Reassignment

### `POST /api/tasks/{id}/reassign`

Used by the dashboard admin quick-action that reassigns a task, optionally moves the deadline, appends a `reassign` activity entry, and returns notification recipient lists for the frontend flow.

#### Payload

```json
{
  "assigneeId": "18",
  "reason": "Moving this to the QA owner.",
  "newDeadline": "2026-05-28T17:00:00.000Z"
}
```

#### Success Response

```json
{
  "message": "Task reassigned successfully.",
  "task": {
    "id": "7",
    "assigneeIds": ["18"],
    "deadline": "2026-05-28T17:00:00.000Z",
    "activityLog": [
      {
        "id": "7-12",
        "type": "reassign",
        "text": "Task reassigned by Admin from [Jane Doe] to John Smith - Reason: Moving this to the QA owner. - New deadline: 2026-05-28",
        "timestamp": 1747735200000,
        "sender": "Admin",
        "reassignedBy": "1",
        "fromAssignees": ["12"],
        "toAssignee": "18",
        "reason": "Moving this to the QA owner.",
        "newDeadline": "2026-05-28T17:00:00.000Z"
      }
    ]
  },
  "notificationsSent": {
    "removedUsers": ["12"],
    "assignedUsers": ["18"]
  }
}
```

#### Failure Response

```json
{
  "message": "Only admins can reassign tasks from the dashboard."
}
```

## Notes

- The dashboard still depends on the shared task shape documented in [Tasks.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/Tasks.md).
- Task detail links still open the shared task detail flow documented in [TaskDetail.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/TaskDetail.md).

## Pagination

`GET /api/dashboard?view=kanban` supports opt-in pagination for `kanbanTasks` with `page` and `perPage`. When pagination is requested, the response includes `kanbanMeta` and `kanbanLinks`; without pagination parameters, `kanbanTasks` keeps the existing plain array shape.

### Pagination Examples

Without pagination:

```http
GET /api/dashboard?view=kanban&spaceId=5
```

Returns dashboard stats with `kanbanTasks` as a plain task array.

With pagination:

```http
GET /api/dashboard?view=kanban&spaceId=5&page=1&perPage=15
```

Returns dashboard stats with `kanbanTasks`, `kanbanMeta`, and `kanbanLinks`.


