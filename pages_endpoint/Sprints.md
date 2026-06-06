# Sprints Page Endpoints

## Status

This contract is now implemented in the Laravel API and inferred from:

- [Sprints.tsx](C:/laragon/www/bod-app-api/docs/pages/Sprints.tsx)
- [useSprints.ts](C:/laragon/www/bod-app-api/docs/hooks/useSprints.ts)

The page uses sprint records plus the shared task contract so it can show backlog tasks and sprint membership.

## Sprint Shape

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

## Sprint List

### `GET /api/sprints`

Returns the sprint list used by the page.

#### Payload

None

#### Query Parameters

- `spaceId`: filter to one space
- `status`: `planning`, `active`, or `completed`

#### Success Response

```json
[
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
]
```

## Create Sprint

### `POST /api/sprints`

#### Payload

```json
{
  "name": "May Sprint 2",
  "goal": "Ship the landing page and close login bugs.",
  "spaceId": "5",
  "startDate": "2026-05-20T00:00:00.000Z",
  "endDate": "2026-05-31T00:00:00.000Z"
}
```

#### Success Response

```json
{
  "message": "Sprint created successfully.",
  "sprint": {
    "id": "2",
    "name": "May Sprint 2",
    "goal": "Ship the landing page and close login bugs.",
    "spaceId": "5",
    "status": "planning",
    "startDate": "2026-05-20T00:00:00.000Z",
    "endDate": "2026-05-31T00:00:00.000Z",
    "taskIds": [],
    "totalPoints": 0,
    "completedPoints": 0,
    "createdBy": "1",
    "createdAt": "2026-05-20T08:00:00.000Z"
  }
}
```

## Update Sprint

### `PATCH /api/sprints/{id}`

Used for editing sprint metadata and changing sprint status.

#### Payload

```json
{
  "name": "May Sprint 2",
  "goal": "Ship the landing page and close login bugs.",
  "startDate": "2026-05-20T00:00:00.000Z",
  "endDate": "2026-05-31T00:00:00.000Z",
  "status": "active"
}
```

#### Success Response

```json
{
  "message": "Sprint updated successfully.",
  "sprint": {
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
}
```

## Delete Sprint

### `DELETE /api/sprints/{id}`

Deletes the sprint while leaving tasks in place and clearing their `sprintId`.

#### Payload

None

#### Success Response

```json
{
  "message": "Sprint deleted successfully.",
  "clearedTaskIds": ["7", "11"]
}
```

## Manage Sprint Tasks

### `POST /api/sprints/{id}/tasks`

Adds an existing task to the sprint and updates the task's `sprintId`.

#### Payload

```json
{
  "taskId": "7"
}
```

#### Success Response

```json
{
  "message": "Task added to sprint successfully.",
  "sprint": {
    "id": "2",
    "taskIds": ["7", "11"]
  },
  "task": {
    "id": "7",
    "sprintId": "2"
  }
}
```

### `DELETE /api/sprints/{id}/tasks/{taskId}`

Removes the task from the sprint and clears the task's `sprintId`.

#### Payload

None

#### Success Response

```json
{
  "message": "Task removed from sprint successfully.",
  "sprint": {
    "id": "2",
    "taskIds": ["11"]
  },
  "task": {
    "id": "7",
    "sprintId": null
  }
}
```

## Notes

- The page still needs the shared task list from [Tasks.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/Tasks.md) so it can build the backlog and sprint task cards.
- The sprint contract stores both `taskIds` on the sprint and `sprintId` on the task. The backend should keep those two relations in sync.
- Backlog tasks are tasks where `sprintId` is `null` and `status` is not `done`.

## Pagination

`GET /api/sprints` supports opt-in pagination with `page` and `perPage`. This also applies when filtering by `spaceId`. Without pagination parameters, it keeps returning the existing plain array response.

### Pagination Examples

Without pagination:

```http
GET /api/sprints?spaceId=5
```

Returns a plain sprint array.

With pagination:

```http
GET /api/sprints?spaceId=5&page=1&perPage=10
```

Returns `data`, `meta`, `links`, and `counts`.

```json
{
  "counts": {
    "total": 42,
    "active": 2,
    "planning": 1,
    "completed": 39
  }
}
```

`counts` is computed over all sprints matching the active filters, independent of the current page.

