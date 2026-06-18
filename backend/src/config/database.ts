import { Sequelize } from 'sequelize-typescript';
import { config } from './index';
import { User, Role, Permission, Organization, UserRole, RolePermission, Transaction, Product, AuditRecord, AuditRule, OperationLog, Customer, ViolationRecord, Account, AccountOpening, CorporateAccountOpening, OpeningReviewLog, StatusChangeLog, LoanApprovalFlow, LoanApprovalLog } from '../models';
import { StatusChangeLog as SCL } from '../models';

const _tableCreateEnsure = SCL;

export const sequelize = new Sequelize({
  dialect: 'mysql',
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  username: config.database.user,
  password: config.database.password,
  models: [User, Role, Permission, Organization, UserRole, RolePermission, Transaction, Product, AuditRecord, AuditRule, OperationLog, Customer, ViolationRecord, Account, AccountOpening, CorporateAccountOpening, OpeningReviewLog, StatusChangeLog, LoanApprovalFlow, LoanApprovalLog],
  timezone: '+08:00',
  dialectOptions: {
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
    dateStrings: true,
    typeCast: true
  },
  pool: {
    max: 20,
    min: 5,
    acquire: 60000,
    idle: 10000
  },
  logging: config.nodeEnv === 'development' ? console.log : false,
  define: {
    timestamps: true,
    paranoid: true,
    underscored: true,
    freezeTableName: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at'
  }
});

export async function testConnection(): Promise<void> {
  try {
    await sequelize.authenticate();
    console.log('[Database] Connection has been established successfully.');
  } catch (error) {
    console.error('[Database] Unable to connect to the database:', error);
    throw error;
  }
}

export async function syncDatabase(force: boolean = false): Promise<void> {
  try {
    await sequelize.sync({ force, alter: false });
    try {
      await StatusChangeLog.sync({ alter: false });
    } catch { /* table may already exist */ }
    console.log(`[Database] Database synced successfully (force=${force}).`);
  } catch (error) {
    console.error('[Database] Failed to sync database:', error);
    throw error;
  }
}