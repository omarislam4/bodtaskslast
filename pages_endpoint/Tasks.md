# Tasks Endpoints

## Status

This contract is now implemented in the Laravel API and is used by the current task, bug, dashboard, sprint, and reporting pages.

The current frontend still reads from the Firebase `tasks` collection through:

- [useTasks.ts](C:/laragon/www/bod-app-api/docs/hooks/useTasks.ts)
- [SpaceDetail.tsx](C:/laragon/www/bod-app-api/docs/pages/SpaceDetail.tsx)
- [Dashboard.tsx](C:/laragon/www/bod-app-api/docs/pages/Dashboard.tsx)
- [Bugs.tsx](C:/laragon/www/bod-app-api/docs/pages/Bugs.tsx)
- [Sprints.tsx](C:/laragon/www/bod-app-api/docs/pages/Sprints.tsx)
- [Spaces.tsx](C:/laragon/www/bod-app-api/docs/pages/Spaces.tsx)
- [MemberDashboard.tsx](C:/laragon/www/bod-app-api/docs/pages/MemberDashboard.tsx)
- [MyTasks.tsx](C:/laragon/www/bod-app-api/docs/pages/MyTasks.tsx)
- [Timeline.tsx](C:/laragon/www/bod-app-api/docs/pages/Timeline.tsx)
- [TaskDetail.tsx](C:/laragon/www/bod-app-api/docs/pages/TaskDetail.tsx)

## Task Shape

```json
{
  "id": "7",
  "spaceId": "5",
  "title": "Launch landing page",
  "description": "Ship the new homepage copy and QA.",
  "status": "in-progress",
  "priority": "high",
  "type": "task",
  "bugSeverity": null,
  "stepsToReproduce": "",
  "expectedBehavior": "",
  "actualBehavior": "",
  "tags": ["frontend", "marketing"],
  "checklistItems": [
    {
      "id": "7-cl-1",
      "text": "Review content",
      "done": true,
      "assigneeId": "12"
    }
  ],
  "subtasks": [
    {
      "id": "7-st-1",
      "title": "Prepare mobile QA",
      "status": "todo",
      "assigneeIds": ["12"],
      "createdAt": 1747728000000
    }
  ],
  "timeEntries": [
    {
      "id": "7-te-1",
      "userId": "12",
      "userName": "Jane Doe",
      "startTime": 1747728000000,
      "endTime": 1747731600000,
      "duration": 60,
      "note": "Homepage polish",
      "billable": false
    }
  ],
  "dependencies": [
    {
      "taskId": "3",
      "type": "blocked_by"
    }
  ],
  "recurrence": null,
  "storyPoints": 5,
  "startDate": "2026-05-20T08:00:00.000Z",
  "watchers": ["1", "12"],
  "sprintId": "2",
  "milestone": false,
  "assigneeIds": ["12"],
  "senderId": "sender-1",
  "deadline": "2026-05-27T17:00:00.000Z",
  "estimatedHours": 8,
  "progress": 40,
  "createdAt": "2026-05-20T08:00:00.000Z",
  "createdBy": "1",
  "completedAt": null,
  "activityLog": [
    {
      "id": "7-1",
      "type": "comment",
      "source": "manual",
      "text": "Ready for QA",
      "timestamp": 1747735200000,
      "sender": "Jane Doe"
    }
  ]
}
```

## `GET /api/tasks`

Returns the shared task collection used across dashboards, space task tabs, bug views, sprint boards, and cross-space reporting.

### Payload

None

### Query Parameters

- `spaceId`: filter to one space
- `assigneeId`: filter to tasks assigned to one user
- `type`: `task`, `bug`, `feature`, or `improvement`
- `status`: `todo`, `in-progress`, `review`, `done`, or `blocked`
- `search`: title/description search text
- `includeCompleted`: `true` or `false`
- `deadlineFrom`: ISO date
- `deadlineTo`: ISO date
- `sprintId`: filter to one sprint

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
    "tags": ["frontend", "marketing"],
    "checklistItems": [],
    "subtasks": [],
    "timeEntries": [],
    "dependencies": [],
    "recurrence": null,
    "storyPoints": 5,
    "startDate": "2026-05-20T08:00:00.000Z",
    "watchers": ["1", "12"],
    "sprintId": "2",
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

## `POST /api/tasks`

Creates a task or bug entry.

This is the shared create endpoint used by the `tasks` tab in [SpaceDetail.tsx](C:/laragon/www/bod-app-api/docs/pages/SpaceDetail.tsx) and the bug creation flow in [Bugs.tsx](C:/laragon/www/bod-app-api/docs/pages/Bugs.tsx).

### Payload

```json
{
  "spaceId": "5",
  "title": "Launch landing page",
  "description": "Ship the new homepage copy and QA.",
  "status": "todo",
  "priority": "high",
  "type": "task",
  "bugSeverity": null,
  "stepsToReproduce": "",
  "expectedBehavior": "",
  "actualBehavior": "",
  "assigneeIds": ["12"],
  "senderId": "sender-1",
  "deadline": "2026-05-27T17:00:00.000Z",
  "estimatedHours": 8,
  "progress": 0
}
```

Bug example:

