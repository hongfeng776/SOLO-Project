<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import QyDataTable from '@/components/QyDataTable/index.vue'
import QyTableToolbar from '@/components/QyTableToolbar/index.vue'
import {
  COPYRIGHT_TYPE,
  COPYRIGHT_CONTENT_TYPE,
  VALIDITY_STATUS,
  BATCH_VALIDITY_ACTION,
  ENVIRONMENT_MODE,
  VALIDITY_BATCH_STATUS,
  getEnumOptions,
  getEnumLabel,
  getEnumItem,
} from '@/constants/enums'
import {
  getValidityCopyrightListApi,
  executeValidityBatchApi,
  getValidityBatchTasksApi,
  getValidityBatchTaskDetailApi,
} from '@/api/copyright'
import type { ValidityCopyrightItem, ValidityBatchTask, ValidityBatchParams } from '@/types'
import { formatDate } from '@/utils'
import {
  Refresh, Search, Download, Clock, Warning, Files,
  CircleCheck, CircleClose, View, Document,
  Calendar, SwitchButton, Timer, Close,
} from '@element-plus/icons-vue'

const loading = ref(false)
const listData = ref<ValidityCopyrightItem[]>([])
const total = ref(0)
const selectedRows = ref<ValidityCopyrightItem[]>([])
const currentRow = ref<ValidityCopyrightItem | null>(null)

const environmentMode = ref<'test' | 'prod'>('test')
const environmentOptions = computed(() => [
  { label: '测试环境', value: 'test' },
  { label: '正式环境', value: 'prod' },
])

const queryParams = reactive({
  page: 1,
  pageSize: 10,
  copyrightTypes: [] as number[],
  validityStatuses: [] as (1 | 2 | 3)[],
  minRemainingDays: null as number | null,
  maxRemainingDays: null as number | null,
  minRelatedCount: null as number | null,
  maxRelatedCount: null as number | null,
})

const remainingDaysRange = ref<[number, number]>([0, 365])
const quickRangeOptions = [
  { label: '0~7天', min: 0, max: 7 },
  { label: '7~30天', min: 7, max: 30 },
  { label: '30~90天', min: 30, max: 90 },
  { label: '90天以上', min: 90, max: 3650 },
]

const stats = reactive({
  matchedCount: 0,
  selectedCount: 0,
  withPublishedCount: 0,
  affectedContentCount: 0,
})

watch(selectedRows, (rows) => {
  stats.selectedCount = rows.length
  stats.withPublishedCount = rows.filter(r => r.publishedContentCount > 0).length
  stats.affectedContentCount = rows.reduce((sum, r) => sum + r.relatedContentCount, 0)
}, { deep: true })

const updateMatchedStats = async () => {
  try {
    const result = await getValidityCopyrightListApi({
      page: 1,
      pageSize: 1,
      copyrightTypes: queryParams.copyrightTypes.length ? undefined : undefined,
      copyrightType: queryParams.copyrightTypes.length ? queryParams.copyrightTypes[0] : undefined,
      validityStatus: queryParams.validityStatuses.length ? queryParams.validityStatuses[0] : undefined,
      minRemainingDays: queryParams.minRemainingDays ?? undefined,
      maxRemainingDays: queryParams.maxRemainingDays ?? undefined,
      minRelatedCount: queryParams.minRelatedCount ?? undefined,
    })
    stats.matchedCount = result.pagination.total
  } catch (e) {
    stats.matchedCount = total.value
  }
}

