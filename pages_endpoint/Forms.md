# Forms Page Endpoints

## Status

This contract is now implemented in the Laravel API.

The internal forms system powers the authenticated `Forms` page, while public submission links are documented separately in [PublicForm.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/PublicForm.md).

## Form Shape

```json
{
  "id": "1",
  "title": "Weekly intake",
  "description": "Collect updates from the team.",
  "spaceId": "5",
  "fields": [
    {
      "id": "name",
      "type": "text",
      "label": "Name",
      "required": true,
      "options": []
    }
  ],
  "submissionCount": 3,
  "isPublic": true,
  "createdBy": "12",
  "createdAt": "2026-05-21T10:10:00.000Z"
}
```

## `GET /api/forms`

Returns visible forms for the authenticated user.

### Payload

None

### Query Parameters

- `spaceId`: when provided, returns only forms for that space
- omit `spaceId` to return global forms plus forms from spaces visible to the current user
- use `spaceId=null` to return only global forms

### Success Response

```json
[
  {
    "id": "1",
    "title": "Weekly intake",
    "description": "Collect updates from the team.",
    "spaceId": "5",
    "fields": [
      {
        "id": "name",
        "type": "text",
        "label": "Name",
        "required": true,
        "options": []
      }
    ],
    "submissionCount": 3,
    "isPublic": true,
    "createdBy": "12",
    "createdAt": "2026-05-21T10:10:00.000Z"
  }
]
```

## `POST /api/forms`

Creates a form.

### Payload

```json
{
  "title": "Weekly intake",
  "description": "Collect updates from the team.",
  "spaceId": 5,
  "fields": [
    {
      "id": "name",
      "type": "text",
      "label": "Name",
      "required": true,
      "options": []
    },
    {
      "id": "email",
      "type": "email",
      "label": "Email",
      "required": false,
      "options": []
    }
  ],
  "isPublic": true
}
```

### Success Response

```json
{
  "message": "Form created successfully.",
  "form": {
    "id": "1",
    "title": "Weekly intake",
    "description": "Collect updates from the team.",
    "spaceId": "5",
    "fields": [
      {
        "id": "name",
        "type": "text",
        "label": "Name",
        "required": true,
        "options": []
      }
    ],
    "submissionCount": 0,
    "isPublic": true,
    "createdBy": "12",
    "createdAt": "2026-05-21T10:10:00.000Z"
  }
}
```

## `PATCH /api/forms/{id}`

Updates a form created by the current user. Admins may update any form.

### Payload

```json
{
  "description": "Collect weekly updates.",
  "isPublic": true
}
```

### Success Response

```json
{
  "message": "Form updated successfully.",
  "form": {
    "id": "1",
    "description": "Collect weekly updates.",
    "isPublic": true
  }
}
```

### Failure Response

```json
{
  "message": "You can only manage forms you created."
}
```

## `DELETE /api/forms/{id}`

Deletes a form created by the current user. Admins may delete any form.

### Payload

None

### Success Response

```json
{
  "message": "Form deleted successfully."
}
```

## Notes

- `submissionCount` is incremented through the public submission endpoint, not by the internal forms page.
- Public viewing and submission are documented in [PublicForm.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/PublicForm.md).

## Pagination

`GET /api/forms` supports opt-in pagination with `page` and `perPage`. This also applies when filtering by `spaceId`. Without pagination parameters, it keeps returning the existing plain array response.

### Pagination Examples

Without pagination:

```http
GET /api/forms?spaceId=5
```

Returns a plain form array.

With pagination:

```http
GET /api/forms?spaceId=5&page=1&perPage=10
```

Returns `data`, `meta`, and `links`.
