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
- appending new attachments (files, screenshots, videos, or links)

**Side effects:**

- When `status` changes to `done`, XP is awarded to unique users from task assignees, creator, and the user who marked it done (20 XP + 1 strike if on time or no deadline; 10 XP if past deadline).
- When the task belongs to a sprint, changing `status` automatically recalculates the sprint status: `active` if at least one task is started, `completed` if every task is done, `planning` if no tasks are started.

#### Payload (status update)

```json
{
  "status": "done",
  "progress": 100,
  "completedAt": "2026-05-27T17:00:00.000Z"
}
```

#### Payload (append attachments — JSON with link)

```json
{
  "status": "in-progress",
  "progress": 40,
  "attachments": [
    {
      "type": "link",
      "title": "QA retest notes",
      "url": "https://example.com/retest"
    }
  ]
}
```

#### Payload (append attachments — multipart/form-data with file)

```
PATCH /api/tasks/11
Content-Type: multipart/form-data

Fields:
- status: in-progress
- attachments[0][type]: screenshot
- attachments[0][title]: Retest screenshot
- attachments[0][file]: uploaded file
```

If the frontend cannot send multipart PATCH, use method spoofing:

```
POST /api/tasks/11
Content-Type: multipart/form-data

Fields:
- _method: PATCH
- attachments[0][type]: screenshot
- attachments[0][file]: uploaded file
```

Existing attachments are **not replaced**. Use the delete attachment endpoint to remove old attachments.

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

#### Success Response (with attachments)

```json
{
  "message": "Task updated successfully.",
  "task": {
    "id": "11",
    "status": "in-progress",
    "progress": 40,
    "attachments": [
      {
        "id": "32",
        "taskId": "11",
        "type": "link",
        "title": "QA retest notes",
        "url": "https://example.com/retest",
        "fileName": null,
        "originalName": null,
        "mimeType": null,
        "size": null,
        "uploadedBy": "12",
        "uploadedByName": "Jane Doe",
        "meta": [],
        "createdAt": "2026-06-19T10:35:00.000Z"
      }
    ]
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

When `type` is `blocked_by` or `related`, the current task waits for the referenced task. The waiting task cannot be moved to `in-progress`, `review`, or `done` until every blocking dependency is done. If a blocking dependency is added to an already-started task, the task is moved back to `blocked`.

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

## Attachment Endpoints

Supported attachment types: `file`, `screenshot`, `video`, `link`.

For `link`, send `url`. For all other types, send `file` using `multipart/form-data`. Max file size is 50 MB.

### `GET /api/tasks/{id}/attachments`

Lists all attachments for a task or bug.

#### Payload

None

#### Success Response

```json
[
  {
    "id": "31",
    "taskId": "11",
    "type": "screenshot",
    "title": "Login screenshot",
    "url": "http://127.0.0.1:8000/storage/task-attachments/11/file.png",
    "fileName": "file.png",
    "originalName": "login-error.png",
    "mimeType": "image/png",
    "size": 18422,
    "uploadedBy": "12",
    "uploadedByName": "Jane Doe",
    "meta": [],
    "createdAt": "2026-06-19T10:30:00.000Z"
  }
]
```

### `POST /api/tasks/{id}/attachments`

Adds one attachment after the task already exists.

#### Link Payload

```json
{
  "type": "link",
  "title": "Loom recording",
  "url": "https://example.com/recording"
}
```

#### Multipart File Payload

```
POST /api/tasks/11/attachments
Content-Type: multipart/form-data

Fields:
- type: screenshot
- title: Login screenshot
- file: uploaded file
```

#### Success Response

```json
{
  "message": "Attachment added successfully.",
  "attachment": {
    "id": "33",
    "type": "link",
    "title": "Loom recording",
    "url": "https://example.com/recording"
  },
  "task": {
    "id": "11",
    "attachments": []
  }
}
```

### `DELETE /api/tasks/{id}/attachments/{attachmentId}`

Deletes one attachment. Uploaded files are also removed from storage.

#### Payload

None

#### Success Response

```json
{
  "message": "Attachment deleted successfully.",
  "task": {
    "id": "11",
    "attachments": []
  }
}
```

## Notes

- The task detail screen expects all task arrays to be returned inline on the base task resource.
- Mentioned users are stored on the created activity entry through the `mentions` field and now also receive inbox notifications.
- Reminder sends append an activity log entry and also create inbox reminder notifications for assignees.
- Dashboard quick reassignment appends a `reassign` activity entry, returns the removed and newly assigned user IDs in `notificationsSent`, and creates an inbox assignment notification for the new assignee.
- Task attachments support `file`, `screenshot`, `video`, and `link` types. Links use a `url` field; all other types use `multipart/form-data`. Max file size is 50 MB.
- `PATCH /api/tasks/{id}` with an `attachments` field appends new attachments without replacing existing ones.
- Marking a task `done` via `PATCH /api/tasks/{id}` awards XP to unique recipients (assignees, creator, and the user who completed it): 20 XP + 1 strike if on time or no deadline; 10 XP if past deadline. Duplicate XP for the same task is blocked.
- Changing task status via `PATCH /api/tasks/{id}` automatically recalculates the sprint status if the task belongs to a sprint (`active` → at least one task started; `completed` → all tasks done; `planning` → no tasks started).


