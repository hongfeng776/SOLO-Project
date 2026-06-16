const systemLogService = require('../services/SystemLogService');

const EXCLUDE_PATHS = ['/api/health', '/api/system-logs'];

const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  const isExcluded = EXCLUDE_PATHS.some(path => req.originalUrl.startsWith(path));
  if (isExcluded) return next();

  const originalEnd = res.end;
  res.end = function (...args) {
    const responseTime = Date.now() - startTime;
    const statusCode = res.statusCode;

    if (req.method !== 'GET' || statusCode >= 400) {
      systemLogService.recordLog({
        userId: req.user?.id || null,
        username: req.user?.username || 'anonymous',
        action: req.method,
        module: req.route?.path || req.path,
        target: req.originalUrl,
        detail: JSON.stringify({
          method: req.method,
          url: req.originalUrl,
          statusCode,
          responseTime
        }),
        ip: req.ip || req.connection?.remoteAddress,
        userAgent: req.get('user-agent') || ''
      }).catch(() => {});
    }

    originalEnd.apply(res, args);
  };

  next();
};

module.exports = requestLogger;
