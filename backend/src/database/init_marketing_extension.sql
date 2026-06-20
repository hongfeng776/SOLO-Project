-- 营销活动管理扩展表初始化脚本
-- 创建时间: 2026-06-21
-- 说明: 营销活动日志、参与商品、互斥规则、类目范围、商家资质等扩展表

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

USE annotation_db;

-- ============================================
-- 1. 扩展营销活动表 marketings (增加字段)
-- ============================================
ALTER TABLE `marketings`
ADD COLUMN IF NOT EXISTS `category_ids` varchar(500) DEFAULT NULL COMMENT '适用类目ID，多个用逗号分隔',
ADD COLUMN IF NOT EXISTS `merchant_ids` varchar(500) DEFAULT NULL COMMENT '适用商家ID，多个用逗号分隔',
ADD COLUMN IF NOT EXISTS `discount_type` tinyint unsigned DEFAULT 1 COMMENT '优惠类型：1-满减 2-折扣 3-优惠券',
ADD COLUMN IF NOT EXISTS `min_amount` decimal(10,2) DEFAULT 0.00 COMMENT '最低消费金额',
ADD COLUMN IF NOT EXISTS `max_discount` decimal(10,2) DEFAULT NULL COMMENT '最大优惠金额',
ADD COLUMN IF NOT EXISTS `discount_value` decimal(10,2) DEFAULT NULL COMMENT '优惠值：金额或折扣率',
ADD COLUMN IF NOT EXISTS `total_count` int unsigned DEFAULT 0 COMMENT '发放总数量',
ADD COLUMN IF NOT EXISTS `used_count` int unsigned DEFAULT 0 COMMENT '已使用数量',
ADD COLUMN IF NOT EXISTS `per_user_limit` int unsigned DEFAULT 1 COMMENT '每人限领数量',
ADD COLUMN IF NOT EXISTS `audit_status` tinyint unsigned DEFAULT 0 COMMENT '审核状态：0-待审核 1-已通过 2-已拒绝',
ADD COLUMN IF NOT EXISTS `audit_user_id` bigint unsigned DEFAULT NULL COMMENT '审核人ID',
ADD COLUMN IF NOT EXISTS `audit_time` datetime DEFAULT NULL COMMENT '审核时间',
ADD COLUMN IF NOT EXISTS `audit_remark` varchar(500) DEFAULT NULL COMMENT '审核备注',
ADD COLUMN IF NOT EXISTS `create_user_id` bigint unsigned DEFAULT NULL COMMENT '创建人ID',
ADD COLUMN IF NOT EXISTS `is_violation` tinyint unsigned DEFAULT 0 COMMENT '是否违规：0-否 1-是',
ADD COLUMN IF NOT EXISTS `violation_remark` varchar(500) DEFAULT NULL COMMENT '违规说明',
ADD KEY IF NOT EXISTS `idx_audit_status` (`audit_status`),
ADD KEY IF NOT EXISTS `idx_create_user_id` (`create_user_id`),
ADD KEY IF NOT EXISTS `idx_start_end_time` (`start_time`, `end_time`);

