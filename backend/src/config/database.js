const { Sequelize } = require('sequelize')
require('dotenv').config()

const sequelize = new Sequelize(
  process.env.DB_NAME || 'cxzl_admin',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '123456',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    timezone: '+08:00',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 50,
      min: 5,
      acquire: 60000,
      idle: 10000
    },
    define: {
      timestamps: true,
      paranoid: true,
      underscored: false,
      createdAt: 'createTime',
      updatedAt: 'updateTime',
      deletedAt: 'deleteTime'
    }
  }
)

const testConnection = async () => {
  try {
    await sequelize.authenticate()
    return true
  } catch (error) {
    console.error('数据库连接失败:', error)
    throw error
  }
}

module.exports = {
  sequelize,
  testConnection
}
