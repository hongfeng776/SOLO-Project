import { Op } from 'sequelize';
import { User } from '../models/User';
import { RegisterChannel } from '../models/RegisterChannel';
import { daos } from '../dao';

export interface ValidateResult {
  valid: boolean;
  errors: ValidateError[];
}

export interface ValidateError {
  field: string;
  message: string;
  code: string;
}

export const REGEX_PATTERNS = {
  PHONE: /^1[3-9]\d{9}$/,
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  ID_CARD: /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/,
  USERNAME: /^[a-zA-Z0-9_]{3,20}$/,
};

export const USER_STATUS = {
  NORMAL: 1,
  FROZEN: 2,
  CANCELED: 3,
};

export const RISK_WARNING = {
  NONE: 0,
  HAS: 1,
};

class UserValidateService {
  private registerChannelDao = daos.registerChannelDao;

  validatePhone(phone: string): ValidateError | null {
    if (!phone) {
      return { field: 'phone', message: '手机号不能为空', code: 'PHONE_EMPTY' };
    }
    if (!REGEX_PATTERNS.PHONE.test(phone)) {
      return { field: 'phone', message: '手机号格式不正确', code: 'PHONE_FORMAT' };
    }
    return null;
  }

  validateEmail(email: string): ValidateError | null {
    if (!email) return null;
    if (!REGEX_PATTERNS.EMAIL.test(email)) {
      return { field: 'email', message: '邮箱格式不正确', code: 'EMAIL_FORMAT' };
    }
    return null;
  }

  validateIdCard(idCard: string): ValidateError | null {
    if (!idCard) return null;
    if (!REGEX_PATTERNS.ID_CARD.test(idCard)) {
      return { field: 'id_card', message: '身份证号格式不正确', code: 'IDCARD_FORMAT' };
    }
    if (!this.verifyIdCardChecksum(idCard)) {
      return { field: 'id_card', message: '身份证号校验位不正确', code: 'IDCARD_CHECKSUM' };
    }
    return null;
  }

  private verifyIdCardChecksum(idCard: string): boolean {
    const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
    const checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
    let sum = 0;
    for (let i = 0; i < 17; i++) {
      sum += parseInt(idCard[i]) * weights[i];
    }
    const checkCode = checkCodes[sum % 11];
    return idCard[17].toUpperCase() === checkCode;
  }

  validateUsername(username: string): ValidateError | null {
    if (!username) {
      return { field: 'username', message: '用户名不能为空', code: 'USERNAME_EMPTY' };
    }
    if (!REGEX_PATTERNS.USERNAME.test(username)) {
      return { field: 'username', message: '用户名格式不正确，只能包含字母、数字、下划线，长度3-20位', code: 'USERNAME_FORMAT' };
    }
    return null;
  }

  async checkPhoneUnique(phone: string, excludeUserId?: number): Promise<ValidateError | null> {
    const where: any = { phone };
    if (excludeUserId) {
      where.id = { [Op.ne]: excludeUserId };
    }
    const user = await User.findOne({ where });
    if (user) {
      return { field: 'phone', message: '该手机号已被注册', code: 'PHONE_DUPLICATE' };
    }
    return null;
  }

  async checkEmailUnique(email: string, excludeUserId?: number): Promise<ValidateError | null> {
    if (!email) return null;
    const where: any = { email };
    if (excludeUserId) {
      where.id = { [Op.ne]: excludeUserId };
    }
    const user = await User.findOne({ where });
    if (user) {
      return { field: 'email', message: '该邮箱已被注册', code: 'EMAIL_DUPLICATE' };
    }
    return null;
  }

  async checkIdCardUnique(idCard: string, excludeUserId?: number): Promise<ValidateError | null> {
    if (!idCard) return null;
    const where: any = { id_card: idCard };
    if (excludeUserId) {
      where.id = { [Op.ne]: excludeUserId };
    }
    const user = await User.findOne({ where });
    if (user) {
      return { field: 'id_card', message: '该身份证号已被注册', code: 'IDCARD_DUPLICATE' };
    }
    return null;
  }

  async checkUsernameUnique(username: string, excludeUserId?: number): Promise<ValidateError | null> {
    const where: any = { username };
    if (excludeUserId) {
      where.id = { [Op.ne]: excludeUserId };
    }
    const user = await User.findOne({ where });
    if (user) {
      return { field: 'username', message: '该用户名已被注册', code: 'USERNAME_DUPLICATE' };
    }
    return null;
  }

