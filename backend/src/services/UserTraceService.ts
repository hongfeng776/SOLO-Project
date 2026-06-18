import { Op } from 'sequelize';
import { User } from '../models/User';
import { daos } from '../dao';
import { AppError } from '../middlewares/errorHandler';

export interface UserTraceInfo {
  registerLog?: any;
  profileLogs: any[];
  loginTraces: any[];
  consumptionLedgers: any[];
  complianceCheck: ComplianceCheckResult;
}

export interface ComplianceCheckResult {
  passed: boolean;
  score: number;
  issues: ComplianceIssue[];
}

export interface ComplianceIssue {
  type: 'duplicate' | 'fake' | 'risk' | 'incomplete';
  level: 'low' | 'medium' | 'high';
  field: string;
  message: string;
  suggestion?: string;
}

class UserTraceService {
  private userRegisterLogDao = daos.userRegisterLogDao;
  private userProfileDao = daos.userProfileDao;
  private userLoginTraceDao = daos.userLoginTraceDao;
  private userConsumptionLedgerDao = daos.userConsumptionLedgerDao;

  async getUserTrace(userId: number): Promise<UserTraceInfo> {
    const user = await daos.userDao.findById(userId);
    if (!user) {
      throw new AppError('用户不存在', 404);
    }

    const [registerLog, profileLogs, loginTraces, consumptionLedgers] = await Promise.all([
      this.getRegisterLog(userId),
      this.getProfileLogs(userId),
      this.getLoginTraces(userId),
      this.getConsumptionLedgers(userId),
    ]);

    const complianceCheck = await this.checkCompliance(user);

    return {
      registerLog,
      profileLogs,
      loginTraces,
      consumptionLedgers,
      complianceCheck,
    };
  }

  async getRegisterLog(userId: number) {
    return this.userRegisterLogDao.findOne({
      where: { user_id: userId },
    });
  }

  async getProfileLogs(userId: number, limit: number = 50) {
    return this.userProfileDao.findAll({
      where: { user_id: userId },
      order: [['operate_time', 'DESC']],
      limit,
    });
  }

  async getLoginTraces(userId: number, limit: number = 50) {
    return this.userLoginTraceDao.findAll({
      where: { user_id: userId },
      order: [['login_time', 'DESC']],
      limit,
    });
  }

