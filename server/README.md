# Sweety Server

Express API for Sweety, backed by PostgreSQL. The frontend is separate; these setup steps do not change its API URL or connection.

## Requirements

- Node.js and npm
- A PostgreSQL database, either local or hosted on Supabase

## Setup

From the `server` directory:

```powershell
npm.cmd install
Copy-Item .env.example .env
```

Edit `.env` and set the values for your environment:

| Variable | Purpose |
| --- | --- |
| `PORT` | API port; defaults to `5000`. |
| `DATABASE_URL` | PostgreSQL connection URI. |
| `JWT_SECRET` | Private signing key for authentication tokens. |
| `CLIENT_URL` | Existing frontend origin allowed by CORS. Keep this set to the frontend's current origin; it defaults to `http://localhost:3000`. |
| `APP_TIMEZONE` | Application timezone; defaults to `Asia/Kolkata`. |

Generate a strong JWT secret in PowerShell:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Supabase

1. In the Supabase dashboard, open **Connect** and copy the PostgreSQL URI for the **Session pooler**.
2. Put the complete URI in `DATABASE_URL` in `.env`. Use the database password, not a Supabase API key. Keep the URI private.
3. If entering a URI manually, URL-encode special characters in the password. Prefer copying the URI from Supabase to avoid formatting mistakes.

### Local PostgreSQL

Create a database (for example, `sweety`) and set `DATABASE_URL` to the local connection, such as:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/sweety
```

Replace `YOUR_PASSWORD` with the password for your PostgreSQL role. Local loopback connections use no SSL; non-local database hosts use SSL.

## Initialize and run

Create the application tables:

```powershell
npm.cmd run db:init
```

Start the API:

```powershell
npm.cmd start
```

For development with automatic restarts:

```powershell
npm.cmd run dev
```

The API listens on `http://localhost:5000` by default. Check that it is running at `http://localhost:5000/api/health`. Keep the frontend's existing API URL and set `CLIENT_URL` to its existing origin; this backend setup does not require frontend changes.

## Tests

```powershell
npm.cmd test
```

The PostgreSQL integration tests run only when `TEST_DATABASE_URL` is set in the process environment. Use a disposable test database for them.

## Security

Do not commit `.env` or share database URIs, database passwords, or `JWT_SECRET`. Use `.env.example` as a template and keep real credentials in your local `.env`.
