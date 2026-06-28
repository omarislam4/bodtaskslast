# Recent Changes — All Endpoint Files

Changes applied across `pages_endpoint/` based on `RecentChangesEndpoints(2).md`.

---

## TaskDetail.md

### `PATCH /api/tasks/{id}` — Extended

- Added optional `attachments` array field (appends without replacing existing; use DELETE to remove).
- Added sprint auto-status side effect: changing `status` recalculates sprint to `active`, `completed`, or `planning`.
- Added XP award side effect: moving to `done` awards 20 XP + 1 strike (on time / no deadline) or 10 XP (past deadline) to unique recipients.
- Added JSON link payload example and multipart/form-data file example.
- Added method-spoofing fallback (`POST` with `_method: PATCH`) for frontends that cannot send multipart PATCH.

### New section: Attachment Endpoints

Three endpoints added that were entirely missing:

| Method   | Endpoint                                     |
| -------- | -------------------------------------------- |
| `GET`    | `/api/tasks/{id}/attachments`                |
| `POST`   | `/api/tasks/{id}/attachments`                |
| `DELETE` | `/api/tasks/{id}/attachments/{attachmentId}` |

Supported types: `file`, `screenshot`, `video`, `link`. Max file size 50 MB.

### Notes — 4 lines added

- Attachment type rules and max file size.
- `attachments` field appends, does not replace.
- XP award logic on task completion.
- Sprint auto-status recalculation on status change.

---

## SpaceDetail.md

### New section: Space Attachments (3 endpoints added)

| Method   | Endpoint                                           |
| -------- | -------------------------------------------------- |
| `GET`    | `/api/spaces/{spaceId}/attachments`                |
| `POST`   | `/api/spaces/{spaceId}/attachments`                |
| `DELETE` | `/api/spaces/{spaceId}/attachments/{attachmentId}` |

- Supported types: `file`, `screenshot`, `video`, `link`. Max 50 MB. Files stored on S3/CloudFront.
- `POST` accepts JSON (for links) or `multipart/form-data` (for files).
- `DELETE` removes the file from S3. Admins only.
- Added validation errors: missing file, missing URL, unsupported type, file too large.

---

## Tasks.md

### Task Shape

- Added `"attachments": []` to the task shape.

### `POST /api/tasks`

- Added optional `attachments` array to payload (supports link + multipart file).

### `PATCH /api/tasks/{id}`

- Added side-effect note: XP award when `status` → `done`.
- Added side-effect note: sprint auto-status recalculation.
- Added note: `attachments` field appends without replacing.

### Notes

- Added `attachments` to the list of arrays expected inline on the task resource.
- Added reference to `TaskDetail.md` for attachment sub-resource endpoints.
- Added reference to `Rankings.md` for XP rules.

---

## Bugs.md

### `POST /api/tasks` (create bug)

- Added optional `attachments` array to payload.

### Notes — 2 lines added

- Bugs support the same attachment types as tasks.
- `PATCH /api/tasks/{id}` with `attachments` appends without replacing.

---

## Sprints.md

### `POST /api/sprints/{id}/tasks`

- Description updated: now recalculates sprint metrics and status after adding a task.

### `DELETE /api/sprints/{id}/tasks/{taskId}`

- Description updated: now recalculates sprint metrics and status after removing a task.

### Notes — 2 lines added

- Sprint auto-status rules: `completed` (all tasks done), `active` (at least one started), `planning` (no tasks or all not started).
- `PATCH /api/sprints/{id}` accepts manual `status` but task changes can override it.

---

## Attendance.md

### `GET /api/attendance`

- Added full query parameter docs (`userId`, `page`, `perPage`).
- Added full record shape to success response.
- Added paginated response shape.

### New: `GET /api/attendance/summary`

Grouped attendance by user and day. Supports `userId`, `date`, `period`, `week`, `month`, `from`, `to`, `page`, `perPage`.

### New: `GET /api/attendance/status`

Returns authenticated user's attendance state for today (or a specific date). Includes `attendanceState` and `summary`.

### New: `GET /api/attendance/current`

Returns current attendance type and all types recorded today. Includes `typesMade` array and `attendanceState`.

### `POST /api/attendance`

- Expanded to document all allowed `type` values: `start`, `midday`, `pause`, `resume`, `end`.
- Added XP notes: 3 XP (start), 2 XP (midday), 5 XP (end shift with ≥8h).
- Added full `attendanceState` object in success response.
- Added validation error for missing `report` on `end`.

---

## WeeklyReport.md

### Weekly Report Shape

- Added `payload.reportType` field to shape.

### `POST /api/weekly-reports`

- Added XP note: awards **10 XP** once per ISO week; duplicate blocked.
- Added full response shape with `payload.reportType` and `payload.weekOf`.

### `GET /api/weekly-reports`

- Added `?userId=12` and pagination examples.
- Added full response shape.

### New: Monthly Reports (entire section added)

Two new endpoints:

| Method | Endpoint               |
| ------ | ---------------------- |
| `GET`  | `/api/monthly-reports` |
| `POST` | `/api/monthly-reports` |

- `POST /api/monthly-reports` awards **10 XP** once per calendar month.
- Response includes `payload.reportType` and `payload.monthOf`.

---

## MemberDashboard.md

### New section: Ranking Endpoints

Added references to the three new ranking endpoints:

- `GET /api/rankings/me`
- `GET /api/users/{userId}/ranking`
- `GET /api/rankings`

Links to new `Rankings.md` for full details.

---

## Rankings.md (new file)

Entirely new file covering the XP and leaderboard system:

- XP rules table (task completion, attendance, reports).
- Rank thresholds table (Beginner → Productivity Guru).
- `GET /api/rankings/me` — authenticated user's rank, XP, strikes, task counts.
- `GET /api/users/{userId}/ranking` — one user's rank summary (admin or self).
- `GET /api/rankings` — leaderboard with `topThree` and filtered `data`. Query params: `rank`, `xpMin`, `xpMax`, `strikesMin`, `strikesMax`, `top`.
- XP award triggers table mapping each endpoint to its award.
