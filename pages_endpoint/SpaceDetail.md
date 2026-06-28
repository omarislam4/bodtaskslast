# Space Detail Page Endpoints

All endpoints in this file require `Authorization: Bearer <token>`.

## `GET /api/spaces/{id}`

Returns the selected space in the normalized space shape.

### Payload

None

### Success Response

```json
{
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
```

## `PATCH /api/spaces/{id}`

Updates the selected space. Admin-only.

### Payload

```json
{
  "name": "Operations Updated",
  "description": "Updated description",
  "color": "#2563eb",
  "icon": "briefcase"
}
```

### Success Response

```json
{
  "message": "Space updated successfully.",
  "space": {
    "id": "5",
    "name": "Operations Updated",
    "description": "Updated description",
    "color": "#2563eb",
    "icon": "briefcase",
    "memberIds": ["1", "12"],
    "parentSpaceId": null,
    "createdAt": "2026-05-20T08:00:00.000000Z",
    "createdBy": "1"
  }
}
```

## `DELETE /api/spaces/{id}`

Deletes the current space. Admin-only.

### Payload

None

### Success Response

```json
{
  "message": "Space deleted successfully."
}
```

## `GET /api/spaces/{id}/subspaces`

Returns the sub-spaces that belong to the current space.

### Payload

None

### Success Response

```json
[
  {
    "id": "6",
    "name": "Design",
    "description": "Design sub-space",
    "color": "#10b981",
    "icon": "palette",
    "memberIds": [],
    "parentSpaceId": "5",
    "createdAt": "2026-05-20T08:30:00.000000Z",
    "createdBy": "1"
  }
]
```

## `POST /api/spaces/{id}/subspaces`

Creates a new sub-space under the current space. Admin-only.

### Payload

```json
{
  "name": "Design",
  "description": "Design sub-space",
  "color": "#10b981",
  "icon": "palette"
}
```

### Success Response

```json
{
  "message": "Sub-space created successfully.",
  "space": {
    "id": "6",
    "name": "Design",
    "description": "Design sub-space",
    "color": "#10b981",
    "icon": "palette",
    "memberIds": [],
    "parentSpaceId": "5",
    "createdAt": "2026-05-20T08:30:00.000000Z",
    "createdBy": "1"
  }
}
```

## `GET /api/spaces/{id}/members`

Returns the members assigned to the current space.

### Payload

None

### Success Response

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

## `POST /api/spaces/{id}/members`

Adds a user to the current space. Admin-only.

### Payload

```json
{
  "userId": 12
}
```

### Success Response

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

## `DELETE /api/spaces/{id}/members/{userId}`

Removes a non-admin member from the current space. Admin-only.

### Payload

None

### Success Response

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

## `GET /api/spaces/{id}/data-items`

Returns the folders and links stored for the current space.

`data-items` are the entries shown in the space `data` tab.

Each item is one of these types:

- `folder`: used to group other items
- `link`: used to store a URL with optional notes

### Payload

None

### Success Response

```json
[
  {
    "id": "5",
    "type": "link",
    "name": "Figma Board",
    "url": "https://example.com",
    "notes": "Design handoff",
    "parentId": null,
    "createdAt": "2026-05-20T09:00:00.000000Z",
    "createdBy": "1"
  }
]
```

## `POST /api/spaces/{id}/data-items`

Creates a folder or link for the current space. Allowed for members of the space and admins.

### Payload

```json
{
  "type": "link",
  "name": "Figma Board",
  "url": "https://example.com",
  "notes": "Design handoff",
  "parentId": 5
}
```

Field meaning:

- `type`: must be `folder` or `link`
- `name`: the visible item name
- `url`: used for `link` items; may be omitted for `folder`
- `notes`: optional extra description
- `parentId`: the ID of another space data item that will act as the parent folder

### Understanding `parentId`

`parentId` refers to another item from the same space data items list.

Rules:

- omit it or use `null` to create the item at the top level
- use a folder item's ID to create the new item inside that folder
- the parent item must belong to the same space
- the parent item must be a `folder`, not a `link`

Examples:

Create a top-level folder:

```json
{
  "type": "folder",
  "name": "Design Assets",
  "notes": "Main design files"
}
```

Create a link inside folder `5`:

```json
{
  "type": "link",
  "name": "Figma Board",
  "url": "https://example.com",
  "notes": "Latest mockups",
  "parentId": 5
}
```

If `type` is `folder`, `url` may be omitted.

### Success Response

```json
{
  "message": "Space data item created successfully.",
  "item": {
    "id": "9",
    "type": "link",
    "name": "Figma Board",
    "url": "https://example.com",
    "notes": "Design handoff",
    "parentId": "5",
    "createdAt": "2026-05-20T09:00:00.000000Z",
    "createdBy": "1"
  }
}
```

### Failure Response

Status: `422 Unprocessable Entity`

```json
{
  "message": "The given data was invalid.",
  "errors": {
    "parentId": [
      "The selected parent folder is invalid for this space."
    ]
  }
}
```

## `DELETE /api/spaces/{id}/data-items/{itemId}`

Deletes a space data item. Admin-only.

### Payload

None

### Success Response

```json
{
  "message": "Space data item deleted successfully."
}
```

## Space Attachments

Spaces now support direct file and link attachments separate from data items (folders and links).

Supported attachment types:
- `file` — any document: pdf, doc, docx, xls, xlsx, csv, txt, zip, rar
- `screenshot` — images: jpg, jpeg, png, gif, webp
- `video` — video files: mp4, mov, webm, avi, mkv
- `link` — external URL, no file upload needed

For `link`, send `url`. For all other types, send `file` using `multipart/form-data`. Max file size is 50 MB. Files are stored on S3 and served through CloudFront.

