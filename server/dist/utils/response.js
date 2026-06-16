"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const statusCode_1 = require("../constants/statusCode");
class ResponseUtils {
    static success(res, data = null, message = 'success') {
        const result = {
            code: statusCode_1.BusinessCode.SUCCESS,
            message,
            data,
            timestamp: Date.now(),
        };
        res.status(statusCode_1.HttpStatus.OK).json(result);
    }
    static created(res, data = null, message = 'created') {
        const result = {
            code: statusCode_1.BusinessCode.SUCCESS,
            message,
            data,
            timestamp: Date.now(),
        };
        res.status(statusCode_1.HttpStatus.CREATED).json(result);
    }
    static error(res, message, code = statusCode_1.BusinessCode.ERROR, httpStatus = statusCode_1.HttpStatus.BAD_REQUEST) {
        const result = {
            code,
            message,
            data: null,
            timestamp: Date.now(),
        };
        res.status(httpStatus).json(result);
    }
    static unauthorized(res, message = 'Unauthorized', code = statusCode_1.BusinessCode.UNAUTHORIZED) {
        this.error(res, message, code, statusCode_1.HttpStatus.UNAUTHORIZED);
    }
    static forbidden(res, message = 'Forbidden', code = statusCode_1.BusinessCode.FORBIDDEN) {
        this.error(res, message, code, statusCode_1.HttpStatus.FORBIDDEN);
    }
    static notFound(res, message = 'Not Found', code = statusCode_1.BusinessCode.NOT_FOUND) {
        this.error(res, message, code, statusCode_1.HttpStatus.NOT_FOUND);
    }
    static serverError(res, message = 'Internal Server Error', code = statusCode_1.BusinessCode.SERVER_ERROR) {
        this.error(res, message, code, statusCode_1.HttpStatus.INTERNAL_SERVER_ERROR);
    }
    static paginated(res, list, total, page, pageSize, message = 'success') {
        const totalPages = Math.ceil(total / pageSize);
        const paginationResult = {
            list,
            total,
            page,
            pageSize,
            totalPages,
        };
        this.success(res, paginationResult, message);
    }
}
exports.default = ResponseUtils;
//# sourceMappingURL=response.js.map