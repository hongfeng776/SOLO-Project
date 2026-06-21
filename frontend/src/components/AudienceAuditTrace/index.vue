<template>
  <div class="audience-audit-trace">
    <div class="tab-switcher">
      <div
        v-for="t in tabs"
        :key="t.key"
        class="tab-item"
        :class="{ active: activeTab === t.key }"
        @click="activeTab = t.key"
      >
        <el-icon><component :is="t.icon" /></el-icon>
        <span>{{ t.label }}</span>
        <el-tag v-if="t.count" size="small" type="danger" round effect="dark">{{ t.count }}</el-tag>
      </div>
    </div>

    <div v-if="activeTab === 'stats'" class="stats-panel">
      <div class="stat-cards">
        <div
          v-for="(s, i) in summaryStats"
          :key="i"
          class="stat-card"
          :style="{ background: s.gradient }"
        >
          <h5>{{ s.label }}</h5>
          <h3>{{ s.value.toLocaleString() }}</h3>
          <span>{{ s.sub }}</span>
        </div>
      </div>

      <div class="charts-row">
        <div class="chart-card">
          <h4>近7天拦截情况</h4>
          <div class="bars">
            <div v-for="d in chartData.intercept" :key="d.date" class="bar-col">
              <div class="bar-wrap">
                <div
                  class="bar-fill risk"
                  :style="{ height: d.riskRatio + '%' }"
                  :title="`高风险拦截 ${d.risk} 次`"
                />
                <div
                  class="bar-fill invalid"
                  :style="{ height: d.invalidRatio + '%' }"
                  :title="`非定向拦截 ${d.invalid} 次`"
                />
                <div
                  class="bar-fill fraud"
                  :style="{ height: d.fraudRatio + '%' }"
                  :title="`恶意刷活动 ${d.fraud} 次`"
                />
              </div>
              <span>{{ d.label }}</span>
            </div>
          </div>
          <div class="bar-legend">
            <span class="dot risk"></span>高风险
            <span class="dot invalid"></span>非定向
            <span class="dot fraud"></span>恶意刷
          </div>
        </div>

        <div class="chart-card">
          <h4>操作类型分布</h4>
          <el-table :data="actionDist" size="small" border>
            <el-table-column prop="actionLabel" label="操作" />
            <el-table-column prop="count" label="次数" width="90" align="right">
              <template #default="{ row }">
                <b :style="{ color: row.color }">{{ row.count }}</b>
              </template>
            </el-table-column>
            <el-table-column label="占比">
              <template #default="{ row }">
                <el-progress
                  :percentage="row.pct"
                  :color="row.color"
                  :stroke-width="8"
                  :show-text="false"
                />
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'logs'" class="logs-panel">
      <div class="log-filters">
        <el-select
          v-model="filterAction"
          placeholder="操作类型"
          clearable
          size="default"
          style="width: 160px"
        >
          <el-option
            v-for="a in actionOptions"
            :key="a.value"
            :label="a.label"
            :value="a.value"
          />
        </el-select>
        <el-input
          v-model="filterKeyword"
          placeholder="搜索手机号/操作人"
          clearable
          size="default"
          style="width: 200px"
          :prefix-icon="Search"
        />
        <el-pagination
          class="log-pagination"
          background
          layout="prev, pager, next, total"
          :page-size="pageSize"
          :current-page="currentPage"
          :total="total"
          @current-change="currentPage = $event"
        />
      </div>

      <el-timeline>
        <el-timeline-item
          v-for="(log, idx) in logList"
          :key="log.id"
          :type="log.riskColor"
          :timestamp="log.createdAt"
          placement="top"
        >
          <el-card class="log-card" shadow="hover">
            <div class="log-header">
              <div class="log-title">
                <el-tag :color="actionColorMap[log.action]" effect="dark" size="small">
                  {{ actionMap[log.action] }}
                </el-tag>
                <span class="log-operator">{{ log.operatorName || '系统' }}</span>
                <span class="log-target" v-if="log.userPhone">
                  用户：{{ log.userPhone }}
                </span>
                <el-tag
                  v-if="log.riskLevel === 2"
                  size="small"
                  type="warning"
                  effect="plain"
                >需关注</el-tag>
                <el-tag
                  v-if="log.riskLevel >= 3"
                  size="small"
                  type="danger"
                  effect="plain"
                >高风险</el-tag>
              </div>
              <span class="log-version">v{{ log.audienceVersion || 0 }}</span>
            </div>

            <div v-if="log.affectedCount" class="log-stats">
              <span v-if="log.affectedCount">影响 {{ log.affectedCount }} 人</span>
              <span v-if="log.validCount">有效 {{ log.validCount }}</span>
              <span v-if="log.excludedRiskCount" class="warn">排除风险 {{ log.excludedRiskCount }}</span>
              <span v-if="log.excludedBlockedCount" class="warn">排除封禁 {{ log.excludedBlockedCount }}</span>
              <span v-if="log.excludedInvalidCount" class="warn">剔除无效 {{ log.excludedInvalidCount }}</span>
            </div>

            <div v-if="log.interceptionReason" class="log-reason danger">
              <el-icon><WarningFilled /></el-icon>
              拦截原因：{{ log.interceptionReason }}
            </div>

            <div v-if="log.diffFields?.length" class="log-diff">
              <div class="diff-title">规则变更（{{ log.diffFields.length }}项）</div>
              <div class="diff-list">
                <div v-for="(d, i) in log.diffFields" :key="i" class="diff-row">
                  <span class="diff-field">{{ d.field }}</span>
                  <span class="diff-before">{{ formatDiff(d.before) }}</span>
                  <el-icon color="#909399"><ArrowRight /></el-icon>
                  <span class="diff-after">{{ formatDiff(d.after) }}</span>
                </div>
              </div>
            </div>

            <div v-if="log.validateResult && Object.keys(log.validateResult).length" class="log-validate">
              <div class="validate-title">
                校验结果
                <el-tag
                  v-if="log.validateResult.errors?.length"
                  size="small"
                  type="danger"
                >{{ log.validateResult.errors.length }}个错误</el-tag>
                <el-tag
                  v-if="log.validateResult.warnings?.length"
                  size="small"
                  type="warning"
                >{{ log.validateResult.warnings.length }}个警告</el-tag>
                <el-tag
                  v-if="log.validateResult.passed?.length"
                  size="small"
                  type="success"
                >{{ log.validateResult.passed.length }}项通过</el-tag>
              </div>
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>

      <el-empty v-if="!logList.length" description="暂无操作记录" />
    </div>

    <div v-if="activeTab === 'intercept'" class="intercept-panel">
      <div class="intercept-summary">
        <div class="summary-card risk">
          <el-icon><Warning /></el-icon>
          <div>
            <h4>{{ riskStats.riskExcluded }}</h4>
            <span>高风险用户拦截</span>
          </div>
        </div>
        <div class="summary-card blocked">
          <el-icon><CircleClose /></el-icon>
          <div>
            <h4>{{ riskStats.blockedExcluded }}</h4>
            <span>封禁用户拦截</span>
          </div>
        </div>
        <div class="summary-card invalid">
          <el-icon><UserFilled /></el-icon>
          <div>
            <h4>{{ riskStats.invalidParticipations }}</h4>
            <span>非定向用户拦截</span>
          </div>
        </div>
        <div class="summary-card fraud">
          <el-icon><WarningFilled /></el-icon>
          <div>
            <h4>{{ riskStats.fraudDetected }}</h4>
            <span>恶意刷活动拦截</span>
          </div>
        </div>
      </div>

      <el-table :data="interceptList" border stripe>
        <el-table-column prop="phone" label="手机号" width="140" />
        <el-table-column prop="actionLabel" label="拦截类型" width="120">
          <template #default="{ row }">
            <el-tag :type="row.riskType" size="small" effect="dark">{{ row.actionLabel }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="拦截原因" />
        <el-table-column prop="userLevel" label="等级" width="80" />
        <el-table-column prop="createdAt" label="时间" width="170" />
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  DataLine, List, WarningFilled, Search, ArrowRight,
  Warning, CircleClose, UserFilled
} from '@element-plus/icons-vue'
import {
  getAudienceLogsApi,
  getAudienceRiskStatsApi
} from '@/api/marketing'
import {
  AudienceActionMap,
  AudienceActionColorMap
} from '@/types/marketing'
import type { AudienceLog } from '@/types/marketing'

