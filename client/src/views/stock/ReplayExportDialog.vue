<template>
  <el-dialog
    :model-value="modelValue"
    title="批量导出复盘数据"
    width="780px"
    :close-on-click-modal="!exporting"
    @update:model-value="handleDialogToggle"
  >
    <div class="export-scope-section">
      <div class="section-label">导出范围</div>
      <div class="scope-stock-codes">
        <el-tag
          v-for="code in localStockCodes"
          :key="code"
          closable
          :disable-transitions="false"
          @close="handleRemoveCode(code)"
        >
          {{ code }}
        </el-tag>
        <span v-if="localStockCodes.length === 0" class="empty-hint">暂无已选股票</span>
      </div>
      <div class="scope-date-range">
        <span class="scope-date-label">时间范围：</span>
        <span>{{ dateRange[0] }} ~ {{ dateRange[1] }}</span>
      </div>
      <div class="scope-summary">
        已选择 <strong>{{ localStockCodes.length }}</strong> 支股票，
        <strong>{{ dayCount }}</strong> 天数据
      </div>
    </div>

    <div class="export-config-section">
      <div class="section-label">自定义导出配置</div>

      <div class="config-row">
        <span class="config-label">导出字段：</span>
        <el-checkbox-group v-model="selectedFields" class="field-checkbox-group">
          <el-checkbox
            v-for="field in fieldOptions"
            :key="field.value"
            :value="field.value"
            :label="field.label"
          />
        </el-checkbox-group>
      </div>

      <div class="quick-select-btns">
        <el-button size="small" @click="handleQuickSelect('price')">仅价格</el-button>
        <el-button size="small" @click="handleQuickSelect('change')">仅涨跌</el-button>
        <el-button size="small" @click="handleQuickSelect('all')">全选</el-button>
        <el-button size="small" @click="handleQuickSelect('none')">取消全选</el-button>
      </div>

      <div class="config-row">
        <span class="config-label">排序规则：</span>
        <el-select v-model="orderBy" placeholder="请选择排序规则" style="width: 240px">
          <el-option
            v-for="opt in orderByOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
      </div>

      <div class="config-row">
        <span class="config-label">导出格式：</span>
        <el-radio-group v-model="format">
          <el-radio value="csv">CSV</el-radio>
          <el-radio value="xlsx">XLSX</el-radio>
        </el-radio-group>
      </div>
    </div>

    <div class="permission-notice">
      <template v-if="!isAdmin">
        <el-alert type="info" :closable="false" show-icon>
          普通用户仅可导出基础行情数据
        </el-alert>
      </template>
      <template v-else>
        <el-alert type="success" :closable="false" show-icon>
          管理员可导出含溯源信息的完整数据（操作日志、录入人员、数据来源等）
        </el-alert>
      </template>
    </div>

    <div v-if="exporting" class="export-progress">
      <el-progress :percentage="exportProgress" :stroke-width="6" />
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button
          type="primary"
          :loading="exporting && !fullExporting"
          :disabled="localStockCodes.length === 0 || selectedFields.length === 0"
          @click="handleExport(false)"
        >
          导出基础数据
        </el-button>
        <el-button
          v-if="isAdmin"
          v-permission="'stock:replay:export:full'"
          type="success"
          :loading="exporting && fullExporting"
          :disabled="localStockCodes.length === 0 || selectedFields.length === 0"
          @click="handleExport(true)"
        >
          导出完整数据（含溯源）
        </el-button>
      </div>
    </template>
  </el-dialog>

  <div
    class="back-to-top"
    :class="{ 'back-to-top-visible': showBackToTop }"
    @click="handleBackToTop"
  >
    ↑
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { exportReplayData } from '@/api/replay'
import type { IReplayExportParams } from '@/types/api'

type ExportFormat = 'csv' | 'xlsx'

const props = defineProps<{
  modelValue: boolean
  stockCodes: string[]
  dateRange: [string, string]
  isAdmin: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  exported: []
}>()

const fieldOptions: Array<{ value: string; label: string }> = [
  { value: 'tradeDate', label: '交易日期' },
  { value: 'stockCode', label: '股票代码' },
  { value: 'stockName', label: '股票名称' },
  { value: 'openPrice', label: '开盘价' },
  { value: 'closePrice', label: '收盘价' },
  { value: 'highPrice', label: '最高价' },
  { value: 'lowPrice', label: '最低价' },
  { value: 'changeAmount', label: '涨跌额' },
  { value: 'changeRate', label: '涨跌幅' },
  { value: 'volume', label: '成交量' },
  { value: 'turnover', label: '成交额' },
  { value: 'replayStatus', label: '复盘状态' },
]

const allFieldValues = fieldOptions.map(f => f.value)
const priceFields = ['openPrice', 'closePrice', 'highPrice', 'lowPrice']
const changeFields = ['changeAmount', 'changeRate']

const orderByOptions: Array<{ value: string; label: string }> = [
  { value: 'date_asc', label: '按日期升序' },
  { value: 'date_desc', label: '按日期降序' },
  { value: 'changeRate_asc', label: '按涨跌幅升序' },
  { value: 'changeRate_desc', label: '按涨跌幅降序' },
  { value: 'volume_desc', label: '按成交量降序' },
]

