-- ============================================================
-- 图文内容管理 - 数据库SQL脚本
-- 包含：文章主表、版本记录、专题、敏感词、审核记录 5张表
-- ============================================================

-- ============================================================
-- 1. 图文文章主表 articles
-- ============================================================
CREATE TABLE IF NOT EXISTS `articles` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '文章ID',
  `unique_code` VARCHAR(50) NOT NULL COMMENT '图文唯一编码',
  `title` VARCHAR(255) NOT NULL COMMENT '文章标题',
  `summary` VARCHAR(500) NULL COMMENT '摘要',
  `content` LONGTEXT NULL COMMENT '正文内容(富文本/Markdown JSON)',
  `cover_image` VARCHAR(255) NULL COMMENT '封面图URL',
  `images_json` JSON NULL COMMENT '配图数组，格式：[{"url":"","width":750,"height":300,"alt":""}]',
  `domain_category_id` BIGINT UNSIGNED NULL COMMENT '领域分类ID',
  `channel` VARCHAR(50) NOT NULL DEFAULT 'infopage' COMMENT '发布渠道：homepage首页 infopage资讯页 special专题页',
  `template` VARCHAR(50) NOT NULL DEFAULT 'article_default' COMMENT '排版模板：article_default banner_list full_width topic_special',
  `word_count` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '正文字数',
  `view_count` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '阅读量',
  `like_count` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '点赞量',
  `comment_count` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '评论量',
  `share_count` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '分享量',
  `top_flag` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '是否置顶：0否 1是',
  `sort_weight` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '排序权重(越大越前)',
  `status` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '状态：0草稿 1待审核 2已发布 3已下架 4审核拒绝',
  `version` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT '当前版本号',
  `topic_id` BIGINT UNSIGNED NULL COMMENT '关联专题ID',
  `publisher_id` BIGINT UNSIGNED NOT NULL COMMENT '发布人ID',
  `publisher_type` TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '发布人类型：1管理员 2普通运营 3商家',
  `published_at` DATETIME NULL COMMENT '发布时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_unique_code` (`unique_code`),
  KEY `idx_domain` (`domain_category_id`),
  KEY `idx_channel` (`channel`),
  KEY `idx_status` (`status`),
  KEY `idx_publisher` (`publisher_id`,`publisher_type`),
  KEY `idx_published_at` (`published_at`),
  KEY `idx_top_sort` (`top_flag` DESC, `sort_weight` DESC),
  KEY `idx_topic` (`topic_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='图文文章主表';

-- ============================================================
-- 2. 文章版本记录表 article_versions (支持增量修改/全覆盖修改双模式)
-- ============================================================
CREATE TABLE IF NOT EXISTS `article_versions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '版本记录ID',
  `article_id` BIGINT UNSIGNED NOT NULL COMMENT '文章ID',
  `version` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT '版本号 v1.0.0 递增',
  `title` VARCHAR(255) NOT NULL COMMENT '该版本标题快照',
  `content` LONGTEXT NULL COMMENT '该版本正文完整快照',
  `cover_image` VARCHAR(255) NULL COMMENT '该版本封面快照',
  `images_json` JSON NULL COMMENT '该版本配图快照',
  `change_log` VARCHAR(500) NULL COMMENT '修改说明',
  `editor_id` BIGINT UNSIGNED NOT NULL COMMENT '编辑人ID',
  `edit_type` TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '修改类型：1增量修改 2全覆盖修改',
  `reviewed_status` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '审核状态：0未提交 1待审核 2审核通过 3审核拒绝',
  `reviewer_id` BIGINT UNSIGNED NULL COMMENT '审核人ID',
  `review_remark` VARCHAR(500) NULL COMMENT '审核备注/拒绝原因',
  `reviewed_at` DATETIME NULL COMMENT '审核时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '版本创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_article_version` (`article_id`,`version`),
  KEY `idx_editor` (`editor_id`),
  KEY `idx_reviewed` (`reviewed_status`, `reviewed_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文章版本记录表';

-- ============================================================
-- 3. 专题表 article_topics (图文专题，关联资源位)
-- ============================================================
CREATE TABLE IF NOT EXISTS `article_topics` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '专题ID',
  `name` VARCHAR(100) NOT NULL COMMENT '专题名称',
  `unique_code` VARCHAR(50) NOT NULL COMMENT '专题唯一编码',
  `cover_image` VARCHAR(255) NULL COMMENT '专题封面',
  `description` VARCHAR(500) NULL COMMENT '专题描述',
  `banner_image` VARCHAR(255) NULL COMMENT '专题banner大图',
  `resource_slot_json` JSON NULL COMMENT '资源位配置，格式：[{"slot_id":"home_top1","location":"首页头部","sort":1}]',
  `channel` VARCHAR(50) NOT NULL DEFAULT 'special' COMMENT '所属频道',
  `sort` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '排序',
  `status` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '状态：0未启用 1启用 2结束',
  `published_count` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '已发布图文数量',
  `start_date` DATE NULL COMMENT '专题开始日期',
  `end_date` DATE NULL COMMENT '专题结束日期',
  `created_by` BIGINT UNSIGNED NULL COMMENT '创建人ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_unique_code` (`unique_code`),
  KEY `idx_status` (`status`),
  KEY `idx_channel` (`channel`),
  KEY `idx_date` (`start_date`, `end_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='图文专题表';

-- ============================================================
-- 4. 敏感词库 sensitive_words (实时扫描命中位置)
-- ============================================================
CREATE TABLE IF NOT EXISTS `sensitive_words` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '敏感词ID',
  `word` VARCHAR(100) NOT NULL COMMENT '敏感词',
  `type` TINYINT UNSIGNED NOT NULL DEFAULT 5 COMMENT '类型：1政治敏感 2色情 3暴力 4违规广告 5其他违规',
  `level` TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '风险等级：1低 2中 3高',
  `replacement` VARCHAR(100) NULL COMMENT '替换词(例：*** )',
  `status` TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '状态：0禁用 1启用',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_word` (`word`),
  KEY `idx_type_level` (`type`,`level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='敏感词库';

-- ============================================================
-- 5. 审核记录表 article_review_logs (每一次审核操作完整溯源)
-- ============================================================
CREATE TABLE IF NOT EXISTS `article_review_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '记录ID',
  `article_id` BIGINT UNSIGNED NOT NULL COMMENT '文章ID',
  `version` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT '对应版本号',
  `reviewer_id` BIGINT UNSIGNED NOT NULL COMMENT '审核人ID',
  `action` VARCHAR(20) NOT NULL COMMENT '动作：submit提交审核 pass审核通过 reject审核拒绝 offline下架',
  `before_status` TINYINT UNSIGNED NOT NULL COMMENT '审核前状态',
  `after_status` TINYINT UNSIGNED NOT NULL COMMENT '审核后状态',
  `remark` VARCHAR(500) NULL COMMENT '审核备注/拒绝原因',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
  PRIMARY KEY (`id`),
  KEY `idx_article` (`article_id`),
  KEY `idx_reviewer` (`reviewer_id`),
  KEY `idx_action` (`action`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文章审核记录表';

-- ============================================================
-- 测试数据 (可选)
-- ============================================================

-- 敏感词测试数据 (覆盖所有类型和等级)
INSERT INTO `sensitive_words` (`word`, `type`, `level`, `replacement`, `status`) VALUES
('违规词示例1', 1, 3, '***', 1),
('广告代发', 4, 2, '【广告】', 1),
('联系方式', 4, 1, '***', 1),
('敏感词示例A', 2, 3, '***', 1),
('敏感词示例B', 3, 2, '***', 1),
('限时特价', 4, 1, '*限时*', 1);

-- 专题测试数据
INSERT INTO `article_topics` (`id`, `name`, `unique_code`, `cover_image`, `description`, `banner_image`, `resource_slot_json`, `channel`, `sort`, `status`, `published_count`, `start_date`, `end_date`, `created_by`) VALUES
(1, '2026春季新品推荐', 'TOPIC-SPRING-2026', '/images/topic/spring.jpg', '聚焦2026年度春季潮流新品，行业精选内容合集', '/images/topic/spring_banner.png',
  '[{"slot_id":"home_top1","location":"首页轮播1","sort":1},{"slot_id":"info_side","location":"资讯侧栏","sort":2}]',
  'special', 1, 1, 0, '2026-03-01', '2026-05-31', 1),
(2, '618大促作战指南', 'TOPIC-618-2026', '/images/topic/618.jpg', '618年度大促商家运营指南+用户购买攻略', '/images/topic/618_banner.png',
  '[{"slot_id":"home_top2","location":"首页轮播2","sort":1}]',
  'homepage', 2, 1, 0, '2026-06-01', '2026-06-30', 1),
(3, '双11商家攻略', 'TOPIC-1111-2026', '/images/topic/double11.jpg', '双11超级大促全方位指导专题', NULL, NULL, 'special', 3, 0, 0, '2026-10-20', '2026-11-30', 1);

-- 图文测试数据 (5条示例)
INSERT INTO `articles` (`id`, `unique_code`, `title`, `summary`, `content`, `cover_image`, `images_json`, `domain_category_id`, `channel`, `template`, `word_count`, `view_count`, `like_count`, `comment_count`, `share_count`, `top_flag`, `sort_weight`, `status`, `version`, `topic_id`, `publisher_id`, `publisher_type`, `published_at`) VALUES
(1, 'ART-20260617-0001', '2026年智能手机选购完全指南：从千元机到旗舰机全面对比', '本文从屏幕、性能、影像、续航四大维度深度解析2026年智能手机选购要点，覆盖全价位段。',
  '{"type":"rich","content":"<h2>开篇</h2><p>2026年的智能手机市场百花齐放...</p>"}',
  '/images/article/phone_guide_cover.jpg',
  '[{"url":"/images/article/phone_1.jpg","width":1200,"height":800,"alt":"旗舰对比"},{"url":"/images/article/phone_2.jpg","width":750,"height":500,"alt":"续航测试"}]',
  3, 'homepage', 'full_width', 4280, 12580, 892, 156, 428, 1, 9999, 2, 1, 1, 1, 1, '2026-06-10 09:30:00'),
(2, 'ART-20260617-0002', '618大促省钱攻略：10大必买清单 + 优惠券叠加技巧', '618年中大促即将开始，本文整理了10大高性价比必买清单和优惠券叠加使用终极技巧。',
  '{"type":"rich","content":"<p>618大促，省钱才是硬道理！...</p>"}',
  '/images/article/618_guide.jpg',
  '[{"url":"/images/article/618_1.jpg","width":800,"height":600}]',
  3, 'special', 'topic_special', 3560, 8920, 568, 89, 210, 0, 5000, 2, 1, 2, 2, 2, '2026-06-01 10:00:00'),
(3, 'ART-20260617-0003', '【草稿】2026下半年电商趋势预测 - 私域运营新机会', '草稿文章，预计7月1日发布',
  '{"type":"markdown","content":"# 2026下半年趋势\\n\\n## 私域运营\\n\\n...待补充"}',
  '/images/article/draft_cover.jpg', NULL,
  3, 'infopage', 'article_default', 1200, 0, 0, 0, 0, 0, 0, 0, 1, NULL, 1, 1, NULL),
(4, 'ART-20260617-0004', '如何打造爆款内容：标题/封面/正文黄金公式拆解', '阅读量10W+爆款内容的核心密码是什么？本文拆解100篇爆款文章，提炼出可复制的成功公式。',
  '{"type":"rich","content":"<h3>标题公式</h3>"}',
  '/images/article/viral_content.jpg', NULL,
  3, 'infopage', 'banner_list', 6820, 28900, 2180, 340, 890, 0, 8500, 1, 3, NULL, 1, 1, NULL),
(5, 'ART-20260617-0005', '【审核拒绝】违反广告法极限词文章', '含有"国家级""最高级"等违规极限词，审核未通过',
  '{"type":"rich","content":"...内容含国家级、最高级等极限词"}',
  '/images/article/rejected.jpg', NULL,
  3, 'infopage', 'article_default', 2100, 0, 0, 0, 0, 0, 0, 4, 2, NULL, 2, 2, NULL);

-- 文章版本测试数据 (示例：Article #1 v1→v2→v3)
INSERT INTO `article_versions` (`article_id`, `version`, `title`, `content`, `cover_image`, `change_log`, `editor_id`, `edit_type`, `reviewed_status`, `reviewer_id`, `review_remark`, `reviewed_at`) VALUES
(1, 1, '2026智能手机选购指南', '{"type":"rich","content":"初版内容"}', '/images/article/v1_cover.jpg', '创建初稿', 1, 2, 2, 1, '内容完整，通过审核', '2026-06-09 15:00:00'),
(1, 2, '2026智能手机选购完全指南', '{"type":"rich","content":"增补影像章节"}', '/images/article/phone_guide_cover.jpg', '新增影像测试对比章节', 2, 1, 2, 1, '增量修改审核通过', '2026-06-09 20:30:00'),
(1, 3, '2026年智能手机选购完全指南：从千元机到旗舰机全面对比', '{"type":"rich","content":"旗舰对比+千元机章节"}', '/images/article/phone_guide_cover.jpg', '增加千元机章节，调整标题强化SEO', 1, 2, 2, 1, '全覆盖修改审核通过，更新线上内容', '2026-06-10 09:28:00'),
(4, 1, '如何打造爆款内容：标题/封面/正文黄金公式拆解', '{"type":"rich","content":"首发版"}', '/images/article/viral_content.jpg', '初始发布', 1, 2, 2, 1, NULL, '2026-06-05 10:00:00'),
(5, 1, '【审核拒绝】违反广告法极限词文章', '{"type":"rich","content":"含极限词"}', '/images/article/rejected.jpg', '运营提交审核', 2, 2, 3, 1, '第3段和第5段含有"国家级""最高级"等违规极限词，请修改后重新提交', '2026-06-12 14:20:00');

-- 审核测试日志
INSERT INTO `article_review_logs` (`article_id`, `version`, `reviewer_id`, `action`, `before_status`, `after_status`, `remark`) VALUES
(1, 1, 1, 'submit', 0, 1, '运营提交初稿审核'),
(1, 1, 1, 'pass', 1, 2, '内容完整，通过审核'),
(1, 2, 1, 'submit', 2, 1, '提交增量修改审核'),
(1, 2, 1, 'pass', 1, 2, '增量修改通过，自动同步线上'),
(1, 3, 1, 'submit', 2, 1, '提交全覆盖修改审核'),
(1, 3, 1, 'pass', 1, 2, '全覆盖修改通过，v3上线'),
(5, 1, 2, 'submit', 0, 1, '提交审核'),
(5, 1, 1, 'reject', 1, 4, '含违规极限词，具体位置：第3段第5行、第5段第2行');
