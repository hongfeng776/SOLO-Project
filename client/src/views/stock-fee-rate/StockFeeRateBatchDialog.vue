<template>
  <FinDialog
    v-model:visible="visible"
    title="股票费率批量操作"
    width="960px"
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <div class="batch-container">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="批量配置费率" name="update">
          <el-divider content-position="left">筛选条件</el-divider>
          <el-form :model="updateForm" label-width="120px" class="batch-form">
            <el-form-item label="费率类型">
              <el-select
                v-model="updateForm.feeRateTypes"
                multiple
                collapse-tags
                collapse-tags-tooltip
                placeholder="请选择费率类型"
                style="width: 100%"
              >
                <el-option
                  v-for="(label, key) in STOCK_FEE_RATE_TYPE_LABELS"
                  :key="key"
                  :label="label"
                  :value="key"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="客户等级">
              <el-select
                v-model="updateForm.customerLevels"
                multiple
                collapse-tags
                collapse-tags-tooltip
                placeholder="请选择客户等级"
                style="width: 100%"
              >
                <el-option
                  v-for="(label, key) in STOCK_FEE_CUSTOMER_LEVEL_LABELS"
                  :key="key"
                  :label="label"
                  :value="key"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="交易场景">
              <el-select
                v-model="updateForm.tradeScenes"
                multiple
                collapse-tags
                collapse-tags-tooltip
                placeholder="请选择交易场景"
                style="width: 100%"
              >
                <el-option
                  v-for="(label, key) in STOCK_FEE_TRADE_SCENE_LABELS"
                  :key="key"
                  :label="label"
                  :value="key"
                />
              </el-select>
            </el-form-item>
          </el-form>

          <el-divider content-position="left">新费率配置</el-divider>
          <el-form :model="updateForm" label-width="120px" class="batch-form">
            <el-form-item label="新费率值">
              <el-input-number
                v-model="updateForm.feeRateValue"
                :min="0"
                :step="0.0001"
                :precision="4"
                placeholder="请输入新费率值"
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item label="最低费用">
              <el-input-number
                v-model="updateForm.minFee"
                :min="0"
                :step="0.01"
                :precision="2"
                placeholder="请输入最低费用"
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item label="最高费用">
              <el-input-number
                v-model="updateForm.maxFee"
                :min="0"
                :step="0.01"
                :precision="2"
                placeholder="请输入最高费用"
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item label="生效范围">
              <el-radio-group v-model="updateForm.scopeType">
                <el-radio :value="StockFeeScopeType.GLOBAL">全局生效</el-radio>
                <el-radio :value="StockFeeScopeType.LOCAL">局部产品生效</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item v-if="updateForm.scopeType === StockFeeScopeType.LOCAL" label="产品类型">
              <el-select
                v-model="updateForm.productTypes"
                multiple
                collapse-tags
                collapse-tags-tooltip
                placeholder="请选择产品类型"
                style="width: 100%"
              >
                <el-option
                  v-for="(label, key) in STOCK_PRODUCT_TYPE_LABELS"
                  :key="key"
                  :label="label"
                  :value="key"
                />
              </el-select>
            </el-form-item>
          </el-form>

          <div v-if="updatePreview.length > 0" class="preview-section">
            <div class="preview-title">待更新费率预览 ({{ updatePreview.length }} 条)</div>
            <el-table
              :data="updatePreview"
              border
              max-height="260"
              class="zebra-table"
              :row-class-name="tableRowClassName"
              highlight-current-row
            >
              <el-table-column prop="feeCode" label="费率编码" width="140" />
              <el-table-column prop="feeName" label="费率名称" width="140" />
              <el-table-column prop="feeRateType" label="费率类型" width="120">
                <template #default="{ row }">
                  <el-tag :type="getFeeRateTypeTagType(row.feeRateType)" size="small">
                    {{ STOCK_FEE_RATE_TYPE_LABELS[row.feeRateType as keyof typeof STOCK_FEE_RATE_TYPE_LABELS] || row.feeRateType }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="feeRateValue" label="当前费率" width="100" align="right" />
              <el-table-column prop="customerLevel" label="客户等级" width="100">
                <template #default="{ row }">
                  {{ STOCK_FEE_CUSTOMER_LEVEL_LABELS[row.customerLevel as keyof typeof STOCK_FEE_CUSTOMER_LEVEL_LABELS] || row.customerLevel }}
                </template>
              </el-table-column>
              <el-table-column prop="tradeScene" label="交易场景" width="80">
                <template #default="{ row }">
                  {{ STOCK_FEE_TRADE_SCENE_LABELS[row.tradeScene as keyof typeof STOCK_FEE_TRADE_SCENE_LABELS] || row.tradeScene }}
                </template>
              </el-table-column>
              <el-table-column prop="scopeType" label="生效范围" width="100">
                <template #default="{ row }">
                  {{ STOCK_FEE_SCOPE_TYPE_LABELS[row.scopeType as keyof typeof STOCK_FEE_SCOPE_TYPE_LABELS] || row.scopeType }}
                </template>
              </el-table-column>
            </el-table>
          </div>
          <div class="submit-row">
            <el-button
              type="primary"
              :loading="updateLoading"
              :disabled="!canSubmitUpdate"
              @click="handleBatchUpdate"
            >
              <el-icon v-if="!updateLoading"><Loading /></el-icon>
              批量配置
            </el-button>
          </div>
        </el-tab-pane>

        <el-tab-pane label="批量激活" name="activate">
          <div class="preview-section">
            <div class="preview-title">选择待激活费率 ({{ activateSelected.length }} 条已选)</div>
            <el-table
              :data="activatePreview"
              border
              max-height="420"
              class="zebra-table"
              :row-class-name="tableRowClassName"
              highlight-current-row
              @selection-change="handleActivateSelectionChange"
            >
              <el-table-column type="selection" width="55" />
              <el-table-column prop="feeCode" label="费率编码" width="140" />
              <el-table-column prop="feeName" label="费率名称" width="140" />
              <el-table-column prop="feeRateType" label="费率类型" width="120">
                <template #default="{ row }">
                  <el-tag :type="getFeeRateTypeTagType(row.feeRateType)" size="small">
                    {{ STOCK_FEE_RATE_TYPE_LABELS[row.feeRateType as keyof typeof STOCK_FEE_RATE_TYPE_LABELS] || row.feeRateType }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="feeRateValue" label="费率值" width="100" align="right" />
              <el-table-column prop="customerLevel" label="客户等级" width="100">
                <template #default="{ row }">
                  {{ STOCK_FEE_CUSTOMER_LEVEL_LABELS[row.customerLevel as keyof typeof STOCK_FEE_CUSTOMER_LEVEL_LABELS] || row.customerLevel }}
                </template>
              </el-table-column>
              <el-table-column prop="tradeScene" label="交易场景" width="80">
                <template #default="{ row }">
                  {{ STOCK_FEE_TRADE_SCENE_LABELS[row.tradeScene as keyof typeof STOCK_FEE_TRADE_SCENE_LABELS] || row.tradeScene }}
                </template>
              </el-table-column>
              <el-table-column prop="effectiveStartTime" label="生效开始时间" width="160" />
            </el-table>
          </div>
          <div class="submit-row">
            <el-button
              type="primary"
              :loading="activateLoading"
              :disabled="activateSelected.length === 0"
              @click="handleBatchActivate"
            >
              <el-icon v-if="!activateLoading"><Loading /></el-icon>
              批量激活
            </el-button>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </FinDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage, ElTag } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import FinDialog from '@/components/common/FinDialog.vue'
import {
  STOCK_FEE_RATE_TYPE_LABELS,
  STOCK_FEE_RATE_TYPE_COLORS,
  STOCK_FEE_CUSTOMER_LEVEL_LABELS,
  STOCK_FEE_TRADE_SCENE_LABELS,
  STOCK_FEE_SCOPE_TYPE_LABELS,
  STOCK_PRODUCT_TYPE_LABELS,
} from '@/constants/dictionaries'
import {
  StockFeeRateType,
  StockFeeRateStatus,
  StockFeeCustomerLevel,
  StockFeeTradeScene,
  StockFeeScopeType,
} from '@/enums'
import * as stockFeeApi from '@/api/stockFeeRate'
import type { IStockFeeRate } from '@/types/api'

interface Props {
  visible: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'success': []
}>()

const visible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
})

