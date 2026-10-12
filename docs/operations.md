# ReserveIT Operations

This document covers local setup, environment configuration, routine maintenance, deployment-oriented checks, troubleshooting, and known implementation risks.

## Prerequisites

- PHP 8.2 or newer
- Composer
- Node.js 18 or newer and npm
- MySQL 8 or the configured Laravel test database
- Laravel Herd on Windows or macOS, or another PHP web server

## Local Setup with Herd

From the project root:

```powershell
composer install
npm install
Copy-Item .env.example .env
php artisan key:generate
php artisan migrate
npm run dev
```

Configure `.env` with environment-specific values. Use placeholders in shared documentation and never commit real credentials:

```dotenv
APP_NAME=ReserveIT
APP_URL=https://<YOUR_HERD_DOMAIN>

DB_CONNECTION=mysql
DB_HOST=<YOUR_DB_HOST>
DB_PORT=3306
DB_DATABASE=<YOUR_DB_NAME>
DB_USERNAME=<YOUR_DB_USERNAME>
DB_PASSWORD=<YOUR_DB_PASSWORD>

QUEUE_CONNECTION=database
MAIL_MAILER=<YOUR_MAIL_DRIVER>
```

The actual Herd domain, database username, password, mail credentials, application key, OAuth secrets, and API keys belong only in the local environment or a secret manager.

On Windows, if Laravel cannot write compiled views or cache files, verify permissions for `storage` and `bootstrap/cache`, then clear cached state:

```powershell
icacls "storage" /grant Everyone:(OI)(CI)F /T
icacls "bootstrap/cache" /grant Everyone:(OI)(CI)F /T
php artisan optimize:clear
```

## Development Processes

For a complete development stack, the Composer `dev` script starts Laravel, the queue listener, log streaming, and Vite concurrently:

```powershell
composer dev
```

For separate processes:

```powershell
php artisan serve
php artisan queue:listen --tries=1 --timeout=0
npm run dev
```

Build production/static assets with:

```powershell
npm run build
```

## Database Operations

Useful commands:

```powershell
php artisan migrate:status
php artisan migrate
php artisan migrate:rollback
php artisan db:seed
```

`migrate:fresh` destroys and recreates all tables and should be limited to disposable local/test databases:

```powershell
php artisan migrate:fresh --seed
```

Before a deployment:

1. Back up the database.
2. Review pending migrations.
3. Confirm environment variables and storage permissions.
4. Run migrations in a maintenance window when necessary.
5. Clear and rebuild application caches.
6. Verify login, booking creation, approval, notifications, and file downloads.

## Account Provisioning

New admin-created accounts receive a generated temporary password and are marked `must_change_password`. Do not place real credentials in documentation, source control, tickets, or chat. Provide a temporary credential through an approved secure channel and require the user to change it at first login.

For local-only Tinker testing, use a locally generated value represented here by a placeholder:

```php
$user = \App\Models\User::create([
    'name' => 'Local Test User',
    'email' => 'local-user@example.test',
    'password' => \Illuminate\Support\Facades\Hash::make('<TEMPORARY_PASSWORD>'),
    'role' => 'user',
    'email_verified_at' => now(),
]);
```

## Routine Maintenance

```powershell
php artisan optimize:clear
php artisan route:list
php artisan config:show app
php artisan test
npm run build
```

Monitor:

- Laravel application logs in `storage/logs`;
- failed queue jobs and the queue worker;
- database growth from notifications, activity logs, and bookings;
- local consent-file storage;
- public facility-image storage;
- scheduled commands, including unapproved-booking purge behavior.

## Queue and Notification Operations

The default queue configuration uses the database driver. If queued work is enabled in the deployed environment:

```powershell
php artisan queue:work --tries=3
php artisan queue:failed
php artisan queue:retry all
```

Notifications displayed by the current UI are database-backed and refreshed through Inertia polling. Broadcasting configuration exists, but the current booking event is not a `ShouldBroadcast` event, so do not assume WebSocket delivery is active.

## Testing

Run the application test suite with:

```powershell
php artisan test
```

Important coverage areas to maintain:

- authentication, verification, password reset, and forced password changes;
- role and facility-assignment authorization;
- booking validation and cleanup-buffer conflict rules;
- approval, decline, cancellation, and edit state transitions;
- check-in/out and overtime JSON responses;
- notification sharing and read/clear actions;
- settings persistence;
- consent-file authorization and download behavior.

The existing suite includes framework authentication/profile tests and facility-assignment coverage. It should be expanded before relying on the booking and operations workflows in production.

## Troubleshooting

### Frontend assets do not update

Run `npm install`, confirm Vite is running, check `APP_URL`/TLS detection, and clear Laravel caches with `php artisan optimize:clear`.

### Database tables are missing

Check `.env`, verify the selected connection, run `php artisan migrate:status`, and apply migrations. Do not use `migrate:fresh` against a database containing data you need to preserve.

### Queue work is not processed

Confirm `QUEUE_CONNECTION`, ensure the jobs table exists, and start a worker. Inspect failed jobs and `storage/logs`.

### Consent files cannot be downloaded

Confirm the file exists on the local disk, the booking has consent metadata, the requester is authenticated, and the facility-admin assignment is correct.

### Login redirects unexpectedly

Check email verification, `is_active`, and `must_change_password`. Temporary-password accounts are intentionally redirected to the forced password-change page.

## Known Implementation Risks

1. **Settings contract mismatch:** the settings controller accepts fields such as cleanup buffer, advance days, duration, consent requirement, and auto-approval scope, but the inspected schema/model only fully define the older settings. Align migrations, `SystemSetting::$fillable`, casts, controller validation, and UI before relying on those values.
2. **Auto-purge must be verified:** the schema contains `auto_purge_unapproved_days`, and a purge command exists in the current working tree, but deployment should verify command scheduling and behavior.
3. **Server/client rule mismatch:** capacity, three-day consent lead time, opening hours, blackout dates, and manpower behavior are not all enforced in the booking controller. Important rules need server-side enforcement.
4. **Activity-log mismatch:** the model/table use `performed_by`, while approval code has attempted `user_id` and `notes`. Normalize the contract and add tests.
5. **Unreachable middleware registration:** `bootstrap/app.php` contains a second application return after the active application configuration. Middleware registration after the first return is unreachable; consolidate it before deployment.
6. **Duplicate approval endpoints:** direct booking approval and facilitator approval have different authorization/notification behavior. Consolidate or explicitly secure both paths.
7. **Missing route risk:** some older frontend links, such as the receipt action, may reference routes absent from `routes/web.php`. Verify routes before enabling those controls.
8. **Soft-delete test expectations:** user deletion is implemented with `SoftDeletes`; tests and operational expectations should assert the intended deletion semantics.

## Extension Checklist

When adding a feature:

1. Add a migration for persistent data.
2. Update model relationships, casts, and mass-assignment definitions.
3. Enforce authorization in middleware/policies, not only in React.
4. Validate on the server even if the form validates in React.
5. Return Inertia props for pages and redirects/flash data for mutations.
6. Use named routes for new frontend requests.
7. Add focused feature tests for permissions and state transitions.
8. Update the relevant document in `docs/` and the README table of contents.
