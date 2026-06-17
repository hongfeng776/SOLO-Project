<template>
  <div class="threshold-batch-panel" :class="{ 'batch-panel-locked': lockPanel }">
    <div class="panel-header">
      <div class="header-left">
        <el-radio-group v-model="scopeType" :disabled="lockPanel" @change="handleScopeTypeChange">
          <el-radio-button label="global">全局生效</el-radio-button>
          <el-radio-button label="sector">仅局部板块</el-radio-button>
        </el-radio-group>
        <el-select
          v-if="scopeType === 'sector'"
          v-model="selectedSectors"
          multiple
          collapse-tags
          collapse-tags-tooltip
          placeholder="请选择板块（至少1个）"
          :disabled="lockPanel"
          style="width: 280px; margin-left: 12px"
        >
          <el-option
            v-for="sector in MARKET_SECTOR_LIST"
            :key="sector"
            :label="sector"
            :value="sector"
          />
        </el-select>
      </div>

      <div class="header-center">
        <el-checkbox-group v-model="selectedTypes" :disabled="lockPanel">
          <el-checkbox label="change_rate">涨跌幅</el-checkbox>
          <el-checkbox label="volume">成交量</el-checkbox>
          <el-checkbox label="turnover">换手率</el-checkbox>
        </el-checkbox-group>
      </div>

      <div class="header-right">
        <el-button
          type="primary"
          :icon="List"
          :disabled="!canModifyBatch || lockPanel"
          @click="handleOpenConfig"
        >
          批量修改
        </el-button>
      </div>
    </div>

    <el-collapse v-model="activeCollapseNames" class="config-collapse">
      <el-collapse-item title="批量配置" name="config">
        <div v-if="lockPanel" class="skeleton-wrapper">
          <el-skeleton :rows="6" animated />
        </div>
        <el-form v-else ref="configFormRef" :model="formData" label-width="110px" :disabled="lockPanel">
          <el-row :gutter="16">
            <el-col :span="8">
              <el-form-item label="最小值">
                <div class="field-wrapper">
                  <el-checkbox v-model="patchFields.minValue" :disabled="lockPanel" class="field-checkbox">
                    修改此字段
                  </el-checkbox>
                  <el-input-number
                    v-model="formData.minValue"
                    :disabled="!patchFields.minValue || lockPanel"
                    :controls="false"
                    :precision="4"
                    style="width: 100%"
                  />
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="最大值">
                <div class="field-wrapper">
                  <el-checkbox v-model="patchFields.maxValue" :disabled="lockPanel" class="field-checkbox">
                    修改此字段
                  </el-checkbox>
                  <el-input-number
                    v-model="formData.maxValue"
                    :disabled="!patchFields.maxValue || lockPanel"
                    :controls="false"
                    :precision="4"
                    style="width: 100%"
                  />
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="预警阈值">
                <div class="field-wrapper">
                  <el-checkbox v-model="patchFields.warningThreshold" :disabled="lockPanel" class="field-checkbox">
                    修改此字段
                  </el-checkbox>
                  <el-input-number
                    v-model="formData.warningThreshold"
                    :disabled="!patchFields.warningThreshold || lockPanel"
                    :controls="false"
                    :precision="4"
                    style="width: 100%"
                  />
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="触发阈值">
                <div class="field-wrapper">
                  <el-checkbox v-model="patchFields.triggerThreshold" :disabled="lockPanel" class="field-checkbox">
                    修改此字段
                  </el-checkbox>
                  <el-input-number
                    v-model="formData.triggerThreshold"
                    :disabled="!patchFields.triggerThreshold || lockPanel"
                    :controls="false"
                    :precision="4"
                    style="width: 100%"
                  />
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="配置状态">
                <div class="field-wrapper">
                  <el-checkbox v-model="patchFields.configStatus" :disabled="lockPanel" class="field-checkbox">
                    修改此字段
                  </el-checkbox>
                  <el-select
                    v-model="formData.configStatus"
                    :disabled="!patchFields.configStatus || lockPanel"
                    style="width: 100%"
                  >
                    <el-option label="永久生效" value="permanent" />
                    <el-option label="临时生效" value="temporary" />
                    <el-option label="已过期" value="expired" />
                  </el-select>
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="生效开始">
                <div class="field-wrapper">
                  <el-checkbox v-model="patchFields.effectiveStart" :disabled="lockPanel" class="field-checkbox">
                    修改此字段
                  </el-checkbox>
                  <el-date-picker
                    v-model="formData.effectiveStart"
                    type="datetime"
                    placeholder="选择开始时间"
                    value-format="YYYY-MM-DD HH:mm:ss"
                    :disabled="!patchFields.effectiveStart || lockPanel"
                    style="width: 100%"
                  />
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="生效结束">
                <div class="field-wrapper">
                  <el-checkbox v-model="patchFields.effectiveEnd" :disabled="lockPanel" class="field-checkbox">
                    修改此字段
                  </el-checkbox>
                  <el-date-picker
                    v-model="formData.effectiveEnd"
                    type="datetime"
                    placeholder="选择结束时间"
                    value-format="YYYY-MM-DD HH:mm:ss"
                    :disabled="!patchFields.effectiveEnd || lockPanel"
                    style="width: 100%"
                  />
                </div>
              </el-form-item>
            </el-col>
          </el-row>
          <div class="apply-action">
            <el-button
              type="success"
              :icon="Check"
              :disabled="!hasAnyPatchField || lockPanel"
              :loading="submitting"
              @click="handleApply"
            >
              应用
            </el-button>
          </div>
        </el-form>
      </el-collapse-item>
    </el-collapse>

    <div class="preview-section">
      <div class="preview-header">
        <span class="preview-title">
          <el-icon><View /></el-icon>
          当前选中规则预览（共 {{ previewData.length }} 条）
        </span>
        <el-button
          type="primary"
          link
          :icon="Refresh"
          :loading="previewLoading"
          :disabled="lockPanel"
          @click="fetchPreviewData"
        >
          刷新预览
        </el-button>
      </div>
      <div
        ref="previewTableWrapperRef"
        class="threshold-table-wrapper preview-table-wrapper"
        @mousemove="handleMouseMove"
        @mouseup="handleMouseUp"
        @mouseleave="handleMouseUp"
      >
        <el-table
          v-loading="previewLoading"
          :data="previewData"
          border
          stripe
          size="small"
          style="width: 100%"
          :header-cell-style="handleHeaderCellStyle"
        >
          <el-table-column
            prop="thresholdType"
            label="类型"
            :width="colWidths.thresholdType"
            min-width="100"
          >
            <template #default="{ row }">
              <el-tag :type="getThresholdTypeTagType(row.thresholdType)" size="small">
                {{ getThresholdTypeLabel(row.thresholdType) }}
              </el-tag>
            </template>
            <template #header="{ column }">
              <div class="resizable-header" @mousedown="(e) => handleMouseDown(e, 'thresholdType')">
                {{ column.label }}
                <span class="col-resizer" :class="{ 'col-resizing': resizingCol === 'thresholdType' }" />
              </div>
            </template>
          </el-table-column>

          <el-table-column
            prop="sector"
            label="板块/范围"
            :width="colWidths.sector"
            min-width="100"
          >
            <template #default="{ row }">
              <el-tag v-if="row.scopeType === 'global'" class="scope-global-badge" size="small">
                全局
              </el-tag>
              <el-tag v-else size="small" effect="plain">
                {{ row.sector }}
              </el-tag>
            </template>
            <template #header="{ column }">
              <div class="resizable-header" @mousedown="(e) => handleMouseDown(e, 'sector')">
                {{ column.label }}
                <span class="col-resizer" :class="{ 'col-resizing': resizingCol === 'sector' }" />
              </div>
            </template>
          </el-table-column>

          <el-table-column
            prop="configStatus"
            label="状态"
            :width="colWidths.configStatus"
            min-width="90"
          >
            <template #default="{ row }">
              <el-tag
                size="small"
                :class="`status-${row.configStatus}`"
                :type="getStatusTagType(row.configStatus)"
              >
                {{ getConfigStatusLabel(row.configStatus) }}
              </el-tag>
            </template>
            <template #header="{ column }">
              <div class="resizable-header" @mousedown="(e) => handleMouseDown(e, 'configStatus')">
                {{ column.label }}
                <span class="col-resizer" :class="{ 'col-resizing': resizingCol === 'configStatus' }" />
              </div>
            </template>
          </el-table-column>

          <el-table-column
            prop="valueRange"
            label="值范围 (min ~ max)"
            :width="colWidths.valueRange"
            min-width="200"
          >
            <template #default="{ row }">
              <div class="value-cell">
                <span class="preview-value-old">{{ row.minValue }}</span>
                <span class="tilde"> ~ </span>
                <span class="preview-value-old">{{ row.maxValue }}</span>
                <template v-if="patchFields.minValue || patchFields.maxValue">
                  <el-icon class="arrow-icon"><ArrowRight /></el-icon>
                  <span v-if="patchFields.minValue" class="preview-value-new">{{ formData.minValue }}</span>
                  <span v-else class="preview-value-old">{{ row.minValue }}</span>
                  <span class="tilde"> ~ </span>
                  <span v-if="patchFields.maxValue" class="preview-value-new">{{ formData.maxValue }}</span>
                  <span v-else class="preview-value-old">{{ row.maxValue }}</span>
                </template>
              </div>
            </template>
            <template #header="{ column }">
              <div class="resizable-header" @mousedown="(e) => handleMouseDown(e, 'valueRange')">
                {{ column.label }}
                <span class="col-resizer" :class="{ 'col-resizing': resizingCol === 'valueRange' }" />
              </div>
            </template>
          </el-table-column>

          <el-table-column
            prop="warningThreshold"
            label="预警线"
            :width="colWidths.warningThreshold"
            min-width="160"
          >
            <template #default="{ row }">
              <div class="value-cell">
                <span class="preview-value-old">{{ row.warningThreshold }}</span>
                <template v-if="patchFields.warningThreshold">
                  <el-icon class="arrow-icon"><ArrowRight /></el-icon>
                  <span class="preview-value-new">{{ formData.warningThreshold }}</span>
                </template>
              </div>
            </template>
            <template #header="{ column }">
              <div class="resizable-header" @mousedown="(e) => handleMouseDown(e, 'warningThreshold')">
                {{ column.label }}
                <span class="col-resizer" :class="{ 'col-resizing': resizingCol === 'warningThreshold' }" />
              </div>
            </template>
          </el-table-column>

          <el-table-column
            prop="triggerThreshold"
            label="触发行"
            :width="colWidths.triggerThreshold"
            min-width="160"
          >
            <template #default="{ row }">
              <div class="value-cell">
                <span class="preview-value-old">{{ row.triggerThreshold }}</span>
                <template v-if="patchFields.triggerThreshold">
                  <el-icon class="arrow-icon"><ArrowRight /></el-icon>
                  <span class="preview-value-new">{{ formData.triggerThreshold }}</span>
                </template>
              </div>
            </template>
            <template #header="{ column }">
              <div class="resizable-header" @mousedown="(e) => handleMouseDown(e, 'triggerThreshold')">
                {{ column.label }}
                <span class="col-resizer" :class="{ 'col-resizing': resizingCol === 'triggerThreshold' }" />
              </div>
            </template>
          </el-table-column>

          <el-table-column
            prop="effectivePeriod"
            label="生效起止"
            :width="colWidths.effectivePeriod"
            min-width="260"
          >
            <template #default="{ row }">
              <div class="value-cell">
                <div class="period-row">
                  <span class="preview-value-old">{{ row.effectiveStart || '--' }}</span>
                  <template v-if="patchFields.effectiveStart">
                    <el-icon class="arrow-icon"><ArrowRight /></el-icon>
                    <span class="preview-value-new">{{ formData.effectiveStart || '--' }}</span>
                  </template>
                </div>
                <div class="period-row">
                  <span class="preview-value-old">{{ row.effectiveEnd || '--' }}</span>
                  <template v-if="patchFields.effectiveEnd">
                    <el-icon class="arrow-icon"><ArrowRight /></el-icon>
                    <span class="preview-value-new">{{ formData.effectiveEnd || '--' }}</span>
                  </template>
                </div>
              </div>
            </template>
            <template #header="{ column }">
              <div class="resizable-header" @mousedown="(e) => handleMouseDown(e, 'effectivePeriod')">
                {{ column.label }}
                <span class="col-resizer" :class="{ 'col-resizing': resizingCol === 'effectivePeriod' }" />
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <div v-if="lockPanel" class="panel-lock-overlay">
      <el-icon class="loading-icon" :size="32"><Loading /></el-icon>
      <span>批量处理中...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick, type FormInstance } from 'vue'
