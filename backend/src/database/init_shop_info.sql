-- ============================================================
-- 商家店铺信息管控模块数据库初始化脚本
-- ============================================================

-- 1. 扩展 merchants 表，增加店铺相关字段
ALTER TABLE merchants
  ADD COLUMN shop_name VARCHAR(100) DEFAULT NULL COMMENT '店铺名称' AFTER name,
  ADD COLUMN shop_logo VARCHAR(500) DEFAULT NULL COMMENT '店铺Logo URL' AFTER shop_name,
  ADD COLUMN shop_banner VARCHAR(500) DEFAULT NULL COMMENT '店铺Banner图 URL' AFTER shop_logo,
  ADD COLUMN shop_intro TEXT DEFAULT NULL COMMENT '店铺简介' AFTER shop_banner,
  ADD COLUMN shop_category VARCHAR(100) DEFAULT NULL COMMENT '店铺主营类目' AFTER shop_intro,
  ADD COLUMN shop_sub_category VARCHAR(100) DEFAULT NULL COMMENT '店铺二级类目' AFTER shop_category,
  ADD COLUMN shop_tags VARCHAR(500) DEFAULT NULL COMMENT '店铺标签(逗号分隔)' AFTER shop_sub_category,
  ADD COLUMN shop_level TINYINT UNSIGNED DEFAULT 1 COMMENT '店铺等级：1-新店 2-铜牌 3-银牌 4-金牌 5-钻石' AFTER shop_tags,
  ADD COLUMN shop_status TINYINT UNSIGNED DEFAULT 1 COMMENT '店铺状态：1-正常 2-停业 3-整改 4-封禁' AFTER shop_level,
  ADD COLUMN shop_status_reason VARCHAR(1000) DEFAULT NULL COMMENT '店铺状态变更原因' AFTER shop_status,
  ADD COLUMN shop_status_source VARCHAR(20) DEFAULT NULL COMMENT '状态来源：merchant-商家主动 platform-平台违规 system-系统自动' AFTER shop_status_reason,
  ADD COLUMN order_accept_permission TINYINT UNSIGNED DEFAULT 0 COMMENT '订单接单权限：0-禁止 1-允许' AFTER shop_status_source,
  ADD COLUMN marketing_participate_permission TINYINT UNSIGNED DEFAULT 0 COMMENT '营销活动参与资格：0-无资格 1-有资格' AFTER order_accept_permission,
  ADD COLUMN settlement_permission TINYINT UNSIGNED DEFAULT 0 COMMENT '结算功能：0-关闭 1-开启' AFTER marketing_participate_permission,
  ADD COLUMN shop_open_date DATE DEFAULT NULL COMMENT '开店日期' AFTER settlement_permission,
  ADD COLUMN shop_province VARCHAR(50) DEFAULT NULL COMMENT '店铺所在省份' AFTER shop_open_date,
  ADD COLUMN shop_city VARCHAR(50) DEFAULT NULL COMMENT '店铺所在城市' AFTER shop_province,
  ADD COLUMN shop_district VARCHAR(50) DEFAULT NULL COMMENT '店铺所在区县' AFTER shop_city,
  ADD COLUMN shop_address VARCHAR(255) DEFAULT NULL COMMENT '店铺详细地址' AFTER shop_district,
  ADD COLUMN customer_service_phone VARCHAR(20) DEFAULT NULL COMMENT '客服电话' AFTER shop_address,
  ADD COLUMN customer_service_hours VARCHAR(100) DEFAULT NULL COMMENT '客服工作时间' AFTER customer_service_phone,
  ADD COLUMN shop_operation_duration_days INT UNSIGNED DEFAULT 0 COMMENT '经营时长(天)' AFTER customer_service_hours;

ALTER TABLE merchants ADD UNIQUE KEY uk_shop_name (shop_name);
ALTER TABLE merchants ADD KEY idx_shop_status (shop_status);
ALTER TABLE merchants ADD KEY idx_shop_level (shop_level);
ALTER TABLE merchants ADD KEY idx_shop_category (shop_category);
ALTER TABLE merchants ADD KEY idx_shop_open_date (shop_open_date);

