import { FindOptions, CreateOptions, UpdateOptions, DestroyOptions, CountOptions, Op } from 'sequelize';
import User, { UserAttributes, UserCreationAttributes } from '../models/User.model';

export interface UserQueryParams {
  page: number;
  pageSize: number;
  role?: string;
  status?: number;
  positionLevel?: number;
  permissionId?: string;
  keyword?: string;
  startTime?: string;
  endTime?: string;
}

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

  public async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ where: { email } });
  }

  public async findByPhone(phone: string): Promise<User | null> {
    return this.findOne({ where: { phone } });
  }

  public async findById(id: string): Promise<User | null> {
    return this.findByPk(id);
  }

  public async existsByUsername(username: string): Promise<boolean> {
    const count = await this.count({ where: { username } });
    return count > 0;
  }

  public async existsByEmail(email: string, excludeId?: string): Promise<boolean> {
    const where: any = { email };
    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }
    const count = await this.count({ where });
    return count > 0;
  }

  public async existsByPhone(phone: string, excludeId?: string): Promise<boolean> {
    const where: any = { phone };
    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }
    const count = await this.count({ where });
    return count > 0;
  }

  public async countByRole(role: string): Promise<number> {
    return this.count({ where: { role } });
  }

  public async findAllPaged(params: UserQueryParams): Promise<{ rows: User[]; count: number }> {
    const { page, pageSize, role, status, positionLevel, keyword, startTime, endTime } = params;
    const offset = (page - 1) * pageSize;
    const where: any = {};

    if (role) {
      where.role = role;
    }
    if (status !== undefined) {
      where.status = status;
    }
    if (positionLevel !== undefined) {
      where.positionLevel = positionLevel;
    }
    if (keyword) {
      where[Op.or] = [
        { username: { [Op.like]: `%${keyword}%` } },
        { nickname: { [Op.like]: `%${keyword}%` } },
        { email: { [Op.like]: `%${keyword}%` } },
        { phone: { [Op.like]: `%${keyword}%` } },
      ];
    }
    if (startTime || endTime) {
      where.createdAt = {};
      if (startTime) {
        where.createdAt[Op.gte] = new Date(startTime);
      }
      if (endTime) {
        const end = new Date(endTime);
        end.setHours(23, 59, 59, 999);
        where.createdAt[Op.lte] = end;
      }
    }

    return this.findAndCountAll({
      where,
      offset,
      limit: pageSize,
      order: [['createdAt', 'DESC']],
    });
  }

  public async findByPositionLevelRange(minLevel: number, maxLevel: number): Promise<User[]> {
    return this.findAll({
      where: {
        positionLevel: {
          [Op.between]: [minLevel, maxLevel],
        },
      },
      order: [['positionLevel', 'ASC']],
    });
  }
}

export default new UserDao();
