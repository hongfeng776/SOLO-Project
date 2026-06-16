import { OperationLogRepository, OrganizationRepository } from '../repositories';
import {
  CreateOperationLogRequest,
  OperationLogQueryParams,
  PaginatedResult
} from '../types';
import { throwValidationError } from '../utils';
import { isValidId } from '../utils/validate';
import { Op } from 'sequelize';
import dayjs from 'dayjs';

export class LogService {
  private operationLogRepository: OperationLogRepository;
  private organizationRepository: OrganizationRepository;

  constructor() {
    this.operationLogRepository = new OperationLogRepository();
    this.organizationRepository = new OrganizationRepository();
  }

  async getOperationLogList(params: OperationLogQueryParams): Promise<PaginatedResult<any>> {
    const { page, pageSize, ...queryParams } = params;
    const where = this.operationLogRepository.buildQuery(queryParams);

    const result = await this.operationLogRepository.findPaginated(
      { page, pageSize },
      where,
      { sortBy: 'createdAt', sortOrder: 'DESC' },
      { include: [this.operationLogRepository.getOrganizationInclude()] }
    );

    const list = result.list.map(log => {
      const data = log.toJSON ? log.toJSON() : log;
      if (data.organization) {
        (data as any).org_name = data.organization.name;
      }
      return data;
    });

    return { ...result, list };
  }

  async getLogById(id: string): Promise<any> {
    if (!isValidId(id)) {
      throwValidationError('无效的日志ID');
    }

    const log = await this.operationLogRepository.findById(id);
    if (!log) {
      return null;
    }

    return log.toJSON ? log.toJSON() : log;
  }

  async createLog(data: CreateOperationLogRequest): Promise<any> {
    const log = await this.operationLogRepository.createLog(data);
    return log.toJSON ? log.toJSON() : log;
  }

  async deleteLog(id: string): Promise<void> {
    if (!isValidId(id)) {
      throwValidationError('无效的日志ID');
    }

    await this.operationLogRepository.delete(id);
  }

  async batchDeleteLogs(ids: string[]): Promise<void> {
    if (!ids || ids.length === 0) {
      throwValidationError('请选择要删除的日志');
    }

    for (const id of ids) {
      if (!isValidId(id)) {
        throwValidationError('无效的日志ID');
      }
    }

    await this.operationLogRepository.deleteByWhere({ id: { [Op.in]: ids } });
  }

  async cleanLogs(days: number = 30): Promise<number> {
    if (days < 1) {
      throwValidationError('保留天数不能小于1');
    }

    const cutoffDate = dayjs().subtract(days, 'day').toDate();
    const count = await this.operationLogRepository.deleteByWhere({
      createdAt: {
        [Op.lt]: cutoffDate
      }
    });

    return count;
  }

  async getLogStatistics(startTime?: string, endTime?: string): Promise<any> {
    const start = startTime ? dayjs(startTime).startOf('day').toDate() : dayjs().startOf('month').toDate();
    const end = endTime ? dayjs(endTime).endOf('day').toDate() : dayjs().endOf('day').toDate();

    const where: any = {
      createdAt: {
        [Op.gte]: start,
        [Op.lte]: end
      }
    };

    const all = await this.operationLogRepository.findByWhere(where);

    const total = all.length;
    let success = 0;
    let failed = 0;
    let loginCount = 0;
    let operationCount = 0;
    let exceptionCount = 0;

    const moduleStats: Record<string, number> = {};
    const userStats: Record<string, { username: string; count: number }> = {};

    for (const log of all) {
      if (log.status === 1) {
        success++;
      } else {
        failed++;
      }

      if (log.log_type === 1) {
        loginCount++;
      } else if (log.log_type === 2) {
        operationCount++;
      } else if (log.log_type === 3) {
        exceptionCount++;
      }

      if (log.module) {
        moduleStats[log.module] = (moduleStats[log.module] || 0) + 1;
      }

      if (log.user_id && log.username) {
        if (!userStats[log.user_id]) {
          userStats[log.user_id] = { username: log.username, count: 0 };
        }
        userStats[log.user_id].count++;
      }
    }

    const topUsers = Object.values(userStats)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topModules = Object.entries(moduleStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    return {
      total,
      success,
      failed,
      login_count: loginCount,
      operation_count: operationCount,
      exception_count: exceptionCount,
      success_rate: total > 0 ? Number(((success / total) * 100).toFixed(2)) : 0,
      top_users: topUsers,
      top_modules: topModules,
      start_time: dayjs(start).format('YYYY-MM-DD'),
      end_time: dayjs(end).format('YYYY-MM-DD')
    };
  }

  async exportLogs(params: OperationLogQueryParams): Promise<any[]> {
    const where = this.operationLogRepository.buildQuery(params);

    const logs = await this.operationLogRepository.findByWhere(where, {
      order: [['createdAt', 'DESC']]
    });

    return logs.map(log => {
      const data = log.toJSON ? log.toJSON() : log;
      return {
        用户名: data.username || '-',
        模块: data.module || '-',
        操作: data.operation || '-',
        请求方法: data.request_method || '-',
        请求URL: data.request_url || '-',
        IP地址: data.ip || '-',
        状态: data.status === 1 ? '成功' : '失败',
        耗时: (data.cost_time || 0) + 'ms',
        操作时间: data.createdAt ? dayjs(data.createdAt).format('YYYY-MM-DD HH:mm:ss') : '-'
      };
    });
  }
}