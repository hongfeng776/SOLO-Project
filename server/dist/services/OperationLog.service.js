"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dao_1 = require("../dao");
class OperationLogService {
    async findAll(params) {
        const { page, pageSize } = params;
        const { rows, count } = await dao_1.operationLogDao.findAllPaged(params);
        return { list: rows, total: count, page, pageSize, totalPages: Math.ceil(count / pageSize) };
    }
}
exports.default = new OperationLogService();
//# sourceMappingURL=OperationLog.service.js.map