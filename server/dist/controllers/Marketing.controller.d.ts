import { Request, Response } from 'express';
declare class MarketingController {
    create(req: Request, res: Response): Promise<void>;
    findById(req: Request, res: Response): Promise<void>;
    findAll(req: Request, res: Response): Promise<void>;
    update(req: Request, res: Response): Promise<void>;
    delete(req: Request, res: Response): Promise<void>;
    bulkDelete(req: Request, res: Response): Promise<void>;
    updateStatus(req: Request, res: Response): Promise<void>;
    batchUpdateStatus(req: Request, res: Response): Promise<void>;
    autoEnd(req: Request, res: Response): Promise<void>;
}
declare const _default: MarketingController;
export default _default;
//# sourceMappingURL=Marketing.controller.d.ts.map