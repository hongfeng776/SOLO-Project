import { Op, FindAndCountOptions } from 'sequelize';
import MessagePermission from '../models/message-permission.model';
import {
  MessagePermissionStatus,
  MessageTemplateScene,
  UserRole,
} from '../constants/recruitment.enum';

export interface MessagePermissionQueryParams {
  page?: number;
  pageSize?: number;
  userId?: number;
  userRole?: UserRole;
  department?: string;
  permissionStatus?: MessagePermissionStatus;
  companyId?: number;
  isEnabled?: boolean;
  keyword?: string;
  sortBy?: string;
  sortOrder?: string;
}

class MessagePermissionDAO {
  async findByUserId(userId: number) {
    return MessagePermission.findOne({ where: { userId } });
  }

  async findById(id: number) {
    return MessagePermission.findByPk(id);
  }

  async getList(params: MessagePermissionQueryParams) {
    const {
      page = 1,
      pageSize = 20,
      userId,
      userRole,
      department,
      permissionStatus,
      companyId,
      isEnabled,
      keyword,
      sortBy = 'created_at',
      sortOrder = 'DESC',
    } = params;

    const where: any = {};

    if (userId !== undefined) where.userId = userId;
    if (userRole) where.userRole = userRole;
    if (department) where.department = department;
    if (permissionStatus) where.permissionStatus = permissionStatus;
    if (companyId !== undefined) where.companyId = companyId;
    if (isEnabled !== undefined) where.isEnabled = isEnabled;

    if (keyword) {
      where[Op.or] = [
        { username: { [Op.like]: `%${keyword}%` } },
        { position: { [Op.like]: `%${keyword}%` } },
        { remark: { [Op.like]: `%${keyword}%` } },
      ];
    }

    const options: FindAndCountOptions = {
      where,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [[sortBy, sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC']],
    };

    return MessagePermission.findAndCountAll(options);
  }

  async getByIds(ids: number[]) {
    return MessagePermission.findAll({ where: { id: { [Op.in]: ids } } });
  }

  async getByUserIds(userIds: number[]) {
    return MessagePermission.findAll({ where: { userId: { [Op.in]: userIds } } });
  }

  async create(data: any) {
    return MessagePermission.create(data);
  }

  async update(id: number, data: any) {
    const result = await MessagePermission.update(data, { where: { id } });
    return result[0] > 0;
  }

  async updateByUserId(userId: number, data: any) {
    const result = await MessagePermission.update(data, { where: { userId } });
    return result[0] > 0;
  }

  async batchUpdate(ids: number[], data: any) {
    return MessagePermission.update(data, { where: { id: { [Op.in]: ids } } });
  }

  async batchUpdateByRole(userRole: UserRole, data: any) {
    return MessagePermission.update(data, { where: { userRole } });
  }

  async batchUpdateByDepartment(department: string, data: any) {
    return MessagePermission.update(data, { where: { department } });
  }

  async batchUpdateEnabled(ids: number[], isEnabled: boolean) {
    return MessagePermission.update(
      { isEnabled },
      { where: { id: { [Op.in]: ids } } }
    );
  }

  async delete(id: number) {
    return MessagePermission.destroy({ where: { id } });
  }

  async countByStatus(permissionStatus?: MessagePermissionStatus, userRole?: UserRole) {
    const where: any = {};
    if (permissionStatus) where.permissionStatus = permissionStatus;
    if (userRole) where.userRole = userRole;
    return MessagePermission.count({ where });
  }

  async checkPermissionExists(userId: number) {
    const count = await MessagePermission.count({ where: { userId } });
    return count > 0;
  }

  async getByRole(userRole: UserRole) {
    return MessagePermission.findAll({ where: { userRole, isEnabled: true } });
  }

  async getByDepartment(department: string) {
    return MessagePermission.findAll({ where: { department, isEnabled: true } });
  }

  async getDefaultConfigForRole(userRole: UserRole) {
    const roleScenes = {
      [UserRole.ADMIN]: [
        MessageTemplateScene.INTERVIEW,
        MessageTemplateScene.ONBOARD,
        MessageTemplateScene.APPROVAL,
        MessageTemplateScene.RISK_CONTROL,
      ],
      [UserRole.HR]: [
        MessageTemplateScene.INTERVIEW,
        MessageTemplateScene.ONBOARD,
        MessageTemplateScene.APPROVAL,
      ],
      [UserRole.INTERVIEWER]: [
        MessageTemplateScene.INTERVIEW,
      ],
    };

    const isAdmin = userRole === UserRole.ADMIN;

    return {
      permissionStatus: MessagePermissionStatus.FULL_RECEIVE,
      allowedScenes: JSON.stringify(roleScenes[userRole] || []),
      blockedScenes: JSON.stringify([]),
      allowedChannels: JSON.stringify(['in_app', 'sms', 'email', 'wechat']),
      blockedChannels: JSON.stringify([]),
      canViewSensitiveMessages: isAdmin,
      canReceiveSystemMessages: true,
      canReceiveRiskMessages: isAdmin,
      isEnabled: true,
    };
  }
}

export default new MessagePermissionDAO();
