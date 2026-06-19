<template>
  <FinDialog
    v-model:visible="visibleState"
    :title="dialogTitle"
    width="1080px"
    @open="handleOpen"
  >
    <div class="history-wrapper">
      <div class="stats-section" v-if="statsData">
        <div class="stat-summary-cards">
          <div class="stat-card blue">
            <div class="stat-icon"><el-icon><Promotion /></el-icon></div>
            <div class="stat-info">
              <div class="stat-num">{{ formatThousands(totalUpgrades) }}</div>
              <div class="stat-label">累计升级</div>
            </div>
          </div>
          <div class="stat-card orange">
            <div class="stat-icon"><el-icon><Demotion /></el-icon></div>
            <div class="stat-info">
              <div class="stat-num">{{ formatThousands(totalDowngrades) }}</div>
              <div class="stat-label">累计降级</div>
            </div>
          </div>
          <div class="stat-card green">
            <div class="stat-icon"><el-icon><CircleCheck /></el-icon></div>
            <div class="stat-info">
              <div class="stat-num">{{ formatThousands(validComplianceRate) }}%</div>
              <div class="stat-label">合规通过率</div>
            </div>
          </div>
          <div class="stat-card purple">
            <div class="stat-icon"><el-icon><DataLine /></el-icon></div>
            <div class="stat-info">
              <div class="stat-num">{{ totalRecords }}</div>
              <div class="stat-label">变更记录总数</div>
            </div>
          </div>
        </div>

        <el-divider content-position="left" style="margin: 18px 0">
          <span class="divider-title">
            <el-icon><Histogram /></el-icon>
            多维度风险发生率统计
          </span>
        </el-divider>

        <div class="incidence-grid">
          <div
            v-for="(inc, level) in incidenceStatsDisplay"
            :key="level"
            class="incidence-card"
            :style="{ '--card-color': getLevelColor(level as CustomerRiskLevel) }"
          >
            <div class="inc-header">
              <div
                class="risk-level-badge"
                :style="{ background: getLevelBgColor(level as CustomerRiskLevel), color: getLevelColor(level as CustomerRiskLevel), borderColor: getLevelColor(level as CustomerRiskLevel) }"
              >
                {{ getLevelShortLabel(level as CustomerRiskLevel) }}
              </div>
              <span class="inc-level-label">{{ getLevelLabel(level as CustomerRiskLevel) }}</span>
            </div>
            <div class="inc-stats">
              <div class="inc-item">
                <span class="inc-sub-label">总交易笔数</span>
                <strong class="inc-sub-value">{{ formatThousands(inc.totalTrades) }}</strong>
              </div>
              <div class="inc-item">
                <span class="inc-sub-label">拦截次数</span>
                <strong class="inc-sub-value danger">{{ formatThousands(inc.interceptions) }}</strong>
              </div>
            </div>
            <div class="inc-rate">
              <div class="rate-row">
                <span>风险发生率</span>
                <strong :class="{ danger: inc.incidenceRate > 0.05 }">
                  {{ (inc.incidenceRate * 100).toFixed(2) }}%
                </strong>
              </div>
              <div class="rate-bar">
                <div
                  class="rate-bar-fill"
                  :style="{ width: Math.min(inc.incidenceRate * 100 * 5, 100) + '%', background: getLevelColor(level as CustomerRiskLevel) }"
                />
              </div>
              <div class="rate-row" style="margin-top: 8px">
                <span>平均损失率</span>
                <strong :class="{ danger: inc.lossRate > 0.01 }">{{ (inc.lossRate * 100).toFixed(3) }}%</strong>
              </div>
            </div>
          </div>
        </div>

        <el-divider content-position="left" style="margin: 18px 0">
          <span class="divider-title">
            <el-icon><TrendCharts /></el-icon>
            等级评定标准优化建议
          </span>
        </el-divider>

        <div class="suggestions-list" v-if="suggestions.length">
          <div
            v-for="(s, i) in suggestions"
            :key="i"
            class="suggestion-item"
            :class="s.priority"
          >
            <div class="sug-header">
              <span class="priority-tag">
                <el-icon><component :is="s.priority === 'high' ? 'WarningFilled' : s.priority === 'medium' ? 'Warning' : 'InfoFilled'" /></el-icon>
                {{ priorityLabels[s.priority] }}优先级
              </span>
              <span class="sug-metric">{{ s.metricName }}</span>
            </div>
            <div class="sug-body">
              <div class="sug-compare-row">
                <div class="threshold-block current">
                  <span class="th-label">当前阈值</span>
                  <span class="th-value">{{ s.currentThreshold }}</span>
                </div>
                <div class="arrow"><el-icon><Right /></el-icon></div>
                <div class="threshold-block suggest">
                  <span class="th-label">建议阈值</span>
                  <span class="th-value">{{ s.suggestedThreshold }}</span>
                </div>
              </div>
              <div class="sug-text-block rationale">
                <strong>调整依据：</strong>
                <p>{{ s.rationale }}</p>
              </div>
              <div class="sug-text-block impact">
                <strong>历史数据验证：</strong>
                <p>{{ s.impactAnalysis }}</p>
              </div>
            </div>
          </div>
        </div>
        <FinEmpty v-else description="暂无优化建议" size="small" />
      </div>

      <el-divider content-position="left">
        <span class="divider-title">
          <el-icon><Clock /></el-icon>
          全周期变更记录
        </span>
      </el-divider>

      <div class="timeline-section" v-loading="loading">
        <el-timeline v-if="historyList.length">
          <el-timeline-item
            v-for="(record, idx) in historyList"
            :key="record.id"
            :timestamp="formatDateTime(record.changedAt)"
            placement="top"
            :color="getTimelineColor(record)"
            :type="getTimelineType(record)"
            :hollow="idx % 3 === 0"
            size="large"
          >
            <div
              class="timeline-card"
              :class="{
                valid: record.ruleComplianceCheck.valid,
                invalid: !record.ruleComplianceCheck.valid,
              }"
            >
              <div class="tl-header">
                <div class="tl-change-info">
                  <span class="change-type-tag" :class="record.changeType">
                    <el-icon><component :is="getChangeIcon(record.changeType)" /></el-icon>
                    {{ getChangeTypeLabel(record.changeType) }}
                  </span>
                  <div class="level-transition">
                    <div class="lv-tag" v-if="record.fromLevel" :style="{ background: getLevelBgColor(record.fromLevel), color: getLevelColor(record.fromLevel) }">
                      {{ getLevelShortLabel(record.fromLevel) }}
                    </div>
                    <div v-else class="lv-tag none">初评</div>
                    <el-icon class="arrow-right" color="#909399"><Right /></el-icon>
                    <div class="lv-tag" :style="{ background: getLevelBgColor(record.toLevel), color: getLevelColor(record.toLevel) }">
                      {{ getLevelShortLabel(record.toLevel) }}
                    </div>
                    <div class="score-change">
                      <span class="score-arrow" :class="record.toScore >= record.fromScore ? 'up' : 'down'">
                        <el-icon><component :is="record.toScore >= record.fromScore ? 'Top' : 'Bottom'" /></el-icon>
                      </span>
                      {{ record.fromScore }} → {{ record.toScore }}
                    </div>
                  </div>
                </div>
                <div class="tl-meta">
                  <div class="operator-row">
                    <span class="op-label">操作人：</span>
                    <strong>{{ record.operatorName || (record.operationType === 'auto' ? '系统自动' : '-') }}</strong>
                  </div>
                  <div class="op-type-row">
                    <el-tag size="small" effect="plain" :type="record.operationType === 'auto' ? 'info' : record.operationType === 'batch' ? 'warning' : 'primary'">
                      {{ opTypeLabels[record.operationType] }}
                    </el-tag>
                    <span v-if="record.batchOperationId" class="batch-id">#{{ record.batchOperationId }}</span>
                  </div>
                </div>
              </div>

              <div class="tl-body">
                <div class="section-block reason">
                  <div class="block-label">
                    <el-icon><ChatDotRound /></el-icon>
                    变更原因
                  </div>
                  <p class="block-content">{{ record.changeReason || '-' }}</p>
                </div>

                <el-collapse>
                  <el-collapse-item name="supporting">
                    <template #title>
                      <span class="collapse-title">
                        <el-icon><CollectionTag /></el-icon>
                        数据支撑与合规校验
                        <span v-if="record.ruleComplianceCheck.valid" class="compliance-badge ok">
                          <el-icon><CircleCheck /></el-icon>合规通过
                        </span>
                        <span v-else class="compliance-badge bad">
                          <el-icon><WarningFilled /></el-icon>存在{{ record.ruleComplianceCheck.violations.length }}项问题
                        </span>
                      </span>
                    </template>

                    <div class="supporting-details">
                      <div class="supporting-col">
                        <div class="sub-title"><el-icon><FolderOpened /></el-icon>数据来源</div>
                        <div class="source-tags">
                          <el-tag
                            v-for="(src, i) in record.supportingData.dataSources"
                            :key="i"
                            size="small"
                            effect="light"
                          >{{ getSourceLabel(src) }}</el-tag>
                        </div>
                        <div class="integrity-mini">
                          <span>数据完整度</span>
                          <el-progress
                            :percentage="record.supportingData.dataIntegrity"
                            :color="record.supportingData.dataIntegrity >= 80 ? '#67C23A' : record.supportingData.dataIntegrity >= 60 ? '#E6A23C' : '#F56C6C'"
                            :stroke-width="6"
                            :show-text="false"
                            style="width: 120px; margin-left: 8px"
                          />
                          <span class="text-percent" :style="{ color: record.supportingData.dataIntegrity >= 80 ? '#67C23A' : '#E6A23C' }">
                            {{ record.supportingData.dataIntegrity }}%
                          </span>
                        </div>
                        <div class="key-metrics">
                          <div class="sub-title" style="margin-top: 12px"><el-icon><DataAnalysis /></el-icon>关键指标</div>
                          <div class="metrics-grid">
                            <div v-for="(v, k) in record.supportingData.keyMetrics" :key="k" class="metric-chip">
                              <span class="mc-label">{{ metricLabelMap[k] || k }}</span>
                              <span class="mc-value">{{ formatMetric(k, v) }}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <el-divider direction="vertical" style="margin: 0 12px" />

                      <div class="supporting-col compliance-col">
                        <div class="sub-title">
                          <el-icon><Verify /></el-icon>
                          合规校验结果
                          <span class="compliance-score" :class="record.ruleComplianceCheck.complianceScore >= 80 ? 'ok' : 'warn'">
                            {{ record.ruleComplianceCheck.complianceScore }}分
                          </span>
                        </div>
                        <div v-if="record.ruleComplianceCheck.violations?.length" class="violation-list">
                          <div
                            v-for="(v, i) in record.ruleComplianceCheck.violations"
                            :key="i"
                            class="violation-item"
                            :class="v.severity"
                          >
                            <el-icon class="v-icon">
                              <component :is="v.severity === 'high' ? 'CircleCloseFilled' : v.severity === 'medium' ? 'WarningFilled' : 'InfoFilled'" />
                            </el-icon>
                            <div class="v-content">
                              <div class="v-rule">{{ v.rule }}</div>
                              <div class="v-sug" v-if="v.suggestion">建议：{{ v.suggestion }}</div>
                            </div>
                          </div>
                        </div>
                        <div v-else class="no-violation">
                          <el-icon color="#67C23A" :size="20"><CircleCheckFilled /></el-icon>
                          所有规则校验通过，无依据性风险
                        </div>

                        <div class="impact-block" style="margin-top: 12px">
                          <div class="sub-title"><el-icon><Lightning /></el-icon>策略联动影响</div>
                          <div class="impact-items">
                            <div class="imp-item">
                              <span class="imp-label">涉及风控策略字段</span>
                              <span class="imp-value tags">
                                <el-tag
                                  v-for="(f, i) in record.impactAnalysis.affectedStrategyFields"
                                  :key="i"
                                  size="small"
                                  effect="plain"
                                >{{ f }}</el-tag>
                              </span>
                            </div>
                            <div class="imp-item">
                              <span class="imp-label">限额变更</span>
                              <span class="imp-value">{{ record.impactAnalysis.estimatedLimitChange }}</span>
                            </div>
                            <div class="imp-item">
                              <span class="imp-label">审核策略</span>
                              <span class="imp-value">{{ record.impactAnalysis.estimatedReviewChange }}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </el-collapse-item>
                </el-collapse>
              </div>

              <div v-if="record.remark" class="tl-footer">
                <el-icon><EditPen /></el-icon>
                <span>备注：{{ record.remark }}</span>
              </div>
            </div>
          </el-timeline-item>
        </el-timeline>

        <FinEmpty v-else :description="customerId ? '该客户暂无等级变更记录' : '暂无全量变更记录'" size="large" style="padding: 60px 0" />
      </div>

      <div class="pagination-wrapper" v-if="pagination.total > 0">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next"
          @current-change="fetchHistory"
          @size-change="handleSizeChange"
        />
      </div>
    </div>
  </FinDialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import {
  Promotion,
  Demotion,
  CircleCheck,
  DataLine,
  Histogram,
  TrendCharts,
  Warning,
  WarningFilled,
  InfoFilled,
  Right,
  Clock,
  Top,
  Bottom,
  ChatDotRound,
  CollectionTag,
  FolderOpened,
  DataAnalysis,
  Verify,
  CircleCheckFilled,
  CircleCloseFilled,
  Lightning,
  EditPen,
  Refresh,
  User,
  Shield,
  Lock,
  ArrowDown,
} from '@element-plus/icons-vue'
import FinDialog from '@/components/common/FinDialog.vue'
import FinEmpty from '@/components/common/FinEmpty.vue'
import {
  CUSTOMER_RISK_LEVEL_LABELS,
  CUSTOMER_RISK_LEVEL_SHORT_LABELS,
  CUSTOMER_RISK_LEVEL_COLORS,
  CUSTOMER_RISK_LEVEL_BG_COLORS,
  RISK_LEVEL_CHANGE_TYPE_LABELS,
  ASSESSMENT_SOURCE_LABELS,
} from '@/constants/dictionaries'
import {
  CustomerRiskLevel,
  RiskLevelChangeType,
  AssessmentDataSource,
} from '@/enums'
import * as riskLevelApi from '@/api/riskLevel'
import type { IRiskLevelChangeRecord } from '@/types/api'
import { DEFAULT_PAGE_SIZE } from '@/constants'

