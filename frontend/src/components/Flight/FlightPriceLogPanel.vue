<template>
  <div class="flight-price-log-panel">
    <div class="panel-header">
      <div class="header-title">
        <el-icon color="#722ed1"><DataLine /></el-icon>
        <span>价格调整日志</span>
      </div>
      <div class="header-filters">
        <el-select v-model="filterForm.operationType" placeholder="操作类型" clearable size="small" style="width: 140px">
          <el-option
            v-for="(item, key) in FlightPriceLogTypeEnum"
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
          style="width: 280px"
        />
        <el-button size="small" type="primary" @click="loadLogs">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
        <el-button size="small" @click="resetFilter">重置</el-button>
      </div>
    </div>

    <div class="table-container">
      <el-table
        ref="tableRef"
        :data="tableData"
        v-loading="loading"
        class="price-log-table"
        :header-cell-style="headerCellStyle"
        :cell-style="cellStyle"
        @row-dblclick="handleRowDblClick"
      >
        <el-table-column
          type="expand"
          width="60"
          :expanded-row-keys="expandedRowKeys"
          @expand-change="handleExpandChange"
        >
          <template #default="{ row }">
            <div class="expand-detail" v-if="expandedRow === row">
              <el-descriptions :column="3" border size="small">
                <el-descriptions-item label="操作类型">
                  <el-tag :color="getLogTypeColor(row.operationType)" effect="light">
                    {{ getLogTypeLabel(row.operationType) }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="操作人">
                  <span>{{ row.operatorName || '-' }}</span>
                  <el-tag size="small" type="info" v-if="row.operatorRole">{{ row.operatorRole }}</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="操作时间">
                  {{ formatDateTime(row.createdAt) }}
                </el-descriptions-item>
                <el-descriptions-item label="调整前价格">
                  <span class="old-price">¥{{ row.beforePrice?.toFixed(2) || '-' }}</span>
                </el-descriptions-item>
                <el-descriptions-item label="调整后价格">
                  <span class="new-price">¥{{ row.afterPrice?.toFixed(2) || '-' }}</span>
                </el-descriptions-item>
                <el-descriptions-item label="价格变动">
                  <span :class="row.priceChangeAmount > 0 ? 'price-up' : 'price-down'">
                    {{ row.priceChangeAmount > 0 ? '+' : '' }}{{ row.priceChangeAmount?.toFixed(2) || '-' }}
                    ({{ row.priceChangePercent > 0 ? '+' : '' }}{{ row.priceChangePercent?.toFixed(1) || '-' }}%)
                  </span>
                </el-descriptions-item>
                <el-descriptions-item label="变更字段" :span="3">
                  <div class="change-fields">
                    <el-tag
                      v-for="field in parseChangeFields(row.changeFields)"
                      :key="field"
                      size="small"
                      type="primary"
                      effect="plain"
                    >
                      {{ getFieldLabel(field) }}
                    </el-tag>
                  </div>
                </el-descriptions-item>
                <el-descriptions-item label="生效范围" :span="3">
                  {{ row.effectScope || '-' }}
                </el-descriptions-item>
                <el-descriptions-item label="动态定价规则" :span="3" v-if="row.dynamicRuleData">
                  <el-input
                    v-model="row.dynamicRuleData"
                    type="textarea"
                    :rows="3"
                    readonly
                    style="font-family: monospace; font-size: 12px"
                  />
                </el-descriptions-item>
                <el-descriptions-item label="操作备注" :span="3">
                  {{ row.operationRemark || '-' }}
                </el-descriptions-item>
                <el-descriptions-item label="受影响订单数" v-if="row.affectedOrderCount > 0">
                  <el-tag type="warning">{{ row.affectedOrderCount }} 单</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="操作状态">
                  <el-tag :type="row.operationStatus === 1 ? 'success' : 'danger'">
                    {{ row.operationStatus === 1 ? '成功' : '失败' }}
                  </el-tag>
                  <span class="fail-reason" v-if="row.failReason">{{ row.failReason }}</span>
                </el-descriptions-item>
                <el-descriptions-item label="操作IP">
                  {{ row.operationIp || '-' }}
                </el-descriptions-item>
              </el-descriptions>
            </div>
          </template>
        </el-table-column>

        <el-table-column
          v-for="col in columns"
          :key="col.prop"
          :prop="col.prop"
          :label="col.label"
          :width="col.width"
          :min-width="col.minWidth"
          :resizable="true"
          :formatter="col.formatter"
          show-overflow-tooltip
        >
          <template #header="{ column }">
            <div class="header-cell">
              <span>{{ column.label }}</span>
              <div
                class="resize-handle"
                @mousedown="(e) => startResize(e, column)"
              />
            </div>
          </template>

          <template #default="{ row }">
            <template v-if="col.prop === 'operationType'">
              <div class="operation-type-cell">
                <el-icon :color="getLogTypeColor(row.operationType)">
                  <component :is="getLogTypeIcon(row.operationType)" />
                </el-icon>
                <span>{{ getLogTypeLabel(row.operationType) }}</span>
              </div>
            </template>
            <template v-else-if="col.prop === 'priceChange'">
              <div class="price-change-cell" :class="getPriceChangeClass(row)">
                <el-icon>
                  <component :is="row.priceChangeAmount > 0 ? 'Top' : row.priceChangeAmount < 0 ? 'Bottom' : 'Minus'" />
                </el-icon>
                <span>
                  {{ row.priceChangeAmount > 0 ? '+' : '' }}{{ row.priceChangeAmount?.toFixed(2) || '-' }}
                </span>
              </div>
            </template>
            <template v-else-if="col.prop === 'changeFields'">
              <div class="fields-preview">
                <el-tag
                  v-for="field in parseChangeFields(row.changeFields).slice(0, 3)"
                  :key="field"
                  size="small"
                  type="info"
                  effect="plain"
                >
                  {{ getFieldLabel(field) }}
                </el-tag>
                <el-tag
                  v-if="parseChangeFields(row.changeFields).length > 3"
                  size="small"
                  type="info"
                >
                  +{{ parseChangeFields(row.changeFields).length - 3 }}
                </el-tag>
              </div>
            </template>
            <template v-else-if="col.prop === 'operationStatus'">
              <el-tag :type="row.operationStatus === 1 ? 'success' : 'danger'" size="small">
                {{ row.operationStatus === 1 ? '成功' : '失败' }}
              </el-tag>
            </template>
            <template v-else>
              <span>{{ col.formatter ? col.formatter(row) : row[col.prop] }}</span>
            </template>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="table-footer">
      <div class="footer-info">
        共 {{ total }} 条记录，双击行查看完整明细
      </div>
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  DataLine, Search, Top, Bottom, Minus, Plus, Edit, Upload, Download,
  RefreshRight, TrendCharts
} from '@element-plus/icons-vue'
import { FlightPriceLogTypeEnum, CabinClassEnum, FlightPriceValidateFieldEnum } from '@/utils/enums'
import { getFlightPriceLogs } from '@/api/flight'

