# Expense Intelligence Platform

A full-stack personal expense tracker with a Python REST API and a React dashboard. Users can create an account, record and manage expenses, and review spending by category and month.

> **Project status:** This repository contains a FastAPI backend, a Vite/React frontend and automated test configuration. It uses SQLite by default for local development; PostgreSQL is not configured in the current starter.

## Features

- Email/password signup and login.
- Password hashing with bcrypt and JWT-based sessions.
- Create, list, update and delete expenses.
- Associate expense records with the authenticated user.
- Summarize spending by category.
- Summarize spending by month.
- Visualize spending summaries in the React dashboard.
- Backend tests with pytest and end-to-end browser tests with Playwright.

## Architecture

```text
React + TypeScript + Vite
          |
          | HTTP / JSON
          v
FastAPI REST API
  |-- Authentication (JWT)
  |-- Expense CRUD
  |-- Category and monthly summaries
          |
          v
SQLAlchemy ORM
          |
          v
SQLite (local default)
```

The frontend is configured to use the backend API during local development. The backend creates database tables from the SQLAlchemy models when the application starts.

## Tech stack

| Area | Technology |
|---|---|
| Backend | Python, FastAPI |
| ORM / database | SQLAlchemy, SQLite |
| Authentication | JWT, bcrypt |
| Frontend | React 19, TypeScript, Vite |
| Charts | Recharts |
| API tests | pytest, FastAPI TestClient |
| Browser tests | Playwright |

## Run locally (Windows PowerShell)

**Prerequisites:** Python, Node.js and npm.

### 1. Start the backend

From the repository root:

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Open `.env` and replace `JWT_SECRET` with a long random value. The default `DATABASE_URL` uses a local SQLite database.

Start the API:

```powershell
uvicorn app.main:app --reload --port 8000
```

- API base URL: [http://localhost:8000](http://localhost:8000)
- Interactive API documentation: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health check: [http://localhost:8000/health](http://localhost:8000/health)

Keep this terminal open.

### 2. Start the frontend

Open a second PowerShell window and run:

```powershell
cd C:\path\to\Expense-Intelligence-Platform\frontend
npm install
npm run dev
```

Open the local URL printed by Vite (normally [http://localhost:5173](http://localhost:5173)).

### 3. Run tests

Backend tests:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
pytest
```

End-to-end tests (from the repository root, with the backend virtual environment available):

```powershell
npm install
npx playwright install chromium
npm run test:e2e
```

## Environment variables

The backend reads `backend/.env`:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | SQLAlchemy database connection; defaults to SQLite |
| `JWT_SECRET` | Secret used to sign JWTs; replace the development value |

Never commit a real production secret.

## Repository layout

```text
backend/
  app/
    routers/       # Authentication and expense endpoints
    models.py      # SQLAlchemy models
    schemas.py     # Request / response schemas
    database.py    # Database engine and session
  tests/           # API tests
frontend/
  src/
    components/    # Dashboard charts and navigation
    context/       # Authentication state
    pages/          # Login, signup and dashboard
docs/              # Project documentation and screenshots
e2e/               # Playwright end-to-end tests
```

## API overview

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | API health check |
| POST | `/api/auth/signup` | Create an account |
| POST | `/api/auth/login` | Authenticate |
| GET | `/api/expenses` | List the current user's expenses |
| POST | `/api/expenses` | Create an expense |
| PATCH | `/api/expenses/{expense_id}` | Update an owned expense |
| DELETE | `/api/expenses/{expense_id}` | Delete an owned expense |
| GET | `/api/expenses/summary/by-category` | Category totals |
| GET | `/api/expenses/summary/by-month` | Monthly totals |

## Security notes

- Set a strong, unique `JWT_SECRET` outside development.
- Configure restrictive CORS origins before production deployment; the current backend allows all origins.
- Use HTTPS and a production database with backups for real user data.
- This project is a portfolio/demo application, not a financial service.

## Attribution and license

This repository adapts **[expense-tracker](https://github.com/doudoumi14/expense-tracker)**. The upstream MIT license and copyright notice naming **Adem Brouri** are retained in [LICENSE](LICENSE).

**Portfolio maintainer:** [Vishesh Malhotra](https://github.com/visheshmalhotraTHECODER).

The upstream repository is the source of the starter implementation. Retain its copyright and license notices when redistributing this adaptation.
