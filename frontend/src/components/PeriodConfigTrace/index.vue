<template>
  <el-dialog
    :model-value="modelValue"
    title="时段配置溯源与校验"
    width="920px"
    :close-on-click-modal="false"
    @update:model-value="handleClose"
  >
    <div class="period-config-trace">
      <div class="section section-trace">
        <h4 class="section-title">
          <el-icon><Search /></el-icon>
          修改记录溯源
        </h4>
        <div class="filter-bar">
          <el-date-picker
            v-model="filter.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 280px"
          />
          <el-select v-model="filter.period" placeholder="选择时段" clearable style="width: 170px">
            <el-option label="全部时段" value="" />
            <el-option
              v-for="p in TIME_PERIODS"
              :key="p"
              :label="p"
              :value="p"
            />
          </el-select>
          <el-select v-model="filter.changeType" placeholder="变更类型" clearable style="width: 140px">
            <el-option label="全部类型" value="" />
            <el-option
              v-for="(label, key) in ConfigChangeTypeMap"
              :key="key"
              :label="label"
              :value="key"
            />
          </el-select>
          <el-select v-model="filter.operator" placeholder="操作人" clearable style="width: 130px">
            <el-option
              v-for="op in operatorOptions"
              :key="op"
              :label="op"
              :value="op"
            />
          </el-select>
          <el-button type="primary" :loading="loading" @click="handleQuery">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
        </div>
        <el-table
          :data="changeRecords"
          border
          stripe
          max-height="340"
          :row-class-name="traceRowClassName"
          style="width: 100%"
        >
          <el-table-column label="变更ID" min-width="120">
            <template #default="{ row }">
              <el-tooltip :content="row.changeId" placement="top">
                <span class="text-truncate">{{ row.changeId }}</span>
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column label="时段" min-width="150">
            <template #default="{ row }">
              <el-tag
                size="small"
                :color="getPeriodColor(row.period)"
                effect="dark"
                style="color: #fff"
              >
                {{ row.period }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="字段" min-width="120">
            <template #default="{ row }">
              {{ getFieldLabel(row.field) }}
            </template>
          </el-table-column>
          <el-table-column label="变更内容" min-width="180">
            <template #default="{ row }">
              <div class="value-change">
                <span class="old-value">{{ formatFieldValue(row.field, row.oldValue) }}</span>
                <span class="change-arrow" :class="{ 'significant': isSignificantChange(row) }">→</span>
                <span class="new-value" :class="{ 'significant': isSignificantChange(row) }">
                  {{ formatFieldValue(row.field, row.newValue) }}
                </span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作人" min-width="100">
            <template #default="{ row }">
              {{ row.operator }}
            </template>
          </el-table-column>
          <el-table-column label="生效时间" min-width="160">
            <template #default="{ row }">
              {{ formatDate(row.effectiveTime) }}
            </template>
          </el-table-column>
          <el-table-column label="适配场景" min-width="100">
            <template #default="{ row }">
              <el-tag
                v-if="row.adaptedScene"
                size="small"
                effect="plain"
                :style="{ borderColor: SceneTypeColorMap[row.adaptedScene] || '#909399', color: SceneTypeColorMap[row.adaptedScene] || '#909399' }"
              >
                {{ getSceneLabel(row.adaptedScene) }}
              </el-tag>
              <span v-else class="text-muted">—</span>
            </template>
          </el-table-column>
          <el-table-column label="变更类型" min-width="100">
            <template #default="{ row }">
              <el-tag
                size="small"
                :type="getChangeTypeTagType(row.changeType)"
                effect="plain"
              >
                {{ ConfigChangeTypeMap[row.changeType] || row.changeType }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="状态标记" min-width="130">
            <template #default="{ row }">
              <div class="flag-tags">
                <el-tag
                  v-if="row.isUnreasonable"
                  size="small"
                  type="danger"
                  effect="dark"
                  class="flag-tag unreasonable-tag"
                >
                  不合理
                </el-tag>
                <el-tag
                  v-if="row.isDuplicateCoverage"
                  size="small"
                  type="warning"
                  effect="dark"
                  class="flag-tag"
                >
                  重复覆盖
                </el-tag>
                <span v-if="!row.isUnreasonable && !row.isDuplicateCoverage" class="text-muted">
                  正常
                </span>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="section section-stats">
        <h4 class="section-title">
          <el-icon><Histogram /></el-icon>
          异常拦截统计
        </h4>
        <div class="stats-cards">
          <div class="stats-card card-total">
            <div class="card-icon-wrap">
              <el-icon class="card-icon"><DataAnalysis /></el-icon>
            </div>
            <div class="card-content">
              <div class="card-value">{{ traceResult?.summary?.totalChanges || 0 }}</div>
              <div class="card-label">总修改次数</div>
            </div>
          </div>
          <div class="stats-card card-unreasonable" :class="{ 'has-pulse': unreasonableCount > 0 }">
            <div class="card-icon-wrap">
              <el-icon class="card-icon"><Warning /></el-icon>
            </div>
            <div class="card-content">
              <div class="card-value">{{ unreasonableCount }}</div>
              <div class="card-label">不合理阈值</div>
            </div>
          </div>
          <div class="stats-card card-duplicate">
            <div class="card-icon-wrap">
              <el-icon class="card-icon"><Document /></el-icon>
            </div>
            <div class="card-content">
              <div class="card-value">{{ duplicateCoverageCount }}</div>
              <div class="card-label">重复覆盖</div>
            </div>
          </div>
          <div class="stats-card card-recent">
            <div class="card-icon-wrap">
              <el-icon class="card-icon"><Timer /></el-icon>
            </div>
            <div class="card-content">
              <div class="card-value">{{ traceResult?.summary?.recentChanges || 0 }}</div>
              <div class="card-label">近24h变更</div>
            </div>
          </div>
        </div>

        <div class="stats-detail-grid">
          <div class="detail-panel intercept-reasons">
            <div class="panel-header">
              <el-icon><Warning /></el-icon>
              <span>主要拦截原因</span>
            </div>
            <div class="reasons-list">
              <div
                v-for="(reason, index) in topInterceptReasons"
                :key="index"
                class="reason-item"
              >
                <span class="reason-rank" :class="'rank-' + (index + 1)">{{ index + 1 }}</span>
                <span class="reason-text">{{ reason.text }}</span>
                <el-tag size="small" type="danger" effect="plain" class="reason-count">
                  {{ reason.count }}次
                </el-tag>
              </div>
              <div v-if="topInterceptReasons.length === 0" class="empty-text">
                暂无拦截记录
              </div>
            </div>
          </div>
          <div class="detail-panel period-breakdown">
            <div class="panel-header">
              <el-icon><Histogram /></el-icon>
              <span>各时段变更分布</span>
            </div>
            <div class="period-bars">
              <div
                v-for="period in periodBreakdown"
                :key="period.name"
                class="period-bar-row"
              >
                <span class="period-name">{{ period.shortName }}</span>
                <div class="bar-container">
                  <div
                    class="bar-fill"
                    :style="{
                      width: period.percentage + '%',
                      background: period.color
                    }"
                  ></div>
                </div>
                <span class="period-count">{{ period.count }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="section section-matching">
        <h4 class="section-title">
          <el-icon><TrendCharts /></el-icon>
          匹配度校验与优化建议
        </h4>

        <div class="matching-overview">
          <div class="matching-ring-wrap">
            <div class="matching-ring" :style="{ '--degree': overallMatchingDegree }">
              <svg class="ring-svg" viewBox="0 0 120 120">
                <defs>
                  <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#409eff" />
                    <stop offset="50%" stop-color="#67c23a" />
                    <stop offset="100%" stop-color="#85ce61" />
                  </linearGradient>
                </defs>
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="#ebeef5"
                  stroke-width="10"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="url(#ringGradient)"
                  stroke-width="10"
                  stroke-linecap="round"
                  :stroke-dasharray="circumference"
                  :stroke-dashoffset="ringOffset"
                  transform="rotate(-90 60 60)"
                  class="ring-progress"
                />
              </svg>
              <div class="ring-center">
                <div class="ring-value">{{ overallMatchingDegree }}%</div>
                <div class="ring-label">整体匹配度</div>
              </div>
            </div>
          </div>
          <div class="matching-summary">
            <div class="summary-status" :class="overallPassed ? 'status-passed' : 'status-failed'">
              <el-icon class="status-icon">
                <CircleCheck v-if="overallPassed" />
                <CircleClose v-else />
              </el-icon>
              <span class="status-text">{{ overallPassed ? '校验通过' : '存在异常项' }}</span>
            </div>
            <div class="summary-desc">
              已校验 <strong>{{ periodMatches.length }}</strong> 个时段配置，
              <strong :class="overallPassed ? 'text-success' : 'text-danger'">
                {{ passedPeriodCount }}
              </strong> 个时段全部通过
            </div>
            <div class="summary-tags">
              <el-tag size="small" type="success" effect="plain">
                通过 {{ passedPeriodCount }}
              </el-tag>
              <el-tag size="small" type="danger" effect="plain">
                异常 {{ periodMatches.length - passedPeriodCount }}
              </el-tag>
            </div>
          </div>
        </div>

        <div class="period-matching-table">
          <div class="table-header">时段匹配详情</div>
          <div
            v-for="match in periodMatches"
            :key="match.period"
            class="period-match-row"
            :class="{ 'row-failed': !match.overallPassed }"
          >
            <div class="period-info">
              <el-tag
                size="small"
                :color="getPeriodColor(match.period)"
                effect="dark"
                style="color: #fff"
              >
                {{ match.period }}
              </el-tag>
              <el-tag
                size="small"
                :type="match.overallPassed ? 'success' : 'danger'"
                effect="plain"
                class="period-pass-tag"
              >
                {{ match.overallPassed ? '全部通过' : '存在异常' }}
              </el-tag>
            </div>
            <div class="match-score">
              <el-progress
                :percentage="match.matchingDegree"
                :color="match.matchingDegree >= 80 ? '#67c23a' : match.matchingDegree >= 60 ? '#e6a23c' : '#f56c6c'"
                :stroke-width="8"
                style="width: 180px"
              />
              <span class="score-text">{{ match.matchingDegree }}分</span>
            </div>
            <div class="checks-preview">
              <el-icon
                v-for="(check, idx) in match.checks.slice(0, 5)"
                :key="idx"
                class="check-icon-mini"
                :class="check.passed ? 'icon-passed' : 'icon-failed'"
              >
                <CircleCheck v-if="check.passed" />
                <CircleClose v-else />
              </el-icon>
              <span v-if="match.checks.length > 5" class="checks-more">
                +{{ match.checks.length - 5 }}
              </span>
            </div>
          </div>
        </div>

        <div class="checks-detail">
          <div class="detail-subtitle">
            <el-icon><Setting /></el-icon>
            详细校验项
          </div>
          <div class="checks-accordion">
            <div
              v-for="match in periodMatches"
              :key="match.period + '-checks'"
              class="check-group"
            >
              <div class="check-group-header" @click="toggleCheckGroup(match.period)">
                <span class="group-period">{{ match.period }}</span>
                <el-tag
                  size="small"
                  :type="match.overallPassed ? 'success' : 'danger'"
                  effect="plain"
                >
                  {{ match.checks.filter(c => c.passed).length }}/{{ match.checks.length }} 通过
                </el-tag>
                <el-icon class="arrow-icon" :class="{ expanded: expandedGroups.includes(match.period) }">
                  <component :is="expandedGroups.includes(match.period) ? 'ArrowUp' : 'ArrowDown'" />
                </el-icon>
              </div>
              <div v-show="expandedGroups.includes(match.period)" class="check-group-body">
                <div
                  v-for="(check, cIdx) in match.checks"
                  :key="cIdx"
                  class="check-detail-item"
                  :class="{ 'check-failed': !check.passed }"
                >
                  <div class="check-status-col">
                    <el-icon v-if="check.passed" class="icon-passed-lg"><CircleCheck /></el-icon>
                    <el-icon v-else class="icon-failed-lg"><CircleClose /></el-icon>
                  </div>
                  <div class="check-info-col">
                    <div class="check-name">{{ check.name }}</div>
                    <div class="check-detail-text">{{ check.detail }}</div>
                  </div>
                  <div class="check-score-col">
                    <el-tag
                      size="small"
                      :type="check.passed ? 'success' : 'danger'"
                      effect="dark"
                    >
                      {{ check.score }}分
                    </el-tag>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="optimization-section" v-if="optimizationSuggestions.length > 0">
          <div class="detail-subtitle">
            <el-icon><TrendCharts /></el-icon>
            优化建议
          </div>
          <div class="optimization-list">
            <div
              v-for="(suggestion, index) in optimizationSuggestions"
              :key="index"
              class="optimization-item"
              :class="'impact-' + suggestion.impact"
            >
              <div class="opt-header">
                <div class="opt-field-info">
                  <el-icon class="opt-icon"><Setting /></el-icon>
                  <span class="opt-field">{{ getFieldLabel(suggestion.field) }}</span>
                  <el-tag size="small" effect="plain" class="opt-period-tag">
                    {{ suggestion.period }}
                  </el-tag>
                </div>
                <el-tag
                  size="small"
                  :type="getImpactTagType(suggestion.impact)"
                  effect="dark"
                  class="impact-tag"
                >
                  {{ getImpactLabel(suggestion.impact) }}
                </el-tag>
              </div>
              <div class="opt-value-row">
                <div class="value-block">
                  <span class="value-label">当前值</span>
                  <span class="current-value">{{ formatFieldValue(suggestion.field, suggestion.currentValue) }}</span>
                </div>
                <span class="opt-arrow" :class="'arrow-' + suggestion.impact">→</span>
                <div class="value-block">
                  <span class="value-label">建议值</span>
                  <span class="suggested-value">{{ formatFieldValue(suggestion.field, suggestion.suggestedValue) }}</span>
                </div>
              </div>
              <div class="opt-reason">
                <el-icon class="reason-icon"><Warning /></el-icon>
                <span>{{ suggestion.reason }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Search,
  Warning,
  CircleCheck,
  CircleClose,
  TrendCharts,
  Setting,
  Timer,
  Document,
  DataAnalysis,
  Histogram,
  ArrowDown,
  ArrowUp
} from '@element-plus/icons-vue'
import { getPeriodConfigTraceApi } from '@/api/capacity'
import type { PeriodConfigTraceResult, ConfigChangeRecord, PeriodConfigMatch } from '@/types/capacity'
import { ConfigChangeType, ConfigChangeTypeMap, SceneTypeColorMap, TIME_PERIODS, PERIOD_THRESHOLD_RANGES, SceneTypeMap } from '@/enums/capacity'
import { formatDate } from '@/utils/format'

interface Props {
  modelValue: boolean
  city?: string
}

const props = withDefaults(defineProps<Props>(), {
  city: ''
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const loading = ref(false)
const traceResult = ref<PeriodConfigTraceResult | null>(null)
const expandedGroups = ref<string[]>([])

const filter = reactive({
  dateRange: null as [string, string] | null,
  period: '',
  changeType: '',
  operator: ''
})

const changeRecords = computed<ConfigChangeRecord[]>(() => traceResult.value?.changeRecords || [])
const periodMatches = computed<PeriodConfigMatch[]>(() => traceResult.value?.matches || [])
const optimizationSuggestions = computed(() => traceResult.value?.optimizationSuggestions || [])
const unreasonableCount = computed(() => traceResult.value?.unreasonableCount || 0)
const duplicateCoverageCount = computed(() => traceResult.value?.duplicateCoverageCount || 0)
const overallMatchingDegree = computed(() => traceResult.value?.overallMatchingDegree || 0)
const overallPassed = computed(() => {
  const matches = periodMatches.value
  if (matches.length === 0) return true
  return matches.every(m => m.overallPassed)
})
const passedPeriodCount = computed(() => periodMatches.value.filter(m => m.overallPassed).length)

const circumference = 2 * Math.PI * 52
const ringOffset = computed(() => {
  return circumference - (overallMatchingDegree.value / 100) * circumference
})

const operatorOptions = computed(() => {
  const operators = new Set(changeRecords.value.map(r => r.operator).filter(Boolean))
  return Array.from(operators)
})

const periodColorMap: Record<string, string> = {
  '早高峰(7:00-9:00)': '#f56c6c',
  '日间(9:00-17:00)': '#409eff',
  '晚高峰(17:00-19:00)': '#e6a23c',
  '夜间(19:00-23:00)': '#909399',
  '凌晨(23:00-7:00)': '#9b59b6'
}

const getPeriodColor = (period: string) => periodColorMap[period] || '#409eff'

const getFieldLabel = (field: string) => {
  const rangeInfo = PERIOD_THRESHOLD_RANGES[field as keyof typeof PERIOD_THRESHOLD_RANGES]
  return rangeInfo?.label || field
}

const formatFieldValue = (field: string, value: number) => {
  const rangeInfo = PERIOD_THRESHOLD_RANGES[field as keyof typeof PERIOD_THRESHOLD_RANGES]
  if (!rangeInfo) return String(value)
  if (rangeInfo.unit === '%') {
    return (value * 100).toFixed(0) + '%'
  }
  return value + rangeInfo.unit
}

const isSignificantChange = (row: ConfigChangeRecord) => {
  if (row.oldValue === 0) return row.newValue > 0
  const changeRatio = Math.abs(row.newValue - row.oldValue) / Math.max(Math.abs(row.oldValue), 0.001)
  return changeRatio >= 0.3
}

const getSceneLabel = (scene: string) => SceneTypeMap[scene] || scene

const getChangeTypeTagType = (type: string): '' | 'success' | 'warning' | 'danger' | 'info' => {
  const typeMap: Record<string, '' | 'success' | 'warning' | 'danger' | 'info'> = {
    [ConfigChangeType.MANUAL]: '',
    [ConfigChangeType.SCENE_ADAPT]: 'success',
    [ConfigChangeType.BATCH]: 'warning',
    [ConfigChangeType.RESTORE_DEFAULTS]: 'info'
  }
  return typeMap[type] || ''
}

const getImpactTagType = (impact: string): '' | 'success' | 'warning' | 'danger' | 'info' => {
  const map: Record<string, '' | 'success' | 'warning' | 'danger' | 'info'> = {
    high: 'danger',
    medium: 'warning',
    low: ''
  }
  return map[impact] || ''
}

const getImpactLabel = (impact: string) => {
  const map: Record<string, string> = {
    high: '高影响',
    medium: '中影响',
    low: '低影响'
  }
  return map[impact] || impact
}

const topInterceptReasons = computed(() => {
  const reasonCounts: Record<string, number> = {}
  changeRecords.value.forEach(r => {
    if (r.isUnreasonable && r.unreasonableReason) {
      reasonCounts[r.unreasonableReason] = (reasonCounts[r.unreasonableReason] || 0) + 1
    }
  })
  if (Object.keys(reasonCounts).length === 0) {
    const summaryReasons = traceResult.value?.summary?.topInterceptReasons || []
    return summaryReasons.slice(0, 5).map((text, i) => ({ text, count: Math.max(1, 5 - i) }))
  }
  return Object.entries(reasonCounts)
    .map(([text, count]) => ({ text, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
})

const periodBreakdown = computed(() => {
  const counts: Record<string, number> = {}
  TIME_PERIODS.forEach(p => { counts[p] = 0 })
  changeRecords.value.forEach(r => {
    if (counts[r.period] !== undefined) {
      counts[r.period]++
    }
  })
  const maxCount = Math.max(1, ...Object.values(counts))
  return TIME_PERIODS.map(p => ({
    name: p,
    shortName: p.split('(')[0],
    count: counts[p],
    percentage: (counts[p] / maxCount) * 100,
    color: getPeriodColor(p)
  }))
})

const traceRowClassName = ({ row }: { row: ConfigChangeRecord }) => {
  if (row.isUnreasonable) return 'row-unreasonable'
  if (row.isDuplicateCoverage) return 'row-duplicate'
  return ''
}

const toggleCheckGroup = (period: string) => {
  const idx = expandedGroups.value.indexOf(period)
  if (idx >= 0) {
    expandedGroups.value.splice(idx, 1)
  } else {
    expandedGroups.value.push(period)
  }
}

const handleClose = () => {
  emit('update:modelValue', false)
}

const handleQuery = async () => {
  loading.value = true
  try {
    const params: Record<string, string> = {}
    if (props.city) {
      params.city = props.city
    }
    if (filter.dateRange && filter.dateRange.length === 2) {
      params.startDate = filter.dateRange[0]
      params.endDate = filter.dateRange[1]
    }
    if (filter.period) {
      params.period = filter.period
    }
    if (filter.operator) {
      params.operatorId = filter.operator
    }
    if (filter.changeType) {
      params.changeType = filter.changeType
    }

    const res = await getPeriodConfigTraceApi(params)
    traceResult.value = res.data
    if (periodMatches.value.length > 0) {
      expandedGroups.value = [periodMatches.value[0].period]
    }
    ElMessage.success('查询完成')
  } catch (error: any) {
    ElMessage.error(error.message || '查询失败')
  } finally {
    loading.value = false
  }
}

watch(() => props.modelValue, (val) => {
  if (val && !traceResult.value) {
    handleQuery()
  }
}, { immediate: true })
</script>

<style lang="scss" scoped>
.period-config-trace {
  .section {
    margin-bottom: 28px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 16px 0;
    font-size: 16px;
    color: #303133;
    padding-bottom: 10px;
    border-bottom: 1px solid #ebeef5;
  }

  .filter-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }

  .text-truncate {
    display: inline-block;
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    vertical-align: middle;
  }

  .text-muted {
    color: #c0c4cc;
  }

  .value-change {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;

    .old-value {
      color: #909399;
      text-decoration: line-through;
      opacity: 0.7;
    }

    .change-arrow {
      color: #c0c4cc;
      font-weight: 500;

      &.significant {
        color: #f56c6c;
        font-weight: 700;
      }
    }

    .new-value {
      color: #303133;
      font-weight: 500;

      &.significant {
        color: #f56c6c;
        font-weight: 700;
        padding: 1px 6px;
        background: #fef0f0;
        border-radius: 3px;
      }
    }
  }

  .flag-tags {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-wrap: wrap;

    .flag-tag {
      font-size: 11px;
    }

    .unreasonable-tag {
      animation: unreasonable-pulse 1.8s ease-in-out infinite;
    }
  }

  @keyframes unreasonable-pulse {
    0%, 100% {
      box-shadow: 0 0 0 0 rgba(245, 108, 108, 0.5);
      opacity: 1;
    }
    50% {
      box-shadow: 0 0 0 6px rgba(245, 108, 108, 0);
      opacity: 0.85;
    }
  }

  :deep(.row-unreasonable) {
    background: #fef0f0 !important;
    border-left: 3px solid #f56c6c;

    td {
      background: transparent !important;
    }
  }

  :deep(.row-duplicate) {
    background: #fdf6ec !important;
    border-left: 3px solid #e6a23c;

    td {
      background: transparent !important;
    }
  }

  .stats-cards {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 20px;

    .stats-card {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 18px 16px;
      border-radius: 10px;
      border: 1px solid #ebeef5;
      transition: all 0.3s;
      position: relative;
      overflow: hidden;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
      }

      .card-icon-wrap {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        .card-icon {
          font-size: 24px;
          color: #fff;
        }
      }

      .card-content {
        .card-value {
          font-size: 26px;
          font-weight: 700;
          line-height: 1.2;
          margin-bottom: 4px;
        }

        .card-label {
          font-size: 12px;
          color: #909399;
        }
      }

      &.card-total {
        background: linear-gradient(135deg, #ecf5ff 0%, #d9ecff 100%);
        border-color: #b3d8ff;

        .card-icon-wrap {
          background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
        }

        .card-value {
          color: #409eff;
        }
      }

      &.card-unreasonable {
        background: linear-gradient(135deg, #fef0f0 0%, #fde2e2 100%);
        border-color: #fbc4c4;

        .card-icon-wrap {
          background: linear-gradient(135deg, #f56c6c 0%, #f78989 100%);
        }

        .card-value {
          color: #f56c6c;
        }

        &.has-pulse::after {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: 12px;
          border: 2px solid transparent;
          animation: card-pulse 2s ease-in-out infinite;
        }
      }

      &.card-duplicate {
        background: linear-gradient(135deg, #fdf6ec 0%, #faecd8 100%);
        border-color: #f5dab1;

        .card-icon-wrap {
          background: linear-gradient(135deg, #e6a23c 0%, #ebb563 100%);
        }

        .card-value {
          color: #e6a23c;
        }
      }

      &.card-recent {
        background: linear-gradient(135deg, #f0f9eb 0%, #e1f3d8 100%);
        border-color: #c2e7b0;

        .card-icon-wrap {
          background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
        }

        .card-value {
          color: #67c23a;
        }
      }
    }
  }

  @keyframes card-pulse {
    0%, 100% {
      border-color: rgba(245, 108, 108, 0);
    }
    50% {
      border-color: rgba(245, 108, 108, 0.5);
    }
  }

  .stats-detail-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;

    .detail-panel {
      background: #fff;
      border: 1px solid #ebeef5;
      border-radius: 8px;
      padding: 16px;

      .panel-header {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 14px;
        font-weight: 500;
        color: #303133;
        margin-bottom: 14px;
      }
    }

    .intercept-reasons {
      .reasons-list {
        .reason-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          background: #fafafa;
          border-radius: 6px;
          margin-bottom: 8px;
          transition: all 0.2s;

          &:last-child {
            margin-bottom: 0;
          }

          &:hover {
            background: #f5f7fa;
          }

          .reason-rank {
            width: 22px;
            height: 22px;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 600;
            color: #fff;
            background: #909399;
            flex-shrink: 0;

            &.rank-1 {
              background: linear-gradient(135deg, #f56c6c, #f78989);
            }
            &.rank-2 {
              background: linear-gradient(135deg, #e6a23c, #ebb563);
            }
            &.rank-3 {
              background: linear-gradient(135deg, #409eff, #66b1ff);
            }
          }

          .reason-text {
            flex: 1;
            font-size: 13px;
            color: #606266;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .reason-count {
            flex-shrink: 0;
          }
        }

        .empty-text {
          text-align: center;
          color: #c0c4cc;
          font-size: 13px;
          padding: 20px 0;
        }
      }
    }

    .period-breakdown {
      .period-bars {
        .period-bar-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;

          &:last-child {
            margin-bottom: 0;
          }

          .period-name {
            width: 54px;
            font-size: 12px;
            color: #606266;
            flex-shrink: 0;
            text-align: right;
          }

          .bar-container {
            flex: 1;
            height: 18px;
            background: #f5f7fa;
            border-radius: 9px;
            overflow: hidden;

            .bar-fill {
              height: 100%;
              border-radius: 9px;
              transition: width 0.5s ease;
              min-width: 4px;
            }
          }

          .period-count {
            width: 28px;
            font-size: 12px;
            color: #909399;
            flex-shrink: 0;
            text-align: left;
            font-weight: 500;
          }
        }
      }
    }
  }

  .matching-overview {
    display: flex;
    align-items: center;
    gap: 32px;
    padding: 24px;
    background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%);
    border-radius: 12px;
    margin-bottom: 20px;
    border: 1px solid #ebeef5;

    .matching-ring-wrap {
      flex-shrink: 0;
    }

    .matching-ring {
      position: relative;
      width: 140px;
      height: 140px;

      .ring-svg {
        width: 100%;
        height: 100%;
        transform: rotate(0deg);
      }

      .ring-progress {
        transition: stroke-dashoffset 0.8s ease;
      }

      .ring-center {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;

        .ring-value {
          font-size: 30px;
          font-weight: 700;
          background: linear-gradient(135deg, #409eff, #67c23a);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1.2;
        }

        .ring-label {
          font-size: 12px;
          color: #909399;
          margin-top: 4px;
        }
      }
    }

    .matching-summary {
      flex: 1;

      .summary-status {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;

        .status-icon {
          font-size: 24px;
        }

        .status-text {
          font-size: 18px;
          font-weight: 600;
        }

        &.status-passed {
          .status-icon { color: #67c23a; }
          .status-text { color: #67c23a; }
        }

        &.status-failed {
          .status-icon { color: #f56c6c; }
          .status-text { color: #f56c6c; }
        }
      }

      .summary-desc {
        font-size: 13px;
        color: #606266;
        margin-bottom: 14px;

        strong {
          font-weight: 600;
        }

        .text-success { color: #67c23a; }
        .text-danger { color: #f56c6c; }
      }

      .summary-tags {
        display: flex;
        gap: 8px;
      }
    }
  }

  .period-matching-table {
    margin-bottom: 20px;

    .table-header {
      font-size: 14px;
      font-weight: 500;
      color: #303133;
      margin-bottom: 12px;
    }

    .period-match-row {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 12px 16px;
      background: #fff;
      border: 1px solid #ebeef5;
      border-radius: 8px;
      margin-bottom: 8px;
      transition: all 0.2s;

      &:last-child {
        margin-bottom: 0;
      }

      &:hover {
        border-color: #dcdfe6;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      }

      &.row-failed {
        background: linear-gradient(135deg, #fef0f0 0%, #ffffff 100%);
        border-color: #fbc4c4;
      }

      .period-info {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 240px;
        flex-shrink: 0;

        .period-pass-tag {
          margin-left: auto;
        }
      }

      .match-score {
        display: flex;
        align-items: center;
        gap: 10px;
        flex: 1;

        .score-text {
          font-size: 13px;
          font-weight: 600;
          color: #606266;
          min-width: 45px;
        }
      }

      .checks-preview {
        display: flex;
        align-items: center;
        gap: 4px;

        .check-icon-mini {
          font-size: 14px;

          &.icon-passed { color: #67c23a; }
          &.icon-failed { color: #f56c6c; }
        }

        .checks-more {
          font-size: 12px;
          color: #909399;
          margin-left: 2px;
        }
      }
    }
  }

  .checks-detail {
    margin-bottom: 20px;

    .detail-subtitle {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      font-weight: 500;
      color: #303133;
      margin-bottom: 12px;
    }

    .checks-accordion {
      border: 1px solid #ebeef5;
      border-radius: 8px;
      overflow: hidden;

      .check-group {
        border-bottom: 1px solid #ebeef5;

        &:last-child {
          border-bottom: none;
        }

        .check-group-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: #fafafa;
          cursor: pointer;
          transition: background 0.2s;

          &:hover {
            background: #f5f7fa;
          }

          .group-period {
            flex: 1;
            font-size: 13px;
            font-weight: 500;
            color: #303133;
          }

          .arrow-icon {
            font-size: 14px;
            color: #909399;
            transition: transform 0.2s;

            &.expanded {
              transform: rotate(0deg);
            }
          }

          .expand-icon {
            display: none;
          }
        }

        .check-group-body {
          background: #fff;

          .check-detail-item {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 12px 16px 12px 40px;
            border-top: 1px solid #f5f7fa;
            transition: background 0.2s;

            &:hover {
              background: #fafafa;
            }

            &.check-failed {
              background: #fef0f0;
              border-left: 3px solid #f56c6c;
            }

            .check-status-col {
              flex-shrink: 0;
              margin-top: 1px;

              .icon-passed-lg {
                font-size: 18px;
                color: #67c23a;
              }

              .icon-failed-lg {
                font-size: 18px;
                color: #f56c6c;
              }
            }

            .check-info-col {
              flex: 1;
              min-width: 0;

              .check-name {
                font-size: 13px;
                font-weight: 500;
                color: #303133;
                margin-bottom: 4px;
              }

              .check-detail-text {
                font-size: 12px;
                color: #909399;
                line-height: 1.5;
              }
            }

            .check-score-col {
              flex-shrink: 0;
            }
          }
        }
      }
    }
  }

  .optimization-section {
    .detail-subtitle {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      font-weight: 500;
      color: #303133;
      margin-bottom: 12px;
    }

    .optimization-list {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 14px;

      .optimization-item {
        padding: 16px;
        background: #fff;
        border: 1px solid #ebeef5;
        border-radius: 8px;
        transition: all 0.3s;
        border-left-width: 4px;

        &:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
          transform: translateY(-1px);
        }

        &.impact-high {
          border-left-color: #f56c6c;
          background: linear-gradient(135deg, #fef0f0 0%, #ffffff 100%);
        }

        &.impact-medium {
          border-left-color: #e6a23c;
          background: linear-gradient(135deg, #fdf6ec 0%, #ffffff 100%);
        }

        &.impact-low {
          border-left-color: #409eff;
          background: linear-gradient(135deg, #ecf5ff 0%, #ffffff 100%);
        }

        .opt-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;

          .opt-field-info {
            display: flex;
            align-items: center;
            gap: 6px;

            .opt-icon {
              font-size: 16px;
              color: #606266;
            }

            .opt-field {
              font-size: 14px;
              font-weight: 500;
              color: #303133;
            }

            .opt-period-tag {
              margin-left: 4px;
            }
          }

          .impact-tag {
            font-size: 11px;
          }
        }

        .opt-value-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 10px 12px;
          background: #fafafa;
          border-radius: 6px;
          margin-bottom: 10px;

          .value-block {
            display: flex;
            flex-direction: column;
            gap: 2px;

            .value-label {
              font-size: 11px;
              color: #909399;
            }

            .current-value {
              font-size: 15px;
              font-weight: 500;
              color: #909399;
            }

            .suggested-value {
              font-size: 15px;
              font-weight: 700;
              color: #409eff;
            }
          }

          .opt-arrow {
            font-size: 20px;
            font-weight: 700;
            flex-shrink: 0;
            transition: all 0.2s;

            &.arrow-high {
              color: #f56c6c;
            }
            &.arrow-medium {
              color: #e6a23c;
            }
            &.arrow-low {
              color: #409eff;
            }
          }
        }

        .opt-reason {
          display: flex;
          align-items: flex-start;
          gap: 6px;
          font-size: 12px;
          color: #606266;
          line-height: 1.6;

          .reason-icon {
            font-size: 14px;
            color: #e6a23c;
            flex-shrink: 0;
            margin-top: 1px;
          }
        }
      }
    }
  }
}
</style>
