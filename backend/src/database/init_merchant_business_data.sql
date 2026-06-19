-- ============================================================
-- 商家经营数据管控模块数据库初始化脚本
-- ============================================================

-- 1. 扩展 merchants 表，增加经营数据相关字段
ALTER TABLE merchants
  ADD COLUMN business_data_status TINYINT UNSIGNED DEFAULT 0 COMMENT '经营数据状态：0-未生成 1-已生成 2-已修正 3-异常' AFTER shop_operation_duration_days,
  ADD COLUMN business_quality_level TINYINT UNSIGNED DEFAULT 0 COMMENT '经营质量等级：0-未评定 1-优质 2-普通 3-劣质' AFTER business_data_status,
  ADD COLUMN last_business_calc_time DATETIME DEFAULT NULL COMMENT '最近经营数据计算时间' AFTER business_quality_level,
  ADD COLUMN estimated_settle_amount DECIMAL(12,2) DEFAULT 0.00 COMMENT '预估结算金额' AFTER last_business_calc_time,
  ADD COLUMN business_rank INT UNSIGNED DEFAULT 0 COMMENT '经营排名' AFTER estimated_settle_amount;

ALTER TABLE merchants ADD KEY idx_business_data_status (business_data_status);
ALTER TABLE merchants ADD KEY idx_business_quality_level (business_quality_level);
ALTER TABLE merchants ADD KEY idx_business_rank (business_rank);

