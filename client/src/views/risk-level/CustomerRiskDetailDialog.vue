<template>
  <FinDialog
    v-model:visible="visibleState"
    :title="profile?.customerName ? `${profile.customerName} - 风险档案` : '客户风险档案'"
    width="1100px"
    :close-on-click-modal="false"
    @open="handleOpen"
  >
    <div class="detail-wrapper" v-loading="detailLoading">
      <div class="profile-header" v-if="profile">
        <div class="profile-main">
          <div
            class="profile-avatar"
            :style="{ background: getLevelBgColor(profile.riskLevel), color: getLevelColor(profile.riskLevel), borderColor: getLevelColor(profile.riskLevel) }"
          >
            {{ profile.customerName?.charAt(0) || '-' }}
          </div>
          <div class="profile-info">
            <div class="customer-header-row">
              <h3 class="customer-name">{{ profile.customerName }}</h3>
              <span class="customer-account">{{ profile.customerAccount }}</span>
              <span class="customer-level-tag">{{ profile.customerLevel }}</span>
              <el-tag
                v-if="isExpiring"
                type="warning"
                size="small"
                effect="light"
              >即将到期</el-tag>
              <el-tag
                v-if="isOverdue"
                type="danger"
                size="small"
                effect="dark"
              >已逾期</el-tag>
            </div>
            <div class="customer-stat-row">
              <div class="customer-stat">
                <span class="stat-label">评定日期</span>
                <span class="stat-value">{{ formatDate(profile.assessmentDate) }}</span>
              </div>
              <div class="customer-stat">
                <span class="stat-label">有效期至</span>
                <span class="stat-value" :class="{ danger: isOverdue, warning: isExpiring }">
                  {{ formatDate(profile.nextAssessmentDate) }}
                </span>
              </div>
              <div class="customer-stat">
                <span class="stat-label">评定人</span>
                <span class="stat-value">{{ profile.assessedByName || '系统自动' }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="risk-level-display">
          <div class="risk-ring-wrapper">
            <el-progress
              type="dashboard"
              :percentage="profile.riskScore"
              :width="140"
              :stroke-width="14"
              :color="getLevelColor(profile.riskLevel)"
            >
              <div class="ring-inner-text">
                <div class="ring-score">{{ profile.riskScore }}</div>
                <div class="ring-label">风险分</div>
              </div>
            </el-progress>
          </div>
          <div class="risk-level-label" :style="{ color: getLevelColor(profile.riskLevel) }">
            <el-icon :size="18"><component :is="getLevelIcon(profile.riskLevel)" /></el-icon>
            <strong>{{ getLevelLabel(profile.riskLevel) }}</strong>
          </div>
          <div class="risk-score-range">{{ getScoreRange(profile.riskLevel) }}</div>
        </div>
      </div>

      <el-tabs v-model="activeTab" class="detail-tabs">
        <el-tab-pane label="数据完整性校验" name="integrity">
          <div class="integrity-overview">
            <div class="integrity-summary-card" :class="integrityStatusClass">
              <div class="integrity-summary-main">
                <div class="summary-label">数据完整度</div>
                <div class="summary-score" :style="{ color: integrityColor }">
                  {{ profile?.overallIntegrity || 0 }}%
                </div>
                <div class="summary-status">{{ integrityStatusText }}</div>
              </div>
              <div class="integrity-bar">
                <div
                  class="integrity-bar-fill"
                  :style="{ width: (profile?.overallIntegrity || 0) + '%', background: integrityColor }"
                />
              </div>
              <div class="assessment-blocker-section">
                <div class="blocker-title">
                  <el-icon :size="14"><WarningFilled /></el-icon>
                  评定拦截因素
                </div>
                <div v-if="profile?.assessmentBlockers?.length" class="blocker-list">
                  <div
                    v-for="(b, i) in profile.assessmentBlockers"
                    :key="i"
                    class="blocker-item"
                  >
                    <el-icon color="#F56C6C" :size="14"><Close /></el-icon>
                    {{ b }}
                  </div>
                </div>
                <div v-else class="no-blockers">
                  <el-icon color="#67C23A"><CircleCheck /></el-icon>
                  无评定障碍，可正常进行等级评定
                </div>
              </div>
            </div>

            <div class="integrity-sources">
              <div
                v-for="(src, idx) in profile?.dataIntegrity || []"
                :key="idx"
                class="integrity-source-card"
              >
                <div class="source-header">
                  <span class="source-label">{{ getSourceLabel(src.source) }}</span>
                  <el-tag
                    size="small"
                    :type="getStatusTagType(src.status)"
                    effect="light"
                  >{{ getStatusText(src.status) }}</el-tag>
                </div>
                <div class="source-progress">
                  <el-progress
                    :percentage="src.completeness"
                    :color="getIntegrityColor(src.completeness)"
                    :stroke-width="6"
                    :show-text="false"
                  />
                  <span class="progress-num" :style="{ color: getIntegrityColor(src.completeness) }">
                    {{ src.completeness }}%
                  </span>
                </div>
                <div class="source-meta">
                  <span>最后更新：{{ formatDate(src.lastUpdated) }}</span>
                </div>
                <div class="missing-fields" v-if="src.missingFields?.length">
                  <span class="missing-label">缺失字段：</span>
                  <span
                    v-for="(f, i) in src.missingFields.slice(0, 6)"
                    :key="i"
                    class="missing-tag"
                  >{{ f }}</span>
                  <span v-if="src.missingFields.length > 6" class="missing-more">
                    +{{ src.missingFields.length - 6 }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="等级评定与策略" name="assessment">
          <div class="assessment-section">
            <div class="behavior-scores">
              <h4 class="section-title">行为评分维度</h4>
              <div class="score-grid">
                <div
                  v-for="(item, key) in behaviorScoreList"
                  :key="key"
                  class="score-card"
                >
                  <div class="score-header">
                    <span class="score-label">{{ item.label }}</span>
                    <span class="score-weight">权重 {{ weights[key] || 20 }}%</span>
                  </div>
                  <div class="score-body">
                    <el-progress
                      :percentage="item.value"
                      :color="getIntegrityColor(item.value)"
                      :stroke-width="8"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="strategy-section">
              <div class="strategy-header-row">
                <h4 class="section-title">
                  <el-icon><Settings /></el-icon>
                  当前风控策略配置
                </h4>
                <div class="adjust-level-section" v-if="canAdjust">
                  <el-tag
                    size="small"
                    effect="light"
                    style="margin-right: 12px"
                    :style="{ color: getLevelColor(profile!.riskLevel) }"
                  >
                    当前：{{ getLevelLabel(profile!.riskLevel) }}
                  </el-tag>
                  <el-select
                    v-model="targetRiskLevel"
                    size="small"
                    style="width: 140px"
                    placeholder="选择目标等级"
                    @change="handleTargetLevelChange"
                  >
                    <el-option
                      v-for="opt in levelOptions"
                      :key="opt.value"
                      :label="opt.label"
                      :value="opt.value"
                    />
                  </el-select>
                  <el-button
                    v-if="targetRiskLevel && targetRiskLevel !== profile?.riskLevel"
                    size="small"
                    type="primary"
                    :disabled="!profile?.canBeAssessed"
                    @click="handleSubmitLevelChange"
                  >
                    提交调级申请
                  </el-button>
                </div>
              </div>

              <div class="strategy-grid">
                <div class="strategy-card trade">
                  <div class="strategy-card-header">
                    <el-icon><Money /></el-icon>
                    <span>交易限额</span>
                  </div>
                  <div class="strategy-card-body">
                    <div class="strategy-item">
                      <span class="s-label">单笔最大</span>
                      <span class="s-value">
                        {{ formatThousands(currentStrategy.tradeLimit.singleTradeMax) }}元
                      </span>
                    </div>
                    <div class="strategy-item">
                      <span class="s-label">日累计</span>
                      <span class="s-value">
                        {{ formatThousands(currentStrategy.tradeLimit.dailyTotalMax) }}元
                      </span>
                    </div>
                  </div>
                </div>

                <div class="strategy-card position">
                  <div class="strategy-card-header">
                    <el-icon><Collection /></el-icon>
                    <span>持仓限制</span>
                  </div>
                  <div class="strategy-card-body">
                    <div class="strategy-item">
                      <span class="s-label">单票占比</span>
                      <span class="s-value">{{ currentStrategy.positionLimit.singleStockRatio }}%</span>
                    </div>
                    <div class="strategy-item">
                      <span class="s-label">总仓占比</span>
                      <span class="s-value">{{ currentStrategy.positionLimit.totalPositionRatio }}%</span>
                    </div>
                  </div>
                </div>

                <div class="strategy-card review">
                  <div class="strategy-card-header">
                    <el-icon><Document /></el-icon>
                    <span>审核规则</span>
                  </div>
                  <div class="strategy-card-body">
                    <div class="strategy-item">
                      <span class="s-label">审核优先级</span>
                      <el-tag
                        size="small"
                        :style="{
                          color: getPriorityColor(currentStrategy.reviewPriority),
                          borderColor: getPriorityColor(currentStrategy.reviewPriority),
                          background: getPriorityColor(currentStrategy.reviewPriority) + '15',
                        }"
                        effect="light"
                      >
                        {{ getPriorityLabel(currentStrategy.reviewPriority) }}
                      </el-tag>
                    </div>
                    <div class="strategy-item">
                      <span class="s-label">波动容忍度</span>
                      <span class="s-value">±{{ currentStrategy.volatilityTolerance }}%</span>
                    </div>
                  </div>
                </div>

                <div class="strategy-card special">
                  <div class="strategy-card-header">
                    <el-icon><Star /></el-icon>
                    <span>特殊限制</span>
                  </div>
                  <div class="strategy-card-body tags">
                    <el-tag
                      v-for="(r, i) in currentStrategy.specialRestrictions"
                      :key="i"
                      size="small"
                      effect="plain"
                      style="margin-bottom: 4px"
                    >{{ r }}</el-tag>
                    <div class="permission-row" style="margin-top: 8px">
                      <span :class="currentStrategy.marginEnabled ? 'ok' : 'deny'">
                        <el-icon><component :is="currentStrategy.marginEnabled ? 'Check' : 'Close'" /></el-icon>
                        融资融券
                      </span>
                      <span :class="currentStrategy.optionsEnabled ? 'ok' : 'deny'">
                        <el-icon><component :is="currentStrategy.optionsEnabled ? 'Check' : 'Close'" /></el-icon>
                        期权交易
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="showPreview" class="strategy-preview-comparison">
                <div class="preview-title">
                  <el-icon><Promotion /></el-icon>
                  调级联动策略预览
                </div>
                <el-divider style="margin: 12px 0" />
                <div class="preview-comparison-grid">
                  <div class="preview-col from">
                    <div class="col-title" :style="{ color: getLevelColor(profile!.riskLevel) }">
                      调级前 · {{ getLevelLabel(profile!.riskLevel) }}
                    </div>
                    <div class="preview-item"><span>单笔限额</span><strong>{{ formatThousands(profile!.strategyConfig.tradeLimit.singleTradeMax) }}</strong></div>
                    <div class="preview-item"><span>日累计</span><strong>{{ formatThousands(profile!.strategyConfig.tradeLimit.dailyTotalMax) }}</strong></div>
                    <div class="preview-item"><span>单票占比</span><strong>{{ profile!.strategyConfig.positionLimit.singleStockRatio }}%</strong></div>
                    <div class="preview-item"><span>审核优先级</span><strong>{{ getPriorityLabel(profile!.strategyConfig.reviewPriority) }}</strong></div>
                  </div>
                  <div class="preview-arrow">
                    <el-icon :size="24" color="#409EFF"><Right /></el-icon>
                  </div>
                  <div class="preview-col to">
                    <div class="col-title" :style="{ color: getLevelColor(targetRiskLevel!) }">
                      调级后 · {{ getLevelLabel(targetRiskLevel!) }}
                    </div>
                    <div class="preview-item">
                      <span>单笔限额</span>
                      <strong :class="previewStrategy.tradeLimit.singleTradeMax > profile!.strategyConfig.tradeLimit.singleTradeMax ? 'up' : 'down'">
                        {{ formatThousands(previewStrategy.tradeLimit.singleTradeMax) }}
                      </strong>
                    </div>
                    <div class="preview-item">
                      <span>日累计</span>
                      <strong :class="previewStrategy.tradeLimit.dailyTotalMax > profile!.strategyConfig.tradeLimit.dailyTotalMax ? 'up' : 'down'">
                        {{ formatThousands(previewStrategy.tradeLimit.dailyTotalMax) }}
                      </strong>
                    </div>
                    <div class="preview-item">
                      <span>单票占比</span>
                      <strong :class="previewStrategy.positionLimit.singleStockRatio > profile!.strategyConfig.positionLimit.singleStockRatio ? 'up' : 'down'">
                        {{ previewStrategy.positionLimit.singleStockRatio }}%
                      </strong>
                    </div>
                    <div class="preview-item">
                      <span>审核优先级</span>
                      <strong>{{ getPriorityLabel(previewStrategy.reviewPriority) }}</strong>
                    </div>
                  </div>
                </div>
                <el-alert
                  :title="`等级变更后，系统将自动同步更新客户台账并推送通知至客户`"
                  type="info"
                  :closable="false"
                  show-icon
                  style="margin-top: 12px"
                />
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="资产与交易数据" name="data">
          <div class="data-section">
            <div class="data-panel">
              <h4 class="section-title"><el-icon><Wallet /></el-icon>资产概览</h4>
              <div class="asset-summary-grid">
                <div class="asset-summary-card">
                  <div class="a-label">总资产</div>
                  <div class="a-value big">{{ formatThousands(profile?.assetStats.totalAssets || 0) }}元</div>
                </div>
                <div class="asset-summary-card">
                  <div class="a-label">净资产</div>
                  <div class="a-value">{{ formatThousands(profile?.assetStats.netAssets || 0) }}元</div>
                </div>
                <div class="asset-summary-card">
                  <div class="a-label">可用资金</div>
                  <div class="a-value highlight">{{ formatThousands(profile?.assetStats.availableCash || 0) }}元</div>
                </div>
                <div class="asset-summary-card">
                  <div class="a-label">持仓市值</div>
                  <div class="a-value">{{ formatThousands(profile?.assetStats.positionAmount || 0) }}元</div>
                </div>
              </div>

              <div class="asset-breakdown-row">
                <div class="breakdown-item">
                  <div class="b-label">持仓占比</div>
                  <el-progress
                    :percentage="profile?.assetStats.positionRatio || 0"
                    :color="getIntegrityColor(100 - (profile?.assetStats.positionRatio || 0))"
                    :stroke-width="8"
                  />
                </div>
                <div class="breakdown-item">
                  <div class="b-label">融资占比</div>
                  <el-progress
                    :percentage="profile?.assetStats.marginRatio || 0"
                    :color="getIntegrityColor(100 - (profile?.assetStats.marginRatio || 0))"
                    :stroke-width="8"
                  />
                  <div class="b-value">{{ formatThousands(profile?.assetStats.totalMargin || 0) }}元</div>
                </div>
                <div class="breakdown-item">
                  <div class="b-label">近30日资产变动</div>
                  <div
                    class="b-value-change"
                    :class="(profile?.assetStats.assetChange30dRatio || 0) >= 0 ? 'up' : 'down'"
                  >
                    <el-icon><component :is="(profile?.assetStats.assetChange30dRatio || 0) >= 0 ? 'Top' : 'Bottom'" /></el-icon>
                    {{ formatThousands(Math.abs(profile?.assetStats.assetChange30d || 0)) }}元
                    （{{ (profile?.assetStats.assetChange30dRatio || 0) >= 0 ? '+' : '' }}{{ (profile?.assetStats.assetChange30dRatio || 0).toFixed(2) }}%）
                  </div>
                </div>
              </div>
            </div>

            <el-divider />

            <div class="data-panel">
              <h4 class="section-title"><el-icon><TrendCharts /></el-icon>近30日交易统计</h4>
              <div class="trade-stats-grid">
                <div class="trade-stat-card">
                  <div class="t-label">交易笔数</div>
                  <div class="t-value">{{ formatThousands(profile?.tradeStats.totalTrades30d || 0) }}</div>
                </div>
                <div class="trade-stat-card">
                  <div class="t-label">交易总金额</div>
                  <div class="t-value">{{ formatMoneyCompact(profile?.tradeStats.totalAmount30d || 0) }}</div>
                </div>
                <div class="trade-stat-card">
                  <div class="t-label">平均单笔</div>
                  <div class="t-value">{{ formatMoneyCompact(profile?.tradeStats.avgTradeAmount || 0) }}</div>
                </div>
                <div class="trade-stat-card">
                  <div class="t-label">单日最高笔数</div>
                  <div class="t-value">{{ formatThousands(profile?.tradeStats.maxDailyTrades || 0) }}</div>
                </div>
                <div class="trade-stat-card danger">
                  <div class="t-label">异常拦截次数</div>
                  <div class="t-value big">{{ formatThousands(profile?.tradeStats.interceptionCount30d || 0) }}</div>
                </div>
                <div class="trade-stat-card">
                  <div class="t-label">异常交易占比</div>
                  <div class="t-value" :style="{ color: (profile?.tradeStats.abnormalRatio || 0) > 0.05 ? '#F56C6C' : '#67C23A' }">
                    {{ ((profile?.tradeStats.abnormalRatio || 0) * 100).toFixed(2) }}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>

      <el-form ref="levelFormRef" :model="levelForm" v-show="false" />
    </div>

    <template #footer>
      <el-button @click="visibleState = false">关闭</el-button>
      <el-button
        v-if="hasPerm('riskLevel:sync') && profile"
        type="success"
        @click="handleSyncStrategy"
      >同步风控策略</el-button>
      <el-button
        v-if="hasPerm('riskLevel:history') && profile"
        type="info"
        @click="emitViewHistory"
      >变更溯源记录</el-button>
      <el-button
        v-if="canAdjust && profile?.canBeAssessed"
        type="primary"
        @click="activeTab = 'assessment'"
      >调整风险等级</el-button>
    </template>
  </FinDialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick } from 'vue'