const activeTab = ref('update')
const feeOptions = ref<IStockFeeRate[]>([])

const updateForm = ref<{
  feeRateTypes: StockFeeRateType[]
  customerLevels: StockFeeCustomerLevel[]
  tradeScenes: StockFeeTradeScene[]
  feeRateValue: number | null
  minFee: number | null
  maxFee: number | null
  scopeType: StockFeeScopeType
  productTypes: string[]
}>({
  feeRateTypes: [],
  customerLevels: [],
  tradeScenes: [],
  feeRateValue: null,
  minFee: null,
  maxFee: null,
  scopeType: StockFeeScopeType.GLOBAL,
  productTypes: [],
})
const updateLoading = ref(false)

const activateSelected = ref<IStockFeeRate[]>([])
const activateLoading = ref(false)

const canSubmitUpdate = computed(() => {
  const hasFilter =
    updateForm.value.feeRateTypes.length > 0 ||
    updateForm.value.customerLevels.length > 0 ||
    updateForm.value.tradeScenes.length > 0
  const hasValue =
    updateForm.value.feeRateValue !== null ||
    updateForm.value.minFee !== null ||
    updateForm.value.maxFee !== null
  const hasLocalProducts =
    updateForm.value.scopeType !== StockFeeScopeType.LOCAL ||
    updateForm.value.productTypes.length > 0
  return hasFilter && hasValue && hasLocalProducts
})

