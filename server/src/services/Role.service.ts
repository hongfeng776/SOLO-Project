import { roleDao } from '../dao';
import { RoleAttributes, RoleCreationAttributes } from '../models/Role.model';
import { PaginationParams, PaginationResult } from '../types';
import { BusinessCode } from '../constants/statusCode';
import { AppError } from '../middleware/error.middleware';

interface RoleQueryParams extends PaginationParams {
  keyword?: string;
  status?: number;
}

class RoleService {
  public async create(data: RoleCreationAttributes) {
    const exists = await roleDao.existsByCode(data.code);
    if (exists) {
      throw new AppError('角色编码已存在', BusinessCode.ERROR);
    }
    return roleDao.create(data);
  }

  public async findById(id: string) {
    const role = await roleDao.findById(id);
    if (!role) {
      throw new AppError('角色不存在', BusinessCode.NOT_FOUND);
    }
    return role;
  }

  public async findAll(params: RoleQueryParams): Promise<PaginationResult<any>> {
    const { page, pageSize } = params;
    const { rows, count } = await roleDao.findAllPaged(params);
    return {
      list: rows,
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    };
  }

  public async update(id: string, data: Partial<RoleAttributes>) {
    const role = await roleDao.findById(id);
    if (!role) {
      throw new AppError('角色不存在', BusinessCode.NOT_FOUND);
    }
    if (data.code && data.code !== role.code) {
      const exists = await roleDao.existsByCodeAndId(data.code, id);
      if (exists) {
        throw new AppError('角色编码已存在', BusinessCode.ERROR);
      }
    }
    await roleDao.update(data, { where: { id } });
    return roleDao.findById(id);
  }

  public async delete(id: string): Promise<void> {
    const role = await roleDao.findById(id);
    if (!role) {
      throw new AppError('角色不存在', BusinessCode.NOT_FOUND);
    }
    await roleDao.softDelete(id);
  }

  public async bulkDelete(ids: string[]): Promise<void> {
    if (!ids || ids.length === 0) {
      throw new AppError('请选择要删除的记录', BusinessCode.PARAM_ERROR);
    }
    await roleDao.bulkSoftDelete(ids);
  }

  public async updateStatus(id: string, status: number): Promise<void> {
    const role = await roleDao.findById(id);
    if (!role) {
      throw new AppError('角色不存在', BusinessCode.NOT_FOUND);
    }
    await roleDao.update({ status: status as any }, { where: { id } });
  }

  public async assignPermissions(roleId: string, permissionIds: string[]): Promise<void> {
    const role = await roleDao.findById(roleId);
    if (!role) {
      throw new AppError('角色不存在', BusinessCode.NOT_FOUND);
    }
    await roleDao.assignPermissions(roleId, permissionIds);
  }

  public async getPermissions(roleId: string) {
    const role = await roleDao.findById(roleId);
    if (!role) {
      throw new AppError('角色不存在', BusinessCode.NOT_FOUND);
    }
    return roleDao.getPermissions(roleId);
  }
}

export default new RoleService();
