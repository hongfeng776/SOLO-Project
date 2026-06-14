CREATE DATABASE IF NOT EXISTS zhiqin_recruitment DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE zhiqin_recruitment;

DROP TABLE IF EXISTS sys_admin;
CREATE TABLE sys_admin (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    username VARCHAR(64) NOT NULL COMMENT '用户名',
    password VARCHAR(128) NOT NULL COMMENT '密码(BCrypt加密)',
    nickname VARCHAR(64) DEFAULT NULL COMMENT '昵称',
    avatar VARCHAR(255) DEFAULT NULL COMMENT '头像',
    status TINYINT DEFAULT 1 COMMENT '状态: 1-正常, 0-禁用',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统管理员表';

INSERT INTO sys_admin (username, password, nickname, avatar, status) VALUES
('admin', '$2a$10$7JB720yubVSZvUI0rEqK/.VqGOZTH.ulu33dHOiBE8ByOhJIrdAu2', '超级管理员', 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png', 1);

-- ----------------------------
-- 企业表
-- ----------------------------
DROP TABLE IF EXISTS enterprise;
CREATE TABLE enterprise (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    name VARCHAR(128) NOT NULL COMMENT '企业名称',
    contact_name VARCHAR(64) DEFAULT NULL COMMENT '联系人姓名',
    contact_phone VARCHAR(20) DEFAULT NULL COMMENT '联系电话',
    email VARCHAR(128) DEFAULT NULL COMMENT '邮箱',
    address VARCHAR(255) DEFAULT NULL COMMENT '地址',
    industry VARCHAR(64) DEFAULT NULL COMMENT '行业',
    scale VARCHAR(32) DEFAULT NULL COMMENT '企业规模',
    license_no VARCHAR(64) DEFAULT NULL COMMENT '营业执照号',
    status TINYINT DEFAULT 1 COMMENT '状态: 0-禁用, 1-正常, 2-审核中',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='企业表';

INSERT INTO enterprise (name, contact_name, contact_phone, email, address, industry, scale, license_no, status) VALUES
('职擎科技有限公司', '张伟', '13800138001', 'zhangwei@zhiqin.com', '北京市海淀区中关村大街1号', '互联网', '500-1000人', '91110108MA01ABCDEF', 1),
('星河数据科技', '李娜', '13800138002', 'lina@xinghe.com', '上海市浦东新区陆家嘴环路100号', '大数据', '100-500人', '91310115MA01BGHJKL', 1),
('云帆智能科技', '王磊', '13800138003', 'wanglei@yunfan.com', '深圳市南山区科技园南路8号', '人工智能', '50-100人', '91440300MA01CMNPQR', 2),
('博雅教育集团', '赵敏', '13800138004', 'zhaomin@boya.com', '广州市天河区珠江新城华夏路20号', '教育', '1000-5000人', '91440106MA01DSTUVW', 1),
('锦程金融服务', '陈浩', '13800138005', 'chenhao@jincheng.com', '杭州市西湖区文三路90号', '金融', '500-1000人', '91330106MA01EWXYZA', 0);

-- ----------------------------
-- 求职者表
-- ----------------------------
DROP TABLE IF EXISTS job_seeker;
CREATE TABLE job_seeker (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    name VARCHAR(64) NOT NULL COMMENT '姓名',
    gender TINYINT DEFAULT NULL COMMENT '性别: 0-女, 1-男',
    age INT DEFAULT NULL COMMENT '年龄',
    phone VARCHAR(20) DEFAULT NULL COMMENT '联系电话',
    email VARCHAR(128) DEFAULT NULL COMMENT '邮箱',
    education VARCHAR(32) DEFAULT NULL COMMENT '学历',
    work_years INT DEFAULT NULL COMMENT '工作年限',
    job_intention VARCHAR(128) DEFAULT NULL COMMENT '求职意向',
    status TINYINT DEFAULT 1 COMMENT '状态: 0-禁用, 1-正常',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='求职者表';

INSERT INTO job_seeker (name, gender, age, phone, email, education, work_years, job_intention, status) VALUES
('刘思远', 1, 28, '13900139001', 'liusiyuan@qq.com', '本科', 5, 'Java后端开发', 1),
('陈雨晴', 0, 25, '13900139002', 'chenyuqing@qq.com', '硕士', 2, '数据分析师', 1),
('王浩然', 1, 32, '13900139003', 'wanghaoran@qq.com', '本科', 8, '技术经理', 1),
('李晓婷', 0, 23, '13900139004', 'lixiaoting@qq.com', '本科', 0, '前端开发', 1),
('张明辉', 1, 30, '13900139005', 'zhangminghui@qq.com', '博士', 6, '算法工程师', 0);

-- ----------------------------
-- 岗位表
-- ----------------------------
DROP TABLE IF EXISTS position;
CREATE TABLE position (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    title VARCHAR(128) NOT NULL COMMENT '岗位名称',
    enterprise_id BIGINT DEFAULT NULL COMMENT '企业ID',
    enterprise_name VARCHAR(128) DEFAULT NULL COMMENT '企业名称',
    salary_min INT DEFAULT NULL COMMENT '最低薪资(K)',
    salary_max INT DEFAULT NULL COMMENT '最高薪资(K)',
    city VARCHAR(64) DEFAULT NULL COMMENT '城市',
    education VARCHAR(32) DEFAULT NULL COMMENT '学历要求',
    experience VARCHAR(32) DEFAULT NULL COMMENT '经验要求',
    description TEXT DEFAULT NULL COMMENT '岗位描述',
    status TINYINT DEFAULT 1 COMMENT '状态: 0-关闭, 1-招聘中, 2-暂停',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='岗位表';

INSERT INTO position (title, enterprise_id, enterprise_name, salary_min, salary_max, city, education, experience, description, status) VALUES
('Java高级工程师', 1, '职擎科技有限公司', 20, 35, '北京', '本科', '3-5年', '负责公司核心业务系统的设计与开发，参与系统架构优化和技术方案评审。', 1),
('数据分析师', 2, '星河数据科技', 15, 25, '上海', '硕士', '1-3年', '负责业务数据分析与挖掘，产出数据报告，支撑业务决策。', 1),
('AI算法工程师', 3, '云帆智能科技', 30, 50, '深圳', '博士', '3-5年', '负责NLP/CV算法研究与落地，推动AI产品迭代优化。', 2),
('产品经理', 1, '职擎科技有限公司', 18, 30, '北京', '本科', '3-5年', '负责招聘平台产品规划与设计，推动产品功能迭代与用户体验优化。', 1),
('前端开发工程师', 4, '博雅教育集团', 12, 20, '广州', '本科', '1-3年', '负责教育平台前端开发，使用Vue.js技术栈。', 0);

-- ----------------------------
-- 简历表
-- ----------------------------
DROP TABLE IF EXISTS resume;
CREATE TABLE resume (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    seeker_id BIGINT DEFAULT NULL COMMENT '求职者ID',
    seeker_name VARCHAR(64) DEFAULT NULL COMMENT '求职者姓名',
    position_id BIGINT DEFAULT NULL COMMENT '岗位ID',
    position_title VARCHAR(128) DEFAULT NULL COMMENT '岗位名称',
    enterprise_name VARCHAR(128) DEFAULT NULL COMMENT '企业名称',
    status TINYINT DEFAULT 0 COMMENT '状态: 0-未处理, 1-已查看, 2-面试邀请, 3-已录用, 4-已拒绝',
    remark VARCHAR(255) DEFAULT NULL COMMENT '备注',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='简历表';

INSERT INTO resume (seeker_id, seeker_name, position_id, position_title, enterprise_name, status, remark) VALUES
(1, '刘思远', 1, 'Java高级工程师', '职擎科技有限公司', 2, '技术面试表现优秀，安排二面。'),
(2, '陈雨晴', 2, '数据分析师', '星河数据科技', 1, '简历已查看，待安排面试。'),
(3, '王浩然', 4, '产品经理', '职擎科技有限公司', 3, '已发offer。'),
(4, '李晓婷', 5, '前端开发工程师', '博雅教育集团', 4, '经验不足，暂不匹配。'),
(5, '张明辉', 3, 'AI算法工程师', '云帆智能科技', 0, NULL);

-- ----------------------------
-- 违规表
-- ----------------------------
DROP TABLE IF EXISTS violation;
CREATE TABLE violation (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    target_type TINYINT NOT NULL COMMENT '对象类型: 0-企业, 1-求职者',
    target_id BIGINT NOT NULL COMMENT '对象ID',
    target_name VARCHAR(64) NOT NULL COMMENT '对象名称',
    type TINYINT NOT NULL COMMENT '违规类型: 0-虚假信息, 1-违规操作, 2-投诉举报',
    description VARCHAR(512) DEFAULT NULL COMMENT '违规描述',
    handle_status TINYINT DEFAULT 0 COMMENT '处理状态: 0-未处理, 1-处理中, 2-已处理',
    handle_result VARCHAR(255) DEFAULT NULL COMMENT '处理结果',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='违规表';

INSERT INTO violation (target_type, target_id, target_name, type, description, handle_status, handle_result) VALUES
(0, 5, '锦程金融服务', 0, '营业执照信息与实际不符，涉嫌虚假注册。', 2, '已核实，封禁企业账号。'),
(1, 5, '张明辉', 1, '多次投递虚假简历，扰乱招聘秩序。', 1, NULL),
(0, 3, '云帆智能科技', 2, '被多名求职者投诉面试流程不规范。', 0, NULL),
(1, 4, '李晓婷', 0, '学历信息造假，实际为专科学历。', 2, '已禁用账号并通知求职者。'),
(0, 2, '星河数据科技', 1, '发布虚假高薪岗位吸引求职者。', 1, NULL);
