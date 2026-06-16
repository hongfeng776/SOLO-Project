import { BaseRepository } from './BaseRepository';
import { User } from '../models';
import { FindOptions, Includeable, WhereOptions, Op } from 'sequelize';
import { Role } from '../models';
import { UserRole } from '../models';
import { Organization } from '../models';

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super(User);
  }

  async findByUsername(username: string, options?: Omit<FindOptions, 'where'>): Promise<User | null> {
    return await this.model.findOne({
      where: { username },
      ...options
    });
  }

  async findWithRoles(userId: string): Promise<User | null> {
    return await this.model.findByPk(userId, {
      include: [
        {
          model: Role,
          through: { attributes: [] },
          where: { status: 1 },
          required: false
        },
        {
          model: Organization,
          required: false
        }
      ]
    });
  }

  async findAllWithRoles(options?: FindOptions): Promise<User[]> {
    return await this.model.findAll({
      include: [
        {
          model: Role,
          through: { attributes: [] },
          where: { status: 1 },
          required: false
        },
        {
          model: Organization,
          required: false
        }
      ],
      ...options
    });
  }

  async assignRoles(userId: string, roleIds: string[]): Promise<void> {
    await UserRole.destroy({ where: { user_id: userId } });
    if (roleIds && roleIds.length > 0) {
      const userRoles = roleIds.map(roleId => ({
        user_id: userId,
        role_id: roleId
      }));
      await UserRole.bulkCreate(userRoles as any);
    }
  }

  buildQuery(params: any): WhereOptions {
    const where: any = {};

    if (params.keyword) {
      where[Op.or] = [
        { username: { [Op.like]: `%${params.keyword}%` } },
        { real_name: { [Op.like]: `%${params.keyword}%` } },
        { phone: { [Op.like]: `%${params.keyword}%` } },
        { email: { [Op.like]: `%${params.keyword}%` } }
      ];
    }

    if (params.status !== undefined) {
      where.status = params.status;
    }

    if (params.org_id) {
      where.org_id = params.org_id;
    }

    return where;
  }

  getRolesInclude(): Includeable {
    return {
      model: Role,
      through: { attributes: [] },
      where: { status: 1 },
      required: false,
      attributes: ['id', 'name', 'code']
    };
  }

  getOrganizationInclude(): Includeable {
    return {
      model: Organization,
      required: false,
      attributes: ['id', 'name']
    };
  }
}