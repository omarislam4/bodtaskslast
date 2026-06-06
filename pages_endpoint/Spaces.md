# Spaces Page Endpoint

All endpoints in this file require `Authorization: Bearer <token>`.

## `GET /api/spaces`

Returns the spaces visible to the authenticated user.

- Admin users receive all spaces, including sub-spaces.
- Non-admin users receive only spaces they belong to.

### Payload

None

### Success Response

```json
[
  {
    "id": "1",
    "name": "Operations",
    "description": "Main operations space",
    "color": "#3b82f6",
    "icon": "layers",
    "memberIds": ["1"],
    "parentSpaceId": null,
    "createdAt": "2026-05-20T08:00:00.000000Z",
    "createdBy": "1"
  }
]
```

## `POST /api/spaces`

Creates a space. Admin-only.

### Payload

```json
{
  "name": "Operations",
  "description": "Main operations space",
  "color": "#3b82f6",
  "icon": "layers"
}
```

### Success Response

```json
{
  "message": "Space created successfully.",
  "space": {
    "id": "1",
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

### Failure Response

Status: `422 Unprocessable Entity`

```json
{
  "message": "The name field is required.",
  "errors": {
    "name": [
      "The name field is required."
    ]
  }
}
```

## Flow

1. [SpaceController.php](C:/laragon/www/bod-app-api/app/Http/Controllers/Api/SpaceController.php) creates and lists spaces.
2. [SpacePolicy.php](C:/laragon/www/bod-app-api/app/Policies/SpacePolicy.php) decides who can create or view spaces.
3. [SpaceMembershipService.php](C:/laragon/www/bod-app-api/app/Services/SpaceMembershipService.php) keeps space membership and user `spaceIds` synchronized.
4. [SpaceResource.php](C:/laragon/www/bod-app-api/app/Http/Resources/SpaceResource.php) returns the frontend-friendly space shape.
5. [Spaces.tsx](C:/laragon/www/bod-app-api/docs/pages/Spaces.tsx) also shows task counts per space, so the frontend depends on the implemented shared task list contract in [Tasks.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/Tasks.md).

## Pagination

`GET /api/spaces` supports opt-in pagination with `page` and `perPage`. Without pagination parameters, it keeps returning the existing plain array response.

### Pagination Examples

Without pagination:

```http
GET /api/spaces
```

Returns a plain space array.

With pagination:

```http
GET /api/spaces?page=1&perPage=12
```

Returns `data`, `meta`, and `links`.

