interface CommissionCalcResult {
    promoterId: string;
    orderId: string;
    orderNo: string;
    channelId?: string;
    amount: number;
    rate: number;
    type: number;
    parentId?: string;
    parentCommission?: number;
    parentRate?: number;
}
declare class CommissionEngineService {
    calculateFromOrder(orderId: string): Promise<CommissionCalcResult[]>;
    deductFromOrder(orderId: string, reason: string): Promise<void>;
    calculateMarketingBonus(orderId: string, marketingId: string): Promise<CommissionCalcResult | null>;
}
declare const _default: CommissionEngineService;
export default _default;
//# sourceMappingURL=CommissionEngine.service.d.ts.map