<template>
  <Teleport to="body">
    <Transition name="dialog-scale">
      <el-dialog
        v-model="innerVisible"
        title="配置变更分析"
        :width="800"
        destroy-on-close
        @closed="handleClosed"
      >
        <div v-if="loading" class="loading-wrapper">
          <el-icon class="is-loading" :size="32"><Loading /></el-icon>
          <span class="loading-text">加载中...</span>
        </div>

        <div v-else-if="analyzeData" class="analyze-content">
          <div class="basic-info">
            <div class="info-row">
              <div class="info-item">
                <span class="info-label">流量池</span>
                <span class="info-value">{{ analyzeData.log.poolName }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">操作类型</span>
                <el-tag size="small" effect="light">
                  {{ TRAFFIC_POOL_LOG_TYPE_NAMES[analyzeData.log.logType] || analyzeData.log.logType }}
                </el-tag>
              </div>
              <div class="info-item">
                <span class="info-label">执行状态</span>
                <el-tag
                  size="small"
                  :type="TRAFFIC_POOL_LOG_STATUS_TAG_TYPES[analyzeData.log.status]"
                  effect="light"
                >
                  {{ TRAFFIC_POOL_LOG_STATUS_NAMES[analyzeData.log.status] }}
                </el-tag>
              </div>
            </div>
            <div class="info-row">
              <div class="info-item">
                <span class="info-label">操作人</span>
                <span class="info-value">{{ analyzeData.log.operatorName || '系统' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">操作角色</span>
                <span class="info-value">{{ analyzeData.log.operatorRole || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">操作时间</span>
                <span class="info-value">{{ formatDateTime(analyzeData.log.createTime) }}</span>
              </div>
            </div>
          </div>

          <el-divider />

          <div class="change-impact">
            <div class="section-title">变更影响分析</div>
            <div class="impact-stats">
              <div class="impact-card">
                <div class="impact-label">影响内容数</div>
                <div class="impact-value number-format">
                  {{ formatNumber(analyzeData.log.affectedContentCount) }}
                </div>
              </div>
              <div
                v-if="analyzeData.diff.oldDailyQuota !== undefined && analyzeData.diff.newDailyQuota !== undefined"
                class="impact-card"
              >
                <div class="impact-label">配额变化</div>
                <div class="impact-value quota-change">
                  <span class="number-format old">{{ formatNumber(analyzeData.diff.oldDailyQuota) }}</span>
                  <el-icon><ArrowRight /></el-icon>
                  <span
                    class="number-format new"
                    :class="{
                      increase: analyzeData.diff.newDailyQuota > analyzeData.diff.oldDailyQuota,
                      decrease: analyzeData.diff.newDailyQuota < analyzeData.diff.oldDailyQuota
                    }"
                  >
                    {{ formatNumber(analyzeData.diff.newDailyQuota) }}
                  </span>
                </div>
              </div>
              <div
                v-if="analyzeData.diff.oldWeightMultiplier !== undefined && analyzeData.diff.newWeightMultiplier !== undefined"
                class="impact-card"
              >
                <div class="impact-label">权重变化</div>
                <div class="impact-value weight-change">
                  <span class="old">x{{ Number(analyzeData.diff.oldWeightMultiplier).toFixed(2) }}</span>
                  <el-icon><ArrowRight /></el-icon>
                  <span
                    class="new"
                    :class="{
                      increase: Number(analyzeData.diff.newWeightMultiplier) > Number(analyzeData.diff.oldWeightMultiplier),
                      decrease: Number(analyzeData.diff.newWeightMultiplier) < Number(analyzeData.diff.oldWeightMultiplier)
                    }"
                  >
                    x{{ Number(analyzeData.diff.newWeightMultiplier).toFixed(2) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <el-divider />

          <div class="config-compare">
            <div class="section-title">配置对比</div>
            <div class="compare-wrapper">
              <div class="compare-col">
                <div class="col-title old-title">原配置</div>
                <pre class="config-json">{{ prettyJson(analyzeData.oldConfig) }}</pre>
              </div>
              <div class="compare-col">
                <div class="col-title new-title">新配置</div>
                <pre class="config-json">{{ prettyJson(analyzeData.newConfig) }}</pre>
              </div>
            </div>
          </div>

          <el-divider v-if="analyzeData.validationResult" />

          <div v-if="analyzeData.validationResult" class="validation-section">
            <div class="section-title">校验结果</div>
            <pre class="validation-json">{{ prettyJson(analyzeData.validationResult) }}</pre>
          </div>

          <el-divider v-if="analyzeData.log.reason || analyzeData.log.blockReason" />

          <div v-if="analyzeData.log.reason || analyzeData.log.blockReason" class="reason-section">
            <div v-if="analyzeData.log.reason" class="reason-item">
              <span class="reason-label">操作原因：</span>
              <span class="reason-text">{{ analyzeData.log.reason }}</span>
            </div>
            <div v-if="analyzeData.log.blockReason" class="reason-item block">
              <span class="reason-label">拦截原因：</span>
              <span class="reason-text">{{ analyzeData.log.blockReason }}</span>
            </div>
          </div>
        </div>

        <template #footer>
          <el-button @click="innerVisible = false">关闭</el-button>
        </template>
      </el-dialog>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Loading, ArrowRight } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { formatDateTime, formatNumber } from '@hooks/index'
import { analyzeTrafficPoolLog } from '@api/traffic-pool'
import type { TrafficPoolLogAnalyzeResult } from '@/types/business'
import {
  TRAFFIC_POOL_LOG_TYPE_NAMES,
  TRAFFIC_POOL_LOG_STATUS_NAMES,
  TRAFFIC_POOL_LOG_STATUS_TAG_TYPES
} from '@/enums/business'

const props = defineProps<{
  modelValue: boolean
  logId: number | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const innerVisible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const loading = ref(false)
const analyzeData = ref<TrafficPoolLogAnalyzeResult | null>(null)

const prettyJson = (data: any) => {
  if (!data) return '-'
  try {
    if (typeof data === 'string') {
      data = JSON.parse(data)
    }
    return JSON.stringify(data, null, 2)
  } catch (_e) {
    return String(data)
  }
}

const fetchAnalyzeData = async () => {
  if (!props.logId) return
  loading.value = true
  try {
    analyzeData.value = await analyzeTrafficPoolLog(props.logId)
  } catch (e: any) {
    ElMessage.error(e?.message || '加载失败')
  } finally {
    loading.value = false
  }
}

watch(
  () => props.modelValue,
  (val) => {
    if (val && props.logId) {
      fetchAnalyzeData()
    }
  }
)

const handleClosed = () => {
  analyzeData.value = null
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

.loading-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  gap: 12px;
  color: $text-secondary;
}

.analyze-content {
  .basic-info {
    .info-row {
      display: flex;
      gap: 24px;
      margin-bottom: 12px;

      .info-item {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 8px;

        .info-label {
          color: $text-secondary;
          font-size: 13px;
          min-width: 70px;
        }

        .info-value {
          color: $text-primary;
          font-weight: 500;
        }
      }
    }
  }

  .section-title {
    font-size: 14px;
    font-weight: 600;
    color: $text-primary;
    margin-bottom: 16px;
    padding-left: 8px;
    border-left: 3px solid #409eff;
  }

  .change-impact {
    .impact-stats {
      display: flex;
      gap: 16px;

      .impact-card {
        flex: 1;
        padding: 16px;
        background: #fafbfc;
        border-radius: 8px;

        .impact-label {
          font-size: 12px;
          color: $text-secondary;
          margin-bottom: 8px;
        }

        .impact-value {
          font-size: 20px;
          font-weight: 600;
          color: $text-primary;
          font-family: 'DIN', monospace;

          &.quota-change,
          &.weight-change {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 16px;

            .old {
              color: $text-secondary;
            }

            .new {
              &.increase {
                color: #67c23a;
              }
              &.decrease {
                color: #f56c6c;
              }
            }
          }
        }
      }
    }
  }

  .config-compare {
    .compare-wrapper {
      display: flex;
      gap: 16px;

      .compare-col {
        flex: 1;

        .col-title {
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 8px;
          padding: 6px 12px;
          border-radius: 4px;

          &.old-title {
            background: rgba(245, 108, 108, 0.1);
            color: #f56c6c;
          }

          &.new-title {
            background: rgba(103, 194, 58, 0.1);
            color: #67c23a;
          }
        }

        .config-json {
          max-height: 260px;
          overflow: auto;
          padding: 12px;
          background: #f5f7fa;
          border-radius: 6px;
          font-size: 12px;
          line-height: 1.6;
          color: $text-primary;
          font-family: 'Consolas', monospace;
          margin: 0;
        }
      }
    }
  }

  .validation-section {
    .validation-json {
      max-height: 200px;
      overflow: auto;
      padding: 12px;
      background: #f5f7fa;
      border-radius: 6px;
      font-size: 12px;
      line-height: 1.6;
      color: $text-primary;
      font-family: 'Consolas', monospace;
      margin: 0;
    }
  }

  .reason-section {
    .reason-item {
      display: flex;
      gap: 8px;
      padding: 8px 0;

      &.block {
        .reason-text {
          color: #f56c6c;
        }
      }

      .reason-label {
        color: $text-secondary;
        font-size: 13px;
        min-width: 80px;
      }

      .reason-text {
        color: $text-primary;
        font-size: 13px;
      }
    }
  }
}

.number-format {
  font-family: 'DIN', monospace;
}
</style>
