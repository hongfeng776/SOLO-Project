import { Request, Response } from 'express';
declare class PermissionController {
    createPermission(req: Request, res: Response): Promise<void>;
    updatePermission(req: Request, res: Response): Promise<void>;
    updateStatusBatch(req: Request, res: Response): Promise<void>;
    batchSort(req: Request, res: Response): Promise<void>;
    checkDeleteDependencies(req: Request, res: Response): Promise<void>;
    deletePermission(req: Request, res: Response): Promise<void>;
    findIdlePermissions(req: Request, res: Response): Promise<void>;
    findByModule(req: Request, res: Response): Promise<void>;
    findById(req: Request, res: Response): Promise<void>;
    findTree(req: Request, res: Response): Promise<void>;
    bulkDelete(req: Request, res: Response): Promise<void>;
    updateStatus(req: Request, res: Response): Promise<void>;
}
declare const _default: PermissionController;
export default _default;
//# sourceMappingURL=Permission.controller.d.ts.map