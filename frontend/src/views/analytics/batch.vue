<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import QyDataTable from '@/components/QyDataTable/index.vue'
import QyTableToolbar from '@/components/QyTableToolbar/index.vue'
import QySkeleton from '@/components/QySkeleton/index.vue'
import {
  CONTENT_CATEGORY,
  INTERACTION_TAG,
  EXPORT_FIELDS,
  getEnumOptions,
  getEnumLabel,
  getEnumItem,
  getEnumColor,
} from '@/constants/enums'
import {
  getInteractionStatsApi,
  batchExportReportApi,
  batchScreenLowInteractionApi,
} from '@/api/interaction-analytics'
import type {
  InteractionStatItem,
  ExportReportResult,
  ScreenLowInteractionResult,
} from '@/types'
import { formatDate, formatNumber, formatPlayCount } from '@/utils'
import {
  Search,
  RefreshLeft,
  Download,
  View,
  Warning,
  CircleCheck,
  FolderOpened,
  Filter,
  Sort,
  DataLine,
  ArrowDown,
  ArrowUp,
} from '@element-plus/icons-vue'

const activeTab = ref('aggregation')

const loading = ref(false)
const listData = ref<InteractionStatItem[]>([])
const total = ref(0)
const selectedRows = ref<InteractionStatItem[]>([])

const aggregationForm = reactive({
  isHot: null as number | null,
  contentCategory: null as number | null,
  dateRange: null as [string, string] | null,
})

const queryParams = reactive({
  page: 1,
  pageSize: 10,
  isHot: null as number | null,
  contentCategory: null as number | null,
  startDate: '',
  endDate: '',
})

