import { Sequelize, type Dialect } from 'sequelize'
import { config } from '@config/index'

const sequelize = new Sequelize(config.db.name, config.db.user, config.db.password, {
  host: config.db.host,
  port: config.db.port,
  dialect: config.db.dialect as Dialect,
  pool: config.db.pool,
  logging: config.db.logging,
  timezone: '+08:00',
  define: {
    timestamps: true,
    paranoid: true,
    underscored: true,
    createdAt: 'create_time',
    updatedAt: 'update_time',
    deletedAt: 'delete_time'
  }
})

export default sequelize
