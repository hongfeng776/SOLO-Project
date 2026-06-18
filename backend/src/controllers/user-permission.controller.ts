import { Request, Response, NextFunction } from 'express';
import { Result } from '../utils/result';
import userPermissionService from '../services/user-permission.service';

interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: string;
    companyId?: number;
  };
}

class UserPermissionController {
  async getList(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const currentUser = req.user!;
      const result = await userPermissionService.getList(req.query, currentUser);
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async getDetail(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const currentUser = req.user!;
      const result = await userPermissionService.getById(Number(id), currentUser);
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async checkQualification(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { companyId } = req.params;
      const result = await userPermissionService.checkCompanyQualification(Number(companyId));
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async getRolePermissions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { role } = req.query;
      const result = userPermissionService.getRolePermissions(String(role || ''));
      res.json(Result.success({ permissions: result }));
    } catch (error) {
      next(error);
    }
  }

  async checkUsername(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { username, excludeId } = req.query;
      const exists = await userPermissionService.checkUsernameUnique(
        String(username),
        excludeId ? Number(excludeId) : undefined
      );
      res.json(Result.success({ exists, available: !exists }));
    } catch (error) {
      next(error);
    }
  }

  async validateData(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = userPermissionService.validateUserData(req.body, id ? Number(id) : undefined);
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async checkIsMainAccount(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await userPermissionService.isMainAccount(Number(id));
      res.json(Result.success({ isMain: result }));
    } catch (error) {
      next(error);
    }
  }

  async createSubAccount(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const currentUser = req.user!;
      const result = await userPermissionService.createSubAccount(req.body, currentUser);
      res.json(Result.success(result, '创建成功'));
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const currentUser = req.user!;
      const result = await userPermissionService.updateUser(Number(id), req.body, currentUser);
      res.json(Result.success(result, '更新成功'));
    } catch (error) {
      next(error);
    }
  }

  async freezeAccount(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { remark } = req.body;
      const currentUser = req.user!;
      const result = await userPermissionService.freezeAccount(Number(id), currentUser, remark);
      res.json(Result.success(result, '冻结成功'));
    } catch (error) {
      next(error);
    }
  }

  async unfreezeAccount(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const currentUser = req.user!;
      const result = await userPermissionService.unfreezeAccount(Number(id), currentUser);
      res.json(Result.success(result, '解冻成功'));
    } catch (error) {
      next(error);
    }
  }

  async batchAssignPermissions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { ids, role, dataScope } = req.body;
      const currentUser = req.user!;
      const result = await userPermissionService.batchAssignPermissions(ids, role, dataScope, currentUser);
      res.json(Result.success(result, '批量分配完成'));
    } catch (error) {
      next(error);
    }
  }

  async batchFreeze(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { ids, remark } = req.body;
      const currentUser = req.user!;
      const result = await userPermissionService.batchFreezeAccounts(ids, currentUser, remark);
      res.json(Result.success(result, '批量冻结完成'));
    } catch (error) {
      next(error);
    }
  }

  async getPermissionLogs(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const currentUser = req.user!;
      const result = await userPermissionService.getPermissionLogs(req.query, currentUser);
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async getPermissionLogsByUserId(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const currentUser = req.user!;
      const result = await userPermissionService.getPermissionLogsByUserId(Number(userId), currentUser);
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async getLoginLogs(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const currentUser = req.user!;
      const result = await userPermissionService.getLoginLogs(req.query, currentUser);
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async checkLoginRisk(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, ip, deviceFingerprint, clientInfo } = req.body;
      const result = await userPermissionService.checkLoginRisk(username, ip, deviceFingerprint, clientInfo);
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async verifyTwoFactor(req: Request, res: Response, next: NextFunction) {
    try {
      const { verificationToken, verifyCode, verifyType } = req.body;
      const result = await userPermissionService.verifyTwoFactor(verificationToken, verifyCode, verifyType);
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async getLoginLogDetail(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const currentUser = req.user!;
      const result = await userPermissionService.getLoginLogDetail(Number(id), currentUser);
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async markLoginRisk(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const currentUser = req.user!;
      const result = await userPermissionService.markLoginRisk(Number(id), reason, currentUser);
      res.json(Result.success(result, '标记成功'));
    } catch (error) {
      next(error);
    }
  }

  async clearLoginRisk(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { remark } = req.body;
      const currentUser = req.user!;
      const result = await userPermissionService.clearLoginRisk(Number(id), remark, currentUser);
      res.json(Result.success(result, '清除成功'));
    } catch (error) {
      next(error);
    }
  }

  async batchMarkRisk(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { ids, reason } = req.body;
      const currentUser = req.user!;
      const result = await userPermissionService.batchMarkRisk(ids, reason, currentUser);
      res.json(Result.success(result, '批量标记完成'));
    } catch (error) {
      next(error);
    }
  }

  async batchClearRisk(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { ids, remark } = req.body;
      const currentUser = req.user!;
      const result = await userPermissionService.batchClearRisk(ids, remark, currentUser);
      res.json(Result.success(result, '批量清除完成'));
    } catch (error) {
      next(error);
    }
  }

  async batchClearNormalRecords(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { ids } = req.body;
      const currentUser = req.user!;
      const result = await userPermissionService.batchClearNormalRecords(ids, currentUser);
      res.json(Result.success(result, '批量清除完成'));
    } catch (error) {
      next(error);
    }
  }

  async batchLockDevices(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { deviceFingerprints, userId } = req.body;
      const currentUser = req.user!;
      const result = await userPermissionService.batchLockDevices(deviceFingerprints, userId, currentUser);
      res.json(Result.success(result, '批量锁定完成'));
    } catch (error) {
      next(error);
    }
  }

  async lockDevice(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { deviceFingerprint, userId } = req.body;
      const currentUser = req.user!;
      await userPermissionService.lockDevice(deviceFingerprint, userId, currentUser);
      res.json(Result.success(null, '锁定成功'));
    } catch (error) {
      next(error);
    }
  }

  async unlockDevice(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { deviceFingerprint, userId } = req.body;
      const currentUser = req.user!;
      await userPermissionService.unlockDevice(deviceFingerprint, userId, currentUser);
      res.json(Result.success(null, '解锁成功'));
    } catch (error) {
      next(error);
    }
  }

  async getLoginTraceability(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const currentUser = req.user!;
      const result = await userPermissionService.getLoginTraceability(Number(id), currentUser);
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async verifyLoginAuthenticity(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const currentUser = req.user!;
      const result = await userPermissionService.verifyLoginAuthenticity(Number(id), currentUser);
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async generateRiskReport(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const currentUser = req.user!;
      const result = await userPermissionService.generateRiskReport(req.query, currentUser);
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }

  async getUserOnlineStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const currentUser = req.user!;
      const result = await userPermissionService.getUserOnlineStatus(Number(userId), currentUser);
      res.json(Result.success(result));
    } catch (error) {
      next(error);
    }
  }
}

export default new UserPermissionController();
