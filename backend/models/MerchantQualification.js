const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const MerchantQualification = sequelize.define('MerchantQualification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '资质ID'
  },
  merchantId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '商家ID',
    references: {
      model: 'merchants',
      key: 'id'
    }
  },
  category: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: '资质分类: business_license-营业执照, operation_permit-经营资质, authorization-授权证明, legal_person-法人信息, flight_permit-航司资质, hotel_permit-酒店资质, car_permit-租车资质, ticket_permit-文旅资质'
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '资质名称'
  },
  fileUrl: {
    type: DataTypes.STRING(500),
    comment: '文件URL'
  },
  licenseNo: {
    type: DataTypes.STRING(100),
    comment: '证照编号'
  },
  legalPerson: {
    type: DataTypes.STRING(50),
    comment: '法人姓名'
  },
  legalPersonIdCard: {
    type: DataTypes.STRING(50),
    comment: '法人身份证号'
  },
  scope: {
    type: DataTypes.STRING(500),
    comment: '经营范围/授权范围'
  },
  effectiveDate: {
    type: DataTypes.DATE,
    comment: '生效日期'
  },
  expiryDate: {
    type: DataTypes.DATE,
    comment: '到期日期'
  },
  auditResult: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '审核结果: 0-待审核, 1-通过, 2-不通过'
  },
  auditRemark: {
    type: DataTypes.STRING(500),
    comment: '审核备注/不合格原因'
  },
  isExpired: {
    type: DataTypes.VIRTUAL,
    get() {
      if (!this.expiryDate) return false;
      return new Date(this.expiryDate) < new Date();
    }
  },
  isEffectiveValid: {
    type: DataTypes.VIRTUAL,
    get() {
      const now = new Date();
      if (this.effectiveDate && new Date(this.effectiveDate) > now) return false;
      if (this.expiryDate && new Date(this.expiryDate) < now) return false;
      return true;
    }
  }
}, {
  tableName: 'merchant_qualifications',
  comment: '商家资质材料表',
  timestamps: true,
  paranoid: true,
  indexes: [
    { fields: ['merchantId'] },
    { fields: ['category'] }
  ]
});

module.exports = MerchantQualification;
