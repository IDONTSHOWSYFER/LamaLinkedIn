import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    // bcrypt à 12 rounds est volontairement coûteux : on laisse de la marge
    // pour ne pas faire échouer les tests sur une machine/CI chargée.
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
