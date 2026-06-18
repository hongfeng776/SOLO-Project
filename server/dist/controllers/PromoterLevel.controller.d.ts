import { Request, Response } from 'express';
declare class PromoterLevelController {
    getAllRules(req: Request, res: Response): Promise<void>;
    saveLevelRule(req: Request, res: Response): Promise<void>;
    validateThresholds(req: Request, res: Response): Promise<void>;
    batchReEvaluate(req: Request, res: Response): Promise<void>;
    requestManualAdjust(req: Request, res: Response): Promise<void>;
    reviewAdjust(req: Request, res: Response): Promise<void>;
    getAdjustRequests(req: Request, res: Response): Promise<void>;
    batchResetLevels(req: Request, res: Response): Promise<void>;
    getChangeLogs(req: Request, res: Response): Promise<void>;
    getIterationStats(req: Request, res: Response): Promise<void>;
}
declare const _default: PromoterLevelController;
export default _default;
//# sourceMappingURL=PromoterLevel.controller.d.ts.map