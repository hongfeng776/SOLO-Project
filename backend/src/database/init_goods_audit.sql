-- ============================================================
-- 商品审核状态管控 - 数据库SQL脚本
-- 包含：审核主表、检查项、超时预警、重提记录 4张表
-- ============================================================

-- 1. 审核主表 goods_audit_mains (8种审核状态流转)
CREATE TABLE IF NOT EXISTS `goods_audit_mains` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '审核ID',
  `goods_id` BIGINT UNSIGNED NOT NULL COMMENT '商品ID',
  `audit_no` VARCHAR(50) NOT NULL COMMENT '审核单号 AUD+yyyyMMdd+4位序号',
  `merchant_id` BIGINT UNSIGNED NOT NULL COMMENT '商家ID',
  `risk_level` TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '风险等级：1低风险 2中风险 3高风险',
  `merchant_credit_score` INT NOT NULL DEFAULT 100 COMMENT '商家信用分(审核时快照)',
  `status` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '审核状态：0待初审 1初审通过待复审 2初审驳回 3复审通过 4复审驳回 5补充材料中 6审核冻结 7已撤回',
  `initial_reviewer_id` BIGINT UNSIGNED NULL COMMENT '初审人ID',
  `initial_result` TINYINT UNSIGNED NULL COMMENT '初审结果：1通过 2驳回 3转人工',
  `initial_remark` VARCHAR(500) NULL COMMENT '初审备注',
  `initial_reviewed_at` DATETIME NULL COMMENT '初审时间',
  `final_reviewer_id` BIGINT UNSIGNED NULL COMMENT '复审人ID',
  `final_result` TINYINT UNSIGNED NULL COMMENT '复审结果：1通过 2驳回',
  `final_remark` VARCHAR(500) NULL COMMENT '复审备注(驳回原因)',
  `final_reviewed_at` DATETIME NULL COMMENT '复审时间',
  `reject_reasons_json` JSON NULL COMMENT '驳回原因明细，格式：[{"field":"price","reason":"价格异常偏低","suggestion":"建议调整至市场合理区间"}]',
  `supplement_deadline` DATETIME NULL COMMENT '补充材料截止时间',
  `supplement_count` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '补充材料次数',
  `submit_at` DATETIME NOT NULL COMMENT '提交审核时间',
  `timeout_hours` INT UNSIGNED NOT NULL DEFAULT 48 COMMENT '审核时效(小时)',
  `timeout_flag` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '超时标记：0正常 1超时',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_audit_no` (`audit_no`),
  KEY `idx_goods_id` (`goods_id`),
  KEY `idx_merchant` (`merchant_id`),
  KEY `idx_status` (`status`),
  KEY `idx_risk` (`risk_level`),
  KEY `idx_submit_at` (`submit_at`),
  KEY `idx_timeout` (`timeout_flag`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商品审核主表';

-- 2. 审核检查项表 goods_audit_items (四大条件细分检查)
CREATE TABLE IF NOT EXISTS `goods_audit_items` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '检查项ID',
  `audit_id` BIGINT UNSIGNED NOT NULL COMMENT '审核主表ID',
  `category` VARCHAR(50) NOT NULL COMMENT '检查分类：info_complete信息完整性 qualification资质有效性 category_compliance类目合规 image_text_compliance图片文案合规',
  `item_name` VARCHAR(100) NOT NULL COMMENT '检查项名称',
  `item_code` VARCHAR(50) NOT NULL COMMENT '检查项编码',
  `check_result` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '检查结果：0未检查 1通过 2不通过 3需补充',
  `required` TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '是否必填：0否 1是',
  `detail` VARCHAR(500) NULL COMMENT '检查详情/问题描述',
  `suggestion` VARCHAR(500) NULL COMMENT '补齐建议',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_audit_id` (`audit_id`),
  KEY `idx_category` (`category`),
  KEY `idx_result` (`check_result`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商品审核检查项表';

-- 3. 审核超时预警表 goods_audit_timeouts
CREATE TABLE IF NOT EXISTS `goods_audit_timeouts` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '预警ID',
  `audit_id` BIGINT UNSIGNED NOT NULL COMMENT '审核主表ID',
  `goods_id` BIGINT UNSIGNED NOT NULL COMMENT '商品ID',
  `merchant_id` BIGINT UNSIGNED NOT NULL COMMENT '商家ID',
  `timeout_type` TINYINT UNSIGNED NOT NULL COMMENT '超时类型：1初审超时 2复审超时 3补充材料超时',
  `deadline` DATETIME NOT NULL COMMENT '截止时间',
  `actual_time` DATETIME NULL COMMENT '实际处理时间',
  `status` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '状态：0未处理 1已处理 2已豁免',
  `handler_id` BIGINT UNSIGNED NULL COMMENT '处理人ID',
  `handle_remark` VARCHAR(500) NULL COMMENT '处理备注',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_audit` (`audit_id`),
  KEY `idx_status` (`status`),
  KEY `idx_deadline` (`deadline`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='审核超时预警表';

-- 4. 修改重提记录表 goods_audit_resubmits
CREATE TABLE IF NOT EXISTS `goods_audit_resubmits` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '重提ID',
  `audit_id` BIGINT UNSIGNED NOT NULL COMMENT '关联审核主表ID',
  `goods_id` BIGINT UNSIGNED NOT NULL COMMENT '商品ID',
  `resubmit_no` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT '第N次重提',
  `previous_status` TINYINT UNSIGNED NOT NULL COMMENT '重提前状态',
  `change_fields` JSON NULL COMMENT '本次修改字段，格式：["price","images","description"]',
  `supplement_materials_json` JSON NULL COMMENT '补充材料，格式：[{"name":"营业执照","url":"/files/xxx.jpg","type":"image"}]',
  `submitter_id` BIGINT UNSIGNED NOT NULL COMMENT '提交人ID',
  `submit_at` DATETIME NOT NULL COMMENT '提交时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_audit` (`audit_id`),
  KEY `idx_goods` (`goods_id`),
  KEY `idx_submit` (`submit_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='审核修改重提记录表';

-- ============================================================
-- 测试数据 (可选)
-- ============================================================

-- 审核主表测试数据 (8种状态各1条 + 超时场景)
INSERT INTO `goods_audit_mains` (`id`, `goods_id`, `audit_no`, `merchant_id`, `risk_level`, `merchant_credit_score`, `status`, `initial_reviewer_id`, `initial_result`, `initial_remark`, `initial_reviewed_at`, `final_reviewer_id`, `final_result`, `final_remark`, `final_reviewed_at`, `reject_reasons_json`, `supplement_deadline`, `supplement_count`, `submit_at`, `timeout_hours`, `timeout_flag`) VALUES
(1, 1, 'AUD202606150001', 1, 1, 95, 3, 2, 1, '自动初审通过', '2026-06-15 10:30:00', 1, 1, '复审通过，商品合规', '2026-06-15 14:00:00', NULL, NULL, 0, '2026-06-15 09:00:00', 48, 0),
(2, 2, 'AUD202606150002', 1, 1, 95, 1, NULL, 1, '自动初审通过-低风险', '2026-06-15 10:31:00', NULL, NULL, NULL, NULL, NULL, NULL, 0, '2026-06-15 09:30:00', 48, 0),
(3, 3, 'AUD202606160001', 2, 2, 75, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, '2026-06-16 11:00:00', 48, 0),
(4, 4, 'AUD202606160002', 2, 3, 55, 2, 2, 2, '高风险商品，资质材料缺失', '2026-06-16 11:30:00', NULL, NULL, NULL, NULL, '[{"field":"qualification","reason":"缺少3C认证","suggestion":"请上传3C认证证书"},{"field":"price","reason":"价格异常偏低","suggestion":"建议调整至市场合理区间"}]', NULL, 0, '2026-06-16 10:00:00', 24, 0),
(5, 5, 'AUD202606160003', 1, 2, 80, 4, 2, 1, '初审通过', '2026-06-16 09:00:00', 1, 2, '商品图片分辨率不达标，主图低于750px宽度', '2026-06-16 15:00:00', '[{"field":"images","reason":"主图分辨率不足750px","suggestion":"请上传至少750x300分辨率的商品图片"},{"field":"description","reason":"商品描述含极限词","suggestion":"请移除国家级、最高级等极限词"}]', NULL, 0, '2026-06-16 08:00:00', 48, 0),
(6, 6, 'AUD202606140001', 2, 2, 70, 5, 2, 1, '初审通过', '2026-06-14 10:00:00', NULL, NULL, NULL, NULL, NULL, '2026-06-20 23:59:59', 1, '2026-06-14 09:00:00', 48, 0),
(7, 7, 'AUD202606130001', 1, 1, 90, 6, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, '2026-06-13 14:00:00', 48, 0),
(8, 8, 'AUD202606170001', 2, 3, 50, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, '2026-06-17 08:00:00', 24, 1);

-- 审核检查项测试数据 (审核#1 完整检查4类12项)
INSERT INTO `goods_audit_items` (`audit_id`, `category`, `item_name`, `item_code`, `check_result`, `required`, `detail`, `suggestion`) VALUES
(1, 'info_complete', '商品名称', 'name', 1, 1, '已填写', NULL),
(1, 'info_complete', '商品分类', 'category', 1, 1, '已选择三级分类', NULL),
(1, 'info_complete', '商品价格', 'price', 1, 1, '价格合理', NULL),
(1, 'info_complete', '商品库存', 'stock', 1, 1, '库存充足', NULL),
(1, 'qualification', '营业执照', 'business_license', 1, 1, '有效期至2028-12', NULL),
(1, 'qualification', '3C认证', 'ccc_cert', 1, 1, '有效期至2027-06', NULL),
(1, 'qualification', '品牌授权', 'brand_auth', 1, 1, '授权有效期至2027-12', NULL),
(1, 'category_compliance', '必填规格', 'spec_required', 1, 1, '运行内存/存储/颜色已填', NULL),
(1, 'category_compliance', '合规规则', 'compliance_rules', 1, 1, '价格范围合规', NULL),
(1, 'image_text_compliance', '主图检查', 'main_image', 1, 1, '5张主图，分辨率1200x800', NULL),
(1, 'image_text_compliance', '敏感词', 'sensitive_word', 1, 1, '标题+描述无敏感词', NULL),
(1, 'image_text_compliance', '极限词', 'extreme_word', 1, 1, '无违规极限词', NULL);

-- 审核检查项 - 驳回场景(审核#4 不通过项)
INSERT INTO `goods_audit_items` (`audit_id`, `category`, `item_name`, `item_code`, `check_result`, `required`, `detail`, `suggestion`) VALUES
(4, 'info_complete', '商品名称', 'name', 1, 1, '已填写', NULL),
(4, 'info_complete', '商品价格', 'price', 2, 1, '价格异常偏低(市场价1/3)', '建议调整至市场合理区间'),
(4, 'qualification', '3C认证', 'ccc_cert', 2, 1, '缺少3C认证证书', '请上传3C认证证书'),
(4, 'qualification', '品牌授权', 'brand_auth', 3, 1, '授权即将到期(剩余7天)', '请续期品牌授权'),
(4, 'image_text_compliance', '主图检查', 'main_image', 2, 1, '仅1张主图(要求≥3张)', '请补充至少2张商品主图');

-- 超时预警测试数据
INSERT INTO `goods_audit_timeouts` (`audit_id`, `goods_id`, `merchant_id`, `timeout_type`, `deadline`, `actual_time`, `status`, `handler_id`, `handle_remark`) VALUES
(8, 8, 2, 1, '2026-06-18 08:00:00', NULL, 0, NULL, NULL),
(7, 7, 1, 2, '2026-06-15 14:00:00', '2026-06-16 09:00:00', 1, 1, '冻结处理，等待商家补充材料');

-- 重提记录测试数据
INSERT INTO `goods_audit_resubmits` (`audit_id`, `goods_id`, `resubmit_no`, `previous_status`, `change_fields`, `supplement_materials_json`, `submitter_id`, `submit_at`) VALUES
(6, 6, 1, 4, '["images","description"]', '[{"name":"更新主图","url":"/files/merchant2/new_main.jpg","type":"image"},{"name":"修改描述","url":"/files/merchant2/desc_v2.pdf","type":"document"}]', 2, '2026-06-16 10:00:00'),
(6, 6, 2, 5, '["price"]', '[{"name":"价格说明函","url":"/files/merchant2/price_explain.pdf","type":"document"}]', 2, '2026-06-17 09:00:00');
