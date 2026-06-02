# Automations Page Endpoints

## Status

This contract is now implemented in the Laravel API.

## Automation Shape

```json
{
  "id": "9",
  "name": "Notify when done",
  "triggerType": "status_changes",
  "triggerValue": "done",
  "conditionType": null,
  "conditionValue": null,
  "actionType": "send_notification",
  "actionValue": "Task completed!",
  "enabled": true,
  "runCount": 0,
  "createdBy": "12",
  "createdAt": "2026-05-21T14:00:00.000Z",
  "lastRunAt": null
}
```

## `GET /api/automations`

Lists automations created by the current user. Admins may see all automations.

### Payload

None

### Success Response

```json
[
  {
    "id": "9",
    "name": "Notify when done",
    "enabled": true
  }
]
```

## `POST /api/automations`

Creates a new automation rule.

### Payload

```json
{
  "name": "Notify when done",
  "triggerType": "status_changes",
  "triggerValue": "done",
  "actionType": "send_notification",
  "actionValue": "Task completed!"
}
```

### Success Response

```json
{
  "message": "Automation created successfully.",
  "automation": {
    "id": "9",
    "name": "Notify when done"
  }
}
```

## `PATCH /api/automations/{id}`

Updates an automation created by the current user. Admins may update any automation.

### Payload

```json
{
  "enabled": false
}
```

### Success Response

```json
{
  "message": "Automation updated successfully.",
  "automation": {
    "id": "9",
    "enabled": false
  }
}
```

## `DELETE /api/automations/{id}`

Deletes an automation created by the current user. Admins may delete any automation.

### Payload

None

### Success Response

```json
{
  "message": "Automation deleted successfully."
}
```
