const OperationLog = require('../models/OperationLog');

const RECORD_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH'];

function shouldRecord(req) {
  return RECORD_METHODS.includes(req.method) || req._logOperation;
}

function getClientIp(req) {
  const ip =
    req.headers['x-forwarded-for'] ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip ||
    '';
  return ip.split(',')[0].trim();
}

async function createLog(req, res, next) {
  if (!shouldRecord(req)) {
    return next();
  }

  const startTime = Date.now();
  const originalSend = res.send.bind(res);
  let logData = null;

  res.send = function (body) {
    try {
      let status = 1;
      let errorMsg = '';
      try {
        const parsed = typeof body === 'string' ? JSON.parse(body) : body;
        if (parsed && parsed.code && parsed.code !== 200) {
          status = 0;
          errorMsg = parsed.message || '';
        }
      } catch (e) {}

      logData = {
        user_id: req.user?.id || 0,
        username: req.user?.username || 'system',
        module: req._logModule || (req.baseUrl + req.path).split('/')[2] || 'system',
        operation: req._logOperation || inferOperation(req.method),
        method: req.method,
        path: req.originalUrl || req.url,
        params: JSON.stringify({
          query: req.query,
          body: maskSensitive(req.body)
        }).slice(0, 5000),
        ip: getClientIp(req),
        user_agent: req.headers['user-agent'] || '',
        status,
        error_msg: errorMsg,
        cost_time: Date.now() - startTime,
        description: req._logDesc || ''
      };
    } catch (e) {
      console.error('[OperationLog] Create log error:', e);
    }
    return originalSend(body);
  };

  res.on('finish', async () => {
    if (logData) {
      try {
        await OperationLog.create(logData);
      } catch (e) {
        console.error('[OperationLog] Save log error:', e);
      }
    }
  });

  next();
}

function inferOperation(method) {
  switch (method) {
    case 'POST':
      return 'create';
    case 'PUT':
    case 'PATCH':
      return 'update';
    case 'DELETE':
      return 'delete';
    default:
      return 'other';
  }
}

function maskSensitive(body) {
  if (!body || typeof body !== 'object') return body;
  const masked = { ...body };
  const sensitiveKeys = ['password', 'token', 'secret', 'authorization'];
  for (const key of Object.keys(masked)) {
    if (sensitiveKeys.includes(key.toLowerCase())) {
      masked[key] = '******';
    }
  }
  return masked;
}

function logMeta(meta) {
  return function (req, res, next) {
    if (meta.module) req._logModule = meta.module;
    if (meta.operation) req._logOperation = meta.operation;
    if (meta.description) req._logDesc = meta.description;
    next();
  };
}

module.exports = {
  createLog,
  logMeta,
  getClientIp
};
