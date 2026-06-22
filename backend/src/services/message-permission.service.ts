import { Op } from 'sequelize';
import messagePermissionDAO from '../dao/message-permission.dao';
import messagePermissionLogDAO from '../dao/message-permission-log.dao';
import userDao from '../dao/user.dao';
import {
  MessagePermissionStatus,
  MessagePermissionStatusLabel,
  MessagePermissionAction,
  MessageTemplateScene,
  MessagePushChannel,
  MessageNotificationType,
  ROLE_MESSAGE_SCENE_MAP,
  MESSAGE_PERMISSION_VALIDATION_RULES,
  MESSAGE_PERMISSION_BATCH_LIMIT,
  UserRole,
} from '../constants/recruitment.enum';
import { NotFoundError, ForbiddenError, BadRequestError, ConflictError } from '../utils/app-error';
import User from '../models/user.model';

interface CurrentUser {
  id: number;
  username: string;
  role: string;
  companyId?: number;
  realName?: string;
}

interface PermissionValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  conflicts: string[];
}

interface BatchOperationResult {
  totalCount: number;
  successCount: number;
  failCount: number;
  failedIds: number[];
  errors: string[];
}

interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  blockedScene?: string;
  blockedChannel?: string;
}

class MessagePermissionService {
  async getList(params: any, currentUser: CurrentUser) {
    const queryParams = { ...params };

    if (currentUser.role !== UserRole.ADMIN && currentUser.companyId) {
      queryParams.companyId = currentUser.companyId;
    }

    return messagePermissionDAO.getList(queryParams);
  }

  async getById(id: number, currentUser: CurrentUser) {
    const permission = await messagePermissionDAO.findById(id);
    if (!permission) {
      throw new NotFoundError('消息权限配置不存在');
    }

    if (currentUser.role !== UserRole.ADMIN) {
      if (currentUser.companyId && (permission as any).companyId !== currentUser.companyId) {
        throw new ForbiddenError('无权限查看该配置');
      }
    }

    return permission;
  }

  async getByUserId(userId: number, currentUser: CurrentUser) {
    const permission = await messagePermissionDAO.findByUserId(userId);
    if (!permission) {
      const defaultPerm = await this.createDefaultPermission(userId, currentUser);
      return defaultPerm;
    }

    if (currentUser.role !== UserRole.ADMIN && userId !== currentUser.id) {
      if (currentUser.companyId && (permission as any).companyId !== currentUser.companyId) {
        throw new ForbiddenError('无权限查看该配置');
      }
    }

    return permission;
  }

  async getMyPermission(currentUser: CurrentUser) {
    return this.getByUserId(currentUser.id, currentUser);
  }

  validatePermissionConfig(data: any): PermissionValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const conflicts: string[] = [];

    if (!data.userId) {
      errors.push('用户ID不能为空');
    }

    if (!data.permissionStatus) {
      errors.push('权限状态不能为空');
    }

    if (data.permissionStatus === MessagePermissionStatus.PARTIAL_RECEIVE) {
      let allowedScenes: string[] = [];
      try {
        allowedScenes = data.allowedScenes ? JSON.parse(data.allowedScenes) : [];
      } catch {
        allowedScenes = [];
      }

      if (MESSAGE_PERMISSION_VALIDATION_RULES.requireAtLeastOneSceneForPartial && allowedScenes.length === 0) {
        errors.push('部分接收模式必须指定至少一个允许的消息场景');
      }
    }

