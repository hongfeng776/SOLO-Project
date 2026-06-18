<template>
  <el-drawer
    :model-value="modelValue"
    title="商家信息编辑"
    direction="rtl"
    size="900px"
    :before-close="handleClose"
    @update:modelValue="val => emit('update:modelValue', val)"
    class="info-edit-drawer"
  >
    <div v-loading="loading" class="edit-panel-content">
      <div class="pre-check-alert" v-if="preCheckData">
        <el-alert
          :title="preCheckAlert.title"
          :type="preCheckAlert.type"
          :description="preCheckAlert.description"
          show-icon
          :closable="false"
        >
          <template v-if="preCheckAlert.extra" #default>
            <div class="pre-check-extra">
              <div v-if="!preCheckData.statusEditable" class="alert-item danger">
                <el-icon><WarningFilled /></el-icon>
                <span>商家已永久锁定，不允许修改任何信息</span>
              </div>
              <div v-if="preCheckData.isLocked" class="alert-item warning">
                <el-icon><InfoFilled /></el-icon>
                <span>商家处于临时锁定状态，请先解锁后再修改信息</span>
              </div>
              <div v-if="preCheckData.isHighRisk" class="alert-item warning">
                <el-icon><WarningFilled /></el-icon>
                <span>高危商家，核心字段仅管理员可修改</span>
              </div>
              <div v-for="(perm, key) in permissionWarnings" :key="key" class="alert-item info">
                <el-icon><Lock /></el-icon>
                <span>{{ perm }}</span>
              </div>
            </div>
          </template>
        </el-alert>
      </div>

      <div class="edit-branch-tabs">
        <div
          v-for="branch in InfoEditBranchEnum"
          :key="branch.key"
          class="branch-tab"
          :class="{ active: activeBranch === branch.key, disabled: !canEditBranch(branch.key) }"
          @click="switchBranch(branch.key)"
        >
          <el-icon :style="{ color: branch.color }"><component :is="branch.icon" /></el-icon>
          <span>{{ branch.label }}</span>
        </div>
      </div>

      <div class="edit-form-container">
        <div v-show="activeBranch === 'basic'" class="branch-form">
          <h4 class="branch-title">基础工商信息</h4>
          <el-form :model="basicForm" :rules="basicRules" ref="basicFormRef" label-width="130px">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="商家名称" prop="name">
                  <el-input
                    v-model="basicForm.name"
                    class="focus-glow-input core-field"
                    :class="{ 'shake-animation': fieldErrors.name }"
                    @blur="validateUnique('name', basicForm.name)"
                    :disabled="!canEditField('BASIC', 'name')"
                  />
                  <div v-if="fieldErrors.name" class="error-text">{{ fieldErrors.name }}</div>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="商家简称" prop="shortName">
                  <el-input
                    v-model="basicForm.shortName"
                    class="focus-glow-input"
                    :class="{ 'shake-animation': fieldErrors.shortName }"
                    :disabled="!canEditField('BASIC', 'shortName')"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="英文名称" prop="englishName">
                  <el-input
                    v-model="basicForm.englishName"
                    class="focus-glow-input"
                    :disabled="!canEditField('BASIC', 'englishName')"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="品牌名称" prop="brandName">
                  <el-input
                    v-model="basicForm.brandName"
                    class="focus-glow-input"
                    :disabled="!canEditField('BASIC', 'brandName')"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="统一社会信用代码" prop="unifiedCreditCode">
                  <el-input
                    v-model="basicForm.unifiedCreditCode"
                    class="focus-glow-input core-field"
                    :class="{ 'shake-animation': fieldErrors.unifiedCreditCode }"
                    @blur="validateUnique('unifiedCreditCode', basicForm.unifiedCreditCode)"
                    :disabled="!canEditField('BASIC', 'unifiedCreditCode')"
                  />
                  <div v-if="fieldErrors.unifiedCreditCode" class="error-text">{{ fieldErrors.unifiedCreditCode }}</div>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="法人姓名" prop="legalPersonName">
                  <el-input
                    v-model="basicForm.legalPersonName"
                    class="focus-glow-input core-field"
                    :disabled="!canEditField('BASIC', 'legalPersonName')"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="法人身份证号" prop="legalPersonIdCard">
                  <el-input
                    v-model="basicForm.legalPersonIdCard"
                    class="focus-glow-input core-field"
                    :class="{ 'shake-animation': fieldErrors.legalPersonIdCard }"
                    @blur="validateIdCard(basicForm.legalPersonIdCard)"
                    :disabled="!canEditField('BASIC', 'legalPersonIdCard')"
                  />
                  <div v-if="fieldErrors.legalPersonIdCard" class="error-text">{{ fieldErrors.legalPersonIdCard }}</div>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="注册资本" prop="registeredCapital">
                  <el-input-number
                    v-model="basicForm.registeredCapital"
                    :min="0"
                    :precision="2"
                    class="focus-glow-input"
                    style="width: 100%"
                    :disabled="!canEditField('BASIC', 'registeredCapital')"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="成立日期" prop="establishDate">
                  <el-date-picker
                    v-model="basicForm.establishDate"
                    type="date"
                    style="width: 100%"
                    class="focus-glow-input"
                    :disabled="!canEditField('BASIC', 'establishDate')"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="营业期限开始" prop="businessTermStart">
                  <el-date-picker
                    v-model="basicForm.businessTermStart"
                    type="date"
                    style="width: 100%"
                    class="focus-glow-input"
                    :disabled="!canEditField('BASIC', 'businessTermStart')"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="营业期限结束" prop="businessTermEnd">
                  <el-date-picker
                    v-model="basicForm.businessTermEnd"
                    type="date"
                    style="width: 100%"
                    class="focus-glow-input"
                    :class="{ 'shake-animation': fieldErrors.businessTermEnd }"
                    @blur="validateExpiryDate(basicForm.businessTermEnd)"
                    :disabled="!canEditField('BASIC', 'businessTermEnd')"
                  />
                  <div v-if="fieldErrors.businessTermEnd" class="error-text">{{ fieldErrors.businessTermEnd }}</div>
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="经营范围" prop="scope">
                  <el-input
                    v-model="basicForm.scope"
                    type="textarea"
                    :rows="2"
                    class="focus-glow-input"
                    :disabled="!canEditField('BASIC', 'scope')"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </div>

        <div v-show="activeBranch === 'business'" class="branch-form">
          <h4 class="branch-title">经营品类信息</h4>
          <el-form :model="businessForm" :rules="businessRules" ref="businessFormRef" label-width="130px">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="主营品类" prop="businessType">
                  <el-select
                    v-model="businessForm.businessType"
                    style="width: 100%"
                    class="focus-glow-input core-field"
                    :disabled="!canEditField('BUSINESS', 'businessType')"
                  >
                    <el-option
                      v-for="item in getEnumOptions(MerchantBusinessTypeEnum)"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="兼营品类" prop="secondaryBusinessTypes">
                  <el-select
                    v-model="businessForm.secondaryBusinessTypes"
                    multiple
                    style="width: 100%"
                    class="focus-glow-input"
                    :disabled="!canEditField('BUSINESS', 'secondaryBusinessTypes')"
                  >
                    <el-option
                      v-for="item in getEnumOptions(MerchantBusinessTypeEnum)"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="商家星级" prop="merchantLevel">
                  <el-rate
                    v-model="businessForm.merchantLevel"
                    :max="5"
                    class="focus-glow-input"
                    :disabled="!canEditField('BUSINESS', 'merchantLevel')"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="商家标签" prop="merchantTags">
                  <el-select
                    v-model="businessForm.merchantTags"
                    multiple
                    style="width: 100%"
                    class="focus-glow-input"
                    :disabled="!canEditField('BUSINESS', 'merchantTags')"
                  >
                    <el-option
                      v-for="tag in MerchantTagOptions"
                      :key="tag.value"
                      :label="tag.label"
                      :value="tag.value"
                      :style="{ color: tag.color }"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="运营模式" prop="operationMode">
                  <el-select
                    v-model="businessForm.operationMode"
                    style="width: 100%"
                    class="focus-glow-input"
                    :disabled="!canEditField('BUSINESS', 'operationMode')"
                  >
                    <el-option
                      v-for="item in getEnumOptions(OperationModeEnum)"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="营业开始时间" prop="businessStartTime">
                  <el-time-picker
                    v-model="businessForm.businessStartTime"
                    format="HH:mm"
                    style="width: 100%"
                    class="focus-glow-input"
                    :disabled="!canEditField('BUSINESS', 'businessStartTime')"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="营业结束时间" prop="businessEndTime">
                  <el-time-picker
                    v-model="businessForm.businessEndTime"
                    format="HH:mm"
                    style="width: 100%"
                    class="focus-glow-input"
                    :disabled="!canEditField('BUSINESS', 'businessEndTime')"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="营业日" prop="businessDays">
                  <el-checkbox-group
                    v-model="businessForm.businessDays"
                    class="focus-glow-input"
                    :disabled="!canEditField('BUSINESS', 'businessDays')"
                  >
                    <el-checkbox :label="1">周一</el-checkbox>
                    <el-checkbox :label="2">周二</el-checkbox>
                    <el-checkbox :label="3">周三</el-checkbox>
                    <el-checkbox :label="4">周四</el-checkbox>
                    <el-checkbox :label="5">周五</el-checkbox>
                    <el-checkbox :label="6">周六</el-checkbox>
                    <el-checkbox :label="7">周日</el-checkbox>
                  </el-checkbox-group>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="合作开始日期" prop="cooperationStartDate">
                  <el-date-picker
                    v-model="businessForm.cooperationStartDate"
                    type="date"
                    style="width: 100%"
                    class="focus-glow-input"
                    :disabled="!canEditField('BUSINESS', 'cooperationStartDate')"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="合作到期日期" prop="cooperationEndDate">
                  <el-date-picker
                    v-model="businessForm.cooperationEndDate"
                    type="date"
                    style="width: 100%"
                    class="focus-glow-input"
                    :class="{ 'shake-animation': fieldErrors.cooperationEndDate }"
                    @blur="validateExpiryDate(businessForm.cooperationEndDate)"
                    :disabled="!canEditField('BUSINESS', 'cooperationEndDate')"
                  />
                  <div v-if="fieldErrors.cooperationEndDate" class="error-text">{{ fieldErrors.cooperationEndDate }}</div>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="合同编号" prop="contractNo">
                  <el-input
                    v-model="businessForm.contractNo"
                    class="focus-glow-input"
                    :disabled="!canEditField('BUSINESS', 'contractNo')"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="商家简介" prop="publicIntroduction">
                  <el-input
                    v-model="businessForm.publicIntroduction"
                    type="textarea"
                    :rows="3"
                    class="focus-glow-input"
                    :disabled="!canEditField('BUSINESS', 'publicIntroduction')"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="公示公告" prop="publicNotice">
                  <el-input
                    v-model="businessForm.publicNotice"
                    type="textarea"
                    :rows="2"
                    class="focus-glow-input"
                    :disabled="!canEditField('BUSINESS', 'publicNotice')"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </div>

        <div v-show="activeBranch === 'contact'" class="branch-form">
          <h4 class="branch-title">联系方式</h4>
          <el-form :model="contactForm" :rules="contactRules" ref="contactFormRef" label-width="130px">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="联系人" prop="contact">
                  <el-input
                    v-model="contactForm.contact"
                    class="focus-glow-input"
                    :disabled="!canEditField('CONTACT', 'contact')"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="联系人职位" prop="contactPosition">
                  <el-input
                    v-model="contactForm.contactPosition"
                    class="focus-glow-input"
                    :disabled="!canEditField('CONTACT', 'contactPosition')"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="联系电话" prop="phone">
                  <el-input
                    v-model="contactForm.phone"
                    class="focus-glow-input core-field"
                    :class="{ 'shake-animation': fieldErrors.phone }"
                    @blur="validatePhone(contactForm.phone, 'phone')"
                    :disabled="!canEditField('CONTACT', 'phone')"
                  />
                  <div v-if="fieldErrors.phone" class="error-text">{{ fieldErrors.phone }}</div>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="备用电话" prop="backupPhone">
                  <el-input
                    v-model="contactForm.backupPhone"
                    class="focus-glow-input"
                    :class="{ 'shake-animation': fieldErrors.backupPhone }"
                    @blur="validatePhone(contactForm.backupPhone, 'backupPhone')"
                    :disabled="!canEditField('CONTACT', 'backupPhone')"
                  />
                  <div v-if="fieldErrors.backupPhone" class="error-text">{{ fieldErrors.backupPhone }}</div>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="客服热线" prop="serviceHotline">
                  <el-input
                    v-model="contactForm.serviceHotline"
                    class="focus-glow-input"
                    :class="{ 'shake-animation': fieldErrors.serviceHotline }"
                    @blur="validatePhone(contactForm.serviceHotline, 'serviceHotline')"
                    :disabled="!canEditField('CONTACT', 'serviceHotline')"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="投诉热线" prop="complaintHotline">
                  <el-input
                    v-model="contactForm.complaintHotline"
                    class="focus-glow-input"
                    :class="{ 'shake-animation': fieldErrors.complaintHotline }"
                    @blur="validatePhone(contactForm.complaintHotline, 'complaintHotline')"
                    :disabled="!canEditField('CONTACT', 'complaintHotline')"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="邮箱" prop="email">
                  <el-input
                    v-model="contactForm.email"
                    class="focus-glow-input"
                    :class="{ 'shake-animation': fieldErrors.email }"
                    @blur="validateEmail(contactForm.email)"
                    :disabled="!canEditField('CONTACT', 'email')"
                  />
                  <div v-if="fieldErrors.email" class="error-text">{{ fieldErrors.email }}</div>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="官方网站" prop="officialWebsite">
                  <el-input
                    v-model="contactForm.officialWebsite"
                    class="focus-glow-input"
                    :disabled="!canEditField('CONTACT', 'officialWebsite')"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="微信" prop="contactWechat">
                  <el-input
                    v-model="contactForm.contactWechat"
                    class="focus-glow-input"
                    :disabled="!canEditField('CONTACT', 'contactWechat')"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="QQ" prop="contactQq">
                  <el-input
                    v-model="contactForm.contactQq"
                    class="focus-glow-input"
                    :disabled="!canEditField('CONTACT', 'contactQq')"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="省份" prop="province">
                  <el-input
                    v-model="contactForm.province"
                    class="focus-glow-input"
                    :disabled="!canEditField('CONTACT', 'province')"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="城市" prop="city">
                  <el-input
                    v-model="contactForm.city"
                    class="focus-glow-input"
                    :disabled="!canEditField('CONTACT', 'city')"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="区县" prop="district">
                  <el-input
                    v-model="contactForm.district"
                    class="focus-glow-input"
                    :disabled="!canEditField('CONTACT', 'district')"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="详细地址" prop="addressDetail">
                  <el-input
                    v-model="contactForm.addressDetail"
                    type="textarea"
                    :rows="2"
                    class="focus-glow-input"
                    :disabled="!canEditField('CONTACT', 'addressDetail')"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="经度" prop="longitude">
                  <el-input-number
                    v-model="contactForm.longitude"
                    :precision="7"
                    class="focus-glow-input"
                    style="width: 100%"
                    :disabled="!canEditField('CONTACT', 'longitude')"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="纬度" prop="latitude">
                  <el-input-number
                    v-model="contactForm.latitude"
                    :precision="7"
                    class="focus-glow-input"
                    style="width: 100%"
                    :disabled="!canEditField('CONTACT', 'latitude')"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </div>

        <div v-show="activeBranch === 'settlement'" class="branch-form">
          <h4 class="branch-title">结算信息</h4>
          <el-alert
            title="核心结算字段修改后将触发结算规则重新适配"
            type="warning"
            show-icon
            :closable="false"
            style="margin-bottom: 20px"
          />
          <el-form :model="settlementForm" :rules="settlementRules" ref="settlementFormRef" label-width="130px">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="结算账户名称" prop="settleAccountName">
                  <el-input
                    v-model="settlementForm.settleAccountName"
                    class="focus-glow-input core-field"
                    :disabled="!canEditField('SETTLEMENT', 'settleAccountName')"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="开户银行" prop="settleBankName">
                  <el-input
                    v-model="settlementForm.settleBankName"
                    class="focus-glow-input core-field"
                    :disabled="!canEditField('SETTLEMENT', 'settleBankName')"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="银行账号" prop="settleBankAccount">
                  <el-input
                    v-model="settlementForm.settleBankAccount"
                    class="focus-glow-input core-field"
                    :class="{ 'shake-animation': fieldErrors.settleBankAccount }"
                    @blur="validateBankAccount(settlementForm.settleBankAccount)"
                    :disabled="!canEditField('SETTLEMENT', 'settleBankAccount')"
                  />
                  <div v-if="fieldErrors.settleBankAccount" class="error-text">{{ fieldErrors.settleBankAccount }}</div>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="开户支行" prop="settleBankBranch">
                  <el-input
                    v-model="settlementForm.settleBankBranch"
                    class="focus-glow-input"
                    :disabled="!canEditField('SETTLEMENT', 'settleBankBranch')"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="银行联行号" prop="settleBankCode">
                  <el-input
                    v-model="settlementForm.settleBankCode"
                    class="focus-glow-input"
                    :class="{ 'shake-animation': fieldErrors.settleBankCode }"
                    @blur="validateBankAccount(settlementForm.settleBankCode, 'settleBankCode')"
                    :disabled="!canEditField('SETTLEMENT', 'settleBankCode')"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="支付宝账号" prop="settleAlipayAccount">
                  <el-input
                    v-model="settlementForm.settleAlipayAccount"
                    class="focus-glow-input"
                    :disabled="!canEditField('SETTLEMENT', 'settleAlipayAccount')"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="微信账号" prop="settleWechatAccount">
                  <el-input
                    v-model="settlementForm.settleWechatAccount"
                    class="focus-glow-input"
                    :disabled="!canEditField('SETTLEMENT', 'settleWechatAccount')"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="结算周期" prop="settleCycle">
                  <el-select
                    v-model="settlementForm.settleCycle"
                    style="width: 100%"
                    class="focus-glow-input"
                    :disabled="!canEditField('SETTLEMENT', 'settleCycle')"
                  >
                    <el-option
                      v-for="item in getEnumOptions(SettleCycleEnum)"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="起付金额(元)" prop="settleThreshold">
                  <el-input-number
                    v-model="settlementForm.settleThreshold"
                    :min="0"
                    :precision="2"
                    class="focus-glow-input"
                    style="width: 100%"
                    :disabled="!canEditField('SETTLEMENT', 'settleThreshold')"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="佣金比例(%)" prop="commissionRate">
                  <el-input-number
                    v-model="commissionRatePercent"
                    :min="0"
                    :max="50"
                    :precision="2"
                    :step="0.1"
                    class="focus-glow-input core-field"
                    :class="{ 'shake-animation': fieldErrors.commissionRate }"
                    @blur="validateCommissionRate"
                    style="width: 100%"
                    :disabled="!canEditField('SETTLEMENT', 'commissionRate')"
                  />
                  <div v-if="fieldErrors.commissionRate" class="error-text">{{ fieldErrors.commissionRate }}</div>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="保证金金额(元)" prop="depositAmount">
                  <el-input-number
                    v-model="settlementForm.depositAmount"
                    :min="0"
                    :precision="2"
                    class="focus-glow-input"
                    style="width: 100%"
                    :disabled="!canEditField('SETTLEMENT', 'depositAmount')"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="保证金状态" prop="depositStatus">
                  <el-select
                    v-model="settlementForm.depositStatus"
                    style="width: 100%"
                    class="focus-glow-input"
                    :disabled="!canEditField('SETTLEMENT', 'depositStatus')"
                  >
                    <el-option
                      v-for="item in getEnumOptions(DepositStatusEnum)"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </div>
      </div>

      <div class="change-reason-section">
        <el-form label-width="130px">
          <el-form-item label="变更原因">
            <el-input
              v-model="changeReason"
              type="textarea"
              :rows="2"
              placeholder="请填写变更原因（必填）"
              class="focus-glow-input"
            />
          </el-form-item>
          <el-form-item label="备注说明">
            <el-input
              v-model="changeRemark"
              type="textarea"
              :rows="2"
              placeholder="可选：填写补充说明"
              class="focus-glow-input"
            />
          </el-form-item>
        </el-form>
      </div>
    </div>

    <template #footer>
      <div class="drawer-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :disabled="submitDisabled || !hasChanges" @click="submitChanges" v-ripple>
          保存修改
        </el-button>
      </div>
    </template>
  </el-drawer>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import {
  preOpsCheck,
  updateBasicInfo,
  updateBusinessInfo,
  updateContactInfo,
  updateSettlementInfo,
  verifyFieldUnique
} from '@/api/merchant'
import {
  MerchantBusinessTypeEnum,
  MerchantLevelEnum,
  MerchantTagOptions,
  OperationModeEnum,
  SettleCycleEnum,
  DepositStatusEnum,
  InfoEditBranchEnum
} from '@/utils/enums'
import { getEnumLabel, getEnumOptions } from '@/utils/enums'
import { ElMessage } from 'element-plus'
import {
  WarningFilled, InfoFilled, Lock, OfficeBuilding, ShoppingCart, Phone, Money
} from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  merchantId: { type: [Number, String], default: null },
  permissions: { type: Object, default: () => ({}) }
})

