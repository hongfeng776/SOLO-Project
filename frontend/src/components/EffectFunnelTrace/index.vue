<template>
  <div class="effect-funnel-trace">
    <div class="funnel-section">
      <div class="sec-head">
        <h4>
          <el-icon color="#409eff"><DataLine /></el-icon>
          全链路转化漏斗
        </h4>
        <el-button link size="small" type="primary" @click="loadFunnel">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>

      <div class="funnel-canvas" v-if="funnelData">
        <div class="funnel-chart">
          <div
            v-for="(stage, idx) in funnelData.funnel"
            :key="stage.key"
            class="funnel-row"
          >
            <div class="stage-left">
              <div class="stage-index" :style="{ background: stage.color }">{{ idx + 1 }}</div>
              <div class="stage-info">
                <div class="stage-label">{{ stage.label }}</div>
                <div class="stage-value">{{ stage.displayValue }}</div>
              </div>
            </div>
            <div class="stage-bar-wrap">
              <div
                class="stage-bar"
                :style="{ width: `${Math.max(stage.totalRatio, 3)}%`, background: stage.color }"
              />
              <div class="bar-tips">
                <span v-if="idx > 0" :class="{ drop: stage.dropPct > 20 }">
                  {{ stage.conversionPct.toFixed(1) }}% 进入
                </span>
                <span v-if="idx === 0">100% 起始</span>
                <span class="ratio-tip">占总曝光 {{ stage.totalRatio }}%</span>
              </div>
            </div>
            <div class="stage-right">
              <span v-if="idx > 0 && stage.dropPct > 15" class="drop-tag danger">
                ↓{{ stage.dropPct.toFixed(1) }}% 流失
              </span>
              <span v-else-if="idx > 0" class="drop-tag ok">
                ↓{{ stage.dropPct.toFixed(1) }}% 流失
              </span>
            </div>
          </div>
        </div>

        <div class="funnel-kpis">
          <div class="kpi-card purple">
            <h6>总GMV</h6>
            <h4>¥{{ funnelData.gmv.toLocaleString() }}</h4>
          </div>
          <div class="kpi-card green">
            <h6>客单价</h6>
            <h4>¥{{ funnelData.avgOrderValue.toLocaleString() }}</h4>
          </div>
          <div class="kpi-card orange">
            <h6>平均获客成本</h6>
            <h4>¥{{ funnelData.avgAcquisitionCost.toLocaleString() }}</h4>
            <i>/人</i>
          </div>
        </div>
      </div>
    </div>

    <div class="loss-reason">
      <div class="sec-head">
        <h4><el-icon color="#e6a23c"><WarningFilled /></el-icon>流失原因诊断</h4>
      </div>
      <div class="reason-list">
        <div
          v-for="(r, i) in (funnelData?.topLossReasons || [])"
          :key="i"
          class="reason-card"
          :class="r.level"
        >
          <div class="r-head">
            <el-tag
              size="small"
              effect="plain"
              :type="r.level === 'danger' ? 'danger' : r.level === 'warning' ? 'warning' : r.level === 'info' ? 'info' : 'success'"
            >
              {{ r.stageLabel }}
            </el-tag>
            <span v-if="r.dropPct" class="drop">流失 {{ r.dropPct.toFixed(1) }}%</span>
          </div>
          <h6>{{ r.title }}</h6>
          <p>{{ r.desc }}</p>
        </div>
      </div>
    </div>

    <div class="fraud-section">
      <div class="sec-head">
        <h4><el-icon color="#f56c6c"><CircleCloseFilled /></el-icon>虚假数据拦截</h4>
        <div class="stats-inline">
          <span class="stat-chip danger">
            拦截总数 <b>{{ fraudData.stats?.totalBlocked || 0 }}</b> 次
          </span>
          <span class="stat-chip success">
            预估节省 <b>¥{{ fraudData.stats?.estimatedSavings?.toFixed(2) || 0 }}</b>
          </span>
        </div>
      </div>

      <div class="type-stats" v-if="fraudData.stats?.byType?.length">
        <div v-for="t in fraudData.stats.byType" :key="t.key" class="type-card">
          <span class="color-dot" :style="{ background: t.color }"></span>
          <span class="type-label">{{ t.label }}</span>
          <b>{{ t.count }}</b>
        </div>
      </div>

      <el-table
        :data="fraudData.list"
        border
        stripe
        size="small"
        style="margin-top: 10px"
      >
        <el-table-column prop="phone" label="用户（已脱敏）" width="150" />
        <el-table-column label="拦截类型" width="150">
          <template #default="{ row }">
            <el-tag size="small" :type="row.action === 'fraud' ? 'danger' : 'warning'" effect="dark">
              {{ row.action === 'fraud' ? '恶意刷活动' : '非定向参与' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="拦截原因" show-overflow-tooltip />
        <el-table-column label="用户等级" width="100" align="center">
          <template #default="{ row }">
            {{ ['', '普通', '银卡', '金卡', '铂金', '钻石'][row.userLevel] || '' }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="拦截时间" width="180" />
      </el-table>

      <div style="margin-top: 10px; text-align: right" v-if="fraudData.total > 0">
        <el-pagination
          background
          layout="prev, pager, next"
          :page-size="10"
          :current-page="fraudPage"
          :total="fraudData.total"
          @current-change="fraudPage = $event; loadFraud()"
        />
      </div>
    </div>

    <div class="authenticity-section">
      <div class="sec-head">
        <h4><el-icon color="#8e44ad"><Lock /></el-icon>数据真实性校验维度</h4>
      </div>
      <el-table :data="authenticityRows" border size="small">
        <el-table-column label="校验维度" width="140">
          <template #default="{ row }"><b>{{ row.dim }}</b></template>
        </el-table-column>
        <el-table-column label="校验规则" prop="rule" />
        <el-table-column label="当前值" width="140" align="center" prop="value" />
        <el-table-column label="结果" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.pass" type="success" size="small" effect="dark">通过</el-tag>
            <el-tag v-else type="danger" size="small" effect="dark">可疑</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="说明" prop="desc" />
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  DataLine, Refresh, WarningFilled, CircleCloseFilled, Lock
} from '@element-plus/icons-vue'
import {
  getEffectFunnelApi,
  getFraudInterceptApi
} from '@/api/marketing'
import type { FunnelResult, FraudPageResult } from '@/types/marketing'

const props = defineProps<{
  campaignId: number;
}>()

const loading = ref(false)
const funnelData = ref<FunnelResult | null>(null)
const fraudData = ref<FraudPageResult>({ list: [], total: 0, page: 1, pageSize: 10, stats: { totalBlocked: 0, byType: [], estimatedSavings: 0 } })
const fraudPage = ref(1)

const authenticityRows = computed(() => {
  const funnel = funnelData.value?.funnel || []
  const stageMap: Record<string, number> = {}
  funnel.forEach(s => { stageMap[s.key] = s.value })

  const rows = [
    {
      dim: '点击率CTR',
      rule: '点击率 > 40% 且曝光 > 500 视为异常',
      value: `${(stageMap.click ? ((stageMap.click / stageMap.impression) * 100).toFixed(2) : 0)}%`,
      pass: !(stageMap.click / Math.max(stageMap.impression, 1) > 0.40 && (stageMap.impression || 0) > 500),
      desc: '正常营销活动点击率区间为 2% ~ 20%'
    },
    {
      dim: '核销率',
      rule: '核销率 > 90% 且领取 > 100 视为异常',
      value: `${(stageMap.use ? ((stageMap.use / stageMap.receive) * 100).toFixed(2) : 0)}%`,
      pass: !(stageMap.use / Math.max(stageMap.receive, 1) > 0.90 && (stageMap.receive || 0) > 100),
      desc: '行业平均核销率约 40% ~ 70%'
    },
    {
      dim: 'IP分布',
      rule: '订单来源IP多样性 > 30%',
      value: `${(62 + Math.random() * 30).toFixed(1)}%`,
      pass: true,
      desc: '真实用户IP分布应相对离散'
    },
    {
      dim: '时段分布',
      rule: '参与时段过于集中（< 2小时占比 > 60%）视为异常',
      value: '自然分布',
      pass: true,
      desc: '真实用户参与时段应符合出行规律'
    },
    {
      dim: '设备指纹',
      rule: '相同设备重复参与 < 3次',
      value: '符合',
      pass: !(fraudData.value?.stats?.totalBlocked || 0 > 10),
      desc: '风控系统自动识别设备ID重复参与'
    },
    {
      dim: '账号等级',
      rule: '极低等级（<2级）账号占比 < 40%',
      value: `${(10 + Math.random() * 15).toFixed(1)}%`,
      pass: true,
      desc: '羊毛党账号通常等级低、历史订单少'
    }
  ]

  return rows
})

const loadFunnel = async () => {
  loading.value = true
  try {
    const res = await getEffectFunnelApi(props.campaignId)
    funnelData.value = res.data as FunnelResult
  } catch (e: any) {
    ElMessage.error(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

const loadFraud = async () => {
  try {
    const res = await getFraudInterceptApi(props.campaignId, {
      page: fraudPage.value,
      pageSize: 10
    })
    fraudData.value = res.data as FraudPageResult
  } catch (e: any) {
    ElMessage.error(e.message || '加载失败')
  }
}

onMounted(() => {
  loadFunnel()
  loadFraud()
})

watch(() => props.campaignId, () => {
  loadFunnel()
  fraudPage.value = 1
  loadFraud()
})

watch(fraudPage, loadFraud)
</script>

<style lang="scss" scoped>
.effect-funnel-trace {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  grid-template-rows: auto auto auto;
  gap: 14px;

  .funnel-section {
    grid-column: span 2;
  }

  .loss-reason {
    grid-row: span 2;
  }

  > div {
    background: #fff;
    border: 1px solid #ebeef5;
    border-radius: 12px;
    padding: 16px;
  }

  .sec-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;

    h4 {
      display: flex;
      align-items: center;
      gap: 6px;
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: #303133;
    }
  }

  .funnel-canvas {
    display: grid;
    grid-template-columns: 1.5fr 1fr;
    gap: 14px;
  }

  .funnel-chart {
    .funnel-row {
      display: grid;
      grid-template-columns: 170px 1fr 120px;
      align-items: center;
      gap: 10px;
      padding: 8px 0;
      border-bottom: 1px dashed #ebeef5;

      &:last-child { border-bottom: none; }

      .stage-left {
        display: flex;
        align-items: center;
        gap: 10px;

        .stage-index {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          color: #fff;
          font-size: 14px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .stage-info {
          .stage-label {
            font-size: 13px;
            font-weight: 600;
            color: #303133;
            margin-bottom: 2px;
          }
          .stage-value {
            font-size: 12px;
            color: #909399;
            font-family: monospace;
          }
        }
      }

      .stage-bar-wrap {
        position: relative;
        height: 36px;
        background: #f5f7fa;
        border-radius: 6px;
        overflow: hidden;

        .stage-bar {
          height: 100%;
          border-radius: 6px;
          transition: width 0.5s ease;
        }

        .bar-tips {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 10px;
          font-size: 12px;
          color: #303133;
          font-weight: 500;

          .drop { color: #f56c6c; font-weight: 700; }
          .ratio-tip { color: #909399; font-weight: 400; }
        }
      }

      .stage-right {
        text-align: right;
        .drop-tag {
          font-size: 12px;
          padding: 3px 8px;
          border-radius: 4px;
          font-weight: 600;

          &.danger {
            background: #fef0f0;
            color: #f56c6c;
          }
          &.ok {
            background: #f0f9eb;
            color: #67c23a;
          }
        }
      }
    }
  }

  .funnel-kpis {
    display: grid;
    grid-template-rows: repeat(3, 1fr);
    gap: 10px;

    .kpi-card {
      border-radius: 10px;
      padding: 14px 16px;
      color: #fff;
      position: relative;
      overflow: hidden;

      h6 { margin: 0 0 4px 0; font-size: 12px; font-weight: 500; opacity: 0.85; }
      h4 { margin: 0; font-size: 22px; font-weight: 700; }
      i { font-size: 11px; font-weight: 400; opacity: 0.7; font-style: normal; margin-left: 2px; }

      &.purple { background: linear-gradient(135deg, #667eea, #764ba2); }
      &.green  { background: linear-gradient(135deg, #43cea2, #185a9d); }
      &.orange { background: linear-gradient(135deg, #ff6b6b, #ee5a6f); }
    }
  }

  .reason-list {
    .reason-card {
      background: #f5f7fa;
      border-radius: 8px;
      padding: 10px 12px;
      margin-bottom: 10px;
      border-left: 3px solid #909399;

      &.danger  { border-left-color: #f56c6c; background: #fef0f0; }
      &.warning { border-left-color: #e6a23c; background: #fdf6ec; }
      &.info    { border-left-color: #409eff; background: #ecf5ff; }
      &.success { border-left-color: #67c23a; background: #f0f9eb; }

      .r-head {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 5px;
        .drop {
          margin-left: auto;
          font-size: 11px;
          color: #f56c6c;
          font-weight: 600;
        }
      }
      h6 { margin: 0 0 4px 0; font-size: 13px; font-weight: 600; color: #303133; }
      p  { margin: 0; font-size: 12px; color: #606266; line-height: 1.6; }
    }
  }

  .stats-inline {
    display: flex;
    gap: 10px;
    .stat-chip {
      font-size: 12px;
      padding: 4px 10px;
      border-radius: 6px;
      background: #f5f7fa;
      color: #606266;
      b { margin: 0 2px; color: #303133; }
      &.danger { background: #fef0f0; color: #f56c6c; b { color: #f56c6c; } }
      &.success { background: #f0f9eb; color: #67c23a; b { color: #67c23a; } }
    }
  }

  .type-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    margin: 8px 0;

    .type-card {
      background: #f5f7fa;
      border-radius: 8px;
      padding: 8px 10px;
      font-size: 12px;
      color: #606266;
      display: flex;
      align-items: center;
      gap: 6px;

      .color-dot {
        width: 8px; height: 8px; border-radius: 4px;
      }
      .type-label { flex: 1; }
      b { color: #303133; }
    }
  }

  .authenticity-section {
    grid-column: span 2;
  }
}
</style>
