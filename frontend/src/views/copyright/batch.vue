<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import type { UploadUserFile, UploadProps } from 'element-plus'
import QyDataTable from '@/components/QyDataTable/index.vue'
import QyTableToolbar from '@/components/QyTableToolbar/index.vue'
import { useUserStore } from '@/stores'
import {
  COPYRIGHT_TYPE,
  COPYRIGHT_CONTENT_TYPE,
  COPYRIGHT_OWNERSHIP_STATUS,
  COPYRIGHT_COMPLIANCE_STATUS,
  COPYRIGHT_BIND_STATUS,
  getEnumOptions,
  getEnumLabel,
  getEnumItem,
} from '@/constants/enums'
import {
  getCopyrightListApi,
  batchImportCopyrightApi,
  batchRenewCopyrightApi,
  batchInvalidCopyrightApi,
  checkCopyrightConflictApi,
} from '@/api/copyright'
import type { CopyrightItem, BatchCopyrightImportResult, BatchCopyrightProgress, BatchImportErrorItem } from '@/types'
import { formatDate } from '@/utils'
import {
  UploadFilled, Download, Refresh, Bell, WarningFilled, CircleCheck,
  CircleClose, DatePicker, SuccessFilled, Close, Document, Search,
} from '@element-plus/icons-vue'

const userStore = useUserStore()
const getAuthToken = () => userStore.accessToken

const loading = ref(false)
const listData = ref<CopyrightItem[]>([])
const total = ref(0)
const selectedRows = ref<CopyrightItem[]>([])
const refreshingIds = ref<number[]>([])

const queryParams = reactive({
  page: 1,
  pageSize: 10,
  keyword: '',
  type: null as number | null,
  contentType: null as number | null,
  ownershipStatus: null as number | null,
  complianceStatus: null as number | null,
  bindStatus: null as number | null,
  expireRange: null as [string, string] | null,
})

const loadData = async () => {
  loading.value = true
  try {
    const params: any = { ...queryParams }
    if (queryParams.expireRange) {
      params.expireStart = queryParams.expireRange[0]
      params.expireEnd = queryParams.expireRange[1]
    }
    const result = await getCopyrightListApi(params)
    listData.value = result.list
    total.value = result.pagination.total
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  queryParams.page = 1
  loadData()
}

const handleReset = () => {
  queryParams.keyword = ''
  queryParams.type = null
  queryParams.contentType = null
  queryParams.ownershipStatus = null
  queryParams.complianceStatus = null
  queryParams.bindStatus = null
  queryParams.expireRange = null
  handleSearch()
}

const handlePageChange = (page: number) => {
  queryParams.page = page
  loadData()
}

const handleSizeChange = (pageSize: number) => {
  queryParams.pageSize = pageSize
  queryParams.page = 1
  loadData()
}

const handleSelectionChange = (rows: CopyrightItem[]) => {
  selectedRows.value = rows
}

const activeTab = ref<'import' | 'renew' | 'invalid'>('import')

const importVisible = ref(false)
const importFile = reactive({
  fileList: [] as UploadUserFile[],
  isUploading: false,
})
const importResult = ref<BatchCopyrightImportResult | null>(null)
const importProgress = reactive<BatchCopyrightProgress>({
  percentage: 0,
  processed: 0,
  total: 0,
  successCount: 0,
  errorCount: 0,
  status: 'idle',
  message: '',
})
const importTimer = ref<any>(null)

const importUploadHandlers: Partial<UploadProps> = {
  beforeUpload: (file: File) => {
    const allowed = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
    ]
    const fileName = file.name.toLowerCase()
    const extOk = fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv')
    if (!allowed.includes(file.type) && !extOk) {
      ElMessage.error('仅支持 Excel(.xlsx/.xls) 和 CSV 格式!')
      return false
    }
    const isLt20M = file.size / 1024 / 1024 < 20
    if (!isLt20M) {
      ElMessage.error('文件大小不能超过 20MB!')
      return false
    }
    importFile.isUploading = true
    return true
  },
  onProgress: (e: any) => {
    importProgress.status = 'processing'
    importProgress.percentage = Math.min(30, Math.floor(e.percent || 0))
  },
  onSuccess: async (response: any) => {
    importFile.isUploading = false
    const fileUrl = response.data?.url || response.data
    try {
      importProgress.status = 'processing'
      simulateProgress()
      const result = await batchImportCopyrightApi({
        fileUrl,
        options: { autoSkipError: true, updateExisting: true },
      })
      clearInterval(importTimer.value)
      importResult.value = result
      importProgress = {
        percentage: 100,
        processed: result.totalCount,
        total: result.totalCount,
        successCount: result.successCount,
        errorCount: result.errorCount,
        status: result.errorCount === 0 ? 'success' : (result.successCount === 0 ? 'error' : 'partial'),
        message: `批量导入完成：成功 ${result.successCount} 条，失败 ${result.errorCount} 条，跳过 ${result.skipCount || 0} 条`,
      }
      ElMessage.success(importProgress.message)
      await refreshAffectedIds(result.importedIds || [])
    } catch (err: any) {
      clearInterval(importTimer.value)
      importProgress.status = 'error'
      importProgress.message = err?.message || '批量导入失败'
      ElMessage.error(importProgress.message)
    }
  },
  onError: () => {
    importFile.isUploading = false
    importProgress.status = 'error'
    importProgress.message = '文件上传失败'
    ElMessage.error('文件上传失败')
  },
  onRemove: () => {
    importResult.value = null
    importProgress = {
      percentage: 0, processed: 0, total: 0,
      successCount: 0, errorCount: 0, status: 'idle', message: '',
    }
  },
}

