import { ChannelAttributes, ChannelCreationAttributes } from '../models/Channel.model';
import { PaginationParams, PaginationResult } from '../types';
interface ChannelQueryParams extends PaginationParams {
    keyword?: string;
    type?: string;
    status?: number;
}
declare class ChannelService {
    create(data: ChannelCreationAttributes): Promise<import("../models/Channel.model").Channel>;
    findById(id: string): Promise<ChannelAttributes | import("../models/Channel.model").Channel>;
    findAll(params: ChannelQueryParams): Promise<PaginationResult<any>>;
    update(id: string, data: Partial<ChannelAttributes>): Promise<import("../models/Channel.model").Channel | null>;
    delete(id: string): Promise<void>;
    bulkDelete(ids: string[]): Promise<void>;
    updateStatus(id: string, status: number): Promise<void>;
}
declare const _default: ChannelService;
export default _default;
//# sourceMappingURL=Channel.service.d.ts.map