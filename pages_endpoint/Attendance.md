# Attendance Page Endpoints

## Status

This contract is now implemented in the Laravel API.

## Attendance Record Shape

```json
{
  "id": "1",
  "userId": "12",
  "userName": "Jane Doe",
  "userEmail": "jane@example.com",
  "type": "start",
  "report": "",
  "recordedAt": "2026-05-21T08:00:00.000Z",
  "payload": {
    "message": "Start main shift"
  },
  "createdAt": "2026-05-21T08:00:00.000Z"
}
```

## `GET /api/attendance`

Returns attendance records for the current user. Admins may filter by `userId`.

### Payload

None

### Success Response

```json
[
  {
    "id": "1",
    "type": "start",
    "recordedAt": "2026-05-21T08:00:00.000Z"
  }
]
```

## `POST /api/attendance`

Stores a new attendance action.

### Payload

```json
{
  "type": "end",
  "report": "Finished QA pass and prepared tomorrow plan."
}
```

### Success Response

```json
{
  "message": "Shift end recorded successfully.",
  "record": {
    "id": "3",
    "type": "end",
    "report": "Finished QA pass and prepared tomorrow plan."
  }
}
```

### Failure Response

```json
{
  "message": "The report field is required when type is end."
}
```
