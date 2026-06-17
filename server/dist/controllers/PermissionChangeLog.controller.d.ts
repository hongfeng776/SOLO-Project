import { Request, Response } from 'express';
declare class PermissionChangeLogController {
    findAll(req: Request, res: Response): Promise<void>;
    getDetail(req: Request, res: Response): Promise<void>;
    exportLogs(req: Request, res: Response): Promise<void>;
    detectAnomalies(req: Request, res: Response): Promise<void>;
}
declare const _default: PermissionChangeLogController;
export default _default;
//# sourceMappingURL=PermissionChangeLog.controller.d.ts.map