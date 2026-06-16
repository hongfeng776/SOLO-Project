import { Router } from 'express';
import { LogController } from '../controllers';
import { requirePermission } from '../middlewares';

const router = Router();
const logController = new LogController();

router.get('/operation/list', requirePermission('log:operation:query'), (req, res, next) => logController.list(req, res, next));
router.get('/operation/:id', requirePermission('log:operation:query'), (req, res, next) => logController.detail(req, res, next));
router.delete('/operation/:id', requirePermission('log:operation:delete'), (req, res, next) => logController.delete(req, res, next));
router.post('/operation/clear', requirePermission('log:operation:delete'), (req, res, next) => logController.clear(req, res, next));
router.post('/operation/export', requirePermission('log:operation:export'), (req, res, next) => logController.export(req, res, next));

export default router;
