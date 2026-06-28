# Attendance Page Endpoints

## Status

This contract is now implemented in the Laravel API.

## Attendance Record Shape

```json
{
  "id": "21",
  "userId": "4",
  "userName": "Jane Doe",
  "userEmail": "jane@example.com",
  "type": "start",
  "report": "",
  "recordedAt": "2026-06-19T08:00:00.000Z",
  "payload": {
    "message": "Start main shift"
  },
  "createdAt": "2026-06-19T08:00:00.000Z"
}
```

## `GET /api/attendance`

Returns raw attendance records. Admins can filter by user. Members always receive only their own records.

Supports opt-in pagination with `page` and `perPage`. Without pagination parameters, returns a plain array.

### Query Parameters

- `userId`: admin-only filter for one user
- `page`: optional pagination page
- `perPage`: optional pagination size

### Payload

None

### Examples

```http
GET /api/attendance
GET /api/attendance?userId=4
GET /api/attendance?userId=4&page=1&perPage=15
```

### Success Response (without pagination)

```json
[
  {
    "id": "21",
    "userId": "4",
    "userName": "Jane Doe",
    "userEmail": "jane@example.com",
    "type": "start",
    "report": "",
    "recordedAt": "2026-06-19T08:00:00.000Z",
    "payload": {
      "message": "Start main shift"
    },
    "createdAt": "2026-06-19T08:00:00.000Z"
  }
]
```

### Success Response (with pagination)

```json
{
  "data": [ ... ],
  "meta": {
    "currentPage": 1,
    "page": 1,
    "perPage": 15,
    "total": 42,
    "lastPage": 3,
    "from": 1,
    "to": 15,
    "hasMore": true
  },
  "links": {
    "first": "http://127.0.0.1:8000/api/attendance?page=1&perPage=15",
    "last": "http://127.0.0.1:8000/api/attendance?page=3&perPage=15",
    "prev": null,
    "next": "http://127.0.0.1:8000/api/attendance?page=2&perPage=15"
  }
}
```

## `GET /api/attendance/summary`

Returns attendance grouped by user and day. By default returns today's grouped summary.

Admins see all users by default and can filter by `userId`. Members always see only their own grouped records.

Supports opt-in pagination with `page` and `perPage` for the user list.

### Query Parameters

- `userId`: admin-only filter for one user
- `date`: one specific day, format `YYYY-MM-DD`
- `period`: `week` or `month`
- `week`: ISO week, e.g. `2026-W25`, or a date inside the week
- `month`: month filter, format `YYYY-MM`
- `from`: custom range start date
- `to`: custom range end date
- `page`: optional pagination page
- `perPage`: optional pagination size

### Examples

```http
GET /api/attendance/summary
GET /api/attendance/summary?userId=4&date=2026-06-19
GET /api/attendance/summary?period=week
GET /api/attendance/summary?week=2026-W25
GET /api/attendance/summary?month=2026-06
GET /api/attendance/summary?from=2026-06-01&to=2026-06-19
GET /api/attendance/summary?date=2026-06-19&page=1&perPage=15
```

### Success Response

```json
{
  "period": {
    "from": "2026-06-19",
    "to": "2026-06-19"
  },
  "data": [
    {
      "userId": "4",
      "userName": "Jane Doe",
      "userEmail": "jane@example.com",
      "days": [
        {
          "date": "2026-06-19",
          "userId": "4",
          "userName": "Jane Doe",
          "userEmail": "jane@example.com",
          "startAt": "2026-06-19T08:00:00.000Z",
          "middayAt": "2026-06-19T12:00:00.000Z",
          "endAt": "2026-06-19T17:00:00.000Z",
          "pauseAt": "2026-06-19T13:00:00.000Z",
          "resumeAt": "2026-06-19T13:30:00.000Z",
          "pausedMinutes": 30,
          "totalWorkMinutes": 510,
          "totalWorkHours": 8.5,
          "attendanceState": {
            "currentState": "ended",
            "lastType": "end",
            "nextAction": null,
            "hasStarted": true,
            "hasMidday": true,
            "hasEnded": true,
            "isPaused": false,
            "canStartShift": false,
            "canMidday": false,
            "canPause": false,
            "canResume": false,
            "canEndShift": false
          }
        }
      ],
      "totals": {
        "workMinutes": 510,
        "workHours": 8.5,
        "pausedMinutes": 30
      }
    }
  ]
}
```

