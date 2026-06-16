import { Request, Response, NextFunction } from 'express';
import { OperationLogRepository } from '../repositories';
import { getClientIp, getUserAgent, getRequestUrl, getRequestMethod, maskSensitiveData } from '../utils';
import { OperationType, LogType } from '../types';

const operationLogRepository = new OperationLogRepository();

export interface OperationLogOptions {
  module: string;
  operation: OperationType;
  logType?: LogType;
  logResponse?: boolean;
}

const moduleMap: Record<string, string> = {
  '/api/auth': '认证模块',
  '/api/user': '用户管理',
  '/api/role': '角色管理',
  '/api/permission': '权限管理',
  '/api/org': '机构管理',
  '/api/business/transaction': '交易管理',
  '/api/business/product': '产品管理',
  '/api/audit': '审核管理',
  '/api/log': '日志管理'
};

const methodOperationMap: Record<string, OperationType> = {
  POST: 'create',
  PUT: 'update',
  PATCH: 'update',
  DELETE: 'delete',
  GET: 'query'
};

export async function loggerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const startTime = Date.now();
  let isLogin = req.path.includes('/login');
  let originalJson = res.json;
  let responseBody: any = {};

  res.json = function(this: Response, body: any) {
    responseBody = body;
    return originalJson.call(this, body);
  } as any;

  res.on('finish', async () => {
    try {
      const costTime = Date.now() - startTime;

      if (req.path.startsWith('/api/health') || req.path === '/favicon.ico') {
        return;
      }

      const moduleName = Object.keys(moduleMap).find(key => req.path.startsWith(key));
      const module = moduleName ? moduleMap[moduleName] : '其他模块';

      let operation: OperationType = methodOperationMap[req.method] || 'other';

      if (req.path.includes('/login')) operation = 'login';
      if (req.path.includes('/logout')) operation = 'logout';
      if (req.path.includes('/export')) operation = 'export';
      if (req.path.includes('/approve')) operation = 'approve';
      if (req.path.includes('/reject')) operation = 'reject';

      if (isLogin && responseBody.code === 200) {
        operation = 'login';
      }

      const requestParams = maskSensitiveData({
        body: req.body,
        query: req.query,
        params: req.params
      });

      const logData = {
        user_id: req.userId || undefined,
        username: req.user?.username,
        org_id: req.user?.org_id,
        module,
        operation,
        method: `${req.method} ${req.route?.path || req.path}`,
        request_params: JSON.stringify(requestParams),
        response_result: JSON.stringify(maskSensitiveData(responseBody)),
        request_method: getRequestMethod(req),
        request_url: getRequestUrl(req),
        ip: getClientIp(req),
        user_agent: getUserAgent(req),
        status: responseBody.code === 200 ? 1 : 0,
        error_msg: responseBody.code !== 200 ? responseBody.message : undefined,
        cost_time: costTime,
        log_type: isLogin ? 1 : (responseBody.code !== 200 ? 3 : 2)
      };

      await operationLogRepository.createLog(logData).catch(err => {
        console.error('[Logger] Failed to create log:', err.message);
      });
    } catch (error: any) {
      console.error('[Logger] Error:', error.message);
    }
  });

  next();
}

export function operationLogger(options: OperationLogOptions) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const startTime = Date.now();
    const { module, operation, logType = 2, logResponse = true } = options;

    let originalJson = res.json;
    let responseBody: any = {};

    res.json = function(this: Response, body: any) {
      responseBody = body;
      return originalJson.call(this, body);
    } as any;

    res.on('finish', async () => {
      try {
        const costTime = Date.now() - startTime;
        const requestParams = maskSensitiveData({
          body: req.body,
          query: req.query,
          params: req.params
        });

        await operationLogRepository.createLog({
          user_id: req.userId || undefined,
          username: req.user?.username,
          org_id: req.user?.org_id,
          module,
          operation,
          method: req.route?.path || req.path,
          request_params: JSON.stringify(requestParams),
          response_result: logResponse ? JSON.stringify(maskSensitiveData(responseBody)) : undefined,
          request_method: getRequestMethod(req),
          request_url: getRequestUrl(req),
          ip: getClientIp(req),
          user_agent: getUserAgent(req),
          status: responseBody.code === 200 ? 1 : 0,
          error_msg: responseBody.code !== 200 ? responseBody.message : undefined,
          cost_time: costTime,
          log_type: logType
        }).catch(err => {
          console.error('[Logger] Failed to create operation log:', err.message);
        });
      } catch (error: any) {
        console.error('[Logger] Operation log error:', error.message);
      }
    });

    next();
  };
}