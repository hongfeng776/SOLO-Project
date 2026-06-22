<template>
  <div class="campaign-effect-detail">
    <div v-if="skeletonLoading" class="skeleton-wrap">
      <div class="status-tip-skeleton">
        <el-skeleton :rows="1" animated />
      </div>
      <div class="metrics-skeleton">
        <el-skeleton :rows="4" animated />
      </div>
      <div class="level-skeleton">
        <el-skeleton :rows="4" animated />
      </div>
    </div>

    <template v-else-if="dataResult">
      <div v-if="!dataResult.statusValid" class="status-bar warning">
        <el-icon><Warning /></el-icon>
        <span>
          {{ dataResult.campaignStatus === 0 || dataResult.campaignStatus === 1
            ? '活动尚未上线，暂无可统计效果数据，可预览配置预览'
            : '活动尚未进行，仅展示预估数据' }}
        </span>
      </div>
      <div v-else class="status-bar success">
        <el-icon><CircleCheckFilled /></el-icon>
        <span>活动周期：{{ dataResult.campaignStart?.split('T')[0] }} ~ {{ dataResult.campaignEnd?.split('T')[0] }}</span>
        <el-tag size="small" effect="plain" style="margin-left: 8px">
          数据截止：{{ new Date().toLocaleDateString() }}
        </el-tag>
      </div>

      <div class="filter-bar">
        <div class="filter-group">
          <span class="filter-label">维度切换：</span>
          <el-radio-group v-model="activeDimGroup">
            <el-radio-button label="core">核心指标</el-radio-button>
            <el-radio-button label="financial">财务ROI</el-radio-button>
            <el-radio-button label="conversion">转化链路</el-radio-button>
          </el-radio-group>
        </div>
        <div class="filter-action">
          <el-button size="default" :icon="Refresh" @click="handleReEvaluate">
            重新计算评级
          </el-button>
          <el-button size="default" type="primary" :icon="Download" @click="$emit('export')">
            导出报表
          </el-button>
        </div>
      </div>

      <div class="metrics-grid">
        <div
          v-for="(m, idx) in visibleMetrics"
          :key="m.key"
          class="metric-card"
          :class="{ highlight: idx === 0 }"
          :style="idx === 0 ? { background: m.gradient } : {}"
        >
          <div class="metric-label">
            <el-icon v-if="m.icon && idx === 0" style="color: #fff"><component :is="m.icon" /></el-icon>
            <el-icon v-else-if="m.icon" :style="{ color: m.iconColor }"><component :is="m.icon" /></el-icon>
            <span :class="{ white: idx === 0 }">{{ m.label }}</span>
          </div>
          <div class="metric-value" :class="{ white: idx === 0 }">
            {{ m.formatted }}
            <span class="unit" v-if="m.unit">{{ m.unit }}</span>
          </div>
          <div class="metric-foot" :class="{ white: idx === 0 }">
            <span v-if="m.yoy">
              {{ m.yoy > 0 ? '↑' : '↓' }}
              {{ Math.abs(m.yoy).toFixed(1) }}%
            </span>
            <span class="tips">{{ m.tip || '' }}</span>
          </div>
        </div>
      </div>

      <div class="bottom-row">
        <div class="level-card-wrap">
          <h4 class="section-title">
            <el-icon color="#e6a23c"><Medal /></el-icon>
            活动效果评级
          </h4>
          <div
            class="level-badge"
            v-if="dataResult.evaluated"
            :style="{ background: gradientMap[dataResult.evaluated.efficiencyLevel] }"
          >
            <div class="badge-name">{{ levelMap[dataResult.evaluated.efficiencyLevel] }}</div>
            <div class="badge-score">{{ dataResult.evaluated.efficiencyScore?.toFixed(1) }}<i>/100</i></div>
            <div class="badge-tag">{{ dataResult.evaluated.levelCfg?.label }}</div>
          </div>

          <div class="score-breakdown" v-if="dataResult.evaluated?.subScores">
            <div v-for="(v, k) in subScoreDisplay" :key="k" class="score-row">
              <span class="s-label">{{ v.label }}</span>
              <el-progress
                :percentage="Math.round(v.value)"
                :stroke-width="10"
                :color="v.color"
                :show-text="false"
                style="flex: 1"
              />
              <span class="s-val">{{ v.value.toFixed(0) }}</span>
            </div>
          </div>
        </div>

        <div class="suggestion-wrap">
          <h4 class="section-title">
            <el-icon color="#f56c6c"><Lightning /></el-icon>
            优化建议
            <el-tag size="small" effect="plain" v-if="dataResult.evaluated?.optimizeSuggestions?.length">
              共{{ dataResult.evaluated.optimizeSuggestions.length }}条
            </el-tag>
          </h4>
          <div class="suggestion-list">
            <div
              v-for="(s, i) in (dataResult.evaluated?.optimizeSuggestions || [])"
              :key="i"
              class="suggestion-item"
              :class="s.level"
            >
              <div class="s-head">
                <el-tag size="small" :type="s.level === 'success' ? 'success' : s.level === 'info' ? 'info' : s.level === 'warning' ? 'warning' : 'danger'" effect="plain">
                  {{ s.priority === 1 ? '高优先' : s.priority === 2 ? '中优先' : '低优先' }}
                </el-tag>
                <h6>{{ s.title }}</h6>
              </div>
              <p>{{ s.desc }}</p>
            </div>
          </div>

          <div v-if="dataResult.evaluated?.templateTags?.length" class="template-tags">
            <h6>
              <el-icon color="#67c23a"><Crown /></el-icon>
              优质标签
            </h6>
            <div class="tag-row">
              <el-tag
                v-for="t in dataResult.evaluated.templateTags"
                :key="t"
                size="default"
                effect="dark"
                type="success"
                class="t-tag"
              >{{ t }}</el-tag>
            </div>
            <el-button
              v-if="!isTemplate"
              type="success"
              plain
              size="small"
              style="margin-top: 10px"
              @click="handleMarkTemplate"
            >
              <el-icon><Star /></el-icon>
              标记为优质模板
            </el-button>
          </div>
        </div>

        <div class="authenticity-wrap">
          <h4 class="section-title">
            <el-icon color="#8e44ad"><Lock /></el-icon>
            数据真伪校验
          </h4>
          <div class="authenticity-header">
            <div class="auth-score" :style="{ background: authColor }">
              {{ dataResult.evaluated?.authenticityScore?.toFixed(0) || '—' }}
              <i>/100</i>
            </div>
            <div class="auth-text">
              <el-tag
                size="default"
                :color="authColor"
                effect="dark"
              >
                {{ authenticityMap[dataResult.evaluated?.dataAuthenticity || 1] }}
              </el-tag>
              <p>{{ authDesc }}</p>
            </div>
          </div>

          <div class="auth-checks">
            <div
              v-for="c in (dataResult.evaluated?.authenticity?.checks || [])"
              :key="c.type"
              class="check-row"
            >
              <el-icon :color="c.pass ? '#67c23a' : '#f56c6c'">
                <CircleCheck v-if="c.pass" /><CircleClose v-else />
              </el-icon>
              <span :class="{ fail: !c.pass }">{{ c.desc }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Warning, CircleCheckFilled, Refresh, Download, Medal,
  Lightning, Crown, Star, Lock, CircleCheck, CircleClose,
  DataLine, Wallet, User, Promotion, Goods, ShoppingCart, ArrowRight, TrendCharts, PieChart
} from '@element-plus/icons-vue'
import {
  getEffectDetailApi,
  evaluateCampaignEffectApi,
  toggleTemplateApi
} from '@/api/marketing'
import {
  EfficiencyLevelMap,
  EfficiencyLevelGradientMap,
  DataAuthenticityMap,
  DataAuthenticityColorMap
} from '@/enums/marketing'
import type { EffectStatisticsResult } from '@/types/marketing'

