import { Model, Optional } from 'sequelize';
import { QualificationType } from '../constants/enum';
interface PromoterQualificationAttributes {
    id: string;
    promoterId: string;
    type: QualificationType;
    title?: string;
    fileUrl: string;
    expireAt?: Date;
    verifyStatus?: number;
    verifyRemark?: string;
    verifiedBy?: string;
    verifiedAt?: Date;
    remark?: string;
    createdAt: Date;
    updatedAt: Date;
}
interface PromoterQualificationCreationAttributes extends Optional<PromoterQualificationAttributes, 'id' | 'title' | 'expireAt' | 'verifyStatus' | 'verifyRemark' | 'verifiedBy' | 'verifiedAt' | 'remark' | 'createdAt' | 'updatedAt'> {
}
declare class PromoterQualification extends Model<PromoterQualificationAttributes, PromoterQualificationCreationAttributes> implements PromoterQualificationAttributes {
    id: string;
    promoterId: string;
    type: QualificationType;
    title?: string;
    fileUrl: string;
    expireAt?: Date;
    verifyStatus?: number;
    verifyRemark?: string;
    verifiedBy?: string;
    verifiedAt?: Date;
    remark?: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export { PromoterQualification, PromoterQualificationAttributes, PromoterQualificationCreationAttributes };
export default PromoterQualification;
//# sourceMappingURL=PromoterQualification.model.d.ts.map