import { UserRepository, OrganizationRepository, RoleRepository } from '../repositories';
import { User, CreateUserRequest, UpdateUserRequest, UserQueryParams, PaginatedResult, UserVO } from '../types';
import {
  hashPassword,
  validatePasswordStrength,
  throwBusinessError,
  throwNotFoundError,
  throwConflictError,
  throwValidationError
} from '../utils';
import { isValidId, isValidUsername, isValidEmail, isValidPhone } from '../utils/validate';
import * as _ from 'lodash';
import { Op } from 'sequelize';

export class UserService {
  private userRepository: UserRepository;
  private organizationRepository: OrganizationRepository;
  private roleRepository: RoleRepository;

  constructor() {
    this.userRepository = new UserRepository();
    this.organizationRepository = new OrganizationRepository();
    this.roleRepository = new RoleRepository();
  }

  async getUserList(params: UserQueryParams): Promise<PaginatedResult<UserVO>> {
    const { page, pageSize, ...queryParams } = params;
    const where = this.userRepository.buildQuery(queryParams);

    const rolesInclude = this.userRepository.getRolesInclude();
    const include: any[] = [
      rolesInclude as any,
      this.userRepository.getOrganizationInclude()
    ];

    if (queryParams.role_id) {
      include[0] = {
        ...(rolesInclude as any),
        where: { id: queryParams.role_id },
        required: true
      };
    }

    const result = await this.userRepository.findPaginated(
      { page, pageSize },
      where,
      { sortBy: 'createdAt', sortOrder: 'DESC' },
      { include }
    );

    const list: UserVO[] = result.list.map(user => {
      const userData = user.toJSON ? user.toJSON() : user;
      const vo: UserVO = _.omit(userData, ['password']) as UserVO;

      if (userData.roles) {
        vo.roles = userData.roles.map((r: any) => ({
          id: r.id,
          name: r.name,
          code: r.code
        }));
      }

      if (userData.organization) {
        vo.org_name = userData.organization.name;
      }

      return vo;
    });

    return { ...result, list };
  }

  async getUserById(id: string): Promise<UserVO> {
    if (!isValidId(id)) {
      throwValidationError('无效的用户ID');
    }

    const user = await this.userRepository.findWithRoles(id);
    if (!user) {
      throwNotFoundError('用户不存在');
    }

    const userData = user.toJSON ? user.toJSON() : user;
    const vo: UserVO = _.omit(userData, ['password']) as UserVO;

    if (userData.roles) {
      vo.roles = userData.roles.map((r: any) => ({
        id: r.id,
        name: r.name,
        code: r.code
      }));
    }

    if (userData.organization) {
      vo.org_name = userData.organization.name;
    }

    return vo;
  }

  async createUser(request: CreateUserRequest): Promise<UserVO> {
    const { username, password, org_id, role_ids = [], ...userData } = request;

    if (!isValidUsername(username)) {
      throwValidationError('用户名格式不正确，应为4-32位字母数字下划线');
    }

    const existingUser = await this.userRepository.findByUsername(username);
    if (existingUser) {
      throwConflictError('用户名已存在');
    }

    const strength = validatePasswordStrength(password);
    if (!strength.valid) {
      throwValidationError(strength.message);
    }

    if (userData.email && !isValidEmail(userData.email)) {
      throwValidationError('邮箱格式不正确');
    }

    if (userData.phone && !isValidPhone(userData.phone)) {
      throwValidationError('手机号格式不正确');
    }

    if (org_id && !isValidId(org_id)) {
      throwValidationError('无效的机构ID');
    }

    if (org_id) {
      const org = await this.organizationRepository.findById(org_id);
      if (!org) {
        throwNotFoundError('机构不存在');
      }
    }

    if (role_ids && role_ids.length > 0) {
      for (const roleId of role_ids) {
        if (!isValidId(roleId)) {
          throwValidationError('无效的角色ID');
        }
        const role = await this.roleRepository.findById(roleId);
        if (!role) {
          throwNotFoundError(`角色不存在: ${roleId}`);
        }
      }
    }

    const hashedPassword = await hashPassword(password);

    const user = await this.userRepository.create({
      ...userData,
      username,
      password: hashedPassword,
      org_id,
      status: request.status ?? 1
    });

    if (role_ids && role_ids.length > 0) {
      await this.userRepository.assignRoles(user.id, role_ids);
    }

    return this.getUserById(user.id);
  }