const localStockCodes = ref<string[]>([...props.stockCodes])
const selectedFields = ref<string[]>([...allFieldValues])
const orderBy = ref<string>('date_asc')
const format = ref<ExportFormat>('xlsx')
const exporting = ref(false)
const fullExporting = ref(false)
const exportProgress = ref(0)
const showBackToTop = ref(false)

let progressTimer: ReturnType<typeof setTimeout> | null = null

watch(
  () => props.stockCodes,
  (newCodes) => {
    localStockCodes.value = [...newCodes]
  },
)

const dayCount = computed(() => {
  const start = dayjs(props.dateRange[0])
  const end = dayjs(props.dateRange[1])
  return Math.max(end.diff(start, 'day') + 1, 0)
})

function handleDialogToggle(val: boolean) {
  emit('update:modelValue', val)
}

function handleClose() {
  if (exporting.value) return
  emit('update:modelValue', false)
}

function handleRemoveCode(code: string) {
  localStockCodes.value = localStockCodes.value.filter(c => c !== code)
}

function handleQuickSelect(type: 'price' | 'change' | 'all' | 'none') {
  switch (type) {
    case 'price':
      selectedFields.value = [...priceFields]
      break
    case 'change':
      selectedFields.value = [...changeFields]
      break
    case 'all':
      selectedFields.value = [...allFieldValues]
      break
    case 'none':
      selectedFields.value = []
      break
  }
}

function simulateProgress() {
  return new Promise<void>((resolve) => {
    exportProgress.value = 0
    const tick = () => {
      if (exportProgress.value >= 90) {
        resolve()
        return
      }
      exportProgress.value = Math.min(exportProgress.value + 5, 90)
      progressTimer = setTimeout(tick, 200)
    }
    tick()
  })
}

async function handleExport(isFullExport: boolean) {
  if (localStockCodes.value.length === 0) {
    ElMessage.warning('请至少选择一支股票')
    return
  }
  if (selectedFields.value.length === 0) {
    ElMessage.warning('请至少选择一个导出字段')
    return
  }

  exporting.value = true
  fullExporting.value = isFullExport

  const progressPromise = simulateProgress()

  try {
    const params: IReplayExportParams = {
      stockCodes: localStockCodes.value,
      startDate: props.dateRange[0],
      endDate: props.dateRange[1],
      fields: selectedFields.value,
      orderBy: orderBy.value,
      isFullExport,
      format: format.value,
    }

    const blob = await exportReplayData(params)

    await progressPromise
    exportProgress.value = 100

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const timestamp = dayjs().format('YYYYMMDD_HHmmss')
    link.download = `行情复盘数据_${timestamp}.${format.value}`
    link.click()
    URL.revokeObjectURL(url)

    ElMessage.success('导出完成')
    emit('exported')
  } catch (err: unknown) {
    await progressPromise
    const message = err instanceof Error ? err.message : '未知错误'
    ElMessage.error(`导出失败：${message}`)
  } finally {
    setTimeout(() => {
      exporting.value = false
      fullExporting.value = false
      exportProgress.value = 0
      if (progressTimer !== null) {
        clearTimeout(progressTimer)
        progressTimer = null
      }
    }, 1000)
  }
}

function handleScroll() {
  showBackToTop.value = window.scrollY > 500
}

function handleBackToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
  if (progressTimer !== null) {
    clearTimeout(progressTimer)
    progressTimer = null
  }
})
</script>

<style lang="scss" scoped>
.export-scope-section {
  border-bottom: 1px solid #EBEEF5;
  padding-bottom: 16px;
  margin-bottom: 16px;

  .section-label {
    font-weight: 600;
    font-size: 14px;
    color: #303133;
    margin-bottom: 12px;
  }

  .scope-stock-codes {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 10px;

    .empty-hint {
      color: #909399;
      font-size: 13px;
    }
  }

  .scope-date-range {
    font-size: 13px;
    color: #606266;
    margin-bottom: 8px;

    .scope-date-label {
      font-weight: 500;
    }
  }

  .scope-summary {
    font-size: 13px;
    color: #909399;

    strong {
      color: #1A3A5C;
    }
  }
}

.export-config-section {
  padding: 16px 0;

  .section-label {
    font-weight: 600;
    font-size: 14px;
    color: #303133;
    margin-bottom: 12px;
  }

  .config-row {
    display: flex;
    align-items: flex-start;
    margin-bottom: 14px;

    .config-label {
      font-size: 13px;
      color: #606266;
      font-weight: 500;
      min-width: 72px;
      line-height: 32px;
      flex-shrink: 0;
    }
  }

  .field-checkbox-group {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .quick-select-btns {
    display: flex;
    gap: 8px;
    margin-top: 8px;
    margin-left: 72px;
    margin-bottom: 8px;
  }
}

.permission-notice {
  margin-top: 12px;
}

.export-progress {
  margin-top: 16px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.back-to-top {
  position: fixed;
  right: 32px;
  bottom: 32px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #1A3A5C;
  color: #fff;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  transition: all 0.3s;
  transform: translateY(60px);
  opacity: 0;
  z-index: 2000;

  &:hover {
    background: #2a5a8c;
  }

  &.back-to-top-visible {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