const props = defineProps({
  priceId: { type: [Number, String], default: null }
})

const emit = defineEmits(['update:expanded'])

const tableRef = ref(null)
const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const expandedRow = ref(null)
const expandedRowKeys = ref([])

const columns = ref([
  { prop: 'id', label: 'ID', width: 80 },
  { prop: 'operationType', label: '操作类型', width: 140 },
  { prop: 'flightNo', label: '航班号', width: 120 },
  { prop: 'cabinClass', label: '舱位', width: 100, formatter: (row) => {
    const cabin = Object.values(CabinClassEnum).find(c => c.value === row.cabinClass)
    return cabin ? cabin.label : row.cabinClass
  }},
  { prop: 'beforePrice', label: '调整前价格', width: 120, formatter: (row) => row.beforePrice ? `¥${row.beforePrice.toFixed(2)}` : '-' },
  { prop: 'afterPrice', label: '调整后价格', width: 120, formatter: (row) => row.afterPrice ? `¥${row.afterPrice.toFixed(2)}` : '-' },
  { prop: 'priceChange', label: '价格变动', width: 120 },
  { prop: 'changeFields', label: '变更字段', minWidth: 150 },
  { prop: 'operatorName', label: '操作人', width: 100 },
  { prop: 'operationStatus', label: '状态', width: 80 },
  { prop: 'createdAt', label: '操作时间', width: 170, formatter: (row) => formatDateTime(row.createdAt) }
])

const filterForm = reactive({
  operationType: null,
  dateRange: null
})

const pagination = reactive({
  page: 1,
  pageSize: 20
})

const resizingColumn = ref(null)
const startX = ref(0)
const startWidth = ref(0)

const headerCellStyle = () => ({
  background: '#fafafa',
  color: '#303133',
  fontWeight: 600,
  padding: '12px 16px'
})

const cellStyle = () => ({
  padding: '12px 16px'
})

const loadLogs = async () => {
  if (!props.priceId) return
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    if (filterForm.operationType) {
      params.operationType = filterForm.operationType
    }
    if (filterForm.dateRange && filterForm.dateRange.length === 2) {
      params.startDate = filterForm.dateRange[0]
      params.endDate = filterForm.dateRange[1]
    }
    const res = await getFlightPriceLogs(props.priceId, params)
    tableData.value = res.items || []
    total.value = res.total || 0
  } catch (e) {
    ElMessage.error('加载价格日志失败')
  } finally {
    loading.value = false
  }
}

