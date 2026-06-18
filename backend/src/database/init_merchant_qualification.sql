SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
USE annotation_db;

ALTER TABLE `merchants`
  ADD COLUMN `legal_person` varchar(50) DEFAULT NULL COMMENT '法人姓名' AFTER `address`,
  ADD COLUMN `legal_id_card` varchar(50) DEFAULT NULL COMMENT '法人身份证号' AFTER `legal_person`,
  ADD COLUMN `business_license_no` varchar(50) DEFAULT NULL COMMENT '营业执照号' AFTER `legal_id_card`,
  ADD COLUMN `credit_code` varchar(50) DEFAULT NULL COMMENT '统一社会信用代码' AFTER `business_license_no`,
  ADD COLUMN `license_valid_from` date DEFAULT NULL COMMENT '营业执照有效期起始' AFTER `credit_code`,
  ADD COLUMN `license_valid_to` date DEFAULT NULL COMMENT '营业执照有效期终止' AFTER `license_valid_from`,
  ADD COLUMN `license_image_url` varchar(500) DEFAULT NULL COMMENT '营业执照图片URL' AFTER `license_valid_to`,
  ADD COLUMN `legal_id_front_url` varchar(500) DEFAULT NULL COMMENT '法人身份证正面URL' AFTER `license_image_url`,
  ADD COLUMN `legal_id_back_url` varchar(500) DEFAULT NULL COMMENT '法人身份证反面URL' AFTER `legal_id_front_url`,
  ADD COLUMN `registered_capital` decimal(18,2) DEFAULT NULL COMMENT '注册资本(万元)' AFTER `legal_id_back_url`,
  ADD COLUMN `establish_date` date DEFAULT NULL COMMENT '成立日期' AFTER `registered_capital`,
  ADD COLUMN `business_scope` text COMMENT '经营范围' AFTER `establish_date`,
  ADD COLUMN `settle_status` tinyint unsigned DEFAULT 0 COMMENT '入驻状态：0-待提交 1-待审核 2-审核通过 3-审核驳回 4-资质过期 5-资质异常 6-已禁用' AFTER `business_scope`,
  ADD COLUMN `shop_open_status` tinyint unsigned DEFAULT 0 COMMENT '店铺开通权限：0-未开通 1-已开通' AFTER `settle_status`,
  ADD COLUMN `goods_publish_permission` tinyint unsigned DEFAULT 0 COMMENT '商品上架权限：0-无权限 1-有权限' AFTER `shop_open_status`,
  ADD COLUMN `industry_type` varchar(100) DEFAULT NULL COMMENT '行业类型' AFTER `goods_publish_permission`,
  ADD COLUMN `qualification_remark` varchar(2000) DEFAULT NULL COMMENT '资质备注' AFTER `industry_type`,
  ADD COLUMN `audit_reason` varchar(1000) DEFAULT NULL COMMENT '审核原因/驳回原因' AFTER `qualification_remark`,
  ADD COLUMN `last_audit_time` datetime DEFAULT NULL COMMENT '最后审核时间' AFTER `audit_reason`,
  ADD UNIQUE KEY `uk_credit_code` (`credit_code`),
  ADD UNIQUE KEY `uk_business_license_no` (`business_license_no`),
  ADD KEY `idx_settle_status` (`settle_status`),
  ADD KEY `idx_license_valid_to` (`license_valid_to`);

ALTER TABLE `merchant_audits`
  ADD COLUMN `audit_step` varchar(50) DEFAULT 'submit' COMMENT '审核步骤：submit-提交 approve-通过 reject-驳回 resubmit-补传 review-复核' AFTER `reason`,
  ADD COLUMN `missing_materials` json DEFAULT NULL COMMENT '缺失材料列表' AFTER `audit_step`,
  ADD COLUMN `violation_points` json DEFAULT NULL COMMENT '违规点列表' AFTER `missing_materials`,
  ADD COLUMN `need_resubmit` tinyint unsigned DEFAULT 0 COMMENT '是否需要补传：0-否 1-是' AFTER `violation_points`,
  ADD COLUMN `resubmit_deadline` datetime DEFAULT NULL COMMENT '补传截止日期' AFTER `need_resubmit`,
  ADD COLUMN `operation_type` varchar(50) DEFAULT 'initial' COMMENT '操作类型：initial-首次提交 resubmit-补传 review-复核' AFTER `resubmit_deadline`;

