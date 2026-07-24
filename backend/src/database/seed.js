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

    // ADDITIVE SEEDING: school-specific + one new universal department,
    // layered on top of an already-existing installation. Uses
    // INSERT OR IGNORE (departments.name is UNIQUE) so this is safe to run
    // on every boot, including after a crash mid-way through — nextOrder is
    // computed from the actual current max, not hardcoded, so a partial
    // prior run can't cause a sequence_order collision on retry.
    const newDepartments = [
      { name: 'Medical Centre', type: 'UNIVERSAL', school_code: null },
      { name: 'School of Education', type: 'SCHOOL', school_code: 'EDU' },
      { name: 'School of Science, Engineering and Technology', type: 'SCHOOL', school_code: 'SET' },
      { name: 'School of Medicine', type: 'SCHOOL', school_code: 'MED' },
      { name: 'School of Hospitality', type: 'SCHOOL', school_code: 'HOSP' },
      { name: 'School of Music and Communication', type: 'SCHOOL', school_code: 'MUSIC_COMM' },
      { name: 'School of Law', type: 'SCHOOL', school_code: 'LAW' },
    ];

    const existingCount = await db.get(
      `SELECT COUNT(*) as count FROM departments WHERE name IN (${newDepartments.map(() => '?').join(',')})`,
      newDepartments.map((d) => d.name)
    );

    if (existingCount.count < newDepartments.length) {
      console.log('[Seeder Engine] Seeding school & universal department extensions...');

      // Academic Registrar must always hold the HIGHEST sequence_order
      // (enforced by the last-department business rule) — temporarily move
      // it out of the way so the new departments can claim ordering space.
      await db.run("UPDATE departments SET sequence_order = 9999 WHERE name = 'Office of the Academic Registrar'");

      const maxOrderRow = await db.get(
        "SELECT MAX(sequence_order) as max_order FROM departments WHERE name != 'Office of the Academic Registrar'"
      );
      let nextOrder = (maxOrderRow.max_order || 0) + 1;

      for (const dept of newDepartments) {
        await db.run(
          'INSERT OR IGNORE INTO departments (name, sequence_order, department_type, school_code) VALUES (?, ?, ?, ?)',
          [dept.name, nextOrder, dept.type, dept.school_code]
        );
        nextOrder += 1;
      }

      await db.run(
        'UPDATE departments SET sequence_order = ? WHERE name = ?',
        [nextOrder, 'Office of the Academic Registrar']
      );
      console.log(' -> School & universal department extensions seeded.');
    }

    // Populate officer_code for all 13 departments. UPDATE is safe to run
    // every boot — setting the same value repeatedly is a no-op, so this
    // doesn't need an existence check like the INSERT blocks above.
    const officerCodeMap = {
      'Library Services': 'LIB',
      'Sports & Athletics Division': 'SPT',
      'Student Affairs Directorate': 'SAD',
      'University Hostels & Housing': 'HST',
      'Finance & Accounts Bureau': 'FIN',
      'Office of the Academic Registrar': 'REG',
      'Medical Centre': 'MED',
      'School of Education': 'EDU',
      'School of Science, Engineering and Technology': 'SET',
      'School of Medicine': 'SOM',
      'School of Hospitality': 'HOSP',
      'School of Music and Communication': 'MUSC',
      'School of Law': 'LAW',
    };

    for (const [name, code] of Object.entries(officerCodeMap)) {
      await db.run('UPDATE departments SET officer_code = ? WHERE name = ?', [code, name]);
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