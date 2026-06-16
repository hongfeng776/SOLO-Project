import { Request, Response, NextFunction } from 'express';
import authService from '@services/AuthService';
import { success } from '@utils/response';

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { username, password } = req.body;
    const ip = req.ip || req.socket.remoteAddress;
    const result = await authService.login(username, password, ip);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function refreshToken(req: Request, res: Response, next: NextFunction) {
  try {
    const { token } = req.body;
    const result = await authService.refreshToken(token);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}

export async function getCurrentUser(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const result = await authService.getCurrentUser(userId);
    res.json(success(result));
  } catch (err) {
    next(err);
  }
}
