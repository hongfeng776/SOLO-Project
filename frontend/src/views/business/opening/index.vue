<template>
  <div class="ccb-business-opening">
    <CcbPageHeader
      title="个人开户"
      description="个人账户开户申请与管理"
      icon="CreditCard"
    />

    <CcbSearchForm v-model="searchForm" @search="handleSearch" @reset="handleReset">
      <el-form-item label="申请流水号" prop="openingNo">
        <el-input v-model="searchForm.openingNo" placeholder="请输入申请流水号" clearable />
      </el-form-item>
      <el-form-item label="客户姓名" prop="customerName">
        <el-input v-model="searchForm.customerName" placeholder="请输入客户姓名" clearable />
      </el-form-item>
      <el-form-item label="身份证号" prop="idCardNo">
        <el-input v-model="searchForm.idCardNo" placeholder="请输入身份证号" clearable />
      </el-form-item>
      <el-form-item label="账户类型" prop="accountType">
        <el-select v-model="searchForm.accountType" placeholder="请选择账户类型" clearable>
          <el-option label="一类账户" :value="1" />
          <el-option label="二类账户" :value="2" />
          <el-option label="三类账户" :value="3" />
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
          <span class="ripple-btn">新开户申请</span>
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
      row-class-name="opening-row"
      @selection-change="handleSelectionChange"
      @change="handlePageChange"
    >
      <el-table-column prop="openingNo" label="申请流水号" width="200" />
      <el-table-column prop="customerName" label="客户姓名" width="100" />
      <el-table-column prop="idMasked" label="身份证号" width="200" />
      <el-table-column prop="mobileMasked" label="手机号" width="140" />
      <el-table-column prop="accountTypeText" label="账户类型" width="120" />
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
      :title="isEditing ? '修改开户信息' : '个人开户申请'"
      width="860px"
      class="opening-dialog"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-steps :active="currentStep" finish-status="success" align-center class="dialog-steps">
        <el-step title="信息预检" />
        <el-step title="资料录入" />
        <el-step title="开户完成" />
      </el-steps>

      <div v-if="currentStep === 0" class="step-precheck">
        <el-form
          ref="precheckFormRef"
          :model="precheckForm"
          :rules="precheckRules"
          label-width="120px"
          class="ccb-form"
        >
          <el-alert type="info" :closable="false" class="precheck-alert">
            请先填写客户核心实名信息，系统将自动进行身份证有效期、实名完整性、黑名单三大前置校验
          </el-alert>
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="客户姓名" prop="customerName">
                <el-input v-model="precheckForm.customerName" placeholder="请输入客户真实姓名" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="身份证号" prop="idCardNo">
                <el-input v-model="precheckForm.idCardNo" placeholder="请输入18位身份证号" maxlength="18" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="手机号码" prop="mobile">
                <el-input v-model="precheckForm.mobile" placeholder="请输入11位手机号" maxlength="11" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="身份证有效期" prop="idValidTo">
                <el-date-picker
                  v-model="precheckForm.idValidTo"
                  type="date"
                  placeholder="请选择有效期至"
                  value-format="YYYY-MM-DD"
                  style="width: 70%"
                />
                <el-checkbox v-model="precheckForm.idPermanent" style="margin-left: 8px">长期有效</el-checkbox>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="账户类型" prop="accountType">
                <el-radio-group v-model="precheckForm.accountType">
                  <el-radio :value="1" border>一类账户</el-radio>
                  <el-radio :value="2" border>二类账户</el-radio>
                  <el-radio :value="3" border>三类账户</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="来源渠道" prop="channelCode">
                <el-select v-model="precheckForm.channelCode" placeholder="请选择渠道">
                  <el-option label="柜面" value="counter" />
                  <el-option label="手机银行" value="mobile" />
                  <el-option label="网上银行" value="ebank" />
                  <el-option label="自助设备" value="atm" />
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
          label-width="120px"
          class="ccb-form"
        >
          <el-alert v-if="accountTypeConfig" type="info" :closable="false" class="type-alert">
            <strong>{{ AccountTypeText[fillingForm.accountType] }}</strong>：{{ accountTypeConfig.description }}
            <el-divider direction="vertical" />
            单笔限额：<el-tag size="small">{{ formatMoney(accountTypeConfig.singleLimit) }}</el-tag>
            日累计限额：<el-tag size="small">{{ formatMoney(accountTypeConfig.dailyLimit) }}</el-tag>
            年费：<el-tag size="small">{{ accountTypeConfig.annualFee }}元/年</el-tag>
          </el-alert>
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="手机号实名" prop="mobileVerified">
                <el-radio-group v-model="fillingForm.mobileVerified">
                  <el-radio :value="1" border>已实名</el-radio>
                  <el-radio :value="0" border>未实名</el-radio>
                  <el-radio :value="2" border>待核验</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="居住地与开户行属地" prop="regionMatched">
                <el-radio-group v-model="fillingForm.regionMatched">
                  <el-radio :value="1" border>匹配</el-radio>
                  <el-radio :value="0" border>不匹配</el-radio>
                  <el-radio :value="2" border>待核验</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="居住地地址" prop="residentialAddress">
                <el-input v-model="fillingForm.residentialAddress" placeholder="请输入详细居住地地址" type="textarea" :rows="2" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="开户用途" prop="openPurpose">
                <el-select v-model="fillingForm.openPurpose" placeholder="请选择开户用途">
                  <el-option label="工资结算" value="salary" />
                  <el-option label="经营结算" value="business" />
                  <el-option label="投资理财" value="investment" />
                  <el-option label="日常消费" value="consumption" />
                  <el-option label="其他" value="other" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="影像清晰度评分" prop="imageClarityScore">
                <el-slider
                  v-model="fillingForm.imageClarityScore"
                  :min="0"
                  :max="100"
                  :step="5"
                  show-input
                  style="width: 70%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="影像资料" prop="imageUrls">
                <el-input
                  v-model="fillingForm.imageUrls"
                  placeholder="请输入影像资料URL（逗号分隔：身份证正面,身份证反面,人脸照,手持照）"
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
        <el-result icon="success" title="开户申请提交成功" :sub-title="`申请流水号：${submittedOpeningNo}`">
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
          :disabled="submitting || nextDisabled"
          :loading="prechecking || submitting"
          class="ripple-btn"
          @click="handleNext"
        >
          {{ currentStep === 0 ? '开始预检' : (currentStep === 1 ? '提交申请' : '完成') }}
        </el-button>
        <el-button @click="closeDialog">{{ currentStep === 2 ? '关闭' : '取消' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Files, Search, Warning, CircleCheckFilled, CircleCloseFilled } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import {
  getOpeningListApi, createOpeningApi, updateOpeningApi, cancelOpeningApi,
  reviewOpeningApi, openAccountApi, refreshOpeningApi, precheckOpeningApi,
  type AccountOpening, type PrecheckResponse, type PrecheckRequest,
  type AccountOpeningForm, AccountTypeText, AccountTypeConfig,
  AccountOpeningStatusText, RiskLevelText
} from '@api/account'

const router = useRouter()
const loading = ref<boolean>(false)
const tableData = ref<AccountOpening[]>([])
const total = ref<number>(0)
const selectedRows = ref<AccountOpening[]>([])

const searchForm = reactive({
  openingNo: '',
  customerName: '',
  idCardNo: '',
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

const statusOptions = AccountOpeningStatusText
const riskLevelOptions = RiskLevelText

const showCreate = ref(false)
const isEditing = ref(false)
const currentStep = ref(0)
const prechecking = ref(false)
const submitting = ref(false)
const submittedOpeningNo = ref('')
const precheckResult = ref<PrecheckResponse | null>(null)
const precheckFormRef = ref<FormInstance>()
const fillingFormRef = ref<FormInstance>()

const precheckForm = reactive<PrecheckRequest>({
  customerName: '',
  idCardNo: '',
  mobile: '',
  idValidTo: '',
  idPermanent: 0,
  accountType: 1,
  channelCode: 'counter'
})

const fillingForm = reactive<AccountOpeningForm>({
  accountType: 1,
  customerName: '',
  idCardNo: '',
  mobile: '',
  mobileVerified: 2,
  residentialAddress: '',
  regionMatched: 2,
  openPurpose: '',
  imageClarityScore: '85',
  imageUrls: '',
  channelCode: 'counter',
  remark: ''
})

const precheckRules: FormRules = {
  customerName: [{ required: true, message: '请输入客户姓名', trigger: 'blur' }],
  idCardNo: [
    { required: true, message: '请输入身份证号', trigger: 'blur' },
    { pattern: /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/, message: '身份证号格式不正确', trigger: 'blur' }
  ],
  mobile: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ],
  accountType: [{ required: true, message: '请选择账户类型', trigger: 'change' }]
}

const fillingRules: FormRules = {
  mobileVerified: [{ required: true, message: '请选择手机号实名状态', trigger: 'change' }],
  regionMatched: [{ required: true, message: '请选择属地匹配状态', trigger: 'change' }],
  openPurpose: [{ required: true, message: '请选择开户用途', trigger: 'change' }]
}

const accountTypeConfig = computed(() => AccountTypeConfig[fillingForm.accountType] || null)
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

const getStatusLabel = (s: number): string => AccountOpeningStatusText[s] || '未知'

const fetchData = async () => {
  loading.value = true
  try {
    const params: any = {
      page: pageParams.page,
      pageSize: pageParams.pageSize,
      keyword: searchForm.customerName || searchForm.idCardNo || searchForm.openingNo || undefined,
      openingNo: searchForm.openingNo || undefined,
      customerName: searchForm.customerName || undefined,
      idCardNo: searchForm.idCardNo || undefined,
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
const goBatch = () => router.push('/business/opening/batch')
const goTrace = () => router.push('/business/opening/trace')

const openCreate = () => {
  isEditing.value = false
  currentStep.value = 0
  precheckResult.value = null
  submittedOpeningNo.value = ''
  Object.assign(precheckForm, {
    customerName: '', idCardNo: '', mobile: '', idValidTo: '', idPermanent: 0, accountType: 1, channelCode: 'counter'
  })
  Object.assign(fillingForm, {
    accountType: 1, customerName: '', idCardNo: '', mobile: '', mobileVerified: 2,
    residentialAddress: '', regionMatched: 2, openPurpose: '', imageClarityScore: '85',
    imageUrls: '', channelCode: 'counter', remark: ''
  })
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

const triggerShake = async () => {
  const dialog = document.querySelector('.opening-dialog .el-dialog__body')
  if (dialog) {
    dialog.classList.add('shake-error')
    setTimeout(() => dialog.classList.remove('shake-error'), 400)
  }
}

const handleNext = async () => {
  if (currentStep.value === 0) {
    try {
      await precheckFormRef.value?.validate()
    } catch (e) {
      triggerShake()
      ElMessage.error('请填写完整实名信息')
      return
    }
    prechecking.value = true
    try {
      precheckResult.value = await precheckOpeningApi(precheckForm)
      if (!precheckResult.value.passed) {
        triggerShake()
        ElMessage.error('前置校验未通过，无法进入下一步')
      } else {
        fillingForm.customerName = precheckForm.customerName
        fillingForm.idCardNo = precheckForm.idCardNo
        fillingForm.mobile = precheckForm.mobile
        fillingForm.accountType = precheckForm.accountType
        fillingForm.channelCode = precheckForm.channelCode
        if (precheckResult.value.customerExists) {
          ElMessage.success(`已匹配存量客户：${precheckResult.value.customerNo}`)
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
        idType: 1,
        idValidFrom: precheckForm.idValidTo ? undefined : undefined,
        idValidTo: precheckForm.idPermanent ? undefined : precheckForm.idValidTo,
        idPermanent: precheckForm.idPermanent
      }
      const created = await createOpeningApi(payload)
      submittedOpeningNo.value = created.openingNo
      currentStep.value = 2
      ElMessage.success('开户申请提交成功')
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
  router.push('/business/opening/trace')
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
.ccb-business-opening {
  :deep(.opening-row) {
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
