const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const config = require('../config')

const generateToken = (payload) => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  })
}

const generateRefreshToken = (payload) => {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn
  })
}

const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.secret)
  } catch (error) {
    return null
  }
}

const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.refreshSecret)
  } catch (error) {
    return null
  }
}

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash)
}

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
  hashPassword,
  comparePassword
}
