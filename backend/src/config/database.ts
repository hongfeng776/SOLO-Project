import { Sequelize } from 'sequelize-typescript';
import config from '@/config';
import User from '@/models/User';
import SystemConfig from '@/models/SystemConfig';

class Database {
  public sequelize: Sequelize;

  constructor() {
    this.sequelize = new Sequelize({
      dialect: 'mysql',
      host: config.db.host,
      port: config.db.port,
      username: config.db.user,
      password: config.db.password,
      database: config.db.name,
      models: [User, SystemConfig],
      logging: config.env === 'development' ? console.log : false,
      timezone: '+08:00',
      pool: {
        max: config.db.poolMax,
        min: config.db.poolMin,
        idle: config.db.poolIdle,
        acquire: 60000,
      },
      define: {
        timestamps: true,
        underscored: true,
        freezeTableName: true,
      },
    });
  }

  async authenticate(): Promise<void> {
    try {
      await this.sequelize.authenticate();
      console.log('[Database] Connection established successfully.');
    } catch (error) {
      console.error('[Database] Unable to connect:', error);
      throw error;
    }
  }

  async sync(force = false): Promise<void> {
    try {
      await this.sequelize.sync({ force, alter: true });
      console.log('[Database] Tables synced successfully.');
    } catch (error) {
      console.error('[Database] Sync failed:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    await this.sequelize.close();
    console.log('[Database] Connection closed.');
  }
}

export const db = new Database();
export default db;
