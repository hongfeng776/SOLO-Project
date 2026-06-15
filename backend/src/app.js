require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { testConnection } = require('./config/database');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { success } = require('./utils/response');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const roleRoutes = require('./routes/role');
const permissionRoutes = require('./routes/permission');
const workRoutes = require('./routes/work');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/', (req, res) => {
  res.json(success({
    app: '红境项目后端服务',
    version: '1.0.0',
    status: 'running'
  }, '服务运行正常'));
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/works', workRoutes);

app.use(notFoundHandler);

app.use(errorHandler);

const startServer = async () => {
  try {
    await testConnection();
    
    app.listen(PORT, () => {
      console.log(`=====================================`);
      console.log(`  红境项目后端服务已启动`);
      console.log(`  服务地址: http://localhost:${PORT}`);
      console.log(`  运行环境: ${process.env.NODE_ENV}`);
      console.log(`=====================================`);
    });
  } catch (error) {
    console.error('服务启动失败:', error.message);
    process.exit(1);
  }
};

startServer();

module.exports = app;
