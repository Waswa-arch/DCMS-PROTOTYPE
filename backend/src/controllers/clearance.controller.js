import { db } from '../config/db.js';

/**
 * INITIATE STUDENT CLEARANCE REQUEST
 * Creates a master request and maps tracking nodes across all seeded departments
 */
export const initiateClearance = async (req, res, next) => {
  // req.user is populated by your JWT authentication middleware
  const studentId = req.user.id; 

  try {
    // 1. Prevent duplicate master tracking entries
    const existingRequest = await db.get(
      'SELECT id FROM clearance_requests WHERE student_id = ?',
      [studentId]
    );

    if (existingRequest) {
      return res.status(409).json({
        success: false,
        message: 'You have already initiated a clearance tracking sequence.'
      });
    }

    // 2. Fetch all seeded institutional departments dynamically
    const departments = await db.all('SELECT id FROM departments ORDER BY sequence_order ASC');
    
    if (!departments || departments.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'System tracking failure: Institutional departments are not seeded.'
      });
    }

    // 3. Open a secure database transaction block to guarantee atomic writes
    await db.run('BEGIN TRANSACTION');

    // 4. Create the Master Clearance Request
    const masterResult = await db.run(
      'INSERT INTO clearance_requests (student_id, overall_status) VALUES (?, ?)',
      [studentId, 'ACTIVE']
    );
    
    const requestId = masterResult.lastID;

    // 5. Build granular pending workflow items for EVERY department found
    for (const dept of departments) {
      await db.run(
        `INSERT INTO dept_clearance_items (request_id, department_id, status, remarks) 
         VALUES (?, ?, 'PENDING', 'Awaiting administrative review.')`,
        [requestId, dept.id]
      );
    }

    // 6. Commit the entire batch sequence permanently to disk
    await db.run('COMMIT');

    return res.status(201).json({
      success: true,
      message: 'Clearance tracking workflow initiated successfully across all departments.'
    });

  } catch (error) {
    // Rollback changes immediately if any query crashes
    await db.run('ROLLBACK').catch(() => {});
    next(error);
  }
};

/**
 * FETCH STUDENT CLEARANCE STATUS
 * Retrieves the master tracking profile alongside status nodes for each department
 */
export const getStudentClearanceStatus = async (req, res, next) => {
  const studentId = req.user.id;

  try {
    // Get master tracking overview
    const request = await db.get(
      'SELECT * FROM clearance_requests WHERE student_id = ?',
      [studentId]
    );

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'No active clearance requests found for this profile.'
      });
    }

    // Join item nodes with department profiles to get clear readable labels
    const items = await db.all(
      `SELECT d.name AS department_name, d.sequence_order, item.status, item.remarks, item.actioned_at
       FROM dept_clearance_items item
       JOIN departments d ON item.department_id = d.id
       WHERE item.request_id = ?
       ORDER BY d.sequence_order ASC`,
      [request.id]
    );

    return res.status(200).json({
      success: true,
      data: {
        overall_status: request.overall_status,
        initiated_at: request.created_at,
        departments: items
      }
    });

  } catch (error) {
    next(error);
  }
};