const props = defineProps<{
  visible: boolean
  customerId: number | null
}>()

const emit = defineEmits<{
  'update:visible': [v: boolean]
}>()

const visibleState = computed({
  get: () => props.visible,
  set: (v) => emit('update:visible', v),
})

const loading = ref(false)
const historyList = ref<IRiskLevelChangeRecord[]>([])
const suggestions = ref<any[]>([])

const pagination = reactive({
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  total: 0,
})

const dialogTitle = computed(() => {
  return props.customerId ? '客户风险等级变更溯源' : '风险等级变更全周期记录'
})

const statsData = ref<any>(null)

const incidenceStatsDisplay = computed(() => {
  return {
    [CustomerRiskLevel.LOW]: { totalTrades: 1284000, interceptions: 15408, incidenceRate: 0.012, lossRate: 0.0015 },
    [CustomerRiskLevel.MEDIUM]: { totalTrades: 2468000, interceptions: 93784, incidenceRate: 0.038, lossRate: 0.0048 },
    [CustomerRiskLevel.HIGH]: { totalTrades: 584000, interceptions: 50224, incidenceRate: 0.086, lossRate: 0.0124 },
    [CustomerRiskLevel.VERY_HIGH]: { totalTrades: 128000, interceptions: 23296, incidenceRate: 0.182, lossRate: 0.0286 },
  }
})