  async updateUser(id: string, request: UpdateUserRequest): Promise<UserVO> {
    if (!isValidId(id)) {
      throwValidationError('无效的用户ID');
    }

    const user = await this.userRepository.findById(id);
    if (!user) {
      throwNotFoundError('用户不存在');
    }

    const { org_id, role_ids, ...updateData } = request;

    if (updateData.email && !isValidEmail(updateData.email)) {
      throwValidationError('邮箱格式不正确');
    }

    if (updateData.phone && !isValidPhone(updateData.phone)) {
      throwValidationError('手机号格式不正确');
    }

    if (org_id && !isValidId(org_id)) {
      throwValidationError('无效的机构ID');
    }

    if (org_id) {
      const org = await this.organizationRepository.findById(org_id);
      if (!org) {
        throwNotFoundError('机构不存在');
      }
    }

    if (role_ids && role_ids.length > 0) {
      for (const roleId of role_ids) {
        if (!isValidId(roleId)) {
          throwValidationError('无效的角色ID');
        }
        const role = await this.roleRepository.findById(roleId);
        if (!role) {
          throwNotFoundError(`角色不存在: ${roleId}`);
        }
      }
      await this.userRepository.assignRoles(id, role_ids);
    }

    if (Object.keys(updateData).length > 0 || org_id !== undefined) {
      await this.userRepository.update(id, { ...updateData, org_id });
    }

    return this.getUserById(id);
  }

  async deleteUser(id: string): Promise<void> {
    if (!isValidId(id)) {
      throwValidationError('无效的用户ID');
    }

    const user = await this.userRepository.findById(id);
    if (!user) {
      throwNotFoundError('用户不存在');
    }

    if (user.username === 'admin') {
      throwBusinessError('不能删除超级管理员账号');
    }

    await this.userRepository.delete(id);
  }

  async batchDeleteUsers(ids: string[]): Promise<void> {
    if (!ids || ids.length === 0) {
      throwValidationError('请选择要删除的用户');
    }

    for (const id of ids) {
      if (!isValidId(id)) {
        throwValidationError('无效的用户ID');
      }
    }

    const hasAdmin = await this.userRepository.exists({
      id: { [Op.in]: ids },
      username: 'admin'
    });
    if (hasAdmin) {
      throwBusinessError('不能删除超级管理员账号');
    }

    await this.userRepository.deleteByWhere({ id: { [Op.in]: ids } });
  }

  async updateUserStatus(id: string, status: number): Promise<void> {
    if (!isValidId(id)) {
      throwValidationError('无效的用户ID');
    }

    if (status !== 0 && status !== 1) {
      throwValidationError('状态值无效');
    }

    const user = await this.userRepository.findById(id);
    if (!user) {
      throwNotFoundError('用户不存在');
    }

    if (user.username === 'admin' && status === 0) {
      throwBusinessError('不能禁用超级管理员账号');
    }

    await this.userRepository.update(id, { status });
  }

  async resetPassword(id: string, newPassword: string): Promise<void> {
    if (!isValidId(id)) {
      throwValidationError('无效的用户ID');
    }

    const user = await this.userRepository.findById(id);
    if (!user) {
      throwNotFoundError('用户不存在');
    }

    const strength = validatePasswordStrength(newPassword);
    if (!strength.valid) {
      throwValidationError(strength.message);
    }

    const hashedPassword = await hashPassword(newPassword);
    await this.userRepository.update(id, { password: hashedPassword });
  }

  async assignRoles(userId: string, roleIds: string[]): Promise<void> {
    if (!isValidId(userId)) {
      throwValidationError('无效的用户ID');
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throwNotFoundError('用户不存在');
    }

    if (roleIds && roleIds.length > 0) {
      for (const roleId of roleIds) {
        if (!isValidId(roleId)) {
          throwValidationError('无效的角色ID');
        }
        const role = await this.roleRepository.findById(roleId);
        if (!role) {
          throwNotFoundError(`角色不存在: ${roleId}`);
        }
      }
    }

    await this.userRepository.assignRoles(userId, roleIds || []);
  }
}