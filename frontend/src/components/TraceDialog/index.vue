<template>
  <el-dialog
    :model-value="modelValue"
    title="全链路溯源"
    width="800px"
    class="trace-dialog"
    @update:model-value="handleVisibleChange"
  >
    <div class="trace-search">
      <el-input
        v-model="searchOrderNo"
        placeholder="请输入订单号查询溯源"
        clearable
        style="width: 300px"
        @keyup.enter="handleSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-button type="primary" @click="handleSearch">查询</el-button>
    </div>
    <el-alert
      v-if="traceData?.isRepeated"
      :title="`您已在1小时内查询过该订单，这是第${traceData.repeatCount}次查询`"
      type="warning"
      :closable="false"
      class="mb-16"
    />
    <el-tabs v-if="traceData" v-model="activeTab">
      <el-tab-pane label="订单信息" name="order">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="订单号">
            {{ traceData.order.orderNo }}
          </el-descriptions-item>
          <el-descriptions-item label="订单状态">
            <StatusTag
              :status="traceData.order.status"
              :status-map="OrderStatusMap"
              :color-map="OrderStatusColorMap"
            />
          </el-descriptions-item>
          <el-descriptions-item label="服务类型">
            {{ ServiceTypeMap[traceData.order.capacityType] || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="订单来源">
            {{ OrderSourceMap[traceData.order.orderSource || 0] || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="起点地址" :span="2">
            {{ traceData.order.startAddress }}
          </el-descriptions-item>
          <el-descriptions-item label="终点地址" :span="2">
            {{ traceData.order.endAddress }}
          </el-descriptions-item>
          <el-descriptions-item label="里程">
            {{ traceData.order.distance }}公里
          </el-descriptions-item>
          <el-descriptions-item label="预计时长">
            {{ traceData.order.duration }}分钟
          </el-descriptions-item>
          <el-descriptions-item label="预估费用">
            ¥{{ traceData.order.estimatedPrice }}
          </el-descriptions-item>
          <el-descriptions-item label="实际费用">
            ¥{{ traceData.order.actualPrice || 0 }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ formatDate(traceData.order.createTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="完成时间">
            {{ traceData.order.completeTime ? formatDate(traceData.order.completeTime) : '-' }}
          </el-descriptions-item>
        </el-descriptions>
      </el-tab-pane>
      <el-tab-pane label="乘客信息" name="passenger">
        <el-descriptions :column="2" border v-if="traceData.passenger">
          <el-descriptions-item label="乘客姓名">
            {{ traceData.passenger.name || traceData.passenger.passengerName || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="联系电话">
            {{ formatPhone(traceData.passenger.phone || traceData.passenger.passengerPhone || '') }}
          </el-descriptions-item>
          <el-descriptions-item label="总订单数">
            {{ traceData.passenger.totalOrders || 0 }}
          </el-descriptions-item>
          <el-descriptions-item label="总消费">
            ¥{{ traceData.passenger.totalConsume || 0 }}
          </el-descriptions-item>
        </el-descriptions>
        <el-empty v-else description="暂无乘客信息" />
      </el-tab-pane>
      <el-tab-pane label="司机信息" name="driver">
        <el-descriptions :column="2" border v-if="traceData.driver">
          <el-descriptions-item label="司机姓名">
            {{ traceData.driver.name || traceData.driver.driverName || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="联系电话">
            {{ formatPhone(traceData.driver.phone || traceData.driver.driverPhone || '') }}
          </el-descriptions-item>
          <el-descriptions-item label="评分">
            <el-rate
              :model-value="traceData.driver.rating || 0"
              disabled
              show-score
              text-color="#ff9900"
              score-template="{value}"
            />
          </el-descriptions-item>
          <el-descriptions-item label="车牌号">
            {{ traceData.vehicle?.plate || traceData.driver.vehiclePlate || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="车辆型号" :span="2">
            {{ traceData.vehicle?.model || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="车辆颜色">
            {{ traceData.vehicle?.color || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="座位数">
            {{ traceData.vehicle?.seats || '-' }}座
          </el-descriptions-item>
        </el-descriptions>
        <el-empty v-else description="暂无司机信息" />
      </el-tab-pane>
      <el-tab-pane label="支付记录" name="payment">
        <el-table :data="traceData.statements || []" border>
          <el-table-column prop="id" label="流水号" width="180" />
          <el-table-column prop="type" label="类型" width="100">
            <template #default="{ row }">
              {{ row.type === 1 ? '支付' : row.type === 2 ? '退款' : '其他' }}
            </template>
          </el-table-column>
          <el-table-column prop="amount" label="金额" width="100">
            <template #default="{ row }">¥{{ row.amount }}</template>
          </el-table-column>
          <el-table-column prop="payMethod" label="支付方式" width="120">
            <template #default="{ row }">
              {{ row.payMethod === 1 ? '微信' : row.payMethod === 2 ? '支付宝' : '其他' }}
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
                {{ row.status === 1 ? '成功' : '处理中' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="时间" width="170">
            <template #default="{ row }">{{ formatDate(row.createTime) }}</template>
          </el-table-column>
        </el-table>
        <el-empty v-if="!traceData.statements?.length" description="暂无支付记录" />
      </el-tab-pane>
      <el-tab-pane label="状态日志" name="logs">
        <el-timeline>
          <el-timeline-item
            v-for="log in traceData.statusLogs"
            :key="log.id"
            :timestamp="formatDate(log.createTime)"
            placement="top"
          >
            <el-card>
              <h4>{{ OrderStatusMap[log.newStatus] || '未知状态' }}</h4>
              <p>
                操作人：{{ log.operatorName || '系统' }}
                <span v-if="log.operatorType">
                  ({{ log.operatorType === 1 ? '乘客' : log.operatorType === 2 ? '司机' : '系统' }})
                </span>
              </p>
              <p v-if="log.changeReason">变更原因：{{ log.changeReason }}</p>
              <p v-if="log.remark">备注：{{ log.remark }}</p>
            </el-card>
          </el-timeline-item>
        </el-timeline>
        <el-empty v-if="!traceData.statusLogs?.length" description="暂无状态日志" />
      </el-tab-pane>
      <el-tab-pane label="数据完整性" name="integrity">
          <div class="integrity-card">
            <div class="integrity-score" :class="{ 'low': (traceData.integrity?.score || 0) < 80 }">
              <span class="score-number">{{ traceData.integrity?.score || 0 }}</span>
              <span class="score-label">分</span>
            </div>
            <div class="integrity-info">
              <p>
                总模块数：<b>{{ traceData.integrity?.totalModules || 0 }}</b>
              </p>
              <p>
                已完成：
                <span class="text-success">
                  <b>{{ traceData.integrity?.completeCount || 0 }}</b>
                </span>
              </p>
              <p>
                缺失：
                <span class="text-danger">
                  <b>{{ traceData.integrity?.missingCount || 0 }}</b>
                </span>
              </p>
            </div>
          </div>
          <el-alert
            v-if="(traceData.integrity?.score || 0) < 80"
            title="数据完整性低于80%，存在数据缺失风险"
            type="error"
            :closable="false"
            class="mb-16"
          />
          <el-divider>已完成模块</el-divider>
          <div class="module-list">
            <el-tag
              v-for="item in traceData.integrity?.complete || []"
              :key="item"
              type="success"
              effect="light"
              style="margin: 4px"
            >
              {{ item }}
            </el-tag>
          </div>
          <el-divider>缺失模块</el-divider>
          <div class="module-list">
            <el-tag
              v-for="item in traceData.integrity?.missing || []"
              :key="item"
              type="danger"
              effect="light"
              style="margin: 4px"
            >
              {{ item }}
            </el-tag>
          </div>
        </el-tab-pane>
        <el-tab-pane label="计费溯源" name="billing">
          <div v-if="billingTraceData" class="billing-trace">
            <div class="trace-actions">
              <el-button type="primary" size="small" @click="handleExportReport">
                <el-icon><Download /></el-icon>
                导出校验报告
              </el-button>
              <el-button size="small" @click="handleShowReport">
                <el-icon><Document /></el-icon>
                查看报告
              </el-button>
            </div>
            <el-divider />
            <div class="billing-summary">
              <el-row :gutter="16">
                <el-col :span="6">
                  <el-card shadow="hover" class="stat-card">
                    <div class="stat-label">当前总价</div>
                    <div class="stat-value price">¥{{ billingTraceData.currentBilling.estimatedTotal.toFixed(2) }}</div>
                  </el-card>
                </el-col>
                <el-col :span="6">
                  <el-card shadow="hover" class="stat-card">
                    <div class="stat-label">基础价</div>
                    <div class="stat-value">¥{{ billingTraceData.currentBilling.basePrice.toFixed(2) }}</div>
                  </el-card>
                </el-col>
                <el-col :span="6">
                  <el-card shadow="hover" class="stat-card">
                    <div class="stat-label">里程费</div>
                    <div class="stat-value">¥{{ billingTraceData.currentBilling.totalDistanceFee.toFixed(2) }}</div>
                  </el-card>
                </el-col>
                <el-col :span="6">
                  <el-card shadow="hover" class="stat-card">
                    <div class="stat-label">溢价金额</div>
                    <div class="stat-value surge">¥{{ billingTraceData.currentBilling.totalSurgeAmount.toFixed(2) }}</div>
                  </el-card>
                </el-col>
              </el-row>
            </div>
            <el-divider />
            <div class="trace-section">
              <div class="section-title">
                <el-icon><Clock /></el-icon>
                变更历史
              </div>
              <el-timeline v-if="billingTraceData.changeHistory.length > 0">
                <el-timeline-item
                  v-for="log in billingTraceData.changeHistory"
                  :key="log.id"
                  :timestamp="formatDate(log.createTime)"
                  placement="top"
                  :type="log.hasException === 1 ? 'danger' : 'primary'"
                >
                  <el-card shadow="never" class="trace-log-card" :class="{ 'has-exception': log.hasException === 1 }">
                    <div class="log-header">
                      <span class="log-type">{{ log.changeType }}</span>
                      <span class="log-operator">操作人：{{ log.operatorName || '系统' }}</span>
                      <span v-if="log.operatorIP" class="log-ip">IP：{{ log.operatorIP }}</span>
                    </div>
                    <div v-if="log.priceDiff !== 0" class="log-price" :class="{ 'up': log.priceDiff > 0, 'down': log.priceDiff < 0 }">
                      价格变动：{{ log.priceDiff > 0 ? '+' : '' }}{{ log.priceDiff.toFixed(2) }}元
                    </div>
                    <div v-if="log.remark" class="log-remark">备注：{{ log.remark }}</div>
                    <div v-if="log.hasException === 1" class="log-exception">
                      <el-icon><Warning /></el-icon>
                      <span>{{ log.exceptionType }}：{{ log.exceptionDetail }}</span>
                    </div>
                  </el-card>
                </el-timeline-item>
              </el-timeline>
              <el-empty v-else description="暂无变更历史" :image-size="60" />
            </div>
            <el-divider />
            <div class="trace-section">
              <div class="section-title">
                <el-icon><Warning /></el-icon>
                风险检查
              </div>
              <div class="risk-list">
                <div
                  v-for="(risk, index) in billingTraceData.riskChecks"
                  :key="index"
                  class="risk-item"
                  :class="risk.level"
                >
                  <el-icon class="risk-icon">
                    <component :is="risk.level === 'high' ? 'Warning' : risk.level === 'medium' ? 'InfoFilled' : 'CircleCheck'" />
                  </el-icon>
                  <span class="risk-message">{{ risk.message }}</span>
                  <el-tag size="small" :type="risk.level === 'high' ? 'danger' : risk.level === 'medium' ? 'warning' : 'success'">
                    {{ risk.type }}
                  </el-tag>
                </div>
              </div>
              <el-empty v-if="billingTraceData.riskChecks.length === 0" description="暂无风险检查结果" :image-size="60" />
            </div>
            <el-divider />
            <div class="trace-section">
              <div class="section-title">
                <el-icon><CircleCheck /></el-icon>
                合规校验
                <span class="validation-score" :class="{ 'low': billingTraceData.validation.score < 80 }">
                  得分：{{ billingTraceData.validation.score }}分
                </span>
              </div>
              <div class="billing-detail-wrapper">
                <el-table
                  :data="billingTraceData.currentBilling.billingItems"
                  border
                  :row-class-name="billingTableRowClassName"
                  class="billing-trace-table"
                >
                  <el-table-column prop="ruleName" label="规则名称" min-width="120" resizable>
                    <template #default="{ row }">
                      <el-tooltip
                        placement="top"
                        :show-after="500"
                        :content="getValidationTooltip(row)"
                        :disabled="!hasValidationIssue(row)"
                      >
                        <span>{{ row.ruleName }}</span>
                      </el-tooltip>
                    </template>
                  </el-table-column>
                  <el-table-column label="类型" width="100" resizable>
                    <template #default="{ row }">
                      <el-tag :type="getRuleTypeTagType(row.ruleType)" size="small">
                        {{ RuleTypeMap[row.ruleType] || '-' }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="basePrice" label="基础价" width="100" resizable>
                    <template #default="{ row }">¥{{ row.basePrice?.toFixed(2) || '0.00' }}</template>
                  </el-table-column>
                  <el-table-column prop="perKmPrice" label="里程费" width="100" resizable>
                    <template #default="{ row }">¥{{ row.perKmPrice?.toFixed(2) || '0.00' }}/km</template>
                  </el-table-column>
                  <el-table-column prop="perMinPrice" label="时长费" width="100" resizable>
                    <template #default="{ row }">¥{{ row.perMinPrice?.toFixed(2) || '0.00' }}/min</template>
                  </el-table-column>
                  <el-table-column prop="surgeRatio" label="溢价倍数" width="100" resizable>
                    <template #default="{ row }">{{ row.surgeRatio.toFixed(1) }}x</template>
                  </el-table-column>
                  <el-table-column prop="itemTotal" label="小计" width="120" resizable align="right">
                    <template #default="{ row }">
                      <span class="item-total">¥{{ row.itemTotal?.toFixed(2) || '0.00' }}</span>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
              <div v-if="billingTraceData.validation.exceptions.length > 0" class="validation-errors">
                <div class="errors-title">校验异常：</div>
                <div
                  v-for="(error, index) in billingTraceData.validation.exceptions"
                  :key="index"
                  class="error-item"
                >
                  <el-tag type="danger" size="small">{{ error.field }}</el-tag>
                  <span>{{ error.message }}</span>
                </div>
              </div>
              <div v-if="billingTraceData.validation.warnings.length > 0" class="validation-warnings">
                <div class="warnings-title">校验警告：</div>
                <div
                  v-for="(warning, index) in billingTraceData.validation.warnings"
                  :key="index"
                  class="warning-item"
                >
                  <el-tag type="warning" size="small">{{ warning.field }}</el-tag>
                  <span>{{ warning.message }}</span>
                </div>
              </div>
            </div>
          </div>
          <el-empty v-else-if="!billingTraceLoading" description="暂无计费溯源数据" />
          <el-loading v-else text="加载计费溯源数据中..." />
        </el-tab-pane>
      </el-tabs>
    <el-empty v-else-if="!loading" description="请输入订单号查询溯源信息" />
    <el-loading v-else text="加载中..." />
  </el-dialog>

  <el-dialog
    v-model="reportDialogVisible"
    title="计费校验报告"
    width="600px"
  >
    <div class="report-content">
      <pre>{{ reportContent }}</pre>
    </div>
    <template #footer>
      <el-button @click="handleExportReport">
        <el-icon><Download /></el-icon>
        导出JSON
      </el-button>
      <el-button type="primary" @click="reportDialogVisible = false">
        关闭
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search,
  Download,
  Document,
  Clock,
  Warning,
  CircleCheck,
  InfoFilled
} from '@element-plus/icons-vue'
import StatusTag from '@/components/StatusTag/index.vue'
import { getOrderTraceApi } from '@/api/order'
import { getBillingTraceApi } from '@/api/pricing'
import { OrderStatusMap, OrderStatusColorMap } from '@/enums/order'
import { RuleTypeMap } from '@/enums/pricing'
import { formatDate, formatPhone } from '@/utils/format'
import type { OrderTraceData } from '@/types/order'
import type { BillingTraceData, BillingItem } from '@/types/pricing'

interface Props {
  modelValue: boolean
  orderNo?: string
}

const props = withDefaults(defineProps<Props>(), {
  orderNo: ''
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const ServiceTypeMap: Record<number, string> = {
  1: '快车',
  2: '专车',
  3: '豪华车',
  4: '拼车',
  5: '出租车'
}

const OrderSourceMap: Record<number, string> = {
  1: 'APP下单',
  2: '小程序',
  3: '客服代下',
  4: '企业用车'
}

const searchOrderNo = ref('')
const activeTab = ref('order')
const loading = ref(false)
const traceData = ref<OrderTraceData | null>(null)
const billingTraceData = ref<BillingTraceData | null>(null)
const billingTraceLoading = ref(false)
const reportDialogVisible = ref(false)
const reportContent = ref('')

watch(
  () => props.modelValue,
  (val) => {
    if (val && props.orderNo) {
      searchOrderNo.value = props.orderNo
      handleSearch()
    } else if (!val) {
      traceData.value = null
      activeTab.value = 'order'
    }
  }
)

watch(
  () => props.orderNo,
  (val) => {
    if (val && props.modelValue) {
      searchOrderNo.value = val
      handleSearch()
    }
  }
)

const handleVisibleChange = (val: boolean) => {
  emit('update:modelValue', val)
}

const handleSearch = async () => {
  if (!searchOrderNo.value) {
    ElMessage.warning('请输入订单号')
    return
  }
  loading.value = true
  traceData.value = null
  billingTraceData.value = null
  try {
    const res = await getOrderTraceApi(searchOrderNo.value)
    traceData.value = res.data
    if (activeTab.value === 'billing') {
      await loadBillingTrace()
    }
  } catch (error: any) {
    ElMessage.error(error.message || '查询溯源信息失败')
  } finally {
    loading.value = false
  }
}

watch(
  () => activeTab.value,
  async (val) => {
    if (val === 'billing' && !billingTraceData.value && searchOrderNo.value) {
      await loadBillingTrace()
    }
  }
)

const loadBillingTrace = async () => {
  if (!searchOrderNo.value) return
  billingTraceLoading.value = true
  try {
    const res = await getBillingTraceApi(searchOrderNo.value)
    billingTraceData.value = res.data
  } catch (error: any) {
    ElMessage.error(error.message || '加载计费溯源数据失败')
  } finally {
    billingTraceLoading.value = false
  }
}

const billingTableRowClassName = ({ row }: { row: BillingItem }) => {
  if (row.validation && (row.validation.isAbnormal || row.validation.errors?.length > 0)) {
    return 'billing-row-error'
  }
  return ''
}

const hasValidationIssue = (row: BillingItem) => {
  return row.validation && (row.validation.isAbnormal || row.validation.errors?.length > 0 || row.validation.warnings?.length > 0)
}

const getValidationTooltip = (row: BillingItem) => {
  if (!row.validation) return ''
  const parts: string[] = []
  if (row.validation.errors?.length) {
    parts.push('错误：' + row.validation.errors.join('；'))
  }
  if (row.validation.warnings?.length) {
    parts.push('警告：' + row.validation.warnings.join('；'))
  }
  if (row.validation.ruleViolated) {
    parts.push('规则：' + row.validation.ruleViolated)
  }
  return parts.join('\n')
}

const getRuleTypeTagType = (type: number) => {
  const map: Record<number, string> = {
    1: 'primary',
    2: 'success',
    3: 'warning',
    4: 'info'
  }
  return map[type] || 'info'
}

const handleExportReport = () => {
  if (!billingTraceData.value) return
  const report = {
    orderId: searchOrderNo.value,
    generateTime: new Date().toISOString(),
    billingData: billingTraceData.value,
    summary: {
      totalPrice: billingTraceData.value.currentBilling.estimatedTotal,
      validationScore: billingTraceData.value.validation.score,
      riskCount: billingTraceData.value.riskChecks.filter(r => r.level === 'high').length,
      exceptionCount: billingTraceData.value.validation.exceptions.length,
      changeCount: billingTraceData.value.changeHistory.length
    }
  }
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `billing-report-${searchOrderNo.value}.json`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('报告导出成功')
}

const handleShowReport = () => {
  if (!billingTraceData.value) return
  const report = {
    orderId: searchOrderNo.value,
    generateTime: new Date().toLocaleString(),
    summary: {
      当前总价: `¥${billingTraceData.value.currentBilling.estimatedTotal.toFixed(2)}`,
      校验得分: `${billingTraceData.value.validation.score}分`,
      高风险项: billingTraceData.value.riskChecks.filter(r => r.level === 'high').length,
      异常项: billingTraceData.value.validation.exceptions.length,
      变更次数: billingTraceData.value.changeHistory.length
    },
    riskChecks: billingTraceData.value.riskChecks,
    validation: billingTraceData.value.validation
  }
  reportContent.value = JSON.stringify(report, null, 2)
  reportDialogVisible.value = true
}
</script>

<style lang="scss" scoped>
.trace-dialog {
  :deep(.el-dialog__body) {
    padding-top: 10px;
  }
}

.trace-search {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}

.mb-16 {
  margin-bottom: 16px;
}

.integrity-card {
  display: flex;
  align-items: center;
  gap: 40px;
  padding: 30px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 20px;

  .integrity-score {
    display: flex;
    align-items: baseline;
    color: #67c23a;

    &.low {
      color: #f56c6c;
    }

    .score-number {
      font-size: 48px;
      font-weight: bold;
      line-height: 1;
    }

    .score-label {
      font-size: 18px;
      margin-left: 4px;
    }
  }

  .integrity-info {
    flex: 1;

    p {
      margin: 8px 0;
      font-size: 14px;
      color: #606266;
    }

    .text-success {
      color: #67c23a;
    }

    .text-danger {
      color: #f56c6c;
    }
  }
}

.module-list {
  padding: 10px 0;
}

.mb-16 {
  margin-bottom: 16px;
}

.billing-trace {
  .trace-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    margin-bottom: 16px;
  }

  .billing-summary {
    margin-bottom: 24px;

    .stat-card {
      text-align: center;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
      }

      .stat-label {
        font-size: 13px;
        color: #909399;
        margin-bottom: 8px;
      }

      .stat-value {
        font-size: 20px;
        font-weight: 600;
        color: #303133;

        &.price {
          color: #409eff;
        }

        &.surge {
          color: #e6a23c;
        }
      }
    }
  }

  .trace-section {
    margin-bottom: 24px;

    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      font-weight: 500;
      color: #303133;
      margin-bottom: 16px;

      .el-icon {
        color: #409eff;
      }

      .validation-score {
        margin-left: auto;
        font-size: 14px;
        font-weight: 600;
        color: #67c23a;

        &.low {
          color: #f56c6c;
        }
      }
    }

    .trace-log-card {
      margin-bottom: 8px;
      transition: all 0.3s ease;

      &.has-exception {
        border-left: 4px solid #f56c6c;
        background: rgba(245, 108, 108, 0.05);
      }

      .log-header {
        display: flex;
        gap: 16px;
        margin-bottom: 8px;

        .log-type {
          font-weight: 500;
          color: #303133;
        }

        .log-operator,
        .log-ip {
          font-size: 12px;
          color: #909399;
        }
      }

      .log-price {
        font-size: 13px;
        margin-bottom: 4px;

        &.up {
          color: #f56c6c;
        }

        &.down {
          color: #67c23a;
        }
      }

      .log-remark {
        font-size: 13px;
        color: #606266;
        margin-bottom: 4px;
      }

      .log-exception {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: #f56c6c;
        margin-top: 8px;
      }
    }

    .risk-list {
      .risk-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        border-radius: 8px;
        margin-bottom: 8px;
        transition: all 0.3s ease;

        &.high {
          background: rgba(245, 108, 108, 0.1);
          border-left: 4px solid #f56c6c;

          .risk-icon {
            color: #f56c6c;
          }
        }

        &.medium {
          background: rgba(230, 162, 60, 0.1);
          border-left: 4px solid #e6a23c;

          .risk-icon {
            color: #e6a23c;
          }
        }

        &.low {
          background: rgba(103, 194, 58, 0.1);
          border-left: 4px solid #67c23a;

          .risk-icon {
            color: #67c23a;
          }
        }

        .risk-icon {
          font-size: 20px;
        }

        .risk-message {
          flex: 1;
          font-size: 14px;
          color: #303133;
        }
      }
    }

    .billing-detail-wrapper {
      margin-bottom: 16px;

      .billing-trace-table {
        :deep(.el-table__row) {
          transition: all 0.3s ease;
        }

        :deep(.billing-row-error) {
          background: rgba(245, 108, 108, 0.1) !important;
        }

        .item-total {
          font-weight: 600;
          color: #409eff;
        }
      }
    }

    .validation-errors,
    .validation-warnings {
      padding: 12px 16px;
      border-radius: 8px;

      .errors-title,
      .warnings-title {
        font-weight: 500;
        margin-bottom: 8px;
        font-size: 14px;
      }

      .error-item,
      .warning-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 4px 0;
        font-size: 13px;
        color: #606266;
      }
    }

    .validation-errors {
      background: rgba(245, 108, 108, 0.05);
      margin-bottom: 8px;

      .errors-title {
        color: #f56c6c;
      }
    }

    .validation-warnings {
      background: rgba(230, 162, 60, 0.05);

      .warnings-title {
        color: #e6a23c;
      }
    }
  }
}

.report-content {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 16px;
  max-height: 400px;
  overflow-y: auto;

  pre {
    margin: 0;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 13px;
    line-height: 1.6;
    white-space: pre-wrap;
    word-break: break-all;
  }
}
</style>
