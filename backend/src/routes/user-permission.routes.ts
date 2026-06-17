import { Router } from 'express';
import userPermissionController from '../controllers/user-permission.controller';
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware';
import { UserRole } from '../constants/recruitment.enum';

const router = Router();

router.get('/', authMiddleware, userPermissionController.getList);
router.get('/:id', authMiddleware, userPermissionController.getDetail);
router.get('/company/:companyId/qualification', authMiddleware, userPermissionController.checkQualification);
router.get('/role/permissions', authMiddleware, userPermissionController.getRolePermissions);
router.get('/check/username', authMiddleware, userPermissionController.checkUsername);
router.post('/validate', authMiddleware, userPermissionController.validateData);
router.get('/:id/is-main', authMiddleware, userPermissionController.checkIsMainAccount);
router.post('/sub-account', authMiddleware, roleMiddleware(UserRole.ADMIN, UserRole.HR), userPermissionController.createSubAccount);
router.put('/:id', authMiddleware, roleMiddleware(UserRole.ADMIN, UserRole.HR), userPermissionController.update);
router.put('/:id/freeze', authMiddleware, roleMiddleware(UserRole.ADMIN, UserRole.HR), userPermissionController.freezeAccount);
router.put('/:id/unfreeze', authMiddleware, roleMiddleware(UserRole.ADMIN, UserRole.HR), userPermissionController.unfreezeAccount);
router.post('/batch/assign-permissions', authMiddleware, roleMiddleware(UserRole.ADMIN, UserRole.HR), userPermissionController.batchAssignPermissions);
router.post('/batch/freeze', authMiddleware, roleMiddleware(UserRole.ADMIN, UserRole.HR), userPermissionController.batchFreeze);
router.get('/permission-logs/list', authMiddleware, userPermissionController.getPermissionLogs);
router.get('/:userId/permission-logs', authMiddleware, userPermissionController.getPermissionLogsByUserId);
router.get('/login-logs/list', authMiddleware, userPermissionController.getLoginLogs);

export default router;
