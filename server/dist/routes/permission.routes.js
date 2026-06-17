"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../controllers");
const auth_middleware_1 = __importDefault(require("../middleware/auth.middleware"));
const router = (0, express_1.Router)();
router.use(auth_middleware_1.default);
router.post('/', controllers_1.permissionController.createPermission);
router.get('/tree', controllers_1.permissionController.findTree);
router.post('/batch-status', controllers_1.permissionController.updateStatusBatch);
router.post('/batch-sort', controllers_1.permissionController.batchSort);
router.get('/idle', controllers_1.permissionController.findIdlePermissions);
router.get('/module/:module', controllers_1.permissionController.findByModule);
router.get('/:id/dependencies', controllers_1.permissionController.checkDeleteDependencies);
router.get('/:id', controllers_1.permissionController.findById);
router.put('/:id', controllers_1.permissionController.updatePermission);
router.delete('/:id', controllers_1.permissionController.deletePermission);
router.post('/bulk-delete', controllers_1.permissionController.bulkDelete);
router.patch('/:id/status', controllers_1.permissionController.updateStatus);
exports.default = router;
//# sourceMappingURL=permission.routes.js.map