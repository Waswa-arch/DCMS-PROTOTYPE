import express from 'express';
import { db } from '../config/db.js';
import verifyToken from '../middleware/auth.js';
import roleGuard from '../middleware/roleGuard.js';

const router = express.Router();

/**
 * FETCH OR AUTO-INITIATE STUDENT CLEARANCE STATUS
 * GET /api/clearance/me
 * Protected: Requires a valid STUDENT token
 */
router.get('/me', verifyToken, roleGuard(['STUDENT']), async (req, res) => {
  const studentId = req.user.id;

  try {
    // 1. Check if an active clearance ledger entry already exists for this student
    let request = await db.get(
      'SELECT * FROM clearance_requests WHERE student_id = ?',
      [studentId]
    );

    // 2. AUTO-PROVISIONING: If no ledger exists, build out their parallel departmental workflow
    if (!request) {
      console.log(`[Clearance Engine] Automatically provisioning workflow ledger for Student ID: ${studentId}`);
      
      await db.exec('BEGIN TRANSACTION;');
      
      // Create master tracking entry
      const result = await db.run(
        "INSERT INTO clearance_requests (student_id, overall_status) VALUES (?, 'ACTIVE')",
        [studentId]
      );
      const newRequestId = result.lastID;

      // Fetch our 6 newly harmonized operational departments
      const departments = await db.all('SELECT id FROM departments ORDER BY sequence_order ASC');

      // Generate a granular status node for every single department
      for (const dept of departments) {
        await db.run(
          "INSERT INTO dept_clearance_items (request_id, department_id, status, remarks) VALUES (?, ?, 'PENDING', 'Awaiting administrative review.')",
          [newRequestId, dept.id]
        );
      }

      await db.exec('COMMIT;');

      // Re-fetch the newly minted request record
      request = await db.get('SELECT * FROM clearance_requests WHERE id = ?', [newRequestId]);
    }

    // 3. Fetch all granular department nodes along with their formal department names
    const items = await db.all(`
      SELECT 
        dci.id as item_id,
        d.name as department_name,
        dci.status,
        dci.remarks,
        dci.actioned_at
      FROM dept_clearance_items dci
      JOIN departments d ON dci.department_id = d.id
      WHERE dci.request_id = ?
      ORDER BY d.sequence_order ASC
    `, [request.id]);

    return res.status(200).json({
      success: true,
      clearance_request: {
        id: request.id,
        overall_status: request.overall_status,
        created_at: request.created_at,
        updated_at: request.updated_at
      },
      departmental_status: items
    });

  } catch (error) {
    await db.exec('ROLLBACK;').catch(() => {}); // Safety cleanup if transaction was active
    console.error('Clearance Retrieval Failure:', error);
    return res.status(500).json({ success: false, message: 'Unable to compile clearance tracking map.' });
  }
});

/**
 * OFFICER/ADMIN ACTION: APPROVE OR FLAG A DEPARTMENTAL NODE
 * POST /api/clearance/item/:id/action
 * Protected: Restricted strictly to authenticated OFFICER or ADMIN roles
 */
router.post('/item/:id/action', verifyToken, roleGuard(['OFFICER', 'ADMIN']), async (req, res) => {
  const itemId = req.params.id;
  const { status, remarks } = req.body; // Expects status: 'APPROVED' or 'FLAGGED'
  const officerId = req.user.id;

  if (!status || !['APPROVED', 'FLAGGED'].includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid action payload. Status must be 'APPROVED' or 'FLAGGED'." });
  }

  try {
    // 1. Fetch the target department node context to ensure it exists
    const item = await db.get(
      'SELECT dci.*, d.name as dept_name, cr.student_id FROM dept_clearance_items dci JOIN departments d ON dci.department_id = d.id JOIN clearance_requests cr ON dci.request_id = cr.id WHERE dci.id = ?',
      [itemId]
    );

    if (!item) {
      return res.status(404).json({ success: false, message: 'Target departmental tracking entry node not found.' });
    }

    await db.exec('BEGIN TRANSACTION;');

    // 2. Persist the administrative operational state update
    await db.run(`
      UPDATE dept_clearance_items 
      SET status = ?, remarks = ?, actioned_by_officer_id = ?, actioned_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [status, remarks || null, officerId, itemId]);

    // 3. AUDIT TRAIL LAYER: Document who made the change for organizational accountability
    await db.run(`
      INSERT INTO audit_log (actor_id, action_type, entity_affected, details)
      VALUES (?, 'DEPARTMENTAL_DECISION', 'dept_clearance_items', ?)
    `, [officerId, `Changed item ID ${itemId} (${item.dept_name}) state to ${status}. Remarks: ${remarks || 'None'}`]);

    // 4. NOTIFICATION SYSTEM LAYER: Emit a real dashboard system notification alert directly to the student
    await db.run(`
      INSERT INTO notifications (user_id, title, message)
      VALUES (?, ?, ?)
    `, [
      item.student_id,
      `Clearance Update: ${item.dept_name}`,
      `Your clearance step has been marked as ${status}. Review notes: "${remarks || 'No additional details provided.'}"`
    ]);

    // 5. INTUATIVE WORKFLOW AUTOMATION: Check if ALL items are now approved to automatically pass the overall request
    const totalNodes = await db.get('SELECT COUNT(*) as cnt FROM dept_clearance_items WHERE request_id = ?', [item.request_id]);
    const approvedNodes = await db.get("SELECT COUNT(*) as cnt FROM dept_clearance_items WHERE request_id = ? AND status = 'APPROVED'", [item.request_id]);

    if (totalNodes.cnt === approvedNodes.cnt) {
      await db.run(
        "UPDATE clearance_requests SET overall_status = 'APPROVED', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [item.request_id]
      );
      
      // Fire an additional notification confirming completion
      await db.run(`
        INSERT INTO notifications (user_id, title, message)
        VALUES (?, '100% Clearance Achieved!', 'All departments have cleared your records. Your administrative certificate generation is now unlocked.')
      `, [item.student_id]);
      
      console.log(`[Clearance Engine] Auto-promoted Request ID ${item.request_id} to APPROVED status.`);
    } else if (status === 'FLAGGED') {
      // If any single item gets flagged, update master state to reflect an active hold
      await db.run(
        "UPDATE clearance_requests SET overall_status = 'FLAGGED', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [item.request_id]
      );
    }

    await db.exec('COMMIT;');
    return res.status(200).json({ success: true, message: `Departmental item status successfully updated to ${status}.` });

  } catch (error) {
    await db.exec('ROLLBACK;').catch(() => {});
    console.error('Clearance Action Failure:', error);
    return res.status(500).json({ success: false, message: 'Server transaction failure processing decision.' });
  }
});

export default router;