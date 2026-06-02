# History Page Endpoints

## Status

This contract is now implemented in the Laravel API.

## `GET /api/history`

Returns completed tasks visible to the authenticated user.

### Payload

None

### Query Parameters

- `search`: optional text filter against title and description
- `priority`: optional priority filter such as `low`, `medium`, `high`, or `urgent`

### Success Response

```json
[
  {
    "id": "7",
    "spaceId": "5",
    "title": "Publish launch checklist",
    "description": "Finalized and approved.",
    "status": "done",
    "priority": "high",
    "completedAt": "2026-05-21T11:00:00.000Z"
  }
]
```

## Notes

- This page is a completed-task view over the shared task system.
- The response uses the shared task shape from [Tasks.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/Tasks.md).
