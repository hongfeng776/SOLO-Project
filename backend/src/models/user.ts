import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize'
import sequelize from '@config/database'

class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: CreationOptional<number>
  declare username: string
  declare password: string
  declare nickname: string
  declare avatar: CreationOptional<string>
  declare email: string
  declare phone: string
  declare status: CreationOptional<number>
  declare realNameVerified: CreationOptional<number>
  declare realName: CreationOptional<string>
  declare idCard: CreationOptional<string>
  declare banExpireTime: CreationOptional<Date | null>
  declare flowLimitExpireTime: CreationOptional<Date | null>
  declare reviewLevel: CreationOptional<number>
  declare reviewCount: CreationOptional<number>
  declare opsCount: CreationOptional<number>
  declare isSeniorReviewer: CreationOptional<number>
  declare registerSource: CreationOptional<string>
  declare lastActiveTime: CreationOptional<Date | null>
  declare phoneVerified: CreationOptional<number>
  declare isAbnormal: CreationOptional<number>
  declare abnormalType: CreationOptional<string>
  declare abnormalReason: CreationOptional<string>
  declare infoCompleteness: CreationOptional<number>
  declare lastLoginTime: CreationOptional<Date | null>
  declare loginCount: CreationOptional<number>
  declare userLevel: CreationOptional<number>
  declare levelScore: CreationOptional<number>
  declare levelScoreDetail: CreationOptional<string>
  declare isPermanentBanned: CreationOptional<number>
  declare privileges: CreationOptional<string>
  declare levelLastUpdateTime: CreationOptional<Date | null>
  declare riskLevel: CreationOptional<number>
  declare riskScore: CreationOptional<number>
  declare punishmentStatus: CreationOptional<number>
  declare punishmentExpireTime: CreationOptional<Date | null>
  declare lastViolationTime: CreationOptional<Date | null>
  declare violationCount: CreationOptional<number>
  declare riskControlRemark: CreationOptional<string>
  declare createTime: CreationOptional<Date>
  declare updateTime: CreationOptional<Date>
  declare deleteTime: CreationOptional<Date | null>
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    nickname: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    avatar: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: ''
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: ''
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: ''
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1
    },
    realNameVerified: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '0未认证 1审核中 2已认证 3已拒绝'
    },
    realName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: ''
    },
    idCard: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: ''
    },
    banExpireTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    flowLimitExpireTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    reviewLevel: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '审核权限等级 0无 1普通 2高级'
    },
    reviewCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '累计审核数'
    },
    opsCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '累计运维操作数'
    },
    isSeniorReviewer: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '是否高级审核员 0否 1是'
    },
    registerSource: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: 'manual',
      comment: '注册来源'
    },
    lastActiveTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '最后活跃时间'
    },
    phoneVerified: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '手机号是否已绑定 0否 1是'
    },
    isAbnormal: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '是否异常用户 0否 1是'
    },
    abnormalType: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: '',
      comment: '异常类型'
    },
    abnormalReason: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '异常原因'
    },
    infoCompleteness: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '信息完整度 0-100'
    },
    lastLoginTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '最后登录时间'
    },
    loginCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '登录次数'
    },
    userLevel: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '用户等级 -1受限 0普通 1活跃 2优质'
    },
    levelScore: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '等级分值 0-100'
    },
    levelScoreDetail: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '等级分值明细JSON'
    },
    isPermanentBanned: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '是否永久封禁 0否 1是'
    },
    privileges: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '用户权益配置JSON'
    },
    levelLastUpdateTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '等级最后更新时间'
    },
    riskLevel: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '风险等级 0正常 1轻微 2中度 3重度'
    },
    riskScore: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '风险分值 0-100'
    },
    punishmentStatus: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '处罚状态 0生效 1解除 2过期 3申诉'
    },
    punishmentExpireTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '处罚到期时间'
    },
    lastViolationTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '最近违规时间'
    },
    violationCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '累计违规次数'
    },
    riskControlRemark: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '风控备注'
    },
    createTime: DataTypes.DATE,
    updateTime: DataTypes.DATE,
    deleteTime: DataTypes.DATE
  },
  {
    sequelize,
    tableName: 'sys_user',
    modelName: 'User'
  }
)

export default User