const emit = defineEmits(['update:modelValue', 'success'])

const loading = ref(false)
const submitDisabled = ref(false)
const activeBranch = ref('basic')
const preCheckData = ref(null)
const originalData = ref(null)
const fieldErrors = reactive({})
const changeReason = ref('')
const changeRemark = ref('')

const basicFormRef = ref(null)
const businessFormRef = ref(null)
const contactFormRef = ref(null)
const settlementFormRef = ref(null)

const basicForm = reactive({
  name: '', shortName: '', englishName: '', brandName: '',
  unifiedCreditCode: '', legalPersonName: '', legalPersonIdCard: '',
  registeredCapital: null, establishDate: null, businessTermStart: null,
  businessTermEnd: null, scope: ''
})

const businessForm = reactive({
  businessType: '', secondaryBusinessTypes: [], merchantLevel: 3,
  merchantTags: [], operationMode: 1, businessStartTime: '',
  businessEndTime: '', businessDays: [1, 2, 3, 4, 5, 6, 7],
  cooperationStartDate: null, cooperationEndDate: null,
  contractNo: '', publicIntroduction: '', publicNotice: ''
})

const contactForm = reactive({
  contact: '', contactPosition: '', phone: '', backupPhone: '',
  serviceHotline: '', complaintHotline: '', email: '', officialWebsite: '',
  contactWechat: '', contactQq: '', province: '', city: '',
  district: '', addressDetail: '', longitude: null, latitude: null
})

