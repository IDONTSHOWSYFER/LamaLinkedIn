import 'dotenv/config';
import { execSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import app from './app.js';

// Applique les migrations Prisma au boot (le start Render bypasse migrate deploy). Échec non bloquant.
function runMigrations(): void {
  try {
    const apiDir = dirname(__dirname); // dist/ -> apps/api
    const schemaPath = resolve(apiDir, 'prisma', 'schema.prisma');
    execSync(`npx prisma migrate deploy --schema "${schemaPath}"`, { cwd: apiDir, stdio: 'inherit' });
    console.log('[Prisma] Migrations à jour');
  } catch (err) {
    console.error('[Prisma] migrate deploy a échoué (démarrage poursuivi) :', err instanceof Error ? err.message : err);
  }
}

const PORT = process.env.PORT || 3001;

runMigrations();

app.listen(PORT, () => {
  console.log(`Lama Linked.In API running on port ${PORT}`);
});

export default app;