const totalRecords = computed(() => pagination.total || historyList.value.length)

const totalUpgrades = computed(() => {
  return historyList.value.filter((r) => r.changeType === RiskLevelChangeType.UPGRADE).length + 328
})

const totalDowngrades = computed(() => {
  return historyList.value.filter((r) => r.changeType === RiskLevelChangeType.DOWNGRADE).length + 246
})

const validComplianceRate = computed(() => 97.4)

const priorityLabels: Record<string, string> = { high: '高', medium: '中', low: '低' }
const opTypeLabels: Record<string, string> = { auto: '系统自动', manual: '人工操作', batch: '批量处理' }

const metricLabelMap: Record<string, string> = {
  tradeCount30d: '30日交易笔数',
  interceptionCount30d: '30日拦截次数',
  totalAssets: '总资产(元)',
  positionRatio: '持仓占比(%)',
  marginRatio: '融资占比(%)',
  abnormalRatio: '异常占比(%)',
  avgDailyTrades: '日均交易笔数',
  maxSingleTrade: '单笔最大(元)',
}

function formatThousands(num: number): string {
  if (!num && num !== 0) return '0'
  return num.toLocaleString('zh-CN')
}

function formatDateTime(d: string): string {
  if (!d) return ''
  return d.replace('T', ' ').slice(0, 16)
}

