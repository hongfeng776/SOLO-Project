import { Request, Response } from 'express';
declare class PromoterController {
    create(req: Request, res: Response): Promise<void>;
    findById(req: Request, res: Response): Promise<void>;
    findAll(req: Request, res: Response): Promise<void>;
    update(req: Request, res: Response): Promise<void>;
    delete(req: Request, res: Response): Promise<void>;
    bulkDelete(req: Request, res: Response): Promise<void>;
    updateStatus(req: Request, res: Response): Promise<void>;
    batchUpdateStatus(req: Request, res: Response): Promise<void>;
    approve(req: Request, res: Response): Promise<void>;
    reject(req: Request, res: Response): Promise<void>;
}
declare const _default: PromoterController;
export default _default;
//# sourceMappingURL=Promoter.controller.d.ts.map