import { ElMessage } from 'element-plus'
import {
  List,
  Check,
  View,
  Refresh,
  ArrowRight,
  Loading,
} from '@element-plus/icons-vue'
import { MARKET_SECTOR_LIST } from '@/constants/dictionaries'
import { batchUpdateThresholds, getThresholdList } from '@/api/threshold'
import type {
  IQuoteThreshold,
  IPaginatedData,
  ThresholdType,
  ScopeType,
  ConfigStatus,
  IThresholdUpdateData,
} from '@/types/api'

const emit = defineEmits<{
  updated: []
}>()

interface IPatchFields {
  minValue: boolean
  maxValue: boolean
  warningThreshold: boolean
  triggerThreshold: boolean
  configStatus: boolean
  effectiveStart: boolean
  effectiveEnd: boolean
}

type PreviewColKey =
  | 'thresholdType'
  | 'sector'
  | 'configStatus'
  | 'valueRange'
  | 'warningThreshold'
  | 'triggerThreshold'
  | 'effectivePeriod'

const THRESHOLD_TYPE_LABELS: Record<ThresholdType, string> = {
  change_rate: '涨跌幅',
  volume: '成交量',
  turnover: '换手率',
}

const CONFIG_STATUS_LABELS: Record<ConfigStatus, string> = {
  permanent: '永久生效',
  temporary: '临时生效',
  expired: '已过期',
}

