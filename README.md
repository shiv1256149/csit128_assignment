# Veyra Technologies — Company Profile Web Application

CSIT128 _Introduction to Web Technology_ — Assignment 2.
A full-stack company-profile web application for the fictional cloud provider
**Veyra Technologies**: a static front end (HTML/CSS/JS + Tailwind utilities),
an Express + MySQL backend (via Knex migrations/seeds), JWT auth for public
users, a server-rendered admin panel, and a simulated checkout for products
and services.

## Stack

- **Frontend:** HTML, CSS (hand-built `styles.css` + Tailwind utilities layered on top), vanilla JS
- **Backend:** Node.js / Express
- **Database:** MySQL 8, via [Knex.js](https://knexjs.org/) (query builder + migrations + seeds)
- **Auth:** JWT (httpOnly cookie) for public register/login; server-side sessions for the admin panel
- **Admin panel:** server-rendered EJS views, CSRF-protected forms
- **Tests:** Jest + Supertest (integration tests against a real MySQL test schema)
- **CI:** GitHub Actions (runs on `dev` and `main`)
- **Containers:** Docker Compose (MySQL + the app)

## Project structure

```
.
├── server.js                 # Express app: static site + /api + /admin
├── knexfile.js                # DB connection config (dev/test/production)
├── src/
│   ├── db.js                  # shared knex instance
│   ├── middleware/             # auth (JWT), adminAuth (session), csrf
│   ├── routes/                 # api.js, auth.js, admin.js
│   └── utils/validators.js     # shared name/email/password/rating checks
├── migrations/                 # knex migrations (12 tables)
├── seeds/                      # seed data (from data/*.json) + admin bootstrap
├── views/admin/                # EJS admin panel views
├── public/                     # static front end served by Express
│   ├── *.html                  # index, about, services, products, team,
│   │                            feedback, contact, news, register, login
│   ├── css/styles.css          # hand-built stylesheet
│   ├── css/tailwind.css        # generated, utilities-only (no preflight)
│   └── js/                     # main.js, data-loader.js, validation.js,
│                                 account.js, auth-nav.js, contact-form.js
├── tests/                      # Jest + Supertest integration tests
├── docker/                      # entrypoint.sh, seed-if-empty.js
├── Dockerfile / docker-compose.yml
└── .github/workflows/ci.yml
```

## Environment variables

Copy `.env.example` to `.env` and fill in real values:

```bash
cp .env.example .env
```

`JWT_SECRET`, `SESSION_SECRET` and the `DB_*` vars are required - the app
checks for them at startup and refuses to start with a clear error if any
are missing, rather than starting in a half-broken state (a real, blank
secret used to crash the process on the first login/register request).

| Variable | Purpose |
| --- | --- |
| `PORT` | HTTP port (default 3010) |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | MySQL connection |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | public user auth tokens |
| `SESSION_SECRET` | admin panel sessions |
| `COOKIE_SECURE` | set to `true` only if served over HTTPS (reverse proxy doing TLS). Leave `false` for plain HTTP/local/docker-compose — a `Secure` cookie is silently dropped over HTTP and locks out every login. |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | bootstrapped by the seed script into the first admin account |
| `CORS_ORIGIN` | only set if the frontend is hosted on a different origin than this API |

## Running locally (without Docker)

Requires Node.js 18+ and a MySQL 8 server.

```bash
npm install
npm run migrate     # create tables
npm run seed        # load company.json/comments.json data + bootstrap admin
npm run build:css   # build Tailwind utilities (one-off; `npm run watch:css` to rebuild on change)
npm run dev          # nodemon server.js
```

Visit <http://localhost:3010>. Admin panel: <http://localhost:3010/admin/login>
(credentials from `ADMIN_EMAIL` / `ADMIN_PASSWORD`).

## Running with Docker Compose

This starts MySQL and the app (which serves both the API and the static
frontend) together:

```bash
docker compose up --build
```

On first boot the container runs migrations, then seeds only if the `users`
table is empty — so re-running `docker compose up` after the admin has made
changes through the panel won't wipe them. Visit <http://localhost:3010>.

Set the variables in `.env` before running, or pass `--env-file`.

## Tests

Tests run against a **separate** `<DB_NAME>_test` schema (see `knexfile.js`),
so they never touch your dev data. The DB user needs `CREATE`/`ALL` rights on
that schema, e.g.:

```sql
CREATE DATABASE veyra_test;
GRANT ALL PRIVILEGES ON veyra_test.* TO 'veyra'@'%';
```

Then:

```bash
npm test
```

`globalSetup` rolls back, re-migrates, and re-seeds the test schema before
every run, so the suite is deterministic regardless of prior runs.

## Linting

```bash
npm run lint
```

## Logging

Every request is logged two ways (skipped in `NODE_ENV=test`):

- console (dev-formatted, colorized) - visible with `docker compose logs -f app`
- `logs/access.log` (combined/Apache format) - persisted via the `app_logs` volume in docker-compose

## CI

`.github/workflows/ci.yml` runs on every push/PR to `dev` and `main`: spins up
a `mysql:8.0` service container, creates the test schema, installs deps,
lints, builds the CSS, and runs the test suite.

## API endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/company` | Company profile, history, stats, offices |
| GET | `/api/timeline` | Five-year milestone timeline |
| GET | `/api/services` | Active services |
| GET | `/api/products` | Active products |
| GET | `/api/awards` | Awards and certifications |
| GET | `/api/testimonials` | Active customer testimonials |
| GET | `/api/team` | Active team members |
| GET | `/api/comments` | Approved visitor comments |
| POST | `/api/comments` | Submit a comment (validated, rate-limited) |
| POST | `/api/auth/register` | Create an account (JWT cookie) |
| POST | `/api/auth/login` | Log in (JWT cookie) |
| POST | `/api/auth/logout` | Clear the auth cookie |
| GET | `/api/auth/me` | Current authenticated user |

## Admin panel

`/admin/login` → session-authenticated, CSRF-protected CRUD for products,
services, team members, feedback moderation, and user role management.
Everything editable there is reflected live on the public site (same MySQL
tables, no separate content store).
