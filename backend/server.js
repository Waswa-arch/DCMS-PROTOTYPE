import app from './src/app.js';
import { env } from './src/config/env.js';
import { runMigrations } from './src/database/migrate.js';
import { runSeeds } from './src/database/seed.js';

async function bootServer() {
  try {
    console.log('🚀 [System Boot] Initializing Digital Clearance Management System Lifecycle...');

    // 1. Fire foundational database table compile routines
    await runMigrations();

    // 2. Hydrate core systemic constraints and static data
    await runSeeds();

    // 3. Unshackle the network socket listener loop
    app.listen(env.port, () => {
      console.log('\x1b[36m%s\x1b[0m', `✨ [System Boot] Production engine running smoothly on http://localhost:${env.port}`);
    });

  } catch (criticalFailure) {
    console.error('\x1b[31m%s\x1b[0m', '💥 [System Boot] Critical Engine Startup Core Fault:');
    console.error(criticalFailure);
    process.exit(1);
  }
}

// Execute the bootstrap sequence
bootServer();