"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkPermissionMutualExclusion = checkPermissionMutualExclusion;
exports.checkSameLevelPermissionConflict = checkSameLevelPermissionConflict;
const enum_1 = require("../constants/enum");
function checkPermissionMutualExclusion(permissionIds, allPermissions) {
    const conflicts = [];
    const permissionMap = new Map(allPermissions.map(p => [p.id, p.code]));
    const idToCode = (id) => permissionMap.get(id);
    const codes = permissionIds.map(id => idToCode(id)).filter(Boolean);
    for (const exclusion of enum_1.PERMISSION_MUTUAL_EXCLUSIONS) {
        const [c1, c2] = exclusion.codes;
        if (codes.includes(c1) && codes.includes(c2)) {
            conflicts.push({ code: c1, conflictCode: c2, reason: exclusion.reason });
        }
    }
    return conflicts;
}
function checkSameLevelPermissionConflict(targetUserId, targetRoleId, permissionIds, userDao) {
    return Promise.resolve([]);
}
//# sourceMappingURL=permissionCheck.js.map