require('dotenv').config();

const { sequelize } = require('../config/db');

const indexes = [
  { table: 'orders', name: 'idx_order_no', fields: 'orderNo' },
  { table: 'orders', name: 'idx_user_id', fields: 'userId' },
  { table: 'orders', name: 'idx_category', fields: 'category' },
  { table: 'orders', name: 'idx_status', fields: 'status' },
  { table: 'orders', name: 'idx_create_time', fields: 'createTime' },
  { table: 'orders', name: 'idx_merchant_id', fields: 'merchantId' },
  { table: 'orders', name: 'idx_category_status', fields: 'category, status' },
  { table: 'merchants', name: 'idx_audit_status', fields: 'auditStatus' },
  { table: 'merchants', name: 'idx_violation_level', fields: 'violationLevel' },
  { table: 'merchants', name: 'idx_business_type', fields: 'businessType' },
  { table: 'flights', name: 'idx_departure_arrival', fields: 'departure, arrival' },
  { table: 'flights', name: 'idx_departure_time', fields: 'departureTime' },
  { table: 'flights', name: 'idx_status', fields: 'status' },
  { table: 'hotels', name: 'idx_star', fields: 'star' },
  { table: 'hotels', name: 'idx_status', fields: 'status' },
  { table: 'hotels', name: 'idx_merchant_id', fields: 'merchantId' },
  { table: 'cars', name: 'idx_status', fields: 'status' },
  { table: 'cars', name: 'idx_merchant_id', fields: 'merchantId' },
  { table: 'tickets', name: 'idx_status', fields: 'status' },
  { table: 'tickets', name: 'idx_merchant_id', fields: 'merchantId' },
  { table: 'order_logs', name: 'idx_order_id', fields: 'orderId' },
  { table: 'order_logs', name: 'idx_create_time', fields: 'createdAt' },
  { table: 'approvals', name: 'idx_type_business', fields: 'type, businessId' },
  { table: 'approvals', name: 'idx_status', fields: 'status' },
  { table: 'approvals', name: 'idx_applicant', fields: 'applicantId' }
];

const addIndexes = async () => {
  try {
    console.log('开始添加数据库索引...');
    await sequelize.authenticate();
    console.log('数据库连接成功！');

    for (const idx of indexes) {
      try {
        const sql = `CREATE INDEX IF NOT EXISTS ${idx.name} ON ${idx.table} (${idx.fields})`;
        await sequelize.query(sql);
        console.log(`✓ 索引创建成功: ${idx.name} ON ${idx.table}(${idx.fields})`);
      } catch (err) {
        console.warn(`✗ 索引创建失败: ${idx.name} ON ${idx.table}(${idx.fields}) - ${err.message}`);
      }
    }

    console.log('\n========================================');
    console.log('数据库索引优化完成！');
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('索引优化失败:', error);
    process.exit(1);
  }
};

addIndexes();
