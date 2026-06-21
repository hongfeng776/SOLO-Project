-- 营销优惠规则管控扩展表初始化脚本
-- 创建时间: 2026-06-21
-- 说明: 优惠规则表、优惠使用日志表、优惠预算台账表、优惠叠加冲突记录表

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

USE annotation_db;

-- ============================================
-- 1. 营销优惠规则表 marketing_discount_rules
-- ============================================
DROP TABLE IF EXISTS `marketing_discount_rules`;
CREATE TABLE `marketing_discount_rules` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `marketing_id` bigint unsigned NOT NULL COMMENT '所属营销活动ID',
  `rule_name` varchar(100) NOT NULL COMMENT '规则名称',
  `discount_type` tinyint unsigned NOT NULL COMMENT '优惠类型：1-满减 2-折扣 3-优惠券',
  `min_amount` decimal(10,2) DEFAULT 0.00 COMMENT '最低消费金额',
  `discount_value` decimal(10,2) DEFAULT NULL COMMENT '优惠值：满减金额或折扣率(%)',
  `max_discount_amount` decimal(10,2) DEFAULT NULL COMMENT '最大优惠金额',
  `stackable` tinyint unsigned DEFAULT 0 COMMENT '是否可叠加：0-否 1-是',
  `stack_limit` int unsigned DEFAULT 1 COMMENT '叠加上限次数',
  `exclude_rule_ids` varchar(500) DEFAULT NULL COMMENT '互斥规则ID列表，逗号分隔',
  `user_level_min` int unsigned DEFAULT NULL COMMENT '最低用户等级',
  `user_level_max` int unsigned DEFAULT NULL COMMENT '最高用户等级',
  `applicable_category_ids` varchar(500) DEFAULT NULL COMMENT '适用类目ID，逗号分隔',
  `applicable_goods_ids` text COMMENT '适用商品ID，逗号分隔，为空表示全量',
  `exclude_goods_ids` text COMMENT '排除商品ID，逗号分隔',
  `budget_total` decimal(12,2) DEFAULT 0.00 COMMENT '总预算金额',
  `budget_used` decimal(12,2) DEFAULT 0.00 COMMENT '已使用预算',
  `quota_total` int unsigned DEFAULT 0 COMMENT '总优惠配额(发放数量)',
  `quota_used` int unsigned DEFAULT 0 COMMENT '已使用配额',
  `quota_per_user` int unsigned DEFAULT 1 COMMENT '每人限用数量',
  `effective_status` tinyint unsigned DEFAULT 1 COMMENT '生效状态：0-未生效 1-生效中 2-已失效 3-已禁用',
  `start_time` datetime DEFAULT NULL COMMENT '生效开始时间',
  `end_time` datetime DEFAULT NULL COMMENT '生效结束时间',
  `sort_order` int unsigned DEFAULT 0 COMMENT '排序',
  `operator_id` bigint unsigned DEFAULT NULL COMMENT '操作人ID',
  `operator_name` varchar(50) DEFAULT NULL COMMENT '操作人名称',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_marketing_id` (`marketing_id`),
  KEY `idx_discount_type` (`discount_type`),
  KEY `idx_effective_status` (`effective_status`),
  KEY `idx_start_end_time` (`start_time`, `end_time`),
  KEY `idx_min_amount` (`min_amount`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='营销优惠规则表';

-- ============================================
-- 2. 优惠规则配置日志表 marketing_discount_rule_logs
-- ============================================
DROP TABLE IF EXISTS `marketing_discount_rule_logs`;
CREATE TABLE `marketing_discount_rule_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `rule_id` bigint unsigned NOT NULL COMMENT '优惠规则ID',
  `operator_id` bigint unsigned DEFAULT NULL COMMENT '操作人ID',
  `operator_type` tinyint unsigned NOT NULL COMMENT '操作人类型：0-用户 1-管理员 2-系统',
  `operator_name` varchar(50) DEFAULT NULL COMMENT '操作人名称',
  `action_type` varchar(50) NOT NULL COMMENT '操作类型：create/update/enable/disable/delete/threshold_adjust',
  `field_name` varchar(100) DEFAULT NULL COMMENT '变更字段名',
  `old_value` text COMMENT '变更前值',
  `new_value` text COMMENT '变更后值',
  `old_status` tinyint unsigned DEFAULT NULL COMMENT '变更前状态',
  `new_status` tinyint unsigned DEFAULT NULL COMMENT '变更后状态',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注说明',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_rule_id` (`rule_id`),
  KEY `idx_operator` (`operator_id`, `operator_type`),
  KEY `idx_action_type` (`action_type`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='优惠规则配置日志表';

-- ============================================
-- 3. 优惠使用记录表 marketing_discount_usage_records
-- ============================================
DROP TABLE IF EXISTS `marketing_discount_usage_records`;
CREATE TABLE `marketing_discount_usage_records` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `rule_id` bigint unsigned NOT NULL COMMENT '优惠规则ID',
  `marketing_id` bigint unsigned NOT NULL COMMENT '营销活动ID',
  `user_id` bigint unsigned NOT NULL COMMENT '用户ID',
  `user_name` varchar(100) DEFAULT NULL COMMENT '用户名称',
  `order_id` bigint unsigned DEFAULT NULL COMMENT '关联订单ID',
  `order_no` varchar(64) DEFAULT NULL COMMENT '订单编号',
  `goods_id` bigint unsigned DEFAULT NULL COMMENT '关联商品ID',
  `goods_name` varchar(255) DEFAULT NULL COMMENT '商品名称',
  `original_amount` decimal(10,2) DEFAULT 0.00 COMMENT '原始金额',
  `discount_amount` decimal(10,2) DEFAULT 0.00 COMMENT '优惠金额',
  `final_amount` decimal(10,2) DEFAULT 0.00 COMMENT '最终金额',
  `stack_rule_ids` varchar(500) DEFAULT NULL COMMENT '叠加使用的规则ID列表',
  `usage_time` datetime NOT NULL COMMENT '使用时间',
  `status` tinyint unsigned DEFAULT 1 COMMENT '状态：0-已取消 1-已使用 2-已退款',
  `refund_time` datetime DEFAULT NULL COMMENT '退款时间',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_rule_id` (`rule_id`),
  KEY `idx_marketing_id` (`marketing_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_usage_time` (`usage_time`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='优惠使用记录表';

-- ============================================
-- 4. 优惠叠加冲突记录表 marketing_discount_stack_conflicts
-- ============================================
DROP TABLE IF EXISTS `marketing_discount_stack_conflicts`;
CREATE TABLE `marketing_discount_stack_conflicts` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `rule_id` bigint unsigned NOT NULL COMMENT '当前规则ID',
  `conflict_rule_id` bigint unsigned NOT NULL COMMENT '冲突规则ID',
  `conflict_type` tinyint unsigned NOT NULL COMMENT '冲突类型：1-互斥规则 2-超限叠加 3-类目冲突 4-预算冲突',
  `conflict_detail` varchar(500) DEFAULT NULL COMMENT '冲突详情',
  `user_id` bigint unsigned DEFAULT NULL COMMENT '触发用户ID',
  `order_id` bigint unsigned DEFAULT NULL COMMENT '触发订单ID',
  `intercept_count` int unsigned DEFAULT 1 COMMENT '拦截次数',
  `first_intercept_time` datetime DEFAULT NULL COMMENT '首次拦截时间',
  `last_intercept_time` datetime DEFAULT NULL COMMENT '最近拦截时间',
  `status` tinyint unsigned DEFAULT 1 COMMENT '状态：0-已处理 1-待处理',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_rule_conflict` (`rule_id`, `conflict_rule_id`, `conflict_type`),
  KEY `idx_conflict_type` (`conflict_type`),
  KEY `idx_status` (`status`),
  KEY `idx_last_intercept` (`last_intercept_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='优惠叠加冲突记录表';

-- ============================================
-- 5. 优惠预算消耗台账表 marketing_discount_budget_ledger
-- ============================================
DROP TABLE IF EXISTS `marketing_discount_budget_ledger`;
CREATE TABLE `marketing_discount_budget_ledger` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `rule_id` bigint unsigned NOT NULL COMMENT '优惠规则ID',
  `marketing_id` bigint unsigned NOT NULL COMMENT '营销活动ID',
  `ledger_type` tinyint unsigned NOT NULL COMMENT '台账类型：1-预算划拨 2-优惠消耗 3-预算退回 4-预算调整',
  `amount` decimal(12,2) NOT NULL COMMENT '变动金额（正数增加，负数减少）',
  `balance_before` decimal(12,2) DEFAULT 0.00 COMMENT '变动前余额',
  `balance_after` decimal(12,2) DEFAULT 0.00 COMMENT '变动后余额',
  `order_id` bigint unsigned DEFAULT NULL COMMENT '关联订单ID',
  `user_id` bigint unsigned DEFAULT NULL COMMENT '关联用户ID',
  `operator_id` bigint unsigned DEFAULT NULL COMMENT '操作人ID',
  `operator_name` varchar(50) DEFAULT NULL COMMENT '操作人名称',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_rule_id` (`rule_id`),
  KEY `idx_marketing_id` (`marketing_id`),
  KEY `idx_ledger_type` (`ledger_type`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='优惠预算消耗台账表';

-- ============================================
-- 初始数据：示例优惠规则
-- ============================================
INSERT INTO `marketing_discount_rules` (
  `marketing_id`, `rule_name`, `discount_type`, `min_amount`, `discount_value`,
  `max_discount_amount`, `stackable`, `stack_limit`, `budget_total`, `quota_total`,
  `quota_per_user`, `effective_status`, `sort_order`, `operator_name`, `remark`
) VALUES
(1, '满100减10', 1, 100.00, 10.00, 10.00, 0, 1, 10000.00, 1000, 1, 1, 1, '系统', '通用满减规则'),
(1, '满200减30', 1, 200.00, 30.00, 30.00, 0, 1, 20000.00, 800, 1, 1, 2, '系统', '阶梯满减规则'),
(1, '9折优惠', 2, 50.00, 90.00, 50.00, 1, 2, 15000.00, 2000, 3, 1, 3, '系统', '折扣可叠加2次');

SET FOREIGN_KEY_CHECKS = 1;
