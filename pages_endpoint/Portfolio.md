# Portfolio Page Endpoints

## Status

This contract is now implemented in the Laravel API.

## `GET /api/portfolio`

Returns top-level visible spaces with health and progress summaries.

### Payload

None

### Success Response

```json
{
  "summary": {
    "onTrack": 3,
    "atRisk": 1,
    "offTrack": 0,
    "projectCount": 4
  },
  "projects": [
    {
      "id": "5",
      "name": "Operations",
      "description": "Main operations space",
      "color": "#3b82f6",
      "healthStatus": "on_track",
      "totalTasks": 18,
      "completedTasks": 11,
      "completionPercent": 61,
      "overdueTasks": 1,
      "memberCount": 4,
      "members": [
        {
          "id": "12",
          "displayName": "Jane Doe",
          "email": "jane@example.com"
        }
      ]
    }
  ]
}
```

## Notes

- This page is an aggregate over visible top-level spaces and their tasks.
- It complements the shared `Spaces`, `Tasks`, and `Members` contracts.
