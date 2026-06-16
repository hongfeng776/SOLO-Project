import { Op, WhereOptions, literal } from 'sequelize';
import { daos } from '../dao';
import { OperateLog } from '../models/OperateLog';
import { PageResult } from '../types';

export interface OperateLogQueryParams {
  page?: number;
  pageSize?: number;
  operator_id?: number;
  operator_type?: number;
  module?: string;
  action?: string;
  method?: string;
  status?: number;
  start_time?: string;
  end_time?: string;
  keyword?: string;
  ip?: string;
}

export interface LogStats {
  total_count: number;
  success_count: number;
  fail_count: number;
  avg_cost_ms: number;
  today_count: number;
  module_stats: Array<{
    module: string;
    count: number;
  }>;
  action_stats: Array<{
    action: string;
    count: number;
  }>;
}

export interface UserOperateTrace {
  operator_id: number;
  operator_type: number;
  logs: OperateLog[];
  time_span: {
    start: Date | null;
    end: Date | null;
  };
  summary: {
    total_ops: number;
    success_ops: number;
    fail_ops: number;
    modules: string[];
    ip_addresses: string[];
  };
}

class OperateLogService {
  private readonly operateLogDao = daos.operateLogDao;

  async getLogList(params: OperateLogQueryParams): Promise<PageResult<OperateLog>> {
    const {
      page = 1,
      pageSize = 10,
      operator_id,
      operator_type,
      module,
      action,
      method,
      status,
      start_time,
      end_time,
      keyword,
      ip,
    } = params;

    const where: WhereOptions<OperateLog> = {};

    if (operator_id !== undefined) {
      where.operator_id = operator_id;
    }
    if (operator_type !== undefined) {
      where.operator_type = operator_type;
    }
    if (module) {
      where.module = { [Op.like]: `%${module}%` } as any;
    }
    if (action) {
      where.action = { [Op.like]: `%${action}%` } as any;
    }
    if (method) {
      where.method = method;
    }
    if (status !== undefined) {
      where.status = status;
    }
    if (ip) {
      where.ip = { [Op.like]: `%${ip}%` } as any;
    }
    if (start_time || end_time) {
      where.created_at = {} as any;
      if (start_time) {
        (where.created_at as any)[Op.gte] = new Date(start_time);
      }
      if (end_time) {
        (where.created_at as any)[Op.lte] = new Date(end_time);
      }
    }
    if (keyword) {
      where[Op.or as any] = [
        { module: { [Op.like]: `%${keyword}%` } },
        { action: { [Op.like]: `%${keyword}%` } },
        { ip: { [Op.like]: `%${keyword}%` } },
      ];
    }

    return this.operateLogDao.findPage({
      page,
      pageSize,
      where,
      order: [['created_at', 'DESC']],
    });
  }

  async getLogDetail(id: number): Promise<OperateLog> {
    const log = await this.operateLogDao.findById(id);
    if (!log) {
      throw new Error('操作日志不存在');
    }
    return log;
  }

