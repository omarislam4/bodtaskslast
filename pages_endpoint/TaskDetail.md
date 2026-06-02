# Task Detail Page Endpoints

## Status

This contract is now implemented in the Laravel API for the task detail screen, including comments, reminders, checklist items, subtasks, time entries, dependencies, tags, and watchers.

The frontend page route is:

`/spaces/{spaceId}/tasks/{taskId}`

The backend resource contract below uses:

`/api/tasks/{taskId}`

## Base Endpoints

### `GET /api/tasks/{id}`

#### Payload

None

#### Success Response

See [Tasks.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/Tasks.md).

### `PATCH /api/tasks/{id}`

Used for:

- title and description edits
- status, priority, deadline, progress, and assignee changes
- bug-specific field updates
- sprint, milestone, recurrence, and watcher changes

#### Payload

```json
{
  "status": "done",
  "progress": 100,
  "completedAt": "2026-05-27T17:00:00.000Z"
}
```

#### Success Response

```json
{
  "message": "Task updated successfully.",
  "task": {
    "id": "7",
    "status": "done",
    "progress": 100,
    "completedAt": "2026-05-27T17:00:00.000Z"
  }
}
```

### `DELETE /api/tasks/{id}`

#### Payload

None

#### Success Response

```json
{
  "message": "Task deleted successfully."
}
```

## Comments And Reminders

### `POST /api/tasks/{id}/comments`

Adds a manual comment entry to the task activity log.

#### Payload

```json
{
  "text": "Ready for QA review.",
  "mentions": ["12", "18"]
}
```

#### Success Response

```json
{
  "message": "Comment added successfully.",
  "activity": {
    "id": "7-9",
    "type": "comment",
    "source": "manual",
    "text": "Ready for QA review.",
    "timestamp": 1747735200000,
    "sender": "Jane Doe"
  }
}
```

### `POST /api/tasks/{id}/reminders`

Triggers a reminder for current assignees, appends a reminder activity entry, and creates inbox notifications for assignees.

#### Payload

```json
{
  "target": "assignees"
}
```

#### Success Response

```json
{
  "message": "Reminder sent successfully."
}
```

## Checklist Endpoints

### `POST /api/tasks/{id}/checklist-items`

#### Payload

```json
{
  "text": "Review content",
  "assigneeId": "12"
}
```

#### Success Response

```json
{
  "message": "Checklist item created successfully.",
  "item": {
    "id": "7-cl-1",
    "text": "Review content",
    "done": false,
    "assigneeId": "12"
  }
}
```

### `PATCH /api/tasks/{id}/checklist-items/{itemId}`

#### Payload

```json
{
  "done": true
}
```

#### Success Response

```json
{
  "message": "Checklist item updated successfully."
}
```

### `DELETE /api/tasks/{id}/checklist-items/{itemId}`

#### Payload

None

#### Success Response

```json
{
  "message": "Checklist item deleted successfully."
}
```

## Subtask Endpoints

### `POST /api/tasks/{id}/subtasks`

#### Payload

```json
{
  "title": "Prepare mobile QA"
}
```

#### Success Response

```json
{
  "message": "Subtask created successfully.",
  "subtask": {
    "id": "7-st-1",
    "title": "Prepare mobile QA",
    "status": "todo",
    "assigneeIds": [],
    "createdAt": 1747728000000
  }
}
```

### `PATCH /api/tasks/{id}/subtasks/{subtaskId}`

#### Payload

```json
{
  "status": "done"
}
```

#### Success Response

```json
{
  "message": "Subtask updated successfully."
}
```

### `DELETE /api/tasks/{id}/subtasks/{subtaskId}`

#### Payload

None

#### Success Response

```json
{
  "message": "Subtask deleted successfully."
}
```

## Time Entry Endpoints

### `POST /api/tasks/{id}/time-entries`

#### Payload

```json
{
  "duration": 60,
  "note": "Homepage polish",
  "billable": false,
  "startTime": 1747728000000,
  "endTime": 1747731600000
}
```

#### Success Response

```json
{
  "message": "Time entry logged successfully.",
  "timeEntry": {
    "id": "7-te-1",
    "userId": "12",
    "userName": "Jane Doe",
    "startTime": 1747728000000,
    "endTime": 1747731600000,
    "duration": 60,
    "note": "Homepage polish",
    "billable": false
  }
}
```

### `DELETE /api/tasks/{id}/time-entries/{entryId}`

#### Payload

None

#### Success Response

```json
{
  "message": "Time entry deleted successfully."
}
```

## Dependency, Tag, And Watcher Endpoints

### `POST /api/tasks/{id}/dependencies`

#### Payload

```json
{
  "taskId": "3",
  "type": "blocked_by"
}
```

#### Success Response

```json
{
  "message": "Dependency added successfully."
}
```

### `DELETE /api/tasks/{id}/dependencies/{dependencyTaskId}`

#### Payload

None

#### Success Response

```json
{
  "message": "Dependency removed successfully."
}
```

### `POST /api/tasks/{id}/tags`

#### Payload

```json
{
  "tag": "frontend"
}
```

#### Success Response

```json
{
  "message": "Tag added successfully."
}
```

### `DELETE /api/tasks/{id}/tags/{tag}`

#### Payload

None

#### Success Response

```json
{
  "message": "Tag removed successfully."
}
```

### `POST /api/tasks/{id}/watchers`

#### Payload

```json
{
  "userId": "12"
}
```

#### Success Response

```json
{
  "message": "Watcher added successfully."
}
```

### `DELETE /api/tasks/{id}/watchers/{userId}`

#### Payload

None

#### Success Response

```json
{
  "message": "Watcher removed successfully."
}
```

## Notes

- The task detail screen expects all task arrays to be returned inline on the base task resource.
- Mentioned users are stored on the created activity entry through the `mentions` field and now also receive inbox notifications.
- Reminder sends append an activity log entry and also create inbox reminder notifications for assignees.
- Dashboard quick reassignment appends a `reassign` activity entry, returns the removed and newly assigned user IDs in `notificationsSent`, and creates an inbox assignment notification for the new assignee.


