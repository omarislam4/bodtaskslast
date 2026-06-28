# Member Dashboard Page Endpoints

## Endpoint Usage

`MemberDashboard.tsx` does not introduce a new dedicated backend contract in this pass.

It currently depends on the endpoints below.

## `GET /api/auth/me`

### Payload

None

### Success Response

See [AuthEndpoints.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/AuthEndpoints.md).

## `GET /api/my-tasks`

Supports opt-in pagination with `page` and `perPage` through the shared My Tasks endpoint. Without pagination parameters, it keeps returning the existing plain array response.

### Pagination Examples

Without pagination:

```http
GET /api/my-tasks
```

Returns a plain task array.

With pagination:

```http
GET /api/my-tasks?page=1&perPage=15
```

Returns `data`, `meta`, and `links`.

### Payload

None

### Success Response

See [MyTasks.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/MyTasks.md).

## `GET /api/spaces`

### Payload

None

### Success Response

See [Spaces.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/Spaces.md).

## Task Endpoints

The dashboard cards and task navigation also depend on the implemented shared task contracts:

- [Tasks.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/Tasks.md)
- [TaskDetail.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/TaskDetail.md)
- [MyTasks.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/MyTasks.md)

## Ranking Endpoints

The member dashboard also surfaces the user's rank, XP, and leaderboard position.

### `GET /api/rankings/me`

Returns the authenticated user's rank, XP, strikes, and task status counts.

### `GET /api/users/{userId}/ranking`

Returns one user's rank summary. Admins can inspect any user; members can inspect only themselves.

### `GET /api/rankings`

Returns the leaderboard and top three users. Supports filters: `rank`, `xpMin`, `xpMax`, `strikesMin`, `strikesMax`, `top`.

See [Rankings.md](Rankings.md) for full payloads and response shapes.

## Current Status

This page is now covered by the auth, spaces, and implemented Laravel task endpoints documented above.

## Flow

1. `GET /api/auth/me` provides the current user identity.
2. `GET /api/my-tasks` provides the user's task list, counts, and upcoming deadlines.
3. `GET /api/spaces` supports navigation into the user's spaces.
4. Clicking a task opens the detail contract in [TaskDetail.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/TaskDetail.md).