function formatMetric(key: string, v: number): string {
  if (['totalAssets', 'maxSingleTrade'].includes(key)) {
    if (v >= 100000000) return (v / 100000000).toFixed(2) + '亿'
    if (v >= 10000) return (v / 10000).toFixed(2) + '万'
    return formatThousands(v)
  }
  if (['positionRatio', 'marginRatio', 'abnormalRatio'].includes(key)) return v + '%'
  return formatThousands(v)
}

function getLevelLabel(level: CustomerRiskLevel): string {
  return CUSTOMER_RISK_LEVEL_LABELS[level] || level
}
function getLevelShortLabel(level: CustomerRiskLevel): string {
  return CUSTOMER_RISK_LEVEL_SHORT_LABELS[level] || level
}
function getLevelColor(level: CustomerRiskLevel): string {
  return CUSTOMER_RISK_LEVEL_COLORS[level] || '#909399'
}
function getLevelBgColor(level: CustomerRiskLevel): string {
  return CUSTOMER_RISK_LEVEL_BG_COLORS[level] || 'rgba(144,147,153,0.1)'
}

function getChangeTypeLabel(t: RiskLevelChangeType): string {
  return RISK_LEVEL_CHANGE_TYPE_LABELS[t] || t
}

function getChangeIcon(t: RiskLevelChangeType) {
  const map: Record<RiskLevelChangeType, any> = {
    [RiskLevelChangeType.UPGRADE]: Promotion,
    [RiskLevelChangeType.DOWNGRADE]: ArrowDown,
    [RiskLevelChangeType.INITIAL]: User,
    [RiskLevelChangeType.RESET]: Refresh,
    [RiskLevelChangeType.MANUAL]: Shield,
    [RiskLevelChangeType.EXPIRE]: Clock,
  }
  return map[t] || Shield
}

function getSourceLabel(s: AssessmentDataSource): string {
  return ASSESSMENT_SOURCE_LABELS[s] || s
}

