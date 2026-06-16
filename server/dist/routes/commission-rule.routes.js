"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const CommissionRule_controller_1 = __importDefault(require("../controllers/CommissionRule.controller"));
const auth_middleware_1 = __importDefault(require("../middleware/auth.middleware"));
const router = (0, express_1.Router)();
router.use(auth_middleware_1.default);
router.post('/', CommissionRule_controller_1.default.create);
router.get('/', CommissionRule_controller_1.default.findAll);
router.get('/:id', CommissionRule_controller_1.default.findById);
router.put('/:id', CommissionRule_controller_1.default.update);
router.delete('/:id', CommissionRule_controller_1.default.delete);
router.put('/:id/toggle', CommissionRule_controller_1.default.toggleEnabled);
exports.default = router;
//# sourceMappingURL=commission-rule.routes.js.map