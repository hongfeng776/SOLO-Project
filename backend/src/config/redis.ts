import Redis from 'ioredis'
import { config } from '@config/index'

const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  db: config.redis.db,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000)
    return delay
  }
})

redis.on('connect', () => {
  console.log('[Redis] 连接成功')
})

redis.on('error', (err) => {
  console.error('[Redis] 连接错误:', err.message)
})

export default redis