const props = defineProps<{
  campaignId: number;
}>()

const activeTab = ref<'stats' | 'logs' | 'intercept'>('logs')
const filterAction = ref('')
const filterKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const logList = ref<AudienceLog[]>([])
const riskStats = ref<any>({
  riskExcluded: 0,
  blockedExcluded: 0,
  invalidParticipations: 0,
  fraudDetected: 0,
  totalAudienceOps: 0
})
const interceptList = ref<any[]>([])

const tabs = computed(() => [
  { key: 'stats' as const, label: '定向统计', icon: 'DataLine', count: 0 },
  { key: 'logs' as const, label: '操作日志', icon: 'List', count: 0 },
  { key: 'intercept' as const, label: '拦截记录', icon: 'WarningFilled', count: riskStats.value.fraudDetected || 0 }
])

const actionMap = AudienceActionMap
const actionColorMap = AudienceActionColorMap
const actionOptions = computed(() =>
  Object.keys(actionMap).map(k => ({ value: k, label: (actionMap as any)[k] }))
)

const summaryStats = computed(() => [
  {
    label: '人群定向总操作',
    value: riskStats.value.totalAudienceOps || 0,
    sub: '次',
    gradient: 'linear-gradient(135deg, #667eea, #764ba2)'
  },
  {
    label: '规则预览次数',
    value: riskStats.value.previewCount || 0,
    sub: '次',
    gradient: 'linear-gradient(135deg, #409eff, #66b1ff)'
  },
  {
    label: '累计拦截用户',
    value: (riskStats.value.riskExcluded || 0) + (riskStats.value.blockedExcluded || 0),
    sub: '人',
    gradient: 'linear-gradient(135deg, #f093fb, #f5576c)'
  },
  {
    label: '恶意刷活动拦截',
    value: riskStats.value.fraudDetected || 0,
    sub: '次',
    gradient: 'linear-gradient(135deg, #ff6b6b, #ee5a6f)'
  }
])

