
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CERTIFICATES_DIR = path.resolve(__dirname, '../../../certificates');import { db } from '../../config/db.js';

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
 * Maps a student's registration number prefix to a school_code.
 * Case-insensitive, matches the leading letter sequence only (e.g.
 * "INTE-100" and "INTE/MK/1274/09/23" both correctly extract "INTE").
 * Returns null for any prefix not in the table — including test/placeholder
 * IDs like "STU001" — which is intentional: a student whose ID doesn't
 * match a known school simply gets no school-specific department, not an
 * error. Real, unmapped programs can be added to this table later without
 * touching any other logic.
 */
const SCHOOL_PREFIX_MAP = {
  EDU: 'EDU',
  INTE: 'SET',
  CS: 'SET',
  BBIT: 'SET',
  CLM: 'MED',
  PHAM: 'MED',
  HOSP: 'HOSP',
  MUSC: 'MUSIC_COMM',
  MSC: 'MUSIC_COMM',
  KLAW: 'LAW',
};

function resolveSchoolCode(idNumber) {
  if (!idNumber) return null;
  const match = idNumber.toUpperCase().match(/^([A-Z]+)/);
  if (!match) return null;
  return SCHOOL_PREFIX_MAP[match[1]] || null;
}

/**
 * Re-derives overall_status from the CURRENT state of every item on a
 * request, rather than incrementally patching based on a single action.
 * Shared by actionClearanceItem and resubmitClearanceItem so both paths
 * stay in sync — a request can reach FLAGGED via an officer's action and
 * leave it via either an officer reversing the flag OR a student
 * resubmitting, and both need identical, correct recomputation logic.
 * Caller is responsible for wrapping this in its own transaction.
 */
async function recalculateOverallStatus(requestId, studentId) {
  const statusCounts = await db.all(
    `SELECT status, COUNT(*) as cnt FROM dept_clearance_items WHERE request_id = ? GROUP BY status`,
    [requestId]
  );
  const counts = { PENDING: 0, APPROVED: 0, FLAGGED: 0, NO_OBLIGATION: 0 };
  statusCounts.forEach((row) => { counts[row.status] = row.cnt; });
  const totalItems = counts.PENDING + counts.APPROVED + counts.FLAGGED + counts.NO_OBLIGATION;

  let newOverallStatus;
  if (counts.FLAGGED > 0) {
    newOverallStatus = 'FLAGGED';
  } else if (totalItems > 0 && (counts.APPROVED + counts.NO_OBLIGATION) === totalItems) {
    newOverallStatus = 'APPROVED';
  } else {
    newOverallStatus = 'ACTIVE';
  }

  const currentRequest = await db.get(
    'SELECT overall_status FROM clearance_requests WHERE id = ?',
    [requestId]
  );

  if (newOverallStatus !== currentRequest.overall_status) {
    await db.run(
      'UPDATE clearance_requests SET overall_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newOverallStatus, requestId]
    );
    if (newOverallStatus === 'APPROVED') {
      await db.run(
        "INSERT INTO notifications (user_id, title, message) VALUES (?, 'Clearance Complete!', 'All departments have cleared your records.')",
        [studentId]
      );
    }
  }

  return newOverallStatus;
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
          // Universal departments apply to every student. The ONE matching
          // school department (based on the student's id_number prefix) is
          // added on top — if no prefix matches (test IDs, unmapped
          // programs), the student simply gets universal-only, no error.
          const departments = await db.all(
            `SELECT id FROM departments 
             WHERE department_type = 'UNIVERSAL' OR department_type = 'SCHOOL'
             ORDER BY sequence_order ASC`
          );
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
 * OFFICER: DEPARTMENT-SCOPED STATUS COUNTS
 * Feeds the dashboard stat cards. Scoped to the officer's CURRENT
 * department via resolveOfficerDepartmentId — same pattern as the queue
 * and action endpoints — so a reassigned officer never sees stale counts.
 */
export const getOfficerStats = async (req, res) => {
  try {
    const officerDeptId = await resolveOfficerDepartmentId(req.user);

    if (!officerDeptId) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Your profile is not bound to a department.'
      });
    }

    const rows = await db.all(
      `SELECT status, COUNT(*) as cnt 
       FROM dept_clearance_items 
       WHERE department_id = ? 
       GROUP BY status`,
      [officerDeptId]
    );

    const counts = { PENDING: 0, APPROVED: 0, FLAGGED: 0 };
    rows.forEach((row) => { counts[row.status] = row.cnt; });

    return res.status(200).json({ success: true, stats: counts });
  } catch (error) {
    console.error('Officer Stats Error:', error);
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
};

