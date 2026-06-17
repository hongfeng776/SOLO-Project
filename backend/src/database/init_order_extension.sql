-- 订单功能扩展表初始化脚本
-- 创建时间: 2026-06-16
-- 说明: 订单表扩展字段、异常工单、支付流水、商品快照、商家接单记录

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

USE annotation_db;

-- ============================================
-- 1. 扩展订单表 orders 添加新字段
-- ============================================
ALTER TABLE `orders` 
ADD COLUMN `merchant_id` BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '商家ID' AFTER `pay_amount`,
ADD COLUMN `pay_type` TINYINT UNSIGNED DEFAULT 0 COMMENT '支付方式：0-未知 1-微信支付 2-支付宝 3-银行卡' AFTER `pay_status`,
ADD COLUMN `receiver_name` VARCHAR(50) DEFAULT NULL COMMENT '收货人姓名' AFTER `pay_type`,
ADD COLUMN `receiver_phone` VARCHAR(20) DEFAULT NULL COMMENT '收货人电话' AFTER `receiver_name`,
ADD COLUMN `receiver_province` VARCHAR(50) DEFAULT NULL COMMENT '收货省份' AFTER `receiver_phone`,
ADD COLUMN `receiver_city` VARCHAR(50) DEFAULT NULL COMMENT '收货城市' AFTER `receiver_province`,
ADD COLUMN `receiver_district` VARCHAR(50) DEFAULT NULL COMMENT '收货区县' AFTER `receiver_city`,
ADD COLUMN `receiver_address` VARCHAR(255) DEFAULT NULL COMMENT '详细地址' AFTER `receiver_district`,
ADD COLUMN `freight_amount` DECIMAL(10,2) DEFAULT 0.00 COMMENT '运费金额' AFTER `receiver_address`,
ADD COLUMN `discount_amount` DECIMAL(10,2) DEFAULT 0.00 COMMENT '优惠金额' AFTER `freight_amount`,
ADD COLUMN `remark` VARCHAR(500) DEFAULT NULL COMMENT '订单备注' AFTER `discount_amount`,
ADD COLUMN `is_exception` TINYINT UNSIGNED DEFAULT 0 COMMENT '是否异常：0-否 1-是' AFTER `remark`,
ADD COLUMN `exception_reason` TEXT DEFAULT NULL COMMENT '异常原因' AFTER `is_exception`,
ADD COLUMN `exception_fields` JSON DEFAULT NULL COMMENT '异常字段列表' AFTER `exception_reason`,
ADD COLUMN `is_archived` TINYINT UNSIGNED DEFAULT 0 COMMENT '是否已归档：0-否 1-是' AFTER `exception_fields`,
ADD COLUMN `logistics_company` VARCHAR(50) DEFAULT NULL COMMENT '物流公司' AFTER `is_archived`,
ADD COLUMN `logistics_no` VARCHAR(50) DEFAULT NULL COMMENT '物流单号' AFTER `logistics_company`,
ADD INDEX `idx_merchant_id` (`merchant_id`),
ADD INDEX `idx_pay_type` (`pay_type`),
ADD INDEX `idx_is_exception` (`is_exception`),
ADD INDEX `idx_is_archived` (`is_archived`);