    if (data.userRole && MESSAGE_PERMISSION_VALIDATION_RULES.conflictCheckEnabled) {
      const roleAllowedScenes = ROLE_MESSAGE_SCENE_MAP[data.userRole] || [];
      let configAllowedScenes: string[] = [];
      try {
        configAllowedScenes = data.allowedScenes ? JSON.parse(data.allowedScenes) : [];
      } catch {
        configAllowedScenes = [];
      }

      if (data.permissionStatus === MessagePermissionStatus.FULL_RECEIVE) {
        configAllowedScenes = roleAllowedScenes;
      }

      const invalidScenes = configAllowedScenes.filter(
        (scene: string) => !roleAllowedScenes.includes(scene as MessageTemplateScene)
      );

      if (invalidScenes.length > 0 && !MESSAGE_PERMISSION_VALIDATION_RULES.allowCrossRoleAssignment) {
        conflicts.push(`以下场景超出角色权限范围：${invalidScenes.join('、')}`);
      }
    }

    if (data.effectiveTime && data.expiryTime) {
      if (new Date(data.effectiveTime) >= new Date(data.expiryTime)) {
        errors.push('生效时间必须早于过期时间');
      }
    }

    if (data.allowedScenes && data.blockedScenes) {
      let allowed: string[] = [];
      let blocked: string[] = [];
      try {
        allowed = data.allowedScenes ? JSON.parse(data.allowedScenes) : [];
        blocked = data.blockedScenes ? JSON.parse(data.blockedScenes) : [];
      } catch {
        // ignore parse errors
      }

      const intersection = allowed.filter(s => blocked.includes(s));
      if (intersection.length > 0) {
        conflicts.push(`以下场景同时存在于允许和禁止列表：${intersection.join('、')}`);
      }
    }

