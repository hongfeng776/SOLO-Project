"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = exports.notFoundMiddleware = exports.errorMiddleware = void 0;
const response_1 = __importDefault(require("../utils/response"));
const logger_1 = __importDefault(require("../utils/logger"));
const statusCode_1 = require("../constants/statusCode");
class AppError extends Error {
    constructor(message, code = statusCode_1.BusinessCode.ERROR, httpStatus = statusCode_1.HttpStatus.BAD_REQUEST) {
        super(message);
        this.code = code;
        this.httpStatus = httpStatus;
        this.name = 'AppError';
    }
}
exports.AppError = AppError;
const errorMiddleware = (err, req, res, _next) => {
    logger_1.default.error(`Error: ${err.message}`, err.stack);
    if (err instanceof AppError) {
        response_1.default.error(res, err.message, err.code, err.httpStatus);
        return;
    }
    if (err.name === 'ValidationError' || err.name === 'SequelizeValidationError') {
        response_1.default.error(res, err.message, statusCode_1.BusinessCode.PARAM_ERROR, statusCode_1.HttpStatus.BAD_REQUEST);
        return;
    }
    if (err.name === 'SequelizeDatabaseError') {
        response_1.default.error(res, '数据库操作异常', statusCode_1.BusinessCode.DATABASE_ERROR, statusCode_1.HttpStatus.INTERNAL_SERVER_ERROR);
        return;
    }
    if (err.name === 'SyntaxError' && err.status === 400 && 'body' in err) {
        response_1.default.error(res, '请求数据格式错误', statusCode_1.BusinessCode.PARAM_ERROR, statusCode_1.HttpStatus.BAD_REQUEST);
        return;
    }
    if (err.name === 'PayloadTooLargeError' || err.type === 'entity.too.large') {
        response_1.default.error(res, '请求数据过大', statusCode_1.BusinessCode.PARAM_ERROR, statusCode_1.HttpStatus.BAD_REQUEST);
        return;
    }
    if (err.code === 'ETIMEDOUT' || err.code === 'ESOCKETTIMEDOUT') {
        response_1.default.error(res, '请求超时', statusCode_1.BusinessCode.SERVER_ERROR, statusCode_1.HttpStatus.GATEWAY_TIMEOUT);
        return;
    }
    response_1.default.serverError(res, 'Internal Server Error', statusCode_1.BusinessCode.SERVER_ERROR);
};
exports.errorMiddleware = errorMiddleware;
const notFoundMiddleware = (req, res) => {
    response_1.default.notFound(res, `Route ${req.method} ${req.path} not found`);
};
exports.notFoundMiddleware = notFoundMiddleware;
exports.default = errorMiddleware;
//# sourceMappingURL=error.middleware.js.map