const updatePreview = computed(() => {
  return feeOptions.value.filter((item) => {
    if (updateForm.value.feeRateTypes.length > 0 && !updateForm.value.feeRateTypes.includes(item.feeRateType as StockFeeRateType)) {
      return false
    }
    if (updateForm.value.customerLevels.length > 0 && !updateForm.value.customerLevels.includes(item.customerLevel as StockFeeCustomerLevel)) {
      return false
    }
    if (updateForm.value.tradeScenes.length > 0 && !updateForm.value.tradeScenes.includes(item.tradeScene as StockFeeTradeScene)) {
      return false
    }
    if (updateForm.value.scopeType === StockFeeScopeType.LOCAL && updateForm.value.productTypes.length > 0) {
      if (!item.productType || !updateForm.value.productTypes.includes(item.productType)) {
        return false
      }
    }
    return true
  })
})

const activatePreview = computed(() => {
  return feeOptions.value.filter(
    (item) =>
      item.feeRateStatus === StockFeeRateStatus.DRAFT ||
      item.feeRateStatus === StockFeeRateStatus.PENDING,
  )
})

function tableRowClassName({ rowIndex }: { rowIndex: number }) {
  return rowIndex % 2 === 0 ? 'odd-row' : 'even-row'
}

function getFeeRateTypeTagType(type: string) {
  const colorMap: Record<string, string> = {
    [StockFeeRateType.COMMISSION]: '',
    [StockFeeRateType.STAMP_DUTY]: 'danger',
    [StockFeeRateType.TRANSFER_FEE]: 'success',
    [StockFeeRateType.SETTLEMENT_FEE]: 'warning',
    [StockFeeRateType.MANAGEMENT_FEE]: 'info',
    [StockFeeRateType.CUSTODY_FEE]: '',
  }
  return colorMap[type] || ''
}

