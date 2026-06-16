import { FindOptions, CreateOptions, UpdateOptions, DestroyOptions, CountOptions } from 'sequelize';
import User, { UserAttributes, UserCreationAttributes } from '../models/User.model';
declare class UserDao {
    create(data: UserCreationAttributes, options?: CreateOptions): Promise<User>;
    findByPk(id: string, options?: FindOptions): Promise<User | null>;
    findOne(options: FindOptions): Promise<User | null>;
    findAll(options?: FindOptions): Promise<User[]>;
    findAndCountAll(options?: FindOptions): Promise<{
        rows: User[];
        count: number;
    }>;
    update(data: Partial<UserAttributes>, options: UpdateOptions): Promise<[number, User[]]>;
    destroy(options: DestroyOptions): Promise<number>;
    count(options?: CountOptions): Promise<number>;
    findByUsername(username: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    existsByUsername(username: string): Promise<boolean>;
}
declare const _default: UserDao;
export default _default;
//# sourceMappingURL=User.dao.d.ts.map