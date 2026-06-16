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
router.post('/', controllers_1.promoterController.create);
router.get('/', controllers_1.promoterController.findAll);
router.get('/:id', controllers_1.promoterController.findById);
router.put('/:id', controllers_1.promoterController.update);
router.delete('/:id', controllers_1.promoterController.delete);
router.post('/bulk-delete', controllers_1.promoterController.bulkDelete);
router.patch('/:id/status', controllers_1.promoterController.updateStatus);
exports.default = router;
//# sourceMappingURL=promoter.routes.js.map