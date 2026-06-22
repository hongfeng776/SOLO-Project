<template>
  <div class="redemption-audit-trace">
    <div v-if="loading" class="skeleton-wrap">
      <el-skeleton :rows="3" animated />
      <el-skeleton :rows="5" animated style="margin-top: 16px" />
      <el-skeleton :rows="4" animated style="margin-top: 16px" />
    </div>

    <template v-else-if="traceData">
      <div class="record-info-card">
        <div class="info-header">
          <div class="info-badge" :style="{ background: sceneGradient }">
            <el-icon><Tickets /></el-icon>
          </div>
          <div class="info-main">
            <h3>{{ traceData.record.campaignName }}</h3>
            <p>记录ID：{{ traceData.record.id }}</p>
          </div>
          <el-tag
            :type="RedemptionStatusTagType[traceData.record.status]"
            effect="dark"
          >
            {{ RedemptionStatusMap[traceData.record.status] }}
          </el-tag>
        </div>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">用户ID</span>
            <span class="info-value">{{ traceData.record.userId }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">手机号</span>
            <span class="info-value">{{ traceData.record.userPhone || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">订单ID</span>
            <span class="info-value">{{ traceData.record.orderId || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">核销码</span>
            <span class="info-value">{{ traceData.record.redemptionCode || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">使用场景</span>
            <span class="info-value">
              <el-tag
                v-if="traceData.record.scene"
                size="small"
                :type="sceneTagType"
              >
                {{ CampaignSceneMap[traceData.record.scene] }}
              </el-tag>
              <span v-else>-</span>
            </span>
          </div>
          <div class="info-item">
            <span class="info-label">城市</span>
            <span class="info-value">{{ traceData.record.city || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">车型</span>
            <span class="info-value">{{ traceData.record.vehicleType || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">核销金额</span>
            <span class="info-value amount">¥{{ traceData.record.redemptionAmount?.toFixed(2) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">订单金额</span>
            <span class="info-value amount">¥{{ traceData.record.orderAmount?.toFixed(2) }}</span>
          </div>
        </div>
      </div>

      <div class="violation-alert">
        <el-alert
          v-if="traceData.isViolated"
          :title="traceData.violationLabel"
          type="error"
          show-icon
          :closable="false"
        />
        <el-alert
          v-else
          title="无违规记录"
          type="success"
          show-icon
          :closable="false"
        />
      </div>

      <div class="score-and-checks">
        <div class="score-section">
          <div class="score-ring" :class="scoreLevel">
            <svg viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="#ebeef5" stroke-width="8" />
              <circle
                cx="60" cy="60" r="52" fill="none"
                :stroke="scoreColor"
                stroke-width="8"
                stroke-linecap="round"
                :stroke-dasharray="scoreDash"
                stroke-dashoffset="0"
                transform="rotate(-90 60 60)"
                class="score-arc"
              />
            </svg>
            <div class="score-text">
              <span class="score-num">{{ traceData.complianceScore }}</span>
              <span class="score-total">/ 100</span>
            </div>
          </div>
          <div class="score-label">合规评分</div>
        </div>

        <div class="checks-section">
          <h4 class="section-title">
            <el-icon color="#409eff"><CircleCheck /></el-icon>
            合规校验明细
          </h4>
          <div class="checks-grid">
            <div
              v-for="check in traceData.complianceChecks"
              :key="check.type"
              class="check-card"
              :class="check.passed ? 'passed' : 'failed'"
            >
              <div class="check-header">
                <span class="check-name">{{ ComplianceCheckTypeMap[check.type] || check.name }}</span>
                <el-tag
                  size="small"
                  :type="check.passed ? 'success' : 'danger'"
                  effect="dark"
                >
                  <el-icon v-if="check.passed"><CircleCheck /></el-icon>
                  <el-icon v-else><CircleClose /></el-icon>
                  {{ check.passed ? '通过' : '未通过' }}
                </el-tag>
              </div>
              <p class="check-message">{{ check.message }}</p>
              <div class="check-detail">
                <el-icon><InfoFilled /></el-icon>
                <span>{{ check.detail }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="timeline-section">
        <h4 class="section-title">
          <el-icon color="#e6a23c"><Clock /></el-icon>
          核销溯源时间线
        </h4>
        <el-timeline class="trace-timeline">
          <el-timeline-item
            v-for="(item, idx) in traceData.timeline"
            :key="idx"
            :timestamp="formatDate(item.time)"
            :color="item.color"
            size="large"
          >
            <div class="timeline-card" :style="{ borderLeftColor: item.color }">
              <div class="timeline-header">
                <div class="action-area">
                  <div class="action-icon" :style="{ background: item.color }">
                    <el-icon><component :is="getIcon(item.icon)" /></el-icon>
                  </div>
                  <div class="action-info">
                    <h4>{{ item.action }}</h4>
                    <p>{{ item.detail }}</p>
                  </div>
                </div>
              </div>
              <div v-if="item.checks && item.checks.length" class="timeline-checks">
                <div class="checks-label">关联校验</div>
                <div
                  v-for="(c, ci) in item.checks"
                  :key="ci"
                  class="check-row"
                  :class="c.passed ? 'pass' : 'fail'"
                >
                  <el-icon v-if="c.passed"><CircleCheck /></el-icon>
                  <el-icon v-else><CircleClose /></el-icon>
                  <span class="check-name">{{ ComplianceCheckTypeMap[c.type] || c.name }}</span>
                  <span class="check-msg">{{ c.message }}</span>
                </div>
              </div>
            </div>
          </el-timeline-item>
        </el-timeline>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Tickets,
  CircleCheck,
  CircleClose,
  InfoFilled,
  Clock,
  User,
  Document,
  Warning,
  Position,
  Phone,
  Van,
  Money,
  Timer,
  Stamp,
  Finished,
  Refresh
} from '@element-plus/icons-vue'
import { getRedemptionTraceApi } from '@/api/marketing'
import {
  CampaignSceneMap,
  ComplianceCheckTypeMap,
  ComplianceCheckWeightMap,
  ViolationTypeMap,
  ViolationTypeTagType,
  RedemptionStatusMap,
  RedemptionStatusTagType
} from '@/enums/marketing'
import type { TraceResult, TraceTimeline, ComplianceCheckItem } from '@/types/marketing'
import { formatDate } from '@/utils/format'

const props = defineProps<{
  recordId: number
}>()

const loading = ref(false)
const traceData = ref<TraceResult | null>(null)

const iconMap: Record<string, any> = {
  User,
  Document,
  Warning,
  Position,
  Phone,
  Van,
  Money,
  Timer,
  Stamp,
  Finished,
  Refresh,
  Tickets,
  CircleCheck,
  CircleClose
}

const getIcon = (iconName: string) => {
  return iconMap[iconName] || Document
}

const scoreLevel = computed(() => {
  const s = traceData.value?.complianceScore ?? 0
  if (s >= 80) return 'high'
  if (s >= 60) return 'medium'
  return 'low'
})

const scoreColor = computed(() => {
  const s = traceData.value?.complianceScore ?? 0
  if (s >= 80) return '#67c23a'
  if (s >= 60) return '#e6a23c'
  return '#f56c6c'
})

const scoreDash = computed(() => {
  const score = traceData.value?.complianceScore ?? 0
  const circumference = 2 * Math.PI * 52
  const filled = (score / 100) * circumference
  return `${filled} ${circumference - filled}`
})

const sceneGradient = computed(() => {
  const scene = traceData.value?.record?.scene
  const gradients: Record<number, string> = {
    1: 'linear-gradient(135deg, #67c23a 0%, #85ce61 100%)',
    2: 'linear-gradient(135deg, #e6a23c 0%, #f0c78a 100%)',
    3: 'linear-gradient(135deg, #409eff 0%, #66b1ff 100%)',
    4: 'linear-gradient(135deg, #909399 0%, #a6a9ad 100%)'
  }
  return gradients[scene ?? 0] || gradients[1]
})

const sceneTagType = computed(() => {
  const map: Record<number, string> = { 1: 'success', 2: 'warning', 3: '', 4: 'info' }
  return map[traceData.value?.record?.scene ?? 0] || ''
})

const loadTrace = async () => {
  loading.value = true
  try {
    const res = await getRedemptionTraceApi(props.recordId)
    traceData.value = res.data as TraceResult
  } catch (e: any) {
    ElMessage.error(e.message || '加载溯源数据失败')
  } finally {
    loading.value = false
  }
}

onMounted(loadTrace)

watch(() => props.recordId, () => {
  loadTrace()
})
</script>

<style lang="scss" scoped>
.redemption-audit-trace {
  .skeleton-wrap {
    padding: 20px;
  }

  .record-info-card {
    background: #fff;
    border: 1px solid #ebeef5;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 16px;

    .info-header {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 18px;

      .info-badge {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-size: 22px;
        flex-shrink: 0;
      }

      .info-main {
        flex: 1;

        h3 {
          margin: 0 0 4px 0;
          font-size: 16px;
          font-weight: 600;
          color: #303133;
        }

        p {
          margin: 0;
          font-size: 13px;
          color: #909399;
        }
      }
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px 20px;

      .info-item {
        display: flex;
        flex-direction: column;
        gap: 4px;

        .info-label {
          font-size: 12px;
          color: #909399;
        }

        .info-value {
          font-size: 14px;
          font-weight: 500;
          color: #303133;

          &.amount {
            color: #f56c6c;
            font-weight: 600;
          }
        }
      }
    }
  }

  .violation-alert {
    margin-bottom: 16px;
  }

  .score-and-checks {
    display: grid;
    grid-template-columns: 200px 1fr;
    gap: 16px;
    margin-bottom: 16px;

    .score-section {
      background: #fff;
      border: 1px solid #ebeef5;
      border-radius: 12px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;

      .score-ring {
        position: relative;
        width: 120px;
        height: 120px;

        svg {
          width: 100%;
          height: 100%;
        }

        .score-arc {
          transition: stroke-dasharray 0.8s ease;
        }

        .score-text {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;

          .score-num {
            font-size: 32px;
            font-weight: 700;
            line-height: 1;
          }

          .score-total {
            font-size: 12px;
            color: #909399;
            margin-top: 2px;
          }
        }

        &.high .score-num {
          color: #67c23a;
        }

        &.medium .score-num {
          color: #e6a23c;
        }

        &.low .score-num {
          color: #f56c6c;
        }
      }

      .score-label {
        margin-top: 12px;
        font-size: 13px;
        color: #606266;
        font-weight: 500;
      }
    }

    .checks-section {
      background: #fff;
      border: 1px solid #ebeef5;
      border-radius: 12px;
      padding: 16px 20px;

      .section-title {
        display: flex;
        align-items: center;
        gap: 6px;
        margin: 0 0 14px 0;
        font-size: 14px;
        font-weight: 600;
        color: #303133;
      }

      .checks-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;

        .check-card {
          border-radius: 8px;
          padding: 14px 16px;
          border: 1px solid #ebeef5;

          &.passed {
            border-color: #e1f3d8;
            background: linear-gradient(135deg, #f0f9eb 0%, #ffffff 100%);
          }

          &.failed {
            border-color: #fbc4c4;
            background: linear-gradient(135deg, #fef0f0 0%, #ffffff 100%);
          }

          .check-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 8px;

            .check-name {
              font-size: 13px;
              font-weight: 600;
              color: #303133;
            }

            .el-tag {
              .el-icon {
                margin-right: 2px;
              }
            }
          }

          .check-message {
            margin: 0 0 6px 0;
            font-size: 12px;
            color: #606266;
          }

          .check-detail {
            display: flex;
            align-items: flex-start;
            gap: 4px;
            font-size: 11px;
            color: #909399;

            .el-icon {
              font-size: 12px;
              margin-top: 1px;
              flex-shrink: 0;
            }
          }
        }
      }
    }
  }

  .timeline-section {
    background: #fff;
    border: 1px solid #ebeef5;
    border-radius: 12px;
    padding: 16px 20px;

    .section-title {
      display: flex;
      align-items: center;
      gap: 6px;
      margin: 0 0 16px 0;
      font-size: 14px;
      font-weight: 600;
      color: #303133;
    }

    .trace-timeline {
      :deep(.el-timeline-item__timestamp) {
        color: #909399;
        font-size: 12px;
      }

      :deep(.el-timeline-item__wrapper) {
        padding-left: 20px;
      }
    }

    .timeline-card {
      background: #f9fafc;
      border-radius: 8px;
      padding: 14px 16px;
      border-left: 4px solid #ebeef5;

      &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
      }

      .timeline-header {
        .action-area {
          display: flex;
          align-items: center;
          gap: 12px;

          .action-icon {
            width: 36px;
            height: 36px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            font-size: 16px;
            flex-shrink: 0;
          }

          .action-info {
            h4 {
              margin: 0 0 2px 0;
              font-size: 14px;
              font-weight: 600;
              color: #303133;
            }

            p {
              margin: 0;
              font-size: 12px;
              color: #606266;
            }
          }
        }
      }

      .timeline-checks {
        margin-top: 12px;
        padding: 10px 12px;
        background: rgba(255, 255, 255, 0.7);
        border-radius: 6px;

        .checks-label {
          font-size: 11px;
          font-weight: 600;
          color: #909399;
          margin-bottom: 8px;
          text-transform: uppercase;
        }

        .check-row {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 0;
          font-size: 12px;

          .el-icon {
            font-size: 14px;
          }

          .check-name {
            font-weight: 500;
            min-width: 90px;
          }

          .check-msg {
            color: #909399;
          }

          &.pass {
            color: #67c23a;
          }

          &.fail {
            color: #f56c6c;
          }
        }
      }
    }
  }
}
</style>
