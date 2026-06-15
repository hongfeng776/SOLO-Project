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
    unified_code VARCHAR(18) DEFAULT NULL COMMENT '统一社会信用代码',
    contact_name VARCHAR(64) DEFAULT NULL COMMENT '联系人姓名',
    contact_phone VARCHAR(20) DEFAULT NULL COMMENT '联系电话',
    email VARCHAR(128) DEFAULT NULL COMMENT '邮箱',
    address VARCHAR(255) DEFAULT NULL COMMENT '地址',
    industry VARCHAR(64) DEFAULT NULL COMMENT '行业',
    scale VARCHAR(32) DEFAULT NULL COMMENT '企业规模',
    license_no VARCHAR(64) DEFAULT NULL COMMENT '营业执照号',
    license_type VARCHAR(32) DEFAULT NULL COMMENT '执照类型',
    legal_person VARCHAR(64) DEFAULT NULL COMMENT '法定代表人',
    registered_capital VARCHAR(32) DEFAULT NULL COMMENT '注册资本',
    established_date DATE DEFAULT NULL COMMENT '成立日期',
    business_scope VARCHAR(500) DEFAULT NULL COMMENT '经营范围',
    qualification_name VARCHAR(128) DEFAULT NULL COMMENT '资质名称',
    qualification_no VARCHAR(64) DEFAULT NULL COMMENT '资质编号',
    qualification_expiry DATE DEFAULT NULL COMMENT '资质到期日',
    status TINYINT DEFAULT 1 COMMENT '状态: 0-禁用, 1-正常, 2-审核中',
    entry_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '入驻时间',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='企业表';

INSERT INTO enterprise (name, unified_code, contact_name, contact_phone, email, address, industry, scale, license_no, license_type, legal_person, registered_capital, established_date, business_scope, qualification_name, qualification_no, qualification_expiry, status, entry_time) VALUES
('职擎科技有限公司', '91110108MA01ABCDEF', '张伟', '13800138001', 'zhangwei@zhiqin.com', '北京市海淀区中关村大街1号', '互联网', '500-1000人', '91110108MA01ABCDEF', '多证合一营业执照', '职擎', '5000', '2018-06-15', '技术开发、技术咨询、技术服务、技术转让；计算机系统服务；基础软件服务；应用软件服务；软件开发；软件咨询；产品设计；模型设计；包装装潢设计；教育咨询；经济贸易咨询；文化咨询；体育咨询；公共关系服务；会议服务；工艺美术设计；电脑动画设计；企业策划、设计；设计、制作、代理、发布广告；市场调查；企业管理咨询；组织文化艺术交流活动；文艺创作；承办展览展示活动；会议服务。', '高新技术企业证书', 'GR202311001234', '2026-12-31', 1, '2023-03-15 10:30:00'),
('星河数据科技', '91310115MA01BGHJKL', '李娜', '13800138002', 'lina@xinghe.com', '上海市浦东新区陆家嘴环路100号', '金融', '100-500人', '91310115MA01BGHJKL', '多证合一营业执照', '星河', '3000', '2019-02-20', '数据处理、存储服务；计算机技术开发、技术服务；信息技术咨询服务；软件开发；信息系统集成服务；企业管理咨询服务；投资咨询服务；市场调研服务；商品信息咨询服务。', 'CMMI3级认证', 'CMMI3-2023-SH-0567', '2026-09-30', 1, '2023-04-20 14:15:00'),
('云帆智能科技', '91440300MA01CMNPQR', '王磊', '13800138003', 'wanglei@yunfan.com', '深圳市南山区科技园南路8号', '互联网', '50-100人', '91440300MA01CMNPQR', '普通营业执照', '云帆', '1000', '2020-09-08', '智能产品的技术开发与销售；人工智能算法研发与技术服务；机器人开发与销售；计算机软硬件、网络设备的技术开发、销售、租赁及技术服务；国内贸易；经营进出口业务。', 'ISO27001认证', 'ISO27001-2023-SZ-0890', '2026-06-15', 2, '2023-05-10 09:45:00'),
('博雅教育集团', '91440106MA01DSTUVW', '赵敏', '13800138004', 'zhaomin@boya.com', '广州市天河区珠江新城华夏路20号', '教育', '1000-5000人', '91440106MA01DSTUVW', '多证合一营业执照', '博雅', '8000', '2015-11-12', '教育咨询服务；职业技能培训；语言培训；计算机技术培训；美术培训；音乐培训；舞蹈培训；企业管理培训；会议及展览服务；组织文化艺术交流活动；图书出版策划；音像制品制作；电子出版物制作。', '办学许可证', '教民144010070001234', '2028-03-31', 1, '2023-02-28 16:20:00'),
('锦程金融服务', '91330106MA01EWXYZA', '陈浩', '13800138005', 'chenhao@jincheng.com', '杭州市西湖区文三路90号', '金融', '500-1000人', '91330106MA01EWXYZA', '普通营业执照', '锦程', '6000', '2017-04-25', '接受金融机构委托从事金融信息技术外包；接受金融机构委托从事金融业务流程外包；接受金融机构委托从事金融知识流程外包；金融信息咨询；投资管理；资产管理；股权投资；创业投资。', '金融信息服务资质', '金资证2023-HZ-0045', '2025-12-31', 0, '2023-01-15 11:00:00');

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
    expected_salary VARCHAR(32) DEFAULT NULL COMMENT '期望薪资',
    expected_city VARCHAR(64) DEFAULT NULL COMMENT '期望城市',
    status TINYINT DEFAULT 1 COMMENT '状态: 0-禁用, 1-正常',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='求职者表';

