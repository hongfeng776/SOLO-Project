import config from './index';

const jwtConfig = {
  secret: config.jwt.secret,
  expiresIn: config.jwt.expiresIn,
  refreshSecret: config.jwt.refreshSecret,
  refreshExpiresIn: config.jwt.refreshExpiresIn,
};

const bcryptConfig = {
  saltRounds: config.bcrypt.saltRounds,
};

export { jwtConfig, bcryptConfig };
export default jwtConfig;
