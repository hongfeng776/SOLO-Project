-- ============================================
-- 订单支付流程管控 - 数据库扩展脚本
-- ============================================

-- 1. 为 payment_flow 表添加新字段
ALTER TABLE `payment_flow`
ADD COLUMN `order_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT '订单金额' AFTER `amount`,
ADD COLUMN `diff_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT '差异金额' AFTER `order_amount`,
ADD COLUMN `pay_scenario` TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '支付场景：1-全额支付 2-部分支付 3-退款后支付' AFTER `pay_type`,
ADD COLUMN `reconcile_status` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '对账状态：0-待对账 1-对账中 2-对账通过 3-对账异常' AFTER `pay_status`,
ADD COLUMN `reconcile_time` DATETIME NULL COMMENT '对账时间' AFTER `reconcile_status`,
ADD COLUMN `reconcile_by` INT UNSIGNED NULL COMMENT '对账人ID' AFTER `reconcile_time`,
ADD COLUMN `reconcile_remark` VARCHAR(500) NULL COMMENT '对账备注' AFTER `reconcile_by`,
ADD COLUMN `settle_status` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '结算状态：0-待结算 1-已结算 2-结算异常' AFTER `reconcile_remark`,
ADD COLUMN `settle_time` DATETIME NULL COMMENT '结算时间' AFTER `settle_status`,
ADD COLUMN `settle_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00 COMMENT '结算金额' AFTER `settle_time`,
ADD COLUMN `expire_time` DATETIME NULL COMMENT '支付时效过期时间' AFTER `settle_amount`,
ADD COLUMN `channel_status` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '支付通道状态：0-正常 1-已关闭' AFTER `expire_time`,
ADD COLUMN `risk_flag` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '风控标记：0-正常 1-低风险 2-中风险 3-高风险 4-已拦截' AFTER `channel_status`,
ADD COLUMN `risk_reason` VARCHAR(500) NULL COMMENT '风控原因' AFTER `risk_flag`,
MODIFY COLUMN `remark` VARCHAR(1000) NULL COMMENT '备注';

-- 2. 为 user 表添加积分字段
ALTER TABLE `user`
ADD COLUMN `points` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '用户积分' AFTER `status`,
ADD COLUMN `total_pay_points` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '累计支付积分' AFTER `points`;

-- 3. 为 merchant 表添加结算相关字段
ALTER TABLE `merchant`
ADD COLUMN `pending_settle_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00 COMMENT '待结算金额' AFTER `status`,
ADD COLUMN `total_settle_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00 COMMENT '累计已结算金额' AFTER `pending_settle_amount`,
ADD COLUMN `total_sales_count` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '累计商品销量' AFTER `total_settle_amount`;

-- 4. 为 goods 表添加销售数量字段
ALTER TABLE `goods`
ADD COLUMN `sales_count` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '销售数量' AFTER `stock`;

-- ============================================
-- 5. 创建支付对账记录表
-- ============================================
CREATE TABLE IF NOT EXISTS `payment_reconcile` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `reconcile_no` VARCHAR(32) NOT NULL COMMENT '对账单号',
  `flow_id` BIGINT UNSIGNED NOT NULL COMMENT '支付流水ID',
  `flow_no` VARCHAR(32) NOT NULL COMMENT '支付流水号',
  `order_id` BIGINT UNSIGNED NOT NULL COMMENT '订单ID',
  `order_no` VARCHAR(32) NOT NULL COMMENT '订单编号',
  `order_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT '订单金额',
  `pay_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT '支付金额',
  `diff_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT '差异金额',
  `status` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '对账状态：0-待对账 1-对账中 2-对账通过 3-对账异常',
  `reconcile_time` DATETIME NULL COMMENT '对账时间',
  `reconcile_by` INT UNSIGNED NULL COMMENT '对账人ID',
  `reconcile_name` VARCHAR(50) NULL COMMENT '对账人姓名',
  `remark` VARCHAR(500) NULL COMMENT '备注',
  `exception_remark` VARCHAR(500) NULL COMMENT '异常说明',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_reconcile_no` (`reconcile_no`),
  KEY `idx_flow_id` (`flow_id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='支付对账记录表';

