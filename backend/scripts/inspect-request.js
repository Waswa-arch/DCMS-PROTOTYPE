/**
 * ONE-OFF DIAGNOSTIC: LIST ALL ITEMS FOR A SPECIFIC CLEARANCE REQUEST
 *
 * Not part of the application — a throwaway helper for manual testing.
 * Prints item_id, department name, and status for every dept_clearance_items
 * row belonging to the given request_id, so they can be approved directly
 * via the API without hunting through per-officer queues.
 *
 * USAGE:
 *   node scripts/inspect-request.js <request_id>
 */

import { db } from '../src/config/db.js';

async function inspectRequest() {
  const requestId = process.argv[2];

  if (!requestId) {
    console.error('Usage: node scripts/inspect-request.js <request_id>');
    process.exit(1);
  }

  try {
    const items = await db.all(
      `SELECT dci.id as item_id, d.name as department_name, dci.status
       FROM dept_clearance_items dci
       JOIN departments d ON dci.department_id = d.id
       WHERE dci.request_id = ?
       ORDER BY d.sequence_order ASC`,
      [requestId]
    );

    if (items.length === 0) {
      console.log(`No items found for request_id ${requestId}.`);
      return;
    }

    console.log(`Items for request_id ${requestId}:`);
    items.forEach((item) => {
      console.log(`  item_id ${item.item_id} | ${item.department_name} | ${item.status}`);
    });
  } catch (error) {
    console.error('Inspection failed:', error);
    process.exit(1);
  }
}

inspectRequest();
