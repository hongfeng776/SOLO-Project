<template>
  <div class="ccb-business-corporate-batch">
    <CcbPageHeader
      title="企业批量材料上传"
      description="按行业类型/注册资本/经营年限差异化校验，支持单条暂停/驳回/通过操作"
      icon="FolderAdd"
    />

    <div class="ccb-table-toolbar">
      <div class="ccb-table-toolbar-left">
        <el-button type="primary" :icon="Upload" @click="openImportDialog">
          <span class="ripple-btn">批量导入</span>
        </el-button>
        <CcbPermissionButton
          type="success"
          :icon="Check"
          :disabled="selectedIds.length === 0"
          :permission="'admin'"
          @click="handleBatchReview('approve')"
        >
          批量通过
        </CcbPermissionButton>
        <el-button
          type="warning"
          :icon="Close"
          :disabled="selectedIds.length === 0"
          @click="handleBatchReview('reject')"
        >
          批量驳回
        </el-button>
        <el-button
          type="info"
          :icon="VideoPause"
          :disabled="selectedIds.length === 0"
          @click="handleBatchReview('pause')"
        >
          批量暂停
        </el-button>
        <el-button
          type="danger"
          :icon="Warning"
          :disabled="selectedIds.length === 0"
          @click="handleBatchReview('isolate')"
        >
          异常隔离
        </el-button>
      </div>
      <div class="ccb-table-toolbar-right">
        <el-tag type="info">高风险：{{ highRiskCount }}</el-tag>
        <el-tag type="warning" style="margin-left: 8px">待审核：{{ pendingCount }}</el-tag>
        <el-tag type="primary" style="margin-left: 8px">已暂停：{{ pausedCount }}</el-tag>
        <el-tag type="danger" style="margin-left: 8px">已隔离：{{ isolatedCount }}</el-tag>
      </div>
    </div>

    <CcbSearchForm v-model="searchForm" @search="handleSearch" @reset="handleReset">
      <el-form-item label="申请流水号" prop="openingNo">
        <el-input v-model="searchForm.openingNo" placeholder="请输入申请流水号" clearable />
      </el-form-item>
      <el-form-item label="企业名称" prop="enterpriseName">
        <el-input v-model="searchForm.enterpriseName" placeholder="请输入企业名称" clearable />
      </el-form-item>
      <el-form-item label="统一社会信用代码" prop="creditCode">
        <el-input v-model="searchForm.creditCode" placeholder="请输入信用代码" clearable />
      </el-form-item>
      <el-form-item label="账户类型" prop="accountType">
        <el-select v-model="searchForm.accountType" placeholder="全部" clearable>
          <el-option v-for="(t, k) in CorporateAccountTypeText" :key="k" :label="t" :value="Number(k)" />
        </el-select>
      </el-form-item>
      <el-form-item label="行业类型" prop="industryType">
        <el-select v-model="searchForm.industryType" placeholder="全部" clearable>
          <el-option v-for="opt in IndustryTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="申请状态" prop="status">
        <el-select v-model="searchForm.status" placeholder="全部" clearable>
          <el-option v-for="(t, k) in statusOptions" :key="k" :label="t" :value="Number(k)" />
        </el-select>
      </el-form-item>
      <el-form-item label="风险等级" prop="riskLevel">
        <el-select v-model="searchForm.riskLevel" placeholder="全部" clearable>
          <el-option v-for="(t, k) in riskOptions" :key="k" :label="t" :value="Number(k)" />
        </el-select>
      </el-form-item>
      <el-form-item label="注册资本(万)" prop="capitalRange">
        <el-select v-model="searchForm.capitalRange" placeholder="全部" clearable>
          <el-option label="100以下" value="lt100" />
          <el-option label="100-500" value="100to500" />
          <el-option label="500-1000" value="500to1000" />
          <el-option label="1000以上" value="gt1000" />
        </el-select>
      </el-form-item>
      <el-form-item label="经营年限" prop="yearsRange">
        <el-select v-model="searchForm.yearsRange" placeholder="全部" clearable>
          <el-option label="1年以下" value="lt1" />
          <el-option label="1-3年" value="1to3" />
          <el-option label="3-5年" value="3to5" />
          <el-option label="5-10年" value="5to10" />
          <el-option label="10年以上" value="gt10" />
        </el-select>
      </el-form-item>
    </CcbSearchForm>

    <CcbTable
      v-model:page="pageParams.page"
      v-model:pageSize="pageParams.pageSize"
      :loading="loading"
      :data="tableData"
      :total="total"
      :show-selection="true"
      :show-index="true"
      stripe
      row-class-name="corporate-batch-row"
      @selection-change="handleSelectionChange"
      @change="handlePageChange"
    >
      <el-table-column prop="openingNo" label="申请流水号" width="200" />
      <el-table-column prop="enterpriseName" label="企业名称" width="200" show-overflow-tooltip />
      <el-table-column prop="creditCode" label="统一社会信用代码" width="200" />
      <el-table-column prop="accountTypeText" label="账户类型" width="130" />
      <el-table-column label="行业类型" width="140">
        <template #default="{ row }">
          <el-tag v-if="getIndustryLabel(row.industryType)" type="info" effect="light" size="small">
            {{ getIndustryLabel(row.industryType) }}
          </el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="注册资本" width="110" align="right">
        <template #default="{ row }">
          <span v-if="row.registeredCapital">{{ formatCapital(row.registeredCapital) }}万</span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="经营年限" width="90" align="center">
        <template #default="{ row }">
          <span v-if="row.businessYears !== undefined">{{ row.businessYears }}年</span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="legalRepresentative" label="法人代表" width="100" />
      <el-table-column label="校验结果" width="260">
        <template #default="{ row }">
          <div class="validation-tags">
            <el-tag
              :type="getIndustryValidationType(row)"
              size="small"
              effect="light"
              style="margin-right: 4px"
            >
              {{ getIndustryValidationLabel(row) }}
            </el-tag>
            <el-tag
              :type="getCapitalValidationType(row)"
              size="small"
              effect="light"
              style="margin-right: 4px"
            >
              {{ getCapitalValidationLabel(row) }}
            </el-tag>
            <el-tag
              :type="getYearsValidationType(row)"
              size="small"
              effect="light"
            >
              {{ getYearsValidationLabel(row) }}
            </el-tag>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="riskLevel" label="风险等级" width="100">
        <template #default="{ row }">
          <el-tag :type="getRiskType(row.riskLevel)" effect="light" size="small">
            {{ getRiskLabel(row.riskLevel) }}
          </el-tag>
          <el-tooltip
            v-if="row.riskTags"
            :content="row.riskTags"
            placement="top"
            :show-after="300"
          >
            <el-icon class="risk-icon"><Warning /></el-icon>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)" effect="light" size="small">
            {{ getStatusLabel(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="暂停/隔离" width="120" align="center">
        <template #default="{ row }">
          <div class="status-badges">
            <el-tag v-if="row.isPaused" type="warning" effect="dark" size="small">已暂停</el-tag>
            <el-tag v-if="row.isIsolated" type="danger" effect="dark" size="small" style="margin-left: 4px">已隔离</el-tag>
            <el-tag v-if="!row.isPaused && !row.isIsolated" type="success" effect="light" size="small">正常</el-tag>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="isolateReason" label="异常原因" min-width="180" show-overflow-tooltip>
        <template #default="{ row }">
          <template v-if="row.isolateReason">
            <el-tooltip :content="row.isolateReason" placement="top" :show-after="200">
              <span class="long-text">{{ row.isolateReason }}</span>
            </el-tooltip>
          </template>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="submitOrgName" label="提交机构" width="140" />
      <el-table-column prop="submitTime" label="提交时间" width="160" />
      <el-table-column label="操作" width="280" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleRefreshRow(row)">刷新</el-button>
          <el-button v-if="row.isPaused" type="success" link size="small" @click="handleSingle(row, 'resume')">恢复</el-button>
          <el-button v-else type="info" link size="small" @click="handleSingle(row, 'pause')">暂停</el-button>
          <el-button v-if="row.status === 3" type="success" link size="small" @click="handleSingle(row, 'approve')">通过</el-button>
          <el-button v-if="row.status === 3" type="danger" link size="small" @click="handleSingle(row, 'reject')">驳回</el-button>
          <el-button v-if="row.isIsolated" type="primary" link size="small" @click="handleSingle(row, 'deisolate')">解除隔离</el-button>
          <el-button v-else type="warning" link size="small" @click="handleSingle(row, 'isolate')">隔离</el-button>
        </template>
      </el-table-column>
    </CcbTable>

    <el-dialog v-model="showImport" title="企业批量材料上传" width="1100px" destroy-on-close>
      <el-alert type="info" :closable="false" style="margin-bottom: 16px">
        系统将根据<strong>行业类型</strong>、<strong>注册资本</strong>、<strong>经营年限</strong>进行差异化校验：
        <br />• 金融业/房地产/采矿业需额外提供监管批复文件
        <br />• 注册资本1000万以上需提供验资报告
        <br />• 经营未满1年的企业需提供额外担保材料
      </el-alert>

      <div class="import-summary">
        <el-tag type="success">已填写完整：{{ validImportRowsCount }}</el-tag>
        <el-tag type="warning" style="margin-left: 8px">待补充资料：{{ importRows.length - validImportRowsCount }}</el-tag>
        <el-tag type="info" style="margin-left: auto">共 {{ importRows.length }} 行</el-tag>
      </div>

      <el-table :data="importRows" border stripe size="small" class="import-table" max-height="500">
        <el-table-column type="index" label="#" width="50" />
        <el-table-column prop="enterpriseName" label="企业名称" min-width="180">
          <template #default="{ $index }">
            <el-input v-model="importRows[$index].enterpriseName" size="small" placeholder="必填" />
          </template>
        </el-table-column>
        <el-table-column prop="creditCode" label="统一社会信用代码" width="200">
          <template #default="{ $index }">
            <el-input v-model="importRows[$index].creditCode" size="small" placeholder="18位必填" maxlength="18" />
          </template>
        </el-table-column>
        <el-table-column prop="accountType" label="账户类型" width="140">
          <template #default="{ $index }">
            <el-select v-model="importRows[$index].accountType" size="small">
              <el-option v-for="(t, k) in CorporateAccountTypeText" :key="k" :label="t" :value="Number(k)" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column prop="industryType" label="行业类型" width="160">
          <template #default="{ $index }">
            <el-select v-model="importRows[$index].industryType" size="small" clearable placeholder="选填">
              <el-option v-for="opt in IndustryTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column prop="registeredCapital" label="注册资本(万)" width="120">
          <template #default="{ $index }">
            <el-input-number
              v-model="importRows[$index].registeredCapital"
              size="small"
              :min="0"
              :step="10"
              controls-position="right"
            />
          </template>
        </el-table-column>
        <el-table-column prop="businessYears" label="经营年限" width="100">
          <template #default="{ $index }">
            <el-input-number
              v-model="importRows[$index].businessYears"
              size="small"
              :min="0"
              :max="100"
              controls-position="right"
            />
          </template>
        </el-table-column>
        <el-table-column prop="legalRepresentative" label="法人代表" width="110">
          <template #default="{ $index }">
            <el-input v-model="importRows[$index].legalRepresentative" size="small" placeholder="选填" />
          </template>
        </el-table-column>
        <el-table-column label="差异化校验" width="200" align="center">
          <template #default="{ row }">
            <div class="row-validation">
              <el-tooltip
                v-if="!validateCreditCode(row.creditCode)"
                content="信用代码格式不正确"
                placement="top"
              >
                <el-tag type="danger" size="small" effect="dark">信用代码</el-tag>
              </el-tooltip>
              <el-tooltip
                v-if="row.industryType && needExtraDocs(row.industryType)"
                content="该行业需提供监管批复"
                placement="top"
              >
                <el-tag type="warning" size="small" style="margin-left: 4px">行业+</el-tag>
              </el-tooltip>
              <el-tooltip
                v-if="row.registeredCapital && row.registeredCapital >= 1000"
                content="需提供验资报告"
                placement="top"
              >
                <el-tag type="warning" size="small" style="margin-left: 4px">验资</el-tag>
              </el-tooltip>
              <el-tooltip
                v-if="row.businessYears !== undefined && row.businessYears < 1"
                content="需提供额外担保材料"
                placement="top"
              >
                <el-tag type="warning" size="small" style="margin-left: 4px">担保</el-tag>
              </el-tooltip>
              <el-tag
                v-if="validateCreditCode(row.creditCode) && !needExtraDocs(row.industryType) && !(row.registeredCapital && row.registeredCapital >= 1000) && !(row.businessYears !== undefined && row.businessYears < 1)"
                type="success"
                size="small"
                effect="light"
              >
                校验通过
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="70" align="center" fixed="right">
          <template #default="{ $index }">
            <el-button type="danger" link size="small" @click="importRows.splice($index, 1)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="import-actions">
        <el-button :icon="Plus" size="small" @click="addImportRow">新增一行</el-button>
      </div>

      <template #footer>
        <el-button @click="showImport = false">取消</el-button>
        <el-button type="primary" :loading="importing" @click="submitImport">
          <span class="ripple-btn">提交上传</span>
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showImportResult" title="批量上传结果" width="720px">
      <el-row :gutter="16">
        <el-col :span="6">
          <el-statistic title="成功" :value="importResult.filter(r => r.success).length" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="需人工复核" :value="importResult.filter(r => r.needManualReview).length" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="已隔离" :value="importResult.filter(r => r.isIsolated).length" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="失败" :value="importResult.filter(r => !r.success).length" />
        </el-col>
      </el-row>
      <el-table :data="importResult" size="small" style="margin-top: 16px" max-height="360">
        <el-table-column prop="index" label="#" width="50" />
        <el-table-column label="结果" width="70" align="center">
          <template #default="{ row }">
            <el-icon :color="row.success ? '#67c23a' : '#f56c6c'">
              <CircleCheckFilled v-if="row.success" />
              <CircleCloseFilled v-else />
            </el-icon>
          </template>
        </el-table-column>
        <el-table-column prop="openingNo" label="申请流水号" width="200" />
        <el-table-column label="风险等级" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.riskLevel !== undefined" :type="getRiskType(row.riskLevel)" size="small">
              {{ getRiskLabel(row.riskLevel) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="说明" min-width="220">
          <template #default="{ row }">
            <div v-if="row.errors && row.errors.length">
              <el-tooltip
                v-for="(err, i) in row.errors"
                :key="'e'+i"
                :content="err"
                placement="top"
                raw-content
              >
                <el-tag type="danger" size="small" style="margin-right: 4px; margin-top: 4px">{{ err.length > 10 ? err.slice(0, 10) + '…' : err }}</el-tag>
              </el-tooltip>
            </div>
            <div v-if="row.warnings && row.warnings.length">
              <el-tooltip
                v-for="(w, i) in row.warnings"
                :key="'w'+i"
                :content="w"
                placement="top"
                raw-content
              >
                <el-tag type="warning" size="small" style="margin-right: 4px; margin-top: 4px">{{ w.length > 10 ? w.slice(0, 10) + '…' : w }}</el-tag>
              </el-tooltip>
            </div>
            <span v-if="!row.errors?.length && !row.warnings?.length" class="empty-tip">-</span>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Upload, Check, Close, Warning, VideoPause, Plus, CircleCheckFilled, CircleCloseFilled } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getCorporateOpeningListApi,
  batchImportCorporateOpeningApi,
  batchReviewCorporateOpeningApi,
  refreshCorporateOpeningApi,
  type CorporateOpening,
  type CorporateBatchImportItem,
  type CorporateBatchImportResultItem,
  type CorporateBatchReviewRequest,
  CorporateAccountTypeText,
  IndustryTypeOptions
} from '@api/business'
import { RiskLevelText, AccountOpeningStatusText } from '@api/account'
import { usePermission } from '@hooks/usePermission'

const { hasRole } = usePermission()
const isAdmin = computed(() => hasRole('admin'))

const loading = ref<boolean>(false)
const tableData = ref<CorporateOpening[]>([])
const total = ref<number>(0)
const selectedIds = ref<string[]>([])

const searchForm = reactive({
  openingNo: '',
  enterpriseName: '',
  creditCode: '',
  accountType: null as number | null,
  industryType: null as string | null,
  status: null as number | null,
  riskLevel: null as number | null,
  capitalRange: null as string | null,
  yearsRange: null as string | null
})

const pageParams = reactive({ page: 1, pageSize: 10 })

const statusOptions = AccountOpeningStatusText
const riskOptions = RiskLevelText

const highRiskCount = computed(() => tableData.value.filter(r => r.riskLevel >= 4).length)
const pendingCount = computed(() => tableData.value.filter(r => r.status === 3).length)
const pausedCount = computed(() => tableData.value.filter(r => r.isPaused === 1).length)
const isolatedCount = computed(() => tableData.value.filter(r => r.isIsolated === 1).length)

const showImport = ref(false)
const importing = ref(false)
const showImportResult = ref(false)
const importResult = ref<CorporateBatchImportResultItem[]>([])
const importRows = ref<CorporateBatchImportItem[]>([])

const validImportRowsCount = computed(() =>
  importRows.value.filter(r =>
    r.enterpriseName && r.creditCode && validateCreditCode(r.creditCode)
  ).length
)

const validateCreditCode = (code?: string): boolean => {
  if (!code) return false
  return /^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/.test(code)
}

const needExtraDocs = (industryType?: string): boolean => {
  return ['finance', 'real_estate', 'mining'].includes(industryType || '')
}

const getRiskType = (level: number): string => {
  if (level === 0) return 'success'
  if (level <= 2) return 'info'
  if (level === 3) return 'warning'
  return 'danger'
}
const getRiskLabel = (level: number) => RiskLevelText[level] || '未知'

const getStatusType = (s: number): string => {
  if (s === 5) return 'success'
  if (s === 3 || s === 4) return 'warning'
  if (s === 6 || s === 8) return 'danger'
  if (s === 7) return 'info'
  return 'primary'
}
const getStatusLabel = (s: number) => AccountOpeningStatusText[s] || '未知'

const getIndustryLabel = (type?: string): string => {
  const opt = IndustryTypeOptions.find(o => o.value === type)
  return opt ? opt.label : ''
}

const formatCapital = (val: number): string => {
  return val.toLocaleString('zh-CN')
}

const getIndustryValidationType = (row: CorporateOpening): string => {
  if (!row.industryType) return 'info'
  return needExtraDocs(row.industryType) ? 'warning' : 'success'
}
const getIndustryValidationLabel = (row: CorporateOpening): string => {
  if (!row.industryType) return '行业未填'
  return needExtraDocs(row.industryType) ? '行业监管' : '行业合规'
}

const getCapitalValidationType = (row: CorporateOpening): string => {
  if (!row.registeredCapital) return 'info'
  return row.registeredCapital >= 1000 ? 'warning' : 'success'
}
const getCapitalValidationLabel = (row: CorporateOpening): string => {
  if (!row.registeredCapital) return '资本未填'
  return row.registeredCapital >= 1000 ? '需验资' : '资本合规'
}

const getYearsValidationType = (row: CorporateOpening): string => {
  if (row.businessYears === undefined) return 'info'
  return row.businessYears < 1 ? 'warning' : 'success'
}
const getYearsValidationLabel = (row: CorporateOpening): string => {
  if (row.businessYears === undefined) return '年限未填'
  return row.businessYears < 1 ? '需担保' : '年限合规'
}

const fetchData = async () => {
  loading.value = true
  try {
    const params: any = {
      page: pageParams.page,
      pageSize: pageParams.pageSize,
      keyword: searchForm.enterpriseName || searchForm.creditCode || searchForm.openingNo || undefined,
      openingNo: searchForm.openingNo || undefined,
      enterpriseName: searchForm.enterpriseName || undefined,
      creditCode: searchForm.creditCode || undefined,
      accountType: searchForm.accountType ?? undefined,
      status: searchForm.status ?? undefined,
      riskLevel: searchForm.riskLevel ?? undefined,
      industryType: searchForm.industryType ?? undefined
    }
    if (searchForm.capitalRange) {
      params.capitalRange = searchForm.capitalRange
    }
    if (searchForm.yearsRange) {
      params.yearsRange = searchForm.yearsRange
    }
    const res = await getCorporateOpeningListApi(params)
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
const handleSelectionChange = (rows: any[]) => { selectedIds.value = rows.map(r => r.id) }

const addImportRow = () => {
  importRows.value.push({
    enterpriseName: '',
    creditCode: '',
    accountType: 1,
    industryType: undefined,
    registeredCapital: undefined,
    businessYears: undefined,
    legalRepresentative: undefined
  })
}

const openImportDialog = () => {
  importRows.value = [
    { enterpriseName: '', creditCode: '', accountType: 1 },
    { enterpriseName: '', creditCode: '', accountType: 2 }
  ]
  showImport.value = true
}

const submitImport = async () => {
  const validRows = importRows.value.filter(r => r.enterpriseName && r.creditCode && validateCreditCode(r.creditCode))
  if (validRows.length === 0) {
    ElMessage.warning('请至少填写一行完整的企业开户资料（信用代码格式正确）')
    return
  }
  importing.value = true
  try {
    importResult.value = await batchImportCorporateOpeningApi({ items: validRows })
    showImport.value = false
    showImportResult.value = true
    fetchData()
  } catch (e: any) {
    ElMessage.error(e.message || '导入失败')
  } finally {
    importing.value = false
  }
}

const handleBatchReview = async (op: 'approve' | 'reject' | 'pause' | 'resume' | 'isolate' | 'deisolate') => {
  if (selectedIds.value.length === 0) return
  if (op === 'approve' && !isAdmin.value) {
    ElMessage.warning('仅管理员可执行批量通过操作')
    return
  }
  const title = op === 'approve' ? '批量通过'
    : op === 'reject' ? '批量驳回'
    : op === 'pause' ? '批量暂停'
    : op === 'resume' ? '批量恢复'
    : op === 'isolate' ? '异常隔离'
    : '解除隔离'
  try {
    let reason: string | undefined
    if (op === 'reject' || op === 'isolate' || op === 'pause') {
      reason = (await ElMessageBox.prompt(`请输入${title}原因`, title, { confirmButtonText: '确定', cancelButtonText: '取消' })).value
    } else {
      await ElMessageBox.confirm(`确定${title}选中的 ${selectedIds.value.length} 条记录吗？`, '确认', { type: 'warning' })
    }
    const items = selectedIds.value.map(id => ({ id, operation: op as any, reason }))
    const req: CorporateBatchReviewRequest = { items }
    const res = await batchReviewCorporateOpeningApi(req)
    ElMessage.success(`${title}成功 ${res.successCount} 条，失败 ${res.failCount} 条`)
    fetchData()
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error(e.message || '操作失败')
  }
}

const handleRefreshRow = async (row: CorporateOpening) => {
  const idx = tableData.value.findIndex(r => r.id === row.id)
  if (idx === -1) return
  try {
    const refreshed = await refreshCorporateOpeningApi(row.id)
    tableData.value.splice(idx, 1, refreshed)
    ElMessage.success('刷新成功')
  } catch (e: any) {
    ElMessage.error(e.message || '刷新失败')
  }
}

const handleSingle = async (row: CorporateOpening, op: 'approve' | 'reject' | 'pause' | 'resume' | 'isolate' | 'deisolate') => {
  const idx = tableData.value.findIndex(r => r.id === row.id)
  if (idx === -1) return
  if (op === 'approve' && !isAdmin.value) {
    ElMessage.warning('仅管理员可执行通过操作')
    return
  }
  try {
    let reason: string | undefined
    if (op === 'reject' || op === 'isolate' || op === 'pause') {
      reason = (await ElMessageBox.prompt('请输入原因', '提示', { confirmButtonText: '确定', cancelButtonText: '取消' })).value
    }
    const req: CorporateBatchReviewRequest = { items: [{ id: row.id, operation: op as any, reason }] }
    const res = await batchReviewCorporateOpeningApi(req)
    const detail = res.details[0]
    if (detail?.success) {
      ElMessage.success('操作成功')
      const refreshed = await refreshCorporateOpeningApi(row.id)
      tableData.value.splice(idx, 1, refreshed)
    } else {
      ElMessage.error(detail?.message || '操作失败')
    }
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error(e.message || '操作失败')
  }
}

onMounted(() => fetchData())
</script>

<style lang="scss" scoped>
.ccb-business-corporate-batch {
  :deep(.corporate-batch-row) {
    transition: box-shadow 0.35s ease, transform 0.35s ease, background 0.35s ease;
    position: relative;
    &:nth-child(even) {
      background-color: rgba(248, 250, 252, 0.6);
    }
    &:nth-child(odd) {
      background-color: #ffffff;
    }
    &:hover {
      box-shadow: 0 8px 28px rgba(23, 85, 163, 0.22);
      transform: translateY(-3px) scale(1.002);
      background: linear-gradient(90deg, rgba(23, 85, 163, 0.08), rgba(23, 85, 163, 0.01));
      z-index: 2;
      border-radius: 4px;
    }
    &.el-table__row--selected {
      background-color: rgba(23, 85, 163, 0.06) !important;
    }
  }
  .risk-icon { color: #e6a23c; margin-left: 4px; vertical-align: middle; }
  .long-text { cursor: help; }
  .validation-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 2px;
  }
  .status-badges {
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .import-summary {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
    padding: 10px 12px;
    background: #f5f7fa;
    border-radius: 6px;
  }
  .import-actions {
    display: flex;
    align-items: center;
    margin-top: 12px;
  }
  .row-validation {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: 2px;
  }
  .empty-tip { color: #909399; }
  .ripple-btn { position: relative; overflow: hidden; }
}
</style>
