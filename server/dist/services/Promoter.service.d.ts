import { PromoterAttributes, PromoterCreationAttributes } from '../models/Promoter.model';
import { PaginationParams, PaginationResult } from '../types';
interface PromoterQueryParams extends PaginationParams {
    keyword?: string;
    channelId?: string;
    level?: string;
    status?: number;
}
declare class PromoterService {
    create(data: PromoterCreationAttributes): Promise<import("../models/Promoter.model").Promoter>;
    private generateCode;
    findById(id: string): Promise<import("../models/Promoter.model").Promoter>;
    findAll(params: PromoterQueryParams): Promise<PaginationResult<any>>;
    update(id: string, data: Partial<PromoterAttributes>): Promise<import("../models/Promoter.model").Promoter | null>;
    delete(id: string): Promise<void>;
    bulkDelete(ids: string[]): Promise<void>;
    updateStatus(id: string, status: number): Promise<void>;
}
declare const _default: PromoterService;
export default _default;
//# sourceMappingURL=Promoter.service.d.ts.map