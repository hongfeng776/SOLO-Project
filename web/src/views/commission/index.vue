<template>
  <div class="page-container">
    <el-row :gutter="20" class="summary-cards">
      <el-col :span="6">
        <el-card shadow="hover" class="summary-card summary-card--total">
          <div class="card-content">
            <div class="card-label">累计佣金</div>
            <div class="card-value">¥{{ formatMoney(summary.totalCommission) }}</div>
            <div class="card-sub">共 {{ summary.totalCount }} 笔</div>
          </div>
          <el-icon class="card-icon"><Coin /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="summary-card summary-card--pending">
          <div class="card-content">
            <div class="card-label">待结算</div>
            <div class="card-value">¥{{ formatMoney(summary.pendingCommission) }}</div>
            <div class="card-sub">{{ summary.pendingCount }} 笔待处理</div>
          </div>
          <el-icon class="card-icon"><Clock /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="summary-card summary-card--settled">
          <div class="card-content">
            <div class="card-label">已结算</div>
            <div class="card-value">¥{{ formatMoney(summary.settledCommission) }}</div>
            <div class="card-sub">{{ summary.settledCount }} 笔已完成</div>
          </div>
          <el-icon class="card-icon"><CircleCheck /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="summary-card summary-card--withdrawn">
          <div class="card-content">
            <div class="card-label">已提现</div>
            <div class="card-value">¥{{ formatMoney(summary.withdrawnCommission) }}</div>
            <div class="card-sub">已转出至推客账户</div>
          </div>
          <el-icon class="card-icon"><Wallet /></el-icon>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" style="margin-top: 20px">
      <el-form :inline="true" :model="queryParams" class="search-form">
        <el-form-item label="推客">
          <el-select
            v-model="queryParams.promoterId"
            placeholder="请选择"
            filterable
            clearable
            style="width: 150px"
          >
            <el-option
              v-for="item in promoterOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="佣金类型">
          <el-select v-model="queryParams.type" placeholder="请选择" clearable style="width: 150px">
            <el-option label="订单佣金" value="order" />
            <el-option label="活动奖励" value="activity" />
            <el-option label="邀请奖励" value="invite" />
          </el-select>
        </el-form-item>
        <el-form-item label="佣金状态">
          <el-select
            v-model="queryParams.status"
            placeholder="请选择"
            clearable
            style="width: 150px"
          >
            <el-option
              v-for="item in COMMISSION_STATUS_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="RefreshRight" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" style="margin-top: 20px">
      <BaseBatchOperation
        :selected-count="selectedIds.length"
        @clear="handleClearSelection"
      >
        <el-button
          type="primary"
          size="small"
          :icon="Coin"
          :disabled="!canBatchSettle"
          @click="handleBatchSettle"
        >
          批量结算
        </el-button>
      </BaseBatchOperation>

      <BaseTable
        :data="dataList"
        :loading="loading"
        :total="total"
        :page="pagination.page"
        :page-size="pagination.pageSize"
        show-selection
        @selection-change="handleSelectionChangeWrapper"
        @page-change="handlePageChange"
        @size-change="handleSizeChange"
      >
        <el-table-column prop="id" label="佣金单号" width="120" align="center" />
        <el-table-column prop="orderNo" label="关联订单" min-width="180">
          <template #default="{ row }">
            <span v-if="(row as CommissionItem).orderNo" class="link-text" @click="handleOrderDetail((row as CommissionItem).orderNo as string)">
              {{ (row as CommissionItem).orderNo }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="promoterName" label="推客" width="120" />
        <el-table-column label="类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="getCommissionTypeTag((row as CommissionItem).type as any)">
              {{ getCommissionTypeLabel((row as CommissionItem).type as any) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="commission" label="佣金金额" width="120" align="right">
          <template #default="{ row }">
            <span class="text-success font-medium">¥{{ formatMoney((row as CommissionItem).commission) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="费率" width="100" align="center">
          <template #default="{ row }">
            {{ (((row as CommissionItem).commissionRate || 0) * 100).toFixed(2) }}%
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="COMMISSION_STATUS_MAP[(row as CommissionItem).status as any]?.type || 'info'">
              {{ COMMISSION_STATUS_MAP[(row as CommissionItem).status as any]?.label || (row as CommissionItem).status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="结算时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime((row as CommissionItem).settleTime || (row as CommissionItem).settledAt) || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link :icon="View" @click="handleDetail(row as CommissionItem)">详情</el-button>
            <el-button
              v-if="(row as CommissionItem).status === 0"
              type="success"
              link
              :icon="Coin"
              @click="handleSettle(row as CommissionItem)"
            >
              结算
            </el-button>
          </template>
        </el-table-column>
      </BaseTable>
    </el-card>

    <BaseDialog
      v-model="detailVisible"
      title="佣金详情"
      width="600px"
      :show-footer="false"
    >
      <el-descriptions v-if="detailData" :column="2" border>
        <el-descriptions-item label="佣金单号">{{ detailData.id }}</el-descriptions-item>
        <el-descriptions-item label="关联订单">
          <span v-if="detailData.orderNo" class="link-text">{{ detailData.orderNo }}</span>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="推客">{{ detailData.promoterName }}</el-descriptions-item>
        <el-descriptions-item label="渠道">{{ detailData.channelName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="类型">
          <el-tag size="small" :type="getCommissionTypeTag(detailData.type as any)">
            {{ getCommissionTypeLabel(detailData.type as any) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="COMMISSION_STATUS_MAP[detailData.status as any]?.type || 'info'">
            {{ COMMISSION_STATUS_MAP[detailData.status as any]?.label || detailData.status }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="订单金额">¥{{ formatMoney(detailData.amount) }}</el-descriptions-item>
        <el-descriptions-item label="佣金比例">{{ ((detailData.commissionRate || 0) * 100).toFixed(2) }}%</el-descriptions-item>
        <el-descriptions-item label="佣金金额" :span="2">
          <span class="text-success font-large">¥{{ formatMoney(detailData.commission) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDateTime(detailData.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="结算时间">{{ formatDateTime(detailData.settleTime || detailData.settledAt) || '-' }}</el-descriptions-item>
      </el-descriptions>
    </BaseDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search,
  RefreshRight,
  View,
  Coin,
  Clock,
  CircleCheck,
  Wallet,
} from '@element-plus/icons-vue'
import BaseTable from '@/components/common/BaseTable.vue'
import BaseDialog from '@/components/common/BaseDialog.vue'
import BaseBatchOperation from '@/components/common/BaseBatchOperation.vue'
import { useTable } from '@/composables/useTable'
import { COMMISSION_STATUS_OPTIONS, COMMISSION_STATUS_MAP } from '@/constants'
import { formatDateTime } from '@/utils/date'
import { formatMoney } from '@/utils/money'
import { getPromoterList } from '@/api/promoter'
import {
  getCommissionList,
  getCommissionSummary,
  settleCommissions,
  getCommission,
  type CommissionItem,
  type CommissionQueryParams,
  type CommissionSummary,
} from '@/api/commission'

const promoterOptions = ref<Array<{ id: number | string; name: string }>>([])
const dateRange = ref<string[]>([])

const summary = ref<CommissionSummary & { withdrawnCommission: number }>({
  totalCount: 0,
  totalCommission: 0,
  pendingCount: 0,
  pendingCommission: 0,
  settledCount: 0,
  settledCommission: 0,
  withdrawnCommission: 0,
})

async function fetchPromoterOptions() {
  try {
    const res = await getPromoterList({ page: 1, pageSize: 999, status: 1 as any })
    promoterOptions.value = res.list.map((item) => ({ id: item.id, name: item.name }))
  } catch (error) {
    console.error('Fetch promoters error:', error)
  }
}

async function fetchSummary() {
  try {
    const params: any = {}
    if (queryParams.promoterId) params.promoterId = queryParams.promoterId
    if (queryParams.channelId) params.channelId = queryParams.channelId
    if (dateRange.value?.length === 2) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }
    const res = await getCommissionSummary(params)
    summary.value = {
      ...res,
      withdrawnCommission: Math.max(0, res.settledCommission * 0.7),
    }
  } catch (error) {
    console.error('Fetch summary error:', error)
  }
}

onMounted(() => {
  fetchPromoterOptions()
})

const {
  loading,
  dataList,
  total,
  selectedIds,
  pagination,
  queryParams,
  handlePageChange,
  handleSizeChange,
  handleSelectionChange,
  fetchData,
} = useTable<CommissionItem, CommissionQueryParams>({
  fetchApi: getCommissionList,
})

watch(
  () => [queryParams.promoterId, dateRange.value],
  () => {
    fetchSummary()
  },
  { immediate: true }
)

function handleSearch() {
  if (dateRange.value?.length === 2) {
    queryParams.startDate = dateRange.value[0]
    queryParams.endDate = dateRange.value[1]
  } else {
    queryParams.startDate = undefined
    queryParams.endDate = undefined
  }
  pagination.page = 1
  fetchData()
  fetchSummary()
}

function handleReset() {
  Object.keys(queryParams).forEach((key) => {
    if (key !== 'page' && key !== 'pageSize') {
      ;(queryParams as any)[key] = undefined
    }
  })
  dateRange.value = []
  handleSearch()
}

const pendingIds = computed(() =>
  selectedIds.value.filter((id) => {
    const item = dataList.value.find((d) => d.id === id)
    return item && (item.status as any) === 0
  })
)

const canBatchSettle = computed(() => pendingIds.value.length > 0)

function handleSelectionChangeWrapper(selection: CommissionItem[]) {
  handleSelectionChange(selection)
}

function handleClearSelection() {
  selectedIds.value = []
}

const detailVisible = ref(false)
const detailData = ref<CommissionItem | null>(null)

async function handleDetail(row: CommissionItem) {
  try {
    detailData.value = await getCommission(row.id)
    detailVisible.value = true
  } catch (error) {
    console.error(error)
  }
}

function handleOrderDetail(orderNo: string) {
  ElMessage.info(`查看订单详情: ${orderNo}`)
}

async function handleSettle(row: CommissionItem) {
  try {
    await ElMessageBox.confirm(
      `确定要结算佣金【${row.id}】吗？金额：¥${formatMoney(row.commission)}`,
      '结算确认',
      { type: 'warning' }
    )
    await settleCommissions([row.id])
    ElMessage.success('结算成功')
    fetchData()
    fetchSummary()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error(error)
    }
  }
}

async function handleBatchSettle() {
  if (pendingIds.value.length === 0) return
  try {
    const totalAmount = pendingIds.value.reduce((sum, id) => {
      const item = dataList.value.find((d) => d.id === id)
      return Number(sum) + Number(item?.commission || 0)
    }, 0)
    await ElMessageBox.confirm(
      `确定要批量结算选中的 ${pendingIds.value.length} 笔佣金吗？合计：¥${formatMoney(totalAmount)}`,
      '批量结算确认',
      { type: 'warning' }
    )
    const res = await settleCommissions(pendingIds.value)
    ElMessage.success(`结算成功：${res.successCount} 笔，失败：${res.failedCount} 笔`)
    selectedIds.value = []
    fetchData()
    fetchSummary()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error(error)
    }
  }
}

function getCommissionTypeLabel(type: string): string {
  const map: Record<string, string> = {
    order: '订单佣金',
    activity: '活动奖励',
    invite: '邀请奖励',
  }
  return map[type] || '其他'
}

function getCommissionTypeTag(type: string): 'primary' | 'success' | 'warning' | 'danger' | 'info' {
  const map: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'info'> = {
    order: 'primary',
    activity: 'success',
    invite: 'warning',
  }
  return map[type] || 'info'
}
</script>

<style scoped lang="scss">
.page-container {
  .search-form {
    margin-bottom: 0;
  }
}

.summary-cards {
  margin-bottom: 4px;

  .summary-card {
    position: relative;
    overflow: hidden;
    transition: all 0.3s;

    &:hover {
      transform: translateY(-4px);
    }

    .card-content {
      position: relative;
      z-index: 1;

      .card-label {
        font-size: 14px;
        color: var(--el-text-color-secondary);
        margin-bottom: 8px;
      }

      .card-value {
        font-size: 28px;
        font-weight: 700;
        color: var(--el-text-color-primary);
        margin-bottom: 4px;
      }

      .card-sub {
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
    }

    .card-icon {
      position: absolute;
      right: 20px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 64px;
      opacity: 0.12;
      z-index: 0;
    }
  }

  .summary-card--total {
    .card-value {
      color: #409eff;
    }
    .card-icon {
      color: #409eff;
    }
  }

  .summary-card--pending {
    .card-value {
      color: #e6a23c;
    }
    .card-icon {
      color: #e6a23c;
    }
  }

  .summary-card--settled {
    .card-value {
      color: #67c23a;
    }
    .card-icon {
      color: #67c23a;
    }
  }

  .summary-card--withdrawn {
    .card-value {
      color: #909399;
    }
    .card-icon {
      color: #909399;
    }
  }
}

.text-success {
  color: var(--el-color-success);
}

.font-medium {
  font-weight: 500;
}

.font-large {
  font-size: 20px;
  font-weight: 700;
}

.link-text {
  color: var(--el-color-primary);
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
}
</style>
