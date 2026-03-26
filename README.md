# Lama Linked.In

**Extension Chrome intelligente pour Linked.In** avec double mode : Assisté (manuel guidé) et Agent (automatisation complète).

---

## Fonctionnalités

### Mode Assisté
- **Highlights** sur les boutons Like des posts LinkedIn
- **Suggestions de commentaires** contextuelles sous chaque post
- **Remplissage au clic** (pas d'action automatique)
- **Timer de session** avec objectifs et suivi en temps réel

### Mode Agent
- **Auto-like & auto-comment** avec timing humain (jitter, pauses aléatoires)
- **Scroll intelligent** simulant un comportement naturel
- **Multi-sessions** avec quotas journaliers (150 likes, 50 comments/jour max)
- **256+ messages** de commentaire pré-écrits avec variation de skin tone
- **Déduplication** des posts traités
- **Curseur virtuel** simulant le mouvement de souris

### Interface Popup (5 onglets)
1. **Session** — Timer circulaire, checklist d'actions, compteurs live
2. **Suivi** — Historique, graphiques de croissance, filtres par période
3. **Templates** — Bibliothèque de messages, copie au clic, catégories
4. **Réglages** — Durée, objectifs, vitesse, toggles, mode Agent avancé
5. **Premium** — Upgrade Stripe, features premium

### Backend API
- **Auth** — Inscription/connexion avec JWT
- **Events** — Tracking de toutes les actions avec analytics
- **Stats** — Agrégats par période avec charts
- **Stripe** — Abonnement premium (checkout, portail, webhooks)
- **Emails** — Welcome, paiement, reset password (Nodemailer)

---

## Stack technique

| Couche | Technologies |
|--------|-------------|
| Extension | React 18, TypeScript, Vite + CRXJS, Tailwind CSS 4, Zustand |
| Design | Tokens CSS custom (Lama Design System), composants Lama* |
| Content Scripts | Vanilla TS, DOM LinkedIn, Chrome APIs |
| API | Node.js, Express, Prisma ORM, PostgreSQL |
| Paiements | Stripe (checkout, billing portal, webhooks) |
| Emails | Nodemailer (SMTP transactionnel) |
| CI/CD | GitHub Actions (lint, test, build) |

---

## Structure du projet

```
├── apps/
│   ├── extension/              # Extension Chrome
│   │   ├── src/
│   │   │   ├── background/     # Service worker
│   │   │   ├── content/        # Content scripts (assist + agent)
│   │   │   ├── popup/          # Popup React (tabs, store, components)
│   │   │   ├── components/     # Design system (lama/ + ui/)
│   │   │   ├── lib/            # Utils, storage, API client
│   │   │   ├── styles/         # Tailwind, tokens, fonts
│   │   │   └── types/          # TypeScript types & defaults
│   │   ├── vite.config.ts
│   │   └── package.json
│   └── api/                    # Backend Node/Express
│       ├── src/
│       │   ├── routes/         # auth, events, stripe
│       │   ├── middleware/     # JWT auth
│       │   ├── services/       # Email templates
│       │   └── db/             # Seed data
│       ├── prisma/
│       │   └── schema.prisma
│       └── package.json
├── .github/workflows/ci.yml
├── pnpm-workspace.yaml
└── package.json
```

---

## Installation & Développement

### Prérequis
- Node.js 20+
- pnpm 9+
- PostgreSQL 15+

### 1. Cloner et installer

```bash
git clone <repo-url>
cd "Lama LinkedIn"
pnpm install
```

### 2. Configurer l'environnement

```bash
# API
cp apps/api/.env.example apps/api/.env
# Modifier DATABASE_URL, JWT_SECRET, STRIPE_SECRET_KEY, SMTP_*
```

### 3. Initialiser la base de données

```bash
pnpm db:migrate    # Crée les tables
pnpm db:seed       # Ajoute un utilisateur demo
```

### 4. Lancer en développement

```bash
# Terminal 1 — API
pnpm dev:api

# Terminal 2 — Extension
pnpm dev:extension
```

### 5. Charger l'extension dans Chrome

1. Ouvrir `chrome://extensions/`
2. Activer le **Mode développeur**
3. Cliquer **Charger l'extension non empaquetée**
4. Sélectionner le dossier `apps/extension/dist/`
5. Ouvrir `linkedin.com/feed` et cliquer sur l'icône Lama

### 6. Build production

```bash
pnpm build              # Build extension + API
```

Le dossier `apps/extension/dist/` contient l'extension prête pour le Chrome Web Store.

---

## Tests

```bash
pnpm test               # Tous les tests
```

---

## Sécurité & RGPD

- **Consentement** : L'utilisateur choisit explicitement son mode (Assisté ou Agent)
- **Minimisation** : Seules les données nécessaires sont collectées (type d'action, timestamp)
- **Stockage local** : Les données de session restent dans `chrome.storage.local`
- **Pas de revente** : Aucune donnée LinkedIn n'est transmise à des tiers
- **Chiffrement** : Mots de passe hashés bcrypt, JWT signé, HTTPS obligatoire
- **Droit à l'oubli** : Suppression de compte via l'API

---

## Comptes de test

| Email | Mot de passe | Tier |
|-------|-------------|------|
| demo@lama-linkedin.com | demo123 | Premium |

---

---

# Lama LinkedIn — LinkedIn Bot Pro (English)

**Smart Chrome Extension for LinkedIn** with dual mode: Assisted (guided manual) and Agent (full automation).

---

## Features

### Assisted Mode
- **Highlights** on LinkedIn post Like buttons
- **Comment suggestions** shown below each post
- **Fill-on-click** (no automatic actions)
- **Session timer** with goals and real-time tracking

### Agent Mode
- **Auto-like & auto-comment** with human-like timing (jitter, random pauses)
- **Smart scrolling** simulating natural behavior
- **Multi-session** support with daily quotas (150 likes, 50 comments/day max)
- **256+ pre-written** comment messages with skin tone variation
- **Post deduplication**
- **Virtual cursor** simulating mouse movement

### Popup UI (5 tabs)
1. **Session** — Circular timer, action checklist, live counters
2. **Tracking** — History, growth charts, period filters
3. **Templates** — Message library, one-click copy, categories
4. **Settings** — Duration, goals, speed, toggles, advanced Agent mode
5. **Premium** — Stripe upgrade, premium features

### Backend API
- **Auth** — Register/login with JWT
- **Events** — Full action tracking with analytics
- **Stats** — Period-based aggregates with charts
- **Stripe** — Premium subscription (checkout, portal, webhooks)
- **Emails** — Welcome, payment, password reset (Nodemailer)

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Extension | React 18, TypeScript, Vite + CRXJS, Tailwind CSS 4, Zustand |
| Design | Custom CSS tokens (Lama Design System), Lama* components |
| Content Scripts | Vanilla TS, LinkedIn DOM, Chrome APIs |
| API | Node.js, Express, Prisma ORM, PostgreSQL |
| Payments | Stripe (checkout, billing portal, webhooks) |
| Emails | Nodemailer (transactional SMTP) |
| CI/CD | GitHub Actions (lint, test, build) |

---

## Quick Start

```bash
# Install
pnpm install

# Setup database
cp apps/api/.env.example apps/api/.env
pnpm db:migrate
pnpm db:seed

# Development
pnpm dev:api        # Terminal 1
pnpm dev:extension  # Terminal 2

# Load extension: chrome://extensions/ -> Load unpacked -> apps/extension/dist/

# Production build
pnpm build
```

---

## Security & GDPR

- **Consent**: User explicitly chooses their mode (Assisted or Agent)
- **Data minimization**: Only necessary data collected (action type, timestamp)
- **Local storage**: Session data stays in `chrome.storage.local`
- **No data resale**: No LinkedIn data transmitted to third parties
- **Encryption**: Bcrypt passwords, signed JWT, HTTPS required
- **Right to erasure**: Account deletion via API

---

## License

Proprietary. All rights reserved.
