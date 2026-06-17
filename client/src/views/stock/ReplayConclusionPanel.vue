<template>
  <div class="replay-conclusion-panel">
    <el-row :gutter="16">
      <el-col :span="8">
        <div class="volatility-pattern-card">
          <div class="card-header">
            <span class="card-title">波动规律匹配</span>
            <el-tag
              :class="patternBadgeClass"
              size="small"
            >
              {{ patternLabel }}
            </el-tag>
          </div>

          <div v-if="volatilityLoading" class="card-loading">
            <el-skeleton :rows="3" animated />
          </div>
          <template v-else-if="volatilityData">
            <div class="pattern-similarity">
              <el-progress
                type="dashboard"
                :percentage="volatilityData.similarity"
                :color="similarityColor"
                :width="100"
              >
                <template #default="{ percentage }">
                  <span class="similarity-value">{{ percentage }}%</span>
                  <span class="similarity-label">相似度</span>
                </template>
              </el-progress>
            </div>

            <div class="pattern-reference">
              <span class="label">参照历史时期：</span>
              <span class="value">{{ volatilityData.referencePeriod }}</span>
            </div>

            <el-descriptions :column="1" size="small" border class="pattern-metrics">
              <el-descriptions-item label="平均涨跌幅">
                <span :style="{ color: volatilityData.avgChangeRate >= 0 ? '#F56C6C' : '#67C23A' }">
                  {{ formatPercentValue(volatilityData.avgChangeRate) }}
                </span>
              </el-descriptions-item>
              <el-descriptions-item label="波动率指数">
                {{ volatilityData.volatilityIndex.toFixed(2) }}
              </el-descriptions-item>
              <el-descriptions-item label="最大回撤">
                <span style="color: #F56C6C">{{ volatilityData.maxDrawdown.toFixed(2) }}%</span>
              </el-descriptions-item>
            </el-descriptions>
          </template>
          <el-empty v-else description="暂无波动数据" :image-size="60" />
        </div>
      </el-col>

      <el-col :span="8">
        <div class="completeness-card">
          <div class="card-header">
            <span class="card-title">数据完整性校验</span>
            <el-tag
              v-if="completenessData"
              :type="completenessData.isComplete ? 'success' : 'danger'"
              size="small"
            >
              {{ completenessData.isComplete ? '✓ 完整' : '✗ 不完整' }}
            </el-tag>
          </div>

          <div v-if="completenessLoading" class="card-loading">
            <el-skeleton :rows="3" animated />
          </div>
          <template v-else-if="completenessData">
            <div class="completeness-score">
              <el-progress
                type="circle"
                :percentage="completenessData.score"
                :color="completenessColor"
                :width="100"
              >
                <template #default="{ percentage }">
                  <span class="score-value">{{ percentage }}%</span>
                  <span class="score-label">完整度</span>
                </template>
              </el-progress>
            </div>

            <div class="completeness-stats">
              <span>交易日：{{ completenessData.totalTradingDays }}天</span>
              <span>可用：{{ completenessData.availableDays }}天</span>
            </div>

            <div v-if="!completenessData.isComplete && completenessData.missingDates.length > 0" class="missing-dates">
              <span class="label">缺失日期：</span>
              <span
                v-for="(date, idx) in completenessData.missingDates.slice(0, 5)"
                :key="idx"
                class="missing-date-tag"
              >
                {{ date }}
              </span>
              <el-popover
                v-if="completenessData.missingDates.length > 5"
                placement="bottom"
                :width="260"
                trigger="hover"
              >
                <template #reference>
                  <el-tag size="small" type="info" class="more-dates-tag">
                    +{{ completenessData.missingDates.length - 5 }}天
                  </el-tag>
                </template>
                <div class="missing-dates-popover">
                  <div
                    v-for="(date, idx) in completenessData.missingDates"
                    :key="idx"
                    class="missing-date-item"
                  >
                    {{ date }}
                  </div>
                </div>
              </el-popover>
            </div>

            <el-alert
              v-if="completenessData.score < 60"
              type="error"
              title="关键时段数据缺失，复盘结论可能不准确，建议补充数据后再分析"
              show-icon
              :closable="false"
              class="completeness-alert"
            />
          </template>
          <el-empty v-else description="暂无完整性数据" :image-size="60" />
        </div>
      </el-col>

      <el-col :span="8">
        <div class="volatility-pattern-card sector-compare-card">
          <div class="card-header">
            <span class="card-title">行业对比结论</span>
          </div>

          <div v-if="sectorLoading" class="card-loading">
            <el-skeleton :rows="5" animated />
          </div>
          <template v-else-if="sectorData.length > 0">
            <div class="sector-compare-list">
              <div
                v-for="item in sectorData"
                :key="item.stockCode"
                class="sector-compare-row"
                :class="{ 'sector-compare-current': item.stockCode === stockCode }"
              >
                <span class="rank-num">{{ item.rank }}</span>
                <span class="stock-name">{{ item.stockName }}</span>
                <div class="bar-wrapper">
                  <div
                    class="sector-compare-bar"
                    :style="{
                      width: barWidth(item.avgChangeRate),
                      backgroundColor: item.avgChangeRate >= 0 ? 'rgba(245,108,108,0.7)' : 'rgba(103,194,58,0.7)'
                    }"
                  />
                </div>
                <span class="change-rate" :style="{ color: item.avgChangeRate >= 0 ? '#F56C6C' : '#67C23A' }">
                  {{ formatPercentValue(item.avgChangeRate) }}
                </span>
                <span class="volatility-index">波动{{ item.volatilityIndex.toFixed(1) }}</span>
              </div>
            </div>
          </template>
          <el-empty v-else description="暂无行业对比数据" :image-size="60" />
        </div>
      </el-col>
    </el-row>

    <div class="conclusion-bottom">
      <div class="suggestion-area">
        <span class="label">操作建议：</span>
        <el-tooltip v-if="suggestionText" :content="suggestionText" placement="top">
          <span class="text-ellipsis">{{ suggestionText }}</span>
        </el-tooltip>
        <span v-else class="no-suggestion">暂无建议</span>
      </div>
      <el-button type="primary" :loading="generating" @click="handleGenerateReport">
        生成完整复盘报告
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getVolatilityPattern,
  checkDataCompleteness,
  getSectorComparison,
  createReplaySession,
  generateConclusion,
} from '@/api/replay'
import type {
  IVolatilityPattern,
  IDataCompleteness,
  ISectorComparison,
} from '@/types/api'

