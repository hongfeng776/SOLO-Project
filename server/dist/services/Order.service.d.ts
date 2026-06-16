import { OrderAttributes, OrderCreationAttributes } from '../models/Order.model';
import { PaginationParams, PaginationResult } from '../types';
interface OrderQueryParams extends PaginationParams {
    keyword?: string;
    orderNo?: string;
    channelId?: string;
    promoterId?: string;
    status?: number;
    startTime?: string;
    endTime?: string;
}
declare class OrderService {
    create(data: OrderCreationAttributes): Promise<import("../models/Order.model").Order>;
    private generateOrderNo;
    findById(id: string): Promise<import("../models/Order.model").Order>;
    findAll(params: OrderQueryParams): Promise<PaginationResult<any>>;
    update(id: string, data: Partial<OrderAttributes>): Promise<import("../models/Order.model").Order | null>;
    delete(id: string): Promise<void>;
    bulkUpdate(ids: string[], data: Partial<OrderAttributes>): Promise<void>;
    export(params: OrderQueryParams): Promise<import("../models/Order.model").Order[]>;
}
declare const _default: OrderService;
export default _default;
//# sourceMappingURL=Order.service.d.ts.map