import { Model, Optional } from 'sequelize';
import { CommonStatus } from '../constants/enum';
interface RoleAttributes {
    id: string;
    name: string;
    code: string;
    description?: string;
    status: CommonStatus;
    sort?: number;
    level?: number;
    scenario?: string;
    permissionIds?: string[];
    createdBy?: string;
    createdByName?: string;
    isSystem?: boolean;
    userCount?: number;
    boundPermissionIds?: string[];
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
interface RoleCreationAttributes extends Optional<RoleAttributes, 'id' | 'description' | 'status' | 'sort' | 'level' | 'scenario' | 'permissionIds' | 'createdBy' | 'createdByName' | 'isSystem' | 'userCount' | 'boundPermissionIds' | 'createdAt' | 'updatedAt' | 'deletedAt'> {
}
declare class Role extends Model<RoleAttributes, RoleCreationAttributes> implements RoleAttributes {
    id: string;
    name: string;
    code: string;
    description?: string;
    status: CommonStatus;
    sort?: number;
    level?: number;
    scenario?: string;
    permissionIds?: string[];
    createdBy?: string;
    createdByName?: string;
    isSystem?: boolean;
    userCount?: number;
    boundPermissionIds?: string[];
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly deletedAt?: Date;
}
export { Role, RoleAttributes, RoleCreationAttributes };
export default Role;
//# sourceMappingURL=Role.model.d.ts.map