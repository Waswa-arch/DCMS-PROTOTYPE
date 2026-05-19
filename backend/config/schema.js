const db = require('./db');
const bcrypt = require('bcrypt');

console.log('[Schema Provisioner] Initializing database definition routine...');

// Use a database transaction to ensure all operations execute atomically
const runSchemaSetup = db.transaction(() => {
  // 1. Drop existing tables in reverse relational order to avoid constraint blocks
  db.prepare('DROP TABLE IF EXISTS certificates').run();
  db.prepare('DROP TABLE IF EXISTS audit_log').run();
  db.prepare('DROP TABLE IF EXISTS notifications').run();
  db.prepare('DROP TABLE IF EXISTS dept_clearance_items').run();
  db.prepare('DROP TABLE IF EXISTS clearance_requests').run();
  db.prepare('DROP TABLE IF EXISTS departments').run();
  db.prepare('DROP TABLE IF EXISTS users').run();
  console.log('[Schema] Existing table configurations cleared safely.');

  // 2. Create USERS Table
  db.prepare(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT CHECK(role IN ('STUDENT', 'OFFICER', 'ADMIN')) NOT NULL,
      id_number TEXT UNIQUE, -- Student Reg Number or Officer Staff ID
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
  console.log('[Schema] Table "users" provisioned.');

  // 3. Create DEPARTMENTS Table (Explicit sequential chain)
  db.prepare(`
    CREATE TABLE departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      sequence_order INTEGER NOT NULL UNIQUE
    )
  `).run();
  console.log('[Schema] Table "departments" provisioned.');

  // 4. Create CLEARANCE_REQUESTS Table
  db.prepare(`
    CREATE TABLE clearance_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      overall_status TEXT CHECK(overall_status IN ('PENDING', 'ACTIVE', 'APPROVED', 'REJECTED', 'FLAGGED')) DEFAULT 'PENDING',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE RESTRICT
    )
  `).run();
  console.log('[Schema] Table "clearance_requests" provisioned.');

  // 5. Create DEPT_CLEARANCE_ITEMS Table (Granular node parameters)
  db.prepare(`
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
  `).run();
  console.log('[Schema] Table "dept_clearance_items" provisioned.');

  // 6. Create NOTIFICATIONS Table
  db.prepare(`
    CREATE TABLE notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER CHECK(is_read IN (0, 1)) DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `).run();
  console.log('[Schema] Table "notifications" provisioned.');

  // 7. Create AUDIT_LOG Table (Append-only layout context)
  db.prepare(`
    CREATE TABLE audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor_id INTEGER,
      action_type TEXT NOT NULL,
      entity_affected TEXT NOT NULL,
      details TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `).run();
  console.log('[Schema] Table "audit_log" provisioned.');

  // 8. Create CERTIFICATES Table
  db.prepare(`
    CREATE TABLE certificates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_id INTEGER NOT NULL UNIQUE,
      certificate_code TEXT NOT NULL UNIQUE, -- e.g., DCMS-2026-00042
      issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      signed_by_admin_id INTEGER,
      FOREIGN KEY (request_id) REFERENCES clearance_requests(id) ON DELETE RESTRICT,
      FOREIGN KEY (signed_by_admin_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `).run();
  console.log('[Schema] Table "certificates" provisioned.');

  // ==========================================
  // SYSTEM SEED DATA ROUTINE
  // ==========================================
  console.log('[Schema Seeder] Injecting operational institutional configuration data...');

  // Seed the 6 Mandatory Kabarak University Departments in absolute routing order
  const insertDept = db.prepare('INSERT INTO departments (name, sequence_order) VALUES (?, ?)');
  const universityDepts = [
    'University Library',
    'Finance Department',
    'Hostel & Catering',
    'Academic Affairs Registrar',
    'IT Department',
    'Sports Department'
  ];
  universityDepts.forEach((name, index) => {
    insertDept.run(name, index + 1);
  });
  console.log(`[Schema Seeder] ${universityDepts.length} primary institutional departments seeded.`);

  // Seed a Core System Administrator Account for platform management testing
  const adminPasswordHash = bcrypt.hashSync('AdminSecure2026!', 10);
  db.prepare(`
    INSERT INTO users (name, email, password_hash, role, id_number) 
    VALUES ('Office of the Registrar', 'registrar.systems@kabarak.ac.ke', ?, 'ADMIN', 'KABU-ADM-001')
  `).run(adminPasswordHash);
  console.log('[Schema Seeder] Global Administrator account seeded successfully.');
});

try {
  runSchemaSetup();
  console.log('\n[Database Provisioning Status] COMPLETE: All 7 tables compiled and system data hooks loaded.');
  process.exit(0);
} catch (error) {
  console.error('\n[Database Provisioning Status] CRITICAL SCHEMA EXECUTION FAILURE:', error.message);
  process.exit(1);
}