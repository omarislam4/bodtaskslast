# Chat Page Endpoints

## Status

This contract is now implemented in the Laravel API.

The shared chat system supports:

- global channels for the top-level `Chat` page
- space-scoped channels for the `chat` tab inside `SpaceDetail`
- public and private channels
- per-channel message history, soft delete, and reactions

## Channel Shape

```json
{
  "id": "1",
  "name": "general",
  "description": "General discussions",
  "isPrivate": false,
  "memberIds": [],
  "createdBy": "1",
  "createdAt": "2026-05-21T09:00:00.000Z",
  "lastMessage": "Hello team",
  "lastMessageAt": "2026-05-21T09:05:00.000Z",
  "spaceId": null
}
```

## Message Shape

```json
{
  "id": "7",
  "channelId": "1",
  "spaceId": null,
  "senderId": "12",
  "senderName": "Jane Doe",
  "text": "Hello team",
  "createdAt": "2026-05-21T09:05:00.000Z",
  "edited": false,
  "deleted": false,
  "mentions": ["18"],
  "replyTo": null,
  "reactions": {
    ":thumbsup:": ["12"]
  }
}
```

## `GET /api/chat/channels`

Returns visible channels for the authenticated user.

### Payload

None

### Query Parameters

- `spaceId`: when provided, returns channels for that specific space
- omit `spaceId` to return global channels plus channels from spaces visible to the current user
- use `spaceId=null` to return only global channels

Private channel visibility rules:

- admins can see all channels
- public channels are visible to everyone who can access the related space
- private channels are visible only to admins, the channel creator, and users listed in `memberIds`

### Success Response

```json
[
  {
    "id": "1",
    "name": "general",
    "description": "General discussions",
    "isPrivate": false,
    "memberIds": [],
    "createdBy": "1",
    "createdAt": "2026-05-21T09:00:00.000Z",
    "lastMessage": null,
    "lastMessageAt": null,
    "spaceId": null
  }
]
```

## `POST /api/chat/channels`

Admin-only endpoint for creating a global or space channel.

### Payload

```json
{
  "name": "general",
  "description": "General discussions",
  "spaceId": null,
  "isPrivate": false,
  "memberIds": []
}
```

### Success Response

```json
{
  "message": "Chat channel created successfully.",
  "channel": {
    "id": "1",
    "name": "general",
    "description": "General discussions",
    "isPrivate": false,
    "memberIds": [],
    "createdBy": "1",
    "createdAt": "2026-05-21T09:00:00.000Z",
    "lastMessage": null,
    "lastMessageAt": null,
    "spaceId": null
  }
}
```

### Failure Response

```json
{
  "message": "Only admins can manage chat channels."
}
```

## `DELETE /api/chat/channels/{id}`

Admin-only endpoint that deletes the channel and cascades its messages.

### Payload

None

### Success Response

```json
{
  "message": "Chat channel deleted successfully."
}
```

## `GET /api/chat/channels/{id}/messages`

Returns messages for one visible channel, ordered by oldest first.

### Payload

None

### Success Response

```json
[
  {
    "id": "7",
    "channelId": "1",
    "spaceId": null,
    "senderId": "12",
    "senderName": "Jane Doe",
    "text": "Hello team",
    "createdAt": "2026-05-21T09:05:00.000Z",
    "edited": false,
    "deleted": false,
    "mentions": [],
    "replyTo": null,
    "reactions": {}
  }
]
```

## `POST /api/chat/channels/{id}/messages`

Creates a message in one visible channel.

### Payload

```json
{
  "text": "Hello team",
  "mentions": ["18"],
  "replyTo": {
    "id": "3",
    "text": "Can you review this?",
    "senderName": "John Smith"
  }
}
```

### Success Response

```json
{
  "message": "Chat message sent successfully.",
  "chatMessage": {
    "id": "7",
    "channelId": "1",
    "spaceId": null,
    "senderId": "12",
    "senderName": "Jane Doe",
    "text": "Hello team",
    "createdAt": "2026-05-21T09:05:00.000Z",
    "edited": false,
    "deleted": false,
    "mentions": ["18"],
    "replyTo": {
      "id": "3",
      "text": "Can you review this?",
      "senderName": "John Smith"
    },
    "reactions": {}
  }
}
```

## `PATCH /api/chat/messages/{id}`

Edits one of the current user's own messages. Admins may also edit messages.

### Payload

```json
{
  "text": "Hello team!"
}
```

### Success Response

```json
{
  "message": "Chat message updated successfully.",
  "chatMessage": {
    "id": "7",
    "text": "Hello team!",
    "edited": true
  }
}
```

## `DELETE /api/chat/messages/{id}`

Soft-deletes one of the current user's own messages. Admins may also delete messages.

### Payload

None

### Success Response

```json
{
  "message": "Chat message deleted successfully."
}
```

## `POST /api/chat/messages/{id}/reactions`

Toggles the current user's reaction on a message.

### Payload

```json
{
  "emoji": ":thumbsup:"
}
```

### Success Response

```json
{
  "message": "Chat reaction updated successfully.",
  "chatMessage": {
    "id": "7",
    "reactions": {
      ":thumbsup:": ["12"]
    }
  }
}
```

## Notes

- The top-level `Chat` page uses global channels where `spaceId` is `null`.
- The `SpaceDetail` chat tab uses the same channel and message endpoints with a non-null `spaceId`.
- Message delete is soft delete so clients can preserve timeline order.
- Mention IDs are stored on the message resource; this pass does not add a separate server-side notification delivery pipeline.