const settlementForm = reactive({
  settleAccountName: '', settleBankName: '', settleBankAccount: '',
  settleBankBranch: '', settleBankCode: '', settleAlipayAccount: '',
  settleWechatAccount: '', settleCycle: 1, settleThreshold: 1000,
  commissionRate: 0.03, depositAmount: 0, depositStatus: 0
})

const commissionRatePercent = computed({
  get: () => Math.round((settlementForm.commissionRate || 0) * 10000) / 100,
  set: (val) => { settlementForm.commissionRate = Math.round(val * 100) / 10000 }
})

const basicRules = {
  name: [{ required: true, message: '请输入商家名称', trigger: 'blur' }],
  unifiedCreditCode: [{ required: true, message: '请输入统一社会信用代码', trigger: 'blur' }],
  legalPersonName: [{ required: true, message: '请输入法人姓名', trigger: 'blur' }],
  legalPersonIdCard: [{ required: true, message: '请输入法人身份证号', trigger: 'blur' }]
}

const businessRules = {
  businessType: [{ required: true, message: '请选择主营品类', trigger: 'change' }],
  merchantLevel: [{ required: true, message: '请选择商家星级', trigger: 'change' }]
}

const contactRules = {
  contact: [{ required: true, message: '请输入联系人', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }]
}

