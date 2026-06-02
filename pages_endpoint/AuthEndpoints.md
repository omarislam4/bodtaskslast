# Auth Endpoints

## `POST /api/auth/logout`

Revokes the current Sanctum access token for the authenticated user.

### Payload

None

### Success Response

Status: `200 OK`

```json
{
  "message": "Signed out successfully."
}
```

### Failure Response

Status: `401 Unauthorized`

```json
{
  "message": "Unauthenticated."
}
```

## `GET /api/auth/me`

Returns the authenticated user in the normalized frontend user shape.

### Payload

None

### Success Response

Status: `200 OK`

```json
{
  "id": "1",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "displayName": "Jane Doe",
  "role": "member",
  "avatar": "",
  "spaceIds": [],
  "phone": "",
  "countryCode": "+1",
  "shiftEnd": "",
  "shiftReminderSent": false,
  "createdAt": "2026-05-20T06:35:00.000000Z",
  "updatedAt": "2026-05-20T06:35:00.000000Z"
}
```

### Failure Response

Status: `401 Unauthorized`

```json
{
  "message": "Unauthenticated."
}
```

## Flow

1. The request is authenticated with `auth:sanctum`.
2. [MeController.php](C:/laragon/www/bod-app-api/app/Http/Controllers/Api/Auth/MeController.php) returns the current user through [UserResource.php](C:/laragon/www/bod-app-api/app/Http/Resources/UserResource.php).
3. [LogoutController.php](C:/laragon/www/bod-app-api/app/Http/Controllers/Api/Auth/LogoutController.php) deletes the current token and returns a confirmation message.

