-- ============================================
-- 订单售后终止管控 - 数据库扩展脚本
-- ============================================

-- 1. 为 orders 表添加售后/终止/退款相关字段
ALTER TABLE `orders`
ADD COLUMN `after_sale_status` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '售后状态：0-无售后 1-售后中 2-售后完成 3-售后拒绝' AFTER `actual_freight`,
ADD COLUMN `after_sale_count` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '售后申请次数' AFTER `after_sale_status`,
ADD COLUMN `after_sale_deadline` DATETIME NULL COMMENT '售后时效截止时间' AFTER `after_sale_count`,
ADD COLUMN `terminate_type` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '终止类型：0-未终止 1-主动取消 2-超时取消 3-违规取消 4-售后终止' AFTER `after_sale_deadline`,
ADD COLUMN `terminated_at` DATETIME NULL COMMENT '终止时间' AFTER `terminate_type`,
ADD COLUMN `terminate_reason` VARCHAR(500) NULL COMMENT '终止原因' AFTER `terminated_at`,
ADD COLUMN `terminate_operator_id` BIGINT UNSIGNED NULL COMMENT '终止操作人ID' AFTER `terminate_reason`,
ADD COLUMN `terminate_operator_name` VARCHAR(50) NULL COMMENT '终止操作人姓名' AFTER `terminate_operator_id`,
ADD COLUMN `refund_status` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '退款状态：0-无退款 1-退款中 2-已退款 3-退款拒绝' AFTER `terminate_operator_name`,
ADD COLUMN `refund_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT '退款金额' AFTER `refund_status`,
ADD COLUMN `refund_time` DATETIME NULL COMMENT '退款时间' AFTER `refund_amount`;

-- 2. 为 user 表添加信用相关字段
ALTER TABLE `user`
ADD COLUMN `credit_level` TINYINT UNSIGNED NOT NULL DEFAULT 3 COMMENT '信用等级：1-差 2-一般 3-良好 4-优秀 5-卓越' AFTER `total_pay_points`,
ADD COLUMN `credit_score` INT NOT NULL DEFAULT 100 COMMENT '信用分' AFTER `credit_level`,
ADD COLUMN `after_sale_count` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '售后申请次数' AFTER `credit_score`,
ADD COLUMN `violation_count` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '违规售后次数' AFTER `after_sale_count`;

-- 3. 为 merchant 表添加售后相关字段
ALTER TABLE `merchant`
ADD COLUMN `after_sale_handle_count` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '售后处理次数' AFTER `total_sales_count`,
ADD COLUMN `total_refund_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00 COMMENT '累计退款金额' AFTER `after_sale_handle_count`,
ADD COLUMN `deducted_settle_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00 COMMENT '已扣减结算金额（退款回退）' AFTER `total_refund_amount`;

-- 4. 扩展 after_sales 表字段
ALTER TABLE `after_sales`
ADD COLUMN `after_sale_no` VARCHAR(32) NOT NULL COMMENT '售后单号' AFTER `id`,
ADD COLUMN `order_no` VARCHAR(32) NOT NULL COMMENT '订单编号' AFTER `order_id`,
ADD COLUMN `merchant_id` BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '商家ID' AFTER `user_id`,
ADD COLUMN `merchant_name` VARCHAR(100) NULL COMMENT '商家名称' AFTER `merchant_id`,
ADD UNIQUE KEY `uk_after_sale_no` (`after_sale_no`),
MODIFY COLUMN `type` TINYINT UNSIGNED COMMENT '售后类型：1-退款 2-退货退款 3-换货 4-维修',
MODIFY COLUMN `status` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '状态：0-待审核 1-审核通过 2-处理中 3-已完成 4-已拒绝 5-已取消 6-已关闭',
ADD COLUMN `order_pay_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT '订单实付金额' AFTER `amount`,
ADD COLUMN `apply_count` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT '申请次数' AFTER `order_pay_amount`,
ADD COLUMN `cancel_scene` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '取消场景：0-非取消 1-主动取消 2-超时取消 3-违规取消' AFTER `apply_count`,
ADD COLUMN `items` JSON NULL COMMENT '售后商品明细' AFTER `cancel_scene`,
ADD COLUMN `evidence_images` VARCHAR(500) NULL COMMENT '凭证图片' AFTER `items`,
ADD COLUMN `deadline` DATETIME NULL COMMENT '售后时效截止时间' AFTER `evidence_images`,
ADD COLUMN `stock_rollback_status` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '库存回退状态：0-未回退 1-已回退 2-回退失败' AFTER `deadline`,
ADD COLUMN `settle_deduct_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00 COMMENT '商家结算扣减金额' AFTER `stock_rollback_status`,
ADD COLUMN `points_rollback` DECIMAL(10, 2) NOT NULL DEFAULT 0 COMMENT '用户积分回退数量' AFTER `settle_deduct_amount`,
ADD COLUMN `handle_remark` VARCHAR(500) NULL COMMENT '处理备注' AFTER `points_rollback`,
ADD COLUMN `audited_at` DATETIME NULL COMMENT '审核时间' AFTER `handle_remark`,
ADD COLUMN `completed_at` DATETIME NULL COMMENT '完成时间' AFTER `audited_at`,
ADD COLUMN `operator_id` BIGINT UNSIGNED NULL COMMENT '操作人ID' AFTER `completed_at`,
ADD COLUMN `operator_name` VARCHAR(50) NULL COMMENT '操作人姓名' AFTER `operator_id`,
ADD COLUMN `remark` VARCHAR(500) NULL COMMENT '备注' AFTER `operator_name`,
ADD KEY `idx_after_sale_no` (`after_sale_no`),
ADD KEY `idx_order_no` (`order_no`),
ADD KEY `idx_merchant_id` (`merchant_id`),
ADD KEY `idx_status` (`status`),
ADD KEY `idx_deadline` (`deadline`);

-- 为已有售后数据补全售后单号
UPDATE `after_sales` SET
  `after_sale_no` = CONCAT('AS', DATE_FORMAT(`created_at`, '%Y%m%d'), LPAD(`id`, 6, '0')),
  `order_no` = (SELECT `order_no` FROM `orders` WHERE `orders`.`id` = `after_sales`.`order_id` LIMIT 1),
  `merchant_id` = COALESCE((SELECT `merchant_id` FROM `orders` WHERE `orders`.`id` = `after_sales`.`order_id` LIMIT 1), 0),
  `deadline` = DATE_ADD(`created_at`, INTERVAL 7 DAY)
WHERE `after_sale_no` IS NULL OR `after_sale_no` = '';

-- ============================================
-- 5. 创建售后台账表
-- ============================================
CREATE TABLE IF NOT EXISTS `after_sale_ledgers` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `ledger_no` VARCHAR(32) NOT NULL COMMENT '台账编号',
  `after_sale_id` BIGINT UNSIGNED NOT NULL COMMENT '售后记录ID',
  `after_sale_no` VARCHAR(32) NOT NULL COMMENT '售后单号',
  `order_id` BIGINT UNSIGNED NOT NULL COMMENT '订单ID',
  `order_no` VARCHAR(32) NOT NULL COMMENT '订单编号',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `merchant_id` BIGINT UNSIGNED NOT NULL COMMENT '商家ID',
  `merchant_name` VARCHAR(100) NULL COMMENT '商家名称',
  `after_sale_type` TINYINT UNSIGNED NOT NULL COMMENT '售后类型',
  `cancel_scene` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '取消场景',
  `refund_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT '退款金额',
  `stock_rollback_items` TEXT NULL COMMENT '库存回退明细(JSON)',
  `stock_rollback_status` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '库存回退状态',
  `settle_deduct_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00 COMMENT '商家结算扣减金额',
  `points_rollback` DECIMAL(10, 2) NOT NULL DEFAULT 0 COMMENT '用户积分回退',
  `order_final_status` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '订单终态',
  `process_result` VARCHAR(500) NULL COMMENT '处理结果',
  `operator_id` BIGINT UNSIGNED NULL COMMENT '操作人ID',
  `operator_name` VARCHAR(50) NULL COMMENT '操作人姓名',
  `remark` VARCHAR(500) NULL COMMENT '备注',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_ledger_no` (`ledger_no`),
  KEY `idx_after_sale_id` (`after_sale_id`),
  KEY `idx_after_sale_no` (`after_sale_no`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_merchant_id` (`merchant_id`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='售后台账表';

-- ============================================
-- 6. 创建售后操作日志表
-- ============================================
CREATE TABLE IF NOT EXISTS `after_sale_operation_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `after_sale_id` BIGINT UNSIGNED NOT NULL COMMENT '售后记录ID',
  `after_sale_no` VARCHAR(32) NOT NULL COMMENT '售后单号',
  `order_id` BIGINT UNSIGNED NOT NULL COMMENT '订单ID',
  `order_no` VARCHAR(32) NOT NULL COMMENT '订单编号',
  `action` VARCHAR(50) NOT NULL COMMENT '操作类型',
  `action_desc` VARCHAR(200) NOT NULL COMMENT '操作描述',
  `old_status` TINYINT UNSIGNED NULL COMMENT '变更前状态',
  `new_status` TINYINT UNSIGNED NULL COMMENT '变更后状态',
  `operator_id` BIGINT UNSIGNED NULL COMMENT '操作人ID',
  `operator_name` VARCHAR(50) NULL COMMENT '操作人姓名',
  `operator_type` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '操作人类型：0-用户 1-管理员 2-系统',
  `detail` TEXT NULL COMMENT '操作详情(JSON)',
  `fund_change` TEXT NULL COMMENT '资金变动(JSON)',
  `stock_change` TEXT NULL COMMENT '库存变动(JSON)',
  `remark` VARCHAR(500) NULL COMMENT '备注',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_after_sale_id` (`after_sale_id`),
  KEY `idx_after_sale_no` (`after_sale_no`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_action` (`action`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='售后操作日志表';

-- ============================================
-- 7. 插入测试数据
-- ============================================

-- 更新用户信用测试数据
UPDATE `user` SET `credit_level` = 4, `credit_score` = 85, `after_sale_count` = 2, `violation_count` = 0 WHERE `id` = 1;
UPDATE `user` SET `credit_level` = 3, `credit_score` = 72, `after_sale_count` = 1, `violation_count` = 0 WHERE `id` = 2;
UPDATE `user` SET `credit_level` = 5, `credit_score` = 96, `after_sale_count` = 0, `violation_count` = 0 WHERE `id` = 3;

-- 更新商家售后测试数据
UPDATE `merchant` SET `after_sale_handle_count` = 5, `total_refund_amount` = 890.00, `deducted_settle_amount` = 890.00 WHERE `id` = 1;
UPDATE `merchant` SET `after_sale_handle_count` = 2, `total_refund_amount` = 299.00, `deducted_settle_amount` = 299.00 WHERE `id` = 2;

-- 为已有订单添加售后时效截止时间（已完成订单，支付后7天）
UPDATE `orders` SET
  `after_sale_deadline` = DATE_ADD(COALESCE(`pay_time`, `created_at`), INTERVAL 7 DAY)
WHERE `status` = 3 AND `after_sale_deadline` IS NULL AND `pay_status` = 1;

-- 插入售后测试数据
INSERT INTO `after_sales` (`after_sale_no`, `order_id`, `order_no`, `user_id`, `merchant_id`, `merchant_name`, `type`, `status`, `reason`, `amount`, `order_pay_amount`, `apply_count`, `cancel_scene`, `deadline`, `stock_rollback_status`, `settle_deduct_amount`, `points_rollback`, `handle_remark`, `audited_at`, `completed_at`, `operator_id`, `operator_name`, `remark`, `created_at`, `updated_at`) VALUES
('AS202501020001', 1, 'ORD202501010001', 1, 1, '优品数码旗舰店', 1, 3, '商品质量问题，申请退款', 299.00, 299.00, 1, 0, '2025-01-08 10:00:00', 1, 299.00, 299, '审核通过，全额退款', '2025-01-02 14:00:00', '2025-01-03 09:00:00', 1, '系统管理员', '正常退款流程', '2025-01-02 10:00:00', '2025-01-03 09:00:00'),
('AS202501020002', 2, 'ORD202501010002', 2, 2, '时尚服饰店', 2, 0, '尺码不符，申请退货退款', 599.00, 599.00, 1, 0, '2025-01-08 11:00:00', 0, 0, 0, NULL, NULL, NULL, NULL, NULL, '待审核', '2025-01-02 11:00:00', '2025-01-02 11:00:00'),
('AS202501030001', 3, 'ORD202501010003', 3, 1, '优品数码旗舰店', 3, 4, '商品有划痕，申请换货', 1299.00, 1299.00, 1, 0, '2025-01-09 14:00:00', 0, 0, 0, '未提供有效凭证，拒绝换货申请', '2025-01-03 16:00:00', NULL, 1, '系统管理员', '拒绝换货', '2025-01-03 14:00:00', '2025-01-03 16:00:00'),
('AS202501040001', 5, 'ORD202501010005', 4, 1, '优品数码旗舰店', 1, 2, '收到商品与描述不符', 199.00, 199.00, 2, 0, '2025-01-10 09:00:00', 0, 0, 0, NULL, '2025-01-04 11:00:00', NULL, 1, '系统管理员', '第二次申请', '2025-01-04 09:00:00', '2025-01-04 11:00:00');

-- 更新订单售后状态
UPDATE `orders` SET `after_sale_status` = 2, `after_sale_count` = 1, `refund_status` = 2, `refund_amount` = 299.00, `refund_time` = '2025-01-03 09:00:00' WHERE `id` = 1;
UPDATE `orders` SET `after_sale_status` = 1, `after_sale_count` = 1 WHERE `id` = 2;
UPDATE `orders` SET `after_sale_status` = 3, `after_sale_count` = 1 WHERE `id` = 3;
UPDATE `orders` SET `after_sale_status` = 1, `after_sale_count` = 2 WHERE `id` = 5;

-- 更新部分订单终止状态
UPDATE `orders` SET `terminate_type` = 2, `terminated_at` = '2025-01-01 18:00:00', `terminate_reason` = '超时未支付，自动取消', `terminate_operator_name` = '系统' WHERE `status` = 4 AND `terminate_type` = 0;

-- 插入售后台账测试数据
INSERT INTO `after_sale_ledgers` (`ledger_no`, `after_sale_id`, `after_sale_no`, `order_id`, `order_no`, `user_id`, `merchant_id`, `merchant_name`, `after_sale_type`, `cancel_scene`, `refund_amount`, `stock_rollback_items`, `stock_rollback_status`, `settle_deduct_amount`, `points_rollback`, `order_final_status`, `process_result`, `operator_id`, `operator_name`, `remark`) VALUES
('LD202501030001', 1, 'AS202501020001', 1, 'ORD202501010001', 1, 1, '优品数码旗舰店', 1, 0, 299.00, '[{"goodsId":1,"goodsName":"无线蓝牙耳机","quantity":1,"beforeStock":50,"afterStock":51}]', 1, 299.00, 299, 3, '退款完成，库存已回退，结算已扣减', 1, '系统管理员', '正常退款台账');

-- 插入售后操作日志测试数据
INSERT INTO `after_sale_operation_logs` (`after_sale_id`, `after_sale_no`, `order_id`, `order_no`, `action`, `action_desc`, `old_status`, `new_status`, `operator_id`, `operator_name`, `operator_type`, `detail`, `fund_change`, `stock_change`, `remark`) VALUES
(1, 'AS202501020001', 1, 'ORD202501010001', 'apply', '用户提交售后申请', NULL, 0, 1, '张三', 0, '{"type":1,"reason":"商品质量问题","amount":299}', NULL, NULL, '首次申请'),
(1, 'AS202501020001', 1, 'ORD202501010001', 'audit_pass', '管理员审核通过', 0, 1, 1, '系统管理员', 1, '{"remark":"审核通过，全额退款"}', NULL, NULL, '初审通过'),
(1, 'AS202501020001', 1, 'ORD202501010001', 'process', '开始处理退款', 1, 2, 1, '系统管理员', 1, NULL, NULL, NULL, '处理中'),
(1, 'AS202501020001', 1, 'ORD202501010001', 'stock_rollback', '库存回退', 2, 2, 0, '系统', 2, NULL, NULL, '[{"goodsId":1,"goodsName":"无线蓝牙耳机","quantity":1,"beforeStock":50,"afterStock":51}]', '库存回退成功'),
(1, 'AS202501020001', 1, 'ORD202501010001', 'settle_deduct', '商家结算扣减', 2, 2, 0, '系统', 2, NULL, '{"refundAmount":299,"settleDeductAmount":299,"pointsRollback":299}', NULL, '扣减商家待结算金额'),
(1, 'AS202501020001', 1, 'ORD202501010001', 'points_rollback', '用户积分回退', 2, 2, 0, '系统', 2, NULL, '{"pointsRollback":299}', NULL, '回退用户积分299'),
(1, 'AS202501020001', 1, 'ORD202501010001', 'complete', '售后处理完成', 2, 3, 1, '系统管理员', 1, '{"orderFinalStatus":3}', NULL, NULL, '售后完成');

-- ============================================
-- 脚本执行完成
-- ============================================