  async validateRegisterChannel(channel: string): Promise<ValidateError | null> {
    if (!channel) {
      return { field: 'register_channel', message: '注册渠道不能为空', code: 'CHANNEL_EMPTY' };
    }
    const registerChannel = await this.registerChannelDao.findByCode(channel);
    if (!registerChannel) {
      return { field: 'register_channel', message: '注册渠道不存在', code: 'CHANNEL_INVALID' };
    }
    if (registerChannel.status !== 1) {
      return { field: 'register_channel', message: '该注册渠道已关闭', code: 'CHANNEL_DISABLED' };
    }
    return null;
  }

  async checkDuplicateUser(data: { phone?: string; email?: string; id_card?: string; username: string }, excludeUserId?: number): Promise<ValidateError[]> {
    const errors: ValidateError[] = [];

    const usernameError = this.validateUsername(data.username);
    if (usernameError) errors.push(usernameError);
    else {
      const uniqueError = await this.checkUsernameUnique(data.username, excludeUserId);
      if (uniqueError) errors.push(uniqueError);
    }

    const phoneError = this.validatePhone(data.phone || '');
    if (phoneError) errors.push(phoneError);
    else {
      const uniqueError = await this.checkPhoneUnique(data.phone || '', excludeUserId);
      if (uniqueError) errors.push(uniqueError);
    }

    const emailError = this.validateEmail(data.email || '');
    if (emailError) errors.push(emailError);
    else {
      const uniqueError = await this.checkEmailUnique(data.email || '', excludeUserId);
      if (uniqueError) errors.push(uniqueError);
    }

    if (data.id_card) {
      const idCardError = this.validateIdCard(data.id_card);
      if (idCardError) errors.push(idCardError);
      else {
        const uniqueError = await this.checkIdCardUnique(data.id_card, excludeUserId);
        if (uniqueError) errors.push(uniqueError);
      }
    }

    return errors;
  }

  async validateCreateData(data: any): Promise<ValidateResult> {
    const errors: ValidateError[] = [];

    const duplicateErrors = await this.checkDuplicateUser(data);
    errors.push(...duplicateErrors);

    const channelError = await this.validateRegisterChannel(data.register_channel || 'admin');
    if (channelError) errors.push(channelError);

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  async validateUpdateData(userId: number, data: any): Promise<ValidateResult> {
    const errors: ValidateError[] = [];

    const duplicateErrors = await this.checkDuplicateUser(data, userId);
    errors.push(...duplicateErrors);

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  async checkFakeIdentity(realName: string, idCard: string): Promise<{ isFake: boolean; reason?: string }> {
    if (!realName || !idCard) {
      return { isFake: false };
    }

    if (realName.length < 2) {
      return { isFake: true, reason: '姓名长度不符合规范' };
    }

    const idCardBirthday = idCard.substring(6, 14);
    const year = parseInt(idCardBirthday.substring(0, 4));
    const currentYear = new Date().getFullYear();
    if (year < 1900 || year > currentYear) {
      return { isFake: true, reason: '身份证出生日期异常' };
    }

    const sameIdCardUsers = await User.findAll({
      where: { id_card: idCard, real_name: { [Op.ne]: realName } },
    });
    if (sameIdCardUsers.length > 0) {
      return { isFake: true, reason: '身份证号与姓名不匹配' };
    }

    return { isFake: false };
  }

  async getUserEditPermission(status: number): Promise<{ editable: boolean; reason?: string; readonlyFields: string[] }> {
    switch (status) {
      case USER_STATUS.NORMAL:
        return { editable: true, readonlyFields: [] };
      case USER_STATUS.FROZEN:
        return { editable: true, reason: '冻结用户仅可修改状态和备注', readonlyFields: ['username', 'phone', 'email', 'id_card', 'real_name', 'level'] };
      case USER_STATUS.CANCELED:
        return { editable: false, reason: '注销用户不支持编辑', readonlyFields: ['*'] };
      default:
        return { editable: true, readonlyFields: [] };
    }
  }

  async getRegisterChannels(): Promise<RegisterChannel[]> {
    return this.registerChannelDao.getActiveChannels();
  }
}

export const userValidateService = new UserValidateService();
export default UserValidateService;
