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
router.post('/', controllers_1.orderController.create);
router.get('/', controllers_1.orderController.findAll);
router.get('/export', controllers_1.orderController.export);
router.get('/:id', controllers_1.orderController.findById);
router.put('/:id', controllers_1.orderController.update);
router.delete('/:id', controllers_1.orderController.delete);
router.post('/bulk-update', controllers_1.orderController.bulkUpdate);
exports.default = router;
//# sourceMappingURL=order.routes.js.map