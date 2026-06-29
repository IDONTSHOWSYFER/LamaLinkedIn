import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    // bcrypt à 12 rounds est volontairement coûteux : on laisse de la marge
    // pour ne pas faire échouer les tests sur une machine/CI chargée.
    testTimeout: 30000,
    hookTimeout: 30000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.ts'],
      // On exclut le bootstrap (démarrage serveur/migrations), le seed et le
      // client Prisma (instanciation pure, mockée dans les tests).
      // email.ts = service d'emails Resend (235 lignes, surtout des templates HTML
      // + appel réseau externe) : exclu de la couverture, non pertinent à tester unitairement.
      exclude: ['src/**/*.test.ts', 'src/__tests__/**', 'src/index.ts', 'src/db/seed.ts', 'src/db/client.ts', 'src/services/email.ts'],
    },
  },
});
