import { OrganizationRepository, UserRepository } from '../repositories';
import {
  CreateOrganizationRequest,
  UpdateOrganizationRequest,
  OrganizationQueryParams,
  PaginatedResult,
  OrganizationVO,
  StatusType
} from '../types';
import {
  throwBusinessError,
  throwNotFoundError,
  throwConflictError,
  throwValidationError
} from '../utils';
import { isValidId } from '../utils/validate';
import { Op } from 'sequelize';

export class OrganizationService {
  private organizationRepository: OrganizationRepository;
  private userRepository: UserRepository;

  constructor() {
    this.organizationRepository = new OrganizationRepository();
    this.userRepository = new UserRepository();
  }

  async getOrganizationTree(keyword?: string, status?: number): Promise<OrganizationVO[]> {
    let organizations: any[];

    if (keyword || status !== undefined) {
      const where: any = {};
      if (keyword) {
        where[Op.or] = [
          { name: { [Op.like]: `%${keyword}%` } },
          { code: { [Op.like]: `%${keyword}%` } }
        ];
      }
      if (status !== undefined) {
        where.status = status;
      }

      organizations = await this.organizationRepository.findAll({
        where,
        order: [['sort', 'ASC'], ['createdAt', 'ASC']]
      });
    } else {
      organizations = await this.organizationRepository.findAllTree();
    }

    const list = organizations.map(o => {
      const data = o.toJSON ? o.toJSON() : o;
      return { ...data, children: [] as OrganizationVO[], status: data.status as StatusType } as OrganizationVO;
    });

    return this.buildOrganizationTree(list);
  }

  async getOrganizationList(params: OrganizationQueryParams): Promise<PaginatedResult<OrganizationVO>> {
    const { page, pageSize, ...queryParams } = params;
    const where = this.organizationRepository.buildQuery(queryParams);

    const result = await this.organizationRepository.findPaginated(
      { page, pageSize },
      where,
      { sortBy: 'sort', sortOrder: 'ASC' }
    );

    const list: OrganizationVO[] = result.list.map(o => {
      const data = o.toJSON ? o.toJSON() : o;
      return { ...data, status: data.status as StatusType } as OrganizationVO;
    });

    return { ...result, list };
  }

  async getAllOrganizations(): Promise<OrganizationVO[]> {
    const orgs = await this.organizationRepository.findAll({
      where: { status: 1 },
      order: [['sort', 'ASC'], ['createdAt', 'ASC']]
    });

    const list = orgs.map(o => {
      const data = o.toJSON ? o.toJSON() : o;
      return { ...data, children: [] as OrganizationVO[], status: data.status as StatusType } as OrganizationVO;
    });

    return this.buildOrganizationTree(list);
  }

  private buildOrganizationTree(organizations: OrganizationVO[]): OrganizationVO[] {
    const map = new Map<string, OrganizationVO>();
    const roots: OrganizationVO[] = [];

    organizations.forEach(org => {
      map.set(org.id, org);
    });

    map.forEach(node => {
      if (node.parent_id && map.has(node.parent_id)) {
        map.get(node.parent_id)!.children!.push(node);
      } else {
        roots.push(node);
      }
    });

    const sortTree = (nodes: OrganizationVO[]) => {
      nodes.sort((a, b) => (a.sort || 0) - (b.sort || 0));
      nodes.forEach(n => n.children && n.children.length > 0 && sortTree(n.children));
    };
    sortTree(roots);

    return roots;
  }

  async getOrganizationById(id: string): Promise<OrganizationVO> {
    if (!isValidId(id)) {
      throwValidationError('无效的机构ID');
    }

    const org = await this.organizationRepository.findById(id);
    if (!org) {
      throwNotFoundError('机构不存在');
    }

    const data = org.toJSON ? org.toJSON() : org;
    return data as OrganizationVO;
  }

  async createOrganization(request: CreateOrganizationRequest): Promise<OrganizationVO> {
    const { name, code, org_type, parent_id, ...orgData } = request;

    if (!name || name.trim().length === 0) {
      throwValidationError('机构名称不能为空');
    }

    if (!code || code.trim().length === 0) {
      throwValidationError('机构编码不能为空');
    }

    if (![1, 2, 3, 4].includes(org_type)) {
      throwValidationError('机构类型无效');
    }

    const existing = await this.organizationRepository.findByCode(code);
    if (existing) {
      throwConflictError('机构编码已存在');
    }

    if (parent_id) {
      if (!isValidId(parent_id)) {
        throwValidationError('无效的父级ID');
      }
      const parent = await this.organizationRepository.findById(parent_id);
      if (!parent) {
        throwNotFoundError('父级机构不存在');
      }
    }

    if (!parent_id && org_type !== 1) {
      throwValidationError('顶级机构必须是总行类型');
    }

    const org = await this.organizationRepository.create({
      ...orgData,
      name: name.trim(),
      code: code.trim(),
      org_type,
      parent_id,
      status: request.status ?? 1
    });

    return this.getOrganizationById(org.id);
  }

  async updateOrganization(id: string, request: UpdateOrganizationRequest): Promise<OrganizationVO> {
    if (!isValidId(id)) {
      throwValidationError('无效的机构ID');
    }

    const org = await this.organizationRepository.findById(id);
    if (!org) {
      throwNotFoundError('机构不存在');
    }

    await this.organizationRepository.update(id, request);

    return this.getOrganizationById(id);
  }

  async deleteOrganization(id: string): Promise<void> {
    if (!isValidId(id)) {
      throwValidationError('无效的机构ID');
    }

    const org = await this.organizationRepository.findById(id);
    if (!org) {
      throwNotFoundError('机构不存在');
    }

    if (org.org_type === 1) {
      throwBusinessError('不能删除总行机构');
    }

    const hasChildren = await this.organizationRepository.hasChildren(id);
    if (hasChildren) {
      throwBusinessError('存在子机构，不能删除');
    }

    const hasUsers = await this.userRepository.exists({ org_id: id });
    if (hasUsers) {
      throwBusinessError('机构下存在用户，不能删除');
    }

    await this.organizationRepository.delete(id);
  }

  async updateOrganizationStatus(id: string, status: number): Promise<void> {
    if (!isValidId(id)) {
      throwValidationError('无效的机构ID');
    }

    if (status !== 0 && status !== 1) {
      throwValidationError('状态值无效');
    }

    const org = await this.organizationRepository.findById(id);
    if (!org) {
      throwNotFoundError('机构不存在');
    }

    if (org.org_type === 1 && status === 0) {
      throwBusinessError('不能禁用总行机构');
    }

    await this.organizationRepository.update(id, { status });
  }

  async getSubOrganizationIds(orgId: string, includeSelf: boolean = false): Promise<string[]> {
    const ids = await this.organizationRepository.findChildrenIds(orgId);
    if (includeSelf) {
      ids.unshift(orgId);
    }
    return ids;
  }
}