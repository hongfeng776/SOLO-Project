<template>
  <div class="page-container">
    <el-card shadow="never" class="mb-20">
      <el-form :model="queryParams" label-width="80px" inline @submit.prevent>
        <el-form-item label="订单号">
          <el-input
            v-model="queryParams.orderNo"
            placeholder="请输入订单号"
            clearable
            style="width: 220px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="订单类型">
          <el-select
            v-model="queryParams.type"
            placeholder="全部类型"
            clearable
            style="width: 140px"
          >
            <el-option v-for="(label, value) in orderTypeOptions" :key="value" :label="label" :value="value" />
          </el-select>
        </el-form-item>
        <el-form-item label="订单状态">
          <el-select
            v-model="queryParams.status"
            placeholder="全部状态"
            clearable
            style="width: 140px"
          >
            <el-option v-for="(label, value) in orderStatusOptions" :key="value" :label="label" :value="Number(value)" />
          </el-select>
        </el-form-item>
        <el-form-item label="达人">
          <el-input
            v-model="queryParams.creatorName"
            placeholder="达人名称"
            clearable
            style="width: 180px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">订单管理</span>
          <div class="header-actions">
            <el-button :icon="Download" plain>导出</el-button>
          </div>
        </div>
      </template>

      <HtTable
        :data="dataList"
        :loading="loading"
        :total="total"
        v-model:page="queryParams.page"
        v-model:page-size="queryParams.pageSize"
        show-index
        row-key="id"
        @paginate="handlePaginate"
      >
        <el-table-column prop="orderNo" label="订单号" width="180" />
        <el-table-column label="订单类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="orderTypeColor[row.type] || 'info'" size="small" effect="light">
              {{ orderTypeOptions[row.type] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="活动信息" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="activity-info">
              <div class="activity-name">{{ row.activityName }}</div>
              <div class="activity-id">活动ID：{{ row.activityId }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="达人" width="140">
          <template #default="{ row }">
            <div class="creator-cell">
              <span class="name">{{ row.creatorName }}</span>
              <span class="id">ID：{{ row.creatorId }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="金额" width="120" align="right">
          <template #default="{ row }">
            <span class="amount">{{ formatMoney(row.amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="orderStatusColor[row.status] || 'info'" size="small">
              {{ orderStatusOptions[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openDetail(row)">详情</el-button>
            <el-dropdown trigger="click" @command="handleStatusCommand(row, $event)">
              <el-button link type="warning" size="small">
                状态变更
                <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    v-if="row.status === 0"
                    :command="{ status: 1 }"
                  >
                    标记进行中
                  </el-dropdown-item>
                  <el-dropdown-item
                    v-if="row.status === 1"
                    :command="{ status: 2 }"
                  >
                    标记完成
                  </el-dropdown-item>
                  <el-dropdown-item
                    v-if="row.status <= 1"
                    :command="{ status: 3, needRemark: true }"
                  >
                    取消订单
                  </el-dropdown-item>
                  <el-dropdown-item
                    v-if="row.status === 2"
                    :command="{ status: 4, needRemark: true }"
                  >
                    申请退款
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </HtTable>
    </el-card>

    <el-dialog v-model="detailVisible" title="订单详情" width="640px" destroy-on-close>
      <el-descriptions v-if="currentOrder" :column="2" border>
        <el-descriptions-item label="订单号" :span="2">{{ currentOrder.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="订单类型">
          {{ orderTypeOptions[currentOrder.type] }}
        </el-descriptions-item>
        <el-descriptions-item label="订单状态">
          <el-tag :type="orderStatusColor[currentOrder.status]">
            {{ orderStatusOptions[currentOrder.status] }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="活动名称" :span="2">
          {{ currentOrder.activityName }}（ID：{{ currentOrder.activityId }}）
        </el-descriptions-item>
        <el-descriptions-item label="达人">
          {{ currentOrder.creatorName }}（ID：{{ currentOrder.creatorId }}）
        </el-descriptions-item>
        <el-descriptions-item label="订单金额">
          <span class="amount-large">{{ formatMoney(currentOrder.amount) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">
          {{ formatDateTime(currentOrder.createTime) }}
        </el-descriptions-item>
        <el-descriptions-item v-if="currentOrder.paymentTime" label="支付时间" :span="2">
          {{ formatDateTime(currentOrder.paymentTime) }}
        </el-descriptions-item>
        <el-descriptions-item v-if="currentOrder.completeTime" label="完成时间" :span="2">
          {{ formatDateTime(currentOrder.completeTime) }}
        </el-descriptions-item>
        <el-descriptions-item v-if="currentOrder.cancelTime" label="取消时间" :span="2">
          {{ formatDateTime(currentOrder.cancelTime) }}
        </el-descriptions-item>
        <el-descriptions-item v-if="currentOrder.refundTime" label="退款时间" :span="2">
          {{ formatDateTime(currentOrder.refundTime) }}
        </el-descriptions-item>
        <el-descriptions-item v-if="currentOrder.remark" label="备注" :span="2">
          {{ currentOrder.remark }}
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <el-dialog v-model="remarkVisible" title="请输入备注" width="420px" destroy-on-close>
      <el-input
        v-model="remarkForm.remark"
        type="textarea"
        :rows="4"
        placeholder="请输入备注原因"
        maxlength="200"
        show-word-limit
      />
      <template #footer>
        <el-button @click="remarkVisible = false">取消</el-button>
        <el-button type="primary" @click="submitStatusWithRemark">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh, Download, ArrowDown } from '@element-plus/icons-vue'
import { useFetchList, formatDateTime } from '@hooks/index'
import { useNumberFormat } from '@hooks/useFormat'
import { getOrderList, updateOrderStatus } from '@api/activity'
import { OrderType, OrderStatus } from '@enums/business'
import type { Order } from '@/types/business'
import HtTable from '@components/HtTable/index.vue'

const { formatMoney } = useNumberFormat()

const orderTypeOptions: Record<string, string> = {
  [OrderType.PROMOTION]: '推广单',
  [OrderType.DELIVERY]: '带货单',
  [OrderType.CUSTOM]: '定制单'
}

const orderTypeColor: Record<string, string> = {
  [OrderType.PROMOTION]: 'primary',
  [OrderType.DELIVERY]: 'success',
  [OrderType.CUSTOM]: 'warning'
}

const orderStatusOptions: Record<number, string> = {
  [OrderStatus.PENDING_PAYMENT]: '待支付',
  [OrderStatus.IN_PROGRESS]: '进行中',
  [OrderStatus.COMPLETED]: '已完成',
  [OrderStatus.CANCELLED]: '已取消',
  [OrderStatus.REFUNDED]: '已退款'
}

const orderStatusColor: Record<number, string> = {
  [OrderStatus.PENDING_PAYMENT]: 'warning',
  [OrderStatus.IN_PROGRESS]: 'primary',
  [OrderStatus.COMPLETED]: 'success',
  [OrderStatus.CANCELLED]: 'info',
  [OrderStatus.REFUNDED]: 'danger'
}

const {
  loading,
  dataList,
  total,
  queryParams,
  fetchData,
  handleSearch,
  handleReset,
  handlePaginate
} = useFetchList<Order, { orderNo?: string; type?: string; status?: number; creatorName?: string }>({
  fetchApi: getOrderList,
  defaultParams: { orderNo: '', type: '', status: undefined, creatorName: '' }
})

const detailVisible = ref(false)
const currentOrder = ref<Order | null>(null)

const remarkVisible = ref(false)
const pendingStatusCmd = ref<{ status: number } | null>(null)
const remarkForm = reactive<{ id: number | null; remark: string; status: number }>({
  id: null,
  remark: '',
  status: 0
})

const openDetail = (row: Order) => {
  currentOrder.value = row
  detailVisible.value = true
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handleStatusCommand = async (row: Order, cmd: any) => {
  const command = cmd as { status: number; needRemark?: boolean }
  if (command.needRemark) {
    pendingStatusCmd.value = command
    remarkForm.id = row.id
    remarkForm.status = command.status
    remarkForm.remark = ''
    remarkVisible.value = true
  } else {
    await doUpdateStatus(row.id, command.status)
  }
}

const submitStatusWithRemark = async () => {
  if (remarkForm.id == null) return
  await doUpdateStatus(remarkForm.id, remarkForm.status, remarkForm.remark)
  remarkVisible.value = false
}

const doUpdateStatus = async (id: number, status: number, remark?: string) => {
  try {
    await updateOrderStatus(id, status, remark)
    ElMessage.success('状态更新成功')
    fetchData()
  } catch (error) {
    console.error(error)
  }
}
</script>

<style lang="scss" scoped>
.page-container {
  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .card-title {
    font-size: 15px;
    font-weight: 600;
    color: $text-primary;
  }

  .activity-info {
    .activity-name {
      font-weight: 500;
      color: $text-primary;
    }

    .activity-id {
      font-size: 12px;
      color: $text-secondary;
      margin-top: 2px;
    }
  }

  .creator-cell {
    .name {
      color: $text-primary;
      font-weight: 500;
    }

    .id {
      display: block;
      font-size: 12px;
      color: $text-secondary;
      margin-top: 2px;
    }
  }

  .amount {
    font-weight: 600;
    color: $color-danger;
  }

  .amount-large {
    font-size: 18px;
    font-weight: 700;
    color: $color-danger;
  }
}
</style>
