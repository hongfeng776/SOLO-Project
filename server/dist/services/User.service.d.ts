import { CreateUserRequest, UpdateUserRequest, PaginationParams, PaginationResult } from '../types';
declare class UserService {
    create(data: CreateUserRequest): Promise<import("lodash").Omit<any, "deletedAt" | "password">>;
    findById(id: string): Promise<import("lodash").Omit<any, "deletedAt" | "password">>;
    findByUsername(username: string): Promise<import("lodash").Omit<any, "deletedAt" | "password">>;
    findAll(params: PaginationParams): Promise<PaginationResult<any>>;
    update(id: string, data: UpdateUserRequest): Promise<import("lodash").Omit<any, "deletedAt" | "password">>;
    delete(id: string): Promise<void>;
    private sanitizeUser;
}
declare const _default: UserService;
export default _default;
//# sourceMappingURL=User.service.d.ts.map