import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import {
  ProductScheduleRuleStatus,
  ProductScheduleRuleAction,
  ProductScheduleRepeatCycle,
} from '../constants/enum';
import { v4 as uuidv4 } from 'uuid';

interface ProductScheduleRuleAttributes {
  id: string;
  productId: string;
  ruleName: string;
  action: ProductScheduleRuleAction;
  startTime: Date;
  endTime?: Date;
  repeatCycle: ProductScheduleRepeatCycle;
  repeatConfig?: any;
  status: ProductScheduleRuleStatus;
  creatorId?: string;
  creatorName?: string;
  executorId?: string;
  executorName?: string;
  executedAt?: Date;
  cancelReason?: string;
  nextExecuteTime?: Date;
  lastExecuteTime?: Date;
  executeCount?: number;
  notifyOperators?: string[];
  remark?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

interface ProductScheduleRuleCreationAttributes
  extends Optional<
    ProductScheduleRuleAttributes,
    | 'id'
    | 'endTime'
    | 'repeatConfig'
    | 'status'
    | 'creatorId'
    | 'creatorName'
    | 'executorId'
    | 'executorName'
    | 'executedAt'
    | 'cancelReason'
    | 'nextExecuteTime'
    | 'lastExecuteTime'
    | 'executeCount'
    | 'notifyOperators'
    | 'remark'
    | 'createdAt'
    | 'updatedAt'
    | 'deletedAt'
  > {}

class ProductScheduleRule
  extends Model<ProductScheduleRuleAttributes, ProductScheduleRuleCreationAttributes>
  implements ProductScheduleRuleAttributes
{
  public id!: string;
  public productId!: string;
  public ruleName!: string;
  public action!: ProductScheduleRuleAction;
  public startTime!: Date;
  public endTime?: Date;
  public repeatCycle!: ProductScheduleRepeatCycle;
  public repeatConfig?: any;
  public status!: ProductScheduleRuleStatus;
  public creatorId?: string;
  public creatorName?: string;
  public executorId?: string;
  public executorName?: string;
  public executedAt?: Date;
  public cancelReason?: string;
  public nextExecuteTime?: Date;
  public lastExecuteTime?: Date;
  public executeCount?: number;
  public notifyOperators?: string[];
  public remark?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt?: Date;
}

ProductScheduleRule.init(
  {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      defaultValue: () => uuidv4(),
    },
    productId: {
      type: DataTypes.STRING(36),
      allowNull: false,
      references: {
        model: 'products',
        key: 'id',
      },
    },
    ruleName: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    action: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    repeatCycle: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: ProductScheduleRepeatCycle.NONE,
    },
    repeatConfig: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const raw = this.getDataValue('repeatConfig') as unknown as string | null;
        return raw ? JSON.parse(raw) : null;
      },
      set(value: any) {
        this.setDataValue('repeatConfig', value ? JSON.stringify(value) : (null as any));
      },
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: ProductScheduleRuleStatus.PENDING,
    },
    creatorId: {
      type: DataTypes.STRING(36),
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    creatorName: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    executorId: {
      type: DataTypes.STRING(36),
      allowNull: true,
    },
    executorName: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    executedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    cancelReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    nextExecuteTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    lastExecuteTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    executeCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    notifyOperators: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const raw = this.getDataValue('notifyOperators') as unknown as string | null;
        return raw ? JSON.parse(raw) : [];
      },
      set(value: string[]) {
        this.setDataValue(
          'notifyOperators',
          Array.isArray(value) ? (JSON.stringify(value) as any) : (value as any)
        );
      },
    },
    remark: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'product_schedule_rules',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
      {
        name: 'idx_product_id',
        fields: ['product_id'],
      },
      {
        name: 'idx_status',
        fields: ['status'],
      },
      {
        name: 'idx_action',
        fields: ['action'],
      },
      {
        name: 'idx_start_time',
        fields: ['start_time'],
      },
      {
        name: 'idx_next_execute_time',
        fields: ['next_execute_time'],
      },
      {
        name: 'idx_creator_id',
        fields: ['creator_id'],
      },
    ],
  }
);

export {
  ProductScheduleRule,
  ProductScheduleRuleAttributes,
  ProductScheduleRuleCreationAttributes,
};
export default ProductScheduleRule;