import {
  ElMessage,
  ElMessageBox,
  ElNotification,
  type FormInstance,
} from 'element-plus'
import {
  Shield,
  WarningFilled,
  CircleCheck,
  Close,
  Settings,
  Money,
  Collection,
  Document,
  Star,
  Check,
  Promotion,
  Right,
  Wallet,
  TrendCharts,
  Top,
  Bottom,
  Lock,
  User,
  Warning,
} from '@element-plus/icons-vue'
import FinDialog from '@/components/common/FinDialog.vue'
import { usePermission } from '@/hooks/usePermission'
import {
  CUSTOMER_RISK_LEVEL_LABELS,
  CUSTOMER_RISK_LEVEL_SHORT_LABELS,
  CUSTOMER_RISK_LEVEL_COLORS,
  CUSTOMER_RISK_LEVEL_BG_COLORS,
  CUSTOMER_RISK_LEVEL_SCORES,
  RISK_LEVEL_STRATEGY_TEMPLATES,
  REVIEW_PRIORITY_LABELS,
  REVIEW_PRIORITY_COLORS,
  ASSESSMENT_SOURCE_LABELS,
  DATA_INTEGRITY_STATUS_LABELS,
} from '@/constants/dictionaries'
import {
  CustomerRiskLevel,
  ReviewPriority,
  DataIntegrityStatus,
  AssessmentDataSource,
} from '@/enums'
import * as riskLevelApi from '@/api/riskLevel'
import type {
  ICustomerRiskProfile,
  IRiskLevelStrategyConfig,
} from '@/types/api'