const chartData = ref<{
  intercept: { date: string; label: string; risk: number; invalid: number; fraud: number; riskRatio: number; invalidRatio: number; fraudRatio: number }[];
}>({ intercept: [] })

const actionDist = computed(() => [
  { action: 'preview', actionLabel: '人群预览', count: riskStats.value.previewCount || 0, color: '#409eff', pct: 35 },
  { action: 'rule_update', actionLabel: '规则变更', count: riskStats.value.ruleChangeCount || 0, color: '#e6a23c', pct: 25 },
  { action: 'fraud', actionLabel: '风控拦截', count: riskStats.value.fraudCount || 0, color: '#f56c6c', pct: 15 },
  { action: 'import', actionLabel: '批量导入', count: 4, color: '#67c23a', pct: 15 },
  { action: 'exclude', actionLabel: '批量剔除', count: 3, color: '#909399', pct: 10 }
])

const generateMockIntercept = () => {
  const mockTypes = [
    { action: 'invalid_participation', actionLabel: '非定向参与', riskType: 'warning', reason: '不符合活动人群标签条件', userLevel: '普通' },
    { action: 'fraud', actionLabel: '恶意刷活动', riskType: 'danger', reason: '检测到异常行为模式（IP/设备聚集）', userLevel: '普通' },
    { action: 'invalid_participation', actionLabel: '风险用户', riskType: 'danger', reason: '风控等级≥4级，自动拦截', userLevel: '普通' },
    { action: 'invalid_participation', actionLabel: '封禁账号', riskType: 'danger', reason: '账号已被封禁，自动拦截', userLevel: '银卡' },
    { action: 'invalid_participation', actionLabel: '排除名单', riskType: 'warning', reason: '用户在排除名单中', userLevel: '普通' }
  ]
  return Array.from({ length: 8 }, (_, i) => {
    const t = mockTypes[i % mockTypes.length]
    return {
      phone: `138${String(10000000 + i * 137).slice(0, 8)}`,
      ...t,
      createdAt: new Date(Date.now() - i * 3600 * 1000 * 3).toLocaleString()
    }
  })
}

const generateMockChart = () => {
  const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  const max = 100
  chartData.value.intercept = days.map((d, i) => {
    const risk = Math.floor(Math.random() * 30 + 10)
    const invalid = Math.floor(Math.random() * 50 + 20)
    const fraud = Math.floor(Math.random() * 15 + 5)
    return {
      date: `day-${i}`,
      label: d,
      risk,
      invalid,
      fraud,
      riskRatio: (risk / max) * 100,
      invalidRatio: (invalid / max) * 100,
      fraudRatio: (fraud / max) * 100
    }
  })
}

const formatDiff = (v: any) => {
  if (v === null || v === undefined) return '—'
  if (Array.isArray(v)) return `[${v.length}项]`
  if (typeof v === 'object') return JSON.stringify(v).slice(0, 30)
  return String(v)
}

const loadLogs = async () => {
  try {
    const res = await getAudienceLogsApi(props.campaignId, {
      page: currentPage.value,
      pageSize: pageSize.value,
      action: filterAction.value,
      keyword: filterKeyword.value
    } as any)
    const d: any = res.data
    logList.value = d.list || []
    total.value = d.total || 0
  } catch (e) {}
}

const loadStats = async () => {
  try {
    const res = await getAudienceRiskStatsApi({ campaignId: props.campaignId })
    Object.assign(riskStats.value, res.data || {})
  } catch (e) {}
}

onMounted(() => {
  loadLogs()
  loadStats()
  interceptList.value = generateMockIntercept()
  generateMockChart()
})
</script>

