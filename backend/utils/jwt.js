const jwt = require('jsonwebtoken');
require('dotenv').config();

const sign = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const verify = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

const decode = (token) => {
  return jwt.decode(token);
};

module.exports = { sign, verify, decode };
