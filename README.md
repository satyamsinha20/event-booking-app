# Event Booking & Ticketing App

Monorepo with:

- **backend/**: Node.js + Express + MongoDB (JWT in httpOnly cookies)
- **admin/**: React + Tailwind CSS v3 admin panel
- **mobile/**: React Native (Expo) user app

## Prereqs

- Node.js (LTS)
- MongoDB (local; e.g. via MongoDB Compass)

## Setup

Create a `.env` in `backend/` based on `backend/.env.example`, then:

```bash
npm install
npm run dev:backend
```

Backend runs on `http://localhost:4000`.

## Windows note (folder name has `&`)

On Windows, `npm run ...` can break when the project path contains `&` (CMD treats it as a command separator).

Two options:

- Use the included runner scripts:
  - `scripts\\dev-backend.cmd`
  - `scripts\\dev-admin.cmd`
  - `scripts\\dev-mobile.cmd`
- Or rename the folder (recommended) to remove `&` (e.g. `Event-Booking-Ticketing-App`) and re-open it in Cursor.

## Create an admin user

1. Register a user (mobile app login uses the same endpoint):

```bash
curl -X POST http://localhost:4000/api/users/register ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Admin\",\"email\":\"admin@example.com\",\"password\":\"admin123\"}"
```

2. In MongoDB Compass, update that user document and set `role` to `"admin"`.

## Run admin panel

```bash
npm run dev:admin
```

Admin runs on `http://localhost:5173` and uses cookie-based auth.

## Run mobile app (Expo)

```bash
npm run dev:mobile
```

- Android emulator uses `http://10.0.2.2:4000` for the API.
- Expo Web uses `http://localhost:4000`.

