import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../database.sqlite');

let db = null;

export async function initDB() {
  if (db) return db;

  console.log(`[Database Engine] Connecting to target database file at: ${dbPath}`);
  
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  console.log('[Database Engine] SQLite Connection pool established securely.');
  return db;
}

export { db };