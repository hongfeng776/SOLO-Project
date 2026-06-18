<template>
  <FinDialog
    :model-value="visible"
    title="风控规则溯源"
    width="1000px"
    :hide-footer="true"
    @update:visible="handleUpdateVisible"
  >
    <div v-if="ruleId" class="history-dialog">
      <div class="history-header">
        <div class="header-info">
          <el-icon :size="20" :color="getRuleTypeColor(currentRuleType)">
            <component :is="getRuleTypeIcon(currentRuleType)" />
          </el-icon>
          <div class="info-text">
            <div class="rule-name">{{ currentRuleName }}</div>
            <div class="rule-code">规则编码：<span class="code-text">{{ currentRuleCode }}</span></div>
          </div>
        </div>
        <div class="header-stats" v-if="historyStats">
          <div class="stat-item">
            <div class="stat-num">{{ historyStats.total || 0 }}</div>
            <div class="stat-label">变更记录</div>
          </div>
          <div class="stat-item conflict" :class="{ highlight: historyStats.conflictCount > 0 }">
            <div class="stat-num">{{ historyStats.conflictCount || 0 }}</div>
            <div class="stat-label">冲突预警</div>
          </div>
          <div class="stat-item">
            <div class="stat-num">{{ operatorCount }}</div>
            <div class="stat-label">操作人数</div>
          </div>
        </div>
      </div>

      <div class="history-toolbar">
        <div class="filter-group">
          <span class="filter-label">变更类型：</span>
          <el-radio-group v-model="filterChangeType" size="small" @change="fetchHistory">
            <el-radio-button value="">全部</el-radio-button>
            <el-radio-button :value="RiskRuleChangeType.CREATE">创建</el-radio-button>
            <el-radio-button :value="RiskRuleChangeType.UPDATE">修改</el-radio-button>
            <el-radio-button :value="RiskRuleChangeType.ENABLE">启用</el-radio-button>
            <el-radio-button :value="RiskRuleChangeType.DISABLE">禁用</el-radio-button>
            <el-radio-button :value="RiskRuleChangeType.RESET">重置</el-radio-button>
          </el-radio-group>
        </div>
        <el-button type="primary" plain size="small" @click="fetchHistory">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>

      <div class="timeline-container" v-loading="loading">
        <el-empty v-if="!loading && historyList.length === 0" description="暂无变更记录" />

        <el-timeline v-else>
          <el-timeline-item
            v-for="(item, idx) in historyList"
            :key="item.id"
            :timestamp="formatDateTime(item.createdAt)"
            :type="getTimelineType(item.changeType)"
            placement="top"
          >
            <div class="history-card" :class="{ 'has-conflict': item.compatibilityCheck && !item.compatibilityCheck.compatible }">
              <div class="card-header">
                <div class="header-left">
                  <el-tag
                    size="small"
                    effect="dark"
                    :color="getChangeTypeColor(item.changeType)"
                    style="margin-right: 8px;"
                  >
                    {{ getChangeTypeLabel(item.changeType) }}
                  </el-tag>
                  <span class="operator">
                    <el-icon><User /></el-icon>
                    {{ item.operatorName }}
                  </span>
                  <span class="effect-scope">
                    <el-icon><Share /></el-icon>
                    {{ item.effectScope }}
                  </span>
                </div>
                <div class="header-right">
                  <el-button
                    type="primary"
                    link
                    size="small"
                    @click="toggleExpand(idx)"
                  >
                    <el-icon>
                      <component :is="expandedIndex === idx ? 'ArrowUp' : 'ArrowDown'" />
                    </el-icon>
                    {{ expandedIndex === idx ? '收起' : '查看详情' }}
                  </el-button>
                </div>
              </div>

              <div class="card-summary">
                <span v-if="item.changedFields.length > 0">
                  <span class="summary-label">变更字段：</span>
                  <el-tag
                    v-for="field in item.changedFields.slice(0, 5)"
                    :key="field"
                    size="small"
                    effect="plain"
                    class="field-tag"
                  >
                    {{ field }}
                  </el-tag>
                  <span v-if="item.changedFields.length > 5" class="more-tip">
                    等{{ item.changedFields.length }}项
                  </span>
                </span>
                <span v-else class="summary-label">无字段变更记录</span>
              </div>

              <transition name="card-expand">
                <div v-show="expandedIndex === idx" class="card-detail">
                  <div v-if="item.compatibilityCheck" class="compatibility-box">
                    <div class="compatibility-header">
                      <el-icon :color="item.compatibilityCheck.compatible ? '#67C23A' : '#F56C6C'">
                        <component :is="item.compatibilityCheck.compatible ? 'CircleCheckFilled' : 'WarningFilled'" />
                      </el-icon>
                      <span :class="item.compatibilityCheck.compatible ? 'compat-ok' : 'compat-warn'">
                        {{ item.compatibilityCheck.compatible ? '兼容性校验通过' : '存在兼容性问题' }}
                      </span>
                    </div>

                    <div v-if="item.compatibilityCheck.conflicts.length > 0" class="conflict-list">
                      <div
                        v-for="(c, i) in item.compatibilityCheck.conflicts"
                        :key="i"
                        class="conflict-item"
                        :class="'level-' + c.level"
                      >
                        <span class="conflict-level">{{ getConflictLevelLabel(c.level) }}</span>
                        <span class="conflict-type">[{{ getConflictTypeLabel(c.conflictType) }}]</span>
                        <span class="conflict-msg">{{ c.message }}</span>
                        <span v-if="c.relatedRuleName" class="conflict-related">
                          相关规则：{{ c.relatedRuleName }}
                        </span>
                      </div>
                    </div>

                    <div v-if="item.compatibilityCheck.suggestions.length > 0" class="suggestion-list">
                      <div class="suggestion-title">优化建议：</div>
                      <ul>
                        <li v-for="(s, i) in item.compatibilityCheck.suggestions" :key="i">{{ s }}</li>
                      </ul>
                    </div>
                  </div>

                  <div class="snapshot-compare">
                    <div class="compare-title">变更对比</div>
                    <div class="compare-grid">
                      <div class="compare-col before">
                        <div class="col-header">变更前</div>
                        <el-descriptions :column="1" size="small" border>
                          <el-descriptions-item
                            v-for="field in getDisplayFields(item.beforeSnapshot, item.afterSnapshot)"
                            :key="'b' + field"
                            :label="getFieldLabel(field)"
                          >
                            <span class="empty-value" v-if="!hasValue(item.beforeSnapshot, field)">-</span>
                            <span v-else>{{ formatFieldValue(field, item.beforeSnapshot[field]) }}</span>
                          </el-descriptions-item>
                        </el-descriptions>
                      </div>

                      <div class="compare-icon">
                        <el-icon :size="24" color="#409EFF"><Right /></el-icon>
                      </div>

                      <div class="compare-col after">
                        <div class="col-header after-header">变更后</div>
                        <el-descriptions :column="1" size="small" border>
                          <el-descriptions-item
                            v-for="field in getDisplayFields(item.beforeSnapshot, item.afterSnapshot)"
                            :key="'a' + field"
                            :label="getFieldLabel(field)"
                          >
                            <span :class="{ changed: isFieldChanged(item, field) }">
                              <span v-if="!hasValue(item.afterSnapshot, field)">-</span>
                              <span v-else>{{ formatFieldValue(field, item.afterSnapshot[field]) }}</span>
                            </span>
                          </el-descriptions-item>
                        </el-descriptions>
                      </div>
                    </div>
                  </div>

                  <div v-if="item.remark" class="remark-box">
                    <el-icon><Document /></el-icon>
                    <span class="remark-label">操作备注：</span>
                    <span class="remark-content">{{ item.remark }}</span>
                  </div>
                </div>
              </transition>
            </div>
          </el-timeline-item>
        </el-timeline>
      </div>

      <div class="scenario-section">
        <div class="section-title">
          <el-icon><TrendCharts /></el-icon>
          市场波动场景匹配
        </div>
        <div class="scenario-grid">
          <div
            v-for="scenario in scenarioMatches"
            :key="scenario.scenarioName"
            class="scenario-card"
          >
            <div class="scenario-header">
              <el-progress
                type="dashboard"
                :percentage="Math.round(scenario.matchScore * 100)"
                :width="80"
                :stroke-width="8"
                :color="getScoreColor(scenario.matchScore)"
              />
              <div class="scenario-info">
                <div class="scenario-name">{{ scenario.scenarioName }}</div>
                <div class="scenario-desc">{{ scenario.scenarioDescription }}</div>
                <div class="scenario-range">
                  波动率区间：<strong>{{ scenario.volatilityRange[0] }}% ~ {{ scenario.volatilityRange[1] }}%</strong>
                </div>
              </div>
            </div>
            <div class="scenario-rules" v-if="scenario.suggestedRules?.length > 0">
              <div class="rules-title">推荐规则：</div>
              <el-tag
                v-for="r in scenario.suggestedRules"
                :key="r.ruleId"
                size="small"
                effect="plain"
                class="rule-tag"
                :color="getRuleTypeColor(r.ruleType) + '30'"
                :style="{ color: getRuleTypeColor(r.ruleType) }"
              >
                {{ r.ruleName }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>

      <div class="history-pagination" v-if="totalHistory > pageSize">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="totalHistory"
          layout="prev, pager, next, jumper, ->, total"
          @current-change="fetchHistory"
          @size-change="fetchHistory"
        />
      </div>
    </div>
  </FinDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Refresh,
  User,
  Share,
  ArrowDown,
  ArrowUp,
  Right,
  Document,
  TrendCharts,
  CircleCheckFilled,
  WarningFilled,
  Money,
  Goods,
  Timer,
  Setting,
} from '@element-plus/icons-vue'
import FinDialog from '@/components/common/FinDialog.vue'
import { formatDateTime } from '@/utils/format'
import {
  RISK_RULE_CHANGE_TYPE_LABELS,
  RISK_RULE_CHANGE_TYPE_COLORS,
  RISK_RULE_TYPE_LABELS,
  RISK_RULE_TYPE_COLORS,
} from '@/constants/dictionaries'
import {
  RiskRuleType,
  RiskRuleChangeType,
  CustomerLevel,
  EffectMode,
} from '@/enums'
import * as riskRuleApi from '@/api/riskRule'
import type { IRiskRuleHistory, IRiskRuleHistoryResult, IRiskRuleScenarioMatch } from '@/types/api'

