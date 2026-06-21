<template>
  <div class="ccb-business-online-payment-trace">
    <CcbPageHeader
      title="支付溯源"
      description="通过支付单号溯源全流程、自动检测异常交易、风控预警分析"
      icon="Search"
    />

    <el-card shadow="hover" class="mb15">
      <template #header>
        <span class="card-title">溯源条件</span>
      </template>
      <el-form :model="traceForm" inline>
        <el-form-item label="支付单号">
          <el-input
            v-model="traceForm.payment_no"
            placeholder="请输入支付单号"
            clearable
            style="width: 260px"
          />
        </el-form-item>
        <el-form-item label="商户号">
          <el-input
            v-model="traceForm.merchant_no"
            placeholder="请输入商户号"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="设备ID">
          <el-input
            v-model="traceForm.device_id"
            placeholder="请输入设备ID"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="IP地址">
          <el-input
            v-model="traceForm.payer_ip"
            placeholder="请输入IP地址"
            clearable
            style="width: 180px"
          />
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="dateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 320px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" :loading="loading" @click="handleTrace">
            溯源查询
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <template v-if="traceResult">
      <el-row :gutter="20" class="mb15">
        <el-col :span="8">
          <el-card shadow="hover" :class="getRiskCardClass(overallRiskLevel)">
            <template #header>
              <div class="card-header-flex">
                <span class="card-title">风险总览</span>
                <el-tag :type="getRiskTagType(overallRiskLevel)" effect="light">
                  {{ getRiskLevelLabel(overallRiskLevel) }}
                </el-tag>
              </div>
            </template>
            <div class="risk-overview-content">
              <div class="risk-score">
                <el-progress
                  type="dashboard"
                  :percentage="overallRiskScore"
                  :color="getRiskScoreColor(overallRiskScore)"
                  :width="120"
                />
              </div>
              <div class="risk-detail-list">
                <div class="risk-detail-item">
                  <span class="risk-detail-label">风险预警数：</span>
                  <el-tag type="danger" effect="light" size="small">
                    {{ traceResult.risk_warnings?.length || 0 }} 项
                  </el-tag>
                </div>
                <div class="risk-detail-item">
                  <span class="risk-detail-label">异常交易数：</span>
                  <el-tag :type="traceResult.abnormal_transaction_check?.has_risk ? 'danger' : 'success'" effect="light" size="small">
                    {{ traceResult.abnormal_transaction_check?.abnormal_count || 0 }} 笔
                  </el-tag>
                </div>
                <div class="risk-detail-item">
                  <span class="risk-detail-label">校验是否通过：</span>
                  <el-tag :type="traceResult.validation_passed ? 'success' : 'danger'" effect="light" size="small">
                    {{ traceResult.validation_passed ? '通过' : '不通过' }}
                  </el-tag>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card shadow="hover" class="stat-card">
            <template #header>
              <span class="card-title">交易统计</span>
            </template>
            <el-row :gutter="10">
              <el-col :span="12" class="stat-item">
                <div class="stat-label">总笔数</div>
                <div class="stat-value text-primary">{{ traceResult.total_count }}</div>
              </el-col>
              <el-col :span="12" class="stat-item">
                <div class="stat-label">总金额</div>
                <div class="stat-value text-success">{{ formatCurrency(traceResult.total_amount) }}</div>
              </el-col>
              <el-col :span="12" class="stat-item">
                <div class="stat-label">总手续费</div>
                <div class="stat-value text-warning">{{ formatCurrency(traceResult.total_fee) }}</div>
              </el-col>
              <el-col :span="12" class="stat-item">
                <div class="stat-label">异常笔数</div>
                <div class="stat-value text-danger">{{ traceResult.abnormal_transaction_check?.abnormal_count || 0 }}</div>
              </el-col>
            </el-row>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card shadow="hover" class="stat-card">
            <template #header>
              <div class="card-header-flex">
                <span class="card-title">防篡改校验</span>
                <el-tag :type="traceResult.tamper_proof_check?.is_secure ? 'success' : 'danger'" effect="light">
                  {{ traceResult.tamper_proof_check?.is_secure ? '安全' : '异常' }}
                </el-tag>
              </div>
            </template>
            <div class="tamper-content">
              <div class="progress-wrapper">
                <el-progress
                  type="dashboard"
                  :percentage="traceResult.tamper_proof_check?.security_score || 0"
                  :color="getConsistencyColor(traceResult.tamper_proof_check?.security_score || 0)"
                  :width="120"
                />
                <div class="progress-label">一致性评分</div>
              </div>
              <div class="tamper-details">
                <div class="tamper-item">
                  <span class="tamper-label">签名有效性：</span>
                  <el-tag :type="traceResult.tamper_proof_check?.signature_valid ? 'success' : 'danger'" effect="light" size="small">
                    {{ traceResult.tamper_proof_check?.signature_valid ? '有效' : '无效' }}
                  </el-tag>
                </div>
                <div class="tamper-item">
                  <span class="tamper-label">数据完整性：</span>
                  <el-tag :type="traceResult.tamper_proof_check?.data_integrity_valid ? 'success' : 'danger'" effect="light" size="small">
                    {{ traceResult.tamper_proof_check?.data_integrity_valid ? '完整' : '缺失' }}
                  </el-tag>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" class="mb15">
        <el-col :span="12">
          <el-card shadow="hover">
            <template #header>
              <span class="card-title">设备信息</span>
            </template>
            <el-descriptions :column="2" border size="small">
              <el-descriptions-item label="设备ID">
                {{ maskDeviceId(traceResult.device_check?.device_id || '-') }}
              </el-descriptions-item>
              <el-descriptions-item label="设备类型">
                {{ getDeviceTypeLabel(traceResult.device_check?.device_type) }}
              </el-descriptions-item>
              <el-descriptions-item label="是否授信">
                <el-tag :type="traceResult.device_check?.has_risk ? 'danger' : 'success'" effect="light" size="small">
                  {{ traceResult.device_check?.has_risk ? '未授信' : '已授信' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="绑定商户数">
                {{ traceResult.device_check?.bind_merchant_count || 0 }} 个
              </el-descriptions-item>
              <el-descriptions-item label="绑定时间" :span="2">
                {{ traceResult.device_check?.bind_time || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="异常交易数" :span="2">
                <el-tag type="danger" effect="light" size="small">
                  {{ traceResult.device_check?.abnormal_transaction_count || 0 }} 笔
                </el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card shadow="hover">
            <template #header>
              <span class="card-title">IP与位置信息</span>
            </template>
            <el-descriptions :column="2" border size="small">
              <el-descriptions-item label="IP地址">
                {{ maskIpAddress(traceResult.query_params?.payer_ip || '-') }}
              </el-descriptions-item>
              <el-descriptions-item label="是否异地">
                <el-tag :type="isAbnormalLocation ? 'danger' : 'success'" effect="light" size="small">
                  {{ isAbnormalLocation ? '异地' : '本地' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="异常类型" :span="2">
                <template v-if="traceResult.abnormal_transaction_check?.abnormal_types?.length">
                  <el-tag
                    v-for="(type, idx) in traceResult.abnormal_transaction_check.abnormal_types"
                    :key="idx"
                    type="warning"
                    effect="plain"
                    size="small"
                    style="margin-right: 4px;"
                  >
                    {{ type }}
                  </el-tag>
                </template>
                <el-tag v-else type="success" effect="plain" size="small">无异常</el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-col>
      </el-row>

      <el-card
        shadow="hover"
        v-if="traceResult.device_check?.has_risk"
        class="mb15 card-error"
      >
        <template #header>
          <div class="card-header-flex">
            <span class="card-title">异地陌生设备高频检测</span>
            <el-tag type="danger" effect="light">
              检测到风险
            </el-tag>
          </div>
        </template>
        <el-alert
          title="检测到异地陌生设备高频支付行为，请谨慎处理"
          type="error"
          show-icon
          :closable="false"
          class="mb10"
        />
        <el-table :data="traceResult.device_check?.recent_transactions || []" border size="small">
          <el-table-column prop="payment_no" label="支付单号" width="200" />
          <el-table-column prop="amount" label="支付金额" width="130" align="right">
            <template #default="{ row }">
              <span class="amount-positive">{{ formatCurrency(row.amount) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="create_time" label="交易时间" width="160" />
          <el-table-column label="是否异常" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.is_abnormal ? 'danger' : 'success'" effect="light" size="small">
                {{ row.is_abnormal ? '异常' : '正常' }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <el-card
        shadow="hover"
        v-if="traceResult.merchant_check?.has_risk"
        class="mb15 card-warning"
      >
        <template #header>
          <div class="card-header-flex">
            <span class="card-title">虚假商户检测</span>
            <el-tag type="warning" effect="light">
              商户资质存疑
            </el-tag>
          </div>
        </template>
        <el-alert
          title="检测到商户存在异常交易行为，请核实商户资质"
          type="warning"
          show-icon
          :closable="false"
          class="mb10"
        />
        <el-descriptions :column="2" border size="small" class="mb10">
          <el-descriptions-item label="商户号">{{ traceResult.merchant_check?.merchant_no }}</el-descriptions-item>
          <el-descriptions-item label="商户名称">{{ traceResult.merchant_check?.merchant_name }}</el-descriptions-item>
          <el-descriptions-item label="商户状态">
            <el-tag :type="traceResult.merchant_check?.merchant_status === 1 ? 'success' : 'danger'" effect="light" size="small">
              {{ traceResult.merchant_check?.merchant_status === 1 ? '正常' : '异常' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="异常交易数">
            <el-tag type="danger" effect="light" size="small">
              {{ traceResult.merchant_check?.abnormal_count || 0 }} 笔
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="异常金额" :span="2">
            <span class="amount-danger">{{ formatCurrency(traceResult.merchant_check?.abnormal_amount || 0) }} 元</span>
          </el-descriptions-item>
        </el-descriptions>
        <div class="section-title">近期交易记录：</div>
        <el-table :data="traceResult.merchant_check?.recent_transactions || []" border size="small">
          <el-table-column prop="payment_no" label="支付单号" width="200" />
          <el-table-column prop="amount" label="支付金额" width="130" align="right">
            <template #default="{ row }">
              <span class="amount-positive">{{ formatCurrency(row.amount) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="create_time" label="交易时间" width="160" />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)" effect="light" size="small">
                {{ getStatusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <el-card
        shadow="hover"
        v-if="hasDuplicateOrders"
        class="mb15 card-warning"
      >
        <template #header>
          <div class="card-header-flex">
            <span class="card-title">重复下单检测</span>
            <el-tag type="warning" effect="light">
              疑似重复
            </el-tag>
          </div>
        </template>
        <el-alert
          title="检测到疑似重复下单，请确认是否为同一笔交易"
          type="warning"
          show-icon
          :closable="false"
          class="mb10"
        />
        <el-table :data="duplicateOrders" border size="small">
          <el-table-column prop="payment_no" label="支付单号" width="200" />
          <el-table-column prop="merchant_name" label="商户名称" width="140" show-overflow-tooltip />
          <el-table-column prop="amount" label="支付金额" width="130" align="right">
            <template #default="{ row }">
              <span class="amount-positive">{{ formatCurrency(row.amount) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="payer_account_no" label="付款账号" width="160" />
          <el-table-column prop="createdAt" label="创建时间" width="160" />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)" effect="light" size="small">
                {{ getStatusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <el-card shadow="hover" v-if="traceResult.risk_warnings && traceResult.risk_warnings.length > 0" class="mb15">
        <template #header>
          <div class="card-header-flex">
            <span class="card-title">风控检测结果</span>
            <el-badge :value="traceResult.risk_warnings.length" class="item">
              <el-tag type="danger" effect="light">风险预警</el-tag>
            </el-badge>
          </div>
        </template>
        <el-row :gutter="20">
          <el-col
            v-for="(warning, idx) in traceResult.risk_warnings"
            :key="idx"
            :span="12"
            class="mb15"
          >
            <el-card shadow="hover" :class="getRiskCardClass(warning.risk_level)">
              <template #header>
                <div class="card-header-flex">
                  <div>
                    <span class="card-title">{{ warning.risk_type }}</span>
                  </div>
                  <el-tag :type="getRiskTagType(warning.risk_level)" effect="dark">
                    {{ getRiskLevelLabel(warning.risk_level) }}
                  </el-tag>
                </div>
              </template>
              <div class="risk-warning-content">
                <p class="risk-desc">{{ warning.description }}</p>
                <div class="related-payments">
                  <span class="related-label">关联支付单号：</span>
                  <div class="payment-tags">
                    <el-tag
                      v-for="(no, nIdx) in warning.related_payment_nos"
                      :key="nIdx"
                      type="info"
                      effect="plain"
                      size="small"
                      class="payment-tag"
                    >
                      {{ no }}
                    </el-tag>
                  </div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-card>

      <el-card shadow="hover">
        <template #header>
          <div class="card-header-flex">
            <span class="card-title">溯源时间线</span>
          </div>
        </template>
        <el-timeline>
          <el-timeline-item
            v-for="(item, idx) in timelineData"
            :key="idx"
            :timestamp="item.time"
            :type="item.type"
            placement="top"
          >
            <el-card shadow="hover" size="small">
              <h4>{{ item.title }}</h4>
              <p>{{ item.description }}</p>
              <p v-if="item.detail" class="timeline-detail">{{ item.detail }}</p>
            </el-card>
          </el-timeline-item>
        </el-timeline>
      </el-card>
    </template>

    <CcbEmpty v-else description="请输入查询条件进行溯源查询" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { useRoute } from 'vue-router'
import {
  PAYMENT_STATUS_OPTIONS,
  DEVICE_TYPE_OPTIONS,
  RISK_LEVEL_OPTIONS,
  type PaymentStatus,
  type RiskLevel,
  type DeviceType,
  type OnlinePaymentVO,
  type OnlinePaymentTraceResult,
  traceOnlinePaymentApi,
  formatCurrency,
  maskIpAddress,
  maskDeviceId
} from '@api/online-payment'

const route = useRoute()

const loading = ref(false)
const traceResult = ref<OnlinePaymentTraceResult | null>(null)
const dateRange = ref<string[]>([])

const traceForm = reactive({
  payment_no: '',
  merchant_no: '',
  device_id: '',
  payer_ip: ''
})

const overallRiskLevel = computed((): RiskLevel => {
  if (!traceResult.value?.risk_warnings?.length) return 0
  const maxLevel = traceResult.value.risk_warnings.reduce(
    (max, w) => Math.max(max, w.risk_level as number),
    0
  )
  return maxLevel as RiskLevel
})

const overallRiskScore = computed(() => {
  if (!traceResult.value?.risk_warnings?.length) return 10
  const level = overallRiskLevel.value as number
  return Math.min(100, level * 20)
})

const isAbnormalLocation = computed(() => {
  if (!traceResult.value?.abnormal_transaction_check) return false
  return traceResult.value.abnormal_transaction_check.abnormal_types?.some(
    t => t.includes('异地') || t.includes('位置') || t.includes('location')
  ) || false
})

const hasDuplicateOrders = computed(() => {
  if (!traceResult.value?.records || traceResult.value.records.length < 2) return false
  const records = traceResult.value.records
  const firstAmount = records[0].amount
  const firstPayer = records[0].payer_account_no
  return records.some((r, i) =>
    i > 0 && r.amount === firstAmount && r.payer_account_no === firstPayer && r.payer_account_no
  )
})

const duplicateOrders = computed(() => {
  if (!traceResult.value?.records) return []
  return traceResult.value.records.slice(0, 5)
})

const timelineData = computed(() => {
  if (!traceResult.value?.records || traceResult.value.records.length === 0) {
    return []
  }
  const record = traceResult.value.records[0]
  const timeline: Array<{
    time: string
    title: string
    description: string
    detail?: string
    type: string
  }> = []

  timeline.push({
    time: record.createdAt || '-',
    title: '订单创建',
    description: '支付订单创建成功',
    detail: `支付单号：${record.payment_no}`,
    type: 'primary'
  })

  if (record.pay_time) {
    timeline.push({
      time: record.pay_time,
      title: '支付处理中',
      description: '支付请求已提交，等待支付渠道处理',
      type: 'warning'
    })
  }

  if (record.success_time) {
    timeline.push({
      time: record.success_time,
      title: '支付成功',
      description: '支付渠道返回成功',
      detail: `支付金额：${formatCurrency(record.amount)} 元`,
      type: 'success'
    })
  }

  if (record.status === 3) {
    timeline.push({
      time: record.pay_time || record.createdAt || '-',
      title: '支付失败',
      description: '支付渠道返回失败',
      type: 'danger'
    })
  }

  if (record.close_time) {
    timeline.push({
      time: record.close_time,
      title: '订单关闭',
      description: `关闭原因：${record.close_reason || '用户主动关闭'}`,
      type: 'info'
    })
  }

  if (record.refund_time) {
    timeline.push({
      time: record.refund_time,
      title: '已退款',
      description: `退款金额：${formatCurrency(record.refund_amount || 0)} 元`,
      type: 'warning'
    })
  }

  return timeline.sort((a, b) => {
    if (a.time === '-') return 1
    if (b.time === '-') return -1
    return new Date(a.time).getTime() - new Date(b.time).getTime()
  })
})

const handleTrace = async () => {
  if (!traceForm.payment_no && !traceForm.merchant_no && !traceForm.device_id && !traceForm.payer_ip && dateRange.value.length === 0) {
    ElMessage.warning('请至少输入一项查询条件')
    return
  }

  const params: {
    payment_no?: string
    merchant_no?: string
    device_id?: string
    payer_ip?: string
    start_time?: string
    end_time?: string
  } = {
    payment_no: traceForm.payment_no || undefined,
    merchant_no: traceForm.merchant_no || undefined,
    device_id: traceForm.device_id || undefined,
    payer_ip: traceForm.payer_ip || undefined
  }

  if (dateRange.value.length === 2) {
    params.start_time = dateRange.value[0]
    params.end_time = dateRange.value[1]
  }

  loading.value = true
  try {
    const res = await traceOnlinePaymentApi(params)
    traceResult.value = res.data
    ElMessage.success(
      `溯源查询完成，共 ${res.data.total_count} 条记录`
    )
  } catch (e) {
    console.error('Failed to trace online payment:', e)
  } finally {
    loading.value = false
  }
}

const handleReset = () => {
  traceForm.payment_no = ''
  traceForm.merchant_no = ''
  traceForm.device_id = ''
  traceForm.payer_ip = ''
  dateRange.value = []
  traceResult.value = null
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

const getRiskCardClass = (level: RiskLevel | number) => {
  if (level <= 1) return ''
  if (level <= 3) return 'card-warning'
  return 'card-error'
}

const getRiskScoreColor = (score: number) => {
  if (score <= 30) return '#67c23a'
  if (score <= 70) return '#e6a23c'
  return '#f56c6c'
}

const getConsistencyColor = (score: number) => {
  if (score >= 80) return '#67c23a'
  if (score >= 60) return '#e6a23c'
  return '#f56c6c'
}

const getDeviceTypeLabel = (type: DeviceType | number | undefined) => {
  if (!type) return '-'
  const opt = DEVICE_TYPE_OPTIONS.find(o => o.value === type)
  return opt?.label || '未知'
}

onMounted(() => {
  const paymentNo = route.query.payment_no as string
  if (paymentNo) {
    traceForm.payment_no = paymentNo
    handleTrace()
  }
})
</script>

<style scoped>
.amount-positive {
  color: #67c23a;
  font-weight: 600;
}

.amount-danger {
  color: #f56c6c;
  font-weight: 600;
}

.stat-card {
  height: 100%;
}

.stat-item {
  text-align: center;
  padding: 10px 0;
}

.stat-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 6px;
}

.stat-value {
  font-size: 20px;
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

.card-error {
  border-color: #f56c6c !important;
}

.card-error :deep(.el-card__header) {
  border-bottom-color: #f56c6c !important;
  background-color: #fef0f0;
}

.card-warning {
  border-color: #e6a23c !important;
}

.card-warning :deep(.el-card__header) {
  border-bottom-color: #e6a23c !important;
  background-color: #fdf6ec;
}

.card-title {
  font-weight: 600;
}

.card-header-flex {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mb15 {
  margin-bottom: 15px;
}

.mb10 {
  margin-bottom: 10px;
}

.risk-overview-content {
  display: flex;
  align-items: flex-start;
  padding: 10px 0;
}

.risk-score {
  flex-shrink: 0;
  margin-right: 30px;
}

.risk-detail-list {
  flex: 1;
  padding-top: 10px;
}

.risk-detail-item {
  display: flex;
  align-items: center;
  padding: 6px 0;
}

.risk-detail-label {
  width: 90px;
  color: #606266;
  font-size: 13px;
}

.tamper-content {
  display: flex;
  align-items: flex-start;
  padding: 10px 0;
}

.progress-wrapper {
  flex-shrink: 0;
  text-align: center;
  margin-right: 30px;
}

.progress-label {
  margin-top: 8px;
  color: #606266;
  font-size: 13px;
  font-weight: 500;
}

.tamper-details {
  flex: 1;
  padding-top: 10px;
}

.tamper-item {
  display: flex;
  align-items: center;
  padding: 6px 0;
}

.tamper-label {
  width: 90px;
  color: #606266;
  font-size: 13px;
}

.section-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin: 10px 0;
}

.risk-warning-content {
  padding: 5px 0;
}

.risk-desc {
  margin: 0 0 12px 0;
  color: #303133;
  font-size: 14px;
  line-height: 1.6;
}

.related-payments {
  margin-top: 8px;
}

.related-label {
  display: block;
  color: #909399;
  font-size: 12px;
  margin-bottom: 6px;
}

.payment-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.payment-tag {
  cursor: pointer;
}

.timeline-detail {
  color: #909399;
  font-size: 13px;
  margin: 5px 0 0 0;
}

:deep(.el-timeline-item__timestamp) {
  color: #909399;
  font-size: 12px;
}
</style>
