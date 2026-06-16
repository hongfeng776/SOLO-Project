interface EnvConfig {
    nodeEnv: string;
    port: number;
    database: {
        host: string;
        port: number;
        username: string;
        password: string;
        database: string;
    };
    redis: {
        host: string;
        port: number;
        password?: string;
        db: number;
    };
    jwt: {
        secret: string;
        expiresIn: string;
        refreshSecret: string;
        refreshExpiresIn: string;
    };
    bcrypt: {
        saltRounds: number;
    };
}
declare const config: EnvConfig;
export default config;
//# sourceMappingURL=index.d.ts.map