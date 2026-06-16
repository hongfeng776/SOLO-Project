import { PermissionRepository } from '../repositories';
import {
  CreatePermissionRequest,
  UpdatePermissionRequest,
  PermissionVO,
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

export class PermissionService {
  private permissionRepository: PermissionRepository;

  constructor() {
    this.permissionRepository = new PermissionRepository();
  }

  async getPermissionTree(keyword?: string, status?: number): Promise<PermissionVO[]> {
    let permissions: any[];

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

      permissions = await this.permissionRepository.findAll({
        where,
        order: [['sort', 'ASC'], ['createdAt', 'ASC']]
      });
    } else {
      permissions = await this.permissionRepository.findAllTree();
    }

    const list = permissions.map(p => {
      const data = p.toJSON ? p.toJSON() : p;
      return { ...data, children: [] as PermissionVO[], visible: data.visible as 0 | 1, status: data.status as StatusType } as PermissionVO;
    });

    return this.buildPermissionTree(list);
  }

  async getAllPermissions(): Promise<PermissionVO[]> {
    const permissions = await this.permissionRepository.findAll({
      where: { status: 1 },
      order: [['sort', 'ASC'], ['createdAt', 'ASC']]
    });

    const list = permissions.map(p => {
      const data = p.toJSON ? p.toJSON() : p;
      return { ...data, children: [] as PermissionVO[], visible: data.visible as 0 | 1, status: data.status as StatusType } as PermissionVO;
    });

    return this.buildPermissionTree(list);
  }

  private buildPermissionTree(permissions: PermissionVO[]): PermissionVO[] {
    const map = new Map<string, PermissionVO>();
    const roots: PermissionVO[] = [];

    permissions.forEach(perm => {
      map.set(perm.id, perm);
    });

    map.forEach(node => {
      if (node.parent_id && map.has(node.parent_id)) {
        map.get(node.parent_id)!.children!.push(node);
      } else {
        roots.push(node);
      }
    });

    const sortTree = (nodes: PermissionVO[]) => {
      nodes.sort((a, b) => (a.sort || 0) - (b.sort || 0));
      nodes.forEach(n => n.children && n.children.length > 0 && sortTree(n.children));
    };
    sortTree(roots);

    return roots;
  }

  async getPermissionById(id: string): Promise<PermissionVO> {
    if (!isValidId(id)) {
      throwValidationError('无效的权限ID');
    }

    const permission = await this.permissionRepository.findById(id);
    if (!permission) {
      throwNotFoundError('权限不存在');
    }

    const data = permission.toJSON ? permission.toJSON() : permission;
    return data as PermissionVO;
  }

  async createPermission(request: CreatePermissionRequest): Promise<PermissionVO> {
    const { name, code, type, parent_id, ...permData } = request;

    if (!name || name.trim().length === 0) {
      throwValidationError('权限名称不能为空');
    }

    if (!code || code.trim().length === 0) {
      throwValidationError('权限编码不能为空');
    }

    if (![1, 2, 3].includes(type)) {
      throwValidationError('权限类型无效');
    }

    const existing = await this.permissionRepository.findByCode(code);
    if (existing) {
      throwConflictError('权限编码已存在');
    }

    if (parent_id) {
      if (!isValidId(parent_id)) {
        throwValidationError('无效的父级ID');
      }
      const parent = await this.permissionRepository.findById(parent_id);
      if (!parent) {
        throwNotFoundError('父级权限不存在');
      }
    }

    const permission = await this.permissionRepository.create({
      ...permData,
      name: name.trim(),
      code: code.trim(),
      type,
      parent_id,
      status: request.status ?? 1,
      visible: request.visible ?? 1
    });

    return this.getPermissionById(permission.id);
  }

  async updatePermission(id: string, request: UpdatePermissionRequest): Promise<PermissionVO> {
    if (!isValidId(id)) {
      throwValidationError('无效的权限ID');
    }

    const permission = await this.permissionRepository.findById(id);
    if (!permission) {
      throwNotFoundError('权限不存在');
    }

    const { parent_id, ...updateData } = request;

    if (parent_id) {
      if (!isValidId(parent_id)) {
        throwValidationError('无效的父级ID');
      }
      if (parent_id === id) {
        throwValidationError('父级不能是自己');
      }
      const parent = await this.permissionRepository.findById(parent_id);
      if (!parent) {
        throwNotFoundError('父级权限不存在');
      }
    }

    await this.permissionRepository.update(id, { ...updateData, parent_id });

    return this.getPermissionById(id);
  }

  async deletePermission(id: string): Promise<void> {
    if (!isValidId(id)) {
      throwValidationError('无效的权限ID');
    }

    const permission = await this.permissionRepository.findById(id);
    if (!permission) {
      throwNotFoundError('权限不存在');
    }

    const hasChildren = await this.permissionRepository.hasChildren(id);
    if (hasChildren) {
      throwBusinessError('存在子权限，不能删除');
    }

    const hasRoles = await this.permissionRepository.hasRoles(id);
    if (hasRoles) {
      throwBusinessError('权限被角色引用，不能删除');
    }

    await this.permissionRepository.delete(id);
  }

  async updatePermissionStatus(id: string, status: number): Promise<void> {
    if (!isValidId(id)) {
      throwValidationError('无效的权限ID');
    }

    if (status !== 0 && status !== 1) {
      throwValidationError('状态值无效');
    }

    const permission = await this.permissionRepository.findById(id);
    if (!permission) {
      throwNotFoundError('权限不存在');
    }

    await this.permissionRepository.update(id, { status });
  }
}