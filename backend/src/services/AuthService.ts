import { UserRepository, RoleRepository, PermissionRepository } from '../repositories';
import { LoginRequest, LoginResponse, JwtPayload, ChangePasswordRequest, UserVO } from '../types';
import {
  generateToken,
  comparePassword,
  hashPassword,
  verifyRefreshToken,
  throwBusinessError,
  throwNotFoundError,
  throwValidationError,
  validatePasswordStrength
} from '../utils';
import { getClientIp } from '../utils/request';
import { Request } from 'express';
import * as _ from 'lodash';

export class AuthService {
  private userRepository: UserRepository;
  private roleRepository: RoleRepository;
  private permissionRepository: PermissionRepository;

  constructor() {
    this.userRepository = new UserRepository();
    this.roleRepository = new RoleRepository();
    this.permissionRepository = new PermissionRepository();
  }

  async login(loginRequest: LoginRequest, req: Request): Promise<LoginResponse> {
    const { username, password } = loginRequest;

    const user = await this.userRepository.findByUsername(username, {
      include: [
        this.userRepository.getRolesInclude(),
        this.userRepository.getOrganizationInclude()
      ]
    });

    if (!user) {
      throwBusinessError('用户名或密码错误');
    }

    if (user.status !== 1) {
      throwBusinessError('账号已被禁用，请联系管理员');
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throwBusinessError('用户名或密码错误');
    }

    const userData = user.toJSON ? user.toJSON() : user;

    const roles = userData.roles || [];
    const roleIds = roles.map((r: any) => r.id);
    const roleCodes = roles.map((r: any) => r.code);

    const permissions = await this.permissionRepository.findByRoleIds(roleIds);
    const permissionCodes = permissions.map(p => p.code);

    const payload: JwtPayload = {
      userId: user.id,
      username: user.username,
      orgId: userData.organization?.id,
      roles: roleCodes,
      permissions: permissionCodes
    };

    const loginResponse = generateToken(payload);

    await this.userRepository.update(user.id, {
      last_login_at: new Date(),
      last_login_ip: getClientIp(req)
    });

    return loginResponse;
  }

  async refreshToken(refreshToken: string): Promise<LoginResponse> {
    const { userId } = verifyRefreshToken(refreshToken);

    const user = await this.userRepository.findWithRoles(userId);
    if (!user) {
      throwNotFoundError('用户不存在');
    }

    if (user.status !== 1) {
      throwBusinessError('账号已被禁用，请联系管理员');
    }

    const userData = user.toJSON ? user.toJSON() : user;
    const roles = userData.roles || [];
    const roleIds = roles.map((r: any) => r.id);
    const roleCodes = roles.map((r: any) => r.code);

    const permissions = await this.permissionRepository.findByRoleIds(roleIds);
    const permissionCodes = permissions.map(p => p.code);

    const payload: JwtPayload = {
      userId: user.id,
      username: user.username,
      orgId: userData.organization?.id,
      roles: roleCodes,
      permissions: permissionCodes
    };

    return generateToken(payload);
  }

  async getUserInfo(userId: string): Promise<UserVO> {
    const user = await this.userRepository.findWithRoles(userId);
    if (!user) {
      throwNotFoundError('用户不存在');
    }

    const userData = user.toJSON ? user.toJSON() : user;
    const userVO: UserVO = _.omit(userData, ['password']) as UserVO;

    if (userData.roles) {
      userVO.roles = userData.roles.map((r: any) => ({
        id: r.id,
        name: r.name,
        code: r.code
      }));
    }

    if (userData.organization) {
      userVO.org_name = userData.organization.name;
    }

    return userVO;
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    const user = await this.userRepository.findWithRoles(userId);
    if (!user) {
      return [];
    }

    const userData = user.toJSON ? user.toJSON() : user;
    const roles = userData.roles || [];

    if (roles.some((r: any) => r.code === 'admin')) {
      const allPermissions = await this.permissionRepository.findAll({
        where: { status: 1, type: 3 },
        attributes: ['code']
      });
      return allPermissions.map(p => p.code);
    }

    const roleIds = roles.map((r: any) => r.id);
    const permissions = await this.permissionRepository.findByRoleIds(roleIds);
    return permissions
      .filter(p => p.type === 3)
      .map(p => p.code);
  }

  async getUserMenus(userId: string): Promise<any[]> {
    const user = await this.userRepository.findWithRoles(userId);
    if (!user) {
      return [];
    }

    const userData = user.toJSON ? user.toJSON() : user;
    const roles = userData.roles || [];

    let menuPermissions: any[];

    if (roles.some((r: any) => r.code === 'admin')) {
      menuPermissions = await this.permissionRepository.findAll({
        where: {
          status: 1,
          type: [1, 2]
        },
        order: [['sort', 'ASC'], ['created_at', 'ASC']]
      });
    } else {
      const roleIds = roles.map((r: any) => r.id);
      menuPermissions = await this.permissionRepository.findByRoleIds(roleIds);
      menuPermissions = menuPermissions.filter(p => p.type === 1 || p.type === 2);
    }

    return this.buildMenuTree(menuPermissions);
  }

  private buildMenuTree(permissions: any[]): any[] {
    const map = new Map<string, any>();
    const roots: any[] = [];

    permissions.forEach(perm => {
      const node = {
        id: perm.id,
        parent_id: perm.parent_id,
        name: perm.name,
        path: perm.path || '',
        component: perm.component || '',
        icon: perm.icon || '',
        code: perm.code,
        type: perm.type,
        sort: perm.sort || 0,
        visible: perm.visible !== 0,
        redirect: perm.redirect || '',
        perms: perm.perms || '',
        children: []
      };
      map.set(perm.id, node);
    });

    map.forEach(node => {
      if (node.parent_id && map.has(node.parent_id)) {
        map.get(node.parent_id).children.push(node);
      } else {
        roots.push(node);
      }
    });

    const sortTree = (nodes: any[]) => {
      nodes.sort((a, b) => a.sort - b.sort);
      nodes.forEach(n => sortTree(n.children));
    };
    sortTree(roots);

    return roots;
  }

  async changePassword(userId: string, request: ChangePasswordRequest): Promise<void> {
    const { oldPassword, newPassword } = request;

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throwNotFoundError('用户不存在');
    }

    const isPasswordValid = await comparePassword(oldPassword, user.password);
    if (!isPasswordValid) {
      throwBusinessError('原密码错误');
    }

    const strength = validatePasswordStrength(newPassword);
    if (!strength.valid) {
      throwValidationError(strength.message);
    }

    const hashedPassword = await hashPassword(newPassword);
    await this.userRepository.update(userId, { password: hashedPassword });
  }

  async logout(userId: string): Promise<void> {
    console.log(`[Auth] User ${userId} logged out`);
  }
}