INSERT INTO job_seeker (name, gender, age, phone, email, education, work_years, job_intention, expected_salary, expected_city, status) VALUES
('刘思远', 1, 28, '13900139001', 'liusiyuan@qq.com', '本科', 5, 'Java后端开发', '20-30K', '北京', 1),
('陈雨晴', 0, 25, '13900139002', 'chenyuqing@qq.com', '硕士', 2, '数据分析师', '15-25K', '上海', 1),
('王浩然', 1, 32, '13900139003', 'wanghaoran@qq.com', '本科', 8, '技术经理', '30-50K', '北京', 1),
('李晓婷', 0, 23, '13900139004', 'lixiaoting@qq.com', '本科', 0, '前端开发', '10-15K', '广州', 1),
('张明辉', 1, 30, '13900139005', 'zhangminghui@qq.com', '博士', 6, '算法工程师', '40-60K', '深圳', 0),
('赵子轩', 1, 27, '13900139006', 'zhaozixuan@qq.com', '本科', 4, '产品经理', '18-28K', '杭州', 1),
('孙雅琪', 0, 26, '13900139007', 'sunyaqi@qq.com', '硕士', 3, 'UI设计师', '12-20K', '成都', 1),
('周建国', 1, 35, '13900139008', 'zhoujianguo@qq.com', '大专', 10, '运维工程师', '15-25K', '深圳', 1),
('吴梦琪', 0, 24, '13900139009', 'wumengqi@qq.com', '本科', 1, '测试工程师', '8-12K', '武汉', 1),
('郑宇航', 1, 29, '13900139010', 'zhengyuhang@qq.com', '硕士', 5, '全栈开发', '25-35K', '北京', 1);

