# BOD App API

Backend API for the BOD workspace application, built with Laravel and Sanctum.

This project covers:
- authentication and user management
- spaces and members
- tasks, bugs, sprints, and dashboard data
- chat, notifications, and senders
- goals, forms, and public forms
- attendance, weekly reports, automations, and portfolio data
- Firebase export import into the Laravel relational schema

## Stack

- PHP 8.4+
- Laravel 12
- MySQL
- Laravel Sanctum

## Project Structure

- `app/Http/Controllers/Api`: API controllers
- `app/Http/Requests`: request validation and authorization
- `app/Http/Resources`: API response transformers
- `app/Models`: Eloquent models
- `routes/api.php`: API routes
- `database/migrations`: schema
- `database/seeders`: seeders, including Firebase import
- `docs/pages_endpoint`: endpoint and page contracts
- `docs/exports`: Firebase export sources used for import
- `docs/PROJECT_USER_FLOW.md`: end-user product flow
- `docs/PROJECT_DEVELOPER_ENDPOINT_FLOW.md`: developer and endpoint flow

## Installation

### 1. Clone the project

```bash
git clone <your-repository-url>
cd bod-app-api
```

### 2. Install dependencies

```bash
composer install
```

### 3. Create environment file

```bash
cp .env.example .env
```

If you are on Windows and `cp` is not available:

```powershell
Copy-Item .env.example .env
```

### 4. Configure environment

Update `.env` with your local database and app URL.

Minimum required values:

```env
APP_NAME=BOD
APP_ENV=local
APP_DEBUG=true
APP_URL=http://127.0.0.1:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=your_database_name
DB_USERNAME=your_database_user
DB_PASSWORD=your_database_password

SESSION_DRIVER=database
CACHE_STORE=database
QUEUE_CONNECTION=database
```

If you use Laragon, your local app URL may look like:

```env
APP_URL=https://kanaf.test
```

### 5. Generate app key

```bash
php artisan key:generate
```

### 6. Run migrations

```bash
php artisan migrate
```

## Seeding the Database

### Default project seed

This project uses a custom importer seeder:

- `database/seeders/FirebaseExportSeeder.php`

It reads:
- `docs/exports/firestore-export.json`

And imports the Firebase data into the Laravel tables.

### Important behavior of the importer

- Firebase random string IDs are not reused as primary keys
- Laravel integer IDs are created fresh
- old Firebase IDs are used only as temporary references during import
- relationships are rebuilt against the new Laravel IDs

### What gets imported

- users and members
- spaces and space memberships
- senders
- sprints
- tasks
- goals
- forms and form submissions
- chat channels and chat messages
- notifications
- app settings

### Imported user password

All imported users are seeded with this password:

```text
123456789
```

You should change this behavior before using the project in any non-local environment.

### Seed command

If the database is already migrated:

```bash
php artisan db:seed
```

If you want a clean rebuild:

```bash
php artisan migrate:fresh --seed
```

## Running the App

Start the Laravel development server:

```bash
php artisan serve
```

Default local URL:

```text
http://127.0.0.1:8000
```

If you use Laragon or a custom virtual host, use that host instead.

## Authentication

Authentication uses Laravel Sanctum.

### Main auth endpoints

- `POST /api/login`
- `POST /api/signup`
- `POST /api/logout`
- `GET /api/me`

Typical flow:
1. Sign up or log in
2. Receive a Sanctum token
3. Send `Authorization: Bearer <token>` on protected routes

## Access Model

Current intended access model:

- `admin`: full access to all data
- `member`: personal-only for direct profile/reporting data
- shared collaboration still happens through spaces and related resources

Direct user/profile rules:
- admin can access all user records
- member can access only their own direct user record

Collaborative areas still work by space membership:
- spaces
- tasks
- chat
- forms
- goals

## API Response Style

This API is configured to return JSON for Laravel-handled responses.

That includes:
- success responses
- validation errors
- unauthenticated responses
- authorization errors
- not found responses
- internal Laravel exceptions

## Core Product Flow

### End-user flow

Read the full guide here:
- [docs/PROJECT_USER_FLOW.md](docs/PROJECT_USER_FLOW.md)

High-level product journey:
1. User signs up or logs in
2. User lands on dashboard or member dashboard
3. User joins spaces and sees only the relevant collaborative data
4. User works with tasks, bugs, sprints, chat, notifications, and reports
5. Admin manages users, spaces, assignments, and system configuration

### Developer and endpoint flow

Read the full guide here:
- [docs/PROJECT_DEVELOPER_ENDPOINT_FLOW.md](docs/PROJECT_DEVELOPER_ENDPOINT_FLOW.md)

This explains:
- domain relationships
- endpoint groups
- page-to-endpoint mapping
- request/resource/controller flow
- import and data ownership behavior

## Main Endpoint Groups

Detailed endpoint docs live in:
- [docs/pages_endpoint/api-doc.md](docs/pages_endpoint/api-doc.md)