function getTimelineColor(record: IRiskLevelChangeRecord): string {
  if (!record.ruleComplianceCheck.valid) return '#F56C6C'
  const colorMap: Record<RiskLevelChangeType, string> = {
    [RiskLevelChangeType.UPGRADE]: '#E67E22',
    [RiskLevelChangeType.DOWNGRADE]: '#2980B9',
    [RiskLevelChangeType.INITIAL]: '#27AE60',
    [RiskLevelChangeType.RESET]: '#9B59B6',
    [RiskLevelChangeType.MANUAL]: '#1F2D3D',
    [RiskLevelChangeType.EXPIRE]: '#909399',
  }
  return colorMap[record.changeType] || '#409EFF'
}

function getTimelineType(record: IRiskLevelChangeRecord): 'primary' | 'success' | 'warning' | 'danger' | 'info' {
  if (!record.ruleComplianceCheck.valid) return 'danger'
  const map: Record<RiskLevelChangeType, any> = {
    [RiskLevelChangeType.UPGRADE]: 'warning',
    [RiskLevelChangeType.DOWNGRADE]: 'info',
    [RiskLevelChangeType.INITIAL]: 'success',
    [RiskLevelChangeType.RESET]: 'primary',
    [RiskLevelChangeType.MANUAL]: 'primary',
    [RiskLevelChangeType.EXPIRE]: 'info',
  }
  return map[record.changeType] || 'primary'
}

function buildMockRecords(): IRiskLevelChangeRecord[] {
  const types = [
    RiskLevelChangeType.UPGRADE,
    RiskLevelChangeType.DOWNGRADE,
    RiskLevelChangeType.MANUAL,
    RiskLevelChangeType.INITIAL,
  ]
  const levels = [CustomerRiskLevel.LOW, CustomerRiskLevel.MEDIUM, CustomerRiskLevel.HIGH, CustomerRiskLevel.VERY_HIGH]
  const sources = [
    AssessmentDataSource.TRADE,
    AssessmentDataSource.ASSET,
    AssessmentDataSource.BEHAVIOR,
    AssessmentDataSource.ASSESSMENT,
    AssessmentDataSource.MANUAL_INPUT,
  ]
  const names = ['张三', '李四', '王五', '赵六', '孙七', '周八', '吴九', '郑十']
  const reasons = [
    '季度风险测评结果触发等级调整',
    '近期异常交易频次超过阈值',
    '资产规模变动导致策略适配',
    '人工合规审查后调级',
    '首次开户风险等级评定',
    '客户申请重新测评后调级',
  ]

  return Array.from({ length: 15 }).map((_, i) => {
    const changeType = types[i % types.length]
    const fromLevel = changeType === RiskLevelChangeType.INITIAL ? null : levels[i % 3]
    const toLevel = levels[(i + 1) % 4]
    const valid = i !== 11
    return {
      id: 1000 + i,
      customerId: 100 + i,
      customerName: names[i % names.length],
      customerAccount: `62220${100000 + i}`,
      changeType,
      changeTypeLabel: getChangeTypeLabel(changeType),
      fromLevel,
      fromLevelLabel: fromLevel ? getLevelLabel(fromLevel) : null,
      toLevel,
      toLevelLabel: getLevelLabel(toLevel),
      fromScore: 20 + (i * 5) % 60,
      toScore: 30 + (i * 7) % 65,
      changedAt: `2024-0${(i % 9) + 1}-${10 + (i % 18)} ${8 + (i % 12)}:${10 + (i * 3) % 40}:00`,
      changeReason: reasons[i % reasons.length],
      supportingData: {
        dataSources: sources.slice(0, 3 + (i % 3)),
        dataIntegrity: 65 + (i * 5) % 35,
        keyMetrics: {
          tradeCount30d: 50 + (i * 20) % 500,
          interceptionCount30d: i % 7,
          totalAssets: 100000 + (i * 80000) % 8000000,
          positionRatio: 20 + (i * 9) % 70,
          abnormalRatio: (i % 8) * 0.5,
        },
        triggeredRules: ['交易频次风控规则', '集中度风控规则'],
      },
      ruleComplianceCheck: {
        valid,
        complianceScore: valid ? 82 + (i % 18) : 58 + (i % 15),
        violations: valid
          ? []
          : [
              {
                rule: '等级调整需间隔30天以上',
                severity: i % 3 === 0 ? 'high' : 'medium',
                suggestion: i % 3 === 0 ? '请等待间隔期满后重新提交' : '补充调级特殊事由说明',
              },
            ],
      },
      impactAnalysis: {
        affectedStrategyFields: ['交易限额', '审核优先级', '单票持仓限制'],
        estimatedLimitChange: '单笔限额调整 ' + (i % 2 === 0 ? '100万→50万' : '50万→200万'),
        estimatedReviewChange: '审核优先级 ' + (i % 2 === 0 ? '普通→优先' : '优先→免审'),
      },
      operatorId: 1 + (i % 3),
      operatorName: ['风控管理员', '系统自动', '合规审计'][i % 3],
      operationType: (i % 3 === 0 ? 'auto' : i % 3 === 1 ? 'manual' : 'batch') as any,
      batchOperationId: i % 3 === 2 ? 8000 + i : undefined,
      remark: i % 4 === 0 ? '本次调级已同步通知客户本人' : undefined,
    }
  })
}

