<template>
  <div class="logistics-link-monitor">
    <el-card class="filter-card">
      <el-form :inline="true" :model="queryForm" @submit.prevent="handleQuery">
        <el-form-item label="配送状态">
          <el-select v-model="queryForm.track_status" placeholder="请选择" clearable>
            <el-option
              v-for="(item, key) in TrackStatusMap"
              :key="key"
              :label="item.label"
              :value="Number(key)"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="物流服务商">
          <el-select v-model="queryForm.provider_id" placeholder="请选择" clearable filterable>
            <el-option
              v-for="provider in providerList"
              :key="provider.id"
              :label="provider.company_name"
              :value="provider.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="签收时段">
          <el-date-picker
            v-model="queryForm.sign_time_range"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            clearable
          />
        </el-form-item>
        <el-form-item label="物流单号">
          <el-input v-model="queryForm.logistics_no" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item label="订单号">
          <el-input v-model="queryForm.order_no" placeholder="请输入" clearable />
        </el-form-item>
        <el-form-item label="异常状态">
          <el-select v-model="queryForm.is_abnormal" placeholder="请选择" clearable>
            <el-option label="正常" :value="0" />
            <el-option label="异常" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery" :loading="loading">
            <el-icon><Search /></el-icon> 查询
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon> 重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <div class="table-header">
        <div class="header-left">
          <span class="total-count">共 {{ pagination.total }} 条记录</span>
          <span v-if="selection.length > 0" class="selection-count">
            已选 {{ selection.length }} 条
          </span>
        </div>
        <div class="header-right">
          <el-button
            v-if="permissions.can_mark_abnormal"
            type="warning"
            :disabled="selection.length === 0"
            @click="openBatchDialog('mark_abnormal')"
          >
            <el-icon><Warning /></el-icon> 批量标记异常
          </el-button>
          <el-button
            v-if="permissions.can_launch_verify"
            type="primary"
            :disabled="selection.length === 0"
            @click="openBatchDialog('launch_verify')"
          >
            <el-icon><Search /></el-icon> 批量发起核查
          </el-button>
          <el-button
            v-if="permissions.can_sync_status"
            type="success"
            :disabled="selection.length === 0"
            @click="handleBatchSyncStatus"
          >
            <el-icon><RefreshRight /></el-icon> 批量同步状态
          </el-button>
        </div>
      </div>

      <el-table
        ref="tableRef"
        :data="tableData"
        v-loading="loading"
        @selection-change="handleSelectionChange"
        @column-resize="handleColumnResize"
        border
        stripe
        highlight-current-row
        class="logistics-table"
      >
        <el-table-column type="selection" width="50" fixed="left" :resizable="false" />
        <el-table-column prop="id" label="ID" width="70" min-width="70" />
        <el-table-column prop="shipment_no" label="发货单号" width="140" min-width="140" show-overflow-tooltip />
        <el-table-column prop="logistics_no" label="物流单号" width="140" min-width="140" show-overflow-tooltip />
        <el-table-column prop="provider_info.company_name" label="物流服务商" width="140" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">
            <span>{{ row.provider_info?.company_name || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="配送状态" width="100" min-width="100">
          <template #default="{ row }">
            <el-tag
              v-if="row.latest_track"
              :type="TrackStatusMap[row.latest_track.track_status]?.type || 'info'"
              effect="light"
            >
              {{ TrackStatusMap[row.latest_track.track_status]?.label || '未知' }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="最新轨迹" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="track-content">
              <span v-if="row.latest_track">{{ row.latest_track.track_content }}</span>
              <span v-else class="text-gray">暂无轨迹</span>
            </div>
            <div class="track-time" v-if="row.latest_track">
              {{ formatDate(row.latest_track.track_time) }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="收货信息" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="receiver-info">
              <div class="receiver-name">
                <el-icon><User /></el-icon>
                {{ row.order_info?.receiver_name || '-' }}
                <span class="receiver-phone">{{ row.order_info?.receiver_phone || '' }}</span>
              </div>
              <div class="receiver-address text-gray">
                {{ row.order_info?.receiver_address || '-' }}
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="异常/工单" width="120" min-width="120">
          <template #default="{ row }">
            <div class="status-badges">
              <el-badge
                v-if="row.is_abnormal === 1"
                :value="row.abnormal_count || 0"
                class="abnormal-badge"
                type="danger"
              >
                <el-tag type="danger" size="small" effect="light">异常</el-tag>
              </el-badge>
              <el-badge
                v-if="row.work_order_count > 0"
                :value="row.work_order_count"
                class="work-order-badge"
                type="warning"
              >
                <el-tag type="warning" size="small" effect="light">工单</el-tag>
              </el-badge>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="160" min-width="160">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" min-width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleMatch(row)">
              链路匹配
            </el-button>
            <el-button type="warning" link @click="handleDetect(row)">
              异常检测
            </el-button>
            <el-button type="primary" link @click="handleTrace(row)">
              链路溯源
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.page_size"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <LinkMatchDialog
      v-model:visible="matchDialogVisible"
      :order-id="currentOrderId"
      @success="handleMatchSuccess"
    />

    <AbnormalHandleDialog
      v-model:visible="abnormalDialogVisible"
      :shipment-id="currentShipmentId"
      @success="handleAbnormalSuccess"
    />

    <BatchOperationDialog
      v-model:visible="batchDialogVisible"
      :operation-type="batchOperationType"
      :selected-ids="selectedIds"
      @success="handleBatchSuccess"
    />

    <LinkTraceDialog
      v-model:visible="traceDialogVisible"
      :shipment-id="currentShipmentId"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Warning, RefreshRight, User } from '@element-plus/icons-vue'
import type { ElTable } from 'element-plus'
import {
  queryShipments,
  getRefreshData,
  batchSyncStatus,
  getUserPermissions,
  TrackStatusMap,
  BatchOperationType,
  type ShipmentListItem,
  type BatchOperationPermission,
} from '@/api/logisticsLinkBatch'
import { runAbnormalDetection } from '@/api/logisticsAbnormalMonitor'
import { getProviderList } from '@/api/logisticsProvider'
import LinkMatchDialog from './components/LinkMatchDialog.vue'
import AbnormalHandleDialog from './components/AbnormalHandleDialog.vue'
import BatchOperationDialog from './components/BatchOperationDialog.vue'
import LinkTraceDialog from './components/LinkTraceDialog.vue'
import { formatDate } from '@/utils/date'

const tableRef = ref<InstanceType<typeof ElTable>>()
const loading = ref(false)
const tableData = ref<ShipmentListItem[]>([])
const selection = ref<ShipmentListItem[]>([])
const providerList = ref<any[]>([])
const permissions = ref<BatchOperationPermission>({
  can_mark_abnormal: false,
  can_launch_verify: false,
  can_sync_status: false,
  can_update_track: false,
  can_resend_notification: false,
})

const queryForm = reactive({
  track_status: undefined as number | undefined,
  provider_id: undefined as number | undefined,
  sign_time_range: undefined as string[] | undefined,
  logistics_no: '',
  order_no: '',
  is_abnormal: undefined as number | undefined,
})

const pagination = reactive({
  page: 1,
  page_size: 20,
  total: 0,
})

const matchDialogVisible = ref(false)
const abnormalDialogVisible = ref(false)
const batchDialogVisible = ref(false)
const traceDialogVisible = ref(false)

const currentShipmentId = ref<number>(0)
const currentOrderId = ref<number>(0)
const batchOperationType = ref<string>('')

const selectedIds = computed(() => selection.value.map(item => item.id))

const loadData = async () => {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      page_size: pagination.page_size,
      track_status: queryForm.track_status,
      provider_id: queryForm.provider_id,
      logistics_no: queryForm.logistics_no,
      order_no: queryForm.order_no,
      is_abnormal: queryForm.is_abnormal,
    }

    if (queryForm.sign_time_range && queryForm.sign_time_range.length === 2) {
      params.sign_start_time = queryForm.sign_time_range[0]
      params.sign_end_time = queryForm.sign_time_range[1]
    }

    const res = await queryShipments(params)
    if (res.code === 200) {
      tableData.value = res.data.list
      pagination.total = res.data.total
    }
  } catch (error: any) {
    ElMessage.error(error.message || '加载数据失败')
  } finally {
    loading.value = false
  }
}

const loadPermissions = async () => {
  try {
    const res = await getUserPermissions()
    if (res.code === 200) {
      permissions.value = res.data
    }
  } catch (error: any) {
    console.error('获取权限失败:', error)
  }
}

const loadProviderList = async () => {
  try {
    const res = await getProviderList({ page: 1, page_size: 100, status: 1 })
    if (res.code === 200) {
      providerList.value = res.data.list
    }
  } catch (error: any) {
    console.error('加载服务商列表失败:', error)
  }
}

const handleQuery = () => {
  pagination.page = 1
  loadData()
}

const handleReset = () => {
  queryForm.track_status = undefined
  queryForm.provider_id = undefined
  queryForm.sign_time_range = undefined
  queryForm.logistics_no = ''
  queryForm.order_no = ''
  queryForm.is_abnormal = undefined
  pagination.page = 1
  loadData()
}

const handleSelectionChange = (val: ShipmentListItem[]) => {
  selection.value = val
}

const handleSizeChange = (size: number) => {
  pagination.page_size = size
  pagination.page = 1
  loadData()
}

const handlePageChange = (page: number) => {
  pagination.page = page
  loadData()
}

const handleColumnResize = (column: any) => {
  console.log('列宽调整:', column.label, column.width)
}

const handleMatch = (row: ShipmentListItem) => {
  currentOrderId.value = row.order_id
  currentShipmentId.value = row.id
  matchDialogVisible.value = true
}

const handleDetect = async (row: ShipmentListItem) => {
  if (!row.latest_track) {
    ElMessage.warning('暂无轨迹记录，无法进行异常检测')
    return
  }

  try {
    const res = await runAbnormalDetection(row.id, row.latest_track.id)
    if (res.code === 200) {
      if (res.data.abnormal_detected) {
        ElMessage.warning('检测到异常，已自动创建工单')
        currentShipmentId.value = row.id
        abnormalDialogVisible.value = true
      } else {
        ElMessage.success('未检测到异常')
      }
      refreshRow(row.id)
    }
  } catch (error: any) {
    ElMessage.error(error.message || '异常检测失败')
  }
}

const handleTrace = (row: ShipmentListItem) => {
  currentShipmentId.value = row.id
  traceDialogVisible.value = true
}

const openBatchDialog = (type: string) => {
  batchOperationType.value = type
  batchDialogVisible.value = true
}

const handleBatchSyncStatus = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要同步选中的 ${selection.value.length} 条记录的物流状态吗？`,
      '确认操作',
      { type: 'warning' }
    )

    const res = await batchSyncStatus(selectedIds.value)
    if (res.code === 200) {
      ElMessage.success(`批量同步完成：成功${res.data.success}条，失败${res.data.failed}条`)
      refreshRows(selectedIds.value)
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '批量同步失败')
    }
  }
}

const refreshRow = async (id: number) => {
  try {
    const res = await getRefreshData([id])
    if (res.code === 200 && res.data.length > 0) {
      const index = tableData.value.findIndex(item => item.id === id)
      if (index !== -1) {
        tableData.value[index] = res.data[0]
      }
    }
  } catch (error: any) {
    console.error('刷新行数据失败:', error)
  }
}

const refreshRows = async (ids: number[]) => {
  try {
    const res = await getRefreshData(ids)
    if (res.code === 200) {
      for (const item of res.data) {
        const index = tableData.value.findIndex(row => row.id === item.id)
        if (index !== -1) {
          tableData.value[index] = item
        }
      }
    }
  } catch (error: any) {
    console.error('刷新行数据失败:', error)
  }
}

const handleMatchSuccess = () => {
  ElMessage.success('链路匹配完成')
  loadData()
}

const handleAbnormalSuccess = () => {
  ElMessage.success('异常处理完成')
  refreshRow(currentShipmentId.value)
}

const handleBatchSuccess = () => {
  ElMessage.success('批量操作完成')
  selection.value = []
  loadData()
}

onMounted(() => {
  loadPermissions()
  loadProviderList()
  loadData()
})
</script>

<style scoped lang="scss">
.logistics-link-monitor {
  padding: 20px;

  .filter-card {
    margin-bottom: 20px;

    :deep(.el-form-item) {
      margin-bottom: 16px;
    }
  }

  .table-card {
    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;

      .header-left {
        display: flex;
        align-items: center;
        gap: 16px;

        .total-count {
          font-size: 14px;
          color: #606266;
        }

        .selection-count {
          font-size: 14px;
          color: #409eff;
        }
      }

      .header-right {
        display: flex;
        gap: 12px;
      }
    }

    .logistics-table {
      :deep(.el-table__header-wrapper th) {
        background-color: #f5f7fa;
        font-weight: 600;
      }

      .track-content {
        font-size: 14px;
        color: #303133;
        margin-bottom: 4px;
      }

      .track-time {
        font-size: 12px;
        color: #909399;
      }

      .receiver-info {
        .receiver-name {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 14px;
          color: #303133;
          margin-bottom: 4px;

          .receiver-phone {
            color: #606266;
            font-size: 13px;
          }
        }

        .receiver-address {
          font-size: 12px;
        }
      }

      .status-badges {
        display: flex;
        gap: 8px;
        align-items: center;
      }

      .text-gray {
        color: #909399;
      }
    }

    .pagination-wrapper {
      display: flex;
      justify-content: flex-end;
      margin-top: 20px;
    }
  }
}
</style>
