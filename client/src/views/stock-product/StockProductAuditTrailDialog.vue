<template>
  <FinDialog
    v-model:visible="visible"
    title="股票产品建档溯源"
    width="960px"
    :hide-footer="true"
  >
    <div v-if="loading" class="loading-wrap">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>加载中...</span>
    </div>
    <div v-else class="audit-container">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="建档溯源" name="source">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="建档人">
              {{ sourceInfo?.createdBy || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="建档时间">
              {{ formatDateTime(sourceInfo?.createdAt) }}
            </el-descriptions-item>
            <el-descriptions-item label="产品编码">
              <span class="code-text">{{ productInfo?.productCode || '-' }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="股票代码">
              <span class="code-text">{{ productInfo?.stockCode || '-' }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="股票名称">
              <span
                class="editable-field"
                @dblclick="startEdit('stockName')"
              >
                <template v-if="editingField === 'stockName'">
                  <el-input
                    ref="editInputRef"
                    v-model="editValue"
                    size="small"
                    @blur="saveEdit('stockName')"
                    @keyup.enter="saveEdit('stockName')"
                  />
                </template>
                <template v-else>
                  {{ productInfo?.stockName || '-' }}
                  <el-icon size="12" style="margin-left:4px;color:#909399"><Edit /></el-icon>
                </template>
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="产品类型">
              {{ STOCK_PRODUCT_TYPE_LABELS[productInfo?.productType as StockProductType] || productInfo?.productType || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="备案编号">
              <span class="code-text">{{ sourceInfo?.filingNo || '-' }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="备案机构">
              {{ sourceInfo?.filingInstitution || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="备案日期">
              {{ formatDateTime(sourceInfo?.filingDate) }}
            </el-descriptions-item>
            <el-descriptions-item label="备案凭证" v-if="sourceInfo?.filingCredential">
              <span class="code-text">{{ sourceInfo.filingCredential }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="建档状态">
              <el-tag
                :type="(STOCK_PRODUCT_ARCHIVE_STATUS_COLORS[productInfo?.archiveStatus as StockProductArchiveStatus] as any) || 'info'"
                effect="light"
              >
                {{ STOCK_PRODUCT_ARCHIVE_STATUS_LABELS[productInfo?.archiveStatus as StockProductArchiveStatus] || productInfo?.archiveStatus || '-' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="备案状态">
              <el-tag
                :type="(STOCK_PRODUCT_FILING_STATUS_COLORS[productInfo?.filingStatus as StockProductFilingStatus] as any) || 'info'"
                effect="light"
              >
                {{ STOCK_PRODUCT_FILING_STATUS_LABELS[productInfo?.filingStatus as StockProductFilingStatus] || productInfo?.filingStatus || '-' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="交易规则" :span="2">
              <span
                class="editable-field"
                @dblclick="startEdit('tradingRule')"
              >
                <template v-if="editingField === 'tradingRule'">
                  <el-input
                    v-model="editValue"
                    size="small"
                    @blur="saveEdit('tradingRule')"
                    @keyup.enter="saveEdit('tradingRule')"
                  />
                </template>
                <template v-else>
                  {{ productInfo?.tradingRule || '-' }}
                  <el-icon size="12" style="margin-left:4px;color:#909399"><Edit /></el-icon>
                </template>
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="费用标准" :span="2">
              <span
                class="editable-field"
                @dblclick="startEdit('feeStandard')"
              >
                <template v-if="editingField === 'feeStandard'">
                  <el-input
                    v-model="editValue"
                    size="small"
                    @blur="saveEdit('feeStandard')"
                    @keyup.enter="saveEdit('feeStandard')"
                  />
                </template>
                <template v-else>
                  {{ productInfo?.feeStandard || '-' }}
                  <el-icon size="12" style="margin-left:4px;color:#909399"><Edit /></el-icon>
                </template>
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="备注" :span="2">
              <span
                class="editable-field"
                @dblclick="startEdit('remark')"
              >
                <template v-if="editingField === 'remark'">
                  <el-input
                    v-model="editValue"
                    size="small"
                    type="textarea"
                    :rows="2"
                    @blur="saveEdit('remark')"
                  />
                </template>
                <template v-else>
                  {{ productInfo?.remark || '-' }}
                  <el-icon size="12" style="margin-left:4px;color:#909399"><Edit /></el-icon>
                </template>
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="最后修改人">
              {{ sourceInfo?.updatedBy || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="最后修改时间">
              {{ formatDateTime(sourceInfo?.updatedAt) }}
            </el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>

        <el-tab-pane label="操作日志" name="logs">
          <el-table
            v-if="operationLogs.length > 0"
            :data="operationLogs"
            border
            max-height="400"
          >
            <el-table-column prop="operation" label="操作内容" min-width="180" />
            <el-table-column prop="operationType" label="操作类型" width="100" align="center">
              <template #default="{ row }">
                <el-tag
                  :type="OPERATION_TYPE_TYPES[row.operationType] || 'info'"
                  effect="light"
                  size="small"
                >
                  {{ OPERATION_TYPE_LABELS[row.operationType] || row.operationType }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="username" label="操作人" width="100" />
            <el-table-column prop="ipAddress" label="IP地址" width="130" />
            <el-table-column prop="remark" label="备注" min-width="160" />
            <el-table-column label="操作时间" width="160">
              <template #default="{ row }">
                {{ formatDateTime(row.createdAt) }}
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-else description="暂无操作日志" />
        </el-tab-pane>

        <el-tab-pane label="备案一致性校验" name="consistency">
          <div class="consistency-check">
            <el-alert
              title="系统自动校验产品信息与交易所公示数据一致性"
              type="info"
              :closable="false"
              show-icon
              style="margin-bottom: 16px"
            />
            <el-descriptions :column="2" border>
              <el-descriptions-item label="代码一致性">
                <el-tag :type="consistencyCheck?.codeMatch ? 'success' : 'danger'" effect="light">
                  <el-icon v-if="consistencyCheck?.codeMatch"><CircleCheck /></el-icon>
                  <el-icon v-else><CircleClose /></el-icon>
                  {{ consistencyCheck?.codeMatch ? '一致' : '不一致' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="名称一致性">
                <el-tag :type="consistencyCheck?.nameMatch ? 'success' : 'danger'" effect="light">
                  <el-icon v-if="consistencyCheck?.nameMatch"><CircleCheck /></el-icon>
                  <el-icon v-else><CircleClose /></el-icon>
                  {{ consistencyCheck?.nameMatch ? '一致' : '不一致' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="状态一致性">
                <el-tag :type="consistencyCheck?.statusMatch ? 'success' : 'danger'" effect="light">
                  <el-icon v-if="consistencyCheck?.statusMatch"><CircleCheck /></el-icon>
                  <el-icon v-else><CircleClose /></el-icon>
                  {{ consistencyCheck?.statusMatch ? '一致' : '不一致' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="交易参数合规性">
                <el-tag :type="consistencyCheck?.paramsValid ? 'success' : 'danger'" effect="light">
                  <el-icon v-if="consistencyCheck?.paramsValid"><CircleCheck /></el-icon>
                  <el-icon v-else><CircleClose /></el-icon>
                  {{ consistencyCheck?.paramsValid ? '合规' : '不合规' }}
                </el-tag>
              </el-descriptions-item>
            </el-descriptions>

            <div
              v-if="consistencyCheck && consistencyCheck.issues && consistencyCheck.issues.length > 0"
              class="issues-section"
            >
              <h4>一致性问题</h4>
              <el-table :data="consistencyCheck.issues" border size="small">
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
          </div>
        </el-tab-pane>

        <el-tab-pane label="交易参数核对" name="verification">
          <el-table
            v-if="filingVerification && filingVerification.details && filingVerification.details.length > 0"
            :data="filingVerification.details"
            border
            max-height="400"
          >
            <el-table-column prop="field" label="字段名称" min-width="140" />
            <el-table-column prop="expected" label="期望值" min-width="140" />
            <el-table-column prop="actual" label="实际值" min-width="140" />
            <el-table-column label="校验结果" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.passed ? 'success' : 'danger'" size="small" effect="light">
                  {{ row.passed ? '通过' : '未通过' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-else description="暂无核对数据" />
        </el-tab-pane>
      </el-tabs>
    </div>
  </FinDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Loading, CircleCheck, CircleClose, Edit } from '@element-plus/icons-vue'
import FinDialog from '@/components/common/FinDialog.vue'
import * as stockProductApi from '@/api/stockProduct'
import { formatDateTime } from '@/utils/format'
import {
  STOCK_PRODUCT_TYPE_LABELS,
  STOCK_PRODUCT_STATUS_LABELS,
  STOCK_PRODUCT_STATUS_TAG_TYPES,
  STOCK_PRODUCT_ARCHIVE_STATUS_LABELS,
  STOCK_PRODUCT_ARCHIVE_STATUS_COLORS,
  STOCK_PRODUCT_FILING_STATUS_LABELS,
  STOCK_PRODUCT_FILING_STATUS_COLORS,
  OPERATION_TYPE_LABELS,
  OPERATION_TYPE_TYPES,
  MARKET_LABELS,
} from '@/constants/dictionaries'
import { StockProductArchiveStatus, StockProductFilingStatus } from '@/enums'
import type { IStockProductAuditTrailData } from '@/types/api'

interface Props {
  visible: boolean
  productId: number | null
}

const props = withDefaults(defineProps<Props>(), {
  productId: null,
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
const sourceInfo = ref<IStockProductAuditTrailData['sourceInfo'] | null>(null)
const productInfo = ref<Record<string, any> | null>(null)
const operationLogs = ref<IStockProductAuditTrailData['operationLogs']>([])
const consistencyCheck = ref<IStockProductAuditTrailData['consistencyCheck'] | null>(null)
const filingVerification = ref<IStockProductAuditTrailData['filingVerification'] | null>(null)

const editingField = ref<string | null>(null)
const editValue = ref('')
const editInputRef = ref<any>(null)

type EditableField = 'stockName' | 'tradingRule' | 'feeStandard' | 'remark'

function startEdit(field: EditableField) {
  editingField.value = field
  editValue.value = productInfo.value?.[field] ?? ''
  nextTick(() => {
    editInputRef.value?.focus()
  })
}

async function saveEdit(field: EditableField) {
  if (!props.productId || !editingField.value) return
  const oldValue = productInfo.value?.[field]
  if (editValue.value === oldValue) {
    editingField.value = null
    return
  }
  try {
    const res = await stockProductApi.update(props.productId, { [field]: editValue.value })
    if (res.code === 0) {
      if (productInfo.value) {
        productInfo.value[field] = editValue.value
      }
      ElMessage.success('修改成功')
    }
  } finally {
    editingField.value = null
  }
}

async function fetchData() {
  if (!props.productId) return
  loading.value = true
  try {
    const res = await stockProductApi.getAuditTrail(props.productId)
    if (res.code === 0) {
      const data = res.data
      sourceInfo.value = data.sourceInfo
      productInfo.value = data.sourceInfo?.originalData || {}
      operationLogs.value = data.operationLogs || []
      consistencyCheck.value = data.consistencyCheck || null
      filingVerification.value = data.filingVerification || null
    }
  } finally {
    loading.value = false
  }
}

watch(
  () => [props.visible, props.productId],
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

.code-text {
  font-family: monospace;
  color: #409eff;
}

.editable-field {
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  transition: background 0.2s;

  &:hover {
    background: #f5f7fa;
  }
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