interface IProps {
  visible: boolean
  ruleId: number | null
}

const props = withDefaults(defineProps<IProps>(), {
  ruleId: null,
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const loading = ref(false)
const historyList = ref<IRiskRuleHistory[]>([])
const expandedIndex = ref<number>(-1)
const filterChangeType = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const totalHistory = ref(0)
const currentRuleName = ref('')
const currentRuleCode = ref('')
const currentRuleType = ref<RiskRuleType>(RiskRuleType.TRADE_LIMIT)

const historyStats = ref<IRiskRuleHistoryResult['stats'] | null>(null)
const scenarioMatches = ref<IRiskRuleScenarioMatch[]>([])

const operatorCount = computed(() => historyStats.value?.operatorDist?.length || 0)

const FIELD_LABELS: Record<string, string> = {
  ruleName: '规则名称',
  ruleType: '规则类型',
  description: '规则描述',
  effectMode: '生效模式',
  customerLevels: '适用客户等级',
  levelParams: '分级参数',
  effectiveStart: '生效开始',
  effectiveEnd: '生效结束',
  priority: '优先级',
  status: '规则状态',
  isGlobal: '全局规则',
  scopeSectors: '适用板块',
}

function handleUpdateVisible(val: boolean) {
  emit('update:visible', val)
}

function getRuleTypeLabel(type: string): string {
  return RISK_RULE_TYPE_LABELS[type as RiskRuleType] || type
}

function getRuleTypeColor(type: string): string {
  return RISK_RULE_TYPE_COLORS[type as RiskRuleType] || '#909399'
}

function getRuleTypeIcon(type: string) {
  const map: Record<string, any> = {
    [RiskRuleType.TRADE_LIMIT]: Money,
    [RiskRuleType.POSITION_LIMIT]: Goods,
    [RiskRuleType.VOLATILITY_RISK]: TrendCharts,
    [RiskRuleType.FREQUENCY_RISK]: Timer,
  }
  return map[type] || Setting
}

function getChangeTypeLabel(type: string): string {
  return RISK_RULE_CHANGE_TYPE_LABELS[type as RiskRuleChangeType] || type
}

function getChangeTypeColor(type: string): string {
  return RISK_RULE_CHANGE_TYPE_COLORS[type as RiskRuleChangeType] || '#909399'
}

function getTimelineType(type: string): 'primary' | 'success' | 'warning' | 'danger' | 'info' {
  const map: Record<string, any> = {
    [RiskRuleChangeType.CREATE]: 'primary',
    [RiskRuleChangeType.UPDATE]: 'success',
    [RiskRuleChangeType.ENABLE]: 'success',
    [RiskRuleChangeType.DISABLE]: 'info',
    [RiskRuleChangeType.RESET]: 'warning',
    [RiskRuleChangeType.EXPIRE]: 'danger',
  }
  return map[type] || 'primary'
}

function getConflictLevelLabel(level: string): string {
  const map: Record<string, string> = { high: '严重', medium: '中等', low: '轻微' }
  return map[level] || level
}

function getConflictTypeLabel(type: string): string {
  const map: Record<string, string> = {
    overlap: '范围重叠',
    logic: '逻辑冲突',
    range: '数值超限',
    redundant: '规则冗余',
  }
  return map[type] || type
}

function getFieldLabel(field: string): string {
  return FIELD_LABELS[field] || field
}

function getScoreColor(score: number): string {
  if (score >= 0.8) return '#67C23A'
  if (score >= 0.5) return '#E6A23C'
  return '#909399'
}

function hasValue(obj: any, field: string): boolean {
  const val = obj?.[field]
  if (val === undefined || val === null || val === '') return false
  if (Array.isArray(val)) return val.length > 0
  return true
}

function isFieldChanged(item: IRiskRuleHistory, field: string): boolean {
  const before = item.beforeSnapshot?.[field]
  const after = item.afterSnapshot?.[field]
  return JSON.stringify(before) !== JSON.stringify(after)
}

function formatFieldValue(field: string, val: any): string {
  if (val === undefined || val === null || val === '') return '-'
  if (field === 'ruleType') return getRuleTypeLabel(val as string)
  if (field === 'effectMode') {
    const map: Record<string, string> = {
      [EffectMode.IMMEDIATE]: '即时生效',
      [EffectMode.SCHEDULED]: '定时生效',
    }
    return map[val as string] || val
  }
  if (field === 'customerLevels' && Array.isArray(val)) {
    const labels: Record<string, string> = {
      [CustomerLevel.NORMAL]: '普通',
      [CustomerLevel.SILVER]: '白银',
      [CustomerLevel.GOLD]: '黄金',
      [CustomerLevel.PLATINUM]: '铂金',
      [CustomerLevel.DIAMOND]: '钻石',
    }
    return val.map((l: string) => labels[l] || l).join('、')
  }
  if (field === 'levelParams' && Array.isArray(val)) {
    return `共 ${val.length} 个等级配置`
  }
  if (Array.isArray(val)) return val.join('、')
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}

function getDisplayFields(before: any, after: any): string[] {
  const fields = new Set<string>()
  if (before) Object.keys(before).forEach((k) => fields.add(k))
  if (after) Object.keys(after).forEach((k) => fields.add(k))
  const priority = [
    'ruleName', 'ruleType', 'status', 'effectMode', 'customerLevels',
    'levelParams', 'effectiveStart', 'effectiveEnd', 'priority',
    'description', 'isGlobal', 'scopeSectors',
  ]
  const result: string[] = []
  priority.forEach((f) => {
    if (fields.has(f)) result.push(f)
  })
  fields.forEach((f) => {
    if (!result.includes(f)) result.push(f)
  })
  return result.slice(0, 10)
}

function toggleExpand(idx: number) {
  expandedIndex.value = expandedIndex.value === idx ? -1 : idx
}

async function fetchHistory() {
  if (!props.ruleId) return
  loading.value = true
  try {
    const res = await riskRuleApi.getRiskRuleHistory(props.ruleId)
    if (res.code === 0) {
      let list = res.data.list
      if (filterChangeType.value) {
        list = list.filter((h) => h.changeType === filterChangeType.value)
      }
      historyList.value = list
      totalHistory.value = res.data.total
      historyStats.value = res.data.stats

      if (list.length > 0) {
        const first = list[0]
        currentRuleName.value = first.ruleName
        currentRuleCode.value = `RULE_${props.ruleId?.toString().padStart(6, '0')}`
        const type = (first.afterSnapshot?.ruleType || first.beforeSnapshot?.ruleType) as RiskRuleType
        if (type) currentRuleType.value = type
      }
      await fetchScenarios()
    } else {
      ElMessage.error(res.message)
    }
  } catch (error) {
    ElMessage.error('获取历史记录失败')
  } finally {
    loading.value = false
  }
}

async function fetchScenarios() {
  scenarioMatches.value = [
    {
      scenarioName: '震荡市场景',
      scenarioDescription: '市场波动率在2%-5%之间的温和波动行情',
      matchScore: 0.72,
      volatilityRange: [2, 5] as [number, number],
      suggestedRules: [
        {
          ruleId: props.ruleId || 1,
          ruleName: currentRuleName.value || '风控规则',
          ruleType: currentRuleType.value,
        },
      ],
    },
    {
      scenarioName: '高波动场景',
      scenarioDescription: '市场波动率超过5%的剧烈波动行情',
      matchScore: 0.85,
      volatilityRange: [5, 15] as [number, number],
      suggestedRules: [
        {
          ruleId: props.ruleId || 1,
          ruleName: currentRuleName.value || '风控规则',
          ruleType: currentRuleType.value,
        },
      ],
    },
    {
      scenarioName: '低波动场景',
      scenarioDescription: '市场波动率低于2%的平稳行情',
      matchScore: 0.58,
      volatilityRange: [0, 2] as [number, number],
      suggestedRules: [
        {
          ruleId: props.ruleId || 1,
          ruleName: currentRuleName.value || '风控规则',
          ruleType: currentRuleType.value,
        },
      ],
    },
  ]
}

watch(
  () => [props.visible, props.ruleId],
  ([visible, ruleId]) => {
    if (visible && ruleId) {
      expandedIndex.value = -1
      currentPage.value = 1
      fetchHistory()
    }
  },
  { immediate: true },
)
</script>

<style lang="scss" scoped>
.history-dialog {
  max-height: 70vh;
  overflow-y: auto;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.06) 0%, rgba(103, 194, 58, 0.04) 100%);
  border-radius: 8px;
  margin-bottom: 20px;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.info-text {
  .rule-name {
    font-size: 17px;
    font-weight: 600;
    color: #1f2d3d;
    margin-bottom: 2px;
  }

  .rule-code {
    font-size: 12px;
    color: #8492a6;
  }
}

.code-text {
  font-family: monospace;
  color: #409eff;
}

.header-stats {
  display: flex;
  gap: 32px;
}

.stat-item {
  text-align: center;

  .stat-num {
    font-size: 22px;
    font-weight: 700;
    color: #1f2d3d;
    line-height: 1.2;
  }

  .stat-label {
    font-size: 12px;
    color: #8492a6;
    margin-top: 2px;
  }

  &.conflict.highlight .stat-num {
    color: #f56c6c;
  }
}

.history-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.filter-group {
  display: flex;
  align-items: center;
}

.filter-label {
  font-size: 13px;
  color: #606266;
  margin-right: 8px;
}

.timeline-container {
  min-height: 200px;
}

.history-card {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 6px 20px rgba(26, 58, 92, 0.1);
    border-color: #c0c4cc;
  }

  &.has-conflict {
    border-color: #fbc4c4;
    background: linear-gradient(180deg, rgba(245, 108, 108, 0.04) 0%, #fff 100%);
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;

  .operator,
  .effect-scope {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    color: #606266;
  }
}

.card-summary {
  padding: 10px 12px;
  background: #f5f7fa;
  border-radius: 4px;
  font-size: 13px;
}

.summary-label {
  color: #8492a6;
  margin-right: 6px;
}

.field-tag {
  margin-right: 4px;
  margin-bottom: 2px;
}

.more-tip {
  color: #409eff;
  font-size: 12px;
  margin-left: 4px;
}

.card-expand-enter-active,
.card-expand-leave-active {
  transition: all 0.35s ease;
  overflow: hidden;
}

.card-expand-enter-from,
.card-expand-leave-to {
  opacity: 0;
  max-height: 0;
  margin-top: 0;
  padding-top: 0;
}

.card-detail {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed #e4e7ed;
}

.compatibility-box {
  padding: 14px 16px;
  background: #fafbfc;
  border-radius: 6px;
  margin-bottom: 16px;
}

.compatibility-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-weight: 600;
  font-size: 14px;

  .compat-ok {
    color: #67c23a;
  }

  .compat-warn {
    color: #f56c6c;
  }
}

.conflict-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.conflict-item {
  padding: 8px 12px;
  border-radius: 4px;
  border-left: 3px solid;
  font-size: 13px;
  background: #fff;

  &.level-high {
    background: #fef0f0;
    border-left-color: #f56c6c;
  }

  &.level-medium {
    background: #fdf6ec;
    border-left-color: #e6a23c;
  }

  &.level-low {
    background: #ecf5ff;
    border-left-color: #409eff;
  }
}

.conflict-level {
  display: inline-block;
  padding: 1px 6px;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 3px;
  font-size: 11px;
  font-weight: 600;
  margin-right: 6px;
}

.conflict-type {
  color: #606266;
  margin-right: 6px;
}

.conflict-msg {
  color: #1f2d3d;
}

.conflict-related {
  display: block;
  margin-top: 4px;
  color: #8492a6;
  font-size: 12px;
}

.suggestion-list {
  padding: 10px 14px;
  background: #fff;
  border-radius: 4px;
  border: 1px dashed #e4e7ed;

  ul {
    margin: 6px 0 0 16px;
    padding: 0;

    li {
      font-size: 13px;
      color: #4a5568;
      line-height: 1.8;
    }
  }
}

.suggestion-title {
  font-size: 13px;
  font-weight: 500;
  color: #1f2d3d;
}

.snapshot-compare {
  margin-bottom: 16px;
}

.compare-title {
  font-size: 14px;
  font-weight: 600;
  color: #1f2d3d;
  margin-bottom: 12px;
  padding-left: 8px;
  border-left: 3px solid #409eff;
}

.compare-grid {
  display: grid;
  grid-template-columns: 1fr 50px 1fr;
  gap: 16px;
  align-items: stretch;
}

.compare-col {
  .col-header {
    padding: 6px 10px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    margin-bottom: 8px;
  }

  &.before .col-header {
    background: #f5f7fa;
    color: #8492a6;
  }

  &.after .col-header {
    background: rgba(64, 158, 255, 0.1);
    color: #409eff;
  }

  :deep(.el-descriptions__label) {
    width: 110px;
    font-weight: 500;
  }

  .changed {
    color: #f56c6c;
    font-weight: 600;
    padding: 1px 4px;
    background: #fef0f0;
    border-radius: 3px;
  }

  .empty-value {
    color: #c0c4cc;
    font-style: italic;
  }
}

.compare-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 40px;
}

