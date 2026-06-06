# History Page Endpoints

## Status

This contract is now implemented in the Laravel API.

## `GET /api/history`

Supports opt-in pagination with `page` and `perPage`. Without pagination parameters, it keeps returning the existing plain array response.

### Pagination Examples

Without pagination:

```http
GET /api/history
```

Returns a plain completed-task array.

With pagination:

```http
GET /api/history?page=1&perPage=15
```

Returns `data`, `meta`, and `links`. In paginated history responses, `meta.total` is the unfiltered completed-task total and `meta.filteredTotal` is the total after filters such as `search` and `priority`.

```json
{
  "meta": {
    "total": 310,
    "filteredTotal": 87,
    "page": 1,
    "perPage": 25,
    "lastPage": 4
  }
}
```

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
