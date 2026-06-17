<template>
  <el-dialog
    v-model="visible"
    :title="`阈值配置溯源 · ${props.thresholdId}`"
    width="960px"
    :close-on-click-modal="false"
    class="threshold-history-dialog"
    append-to-body
    @open="handleOpen"
  >
    <div v-loading="loading">
      <div class="audit-header-card">
        <div class="snapshot-section">
          <span class="snapshot-label">类型：</span>
          <el-tag size="small" :type="getThresholdTypeTag(currentSnapshot?.thresholdType)">
            {{ THRESHOLD_TYPE_LABELS[currentSnapshot?.thresholdType || 'change_rate'] }}
          </el-tag>

          <span class="snapshot-label">板块：</span>
          <el-tag
            v-if="currentSnapshot?.sector"
            size="small"
            effect="plain"
            :style="getSectorTagStyle(currentSnapshot.sector)"
          >
            {{ currentSnapshot.sector }}
          </el-tag>
          <el-tag v-else size="small" effect="plain">全局</el-tag>

          <span class="snapshot-label">状态：</span>
          <el-tag size="small" :type="getStatusTagType(currentSnapshot?.configStatus)">
            {{ STATUS_LABELS[currentSnapshot?.configStatus || 'permanent'] }}
          </el-tag>

          <span class="snapshot-label">版本：</span>
          <span class="snapshot-value">v{{ currentSnapshot?.version || 1 }}</span>

          <span class="snapshot-label">操作人：</span>
          <span class="snapshot-value">{{ currentSnapshot?.createdByName || '--' }}</span>
        </div>

        <div class="snapshot-section">
          <span class="snapshot-label">预警阈值：</span>
          <span class="snapshot-value" style="color: #E6A23C">{{ currentSnapshot?.warningThreshold || '--' }}%</span>
          <span class="snapshot-label">触发阈值：</span>
          <span class="snapshot-value" style="color: #F56C6C">{{ currentSnapshot?.triggerThreshold || '--' }}%</span>
          <span class="snapshot-label">区间：</span>
          <span class="snapshot-value">[{{ currentSnapshot?.minValue ?? '--' }}, {{ currentSnapshot?.maxValue ?? '--' }}]</span>
        </div>
      </div>

      <div v-if="allConflicts.length > 0" class="conflict-alert">
        <el-alert type="warning" show-icon :closable="false">
          <template #title>
            <span>⚠️ 检测到 {{ allConflicts.length }} 处历史冲突</span>
          </template>
          <div class="conflict-list">
            <el-tag
              v-for="(conflict, idx) in allConflicts"
              :key="idx"
              size="small"
              :class="`conflict-badge-${conflict.type}`"
            >
              {{ CONFLICT_TYPE_LABELS[conflict.type] }}：{{ conflict.message }}
            </el-tag>
          </div>
        </el-alert>
      </div>

      <div class="section-title">匹配场景</div>
      <div v-loading="scenarioLoading" class="scenario-grid">
        <div
          v-for="(scenario, idx) in scenarioMatches"
          :key="idx"
          class="scenario-match-card"
        >
          <div class="scenario-header">
            <div class="scenario-name">{{ scenario.scenarioName }}</div>
            <div
              class="scenario-score-ring"
              :style="{ '--score': scenario.matchScore }"
              :data-score="scenario.matchScore"
            />
          </div>
          <div class="suggestion">{{ scenario.suggestion }}</div>
        </div>
        <el-empty v-if="!scenarioLoading && scenarioMatches.length === 0" description="暂无匹配场景" />
      </div>

      <div class="section-title">变更统计</div>
      <div class="stats-bar">
        <div class="stat-mini-card">
          <div class="stat-title">变更类型分布</div>
          <div class="stat-content">
            <div class="pie-dist">
              <div
                v-for="item in stats.changeTypeDist"
                :key="item.type"
                class="pie-item"
              >
                <span class="pie-dot" :style="{ backgroundColor: CHANGE_TYPE_COLORS[item.type] }" />
                <span class="pie-label">{{ CHANGE_TYPE_LABELS[item.type] }}</span>
                <span class="pie-count">{{ item.count }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="stat-mini-card">
          <div class="stat-title">操作人分布</div>
          <div class="stat-content">
            <div class="operator-bars">
              <div
                v-for="op in maxOperatorCount > 0 ? stats.operatorDist : []"
                :key="op.operatorId"
                class="operator-bar-row"
              >
                <span class="bar-name">{{ op.operatorName }}</span>
                <div class="bar-track">
                  <div
                    class="bar-fill"
                    :style="{ width: `${(op.count / maxOperatorCount) * 100}%` }"
                  />
                </div>
                <span class="bar-count">{{ op.count }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="stat-mini-card">
          <div class="stat-title">平均变更间隔</div>
          <div class="stat-content">
            <div class="avg-interval">
              {{ stats.avgInterval.toFixed(1) }}
              <span class="unit">小时</span>
            </div>
          </div>
        </div>
      </div>

      <div class="section-title">历史变更时间线</div>
      <div class="timeline-wrapper">
        <el-timeline v-if="historyList.length > 0">
          <el-timeline-item
            v-for="item in historyList"
            :key="item.id"
            :color="CHANGE_TYPE_COLORS[item.changeType]"
            :timestamp="formatDateTime(item.createdAt)"
            placement="top"
          >
            <div class="timeline-item-header">
              <el-tag size="small" :type="getChangeTypeTag(item.changeType)">
                {{ CHANGE_TYPE_LABELS[item.changeType] }}
              </el-tag>
              <span class="operator-name">{{ item.operatorName }}</span>
              <span class="created-relative">{{ getRelativeTime(item.createdAt) }}</span>
            </div>

            <div class="timeline-diff">
              <template v-if="getChangedFields(item).length > 0">
                <div
                  v-for="field in getChangedFields(item)"
                  :key="field"
                  class="diff-row"
                >
                  <span class="diff-field">{{ FIELD_LABELS[field] || field }}</span>
                  <div class="diff-values">
                    <span v-if="item.beforeSnapshot?.[field] !== undefined" class="diff-before">
                      {{ formatFieldValue(field, item.beforeSnapshot[field]) }}
                    </span>
                    <span v-else class="diff-before">--</span>
                    <span class="diff-arrow">→</span>
                    <span v-if="item.afterSnapshot?.[field] !== undefined" class="diff-after">
                      {{ formatFieldValue(field, item.afterSnapshot[field]) }}
                    </span>
                    <span v-else class="diff-after">--</span>
                  </div>
                </div>
              </template>
              <div v-else class="diff-empty">无字段变更详情</div>
            </div>

            <div class="timeline-footer">
              <span v-if="item.conflictCheckResult?.hasConflict" class="conflict-summary">
                ⚠️ {{ item.conflictCheckResult.conflicts.length }} 处冲突
              </span>
              <span v-if="item.remark" class="remark-text">备注：{{ item.remark }}</span>
            </div>
          </el-timeline-item>
        </el-timeline>
        <el-empty v-else description="暂无历史变更记录" />
      </div>
    </div>

    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'
import { ElMessage } from 'element-plus'
import * as thresholdApi from '@/api/threshold'
import { SECTOR_COLORS, FIELD_LABELS } from '@/constants/dictionaries'
import type {
  IQuoteThreshold,
  IThresholdHistory,
  IThresholdHistoryResult,
  IThresholdScenarioMatch,
  ThresholdType,
  ConfigStatus,
  ChangeType,
} from '@/types/api'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const props = defineProps<{
  modelValue: boolean
  thresholdId: number | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const visible = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})

const loading = ref(false)
const scenarioLoading = ref(false)
const currentSnapshot = ref<IQuoteThreshold | null>(null)
const historyList = ref<IThresholdHistory[]>([])
const scenarioMatches = ref<IThresholdScenarioMatch[]>([])

const stats = reactive<IThresholdHistoryResult['stats']>({
  changeTypeDist: [],
  operatorDist: [],
  avgInterval: 0,
})

const THRESHOLD_TYPE_LABELS: Record<ThresholdType, string> = {
  change_rate: '涨跌幅',
  volume: '成交量',
  turnover: '成交额',
}

const STATUS_LABELS: Record<ConfigStatus, string> = {
  permanent: '永久',
  temporary: '临时',
  expired: '已过期',
}

const CHANGE_TYPE_LABELS: Record<ChangeType, string> = {
  create: '创建',
  update: '更新',
  delete: '删除',
  expire: '过期',
}

const CHANGE_TYPE_COLORS: Record<ChangeType, string> = {
  create: '#67C23A',
  update: '#409EFF',
  delete: '#E6A23C',
  expire: '#909399',
}

const CONFLICT_TYPE_LABELS: Record<string, string> = {
  logic: '逻辑矛盾',
  extreme: '数值极值',
  drift: '配置漂移',
  overlap: '区间重叠',
}

const allConflicts = computed(() => {
  const conflicts: IThresholdHistory['conflictCheckResult'] extends infer T
    ? T extends { conflicts: infer C }
      ? C
      : never
    : never = []
  historyList.value.forEach(item => {
    if (item.conflictCheckResult?.hasConflict && item.conflictCheckResult.conflicts) {
      conflicts.push(...item.conflictCheckResult.conflicts)
    }
  })
  return conflicts
})

const maxOperatorCount = computed(() => {
  if (stats.operatorDist.length === 0) return 0
  return Math.max(...stats.operatorDist.map(o => o.count))
})

function getThresholdTypeTag(type?: ThresholdType): 'primary' | 'success' | 'warning' {
  const map: Record<ThresholdType, 'primary' | 'success' | 'warning'> = {
    change_rate: 'primary',
    volume: 'success',
    turnover: 'warning',
  }
  return map[type || 'change_rate']
}

function getStatusTagType(status?: ConfigStatus): 'success' | 'warning' | 'info' {
  const map: Record<ConfigStatus, 'success' | 'warning' | 'info'> = {
    permanent: 'success',
    temporary: 'warning',
    expired: 'info',
  }
  return map[status || 'permanent']
}

function getChangeTypeTag(type: ChangeType): 'success' | 'primary' | 'warning' | 'info' {
  const map: Record<ChangeType, 'success' | 'primary' | 'warning' | 'info'> = {
    create: 'success',
    update: 'primary',
    delete: 'warning',
    expire: 'info',
  }
  return map[type]
}

function getSectorTagStyle(sector: string) {
  const color = SECTOR_COLORS[sector] || '#909399'
  return {
    borderColor: `${color}50`,
    color,
  }
}

function formatDateTime(value: string): string {
  return dayjs(value).format('YYYY-MM-DD HH:mm:ss')
}

function getRelativeTime(value: string): string {
  return dayjs(value).fromNow()
}

function getChangedFields(item: IThresholdHistory): string[] {
  const fields: Set<string> = new Set()
  const before = item.beforeSnapshot || {}
  const after = item.afterSnapshot || {}
  Object.keys(before).forEach(k => fields.add(k))
  Object.keys(after).forEach(k => fields.add(k))
  const result: string[] = []
  fields.forEach(f => {
    const b = (before as Record<string, unknown>)[f]
    const a = (after as Record<string, unknown>)[f]
    if (JSON.stringify(b) !== JSON.stringify(a)) {
      result.push(f)
    }
  })
  return result
}

function formatFieldValue(field: string, value: unknown): string {
  if (value === null || value === undefined) return '--'
  if (field === 'thresholdType' && typeof value === 'string') {
    return THRESHOLD_TYPE_LABELS[value as ThresholdType] || value
  }
  if (field === 'configStatus' && typeof value === 'string') {
    return STATUS_LABELS[value as ConfigStatus] || value
  }
  if (typeof value === 'number') {
    return value.toString()
  }
  if (typeof value === 'boolean') {
    return value ? '是' : '否'
  }
  return String(value)
}

async function loadHistoryData() {
  if (!props.thresholdId) return
  loading.value = true
  try {
    const res = await thresholdApi.getThresholdHistory(props.thresholdId, 90)
    const data = res.data
    historyList.value = data.list || []
    stats.changeTypeDist = data.stats?.changeTypeDist || []
    stats.operatorDist = data.stats?.operatorDist || []
    stats.avgInterval = data.stats?.avgInterval || 0
    if (historyList.value.length > 0) {
      const latest = historyList.value[0]
      currentSnapshot.value = {
        id: props.thresholdId,
        ...(latest.afterSnapshot as Partial<IQuoteThreshold>),
      } as IQuoteThreshold
    }
  } catch (error) {
    console.error('加载阈值历史失败:', error)
    ElMessage.error('加载阈值历史失败')
  } finally {
    loading.value = false
  }
}

async function loadScenarios() {
  if (!currentSnapshot.value?.sector) return
  scenarioLoading.value = true
  try {
    const res = await thresholdApi.matchScenarios(currentSnapshot.value.sector, 20)
    scenarioMatches.value = res.data || []
  } catch (error) {
    console.error('加载场景匹配失败:', error)
    scenarioMatches.value = []
  } finally {
    scenarioLoading.value = false
  }
}

async function handleOpen() {
  await loadHistoryData()
  if (currentSnapshot.value?.sector) {
    await loadScenarios()
  }
}

watch(
  () => props.thresholdId,
  () => {
    if (visible.value) {
      handleOpen()
    }
  },
)
</script>
