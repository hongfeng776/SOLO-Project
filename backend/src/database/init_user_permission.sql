-- ============================================
-- 用户账号权限管控模块
-- 创建时间: 2026-06-18
-- ============================================

USE annotation_db;

-- ============================================
-- 1. 系统权限配置表
-- ============================================
DROP TABLE IF EXISTS `permission_configs`;
CREATE TABLE `permission_configs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `permission_code` VARCHAR(100) NOT NULL COMMENT '权限编码',
  `permission_name` VARCHAR(100) NOT NULL COMMENT '权限名称',
  `permission_type` VARCHAR(50) NOT NULL COMMENT '权限类型：operation-操作功能 activity-活动参与 order-订单相关 marketing-营销相关',
  `permission_level` TINYINT UNSIGNED DEFAULT 1 COMMENT '权限等级：1-基础权限 2-高级权限 3-特殊权限',
  `min_user_level` TINYINT UNSIGNED DEFAULT 1 COMMENT '最低用户等级要求：1-普通 2-银卡 3-金卡 4-钻石 5-至尊',
  `max_risk_level` TINYINT UNSIGNED DEFAULT 2 COMMENT '最大允许风险等级：0-低 1-中 2-高',
  `allowed_status` VARCHAR(255) DEFAULT '1' COMMENT '允许的用户状态，逗号分隔：1-正常 2-冻结 3-注销',
  `sort_order` INT DEFAULT 0 COMMENT '排序',
  `status` TINYINT UNSIGNED DEFAULT 1 COMMENT '状态：0-禁用 1-启用',
  `description` VARCHAR(255) DEFAULT NULL COMMENT '权限描述',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_permission_code` (`permission_code`),
  KEY `idx_permission_type` (`permission_type`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统权限配置表';

-- ============================================
-- 2. 用户权限表
-- ============================================
DROP TABLE IF EXISTS `user_permissions`;
CREATE TABLE `user_permissions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `permission_id` BIGINT UNSIGNED NOT NULL COMMENT '权限ID',
  `permission_code` VARCHAR(100) NOT NULL COMMENT '权限编码',
  `grant_type` TINYINT UNSIGNED DEFAULT 1 COMMENT '授权类型：1-默认授权 2-手动授予 3-临时授权 4-批量授予',
  `grant_source` VARCHAR(50) DEFAULT NULL COMMENT '授权来源：manual-手动 batch-批量 promotion-活动 upgrade-升级',
  `granted_by` BIGINT UNSIGNED DEFAULT NULL COMMENT '授权人ID',
  `granted_by_name` VARCHAR(50) DEFAULT NULL COMMENT '授权人姓名',
  `granted_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '授权时间',
  `expire_time` DATETIME DEFAULT NULL COMMENT '过期时间（临时权限用）',
  `is_revoked` TINYINT UNSIGNED DEFAULT 0 COMMENT '是否已回收：0-否 1-是',
  `revoked_by` BIGINT UNSIGNED DEFAULT NULL COMMENT '回收人ID',
  `revoked_by_name` VARCHAR(50) DEFAULT NULL COMMENT '回收人姓名',
  `revoked_at` DATETIME DEFAULT NULL COMMENT '回收时间',
  `revoke_reason` VARCHAR(255) DEFAULT NULL COMMENT '回收原因',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_permission` (`user_id`, `permission_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_permission_id` (`permission_id`),
  KEY `idx_granted_at` (`granted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户权限表';

-- ============================================
-- 3. 用户权限变更日志表
-- ============================================
DROP TABLE IF EXISTS `user_permission_logs`;
CREATE TABLE `user_permission_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `permission_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '权限ID',
  `permission_code` VARCHAR(100) DEFAULT NULL COMMENT '权限编码',
  `operation_type` VARCHAR(30) NOT NULL COMMENT '操作类型：grant-授予 revoke-回收 batch_grant-批量授予 batch_revoke-批量回收 reset-重置 status_change-状态变更',
  `operation_scope` VARCHAR(30) DEFAULT 'single' COMMENT '操作范围：single-单用户 batch-批量 global-全局',
  `operator_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '操作人ID',
  `operator_name` VARCHAR(50) DEFAULT NULL COMMENT '操作人姓名',
  `operator_role` VARCHAR(50) DEFAULT NULL COMMENT '操作人角色',
  `operate_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
  `operate_ip` VARCHAR(45) DEFAULT NULL COMMENT '操作IP',
  `reason` VARCHAR(255) DEFAULT NULL COMMENT '操作原因',
  `before_permissions` TEXT DEFAULT NULL COMMENT '变更前权限列表JSON',
  `after_permissions` TEXT DEFAULT NULL COMMENT '变更后权限列表JSON',
  `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_operation_type` (`operation_type`),
  KEY `idx_operate_time` (`operate_time`),
  KEY `idx_operator_id` (`operator_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户权限变更日志表';

-- ============================================
-- 4. 用户冻结记录表
-- ============================================
DROP TABLE IF EXISTS `user_freeze_records`;
CREATE TABLE `user_freeze_records` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `freeze_type` TINYINT UNSIGNED NOT NULL COMMENT '冻结类型：1-临时冻结 2-永久冻结',
  `freeze_reason` VARCHAR(255) NOT NULL COMMENT '冻结原因',
  `freeze_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '冻结时间',
  `unfreeze_time` DATETIME DEFAULT NULL COMMENT '解冻时间',
  `unfreeze_reason` VARCHAR(255) DEFAULT NULL COMMENT '解冻原因',
  `operator_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '操作人ID',
  `operator_name` VARCHAR(50) DEFAULT NULL COMMENT '操作人姓名',
  `status` TINYINT UNSIGNED DEFAULT 1 COMMENT '状态：1-冻结中 2-已解冻',
  `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_freeze_type` (`freeze_type`),
  KEY `idx_freeze_time` (`freeze_time`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户冻结记录表';

-- ============================================
-- 5. 插入系统权限配置数据
-- ============================================
INSERT INTO `permission_configs` (`permission_code`, `permission_name`, `permission_type`, `permission_level`, `min_user_level`, `max_risk_level`, `allowed_status`, `sort_order`, `description`) VALUES
-- 操作功能类
('login', '登录系统', 'operation', 1, 1, 2, '1', 1, '用户登录系统的基本权限'),
('view_profile', '查看个人资料', 'operation', 1, 1, 2, '1,2', 2, '查看个人信息的权限'),
('edit_profile', '修改个人资料', 'operation', 1, 1, 1, '1', 3, '修改个人信息的权限'),
('change_password', '修改密码', 'operation', 1, 1, 2, '1', 4, '修改登录密码的权限'),
-- 订单相关
('create_order', '创建订单', 'order', 1, 1, 1, '1', 11, '下单购买商品的权限'),
('cancel_order', '取消订单', 'order', 1, 1, 2, '1', 12, '取消待付款订单的权限'),
('apply_aftersale', '申请售后', 'order', 1, 1, 1, '1', 13, '申请售后服务的权限'),
('view_orders', '查看订单', 'order', 1, 1, 2, '1,2', 14, '查看我的订单的权限'),
('review_product', '商品评价', 'order', 2, 2, 0, '1', 15, '对购买商品进行评价的权限'),
-- 营销相关
('receive_coupon', '领取优惠券', 'marketing', 1, 1, 1, '1', 21, '领取平台优惠券的权限'),
('use_coupon', '使用优惠券', 'marketing', 1, 1, 1, '1', 22, '下单使用优惠券的权限'),
('participate_activity', '参与营销活动', 'marketing', 2, 2, 0, '1', 23, '参与平台营销活动的权限'),
('invite_friends', '邀请好友', 'marketing', 2, 2, 1, '1', 24, '邀请好友注册的权限'),
('view_marketing', '查看营销信息', 'marketing', 1, 1, 2, '1,2', 25, '接收营销推送的权限'),
-- 活动参与
('join_promotion', '参加促销活动', 'activity', 1, 1, 1, '1', 31, '参加平台促销活动的权限'),
('join_seckill', '参与秒杀', 'activity', 2, 3, 0, '1', 32, '参与限时秒杀活动的权限'),
('join_lottery', '参与抽奖', 'activity', 2, 2, 0, '1', 33, '参与平台抽奖活动的权限'),
('join_vip', 'VIP专享活动', 'activity', 3, 4, 0, '1', 34, 'VIP会员专享活动权限'),
-- 特殊权限
('priority_service', '优先客服', 'operation', 2, 3, 1, '1', 41, '享受优先客服服务'),
('fast_refund', '极速退款', 'order', 2, 3, 0, '1', 42, '享受极速退款服务'),
('exclusive_customer', '专属客服', 'operation', 3, 5, 0, '1', 43, '专属客服1对1服务'),
('free_shipping', '免运费', 'order', 2, 4, 1, '1', 44, '享受全场免运费');
