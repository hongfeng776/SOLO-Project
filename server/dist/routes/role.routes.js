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
router.post('/', controllers_1.roleController.create);
router.get('/', controllers_1.roleController.findAll);
router.get('/:id', controllers_1.roleController.findById);
router.put('/:id', controllers_1.roleController.update);
router.delete('/:id', controllers_1.roleController.delete);
router.post('/bulk-delete', controllers_1.roleController.bulkDelete);
router.patch('/:id/status', controllers_1.roleController.updateStatus);
router.post('/:id/permissions', controllers_1.roleController.assignPermissions);
router.get('/:id/permissions', controllers_1.roleController.getPermissions);
exports.default = router;
//# sourceMappingURL=role.routes.js.map