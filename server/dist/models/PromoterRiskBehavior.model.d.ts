import { Model, Optional } from 'sequelize';
interface PromoterRiskBehaviorAttributes {
    id: string;
    promoterId: string;
    behaviorType: string;
    behaviorDesc?: string;
    ipAddress?: string;
    deviceId?: string;
    location?: string;
    orderId?: string;
    amount?: number;
    riskFlagged?: boolean;
    riskType?: string;
    riskScore?: number;
    metadata?: any;
    createdAt: Date;
}
interface PromoterRiskBehaviorCreationAttributes extends Optional<PromoterRiskBehaviorAttributes, 'id' | 'behaviorDesc' | 'ipAddress' | 'deviceId' | 'location' | 'orderId' | 'amount' | 'riskFlagged' | 'riskType' | 'riskScore' | 'metadata' | 'createdAt'> {
}
declare class PromoterRiskBehavior extends Model<PromoterRiskBehaviorAttributes, PromoterRiskBehaviorCreationAttributes> implements PromoterRiskBehaviorAttributes {
    id: string;
    promoterId: string;
    behaviorType: string;
    behaviorDesc?: string;
    ipAddress?: string;
    deviceId?: string;
    location?: string;
    orderId?: string;
    amount?: number;
    riskFlagged?: boolean;
    riskType?: string;
    riskScore?: number;
    metadata?: any;
    readonly createdAt: Date;
}
export { PromoterRiskBehavior, PromoterRiskBehaviorAttributes, PromoterRiskBehaviorCreationAttributes };
export default PromoterRiskBehavior;
//# sourceMappingURL=PromoterRiskBehavior.model.d.ts.map