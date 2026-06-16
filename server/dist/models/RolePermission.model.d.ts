import { Model, Optional } from 'sequelize';
interface RolePermissionAttributes {
    roleId: string;
    permissionId: string;
    createdAt: Date;
    updatedAt: Date;
}
interface RolePermissionCreationAttributes extends Optional<RolePermissionAttributes, 'createdAt' | 'updatedAt'> {
}
declare class RolePermission extends Model<RolePermissionAttributes, RolePermissionCreationAttributes> implements RolePermissionAttributes {
    roleId: string;
    permissionId: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export { RolePermission, RolePermissionAttributes, RolePermissionCreationAttributes };
export default RolePermission;
//# sourceMappingURL=RolePermission.model.d.ts.map