# Goals Page Endpoints

## Status

This contract is now implemented in the Laravel API.

The shared goals system powers both the top-level `Goals` page and the `goals` tab inside `SpaceDetail`.

## Goal Shape

```json
{
  "id": "1",
  "title": "Close onboarding gap",
  "description": "Raise onboarding completion this month.",
  "type": "percent",
  "targetValue": 100,
  "currentValue": 45,
  "currency": "",
  "status": "on_track",
  "folder": "",
  "spaceId": "5",
  "linkedTaskIds": ["7", "8"],
  "createdBy": "12",
  "createdAt": "2026-05-21T10:00:00.000Z",
  "dueDate": "2026-05-31T00:00:00.000Z"
}
```

## `GET /api/goals`

Returns visible goals for the authenticated user.

### Payload

None

### Query Parameters

- `spaceId`: when provided, returns only goals for that space
- omit `spaceId` to return global goals plus goals from spaces visible to the current user
- use `spaceId=null` to return only global goals

### Success Response

```json
[
  {
    "id": "1",
    "title": "Close onboarding gap",
    "description": "Raise onboarding completion this month.",
    "type": "percent",
    "targetValue": 100,
    "currentValue": 45,
    "currency": "",
    "status": "on_track",
    "folder": "",
    "spaceId": "5",
    "linkedTaskIds": ["7", "8"],
    "createdBy": "12",
    "createdAt": "2026-05-21T10:00:00.000Z",
    "dueDate": "2026-05-31T00:00:00.000Z"
  }
]
```

## `POST /api/goals`

Creates a goal for the current user.

### Payload

```json
{
  "title": "Close onboarding gap",
  "description": "Raise onboarding completion this month.",
  "type": "percent",
  "targetValue": 100,
  "currentValue": 45,
  "status": "on_track",
  "spaceId": 5,
  "linkedTaskIds": ["7", "8"],
  "dueDate": "2026-05-31"
}
```

### Success Response

```json
{
  "message": "Goal created successfully.",
  "goal": {
    "id": "1",
    "title": "Close onboarding gap",
    "description": "Raise onboarding completion this month.",
    "type": "percent",
    "targetValue": 100,
    "currentValue": 45,
    "currency": "",
    "status": "on_track",
    "folder": "",
    "spaceId": "5",
    "linkedTaskIds": ["7", "8"],
    "createdBy": "12",
    "createdAt": "2026-05-21T10:00:00.000Z",
    "dueDate": "2026-05-31T00:00:00.000Z"
  }
}
```

## `PATCH /api/goals/{id}`

Updates a goal created by the current user. Admins may update any goal.

### Payload

```json
{
  "currentValue": 60,
  "status": "at_risk"
}
```

### Success Response

```json
{
  "message": "Goal updated successfully.",
  "goal": {
    "id": "1",
    "currentValue": 60,
    "status": "at_risk"
  }
}
```

### Failure Response

```json
{
  "message": "You can only manage goals you created."
}
```

## `DELETE /api/goals/{id}`

Deletes a goal created by the current user. Admins may delete any goal.

### Payload

None

### Success Response

```json
{
  "message": "Goal deleted successfully."
}
```

## Notes

- The top-level `Goals` page uses `GET /api/goals`.
- The `SpaceDetail` goals tab uses the same endpoint with `?spaceId={spaceId}`.
- `linkedTaskIds` keeps the relation between a goal and relevant tasks.

## Pagination

`GET /api/goals` supports opt-in pagination with `page` and `perPage`. This also applies when filtering by `spaceId`. Without pagination parameters, it keeps returning the existing plain array response.

### Pagination Examples

Without pagination:

```http
GET /api/goals?spaceId=5
```

Returns a plain goal array.

With pagination:

```http
GET /api/goals?spaceId=5&page=1&perPage=10
```

Returns `data`, `meta`, `links`, and `stats`.

```json
{
  "stats": {
    "total": 24,
    "onTrack": 14,
    "atRisk": 6,
    "offTrack": 2,
    "completed": 2
  }
}
```

`stats` is computed over all goals matching the active filters, independent of the current page.
