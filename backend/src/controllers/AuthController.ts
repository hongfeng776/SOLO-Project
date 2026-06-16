import { Request, Response } from 'express';
import { authService } from '../services/AuthService';
import { asyncHandler } from '../middlewares/errorHandler';
import { ok, unauthorized, badRequest } from '../utils/response';

export const getCaptcha = asyncHandler(async (_req: Request, res: Response) => {
  const captcha = await authService.generateCaptcha();
  ok(res, captcha, '获取验证码成功');
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { username, password, captchaKey, captcha } = req.body;

  if (!username || !password || !captchaKey || !captcha) {
    badRequest(res, '缺少必要参数');
    return;
  }

  const result = await authService.login({
    username,
    password,
    captchaKey,
    captcha,
  });

  ok(res, result, '登录成功');
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const token = extractToken(req);
  if (!token) {
    unauthorized(res, '未提供认证令牌');
    return;
  }

  const decoded = await authService.verifyToken(token);
  await authService.logout(decoded.id);

  ok(res, null, '登出成功');
});

export const getUserInfo = asyncHandler(async (req: Request, res: Response) => {
  const token = extractToken(req);
  if (!token) {
    unauthorized(res, '未提供认证令牌');
    return;
  }

  const decoded = await authService.verifyToken(token);
  const userInfo = await authService.getUserInfo(decoded.id);

  ok(res, userInfo, '获取用户信息成功');
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    badRequest(res, '缺少刷新令牌');
    return;
  }

  const result = await authService.refreshToken(refreshToken);
  ok(res, result, '刷新令牌成功');
});

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  return authHeader;
}

export default {
  getCaptcha,
  login,
  logout,
  getUserInfo,
  refreshToken,
};
