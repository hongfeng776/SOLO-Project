-- ============================================================
-- 商品类目分类管理 - 数据库扩展SQL脚本
-- 包含：类目表扩展字段、类目日志表、类目权限表
-- ============================================================

-- 1. 类目表扩展字段 (在已有categories表基础上ALTER新增)
-- 执行前请先备份！
-- ALTER TABLE `categories` 新增字段语句：

-- 1.1 类目编码 (全局唯一索引，用于编码唯一性校验)
-- ALTER TABLE `categories` ADD COLUMN `code` VARCHAR(50) NULL COMMENT '类目编码' AFTER `id`;
-- ALTER TABLE `categories` ADD UNIQUE KEY `uk_code` (`code`);

-- 1.2 类目图标
-- ALTER TABLE `categories` ADD COLUMN `icon` VARCHAR(255) NULL COMMENT '类目图标' AFTER `name`;

-- 1.3 类目层级最大深度限制
-- ALTER TABLE `categories` ADD COLUMN `level_limit` TINYINT UNSIGNED NOT NULL DEFAULT 3 COMMENT '该层级允许最大深度' AFTER `sort`;

-- 1.4 是否含子类目标记 (自动冗余)
-- ALTER TABLE `categories` ADD COLUMN `has_children` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '是否含子类目：0否1是' AFTER `level_limit`;

-- 1.5 绑定商品数量 (自动冗余，用于联动校验)
-- ALTER TABLE `categories` ADD COLUMN `product_count` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '该类目下绑定商品数量' AFTER `has_children`;

-- 1.6 创建人和更新人 (用于权限和溯源)
-- ALTER TABLE `categories` ADD COLUMN `created_by` BIGINT UNSIGNED NULL COMMENT '创建人ID' AFTER `compliance_rules_json`;
-- ALTER TABLE `categories` ADD COLUMN `updated_by` BIGINT UNSIGNED NULL COMMENT '更新人ID' AFTER `created_by`;

