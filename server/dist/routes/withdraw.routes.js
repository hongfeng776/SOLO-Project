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
router.post('/', controllers_1.withdrawController.create);
router.post('/apply', controllers_1.withdrawController.apply);
router.get('/', controllers_1.withdrawController.findAll);
router.get('/:id', controllers_1.withdrawController.findById);
router.put('/:id', controllers_1.withdrawController.update);
router.delete('/:id', controllers_1.withdrawController.delete);
router.post('/:id/audit', controllers_1.withdrawController.audit);
router.post('/:id/pay', controllers_1.withdrawController.pay);
exports.default = router;
//# sourceMappingURL=withdraw.routes.js.map