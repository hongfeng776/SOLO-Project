import { Router } from 'express';
import { AuditController } from '../controllers';
import { requirePermission } from '../middlewares';

const router = Router();
const auditController = new AuditController();

router.get('/pending/list', requirePermission('audit:record:audit'), (req, res, next) => auditController.pendingList(req, res, next));
router.get('/history/list', requirePermission('audit:record:query'), (req, res, next) => auditController.historyList(req, res, next));
router.get('/:id', requirePermission('audit:record:query'), (req, res, next) => auditController.detail(req, res, next));
router.put('/:id/approve', requirePermission('audit:record:audit'), (req, res, next) => auditController.approve(req, res, next));
router.put('/:id/reject', requirePermission('audit:record:audit'), (req, res, next) => auditController.reject(req, res, next));
router.post('/batch', requirePermission('audit:record:audit'), (req, res, next) => auditController.batchAudit(req, res, next));

router.get('/rule/list', requirePermission('audit:rule:query'), (req, res, next) => auditController.ruleList(req, res, next));
router.get('/rule/:id', requirePermission('audit:rule:query'), (req, res, next) => auditController.ruleDetail(req, res, next));
router.post('/rule', requirePermission('audit:rule:create'), (req, res, next) => auditController.ruleCreate(req, res, next));
router.put('/rule/:id', requirePermission('audit:rule:update'), (req, res, next) => auditController.ruleUpdate(req, res, next));
router.put('/rule/:id/delete', requirePermission('audit:rule:delete'), (req, res, next) => auditController.ruleDelete(req, res, next));

export default router;
