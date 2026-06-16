const { OperationLog } = require('../models');

const SENSITIVE_FIELDS = ['password', 'oldPassword', 'newPassword', 'token'];

const MODULE_MAP = {
  contents: 'content',
  copyrights: 'copyright',
  advertisements: 'advertisement',
  activities: 'activity',
  users: 'user',
  roles: 'role',
  comments: 'comment',
  members: 'member',
  auth: 'auth',
};

function sanitizeData(data) {
  if (data === null || data === undefined) return data;
  if (typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item));
  }

  const result = {};
  for (const key of Object.keys(data)) {
    if (SENSITIVE_FIELDS.includes(key)) {
      result[key] = '***';
    } else {
      result[key] = sanitizeData(data[key]);
    }
  }
  return result;
}

function extractModule(url) {
  const match = url.match(/\/api\/v1\/([^/]+)/);
  if (!match) return 'system';
  const raw = match[1];
  return MODULE_MAP[raw] || raw;
}

function extractOperationType(method, url) {
  const lowerUrl = url.toLowerCase();

  if (lowerUrl.includes('login')) return 'LOGIN';
  if (lowerUrl.includes('logout')) return 'LOGOUT';
  if (lowerUrl.includes('change-password')) return 'CHANGE_PASSWORD';
  if (lowerUrl.includes('audit')) return 'AUDIT';
  if (lowerUrl.includes('batch-delete')) return 'BATCH_DELETE';
  if (lowerUrl.includes('export')) return 'EXPORT';
  if (lowerUrl.includes('status')) return 'CHANGE_STATUS';

  switch (method.toUpperCase()) {
    case 'POST':
      return 'CREATE';
    case 'PUT':
      return 'UPDATE';
    case 'DELETE':
      return 'DELETE';
    default:
      return method.toUpperCase();
  }
}

const recordOperation = (req, res, next) => {
  const method = req.method.toUpperCase();

  if (!['POST', 'PUT', 'DELETE'].includes(method)) {
    return next();
  }

  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const user = req.user || {};

    const operationType = extractOperationType(method, req.originalUrl);
    const operationModule = extractModule(req.originalUrl);

    let targetId = req.params.id || '';
    if (!targetId && req.body && req.body.ids) {
      targetId = Array.isArray(req.body.ids) ? req.body.ids.join(',') : String(req.body.ids);
    }

    const requestParams = sanitizeData({
      query: req.query,
      body: req.body,
      params: req.params,
    });

    OperationLog.create({
      operator_id: user.userId || null,
      operator_name: user.username || null,
      operation_type: operationType,
      operation_module: operationModule,
      request_method: method,
      request_url: req.originalUrl,
      request_params: requestParams,
      response_code: res.statusCode,
      target_type: operationModule,
      target_id: targetId || null,
      ip_address: req.ip || req.connection?.remoteAddress,
      user_agent: req.headers['user-agent'],
      duration,
      is_success: res.statusCode < 400 ? 1 : 0,
    }).catch(() => {});
  });

  next();
};

module.exports = { recordOperation };
