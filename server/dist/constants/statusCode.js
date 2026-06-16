"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessCode = exports.HttpStatus = void 0;
var HttpStatus;
(function (HttpStatus) {
    HttpStatus[HttpStatus["OK"] = 200] = "OK";
    HttpStatus[HttpStatus["CREATED"] = 201] = "CREATED";
    HttpStatus[HttpStatus["NO_CONTENT"] = 204] = "NO_CONTENT";
    HttpStatus[HttpStatus["BAD_REQUEST"] = 400] = "BAD_REQUEST";
    HttpStatus[HttpStatus["UNAUTHORIZED"] = 401] = "UNAUTHORIZED";
    HttpStatus[HttpStatus["FORBIDDEN"] = 403] = "FORBIDDEN";
    HttpStatus[HttpStatus["NOT_FOUND"] = 404] = "NOT_FOUND";
    HttpStatus[HttpStatus["CONFLICT"] = 409] = "CONFLICT";
    HttpStatus[HttpStatus["UNPROCESSABLE_ENTITY"] = 422] = "UNPROCESSABLE_ENTITY";
    HttpStatus[HttpStatus["INTERNAL_SERVER_ERROR"] = 500] = "INTERNAL_SERVER_ERROR";
    HttpStatus[HttpStatus["SERVICE_UNAVAILABLE"] = 503] = "SERVICE_UNAVAILABLE";
    HttpStatus[HttpStatus["GATEWAY_TIMEOUT"] = 504] = "GATEWAY_TIMEOUT";
})(HttpStatus || (exports.HttpStatus = HttpStatus = {}));
var BusinessCode;
(function (BusinessCode) {
    BusinessCode[BusinessCode["SUCCESS"] = 0] = "SUCCESS";
    BusinessCode[BusinessCode["ERROR"] = 10000] = "ERROR";
    BusinessCode[BusinessCode["PARAM_ERROR"] = 10001] = "PARAM_ERROR";
    BusinessCode[BusinessCode["UNAUTHORIZED"] = 10002] = "UNAUTHORIZED";
    BusinessCode[BusinessCode["FORBIDDEN"] = 10003] = "FORBIDDEN";
    BusinessCode[BusinessCode["NOT_FOUND"] = 10004] = "NOT_FOUND";
    BusinessCode[BusinessCode["SERVER_ERROR"] = 10005] = "SERVER_ERROR";
    BusinessCode[BusinessCode["DATABASE_ERROR"] = 10006] = "DATABASE_ERROR";
    BusinessCode[BusinessCode["TOKEN_EXPIRED"] = 10007] = "TOKEN_EXPIRED";
    BusinessCode[BusinessCode["TOKEN_INVALID"] = 10008] = "TOKEN_INVALID";
    BusinessCode[BusinessCode["USER_NOT_FOUND"] = 20001] = "USER_NOT_FOUND";
    BusinessCode[BusinessCode["USER_ALREADY_EXISTS"] = 20002] = "USER_ALREADY_EXISTS";
    BusinessCode[BusinessCode["USER_PASSWORD_ERROR"] = 20003] = "USER_PASSWORD_ERROR";
    BusinessCode[BusinessCode["USER_DISABLED"] = 20004] = "USER_DISABLED";
})(BusinessCode || (exports.BusinessCode = BusinessCode = {}));
//# sourceMappingURL=statusCode.js.map