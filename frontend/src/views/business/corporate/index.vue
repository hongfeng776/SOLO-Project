<template>
  <div class="ccb-business-corporate">
    <CcbPageHeader
      title="对公开户"
      description="企业/机构单位账户开户申请与管理"
      icon="OfficeBuilding"
    />

    <CcbSearchForm v-model="searchForm" @search="handleSearch" @reset="handleReset">
      <el-form-item label="申请流水号" prop="openingNo">
        <el-input v-model="searchForm.openingNo" placeholder="请输入申请流水号" clearable />
      </el-form-item>
      <el-form-item label="企业名称" prop="enterpriseName">
        <el-input v-model="searchForm.enterpriseName" placeholder="请输入企业名称" clearable />
      </el-form-item>
      <el-form-item label="统一社会信用代码" prop="creditCode">
        <el-input v-model="searchForm.creditCode" placeholder="请输入统一社会信用代码" clearable />
      </el-form-item>
      <el-form-item label="账户类型" prop="accountType">
        <el-select v-model="searchForm.accountType" placeholder="请选择账户类型" clearable>
          <el-option label="基本存款账户" :value="1" />
          <el-option label="一般存款账户" :value="2" />
          <el-option label="专用存款账户" :value="3" />
          <el-option label="临时存款账户" :value="4" />
        </el-select>
      </el-form-item>
      <el-form-item label="申请状态" prop="status">
        <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
          <el-option v-for="(t, k) in statusOptions" :key="k" :label="t" :value="Number(k)" />
        </el-select>
      </el-form-item>
      <el-form-item label="风险等级" prop="riskLevel">
        <el-select v-model="searchForm.riskLevel" placeholder="请选择风险等级" clearable>
          <el-option v-for="(t, k) in riskLevelOptions" :key="k" :label="t" :value="Number(k)" />
        </el-select>
      </el-form-item>
      <el-form-item label="申请时间" prop="timeRange">
        <el-date-picker
          v-model="searchForm.timeRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
        />
      </el-form-item>
    </CcbSearchForm>

    <div class="ccb-table-toolbar">
      <div class="ccb-table-toolbar-left">
        <el-button type="primary" :icon="Plus" @click="openCreate">
          <span class="ripple-btn" v-ripple>新开户申请</span>
        </el-button>
        <el-button type="success" :icon="Files" @click="goBatch">批量预审</el-button>
        <el-button type="info" :icon="Search" @click="goTrace">开户溯源</el-button>
      </div>
      <div class="ccb-table-toolbar-right">
        <el-text type="info">
          开户申请总数：<el-text type="primary" size="large">{{ total }}</el-text>
        </el-text>
      </div>
    </div>

    <CcbTable
      v-model:page="pageParams.page"
      v-model:pageSize="pageParams.pageSize"
      :loading="loading"
      :data="tableData"
      :total="total"
      :show-selection="true"
      :show-index="true"
      row-class-name="corporate-row"
      @selection-change="handleSelectionChange"
      @change="handlePageChange"
    >
      <el-table-column prop="openingNo" label="申请流水号" width="200" />
      <el-table-column prop="enterpriseName" label="企业名称" width="180" show-overflow-tooltip />
      <el-table-column prop="creditCodeMasked" label="统一社会信用代码" width="200" />
      <el-table-column prop="legalPersonName" label="法人代表" width="100" />
      <el-table-column prop="accountTypeText" label="账户类型" width="140" />
      <el-table-column prop="riskLevel" label="风险等级" width="100">
        <template #default="{ row }">
          <el-tag :type="getRiskType(row.riskLevel)" effect="light" size="small">
            {{ getRiskLabel(row.riskLevel) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="channelText" label="来源渠道" width="100" />
      <el-table-column prop="status" label="状态" width="110">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)" effect="light" size="small">
            {{ getStatusLabel(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="isIsolated" label="隔离" width="70" align="center">
        <template #default="{ row }">
          <el-icon v-if="row.isIsolated" class="isolate-icon"><Warning /></el-icon>
        </template>
      </el-table-column>
      <el-table-column prop="submitterName" label="提交人" width="100" />
      <el-table-column prop="submitOrgName" label="提交机构" width="140" />
      <el-table-column prop="submitTime" label="提交时间" width="160" />
      <el-table-column label="操作" width="280" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleDetail(row)">详情</el-button>
          <el-button
            v-if="row.status === 0 || row.status === 1 || row.status === 2"
            type="warning" link size="small" @click="handleRefresh(row)"
          >刷新</el-button>
          <el-button
            v-if="row.status === 3"
            type="success" link size="small" @click="handleReview(row, 'approve')"
          >复核通过</el-button>
          <el-button
            v-if="row.status === 3"
            type="danger" link size="small" @click="handleReview(row, 'reject')"
          >驳回</el-button>
          <el-button
            v-if="row.status === 4"
            type="primary" link size="small" @click="handleOpenAccount(row)"
          >办理开户</el-button>
          <el-button
            v-if="row.status !== 5 && row.status !== 6 && row.status !== 7 && row.status !== 8"
            type="danger" link size="small" @click="handleCancel(row)"
          >取消</el-button>
        </template>
      </el-table-column>
    </CcbTable>

    <el-dialog
      v-model="showCreate"
      :title="isEditing ? '修改开户信息' : '对公开户申请'"
      width="900px"
      class="corporate-dialog scale-fade-dialog"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-steps :active="currentStep" finish-status="success" align-center class="dialog-steps">
        <el-step title="资质预检" />
        <el-step title="资料录入" />
        <el-step title="开户完成" />
      </el-steps>

      <div v-if="currentStep === 0" class="step-precheck">
        <el-form
          ref="precheckFormRef"
          :model="precheckForm"
          :rules="precheckRules"
          label-width="140px"
          class="ccb-form focus-glow-form"
        >
          <el-alert type="info" :closable="false" class="precheck-alert">
            请先填写企业核心资质信息，系统将自动进行<strong>营业执照有效期、统一社会信用代码、法人实名备案、授权文件</strong>四大前置校验
          </el-alert>
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="企业名称" prop="enterpriseName">
                <el-input v-model="precheckForm.enterpriseName" placeholder="请输入企业全称" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="统一社会信用代码" prop="creditCode">
                <el-input v-model="precheckForm.creditCode" placeholder="请输入18位统一社会信用代码" maxlength="18" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="法人代表姓名" prop="legalPersonName">
                <el-input v-model="precheckForm.legalPersonName" placeholder="请输入法人代表姓名" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="法人代表身份证" prop="legalPersonIdCard">
                <el-input v-model="precheckForm.legalPersonIdCard" placeholder="请输入18位身份证号" maxlength="18" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="营业执照有效期" prop="licenseValidTo">
                <el-date-picker
                  v-model="precheckForm.licenseValidTo"
                  type="date"
                  placeholder="请选择有效期至"
                  value-format="YYYY-MM-DD"
                  style="width: 70%"
                />
                <el-checkbox v-model="precheckForm.licensePermanent" style="margin-left: 8px">长期有效</el-checkbox>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="法人实名备案" prop="legalPersonVerified">
                <el-radio-group v-model="precheckForm.legalPersonVerified">
                  <el-radio :value="1" border>已备案</el-radio>
                  <el-radio :value="0" border>未备案</el-radio>
                  <el-radio :value="2" border>待核验</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="授权文件" prop="authFileUploaded">
                <el-radio-group v-model="precheckForm.authFileUploaded">
                  <el-radio :value="1" border>已上传</el-radio>
                  <el-radio :value="0" border>未上传</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="来源渠道" prop="channelCode">
                <el-select v-model="precheckForm.channelCode" placeholder="请选择渠道">
                  <el-option label="柜面" value="counter" />
                  <el-option label="手机银行" value="mobile" />
                  <el-option label="网上银行" value="ebank" />
                  <el-option label="智慧柜员" value="smart" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>

        <div v-if="precheckResult" class="precheck-result">
          <el-alert
            :title="precheckResult.passed ? '前置校验通过' : ('前置校验未通过：' + (precheckResult.blockedReason || ''))"
            :type="precheckResult.passed ? 'success' : 'error'"
            :closable="false"
            show-icon
            class="precheck-summary"
          />
          <div class="precheck-score">
            <div>综合评分</div>
            <div class="score-num" :class="{ low: precheckResult.overallScore < 60 }">
              {{ precheckResult.overallScore }}
            </div>
          </div>
          <div class="precheck-items">
            <div
              v-for="(item, i) in precheckResult.items"
              :key="i"
              class="precheck-item"
              :class="item.level"
            >
              <el-icon><CircleCheckFilled v-if="item.passed" /><CircleCloseFilled v-else /></el-icon>
              <span class="item-msg">{{ item.message }}</span>
            </div>
          </div>
          <div v-if="precheckResult.riskLevel > 0" class="precheck-risk">
            <el-tag :type="getRiskType(precheckResult.riskLevel)" effect="dark">
              风险等级：{{ getRiskLabel(precheckResult.riskLevel) }}
            </el-tag>
            <el-tag
              v-for="tag in precheckResult.riskTags"
              :key="tag"
              type="warning"
              effect="light"
              style="margin-left: 6px"
            >
              {{ tag }}
            </el-tag>
          </div>
        </div>
      </div>

      <div v-if="currentStep === 1" class="step-filling">
        <el-form
          ref="fillingFormRef"
          :model="fillingForm"
          :rules="fillingRules"
          label-width="140px"
          class="ccb-form focus-glow-form"
        >
          <el-alert v-if="corpAccountTypeConfig" type="info" :closable="false" class="type-alert">
            <strong>{{ CorpAccountTypeText[fillingForm.accountType] }}</strong>：{{ corpAccountTypeConfig.description }}
            <el-divider direction="vertical" />
            单笔限额：<el-tag size="small">{{ formatMoney(corpAccountTypeConfig.singleLimit) }}</el-tag>
            日累计限额：<el-tag size="small">{{ formatMoney(corpAccountTypeConfig.dailyLimit) }}</el-tag>
            年累计限额：<el-tag size="small">{{ formatMoney(corpAccountTypeConfig.yearlyLimit) }}</el-tag>
            年费：<el-tag size="small">{{ corpAccountTypeConfig.annualFee }}元/年</el-tag>
            审批层级：<el-tag size="small" type="warning">{{ ApprovalLevelText[corpAccountTypeConfig.approvalLevel] }}</el-tag>
          </el-alert>

          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="账户类型" prop="accountType">
                <el-radio-group v-model="fillingForm.accountType" @change="handleAccountTypeChange">
                  <el-radio :value="1" border>基本存款账户</el-radio>
                  <el-radio :value="2" border>一般存款账户</el-radio>
                  <el-radio :value="3" border>专用存款账户</el-radio>
                  <el-radio :value="4" border>临时存款账户</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="开户银行" prop="openOrgId">
                <el-select v-model="fillingForm.openOrgId" placeholder="请选择开户银行">
                  <el-option label="总行营业部" value="HQ001" />
                  <el-option label="北京分行" value="BJ001" />
                  <el-option label="上海分行" value="SH001" />
                  <el-option label="深圳分行" value="SZ001" />
                </el-select>
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="企业类型" prop="enterpriseType">
                <el-select v-model="fillingForm.enterpriseType" placeholder="请选择企业类型">
                  <el-option label="国有企业" value="state_owned" />
                  <el-option label="民营企业" value="private" />
                  <el-option label="外资企业" value="foreign" />
                  <el-option label="合资企业" value="joint_venture" />
                  <el-option label="个体工商户" value="individual" />
                  <el-option label="事业单位" value="institution" />
                  <el-option label="社会团体" value="social_org" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="行业类别" prop="industryType">
                <el-select v-model="fillingForm.industryType" placeholder="请选择行业类别">
                  <el-option label="制造业" value="manufacturing" />
                  <el-option label="建筑业" value="construction" />
                  <el-option label="批发零售业" value="wholesale" />
                  <el-option label="信息技术服务业" value="it_service" />
                  <el-option label="金融业" value="finance" />
                  <el-option label="教育业" value="education" />
                  <el-option label="医疗健康" value="healthcare" />
                  <el-option label="其他" value="other" />
                </el-select>
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="注册资本(万元)" prop="registeredCapital">
                <el-input-number v-model="fillingForm.registeredCapital" :min="0" :precision="2" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="成立日期" prop="establishDate">
                <el-date-picker
                  v-model="fillingForm.establishDate"
                  type="date"
                  placeholder="请选择成立日期"
                  value-format="YYYY-MM-DD"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>

            <el-col :span="24">
              <el-form-item label="注册地址" prop="registeredAddress">
                <el-input v-model="fillingForm.registeredAddress" placeholder="请输入注册地址" />
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="经营地址" prop="businessAddress">
                <el-input v-model="fillingForm.businessAddress" placeholder="请输入实际经营地址" />
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="联系电话" prop="contactPhone">
                <el-input v-model="fillingForm.contactPhone" placeholder="请输入企业联系电话" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="经办人姓名" prop="handlerName">
                <el-input v-model="fillingForm.handlerName" placeholder="请输入经办人姓名" />
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="经办人身份证" prop="handlerIdCard">
                <el-input v-model="fillingForm.handlerIdCard" placeholder="请输入经办人身份证号" maxlength="18" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="经办人手机号" prop="handlerMobile">
                <el-input v-model="fillingForm.handlerMobile" placeholder="请输入经办人手机号" maxlength="11" />
              </el-form-item>
            </el-col>

            <el-col :span="12" v-if="corpAccountTypeConfig">
              <el-form-item label="功能权限" prop="permissions">
                <el-checkbox-group v-model="fillingForm.permissions">
                  <el-checkbox
                    v-for="perm in corpAccountTypeConfig.permissions"
                    :key="perm.value"
                    :label="perm.value"
                    :disabled="perm.required"
                  >
                    {{ perm.label }}
                    <el-tag v-if="perm.required" size="small" type="danger" effect="plain">必选</el-tag>
                  </el-checkbox>
                </el-checkbox-group>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="开户用途" prop="openPurpose">
                <el-select v-model="fillingForm.openPurpose" placeholder="请选择开户用途" style="width: 100%">
                  <el-option label="日常经营结算" value="daily_settlement" />
                  <el-option label="专项资金管理" value="special_fund" />
                  <el-option label="项目资金结算" value="project_settlement" />
                  <el-option label="税费缴纳" value="tax_payment" />
                  <el-option label="投融资用途" value="investment" />
                  <el-option label="临时经营活动" value="temporary" />
                  <el-option label="其他" value="other" />
                </el-select>
              </el-form-item>
            </el-col>

            <el-col :span="24">
              <el-form-item label="影像资料" prop="imageUrls">
                <el-input
                  v-model="fillingForm.imageUrls"
                  placeholder="请输入影像资料URL（逗号分隔：营业执照,法人身份证正面,法人身份证反面,授权书,公章印鉴）"
                  type="textarea"
                  :rows="2"
                />
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="备注" prop="remark">
                <el-input v-model="fillingForm.remark" placeholder="请输入备注（选填）" type="textarea" :rows="2" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>

      <div v-if="currentStep === 2" class="step-success">
        <el-result icon="success" title="对公开户申请提交成功" :sub-title="`申请流水号：${submittedOpeningNo}`">
          <template #extra>
            <el-button type="primary" @click="handleGoTrace">查看开户溯源</el-button>
            <el-button @click="closeDialog">关闭</el-button>
          </template>
        </el-result>
      </div>

      <template #footer>
        <el-button v-if="currentStep > 0 && currentStep < 2" @click="prevStep">上一步</el-button>
        <el-button
          v-if="currentStep < 2"
          type="primary"
          :disabled="submitting || nextDisabled || submitLocked"
          :loading="prechecking || submitting"
          class="ripple-btn"
          v-ripple
          @click="handleNext"
        >
          {{ currentStep === 0 ? '开始预检' : (currentStep === 1 ? '提交申请' : '完成') }}
        </el-button>
        <el-button @click="handleCancelDialog" :disabled="submitLocked">{{ currentStep === 2 ? '关闭' : '取消' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Files, Search, Warning, CircleCheckFilled, CircleCloseFilled, OfficeBuilding } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import {
  getOpeningListApi, createOpeningApi, updateOpeningApi, cancelOpeningApi,
  reviewOpeningApi, openAccountApi, refreshOpeningApi,
  type AccountOpening, RiskLevelText
} from '@api/account'

const router = useRouter()
const loading = ref<boolean>(false)
const tableData = ref<AccountOpening[]>([])
const total = ref<number>(0)
const selectedRows = ref<AccountOpening[]>([])

const searchForm = reactive({
  openingNo: '',
  enterpriseName: '',
  creditCode: '',
  accountType: null as number | null,
  status: null as number | null,
  riskLevel: null as number | null,
  channelCode: '',
  timeRange: [] as string[]
})

const pageParams = reactive({
  page: 1,
  pageSize: 10
})

const statusOptions: Record<number, string> = {
  0: '待预检',
  1: '预检通过待录入',
  2: '录入中',
  3: '待复核',
  4: '复核通过待开户',
  5: '已开户',
  6: '已驳回',
  7: '已取消',
  8: '已拒绝'
}
const riskLevelOptions = RiskLevelText

enum CorpAccountType {
  BASIC = 1,
  GENERAL = 2,
  SPECIAL = 3,
  TEMPORARY = 4
}

const CorpAccountTypeText: Record<number, string> = {
  1: '基本存款账户',
  2: '一般存款账户',
  3: '专用存款账户',
  4: '临时存款账户'
}

const ApprovalLevelText: Record<number, string> = {
  1: '一级审批（网点主管）',
  2: '二级审批（支行行长）',
  3: '三级审批（分行行长）',
  4: '四级审批（总行审批）'
}

interface CorpPermission {
  value: string
  label: string
  required: boolean
}

const CorpAccountTypeConfig: Record<number, {
  dailyLimit: number
  singleLimit: number
  yearlyLimit: number
  annualFee: number
  permissions: CorpPermission[]
  approvalLevel: number
  description: string
}> = {
  1: {
    dailyLimit: 50000000,
    singleLimit: 10000000,
    yearlyLimit: 1000000000,
    annualFee: 500,
    approvalLevel: 2,
    permissions: [
      { value: 'transfer_in', label: '转账存入', required: true },
      { value: 'transfer_out', label: '转账转出', required: true },
      { value: 'cash_deposit', label: '现金存入', required: true },
      { value: 'cash_withdraw', label: '现金支取', required: true },
      { value: 'salary_pay', label: '代发工资', required: true },
      { value: 'tax_pay', label: '税费缴纳', required: false },
      { value: 'online_banking', label: '企业网银', required: false },
      { value: 'mobile_banking', label: '企业手机银行', required: false },
      { value: 'investment', label: '投资理财', required: false }
    ],
    description: '企业主办账户，办理日常经营活动的资金收付及其工资、奖金和现金的支取，一个企业只能开立一个'
  },
  2: {
    dailyLimit: 30000000,
    singleLimit: 5000000,
    yearlyLimit: 500000000,
    annualFee: 300,
    approvalLevel: 1,
    permissions: [
      { value: 'transfer_in', label: '转账存入', required: true },
      { value: 'transfer_out', label: '转账转出', required: true },
      { value: 'cash_deposit', label: '现金存入', required: true },
      { value: 'cash_withdraw', label: '现金支取', required: false },
      { value: 'loan_repay', label: '贷款归还', required: false },
      { value: 'online_banking', label: '企业网银', required: false },
      { value: 'mobile_banking', label: '企业手机银行', required: false }
    ],
    description: '用于办理借款转存、借款归还和其他结算的资金收付，可办理现金缴存，但不得办理现金支取'
  },
  3: {
    dailyLimit: 20000000,
    singleLimit: 5000000,
    yearlyLimit: 300000000,
    annualFee: 400,
    approvalLevel: 3,
    permissions: [
      { value: 'transfer_in', label: '转账存入', required: true },
      { value: 'transfer_out', label: '转账转出', required: true },
      { value: 'cash_deposit', label: '现金存入', required: false },
      { value: 'cash_withdraw', label: '现金支取', required: false },
      { value: 'online_banking', label: '企业网银', required: false }
    ],
    description: '对其特定用途资金进行专项管理和使用而开立，如基本建设资金、更新改造资金、财政预算外资金等'
  },
  4: {
    dailyLimit: 10000000,
    singleLimit: 2000000,
    yearlyLimit: 50000000,
    annualFee: 200,
    approvalLevel: 2,
    permissions: [
      { value: 'transfer_in', label: '转账存入', required: true },
      { value: 'transfer_out', label: '转账转出', required: true },
      { value: 'cash_deposit', label: '现金存入', required: false },
      { value: 'cash_withdraw', label: '现金支取', required: false }
    ],
    description: '因临时需要并在规定期限内使用而开立，有效期最长不得超过2年，如设立临时机构、异地临时经营活动等'
  }
}

const showCreate = ref(false)
const isEditing = ref(false)
const currentStep = ref(0)
const prechecking = ref(false)
const submitting = ref(false)
const submitLocked = ref(false)
const submittedOpeningNo = ref('')
const precheckResult = ref<any>(null)
const precheckFormRef = ref<FormInstance>()
const fillingFormRef = ref<FormInstance>()

interface PrecheckForm {
  enterpriseName: string
  creditCode: string
  legalPersonName: string
  legalPersonIdCard: string
  licenseValidTo: string
  licensePermanent: number
  legalPersonVerified: number
  authFileUploaded: number
  channelCode: string
}

const precheckForm = reactive<PrecheckForm>({
  enterpriseName: '',
  creditCode: '',
  legalPersonName: '',
  legalPersonIdCard: '',
  licenseValidTo: '',
  licensePermanent: 0,
  legalPersonVerified: 2,
  authFileUploaded: 0,
  channelCode: 'counter'
})

const enterpriseRealNameCache = reactive<PrecheckForm>({
  enterpriseName: '',
  creditCode: '',
  legalPersonName: '',
  legalPersonIdCard: '',
  licenseValidTo: '',
  licensePermanent: 0,
  legalPersonVerified: 2,
  authFileUploaded: 0,
  channelCode: 'counter'
})

interface FillingForm {
  accountType: number
  enterpriseName: string
  creditCode: string
  legalPersonName: string
  legalPersonIdCard: string
  openOrgId: string
  enterpriseType: string
  industryType: string
  registeredCapital: number
  establishDate: string
  registeredAddress: string
  businessAddress: string
  contactPhone: string
  handlerName: string
  handlerIdCard: string
  handlerMobile: string
  permissions: string[]
  openPurpose: string
  imageUrls: string
  channelCode: string
  remark: string
}

const fillingForm = reactive<FillingForm>({
  accountType: 1,
  enterpriseName: '',
  creditCode: '',
  legalPersonName: '',
  legalPersonIdCard: '',
  openOrgId: '',
  enterpriseType: '',
  industryType: '',
  registeredCapital: 0,
  establishDate: '',
  registeredAddress: '',
  businessAddress: '',
  contactPhone: '',
  handlerName: '',
  handlerIdCard: '',
  handlerMobile: '',
  permissions: [],
  openPurpose: '',
  imageUrls: '',
  channelCode: 'counter',
  remark: ''
})

const precheckRules: FormRules = {
  enterpriseName: [{ required: true, message: '请输入企业名称', trigger: 'blur' }],
  creditCode: [
    { required: true, message: '请输入统一社会信用代码', trigger: 'blur' },
    { pattern: /^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/, message: '统一社会信用代码格式不正确', trigger: 'blur' }
  ],
  legalPersonName: [{ required: true, message: '请输入法人代表姓名', trigger: 'blur' }],
  legalPersonIdCard: [
    { required: true, message: '请输入法人代表身份证号', trigger: 'blur' },
    { pattern: /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/, message: '身份证号格式不正确', trigger: 'blur' }
  ],
  licenseValidTo: [
    {
      validator: (_rule: any, value: string, callback: any) => {
        if (precheckForm.licensePermanent === 1) return callback()
        if (!value) return callback(new Error('请选择营业执照有效期'))
        callback()
      },
      trigger: 'change'
    }
  ],
  legalPersonVerified: [{ required: true, message: '请选择法人实名备案状态', trigger: 'change' }],
  authFileUploaded: [
    {
      validator: (_rule: any, value: number, callback: any) => {
        if (value !== 1) return callback(new Error('请先上传授权文件'))
        callback()
      },
      trigger: 'change'
    }
  ]
}

const fillingRules: FormRules = {
  accountType: [{ required: true, message: '请选择账户类型', trigger: 'change' }],
  openOrgId: [{ required: true, message: '请选择开户银行', trigger: 'change' }],
  enterpriseType: [{ required: true, message: '请选择企业类型', trigger: 'change' }],
  industryType: [{ required: true, message: '请选择行业类别', trigger: 'change' }],
  registeredAddress: [{ required: true, message: '请输入注册地址', trigger: 'blur' }],
  businessAddress: [{ required: true, message: '请输入经营地址', trigger: 'blur' }],
  contactPhone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }],
  handlerName: [{ required: true, message: '请输入经办人姓名', trigger: 'blur' }],
  handlerIdCard: [
    { required: true, message: '请输入经办人身份证号', trigger: 'blur' },
    { pattern: /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/, message: '身份证号格式不正确', trigger: 'blur' }
  ],
  handlerMobile: [
    { required: true, message: '请输入经办人手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ],
  openPurpose: [{ required: true, message: '请选择开户用途', trigger: 'change' }],
  permissions: [
    {
      validator: (_rule: any, value: string[], callback: any) => {
        if (!value || value.length === 0) return callback(new Error('请至少选择一项功能权限'))
        callback()
      },
      trigger: 'change'
    }
  ]
}

const corpAccountTypeConfig = computed(() => CorpAccountTypeConfig[fillingForm.accountType] || null)
const nextDisabled = computed(() => {
  if (currentStep.value === 0 && !precheckResult.value) return true
  if (currentStep.value === 0 && precheckResult.value && !precheckResult.value.passed) return true
  return false
})

const formatMoney = (v: number): string => {
  return '¥' + v.toLocaleString('zh-CN')
}

const getRiskType = (level: number): string => {
  if (level === 0) return 'success'
  if (level <= 2) return 'info'
  if (level === 3) return 'warning'
  return 'danger'
}

const getRiskLabel = (level: number): string => RiskLevelText[level] || '未知'

const getStatusType = (s: number): string => {
  if (s === 5) return 'success'
  if (s === 3 || s === 4) return 'warning'
  if (s === 6 || s === 8) return 'danger'
  if (s === 7) return 'info'
  return 'primary'
}

const getStatusLabel = (s: number): string => statusOptions[s] || '未知'

const fetchData = async () => {
  loading.value = true
  try {
    const params: any = {
      page: pageParams.page,
      pageSize: pageParams.pageSize,
      keyword: searchForm.enterpriseName || searchForm.creditCode || searchForm.openingNo || undefined,
      openingNo: searchForm.openingNo || undefined,
      accountType: searchForm.accountType ?? undefined,
      status: searchForm.status ?? undefined,
      riskLevel: searchForm.riskLevel ?? undefined,
      startTime: searchForm.timeRange?.[0],
      endTime: searchForm.timeRange?.[1]
    }
    const res = await getOpeningListApi(params)
    tableData.value = res.list || []
    total.value = res.total || 0
  } catch (e: any) {
    ElMessage.error(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => { pageParams.page = 1; fetchData() }
const handleReset = () => { pageParams.page = 1; fetchData() }
const handlePageChange = () => fetchData()
const handleSelectionChange = (val: unknown[]) => { selectedRows.value = val as AccountOpening[] }
const goBatch = () => router.push('/business/corporate/batch')
const goTrace = () => router.push('/business/corporate/trace')

const initRequiredPermissions = () => {
  const config = CorpAccountTypeConfig[fillingForm.accountType]
  if (config) {
    const requiredPerms = config.permissions.filter(p => p.required).map(p => p.value)
    fillingForm.permissions = [...requiredPerms]
  }
}

const handleAccountTypeChange = () => {
  initRequiredPermissions()
}

const openCreate = () => {
  isEditing.value = false
  currentStep.value = 0
  precheckResult.value = null
  submittedOpeningNo.value = ''
  submitLocked.value = false
  Object.assign(precheckForm, {
    enterpriseName: '', creditCode: '', legalPersonName: '', legalPersonIdCard: '',
    licenseValidTo: '', licensePermanent: 0, legalPersonVerified: 2, authFileUploaded: 0, channelCode: 'counter'
  })
  Object.assign(enterpriseRealNameCache, {
    enterpriseName: '', creditCode: '', legalPersonName: '', legalPersonIdCard: '',
    licenseValidTo: '', licensePermanent: 0, legalPersonVerified: 2, authFileUploaded: 0, channelCode: 'counter'
  })
  Object.assign(fillingForm, {
    accountType: 1, enterpriseName: '', creditCode: '', legalPersonName: '', legalPersonIdCard: '',
    openOrgId: '', enterpriseType: '', industryType: '', registeredCapital: 0, establishDate: '',
    registeredAddress: '', businessAddress: '', contactPhone: '', handlerName: '', handlerIdCard: '',
    handlerMobile: '', permissions: [], openPurpose: '', imageUrls: '', channelCode: 'counter', remark: ''
  })
  initRequiredPermissions()
  showCreate.value = true
  nextTick(() => {
    precheckFormRef.value?.clearValidate()
    fillingFormRef.value?.clearValidate()
  })
}

const closeDialog = () => {
  showCreate.value = false
  fetchData()
}

const handleCancelDialog = () => {
  Object.assign(precheckForm, {
    ...enterpriseRealNameCache
  })
  Object.assign(fillingForm, {
    accountType: 1,
    enterpriseName: enterpriseRealNameCache.enterpriseName,
    creditCode: enterpriseRealNameCache.creditCode,
    legalPersonName: enterpriseRealNameCache.legalPersonName,
    legalPersonIdCard: enterpriseRealNameCache.legalPersonIdCard,
    openOrgId: '',
    enterpriseType: '',
    industryType: '',
    registeredCapital: 0,
    establishDate: '',
    registeredAddress: '',
    businessAddress: '',
    contactPhone: '',
    handlerName: '',
    handlerIdCard: '',
    handlerMobile: '',
    permissions: [],
    openPurpose: '',
    imageUrls: '',
    channelCode: enterpriseRealNameCache.channelCode,
    remark: ''
  })
  initRequiredPermissions()
  closeDialog()
}

const triggerShake = async () => {
  const dialog = document.querySelector('.corporate-dialog .el-dialog__body')
  if (dialog) {
    dialog.classList.add('shake-error')
    setTimeout(() => dialog.classList.remove('shake-error'), 400)
  }
}

const validateCreditCode = (code: string): { passed: boolean; message: string } => {
  const pattern = /^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/
  if (!pattern.test(code)) {
    return { passed: false, message: '统一社会信用代码格式校验不通过' }
  }
  const weights = [1, 3, 9, 27, 19, 26, 16, 17, 20, 29, 25, 13, 8, 24, 10, 30, 28]
  const chars = '0123456789ABCDEFGHJKLMNPQRTUWXY'
  let sum = 0
  for (let i = 0; i < 17; i++) {
    sum += chars.indexOf(code[i]) * weights[i]
  }
  const checkCode = 31 - (sum % 31)
  const expected = checkCode === 31 ? '0' : chars[checkCode]
  if (code[17] !== expected) {
    return { passed: false, message: '统一社会信用代码校验码不匹配' }
  }
  return { passed: true, message: '统一社会信用代码校验通过' }
}

const validateLicenseValid = (): { passed: boolean; message: string } => {
  if (precheckForm.licensePermanent === 1) {
    return { passed: true, message: '营业执照长期有效' }
  }
  if (!precheckForm.licenseValidTo) {
    return { passed: false, message: '营业执照有效期未填写' }
  }
  const validDate = new Date(precheckForm.licenseValidTo)
  const today = new Date()
  const diffDays = Math.floor((validDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) {
    return { passed: false, message: `营业执照已过期${Math.abs(diffDays)}天` }
  }
  if (diffDays < 30) {
    return { passed: false, message: `营业执照剩余有效期不足30天（仅剩${diffDays}天）` }
  }
  return { passed: true, message: `营业执照有效期充足（剩余${diffDays}天）` }
}

const validateLegalPersonVerified = (): { passed: boolean; message: string } => {
  if (precheckForm.legalPersonVerified === 1) {
    return { passed: true, message: '法人已完成人民银行实名备案' }
  }
  if (precheckForm.legalPersonVerified === 0) {
    return { passed: false, message: '法人尚未完成实名备案，请先至人行系统完成备案' }
  }
  return { passed: false, message: '法人实名备案状态待核验，需人工复核确认' }
}

const validateAuthFile = (): { passed: boolean; message: string } => {
  if (precheckForm.authFileUploaded === 1) {
    return { passed: true, message: '授权文件已上传并完成验真' }
  }
  return { passed: false, message: '授权文件未上传，请上传加盖公章的授权委托书及经办人身份证明' }
}

const mockPrecheck = async () => {
  await new Promise(resolve => setTimeout(resolve, 1200))
  const items = [
    {
      field: 'licenseValidTo',
      ...validateLicenseValid(),
      level: validateLicenseValid().passed ? 'success' : 'error'
    },
    {
      field: 'creditCode',
      ...validateCreditCode(precheckForm.creditCode),
      level: validateCreditCode(precheckForm.creditCode).passed ? 'success' : 'error'
    },
    {
      field: 'legalPersonVerified',
      ...validateLegalPersonVerified(),
      level: validateLegalPersonVerified().passed ? 'success' : (precheckForm.legalPersonVerified === 2 ? 'warning' : 'error')
    },
    {
      field: 'authFileUploaded',
      ...validateAuthFile(),
      level: validateAuthFile().passed ? 'success' : 'error'
    }
  ]
  const passedCount = items.filter(i => i.passed).length
  const hasBlockingError = items.some(i => !i.passed && i.level === 'error')
  const overallScore = Math.round((passedCount / items.length) * 100)
  const riskTags: string[] = []
  let riskLevel = 0
  if (!validateCreditCode(precheckForm.creditCode).passed) {
    riskTags.push('信用代码异常')
    riskLevel = Math.max(riskLevel, 4)
  }
  if (!validateLicenseValid().passed) {
    riskTags.push('资质过期风险')
    riskLevel = Math.max(riskLevel, 3)
  }
  if (precheckForm.legalPersonVerified === 2) {
    riskTags.push('待人工核验')
    riskLevel = Math.max(riskLevel, 2)
  }
  return {
    passed: !hasBlockingError,
    overallScore,
    items,
    riskLevel,
    riskTags,
    customerExists: false,
    requireManualReview: riskLevel >= 2,
    blockedReason: hasBlockingError ? items.find(i => !i.passed && i.level === 'error')?.message : undefined
  }
}

const handleNext = async () => {
  if (submitLocked.value) return
  submitLocked.value = true
  setTimeout(() => { submitLocked.value = false }, 300)

  if (currentStep.value === 0) {
    try {
      await precheckFormRef.value?.validate()
    } catch (e) {
      triggerShake()
      ElMessage.error('请填写完整企业资质信息')
      return
    }
    prechecking.value = true
    try {
      precheckResult.value = await mockPrecheck()
      Object.assign(enterpriseRealNameCache, { ...precheckForm })
      if (!precheckResult.value.passed) {
        triggerShake()
        ElMessage.error('前置校验未通过，无法进入下一步')
      } else {
        fillingForm.enterpriseName = precheckForm.enterpriseName
        fillingForm.creditCode = precheckForm.creditCode
        fillingForm.legalPersonName = precheckForm.legalPersonName
        fillingForm.legalPersonIdCard = precheckForm.legalPersonIdCard
        fillingForm.channelCode = precheckForm.channelCode
        if (precheckResult.value.customerExists) {
          ElMessage.success('已匹配存量企业客户信息')
        }
        currentStep.value = 1
      }
    } catch (e: any) {
      triggerShake()
      ElMessage.error(e.message || '预检失败')
    } finally {
      prechecking.value = false
    }
  } else if (currentStep.value === 1) {
    try {
      await fillingFormRef.value?.validate()
    } catch (e) {
      triggerShake()
      ElMessage.error('请完善开户资料')
      return
    }
    submitting.value = true
    try {
      const payload: any = {
        ...fillingForm,
        licenseValidFrom: undefined,
        licenseValidTo: precheckForm.licensePermanent ? undefined : precheckForm.licenseValidTo,
        licensePermanent: precheckForm.licensePermanent,
        legalPersonVerified: precheckForm.legalPersonVerified,
        authFileUploaded: precheckForm.authFileUploaded,
        corporate: true
      }
      const created = await createOpeningApi(payload)
      submittedOpeningNo.value = created.openingNo
      currentStep.value = 2
      ElMessage.success('对公开户申请提交成功')
    } catch (e: any) {
      triggerShake()
      ElMessage.error(e.message || '提交失败')
    } finally {
      submitting.value = false
    }
  }
}

const prevStep = () => {
  if (currentStep.value > 0) currentStep.value--
}

const handleGoTrace = () => {
  closeDialog()
  router.push('/business/corporate/trace')
}

const handleDetail = (row: AccountOpening) => {
  ElMessage.info(`查看申请详情：${row.openingNo}`)
}

const handleRefresh = async (row: AccountOpening) => {
  try {
    await refreshOpeningApi(row.id)
    ElMessage.success('刷新成功')
    fetchData()
  } catch (e: any) {
    ElMessage.error(e.message || '刷新失败')
  }
}

const handleReview = async (row: AccountOpening, operation: 'approve' | 'reject') => {
  const title = operation === 'approve' ? '复核通过' : '驳回'
  try {
    const reason = operation === 'reject'
      ? (await ElMessageBox.prompt(`请输入${title}原因`, title, { confirmButtonText: '确定', cancelButtonText: '取消' })).value
      : undefined
    await reviewOpeningApi(row.id, operation, reason)
    ElMessage.success(`${title}成功`)
    fetchData()
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error(e.message || '操作失败')
  }
}

const handleOpenAccount = async (row: AccountOpening) => {
  try {
    await ElMessageBox.confirm(`确认对申请 ${row.openingNo} 办理开户？`, '确认', {
      type: 'warning'
    })
    const res = await openAccountApi(row.id)
    ElMessage.success(`开户成功，账户号：${res.accountNo}`)
    fetchData()
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error(e.message || '开户失败')
  }
}

const handleCancel = async (row: AccountOpening) => {
  try {
    const remark = (await ElMessageBox.prompt(`请输入取消原因（选填）`, '取消申请', {
      confirmButtonText: '确定', cancelButtonText: '取消', inputPattern: /.*/
    })).value
    await cancelOpeningApi(row.id, remark)
    ElMessage.success('已取消')
    fetchData()
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error(e.message || '操作失败')
  }
}

onMounted(() => fetchData())
</script>

<style lang="scss" scoped>
.ccb-business-corporate {
  :deep(.corporate-row) {
    transition: box-shadow 0.3s ease, transform 0.3s ease;
    cursor: pointer;
    &:hover {
      box-shadow: 0 4px 16px rgba(23, 85, 163, 0.15);
      transform: translateY(-1px);
      background-color: rgba(23, 85, 163, 0.02);
    }
  }
  .isolate-icon { color: #f56c6c; font-size: 16px; }
  .dialog-steps { margin-bottom: 24px; }
  .precheck-alert { margin-bottom: 20px; }
  .type-alert { margin-bottom: 20px; }
  .precheck-result { margin-top: 16px; }
  .precheck-summary { margin-bottom: 12px; }
  .precheck-score {
    display: flex; align-items: center; gap: 12px;
    padding: 12px 16px; background: #f8fafc; border-radius: 6px; margin-bottom: 12px;
    .score-num {
      font-size: 28px; font-weight: 700; color: #1755a3;
      &.low { color: #f56c6c; }
    }
  }
  .precheck-items { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
  .precheck-item {
    display: flex; align-items: center; gap: 8px;
    padding: 8px 12px; border-radius: 4px; font-size: 13px;
    &.error { background: #fef0f0; color: #f56c6c; }
    &.warning { background: #fdf6ec; color: #e6a23c; }
    &.info { background: #ecf5ff; color: #1755a3; }
    &:not(.error):not(.warning):not(.info) { background: #f0f9eb; color: #67c23a; }
    .item-msg { flex: 1; }
  }
  .precheck-risk { display: flex; align-items: center; flex-wrap: wrap; padding: 10px; background: #fff6db; border-radius: 4px; }
  .step-filling { }
  .step-success { min-height: 260px; }
  .ripple-btn { position: relative; overflow: hidden; }

  :deep(.focus-glow-form) {
    .el-input__wrapper,
    .el-textarea__inner,
    .el-select__wrapper,
    .el-date-editor.el-input,
    .el-date-editor.el-input__wrapper,
    .el-input-number {
      transition: box-shadow 0.3s ease, border-color 0.3s ease;
    }
    .el-input__wrapper.is-focus,
    .el-input__wrapper:focus-within {
      box-shadow: 0 0 0 2px rgba(23, 85, 163, 0.25), 0 0 12px rgba(23, 85, 163, 0.15) !important;
      border-color: #1755a3 !important;
    }
    .el-textarea__inner:focus {
      box-shadow: 0 0 0 2px rgba(23, 85, 163, 0.25), 0 0 12px rgba(23, 85, 163, 0.15) !important;
      border-color: #1755a3 !important;
    }
    .el-select__wrapper.is-focused,
    .el-select__wrapper:focus-within {
      box-shadow: 0 0 0 2px rgba(23, 85, 163, 0.25), 0 0 12px rgba(23, 85, 163, 0.15) !important;
      border-color: #1755a3 !important;
    }
    .el-date-editor.el-input.is-active .el-input__wrapper,
    .el-date-editor.el-input__wrapper.is-focus {
      box-shadow: 0 0 0 2px rgba(23, 85, 163, 0.25), 0 0 12px rgba(23, 85, 163, 0.15) !important;
    }
    .el-input-number.is-focus .el-input__wrapper {
      box-shadow: 0 0 0 2px rgba(23, 85, 163, 0.25), 0 0 12px rgba(23, 85, 163, 0.15) !important;
    }
    .el-radio-button__inner {
      transition: all 0.25s ease;
    }
    .el-radio-button__original-radio:checked + .el-radio-button__inner {
      box-shadow: 0 0 8px rgba(23, 85, 163, 0.4);
    }
    .el-checkbox__inner {
      transition: all 0.25s ease;
    }
    .el-checkbox__input.is-checked .el-checkbox__inner {
      box-shadow: 0 0 6px rgba(23, 85, 163, 0.4);
    }
  }

  :deep(.scale-fade-dialog) {
    .el-dialog {
      animation: dialogScaleFadeIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
      transform-origin: center center;
    }
    .v-enter-active .el-dialog,
    .v-leave-active .el-dialog {
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .v-enter-from .el-dialog {
      opacity: 0;
      transform: scale(0.7);
    }
    .v-leave-to .el-dialog {
      opacity: 0;
      transform: scale(0.85);
    }
  }

  @keyframes dialogScaleFadeIn {
    0% {
      opacity: 0;
      transform: scale(0.6) translateY(20px);
    }
    60% {
      opacity: 0.9;
      transform: scale(1.03) translateY(-2px);
    }
    100% {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  :deep(.shake-error) {
    animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
    border-left: 3px solid #f56c6c;
    background-color: #fef0f0;
  }
  @keyframes shake {
    10%, 90% { transform: translateX(-1px); }
    20%, 80% { transform: translateX(2px); }
    30%, 50%, 70% { transform: translateX(-4px); }
    40%, 60% { transform: translateX(4px); }
  }
}
</style>