const props = defineProps<{
  campaignId: number;
  campaign?: any;
}>()

const emit = defineEmits<{
  (e: 'export'): void;
  (e: 'open-funnel'): void;
  (e: 'data-loaded', v: EffectStatisticsResult): void;
}>()

const skeletonLoading = ref(true)
const activeDimGroup = ref<'core' | 'financial' | 'conversion'>('core')
const dataResult = ref<EffectStatisticsResult | null>(null)
const isTemplate = ref(false)

const levelMap = EfficiencyLevelMap
const gradientMap = EfficiencyLevelGradientMap
const authenticityMap = DataAuthenticityMap

const authColor = computed(() =>
  DataAuthenticityColorMap[dataResult.value?.evaluated?.dataAuthenticity || 1] || '#909399'
)

const authDesc = computed(() => {
  const a = dataResult.value?.evaluated?.dataAuthenticity
  if (a === 4) return '存在明显造假特征，建议人工复核'
  if (a === 3) return '部分数据异常，建议关注'
  if (a === 2) return '数据校验通过，可信度高'
  return '待校验，点击"重新计算评级"触发'
})

const subScoreDisplay = computed(() => {
  const s = dataResult.value?.evaluated?.subScores
  if (!s) return []
  return [
    { key: 'roi',            label: 'ROI得分',        value: s.roi || 0,            color: '#ff0050' },
    { key: 'redemptionRate', label: '核销率得分',      value: s.redemptionRate || 0, color: '#f56c6c' },
    { key: 'conversionRate', label: '转化率得分',      value: s.conversionRate || 0, color: '#e6a23c' },
    { key: 'ctr',            label: '点击率得分',      value: s.ctr || 0,            color: '#67c23a' },
    { key: 'budgetUsage',    label: '预算利用率得分',  value: s.budgetUsage || 0,    color: '#409eff' },
    { key: 'audienceMatch',  label: '人群匹配得分',    value: s.audienceMatch || 0,  color: '#8e44ad' }
  ]
})

