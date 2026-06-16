import { Request, Response } from 'express';
declare class WithdrawController {
    create(req: Request, res: Response): Promise<void>;
    apply(req: Request, res: Response): Promise<void>;
    findById(req: Request, res: Response): Promise<void>;
    findAll(req: Request, res: Response): Promise<void>;
    update(req: Request, res: Response): Promise<void>;
    delete(req: Request, res: Response): Promise<void>;
    audit(req: Request, res: Response): Promise<void>;
    pay(req: Request, res: Response): Promise<void>;
}
declare const _default: WithdrawController;
export default _default;
//# sourceMappingURL=Withdraw.controller.d.ts.map