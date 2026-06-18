-- ============================================
-- 用户管理模块扩展表
-- 创建时间: 2026-06-18
-- ============================================

USE annotation_db;

-- ============================================
-- 1. 扩展用户表，增加用户基础信息字段
-- ============================================
ALTER TABLE `users`
ADD COLUMN `nickname` VARCHAR(50) DEFAULT NULL COMMENT '昵称' AFTER `username`,
ADD COLUMN `real_name` VARCHAR(50) DEFAULT NULL COMMENT '真实姓名' AFTER `nickname`,
ADD COLUMN `id_card` VARCHAR(18) DEFAULT NULL COMMENT '身份证号' AFTER `real_name`,
ADD COLUMN `gender` TINYINT UNSIGNED DEFAULT 0 COMMENT '性别：0-未知 1-男 2-女' AFTER `id_card`,
ADD COLUMN `birthday` DATE DEFAULT NULL COMMENT '出生日期' AFTER `gender`,
ADD COLUMN `level` TINYINT UNSIGNED DEFAULT 1 COMMENT '用户等级：1-普通 2-银卡 3-金卡 4-钻石 5-至尊' AFTER `birthday`,
ADD COLUMN `tags` VARCHAR(255) DEFAULT NULL COMMENT '用户标签，多个用逗号分隔' AFTER `level`,
ADD COLUMN `total_amount` DECIMAL(12,2) DEFAULT 0.00 COMMENT '累计消费金额' AFTER `tags`,
ADD COLUMN `total_orders` INT UNSIGNED DEFAULT 0 COMMENT '累计订单数' AFTER `total_amount`,
ADD COLUMN `register_channel` VARCHAR(50) DEFAULT NULL COMMENT '注册渠道：app-APP h5-H5 mini-小程序 web-官网' AFTER `total_orders`,
ADD COLUMN `register_ip` VARCHAR(45) DEFAULT NULL COMMENT '注册IP' AFTER `register_channel`,
ADD COLUMN `last_login_time` DATETIME DEFAULT NULL COMMENT '最后登录时间' AFTER `register_ip`,
ADD COLUMN `last_login_ip` VARCHAR(45) DEFAULT NULL COMMENT '最后登录IP' AFTER `last_login_time`,
ADD COLUMN `remark` TEXT DEFAULT NULL COMMENT '用户备注' AFTER `updated_at`,
ADD COLUMN `frozen_reason` VARCHAR(255) DEFAULT NULL COMMENT '冻结原因' AFTER `remark`,
ADD COLUMN `frozen_time` DATETIME DEFAULT NULL COMMENT '冻结时间' AFTER `frozen_reason`,
ADD COLUMN `cancel_time` DATETIME DEFAULT NULL COMMENT '注销时间' AFTER `frozen_time`,
ADD COLUMN `risk_warning` TINYINT UNSIGNED DEFAULT 0 COMMENT '风控预警：0-无 1-有' AFTER `cancel_time`,
ADD COLUMN `risk_level` TINYINT UNSIGNED DEFAULT 0 COMMENT '风险等级：0-低 1-中 2-高' AFTER `risk_warning`,
ADD COLUMN `compliance_score` INT DEFAULT 100 COMMENT '合规分数' AFTER `risk_level`,
ADD UNIQUE KEY `uk_id_card` (`id_card`);

-- ============================================
-- 2. 用户档案表 - 记录用户资料修改历史
-- ============================================
DROP TABLE IF EXISTS `user_profiles`;
CREATE TABLE `user_profiles` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `field_name` VARCHAR(50) NOT NULL COMMENT '修改字段名',
  `old_value` TEXT DEFAULT NULL COMMENT '旧值',
  `new_value` TEXT DEFAULT NULL COMMENT '新值',
  `operator_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '操作人ID',
  `operator_name` VARCHAR(50) DEFAULT NULL COMMENT '操作人姓名',
  `operate_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
  `operate_ip` VARCHAR(45) DEFAULT NULL COMMENT '操作IP',
  `remark` VARCHAR(255) DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_operate_time` (`operate_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户档案表';