const settlementRules = {
  settleAccountName: [{ required: true, message: '请输入结算账户名称', trigger: 'blur' }],
  settleBankName: [{ required: true, message: '请输入开户银行', trigger: 'blur' }],
  settleBankAccount: [{ required: true, message: '请输入银行账号', trigger: 'blur' }]
}

const preCheckAlert = computed(() => {
  if (!preCheckData.value) return { title: '', type: 'info' }
  const { permissions, statusEditable, isLocked, isHighRisk } = preCheckData.value
  const warnings = []
  if (!statusEditable) warnings.push('商家已永久锁定')
  if (isLocked) warnings.push('商家处于临时锁定状态')
  if (isHighRisk) warnings.push('高危商家')
  if (warnings.length > 0) {
    return {
      title: '操作提示',
      type: isHighRisk || !statusEditable ? 'error' : 'warning',
      description: `检测到${warnings.length}项限制，请确认后操作`,
      extra: true
    }
  }
  return null
})

const permissionWarnings = computed(() => {
  if (!preCheckData.value) return {}
  const perms = preCheckData.value.permissions
  const warnings = {}
  if (!perms.canEditBasic) warnings.basic = '您没有基础工商信息编辑权限'
  if (!perms.canEditBusiness) warnings.business = '您没有经营品类信息编辑权限'
  if (!perms.canEditContact) warnings.contact = '您没有联系方式编辑权限'
  if (!perms.canEditSettlement) warnings.settlement = '您没有结算信息编辑权限'
  return warnings
})

