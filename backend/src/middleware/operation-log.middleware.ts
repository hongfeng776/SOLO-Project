import { Request, Response, NextFunction } from 'express';
import OperationLog from '../models/operation-log.model';

const SENSITIVE_FIELDS = ['password', 'token', 'secret'];

const MODULE_MAP: Record<string, string> = {
  '/auth': '认证模块',
  '/companies': '企业管理',
  '/jobs': '岗位管理',
  '/resumes': '简历管理',
  '/interviews': '面试管理',
  '/onboards': '入职管理',
  '/stats': '数据统计',
  '/channels': '渠道管理',
  '/probations': '试用期管理',
  '/logs': '操作日志',
};

const ACTION_MAP: Record<string, Record<string, string>> = {
  GET: {
    default: '查询',
    '/list': '列表查询',
    '/detail': '详情查看',
  },
  POST: {
    default: '新增',
    '/login': '登录',
    '/batch-remove': '批量删除',
  },
  PUT: {
    default: '更新',
    '/publish': '发布',
    '/close': '关闭',
    '/status': '状态更新',
    '/confirm': '确认',
    '/onboarded': '标记入职',
    '/cancel': '取消',
  },
  DELETE: {
    default: '删除',
  },
};

export const operationLogMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const startTime = Date.now();
  const method = req.method.toUpperCase();
  const path = req.path;

  const originalJson = res.json.bind(res);

  res.json = function (body: any) {
    const duration = Date.now() - startTime;

    try {
      const module = getModuleName(path);
      const action = getActionName(method, path);
      const params = filterSensitiveFields({
        query: req.query,
        body: req.body,
        params: req.params,
      });

      OperationLog.create({
        userId: req.user?.id,
        username: req.user?.username,
        module,
        action: `${action} - ${module}`,
        method,
        params: JSON.stringify(params),
        result: JSON.stringify(body).substring(0, 2000),
        ip: getClientIp(req),
        userAgent: req.headers['user-agent'],
        status: body.code === 200 ? 1 : 0,
        costTime: duration,
        errorMsg: body.code !== 200 ? body.message : undefined,
      }).catch((err) => {
        console.error('操作日志记录失败:', err);
      });
    } catch (err) {
      console.error('操作日志处理失败:', err);
    }

    return originalJson(body);
  };

  next();
};

function getModuleName(path: string): string {
  for (const [prefix, module] of Object.entries(MODULE_MAP)) {
    if (path.startsWith(prefix)) {
      return module;
    }
  }
  return '其他模块';
}

function getActionName(method: string, path: string): string {
  const methodActions = ACTION_MAP[method];
  if (!methodActions) return method;

  for (const [suffix, action] of Object.entries(methodActions)) {
    if (suffix !== 'default' && path.endsWith(suffix)) {
      return action;
    }
  }

  return methodActions.default || method;
}

function filterSensitiveFields(data: any): any {
  if (!data || typeof data !== 'object') return data;

  const result = { ...data };

  for (const field of SENSITIVE_FIELDS) {
    if (result[field]) {
      result[field] = '***';
    }
  }

  if (result.body) {
    result.body = { ...result.body };
    for (const field of SENSITIVE_FIELDS) {
      if (result.body[field]) {
        result.body[field] = '***';
      }
    }
  }

  return result;
}

function getClientIp(req: Request): string {
  return (
    (req.headers['x-forwarded-for'] as string) ||
    (req.headers['x-real-ip'] as string) ||
    req.ip ||
    ''
  );
}

export default operationLogMiddleware;
