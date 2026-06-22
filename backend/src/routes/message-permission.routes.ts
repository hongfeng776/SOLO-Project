import express from 'express';
import {
  getPermissionList,
  getPermissionById,
  getMyPermission,
  getPermissionByUserId,
  createPermission,
  updatePermission,
  enablePermission,
  disablePermission,
  validatePermissionConfig,
  batchUpdateByRole,
  batchUpdateByDepartment,
  batchStandardize,
  batchDisableRedundant,
  getPermissionLogs,
  getPermissionLogsByPermissionId,
  getPermissionStats,
} from '../controllers/message-permission.controller';
import { authMiddleware, roleMiddleware } from '../middleware/auth.middleware';
import { UserRole } from '../constants/recruitment.enum';

const router = express.Router();

router.get('/stats', authMiddleware, getPermissionStats);

router.get('/my', authMiddleware, getMyPermission);

router.get('/logs', authMiddleware, getPermissionLogs);

router.get('/logs/:permissionId', authMiddleware, getPermissionLogsByPermissionId);

router.post('/validate', authMiddleware, validatePermissionConfig);

router.post('/batch/by-role', authMiddleware, roleMiddleware(UserRole.ADMIN), batchUpdateByRole);

router.post('/batch/by-department', authMiddleware, roleMiddleware(UserRole.ADMIN), batchUpdateByDepartment);

router.post('/batch/standardize', authMiddleware, roleMiddleware(UserRole.ADMIN), batchStandardize);

router.post('/batch/disable-redundant', authMiddleware, roleMiddleware(UserRole.ADMIN), batchDisableRedundant);

router.get('/user/:userId', authMiddleware, getPermissionByUserId);

router.get('/:id', authMiddleware, getPermissionById);

router.post('/', authMiddleware, roleMiddleware(UserRole.ADMIN), createPermission);

router.put('/:id', authMiddleware, roleMiddleware(UserRole.ADMIN), updatePermission);

router.patch('/:id/enable', authMiddleware, roleMiddleware(UserRole.ADMIN), enablePermission);

router.patch('/:id/disable', authMiddleware, roleMiddleware(UserRole.ADMIN), disablePermission);

router.get('/', authMiddleware, getPermissionList);

export default router;
