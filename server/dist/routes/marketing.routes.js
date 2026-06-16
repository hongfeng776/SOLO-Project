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
router.post('/', controllers_1.marketingController.create);
router.get('/', controllers_1.marketingController.findAll);
router.get('/:id', controllers_1.marketingController.findById);
router.put('/:id', controllers_1.marketingController.update);
router.delete('/:id', controllers_1.marketingController.delete);
router.post('/bulk-delete', controllers_1.marketingController.bulkDelete);
router.post('/batch-status', controllers_1.marketingController.batchUpdateStatus);
router.post('/auto-end', controllers_1.marketingController.autoEnd);
router.patch('/:id/status', controllers_1.marketingController.updateStatus);
exports.default = router;
//# sourceMappingURL=marketing.routes.js.map