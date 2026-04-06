# POS Cafe CMS

![Vite](https://img.shields.io/badge/Vite-6.4-646CFF?logo=vite&logoColor=white)
![JavaScript](https://img.shields.io/badge/Frontend-JavaScript-F7DF1E?logo=javascript&logoColor=111)
![FastAPI](https://img.shields.io/badge/FastAPI-0.116-009688?logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-4169E1?logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-Schema-2D3748?logo=prisma&logoColor=white)
![WebSockets](https://img.shields.io/badge/Realtime-WebSockets-10B981?logo=socketdotio&logoColor=white)

Full-stack multi-branch restaurant POS and self-ordering system with:

- branch-wise products, tables, sessions, and users
- POS order flow with kitchen and payment handling
- mobile QR self-ordering for dine-in tables
- live kitchen/order/payment updates with WebSockets
- reports and dashboard views for sales and product performance

## Overview

This project is split into 3 parts:

- `frontend/`: Vite single-page app for admin, staff, chef, reports, self-order, and displays
- `backend/`: FastAPI API with authentication, branch-aware business logic, and WebSocket updates
- `prisma/`: Prisma schema mirror for the PostgreSQL database structure

The app supports 3 roles:

- `admin`: products, branches, floors, payment settings, users, reports
- `staff`: POS sessions, floor/table ordering, payments, self-order QR generation
- `chef`: kitchen display only

## Main Features

- Multi-branch management
- Branch-specific floors, tables, sessions, and reports
- Role-based login and access control
- Product catalog with categories and variants
- POS terminal flow:
  staff can open sessions, place orders, send to kitchen, and collect payments
- Kitchen display:
  chefs can move orders through `to_cook -> preparing -> completed`
- Customer display board
- Mobile self-ordering:
  generate a QR per table, open menu on phone, add to cart, place order
- Real-time self-order tracking on phone:
  separate order status path and payment status
- Branch-specific payment settings:
  UPI ID and payment enable/disable are saved per branch
- Reports dashboard:
  top products graph, branch summary, order history, exports

## Tech Stack

### Frontend

- ![Vite](https://img.shields.io/badge/Vite-6.4-646CFF?logo=vite&logoColor=white) Vite
- ![JavaScript](https://img.shields.io/badge/JavaScript-ESModules-F7DF1E?logo=javascript&logoColor=111) Vanilla JavaScript SPA
- ![QR Code](https://img.shields.io/badge/QR-qrcode-0F172A?logo=qrcode&logoColor=white) `qrcode`

### Backend

- ![FastAPI](https://img.shields.io/badge/FastAPI-0.116-009688?logo=fastapi&logoColor=white) FastAPI
- ![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0-D71F00?logo=sqlalchemy&logoColor=white) SQLAlchemy
- ![Pydantic](https://img.shields.io/badge/Pydantic-Settings-E92063?logo=pydantic&logoColor=white) Pydantic Settings
- ![JWT](https://img.shields.io/badge/Auth-JWT-000000?logo=jsonwebtokens&logoColor=white) python-jose
- ![WebSocket](https://img.shields.io/badge/Realtime-WebSocket-10B981?logo=socketdotio&logoColor=white) FastAPI WebSockets

### Database

- ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?logo=postgresql&logoColor=white) PostgreSQL
- ![Prisma](https://img.shields.io/badge/Prisma-Schema-2D3748?logo=prisma&logoColor=white) Prisma schema for DB structure

## Project Structure

```text
cms/
├─ backend/
│  ├─ app/
│  │  ├─ main.py
│  │  ├─ auth.py
│  │  ├─ models.py
│  │  ├─ schemas.py
│  │  ├─ websocket.py
│  │  ├─ seed.py
│  │  └─ run_seed.py
│  ├─ .env
│  └─ requirements.txt
├─ frontend/
│  ├─ src/
│  │  ├─ pages/
│  │  ├─ styles/
│  │  ├─ utils/
│  │  ├─ main.js
│  │  └─ store.js
│  ├─ .env
│  └─ vite.config.js
├─ prisma/
│  └─ schema.prisma
├─ .env
├─ package.json
└─ setup-windows.ps1
```

## Prerequisites

Install these before starting:

- ![Python](https://img.shields.io/badge/Python-3.12+-3776AB?logo=python&logoColor=white) Python 3.12+
- ![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs&logoColor=white) Node.js 18+
- ![npm](https://img.shields.io/badge/npm-10+-CB3837?logo=npm&logoColor=white) npm
- ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Installed-4169E1?logo=postgresql&logoColor=white) PostgreSQL running locally

Optional but useful:

- pgAdmin or `psql`
- PowerShell 7 on Windows

## Environment Files

### Root `.env`

Used for Prisma.

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/odoo_pos_cafe"
```

### `backend/.env`

Used by FastAPI.

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=odoo_pos_cafe
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
SECRET_KEY=change-me
ACCESS_TOKEN_EXPIRE_MINUTES=720
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://192.168.29.203:3000
```

### `frontend/.env`

Used for mobile self-order and LAN access.

```env
VITE_PUBLIC_BASE=http://192.168.29.203:3000
VITE_API_BASE=http://192.168.29.203:8000
```

Replace `192.168.29.203` with your machine's current LAN IP when testing on phones.

## Installation

## 1. Clone and open the project

```powershell
git clone <your-repo-url>
cd cms
```

## 2. Create the PostgreSQL database

```powershell
createdb -U postgres odoo_pos_cafe
```

If `createdb` is not available, create the database manually in pgAdmin or `psql`.

## 3. Copy env files

```powershell
Copy-Item .env.example .env
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env
```

Then update:

- root `.env` database URL
- `backend/.env` DB password and CORS origins if needed
- `frontend/.env` LAN IP values

## 4. Install backend dependencies

```powershell
python -m pip install -r backend\requirements.txt
```

## 5. Install frontend dependencies

```powershell
cd frontend
npm install
cd ..
```

## 6. Install root Prisma dependencies

```powershell
npm install
```

## 7. Push the database schema

```powershell
npx prisma generate
npx prisma db push
```

## 8. Optional: seed demo data

From the `backend` folder:

```powershell
cd backend
python -m app.run_seed
cd ..
```

This adds sample branches, products, staff, chefs, sessions, and orders.

## Windows One-Command Setup

If you are on Windows, you can also run:

```powershell
powershell -ExecutionPolicy Bypass -File .\setup-windows.ps1
```

This will:

- copy missing env files
- install backend dependencies
- install frontend dependencies
- install Prisma dependencies
- optionally run Prisma if env values are already configured

## Run the Project

Open 2 terminals.

### Terminal 1: backend

```powershell
python -m uvicorn app.main:app --reload --app-dir backend --host 0.0.0.0 --port 8000
```

### Terminal 2: frontend

```powershell
cd frontend
npm run dev
```

Frontend runs on:

- `http://localhost:3000`
- `http://<your-lan-ip>:3000`

Backend runs on:

- `http://localhost:8000`
- `http://<your-lan-ip>:8000`

## Demo Credentials

### Auto-created on backend startup

- `admin / admin123`

### Seeded sample accounts

Available after running `python -m app.run_seed`:

- Admin:
  `admin / admin123`
- Staff:
  `mainstaff / staff123`
  `downtownstaff / staff123`
  `airportstaff / staff123`
- Chef:
  `mainchef / chef123`
  `downtownchef / chef123`
  `airportchef / chef123`

## Self-Ordering on Mobile

This project supports QR-based self-ordering for dine-in tables.

### How it works

1. Staff opens a POS session
2. Staff goes to `Self Ordering`
3. Staff selects a table and generates a QR code
4. Customer scans the QR on a phone
5. The phone opens the mobile-only ordering page
6. Customer adds items and places the order
7. Order goes directly to the kitchen
8. The phone receives live updates for:
   - order status: `Placed -> Preparing -> Ready`
   - payment status: tracked separately

### Important LAN requirement

For phones to work:

- frontend must use `VITE_PUBLIC_BASE=http://<LAN-IP>:3000`
- backend must use `VITE_API_BASE=http://<LAN-IP>:8000`
- backend must allow the frontend origin in `CORS_ORIGINS`
- both phone and laptop must be on the same Wi-Fi network

## Real-Time Features

WebSockets are used for live self-order updates on the mobile page.

Current live updates include:

- self-order creation
- kitchen status changes
- item preparation toggle changes
- payment confirmation

## Important Project Notes

- The frontend is a Vite SPA written in vanilla JavaScript, not React.
- `frontend/src/utils/seed.js` is intentionally empty. Data comes from the backend.
- Branch payment settings are branch-specific and stored in the backend.
- UPI ID is saved per branch and should persist after logout/login.
- The Prisma schema reflects the PostgreSQL structure but the live backend ORM is SQLAlchemy.

## Useful Commands

### Root

```powershell
npx prisma generate
npx prisma db push
```

### Backend

```powershell
python -m uvicorn app.main:app --reload --app-dir backend --host 0.0.0.0 --port 8000
python -m compileall backend\app
```

### Frontend

```powershell
cd frontend
npm run dev
npm run build
```

### Seed data

```powershell
cd backend
python -m app.run_seed
```

## Common Errors and Fixes

## 1. `Failed to fetch`

Usually means the frontend cannot reach the backend.

Check:

- backend server is running on port `8000`
- `frontend/.env` has the correct `VITE_API_BASE`
- frontend was restarted after editing env files
- browser was hard refreshed

Fix:

```powershell
python -m uvicorn app.main:app --reload --app-dir backend --host 0.0.0.0 --port 8000
cd frontend
npm run dev
```

Then hard refresh with `Ctrl + Shift + R`.

## 2. Login works but the app immediately breaks after login

This can happen when the backend was not restarted after new routes or schema changes.

Fix:

- restart backend
- restart frontend
- log in again

## 3. QR code opens but the phone cannot load the menu

Usually the QR is still pointing to `localhost` or an old IP.

Fix:

- update `frontend/.env`
- set:
  - `VITE_PUBLIC_BASE=http://<LAN-IP>:3000`
  - `VITE_API_BASE=http://<LAN-IP>:8000`
- restart frontend

## 4. UPI save fails or payment settings do not persist

Check:

- backend is restarted after latest changes
- you are logged in as `admin`
- current branch is selected correctly

Fix:

- restart backend
- open Payment Methods again
- save the UPI ID once more

## 5. Payment methods change in all branches

That was an older issue. The current implementation stores payment settings per branch.

If you still see it:

- confirm you are on the correct branch
- hard refresh the browser
- verify backend is updated and restarted

## 6. `Branch not found`

This happens when a request is made with an invalid branch id.

Fix:

- switch branch again in the UI
- log out and log back in
- verify the branch still exists in Branch Management

## 7. `Product ... does not belong to the session branch`

This means the session and selected product are from different branches.

Fix:

- ensure you are ordering inside the correct branch
- open a session in that same branch
- do not reuse stale tabs after switching branches

## 8. Self-order page looks distorted

Most often caused by stale frontend assets or missing CSS after changes.

Fix:

- restart frontend
- hard refresh the browser
- open the QR link again

## 9. `prisma db push` fails to connect

Check your root `.env`:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/odoo_pos_cafe"
```

Also confirm PostgreSQL is running and the database exists.

## 10. Password hashing or login validation errors

Make sure backend dependencies were installed correctly:

```powershell
python -m pip install -r backend\requirements.txt
```

## Recommended First Run Checklist

1. Create PostgreSQL database
2. Configure `.env`, `backend/.env`, and `frontend/.env`
3. Install dependencies
4. Run `npx prisma db push`
5. Start backend
6. Start frontend
7. Log in as `admin`
8. Optionally seed demo data
9. Create/open a session
10. Test QR self-ordering on a phone

## License

No license file is currently included in this repository.