-- ============================================
-- 6. 创建资金结算记录表
-- ============================================
CREATE TABLE IF NOT EXISTS `fund_settlement` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `settle_no` VARCHAR(32) NOT NULL COMMENT '结算单号',
  `flow_id` BIGINT UNSIGNED NOT NULL COMMENT '支付流水ID',
  `flow_no` VARCHAR(32) NOT NULL COMMENT '支付流水号',
  `merchant_id` BIGINT UNSIGNED NOT NULL COMMENT '商家ID',
  `merchant_name` VARCHAR(100) NOT NULL COMMENT '商家名称',
  `order_id` BIGINT UNSIGNED NOT NULL COMMENT '订单ID',
  `order_no` VARCHAR(32) NOT NULL COMMENT '订单编号',
  `order_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT '订单金额',
  `pay_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT '支付金额',
  `platform_fee` DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT '平台手续费',
  `settle_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00 COMMENT '结算金额',
  `status` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '结算状态：0-待结算 1-已结算 2-结算异常',
  `settle_time` DATETIME NULL COMMENT '结算时间',
  `operator_id` INT UNSIGNED NULL COMMENT '操作人ID',
  `operator_name` VARCHAR(50) NULL COMMENT '操作人姓名',
  `remark` VARCHAR(500) NULL COMMENT '备注',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_settle_no` (`settle_no`),
  KEY `idx_flow_id` (`flow_id`),
  KEY `idx_merchant_id` (`merchant_id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='资金结算记录表';

-- ============================================
-- 7. 为现有支付流水数据补充默认值
-- ============================================
UPDATE `payment_flow` SET
  `order_amount` = `amount`,
  `pay_scenario` = 1,
  `expire_time` = DATE_ADD(`created_at`, INTERVAL 30 MINUTE)
WHERE `order_amount` = 0;

-- ============================================
-- 8. 插入测试数据
-- ============================================

-- 插入支付对账测试数据
INSERT INTO `payment_reconcile` (`reconcile_no`, `flow_id`, `flow_no`, `order_id`, `order_no`, `order_amount`, `pay_amount`, `diff_amount`, `status`, `reconcile_time`, `reconcile_by`, `reconcile_name`, `remark`) VALUES
('RC202501010001', 1, 'PF202501010001', 1, 'ORD202501010001', 299.00, 299.00, 0.00, 2, '2025-01-01 10:30:00', 1, '财务管理员', '对账正常'),
('RC202501010002', 2, 'PF202501010002', 2, 'ORD202501010002', 599.00, 599.00, 0.00, 2, '2025-01-01 11:00:00', 1, '财务管理员', '对账正常'),
('RC202501010003', 3, 'PF202501010003', 3, 'ORD202501010003', 1299.00, 1200.00, 99.00, 3, '2025-01-01 11:30:00', 1, '财务管理员', '支付金额与订单金额不一致', '用户使用优惠券抵扣99元，需核实');

-- 插入资金结算测试数据
INSERT INTO `fund_settlement` (`settle_no`, `flow_id`, `flow_no`, `merchant_id`, `merchant_name`, `order_id`, `order_no`, `order_amount`, `pay_amount`, `platform_fee`, `settle_amount`, `status`, `settle_time`, `operator_id`, `operator_name`, `remark`) VALUES
('ST202501010001', 1, 'PF202501010001', 1, '优品数码旗舰店', 1, 'ORD202501010001', 299.00, 299.00, 5.98, 293.02, 1, '2025-01-02 09:00:00', 1, '财务管理员', 'T+1自动结算'),
('ST202501010002', 2, 'PF202501010002', 2, '时尚服饰店', 2, 'ORD202501010002', 599.00, 599.00, 11.98, 587.02, 1, '2025-01-02 09:00:00', 1, '财务管理员', 'T+1自动结算'),
('ST202501010003', 4, 'PF202501010004', 1, '优品数码旗舰店', 4, 'ORD202501010004', 1999.00, 1999.00, 39.98, 1959.02, 0, NULL, NULL, NULL, '待结算');

-- 更新部分支付流水的风控和对账状态用于测试
UPDATE `payment_flow` SET
  `risk_flag` = 2,
  `risk_reason` = '支付金额与历史消费习惯差异较大',
  `reconcile_status` = 0
WHERE `id` = 5;

UPDATE `payment_flow` SET
  `risk_flag` = 4,
  `risk_reason` = '检测到重复支付流水，已自动拦截',
  `reconcile_status` = 3,
  `channel_status` = 1
WHERE `id` = 6;

UPDATE `payment_flow` SET
  `reconcile_status` = 1,
  `reconcile_time` = NOW()
WHERE `id` = 7;

-- 更新用户积分测试数据
UPDATE `user` SET `points` = 1250, `total_pay_points` = 2580 WHERE `id` = 1;
UPDATE `user` SET `points` = 890, `total_pay_points` = 1890 WHERE `id` = 2;
UPDATE `user` SET `points` = 3200, `total_pay_points` = 5600 WHERE `id` = 3;

-- 更新商家结算数据测试
UPDATE `merchant` SET `pending_settle_amount` = 5680.50, `total_settle_amount` = 125600.00, `total_sales_count` = 1250 WHERE `id` = 1;
UPDATE `merchant` SET `pending_settle_amount` = 3200.00, `total_settle_amount` = 89600.00, `total_sales_count` = 890 WHERE `id` = 2;

-- 更新商品销量测试数据
UPDATE `goods` SET `sales_count` = 156 WHERE `id` = 1;
UPDATE `goods` SET `sales_count` = 89 WHERE `id` = 2;
UPDATE `goods` SET `sales_count` = 234 WHERE `id` = 3;

-- ============================================
-- 脚本执行完成
-- ============================================
