import { Request, Response } from 'express';
declare class PromoterAuditController {
    preCheck(req: Request, res: Response): Promise<void>;
    submitApply(req: Request, res: Response): Promise<void>;
    getAuditList(req: Request, res: Response): Promise<void>;
    getAuditDetail(req: Request, res: Response): Promise<void>;
    firstAuditPass(req: Request, res: Response): Promise<void>;
    firstAuditReject(req: Request, res: Response): Promise<void>;
    secondAuditPass(req: Request, res: Response): Promise<void>;
    secondAuditReject(req: Request, res: Response): Promise<void>;
    batchFirstPass(req: Request, res: Response): Promise<void>;
    batchSecondPass(req: Request, res: Response): Promise<void>;
    batchFirstReject(req: Request, res: Response): Promise<void>;
    batchSecondReject(req: Request, res: Response): Promise<void>;
    searchAuditLogs(req: Request, res: Response): Promise<void>;
    getStatistics(req: Request, res: Response): Promise<void>;
    getRejectReasons(req: Request, res: Response): Promise<void>;
}
declare const _default: PromoterAuditController;
export default _default;
//# sourceMappingURL=PromoterAudit.controller.d.ts.map