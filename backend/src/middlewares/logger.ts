import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import { appConfig } from '../config/index';

morgan.token('id', (req: Request) => {
  return (req as unknown as { id?: string }).id || '-';
});

morgan.token('body', (req: Request) => {
  if (appConfig.env === 'production') {
    return '[REDACTED]';
  }
  return JSON.stringify(req.body || {});
});

const format = appConfig.env === 'production'
  ? ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms'
  : ':method :url :status :response-time ms - :res[content-length] :body';

export const requestLogger = morgan(format, {
  skip: (req: Request) => {
    return req.url === '/health' || req.url === '/favicon.ico';
  },
});

export function loggerMiddleware(req: Request, _res: Response, next: NextFunction): void {
  (req as unknown as { requestTime: number }).requestTime = Date.now();
  next();
}

export default loggerMiddleware;
