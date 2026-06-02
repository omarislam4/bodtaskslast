# API Doc

## Purpose

This file is the running backend contract for replacing the existing Firebase-driven frontend with Laravel API endpoints while keeping the same working data shape wherever possible.

## Current Conventions

- Base path: `/api`
- Auth for protected endpoints: `Authorization: Bearer <token>`
- Auth package: Laravel Sanctum
- Response style: JSON only
- Naming style:
  - Database columns use snake_case
  - API payloads and responses may use camelCase when the frontend docs already expect that shape

## Documentation Standard

Every endpoint doc in `docs/pages_endpoint` should include these sections:

1. `Endpoint`
2. `Payload`
3. `Success Response`
4. `Failure Response` when the endpoint has important validation, auth, or permission rules

If an endpoint does not accept a request body, document it as:

```txt
Payload: None
```

## User Shape

Current normalized API user response:

```json
{
  "id": "1",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "displayName": "Jane Doe",
  "role": "member",
  "avatar": "",
  "spaceIds": [],
  "phone": "",
  "countryCode": "+1",
  "shiftEnd": "",
  "shiftReminderSent": false,
  "createdAt": "2026-05-20T06:35:00.000000Z",
  "updatedAt": "2026-05-20T06:35:00.000000Z"
}
```

## Space Shape

```json
{
  "id": "1",
  "name": "Operations",
  "description": "Main operations space",
  "color": "#3b82f6",
  "icon": "layers",
  "memberIds": ["1"],
  "parentSpaceId": null,
  "createdAt": "2026-05-20T08:00:00.000000Z",
  "createdBy": "1"
}
```

## Space Data Item Shape

```json
{
  "id": "5",
  "type": "link",
  "name": "Figma Board",
  "url": "https://example.com",
  "notes": "Design handoff",
  "parentId": null,
  "createdAt": "2026-05-20T09:00:00.000000Z",
  "createdBy": "1"
}
```

## Task Shape

Implemented task contract shape used by the current task-related frontend pages:

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

## Sprint Shape

Implemented sprint contract shape used by the current sprint page:

```json
{
  "id": "2",
  "name": "May Sprint 2",
  "goal": "Ship the landing page and close login bugs.",
  "spaceId": "5",
  "status": "active",
  "startDate": "2026-05-20T00:00:00.000Z",
  "endDate": "2026-05-31T00:00:00.000Z",
  "taskIds": ["7", "11"],
  "totalPoints": 13,
  "completedPoints": 5,
  "createdBy": "1",
  "createdAt": "2026-05-20T08:00:00.000Z"
}
```

## Implemented Endpoints

### `POST /api/auth/logout`

See [AuthEndpoints.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/AuthEndpoints.md).

### `GET /api/auth/me`

See [AuthEndpoints.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/AuthEndpoints.md).

### `POST /api/auth/login`

See [Login.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/Login.md).

### `POST /api/auth/register`

See [Signup.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/Signup.md).

### `GET /api/user`

Returns the authenticated user in the normalized user resource shape.

Payload: None

Success response:

```json
{
  "id": "1",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "displayName": "Jane Doe",
  "role": "member",
  "avatar": "",
  "spaceIds": [],
  "phone": "",
  "countryCode": "+1",
  "shiftEnd": "",
  "shiftReminderSent": false,
  "createdAt": "2026-05-20T06:35:00.000000Z",
  "updatedAt": "2026-05-20T06:35:00.000000Z"
}
```

### `GET /api/users`

See [Users.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/Users.md).

### `GET /api/users/{id}`

See [Users.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/Users.md).

### `POST /api/users`

See [Users.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/Users.md).

### `PATCH /api/users/{id}`

See [Users.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/Users.md).

### `DELETE /api/users/{id}`

See [Users.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/Users.md).

### `GET /api/spaces`

See [Spaces.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/Spaces.md).

### `POST /api/spaces`

See [Spaces.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/Spaces.md).

### `GET /api/spaces/{id}`

See [SpaceDetail.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/SpaceDetail.md).