async function loadFeeOptions() {
  try {
    const res = await stockFeeApi.getList({ page: 1, pageSize: 9999 })
    if (res.code === 0) {
      feeOptions.value = res.data.list
    }
  } catch {
    feeOptions.value = []
  }
}

watch(
  () => props.visible,
  (val) => {
    if (val) {
      loadFeeOptions()
    }
  },
)

function handleActivateSelectionChange(selection: IStockFeeRate[]) {
  activateSelected.value = selection
}

async function handleBatchUpdate() {
  if (!canSubmitUpdate.value) {
    ElMessage.warning('请完善筛选条件和新费率配置')
    return
  }
  if (updatePreview.value.length === 0) {
    ElMessage.warning('没有匹配的费率记录可更新')
    return
  }
  updateLoading.value = true
  try {
    const res = await stockFeeApi.batchUpdate({
      feeRateValue: updateForm.value.feeRateValue ?? undefined,
      minFee: updateForm.value.minFee ?? undefined,
      maxFee: updateForm.value.maxFee ?? undefined,
      productType:
        updateForm.value.scopeType === StockFeeScopeType.LOCAL
          ? updateForm.value.productTypes.join(',')
          : undefined,
      customerLevel:
        updateForm.value.customerLevels.length > 0
          ? updateForm.value.customerLevels.join(',')
          : undefined,
      tradeScene:
        updateForm.value.tradeScenes.length > 0
          ? updateForm.value.tradeScenes.join(',')
          : undefined,
      scopeType: updateForm.value.scopeType,
    })
    if (res.code === 0) {
      ElMessage.success('批量配置完成，费率明细已局部刷新')
      emit('success')
      resetUpdateForm()
    } else {
      ElMessage.error(res.message || '批量配置失败')
    }
  } catch (err: any) {
    ElMessage.error(err.message || '批量配置失败')
  } finally {
    updateLoading.value = false
  }
}

async function handleBatchActivate() {
  if (activateSelected.value.length === 0) {
    ElMessage.warning('请选择待激活的费率')
    return
  }
  activateLoading.value = true
  try {
    const ids = activateSelected.value.map((item) => item.id)
    const res = await stockFeeApi.batchActivate(ids)
    if (res.code === 0) {
      ElMessage.success(`批量激活完成，共激活 ${res.data.success} 条费率，费率明细已局部刷新`)
      emit('success')
      resetActivateForm()
    } else {
      ElMessage.error(res.message || '批量激活失败')
    }
  } catch (err: any) {
    ElMessage.error(err.message || '批量激活失败')
  } finally {
    activateLoading.value = false
  }
}

function resetUpdateForm() {
  updateForm.value = {
    feeRateTypes: [],
    customerLevels: [],
    tradeScenes: [],
    feeRateValue: null,
    minFee: null,
    maxFee: null,
    scopeType: StockFeeScopeType.GLOBAL,
    productTypes: [],
  }
}

function resetActivateForm() {
  activateSelected.value = []
}

function handleClosed() {
  activeTab.value = 'update'
  resetUpdateForm()
  resetActivateForm()
}
</script>

<style lang="scss" scoped>
.batch-container {
  min-height: 400px;
}

.batch-form {
  margin-top: 16px;
}

.preview-section {
  margin-top: 20px;

  .preview-title {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 12px;
  }
}

.submit-row {
  margin-top: 20px;
  text-align: right;
}

.text-muted {
  color: #c0c4cc;
}

.text-danger {
  color: #f56c6c;
  font-weight: 600;
}

.zebra-table {
  :deep(.el-table__body tr:nth-child(odd)) {
    background-color: #ffffff;
  }

  :deep(.el-table__body tr:nth-child(even)) {
    background-color: #f7faff;
  }

  :deep(.el-table__body tr:hover) {
    background-color: #e6f2ff !important;
  }

  :deep(.el-table__body tr.current-row) {
    background-color: #d9ecff !important;
  }
}
</style>
