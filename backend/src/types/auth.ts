export interface LoginRequest {
  username: string;
  password: string;
  captcha?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface JwtPayload {
  userId: string;
  username: string;
  orgId?: string;
  roles?: string[];
  permissions?: string[];
  iat?: number;
  exp?: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface ResetPasswordRequest {
  userId: string;
  newPassword: string;
}