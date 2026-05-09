# Finance Credit Follow-Up Agent — Frontend

> React · Vite · Redux Toolkit · SCSS · Socket.io-client

---

## Table of Contents
1. [Quick Start](#quick-start)
2. [Environment Variables](#environment-variables)
3. [Architecture](#architecture)
4. [Feature Modules](#feature-modules)
5. [State Management](#state-management)
6. [Socket Integration](#socket-integration)
7. [Design System](#design-system)
8. [Screenshots](#screenshots)

---

## Quick Start

```bash
cd frontend
cp .env.example .env      # set VITE_API_URL and VITE_SOCKET_URL
npm install
npm run dev               # Vite dev server at http://localhost:5173
npm run build             # production build → dist/
```

Requires: **Node 18+**

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `VITE_API_URL` | Backend API base URL | `http://localhost:5000/api` |
| `VITE_SOCKET_URL` | Socket.io server URL | `http://localhost:5000` |

---

## Architecture

```
src/
├── app/
│   └── store.js               Redux store (RTK)
│
├── features/
│   ├── auth/                  Authentication module
│   │   ├── components/        Protected, AdminProtected guards
│   │   ├── hooks/             useAuth — login, register, logout
│   │   ├── pages/             Login, Register
│   │   ├── services/          auth.api.js (Axios calls)
│   │   ├── style/             auth.scss
│   │   └── authSlice.js       Auth state + async thunks
│   │
│   ├── invoices/              Invoice management module
│   │   ├── components/        InvoiceCard, InvoiceTable, InvoiceModal
│   │   ├── hooks/             useInvoices
│   │   ├── pages/             Invoices list, InvoiceDetails
│   │   ├── services/          invoice.api.js
│   │   └── invoicesSlice.js
│   │
│   ├── emails/                Email log module
│   │   ├── hooks/             useEmails
│   │   ├── pages/             EmailLogs, EmailSendModal
│   │   ├── services/          email.api.js
│   │   └── emailsSlice.js
│   │
│   └── notifications/         Real-time notifications module
│       ├── hooks/             useNotifications (Socket.io init here)
│       └── notificationsSlice.js
│
├── shared/
│   ├── api.js                 Axios instance (JWT interceptor, error handling)
│   ├── components/            Sidebar, Navbar, Loader, EmptyState
│   └── styles/                global.scss (design tokens, base styles)
│
├── pages/
│   └── Dashboard.jsx          Dashboard with stats + overdue list
│
├── App.jsx                    BrowserRouter + Toaster
├── app.routes.jsx             All route definitions
└── main.jsx                   React root + Redux Provider
```

---

## Feature Modules

### Auth
- JWT stored in `localStorage`; attached to every Axios request via interceptor.
- `useAuth` hook exposes `handleLogin`, `handleRegister`, `handleLogout`, `fetchMe`.
- `Protected` component redirects to `/login` if no token.
- `AdminProtected` redirects non-admin users to `/dashboard`.

### Invoices
- Full CRUD (admin only for write operations).
- CSV bulk import via `multipart/form-data`.
- Status filter tabs + search bar with pagination.
- `InvoiceTable` shows overdue days, follow-up stage badge, actions.
- `InvoiceDetails` shows all metadata + full email history for that invoice.

### Emails
- `EmailLogs` page: accordion-expand each log entry to see the full email body.
- `EmailSendModal`: select stage, toggle dry-run, preview AI-generated email, then send.
- Stage selector shows description of each tone level.

### Notifications
- `useNotifications` opens a single Socket.io connection per session.
- Incoming `notification` events are pushed into Redux and shown as a toast.
- Unread count badge in Sidebar and Navbar bell icon.
- Click a notification card to mark it as read.

---

## State Management

All async state uses **Redux Toolkit** `createAsyncThunk` + slice reducers:

```
dispatch(loginThunk(creds))
  → pending  → sets loading: true
  → fulfilled → stores user + token, shows toast
  → rejected  → stores error, shows toast
```

Real-time socket events bypass Redux thunks and dispatch `pushNotification` directly.

---

## Socket Integration

```
useNotifications (hook, runs once per authenticated session)
  │
  ├── io() connect to VITE_SOCKET_URL
  ├── emit("join", userId)              → join personal room
  ├── emit("subscribe_notifications")   → register on server
  │
  └── on("notification")               → dispatch pushNotification(data)
                                           + react-hot-toast popup
```

The socket instance is module-level (singleton), so multiple component mounts don't create duplicate connections.

---

## Design System

All tokens live in `src/shared/styles/global.scss` under `:root {}`.

| Token | Value | Usage |
|---|---|---|
| `--color-bg` | `#f9f9f8` | Page background |
| `--color-surface` | `#ffffff` | Cards, modals, sidebar |
| `--color-border` | `#e5e5e3` | All borders |
| `--color-text-primary` | `#1a1a19` | Headings, body |
| `--color-text-secondary` | `#6b6b68` | Labels, subtitles |
| `--color-accent` | `#3d7a5e` | CTA buttons, active nav |
| `--color-danger` | `#c0392b` | Overdue, error states |
| `--font-sans` | DM Sans | All UI text |
| `--font-mono` | DM Mono | Invoice numbers, codes |

**No gradients. No purple. No glassmorphism.** Soft shadows only (`--shadow-xs`, `--shadow-sm`).

Global utility classes: `.btn`, `.badge`, `.card`, `.form-input`, `.table-wrap`, `.modal`, `.page`.

---

## Screenshots

> _Add screenshots here after running the app._

| Page | Description |
|---|---|
| `/login` | Clean auth card, DM Sans typography |
| `/dashboard` | Stat cards + overdue list + notifications panel |
| `/invoices` | Filterable table with status badges, inline actions |
| `/invoices/:id` | Invoice metadata grid + full email history |
| `/emails` | Collapsible email log entries with AI-generated bodies |
