-- =============================================
-- 物流链路监控与异常自愈系统 - 数据库初始化脚本
-- 版本: v2.0
-- 描述: 包含运维工单、异常检测规则、链路节点扩展、链路匹配记录4张表
-- =============================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- =============================================
-- 1. 物流链路匹配记录表
-- =============================================
DROP TABLE IF EXISTS `logistics_link_match_records`;
CREATE TABLE `logistics_link_match_records` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `match_no` VARCHAR(32) NOT NULL COMMENT '匹配单号',
  `order_id` BIGINT UNSIGNED NOT NULL COMMENT '订单ID',
  `order_no` VARCHAR(32) NOT NULL COMMENT '订单号',
  `status` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '匹配状态：0-待匹配 1-匹配成功 2-无可用服务商 3-地址偏远 4-商品禁运 5-时效不满足',
  `block_reason` VARCHAR(500) DEFAULT NULL COMMENT '拦截原因',
  `match_steps` TEXT COMMENT '匹配步骤详情（JSON格式，含加载进度）',
  `address_info` JSON DEFAULT NULL COMMENT '收货地址信息快照',
  `product_info` JSON DEFAULT NULL COMMENT '商品信息快照',
  `timeliness_requirement` JSON DEFAULT NULL COMMENT '时效要求信息',
  `matched_providers` JSON DEFAULT NULL COMMENT '匹配成功的服务商列表',
  `alternative_solutions` JSON DEFAULT NULL COMMENT '备选方案（当匹配失败时的建议）',
  `selected_provider_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '最终选择的服务商ID',
  `selected_provider_name` VARCHAR(100) DEFAULT NULL COMMENT '最终选择的服务商名称',
  `cost_time_ms` INT DEFAULT NULL COMMENT '匹配耗时（毫秒）',
  `created_by` BIGINT UNSIGNED DEFAULT NULL COMMENT '创建人ID',
  `created_by_name` VARCHAR(50) DEFAULT NULL COMMENT '创建人名称',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_match_no` (`match_no`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_by` (`created_by`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='物流链路匹配记录表';

-- =============================================
-- 2. 运维工单表
-- =============================================
DROP TABLE IF EXISTS `logistics_link_work_orders`;
CREATE TABLE `logistics_link_work_orders` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `work_order_no` VARCHAR(32) NOT NULL COMMENT '工单编号',
  `shipment_id` BIGINT UNSIGNED NOT NULL COMMENT '发货记录ID',
  `shipment_no` VARCHAR(32) NOT NULL COMMENT '发货单号',
  `order_id` BIGINT UNSIGNED NOT NULL COMMENT '订单ID',
  `order_no` VARCHAR(32) NOT NULL COMMENT '订单号',
  `abnormal_log_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '关联异常记录ID',
  `type` TINYINT UNSIGNED NOT NULL COMMENT '工单类型：1-异常处理 2-物流核查 3-订单拦截 4-手动同步 5-用户投诉',
  `title` VARCHAR(200) NOT NULL COMMENT '工单标题',
  `description` TEXT COMMENT '工单详细描述',
  `priority` TINYINT UNSIGNED NOT NULL DEFAULT 2 COMMENT '优先级：1-低 2-中 3-高 4-紧急',
  `status` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '状态：0-待处理 1-处理中 2-待用户确认 3-已解决 4-已关闭 5-已升级',
  `resolution` VARCHAR(200) DEFAULT NULL COMMENT '处理结果',
  `sla_expire_at` DATETIME DEFAULT NULL COMMENT 'SLA到期时间',
  `assigned_to` BIGINT UNSIGNED DEFAULT NULL COMMENT '指派人ID',
  `assigned_to_name` VARCHAR(50) DEFAULT NULL COMMENT '指派人名称',
  `assigned_at` DATETIME DEFAULT NULL COMMENT '指派时间',
  `handled_by` BIGINT UNSIGNED DEFAULT NULL COMMENT '处理人ID',
  `handled_by_name` VARCHAR(50) DEFAULT NULL COMMENT '处理人名称',
  `started_at` DATETIME DEFAULT NULL COMMENT '开始处理时间',
  `resolved_at` DATETIME DEFAULT NULL COMMENT '解决时间',
  `process_records` TEXT COMMENT '处理过程记录（JSON格式）',
  `created_by` BIGINT UNSIGNED DEFAULT NULL COMMENT '创建人ID',
  `created_by_name` VARCHAR(50) DEFAULT NULL COMMENT '创建人名称',
  `source` VARCHAR(50) DEFAULT NULL COMMENT '创建来源：system/admin/user/api',
  `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_work_order_no` (`work_order_no`),
  KEY `idx_shipment_id` (`shipment_id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_type` (`type`),
  KEY `idx_priority` (`priority`),
  KEY `idx_status` (`status`),
  KEY `idx_assigned_to` (`assigned_to`),
  KEY `idx_created_by` (`created_by`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_sla_expire_at` (`sla_expire_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='运维工单表';

-- =============================================
-- 3. 异常检测规则表
-- =============================================
DROP TABLE IF EXISTS `logistics_abnormal_detection_rules`;
CREATE TABLE `logistics_abnormal_detection_rules` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `rule_code` VARCHAR(32) NOT NULL COMMENT '规则编码',
  `rule_name` VARCHAR(100) NOT NULL COMMENT '规则名称',
  `detection_type` VARCHAR(50) NOT NULL COMMENT '检测类型：stagnant-物流停滞 misroute-错发 timeout-超时 delayed_delivery-派送延迟 repeat_track-重复节点 fake_track-虚假轨迹 node_missing-节点缺失',
  `scene` VARCHAR(20) NOT NULL DEFAULT 'all' COMMENT '检测场景：in_transit-运输中 delivering-派送中 signed-已签收 all-全部',
  `status` TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '状态：0-禁用 1-启用',
  `priority` INT UNSIGNED NOT NULL DEFAULT 50 COMMENT '优先级，数值越大越先执行',
  `alert_level` TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '触发告警等级：1-轻微 2-一般 3-严重',
  `detection_params` JSON DEFAULT NULL COMMENT '检测参数配置（JSON格式）',
  `description` VARCHAR(500) DEFAULT NULL COMMENT '检测规则描述',
  `auto_create_work_order` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否自动创建工单',
  `auto_notify_user` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否自动通知用户',
  `auto_sync_order_status` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否自动同步订单状态',
  `sla_response_minutes` INT UNSIGNED DEFAULT 60 COMMENT 'SLA响应时限（分钟）',
  `created_by` BIGINT UNSIGNED DEFAULT NULL COMMENT '创建人ID',
  `created_by_name` VARCHAR(50) DEFAULT NULL COMMENT '创建人名称',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_rule_code` (`rule_code`),
  KEY `idx_detection_type` (`detection_type`),
  KEY `idx_scene` (`scene`),
  KEY `idx_status` (`status`),
  KEY `idx_priority` (`priority`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='异常检测规则表';

-- =============================================
-- 4. 链路节点扩展信息表
-- =============================================
DROP TABLE IF EXISTS `logistics_link_node_extensions`;
CREATE TABLE `logistics_link_node_extensions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `track_id` BIGINT UNSIGNED NOT NULL COMMENT '关联轨迹ID',
  `shipment_id` BIGINT UNSIGNED NOT NULL COMMENT '发货记录ID',
  `logistics_no` VARCHAR(50) NOT NULL COMMENT '物流单号',
  `node_hash` VARCHAR(64) NOT NULL COMMENT '节点哈希值（用于重复检测）',
  `node_time` DATETIME NOT NULL COMMENT '节点发生时间',
  `province` VARCHAR(50) DEFAULT NULL COMMENT '节点所在省份',
  `city` VARCHAR(50) DEFAULT NULL COMMENT '节点所在城市',
  `district` VARCHAR(50) DEFAULT NULL COMMENT '节点所在区县',
  `address` VARCHAR(200) DEFAULT NULL COMMENT '节点详细地址',
  `latitude` DECIMAL(10,6) DEFAULT NULL COMMENT '纬度',
  `longitude` DECIMAL(10,6) DEFAULT NULL COMMENT '经度',
  `operator_name` VARCHAR(100) DEFAULT NULL COMMENT '快递员/操作员姓名',
  `operator_phone` VARCHAR(20) DEFAULT NULL COMMENT '操作员联系电话',
  `operator_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '操作员ID（系统内）',
  `operator_employee_id` VARCHAR(50) DEFAULT NULL COMMENT '操作员工号',
  `branch_name` VARCHAR(100) DEFAULT NULL COMMENT '所属网点名称',
  `branch_code` VARCHAR(32) DEFAULT NULL COMMENT '所属网点编码',
  `device_id` VARCHAR(50) DEFAULT NULL COMMENT '扫描设备编号',
  `device_type` VARCHAR(50) DEFAULT NULL COMMENT '扫描设备类型',
  `verification_status` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '核验状态：0-待核验 1-已核验 2-存疑 3-虚假',
  `verification_remark` VARCHAR(200) DEFAULT NULL COMMENT '核验说明',
  `verified_by` BIGINT UNSIGNED DEFAULT NULL COMMENT '核验人ID',
  `verified_by_name` VARCHAR(50) DEFAULT NULL COMMENT '核验人名称',
  `verified_at` DATETIME DEFAULT NULL COMMENT '核验时间',
  `is_backfilled` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否为补录节点',
  `is_abnormal` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否为异常节点',
  `abnormal_type` VARCHAR(50) DEFAULT NULL COMMENT '异常类型',
  `abnormal_desc` VARCHAR(200) DEFAULT NULL COMMENT '异常描述',
  `extra` JSON DEFAULT NULL COMMENT '扩展字段（JSON格式）',
  `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
  `source` VARCHAR(50) DEFAULT NULL COMMENT '数据来源：system/api/manual',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_node_hash` (`node_hash`),
  KEY `idx_track_id` (`track_id`),
  KEY `idx_shipment_id` (`shipment_id`),
  KEY `idx_logistics_no` (`logistics_no`),
  KEY `idx_verification_status` (`verification_status`),
  KEY `idx_operator_id` (`operator_id`),
  KEY `idx_node_time` (`node_time`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='链路节点扩展信息表';

-- =============================================
-- 5. 测试数据 - 异常检测规则
-- =============================================
INSERT INTO `logistics_abnormal_detection_rules` 
(`rule_code`, `rule_name`, `detection_type`, `scene`, `status`, `priority`, `alert_level`, `detection_params`, `description`, `auto_create_work_order`, `auto_notify_user`, `auto_sync_order_status`, `sla_response_minutes`, `created_by`, `created_by_name`) 
VALUES
('RULE_STAGNANT_001', '物流停滞检测', 'stagnant', 'all', 1, 100, 2, '{"stagnant_hours": 24}', '物流信息24小时未更新则判定为停滞', 1, 1, 0, 60, 1, '系统管理员'),
('RULE_MISROUTE_001', '错发检测', 'misroute', 'in_transit', 1, 90, 3, '{"misroute_distance_threshold": 100}', '轨迹方向与目的地不符则判定为错发', 1, 1, 1, 30, 1, '系统管理员'),
('RULE_TIMEOUT_001', '运输超时检测', 'timeout', 'in_transit', 1, 85, 2, '{"timeout_hours": 72}', '发货72小时仍未派送则判定为运输超时', 1, 1, 0, 60, 1, '系统管理员'),
('RULE_TIMEOUT_002', '派送超时检测', 'timeout', 'delivering', 1, 80, 3, '{"timeout_hours": 24}', '开始派送24小时仍未签收则判定为派送超时', 1, 1, 0, 30, 1, '系统管理员'),
('RULE_REPEAT_001', '重复节点检测', 'repeat_track', 'all', 1, 70, 1, '{"repeat_track_window_hours": 6}', '6小时内出现相同轨迹内容则判定为重复节点', 0, 0, 0, 120, 1, '系统管理员'),
('RULE_FAKE_001', '虚假轨迹检测', 'fake_track', 'all', 1, 95, 3, NULL, '检测包含测试、模拟等关键词或时间异常的轨迹', 1, 1, 1, 15, 1, '系统管理员'),
('RULE_MISSING_001', '节点缺失检测', 'node_missing', 'all', 1, 75, 2, NULL, '检测链路中缺少必要的节点状态', 0, 0, 0, 120, 1, '系统管理员');

-- =============================================
-- 6. 测试数据 - 链路匹配记录
-- =============================================
INSERT INTO `logistics_link_match_records` 
(`match_no`, `order_id`, `order_no`, `status`, `block_reason`, `address_info`, `product_info`, `matched_providers`, `alternative_solutions`, `cost_time_ms`, `created_by`, `created_by_name`) 
VALUES
('LM202401010001', 1, 'ORD20240101001', 1, NULL, 
 '{"province": "北京市", "city": "北京市", "district": "朝阳区", "address": "建国路88号", "is_remote": false}',
 '[{"product_id": 1, "product_name": "智能手机", "category_name": "数码产品", "weight": 0.5, "is_forbidden": false}]',
 '[{"provider_id": 1, "provider_name": "顺丰速运", "provider_code": "WL000001", "score": 95, "estimated_days": 2, "cost": 15.00}]',
 '[{"type": "recommended_provider", "title": "推荐选择：顺丰速运", "description": "综合评分最高：95分，预计2天送达，费用¥15.00"}]',
 1500, 1, '系统管理员'),
('LM202401010002', 2, 'ORD20240101002', 3, '收货地址属于偏远地区，常规配送无法覆盖',
 '{"province": "西藏自治区", "city": "阿里地区", "district": "噶尔县", "address": "狮泉河镇", "is_remote": true}',
 '[{"product_id": 2, "product_name": "服装", "category_name": "服饰", "weight": 1.2, "is_forbidden": false}]',
 '[]',
 '[{"type": "premium_delivery", "title": "升级为偏远地区配送", "description": "选择支持偏远地区配送的服务商，需额外支付偏远地区配送费", "extra_cost": 20, "extra_days": 2}, {"type": "self_pickup", "title": "改为网点自提", "description": "选择最近的物流网点自提，无需额外费用"}]',
 1800, 1, '系统管理员'),
('LM202401010003', 3, 'ORD20240101003', 4, '以下商品为禁运品：烟花爆竹套装',
 '{"province": "上海市", "city": "上海市", "district": "浦东新区", "address": "陆家嘴金融中心", "is_remote": false}',
 '[{"product_id": 3, "product_name": "烟花爆竹套装", "category_name": "易燃易爆品", "weight": 5.0, "is_forbidden": true, "forbidden_reason": "商品属于禁运品类"}]',
 '[]',
 '[{"type": "special_carrier", "title": "使用特种物流服务商", "description": "选择具备特殊商品运输资质的服务商", "extra_cost": 50, "extra_days": 3}]',
 1200, 1, '系统管理员');

-- =============================================
-- 7. 测试数据 - 运维工单
-- =============================================
INSERT INTO `logistics_link_work_orders` 
(`work_order_no`, `shipment_id`, `shipment_no`, `order_id`, `order_no`, `abnormal_log_id`, `type`, `title`, `description`, `priority`, `status`, `sla_expire_at`, `created_by`, `created_by_name`, `source`, `remark`) 
VALUES
('WO202401010001', 1, 'SF20240101001', 1, 'ORD20240101001', 1, 1, '物流停滞 - SF20240101001', '物流信息已停滞30小时，超过24小时阈值', 2, 0, '2024-01-02 12:00:00', 1, '系统管理员', 'system', '根据规则【物流停滞检测】自动创建'),
('WO202401010002', 2, 'YTO20240101001', 2, 'ORD20240101002', 2, 1, '疑似错发 - YTO20240101001', '当前轨迹"发往乌鲁木齐中转"与目的地"上海市"方向不符', 3, 1, '2024-01-02 10:00:00', 1, '系统管理员', 'system', '根据规则【错发检测】自动创建'),
('WO202401010003', 3, 'ZTO20240101001', 3, 'ORD20240101003', NULL, 2, '物流核查 - ZTO20240101001', '客户反馈未收到货，需核查物流状态', 2, 2, '2024-01-02 14:00:00', 1, '系统管理员', 'manual', '人工发起的物流核查');

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================
-- 脚本执行完成
-- =============================================
