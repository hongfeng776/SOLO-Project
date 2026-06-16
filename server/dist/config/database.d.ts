import { Sequelize } from 'sequelize';
declare const databaseConfig: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
};
declare const sequelize: Sequelize;
export { sequelize, databaseConfig };
export default sequelize;
//# sourceMappingURL=database.d.ts.map