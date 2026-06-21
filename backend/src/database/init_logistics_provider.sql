-- =====================================================
-- 物流供应链管理体系 - 上游合作方管控底座 扩展表结构
-- 创建日期: 2026-06-22
-- =====================================================

-- 1. 重建 logistics_providers 表（扩展字段）
DROP TABLE IF EXISTS `logistics_providers`;
CREATE TABLE `logistics_providers` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `provider_code` VARCHAR(32) NOT NULL COMMENT '物流服务商编码（格式：WL+6位数字）',
  `provider_name` VARCHAR(100) NOT NULL COMMENT '物流服务商名称',
  `logo` VARCHAR(200) DEFAULT NULL COMMENT '物流服务商logo',
  `level` TINYINT UNSIGNED DEFAULT 1 COMMENT '服务商等级：1-入门级 2-青铜 3-白银 4-黄金 5-铂金',
  `status` TINYINT UNSIGNED DEFAULT 1 COMMENT '状态：0-禁用 1-启用 2-待审核 3-已归档',
  `cooperation_status` TINYINT UNSIGNED DEFAULT 0 COMMENT '合作状态：0-未合作 1-合作中 2-合作暂停 3-合作终止',
  `cooperation_effective_date` DATETIME DEFAULT NULL COMMENT '合作生效日期',
  `cooperation_terminate_date` DATETIME DEFAULT NULL COMMENT '合作终止日期',
  `contact_person` VARCHAR(50) DEFAULT NULL COMMENT '联系人',
  `contact_phone` VARCHAR(20) DEFAULT NULL COMMENT '联系电话',
  `contact_email` VARCHAR(100) DEFAULT NULL COMMENT '联系邮箱',
  `registered_address` VARCHAR(200) DEFAULT NULL COMMENT '公司注册地址',
  `credit_code` VARCHAR(18) DEFAULT NULL COMMENT '统一社会信用代码',
  `business_license_no` VARCHAR(15) DEFAULT NULL COMMENT '营业执照注册号',
  `legal_person` VARCHAR(100) DEFAULT NULL COMMENT '企业法人姓名',
  `legal_id_card` VARCHAR(18) DEFAULT NULL COMMENT '法人身份证号',
  `business_license_url` VARCHAR(200) DEFAULT NULL COMMENT '营业执照图片URL',
  `license_valid_from` DATETIME DEFAULT NULL COMMENT '营业执照有效期起',
  `license_valid_to` DATETIME DEFAULT NULL COMMENT '营业执照有效期止',
  `road_transport_license_url` VARCHAR(200) DEFAULT NULL COMMENT '道路运输经营许可证URL',
  `road_transport_valid_to` DATETIME DEFAULT NULL COMMENT '道路运输许可证有效期止',
  `service_province` VARCHAR(50) DEFAULT NULL COMMENT '服务覆盖省份（多个逗号分隔）',
  `service_cities` VARCHAR(200) DEFAULT NULL COMMENT '服务覆盖城市（多个逗号分隔）',
  `branch_count` INT UNSIGNED DEFAULT 0 COMMENT '网点总数',
  `cross_province_timeliness` DECIMAL(10,2) DEFAULT NULL COMMENT '跨省时效承诺（小时）',
  `intra_province_timeliness` DECIMAL(10,2) DEFAULT NULL COMMENT '省内时效承诺（小时）',
  `first_weight_fee` DECIMAL(10,2) DEFAULT 0.00 COMMENT '首重资费（元/kg）',
  `additional_weight_fee` DECIMAL(10,2) DEFAULT 0.00 COMMENT '续重资费（元/kg）',
  `base_service_fee` DECIMAL(10,2) DEFAULT 0.00 COMMENT '基础服务费（元/单）',
  `daily_order_limit` INT UNSIGNED DEFAULT 100 COMMENT '合作权限额度（日最大单量）',
  `support_cod` TINYINT(1) DEFAULT 0 COMMENT '是否支持COD货到付款',
  `support_cold_chain` TINYINT(1) DEFAULT 0 COMMENT '是否支持冷链运输',
  `support_oversized` TINYINT(1) DEFAULT 0 COMMENT '是否支持大件运输',
  `support_pickup` TINYINT(1) DEFAULT 1 COMMENT '是否支持上门取件',
  `match_priority` INT UNSIGNED DEFAULT 0 COMMENT '匹配优先级（数字越大优先级越高）',
  `api_url` VARCHAR(200) DEFAULT NULL COMMENT '接口地址',
  `api_key` VARCHAR(100) DEFAULT NULL COMMENT 'API密钥',
  `api_secret` VARCHAR(100) DEFAULT NULL COMMENT 'API密钥Secret',
  `service_score` DECIMAL(10,2) DEFAULT NULL COMMENT '服务评分（0-5分）',
  `on_time_rate` DECIMAL(10,4) DEFAULT NULL COMMENT '准时率（0-1）',
  `damage_rate` DECIMAL(10,4) DEFAULT NULL COMMENT '破损率（0-1）',
  `loss_rate` DECIMAL(10,4) DEFAULT NULL COMMENT '丢失率（0-1）',
  `total_orders` INT UNSIGNED DEFAULT 0 COMMENT '合作累计单量',
  `total_amount` DECIMAL(14,2) DEFAULT 0.00 COMMENT '合作累计金额',
  `qualification_intro` TEXT DEFAULT NULL COMMENT '资质详细介绍（超长内容）',
  `remark` VARCHAR(1000) DEFAULT NULL COMMENT '备注',
  `created_by` BIGINT UNSIGNED DEFAULT NULL COMMENT '创建人ID',
  `created_by_name` VARCHAR(50) DEFAULT NULL COMMENT '创建人名称',
  `updated_by` BIGINT UNSIGNED DEFAULT NULL COMMENT '更新人ID',
  `updated_by_name` VARCHAR(50) DEFAULT NULL COMMENT '更新人名称',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_provider_code` (`provider_code`),
  UNIQUE KEY `uk_credit_code` (`credit_code`),
  UNIQUE KEY `uk_business_license_no` (`business_license_no`),
  KEY `idx_provider_name` (`provider_name`),
  KEY `idx_level` (`level`),
  KEY `idx_status` (`status`),
  KEY `idx_cooperation_status` (`cooperation_status`),
  KEY `idx_province` (`service_province`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_cooperation_effective_date` (`cooperation_effective_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='物流服务商主表';

-- =====================================================
-- 2. 物流服务商资质表
-- =====================================================
DROP TABLE IF EXISTS `logistics_provider_qualifications`;
CREATE TABLE `logistics_provider_qualifications` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `provider_id` BIGINT UNSIGNED NOT NULL COMMENT '物流服务商ID',
  `qualification_type` VARCHAR(50) NOT NULL COMMENT '资质类型：business_license/road_transport等',
  `qualification_name` VARCHAR(100) DEFAULT NULL COMMENT '资质类型名称',
  `certificate_no` VARCHAR(50) DEFAULT NULL COMMENT '资质证件编号',
  `certificate_holder` VARCHAR(100) DEFAULT NULL COMMENT '证件持有人名称',
  `certificate_file_url` VARCHAR(200) DEFAULT NULL COMMENT '资质证件图片URL',
  `valid_from` DATETIME DEFAULT NULL COMMENT '资质生效日期',
  `expire_date` DATETIME DEFAULT NULL COMMENT '资质过期日期',
  `status` TINYINT UNSIGNED DEFAULT 0 COMMENT '资质状态：0-待审核 1-有效 2-已过期 3-无效 4-审核中',
  `audit_remark` VARCHAR(500) DEFAULT NULL COMMENT '审核意见',
  `audited_by` BIGINT UNSIGNED DEFAULT NULL COMMENT '审核人ID',
  `audited_by_name` VARCHAR(50) DEFAULT NULL COMMENT '审核人名称',
  `audited_at` DATETIME DEFAULT NULL COMMENT '审核时间',
  `description` TEXT DEFAULT NULL COMMENT '资质详细说明',
  `created_by` BIGINT UNSIGNED DEFAULT NULL COMMENT '创建人ID',
  `created_by_name` VARCHAR(50) DEFAULT NULL COMMENT '创建人名称',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_certificate_no` (`certificate_no`),
  KEY `idx_provider_id` (`provider_id`),
  KEY `idx_qualification_type` (`qualification_type`),
  KEY `idx_status` (`status`),
  KEY `idx_expire_date` (`expire_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='物流服务商资质表';

-- =====================================================
-- 3. 物流网点覆盖表
-- =====================================================
DROP TABLE IF EXISTS `logistics_branch_networks`;
CREATE TABLE `logistics_branch_networks` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `branch_code` VARCHAR(32) DEFAULT NULL COMMENT '网点编码',
  `provider_id` BIGINT UNSIGNED NOT NULL COMMENT '物流服务商ID',
  `branch_name` VARCHAR(100) NOT NULL COMMENT '网点名称',
  `branch_type` VARCHAR(50) DEFAULT NULL COMMENT '网点类型：直营/加盟/转运/分拣/自提',
  `province` VARCHAR(20) DEFAULT NULL COMMENT '省份',
  `city` VARCHAR(20) DEFAULT NULL COMMENT '城市',
  `district` VARCHAR(20) DEFAULT NULL COMMENT '区县',
  `address` VARCHAR(200) DEFAULT NULL COMMENT '详细地址',
  `latitude` DECIMAL(10,6) DEFAULT NULL COMMENT '纬度',
  `longitude` DECIMAL(10,6) DEFAULT NULL COMMENT '经度',
  `manager_name` VARCHAR(50) DEFAULT NULL COMMENT '网点负责人',
  `contact_phone` VARCHAR(20) DEFAULT NULL COMMENT '联系电话',
  `contact_email` VARCHAR(100) DEFAULT NULL COMMENT '联系邮箱',
  `business_hours` VARCHAR(20) DEFAULT NULL COMMENT '营业时间',
  `daily_capacity` INT UNSIGNED DEFAULT 0 COMMENT '日处理单量上限',
  `coverage_radius` DECIMAL(10,2) DEFAULT 0.00 COMMENT '覆盖半径（公里）',
  `status` TINYINT UNSIGNED DEFAULT 1 COMMENT '状态：0-未启用 1-正常营业 2-临时关闭 3-永久关闭',
  `service_priority` INT UNSIGNED DEFAULT 0 COMMENT '服务优先级（同一区域内）',
  `service_scope` TEXT DEFAULT NULL COMMENT '服务范围说明',
  `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
  `created_by` BIGINT UNSIGNED DEFAULT NULL COMMENT '创建人ID',
  `created_by_name` VARCHAR(50) DEFAULT NULL COMMENT '创建人名称',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_branch_code` (`branch_code`),
  KEY `idx_provider_id` (`provider_id`),
  KEY `idx_province` (`province`),
  KEY `idx_city` (`city`),
  KEY `idx_district` (`district`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='物流网点覆盖表';

-- =====================================================
-- 4. 物流资费标准表
-- =====================================================
DROP TABLE IF EXISTS `logistics_fee_standards`;
CREATE TABLE `logistics_fee_standards` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `provider_id` BIGINT UNSIGNED NOT NULL COMMENT '物流服务商ID',
  `fee_type` VARCHAR(50) NOT NULL COMMENT '资费类型：standard/express/economy等',
  `fee_name` VARCHAR(100) DEFAULT NULL COMMENT '资费方案名称',
  `from_province` VARCHAR(20) DEFAULT NULL COMMENT '起始省份',
  `from_city` VARCHAR(20) DEFAULT NULL COMMENT '起始城市（为空表示全省）',
  `to_province` VARCHAR(20) DEFAULT NULL COMMENT '目标省份',
  `to_city` VARCHAR(20) DEFAULT NULL COMMENT '目标城市（为空表示全省）',
  `weight_unit` VARCHAR(10) DEFAULT 'kg' COMMENT '计费重量单位：kg/g',
  `first_weight` DECIMAL(10,3) DEFAULT 1.000 COMMENT '首重重量',
  `first_weight_fee` DECIMAL(10,2) DEFAULT 0.00 COMMENT '首重费用（元）',
  `additional_weight_step` DECIMAL(10,3) DEFAULT 1.000 COMMENT '续重重量步长',
  `additional_weight_fee` DECIMAL(10,2) DEFAULT 0.00 COMMENT '续重费用（元/步长）',
  `base_service_fee` DECIMAL(10,2) DEFAULT 0.00 COMMENT '基础服务费（元/单）',
  `min_fee` DECIMAL(10,2) DEFAULT 0.00 COMMENT '最低收费（元）',
  `max_fee` DECIMAL(10,2) DEFAULT NULL COMMENT '最高收费（元），为空表示不封顶',
  `volume_weight_ratio` DECIMAL(10,2) DEFAULT NULL COMMENT '体积重系数',
  `standard_timeliness` DECIMAL(10,2) DEFAULT 0.00 COMMENT '标准时效（小时）',
  `effective_date` DATETIME DEFAULT NULL COMMENT '生效日期',
  `expiry_date` DATETIME DEFAULT NULL COMMENT '失效日期（为空表示长期有效）',
  `status` TINYINT UNSIGNED DEFAULT 1 COMMENT '状态：0-禁用 1-启用',
  `is_default` TINYINT(1) DEFAULT 0 COMMENT '是否为默认资费方案',
  `rule_description` TEXT DEFAULT NULL COMMENT '资费规则说明',
  `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
  `created_by` BIGINT UNSIGNED DEFAULT NULL COMMENT '创建人ID',
  `created_by_name` VARCHAR(50) DEFAULT NULL COMMENT '创建人名称',
  `updated_by` BIGINT UNSIGNED DEFAULT NULL COMMENT '更新人ID',
  `updated_by_name` VARCHAR(50) DEFAULT NULL COMMENT '更新人名称',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_provider_id` (`provider_id`),
  KEY `idx_fee_type` (`fee_type`),
  KEY `idx_from_province` (`from_province`),
  KEY `idx_to_province` (`to_province`),
  KEY `idx_effective_date` (`effective_date`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='物流资费标准表';

-- =====================================================
-- 5. 物流签约合同表
-- =====================================================
DROP TABLE IF EXISTS `logistics_sign_contracts`;
CREATE TABLE `logistics_sign_contracts` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `contract_no` VARCHAR(50) DEFAULT NULL COMMENT '签约单号',
  `provider_id` BIGINT UNSIGNED NOT NULL COMMENT '物流服务商ID',
  `contract_name` VARCHAR(200) NOT NULL COMMENT '合同名称',
  `contract_type` VARCHAR(50) DEFAULT 'initial' COMMENT '签约类型：initial/renewal等',
  `contract_file_url` VARCHAR(200) DEFAULT NULL COMMENT '合同文件URL',
  `party_a_signatory` VARCHAR(100) DEFAULT NULL COMMENT '甲方签约代表（平台）',
  `party_a_sign_date` DATETIME DEFAULT NULL COMMENT '甲方签约日期',
  `party_b_signatory` VARCHAR(100) DEFAULT NULL COMMENT '乙方签约代表（物流商）',
  `party_b_sign_date` DATETIME DEFAULT NULL COMMENT '乙方签约日期',
  `effective_date` DATETIME DEFAULT NULL COMMENT '合同生效日期',
  `expiry_date` DATETIME DEFAULT NULL COMMENT '合同到期日期',
  `contract_amount` DECIMAL(14,2) DEFAULT NULL COMMENT '合同金额（元）',
  `sla_level` INT UNSIGNED DEFAULT NULL COMMENT '服务SLA等级：1-基础 2-标准 3-优质 4-尊享',
  `compensation_limit` DECIMAL(10,2) DEFAULT NULL COMMENT '赔付上限（元/单）',
  `status` TINYINT UNSIGNED DEFAULT 0 COMMENT '签约状态：0-草稿 1-待签约 2-已生效 3-已过期 4-已终止',
  `contract_summary` TEXT DEFAULT NULL COMMENT '合同条款摘要',
  `termination_reason` VARCHAR(500) DEFAULT NULL COMMENT '终止原因',
  `actual_termination_date` DATETIME DEFAULT NULL COMMENT '实际终止日期',
  `created_by` BIGINT UNSIGNED DEFAULT NULL COMMENT '创建人ID',
  `created_by_name` VARCHAR(50) DEFAULT NULL COMMENT '创建人名称',
  `approved_by` BIGINT UNSIGNED DEFAULT NULL COMMENT '审核人ID',
  `approved_by_name` VARCHAR(50) DEFAULT NULL COMMENT '审核人名称',
  `approved_at` DATETIME DEFAULT NULL COMMENT '审核通过时间',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_contract_no` (`contract_no`),
  KEY `idx_provider_id` (`provider_id`),
  KEY `idx_contract_type` (`contract_type`),
  KEY `idx_status` (`status`),
  KEY `idx_effective_date` (`effective_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='物流签约合同表';

-- =====================================================
-- 6. 物流资费修改记录表
-- =====================================================
DROP TABLE IF EXISTS `logistics_fee_change_logs`;
CREATE TABLE `logistics_fee_change_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `log_no` VARCHAR(50) DEFAULT NULL COMMENT '变更记录单号',
  `provider_id` BIGINT UNSIGNED NOT NULL COMMENT '物流服务商ID',
  `fee_standard_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '资费标准ID',
  `change_type` VARCHAR(50) NOT NULL COMMENT '变更类型：create/update/delete/enable/disable',
  `fee_name` VARCHAR(200) DEFAULT NULL COMMENT '资费方案名称',
  `before_data` JSON DEFAULT NULL COMMENT '变更前数据',
  `after_data` JSON DEFAULT NULL COMMENT '变更后数据',
  `change_reason` TEXT DEFAULT NULL COMMENT '变更说明',
  `is_violation` TINYINT(1) DEFAULT 0 COMMENT '是否涉及违规资费配置',
  `violation_remark` VARCHAR(500) DEFAULT NULL COMMENT '违规说明',
  `operator_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '操作人ID',
  `operator_name` VARCHAR(50) DEFAULT NULL COMMENT '操作人名称',
  `confirmed_by` BIGINT UNSIGNED DEFAULT NULL COMMENT '二次确认人ID',
  `confirmed_by_name` VARCHAR(50) DEFAULT NULL COMMENT '二次确认人名称',
  `confirmed_at` DATETIME DEFAULT NULL COMMENT '二次确认时间',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_provider_id` (`provider_id`),
  KEY `idx_fee_standard_id` (`fee_standard_id`),
  KEY `idx_change_type` (`change_type`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='物流资费修改记录表';

-- =====================================================
-- 7. 物流服务评价台账表
-- =====================================================
DROP TABLE IF EXISTS `logistics_service_evaluations`;
CREATE TABLE `logistics_service_evaluations` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `evaluation_no` VARCHAR(50) DEFAULT NULL COMMENT '评价编号',
  `provider_id` BIGINT UNSIGNED NOT NULL COMMENT '物流服务商ID',
  `order_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '关联订单ID',
  `order_no` VARCHAR(50) DEFAULT NULL COMMENT '关联订单号',
  `shipment_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '关联发货记录ID',
  `evaluation_type` VARCHAR(50) DEFAULT NULL COMMENT '评价类型：timeliness/damage等',
  `rating` TINYINT UNSIGNED NOT NULL COMMENT '评分：1-5星',
  `timeliness_score` DECIMAL(10,2) DEFAULT NULL COMMENT '时效评分（小时）',
  `has_damage` TINYINT(1) DEFAULT 0 COMMENT '是否存在破损',
  `has_loss` TINYINT(1) DEFAULT 0 COMMENT '是否存在丢失',
  `compensation_amount` DECIMAL(14,2) DEFAULT NULL COMMENT '赔付金额（元）',
  `content` TEXT DEFAULT NULL COMMENT '评价内容',
  `image_urls` VARCHAR(200) DEFAULT NULL COMMENT '评价图片URL（多个逗号分隔）',
  `evaluator_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '评价人ID',
  `evaluator_name` VARCHAR(50) DEFAULT NULL COMMENT '评价人名称',
  `evaluator_type` TINYINT UNSIGNED DEFAULT 0 COMMENT '评价人类型：0-用户 1-平台 2-商家',
  `is_appealed` TINYINT(1) DEFAULT 0 COMMENT '是否已申诉处理',
  `appeal_result` VARCHAR(500) DEFAULT NULL COMMENT '申诉处理结果',
  `appeal_handled_at` DATETIME DEFAULT NULL COMMENT '申诉处理时间',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_evaluation_no` (`evaluation_no`),
  KEY `idx_provider_id` (`provider_id`),
  KEY `idx_evaluation_type` (`evaluation_type`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_rating` (`rating`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='物流服务评价台账表';

-- =====================================================
-- 8. 物流服务商操作日志表
-- =====================================================
DROP TABLE IF EXISTS `logistics_provider_operation_logs`;
CREATE TABLE `logistics_provider_operation_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `provider_id` BIGINT UNSIGNED NOT NULL COMMENT '物流服务商ID',
  `change_type` VARCHAR(50) NOT NULL COMMENT '变更类型',
  `change_title` VARCHAR(200) DEFAULT NULL COMMENT '变更内容标题',
  `before_data` JSON DEFAULT NULL COMMENT '变更前数据',
  `after_data` JSON DEFAULT NULL COMMENT '变更后数据',
  `change_detail` TEXT DEFAULT NULL COMMENT '变更详细说明',
  `change_reason` VARCHAR(500) DEFAULT NULL COMMENT '变更原因',
  `is_core_change` TINYINT(1) DEFAULT 0 COMMENT '是否核心参数变更（需二次确认）',
  `confirmed_by` BIGINT UNSIGNED DEFAULT NULL COMMENT '二次确认人ID',
  `confirmed_by_name` VARCHAR(50) DEFAULT NULL COMMENT '二次确认人名称',
  `confirmed_at` DATETIME DEFAULT NULL COMMENT '二次确认时间',
  `operator_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '操作人ID',
  `operator_name` VARCHAR(50) DEFAULT NULL COMMENT '操作人名称',
  `operator_role` VARCHAR(50) DEFAULT NULL COMMENT '操作人角色',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_provider_id` (`provider_id`),
  KEY `idx_change_type` (`change_type`),
  KEY `idx_operator_id` (`operator_id`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='物流服务商操作日志表';

-- =====================================================
-- 插入测试数据
-- =====================================================

-- 插入物流服务商测试数据
INSERT INTO `logistics_providers` (
  `provider_code`, `provider_name`, `level`, `status`, `cooperation_status`,
  `cooperation_effective_date`, `contact_person`, `contact_phone`, `contact_email`,
  `registered_address`, `credit_code`, `business_license_no`, `legal_person`,
  `business_license_url`, `license_valid_from`, `license_valid_to`,
  `service_province`, `service_cities`, `branch_count`,
  `cross_province_timeliness`, `intra_province_timeliness`,
  `first_weight_fee`, `additional_weight_fee`, `base_service_fee`,
  `daily_order_limit`, `support_cod`, `support_cold_chain`, `support_pickup`,
  `match_priority`, `api_url`, `service_score`, `on_time_rate`,
  `damage_rate`, `loss_rate`, `total_orders`, `total_amount`,
  `qualification_intro`, `remark`,
  `created_by`, `created_by_name`, `updated_by`, `updated_by_name`
) VALUES
('WL000001', '顺丰速运有限公司', 5, 1, 1, '2025-01-01 00:00:00',
 '张经理', '13800138001', 'sf@example.com',
 '广东省深圳市南山区科技园', '91440300MA5X123456', '440300123456789012', '王顺丰',
 '/uploads/sf-license.jpg', '2020-01-01 00:00:00', '2030-12-31 23:59:59',
 '北京,上海,广东,江苏,浙江', '北京,上海,广州,深圳,杭州,南京,苏州,成都,武汉,西安', 5280,
 48.00, 24.00, 18.00, 8.00, 2.00,
 50000, 1, 0, 1,
 100, 'https://api.sf-express.com/', 4.8, 0.9850,
 0.0012, 0.0005, 1256800, 256890000.00,
 '顺丰速运是中国领先的综合物流服务商，成立于1993年，总部位于深圳。公司拥有覆盖全国的物流网络，包括航空、陆运、仓储等多种运输方式。主要业务包括：快递服务、冷链运输、大件物流、国际物流、供应链解决方案等。顺丰航空拥有自有货运机队，是国内最大的货运航空公司之一。公司注重服务质量，采用直营模式确保服务标准化，在快递行业中享有较高的品牌知名度和用户口碑。2017年在深交所上市，是国内首家上市的快递公司。顺丰在全国拥有超过5000个自营网点，服务覆盖全国300多个地级市，末端派送人员超过30万人。',
 '铂金级战略合作伙伴，优先匹配高端订单',
 1, '系统管理员', 1, '系统管理员'),

('WL000002', '中通快递股份有限公司', 4, 1, 1, '2025-03-15 00:00:00',
 '李主管', '13800138002', 'zto@example.com',
 '上海市青浦区华新镇', '91310000MA1FL789012', '310000123456789012', '赖中通',
 '/uploads/zto-license.jpg', '2018-06-01 00:00:00', '2028-05-31 23:59:59',
 '北京,上海,广东,江苏,浙江,四川,湖北,陕西', '北京,上海,广州,深圳,杭州,南京,成都,武汉,西安,重庆,郑州,济南', 8900,
 72.00, 36.00, 10.00, 4.50, 1.50,
 80000, 1, 0, 1,
 80, 'https://api.zto.com/', 4.5, 0.9680,
 0.0025, 0.0008, 2890000, 185600000.00,
 '中通快递是一家集快递、物流、电商、印务于一体的大型集团公司。公司创立于2002年，2016年在美国纽交所上市，2020年在港交所二次上市。中通快递是目前国内业务量最大的快递公司，市场份额超过20%。采用"中心直营+网点加盟"的运营模式，在全国拥有近9000个网点，分拣中心超过90个。中通注重科技投入，自主研发了全链路物流信息系统，实现了对包裹的全程追踪和智能调度。在绿色物流方面积极探索，推广电子面单、可循环包装等环保措施。',
 '黄金级合作伙伴，电商件主力服务商',
 1, '系统管理员', 1, '系统管理员'),

('WL000003', '圆通速递有限公司', 4, 1, 1, '2025-02-20 00:00:00',
 '王经理', '13800138003', 'yto@example.com',
 '上海市青浦区华徐公路', '91310000MA1FL123456', '310000987654321098', '喻圆通',
 '/uploads/yto-license.jpg', '2019-03-15 00:00:00', '2029-03-14 23:59:59',
 '北京,上海,广东,江苏,浙江,山东', '北京,上海,广州,深圳,杭州,南京,济南,青岛,苏州,无锡', 7200,
 72.00, 48.00, 11.00, 5.00, 1.80,
 60000, 1, 0, 1,
 70, 'https://api.yto.net.cn/', 4.3, 0.9550,
 0.0032, 0.0012, 1890000, 98500000.00,
 '圆通速递成立于2000年，是中国领先的综合性快递物流服务提供商。2016年在上海证券交易所成功上市，成为中国快递行业首家上市公司。圆通构建了覆盖全国、深入乡村、通达全球的服务网络，在全国拥有7200余个网点，服务覆盖全国31个省（区、市）的所有县级以上城市和发达乡镇。圆通航空是国内第三家拥有自有货运航空公司的快递企业。公司积极推进国际化战略，已在全球多个国家和地区设立海外分支机构。圆通注重科技创新，成功研发出"行者系统"、"金刚系统"等核心业务系统，实现了对快递全流程的数字化管理。',
 '黄金级合作伙伴，覆盖广性价比优',
 1, '系统管理员', 1, '系统管理员'),

('WL000004', '京东物流', 5, 1, 0, NULL,
 '赵总监', '13800138004', 'jd@example.com',
 '北京市大兴区亦庄经济开发区', '91110000MA5X678901', '110000567890123456', '刘京东',
 '/uploads/jd-license.jpg', '2021-09-01 00:00:00', '2031-08-31 23:59:59',
 '北京,上海,广东,江苏,浙江,四川,湖北,陕西,山东,福建', '北京,上海,广州,深圳,杭州,南京,成都,武汉,西安,济南,厦门,福州,沈阳,哈尔滨', 4500,
 36.00, 18.00, 15.00, 6.00, 2.00,
 30000, 0, 1, 1,
 90, 'https://api.jdl.com/', 4.7, 0.9780,
 0.0018, 0.0006, 980000, 156800000.00,
 '京东物流是中国领先的技术驱动的供应链解决方案及物流服务商，以"技术驱动，引领全球高效流通和可持续发展"为使命，致力于成为全球最值得信赖的供应链基础设施服务商。京东物流建立了包含仓储网络、综合运输网络、最后一公里配送网络、大件网络、冷链物流网络和跨境物流网络在内的高度协同的六大网络。京东物流在全国拥有超1400个仓库，总管理面积超过2500万平方米。京东物流是全球唯一拥有中小件、大件、冷链、B2B、跨境和众包（达达）六大物流网络的企业。依托于十余年的物流科技投入，京东物流是全球首个拥有5G智能物流园区的企业。',
 '铂金级合作伙伴，服务质量优质，待审批全面合作',
 1, '系统管理员', 1, '系统管理员'),

('WL000005', '德邦快递', 3, 1, 2, NULL,
 '孙经理', '13800138005', 'deppon@example.com',
 '上海市青浦区徐泾镇', '91310000MA1FL345678', '310000456789012345', '崔德邦',
 '/uploads/deppon-license.jpg', '2017-11-20 00:00:00', '2027-11-19 23:59:59',
 '北京,上海,广东,江苏,浙江', '北京,上海,广州,深圳,杭州,南京,苏州,成都,武汉', 3200,
 96.00, 72.00, 25.00, 12.00, 5.00,
 20000, 0, 0, 1,
 60, 'https://api.deppon.com/', 4.2, 0.9500,
 0.0028, 0.0010, 450000, 52000000.00,
 '德邦快递创建于1996年，是一家以大件快递为主力，联动快递、物流、跨境、仓储与供应链等综合性业务的AAAAA级综合物流服务商。2018年在上交所上市，成为国内第一家上市的零担物流企业。德邦在大件快递领域深耕多年，积累了丰富的行业经验和技术优势。公司建立了覆盖全国的运输网络，拥有3200多个经营网点，自有车辆超过15000台。德邦快递以"为中国提速"为使命，专注于客户需求的深度挖掘和满足，为广大客户提供高效、快捷、安全、专业的物流服务。在大件物流、整车运输、零担运输等领域拥有显著的市场优势。',
 '白银级合作伙伴，专注大件物流，合作暂停调整中',
 1, '系统管理员', 1, '系统管理员'),

('WL000006', '极兔速递', 2, 2, 0, NULL,
 '陈主管', '13800138006', 'jnt@example.com',
 '上海市青浦区徐祥路', '91310000MA1FL901234', '310000234567890123', '樊极兔',
 '/uploads/jnt-license.jpg', '2023-01-10 00:00:00', '2033-01-09 23:59:59',
 '广东,江苏,浙江', '广州,深圳,东莞,杭州,南京,苏州,宁波', 1500,
 96.00, 48.00, 8.00, 3.50, 1.20,
 25000, 0, 0, 1,
 40, 'https://api.jtexpress.com.cn/', 4.0, 0.9350,
 0.0040, 0.0015, 380000, 28600000.00,
 '极兔速递是一家科技创新型互联网快递物流企业，致力于为用户带来优质的快递和物流体验。2015年8月由印尼企业家李杰创立于东南亚，2020年3月开始在中国正式营运。极兔速递以"快递+出海"为双轮驱动战略，在东南亚本土快递市场占有率位居前列。公司依托强大的信息系统和智能调度能力，为客户提供多样化的物流解决方案。极兔速递在运营模式上采用扁平化管理，快速响应市场变化。公司持续投入技术研发，在智能分单、路径优化、自动化分拣等领域取得多项技术突破。',
 '青铜级，准入审核待通过，需补充资质材料',
 1, '系统管理员', 1, '系统管理员'),

('WL000007', '邮政EMS', 5, 0, 0, NULL,
 '周主任', '13800138007', 'ems@chinapost.com',
 '北京市西城区金融大街', '91110000MA00123456', '110000111111111111', '廖邮政',
 '/uploads/ems-license.jpg', '2015-05-01 00:00:00', '2035-04-30 23:59:59',
 '北京,上海,广东,江苏,浙江,四川,湖北,陕西,山东,福建,河南,湖南,安徽,河北,辽宁,吉林,黑龙江,江西,山西,云南,贵州,广西,甘肃,内蒙古,新疆,宁夏,青海,西藏,海南,重庆,天津',
 '全国所有地级市', 58000,
 120.00, 72.00, 20.00, 10.00, 3.00,
 100000, 1, 0, 0,
 95, 'https://api.ems.com.cn/', 4.4, 0.9600,
 0.0020, 0.0003, 3560000, 198600000.00,
 '中国邮政速递物流股份有限公司（简称EMS）是经国务院批准，中国邮政集团公司于2010年6月联合各省邮政公司共同发起设立的国有股份制公司，是中国经营历史最悠久、规模最大、网络覆盖范围最广、业务品种最丰富的快递物流综合服务提供商。EMS国内业务通达全国所有市县，包括偏远农村地区；国际业务通达全球200多个国家和地区。EMS拥有"次晨达"、"次日递"、"隔日达"等多种时效产品，能够满足不同客户的多样化需求。EMS在机要通信、跨境电商物流等领域具有独特的竞争优势。',
 '铂金级，已禁用需重新谈判合作条款',
 1, '系统管理员', 1, '系统管理员');

-- 插入服务商资质测试数据
INSERT INTO `logistics_provider_qualifications` (
  `provider_id`, `qualification_type`, `qualification_name`, `certificate_no`,
  `certificate_holder`, `certificate_file_url`, `valid_from`, `expire_date`,
  `status`, `description`, `created_by`, `created_by_name`
) VALUES
(1, 'business_license', '营业执照', '440300123456789012', '顺丰速运有限公司', '/uploads/sf-license.jpg', '2020-01-01', '2030-12-31', 1, '企业法人营业执照，经营范围包括国内快递、国际快递等', 1, '系统管理员'),
(1, 'road_transport', '道路运输经营许可证', '交运管许可粤字440301234567号', '顺丰速运有限公司', '/uploads/sf-road.jpg', '2021-06-15', '2026-06-14', 1, '道路普通货物运输、货物专用运输（集装箱）', 1, '系统管理员'),
(1, 'insurance', '物流责任保险', 'PZAI20250012345', '顺丰速运有限公司', '/uploads/sf-insurance.jpg', '2025-01-01', '2026-01-01', 1, '货物运输险，单次赔付上限500万元', 1, '系统管理员'),
(2, 'business_license', '营业执照', '310000123456789012', '中通快递股份有限公司', '/uploads/zto-license.jpg', '2018-06-01', '2028-05-31', 1, '企业法人营业执照，快递业务许可', 1, '系统管理员'),
(2, 'road_transport', '道路运输经营许可证', '交运管许可沪字310001765432号', '中通快递股份有限公司', '/uploads/zto-road.jpg', '2019-03-20', '2025-03-19', 1, '道路货物运输经营许可', 1, '系统管理员'),
(3, 'business_license', '营业执照', '310000987654321098', '圆通速递有限公司', '/uploads/yto-license.jpg', '2019-03-15', '2029-03-14', 1, '企业法人营业执照', 1, '系统管理员'),
(3, 'road_transport', '道路运输经营许可证', '交运管许可沪字310001555888号', '圆通速递有限公司', '/uploads/yto-road.jpg', '2020-01-10', '2025-01-09', 4, '道路货物运输，待复核年检材料', 1, '系统管理员'),
(4, 'business_license', '营业执照', '110000567890123456', '京东物流', '/uploads/jd-license.jpg', '2021-09-01', '2031-08-31', 1, '企业法人营业执照', 1, '系统管理员'),
(4, 'cold_chain', '冷链运输资质', 'CCHA2025JD00123', '京东物流', '/uploads/jd-cold.jpg', '2023-05-01', '2028-04-30', 1, '医药冷链、食品冷链运输资质', 1, '系统管理员'),
(5, 'business_license', '营业执照', '310000456789012345', '德邦快递', '/uploads/deppon-license.jpg', '2017-11-20', '2027-11-19', 1, '企业法人营业执照', 1, '系统管理员');

-- 插入网点测试数据
INSERT INTO `logistics_branch_networks` (
  `branch_code`, `provider_id`, `branch_name`, `branch_type`, `province`, `city`, `district`,
  `address`, `manager_name`, `contact_phone`, `business_hours`, `daily_capacity`,
  `coverage_radius`, `status`, `service_priority`
) VALUES
('SF-BJ-001', 1, '顺丰北京朝阳转运中心', '转运中心', '北京', '北京', '朝阳区',
 '朝阳区黑庄户乡大鲁店北路', '王建国', '010-61234567', '06:00-22:00', 50000, 50.00, 1, 10),
('SF-SH-001', 1, '顺丰上海青浦分拣中心', '分拣中心', '上海', '上海', '青浦区',
 '青浦区华新镇华徐公路2018号', '李国强', '021-51234567', '05:30-23:30', 80000, 60.00, 1, 10),
('SF-GZ-001', 1, '顺丰广州白云网点', '直营网点', '广东', '广州', '白云区',
 '白云区太和镇大源北路18号', '陈志明', '020-81234567', '08:00-21:00', 15000, 25.00, 1, 8),
('SF-SZ-001', 1, '顺丰深圳南山网点', '直营网点', '广东', '深圳', '南山区',
 '南山区科技园高新南一道9号', '林伟雄', '0755-21234567', '08:00-21:30', 18000, 20.00, 1, 9),
('SF-HZ-001', 1, '顺丰杭州滨江网点', '直营网点', '浙江', '杭州', '滨江区',
 '滨江区江南大道588号', '赵一民', '0571-81234567', '08:00-21:00', 12000, 22.00, 1, 8),
('ZTO-BJ-001', 2, '中通北京大兴网点', '加盟网点', '北京', '北京', '大兴区',
 '大兴区西红门镇新建工业区', '钱二柱', '010-62345678', '07:00-20:00', 25000, 35.00, 1, 7),
('ZTO-SH-001', 2, '中通上海青浦转运中心', '转运中心', '上海', '上海', '青浦区',
 '青浦区华新镇华志路1685号', '孙三根', '021-52345678', '04:00-01:00', 150000, 80.00, 1, 10),
('ZTO-GZ-001', 2, '中通广州番禺网点', '加盟网点', '广东', '广州', '番禺区',
 '番禺区南村镇塘步东村', '周四季', '020-82345678', '07:30-20:30', 30000, 30.00, 1, 7),
('YTO-SH-001', 3, '圆通上海转运中心', '转运中心', '上海', '上海', '青浦区',
 '青浦区华徐公路3029弄', '吴五福', '021-53456789', '05:00-00:00', 120000, 70.00, 1, 9),
('YTO-HZ-001', 3, '圆通杭州上城网点', '加盟网点', '浙江', '杭州', '上城区',
 '上城区清江路168号', '郑六和', '0571-82345678', '08:00-20:00', 18000, 28.00, 1, 7),
('JD-BJ-001', 4, '京东物流亚洲一号北京仓', '分拣中心', '北京', '北京', '大兴区',
 '大兴区亦庄经济开发区', '冯七步', '010-63456789', '24小时', 200000, 100.00, 1, 10),
('JD-GZ-001', 4, '京东物流广州黄埔分拣中心', '分拣中心', '广东', '广州', '黄埔区',
 '黄埔区开发大道锦绣路', '陈八方', '020-83456789', '24小时', 150000, 75.00, 1, 10);

-- 插入资费标准测试数据
INSERT INTO `logistics_fee_standards` (
  `provider_id`, `fee_type`, `fee_name`, `from_province`, `to_province`,
  `weight_unit`, `first_weight`, `first_weight_fee`, `additional_weight_step`, `additional_weight_fee`,
  `base_service_fee`, `min_fee`, `standard_timeliness`, `effective_date`, `status`, `is_default`,
  `rule_description`
) VALUES
(1, 'standard', '顺丰标快-跨省', NULL, NULL, 'kg', 1.000, 18.00, 1.000, 8.00, 2.00, 20.00, 48.00, '2025-01-01', 1, 1,
 '首重1kg18元，续重每kg8元，跨省48小时送达'),
(1, 'express', '顺丰特快-跨省', NULL, NULL, 'kg', 1.000, 28.00, 1.000, 15.00, 3.00, 30.00, 24.00, '2025-01-01', 1, 0,
 '首重1kg28元，续重每kg15元，24小时内送达'),
(1, 'standard', '顺丰标快-省内', '广东', '广东', 'kg', 1.000, 12.00, 1.000, 3.00, 1.50, 13.00, 24.00, '2025-01-01', 1, 0,
 '广东省内首重12元，续重每kg3元'),
(2, 'standard', '中通标准快递-全国', NULL, NULL, 'kg', 1.000, 10.00, 1.000, 4.50, 1.50, 11.00, 72.00, '2025-03-15', 1, 1,
 '首重1kg10元，续重每kg4.5元，72小时内送达'),
(2, 'economy', '中通经济快递-陆运', NULL, NULL, 'kg', 1.000, 7.00, 1.000, 2.50, 1.00, 8.00, 96.00, '2025-03-15', 1, 0,
 '陆运经济型，首重7元，时效3-5天'),
(3, 'standard', '圆通标准快递-全国', NULL, NULL, 'kg', 1.000, 11.00, 1.000, 5.00, 1.80, 12.00, 72.00, '2025-02-20', 1, 1,
 '首重1kg11元，续重每kg5元，72小时内送达'),
(4, 'standard', '京东物流标准-全国', NULL, NULL, 'kg', 1.000, 15.00, 1.000, 6.00, 2.00, 16.00, 36.00, '2025-01-01', 1, 1,
 '京东自营物流，首重15元，36小时内送达'),
(4, 'cold_chain', '京东冷链运输', NULL, NULL, 'kg', 1.000, 30.00, 1.000, 15.00, 5.00, 35.00, 48.00, '2025-01-01', 1, 0,
 '冷链运输，全程温控，适合生鲜食品医药'),
(5, 'standard', '德邦标准快递', NULL, NULL, 'kg', 3.000, 25.00, 1.000, 5.00, 0.00, 25.00, 96.00, '2024-01-01', 0, 1,
 '德邦大件标准件，首重3kg25元起');

-- 插入签约合同测试数据
INSERT INTO `logistics_sign_contracts` (
  `contract_no`, `provider_id`, `contract_name`, `contract_type`,
  `party_a_signatory`, `party_a_sign_date`, `party_b_signatory`, `party_b_sign_date`,
  `effective_date`, `expiry_date`, `contract_amount`, `sla_level`, `compensation_limit`,
  `status`, `contract_summary`,
  `created_by`, `created_by_name`, `approved_by`, `approved_by_name`, `approved_at`
) VALUES
('HT20250101001', 1, '顺丰速运年度战略合作协议', 'initial',
 '平台采购-王总', '2024-12-20', '顺丰-李副总裁', '2024-12-25',
 '2025-01-01', '2026-12-31', 300000000.00, 4, 5000.00,
 2, '年度战略合作，含快递、冷链、仓储等全品类服务；SLA4级，准时率≥98%；单笔赔付上限5000元',
 1, '系统管理员', 1, '系统管理员', '2024-12-28 10:00:00'),
('HT20250315002', 2, '中通快递年度合作框架协议', 'initial',
 '平台采购-王总', '2025-03-01', '中通-运营总监', '2025-03-10',
 '2025-03-15', '2026-03-14', 200000000.00, 3, 3000.00,
 2, '电商件专属合作方案，年度订单≥200万件；SLA3级，准时率≥96%；单笔赔付上限3000元',
 1, '系统管理员', 1, '系统管理员', '2025-03-12 15:00:00'),
('HT20250220003', 3, '圆通速递合作协议', 'initial',
 '平台采购-王总', '2025-02-05', '圆通-华北大区经理', '2025-02-15',
 '2025-02-20', '2026-02-19', 120000000.00, 3, 2000.00,
 2, '标准快递服务合作，覆盖华东华南地区；SLA3级，准时率≥95%',
 1, '系统管理员', 1, '系统管理员', '2025-02-18 09:30:00'),
('HT20241120004', 5, '德邦快递大件物流合作协议', 'initial',
 '平台采购-王总', '2024-11-05', '德邦-销售总监', '2024-11-10',
 '2024-11-20', '2025-11-19', 80000000.00, 2, 5000.00,
 3, '大件物流专项合作，因服务质量问题已终止合作，待重新谈判',
 1, '系统管理员', 1, '系统管理员', '2024-11-15 14:00:00');

-- 插入资费修改测试数据
INSERT INTO `logistics_fee_change_logs` (
  `log_no`, `provider_id`, `fee_standard_id`, `change_type`, `fee_name`,
  `before_data`, `after_data`, `change_reason`,
  `operator_id`, `operator_name`, `confirmed_by`, `confirmed_by_name`, `confirmed_at`
) VALUES
('LOG20250515001', 1, 1, 'update', '顺丰标快-跨省',
 JSON_OBJECT('first_weight_fee', 16.00, 'additional_weight_fee', 7.00),
 JSON_OBJECT('first_weight_fee', 18.00, 'additional_weight_fee', 8.00),
 '年度资费调整，运输成本上涨',
 1, '运营专员-小张', 1, '运营总监-王总', '2025-05-15 10:30:00'),
('LOG20250420002', 2, 4, 'update', '中通标准快递-全国',
 JSON_OBJECT('first_weight_fee', 9.00, 'additional_weight_fee', 4.00),
 JSON_OBJECT('first_weight_fee', 10.00, 'additional_weight_fee', 4.50),
 '季节性调价，Q2旺季成本增加',
 1, '运营专员-小李', 1, '运营总监-王总', '2025-04-20 14:00:00'),
('LOG20250601003', 4, 8, 'create', '京东冷链运输',
 NULL,
 JSON_OBJECT('first_weight_fee', 30.00, 'additional_weight_fee', 15.00, 'base_service_fee', 5.00),
 '新增冷链运输服务资费方案',
 1, '运营专员-小陈', NULL, NULL, NULL);

-- 插入服务评价测试数据
INSERT INTO `logistics_service_evaluations` (
  `evaluation_no`, `provider_id`, `order_id`, `order_no`, `evaluation_type`,
  `rating`, `timeliness_score`, `has_damage`, `has_loss`,
  `content`, `evaluator_id`, `evaluator_name`, `evaluator_type`
) VALUES
('EV20250601001', 1, 1001, 'ORD20250601001', 'timeliness', 5, -2.00, 0, 0,
 '顺丰就是快！上午下单下午就到了，包装也很完好，服务态度非常好。', 1, '用户-王先生', 0),
('EV20250601002', 1, 1002, 'ORD20250601002', 'overall', 5, 0.00, 0, 0,
 '一直用顺丰寄贵重物品，从未让我失望过，值得信赖。', 2, '用户-李女士', 0),
('EV20250602003', 2, 1003, 'ORD20250602003', 'timeliness', 4, 8.00, 0, 0,
 '中通速度还可以，跨省3天到，就是派送的时候没打电话直接放驿站了。', 3, '用户-张先生', 0),
('EV20250602004', 2, 1004, 'ORD20250602004', 'damage', 3, 0.00, 1, 0,
 '外包装有明显破损，还好里面的东西没碎，希望以后注意点。', 4, '用户-刘女士', 0),
('EV20250603005', 3, 1005, 'ORD20250603005', 'timeliness', 4, 5.00, 0, 0,
 '圆通服务还行，经济实惠，速度也不算慢，性价比不错。', 5, '用户-陈先生', 0),
('EV20250603006', 4, 1006, 'ORD20250603006', 'overall', 5, -6.00, 0, 0,
 '京东物流真的太给力了，前一天晚上下单第二天一早就到，而且送货上门！', 6, '用户-赵女士', 0),
('EV20250603007', 4, 1007, 'ORD20250603007', 'timeliness', 4, 2.00, 0, 0,
 '京东冷链运输，水果寄过来还是冰的，保鲜效果不错。', 7, '用户-孙先生', 0),
('EV20250604008', 1, 1008, 'ORD20250604008', 'complaint', 2, 48.00, 0, 0,
 '这次顺丰有点慢了，跨省用了4天，比预期晚了一天，客服解释是天气原因。', 8, '用户-周先生', 0);

-- 插入操作日志测试数据
INSERT INTO `logistics_provider_operation_logs` (
  `provider_id`, `change_type`, `change_title`,
  `before_data`, `after_data`, `change_detail`, `change_reason`,
  `is_core_change`, `confirmed_by`, `confirmed_by_name`, `confirmed_at`,
  `operator_id`, `operator_name`, `operator_role`
) VALUES
(1, 'create', '服务商准入：顺丰速运有限公司',
 NULL,
 JSON_OBJECT('provider_code', 'WL000001', 'provider_name', '顺丰速运有限公司', 'level', 5),
 '顺丰速运通过准入审核，完成入驻流程',
 '年度战略合作伙伴引入',
 0, NULL, NULL, NULL,
 1, '系统管理员', '超级管理员'),
(1, 'status_change', '状态变更：启用',
 JSON_OBJECT('status', 2), JSON_OBJECT('status', 1),
 '服务商从待审核状态变更为启用状态',
 '资质审核通过，网点覆盖达标',
 0, NULL, NULL, NULL,
 1, '运营经理', '运营部'),
(1, 'cooperation_status', '合作状态变更：合作中',
 JSON_OBJECT('cooperation_status', 0), JSON_OBJECT('cooperation_status', 1, 'cooperation_effective_date', '2025-01-01'),
 '合作合同签署完成，合作关系正式生效',
 '合同审核通过',
 1, 1, '运营总监-王总', '2025-01-01 09:00:00',
 1, '运营经理', '运营部'),
(1, 'param_update', '核心参数修改：资费调整',
 JSON_OBJECT('first_weight_fee', 16.00, 'additional_weight_fee', 7.00),
 JSON_OBJECT('first_weight_fee', 18.00, 'additional_weight_fee', 8.00),
 '首重资费从16元调整为18元，续重从7元调整为8元',
 '年度资费谈判结果，已同步匹配规则',
 1, 1, '运营总监-王总', '2025-05-15 10:30:00',
 1, '运营专员-小张', '运营部'),
(1, 'match_rule', '同步更新物流匹配规则',
 NULL,
 JSON_OBJECT('updatedFields', JSON_ARRAY('first_weight_fee', 'additional_weight_fee')),
 '资费变更后同步更新平台物流匹配优先级和筛选规则',
 '核心参数变更联动触发',
 0, NULL, NULL, NULL,
 1, '系统', '系统'),
(2, 'create', '服务商准入：中通快递股份有限公司',
 NULL,
 JSON_OBJECT('provider_code', 'WL000002', 'provider_name', '中通快递股份有限公司', 'level', 4),
 '中通快递通过准入审核',
 '电商件主力服务商补充',
 0, NULL, NULL, NULL,
 1, '系统管理员', '超级管理员'),
(4, 'param_update', '核心参数修改：匹配优先级调整',
 JSON_OBJECT('match_priority', 70), JSON_OBJECT('match_priority', 90),
 '匹配优先级从70调整为90，提升优质订单匹配权重',
 '服务质量提升，给予优先级奖励',
 1, 1, '运营总监-王总', '2025-05-20 14:00:00',
 1, '运营专员-小李', '运营部');

-- 完成提示
SELECT '物流供应链管理体系 - 上游合作方管控底座 数据库初始化完成！' AS message;
