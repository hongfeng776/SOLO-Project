<template>
  <div class="page-container">
    <el-card shadow="never" class="mb-20">
      <el-form :model="queryParams" label-width="110px" inline @submit.prevent>
        <el-form-item label="规则ID/名称">
          <el-input
            v-model="queryParams.keyword"
            placeholder="规则ID/名称/拦截详情"
            clearable
            style="width: 220px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="日志类型">
          <el-select
            v-model="queryParams.logType"
            placeholder="全部类型"
            clearable
            style="width: 140px"
          >
            <el-option
              v-for="(name, val) in WEIGHT_RULE_LOG_TYPE_NAMES"
              :key="val"
              :label="name"
              :value="val"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="处理状态">
          <el-select
            v-model="queryParams.status"
            placeholder="全部状态"
            clearable
            style="width: 130px"
          >
            <el-option
              v-for="(name, val) in WEIGHT_RULE_LOG_STATUS_NAMES"
              :key="val"
              :label="name"
              :value="Number(val)"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="拦截原因">
          <el-select
            v-model="queryParams.blockReason"
            placeholder="全部原因"
            clearable
            style="width: 180px"
          >
            <el-option
              v-for="(name, val) in WEIGHT_RULE_BLOCK_REASON_NAMES"
              :key="val"
              :label="name"
              :value="val"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="操作时间">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始"
            end-placeholder="结束"
            value-format="YYYY-MM-DD"
            style="width: 280px"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            :icon="Search"
            :loading="loading"
            @click="handleSearch"
          >查询</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">权重规则变更日志</span>
          <div class="header-tip">
            <el-icon color="#e6a23c"><InfoFilled /></el-icon>
            <span>双击任意行可查看规则全量影响分析</span>
          </div>
        </div>
      </template>

      <div class="table-wrapper fixed-header-table">
        <el-table
          :data="dataList"
          :loading="loading"
          border
          stripe
          height="calc(100vh - 340px)"
          @row-dblclick="handleRowDblClick"
        >
          <el-table-column type="index" label="序号" width="60" align="center" fixed="left" />
          <el-table-column label="日志ID" width="80" align="center" fixed="left">
            <template #default="{ row }">
              <span class="mono id-cell">{{ row.id }}</span>
            </template>
          </el-table-column>
          <el-table-column label="规则信息" min-width="200" fixed="left">
            <template #default="{ row }">
              <div class="rule-cell">
                <div class="rule-name">{{ row.ruleName }}</div>
                <div class="rule-meta muted">
                  规则ID：<span class="mono">{{ row.ruleId }}</span>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="日志类型" width="120" align="center">
            <template #default="{ row }">
              <span class="log-type-tag">{{ WEIGHT_RULE_LOG_TYPE_NAMES[row.logType] || row.logType }}</span>
            </template>
          </el-table-column>
          <el-table-column label="处理状态" width="110" align="center">
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
          <el-table-column label="变更前后" min-width="280">
            <template #default="{ row }">
              <div class="weight-change">
                <template v-if="row.oldWeights && row.newWeights">
                  <div class="change-row">
                    <span class="label muted">原：</span>
                    <WeightBadges :weights="parseJSON(row.oldWeights)" size="small" />
                  </div>
                  <div class="change-row">
                    <span class="label muted">新：</span>
                    <WeightBadges :weights="parseJSON(row.newWeights)" size="small" highlight />
                  </div>
                </template>
                <template v-else-if="row.oldStatus !== undefined && row.newStatus !== undefined">
                  <div class="status-change">
                    <el-tag size="small" effect="light" :color="WEIGHT_RULE_STATUS_COLORS[row.oldStatus]" style="color:#fff">
                      {{ WEIGHT_RULE_STATUS_NAMES[row.oldStatus] }}
                    </el-tag>
                    <el-icon class="arrow"><ArrowRight /></el-icon>
                    <el-tag size="small" effect="light" :color="WEIGHT_RULE_STATUS_COLORS[row.newStatus]" style="color:#fff">
                      {{ WEIGHT_RULE_STATUS_NAMES[row.newStatus] }}
                    </el-tag>
                  </div>
                </template>
                <template v-else-if="row.changedFields">
                  <span class="fields muted">
                    变更字段：{{ row.changedFields }}
                  </span>
                </template>
                <span v-else class="muted">-</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="拦截信息" min-width="200" show-overflow-tooltip>
            <template #default="{ row }">
              <template v-if="row.status === 2 || row.blockReason">
                <div class="block-info">
                  <el-tag type="danger" size="small" effect="dark">
                    {{ WEIGHT_RULE_BLOCK_REASON_NAMES[row.blockReason || ''] || row.blockReason }}
                  </el-tag>
                  <div v-if="row.blockDetail" class="block-detail muted">{{ row.blockDetail }}</div>
                  <div v-if="row.fairnessScore !== undefined && row.fairnessScore !== null" class="fairness">
                    <span class="muted">公平性分：</span>
                    <span
                      class="fair-score"
                      :class="{ high: row.fairnessScore >= 70, mid: row.fairnessScore >= 50 && row.fairnessScore < 70, low: row.fairnessScore < 50 }"
                    >{{ row.fairnessScore }}</span>
                  </div>
                </div>
              </template>
              <span v-else class="muted">-</span>
            </template>
          </el-table-column>
          <el-table-column label="影响" width="150" align="right">
            <template #default="{ row }">
              <div class="impact">
                <div v-if="row.affectedContentCount" class="impact-num">
                  <span class="muted">影响内容</span>
                  <strong>{{ formatNumber(row.affectedContentCount) }}</strong>
                </div>
                <div v-if="row.queueRefreshCost" class="impact-cost muted">
                  队列刷新：{{ row.queueRefreshCost }}ms
                </div>
                <el-tooltip
                  v-if="row.estimatedImpact"
                  :content="row.estimatedImpact"
                  placement="top"
                >
                  <div class="impact-desc muted ellipsis">{{ row.estimatedImpact }}</div>
                </el-tooltip>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作人" width="140">
            <template #default="{ row }">
              <div class="op">
                <div class="op-name">{{ row.operatorName || '系统' }}</div>
                <div v-if="row.operatorRole" class="op-role muted">{{ row.operatorRole }}</div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作时间" width="170" fixed="right">
            <template #default="{ row }">
              <span class="time-cell">{{ formatDateTime(row.createTime) }}</span>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.pageSize"
          :total="total"
          :page-sizes="[20, 50, 100, 200]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="fetchData"
          @current-change="fetchData"
        />
      </div>
    </el-card>

    <ImpactAnalysisDialog
      v-model="analysisVisible"
      :rule-id="currentRuleId"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, defineAsyncComponent, h } from 'vue'
