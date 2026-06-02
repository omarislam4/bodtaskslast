# Public Form Endpoints

## Status

This contract is now implemented in the Laravel API.

The public form contract is separate from authenticated app pages so external users can open and submit a published form without a token.

## Public Form Shape

```json
{
  "id": "1",
  "title": "Weekly intake",
  "description": "Collect updates from the team.",
  "fields": [
    {
      "id": "name",
      "type": "text",
      "label": "Name",
      "required": true,
      "options": []
    }
  ],
  "isPublic": true
}
```

## `GET /api/public/forms/{id}`

Returns the public form definition.

### Payload

None

### Success Response

```json
{
  "id": "1",
  "title": "Weekly intake",
  "description": "Collect updates from the team.",
  "fields": [
    {
      "id": "name",
      "type": "text",
      "label": "Name",
      "required": true,
      "options": []
    }
  ],
  "isPublic": true
}
```

### Failure Response

```json
{
  "message": "Form not found."
}
```

## `POST /api/public/forms/{id}/submissions`

Validates and stores one public form submission.

### Payload

```json
{
  "values": {
    "name": "Jane Doe",
    "email": "jane@example.com"
  }
}
```

### Success Response

```json
{
  "message": "Form submitted successfully.",
  "submittedAt": "2026-05-21T10:15:00.000Z"
}
```

### Failure Response

```json
{
  "message": "The values.name field is required."
}
```

## Notes

- Required validation is generated dynamically from the stored field list.
- Successful public submissions increment the parent form's `submissionCount`.
