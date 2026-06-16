import { Model, Optional } from 'sequelize';
import { CommonStatus } from '../constants/enum';
interface RoleAttributes {
    id: string;
    name: string;
    code: string;
    description?: string;
    status: CommonStatus;
    sort?: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
interface RoleCreationAttributes extends Optional<RoleAttributes, 'id' | 'description' | 'status' | 'sort' | 'createdAt' | 'updatedAt' | 'deletedAt'> {
}
declare class Role extends Model<RoleAttributes, RoleCreationAttributes> implements RoleAttributes {
    id: string;
    name: string;
    code: string;
    description?: string;
    status: CommonStatus;
    sort?: number;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly deletedAt?: Date;
}
export { Role, RoleAttributes, RoleCreationAttributes };
export default Role;
//# sourceMappingURL=Role.model.d.ts.map