import { Router } from 'express';
import { OrganizationController } from '../controllers';
import { requirePermission } from '../middlewares';

const router = Router();
const organizationController = new OrganizationController();

router.get('/tree', requirePermission('system:org:query'), (req, res, next) => organizationController.tree(req, res, next));
router.get('/list', requirePermission('system:org:query'), (req, res, next) => organizationController.list(req, res, next));
router.get('/options', requirePermission('system:org:query'), (req, res, next) => organizationController.options(req, res, next));
router.get('/:id', requirePermission('system:org:query'), (req, res, next) => organizationController.detail(req, res, next));
router.post('/', requirePermission('system:org:create'), (req, res, next) => organizationController.create(req, res, next));
router.put('/:id', requirePermission('system:org:update'), (req, res, next) => organizationController.update(req, res, next));
router.delete('/:id', requirePermission('system:org:delete'), (req, res, next) => organizationController.delete(req, res, next));

export default router;