const props = defineProps<{
  stockCode: string
  stockName: string
  startDate: string
  endDate: string
  sector: string
}>()

const volatilityLoading = ref(false)
const completenessLoading = ref(false)
const sectorLoading = ref(false)
const generating = ref(false)

const volatilityData = ref<IVolatilityPattern | null>(null)
const completenessData = ref<IDataCompleteness | null>(null)
const sectorData = ref<ISectorComparison[]>([])

const patternBadgeClass = computed(() => {
  if (!volatilityData.value) return ''
  const map: Record<string, string> = {
    stable: 'pattern-badge-stable',
    upward: 'pattern-badge-upward',
    volatile: 'pattern-badge-volatile',
    downward: 'pattern-badge-downward',
  }
  return map[volatilityData.value.pattern] || 'pattern-badge-stable'
})

const patternLabel = computed(() => {
  if (!volatilityData.value) return '--'
  const map: Record<string, string> = {
    stable: '稳定波动',
    upward: '震荡上行',
    volatile: '剧烈波动',
    downward: '持续下行',
  }
  return map[volatilityData.value.pattern] || volatilityData.value.pattern
})

const similarityColor = computed(() => {
  const s = volatilityData.value?.similarity ?? 0
  if (s >= 80) return '#67C23A'
  if (s >= 50) return '#E6A23C'
  return '#F56C6C'
})

const completenessColor = computed(() => {
  const s = completenessData.value?.score ?? 0
  if (s >= 85) return '#67C23A'
  if (s >= 60) return '#E6A23C'
  return '#F56C6C'
})

const suggestionText = computed(() => {
  if (!volatilityData.value) return ''
  const pattern = volatilityData.value.pattern
  const suggestions: Record<string, string> = {
    stable: '该股票波动较为稳定，可考虑中长期持有策略，注意设置止损位防范突发事件风险',
    upward: '该股票呈震荡上行趋势，建议关注关键支撑位，适时加仓但需控制仓位比例',
    volatile: '该股票波动剧烈，建议降低仓位、严格止损，短线操作为主，避免追涨杀跌',
    downward: '该股票呈持续下行趋势，建议暂避或轻仓观望，等待企稳信号再考虑介入',
  }
  return suggestions[pattern] || ''
})

function formatPercentValue(value: number): string {
  if (value >= 0) return `+${value.toFixed(2)}%`
  return `${value.toFixed(2)}%`
}

function barWidth(avgChangeRate: number): string {
  const maxAbs = Math.max(
    ...sectorData.value.map(s => Math.abs(s.avgChangeRate)),
    1,
  )
  const ratio = Math.abs(avgChangeRate) / maxAbs
  return `${Math.max(ratio * 100, 4)}%`
}

async function fetchVolatilityPattern() {
  volatilityLoading.value = true
  try {
    const res = await getVolatilityPattern(props.stockCode, props.startDate, props.endDate)
    volatilityData.value = res.data
  } catch (error) {
    console.error('获取波动规律失败:', error)
    volatilityData.value = null
  } finally {
    volatilityLoading.value = false
  }
}