-- ============================================================
-- 2. 类目操作日志表 (用于层级调整溯源、编辑日志、变更记录)
-- ============================================================
CREATE TABLE IF NOT EXISTS `category_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '日志ID',
  `category_id` BIGINT UNSIGNED NOT NULL COMMENT '类目ID',
  `operator_id` BIGINT UNSIGNED NOT NULL COMMENT '操作人ID',
  `operator_type` TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '操作人类型：1-超级管理员 2-普通运维 3-商家 4-系统',
  `action` VARCHAR(50) NOT NULL COMMENT '动作：create=创建 update=编辑 enable=启用 disable=禁用 sort=排序 move=移动 delete=删除',
  `old_data_json` JSON NULL COMMENT '变更前数据快照，格式：{"parent_id":0,"name":"数码","sort":1,"status":1,"level":1}',
  `new_data_json` JSON NULL COMMENT '变更后数据快照',
  `changed_fields` JSON NULL COMMENT '变更字段列表，格式：["parent_id","name"]',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_category_id` (`category_id`),
  KEY `idx_operator` (`operator_id`, `operator_type`),
  KEY `idx_action` (`action`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='类目操作日志表';

-- ============================================================
-- 3. 类目权限配置表 (用于区分超级管理员/普通运维/商家不同权限范围)
-- ============================================================
CREATE TABLE IF NOT EXISTS `category_permissions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '权限配置ID',
  `category_id` BIGINT UNSIGNED NOT NULL COMMENT '类目ID',
  `role_id` BIGINT UNSIGNED NOT NULL COMMENT '角色ID：1-超级管理员 2-普通运维 3-商家 4-只读用户',
  `permission_type` TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '权限类型：1-可查看 2-可编辑 3-可新增子级 4-可批量操作',
  `scope` TINYINT UNSIGNED NOT NULL DEFAULT 2 COMMENT '权限范围：1-仅当前层级 2-含所有子级',
  `status` TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '状态：0-禁用 1-启用',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_category_role_permission` (`category_id`, `role_id`, `permission_type`),
  KEY `idx_category_role` (`category_id`, `role_id`),
  KEY `idx_permission` (`permission_type`, `scope`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='类目权限配置表';

-- ============================================================
-- 4. 测试数据 (可选)
-- ============================================================

-- 类目测试数据 (三级完整类目树)
INSERT INTO `categories`
(`id`, `parent_id`, `name`, `code`, `icon`, `level`, `sort`, `level_limit`, `status`,
 `required_fields_json`, `compliance_rules_json`, `product_count`, `has_children`,
 `created_by`, `updated_by`) VALUES
-- 一级类目
(1,  0, '数码家电',     'CAT-DIGITAL',  '/icons/cat/digital.svg',  1, 1, 3, 1,
  '[{"field":"brand_id","label":"品牌","required":true}]', NULL, 1528, 1, 1, 1),
(4,  0, '服装鞋帽',     'CAT-CLOTHING', '/icons/cat/clothing.svg', 1, 2, 3, 1,
  '[{"field":"size","label":"尺码","required":true}]', NULL, 3420, 1, 1, 1),
(6,  0, '食品生鲜',     'CAT-FOOD',     '/icons/cat/food.svg',     1, 3, 3, 1,
  '[{"field":"production_date","label":"生产日期","required":true}]', NULL, 892, 1, 1, 1),
-- 二级类目
(2,  1, '手机通讯',     'CAT-PHONE',    '/icons/cat/phone.svg',    2, 1, 3, 1,
  '[{"field":"brand_id","label":"品牌","required":true},{"field":"color","label":"颜色","required":true}]', NULL, 968, 1, 1, 1),
(7,  1, '电脑办公',     'CAT-PC',       '/icons/cat/pc.svg',       2, 2, 3, 1,
  '[{"field":"brand_id","label":"品牌","required":true}]', NULL, 560, 1, 1, 1),
(5,  4, '男装',         'CAT-MEN',      '/icons/cat/men.svg',      2, 1, 3, 1,
  '[{"field":"size","label":"尺码","required":true,"options":["S","M","L","XL","XXL"]}]', NULL, 1680, 1, 1, 1),
(8,  4, '女装',         'CAT-WOMEN',    '/icons/cat/women.svg',    2, 2, 3, 1,
  '[{"field":"size","label":"尺码","required":true}]', NULL, 1740, 1, 1, 1),
(9,  6, '水果',         'CAT-FRUIT',    '/icons/cat/fruit.svg',    2, 1, 3, 1,
  '[{"field":"origin","label":"产地","required":true}]', NULL, 456, 0, 1, 1),
-- 三级类目
(3,  2, '智能手机',     'CAT-SMARTPHONE','/icons/cat/smartphone.svg',3,1,3, 1,
  '[{"field":"brand_id","label":"品牌","required":true},{"field":"ram","label":"运行内存","required":true},{"field":"rom","label":"存储","required":true}]', '[{"field":"price","type":"range","min":99,"max":999999}]', 820, 0, 1, 1),
(10, 2, '功能手机',     'CAT-FEATURE',   '/icons/cat/feature.svg',  3, 2, 3, 1,
  '[{"field":"brand_id","label":"品牌","required":true}]', NULL, 148, 0, 1, 1),
(11, 7, '笔记本电脑',   'CAT-LAPTOP',    '/icons/cat/laptop.svg',   3, 1, 3, 1,
  '[{"field":"brand_id","label":"品牌","required":true}]', NULL, 298, 0, 1, 1),
(12, 5, 'T恤',         'CAT-T-SHIRT',   '/icons/cat/tshirt.svg',   3, 1, 3, 1,
  '[{"field":"size","label":"尺码","required":true}]', NULL, 960, 0, 1, 1),
(13, 5, '西装',         'CAT-SUIT',      '/icons/cat/suit.svg',     3, 2, 3, 1,
  '[{"field":"size","label":"尺码","required":true}]', NULL, 220, 0, 1, 1);

-- 类目操作日志测试数据
INSERT INTO `category_logs` (`category_id`, `operator_id`, `operator_type`, `action`,
  `old_data_json`, `new_data_json`, `changed_fields`) VALUES
(3, 1, 1, 'create',
  NULL,
  '{"parent_id":2,"name":"智能手机","level":3,"sort":1}',
  '["parent_id","name","level","sort"]'),
(3, 2, 2, 'update',
  '{"sort":1,"status":0}',
  '{"sort":1,"status":1}',
  '["status"]'),
(3, 1, 1, 'move',
  '{"parent_id":7}',
  '{"parent_id":2}',
  '["parent_id"]'),
(3, 1, 1, 'sort',
  '{"sort":5}',
  '{"sort":1}',
  '["sort"]'),
(5, 1, 1, 'create',
  NULL,
  '{"parent_id":4,"name":"男装","level":2}',
  '["parent_id","name","level"]'),
(5, 2, 2, 'disable',
  '{"status":1}',
  '{"status":0}',
  '["status"]'),
(5, 1, 1, 'enable',
  '{"status":0}',
  '{"status":1}',
  '["status"]');

-- 类目权限配置测试数据 (普通运维=角色2 仅可操作二级以下)
INSERT INTO `category_permissions`
(`category_id`, `role_id`, `permission_type`, `scope`, `status`) VALUES
-- 超级管理员 (角色1) 所有类目 4权限全配 (4条示例)
(1, 1, 1, 2, 1), (1, 1, 2, 2, 1), (1, 1, 3, 2, 1), (1, 1, 4, 2, 1),
(4, 1, 1, 2, 1), (4, 1, 2, 2, 1), (4, 1, 3, 2, 1), (4, 1, 4, 2, 1),
-- 普通运维 (角色2) 仅二级类目可查看+编辑，不可批量操作一级
(2, 2, 1, 2, 1), (2, 2, 2, 2, 1), (2, 2, 3, 2, 1),  -- 手机通讯可新增
(7, 2, 1, 2, 1), (7, 2, 2, 2, 1),                       -- 电脑办公仅查看编辑
(5, 2, 1, 2, 1), (5, 2, 2, 2, 1), (5, 2, 3, 2, 1),
(8, 2, 1, 2, 1), (8, 2, 2, 2, 1),
-- 商家 (角色3) 仅可查看特定类目，不可编辑
(3, 3, 1, 1, 1),
(12, 3, 1, 1, 1),
(13, 3, 1, 1, 1);