const hasChanges = computed(() => {
  if (!originalData.value) return false
  const formData = { ...basicForm, ...businessForm, ...contactForm, ...settlementForm }
  for (const key of Object.keys(formData)) {
    const orig = originalData.value[key]
    const curr = formData[key]
    const origStr = typeof orig === 'object' ? JSON.stringify(orig) : String(orig)
    const currStr = typeof curr === 'object' ? JSON.stringify(curr) : String(curr)
    if (origStr !== currStr) return true
  }
  return false
})

const loadData = async () => {
  if (!props.merchantId) return
  loading.value = true
  try {
    const res = await preOpsCheck(props.merchantId)
    preCheckData.value = res.data
    const merchant = res.data.merchant
    originalData.value = { ...merchant }
    Object.assign(basicForm, pick(merchant, Object.keys(basicForm)))
    Object.assign(businessForm, pick(merchant, Object.keys(businessForm)))
    Object.assign(contactForm, pick(merchant, Object.keys(contactForm)))
    Object.assign(settlementForm, pick(merchant, Object.keys(settlementForm)))
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    loading.value = false
  }
}

const pick = (obj, keys) => {
  const result = {}
  keys.forEach(key => { result[key] = obj[key] })
  return result
}

const canEditBranch = (branch) => {
  if (!preCheckData.value) return false
  if (!preCheckData.value.statusEditable) return false
  if (preCheckData.value.isLocked) return false
  const permMap = {
    basic: 'canEditBasic',
    business: 'canEditBusiness',
    contact: 'canEditContact',
    settlement: 'canEditSettlement'
  }
  return preCheckData.value.permissions[permMap[branch]]
}

