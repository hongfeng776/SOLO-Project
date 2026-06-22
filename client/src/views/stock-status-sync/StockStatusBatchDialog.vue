<template>
  <FinDialog
    v-model:visible="visible"
    title="股票状态批量同步"
    width="980px"
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <div class="batch-container">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="公告批量同步" name="announcement">
          <el-alert
            type="warning"
            :closable="false"
            show-icon
            title="批量同步过程中产品数据已锁定，防止篡改"
            class="lock-alert"
          />
          <div class="table-section">
            <div class="summary-bar">
              <span class="summary-text">已选择 {{ announcementSelected.length }} 条公告</span>
              <div class="action-buttons">
                <el-button size="small" :icon="Check" :disabled="unsyncedAnnouncements.length === 0" @click="handleSelectAll">全选</el-button>
                <el-button size="small" :icon="CircleClose" :disabled="announcementSelected.length === 0" @click="handleClearSelection">清空选择</el-button>
                <el-button
                  type="primary"
                  size="small"
                  :icon="RefreshRight"
                  :loading="announcementLoading"
                  :disabled="announcementSelected.length === 0"
                  @click="handleBatchSyncAnnouncements"
                >
                  <el-icon v-if="!announcementLoading"><RefreshRight /></el-icon>
                  批量同步
                </el-button>
              </div>
            </div>
            <el-table
              ref="announcementTableRef"
              :data="unsyncedAnnouncements"
              border
              max-height="340"
              class="highlight-table"
              highlight-current-row
              :row-class-name="announcementRowClassName"
              @selection-change="handleAnnouncementSelectionChange"
              v-loading="announcementListLoading"
            >
              <el-table-column type="selection" width="55" />
              <el-table-column label="" width="6">
                <template #default="{ row }">
                  <div class="row-indicator" :class="{ active: isAnnouncementSelected(row) }"></div>
                </template>
              </el-table-column>
              <el-table-column prop="announcementCode" label="公告编码" width="140" />
              <el-table-column prop="announcementTitle" label="公告标题" min-width="200" show-overflow-tooltip />
              <el-table-column prop="exchange" label="交易所" width="100">
                <template #default="{ row }">
                  {{ STOCK_STATUS_SYNC_SOURCE_LABELS[row.exchange as keyof typeof STOCK_STATUS_SYNC_SOURCE_LABELS] || row.exchange }}
                </template>
              </el-table-column>
              <el-table-column prop="stockCode" label="股票代码" width="100" />
              <el-table-column prop="stockName" label="股票名称" width="120" />
              <el-table-column prop="publishTime" label="发布时间" width="160" />
              <el-table-column prop="targetStatus" label="目标状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="STOCK_PRODUCT_STATUS_TAG_TYPES[row.targetStatus as keyof typeof STOCK_PRODUCT_STATUS_TAG_TYPES]" size="small">
                    {{ STOCK_PRODUCT_STATUS_LABELS[row.targetStatus as keyof typeof STOCK_PRODUCT_STATUS_LABELS] || row.targetStatus }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <div v-if="announcementResult" class="result-section">
            <el-divider content-position="left">同步结果汇总</el-divider>
            <div class="result-summary">
              <el-statistic title="总数" :value="announcementResult.total" />
              <el-statistic title="已校验" :value="announcementResult.validated" />
              <el-statistic title="成功" :value="announcementResult.success">
                <template #prefix><el-icon style="color: #67C23A"><Check /></el-icon></template>
              </el-statistic>
              <el-statistic title="失败" :value="announcementResult.failed">
                <template #prefix><el-icon style="color: #F56C6C"><CircleClose /></el-icon></template>
              </el-statistic>
              <el-statistic title="跳过" :value="announcementResult.skipped" />
            </div>
            <div v-if="announcementResult.errorList && announcementResult.errorList.length > 0" class="error-list">
              <div class="error-list-title">失败明细 ({{ announcementResult.errorList.length }} 条)</div>
              <el-table :data="announcementResult.errorList" border max-height="200" size="small">
                <el-table-column prop="stockCode" label="股票代码" width="100" />
                <el-table-column prop="stockName" label="股票名称" width="120" />
                <el-table-column prop="errorCode" label="错误码" width="120" />
                <el-table-column prop="errorMessage" label="错误信息" min-width="200" show-overflow-tooltip />
                <el-table-column prop="announcementMissing" label="缺失公告" width="80">
                  <template #default="{ row }">
                    <el-tag v-if="row.announcementMissing" type="danger" size="small">是</el-tag>
                    <el-tag v-else size="small">否</el-tag>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="手动批量更新" name="manual">
          <el-divider content-position="left">批量配置</el-divider>
          <el-form :model="manualForm" label-width="120px" class="batch-form">
            <el-form-item label="目标状态">
              <el-select v-model="manualForm.targetStatus" placeholder="请选择目标状态" style="width: 320px">
                <el-option
                  v-for="(label, key) in STOCK_PRODUCT_STATUS_LABELS"
                  :key="key"
                  :label="label"
                  :value="key"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="数据来源">
              <el-select v-model="manualForm.syncSource" disabled style="width: 320px">
                <el-option :label="STOCK_STATUS_SYNC_SOURCE_LABELS[StockStatusSyncSource.MANUAL]" :value="StockStatusSyncSource.MANUAL" />
              </el-select>
            </el-form-item>
            <el-form-item label="生效时间">
              <el-date-picker
                v-model="manualForm.effectiveTime"
                type="datetime"
                placeholder="请选择生效时间"
                style="width: 320px"
                value-format="YYYY-MM-DD HH:mm:ss"
              />
            </el-form-item>
            <el-form-item label="选择股票">
              <el-select
                v-model="manualForm.stockCodes"
                multiple
                filterable
                collapse-tags
                collapse-tags-tooltip
                placeholder="请选择股票"
                style="width: 100%"
                :loading="stockListLoading"
              >
                <el-option
                  v-for="stock in stockOptions"
                  :key="stock.stockCode"
                  :label="`${stock.stockCode} - ${stock.stockName}`"
                  :value="stock.stockCode"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="批量输入">
              <el-input
                v-model="manualForm.stockCodesText"
                type="textarea"
                :rows="3"
                placeholder="请输入股票代码，每行一个"
                @blur="handleStockCodesTextBlur"
              />
            </el-form-item>
          </el-form>

          <div v-if="manualPreview.length > 0" class="preview-section">
            <el-divider content-position="left">匹配预览 ({{ manualPreview.length }} 条)</el-divider>
            <el-table
              :data="manualPreview"
              border
              max-height="260"
              class="highlight-table"
              highlight-current-row
              :row-class-name="manualRowClassName"
            >
              <el-table-column prop="stockCode" label="股票代码" width="100" />
              <el-table-column prop="stockName" label="股票名称" width="140" />
              <el-table-column prop="currentStatus" label="当前状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="STOCK_PRODUCT_STATUS_TAG_TYPES[row.currentStatus as keyof typeof STOCK_PRODUCT_STATUS_TAG_TYPES]" size="small">
                    {{ STOCK_PRODUCT_STATUS_LABELS[row.currentStatus as keyof typeof STOCK_PRODUCT_STATUS_LABELS] || row.currentStatus }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="targetStatus" label="目标状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="STOCK_PRODUCT_STATUS_TAG_TYPES[row.targetStatus as keyof typeof STOCK_PRODUCT_STATUS_TAG_TYPES]" size="small">
                    {{ STOCK_PRODUCT_STATUS_LABELS[row.targetStatus as keyof typeof STOCK_PRODUCT_STATUS_LABELS] || row.targetStatus }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="canTransition" label="可变更" width="80">
                <template #default="{ row }">
                  <el-tag v-if="row.canTransition" type="success" size="small">是</el-tag>
                  <el-tag v-else type="danger" size="small">否</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="transitionNote" label="备注" min-width="200" show-overflow-tooltip />
            </el-table>
          </div>
          <div class="submit-row">
            <el-button
              type="primary"
              :loading="manualLoading"
              :disabled="!canSubmitManual"
              @click="handleBatchManualSync"
            >
              <el-icon v-if="!manualLoading"><Loading /></el-icon>
              提交批量更新
            </el-button>
          </div>

          <div v-if="manualResult" class="result-section">
            <el-divider content-position="left">更新结果汇总</el-divider>
            <div class="result-summary">
              <el-statistic title="总数" :value="manualResult.total" />
              <el-statistic title="已校验" :value="manualResult.validated" />
              <el-statistic title="成功" :value="manualResult.success">
                <template #prefix><el-icon style="color: #67C23A"><Check /></el-icon></template>
              </el-statistic>
              <el-statistic title="失败" :value="manualResult.failed">
                <template #prefix><el-icon style="color: #F56C6C"><CircleClose /></el-icon></template>
              </el-statistic>
              <el-statistic title="跳过" :value="manualResult.skipped" />
            </div>
            <div v-if="manualResult.errorList && manualResult.errorList.length > 0" class="error-list">
              <div class="error-list-title">失败明细 ({{ manualResult.errorList.length }} 条)</div>
              <el-table :data="manualResult.errorList" border max-height="200" size="small">
                <el-table-column prop="stockCode" label="股票代码" width="100" />
                <el-table-column prop="stockName" label="股票名称" width="120" />
                <el-table-column prop="errorCode" label="错误码" width="120" />
                <el-table-column prop="errorMessage" label="错误信息" min-width="200" show-overflow-tooltip />
              </el-table>
            </div>
            <div v-if="manualResult.skippedList && manualResult.skippedList.length > 0" class="error-list">
              <div class="error-list-title">跳过明细 ({{ manualResult.skippedList.length }} 条)</div>
              <el-table :data="manualResult.skippedList" border max-height="200" size="small">
                <el-table-column prop="stockCode" label="股票代码" width="100" />
                <el-table-column prop="stockName" label="股票名称" width="120" />
                <el-table-column prop="currentStatus" label="当前状态" width="100" />
                <el-table-column prop="reason" label="跳过原因" min-width="200" show-overflow-tooltip />
              </el-table>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </FinDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Loading, RefreshRight, Check, CircleClose } from '@element-plus/icons-vue'
import FinDialog from '@/components/common/FinDialog.vue'
import {
  STOCK_PRODUCT_STATUS_LABELS,
  STOCK_PRODUCT_STATUS_TAG_TYPES,
  STOCK_STATUS_SYNC_SOURCE_LABELS,
  STOCK_STATUS_RISK_LEVEL_LABELS,
  STOCK_STATUS_RISK_LEVEL_COLORS,
  STOCK_STATUS_RISK_LEVEL_TAG_TYPES,
  STOCK_STATUS_TRANSITION_RULES,
} from '@/constants/dictionaries'
import {
  StockProductStatus,
  StockStatusSyncSource,
  StockStatusRiskLevel,
} from '@/enums'
import * as statusSyncApi from '@/api/stockStatusSync'
import type { IStockStatusAnnouncement, IStockStatusBatchResult } from '@/types/api'

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

const activeTab = ref('announcement')
const unsyncedAnnouncements = ref<IStockStatusAnnouncement[]>([])
const announcementSelected = ref<IStockStatusAnnouncement[]>([])
const announcementTableRef = ref<any>(null)
const announcementListLoading = ref(false)
const announcementLoading = ref(false)
const announcementResult = ref<IStockStatusBatchResult | null>(null)
const announcementAnimatedRows = ref<Set<number>>(new Set())

const stockOptions = ref<Array<{ stockCode: string; stockName: string; currentStatus: string }>>([])
const stockListLoading = ref(false)
const manualLoading = ref(false)
const manualResult = ref<IStockStatusBatchResult | null>(null)
const manualAnimatedRows = ref<Set<number>>(new Set())

const manualForm = ref<{
  targetStatus: StockProductStatus | ''
  syncSource: StockStatusSyncSource
  effectiveTime: string | null
  stockCodes: string[]
  stockCodesText: string
}>({
  targetStatus: '',
  syncSource: StockStatusSyncSource.MANUAL,
  effectiveTime: null,
  stockCodes: [],
  stockCodesText: '',
})

const canSubmitManual = computed(() => {
  return (
    manualForm.value.targetStatus !== '' &&
    manualForm.value.stockCodes.length > 0
  )
})

const manualPreview = computed(() => {
  if (manualForm.value.targetStatus === '') return []
  const target = manualForm.value.targetStatus
  const rules = STOCK_STATUS_TRANSITION_RULES[target] || []
  return stockOptions.value
    .filter((s) => manualForm.value.stockCodes.includes(s.stockCode))
    .map((stock) => {
      const fromStatus = stock.currentStatus
      const canTransition = rules.includes(fromStatus)
      let transitionNote = ''
      if (fromStatus === target) {
        transitionNote = '当前状态与目标状态相同，将跳过'
      } else if (!canTransition) {
        transitionNote = `不允许从 ${STOCK_PRODUCT_STATUS_LABELS[fromStatus as keyof typeof STOCK_PRODUCT_STATUS_LABELS] || fromStatus} 变更到目标状态`
      }
      return {
        stockCode: stock.stockCode,
        stockName: stock.stockName,
        currentStatus: fromStatus,
        targetStatus: target,
        canTransition,
        transitionNote,
      }
    })
})

function announcementRowClassName({ row, rowIndex }: { row: IStockStatusAnnouncement; rowIndex: number }) {
  const classes: string[] = []
  if (rowIndex % 2 === 1) classes.push('odd-row')
  if (isAnnouncementSelected(row)) classes.push('selected-row')
  if (announcementAnimatedRows.value.has(row.id)) classes.push('row-pulse')
  return classes.join(' ')
}

function manualRowClassName({ row, rowIndex }: { row: any; rowIndex: number }) {
  const classes: string[] = []
  if (rowIndex % 2 === 1) classes.push('odd-row')
  return classes.join(' ')
}

function isAnnouncementSelected(row: IStockStatusAnnouncement): boolean {
  return announcementSelected.value.some((s) => s.id === row.id)
}

function handleAnnouncementSelectionChange(selection: IStockStatusAnnouncement[]) {
  const oldSelectedIds = new Set(announcementSelected.value.map((s) => s.id))
  const newSelectedIds = new Set(selection.map((s) => s.id))
  const newlySelected = selection.filter((s) => !oldSelectedIds.has(s.id))
  newlySelected.forEach((s) => {
    announcementAnimatedRows.value.add(s.id)
    setTimeout(() => {
      announcementAnimatedRows.value.delete(s.id)
    }, 600)
  })
  announcementSelected.value = selection
}

function handleSelectAll() {
  if (announcementTableRef.value) {
    announcementTableRef.value.toggleAllSelection()
  }
}

function handleClearSelection() {
  if (announcementTableRef.value) {
    announcementTableRef.value.clearSelection()
  }
}

async function handleBatchSyncAnnouncements() {
  if (announcementSelected.value.length === 0) {
    ElMessage.warning('请选择待同步的公告')
    return
  }
  announcementLoading.value = true
  try {
    const ids = announcementSelected.value.map((item) => String(item.id))
    const res = await statusSyncApi.batchSyncAnnouncements({ announcementIds: ids })
    if (res.code === 0) {
      announcementResult.value = res.data
      ElMessage.success('批量同步完成，产品状态列表已局部刷新')
      emit('success')
      loadUnsyncedAnnouncements()
    } else {
      ElMessage.error(res.message || '批量同步失败')
    }
  } catch (err: any) {
    ElMessage.error(err.message || '批量同步失败')
  } finally {
    announcementLoading.value = false
  }
}

function handleStockCodesTextBlur() {
  if (!manualForm.value.stockCodesText.trim()) return
  const codes = manualForm.value.stockCodesText
    .split('\n')
    .map((c) => c.trim())
    .filter((c) => c)
  const existing = new Set(manualForm.value.stockCodes)
  codes.forEach((code) => {
    const matched = stockOptions.value.find((s) => s.stockCode === code)
    if (matched && !existing.has(code)) {
      existing.add(code)
    }
  })
  manualForm.value.stockCodes = Array.from(existing)
}

async function handleBatchManualSync() {
  if (!canSubmitManual.value) {
    ElMessage.warning('请完善目标状态和股票选择')
    return
  }
  manualLoading.value = true
  try {
    const res = await statusSyncApi.batchManualSync({
      stockCodes: manualForm.value.stockCodes,
      targetStatus: manualForm.value.targetStatus,
      syncSource: manualForm.value.syncSource,
      effectiveTime: manualForm.value.effectiveTime ?? undefined,
    })
    if (res.code === 0) {
      manualResult.value = res.data
      if (res.data.listRefreshPartial) {
        ElMessage.success('批量更新完成，产品状态列表已局部刷新')
      } else {
        ElMessage.success('批量更新完成')
      }
      emit('success')
      loadStockOptions()
    } else {
      ElMessage.error(res.message || '批量更新失败')
    }
  } catch (err: any) {
    ElMessage.error(err.message || '批量更新失败')
  } finally {
    manualLoading.value = false
  }
}

async function loadUnsyncedAnnouncements() {
  announcementListLoading.value = true
  try {
    const res = await statusSyncApi.getUnsyncedAnnouncements()
    if (res.code === 0) {
      unsyncedAnnouncements.value = res.data
    } else {
      unsyncedAnnouncements.value = []
    }
  } catch {
    unsyncedAnnouncements.value = []
  } finally {
    announcementListLoading.value = false
  }
}

async function loadStockOptions() {
  stockListLoading.value = true
  try {
    const res = await statusSyncApi.getSyncRecords({ page: 1, pageSize: 9999 })
    if (res.code === 0) {
      const map = new Map<string, { stockCode: string; stockName: string; currentStatus: string }>()
      res.data.list.forEach((record) => {
        if (!map.has(record.stockCode)) {
          map.set(record.stockCode, {
            stockCode: record.stockCode,
            stockName: record.stockName,
            currentStatus: record.toStatus,
          })
        }
      })
      if (map.size === 0) {
        for (let i = 1; i <= 20; i++) {
          const code = `600${String(i).padStart(3, '0')}`
          map.set(code, {
            stockCode: code,
            stockName: `示例股票${i}`,
            currentStatus: StockProductStatus.NORMAL,
          })
        }
      }
      stockOptions.value = Array.from(map.values())
    }
  } catch {
    stockOptions.value = []
  } finally {
    stockListLoading.value = false
  }
}

function resetAnnouncementForm() {
  announcementSelected.value = []
  announcementResult.value = null
  announcementAnimatedRows.value.clear()
}

function resetManualForm() {
  manualForm.value = {
    targetStatus: '',
    syncSource: StockStatusSyncSource.MANUAL,
    effectiveTime: null,
    stockCodes: [],
    stockCodesText: '',
  }
  manualResult.value = null
  manualAnimatedRows.value.clear()
}

function handleClosed() {
  activeTab.value = 'announcement'
  resetAnnouncementForm()
  resetManualForm()
}

watch(
  () => props.visible,
  (val) => {
    if (val) {
      nextTick(() => {
        loadUnsyncedAnnouncements()
        loadStockOptions()
      })
    }
  },
)
</script>

<style lang="scss" scoped>
.batch-container {
  min-height: 400px;
}

.lock-alert {
  margin-bottom: 16px;
}

.table-section {
  margin-top: 16px;
}

.summary-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 0 4px;

  .summary-text {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
  }

  .action-buttons {
    display: flex;
    gap: 8px;
  }
}

.batch-form {
  margin-top: 16px;
}

.preview-section {
  margin-top: 20px;
}

.submit-row {
  margin-top: 20px;
  text-align: right;
}

.result-section {
  margin-top: 20px;

  .result-summary {
    display: flex;
    gap: 32px;
    padding: 16px;
    background: #f7faff;
    border-radius: 8px;
    margin-bottom: 16px;
  }

  .error-list {
    margin-top: 16px;

    .error-list-title {
      font-size: 14px;
      font-weight: 600;
      color: #f56c6c;
      margin-bottom: 8px;
    }
  }
}

.highlight-table {
  .row-indicator {
    width: 3px;
    height: 20px;
    background: transparent;
    border-radius: 2px;
    transition: all 0.3s;

    &.active {
      background: #409eff;
    }
  }

  :deep(.el-table__body tr.odd-row) {
    background-color: #f7faff;
  }

  :deep(.el-table__body tr.selected-row) {
    background-color: #ecf5ff !important;
  }

  :deep(.el-table__body tr.selected-row td) {
    background-color: #ecf5ff !important;
  }

  :deep(.el-table__body tr.selected-row:hover) {
    background-color: #d9ecff !important;
  }

  :deep(.el-table__body tr.current-row) {
    background-color: #e1f3d8 !important;
  }

  :deep(.el-table__body tr.row-pulse) {
    animation: rowPulse 0.6s ease-out;
  }
}

@keyframes rowPulse {
  0% {
    background-color: #fff;
  }

  50% {
    background-color: #e6f2ff;
  }

  100% {
    background-color: #ecf5ff;
  }
}
</style>
