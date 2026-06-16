const express = require('express');
const AuthController = require('../controllers/AuthController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/login', AuthController.login);
router.post('/logout', authenticate, AuthController.logout);
router.post('/refresh-token', AuthController.refreshToken);
router.post('/change-password', authenticate, AuthController.changePassword);
router.get('/me', authenticate, AuthController.getCurrentUser);

module.exports = router;
