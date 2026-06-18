import { Request, Response } from 'express';
declare class PromoterRiskController {
    getRiskList(req: Request, res: Response): Promise<void>;
    getRiskDetail(req: Request, res: Response): Promise<void>;
    getRiskProfile(req: Request, res: Response): Promise<void>;
    getRiskAnalysis(req: Request, res: Response): Promise<void>;
    markRisk(req: Request, res: Response): Promise<void>;
    cancelRisk(req: Request, res: Response): Promise<void>;
    getReleaseList(req: Request, res: Response): Promise<void>;
    submitRelease(req: Request, res: Response): Promise<void>;
    reviewRelease(req: Request, res: Response): Promise<void>;
    batchMarkRisk(req: Request, res: Response): Promise<void>;
    batchCancelRisk(req: Request, res: Response): Promise<void>;
    getBehaviorTrace(req: Request, res: Response): Promise<void>;
    getWarningList(req: Request, res: Response): Promise<void>;
    handleWarning(req: Request, res: Response): Promise<void>;
    getStatistics(req: Request, res: Response): Promise<void>;
}
declare const _default: PromoterRiskController;
export default _default;
//# sourceMappingURL=PromoterRisk.controller.d.ts.map