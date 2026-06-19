<template>
  <div class="ccb-corporate-profile">
    <CcbPageHeader
      title="对公客户信息运维"
      description="企业档案建档、类型自适应、前置校验与异常复核管理"
      icon="OfficeBuilding"
    />

    <CcbSearchForm v-model="searchForm" @search="handleSearch" @reset="handleReset">
      <el-form-item label="档案编号" prop="profileNo">
        <el-input v-model="searchForm.profileNo" placeholder="请输入档案编号" clearable />
      </el-form-item>
      <el-form-item label="企业名称" prop="enterpriseName">
        <el-input v-model="searchForm.enterpriseName" placeholder="请输入企业名称" clearable />
      </el-form-item>
      <el-form-item label="统一信用代码" prop="creditCode">
        <el-input v-model="searchForm.creditCode" placeholder="请输入统一社会信用代码" clearable />
      </el-form-item>
      <el-form-item label="客户类型" prop="customerType">
        <el-select v-model="searchForm.customerType" placeholder="请选择客户类型" clearable>
          <el-option v-for="(t, k) in customerTypeOptions" :key="k" :label="t" :value="Number(k)" />
        </el-select>
      </el-form-item>
      <el-form-item label="经营状态" prop="businessStatus">
        <el-select v-model="searchForm.businessStatus" placeholder="请选择经营状态" clearable>
          <el-option v-for="(t, k) in businessStatusOptions" :key="k" :label="t" :value="Number(k)" />
        </el-select>
      </el-form-item>
      <el-form-item label="风险等级" prop="riskLevel">
        <el-select v-model="searchForm.riskLevel" placeholder="请选择风险等级" clearable>
          <el-option v-for="(t, k) in riskLevelOptions" :key="k" :label="t" :value="Number(k)" />
        </el-select>
      </el-form-item>
      <el-form-item label="档案状态" prop="status">
        <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
          <el-option v-for="(t, k) in statusOptions" :key="k" :label="t" :value="Number(k)" />
        </el-select>
      </el-form-item>
      <el-form-item label="失信标记" prop="isDishonest">
        <el-select v-model="searchForm.isDishonest" placeholder="请选择" clearable>
          <el-option label="是" :value="1" />
          <el-option label="否" :value="0" />
        </el-select>
      </el-form-item>
    </CcbSearchForm>

    <div class="ccb-table-toolbar">
      <div class="ccb-table-toolbar-left">
        <CcbPermissionButton permission="corporate:profile:create">
          <el-button type="primary" :icon="Plus" @click="handleAdd">
            新建对公档案
          </el-button>
        </CcbPermissionButton>
        <CcbPermissionButton permission="corporate:profile:precheck">
          <el-button type="warning" :icon="CircleCheck" @click="handleBatchPrecheck">
            批量前置校验
          </el-button>
        </CcbPermissionButton>
      </div>
      <div class="ccb-table-toolbar-right">
        <el-text type="info">档案总数：</el-text>
        <el-text type="primary" size="large" bold>{{ total }}</el-text>
        <el-divider direction="vertical" />
        <el-tag type="success" effect="plain">正常 {{ stats.normal }}</el-tag>
        <el-tag type="warning" effect="plain">待完善 {{ stats.needComplete }}</el-tag>
        <el-tag type="danger" effect="plain">异常 {{ stats.abnormal }}</el-tag>
      </div>
    </div>

    <div v-if="listLoading" class="skeleton-wrapper">
      <el-skeleton :rows="8" animated :throttle="200">
        <template #template>
          <el-skeleton-table :rows="8" :columns="10" animated />
        </template>
      </el-skeleton>
    </div>

    <el-table
      v-else
      v-loading="listLoading"
      :data="tableData"
      :stripe="true"
      border
      style="width: 100%"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="45" />
      <el-table-column type="index" label="#" width="50" />
      <el-table-column prop="profileNo" label="档案编号" width="180" />
      <el-table-column prop="enterpriseName" label="企业名称" width="180" show-overflow-tooltip />
      <el-table-column prop="creditCode" label="统一信用代码" width="200">
        <template #default="{ row }">
          {{ maskCreditCode(row.creditCode) }}
        </template>
      </el-table-column>
      <el-table-column prop="customerType" label="客户类型" width="110">
        <template #default="{ row }">
          <el-tag :type="getCustomerTypeTagType(row.customerType)" effect="light" size="small">
            {{ customerTypeOptions[row.customerType] || '未知' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="businessStatus" label="经营状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getBusinessStatusTagType(row.businessStatus)" effect="light" size="small">
            {{ businessStatusOptions[row.businessStatus] || '未知' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="riskLevel" label="风险等级" width="100">
        <template #default="{ row }">
          <el-tag :type="getRiskTagType(row.riskLevel)" effect="light" size="small">
            {{ riskLevelOptions[row.riskLevel] || '未知' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="serviceLevel" label="服务等级" width="100">
        <template #default="{ row }">
          <el-tag :type="getServiceLevelTagType(row.serviceLevel)" effect="light" size="small">
            {{ serviceLevelOptions[row.serviceLevel] || '未知' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="校验状态" width="120">
        <template #default="{ row }">
          <div class="verify-status-group">
            <el-tooltip content="企业备案校验" placement="top">
              <el-icon :class="['verify-icon', getVerifyStatusClass(row.filingVerifyStatus)]">
                <CircleCheckFilled v-if="row.filingVerifyStatus === 1" />
                <CircleCloseFilled v-else-if="row.filingVerifyStatus === 2" />
                <QuestionFilled v-else />
              </el-icon>
            </el-tooltip>
            <el-tooltip content="法人身份校验" placement="top">
              <el-icon :class="['verify-icon', getVerifyStatusClass(row.legalVerifyStatus)]">
                <CircleCheckFilled v-if="row.legalVerifyStatus === 1" />
                <CircleCloseFilled v-else-if="row.legalVerifyStatus === 2" />
                <QuestionFilled v-else />
              </el-icon>
            </el-tooltip>
            <el-tooltip content="资质有效期校验" placement="top">
              <el-icon :class="['verify-icon', getVerifyStatusClass(row.qualificationVerifyStatus)]">
                <CircleCheckFilled v-if="row.qualificationVerifyStatus === 1" />
                <CircleCloseFilled v-else-if="row.qualificationVerifyStatus === 2" />
                <QuestionFilled v-else />
              </el-icon>
            </el-tooltip>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusTagType(row.status)" effect="light" size="small">
            {{ statusOptions[row.status] || '未知' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleEdit(row)">
            编辑
          </el-button>
          <el-button
            v-if="row.isAbnormal === 1"
            type="danger"
            link
            size="small"
            @click="handleReview(row)"
          >
            异常复核
          </el-button>
          <el-button type="success" link size="small" @click="handleViewLogs(row)">
            日志
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="pageParams.page"
        v-model:page-size="pageParams.pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @size-change="handlePageChange"
        @current-change="handlePageChange"
      />
    </div>

    <el-dialog
      v-model="precheckDialogVisible"
      title="前置校验"
      width="700px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <div v-if="precheckLoading" class="form-skeleton">
        <el-skeleton :rows="6" animated />
      </div>
      <div v-else>
        <el-form
          ref="precheckFormRef"
          :model="precheckForm"
          :rules="precheckRules"
          label-width="140px"
          class="precheck-form"
        >
          <el-divider content-position="left">企业备案信息</el-divider>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="企业名称" prop="enterprise_name">
                <el-input
                  v-model="precheckForm.enterprise_name"
                  placeholder="请输入企业全称"
                  :class="{ 'shake-error': shakeField === 'enterprise_name' }"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="统一信用代码" prop="credit_code">
                <el-input
                  v-model="precheckForm.credit_code"
                  placeholder="请输入18位统一社会信用代码"
                  maxlength="18"
                  :class="{ 'shake-error': shakeField === 'credit_code' }"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="行业分类" prop="industry_type">
                <el-select v-model="precheckForm.industry_type" placeholder="请选择行业分类" style="width: 100%">
                  <el-option
                    v-for="opt in industryOptions"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="注册资本(万元)" prop="registered_capital">
                <el-input-number
                  v-model="precheckForm.registered_capital"
                  :min="0"
                  :precision="2"
                  :step="100"
                  controls-position="right"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-divider content-position="left">法人身份校验</el-divider>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="法人代表姓名" prop="legal_representative">
                <el-input
                  v-model="precheckForm.legal_representative"
                  placeholder="请输入法人代表姓名"
                  :class="{ 'shake-error': shakeField === 'legal_representative' }"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="法人身份证号" prop="legal_id_card_no">
                <el-input
                  v-model="precheckForm.legal_id_card_no"
                  placeholder="请输入法人身份证号"
                  maxlength="18"
                  :class="{ 'shake-error': shakeField === 'legal_id_card_no' }"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-divider content-position="left">经营资质校验</el-divider>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="经营状态" prop="business_status">
                <el-select v-model="precheckForm.business_status" placeholder="请选择经营状态" style="width: 100%">
                  <el-option
                    v-for="(t, k) in businessStatusOptions"
                    :key="k"
                    :label="t"
                    :value="Number(k)"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="营业执照有效期" prop="license_valid_to">
                <el-date-picker
                  v-model="precheckForm.license_valid_to"
                  type="date"
                  placeholder="选择有效期至"
                  value-format="YYYY-MM-DD"
                  style="width: 70%"
                />
                <el-checkbox v-model="precheckForm.license_permanent" style="margin-left: 8px">长期</el-checkbox>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>

        <div v-if="precheckResult" class="precheck-result">
          <el-alert
            v-if="precheckResult.blocked"
            :title="precheckResult.block_reason || '存在严重校验错误，已被拦截'"
            type="error"
            :closable="false"
            show-icon
            style="margin-bottom: 12px"
          />
          <el-alert
            v-else-if="precheckResult.passed"
            title="前置校验通过"
            type="success"
            :closable="false"
            show-icon
            style="margin-bottom: 12px"
          />
          <el-alert
            v-for="(err, idx) in precheckResult.errors"
            :key="'err-' + idx"
            :title="err.message"
            type="error"
            :closable="false"
            show-icon
            style="margin-bottom: 8px"
          />
          <el-alert
            v-for="(warn, idx) in precheckResult.warnings"
            :key="'warn-' + idx"
            :title="warn"
            type="warning"
            :closable="false"
            show-icon
            style="margin-bottom: 8px"
          />
          <el-row v-if="precheckResult.missing_fields.length > 0" :gutter="12" class="missing-fields">
            <el-col :span="24">
              <el-text type="warning">缺失信息项：</el-text>
              <el-tag
                v-for="f in precheckResult.missing_fields"
                :key="f"
                type="warning"
                effect="dark"
                size="small"
                style="margin-left: 6px"
              >
                {{ getFieldLabel(f) }}
              </el-tag>
            </el-col>
          </el-row>
        </div>
      </div>
      <template #footer>
        <el-button @click="precheckDialogVisible = false">关闭</el-button>
        <el-button type="primary" :loading="precheckSubmitting" @click="handleDoPrecheck">
          执行校验
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="formDialogVisible"
      :title="isEdit ? '编辑对公档案' : '新建对公档案'"
      width="1000px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <div v-if="formLoading" class="form-skeleton">
        <el-skeleton :rows="10" animated />
      </div>
      <el-form
        v-else
        ref="profileFormRef"
        :model="profileForm"
        :rules="formRules"
        label-width="130px"
        class="profile-form"
      >
        <el-divider content-position="left">企业基本信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="企业名称" prop="enterprise_name">
              <el-input
                v-model="profileForm.enterprise_name"
                placeholder="请输入企业全称"
                :class="{ 'shake-error': shakeField === 'enterprise_name' }"
                @blur="triggerFieldShake('enterprise_name')"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="统一信用代码" prop="credit_code">
              <el-input
                v-model="profileForm.credit_code"
                placeholder="请输入18位统一社会信用代码"
                maxlength="18"
                :class="{ 'shake-error': shakeField === 'credit_code' }"
                @blur="triggerFieldShake('credit_code')"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="企业简称" prop="enterprise_short_name">
              <el-input v-model="profileForm.enterprise_short_name" placeholder="请输入企业简称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="行业分类" prop="industry_type">
              <el-select v-model="profileForm.industry_type" placeholder="请选择行业分类" style="width: 100%" @change="triggerAdaptType">
                <el-option
                  v-for="opt in industryOptions"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="注册资本(万元)" prop="registered_capital">
              <el-input-number
                v-model="profileForm.registered_capital"
                :min="0"
                :precision="2"
                :step="100"
                controls-position="right"
                style="width: 100%"
                @change="triggerAdaptType"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="成立日期" prop="establish_date">
              <el-date-picker
                v-model="profileForm.establish_date"
                type="date"
                placeholder="选择成立日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
                @change="calcBusinessYears"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="经营状态" prop="business_status">
              <el-select v-model="profileForm.business_status" placeholder="请选择经营状态" style="width: 100%" @change="triggerAdaptType">
                <el-option
                  v-for="(t, k) in businessStatusOptions"
                  :key="k"
                  :label="t"
                  :value="Number(k)"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="营业执照编号" prop="license_no">
              <el-input v-model="profileForm.license_no" placeholder="请输入营业执照编号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="营业执照有效期" prop="license_valid_to">
              <el-date-picker
                v-model="profileForm.license_valid_to"
                type="date"
                placeholder="选择有效期至"
                value-format="YYYY-MM-DD"
                style="width: 70%"
              />
              <el-checkbox v-model="licensePermanent" style="margin-left: 8px">长期</el-checkbox>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="注册地址" prop="registered_address">
              <el-input v-model="profileForm.registered_address" placeholder="请输入注册地址" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="经营地址" prop="business_address">
              <el-input v-model="profileForm.business_address" placeholder="请输入实际经营地址" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="经营范围" prop="business_scope">
              <el-input
                v-model="profileForm.business_scope"
                type="textarea"
                :rows="2"
                placeholder="请输入经营范围"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">法人代表信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="法人代表姓名" prop="legal_representative">
              <el-input
                v-model="profileForm.legal_representative"
                placeholder="请输入法人代表姓名"
                :class="{ 'shake-error': shakeField === 'legal_representative' }"
                @blur="triggerFieldShake('legal_representative')"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="法人身份证号" prop="legal_id_card_no">
              <el-input
                v-model="profileForm.legal_id_card_no"
                placeholder="请输入法人身份证号"
                maxlength="18"
                :class="{ 'shake-error': shakeField === 'legal_id_card_no' }"
                @blur="triggerFieldShake('legal_id_card_no')"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="法人证件类型" prop="legal_id_type">
              <el-select v-model="profileForm.legal_id_type" placeholder="请选择" style="width: 100%">
                <el-option label="身份证" :value="1" />
                <el-option label="护照" :value="2" />
                <el-option label="军官证" :value="3" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="法人手机号" prop="legal_mobile">
              <el-input v-model="profileForm.legal_mobile" placeholder="请输入法人手机号" maxlength="11" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">联系信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="联系人" prop="contact_person">
              <el-input v-model="profileForm.contact_person" placeholder="请输入联系人" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="联系电话" prop="contact_phone">
              <el-input v-model="profileForm.contact_phone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="联系邮箱" prop="contact_email">
              <el-input v-model="profileForm.contact_email" placeholder="请输入邮箱" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">类型自适应</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="客户类型" prop="customer_type">
              <el-select v-model="profileForm.customer_type" placeholder="请选择客户类型" style="width: 100%" @change="handleCustomerTypeChange">
                <el-option
                  v-for="(t, k) in customerTypeOptions"
                  :key="k"
                  :label="t"
                  :value="Number(k)"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <div v-if="adaptResult" class="adapt-preview">
          <el-descriptions :column="3" border size="small">
            <el-descriptions-item label="客户类型">
              <el-tag :type="getCustomerTypeTagType(adaptResult.customer_type)" effect="dark" size="large">
                {{ adaptResult.customer_type_text }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="授信额度">
              <el-text type="primary" size="large">{{ formatMoney(adaptResult.credit_limit) }}</el-text>
            </el-descriptions-item>
            <el-descriptions-item label="服务等级">
              <el-tag :type="getServiceLevelTagType(adaptResult.service_level)" effect="dark">
                {{ adaptResult.service_level_text }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="风险等级">
              <el-tag :type="getRiskTagType(adaptResult.risk_level)" effect="dark">
                {{ adaptResult.risk_level_text }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="风险标签" :span="2">
              <div class="tag-group">
                <el-tag
                  v-for="tag in adaptResult.risk_tags"
                  :key="tag"
                  type="warning"
                  effect="plain"
                  size="small"
                  style="margin-right: 4px"
                >
                  {{ tag }}
                </el-tag>
              </div>
            </el-descriptions-item>
            <el-descriptions-item label="服务权限" :span="3">
              <div class="tag-group">
                <el-tag
                  v-for="perm in adaptResult.service_permissions"
                  :key="perm"
                  type="primary"
                  effect="plain"
                  size="small"
                  style="margin-right: 4px; margin-bottom: 4px"
                >
                  {{ perm }}
                </el-tag>
              </div>
            </el-descriptions-item>
            <el-descriptions-item label="适配规则" :span="3">
              <div class="adapt-rules">
                <div v-for="rule in adaptResult.adapt_rules" :key="rule" class="rule-item">
                  <el-icon color="#67c23a"><Check /></el-icon>
                  <span>{{ rule }}</span>
                </div>
              </div>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <el-divider v-if="precheckResult && (precheckResult.errors.length > 0 || precheckResult.warnings.length > 0)" content-position="left">
          前置校验结果
        </el-divider>
        <div v-if="precheckResult" class="precheck-result">
          <el-alert
            v-if="precheckResult.blocked"
            :title="precheckResult.block_reason || '存在严重校验错误，已被拦截'"
            type="error"
            :closable="false"
            show-icon
            style="margin-bottom: 12px"
          />
          <el-alert
            v-for="(err, idx) in precheckResult.errors"
            :key="'form-err-' + idx"
            :title="err.message"
            type="error"
            :closable="false"
            show-icon
            style="margin-bottom: 8px"
          />
          <el-alert
            v-for="(warn, idx) in precheckResult.warnings"
            :key="'form-warn-' + idx"
            :title="warn"
            type="warning"
            :closable="false"
            show-icon
            style="margin-bottom: 8px"
          />
        </div>
      </el-form>
      <template #footer>
        <el-button @click="formDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
          {{ isEdit ? '更新档案' : '提交建档' }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="reviewDialogVisible" title="异常档案复核" width="600px" destroy-on-close>
      <el-form :model="reviewForm" label-width="100px">
        <el-form-item label="档案编号">
          <el-text>{{ currentProfile?.profileNo }}</el-text>
        </el-form-item>
        <el-form-item label="企业名称">
          <el-text>{{ currentProfile?.enterpriseName }}</el-text>
        </el-form-item>
        <el-form-item label="异常原因">
          <el-text type="danger">{{ currentProfile?.abnormalReason }}</el-text>
        </el-form-item>
        <el-form-item label="复核结果" prop="passed">
          <el-radio-group v-model="reviewForm.passed">
            <el-radio :value="true">
              <el-icon color="#67c23a"><CircleCheckFilled /></el-icon>
              复核通过
            </el-radio>
            <el-radio :value="false">
              <el-icon color="#f56c6c"><CircleCloseFilled /></el-icon>
              复核不通过
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="复核意见" prop="review_remark">
          <el-input
            v-model="reviewForm.review_remark"
            type="textarea"
            :rows="3"
            placeholder="请输入复核意见"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reviewDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmitReview">
          提交复核
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="logsDialogVisible" title="档案变更日志" width="800px" destroy-on-close>
      <el-timeline>
        <el-timeline-item
          v-for="log in profileLogs"
          :key="log.id"
          :timestamp="log.operateTime"
          :type="getLogTimelineType(log.changeType)"
          :hollow="log.changeType === '7'"
        >
          <el-card shadow="never" class="log-card">
            <div class="log-header">
              <el-tag :type="getLogTagType(log.changeType)" effect="light">
                {{ log.changeTypeName }}
              </el-tag>
              <span class="log-operator">
                {{ log.operatorName || '系统' }}
                <span v-if="log.operatorOrgName">@{{ log.operatorOrgName }}</span>
              </span>
            </div>
            <div v-if="log.changeRemark" class="log-remark">{{ log.changeRemark }}</div>
            <div v-if="log.reviewerName" class="log-detail">
              <div class="review-info">
                <el-icon color="#e6a23c"><Stamp /></el-icon>
                复核人：{{ log.reviewerName }}，复核时间：{{ log.reviewTime }}
              </div>
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  CircleCheck,
  CircleCheckFilled,
  CircleCloseFilled,
  QuestionFilled,
  Check,
  Stamp
} from '@element-plus/icons-vue'
import {
  preCheckCorporateProfileApi,
  adaptCorporateTypeApi,
  getCorporateProfileListApi,
  getCorporateProfileDetailApi,
  createCorporateProfileApi,
  updateCorporateProfileApi,
  getCorporateProfileLogsApi,
  reviewAbnormalCorporateApi,
  type CorporateProfile,
  type CorporateProfileForm,
  type CorpPreCheckResult,
  type CorpTypeAdaptResult,
  type CorporateProfileLog,
  IndustryTypeOptions
} from '@api/business'

const listLoading = ref<boolean>(false)
const formLoading = ref<boolean>(false)
const submitLoading = ref<boolean>(false)
const precheckLoading = ref<boolean>(false)
const precheckSubmitting = ref<boolean>(false)
const tableData = ref<CorporateProfile[]>([])
const total = ref<number>(0)
const selectedRows = ref<CorporateProfile[]>([])
const shakeField = ref<string>('')

const customerTypeOptions: Record<number, string> = {
  1: '小微企业',
  2: '中型企业',
  3: '大型企业',
  4: '集团客户'
}

const serviceLevelOptions: Record<number, string> = {
  1: '基础',
  2: '标准',
  3: '优先',
  4: '专属'
}

const riskLevelOptions: Record<number, string> = {
  1: '低',
  2: '中',
  3: '高',
  4: '极高'
}

const businessStatusOptions: Record<number, string> = {
  1: '正常经营',
  2: '停业',
  3: '注销',
  4: '吊销',
  5: '迁入',
  6: '迁出'
}

const statusOptions: Record<number, string> = {
  1: '已建档',
  2: '已变更',
  3: '已注销',
  4: '锁定待复核'
}

const industryOptions = IndustryTypeOptions

const searchForm = reactive({
  profileNo: '',
  enterpriseName: '',
  creditCode: '',
  customerType: null as number | null,
  businessStatus: null as number | null,
  riskLevel: null as number | null,
  status: null as number | null,
  isDishonest: null as number | null
})

const pageParams = reactive({
  page: 1,
  pageSize: 10
})

const stats = computed(() => {
  const result = { normal: 0, needComplete: 0, abnormal: 0 }
  tableData.value.forEach(row => {
    if (row.status === 1 || row.status === 2) result.normal++
    if (row.needComplete === 1) result.needComplete++
    if (row.isAbnormal === 1) result.abnormal++
  })
  return result
})

const formDialogVisible = ref<boolean>(false)
const precheckDialogVisible = ref<boolean>(false)
const logsDialogVisible = ref<boolean>(false)
const reviewDialogVisible = ref<boolean>(false)

const isEdit = ref<boolean>(false)
const currentProfile = ref<CorporateProfile | null>(null)
const profileLogs = ref<CorporateProfileLog[]>([])
const precheckResult = ref<CorpPreCheckResult | null>(null)
const adaptResult = ref<CorpTypeAdaptResult | null>(null)
const licensePermanent = ref<boolean>(false)

const profileFormRef = ref<FormInstance>()
const precheckFormRef = ref<FormInstance>()

const profileForm = reactive<CorporateProfileForm>({
  enterprise_name: '',
  credit_code: '',
  enterprise_short_name: '',
  legal_representative: '',
  legal_id_card_no: '',
  legal_id_type: 1,
  legal_mobile: '',
  industry_type: '',
  industry_code: '',
  registered_capital: 0,
  registered_address: '',
  business_address: '',
  establish_date: '',
  business_years: 0,
  business_status: 1,
  business_scope: '',
  license_no: '',
  license_valid_from: '',
  license_valid_to: '',
  license_permanent: 0,
  customer_type: 1,
  contact_person: '',
  contact_phone: '',
  contact_email: ''
})

const precheckForm = reactive({
  enterprise_name: '',
  credit_code: '',
  legal_representative: '',
  legal_id_card_no: '',
  registered_address: '-',
  industry_type: '',
  registered_capital: 0,
  business_status: 1 as number,
  license_valid_to: '',
  license_permanent: false
})

const reviewForm = reactive({
  profile_id: '',
  passed: true,
  review_remark: ''
})

const precheckRules: FormRules = {
  enterprise_name: [{ required: true, message: '请输入企业名称', trigger: 'blur' }],
  credit_code: [
    { required: true, message: '请输入统一社会信用代码', trigger: 'blur' },
    {
      pattern: /^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/,
      message: '统一社会信用代码格式不正确',
      trigger: 'blur'
    }
  ],
  legal_representative: [{ required: true, message: '请输入法人代表姓名', trigger: 'blur' }],
  legal_id_card_no: [
    { required: true, message: '请输入法人身份证号', trigger: 'blur' },
    {
      pattern: /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/,
      message: '身份证号格式不正确',
      trigger: 'blur'
    }
  ],
  business_status: [{ required: true, message: '请选择经营状态', trigger: 'change' }]
}

const formRules: FormRules = {
  enterprise_name: [{ required: true, message: '请输入企业名称', trigger: 'blur' }],
  credit_code: [
    { required: true, message: '请输入统一社会信用代码', trigger: 'blur' },
    {
      pattern: /^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/,
      message: '统一社会信用代码格式不正确',
      trigger: 'blur'
    }
  ],
  legal_representative: [{ required: true, message: '请输入法人代表姓名', trigger: 'blur' }],
  legal_id_card_no: [
    { required: true, message: '请输入法人身份证号', trigger: 'blur' },
    {
      pattern: /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/,
      message: '身份证号格式不正确',
      trigger: 'blur'
    }
  ],
  registered_address: [{ required: true, message: '请输入注册地址', trigger: 'blur' }],
  business_status: [{ required: true, message: '请选择经营状态', trigger: 'change' }],
  customer_type: [{ required: true, message: '请选择客户类型', trigger: 'change' }]
}

const fieldLabelMap: Record<string, string> = {
  enterprise_name: '企业名称',
  credit_code: '统一信用代码',
  legal_representative: '法人代表',
  legal_id_card_no: '法人身份证号',
  registered_address: '注册地址',
  business_address: '经营地址',
  industry_type: '行业分类',
  registered_capital: '注册资本',
  license_no: '营业执照编号',
  contact_person: '联系人',
  contact_phone: '联系电话'
}

const fetchData = async (): Promise<void> => {
  listLoading.value = true
  try {
    const params: any = {
      page: pageParams.page,
      pageSize: pageParams.pageSize,
      profile_no: searchForm.profileNo || undefined,
      enterprise_name: searchForm.enterpriseName || undefined,
      credit_code: searchForm.creditCode || undefined,
      customer_type: searchForm.customerType ?? undefined,
      business_status: searchForm.businessStatus ?? undefined,
      risk_level: searchForm.riskLevel ?? undefined,
      status: searchForm.status ?? undefined,
      is_dishonest: searchForm.isDishonest ?? undefined
    }
    const res = await getCorporateProfileListApi(params)
    tableData.value = res.data.list.map((item: any) => transformKeys(item))
    total.value = res.data.total
  } catch (_e) {
  } finally {
    listLoading.value = false
  }
}

const transformKeys = (obj: any): any => {
  const result: any = {}
  for (const key of Object.keys(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
    result[camelKey] = obj[key]
  }
  return result
}

const handleSearch = (): void => {
  pageParams.page = 1
  fetchData()
}

const handleReset = (): void => {
  searchForm.profileNo = ''
  searchForm.enterpriseName = ''
  searchForm.creditCode = ''
  searchForm.customerType = null
  searchForm.businessStatus = null
  searchForm.riskLevel = null
  searchForm.status = null
  searchForm.isDishonest = null
  pageParams.page = 1
  fetchData()
}

const handlePageChange = (): void => {
  fetchData()
}

const handleSelectionChange = (val: unknown[]): void => {
  selectedRows.value = val as CorporateProfile[]
}

const handleAdd = (): void => {
  isEdit.value = false
  currentProfile.value = null
  resetProfileForm()
  precheckResult.value = null
  adaptResult.value = null
  formDialogVisible.value = true
}

const handleEdit = (row: CorporateProfile): void => {
  isEdit.value = true
  currentProfile.value = row
  formLoading.value = true
  formDialogVisible.value = true
  precheckResult.value = null
  adaptResult.value = null
  setTimeout(async () => {
    try {
      const res = await getCorporateProfileDetailApi(row.id)
      const data = res.data
      Object.assign(profileForm, {
        id: data.id,
        org_id: data.org_id,
        enterprise_name: data.enterprise_name,
        credit_code: data.credit_code,
        enterprise_short_name: data.enterprise_short_name || '',
        legal_representative: data.legal_representative,
        legal_id_card_no: data.legal_id_card_no,
        legal_id_type: data.legal_id_type || 1,
        legal_mobile: data.legal_mobile || '',
        industry_type: data.industry_type || '',
        industry_code: data.industry_code || '',
        registered_capital: data.registered_capital || 0,
        registered_address: data.registered_address,
        business_address: data.business_address || '',
        establish_date: data.establish_date || '',
        business_years: data.business_years || 0,
        business_status: data.business_status,
        business_scope: data.business_scope || '',
        license_no: data.license_no || '',
        license_valid_from: data.license_valid_from || '',
        license_valid_to: data.license_valid_to || '',
        license_permanent: data.license_permanent || 0,
        customer_type: data.customer_type,
        contact_person: data.contact_person || '',
        contact_phone: data.contact_phone || '',
        contact_email: data.contact_email || ''
      })
      licensePermanent.value = data.license_permanent === 1
      const cType = data.customer_type
      const sLevel = data.service_level
      const rLevel = data.risk_level
      adaptResult.value = {
        customer_type: cType,
        customer_type_text: customerTypeOptions[cType] || '未知',
        credit_limit: data.credit_limit || 0,
        service_level: sLevel,
        service_level_text: serviceLevelOptions[sLevel] || '未知',
        risk_level: rLevel,
        risk_level_text: riskLevelOptions[rLevel] || '未知',
        risk_tags: data.risk_tag_list || [],
        service_permissions: data.service_permission_list || [],
        adapt_factors: {
          registered_capital: data.registered_capital || 0,
          business_years: data.business_years || 0,
          business_status: data.business_status,
          industry_type: data.industry_type || ''
        },
        adapt_rules: [`当前客户类型：${customerTypeOptions[cType]}`]
      }
    } catch (_e) {
    } finally {
      formLoading.value = false
    }
  }, 300)
}

const handleBatchPrecheck = (): void => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择需要校验的档案')
    return
  }
  Object.assign(precheckForm, {
    enterprise_name: '',
    credit_code: '',
    legal_representative: '',
    legal_id_card_no: '',
    registered_address: '-',
    industry_type: '',
    registered_capital: 0,
    business_status: 1,
    license_valid_to: '',
    license_permanent: false
  })
  precheckResult.value = null
  precheckDialogVisible.value = true
}

const handleDoPrecheck = async (): Promise<void> => {
  if (!precheckFormRef.value) return
  try {
    await precheckFormRef.value.validate()
  } catch (_e) {
    ElMessage.warning('请完善校验信息')
    return
  }

  precheckSubmitting.value = true
  try {
    const res = await preCheckCorporateProfileApi({
      ...precheckForm,
      license_permanent: precheckForm.license_permanent ? 1 : 0
    })
    precheckResult.value = res.data
    for (const err of res.data.errors) {
      triggerShake(err.field)
    }
    if (res.data.blocked) {
      ElMessage.error(res.data.block_reason || '前置校验拦截')
    } else if (res.data.passed) {
      ElMessage.success('前置校验通过')
    }
  } catch (_e) {
  } finally {
    precheckSubmitting.value = false
  }
}

const handleReview = (row: CorporateProfile): void => {
  currentProfile.value = row
  reviewForm.profile_id = row.id
  reviewForm.passed = true
  reviewForm.review_remark = ''
  reviewDialogVisible.value = true
}

const handleSubmitReview = async (): Promise<void> => {
  if (!reviewForm.review_remark.trim()) {
    ElMessage.warning('请输入复核意见')
    return
  }
  submitLoading.value = true
  try {
    await reviewAbnormalCorporateApi({
      profile_id: reviewForm.profile_id,
      passed: reviewForm.passed,
      review_remark: reviewForm.review_remark
    })
    ElMessage.success('复核成功')
    reviewDialogVisible.value = false
    fetchData()
  } catch (_e) {
  } finally {
    submitLoading.value = false
  }
}

const handleViewLogs = async (row: CorporateProfile): Promise<void> => {
  currentProfile.value = row
  try {
    const res = await getCorporateProfileLogsApi(row.id)
    profileLogs.value = res.data.map((item: any) => transformKeys(item))
    logsDialogVisible.value = true
  } catch (_e) {
    ElMessage.error('获取日志失败')
  }
}

const resetProfileForm = (): void => {
  profileForm.id = undefined
  profileForm.enterprise_name = ''
  profileForm.credit_code = ''
  profileForm.enterprise_short_name = ''
  profileForm.legal_representative = ''
  profileForm.legal_id_card_no = ''
  profileForm.legal_id_type = 1
  profileForm.legal_mobile = ''
  profileForm.industry_type = ''
  profileForm.industry_code = ''
  profileForm.registered_capital = 0
  profileForm.registered_address = ''
  profileForm.business_address = ''
  profileForm.establish_date = ''
  profileForm.business_years = 0
  profileForm.business_status = 1
  profileForm.business_scope = ''
  profileForm.license_no = ''
  profileForm.license_valid_from = ''
  profileForm.license_valid_to = ''
  profileForm.license_permanent = 0
  profileForm.customer_type = 1
  profileForm.contact_person = ''
  profileForm.contact_phone = ''
  profileForm.contact_email = ''
  profileForm.skip_precheck = false
  licensePermanent.value = false
  profileFormRef.value?.resetFields()
}

const triggerShake = (field: string): void => {
  shakeField.value = field
  setTimeout(() => {
    shakeField.value = ''
  }, 600)
}

const triggerFieldShake = (field: string): void => {
  shakeField.value = field
  setTimeout(() => {
    shakeField.value = ''
  }, 600)
}

const calcBusinessYears = (): void => {
  if (profileForm.establish_date) {
    const establish = new Date(profileForm.establish_date)
    const now = new Date()
    const diff = now.getFullYear() - establish.getFullYear()
    profileForm.business_years = diff > 0 ? diff : 0
  }
  triggerAdaptType()
}

const triggerAdaptType = async (): Promise<void> => {
  const capital = Number(profileForm.registered_capital) || 0
  const years = Number(profileForm.business_years) || 0
  const status = Number(profileForm.business_status) || 1
  const industry = profileForm.industry_type || ''

  if (!industry || capital <= 0) return

  try {
    const res = await adaptCorporateTypeApi({
      registered_capital: capital,
      business_years: years,
      business_status: status,
      industry_type: industry
    })
    adaptResult.value = res.data
    profileForm.customer_type = res.data.customer_type
  } catch (_e) {
    const type = localAdaptType(capital, years, status, industry)
    profileForm.customer_type = type
    adaptResult.value = buildLocalAdaptResult(type, capital, years, status, industry)
  }
}

const localAdaptType = (capital: number, years: number, status: number, _industry: string): number => {
  if (status === 3 || status === 4) return 1
  if (capital >= 50000 && years >= 10) return 4
  if (capital >= 10000 && years >= 5) return 3
  if (capital >= 1000 && years >= 2) return 2
  return 1
}

const buildLocalAdaptResult = (
  type: number,
  capital: number,
  years: number,
  status: number,
  industry: string
): CorpTypeAdaptResult => {
  const adaptConfigs: Record<number, {
    creditLimit: number
    serviceLevel: number
    riskLevel: number
    riskTags: string[]
    permissions: string[]
  }> = {
    1: {
      creditLimit: 2000000,
      serviceLevel: 1,
      riskLevel: status === 2 ? 3 : 2,
      riskTags: ['规模较小', '需关注'],
      permissions: ['基础查询', '基础结算', '基础信贷']
    },
    2: {
      creditLimit: 20000000,
      serviceLevel: 2,
      riskLevel: status === 2 ? 3 : 2,
      riskTags: ['中型企业', '持续关注'],
      permissions: ['基础查询', '基础结算', '基础信贷', '贸易融资', '票据业务']
    },
    3: {
      creditLimit: 100000000,
      serviceLevel: 3,
      riskLevel: status === 2 ? 3 : 1,
      riskTags: ['大型企业', '稳定经营'],
      permissions: ['基础查询', '基础结算', '综合信贷', '贸易融资', '票据业务', '投资理财', '现金管理']
    },
    4: {
      creditLimit: 500000000,
      serviceLevel: 4,
      riskLevel: 1,
      riskTags: ['集团客户', '战略客户'],
      permissions: ['基础查询', '基础结算', '综合信贷', '贸易融资', '票据业务', '投资理财', '现金管理', '集团资金池', '供应链金融', '专属客户经理']
    }
  }

  const config = adaptConfigs[type]
  const rules: string[] = []

  if (capital >= 50000) rules.push(`注册资本≥5亿元（${capital.toLocaleString()}万元）`)
  else if (capital >= 10000) rules.push(`注册资本≥1亿元（${capital.toLocaleString()}万元）`)
  else if (capital >= 1000) rules.push(`注册资本≥1000万元（${capital.toLocaleString()}万元）`)
  else rules.push(`注册资本＜1000万元（${capital.toLocaleString()}万元）`)

  if (years >= 10) rules.push(`经营年限≥10年（${years}年）`)
  else if (years >= 5) rules.push(`经营年限≥5年（${years}年）`)
  else if (years >= 2) rules.push(`经营年限≥2年（${years}年）`)
  else rules.push(`经营年限＜2年（${years}年）`)

  if (status !== 1) rules.push(`经营状态异常：${businessStatusOptions[status]}`)

  return {
    customer_type: type,
    customer_type_text: customerTypeOptions[type],
    credit_limit: config.creditLimit,
    service_level: config.serviceLevel,
    service_level_text: serviceLevelOptions[config.serviceLevel],
    risk_level: config.riskLevel,
    risk_level_text: riskLevelOptions[config.riskLevel],
    risk_tags: config.riskTags,
    service_permissions: config.permissions,
    adapt_factors: {
      registered_capital: capital,
      business_years: years,
      business_status: status,
      industry_type: industry
    },
    adapt_rules: rules
  }
}

const handleCustomerTypeChange = (): void => {
  const type = profileForm.customer_type || 1
  const capital = Number(profileForm.registered_capital) || 0
  const years = Number(profileForm.business_years) || 0
  const status = Number(profileForm.business_status) || 1
  const industry = profileForm.industry_type || ''

  if (!adaptResult.value || adaptResult.value.customer_type !== type) {
    adaptResult.value = buildLocalAdaptResult(type, capital, years, status, industry)
  }
}

const handleSubmit = async (): Promise<void> => {
  if (!profileFormRef.value) return
  try {
    await profileFormRef.value.validate()
  } catch (_e) {
    ElMessage.warning('请完善必填项')
    return
  }

  if (!isEdit.value) {
    submitLoading.value = true
    try {
      profileForm.license_permanent = licensePermanent.value ? 1 : 0
      const res = await preCheckCorporateProfileApi({ ...profileForm })
      precheckResult.value = res.data
      for (const err of res.data.errors) {
        triggerShake(err.field)
      }
      if (res.data.blocked) {
        ElMessage.error(res.data.block_reason || '前置校验拦截，无法建档')
        submitLoading.value = false
        return
      }
      if (res.data.errors.length > 0) {
        ElMessageBox.confirm(
          `存在${res.data.errors.length}项校验错误，是否强制提交建档？`,
          '校验警告',
          {
            confirmButtonText: '强制提交',
            cancelButtonText: '返回修改',
            type: 'warning'
          }
        )
          .then(async () => {
            profileForm.skip_precheck = true
            await doSubmit()
          })
          .catch(() => {
            submitLoading.value = false
          })
        return
      }
    } catch (_e) {
      submitLoading.value = false
      return
    }
  }

  await doSubmit()
}

const doSubmit = async (): Promise<void> => {
  submitLoading.value = true
  try {
    profileForm.license_permanent = licensePermanent.value ? 1 : 0
    if (isEdit.value && profileForm.id) {
      await updateCorporateProfileApi(profileForm.id, profileForm)
      ElMessage.success('档案更新成功')
    } else {
      await createCorporateProfileApi(profileForm)
      ElMessage.success('对公建档成功')
    }
    formDialogVisible.value = false
    fetchData()
  } catch (_e) {
  } finally {
    submitLoading.value = false
  }
}

const maskCreditCode = (code: string): string => {
  if (!code || code.length < 10) return code || ''
  return code.substring(0, 6) + '********' + code.substring(code.length - 4)
}

const formatMoney = (v: number): string => {
  return '¥' + v.toLocaleString('zh-CN')
}

const getFieldLabel = (key: string): string => fieldLabelMap[key] || key

const getCustomerTypeTagType = (type: number): string => {
  const map: Record<number, string> = { 1: 'info', 2: 'success', 3: 'warning', 4: 'danger' }
  return map[type] || 'info'
}

const getBusinessStatusTagType = (status: number): string => {
  const map: Record<number, string> = { 1: 'success', 2: 'warning', 3: 'info', 4: 'danger', 5: 'primary', 6: 'info' }
  return map[status] || 'info'
}

const getRiskTagType = (level: number): string => {
  const map: Record<number, string> = { 1: 'success', 2: 'warning', 3: 'danger', 4: 'danger' }
  return map[level] || 'info'
}

const getServiceLevelTagType = (level: number): string => {
  const map: Record<number, string> = { 1: 'info', 2: 'success', 3: 'warning', 4: 'danger' }
  return map[level] || 'info'
}

const getVerifyStatusClass = (status: number): string => {
  if (status === 1) return 'status-pass'
  if (status === 2) return 'status-fail'
  return 'status-unknown'
}

const getStatusTagType = (status: number): string => {
  const map: Record<number, string> = { 1: 'success', 2: 'warning', 3: 'info', 4: 'danger' }
  return map[status] || 'info'
}

const getLogTimelineType = (changeType: string): string => {
  const map: Record<string, string> = {
    '1': 'primary', '2': 'warning', '3': 'success', '4': 'info',
    '5': 'danger', '6': 'warning', '7': 'success'
  }
  return map[changeType] || 'primary'
}

const getLogTagType = (changeType: string): string => {
  const map: Record<string, string> = {
    '1': 'primary', '2': 'warning', '3': 'success', '4': 'info',
    '5': 'danger', '6': '', '7': 'success'
  }
  return map[changeType] || ''
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.ccb-corporate-profile {
  .skeleton-wrapper {
    padding: 20px;
    background: #fff;
    border-radius: 4px;
  }

  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    padding: 16px 0;
  }

  .verify-status-group {
    display: flex;
    gap: 6px;

    .verify-icon {
      font-size: 16px;

      &.status-pass {
        color: #67c23a;
      }
      &.status-fail {
        color: #f56c6c;
      }
      &.status-unknown {
        color: #c0c4cc;
      }
    }
  }

  .tag-group {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .profile-form,
  .precheck-form {
    :deep(.el-form-item) {
      margin-bottom: 14px;
    }
  }

  .shake-error {
    animation: shakeError 0.5s;

    :deep(.el-input__wrapper),
    :deep(.el-textarea__inner) {
      border-color: #f56c6c !important;
      box-shadow: 0 0 0 1px #f56c6c inset !important;
      background-color: #fef0f0 !important;
    }
  }

  .adapt-preview {
    padding: 12px 0;

    .adapt-rules {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .rule-item {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: #606266;
      }
    }
  }

  .precheck-result {
    margin-bottom: 10px;

    .missing-fields {
      padding: 10px;
      background: #fdf6ec;
      border-radius: 4px;
    }
  }

  .log-card {
    border: none;
    padding: 8px 0;

    :deep(.el-card__body) {
      padding: 12px;
    }

    .log-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;

      .log-operator {
        font-size: 12px;
        color: #909399;
      }
    }

    .log-remark {
      font-size: 13px;
      color: #606266;
      margin-bottom: 6px;
    }

    .log-detail {
      .review-info {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: #e6a23c;
        padding: 6px;
        background: #fdf6ec;
        border-radius: 4px;
      }
    }
  }

  .form-skeleton {
    padding: 20px 0;
  }
}

@keyframes shakeError {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}
</style>
