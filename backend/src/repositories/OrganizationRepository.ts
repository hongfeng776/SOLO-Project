import { BaseRepository } from './BaseRepository';
import { Organization } from '../models';
import { FindOptions, WhereOptions, Op } from 'sequelize';

export class OrganizationRepository extends BaseRepository<Organization> {
  constructor() {
    super(Organization);
  }

  async findByCode(code: string): Promise<Organization | null> {
    return await this.model.findOne({ where: { code } });
  }

  async findTree(parentId?: string | null): Promise<Organization[]> {
    const where: any = { status: 1 };
    if (parentId !== undefined) {
      where.parent_id = parentId;
    }
    return await this.model.findAll({
      where,
      order: [['sort', 'ASC'], ['created_at', 'ASC']]
    });
  }

  async findAllTree(): Promise<Organization[]> {
    return await this.model.findAll({
      order: [['sort', 'ASC'], ['created_at', 'ASC']]
    });
  }

  async findByPath(orgId: string): Promise<Organization[]> {
    const result: Organization[] = [];
    let currentOrgId: string | undefined = orgId;

    while (currentOrgId) {
      const org = await this.findById(currentOrgId);
      if (org) {
        result.unshift(org);
        currentOrgId = org.parent_id;
      } else {
        break;
      }
    }

    return result;
  }

  async findChildrenIds(parentId: string): Promise<string[]> {
    const result: string[] = [];
    const findRecursive = async (pid: string) => {
      const children = await this.findByWhere({ parent_id: pid });
      for (const child of children) {
        result.push(child.id);
        await findRecursive(child.id);
      }
    };
    await findRecursive(parentId);
    return result;
  }

  async hasChildren(parentId: string): Promise<boolean> {
    const count = await this.model.count({ where: { parent_id: parentId } });
    return count > 0;
  }

  buildQuery(params: any): WhereOptions {
    const where: any = {};

    if (params.keyword) {
      where[Op.or] = [
        { name: { [Op.like]: `%${params.keyword}%` } },
        { code: { [Op.like]: `%${params.keyword}%` } },
        { leader: { [Op.like]: `%${params.keyword}%` } }
      ];
    }

    if (params.status !== undefined) {
      where.status = params.status;
    }

    if (params.org_type !== undefined) {
      where.org_type = params.org_type;
    }

    return where;
  }
}