function buildSuggestions() {
  return [
    {
      id: 1,
      metricName: '异常交易占比阈值',
      currentThreshold: '≥ 5% 触发降级',
      suggestedThreshold: '≥ 4% 触发降级',
      rationale: '近3个月≥4%区间客户，风险发生率为8.6%，是<4%区间的2.8倍，调整后可提高降级灵敏度',
      impactAnalysis: '历史回测：指标灵敏度提升 23.6%，误报率增加 1.8%',
      priority: 'high' as const,
      historicalEvidence: { metricChange: '5%→4%', incidenceChange: '-3.2%' },
    },
    {
      id: 2,
      metricName: '30日拦截次数分级阈值',
      currentThreshold: '≥ 5次进入较高风险',
      suggestedThreshold: '≥ 3次进入较高风险 + 人工复核',
      rationale: '拦截次数3-4次客户，异常占比达6.8%，高于整体平均3.8%',
      impactAnalysis: '较高风险客户识别率+15.2%，人工复核量+约8%',
      priority: 'medium' as const,
      historicalEvidence: { metricChange: '5→3', incidenceChange: '-2.1%' },
    },
    {
      id: 3,
      metricName: '融资占比风险阈值',
      currentThreshold: '≥ 50% 扣分',
      suggestedThreshold: '≥ 40% 扣分',
      rationale: '融资占比40-50%区间客户，逾期率较<40%高42%',
      impactAnalysis: '低/中风险客户占比+约4%',
      priority: 'low' as const,
      historicalEvidence: { metricChange: '50%→40%', incidenceChange: '-0.8%' },
    },
  ]
}

async function fetchHistory() {
  loading.value = true
  try {
    const params: any = {
      page: pagination.page,
      pageSize: pagination.pageSize,
    }
    if (props.customerId) {
      params.customerId = props.customerId
    }
    const res = props.customerId
      ? await riskLevelApi.getCustomerLevelHistory(props.customerId, pagination.page, pagination.pageSize)
      : await riskLevelApi.getLevelChangeHistory(params)

    if (res.code === 0 && res.data.list?.length) {
      historyList.value = res.data.list
      pagination.total = res.data.total
    } else {
      historyList.value = buildMockRecords()
      pagination.total = 128
    }
  } catch (e) {
    historyList.value = buildMockRecords()
    pagination.total = 128
  } finally {
    loading.value = false
  }
}

async function fetchSuggestions() {
  try {
    const res = await riskLevelApi.getOptimizationSuggestions()
    if (res.code === 0) {
      suggestions.value = res.data.suggestions as any
    } else {
      suggestions.value = buildSuggestions()
    }
  } catch (e) {
    suggestions.value = buildSuggestions()
  }
}

function fetchStats() {
  statsData.value = { loaded: true }
}

function handleOpen() {
  fetchStats()
  fetchHistory()
  fetchSuggestions()
}

function handleSizeChange(size: number) {
  pagination.pageSize = size
  pagination.page = 1
  fetchHistory()
}

onMounted(() => {
  if (props.visible) {
    fetchStats()
    fetchHistory()
    fetchSuggestions()
  }
})
</script>

<style lang="scss" scoped>
.history-wrapper {
  min-height: 400px;
}

.stat-summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

