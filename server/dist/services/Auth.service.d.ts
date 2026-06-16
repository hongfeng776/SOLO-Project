import { JwtPayload, LoginRequest, LoginResponse, CreateUserRequest } from '../types';
declare class AuthService {
    hashPassword(password: string): Promise<string>;
    comparePassword(password: string, hash: string): Promise<boolean>;
    generateToken(payload: JwtPayload): string;
    generateRefreshToken(payload: JwtPayload): string;
    verifyToken(token: string): JwtPayload;
    verifyRefreshToken(token: string): JwtPayload;
    login(data: LoginRequest): Promise<LoginResponse>;
    register(data: CreateUserRequest): Promise<LoginResponse>;
    refreshToken(refreshToken: string): Promise<{
        token: string;
        refreshToken: string;
    }>;
}
declare const _default: AuthService;
export default _default;
//# sourceMappingURL=Auth.service.d.ts.map