-- ----------------------------
-- 岗位表
-- ----------------------------
DROP TABLE IF EXISTS position;
CREATE TABLE position (
    id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    title VARCHAR(128) NOT NULL COMMENT '岗位名称',
    enterprise_id BIGINT DEFAULT NULL COMMENT '企业ID',
    enterprise_name VARCHAR(128) DEFAULT NULL COMMENT '企业名称',
    category VARCHAR(64) DEFAULT NULL COMMENT '岗位分类',
    salary_min INT DEFAULT NULL COMMENT '最低薪资(K)',
    salary_max INT DEFAULT NULL COMMENT '最高薪资(K)',
    city VARCHAR(64) DEFAULT NULL COMMENT '工作地点',
    education VARCHAR(32) DEFAULT NULL COMMENT '学历要求',
    experience VARCHAR(32) DEFAULT NULL COMMENT '经验要求',
    responsibility TEXT DEFAULT NULL COMMENT '岗位职责',
    requirement TEXT DEFAULT NULL COMMENT '任职要求',
    status TINYINT DEFAULT 1 COMMENT '状态: 0-关闭, 1-招聘中, 2-暂停',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间/发布时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='岗位表';

INSERT INTO position (title, enterprise_id, enterprise_name, category, salary_min, salary_max, city, education, experience, responsibility, requirement, status) VALUES
('Java高级工程师', 1, '职擎科技有限公司', '技术开发', 20, 35, '北京', '本科', '3-5年', '1. 负责公司核心业务系统的设计与开发；\n2. 参与系统架构优化和技术方案评审；\n3. 解决项目中遇到的关键技术问题。', '1. 本科及以上学历，计算机相关专业；\n2. 3年以上Java开发经验；\n3. 熟练掌握Spring Boot、MyBatis等主流框架；\n4. 熟悉MySQL、Redis等数据库。', 1),
('数据分析师', 2, '星河数据科技', '数据分析', 15, 25, '上海', '硕士', '1-3年', '1. 负责业务数据分析与挖掘，产出数据报告；\n2. 构建数据指标体系，监控业务运行状况；\n3. 参与数据平台建设，推动数据产品化。', '1. 硕士及以上学历，统计学、数学相关专业；\n2. 熟练掌握SQL、Python数据分析工具；\n3. 具备良好的数据敏感度和业务理解能力。', 1),
('AI算法工程师', 3, '云帆智能科技', '技术开发', 30, 50, '深圳', '博士', '3-5年', '1. 负责NLP/CV算法研究与落地；\n2. 推动AI产品迭代优化；\n3. 发表前沿技术论文，沉淀技术专利。', '1. 博士学历，计算机、人工智能相关专业；\n2. 在顶会发表过相关论文者优先；\n3. 熟练掌握PyTorch/TensorFlow框架。', 2),
('产品经理', 1, '职擎科技有限公司', '产品运营', 18, 30, '北京', '本科', '3-5年', '1. 负责招聘平台产品规划与设计；\n2. 推动产品功能迭代与用户体验优化；\n3. 协调研发、运营、设计团队高效协作。', '1. 本科及以上学历；\n2. 3年以上互联网产品经验，熟悉招聘行业优先；\n3. 具备优秀的逻辑思维和沟通协调能力。', 1),
('前端开发工程师', 4, '博雅教育集团', '技术开发', 12, 20, '广州', '本科', '1-3年', '1. 负责教育平台前端开发；\n2. 参与前端技术架构设计；\n3. 与后端、产品团队紧密协作。', '1. 本科及以上学历，计算机相关专业；\n2. 熟悉Vue.js、React等前端框架；\n3. 有良好的代码规范和工程化意识。', 0),
('销售经理', 5, '锦程金融服务', '市场营销', 15, 30, '杭州', '本科', '3-5年', '1. 负责金融产品的市场推广与销售；\n2. 开拓并维护客户关系；\n3. 完成团队销售目标。', '1. 本科及以上学历，金融、市场营销相关专业优先；\n2. 3年以上金融行业销售经验；\n3. 具备优秀的客户资源和谈判能力。', 2),
('算法实习生', 3, '云帆智能科技', '技术开发', 5, 8, '深圳', '硕士', '不限', '1. 参与AI算法模型训练与优化；\n2. 协助完成数据清洗与标注工作；\n3. 参与技术文档撰写。', '1. 硕士在读，计算机、人工智能相关专业；\n2. 熟悉Python编程，了解常用深度学习框架；\n3. 每周可实习4天以上，持续3个月以上。', 1),
('UI设计师', 4, '博雅教育集团', '设计创意', 10, 18, '广州', '本科', '1-3年', '1. 负责教育平台UI设计与交互优化；\n2. 参与设计规范制定与维护；\n3. 与产品、前端团队紧密协作。', '1. 本科及以上学历，设计相关专业；\n2. 熟练使用Figma、Sketch等设计工具；\n3. 有完整的移动端/PC端项目设计经验。', 1),
('测试工程师', 1, '职擎科技有限公司', '技术开发', 10, 18, '北京', '本科', '1-3年', '1. 负责招聘平台功能测试与自动化测试；\n2. 编写测试用例，执行测试并跟踪缺陷；\n3. 参与测试流程优化与质量体系建设。', '1. 本科及以上学历，计算机相关专业；\n2. 熟悉软件测试流程，掌握主流测试工具；\n3. 有自动化测试经验优先。', 1),
('运营专员', 2, '星河数据科技', '产品运营', 8, 15, '上海', '本科', '1-3年', '1. 负责平台日常运营与活动策划；\n2. 分析运营数据，优化运营策略；\n3. 维护用户社群，提升用户活跃度。', '1. 本科及以上学历；\n2. 1年以上互联网运营经验；\n3. 具备良好的文案能力和数据分析能力。', 1);

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
