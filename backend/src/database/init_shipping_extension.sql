-- ============================================
-- 订单发货物流管控 - 数据库扩展脚本
-- ============================================

-- 1. 为 orders 表添加物流相关字段
ALTER TABLE `orders`
ADD COLUMN `logistics_provider_id` BIGINT UNSIGNED NULL COMMENT '物流服务商ID' AFTER `shipping_status`,
ADD COLUMN `shipped_at` DATETIME NULL COMMENT '发货时间' AFTER `logistics_provider_id`,
ADD COLUMN `signer_name` VARCHAR(50) NULL COMMENT '收件人姓名' AFTER `shipped_at`,
ADD COLUMN `signed_at` DATETIME NULL COMMENT '签收时间' AFTER `signer_name`,
ADD COLUMN `logistics_status` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '物流状态：0-待发货 1-已揽收 2-运输中 3-派送中 4-已签收 5-签收异常 6-已退回' AFTER `signed_at`,
ADD COLUMN `logistics_abnormal_flag` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '物流异常标记：0-正常 1-地址异常 2-物流停滞 3-拒收 4-破损' AFTER `logistics_status`,
ADD COLUMN `logistics_abnormal_reason` VARCHAR(500) NULL COMMENT '物流异常原因' AFTER `logistics_abnormal_flag`,
ADD COLUMN `actual_freight` DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT '实际运费' AFTER `logistics_abnormal_reason`;

