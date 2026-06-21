-- ============================================
-- 用户账号权限管控模块扩展表
-- 创建时间: 2026-06-21
-- ============================================

USE annotation_db;

-- ============================================
-- 1. 扩展用户表，增加权限和冻结类型相关字段
-- ============================================
ALTER TABLE `users`
ADD COLUMN `freeze_type` TINYINT UNSIGNED DEFAULT 0 COMMENT '冻结类型：0-无 1-临时冻结 2-永久冻结' AFTER `risk_level`,
ADD COLUMN `permissions` TEXT DEFAULT NULL COMMENT '用户权限列表JSON存储' AFTER `freeze_type`,
ADD COLUMN `permission_version` INT UNSIGNED DEFAULT 1 COMMENT '权限配置版本号' AFTER `permissions`,
ADD COLUMN `cancel_type` TINYINT UNSIGNED DEFAULT 0 COMMENT '注销类型：0-无 1-主动注销 2-违规注销' AFTER `compliance_score`;

-- ============================================
-- 2. 系统权限定义表
-- ============================================
DROP TABLE IF EXISTS `system_permissions`;
CREATE TABLE `system_permissions` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `permission_code` VARCHAR(50) NOT NULL COMMENT '权限编码',
  `permission_name` VARCHAR(100) NOT NULL COMMENT '权限名称',
  `permission_group` VARCHAR(50) NOT NULL COMMENT '权限分组：basic-基础营销-下单 order-订单评价-评价 activity-活动 info-信息管理',
  `permission_desc` VARCHAR(255) DEFAULT NULL COMMENT '权限描述',
  `required_level` TINYINT UNSIGNED DEFAULT 1 COMMENT '最低用户等级要求：1-普通 2-银卡 3-金卡 4-钻石 5-至尊',
  `allowed_status` VARCHAR(100) DEFAULT '1' COMMENT '允许的账号状态：1-正常 2-冻结 3-注销，逗号分隔',
  `allowed_risk_levels` VARCHAR(100) DEFAULT '0,1' COMMENT '允许的风险等级：0-低 1-中 2-高，逗号分隔',
  `is_default` TINYINT UNSIGNED DEFAULT 0 COMMENT '是否默认权限：0-否 1-是',
  `is_system` TINYINT UNSIGNED DEFAULT 0 COMMENT '是否系统权限：0-否 1-是（不可删除）',
  `sort_order` INT UNSIGNED DEFAULT 0 COMMENT '排序值',
  `status` TINYINT UNSIGNED DEFAULT 1 COMMENT '状态：0-禁用 1-启用',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_permission_code` (`permission_code`),
  KEY `idx_permission_group` (`permission_group`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统权限定义表';

-- ============================================
-- 3. 用户权限明细表（冗余存储）
-- ============================================
DROP TABLE IF EXISTS `user_permissions`;
CREATE TABLE `user_permissions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `permission_id` INT UNSIGNED NOT NULL COMMENT '权限ID',
  `permission_code` VARCHAR(50) NOT NULL COMMENT '权限编码（冗余）',
  `grant_type` TINYINT UNSIGNED DEFAULT 1 COMMENT '授予方式：1-默认授予 2-手动授予 3-升级获得 4-活动获得',
  `granted_by` BIGINT UNSIGNED DEFAULT NULL COMMENT '授予人ID（手动授予时）',
  `granted_by_name` VARCHAR(50) DEFAULT NULL COMMENT '授予人姓名',
  `granted_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '授予时间',
  `expire_time` DATETIME DEFAULT NULL COMMENT '过期时间（NULL表示永久）',
  `status` TINYINT UNSIGNED DEFAULT 1 COMMENT '状态：0-已回收 1-生效 2-已过期',
  `revoke_reason` VARCHAR(255) DEFAULT NULL COMMENT '回收原因',
  `revoked_by` BIGINT UNSIGNED DEFAULT NULL COMMENT '回收人ID',
  `revoked_by_name` VARCHAR(50) DEFAULT NULL COMMENT '回收人姓名',
  `revoked_time` DATETIME DEFAULT NULL COMMENT '回收时间',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_permission` (`user_id`, `permission_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_permission_id` (`permission_id`),
  KEY `idx_granted_time` (`granted_time`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户权限明细表';

-- ============================================
-- 4. 权限变更日志表（溯源）
-- ============================================
DROP TABLE IF EXISTS `user_permission_logs`;
CREATE TABLE `user_permission_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `username` VARCHAR(50) DEFAULT NULL COMMENT '用户名（冗余）',
  `log_type` TINYINT UNSIGNED NOT NULL COMMENT '日志类型：1-权限授予 2-权限回收 3-权限重置 4-状态变更联动 5-批量操作',
  `permission_codes` TEXT DEFAULT NULL COMMENT '涉及权限编码，多个逗号分隔',
  `permission_details` TEXT DEFAULT NULL COMMENT '权限变更明细JSON',
  `operator_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '操作人ID',
  `operator_name` VARCHAR(50) DEFAULT NULL COMMENT '操作人姓名',
  `operator_role` VARCHAR(50) DEFAULT NULL COMMENT '操作人角色：super_admin-超级管理员 admin-普通管理员 system-系统',
  `operate_ip` VARCHAR(45) DEFAULT NULL COMMENT '操作IP',
  `operate_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
  `operate_scope` VARCHAR(20) DEFAULT 'single' COMMENT '操作范围：single-单个 batch-批量 global-全局',
  `reason` VARCHAR(255) DEFAULT NULL COMMENT '操作原因/备注',
  `before_status` TINYINT UNSIGNED DEFAULT NULL COMMENT '操作前状态',
  `after_status` TINYINT UNSIGNED DEFAULT NULL COMMENT '操作后状态',
  `before_permissions` TEXT DEFAULT NULL COMMENT '操作前权限快照JSON',
  `after_permissions` TEXT DEFAULT NULL COMMENT '操作后权限快照JSON',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_log_type` (`log_type`),
  KEY `idx_operate_time` (`operate_time`),
  KEY `idx_operator_id` (`operator_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='权限变更日志表';

-- ============================================
-- 5. 管理员管辖用户表（普通管理员权限范围）
-- ============================================
DROP TABLE IF EXISTS `admin_user_scope`;
CREATE TABLE `admin_user_scope` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `admin_id` BIGINT UNSIGNED NOT NULL COMMENT '管理员ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `scope_type` TINYINT UNSIGNED DEFAULT 1 COMMENT '管辖类型：1-直接管辖 2-间接管辖',
  `granted_by` BIGINT UNSIGNED DEFAULT NULL COMMENT '授权人ID',
  `granted_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '授权时间',
  `expire_time` DATETIME DEFAULT NULL COMMENT '授权过期时间',
  `remark` VARCHAR(255) DEFAULT NULL COMMENT '备注',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_admin_user` (`admin_id`, `user_id`),
  KEY `idx_admin_id` (`admin_id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员管辖用户表';

-- ============================================
-- 初始数据：系统权限定义
-- ============================================
INSERT INTO `system_permissions` 
(`permission_code`, `permission_name`, `permission_group`, `permission_desc`, `required_level`, `allowed_status`, `allowed_risk_levels`, `is_default`, `is_system`, `sort_order`, `status`) VALUES
-- 基础权限组
('login', '账号登录', 'basic', '允许用户登录系统', 1, '1,2', '0,1,2', 1, 1, 1, 1),
('view_profile', '查看个人信息', 'basic', '允许查看个人资料信息', 1, '1,2,3', '0,1,2', 1, 1, 2, 1),
('edit_profile', '编辑个人信息', 'basic', '允许修改个人基础资料', 1, '1', '0,1', 1, 1, 3, 1),
('change_password', '修改密码', 'basic', '允许修改登录密码', 1, '1,2', '0,1,2', 1, 1, 4, 1),

-- 营销权限组
('view_marketing', '查看营销活动', 'marketing', '允许浏览营销活动列表', 1, '1', '0,1,2', 1, 1, 10, 1),
('participate_marketing', '参与营销活动', 'marketing', '允许报名/参与营销活动', 1, '1', '0,1', 1, 1, 11, 1),
('receive_coupon', '领取优惠券', 'marketing', '允许领取平台优惠券', 1, '1', '0,1', 1, 1, 12, 1),
('use_coupon', '使用优惠券', 'marketing', '允许下单时使用优惠券', 2, '1', '0,1', 1, 0, 13, 1),
('view_vip_activity', '查看VIP专属活动', 'marketing', '允许查看会员专属活动', 3, '1', '0,1', 0, 0, 14, 1),

-- 下单权限组
('browse_goods', '浏览商品', 'order', '允许浏览商品列表和详情', 1, '1,2', '0,1,2', 1, 1, 20, 1),
('create_order', '创建订单', 'order', '允许提交订单下单', 1, '1', '0,1', 1, 1, 21, 1),
('cancel_order', '取消订单', 'order', '允许取消未付款订单', 1, '1', '0,1', 1, 1, 22, 1),
('refund_order', '申请退款', 'order', '允许申请订单退款', 1, '1', '0,1', 1, 1, 23, 1),
('pay_order', '支付订单', 'order', '允许完成订单支付', 1, '1', '0,1', 1, 1, 24, 1),
('batch_purchase', '批量购买', 'order', '允许批量下单购买', 3, '1', '0,1', 0, 0, 25, 1),
('pre_sale_order', '预售下单', 'order', '允许参与预售活动下单', 2, '1', '0,1', 0, 0, 26, 1),

-- 评价权限组
('write_review', '发表评价', 'review', '允许对已完成订单发表评价', 1, '1', '0,1', 1, 1, 30, 1),
('upload_review_image', '上传评价图片', 'review', '允许评价时上传图片', 2, '1', '0,1', 1, 0, 31, 1),
('reply_review', '回复评价', 'review', '允许回复他人评价', 2, '1', '0,1', 0, 0, 32, 1),
('report_review', '举报评价', 'review', '允许举报违规评价', 1, '1', '0,1,2', 1, 0, 33, 1),
('delete_own_review', '删除自有评价', 'review', '允许删除自己的评价', 1, '1', '0,1', 1, 0, 34, 1),

-- 活动权限组
('join_group_buy', '参与拼团', 'activity', '允许参与拼团活动', 1, '1', '0,1', 1, 0, 40, 1),
('join_seckill', '参与秒杀', 'activity', '允许参与秒杀活动', 2, '1', '0,1', 1, 0, 41, 1),
('join_lottery', '参与抽奖', 'activity', '允许参与平台抽奖活动', 1, '1', '0,1', 1, 0, 42, 1),
('publish_dynamic', '发布动态', 'activity', '允许在社区发布动态', 2, '1', '0,1', 0, 0, 43, 1),
('invite_user', '邀请好友', 'activity', '允许发送邀请链接', 1, '1', '0,1,2', 1, 0, 44, 1),

-- 信息管理权限组
('manage_address', '管理收货地址', 'info', '允许新增/修改/删除收货地址', 1, '1', '0,1,2', 1, 1, 50, 1),
('bind_phone', '绑定手机号', 'info', '允许绑定/更换手机号', 1, '1', '0,1,2', 1, 1, 51, 1),
('bind_email', '绑定邮箱', 'info', '允许绑定/更换邮箱', 1, '1', '0,1,2', 1, 1, 52, 1),
('view_privacy', '查看隐私设置', 'info', '允许查看个人隐私设置', 1, '1,2,3', '0,1,2', 1, 1, 53, 1),
('edit_privacy', '编辑隐私设置', 'info', '允许修改个人隐私设置', 1, '1', '0,1,2', 1, 1, 54, 1),
('export_data', '导出个人数据', 'info', '允许导出个人所有数据', 1, '1,2', '0,1,2', 0, 1, 55, 1),
('account_cancel', '申请注销账号', 'info', '允许主动申请注销账号', 1, '1', '0,1,2', 1, 1, 56, 1);

-- ============================================
-- 初始数据：为现有用户授予默认权限
-- ============================================
INSERT INTO `user_permissions` 
(`user_id`, `permission_id`, `permission_code`, `grant_type`, `granted_time`, `status`)
SELECT 
  u.id,
  sp.id,
  sp.permission_code,
  1,
  NOW(),
  CASE 
    WHEN u.status = 3 THEN 0
    WHEN u.status = 2 AND sp.permission_code NOT IN ('login', 'view_profile', 'change_password') THEN 0
    WHEN u.risk_level = 2 AND sp.permission_group IN ('marketing', 'order', 'review') THEN 0
    ELSE 1
  END
FROM `users` u
CROSS JOIN `system_permissions` sp
WHERE sp.is_default = 1;

-- ============================================
-- 更新现有用户的 permissions 字段（JSON格式）
-- ============================================
UPDATE `users` u SET u.permissions = (
  SELECT CONCAT('[', GROUP_CONCAT(
    JSON_OBJECT(
      'code', sp.permission_code,
      'name', sp.permission_name,
      'group', sp.permission_group,
      'granted', up.status = 1
    ) ORDER BY sp.sort_order SEPARATOR ','
  ), ']')
  FROM `user_permissions` up
  INNER JOIN `system_permissions` sp ON up.permission_id = sp.id
  WHERE up.user_id = u.id
  GROUP BY up.user_id
);
