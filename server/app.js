require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const sequelize = require('./config/database');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const { createLog } = require('./middleware/operationLog');
const { notFound } = require('./utils/response');

const app = express();
const PORT = process.env.PORT || 3000;

const uploadDir = path.join(__dirname, process.env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/uploads', express.static(uploadDir));

app.use(createLog);

app.use('/api', routes);

app.use((req, res) => {
  res.status(404).json(notFound('接口不存在'));
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;
