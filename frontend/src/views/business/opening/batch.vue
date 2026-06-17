<template>
  <div class="ccb-business-opening-batch">
    <CcbPageHeader
      title="批量开户预审"
      description="批量导入开户资料并进行差异化预审管理"
      icon="Files"
    />

    <div class="ccb-table-toolbar">
      <div class="ccb-table-toolbar-left">
        <el-button type="primary" :icon="Upload" @click="openImportDialog">
          <span class="ripple-btn">批量导入</span>
        </el-button>
        <el-button
          type="success"
          :icon="Check"
          :disabled="selectedIds.length === 0"
          @click="handleBatchReview('approve')"
        >
          批量通过
        </el-button>
        <el-button
          type="warning"
          :icon="Close"
          :disabled="selectedIds.length === 0"
          @click="handleBatchReview('reject')"
        >
          批量驳回
        </el-button>
        <el-button
          type="danger"
          :icon="Warning"
          :disabled="selectedIds.length === 0"
          @click="handleBatchReview('isolate')"
        >
          异常隔离
        </el-button>
        <el-button
          type="info"
          :icon="Refresh"
          :disabled="selectedIds.length === 1"
          @click="handleSingleRefresh"
        >
          单条刷新
        </el-button>
      </div>
      <div class="ccb-table-toolbar-right">
        <el-tag type="info">高风险：{{ highRiskCount }}</el-tag>
        <el-tag type="warning" style="margin-left: 8px">待复核：{{ pendingCount }}</el-tag>
        <el-tag type="danger" style="margin-left: 8px">已隔离：{{ isolatedCount }}</el-tag>
      </div>
    </div>

    <CcbSearchForm v-model="searchForm" @search="handleSearch" @reset="handleReset">
      <el-form-item label="申请流水号" prop="openingNo">
        <el-input v-model="searchForm.openingNo" placeholder="请输入申请流水号" clearable />
      </el-form-item>
      <el-form-item label="客户姓名" prop="customerName">
        <el-input v-model="searchForm.customerName" placeholder="请输入客户姓名" clearable />
      </el-form-item>
      <el-form-item label="账户类型" prop="accountType">
        <el-select v-model="searchForm.accountType" placeholder="全部" clearable>
          <el-option label="一类账户" :value="1" />
          <el-option label="二类账户" :value="2" />
          <el-option label="三类账户" :value="3" />
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
      <el-form-item label="是否隔离" prop="isIsolated">
        <el-select v-model="searchForm.isIsolated" placeholder="全部" clearable>
          <el-option label="正常" :value="0" />
          <el-option label="已隔离" :value="1" />
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
      row-class-name="batch-row"
      @selection-change="handleSelectionChange"
      @change="handlePageChange"
    >
      <el-table-column prop="openingNo" label="申请流水号" width="200" />
      <el-table-column prop="customerName" label="客户姓名" width="100" />
      <el-table-column prop="idMasked" label="身份证号" width="200" />
      <el-table-column prop="mobileMasked" label="手机号" width="140" />
      <el-table-column prop="accountTypeText" label="账户类型" width="120" />
      <el-table-column prop="openPurpose" label="开户用途" width="120" />
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
      <el-table-column prop="status" label="状态" width="110">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)" effect="light" size="small">
            {{ getStatusLabel(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="isIsolated" label="是否隔离" width="90" align="center">
        <template #default="{ row }">
          <el-tag v-if="row.isIsolated" type="danger" effect="dark" size="small">已隔离</el-tag>
          <el-tag v-else type="success" effect="light" size="small">正常</el-tag>
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
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleRefresh(row)">刷新</el-button>
          <el-button v-if="row.status === 3" type="success" link size="small" @click="handleSingle(row, 'approve')">通过</el-button>
          <el-button v-if="row.status === 3" type="danger" link size="small" @click="handleSingle(row, 'reject')">驳回</el-button>
          <el-button v-if="row.isIsolated" type="info" link size="small" @click="handleSingle(row, 'deisolate')">解除隔离</el-button>
          <el-button v-else type="warning" link size="small" @click="handleSingle(row, 'isolate')">隔离</el-button>
        </template>
      </el-table-column>
    </CcbTable>

    <el-dialog v-model="showImport" title="批量导入开户资料" width="820px" destroy-on-close>
      <el-alert type="info" :closable="false" style="margin-bottom: 16px">
        系统将根据客户风险等级、开户用途实现差异化校验，高风险客户自动触发人工复核流程
      </el-alert>
      <el-table :data="importRows" border stripe size="small" class="import-table">
        <el-table-column type="index" label="#" width="50" />
        <el-table-column prop="customerName" label="姓名" width="90">
          <template #default="{ row, $index }">
            <el-input v-model="importRows[$index].customerName" size="small" />
          </template>
        </el-table-column>
        <el-table-column prop="idCardNo" label="身份证号" width="190">
          <template #default="{ row, $index }">
            <el-input v-model="importRows[$index].idCardNo" size="small" />
          </template>
        </el-table-column>
        <el-table-column prop="mobile" label="手机号" width="130">
          <template #default="{ row, $index }">
            <el-input v-model="importRows[$index].mobile" size="small" />
          </template>
        </el-table-column>
        <el-table-column prop="accountType" label="账户类型" width="100">
          <template #default="{ row, $index }">
            <el-select v-model="importRows[$index].accountType" size="small">
              <el-option label="一类" :value="1" />
              <el-option label="二类" :value="2" />
              <el-option label="三类" :value="3" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column prop="openPurpose" label="开户用途" width="110">
          <template #default="{ row, $index }">
            <el-select v-model="importRows[$index].openPurpose" size="small" clearable>
              <el-option label="工资" value="salary" />
              <el-option label="经营" value="business" />
              <el-option label="投资" value="investment" />
              <el-option label="消费" value="consumption" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="70" align="center">
          <template #default="{ $index }">
            <el-button type="danger" link size="small" @click="importRows.splice($index, 1)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="import-actions">
        <el-button :icon="Plus" size="small" @click="addImportRow">新增一行</el-button>
        <el-tag type="info" style="margin-left: auto">共 {{ importRows.length }} 行</el-tag>
      </div>

      <template #footer>
        <el-button @click="showImport = false">取消</el-button>
        <el-button type="primary" :loading="importing" @click="submitImport">
          <span class="ripple-btn">提交导入</span>
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showImportResult" title="批量导入结果" width="640px">
      <el-row :gutter="16">
        <el-col :span="8">
          <el-statistic title="成功" :value="importResult.filter(r => r.success).length" />
        </el-col>
        <el-col :span="8">
          <el-statistic title="需人工复核" :value="importResult.filter(r => r.needManualReview).length" />
        </el-col>
        <el-col :span="8">
          <el-statistic title="失败" :value="importResult.filter(r => !r.success).length" />
        </el-col>
      </el-row>
      <el-table :data="importResult" size="small" style="margin-top: 16px" max-height="320">
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
        <el-table-column label="说明" min-width="180">
          <template #default="{ row }">
            <div v-if="row.errors && row.errors.length">
              <el-tooltip
                v-for="(err, i) in row.errors"
                :key="'e'+i"
                :content="err"
                placement="top"
                raw-content
              >
                <el-tag type="danger" size="small" style="margin-right: 4px">{{ err.length > 8 ? err.slice(0, 8) + '…' : err }}</el-tag>
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
                <el-tag type="warning" size="small" style="margin-right: 4px; margin-top: 4px">{{ w.length > 8 ? w.slice(0, 8) + '…' : w }}</el-tag>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Upload, Check, Close, Warning, Refresh, Plus, CircleCheckFilled, CircleCloseFilled } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getOpeningListApi, batchImportOpeningApi, batchReviewOpeningApi, refreshOpeningApi,
  type AccountOpening, type BatchImportItem, type BatchImportResult,
  AccountOpeningStatusText, RiskLevelText
} from '@api/account'

const loading = ref<boolean>(false)
const tableData = ref<AccountOpening[]>([])
const total = ref<number>(0)
const selectedIds = ref<string[]>([])

const searchForm = reactive({
  openingNo: '',
  customerName: '',
  accountType: null as number | null,
  status: null as number | null,
  riskLevel: null as number | null,
  isIsolated: null as number | null
})

const pageParams = reactive({ page: 1, pageSize: 10 })

const statusOptions = AccountOpeningStatusText
const riskOptions = RiskLevelText

const highRiskCount = computed(() => tableData.value.filter(r => r.riskLevel >= 4).length)
const pendingCount = computed(() => tableData.value.filter(r => r.status === 3).length)
const isolatedCount = computed(() => tableData.value.filter(r => r.isIsolated === 1).length)

const showImport = ref(false)
const importing = ref(false)
const showImportResult = ref(false)
const importResult = ref<BatchImportResult[]>([])
const importRows = ref<BatchImportItem[]>([])

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

const fetchData = async () => {
  loading.value = true
  try {
    const params: any = {
      page: pageParams.page,
      pageSize: pageParams.pageSize,
      keyword: searchForm.customerName || searchForm.openingNo || undefined,
      openingNo: searchForm.openingNo || undefined,
      customerName: searchForm.customerName || undefined,
      accountType: searchForm.accountType ?? undefined,
      status: searchForm.status ?? undefined,
      riskLevel: searchForm.riskLevel ?? undefined,
      isIsolated: searchForm.isIsolated ?? undefined
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
const handleSelectionChange = (rows: any[]) => { selectedIds.value = rows.map(r => r.id) }

const addImportRow = () => {
  importRows.value.push({ customerName: '', idCardNo: '', mobile: '', accountType: 1 })
}

const openImportDialog = () => {
  importRows.value = [
    { customerName: '', idCardNo: '', mobile: '', accountType: 1 },
    { customerName: '', idCardNo: '', mobile: '', accountType: 2 }
  ]
  showImport.value = true
}

const submitImport = async () => {
  const validRows = importRows.value.filter(r => r.customerName && r.idCardNo && r.mobile)
  if (validRows.length === 0) {
    ElMessage.warning('请至少填写一行完整的开户资料')
    return
  }
  importing.value = true
  try {
    importResult.value = await batchImportOpeningApi({ items: validRows })
    showImport.value = false
    showImportResult.value = true
    fetchData()
  } catch (e: any) {
    ElMessage.error(e.message || '导入失败')
  } finally {
    importing.value = false
  }
}

const handleBatchReview = async (op: 'approve' | 'reject' | 'isolate' | 'deisolate') => {
  if (selectedIds.value.length === 0) return
  const title = op === 'approve' ? '批量通过' : op === 'reject' ? '批量驳回' : op === 'isolate' ? '异常隔离' : '解除隔离'
  try {
    let reason: string | undefined
    if (op === 'reject' || op === 'isolate') {
      reason = (await ElMessageBox.prompt(`请输入${title}原因`, title, { confirmButtonText: '确定', cancelButtonText: '取消' })).value
    } else {
      await ElMessageBox.confirm(`确定${title}选中的 ${selectedIds.value.length} 条记录吗？`, '确认', { type: 'warning' })
    }
    const res = await batchReviewOpeningApi({ ids: selectedIds.value, operation: op, reason })
    ElMessage.success(`${title}成功 ${res.successCount} 条，失败 ${res.failCount} 条`)
    fetchData()
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error(e.message || '操作失败')
  }
}

const handleSingleRefresh = async () => {
  ElMessage.warning('请在下方表格操作列点击"刷新"按钮进行单条刷新')
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

const handleSingle = async (row: AccountOpening, op: 'approve' | 'reject' | 'isolate' | 'deisolate') => {
  try {
    let reason: string | undefined
    if (op === 'reject' || op === 'isolate') {
      reason = (await ElMessageBox.prompt('请输入原因', '提示', { confirmButtonText: '确定', cancelButtonText: '取消' })).value
    }
    const res = await batchReviewOpeningApi({ ids: [row.id], operation: op, reason })
    ElMessage.success(res.details[0].success ? '操作成功' : ('操作失败：' + res.details[0].message))
    fetchData()
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error(e.message || '操作失败')
  }
}

onMounted(() => fetchData())
</script>

<style lang="scss" scoped>
.ccb-business-opening-batch {
  :deep(.batch-row) {
    transition: box-shadow 0.3s ease, transform 0.3s ease, background 0.3s ease;
    &:hover {
      box-shadow: 0 4px 20px rgba(23, 85, 163, 0.2);
      transform: translateY(-2px);
      background: linear-gradient(90deg, rgba(23, 85, 163, 0.06), rgba(23, 85, 163, 0.01));
      z-index: 1;
    }
    &.el-table__row--selected {
      background-color: rgba(23, 85, 163, 0.05);
    }
  }
  .risk-icon { color: #e6a23c; margin-left: 4px; vertical-align: middle; }
  .long-text { cursor: help; }
  .import-actions {
    display: flex; align-items: center; margin-top: 12px;
  }
  .ripple-btn { position: relative; overflow: hidden; }
}
</style>
