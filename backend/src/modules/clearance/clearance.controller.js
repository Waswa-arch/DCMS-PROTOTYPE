import { db } from '../../config/db.js';

/**
 * Resolves an officer's CURRENT department from the database, not the JWT.
 * The JWT can go stale for up to 24h after an ADMIN reassigns an officer
 * (see modules/admin/admin.controller.js), so trusting the token here would
 * let a reassigned officer keep acting on their old department until their
 * token expires. This does one extra lookup per request — worth it.
 */
async function resolveOfficerDepartmentId(user) {
  if (user.role === 'ADMIN') return user.department_assigned_id;
  const row = await db.get('SELECT department_assigned_id FROM users WHERE id = ?', [user.id]);
  return row?.department_assigned_id ?? null;
}

/**
 * FETCH OR AUTO-INITIATE STUDENT CLEARANCE STATUS
 */
export const getMyClearance = async (req, res) => {
  const studentId = req.user.id;

  try {
    let request = await db.get(
      'SELECT * FROM clearance_requests WHERE student_id = ?',
      [studentId]
    );

    if (!request) {
      try {
        await db.run('BEGIN');

        await db.run(
          "INSERT OR IGNORE INTO clearance_requests (student_id, overall_status) VALUES (?, 'ACTIVE')",
          [studentId]
        );

        request = await db.get('SELECT * FROM clearance_requests WHERE student_id = ?', [studentId]);

        const existingItems = await db.get(
          'SELECT id FROM dept_clearance_items WHERE request_id = ? LIMIT 1',
          [request.id]
        );

        if (!existingItems) {
          const departments = await db.all('SELECT id FROM departments ORDER BY sequence_order ASC');
          for (const dept of departments) {
            await db.run(
              "INSERT OR IGNORE INTO dept_clearance_items (request_id, department_id, status, remarks) VALUES (?, ?, 'PENDING', 'Awaiting administrative review.')",
              [request.id, dept.id]
            );
          }
        }

        await db.run('COMMIT');
      } catch (txError) {
        await db.run('ROLLBACK').catch(() => {});
        request = await db.get('SELECT * FROM clearance_requests WHERE student_id = ?', [studentId]);
        if (!request) throw txError;
      }
    }

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
    console.error('Clearance Retrieval Error:', error);
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
};

/**
 * OFFICER: FETCH ALL PENDING ITEMS
 */
export const getOfficerQueue = async (req, res) => {
  try {
    const officerDeptId = await resolveOfficerDepartmentId(req.user);

    if (!officerDeptId) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Your profile is not bound to a department.'
      });
    }

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

    return res.status(200).json({ success: true, queue });
  } catch (error) {
    console.error('Officer Queue Error:', error);
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
};

/**
 * OFFICER/ADMIN ACTION: APPROVE OR FLAG
 */
export const actionClearanceItem = async (req, res) => {
  const itemId = req.params.id;
  const { status, remarks } = req.body;
  const officerId = req.user.id;

  if (!status || !['APPROVED', 'FLAGGED'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid action payload.' });
  }

  try {
    const item = await db.get(
      `SELECT dci.*, d.name as dept_name, cr.student_id, cr.id as request_id 
       FROM dept_clearance_items dci 
       JOIN departments d ON dci.department_id = d.id 
       JOIN clearance_requests cr ON dci.request_id = cr.id 
       WHERE dci.id = ?`,
      [itemId]
    );

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found.' });
    }

    // SECURITY: an OFFICER may only action items in their own department.
    // ADMIN bypasses this. Department is resolved fresh from DB, not JWT.
    if (req.user.role === 'OFFICER') {
      const currentDeptId = await resolveOfficerDepartmentId(req.user);
      if (item.department_id !== currentDeptId) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: this item does not belong to your department.'
        });
      }
    }

    await db.run('BEGIN');

    await db.run(`
      UPDATE dept_clearance_items 
      SET status = ?, remarks = ?, actioned_by_officer_id = ?, actioned_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [status, remarks || null, officerId, itemId]);

    await db.run(`
      INSERT INTO audit_log (actor_id, action_type, entity_affected, details)
      VALUES (?, 'DEPARTMENTAL_DECISION', 'dept_clearance_items', ?)
    `, [officerId, `Changed item ID ${itemId} (${item.dept_name}) to ${status}. Remarks: ${remarks || 'None'}`]);

    await db.run(`
      INSERT INTO notifications (user_id, title, message)
      VALUES (?, ?, ?)
    `, [item.student_id, `Clearance Update: ${item.dept_name}`, `Status: ${status}. Remarks: ${remarks || 'None'}`]);

    const totalNodes = await db.get(
      'SELECT COUNT(*) as cnt FROM dept_clearance_items WHERE request_id = ?',
      [item.request_id]
    );
    const approvedNodes = await db.get(
      "SELECT COUNT(*) as cnt FROM dept_clearance_items WHERE request_id = ? AND status = 'APPROVED'",
      [item.request_id]
    );

    if (totalNodes.cnt === approvedNodes.cnt) {
      await db.run(
        "UPDATE clearance_requests SET overall_status = 'APPROVED', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [item.request_id]
      );
      await db.run(
        "INSERT INTO notifications (user_id, title, message) VALUES (?, 'Clearance Complete!', 'All departments have cleared your records.')",
        [item.student_id]
      );
    } else if (status === 'FLAGGED') {
      await db.run(
        "UPDATE clearance_requests SET overall_status = 'FLAGGED', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [item.request_id]
      );
    }

    await db.run('COMMIT');
    return res.status(200).json({ success: true, message: 'Status updated successfully.' });

  } catch (error) {
    await db.run('ROLLBACK').catch(() => {});
    console.error('Action Error:', error);
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
};