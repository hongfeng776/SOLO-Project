export interface PermissionConflict {
    code: string;
    conflictCode: string;
    reason: string;
}
export declare function checkPermissionMutualExclusion(permissionIds: string[], allPermissions: any[]): PermissionConflict[];
export declare function checkSameLevelPermissionConflict(targetUserId: string, targetRoleId: string, permissionIds: string[], userDao: any): Promise<any[]>;
//# sourceMappingURL=permissionCheck.d.ts.map