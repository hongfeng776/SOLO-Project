-- 数据库初始化脚本
-- 创建时间: 2026-06-16

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 创建数据库
CREATE DATABASE IF NOT EXISTS annotation_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE annotation_db;

-- 管理员表
DROP TABLE IF EXISTS `admins`;
CREATE TABLE `admins` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `username` varchar(50) NOT NULL COMMENT '用户名',
  `password` varchar(255) NOT NULL COMMENT '密码',
  `nickname` varchar(50) DEFAULT NULL COMMENT '昵称',
  `avatar` varchar(255) DEFAULT NULL COMMENT '头像',
  `role` tinyint unsigned DEFAULT 2 COMMENT '角色：1-超级管理员 2-普通管理员',
  `status` tinyint unsigned DEFAULT 1 COMMENT '状态：0-禁用 1-启用',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员表';

-- 用户表
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `username` varchar(50) NOT NULL COMMENT '用户名',
  `phone` varchar(20) DEFAULT NULL COMMENT '手机号',
  `email` varchar(100) DEFAULT NULL COMMENT '邮箱',
  `avatar` varchar(255) DEFAULT NULL COMMENT '头像',
  `status` tinyint unsigned DEFAULT 1 COMMENT '状态：0-禁用 1-启用',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  UNIQUE KEY `uk_phone` (`phone`),
  UNIQUE KEY `uk_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 商家表
DROP TABLE IF EXISTS `merchants`;
CREATE TABLE `merchants` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `name` varchar(255) NOT NULL COMMENT '商家名称',
  `contact` varchar(50) DEFAULT NULL COMMENT '联系人',
  `phone` varchar(20) DEFAULT NULL COMMENT '联系电话',
  `address` varchar(255) DEFAULT NULL COMMENT '地址',
  `status` tinyint unsigned DEFAULT 1 COMMENT '状态：0-禁用 1-启用',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商家表';

-- 商品表
DROP TABLE IF EXISTS `goods`;
CREATE TABLE `goods` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `name` varchar(255) NOT NULL COMMENT '商品名称',
  `category_id` bigint unsigned DEFAULT NULL COMMENT '分类ID',
  `price` decimal(10,2) NOT NULL COMMENT '售价',
  `original_price` decimal(10,2) DEFAULT NULL COMMENT '原价',
  `stock` int unsigned DEFAULT 0 COMMENT '库存',
  `sales` int unsigned DEFAULT 0 COMMENT '销量',
  `status` tinyint unsigned DEFAULT 1 COMMENT '状态：0-下架 1-上架',
  `cover_image` varchar(255) DEFAULT NULL COMMENT '封面图',
  `description` text COMMENT '商品描述',
  `merchant_id` bigint unsigned DEFAULT NULL COMMENT '商家ID',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_category_id` (`category_id`),
  KEY `idx_merchant_id` (`merchant_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商品表';

-- 订单表
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `order_no` varchar(32) NOT NULL COMMENT '订单号',
  `user_id` bigint unsigned NOT NULL COMMENT '用户ID',
  `total_amount` decimal(10,2) NOT NULL COMMENT '订单总金额',
  `pay_amount` decimal(10,2) NOT NULL COMMENT '实付金额',
  `status` tinyint unsigned DEFAULT 0 COMMENT '订单状态：0-待付款 1-待发货 2-待收货 3-已完成 4-已取消',
  `pay_status` tinyint unsigned DEFAULT 0 COMMENT '支付状态：0-未支付 1-已支付',
  `pay_time` datetime DEFAULT NULL COMMENT '支付时间',
  `shipping_status` tinyint unsigned DEFAULT 0 COMMENT '发货状态：0-未发货 1-已发货',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_no` (`order_no`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单表';

-- 售后表
DROP TABLE IF EXISTS `after_sales`;
CREATE TABLE `after_sales` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `order_id` bigint unsigned NOT NULL COMMENT '订单ID',
  `user_id` bigint unsigned NOT NULL COMMENT '用户ID',
  `type` tinyint unsigned DEFAULT NULL COMMENT '售后类型：1-退款 2-退货退款 3-换货',
  `status` tinyint unsigned DEFAULT 0 COMMENT '状态：0-待处理 1-处理中 2-已完成 3-已拒绝',
  `reason` text COMMENT '申请原因',
  `amount` decimal(10,2) DEFAULT NULL COMMENT '退款金额',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='售后表';

-- 营销活动表
DROP TABLE IF EXISTS `marketings`;
CREATE TABLE `marketings` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `name` varchar(255) NOT NULL COMMENT '活动名称',
  `type` tinyint unsigned DEFAULT NULL COMMENT '活动类型：1-折扣 2-满减 3-优惠券',
  `status` tinyint unsigned DEFAULT 0 COMMENT '状态：0-未开始 1-进行中 2-已结束',
  `start_time` datetime DEFAULT NULL COMMENT '开始时间',
  `end_time` datetime DEFAULT NULL COMMENT '结束时间',
  `discount` decimal(5,2) DEFAULT NULL COMMENT '折扣率/减免金额',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`),
  KEY `idx_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='营销活动表';

-- 初始数据：管理员 admin/admin123
INSERT INTO `admins` (`username`, `password`, `nickname`, `role`, `status`) VALUES
('admin', '$2a$10$W8tlhA17QaKH1FWkxKV1UOqRixBz2euveCV4Mmano/421TANp5rea', '超级管理员', 1, 1);

-- 初始数据：测试商家
INSERT INTO `merchants` (`name`, `contact`, `phone`, `address`, `status`) VALUES
('示例商家', '张三', '13800138000', '北京市朝阳区示例路123号', 1),
('优选商城', '李四', '13900139000', '上海市浦东新区示例路456号', 1);

-- 初始数据：测试用户
INSERT INTO `users` (`username`, `phone`, `email`, `status`) VALUES
('testuser', '13000130000', 'test@example.com', 1);

-- 初始数据：测试商品
INSERT INTO `goods` (`name`, `price`, `original_price`, `stock`, `sales`, `status`, `merchant_id`, `description`) VALUES
('示例商品1', 99.99, 199.00, 100, 50, 1, 1, '这是一个示例商品描述'),
('示例商品2', 199.99, 299.00, 200, 30, 1, 1, '这是第二个示例商品描述');

-- 初始数据：测试订单
INSERT INTO `orders` (`order_no`, `user_id`, `total_amount`, `pay_amount`, `status`, `pay_status`, `pay_time`, `shipping_status`) VALUES
('ORD202606160001', 1, 299.97, 299.97, 3, 1, '2026-06-15 10:30:00', 1);

-- 初始数据：测试售后
INSERT INTO `after_sales` (`order_id`, `user_id`, `type`, `status`, `reason`, `amount`) VALUES
(1, 1, 1, 0, '商品质量问题', 99.99);

-- 初始数据：测试营销活动
INSERT INTO `marketings` (`name`, `type`, `status`, `start_time`, `end_time`, `discount`) VALUES
('新品折扣活动', 1, 1, '2026-06-01 00:00:00', '2026-06-30 23:59:59', 80.00);

SET FOREIGN_KEY_CHECKS = 1;
