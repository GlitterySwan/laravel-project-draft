ReserveIT — UIC Facility Booking System

ReserveIT is an automated, web based facility reservation and scheduling management system tailored for the   University of the Immaculate Conception (UIC)  . Built to eliminate schedule conflicts, automate approval workflows, enforce facility cleanup buffers, and streamline check in/check out processes.

Key Features

Role Based Access Control (RBAC): Distinct dashboards and capabilities for `super_admin`, `facility_admin`, and regular `user` roles.
Interactive Calendar & Timeline View: Visual scheduling interface preventing double bookings.
Automated & Flexible Rules: Dynamic booking advance windows, minimum cleanup buffer enforcement, and configurable auto approval policies.
Real time Active Booking Monitoring: Overtime check in and check out tracking for facility managers.
Document Attachments: Integrated verification workflows and consent letter submission support.

Tech Stack & Requirements

Backend Framework: Laravel 11/12
Frontend Framework: React 18 / Inertia.js (with Tailwind CSS & Lucide Icons)
Local Web Server: Laravel Herd (macOS / Windows)
Database: MySQL Server 8.0+
PHP: PHP 8.2 or higher
Node Environment: Node.js v18+ & NPM

Dependencies Installed

Backend (Composer Packages)
`laravel/framework`   Core backend engine
`inertiajs/inertia-laravel`   Server side adapter for React single page interface
`laravel/breeze` (or standard Auth stack)   Authentication scaffolding
`carbon/carbon`   Datetime manipulation for overlap checks and buffers

 Frontend (NPM Packages)
`@inertiajs/react` for Inertia client routing and state bindings
 `react` & `react-dom` for UI rendering engine
 `tailwindcss` for Styling framework
 `lucide-react` for UI System Icons

   
Installation Guide (Laravel Herd Setup)

Follow these steps to set up the project locally on Windows/macOS using   Laravel Herd  :

1. Clone the Repository

git clone [https://github.com/GlitterySwan/laravel-project-draft.git](https://github.com/GlitterySwan/laravel-project-draft.git)

cd laravel-project-draft

2. Install Dependencies
Install PHP dependencies via Composer and JavaScript dependencies via NPM:

composer install 
npm install 

3. Environment Configuration
Copy the default .env.example file to generate your .env configuration file:

cp .env.example .env

Open .env in your text editor and ensure your MySQL database details match Herd's configuration:

Code snippet
APP_NAME=ReserveIT
APP_URL=[http://facility-booking.test](http://facility-booking.test) 

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=facility_booking
DB_USERNAME=root
DB_PASSWORD=

4. Generate Application Key

php artisan key:generate

5. Run Database Migrations
Run Laravel's migration tool to build the exact MySQL database schema without needing an external .sql file:

php artisan migrate:fresh
6. Repair Directory Permissions (Windows/Herd Fix)
Run this to ensure Laravel Herd has full write permissions to compile Blade templates and manage sessions:

Windows PowerShell (Run as Administrator if prompted)
icacls "storage" /grant Everyone:(OI)(CI)F /T
icacls "bootstrap/cache" /grant Everyone:(OI)(CI)F /T

Clear any cached view locks
php artisan optimize:clear

7. Compile Frontend Assets
Run the Vite development server:

npm run dev

Visit http://facility-booking.test (or whatever domain Herd assigned to the folder) in your browser.

Seeding Test Accounts (Manual)

If you want to manually seed test users with specific roles (super_admin, facility_admin, user), open Laravel Tinker:

php artisan tinker

Execute the following PHP snippets inside Tinker:

1. Create Super Admin Account

\App\Models\User::create([
    'name' => 'Super Admin',
    'email' => 'superadmin@uic.edu.ph',
    'password' => \Illuminate\Support\Facades\Hash::make('Password123!'),
    'role' => 'super_admin',
    'email_verified_at' => now(),
]);

2. Create Facility Admin (Facilitator) Account

\App\Models\User::create([
    'name' => 'Facility Admin',
    'email' => 'facilitator@uic.edu.ph',
    'password' => \Illuminate\Support\Facades\Hash::make('Password123!'),
    'role' => 'facility_admin',
    'email_verified_at' => now(),
]);

3. Create Standard Student/User Account
PHP
\App\Models\User::create([
    'name' => 'John Doe',
    'email' => 'user@uic.edu.ph',
    'password' => \Illuminate\Support\Facades\Hash::make('Password123!'),
    'role' => 'user',
    'email_verified_at' => now(),
]);

Exit Tinker by typing exit. 


