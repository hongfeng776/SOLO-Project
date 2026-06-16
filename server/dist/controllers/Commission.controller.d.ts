import { Request, Response } from 'express';
declare class CommissionController {
    create(req: Request, res: Response): Promise<void>;
    findById(req: Request, res: Response): Promise<void>;
    findAll(req: Request, res: Response): Promise<void>;
    update(req: Request, res: Response): Promise<void>;
    delete(req: Request, res: Response): Promise<void>;
    summary(req: Request, res: Response): Promise<void>;
    settle(req: Request, res: Response): Promise<void>;
    deduct(req: Request, res: Response): Promise<void>;
}
declare const _default: CommissionController;
export default _default;
//# sourceMappingURL=Commission.controller.d.ts.map