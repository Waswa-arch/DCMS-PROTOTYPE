import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Target the same database file location
const dbPath = path.resolve(__dirname, '../database.sqlite');

let db;

export async function initDB() {
  console.log(`[Database Engine] Connecting to target database file at: ${dbPath}`);
  
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  // Create your core tables if they don't exist yet
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      idNumber TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT CHECK(role IN ('STUDENT', 'OFFICER', 'ADMIN')) NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('SQLite Clearance Database Initialized & Synced cleanly.');
  return db;
}

// Helper to grab the open database instance across your models/controllers
export { db };