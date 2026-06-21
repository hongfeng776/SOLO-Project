<template>
  <div class="passenger-travel-records">
    <div class="records-header">
      <h3>
        <el-icon><Van /></el-icon>
        乘客出行记录
      </h3>
      <el-button type="primary" :loading="loading" @click="refreshData">
        <el-icon><Refresh /></el-icon>
        刷新
      </el-button>
    </div>

    <el-alert
      v-if="!permissionLoading && !travelPermission?.canViewFull"
      :title="travelPermission?.message || '当前账号无查看完整出行轨迹权限，敏感信息已脱敏显示'"
      type="warning"
      show-icon
      :closable="false"
      class="permission-alert"
    >
      <template #default>
        <div class="permission-info">
          <span>当前角色：</span>
          <el-tag size="small" type="warning">{{ travelPermission?.currentRole }}</el-tag>
          <span class="allowed-roles">允许角色：{{ travelPermission?.allowedRoleNames?.join('、') }}</span>
        </div>
      </template>
    </el-alert>

    <div class="filter-section">
      <div class="filter-row">
        <div class="filter-item">
          <span class="filter-label">出行时间：</span>
          <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            class="filter-date glow-input"
          />
        </div>
        <div class="filter-item">
          <span class="filter-label">出行城市：</span>
          <el-select
            v-model="filters.travelCity"
            placeholder="请选择城市"
            clearable
            class="filter-select glow-input"
          >
            <el-option
              v-for="city in CITY_OPTIONS"
              :key="city"
              :label="city"
              :value="city"
            />
          </el-select>
        </div>
        <div class="filter-item">
          <span class="filter-label">车型：</span>
          <el-select
            v-model="filters.capacityType"
            placeholder="请选择车型"
            clearable
            class="filter-select glow-input"
          >
            <el-option
              v-for="(label, value) in CapacityTypeMap"
              :key="value"
              :label="label"
              :value="Number(value)"
            />
          </el-select>
        </div>
      </div>
      <div class="filter-row">
        <div class="filter-item">
          <span class="filter-label">消费金额：</span>
          <el-input
            v-model.number="filters.minAmount"
            type="number"
            placeholder="最小金额"
            class="filter-input glow-input"
            min="0"
          />
          <span class="amount-separator">~</span>
          <el-input
            v-model.number="filters.maxAmount"
            type="number"
            placeholder="最大金额"
            class="filter-input glow-input"
            min="0"
          />
        </div>
        <div class="filter-item">
          <span class="filter-label">订单状态：</span>
          <el-select
            v-model="filters.status"
            placeholder="请选择状态"
            clearable
            class="filter-select glow-input"
          >
            <el-option
              v-for="(label, value) in OrderStatusMap"
              :key="value"
              :label="label"
              :value="Number(value)"
            />
          </el-select>
        </div>
        <div class="filter-actions">
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
          <el-button @click="handleReset">
            <el-icon><RefreshLeft /></el-icon>
            重置
          </el-button>
        </div>
      </div>
    </div>

    <el-alert
      v-if="conflictErrors.length > 0"
      :title="conflictErrors.join('；')"
      type="error"
      show-icon
      :closable="false"
      class="conflict-alert"
    />

    <div class="stats-section">
      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-icon primary">
            <el-icon><Document /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ statistics.totalOrders }}</div>
            <div class="stat-label">订单总数</div>
          </div>
        </div>
      </el-card>
      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-icon success">
            <el-icon><Money /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">¥{{ statistics.totalAmount.toFixed(2) }}</div>
            <div class="stat-label">总消费金额</div>
          </div>
        </div>
      </el-card>
      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-icon danger">
            <el-icon><CircleClose /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ statistics.cancelCount }}</div>
            <div class="stat-label">取消订单数</div>
          </div>
        </div>
      </el-card>
      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-icon info">
            <el-icon><CircleCheck /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ statistics.completedCount }}</div>
            <div class="stat-label">完成订单数</div>
          </div>
        </div>
      </el-card>
    </div>

    <div v-loading="tableLoading" class="table-container">
      <el-table
        :data="travelRecords"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column prop="orderNo" label="订单号" width="180">
          <template #default="{ row }">
            <span class="order-no">{{ row.orderNo || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="下单时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="startAddress" label="起点" min-width="180">
          <template #default="{ row }">
            <span :class="{ 'desensitized': !travelPermission?.canViewFull }">
              {{ maskAddress(row.startAddress) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="endAddress" label="终点" min-width="180">
          <template #default="{ row }">
            <span :class="{ 'desensitized': !travelPermission?.canViewFull }">
              {{ maskAddress(row.endAddress) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="capacityType" label="车型" width="100">
          <template #default="{ row }">
            <el-tag
              :color="CapacityTypeColorMap[row.capacityType]"
              effect="dark"
              size="small"
            >
              {{ CapacityTypeMap[row.capacityType] || '-' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="金额(元)" width="110" align="right">
          <template #default="{ row }">
            <span class="amount-text">¥{{ (row.amount || 0).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="订单状态" width="100">
          <template #default="{ row }">
            <el-tag
              :color="OrderStatusColorMap[row.status]"
              effect="dark"
              size="small"
            >
              {{ OrderStatusMap[row.status] || '-' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleViewOrder(row.id)">
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Van,
  Refresh,
  Search,
  RefreshLeft,
  Document,
  Money,
  CircleClose,
  CircleCheck
} from '@element-plus/icons-vue'
import { getTravelRecordsApi, checkTravelPermissionApi } from '@/api/passenger'
import { CapacityTypeMap, CapacityTypeColorMap, CITY_OPTIONS } from '@/enums/capacity'
import { OrderStatusMap, OrderStatusColorMap, OrderStatus } from '@/enums/order'
import { formatDate } from '@/utils/format'
import type { TravelRecordQueryParams, TravelPermissionResult } from '@/types/passenger'

interface Props {
  passengerId: number
  passengerInfo?: any
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'view-order': [orderId: number]
}>()

const loading = ref(false)
const tableLoading = ref(false)
const permissionLoading = ref(true)
const travelPermission = ref<TravelPermissionResult | null>(null)
const travelRecords = ref<any[]>([])

const filters = reactive({
  dateRange: [] as string[],
  travelCity: '' as string,
  capacityType: null as number | null,
  minAmount: null as number | null,
  maxAmount: null as number | null,
  status: null as number | null
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const statistics = reactive({
  totalOrders: 0,
  totalAmount: 0,
  cancelCount: 0,
  completedCount: 0
})

const conflictErrors = computed<string[]>(() => {
  const errors: string[] = []
  if (filters.dateRange && filters.dateRange.length === 2) {
    const startTime = new Date(filters.dateRange[0]).getTime()
    const endTime = new Date(filters.dateRange[1]).getTime()
    if (startTime > endTime) {
      errors.push('开始时间不能晚于结束时间')
    }
  }
  if (filters.minAmount !== null && filters.minAmount !== undefined && filters.maxAmount !== null && filters.maxAmount !== undefined) {
    if (filters.minAmount > filters.maxAmount) {
      errors.push('最小金额不能大于最大金额')
    }
  }
  return errors
})

const maskAddress = (address: string | null | undefined): string => {
  if (!address) return '-'
  if (travelPermission.value?.canViewFull) return address
  if (address.length <= 6) return address.charAt(0) + '****'
  return address.substring(0, 3) + '****' + address.substring(address.length - 3)
}

const checkTravelPermission = async () => {
  permissionLoading.value = true
  try {
    const res = await checkTravelPermissionApi()
    travelPermission.value = res.data
  } catch (error: any) {
    ElMessage.error(error.message || '权限校验失败')
    travelPermission.value = {
      canViewFull: false,
      currentRole: '未知',
      allowedRoles: [],
      allowedRoleNames: [],
      message: '权限校验失败，敏感信息已脱敏显示'
    }
  } finally {
    permissionLoading.value = false
  }
}

const buildQueryParams = (): TravelRecordQueryParams => {
  const params: TravelRecordQueryParams = {
    page: pagination.page,
    pageSize: pagination.pageSize
  }
  if (filters.dateRange && filters.dateRange.length === 2) {
    params.startTime = filters.dateRange[0]
    params.endTime = filters.dateRange[1]
  }
  if (filters.travelCity) {
    params.travelCity = filters.travelCity
  }
  if (filters.capacityType !== null && filters.capacityType !== undefined) {
    params.capacityType = filters.capacityType
  }
  if (filters.minAmount !== null && filters.minAmount !== undefined) {
    params.minAmount = filters.minAmount
  }
  if (filters.maxAmount !== null && filters.maxAmount !== undefined) {
    params.maxAmount = filters.maxAmount
  }
  if (filters.status !== null && filters.status !== undefined) {
    params.status = filters.status
  }
  return params
}

const loadTravelRecords = async () => {
  if (conflictErrors.value.length > 0) {
    return
  }
  tableLoading.value = true
  try {
    const params = buildQueryParams()
    const res = await getTravelRecordsApi(props.passengerId, params)
    const list = res.data?.list || res.data?.records || res.data || []
    travelRecords.value = Array.isArray(list) ? list : []
    pagination.total = res.data?.total || 0
    updateStatistics(travelRecords.value, res.data)
  } catch (error: any) {
    ElMessage.error(error.message || '加载出行记录失败')
    travelRecords.value = []
  } finally {
    tableLoading.value = false
  }
}

const updateStatistics = (records: any[], rawData?: any) => {
  if (rawData?.statistics) {
    statistics.totalOrders = rawData.statistics.totalOrders || 0
    statistics.totalAmount = rawData.statistics.totalAmount || 0
    statistics.cancelCount = rawData.statistics.cancelCount || 0
    statistics.completedCount = rawData.statistics.completedCount || 0
    return
  }
  statistics.totalOrders = records.length
  statistics.totalAmount = records.reduce((sum, r) => sum + (r.amount || 0), 0)
  statistics.cancelCount = records.filter(r => r.status === OrderStatus.CANCELLED).length
  statistics.completedCount = records.filter(r => r.status === OrderStatus.COMPLETED).length
}

const handleSearch = () => {
  if (conflictErrors.value.length > 0) {
    return
  }
  pagination.page = 1
  loadTravelRecords()
}

const handleReset = () => {
  filters.dateRange = []
  filters.travelCity = ''
  filters.capacityType = null
  filters.minAmount = null
  filters.maxAmount = null
  filters.status = null
  pagination.page = 1
  loadTravelRecords()
}

const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
  loadTravelRecords()
}

const handleCurrentChange = (page: number) => {
  pagination.page = page
  loadTravelRecords()
}

const handleViewOrder = (orderId: number) => {
  emit('view-order', orderId)
}

const refreshData = () => {
  loading.value = true
  Promise.all([checkTravelPermission(), loadTravelRecords()])
    .finally(() => {
      loading.value = false
    })
}

watch(() => props.passengerId, () => {
  pagination.page = 1
  loadTravelRecords()
}, { immediate: false })

onMounted(() => {
  checkTravelPermission()
  loadTravelRecords()
})
</script>

<style lang="scss" scoped>
.passenger-travel-records {
  .records-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h3 {
      margin: 0;
      font-size: 16px;
      color: #303133;
      display: flex;
      align-items: center;
      gap: 8px;

      .el-icon {
        color: #409eff;
      }
    }
  }

  .permission-alert {
    margin-bottom: 16px;

    .permission-info {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 8px;
      font-size: 13px;
      color: #606266;

      .allowed-roles {
        color: #909399;
      }
    }
  }

  .filter-section {
    padding: 16px;
    background: #f5f7fa;
    border-radius: 8px;
    margin-bottom: 16px;

    .filter-row {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 12px;

      &:last-child {
        margin-bottom: 0;
      }
    }

    .filter-item {
      display: flex;
      align-items: center;
      gap: 8px;

      .filter-label {
        font-size: 13px;
        color: #606266;
        white-space: nowrap;
      }

      .filter-date {
        width: 260px;
      }

      .filter-select {
        width: 140px;
      }

      .filter-input {
        width: 120px;
      }

      .amount-separator {
        color: #909399;
      }
    }

    .filter-actions {
      display: flex;
      gap: 8px;
      margin-left: auto;
    }
  }

  :deep(.glow-input) {
    .el-input__wrapper,
    .el-select__wrapper,
    .el-date-editor.el-input__wrapper {
      transition: all 0.3s ease;
    }

    &.is-focus .el-input__wrapper,
    .el-input__wrapper.is-focus,
    &.is-focus .el-select__wrapper,
    .el-select__wrapper.is-focused,
    &.is-focus .el-date-editor.el-input__wrapper,
    .el-date-editor.is-focus .el-input__wrapper {
      box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2), 0 0 12px rgba(64, 158, 255, 0.3);
      border-color: #409eff;
    }

    .el-input__wrapper:hover,
    .el-select__wrapper:hover,
    .el-date-editor.el-input__wrapper:hover {
      box-shadow: 0 0 0 1px rgba(64, 158, 255, 0.15);
    }
  }

  .conflict-alert {
    margin-bottom: 16px;
  }

  .stats-section {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 20px;

    .stat-card {
      :deep(.el-card__body) {
        padding: 16px;
      }

      .stat-content {
        display: flex;
        align-items: center;
        gap: 12px;

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          color: #fff;
          flex-shrink: 0;

          &.primary {
            background: linear-gradient(135deg, #409eff, #3498db);
          }

          &.success {
            background: linear-gradient(135deg, #67c23a, #27ae60);
          }

          &.danger {
            background: linear-gradient(135deg, #f56c6c, #e74c3c);
          }

          &.info {
            background: linear-gradient(135deg, #909399, #606266);
          }
        }

        .stat-info {
          flex: 1;
          min-width: 0;

          .stat-value {
            font-size: 22px;
            font-weight: 700;
            color: #303133;
            line-height: 1.2;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .stat-label {
            font-size: 12px;
            color: #909399;
            margin-top: 4px;
          }
        }
      }
    }
  }

  .table-container {
    background: #fff;
    border-radius: 8px;
    padding: 16px;

    .order-no {
      font-family: 'Courier New', monospace;
      color: #606266;
    }

    .amount-text {
      font-weight: 500;
      color: #f56c6c;
    }

    .desensitized {
      color: #909399;
      font-family: 'Courier New', monospace;
    }
  }

  .pagination-container {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }
}
</style>
