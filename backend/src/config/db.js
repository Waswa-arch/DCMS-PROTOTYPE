import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, '../../database.sqlite');

console.log(`[Database Engine] Initializing storage adapter pool at: ${dbPath}`);

// Solely opens and exports the single database instance connection
export const db = await open({
  filename: dbPath,
  driver: sqlite3.Database
});

// Enable Foreign Key constraint enforcement globally
await db.get('PRAGMA foreign_keys = ON;');