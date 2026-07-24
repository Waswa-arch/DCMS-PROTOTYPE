import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../config/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Adds columns to an already-existing table if they're missing. Needed
 * because schema.sql's CREATE TABLE IF NOT EXISTS only applies to a fresh
 * database — it cannot retroactively add columns to a table that already
 * exists with data in it, which is our actual situation on the live dev DB.
 */
async function ensureColumn(table, column, definition) {
  const columns = await db.all(`PRAGMA table_info(${table})`);
  const exists = columns.some((col) => col.name === column);
  if (!exists) {
    console.log(`[Migration Engine] Adding missing column ${table}.${column}...`);
    await db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

export async function runMigrations() {
  try {
    console.log('[Migration Engine] Reading system schema blueprint...');
    const schemaPath = path.resolve(__dirname, './schema.sql');
    const sqlSchema = fs.readFileSync(schemaPath, 'utf8');

    console.log('[Migration Engine] Executing physical schema migration...');
    await db.exec(sqlSchema);

    // Additive migration for columns that CREATE TABLE IF NOT EXISTS can't
    // retroactively add to an already-existing departments table.
    await ensureColumn('departments', 'department_type', "TEXT CHECK(department_type IN ('UNIVERSAL', 'SCHOOL')) NOT NULL DEFAULT 'UNIVERSAL'");
    await ensureColumn('departments', 'school_code', 'TEXT NULL');
    await ensureColumn('departments', 'officer_code', 'TEXT NULL');
    await db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_departments_officer_code ON departments(officer_code)');

    console.log('\x1b[32m%s\x1b[0m', '✅ [Migration Engine] Schema migration successfully compiled.');
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', '🛑 [Migration Engine] Critical migration collapse:');
    console.error(error);
    process.exit(1);
  }
}