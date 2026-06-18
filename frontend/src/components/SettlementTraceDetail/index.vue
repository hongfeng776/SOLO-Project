<template>
  <el-drawer
    v-model="visible"
    :title="`收益溯源 #${settlementNo}`"
    direction="rtl"
    size="820px"
    class="trace-drawer"
  >
    <div v-loading="loading" class="trace-container">
      <div class="trace-banner">
        <div class="banner-main">
          <el-icon><DataAnalysis /></el-icon>
          <span>全链路收益溯源</span>
        </div>
        <el-tag
          v-if="traceData?.record?.isAbnormal"
          type="danger"
          effect="dark"
          class="pulse-tag"
        >
          <el-icon><Warning /></el-icon>
          存在异常
        </el-tag>
      </div>

      <el-tabs v-model="activeTab" type="card" class="trace-tabs">
        <el-tab-pane label="基本信息" name="basic">
          <BasicInfo :record="traceData?.record" />
        </el-tab-pane>
        <el-tab-pane label="订单来源与明细" name="orders">
          <OrderList
            :items="traceData?.items || []"
            @view-calc="handleViewCalc"
          />
        </el-tab-pane>
        <el-tab-pane label="应用规则" name="rules">
          <AppliedRules :items="traceData?.items || []" />
        </el-tab-pane>
        <el-tab-pane label="补贴明细" name="subsidy">
          <SubsidyDetail :items="traceData?.items || []" :record="traceData?.record" />
        </el-tab-pane>
        <el-tab-pane label="审核记录" name="audit">
          <AuditTimeline :logs="traceData?.auditLogs || []" />
        </el-tab-pane>
        <el-tab-pane label="异常检测" name="abnormal">
          <AbnormalCheck :items="traceData?.items || []" :record="traceData?.record" />
        </el-tab-pane>
      </el-tabs>

      <SettlementOrderCalculator
        v-model="calcDialogVisible"
        :driverId="traceData?.record?.driverId as number"
        :orderId="currentOrderId as number"
        :orderNo="currentOrderNo"
      />
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { DataAnalysis, Warning } from '@element-plus/icons-vue'
import { getSettlementDetailApi } from '@/api/settlement'
import type { SettlementTrace } from '@/types/driver'
import BasicInfo from './components/BasicInfo.vue'
import OrderList from './components/OrderList.vue'
import AppliedRules from './components/AppliedRules.vue'
import SubsidyDetail from './components/SubsidyDetail.vue'
import AuditTimeline from './components/AuditTimeline.vue'
import AbnormalCheck from './components/AbnormalCheck.vue'
import SettlementOrderCalculator from '@/components/SettlementOrderCalculator/index.vue'

const props = defineProps<{
  modelValue: boolean
  recordId: number | null
  settlementNo: string
}>()

const emit = defineEmits(['update:modelValue'])

const visible = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val)
})

const loading = ref(false)
const traceData = ref<SettlementTrace | null>(null)
const activeTab = ref('basic')

const calcDialogVisible = ref(false)
const currentOrderId = ref<number | null>(null)
const currentOrderNo = ref('')

const fetchDetail = async () => {
  if (!props.recordId) return
  loading.value = true
  try {
    const res = await getSettlementDetailApi(props.recordId)
    traceData.value = res.data
  } catch (e: any) {
    ElMessage.error(e.message || '查询失败')
  } finally {
    loading.value = false
  }
}

const handleViewCalc = (item: any) => {
  currentOrderId.value = item.orderId
  currentOrderNo.value = item.orderNo
  calcDialogVisible.value = true
}

watch(
  () => [props.modelValue, props.recordId],
  ([val]) => {
    if (val) {
      fetchDetail()
      activeTab.value = 'basic'
    }
  }
)
</script>

<style scoped>
.trace-drawer :deep(.el-drawer__header) {
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: #fff;
  margin-bottom: 0;
}

.trace-drawer :deep(.el-drawer__title) {
  color: #fff;
  font-weight: 600;
}

.trace-drawer :deep(.el-drawer__body) {
  padding: 0;
}

.trace-container {
  padding: 20px;
}

.trace-banner {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  margin: -20px -20px 20px;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.banner-main {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
}

.pulse-tag {
  animation: pulse-danger 2s infinite;
}

@keyframes pulse-danger {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(239, 68, 68, 0);
  }
}

.trace-tabs :deep(.el-tabs__item.is-active) {
  background: #4f46e5;
  color: #fff;
  border-color: #4f46e5;
}
</style>
