import { permissionDao } from '../dao';
import { PermissionTree } from '../dao/Permission.dao';
import { PermissionAttributes, PermissionCreationAttributes } from '../models/Permission.model';
import { BusinessCode } from '../constants/statusCode';
import { AppError } from '../middleware/error.middleware';

class PermissionService {
  public async create(data: PermissionCreationAttributes) {
    const exists = await permissionDao.existsByCode(data.code);
    if (exists) {
      throw new AppError('权限编码已存在', BusinessCode.ERROR);
    }
    return permissionDao.create(data);
  }

  public async findById(id: string) {
    const permission = await permissionDao.findById(id);
    if (!permission) {
      throw new AppError('权限不存在', BusinessCode.NOT_FOUND);
    }
    return permission;
  }

  public async findTree(): Promise<PermissionTree[]> {
    return permissionDao.findTree();
  }

  public async update(id: string, data: Partial<PermissionAttributes>) {
    const permission = await permissionDao.findById(id);
    if (!permission) {
      throw new AppError('权限不存在', BusinessCode.NOT_FOUND);
    }
    if (data.code && data.code !== permission.code) {
      const exists = await permissionDao.existsByCodeAndId(data.code, id);
      if (exists) {
        throw new AppError('权限编码已存在', BusinessCode.ERROR);
      }
    }
    await permissionDao.update(data, { where: { id } });
    return permissionDao.findById(id);
  }

  public async delete(id: string): Promise<void> {
    const permission = await permissionDao.findById(id);
    if (!permission) {
      throw new AppError('权限不存在', BusinessCode.NOT_FOUND);
    }
    await permissionDao.softDelete(id);
  }

  public async bulkDelete(ids: string[]): Promise<void> {
    if (!ids || ids.length === 0) {
      throw new AppError('请选择要删除的记录', BusinessCode.PARAM_ERROR);
    }
    await permissionDao.bulkSoftDelete(ids);
  }

  public async updateStatus(id: string, status: number): Promise<void> {
    const permission = await permissionDao.findById(id);
    if (!permission) {
      throw new AppError('权限不存在', BusinessCode.NOT_FOUND);
    }
    await permissionDao.update({ status: status as any }, { where: { id } });
  }
}

export default new PermissionService();