const visibleMetrics = computed(() => {
  const metrics = buildMetricsList()
  const visibleMap = {
    core: ['participate', 'receive', 'use', 'conversion', 'gmv', 'redemptionRate'],
    financial: ['budget', 'usedBudget', 'roi', 'cac', 'avgOrder', 'subsidy'],
    conversion: ['impression', 'click', 'ctr', 'participate', 'conversion', 'conversionRate']
  }
  const keys = visibleMap[activeDimGroup.value] || []
  return metrics.filter(m => keys.includes(m.key))
})

const buildMetricsList = () => {
  const m = dataResult.value?.metrics || {} as any
  const e = dataResult.value?.evaluated || {} as any
  return [
    { key: 'participate',   label: '参与人数',    formatted: (m.participant || 0).toLocaleString(), unit: '人', gradient: 'linear-gradient(135deg, #667eea, #764ba2)', icon: User, iconColor: '#764ba2', yoy: 12.5, tip: '活动页面参与用户数' },
    { key: 'receive',       label: '领取权益数',  formatted: (m.receive || 0).toLocaleString(),    unit: '次', icon: 'Present', iconColor: '#8e44ad', yoy: 8.3, tip: '成功领取优惠券/福利次数' },
    { key: 'use',           label: '核销数',      formatted: (m.use || 0).toLocaleString(),        unit: '次', icon: 'Tickets', iconColor: '#f56c6c', yoy: 5.6, tip: '实际使用核销次数' },
    { key: 'conversion',    label: '转化订单',    formatted: (m.conversion || 0).toLocaleString(), unit: '单', icon: Goods, iconColor: '#ff0050', yoy: 10.2, tip: '使用福利后产生有效订单数' },
    { key: 'gmv',           label: '转化GMV',     formatted: `¥${(m.gmv || 0).toLocaleString()}`,   icon: ShoppingCart, iconColor: '#e6a23c', yoy: 22.8, tip: '核销权益带来的订单总额' },
    { key: 'redemptionRate',label: '核销率',      formatted: `${((e.redemptionRate || m.redemptionRate || 0) * 100).toFixed(1)}%`, icon: TrendCharts, iconColor: '#67c23a', yoy: 3.4, tip: '核销数 / 领取数' },
    { key: 'budget',        label: '活动预算',    formatted: `¥${(m.budget || 0).toLocaleString()}`, icon: Wallet, iconColor: '#409eff', tip: '配置的总预算' },
    { key: 'usedBudget',    label: '已用预算',    formatted: `¥${(m.usedBudget || 0).toLocaleString()}`, icon: DataLine, iconColor: '#f56c6c', tip: '累计核销补贴金额' },
    { key: 'roi',           label: '综合ROI',     formatted: (e.roiValue || m.roiValue || 0).toFixed(2), unit: '倍', icon: TrendCharts, iconColor: '#ff0050', yoy: 15.7, tip: 'GMV / 已用预算' },
    { key: 'cac',           label: '获客成本CAC', formatted: `¥${(dataResult.value?.evaluated?.metrics ? dataResult.value.evaluated.metrics.budgetUsage > 0 ? (m.usedBudget / Math.max(m.participant, 1)).toFixed(2) : '0.00' : '0.00')}`, unit: '/人', icon: Promotion, iconColor: '#909399', tip: '已用预算 / 参与人数' },
    { key: 'avgOrder',      label: '客单价',      formatted: `¥${m.conversion > 0 ? (m.gmv / m.conversion).toFixed(2) : '0.00'}`, unit: '/单', icon: PieChart, iconColor: '#67c23a', tip: '转化GMV / 转化订单' },
    { key: 'subsidy',       label: '单笔均补贴',  formatted: `¥${m.use > 0 ? (m.usedBudget / m.use).toFixed(2) : '0.00'}`, unit: '/单', icon: Wallet, iconColor: '#e6a23c', tip: '已用预算 / 核销数' },
    { key: 'impression',    label: '活动曝光',    formatted: (m.impression || 0).toLocaleString(), unit: '次', icon: 'View', iconColor: '#66b1ff', tip: '活动页面总浏览量' },
    { key: 'click',         label: '活动点击',    formatted: (m.click || 0).toLocaleString(),      unit: '次', icon: 'Pointer', iconColor: '#67c23a', tip: '点击参与按钮人次' },
    { key: 'ctr',           label: '点击率CTR',   formatted: `${((e.ctrValue || m.ctrValue || 0) * 100).toFixed(2)}%`, icon: ArrowRight, iconColor: '#409eff', tip: '点击数 / 曝光数' },
    { key: 'conversionRate',label: '整体转化率',  formatted: `${((e.conversionRate || m.conversionRate || 0) * 100).toFixed(1)}%`, icon: TrendCharts, iconColor: '#ff0050', tip: '转化订单 / 领取权益' }
  ]
}

