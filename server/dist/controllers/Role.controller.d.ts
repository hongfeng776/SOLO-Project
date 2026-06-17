import { Request, Response } from 'express';
declare class RoleController {
    create(req: Request, res: Response): Promise<void>;
    createRole(req: Request, res: Response): Promise<void>;
    findById(req: Request, res: Response): Promise<void>;
    findAll(req: Request, res: Response): Promise<void>;
    update(req: Request, res: Response): Promise<void>;
    updateRoleWithPermissions(req: Request, res: Response): Promise<void>;
    delete(req: Request, res: Response): Promise<void>;
    deleteRole(req: Request, res: Response): Promise<void>;
    bulkDelete(req: Request, res: Response): Promise<void>;
    updateStatus(req: Request, res: Response): Promise<void>;
    assignPermissions(req: Request, res: Response): Promise<void>;
    getPermissions(req: Request, res: Response): Promise<void>;
    batchCopyRoles(req: Request, res: Response): Promise<void>;
    batchUpdateStatus(req: Request, res: Response): Promise<void>;
    checkRoleDependencies(req: Request, res: Response): Promise<void>;
    searchDeletionLogs(req: Request, res: Response): Promise<void>;
    getBoundUserCount(req: Request, res: Response): Promise<void>;
}
declare const _default: RoleController;
export default _default;
//# sourceMappingURL=Role.controller.d.ts.map