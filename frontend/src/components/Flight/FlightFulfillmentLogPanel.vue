<template>
  <div class="flight-fulfillment-log-panel">
    <div class="panel-header">
      <div class="header-title">
        <el-icon color="#722ed1"><DataLine /></el-icon>
        <span>履约台账溯源</span>
      </div>
      <div class="header-filters">
        <el-select v-model="filterForm.operationCategory" placeholder="操作分类" clearable size="small" style="width: 120px">
          <el-option
            v-for="(item, key) in FulfillmentLogCategoryEnum"
            :key="key"
            :label="item.label"
            :value="item.value"
          >
            <span :style="{ color: item.color }">●</span>
            <span style="margin-left: 6px">{{ item.label }}</span>
          </el-option>
        </el-select>
        <el-select v-model="filterForm.operationType" placeholder="操作类型" clearable size="small" style="width: 140px">
          <el-option
            v-for="(item, key) in FulfillmentLogTypeEnum"
            :key="key"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <el-date-picker
          v-model="filterForm.dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          size="small"
          style="width: 260px"
        />
        <el-button size="small" type="primary" @click="loadLogs">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
        <el-button size="small" @click="resetFilter">重置</el-button>
      </div>
    </div>

    <div class="log-stats">
      <div class="stat-item">
        <span class="stat-label">总记录数</span>
        <span class="stat-value">{{ pagination.total }}</span>
      </div>
      <div class="stat-item success">
        <span class="stat-label">成功</span>
        <span class="stat-value">{{ successCount }}</span>
      </div>
      <div class="stat-item danger">
        <span class="stat-label">失败</span>
        <span class="stat-value">{{ failCount }}</span>
      </div>
      <div class="stat-item warning">
        <span class="stat-label">批量操作</span>
        <span class="stat-value">{{ batchCount }}</span>
      </div>
    </div>

    <div class="log-container">
      <div class="log-categories">
        <div
          v-for="(logs, category) in categorizedLogs"
          :key="category"
          class="log-category-group"
        >
          <div class="category-header sticky-category">
            <div class="category-title" :style="{ color: getCategoryColor(category) }">
              <el-icon><component :is="getCategoryIcon(category)" /></el-icon>
              <span>{{ getCategoryLabel(category) }}</span>
              <el-tag size="small" effect="light">{{ logs.length }} 条</el-tag>
            </div>
          </div>

          <div class="log-table-wrapper">
            <el-table
              :data="logs"
              border
              stripe
              size="small"
              class="log-table striped-table"
              @row-click="handleRowClick"
              :row-class-name="tableRowClassName"
            >
              <el-table-column label="操作类型" width="160">
                <template #default="{ row }">
                  <div class="log-type-cell" :style="{ color: getLogTypeColor(row.operationType) }">
                    <el-icon><component :is="getLogTypeIcon(row.operationType)" /></el-icon>
                    <span>{{ getLogTypeLabel(row.operationType) }}</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="操作方向" width="100">
                <template #default="{ row }">
                  <el-tag :type="getDirectionTagType(row.operationDirection)" size="small">
                    {{ getDirectionLabel(row.operationDirection) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="row.operationStatus === 1 ? 'success' : 'danger'" size="small">
                    {{ row.operationStatus === 1 ? '成功' : '失败' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作内容" min-width="240">
                <template #default="{ row }">
                  <el-tooltip
                    v-if="row.changeContent && row.changeContent.length > 50"
                    :content="row.changeContent"
                    placement="top"
                  >
                    <span class="change-content ellipsis-text">{{ row.changeContent }}</span>
                  </el-tooltip>
                  <span v-else class="change-content">{{ row.changeContent || '-' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="操作人" width="110">
                <template #default="{ row }">
                  {{ row.operatorName || '系统' }}
                  <el-tag v-if="row.operatorRole" size="small" type="info" style="margin-left: 4px">
                    {{ row.operatorRole }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作时间" width="170">
                <template #default="{ row }">
                  {{ formatDateTime(row.createdAt) }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="80" align="center">
                <template #default="{ row }">
                  <el-button type="primary" link size="small" @click.stop="handleViewDetail(row)">
                    详情
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </div>

      <div v-if="loading" class="loading-more">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>加载中...</span>
      </div>

      <div v-if="!loading && logList.length === 0" class="empty-log">
        <el-empty description="暂无履约操作记录" />
      </div>
    </div>

    <div class="pagination-container">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadLogs"
        @current-change="loadLogs"
      />
    </div>

    <el-dialog
      v-model="detailVisible"
      title="履约操作详情"
      width="700px"
      class="log-detail-dialog scale-dialog"
      :close-on-click-modal="false"
    >
      <div v-if="currentLog" class="log-detail-content">
        <el-descriptions :column="2" border size="small" class="detail-descriptions">
          <el-descriptions-item label="操作类型">
            <div class="detail-type" :style="{ color: getLogTypeColor(currentLog.operationType) }">
              <el-icon><component :is="getLogTypeIcon(currentLog.operationType)" /></el-icon>
              <span>{{ getLogTypeLabel(currentLog.operationType) }}</span>
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="操作分类">
            <el-tag :color="getCategoryColor(currentLog.operationCategory)" effect="light">
              {{ getCategoryLabel(currentLog.operationCategory) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="操作方向">
            <el-tag :type="getDirectionTagType(currentLog.operationDirection)" size="small">
              {{ getDirectionLabel(currentLog.operationDirection) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="操作状态">
            <el-tag :type="currentLog.operationStatus === 1 ? 'success' : 'danger'" size="small">
              {{ currentLog.operationStatus === 1 ? '成功' : '失败' }}
            </el-tag>
            <span v-if="currentLog.failReason" style="color: #ff4d4f; margin-left: 8px">
              {{ currentLog.failReason }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="操作人">
            {{ currentLog.operatorName || '系统' }}
            <el-tag v-if="currentLog.operatorRole" size="small" type="info" style="margin-left: 4px">
              {{ currentLog.operatorRole }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="操作时间">
            {{ formatDateTime(currentLog.createdAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="操作IP">
            {{ currentLog.operationIp || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="是否批量">
            <el-tag v-if="currentLog.isBatchOperation" size="small" type="warning">
              批量操作
            </el-tag>
            <span v-else>单条操作</span>
          </el-descriptions-item>
          <el-descriptions-item label="操作前阶段" v-if="currentLog.beforeFulfillmentStage">
            {{ getStageLabel(currentLog.beforeFulfillmentStage) }}
          </el-descriptions-item>
          <el-descriptions-item label="操作后阶段" v-if="currentLog.afterFulfillmentStage">
            {{ getStageLabel(currentLog.afterFulfillmentStage) }}
          </el-descriptions-item>
          <el-descriptions-item label="操作备注" v-if="currentLog.operationRemark" :span="2">
            {{ currentLog.operationRemark }}
          </el-descriptions-item>
          <el-descriptions-item label="操作详情" :span="2">
            <div class="detail-content">{{ currentLog.changeContent || '-' }}</div>
          </el-descriptions-item>
          <el-descriptions-item label="变更字段" v-if="currentLog.changeFields && currentLog.changeFields.length > 0" :span="2">
            <div class="change-fields">
              <el-tag
                v-for="field in parseChangeFields(currentLog.changeFields)"
                :key="field"
                size="small"
                type="primary"
                effect="plain"
              >
                {{ getFieldLabel(field) }}
              </el-tag>
            </div>
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import {
  DataLine,
  Search,
  Plus,
  Check,
  Close,
  Tickets,
  Refresh,
  Delete,
  Warning,
  WarningFilled,
  Document,
  Message,
  Location,
  Loading,
  Stamp
} from '@element-plus/icons-vue'
import {
  FulfillmentStageEnum,
  FulfillmentLogTypeEnum,
  FulfillmentLogCategoryEnum,
  FulfillmentChangeDirectionEnum,
  FulfillmentValidateFieldEnum
} from '@/utils/enums'
import { getFlightFulfillmentLogs } from '@/api/flight'

const props = defineProps({
  fulfillmentId: {
    type: Number,
    default: null
  }
})

const logList = ref([])
const loading = ref(false)
const detailVisible = ref(false)
const currentLog = ref(null)

const filterForm = reactive({
  operationType: null,
  operationCategory: null,
  dateRange: null
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const iconMap = {
  audit: Stamp,
  ticket: Tickets,
  flight: Warning,
  abnormal: WarningFilled,
  voucher: Document,
  ledger: DataLine
}

const logIconMap = {
  create: Plus,
  audit_pass: Check,
  audit_reject: Close,
  issue_ticket: Tickets,
  change_ticket: Refresh,
  cancel_ticket: Delete,
  flight_change: Warning,
  mark_abnormal: WarningFilled,
  handle_abnormal: Check,
  terminate: Close,
  batch_issue: Tickets,
  batch_process: Document,
  voucher_generate: Document,
  voucher_send: Message,
  update_ledger: DataLine,
  update_travel_record: Location
}

const categorizedLogs = computed(() => {
  const groups = {}
  for (const log of logList.value) {
    const category = log.operationCategory || 'audit'
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(log)
  }
  return groups
})

const successCount = computed(() => {
  return logList.value.filter(l => l.operationStatus === 1).length
})

const failCount = computed(() => {
  return logList.value.filter(l => l.operationStatus !== 1).length
})

const batchCount = computed(() => {
  return logList.value.filter(l => l.isBatchOperation).length
})

function getCategoryColor(category) {
  return FulfillmentLogCategoryEnum[category?.toUpperCase()]?.color || '#909399'
}

function getCategoryLabel(category) {
  return FulfillmentLogCategoryEnum[category?.toUpperCase()]?.label || category
}

function getCategoryIcon(category) {
  return iconMap[category] || Document
}

function getLogTypeColor(type) {
  const key = Object.keys(FulfillmentLogTypeEnum).find(k => FulfillmentLogTypeEnum[k].value === type)
  return FulfillmentLogTypeEnum[key]?.color || '#909399'
}

function getLogTypeLabel(type) {
  const key = Object.keys(FulfillmentLogTypeEnum).find(k => FulfillmentLogTypeEnum[k].value === type)
  return FulfillmentLogTypeEnum[key]?.label || type
}

function getLogTypeIcon(type) {
  const key = Object.keys(FulfillmentLogTypeEnum).find(k => FulfillmentLogTypeEnum[k].value === type)
  const iconName = FulfillmentLogTypeEnum[key]?.icon || 'Document'
  return logIconMap[iconName] || Document
}

function getDirectionLabel(direction) {
  const key = Object.keys(FulfillmentChangeDirectionEnum).find(k => FulfillmentChangeDirectionEnum[k].value === direction)
  return FulfillmentChangeDirectionEnum[key]?.label || direction
}

function getDirectionTagType(direction) {
  const typeMap = {
    forward: 'success',
    backward: 'danger',
    info: 'primary',
    none: 'info'
  }
  return typeMap[direction] || 'info'
}

function getStageLabel(stage) {
  const key = Object.keys(FulfillmentStageEnum).find(k => FulfillmentStageEnum[k].value === stage)
  return FulfillmentStageEnum[key]?.label || stage
}

function getFieldLabel(field) {
  return FulfillmentValidateFieldEnum[field] || field
}

function parseChangeFields(changeFields) {
  if (!changeFields) return []
  try {
    return typeof changeFields === 'string' ? JSON.parse(changeFields) : changeFields
  } catch {
    return []
  }
}

function formatDateTime(time) {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

function tableRowClassName({ rowIndex }) {
  return rowIndex % 2 === 0 ? 'even-row' : 'odd-row'
}

function handleRowClick(row) {
  handleViewDetail(row)
}

function handleViewDetail(row) {
  currentLog.value = row
  detailVisible.value = true
}

async function loadLogs() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      operationType: filterForm.operationType,
      operationCategory: filterForm.operationCategory
    }

    if (filterForm.dateRange && filterForm.dateRange.length === 2) {
      params.startTime = filterForm.dateRange[0]
      params.endTime = filterForm.dateRange[1]
    }

    const res = await getFlightFulfillmentLogs(props.fulfillmentId, params)
    logList.value = res.items || res.data?.list || []
    pagination.total = res.total || res.data?.total || 0
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function resetFilter() {
  filterForm.operationType = null
  filterForm.operationCategory = null
  filterForm.dateRange = null
  pagination.page = 1
  loadLogs()
}

watch(() => props.fulfillmentId, () => {
  pagination.page = 1
  loadLogs()
})

onMounted(() => {
  loadLogs()
})
</script>
