<template>
  <div class="ccb-business-payment-batch">
    <CcbPageHeader
      title="批量订单处理"
      description="线上支付订单批量确认、异常标记、重试、退款、关闭操作"
      icon="Files"
    />

    <el-row :gutter="20" class="mb15">
      <el-col :span="12">
        <el-card shadow="hover" class="stat-card">
          <template #header>
            <span class="card-title">批次状态统计</span>
          </template>
          <el-row :gutter="10">
            <el-col :span="4" class="stat-item">
              <el-tag type="info" effect="light" size="small">待确认</el-tag>
              <div class="stat-value text-info">{{ pendingConfirmCount }}</div>
            </el-col>
            <el-col :span="4" class="stat-item">
              <el-tag type="warning" effect="light" size="small">待复核</el-tag>
              <div class="stat-value text-warning">{{ pendingReviewCount }}</div>
            </el-col>
            <el-col :span="4" class="stat-item">
              <el-tag type="success" effect="light" size="small">成功</el-tag>
              <div class="stat-value text-success">{{ successCount }}</div>
            </el-col>
            <el-col :span="4" class="stat-item">
              <el-tag type="danger" effect="light" size="small">失败</el-tag>
              <div class="stat-value text-danger">{{ failCount }}</div>
            </el-col>
            <el-col :span="4" class="stat-item">
              <el-tag type="info" effect="light" size="small">已关闭</el-tag>
              <div class="stat-value text-muted">{{ closedCount }}</div>
            </el-col>
            <el-col :span="4" class="stat-item">
              <el-tag type="danger" effect="dark" size="small">异常</el-tag>
              <div class="stat-value text-danger">{{ abnormalCount }}</div>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover" class="stat-card">
          <template #header>
            <span class="card-title">金额统计</span>
          </template>
          <el-row :gutter="20">
            <el-col :span="6" class="stat-item right-align">
              <div class="stat-label">总订单金额</div>
              <div class="stat-value text-primary">{{ formatThousands(totalAmount) }}</div>
            </el-col>
            <el-col :span="6" class="stat-item right-align">
              <div class="stat-label">手续费合计</div>
              <div class="stat-value text-success">{{ formatThousands(totalFee) }}</div>
            </el-col>
            <el-col :span="6" class="stat-item right-align">
              <div class="stat-label">实付合计</div>
              <div class="stat-value text-success">{{ formatThousands(totalActualPay) }}</div>
            </el-col>
            <el-col :span="6" class="stat-item right-align">
              <div class="stat-label">退款金额合计</div>
              <div class="stat-value text-danger">{{ formatThousands(totalRefundAmount) }}</div>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="hover" class="mb15">
      <div class="batch-toolbar">
        <div class="toolbar-left">
          <el-form :model="searchForm" inline size="default" label-width="80px">
            <el-form-item label="支付渠道">
              <el-select v-model="searchForm.pay_channel" placeholder="全部" clearable style="width: 140px">
                <el-option v-for="item in PAYMENT_CHANNEL_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="支付场景">
              <el-select v-model="searchForm.pay_scene" placeholder="全部" clearable style="width: 140px">
                <el-option v-for="item in PAYMENT_SCENE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 140px">
                <el-option v-for="item in PAYMENT_STATUS_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="商户">
              <el-input v-model="searchForm.merchant_name" placeholder="请输入商户" clearable style="width: 160px" />
            </el-form-item>
            <el-form-item label="时间范围">
              <el-date-picker
                v-model="searchForm.timeRange"
                type="datetimerange"
                range-separator="至"
                start-placeholder="开始"
                end-placeholder="结束"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 320px"
              />
            </el-form-item>
            <el-form-item label="最低金额">
              <el-input-number
                v-model="searchForm.min_amount"
                :min="0"
                :step="100"
                :precision="2"
                style="width: 140px"
                controls-position="right"
              />
            </el-form-item>
            <el-form-item label="最高金额">
              <el-input-number
                v-model="searchForm.max_amount"
                :min="0"
                :step="1000"
                :precision="2"
                style="width: 140px"
                controls-position="right"
              />
            </el-form-item>
            <el-form-item>
              <el-button @click="handleReset">重置</el-button>
              <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>

      <div class="batch-actions-row">
        <div class="actions-left-section" v-permission="'business:payment:batch'">
          <el-select
            v-model="selectedOperation"
            placeholder="请选择批量操作"
            style="width: 180px"
          >
            <el-option
              v-for="item in BATCH_OPERATION_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
          <el-tooltip :content="getOperationTip()" placement="top">
            <el-button
              type="danger"
              :icon="Check"
              :loading="batchProcessing"
              :disabled="!selectedOperation || batchSelection.length === 0"
              @click="openBatchDialog"
            >
              确认执行
            </el-button>
          </el-tooltip>
          <el-text type="info" size="small" class="operation-desc">
            已选 {{ batchSelection.length }} 条
            <template v-if="selectedOperation === 'confirm'">（仅处理"待确认"）</template>
            <template v-else-if="selectedOperation === 'retry'">（仅处理"支付失败"）</template>
            <template v-else-if="selectedOperation === 'refund'">（仅处理"支付成功"且≤30天）</template>
            <template v-else-if="selectedOperation === 'close'">（仅处理"待支付/支付中"）</template>
            <template v-else-if="selectedOperation === 'mark_abnormal'">（可处理任意状态）</template>
          </el-text>
        </div>
        <div class="actions-right-section">
          <el-button :icon="Download" type="success" @click="handleExport">导出Excel</el-button>
          <el-button :icon="Refresh" @click="handleRefresh">刷新表格</el-button>
        </div>
      </div>
    </el-card>

    <el-card shadow="hover">
      <el-table
        :data="tableData"
        v-loading="loading"
        stripe
        border
        row-key="id"
        class="batch-table"
        :row-class-name="getRowClassName"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column type="expand">
          <template #default="{ row }">
            <el-descriptions :column="3" border size="small" class="expand-descriptions">
              <el-descriptions-item label="支付流水号">{{ row.payment_no }}</el-descriptions-item>
              <el-descriptions-item label="关联订单号">{{ row.order_no || '-' }}</el-descriptions-item>
              <el-descriptions-item label="请求ID">{{ row.request_id || '-' }}</el-descriptions-item>
              <el-descriptions-item label="付款账号">{{ row.payer_account_no }}</el-descriptions-item>
              <el-descriptions-item label="付款户名">{{ row.payer_account_name || '-' }}</el-descriptions-item>
              <el-descriptions-item label="商户MCC">{{ row.merchant_mcc || '-' }}</el-descriptions-item>
              <el-descriptions-item label="设备ID">{{ row.device_id || '-' }}</el-descriptions-item>
              <el-descriptions-item label="设备指纹">{{ row.device_fingerprint || '-' }}</el-descriptions-item>
              <el-descriptions-item label="IP地址">{{ row.ip_address || '-' }}</el-descriptions-item>
              <el-descriptions-item label="风控分">{{ row.risk_score || '-' }}</el-descriptions-item>
              <el-descriptions-item label="风控标签">{{ row.risk_tags || '-' }}</el-descriptions-item>
              <el-descriptions-item label="需复核">{{ row.need_review ? '是' : '否' }}</el-descriptions-item>
              <el-descriptions-item label="创建时间" :span="3">{{ formatDateTime(row.createdAt) }}</el-descriptions-item>
              <el-descriptions-item label="备注" :span="3">{{ row.remark || '-' }}</el-descriptions-item>
            </el-descriptions>
          </template>
        </el-table-column>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="payment_no" label="支付流水号" width="170" align="center" show-overflow-tooltip />
        <el-table-column prop="order_no" label="订单号" width="150" align="center" show-overflow-tooltip />
        <el-table-column label="付款信息" width="180" align="center">
          <template #default="{ row }">
            <div class="two-line">
              <div class="line1">{{ row.payer_account_no }}</div>
              <div class="line2 text-muted">{{ row.payer_account_name }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="merchant_name" label="商户名" width="140" align="center" show-overflow-tooltip />
        <el-table-column label="渠道" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getChannelTagType(row.pay_channel)" effect="light" size="small">
              {{ row.pay_channel_text }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="pay_scene_text" label="场景" width="100" align="center" />
        <el-table-column label="金额(元)" width="120" align="right">
          <template #default="{ row }">
            <span class="amount-green">{{ formatCurrency(row.amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="手续费(元)" width="90" align="right">
          <template #default="{ row }">
            <span class="text-gray">{{ formatThousands(row.fee) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)" effect="light" size="small">
              {{ row.status_text }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="风控" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getRiskTagType(row.risk_level || 0)" effect="light" size="small">
              {{ row.risk_level_text || '无' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="交易时间" width="170" align="center">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="行内操作" width="240" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 0"
              type="success" link size="small"
              @click="singleConfirm(row)"
              v-permission="'business:payment:batch'"
            >确认</el-button>
            <el-button
              type="warning" link size="small"
              @click="singleMarkAbnormal(row)"
              v-permission="'business:payment:batch'"
            >标异常</el-button>
            <el-button
              type="primary" link size="small"
              @click="goTrace(row)"
            >溯源</el-button>
            <el-button
              type="danger" link size="small"
              @click="singleClose(row)"
              v-if="row.status === 0 || row.status === 1"
              v-permission="'business:payment:batch'"
            >关闭</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pageParams.page"
        v-model:page-size="pageParams.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        class="mt15"
        @current-change="fetchData"
        @size-change="fetchData"
      />
    </el-card>

    <el-dialog
      v-model="showBatchDialog"
      :title="getBatchDialogTitle()"
      width="520px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-alert
        v-if="getOperationDesc()"
        :title="getOperationDesc()"
        type="warning"
        show-icon
        :closable="false"
        class="mb15"
      />
      <el-form :model="batchForm" label-width="100px" ref="batchFormRef" :rules="batchRules">
        <el-form-item label="操作确认">
          <el-input
            v-model="batchForm.confirm_text"
            :placeholder="`请输入【${getOperationLabel()}】确认操作`"
          />
        </el-form-item>
        <el-form-item
          v-if="needReasonField()"
          label="操作原因"
          prop="reason"
        >
          <el-input
            v-model="batchForm.reason"
            type="textarea"
            :rows="3"
            :placeholder="getReasonPlaceholder()"
          />
        </el-form-item>
        <el-form-item label="密码验证">
          <el-input
            v-model="batchForm.password"
            type="password"
            placeholder="请输入运营密码二次确认"
            show-password
          />
        </el-form-item>
        <el-form-item label="操作数量">
          <el-tag type="info" effect="light">共 {{ batchSelection.length }} 条订单</el-tag>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showBatchDialog = false">取消</el-button>
        <el-button
          type="danger"
          :loading="batchProcessing"
          :disabled="batchProcessing || !canSubmitBatch"
          @click="executeBatchOperation"
        >
          {{ batchProcessing ? '执行中...' : '确认执行' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { ElMessage, ElMessageBox, ElNotification, type FormInstance, type FormRules } from 'element-plus'
import { Search, Check, Download, Refresh } from '@element-plus/icons-vue'
import { useRouter, useRoute } from 'vue-router'
import dayjs from 'dayjs'
import {
  PaymentChannel,
  PaymentStatus,
  RiskLevel,
  BatchProcessOperation,
  PAYMENT_CHANNEL_OPTIONS,
  PAYMENT_SCENE_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  RISK_LEVEL_OPTIONS,
  BATCH_OPERATION_OPTIONS,
  type PaymentVO,
  type PaymentQueryParams,
  type BatchProcessRequest,
  type BatchProcessResult,
  getPaymentBatchListApi,
  batchProcessPaymentApi,
  closePaymentApi,
  exportPaymentListApi,
  formatCurrency,
  formatThousands
} from '@api/payment'

const router = useRouter()
const route = useRoute()

const loading = ref(false)
const batchProcessing = ref(false)
const submitDisabled = ref(false)

const shakeErrorIds = ref<Set<string>>(new Set())

const showBatchDialog = ref(false)
const selectedOperation = ref<BatchProcessOperation | ''>('')
const batchFormRef = ref<FormInstance>()

const tableData = ref<PaymentVO[]>([])
const total = ref(0)
const batchSelection = ref<PaymentVO[]>([])

const searchForm = reactive<PaymentQueryParams & { timeRange?: string[] }>({
  page: 1,
  pageSize: 20,
  pay_channel: undefined,
  pay_scene: undefined,
  status: undefined,
  merchant_name: '',
  min_amount: undefined,
  max_amount: undefined,
  timeRange: undefined
})

const pageParams = reactive({
  page: 1,
  pageSize: 20
})

const batchForm = reactive({
  confirm_text: '',
  reason: '',
  password: ''
})

const batchRules: FormRules = {
  reason: [
    {
      validator: (_rule, value, callback) => {
        if (needReasonField() && !value.trim()) {
          callback(new Error('请输入操作原因'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const pendingConfirmCount = computed(() => tableData.value.filter(r => r.status === 0).length)
const pendingReviewCount = computed(() => tableData.value.filter(r => r.need_review && r.status === 0).length)
const successCount = computed(() => tableData.value.filter(r => r.status === 2).length)
const failCount = computed(() => tableData.value.filter(r => r.status === 3).length)
const closedCount = computed(() => tableData.value.filter(r => r.status === 5 || r.status === 6).length)
const abnormalCount = computed(() => tableData.value.filter(r => r.is_risk).length)

const totalAmount = computed(() => tableData.value.reduce((s, r) => s + (r.amount || 0), 0))
const totalFee = computed(() => tableData.value.reduce((s, r) => s + (r.fee || 0), 0))
const totalActualPay = computed(() => tableData.value.reduce((s, r) => s + ((r.actual_amount ?? (r.amount + r.fee)) || 0), 0))
const totalRefundAmount = computed(() => tableData.value.reduce((s, r) => s + (r.refund_amount || 0), 0))

const canSubmitBatch = computed(() => {
  if (!selectedOperation.value) return false
  if (batchForm.confirm_text !== getOperationLabel()) return false
  if (!batchForm.password.trim()) return false
  return true
})

const formatDateTime = (date: string | undefined) => {
  if (!date) return '-'
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

const fetchData = async () => {
  loading.value = true
  try {
    const params: PaymentQueryParams = {
      ...searchForm,
      page: pageParams.page,
      pageSize: pageParams.pageSize
    }
    if (searchForm.timeRange && searchForm.timeRange.length === 2) {
      params.start_time = searchForm.timeRange[0]
      params.end_time = searchForm.timeRange[1]
    }
    if (route.query.filter === 'abnormal') {
      params.is_risk = true
    }
    if (route.query.filter === 'pending_review') {
      params.need_review = true
    }
    const res = await getPaymentBatchListApi(params)
    tableData.value = res.data.list
    total.value = res.data.total
  } catch (e) {
    console.error('Failed to fetch batch list:', e)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pageParams.page = 1
  fetchData()
}

const handleReset = () => {
  searchForm.pay_channel = undefined
  searchForm.pay_scene = undefined
  searchForm.status = undefined
  searchForm.merchant_name = ''
  searchForm.min_amount = undefined
  searchForm.max_amount = undefined
  searchForm.timeRange = undefined
  pageParams.page = 1
  fetchData()
}

const handleRefresh = () => {
  fetchData()
  ElMessage.success('数据已刷新')
}

const handleSelectionChange = (val: PaymentVO[]) => {
  batchSelection.value = val
}

const getRowClassName = ({ row }: { row: PaymentVO }) => {
  if (shakeErrorIds.value.has(row.id)) return 'row-shake'
  if (row.is_risk) return 'row-abnormal'
  return ''
}

const triggerShakeForId = (id: string) => {
  shakeErrorIds.value.add(id)
  setTimeout(() => {
    shakeErrorIds.value.delete(id)
  }, 3000)
}

const getChannelTagType = (channel: PaymentChannel): 'success' | 'warning' | 'primary' | 'info' => {
  switch (channel) {
    case 1: return 'success'
    case 2: return 'warning'
    case 3: return 'primary'
    case 4: return 'info'
    default: return 'info'
  }
}

const getStatusTagType = (status: PaymentStatus | number) => {
  const opt = PAYMENT_STATUS_OPTIONS.find(o => o.value === status)
  return opt?.type || ''
}

const getRiskTagType = (level: RiskLevel | number): 'success' | 'warning' | 'danger' | 'info' => {
  if (level <= 1) return 'success'
  if (level <= 3) return 'warning'
  if (level <= 5) return 'danger'
  return 'info'
}

const getOperationLabel = () => {
  const opt = BATCH_OPERATION_OPTIONS.find(o => o.value === selectedOperation.value)
  return opt?.label || ''
}

const getOperationTip = () => {
  switch (selectedOperation.value) {
    case 'confirm': return '批量确认选中的待支付订单'
    case 'mark_abnormal': return '将选中订单标记为异常状态'
    case 'retry': return '重试选中的失败订单'
    case 'refund': return '批量退款选中的成功订单（≤30天）'
    case 'close': return '关闭选中的待处理订单'
    default: return '请先选择批量操作'
  }
}

const getOperationDesc = () => {
  switch (selectedOperation.value) {
    case 'confirm': return '确认后订单将进入支付流程，此操作不可撤销！'
    case 'mark_abnormal': return '标记异常后订单将触发风控复核，请谨慎操作！'
    case 'retry': return '重试支付将重新调用支付渠道接口，可能产生实际扣款！'
    case 'refund': return '退款操作不可逆，资金将原路返回付款账户！'
    case 'close': return '关闭后订单无法继续支付，请确认用户已取消！'
    default: return ''
  }
}

const getBatchDialogTitle = () => {
  return `${getOperationLabel()} - 批量操作`
}

const needReasonField = () => {
  return ['mark_abnormal', 'refund', 'close'].includes(selectedOperation.value as string)
}

const getReasonPlaceholder = () => {
  switch (selectedOperation.value) {
    case 'mark_abnormal': return '请输入标记异常的原因，例如：用户投诉、可疑交易等'
    case 'refund': return '请输入退款原因，例如：用户申请退款、重复扣款等'
    case 'close': return '请输入关闭原因，例如：用户取消、超时未支付等'
    default: return '请输入操作原因'
  }
}

const openBatchDialog = () => {
  if (!selectedOperation.value) {
    ElMessage.warning('请先选择批量操作')
    return
  }
  if (batchSelection.value.length === 0) {
    ElMessage.warning('请先选择要操作的订单')
    return
  }
  batchForm.confirm_text = ''
  batchForm.reason = ''
  batchForm.password = ''
  showBatchDialog.value = true
}

const executeBatchOperation = async () => {
  if (batchFormRef.value) {
    const valid = await batchFormRef.value.validate().catch(() => false)
    if (!valid) return
  }
  if (!canSubmitBatch.value) return

  try {
    await ElMessageBox.confirm(
      `确认对 ${batchSelection.value.length} 条订单执行【${getOperationLabel()}】操作？`,
      '二次确认',
      { confirmButtonText: '确认执行', cancelButtonText: '取消', type: 'warning' }
    )
  } catch {
    return
  }

  batchProcessing.value = true
  submitDisabled.value = true

  try {
    const req: BatchProcessRequest = {
      payment_ids: batchSelection.value.map(r => r.id),
      operation: selectedOperation.value as BatchProcessOperation,
      reason: needReasonField() ? batchForm.reason : undefined
    }
    const res: { data: BatchProcessResult } = await batchProcessPaymentApi(req)

    const result = res.data

    result.details.forEach(d => {
      if (!d.success) {
        triggerShakeForId(d.id)
      }
    })

    updateRowsLocal(result)

    setTimeout(() => {
      submitDisabled.value = false
    }, 300)

    ElNotification.success({
      title: '批量操作完成',
      message: `成功 ${result.success_count} 条，失败 ${result.fail_count} 条`,
      duration: 5000
    })

    if (result.fail_count > 0) {
      const failDetails = result.details.filter(d => !d.success).slice(0, 5).map(
        d => `ID:${d.id.slice(-6)} - ${d.error_message || '未知错误'}`
      ).join('\n')
      ElNotification.warning({
        title: '失败订单详情（前5条）',
        message: failDetails + (result.fail_count > 5 ? `\n...共${result.fail_count}条失败` : ''),
        duration: 6000
      })
    }

    showBatchDialog.value = false
  } catch (e: any) {
    console.error('Batch operation failed:', e)
    ElMessage.error(e?.message || '批量操作失败')
  } finally {
    batchProcessing.value = false
  }
}

const updateRowsLocal = (result: BatchProcessResult) => {
  const idToDetail = new Map(result.details.map(d => [d.id, d]))
  const operation = selectedOperation.value

  tableData.value = tableData.value.map(row => {
    const detail = idToDetail.get(row.id)
    if (!detail || !detail.success) return row

    const updated = { ...row }
    switch (operation) {
      case 'confirm':
        updated.status = 1
        updated.status_text = PAYMENT_STATUS_OPTIONS.find(o => o.value === 1)?.label || '支付中'
        break
      case 'mark_abnormal':
        updated.is_risk = true
        updated.risk_level = Math.max(updated.risk_level || 0, 4) as RiskLevel
        updated.risk_level_text = RISK_LEVEL_OPTIONS.find(o => o.value === 4)?.label || '中高风险'
        break
      case 'retry':
        updated.status = 1
        updated.status_text = PAYMENT_STATUS_OPTIONS.find(o => o.value === 1)?.label || '支付中'
        updated.retry_count = (updated.retry_count || 0) + 1
        break
      case 'refund':
        updated.status = 4
        updated.status_text = PAYMENT_STATUS_OPTIONS.find(o => o.value === 4)?.label || '已退款'
        updated.refund_amount = updated.amount
        updated.refund_time = dayjs().format('YYYY-MM-DD HH:mm:ss')
        break
      case 'close':
        updated.status = 5
        updated.status_text = PAYMENT_STATUS_OPTIONS.find(o => o.value === 5)?.label || '已关闭'
        updated.close_time = dayjs().format('YYYY-MM-DD HH:mm:ss')
        break
    }
    return updated
  })
}

const singleConfirm = async (row: PaymentVO) => {
  try {
    await ElMessageBox.confirm(
      `确认支付订单 ${row.payment_no}？`,
      '确认',
      { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' }
    )
    const res: { data: BatchProcessResult } = await batchProcessPaymentApi({
      payment_ids: [row.id],
      operation: 'confirm'
    })
    if (res.data.success_count > 0) {
      updateRowsLocal(res.data)
      ElMessage.success('确认成功')
    } else {
      triggerShakeForId(row.id)
      ElMessage.error(res.data.details[0]?.error_message || '确认失败')
    }
  } catch (e) {
    console.error(e)
  }
}

const singleMarkAbnormal = async (row: PaymentVO) => {
  try {
    const { value: reason } = await ElMessageBox.prompt(
      '请输入标记异常原因：',
      '标记异常',
      { confirmButtonText: '确认', cancelButtonText: '取消', inputPattern: /.+/, inputErrorMessage: '请输入原因' }
    )
    const res: { data: BatchProcessResult } = await batchProcessPaymentApi({
      payment_ids: [row.id],
      operation: 'mark_abnormal',
      reason
    })
    if (res.data.success_count > 0) {
      updateRowsLocal(res.data)
      ElMessage.success('已标记异常')
    } else {
      triggerShakeForId(row.id)
      ElMessage.error(res.data.details[0]?.error_message || '操作失败')
    }
  } catch (e) {
    console.error(e)
  }
}

const singleClose = async (row: PaymentVO) => {
  try {
    const { value: reason } = await ElMessageBox.prompt(
      '请输入关闭原因：',
      '关闭订单',
      { confirmButtonText: '确认关闭', cancelButtonText: '取消', inputPattern: /.+/, inputErrorMessage: '请输入原因' }
    )
    await closePaymentApi(row.id, reason)
    const idx = tableData.value.findIndex(r => r.id === row.id)
    if (idx >= 0) {
      tableData.value[idx] = {
        ...tableData.value[idx],
        status: 5,
        status_text: '已关闭',
        close_reason: reason,
        close_time: dayjs().format('YYYY-MM-DD HH:mm:ss')
      }
    }
    ElMessage.success('订单已关闭')
  } catch (e: any) {
    triggerShakeForId(row.id)
    console.error(e)
  }
}

const goTrace = (row: PaymentVO) => {
  router.push({
    path: '/business/payment/trace',
    query: { payment_no: row.payment_no }
  })
}

const handleExport = async () => {
  try {
    ElMessage.info('正在生成Excel文件，请稍候...')
    const params: PaymentQueryParams = { ...searchForm }
    if (searchForm.timeRange && searchForm.timeRange.length === 2) {
      params.start_time = searchForm.timeRange[0]
      params.end_time = searchForm.timeRange[1]
    }
    const blob = await exportPaymentListApi(params)
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `批量订单_${dayjs().format('YYYYMMDDHHmmss')}.xlsx`
    link.click()
    window.URL.revokeObjectURL(url)
    ElNotification.success({ title: '导出成功', message: 'Excel文件已下载' })
  } catch (e) {
    console.error('Failed to export:', e)
  }
}

watch(
  () => route.query,
  (q) => {
    if (q.payment_no) {
      searchForm.payment_no = q.payment_no as string
    }
    fetchData()
  },
  { immediate: false }
)

onMounted(() => {
  if (route.query.payment_no) {
    searchForm.payment_no = route.query.payment_no as string
  }
  fetchData()
})

onBeforeUnmount(() => {
})
</script>

<style scoped>
@keyframes shakeRow {
  0%, 100% { transform: translateX(0); background-color: transparent; }
  25% { transform: translateX(-4px); background-color: #fef0f0; }
  50% { transform: translateX(4px); background-color: #fef0f0; }
  75% { transform: translateX(-2px); background-color: #fef0f0; }
}

.batch-table :deep(.el-table__row.row-shake) {
  animation: shakeRow 500ms ease-in-out 3;
  border: 2px solid #f56c6c;
}

.batch-table :deep(.el-table__row.row-abnormal) {
  background-color: #fff7e6;
}

.batch-table :deep(.el-table__row.row-abnormal:hover > td) {
  background-color: #fff1d6 !important;
}

.batch-table :deep(.el-table__row:hover) {
  transform: scale(1.002);
  transition: transform 0.15s ease;
}

.stat-card {
  height: 100%;
}

.stat-item {
  text-align: center;
  padding: 10px 5px;
}

.stat-item.right-align {
  text-align: right;
}

.stat-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 22px;
  font-weight: 600;
}

.text-primary { color: #409eff; }
.text-success { color: #67c23a; }
.text-warning { color: #e6a23c; }
.text-danger { color: #f56c6c; }
.text-info { color: #909399; }
.text-muted { color: #c0c4cc; }

.card-title {
  font-weight: 600;
}

.mb15 { margin-bottom: 15px; }
.mt15 { margin-top: 15px; }

.batch-toolbar {
  margin-bottom: 10px;
}

.batch-actions-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  padding-top: 12px;
  border-top: 1px dashed #ebeef5;
  margin-top: 10px;
}

.actions-left-section {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.actions-right-section {
  display: flex;
  gap: 10px;
}

.operation-desc {
  margin-left: 5px;
}

.two-line {
  text-align: left;
  line-height: 1.4;
}
.two-line .line1 { font-size: 13px; color: #303133; }
.two-line .line2 { font-size: 12px; margin-top: 2px; }

.amount-green {
  color: #67c23a;
  font-weight: bold;
}

.text-gray {
  color: #909399;
}

.expand-descriptions {
  margin: 5px 15px;
}
</style>
