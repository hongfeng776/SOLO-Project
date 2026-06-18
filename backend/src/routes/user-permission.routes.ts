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

router.post('/login/check-risk', userPermissionController.checkLoginRisk);
router.post('/login/verify-two-factor', userPermissionController.verifyTwoFactor);
router.get('/login-logs/list', authMiddleware, userPermissionController.getLoginLogs);
router.get('/login-logs/:id', authMiddleware, userPermissionController.getLoginLogDetail);
router.put('/login-logs/:id/mark-risk', authMiddleware, roleMiddleware(UserRole.ADMIN, UserRole.HR), userPermissionController.markLoginRisk);
router.put('/login-logs/:id/clear-risk', authMiddleware, roleMiddleware(UserRole.ADMIN, UserRole.HR), userPermissionController.clearLoginRisk);
router.post('/login-logs/batch/mark-risk', authMiddleware, roleMiddleware(UserRole.ADMIN, UserRole.HR), userPermissionController.batchMarkRisk);
router.post('/login-logs/batch/clear-risk', authMiddleware, roleMiddleware(UserRole.ADMIN, UserRole.HR), userPermissionController.batchClearRisk);
router.post('/login-logs/batch/clear-normal', authMiddleware, roleMiddleware(UserRole.ADMIN, UserRole.HR), userPermissionController.batchClearNormalRecords);
router.post('/login-logs/batch/lock-devices', authMiddleware, roleMiddleware(UserRole.ADMIN, UserRole.HR), userPermissionController.batchLockDevices);
router.post('/devices/lock', authMiddleware, roleMiddleware(UserRole.ADMIN, UserRole.HR), userPermissionController.lockDevice);
router.post('/devices/unlock', authMiddleware, roleMiddleware(UserRole.ADMIN, UserRole.HR), userPermissionController.unlockDevice);
router.get('/login-logs/:id/traceability', authMiddleware, userPermissionController.getLoginTraceability);
router.get('/login-logs/:id/verify-authenticity', authMiddleware, userPermissionController.verifyLoginAuthenticity);
router.get('/risk-report/generate', authMiddleware, userPermissionController.generateRiskReport);
router.get('/:userId/online-status', authMiddleware, userPermissionController.getUserOnlineStatus);

export default router;
