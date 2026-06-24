import { initDB } from './db.js';
import bcrypt from 'bcryptjs';

console.log('[Schema Provisioner] Initializing database definition routine...');

async function runSchemaSetup() {
  const db = await initDB();

  // Execute entire sequence inside an async SQL transaction block
  await db.exec('BEGIN TRANSACTION;');
  
  try {
    // 1. Drop existing tables in reverse relational order to avoid constraint blocks
    await db.exec('DROP TABLE IF EXISTS certificates');
    await db.exec('DROP TABLE IF EXISTS audit_log');
    await db.exec('DROP TABLE IF EXISTS notifications');
    await db.exec('DROP TABLE IF EXISTS dept_clearance_items');
    await db.exec('DROP TABLE IF EXISTS clearance_requests');
    await db.exec('DROP TABLE IF EXISTS departments');
    await db.exec('DROP TABLE IF EXISTS users');
    console.log('[Schema] Existing table configurations cleared safely.');

    // 2. Create USERS Table
    await db.exec(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT CHECK(role IN ('STUDENT', 'OFFICER', 'ADMIN')) NOT NULL,
        id_number TEXT UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('[Schema] Table "users" provisioned.');

    // 3. Create DEPARTMENTS Table
    await db.exec(`
      CREATE TABLE departments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        sequence_order INTEGER NOT NULL UNIQUE
      )
    `);
    console.log('[Schema] Table "departments" provisioned.');

    // 4. Create CLEARANCE_REQUESTS Table
    // Inside backend/config/schema.js

await db.exec(`
  CREATE TABLE IF NOT EXISTS clearance_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    overall_status TEXT CHECK(overall_status IN ('ACTIVE', 'APPROVED', 'FLAGGED')) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id), -- BULLETPROOF SHIELD: Prevents parallel race condition duplication
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);
    console.log('[Schema] Table "clearance_requests" provisioned.');

    // 5. Create DEPT_CLEARANCE_ITEMS Table
    await db.exec(`
      CREATE TABLE dept_clearance_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        request_id INTEGER NOT NULL,
        department_id INTEGER NOT NULL,
        status TEXT CHECK(status IN ('PENDING', 'ACTIVE', 'APPROVED', 'REJECTED', 'FLAGGED')) DEFAULT 'PENDING',
        remarks TEXT,
        actioned_by_officer_id INTEGER,
        actioned_at DATETIME,
        FOREIGN KEY (request_id) REFERENCES clearance_requests(id) ON DELETE CASCADE,
        FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT,
        FOREIGN KEY (actioned_by_officer_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log('[Schema] Table "dept_clearance_items" provisioned.');

    // 6. Create NOTIFICATIONS Table
    await db.exec(`
      CREATE TABLE notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        is_read INTEGER CHECK(is_read IN (0, 1)) DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('[Schema] Table "notifications" provisioned.');

    // 7. Create AUDIT_LOG Table
    await db.exec(`
      CREATE TABLE audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        actor_id INTEGER,
        action_type TEXT NOT NULL,
        entity_affected TEXT NOT NULL,
        details TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log('[Schema] Table "audit_log" provisioned.');

    // 8. Create CERTIFICATES Table
    await db.exec(`
      CREATE TABLE certificates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        request_id INTEGER NOT NULL UNIQUE,
        certificate_code TEXT NOT NULL UNIQUE,
        issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        signed_by_admin_id INTEGER,
        FOREIGN KEY (request_id) REFERENCES clearance_requests(id) ON DELETE RESTRICT,
        FOREIGN KEY (signed_by_admin_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log('[Schema] Table "certificates" provisioned.');

    // ==========================================
    // HARMONIZED SYSTEM SEED DATA ROUTINE
    // ==========================================
    console.log('[Schema Seeder] Injecting operational institutional configuration data...');

    // HARMONIZATION FIX: Seed names mapped exactly to matching frontend components
    const universityDepts = [
      'University Library',
      'Finance & Accounts',
      'Hostel & Residence Dept',
      'Academic Affairs',
      'ICT Infrastructure',
      'Sports & Athletics'
    ];

    for (let i = 0; i < universityDepts.length; i++) {
      await db.run(
        'INSERT INTO departments (name, sequence_order) VALUES (?, ?)',
        universityDepts[i],
        i + 1
      );
    }
    console.log(`[Schema Seeder] ${universityDepts.length} primary institutional departments seeded.`);

    // Secure fallback tracking check for Admin Credential
    const adminPassword = process.env.ADMIN_PASSWORD || 'AdminSecure2026!';
    if (!process.env.ADMIN_PASSWORD) {
      console.warn('[SECURITY WARNING] Using fallback seed admin password. Define ADMIN_PASSWORD in environment variables for production environments.');
    }
    
    const adminPasswordHash = await bcrypt.hash(adminPassword, 10);
    await db.run(`
      INSERT INTO users (name, email, password_hash, role, id_number) 
      VALUES ('Office of the Registrar', 'registrar.systems@kabarak.ac.ke', ?, 'ADMIN', 'KABU-ADM-001')
    `, adminPasswordHash);
    
    await db.exec('COMMIT;');
    console.log('\n[Database Provisioning Status] COMPLETE: All 7 tables compiled and system data hooks loaded.');
    process.exit(0);

  } catch (error) {
    await db.exec('ROLLBACK;');
    console.error('\n[Database Provisioning Status] CRITICAL SCHEMA EXECUTION FAILURE:', error.message);
    process.exit(1);
  }
}

runSchemaSetup();