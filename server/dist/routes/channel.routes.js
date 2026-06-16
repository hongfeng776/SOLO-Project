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
router.post('/', controllers_1.channelController.create);
router.get('/', controllers_1.channelController.findAll);
router.get('/:id', controllers_1.channelController.findById);
router.put('/:id', controllers_1.channelController.update);
router.delete('/:id', controllers_1.channelController.delete);
router.post('/bulk-delete', controllers_1.channelController.bulkDelete);
router.post('/batch-status', controllers_1.channelController.batchUpdateStatus);
router.patch('/:id/status', controllers_1.channelController.updateStatus);
exports.default = router;
//# sourceMappingURL=channel.routes.js.map