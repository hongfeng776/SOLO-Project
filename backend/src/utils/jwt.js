const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')

const generateToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'cxzl_admin_secret_key_2024',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )
}

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'cxzl_admin_secret_key_2024')
  } catch (error) {
    return null
  }
}

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

const comparePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword)
}

module.exports = {
  generateToken,
  verifyToken,
  hashPassword,
  comparePassword
}
