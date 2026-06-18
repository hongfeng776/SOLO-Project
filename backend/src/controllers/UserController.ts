import { Request, Response } from 'express';
import { userService, UserCreatePayload, UserUpdatePayload } from '../services/UserService';
import { userValidateService, REGEX_PATTERNS } from '../services/UserValidateService';
import { userStatisticService } from '../services/UserStatisticService';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok, badRequest } from '../utils/response';

export const getUserList = asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize, username, phone, status, level, register_channel, start_date, end_date, min_amount, max_amount, risk_warning, tags } = req.query;

  const result = await userService.getList({
    page: page ? parseInt(page as string, 10) : undefined,
    pageSize: pageSize ? parseInt(pageSize as string, 10) : undefined,
    username: username as string | undefined,
    phone: phone as string | undefined,
    status: status !== undefined ? parseInt(status as string, 10) : undefined,
    level: level !== undefined ? parseInt(level as string, 10) : undefined,
    register_channel: register_channel as string | undefined,
    start_date: start_date as string | undefined,
    end_date: end_date as string | undefined,
    min_amount: min_amount !== undefined ? parseFloat(min_amount as string) : undefined,
    max_amount: max_amount !== undefined ? parseFloat(max_amount as string) : undefined,
    risk_warning: risk_warning !== undefined ? parseInt(risk_warning as string, 10) : undefined,
    tags: tags as string | undefined,
  });

  ok(res, result, '获取用户列表成功');
});

export const getUserDetail = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    badRequest(res, '缺少用户ID');
    return;
  }

  const userId = parseInt(id, 10);
  if (isNaN(userId)) {
    badRequest(res, '用户ID格式无效');
    return;
  }

  const user = await userService.getDetail(userId);
  ok(res, user, '获取用户详情成功');
});

export const getUserFullInfo = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    badRequest(res, '缺少用户ID');
    return;
  }

  const userId = parseInt(id, 10);
  if (isNaN(userId)) {
    badRequest(res, '用户ID格式无效');
    return;
  }

  const info = await userService.getFullInfo(userId);
  ok(res, info, '获取用户完整信息成功');
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const { username, nickname, real_name, id_card, gender, birthday, phone, email, avatar, status, level, tags, register_channel, remark } = req.body;

  if (!username) {
    badRequest(res, '缺少用户名');
    return;
  }

  if (!phone) {
    badRequest(res, '缺少手机号');
    return;
  }

  const operatorIp = req.ip || req.socket.remoteAddress || '';

  const payload: UserCreatePayload = {
    username,
    nickname,
    real_name,
    id_card,
    gender: gender !== undefined ? parseInt(gender, 10) : undefined,
    birthday: birthday ? new Date(birthday) : undefined,
    phone,
    email,
    avatar,
    status: status !== undefined ? parseInt(status, 10) : undefined,
    level: level !== undefined ? parseInt(level, 10) : undefined,
    tags,
    register_channel: register_channel || 'admin',
    remark,
    operator_id: req.user?.id,
    operator_name: req.user?.username,
    operate_ip: operatorIp,
  };

  const user = await userService.create(payload);
  ok(res, user, '创建用户成功');
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    badRequest(res, '缺少用户ID');
    return;
  }

  const userId = parseInt(id, 10);
  if (isNaN(userId)) {
    badRequest(res, '用户ID格式无效');
    return;
  }

  const { username, nickname, real_name, id_card, gender, birthday, phone, email, avatar, status, level, tags, remark, frozen_reason } = req.body;

  const operatorIp = req.ip || req.socket.remoteAddress || '';

  const payload: UserUpdatePayload = {
    username,
    nickname,
    real_name,
    id_card,
    gender: gender !== undefined ? parseInt(gender, 10) : undefined,
    birthday: birthday ? new Date(birthday) : undefined,
    phone,
    email,
    avatar,
    status: status !== undefined ? parseInt(status, 10) : undefined,
    level: level !== undefined ? parseInt(level, 10) : undefined,
    tags,
    remark,
    frozen_reason,
    operator_id: req.user?.id,
    operator_name: req.user?.username,
    operate_ip: operatorIp,
  };

  const user = await userService.update(userId, payload);
  ok(res, user, '更新用户成功');
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    badRequest(res, '缺少用户ID');
    return;
  }

  const userId = parseInt(id, 10);
  if (isNaN(userId)) {
    badRequest(res, '用户ID格式无效');
    return;
  }

  await userService.delete(userId);
  ok(res, null, '删除用户成功');
});

