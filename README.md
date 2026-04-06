# Cafe Management System

![Vite](https://img.shields.io/badge/Vite-6.4-646CFF?logo=vite&logoColor=white)
![JavaScript](https://img.shields.io/badge/Frontend-JavaScript-F7DF1E?logo=javascript&logoColor=111)
![FastAPI](https://img.shields.io/badge/FastAPI-0.116-009688?logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-4169E1?logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-Schema-2D3748?logo=prisma&logoColor=white)
![WebSockets](https://img.shields.io/badge/Realtime-WebSockets-10B981?logo=socketdotio&logoColor=white)

Multi-branch restaurant POS, kitchen, reporting, and mobile self-ordering system built with a Vite frontend and FastAPI backend.

## Highlights

- Multi-branch management for products, floors, tables, sessions, users, and reports
- Role-based access for `admin`, `staff`, and `chef`
- POS order flow with floor-wise table ordering
- Kitchen display with live order progression
- Customer display screen
- Mobile QR self-ordering for dine-in tables
- Real-time order and payment updates on phone with WebSockets
- Branch-specific payment methods and UPI settings
- Reports dashboard with visual top-product performance charts

## Tech Stack

### Frontend

- ![Vite](https://img.shields.io/badge/Vite-6.4-646CFF?logo=vite&logoColor=white) Vite
- ![JavaScript](https://img.shields.io/badge/JavaScript-ESModules-F7DF1E?logo=javascript&logoColor=111) Vanilla JavaScript SPA
- ![QR](https://img.shields.io/badge/QR-Code-111827?logo=qrcode&logoColor=white) QR generation for self-order and UPI payment

### Backend

- ![FastAPI](https://img.shields.io/badge/FastAPI-0.116-009688?logo=fastapi&logoColor=white) FastAPI
- ![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-ORM-D71F00?logo=sqlalchemy&logoColor=white) SQLAlchemy ORM
- ![Pydantic](https://img.shields.io/badge/Pydantic-Validation-E92063?logo=pydantic&logoColor=white) Pydantic schemas/settings
- ![JWT](https://img.shields.io/badge/Auth-JWT-000000?logo=jsonwebtokens&logoColor=white) JWT auth
- ![WebSocket](https://img.shields.io/badge/WebSocket-Live-10B981?logo=socketdotio&logoColor=white) FastAPI WebSockets

### Database

- ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?logo=postgresql&logoColor=white) PostgreSQL
- ![Prisma](https://img.shields.io/badge/Prisma-Schema-2D3748?logo=prisma&logoColor=white) Prisma schema mirror

## Project Structure

```text
cms/
├─ backend/
│  ├─ app/
│  │  ├─ auth.py
│  │  ├─ main.py
│  │  ├─ models.py
│  │  ├─ run_seed.py
│  │  ├─ schemas.py
│  │  ├─ seed.py
│  │  └─ websocket.py
│  ├─ .env
│  ├─ .env.example
│  └─ requirements.txt
├─ frontend/
│  ├─ src/
│  │  ├─ components/
│  │  ├─ pages/
│  │  ├─ styles/
│  │  ├─ utils/
│  │  ├─ main.js
│  │  ├─ router.js
│  │  └─ store.js
│  ├─ .env
│  ├─ .env.example
│  └─ vite.config.js
├─ prisma/
│  └─ schema.prisma
├─ .env
├─ .env.example
├─ package.json
├─ prisma.config.ts
└─ setup-windows.ps1
```

## Roles

- `admin`
  Manages branches, users, products, floors, tables, payment methods, reports.
- `staff`
  Opens POS sessions, takes table orders, creates self-order QR codes, collects payments.
- `chef`
  Uses the kitchen display to prepare incoming orders.

## Key Features

### POS and Operations

- Branch-aware sessions and order flow
- Floor-wise table view for dine-in operations
- Send-to-kitchen workflow
- Cash, card, and UPI payment handling
- Branch-specific payment enable/disable controls
- Branch-specific UPI ID persistence after logout/login

### Kitchen and Displays

- Kitchen order queue with stage updates
- Order status progression:
  `Placed -> Preparing -> Ready`
- Customer display for active orders
- Customer display is locked from navigating back into staff pages

### Mobile Self-Ordering

- Staff generates a QR code for a specific table
- QR opens a mobile-only ordering page
- Customers can browse menu, add to cart, and place an order directly from phone
- Orders go straight to the kitchen
- Phone page gets live kitchen and payment updates through WebSockets
- Active self-order is saved on the phone, so refresh does not lose status
- Customers can use `Order Again` for a fresh order from the same table
- When the order is completed and the customer taps `Done`, a thank-you page appears with no navigation buttons

### Reports

- Dashboard summary
- Branch summary
- Top product performance shown as visual charts instead of plain rows

## Prerequisites

- ![Python](https://img.shields.io/badge/Python-3.12+-3776AB?logo=python&logoColor=white) Python 3.12+
- ![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs&logoColor=white) Node.js 18+
- ![npm](https://img.shields.io/badge/npm-10+-CB3837?logo=npm&logoColor=white) npm
- ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Installed-4169E1?logo=postgresql&logoColor=white) PostgreSQL running locally

Helpful extras:

- PowerShell 7
- pgAdmin or `psql`
- Git

## Environment Setup

### 1. Root `.env`

Used by Prisma.

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/odoo_pos_cafe"
```

### 2. `backend/.env`

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

### 3. `frontend/.env`

Used for self-order QR links and LAN phone access.

```env
VITE_PUBLIC_BASE=http://192.168.29.203:3000
VITE_API_BASE=http://192.168.29.203:8000
```

Replace `192.168.29.203` with your current LAN IP before testing on a phone.

## Installation

### 1. Clone the repository

```powershell
git clone https://github.com/aaryapatel9/cafe_management_system.git
cd cafe_management_system
```

### 2. Create the database

```powershell
createdb -U postgres odoo_pos_cafe
```

If `createdb` is unavailable, create the database manually in pgAdmin or `psql`.

### 3. Copy the example env files

```powershell
Copy-Item .env.example .env
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env
```

Then update the values to match your local database and LAN IP.

### 4. Install backend dependencies

```powershell
python -m pip install -r backend\requirements.txt
```

### 5. Install frontend dependencies

```powershell
cd frontend
npm install
cd ..
```

### 6. Install root dependencies for Prisma

```powershell
npm install
```

### 7. Push the schema

```powershell
npx prisma generate --schema prisma/schema.prisma
npx prisma db push --schema prisma/schema.prisma
```

### 8. Optional: seed sample data

```powershell
cd backend
python -m app.run_seed
cd ..
```

## Windows Quick Setup

You can also run:

```powershell
powershell -ExecutionPolicy Bypass -File .\setup-windows.ps1
```

This helps with:

- copying missing env files
- installing dependencies
- preparing Prisma setup

## Running the Project

Open two terminals.

### Terminal 1: backend

```powershell
python -m uvicorn app.main:app --reload --app-dir backend --host 0.0.0.0 --port 8000
```

### Terminal 2: frontend

```powershell
cd frontend
npm run dev
```

App URLs:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- LAN frontend: `http://<your-lan-ip>:3000`
- LAN backend: `http://<your-lan-ip>:8000`

## Demo Credentials

### Default admin

- `admin / admin123`

### Seeded sample users

Available after running `python -m app.run_seed`:

- Admin: `admin / admin123`
- Staff:
  `mainstaff / staff123`
  `downtownstaff / staff123`
  `airportstaff / staff123`
- Chef:
  `mainchef / chef123`
  `downtownchef / chef123`
  `airportchef / chef123`

## Mobile Self-Ordering Flow

1. Staff opens a POS session.
2. Staff goes to `Self Ordering`.
3. Tables are shown floor-wise for the current branch.
4. Staff generates a QR for a selected table.
5. Customer scans the QR using a phone.
6. The mobile-only menu opens using the LAN URL, not `localhost`.
7. Customer adds items and places the order.
8. The order is sent directly to the kitchen.
9. The phone tracks:
   - order status: `Placed -> Preparing -> Ready`
   - payment status separately
10. If the phone page refreshes, the active order is restored.
11. Customer can tap `Order Again` to place a fresh order.
12. Customer can tap `Done` to see a locked thank-you screen.

## Real-Time Updates

WebSockets power the live phone-tracking flow.

Live events include:

- self-order creation
- kitchen status updates
- item preparation updates
- payment confirmation updates

## Important Notes

- The frontend is a Vite SPA written in vanilla JavaScript, not React.
- Branch payment settings are stored in the backend per branch.
- UPI ID should persist after logout/login.
- Self-order QR links should use your LAN IP in `frontend/.env`.
- Both laptop and phone must be on the same Wi-Fi network for LAN testing.
- Prisma is used as a schema mirror; the live backend ORM is SQLAlchemy.

## Useful Commands

### Root

```powershell
npx prisma generate --schema prisma/schema.prisma
npx prisma db push --schema prisma/schema.prisma
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

### 1. `Failed to fetch`

Usually means the frontend cannot reach the backend.

Check:

- backend is running on port `8000`
- `frontend/.env` has the correct `VITE_API_BASE`
- frontend was restarted after env changes
- browser was hard refreshed

Fix:

```powershell
python -m uvicorn app.main:app --reload --app-dir backend --host 0.0.0.0 --port 8000
cd frontend
npm run dev
```

Then hard refresh the browser with `Ctrl + Shift + R`.

### 2. Login fails or the app breaks after login

Usually the backend was not restarted after route or schema changes.

Fix:

- restart backend
- restart frontend
- log in again

### 3. QR opens but the phone menu does not load

Usually caused by `localhost` or an old LAN IP in env files.

Fix:

- update `frontend/.env`
- set:
  - `VITE_PUBLIC_BASE=http://<LAN-IP>:3000`
  - `VITE_API_BASE=http://<LAN-IP>:8000`
- update `backend/.env` `CORS_ORIGINS`
- restart frontend and backend

### 4. Phone refresh loses self-order status

This should no longer happen in the current build.

If it still happens:

- confirm the same QR token URL is being reopened
- confirm browser local storage is not blocked
- make sure the backend is reachable from the phone

### 5. UPI ID is not saved after login/logout

This should now persist per branch in the backend.

If it does not:

- restart backend
- save the UPI ID again
- confirm you are editing the intended branch

### 6. Enabling/disabling a payment method affects all branches

That was an older issue. Current behavior is branch-specific.

If you still see it:

- verify the selected branch in the UI
- hard refresh the page
- confirm the backend is updated and restarted

### 7. Self-order page looks distorted

Usually stale frontend assets or an old cached build.

Fix:

- restart frontend
- hard refresh the phone browser
- open the QR link again

### 8. `prisma db push` fails

Check root `.env`:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/odoo_pos_cafe"
```

Also verify:

- PostgreSQL is running
- database exists
- credentials are correct

### 9. `Branch not found`

This happens when an invalid or stale branch id is used.

Fix:

- switch branch again
- log out and log back in
- verify the branch still exists

### 10. `Product ... does not belong to the session branch`

This means the session and product belong to different branches.

Fix:

- ensure the correct branch is selected
- open a fresh session in that branch
- avoid using stale tabs after switching branches

## Recommended First Run Checklist

1. Create PostgreSQL database.
2. Copy and configure all `.env` files.
3. Install backend dependencies.
4. Install frontend and root dependencies.
5. Run Prisma generate and db push.
6. Start backend.
7. Start frontend.
8. Log in as `admin`.
9. Optionally seed sample data.
10. Open a session and test POS flow.
11. Test QR self-ordering on a phone using the LAN IP.

## Deployment Note

This project can be deployed for demo or hobby use with services such as:

- frontend on Vercel
- backend on Render
- PostgreSQL on Neon

For a real restaurant production setup, use paid infrastructure and proper monitoring.

## License

No license file is currently included in this repository.
