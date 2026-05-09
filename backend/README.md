# Finance Credit Follow-Up Agent — Backend

> Node.js · Express · MongoDB · LangChain · Socket.io · Nodemailer

---

## Table of Contents
1. [Quick Start](#quick-start)
2. [Environment Variables](#environment-variables)
3. [Architecture](#architecture)
4. [AI Workflow](#ai-workflow)
5. [Prompt Engineering](#prompt-engineering)
6. [Cron Jobs](#cron-jobs)
7. [Socket Architecture](#socket-architecture)
8. [Security Mitigations](#security-mitigations)
9. [API Reference](#api-reference)

---

## Quick Start

```bash
cd backend
cp .env.example .env          # fill in your values
npm install
npm run dev                   # nodemon hot-reload
# or
npm start                     # production
```

Requires: **Node 18+**, **MongoDB 6+**

---

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `PORT` | Server port (default 5000) | No |
| `MONGO_URI` | MongoDB connection string | **Yes** |
| `JWT_SECRET` | ≥32-char random string | **Yes** |
| `JWT_EXPIRES_IN` | Token TTL (default `7d`) | No |
| `AI_PROVIDER` | `openai` or `gemini` | **Yes** |
| `OPENAI_API_KEY` | OpenAI API key | If OpenAI |
| `OPENAI_MODEL` | Model name (default `gpt-4o-mini`) | No |
| `GEMINI_API_KEY` | Google Gemini API key | If Gemini |
| `SMTP_HOST` | SMTP server hostname | **Yes** |
| `SMTP_PORT` | SMTP port (587 or 465) | **Yes** |
| `SMTP_USER` | SMTP username / email | **Yes** |
| `SMTP_PASS` | SMTP app password | **Yes** |
| `EMAIL_FROM` | Sender display name + email | **Yes** |
| `FRONTEND_URL` | React dev server URL (CORS) | **Yes** |
| `DRY_RUN` | `true` = simulate emails only | No |
| `PAYMENT_BASE_URL` | Base URL for payment links | No |

---

## Architecture

```
src/
├── config/         Database, Socket.io init, in-memory cache
├── controller/     Thin HTTP handlers — validate → call service → respond
├── middlewares/    JWT auth, RBAC, express-validator runner
├── model/          Mongoose schemas (User, Invoice, EmailLog, Notification)
├── routes/         Express routers with validation chains
├── services/       Business logic (AI, Email, Invoice sync, Cron)
├── socket/         Socket.io event registration
└── utils/          Logger, prompt templates, overdue calculator
```

**Request flow:**
```
Client → Rate Limiter → Helmet → CORS → JWT Auth → Role Check → Validator → Controller → Service → DB
```

---

## AI Workflow

1. Invoice is created or synced — `overdueDays` and `followUpStage` are computed.
2. Admin triggers **Send Email** (manual) or the **cron job** fires at 08:00.
3. `ai.service.js` constructs a two-part prompt (system + user) via `promptTemplates.js`.
4. LangChain invokes the configured LLM (OpenAI or Gemini).
5. The generated email body is passed to `email.service.js`.
6. Nodemailer sends (or dry-runs) the email and writes an `EmailLog` document.
7. A `Notification` is created and pushed via Socket.io.

### Stage Mapping

| Days Overdue | Stage | Tone |
|---|---|---|
| 1–7 | 1 | Warm reminder |
| 8–14 | 2 | Polite but firm |
| 15–21 | 3 | Formal notice |
| 22–30 | 4 | Stern final warning |
| 30+ | 5 | Escalation notice |

---

## Prompt Engineering

Each stage has a dedicated prompt in `utils/promptTemplates.js`:

- **System message** defines the AI's role and explicitly forbids following instructions in variable fields (prompt injection mitigation).
- **User message** injects only sanitised invoice context (client name, number, amount, dates, payment link).
- A `sanitize()` function strips angle brackets, curly braces, and role-prefix keywords before injection.
- All dynamic values are hard-capped at 200 characters.
- LLM temperature is set to `0.7` — professional but not robotic.

---

## Cron Jobs

Managed by `node-cron` in `services/cron.service.js`:

| Schedule | Job |
|---|---|
| `0 8 * * *` | Daily follow-up: sync overdue days, generate + send emails for all overdue invoices |
| `0 */6 * * *` | Overdue sync only — keeps the UI current without sending emails |

The daily job iterates overdue invoices, skips paid/cancelled ones, calls the AI service per invoice, logs the result, and emits socket events.

---

## Socket Architecture

```
Client                         Server (Socket.io)
  |-- connect ----------------> io.on('connection')
  |-- join(userId) -----------> socket.join('user_<id>')
  |-- watch_invoice(id) ------> socket.join('invoice_<id>')
  |
  |<-- notification ----------- getIO().to('user_<id>').emit(...)
  |<-- invoice_updated -------- io.emit('invoice_updated', ...)
  |<-- invoice_created -------- io.emit('invoice_created', ...)
```

---

## Security Mitigations

| Threat | Mitigation |
|---|---|
| XSS / header injection | `helmet` sets secure HTTP headers |
| NoSQL injection | `express-mongo-sanitize` strips `$` operators from body/query |
| Brute force login | Auth-specific rate limiter (20 req / 15 min) |
| General DoS | Global rate limiter (100 req / 15 min) |
| Prompt injection | System instruction boundary + `sanitize()` + 200-char cap on all LLM inputs |
| JWT forgery | HS256 with ≥32-char secret; tokens expire in 7 days |
| Privilege escalation | `requireRole()` middleware on all admin routes |
| API key exposure | Keys only in `.env` on the server — never returned to the client |
| Oversized payloads | `express.json({ limit: '1mb' })` |
| CSV injection | Rows parsed via `csv-parser`; invoice fields validated before DB insert |

---

## API Reference

### Auth
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Register a new user |
| POST | `/api/auth/login` | — | Login, get JWT |
| GET | `/api/auth/me` | User | Get current user |
| PATCH | `/api/auth/change-password` | User | Change password |

### Invoices
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/invoices` | User | List invoices (paginated) |
| GET | `/api/invoices/:id` | User | Get single invoice |
| POST | `/api/invoices` | Admin | Create invoice |
| PATCH | `/api/invoices/:id` | Admin | Update invoice |
| DELETE | `/api/invoices/:id` | Admin | Delete invoice |
| PATCH | `/api/invoices/:id/mark-paid` | Admin | Mark as paid |
| POST | `/api/invoices/upload-csv` | Admin | Bulk import CSV |
| GET | `/api/invoices/stats/dashboard` | User | Dashboard stats |

### Emails
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/emails/logs` | User | List email logs |
| GET | `/api/emails/logs/:id` | User | Single log detail |
| POST | `/api/emails/send/:invoiceId` | Admin | Send/dry-run email |
| POST | `/api/emails/preview/:invoiceId` | Admin | Preview AI email |

### AI
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/ai/generate` | Admin | Generate email body |
| GET | `/api/ai/provider` | User | Active AI provider info |

### Notifications
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/notifications` | User | List notifications |
| PATCH | `/api/notifications/read-all` | User | Mark all read |
| PATCH | `/api/notifications/:id/read` | User | Mark one read |
| DELETE | `/api/notifications/:id` | User | Delete notification |

---

## Google OAuth Setup

### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Click **Create Credentials → OAuth 2.0 Client ID**
3. Application type: **Web application**
4. Add **Authorised redirect URI**:
   - Development: `http://localhost:5000/api/auth/google/callback`
   - Production: `https://yourdomain.com/api/auth/google/callback`
5. Copy the **Client ID** and **Client Secret**

### 2. Add to .env

```env
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
SESSION_SECRET=any_random_32_char_string
```

### 3. OAuth Flow

```
Browser                     Backend                      Google
  |                            |                            |
  |-- GET /api/auth/google --> |                            |
  |                            |-- redirect to OAuth URL -> |
  |<------ redirect -------------------------<------------- |
  |------ GET (with code) ---> |                            |
  |                            |-- exchange code ---------->|
  |                            |<-- profile + tokens -------|
  |                            |-- upsert User in MongoDB   |
  |                            |-- sign JWT                 |
  |<-- redirect /oauth/callback#token=eyJ... -------------- |
  |                            |
  | (frontend reads fragment)  |
  | localStorage.set(token)    |
  |-- GET /api/auth/me ------> |   (with Bearer token)
  |<-- { user } -------------- |
  |-- navigate /dashboard      |
```

### 4. Account Linking

- If a user previously registered with email/password using the **same email address** as their Google account, their accounts are automatically linked on first Google sign-in.
- Google-only accounts have `provider: "google"` and no `password` field.
- Password login is blocked for Google-only accounts with a helpful error message.

### 5. Security Notes

| Concern | Mitigation |
|---|---|
| Token in URL | Passed via URL fragment (`#`) — never sent to any server |
| Fragment cleanup | `window.history.replaceState` removes it immediately after reading |
| Session exposure | Sessions expire after 10 minutes (OAuth round-trip only) |
| CSRF | OAuth state parameter handled by Passport internally |
| Account takeover | Google accounts are matched by `googleId` first, then email |