const canEditField = (branch, field) => {
  if (!canEditBranch(branch)) return false
  if (preCheckData.value.isHighRisk && !preCheckData.value.permissions.canEditHighRisk) {
    const coreFields = ['name', 'unifiedCreditCode', 'legalPersonName', 'legalPersonIdCard', 'businessType', 'phone', 'settleBankAccount', 'settleBankName', 'commissionRate']
    if (coreFields.includes(field)) return false
  }
  return true
}

const switchBranch = (branch) => {
  if (!canEditBranch(branch)) {
    ElMessage.warning(permissionWarnings.value[branch] || '您没有该模块编辑权限')
    return
  }
  activeBranch.value = branch
}

const triggerShake = (fieldName) => {
  fieldErrors[fieldName] = '格式校验失败'
  setTimeout(() => { delete fieldErrors[fieldName] }, 1000)
}

const validatePhone = (value, fieldName = 'phone') => {
  if (!value) return true
  const regex = /^1[3-9]\d{9}$/
  if (!regex.test(value)) {
    fieldErrors[fieldName] = '手机号格式不正确，应为11位有效手机号'
    triggerShake(fieldName)
    return false
  }
  delete fieldErrors[fieldName]
  return true
}

const validateEmail = (value) => {
  if (!value) return true
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!regex.test(value)) {
    fieldErrors.email = '邮箱格式不正确'
    triggerShake('email')
    return false
  }
  delete fieldErrors.email
  return true
}