const simulateProgress = () => {
  clearInterval(importTimer.value)
  importTimer.value = setInterval(() => {
    if (importProgress.percentage < 85) {
      importProgress.percentage += Math.random() * 8
      importProgress.processed = Math.floor(importProgress.total * (importProgress.percentage / 100))
    }
  }, 400)
}

onBeforeUnmount(() => {
  if (importTimer.value) clearInterval(importTimer.value)
  if (renewTimer.value) clearInterval(renewTimer.value)
  if (invalidTimer.value) clearInterval(invalidTimer.value)
})

const refreshAffectedIds = async (ids: number[]) => {
  if (!ids.length) {
    loadData()
    return
  }
  refreshingIds.value = [...ids]
  try {
    const result = await getCopyrightListApi({ page: 1, pageSize: Math.max(ids.length, queryParams.pageSize) })
    const updatedMap = new Map(result.list.map((item: CopyrightItem) => [item.id, item]))
    let hasChange = false
    listData.value = listData.value.map((item) => {
      if (updatedMap.has(item.id)) {
        hasChange = true
        return updatedMap.get(item.id)!
      }
      return item
    })
    if (!hasChange) {
      await loadData()
    }
  } finally {
    refreshingIds.value = []
  }
}

const renewVisible = ref(false)
const renewForm = reactive({
  renewMonths: 12,
  targetDate: '',
  mode: 'months' as 'months' | 'date',
  reason: '',
})
const renewProgress = reactive<BatchCopyrightProgress>({
  percentage: 0, processed: 0, total: 0,
  successCount: 0, errorCount: 0, status: 'idle', message: '',
})
const renewTimer = ref<any>(null)
const renewSubmitting = ref(false)

const canRenew = computed(() => {
  if (!selectedRows.value.length) return false
  const hasExpiredPublished = selectedRows.value.some(
    (r) => r.complianceStatus === 3 && r.bindStatus === 2
  )
  return !hasExpiredPublished
})

const openRenewDialog = () => {
  if (!selectedRows.value.length) {
    ElMessage.warning('请先选择需要续期的版权记录')
    return
  }
  const hasExpiredPublished = selectedRows.value.some(
    (r) => r.complianceStatus === 3 && r.bindStatus === 2
  )
  if (hasExpiredPublished) {
    ElMessage.warning('已过期且已上架绑定的版权需要先下架后才能批量续期')
    return
  }
  renewProgress = { percentage: 0, processed: 0, total: 0, successCount: 0, errorCount: 0, status: 'idle', message: '' }
  renewForm.renewMonths = 12
  renewForm.targetDate = ''
  renewForm.mode = 'months'
  renewForm.reason = ''
  renewVisible.value = true
}

