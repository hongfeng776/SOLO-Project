export interface UserInfo {
  id: number;
  username: string;
  phone?: string;
  email?: string;
  avatar?: string;
  status?: number;
}

export interface JwtPayload {
  id: number;
  username: string;
  iat?: number;
  exp?: number;
}

export interface PageParams {
  page: number;
  pageSize: number;
}

export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CaptchaResult {
  text: string;
  data: string;
}

export interface TokenResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

declare module 'express' {
  interface Request {
    user?: UserInfo;
  }
}
