# Users Endpoints

All endpoints in this file require `Authorization: Bearer <token>`.

## Access Model

- Admin can access all direct user endpoints.
- Member can access only their own direct user record through `/api/users` and `/api/users/{id}`.
- Team collaboration member lists should come from `GET /api/spaces/{id}/members`, not from the direct `/api/users` listing.

## `GET /api/users`

Returns users ordered by display name.

Access behavior:
- Admin receives the full users list.
- Member receives an array containing only their own user record.

### Payload

None

### Success Response

```json
[
  {
    "id": "1",
    "name": "Adam User",
    "email": "adam@example.com",
    "displayName": "Adam User",
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
]
```

## `GET /api/users/{id}`

Returns one normalized user object.

Access behavior:
- Admin can view any user.
- Member can view only their own user record.

### Payload

None

### Success Response

```json
{
  "id": "2",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "displayName": "Jane Doe",
  "role": "member",
  "avatar": "",
  "spaceIds": ["1"],
  "phone": "",
  "countryCode": "+1",
  "shiftEnd": "",
  "shiftReminderSent": false,
  "createdAt": "2026-05-20T06:35:00.000000Z",
  "updatedAt": "2026-05-20T06:35:00.000000Z"
}
```

### Failure Response

Status: `403 Forbidden`

```json
{
  "message": "This action is unauthorized."
}
```

## `POST /api/users`

Creates a new user profile. Admin-only.

### Payload

```json
{
  "displayName": "New Member",
  "email": "member@example.com",
  "role": "member",
  "avatar": "",
  "spaceIds": ["1"],
  "phone": "",
  "countryCode": "+1",
  "shiftEnd": "",
  "shiftReminderSent": false,
  "password": "secret123"
}
```

Notes:
- `password` is optional.
- If no password is provided, the backend generates a secure random password so the current `Members` page payload still works.

### Success Response

```json
{
  "message": "User created successfully.",
  "user": {
    "id": "2",
    "name": "New Member",
    "email": "member@example.com",
    "displayName": "New Member",
    "role": "member",
    "avatar": "",
    "spaceIds": ["1"],
    "phone": "",
    "countryCode": "+1",
    "shiftEnd": "",
    "shiftReminderSent": false,
    "createdAt": "2026-05-20T06:35:00.000000Z",
    "updatedAt": "2026-05-20T06:35:00.000000Z"
  }
}
```

### Failure Response

Status: `422 Unprocessable Entity`

```json
{
  "message": "The email field has already been taken.",
  "errors": {
    "email": [
      "The email field has already been taken."
    ]
  }
}
```

## `PATCH /api/users/{id}`

Updates a user profile.

Allowed behavior:
- Admin can update any user.
- Member can update only their own profile fields such as `displayName`, `phone`, `countryCode`, `shiftEnd`, and `shiftReminderSent`.
- Member can change their own password by sending `currentPassword` and `password`.
- Member cannot change privileged fields like `role`, `spaceIds`, `email`, or another user's password.

### Payload

```json
{
  "displayName": "Updated Name",
  "phone": "123456789",
  "countryCode": "+20",
  "shiftEnd": "18:30",
  "shiftReminderSent": false
}
```

Admin-only fields may also be included:

```json
{
  "role": "admin",
  "spaceIds": ["1", "2"]
}
```

Self password change payload:

```json
{
  "currentPassword": "old-password",
  "password": "new-password"
}
```

Notes:
- `currentPassword` is required when a user changes their own password.
- `password` must be at least 6 characters.
- Admins can set a user's `password` without sending `currentPassword`.

### Success Response

```json
{
  "message": "User updated successfully.",
  "user": {
    "id": "2",
    "name": "Updated Name",
    "email": "member@example.com",
    "displayName": "Updated Name",
    "role": "member",
    "avatar": "",
    "spaceIds": ["1"],
    "phone": "123456789",
    "countryCode": "+20",
    "shiftEnd": "18:30",
    "shiftReminderSent": false,
    "createdAt": "2026-05-20T06:35:00.000000Z",
    "updatedAt": "2026-05-20T06:40:00.000000Z"
  }
}
```

### Failure Response

Wrong current password:

Status: `422 Unprocessable Entity`

```json
{
  "message": "The current password is incorrect.",
  "errors": {
    "currentPassword": [
      "The current password is incorrect."
    ]
  }
}
```

Privileged fields from a member:

Status: `422 Unprocessable Entity`

```json
{
  "message": "The role field is prohibited.",
  "errors": {
    "role": [
      "The role field is prohibited."
    ],
    "spaceIds": [
      "The space ids field is prohibited."
    ]
  }
}
```

## `DELETE /api/users/{id}`

Deletes a user. Admin-only. Admins cannot delete themselves.

### Payload

None

### Success Response

```json
{
  "message": "User deleted successfully."
}
```

### Failure Response

Status: `403 Forbidden`

```json
{
  "message": "This action is unauthorized."
}
```

## Flow

1. All routes use `auth:sanctum`.
2. [UserPolicy.php](C:/laragon/www/bod-app-api/app/Policies/UserPolicy.php) enforces admin vs self-service access.
3. [StoreUserRequest.php](C:/laragon/www/bod-app-api/app/Http/Requests/User/StoreUserRequest.php) validates admin-created users.
4. [UpdateUserRequest.php](C:/laragon/www/bod-app-api/app/Http/Requests/User/UpdateUserRequest.php) validates partial updates, checks `currentPassword` for self password changes, and blocks non-admin changes to privileged fields.
5. [UserController.php](C:/laragon/www/bod-app-api/app/Http/Controllers/Api/UserController.php) returns normalized user payloads through [UserResource.php](C:/laragon/www/bod-app-api/app/Http/Resources/UserResource.php).
6. Shared collaboration user discovery should use the space-members endpoints instead of direct `/api/users` listing.

## Pagination

`GET /api/users` supports opt-in pagination with `page` and `perPage`. Without pagination parameters, it keeps returning the existing plain array response.

### Pagination Examples

Without pagination:

```http
GET /api/users
```

Returns a plain user array.

With pagination:

```http
GET /api/users?page=1&perPage=20
```

Returns `data`, `meta`, and `links`.
