import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt, UpdatedAt, Unique } from 'sequelize-typescript';

export interface SystemConfigAttributes {
  id: number;
  configKey: string;
  configValue: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SystemConfigCreationAttributes extends Omit<SystemConfigAttributes, 'id' | 'createdAt' | 'updatedAt' | 'description'> {
  description?: string;
}

@Table({ tableName: 'sys_config' })
export default class SystemConfig extends Model<SystemConfigAttributes, SystemConfigCreationAttributes> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @Unique
  @Column({ type: DataType.STRING(100), allowNull: false, field: 'config_key', comment: '配置键' })
  configKey!: string;

  @Column({ type: DataType.TEXT, allowNull: false, field: 'config_value', comment: '配置值' })
  configValue!: string;

  @Column({ type: DataType.STRING(255), comment: '配置描述' })
  description?: string;

  @CreatedAt
  @Column({ type: DataType.DATE, field: 'created_at' })
  createdAt!: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE, field: 'updated_at' })
  updatedAt!: Date;
}