-- ============================================================
-- 2. 店铺状态变更记录表
-- ============================================================
DROP TABLE IF EXISTS shop_status_change_logs;
CREATE TABLE shop_status_change_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  merchant_id BIGINT UNSIGNED NOT NULL COMMENT '商家ID',
  status_before TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '变更前状态',
  status_after TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '变更后状态',
  status_source VARCHAR(20) NOT NULL DEFAULT 'platform' COMMENT '来源：merchant商家主动 platform平台违规 system系统自动',
  change_reason VARCHAR(1000) NOT NULL COMMENT '变更原因',
  order_permission_before TINYINT UNSIGNED DEFAULT 1 COMMENT '接单权限变更前',
  order_permission_after TINYINT UNSIGNED DEFAULT 1 COMMENT '接单权限变更后',
  marketing_permission_before TINYINT UNSIGNED DEFAULT 1 COMMENT '营销权限变更前',
  marketing_permission_after TINYINT UNSIGNED DEFAULT 1 COMMENT '营销权限变更后',
  settlement_permission_before TINYINT UNSIGNED DEFAULT 1 COMMENT '结算权限变更前',
  settlement_permission_after TINYINT UNSIGNED DEFAULT 1 COMMENT '结算权限变更后',
  affected_goods_count INT UNSIGNED DEFAULT 0 COMMENT '受影响商品数量',
  affected_order_count INT UNSIGNED DEFAULT 0 COMMENT '受影响订单数量',
  operator_id BIGINT UNSIGNED DEFAULT NULL COMMENT '操作人ID',
  operator_name VARCHAR(50) DEFAULT NULL COMMENT '操作人姓名',
  effective_time DATETIME DEFAULT NULL COMMENT '生效时间',
  remark VARCHAR(1000) DEFAULT NULL COMMENT '备注',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  KEY idx_merchant_id (merchant_id),
  KEY idx_status_source (status_source),
  KEY idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='店铺状态变更记录表';

-- ============================================================
-- 3. 店铺信息修改日志表
-- ============================================================
DROP TABLE IF EXISTS shop_info_change_logs;
CREATE TABLE shop_info_change_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  merchant_id BIGINT UNSIGNED NOT NULL COMMENT '商家ID',
  change_field VARCHAR(50) NOT NULL COMMENT '变更字段：shop_name/shop_intro/shop_category等',
  field_label VARCHAR(50) DEFAULT NULL COMMENT '字段中文名',
  value_before TEXT DEFAULT NULL COMMENT '变更前值',
  value_after TEXT DEFAULT NULL COMMENT '变更后值',
  sensitive_words JSON DEFAULT NULL COMMENT '命中的敏感词列表',
  risk_level TINYINT UNSIGNED DEFAULT 0 COMMENT '风险等级：0无 1低 2中 3高',
  change_source VARCHAR(20) NOT NULL DEFAULT 'merchant' COMMENT 'merchant商家修改 platform平台修改 system系统修改',
  operator_id BIGINT UNSIGNED DEFAULT NULL COMMENT '操作人ID',
  operator_name VARCHAR(50) DEFAULT NULL COMMENT '操作人姓名',
  change_reason VARCHAR(500) DEFAULT NULL COMMENT '修改原因',
  audit_status TINYINT UNSIGNED DEFAULT 0 COMMENT '审核状态：0无需 1待审 2通过 3驳回',
  audit_remark VARCHAR(500) DEFAULT NULL COMMENT '审核备注',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  KEY idx_merchant_id (merchant_id),
  KEY idx_change_field (change_field),
  KEY idx_risk_level (risk_level),
  KEY idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='店铺信息修改日志表';

-- ============================================================
-- 4. 店铺经营台账表
-- ============================================================
DROP TABLE IF EXISTS shop_operation_ledgers;
CREATE TABLE shop_operation_ledgers (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  merchant_id BIGINT UNSIGNED NOT NULL COMMENT '商家ID',
  operation_type VARCHAR(30) NOT NULL COMMENT '操作类型：create创建 update修改 status_change状态变更 order_income订单收入 settlement结算 refund退款 penalty处罚 marketing_fee营销费',
  operation_title VARCHAR(200) NOT NULL COMMENT '操作标题',
  operation_detail TEXT DEFAULT NULL COMMENT '操作详情',
  amount DECIMAL(12, 2) DEFAULT 0.00 COMMENT '涉及金额',
  goods_count INT UNSIGNED DEFAULT 0 COMMENT '涉及商品数量',
  order_count INT UNSIGNED DEFAULT 0 COMMENT '涉及订单数量',
  permission_snapshot JSON DEFAULT NULL COMMENT '权限快照',
  status_snapshot JSON DEFAULT NULL COMMENT '状态快照',
  operator_id BIGINT UNSIGNED DEFAULT NULL COMMENT '操作人ID',
  operator_name VARCHAR(50) DEFAULT NULL COMMENT '操作人姓名',
  operator_role VARCHAR(20) DEFAULT NULL COMMENT '角色：merchant/admin/system',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  KEY idx_merchant_id (merchant_id),
  KEY idx_operation_type (operation_type),
  KEY idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='店铺经营台账表';