const scopeType = ref<ScopeType>('global')
const selectedSectors = ref<string[]>([])
const selectedTypes = ref<ThresholdType[]>([])
const activeCollapseNames = ref<string[]>([])
const lockPanel = ref(false)
const submitting = ref(false)
const previewLoading = ref(false)
const previewData = ref<IQuoteThreshold[]>([])
const configFormRef = ref<FormInstance>()

const previewTableWrapperRef = ref<HTMLElement | null>(null)
const resizingCol = ref<PreviewColKey | null>(null)
const resizeStartX = ref(0)
const resizeStartWidth = ref(0)

const colWidths = reactive<Record<PreviewColKey, number>>({
  thresholdType: 100,
  sector: 120,
  configStatus: 100,
  valueRange: 220,
  warningThreshold: 170,
  triggerThreshold: 170,
  effectivePeriod: 280,
})

const formData = reactive<{
  minValue: number | null
  maxValue: number | null
  warningThreshold: number | null
  triggerThreshold: number | null
  configStatus: ConfigStatus | ''
  effectiveStart: string
  effectiveEnd: string
}>({
  minValue: null,
  maxValue: null,
  warningThreshold: null,
  triggerThreshold: null,
  configStatus: '',
  effectiveStart: '',
  effectiveEnd: '',
})

