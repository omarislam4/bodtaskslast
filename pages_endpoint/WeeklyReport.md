# WeeklyReport Page Endpoints

## Status

This contract is now implemented in the Laravel API.

## Weekly Report Shape

```json
{
  "id": "4",
  "userId": "12",
  "userName": "Jane Doe",
  "userEmail": "jane@example.com",
  "report": "Closed the onboarding backlog and shipped the dashboard refresh.",
  "submittedAt": "2026-05-21T12:00:00.000Z",
  "payload": {
    "weekOf": "2026-05-18"
  },
  "createdAt": "2026-05-21T12:00:00.000Z"
}
```

## `GET /api/weekly-reports`

Supports opt-in pagination with `page` and `perPage`. Without pagination parameters, it keeps returning the existing plain array response.

### Pagination Examples

Without pagination:

```http
GET /api/weekly-reports?userId=4
```

Returns a plain weekly report array.

With pagination:

```http
GET /api/weekly-reports?userId=4&page=1&perPage=15
```

Returns `data`, `meta`, and `links`.

Returns weekly reports for the current user. Admins may filter by `userId`.

### Payload

None

### Success Response

```json
[
  {
    "id": "4",
    "report": "Closed the onboarding backlog and shipped the dashboard refresh."
  }
]
```

## `POST /api/weekly-reports`

Stores a weekly report for the authenticated user.

### Payload

```json
{
  "report": "Closed the onboarding backlog and shipped the dashboard refresh."
}
```

### Success Response

```json
{
  "message": "Weekly report submitted successfully.",
  "weeklyReport": {
    "id": "4",
    "report": "Closed the onboarding backlog and shipped the dashboard refresh."
  }
}
```
