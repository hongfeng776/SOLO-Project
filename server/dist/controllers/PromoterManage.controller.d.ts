import { Request, Response } from 'express';
declare class PromoterManageController {
    getLevelConfigs(req: Request, res: Response): Promise<void>;
    checkEditPermission(req: Request, res: Response): Promise<void>;
    validateField(req: Request, res: Response): Promise<void>;
    checkUniqueness(req: Request, res: Response): Promise<void>;
    updatePromoterInfo(req: Request, res: Response): Promise<void>;
    validateQualification(req: Request, res: Response): Promise<void>;
    submitQualification(req: Request, res: Response): Promise<void>;
    reviewQualification(req: Request, res: Response): Promise<void>;
    batchUpdateLevel(req: Request, res: Response): Promise<void>;
    batchUpdatePromoteStatus(req: Request, res: Response): Promise<void>;
    batchUpdateSettleStatus(req: Request, res: Response): Promise<void>;
    getChangeLogs(req: Request, res: Response): Promise<void>;
    getChangeDiff(req: Request, res: Response): Promise<void>;
    getPromoterDetail(req: Request, res: Response): Promise<void>;
}
declare const _default: PromoterManageController;
export default _default;
//# sourceMappingURL=PromoterManage.controller.d.ts.map