const props = defineProps<{
  visible: boolean
  profileId: number | null
}>()

const emit = defineEmits<{
  'update:visible': [v: boolean]
  'level-adjusted': []
  'strategy-synced': []
  'view-history': [customerId: number]
}>()

const { hasPerm } = usePermission()

const visibleState = computed({
  get: () => props.visible,
  set: (v) => emit('update:visible', v),
})

const detailLoading = ref(false)
const profile = ref<ICustomerRiskProfile | null>(null)
const activeTab = ref('integrity')
const targetRiskLevel = ref<CustomerRiskLevel | null>(null)
const validationResult = ref<any>(null)
const levelFormRef = ref<FormInstance>()

const levelForm = reactive({
  changeReason: '',
})

const canAdjust = computed(() => hasPerm('riskLevel:adjust'))

const isExpiring = computed(() => {
  if (!profile.value?.nextAssessmentDate) return false
  const t = new Date(profile.value.nextAssessmentDate).getTime()
  const now = Date.now()
  return t > now && t - now < 30 * 86400000
})

const isOverdue = computed(() => {
  if (!profile.value?.nextAssessmentDate) return false
  return new Date(profile.value.nextAssessmentDate).getTime() < Date.now()
})

const weights: Record<string, number> = {
  tradeFrequencyScore: 20,
  volatilityScore: 20,
  concentrationScore: 20,
  interceptionScore: 25,
  marketAdaptabilityScore: 15,
}

