import { Request, Response } from 'express';
declare class OrderController {
    create(req: Request, res: Response): Promise<void>;
    findById(req: Request, res: Response): Promise<void>;
    findAll(req: Request, res: Response): Promise<void>;
    update(req: Request, res: Response): Promise<void>;
    delete(req: Request, res: Response): Promise<void>;
    bulkUpdate(req: Request, res: Response): Promise<void>;
    export(req: Request, res: Response): Promise<void>;
}
declare const _default: OrderController;
export default _default;
//# sourceMappingURL=Order.controller.d.ts.map