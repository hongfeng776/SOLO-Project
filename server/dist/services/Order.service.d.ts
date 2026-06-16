import { OrderAttributes, OrderCreationAttributes } from '../models/Order.model';
import { PaginationParams, PaginationResult } from '../types';
import { OrderStatus } from '../constants/enum';
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
    findById(id: string): Promise<any>;
    findAll(params: OrderQueryParams): Promise<PaginationResult<any>>;
    update(id: string, data: Partial<OrderAttributes>): Promise<import("../models/Order.model").Order | null>;
    updateStatus(id: string, status: OrderStatus, userId?: string): Promise<void>;
    private validateStatusTransition;
    delete(id: string): Promise<void>;
    bulkUpdate(ids: string[], data: Partial<OrderAttributes>): Promise<void>;
    export(params: OrderQueryParams): Promise<import("../models/Order.model").Order[]>;
    private clearOrderCache;
}
declare const _default: OrderService;
export default _default;
//# sourceMappingURL=Order.service.d.ts.map