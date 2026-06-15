CREATE DATABASE IF NOT EXISTS cuyan DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

USE cuyan;

-- ==================== 系统用户表 ====================
DROP TABLE IF EXISTS sys_user;
CREATE TABLE sys_user (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    password VARCHAR(255) NOT NULL COMMENT '密码',
    nickname VARCHAR(50) COMMENT '昵称',
    avatar VARCHAR(255) COMMENT '头像',
    phone VARCHAR(20) COMMENT '手机号',
    email VARCHAR(100) COMMENT '邮箱',
    status TINYINT DEFAULT 1 COMMENT '状态 0-禁用 1-启用',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除 0-未删除 1-已删除',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_username (username),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统用户表';

-- 默认密码 123456 (BCrypt)
INSERT INTO sys_user (id, username, password, nickname, avatar, phone, email, status) VALUES
(1, 'admin', '$2a$10$7JB720yubVSZvUI0rEqK/.VqGOZTH.ulu33dHOiBE8ByOhJIrdAu2', '系统管理员', 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png', '13800138000', 'admin@cuyan.com', 1),
(2, 'editor01', '$2a$10$7JB720yubVSZvUI0rEqK/.VqGOZTH.ulu33dHOiBE8ByOhJIrdAu2', '内容编辑', 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png', '13800138001', 'editor01@cuyan.com', 1),
(3, 'user01', '$2a$10$7JB720yubVSZvUI0rEqK/.VqGOZTH.ulu33dHOiBE8ByOhJIrdAu2', '普通用户', 'https://cube.elemecdn.com/9/c2/f0ee8a3c7c9638a54940382568c9dpng.png', '13800138002', 'user01@cuyan.com', 1),
(4, 'user02', '$2a$10$7JB720yubVSZvUI0rEqK/.VqGOZTH.ulu33dHOiBE8ByOhJIrdAu2', '测试用户', 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png', '13800138003', 'user02@cuyan.com', 0);

-- ==================== 词汇表 ====================
DROP TABLE IF EXISTS biz_vocabulary;
CREATE TABLE biz_vocabulary (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '词汇ID',
    word VARCHAR(100) NOT NULL COMMENT '单词',
    phonetic VARCHAR(100) COMMENT '音标',
    part_of_speech VARCHAR(50) COMMENT '词性',
    definition TEXT COMMENT '英文释义',
    example TEXT COMMENT '例句',
    translation TEXT COMMENT '中文翻译',
    difficulty INT DEFAULT 2 COMMENT '难度 1-5',
    book_name VARCHAR(200) COMMENT '所属词书',
    creator_id BIGINT NOT NULL COMMENT '创建人ID',
    status TINYINT DEFAULT 1 COMMENT '状态 0-下架 1-上架',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_word (word),
    INDEX idx_creator (creator_id),
    INDEX idx_status (status),
    INDEX idx_difficulty (difficulty),
    INDEX idx_book_name (book_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='词汇表';

INSERT INTO biz_vocabulary (id, word, phonetic, part_of_speech, definition, example, translation, difficulty, book_name, creator_id, status) VALUES
(1, 'ubiquitous', '/juːˈbɪkwɪtəs/', 'adj.', 'present, appearing, or found everywhere', 'Smartphones have become ubiquitous in modern society.', '无处不在的；普遍存在的', 3, 'GRE核心词汇', 1, 1),
(2, 'serendipity', '/ˌserənˈdɪpəti/', 'n.', 'the occurrence of events by chance in a happy or beneficial way', 'Finding that book was pure serendipity.', '意外发现美好事物的运气；机缘巧合', 4, '托福高阶词汇', 1, 1),
(3, 'ephemeral', '/ɪˈfemərəl/', 'adj.', 'lasting for a very short time', 'The beauty of cherry blossoms is ephemeral.', '短暂的；瞬息的', 3, '雅思核心词汇', 2, 1),
(4, 'eloquent', '/ˈeləkwənt/', 'adj.', 'fluent or persuasive in speaking or writing', 'She gave an eloquent speech about climate change.', '雄辩的；有说服力的', 2, '四级核心词汇', 2, 1),
(5, 'resilience', '/rɪˈzɪliəns/', 'n.', 'the capacity to recover quickly from difficulties', 'Her resilience in the face of adversity was admirable.', '恢复力；韧性', 3, '六级进阶词汇', 3, 1),
(6, 'meticulous', '/məˈtɪkjələs/', 'adj.', 'showing great attention to detail; very careful and precise', 'He is meticulous about keeping records.', '一丝不苟的；细致的', 3, 'GRE核心词汇', 3, 1),
(7, 'pragmatic', '/præɡˈmætɪk/', 'adj.', 'dealing with things sensibly and realistically', 'We need a pragmatic approach to this problem.', '务实的；实用主义的', 2, '托福基础词汇', 1, 1),
(8, 'ambiguous', '/æmˈbɪɡjuəs/', 'adj.', 'open to more than one interpretation', 'His response was deliberately ambiguous.', '模棱两可的；含糊不清的', 2, '四级核心词汇', 1, 0),
(9, 'paradigm', '/ˈpærədaɪm/', 'n.', 'a typical example or pattern of something', 'This discovery represents a paradigm shift in physics.', '范式；典范', 4, 'GRE核心词汇', 2, 2),
(10, 'melancholy', '/ˈmelənkɒli/', 'n./adj.', 'a feeling of pensive sadness, typically with no obvious cause', 'A melancholy mood descended on the group.', '忧郁；悲伤', 3, '托福高阶词汇', 3, 2);

-- ==================== 素材表 ====================
DROP TABLE IF EXISTS biz_material;
CREATE TABLE biz_material (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '素材ID',
    vocabulary_id BIGINT NOT NULL COMMENT '关联词汇ID',
    title VARCHAR(200) NOT NULL COMMENT '素材标题',
    content TEXT NOT NULL COMMENT '素材内容',
    material_type VARCHAR(20) NOT NULL COMMENT '素材类型 article/video/audio',
    source VARCHAR(200) COMMENT '来源',
    difficulty INT DEFAULT 2 COMMENT '难度 1-5',
    creator_id BIGINT NOT NULL COMMENT '创建人ID',
    status TINYINT DEFAULT 1 COMMENT '状态 0-下架 1-上架',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_vocabulary (vocabulary_id),
    INDEX idx_creator (creator_id),
    INDEX idx_type (material_type),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='学习素材表';

INSERT INTO biz_material (id, vocabulary_id, title, content, material_type, source, difficulty, creator_id, status) VALUES
(1, 1, 'Ubiquitous Technology in Daily Life', 'From smartphones to smart speakers, ubiquitous technology has transformed how we communicate, work, and live. The constant presence of internet-connected devices creates both opportunities and challenges for modern society.', 'article', 'TechDaily', 2, 1, 1),
(2, 1, 'The Ubiquitous Nature of Social Media', 'This video explores how social media platforms have become ubiquitous in every aspect of our lives, from personal relationships to professional networking.', 'video', 'YouTube', 2, 2, 1),
(3, 2, 'Stories of Serendipity in Science', 'Many groundbreaking scientific discoveries began as moments of serendipity. From Penicillin to the microwave oven, chance observations combined with prepared minds have shaped modern civilization.', 'article', 'ScienceMag', 3, 1, 1),
(4, 3, 'Ephemeral Beauty: Cherry Blossoms in Japan', 'Cherry blossoms represent the Japanese concept of mono no aware - the bittersweet awareness of ephemeral beauty. Each spring, millions gather to witness this fleeting spectacle.', 'article', 'CultureTrip', 2, 2, 1),
(5, 5, 'Building Resilience in Challenging Times', 'This audio discusses practical strategies for building emotional resilience, including mindfulness, social support networks, and cognitive reframing techniques.', 'audio', 'PodcastHub', 3, 1, 1),
(6, 7, 'Pragmatic Solutions for Remote Work', 'As remote work becomes permanent, companies need pragmatic solutions for collaboration, productivity tracking, and employee wellbeing in distributed teams.', 'article', 'BusinessReview', 3, 3, 1),
(7, 8, 'Ambiguous Communication Case Studies', 'Analysis of real-world cases where ambiguous language led to misunderstandings, with actionable tips for clearer communication in professional settings.', 'article', 'CommWorld', 4, 1, 1);

-- ==================== 评论表 ====================
DROP TABLE IF EXISTS biz_comment;
CREATE TABLE biz_comment (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '评论ID',
    vocabulary_id BIGINT COMMENT '关联词汇ID',
    material_id BIGINT COMMENT '关联素材ID',
    user_id BIGINT NOT NULL COMMENT '评论用户ID',
    content TEXT NOT NULL COMMENT '评论内容',
    likes INT DEFAULT 0 COMMENT '点赞数',
    status TINYINT DEFAULT 1 COMMENT '状态 0-隐藏 1-显示',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_vocabulary (vocabulary_id),
    INDEX idx_material (material_id),
    INDEX idx_user (user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='评论表';

INSERT INTO biz_comment (id, vocabulary_id, material_id, user_id, content, likes, status) VALUES
(1, 1, NULL, 2, '这个词太实用了！几乎每天都能在科技文章里看到。', 15, 1),
(2, 1, NULL, 3, '请问和 pervasive 有什么区别？感觉意思差不多。', 8, 1),
(3, NULL, 1, 2, '文章写得很好，例子很丰富，对理解词义帮助很大！', 5, 1),
(4, 2, NULL, 1, '我最喜欢的英文单词之一，发音也很好听。', 23, 1),
(5, NULL, 3, 3, '科学发现的故事总是这么有趣，青霉素的发现真是经典。', 12, 1),
(6, 3, NULL, 1, '樱花季去过日本，那种转瞬即逝的美确实让人难忘。', 18, 1),
(7, 5, NULL, 2, '韧性是这个时代最宝贵的品质之一，推荐大家多练习正念。', 9, 1),
(8, NULL, 5, 1, '音频内容很棒，通勤时听正好。', 4, 1),
(9, 7, NULL, 3, '务实不务虚，解决问题的核心思维。', 7, 1),
(10, NULL, 7, 2, '案例分析很到位，沟通确实是职场第一技能。', 3, 1),
(11, 8, NULL, 1, '这个词经常出现在阅读理解里，大家多记几个搭配。', 6, 0);

-- ==================== 违规记录表 ====================
DROP TABLE IF EXISTS biz_violation;
CREATE TABLE biz_violation (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '违规ID',
    user_id BIGINT NOT NULL COMMENT '违规用户ID',
    target_type VARCHAR(20) NOT NULL COMMENT '违规对象 vocabulary/material/comment',
    target_id BIGINT NOT NULL COMMENT '违规对象ID',
    reason VARCHAR(100) NOT NULL COMMENT '违规原因',
    description TEXT COMMENT '详细描述',
    status TINYINT DEFAULT 1 COMMENT '处理状态 0-待处理 1-已处理 2-已驳回',
    handler_id BIGINT COMMENT '处理人ID',
    handle_result VARCHAR(500) COMMENT '处理结果',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_target (target_type, target_id),
    INDEX idx_status (status),
    INDEX idx_handler (handler_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='违规记录表';

INSERT INTO biz_violation (id, user_id, target_type, target_id, reason, description, status, handler_id, handle_result) VALUES
(1, 1, 'comment', 11, '内容与词条无关', '评论内容涉及无关的备考广告，不符合评论区规范。', 1, 1, '已隐藏该评论，对用户进行警告提醒。'),
(2, 3, 'vocabulary', 8, '低质量词条', '词条解释不完整，缺少必要的使用场景和例句。', 0, NULL, NULL),
(3, 2, 'material', 6, '引用格式不规范', '文中引用内容缺少来源标注，不符合版权规范要求。', 1, 1, '已通知用户补全来源信息，审核通过后重新上架。');

-- ==================== 词汇操作日志表 ====================
DROP TABLE IF EXISTS biz_vocabulary_log;
CREATE TABLE biz_vocabulary_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '日志ID',
    vocabulary_id BIGINT NOT NULL COMMENT '词汇ID',
    vocabulary_word VARCHAR(100) NOT NULL COMMENT '词汇单词',
    operation_type VARCHAR(20) NOT NULL COMMENT '操作类型 create/update/delete/status',
    old_status TINYINT COMMENT '变更前状态',
    new_status TINYINT COMMENT '变更后状态',
    operator_id BIGINT NOT NULL COMMENT '操作人ID',
    operator_name VARCHAR(50) COMMENT '操作人名称',
    remark VARCHAR(500) COMMENT '操作备注',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_vocabulary (vocabulary_id),
    INDEX idx_operator (operator_id),
    INDEX idx_operation (operation_type),
    INDEX idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='词汇操作日志表';
