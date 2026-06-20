-- ============================================================
-- 商家结算资金管控模块数据库初始化脚本
-- ============================================================

-- 1. 扩展 merchants 表，增加结算资金管控相关字段
ALTER TABLE merchants
  ADD COLUMN bank_account_name VARCHAR(100) NULL COMMENT '银行开户名' AFTER deducted_settle_amount,
  ADD COLUMN bank_account_no VARCHAR(50) NULL COMMENT '银行账号' AFTER bank_account_name,
  ADD COLUMN bank_name VARCHAR(100) NULL COMMENT '开户银行名称' AFTER bank_account_no,
  ADD COLUMN bank_branch_name VARCHAR(100) NULL COMMENT '开户支行名称' AFTER bank_name,
  ADD COLUMN bank_verify_status TINYINT UNSIGNED DEFAULT 0 COMMENT '银行卡认证状态：0-未认证 1-认证中 2-认证通过 3-认证失败' AFTER bank_branch_name,
  ADD COLUMN available_settle_balance DECIMAL(14,2) DEFAULT 0.00 COMMENT '可结算余额' AFTER bank_verify_status,
  ADD COLUMN settle_withdraw_count INT UNSIGNED DEFAULT 0 COMMENT '已提现次数' AFTER total_settle_amount,
  ADD COLUMN last_settle_time DATETIME DEFAULT NULL COMMENT '最近结算时间' AFTER settle_withdraw_count;

ALTER TABLE merchants ADD KEY idx_bank_verify_status (bank_verify_status);
ALTER TABLE merchants ADD KEY idx_available_settle_balance (available_settle_balance);

