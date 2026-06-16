-- 数据库扩展表初始化脚本
-- 创建时间: 2026-06-16
-- 说明: 订单明细、订单日志、审核、营销、风控、操作日志、消息通知等扩展表

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

USE annotation_db;

-- ============================================
-- 1. 订单明细表 order_items
-- ============================================
DROP TABLE IF EXISTS `order_items`;
CREATE TABLE `order_items` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `order_id` bigint unsigned NOT NULL COMMENT '订单ID',
  `goods_id` bigint unsigned NOT NULL COMMENT '商品ID',
  `goods_name` varchar(255) NOT NULL COMMENT '商品名称（下单时快照）',
  `goods_image` varchar(500) DEFAULT NULL COMMENT '商品图片（下单时快照）',
  `spec_info` varchar(255) DEFAULT NULL COMMENT '规格信息（下单时快照）',
  `price` decimal(10,2) NOT NULL COMMENT '单价（下单时快照）',
  `quantity` int unsigned NOT NULL COMMENT '数量',
  `subtotal` decimal(10,2) NOT NULL COMMENT '小计金额',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_goods_id` (`goods_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单明细表';

-- ============================================
-- 2. 订单日志表 order_logs
-- ============================================
DROP TABLE IF EXISTS `order_logs`;
CREATE TABLE `order_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `order_id` bigint unsigned NOT NULL COMMENT '订单ID',
  `operator_id` bigint unsigned DEFAULT NULL COMMENT '操作人ID',
  `operator_type` tinyint unsigned NOT NULL COMMENT '操作人类型：0-用户 1-管理员 2-系统',
  `action` varchar(50) NOT NULL COMMENT '操作类型：create/pay/cancel/ship/receive/complete/refund等',
  `old_status` tinyint unsigned DEFAULT NULL COMMENT '变更前状态',
  `new_status` tinyint unsigned DEFAULT NULL COMMENT '变更后状态',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注说明',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_operator` (`operator_id`, `operator_type`),
  KEY `idx_action` (`action`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单日志表';

-- ============================================
-- 3. 商品审核表 goods_audits
-- ============================================
DROP TABLE IF EXISTS `goods_audits`;
CREATE TABLE `goods_audits` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `goods_id` bigint unsigned NOT NULL COMMENT '商品ID',
  `auditor_id` bigint unsigned NOT NULL COMMENT '审核人ID',
  `status` tinyint unsigned NOT NULL DEFAULT 0 COMMENT '审核状态：0-待审核 1-审核通过 2-审核拒绝',
  `reason` varchar(500) DEFAULT NULL COMMENT '审核原因/意见',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_goods_id` (`goods_id`),
  KEY `idx_auditor_id` (`auditor_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商品审核表';

-- ============================================
-- 4. 商家审核表 merchant_audits
-- ============================================
DROP TABLE IF EXISTS `merchant_audits`;
CREATE TABLE `merchant_audits` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `merchant_id` bigint unsigned NOT NULL COMMENT '商家ID',
  `auditor_id` bigint unsigned NOT NULL COMMENT '审核人ID',
  `status` tinyint unsigned NOT NULL DEFAULT 0 COMMENT '审核状态：0-待审核 1-审核通过 2-审核拒绝',
  `reason` varchar(500) DEFAULT NULL COMMENT '审核原因/意见',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_merchant_id` (`merchant_id`),
  KEY `idx_auditor_id` (`auditor_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商家审核表';

-- ============================================
-- 5. 用户优惠券表 marketing_users
-- ============================================
DROP TABLE IF EXISTS `marketing_users`;
CREATE TABLE `marketing_users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `marketing_id` bigint unsigned NOT NULL COMMENT '营销活动ID',
  `user_id` bigint unsigned NOT NULL COMMENT '用户ID',
  `status` tinyint unsigned DEFAULT 0 COMMENT '状态：0-未使用 1-已使用 2-已过期',
  `used_time` datetime DEFAULT NULL COMMENT '使用时间',
  `expire_time` datetime DEFAULT NULL COMMENT '过期时间',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_marketing_id` (`marketing_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_expire_time` (`expire_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户优惠券表';

-- ============================================
-- 6. 售后审核表 after_sale_audits
-- ============================================
DROP TABLE IF EXISTS `after_sale_audits`;
CREATE TABLE `after_sale_audits` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `aftersale_id` bigint unsigned NOT NULL COMMENT '售后申请ID',
  `auditor_id` bigint unsigned NOT NULL COMMENT '审核人ID',
  `level` tinyint unsigned NOT NULL COMMENT '审核级别：1-初审 2-终审',
  `status` tinyint unsigned NOT NULL COMMENT '审核结果：1-通过 2-拒绝',
  `remark` text COMMENT '审核备注',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_aftersale_id` (`aftersale_id`),
  KEY `idx_auditor_id` (`auditor_id`),
  KEY `idx_level_status` (`level`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='售后审核表';

-- ============================================
-- 7. 商家处罚表 penalties
-- ============================================
DROP TABLE IF EXISTS `penalties`;
CREATE TABLE `penalties` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `merchant_id` bigint unsigned NOT NULL COMMENT '商家ID',
  `type` tinyint unsigned NOT NULL COMMENT '处罚类型：1-警告 2-降权 3-罚款 4-封店',
  `amount` decimal(10,2) DEFAULT 0.00 COMMENT '处罚金额',
  `reason` text NOT NULL COMMENT '违规原因',
  `status` tinyint unsigned DEFAULT 1 COMMENT '状态：0-已解除 1-生效中',
  `expire_time` datetime DEFAULT NULL COMMENT '到期时间',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_merchant_id` (`merchant_id`),
  KEY `idx_type` (`type`),
  KEY `idx_status` (`status`),
  KEY `idx_expire_time` (`expire_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商家处罚表';

-- ============================================
-- 8. 风控规则表 risk_controls
-- ============================================
DROP TABLE IF EXISTS `risk_controls`;
CREATE TABLE `risk_controls` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `name` varchar(100) NOT NULL COMMENT '规则名称',
  `type` tinyint unsigned NOT NULL COMMENT '规则类型：1-用户 2-订单 3-商品 4-商家',
  `condition_json` json NOT NULL COMMENT '规则条件配置JSON',
  `action` varchar(50) NOT NULL COMMENT '触发动作：alert-预警 block-拦截 review-审核',
  `threshold` decimal(10,2) DEFAULT NULL COMMENT '阈值',
  `status` tinyint unsigned DEFAULT 1 COMMENT '状态：0-禁用 1-启用',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_type` (`type`),
  KEY `idx_status` (`status`),
  KEY `idx_action` (`action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='风控规则表';

-- ============================================
-- 9. 风险预警表 risk_alerts
-- ============================================
DROP TABLE IF EXISTS `risk_alerts`;
CREATE TABLE `risk_alerts` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `rule_id` bigint unsigned NOT NULL COMMENT '规则ID',
  `type` tinyint unsigned NOT NULL COMMENT '预警类型：1-用户 2-订单 3-商品 4-商家',
  `target_id` bigint unsigned NOT NULL COMMENT '目标ID',
  `level` tinyint unsigned NOT NULL DEFAULT 1 COMMENT '风险等级：1-低 2-中 3-高',
  `content` text COMMENT '预警内容',
  `status` tinyint unsigned NOT NULL DEFAULT 0 COMMENT '处理状态：0-未处理 1-已处理',
  `handler_id` bigint unsigned DEFAULT NULL COMMENT '处理人ID',
  `handled_at` datetime DEFAULT NULL COMMENT '处理时间',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_rule_id` (`rule_id`),
  KEY `idx_type_target` (`type`, `target_id`),
  KEY `idx_level` (`level`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='风险预警表';

-- ============================================
-- 10. 操作日志表 operate_logs
-- ============================================
DROP TABLE IF EXISTS `operate_logs`;
CREATE TABLE `operate_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `operator_id` bigint unsigned DEFAULT NULL COMMENT '操作人ID',
  `operator_type` tinyint unsigned DEFAULT NULL COMMENT '操作人类型：1-用户 2-管理员 3-系统',
  `module` varchar(50) DEFAULT NULL COMMENT '模块',
  `action` varchar(50) DEFAULT NULL COMMENT '操作',
  `method` varchar(10) DEFAULT NULL COMMENT '请求方法：GET/POST/PUT/DELETE',
  `params_json` json DEFAULT NULL COMMENT '请求参数JSON',
  `result_json` json DEFAULT NULL COMMENT '响应结果JSON',
  `ip` varchar(50) DEFAULT NULL COMMENT 'IP地址',
  `user_agent` varchar(500) DEFAULT NULL COMMENT 'User Agent',
  `cost_ms` int unsigned DEFAULT NULL COMMENT '耗时（毫秒）',
  `status` tinyint unsigned DEFAULT 1 COMMENT '状态：0-失败 1-成功',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_operator` (`operator_id`, `operator_type`),
  KEY `idx_module_action` (`module`, `action`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='操作日志表';

-- ============================================
-- 11. 消息通知表 messages
-- ============================================
DROP TABLE IF EXISTS `messages`;
CREATE TABLE `messages` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_type` tinyint unsigned NOT NULL COMMENT '接收人类型：1-用户 2-商家 3-管理员',
  `user_id` bigint unsigned NOT NULL COMMENT '接收人ID',
  `type` tinyint unsigned NOT NULL COMMENT '消息类型：1-系统通知 2-订单通知 3-风控预警 4-营销消息',
  `title` varchar(200) NOT NULL COMMENT '消息标题',
  `content` text COMMENT '消息内容',
  `is_read` tinyint unsigned DEFAULT 0 COMMENT '是否已读：0-未读 1-已读',
  `read_at` datetime DEFAULT NULL COMMENT '读取时间',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_type`, `user_id`),
  KEY `idx_is_read` (`is_read`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='消息通知表';

SET FOREIGN_KEY_CHECKS = 1;