  async getConsumptionLedgers(userId: number, limit: number = 50) {
    return this.userConsumptionLedgerDao.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
      limit,
    });
  }

  async checkCompliance(userOrId: User | number): Promise<ComplianceCheckResult> {
    let user: User;
    if (typeof userOrId === 'number') {
      const foundUser = await daos.userDao.findById(userOrId);
      if (!foundUser) {
        throw new AppError('用户不存在', 404);
      }
      user = foundUser;
    } else {
      user = userOrId;
    }
    const issues: ComplianceIssue[] = [];
    let score = 100;

    if (!user.phone) {
      score -= 10;
      issues.push({
        type: 'incomplete',
        level: 'medium',
        field: 'phone',
        message: '缺少手机号信息',
        suggestion: '请完善用户手机号',
      });
    }

    if (!user.id_card) {
      score -= 10;
      issues.push({
        type: 'incomplete',
        level: 'medium',
        field: 'id_card',
        message: '缺少身份证信息',
        suggestion: '请完善用户身份证号',
      });
    }

    if (!user.real_name) {
      score -= 5;
      issues.push({
        type: 'incomplete',
        level: 'low',
        field: 'real_name',
        message: '缺少真实姓名',
        suggestion: '请完善用户真实姓名',
      });
    }

    const duplicateCheck = await this.checkDuplicateAccounts(user);
    if (duplicateCheck.length > 0) {
      score -= 30;
      issues.push(...duplicateCheck);
    }

    if (user.risk_warning === 1) {
      score -= 20;
      issues.push({
        type: 'risk',
        level: 'high',
        field: 'risk_warning',
        message: '用户存在风控预警',
        suggestion: '请核查用户风险情况',
      });
    }

    if (user.credit_score !== undefined && user.credit_score < 60) {
      score -= 15;
      issues.push({
        type: 'risk',
        level: 'medium',
        field: 'credit_score',
        message: `用户信用分过低: ${user.credit_score}`,
        suggestion: '请关注用户信用情况',
      });
    }

    if (user.violation_count !== undefined && user.violation_count > 3) {
      score -= 10;
      issues.push({
        type: 'risk',
        level: 'medium',
        field: 'violation_count',
        message: `用户违规次数过多: ${user.violation_count}`,
        suggestion: '请关注用户售后行为',
      });
    }

    return {
      passed: score >= 60,
      score: Math.max(0, score),
      issues,
    };
  }

  private async checkDuplicateAccounts(user: User): Promise<ComplianceIssue[]> {
    const issues: ComplianceIssue[] = [];

    if (user.phone) {
      const samePhoneUsers = await User.findAll({
        where: {
          phone: user.phone,
          id: { [Op.ne]: user.id },
        },
      });
      if (samePhoneUsers.length > 0) {
        issues.push({
          type: 'duplicate',
          level: 'high',
          field: 'phone',
          message: `该手机号关联 ${samePhoneUsers.length} 个其他账号: ${samePhoneUsers.map(u => u.username).join(', ')}`,
          suggestion: '请核查是否为重复注册',
        });
      }
    }

    if (user.email) {
      const sameEmailUsers = await User.findAll({
        where: {
          email: user.email,
          id: { [Op.ne]: user.id },
        },
      });
      if (sameEmailUsers.length > 0) {
        issues.push({
          type: 'duplicate',
          level: 'medium',
          field: 'email',
          message: `该邮箱关联 ${sameEmailUsers.length} 个其他账号: ${sameEmailUsers.map(u => u.username).join(', ')}`,
          suggestion: '请核查是否为重复注册',
        });
      }
    }

    if (user.id_card) {
      const sameIdCardUsers = await User.findAll({
        where: {
          id_card: user.id_card,
          id: { [Op.ne]: user.id },
        },
      });
      if (sameIdCardUsers.length > 0) {
        issues.push({
          type: 'duplicate',
          level: 'high',
          field: 'id_card',
          message: `该身份证关联 ${sameIdCardUsers.length} 个其他账号: ${sameIdCardUsers.map(u => u.username).join(', ')}`,
          suggestion: '请核查是否为重复注册',
        });
      }
    }

    if (user.register_ip) {
      const sameIpUsers = await User.findAll({
        where: {
          register_ip: user.register_ip,
          id: { [Op.ne]: user.id },
          created_at: {
            [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      });
      if (sameIpUsers.length >= 3) {
        issues.push({
          type: 'risk',
          level: 'high',
          field: 'register_ip',
          message: `24小时内该IP注册 ${sameIpUsers.length + 1} 个账号，存在批量注册风险`,
          suggestion: '请核查是否为恶意注册',
        });
      }
    }

    return issues;
  }

  async getDuplicateUsers(userId: number): Promise<User[]> {
    const user = await daos.userDao.findById(userId);
    if (!user) {
      throw new AppError('用户不存在', 404);
    }

    const whereConditions: any[] = [];

    if (user.phone) {
      whereConditions.push({ phone: user.phone });
    }
    if (user.email) {
      whereConditions.push({ email: user.email });
    }
    if (user.id_card) {
      whereConditions.push({ id_card: user.id_card });
    }

    if (whereConditions.length === 0) {
      return [];
    }

    const duplicateUsers = await User.findAll({
      where: {
        [Op.or]: whereConditions,
        id: { [Op.ne]: user.id },
      },
    });

    return duplicateUsers;
  }
}

export const userTraceService = new UserTraceService();
export default UserTraceService;
