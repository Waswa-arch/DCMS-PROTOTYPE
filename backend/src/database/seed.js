import bcrypt from 'bcryptjs';
import { db } from '../config/db.js';
import { env } from '../config/env.js';

export async function runSeeds() {
  try {
    console.log('[Seeder Engine] Validating institutional foundational data entries...');

    const deptCheck = await db.get('SELECT id FROM departments LIMIT 1');
    if (!deptCheck) {
      console.log('[Seeder Engine] Seeding 6 primary institutional departments...');
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
      console.log(' -> Departments seeded.');
    }

    const adminCheck = await db.get("SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1");
    if (!adminCheck) {
      console.log('[Seeder Engine] Seeding administrator account...');

      const salt = await bcrypt.genSalt(10);
      const secureHash = await bcrypt.hash(env.adminPassword, salt);

      await db.run(
        'INSERT INTO users (id_number, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
        ['ADMIN001', 'System Administrator', 'admin@university.edu', secureHash, 'ADMIN']
      );

      console.log(' -> Administrator account seeded.');
    }

  } catch (error) {
    console.error('[Seeder Engine] Fatal seeding failure:', error);
    process.exit(1);
  }
}