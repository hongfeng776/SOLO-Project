import { Model, Optional } from 'sequelize';
import { UserRole, UserStatus } from '../constants/enum';
interface UserAttributes {
    id: string;
    username: string;
    password: string;
    nickname: string;
    avatar?: string;
    email?: string;
    phone?: string;
    role: UserRole;
    status: UserStatus;
    lastLoginAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'nickname' | 'role' | 'status' | 'createdAt' | 'updatedAt' | 'deletedAt'> {
}
declare class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    id: string;
    username: string;
    password: string;
    nickname: string;
    avatar?: string;
    email?: string;
    phone?: string;
    role: UserRole;
    status: UserStatus;
    lastLoginAt?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly deletedAt?: Date;
}
export { User, UserAttributes, UserCreationAttributes };
export default User;
//# sourceMappingURL=User.model.d.ts.map