const patchFields = reactive<IPatchFields>({
  minValue: false,
  maxValue: false,
  warningThreshold: false,
  triggerThreshold: false,
  configStatus: false,
  effectiveStart: false,
  effectiveEnd: false,
})

const canModifyBatch = computed(() => {
  const sectorValid = scopeType.value === 'global' || selectedSectors.value.length > 0
  const typeValid = selectedTypes.value.length > 0
  return sectorValid && typeValid
})

const hasAnyPatchField = computed(() => Object.values(patchFields).some(v => v))

function handleScopeTypeChange() {
  if (scopeType.value === 'global') {
    selectedSectors.value = []
  }
  fetchPreviewData()
}

watch([selectedSectors, selectedTypes], () => {
  fetchPreviewData()
}, { deep: true })

function handleOpenConfig() {
  if (!canModifyBatch.value) return
  activeCollapseNames.value = ['config']
}

function getThresholdTypeLabel(type: ThresholdType): string {
  return THRESHOLD_TYPE_LABELS[type] || type
}

function getThresholdTypeTagType(type: ThresholdType): 'primary' | 'success' | 'warning' {
  const map: Record<ThresholdType, 'primary' | 'success' | 'warning'> = {
    change_rate: 'primary',
    volume: 'success',
    turnover: 'warning',
  }
  return map[type] || 'primary'
}

