# Inbox Page Endpoints

## Status

This contract is now implemented in the Laravel API.

The inbox is backed by a notifications table and is already related to task assignments, task comments, mentions, reminders, and reassignment flows.

## Notification Shape

```json
{
  "id": "1",
  "userId": "12",
  "type": "assignment",
  "title": "New task assigned",
  "body": "Jane Doe assigned you to \"Prepare launch checklist\".",
  "taskId": "7",
  "spaceId": "5",
  "read": false,
  "createdAt": "2026-05-21T10:20:00.000Z",
  "actorName": "Jane Doe"
}
```

## `GET /api/inbox/notifications`

Returns notifications for the authenticated user, ordered by newest first.

### Payload

None

### Success Response

```json
[
  {
    "id": "1",
    "userId": "12",
    "type": "assignment",
    "title": "New task assigned",
    "body": "Jane Doe assigned you to \"Prepare launch checklist\".",
    "taskId": "7",
    "spaceId": "5",
    "read": false,
    "createdAt": "2026-05-21T10:20:00.000Z",
    "actorName": "Jane Doe"
  }
]
```

## `POST /api/inbox/notifications/{id}/read`

Marks one notification as read.

### Payload

None

### Success Response

```json
{
  "message": "Notification marked as read."
}
```

### Failure Response

```json
{
  "message": "You do not have access to this notification."
}
```

## `POST /api/inbox/notifications/mark-all-read`

Marks all of the current user's notifications as read.

### Payload

None

### Success Response

```json
{
  "message": "All notifications marked as read."
}
```

## Notes

- `assignment` notifications are generated when tasks are assigned or reassigned.
- `mention` and `comment` notifications are generated from task comments.
- `reminder` notifications are generated from the task detail reminder action.
- The page still filters tabs like `unread`, `mentions`, and `assignments` client-side from the returned list.

## Pagination

`GET /api/inbox/notifications` supports opt-in pagination with `page` and `perPage`. Without pagination parameters, it keeps returning the existing plain array response.

### Pagination Examples

Without pagination:

```http
GET /api/inbox/notifications
```

Returns a plain notification array.

With pagination:

```http
GET /api/inbox/notifications?page=1&perPage=15
```

Returns `data`, `meta`, `links`, and `unreadCount`.

```json
{
  "unreadCount": 14
}
```

`unreadCount` is computed over all notifications for the authenticated user, independent of the current page. `POST /api/inbox/notifications/mark-all-read` returns `unreadCount: 0`.