-- ============================================
-- 2. 创建物流服务商表
-- ============================================
CREATE TABLE IF NOT EXISTS `logistics_providers` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `provider_code` VARCHAR(32) NOT NULL COMMENT '服务商编码',
  `provider_name` VARCHAR(100) NOT NULL COMMENT '服务商名称',
  `contact_person` VARCHAR(50) NULL COMMENT '联系人',
  `contact_phone` VARCHAR(20) NULL COMMENT '联系电话',
  `api_url` VARCHAR(255) NULL COMMENT 'API接口地址',
  `api_key` VARCHAR(100) NULL COMMENT 'API密钥',
  `status` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '状态：0-停用 1-启用',
  `support_area` TEXT NULL COMMENT '支持配送区域(JSON数组)',
  `freight_template` TEXT NULL COMMENT '运费模板配置(JSON)',
  `remark` VARCHAR(500) NULL COMMENT '备注',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_provider_code` (`provider_code`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='物流服务商表';

-- ============================================
-- 3. 创建发货记录表
-- ============================================
CREATE TABLE IF NOT EXISTS `shipment_records` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `shipment_no` VARCHAR(32) NOT NULL COMMENT '发货单号',
  `order_id` BIGINT UNSIGNED NOT NULL COMMENT '订单ID',
  `order_no` VARCHAR(32) NOT NULL COMMENT '订单编号',
  `merchant_id` BIGINT UNSIGNED NOT NULL COMMENT '商家ID',
  `merchant_name` VARCHAR(100) NULL COMMENT '商家名称',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `logistics_provider_id` BIGINT UNSIGNED NOT NULL COMMENT '物流服务商ID',
  `logistics_provider_name` VARCHAR(100) NULL COMMENT '物流服务商名称',
  `logistics_no` VARCHAR(50) NOT NULL COMMENT '物流单号',
  `logistics_company` VARCHAR(100) NULL COMMENT '物流公司名称',
  `receiver_name` VARCHAR(50) NULL COMMENT '收货人姓名',
  `receiver_phone` VARCHAR(20) NULL COMMENT '收货人电话',
  `receiver_province` VARCHAR(50) NULL COMMENT '收货省份',
  `receiver_city` VARCHAR(50) NULL COMMENT '收货城市',
  `receiver_district` VARCHAR(50) NULL COMMENT '收货区县',
  `receiver_address` VARCHAR(255) NULL COMMENT '详细地址',
  `goods_list` TEXT NULL COMMENT '商品列表(JSON数组)',
  `package_count` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT '包裹数量',
  `package_weight` DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT '包裹重量(kg)',
  `freight_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT '运费金额',
  `actual_freight` DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT '实际运费',
  `insurance_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT '保价金额',
  `status` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '状态：0-待揽收 1-已揽收 2-运输中 3-派送中 4-已签收 5-签收异常 6-已退回',
  `abnormal_flag` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '异常标记：0-正常 1-地址异常 2-物流停滞 3-拒收 4-破损',
  `abnormal_reason` VARCHAR(500) NULL COMMENT '异常原因',
  `shipped_at` DATETIME NULL COMMENT '发货时间',
  `signed_at` DATETIME NULL COMMENT '签收时间',
  `signer_name` VARCHAR(50) NULL COMMENT '签收人姓名',
  `operator_id` BIGINT UNSIGNED NULL COMMENT '操作人ID',
  `operator_name` VARCHAR(50) NULL COMMENT '操作人姓名',
  `remark` VARCHAR(500) NULL COMMENT '备注',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_shipment_no` (`shipment_no`),
  UNIQUE KEY `uk_logistics_no` (`logistics_no`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_merchant_id` (`merchant_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_provider_id` (`logistics_provider_id`),
  KEY `idx_status` (`status`),
  KEY `idx_abnormal_flag` (`abnormal_flag`),
  KEY `idx_shipped_at` (`shipped_at`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='发货记录表';

-- ============================================
-- 4. 创建物流轨迹表
-- ============================================
CREATE TABLE IF NOT EXISTS `logistics_tracks` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `track_no` VARCHAR(32) NOT NULL COMMENT '轨迹编号',
  `shipment_id` BIGINT UNSIGNED NOT NULL COMMENT '发货记录ID',
  `shipment_no` VARCHAR(32) NOT NULL COMMENT '发货单号',
  `order_id` BIGINT UNSIGNED NOT NULL COMMENT '订单ID',
  `order_no` VARCHAR(32) NOT NULL COMMENT '订单编号',
  `logistics_provider_id` BIGINT UNSIGNED NOT NULL COMMENT '物流服务商ID',
  `logistics_no` VARCHAR(50) NOT NULL COMMENT '物流单号',
  `track_status` TINYINT UNSIGNED NOT NULL COMMENT '轨迹状态：1-已揽收 2-运输中 3-派送中 4-已签收 5-异常 6-退回',
  `location` VARCHAR(255) NULL COMMENT '当前位置',
  `province` VARCHAR(50) NULL COMMENT '省份',
  `city` VARCHAR(50) NULL COMMENT '城市',
  `district` VARCHAR(50) NULL COMMENT '区县',
  `description` VARCHAR(500) NOT NULL COMMENT '轨迹描述',
  `operator` VARCHAR(100) NULL COMMENT '操作人/快递员',
  `operator_phone` VARCHAR(20) NULL COMMENT '联系电话',
  `track_time` DATETIME NOT NULL COMMENT '轨迹时间',
  `is_abnormal` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '是否异常：0-否 1-是',
  `abnormal_type` VARCHAR(50) NULL COMMENT '异常类型',
  `abnormal_desc` VARCHAR(500) NULL COMMENT '异常描述',
  `source` TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '数据来源：1-系统录入 2-API同步 3-手动更新',
  `remark` VARCHAR(500) NULL COMMENT '备注',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_track_no` (`track_no`),
  KEY `idx_shipment_id` (`shipment_id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_logistics_no` (`logistics_no`),
  KEY `idx_track_status` (`track_status`),
  KEY `idx_track_time` (`track_time`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='物流轨迹表';

-- ============================================
-- 5. 创建异常物流处理日志表
-- ============================================
CREATE TABLE IF NOT EXISTS `abnormal_logistics_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `log_no` VARCHAR(32) NOT NULL COMMENT '日志编号',
  `shipment_id` BIGINT UNSIGNED NOT NULL COMMENT '发货记录ID',
  `shipment_no` VARCHAR(32) NOT NULL COMMENT '发货单号',
  `order_id` BIGINT UNSIGNED NOT NULL COMMENT '订单ID',
  `order_no` VARCHAR(32) NOT NULL COMMENT '订单编号',
  `logistics_no` VARCHAR(50) NULL COMMENT '物流单号',
  `abnormal_type` TINYINT UNSIGNED NOT NULL COMMENT '异常类型：1-地址异常 2-物流停滞 3-拒收 4-破损 5-丢件',
  `abnormal_level` TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '异常等级：1-轻微 2-一般 3-严重',
  `abnormal_desc` VARCHAR(500) NOT NULL COMMENT '异常描述',
  `status` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '处理状态：0-待处理 1-处理中 2-已处理 3-已关闭',
  `handle_result` VARCHAR(500) NULL COMMENT '处理结果',
  `handle_method` VARCHAR(100) NULL COMMENT '处理方式',
  `operator_id` BIGINT UNSIGNED NULL COMMENT '处理人ID',
  `operator_name` VARCHAR(50) NULL COMMENT '处理人姓名',
  `reported_at` DATETIME NULL COMMENT '上报时间',
  `handled_at` DATETIME NULL COMMENT '处理完成时间',
  `closed_at` DATETIME NULL COMMENT '关闭时间',
  `remark` VARCHAR(500) NULL COMMENT '备注',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_log_no` (`log_no`),
  KEY `idx_shipment_id` (`shipment_id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_abnormal_type` (`abnormal_type`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='异常物流处理日志表';

-- ============================================
-- 6. 插入物流服务商测试数据
-- ============================================
INSERT INTO `logistics_providers` (`provider_code`, `provider_name`, `contact_person`, `contact_phone`, `api_url`, `status`, `support_area`, `freight_template`, `remark`) VALUES
('SF', '顺丰速运', '张经理', '13800000001', 'https://api.sf-express.com', 1, '["全国"]', '{"baseFee":12,"weightFee":2}', '次日达服务'),
('YTO', '圆通速递', '李经理', '13800000002', 'https://api.yto.net.cn', 1, '["全国"]', '{"baseFee":8,"weightFee":1}', '经济型快递'),
('ZTO', '中通快递', '王经理', '13800000003', 'https://api.zto.com', 1, '["全国"]', '{"baseFee":8,"weightFee":1}', '经济型快递'),
('YD', '韵达快递', '赵经理', '13800000004', 'https://api.yundaex.com', 1, '["全国"]', '{"baseFee":8,"weightFee":1}', '经济型快递'),
('JD', '京东物流', '孙经理', '13800000005', 'https://api.jdl.com', 1, '["全国"]', '{"baseFee":10,"weightFee":1.5}', '自营物流'),
('EMS', 'EMS', '周经理', '13800000006', 'https://api.ems.com.cn', 1, '["全国"]', '{"baseFee":15,"weightFee":2}', '邮政特快专递');

-- ============================================
-- 7. 为已有订单补充物流数据
-- ============================================
UPDATE `orders` SET
  `logistics_provider_id` = 1,
  `logistics_status` = 4,
  `shipped_at` = DATE_ADD(`created_at`, INTERVAL 1 HOUR),
  `signed_at` = DATE_ADD(`created_at`, INTERVAL 24 HOUR),
  `signer_name` = receiver_name,
  `logistics_company` = logistics_company,
  `actual_freight` = 12.00
WHERE `status` = 3 AND logistics_company IS NOT NULL;

UPDATE `orders` SET
  `logistics_provider_id` = 2,
  `logistics_status` = 2,
  `shipped_at` = DATE_ADD(`created_at`, INTERVAL 2 HOUR),
  `logistics_company` = '圆通速递',
  `actual_freight` = 8.00
WHERE `status` = 2 AND logistics_company IS NULL;

-- ============================================
-- 8. 插入发货记录测试数据
-- ============================================
INSERT INTO `shipment_records` (`shipment_no`, `order_id`, `order_no`, `merchant_id`, `merchant_name`, `user_id`, `logistics_provider_id`, `logistics_provider_name`, `logistics_no`, `logistics_company`, `receiver_name`, `receiver_phone`, `receiver_province`, `receiver_city`, `receiver_district`, `receiver_address`, `package_count`, `package_weight`, `freight_amount`, `actual_freight`, `status`, `shipped_at`, `signed_at`, `signer_name`, `operator_id`, `operator_name`, `remark`) VALUES
('SH202501010001', 1, 'ORD202501010001', 1, '优品数码旗舰店', 1, 1, '顺丰速运', 'SF1234567890001', '顺丰速运', '张三', '138001380001', '广东省', '深圳市', '南山区', '科技园南路1号', 1, 0.50, 12.00, 12.00, 4, '2025-01-01 10:00:00', '2025-01-02 09:30:00', '张三', 1, '系统管理员', '正常发货'),
('SH202501010002', 2, 'ORD202501010002', 2, '时尚服饰店', 2, 2, '圆通速递', 'YT9876543210001', '圆通速递', '李四', '138001380002', '浙江省', '杭州市', '西湖区', '文三路100号', 1, 0.30, 8.00, 8.00, 4, '2025-01-01 11:00:00', '2025-01-02 14:20:00', '李四', 1, '系统管理员', '正常发货'),
('SH202501010003', 3, 'ORD202501010003', 1, '优品数码旗舰店', 3, 1, '顺丰速运', 'SF1234567890002', '顺丰速运', '王五', '138001380003', '北京市', '北京市', '朝阳区', '建国门外大街1号', 2, 1.20, 15.00, 15.00, 2, '2025-01-01 14:00:00', NULL, NULL, 1, '系统管理员', '运输中'),
('SH202501010004', 4, 'ORD202501010004', 1, '优品数码旗舰店', 4, 3, '中通快递', 'ZT5556667778889', '中通快递', '赵六', '138001380004', '江苏省', '南京市', '鼓楼区', '中山路50号', 1, 0.80, 8.00, 8.00, 5, '2025-01-01 16:00:00', NULL, NULL, 1, '系统管理员', '地址异常待处理');

-- ============================================
-- 9. 插入物流轨迹测试数据
-- ============================================
INSERT INTO `logistics_tracks` (`track_no`, `shipment_id`, `shipment_no`, `order_id`, `order_no`, `logistics_provider_id`, `logistics_no`, `track_status`, `location`, `province`, `city`, `district`, `description`, `operator`, `track_time`, `source`) VALUES
('TK202501010001', 1, 'SH202501010001', 1, 'ORD202501010001', 1, 'SF1234567890001', 1, '深圳市南山区', '广东省', '深圳市', '南山区', '快件已揽收，揽收员：王师傅，电话：13800000101', '王师傅', '2025-01-01 10:00:00', 1),
('TK202501010002', 1, 'SH202501010001', 1, 'ORD202501010001', 1, 'SF1234567890001', 2, '深圳集散中心', '广东省', '深圳市', '南山区', '快件已到达深圳集散中心，准备发往广州', '系统', '2025-01-01 12:00:00', 2),
('TK202501010003', 1, 'SH202501010001', 1, 'ORD202501010001', 1, 'SF1234567890001', 2, '广州转运中心', '广东省', '广州市', '白云区', '快件已到达广州转运中心', '系统', '2025-01-01 16:00:00', 2),
('TK202501010004', 1, 'SH202501010001', 1, 'ORD202501010001', 1, 'SF1234567890001', 3, '深圳市南山区科技园', '广东省', '深圳市', '南山区', '快件正在派送中，派送员：李师傅，电话：13800000102', '李师傅', '2025-01-02 08:30:00', 2),
('TK202501010005', 1, 'SH202501010001', 1, 'ORD202501010001', 1, 'SF1234567890001', 4, '深圳市南山区科技园', '广东省', '深圳市', '南山区', '快件已签收，签收人：张三', '张三', '2025-01-02 09:30:00', 2),
('TK202501010006', 2, 'SH202501010002', 2, 'ORD202501010002', 2, 'YT9876543210001', 1, '杭州市西湖区', '浙江省', '杭州市', '西湖区', '快件已揽收', '陈师傅', '2025-01-01 11:00:00', 1),
('TK202501010007', 2, 'SH202501010002', 2, 'ORD202501010002', 2, 'YT9876543210001', 2, '杭州转运中心', '浙江省', '杭州市', '余杭区', '快件已到达杭州转运中心', '系统', '2025-01-01 15:00:00', 2),
('TK202501010008', 2, 'SH202501010002', 2, 'ORD202501010002', 2, 'YT9876543210001', 4, '杭州市西湖区文三路', '浙江省', '杭州市', '西湖区', '快件已签收，签收人：李四', '李四', '2025-01-02 14:20:00', 2),
('TK202501010009', 3, 'SH202501010003', 3, 'ORD202501010003', 1, 'SF1234567890002', 1, '深圳市南山区', '广东省', '深圳市', '南山区', '快件已揽收', '刘师傅', '2025-01-01 14:00:00', 1),
('TK202501010010', 3, 'SH202501010003', 3, 'ORD202501010003', 1, 'SF1234567890002', 2, '深圳集散中心', '广东省', '深圳市', '南山区', '快件已到达深圳集散中心，发往北京', '系统', '2025-01-01 18:00:00', 2),
('TK202501010011', 4, 'SH202501010004', 4, 'ORD202501010004', 3, 'ZT5556667778889', 1, '南京市鼓楼区', '江苏省', '南京市', '鼓楼区', '快件已揽收', '周师傅', '2025-01-01 16:00:00', 1),
('TK202501010012', 4, 'SH202501010004', 4, 'ORD202501010004', 3, 'ZT5556667778889', 5, '南京市鼓楼区中山路', '江苏省', '南京市', '鼓楼区', '派送异常：地址不详，无法联系收件人', '系统', '2025-01-02 10:00:00', 2);

-- ============================================
-- 10. 插入异常物流处理日志测试数据
-- ============================================
INSERT INTO `abnormal_logistics_logs` (`log_no`, `shipment_id`, `shipment_no`, `order_id`, `order_no`, `logistics_no`, `abnormal_type`, `abnormal_level`, `abnormal_desc`, `status`, `handle_result`, `handle_method`, `operator_id`, `operator_name`, `reported_at`, `handled_at`, `remark`) VALUES
('AL202501010001', 4, 'SH202501010004', 4, 'ORD202501010004', 'ZT5556667778889', 1, 2, '派送异常：地址不详，无法联系收件人，电话无法接通', 1, NULL, NULL, 1, '系统管理员', '2025-01-02 10:05:00', NULL, '等待用户反馈正确地址');

-- ============================================
-- 脚本执行完成
-- ============================================