function getConfigStatusLabel(status: ConfigStatus): string {
  return CONFIG_STATUS_LABELS[status] || status
}

function getStatusTagType(status: ConfigStatus): 'success' | 'primary' | 'info' {
  const map: Record<ConfigStatus, 'success' | 'primary' | 'info'> = {
    permanent: 'success',
    temporary: 'primary',
    expired: 'info',
  }
  return map[status] || 'info'
}

function handleHeaderCellStyle() {
  return { position: 'relative' as const }
}

function handleMouseDown(e: MouseEvent, colKey: PreviewColKey) {
  if (lockPanel.value) return
  e.preventDefault()
  resizingCol.value = colKey
  resizeStartX.value = e.clientX
  resizeStartWidth.value = colWidths[colKey]
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}

function handleMouseMove(e: MouseEvent) {
  if (!resizingCol.value) return
  const delta = e.clientX - resizeStartX.value
  const newWidth = Math.max(80, resizeStartWidth.value + delta)
  colWidths[resizingCol.value] = newWidth
}

function handleMouseUp() {
  if (resizingCol.value) {
    resizingCol.value = null
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }
}

async function fetchPreviewData() {
  if (!canModifyBatch.value) {
    previewData.value = []
    return
  }
  previewLoading.value = true
  try {
    const sectors = scopeType.value === 'global' ? undefined : selectedSectors.value
    const allData: IQuoteThreshold[] = []
    for (const type of selectedTypes.value) {
      for (let page = 1, pageSize = 100; ; page++) {
        const res = await getThresholdList({
          page,
          pageSize,
          scopeType: scopeType.value,
          thresholdType: type,
        })
        const data = res.data as IPaginatedData<IQuoteThreshold>
        let filtered = data.list
        if (sectors) {
          filtered = filtered.filter(item => sectors.includes(item.sector))
        }
        allData.push(...filtered)
        if (page * pageSize >= data.total) break
      }
    }
    previewData.value = allData
  } catch {
    ElMessage.warning('获取预览数据失败')
    previewData.value = []
  } finally {
    previewLoading.value = false
  }
}

function buildPatch(): Partial<IThresholdUpdateData> {
  const patch: Partial<IThresholdUpdateData> = {}
  if (patchFields.minValue && formData.minValue !== null) {
    patch.minValue = formData.minValue
  }
  if (patchFields.maxValue && formData.maxValue !== null) {
    patch.maxValue = formData.maxValue
  }
  if (patchFields.warningThreshold && formData.warningThreshold !== null) {
    patch.warningThreshold = formData.warningThreshold
  }
  if (patchFields.triggerThreshold && formData.triggerThreshold !== null) {
    patch.triggerThreshold = formData.triggerThreshold
  }
  if (patchFields.configStatus && formData.configStatus) {
    patch.configStatus = formData.configStatus
  }
  if (patchFields.effectiveStart && formData.effectiveStart) {
    patch.effectiveStart = formData.effectiveStart
  }
  if (patchFields.effectiveEnd && formData.effectiveEnd) {
    patch.effectiveEnd = formData.effectiveEnd
  }
  return patch
}

