const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

router.post('/login', authController.login);

router.post('/register', authController.register);

router.post('/logout', authMiddleware, authController.logout);

router.post('/refresh-token', authMiddleware, authController.refreshToken);

router.get('/profile', authMiddleware, authController.getCurrentUser);

module.exports = router;
