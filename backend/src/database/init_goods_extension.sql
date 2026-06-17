-- ============================================================
-- 商品基础信息管控 - 数据库扩展表SQL脚本
-- 包含：类目、品牌、资质、授权、编辑日志、商品扩展字段
-- ============================================================

-- 1. 类目表 (三级结构，存储必填字段规则和合规校验规则)
CREATE TABLE IF NOT EXISTS `categories` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '类目ID',
  `parent_id` BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '父类目ID',
  `name` VARCHAR(100) NOT NULL COMMENT '类目名称',
  `level` TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '层级：1-一级 2-二级 3-三级',
  `sort` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '排序值',
  `status` TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '状态：0-禁用 1-启用',
  `required_fields_json` JSON NULL COMMENT '必填字段配置规则，格式：[{"field":"spec","label":"规格","required":true,"rules":[{"pattern":"^[\\s\\S]{1,200}$","message":"规格必填"}]}]',
  `compliance_rules_json` JSON NULL COMMENT '合规校验规则，格式：[{"field":"name","type":"length","min":1,"max":200,"message":"商品名称1-200字符"}]',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_parent_id` (`parent_id`),
  KEY `idx_level` (`level`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商品类目表';

-- 2. 品牌表
CREATE TABLE IF NOT EXISTS `brands` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '品牌ID',
  `name` VARCHAR(100) NOT NULL COMMENT '品牌名称',
  `logo` VARCHAR(255) NULL COMMENT '品牌LOGO',
  `description` TEXT NULL COMMENT '品牌描述',
  `status` TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '状态：0-禁用 1-启用',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_name` (`name`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='品牌表';

-- 3. 品牌授权表 (商家-品牌-类目 三级授权，含有效期)
CREATE TABLE IF NOT EXISTS `brand_authorizations` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '授权ID',
  `merchant_id` BIGINT UNSIGNED NOT NULL COMMENT '商家ID',
  `brand_id` BIGINT UNSIGNED NOT NULL COMMENT '品牌ID',
  `category_id` BIGINT UNSIGNED NOT NULL COMMENT '类目ID',
  `start_date` DATE NOT NULL COMMENT '授权开始日期',
  `end_date` DATE NOT NULL COMMENT '授权结束日期',
  `status` TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '状态：0-失效 1-有效 2-待审核',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_merchant_brand` (`merchant_id`,`brand_id`),
  KEY `idx_category` (`category_id`),
  KEY `idx_status_date` (`status`,`end_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='品牌授权表';

-- 4. 商家类目资质表
CREATE TABLE IF NOT EXISTS `merchant_qualifications` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '资质ID',
  `merchant_id` BIGINT UNSIGNED NOT NULL COMMENT '商家ID',
  `category_id` BIGINT UNSIGNED NOT NULL COMMENT '类目ID',
  `qualification_type` TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '资质类型：1-营业执照 2-食品经营 3-化妆品 4-医药品 5-3C认证 9-其他',
  `certificate_no` VARCHAR(100) NULL COMMENT '证照编号',
  `file_url` VARCHAR(255) NULL COMMENT '证照文件URL',
  `expire_date` DATE NOT NULL COMMENT '到期日期',
  `status` TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '状态：0-过期 1-有效 2-待审核',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_merchant_category` (`merchant_id`,`category_id`),
  KEY `idx_type` (`qualification_type`),
  KEY `idx_status_expire` (`status`,`expire_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商家类目资质表';

-- 5. 商品编辑日志表 (用于信息溯源，记录每次字段变更)
CREATE TABLE IF NOT EXISTS `goods_edit_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '日志ID',
  `goods_id` BIGINT UNSIGNED NOT NULL COMMENT '商品ID',
  `editor_id` BIGINT UNSIGNED NOT NULL COMMENT '编辑人ID',
  `editor_type` TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '编辑人类型：1-管理员 2-商家 3-系统',
  `old_data_json` JSON NULL COMMENT '变更前数据快照，格式：{"price":"99.00","stock":"100"}',
  `new_data_json` JSON NULL COMMENT '变更后数据快照，格式：{"price":"109.00","stock":"150"}',
  `changed_fields` JSON NULL COMMENT '变更字段列表，格式：["price","stock"]',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_goods_id` (`goods_id`),
  KEY `idx_editor` (`editor_id`,`editor_type`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商品编辑日志表';

-- 6. 商品表扩展字段 (在原有goods表基础上ALTER新增列)
-- 执行前请先备份goods表！
-- ALTER TABLE `goods` 新增字段语句：

-- 6.1 商品编码SKU，用于重复校验
-- ALTER TABLE `goods` ADD COLUMN `sku_code` VARCHAR(100) NULL COMMENT '商品SKU编码(唯一)' AFTER `id`;
-- ALTER TABLE `goods` ADD UNIQUE KEY `uk_sku_code` (`sku_code`);

-- 6.2 品牌关联ID
-- ALTER TABLE `goods` ADD COLUMN `brand_id` BIGINT UNSIGNED NULL COMMENT '品牌ID' AFTER `category_id`;
-- ALTER TABLE `goods` ADD KEY `idx_brand_id` (`brand_id`);

-- 6.3 合规评级：A(优秀)→1, B(良好)→2, C(一般)→3, D(不合格)→4
-- ALTER TABLE `goods` ADD COLUMN `compliance_rating` TINYINT UNSIGNED NOT NULL DEFAULT 2 COMMENT '合规评级：1-A 2-B 3-C 4-D' AFTER `status`;
-- ALTER TABLE `goods` ADD KEY `idx_compliance_rating` (`compliance_rating`);

-- 6.4 置顶权重与标识
-- ALTER TABLE `goods` ADD COLUMN `sort_weight` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '置顶权重(越大越前)' AFTER `compliance_rating`;
-- ALTER TABLE `goods` ADD COLUMN `top_flag` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '是否置顶：0-否 1-是' AFTER `sort_weight`;
-- ALTER TABLE `goods` ADD KEY `idx_top_sort` (`top_flag` DESC, `sort_weight` DESC);

-- 6.5 售卖时效 (用于编辑权限判断)
-- ALTER TABLE `goods` ADD COLUMN `sale_start_time` DATETIME NULL COMMENT '售卖开始时间' AFTER `top_flag`;
-- ALTER TABLE `goods` ADD COLUMN `sale_end_time` DATETIME NULL COMMENT '售卖结束时间' AFTER `sale_start_time`;

-- 6.6 营销活动标识 (用于编辑权限判断：活动中仅允许修改库存和描述)
-- ALTER TABLE `goods` ADD COLUMN `in_activity` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '是否在活动中：0-否 1-是' AFTER `sale_end_time`;

-- ============================================================
-- 测试数据 (可选)
-- ============================================================

-- 类目测试数据 (三级数码家电→手机通讯→智能手机)
INSERT INTO `categories` (`id`, `parent_id`, `name`, `level`, `sort`, `status`, `required_fields_json`, `compliance_rules_json`) VALUES
(1, 0, '数码家电', 1, 1, 1,
  '[{"field":"brand_id","label":"品牌","required":true},{"field":"spec","label":"规格参数","required":true}]',
  '[{"field":"name","type":"length","min":1,"max":200},{"field":"price","type":"range","min":0.01,"max":999999.99}]'),
(2, 1, '手机通讯', 2, 1, 1,
  '[{"field":"brand_id","label":"品牌","required":true},{"field":"spec","label":"规格参数","required":true},{"field":"color","label":"颜色","required":true}]',
  '[{"field":"price","type":"range","min":1,"max":999999}]'),
(3, 2, '智能手机', 3, 1, 1,
  '[{"field":"brand_id","label":"品牌","required":true},{"field":"spec","label":"规格参数","required":true,"rules":[{"pattern":"^.+\\|.+\\|.+$","message":"格式：内存|存储|颜色"}]},{"field":"color","label":"颜色","required":true},{"field":"ram","label":"运行内存","required":true},{"field":"rom","label":"机身存储","required":true}]',
  '[{"field":"price","type":"range","min":99,"max":999999}]'),
(4, 0, '服装鞋帽', 1, 2, 1,
  '[{"field":"brand_id","label":"品牌","required":false},{"field":"size","label":"尺码","required":true}]',
  NULL),
(5, 4, '男装', 2, 1, 1,
  '[{"field":"size","label":"尺码","required":true,"options":["S","M","L","XL","XXL"]}]',
  NULL);

-- 品牌测试数据
INSERT INTO `brands` (`id`, `name`, `logo`, `description`, `status`) VALUES
(1, '华为', '/images/brands/huawei.png', '华为技术有限公司旗下消费电子品牌', 1),
(2, '小米', '/images/brands/xiaomi.png', '小米集团旗下智能硬件品牌', 1),
(3, '苹果', '/images/brands/apple.png', 'Apple Inc. 全球消费电子品牌', 1),
(4, 'Nike', '/images/brands/nike.png', '耐克国际运动品牌', 1),
(5, '阿迪达斯', '/images/brands/adidas.png', '阿迪达斯国际运动品牌', 1);

-- 品牌授权测试数据 (商家ID=1 华为 智能手机授权到2027-12-31)
INSERT INTO `brand_authorizations` (`merchant_id`, `brand_id`, `category_id`, `start_date`, `end_date`, `status`) VALUES
(1, 1, 3, '2024-01-01', '2027-12-31', 1),
(1, 2, 3, '2024-06-01', '2026-06-01', 1),
(2, 3, 3, '2023-01-01', '2025-12-31', 1),
(2, 4, 4, '2022-01-01', '2026-12-31', 1),
(1, 4, 4, '2025-01-01', '2025-06-30', 2);

-- 商家资质测试数据
INSERT INTO `merchant_qualifications` (`merchant_id`, `category_id`, `qualification_type`, `certificate_no`, `file_url`, `expire_date`, `status`) VALUES
(1, 1, 1, '91110000MA01ABCD01', '/files/merchant1/license.jpg', '2028-12-31', 1),
(1, 3, 5, '20240101-3C-001', '/files/merchant1/3c_smartphone.pdf', '2026-01-01', 1),
(2, 1, 1, '91310000MA01EFGH02', '/files/merchant2/license.jpg', '2029-06-30', 1),
(2, 3, 5, '20230601-3C-088', '/files/merchant2/3c_iphone.pdf', '2025-12-31', 1),
(2, 4, 9, 'FZ-2024-CLOTH-002', '/files/merchant2/clothing_cert.pdf', '2025-08-01', 1),
(1, 4, 9, 'FZ-2024-CLOTH-001', '/files/merchant1/clothing_cert_expired.pdf', '2025-01-01', 0);

-- 商品测试数据 (示例，需要符合goods表结构配合使用)
-- 建议业务数据测试时：商品编码SKU001华为，商家ID=1，类目3 合规评级A，置顶标识1
