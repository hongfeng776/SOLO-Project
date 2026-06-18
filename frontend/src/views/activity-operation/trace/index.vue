<template>
  <div class="page-container">
    <el-card shadow="never" class="mb-20">
      <el-form :model="queryParams" label-width="100px" inline @submit.prevent>
        <el-form-item label="用户UID">
          <el-input
            v-model="formModel.uid"
            placeholder="请输入用户UID"
            clearable
            style="width: 180px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="异常类型">
          <el-select
            v-model="queryParams.abnormalType"
            placeholder="全部类型"
            clearable
            style="width: 160px"
          >
            <el-option
              v-for="(name, value) in ACTIVITY_ABNORMAL_NAMES"
              :key="value"
              :label="name"
              :value="value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="严重程度">
          <el-select
            v-model="queryParams.severity"
            placeholder="全部等级"
            clearable
            style="width: 140px"
          >
            <el-option
              v-for="(name, value) in RISK_LEVEL_NAMES"
              :key="value"
              :label="name"
              :value="Number(value)"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="处理状态">
          <el-select
            v-model="formModel.handled"
            placeholder="全部"
            clearable
            style="width: 120px"
          >
            <el-option label="已处理" :value="1" />
            <el-option label="未处理" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" :loading="loading" @click="handleSearch">
            查询
          </el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-row v-if="statsCards.length > 0" :gutter="16" class="mb-20">
      <el-col v-for="card in statsCards" :key="card.key" :xs="12" :sm="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" :style="{ background: card.color + '15', color: card.color }">
            <el-icon :size="28"><component :is="card.icon" /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ formatNumber(card.value) }}</div>
            <div class="stat-label">{{ card.label }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">活跃度异常预警清单</span>
          <span class="tip">双击条目查看完整溯源轨迹</span>
        </div>
      </template>

      <HtTable
        v-model:page="queryParams.page"
        v-model:page-size="queryParams.pageSize"
        :data="dataList"
        :loading="loading"
        :total="total"
        show-index
        row-key="id"
        :row-class-name="getRowClassName"
        @paginate="handlePaginate"
        @row-dblclick="handleRowDoubleClick"
      >
        <el-table-column label="用户信息" min-width="180">
          <template #default="{ row }">
            <div class="user-cell">
              <span class="user-name">{{ row.userName }}</span>
              <span class="user-uid">UID: {{ row.userId }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="异常类型" width="140">
          <template #default="{ row }">
            <el-tag size="small" effect="plain">
              {{ ACTIVITY_ABNORMAL_NAMES[row.abnormalType] || row.abnormalName || row.abnormalType }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="严重程度" width="110" align="center">
          <template #default="{ row }">
            <el-tag
              size="small"
              effect="dark"
              :color="RISK_LEVEL_COLORS[row.severity]"
              style="border: none; color: #fff"
            >
              {{ RISK_LEVEL_NAMES[row.severity] || '未知' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="异常描述" min-width="220" show-overflow-tooltip>
          <template #default="{ row }">
            <el-tooltip
              v-if="row.description && row.description.length > 30"
              :content="row.description"
              placement="top"
            >
              <span class="text-ellipsis">{{ row.description }}</span>
            </el-tooltip>
            <span v-else>{{ row.description || '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="证据数据" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <el-tooltip
              v-if="row.evidence && row.evidence.length > 30"
              :content="row.evidence"
              placement="top"
            >
              <span class="text-ellipsis">{{ row.evidence }}</span>
            </el-tooltip>
            <span v-else>{{ row.evidence || '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="活跃度分值" width="120" align="right">
          <template #default="{ row }">
            <span :class="{ 'score-abnormal': isAbnormalScore(row) }">
              {{ formatNumber(row.score) }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="处理状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag
              :type="row.handled === 1 ? 'success' : 'warning'"
              effect="light"
              size="small"
            >
              {{ row.handled === 1 ? '已处理' : '未处理' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="检测时间" width="170">
          <template #default="{ row }">{{ formatDateTime(row.createTime) }}</template>
        </el-table-column>

        <el-table-column label="操作" width="260" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              size="small"
              @click="handleViewTrace(row)"
            >
              溯源详情
            </el-button>
            <el-button
              link
              type="warning"
              size="small"
              @click="handleDetectAbnormal(row)"
            >
              异常检测
            </el-button>
            <el-button
              link
              type="success"
              size="small"
              @click="handleValidateData(row)"
            >
              数据校验
            </el-button>
          </template>
        </el-table-column>
      </HtTable>
    </el-card>

    <el-dialog
      v-model="traceDialogVisible"
      title="活跃度溯源详情"
      width="960px"
      destroy-on-close
      top="5vh"
    >
      <div v-if="traceLoading" v-loading="true" style="min-height: 200px" />
      <template v-else>
        <div class="trace-user-info">
          <el-avatar :size="48">
            {{ traceUserInfo?.nickname?.charAt(0) || 'U' }}
          </el-avatar>
          <div class="trace-user-text">
            <div class="trace-user-name">
              {{ traceUserInfo?.nickname || traceUserInfo?.username || '-' }}
              <span class="trace-user-uid">UID: {{ currentTraceUserId }}</span>
            </div>
            <div class="trace-user-extra">
              <span>活跃度等级：</span>
              <el-tag
                v-if="traceUserInfo?.activityLevel != null"
                size="small"
                effect="dark"
                :color="ACTIVITY_LEVEL_COLORS[traceUserInfo.activityLevel]"
                style="border: none; color: #fff"
              >
                {{ ACTIVITY_LEVEL_NAMES[traceUserInfo.activityLevel] || '未知' }}
              </el-tag>
              <el-tag v-else size="small" effect="plain">未知</el-tag>
              <span style="margin-left: 12px">
                当前分值：<b>{{ formatNumber(traceUserInfo?.activityScore) }}</b>
              </span>
            </div>
          </div>
        </div>

        <el-tabs v-model="traceActiveTab">
          <el-tab-pane label="分值变动历史" name="scoreLogs">
            <el-table :data="scoreLogs" border stripe size="small" max-height="400">
              <el-table-column type="index" label="#" width="50" />
              <el-table-column label="变动类型" width="120">
                <template #default="{ row }">
                  {{ ACTIVITY_LOG_TYPE_NAMES[row.logType] || row.logType }}
                </template>
              </el-table-column>
              <el-table-column label="等级变动" width="160">
                <template #default="{ row }">
                  <span v-if="row.oldLevel !== row.newLevel">
                    <el-tag size="small" effect="plain" :color="ACTIVITY_LEVEL_COLORS[row.oldLevel]" style="color: #fff; border: none">
                      {{ ACTIVITY_LEVEL_NAMES[row.oldLevel] }}
                    </el-tag>
                    <span style="margin: 0 4px">→</span>
                    <el-tag size="small" effect="plain" :color="ACTIVITY_LEVEL_COLORS[row.newLevel]" style="color: #fff; border: none">
                      {{ ACTIVITY_LEVEL_NAMES[row.newLevel] }}
                    </el-tag>
                  </span>
                  <span v-else>
                    <el-tag size="small" effect="plain" :color="ACTIVITY_LEVEL_COLORS[row.oldLevel]" style="color: #fff; border: none">
                      {{ ACTIVITY_LEVEL_NAMES[row.oldLevel] }}
                    </el-tag>
                  </span>
                </template>
              </el-table-column>
              <el-table-column label="分值变动" width="140" align="right">
                <template #default="{ row }">
                  <span>{{ formatNumber(row.oldScore) }}</span>
                  <span style="margin: 0 4px">→</span>
                  <span :class="{
                    'score-up': row.newScore > row.oldScore,
                    'score-down': row.newScore < row.oldScore
                  }">
                    {{ formatNumber(row.newScore) }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column label="波动值" width="100" align="right">
                <template #default="{ row }">
                  <span v-if="row.fluctuationAmount != null" :class="{
                    'score-up': row.fluctuationAmount > 0,
                    'score-down': row.fluctuationAmount < 0
                  }">
                    {{ row.fluctuationAmount > 0 ? '+' : '' }}{{ formatNumber(row.fluctuationAmount) }}
                  </span>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <el-table-column label="异常" width="70" align="center">
                <template #default="{ row }">
                  <el-tag v-if="row.isAbnormal === 1" type="danger" size="small" effect="light">异常</el-tag>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <el-table-column label="操作人" min-width="100" show-overflow-tooltip>
                <template #default="{ row }">
                  <el-tooltip
                    v-if="row.operatorName && row.operatorName.length > 8"
                    :content="row.operatorName"
                    placement="top"
                  >
                    <span>{{ row.operatorName }}</span>
                  </el-tooltip>
                  <span v-else>{{ row.operatorName || '系统' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="备注" min-width="120" show-overflow-tooltip>
                <template #default="{ row }">
                  <el-tooltip
                    v-if="row.remark && row.remark.length > 20"
                    :content="row.remark"
                    placement="top"
                  >
                    <span class="text-ellipsis">{{ row.remark }}</span>
                  </el-tooltip>
                  <span v-else>{{ row.remark || '-' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="时间" width="160">
                <template #default="{ row }">{{ formatDateTime(row.createTime) }}</template>
              </el-table-column>
            </el-table>
          </el-tab-pane>

          <el-tab-pane label="异常检测结果" name="detectResult">
            <div v-if="detectLoading" v-loading="true" style="min-height: 200px" />
            <template v-else-if="detectResult">
              <el-alert
                :title="detectResult.hasAbnormal ? '检测到活跃度异常' : '未检测到异常'"
                :type="detectResult.hasAbnormal ? 'error' : 'success'"
                show-icon
                :closable="false"
                class="mb-16"
              >
                <template #default>
                  <div>综合评分：<b>{{ formatNumber(detectResult.overallScore) }}</b> / 100</div>
                </template>
              </el-alert>

              <el-table v-if="detectResult.abnormalDetails?.length" :data="detectResult.abnormalDetails" border stripe size="small" max-height="360">
                <el-table-column type="index" label="#" width="50" />
                <el-table-column label="异常类型" width="160">
                  <template #default="{ row }">
                    {{ ACTIVITY_ABNORMAL_NAMES[row.type] || row.name || row.type }}
                  </template>
                </el-table-column>
                <el-table-column label="严重程度" width="110" align="center">
                  <template #default="{ row }">
                    <el-tag
                      size="small"
                      effect="dark"
                      :color="getSeverityColor(row.severity)"
                      style="border: none; color: #fff"
                    >
                      {{ getSeverityText(row.severity) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="描述" min-width="240" show-overflow-tooltip>
                  <template #default="{ row }">
                    <el-tooltip
                      v-if="row.description && row.description.length > 40"
                      :content="row.description"
                      placement="top"
                    >
                      <span class="text-ellipsis">{{ row.description }}</span>
                    </el-tooltip>
                    <span v-else>{{ row.description || '-' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="证据数据" min-width="180" show-overflow-tooltip>
                  <template #default="{ row }">
                    <el-tooltip
                      v-if="row.evidence"
                      :content="JSON.stringify(row.evidence)"
                      placement="top"
                    >
                      <span class="text-ellipsis">{{ JSON.stringify(row.evidence) }}</span>
                    </el-tooltip>
                    <span v-else>-</span>
                  </template>
                </el-table-column>
              </el-table>

              <div v-if="detectResult.suggestions?.length" class="validation-section">
                <div class="section-title">检测建议</div>
                <el-alert
                  v-for="(suggestion, idx) in detectResult.suggestions"
                  :key="idx"
                  :title="suggestion"
                  type="info"
                  :closable="false"
                  show-icon
                  class="mb-8"
                />
              </div>
            </template>
            <el-empty v-else description="暂无检测数据" :image-size="80" />
          </el-tab-pane>

          <el-tab-pane label="数据真实性校验" name="validation">
            <div v-if="validationLoading" v-loading="true" style="min-height: 200px" />
            <template v-else-if="validationData">
              <el-alert
                :title="validationData.valid ? '校验通过：数据真实有效' : '校验未通过：存在数据异常'"
                :type="validationData.valid ? 'success' : 'error'"
                show-icon
                :closable="false"
                class="mb-16"
              />

              <el-descriptions :column="3" border class="mb-16">
                <el-descriptions-item label="连续性校验">
                  <el-tag :type="validationData.continuity?.passed ? 'success' : 'danger'" size="small">
                    {{ validationData.continuity?.passed ? '通过' : '不通过' }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="一致性校验">
                  <el-tag :type="validationData.consistency?.passed ? 'success' : 'danger'" size="small">
                    {{ validationData.consistency?.passed ? '通过' : '不通过' }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="合理性校验">
                  <el-tag :type="validationData.rationality?.passed ? 'success' : 'danger'" size="small">
                    {{ validationData.rationality?.passed ? '通过' : '不通过' }}
                  </el-tag>
                </el-descriptions-item>
              </el-descriptions>

              <el-table v-if="validationData.checks?.length" :data="validationData.checks" border stripe size="small" max-height="260">
                <el-table-column type="index" label="#" width="50" />
                <el-table-column prop="name" label="校验项" min-width="160" />
                <el-table-column label="结果" width="100" align="center">
                  <template #default="{ row }">
                    <el-tag :type="row.passed ? 'success' : 'danger'" size="small">
                      {{ row.passed ? '通过' : '不通过' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="说明" min-width="280" show-overflow-tooltip>
                  <template #default="{ row }">
                    <el-tooltip
                      v-if="row.message && row.message.length > 40"
                      :content="row.message"
                      placement="top"
                    >
                      <span class="text-ellipsis">{{ row.message }}</span>
                    </el-tooltip>
                    <span v-else>{{ row.message || '-' }}</span>
                  </template>
                </el-table-column>
              </el-table>

              <el-row v-if="validationData.continuity?.missingDays?.length || validationData.consistency || validationData.rationality" :gutter="16" class="mt-16">
                <el-col v-if="validationData.continuity?.missingDays?.length" :span="8">
                  <div class="report-section">
                    <div class="section-title">缺失数据日期</div>
                    <el-tag
                      v-for="(day, idx) in validationData.continuity.missingDays"
                      :key="idx"
                      size="small"
                      type="danger"
                      effect="light"
                      style="margin: 4px 4px 0 0"
                    >
                      {{ day }}
                    </el-tag>
                  </div>
                </el-col>
                <el-col v-if="validationData.consistency" :span="8">
                  <div class="report-section">
                    <div class="section-title">一致性详情</div>
                    <div class="detail-item">总分值：<b>{{ formatNumber(validationData.consistency.totalScore) }}</b></div>
                    <div class="detail-item">明细汇总：<b>{{ formatNumber(validationData.consistency.detailSum) }}</b></div>
                  </div>
                </el-col>
                <el-col v-if="validationData.rationality" :span="8">
                  <div class="report-section">
                    <div class="section-title">合理性详情</div>
                    <div class="detail-item">实际行为分值：<b>{{ formatNumber(validationData.rationality.actualBehaviorScore) }}</b></div>
                    <div class="detail-item">记录分值：<b>{{ formatNumber(validationData.rationality.recordedScore) }}</b></div>
                  </div>
                </el-col>
              </el-row>
            </template>
            <el-empty v-else description="暂无校验数据" :image-size="80" />
          </el-tab-pane>
        </el-tabs>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Search, Refresh, Warning, DataAnalysis, CircleCheck } from '@element-plus/icons-vue'
import { useRoute } from 'vue-router'
import { useFetchList, formatDateTime } from '@/hooks/index'
import {
  generateAbnormalWarningList,
  detectAbnormalActivity,
  validateActivityData,
  getActivityScoreLogs
} from '@api/activity-operation'
import type {
  ActivityAbnormalWarningItem,
  ActivityAbnormalDetectResult,
  ActivityDataValidation,
  ActivityScoreLogItem
} from '@/types/business'
import {
  ActivityAbnormalType,
  ACTIVITY_ABNORMAL_NAMES,
  ActivityLevel,
  ACTIVITY_LEVEL_NAMES,
  ACTIVITY_LEVEL_COLORS,
  ActivityLogType,
  ACTIVITY_LOG_TYPE_NAMES
} from '@/enums/business'
import {
  RiskLevel,
  RISK_LEVEL_NAMES,
  RISK_LEVEL_COLORS
} from '@/enums/business'
import HtTable from '@components/HtTable/index.vue'
import { useUserStore } from '@stores/modules/user'

const route = useRoute()
const userStore = useUserStore()

const formatNumber = (n: number | null | undefined): string => {
  return (n ?? 0).toLocaleString('zh-CN')
}

const statsCards = ref([
  { key: 'totalAbnormal', label: '异常总数', value: 0, icon: Warning, color: '#f56c6c' },
  { key: 'fakeScore', label: '虚假分值', value: 0, icon: Warning, color: '#e6a23c' },
  { key: 'fakeInteract', label: '虚假互动', value: 0, icon: DataAnalysis, color: '#c45656' },
  { key: 'handledCount', label: '已处理数', value: 0, icon: CircleCheck, color: '#67c23a' }
])

const {
  loading,
  dataList,
  total,
  queryParams,
  fetchData,
  handleSearch,
  handleReset: baseHandleReset,
  handlePaginate
} = useFetchList<ActivityAbnormalWarningItem>({
  fetchApi: async (params) => {
    const result = await generateAbnormalWarningList(params) as any
    if (result.stats) {
      statsCards.value.forEach((card) => {
        if (result.stats![card.key] != null) {
          card.value = result.stats![card.key] as number
        }
      })
    }
    return {
      list: result.list,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize
    }
  },
  defaultParams: {
    uid: '',
    abnormalType: '',
    severity: undefined as number | undefined,
    handled: undefined as number | undefined
  },
  immediate: false
})

const formModel = computed({
  get: () => queryParams as Record<string, any>,
  set: () => {}
})

const handleReset = () => {
  baseHandleReset()
}

const isAbnormalScore = (row: ActivityAbnormalWarningItem) => {
  return row.abnormalType === ActivityAbnormalType.FAKE_SCORE ||
    row.abnormalType === ActivityAbnormalType.ABNORMAL_FLUCTUATION
}

const getSeverityColor = (severity: string) => {
  const map: Record<string, string> = {
    high: RISK_LEVEL_COLORS[RiskLevel.HIGH],
    medium: RISK_LEVEL_COLORS[RiskLevel.MEDIUM],
    low: RISK_LEVEL_COLORS[RiskLevel.LOW]
  }
  return map[severity] || RISK_LEVEL_COLORS[RiskLevel.NONE]
}

const getSeverityText = (severity: string) => {
  const map: Record<string, string> = {
    high: RISK_LEVEL_NAMES[RiskLevel.HIGH],
    medium: RISK_LEVEL_NAMES[RiskLevel.MEDIUM],
    low: RISK_LEVEL_NAMES[RiskLevel.LOW]
  }
  return map[severity] || '未知'
}

const getRowClassName = ({ row }: { row: ActivityAbnormalWarningItem }) => {
  if (row.severity === RiskLevel.HIGH) return 'activity-row-high'
  if (row.severity === RiskLevel.MEDIUM) return 'activity-row-medium'
  if (row.severity === RiskLevel.LOW) return 'activity-row-low'
  return ''
}

const traceDialogVisible = ref(false)
const traceLoading = ref(false)
const traceActiveTab = ref('scoreLogs')
const currentTraceUserId = ref<number>(0)
const traceUserInfo = ref<{ nickname?: string; username?: string; activityLevel?: number; activityScore?: number } | null>(null)
const scoreLogs = ref<ActivityScoreLogItem[]>([])
const detectResult = ref<ActivityAbnormalDetectResult | null>(null)
const detectLoading = ref(false)
const validationData = ref<ActivityDataValidation | null>(null)
const validationLoading = ref(false)

const loadTrace = async (userId: number, warningRow?: ActivityAbnormalWarningItem) => {
  traceLoading.value = true
  traceActiveTab.value = 'scoreLogs'
  currentTraceUserId.value = userId
  scoreLogs.value = []
  detectResult.value = null
  validationData.value = null

  if (warningRow) {
    traceUserInfo.value = {
      nickname: warningRow.userName,
      activityScore: warningRow.score
    }
  } else {
    traceUserInfo.value = null
  }

  traceDialogVisible.value = true

  try {
    const logsResult = await getActivityScoreLogs({ userId, page: 1, pageSize: 50 })
    scoreLogs.value = logsResult.list
  } catch (error) {
    console.error(error)
  } finally {
    traceLoading.value = false
  }
}

const handleViewTrace = (row: ActivityAbnormalWarningItem) => {
  loadTrace(row.userId, row)
}

const handleRowDoubleClick = (row: unknown) => {
  const log = row as ActivityAbnormalWarningItem
  handleViewTrace(log)
}

const handleDetectAbnormal = async (row: ActivityAbnormalWarningItem) => {
  if (currentTraceUserId.value !== row.userId) {
    traceActiveTab.value = 'detectResult'
    await loadTrace(row.userId, row)
  } else {
    traceActiveTab.value = 'detectResult'
  }

  detectLoading.value = true
  detectResult.value = null
  try {
    detectResult.value = await detectAbnormalActivity(row.userId)
  } catch (error) {
    console.error(error)
  } finally {
    detectLoading.value = false
  }
}

const handleValidateData = async (row: ActivityAbnormalWarningItem) => {
  if (currentTraceUserId.value !== row.userId) {
    traceActiveTab.value = 'validation'
    await loadTrace(row.userId, row)
  } else {
    traceActiveTab.value = 'validation'
  }

  validationLoading.value = true
  validationData.value = null
  try {
    validationData.value = await validateActivityData(row.userId)
  } catch (error) {
    console.error(error)
  } finally {
    validationLoading.value = false
  }
}

onMounted(() => {
  const uid = route.query.uid
  if (uid) {
    queryParams.uid = Number(uid)
  }
  fetchData()
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

  .tip {
    font-size: 12px;
    color: $text-placeholder;
  }

  .stat-card {
    :deep(.el-card__body) {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
    }
  }

  .stat-icon {
    width: 56px;
    height: 56px;
    border-radius: $border-radius;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .stat-content {
    flex: 1;
  }

  .stat-value {
    font-size: 24px;
    font-weight: 700;
    color: $text-primary;
    line-height: 1.2;
  }

  .stat-label {
    font-size: 13px;
    color: $text-secondary;
    margin-top: 4px;
  }

  .user-cell {
    display: flex;
    flex-direction: column;
    gap: 2px;

    .user-name {
      font-weight: 600;
      color: $text-primary;
    }

    .user-uid {
      font-size: 12px;
      color: $text-secondary;
    }
  }

  .text-ellipsis {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: inline-block;
    max-width: 100%;
    vertical-align: middle;
  }

  .score-abnormal {
    color: #f56c6c;
    font-weight: 600;
  }

  .score-up {
    color: #67c23a;
    font-weight: 600;
  }

  .score-down {
    color: #f56c6c;
    font-weight: 600;
  }

  .trace-user-info {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 20px;
    padding: 16px;
    background: $bg-body;
    border-radius: $border-radius;

    .trace-user-text {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .trace-user-name {
        font-weight: 600;
        font-size: 16px;
        color: $text-primary;
        display: flex;
        align-items: center;
        gap: 8px;

        .trace-user-uid {
          font-size: 12px;
          color: $text-secondary;
          font-weight: normal;
        }
      }

      .trace-user-extra {
        font-size: 13px;
        color: $text-secondary;
        display: flex;
        align-items: center;
      }
    }
  }

  .validation-section,
  .report-section {
    margin-top: 16px;

    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: $text-primary;
      margin-bottom: 10px;
    }

    .detail-item {
      font-size: 13px;
      color: $text-secondary;
      line-height: 2;
    }
  }

  .mt-16 {
    margin-top: 16px;
  }

  .mb-8 {
    margin-bottom: 8px;
  }

  .mb-16 {
    margin-bottom: 16px;
  }

  :deep(.activity-row-high) {
    background: rgba(245, 108, 108, 0.08) !important;
    box-shadow: inset 0 0 0 1px rgba(245, 108, 108, 0.4),
                0 0 8px 2px rgba(245, 108, 108, 0.15);

    & > td {
      box-shadow: inset 0 0 0 1px rgba(245, 108, 108, 0.4);
    }

    &:hover > td {
      background: rgba(245, 108, 108, 0.14) !important;
      box-shadow: inset 0 0 0 1px rgba(245, 108, 108, 0.6),
                  0 0 12px 4px rgba(245, 108, 108, 0.25);
    }
  }

  :deep(.activity-row-medium) {
    background: rgba(230, 162, 60, 0.08) !important;
    box-shadow: inset 0 0 0 1px rgba(230, 162, 60, 0.35),
                0 0 6px 1px rgba(230, 162, 60, 0.12);

    & > td {
      box-shadow: inset 0 0 0 1px rgba(230, 162, 60, 0.35);
    }

    &:hover > td {
      background: rgba(230, 162, 60, 0.14) !important;
      box-shadow: inset 0 0 0 1px rgba(230, 162, 60, 0.55),
                  0 0 10px 3px rgba(230, 162, 60, 0.2);
    }
  }

  :deep(.activity-row-low) {
    background: rgba(103, 194, 58, 0.05) !important;

    &:hover > td {
      background: rgba(103, 194, 58, 0.1) !important;
    }
  }
}
</style>
