import { MarketingAttributes, MarketingCreationAttributes } from '../models/Marketing.model';
import { PaginationParams, PaginationResult } from '../types';
interface MarketingQueryParams extends PaginationParams {
    keyword?: string;
    type?: string;
    status?: number;
}
declare class MarketingService {
    create(data: MarketingCreationAttributes): Promise<import("../models/Marketing.model").Marketing>;
    findById(id: string): Promise<any>;
    findAll(params: MarketingQueryParams): Promise<PaginationResult<any>>;
    update(id: string, data: Partial<MarketingAttributes>): Promise<import("../models/Marketing.model").Marketing | null>;
    delete(id: string): Promise<void>;
    bulkDelete(ids: string[]): Promise<void>;
    updateStatus(id: string, status: number): Promise<void>;
    batchUpdateStatus(ids: string[], status: number): Promise<void>;
    checkAndAutoEnd(): Promise<number>;
}
declare const _default: MarketingService;
export default _default;
//# sourceMappingURL=Marketing.service.d.ts.map