Feature docs:
- [Users.md](docs/pages_endpoint/Users.md)
- [MembersPage.md](docs/pages_endpoint/MembersPage.md)
- [Spaces.md](docs/pages_endpoint/Spaces.md)
- [SpaceDetail.md](docs/pages_endpoint/SpaceDetail.md)
- [Tasks.md](docs/pages_endpoint/Tasks.md)
- [TaskDetail.md](docs/pages_endpoint/TaskDetail.md)
- [MyTasks.md](docs/pages_endpoint/MyTasks.md)
- [Timeline.md](docs/pages_endpoint/Timeline.md)
- [Dashboard.md](docs/pages_endpoint/Dashboard.md)
- [Bugs.md](docs/pages_endpoint/Bugs.md)
- [Sprints.md](docs/pages_endpoint/Sprints.md)
- [Settings.md](docs/pages_endpoint/Settings.md)
- [Senders.md](docs/pages_endpoint/Senders.md)
- [Chat.md](docs/pages_endpoint/Chat.md)
- [Goals.md](docs/pages_endpoint/Goals.md)
- [Forms.md](docs/pages_endpoint/Forms.md)
- [PublicForm.md](docs/pages_endpoint/PublicForm.md)
- [Inbox.md](docs/pages_endpoint/Inbox.md)
- [History.md](docs/pages_endpoint/History.md)
- [Attendance.md](docs/pages_endpoint/Attendance.md)
- [WeeklyReport.md](docs/pages_endpoint/WeeklyReport.md)
- [Automations.md](docs/pages_endpoint/Automations.md)
- [Portfolio.md](docs/pages_endpoint/Portfolio.md)
- [not-found.md](docs/pages_endpoint/not-found.md)

## Main Data Relationships

### Users and spaces
- a user can belong to many spaces
- a space can have many members
- membership is stored in `space_user`
- users also cache `space_ids` as JSON for frontend compatibility

### Spaces and tasks
- each task belongs to one space
- members access task data through accessible spaces

### Sprints and tasks
- a sprint belongs to one space
- tasks may belong to one sprint
- sprint `task_ids` is refreshed after import and updates

### Goals and tasks
- a goal may belong to a space
- a goal can reference tasks through `linked_task_ids`

### Chat
- channels may be public or private
- private channels use `member_ids`
- messages belong to channels
- messages may include mentions and reply references

### Notifications
- notifications belong to users
- notifications may optionally link to a task or a space

## Common Developer Commands

### Run the server

```bash
php artisan serve
```

### Run migrations and seed

```bash
php artisan migrate:fresh --seed
```

### Run tests

```bash
php artisan test
```

### Format code

```bash
vendor/bin/pint
```

### List API routes

```bash
php artisan route:list --path=api
```

## Suggested Local Setup Order

1. install PHP dependencies with Composer
2. configure `.env`
3. create the MySQL database
4. run `php artisan key:generate`
5. run `php artisan migrate:fresh --seed`
6. run `php artisan serve`
7. log in with an imported user using password `123456789`

## Notes for Frontend Integration

### API base URL
- frontend apps should point to the Laravel API origin, for example `http://127.0.0.1:8000`
- if you use Vite on the React side, set:
  - `VITE_API_BASE_URL=http://127.0.0.1:8000`
  - `VITE_PROXY_API_TARGET=http://127.0.0.1:8000`
- remember to restart the frontend dev server after changing `.env`

### Required headers
- protected endpoints require Sanctum Bearer token auth
- send:
  - `Accept: application/json`
  - `Authorization: Bearer <token>` for protected routes
  - `Content-Type: application/json` for JSON request bodies
- if `Accept` is missing, you may still get JSON in this project, but the frontend should always send it explicitly

### Use documented field names exactly
- request payloads must use the API field names from `docs/pages_endpoint`
- do not assume Firebase field names will still be accepted
- example:
  - register expects `name`, not `displayName`
  - many update endpoints expect camelCase fields such as `spaceId`, `assigneeIds`, `linkedTaskIds`, `countryCode`, `shiftEnd`
- if a request returns `422 Unprocessable Content`, first check the payload keys against the request class and docs

### Data types matter
- IDs are usually returned to the frontend as strings in resources, even if database primary keys are integers
- when sending IDs back, send the format documented by the endpoint
- common expectations:
  - strings: `title`, `description`, `status`, `priority`, `email`, `phone`
  - arrays of strings: `assigneeIds`, `memberIds`, `taskIds`, `watchers`, `linkedTaskIds`, `spaceIds`, `tags`
  - booleans: `read`, `isPublic`, `billable`, `milestone`, `shiftReminderSent`
  - numbers: `progress`, `estimatedHours`, `storyPoints`, `targetValue`, `currentValue`, `submissionCount`

### Dates and timestamps
- frontend should send normal JSON-safe date values, usually ISO strings or values the endpoint docs describe
- backend resources usually return frontend-friendly date strings in camelCase fields such as:
  - `createdAt`
  - `deadline`
  - `startDate`
  - `endDate`
  - `completedAt`
- do not send Firebase `Timestamp` objects to the API
- always convert date objects before sending