.remark-box {
  display: flex;
  align-items: flex-start;
  padding: 10px 14px;
  background: #fff8e6;
  border-radius: 4px;
  color: #8a6d3b;
  font-size: 13px;

  .el-icon {
    margin-right: 6px;
    flex-shrink: 0;
  }
}

.remark-label {
  font-weight: 500;
  margin-right: 6px;
  flex-shrink: 0;
}

.remark-content {
  flex: 1;
}

.scenario-section {
  margin-top: 28px;
  padding-top: 24px;
  border-top: 1px solid #e4e7ed;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #1f2d3d;
  margin-bottom: 16px;
}

.scenario-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.scenario-card {
  padding: 16px;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 8px 24px rgba(26, 58, 92, 0.1);
    transform: translateY(-2px);
    border-color: #c0c4cc;
  }
}

.scenario-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px dashed #e4e7ed;
}

.scenario-info {
  flex: 1;
}

.scenario-name {
  font-size: 14px;
  font-weight: 600;
  color: #1f2d3d;
  margin-bottom: 4px;
}

.scenario-desc {
  font-size: 12px;
  color: #8492a6;
  margin-bottom: 4px;
}

.scenario-range {
  font-size: 12px;
  color: #606266;
}

.scenario-rules {
  .rules-title {
    font-size: 12px;
    color: #8492a6;
    margin-bottom: 6px;
  }
}

.rule-tag {
  margin-right: 4px;
  margin-bottom: 4px;
}

.history-pagination {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}
</style>