const loadData = async () => {
  loading.value = true
  try {
    const params: any = {
      page: queryParams.page,
      pageSize: queryParams.pageSize,
      minRemainingDays: queryParams.minRemainingDays ?? undefined,
      maxRemainingDays: queryParams.maxRemainingDays ?? undefined,
      minRelatedCount: queryParams.minRelatedCount ?? undefined,
    }
    if (queryParams.copyrightTypes.length) {
      params.copyrightType = queryParams.copyrightTypes[0]
    }
    if (queryParams.validityStatuses.length) {
      params.validityStatus = queryParams.validityStatuses[0]
    }
    const result = await getValidityCopyrightListApi(params)
    listData.value = result.list
    total.value = result.pagination.total
    stats.matchedCount = result.pagination.total
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  queryParams.page = 1
  if (selectedRows.value.length) {
    selectedRows.value = []
    ElMessage.info('已清空已选版权记录')
  }
  loadData()
}

const handleReset = () => {
  queryParams.copyrightTypes = []
  queryParams.validityStatuses = []
  remainingDaysRange.value = [0, 365]
  queryParams.minRemainingDays = null
  queryParams.maxRemainingDays = null
  queryParams.minRelatedCount = null
  queryParams.maxRelatedCount = null
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

const handleSelectionChange = (rows: ValidityCopyrightItem[]) => {
  selectedRows.value = rows
}

const handleCurrentChange = (row: ValidityCopyrightItem) => {
  currentRow.value = row
}

const handleEnvironmentChange = async (val: string) => {
  if (val === 'prod') {
    try {
      await ElMessageBox.confirm(
        '确定切至正式环境？下架/归档操作不可逆',
        '环境切换确认',
        {
          type: 'error',
          confirmButtonText: '确认切换',
          cancelButtonText: '取消',
        }
      )
    } catch {
      environmentMode.value = 'test'
      return
    }
  }
  environmentMode.value = val as 'test' | 'prod'
  if (selectedRows.value.length) {
    selectedRows.value = []
    ElMessage.info('环境切换，已清空已选版权记录')
  }
}

const applyQuickRange = (opt: { min: number; max: number }) => {
  remainingDaysRange.value = [opt.min, opt.max]
  queryParams.minRemainingDays = opt.min
  queryParams.maxRemainingDays = opt.max === 3650 ? null : opt.max
}

watch(remainingDaysRange, (val) => {
  queryParams.minRemainingDays = val[0]
  queryParams.maxRemainingDays = val[1] === 3650 ? null : val[1]
})

const renewVisible = ref(false)
const renewForm = reactive({
  renewMonths: 12,
  remark: '',
})
const renewSubmitting = ref(false)

const openRenewDialog = () => {
  if (!selectedRows.value.length) {
    ElMessage.warning('请先选择需要续期的版权记录')
    return
  }
  renewForm.renewMonths = 12
  renewForm.remark = ''
  renewVisible.value = true
}

const offlineConfirmVisible = ref(false)
const archiveConfirmVisible = ref(false)
const scanConfirmVisible = ref(false)

const openOfflineConfirm = () => {
  if (!selectedRows.value.length) {
    ElMessage.warning('请先选择需要下架的版权记录')
    return
  }
  offlineConfirmVisible.value = true
}

const openArchiveConfirm = () => {
  if (!selectedRows.value.length) {
    ElMessage.warning('请先选择需要归档的版权记录')
    return
  }
  archiveConfirmVisible.value = true
}

const openScanConfirm = () => {
  if (!selectedRows.value.length) {
    ElMessage.warning('请先选择需要筛查的版权记录')
    return
  }
  scanConfirmVisible.value = true
}

const batchProgress = reactive({
  visible: false,
  taskId: null as number | string | null,
  action: '' as string,
  actionLabel: '',
  total: 0,
  processed: 0,
  successCount: 0,
  failedCount: 0,
  percentage: 0,
  estimatedRemainingMs: 0,
  status: 'idle' as 'idle' | 'running' | 'completed' | 'failed' | 'cancelled',
  timer: null as any,
  startedAt: 0,
})

const estimatedRemainingText = computed(() => {
  const ms = batchProgress.estimatedRemainingMs
  if (ms <= 0) return '计算中...'
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  if (hours > 0) return `约 ${hours} 小时 ${minutes % 60} 分钟`
  if (minutes > 0) return `约 ${minutes} 分钟 ${seconds % 60} 秒`
  return `约 ${seconds} 秒`
})

const startBatchProgress = (task: ValidityBatchTask) => {
  batchProgress.visible = true
  batchProgress.taskId = task.id
  batchProgress.action = task.action
  batchProgress.actionLabel = task.actionLabel
  batchProgress.total = task.totalCount
  batchProgress.processed = task.processedCount
  batchProgress.successCount = task.successCount
  batchProgress.failedCount = task.failedCount
  batchProgress.percentage = task.progress
  batchProgress.estimatedRemainingMs = task.estimatedRemainingMs || 0
  batchProgress.status = 'running'
  batchProgress.startedAt = Date.now()
  clearInterval(batchProgress.timer)
  batchProgress.timer = setInterval(pollTaskProgress, 2000)
}

const pollTaskProgress = async () => {
  if (!batchProgress.taskId) return
  try {
    const task = await getValidityBatchTaskDetailApi(batchProgress.taskId)
    batchProgress.processed = task.processedCount
    batchProgress.successCount = task.successCount
    batchProgress.failedCount = task.failedCount
    batchProgress.percentage = task.progress
    batchProgress.estimatedRemainingMs = task.estimatedRemainingMs || 0
    if (['completed', 'partial', 'failed', 'cancelled'].includes(task.status)) {
      batchProgress.status = task.status as any
      clearInterval(batchProgress.timer)
      ElMessage.success(`批次任务${task.status === 'completed' ? '全部' : task.status === 'partial' ? '部分' : ''}完成：成功 ${task.successCount} 条，失败 ${task.failedCount} 条`)
      loadData()
      loadBatchTasks()
    }
  } catch (e) {
  }
}

const cancelBatchTask = async () => {
  try {
    await ElMessageBox.confirm('确定取消正在执行的批次任务吗？', '取消确认', { type: 'warning' })
    clearInterval(batchProgress.timer)
    batchProgress.status = 'cancelled'
    batchProgress.visible = false
    ElMessage.info('已发起取消请求')
    loadBatchTasks()
  } catch {
  }
}

onBeforeUnmount(() => {
  clearInterval(batchProgress.timer)
  clearInterval(batchTasksTimer)
})

const executeBatchAction = async (action: string, extraParams: Partial<ValidityBatchParams> = {}) => {
  const ids = selectedRows.value.map(r => r.id)
  const params: ValidityBatchParams = {
    action: action as any,
    ids,
    environmentMode: environmentMode.value,
    ...extraParams,
  }
  try {
    const result = await executeValidityBatchApi(params)
    if (result.task) {
      startBatchProgress(result.task)
    }
  } catch (err: any) {
    ElMessage.error(err?.message || '批量操作失败')
  }
}

const handleBatchRenew = async () => {
  renewSubmitting.value = true
  try {
    await executeBatchAction('renew_warning', {
      renewMonths: renewForm.renewMonths,
      operatorRemark: renewForm.remark,
    })
    renewVisible.value = false
  } finally {
    renewSubmitting.value = false
  }
}

const handleBatchOffline = async () => {
  offlineConfirmVisible.value = false
  await executeBatchAction('offline_expired')
}

const handleBatchArchive = async () => {
  archiveConfirmVisible.value = false
  await executeBatchAction('archive_expired')
}

const handleBatchScan = async () => {
  scanConfirmVisible.value = false
  await executeBatchAction('trigger_scan')
}

const drawerVisible = ref(false)
const batchTasks = ref<ValidityBatchTask[]>([])
const batchTasksLoading = ref(false)
const batchTasksTimer = ref<any>(null)
const expandedTaskId = ref<number | string | null>(null)

const loadBatchTasks = async () => {
  batchTasksLoading.value = true
  try {
    const result = await getValidityBatchTasksApi({
      page: 1,
      pageSize: 20,
      environmentMode: environmentMode.value,
    })
    batchTasks.value = result.list
  } finally {
    batchTasksLoading.value = false
  }
}

const openDrawer = () => {
  drawerVisible.value = true
  loadBatchTasks()
  clearInterval(batchTasksTimer)
  batchTasksTimer.value = setInterval(loadBatchTasks, 10000)
}

watch(drawerVisible, (val) => {
  if (!val) clearInterval(batchTasksTimer)
})

const toggleTaskExpand = (task: ValidityBatchTask) => {
  expandedTaskId.value = expandedTaskId.value === task.id ? null : task.id
}

const getDaysColor = (days: number) => {
  if (days < 7) return '#F56C6C'
  if (days < 30) return '#E6A23C'
  return '#67C23A'
}

const tableRowClassName = ({ row, rowIndex }: { row: ValidityCopyrightItem; rowIndex: number }) => {
  const isSelected = selectedRows.value.some(r => r.id === row.id)
  const isCurrent = currentRow.value?.id === row.id
  let cls = rowIndex % 2 === 0 ? 'even-row' : 'odd-row'
  if (isSelected) cls += ' selected-row'
  if (isCurrent) cls += ' current-row'
  return cls
}

const tableColumns = [
  { prop: 'id', label: 'ID', width: 70, align: 'center' },
  { prop: 'code', label: '版权编号', width: 140 },
  { prop: 'name', label: '版权名称', minWidth: 180, showOverflowTooltip: true },
  { prop: 'type', label: '版权类型', width: 110, align: 'center', slot: 'type' },
  { prop: 'contentType', label: '版权品类', width: 100, align: 'center', slot: 'contentType' },
  { label: '剩余天数', width: 110, align: 'center', slot: 'remainingDays', sortable: 'custom' },
  { prop: 'relatedContentCount', label: '关联内容数', width: 110, align: 'center' },
  { prop: 'publishedContentCount', label: '已上架数', width: 100, align: 'center' },
  { prop: 'validityStatus', label: '有效期状态', width: 120, align: 'center', slot: 'validityStatus' },
  { label: '最近变更时间', width: 170, align: 'center', slot: 'lastChangeTime' },
  { label: '操作', width: 140, align: 'center', slot: 'actions', fixed: 'right' },
]

const openSingleRenew = (row: ValidityCopyrightItem) => {
  selectedRows.value = [row]
  openRenewDialog()
}

const openSingleOffline = (row: ValidityCopyrightItem) => {
  selectedRows.value = [row]
  openOfflineConfirm()
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="validity-batch-page">
    <div class="environment-switch-card">
      <div class="env-switch-row">
        <div class="env-label">
          <el-icon style="margin-right: 6px;"><SwitchButton /></el-icon>
          <span>运行环境模式</span>
        </div>
        <el-segmented
          v-model="environmentMode"
          :options="environmentOptions"
          block
          @change="handleEnvironmentChange"
        />
      </div>
      <el-alert
        v-if="environmentMode === 'test'"
        title="当前为测试演练，所有操作不落库不影响线上，可放心批量验证"
        type="info"
        :closable="false"
        show-icon
        class="env-alert env-alert-test"
      />
      <el-alert
        v-else
        title="当前为正式环境，下架/归档等操作将真实执行且不可逆，请谨慎操作"
        type="error"
        :closable="false"
        show-icon
        class="env-alert env-alert-prod"
      />
    </div>

    <div class="filter-card">
      <div class="filter-card-header">
        <h3 class="filter-title">批量条件筛选</h3>
      </div>
      <div class="filter-card-body">
        <el-form :inline="true" label-width="100px" @submit.prevent>
          <el-form-item label="版权品类">
            <el-select
              v-model="queryParams.copyrightTypes"
              multiple
              collapse-tags
              collapse-tags-tooltip
              placeholder="请选择"
              style="width: 280px"
            >
              <el-option
                v-for="item in getEnumOptions(COPYRIGHT_TYPE)"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="有效期状态">
            <el-select
              v-model="queryParams.validityStatuses"
              multiple
              collapse-tags
              collapse-tags-tooltip
              placeholder="请选择"
              style="width: 240px"
            >
              <el-option
                v-for="item in getEnumOptions(VALIDITY_STATUS)"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="关联内容数量">
            <el-input-number
              v-model="queryParams.minRelatedCount"
              :min="0"
              :max="10000"
              size="small"
              placeholder="最小"
              style="width: 110px"
            />
            <span class="range-separator">至</span>
            <el-input-number
              v-model="queryParams.maxRelatedCount"
              :min="0"
              :max="10000"
              size="small"
              placeholder="最大"
              style="width: 110px"
            />
          </el-form-item>
        </el-form>
        <div class="remaining-days-row">
          <div class="form-item-label" style="width: 100px;">剩余时长</div>
          <div class="remaining-days-content">
            <div class="quick-tags">
              <el-tag
                v-for="opt in quickRangeOptions"
                :key="opt.label"
                :type="remainingDaysRange[0] === opt.min && remainingDaysRange[1] === opt.max ? 'primary' : 'info'"
                effect="plain"
                class="quick-tag"
                @click="applyQuickRange(opt)"
              >
                {{ opt.label }}
              </el-tag>
            </div>
            <div class="slider-wrapper">
              <span class="range-value">{{ remainingDaysRange[0] }}天</span>
              <el-slider
                v-model="remainingDaysRange"
                range
                :min="0"
                :max="365"
                :step="1"
                style="flex: 1; margin: 0 16px;"
              />
              <span class="range-value">{{ remainingDaysRange[1] >= 3650 ? '不限' : remainingDaysRange[1] + '天' }}</span>
            </div>
          </div>
        </div>
        <div class="filter-actions-row">
          <el-button type="primary" :icon="Search" @click="handleSearch">应用筛选</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置条件</el-button>
          <el-button type="primary" plain :icon="Files" @click="openDrawer">查看批量任务历史</el-button>
        </div>
      </div>
    </div>

    <div class="stats-card">
      <div class="stat-item">
        <el-statistic title="满足条件版权数" :value="stats.matchedCount">
          <template #suffix>条</template>
        </el-statistic>
      </div>
      <el-divider direction="vertical" class="stat-divider" />
      <div class="stat-item">
        <el-statistic title="已选中版权" :value="stats.selectedCount" value-color="#409EFF">
          <template #suffix>条</template>
        </el-statistic>
      </div>
      <el-divider direction="vertical" class="stat-divider" />
      <div class="stat-item">
        <el-statistic title="含已上架内容数" :value="stats.withPublishedCount" value-color="#E6A23C">
          <template #suffix>条</template>
        </el-statistic>
      </div>
      <el-divider direction="vertical" class="stat-divider" />
      <div class="stat-item">
        <el-statistic title="预期影响内容数" :value="stats.affectedContentCount" value-color="#67C23A">
          <template #suffix>个</template>
        </el-statistic>
      </div>
    </div>

    <div class="action-bar">
      <el-tooltip :content="selectedRows.length ? '' : '请先选择版权记录'">
        <el-button
          type="success"
          size="large"
          :icon="Calendar"
          :disabled="!selectedRows.length"
          @click="openRenewDialog"
        >
          批量续期（预警版权）
        </el-button>
      </el-tooltip>
      <el-tooltip :content="selectedRows.length ? '' : '请先选择版权记录'">
        <el-button
          type="warning"
          size="large"
          :icon="CircleClose"
          :disabled="!selectedRows.length"
          @click="openOfflineConfirm"
        >
          批量下架过期内容
        </el-button>
      </el-tooltip>
      <el-tooltip :content="selectedRows.length ? '' : '请先选择版权记录'">
        <el-button
          type="info"
          size="large"
          :icon="Files"
          :disabled="!selectedRows.length"
          @click="openArchiveConfirm"
        >
          批量归档过期台账
        </el-button>
      </el-tooltip>
      <el-tooltip :content="selectedRows.length ? '' : '请先选择版权记录'">
        <el-button
          type="primary"
          size="large"
          :icon="Timer"
          :disabled="!selectedRows.length"
          @click="openScanConfirm"
        >
          批量触发全量筛查
        </el-button>
      </el-tooltip>
    </div>

    <div class="card-content">
      <QyTableToolbar
        :loading="loading"
        :selected-count="selectedRows.length"
        :show-create="false"
        @refresh="loadData"
      />

      <QyDataTable
        :columns="tableColumns"
        :data="listData"
        :loading="loading"
        :total="total"
        :page="queryParams.page"
        :page-size="queryParams.pageSize"
        :selection="true"
        :index="true"
        :stripe="false"
        highlight-current-row
        :row-class-name="tableRowClassName"
        @page-change="handlePageChange"
        @size-change="handleSizeChange"
        @selection-change="handleSelectionChange"
        @row-click="handleCurrentChange"
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
        <template #remainingDays="{ row }">
          <span class="remaining-days" :style="{ color: getDaysColor(row.remainingDays), fontWeight: 600 }">
            {{ row.remainingDays }} 天
          </span>
        </template>
        <template #validityStatus="{ row }">
          <el-tag
            :type="getEnumItem(VALIDITY_STATUS, row.validityStatus)?.type || 'info'"
            size="small"
          >
            <el-icon v-if="row.validityStatus === 1" style="margin-right: 2px;"><CircleCheck /></el-icon>
            <el-icon v-else-if="row.validityStatus === 2" style="margin-right: 2px;"><Clock /></el-icon>
            <el-icon v-else style="margin-right: 2px;"><Warning /></el-icon>
            {{ getEnumLabel(VALIDITY_STATUS, row.validityStatus) }}
          </el-tag>
        </template>
        <template #lastChangeTime="{ row }">
          <div style="font-size: 12px; line-height: 1.4;">
            <div>{{ formatDate(row.lastStatusChangeAt || row.updatedAt, 'YYYY-MM-DD') }}</div>
            <div style="color: #909399;">{{ formatDate(row.lastStatusChangeAt || row.updatedAt, 'HH:mm:ss') }}</div>
          </div>
        </template>
        <template #actions="{ row }">
          <div class="row-actions">
            <el-button
              type="primary"
              link
              size="small"
              :icon="Calendar"
              @click.stop="openSingleRenew(row)"
            >
              续期
            </el-button>
            <el-button
              type="danger"
              link
              size="small"
              :icon="CircleClose"
              @click.stop="openSingleOffline(row)"
            >
              下架
            </el-button>
          </div>
        </template>
      </QyDataTable>
    </div>

    <el-dialog
      v-model="renewVisible"
      title="批量续期预警版权"
      width="520px"
      :close-on-click-modal="false"
      append-to-body
    >
      <el-alert
        :title="`当前环境：${environmentMode === 'test' ? '测试环境（模拟执行）' : '正式环境（真实执行）'}`"
        :type="environmentMode === 'test' ? 'info' : 'warning'"
        :closable="false"
        show-icon
        style="margin-bottom: 16px;"
      />
      <el-form label-width="100px">
        <el-alert
          title="将对已选择的预警版权执行批量续期"
          type="info"
          :closable="false"
          show-icon
          style="margin-bottom: 16px;"
        >
          <template #title>
            <span>将对 <b style="color: #409EFF;">{{ selectedRows.length }}</b> 条预警版权执行批量续期</span>
          </template>
        </el-alert>
        <el-form-item label="续期月数">
          <el-input-number v-model="renewForm.renewMonths" :min="1" :max="120" :step="1" />
          <span style="margin-left: 8px; color: #909399;">个月</span>
        </el-form-item>
        <el-form-item label="续期备注">
          <el-input
            v-model="renewForm.remark"
            type="textarea"
            :rows="3"
            placeholder="选填，备注续期原因"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="renewVisible = false" :disabled="renewSubmitting">取消</el-button>
        <el-button
          type="primary"
          :loading="renewSubmitting"
          @click="handleBatchRenew"
        >
          确认续期
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="offlineConfirmVisible"
      title="批量下架过期内容"
      width="480px"
      :close-on-click-modal="false"
      append-to-body
    >
      <el-alert
        title="危险操作确认"
        type="error"
        :closable="false"
        show-icon
        style="margin-bottom: 16px;"
      >
        <template #title>
          <span>
            {{ environmentMode === 'test' ? '【测试演练】' : '【正式环境】' }}
            将下架 <b style="color: #F56C6C;">{{ selectedRows.length }}</b> 条版权关联的已上架内容
          </span>
        </template>
        下架操作{{ environmentMode === 'test' ? '模拟执行' : '不可逆' }}，共影响约 <b>{{ stats.affectedContentCount }}</b> 个内容
      </el-alert>
      <template #footer>
        <el-button @click="offlineConfirmVisible = false">取消</el-button>
        <el-button type="warning" @click="handleBatchOffline">确认下架</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="archiveConfirmVisible"
      title="批量归档过期台账"
      width="480px"
      :close-on-click-modal="false"
      append-to-body
    >
      <el-alert
        :title="`当前环境：${environmentMode === 'test' ? '测试环境（模拟执行）' : '正式环境（真实执行）'}`"
        type="info"
        :closable="false"
        show-icon
        style="margin-bottom: 16px;"
      />
      <el-alert
        title="归档确认"
        type="warning"
        :closable="false"
        show-icon
        style="margin-bottom: 16px;"
      >
        <template #title>
          <span>
            将归档 <b style="color: #E6A23C;">{{ selectedRows.length }}</b> 条过期版权台账
          </span>
        </template>
        归档后版权记录将移入历史台账{{ environmentMode === 'prod' ? '，无法恢复' : '（模拟）' }}
      </el-alert>
      <template #footer>
        <el-button @click="archiveConfirmVisible = false">取消</el-button>
        <el-button type="info" @click="handleBatchArchive">确认归档</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="scanConfirmVisible"
      title="批量触发全量筛查"
      width="480px"
      :close-on-click-modal="false"
      append-to-body
    >
      <el-alert
        :title="`当前环境：${environmentMode === 'test' ? '测试环境（模拟执行）' : '正式环境（真实执行）'}`"
        type="info"
        :closable="false"
        show-icon
        style="margin-bottom: 16px;"
      />
      <el-alert
        title="筛查确认"
        type="info"
        :closable="false"
        show-icon
        style="margin-bottom: 16px;"
      >
        <template #title>
          <span>
            将对 <b style="color: #409EFF;">{{ selectedRows.length }}</b> 条版权执行全量有效性筛查
          </span>
        </template>
        系统将重新核对授权期限、资质文件状态、关联内容合规性
      </el-alert>
      <template #footer>
        <el-button @click="scanConfirmVisible = false">取消</el-button>
        <el-button type="primary" @click="handleBatchScan">确认触发</el-button>
      </template>
    </el-dialog>

    <el-drawer
      v-model="drawerVisible"
      title="批量任务历史（最近20条）"
      direction="rtl"
      size="560px"
      :before-close="() => drawerVisible = false"
    >
      <div class="batch-tasks-drawer">
        <div class="tasks-list">
          <div
            v-for="task in batchTasks"
            :key="task.id"
            class="task-card"
            :class="[`status-${task.status}`]"
          >
            <div class="task-header" @click="toggleTaskExpand(task)">
              <div class="task-title">
                <el-tag
                  :type="getEnumItem(VALIDITY_BATCH_STATUS, task.status)?.type || 'info'"
                  size="small"
                  effect="light"
                >
                  {{ getEnumLabel(VALIDITY_BATCH_STATUS, task.status) }}
                </el-tag>
                <span class="task-action-label">{{ task.actionLabel }}</span>
                <el-tag
                  v-if="task.environmentMode === 'test'"
                  type="info"
                  size="small"
                  effect="plain"
                  style="margin-left: 8px;"
                >
                  测试演练
                </el-tag>
              </div>
              <div class="task-arrow">
                <el-icon :class="{ expanded: expandedTaskId === task.id }">
                  <View />
                </el-icon>
              </div>
            </div>
            <div class="task-meta">
              <span class="task-no">#{{ task.batchNo }}</span>
              <span class="task-time">{{ formatDate(task.createdAt, 'YYYY-MM-DD HH:mm') }}</span>
              <span class="task-operator">{{ task.operatorName || '系统' }}</span>
            </div>
            <div class="task-progress">
              <el-progress
                :percentage="Math.floor(task.progress)"
                :status="task.status === 'completed' ? 'success' : task.status === 'failed' ? 'exception' : undefined"
                :stroke-width="8"
              />
              <div class="progress-counts">
                <span>共 {{ task.totalCount }} 条</span>
                <span class="success-text">成功 {{ task.successCount }}</span>
                <span class="failed-text">失败 {{ task.failedCount }}</span>
                <span v-if="task.skippedCount" class="skipped-text">跳过 {{ task.skippedCount }}</span>
              </div>
            </div>
            <div v-show="expandedTaskId === task.id" class="task-detail">
              <div v-if="task.filtersSummary" class="detail-item">
                <span class="detail-label">筛选条件：</span>
                <span>{{ task.filtersSummary }}</span>
              </div>
              <div v-if="task.errorSample && task.errorSample.length" class="error-sample-section">
                <div class="section-title">
                  <el-icon style="margin-right: 4px;"><Warning /></el-icon>
                  错误样本（{{ task.errorSample.length }} 条）
                </div>
                <el-table :data="task.errorSample" size="small" border stripe max-height="200">
                  <el-table-column prop="copyrightId" label="版权ID" width="80" align="center" />
                  <el-table-column prop="code" label="版权编号" width="130" show-overflow-tooltip />
                  <el-table-column prop="reason" label="错误原因" min-width="160" show-overflow-tooltip />
                </el-table>
              </div>
              <div v-else-if="task.status === 'completed'" class="no-error">
                <el-icon style="color: #67C23A; margin-right: 4px;"><CircleCheck /></el-icon>
                全部执行成功，无错误样本
              </div>
            </div>
          </div>
          <div v-if="!batchTasksLoading && !batchTasks.length" class="empty-tasks">
            暂无批量任务记录
          </div>
        </div>
      </div>
    </el-drawer>

    <div v-if="batchProgress.visible" class="batch-progress-mask">
      <div class="progress-card">
        <div class="progress-card-header">
          <h3>{{ batchProgress.actionLabel }}</h3>
          <el-tag
            :type="environmentMode === 'test' ? 'info' : 'danger'"
            effect="light"
            size="small"
          >
            {{ environmentMode === 'test' ? '测试演练' : '正式执行' }}
          </el-tag>
        </div>
        <el-progress
          :percentage="Math.floor(batchProgress.percentage)"
          :status="batchProgress.status === 'completed' ? 'success' : batchProgress.status === 'failed' ? 'exception' : undefined"
          :stroke-width="14"
          style="margin: 24px 0;"
        />
        <div class="progress-stats-row">
          <div class="progress-stat">
            <span class="stat-label">总计</span>
            <span class="stat-value">{{ batchProgress.total }}</span>
          </div>
          <div class="progress-stat">
            <span class="stat-label">已处理</span>
            <span class="stat-value primary">{{ batchProgress.processed }}</span>
          </div>
          <div class="progress-stat">
            <span class="stat-label">成功</span>
            <span class="stat-value success">{{ batchProgress.successCount }}</span>
          </div>
          <div class="progress-stat">
            <span class="stat-label">失败</span>
            <span class="stat-value danger">{{ batchProgress.failedCount }}</span>
          </div>
        </div>
        <div class="progress-info-row">
          <el-icon><Clock /></el-icon>
          <span>预计剩余时间：{{ estimatedRemainingText }}</span>
        </div>
        <div class="progress-card-footer">
          <el-button
            v-if="batchProgress.status === 'running'"
            type="danger"
            plain
            :icon="Close"
            @click="cancelBatchTask"
          >
            取消执行
          </el-button>
          <el-button
            v-else
            type="primary"
            @click="batchProgress.visible = false"
          >
            关闭
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.validity-batch-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.environment-switch-card {
  background: #fff;
  border-radius: 6px;
  padding: 16px 20px;

  .env-switch-row {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 14px;

    .env-label {
      display: flex;
      align-items: center;
      font-weight: 600;
      font-size: 14px;
      color: $text-primary;
    }

    :deep(.el-segmented) {
      width: 400px;
      height: 40px;
    }
  }

  .env-alert {
    border-radius: 6px;
    font-size: 13px;
  }

  .env-alert-test {
    border: 1px solid #13c2c2 !important;
    background: rgba(19, 194, 194, 0.06);
  }

  .env-alert-prod {
    border: 1px solid #F56C6C !important;
    background: rgba(245, 108, 108, 0.06);
  }
}

.filter-card {
  background: #fff;
  border-radius: 6px;
  padding: 16px 20px;

  .filter-card-header {
    margin-bottom: 12px;

    .filter-title {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
      color: $text-primary;
    }
  }

  .filter-card-body {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .remaining-days-row {
    display: flex;
    align-items: flex-start;

    .form-item-label {
      font-size: 14px;
      color: $text-primary;
      line-height: 32px;
      text-align: right;
      padding-right: 12px;
      flex-shrink: 0;
    }

    .remaining-days-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 10px;

      .quick-tags {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;

        .quick-tag {
          cursor: pointer;
          user-select: none;
        }
      }

      .slider-wrapper {
        display: flex;
        align-items: center;
        gap: 8px;

        .range-value {
          font-size: 13px;
          color: $text-secondary;
          min-width: 56px;
        }
      }
    }
  }

  .range-separator {
    margin: 0 6px;
    color: $text-secondary;
  }

  .filter-actions-row {
    display: flex;
    gap: 12px;
    padding-top: 4px;
  }
}

.stats-card {
  background: #fff;
  border-radius: 6px;
  padding: 20px 24px;
  display: flex;
  align-items: center;

  .stat-item {
    flex: 1;
    display: flex;
    justify-content: center;
    padding: 0 8px;

    :deep(.el-statistic__head) {
      font-size: 13px;
      color: $text-secondary;
      margin-bottom: 6px;
    }

    :deep(.el-statistic__content) {
      font-size: 26px;
      font-weight: 700;
    }
  }

  .stat-divider {
    height: 48px;
  }
}

.action-bar {
  background: #fff;
  border-radius: 6px;
  padding: 14px 20px;
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
}

.card-content {
  background: #fff;
  border-radius: 6px;
  padding: 16px 20px 20px;
}

.row-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.remaining-days {
  font-size: 14px;
}

:deep(.el-table) {
  .el-table__body tr.even-row > td {
    background-color: #FAFAFA;
  }

  .el-table__body tr.odd-row > td {
    background-color: #FFFFFF;
  }

  .el-table__body tr.current-row > td {
    background-color: rgba(64, 158, 255, 0.12) !important;
  }

  .el-table__body tr.selected-row > td {
    background-color: rgba(64, 158, 255, 0.08) !important;
  }

  .el-table__body tr.hover-row > td {
    background-color: rgba(64, 158, 255, 0.04) !important;
  }

  .el-table__body tr.selected-row.hover-row > td {
    background-color: rgba(64, 158, 255, 0.16) !important;
  }

  .el-table__body tr.current-row.hover-row > td {
    background-color: rgba(64, 158, 255, 0.2) !important;
  }
}

.batch-tasks-drawer {
  .tasks-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .task-card {
    border: 1px solid $border-color-lighter;
    border-radius: 6px;
    overflow: hidden;
    transition: all 0.2s;

    &.status-running {
      border-color: rgba(64, 158, 255, 0.4);
      background: rgba(64, 158, 255, 0.03);
    }

    &.status-completed {
      border-color: rgba(103, 194, 58, 0.3);
    }

    &.status-partial {
      border-color: rgba(230, 162, 60, 0.4);
      background: rgba(230, 162, 60, 0.03);
    }

    &.status-failed {
      border-color: rgba(245, 108, 108, 0.4);
      background: rgba(245, 108, 108, 0.03);
    }

    .task-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px 8px;
      cursor: pointer;

      .task-title {
        display: flex;
        align-items: center;
        gap: 8px;

        .task-action-label {
          font-weight: 600;
          font-size: 14px;
          color: $text-primary;
        }
      }

      .task-arrow {
        .el-icon {
          transition: transform 0.2s;
          color: $text-secondary;

          &.expanded {
            transform: rotate(180deg);
          }
        }
      }
    }

    .task-meta {
      padding: 0 16px 8px;
      font-size: 12px;
      color: $text-secondary;
      display: flex;
      gap: 16px;
    }

    .task-progress {
      padding: 8px 16px 12px;

      .progress-counts {
        display: flex;
        gap: 16px;
        font-size: 12px;
        color: $text-secondary;
        margin-top: 6px;

        .success-text { color: $success-color; }
        .failed-text { color: $danger-color; }
        .skipped-text { color: $text-secondary; }
      }
    }

    .task-detail {
      border-top: 1px solid $border-color-lighter;
      padding: 12px 16px;
      background: #FAFBFC;

      .detail-item {
        font-size: 12px;
        margin-bottom: 10px;

        .detail-label {
          color: $text-secondary;
          font-weight: 500;
        }
      }

      .section-title {
        font-size: 13px;
        font-weight: 600;
        color: $danger-color;
        margin-bottom: 8px;
        display: flex;
        align-items: center;
      }

      .no-error {
        font-size: 13px;
        color: $success-color;
        display: flex;
        align-items: center;
        padding: 4px 0;
      }
    }
  }

  .empty-tasks {
    text-align: center;
    padding: 60px 20px;
    color: $text-secondary;
    font-size: 14px;
  }
}

.batch-progress-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.2s ease;

  .progress-card {
    width: 480px;
    background: #fff;
    border-radius: 12px;
    padding: 28px 32px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
    animation: slideUp 0.25s ease;

    .progress-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;

      h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 700;
        color: $text-primary;
      }
    }

    .progress-stats-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 8px 16px;
      border-bottom: 1px solid $border-color-lighter;
      margin-bottom: 16px;

      .progress-stat {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;

        .stat-label {
          font-size: 12px;
          color: $text-secondary;
        }

        .stat-value {
          font-size: 20px;
          font-weight: 700;
          color: $text-primary;

          &.primary { color: $primary-color; }
          &.success { color: $success-color; }
          &.danger { color: $danger-color; }
        }
      }
    }

    .progress-info-row {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: $text-secondary;
      margin-bottom: 20px;
      padding: 10px 14px;
      background: #F5F7FA;
      border-radius: 6px;
    }

    .progress-card-footer {
      display: flex;
      justify-content: flex-end;
    }
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
