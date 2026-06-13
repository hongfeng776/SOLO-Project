require('dotenv').config();

module.exports = {
  secret: process.env.JWT_SECRET || 'hongjing_default_secret',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  algorithm: 'HS256'
};
