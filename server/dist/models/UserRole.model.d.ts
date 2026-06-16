import { Model, Optional } from 'sequelize';
interface UserRoleAttributes {
    userId: string;
    roleId: string;
    createdAt: Date;
    updatedAt: Date;
}
interface UserRoleCreationAttributes extends Optional<UserRoleAttributes, 'createdAt' | 'updatedAt'> {
}
declare class UserRole extends Model<UserRoleAttributes, UserRoleCreationAttributes> implements UserRoleAttributes {
    userId: string;
    roleId: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export { UserRole, UserRoleAttributes, UserRoleCreationAttributes };
export default UserRole;
//# sourceMappingURL=UserRole.model.d.ts.map