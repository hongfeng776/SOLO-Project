import Redis from 'ioredis';
declare const redisConfig: {
    host: string;
    port: number;
    password: string | undefined;
    db: number;
};
declare const redis: Redis;
export { redis, redisConfig };
export default redis;
//# sourceMappingURL=redis.d.ts.map