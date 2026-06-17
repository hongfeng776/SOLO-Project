import { Model, Optional } from 'sequelize';
export declare enum ChangeTargetType {
    ROLE = "role",
    PERMISSION = "permission",
    USER = "user"
}
export declare enum ChangeAction {
    CREATE = "create",
    UPDATE = "update",
    DELETE = "delete",
    BATCH_ASSIGN = "batch_assign",
    BATCH_REVOKE = "batch_revoke",
    BATCH_COPY = "batch_copy"
}
interface PermissionChangeLogAttributes {
    id: string;
    operatorId: string;
    operatorName: string;
    targetId: string;
    targetType: ChangeTargetType;
    targetName?: string;
    action: ChangeAction;
    module?: string;
    beforeData?: any;
    afterData?: any;
    changedFields?: any;
    affectedUserIds?: string[];
    affectedUserCount?: number;
    reason?: string;
    ip: string;
    userAgent?: string;
    createdAt: Date;
}
interface PermissionChangeLogCreationAttributes extends Optional<PermissionChangeLogAttributes, 'id' | 'targetName' | 'module' | 'beforeData' | 'afterData' | 'changedFields' | 'affectedUserIds' | 'affectedUserCount' | 'reason' | 'userAgent' | 'createdAt'> {
}
declare class PermissionChangeLog extends Model<PermissionChangeLogAttributes, PermissionChangeLogCreationAttributes> implements PermissionChangeLogAttributes {
    id: string;
    operatorId: string;
    operatorName: string;
    targetId: string;
    targetType: ChangeTargetType;
    targetName?: string;
    action: ChangeAction;
    module?: string;
    beforeData?: any;
    afterData?: any;
    changedFields?: any;
    affectedUserIds?: string[];
    affectedUserCount?: number;
    reason?: string;
    ip: string;
    userAgent?: string;
    readonly createdAt: Date;
}
export { PermissionChangeLog, PermissionChangeLogAttributes, PermissionChangeLogCreationAttributes };
export default PermissionChangeLog;
//# sourceMappingURL=PermissionChangeLog.model.d.ts.map