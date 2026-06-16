"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLog = auditLog;
const dao_1 = require("../dao");
const AUDIT_MODULES = {
    '/api/channels': 'channel',
    '/api/promoters': 'promoter',
    '/api/orders': 'order',
    '/api/commissions': 'commission',
    '/api/marketings': 'marketing',
    '/api/withdraws': 'withdraw',
    '/api/roles': 'role',
    '/api/permissions': 'permission',
    '/api/users': 'user',
};
const ACTION_MAP = {
    POST: 'create',
    PUT: 'update',
    PATCH: 'update',
    DELETE: 'delete',
};
function getModule(path) {
    for (const [prefix, module] of Object.entries(AUDIT_MODULES)) {
        if (path.startsWith(prefix))
            return module;
    }
    return 'unknown';
}
function getTargetType(path) {
    return getModule(path);
}
function extractTargetId(path) {
    const parts = path.split('/');
    const lastPart = parts[parts.length - 1];
    if (lastPart && lastPart !== 'api' && !AUDIT_MODULES[`/api/${lastPart}`] && lastPart.length > 5) {
        return lastPart;
    }
    return undefined;
}
function auditLog(req, res, next) {
    if (req.method === 'GET') {
        next();
        return;
    }
    const startTime = Date.now();
    const originalEnd = res.end;
    res.end = function (...args) {
        const duration = Date.now() - startTime;
        const module = getModule(req.path);
        const action = req.path.includes('/approve') ? 'approve'
            : req.path.includes('/reject') ? 'reject'
                : req.path.includes('/status') ? 'updateStatus'
                    : req.path.includes('/settle') ? 'settle'
                        : req.path.includes('/deduct') ? 'deduct'
                            : req.path.includes('/batch') ? 'bulkAction'
                                : ACTION_MAP[req.method] || 'unknown';
        const user = req.user;
        dao_1.operationLogDao.create({
            userId: user?.userId || 'anonymous',
            userName: user?.username || 'anonymous',
            module,
            action,
            targetId: extractTargetId(req.path),
            targetType: getTargetType(req.path),
            detail: req.method !== 'GET' ? req.body : undefined,
            ip: req.ip || req.socket.remoteAddress || 'unknown',
            userAgent: req.headers['user-agent'],
            status: res.statusCode < 400 ? 1 : 0,
            errorMessage: res.statusCode >= 400 ? `HTTP ${res.statusCode}` : undefined,
            duration,
        }).catch(() => { });
        originalEnd.apply(res, args);
    };
    next();
}
//# sourceMappingURL=audit.middleware.js.map