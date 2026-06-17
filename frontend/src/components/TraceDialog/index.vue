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
    </el-tabs>
    <el-empty v-else-if="!loading" description="请输入订单号查询溯源信息" />
    <el-loading v-else text="加载中..." />
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import StatusTag from '@/components/StatusTag/index.vue'
import { getOrderTraceApi } from '@/api/order'
import { OrderStatusMap, OrderStatusColorMap } from '@/enums/order'
import { formatDate, formatPhone } from '@/utils/format'
import type { OrderTraceData } from '@/types/order'

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
  try {
    const res = await getOrderTraceApi(searchOrderNo.value)
    traceData.value = res.data
  } catch (error: any) {
    ElMessage.error(error.message || '查询溯源信息失败')
  } finally {
    loading.value = false
  }
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
</style>