export const batchDeleteUsers = asyncHandler(async (req: Request, res: Response) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    badRequest(res, '请选择要删除的用户');
    return;
  }

  const userIds = ids.map((id: any) => {
    const parsed = parseInt(id, 10);
    if (isNaN(parsed)) {
      throw new Error('无效的用户ID');
    }
    return parsed;
  });

  const count = await userService.batchDelete(userIds);
  ok(res, { count }, `批量删除成功，共删除 ${count} 条记录`);
});

export const updateUserStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, reason } = req.body;

  if (!id) {
    badRequest(res, '缺少用户ID');
    return;
  }

  const userId = parseInt(id, 10);
  if (isNaN(userId)) {
    badRequest(res, '用户ID格式无效');
    return;
  }

  if (status === undefined) {
    badRequest(res, '缺少状态参数');
    return;
  }

  const statusValue = parseInt(status, 10);
  if (isNaN(statusValue)) {
    badRequest(res, '状态值格式无效');
    return;
  }

  const user = await userService.updateStatus(userId, statusValue, reason);
  ok(res, user, '更新用户状态成功');
});

export const getUserEditPermission = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.query;

  if (status === undefined) {
    badRequest(res, '缺少状态参数');
    return;
  }

  const statusValue = parseInt(status as string, 10);
  const permission = await userValidateService.getUserEditPermission(statusValue);
  ok(res, permission, '获取编辑权限成功');
});

export const getRegisterChannels = asyncHandler(async (_req: Request, res: Response) => {
  const channels = await userValidateService.getRegisterChannels();
  ok(res, channels, '获取注册渠道成功');
});

export const validateField = asyncHandler(async (req: Request, res: Response) => {
  const { field, value, userId } = req.body;

  if (!field || value === undefined) {
    badRequest(res, '缺少校验参数');
    return;
  }

  let error: any = null;
  const excludeId = userId ? parseInt(userId, 10) : undefined;

  switch (field) {
    case 'phone':
      error = userValidateService.validatePhone(value);
      if (!error) {
        error = await userValidateService.checkPhoneUnique(value, excludeId);
      }
      break;
    case 'email':
      error = userValidateService.validateEmail(value);
      if (!error) {
        error = await userValidateService.checkEmailUnique(value, excludeId);
      }
      break;
    case 'id_card':
      error = userValidateService.validateIdCard(value);
      if (!error) {
        error = await userValidateService.checkIdCardUnique(value, excludeId);
      }
      break;
    case 'username':
      error = userValidateService.validateUsername(value);
      if (!error) {
        error = await userValidateService.checkUsernameUnique(value, excludeId);
      }
      break;
    case 'register_channel':
      error = await userValidateService.validateRegisterChannel(value);
      break;
    default:
      badRequest(res, '不支持的校验字段');
      return;
  }

  ok(res, {
    valid: !error,
    error,
    patterns: REGEX_PATTERNS,
  }, '字段校验完成');
});

export const getUserStatistics = asyncHandler(async (req: Request, res: Response) => {
  const { start_date, end_date } = req.query;

  let statistics;
  if (start_date && end_date) {
    statistics = await userStatisticService.getStatistics(
      start_date as string,
      end_date as string
    );
  } else {
    statistics = await userStatisticService.getTodayStatistics();
  }

  ok(res, statistics, '获取统计数据成功');
});

export const updateStatistics = asyncHandler(async (_req: Request, res: Response) => {
  const statistics = await userStatisticService.updateStatistics();
  ok(res, statistics, '更新统计数据成功');
});

export const getUserProfileLogs = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    badRequest(res, '缺少用户ID');
    return;
  }

  const userId = parseInt(id, 10);
  if (isNaN(userId)) {
    badRequest(res, '用户ID格式无效');
    return;
  }

  const logs = await userService.getProfileLogs(userId);
  ok(res, logs, '获取用户档案日志成功');
});

export default {
  getUserList,
  getUserDetail,
  getUserFullInfo,
  createUser,
  updateUser,
  deleteUser,
  batchDeleteUsers,
  updateUserStatus,
  getUserEditPermission,
  getRegisterChannels,
  validateField,
  getUserStatistics,
  updateStatistics,
  getUserProfileLogs,
};