```json
{
  "spaceId": "5",
  "title": "Login button does not respond",
  "description": "The click event is ignored on Safari.",
  "status": "todo",
  "priority": "high",
  "type": "bug",
  "bugSeverity": "critical",
  "stepsToReproduce": "Open Safari, go to login, click submit.",
  "expectedBehavior": "The form should submit.",
  "actualBehavior": "Nothing happens.",
  "assigneeIds": ["12"],
  "senderId": "sender-1",
  "deadline": "2026-05-24T12:00:00.000Z",
  "estimatedHours": 2,
  "progress": 0
}
```

### Success Response

```json
{
  "message": "Task created successfully.",
  "task": {
    "id": "7",
    "spaceId": "5",
    "title": "Launch landing page",
    "description": "Ship the new homepage copy and QA.",
    "status": "todo",
    "priority": "high",
    "type": "task",
    "tags": [],
    "checklistItems": [],
    "subtasks": [],
    "timeEntries": [],
    "dependencies": [],
    "recurrence": null,
    "storyPoints": null,
    "startDate": null,
    "watchers": [],
    "sprintId": null,
    "milestone": false,
    "assigneeIds": ["12"],
    "senderId": "sender-1",
    "deadline": "2026-05-27T17:00:00.000Z",
    "estimatedHours": 8,
    "progress": 0,
    "createdAt": "2026-05-20T08:00:00.000Z",
    "createdBy": "1",
    "completedAt": null,
    "activityLog": []
  }
}
```

## `GET /api/tasks/{id}`

Returns one task in the full normalized task shape.

### Payload

None

### Success Response

```json
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
  "sprintId": "2",
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
```

## `PATCH /api/tasks/{id}`

Partially updates the task itself. This covers inline edits from the task detail page plus sprint assignment and lightweight dashboard status changes.

### Payload

```json
{
  "title": "Launch landing page",
  "description": "Ship the new homepage copy and QA.",
  "status": "review",
  "priority": "urgent",
  "assigneeIds": ["12", "18"],
  "deadline": "2026-05-28T17:00:00.000Z",
  "estimatedHours": 10,
  "progress": 75,
  "storyPoints": 8,
  "startDate": "2026-05-20T08:00:00.000Z",
  "watchers": ["1", "12", "18"],
  "sprintId": "2",
  "milestone": true,
  "recurrence": {
    "frequency": "weekly",
    "interval": 1,
    "endDate": null,
    "endAfterOccurrences": 6
  }
}
```

### Success Response

```json
{
  "message": "Task updated successfully.",
  "task": {
    "id": "7",
    "spaceId": "5",
    "title": "Launch landing page",
    "description": "Ship the new homepage copy and QA.",
    "status": "review",
    "priority": "urgent",
    "type": "task",
    "tags": ["frontend"],
    "checklistItems": [],
    "subtasks": [],
    "timeEntries": [],
    "dependencies": [],
    "recurrence": {
      "frequency": "weekly",
      "interval": 1,
      "endDate": null,
      "endAfterOccurrences": 6
    },
    "storyPoints": 8,
    "startDate": "2026-05-20T08:00:00.000Z",
    "watchers": ["1", "12", "18"],
    "sprintId": "2",
    "milestone": true,
    "assigneeIds": ["12", "18"],
    "senderId": "sender-1",
    "deadline": "2026-05-28T17:00:00.000Z",
    "estimatedHours": 10,
    "progress": 75,
    "createdAt": "2026-05-20T08:00:00.000Z",
    "createdBy": "1",
    "completedAt": null,
    "activityLog": []
  }
}
```

## `DELETE /api/tasks/{id}`

Deletes one task.

### Payload

None

### Success Response

```json
{
  "message": "Task deleted successfully."
}
```

## Notes

- `TaskDetail.tsx` expects the full task resource shape, including arrays for `activityLog`, `checklistItems`, `subtasks`, `timeEntries`, and `dependencies`.
- A task with unfinished `blocked_by` or `related` dependencies cannot move to `in-progress`, `review`, or `done`. When the blocking task becomes `done`, waiting dependent tasks in `todo` or `blocked` move to `in-progress`.
- The bug-specific usage of this resource is documented in [Bugs.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/Bugs.md).
- Sender options used by bug and task forms come from [Senders.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/Senders.md).
- The dashboard aggregate and reassignment flow that sit on top of this resource are documented in [Dashboard.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/Dashboard.md).
- `Spaces.tsx` and `Dashboard.tsx` both depend on task counts grouped by `spaceId`.
- Sprint membership and the `sprintId` relation are documented in [Sprints.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/Sprints.md).
- `GET /api/tasks` supports opt-in pagination with `page` and `perPage`. Without pagination parameters, it keeps returning the existing plain array response.

### Pagination Examples

Without pagination:

```http
GET /api/tasks?spaceId=5
```

Returns a plain task array.

With pagination:

```http
GET /api/tasks?spaceId=5&page=1&perPage=15
```

Returns `data`, `meta`, `links`, and `stats`.

```json
{
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

`stats` is computed over all matching records after filters such as `spaceId`, `type`, `status`, `bugSeverity`, `assigneeId`, `search`, and `sprintId`.