const loadData = async () => {
  loading.value = true
  try {
    const params: Record<string, any> = { ...queryParams }
    const result = await getInteractionStatsApi(params)
    listData.value = result.list
    total.value = result.pagination.total
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  queryParams.isHot = aggregationForm.isHot
  queryParams.contentCategory = aggregationForm.contentCategory
  if (aggregationForm.dateRange) {
    queryParams.startDate = aggregationForm.dateRange[0]
    queryParams.endDate = aggregationForm.dateRange[1]
  } else {
    queryParams.startDate = ''
    queryParams.endDate = ''
  }
  queryParams.page = 1
  loadData()
}

const handleReset = () => {
  aggregationForm.isHot = null
  aggregationForm.contentCategory = null
  aggregationForm.dateRange = null
  queryParams.isHot = null
  queryParams.contentCategory = null
  queryParams.startDate = ''
  queryParams.endDate = ''
  queryParams.page = 1
  loadData()
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

const handleSelectionChange = (rows: InteractionStatItem[]) => {
  selectedRows.value = rows
}

const contentCategoryOptions = computed(() => getEnumOptions(CONTENT_CATEGORY))

const aggregationColumns = [
  { type: 'selection', width: 50 },
  { prop: 'contentId', label: '内容ID', width: 100, align: 'center' },
  { prop: 'contentTitle', label: '内容标题', minWidth: 200, showOverflowTooltip: true, slot: 'contentTitle' },
  { prop: 'contentCategory', label: '内容品类', width: 110, align: 'center', slot: 'contentCategory' },
  { prop: 'statDate', label: '统计日期', width: 120, align: 'center', slot: 'statDate' },
  { prop: 'playCount', label: '播放数', width: 110, align: 'center', slot: 'playCount' },
  { prop: 'commentCount', label: '评论数', width: 100, align: 'center', slot: 'commentCount' },
  { prop: 'danmakuCount', label: '弹幕数', width: 100, align: 'center' },
  { prop: 'likeCount', label: '点赞数', width: 100, align: 'center' },
  { prop: 'shareCount', label: '转发数', width: 100, align: 'center' },
  { prop: 'collectCount', label: '收藏数', width: 100, align: 'center' },
  { prop: 'totalInteractions', label: '总互动数', width: 110, align: 'center', slot: 'totalInteractions' },
  { prop: 'interactionRate', label: '互动率', width: 100, align: 'center', slot: 'interactionRate' },
  { prop: 'interactionTag', label: '互动标签', width: 100, align: 'center', slot: 'interactionTag' },
  { prop: 'isAnomaly', label: '是否异常', width: 100, align: 'center', slot: 'isAnomaly' },
]

const exportForm = reactive({
  sortBy: 'totalInteractions',
  sortOrder: 'DESC' as 'ASC' | 'DESC',
  selectedFields: [
    'contentId',
    'contentTitle',
    'contentCategory',
    'statDate',
    'totalInteractions',
    'interactionRate',
  ] as string[],
  contentCategory: null as number | null,
  dateRange: null as [string, string] | null,
})

const sortByOptions = [
  { value: 'totalInteractions', label: '总互动数' },
  { value: 'playCount', label: '播放数' },
  { value: 'commentCount', label: '评论数' },
  { value: 'likeCount', label: '点赞数' },
  { value: 'interactionRate', label: '互动率' },
  { value: 'statDate', label: '统计日期' },
]

const exportFieldOptions = computed(() => getEnumOptions(EXPORT_FIELDS))

const exportProgress = reactive({
  percentage: 0,
  total: 0,
  processed: 0,
  exported: 0,
  status: 'idle' as 'idle' | 'processing' | 'success' | 'error',
})

const exportResult = ref<ExportReportResult | null>(null)

const exportTimer = ref<any>(null)
const exportExecuting = ref(false)

const canExport = computed(() => {
  return exportForm.selectedFields.length > 0 && !exportExecuting.value
})

const handleExport = async () => {
  exportExecuting.value = true
  exportProgress.status = 'processing'
  exportProgress.percentage = 0
  exportProgress.total = 0
  exportProgress.processed = 0
  exportProgress.exported = 0
  exportResult.value = null

  clearInterval(exportTimer.value)
  exportTimer.value = setInterval(() => {
    if (exportProgress.percentage < 85) {
      exportProgress.percentage += Math.random() * 6
      exportProgress.processed = Math.floor(100 * (exportProgress.percentage / 100))
      exportProgress.exported = Math.floor(exportProgress.processed * 0.95)
    }
  }, 350)

  try {
    const result = await batchExportReportApi({
      contentCategory: exportForm.contentCategory,
      startDate: exportForm.dateRange?.[0] || null,
      endDate: exportForm.dateRange?.[1] || null,
      sortBy: exportForm.sortBy,
      sortOrder: exportForm.sortOrder,
      selectedFields: exportForm.selectedFields,
    })
    clearInterval(exportTimer.value)

    exportResult.value = result
    exportProgress.percentage = 100
    exportProgress.total = result.totalCount
    exportProgress.processed = result.totalCount
    exportProgress.exported = result.totalCount
    exportProgress.status = 'success'

    ElMessage.success(`批量导出完成，共导出 ${result.totalCount} 条记录`)
  } catch (err: any) {
    clearInterval(exportTimer.value)
    exportProgress.status = 'error'
    ElMessage.error(err?.message || '批量导出失败')
  } finally {
    exportExecuting.value = false
  }
}

const generateCsvContent = () => {
  if (!exportResult.value) return ''
  const fields = exportResult.value.exportFields
  const headers = fields.map((f) => getEnumLabel(EXPORT_FIELDS, f)).join(',')
  const rows = exportResult.value.data
    .map((row) => {
      return fields
        .map((f) => {
          const val = row[f]
          if (typeof val === 'string' && val.includes(',')) {
            return `"${val}"`
          }
          return val ?? ''
        })
        .join(',')
    })
    .join('\n')
  return `${headers}\n${rows}`
}

const handleDownloadCsv = () => {
  const csv = generateCsvContent()
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `interaction-report-${Date.now()}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const handleDownloadJson = () => {
  if (!exportResult.value) return
  const json = JSON.stringify(exportResult.value.data, null, 2)
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `interaction-report-${Date.now()}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const screenForm = reactive({
  threshold: 100,
  contentCategory: null as number | null,
  dateRange: null as [string, string] | null,
})

const screenLoading = ref(false)
const screenResult = ref<ScreenLowInteractionResult | null>(null)
const lowInteractionList = ref<InteractionStatItem[]>([])
const screenedIds = ref<number[]>([])

const canScreen = computed(() => !screenLoading.value)

const handleScreen = async () => {
  screenLoading.value = true
  screenResult.value = null
  lowInteractionList.value = []
  screenedIds.value = []

  try {
    const result = await batchScreenLowInteractionApi({
      contentCategory: screenForm.contentCategory,
      startDate: screenForm.dateRange?.[0] || null,
      endDate: screenForm.dateRange?.[1] || null,
      threshold: screenForm.threshold,
    })
    screenResult.value = result
    screenedIds.value = result.screenedIds

    if (result.screenedIds.length > 0) {
      const listResult = await getInteractionStatsApi({
        page: 1,
        pageSize: Math.max(result.screenedIds.length, 50),
        contentCategory: screenForm.contentCategory,
        startDate: screenForm.dateRange?.[0] || '',
        endDate: screenForm.dateRange?.[1] || '',
      })
      lowInteractionList.value = listResult.list.filter((item) =>
        result.screenedIds.includes(item.contentId)
      )
    }

    ElMessage.success(
      `筛查完成：共扫描 ${result.totalCount} 条，发现 ${result.lowInteractionCount} 条低互动内容，已标记 ${result.taggedCount} 条`
    )
  } catch (err: any) {
    ElMessage.error(err?.message || '筛查失败')
  } finally {
    screenLoading.value = false
  }
}

const screenColumns = [
  { prop: 'contentTitle', label: '内容标题', minWidth: 220, showOverflowTooltip: true, slot: 'contentTitle' },
  { prop: 'contentCategory', label: '内容品类', width: 110, align: 'center', slot: 'contentCategory' },
  { prop: 'playCount', label: '播放数', width: 110, align: 'center', slot: 'playCount' },
  { prop: 'totalInteractions', label: '总互动数', width: 110, align: 'center', slot: 'totalInteractions' },
  { prop: 'interactionRate', label: '互动率', width: 100, align: 'center', slot: 'interactionRate' },
  { prop: 'interactionTag', label: '互动标签', width: 120, align: 'center', slot: 'screenInteractionTag' },
]

onBeforeUnmount(() => {
  if (exportTimer.value) clearInterval(exportTimer.value)
})

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="analytics-batch-page">
    <el-card shadow="never" class="page-header-card">
      <div class="page-header">
        <div class="header-title">
          <el-icon :size="22" color="#409EFF"><DataLine /></el-icon>
          <span>批量管控</span>
        </div>
        <div class="header-desc">批量汇总互动数据、导出内容互动报表、筛查低互动低效内容</div>
      </div>
    </el-card>

    <el-tabs v-model="activeTab" class="main-tabs">
      <el-tab-pane name="aggregation">
        <template #label>
          <span class="tab-label">
            <el-icon><FolderOpened /></el-icon>
            批量汇总互动数据
          </span>
        </template>

        <el-card shadow="never" class="section-card">
          <template #header>
            <div class="card-header">
              <div class="header-left">
                <span class="card-title">筛选条件</span>
                <span class="card-subtitle">配置筛选条件，预览内容互动数据汇总</span>
              </div>
              <div class="header-right">
                <el-button :icon="RefreshLeft" @click="handleReset">重置</el-button>
                <el-button type="primary" :icon="View" @click="handleSearch">预览数据</el-button>
              </div>
            </div>
          </template>
          <el-form :model="aggregationForm" label-width="100px">
            <el-row :gutter="24">
              <el-col :span="8">
                <el-form-item label="内容热度">
                  <el-select
                    v-model="aggregationForm.isHot"
                    placeholder="全部"
                    clearable
                    style="width: 100%"
                  >
                    <el-option label="热门" :value="1" />
                    <el-option label="普通" :value="0" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="内容品类">
                  <el-select
                    v-model="aggregationForm.contentCategory"
                    placeholder="全部品类"
                    clearable
                    style="width: 100%"
                  >
                    <el-option
                      v-for="item in contentCategoryOptions"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="发布时间">
                  <el-date-picker
                    v-model="aggregationForm.dateRange"
                    type="daterange"
                    range-separator="至"
                    start-placeholder="开始日期"
                    end-placeholder="结束日期"
                    value-format="YYYY-MM-DD"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>

          <div class="summary-bar">
            <el-descriptions :column="3" border size="small">
              <el-descriptions-item label="匹配内容数">
                <el-tag type="primary" effect="plain">{{ total }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="已选中">
                <el-tag type="success" effect="plain">{{ selectedRows.length }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="总互动量">
                <el-tag type="warning" effect="plain">
                  {{ formatNumber(listData.reduce((sum, item) => sum + item.totalInteractions, 0)) }}
                </el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </el-card>

        <el-card shadow="never" class="section-card">
          <template #header>
            <div class="card-header">
              <div class="header-left">
                <span class="card-title">互动数据列表</span>
                <span class="card-subtitle">展示筛选后的内容互动数据汇总</span>
              </div>
            </div>
          </template>

          <QySkeleton :loading="loading" :rows="5">
            <QyTableToolbar
              :loading="loading"
              :show-create="false"
              :selected-count="selectedRows.length"
              @refresh="loadData"
            />
            <QyDataTable
              :columns="aggregationColumns"
              :data="listData"
              :loading="loading"
              :total="total"
              :page="queryParams.page"
              :page-size="queryParams.pageSize"
              :selection="true"
              :index="true"
              :border="true"
              :stripe="true"
              @selection-change="handleSelectionChange"
              @page-change="handlePageChange"
              @size-change="handleSizeChange"
            >
              <template #contentTitle="{ row }">
                <span v-if="row.content">{{ row.content.contentTitle }}</span>
                <span v-else style="color: #909399">-</span>
              </template>

              <template #contentCategory="{ row }">
                <el-tag v-if="row.content" type="info" size="small">
                  {{ getEnumLabel(CONTENT_CATEGORY, row.content.contentCategory) }}
                </el-tag>
                <span v-else style="color: #909399">-</span>
              </template>

              <template #statDate="{ row }">
                {{ formatDate(row.statDate, 'YYYY-MM-DD') }}
              </template>

              <template #playCount="{ row }">
                <span class="num-cell">{{ formatPlayCount(row.playCount) }}</span>
              </template>

              <template #commentCount="{ row }">
                <span class="num-cell">{{ formatNumber(row.commentCount) }}</span>
              </template>

              <template #totalInteractions="{ row }">
                <span class="num-cell highlight">{{ formatNumber(row.totalInteractions) }}</span>
              </template>

              <template #interactionRate="{ row }">
                <span class="num-cell">{{ (row.interactionRate * 100).toFixed(2) }}%</span>
              </template>

              <template #interactionTag="{ row }">
                <el-tag
                  :type="getEnumItem(INTERACTION_TAG, row.interactionTag)?.type || 'info'"
                  size="small"
                  effect="light"
                >
                  {{ getEnumLabel(INTERACTION_TAG, row.interactionTag) }}
                </el-tag>
              </template>

              <template #isAnomaly="{ row }">
                <el-tag v-if="row.isAnomaly === 1" type="danger" size="small" effect="dark">
                  异常
                </el-tag>
                <el-tag v-else type="success" size="small" effect="plain">
                  正常
                </el-tag>
              </template>
            </QyDataTable>
          </QySkeleton>
        </el-card>
      </el-tab-pane>

      <el-tab-pane name="export">
        <template #label>
          <span class="tab-label">
            <el-icon><Download /></el-icon>
            批量导出内容互动报表
          </span>
        </template>

        <el-card shadow="never" class="section-card">
          <template #header>
            <div class="card-header">
              <div class="header-left">
                <span class="card-title">导出配置</span>
                <span class="card-subtitle">配置排序方式和导出字段，批量导出内容互动报表</span>
              </div>
            </div>
          </template>

          <el-form :model="exportForm" label-width="120px">
            <el-row :gutter="24">
              <el-col :span="12">
                <el-form-item label="内容品类">
                  <el-select
                    v-model="exportForm.contentCategory"
                    placeholder="全部品类"
                    clearable
                    style="width: 100%"
                  >
                    <el-option
                      v-for="item in contentCategoryOptions"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="统计日期">
                  <el-date-picker
                    v-model="exportForm.dateRange"
                    type="daterange"
                    range-separator="至"
                    start-placeholder="开始日期"
                    end-placeholder="结束日期"
                    value-format="YYYY-MM-DD"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-divider content-position="left">
              <span class="divider-title">
                <el-icon><Sort /></el-icon>
                自定义排序
              </span>
            </el-divider>

            <el-row :gutter="24">
              <el-col :span="12">
                <el-form-item label="排序字段">
                  <el-select v-model="exportForm.sortBy" style="width: 100%">
                    <el-option
                      v-for="item in sortByOptions"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="排序方式">
                  <el-radio-group v-model="exportForm.sortOrder">
                    <el-radio-button value="ASC">
                      <el-icon><ArrowUp /></el-icon>
                      升序
                    </el-radio-button>
                    <el-radio-button value="DESC">
                      <el-icon><ArrowDown /></el-icon>
                      降序
                    </el-radio-button>
                  </el-radio-group>
                </el-form-item>
              </el-col>
            </el-row>

            <el-divider content-position="left">
              <span class="divider-title">
                <el-icon><Filter /></el-icon>
                字段筛选
              </span>
            </el-divider>

            <el-form-item label="导出字段">
              <el-checkbox-group v-model="exportForm.selectedFields">
                <el-row :gutter="12">
                  <el-col :span="6" v-for="field in exportFieldOptions" :key="field.value">
                    <el-checkbox :value="field.value" :label="field.value">
                      {{ field.label }}
                    </el-checkbox>
                  </el-col>
                </el-row>
              </el-checkbox-group>
            </el-form-item>

            <el-form-item>
              <el-button
                type="primary"
                size="large"
                :icon="Download"
                :disabled="!canExport"
                :loading="exportExecuting"
                @click="handleExport"
              >
                {{ exportExecuting ? '正在导出...' : '开始批量导出' }}
              </el-button>
              <el-button
                v-if="exportResult"
                :icon="RefreshLeft"
                @click="() => { exportResult = null; exportProgress.status = 'idle'; exportProgress.percentage = 0; }"
              >
                重置
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card v-if="exportProgress.status !== 'idle'" shadow="never" class="section-card">
          <template #header>
            <div class="card-header">
              <div class="header-left">
                <span class="card-title">导出进度</span>
              </div>
            </div>
          </template>

          <div class="progress-section">
            <div class="progress-header">
              <span>批量处理进度</span>
              <span class="progress-counts">
                已处理 <b>{{ exportProgress.processed }}</b> /
                已导出 <b class="success-text">{{ exportProgress.exported }}</b>
                <span v-if="exportProgress.total">
                  / 总计 <b>{{ exportProgress.total }}</b>
                </span>
              </span>
            </div>
            <el-progress
              :percentage="Math.floor(exportProgress.percentage)"
              :status="exportProgress.status === 'success' ? 'success' : exportProgress.status === 'error' ? 'exception' : undefined"
              :stroke-width="16"
              animated
              striped
              striped-flow
            />
            <div v-if="exportProgress.status === 'success'" class="progress-message success">
              <el-icon><CircleCheck /></el-icon>
              导出完成
            </div>
            <div v-else-if="exportProgress.status === 'error'" class="progress-message error">
              <el-icon><Warning /></el-icon>
              导出失败
            </div>
            <div v-else class="progress-message processing">
              <el-icon class="is-loading"><RefreshLeft /></el-icon>
              正在处理中，请稍候...
            </div>
          </div>
        </el-card>

        <el-card v-if="exportResult" shadow="never" class="section-card result-card">
          <template #header>
            <div class="card-header">
              <div class="header-left">
                <span class="card-title">
                  <el-icon color="#67C23A"><CircleCheck /></el-icon>
                  导出结果
                </span>
              </div>
              <div class="header-right">
                <el-button type="success" :icon="Download" @click="handleDownloadCsv">
                  下载 CSV
                </el-button>
                <el-button type="primary" :icon="Download" @click="handleDownloadJson">
                  下载 JSON
                </el-button>
              </div>
            </div>
          </template>

          <el-descriptions :column="2" border>
            <el-descriptions-item label="批次ID">
              <el-tag type="primary" effect="plain">{{ exportResult.batchId }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="总记录数">
              <span class="highlight-num">{{ exportResult.totalCount }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="导出字段">
              <div class="field-tags">
                <el-tag
                  v-for="f in exportResult.exportFields"
                  :key="f"
                  size="small"
                  type="info"
                  effect="plain"
                  style="margin: 2px;"
                >
                  {{ getEnumLabel(EXPORT_FIELDS, f) }}
                </el-tag>
              </div>
            </el-descriptions-item>
            <el-descriptions-item label="导出时间">
              {{ formatDate(exportResult.exportTime) }}
            </el-descriptions-item>
          </el-descriptions>

          <div class="preview-table-wrap" v-if="exportResult.data.length > 0">
            <div class="preview-title">数据预览（前 {{ Math.min(5, exportResult.data.length) }} 条）</div>
            <el-table :data="exportResult.data.slice(0, 5)" border stripe size="small" max-height="260">
              <el-table-column
                v-for="f in exportResult.exportFields"
                :key="f"
                :label="getEnumLabel(EXPORT_FIELDS, f)"
                :min-width="110"
                align="center"
                show-overflow-tooltip
              >
                <template #default="{ row }">
                  <template v-if="f === 'contentCategory'">
                    {{ getEnumLabel(CONTENT_CATEGORY, row[f]) }}
                  </template>
                  <template v-else-if="f === 'interactionTag'">
                    {{ getEnumLabel(INTERACTION_TAG, row[f]) }}
                  </template>
                  <template v-else-if="f === 'isAnomaly'">
                    {{ row[f] === 1 ? '异常' : '正常' }}
                  </template>
                  <template v-else-if="f === 'statDate'">
                    {{ formatDate(row[f], 'YYYY-MM-DD') }}
                  </template>
                  <template v-else-if="f === 'playCount' || f === 'totalInteractions'">
                    {{ formatNumber(row[f]) }}
                  </template>
                  <template v-else-if="f === 'interactionRate'">
                    {{ (row[f] * 100).toFixed(2) }}%
                  </template>
                  <template v-else>
                    {{ row[f] }}
                  </template>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-card>
      </el-tab-pane>

      <el-tab-pane name="screen">
        <template #label>
          <span class="tab-label">
            <el-icon><Warning /></el-icon>
            批量筛查低互动内容
          </span>
        </template>

        <el-card shadow="never" class="section-card">
          <template #header>
            <div class="card-header">
              <div class="header-left">
                <span class="card-title">筛查配置</span>
                <span class="card-subtitle">配置阈值和筛选条件，批量识别低互动低效内容</span>
              </div>
            </div>
          </template>

          <el-form :model="screenForm" label-width="120px">
            <el-row :gutter="24">
              <el-col :span="8">
                <el-form-item label="互动量阈值">
                  <el-input-number
                    v-model="screenForm.threshold"
                    :min="0"
                    :step="10"
                    controls-position="right"
                    style="width: 100%"
                  />
                  <div class="form-tip">总互动量低于此阈值的内容将被标记为需优化</div>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="内容品类">
                  <el-select
                    v-model="screenForm.contentCategory"
                    placeholder="全部品类"
                    clearable
                    style="width: 100%"
                  >
                    <el-option
                      v-for="item in contentCategoryOptions"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="统计日期">
                  <el-date-picker
                    v-model="screenForm.dateRange"
                    type="daterange"
                    range-separator="至"
                    start-placeholder="开始日期"
                    end-placeholder="结束日期"
                    value-format="YYYY-MM-DD"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item>
              <el-button
                type="warning"
                size="large"
                :icon="Search"
                :disabled="!canScreen"
                :loading="screenLoading"
                @click="handleScreen"
              >
                {{ screenLoading ? '正在筛查...' : '开始批量筛查' }}
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card v-if="screenResult" shadow="never" class="section-card result-card">
          <template #header>
            <div class="card-header">
              <div class="header-left">
                <span class="card-title">
                  <el-icon color="#E6A23C"><Warning /></el-icon>
                  筛查结果
                </span>
              </div>
            </div>
          </template>

          <el-row :gutter="16">
            <el-col :span="8">
              <div class="stat-card total">
                <div class="stat-num">{{ screenResult.totalCount }}</div>
                <div class="stat-label">扫描总数</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="stat-card low">
                <div class="stat-num">{{ screenResult.lowInteractionCount }}</div>
                <div class="stat-label">低互动内容数</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="stat-card tagged">
                <div class="stat-num">{{ screenResult.taggedCount }}</div>
                <div class="stat-label">已标记需优化</div>
              </div>
            </el-col>
          </el-row>

          <el-alert
            v-if="screenResult.lowInteractionCount > 0"
            type="warning"
            show-icon
            :closable="false"
            style="margin-top: 16px;"
          >
            <template #title>
              共发现 {{ screenResult.lowInteractionCount }} 条低互动内容，其中 {{ screenResult.taggedCount }} 条已自动标记为「需优化」，建议及时优化内容质量或调整推广策略。
            </template>
          </el-alert>
          <el-alert
            v-else
            type="success"
            show-icon
            :closable="false"
            style="margin-top: 16px;"
          >
            <template #title>
              未发现低互动内容，当前内容互动表现良好。
            </template>
          </el-alert>
        </el-card>

        <el-card v-if="lowInteractionList.length > 0" shadow="never" class="section-card">
          <template #header>
            <div class="card-header">
              <div class="header-left">
                <span class="card-title">低互动内容列表</span>
                <span class="card-subtitle">以下内容互动量低于阈值，建议优化</span>
              </div>
            </div>
          </template>

          <QyDataTable
            :columns="screenColumns"
            :data="lowInteractionList"
            :loading="screenLoading"
            :total="lowInteractionList.length"
            :page="1"
            :page-size="lowInteractionList.length"
            :border="true"
            :stripe="true"
            :selection="true"
            :index="true"
          >
            <template #contentTitle="{ row }">
              <span v-if="row.content">{{ row.content.contentTitle }}</span>
              <span v-else style="color: #909399">-</span>
            </template>

            <template #contentCategory="{ row }">
              <el-tag v-if="row.content" type="info" size="small">
                {{ getEnumLabel(CONTENT_CATEGORY, row.content.contentCategory) }}
              </el-tag>
              <span v-else style="color: #909399">-</span>
            </template>

            <template #playCount="{ row }">
              <span class="num-cell">{{ formatPlayCount(row.playCount) }}</span>
            </template>

            <template #totalInteractions="{ row }">
              <span class="num-cell low">{{ formatNumber(row.totalInteractions) }}</span>
            </template>

            <template #interactionRate="{ row }">
              <span class="num-cell">{{ (row.interactionRate * 100).toFixed(2) }}%</span>
            </template>

            <template #screenInteractionTag="{ row }">
              <el-tag
                v-if="screenedIds.includes(row.contentId)"
                type="warning"
                size="small"
                effect="dark"
              >
                需优化
              </el-tag>
              <el-tag
                v-else
                :type="getEnumItem(INTERACTION_TAG, row.interactionTag)?.type || 'info'"
                size="small"
              >
                {{ getEnumLabel(INTERACTION_TAG, row.interactionTag) }}
              </el-tag>
            </template>
          </QyDataTable>
        </el-card>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.analytics-batch-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header-card {
  .page-header {
    .header-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;
      font-weight: 600;
      color: $text-primary;
    }
    .header-desc {
      margin-top: 6px;
      font-size: 13px;
      color: $text-secondary;
    }
  }
}

.main-tabs {
  :deep(.el-tabs__nav-wrap::after) {
    background-color: $border-lighter;
  }
  :deep(.el-tabs__item) {
    font-size: 15px;
    font-weight: 500;
    padding: 0 20px;
  }
  .tab-label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
}

.section-card {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    .header-left {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .card-title {
      font-size: 16px;
      font-weight: 600;
      color: $text-primary;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .card-subtitle {
      font-size: 12px;
      color: $text-secondary;
    }
  }

  .form-tip {
    font-size: 12px;
    color: $text-secondary;
    margin-top: 4px;
  }

  .divider-title {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    font-weight: 500;
    color: $text-primary;
  }

  .summary-bar {
    margin-top: 8px;
  }
}

.num-cell {
  font-variant-numeric: tabular-nums;
  font-family: 'SF Mono', Menlo, Consolas, monospace;
  &.highlight {
    color: $primary-color;
    font-weight: 600;
  }
  &.low {
    color: $warning-color;
    font-weight: 600;
  }
}

.progress-section {
  padding: 20px;
  background: #FAFBFC;
  border-radius: $radius-md;
  border: 1px solid $border-lighter;

  .progress-header {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    margin-bottom: 12px;
    font-weight: 500;

    .progress-counts {
      font-weight: 400;
      font-size: 13px;
      color: $text-secondary;
      b {
        color: $text-primary;
        font-weight: 600;
      }
      .success-text {
        color: $success-color;
      }
    }
  }

  .progress-message {
    margin-top: 12px;
    padding: 10px 14px;
    border-radius: $radius-base;
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 8px;

    &.success {
      background: rgba(103, 194, 58, 0.1);
      color: $success-color;
    }
    &.error {
      background: rgba(245, 108, 108, 0.1);
      color: $danger-color;
    }
    &.processing {
      background: rgba(64, 158, 255, 0.1);
      color: $primary-color;
    }
  }
}

.result-card {
  .highlight-num {
    font-size: 18px;
    font-weight: 600;
    color: $primary-color;
  }
  .field-tags {
    display: flex;
    flex-wrap: wrap;
  }
  .preview-table-wrap {
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid $border-lighter;
    .preview-title {
      font-size: 13px;
      font-weight: 500;
      color: $text-primary;
      margin-bottom: 12px;
    }
  }
}

.stat-card {
  padding: 20px;
  border-radius: $radius-md;
  text-align: center;
  border: 1px solid $border-lighter;
  transition: $transition-base;

  &:hover {
    box-shadow: $shadow-light;
    transform: translateY(-2px);
  }

  .stat-num {
    font-size: 28px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    line-height: 1.2;
  }
  .stat-label {
    margin-top: 8px;
    font-size: 13px;
    color: $text-secondary;
  }

  &.total {
    background: linear-gradient(135deg, rgba(64, 158, 255, 0.08), rgba(64, 158, 255, 0.02));
    .stat-num { color: $primary-color; }
  }
  &.low {
    background: linear-gradient(135deg, rgba(230, 162, 60, 0.08), rgba(230, 162, 60, 0.02));
    .stat-num { color: $warning-color; }
  }
  &.tagged {
    background: linear-gradient(135deg, rgba(245, 108, 108, 0.08), rgba(245, 108, 108, 0.02));
    .stat-num { color: $danger-color; }
  }
}
</style>
