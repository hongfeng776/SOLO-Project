const { Sequelize, DataTypes, Op } = require('sequelize');
const config = require('./index');

const sequelize = new Sequelize(
  config.database.database,
  config.database.username,
  config.database.password,
  {
    host: config.database.host,
    port: config.database.port,
    dialect: config.database.dialect,
    pool: config.database.pool,
    logging: config.database.logging ? console.log : false,
    timezone: config.database.timezone,
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true,
    },
  }
);

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('[Database] Connection has been established successfully.');
  } catch (error) {
    console.error('[Database] Unable to connect to the database:', error);
    process.exit(1);
  }
};

const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ force, alter: !force });
    console.log('[Database] All models were synchronized successfully.');
  } catch (error) {
    console.error('[Database] Failed to synchronize models:', error);
    process.exit(1);
  }
};

module.exports = {
  sequelize,
  DataTypes,
  Op,
  testConnection,
  syncDatabase,
};