async function fetchCompleteness() {
  completenessLoading.value = true
  try {
    const res = await checkDataCompleteness(props.stockCode, props.startDate, props.endDate)
    completenessData.value = res.data
  } catch (error) {
    console.error('获取完整性校验失败:', error)
    completenessData.value = null
  } finally {
    completenessLoading.value = false
  }
}

async function fetchSectorComparison() {
  sectorLoading.value = true
  try {
    const res = await getSectorComparison(props.sector, props.startDate, props.endDate)
    sectorData.value = (res.data || []).sort((a: ISectorComparison, b: ISectorComparison) => a.rank - b.rank)
  } catch (error) {
    console.error('获取行业对比失败:', error)
    sectorData.value = []
  } finally {
    sectorLoading.value = false
  }
}

async function handleGenerateReport() {
  generating.value = true
  try {
    const sessionRes = await createReplaySession({
      sessionName: `${props.stockName}复盘-${props.startDate}~${props.endDate}`,
      startDate: props.startDate,
      endDate: props.endDate,
      sector: props.sector,
      stockCode: props.stockCode,
    })
    const sessionId = sessionRes.data.id
    await generateConclusion(sessionId)
    ElMessage.success('复盘报告已生成')
  } catch (error) {
    console.error('生成报告失败:', error)
    ElMessage.error('生成报告失败，请稍后重试')
  } finally {
    generating.value = false
  }
}

onMounted(() => {
  Promise.all([
    fetchVolatilityPattern(),
    fetchCompleteness(),
    fetchSectorComparison(),
  ])
})
</script>

<style lang="scss" scoped>
.replay-conclusion-panel {
  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;

    .card-title {
      font-size: 15px;
      font-weight: 600;
      color: #1f2d3d;
    }
  }

  .card-loading {
    padding: 10px 0;
  }

  .pattern-similarity,
  .completeness-score {
    display: flex;
    justify-content: center;
    margin-bottom: 12px;

    .similarity-value,
    .score-value {
      font-size: 18px;
      font-weight: 700;
      display: block;
      text-align: center;
    }

    .similarity-label,
    .score-label {
      font-size: 12px;
      color: #909399;
      display: block;
      text-align: center;
    }
  }

  .pattern-reference {
    font-size: 13px;
    color: #606266;
    margin-bottom: 12px;

    .label {
      color: #909399;
    }

    .value {
      font-weight: 500;
    }
  }

  .pattern-metrics {
    margin-top: 8px;
  }

  .completeness-stats {
    display: flex;
    justify-content: center;
    gap: 16px;
    font-size: 13px;
    color: #606266;
    margin-bottom: 12px;
  }

  .missing-dates {
    font-size: 13px;
    margin-bottom: 12px;

    .label {
      color: #909399;
    }

    .missing-date-tag {
      display: inline-block;
      background: #fef0f0;
      color: #f56c6c;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 12px;
      margin: 2px 4px;
    }

    .more-dates-tag {
      cursor: pointer;
    }
  }

  .missing-dates-popover {
    max-height: 200px;
    overflow-y: auto;

    .missing-date-item {
      padding: 4px 0;
      font-size: 12px;
      color: #606266;
      border-bottom: 1px solid #f0f0f0;

      &:last-child {
        border-bottom: none;
      }
    }
  }

  .completeness-alert {
    margin-top: 8px;
  }

  .sector-compare-list {
    .sector-compare-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 8px;
      border-radius: 4px;
      margin-bottom: 4px;
      font-size: 13px;

      .rank-num {
        width: 22px;
        height: 22px;
        line-height: 22px;
        text-align: center;
        background: #f0f2f5;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 600;
        color: #606266;
        flex-shrink: 0;
      }

      .stock-name {
        width: 70px;
        flex-shrink: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .bar-wrapper {
        flex: 1;
        height: 24px;
        background: #f5f7fa;
        border-radius: 4px;
        overflow: hidden;
        min-width: 60px;
      }

      .change-rate {
        width: 70px;
        text-align: right;
        flex-shrink: 0;
        font-variant-numeric: tabular-nums;
      }

      .volatility-index {
        width: 55px;
        text-align: right;
        flex-shrink: 0;
        color: #909399;
        font-size: 12px;
      }
    }
  }

  .conclusion-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #ebeef5;

    .suggestion-area {
      display: flex;
      align-items: center;
      font-size: 14px;

      .label {
        color: #909399;
        flex-shrink: 0;
        margin-right: 4px;
      }

      .no-suggestion {
        color: #c0c4cc;
      }
    }
  }
}
</style>
