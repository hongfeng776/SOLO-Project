<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    title="仓储库存溯源"
    width="900px"
    :close-on-click-modal="false"
    class="zoom-dialog"
  >
    <div v-if="traceData" class="trace-content">
      <el-tabs v-model="activeTab" type="border-card">
        <el-tab-pane label="基本信息" name="basic">
          <el-descriptions :column="3" border size="small" v-if="traceData.inventory_info">
            <el-descriptions-item label="库存编号">{{ traceData.inventory_info.inventory_no }}</el-descriptions-item>
            <el-descriptions-item label="商品编码">{{ traceData.inventory_info.goods_code }}</el-descriptions-item>
            <el-descriptions-item label="商品名称">{{ traceData.inventory_info.goods_name }}</el-descriptions-item>
            <el-descriptions-item label="规格">{{ traceData.inventory_info.goods_spec || '-' }}</el-descriptions-item>
            <el-descriptions-item label="批次号">{{ traceData.inventory_info.batch_no }}</el-descriptions-item>
            <el-descriptions-item label="仓储位置">{{ traceData.inventory_info.warehouse_location }}</el-descriptions-item>
            <el-descriptions-item label="系统库存">{{ formatThousand(traceData.inventory_info.system_quantity) }}</el-descriptions-item>
            <el-descriptions-item label="实际库存">{{ formatThousand(traceData.inventory_info.actual_quantity) }}</el-descriptions-item>
            <el-descriptions-item label="差异">
              <span :style="{ color: traceData.inventory_info.diff_quantity > 0 ? '#67c23a' : traceData.inventory_info.diff_quantity < 0 ? '#f56c6c' : '' }">
                {{ formatThousand(traceData.inventory_info.diff_quantity) }}
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="库存类型">
              <el-tag :type="getInventoryTypeTag(traceData.inventory_info.inventory_type)" size="small">
                {{ getInventoryTypeLabel(traceData.inventory_info.inventory_type) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="正常库存">{{ formatThousand(traceData.inventory_info.normal_quantity) }}</el-descriptions-item>
            <el-descriptions-item label="损耗库存">{{ formatThousand(traceData.inventory_info.loss_quantity) }}</el-descriptions-item>
            <el-descriptions-item label="异常库存">{{ formatThousand(traceData.inventory_info.abnormal_quantity) }}</el-descriptions-item>
            <el-descriptions-item label="低库存预警">
              <el-tag :type="traceData.inventory_info.is_low_stock_alert ? 'danger' : 'success'" size="small">
                {{ traceData.inventory_info.is_low_stock_alert ? '已预警' : '正常' }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>

        <el-tab-pane label="入库记录" name="inbound">
          <el-table :data="traceData.inbound_records" border size="small" max-height="400" style="width:100%">
            <el-table-column prop="inbound_no" label="入库单号" min-width="140" />
            <el-table-column prop="type" label="类型" min-width="100">
              <template #default="{ row }">
                <el-tag size="small">{{ getInboundTypeLabel(row.type) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="quantity" label="数量" min-width="80" align="right">
              <template #default="{ row }">{{ formatThousand(row.quantity) }}</template>
            </el-table-column>
            <el-table-column prop="status" label="状态" min-width="80">
              <template #default="{ row }">
                <el-tag :type="getInboundStatusTag(row.status)" size="small" effect="plain">{{ getInboundStatusLabel(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="operator_name" label="操作人" min-width="80" />
            <el-table-column prop="created_at" label="时间" min-width="160" />
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="出库记录" name="outbound">
          <el-table :data="traceData.outbound_records" border size="small" max-height="400" style="width:100%">
            <el-table-column prop="outbound_no" label="出库单号" min-width="140" />
            <el-table-column prop="type" label="类型" min-width="100">
              <template #default="{ row }">
                <el-tag size="small">{{ getOutboundTypeLabel(row.type) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="quantity" label="数量" min-width="80" align="right">
              <template #default="{ row }">{{ formatThousand(row.quantity) }}</template>
            </el-table-column>
            <el-table-column label="超量拦截" min-width="90" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.is_over_quantity_intercepted" type="danger" size="small">已拦截</el-tag>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" min-width="80">
              <template #default="{ row }">
                <el-tag :type="getInboundStatusTag(row.status)" size="small" effect="plain">{{ getInboundStatusLabel(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="operator_name" label="操作人" min-width="80" />
            <el-table-column prop="created_at" label="时间" min-width="160" />
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="调拨记录" name="transfer">
          <el-table :data="traceData.transfer_records" border size="small" max-height="400" style="width:100%">
            <el-table-column prop="transfer_no" label="调拨单号" min-width="140" />
            <el-table-column prop="quantity" label="数量" min-width="80" align="right">
              <template #default="{ row }">{{ formatThousand(row.quantity) }}</template>
            </el-table-column>
            <el-table-column prop="from_location" label="调出位置" min-width="100" />
            <el-table-column prop="to_location" label="调入位置" min-width="100" />
            <el-table-column prop="status" label="状态" min-width="80">
              <template #default="{ row }">
                <el-tag :type="getTransferStatusTag(row.status)" size="small" effect="plain">{{ getTransferStatusLabel(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="operator_name" label="操作人" min-width="80" />
            <el-table-column prop="created_at" label="时间" min-width="160" />
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="一致性报告" name="consistency">
          <div class="consistency-report" v-if="traceData.consistency_report">
            <div class="score-section">
              <div class="score-ring" :style="{ '--score': traceData.consistency_report.consistency_score, '--color': getScoreColor(traceData.consistency_report.consistency_score) }">
                <span class="score-value">{{ traceData.consistency_report.consistency_score }}</span>
              </div>
              <div class="score-label">一致性评分</div>
            </div>
            <div class="report-stats">
              <el-row :gutter="16">
                <el-col :span="6">
                  <div class="stat-item">
                    <div class="stat-value">{{ traceData.consistency_report.fake_data_detected }}</div>
                    <div class="stat-label">虚假数据</div>
                  </div>
                </el-col>
                <el-col :span="6">
                  <div class="stat-item">
                    <div class="stat-value">{{ traceData.consistency_report.over_quantity_detected }}</div>
                    <div class="stat-label">超量出库</div>
                  </div>
                </el-col>
                <el-col :span="6">
                  <div class="stat-item">
                    <div class="stat-value">{{ traceData.consistency_report.duplicate_batch_detected }}</div>
                    <div class="stat-label">重复批次</div>
                  </div>
                </el-col>
                <el-col :span="6">
                  <div class="stat-item">
                    <div class="stat-value" :style="{ color: traceData.consistency_report.consistency_score >= 80 ? '#67c23a' : '#f56c6c' }">
                      {{ traceData.consistency_report.consistency_score >= 80 ? '合规' : '不合规' }}
                    </div>
                    <div class="stat-label">合规判定</div>
                  </div>
                </el-col>
              </el-row>
            </div>
            <div v-if="traceData.consistency_report.issues.length > 0" class="issues-section">
              <h4>问题列表</h4>
              <div v-for="(issue, idx) in traceData.consistency_report.issues" :key="idx" class="issue-item">
                <el-icon color="#f56c6c" size="14"><WarningFilled /></el-icon>
                <span>{{ issue }}</span>
              </div>
            </div>
            <div v-if="traceData.consistency_report.recommendations.length > 0" class="recommend-section">
              <h4>优化建议</h4>
              <div v-for="(rec, idx) in traceData.consistency_report.recommendations" :key="idx" class="rec-item">
                <el-icon color="#409eff" size="14"><InfoFilled /></el-icon>
                <span>{{ rec }}</span>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <div v-else class="loading-section">
      <el-skeleton :rows="8" animated />
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { WarningFilled, InfoFilled } from '@element-plus/icons-vue'
import { getFullTrace } from '@/api/warehouseInventoryTrace'
import { InventoryTypeMap, InboundTypeMap, InboundStatusMap, OutboundTypeMap, TransferStatusMap } from '@/types/business'

const props = defineProps<{
  visible: boolean
  inventoryId: number
}>()

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
}>()

const activeTab = ref('basic')
const traceData = ref<any>(null)

const formatThousand = (val: number | undefined) => {
  if (val === undefined || val === null) return '0'
  return val.toLocaleString('zh-CN')
}

const getInventoryTypeLabel = (type: number) => (InventoryTypeMap as any)[type]?.label || '未知'
const getInventoryTypeTag = (type: number) => (InventoryTypeMap as any)[type]?.type || 'info'
const getInboundTypeLabel = (type: number) => (InboundTypeMap as any)[type]?.label || '未知'
const getInboundStatusLabel = (status: number) => (InboundStatusMap as any)[status]?.label || '未知'
const getInboundStatusTag = (status: number) => (InboundStatusMap as any)[status]?.type || 'info'
const getOutboundTypeLabel = (type: number) => (OutboundTypeMap as any)[type]?.label || '未知'
const getTransferStatusLabel = (status: number) => (TransferStatusMap as any)[status]?.label || '未知'
const getTransferStatusTag = (status: number) => (TransferStatusMap as any)[status]?.type || 'info'

const getScoreColor = (score: number) => {
  if (score >= 80) return '#67c23a'
  if (score >= 60) return '#e6a23c'
  return '#f56c6c'
}

watch(() => props.visible, async (val) => {
  if (val && props.inventoryId) {
    activeTab.value = 'basic'
    traceData.value = null
    try {
      const res = await getFullTrace(props.inventoryId)
      traceData.value = res.data?.data
    } catch (e: any) {
      ElMessage.error('获取溯源数据失败')
    }
  }
})
</script>

<style scoped lang="scss">
.trace-content {
  min-height: 300px;
}

.consistency-report {
  padding: 8px;
}

.score-section {
  text-align: center;
  margin-bottom: 20px;
}

.score-ring {
  --score: 0;
  --color: #67c23a;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 6px solid var(--color);
  position: relative;

  .score-value {
    font-size: 28px;
    font-weight: 700;
    color: var(--color);
  }
}

.score-label {
  margin-top: 8px;
  font-size: 13px;
  color: #909399;
}

.report-stats {
  margin: 16px 0;
}

.stat-item {
  text-align: center;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;
}

.stat-value {
  font-size: 22px;
  font-weight: 600;
  color: #303133;
}

.stat-label {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
}

.issues-section, .recommend-section {
  margin-top: 16px;

  h4 {
    margin: 0 0 8px;
    font-size: 14px;
    color: #303133;
  }
}

.issue-item, .rec-item {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
  font-size: 13px;
  color: #606266;
}

.zoom-dialog {
  :deep(.el-dialog) {
    animation: zoomIn 0.3s ease;
  }
}

@keyframes zoomIn {
  from { opacity: 0; transform: scale(0.85); }
  to { opacity: 1; transform: scale(1); }
}
</style>
