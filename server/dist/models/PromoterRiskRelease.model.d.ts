import { Model, Optional } from 'sequelize';
interface PromoterRiskReleaseAttributes {
    id: string;
    promoterId: string;
    applicantId?: string;
    applicantName?: string;
    riskRecordId?: string;
    releaseReason: string;
    proofMaterials?: any;
    rectificationDesc?: string;
    abnormalDataCleared?: boolean;
    verifyStatus?: number;
    verifierId?: string;
    verifierName?: string;
    verifyRemark?: string;
    verifiedAt?: Date;
    restoreStage?: number;
    createdAt: Date;
    updatedAt: Date;
}
interface PromoterRiskReleaseCreationAttributes extends Optional<PromoterRiskReleaseAttributes, 'id' | 'applicantId' | 'applicantName' | 'riskRecordId' | 'proofMaterials' | 'rectificationDesc' | 'abnormalDataCleared' | 'verifyStatus' | 'verifierId' | 'verifierName' | 'verifyRemark' | 'verifiedAt' | 'restoreStage' | 'createdAt' | 'updatedAt'> {
}
declare class PromoterRiskRelease extends Model<PromoterRiskReleaseAttributes, PromoterRiskReleaseCreationAttributes> implements PromoterRiskReleaseAttributes {
    id: string;
    promoterId: string;
    applicantId?: string;
    applicantName?: string;
    riskRecordId?: string;
    releaseReason: string;
    proofMaterials?: any;
    rectificationDesc?: string;
    abnormalDataCleared?: boolean;
    verifyStatus?: number;
    verifierId?: string;
    verifierName?: string;
    verifyRemark?: string;
    verifiedAt?: Date;
    restoreStage?: number;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export { PromoterRiskRelease, PromoterRiskReleaseAttributes, PromoterRiskReleaseCreationAttributes };
export default PromoterRiskRelease;
//# sourceMappingURL=PromoterRiskRelease.model.d.ts.map