const behaviorScoreList = computed(() => {
  if (!profile.value) return {}
  const s = profile.value.behaviorScores
  return {
    tradeFrequencyScore: { label: '交易频率评分', value: s.tradeFrequencyScore },
    volatilityScore: { label: '波动承受评分', value: s.volatilityScore },
    concentrationScore: { label: '集中度评分', value: s.concentrationScore },
    interceptionScore: { label: '违规记录评分', value: s.interceptionScore },
    marketAdaptabilityScore: { label: '市场适应评分', value: s.marketAdaptabilityScore },
  }
})

const currentStrategy = computed<IRiskLevelStrategyConfig>(() => {
  if (targetRiskLevel.value && targetRiskLevel.value !== profile.value?.riskLevel) {
    return previewStrategy.value
  }
  return (
    profile.value?.strategyConfig ||
    RISK_LEVEL_STRATEGY_TEMPLATES[CustomerRiskLevel.MEDIUM]
  )
})

const showPreview = computed(() => {
  return targetRiskLevel.value && targetRiskLevel.value !== profile.value?.riskLevel
})

const previewStrategy = computed<IRiskLevelStrategyConfig>(() => {
  if (!targetRiskLevel.value) return profile.value?.strategyConfig as any
  return RISK_LEVEL_STRATEGY_TEMPLATES[targetRiskLevel.value]
})

