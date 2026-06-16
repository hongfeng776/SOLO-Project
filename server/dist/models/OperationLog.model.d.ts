import { Model, Optional } from 'sequelize';
interface OperationLogAttributes {
    id: string;
    userId: string;
    userName: string;
    module: string;
    action: string;
    targetId?: string;
    targetType?: string;
    detail?: any;
    ip: string;
    userAgent?: string;
    status: number;
    errorMessage?: string;
    duration: number;
    createdAt: Date;
}
interface OperationLogCreationAttributes extends Optional<OperationLogAttributes, 'id' | 'targetId' | 'targetType' | 'detail' | 'userAgent' | 'errorMessage' | 'createdAt'> {
}
declare class OperationLog extends Model<OperationLogAttributes, OperationLogCreationAttributes> implements OperationLogAttributes {
    id: string;
    userId: string;
    userName: string;
    module: string;
    action: string;
    targetId?: string;
    targetType?: string;
    detail?: any;
    ip: string;
    userAgent?: string;
    status: number;
    errorMessage?: string;
    duration: number;
    readonly createdAt: Date;
}
export { OperationLog, OperationLogAttributes, OperationLogCreationAttributes };
export default OperationLog;
//# sourceMappingURL=OperationLog.model.d.ts.map