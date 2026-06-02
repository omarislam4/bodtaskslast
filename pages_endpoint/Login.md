# Login Page Endpoint

## Endpoint

`POST /api/auth/login`

Authenticates an existing user with email and password, then returns a Sanctum bearer token and the normalized user profile used across the frontend docs.

## Payload

```json
{
  "email": "jane@example.com",
  "password": "secret123",
  "device_name": "Chrome on Windows"
}
```

`device_name` is optional. If it is not provided, the API will use the request user agent or `web-client`.

## Success Response

Status: `200 OK`

```json
{
  "message": "Signed in successfully.",
  "token": "2|plain-text-token",
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

Invalid credentials:

Status: `401 Unauthorized`

```json
{
  "message": "Invalid email or password.",
  "code": "invalid-credential"
}
```

Validation errors:

Status: `422 Unprocessable Entity`

```json
{
  "message": "The email field is required.",
  "errors": {
    "email": [
      "The email field is required."
    ],
    "password": [
      "The password field is required."
    ]
  }
}
```

## Flow

1. The frontend sends `email` and `password` to `POST /api/auth/login`.
2. [LoginUserRequest](C:/laragon/www/bod-app-api/app/Http/Requests/Auth/LoginUserRequest.php) trims and lowercases the email, then validates the payload.
3. [LoginController.php](C:/laragon/www/bod-app-api/app/Http/Controllers/Api/Auth/LoginController.php) finds the user by email and checks the hashed password.
4. If credentials are valid, the controller issues a Sanctum token.
5. [UserResource.php](C:/laragon/www/bod-app-api/app/Http/Resources/UserResource.php) returns the normalized user shape expected by the frontend docs.

## Files

- [routes/api.php](C:/laragon/www/bod-app-api/routes/api.php)
- [LoginController.php](C:/laragon/www/bod-app-api/app/Http/Controllers/Api/Auth/LoginController.php)
- [LoginUserRequest.php](C:/laragon/www/bod-app-api/app/Http/Requests/Auth/LoginUserRequest.php)
- [UserResource.php](C:/laragon/www/bod-app-api/app/Http/Resources/UserResource.php)
- [LoginUserTest.php](C:/laragon/www/bod-app-api/tests/Feature/Login/LoginUserTest.php)

