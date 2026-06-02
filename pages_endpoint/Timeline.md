# Timeline Page Endpoints

## Status

This contract is now implemented in the Laravel API for the Timeline page.

## `GET /api/tasks/timeline`

Returns tasks with deadlines for the requested month.

This endpoint is the backend replacement for the current `useAllTasks()` + client-side deadline filtering behavior used by the timeline page.

### Payload

None

### Query Parameters

- `month`: `YYYY-MM`

Example:

`GET /api/tasks/timeline?month=2026-05`

### Success Response

```json
{
  "month": "2026-05",
  "tasks": [
    {
      "id": "7",
      "spaceId": "5",
      "title": "Launch landing page",
      "description": "Ship the new homepage copy and QA.",
      "status": "in-progress",
      "priority": "high",
      "type": "task",
      "tags": ["frontend"],
      "checklistItems": [],
      "subtasks": [],
      "timeEntries": [],
      "dependencies": [],
      "recurrence": null,
      "storyPoints": 5,
      "startDate": "2026-05-20T08:00:00.000Z",
      "watchers": ["1", "12"],
      "sprintId": null,
      "milestone": false,
      "assigneeIds": ["12"],
      "senderId": "sender-1",
      "deadline": "2026-05-27T17:00:00.000Z",
      "estimatedHours": 8,
      "progress": 40,
      "createdAt": "2026-05-20T08:00:00.000Z",
      "createdBy": "1",
      "completedAt": null,
      "activityLog": []
    }
  ]
}
```

## Notes

- The page only shows tasks that have a deadline and are not already `done`.
- The page also relies on the space contract from [Spaces.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/Spaces.md) to color each task by its space.
- Clicking a task opens the detail screen documented in [TaskDetail.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/TaskDetail.md).