-- ============================================================
-- 2. 商家经营数据表
-- ============================================================
DROP TABLE IF EXISTS merchant_business_data;
CREATE TABLE merchant_business_data (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  merchant_id BIGINT UNSIGNED NOT NULL COMMENT '商家ID',
  stat_period_type TINYINT UNSIGNED NOT NULL COMMENT '统计周期：1-日 2-周 3-月 4-季 5-年',
  stat_start_date DATE NOT NULL COMMENT '统计开始日期',
  stat_end_date DATE NOT NULL COMMENT '统计结束日期',
  total_order_count INT UNSIGNED DEFAULT 0 COMMENT '订单总数',
  valid_order_count INT UNSIGNED DEFAULT 0 COMMENT '有效订单数（剔除取消/退款）',
  completed_order_count INT UNSIGNED DEFAULT 0 COMMENT '已完成订单数',
  total_sales_amount DECIMAL(12,2) DEFAULT 0.00 COMMENT '销售额',
  valid_sales_amount DECIMAL(12,2) DEFAULT 0.00 COMMENT '有效销售额',
  settled_amount DECIMAL(12,2) DEFAULT 0.00 COMMENT '已结算金额',
  unsettled_amount DECIMAL(12,2) DEFAULT 0.00 COMMENT '待结算金额',
  total_refund_amount DECIMAL(12,2) DEFAULT 0.00 COMMENT '退款总额',
  refund_order_count INT UNSIGNED DEFAULT 0 COMMENT '退款订单数',
  avg_order_amount DECIMAL(10,2) DEFAULT 0.00 COMMENT '客单价',
  new_customer_count INT UNSIGNED DEFAULT 0 COMMENT '新客数',
  repeat_customer_count INT UNSIGNED DEFAULT 0 COMMENT '复购客数',
  valid_review_count INT UNSIGNED DEFAULT 0 COMMENT '有效评价数',
  positive_review_rate DECIMAL(5,2) DEFAULT 0.00 COMMENT '好评率',
  shop_category VARCHAR(50) DEFAULT NULL COMMENT '经营类目快照',
  shop_level TINYINT UNSIGNED DEFAULT NULL COMMENT '店铺等级快照',
  data_status TINYINT UNSIGNED DEFAULT 1 COMMENT '数据状态：1-正常 2-已修正 3-异常 4-已校准',
  data_source TINYINT UNSIGNED DEFAULT 1 COMMENT '数据来源：1-系统自动 2-手动录入 3-批量导入',
  is_abnormal TINYINT UNSIGNED DEFAULT 0 COMMENT '是否异常波动',
  abnormal_reason VARCHAR(500) DEFAULT NULL COMMENT '异常原因',
  risk_level TINYINT UNSIGNED DEFAULT 0 COMMENT '风险等级：0-无 1-低 2-中 3-高',
  operator_id BIGINT UNSIGNED DEFAULT NULL COMMENT '操作人ID',
  operator_name VARCHAR(50) DEFAULT NULL COMMENT '操作人姓名',
  remark VARCHAR(500) DEFAULT NULL COMMENT '备注',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_merchant_period (merchant_id, stat_period_type, stat_start_date, stat_end_date),
  KEY idx_merchant_id (merchant_id),
  KEY idx_stat_date (stat_start_date, stat_end_date),
  KEY idx_data_status (data_status),
  KEY idx_shop_category (shop_category),
  KEY idx_shop_level (shop_level),
  KEY idx_risk_level (risk_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商家经营数据表';

-- ============================================================
-- 3. 经营数据修正日志表
-- ============================================================
DROP TABLE IF EXISTS merchant_business_correct_logs;
CREATE TABLE merchant_business_correct_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  business_data_id BIGINT UNSIGNED NOT NULL COMMENT '经营数据ID',
  merchant_id BIGINT UNSIGNED NOT NULL COMMENT '商家ID',
  correct_field VARCHAR(50) NOT NULL COMMENT '修正字段名',
  field_label VARCHAR(50) DEFAULT NULL COMMENT '字段中文名',
  value_before DECIMAL(14,2) DEFAULT NULL COMMENT '修正前值',
  value_after DECIMAL(14,2) DEFAULT NULL COMMENT '修正后值',
  diff_value DECIMAL(14,2) DEFAULT NULL COMMENT '差值',
  diff_percent DECIMAL(8,2) DEFAULT NULL COMMENT '变动百分比',
  correct_reason VARCHAR(500) NOT NULL COMMENT '修正原因',
  consistency_check TINYINT UNSIGNED DEFAULT 1 COMMENT '逻辑一致性校验：1-通过 2-警告 3-不通过',
  consistency_detail VARCHAR(1000) DEFAULT NULL COMMENT '一致性校验详情',
  operator_id BIGINT UNSIGNED DEFAULT NULL COMMENT '操作人ID',
  operator_name VARCHAR(50) DEFAULT NULL COMMENT '操作人姓名',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  KEY idx_merchant_id (merchant_id),
  KEY idx_business_data_id (business_data_id),
  KEY idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='经营数据修正日志表';

-- ============================================================
-- 4. 等级评定记录表
-- ============================================================
DROP TABLE IF EXISTS merchant_level_assess_logs;
CREATE TABLE merchant_level_assess_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  merchant_id BIGINT UNSIGNED NOT NULL COMMENT '商家ID',
  assess_period_type TINYINT UNSIGNED NOT NULL COMMENT '评定周期：1-月度 2-季度 3-年度',
  assess_start_date DATE NOT NULL COMMENT '评定开始日期',
  assess_end_date DATE NOT NULL COMMENT '评定结束日期',
  old_shop_level TINYINT UNSIGNED DEFAULT NULL COMMENT '变更前店铺等级',
  new_shop_level TINYINT UNSIGNED NOT NULL COMMENT '变更后店铺等级',
  old_business_rank INT UNSIGNED DEFAULT NULL COMMENT '变更前经营排名',
  new_business_rank INT UNSIGNED NOT NULL COMMENT '变更后经营排名',
  old_estimated_settle DECIMAL(12,2) DEFAULT NULL COMMENT '变更前预估结算金额',
  new_estimated_settle DECIMAL(12,2) NOT NULL COMMENT '变更后预估结算金额',
  assess_basis JSON DEFAULT NULL COMMENT '评定依据（各项指标JSON）',
  assess_reason VARCHAR(500) DEFAULT NULL COMMENT '评定原因',
  operator_id BIGINT UNSIGNED DEFAULT NULL COMMENT '操作人ID',
  operator_name VARCHAR(50) DEFAULT NULL COMMENT '操作人姓名',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  KEY idx_merchant_id (merchant_id),
  KEY idx_assess_date (assess_start_date, assess_end_date),
  KEY idx_new_level (new_shop_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='等级评定记录表';

-- ============================================================
-- 5. 异常波动记录表
-- ============================================================
DROP TABLE IF EXISTS merchant_business_abnormal_logs;
CREATE TABLE merchant_business_abnormal_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  merchant_id BIGINT UNSIGNED NOT NULL COMMENT '商家ID',
  business_data_id BIGINT UNSIGNED DEFAULT NULL COMMENT '经营数据ID',
  abnormal_field VARCHAR(50) NOT NULL COMMENT '异常字段',
  field_label VARCHAR(50) DEFAULT NULL COMMENT '字段中文名',
  current_value DECIMAL(14,2) DEFAULT NULL COMMENT '当前值',
  history_avg_value DECIMAL(14,2) DEFAULT NULL COMMENT '历史平均值',
  diff_percent DECIMAL(8,2) DEFAULT NULL COMMENT '偏差百分比',
  abnormal_type TINYINT UNSIGNED NOT NULL COMMENT '异常类型：1-突增 2-突降 3-重复统计 4-逻辑矛盾',
  abnormal_level TINYINT UNSIGNED DEFAULT 2 COMMENT '异常等级：1-低 2-中 3-高',
  check_status TINYINT UNSIGNED DEFAULT 1 COMMENT '处理状态：1-待处理 2-已校准 3-已忽略 4-标记风险',
  check_reason VARCHAR(500) DEFAULT NULL COMMENT '处理原因',
  operator_id BIGINT UNSIGNED DEFAULT NULL COMMENT '操作人ID',
  operator_name VARCHAR(50) DEFAULT NULL COMMENT '操作人姓名',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  checked_at DATETIME DEFAULT NULL COMMENT '处理时间',
  KEY idx_merchant_id (merchant_id),
  KEY idx_abnormal_type (abnormal_type),
  KEY idx_check_status (check_status),
  KEY idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='异常波动记录表';