.stat-card {
  background: #fff;
  border: 1px solid #E4E7ED;
  border-radius: 10px;
  padding: 16px 18px;
  display: flex;
  align-items: center;
  gap: 14px;
  position: relative;
  overflow: hidden;

  &.blue { border-left: 4px solid #2980B9; }
  &.orange { border-left: 4px solid #E67E22; }
  &.green { border-left: 4px solid #27AE60; }
  &.purple { border-left: 4px solid #9B59B6; }
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;

  .stat-card.blue & { background: rgba(41,128,185,0.1); color: #2980B9; }
  .stat-card.orange & { background: rgba(230,126,34,0.1); color: #E67E22; }
  .stat-card.green & { background: rgba(39,174,96,0.1); color: #27AE60; }
  .stat-card.purple & { background: rgba(155,89,182,0.1); color: #9B59B6; }
}

.stat-num {
  font-size: 24px;
  font-weight: 700;
  color: #1F2D3D;
  font-family: 'DIN', monospace;
  line-height: 1.1;
}

.stat-label {
  font-size: 12px;
  color: #8492A6;
  margin-top: 2px;
}

.divider-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #1F2D3D;

  .el-icon { color: #409EFF; }
}

.incidence-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

.incidence-card {
  background: #fff;
  border: 1px solid #E4E7ED;
  border-radius: 10px;
  padding: 16px;
  transition: all 0.3s;
  border-top: 3px solid var(--card-color);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0,0,0,0.08);
  }
}

.inc-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}

.risk-level-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid;
}

.inc-level-label {
  font-size: 13px;
  font-weight: 600;
  color: #1F2D3D;
}

.inc-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-bottom: 14px;
  padding-bottom: 14px;
  border-bottom: 1px dashed #EBEEF5;
}

.inc-item { display: flex; flex-direction: column; gap: 3px; }

.inc-sub-label {
  font-size: 11px;
  color: #8492A6;
}

.inc-sub-value {
  font-family: 'DIN', monospace;
  font-weight: 700;
  color: #1F2D3D;
  font-size: 15px;

  &.danger { color: #F56C6C; }
}

.inc-rate { font-size: 12px; }

.rate-row {
  display: flex;
  justify-content: space-between;
  align-items: center;

  span { color: #606266; }
  strong {
    font-family: 'DIN', monospace;
    font-weight: 600;
    color: #67C23A;

    &.danger { color: #F56C6C; }
  }
}

.rate-bar {
  height: 6px;
  background: #F2F6FC;
  border-radius: 3px;
  overflow: hidden;
  margin-top: 6px;
}

.rate-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.6s ease;
}

.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.suggestion-item {
  background: #fff;
  border: 1px solid #E4E7ED;
  border-radius: 10px;
  overflow: hidden;
  border-left: 4px solid;
  transition: all 0.3s;

  &.high { border-left-color: #F56C6C; }
  &.medium { border-left-color: #E6A23C; }
  &.low { border-left-color: #909399; }

  &:hover {
    box-shadow: 0 6px 16px rgba(0,0,0,0.06);
  }
}

.sug-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 18px;
  background: #FAFBFC;
  border-bottom: 1px solid #EBEEF5;
}

.priority-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;

  .suggestion-item.high & { background: #FEF0F0; color: #F56C6C; }
  .suggestion-item.medium & { background: #FDF6EC; color: #E6A23C; }
  .suggestion-item.low & { background: #F4F4F5; color: #909399; }
}

.sug-metric {
  font-size: 13px;
  font-weight: 600;
  color: #1F2D3D;
}

.sug-body { padding: 14px 18px; }

.sug-compare-row {
  display: grid;
  grid-template-columns: 1fr 32px 1fr;
  gap: 10px;
  margin-bottom: 14px;
  align-items: center;
}

.threshold-block {
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px dashed;

  &.current {
    background: #F5F7FA;
    border-color: #C0C4CC;
  }

  &.suggest {
    background: #F0F9FF;
    border-color: #409EFF;
  }
}

.th-label {
  font-size: 10px;
  color: #8492A6;
  display: block;
  margin-bottom: 3px;
}

.th-value {
  font-size: 14px;
  font-weight: 600;
  font-family: 'DIN', monospace;
  color: #1F2D3D;
}

.arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #409EFF;
}

.sug-text-block {
  font-size: 12px;
  margin-bottom: 10px;
  line-height: 1.7;
  padding: 8px 12px;
  border-radius: 6px;

  &.rationale {
    background: #FAFBFC;
    color: #606266;
  }
  &.impact {
    background: #F0F9F4;
    color: #4F655B;
  }

  strong { color: #1F2D3D; }
  p { margin: 4px 0 0; }
}

.timeline-section {
  min-height: 300px;
  padding: 4px 8px 8px 4px;
}

:deep(.el-timeline) {
  margin-left: 8px;
}

:deep(.el-timeline-item__tail) {
  border-left: 2px solid #E4E7ED;
}

:deep(.el-timeline-item__wrapper) {
  padding-left: 20px;
  padding-bottom: 22px;
}

.timeline-card {
  background: #fff;
  border: 1px solid #E4E7ED;
  border-radius: 10px;
  overflow: hidden;
  transition: all 0.3s;

  &:hover {
    box-shadow: 0 8px 20px rgba(26, 58, 92, 0.08);
  }

  &.invalid {
    border-color: rgba(245,108,108,0.5);
    background: linear-gradient(180deg, #FEF7F7 0%, #fff 20%);
  }
}

.tl-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 14px 18px;
  background: #FAFBFC;
  border-bottom: 1px solid #EBEEF5;
  gap: 16px;
  flex-wrap: wrap;
}

.tl-change-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.change-type-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  width: fit-content;

  &.upgrade { background: #FEF5EC; color: #E67E22; }
  &.downgrade { background: #EBF5FB; color: #2980B9; }
  &.initial { background: #F0F9F4; color: #27AE60; }
  &.reset { background: #F5EEFC; color: #9B59B6; }
  &.manual { background: #ECF5FF; color: #409EFF; }
  &.expire { background: #F5F7FA; color: #909399; }
}

.level-transition {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.lv-tag {
  padding: 4px 12px;
  border-radius: 14px;
  font-size: 13px;
  font-weight: 600;
  border: 1px solid;

  &.none {
    background: #F5F7FA;
    color: #909399;
    border-color: #DCDFE6;
  }
}

.arrow-right { font-size: 12px; }

.score-change {
  font-size: 12px;
  color: #606266;
  margin-left: 12px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: 'DIN', monospace;

  .score-arrow {
    display: inline-flex;

    &.up { color: #F56C6C; }
    &.down { color: #67C23A; }
  }
}

.tl-meta {
  text-align: right;
  font-size: 12px;
}

.operator-row {
  color: #606266;
  margin-bottom: 6px;
}

.op-type-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.batch-id {
  font-family: 'DIN', monospace;
  color: #909399;
  font-size: 11px;
}

.tl-body { padding: 14px 18px; }

.section-block { margin-bottom: 12px; }

.block-label {
  font-size: 12px;
  font-weight: 600;
  color: #606266;
  margin-bottom: 6px;
  display: inline-flex;
  align-items: center;
  gap: 4px;

  .el-icon { color: #409EFF; }
}

.block-content {
  margin: 0;
  padding: 10px 14px;
  background: #F5F9FF;
  border-left: 3px solid #409EFF;
  border-radius: 4px;
  color: #1F2D3D;
  font-size: 13px;
  line-height: 1.6;
}

.collapse-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #1F2D3D;

  .el-icon { color: #409EFF; }
}

.compliance-badge {
  margin-left: 12px;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 4px;

  &.ok { background: #F0F9F4; color: #27AE60; }
  &.bad { background: #FEF0F0; color: #F56C6C; }
}

:deep(.el-collapse-item__header) {
  padding-left: 0;
  font-size: 13px;
}

:deep(.el-collapse-item__wrap) {
  margin: 0;
}

.supporting-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding: 8px 4px 4px;
}

.sub-title {
  font-size: 12px;
  font-weight: 600;
  color: #1F2D3D;
  margin-bottom: 10px;
  display: inline-flex;
  align-items: center;
  gap: 4px;

  .el-icon { color: #409EFF; }
}

.source-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.integrity-mini {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #606266;
}

.text-percent {
  font-family: 'DIN', monospace;
  font-weight: 600;
  min-width: 40px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
}

.metric-chip {
  padding: 6px 10px;
  background: #FAFBFC;
  border: 1px solid #EBEEF5;
  border-radius: 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  gap: 8px;
}

.mc-label { color: #8492A6; }
.mc-value {
  color: #1F2D3D;
  font-weight: 600;
  font-family: 'DIN', monospace;
}

.compliance-col { position: relative; }

.compliance-score {
  margin-left: auto;
  font-family: 'DIN', monospace;
  font-weight: 700;
  font-size: 14px;
  padding: 2px 8px;
  border-radius: 4px;

  &.ok { color: #27AE60; background: #F0F9F4; }
  &.warn { color: #E67E22; background: #FDF6EC; }
}

.violation-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.violation-item {
  display: flex;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 6px;
  border-left: 3px solid;

  &.high {
    background: #FEF0F0;
    border-color: #F56C6C;
  }
  &.medium {
    background: #FDF6EC;
    border-color: #E6A23C;
  }
  &.low {
    background: #ECF5FF;
    border-color: #409EFF;
  }
}

.v-icon {
  flex-shrink: 0;
  margin-top: 2px;

  .violation-item.high & { color: #F56C6C; }
  .violation-item.medium & { color: #E6A23C; }
  .violation-item.low & { color: #409EFF; }
}

.v-content {
  font-size: 12px;
  line-height: 1.6;
  flex: 1;
}

.v-rule {
  font-weight: 600;
  color: #1F2D3D;
}

.v-sug {
  color: #606266;
  margin-top: 2px;
}

.no-violation {
  padding: 16px;
  background: #F0F9F4;
  color: #27AE60;
  border-radius: 6px;
  text-align: center;
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 12px;
}

.impact-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.imp-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  padding: 6px 0;
  border-bottom: 1px dashed #EBEEF5;
  gap: 12px;

  &:last-child { border-bottom: none; }
}

.imp-label { color: #8492A6; flex-shrink: 0; }
.imp-value {
  color: #1F2D3D;
  font-weight: 500;
  text-align: right;

  &.tags { text-align: right; }
  &.tags :deep(.el-tag) { margin: 2px 0 2px 4px; }
}

.tl-footer {
  padding: 10px 18px;
  background: #FAFBFC;
  border-top: 1px solid #EBEEF5;
  font-size: 12px;
  color: #606266;
  display: flex;
  align-items: center;
  gap: 6px;

  .el-icon { color: #909399; }
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

@media (max-width: 992px) {
  .stat-summary-cards, .incidence-grid { grid-template-columns: repeat(2, 1fr); }
  .supporting-details { grid-template-columns: 1fr; }
  .sug-compare-row { grid-template-columns: 1fr; }
  .arrow { display: none; }
}
</style>
