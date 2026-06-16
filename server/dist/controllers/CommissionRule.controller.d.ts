import { Request, Response } from 'express';
declare class CommissionRuleController {
    create(req: Request, res: Response): Promise<void>;
    findById(req: Request, res: Response): Promise<void>;
    findAll(req: Request, res: Response): Promise<void>;
    update(req: Request, res: Response): Promise<void>;
    delete(req: Request, res: Response): Promise<void>;
    toggleEnabled(req: Request, res: Response): Promise<void>;
}
declare const _default: CommissionRuleController;
export default _default;
//# sourceMappingURL=CommissionRule.controller.d.ts.map