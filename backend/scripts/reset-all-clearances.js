/**
 * ONE-TIME RESET: WIPE ALL CLEARANCE PROGRESS
 *
 * Deletes every row in clearance_requests. Because dept_clearance_items has
 * a foreign key to clearance_requests with ON DELETE CASCADE, this also
 * removes every dept_clearance_items row automatically — no separate delete
 * needed there.
 *
 * Student accounts (login, name, email, id_number) are completely
 * untouched. The next time each student logs in and hits GET
 * /api/clearance/me, getMyClearance will see no existing request and
 * freshly seed them under the NEW school-department logic — universal
 * departments + whichever school matches their id_number prefix.
 *
 * This is the intentional, simpler alternative to writing a backfill
 * migration script: since this is dev/test data (not real production
 * student records), starting every student's clearance progress over from
 * scratch is an acceptable, much lower-risk choice than trying to
 * selectively patch existing in-progress records.
 *
 * USAGE (run from the backend/ directory):
 *   node scripts/reset-all-clearances.js
 *
 * There is no undo. Confirm this is what you want before running it.
 */

import { db } from '../src/config/db.js';

async function resetAllClearances() {
  try {
    const before = await db.get('SELECT COUNT(*) as count FROM clearance_requests');
    console.log(`Found ${before.count} clearance_requests row(s). Deleting...`);

    await db.run('DELETE FROM clearance_requests');

    const after = await db.get('SELECT COUNT(*) as count FROM clearance_requests');
    const itemsAfter = await db.get('SELECT COUNT(*) as count FROM dept_clearance_items');

    console.log(`Done. clearance_requests now has ${after.count} row(s).`);
    console.log(`dept_clearance_items now has ${itemsAfter.count} row(s) (should be 0, confirming cascade worked).`);
    console.log('Every student will be freshly re-seeded, correctly scoped to their school, next time they log in.');
  } catch (error) {
    console.error('Reset failed:', error);
    process.exit(1);
  }
}

resetAllClearances();