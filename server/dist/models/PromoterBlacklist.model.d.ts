import { Model, Optional } from 'sequelize';
import { BlacklistType } from '../constants/enum';
interface PromoterBlacklistAttributes {
    id: string;
    type: BlacklistType;
    value: string;
    reason?: string;
    operatorId?: string;
    source?: string;
    expiredAt?: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
interface PromoterBlacklistCreationAttributes extends Optional<PromoterBlacklistAttributes, 'id' | 'reason' | 'operatorId' | 'source' | 'expiredAt' | 'isActive' | 'createdAt' | 'updatedAt' | 'deletedAt'> {
}
declare class PromoterBlacklist extends Model<PromoterBlacklistAttributes, PromoterBlacklistCreationAttributes> implements PromoterBlacklistAttributes {
    id: string;
    type: BlacklistType;
    value: string;
    reason?: string;
    operatorId?: string;
    source?: string;
    expiredAt?: Date;
    isActive: boolean;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly deletedAt?: Date;
}
export { PromoterBlacklist, PromoterBlacklistAttributes, PromoterBlacklistCreationAttributes };
export default PromoterBlacklist;
//# sourceMappingURL=PromoterBlacklist.model.d.ts.map