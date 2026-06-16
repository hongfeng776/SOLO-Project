import { Request, Response, NextFunction } from 'express';
import { OperateLog } from '../models/OperateLog';

const SKIP_PATHS = [
  '/health',
  '/favicon.ico',
];

const SKIP_METHODS: string[] = ['OPTIONS'];

const SENSITIVE_FIELDS = ['password', 'token', 'authorization', 'secret'];

function maskSensitiveData(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(maskSensitiveData);
  }

  const result: any = {};
  for (const key of Object.keys(data)) {
    if (SENSITIVE_FIELDS.some(field => key.toLowerCase().includes(field))) {
      result[key] = '******';
    } else {
      result[key] = maskSensitiveData(data[key]);
    }
  }
  return result;
}

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'] as string;
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return (req.ip || req.socket?.remoteAddress || '').replace('::ffff:', '');
}

function extractModuleAndAction(path: string): { module: string; action: string } {
  const pathParts = path.split('/').filter(Boolean);
  const apiIndex = pathParts.indexOf('api');
  const v1Index = pathParts.indexOf('v1');

  let startIndex = 0;
  if (v1Index !== -1) {
    startIndex = v1Index + 1;
  } else if (apiIndex !== -1) {
    startIndex = apiIndex + 1;
  }

  const relevantParts = pathParts.slice(startIndex);
  if (relevantParts.length === 0) {
    return { module: 'system', action: 'index' };
  }

  const module = relevantParts[0];
  const action = relevantParts.slice(1).join('_') || 'list';

  return { module, action };
}

export function operateLogMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();

  const originalPath = req.path;
  if (SKIP_PATHS.includes(originalPath) || SKIP_METHODS.includes(req.method)) {
    next();
    return;
  }

  const { module, action } = extractModuleAndAction(originalPath);

  const paramsJson = maskSensitiveData({
    query: req.query,
    body: req.body,
    params: req.params,
  });

  const originalSend = res.send.bind(res);
  const originalJson = res.json.bind(res);

  let responseBody: any = null;

  res.send = function (body: any): Response {
    responseBody = body;
    return originalSend(body);
  };

  res.json = function (body: any): Response {
    responseBody = body;
    return originalJson(body);
  };

  res.on('finish', () => {
    const costMs = Date.now() - startTime;

    let operatorId: number | undefined;
    let operatorType: number | undefined;

    if (req.user) {
      operatorId = req.user.id;
      operatorType = 1;
    }

    let resultJson: any = responseBody;
    if (typeof resultJson === 'string') {
      try {
        resultJson = JSON.parse(resultJson);
      } catch {
        resultJson = { raw: responseBody };
      }
    }
    resultJson = maskSensitiveData(resultJson);

    const statusCode = res.statusCode;
    const status = statusCode >= 200 && statusCode < 400 ? 1 : 0;

    const logData: any = {
      operator_id: operatorId,
      operator_type: operatorType,
      module,
      action,
      method: req.method,
      params_json: paramsJson,
      result_json: resultJson,
      ip: getClientIp(req),
      user_agent: req.headers['user-agent']?.substring(0, 500),
      cost_ms: costMs,
      status,
    };

    OperateLog.create(logData).catch((err) => {
      console.error('Failed to create operate log:', err);
    });
  });

  next();
}

export default operateLogMiddleware;
