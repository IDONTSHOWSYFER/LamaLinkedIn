#!/bin/bash
# ==========================================
# Lama LinkedIn — Setup complet
# ==========================================
set -e

echo "🦙 Lama LinkedIn — Setup"
echo "========================"

# 1. Install dependencies
echo ""
echo "📦 Installation des dépendances..."
pnpm install

# 2. Generate Prisma
echo ""
echo "🔧 Génération du client Prisma..."
cd apps/api
pnpm exec prisma generate

# 3. Setup .env if not exists
if [ ! -f .env ]; then
  echo ""
  echo "📝 Création du .env depuis .env.example..."
  cp .env.example .env
  echo "   ⚠️  IMPORTANT: Editez apps/api/.env avec vos clés Stripe et SMTP"
fi
cd ../..

# 4. Build all
echo ""
echo "🏗️  Build de tous les projets..."
pnpm build 2>&1 || true

# 5. Run tests
echo ""
echo "🧪 Lancement des tests..."
cd apps/api && pnpm test && cd ../..

echo ""
echo "✅ Setup terminé !"
echo ""
echo "📋 Prochaines étapes :"
echo "   1. Configurez apps/api/.env (Stripe, SMTP, JWT_SECRET)"
echo "   2. Lancez PostgreSQL : docker compose up postgres -d"
echo "   3. Migrez la base : cd apps/api && pnpm db:migrate"
echo "   4. Lancez l'API : cd apps/api && pnpm dev"
echo "   5. Lancez le site : cd apps/web && pnpm dev"
echo "   6. Testez l'extension : cd apps/extension && pnpm dev"
echo ""
echo "🚀 Ou tout d'un coup : docker compose up"