### `PATCH /api/spaces/{id}`

See [SpaceDetail.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/SpaceDetail.md).

### `DELETE /api/spaces/{id}`

See [SpaceDetail.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/SpaceDetail.md).

### `GET /api/spaces/{id}/subspaces`

See [SpaceDetail.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/SpaceDetail.md).

### `POST /api/spaces/{id}/subspaces`

See [SpaceDetail.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/SpaceDetail.md).

### `GET /api/spaces/{id}/members`

See [MembersPage.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/MembersPage.md).

### `POST /api/spaces/{id}/members`

See [MembersPage.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/MembersPage.md).

### `DELETE /api/spaces/{id}/members/{userId}`

See [MembersPage.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/MembersPage.md).

### `GET /api/senders`

See [Senders.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/Senders.md).

### `POST /api/senders`

See [Senders.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/Senders.md).

### `PATCH /api/senders/{id}`

See [Senders.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/Senders.md).

### `DELETE /api/senders/{id}`

See [Senders.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/Senders.md).

### `GET /api/spaces/{id}/data-items`

See [SpaceDetail.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/SpaceDetail.md).

### `POST /api/spaces/{id}/data-items`

See [SpaceDetail.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/SpaceDetail.md).

### `DELETE /api/spaces/{id}/data-items/{itemId}`

See [SpaceDetail.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/SpaceDetail.md).

### `GET /api/goals`

See [Goals.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/Goals.md).

### `POST /api/goals`

See [Goals.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/Goals.md).

### `GET /api/goals/{id}`

See [Goals.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/Goals.md).

### `PATCH /api/goals/{id}`

See [Goals.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/Goals.md).

### `DELETE /api/goals/{id}`

See [Goals.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/Goals.md).

### `GET /api/forms`

See [Forms.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/Forms.md).

### `POST /api/forms`

See [Forms.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/Forms.md).

### `GET /api/forms/{id}`

See [Forms.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/Forms.md).

### `PATCH /api/forms/{id}`

See [Forms.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/Forms.md).

### `DELETE /api/forms/{id}`

See [Forms.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/Forms.md).

### `GET /api/public/forms/{id}`

See [PublicForm.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/PublicForm.md).

### `POST /api/public/forms/{id}/submissions`

See [PublicForm.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/PublicForm.md).

### `GET /api/inbox/notifications`

See [Inbox.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/Inbox.md).

### `POST /api/inbox/notifications/{id}/read`

See [Inbox.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/Inbox.md).

### `POST /api/inbox/notifications/mark-all-read`

See [Inbox.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/Inbox.md).
### `GET /api/chat/channels`

See [Chat.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/Chat.md).

### `POST /api/chat/channels`

See [Chat.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/Chat.md).

### `DELETE /api/chat/channels/{id}`

See [Chat.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/Chat.md).

### `GET /api/chat/channels/{id}/messages`

See [Chat.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/Chat.md).

### `POST /api/chat/channels/{id}/messages`

See [Chat.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/Chat.md).

### `PATCH /api/chat/messages/{id}`

See [Chat.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/Chat.md).

### `DELETE /api/chat/messages/{id}`

See [Chat.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/Chat.md).

### `POST /api/chat/messages/{id}/reactions`

See [Chat.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/Chat.md).

## Implemented Task Contracts

These contracts are implemented in the Laravel backend and now power the current task-related pages.

### `GET /api/tasks`

See [Tasks.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/Tasks.md).

### `POST /api/tasks`

See [Tasks.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/Tasks.md).

### `GET /api/tasks/{id}`

See [Tasks.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/Tasks.md) and [TaskDetail.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/TaskDetail.md).

### `PATCH /api/tasks/{id}`

See [Tasks.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/Tasks.md) and [TaskDetail.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/TaskDetail.md).

### `DELETE /api/tasks/{id}`

See [Tasks.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/Tasks.md) and [TaskDetail.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/TaskDetail.md).

### `GET /api/my-tasks`

