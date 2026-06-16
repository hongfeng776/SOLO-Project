"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_validator_1 = require("express-validator");
const response_1 = __importDefault(require("../utils/response"));
const statusCode_1 = require("../constants/statusCode");
const validateMiddleware = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map((err) => err.msg).join(', ');
        response_1.default.error(res, errorMessages, statusCode_1.BusinessCode.PARAM_ERROR);
        return;
    }
    next();
};
exports.default = validateMiddleware;
//# sourceMappingURL=validate.middleware.js.map