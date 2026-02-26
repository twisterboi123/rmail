# Rmail

A simple, Gmail-like email interface for a small private group (max 50 users). Connects to external mail servers via IMAP (read) and SMTP (send).

---

## Tech Stack

| Layer          | Technology                          |
| -------------- | ----------------------------------- |
| Backend        | Node.js · Express                   |
| Database       | PostgreSQL                          |
| Authentication | JWT (bcrypt password hashing)       |
| Email Read     | IMAP (via `imap` + `mailparser`)    |
| Email Send     | SMTP (via `nodemailer`)             |
| Frontend       | React 18 · Vite                     |
| Styling        | Custom CSS (no UI framework needed) |

---

## Folder Structure

```
/server          Express API backend
  /src
    /db          Database pool & init script
    /middleware  Auth middleware
    /routes      API routes (auth, users, emails)
    /services    IMAP & SMTP service wrappers
/client          React + Vite frontend
  /src
    /components  Shared UI components
    /context     Auth context
    /pages       Login, Inbox, EmailView, Compose, Settings, Admin
```

---

## Prerequisites

- **Node.js** >= 18
- **PostgreSQL** >= 14
- An external mail server with IMAP/SMTP access (e.g. your hosting provider, Fastmail, etc.)

---

## Setup

### 1. Clone & install dependencies

```bash
# From the project root
cd server && npm install
cd ../client && npm install
```

### 2. Configure the backend

```bash
cd server
cp .env.example .env
```

Edit `server/.env` with your values:

| Variable             | Description                              |
| -------------------- | ---------------------------------------- |
| `PORT`               | Server port (default `5000`)             |
| `DB_HOST`            | PostgreSQL host                          |
| `DB_PORT`            | PostgreSQL port (default `5432`)         |
| `DB_NAME`            | Database name                            |
| `DB_USER`            | Database user                            |
| `DB_PASSWORD`        | Database password                        |
| `JWT_SECRET`         | Strong random string for signing tokens  |
| `JWT_EXPIRES_IN`     | Token lifetime (e.g. `24h`)              |
| `ADMIN_EMAIL`        | Initial admin account email              |
| `ADMIN_PASSWORD`     | Initial admin account password           |
| `DEFAULT_IMAP_HOST`  | Fallback IMAP host                       |
| `DEFAULT_IMAP_PORT`  | Fallback IMAP port (default `993`)       |
| `DEFAULT_SMTP_HOST`  | Fallback SMTP host                       |
| `DEFAULT_SMTP_PORT`  | Fallback SMTP port (default `465`)       |

### 3. Create the database

```bash
# In psql or your preferred tool
CREATE DATABASE rmail;
```

### 4. Initialise tables & admin account

```bash
cd server
npm run db:init
```

This creates the `users` and `spam_flags` tables and seeds the admin account defined in `.env`.

### 5. Start the app

**Development** (two terminals):

```bash
# Terminal 1 – backend
cd server
npm run dev

# Terminal 2 – frontend (proxies /api to backend)
cd client
npm run dev
```

Open **http://localhost:5173** in your browser.

**Production build:**

```bash
cd client
npm run build        # outputs to client/dist

# Serve client/dist with your preferred static server
# and run the backend:
cd ../server
NODE_ENV=production npm start
```

---

## Usage

1. **Login** with the admin credentials you configured in `.env`.
2. Go to **Settings** and enter your IMAP/SMTP server details and mail account credentials.
3. Return to **Inbox** to fetch your emails.
4. Use **Compose** to send new emails via SMTP.
5. Use the **Admin** panel to create accounts for other users (up to 50).
6. Each user configures their own mail server credentials in **Settings**.

---

## API Endpoints

| Method | Path                            | Auth     | Description               |
| ------ | ------------------------------- | -------- | ------------------------- |
| POST   | `/api/auth/login`               | -        | Login, returns JWT        |
| GET    | `/api/auth/me`                  | Bearer   | Current user info         |
| GET    | `/api/emails/inbox?limit=30`    | Bearer   | Fetch inbox via IMAP      |
| GET    | `/api/emails/:uid`              | Bearer   | Fetch single email        |
| POST   | `/api/emails/send`              | Bearer   | Send email via SMTP       |
| POST   | `/api/emails/:uid/spam`         | Bearer   | Toggle spam flag          |
| GET    | `/api/users`                    | Admin    | List all users            |
| POST   | `/api/users`                    | Admin    | Create a new user         |
| PUT    | `/api/users/:id/mail-settings`  | Owner/Admin | Update mail settings   |
| DELETE | `/api/users/:id`                | Admin    | Delete a user             |
| GET    | `/api/health`                   | -        | Health check              |

---

## Deploy to Render (Step-by-Step)

### Prerequisites