const handleBatchRenew = async () => {
  renewSubmitting.value = true
  const ids = selectedRows.value.map((r) => r.id)
  try {
    renewProgress.status = 'processing'
    renewProgress.total = ids.length
    clearInterval(renewTimer.value)
    renewTimer.value = setInterval(() => {
      if (renewProgress.percentage < 85) {
        renewProgress.percentage += Math.random() * 10
        renewProgress.processed = Math.floor(renewProgress.total * (renewProgress.percentage / 100))
        renewProgress.successCount = Math.floor(renewProgress.processed * 0.95)
      }
    }, 400)
    const params: any = { ids, reason: renewForm.reason }
    if (renewForm.mode === 'months') params.renewMonths = renewForm.renewMonths
    else params.newEndDate = renewForm.targetDate
    const result = await batchRenewCopyrightApi(params)
    clearInterval(renewTimer.value)
    renewProgress = {
      percentage: 100, processed: result.totalCount, total: result.totalCount,
      successCount: result.successCount, errorCount: result.errorCount,
      status: result.errorCount === 0 ? 'success' : (result.successCount === 0 ? 'error' : 'partial'),
      message: `批量续期完成：成功 ${result.successCount} 条，失败 ${result.errorCount} 条`,
    }
    ElMessage.success(renewProgress.message)
    await refreshAffectedIds(ids)
  } catch (err: any) {
    clearInterval(renewTimer.value)
    renewProgress.status = 'error'
    renewProgress.message = err?.message || '批量续期失败'
    ElMessage.error(renewProgress.message)
  } finally {
    renewSubmitting.value = false
  }
}

const invalidVisible = ref(false)
const invalidForm = reactive({
  invalidReason: '',
  unbindContent: true,
})
const invalidProgress = reactive<BatchCopyrightProgress>({
  percentage: 0, processed: 0, total: 0,
  successCount: 0, errorCount: 0, status: 'idle', message: '',
})
const invalidTimer = ref<any>(null)
const invalidSubmitting = ref(false)

const openInvalidDialog = () => {
  if (!selectedRows.value.length) {
    ElMessage.warning('请先选择需要标记失效的版权记录')
    return
  }
  const hasPublished = selectedRows.value.some((r) => r.bindStatus === 2)
  if (hasPublished) {
    ElMessageBox.confirm(
      '选中的版权中有已上架绑定内容，标记失效将同步解绑。是否继续？',
      '确认批量失效',
      { type: 'warning' },
    )
  }
  invalidProgress = { percentage: 0, processed: 0, total: 0, successCount: 0, errorCount: 0, status: 'idle', message: '' }
  invalidForm.invalidReason = ''
  invalidForm.unbindContent = true
  invalidVisible.value = true
}

const handleBatchInvalid = async () => {
  if (!invalidForm.invalidReason.trim()) {
    ElMessage.warning('请填写失效原因')
    return
  }
  invalidSubmitting.value = true
  const ids = selectedRows.value.map((r) => r.id)
  try {
    invalidProgress.status = 'processing'
    invalidProgress.total = ids.length
    clearInterval(invalidTimer.value)
    invalidTimer.value = setInterval(() => {
      if (invalidProgress.percentage < 85) {
        invalidProgress.percentage += Math.random() * 10
        invalidProgress.processed = Math.floor(invalidProgress.total * (invalidProgress.percentage / 100))
        invalidProgress.successCount = Math.floor(invalidProgress.processed * 0.93)
      }
    }, 400)
    const result = await batchInvalidCopyrightApi({
      ids,
      reason: invalidForm.invalidReason,
      unbindContent: invalidForm.unbindContent,
    })
    clearInterval(invalidTimer.value)
    invalidProgress = {
      percentage: 100, processed: result.totalCount, total: result.totalCount,
      successCount: result.successCount, errorCount: result.errorCount,
      status: result.errorCount === 0 ? 'success' : (result.successCount === 0 ? 'error' : 'partial'),
      message: `批量标记失效完成：成功 ${result.successCount} 条，失败 ${result.errorCount} 条`,
    }
    ElMessage.success(invalidProgress.message)
    await refreshAffectedIds(ids)
  } catch (err: any) {
    clearInterval(invalidTimer.value)
    invalidProgress.status = 'error'
    invalidProgress.message = err?.message || '批量失效失败'
    ElMessage.error(invalidProgress.message)
  } finally {
    invalidSubmitting.value = false
  }
}