  async getStats(startDate?: string, endDate?: string): Promise<LogStats> {
    const where: WhereOptions<OperateLog> = {};

    if (startDate || endDate) {
      where.created_at = {} as any;
      if (startDate) {
        (where.created_at as any)[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        (where.created_at as any)[Op.lte] = new Date(endDate);
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalCount,
      successCount,
      avgCostResult,
      todayCount,
      moduleStats,
      actionStats,
    ] = await Promise.all([
      OperateLog.count({ where }),
      OperateLog.count({ where: { ...where, status: 1 } as WhereOptions<OperateLog> }),
      OperateLog.findOne({
        where,
        attributes: [[literal('AVG(cost_ms)'), 'avg_cost']],
        raw: true,
      }),
      OperateLog.count({
        where: {
          ...where,
          created_at: { [Op.gte]: today } as any,
        } as WhereOptions<OperateLog>,
      }),
      OperateLog.findAll({
        where,
        attributes: ['module', [literal('COUNT(*)'), 'count']],
        group: ['module'],
        order: [[literal('COUNT(*)'), 'DESC']],
        limit: 10,
        raw: true,
      }) as any,
      OperateLog.findAll({
        where,
        attributes: ['action', [literal('COUNT(*)'), 'count']],
        group: ['action'],
        order: [[literal('COUNT(*)'), 'DESC']],
        limit: 10,
        raw: true,
      }) as any,
    ]);

    return {
      total_count: totalCount,
      success_count: successCount,
      fail_count: totalCount - successCount,
      avg_cost_ms: avgCostResult ? Math.round(Number((avgCostResult as any).avg_cost) || 0) : 0,
      today_count: todayCount,
      module_stats: moduleStats.map((item: any) => ({
        module: item.module || 'unknown',
        count: Number(item.count),
      })),
      action_stats: actionStats.map((item: any) => ({
        action: item.action || 'unknown',
        count: Number(item.count),
      })),
    };
  }

  async traceUserOperations(
    operatorId: number,
    operatorType: number,
    startTime?: string,
    endTime?: string,
    limit: number = 200
  ): Promise<UserOperateTrace> {
    const where: WhereOptions<OperateLog> = {
      operator_id: operatorId,
      operator_type: operatorType,
    };

    if (startTime || endTime) {
      where.created_at = {} as any;
      if (startTime) {
        (where.created_at as any)[Op.gte] = new Date(startTime);
      }
      if (endTime) {
        (where.created_at as any)[Op.lte] = new Date(endTime);
      }
    }

    const logs = await this.operateLogDao.findAll({
      where,
      order: [['created_at', 'DESC']],
      limit,
    });

    const modules = new Set<string>();
    const ipAddresses = new Set<string>();
    let successOps = 0;
    let start: Date | null = null;
    let end: Date | null = null;

    logs.forEach(log => {
      if (log.module) modules.add(log.module);
      if (log.ip) ipAddresses.add(log.ip);
      if (log.status === 1) successOps++;
      if (log.created_at) {
        if (!start || log.created_at < start) start = log.created_at;
        if (!end || log.created_at > end) end = log.created_at;
      }
    });

    return {
      operator_id: operatorId,
      operator_type: operatorType,
      logs,
      time_span: { start, end },
      summary: {
        total_ops: logs.length,
        success_ops: successOps,
        fail_ops: logs.length - successOps,
        modules: Array.from(modules),
        ip_addresses: Array.from(ipAddresses),
      },
    };
  }

  async searchByIp(ip: string, days: number = 7): Promise<OperateLog[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.operateLogDao.findAll({
      where: {
        ip: { [Op.like]: `%${ip}%` } as any,
        created_at: { [Op.gte]: startDate } as any,
      } as WhereOptions<OperateLog>,
      order: [['created_at', 'DESC']],
      limit: 500,
    });
  }

  async getRecentErrors(limit: number = 50): Promise<OperateLog[]> {
    return this.operateLogDao.findAll({
      where: { status: 0 } as WhereOptions<OperateLog>,
      order: [['created_at', 'DESC']],
      limit,
    });
  }

  async exportLogs(params: OperateLogQueryParams): Promise<OperateLog[]> {
    const {
      operator_id,
      operator_type,
      module,
      action,
      method,
      status,
      start_time,
      end_time,
      keyword,
      ip,
    } = params;

    const where: WhereOptions<OperateLog> = {};

    if (operator_id !== undefined) {
      where.operator_id = operator_id;
    }
    if (operator_type !== undefined) {
      where.operator_type = operator_type;
    }
    if (module) {
      where.module = { [Op.like]: `%${module}%` } as any;
    }
    if (action) {
      where.action = { [Op.like]: `%${action}%` } as any;
    }
    if (method) {
      where.method = method;
    }
    if (status !== undefined) {
      where.status = status;
    }
    if (ip) {
      where.ip = { [Op.like]: `%${ip}%` } as any;
    }
    if (start_time || end_time) {
      where.created_at = {} as any;
      if (start_time) {
        (where.created_at as any)[Op.gte] = new Date(start_time);
      }
      if (end_time) {
        (where.created_at as any)[Op.lte] = new Date(end_time);
      }
    }
    if (keyword) {
      where[Op.or as any] = [
        { module: { [Op.like]: `%${keyword}%` } },
        { action: { [Op.like]: `%${keyword}%` } },
        { ip: { [Op.like]: `%${keyword}%` } },
      ];
    }

    return this.operateLogDao.findAll({
      where,
      order: [['created_at', 'DESC']],
      limit: 10000,
    });
  }
}

export const operateLogService = new OperateLogService();
export default OperateLogService;
