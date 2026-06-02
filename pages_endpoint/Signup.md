# Signup Page Endpoint

## Endpoint

`POST /api/auth/register`

Creates a new member account, stores the user profile in the local database, and immediately returns a Sanctum bearer token so the frontend can treat signup as an authenticated action.

## Payload

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "secret123",
  "device_name": "Chrome on Windows"
}
```

`device_name` is optional. If it is not sent, the API will use the request user agent or `web-client`.

## Success Response

Status: `201 Created`

```json
{
  "message": "Account created successfully.",
  "token": "1|plain-text-token",
  "token_type": "Bearer",
  "user": {
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
}
```

## Failure Response

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

Other validation failures follow the same shape for `name` or `password`.

## Flow

1. The frontend sends `name`, `email`, and `password` to `POST /api/auth/register`.
2. [RegisterUserRequest](C:/laragon/www/bod-app-api/app/Http/Requests/Auth/RegisterUserRequest.php) trims the name, lowercases the email, and validates the payload.
3. [RegisterController](C:/laragon/www/bod-app-api/app/Http/Controllers/Api/Auth/RegisterController.php) creates the user inside a database transaction.
4. The controller creates a Sanctum personal access token for the new user.
5. [UserResource](C:/laragon/www/bod-app-api/app/Http/Resources/UserResource.php) transforms the user into the frontend-friendly shape used across the docs pages.

## Files

- [routes/api.php](C:/laragon/www/bod-app-api/routes/api.php)
- [RegisterController.php](C:/laragon/www/bod-app-api/app/Http/Controllers/Api/Auth/RegisterController.php)
- [RegisterUserRequest.php](C:/laragon/www/bod-app-api/app/Http/Requests/Auth/RegisterUserRequest.php)
- [User.php](C:/laragon/www/bod-app-api/app/Models/User.php)
- [UserResource.php](C:/laragon/www/bod-app-api/app/Http/Resources/UserResource.php)
- [2026_05_20_062934_add_signup_profile_fields_to_users_table.php](C:/laragon/www/bod-app-api/database/migrations/2026_05_20_062934_add_signup_profile_fields_to_users_table.php)
- [RegisterUserTest.php](C:/laragon/www/bod-app-api/tests/Feature/Signup/RegisterUserTest.php)

