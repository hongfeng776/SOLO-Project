"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseConfig = exports.sequelize = void 0;
const sequelize_1 = require("sequelize");
const index_1 = __importDefault(require("./index"));
const databaseConfig = {
    host: index_1.default.database.host,
    port: index_1.default.database.port,
    username: index_1.default.database.username,
    password: index_1.default.database.password,
    database: index_1.default.database.database,
};
exports.databaseConfig = databaseConfig;
const sequelize = new sequelize_1.Sequelize(databaseConfig.database, databaseConfig.username, databaseConfig.password, {
    host: databaseConfig.host,
    port: databaseConfig.port,
    dialect: 'mysql',
    dialectOptions: {
        charset: 'utf8mb4',
    },
    define: {
        timestamps: true,
        underscored: true,
        freezeTableName: true,
    },
    pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
    },
    logging: index_1.default.nodeEnv === 'development' ? console.log : false,
    timezone: '+08:00',
});
exports.sequelize = sequelize;
exports.default = sequelize;
//# sourceMappingURL=database.js.map