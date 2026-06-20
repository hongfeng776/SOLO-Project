-- =============================================
-- 营销活动商品准入管控 数据库扩展脚本
-- =============================================

-- 1. 扩展 marketing_products 表，增加准入状态相关字段
ALTER TABLE `marketing_products`
ADD COLUMN `admission_status` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '准入状态：0-报名审核中 1-准入通过 2-准入驳回 3-活动下架' AFTER `status`,
ADD COLUMN `audit_user_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '审核人ID' AFTER `admission_status`,
ADD COLUMN `audit_time` DATETIME DEFAULT NULL COMMENT '审核时间' AFTER `audit_user_id`,
ADD COLUMN `audit_remark` VARCHAR(500) DEFAULT NULL COMMENT '审核备注' AFTER `audit_time`,
ADD COLUMN `apply_time` DATETIME DEFAULT NULL COMMENT '报名时间' AFTER `audit_remark`,
ADD COLUMN `compliance_rating` TINYINT UNSIGNED DEFAULT 1 COMMENT '商品合规评级快照：1-A 2-B 3-C 4-D' AFTER `apply_time`,
ADD COLUMN `merchant_credit_score` INT UNSIGNED DEFAULT 100 COMMENT '商家信用分快照' AFTER `compliance_rating`,
ADD INDEX `idx_admission_status` (`admission_status`),
ADD INDEX `idx_marketing_admission` (`marketing_id`, `admission_status`);

-- 2. 商品准入审核日志表
CREATE TABLE IF NOT EXISTS `marketing_product_admission_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `marketing_product_id` BIGINT UNSIGNED NOT NULL COMMENT '活动商品ID',
  `marketing_id` BIGINT UNSIGNED NOT NULL COMMENT '营销活动ID',
  `goods_id` BIGINT UNSIGNED NOT NULL COMMENT '商品ID',
  `operator_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '操作人ID',
  `operator_type` TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '操作人类型：1-系统 2-管理员 3-商家',
  `operator_name` VARCHAR(50) DEFAULT NULL COMMENT '操作人姓名',
  `action` VARCHAR(50) NOT NULL COMMENT '操作动作：apply-报名 audit_pass-审核通过 audit_reject-审核驳回 offline-下架 online-上架 rule_match-规则匹配',
  `old_status` TINYINT UNSIGNED DEFAULT NULL COMMENT '原准入状态',
  `new_status` TINYINT UNSIGNED DEFAULT NULL COMMENT '新准入状态',
  `field_name` VARCHAR(100) DEFAULT NULL COMMENT '变更字段',
  `old_value` TEXT DEFAULT NULL COMMENT '原值',
  `new_value` TEXT DEFAULT NULL COMMENT '新值',
  `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注/原因',
  `rule_match_detail` JSON DEFAULT NULL COMMENT '规则匹配明细',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  INDEX `idx_marketing_product` (`marketing_product_id`),
  INDEX `idx_marketing_id` (`marketing_id`),
  INDEX `idx_goods_id` (`goods_id`),
  INDEX `idx_action` (`action`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商品准入审核日志表';

-- 3. 商品准入规则配置表
CREATE TABLE IF NOT EXISTS `marketing_admission_rules` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `marketing_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '营销活动ID，为空则为全局规则',
  `marketing_type` TINYINT UNSIGNED DEFAULT NULL COMMENT '活动类型，为空则为全局规则',
  `rule_name` VARCHAR(100) NOT NULL COMMENT '规则名称',
  `rule_type` VARCHAR(50) NOT NULL COMMENT '规则类型：compliance_rating-商品评级 stock-库存 violation-违规记录 merchant_credit-商家信用 category-类目匹配 price_range-价格区间',
  `min_compliance_rating` TINYINT UNSIGNED DEFAULT NULL COMMENT '最低合规评级：1-A 2-B 3-C 4-D',
  `min_stock` INT UNSIGNED DEFAULT NULL COMMENT '最低库存数量',
  `max_violation_count` INT UNSIGNED DEFAULT 0 COMMENT '最大违规次数',
  `min_merchant_credit` INT UNSIGNED DEFAULT 60 COMMENT '最低商家信用分',
  `min_shop_level` TINYINT UNSIGNED DEFAULT 1 COMMENT '最低店铺等级：1-新店 2-铜牌 3-银牌 4-金牌 5-钻石',
  `category_ids` VARCHAR(500) DEFAULT NULL COMMENT '允许的类目ID列表，逗号分隔',
  `min_price` DECIMAL(10,2) DEFAULT NULL COMMENT '最低价格',
  `max_price` DECIMAL(10,2) DEFAULT NULL COMMENT '最高价格',
  `block_cross_category` TINYINT UNSIGNED DEFAULT 1 COMMENT '是否禁止跨类目报名：0-否 1-是',
  `status` TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '状态：0-禁用 1-启用',
  `sort_order` INT UNSIGNED DEFAULT 0 COMMENT '排序',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  INDEX `idx_marketing_id` (`marketing_id`),
  INDEX `idx_marketing_type` (`marketing_type`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商品准入规则配置表';

-- 4. 插入初始准入规则数据（全局规则）
INSERT INTO `marketing_admission_rules`
  (`rule_name`, `rule_type`, `min_compliance_rating`, `min_stock`, `max_violation_count`, `min_merchant_credit`, `min_shop_level`, `block_cross_category`, `status`, `sort_order`)
VALUES
  ('商品评级准入规则', 'compliance_rating', 3, NULL, NULL, NULL, NULL, 1, 1, 10),
  ('库存准入规则', 'stock', NULL, 100, NULL, NULL, NULL, 1, 1, 20),
  ('违规记录准入规则', 'violation', NULL, NULL, 3, NULL, NULL, 1, 1, 30),
  ('商家信用准入规则', 'merchant_credit', NULL, NULL, NULL, 60, 2, 1, 1, 40),
  ('类目匹配准入规则', 'category_match', NULL, NULL, NULL, NULL, NULL, 1, 1, 50);

-- 5. 为已有活动商品设置默认准入状态
UPDATE `marketing_products` SET `admission_status` = 1 WHERE `status` = 1;
UPDATE `marketing_products` SET `admission_status` = 3 WHERE `status` = 0;
UPDATE `marketing_products` SET `apply_time` = `created_at` WHERE `apply_time` IS NULL;