const integrityStatusClass = computed(() => {
  const v = profile.value?.overallIntegrity || 0
  if (v >= 90) return 'status-complete'
  if (v >= 70) return 'status-partial'
  return 'status-missing'
})

const integrityColor = computed(() => {
  return getIntegrityColor(profile.value?.overallIntegrity || 0)
})

const integrityStatusText = computed(() => {
  const v = profile.value?.overallIntegrity || 0
  if (v >= 90) return '数据完整，支持精准评定'
  if (v >= 70) return '部分缺失，评定结果可能存在偏差'
  return '数据严重缺失，暂时无法评定'
})

const levelOptions = [
  { label: '低风险', value: CustomerRiskLevel.LOW },
  { label: '中风险', value: CustomerRiskLevel.MEDIUM },
  { label: '较高风险', value: CustomerRiskLevel.HIGH },
  { label: '高风险', value: CustomerRiskLevel.VERY_HIGH },
]

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

function getLevelIcon(level: CustomerRiskLevel): any {
  const map: Record<CustomerRiskLevel, any> = {
    [CustomerRiskLevel.LOW]: Shield,
    [CustomerRiskLevel.MEDIUM]: User,
    [CustomerRiskLevel.HIGH]: Warning,
    [CustomerRiskLevel.VERY_HIGH]: Lock,
  }
  return map[level] || Shield
}

function getScoreRange(level: CustomerRiskLevel): string {
  const r = CUSTOMER_RISK_LEVEL_SCORES[level]
  return r ? `${r[0]}-${r[1]}分` : ''
}

function getPriorityLabel(p: ReviewPriority): string {
  return REVIEW_PRIORITY_LABELS[p] || p
}

function getPriorityColor(p: ReviewPriority): string {
  return REVIEW_PRIORITY_COLORS[p] || '#909399'
}

function getSourceLabel(s: AssessmentDataSource): string {
  return ASSESSMENT_SOURCE_LABELS[s] || s
}

function getStatusText(s: DataIntegrityStatus): string {
  return DATA_INTEGRITY_STATUS_LABELS[s] || s
}

function getStatusTagType(s: DataIntegrityStatus): 'success' | 'warning' | 'danger' {
  return s === DataIntegrityStatus.COMPLETE
    ? 'success'
    : s === DataIntegrityStatus.PARTIAL
      ? 'warning'
      : 'danger'
}

