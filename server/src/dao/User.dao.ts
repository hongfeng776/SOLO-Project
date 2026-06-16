import { FindOptions, CreateOptions, UpdateOptions, DestroyOptions, CountOptions } from 'sequelize';
import User, { UserAttributes, UserCreationAttributes } from '../models/User.model';

class UserDao {
  public async create(data: UserCreationAttributes, options?: CreateOptions): Promise<User> {
    return User.create(data, options);
  }

  public async findByPk(id: string, options?: FindOptions): Promise<User | null> {
    return User.findByPk(id, options);
  }

  public async findOne(options: FindOptions): Promise<User | null> {
    return User.findOne(options);
  }

  public async findAll(options?: FindOptions): Promise<User[]> {
    return User.findAll(options);
  }

  public async findAndCountAll(options?: FindOptions): Promise<{ rows: User[]; count: number }> {
    return User.findAndCountAll(options);
  }

  public async update(data: Partial<UserAttributes>, options: UpdateOptions): Promise<[number, User[]]> {
    return User.update(data, options) as unknown as Promise<[number, User[]]>;
  }

  public async destroy(options: DestroyOptions): Promise<number> {
    return User.destroy(options);
  }

  public async count(options?: CountOptions): Promise<number> {
    return User.count(options);
  }

  public async findByUsername(username: string): Promise<User | null> {
    return this.findOne({ where: { username } });
  }

  public async findById(id: string): Promise<User | null> {
    return this.findByPk(id);
  }

  public async existsByUsername(username: string): Promise<boolean> {
    const count = await this.count({ where: { username } });
    return count > 0;
  }
}

export default new UserDao();
