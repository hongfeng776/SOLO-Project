const { fail } = require('../utils/result');

class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 30000;
    this.monitorInterval = options.monitorInterval || 60000;
    this.failures = new Map();
  }

  _getKey(req) {
    return req.route?.path || req.path;
  }

  _getState(key) {
    if (!this.failures.has(key)) {
      this.failures.set(key, {
        count: 0,
        state: 'closed',
        lastFailure: null,
        openedAt: null
      });
    }
    return this.failures.get(key);
  }

  middleware() {
    return (req, res, next) => {
      const key = this._getKey(req);
      const state = this._getState(key);

      if (state.state === 'open') {
        const now = Date.now();
        if (now - state.openedAt >= this.resetTimeout) {
          state.state = 'half-open';
        } else {
          return res.json(fail('服务暂时不可用，请稍后重试', 503));
        }
      }

      const originalEnd = res.end;
      res.end = function (...args) {
        if (res.statusCode >= 500) {
          state.count++;
          state.lastFailure = Date.now();
          if (state.count >= this.failureThreshold) {
            state.state = 'open';
            state.openedAt = Date.now();
          }
        } else {
          if (state.state === 'half-open') {
            state.state = 'closed';
            state.count = 0;
          }
        }
        originalEnd.apply(res, args);
      }.bind(this);

      next();
    };
  }
}

const circuitBreaker = new CircuitBreaker();

module.exports = circuitBreaker.middleware();
