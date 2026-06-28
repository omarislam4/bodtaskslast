# Bugs Page Endpoints

## Status

This contract is now implemented through the shared task endpoints with `type=bug`.

The current frontend treats bugs as regular tasks where `type` is `bug`.

## Bug List

### `GET /api/tasks?type=bug`

Returns the bug list used by the Bugs page.

#### Payload

None

#### Query Parameters

- `spaceId`: filter to one space
- `status`: `todo`, `in-progress`, `review`, `done`, or `blocked`
- `bugSeverity`: `low`, `medium`, `high`, or `critical`
- `assigneeId`: filter to one assigned member
- `senderId`: filter to one sender
- `search`: search in title, description, and bug text fields

#### Success Response

```json
[
  {
    "id": "11",
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
    "progress": 0,
    "tags": [],
    "checklistItems": [],
    "activityLog": []
  }
]
```

## Create Bug

### `POST /api/tasks`

Creates a new bug record using the shared task resource.

#### Payload

Attachments can be included at creation. For links, include `url`; for files, send using `multipart/form-data`.

```json
{
  "title": "Login button does not respond",
  "description": "The click event is ignored on Safari.",
  "stepsToReproduce": "Open Safari, go to login, click submit.",
  "expectedBehavior": "The form should submit.",
  "actualBehavior": "Nothing happens.",
  "status": "todo",
  "priority": "high",
  "type": "bug",
  "bugSeverity": "critical",
  "deadline": "2026-05-24T12:00:00.000Z",
  "assigneeIds": ["12"],
  "senderId": "sender-1",
  "spaceId": "5",
  "estimatedHours": 2,
  "progress": 0,
  "attachments": [
    {
      "type": "link",
      "title": "Bug recording",
      "url": "https://example.com/recording"
    }
  ]
}
```

#### Success Response

```json
{
  "message": "Bug reported successfully.",
  "task": {
    "id": "11",
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
    "progress": 0,
    "createdAt": "2026-05-20T08:00:00.000Z",
    "createdBy": "1",
    "completedAt": null,
    "activityLog": [],
    "checklistItems": [],
    "tags": []
  }
}
```

#### Failure Response

```json
{
  "message": "The space id field is required.",
  "errors": {
    "spaceId": ["The space id field is required."]
  }
}
```

## Update Bug

### `PATCH /api/tasks/{id}`

Used when the bug is edited from the list or task detail flow.

#### Payload

```json
{
  "status": "in-progress",
  "priority": "urgent",
  "bugSeverity": "high",
  "assigneeIds": ["18"],
  "progress": 40
}
```

#### Success Response

```json
{
  "message": "Task updated successfully.",
  "task": {
    "id": "11",
    "status": "in-progress",
    "priority": "urgent",
    "bugSeverity": "high",
    "assigneeIds": ["18"],
    "progress": 40
  }
}
```

## Notes

- The Bugs page uses the same task resource described in [Tasks.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/Tasks.md).
- Available `senderId` values come from the implemented sender directory in [Senders.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/Senders.md).
- The detail screen for a bug still follows the shared task detail contract in [TaskDetail.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/TaskDetail.md).
- The available assignee list is filtered by the selected space's `memberIds`, so bug creation only needs `spaceId` and `assigneeIds`; the backend does not need a separate bug-member endpoint.
- Bugs support the same attachment types as tasks (`file`, `screenshot`, `video`, `link`). Attachments can be included on `POST /api/tasks` at creation or added later via `POST /api/tasks/{id}/attachments`. See `TaskDetail.md` for the full attachment sub-resource contract.
- `PATCH /api/tasks/{id}` with an `attachments` field appends new attachments to a bug without replacing existing ones.

## Pagination

The Bugs page uses `GET /api/tasks?type=bug`, so it supports the same opt-in pagination as the shared task list with `page` and `perPage`. Without pagination parameters, it keeps returning the existing plain array response.

### Pagination Examples

Without pagination:

```http
GET /api/tasks?type=bug&spaceId=5
```

Returns a plain bug task array.

With pagination:

```http
GET /api/tasks?type=bug&spaceId=5&page=1&perPage=15
```

Returns `data`, `meta`, and `links`.


