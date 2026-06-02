# Senders Page Endpoints

## Status

This contract is now implemented in the Laravel API.

The sender list is shared across bug and task creation flows, while the dedicated `Senders` page is the admin UI for managing that list.

## Sender Shape

```json
{
  "id": "1",
  "name": "Acme Support",
  "email": "support@acme.test",
  "phone": "+1 234 567 890",
  "company": "Acme Inc.",
  "createdAt": "2026-05-21T09:00:00.000Z"
}
```

## `GET /api/senders`

Returns the sender list used by the `Senders` page and by bug/task forms that need a `senderId`.

### Payload

None

### Success Response

```json
[
  {
    "id": "1",
    "name": "Acme Support",
    "email": "support@acme.test",
    "phone": "+1 234 567 890",
    "company": "Acme Inc.",
    "createdAt": "2026-05-21T09:00:00.000Z"
  }
]
```

## `POST /api/senders`

Admin-only endpoint for creating a sender.

### Payload

```json
{
  "name": "Acme Support",
  "email": "support@acme.test",
  "phone": "+1 234 567 890",
  "company": "Acme Inc."
}
```

### Success Response

```json
{
  "message": "Sender created successfully.",
  "sender": {
    "id": "1",
    "name": "Acme Support",
    "email": "support@acme.test",
    "phone": "+1 234 567 890",
    "company": "Acme Inc.",
    "createdAt": "2026-05-21T09:00:00.000Z"
  }
}
```

### Failure Response

```json
{
  "message": "Only admins can manage senders."
}
```

## `PATCH /api/senders/{id}`

Admin-only endpoint for updating a sender.

### Payload

```json
{
  "company": "Acme International"
}
```

### Success Response

```json
{
  "message": "Sender updated successfully.",
  "sender": {
    "id": "1",
    "name": "Acme Support",
    "email": "support@acme.test",
    "phone": "+1 234 567 890",
    "company": "Acme International",
    "createdAt": "2026-05-21T09:00:00.000Z"
  }
}
```

## `DELETE /api/senders/{id}`

Admin-only endpoint for deleting a sender.

### Payload

None

### Success Response

```json
{
  "message": "Sender deleted successfully."
}
```

## Notes

- The dedicated `Senders` page is admin-only, but the sender list itself is readable by authenticated users because task and bug forms also consume it.
- Bugs and tasks keep `senderId` on the task resource; this endpoint only manages the available sender directory.