-- ============================================
-- 2. 异常工单表 order_exceptions
-- ============================================
DROP TABLE IF EXISTS `order_exceptions`;
CREATE TABLE `order_exceptions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `order_id` BIGINT UNSIGNED NOT NULL COMMENT '订单ID',
  `order_no` VARCHAR(32) NOT NULL COMMENT '订单号',
  `type` TINYINT UNSIGNED NOT NULL COMMENT '异常类型：1-支付状态异常 2-库存不足 3-商家无权限 4-物流不支持 5-重复订单 6-金额异常 7-其他',
  `reason` TEXT DEFAULT NULL COMMENT '异常原因',
  `fields` JSON DEFAULT NULL COMMENT '异常字段列表',
  `status` TINYINT UNSIGNED DEFAULT 0 COMMENT '处理状态：0-待处理 1-处理中 2-已处理 3-已忽略',
  `handler_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '处理人ID',
  `handle_time` DATETIME DEFAULT NULL COMMENT '处理时间',
  `handle_remark` TEXT DEFAULT NULL COMMENT '处理备注',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  INDEX `idx_order_id` (`order_id`),
  UNIQUE KEY `uk_order_no` (`order_no`),
  INDEX `idx_type` (`type`),
  INDEX `idx_status` (`status`),
  INDEX `idx_handler` (`handler_id`),
  INDEX `idx_created_at` (`created_at`),
  INDEX `idx_handle_time` (`handle_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='异常工单表';

-- ============================================
-- 3. 支付流水表 payment_flows
-- ============================================
DROP TABLE IF EXISTS `payment_flows`;
CREATE TABLE `payment_flows` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `flow_no` VARCHAR(32) NOT NULL COMMENT '流水号',
  `order_id` BIGINT UNSIGNED NOT NULL COMMENT '订单ID',
  `order_no` VARCHAR(32) NOT NULL COMMENT '订单号',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `amount` DECIMAL(10,2) NOT NULL COMMENT '金额',
  `pay_type` TINYINT UNSIGNED NOT NULL COMMENT '支付方式：1-微信支付 2-支付宝 3-银行卡',
  `pay_status` TINYINT UNSIGNED DEFAULT 0 COMMENT '支付状态：0-待支付 1-支付成功 2-支付失败 3-已退款',
  `transaction_id` VARCHAR(64) DEFAULT NULL COMMENT '第三方交易号',
  `pay_time` DATETIME DEFAULT NULL COMMENT '支付时间',
  `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_flow_no` (`flow_no`),
  INDEX `idx_order_id` (`order_id`),
  INDEX `idx_order_no` (`order_no`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_pay_status` (`pay_status`),
  INDEX `idx_transaction_id` (`transaction_id`),
  INDEX `idx_pay_time` (`pay_time`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='支付流水表';

-- ============================================
-- 4. 商品快照表 goods_snapshots
-- ============================================
DROP TABLE IF EXISTS `goods_snapshots`;
CREATE TABLE `goods_snapshots` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `snapshot_no` VARCHAR(32) NOT NULL COMMENT '快照编号',
  `order_id` BIGINT UNSIGNED NOT NULL COMMENT '订单ID',
  `goods_id` BIGINT UNSIGNED NOT NULL COMMENT '商品ID',
  `sku_code` VARCHAR(100) NOT NULL COMMENT '商品编码',
  `name` VARCHAR(255) NOT NULL COMMENT '商品名称',
  `category_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '分类ID',
  `brand_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '品牌ID',
  `price` DECIMAL(10,2) NOT NULL COMMENT '售价',
  `original_price` DECIMAL(10,2) DEFAULT NULL COMMENT '原价',
  `stock` INT UNSIGNED DEFAULT NULL COMMENT '当时库存',
  `cover_image` VARCHAR(255) DEFAULT NULL COMMENT '封面图',
  `description` TEXT DEFAULT NULL COMMENT '商品描述',
  `merchant_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '商家ID',
  `spec_info` VARCHAR(255) DEFAULT NULL COMMENT '规格信息',
  `snapshot_data` JSON DEFAULT NULL COMMENT '完整快照数据',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_snapshot_no` (`snapshot_no`),
  INDEX `idx_order_id` (`order_id`),
  INDEX `idx_goods_id` (`goods_id`),
  INDEX `idx_merchant_id` (`merchant_id`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商品快照表';

-- ============================================
-- 5. 商家接单记录表 merchant_order_records
-- ============================================
DROP TABLE IF EXISTS `merchant_order_records`;
CREATE TABLE `merchant_order_records` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `order_id` BIGINT UNSIGNED NOT NULL COMMENT '订单ID',
  `order_no` VARCHAR(32) NOT NULL COMMENT '订单号',
  `merchant_id` BIGINT UNSIGNED NOT NULL COMMENT '商家ID',
  `merchant_name` VARCHAR(255) NOT NULL COMMENT '商家名称',
  `operator_id` BIGINT UNSIGNED NOT NULL COMMENT '操作人ID',
  `operator_name` VARCHAR(50) NOT NULL COMMENT '操作人姓名',
  `action` TINYINT UNSIGNED NOT NULL COMMENT '操作类型：1-接单 2-拒单 3-发货 4-取消',
  `reason` VARCHAR(500) DEFAULT NULL COMMENT '操作原因',
  `accept_time` DATETIME DEFAULT NULL COMMENT '接单时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  INDEX `idx_order_id` (`order_id`),
  INDEX `idx_merchant_id` (`merchant_id`),
  INDEX `idx_operator_id` (`operator_id`),
  INDEX `idx_action` (`action`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商家接单记录表';

SET FOREIGN_KEY_CHECKS = 1;