import { Search, Refresh, InfoFilled, ArrowRight } from '@element-plus/icons-vue'
import { useUserStore } from '@stores/modules/user'
import { useFetchList, formatDateTime, formatNumber } from '@hooks/index'
import { getTrafficWeightRuleLogs } from '@api/traffic-weight-rule'
import type { TrafficWeightRuleLog } from '@/types/business'
import {
  WEIGHT_RULE_LOG_TYPE_NAMES,
  WEIGHT_RULE_LOG_STATUS_NAMES,
  WEIGHT_RULE_LOG_STATUS_COLORS,
  WEIGHT_RULE_STATUS_NAMES,
  WEIGHT_RULE_STATUS_COLORS,
  WEIGHT_RULE_BLOCK_REASON_NAMES,
  WEIGHT_DIMENSION_NAMES,
  WEIGHT_DIMENSION_COLORS
} from '@/enums/business'

const ImpactAnalysisDialog = defineAsyncComponent(() => import('./components/ImpactAnalysisDialog.vue'))

const WeightBadges = defineComponent({
  name: 'WeightBadges',
  props: {
    weights: { type: Object, default: () => ({}) },
    size: { type: String, default: 'default' },
    highlight: { type: Boolean, default: false }
  },
  setup(props) {
    const items = computed(() => {
      const w: any = props.weights || {}
      return [
        { key: 'contentQualityWeight', code: 'content_quality', label: WEIGHT_DIMENSION_NAMES.content_quality, value: w.contentQualityWeight ?? w.content_quality },
        { key: 'userActivityWeight', code: 'user_activity', label: WEIGHT_DIMENSION_NAMES.user_activity, value: w.userActivityWeight ?? w.user_activity },
        { key: 'interactionWeight', code: 'interaction', label: WEIGHT_DIMENSION_NAMES.interaction, value: w.interactionWeight ?? w.interaction },
        { key: 'complianceWeight', code: 'compliance', label: WEIGHT_DIMENSION_NAMES.compliance, value: w.complianceWeight ?? w.compliance }
      ].filter(i => i.value !== undefined && i.value !== null)
    })
    return () => h('div', {
      class: ['weight-badges', props.size, { highlight: props.highlight }],
      style: { display: 'flex', gap: '4px', flexWrap: 'wrap' }
    }, items.value.map(i => h('span', {
      class: 'wbadge',
      style: {
        background: WEIGHT_DIMENSION_COLORS[i.code] + (props.highlight ? '22' : '15'),
        color: WEIGHT_DIMENSION_COLORS[i.code],
        padding: '1px 6px',
        borderRadius: '3px',
        fontSize: props.size === 'small' ? '11px' : '12px',
        border: `1px solid ${WEIGHT_DIMENSION_COLORS[i.code]}55`,
        fontFamily: 'DIN, monospace',
        fontWeight: 600
      }
    }, `${i.label} ${i.value}%`)))
  }
})

