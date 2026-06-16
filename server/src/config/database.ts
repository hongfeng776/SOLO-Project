import { Sequelize, Dialect } from 'sequelize';

const database = new Sequelize({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  database: process.env.DB_NAME || 'zhitou_finance',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '123456',
  dialect: (process.env.DB_DIALECT || 'mysql') as Dialect,
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 20,
    min: 5,
    acquire: 60000,
    idle: 10000,
  },
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true,
  },
  timezone: '+08:00',
});

export { database as sequelize };
export default database;
