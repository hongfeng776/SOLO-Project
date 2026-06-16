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
    findById(id: string): Promise<any>;
    findAll(params: PromoterQueryParams): Promise<PaginationResult<any>>;
    findByChannelId(channelId: string): Promise<import("../models/Promoter.model").Promoter[]>;
    update(id: string, data: Partial<PromoterAttributes>): Promise<import("../models/Promoter.model").Promoter | null>;
    delete(id: string): Promise<void>;
    bulkDelete(ids: string[]): Promise<void>;
    updateStatus(id: string, status: number): Promise<void>;
    batchUpdateStatus(ids: string[], status: number): Promise<void>;
    approve(id: string, auditUserId: string): Promise<void>;
    reject(id: string, auditUserId: string, reason: string): Promise<void>;
    bindChannel(promoterId: string, channelId: string): Promise<void>;
}
declare const _default: PromoterService;
export default _default;
//# sourceMappingURL=Promoter.service.d.ts.map