function getIntegrityColor(v: number): string {
  if (v >= 90) return '#27AE60'
  if (v >= 70) return '#2980B9'
  if (v >= 50) return '#E67E22'
  return '#C0392B'
}

function formatThousands(num: number): string {
  if (!num && num !== 0) return '0'
  return num.toLocaleString('zh-CN')
}

function formatMoneyCompact(num: number): string {
  if (!num) return '0'
  if (num >= 100000000) return (num / 100000000).toFixed(2) + '亿'
  if (num >= 10000) return (num / 10000).toFixed(2) + '万'
  return formatThousands(num)
}

function formatDate(d: string): string {
  if (!d) return '-'
  return d.slice(0, 10)
}

async function handleOpen() {
  targetRiskLevel.value = null
  validationResult.value = null
  if (props.profileId) {
    await fetchDetail(props.profileId)
  }
  activeTab.value = profile.value?.canBeAssessed ? 'integrity' : 'integrity'
}

async function fetchDetail(id: number) {
  detailLoading.value = true
  try {
    const res = await riskLevelApi.getCustomerRiskById(id)
    if (res.code === 0) {
      profile.value = res.data
    } else {
      ElMessage.error(res.message)
    }
  } catch (e) {
    ElMessage.error('加载客户风险档案失败')
  } finally {
    detailLoading.value = false
  }
}

function handleTargetLevelChange() {
  if (!profile.value || !targetRiskLevel.value) return
  if (targetRiskLevel.value === profile.value.riskLevel) {
    return
  }
  validateLevelChange()
}

async function validateLevelChange() {
  if (!profile.value || !targetRiskLevel.value) return
  try {
    const res = await riskLevelApi.validateLevelChange(
      profile.value.customerId,
      targetRiskLevel.value,
    )
    validationResult.value = res.data
    if (!res.data.valid) {
      ElNotification.warning({
        title: '调级校验异常',
        message: res.data.violations?.[0]?.rule || '存在合规校验不通过项，请检查支撑数据',
      })
    }
  } catch (e) {
    // 忽略
  }
}

async function handleSubmitLevelChange() {
  if (!profile.value || !targetRiskLevel.value) return
  if (targetRiskLevel.value === profile.value.riskLevel) return
  try {
    const { value: reason } = await ElMessageBox.prompt(
      `确定将 ${profile.value.customerName} 调整为 ${getLevelLabel(targetRiskLevel.value)} 吗？`,
      '调级原因确认',
      {
        confirmButtonText: '确认调级',
        cancelButtonText: '取消',
        inputPlaceholder: '请填写调级原因（必填）',
        inputValidator: (v: string) => (v && v.trim().length >= 4 ? true : '原因不少于4个字符'),
        type: targetRiskLevel.value > profile.value.riskLevel ? 'warning' : 'success',
      },
    )

    const res = await riskLevelApi.updateCustomerRiskLevel({
      customerId: profile.value.customerId,
      targetLevel: targetRiskLevel.value!,
      changeReason: reason as string,
      autoSyncStrategy: true,
      sendNotification: true,
      effectiveImmediately: true,
    })

    if (res.code === 0) {
      ElMessage.success(`等级调整成功，已自动同步 ${res.data.strategySynced ? '风控策略' : '客户台账'}`)
      ElNotification.success({
        title: '风控策略已联动更新',
        message: `${getLevelLabel(profile.value!.riskLevel)} → ${getLevelLabel(targetRiskLevel.value!)}，审核优先级、交易限额已同步变更`,
      })
      targetRiskLevel.value = null
      validationResult.value = null
      emit('level-adjusted')
      await fetchDetail(profile.value.id)
    } else {
      ElMessage.error(res.message)
    }
  } catch (e) {
    // 取消
  }
}

async function handleSyncStrategy() {
  if (!profile.value) return
  try {
    await ElMessageBox.confirm(
      `重新同步客户 ${profile.value.customerName} 的风控策略？将根据当前风险等级重新计算交易限额与审核规则。`,
      '同步确认',
      { type: 'warning' },
    )
    const res = await riskLevelApi.syncCustomerStrategy(profile.value.customerId)
    if (res.code === 0) {
      ElMessage.success(`策略同步成功，共更新 ${res.data.fields.length} 项配置`)
      emit('strategy-synced')
      fetchDetail(profile.value.id)
    }
  } catch (e) {
    // cancel
  }
}

function emitViewHistory() {
  if (!profile.value) return
  emit('view-history', profile.value.customerId)
}

watch(
  () => props.visible,
  (v) => {
    if (v && props.profileId) fetchDetail(props.profileId)
  },
)
</script>

<style lang="scss" scoped>
.detail-wrapper {
  min-height: 400px;
}

.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  padding: 20px 24px;
  margin: -4px -4px 20px;
  background: linear-gradient(135deg, #F5F9FF 0%, #F0F5EB 50%, #FFF7F0 100%);
  border-radius: 10px;
  border: 1px solid #E4E7ED;
}

