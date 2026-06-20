<template>
  <Teleport to="body">
    <Transition name="dialog-scale">
      <el-dialog
        v-model="innerVisible"
        title="推送全链路数据分析"
        :width="1000"
        destroy-on-close
        top="6vh"
        @closed="handleClosed"
      >
        <div v-if="loading" class="chain-skeleton">
          <el-skeleton :rows="10" animated />
        </div>

        <div v-else-if="chainData" class="chain-dialog">
          <div class="task-overview">
            <div class="task-basic">
              <div class="task-main">
                <div class="task-title-row">
                  <span class="task-no">{{ chainData.task.taskNo }}</span>
                  <el-tag
                    :type="CONTENT_PUSH_STATUS_TAG_TYPES[chainData.task.pushStatus]"
                    effect="light"
                    size="small"
                  >
                    {{ CONTENT_PUSH_STATUS_NAMES[chainData.task.pushStatus] }}
                  </el-tag>
                </div>
                <el-tooltip :content="chainData.task.noteTitle" placement="top" effect="dark">
                  <div class="note-title">{{ chainData.task.noteTitle }}</div>
                </el-tooltip>
                <div class="task-meta">
                  <span>作者：{{ chainData.task.authorName }}</span>
                  <span class="dot">·</span>
                  <span>流量池：{{ chainData.task.poolName }}</span>
                  <span class="dot">·</span>
                  <span>力度：{{ CONTENT_PUSH_STRENGTH_NAMES[chainData.task.pushStrength] }}</span>
                </div>
              </div>
              <div class="task-metrics">
                <div class="metric-card match">
                  <div class="metric-label">综合匹配度</div>
                  <div class="metric-value">{{ Number(chainData.task.matchScore).toFixed(1) }}</div>
                  <div class="metric-sub">
                    标签{{ chainData.task.tagMatchScore }} · 兴趣{{ chainData.task.interestMatchScore }} · 画像{{ chainData.task.profileMatchScore }}
                  </div>
                </div>
                <div class="metric-card exposure">
                  <div class="metric-label">累计曝光</div>
                  <div class="metric-value number-format">{{ formatNumber(chainData.task.currentExposure) }}</div>
                  <div class="metric-sub">真实曝光 {{ formatNumber(chainData.task.realExposure) }}</div>
                </div>
                <div class="metric-card click">
                  <div class="metric-label">点击 / 点击率</div>
                  <div class="metric-value number-format">
                    {{ formatNumber(chainData.task.clickCount) }}
                    <span class="metric-unit">
                      / {{ chainData.task.currentExposure > 0 ? (chainData.task.clickCount / chainData.task.currentExposure * 100).toFixed(2) : '0.00' }}%
                    </span>
                  </div>
                  <div class="metric-sub">
                    点赞{{ formatNumber(chainData.task.likeCount) }} · 评论{{ formatNumber(chainData.task.commentCount) }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <el-divider>数据真实性校验</el-divider>

          <div class="validation-section">
            <div class="valid-row">
              <div class="valid-item coverage">
                <div class="valid-label">
                  <el-icon><View /></el-icon>
                  曝光有效性
                </div>
                <div class="valid-main">
                  <div class="valid-nums">
                    <span class="num valid">{{ formatNumber(chainData.coverage.valid) }}</span>
                    <span class="num-split">/</span>
                    <span class="num total">{{ formatNumber(chainData.coverage.delivered) }}</span>
                  </div>
                  <el-progress
                    :percentage="chainData.coverage.validRate"
                    :color="getValidColor(chainData.coverage.validRate)"
                    :stroke-width="12"
                  />
                  <div class="valid-sub">
                    无效曝光：<strong :class="{ bad: chainData.coverage.invalid > 0 }">
                      {{ formatNumber(chainData.coverage.invalid) }}
                    </strong>
                    <span class="status-tag" :class="getValidStatus(chainData.coverage.validRate)">
                      {{ getValidStatusText(chainData.coverage.validRate) }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="valid-item accuracy">
                <div class="valid-label">
                  <el-icon><Aim /></el-icon>
                  触达精准度
                </div>
                <div class="valid-main">
                  <div class="accuracy-score" :style="{ '--score': chainData.reachAccuracy.score + '%' }">
                    <div class="score-inner">
                      <div class="score-value">{{ chainData.reachAccuracy.score }}</div>
                      <div class="score-label">精准度指数</div>
                    </div>
                  </div>
                  <div class="valid-sub">
                    <div>匹配度基础：<strong>{{ chainData.reachAccuracy.matchScore }}</strong></div>
                    <div>曝光清洗加成：<strong>{{ Math.max(0, chainData.reachAccuracy.score - Number(chainData.reachAccuracy.matchScore) * 0.2).toFixed(1) }}</strong></div>
                    <span class="status-tag" :class="getAccuracyStatus(chainData.reachAccuracy.score)">
                      {{ getAccuracyStatusText(chainData.reachAccuracy.score) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="chainData.anomalyList.length > 0" class="anomaly-section">
              <div class="anomaly-header">
                <el-icon color="#f56c6c" :size="16"><WarningFilled /></el-icon>
                <span>检测到 <strong>{{ chainData.anomalyList.length }}</strong> 条异常事件</span>
              </div>
              <el-table
                :data="chainData.anomalyList"
                max-height="200"
                size="small"
                stripe
              >
                <el-table-column label="时间" width="170">
                  <template #default="{ row }">
                    {{ formatDateTime(row.createTime) }}
                  </template>
                </el-table-column>
                <el-table-column label="事件类型" width="120">
                  <template #default="{ row }">
                    {{ PUSH_TRACE_EVENT_TYPE_NAMES[row.eventType] || row.eventType }}
                  </template>
                </el-table-column>
                <el-table-column label="异常类型" width="130">
                  <template #default="{ row }">
                    <el-tag v-if="row.anomalyType" type="danger" effect="light" size="small">
                      {{ PUSH_TRACE_ANOMALY_TYPE_NAMES[row.anomalyType] || row.anomalyType }}
                    </el-tag>
                    <span v-else class="muted">-</span>
                  </template>
                </el-table-column>
                <el-table-column label="异常分" width="90" align="center">
                  <template #default="{ row }">
                    <span
                      class="anomaly-score"
                      :class="{
                        high: (row.anomalyScore || 0) >= 80,
                        mid: (row.anomalyScore || 0) >= 50 && (row.anomalyScore || 0) < 80
                      }"
                    >{{ row.anomalyScore || 0 }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="详情" min-width="200" show-overflow-tooltip>
                  <template #default="{ row }">
                    <span>{{ row.anomalyDetail || row.eventDetail }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="处理" width="80" align="center">
                  <template #default="{ row }">
                    <el-tag v-if="row.isBlocked" type="danger" effect="dark" size="small">已拦截</el-tag>
                    <el-tag v-else type="warning" effect="light" size="small">待处理</el-tag>
                  </template>
                </el-table-column>
              </el-table>
            </div>
            <div v-else class="no-anomaly">
              <el-icon color="#67c23a" :size="18"><CircleCheckFilled /></el-icon>
              暂无异常事件，推送链路数据真实可靠
            </div>
          </div>

          <el-divider>事件时间轴</el-divider>

          <div class="timeline-section">
            <div class="timeline-stats">
              共 <strong>{{ chainData.eventTimeline.length }}</strong> 条链路事件
              <span class="legend-group">
                <span class="legend">
                  <i class="dot green"></i>有效事件
                </span>
                <span class="legend">
                  <i class="dot red"></i>异常/拦截
                </span>
                <span class="legend">
                  <i class="dot blue"></i>状态变更
                </span>
              </span>
            </div>
            <div class="timeline-wrapper">
              <el-timeline>
                <el-timeline-item
                  v-for="(evt, idx) in chainData.eventTimeline.slice().reverse().slice(0, 50)"
                  :key="evt.id"
                  :timestamp="formatDateTime(evt.createTime)"
                  placement="top"
                  :type="getTimelineType(evt)"
                  :color="getTimelineColor(evt)"
                  :icon="getTimelineIcon(evt)"
                  :size="evt.isBlocked ? 'large' : 'normal'"
                >
                  <div class="tl-item" :class="{ blocked: evt.isBlocked, anomaly: evt.anomalyType }">
                    <div class="tl-header">
                      <span class="tl-type">
                        {{ PUSH_TRACE_EVENT_TYPE_NAMES[evt.eventType] || evt.eventType }}
                      </span>
                      <el-tooltip v-if="evt.traceId" :content="evt.traceId" placement="top">
                        <span class="tl-id">#{{ idx + 1 }}</span>
                      </el-tooltip>
                    </div>
                    <el-tooltip
                      v-if="evt.eventDetail"
                      :content="evt.eventDetail"
                      placement="top"
                      effect="dark"
                    >
                      <div class="tl-detail">{{ evt.eventDetail }}</div>
                    </el-tooltip>
                    <div v-else class="tl-detail muted">无详情说明</div>
                    <div v-if="(evt.exposureAmount || 0) > 0 || (evt.clickAmount || 0) > 0 || (evt.interactAmount || 0) > 0" class="tl-stats">
                      <span v-if="evt.exposureAmount" class="tl-stat">
                        曝光 <strong class="number-format">{{ formatNumber(evt.exposureAmount) }}</strong>
                      </span>
                      <span v-if="evt.clickAmount" class="tl-stat">
                        点击 <strong class="number-format">{{ formatNumber(evt.clickAmount) }}</strong>
                      </span>
                      <span v-if="evt.interactAmount" class="tl-stat">
                        互动 <strong class="number-format">{{ formatNumber(evt.interactAmount) }}</strong>
                      </span>
                      <span v-if="evt.anomalyScore" class="tl-stat anomaly">
                        异常分 <strong>{{ evt.anomalyScore }}</strong>
                      </span>
                    </div>
                    <div v-if="evt.ipAddress || evt.operatorName" class="tl-meta">
                      <span v-if="evt.operatorName">操作人：{{ evt.operatorName }}</span>
                      <span v-if="evt.ipAddress">IP：{{ evt.ipAddress }}</span>
                    </div>
                  </div>
                </el-timeline-item>
              </el-timeline>
              <div v-if="chainData.eventTimeline.length > 50" class="tl-more-tip">
                仅展示最近 50 条，全量数据可通过导出功能获取
              </div>
            </div>
          </div>
        </div>

        <template #footer>
          <el-button @click="innerVisible = false">关闭</el-button>
          <el-button
            type="primary"
            :icon="Refresh"
            :loading="loading"
            @click="fetchChain"
          >
            刷新数据
          </el-button>
        </template>
      </el-dialog>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  CircleCheckFilled, WarningFilled, View, Aim, Refresh
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { formatDateTime, formatNumber } from '@hooks/index'
import { getContentPushFullChain } from '@api/content-push'
import type {
  PushFullChainResult,
  ContentPushTrace
} from '@/types/business'
import {
  CONTENT_PUSH_STATUS_NAMES,
  CONTENT_PUSH_STATUS_TAG_TYPES,
  CONTENT_PUSH_STRENGTH_NAMES,
  PUSH_TRACE_EVENT_TYPE_NAMES,
  PUSH_TRACE_EVENT_TYPE_COLORS,
  PUSH_TRACE_ANOMALY_TYPE_NAMES
} from '@/enums/business'

const props = defineProps<{
  modelValue: boolean
  taskId: number | null
}>()

const emit = defineEmits<{
  'update:modelValue': [val: boolean]
}>()

const innerVisible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const loading = ref(false)
const chainData = ref<PushFullChainResult | null>(null)

const fetchChain = async () => {
  if (!props.taskId) return
  loading.value = true
  try {
    chainData.value = await getContentPushFullChain(props.taskId)
  } catch (e: any) {
    ElMessage.error(e?.message || '加载链路数据失败')
  } finally {
    loading.value = false
  }
}

watch(() => props.modelValue, (v) => {
  if (v && props.taskId) fetchChain()
})

const handleClosed = () => {
  chainData.value = null
}

const getValidColor = (rate: number) => {
  if (rate >= 85) return '#67c23a'
  if (rate >= 60) return '#e6a23c'
  return '#f56c6c'
}
const getValidStatus = (rate: number) => {
  if (rate >= 85) return 'good'
  if (rate >= 60) return 'warn'
  return 'bad'
}
const getValidStatusText = (rate: number) => {
  if (rate >= 85) return '优秀'
  if (rate >= 60) return '合格'
  return '异常'
}
const getAccuracyStatus = (score: number) => {
  if (score >= 80) return 'good'
  if (score >= 60) return 'warn'
  return 'bad'
}
const getAccuracyStatusText = (score: number) => {
  if (score >= 80) return '高精准'
  if (score >= 60) return '良好'
  return '需优化'
}

const getTimelineType = (evt: ContentPushTrace) => {
  if (evt.isBlocked === 1 || (evt.anomalyScore || 0) >= 80) return 'danger'
  if (evt.anomalyType) return 'warning'
  return 'primary'
}
const getTimelineColor = (evt: ContentPushTrace) => {
  return PUSH_TRACE_EVENT_TYPE_COLORS[evt.eventType] || '#909399'
}
const getTimelineIcon = (evt: ContentPushTrace) => {
  if (evt.isBlocked) return WarningFilled
  return undefined
}
</script>

<style lang="scss" scoped>
.dialog-scale-enter-active,
.dialog-scale-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.dialog-scale-enter-from,
.dialog-scale-leave-to {
  opacity: 0;
  transform: scale(0.85);
}

.chain-dialog {
  .task-overview {
    .task-basic {
      display: flex;
      gap: 24px;

      .task-main {
        flex: 1;

        .task-title-row {
          display: flex;
          gap: 10px;
          align-items: center;
          margin-bottom: 8px;

          .task-no {
            font-family: 'Consolas', monospace;
            font-weight: 700;
            color: #409eff;
            font-size: 16px;
          }
        }

        .note-title {
          font-size: 15px;
          font-weight: 600;
          color: $text-primary;
          margin-bottom: 8px;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
        }

        .task-meta {
          font-size: 13px;
          color: $text-secondary;
          display: flex;
          gap: 8px;
          align-items: center;
          .dot { color: $border-color-dark; }
        }
      }

      .task-metrics {
        display: flex;
        gap: 12px;
        width: 460px;

        .metric-card {
          flex: 1;
          padding: 12px 14px;
          border-radius: 8px;
          text-align: center;

          .metric-label {
            font-size: 11px;
            color: $text-secondary;
            margin-bottom: 4px;
          }
          .metric-value {
            font-size: 20px;
            font-weight: 700;
            font-family: 'DIN', monospace;
            line-height: 1.2;
            margin-bottom: 4px;
            .metric-unit {
              font-size: 13px;
              font-weight: 500;
              color: $text-secondary;
            }
          }
          .metric-sub {
            font-size: 11px;
            color: $text-secondary;
          }

          &.match {
            background: linear-gradient(135deg, rgba(64,158,255,0.08), rgba(103,194,58,0.08));
            .metric-value { color: #409eff; }
          }
          &.exposure {
            background: linear-gradient(135deg, rgba(103,194,58,0.08), rgba(230,162,60,0.08));
            .metric-value { color: #67c23a; }
          }
          &.click {
            background: linear-gradient(135deg, rgba(230,162,60,0.08), rgba(245,108,108,0.08));
            .metric-value { color: #e6a23c; }
          }
        }
      }
    }
  }

  .validation-section {
    .valid-row {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 20px;
      margin-bottom: 16px;
    }

    .valid-item {
      padding: 16px;
      background: #fafbfc;
      border-radius: 8px;

      .valid-label {
        display: flex;
        align-items: center;
        gap: 6px;
        font-weight: 600;
        color: $text-primary;
        margin-bottom: 12px;
        font-size: 13px;
      }

      &.coverage {
        .valid-nums {
          margin-bottom: 8px;
          font-family: 'DIN', monospace;
          .num {
            font-size: 22px;
            font-weight: 700;
            &.valid { color: #67c23a; }
            &.total { color: $text-primary; }
          }
          .num-split { margin: 0 6px; color: $text-placeholder; }
        }
        .valid-sub {
          margin-top: 10px;
          font-size: 12px;
          color: $text-secondary;
          strong.bad { color: #f56c6c; }
        }
      }

      &.accuracy {
        .valid-main {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .accuracy-score {
          --score: 0%;
          width: 90px;
          height: 90px;
          border-radius: 50%;
          background: conic-gradient(#409eff var(--score), rgba(64,158,255,0.1) 0);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;

          .score-inner {
            width: 72px;
            height: 72px;
            border-radius: 50%;
            background: #fafbfc;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;

            .score-value {
              font-size: 22px;
              font-weight: 700;
              font-family: 'DIN', monospace;
              color: #409eff;
              line-height: 1;
            }
            .score-label {
              font-size: 10px;
              color: $text-secondary;
              margin-top: 2px;
            }
          }
        }

        .valid-sub {
          font-size: 12px;
          color: $text-secondary;
          line-height: 1.8;
          flex: 1;
          strong { color: $text-primary; }
        }
      }
    }

    .status-tag {
      display: inline-block;
      padding: 1px 10px;
      border-radius: 10px;
      font-size: 11px;
      margin-left: 8px;

      &.good {
        background: rgba(103,194,58,0.15);
        color: #67c23a;
      }
      &.warn {
        background: rgba(230,162,60,0.15);
        color: #e6a23c;
      }
      &.bad {
        background: rgba(245,108,108,0.15);
        color: #f56c6c;
      }
    }

    .anomaly-section {
      padding: 14px;
      background: rgba(245, 108, 108, 0.06);
      border: 1px solid rgba(245, 108, 108, 0.15);
      border-radius: 8px;

      .anomaly-header {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 12px;
        font-size: 13px;
        color: #f56c6c;
        font-weight: 500;
        strong { color: #f56c6c; font-size: 14px; }
      }

      .anomaly-score {
        font-family: 'DIN', monospace;
        font-weight: 700;

        &.high { color: #f56c6c; }
        &.mid { color: #e6a23c; }
      }
    }

    .no-anomaly {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 24px;
      color: #67c23a;
      font-size: 13px;
      background: rgba(103, 194, 58, 0.06);
      border-radius: 8px;
    }
  }

  .timeline-section {
    .timeline-stats {
      font-size: 13px;
      color: $text-primary;
      margin-bottom: 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      strong { color: #409eff; font-size: 14px; }

      .legend-group {
        display: flex;
        gap: 14px;
        font-size: 12px;
        color: $text-secondary;

        .legend {
          display: flex;
          align-items: center;
          gap: 4px;

          .dot {
            width: 8px; height: 8px; border-radius: 50%;
            &.green { background: #67c23a; }
            &.red { background: #f56c6c; }
            &.blue { background: #409eff; }
          }
        }
      }
    }

    .timeline-wrapper {
      max-height: 420px;
      overflow-y: auto;
      padding-right: 8px;

      .tl-item {
        padding: 8px 12px;
        border-radius: 6px;
        background: #fff;
        border: 1px solid $border-color-lighter;

        &.blocked {
          background: rgba(245,108,108,0.06);
          border-color: rgba(245,108,108,0.25);
        }
        &.anomaly {
          background: rgba(230,162,60,0.05);
        }

        .tl-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;

          .tl-type {
            font-weight: 600;
            color: $text-primary;
            font-size: 13px;
          }
          .tl-id {
            font-family: 'Consolas', monospace;
            font-size: 11px;
            color: $text-secondary;
          }
        }

        .tl-detail {
          font-size: 12px;
          color: $text-secondary;
          line-height: 1.5;
          margin-bottom: 4px;

          &.muted { color: $text-placeholder; }
        }

        .tl-stats {
          display: flex;
          gap: 14px;
          font-size: 11px;
          color: $text-secondary;
          padding-top: 4px;
          border-top: 1px dashed $border-color-lighter;

          .tl-stat {
            strong { color: $text-primary; }
            &.anomaly {
              color: #f56c6c;
              strong { color: #f56c6c; }
            }
          }
        }

        .tl-meta {
          margin-top: 4px;
          font-size: 10px;
          color: $text-placeholder;
          display: flex;
          gap: 12px;
        }
      }

      .tl-more-tip {
        text-align: center;
        font-size: 12px;
        color: $text-placeholder;
        padding: 12px;
        border-top: 1px dashed $border-color-lighter;
        margin-top: 8px;
      }
    }
  }

  .muted {
    color: $text-placeholder;
  }

  .number-format {
    font-family: 'DIN', monospace;
  }
}

.chain-skeleton {
  padding: 20px 0;
}
</style>
