import { Sequelize } from 'sequelize-typescript';
import * as path from 'path';
import { databaseConfig, appConfig } from './index';

const sequelize = new Sequelize({
  dialect: 'mysql',
  host: databaseConfig.host,
  port: databaseConfig.port,
  username: databaseConfig.user,
  password: databaseConfig.password,
  database: databaseConfig.database,
  timezone: databaseConfig.timezone,
  models: [path.join(__dirname, '../models')],
  logging: appConfig.env === 'development' ? console.log : false,
});

export const connectDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    console.log('Database models synchronized.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
};

export default sequelize;
