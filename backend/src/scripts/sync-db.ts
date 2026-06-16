import sequelize from '@config/database'

async function syncDatabase() {
  try {
    await sequelize.authenticate()
    console.log('[DB] 数据库连接成功')

    await sequelize.sync({ alter: true })
    console.log('[DB] 数据库同步完成')

    process.exit(0)
  } catch (error) {
    console.error('[DB] 数据库同步失败:', error)
    process.exit(1)
  }
}

syncDatabase()
