# Members Page Endpoints

All endpoints in this file require `Authorization: Bearer <token>`.

## Existing User Endpoints

### `GET /api/users`

#### Payload

None

#### Success Response

See [Users.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/Users.md).

## Pagination

The member list endpoints support opt-in pagination with `page` and `perPage`. `GET /api/users` returns the shared paginated user list for admin member management, and `GET /api/members-directory` returns the accessible member directory. Without pagination parameters, they keep returning the existing plain array response.

### Pagination Examples

Without pagination:

```http
GET /api/members-directory
```

Returns a plain member array.

With pagination:

```http
GET /api/members-directory?page=1&perPage=20
```

Returns `data`, `meta`, and `links`.

### `POST /api/users`

#### Payload

```json
{
  "displayName": "New Member",
  "email": "member@example.com",
  "role": "member",
  "spaceIds": ["1"]
}
```

#### Success Response

See [Users.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/Users.md).

### `PATCH /api/users/{id}`

#### Payload

```json
{
  "displayName": "Updated Name",
  "phone": "123456789",
  "countryCode": "+20"
}
```

#### Success Response

See [Users.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/Users.md).

### `DELETE /api/users/{id}`

#### Payload

None

#### Success Response

See [Users.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/Users.md).

## Space Membership Endpoints

### `GET /api/spaces/{id}/members`

Returns the members assigned to the selected space.

#### Payload

None

#### Success Response

```json
[
  {
    "id": "1",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "displayName": "Jane Doe",
    "role": "admin",
    "avatar": "",
    "spaceIds": ["5"],
    "phone": "",
    "countryCode": "+1",
    "shiftEnd": "",
    "shiftReminderSent": false,
    "createdAt": "2026-05-20T06:35:00.000000Z",
    "updatedAt": "2026-05-20T06:35:00.000000Z"
  }
]
```

### `POST /api/spaces/{id}/members`

Adds a user to the selected space. Admin-only.

#### Payload

```json
{
  "userId": 12
}
```

#### Success Response

```json
{
  "message": "Member added to space successfully.",
  "space": {
    "id": "5",
    "name": "Operations",
    "description": "Main operations space",
    "color": "#3b82f6",
    "icon": "layers",
    "memberIds": ["1", "12"],
    "parentSpaceId": null,
    "createdAt": "2026-05-20T08:00:00.000000Z",
    "createdBy": "1"
  }
}
```

#### Failure Response

Status: `422 Unprocessable Entity`

```json
{
  "message": "The selected user id is invalid.",
  "errors": {
    "userId": [
      "The selected user id is invalid."
    ]
  }
}
```

### `DELETE /api/spaces/{id}/members/{userId}`

Removes a non-admin member from the selected space. Admin-only.

#### Payload

None

#### Success Response

```json
{
  "message": "Member removed from space successfully.",
  "space": {
    "id": "5",
    "name": "Operations",
    "description": "Main operations space",
    "color": "#3b82f6",
    "icon": "layers",
    "memberIds": ["1"],
    "parentSpaceId": null,
    "createdAt": "2026-05-20T08:00:00.000000Z",
    "createdBy": "1"
  }
}
```

#### Failure Response

Status: `422 Unprocessable Entity`

```json
{
  "message": "Admin members cannot be removed from a space using this endpoint."
}
```

## Notes

- Role changes still happen through `PATCH /api/users/{id}` with the `role` field.
- Space assignment is best handled through the dedicated space membership endpoints instead of manually updating both `users.spaceIds` and `spaces.memberIds` from the client.
- Only admins can add or remove members from a space.

## Flow

1. [UserController.php](C:/laragon/www/bod-app-api/app/Http/Controllers/Api/UserController.php) handles member CRUD and role changes.
2. [SpaceMemberController.php](C:/laragon/www/bod-app-api/app/Http/Controllers/Api/SpaceMemberController.php) handles assigning and removing users from spaces.
3. [SpaceMembershipService.php](C:/laragon/www/bod-app-api/app/Services/SpaceMembershipService.php) keeps the pivot table and the user-facing `spaceIds` data consistent.