<style lang="scss" scoped>
.audience-audit-trace {
  .tab-switcher {
    display: flex;
    gap: 4px;
    margin-bottom: 20px;
    background: #f5f7fa;
    padding: 4px;
    border-radius: 10px;

    .tab-item {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 10px 14px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 13px;
      color: #606266;
      transition: all 0.2s;

      &.active {
        background: #fff;
        color: #409eff;
        font-weight: 600;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      }
    }
  }

  .stats-panel {
    .stat-cards {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 14px;
      margin-bottom: 20px;

      .stat-card {
        color: #fff;
        border-radius: 12px;
        padding: 18px 20px;

        h5 {
          margin: 0 0 6px 0;
          font-size: 13px;
          font-weight: 500;
          opacity: 0.9;
        }
        h3 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
        }
        span {
          font-size: 12px;
          opacity: 0.85;
        }
      }
    }

    .charts-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;

      .chart-card {
        background: #fff;
        border: 1px solid #ebeef5;
        border-radius: 12px;
        padding: 18px;

        h4 {
          margin: 0 0 16px 0;
          font-size: 14px;
          font-weight: 600;
          color: #303133;
        }

        .bars {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          height: 160px;
          padding: 0 10px;

          .bar-col {
            display: flex;
            flex-direction: column;
            align-items: center;
            flex: 1;

            .bar-wrap {
              width: 28px;
              height: 140px;
              display: flex;
              flex-direction: column-reverse;
              gap: 2px;
              background: #f5f7fa;
              border-radius: 4px;
              overflow: hidden;

              .bar-fill {
                width: 100%;
                transition: height 0.4s;

                &.risk { background: #f56c6c; }
                &.invalid { background: #e6a23c; }
                &.fraud { background: #909399; }
              }
            }

            span {
              margin-top: 6px;
              font-size: 11px;
              color: #909399;
            }
          }
        }

        .bar-legend {
          margin-top: 14px;
          display: flex;
          justify-content: center;
          gap: 16px;
          font-size: 12px;
          color: #606266;

          .dot {
            display: inline-block;
            width: 10px;
            height: 10px;
            border-radius: 3px;
            margin-right: 4px;
            vertical-align: middle;

            &.risk { background: #f56c6c; }
            &.invalid { background: #e6a23c; }
            &.fraud { background: #909399; }
          }
        }
      }
    }
  }

  .logs-panel {
    .log-filters {
      display: flex;
      gap: 10px;
      margin-bottom: 16px;
      align-items: center;

      .log-pagination {
        margin-left: auto;
      }
    }

    .log-card {
      border-radius: 10px;

      .log-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;

        .log-title {
          display: flex;
          align-items: center;
          gap: 10px;

          .log-operator {
            font-size: 13px;
            font-weight: 600;
            color: #303133;
          }
          .log-target {
            font-size: 12px;
            color: #606266;
          }
        }

        .log-version {
          font-size: 12px;
          color: #909399;
          font-family: monospace;
        }
      }

      .log-stats {
        display: flex;
        gap: 14px;
        margin-bottom: 8px;
        font-size: 12px;
        color: #606266;

        .warn { color: #e6a23c; }
      }

      .log-reason {
        padding: 8px 12px;
        background: #fef0f0;
        border-radius: 6px;
        color: #f56c6c;
        font-size: 13px;
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        gap: 6px;

        &.danger { color: #f56c6c; }
      }

      .log-diff {
        background: #f5f7fa;
        border-radius: 8px;
        padding: 12px;
        margin-top: 8px;

        .diff-title {
          font-size: 12px;
          font-weight: 600;
          color: #606266;
          margin-bottom: 8px;
        }

        .diff-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 0;
          font-size: 12px;

          .diff-field {
            font-family: monospace;
            color: #409eff;
            min-width: 130px;
          }
          .diff-before { color: #f56c6c; }
          .diff-after { color: #67c23a; }
        }
      }

      .log-validate {
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px dashed #ebeef5;

        .validate-title {
          font-size: 12px;
          color: #606266;
          display: flex;
          align-items: center;
          gap: 8px;
        }
      }
    }
  }

  .intercept-panel {
    .intercept-summary {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 14px;
      margin-bottom: 18px;

      .summary-card {
        background: #fff;
        border: 1px solid #ebeef5;
        border-radius: 12px;
        padding: 16px;
        display: flex;
        align-items: center;
        gap: 12px;

        .el-icon {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          color: #fff;
        }

        &.risk .el-icon { background: linear-gradient(135deg, #f56c6c, #f78989); }
        &.blocked .el-icon { background: linear-gradient(135deg, #909399, #b1b3b8); }
        &.invalid .el-icon { background: linear-gradient(135deg, #e6a23c, #f0c78a); }
        &.fraud .el-icon { background: linear-gradient(135deg, #ff6b6b, #ee5a6f); }

        h4 {
          margin: 0 0 2px 0;
          font-size: 22px;
          font-weight: 700;
          color: #303133;
        }
        span {
          font-size: 12px;
          color: #909399;
        }
      }
    }
  }
}
</style>
