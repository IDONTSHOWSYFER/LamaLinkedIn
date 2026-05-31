# Lama Linked.In

**Smart Chrome extension for LinkedIn** with a dual mode — Assisted (guided manual) and Agent (full automation) — plus a marketing funnel and a backend API. The whole stack is **free**: no payment, no subscription, no premium tier.

---

## Monorepo

pnpm workspace with three apps:

| App | Role | Stack |
|-----|------|-------|
| `apps/extension` | Chrome extension (MV3) | React 18, TypeScript, Vite 6 + CRXJS, Tailwind 4, Zustand, Recharts |
| `apps/web` | Marketing funnel & dashboard | React 18, TypeScript, Vite 6, React Router 7, Motion, Recharts, Tailwind 4 |
| `apps/api` | Backend API | Node.js, Express, Prisma ORM, PostgreSQL, Upstash Redis, Resend |

---

## Features

### Assisted Mode
- **Highlights** on LinkedIn post Like buttons
- **Contextual comment suggestions** under each post
- **Fill-on-click** — nothing is sent automatically
- **Session timer** with goals and real-time tracking

### Agent Mode
- **Auto-like & auto-comment** with human-like timing (jitter, random pauses)
- **Smart scrolling** that simulates natural behavior
- **Multi-session** support with daily quotas (150 likes, 50 comments/day max)
- **256+ pre-written** comment messages with skin-tone variation
- **Post deduplication** so the same post is never actioned twice
- **Virtual cursor** simulating mouse movement

### Popup UI (4 tabs)
1. **Session** — circular timer, action checklist, live counters
2. **Tracking** — history, growth charts, period filters
3. **Templates** — message library, one-click copy, categories
4. **Settings** — duration, goals, speed, toggles, advanced Agent mode

### Web funnel (`apps/web`)
- Landing page with **free ebook** lead magnet
- Auth pages (register / login / forgot & reset password)
- Dashboard with real activity stats
- Legal pages (privacy, terms)

### Backend API (`apps/api`)
- **Auth** — register/login with JWT, password reset via email
- **Events** — full action tracking with analytics
- **Stats** — period-based aggregates
- **Lead magnet** — email capture and free ebook delivery
- **Emails** — welcome, ebook, password reset (Resend HTTP API)

---

## Security

- **JWT** signed; the API refuses to boot in production without `JWT_SECRET`
- **Passwords** hashed with bcrypt; timing-safe compare with anti-enumeration on login
- **CORS** pinned to the published extension ID and allow-listed web origins in production
- **Rate limiting** (Upstash Redis, sliding window) on login, register, password reset and lead capture
- **HTML escaping** of user input injected into transactional emails
- **Password-reset tokens** stored as SHA-256 hashes with a 1-hour expiry
- **Extension ↔ web** messaging scoped with `postMessage` `targetOrigin`

## Privacy & GDPR

- **Consent** — the user explicitly chooses Assisted or Agent mode
- **Data minimization** — only action type and timestamp are collected
- **Local storage** — session data stays in `chrome.storage.local`
- **No resale** — no LinkedIn data is sent to third parties
- **Right to erasure** — account deletion via the API

---

## Project structure

```
├── apps/
│   ├── extension/              # Chrome extension (MV3)
│   │   └── src/
│   │       ├── background/     # Service worker
│   │       ├── content/        # Content scripts (assist + agent)
│   │       ├── popup/          # React popup (tabs, store, components)
│   │       ├── components/     # Design system (lama/ + ui/)
│   │       ├── lib/            # Utils, storage, API client
│   │       ├── styles/         # Tailwind, tokens, fonts
│   │       └── types/          # TypeScript types & defaults
│   ├── web/                    # Marketing funnel & dashboard
│   │   └── src/app/            # Pages, routes, components, lib
│   └── api/                    # Node/Express backend
│       ├── src/
│       │   ├── routes/         # auth, events, lead
│       │   ├── middleware/     # auth, rate limiter, security headers
│       │   ├── services/       # email templates
│       │   └── db/             # Prisma client, Redis, seed
│       └── prisma/schema.prisma
├── .github/workflows/ci.yml
├── pnpm-workspace.yaml
└── package.json
```

---

## Getting started

### Prerequisites
- Node.js 20+
- pnpm 10+
- PostgreSQL 15+
- An Upstash Redis instance (rate limiting & caching)

### 1. Install

```bash
git clone <repo-url>
cd "Lama LinkedIn"
pnpm install
```

### 2. Configure the API environment

```bash
cp apps/api/.env.example apps/api/.env
# Set DATABASE_URL, JWT_SECRET, RESEND_API_KEY,
# UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
```

### 3. Initialize the database

```bash
pnpm db:migrate    # create tables
pnpm db:seed       # add a demo user (dev only — refused in production)
```

### 4. Run in development

```bash
pnpm dev:api                      # API
pnpm dev:extension                # Extension
pnpm --filter @lbp/web dev        # Web funnel
```

### 5. Load the extension in Chrome

1. Open `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select `apps/extension/dist/`
5. Open `linkedin.com/feed` and click the Lama icon

### 6. Production build

```bash
pnpm build                        # extension + API
pnpm --filter @lbp/web build      # web funnel
```

`apps/extension/dist/` holds the extension ready for the Chrome Web Store.

---

## Tests

```bash
pnpm test                         # extension + API (vitest)
```

---

## Demo account (dev only)

| Email | Password |
|-------|----------|
| demo@lama-linkedin.com | demo123 |

---

## License

Proprietary. All rights reserved.