const tableColumns = [
  { prop: 'id', label: 'ID', width: 70, align: 'center' },
  { prop: 'code', label: '版权编号', width: 140 },
  { prop: 'name', label: '版权名称', minWidth: 180, showOverflowTooltip: true },
  {
    prop: 'type',
    label: '版权类型',
    width: 110,
    align: 'center',
    slot: 'type',
  },
  {
    prop: 'contentType',
    label: '内容类型',
    width: 100,
    align: 'center',
    slot: 'contentType',
  },
  {
    label: '授权期限',
    width: 220,
    align: 'center',
    slot: 'period',
  },
  {
    prop: 'ownershipStatus',
    label: '权属',
    width: 100,
    align: 'center',
    slot: 'ownershipStatus',
  },
  {
    prop: 'complianceStatus',
    label: '合规',
    width: 100,
    align: 'center',
    slot: 'complianceStatus',
  },
  {
    prop: 'bindStatus',
    label: '绑定',
    width: 110,
    align: 'center',
    slot: 'bindStatus',
  },
  {
    label: '操作',
    width: 100,
    align: 'center',
    slot: 'actions',
  },
]

const downloadTemplate = () => {
  ElMessage.info('模板下载功能：请联系管理员获取版权台账模板文件')
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="copyright-batch-page">
    <div class="filter-bar">
      <el-form :inline="true" :model="queryParams" @submit.prevent>
        <el-form-item label="关键词">
          <el-input
            v-model="queryParams.keyword"
            placeholder="编号/名称/供应方"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="版权类型">
          <el-select v-model="queryParams.type" placeholder="全部" clearable style="width: 120px">
            <el-option v-for="item in getEnumOptions(COPYRIGHT_TYPE)" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="内容类型">
          <el-select v-model="queryParams.contentType" placeholder="全部" clearable style="width: 110px">
            <el-option v-for="item in getEnumOptions(COPYRIGHT_CONTENT_TYPE)" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="权属">
          <el-select v-model="queryParams.ownershipStatus" placeholder="全部" clearable style="width: 110px">
            <el-option v-for="item in getEnumOptions(COPYRIGHT_OWNERSHIP_STATUS)" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="合规">
          <el-select v-model="queryParams.complianceStatus" placeholder="全部" clearable style="width: 110px">
            <el-option v-for="item in getEnumOptions(COPYRIGHT_COMPLIANCE_STATUS)" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="绑定">
          <el-select v-model="queryParams.bindStatus" placeholder="全部" clearable style="width: 130px">
            <el-option v-for="item in getEnumOptions(COPYRIGHT_BIND_STATUS)" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="到期范围">
          <el-date-picker
            v-model="queryParams.expireRange"
            type="daterange"
            start-placeholder="起始"
            end-placeholder="截止"
            value-format="YYYY-MM-DD"
            style="width: 220px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-tabs v-model="activeTab" class="batch-tabs">
      <el-tab-pane label="批量导入版权" name="import">
        <div class="batch-action-card">
          <div class="card-header">
            <div>
              <h3 class="card-title">批量版权台账导入</h3>
              <p class="card-desc">
                支持 Excel/CSV 格式导入，系统自动容错：格式异常跳过、必填项缺失记录、版权编号重复自动更新、内容冲突自动标记
              </p>
            </div>
            <div class="card-actions">
              <el-button :icon="Download" @click="downloadTemplate">下载导入模板</el-button>
              <el-button type="primary" :icon="UploadFilled" @click="importVisible = true">选择文件导入</el-button>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="批量续期" name="renew">
        <div class="batch-action-card">
          <div class="card-header">
            <div>
              <h3 class="card-title">批量续期即将过期版权</h3>
              <p class="card-desc">
                支持按月或指定日期批量续期，自动顺延授权期限并更新合规状态，同步至内容审核与风控模块
              </p>
            </div>
            <el-button type="primary" :icon="DatePicker" :disabled="!canRenew" @click="openRenewDialog">
              {{ selectedRows.length ? `续期选中 ${selectedRows.length} 条` : '请先选择版权' }}
            </el-button>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="批量标记失效" name="invalid">
        <div class="batch-action-card">
          <div class="card-header">
            <div>
              <h3 class="card-title">批量标记失效版权</h3>
              <p class="card-desc">
                批量标记版权为失效状态，可选择是否同步解绑关联内容，系统将自动同步至内容审核与风控模块
              </p>
            </div>
            <el-button
              type="danger"
              :icon="CircleClose"
              :disabled="!selectedRows.length"
              @click="openInvalidDialog"
            >
              {{ selectedRows.length ? `标记 ${selectedRows.length} 条为失效` : '请先选择版权' }}
            </el-button>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <div class="card-content">
      <QyTableToolbar
        :loading="loading"
        :selected-count="selectedRows.length"
        @refresh="loadData"
      />

      <QyDataTable
        :columns="tableColumns"
        :data="listData"
        :loading="loading"
        :total="total"
        :page="queryParams.page"
        :page-size="queryParams.pageSize"
        :index="true"
        :selection="true"
        @page-change="handlePageChange"
        @size-change="handleSizeChange"
        @selection-change="handleSelectionChange"
      >
        <template #type="{ row }">
          <el-tag :type="getEnumItem(COPYRIGHT_TYPE, row.type)?.type || 'info'" size="small">
            {{ getEnumLabel(COPYRIGHT_TYPE, row.type) }}
          </el-tag>
        </template>
        <template #contentType="{ row }">
          <el-tag size="small" type="info" effect="plain">
            {{ getEnumLabel(COPYRIGHT_CONTENT_TYPE, row.contentType) || '-' }}
          </el-tag>
        </template>
        <template #period="{ row }">
          <div
            class="period-cell"
            :class="{ 'is-refreshing': refreshingIds.includes(row.id) }"
            style="font-size: 12px; line-height: 1.4;"
          >
            <div>
              {{ formatDate(row.startDate, 'YYYY-MM-DD') }}
            </div>
            <div style="color: #909399;">
              至 {{ formatDate(row.endDate, 'YYYY-MM-DD') }}
            </div>
          </div>
        </template>
        <template #ownershipStatus="{ row }">
          <el-tag
            :type="getEnumItem(COPYRIGHT_OWNERSHIP_STATUS, row.ownershipStatus)?.type || 'info'"
            size="small"
          >
            {{ getEnumLabel(COPYRIGHT_OWNERSHIP_STATUS, row.ownershipStatus) || '-' }}
          </el-tag>
        </template>
        <template #complianceStatus="{ row }">
          <el-tag
            :type="getEnumItem(COPYRIGHT_COMPLIANCE_STATUS, row.complianceStatus)?.type || 'info'"
            size="small"
          >
            <el-icon v-if="row.complianceStatus === 1" style="margin-right: 2px;"><CircleCheck /></el-icon>
            <el-icon v-else-if="row.complianceStatus === 2" style="margin-right: 2px;"><Bell /></el-icon>
            <el-icon v-else style="margin-right: 2px;"><CircleClose /></el-icon>
            {{ getEnumLabel(COPYRIGHT_COMPLIANCE_STATUS, row.complianceStatus) || '-' }}
          </el-tag>
        </template>
        <template #bindStatus="{ row }">
          <el-tag
            :type="getEnumItem(COPYRIGHT_BIND_STATUS, row.bindStatus)?.type || 'info'"
            size="small"
          >
            {{ getEnumLabel(COPYRIGHT_BIND_STATUS, row.bindStatus) || '未绑定' }}
          </el-tag>
        </template>
        <template #actions="{ row }">
          <span
            v-if="refreshingIds.includes(row.id)"
            style="color: #409EFF; font-size: 12px; display: inline-flex; align-items: center; gap: 4px;"
          >
            <el-icon class="is-loading"><Refresh /></el-icon> 刷新中
          </span>
          <span v-else style="color: #909399; font-size: 12px;">
            -
          </span>
        </template>
      </QyDataTable>
    </div>

    <el-dialog
      v-model="importVisible"
      title="批量导入版权台账"
      width="720px"
      :close-on-click-modal="false"
      append-to-body
    >
      <div class="import-dialog-body">
        <el-alert
          title="导入规则说明"
          type="info"
          :closable="false"
          show-icon
          class="import-rules"
        >
          <template #icon>
            <el-icon><Document /></el-icon>
          </template>
          <ul>
            <li>系统自动跳过格式异常行（日期/数值格式不正确），不会中断整体导入</li>
            <li>必填项缺失的行（版权编号/名称/有效期）会被记录到异常清单</li>
            <li>版权编号重复时，自动以最新数据更新已有记录（不会新增）</li>
            <li>同一内容ID绑定多份冲突版权时，自动记录异常不导入</li>
          </ul>
        </el-alert>

        <el-upload
          v-model:file-list="importFile.fileList"
          action="/api/v1/upload"
          :headers="{ Authorization: `Bearer ${getAuthToken()}` }"
          :limit="1"
          accept=".xlsx,.xls,.csv"
          :before-upload="importUploadHandlers.beforeUpload"
          :on-progress="importUploadHandlers.onProgress"
          :on-success="importUploadHandlers.onSuccess"
          :on-error="importUploadHandlers.onError"
          :on-remove="importUploadHandlers.onRemove"
          drag
          class="import-uploader"
        >
          <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
          <div class="el-upload__text">
            拖拽 Excel/CSV 文件到此处，或 <em>点击选择</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              仅支持 .xlsx/.xls/.csv 格式，大小不超过 20MB
            </div>
          </template>
        </el-upload>

        <div v-if="importProgress.status !== 'idle'" class="progress-section">
          <div class="progress-header">
            <span>导入进度</span>
            <span class="progress-counts">
              共 {{ importProgress.total }} 条 |
              <span class="success-text">成功 {{ importProgress.successCount }}</span> |
              <span class="error-text">失败 {{ importProgress.errorCount }}</span>
            </span>
          </div>
          <el-progress
            :percentage="Math.floor(importProgress.percentage)"
            :status="importProgress.status === 'success' ? 'success' : importProgress.status === 'error' ? 'exception' : undefined"
            :stroke-width="12"
          />
          <div v-if="importProgress.message" class="progress-message" :class="importProgress.status">
            <el-icon><SuccessFilled v-if="importProgress.status === 'success'" /><WarningFilled v-else-if="importProgress.status === 'partial'" /><CircleClose v-else /></el-icon>
            {{ importProgress.message }}
          </div>
        </div>

        <div v-if="importResult && importResult.errors?.length" class="error-list-section">
          <div class="error-list-header">
            <span style="font-weight: 600; color: #F56C6C;">异常清单（{{ importResult.errors.length }} 条）</span>
            <el-button size="small" link type="primary">下载完整异常报告</el-button>
          </div>
          <div class="error-table-wrapper">
            <el-table :data="importResult.errors.slice(0, 30)" size="small" border stripe max-height="240">
              <el-table-column prop="rowNumber" label="行号" width="70" align="center" />
              <el-table-column prop="code" label="版权编号" width="140" show-overflow-tooltip />
              <el-table-column prop="name" label="版权名称" min-width="140" show-overflow-tooltip />
              <el-table-column prop="errorType" label="错误类型" width="110" align="center">
                <template #default="{ row }">
                  <el-tag
                    :type="row.errorType === '格式异常' ? 'info' : row.errorType === '必填缺失' ? 'warning' : 'danger'"
                    size="small"
                  >
                    {{ row.errorType }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="errorMessage" label="错误详情" min-width="200" show-overflow-tooltip />
            </el-table>
            <div v-if="importResult.errors.length > 30" class="more-errors-note">
              仅显示前 30 条异常，共 {{ importResult.errors.length }} 条，请下载完整报告查看
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="importVisible = false">
          {{ importProgress.status === 'processing' ? '后台继续' : '关闭' }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="renewVisible"
      title="批量版权续期"
      width="560px"
      :close-on-click-modal="false"
      append-to-body
    >
      <el-form :model="renewForm" label-width="110px">
        <el-alert
          title="续期前请确认"
          type="warning"
          :closable="false"
          show-icon
          style="margin-bottom: 16px;"
        >
          已选择 {{ selectedRows.length }} 条版权记录进行续期。续期后将自动更新合规状态并同步至内容审核与风控模块。
        </el-alert>
        <el-form-item label="续期方式">
          <el-radio-group v-model="renewForm.mode">
            <el-radio value="months">按月续期</el-radio>
            <el-radio value="date">指定到期日</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="renewForm.mode === 'months'" label="续期月数">
          <el-input-number v-model="renewForm.renewMonths" :min="1" :max="120" :step="1" />
          <span style="margin-left: 8px; color: #909399;">个月</span>
        </el-form-item>
        <el-form-item v-else label="新到期日">
          <el-date-picker
            v-model="renewForm.targetDate"
            type="date"
            placeholder="请选择新的授权到期日"
            value-format="YYYY-MM-DD"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item label="续期原因">
          <el-input v-model="renewForm.reason" type="textarea" :rows="3" placeholder="选填，备注续期原因" maxlength="500" />
        </el-form-item>
      </el-form>

      <div v-if="renewProgress.status !== 'idle'" class="progress-section" style="margin-top: 16px;">
        <div class="progress-header">
          <span>续期进度</span>
          <span class="progress-counts">
            <span class="success-text">成功 {{ renewProgress.successCount }}</span> |
            <span class="error-text">失败 {{ renewProgress.errorCount }}</span>
          </span>
        </div>
        <el-progress
          :percentage="Math.floor(renewProgress.percentage)"
          :status="renewProgress.status === 'success' ? 'success' : renewProgress.status === 'error' ? 'exception' : undefined"
          :stroke-width="10"
        />
        <div v-if="renewProgress.message" class="progress-message" :class="renewProgress.status">
          {{ renewProgress.message }}
        </div>
      </div>

      <template #footer>
        <el-button
          @click="renewVisible = false"
          :disabled="renewSubmitting"
        >
          {{ renewProgress.status === 'processing' ? '后台继续' : '取消' }}
        </el-button>
        <el-button
          type="primary"
          :loading="renewSubmitting"
          :disabled="renewProgress.status === 'processing'"
          @click="handleBatchRenew"
        >
          {{ renewSubmitting ? '续期中...' : '确认续期' }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="invalidVisible"
      title="批量标记版权失效"
      width="560px"
      :close-on-click-modal="false"
      append-to-body
    >
      <el-form :model="invalidForm" label-width="120px">
        <el-alert
          title="危险操作确认"
          type="error"
          :closable="false"
          show-icon
          style="margin-bottom: 16px;"
        >
          将 {{ selectedRows.length }} 条版权标记为失效状态，操作完成后无法恢复。
        </el-alert>
        <el-form-item label="失效原因" required>
          <el-input
            v-model="invalidForm.invalidReason"
            type="textarea"
            :rows="3"
            placeholder="必填，填写失效原因（如：合同终止、版权到期等）"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="解绑关联内容">
          <el-switch v-model="invalidForm.unbindContent" active-text="同时解绑内容" inactive-text="仅标记版权失效" />
        </el-form-item>
      </el-form>

      <div v-if="invalidProgress.status !== 'idle'" class="progress-section" style="margin-top: 16px;">
        <div class="progress-header">
          <span>处理进度</span>
          <span class="progress-counts">
            <span class="success-text">成功 {{ invalidProgress.successCount }}</span> |
            <span class="error-text">失败 {{ invalidProgress.errorCount }}</span>
          </span>
        </div>
        <el-progress
          :percentage="Math.floor(invalidProgress.percentage)"
          :status="invalidProgress.status === 'success' ? 'success' : invalidProgress.status === 'error' ? 'exception' : undefined"
          :stroke-width="10"
        />
        <div v-if="invalidProgress.message" class="progress-message" :class="invalidProgress.status">
          {{ invalidProgress.message }}
        </div>
      </div>

      <template #footer>
        <el-button
          @click="invalidVisible = false"
          :disabled="invalidSubmitting"
        >
          {{ invalidProgress.status === 'processing' ? '后台继续' : '取消' }}
        </el-button>
        <el-button
          type="danger"
          :loading="invalidSubmitting"
          :disabled="invalidProgress.status === 'processing' || !invalidForm.invalidReason.trim()"
          @click="handleBatchInvalid"
        >
          {{ invalidSubmitting ? '处理中...' : '确认标记失效' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.copyright-batch-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.batch-tabs {
  background: #fff;
  border-radius: 6px;
  padding: 0 16px;

  :deep(.el-tabs__nav-wrap::after) {
    background-color: $border-color-lighter;
  }
}

.batch-action-card {
  padding: 4px 0 16px 0;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 24px;

    h3.card-title {
      margin: 0 0 6px 0;
      font-size: 16px;
      font-weight: 600;
      color: $text-primary;
    }

    p.card-desc {
      margin: 0;
      font-size: $font-sm;
      color: $text-secondary;
      line-height: 1.6;
      max-width: 700px;
    }
  }
}

.import-dialog-body {
  .import-rules {
    margin-bottom: 20px;

    ul {
      margin: 6px 0 0 0;
      padding-left: 18px;
      font-size: $font-sm;
      color: $text-secondary;
      line-height: 1.8;
    }
  }

  .import-uploader {
    margin-bottom: 20px;
  }

  .progress-section {
    margin-bottom: 16px;
    padding: 12px;
    background: #FAFBFC;
    border-radius: 6px;
    border: 1px solid $border-color-lighter;

    .progress-header {
      display: flex;
      justify-content: space-between;
      font-size: $font-sm;
      margin-bottom: 8px;
      font-weight: 500;

      .progress-counts {
        font-weight: 400;
        font-size: $font-xs;
        color: $text-secondary;

        .success-text { color: $success-color; }
        .error-text { color: $danger-color; }
      }
    }

    .progress-message {
      margin-top: 10px;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: $font-sm;
      display: flex;
      align-items: center;
      gap: 6px;

      &.success { background: rgba(103, 194, 58, 0.1); color: $success-color; }
      &.partial { background: rgba(230, 162, 60, 0.1); color: $warning-color; }
      &.error, &.exception { background: rgba(245, 108, 108, 0.1); color: $danger-color; }
      &.processing { background: rgba(64, 158, 255, 0.1); color: $primary-color; }
    }
  }

  .error-list-section {
    margin-top: 4px;

    .error-list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }

    .error-table-wrapper {
      border: 1px solid $border-color-lighter;
      border-radius: 4px;
      overflow: hidden;
    }

    .more-errors-note {
      padding: 8px 12px;
      text-align: center;
      font-size: $font-xs;
      color: $text-secondary;
      background: #FAFBFC;
      border-top: 1px solid $border-color-lighter;
    }
  }
}

.period-cell {
  position: relative;
  padding: 2px 0;

  &.is-refreshing {
    animation: rowPulse 1.2s ease-in-out infinite;

    &::before {
      content: '';
      position: absolute;
      inset: -4px -8px;
      background: linear-gradient(90deg, rgba(64, 158, 255, 0.05), rgba(64, 158, 255, 0.15), rgba(64, 158, 255, 0.05));
      background-size: 200% 100%;
      animation: loadingShimmer 1.2s linear infinite;
      border-radius: 4px;
      z-index: -1;
    }
  }
}

@keyframes rowPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

@keyframes loadingShimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
</style>
