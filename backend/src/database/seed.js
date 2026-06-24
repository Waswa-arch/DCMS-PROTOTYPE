import bcrypt from 'bcryptjs';
import { db } from '../config/db.js';
import { env } from '../config/env.js';

export async function runSeeds() {
  try {
    console.log('[Seeder Engine] Validating institutional foundational data entries...');

    // 1. Check for the existence of departments before writing
    const deptCheck = await db.get('SELECT id FROM departments LIMIT 1');
    if (!deptCheck) {
      console.log('[Seeder Engine] Harmonizing the 6 primary institutional departments...');
      const targetDepartments = [
        { name: 'Library Services', order: 1 },
        { name: 'Sports & Athletics Division', order: 2 },
        { name: 'Student Affairs Directorate', order: 3 },
        { name: 'University Hostels & Housing', order: 4 },
        { name: 'Finance & Accounts Bureau', order: 5 },
        { name: 'Office of the Academic Registrar', order: 6 }
      ];

      for (const dept of targetDepartments) {
        await db.run(
          'INSERT INTO departments (name, sequence_order) VALUES (?, ?)',
          [dept.name, dept.order]
        );
      }
      console.log(' -> Departments successfully anchored.');
    }

    // 2. Provision System Admin Account securely
    const adminCheck = await db.get("SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1");
    if (!adminCheck) {
      console.log('[Seeder Engine] Initializing Master Administrator Account...');

      if (!env.adminPassword) {
        console.error('\x1b[31m%s\x1b[0m', '🛑 SECURITY ENFORCEMENT FAILURE:');
        console.error('Cannot seed admin account. ADMIN_PASSWORD is missing from your .env configuration file.');
        console.error('Action Required: Open your .env file and assign a safe string token value to ADMIN_PASSWORD.');
        process.exit(1);
      }

      const salt = await bcrypt.genSalt(10);
      const secureHash = await bcrypt.hash(env.adminPassword, salt);

      await db.run(`
        INSERT INTO users (id_number, name, email, password_hash, role)
        VALUES ('ADMIN001', 'System Administrator', 'admin@university.edu', ?, 'ADMIN')
      `, [secureHash]);

      console.log('\x1b[32m%s\x1b[0m', ' -> Root Administrator securely seeded into data logs.');
    }

  } catch (error) {
    console.error('🛑 [Seeder Engine] Seeding lifecycle crashed unexpectedly:');
    console.error(error);
    process.exit(1);
  }
}