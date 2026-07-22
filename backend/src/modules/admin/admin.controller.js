import { db } from '../../config/db.js';

export const listDepartments = async (req, res) => {
  try {
    const departments = await db.all(
      'SELECT id, name, sequence_order FROM departments ORDER BY sequence_order ASC'
    );
    return res.status(200).json({ success: true, departments });
  } catch (error) {
    console.error('Admin Department List Error:', error);
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
};

export const listOfficers = async (req, res) => {
  try {
    const officers = await db.all(`
      SELECT
        u.id, u.id_number, u.name, u.email, u.department_assigned_id,
        d.name as department_name, u.created_at
      FROM users u
      LEFT JOIN departments d ON u.department_assigned_id = d.id
      WHERE u.role = 'OFFICER'
      ORDER BY u.created_at DESC
    `);
    return res.status(200).json({ success: true, officers });
  } catch (error) {
    console.error('Admin Officer List Error:', error);
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
};

export const reassignOfficerDepartment = async (req, res) => {
  const officerId = req.params.id;
  const { department_id } = req.body;
  const adminId = req.user.id;

  if (!department_id) {
    return res.status(400).json({ success: false, message: 'department_id is required.' });
  }

  try {
    const officer = await db.get(
      "SELECT id, name, department_assigned_id FROM users WHERE id = ? AND role = 'OFFICER'",
      [officerId]
    );
    if (!officer) {
      return res.status(404).json({ success: false, message: 'Officer not found.' });
    }

    const department = await db.get('SELECT id, name FROM departments WHERE id = ?', [department_id]);
    if (!department) {
      return res.status(400).json({ success: false, message: 'Target department does not exist.' });
    }

    if (officer.department_assigned_id === department.id) {
      return res.status(400).json({ success: false, message: 'Officer is already assigned to that department.' });
    }

    await db.run('BEGIN');
    await db.run('UPDATE users SET department_assigned_id = ? WHERE id = ?', [department.id, officerId]);
    await db.run(`
      INSERT INTO audit_log (actor_id, action_type, entity_affected, details)
      VALUES (?, 'OFFICER_DEPARTMENT_REASSIGNMENT', 'users', ?)
    `, [adminId, `Reassigned officer "${officer.name}" (ID ${officer.id}) from department ${officer.department_assigned_id ?? 'NONE'} to "${department.name}" (ID ${department.id}).`]);

    // SAFETY CHECK: if the officer's OLD department now has zero officers
    // left, warn the admin immediately. A department with no officer means
    // every student's clearance item there is permanently stuck PENDING
    // with nobody able to act on it — this already happened once for real
    // and was only caught by accident. Only checked if they actually HAD an
    // old department (won't fire on an officer's very first assignment).
    if (officer.department_assigned_id) {
      const remaining = await db.get(
        "SELECT COUNT(*) as count FROM users WHERE role = 'OFFICER' AND department_assigned_id = ?",
        [officer.department_assigned_id]
      );

      if (remaining.count === 0) {
        const oldDept = await db.get('SELECT name FROM departments WHERE id = ?', [officer.department_assigned_id]);
        await db.run(`
          INSERT INTO notifications (user_id, title, message)
          VALUES (?, 'Department Has No Officer', ?)
        `, [adminId, `"${oldDept?.name || 'A department'}" now has zero officers assigned, following the reassignment of ${officer.name}. Students awaiting clearance from this department cannot be processed until an officer is assigned.`]);
      }
    }

    await db.run('COMMIT');

    return res.status(200).json({
      success: true,
      message: `Officer reassigned to ${department.name}. Takes effect immediately on their next request.`
    });
  } catch (error) {
    await db.run('ROLLBACK').catch(() => {});
    console.error('Admin Reassignment Error:', error);
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
};

export const getStats = async (req, res) => {
  try {
    const [
      studentCount,
      officerCount,
      deptCount,
      clearanceStats,
      recentAudit
    ] = await Promise.all([
      db.get("SELECT COUNT(*) as count FROM users WHERE role='STUDENT'"),
      db.get("SELECT COUNT(*) as count FROM users WHERE role='OFFICER'"),
      db.get("SELECT COUNT(*) as count FROM departments"),
      db.all("SELECT overall_status, COUNT(*) as count FROM clearance_requests GROUP BY overall_status"),
      db.all(`
        SELECT
          al.id, al.action_type, al.details, al.created_at,
          u.name as actor_name, u.role as actor_role
        FROM audit_log al
        LEFT JOIN users u ON al.actor_id = u.id
        ORDER BY al.created_at DESC
        LIMIT 20
      `)
    ]);

    const statusMap = { ACTIVE: 0, APPROVED: 0, FLAGGED: 0 };
    clearanceStats.forEach(row => { statusMap[row.overall_status] = row.count; });

    return res.status(200).json({
      success: true,
      stats: {
        students: studentCount.count,
        officers: officerCount.count,
        departments: deptCount.count,
        clearance: statusMap,
        total_requests: Object.values(statusMap).reduce((a, b) => a + b, 0)
      },
      recent_audit: recentAudit
    });
  } catch (error) {
    console.error('Admin Stats Error:', error);
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
};

export const getClearanceOverview = async (req, res) => {
  try {
    const overview = await db.all(`
      SELECT
        u.id as student_id,
        u.name as student_name,
        u.id_number as student_id_number,
        u.email as student_email,
        cr.id as request_id,
        cr.overall_status,
        cr.created_at,
        cr.updated_at,
        COUNT(dci.id) as total_items,
        SUM(CASE WHEN dci.status = 'APPROVED' THEN 1 ELSE 0 END) as approved_items,
        SUM(CASE WHEN dci.status = 'FLAGGED' THEN 1 ELSE 0 END) as flagged_items,
        SUM(CASE WHEN dci.status = 'PENDING' THEN 1 ELSE 0 END) as pending_items
      FROM users u
      LEFT JOIN clearance_requests cr ON cr.student_id = u.id
      LEFT JOIN dept_clearance_items dci ON dci.request_id = cr.id
      WHERE u.role = 'STUDENT'
      GROUP BY u.id, cr.id
      ORDER BY cr.created_at DESC
    `);

    return res.status(200).json({ success: true, overview });
  } catch (error) {
    console.error('Admin Clearance Overview Error:', error);
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
};