-- ============================================
-- 3. 用户登录轨迹表
-- ============================================
DROP TABLE IF EXISTS `user_login_traces`;
CREATE TABLE `user_login_traces` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `login_type` TINYINT UNSIGNED DEFAULT 1 COMMENT '登录类型：1-正常登录 2-异常登录 3-退出登录',
  `login_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '登录时间',
  `login_ip` VARCHAR(45) DEFAULT NULL COMMENT '登录IP',
  `login_location` VARCHAR(100) DEFAULT NULL COMMENT '登录地点',
  `device_type` VARCHAR(50) DEFAULT NULL COMMENT '设备类型',
  `device_info` VARCHAR(255) DEFAULT NULL COMMENT '设备信息',
  `user_agent` VARCHAR(500) DEFAULT NULL COMMENT '浏览器UA',
  `login_status` TINYINT UNSIGNED DEFAULT 1 COMMENT '登录状态：0-失败 1-成功',
  `fail_reason` VARCHAR(255) DEFAULT NULL COMMENT '失败原因',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_login_time` (`login_time`),
  KEY `idx_login_ip` (`login_ip`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户登录轨迹表';

-- ============================================
-- 4. 用户消费台账表
-- ============================================
DROP TABLE IF EXISTS `user_consumption_ledgers`;
CREATE TABLE `user_consumption_ledgers` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `order_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '订单ID',
  `order_no` VARCHAR(32) DEFAULT NULL COMMENT '订单号',
  `type` TINYINT UNSIGNED NOT NULL COMMENT '类型：1-消费 2-退款 3-充值 4-提现',
  `amount` DECIMAL(12,2) NOT NULL COMMENT '金额',
  `balance_before` DECIMAL(12,2) DEFAULT 0.00 COMMENT '变动前余额',
  `balance_after` DECIMAL(12,2) DEFAULT 0.00 COMMENT '变动后余额',
  `remark` VARCHAR(255) DEFAULT NULL COMMENT '备注',
  `operator_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '操作人ID',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户消费台账表';

-- ============================================
-- 5. 用户注册日志表
-- ============================================
DROP TABLE IF EXISTS `user_register_logs`;
CREATE TABLE `user_register_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `username` VARCHAR(50) NOT NULL COMMENT '用户名',
  `phone` VARCHAR(20) DEFAULT NULL COMMENT '手机号',
  `email` VARCHAR(100) DEFAULT NULL COMMENT '邮箱',
  `register_channel` VARCHAR(50) DEFAULT NULL COMMENT '注册渠道',
  `register_ip` VARCHAR(45) DEFAULT NULL COMMENT '注册IP',
  `register_location` VARCHAR(100) DEFAULT NULL COMMENT '注册地点',
  `device_type` VARCHAR(50) DEFAULT NULL COMMENT '设备类型',
  `user_agent` VARCHAR(500) DEFAULT NULL COMMENT '浏览器UA',
  `invite_code` VARCHAR(50) DEFAULT NULL COMMENT '邀请码',
  `inviter_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '邀请人ID',
  `audit_status` TINYINT UNSIGNED DEFAULT 1 COMMENT '审核状态：0-待审核 1-已通过 2-已拒绝',
  `audit_remark` VARCHAR(255) DEFAULT NULL COMMENT '审核备注',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_id` (`user_id`),
  KEY `idx_register_ip` (`register_ip`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户注册日志表';

-- ============================================
-- 6. 平台用户统计表
-- ============================================
DROP TABLE IF EXISTS `user_statistics`;
CREATE TABLE `user_statistics` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `stat_date` DATE NOT NULL COMMENT '统计日期',
  `total_users` INT UNSIGNED DEFAULT 0 COMMENT '用户总数',
  `new_users` INT UNSIGNED DEFAULT 0 COMMENT '新增用户数',
  `active_users` INT UNSIGNED DEFAULT 0 COMMENT '活跃用户数',
  `frozen_users` INT UNSIGNED DEFAULT 0 COMMENT '冻结用户数',
  `cancel_users` INT UNSIGNED DEFAULT 0 COMMENT '注销用户数',
  `risk_users` INT UNSIGNED DEFAULT 0 COMMENT '风控预警用户数',
  `total_amount` DECIMAL(15,2) DEFAULT 0.00 COMMENT '总消费金额',
  `avg_user_amount` DECIMAL(12,2) DEFAULT 0.00 COMMENT '平均消费金额',
  `level1_users` INT UNSIGNED DEFAULT 0 COMMENT '普通用户数',
  `level2_users` INT UNSIGNED DEFAULT 0 COMMENT '银卡用户数',
  `level3_users` INT UNSIGNED DEFAULT 0 COMMENT '金卡用户数',
  `level4_users` INT UNSIGNED DEFAULT 0 COMMENT '钻石用户数',
  `level5_users` INT UNSIGNED DEFAULT 0 COMMENT '至尊用户数',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_stat_date` (`stat_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='平台用户统计表';

-- ============================================
-- 7. 注册渠道配置表
-- ============================================
DROP TABLE IF EXISTS `register_channels`;
CREATE TABLE `register_channels` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `channel_code` VARCHAR(50) NOT NULL COMMENT '渠道编码',
  `channel_name` VARCHAR(50) NOT NULL COMMENT '渠道名称',
  `status` TINYINT UNSIGNED DEFAULT 1 COMMENT '状态：0-禁用 1-启用',
  `need_audit` TINYINT UNSIGNED DEFAULT 0 COMMENT '是否需要审核：0-否 1-是',
  `description` VARCHAR(255) DEFAULT NULL COMMENT '描述',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_channel_code` (`channel_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='注册渠道配置表';

-- ============================================
-- 初始数据：注册渠道
-- ============================================
INSERT INTO `register_channels` (`channel_code`, `channel_name`, `status`, `need_audit`, `description`) VALUES
('app', 'APP端', 1, 0, '移动端APP注册'),
('h5', 'H5端', 1, 0, 'H5页面注册'),
('mini', '小程序', 1, 0, '微信小程序注册'),
('web', '官网', 1, 0, '官方网站注册'),
('admin', '后台录入', 1, 1, '管理员后台录入');

-- ============================================
-- 初始数据：测试用户扩展信息
-- ============================================
UPDATE `users` SET
  `nickname` = '测试用户',
  `real_name` = '张三',
  `id_card` = '110101199001011234',
  `gender` = 1,
  `birthday` = '1990-01-01',
  `level` = 2,
  `tags` = '新用户,活跃用户',
  `total_amount` = 299.97,
  `total_orders` = 1,
  `register_channel` = 'web',
  `register_ip` = '127.0.0.1',
  `compliance_score` = 100
WHERE `username` = 'testuser';

-- ============================================
-- 批量插入测试用户
-- ============================================
INSERT INTO `users` (`username`, `nickname`, `real_name`, `id_card`, `gender`, `birthday`, `phone`, `email`, `level`, `tags`, `total_amount`, `total_orders`, `status`, `register_channel`, `register_ip`, `compliance_score`, `risk_warning`, `risk_level`, `remark`) VALUES
('user001', '李明', '李明', '110101199102022345', 1, '1991-02-02', '13800138001', 'user001@example.com', 1, '普通用户', 150.00, 2, 1, 'app', '192.168.1.101', 95, 0, 0, '优质用户'),
('user002', '王芳', '王芳', '310101199203033456', 2, '1992-03-03', '13800138002', 'user002@example.com', 3, '金卡会员,老用户', 2580.00, 15, 1, 'mini', '192.168.1.102', 98, 0, 0, '高价值用户'),
('user003', '张伟', '张伟', '440101199304044567', 1, '1993-04-04', '13800138003', 'user003@example.com', 2, '银卡会员', 890.50, 8, 2, 'h5', '192.168.1.103', 60, 1, 1, '账户异常，已冻结'),
('user004', '刘洋', '刘洋', '510101199405055678', 1, '1994-05-05', '13800138004', 'user004@example.com', 4, '钻石会员,VIP', 15680.00, 45, 1, 'app', '192.168.1.104', 100, 0, 0, '核心VIP用户'),
('user005', '陈静', '陈静', '320101199506066789', 2, '1995-06-06', '13800138005', 'user005@example.com', 1, '新用户', 50.00, 1, 3, 'web', '192.168.1.105', 0, 0, 0, '用户已注销'),
('user006', '赵强', '赵强', '330101199607077890', 1, '1996-07-07', '13800138006', 'user006@example.com', 5, '至尊会员', 58900.00, 120, 1, 'app', '192.168.1.106', 100, 0, 0, '顶级VIP用户'),
('user007', '孙丽', '孙丽', '420101199708088901', 2, '1997-08-08', '13800138007', 'user007@example.com', 2, '银卡会员,活跃用户', 1250.00, 12, 1, 'mini', '192.168.1.107', 92, 0, 0, ''),
('user008', '周杰', '周杰', '610101199809099012', 1, '1998-09-09', '13800138008', 'user008@example.com', 1, '风险用户', 200.00, 3, 1, 'h5', '192.168.1.108', 45, 1, 2, '多次异常退款，高风险');

-- ============================================
-- 初始统计数据
-- ============================================
INSERT INTO `user_statistics` (`stat_date`, `total_users`, `new_users`, `active_users`, `frozen_users`, `cancel_users`, `risk_users`, `total_amount`, `avg_user_amount`, `level1_users`, `level2_users`, `level3_users`, `level4_users`, `level5_users`) VALUES
(CURDATE(), 9, 8, 6, 1, 1, 2, 79800.47, 9975.06, 3, 3, 1, 1, 1);
