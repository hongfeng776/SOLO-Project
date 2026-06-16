import { RoleRepository, PermissionRepository } from '../repositories';
import {
  CreateRoleRequest,
  UpdateRoleRequest,
  RoleQueryParams,
  PaginatedResult,
  RoleVO
} from '../types';
import {
  throwBusinessError,
  throwNotFoundError,
  throwConflictError,
  throwValidationError
} from '../utils';
import { isValidId } from '../utils/validate';
import * as _ from 'lodash';
import { Op } from 'sequelize';

export class RoleService {
  private roleRepository: RoleRepository;
  private permissionRepository: PermissionRepository;

  constructor() {
    this.roleRepository = new RoleRepository();
    this.permissionRepository = new PermissionRepository();
  }

  async getRoleList(params: RoleQueryParams): Promise<PaginatedResult<RoleVO>> {
    const { page, pageSize, ...queryParams } = params;
    const where = this.roleRepository.buildQuery(queryParams);

    const result = await this.roleRepository.findPaginated(
      { page, pageSize },
      where,
      { sortBy: 'sort', sortOrder: 'ASC' },
      { include: [this.roleRepository.getPermissionsInclude()] }
    );

    const list: RoleVO[] = result.list.map(role => {
      const roleData = role.toJSON ? role.toJSON() : role;
      const vo: RoleVO = { ...roleData } as RoleVO;

      if (roleData.permissions) {
        vo.permissions = roleData.permissions.map((p: any) => ({
          id: p.id,
          name: p.name,
          code: p.code
        }));
      }

      return vo;
    });

    return { ...result, list };
  }

  async getAllRoles(): Promise<RoleVO[]> {
    const roles = await this.roleRepository.findAll({
      where: { status: 1 },
      order: [['sort', 'ASC'], ['created_at', 'ASC']]
    });

    return roles.map(role => {
      const roleData = role.toJSON ? role.toJSON() : role;
      return roleData as RoleVO;
    });
  }

  async getRoleById(id: string): Promise<RoleVO> {
    if (!isValidId(id)) {
      throwValidationError('无效的角色ID');
    }

    const role = await this.roleRepository.findWithPermissions(id);
    if (!role) {
      throwNotFoundError('角色不存在');
    }

    const roleData = role.toJSON ? role.toJSON() : role;
    const vo: RoleVO = { ...roleData } as RoleVO;

    if (roleData.permissions) {
      vo.permissions = roleData.permissions.map((p: any) => ({
        id: p.id,
        name: p.name,
        code: p.code
      }));
    }

    return vo;
  }

  async createRole(request: CreateRoleRequest): Promise<RoleVO> {
    const { name, code, permission_ids = [], ...roleData } = request;

    if (!name || name.trim().length === 0) {
      throwValidationError('角色名称不能为空');
    }

    if (!code || code.trim().length === 0) {
      throwValidationError('角色编码不能为空');
    }

    const existingRole = await this.roleRepository.findByCode(code);
    if (existingRole) {
      throwConflictError('角色编码已存在');
    }

    if (permission_ids && permission_ids.length > 0) {
      for (const permId of permission_ids) {
        if (!isValidId(permId)) {
          throwValidationError('无效的权限ID');
        }
        const perm = await this.permissionRepository.findById(permId);
        if (!perm) {
          throwNotFoundError(`权限不存在: ${permId}`);
        }
      }
    }

    const role = await this.roleRepository.create({
      ...roleData,
      name: name.trim(),
      code: code.trim(),
      status: request.status ?? 1
    });

    if (permission_ids && permission_ids.length > 0) {
      await this.roleRepository.assignPermissions(role.id, permission_ids);
    }

    return this.getRoleById(role.id);
  }

  async updateRole(id: string, request: UpdateRoleRequest): Promise<RoleVO> {
    if (!isValidId(id)) {
      throwValidationError('无效的角色ID');
    }

    const role = await this.roleRepository.findById(id);
    if (!role) {
      throwNotFoundError('角色不存在');
    }

    if (role.code === 'admin') {
      throwBusinessError('不能修改超级管理员角色');
    }

    const { permission_ids, ...updateData } = request;

    if (permission_ids && permission_ids.length > 0) {
      for (const permId of permission_ids) {
        if (!isValidId(permId)) {
          throwValidationError('无效的权限ID');
        }
        const perm = await this.permissionRepository.findById(permId);
        if (!perm) {
          throwNotFoundError(`权限不存在: ${permId}`);
        }
      }
      await this.roleRepository.assignPermissions(id, permission_ids);
    }

    if (Object.keys(updateData).length > 0) {
      await this.roleRepository.update(id, updateData);
    }

    return this.getRoleById(id);
  }

  async deleteRole(id: string): Promise<void> {
    if (!isValidId(id)) {
      throwValidationError('无效的角色ID');
    }

    const role = await this.roleRepository.findById(id);
    if (!role) {
      throwNotFoundError('角色不存在');
    }

    if (role.code === 'admin') {
      throwBusinessError('不能删除超级管理员角色');
    }

    const hasUsers = await this.roleRepository.hasUsers(id);
    if (hasUsers) {
      throwBusinessError('该角色下存在用户，不能删除');
    }

    await this.roleRepository.delete(id);
  }

  async batchDeleteRoles(ids: string[]): Promise<void> {
    if (!ids || ids.length === 0) {
      throwValidationError('请选择要删除的角色');
    }

    for (const id of ids) {
      if (!isValidId(id)) {
        throwValidationError('无效的角色ID');
      }
    }

    const hasAdmin = await this.roleRepository.exists({
      id: { [Op.in]: ids },
      code: 'admin'
    });
    if (hasAdmin) {
      throwBusinessError('不能删除超级管理员角色');
    }

    for (const id of ids) {
      const hasUsers = await this.roleRepository.hasUsers(id);
      if (hasUsers) {
        const role = await this.roleRepository.findById(id);
        throwBusinessError(`角色"${role?.name}"下存在用户，不能删除`);
      }
    }

    await this.roleRepository.deleteByWhere({ id: { [Op.in]: ids } });
  }

  async updateRoleStatus(id: string, status: number): Promise<void> {
    if (!isValidId(id)) {
      throwValidationError('无效的角色ID');
    }

    if (status !== 0 && status !== 1) {
      throwValidationError('状态值无效');
    }

    const role = await this.roleRepository.findById(id);
    if (!role) {
      throwNotFoundError('角色不存在');
    }

    if (role.code === 'admin' && status === 0) {
      throwBusinessError('不能禁用超级管理员角色');
    }

    await this.roleRepository.update(id, { status });
  }

  async assignPermissions(roleId: string, permissionIds: string[]): Promise<void> {
    if (!isValidId(roleId)) {
      throwValidationError('无效的角色ID');
    }

    const role = await this.roleRepository.findById(roleId);
    if (!role) {
      throwNotFoundError('角色不存在');
    }

    if (permissionIds && permissionIds.length > 0) {
      for (const permId of permissionIds) {
        if (!isValidId(permId)) {
          throwValidationError('无效的权限ID');
        }
        const perm = await this.permissionRepository.findById(permId);
        if (!perm) {
          throwNotFoundError(`权限不存在: ${permId}`);
        }
      }
    }

    await this.roleRepository.assignPermissions(roleId, permissionIds || []);
  }
}