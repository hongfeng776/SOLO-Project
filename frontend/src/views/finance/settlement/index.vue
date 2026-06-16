<template>
  <div class="page-container">
    <el-row :gutter="16" class="mb-20">
      <el-col :xs="12" :sm="6" v-for="item in statCards" :key="item.key">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" :style="{ background: item.color + '15', color: item.color }">
            <el-icon :size="24"><component :is="item.icon" /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ item.isMoney ? formatMoney(item.value) : formatCompact(item.value) }}</div>
            <div class="stat-label">{{ item.label }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" class="mb-20">
      <el-form :model="queryParams" label-width="80px" inline @submit.prevent>
        <el-form-item label="关键词">
          <el-input
            v-model="queryParams.keyword"
            placeholder="订单号/达人名称"
            clearable
            style="width: 220px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="结算类型">
          <el-select
            v-model="queryParams.settlementType"
            placeholder="全部类型"
            clearable
            style="width: 140px"
          >
            <el-option v-for="(label, value) in settlementTypeOptions" :key="value" :label="label" :value="value" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="queryParams.status"
            placeholder="全部状态"
            clearable
            style="width: 140px"
          >
            <el-option v-for="(label, value) in settlementStatusOptions" :key="value" :label="label" :value="Number(value)" />
          </el-select>
        </el-form-item>
        <el-form-item label="结算周期">
          <el-input
            v-model="queryParams.settlementPeriod"
            placeholder="如：2024-06"
            clearable
            style="width: 140px"
          />
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 260px"
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
          <span class="card-title">结算管理</span>
          <div class="header-actions">
            <el-button
              type="primary"
              :icon="Check"
              :disabled="!hasSelection"
              @click="handleBatchSettle"
            >
              批量结算
            </el-button>
          </div>
        </div>
      </template>

      <BatchActions
        :selected-ids="selectedIds"
        :total="total"
        :allow-delete="false"
        :allow-export="false"
        :always-show="true"
      >
        <template #default="{ selectedCount }">
          <span class="selected-tip">已选择 {{ selectedCount }} 项</span>
        </template>
      </BatchActions>

      <HtTable
        :data="dataList"
        :loading="loading"
        :total="total"
        v-model:page="queryParams.page"
        v-model:page-size="queryParams.pageSize"
        show-index
        selectable
        row-key="id"
        @selection-change="(rows: unknown[]) => handleSelectionChange(rows as Settlement[])"
        @paginate="handlePaginate"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="orderNo" label="订单号" width="180" />
        <el-table-column label="达人" width="140">
          <template #default="{ row }">
            <div class="creator-cell">
              <span class="name">{{ row.creatorName }}</span>
              <span class="id">ID：{{ row.creatorId }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="merchantName" label="商家" width="140" show-overflow-tooltip />
        <el-table-column label="结算金额" width="120" align="right">
          <template #default="{ row }">
            <span class="amount">{{ formatMoney(row.amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="平台服务费" width="120" align="right">
          <template #default="{ row }">
            <span class="fee">{{ formatMoney(row.platformFee) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="达人收入" width="120" align="right">
          <template #default="{ row }">
            <span class="income">{{ formatMoney(row.creatorIncome) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="结算类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="settlementTypeColor[row.settlementType] || 'info'" size="small" effect="light">
              {{ settlementTypeOptions[row.settlementType] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="settlementPeriod" label="结算周期" width="100" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="settlementStatusColor[row.status] || 'info'" size="small">
              {{ settlementStatusOptions[row.status] }}
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
            <el-button
              v-if="row.status === SettlementStatus.PENDING"
              link
              type="success"
              size="small"
              @click="handleSettle(row)"
            >
              结算
            </el-button>
            <el-button
              v-if="row.status === SettlementStatus.PENDING"
              link
              type="danger"
              size="small"
              @click="handleReject(row)"
            >
              驳回
            </el-button>
          </template>
        </el-table-column>
      </HtTable>
    </el-card>

    <el-dialog v-model="detailVisible" title="结算详情" width="640px" destroy-on-close>
      <el-descriptions v-if="currentSettlement" :column="2" border>
        <el-descriptions-item label="结算ID" :span="2">{{ currentSettlement.id }}</el-descriptions-item>
        <el-descriptions-item label="订单号">
          {{ currentSettlement.orderNo }}
        </el-descriptions-item>
        <el-descriptions-item label="结算状态">
          <el-tag :type="settlementStatusColor[currentSettlement.status]">
            {{ settlementStatusOptions[currentSettlement.status] }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="达人">
          {{ currentSettlement.creatorName }}（ID：{{ currentSettlement.creatorId }}）
        </el-descriptions-item>
        <el-descriptions-item label="商家">
          {{ currentSettlement.merchantName }}
        </el-descriptions-item>
        <el-descriptions-item label="结算金额">
          <span class="amount-large">{{ formatMoney(currentSettlement.amount) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="平台服务费">
          {{ formatMoney(currentSettlement.platformFee) }}
        </el-descriptions-item>
        <el-descriptions-item label="达人收入">
          <span class="income-large">{{ formatMoney(currentSettlement.creatorIncome) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="结算类型">
          {{ settlementTypeOptions[currentSettlement.settlementType] }}
        </el-descriptions-item>
        <el-descriptions-item label="结算周期">
          {{ currentSettlement.settlementPeriod }}
        </el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">
          {{ formatDateTime(currentSettlement.createTime) }}
        </el-descriptions-item>
        <el-descriptions-item v-if="currentSettlement.settleTime" label="结算时间" :span="2">
          {{ formatDateTime(currentSettlement.settleTime) }}
        </el-descriptions-item>
        <el-descriptions-item v-if="currentSettlement.remark" label="备注" :span="2">
          {{ currentSettlement.remark }}
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <el-dialog v-model="remarkVisible" :title="remarkTitle" width="420px" destroy-on-close>
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
        <el-button type="primary" @click="submitRemark">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh, Check, Money } from '@element-plus/icons-vue'
import { useFetchList, useSelection, formatDateTime } from '@hooks/index'
import { useNumberFormat } from '@hooks/useFormat'
import {
  getSettlementList,
  getSettlementDetail,
  settleSettlement,
  rejectSettlement,
  batchSettleSettlements,
  getSettlementStats
} from '@/api/settlement'
import { SettlementType, SettlementStatus } from '@enums/business'
import type { Settlement } from '@/types/business'
import HtTable from '@components/HtTable/index.vue'
import BatchActions from '@components/BatchActions/index.vue'

const { formatMoney, formatCompact } = useNumberFormat()

const settlementTypeOptions: Record<string, string> = {
  [SettlementType.ORDER]: '订单结算',
  [SettlementType.ACTIVITY]: '活动结算',
  [SettlementType.BONUS]: '奖金结算'
}

const settlementTypeColor: Record<string, string> = {
  [SettlementType.ORDER]: 'primary',
  [SettlementType.ACTIVITY]: 'success',
  [SettlementType.BONUS]: 'warning'
}

const settlementStatusOptions: Record<number, string> = {
  [SettlementStatus.PENDING]: '待结算',
  [SettlementStatus.SETTLING]: '结算中',
  [SettlementStatus.SETTLED]: '已结算',
  [SettlementStatus.REJECTED]: '已驳回'
}

const settlementStatusColor: Record<number, string> = {
  [SettlementStatus.PENDING]: 'warning',
  [SettlementStatus.SETTLING]: 'primary',
  [SettlementStatus.SETTLED]: 'success',
  [SettlementStatus.REJECTED]: 'danger'
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
} = useFetchList<Settlement, {
  keyword?: string
  settlementType?: string
  status?: number
  settlementPeriod?: string
  startDate?: string
  endDate?: string
}>({
  fetchApi: getSettlementList,
  defaultParams: { keyword: '', settlementType: '', status: undefined, settlementPeriod: '', startDate: '', endDate: '' }
})

const { selectedIds, hasSelection, handleSelectionChange, clearSelection } = useSelection<Settlement>()

const dateRange = ref<string[]>([])

const statCards = ref([
  { key: 'total', label: '累计结算金额', value: 0, icon: Money, color: '#67c23a', isMoney: true },
  { key: 'pending', label: '待结算数量', value: 0, icon: Money, color: '#e6a23c', isMoney: false },
  { key: 'settled', label: '已结算数量', value: 0, icon: Money, color: '#409eff', isMoney: false },
  { key: 'today', label: '今日结算金额', value: 0, icon: Money, color: '#f56c6c', isMoney: true }
])

const detailVisible = ref(false)
const currentSettlement = ref<Settlement | null>(null)

const remarkVisible = ref(false)
const remarkTitle = ref('')
const remarkAction = ref<'settle' | 'reject' | 'batchSettle'>('settle')
const pendingSettlementId = ref<number | null>(null)
const remarkForm = reactive<{ remark: string }>({
  remark: ''
})

const loadStats = async () => {
  try {
    const stats = await getSettlementStats()
    statCards.value[0].value = stats.totalAmount || 0
    statCards.value[1].value = stats.pendingCount || 0
    statCards.value[2].value = stats.settledCount || 0
    statCards.value[3].value = stats.todayAmount || 0
  } catch (error) {
    console.error('获取结算统计失败:', error)
  }
}

const openDetail = async (row: Settlement) => {
  try {
    const detail = await getSettlementDetail(row.id)
    currentSettlement.value = detail
    detailVisible.value = true
  } catch (error) {
    console.error('获取结算详情失败:', error)
  }
}

const handleSettle = (row: Settlement) => {
  pendingSettlementId.value = row.id
  remarkAction.value = 'settle'
  remarkTitle.value = '确认结算'
  remarkForm.remark = ''
  remarkVisible.value = true
}

const handleReject = (row: Settlement) => {
  pendingSettlementId.value = row.id
  remarkAction.value = 'reject'
  remarkTitle.value = '驳回结算'
  remarkForm.remark = ''
  remarkVisible.value = true
}

const handleBatchSettle = () => {
  if (!selectedIds.value.length) {
    ElMessage.warning('请先选择要结算的记录')
    return
  }
  remarkAction.value = 'batchSettle'
  remarkTitle.value = '批量结算'
  remarkForm.remark = ''
  remarkVisible.value = true
}

const submitRemark = async () => {
  if (remarkAction.value === 'settle' && pendingSettlementId.value) {
    try {
      await settleSettlement(pendingSettlementId.value, remarkForm.remark)
      ElMessage.success('结算成功')
      remarkVisible.value = false
      fetchData()
      loadStats()
    } catch (error) {
      console.error(error)
    }
  } else if (remarkAction.value === 'reject' && pendingSettlementId.value) {
    if (!remarkForm.remark.trim()) {
      ElMessage.warning('请输入驳回原因')
      return
    }
    try {
      await rejectSettlement(pendingSettlementId.value, remarkForm.remark)
      ElMessage.success('驳回成功')
      remarkVisible.value = false
      fetchData()
      loadStats()
    } catch (error) {
      console.error(error)
    }
  } else if (remarkAction.value === 'batchSettle') {
    try {
      await batchSettleSettlements(selectedIds.value, remarkForm.remark)
      ElMessage.success(`成功结算 ${selectedIds.value.length} 条记录`)
      remarkVisible.value = false
      clearSelection()
      fetchData()
      loadStats()
    } catch (error) {
      console.error(error)
    }
  }
}

onMounted(() => {
  loadStats()
})
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

  .header-actions {
    display: flex;
    gap: 8px;
  }

  .stat-card {
    :deep(.el-card__body) {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
    }
  }

  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: $border-radius;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .stat-content {
    flex: 1;
    min-width: 0;
  }

  .stat-value {
    font-size: 20px;
    font-weight: 700;
    color: $text-primary;
    line-height: 1.2;
  }

  .stat-label {
    font-size: 13px;
    color: $text-secondary;
    margin-top: 4px;
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
    color: $text-primary;
  }

  .fee {
    color: $text-secondary;
  }

  .income {
    font-weight: 600;
    color: $color-success;
  }

  .amount-large {
    font-size: 18px;
    font-weight: 700;
    color: $text-primary;
  }

  .income-large {
    font-size: 18px;
    font-weight: 700;
    color: $color-success;
  }

  .selected-tip {
    font-size: 13px;
    color: $text-primary;
  }
}
</style>
