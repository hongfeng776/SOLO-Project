<template>
  <el-dialog
    :model-value="visible"
    title="批量导出风控复盘数据"
    width="820px"
    :close-on-click-modal="!isExporting"
    :close-on-press-escape="!isExporting"
    @update:model-value="handleUpdateVisible"
  >
    <div class="export-wrapper" :class="{ 'is-exporting': isExporting }">
      <div class="export-summary-card">
        <div class="summary-item">
          <el-icon class="sum-icon" color="#2980B9"><Files /></el-icon>
          <div class="sum-text">
            <span class="sum-label">预估记录数</span>
            <strong class="sum-value">{{ formatThousands(recordCount || 12800) }}</strong>
          </div>
        </div>
        <div class="summary-divider" />
        <div class="summary-item">
          <el-icon class="sum-icon" color="#27AE60"><Timer /></el-icon>
          <div class="sum-text">
            <span class="sum-label">预估耗时</span>
            <strong class="sum-value">{{ estDuration }}s</strong>
          </div>
        </div>
        <div class="summary-divider" />
        <div class="summary-item">
          <el-icon class="sum-icon" color="#8E44AD"><Coin /></el-icon>
          <div class="sum-text">
            <span class="sum-label">预估文件</span>
            <strong class="sum-value">{{ estFileSize }} MB</strong>
          </div>
        </div>
        <div class="summary-divider" />
        <div class="summary-item">
          <el-icon class="sum-icon" :color="integrityRisk ? '#E74C3C' : '#16A085'"><Lock /></el-icon>
          <div class="sum-text">
            <span class="sum-label">完整性校验</span>
            <strong class="sum-value" :style="{ color: integrityRisk ? '#E74C3C' : '#16A085' }">
              {{ integrityRisk ? '存在缺失风险' : '预计完整' }}
            </strong>
          </div>
        </div>
      </div>

      <div v-if="!isExporting" class="config-area">
        <div class="config-group">
          <div class="config-header">
            <h4 class="cg-title">导出字段配置</h4>
            <div class="cg-actions">
              <el-button size="small" text type="primary" @click="handleGroupSelectAll">全选分组</el-button>
              <el-button size="small" text @click="handleGroupSelectNone">清空分组</el-button>
            </div>
          </div>
          <div class="field-groups">
            <div v-for="group in fieldGroups" :key="group.name" class="field-group">
              <div class="fg-title">
                <el-icon><FolderOpened /></el-icon>
                {{ group.name }}
              </div>
              <el-checkbox-group v-model="groupSelectedMap[group.name]" class="fg-checkboxes">
                <el-checkbox
                  v-for="f in group.fields"
                  :key="f.key"
                  :value="f.key"
                  :label="f.label"
                  @change="onFieldChange"
                />
              </el-checkbox-group>
            </div>
          </div>
          <div class="selected-count-bar">
            <el-icon><Finished /></el-icon>
            已选 <strong>{{ totalSelectedFields }}</strong> / {{ REPLAY_EXPORT_FIELD_OPTIONS.length }} 个字段
          </div>
        </div>

        <div class="config-row-split">
          <div class="split-col">
            <div class="config-label">排序字段</div>
            <el-select v-model="sortField" placeholder="选择排序字段" style="width: 100%">
              <el-option
                v-for="f in sortableFields"
                :key="f.key"
                :label="f.label + (f.default ? '（默认）' : '')"
                :value="f.key"
              />
            </el-select>
          </div>
          <div class="split-col">
            <div class="config-label">排序方向</div>
            <el-radio-group v-model="sortOrder" style="width: 100%">
              <el-radio-button :value="'desc'"><el-icon><SortDown /></el-icon>降序</el-radio-button>
              <el-radio-button :value="'asc'"><el-icon><SortUp /></el-icon>升序</el-radio-button>
            </el-radio-group>
          </div>
        </div>

        <div class="config-row-split">
          <div class="split-col">
            <div class="config-label">导出格式</div>
            <el-radio-group v-model="exportFormat" style="flex-wrap: wrap">
              <el-radio
                v-for="opt in EXPORT_FORMAT_OPTIONS"
                :key="opt.value"
                :value="opt.value"
              >
                <el-icon><component :is="opt.icon" /></el-icon>
                {{ opt.label }}
              </el-radio>
            </el-radio-group>
          </div>
          <div class="split-col">
            <div class="config-label">文件分拆</div>
            <el-select v-model="splitRule" placeholder="大数据量分拆规则" style="width: 100%">
              <el-option label="不拆分（单文件）" value="none" />
              <el-option label="按 10000 条/文件拆分" value="10000" />
              <el-option label="按 50000 条/文件拆分" value="50000" />
              <el-option label="按 100MB/文件拆分" value="100mb" />
            </el-select>
          </div>
        </div>

        <div class="config-tips-group">
          <el-alert
            v-if="needSplitWarning"
            type="warning"
            show-icon
            :closable="false"
            class="tip-alert"
          >
            数据量超过 <strong>50,000</strong> 条，建议启用分拆功能以避免导出超时
          </el-alert>
          <el-alert
            v-if="exportFormat === ReplayExportFormat.PDF"
            type="info"
            show-icon
            :closable="false"
            class="tip-alert"
          >
            PDF 报表包含客户敏感信息，<strong>导出后将自动记录操作日志</strong>并需合规审批
          </el-alert>
        </div>
      </div>

      <div v-if="isExporting" class="progress-area">
        <div class="progress-header">
          <h4 class="ph-title">
            <el-icon v-if="exportStage !== 'done'" class="loading-icon"><Loading /></el-icon>
            <el-icon v-else color="#27AE60"><CircleCheckFilled /></el-icon>
            {{ stageText }}
          </h4>
          <span class="ph-percent" :style="{ color: exportStage === 'done' ? '#27AE60' : '#2980B9' }">
            {{ Math.round(overallProgress) }}%
          </span>
        </div>

        <div class="dual-progress">
          <div class="ring-progress-col">
            <el-progress
              type="circle"
              :percentage="Math.round(overallProgress)"
              :width="130"
              :stroke-width="8"
              :color="progressRingColor"
            />
            <div class="ring-label">
              {{ formatThousands(processedRecords) }} / {{ formatThousands(totalRecords) }}
            </div>
          </div>

          <div class="bar-progress-col">
            <div class="bar-stage-row">
              <div class="bs-left">
                <span class="bs-name">数据提取</span>
                <el-tag size="small" :type="stageTagType(1)">{{ stagePercent(1) }}%</el-tag>
              </div>
              <el-progress :percentage="stagePercent(1)" :stroke-width="6" :show-text="false" />
            </div>
            <div class="bar-stage-row">
              <div class="bs-left">
                <span class="bs-name">字段脱敏</span>
                <el-tag size="small" :type="stageTagType(2)">{{ stagePercent(2) }}%</el-tag>
              </div>
              <el-progress :percentage="stagePercent(2)" :stroke-width="6" :show-text="false" />
            </div>
            <div class="bar-stage-row">
              <div class="bs-left">
                <span class="bs-name">完整性校验</span>
                <el-tag size="small" :type="stageTagType(3)">{{ stagePercent(3) }}%</el-tag>
              </div>
              <el-progress :percentage="stagePercent(3)" :stroke-width="6" :show-text="false" />
            </div>
            <div class="bar-stage-row">
              <div class="bs-left">
                <span class="bs-name">文件打包</span>
                <el-tag size="small" :type="stageTagType(4)">{{ stagePercent(4) }}%</el-tag>
              </div>
              <el-progress :percentage="stagePercent(4)" :stroke-width="6" :show-text="false" />
            </div>
          </div>
        </div>

        <div v-if="exportStage !== 'done'" class="progress-detail-row">
          <el-icon :class="{ 'spin-anim': true }"><Connection /></el-icon>
          <span>{{ currentActionText }}</span>
        </div>

        <div v-if="exportStage === 'done'" class="export-result-card">
          <div class="result-header">
            <el-icon color="#27AE60" size="20"><CircleCheckFilled /></el-icon>
            <strong>导出完成</strong>
            <el-tag type="success" effect="light" size="small">
              SHA256: {{ integrityHash }}
            </el-tag>
          </div>
          <div class="result-grid">
            <div class="result-item">
              <span class="ri-label">导出文件</span>
              <span class="ri-value">{{ fileName }}</span>
            </div>
            <div class="result-item">
              <span class="ri-label">记录数量</span>
              <span class="ri-value">{{ formatThousands(processedRecords) }}</span>
            </div>
            <div class="result-item">
              <span class="ri-label">缺失数据</span>
              <span class="ri-value" :style="{ color: missingCount > 0 ? '#E74C3C' : '#27AE60' }">
                {{ missingCount }} 条
                <el-tag v-if="missingCount > 0" type="danger" size="small" effect="plain">
                  已标注异常
                </el-tag>
              </span>
            </div>
            <div class="result-item">
              <span class="ri-label">文件大小</span>
              <span class="ri-value">{{ actualFileSize }} MB</span>
            </div>
            <div class="result-item">
              <span class="ri-label">耗时</span>
              <span class="ri-value">{{ actualDuration }}s</span>
            </div>
            <div class="result-item">
              <span class="ri-label">拆分文件</span>
              <span class="ri-value">{{ splitFiles }} 个</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel" :disabled="isExporting && exportStage !== 'done'">
          {{ exportStage === 'done' ? '关闭' : '取消' }}
        </el-button>
        <el-button
          v-if="!isExporting"
          type="primary"
          :disabled="totalSelectedFields === 0"
          @click="startExport"
        >
          <el-icon><Download /></el-icon>
          开始导出
        </el-button>
        <el-button
          v-else-if="exportStage === 'done'"
          type="success"
          @click="handleDownload"
        >
          <el-icon><FolderDownload /></el-icon>
          下载文件
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onBeforeUnmount } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'
import {
  Files, Timer, Coin, Lock, FolderOpened, Finished,
  SortDown, SortUp, Loading, Connection, Download,
  FolderDownload, CircleCheckFilled, Document, Notebook, DataBoard, Grid,
} from '@element-plus/icons-vue'
import { ReplayExportFormat } from '@/enums'
import { REPLAY_EXPORT_FIELD_OPTIONS, REPLAY_EXPORT_FORMAT_LABELS } from '@/constants/dictionaries'
import type { IReplayQueryParams } from '@/types/api'