-- ============================================================
-- 2. 结算申请单表
-- ============================================================
DROP TABLE IF EXISTS settle_apply_orders;
CREATE TABLE settle_apply_orders (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  apply_no VARCHAR(32) NOT NULL COMMENT '申请单号',
  merchant_id BIGINT UNSIGNED NOT NULL COMMENT '商家ID',
  settle_period_type TINYINT UNSIGNED NOT NULL COMMENT '结算周期：1-日结 2-周结 3-月结 4-季结',
  period_start_date DATE NOT NULL COMMENT '周期开始日期',
  period_end_date DATE NOT NULL COMMENT '周期结束日期',
  total_order_count INT UNSIGNED DEFAULT 0 COMMENT '本期订单数',
  total_settle_base DECIMAL(14,2) DEFAULT 0.00 COMMENT '本期应收总额',
  platform_fee_amount DECIMAL(12,2) DEFAULT 0.00 COMMENT '平台手续费',
  aftersale_deduct_amount DECIMAL(12,2) DEFAULT 0.00 COMMENT '售后扣减金额',
  penalty_deduct_amount DECIMAL(12,2) DEFAULT 0.00 COMMENT '违规罚款金额',
  other_deduct_amount DECIMAL(12,2) DEFAULT 0.00 COMMENT '其他扣减',
  actual_settle_amount DECIMAL(14,2) NOT NULL COMMENT '实际结算金额',
  apply_status TINYINT UNSIGNED DEFAULT 1 COMMENT '申请状态：1-待审核 2-审核通过 3-审核驳回 4-打款中 5-已到账 6-打款失败',
  apply_source TINYINT UNSIGNED DEFAULT 1 COMMENT '申请来源：1-商家主动 2-系统自动 3-平台批量',
  bank_snapshot JSON DEFAULT NULL COMMENT '银行卡信息快照JSON',
  reject_reason VARCHAR(500) DEFAULT NULL COMMENT '驳回原因',
  audit_time DATETIME DEFAULT NULL COMMENT '审核时间',
  auditor_id BIGINT UNSIGNED DEFAULT NULL COMMENT '审核人ID',
  auditor_name VARCHAR(50) DEFAULT NULL COMMENT '审核人姓名',
  transfer_time DATETIME DEFAULT NULL COMMENT '打款时间',
  arrive_time DATETIME DEFAULT NULL COMMENT '到账时间',
  transfer_voucher_url VARCHAR(500) DEFAULT NULL COMMENT '打款凭证',
  operator_id BIGINT UNSIGNED DEFAULT NULL COMMENT '操作人ID',
  operator_name VARCHAR(50) DEFAULT NULL COMMENT '操作人姓名',
  remark VARCHAR(1000) DEFAULT NULL COMMENT '备注',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_apply_no (apply_no),
  KEY idx_merchant_id (merchant_id),
  KEY idx_apply_status (apply_status),
  KEY idx_period (settle_period_type, period_start_date, period_end_date),
  KEY idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='结算申请单表';

-- ============================================================
-- 3. 结算扣减明细表
-- ============================================================
DROP TABLE IF EXISTS settle_deduct_details;
CREATE TABLE settle_deduct_details (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  settle_apply_id BIGINT UNSIGNED NOT NULL COMMENT '结算申请单ID',
  merchant_id BIGINT UNSIGNED NOT NULL COMMENT '商家ID',
  deduct_type TINYINT UNSIGNED NOT NULL COMMENT '扣减类型：1-平台手续费 2-售后退款 3-违规罚款 4-保证金扣除 5-其他',
  deduct_type_label VARCHAR(50) DEFAULT NULL COMMENT '扣减类型标签',
  relate_order_no VARCHAR(32) DEFAULT NULL COMMENT '关联订单/售后/处罚单号',
  relate_id BIGINT UNSIGNED DEFAULT NULL COMMENT '关联ID',
  deduct_amount DECIMAL(12,2) NOT NULL COMMENT '扣减金额',
  deduct_reason VARCHAR(500) NOT NULL COMMENT '扣减原因',
  operator_id BIGINT UNSIGNED DEFAULT NULL COMMENT '操作人ID',
  operator_name VARCHAR(50) DEFAULT NULL COMMENT '操作人姓名',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  KEY idx_settle_apply_id (settle_apply_id),
  KEY idx_merchant_id (merchant_id),
  KEY idx_deduct_type (deduct_type),
  KEY idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='结算扣减明细表';

-- ============================================================
-- 4. 审核日志表
-- ============================================================
DROP TABLE IF EXISTS settle_audit_logs;
CREATE TABLE settle_audit_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  settle_apply_id BIGINT UNSIGNED NOT NULL COMMENT '结算申请单ID',
  merchant_id BIGINT UNSIGNED NOT NULL COMMENT '商家ID',
  audit_action TINYINT UNSIGNED NOT NULL COMMENT '操作：1-提交申请 2-审核通过 3-审核驳回 4-发起打款 5-确认到账 6-打款失败重试 7-取消申请',
  audit_action_label VARCHAR(50) DEFAULT NULL COMMENT '操作标签',
  before_status TINYINT UNSIGNED DEFAULT NULL COMMENT '变更前状态',
  after_status TINYINT UNSIGNED DEFAULT NULL COMMENT '变更后状态',
  audit_detail VARCHAR(1000) DEFAULT NULL COMMENT '操作详情',
  operator_id BIGINT UNSIGNED DEFAULT NULL COMMENT '操作人ID',
  operator_name VARCHAR(50) DEFAULT NULL COMMENT '操作人姓名',
  operator_role VARCHAR(50) DEFAULT NULL COMMENT '操作人角色',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  KEY idx_settle_apply_id (settle_apply_id),
  KEY idx_merchant_id (merchant_id),
  KEY idx_audit_action (audit_action),
  KEY idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='审核日志表';

-- ============================================================
-- 5. 到账凭证表
-- ============================================================
DROP TABLE IF EXISTS settle_transfer_vouchers;
CREATE TABLE settle_transfer_vouchers (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  settle_apply_id BIGINT UNSIGNED NOT NULL COMMENT '结算申请单ID',
  merchant_id BIGINT UNSIGNED NOT NULL COMMENT '商家ID',
  transfer_no VARCHAR(64) NOT NULL COMMENT '银行流水号',
  transfer_amount DECIMAL(14,2) NOT NULL COMMENT '转账金额',
  transfer_time DATETIME NOT NULL COMMENT '转账时间',
  transfer_bank VARCHAR(100) DEFAULT NULL COMMENT '付款银行',
  receive_bank VARCHAR(100) DEFAULT NULL COMMENT '收款银行',
  voucher_url VARCHAR(500) DEFAULT NULL COMMENT '凭证图片URL',
  voucher_status TINYINT UNSIGNED DEFAULT 1 COMMENT '凭证状态：1-有效 2-作废',
  remark VARCHAR(500) DEFAULT NULL COMMENT '备注',
  operator_id BIGINT UNSIGNED DEFAULT NULL COMMENT '操作人ID',
  operator_name VARCHAR(50) DEFAULT NULL COMMENT '操作人姓名',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_settle_apply_id (settle_apply_id),
  KEY idx_merchant_id (merchant_id),
  KEY idx_transfer_no (transfer_no),
  KEY idx_voucher_status (voucher_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='到账凭证表';
