<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import QyDataTable from '@/components/QyDataTable/index.vue'
import QyTableToolbar from '@/components/QyTableToolbar/index.vue'
import {
  DANMAKU_STATUS,
  DANMAKU_BATCH_OPERATE_TYPE,
  DANMAKU_SORT_FIELD,
  DANMAKU_VIOLATION_TYPE,
  VIOLATION_LEVEL,
  CONTENT_CATEGORY,
  getEnumOptions,
  getEnumLabel,
  getEnumItem,
} from '@/constants/enums'
import { getDanmakuManageListApi, batchOperateDanmakusApi } from '@/api/danmaku-manage'
import type { DanmakuItem, DanmakuBatchOperateResult } from '@/types'
import { formatDate } from '@/utils'
import { Search, RefreshLeft, Check, Hide, Delete, FolderOpened, Warning, CircleCheck, CircleClose, VideoPlay, Clock, DataLine, ArrowDown, ArrowUp } from '@element-plus/icons-vue'

const formatPlayTime = (s: number) => {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

const loading = ref(false)
const listData = ref<DanmakuItem[]>([])
const total = ref(0)
const selectedRows = ref<DanmakuItem[]>([])
const refreshingIds = ref<number[]>([])

const currentStep = ref(0)

const sortForm = reactive({
  sortField: 'like_count',
  sortOrder: 'DESC' as 'ASC' | 'DESC',
  contentCategory: null as number | null,
  violationLevel: null as number | null,
  danmakuStatus: null as number | null,
  violationType: null as string | null,
  dateRange: null as [string, string] | null,
  isHotVideo: null as number | null,
  playTimeStart: null as number | null,
  playTimeEnd: null as number | null,
})

const queryParams = reactive({
  page: 1,
  pageSize: 10,
  keyword: '',
  sortField: 'like_count',
  sortOrder: 'DESC' as 'ASC' | 'DESC',
  contentCategory: null as number | null,
  violationLevel: null as number | null,
  danmakuStatus: null as number | null,
  violationType: null as string | null,
  startDate: '',
  endDate: '',
  isHotVideo: null as number | null,
  playTimeStart: null as number | null,
  playTimeEnd: null as number | null,
})

const loadData = async () => {
  loading.value = true
  try {
    const params: Record<string, any> = { ...queryParams }
    if (sortForm.dateRange) {
      params.startDate = sortForm.dateRange[0]
      params.endDate = sortForm.dateRange[1]
    }
    const result = await getDanmakuManageListApi(params)
    listData.value = result.list
    total.value = result.pagination.total
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  queryParams.sortField = sortForm.sortField
  queryParams.sortOrder = sortForm.sortOrder
  queryParams.contentCategory = sortForm.contentCategory
  queryParams.violationLevel = sortForm.violationLevel
  queryParams.danmakuStatus = sortForm.danmakuStatus
  queryParams.violationType = sortForm.violationType
  queryParams.isHotVideo = sortForm.isHotVideo
  queryParams.playTimeStart = sortForm.playTimeStart
  queryParams.playTimeEnd = sortForm.playTimeEnd
  if (sortForm.dateRange) {
    queryParams.startDate = sortForm.dateRange[0]
    queryParams.endDate = sortForm.dateRange[1]
  } else {
    queryParams.startDate = ''
    queryParams.endDate = ''
  }
  queryParams.page = 1
  loadData()
}

const handleReset = () => {
  sortForm.sortField = 'like_count'
  sortForm.sortOrder = 'DESC'
  sortForm.contentCategory = null
  sortForm.violationLevel = null
  sortForm.danmakuStatus = null
  sortForm.violationType = null
  sortForm.dateRange = null
  sortForm.isHotVideo = null
  sortForm.playTimeStart = null
  sortForm.playTimeEnd = null
  queryParams.keyword = ''
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

const handleSelectionChange = (rows: DanmakuItem[]) => {
  selectedRows.value = rows
}

const hotDanmakus = computed(() => listData.value.filter((r) => r.content?.isHot === 1))
const normalDanmakus = computed(() => listData.value.filter((r) => r.content?.isHot !== 1))

const selectedOperateType = ref<string>('')

const operateTypeOptions = computed(() => getEnumOptions(DANMAKU_BATCH_OPERATE_TYPE))

const currentOperateLabel = computed(() => {
  if (!selectedOperateType.value) return ''
  return getEnumLabel(DANMAKU_BATCH_OPERATE_TYPE, selectedOperateType.value)
})

const batchProgress = reactive({
  percentage: 0,
  total: 0,
  processed: 0,
  successCount: 0,
  failedCount: 0,
  skippedCount: 0,
  status: 'idle' as 'idle' | 'processing' | 'success' | 'partial' | 'error',
  message: '',
})

const batchResult = ref<DanmakuBatchOperateResult | null>(null)

const batchTimer = ref<any>(null)
const batchExecuting = ref(false)

const batchTargetIds = computed(() => {
  if (selectedRows.value.length > 0) {
    return selectedRows.value.map((r) => r.id)
  }
  return listData.value.map((r) => r.id)
})

const canExecute = computed(() => {
  return selectedOperateType.value && batchTargetIds.value.length > 0
})

const handleStepNext = () => {
  if (currentStep.value < 2) {
    currentStep.value++
  }
}

const handleStepPrev = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

const handleExecuteBatch = async () => {
  const opItem = getEnumItem(DANMAKU_BATCH_OPERATE_TYPE, selectedOperateType.value)
  const opLabel = opItem?.label || currentOperateLabel.value

  await ElMessageBox.confirm(
    `确定要对 ${batchTargetIds.value.length} 条弹幕执行「${opLabel}」操作吗？操作执行后可能无法撤销。`,
    '确认批量操作',
    { type: 'warning', confirmButtonText: '确认执行', cancelButtonText: '取消' },
  )

  batchExecuting.value = true
  batchProgress.status = 'processing'
  batchProgress.total = batchTargetIds.value.length
  batchProgress.percentage = 0
  batchProgress.processed = 0
  batchProgress.successCount = 0
  batchProgress.failedCount = 0
  batchProgress.skippedCount = 0
  batchProgress.message = ''
  batchResult.value = null

  clearInterval(batchTimer.value)
  batchTimer.value = setInterval(() => {
    if (batchProgress.percentage < 85) {
      batchProgress.percentage += Math.random() * 8
      batchProgress.processed = Math.floor(batchProgress.total * (batchProgress.percentage / 100))
      batchProgress.successCount = Math.floor(batchProgress.processed * 0.92)
    }
  }, 400)

  try {
    const result = await batchOperateDanmakusApi({
      ids: batchTargetIds.value,
      operationType: selectedOperateType.value as any,
    })
    clearInterval(batchTimer.value)

    batchResult.value = result
    batchProgress.percentage = 100
    batchProgress.processed = result.total
    batchProgress.successCount = result.successCount
    batchProgress.failedCount = result.failedCount
    batchProgress.skippedCount = result.skippedCount

    if (result.failedCount === 0) {
      batchProgress.status = 'success'
      batchProgress.message = `批量操作完成：成功 ${result.successCount} 条，跳过 ${result.skippedCount} 条`
    } else if (result.successCount === 0) {
      batchProgress.status = 'error'
      batchProgress.message = `批量操作失败：失败 ${result.failedCount} 条`
    } else {
      batchProgress.status = 'partial'
      batchProgress.message = `批量操作部分成功：成功 ${result.successCount} 条，失败 ${result.failedCount} 条，跳过 ${result.skippedCount} 条`
    }

    ElMessage.success(batchProgress.message)
    await partialRefresh(result)
  } catch (err: any) {
    clearInterval(batchTimer.value)
    batchProgress.status = 'error'
    batchProgress.message = err?.message || '批量操作失败'
    ElMessage.error(batchProgress.message)
  } finally {
    batchExecuting.value = false
  }
}

const partialRefresh = async (result: DanmakuBatchOperateResult) => {
  const affectedIds = [...result.successIds, ...result.skippedIds]
  if (!affectedIds.length) {
    loadData()
    return
  }
  refreshingIds.value = [...affectedIds]
  try {
    listData.value = listData.value.map((item) => {
      if (result.successIds.includes(item.id)) {
        const updated = { ...item }
        if (selectedOperateType.value === 'BATCH_APPROVE') {
          updated.danmakuStatus = 1
        } else if (selectedOperateType.value === 'BATCH_BLOCK') {
          updated.danmakuStatus = 2
        } else if (selectedOperateType.value === 'BATCH_CLEAN') {
          updated.danmakuStatus = 3
        } else if (selectedOperateType.value === 'BATCH_ARCHIVE') {
          updated.danmakuStatus = 4
          updated.isArchived = 1
        }
        return updated
      }
      return item
    })
  } finally {
    refreshingIds.value = []
  }
}

const resetBatchState = () => {
  currentStep.value = 0
  selectedOperateType.value = ''
  batchProgress.percentage = 0
  batchProgress.total = 0
  batchProgress.processed = 0
  batchProgress.successCount = 0
  batchProgress.failedCount = 0
  batchProgress.skippedCount = 0
  batchProgress.status = 'idle'
  batchProgress.message = ''
  batchResult.value = null
}

const getRowStatusTag = (row: DanmakuItem) => {
  if (refreshingIds.value.includes(row.id)) return 'processing'
  if (batchResult.value?.successIds.includes(row.id)) return 'success'
  if (batchResult.value?.skippedIds.includes(row.id)) return 'skipped'
  return ''
}

onBeforeUnmount(() => {
  if (batchTimer.value) clearInterval(batchTimer.value)
})

const tableColumns = [
  { type: 'selection', width: 50 },
  { prop: 'danmakuContent', label: '弹幕内容', minWidth: 220, showOverflowTooltip: true, slot: 'danmakuContent' },
  { prop: 'contentId', label: '关联视频', minWidth: 180, showOverflowTooltip: true, slot: 'contentTitle' },
  { prop: 'userId', label: '发送用户', width: 120, align: 'center', slot: 'sendUser' },
  { prop: 'playTime', label: '播放时间', width: 100, align: 'center', slot: 'playTime' },
  { prop: 'createdAt', label: '发送时间', width: 170, align: 'center', slot: 'createdAt' },
  { prop: 'violationLevel', label: '违规等级/类型', width: 140, align: 'center', slot: 'violationInfo' },
  { prop: 'danmakuStatus', label: '弹幕状态', width: 100, align: 'center', slot: 'danmakuStatus' },
  { prop: 'likeCount', label: '点赞', width: 80, align: 'center' },
  { prop: 'reportCount', label: '举报', width: 80, align: 'center' },
]

const sortFieldOptions = computed(() => {
  const baseOptions = getEnumOptions(DANMAKU_SORT_FIELD)
  return [
    { value: 'video_hot', label: '视频热度' },
    ...baseOptions,
  ]
})
const contentCategoryOptions = computed(() => getEnumOptions(CONTENT_CATEGORY))
const violationLevelOptions = computed(() => getEnumOptions(VIOLATION_LEVEL))
const danmakuStatusOptions = computed(() => getEnumOptions(DANMAKU_STATUS))
const violationTypeOptions = computed(() => getEnumOptions(DANMAKU_VIOLATION_TYPE))

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="danmaku-batch-page">
    <el-card shadow="never" class="step-card">
      <el-steps :active="currentStep" finish-status="success" align-center>
        <el-step title="选择筛选条件" :icon="Search" />
        <el-step title="选择操作类型" :icon="DataLine" />
        <el-step title="执行与结果" :icon="CircleCheck" />
      </el-steps>
    </el-card>

    <el-card v-if="currentStep === 0" shadow="never" class="criteria-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">筛选条件配置</span>
          <el-button type="primary" :icon="Search" @click="handleSearch">预览匹配结果</el-button>
        </div>
      </template>
      <el-form :model="sortForm" label-width="100px" :inline="false">
        <el-row :gutter="24">
          <el-col :span="8">
            <el-form-item label="排序字段">
              <el-select v-model="sortForm.sortField" style="width: 100%">
                <el-option
                  v-for="item in sortFieldOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="排序方向">
              <el-radio-group v-model="sortForm.sortOrder">
                <el-radio value="ASC">
                  <el-icon><ArrowUp /></el-icon>
                  升序
                </el-radio>
                <el-radio value="DESC">
                  <el-icon><ArrowDown /></el-icon>
                  降序
                </el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="视频品类">
              <el-select v-model="sortForm.contentCategory" placeholder="全部品类" clearable style="width: 100%">
                <el-option
                  v-for="item in contentCategoryOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="24">
          <el-col :span="8">
            <el-form-item label="违规等级">
              <el-select v-model="sortForm.violationLevel" placeholder="全部等级" clearable style="width: 100%">
                <el-option
                  v-for="item in violationLevelOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="弹幕状态">
              <el-select v-model="sortForm.danmakuStatus" placeholder="全部状态" clearable style="width: 100%">
                <el-option
                  v-for="item in danmakuStatusOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="违规类型">
              <el-select v-model="sortForm.violationType" placeholder="全部类型" clearable style="width: 100%">
                <el-option
                  v-for="item in violationTypeOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="24">
          <el-col :span="8">
            <el-form-item label="发送时段">
              <el-date-picker
                v-model="sortForm.dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="热门视频">
              <el-select v-model="sortForm.isHotVideo" placeholder="全部" clearable style="width: 100%">
                <el-option label="热门视频" :value="1" />
                <el-option label="普通视频" :value="0" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="播放时段">
              <div class="play-time-range">
                <el-input-number
                  v-model="sortForm.playTimeStart"
                  :min="0"
                  :max="sortForm.playTimeEnd || 99999"
                  placeholder="开始秒"
                  size="default"
                  style="width: 100px"
                />
                <span class="range-sep">至</span>
                <el-input-number
                  v-model="sortForm.playTimeEnd"
                  :min="sortForm.playTimeStart || 0"
                  :max="99999"
                  placeholder="结束秒"
                  size="default"
                  style="width: 100px"
                />
                <span class="range-unit">秒</span>
              </div>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="24">
          <el-col :span="8">
            <el-form-item label="关键词">
              <el-input
                v-model="queryParams.keyword"
                placeholder="弹幕内容关键词"
                clearable
                @keyup.enter="handleSearch"
              />
            </el-form-item>
          </el-col>
          <el-col :span="16">
            <el-form-item>
              <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
              <el-button :icon="RefreshLeft" @click="handleReset">重置</el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <div class="preview-summary">
        <el-descriptions :column="4" border size="small">
          <el-descriptions-item label="匹配总数">{{ total }}</el-descriptions-item>
          <el-descriptions-item label="热门视频弹幕">{{ hotDanmakus.length }}</el-descriptions-item>
          <el-descriptions-item label="普通视频弹幕">{{ normalDanmakus.length }}</el-descriptions-item>
          <el-descriptions-item label="已选中">{{ selectedRows.length }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-card>

    <el-card v-if="currentStep === 1" shadow="never" class="operate-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">选择批量操作类型</span>
        </div>
      </template>
      <el-row :gutter="16">
        <el-col v-for="item in operateTypeOptions" :key="item.value" :span="6">
          <div
            class="op-card"
            :class="{ 'is-selected': selectedOperateType === item.value }"
            @click="selectedOperateType = item.value as string"
          >
            <el-icon :size="32" :class="`type-icon-${item.type}`">
              <Check v-if="item.icon === 'Check'" />
              <Hide v-else-if="item.icon === 'Hide'" />
              <Delete v-else-if="item.icon === 'Delete'" />
              <FolderOpened v-else-if="item.icon === 'FolderOpened'" />
            </el-icon>
            <div class="type-label">{{ item.label }}</div>
            <div class="type-desc">{{ item.desc }}</div>
          </div>
        </el-col>
      </el-row>

      <div class="hot-distinction">
        <el-alert type="warning" :closable="false" show-icon>
          <template #title>
            <span>热门视频弹幕优先处理：当前匹配 {{ hotDanmakus.length }} 条热门视频弹幕、{{ normalDanmakus.length }} 条普通视频弹幕。批量操作时将优先处理热门视频弹幕。</span>
          </template>
        </el-alert>
        <div class="hot-counts">
          <el-tag type="danger" effect="dark">热门视频 {{ hotDanmakus.length }} 条</el-tag>
          <el-tag type="info" effect="plain">普通视频 {{ normalDanmakus.length }} 条</el-tag>
        </div>
        <div class="progress-bar-section">
          <div class="progress-label">
            <span>热门视频弹幕占比</span>
            <span>{{ total > 0 ? ((hotDanmakus.length / total) * 100).toFixed(1) : 0 }}%</span>
          </div>
          <el-progress
            :percentage="total > 0 ? Math.floor((hotDanmakus.length / total) * 100) : 0"
            :stroke-width="12"
            status="warning"
          />
        </div>
        <div class="clean-note">
          <el-icon><Warning /></el-icon>
          <span>批量清理不影响优质合规弹幕数据</span>
        </div>
      </div>
    </el-card>

    <el-card v-if="currentStep === 2" shadow="never" class="execute-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">执行批量操作</span>
          <el-button v-if="batchProgress.status !== 'processing'" :icon="RefreshLeft" @click="resetBatchState">重新操作</el-button>
        </div>
      </template>

      <el-descriptions :column="2" border class="execute-desc">
        <el-descriptions-item label="操作类型">
          <el-tag :type="getEnumItem(DANMAKU_BATCH_OPERATE_TYPE, selectedOperateType)?.type || 'info'" size="small">
            {{ currentOperateLabel }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="目标数量">{{ batchTargetIds.length }} 条弹幕</el-descriptions-item>
        <el-descriptions-item label="其中热门">{{ hotDanmakus.length }} 条</el-descriptions-item>
        <el-descriptions-item label="其中普通">{{ normalDanmakus.length }} 条</el-descriptions-item>
      </el-descriptions>

      <div v-if="batchProgress.status === 'idle'" class="execute-action">
        <el-button
          type="danger"
          size="large"
          :icon="Warning"
          :disabled="!canExecute"
          @click="handleExecuteBatch"
        >
          确认执行「{{ currentOperateLabel }}」
        </el-button>
      </div>

      <div v-if="batchProgress.status !== 'idle'" class="progress-section">
        <div class="progress-header">
          <span>操作进度</span>
          <span class="progress-counts">
            共 {{ batchProgress.total }} 条 |
            已处理 {{ batchProgress.processed }} 条 |
            <span class="success-text">成功 {{ batchProgress.successCount }}</span> |
            <span class="error-text">失败 {{ batchProgress.failedCount }}</span> |
            <span class="skip-text">跳过 {{ batchProgress.skippedCount }}</span>
          </span>
        </div>
        <el-progress
          :percentage="Math.floor(batchProgress.percentage)"
          :status="batchProgress.status === 'success' ? 'success' : batchProgress.status === 'error' ? 'exception' : undefined"
          :stroke-width="14"
          animated
        />
        <div v-if="batchProgress.message" class="progress-message" :class="batchProgress.status">
          <el-icon>
            <CircleCheck v-if="batchProgress.status === 'success'" />
            <Warning v-else-if="batchProgress.status === 'partial'" />
            <CircleClose v-else />
          </el-icon>
          {{ batchProgress.message }}
        </div>
      </div>

      <div v-if="batchResult" class="result-section">
        <el-descriptions title="操作结果" :column="2" border>
          <el-descriptions-item label="批次ID">{{ batchResult.batchId }}</el-descriptions-item>
          <el-descriptions-item label="总数">{{ batchResult.total }}</el-descriptions-item>
          <el-descriptions-item label="成功数">
            <span class="success-text">{{ batchResult.successCount }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="失败数">
            <span class="error-text">{{ batchResult.failedCount }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="跳过数">
            <span class="skip-text">{{ batchResult.skippedCount }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="成功ID数量">{{ batchResult.successIds.length }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-card>

    <div class="step-actions">
      <el-button v-if="currentStep > 0" @click="handleStepPrev">上一步</el-button>
      <el-button
        v-if="currentStep < 2"
        type="primary"
        :disabled="currentStep === 1 && !selectedOperateType"
        @click="handleStepNext"
      >
        下一步
      </el-button>
    </div>

    <div class="card-content">
      <QyTableToolbar
        :loading="loading"
        :show-create="false"
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
        :selection="true"
        :index="true"
        :stripe="true"
        @selection-change="handleSelectionChange"
        @page-change="handlePageChange"
        @size-change="handleSizeChange"
      >
        <template #danmakuContent="{ row }">
          <div class="danmaku-content-cell">
            <span class="danmaku-text" :style="{ color: row.danmakuColor || '#fff' }">{{ row.danmakuContent }}</span>
            <el-tag v-if="row.isHighRisk === 1" type="danger" size="small" effect="dark">高风险</el-tag>
            <el-tag
              v-if="getRowStatusTag(row) === 'success'"
              type="success"
              size="small"
              effect="light"
              style="margin-left: 4px;"
            >
              操作成功
            </el-tag>
            <el-tag
              v-else-if="getRowStatusTag(row) === 'skipped'"
              type="warning"
              size="small"
              effect="light"
              style="margin-left: 4px;"
            >
              已跳过
            </el-tag>
            <span
              v-if="getRowStatusTag(row) === 'processing'"
              class="refreshing-hint"
            >
              刷新中...
            </span>
          </div>
        </template>

        <template #contentTitle="{ row }">
          <div class="content-title-cell">
            <el-icon class="video-icon"><VideoPlay /></el-icon>
            <span v-if="row.content">{{ row.content.contentTitle }}</span>
            <span v-else style="color: #909399">-</span>
            <el-tag v-if="row.content?.isHot === 1" type="danger" size="small" effect="dark">热门视频</el-tag>
          </div>
        </template>

        <template #sendUser="{ row }">
          <span v-if="row.user">{{ row.user.username }}</span>
          <span v-else style="color: #909399">-</span>
        </template>

        <template #playTime="{ row }">
          <div class="play-time-cell">
            <el-icon><Clock /></el-icon>
            <span>{{ formatPlayTime(row.playTime) }}</span>
          </div>
        </template>

        <template #violationInfo="{ row }">
          <div class="violation-info-cell">
            <el-tag
              :type="getEnumItem(VIOLATION_LEVEL, row.violationLevel)?.type || 'info'"
              size="small"
            >
              {{ getEnumLabel(VIOLATION_LEVEL, row.violationLevel) }}
            </el-tag>
            <div v-if="row.violationType" class="violation-type-text">
              {{ getEnumLabel(DANMAKU_VIOLATION_TYPE, row.violationType) }}
            </div>
          </div>
        </template>

        <template #danmakuStatus="{ row }">
          <el-tag
            :type="getEnumItem(DANMAKU_STATUS, row.danmakuStatus)?.type || 'info'"
            size="small"
          >
            {{ getEnumLabel(DANMAKU_STATUS, row.danmakuStatus) }}
          </el-tag>
        </template>

        <template #createdAt="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
      </QyDataTable>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.danmaku-batch-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.step-card {
  :deep(.el-card__body) {
    padding: 20px 40px;
  }
}

.criteria-card,
.operate-card,
.execute-card {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .card-title {
      font-size: 16px;
      font-weight: 600;
      color: $text-primary;
    }
  }
}

.preview-summary {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid $border-lighter;
}

.play-time-range {
  display: flex;
  align-items: center;
  gap: 8px;

  .range-sep {
    color: $text-secondary;
  }

  .range-unit {
    color: $text-secondary;
    font-size: $font-sm;
  }
}

.op-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px 12px;
  border: 2px solid $border-lighter;
  border-radius: $radius-md;
  cursor: pointer;
  transition: all 0.3s;
  text-align: center;
  background: $bg-white;

  &:hover {
    border-color: $primary-color;
    box-shadow: $shadow-light;
  }

  &.is-selected {
    border-color: #409EFF;
    box-shadow: 0 2px 12px rgba(64, 158, 255, 0.3);
    background: rgba(64, 158, 255, 0.06);
  }

  .type-label {
    font-size: $font-base;
    font-weight: 600;
    color: $text-primary;
    margin-top: 10px;
  }

  .type-desc {
    font-size: $font-xs;
    color: $text-secondary;
    margin-top: 4px;
    line-height: 1.4;
  }

  .type-icon-primary { color: $primary-color; }
  .type-icon-warning { color: $warning-color; }
  .type-icon-danger { color: $danger-color; }
  .type-icon-success { color: $success-color; }
  .type-icon-info { color: $info-color; }
}

.hot-distinction {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid $border-lighter;

  .hot-counts {
    display: flex;
    gap: 12px;
    margin-top: 12px;
  }

  .progress-bar-section {
    margin-top: 16px;
    padding: 12px 16px;
    background: #FAFBFC;
    border-radius: $radius-md;

    .progress-label {
      display: flex;
      justify-content: space-between;
      font-size: $font-sm;
      color: $text-secondary;
      margin-bottom: 8px;
    }
  }

  .clean-note {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 12px;
    font-size: $font-sm;
    color: $text-secondary;

    .el-icon {
      color: $warning-color;
    }
  }
}

.execute-desc {
  margin-bottom: 20px;
}

.execute-action {
  display: flex;
  justify-content: center;
  padding: 24px 0;
}

.progress-section {
  margin-bottom: 16px;
  padding: 16px;
  background: #FAFBFC;
  border-radius: $radius-md;
  border: 1px solid $border-lighter;

  .progress-header {
    display: flex;
    justify-content: space-between;
    font-size: $font-sm;
    margin-bottom: 10px;
    font-weight: 500;

    .progress-counts {
      font-weight: 400;
      font-size: $font-xs;
      color: $text-secondary;

      .success-text { color: $success-color; }
      .error-text { color: $danger-color; }
      .skip-text { color: $warning-color; }
    }
  }

  .progress-message {
    margin-top: 12px;
    padding: 8px 12px;
    border-radius: $radius-base;
    font-size: $font-sm;
    display: flex;
    align-items: center;
    gap: 6px;

    &.success {
      background: rgba(103, 194, 58, 0.1);
      color: $success-color;
    }

    &.partial {
      background: rgba(230, 162, 60, 0.1);
      color: $warning-color;
    }

    &.error,
    &.exception {
      background: rgba(245, 108, 108, 0.1);
      color: $danger-color;
    }

    &.processing {
      background: rgba(64, 158, 255, 0.1);
      color: $primary-color;
    }
  }
}

.result-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid $border-lighter;

  .success-text { color: $success-color; font-weight: 600; }
  .error-text { color: $danger-color; font-weight: 600; }
  .skip-text { color: $warning-color; font-weight: 600; }
}

.step-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding: 8px 0;
}

.danmaku-content-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;

  .danmaku-text {
    color: $text-primary;
    background: #f0f2f5;
    padding: 2px 6px;
    border-radius: 4px;
  }

  .refreshing-hint {
    color: $primary-color;
    font-size: $font-xs;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    animation: rowPulse 1.2s ease-in-out infinite;
  }
}

.content-title-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;

  .video-icon {
    color: $primary-color;
    font-size: 16px;
  }
}

.play-time-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;

  .el-icon {
    color: $text-secondary;
    font-size: 14px;
  }
}

.violation-info-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;

  .violation-type-text {
    font-size: $font-xs;
    color: $text-secondary;
  }
}

@keyframes rowPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
</style>
