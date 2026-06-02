# Settings Page Endpoints

## Status

This page now maps to implemented Laravel API contracts for profile, logout, and admin app settings.

- Profile and logout already map cleanly to existing auth and user endpoints.
- Webhook settings are now implemented through the admin app settings endpoint.
- Language and theme are local UI state only and do not need backend endpoints.

## Current User

### `GET /api/auth/me`

#### Payload

None

#### Success Response

See [AuthEndpoints.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/AuthEndpoints.md).

## Save Profile

### `PATCH /api/users/{id}`

Used by the settings page to update the authenticated user's profile and shift-reminder fields.

#### Payload

```json
{
  "displayName": "Jane Doe",
  "phone": "1012345678",
  "countryCode": "+20",
  "shiftEnd": "17:00",
  "shiftReminderSent": false
}
```

#### Success Response

```json
{
  "message": "User updated successfully.",
  "user": {
    "id": "12",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "displayName": "Jane Doe",
    "role": "member",
    "avatar": "",
    "spaceIds": ["5"],
    "phone": "1012345678",
    "countryCode": "+20",
    "shiftEnd": "17:00",
    "shiftReminderSent": false,
    "createdAt": "2026-05-20T06:35:00.000000Z",
    "updatedAt": "2026-05-20T09:10:00.000000Z"
  }
}
```

## Webhook Settings

### `GET /api/settings/app`

Returns the admin-managed reminder settings used by the page.

#### Payload

None

#### Success Response

```json
{
  "webhookUrl": "https://n8n.example.com/webhook/manual-send-notification",
  "reminderMinutes": 30
}
```

### `PATCH /api/settings/app`

Admin-only endpoint for saving the webhook URL and reminder window. Both read and update requests now use the same admin-only error message.

#### Payload

```json
{
  "webhookUrl": "https://n8n.example.com/webhook/manual-send-notification",
  "reminderMinutes": 30
}
```

#### Success Response

```json
{
  "message": "Settings updated successfully.",
  "settings": {
    "webhookUrl": "https://n8n.example.com/webhook/manual-send-notification",
    "reminderMinutes": 30
  }
}
```

#### Failure Response

```json
{
  "message": "Only admins can update application settings."
}
```

## Sign Out

### `POST /api/auth/logout`

#### Payload

None

#### Success Response

See [AuthEndpoints.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/AuthEndpoints.md).

## Notes

- The current frontend also mirrors some profile data into a Firebase `members` document, but the Laravel API contract should treat the normalized user resource as the source of truth.
- `fullPhone` can be derived by the frontend from `countryCode` and `phone`, so the API does not need a separate field unless another backend process depends on it.
- Theme and language are handled locally in the frontend and currently do not require API storage.


