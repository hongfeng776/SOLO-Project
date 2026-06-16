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
router.post('/', controllers_1.commissionController.create);
router.get('/', controllers_1.commissionController.findAll);
router.get('/summary', controllers_1.commissionController.summary);
router.post('/settle', controllers_1.commissionController.settle);
router.post('/deduct', controllers_1.commissionController.deduct);
router.get('/:id', controllers_1.commissionController.findById);
router.put('/:id', controllers_1.commissionController.update);
router.delete('/:id', controllers_1.commissionController.delete);
exports.default = router;
//# sourceMappingURL=commission.routes.js.map