const validateIdCard = (value) => {
  if (!value) return true
  const regex = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/
  if (!regex.test(value)) {
    fieldErrors.legalPersonIdCard = '身份证号格式不正确'
    triggerShake('legalPersonIdCard')
    return false
  }
  delete fieldErrors.legalPersonIdCard
  return true
}

const validateBankAccount = (value, fieldName = 'settleBankAccount') => {
  if (!value) return true
  const regex = /^\d{16,22}$/
  if (!regex.test(value)) {
    fieldErrors[fieldName] = '银行账号格式不正确，应为16-22位数字'
    triggerShake(fieldName)
    return false
  }
  delete fieldErrors[fieldName]
  return true
}

const validateExpiryDate = (value, fieldName) => {
  if (!value) return true
  const now = new Date()
  const date = new Date(value)
  const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) {
    fieldErrors[fieldName] = '有效期已过期，请更新'
    return false
  } else if (diffDays < 30) {
    ElMessage.warning(`有效期将在${diffDays}天后到期，请及时续期`)
  }
  delete fieldErrors[fieldName]
  return true
}

const validateCommissionRate = () => {
  const rate = settlementForm.commissionRate
  const level = businessForm.merchantLevel
  const levelRateMap = { 1: 0.05, 2: 0.045, 3: 0.03, 4: 0.02, 5: 0.015 }
  const maxRate = levelRateMap[level] || 0.05
  if (rate > maxRate) {
    fieldErrors.commissionRate = `【${level}星】商家最高佣金比例为${maxRate * 100}%`
    triggerShake('commissionRate')
    return false
  }
  delete fieldErrors.commissionRate
  return true
}