### `GET /api/spaces/{spaceId}/attachments`

Lists all attachments for a space. Admins and space members can call this.

#### Payload

None

#### Success Response

```json
[
  {
    "id": "1",
    "spaceId": "5",
    "type": "screenshot",
    "title": "Homepage design",
    "url": "https://ddfhe7ynoipuc.cloudfront.net/space-attachments/5/abc123.png",
    "fileName": "abc123.png",
    "originalName": "homepage.png",
    "mimeType": "image/png",
    "size": 204800,
    "uploadedBy": "3",
    "uploadedByName": "Ahmed",
    "meta": [],
    "createdAt": "2026-06-24T12:00:00.000Z"
  },
  {
    "id": "2",
    "spaceId": "5",
    "type": "link",
    "title": "Figma board",
    "url": "https://figma.com/file/abc",
    "fileName": null,
    "originalName": null,
    "mimeType": null,
    "size": null,
    "uploadedBy": "3",
    "uploadedByName": "Ahmed",
    "meta": [],
    "createdAt": "2026-06-24T12:05:00.000Z"
  }
]
```

### `POST /api/spaces/{spaceId}/attachments`

Adds one attachment to a space. Admins and space members can call this.

#### Link Payload

```json
{
  "type": "link",
  "title": "Figma board",
  "url": "https://figma.com/file/abc"
}
```

#### Multipart File Payload

```
POST /api/spaces/5/attachments
Content-Type: multipart/form-data

Fields:
- type: screenshot
- title: Homepage design (optional)
- file: uploaded file
```

#### Success Response 201

```json
{
  "message": "Attachment added successfully.",
  "attachment": {
    "id": "1",
    "spaceId": "5",
    "type": "screenshot",
    "title": "Homepage design",
    "url": "https://ddfhe7ynoipuc.cloudfront.net/space-attachments/5/abc123.png",
    "fileName": "abc123.png",
    "originalName": "homepage.png",
    "mimeType": "image/png",
    "size": 204800,
    "uploadedBy": "3",
    "uploadedByName": "Ahmed",
    "meta": [],
    "createdAt": "2026-06-24T12:00:00.000Z"
  }
}
```

#### Validation Errors

Missing file when type is not `link`:

```json
{
  "message": "The file field is required.",
  "errors": { "file": ["The file field is required."] }
}
```

Missing URL when type is `link`:

```json
{
  "message": "The url field is required.",
  "errors": { "url": ["The url field is required."] }
}
```

File too large (over 50 MB):

```json
{
  "message": "The file field must not be greater than 51200 kilobytes.",
  "errors": { "file": ["The file field must not be greater than 51200 kilobytes."] }
}
```

### `DELETE /api/spaces/{spaceId}/attachments/{attachmentId}`

Deletes one attachment. The uploaded file is also removed from S3. Admins only.

#### Payload

None

#### Success Response

```json
{
  "message": "Attachment deleted successfully."
}
```

## Covered Tabs

The implemented Laravel endpoints in this file currently cover:

- `overview`
- `members`
- `data`
- `subspaces`

The task-related tabs in `SpaceDetail.tsx` depend on the implemented shared task contracts:

- `tasks`
- `bugs`
- `kanban`
- `timeline`
- `calendar`
- `workload`
- `table`
- `gantt`

See:

- [Tasks.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/Tasks.md)
- [TaskDetail.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/TaskDetail.md)
- [Timeline.md](C:/laragon/www/bod-app-api/docs/pages_endpoint/Timeline.md)

The `chat`, `goals`, and `sprints` tabs are now backed by implemented shared endpoints. The goals tab uses `GET /api/goals?spaceId={spaceId}`, while chat and sprints use their own implemented page contracts.

## Pagination

Space detail collection endpoints support opt-in pagination with `page` and `perPage`. This includes `GET /api/spaces/{space}/subspaces`, `GET /api/spaces/{space}/members`, `GET /api/spaces/{space}/data-items`, and shared tab endpoints such as tasks, goals, forms, sprints, and chat lists filtered by `spaceId`. Without pagination parameters, they keep returning the existing plain array response.

### Pagination Examples

Without pagination:

```http
GET /api/spaces/5/members
```

Returns a plain member array.

With pagination:

```http
GET /api/spaces/5/members?page=1&perPage=20
```

Returns `data`, `meta`, and `links`.

Filtered shared tab example:

```http
GET /api/tasks?spaceId=5&page=1&perPage=15
```

## Flow

1. [SpaceController.php](C:/laragon/www/bod-app-api/app/Http/Controllers/Api/SpaceController.php) serves the base space and sub-space endpoints.
2. [SpaceMemberController.php](C:/laragon/www/bod-app-api/app/Http/Controllers/Api/SpaceMemberController.php) handles space membership changes used by the members tab.
3. [SpaceDataItemController.php](C:/laragon/www/bod-app-api/app/Http/Controllers/Api/SpaceDataItemController.php) handles folders and links for the space data tab.
4. [StoreSubspaceRequest.php](C:/laragon/www/bod-app-api/app/Http/Requests/Space/StoreSubspaceRequest.php) and [StoreSpaceDataItemRequest.php](C:/laragon/www/bod-app-api/app/Http/Requests/Space/StoreSpaceDataItemRequest.php) validate nested create actions.
5. [SpaceDataItemResource.php](C:/laragon/www/bod-app-api/app/Http/Resources/SpaceDataItemResource.php) returns the resource list in the same shape the docs hooks expect.
6. [SpaceDetail.tsx](C:/laragon/www/bod-app-api/docs/pages/SpaceDetail.tsx) also depends on the implemented shared task contracts for task creation, task listing, task navigation, bugs, kanban, timeline, calendar, table, gantt, and workload views.



