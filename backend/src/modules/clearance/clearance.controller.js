import { db } from '../../config/db.js';

/**
 * FETCH OR AUTO-INITIATE STUDENT CLEARANCE STATUS
 * Safe-provisioning architecture built to withstand concurrent race condition taps
 */
export const getMyClearance = async (req, res, next) => {
  const studentId = req.user.id;

  try {
    // 1. Check if an active clearance ledger entry already exists for this student
    let request = await db.get(
      'SELECT * FROM clearance_requests WHERE student_id = ?',
      [studentId]
    );

    // 2. IDEMPOTENT AUTO-PROVISIONING: Absorbs parallel network hits smoothly
    if (!request) {
      console.log(`[Clearance Engine] Safe-provisioning workflow ledger for Student ID: ${studentId}`);
      
      try {
        await db.exec('BEGIN TRANSACTION;');
        
        // UNIQUE constraint rules out double-entry creations
        await db.run(
          "INSERT OR IGNORE INTO clearance_requests (student_id, overall_status) VALUES (?, 'ACTIVE')",
          [studentId]
        );

        // Re-fetch record to grab the authenticated ID assigned by the winning thread
        request = await db.get('SELECT * FROM clearance_requests WHERE student_id = ?', [studentId]);

        // Defensive verification check: Ensure child tracking items do not already exist
        const existingItems = await db.get(
          'SELECT id FROM dept_clearance_items WHERE request_id = ? LIMIT 1',
          [request.id]
        );

        if (!existingItems) {
          // Fetch our 6 harmonized configuration departments
          const departments = await db.all('SELECT id FROM departments ORDER BY sequence_order ASC');

          // Generate a single tracking row per department
          for (const dept of departments) {
            await db.run(
              "INSERT OR IGNORE INTO dept_clearance_items (request_id, department_id, status, remarks) VALUES (?, ?, 'PENDING', 'Awaiting administrative review.')",
              [request.id, dept.id]
            );
          }
        }

        await db.exec('COMMIT;');
      } catch (txError) {
        await db.exec('ROLLBACK;').catch(() => {});
        console.warn(`[Clearance Engine] Concurrent transaction handled cleanly. Resolving operational state ledger.`);
        
        // Pull the structural state initialized by the concurrent execution thread
        request = await db.get('SELECT * FROM clearance_requests WHERE student_id = ?', [studentId]);
        if (!request) throw txError; 
      }
    }

    // 3. Compile structural nodes into an aggregated payload
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
    next(error);
  }
};

/**
 * OFFICER: FETCH ALL PENDING ITEMS FOR THE OFFICER'S ASSIGNED DEPARTMENT
 * Supplies the tailored department queue layout with live student requests
 */
export const getOfficerQueue = async (req, res, next) => {
  const officerDeptId = req.user.department_id; 

  if (!officerDeptId) {
    return res.status(403).json({
      success: false,
      message: "Access Denied: Your profile is not bound to an institutional department configuration."
    });
  }

  try {
    const queue = await db.all(`
      SELECT 
        dci.id as item_id,
        dci.status,
        dci.remarks,
        u.name as student_name,
        u.id_number as student_id_number,
        u.email as student_email
      FROM dept_clearance_items dci
      JOIN clearance_requests cr ON dci.request_id = cr.id
      JOIN users u ON cr.student_id = u.id
      WHERE dci.department_id = ? AND dci.status = 'PENDING'
      ORDER BY cr.created_at ASC
    `, [officerDeptId]);

    return res.status(200).json({
      success: true,
      queue
    });

  } catch (error) {
    next(error);
  }
};

/**
 * OFFICER/ADMIN ACTION: APPROVE OR FLAG A DEPARTMENTAL NODE
 * Persists status updates, records automated audit metrics, and fires alerts
 */
export const actionClearanceItem = async (req, res, next) => {
  const itemId = req.params.id;
  const { status, remarks } = req.body; 
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

    // 4. NOTIFICATION SYSTEM LAYER: Emit an alert entry directly to the targeted student user
    await db.run(`
      INSERT INTO notifications (user_id, title, message)
      VALUES (?, ?, ?)
    `, [
      item.student_id,
      `Clearance Update: ${item.dept_name}`,
      `Your clearance step has been marked as ${status}. Review notes: "${remarks || 'No additional details provided.'}"`
    ]);

    // 5. AUTOMATED RESOLUTION WORKFLOW: Dynamically check relative completion balances
    const totalNodes = await db.get('SELECT COUNT(*) as cnt FROM dept_clearance_items WHERE request_id = ?', [item.request_id]);
    const approvedNodes = await db.get("SELECT COUNT(*) as cnt FROM dept_clearance_items WHERE request_id = ? AND status = 'APPROVED'", [item.request_id]);

    if (totalNodes.cnt === approvedNodes.cnt) {
      await db.run(
        "UPDATE clearance_requests SET overall_status = 'APPROVED', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [item.request_id]
      );
      
      // Fire final clearance notification confirming full administrative unlock
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
    next(error);
  }
};