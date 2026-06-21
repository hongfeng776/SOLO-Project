<template>
  <FinDialog
    v-model:visible="visible"
    title="持仓溯源信息"
    width="900px"
    :hide-footer="true"
  >
    <div v-if="loading" class="loading-wrap">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>加载中...</span>
    </div>
    <div v-else class="audit-container">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="持仓溯源" name="source">
          <el-descriptions v-if="auditData" :column="2" border>
            <el-descriptions-item label="客户">
              {{ auditData.customer?.customer_name || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="股票">
              {{ auditData.holding?.stock_code }} {{ auditData.holding?.stock_name }}
            </el-descriptions-item>
            <el-descriptions-item label="锁定状态">
              <el-tag
                :type="auditData.holding?.lock_status === 'locked' ? 'danger' : 'success'"
                effect="light"
              >
                {{ auditData.holding?.lock_status === 'locked' ? '已锁定' : '正常' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="持仓数量">
              {{ formatInteger(auditData.holding?.total_quantity) }}
            </el-descriptions-item>
            <el-descriptions-item label="可用数量">
              {{ formatInteger(auditData.holding?.available_quantity) }}
            </el-descriptions-item>
            <el-descriptions-item label="冻结数量">
              <span :class="{ 'frozen-text': Number(auditData.holding?.frozen_quantity || 0) > 0 }">
                {{ formatInteger(auditData.holding?.frozen_quantity) }}
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="成本价">
              {{ formatMoney(auditData.holding?.cost_price) }}
            </el-descriptions-item>
            <el-descriptions-item label="市值">
              {{ formatNumber(auditData.holding?.market_value) }}
            </el-descriptions-item>
            <el-descriptions-item label="锁定人" v-if="auditData.holding?.locked_by_name">
              {{ auditData.holding.locked_by_name }}
            </el-descriptions-item>
            <el-descriptions-item label="锁定时间" v-if="auditData.holding?.locked_at">
              {{ formatDateTime(auditData.holding.locked_at) }}
            </el-descriptions-item>
            <el-descriptions-item label="锁定原因" :span="2" v-if="auditData.holding?.lock_reason">
              {{ auditData.holding.lock_reason }}
            </el-descriptions-item>
            <el-descriptions-item label="解锁人" v-if="auditData.holding?.unlocked_by_name">
              {{ auditData.holding.unlocked_by_name }}
            </el-descriptions-item>
            <el-descriptions-item label="解锁时间" v-if="auditData.holding?.unlocked_at">
              {{ formatDateTime(auditData.holding.unlocked_at) }}
            </el-descriptions-item>
            <el-descriptions-item label="最后调整人" v-if="auditData.holding?.last_adjust_by_name">
              {{ auditData.holding.last_adjust_by_name }}
            </el-descriptions-item>
            <el-descriptions-item label="最后调整时间" v-if="auditData.holding?.last_adjust_at">
              {{ formatDateTime(auditData.holding.last_adjust_at) }}
            </el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>

        <el-tab-pane label="交易流水" name="trades">
          <el-table
            v-if="auditData && auditData.tradeLogs && auditData.tradeLogs.length > 0"
            :data="auditData.tradeLogs"
            border
            max-height="400"
          >
            <el-table-column prop="trade_type" label="类型" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="row.trade_type === 'buy' ? 'danger' : 'success'" size="small" effect="dark">
                  {{ row.trade_type === 'buy' ? '买入' : '卖出' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="trade_price" label="成交价" width="110" align="right">
              <template #default="{ row }">
                {{ formatMoney(row.trade_price) }}
              </template>
            </el-table-column>
            <el-table-column prop="trade_quantity" label="成交量" width="100" align="right">
              <template #default="{ row }">
                {{ formatInteger(row.trade_quantity) }}
              </template>
            </el-table-column>
            <el-table-column prop="trade_amount" label="成交额" width="130" align="right">
              <template #default="{ row }">
                {{ formatNumber(row.trade_amount) }}
              </template>
            </el-table-column>
            <el-table-column label="成交时间" width="160">
              <template #default="{ row }">
                {{ formatDateTime(row.created_at) }}
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-else description="暂无交易流水" />
        </el-tab-pane>

        <el-tab-pane label="操作日志" name="logs">
          <el-table
            v-if="auditData && auditData.operationLogs && auditData.operationLogs.length > 0"
            :data="auditData.operationLogs"
            border
            max-height="400"
          >
            <el-table-column prop="operation" label="操作内容" min-width="180" />
            <el-table-column prop="operation_type" label="类型" width="80" align="center">
              <template #default="{ row }">
                <el-tag type="primary" size="small" effect="light">{{ row.operation_type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="username" label="操作人" width="100" />
            <el-table-column prop="remark" label="备注" min-width="160" />
            <el-table-column label="时间" width="160">
              <template #default="{ row }">
                {{ formatDateTime(row.created_at) }}
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-else description="暂无操作日志" />
        </el-tab-pane>

        <el-tab-pane label="一致性校验" name="consistency">
          <div v-if="auditData" class="consistency-check">
            <el-alert
              title="系统自动校验持仓数据与交易流水的一致性"
              type="info"
              :closable="false"
              show-icon
              style="margin-bottom: 16px"
            />
            <el-descriptions :column="2" border>
              <el-descriptions-item label="交易一致性">
                <el-tag
                  :type="auditData.consistencyCheck?.passed ? 'success' : 'danger'"
                  effect="light"
                >
                  {{ auditData.consistencyCheck?.passed ? '校验通过' : '存在异常' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="市值精度">
                <el-tag
                  :type="auditData.precisionCheck?.passed ? 'success' : 'danger'"
                  effect="light"
                >
                  {{ auditData.precisionCheck?.passed ? '精度正常' : '精度异常' }}
                </el-tag>
              </el-descriptions-item>
            </el-descriptions>

            <div
              v-if="auditData.consistencyCheck && auditData.consistencyCheck.issues && auditData.consistencyCheck.issues.length > 0"
              class="issues-section"
            >
              <h4>一致性问题</h4>
              <el-table :data="auditData.consistencyCheck.issues" border size="small">
                <el-table-column prop="type" label="类型" width="140" />
                <el-table-column prop="severity" label="严重程度" width="100" align="center">
                  <template #default="{ row }">
                    <el-tag
                      :type="row.severity === 'high' ? 'danger' : row.severity === 'medium' ? 'warning' : 'info'"
                      size="small"
                    >
                      {{ row.severity === 'high' ? '高' : row.severity === 'medium' ? '中' : '低' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="message" label="描述" />
              </el-table>
            </div>

            <div
              v-if="auditData.precisionCheck && auditData.precisionCheck.issues && auditData.precisionCheck.issues.length > 0"
              class="issues-section"
            >
              <h4>精度问题</h4>
              <el-table :data="auditData.precisionCheck.issues" border size="small">
                <el-table-column prop="field" label="字段" width="140" />
                <el-table-column prop="message" label="描述" />
              </el-table>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </FinDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Loading } from '@element-plus/icons-vue'
import FinDialog from '@/components/common/FinDialog.vue'
import { formatMoney, formatNumber, formatDateTime } from '@/utils/format'
import * as holdingApi from '@/api/holding'

interface Props {
  visible: boolean
  holdingId: number | null
}

const props = withDefaults(defineProps<Props>(), {
  holdingId: null,
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const visible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
})

const loading = ref(false)
const activeTab = ref('source')
const auditData = ref<any>(null)

function formatInteger(value: number): string {
  if (value === null || value === undefined) return '0'
  return Number(value).toLocaleString()
}

async function fetchData() {
  if (!props.holdingId) return
  loading.value = true
  try {
    const res = await holdingApi.getHoldingAuditTrail(props.holdingId)
    if (res.code === 0) {
      auditData.value = res.data
    }
  } finally {
    loading.value = false
  }
}

watch(
  () => [props.visible, props.holdingId],
  ([visibleVal, id]) => {
    if (visibleVal && id) {
      fetchData()
    }
  },
)
</script>

<style lang="scss" scoped>
.loading-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 300px;
  gap: 8px;
  color: #909399;
}

.frozen-text {
  color: #F56C6C;
  font-weight: 600;
}

.consistency-check {
  .issues-section {
    margin-top: 16px;

    h4 {
      margin-bottom: 8px;
      font-size: 14px;
      color: #303133;
    }
  }
}
</style>
