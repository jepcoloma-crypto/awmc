# Wellness Clinic Management System

A modern web-based clinic management system built with **React + TypeScript** (frontend) and **Node.js + Supabase** (backend).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite 6, Tailwind CSS v4, React Suite, FullCalendar, Recharts |
| Backend | Node.js, Express, Supabase (PostgreSQL) |
| Auth | Custom JWT (migratable to Supabase Auth) |
| Mocks | MSW (Mock Service Worker) for development |

## Quick Start

### Frontend (with MSW mocks - no backend needed)

```bash
cd client
npm install
npm run dev
```

Opens at `http://localhost:5173`

**Demo credentials on login page:**
- `admin` / `admin123` — Administrator
- `doctor1` / `admin123` — Medical Practitioner
- `receptionist` / `admin123` — Front Desk Staff
- `cashier` / `admin123` — Cashier

### Backend (when ready to connect Supabase)

```bash
cd server
npm install
# Copy .env.example to .env and fill in Supabase credentials
npm run dev
```

## Project Structure

```
wellness-clinic/
├── client/                    # React + Vite frontend
│   ├── src/
│   │   ├── api/              # Axios client
│   │   ├── components/       # Shared components
│   │   ├── contexts/         # Auth, Theme contexts
│   │   ├── layouts/          # DashboardLayout, Sidebar, Header
│   │   ├── lib/              # Utils, permissions
│   │   ├── mocks/            # MSW handlers + mock data
│   │   ├── modules/          # Feature modules
│   │   │   ├── dashboard/
│   │   │   ├── patients/
│   │   │   ├── appointments/
│   │   │   ├── billing/
│   │   │   ├── doctors/
│   │   │   ├── users/
│   │   │   ├── reports/
│   │   │   ├── settings/
│   │   │   └── reminders/
│   │   ├── pages/            # LoginPage
│   │   └── types/            # TypeScript interfaces
│   └── public/
├── server/                    # Express + Supabase backend
│   └── src/
│       ├── routes/
│       ├── middleware/
│       └── supabase/
├── .env.example
└── README.md
```

## Features

- **Role-Based Access**: Admin, Medical Practitioner, Front Desk Staff, Cashier
- **Dashboard**: Charts (revenue, registrations, appointment status), stat cards, today's schedule
- **Patients**: CRUD, profile with procedures, search/filter
- **Appointments**: FullCalendar month/week/day views, CRUD with status tracking
- **Billing**: Invoice creation with line items, payment recording, outstanding tracking
- **Doctors**: CRUD with status toggle
- **Users**: CRUD with role assignment and doctor linking
- **Reports**: Appointment/Patient/Financial/Outstanding with CSV export
- **Settings**: Clinic info, appointment defaults
- **Reminders**: Manual/SMS/Email reminder creation
- **Dark/Light Theme**: Persisted toggle