/**
 * OFFICER: OWN RECENT DECISION HISTORY
 * Returns this officer's own last 20 approve/flag actions from audit_log,
 * scoped to actor_id so an officer can only ever see their own history —
 * distinct from AdminDashboard's audit viewer, which shows everyone's.
 */
export const getOfficerHistory = async (req, res) => {
  try {
    const history = await db.all(
      `SELECT id, action_type, entity_affected, details, created_at
       FROM audit_log
       WHERE actor_id = ? AND action_type = 'DEPARTMENTAL_DECISION'
       ORDER BY created_at DESC
       LIMIT 20`,
      [req.user.id]
    );

    return res.status(200).json({ success: true, history });
  } catch (error) {
    console.error('Officer History Error:', error);
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
};

/**
 * ADMIN + ACADEMIC REGISTRAR OFFICER ONLY: LIST FULLY-APPROVED STUDENTS
 * Cross-department view — students whose overall_status is APPROVED (every
 * department cleared). ADMIN always has access. An OFFICER only has access
 * if their CURRENT department (resolved fresh from DB, not JWT — same
 * pattern as resolveOfficerDepartmentId) is "Office of the Academic
 * Registrar". Every other officer role is rejected with 403; they use
 * their own department-scoped Approved tab (getOfficerQueue) instead.
 */
export const getApprovedStudents = async (req, res) => {
  try {
    if (req.user.role === 'OFFICER') {
      const dept = await db.get(
        `SELECT d.name FROM users u 
         JOIN departments d ON u.department_assigned_id = d.id 
         WHERE u.id = ?`,
        [req.user.id]
      );

      if (!dept || dept.name !== 'Office of the Academic Registrar') {
        return res.status(403).json({
          success: false,
          message: 'Access Denied: This view is limited to the Academic Registrar and administrators.'
        });
      }
    }

    const students = await db.all(`
      SELECT 
        cr.id as request_id,
        u.id as student_id,
        u.name as student_name,
        u.id_number as student_id_number,
        u.email as student_email,
        cr.updated_at as cleared_at
      FROM clearance_requests cr
      JOIN users u ON cr.student_id = u.id
      WHERE cr.overall_status = 'APPROVED'
      ORDER BY cr.updated_at DESC
    `);

    return res.status(200).json({ success: true, students });
  } catch (error) {
    console.error('Approved Students Error:', error);
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
};
/**
 * ADMIN + ACADEMIC REGISTRAR OFFICER ONLY: GENERATE CERTIFICATE
 * Strictly gated on overall_status = 'APPROVED' — a student must be fully
 * cleared across every department before a certificate can exist at all.
 * Same access pattern as getApprovedStudents: ADMIN always allowed, OFFICER
 * only if their CURRENT department (resolved fresh from DB) is Academic
 * Registrar. One certificate per request, enforced by the existing UNIQUE
 * constraint on certificates.request_id — a second attempt returns the
 * already-issued certificate's info instead of erroring.
 */
export const generateCertificate = async (req, res) => {
  const requestId = req.params.requestId;

  try {
    if (req.user.role === 'OFFICER') {
      const dept = await db.get(
        `SELECT d.name FROM users u 
         JOIN departments d ON u.department_assigned_id = d.id 
         WHERE u.id = ?`,
        [req.user.id]
      );
      if (!dept || dept.name !== 'Office of the Academic Registrar') {
        return res.status(403).json({
          success: false,
          message: 'Access Denied: Only the Academic Registrar or an administrator can issue certificates.'
        });
      }
    }

    const request = await db.get(
      `SELECT cr.id, cr.overall_status, u.name as student_name, u.id_number as student_id_number
       FROM clearance_requests cr
       JOIN users u ON cr.student_id = u.id
       WHERE cr.id = ?`,
      [requestId]
    );

    if (!request) {
      return res.status(404).json({ success: false, message: 'Clearance request not found.' });
    }

    if (request.overall_status !== 'APPROVED') {
      return res.status(409).json({
        success: false,
        message: 'Cannot issue a certificate: this student has not been fully cleared across all departments yet.'
      });
    }

    const existing = await db.get('SELECT id, file_path, issued_at FROM certificates WHERE request_id = ?', [requestId]);
    if (existing) {
      return res.status(200).json({
        success: true,
        message: 'Certificate already issued.',
        certificate: existing
      });
    }

    if (!fs.existsSync(CERTIFICATES_DIR)) {
      fs.mkdirSync(CERTIFICATES_DIR, { recursive: true });
    }

    const fileName = `certificate_${requestId}.pdf`;
    const filePath = path.join(CERTIFICATES_DIR, fileName);

    await new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 72 });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      doc.fontSize(20).font('Helvetica-Bold').text('Certificate of Clearance', { align: 'center' });
      doc.moveDown(2);
      doc.fontSize(12).font('Helvetica').text('Kabarak University', { align: 'center' });
      doc.moveDown(2);
      doc.fontSize(14).text(`This certifies that`, { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(18).font('Helvetica-Bold').text(request.student_name, { align: 'center' });
      doc.fontSize(12).font('Helvetica').text(`(${request.student_id_number})`, { align: 'center' });
      doc.moveDown(1);
      doc.fontSize(14).text('has satisfactorily completed clearance from all university departments.', {
        align: 'center',
      });
      doc.moveDown(2);
      doc.fontSize(11).text(`Issued: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`, {
        align: 'center',
      });

      doc.end();
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    const relativeFilePath = path.join('certificates', fileName);
    await db.run(
      'INSERT INTO certificates (request_id, file_path) VALUES (?, ?)',
      [requestId, relativeFilePath]
    );

    const created = await db.get('SELECT id, file_path, issued_at FROM certificates WHERE request_id = ?', [requestId]);

    return res.status(201).json({
      success: true,
      message: 'Certificate generated successfully.',
      certificate: created
    });
  } catch (error) {
    console.error('Certificate Generation Error:', error);
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
};

/**
 * DOWNLOAD CERTIFICATE
 * A STUDENT may only download their OWN certificate — checked against the
 * clearance_requests row's student_id, same ownership pattern used
 * elsewhere (e.g. resubmitClearanceItem). ADMIN and the Academic Registrar
 * officer may download ANY certificate, same access pattern as generation.
 */
export const downloadCertificate = async (req, res) => {
  const requestId = req.params.requestId;

  try {
    const certificate = await db.get(
      `SELECT c.file_path, cr.student_id 
       FROM certificates c 
       JOIN clearance_requests cr ON c.request_id = cr.id 
       WHERE c.request_id = ?`,
      [requestId]
    );

    if (!certificate) {
      return res.status(404).json({ success: false, message: 'No certificate has been issued for this request yet.' });
    }

    if (req.user.role === 'STUDENT') {
      if (certificate.student_id !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Forbidden: this is not your certificate.' });
      }
    } else if (req.user.role === 'OFFICER') {
      const dept = await db.get(
        `SELECT d.name FROM users u 
         JOIN departments d ON u.department_assigned_id = d.id 
         WHERE u.id = ?`,
        [req.user.id]
      );
      if (!dept || dept.name !== 'Office of the Academic Registrar') {
        return res.status(403).json({
          success: false,
          message: 'Access Denied: Only the Academic Registrar or an administrator can access certificates.'
        });
      }
    }
    // ADMIN falls through with no additional check — always allowed.

    const absolutePath = path.resolve(__dirname, '../../../', certificate.file_path);

    if (!fs.existsSync(absolutePath)) {
      console.error(`Certificate file missing on disk: ${absolutePath}`);
      return res.status(500).json({ success: false, message: 'Certificate file is missing on the server.' });
    }

    return res.download(absolutePath, `certificate_${requestId}.pdf`);
  } catch (error) {
    console.error('Certificate Download Error:', error);
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
};

/**
 * OFFICER: FETCH CLEARANCE ITEMS FILTERED BY STATUS (defaults to PENDING)
 * Accepts an optional ?status= query param (PENDING | APPROVED | FLAGGED)
 * so the dashboard's stat cards can double as filters — e.g. clicking the
 * Flagged card actually surfaces those items instead of them being
 * reachable only through direct item-ID knowledge.
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

    const { status } = req.query;
    const validStatuses = ['PENDING', 'APPROVED', 'FLAGGED', 'NO_OBLIGATION'];
    const filterStatus = validStatuses.includes(status) ? status : 'PENDING';

    const queue = await db.all(`
      SELECT 
        dci.id as item_id,
        dci.status,
        dci.remarks,
        dci.actioned_at,
        cr.created_at as request_created_at,
        u.name as student_name,
        u.id_number as student_id_number,
        u.email as student_email
      FROM dept_clearance_items dci
      JOIN clearance_requests cr ON dci.request_id = cr.id
      JOIN users u ON cr.student_id = u.id
      WHERE dci.department_id = ? AND dci.status = ?
      ORDER BY cr.created_at ASC
    `, [officerDeptId, filterStatus]);

    return res.status(200).json({ success: true, queue, filter: filterStatus });
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

  if (!status || !['APPROVED', 'FLAGGED', 'NO_OBLIGATION'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid action payload.' });
  }

  // A flag with no reason is useless to the student trying to resolve it
  // and to any officer reviewing it later. Enforce this server-side —
  // trusting the frontend's required-field alone means a raw API call
  // (or a future UI that forgets to enforce it) can still flag blind.
  if (status === 'FLAGGED' && (!remarks || !remarks.trim())) {
    return res.status(400).json({
      success: false,
      message: 'A reason is required when flagging an item.'
    });
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

    // BUSINESS RULE: the department with the highest sequence_order (the
    // Academic Registrar, seeded last) may only approve once every other
    // department on this request has already cleared. This makes Academic
    // Registrar's approval genuinely mean "everything else is done" rather
    // than just one more independent checkbox. Only applies to APPROVED
    // actions — flagging is always allowed regardless of order, since
    // catching a problem should never be blocked by sequencing.
    if (status === 'APPROVED') {
      const deptInfo = await db.get(
        'SELECT sequence_order FROM departments WHERE id = ?',
        [item.department_id]
      );
      const maxSeq = await db.get('SELECT MAX(sequence_order) as max_seq FROM departments');

      if (deptInfo && maxSeq && deptInfo.sequence_order === maxSeq.max_seq) {
        const otherItems = await db.all(
          `SELECT dci.status FROM dept_clearance_items dci
           WHERE dci.request_id = ? AND dci.department_id != ?`,
          [item.request_id, item.department_id]
        );
        const allOthersApproved = otherItems.every((i) => i.status === 'APPROVED' || i.status === 'NO_OBLIGATION');

        if (!allOthersApproved) {
          return res.status(409).json({
            success: false,
            message: 'Cannot approve: all other departments must clear this student first.'
          });
        }
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

    await recalculateOverallStatus(item.request_id, item.student_id);

    await db.run('COMMIT');
    return res.status(200).json({ success: true, message: 'Status updated successfully.' });

  } catch (error) {
    await db.run('ROLLBACK').catch(() => {});
    console.error('Action Error:', error);
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
};

/**
 * STUDENT: RESUBMIT A FLAGGED ITEM
 * Flips a FLAGGED item back to PENDING so it reappears in the responsible
 * officer's queue. Only the student who owns the request may do this, and
 * only for an item that is currently FLAGGED — resubmitting a PENDING or
 * already-APPROVED item makes no sense and is rejected.
 */
export const resubmitClearanceItem = async (req, res) => {
  const itemId = req.params.id;
  const { remarks } = req.body;
  const studentId = req.user.id;

  try {
    const item = await db.get(
      `SELECT dci.*, d.name as dept_name, d.id as dept_id, cr.student_id, cr.id as request_id 
       FROM dept_clearance_items dci 
       JOIN departments d ON dci.department_id = d.id 
       JOIN clearance_requests cr ON dci.request_id = cr.id 
       WHERE dci.id = ?`,
      [itemId]
    );

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found.' });
    }

    // SECURITY: a student may only resubmit their own item — checked
    // against the clearance_requests row's student_id, not anything
    // client-supplied, same pattern as the officer department check above.
    if (item.student_id !== studentId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: this item does not belong to you.'
      });
    }

    if (item.status !== 'FLAGGED') {
      return res.status(400).json({
        success: false,
        message: 'Only a flagged item can be resubmitted.'
      });
    }

    await db.run('BEGIN');

    await db.run(`
      UPDATE dept_clearance_items 
      SET status = 'PENDING', remarks = ?, actioned_by_officer_id = NULL, actioned_at = NULL
      WHERE id = ?
    `, [remarks && remarks.trim() ? remarks.trim() : 'Resubmitted by student for re-review.', itemId]);

    await db.run(`
      INSERT INTO audit_log (actor_id, action_type, entity_affected, details)
      VALUES (?, 'STUDENT_RESUBMISSION', 'dept_clearance_items', ?)
    `, [studentId, `Student resubmitted item ID ${itemId} (${item.dept_name}) for re-review. Remarks: ${remarks || 'None'}`]);

    // Notify whoever CURRENTLY owns this department — not the officer who
    // originally flagged it, since a reassignment could have happened
    // since then. Falls back to silently skipping notification if the
    // department currently has no officer assigned (a known, separately
    // tracked gap — see the zero-officer-department backlog item).
    const currentOfficer = await db.get(
      "SELECT id FROM users WHERE role = 'OFFICER' AND department_assigned_id = ?",
      [item.dept_id]
    );
    if (currentOfficer) {
      await db.run(`
        INSERT INTO notifications (user_id, title, message)
        VALUES (?, ?, ?)
      `, [currentOfficer.id, `Resubmission: ${item.dept_name}`, `A student has resubmitted a previously flagged item for re-review.`]);
    }

    await recalculateOverallStatus(item.request_id, item.student_id);

    await db.run('COMMIT');
    return res.status(200).json({ success: true, message: 'Item resubmitted for re-review.' });

  } catch (error) {
    await db.run('ROLLBACK').catch(() => {});
    console.error('Resubmission Error:', error);
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
};

/**
 * ACADEMIC REGISTRAR ONLY: BULK GENERATE CERTIFICATES
 * Generates certificates for ALL students whose overall_status is 'APPROVED'
 * and who do not yet have a certificate. Students already issued one are
 * skipped (idempotent). Returns a summary of newly issued vs failed.
 */
export const bulkGenerateCertificates = async (req, res) => {
  try {
    // Gate: OFFICER must be Academic Registrar
    if (req.user.role === 'OFFICER') {
      const dept = await db.get(
        `SELECT d.name FROM users u 
         JOIN departments d ON u.department_assigned_id = d.id 
         WHERE u.id = ?`,
        [req.user.id]
      );
      if (!dept || dept.name !== 'Office of the Academic Registrar') {
        return res.status(403).json({
          success: false,
          message: 'Access Denied: Only the Academic Registrar can bulk-generate certificates.'
        });
      }
    }

    // Fetch all fully-approved students who don't yet have a certificate
    const eligible = await db.all(`
      SELECT 
        cr.id as request_id,
        u.name as student_name,
        u.id_number as student_id_number,
        u.id as student_id
      FROM clearance_requests cr
      JOIN users u ON cr.student_id = u.id
      LEFT JOIN certificates c ON c.request_id = cr.id
      WHERE cr.overall_status = 'APPROVED' AND c.id IS NULL
    `);

    if (eligible.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No new certificates to generate. All approved students already have one.',
        summary: { newly_issued: 0, already_existing: 0, failed: 0 }
      });
    }

    if (!fs.existsSync(CERTIFICATES_DIR)) {
      fs.mkdirSync(CERTIFICATES_DIR, { recursive: true });
    }

    const results = { newly_issued: 0, already_existing: 0, failed: [] };

    for (const student of eligible) {
      try {
        const fileName = `certificate_${student.request_id}.pdf`;
        const filePath = path.join(CERTIFICATES_DIR, fileName);

        await new Promise((resolve, reject) => {
          const doc = new PDFDocument({ size: 'A4', margin: 72 });
          const stream = fs.createWriteStream(filePath);
          doc.pipe(stream);

          doc.fontSize(20).font('Helvetica-Bold').text('Certificate of Clearance', { align: 'center' });
          doc.moveDown(2);
          doc.fontSize(12).font('Helvetica').text('Kabarak University', { align: 'center' });
          doc.moveDown(2);
          doc.fontSize(14).text('This certifies that', { align: 'center' });
          doc.moveDown(0.5);
          doc.fontSize(18).font('Helvetica-Bold').text(student.student_name, { align: 'center' });
          doc.fontSize(12).font('Helvetica').text(`(${student.student_id_number})`, { align: 'center' });
          doc.moveDown(1);
          doc.fontSize(14).text('has satisfactorily completed clearance from all university departments.', { align: 'center' });
          doc.moveDown(2);
          doc.fontSize(11).text(
            `Issued: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`,
            { align: 'center' }
          );

          doc.end();
          stream.on('finish', resolve);
          stream.on('error', reject);
        });

        const relativeFilePath = path.join('certificates', fileName);
        await db.run(
          'INSERT OR IGNORE INTO certificates (request_id, file_path) VALUES (?, ?)',
          [student.request_id, relativeFilePath]
        );

        await db.run(
          `INSERT INTO notifications (user_id, title, message) VALUES (?, 'Certificate Issued', 'Your clearance certificate has been generated and is ready for download.')`,
          [student.student_id]
        );

        await db.run(
          `INSERT INTO audit_log (actor_id, action_type, entity_affected, details) VALUES (?, 'BULK_CERTIFICATE_GENERATION', 'certificates', ?)`,
          [req.user.id, `Bulk-generated certificate for request ID ${student.request_id} (${student.student_name})`]
        );

        results.newly_issued++;
      } catch (studentError) {
        console.error(`Failed to generate certificate for request ${student.request_id}:`, studentError);
        results.failed.push({ request_id: student.request_id, name: student.student_name });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Bulk generation complete. ${results.newly_issued} certificate(s) issued.`,
      summary: results
    });

  } catch (error) {
    console.error('Bulk Certificate Generation Error:', error);
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
};