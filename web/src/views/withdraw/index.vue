<template>
  <div class="page-container">
    <el-card shadow="never">
      <el-form :inline="true" :model="queryParams" class="search-form">
        <el-form-item label="提现单号">
          <el-input
            v-model="queryParams.withdrawNo"
            placeholder="请输入提现单号"
            clearable
            style="width: 200px"
          />
        </el-form-item>
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
        <el-form-item label="提现状态">
          <el-select
            v-model="queryParams.status"
            placeholder="请选择"
            clearable
            style="width: 150px"
          >
            <el-option
              v-for="item in WITHDRAW_STATUS_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="申请时间">
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
          type="success"
          size="small"
          :icon="CircleCheck"
          :disabled="!canBatchAudit"
          @click="handleBatchAudit(1)"
        >
          批量通过
        </el-button>
        <el-button
          type="danger"
          size="small"
          :icon="CircleClose"
          :disabled="!canBatchAudit"
          @click="handleBatchAudit(2)"
        >
          批量拒绝
        </el-button>
      </BaseBatchOperation>

      <BaseTable
        :data="dataList"
        :loading="loading"
        :total="total"
        :page="pagination.page"
        :page-size="pagination.pageSize"
        show-selection
        @selection-change="handleSelectionChange"
        @page-change="handlePageChange"
        @size-change="handleSizeChange"
      >
        <el-table-column prop="withdrawNo" label="提现单号" min-width="180" />
        <el-table-column prop="promoterName" label="推客" width="100" />
        <el-table-column prop="promoterPhone" label="手机号" width="130" />
        <el-table-column prop="amount" label="提现金额" width="120" align="right">
          <template #default="{ row }">
            <span class="font-medium">¥{{ formatMoney((row as WithdrawItem).amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="fee" label="手续费" width="100" align="right">
          <template #default="{ row }">
            ¥{{ formatMoney((row as WithdrawItem).fee) }}
          </template>
        </el-table-column>
        <el-table-column prop="actualAmount" label="实际到账" width="120" align="right">
          <template #default="{ row }">
            <span class="text-success font-medium">¥{{ formatMoney((row as WithdrawItem).actualAmount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="打款方式" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small">
              {{ WITHDRAW_METHOD_MAP[(row as WithdrawItem).method]?.label || (row as WithdrawItem).method }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="WITHDRAW_STATUS_MAP[(row as WithdrawItem).status]?.type || 'info'">
              {{ WITHDRAW_STATUS_MAP[(row as WithdrawItem).status]?.label || (row as WithdrawItem).status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="申请时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime((row as WithdrawItem).applyTime || (row as WithdrawItem).createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="260" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link :icon="View" @click="handleDetail(row as WithdrawItem)">详情</el-button>
            <template v-if="(row as WithdrawItem).status === 0">
              <el-button
                type="success"
                link
                :icon="CircleCheck"
                @click="handleAudit(row as WithdrawItem, 1)"
              >
                通过
              </el-button>
              <el-button
                type="danger"
                link
                :icon="CircleClose"
                @click="handleAudit(row as WithdrawItem, 2)"
              >
                拒绝
              </el-button>
            </template>
            <el-button
              v-if="(row as WithdrawItem).status === 1"
              type="primary"
              link
              :icon="Wallet"
              @click="handlePay(row as WithdrawItem)"
            >
              打款
            </el-button>
          </template>
        </el-table-column>
      </BaseTable>
    </el-card>

    <BaseDialog
      v-model="detailVisible"
      title="提现详情"
      width="650px"
      :show-footer="false"
    >
      <el-descriptions v-if="detailData" :column="2" border size="small">
        <el-descriptions-item label="提现单号" :span="2">{{ detailData.withdrawNo }}</el-descriptions-item>
        <el-descriptions-item label="推客">{{ detailData.promoterName }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ detailData.promoterPhone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="提现金额">¥{{ formatMoney(detailData.amount) }}</el-descriptions-item>
        <el-descriptions-item label="手续费">¥{{ formatMoney(detailData.fee) }}</el-descriptions-item>
        <el-descriptions-item label="实际到账" :span="2">
          <span class="text-success font-large">¥{{ formatMoney(detailData.actualAmount) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="打款方式">
          <el-tag size="small">
            {{ WITHDRAW_METHOD_MAP[detailData.method]?.label || detailData.method }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="WITHDRAW_STATUS_MAP[detailData.status]?.type || 'info'">
            {{ WITHDRAW_STATUS_MAP[detailData.status]?.label || detailData.status }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="收款人" v-if="detailData.accountName">{{ detailData.accountName }}</el-descriptions-item>
        <el-descriptions-item label="账号" v-if="detailData.accountNo">{{ detailData.accountNo }}</el-descriptions-item>
        <el-descriptions-item label="开户行" v-if="detailData.bankName" :span="2">{{ detailData.bankName }}</el-descriptions-item>
        <el-descriptions-item label="申请时间">{{ formatDateTime(detailData.applyTime || detailData.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="审核时间">{{ formatDateTime(detailData.auditTime) || '-' }}</el-descriptions-item>
        <el-descriptions-item label="审核备注" :span="2">{{ detailData.auditRemark || '-' }}</el-descriptions-item>
        <el-descriptions-item label="打款时间">{{ formatDateTime(detailData.payTime) || '-' }}</el-descriptions-item>
        <el-descriptions-item label="打款备注" :span="2">{{ detailData.payRemark || '-' }}</el-descriptions-item>
      </el-descriptions>
    </BaseDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search,
  RefreshRight,
  View,
  CircleCheck,
  CircleClose,
  Wallet,
} from '@element-plus/icons-vue'
import BaseTable from '@/components/common/BaseTable.vue'
import BaseDialog from '@/components/common/BaseDialog.vue'
import BaseBatchOperation from '@/components/common/BaseBatchOperation.vue'
import { useTable } from '@/composables/useTable'
import {
  WITHDRAW_STATUS_OPTIONS,
  WITHDRAW_STATUS_MAP,
  WITHDRAW_METHOD_MAP,
} from '@/constants'
import { formatDateTime } from '@/utils/date'
import { formatMoney } from '@/utils/money'
import { getPromoterList } from '@/api/promoter'
import {
  getWithdrawList,
  auditWithdraw,
  payWithdraw,
  batchAuditWithdraws,
  getWithdraw,
  type WithdrawItem,
  type WithdrawQueryParams,
} from '@/api/withdraw'

const promoterOptions = ref<Array<{ id: number | string; name: string }>>([])
const dateRange = ref<string[]>([])

async function fetchPromoterOptions() {
  try {
    const res = await getPromoterList({ page: 1, pageSize: 999, status: 1 as any })
    promoterOptions.value = res.list.map((item) => ({ id: item.id, name: item.name }))
  } catch (error) {
    console.error('Fetch promoters error:', error)
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
} = useTable<WithdrawItem, WithdrawQueryParams>({
  fetchApi: getWithdrawList,
})

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
    return item && item.status === 0
  })
)

const canBatchAudit = computed(() => pendingIds.value.length > 0)

function handleClearSelection() {
  selectedIds.value = []
}

const detailVisible = ref(false)
const detailData = ref<WithdrawItem | null>(null)

async function handleDetail(row: WithdrawItem) {
  try {
    detailData.value = await getWithdraw(row.id)
    detailVisible.value = true
  } catch (error) {
    console.error(error)
  }
}

async function handleAudit(row: WithdrawItem, status: 1 | 2) {
  const statusLabel = status === 1 ? '通过' : '拒绝'
  try {
    let remark = ''
    if (status === 2) {
      const result = await ElMessageBox.prompt(
        `请输入拒绝原因`,
        `审核${statusLabel}`,
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          inputType: 'textarea',
          inputPlaceholder: '请输入拒绝原因（必填）',
          inputValidator: (val) => {
            if (!val || !val.trim()) return '请输入拒绝原因'
            return true
          },
        }
      )
      remark = result.value
    } else {
      await ElMessageBox.confirm(
        `确定要审核通过提现【${row.withdrawNo}】吗？金额：¥${formatMoney(row.amount)}`,
        '审核确认',
        { type: 'warning' }
      )
    }

    await auditWithdraw(row.id, { status, remark })
    ElMessage.success(`审核${statusLabel}成功`)
    fetchData()
  } catch (error: any) {
    if (error !== 'cancel' && error?.action !== 'cancel') {
      console.error(error)
    }
  }
}

async function handleBatchAudit(status: 1 | 2) {
  if (pendingIds.value.length === 0) return
  const statusLabel = status === 1 ? '通过' : '拒绝'
  try {
    let remark = ''
    if (status === 2) {
      const result = await ElMessageBox.prompt(
        `请输入拒绝原因`,
        `批量审核${statusLabel}`,
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          inputType: 'textarea',
          inputPlaceholder: '请输入拒绝原因（必填）',
          inputValidator: (val) => {
            if (!val || !val.trim()) return '请输入拒绝原因'
            return true
          },
        }
      )
      remark = result.value
    } else {
      await ElMessageBox.confirm(
        `确定要批量审核通过选中的 ${pendingIds.value.length} 笔提现吗？`,
        '批量审核确认',
        { type: 'warning' }
      )
    }

    const res = await batchAuditWithdraws(pendingIds.value, { status, remark })
    ElMessage.success(`批量操作完成：成功 ${res.successCount} 笔，失败 ${res.failedCount} 笔`)
    selectedIds.value = []
    fetchData()
  } catch (error: any) {
    if (error !== 'cancel' && error?.action !== 'cancel') {
      console.error(error)
    }
  }
}

async function handlePay(row: WithdrawItem) {
  try {
    await ElMessageBox.confirm(
      `确定要对提现【${row.withdrawNo}】执行打款吗？\n\n收款人：${row.promoterName}\n打款方式：${WITHDRAW_METHOD_MAP[row.method]?.label}\n打款金额：¥${formatMoney(row.actualAmount)}`,
      '打款确认',
      {
        type: 'warning',
        confirmButtonText: '确认打款',
      }
    )
    await payWithdraw(row.id)
    ElMessage.success('打款成功')
    fetchData()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error(error)
    }
  }
}
</script>

<style scoped lang="scss">
.page-container {
  .search-form {
    margin-bottom: 0;
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
</style>
