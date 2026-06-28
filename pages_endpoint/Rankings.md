# Rankings And XP System Endpoints

## Status

This contract is now implemented in the Laravel API. XP and rank settings live in `config/ranking.php`.

## XP Rules

| Action | XP | Notes |
|---|---|---|
| Task completed on time (or no deadline) | 20 XP + 1 strike | |
| Task completed after deadline | 10 XP | No strike |
| Start shift attendance | 3 XP | Once per day |
| Midday attendance | 2 XP | Once per day |
| End shift (≥8 worked hours excl. paused time) | 5 XP | Once per day |
| Weekly report | 10 XP | Once per ISO week |
| Monthly report | 10 XP | Once per calendar month |

Duplicate XP is blocked for: same task completion, same attendance action on the same day, same weekly report week, same monthly report month.

Task completion XP recipients are unique users from task assignees, task creator, and user who marked it done. If the same user holds multiple roles, they receive XP only once.

## Rank Thresholds

| XP | Rank |
|---|---|
| 0 | Beginner |
| 1000 | Planner |
| 3000 | Organizer |
| 7000 | Achiever |
| 10000 | Performer |
| 15000 | Expert |
| 20000 | Master |
| 25000 | Productivity Guru |

## `GET /api/rankings/me`

Returns the authenticated user's rank, XP, strikes, task totals, and task status counts.

### Payload

None

### Success Response

```json
{
  "position": 4,
  "userId": "12",
  "userName": "Jane Doe",
  "userEmail": "jane@example.com",
  "avatar": "",
  "rank": {
    "name": "Beginner",
    "minXp": 0,
    "image": null,
    "next": {
      "name": "Planner",
      "minXp": 1000,
      "remainingXp": 930,
      "image": null
    }
  },
  "xp": 70,
  "strikes": 2,
  "tasksNumber": 9,
  "tasksDone": 3,
  "taskStatuses": {
    "todo": 2,
    "in-progress": 1,
    "review": 1,
    "done": 3,
    "blocked": 2
  }
}
```

## `GET /api/users/{userId}/ranking`

Returns one user's rank summary.

Admins can inspect any user. Members can inspect only themselves.

### Payload

None

### Success Response

Same shape as `GET /api/rankings/me`.

## `GET /api/rankings`

Returns the leaderboard and top three users.

### Payload

None

### Query Parameters

- `rank`: exact rank name, e.g. `Planner`
- `xpMin`: minimum XP
- `xpMax`: maximum XP
- `strikesMin`: minimum strikes
- `strikesMax`: maximum strikes
- `top`: limit the returned `data` list

### Examples

```http
GET /api/rankings
GET /api/rankings?top=3
GET /api/rankings?rank=Planner
GET /api/rankings?xpMin=1000&xpMax=7000
GET /api/rankings?strikesMin=5&strikesMax=20
```

### Success Response

```json
{
  "topThree": [
    {
      "position": 1,
      "userId": "12",
      "userName": "Jane Doe",
      "userEmail": "jane@example.com",
      "avatar": "",
      "rank": {
        "name": "Planner",
        "minXp": 1000,
        "image": null,
        "next": {
          "name": "Organizer",
          "minXp": 3000,
          "remainingXp": 1800,
          "image": null
        }
      },
      "xp": 1200,
      "strikes": 18,
      "tasksNumber": 30,
      "tasksDone": 20,
      "taskStatuses": {
        "todo": 3,
        "in-progress": 4,
        "review": 1,
        "done": 20,
        "blocked": 2
      }
    }
  ],
  "data": []
}
```

## XP Award Triggers

These existing endpoints award XP automatically when their condition is met:

| Endpoint | Trigger | Award |
|---|---|---|
| `PATCH /api/tasks/{id}` | Status moves to `done` (on time) | 20 XP + 1 strike |
| `PATCH /api/tasks/{id}` | Status moves to `done` (past deadline) | 10 XP |
| `POST /api/attendance` | `type: start` | 3 XP |
| `POST /api/attendance` | `type: midday` | 2 XP |
| `POST /api/attendance` | `type: end` + ≥8h worked | 5 XP |
| `POST /api/weekly-reports` | First report of the ISO week | 10 XP |
| `POST /api/monthly-reports` | First report of the calendar month | 10 XP |