.profile-main {
  display: flex;
  align-items: center;
  gap: 18px;
  flex: 1;
}

.profile-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  font-weight: 700;
  border: 2px solid;
  flex-shrink: 0;
}

.profile-info { flex: 1; min-width: 0; }

.customer-header-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.customer-name {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #1F2D3D;
}

.customer-account {
  font-family: monospace;
  font-size: 12px;
  color: #606266;
  background: rgba(0,0,0,0.05);
  padding: 2px 8px;
  border-radius: 4px;
}

.customer-level-tag {
  padding: 2px 10px;
  background: #fff;
  border: 1px solid #DCDFE6;
  border-radius: 10px;
  font-size: 12px;
  color: #606266;
  font-weight: 500;
}

.customer-stat-row {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.customer-stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-label { font-size: 11px; color: #8492A6; }
.stat-value {
  font-size: 13px;
  color: #1F2D3D;
  font-weight: 500;

  &.danger { color: #F56C6C; font-weight: 600; }
  &.warning { color: #E6A23C; font-weight: 600; }
}

.risk-level-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  background: #fff;
  padding: 14px 28px;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.06);
  border: 1px solid #EBEEF5;
}

.risk-ring-wrapper {
  position: relative;
}

.ring-inner-text {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.ring-score {
  font-size: 28px;
  font-weight: 700;
  color: #1F2D3D;
  font-family: 'DIN', monospace;
  line-height: 1;
}

.ring-label {
  font-size: 11px;
  color: #8492A6;
  margin-top: 2px;
}

.risk-level-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 16px;
}

.risk-score-range {
  font-size: 11px;
  color: #8492A6;
}

.detail-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 16px;
  }
  :deep(.el-tabs__nav-wrap::after) {
    height: 1px;
  }
  :deep(.el-tabs__item) {
    font-size: 14px;
    font-weight: 500;
  }
}

