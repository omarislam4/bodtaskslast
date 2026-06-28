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
    "reportType": "weekly",
    "weekOf": "2026-05-18"
  },
  "createdAt": "2026-05-21T12:00:00.000Z"
}
```

## `GET /api/weekly-reports`

Returns weekly reports for the current user. Admins may filter by `userId`.

Supports opt-in pagination with `page` and `perPage`. Without pagination parameters, returns a plain array.

### Payload

None

### Examples

```http
GET /api/weekly-reports
GET /api/weekly-reports?userId=12
GET /api/weekly-reports?page=1&perPage=15
```

### Success Response

```json
[
  {
    "id": "4",
    "userId": "12",
    "userName": "Jane Doe",
    "userEmail": "jane@example.com",
    "report": "Closed the onboarding backlog and shipped the dashboard refresh.",
    "submittedAt": "2026-05-21T12:00:00.000Z",
    "payload": {
      "reportType": "weekly",
      "weekOf": "2026-05-18"
    },
    "createdAt": "2026-05-21T12:00:00.000Z"
  }
]
```

## `POST /api/weekly-reports`

Stores a weekly report for the authenticated user. Awards **10 XP** once per ISO week. Duplicate XP for the same week is blocked.

### Payload

```json
{
  "report": "Closed the backlog and prepared next sprint planning."
}
```

### Success Response

```json
{
  "message": "Weekly report submitted successfully.",
  "weeklyReport": {
    "id": "7",
    "userId": "12",
    "userName": "Jane Doe",
    "userEmail": "jane@example.com",
    "report": "Closed the backlog and prepared next sprint planning.",
    "submittedAt": "2026-06-19T10:40:00.000Z",
    "payload": {
      "reportType": "weekly",
      "weekOf": "2026-06-15"
    },
    "createdAt": "2026-06-19T10:40:00.000Z"
  }
}
```

---

## Monthly Report Shape

```json
{
  "id": "8",
  "userId": "12",
  "userName": "Jane Doe",
  "userEmail": "jane@example.com",
  "report": "Finished the monthly delivery review and prepared next month priorities.",
  "submittedAt": "2026-06-19T10:45:00.000Z",
  "payload": {
    "reportType": "monthly",
    "monthOf": "2026-06-01"
  },
  "createdAt": "2026-06-19T10:45:00.000Z"
}
```

## `GET /api/monthly-reports`

Returns monthly reports for the current user. Admins may filter by `userId`.

Supports opt-in pagination with `page` and `perPage`.

### Payload

None

### Examples

```http
GET /api/monthly-reports
GET /api/monthly-reports?userId=12
GET /api/monthly-reports?page=1&perPage=15
```

### Success Response

```json
[
  {
    "id": "8",
    "userId": "12",
    "userName": "Jane Doe",
    "userEmail": "jane@example.com",
    "report": "Finished the monthly delivery review and prepared next month priorities.",
    "submittedAt": "2026-06-19T10:45:00.000Z",
    "payload": {
      "reportType": "monthly",
      "monthOf": "2026-06-01"
    },
    "createdAt": "2026-06-19T10:45:00.000Z"
  }
]
```

## `POST /api/monthly-reports`

Stores a monthly report for the authenticated user. Awards **10 XP** once per calendar month. Duplicate XP for the same month is blocked.

### Payload

```json
{
  "report": "Finished the monthly delivery review and prepared next month priorities."
}
```

### Success Response

```json
{
  "message": "Monthly report submitted successfully.",
  "monthlyReport": {
    "id": "8",
    "userId": "12",
    "userName": "Jane Doe",
    "userEmail": "jane@example.com",
    "report": "Finished the monthly delivery review and prepared next month priorities.",
    "submittedAt": "2026-06-19T10:45:00.000Z",
    "payload": {
      "reportType": "monthly",
      "monthOf": "2026-06-01"
    },
    "createdAt": "2026-06-19T10:45:00.000Z"
  }
}
```