-- ============================================
-- 2. 营销活动日志表 marketing_logs
-- ============================================
DROP TABLE IF EXISTS `marketing_logs`;
CREATE TABLE `marketing_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `marketing_id` bigint unsigned NOT NULL COMMENT '营销活动ID',
  `operator_id` bigint unsigned DEFAULT NULL COMMENT '操作人ID',
  `operator_type` tinyint unsigned NOT NULL COMMENT '操作人类型：0-用户 1-管理员 2-系统',
  `operator_name` varchar(50) DEFAULT NULL COMMENT '操作人名称',
  `action` varchar(50) NOT NULL COMMENT '操作类型：create/update/status_change/audit/violation',
  `field_name` varchar(100) DEFAULT NULL COMMENT '变更字段名',
  `old_value` text COMMENT '变更前值',
  `new_value` text COMMENT '变更后值',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注说明',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_marketing_id` (`marketing_id`),
  KEY `idx_operator` (`operator_id`, `operator_type`),
  KEY `idx_action` (`action`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='营销活动日志表';

-- ============================================
-- 3. 营销活动参与商品表 marketing_products
-- ============================================
DROP TABLE IF EXISTS `marketing_products`;
CREATE TABLE `marketing_products` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `marketing_id` bigint unsigned NOT NULL COMMENT '营销活动ID',
  `goods_id` bigint unsigned NOT NULL COMMENT '商品ID',
  `goods_name` varchar(255) NOT NULL COMMENT '商品名称',
  `category_id` bigint unsigned DEFAULT NULL COMMENT '商品分类ID',
  `merchant_id` bigint unsigned DEFAULT NULL COMMENT '商家ID',
  `original_price` decimal(10,2) DEFAULT NULL COMMENT '商品原价',
  `activity_price` decimal(10,2) DEFAULT NULL COMMENT '活动价格',
  `discount_limit` int unsigned DEFAULT NULL COMMENT '折扣上限',
  `stock` int unsigned DEFAULT 0 COMMENT '活动库存',
  `sold_count` int unsigned DEFAULT 0 COMMENT '已售数量',
  `sort_order` int unsigned DEFAULT 0 COMMENT '排序',
  `status` tinyint unsigned DEFAULT 1 COMMENT '状态：0-下架 1-上架',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_marketing_goods` (`marketing_id`, `goods_id`),
  KEY `idx_marketing_id` (`marketing_id`),
  KEY `idx_goods_id` (`goods_id`),
  KEY `idx_merchant_id` (`merchant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='营销活动参与商品表';

-- ============================================
-- 4. 营销活动互斥规则表 marketing_mutex_rules
-- ============================================
DROP TABLE IF EXISTS `marketing_mutex_rules`;
CREATE TABLE `marketing_mutex_rules` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `type` tinyint unsigned NOT NULL COMMENT '活动类型',
  `mutex_type` tinyint unsigned NOT NULL COMMENT '互斥活动类型',
  `rule_name` varchar(100) NOT NULL COMMENT '规则名称',
  `description` varchar(500) DEFAULT NULL COMMENT '规则描述',
  `status` tinyint unsigned DEFAULT 1 COMMENT '状态：0-禁用 1-启用',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_type_mutex` (`type`, `mutex_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='营销活动互斥规则表';

-- ============================================
-- 5. 营销活动类目范围表 marketing_categories
-- ============================================
DROP TABLE IF EXISTS `marketing_categories`;
CREATE TABLE `marketing_categories` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `marketing_id` bigint unsigned NOT NULL COMMENT '营销活动ID',
  `category_id` bigint unsigned NOT NULL COMMENT '分类ID',
  `category_name` varchar(100) NOT NULL COMMENT '分类名称',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_marketing_category` (`marketing_id`, `category_id`),
  KEY `idx_marketing_id` (`marketing_id`),
  KEY `idx_category_id` (`category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='营销活动类目范围表';

-- ============================================
-- 6. 营销活动商家资质表 marketing_merchant_qualifications
-- ============================================
DROP TABLE IF EXISTS `marketing_merchant_qualifications`;
CREATE TABLE `marketing_merchant_qualifications` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `marketing_id` bigint unsigned NOT NULL COMMENT '营销活动ID',
  `merchant_id` bigint unsigned NOT NULL COMMENT '商家ID',
  `merchant_name` varchar(255) NOT NULL COMMENT '商家名称',
  `qualification_type` varchar(100) DEFAULT NULL COMMENT '资质类型',
  `qualification_status` tinyint unsigned DEFAULT 1 COMMENT '资质状态：0-不合格 1-合格',
  `apply_time` datetime DEFAULT NULL COMMENT '申请时间',
  `audit_time` datetime DEFAULT NULL COMMENT '审核时间',
  `audit_remark` varchar(500) DEFAULT NULL COMMENT '审核备注',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_marketing_merchant` (`marketing_id`, `merchant_id`),
  KEY `idx_marketing_id` (`marketing_id`),
  KEY `idx_merchant_id` (`merchant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='营销活动商家资质表';

-- ============================================
-- 7. 营销活动优惠力度阈值配置表 marketing_discount_thresholds
-- ============================================
DROP TABLE IF EXISTS `marketing_discount_thresholds`;
CREATE TABLE `marketing_discount_thresholds` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `type` tinyint unsigned NOT NULL COMMENT '活动类型',
  `category_id` bigint unsigned DEFAULT NULL COMMENT '适用类目ID，NULL表示所有类目',
  `max_discount_rate` decimal(5,2) DEFAULT NULL COMMENT '最大折扣率(%)',
  `max_discount_amount` decimal(10,2) DEFAULT NULL COMMENT '最大减免金额',
  `min_discount_rate` decimal(5,2) DEFAULT NULL COMMENT '最小折扣率(%)',
  `status` tinyint unsigned DEFAULT 1 COMMENT '状态：0-禁用 1-启用',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_type` (`type`),
  KEY `idx_category` (`category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='营销活动优惠力度阈值配置表';

-- ============================================
-- 初始数据：互斥规则
-- ============================================
INSERT INTO `marketing_mutex_rules` (`type`, `mutex_type`, `rule_name`, `description`, `status`) VALUES
(1, 2, '折扣与满减互斥', '折扣活动与满减活动不可同时参与', 1),
(1, 3, '折扣与优惠券互斥', '折扣活动与优惠券活动不可同时参与', 1),
(2, 3, '满减与优惠券互斥', '满减活动与优惠券活动不可同时参与', 1),
(3, 4, '优惠券与拼团互斥', '优惠券活动与拼团活动不可同时参与', 1);

-- ============================================
-- 初始数据：优惠力度阈值
-- ============================================
INSERT INTO `marketing_discount_thresholds` (`type`, `category_id`, `max_discount_rate`, `max_discount_amount`, `min_discount_rate`, `status`) VALUES
(1, NULL, 90.00, NULL, 10.00, 1),
(2, NULL, NULL, 1000.00, NULL, 1),
(3, NULL, 95.00, 500.00, 5.00, 1),
(4, NULL, 80.00, NULL, 10.00, 1);

SET FOREIGN_KEY_CHECKS = 1;