.section-title {
  margin: 0 0 16px;
  font-size: 15px;
  font-weight: 600;
  color: #1F2D3D;
  display: inline-flex;
  align-items: center;
  gap: 6px;

  .el-icon { color: #409EFF; }
}

.integrity-overview {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 20px;
}

.integrity-summary-card {
  background: linear-gradient(180deg, #fff 0%, #F5F9FF 100%);
  border: 1px solid #E4E7ED;
  border-radius: 10px;
  padding: 20px;
  text-align: center;

  &.status-complete { border-color: rgba(39,174,96,0.3); background: linear-gradient(180deg, #fff 0%, #F0F9F4 100%); }
  &.status-partial { border-color: rgba(41,128,185,0.3); }
  &.status-missing { border-color: rgba(192,57,43,0.3); background: linear-gradient(180deg, #fff 0%, #FEF5F5 100%); }
}

.integrity-summary-main { margin-bottom: 14px; }

.summary-label {
  font-size: 13px;
  color: #606266;
  margin-bottom: 4px;
}

.summary-score {
  font-size: 40px;
  font-weight: 700;
  font-family: 'DIN', monospace;
  line-height: 1.1;
}

.summary-status {
  font-size: 12px;
  margin-top: 4px;
  color: #8492A6;
}

.integrity-bar {
  height: 8px;
  background: #F2F6FC;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 16px;
}

.integrity-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.6s ease;
}

.assessment-blocker-section {
  text-align: left;
}

.blocker-title {
  font-size: 12px;
  color: #606266;
  font-weight: 600;
  margin-bottom: 8px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.blocker-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.blocker-item {
  padding: 6px 10px;
  background: #FEF0F0;
  color: #F56C6C;
  font-size: 12px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.no-blockers {
  padding: 8px 10px;
  background: #F0F9F4;
  color: #67C23A;
  font-size: 12px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.integrity-sources {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  align-content: start;
}

.integrity-source-card {
  background: #fff;
  border: 1px solid #E4E7ED;
  border-radius: 8px;
  padding: 14px 16px;
}

.source-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.source-label {
  font-weight: 600;
  font-size: 13px;
  color: #1F2D3D;
}

.source-progress {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;

  .el-progress { flex: 1; }
}

.progress-num {
  font-family: 'DIN', monospace;
  font-weight: 600;
  font-size: 13px;
  min-width: 40px;
  text-align: right;
}

.source-meta {
  font-size: 11px;
  color: #8492A6;
  margin-bottom: 6px;
}

.missing-fields {
  font-size: 11px;
  line-height: 1.6;
}

.missing-label { color: #8492A6; }

.missing-tag {
  display: inline-block;
  padding: 1px 6px;
  background: #FEF0F0;
  color: #F56C6C;
  border-radius: 3px;
  margin: 2px 4px 2px 0;
  font-size: 10px;
}

.missing-more {
  color: #8492A6;
  font-size: 10px;
}

.assessment-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.behavior-scores { margin-bottom: 4px; }

.score-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}

.score-card {
  background: #FAFBFC;
  border: 1px solid #EBEEF5;
  border-radius: 8px;
  padding: 14px;
}

.score-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 10px;
}

.score-label {
  font-size: 12px;
  font-weight: 600;
  color: #1F2D3D;
}

.score-weight {
  font-size: 10px;
  color: #8492A6;
  font-family: 'DIN', monospace;
}

.strategy-section { position: relative; }

.strategy-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  gap: 16px;
  flex-wrap: wrap;
}

.adjust-level-section {
  display: flex;
  align-items: center;
}

.strategy-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

.strategy-card {
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #EBEEF5;
  background: #fff;

  &.trade { border-top: 3px solid #2980B9; }
  &.position { border-top: 3px solid #8E44AD; }
  &.review { border-top: 3px solid #E67E22; }
  &.special { border-top: 3px solid #27AE60; }
}

.strategy-card-header {
  padding: 10px 14px;
  background: #FAFBFC;
  font-size: 13px;
  font-weight: 600;
  color: #1F2D3D;
  display: flex;
  align-items: center;
  gap: 6px;
  border-bottom: 1px solid #F2F6FC;

  .el-icon { font-size: 16px; }
}

.strategy-card-body {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.strategy-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}

.s-label { color: #8492A6; }
.s-value { color: #1F2D3D; font-weight: 600; font-family: 'DIN', monospace; }

.strategy-card-body.tags {
  flex-direction: column;
}

.permission-row {
  display: flex;
  gap: 14px;
  font-size: 12px;
  border-top: 1px dashed #EBEEF5;
  padding-top: 8px;

  span { display: inline-flex; align-items: center; gap: 3px; }
  .ok { color: #67C23A; }
  .deny { color: #8492A6; opacity: 0.7; }
}

.strategy-preview-comparison {
  margin-top: 20px;
  padding: 18px 22px;
  background: linear-gradient(135deg, #F5F9FF 0%, #FFF7F0 100%);
  border-radius: 10px;
  border: 1px dashed #83b2e2;
}

.preview-title {
  font-size: 15px;
  font-weight: 600;
  color: #1F2D3D;
  display: inline-flex;
  align-items: center;
  gap: 6px;

  .el-icon { color: #409EFF; }
}

.preview-comparison-grid {
  display: grid;
  grid-template-columns: 1fr 48px 1fr;
  align-items: center;
  gap: 16px;
  margin: 16px 0;
}

.preview-col {
  background: #fff;
  padding: 14px 18px;
  border-radius: 8px;
  border: 1px solid #EBEEF5;
}

.col-title {
  font-weight: 600;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #F2F6FC;
  font-size: 13px;
}

.preview-item {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  padding: 5px 0;
  color: #606266;

  strong { color: #1F2D3D; font-family: 'DIN', monospace; }
  strong.up { color: #67C23A; }
  strong.down { color: #E67E22; }
}

.preview-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ECF5FF;
  border-radius: 50%;
  width: 48px;
  height: 48px;
}

.data-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.asset-summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 18px;
}

.asset-summary-card {
  background: #FAFBFC;
  border: 1px solid #EBEEF5;
  border-radius: 8px;
  padding: 14px 16px;

  .a-label {
    font-size: 12px;
    color: #8492A6;
    margin-bottom: 6px;
  }

  .a-value {
    font-size: 18px;
    font-weight: 700;
    color: #1F2D3D;
    font-family: 'DIN', monospace;

    &.big { font-size: 22px; }
    &.highlight { color: #2980B9; }
  }
}

.asset-breakdown-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
}

.breakdown-item {
  background: #fff;
  padding: 14px;
  border: 1px solid #EBEEF5;
  border-radius: 8px;

  .b-label {
    font-size: 12px;
    color: #606266;
    margin-bottom: 8px;
    font-weight: 500;
  }

  .b-value {
    font-size: 12px;
    color: #8492A6;
    margin-top: 6px;
    font-family: 'DIN', monospace;
  }

  .b-value-change {
    font-size: 13px;
    font-weight: 600;
    font-family: 'DIN', monospace;
    display: inline-flex;
    align-items: center;
    gap: 2px;
    margin-top: 14px;

    &.up { color: #F56C6C; }
    &.down { color: #67C23A; }
  }
}

.trade-stats-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
}

.trade-stat-card {
  background: #FAFBFC;
  border: 1px solid #EBEEF5;
  border-radius: 8px;
  padding: 14px 14px;
  text-align: center;

  &.danger {
    background: linear-gradient(180deg, #FEF5F5 0%, #fff 100%);
    border-color: rgba(245,108,108,0.3);
  }

  .t-label {
    font-size: 11px;
    color: #8492A6;
    margin-bottom: 6px;
  }

  .t-value {
    font-size: 20px;
    font-weight: 700;
    color: #1F2D3D;
    font-family: 'DIN', monospace;

    &.big { font-size: 26px; color: #F56C6C; }
  }
}

@media (max-width: 992px) {
  .integrity-overview, .score-grid, .strategy-grid, .asset-summary-grid, .asset-breakdown-row, .trade-stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .profile-header { flex-direction: column; }
}
</style>
