<template>
  <div class="ccb-business-online-payment-batch">
    <CcbPageHeader
      title="批量处理"
      description="线上支付订单批量确认、异常标记、批量关闭处理"
      icon="Files"
    />

    <el-row :gutter="20" class="mb15">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">待确认数</div>
          <div class="stat-value text-warning">{{ pendingCount }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">异常订单数</div>
          <div class="stat-value text-danger">{{ abnormalCount }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">今日交易额</div>
          <div class="stat-value text-primary">{{ formatCurrency(todayAmount) }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">成功率</div>
          <div class="stat-value text-success">{{ successRate }}%</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="hover" class="mb15">
      <template #header>
        <div class="batch-header">
          <span class="card-title">订单筛选</span>
          <div class="header-form">
            <el-form :inline="true" size="small">
              <el-form-item label="支付状态">
                <el-select v-model="filterForm.status" placeholder="请选择状态" clearable style="width: 140px">
                  <el-option v-for="item in PAYMENT_STATUS_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
              <el-form-item label="渠道类型">
                <el-select v-model="filterForm.channel_type" placeholder="请选择渠道" clearable style="width: 140px">
                  <el-option v-for="item in CHANNEL_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
              <el-form-item label="支付场景">
                <el-select v-model="filterForm.pay_scene" placeholder="请选择场景" clearable style="width: 140px">
                  <el-option v-for="item in PAY_SCENE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
              <el-form-item label="风险等级">
                <el-select v-model="filterForm.risk_level" placeholder="请选择等级" clearable style="width: 140px">
                  <el-option v-for="item in RISK_LEVEL_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" :icon="Search" size="small" @click="handleFilter">查询</el-button>
                <el-button size="small" @click="handleResetFilter">重置</el-button>
              </el-form-item>
            </el-form>
          </div>
        </div>
      </template>

      <CcbTable
        v-model:page="pageParams.page"
        v-model:pageSize="pageParams.pageSize"
        :loading="loading"
        :data="tableData"
        :total="total"
        :show-selection="true"
        :show-index="true"
        row-class-name="batch-row"
        @selection-change="handleSelectionChange"
        @change="handlePageChange"
        ref="tableRef"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column prop="payment_no" label="支付单号" width="200" />
        <el-table-column prop="payer_account_no" label="付款账号" width="160" />
        <el-table-column prop="merchant_name" label="商户" width="140" show-overflow-tooltip />
        <el-table-column label="渠道" width="90">
          <template #default="{ row }">
            <el-tag :type="getChannelTypeColor(row.channel_type)" effect="light" size="small">
              {{ row.channel_type_text || getChannelTypeLabel(row.channel_type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="pay_scene_text" label="场景" width="100" />
        <el-table-column prop="amount" label="金额" width="120" align="right">
          <template #default="{ row }">
            <span class="amount-positive">{{ formatCurrency(row.amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" effect="light" size="small">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="风险等级" width="100">
          <template #default="{ row }">
            <el-tag :type="getRiskTagType(row.risk_level)" effect="light" size="small">
              {{ getRiskLevelLabel(row.risk_level) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="设备" width="120">
          <template #default="{ row }">
            <div class="device-cell">
              <span>{{ row.device_type_text || '-' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="160" />
      </CcbTable>

      <div class="batch-actions">
        <div class="actions-left">
          <el-text type="info" size="small">
            已选择 <el-text type="primary" size="default">{{ selection.length }}</el-text> 条订单
            <el-button link type="primary" size="small" @click="handleSelectAll">全选</el-button>
            <el-button link type="primary" size="small" @click="handleInvertSelection">反选</el-button>
          </el-text>
        </div>
        <div class="actions-right">
          <el-button
            type="success"
            :icon="Check"
            :loading="batchProcessing"
            @click="handleBatchConfirm"
            :disabled="selection.length === 0"
            v-permission="'business:online-payment:batch:confirm'"
          >
            批量确认
          </el-button>
          <el-button
            type="warning"
            :icon="Warning"
            :loading="batchProcessing"
            @click="handleBatchMarkAbnormal"
            :disabled="selection.length === 0"
            v-permission="'business:online-payment:batch:abnormal'"
          >
            批量标记异常
          </el-button>
          <el-button
            type="danger"
            :icon="Close"
            :loading="batchProcessing"
            @click="handleBatchClose"
            :disabled="selection.length === 0"
            v-permission="'business:online-payment:batch:close'"
          >
            批量关闭
          </el-button>
        </div>
      </div>
    </el-card>

    <el-dialog
      v-model="showReasonDialog"
      :title="reasonDialogTitle"
      width="480px"
      :close-on-click-modal="false"
    >
      <el-form label-width="100px">
        <el-form-item label="操作原因">
          <el-input
            v-model="batchReason"
            type="textarea"
            :rows="4"
            placeholder="请输入操作原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showReasonDialog = false">取消</el-button>
        <el-button type="primary" :disabled="!batchReason.trim()" @click="confirmBatchAction">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Check, Warning, Close } from '@element-plus/icons-vue'
import {
  CHANNEL_TYPE_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  PAY_SCENE_OPTIONS,
  RISK_LEVEL_OPTIONS,
  type ChannelType,
  type PaymentStatus,
  type RiskLevel,
  type PayScene,
  type OnlinePaymentVO,
  type OnlinePaymentQueryParams,
  type OnlinePaymentBatchProcessRequest,
  getOnlinePaymentListApi,
  batchProcessApi,
  formatCurrency
} from '@api/online-payment'

const loading = ref(false)
const batchProcessing = ref(false)
const showReasonDialog = ref(false)
const reasonDialogTitle = ref('')
const batchActionType = ref<'confirm' | 'abnormal' | 'close'>('confirm')
const batchReason = ref('')

const tableData = ref<OnlinePaymentVO[]>([])
const total = ref(0)
const selection = ref<OnlinePaymentVO[]>([])

const filterForm = reactive({
  status: undefined as PaymentStatus | undefined,
  channel_type: undefined as ChannelType | undefined,
  pay_scene: undefined as PayScene | undefined,
  risk_level: undefined as RiskLevel | undefined
})

const pageParams = reactive({
  page: 1,
  pageSize: 10
})

const pendingCount = computed(() => {
  return tableData.value.filter(i => i.status === 0 || i.status === 1).length
})

const abnormalCount = computed(() => {
  return tableData.value.filter(i => i.risk_level >= 3 || i.is_risk_warning).length
})

const todayAmount = computed(() => {
  return tableData.value
    .filter(i => i.status === 2)
    .reduce((sum, item) => sum + (item.amount || 0), 0)
})

const successRate = computed(() => {
  const totalCount = tableData.value.length
  if (totalCount === 0) return 0
  const successCount = tableData.value.filter(i => i.status === 2).length
  return Math.round((successCount / totalCount) * 100)
})

const fetchData = async () => {
  loading.value = true
  try {
    const params: OnlinePaymentQueryParams = {
      page: pageParams.page,
      pageSize: pageParams.pageSize,
      status: filterForm.status,
      channel_type: filterForm.channel_type,
      pay_scene: filterForm.pay_scene,
      risk_level: filterForm.risk_level
    }
    const res = await getOnlinePaymentListApi(params)
    tableData.value = res.data.list
    total.value = res.data.total
  } catch (e) {
    console.error('Failed to fetch online payment list:', e)
  } finally {
    loading.value = false
  }
}

const handleFilter = () => {
  pageParams.page = 1
  fetchData()
}

const handleResetFilter = () => {
  filterForm.status = undefined
  filterForm.channel_type = undefined
  filterForm.pay_scene = undefined
  filterForm.risk_level = undefined
  pageParams.page = 1
  fetchData()
}

const handlePageChange = () => {
  fetchData()
}

const handleSelectionChange = (val: OnlinePaymentVO[]) => {
  selection.value = val
}

const handleSelectAll = () => {
  const tableRef = document.querySelector('.batch-row')
  if (tableRef) {
    const checkbox = document.querySelector('.el-table__header-wrapper .el-checkbox') as HTMLInputElement
    if (checkbox) checkbox.click()
  }
}

const handleInvertSelection = () => {
  ElMessage.info('反选功能待实现')
}

const handleBatchConfirm = () => {
  const pendingItems = selection.value.filter(i => i.status === 0 || i.status === 1)
  if (pendingItems.length === 0) {
    ElMessage.warning('选中的订单中没有待确认的订单')
    return
  }
  batchActionType.value = 'confirm'
  reasonDialogTitle.value = '批量确认'
  batchReason.value = ''
  showReasonDialog.value = true
}

const handleBatchMarkAbnormal = () => {
  batchActionType.value = 'abnormal'
  reasonDialogTitle.value = '批量标记异常'
  batchReason.value = ''
  showReasonDialog.value = true
}

const handleBatchClose = () => {
  const closableItems = selection.value.filter(i => i.status === 0)
  if (closableItems.length === 0) {
    ElMessage.warning('选中的订单中没有可关闭的订单')
    return
  }
  batchActionType.value = 'close'
  reasonDialogTitle.value = '批量关闭'
  batchReason.value = ''
  showReasonDialog.value = true
}

const confirmBatchAction = async () => {
  if (!batchReason.value.trim()) {
    ElMessage.warning('请输入操作原因')
    return
  }

  const actionText = {
    confirm: '确认',
    abnormal: '标记异常',
    close: '关闭'
  }[batchActionType.value]

  try {
    await ElMessageBox.confirm(
      `确认批量${actionText}选中的 ${selection.value.length} 条订单？`,
      `批量${actionText}`,
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
  } catch {
    return
  }

  batchProcessing.value = true
  try {
    const batchTypeMap = {
      confirm: 1,
      abnormal: 2,
      close: 3
    }

    const requestData: OnlinePaymentBatchProcessRequest = {
      batch_type: batchTypeMap[batchActionType.value],
      batch_name: `批量${actionText}_${new Date().toISOString().slice(0, 10)}`,
      payment_ids: selection.value.map(i => i.id),
      reason: batchReason.value
    }

    const res = await batchProcessApi(requestData)
    ElMessage.success(
      `批量${actionText}完成：成功${res.data.success_count}条，失败${res.data.fail_count}条`
    )
    showReasonDialog.value = false
    fetchData()
  } catch (e) {
    console.error('Failed to batch process:', e)
  } finally {
    batchProcessing.value = false
  }
}

const getChannelTypeLabel = (type: ChannelType | number) => {
  const opt = CHANNEL_TYPE_OPTIONS.find(o => o.value === type)
  return opt?.label || '未知'
}

const getChannelTypeColor = (type: ChannelType | number) => {
  const colorMap: Record<number, string> = {
    1: 'primary',
    2: 'success',
    3: 'warning',
    4: 'info',
    5: '',
    6: 'danger'
  }
  return colorMap[type] || 'info'
}

const getStatusType = (status: PaymentStatus | number) => {
  const opt = PAYMENT_STATUS_OPTIONS.find(o => o.value === status)
  return (opt?.type as any) || ''
}

const getStatusLabel = (status: PaymentStatus | number) => {
  const opt = PAYMENT_STATUS_OPTIONS.find(o => o.value === status)
  return opt?.label || '未知'
}

const getRiskLevelLabel = (level: RiskLevel | number) => {
  const opt = RISK_LEVEL_OPTIONS.find(o => o.value === level)
  return opt?.label || '未知'
}

const getRiskTagType = (level: RiskLevel | number) => {
  if (level <= 1) return 'success'
  if (level <= 3) return 'warning'
  return 'danger'
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.stat-card {
  text-align: center;
  padding: 10px 0;
}

.stat-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
}

.text-primary {
  color: #409eff;
}

.text-success {
  color: #67c23a;
}

.text-warning {
  color: #e6a23c;
}

.text-danger {
  color: #f56c6c;
}

.card-title {
  font-weight: 600;
}

.batch-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.header-form {
  flex: 1;
  display: flex;
  justify-content: flex-end;
}

.batch-row:hover {
  transform: scale(1.005);
  transition: transform 0.2s ease;
}

.amount-positive {
  color: #67c23a;
  font-weight: 600;
}

.device-cell {
  font-size: 13px;
  color: #606266;
}

.mb15 {
  margin-bottom: 15px;
}

.batch-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #ebeef5;
}

.actions-left {
  flex: 1;
}

.actions-right {
  display: flex;
  gap: 10px;
}
</style>