const userStore = useUserStore()
const canView = computed(() =>
  userStore.hasRole('admin') ||
  userStore.hasRole('operation_admin') ||
  userStore.hasRole('senior_operator') ||
  userStore.hasRole('auditor')
)

const dateRange = ref<string[]>([])
const queryParams = reactive({
  page: 1, pageSize: 20,
  keyword: '',
  logType: '',
  status: undefined as number | undefined,
  blockReason: '',
  startDate: '',
  endDate: ''
})

const parseJSON = (s: string) => {
  try { return JSON.parse(s) } catch { return {} }
}

const { loading, dataList, total, fetchData, handleSearch: doSearch, handleReset: doReset } =
  useFetchList<TrafficWeightRuleLog>({
    fetchApi: getTrafficWeightRuleLogs,
    defaultParams: queryParams,
    immediate: false
  })

watch(dateRange, (val) => {
  if (val && val.length === 2) {
    queryParams.startDate = val[0]
    queryParams.endDate = val[1]
  } else {
    queryParams.startDate = ''
    queryParams.endDate = ''
  }
})

const handleSearch = () => {
  queryParams.page = 1
  doSearch()
}

const handleReset = () => {
  queryParams.page = 1
  queryParams.pageSize = 20
  queryParams.keyword = ''
  queryParams.logType = ''
  queryParams.status = undefined
  queryParams.blockReason = ''
  queryParams.startDate = ''
  queryParams.endDate = ''
  dateRange.value = []
  doReset()
}

const analysisVisible = ref(false)
const currentRuleId = ref<number | null>(null)

const handleRowDblClick = (row: TrafficWeightRuleLog) => {
  currentRuleId.value = row.ruleId
  analysisVisible.value = true
}

onMounted(() => {
  if (canView.value) fetchData()
})
</script>

<style lang="scss" scoped>
.page-container {
  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .card-title {
    font-size: 15px;
    font-weight: 600;
    color: $text-primary;
  }
  .header-tip {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: $text-secondary;
  }

  .fixed-header-table {
    :deep(.el-table) {
      th.el-table__cell {
        position: sticky;
        top: 0;
        z-index: 2;
        background: #fafafa !important;
        font-weight: 600;
      }

      .id-cell {
        font-family: 'Consolas', monospace;
        color: $text-secondary;
      }
      .rule-cell {
        .rule-name { font-size: 13px; font-weight: 600; color: $text-primary; }
        .rule-meta { font-size: 11px; font-family: 'Consolas', monospace; }
      }
      .log-type-tag {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 3px;
        font-size: 12px;
        background: rgba(64, 158, 255, 0.1);
        color: $primary-color;
        font-weight: 500;
      }
      .weight-change {
        .change-row {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 3px;
          .label { font-size: 11px; width: 24px; }
        }
        .status-change {
          display: flex;
          align-items: center;
          gap: 6px;
          .arrow { color: $primary-color; }
        }
        .fields { font-size: 12px; }
      }
      .block-info {
        .block-detail {
          font-size: 11px;
          margin-top: 3px;
          line-height: 1.4;
        }
        .fairness {
          margin-top: 4px;
          font-size: 12px;
          .fair-score {
            font-family: 'DIN', monospace;
            font-weight: 700;
            &.high { color: #67c23a; }
            &.mid { color: #e6a23c; }
            &.low { color: #f56c6c; }
          }
        }
      }
      .impact {
        text-align: right;
        font-size: 12px;
        .impact-num strong {
          font-family: 'DIN', monospace;
          color: $text-primary;
          margin-left: 4px;
          font-weight: 700;
        }
        .impact-cost { font-size: 11px; margin-top: 2px; }
        .impact-desc {
          margin-top: 3px;
          font-size: 11px;
          max-width: 140px;
        }
      }
      .op {
        .op-name { font-size: 12px; }
        .op-role { font-size: 11px; }
      }
      .time-cell {
        font-size: 12px;
        color: $text-secondary;
      }
      .ellipsis {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .muted { color: $text-placeholder; }
    }
  }

  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }
}
</style>
