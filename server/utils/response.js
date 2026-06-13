const { ErrorCode, ErrorMessage } = require('../constants/errorCode');

function success(data = null, message = ErrorMessage[ErrorCode.SUCCESS]) {
  return {
    code: ErrorCode.SUCCESS,
    message,
    data
  };
}

function fail(code = ErrorCode.BAD_REQUEST, message) {
  return {
    code,
    message: message || ErrorMessage[code] || ErrorMessage[ErrorCode.BAD_REQUEST],
    data: null
  };
}

function error(message = ErrorMessage[ErrorCode.BAD_REQUEST], code = ErrorCode.BAD_REQUEST) {
  return fail(code, message);
}

function unauthorized(message) {
  return fail(ErrorCode.UNAUTHORIZED, message);
}

function forbidden(message) {
  return fail(ErrorCode.FORBIDDEN, message);
}

function notFound(message) {
  return fail(ErrorCode.NOT_FOUND, message);
}

function businessError(code, message) {
  return fail(code, message);
}

module.exports = {
  success,
  error,
  fail,
  unauthorized,
  forbidden,
  notFound,
  businessError
};
