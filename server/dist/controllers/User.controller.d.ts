import { Request, Response } from 'express';
declare class UserController {
    create(req: Request, res: Response): Promise<void>;
    findById(req: Request, res: Response): Promise<void>;
    findAll(req: Request, res: Response): Promise<void>;
    update(req: Request, res: Response): Promise<void>;
    delete(req: Request, res: Response): Promise<void>;
    getProfile(req: Request, res: Response): Promise<void>;
    updateProfile(req: Request, res: Response): Promise<void>;
    createAdmin(req: Request, res: Response): Promise<void>;
    updateAdmin(req: Request, res: Response): Promise<void>;
    findAllAdvanced(req: Request, res: Response): Promise<void>;
    batchUpdateStatus(req: Request, res: Response): Promise<void>;
    batchResetPermissions(req: Request, res: Response): Promise<void>;
    checkDeleteDependencies(req: Request, res: Response): Promise<void>;
    deleteAdmin(req: Request, res: Response): Promise<void>;
    getUserTraceInfo(req: Request, res: Response): Promise<void>;
    getPermissionMutualExclusionRules(req: Request, res: Response): Promise<void>;
}
declare const _default: UserController;
export default _default;
//# sourceMappingURL=User.controller.d.ts.map