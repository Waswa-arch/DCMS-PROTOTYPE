/**
 * ONE-TIME UPDATE: MIGRATE EXISTING OFFICER ID NUMBERS TO NEW FORMAT
 *
 * Updates id_number for the 6 pre-existing officer accounts to match the
 * new CODE/STAFF/NNN convention, keyed to each officer's CURRENT, real
 * department assignment (not a fresh reassignment — just making their ID
 * consistent with reality).
 *
 * Deliberately does NOT delete and re-register these accounts: doing so
 * would cascade-delete their audit_log and notifications history (both
 * have ON DELETE CASCADE on the user), destroying real test history for no
 * reason. Updating id_number in place preserves the account's internal id,
 * so every existing audit entry, notification, and clearance action stays
 * correctly linked.
 *
 * USAGE (run from the backend/ directory):
 *   node scripts/update-officer-ids.js
 *
 * Safe to re-run: uses email as the lookup key and simply re-applies the
 * same id_number each time, which is a no-op on a second run.
 */

import { db } from '../src/config/db.js';

const OFFICER_ID_UPDATES = [
  { email: 'officerf@kabarak.edu.ke', newId: 'LIB/STAFF/001' }, // Test Officer F -> Library Services
  { email: 'officere@kabarak.edu.ke', newId: 'SPT/STAFF/001' }, // Test Officer E -> Sports & Athletics Division
  { email: 'officerd@kabarak.edu.ke', newId: 'SAD/STAFF/001' }, // Test Officer   -> Student Affairs Directorate
  { email: 'officerc@kabarak.edu.ke', newId: 'HST/STAFF/001' }, // Officer C      -> University Hostels & Housing
  { email: 'officerb@kabarak.edu.ke', newId: 'REG/STAFF/001' }, // Test Officer B -> Office of the Academic Registrar
  { email: 'officera@kabarak.edu.ke', newId: 'FIN/STAFF/001' }, // Test Officer A -> Finance & Accounts Bureau
];

async function updateOfficerIds() {
  try {
    let updated = 0;
    let notFound = 0;

    for (const entry of OFFICER_ID_UPDATES) {
      const user = await db.get(
        "SELECT id, name, id_number FROM users WHERE email = ? AND role = 'OFFICER'",
        [entry.email]
      );

      if (!user) {
        console.log(`SKIP: no officer found with email "${entry.email}".`);
        notFound += 1;
        continue;
      }

      await db.run('UPDATE users SET id_number = ? WHERE id = ?', [entry.newId, user.id]);
      console.log(`Updated ${user.name}: "${user.id_number}" -> "${entry.newId}"`);
      updated += 1;
    }

    console.log(`\nDone. ${updated} officer(s) updated, ${notFound} not found (check emails if this is nonzero).`);
  } catch (error) {
    console.error('Update failed:', error);
    process.exit(1);
  }
}

updateOfficerIds();