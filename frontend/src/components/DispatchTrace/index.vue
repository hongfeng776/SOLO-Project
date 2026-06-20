<template>
  <el-dialog
    :model-value="modelValue"
    title="调度溯源分析"
    width="900px"
    :close-on-click-modal="false"
    @update:model-value="handleClose"
  >
    <div class="dispatch-trace">
      <div class="section section-trace">
        <h4 class="section-title">
          <el-icon><Search /></el-icon>
          调度溯源记录
        </h4>
        <div class="filter-bar">
          <el-date-picker
            v-model="filter.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 280px"
          />
          <el-select v-model="filter.area" placeholder="选择区域" clearable style="width: 150px">
            <el-option
              v-for="city in CITY_OPTIONS"
              :key="city"
              :label="city"
              :value="city"
            />
          </el-select>
          <el-select v-model="filter.validationType" placeholder="校验类型" clearable style="width: 150px">
            <el-option label="全部" value="all" />
            <el-option label="无效调度" value="invalid" />
            <el-option label="重复调度" value="repeated" />
            <el-option label="跨区违规" value="crossRegion" />
          </el-select>
          <el-button type="primary" :loading="loading" @click="handleQuery">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
        </div>
        <el-table
          :data="traceRecords"
          border
          stripe
          max-height="360"
          :row-class-name="traceRowClassName"
          style="width: 100%"
        >
          <el-table-column label="任务ID" min-width="120">
            <template #default="{ row }">
              <el-tooltip :content="row.taskId" placement="top">
                <span class="text-truncate">{{ row.taskId }}</span>
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column label="触发时间" min-width="160">
            <template #default="{ row }">
              {{ formatDate(row.triggerTime) }}
            </template>
          </el-table-column>
          <el-table-column label="触发类型" min-width="100">
            <template #default="{ row }">
              <el-tag
                size="small"
                :type="triggerTypeTagMap[row.triggerType]?.type || 'info'"
                effect="plain"
              >
                {{ triggerTypeTagMap[row.triggerType]?.label || row.triggerType }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="目标区域" min-width="130">
            <template #default="{ row }">
              {{ row.targetArea }}{{ row.targetCity ? ' ' + row.targetCity : '' }}
            </template>
          </el-table-column>
          <el-table-column label="匹配逻辑" min-width="130">
            <template #default="{ row }">
              <el-tooltip :content="row.matchingLogic" placement="top">
                <span class="text-truncate">{{ row.matchingLogic }}</span>
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column label="匹配司机" min-width="100">
            <template #default="{ row }">
              {{ row.matchedDriverName || '无' }}
            </template>
          </el-table-column>
          <el-table-column label="执行结果" min-width="100">
            <template #default="{ row }">
              <el-tag
                size="small"
                :type="resultTagMap[row.executionResult]?.type || 'info'"
                effect="plain"
              >
                {{ DispatchResultMap[row.executionResult] || row.executionResult }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="耗时" min-width="80">
            <template #default="{ row }">
              {{ row.executionDuration }}ms
            </template>
          </el-table-column>
          <el-table-column label="异常标记" min-width="140">
            <template #default="{ row }">
              <div class="flag-tags">
                <el-tag
                  v-if="row.isInvalid"
                  size="small"
                  type="danger"
                  effect="dark"
                  class="flag-tag"
                >
                  无效
                </el-tag>
                <el-tag
                  v-if="row.isRepeated"
                  size="small"
                  type="warning"
                  effect="dark"
                  class="flag-tag"
                >
                  重复
                </el-tag>
                <el-tag
                  v-if="row.isCrossRegion"
                  size="small"
                  color="#9b59b6"
                  effect="dark"
                  class="flag-tag cross-region-tag"
                >
                  跨区
                </el-tag>
                <span v-if="!row.isInvalid && !row.isRepeated && !row.isCrossRegion" class="text-muted">
                  —
                </span>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div v-if="validation" class="section section-validation">
        <h4 class="section-title">
          <el-icon><Warning /></el-icon>
          拦截与校验
        </h4>
        <div class="validation-cards">
          <div class="validation-card card-total">
            <div class="card-value">{{ validation.totalTasks }}</div>
            <div class="card-label">调度任务总数</div>
          </div>
          <div class="validation-card card-invalid">
            <div class="card-value">{{ validation.invalidDispatches }}</div>
            <div class="card-label">无效调度</div>
          </div>
          <div class="validation-card card-repeated">
            <div class="card-value">{{ validation.repeatedDispatches }}</div>
            <div class="card-label">重复调度</div>
          </div>
          <div class="validation-card card-cross-region">
            <div class="card-value">{{ validation.crossRegionViolations }}</div>
            <div class="card-label">跨区违规</div>
          </div>
        </div>
        <div class="validation-checks">
          <div
            v-for="(check, index) in validation.validationChecks"
            :key="index"
            class="check-item"
            :class="{ 'check-failed': !check.passed }"
          >
            <div class="check-status">
              <el-icon v-if="check.passed" class="icon-passed"><CircleCheck /></el-icon>
              <el-icon v-else class="icon-failed"><CircleClose /></el-icon>
            </div>
            <div class="check-content">
              <div class="check-name">{{ check.name }}</div>
              <div class="check-detail">{{ check.detail }}</div>
            </div>
            <el-tag
              size="small"
              :type="check.passed ? 'success' : 'danger'"
              effect="plain"
            >
              {{ check.passed ? '通过' : '未通过' }}
            </el-tag>
          </div>
        </div>
        <div class="validation-result">
          <span class="result-label">整体校验结果：</span>
          <el-tag
            :type="validation.overallPassed ? 'success' : 'danger'"
            size="large"
            effect="dark"
            class="result-badge"
            :class="{ 'pulse-failed': !validation.overallPassed }"
          >
            <el-icon v-if="validation.overallPassed"><CircleCheck /></el-icon>
            <el-icon v-else><CircleClose /></el-icon>
            {{ validation.overallPassed ? '校验通过' : '校验未通过' }}
          </el-tag>
        </div>
      </div>

      <div v-if="optimizations.length > 0" class="section section-optimization">
        <h4 class="section-title">
          <el-icon><TrendCharts /></el-icon>
          算法参数优化建议
        </h4>
        <div class="optimization-list">
          <div
            v-for="(opt, index) in optimizations"
            :key="index"
            class="optimization-item"
          >
            <div class="opt-header">
              <span class="opt-param">
                <el-icon><Setting /></el-icon>
                {{ opt.parameter }}
              </span>
              <el-tag
                size="small"
                :type="impactTagMap[opt.impact]"
                effect="plain"
              >
                {{ impactLabelMap[opt.impact] }}
              </el-tag>
            </div>
            <div class="opt-value-change">
              <span class="opt-current">{{ opt.currentValue }}</span>
              <span class="opt-arrow">→</span>
              <span class="opt-suggested">{{ opt.suggestedValue }}</span>
            </div>
            <div class="opt-reason">{{ opt.reason }}</div>
          </div>
        </div>
        <div v-if="summary" class="optimization-summary">
          <div class="summary-grid">
            <div class="summary-item">
              <el-icon class="summary-icon"><Timer /></el-icon>
              <div class="summary-content">
                <div class="summary-value">{{ summary.avgMatchTime }}ms</div>
                <div class="summary-label">平均匹配耗时</div>
              </div>
            </div>
            <div class="summary-item">
              <el-icon class="summary-icon"><DataAnalysis /></el-icon>
              <div class="summary-content">
                <div class="summary-value">{{ (summary.successRate * 100).toFixed(1) }}%</div>
                <div class="summary-label">调度成功率</div>
              </div>
            </div>
            <div class="summary-item">
              <el-icon class="summary-icon"><Warning /></el-icon>
              <div class="summary-content">
                <div class="summary-value">{{ summary.topGapAreas.join('、') || '—' }}</div>
                <div class="summary-label">缺口集中区域</div>
              </div>
            </div>
            <div class="summary-item">
              <el-icon class="summary-icon"><Document /></el-icon>
              <div class="summary-content">
                <div class="summary-value">{{ summary.topInterceptReasons.join('、') || '—' }}</div>
                <div class="summary-label">主要拦截原因</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Search,
  Warning,
  CircleCheck,
  CircleClose,
  TrendCharts,
  Setting,
  Timer,
  Document,
  DataAnalysis
} from '@element-plus/icons-vue'
import { getDispatchTraceApi } from '@/api/capacity'
import type {
  DispatchTraceResult,
  DispatchTraceRecord,
  DispatchTraceValidation,
  AlgorithmOptimization
} from '@/types/capacity'
import { DispatchResult, DispatchResultMap, CITY_OPTIONS } from '@/enums/capacity'
import { formatDate } from '@/utils/format'

interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const loading = ref(false)
const traceRecords = ref<DispatchTraceRecord[]>([])
const validation = ref<DispatchTraceValidation | null>(null)
const optimizations = ref<AlgorithmOptimization[]>([])
const summary = ref<DispatchTraceResult['summary'] | null>(null)

const filter = reactive({
  dateRange: null as [string, string] | null,
  area: '',
  validationType: ''
})

const triggerTypeTagMap: Record<string, { label: string; type: '' | 'success' | 'warning' | 'danger' | 'info' }> = {
  manual: { label: '手动', type: '' },
  auto: { label: '自动', type: 'success' },
  batch: { label: '批量', type: 'warning' }
}

const resultTagMap: Record<string, { type: '' | 'success' | 'warning' | 'danger' | 'info' }> = {
  success: { type: 'success' },
  failed: { type: 'danger' },
  cancelled: { type: 'info' },
  intercepted: { type: 'warning' }
}

const impactTagMap: Record<string, 'danger' | 'warning' | ''> = {
  high: 'danger',
  medium: 'warning',
  low: ''
}

const impactLabelMap: Record<string, string> = {
  high: '高影响',
  medium: '中影响',
  low: '低影响'
}

const traceRowClassName = ({ row }: { row: DispatchTraceRecord }) => {
  if (row.isInvalid || row.isRepeated || row.isCrossRegion) {
    return 'row-flagged'
  }
  return ''
}

const handleClose = () => {
  emit('update:modelValue', false)
}

const handleQuery = async () => {
  loading.value = true
  try {
    const params: Record<string, string> = {}
    if (filter.dateRange && filter.dateRange.length === 2) {
      params.startDate = filter.dateRange[0]
      params.endDate = filter.dateRange[1]
    }
    if (filter.area) {
      params.area = filter.area
    }
    if (filter.validationType && filter.validationType !== 'all') {
      params.validationType = filter.validationType
    }

    const res = await getDispatchTraceApi(params)
    const data = res.data
    traceRecords.value = data.traces || []
    validation.value = data.validation || null
    optimizations.value = data.optimizations || []
    summary.value = data.summary || null
    ElMessage.success('查询完成')
  } catch (error: any) {
    ElMessage.error(error.message || '查询失败')
  } finally {
    loading.value = false
  }
}

watch(() => props.modelValue, (val) => {
  if (val && traceRecords.value.length === 0) {
    handleQuery()
  }
})
</script>

<style lang="scss" scoped>
.dispatch-trace {
  .section {
    margin-bottom: 28px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 16px 0;
    font-size: 16px;
    color: #303133;
    padding-bottom: 10px;
    border-bottom: 1px solid #ebeef5;
  }

  .filter-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }

  .text-truncate {
    display: inline-block;
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    vertical-align: middle;
  }

  .text-muted {
    color: #c0c4cc;
  }

  .flag-tags {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-wrap: wrap;

    .flag-tag {
      font-size: 11px;
    }

    .cross-region-tag {
      color: #fff;
      border-color: #9b59b6;
    }
  }

  :deep(.row-flagged) {
    background: #fef0f0 !important;
    border-left: 3px solid #f56c6c;

    td {
      background: transparent !important;
    }
  }

  .validation-cards {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 20px;

    .validation-card {
      padding: 20px 16px;
      border-radius: 8px;
      text-align: center;
      border: 1px solid #ebeef5;
      transition: all 0.3s;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      }

      .card-value {
        font-size: 28px;
        font-weight: 700;
        margin-bottom: 6px;
      }

      .card-label {
        font-size: 13px;
        color: #909399;
      }

      &.card-total {
        background: linear-gradient(135deg, #ecf5ff 0%, #ffffff 100%);
        border-color: #b3d8ff;

        .card-value {
          color: #409eff;
        }
      }

      &.card-invalid {
        background: linear-gradient(135deg, #fef0f0 0%, #ffffff 100%);
        border-color: #fbc4c4;

        .card-value {
          color: #f56c6c;
        }
      }

      &.card-repeated {
        background: linear-gradient(135deg, #fdf6ec 0%, #ffffff 100%);
        border-color: #f5dab1;

        .card-value {
          color: #e6a23c;
        }
      }

      &.card-cross-region {
        background: linear-gradient(135deg, #f3eaf8 0%, #ffffff 100%);
        border-color: #d4b5e8;

        .card-value {
          color: #9b59b6;
        }
      }
    }
  }

  .validation-checks {
    margin-bottom: 20px;

    .check-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      background: #fafafa;
      border-radius: 8px;
      margin-bottom: 10px;
      border-left: 3px solid #67c23a;
      transition: all 0.2s;

      &:last-child {
        margin-bottom: 0;
      }

      .check-status {
        font-size: 20px;
        flex-shrink: 0;

        .icon-passed {
          color: #67c23a;
        }

        .icon-failed {
          color: #f56c6c;
        }
      }

      .check-content {
        flex: 1;
        min-width: 0;

        .check-name {
          font-size: 14px;
          font-weight: 500;
          color: #303133;
          margin-bottom: 4px;
        }

        .check-detail {
          font-size: 12px;
          color: #909399;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }

      &.check-failed {
        background: #fef0f0;
        border-left-color: #f56c6c;
      }
    }
  }

  .validation-result {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 16px;
    background: #f5f7fa;
    border-radius: 8px;

    .result-label {
      font-size: 15px;
      font-weight: 500;
      color: #303133;
    }

    .result-badge {
      font-size: 15px;
      padding: 8px 20px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .pulse-failed {
      animation: pulse-fail 2s ease-in-out infinite;
    }
  }

  @keyframes pulse-fail {
    0%,
    100% {
      box-shadow: 0 0 0 0 rgba(245, 108, 108, 0.4);
    }

    50% {
      box-shadow: 0 0 0 8px rgba(245, 108, 108, 0);
    }
  }

  .optimization-list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    margin-bottom: 24px;

    .optimization-item {
      padding: 16px;
      background: #fff;
      border: 1px solid #ebeef5;
      border-radius: 8px;
      transition: all 0.3s;

      &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        transform: translateY(-1px);
      }

      .opt-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 10px;

        .opt-param {
          font-size: 14px;
          font-weight: 500;
          color: #303133;
          display: flex;
          align-items: center;
          gap: 6px;
        }
      }

      .opt-value-change {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 10px;
        font-size: 15px;

        .opt-current {
          color: #909399;
          font-weight: 500;
        }

        .opt-arrow {
          color: #e6a23c;
          font-size: 18px;
          font-weight: 700;
        }

        .opt-suggested {
          color: #409eff;
          font-weight: 700;
        }
      }

      .opt-reason {
        font-size: 12px;
        color: #909399;
        line-height: 1.5;
      }
    }
  }

  .optimization-summary {
    background: #f5f7fa;
    border-radius: 8px;
    padding: 20px;

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;

      .summary-item {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 14px;
        background: #fff;
        border-radius: 8px;
        border: 1px solid #ebeef5;

        .summary-icon {
          font-size: 24px;
          color: #409eff;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .summary-content {
          flex: 1;
          min-width: 0;

          .summary-value {
            font-size: 14px;
            font-weight: 600;
            color: #303133;
            margin-bottom: 4px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .summary-label {
            font-size: 12px;
            color: #909399;
          }
        }
      }
    }
  }
}
</style>
