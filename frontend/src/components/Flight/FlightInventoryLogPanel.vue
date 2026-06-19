<template>
  <div class="flight-inventory-log-panel">
    <div class="panel-header">
      <div class="header-title">
        <el-icon color="#722ed1"><DataLine /></el-icon>
        <span>库存台账溯源</span>
      </div>
      <div class="header-filters">
        <el-select v-model="filterForm.operationCategory" placeholder="操作分类" clearable size="small" style="width: 120px">
          <el-option
            v-for="(item, key) in InventoryLogCategoryEnum"
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
            v-for="(item, key) in InventoryLogTypeEnum"
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
        <span class="stat-label">库存增加</span>
        <span class="stat-value">+{{ totalIncrease }}</span>
      </div>
      <div class="stat-item danger">
        <span class="stat-label">库存减少</span>
        <span class="stat-value">-{{ totalDecrease }}</span>
      </div>
      <div class="stat-item warning">
        <span class="stat-label">批量操作</span>
        <span class="stat-value">{{ batchCount }}</span>
      </div>
    </div>

    <div class="log-container" ref="logContainerRef" @scroll="handleScroll">
      <div class="log-list">
        <div
          v-for="(group, category) in groupedLogs"
          :key="category"
          class="log-category-group"
        >
          <div class="category-header sticky-header" :data-category="category">
            <div class="category-title" :style="{ color: getCategoryColor(category) }">
              <el-icon><component :is="getCategoryIcon(category)" /></el-icon>
              <span>{{ getCategoryLabel(category) }}</span>
              <el-tag size="small" type="info">{{ group.length }} 条</el-tag>
            </div>
          </div>

          <div class="log-items">
            <div
              v-for="log in group"
              :key="log.id"
              class="log-item"
              :class="{ expanded: expandedLogId === log.id }"
              @click="toggleLogExpand(log)"
            >
              <div class="log-timeline">
                <div class="timeline-dot" :style="{ backgroundColor: getLogTypeColor(log.operationType) }">
                  <el-icon><component :is="getLogTypeIcon(log.operationType)" /></el-icon>
                </div>
                <div class="timeline-line"></div>
              </div>

              <div class="log-content">
                <div class="log-header">
                  <div class="log-title" :style="{ color: getLogTypeColor(log.operationType) }">
                    <el-icon><component :is="getLogTypeIcon(log.operationType)" /></el-icon>
                    <span>{{ getLogTypeLabel(log.operationType) }}</span>
                  </div>
                  <div class="log-time">{{ formatDateTime(log.createdAt) }}</div>
                </div>

                <div class="log-summary">
                  <span class="log-meta">
                    <el-tag size="small" :type="getCabinTagType(log.cabinClass)">
                      {{ getCabinLabel(log.cabinClass) }}
                    </el-tag>
                    <el-tag size="small" type="info">{{ getInventoryTypeLabel(log.inventoryType) }}</el-tag>
                  </span>

                  <span class="log-operator">操作人: {{ log.operatorName || '系统' }}</span>

                  <span
                    v-if="log.changeQuantity !== null && log.changeQuantity !== undefined"
                    class="log-change"
                    :class="log.changeDirection"
                  >
                    {{ log.changeDirection === 'increase' ? '+' : '' }}{{ log.changeQuantity }} 张
                  </span>
                </div>

                <div v-if="expandedLogId === log.id" class="log-detail">
                  <el-descriptions :column="3" border size="small" class="detail-desc">
                    <el-descriptions-item label="操作类型">
                      <el-tag :color="getLogTypeColor(log.operationType)" effect="light">
                        {{ getLogTypeLabel(log.operationType) }}
                      </el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item label="操作人">
                      {{ log.operatorName || '-' }}
                      <el-tag v-if="log.operatorRole" size="small" type="info">
                        {{ log.operatorRole }}
                      </el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item label="操作时间">
                      {{ formatDateTime(log.createdAt) }}
                    </el-descriptions-item>

                    <el-descriptions-item label="总库存(前)">
                      <span class="stock-num">{{ log.beforeTotalStock }}</span>
                    </el-descriptions-item>
                    <el-descriptions-item label="总库存(后)">
                      <span class="stock-num">{{ log.afterTotalStock }}</span>
                    </el-descriptions-item>
                    <el-descriptions-item label="变动数量">
                      <span
                        class="stock-change"
                        :class="log.changeDirection"
                      >
                        {{ log.changeDirection === 'increase' ? '+' : '' }}{{ log.changeQuantity || '-' }}
                      </span>
                    </el-descriptions-item>

                    <el-descriptions-item label="可用库存(前)">
                      {{ log.beforeAvailableStock || '-' }}
                    </el-descriptions-item>
                    <el-descriptions-item label="可用库存(后)">
                      {{ log.afterAvailableStock || '-' }}
                    </el-descriptions-item>
                    <el-descriptions-item label="操作状态">
                      <el-tag :type="log.operationStatus === 1 ? 'success' : 'danger'">
                        {{ log.operationStatus === 1 ? '成功' : '失败' }}
                      </el-tag>
                      <span v-if="log.failReason" class="fail-reason">
                        {{ log.failReason }}
                      </span>
                    </el-descriptions-item>

                    <el-descriptions-item v-if="log.isBatchOperation" label="批量操作">
                      <el-tag type="warning">是</el-tag>
                      <span>影响 {{ log.affectedFlightCount }} 条记录</span>
                    </el-descriptions-item>
                    <el-descriptions-item v-if="log.relatedOrderNo" label="关联订单">
                      {{ log.relatedOrderNo }}
                    </el-descriptions-item>
                    <el-descriptions-item label="操作IP">
                      {{ log.operationIp || '-' }}
                    </el-descriptions-item>

                    <el-descriptions-item label="变更字段" v-if="log.changeFields" :span="3">
                      <div class="change-fields">
                        <el-tag
                          v-for="field in parseChangeFields(log.changeFields)"
                          :key="field"
                          size="small"
                          type="primary"
                          effect="plain"
                        >
                          {{ getFieldLabel(field) }}
                        </el-tag>
                      </div>
                    </el-descriptions-item>

                    <el-descriptions-item label="操作备注" v-if="log.operationRemark" :span="3">
                      <span class="long-text" @click.stop>
                        {{ log.operationRemark }}
                      </span>
                    </el-descriptions-item>

                    <el-descriptions-item label="生效范围" v-if="log.effectScope" :span="3">
                      <span class="long-text" @click.stop>
                        {{ log.effectScope }}
                      </span>
                    </el-descriptions-item>
                  </el-descriptions>
                </div>

                <div class="log-expand-tip">
                  <el-icon class="expand-icon">
                    <component :is="expandedLogId === log.id ? 'ArrowUp' : 'ArrowDown'" />
                  </el-icon>
                  <span>{{ expandedLogId === log.id ? '收起详情' : '点击展开详情' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="loading" class="loading-more">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>加载中...</span>
      </div>

      <div v-if="!loading && logList.length === 0" class="empty-log">
        <el-empty description="暂无库存操作记录" />
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
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
import {
  DataLine,
  Search,
  Plus,
  Edit,
  ShoppingCart,
  RefreshLeft,
  Wallet,
  Lock,
  Unlock,
  Star,
  RefreshRight,
  FolderAdd,
  Files,
  Warning,
  ArrowUp,
  ArrowDown,
  Loading
} from '@element-plus/icons-vue'
import {
  CabinClassEnum,
  InventoryTypeEnum,
  InventoryLogTypeEnum,
  InventoryLogCategoryEnum,
  InventoryValidateFieldEnum
} from '@/utils/enums'
import { getFlightInventoryLogs } from '@/api/flight'

const props = defineProps({
  inventoryId: {
    type: Number,
    default: null
  },
  flightId: {
    type: Number,
    default: null
  }
})

const logContainerRef = ref(null)
const logList = ref([])
const loading = ref(false)
const expandedLogId = ref(null)

const filterForm = reactive({
  operationType: null,
  operationCategory: null,
  dateRange: null,
  startTime: '',
  endTime: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const iconMap = {
  create: Plus,
  adjust: Edit,
  occupy: ShoppingCart,
  release: RefreshLeft,
  lock: Lock,
  unlock: Unlock,
  reserve: Star,
  supplement: FolderAdd,
  batch: Files,
  warning: Warning
}

const groupedLogs = computed(() => {
  const groups = {}
  for (const log of logList.value) {
    const category = log.operationCategory || 'adjust'
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(log)
  }
  return groups
})

const totalIncrease = computed(() => {
  return logList.value
    .filter(log => log.changeDirection === 'increase' && log.changeQuantity)
    .reduce((sum, log) => sum + log.changeQuantity, 0)
})

const totalDecrease = computed(() => {
  return logList.value
    .filter(log => log.changeDirection === 'decrease' && log.changeQuantity)
    .reduce((sum, log) => sum + Math.abs(log.changeQuantity), 0)
})

const batchCount = computed(() => {
  return logList.value.filter(log => log.isBatchOperation).length
})

function getCategoryColor(category) {
  return InventoryLogCategoryEnum[category?.toUpperCase()]?.color || '#909399'
}

function getCategoryLabel(category) {
  return InventoryLogCategoryEnum[category?.toUpperCase()]?.label || category
}

function getCategoryIcon(category) {
  return iconMap[category] || Files
}

function getLogTypeColor(type) {
  const key = Object.keys(InventoryLogTypeEnum).find(k => InventoryLogTypeEnum[k].value === type)
  return InventoryLogTypeEnum[key]?.color || '#909399'
}

function getLogTypeLabel(type) {
  const key = Object.keys(InventoryLogTypeEnum).find(k => InventoryLogTypeEnum[k].value === type)
  return InventoryLogTypeEnum[key]?.label || '未知操作'
}

function getLogTypeIcon(type) {
  const key = Object.keys(InventoryLogTypeEnum).find(k => InventoryLogTypeEnum[k].value === type)
  const name = InventoryLogTypeEnum[key]?.icon || 'Files'
  const iconMap = { Plus, Edit, ShoppingCart, RefreshLeft, Wallet, Lock, Unlock, Star, RefreshRight, FolderAdd, Files, Warning }
  return iconMap[name] || Files
}

function getCabinLabel(cabinClass) {
  const cabin = Object.values(CabinClassEnum).find(c => c.value === cabinClass)
  return cabin ? cabin.label : cabinClass
}

function getCabinTagType(cabinClass) {
  const typeMap = {
    economy: 'success',
    business: 'warning',
    first: 'danger',
    special: 'info'
  }
  return typeMap[cabinClass] || 'info'
}

function getInventoryTypeLabel(type) {
  const key = Object.keys(InventoryTypeEnum).find(k => InventoryTypeEnum[k].value === type)
  return InventoryTypeEnum[key]?.label || type
}

function getFieldLabel(field) {
  return InventoryValidateFieldEnum[field] || field
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
  if (!time) return ''
  return new Date(time).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

function toggleLogExpand(log) {
  if (expandedLogId.value === log.id) {
    expandedLogId.value = null
  } else {
    expandedLogId.value = log.id
  }
}

function handleScroll() {
  // 吸顶效果通过CSS sticky实现
}

async function loadLogs() {
  loading.value = true
  try {
    if (filterForm.dateRange && filterForm.dateRange.length === 2) {
      filterForm.startTime = filterForm.dateRange[0]
      filterForm.endTime = filterForm.dateRange[1]
    } else {
      filterForm.startTime = ''
      filterForm.endTime = ''
    }

    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      operationType: filterForm.operationType,
      operationCategory: filterForm.operationCategory,
      startTime: filterForm.startTime,
      endTime: filterForm.endTime
    }

    if (props.flightId) {
      params.flightId = props.flightId
    }

    const res = await getFlightInventoryLogs(props.inventoryId, params)
    logList.value = res.items || res.data?.list || []
    pagination.total = res.total || res.data?.total || 0

    expandedLogId.value = null
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
  filterForm.startTime = ''
  filterForm.endTime = ''
  pagination.page = 1
  loadLogs()
}

watch(() => props.inventoryId, () => {
  pagination.page = 1
  loadLogs()
})

onMounted(() => {
  loadLogs()
})
</script>