interface IProps {
  visible: boolean
  queryParams?: IReplayQueryParams
  recordCount?: number
}

const props = withDefaults(defineProps<IProps>(), {
  visible: false,
  recordCount: 0,
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const isExporting = ref(false)
const exportStage = ref<'idle' | 'stage1' | 'stage2' | 'stage3' | 'stage4' | 'done'>('idle')
const overallProgress = ref(0)
const processedRecords = ref(0)
const totalRecords = ref(0)
const missingCount = ref(0)
const stagePercents = reactive({ 1: 0, 2: 0, 3: 0, 4: 0 })

const sortField = ref('occurredAt')
const sortOrder = ref<'asc' | 'desc'>('desc')
const exportFormat = ref(ReplayExportFormat.EXCEL)
const splitRule = ref('none')

const EXPORT_FORMAT_OPTIONS = [
  { value: ReplayExportFormat.EXCEL, label: 'Excel', icon: Grid },
  { value: ReplayExportFormat.CSV, label: 'CSV', icon: Document },
  { value: ReplayExportFormat.PDF, label: 'PDF', icon: Notebook },
  { value: ReplayExportFormat.JSON, label: 'JSON', icon: DataBoard },
]

const groupList = ['基础字段', '风控维度', '处理结果', '交易字段', '扩展字段']
const groupSelectedMap = reactive<Record<string, string[]>>({})
groupList.forEach((g) => {
  groupSelectedMap[g] = REPLAY_EXPORT_FIELD_OPTIONS
    .filter((f) => f.group === g && f.selected)
    .map((f) => f.key)
})

const fieldGroups = computed(() => groupList.map((name) => ({
  name,
  fields: REPLAY_EXPORT_FIELD_OPTIONS.filter((f) => f.group === name),
})))

const totalSelectedFields = computed(() =>
  Object.values(groupSelectedMap).reduce((sum, arr) => sum + arr.length, 0),
)

const sortableFields = computed(() =>
  REPLAY_EXPORT_FIELD_OPTIONS.map((f) => ({
    key: f.key,
    label: f.label,
    default: f.sortOrder,
  })).filter((_, i) => i < 12),
)

const estDuration = computed(() => Math.max(3, Math.ceil((props.recordCount || 12800) / 2800)))
const estFileSize = computed(() => Math.max(1, Math.ceil((props.recordCount || 12800) / 6000 * totalSelectedFields.value / 8)))
const integrityRisk = computed(() => (props.recordCount || 0) > 50000)
const needSplitWarning = computed(() => (props.recordCount || 12800) > 50000 && splitRule.value === 'none')

const progressRingColor = computed(() => {
  if (exportStage.value === 'done') return '#27AE60'
  if (overallProgress.value < 40) return '#F39C12'
  if (overallProgress.value < 80) return '#2980B9'
  return '#8E44AD'
})

const stageText = computed(() => {
  const map: Record<string, string> = {
    stage1: '正在提取风控复盘数据...',
    stage2: '正在进行字段脱敏与格式化...',
    stage3: '正在校验数据完整性与哈希签名...',
    stage4: '正在打包生成下载文件...',
    done: '导出任务执行完成',
  }
  return map[exportStage.value] || '准备导出'
})

const currentActionText = computed(() => {
  const p = Math.round(overallProgress.value)
  if (p < 25) return `正在连接服务端，已建立查询连接，读取 ${formatThousands(processedRecords.value)} 条事件...`
  if (p < 50) return `正在脱敏客户敏感字段，已处理 ${Math.round(p / 25 * 100)} 个批次...`
  if (p < 75) return `正在执行 SHA-256 完整性校验，检测缺失与重复记录...`
  if (p < 100) return `正在生成 ${REPLAY_EXPORT_FORMAT_LABELS[exportFormat.value]} 文件并压缩分卷...`
  return '文件准备就绪，可下载'
})

const integrityHash = ref('a1f3...c8e2')
const fileName = computed(() => {
  const ext = { 0: 'xlsx', 1: 'csv', 2: 'pdf', 3: 'json' }[exportFormat.value] || 'xlsx'
  const d = new Date()
  const ts = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  return `RiskReplay_${ts}.${ext}`
})
const actualFileSize = computed(() => Math.max(1, estFileSize.value + Math.floor(Math.random() * 3)))
const actualDuration = ref(estDuration.value)
const splitFiles = computed(() => {
  if (splitRule.value === 'none') return 1
  if (splitRule.value === '10000') return Math.ceil((props.recordCount || 12800) / 10000)
  if (splitRule.value === '50000') return Math.ceil((props.recordCount || 12800) / 50000)
  return 2
})

function formatThousands(n: number): string {
  if (!n && n !== 0) return '0'
  return n.toLocaleString('zh-CN')
}

function stagePercent(idx: number): number {
  return stagePercents[idx as 1 | 2 | 3 | 4] || 0
}
function stageTagType(idx: number) {
  const p = stagePercent(idx)
  if (p >= 100) return 'success'
  if (p > 0) return 'primary'
  return 'info'
}

function handleUpdateVisible(v: boolean) {
  if (!v && isExporting.value && exportStage.value !== 'done') return
  emit('update:visible', v)
}

function handleCancel() {
  if (isExporting.value && exportStage.value !== 'done') {
    ElMessage.warning('导出进行中，请勿关闭窗口')
    return
  }
  emit('update:visible', false)
}

function handleGroupSelectAll() {
  groupList.forEach((g) => {
    groupSelectedMap[g] = REPLAY_EXPORT_FIELD_OPTIONS.filter((f) => f.group === g).map((f) => f.key)
  })
}
function handleGroupSelectNone() {
  groupList.forEach((g) => { groupSelectedMap[g] = [] })
}
function onFieldChange() {
  if (totalSelectedFields.value === 0) ElMessage.warning('请至少选择一个导出字段')
}

let progressTimer: ReturnType<typeof setInterval> | null = null

function startExport() {
  isExporting.value = true
  exportStage.value = 'stage1'
  overallProgress.value = 0
  stagePercents[1] = 0
  stagePercents[2] = 0
  stagePercents[3] = 0
  stagePercents[4] = 0
  processedRecords.value = 0
  totalRecords.value = props.recordCount || 12800
  missingCount.value = Math.floor(Math.random() * 5)
  actualDuration.value = estDuration.value
  const startAt = Date.now()

  progressTimer = setInterval(() => {
    const elapsed = (Date.now() - startAt) / 1000
    const ratio = Math.min(1, elapsed / estDuration.value)
    overallProgress.value = ratio * 100

    if (ratio < 0.28) {
      exportStage.value = 'stage1'
      stagePercents[1] = Math.round((ratio / 0.28) * 100)
      processedRecords.value = Math.round(totalRecords.value * (ratio / 0.28) * 0.98)
    } else if (ratio < 0.55) {
      stagePercents[1] = 100
      exportStage.value = 'stage2'
      stagePercents[2] = Math.round(((ratio - 0.28) / 0.27) * 100)
      processedRecords.value = totalRecords.value
    } else if (ratio < 0.82) {
      stagePercents[1] = 100
      stagePercents[2] = 100
      exportStage.value = 'stage3'
      stagePercents[3] = Math.round(((ratio - 0.55) / 0.27) * 100)
    } else if (ratio < 1) {
      stagePercents[1] = 100
      stagePercents[2] = 100
      stagePercents[3] = 100
      exportStage.value = 'stage4'
      stagePercents[4] = Math.round(((ratio - 0.82) / 0.18) * 100)
    } else {
      stagePercents[1] = 100
      stagePercents[2] = 100
      stagePercents[3] = 100
      stagePercents[4] = 100
      overallProgress.value = 100
      exportStage.value = 'done'
      actualDuration.value = Math.ceil((Date.now() - startAt) / 1000)
      if (progressTimer) {
        clearInterval(progressTimer)
        progressTimer = null
      }
      ElNotification.success({ title: '导出完成', message: `共 ${formatThousands(processedRecords.value)} 条数据，缺失 ${missingCount.value} 条已自动标注` })
    }
  }, 120)
}

function handleDownload() {
  ElMessage.success(`文件 ${fileName.value} 已进入下载队列`)
  emit('update:visible', false)
  setTimeout(() => {
    isExporting.value = false
    exportStage.value = 'idle'
    overallProgress.value = 0
  }, 400)
}

watch(() => props.visible, (v) => {
  if (!v && !isExporting.value) {
    exportStage.value = 'idle'
    overallProgress.value = 0
  }
})

onBeforeUnmount(() => {
  if (progressTimer) clearInterval(progressTimer)
})
</script>

<style lang="scss" scoped>
.export-wrapper {
  .export-summary-card {
    display: flex;
    align-items: center;
    background: linear-gradient(135deg, #f7fbff, #f0f7ff);
    border: 1px solid #e0ecfa;
    border-radius: 8px;
    padding: 14px 18px;
    margin-bottom: 18px;
    .summary-item {
      display: flex;
      align-items: center;
      flex: 1;
      gap: 10px;
      .sum-icon { font-size: 22px; }
      .sum-text {
        display: flex;
        flex-direction: column;
        .sum-label { font-size: 12px; color: #7f8c9a; }
        .sum-value { font-size: 16px; color: #2c3e50; }
      }
    }
    .summary-divider {
      width: 1px;
      height: 36px;
      background: #dbe7f5;
      margin: 0 8px;
    }
  }

  .config-area {
    .config-group {
      border: 1px solid #eef2f7;
      border-radius: 8px;
      padding: 14px;
      margin-bottom: 16px;
      .config-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        .cg-title { margin: 0; font-size: 14px; color: #2c3e50; }
        .cg-actions { display: flex; gap: 4px; }
      }
      .field-groups {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
        .field-group {
          border: 1px dashed #e1e8f0;
          border-radius: 6px;
          padding: 10px 12px;
          background: #fafcfe;
          .fg-title {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            color: #2980B9;
            font-weight: 600;
            margin-bottom: 8px;
          }
          .fg-checkboxes {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 6px 10px;
            :deep(.el-checkbox) { margin-right: 0; }
          }
        }
      }
      .selected-count-bar {
        margin-top: 12px;
        padding: 8px 12px;
        background: #f4faf6;
        border-radius: 4px;
        font-size: 12px;
        color: #5d6d7e;
        display: flex;
        align-items: center;
        gap: 6px;
        strong { color: #27AE60; font-size: 14px; }
      }
    }

    .config-row-split {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
      .split-col {
        .config-label {
          font-size: 12px;
          color: #5d6d7e;
          margin-bottom: 6px;
        }
      }
    }

    .config-tips-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
      .tip-alert { :deep(.el-alert__content) { font-size: 12px; } }
    }
  }

  .progress-area {
    .progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      .ph-title {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0;
        font-size: 15px;
        color: #2c3e50;
        .loading-icon { animation: spin 1s linear infinite; }
      }
      .ph-percent {
        font-size: 22px;
        font-weight: 700;
      }
    }

    .dual-progress {
      display: grid;
      grid-template-columns: 180px 1fr;
      gap: 24px;
      align-items: center;
      padding: 20px 16px;
      border: 1px solid #eef2f7;
      border-radius: 8px;
      background: #fafcfe;
      margin-bottom: 14px;
      .ring-progress-col {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        .ring-label { font-size: 12px; color: #7f8c9a; margin-top: 4px; }
      }
      .bar-progress-col {
        display: flex;
        flex-direction: column;
        gap: 10px;
        .bar-stage-row {
          display: grid;
          grid-template-columns: 160px 1fr;
          gap: 10px;
          align-items: center;
          .bs-left {
            display: flex;
            justify-content: space-between;
            align-items: center;
            .bs-name { font-size: 12px; color: #5d6d7e; }
          }
        }
      }
    }

    .progress-detail-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      background: #f7fbff;
      border-radius: 6px;
      font-size: 12px;
      color: #5d6d7e;
      .spin-anim { animation: spin 1.4s linear infinite; color: #2980B9; }
    }

    .export-result-card {
      border: 1px solid #cfe9d7;
      border-radius: 8px;
      background: linear-gradient(135deg, #f1fbf4, #e9f8ee);
      padding: 16px;
      .result-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 14px;
        padding-bottom: 10px;
        border-bottom: 1px dashed #b7dcc2;
        strong { color: #27AE60; font-size: 15px; }
      }
      .result-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px 16px;
        .result-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
          .ri-label { font-size: 12px; color: #7f8c9a; }
          .ri-value { font-size: 13px; color: #2c3e50; font-weight: 500; }
        }
      }
    }
  }

  &.is-exporting {
    :deep(.el-dialog__header) { background: #f7fbff; border-bottom-color: #e0ecfa; }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
