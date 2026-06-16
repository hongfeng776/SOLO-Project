import { Request, Response, NextFunction } from 'express';
import { operationLogDao } from '../dao';

const AUDIT_MODULES: Record<string, string> = {
  '/api/channels': 'channel',
  '/api/promoters': 'promoter',
  '/api/orders': 'order',
  '/api/commissions': 'commission',
  '/api/marketings': 'marketing',
  '/api/withdraws': 'withdraw',
  '/api/roles': 'role',
  '/api/permissions': 'permission',
  '/api/users': 'user',
};

const ACTION_MAP: Record<string, string> = {
  POST: 'create',
  PUT: 'update',
  PATCH: 'update',
  DELETE: 'delete',
};

function getModule(path: string): string {
  for (const [prefix, module] of Object.entries(AUDIT_MODULES)) {
    if (path.startsWith(prefix)) return module;
  }
  return 'unknown';
}

function getTargetType(path: string): string {
  return getModule(path);
}

function extractTargetId(path: string): string | undefined {
  const parts = path.split('/');
  const lastPart = parts[parts.length - 1];
  if (lastPart && lastPart !== 'api' && !AUDIT_MODULES[`/api/${lastPart}`] && lastPart.length > 5) {
    return lastPart;
  }
  return undefined;
}

export function auditLog(req: Request, res: Response, next: NextFunction): void {
  if (req.method === 'GET') {
    next();
    return;
  }

  const startTime = Date.now();
  const originalEnd = res.end;

  res.end = function (...args: any[]) {
    const duration = Date.now() - startTime;
    const module = getModule(req.path);
    const action = req.path.includes('/approve') ? 'approve'
      : req.path.includes('/reject') ? 'reject'
      : req.path.includes('/status') ? 'updateStatus'
      : req.path.includes('/settle') ? 'settle'
      : req.path.includes('/deduct') ? 'deduct'
      : req.path.includes('/batch') ? 'bulkAction'
      : ACTION_MAP[req.method] || 'unknown';

    const user = (req as any).user;
    operationLogDao.create({
      userId: user?.userId || 'anonymous',
      userName: user?.username || 'anonymous',
      module,
      action,
      targetId: extractTargetId(req.path),
      targetType: getTargetType(req.path),
      detail: req.method !== 'GET' ? req.body : undefined,
      ip: req.ip || req.socket.remoteAddress || 'unknown',
      userAgent: req.headers['user-agent'],
      status: res.statusCode < 400 ? 1 : 0,
      errorMessage: res.statusCode >= 400 ? `HTTP ${res.statusCode}` : undefined,
      duration,
    }).catch(() => {});

    (originalEnd as Function).apply(res, args);
  } as any;

  next();
}