### Null and empty values
- use `null` only where the endpoint contract allows nullable values
- examples of commonly nullable fields:
  - `deadline`
  - `startDate`
  - `endDate`
  - `spaceId` for global records where supported
  - `parentId` for top-level space data items
- avoid sending random empty structures just because Firebase used to allow them

### Arrays and relation updates
- JSON arrays like `assigneeIds`, `memberIds`, `taskIds`, and similar relation arrays are returned in the API shape expected by the docs
- some relations also have dedicated endpoints and should not be updated blindly through generic payloads
- examples:
  - space members: use `/api/spaces/{id}/members`
  - sprint tasks: use `/api/sprints/{id}/tasks`
  - task comments/reminders/checklist/subtasks/time entries/dependencies/tags/watchers: use their dedicated task detail endpoints when available

### Hidden and unavailable data
- imported Firebase IDs are not exposed as Laravel primary keys
- use current API `id` values from API responses, not legacy Firebase document IDs
- do not depend on hidden database fields such as raw passwords, tokens, pivot internals, or private columns not present in resources
- treat `app/Http/Resources` as the public response contract

### Access and visibility
- admin can access all direct user data and global management endpoints
- members have limited direct user/profile access and broader collaboration access through space membership
- frontend code should not assume that `GET /api/users` always returns the full user list for members
- for collaboration views, prefer the correct scoped endpoints such as space members or task-related data

### Debugging 422 and 403 responses
- `422` usually means one of these:
  - wrong field name
  - wrong data type
  - missing required field
  - invalid enum value
  - invalid related ID
- `403` usually means the authenticated user is not allowed to perform that action under the current access model
- when debugging, compare:
  - the page doc in `docs/pages_endpoint`
  - the matching `FormRequest`
  - the matching `Resource`
  - the actual payload sent by the frontend

### Chat realtime with Echo and Reverb
- chat realtime uses Laravel Reverb and private Echo channels
- protected broadcast auth endpoint:
  - `POST /api/broadcasting/auth`
- private chat channel name:
  - `chat.channels.{channelId}`
- Echo will subscribe to it as:
  - `private-chat.channels.{channelId}`
- use the same Sanctum bearer token that is used for normal protected API requests

Frontend `.env` values should match the API/Reverb server:

```env
VITE_REVERB_APP_KEY=local
VITE_REVERB_HOST=127.0.0.1
VITE_REVERB_PORT=8080
VITE_REVERB_SCHEME=http
```

If the frontend is separate from this Laravel app, configure Echo with the API base URL and the Axios instance that already sends `Authorization: Bearer <token>`:

```js
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import axios from './axios';

window.Pusher = Pusher;

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

export const echo = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: import.meta.env.VITE_REVERB_PORT ?? 80,
    wssPort: import.meta.env.VITE_REVERB_PORT ?? 443,
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
    enabledTransports: ['ws', 'wss'],
    authEndpoint: `${apiBaseUrl}/api/broadcasting/auth`,
    authorizer: (channel) => ({
        authorize: (socketId, callback) => {
            axios.post(`${apiBaseUrl}/api/broadcasting/auth`, {
                socket_id: socketId,
                channel_name: channel.name,
            })
                .then((response) => callback(false, response.data))
                .catch((error) => callback(true, error));
        },
    }),
});
```

Subscribe when the chat page or channel opens:

```js
const channel = echo.private(`chat.channels.${channelId}`);

channel
    .listen('.chat.message.created', ({ chatMessage }) => {
        upsertMessage(chatMessage);
    })
    .listen('.chat.message.updated', ({ chatMessage }) => {
        upsertMessage(chatMessage);
    })
    .listen('.chat.message.deleted', ({ chatMessage }) => {
        upsertMessage(chatMessage);
    })
    .listen('.chat.message.reaction_updated', ({ chatMessage }) => {
        upsertMessage(chatMessage);
    });
```

Leave the channel when the user switches channels or leaves chat:

```js
echo.leave(`chat.channels.${channelId}`);
```

Send, edit, delete, and react through the REST endpoints in [Chat.md](docs/pages_endpoint/Chat.md). Use the REST response to update the sender immediately, and use Echo events to update other open clients.

### Migration reminder
- some older frontend hooks may still need to be switched fully to these Laravel endpoints if they still read from Firebase directly
- when migrating a hook or page, verify all of these together:
  - endpoint path
  - payload keys
  - payload types
  - auth header
  - returned resource shape
  - null handling
  - relation IDs

## Troubleshooting

### HTML returned instead of JSON

Laravel-handled requests should return JSON. If you still see HTML, check:
- whether the error is happening before Laravel handles the request
- your web server or PHP runtime configuration

### Database seed problems

Check:
- `docs/exports/firestore-export.json` exists
- `.env` points to the correct database
- migrations ran successfully
- foreign key issues are not coming from stale manual data

### Login after import does not work

Make sure:
- the database was seeded successfully
- you are using an imported email
- the password is `123456789`

## License

This project is private/internal.
