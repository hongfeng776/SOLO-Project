import { Model, Optional } from 'sequelize';
interface RoleDeletionLogAttributes {
    id: string;
    roleId: string;
    roleName: string;
    roleCode: string;
    deletedBy: string;
    deletedByName: string;
    reason?: string;
    permissionSnapshot?: any;
    boundUsers?: number;
    deletedAt: Date;
    createdAt: Date;
}
interface RoleDeletionLogCreationAttributes extends Optional<RoleDeletionLogAttributes, 'id' | 'reason' | 'permissionSnapshot' | 'boundUsers' | 'createdAt'> {
}
declare class RoleDeletionLog extends Model<RoleDeletionLogAttributes, RoleDeletionLogCreationAttributes> implements RoleDeletionLogAttributes {
    id: string;
    roleId: string;
    roleName: string;
    roleCode: string;
    deletedBy: string;
    deletedByName: string;
    reason?: string;
    permissionSnapshot?: any;
    boundUsers?: number;
    deletedAt: Date;
    readonly createdAt: Date;
}
export { RoleDeletionLog, RoleDeletionLogAttributes, RoleDeletionLogCreationAttributes };
export default RoleDeletionLog;
//# sourceMappingURL=RoleDeletionLog.model.d.ts.map