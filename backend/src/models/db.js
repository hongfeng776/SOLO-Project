const { Sequelize } = require('sequelize')
const config = require('../config')

const sequelize = new Sequelize(
  config.database.name,
  config.database.user,
  config.database.password,
  {
    host: config.database.host,
    port: config.database.port,
    dialect: 'mysql',
    timezone: '+08:00',
    define: {
      timestamps: true,
      underscored: false,
      paranoid: false,
      createdAt: 'createdAt',
      updatedAt: 'updatedAt'
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    logging: config.app.env === 'development' ? console.log : false
  }
)

const testConnection = async () => {
  try {
    await sequelize.authenticate()
    console.log('数据库连接成功')
  } catch (error) {
    console.error('数据库连接失败:', error.message)
    process.exit(1)
  }
}

const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ force, alter: !force })
    console.log('数据库同步完成')
  } catch (error) {
    console.error('数据库同步失败:', error.message)
    process.exit(1)
  }
}

module.exports = {
  sequelize,
  testConnection,
  syncDatabase
}
