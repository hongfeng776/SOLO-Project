<template>
  <div class="page-container">
    <div class="page-toolbar">
      <el-button type="success" @click="handleExport">
        <el-icon><Download /></el-icon>
        导出
      </el-button>
      <el-button @click="handleRefresh" :loading="refreshLoading">
        <el-icon><Refresh /></el-icon>
        刷新
      </el-button>
    </div>

    <FinFilter :filters="filterConfig" @search="handleSearch" @reset="handleReset" />

    <FinTable
      ref="tableRef"
      :columns="tableColumns"
      :data="tableData"
      :loading="loading"
      :pagination="pagination"
      :show-index="true"
      @page-change="handlePageChange"
      @size-change="handleSizeChange"
    >
      <template #status="{ row }">
        <el-tag :type="getLogStatusColor(row.status)" effect="light">
          {{ getLogStatusLabel(row.status) }}
        </el-tag>
      </template>

      <template #action="{ row }">
        <el-button type="primary" link @click="handleView(row)">
          查看详情
        </el-button>
      </template>
    </FinTable>

    <FinDialog
      v-model:visible="detailDialogVisible"
      title="操作日志详情"
      width="800px"
      :hide-footer="true"
    >
      <el-descriptions v-if="currentDetail" :column="2" border>
        <el-descriptions-item label="用户名">
          {{ currentDetail.username }}
        </el-descriptions-item>
        <el-descriptions-item label="操作时间">
          {{ formatDateTime(currentDetail.createdAt) }}
        </el-descriptions-item>
        <el-descriptions-item label="模块">
          {{ getLogModuleLabel(currentDetail.module) }}
        </el-descriptions-item>
        <el-descriptions-item label="操作">
          {{ getLogActionLabel(currentDetail.action) }}
        </el-descriptions-item>
        <el-descriptions-item label="目标类型">
          {{ currentDetail.targetType || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="目标ID">
          {{ currentDetail.targetId || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="IP地址">
          {{ currentDetail.ipAddress }}
        </el-descriptions-item>
        <el-descriptions-item label="操作状态">
          <el-tag :type="getLogStatusColor(currentDetail.status)" effect="light">
            {{ getLogStatusLabel(currentDetail.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="耗时">
          {{ currentDetail.durationMs }} ms
        </el-descriptions-item>
        <el-descriptions-item label="错误信息" v-if="currentDetail.errorMessage">
          <span class="error-text">{{ currentDetail.errorMessage }}</span>
        </el-descriptions-item>
      </el-descriptions>
      <el-tabs v-if="currentDetail" class="detail-tabs">
        <el-tab-pane label="请求参数" name="request">
          <pre class="json-content">{{ formatJson(currentDetail.requestParams) }}</pre>
        </el-tab-pane>
        <el-tab-pane label="响应数据" name="response">
          <pre class="json-content">{{ formatJson(currentDetail.responseData) }}</pre>
        </el-tab-pane>
      </el-tabs>
    </FinDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, Refresh } from '@element-plus/icons-vue'
import FinFilter from '@/components/common/FinFilter.vue'
import FinTable from '@/components/common/FinTable.vue'
import FinDialog from '@/components/common/FinDialog.vue'
import { formatDateTime } from '@/utils/format'
import {
  LOG_STATUS_LABELS,
  LOG_STATUS_COLORS,
  LOG_MODULE_LABELS,
  LOG_ACTION_LABELS
} from '@/constants/dictionaries'
import { LogStatus, LogModule, LogAction } from '@/enums'
import * as logApi from '@/api/operationLog'
import type { IOperationLog } from '@/types/api'
import { DEFAULT_PAGE_SIZE, PAGE_SIZES } from '@/constants'

const loading = ref(false)
const refreshLoading = ref(false)
const tableData = ref<IOperationLog[]>([])
const searchParams = reactive<Record<string, any>>({})
const detailDialogVisible = ref(false)
const currentDetail = ref<IOperationLog | null>(null)

const pagination = reactive({
  show: true,
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  total: 0,
  pageSizes: PAGE_SIZES
})

const filterConfig = [
  {
    prop: 'username',
    label: '用户名',
    type: 'input' as const,
    placeholder: '请输入用户名关键字'
  },
  {
    prop: 'module',
    label: '模块',
    type: 'select' as const,
    options: [
      { label: '认证', value: LogModule.AUTH },
      { label: '用户管理', value: LogModule.USER },
      { label: '角色管理', value: LogModule.ROLE },
      { label: '权限管理', value: LogModule.PERMISSION },
      { label: '客户管理', value: LogModule.CUSTOMER },
      { label: '交易管理', value: LogModule.TRADE },
      { label: '产品管理', value: LogModule.PRODUCT },
      { label: '行情管理', value: LogModule.STOCK },
      { label: '系统管理', value: LogModule.SYSTEM }
    ]
  },
  {
    prop: 'action',
    label: '操作类型',
    type: 'select' as const,
    options: [
      { label: '登录', value: LogAction.LOGIN },
      { label: '登出', value: LogAction.LOGOUT },
      { label: '创建', value: LogAction.CREATE },
      { label: '更新', value: LogAction.UPDATE },
      { label: '删除', value: LogAction.DELETE },
      { label: '导出', value: LogAction.EXPORT },
      { label: '导入', value: LogAction.IMPORT },
      { label: '审核', value: LogAction.AUDIT }
    ]
  },
  {
    prop: 'status',
    label: '操作状态',
    type: 'select' as const,
    options: [
      { label: '成功', value: LogStatus.SUCCESS },
      { label: '失败', value: LogStatus.FAILED }
    ]
  },
  {
    prop: 'dateRange',
    label: '日期范围',
    type: 'daterange' as const
  }
]

const tableColumns = [
  { prop: 'username', label: '用户名', minWidth: 100 },
  { prop: 'module', label: '模块', minWidth: 100, align: 'center' },
  { prop: 'action', label: '操作', minWidth: 100, align: 'center' },
  { prop: 'targetType', label: '目标类型', minWidth: 100 },
  { prop: 'targetId', label: '目标ID', minWidth: 100 },
  { prop: 'ipAddress', label: 'IP地址', minWidth: 130 },
  { prop: 'status', label: '操作状态', minWidth: 90, slot: 'status', align: 'center' },
  { prop: 'durationMs', label: '耗时(ms)', minWidth: 90, align: 'right' },
  { prop: 'errorMessage', label: '错误信息', minWidth: 200, showOverflowTooltip: true },
  { prop: 'createdAt', label: '操作时间', minWidth: 160, type: 'datetime' as const }
]

function getLogStatusLabel(status: string): string {
  return LOG_STATUS_LABELS[status as LogStatus] || status
}

function getLogStatusColor(status: string): string {
  return LOG_STATUS_COLORS[status as LogStatus] || 'info'
}

function getLogModuleLabel(module: string): string {
  return LOG_MODULE_LABELS[module as LogModule] || module
}

function getLogActionLabel(action: string): string {
  return LOG_ACTION_LABELS[action as LogAction] || action
}

function formatJson(data: any): string {
  if (!data) return '无数据'
  try {
    return JSON.stringify(data, null, 2)
  } catch {
    return String(data)
  }
}

async function fetchData() {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchParams
    }
    if (searchParams.dateRange && Array.isArray(searchParams.dateRange)) {
      params.startDate = searchParams.dateRange[0]
      params.endDate = searchParams.dateRange[1]
    }
    const res = await logApi.getLogList(params)
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

function handlePageChange(page: number) {
  pagination.page = page
  fetchData()
}

function handleSizeChange(size: number) {
  pagination.pageSize = size
  pagination.page = 1
  fetchData()
}

let lastRefreshTime = 0
function handleRefresh() {
  const now = Date.now()
  if (now - lastRefreshTime < 3000) {
    ElMessage.warning('操作过于频繁，请稍后再试')
    return
  }
  lastRefreshTime = now
  refreshLoading.value = true
  fetchData().finally(() => {
    refreshLoading.value = false
  })
}

async function handleView(row: IOperationLog) {
  try {
    const res = await logApi.getLogById(row.id)
    if (res.code === 0) {
      currentDetail.value = res.data
      detailDialogVisible.value = true
    } else {
      ElMessage.error(res.message)
    }
  } catch (error) {
    ElMessage.error('获取详情失败')
  }
}

async function handleExport() {
  try {
    const blob = await logApi.exportLogList(searchParams)
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `操作日志_${Date.now()}.xlsx`
    link.click()
    window.URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.page-toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.error-text {
  color: var(--fin-danger);
}

.detail-tabs {
  margin-top: 16px;
}

.json-content {
  background-color: #f5f7fa;
  padding: 16px;
  border-radius: 4px;
  font-size: 13px;
  line-height: 1.6;
  max-height: 400px;
  overflow: auto;
  margin: 0;
  color: var(--fin-text-primary);
}
</style>
