import { Router } from 'express';
import { listDepartments, listOfficers, reassignOfficerDepartment, getStats, getClearanceOverview, getAnalytics } from './admin.controller.js';
import authenticate from '../../middleware/authenticate.js';
import authorize from '../../middleware/authorize.js';

const router = Router();

router.get('/departments', authenticate, authorize(['ADMIN']), listDepartments);
router.get('/officers', authenticate, authorize(['ADMIN']), listOfficers);
router.patch('/officers/:id/department', authenticate, authorize(['ADMIN']), reassignOfficerDepartment);
router.get('/stats', authenticate, authorize(['ADMIN']), getStats);
router.get('/clearance-overview', authenticate, authorize(['ADMIN']), getClearanceOverview);
router.get('/analytics', authenticate, authorize(['ADMIN']), getAnalytics);

export default router;