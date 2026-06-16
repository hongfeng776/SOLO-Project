import { Model, Optional } from 'sequelize';
import { MarketingStatus, MarketingType } from '../constants/enum';
interface MarketingAttributes {
    id: string;
    name: string;
    code: string;
    type: MarketingType;
    status: MarketingStatus;
    startTime?: Date;
    endTime?: Date;
    rules?: any;
    budget?: number;
    usedAmount?: number;
    maxCommissionRate?: number;
    channels?: any;
    description?: string;
    coverImage?: string;
    sort?: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
interface MarketingCreationAttributes extends Optional<MarketingAttributes, 'id' | 'type' | 'status' | 'budget' | 'usedAmount' | 'sort' | 'createdAt' | 'updatedAt' | 'deletedAt'> {
}
declare class Marketing extends Model<MarketingAttributes, MarketingCreationAttributes> implements MarketingAttributes {
    id: string;
    name: string;
    code: string;
    type: MarketingType;
    status: MarketingStatus;
    startTime?: Date;
    endTime?: Date;
    rules?: any;
    budget?: number;
    usedAmount?: number;
    maxCommissionRate?: number;
    channels?: any;
    description?: string;
    coverImage?: string;
    sort?: number;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly deletedAt?: Date;
}
export { Marketing, MarketingAttributes, MarketingCreationAttributes };
export default Marketing;
//# sourceMappingURL=Marketing.model.d.ts.map