async function handleApply() {
  if (!hasAnyPatchField.value) {
    ElMessage.warning('请至少勾选一个要修改的字段')
    return
  }
  if (previewData.value.length === 0) {
    ElMessage.warning('没有可批量更新的规则')
    return
  }
  const ids = previewData.value.map(item => item.id)
  const patch = buildPatch()
  if (Object.keys(patch).length === 0) {
    ElMessage.warning('请为勾选的字段填写有效值')
    return
  }

  lockPanel.value = true
  submitting.value = true
  try {
    await nextTick()
    const res = await batchUpdateThresholds(ids, patch)
    const count = res.data?.updatedCount ?? ids.length
    ElMessage.success(`已批量更新${count}条阈值规则`)
    emit('updated')
    activeCollapseNames.value = []
    Object.keys(patchFields).forEach(key => {
      patchFields[key as keyof IPatchFields] = false
    })
  } catch {
    ElMessage.error('批量更新失败')
  } finally {
    lockPanel.value = false
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.threshold-batch-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 16px;

  &.batch-panel-locked {
    pointer-events: none;

    .panel-header,
    .config-collapse,
    .preview-section {
      opacity: 0.6;
    }
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 16px 20px;
    background: #fff;
    border-radius: 8px;
    border: 1px solid #ebeef5;

    .header-left {
      display: flex;
      align-items: center;
      flex: 1;
    }

    .header-center {
      flex: 1;
      display: flex;
      justify-content: center;
    }

    .header-right {
      flex-shrink: 0;
    }
  }

  .config-collapse {
    background: #fff;
    border-radius: 8px;
    border: 1px solid #ebeef5;

    :deep(.el-collapse-item__header) {
      padding: 0 20px;
      font-weight: 600;
    }

    :deep(.el-collapse-item__wrap) {
      border-bottom: none;
    }

    :deep(.el-collapse-item__content) {
      padding: 16px 20px 4px;
    }

    .skeleton-wrapper {
      padding: 8px 0 16px;
    }

    .field-wrapper {
      display: flex;
      flex-direction: column;
      gap: 6px;
      width: 100%;

      .field-checkbox {
        font-size: 12px;
        color: #909399;
      }
    }

    .apply-action {
      text-align: center;
      padding: 16px 0 8px;
    }
  }

  .preview-section {
    background: #fff;
    border-radius: 8px;
    border: 1px solid #ebeef5;
    overflow: hidden;

    .preview-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 20px;
      border-bottom: 1px solid #ebeef5;
      background: #fafbfc;

      .preview-title {
        display: flex;
        align-items: center;
        gap: 6px;
        font-weight: 600;
        color: #303133;
      }
    }

    .preview-table-wrapper {
      padding: 0;
    }
  }

  .threshold-table-wrapper {
    .resizable-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding-right: 8px;
      position: relative;

      .col-resizer {
        position: absolute;
        right: -2px;
        top: 0;
        bottom: 0;
        width: 6px;
        cursor: col-resize;
        z-index: 2;

        &.col-resizing,
        &:hover {
          background: #409eff;
          opacity: 0.3;
        }
      }
    }

    .value-cell {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 13px;

      .arrow-icon {
        color: #c0c4cc;
        margin: 0 6px;
      }

      .tilde {
        color: #909399;
        margin: 0 4px;
      }

      .period-row {
        display: flex;
        align-items: center;
        font-size: 12px;
      }
    }

    .preview-value-old {
      color: #909399;
      text-decoration: line-through;
    }

    .preview-value-new {
      color: #67c23a;
      font-weight: 600;
    }
  }

  .scope-global-badge {
    background: linear-gradient(135deg, #67c23a, #95d475);
    color: #fff;
    border: none;
  }

  :deep(.el-tag.status-permanent) {
    --el-tag-bg-color: #f0f9eb;
    --el-tag-text-color: #67c23a;
    --el-tag-border-color: #c2e7b0;
  }

  :deep(.el-tag.status-temporary) {
    --el-tag-bg-color: #ecf5ff;
    --el-tag-text-color: #409eff;
    --el-tag-border-color: #b3d8ff;
  }

  :deep(.el-tag.status-expired) {
    --el-tag-bg-color: #f4f4f5;
    --el-tag-text-color: #909399;
    --el-tag-border-color: #d3d4d6;
  }

  .panel-lock-overlay {
    position: absolute;
    inset: 0;
    background: rgba(255, 255, 255, 0.7);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    color: #409eff;
    font-weight: 500;
    z-index: 10;
    pointer-events: none;

    .loading-icon {
      animation: rotate 1s linear infinite;
    }
  }
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.col-resizing {
  cursor: col-resize;
}
</style>
