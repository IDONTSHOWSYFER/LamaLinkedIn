-- Nettoyage : retire les colonnes héritées inutilisées (Stripe/premium/installId)
-- et la table Session jamais utilisée (les sessions sont locales à l'extension).
ALTER TABLE "User" DROP COLUMN IF EXISTS "tier";
ALTER TABLE "User" DROP COLUMN IF EXISTS "installId";
ALTER TABLE "User" DROP COLUMN IF EXISTS "stripeCustomerId";
ALTER TABLE "User" DROP COLUMN IF EXISTS "premiumExpires";
DROP TABLE IF EXISTS "Session";