const loadData = async () => {
  skeletonLoading.value = true
  try {
    const res = await getEffectDetailApi(props.campaignId, { force: 1 })
    dataResult.value = res.data as EffectStatisticsResult
    isTemplate.value = !!(props.campaign?.isTemplate || false)
    emit('data-loaded', dataResult.value)
  } catch (e: any) {
    ElMessage.error(e.message || '加载失败')
  } finally {
    skeletonLoading.value = false
  }
}

const handleReEvaluate = async () => {
  try {
    await evaluateCampaignEffectApi(props.campaignId)
    await loadData()
    ElMessage.success('效果评级已重新计算')
  } catch (e: any) {
    ElMessage.error(e.message || '评级失败')
  }
}

const handleMarkTemplate = async () => {
  if (!dataResult.value?.evaluated?.templateTags) return
  try {
    await toggleTemplateApi(props.campaignId, {
      isTemplate: true,
      templateTags: dataResult.value.evaluated.templateTags
    })
    isTemplate.value = true
    ElMessage.success('已标记为优质模板')
  } catch (e: any) {
    ElMessage.error(e.message || '操作失败')
  }
}

onMounted(loadData)
watch(() => props.campaignId, loadData)
</script>

<style lang="scss" scoped>
.campaign-effect-detail {
  .skeleton-wrap {
    padding: 20px;
  }
  .status-bar {
    padding: 12px 16px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    font-size: 13px;

    &.warning {
      background: #fdf6ec;
      color: #b88230;
      .el-icon { color: #e6a23c; }
    }
    &.success {
      background: #ecf5ff;
      color: #409eff;
      .el-icon { color: #67c23a; }
    }
  }
  .filter-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    .filter-group {
      display: flex;
      align-items: center;
      gap: 8px;
      .filter-label { font-size: 13px; color: #606266; }
    }
  }
  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 18px;

    .metric-card {
      background: #fff;
      border: 1px solid #ebeef5;
      border-radius: 12px;
      padding: 14px 16px;
      transition: all 0.2s;

      &.highlight {
        color: #fff;
        border-color: transparent;
      }
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(0,0,0,0.06);
      }

      .metric-label {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        color: #606266;
        margin-bottom: 8px;
        .el-icon { font-size: 16px; }
        &.white { color: rgba(255,255,255,0.85); }
      }
      .metric-value {
        font-size: 24px;
        font-weight: 700;
        color: #303133;
        margin-bottom: 6px;
        .unit {
          font-size: 12px;
          font-weight: 400;
          margin-left: 2px;
          opacity: 0.7;
        }
        &.white { color: #fff; }
      }
      .metric-foot {
        font-size: 11px;
        color: #909399;
        display: flex;
        justify-content: space-between;
        &.white { color: rgba(255,255,255,0.7); }
        .tips { flex: 1; text-align: right; }
      }
    }
  }

  .bottom-row {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 14px;

    > div {
      background: #fff;
      border: 1px solid #ebeef5;
      border-radius: 12px;
      padding: 16px;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 6px;
      margin: 0 0 14px 0;
      font-size: 14px;
      font-weight: 600;
      color: #303133;

      .el-tag { margin-left: auto; }
    }
  }

  .level-card-wrap {
    .level-badge {
      border-radius: 12px;
      padding: 18px 16px;
      color: #fff;
      text-align: center;
      margin-bottom: 14px;

      .badge-name { font-size: 32px; font-weight: 700; letter-spacing: 4px; }
      .badge-score { font-size: 22px; font-weight: 600; margin: 4px 0; i { font-size: 12px; font-weight: 400; opacity: 0.7; }}
      .badge-tag { font-size: 12px; opacity: 0.85; }
    }

    .score-breakdown {
      .score-row {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 5px 0;

        .s-label {
          font-size: 12px;
          color: #606266;
          width: 90px;
          flex-shrink: 0;
        }
        .s-val {
          font-size: 12px;
          font-weight: 600;
          color: #303133;
          width: 30px;
          text-align: right;
        }
      }
    }
  }

  .suggestion-wrap {
    .suggestion-list {
      max-height: 300px;
      overflow-y: auto;
      .suggestion-item {
        background: #f5f7fa;
        border-radius: 8px;
        padding: 10px 12px;
        margin-bottom: 8px;
        border-left: 3px solid #909399;

        &.danger  { border-left-color: #f56c6c; background: #fef0f0; }
        &.warning { border-left-color: #e6a23c; background: #fdf6ec; }
        &.info    { border-left-color: #409eff; background: #ecf5ff; }
        &.success { border-left-color: #67c23a; background: #f0f9eb; }

        .s-head {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;

          h6 {
            margin: 0;
            font-size: 13px;
            font-weight: 600;
            color: #303133;
          }
        }
        p {
          margin: 0;
          font-size: 12px;
          color: #606266;
          line-height: 1.6;
        }
      }
    }

    .template-tags {
      margin-top: 14px;
      padding-top: 14px;
      border-top: 1px dashed #ebeef5;

      h6 {
        display: flex;
        align-items: center;
        gap: 6px;
        margin: 0 0 10px 0;
        font-size: 13px;
        font-weight: 600;
        color: #606266;
      }
      .tag-row { .t-tag + .t-tag { margin-left: 6px; } }
    }
  }

  .authenticity-wrap {
    .authenticity-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 14px;

      .auth-score {
        width: 76px;
        height: 76px;
        border-radius: 50%;
        color: #fff;
        font-size: 24px;
        font-weight: 700;
        display: flex;
        align-items: baseline;
        justify-content: center;
        i {
          font-size: 11px;
          font-weight: 400;
          margin-left: 1px;
          opacity: 0.8;
        }
      }
      .auth-text {
        flex: 1;
        p { margin: 6px 0 0 0; font-size: 12px; color: #606266; line-height: 1.5; }
      }
    }
    .auth-checks {
      .check-row {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 5px 0;
        font-size: 12px;
        color: #606266;

        & .fail { color: #f56c6c; }
      }
    }
  }
}
</style>