## `GET /api/attendance/status`

Returns the authenticated user's attendance state for today. Pass `date=YYYY-MM-DD` to inspect a specific day.

The state resets naturally the next day because it is computed only from records for the requested date.

### Examples

```http
GET /api/attendance/status
GET /api/attendance/status?date=2026-06-19
```

### Success Response

```json
{
  "date": "2026-06-19",
  "attendanceState": {
    "currentState": "working",
    "lastType": "start",
    "nextAction": "midday",
    "hasStarted": true,
    "hasMidday": false,
    "hasEnded": false,
    "isPaused": false,
    "canStartShift": false,
    "canMidday": true,
    "canPause": true,
    "canResume": false,
    "canEndShift": true
  },
  "summary": {
    "date": "2026-06-19",
    "userId": "4",
    "userName": "Jane Doe",
    "userEmail": "jane@example.com",
    "startAt": "2026-06-19T08:00:00.000Z",
    "middayAt": null,
    "endAt": null,
    "pauseAt": null,
    "resumeAt": null,
    "pausedMinutes": 0,
    "totalWorkMinutes": null,
    "totalWorkHours": null
  }
}
```

## `GET /api/attendance/current`

Returns the authenticated user's current attendance type and all attendance types already recorded today.

### Examples

```http
GET /api/attendance/current
GET /api/attendance/current?date=2026-06-19
```

### Success Response

```json
{
  "date": "2026-06-19",
  "userId": "4",
  "currentAttendanceType": "pause",
  "typesMade": ["start", "midday", "pause"],
  "attendanceState": {
    "currentState": "paused",
    "lastType": "pause",
    "nextAction": "resume",
    "hasStarted": true,
    "hasMidday": true,
    "hasEnded": false,
    "isPaused": true,
    "canStartShift": false,
    "canMidday": false,
    "canPause": false,
    "canResume": true,
    "canEndShift": true
  }
}
```

### Response (user has no records today)

```json
{
  "date": "2026-06-19",
  "userId": "4",
  "currentAttendanceType": null,
  "typesMade": [],
  "attendanceState": {
    "currentState": "not_started",
    "lastType": null,
    "nextAction": "start",
    "hasStarted": false,
    "hasMidday": false,
    "hasEnded": false,
    "isPaused": false,
    "canStartShift": true,
    "canMidday": false,
    "canPause": false,
    "canResume": false,
    "canEndShift": false
  }
}
```

## `POST /api/attendance`

Stores a new attendance action and returns the updated attendance state. Awards XP automatically.

Allowed `type` values: `start`, `midday`, `pause`, `resume`, `end`.

The `report` field is required when `type` is `end`.

### Start Shift Payload

Awards **3 XP** once per day.

```json
{ "type": "start" }
```

### Midday Payload

Awards **2 XP** once per day.

```json
{ "type": "midday" }
```

### Pause Payload

```json
{ "type": "pause" }
```

### Resume Payload

```json
{ "type": "resume" }
```

### End Shift Payload

Awards **5 XP** once per day only if total worked time is at least 8 hours after subtracting paused time.

```json
{
  "type": "end",
  "report": "Finished assigned work and prepared tomorrow plan."
}
```

### Success Response

```json
{
  "message": "Shift end recorded successfully.",
  "record": {
    "id": "25",
    "userId": "4",
    "userName": "Jane Doe",
    "userEmail": "jane@example.com",
    "type": "end",
    "report": "Finished assigned work and prepared tomorrow plan.",
    "recordedAt": "2026-06-19T17:00:00.000Z",
    "payload": {
      "message": "End shift"
    },
    "createdAt": "2026-06-19T17:00:00.000Z"
  },
  "attendanceState": {
    "currentState": "ended",
    "lastType": "end",
    "nextAction": null,
    "hasStarted": true,
    "hasMidday": true,
    "hasEnded": true,
    "isPaused": false,
    "canStartShift": false,
    "canMidday": false,
    "canPause": false,
    "canResume": false,
    "canEndShift": false
  }
}
```

### Validation Error

```json
{
  "message": "The report field is required when type is end.",
  "errors": {
    "report": ["The report field is required when type is end."]
  }
}
```