const validateUnique = async (fieldName, value) => {
  if (!value) return true
  try {
    const res = await verifyFieldUnique({ fieldName, value, excludeId: props.merchantId })
    if (!res.data.unique) {
      fieldErrors[fieldName] = res.data.message
      triggerShake(fieldName)
      return false
    }
    delete fieldErrors[fieldName]
    return true
  } catch (e) {
    return true
  }
}

const getChangedFields = (form, original, branch) => {
  const changes = {}
  for (const key of Object.keys(form)) {
    const orig = original[key]
    const curr = form[key]
    const origStr = typeof orig === 'object' ? JSON.stringify(orig) : String(orig)
    const currStr = typeof curr === 'object' ? JSON.stringify(curr) : String(curr)
    if (origStr !== currStr) {
      changes[key] = curr
    }
  }
  return changes
}

const validateForm = async () => {
  const formRefMap = {
    basic: basicFormRef,
    business: businessFormRef,
    contact: contactFormRef,
    settlement: settlementFormRef
  }
  for (const [branch, ref] of Object.entries(formRefMap)) {
    if (!canEditBranch(branch)) continue
    if (ref.value) {
      const valid = await ref.value.validate().catch(() => false)
      if (!valid) {
        activeBranch.value = branch
        return false
      }
    }
  }
  if (!changeReason.value.trim()) {
    ElMessage.warning('请填写变更原因')
    return false
  }
  return true
}

const handleSubmitting = () => {
  submitDisabled.value = true
  setTimeout(() => {
    submitDisabled.value = false
  }, 300)
}

const submitChanges = async () => {
  const valid = await validateForm()
  if (!valid) return
  handleSubmitting()
  try {
    const results = []
    const apiMap = {
      BASIC: { api: updateBasicInfo, form: basicForm },
      BUSINESS: { api: updateBusinessInfo, form: businessForm },
      CONTACT: { api: updateContactInfo, form: contactForm },
      SETTLEMENT: { api: updateSettlementInfo, form: settlementForm }
    }
    for (const [branch, config] of Object.entries(apiMap)) {
      if (!canEditBranch(branch)) continue
      const changes = getChangedFields(config.form, originalData.value, branch)
      if (Object.keys(changes).length > 0) {
        const res = await config.api(props.merchantId, {
          fields: changes,
          reason: changeReason.value,
          remark: changeRemark.value
        })
        results.push(res)
      }
    }
    ElMessage.success(`信息更新成功，共修改${results.length}个模块`)
    emit('success')
    handleClose()
  } catch (e) {
    submitDisabled.value = false
    ElMessage.error(e.message)
  }
}

const handleClose = () => {
  if (hasChanges.value) {
    ElMessageBox.confirm('您有未保存的修改，确定要关闭吗？', '提示', {
      confirmButtonText: '确定关闭',
      cancelButtonText: '继续编辑',
      type: 'warning'
    }).then(() => {
      emit('update:modelValue', false)
    }).catch(() => {})
  } else {
    emit('update:modelValue', false)
  }
}

watch(() => props.modelValue, (val) => {
  if (val && props.merchantId) {
    loadData()
  }
})
</script>
