"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisConfig = exports.redis = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const index_1 = __importDefault(require("./index"));
const logger_1 = __importDefault(require("../utils/logger"));
const redisConfig = {
    host: index_1.default.redis.host,
    port: index_1.default.redis.port,
    password: index_1.default.redis.password,
    db: index_1.default.redis.db,
};
exports.redisConfig = redisConfig;
const redis = new ioredis_1.default({
    host: redisConfig.host,
    port: redisConfig.port,
    password: redisConfig.password,
    db: redisConfig.db,
    retryDelayOnFailover: 100,
    enableReadyCheck: true,
    maxRetriesPerRequest: 3,
});
exports.redis = redis;
redis.on('connect', () => {
    logger_1.default.info('Redis connected successfully');
});
redis.on('error', (err) => {
    logger_1.default.error('Redis connection error:', err);
});
redis.on('ready', () => {
    logger_1.default.info('Redis is ready');
});
exports.default = redis;
//# sourceMappingURL=redis.js.map