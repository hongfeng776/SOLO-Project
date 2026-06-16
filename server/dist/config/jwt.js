"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bcryptConfig = exports.jwtConfig = void 0;
const index_1 = __importDefault(require("./index"));
const jwtConfig = {
    secret: index_1.default.jwt.secret,
    expiresIn: index_1.default.jwt.expiresIn,
    refreshSecret: index_1.default.jwt.refreshSecret,
    refreshExpiresIn: index_1.default.jwt.refreshExpiresIn,
};
exports.jwtConfig = jwtConfig;
const bcryptConfig = {
    saltRounds: index_1.default.bcrypt.saltRounds,
};
exports.bcryptConfig = bcryptConfig;
exports.default = jwtConfig;
//# sourceMappingURL=jwt.js.map