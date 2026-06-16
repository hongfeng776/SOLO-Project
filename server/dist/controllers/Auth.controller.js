"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const services_1 = require("../services");
const response_1 = __importDefault(require("../utils/response"));
class AuthController {
    async login(req, res) {
        const data = req.body;
        const result = await services_1.authService.login(data);
        response_1.default.success(res, result, 'Login successful');
    }
    async register(req, res) {
        const data = req.body;
        const result = await services_1.authService.register(data);
        response_1.default.created(res, result, 'Registration successful');
    }
    async refreshToken(req, res) {
        const { refreshToken } = req.body;
        const result = await services_1.authService.refreshToken(refreshToken);
        response_1.default.success(res, result, 'Token refreshed');
    }
    async logout(_req, res) {
        response_1.default.success(res, null, 'Logout successful');
    }
}
exports.default = new AuthController();
//# sourceMappingURL=Auth.controller.js.map