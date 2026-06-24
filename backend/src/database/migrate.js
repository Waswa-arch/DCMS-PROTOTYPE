import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../config/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function runMigrations() {
  try {
    console.log('[Migration Engine] Reading system schema blueprint...');
    const schemaPath = path.resolve(__dirname, './schema.sql');
    const sqlSchema = fs.readFileSync(schemaPath, 'utf8');

    console.log('[Migration Engine] Executing physical schema migration...');
    // exec runs multi-line batches of raw SQL syntax cleanly
    await db.exec(sqlSchema);
    console.log('\x1b[32m%s\x1b[0m', '✅ [Migration Engine] Schema migration successfully compiled.');
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', '🛑 [Migration Engine] Critical migration collapse:');
    console.error(error);
    process.exit(1);
  }
}