const resetFilter = () => {
  filterForm.operationType = null
  filterForm.dateRange = null
  pagination.page = 1
  loadLogs()
}

const handleRowDblClick = (row) => {
  if (expandedRow.value === row) {
    expandedRow.value = null
    expandedRowKeys.value = []
  } else {
    expandedRow.value = row
    expandedRowKeys.value = [row.id]
  }
}

const handleExpandChange = (row, expandedRows) => {
  if (expandedRows.length > 0) {
    expandedRow.value = row
    expandedRowKeys.value = [row.id]
  } else {
    expandedRow.value = null
    expandedRowKeys.value = []
  }
}

const startResize = (e, column) => {
  e.preventDefault()
  resizingColumn.value = column
  startX.value = e.clientX
  startWidth.value = column.width || column.minWidth || 120

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

const handleMouseMove = (e) => {
  if (!resizingColumn.value) return
  const diff = e.clientX - startX.value
  const newWidth = Math.max(60, startWidth.value + diff)
  resizingColumn.value.width = newWidth

  const col = columns.value.find(c => c.prop === resizingColumn.value.property)
  if (col) {
    col.width = newWidth
  }
}

const handleMouseUp = () => {
  resizingColumn.value = null
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)
}

const getLogTypeLabel = (type) => {
  const item = Object.values(FlightPriceLogTypeEnum).find(i => i.value === type)
  return item ? item.label : '未知操作'
}

const getLogTypeColor = (type) => {
  const item = Object.values(FlightPriceLogTypeEnum).find(i => i.value === type)
  return item ? item.color : '#909399'
}

const getLogTypeIcon = (type) => {
  const iconMap = {
    1: Plus,
    2: Edit,
    3: DataLine,
    4: TrendCharts,
    5: RefreshRight,
    6: Download,
    7: Upload
  }
  return iconMap[type] || 'Document'
}

const getPriceChangeClass = (row) => {
  if (!row.priceChangeAmount) return 'flat'
  return row.priceChangeAmount > 0 ? 'up' : 'down'
}

const parseChangeFields = (fields) => {
  if (!fields) return []
  try {
    return typeof fields === 'string' ? JSON.parse(fields) : fields
  } catch (e) {
    return []
  }
}

const getFieldLabel = (field) => {
  return FlightPriceValidateFieldEnum[field] || field
}

const formatDateTime = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const handleSizeChange = (size) => {
  pagination.pageSize = size
  pagination.page = 1
  loadLogs()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  loadLogs()
}

watch(() => props.priceId, (val) => {
  if (val) {
    pagination.page = 1
    loadLogs()
  }
})

onMounted(() => {
  if (props.priceId) {
    loadLogs()
  }
})
</script>

<style lang="scss" scoped>
.flight-price-log-panel {
  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .header-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      font-weight: 600;
    }

    .header-filters {
      display: flex;
      gap: 12px;
      align-items: center;
    }
  }

  .table-container {
    border: 1px solid #ebeef5;
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 16px;
  }

  .price-log-table {
    :deep(.el-table__header-wrapper) {
      position: sticky;
      top: 0;
      z-index: 10;
    }

    :deep(.el-table__row) {
      transition: all 0.3s ease;
      cursor: pointer;

      &:hover {
        background: #f5f7fa;
      }

      &.expanded {
        background: #f0f7ff;
      }
    }

    .header-cell {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: space-between;

      .resize-handle {
        position: absolute;
        right: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 6px;
        height: 100%;
        cursor: col-resize;
        z-index: 10;
        transition: background 0.2s ease;

        &:hover {
          background: #1890ff;
        }
      }
    }

    .operation-type-cell {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 500;
    }

    .price-change-cell {
      display: flex;
      align-items: center;
      gap: 4px;
      font-weight: 600;

      &.up {
        color: #faad14;
      }
      &.down {
        color: #52c41a;
      }
      &.flat {
        color: #909399;
      }
    }

    .fields-preview {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
    }

    :deep(.el-table__expand-icon) {
      transition: transform 0.3s ease;
    }
  }

  .expand-detail {
    padding: 16px;
    background: #fafafa;
    animation: expandIn 0.3s ease;

    .old-price {
      color: #909399;
      text-decoration: line-through;
    }

    .new-price {
      color: #1890ff;
      font-weight: 600;
      font-size: 16px;
    }

    .price-up {
      color: #faad14;
      font-weight: 600;
    }

    .price-down {
      color: #52c41a;
      font-weight: 600;
    }

    .change-fields {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }

    .fail-reason {
      margin-left: 8px;
      color: #ff4d4f;
      font-size: 12px;
    }
  }

  .table-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .footer-info {
      color: #909399;
      font-size: 13px;
    }
  }

  @keyframes expandIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
}
</style>
