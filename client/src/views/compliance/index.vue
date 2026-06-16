<template>
  <div class="compliance-page">
    <div class="page-header">
      <h2 class="page-title">合规审计管理</h2>
      <div class="toolbar">
        <el-button
          v-if="hasPerm('compliance:audit:batch')"
          type="primary"
          :disabled="selectedIds.length === 0"
          @click="handleBatchAudit"
        >
          <el-icon><Select /></el-icon>
          批量审核
        </el-button>
        <el-button type="success" @click="handleExport">
          <el-icon><Download /></el-icon>
          导出
        </el-button>
      </div>
    </div>

    <FinFilter :filters="filterConfig" @search="handleSearch" @reset="handleReset" />

    <FinTable
      :columns="tableColumns"
      :data="tableData"
      :loading="loading"
      :pagination="pagination"
      :selection="true"
      :show-index="true"
      @selection-change="handleSelectionChange"
      @page-change="handlePageChange"
      @size-change="handleSizeChange"
    >
      <template #auditStatus="{ row }">
        <el-tag :type="getAuditStatusColor(row.auditStatus)" effect="light">
          {{ getAuditStatusLabel(row.auditStatus) }}
        </el-tag>
      </template>

      <template #riskScore="{ row }">
        <span :class="getRiskScoreClass(row.riskScore)">
          {{ row.riskScore }}
        </span>
      </template>

      <template #action="{ row }">
        <el-button type="primary" link @click="handleView(row)">
          查看详情
        </el-button>
        <el-button
          v-if="hasPerm('compliance:audit:approve') && row.auditStatus === 'pending'"
          type="success"
          link
          @click="handleApprove(row)"
        >
          审核通过
        </el-button>
        <el-button
          v-if="hasPerm('compliance:audit:reject') && row.auditStatus === 'pending'"
          type="danger"
          link
          @click="handleReject(row)"
        >
          审核拒绝
        </el-button>
      </template>
    </FinTable>

    <FinDialog
      v-model:visible="detailDialog.visible"
      :title="'审计详情 - ' + detailDialog.data?.auditNo"
      width="700px"
    >
      <el-descriptions :column="2" border>
        <el-descriptions-item label="审计编号">
          {{ detailDialog.data?.auditNo }}
        </el-descriptions-item>
        <el-descriptions-item label="审计类型">
          {{ getAuditTypeLabel(detailDialog.data?.auditType) }}
        </el-descriptions-item>
        <el-descriptions-item label="审计状态">
          <el-tag :type="getAuditStatusColor(detailDialog.data?.auditStatus)" effect="light">
            {{ getAuditStatusLabel(detailDialog.data?.auditStatus) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="目标类型">
          {{ getTargetTypeLabel(detailDialog.data?.targetType) }}
        </el-descriptions-item>
        <el-descriptions-item label="目标ID">
          {{ detailDialog.data?.targetId }}
        </el-descriptions-item>
        <el-descriptions-item label="风险评分">
          <span :class="getRiskScoreClass(detailDialog.data?.riskScore)">
            {{ detailDialog.data?.riskScore }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="审计员">
          {{ detailDialog.data?.auditorId || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="审计时间">
          {{ detailDialog.data?.auditAt ? formatDate(detailDialog.data?.auditAt, 'YYYY-MM-DD HH:mm:ss') : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="审计意见" :span="2">
          {{ detailDialog.data?.auditOpinion || '-' }}
        </el-descriptions-item>
      </el-descriptions>
    </FinDialog>

    <FinDialog
      v-model:visible="auditDialog.visible"
      :title="auditDialog.title"
      width="500px"
      :loading="auditDialog.loading"
      @confirm="handleAuditConfirm"
    >
      <el-form :model="auditForm" label-width="80px">
        <el-form-item label="审核意见">
          <el-input
            v-model="auditForm.auditOpinion"
            type="textarea"
            :rows="4"
            placeholder="请输入审核意见"
          />
        </el-form-item>
      </el-form>
    </FinDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Select, Download } from '@element-plus/icons-vue'
import FinFilter from '@/components/common/FinFilter.vue'
import FinTable from '@/components/common/FinTable.vue'
import FinDialog from '@/components/common/FinDialog.vue'
import { usePermission } from '@/hooks/usePermission'
import { formatDate } from '@/utils/format'
import { DEFAULT_PAGE_SIZE, PAGE_SIZES } from '@/constants'
import {
  AUDIT_TYPE_LABELS,
  AUDIT_STATUS_LABELS,
  AUDIT_STATUS_COLORS,
  TARGET_TYPE_LABELS
} from '@/constants/dictionaries'
import {
  getList,
  getById,
  audit,
  batchAudit,
  exportList
} from '@/api/complianceAudit'
import type { IComplianceAudit } from '@/types/api'
import type { IFilterConfig, ITableColumn } from '@/types/components'

const { hasPerm } = usePermission()

const loading = ref(false)
const tableData = ref<IComplianceAudit[]>([])
const selectedIds = ref<number[]>([])

const pagination = reactive({
  show: true,
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  total: 0,
  pageSizes: PAGE_SIZES
})

const searchParams = reactive<Record<string, any>>({})

const filterConfig: IFilterConfig[] = [
  {
    prop: 'auditNo',
    label: '审计编号',
    type: 'input',
    placeholder: '请输入审计编号'
  },
  {
    prop: 'auditType',
    label: '审计类型',
    type: 'select',
    options: Object.entries(AUDIT_TYPE_LABELS).map(([value, label]) => ({ value, label }))
  },
  {
    prop: 'auditStatus',
    label: '审计状态',
    type: 'select',
    options: Object.entries(AUDIT_STATUS_LABELS).map(([value, label]) => ({ value, label }))
  },
  {
    prop: 'targetType',
    label: '目标类型',
    type: 'select',
    options: Object.entries(TARGET_TYPE_LABELS).map(([value, label]) => ({ value, label }))
  },
  {
    prop: 'riskScore',
    label: '风险评分范围',
    type: 'numberrange',
    min: 0,
    max: 100,
    precision: 0,
    advanced: true
  },
  {
    prop: 'auditDate',
    label: '日期范围',
    type: 'daterange',
    advanced: true
  },
  {
    prop: 'auditorId',
    label: '审计员',
    type: 'input',
    placeholder: '请输入审计员ID',
    advanced: true
  }
]

const tableColumns: ITableColumn[] = [
  { prop: 'auditNo', label: '审计编号', minWidth: 140, fixed: 'left' },
  { prop: 'auditType', label: '审计类型', width: 100 },
  { prop: 'auditStatus', label: '审计状态', width: 100, slot: 'auditStatus' },
  { prop: 'targetType', label: '目标类型', width: 100 },
  { prop: 'targetId', label: '目标ID', width: 100, align: 'center' },
  { prop: 'riskScore', label: '风险评分', width: 100, align: 'center', slot: 'riskScore' },
  { prop: 'auditorId', label: '审计员', width: 100 },
  { prop: 'auditOpinion', label: '审计意见', minWidth: 150, showOverflowTooltip: true },
  { prop: 'auditAt', label: '审计时间', width: 170, type: 'datetime' }
]

const detailDialog = reactive({
  visible: false,
  data: null as IComplianceAudit | null
})

const auditDialog = reactive({
  visible: false,
  title: '',
  loading: false,
  type: '',
  ids: [] as number[]
})

const auditForm = reactive({
  auditOpinion: ''
})

function getAuditTypeLabel(type?: string): string {
  if (!type) return '-'
  return AUDIT_TYPE_LABELS[type as keyof typeof AUDIT_TYPE_LABELS] || type
}

function getAuditStatusLabel(status?: string): string {
  if (!status) return '-'
  return AUDIT_STATUS_LABELS[status as keyof typeof AUDIT_STATUS_LABELS] || status
}

function getAuditStatusColor(status?: string): string {
  if (!status) return 'info'
  return AUDIT_STATUS_COLORS[status as keyof typeof AUDIT_STATUS_COLORS] || 'info'
}

function getTargetTypeLabel(type?: string): string {
  if (!type) return '-'
  return TARGET_TYPE_LABELS[type as keyof typeof TARGET_TYPE_LABELS] || type
}

function getRiskScoreClass(score?: number): string {
  if (score === null || score === undefined) return ''
  if (score < 30) return 'risk-low'
  if (score <= 60) return 'risk-medium'
  return 'risk-high'
}

async function fetchData() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchParams
    }
    const res = await getList(params)
    if (res.code === 0) {
      tableData.value = res.data.list
      pagination.total = res.data.total
    } else {
      ElMessage.error(res.message)
    }
  } catch (error) {
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

function handleSearch(params: Record<string, any>) {
  Object.assign(searchParams, params)
  pagination.page = 1
  fetchData()
}

function handleReset() {
  Object.keys(searchParams).forEach(key => {
    delete searchParams[key]
  })
  pagination.page = 1
  fetchData()
}

function handleSelectionChange(selection: any[]) {
  selectedIds.value = selection.map(item => item.id)
}

function handlePageChange(page: number) {
  pagination.page = page
  fetchData()
}

function handleSizeChange(size: number) {
  pagination.pageSize = size
  pagination.page = 1
  fetchData()
}

async function handleView(row: IComplianceAudit) {
  try {
    const res = await getById(row.id)
    if (res.code === 0) {
      detailDialog.data = res.data
      detailDialog.visible = true
    } else {
      ElMessage.error(res.message)
    }
  } catch (error) {
    ElMessage.error('获取详情失败')
  }
}

function handleApprove(row: IComplianceAudit) {
  auditDialog.title = '审核通过'
  auditDialog.type = 'approved'
  auditDialog.ids = [row.id]
  auditForm.auditOpinion = ''
  auditDialog.visible = true
}

function handleReject(row: IComplianceAudit) {
  auditDialog.title = '审核拒绝'
  auditDialog.type = 'rejected'
  auditDialog.ids = [row.id]
  auditForm.auditOpinion = ''
  auditDialog.visible = true
}

function handleBatchAudit() {
  ElMessageBox({
    title: '批量审核',
    message: `请选择审核结果（已选择 ${selectedIds.value.length} 条记录）`,
    showCancelButton: true,
    confirmButtonText: '审核通过',
    cancelButtonText: '审核拒绝',
    distinguishCancelAndClose: true
  }).then(() => {
    auditDialog.title = '批量审核通过'
    auditDialog.type = 'approved'
    auditDialog.ids = [...selectedIds.value]
    auditForm.auditOpinion = ''
    auditDialog.visible = true
  }).catch((action: string) => {
    if (action === 'cancel') {
      auditDialog.title = '批量审核拒绝'
      auditDialog.type = 'rejected'
      auditDialog.ids = [...selectedIds.value]
      auditForm.auditOpinion = ''
      auditDialog.visible = true
    }
  })
}

async function handleAuditConfirm() {
  if (!auditForm.auditOpinion.trim()) {
    ElMessage.warning('请输入审核意见')
    return
  }

  auditDialog.loading = true
  try {
    if (auditDialog.ids.length === 1) {
      const res = await audit(auditDialog.ids[0], auditDialog.type, auditForm.auditOpinion)
      if (res.code === 0) {
        ElMessage.success('审核成功')
        auditDialog.visible = false
        fetchData()
      } else {
        ElMessage.error(res.message)
      }
    } else {
      const res = await batchAudit(auditDialog.ids, auditDialog.type, auditForm.auditOpinion)
      if (res.code === 0) {
        ElMessage.success('批量审核成功')
        auditDialog.visible = false
        selectedIds.value = []
        fetchData()
      } else {
        ElMessage.error(res.message)
      }
    }
  } catch (error) {
    ElMessage.error('审核失败')
  } finally {
    auditDialog.loading = false
  }
}

async function handleExport() {
  try {
    const params = { ...searchParams }
    const res = await exportList(params)
    if (res.code === 0) {
      const blob = new Blob([res.data as Blob], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `合规审计列表_${formatDate(new Date(), 'YYYYMMDD')}.xlsx`
      link.click()
      window.URL.revokeObjectURL(url)
      ElMessage.success('导出成功')
    } else {
      ElMessage.error(res.message)
    }
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.compliance-page {
  padding: 20px;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .page-title {
      font-size: 20px;
      font-weight: 600;
      color: var(--fin-text-primary);
      margin: 0;
    }

    .toolbar {
      display: flex;
      gap: 8px;
    }
  }

  .risk-low {
    color: var(--fin-success);
    font-weight: 600;
  }

  .risk-medium {
    color: var(--fin-warning);
    font-weight: 600;
  }

  .risk-high {
    color: var(--fin-danger);
    font-weight: 600;
  }
}
</style>
