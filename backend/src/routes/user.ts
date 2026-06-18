import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import userController from '../controllers/UserController';

const router = Router();

router.use(authMiddleware);

router.get('/list', userController.getUserList);
router.get('/detail/:id', userController.getUserDetail);
router.get('/full-info/:id', userController.getUserFullInfo);
router.post('/create', userController.createUser);
router.put('/update/:id', userController.updateUser);
router.delete('/delete/:id', userController.deleteUser);
router.post('/batch-delete', userController.batchDeleteUsers);
router.put('/status/:id', userController.updateUserStatus);
router.get('/edit-permission', userController.getUserEditPermission);
router.get('/register-channels', userController.getRegisterChannels);
router.post('/validate', userController.validateField);
router.get('/statistics', userController.getUserStatistics);
router.post('/statistics/update', userController.updateStatistics);
router.get('/profile-logs/:id', userController.getUserProfileLogs);

export default router;
