import { Request, Response, NextFunction } from 'express';
import operationLogService from '@services/OperationLogService';

const WRITE_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH'];

const WHITELIST_PATHS = [
  '/api/auth/login',
  '/api/auth/logout',
  '/health',
  '/favicon.ico',
];

const WHITELIST_PREFIXES = [
  '/static',
  '/public',
  '/uploads',
];

const MODULE_MAP: Record<string, string> = {
  users: '用户管理',
  roles: '角色管理',
  permissions: '权限管理',
  stocks: '股票行情',
  products: '产品管理',
  customers: '客户资产管理',
  'fund-flows': '资金流水',
  'compliance-audits': '合规审核',
  trades: '交易管理',
  holdings: '持仓管理',
  'risk-alerts': '风险告警',
  'operation-logs': '操作日志',
  dashboard: '仪表盘',
};

const OPERATION_MAP: Record<string, Record<string, string>> = {
  POST: {
    default: '新增',
    audit: '审核',
    cancel: '取消',
    confirm: '确认',
    resolve: '解决',
    ignore: '忽略',
  },
  PUT: {
    default: '更新',
    audit: '审核',
    cancel: '取消',
    confirm: '确认',
    resolve: '解决',
    ignore: '忽略',
  },
  DELETE: {
    default: '删除',
  },
  PATCH: {
    default: '更新',
  },
};

function getClientIp(req: Request): string {
  const xForwardedFor = req.headers['x-forwarded-for'];
  if (xForwardedFor) {
    return Array.isArray(xForwardedFor) ? xForwardedFor[0].split(',')[0] : xForwardedFor.split(',')[0];
  }
  const xRealIp = req.headers['x-real-ip'];
  if (xRealIp) {
    return Array.isArray(xRealIp) ? xRealIp[0] : xRealIp;
  }
  return req.ip || req.socket.remoteAddress || '';
}

function isWhitelisted(path: string): boolean {
  if (WHITELIST_PATHS.includes(path)) {
    return true;
  }
  return WHITELIST_PREFIXES.some((prefix) => path.startsWith(prefix));
}

function extractModule(path: string): string {
  const parts = path.split('/').filter(Boolean);
  if (parts.length >= 2 && parts[0] === 'api') {
    const moduleKey = parts[1];
    return MODULE_MAP[moduleKey] || moduleKey;
  }
  return '其他';
}

function extractOperation(method: string, path: string): string {
  const parts = path.split('/').filter(Boolean);
  const methodOps = OPERATION_MAP[method] || { default: method };

  if (parts.includes('audit')) return methodOps.audit || '审核';
  if (parts.includes('cancel')) return methodOps.cancel || '取消';
  if (parts.includes('confirm')) return methodOps.confirm || '确认';
  if (parts.includes('resolve')) return methodOps.resolve || '解决';
  if (parts.includes('ignore')) return methodOps.ignore || '忽略';

  return methodOps.default || method;
}

export function operationLogger(req: Request, res: Response, next: NextFunction) {
  const method = req.method;

  if (!WRITE_METHODS.includes(method) || isWhitelisted(req.path)) {
    return next();
  }

  const startTime = Date.now();

  res.on('finish', async () => {
    try {
      const duration = Date.now() - startTime;
      const module = extractModule(req.path);
      const operation = extractOperation(method, req.path);
      const params = JSON.stringify({
        query: req.query,
        params: req.params,
        body: req.body,
      });
      const ip = getClientIp(req);
      const userAgent = req.headers['user-agent'] || '';
      const status = res.statusCode >= 400 ? 'failed' : 'success';

      const logData = {
        user_id: req.user?.userId,
        username: req.user?.username,
        module,
        operation,
        method,
        url: req.originalUrl,
        params,
        ip,
        user_agent: userAgent,
        duration,
        status,
      };

      setImmediate(() => {
        operationLogService.createLog(logData).catch((err) => {
          console.error('Failed to write operation log:', err);
        });
      });
    } catch (err) {
      console.error('Operation log middleware error:', err);
    }
  });

  next();
}