See [MyTasks.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/MyTasks.md).

### `GET /api/tasks/timeline`

See [Timeline.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/Timeline.md).

## Implemented Page Contracts

These pages rely on the shared contracts above plus page-specific implemented endpoints.

### Dashboard

See [Dashboard.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/Dashboard.md).

Main page-specific endpoints:

- `GET /api/dashboard`
- `POST /api/tasks/{id}/reassign`

### Bugs

See [Bugs.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/Bugs.md).

The Bugs page reuses:

- `GET /api/tasks?type=bug`
- `POST /api/tasks`
- `PATCH /api/tasks/{id}`

### Sprints

See [Sprints.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/Sprints.md).

Main page-specific endpoints:

- `GET /api/sprints`
- `POST /api/sprints`
- `PATCH /api/sprints/{id}`
- `DELETE /api/sprints/{id}`
- `POST /api/sprints/{id}/tasks`
- `DELETE /api/sprints/{id}/tasks/{taskId}`

### Settings

See [Settings.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/Settings.md).

Main page-specific endpoints:

- `GET /api/auth/me`
- `PATCH /api/users/{id}`
- `GET /api/settings/app`
- `PATCH /api/settings/app`
- `POST /api/auth/logout`

### Senders

See [Senders.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/Senders.md).

Main page-specific endpoints:

- `GET /api/senders`
- `POST /api/senders`
- `PATCH /api/senders/{id}`
- `DELETE /api/senders/{id}`

### Goals

See [Goals.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/Goals.md).

Main page-specific endpoints:

- `GET /api/goals`
- `POST /api/goals`
- `PATCH /api/goals/{id}`
- `DELETE /api/goals/{id}`

### Forms

See [Forms.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/Forms.md).

Main page-specific endpoints:

- `GET /api/forms`
- `POST /api/forms`
- `PATCH /api/forms/{id}`
- `DELETE /api/forms/{id}`

### PublicForm

See [PublicForm.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/PublicForm.md).

Main page-specific endpoints:

- `GET /api/public/forms/{id}`
- `POST /api/public/forms/{id}/submissions`

### Inbox

See [Inbox.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/Inbox.md).

Main page-specific endpoints:

- `GET /api/inbox/notifications`
- `POST /api/inbox/notifications/{id}/read`
- `POST /api/inbox/notifications/mark-all-read`
### Chat

See [Chat.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/Chat.md).

Main page-specific endpoints:

- `GET /api/chat/channels`
- `POST /api/chat/channels`
- `DELETE /api/chat/channels/{id}`
- `GET /api/chat/channels/{id}/messages`
- `POST /api/chat/channels/{id}/messages`
- `PATCH /api/chat/messages/{id}`
- `DELETE /api/chat/messages/{id}`
- `POST /api/chat/messages/{id}/reactions`

## Build Strategy

For each page from `docs/pages`:

1. Read the page and its related hooks.
2. Infer the exact payload and response shape expected by the frontend.
3. Add or update migrations, models, routes, controllers, requests, resources, and supporting classes only when needed.
4. Document the page endpoint contract in `docs/pages_endpoint`.
5. Keep this file updated as the central index of implemented API behavior.



## More Implemented Page Contracts

### History

See [History.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/History.md).

Main page-specific endpoints:

- `GET /api/history`

### Attendance

See [Attendance.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/Attendance.md).

Main page-specific endpoints:

- `GET /api/attendance`
- `POST /api/attendance`

### WeeklyReport

See [WeeklyReport.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/WeeklyReport.md).

Main page-specific endpoints:

- `GET /api/weekly-reports`
- `POST /api/weekly-reports`

### Automations

See [Automations.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/Automations.md).

Main page-specific endpoints:

- `GET /api/automations`
- `POST /api/automations`
- `PATCH /api/automations/{id}`
- `DELETE /api/automations/{id}`

### Portfolio

See [Portfolio.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/Portfolio.md).

Main page-specific endpoints:

- `GET /api/portfolio`

### not-found

See [not-found.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/not-found.md).