ALTER TABLE `merchant_qualifications`
  ADD COLUMN `certificate_holder` varchar(255) DEFAULT NULL COMMENT '证件持有人' AFTER `certificate_no`,
  ADD COLUMN `valid_from` date DEFAULT NULL COMMENT '有效期起始' AFTER `expire_date`,
  ADD COLUMN `verification_status` tinyint unsigned DEFAULT 0 COMMENT '核验状态：0-未核验 1-核验通过 2-核验不通过 3-核验异常' AFTER `valid_from`,
  ADD COLUMN `verification_source` varchar(50) DEFAULT 'system' COMMENT '核验来源：system-系统正则 manual-人工 industry-工商数据' AFTER `verification_status`,
  ADD COLUMN `verification_remark` varchar(1000) DEFAULT NULL COMMENT '核验备注' AFTER `verification_source`,
  ADD COLUMN `missing_flag` tinyint unsigned DEFAULT 0 COMMENT '缺失标记：0-否 1-是' AFTER `verification_remark`,
  ADD COLUMN `violation_flag` tinyint unsigned DEFAULT 0 COMMENT '违规标记：0-否 1-是' AFTER `missing_flag`,
  ADD COLUMN `audit_opinion` varchar(1000) DEFAULT NULL COMMENT '审核意见' AFTER `violation_flag`,
  ADD COLUMN `material_order` int unsigned DEFAULT 0 COMMENT '材料排序' AFTER `audit_opinion`,
  ADD COLUMN `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间' AFTER `created_at`,
  ADD KEY `idx_verification_status` (`verification_status`),
  ADD KEY `idx_status_valid_to` (`status`, `expire_date`);

DROP TABLE IF EXISTS `merchant_qualification_ledgers`;
CREATE TABLE `merchant_qualification_ledgers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `merchant_id` bigint unsigned NOT NULL COMMENT '商家ID',
  `qualification_id` bigint unsigned DEFAULT NULL COMMENT '资质ID',
  `operation_type` varchar(50) NOT NULL COMMENT '操作类型：submit-提交 approve-通过 reject-驳回 expire-过期 change-变更 freeze-冻结 unfreeze-解冻' AFTER `qualification_id`,
  `status_before` tinyint unsigned DEFAULT NULL COMMENT '操作前状态',
  `status_after` tinyint unsigned DEFAULT NULL COMMENT '操作后状态',
  `settle_status_before` tinyint unsigned DEFAULT NULL COMMENT '入驻状态操作前',
  `settle_status_after` tinyint unsigned DEFAULT NULL COMMENT '入驻状态操作后',
  `valid_from_before` date DEFAULT NULL COMMENT '有效期起始操作前',
  `valid_from_after` date DEFAULT NULL COMMENT '有效期起始操作后',
  `valid_to_before` date DEFAULT NULL COMMENT '有效期终止操作前',
  `valid_to_after` date DEFAULT NULL COMMENT '有效期终止操作后',
  `operator_id` bigint unsigned DEFAULT NULL COMMENT '操作人ID',
  `operator_name` varchar(50) DEFAULT NULL COMMENT '操作人姓名',
  `operation_remark` varchar(2000) DEFAULT NULL COMMENT '操作备注',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_merchant_id` (`merchant_id`),
  KEY `idx_qualification_id` (`qualification_id`),
  KEY `idx_operation_type` (`operation_type`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商家资质台账表';

DROP TABLE IF EXISTS `qualification_change_logs`;
CREATE TABLE `qualification_change_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `merchant_id` bigint unsigned NOT NULL COMMENT '商家ID',
  `qualification_id` bigint unsigned DEFAULT NULL COMMENT '资质ID',
  `change_field` varchar(100) NOT NULL COMMENT '变更字段',
  `value_before` text COMMENT '变更前值',
  `value_after` text COMMENT '变更后值',
  `operator_id` bigint unsigned DEFAULT NULL COMMENT '操作人ID',
  `operator_name` varchar(50) DEFAULT NULL COMMENT '操作人姓名',
  `change_reason` varchar(1000) DEFAULT NULL COMMENT '变更原因',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_merchant_id` (`merchant_id`),
  KEY `idx_qualification_id` (`qualification_id`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='资质变更记录表';

SET FOREIGN_KEY_CHECKS = 1;
