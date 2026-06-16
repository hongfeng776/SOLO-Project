const express = require('express');
const { success } = require('../utils/result');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/categories', auth(), (req, res) => {
  res.json(success(null, '品类注册接口预留'));
});

router.post('/modes', auth(), (req, res) => {
  res.json(success(null, '运营模式接口预留'));
});

router.post('/plugins', auth(), (req, res) => {
  res.json(success(null, '插件注册接口预留'));
});

module.exports = router;
