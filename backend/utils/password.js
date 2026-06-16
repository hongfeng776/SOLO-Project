const bcrypt = require('bcryptjs');
require('dotenv').config();

const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;

const encrypt = async (password) => {
  const salt = await bcrypt.genSalt(saltRounds);
  return await bcrypt.hash(password, salt);
};

const compare = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

module.exports = { encrypt, compare };
