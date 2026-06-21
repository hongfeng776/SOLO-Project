<template>
  <Teleport to="body">
    <Transition name="dialog-fade">
      <el-dialog
        v-model="innerVisible"
        title="规则影响分析"
        width="780px"
        :close-on-click-modal="false"
        destroy-on-close
        @open="loadData"
      >
        <div v-if="loading" class="loading-wrap">
          <el-skeleton :rows="8" animated />
        </div>

        <div v-else-if="data" class="analysis-content">
          <div class="overview-section">
            <div class="overview-card rule">
              <div class="card-label">规则</div>
              <div class="card-value">{{ data.rule.ruleName }}</div>
              <div class="card-sub">
                <span class="muted mono">{{ data.rule.ruleCode }}</span>
                <el-tag
                  size="small"
                  effect="light"
                  :color="WEIGHT_RULE_STATUS_COLORS[data.rule.status]"
                  style="color: #fff"
                >
                  {{ WEIGHT_RULE_STATUS_NAMES[data.rule.status] }}
                </el-tag>
              </div>
            </div>
            <div class="overview-card success">
              <div class="card-label">成功操作</div>
              <div class="card-value green">{{ data.successCount }}</div>
              <div class="card-sub muted">累计日志 {{ data.totalLogs }} 条</div>
            </div>
            <div class="overview-card blocked">
              <div class="card-label">拦截操作</div>
              <div class="card-value red">{{ data.blockedCount }}</div>
              <div class="card-sub muted">公平性校验自动拦截</div>
            </div>
          </div>

          <el-divider content-position="left">多维权重配比</el-divider>
          <div class="weights-display">
            <div
              v-for="(dim, key) in weightDims"
              :key="key"
              class="weight-dim"
            >
              <div class="dim-head">
                <span class="dot" :style="{ background: dim.color }"></span>
                <span class="name">{{ dim.name }}</span>
                <span class="val">{{ (data.rule as any)[dim.field] }}%</span>
              </div>
              <el-progress
                :percentage="(data.rule as any)[dim.field]"
                :color="dim.color"
                :stroke-width="10"
                :show-text="false"
              />
            </div>
          </div>

          <el-divider content-position="left">拦截原因分布</el-divider>
          <div class="block-reasons">
            <template v-if="Object.keys(data.blockReasons).length">
              <div
                v-for="(count, code) in data.blockReasons"
                :key="code"
                class="reason-row"
              >
                <el-tag type="danger" effect="dark" size="small">
                  {{ WEIGHT_RULE_BLOCK_REASON_NAMES[code as string] || code }}
                </el-tag>
                <div class="bar-wrap">
                  <div class="bar">
                    <div
                      class="bar-inner"
                      :style="{ width: getReasonPercent(count as number) + '%' }"
                    ></div>
                  </div>
                  <span class="bar-num">{{ count }} 次</span>
                </div>
              </div>
            </template>
            <el-empty v-else description="暂无拦截记录" :image-size="80" />
          </div>

          <el-divider content-position="left">最近 20 条操作日志</el-divider>
          <div class="recent-logs">
            <el-table
              :data="data.recentLogs"
              border
              size="small"
              max-height="320"
              height="320"
              class="logs-table fixed-header-table"
            >
              <el-table-column label="时间" width="160" fixed="left">
                <template #default="{ row }">
                  <span class="mono">{{ formatDateTime(row.createTime) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="类型" width="110">
                <template #default="{ row }">
                  <span class="log-type">{{ WEIGHT_RULE_LOG_TYPE_NAMES[row.logType] || row.logType }}</span>
                </template>
              </el-table-column>
              <el-table-column label="状态" width="100" align="center">
                <template #default="{ row }">
                  <el-tag
                    size="small"
                    effect="light"
                    :color="WEIGHT_RULE_LOG_STATUS_COLORS[row.status]"
                    style="color: #fff"
                  >
                    {{ WEIGHT_RULE_LOG_STATUS_NAMES[row.status] }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="详情" min-width="260" show-overflow-tooltip>
                <template #default="{ row }">
                  <template v-if="row.status === 2">
                    <span class="danger">
                      拦截：{{ WEIGHT_RULE_BLOCK_REASON_NAMES[row.blockReason || ''] || row.blockReason }}
                    </span>
                    <span class="muted"> - {{ row.blockDetail }}</span>
                  </template>
                  <template v-else-if="row.estimatedImpact">
                    {{ row.estimatedImpact }}
                  </template>
                  <span v-else class="muted">
                    {{ row.changedFields || row.reason || '操作成功' }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column label="操作人" width="110" fixed="right">
                <template #default="{ row }">
                  {{ row.operatorName || '系统' }}
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>

        <template #footer>
          <el-button @click="innerVisible = false">关闭</el-button>
          <el-button type="primary" :icon="Refresh" @click="loadData">刷新数据</el-button>
        </template>
      </el-dialog>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { formatDateTime } from '@hooks/index'
import { getTrafficWeightRuleImpact } from '@api/traffic-weight-rule'
import type { WeightRuleImpactAnalysis } from '@/types/business'
import {
  WEIGHT_RULE_STATUS_NAMES,
  WEIGHT_RULE_STATUS_COLORS,
  WEIGHT_RULE_LOG_TYPE_NAMES,
  WEIGHT_RULE_LOG_STATUS_NAMES,
  WEIGHT_RULE_LOG_STATUS_COLORS,
  WEIGHT_RULE_BLOCK_REASON_NAMES,
  WEIGHT_DIMENSION_NAMES,
  WEIGHT_DIMENSION_COLORS
} from '@/enums/business'

const props = defineProps<{
  modelValue: boolean
  ruleId: number | null
}>()

const emit = defineEmits<{
  'update:modelValue': [val: boolean]
}>()

const innerVisible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const weightDims = {
  content_quality: { name: WEIGHT_DIMENSION_NAMES.content_quality, color: WEIGHT_DIMENSION_COLORS.content_quality, field: 'contentQualityWeight' },
  user_activity: { name: WEIGHT_DIMENSION_NAMES.user_activity, color: WEIGHT_DIMENSION_COLORS.user_activity, field: 'userActivityWeight' },
  interaction: { name: WEIGHT_DIMENSION_NAMES.interaction, color: WEIGHT_DIMENSION_COLORS.interaction, field: 'interactionWeight' },
  compliance: { name: WEIGHT_DIMENSION_NAMES.compliance, color: WEIGHT_DIMENSION_COLORS.compliance, field: 'complianceWeight' }
}

const loading = ref(false)
const data = ref<WeightRuleImpactAnalysis | null>(null)

const getReasonPercent = (count: number) => {
  if (!data.value) return 0
  const maxV = Math.max(...Object.values(data.value.blockReasons), 1)
  return Math.round((count / maxV) * 100)
}

const loadData = async () => {
  if (!props.ruleId) return
  loading.value = true
  try {
    const r = await getTrafficWeightRuleImpact(props.ruleId)
    data.value = r as any
  } catch (e: any) {
    ElMessage.error(e?.message || '加载失败')
  } finally {
    loading.value = false
  }
}

watch(() => props.ruleId, () => {
  if (innerVisible.value) loadData()
})
</script>

<style lang="scss" scoped>
.loading-wrap {
  padding: 20px;
}
.analysis-content {
  .overview-section {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr;
    gap: 12px;
    margin-bottom: 6px;

    .overview-card {
      padding: 14px 16px;
      border-radius: 6px;
      background: linear-gradient(135deg, #fbfcfe 0%, #f5f7fb 100%);
      border: 1px solid $border-color;
      position: relative;

      .card-label {
        font-size: 12px;
        color: $text-secondary;
        margin-bottom: 6px;
      }
      .card-value {
        font-family: 'DIN', monospace;
        font-size: 22px;
        font-weight: 700;
        color: $text-primary;
        &.green { color: #67c23a; }
        &.red { color: #f56c6c; }
      }
      .card-sub {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 6px;
        font-size: 12px;
      }

      &.rule { background: linear-gradient(135deg, #eaf4ff 0%, #f5f9ff 100%); }
      &.success { background: linear-gradient(135deg, #ecf9ef 0%, #f5fbf6 100%); }
      &.blocked { background: linear-gradient(135deg, #feecec 0%, #fdf3f3 100%); }
    }
  }

  .weights-display {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 14px 32px;

    .weight-dim {
      .dim-head {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 4px;
        .dot { width: 8px; height: 8px; border-radius: 50%; }
        .name { font-size: 13px; font-weight: 500; color: $text-primary; }
        .val {
          margin-left: auto;
          font-family: 'DIN', monospace;
          font-weight: 700;
          color: $text-primary;
        }
      }
    }
  }

  .block-reasons {
    padding: 4px 0;
    .reason-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 10px;

      .bar-wrap {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 8px;
        .bar {
          flex: 1;
          height: 8px;
          background: $border-color-light;
          border-radius: 4px;
          overflow: hidden;
          .bar-inner {
            height: 100%;
            background: linear-gradient(90deg, #f56c6c, #e6a23c);
            border-radius: 4px;
            transition: width 0.4s ease;
          }
        }
        .bar-num {
          font-family: 'DIN', monospace;
          font-weight: 600;
          color: $text-secondary;
          width: 56px;
          text-align: right;
        }
      }
    }
  }

  .recent-logs {
    .logs-table {
      :deep(.el-table th.el-table__cell) {
        position: sticky;
        top: 0;
        z-index: 2;
        background: #fafafa !important;
        font-weight: 600;
      }
      .mono { font-family: 'Consolas', monospace; font-size: 12px; color: $text-secondary; }
      .log-type {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 3px;
        background: rgba(64, 158, 255, 0.1);
        color: $primary-color;
        font-size: 12px;
        font-weight: 500;
      }
      .danger { color: #f56c6c; font-weight: 600; }
      .muted { color: $text-secondary; }
    }
  }
}
.muted { color: $text-placeholder; }
.mono { font-family: 'Consolas', monospace; }
</style>