    return {
      valid: errors.length === 0 && conflicts.length === 0,
      errors,
      warnings,
      conflicts,
    };
  }

  async createDefaultPermission(userId: number, operator: CurrentUser) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new NotFoundError('用户不存在');
    }

    const existing = await messagePermissionDAO.checkPermissionExists(userId);
    if (existing) {
      throw new ConflictError('该用户的消息权限配置已存在');
    }

    const defaultConfig = messagePermissionDAO.getDefaultConfigForRole(user.role as UserRole);

    const permissionData = {
      userId: user.id,
      username: user.username,
      userRole: user.role,
      department: (user as any).department,
      position: (user as any).position,
      ...defaultConfig,
      configSource: 'auto',
      companyId: (user as any).companyId,
      createdBy: operator.id,
      createdByName: operator.realName || operator.username,
      remark: '系统自动创建默认权限配置',
    };

    const permission = await messagePermissionDAO.create(permissionData);

    await messagePermissionLogDAO.create({
      permissionId: permission.id,
      userId: user.id,
      username: user.username,
      action: MessagePermissionAction.CREATE,
      actionDetail: '系统自动创建默认权限配置',
      newPermissionStatus: permission.permissionStatus,
      newAllowedScenes: (permission as any).allowedScenes,
      newBlockedScenes: (permission as any).blockedScenes,
      newValue: JSON.stringify(permissionData),
      operatorId: operator.id,
      operatorName: operator.realName || operator.username,
      operatorRole: operator.role,
      validationResult: JSON.stringify({ valid: true, errors: [] }),
    });

    return permission;
  }

  async createPermission(data: any, currentUser: CurrentUser) {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenError('仅超级管理员可创建消息权限配置');
    }

    const user = await User.findByPk(data.userId);
    if (!user) {
      throw new NotFoundError('用户不存在');
    }

    const existing = await messagePermissionDAO.checkPermissionExists(data.userId);
    if (existing) {
      throw new ConflictError('该用户的消息权限配置已存在');
    }

    const validation = this.validatePermissionConfig({ ...data, userRole: user.role });
    if (!validation.valid) {
      const errorMsg = validation.errors.length > 0
        ? validation.errors[0]
        : validation.conflicts.length > 0
          ? validation.conflicts[0]
          : '配置校验失败';
      throw new BadRequestError(errorMsg);
    }

    const permissionData = {
      ...data,
      username: user.username,
      userRole: user.role,
      department: (user as any).department,
      position: (user as any).position,
      companyId: (user as any).companyId,
      configSource: 'manual',
      createdBy: currentUser.id,
      createdByName: currentUser.realName || currentUser.username,
      updatedBy: currentUser.id,
      updatedByName: currentUser.realName || currentUser.username,
    };

    const permission = await messagePermissionDAO.create(permissionData);

    await messagePermissionLogDAO.create({
      permissionId: permission.id,
      userId: data.userId,
      username: user.username,
      action: MessagePermissionAction.CREATE,
      actionDetail: '创建消息权限配置',
      newPermissionStatus: permission.permissionStatus,
      newAllowedScenes: (permission as any).allowedScenes,
      newBlockedScenes: (permission as any).blockedScenes,
      newValue: JSON.stringify(permissionData),
      operatorId: currentUser.id,
      operatorName: currentUser.realName || currentUser.username,
      operatorRole: currentUser.role,
      validationResult: JSON.stringify(validation),
    });

    return permission;
  }

  async updatePermission(id: number, data: any, currentUser: CurrentUser) {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenError('仅超级管理员可修改消息权限配置');
    }

    const permission = await messagePermissionDAO.findById(id);
    if (!permission) {
      throw new NotFoundError('消息权限配置不存在');
    }

    const user = await User.findByPk((permission as any).userId);
    if (!user) {
      throw new NotFoundError('用户不存在');
    }

    const oldData = permission.toJSON();
    const updateData = {
      ...data,
      updatedBy: currentUser.id,
      updatedByName: currentUser.realName || currentUser.username,
    };

    const validation = this.validatePermissionConfig({ ...updateData, userRole: user.role });
    if (!validation.valid) {
      const errorMsg = validation.errors.length > 0
        ? validation.errors[0]
        : validation.conflicts.length > 0
          ? validation.conflicts[0]
          : '配置校验失败';
      throw new BadRequestError(errorMsg);
    }

    const changedFields = this.getChangedFields(oldData, updateData);
    if (changedFields.length === 0) {
      throw new ConflictError('未检测到数据变更');
    }

    await messagePermissionDAO.update(id, updateData);

    const updatedPermission = await messagePermissionDAO.findById(id);

    await messagePermissionLogDAO.create({
      permissionId: id,
      userId: (permission as any).userId,
      username: (permission as any).username,
      action: MessagePermissionAction.UPDATE,
      actionDetail: `修改字段：${changedFields.join('、')}`,
      oldPermissionStatus: oldData.permissionStatus,
      newPermissionStatus: updateData.permissionStatus || oldData.permissionStatus,
      oldAllowedScenes: oldData.allowedScenes,
      newAllowedScenes: updateData.allowedScenes || oldData.allowedScenes,
      oldBlockedScenes: oldData.blockedScenes,
      newBlockedScenes: updateData.blockedScenes || oldData.blockedScenes,
      changedFields: JSON.stringify(changedFields),
      oldValue: JSON.stringify(oldData),
      newValue: JSON.stringify(updateData),
      operatorId: currentUser.id,
      operatorName: currentUser.realName || currentUser.username,
      operatorRole: currentUser.role,
      validationResult: JSON.stringify(validation),
      conflictInfo: validation.conflicts.length > 0 ? JSON.stringify(validation.conflicts) : undefined,
    });

    return updatedPermission;
  }

  async enablePermission(id: number, currentUser: CurrentUser) {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenError('仅超级管理员可执行此操作');
    }

    const permission = await messagePermissionDAO.findById(id);
    if (!permission) {
      throw new NotFoundError('消息权限配置不存在');
    }

    if ((permission as any).isEnabled) {
      throw new ConflictError('该配置已处于启用状态');
    }

    await messagePermissionDAO.update(id, {
      isEnabled: true,
      updatedBy: currentUser.id,
      updatedByName: currentUser.realName || currentUser.username,
    });

    await messagePermissionLogDAO.create({
      permissionId: id,
      userId: (permission as any).userId,
      username: (permission as any).username,
      action: MessagePermissionAction.ENABLE,
      actionDetail: '启用权限配置',
      operatorId: currentUser.id,
      operatorName: currentUser.realName || currentUser.username,
      operatorRole: currentUser.role,
    });

    return await messagePermissionDAO.findById(id);
  }

  async disablePermission(id: number, currentUser: CurrentUser) {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenError('仅超级管理员可执行此操作');
    }

    const permission = await messagePermissionDAO.findById(id);
    if (!permission) {
      throw new NotFoundError('消息权限配置不存在');
    }

    if (!(permission as any).isEnabled) {
      throw new ConflictError('该配置已处于停用状态');
    }

    await messagePermissionDAO.update(id, {
      isEnabled: false,
      updatedBy: currentUser.id,
      updatedByName: currentUser.realName || currentUser.username,
    });

    await messagePermissionLogDAO.create({
      permissionId: id,
      userId: (permission as any).userId,
      username: (permission as any).username,
      action: MessagePermissionAction.DISABLE,
      actionDetail: '停用权限配置',
      operatorId: currentUser.id,
      operatorName: currentUser.realName || currentUser.username,
      operatorRole: currentUser.role,
    });

    return await messagePermissionDAO.findById(id);
  }

  async batchUpdateByRole(
    userRole: UserRole,
    updateData: any,
    currentUser: CurrentUser
  ): Promise<BatchOperationResult> {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenError('仅超级管理员可执行批量配置');
    }

    const permissions = await messagePermissionDAO.getByRole(userRole);
    if (permissions.length === 0) {
      return {
        totalCount: 0,
        successCount: 0,
        failCount: 0,
        failedIds: [],
        errors: [],
      };
    }

    if (permissions.length > MESSAGE_PERMISSION_BATCH_LIMIT) {
      throw new BadRequestError(`批量操作数量不能超过${MESSAGE_PERMISSION_BATCH_LIMIT}条`);
    }

    const validation = this.validatePermissionConfig({ ...updateData, userRole });
    if (!validation.valid) {
      throw new BadRequestError(validation.errors[0] || validation.conflicts[0] || '配置校验失败');
    }

    const result: BatchOperationResult = {
      totalCount: permissions.length,
      successCount: 0,
      failCount: 0,
      failedIds: [],
      errors: [],
    };

    const updateFields = {
      ...updateData,
      updatedBy: currentUser.id,
      updatedByName: currentUser.realName || currentUser.username,
    };

    for (const perm of permissions) {
      try {
        const permId = (perm as any).id;
        await messagePermissionDAO.update(permId, updateFields);

        await messagePermissionLogDAO.create({
          permissionId: permId,
          userId: (perm as any).userId,
          username: (perm as any).username,
          action: MessagePermissionAction.BATCH_UPDATE,
          actionDetail: `批量更新角色${userRole}的权限配置`,
          operatorId: currentUser.id,
          operatorName: currentUser.realName || currentUser.username,
          operatorRole: currentUser.role,
          validationResult: JSON.stringify(validation),
        });

        result.successCount++;
      } catch (error: any) {
        result.failCount++;
        result.failedIds.push((perm as any).id);
        result.errors.push(`ID${(perm as any).id}：${error.message}`);
      }
    }

    return result;
  }

  async batchUpdateByDepartment(
    department: string,
    updateData: any,
    currentUser: CurrentUser
  ): Promise<BatchOperationResult> {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenError('仅超级管理员可执行批量配置');
    }

    const permissions = await messagePermissionDAO.getByDepartment(department);
    if (permissions.length === 0) {
      return {
        totalCount: 0,
        successCount: 0,
        failCount: 0,
        failedIds: [],
        errors: [],
      };
    }

    if (permissions.length > MESSAGE_PERMISSION_BATCH_LIMIT) {
      throw new BadRequestError(`批量操作数量不能超过${MESSAGE_PERMISSION_BATCH_LIMIT}条`);
    }

    const result: BatchOperationResult = {
      totalCount: permissions.length,
      successCount: 0,
      failCount: 0,
      failedIds: [],
      errors: [],
    };

    const updateFields = {
      ...updateData,
      updatedBy: currentUser.id,
      updatedByName: currentUser.realName || currentUser.username,
    };

    for (const perm of permissions) {
      try {
        const permId = (perm as any).id;
        const userRole = (perm as any).userRole;
        const validation = this.validatePermissionConfig({ ...updateFields, userRole });
        if (!validation.valid) {
          throw new BadRequestError(validation.errors[0] || validation.conflicts[0] || '校验失败');
        }

        await messagePermissionDAO.update(permId, updateFields);

        await messagePermissionLogDAO.create({
          permissionId: permId,
          userId: (perm as any).userId,
          username: (perm as any).username,
          action: MessagePermissionAction.BATCH_UPDATE,
          actionDetail: `批量更新部门${department}的权限配置`,
          operatorId: currentUser.id,
          operatorName: currentUser.realName || currentUser.username,
          operatorRole: currentUser.role,
          validationResult: JSON.stringify(validation),
        });

        result.successCount++;
      } catch (error: any) {
        result.failCount++;
        result.failedIds.push((perm as any).id);
        result.errors.push(`ID${(perm as any).id}：${error.message}`);
      }
    }

    return result;
  }

  async batchStandardize(currentUser: CurrentUser): Promise<BatchOperationResult> {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenError('仅超级管理员可执行批量标准化');
    }

    const result: BatchOperationResult = {
      totalCount: 0,
      successCount: 0,
      failCount: 0,
      failedIds: [],
      errors: [],
    };

    const roles = [UserRole.ADMIN, UserRole.HR, UserRole.INTERVIEWER];

    for (const role of roles) {
      const defaultConfig = messagePermissionDAO.getDefaultConfigForRole(role);
      const permissions = await messagePermissionDAO.getByRole(role);
      result.totalCount += permissions.length;

      for (const perm of permissions) {
        try {
          const permId = (perm as any).id;
          await messagePermissionDAO.update(permId, {
            ...defaultConfig,
            configSource: 'batch_standardize',
            updatedBy: currentUser.id,
            updatedByName: currentUser.realName || currentUser.username,
          });

          await messagePermissionLogDAO.create({
            permissionId: permId,
            userId: (perm as any).userId,
            username: (perm as any).username,
            action: MessagePermissionAction.BATCH_STANDARDIZE,
            actionDetail: `批量标准化角色${role}的权限配置`,
            operatorId: currentUser.id,
            operatorName: currentUser.realName || currentUser.username,
            operatorRole: currentUser.role,
          });

          result.successCount++;
        } catch (error: any) {
          result.failCount++;
          result.failedIds.push((perm as any).id);
          result.errors.push(`ID${(perm as any).id}：${error.message}`);
        }
      }
    }

    return result;
  }

  async batchDisableRedundant(
    params: { scenes?: string[]; channels?: string[] },
    currentUser: CurrentUser
  ): Promise<BatchOperationResult> {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenError('仅超级管理员可执行此操作');
    }

    const { scenes, channels } = params;

    const allPerms = await messagePermissionDAO.getList({
      page: 1,
      pageSize: 1000,
      isEnabled: true,
    });

    const result: BatchOperationResult = {
      totalCount: 0,
      successCount: 0,
      failCount: 0,
      failedIds: [],
      errors: [],
    };

    for (const perm of allPerms.rows) {
      try {
        const permData = perm.toJSON();
        let shouldUpdate = false;
        const updateData: any = {
          updatedBy: currentUser.id,
          updatedByName: currentUser.realName || currentUser.username,
        };

        if (scenes && scenes.length > 0) {
          let blocked: string[] = [];
          try {
            blocked = permData.blockedScenes ? JSON.parse(permData.blockedScenes) : [];
          } catch {
            blocked = [];
          }
          const newBlocked = [...new Set([...blocked, ...scenes])];
          if (JSON.stringify(newBlocked) !== JSON.stringify(blocked)) {
            updateData.blockedScenes = JSON.stringify(newBlocked);
            shouldUpdate = true;
          }
        }

        if (channels && channels.length > 0) {
          let blockedChannels: string[] = [];
          try {
            blockedChannels = permData.blockedChannels ? JSON.parse(permData.blockedChannels) : [];
          } catch {
            blockedChannels = [];
          }
          const newBlockedChannels = [...new Set([...blockedChannels, ...channels])];
          if (JSON.stringify(newBlockedChannels) !== JSON.stringify(blockedChannels)) {
            updateData.blockedChannels = JSON.stringify(newBlockedChannels);
            shouldUpdate = true;
          }
        }

        if (shouldUpdate) {
          result.totalCount++;
          await messagePermissionDAO.update(permData.id, updateData);

          await messagePermissionLogDAO.create({
            permissionId: permData.id,
            userId: permData.userId,
            username: permData.username,
            action: MessagePermissionAction.BATCH_DISABLE,
            actionDetail: `批量关闭冗余消息：${scenes?.join('、')}${channels?.join('、')}`,
            operatorId: currentUser.id,
            operatorName: currentUser.realName || currentUser.username,
            operatorRole: currentUser.role,
          });

          result.successCount++;
        }
      } catch (error: any) {
        result.failCount++;
        result.failedIds.push((perm as any).id);
        result.errors.push(`ID${(perm as any).id}：${error.message}`);
      }
    }

    return result;
  }

  async checkMessagePermission(
    userId: number,
    scene: MessageTemplateScene,
    channel?: MessagePushChannel,
    notificationType?: MessageNotificationType
  ): Promise<PermissionCheckResult> {
    let permission = await messagePermissionDAO.findByUserId(userId);

    if (!permission) {
      const user = await User.findByPk(userId);
      if (!user) {
        return { allowed: false, reason: '用户不存在' };
      }

      const defaultPerm = messagePermissionDAO.getDefaultConfigForRole(user.role as UserRole);
      permission = await messagePermissionDAO.create({
        userId: user.id,
        username: user.username,
        userRole: user.role,
        department: (user as any).department,
        position: (user as any).position,
        ...defaultPerm,
        configSource: 'auto',
        companyId: (user as any).companyId,
        createdBy: 1,
        createdByName: 'system',
      }) as any;
    }

    const permData = (permission as any).toJSON ? (permission as any).toJSON() : permission;

    if (!permData.isEnabled) {
      return { allowed: false, reason: '消息权限配置已禁用' };
    }

    if (permData.effectiveTime && new Date() < new Date(permData.effectiveTime)) {
      return { allowed: false, reason: '消息权限尚未生效' };
    }

    if (permData.expiryTime && new Date() > new Date(permData.expiryTime)) {
      return { allowed: false, reason: '消息权限已过期' };
    }

    if (permData.permissionStatus === MessagePermissionStatus.NO_RECEIVE) {
      return { allowed: false, reason: '该用户被禁止接收所有消息' };
    }

    let allowedScenes: string[] = [];
    try {
      allowedScenes = permData.allowedScenes ? JSON.parse(permData.allowedScenes) : [];
    } catch {
      allowedScenes = [];
    }

    if (permData.permissionStatus === MessagePermissionStatus.FULL_RECEIVE) {
      allowedScenes = ROLE_MESSAGE_SCENE_MAP[permData.userRole] || [];
    }

    let blockedScenes: string[] = [];
    try {
      blockedScenes = permData.blockedScenes ? JSON.parse(permData.blockedScenes) : [];
    } catch {
      blockedScenes = [];
    }

    if (blockedScenes.includes(scene)) {
      return { allowed: false, reason: '该消息场景被禁止', blockedScene: scene };
    }

    if (permData.permissionStatus === MessagePermissionStatus.PARTIAL_RECEIVE) {
      if (!allowedScenes.includes(scene)) {
        return { allowed: false, reason: '不在允许的消息场景范围内', blockedScene: scene };
      }
    }

    if (channel) {
      let blockedChannels: string[] = [];
      try {
        blockedChannels = permData.blockedChannels ? JSON.parse(permData.blockedChannels) : [];
      } catch {
        blockedChannels = [];
      }

      if (blockedChannels.includes(channel)) {
        return { allowed: false, reason: '该推送渠道被禁止', blockedChannel: channel };
      }
    }

    if (notificationType) {
      let blockedTypes: string[] = [];
      try {
        blockedTypes = permData.blockedNotificationTypes ? JSON.parse(permData.blockedNotificationTypes) : [];
      } catch {
        blockedTypes = [];
      }

      if (blockedTypes.includes(notificationType)) {
        return { allowed: false, reason: '该通知类型被禁止' };
      }
    }

    if (scene === MessageTemplateScene.RISK_CONTROL && !permData.canReceiveRiskMessages) {
      return { allowed: false, reason: '无权限接收风控消息' };
    }

    return { allowed: true };
  }

  async getPermissionLogs(params: any, currentUser: CurrentUser) {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenError('仅超级管理员可查看权限变更日志');
    }
    return messagePermissionLogDAO.getList(params);
  }

  async getPermissionLogsByPermissionId(permissionId: number, currentUser: CurrentUser, page = 1, pageSize = 20) {
    const permission = await messagePermissionDAO.findById(permissionId);
    if (!permission) {
      throw new NotFoundError('消息权限配置不存在');
    }

    if (currentUser.role !== UserRole.ADMIN) {
      if (currentUser.companyId && (permission as any).companyId !== currentUser.companyId) {
        throw new ForbiddenError('无权限查看该日志');
      }
    }

    return messagePermissionLogDAO.getByPermissionId(permissionId, page, pageSize);
  }

  async getPermissionStats(currentUser: CurrentUser) {
    const where: any = {};
    if (currentUser.role !== UserRole.ADMIN && currentUser.companyId) {
      where.companyId = currentUser.companyId;
    }

    const [
      totalCount,
      fullCount,
      partialCount,
      noCount,
      enabledCount,
    ] = await Promise.all([
      messagePermissionDAO.countByStatus(undefined, undefined),
      messagePermissionDAO.countByStatus(MessagePermissionStatus.FULL_RECEIVE, undefined),
      messagePermissionDAO.countByStatus(MessagePermissionStatus.PARTIAL_RECEIVE, undefined),
      messagePermissionDAO.countByStatus(MessagePermissionStatus.NO_RECEIVE, undefined),
      messagePermissionDAO.countByStatus(undefined, undefined),
    ]);

    return {
      totalCount,
      fullReceiveCount: fullCount,
      partialReceiveCount: partialCount,
      noReceiveCount: noCount,
      enabledCount,
      disabledCount: totalCount - enabledCount,
    };
  }

  private getChangedFields(oldData: any, newData: any): string[] {
    const fields = [
      'permissionStatus', 'allowedScenes', 'blockedScenes',
      'allowedChannels', 'blockedChannels', 'allowedNotificationTypes', 'blockedNotificationTypes',
      'canViewSensitiveMessages', 'canReceiveSystemMessages', 'canReceiveRiskMessages',
      'messageQuota', 'effectiveTime', 'expiryTime', 'isEnabled', 'remark',
    ];
    const changed: string[] = [];
    for (const field of fields) {
      if (newData[field] !== undefined && newData[field] !== oldData[field]) {
        changed.push(field);
      }
    }
    return changed;
  }
}

export default new MessagePermissionService();