- A **GitHub** (or GitLab) account with your Rmail code pushed to a repository.
- A free **Render** account at [render.com](https://render.com).

---

### Step 1 — Push your code to GitHub

```bash
cd "c:\Users\runec\OneDrive\Documenten\RMAIL.ink"
git init
git add .
git commit -m "Initial commit – Rmail"
```

Go to **github.com → New repository** → name it `rmail` → create it, then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/rmail.git
git branch -M main
git push -u origin main
```

---

### Step 2 — Create a PostgreSQL database on Render

1. Log in to [dashboard.render.com](https://dashboard.render.com).
2. Click **New +** → **PostgreSQL**.
3. Fill in:
   - **Name:** `rmail-db`
   - **Database:** `rmail`
   - **User:** `rmail`
   - **Plan:** Free
4. Click **Create Database**.
5. Once created, copy the **External Database URL** (starts with `postgres://…`). You'll need it in Step 3.

---

### Step 3 — Create a Web Service on Render

1. Click **New +** → **Web Service**.
2. Connect your GitHub repo (`rmail`).
3. Configure:

| Field              | Value                                                                        |
| ------------------ | ---------------------------------------------------------------------------- |
| **Name**           | `rmail`                                                                      |
| **Runtime**        | Node                                                                         |
| **Build Command**  | `cd client && npm install --include=dev && npm run build && cd ../server && npm install` |
| **Start Command**  | `cd server && node src/index.js`                                             |
| **Plan**           | Free                                                                         |

4. Scroll down to **Environment Variables** and add:

| Key                  | Value                                              |
| -------------------- | -------------------------------------------------- |
| `NODE_ENV`           | `production`                                       |
| `DATABASE_URL`       | *(paste the External Database URL from Step 2)*    |
| `JWT_SECRET`         | *(any long random string, e.g. `openssl rand -hex 32`)* |
| `JWT_EXPIRES_IN`     | `24h`                                              |
| `ADMIN_EMAIL`        | `admin@yourdomain.com`                             |
| `ADMIN_PASSWORD`     | *(pick a strong password)*                         |
| `DEFAULT_IMAP_HOST`  | *(your mail server, e.g. `imap.yourdomain.com`)*   |
| `DEFAULT_IMAP_PORT`  | `993`                                              |
| `DEFAULT_SMTP_HOST`  | *(your mail server, e.g. `smtp.yourdomain.com`)*   |
| `DEFAULT_SMTP_PORT`  | `465`                                              |

5. Click **Create Web Service**.

Render will now build and deploy your app. Wait for the deploy to finish (2-3 minutes).

---

### Step 4 — Initialise the database

Once the deploy is live, go to your service's **Shell** tab (or use the Render CLI):

1. In the Render dashboard, open your **rmail** web service.
2. Click the **Shell** tab at the top.
3. Run:

```bash
cd server && node src/db/init.js
```

This creates the database tables and your admin account.

---

### Step 5 — Open your app

Your app is live at:

```
https://rmail-XXXX.onrender.com
```

(The exact URL is shown at the top of your Render service page.)

1. Log in with your `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
2. Go to **Settings** → enter your IMAP/SMTP mail credentials.
3. Go to **Inbox** — your emails should load.
4. Use **Admin** to create accounts for your team.

---

### Alternative: One-Click Blueprint Deploy

The repo includes a `render.yaml` blueprint. You can also deploy by:

1. Go to [dashboard.render.com/blueprints](https://dashboard.render.com/blueprints)
2. Click **New Blueprint Instance**
3. Connect your GitHub repo
4. Render auto-detects `render.yaml` and creates both the database and web service
5. Fill in the prompted env vars (`ADMIN_EMAIL`, `ADMIN_PASSWORD`, mail hosts)
6. Click **Apply**

After deploy, run `cd server && node src/db/init.js` from the Shell tab to init the database.

---

### Troubleshooting

| Problem                     | Fix                                                                 |
| --------------------------- | ------------------------------------------------------------------- |
| "Application error" on load | Check **Logs** tab in Render for the error                          |
| DB connection refused       | Make sure `DATABASE_URL` is set and the DB is in the same region    |
| Login fails                 | Run `node src/db/init.js` from Shell if you haven't yet             |
| Emails don't load           | Check your IMAP host/port/credentials in Settings                   |
| Free tier spins down        | First request after idle takes ~30s; this is normal on free tier    |

---

## Security Notes

- Passwords are hashed with **bcrypt** (12 rounds). Plain text passwords are never stored.
- Authentication uses **JWT** Bearer tokens.
- **Helmet** sets secure HTTP headers.
- **Rate limiting** is enabled (300 requests per 15 minutes per IP).
- Render provides free **HTTPS** automatically.
- Mail credentials are stored in the database. In a production environment, consider encrypting them at rest.

---

## License

MIT
