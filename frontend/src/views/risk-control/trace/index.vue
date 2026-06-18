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
        <el-form-item label="违规类型">
          <el-select
            v-model="queryParams.violationType"
            placeholder="全部类型"
            clearable
            style="width: 160px"
          >
            <el-option
              v-for="(name, value) in VIOLATION_TYPE_NAMES"
              :key="value"
              :label="name"
              :value="value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="风险等级">
          <el-select
            v-model="queryParams.riskLevel"
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
        <el-form-item label="是否拦截">
          <el-select
            v-model="formModel.intercepted"
            placeholder="全部"
            clearable
            style="width: 120px"
          >
            <el-option label="已拦截" :value="1" />
            <el-option label="未拦截" :value="0" />
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
          <span class="card-title">风控溯源列表</span>
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

        <el-table-column label="违规类型" width="130">
          <template #default="{ row }">
            <el-tag size="small" effect="plain">
              {{ VIOLATION_TYPE_NAMES[row.violationType] || row.violationType }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="风险等级" width="110" align="center">
          <template #default="{ row }">
            <el-tag
              size="small"
              effect="dark"
              :color="RISK_LEVEL_COLORS[row.riskLevel]"
              style="border: none; color: #fff"
            >
              {{ RISK_LEVEL_NAMES[row.riskLevel] || '未知' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="行为详情" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <el-tooltip
              v-if="row.behaviorDetail && row.behaviorDetail.length > 30"
              :content="row.behaviorDetail"
              placement="top"
            >
              <span class="text-ellipsis">{{ row.behaviorDetail }}</span>
            </el-tooltip>
            <span v-else>{{ row.behaviorDetail || '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="频次数据" width="120" show-overflow-tooltip>
          <template #default="{ row }">
            <el-tooltip
              v-if="row.frequencyData && row.frequencyData.length > 20"
              :content="row.frequencyData"
              placement="top"
            >
              <span class="text-ellipsis">{{ row.frequencyData }}</span>
            </el-tooltip>
            <span v-else>{{ row.frequencyData || '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="拦截" width="80" align="center">
          <template #default="{ row }">
            <el-tag
              :type="row.intercepted === 1 ? 'danger' : 'info'"
              effect="light"
              size="small"
            >
              {{ row.intercepted === 1 ? '已拦截' : '未拦截' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="自动处理" width="90" align="center">
          <template #default="{ row }">
            <el-tag
              :type="row.autoHandled === 1 ? 'success' : 'info'"
              effect="light"
              size="small"
            >
              {{ row.autoHandled === 1 ? '已处理' : '未处理' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="检测时间" width="170">
          <template #default="{ row }">{{ formatDateTime(row.createTime) }}</template>
        </el-table-column>

        <el-table-column label="操作" width="220" align="center" fixed="right">
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
              @click="handleValidatePunishment(row)"
            >
              校验处罚
            </el-button>
            <el-button
              link
              type="success"
              size="small"
              @click="handleGenerateReport(row)"
            >
              复盘报告
            </el-button>
          </template>
        </el-table-column>
      </HtTable>
    </el-card>

    <el-dialog
      v-model="traceDialogVisible"
      title="违规溯源详情"
      width="900px"
      destroy-on-close
      top="5vh"
    >
      <div v-if="traceLoading" v-loading="true" style="min-height: 200px" />
      <template v-else-if="traceData">
        <div class="trace-user-info">
          <el-avatar :size="48" :src="traceData.user?.avatar">
            {{ traceData.user?.nickname?.charAt(0) }}
          </el-avatar>
          <div class="trace-user-text">
            <div class="trace-user-name">
              {{ traceData.user?.nickname }}
              <span class="trace-user-uid">UID: {{ traceData.user?.id }}</span>
            </div>
            <div class="trace-user-extra">
              <span>{{ traceData.user?.username }}</span>
              <el-tag size="small" effect="plain" style="margin-left: 8px">
                {{ RISK_LEVEL_NAMES[traceData.user?.isAbnormal === 1 ? 3 : 0] || '正常' }}
              </el-tag>
            </div>
          </div>
        </div>

        <el-tabs v-model="traceActiveTab">
          <el-tab-pane label="行为轨迹" name="behavior">
            <el-table :data="traceData.behaviorLogs" border stripe size="small" max-height="360">
              <el-table-column type="index" label="#" width="50" />
              <el-table-column label="行为类型" width="100">
                <template #default="{ row }">
                  {{ BEHAVIOR_TYPE_NAMES[row.behaviorType] || row.behaviorType }}
                </template>
              </el-table-column>
              <el-table-column label="风险等级" width="90" align="center">
                <template #default="{ row }">
                  <el-tag
                    size="small"
                    effect="dark"
                    :color="RISK_LEVEL_COLORS[row.riskLevel]"
                    style="border: none; color: #fff"
                  >
                    {{ RISK_LEVEL_NAMES[row.riskLevel] || '未知' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="频次" width="80" align="right">
                <template #default="{ row }">{{ formatNumber(row.frequency) }}</template>
              </el-table-column>
              <el-table-column label="内容" min-width="200" show-overflow-tooltip>
                <template #default="{ row }">
                  <el-tooltip
                    v-if="row.content && row.content.length > 40"
                    :content="row.content"
                    placement="top"
                  >
                    <span>{{ row.content }}</span>
                  </el-tooltip>
                  <span v-else>{{ row.content || '-' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="异常" width="70" align="center">
                <template #default="{ row }">
                  <el-tag v-if="row.isAbnormal === 1" type="danger" size="small" effect="light">异常</el-tag>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <el-table-column label="时间" width="160">
                <template #default="{ row }">{{ formatDateTime(row.createTime) }}</template>
              </el-table-column>
            </el-table>
          </el-tab-pane>

          <el-tab-pane label="风控记录" name="riskControl">
            <el-table :data="traceData.riskControlLogs" border stripe size="small" max-height="360">
              <el-table-column type="index" label="#" width="50" />
              <el-table-column label="违规类型" width="120">
                <template #default="{ row }">
                  {{ VIOLATION_TYPE_NAMES[row.violationType] || row.violationType }}
                </template>
              </el-table-column>
              <el-table-column label="风险等级" width="90" align="center">
                <template #default="{ row }">
                  <el-tag
                    size="small"
                    effect="dark"
                    :color="RISK_LEVEL_COLORS[row.riskLevel]"
                    style="border: none; color: #fff"
                  >
                    {{ RISK_LEVEL_NAMES[row.riskLevel] || '未知' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="行为详情" min-width="200" show-overflow-tooltip>
                <template #default="{ row }">
                  <el-tooltip
                    v-if="row.behaviorDetail && row.behaviorDetail.length > 40"
                    :content="row.behaviorDetail"
                    placement="top"
                  >
                    <span>{{ row.behaviorDetail }}</span>
                  </el-tooltip>
                  <span v-else>{{ row.behaviorDetail || '-' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="拦截" width="70" align="center">
                <template #default="{ row }">
                  <el-tag v-if="row.intercepted === 1" type="danger" size="small" effect="light">是</el-tag>
                  <span v-else>否</span>
                </template>
              </el-table-column>
              <el-table-column label="时间" width="160">
                <template #default="{ row }">{{ formatDateTime(row.createTime) }}</template>
              </el-table-column>
            </el-table>
          </el-tab-pane>

          <el-tab-pane label="处罚记录" name="punishment">
            <el-table :data="traceData.punishmentRecords" border stripe size="small" max-height="360">
              <el-table-column type="index" label="#" width="50" />
              <el-table-column label="处罚类型" width="120">
                <template #default="{ row }">
                  {{ PUNISHMENT_TYPE_NAMES[row.punishmentType] || row.punishmentType }}
                </template>
              </el-table-column>
              <el-table-column label="状态" width="90" align="center">
                <template #default="{ row }">
                  <el-tag
                    :type="punishmentStatusTagType(row.status)"
                    size="small"
                    effect="light"
                  >
                    {{ PUNISHMENT_STATUS_NAMES[row.status] || '未知' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="原因" min-width="180" show-overflow-tooltip>
                <template #default="{ row }">
                  <el-tooltip
                    v-if="row.reason && row.reason.length > 30"
                    :content="row.reason"
                    placement="top"
                  >
                    <span>{{ row.reason }}</span>
                  </el-tooltip>
                  <span v-else>{{ row.reason || '-' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="时长(天)" width="90" align="right">
                <template #default="{ row }">{{ row.duration != null ? formatNumber(row.duration) : '-' }}</template>
              </el-table-column>
              <el-table-column label="重复" width="65" align="center">
                <template #default="{ row }">
                  <el-tag v-if="row.isDuplicate === 1" type="danger" size="small" effect="light">是</el-tag>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <el-table-column label="过度" width="65" align="center">
                <template #default="{ row }">
                  <el-tag v-if="row.isExcessive === 1" type="danger" size="small" effect="light">是</el-tag>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <el-table-column label="时间" width="160">
                <template #default="{ row }">{{ formatDateTime(row.createTime) }}</template>
              </el-table-column>
            </el-table>
          </el-tab-pane>

          <el-tab-pane label="整改记录" name="rectification">
            <el-table :data="traceData.rectificationRecords" border stripe size="small" max-height="360">
              <el-table-column type="index" label="#" width="50" />
              <el-table-column label="处罚类型" width="120">
                <template #default="{ row }">
                  {{ PUNISHMENT_TYPE_NAMES[row.punishmentType] || row.punishmentType }}
                </template>
              </el-table-column>
              <el-table-column label="状态" width="90" align="center">
                <template #default="{ row }">
                  <el-tag
                    :type="punishmentStatusTagType(row.status)"
                    size="small"
                    effect="light"
                  >
                    {{ PUNISHMENT_STATUS_NAMES[row.status] || '未知' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="整改结果" min-width="200" show-overflow-tooltip>
                <template #default="{ row }">
                  <el-tooltip
                    v-if="row.rectificationResult && row.rectificationResult.length > 30"
                    :content="row.rectificationResult"
                    placement="top"
                  >
                    <span>{{ row.rectificationResult }}</span>
                  </el-tooltip>
                  <span v-else>{{ row.rectificationResult || '-' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="时间" width="160">
                <template #default="{ row }">{{ formatDateTime(row.updateTime) }}</template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
        </el-tabs>
      </template>
    </el-dialog>

    <el-dialog
      v-model="validationDialogVisible"
      title="处罚合理性校验"
      width="640px"
      destroy-on-close
    >
      <div v-if="validationLoading" v-loading="true" style="min-height: 120px" />
      <template v-else-if="validationData">
        <el-alert
          :title="validationData.valid ? '校验通过：处罚合理' : '校验未通过：存在异常'"
          :type="validationData.valid ? 'success' : 'error'"
          show-icon
          :closable="false"
          class="mb-16"
        />
        <el-descriptions :column="2" border>
          <el-descriptions-item label="重复处罚">
            <el-tag :type="validationData.isDuplicate ? 'danger' : 'success'" size="small">
              {{ validationData.isDuplicate ? '是' : '否' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="过度处罚">
            <el-tag :type="validationData.isExcessive ? 'danger' : 'success'" size="small">
              {{ validationData.isExcessive ? '是' : '否' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="风险匹配">
            <el-tag :type="validationData.riskMatch ? 'success' : 'warning'" size="small">
              {{ validationData.riskMatch ? '匹配' : '不匹配' }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
        <div v-if="validationData.issues.length > 0" class="validation-section">
          <div class="section-title">存在问题</div>
          <el-alert
            v-for="(issue, idx) in validationData.issues"
            :key="idx"
            :title="issue"
            type="error"
            :closable="false"
            show-icon
            class="mb-8"
          />
        </div>
        <div v-if="validationData.warnings.length > 0" class="validation-section">
          <div class="section-title">风险警告</div>
          <el-alert
            v-for="(warn, idx) in validationData.warnings"
            :key="idx"
            :title="warn"
            type="warning"
            :closable="false"
            show-icon
            class="mb-8"
          />
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="reportDialogVisible"
      title="风控复盘报告"
      width="800px"
      destroy-on-close
      top="5vh"
    >
      <div v-if="reportLoading" v-loading="true" style="min-height: 120px" />
      <template v-else-if="reportData">
        <el-descriptions :column="2" border class="mb-16">
          <el-descriptions-item label="统计周期">
            {{ formatDateTime(reportData.period.start) }} 至 {{ formatDateTime(reportData.period.end) }}
          </el-descriptions-item>
          <el-descriptions-item label="违规总数">
            {{ formatNumber(reportData.violationStats.total) }}
          </el-descriptions-item>
          <el-descriptions-item label="处罚总数">
            {{ formatNumber(reportData.punishmentStats.total) }}
          </el-descriptions-item>
          <el-descriptions-item label="平均处罚时长(天)">
            {{ formatNumber(reportData.punishmentStats.avgDuration) }}
          </el-descriptions-item>
        </el-descriptions>

        <el-row :gutter="16" class="mb-16">
          <el-col :span="12">
            <div class="report-section">
              <div class="section-title">违规类型分布</div>
              <el-table :data="violationTypeStats" border stripe size="small">
                <el-table-column prop="name" label="类型" />
                <el-table-column prop="count" label="次数" align="right">
                  <template #default="{ row }">{{ formatNumber(row.count) }}</template>
                </el-table-column>
              </el-table>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="report-section">
              <div class="section-title">处罚类型分布</div>
              <el-table :data="punishmentTypeStats" border stripe size="small">
                <el-table-column prop="name" label="类型" />
                <el-table-column prop="count" label="次数" align="right">
                  <template #default="{ row }">{{ formatNumber(row.count) }}</template>
                </el-table-column>
              </el-table>
            </div>
          </el-col>
        </el-row>

        <div v-if="reportData.suggestions.length > 0" class="report-section">
          <div class="section-title">改进建议</div>
          <el-alert
            v-for="(suggestion, idx) in reportData.suggestions"
            :key="idx"
            :title="suggestion"
            type="info"
            :closable="false"
            show-icon
            class="mb-8"
          />
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Search, Refresh, Warning, Operation, Document } from '@element-plus/icons-vue'
import { useRoute } from 'vue-router'
import { useFetchList, formatDateTime } from '@/hooks/index'
import { getRiskControlList, getViolationTrace, validatePunishment, generateReviewReport } from '@api/risk-control'
import type { ViolationTrace, PunishmentValidation, ReviewReport, RiskControlLog } from '@/types/business'
import {
  BEHAVIOR_TYPE_NAMES,
  RiskLevel,
  RISK_LEVEL_NAMES,
  RISK_LEVEL_COLORS,
  VIOLATION_TYPE_NAMES,
  PUNISHMENT_TYPE_NAMES,
  PunishmentStatus,
  PUNISHMENT_STATUS_NAMES
} from '@/enums/business'
import HtTable from '@components/HtTable/index.vue'

const route = useRoute()

const formatNumber = (num: number | null | undefined): string => {
  if (num == null) return '-'
  return num.toLocaleString('zh-CN')
}

const statsCards = ref([
  { key: 'totalViolations', label: '违规总数', value: 0, icon: Warning, color: '#f56c6c' },
  { key: 'totalPunishments', label: '处罚总数', value: 0, icon: Operation, color: '#e6a23c' },
  { key: 'interceptedCount', label: '拦截次数', value: 0, icon: Warning, color: '#409eff' },
  { key: 'anomalyCount', label: '异常操作', value: 0, icon: Document, color: '#c45656' }
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
} = useFetchList<RiskControlLog>({
  fetchApi: async (params) => {
    const result = await getRiskControlList(params)
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
    violationType: '',
    riskLevel: undefined as number | undefined,
    intercepted: undefined as number | undefined
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

const traceDialogVisible = ref(false)
const traceLoading = ref(false)
const traceData = ref<ViolationTrace | null>(null)
const traceActiveTab = ref('behavior')

const loadTrace = async (userId: number) => {
  traceLoading.value = true
  traceActiveTab.value = 'behavior'
  try {
    traceData.value = await getViolationTrace(userId)
    traceDialogVisible.value = true
  } catch (error) {
    console.error(error)
  } finally {
    traceLoading.value = false
  }
}

const handleViewTrace = (row: RiskControlLog) => {
  loadTrace(row.userId)
}

const handleRowDoubleClick = (row: unknown) => {
  const log = row as RiskControlLog
  handleViewTrace(log)
}

const validationDialogVisible = ref(false)
const validationLoading = ref(false)
const validationData = ref<PunishmentValidation | null>(null)

const handleValidatePunishment = async (row: RiskControlLog) => {
  validationLoading.value = true
  validationData.value = null
  validationDialogVisible.value = true
  try {
    validationData.value = await validatePunishment(row.userId, {
      punishmentType: row.violationType,
      violationType: row.violationType
    })
  } catch (error) {
    console.error(error)
  } finally {
    validationLoading.value = false
  }
}

const reportDialogVisible = ref(false)
const reportLoading = ref(false)
const reportData = ref<ReviewReport | null>(null)

const violationTypeStats = computed(() => {
  if (!reportData.value?.violationStats?.byType) return []
  return Object.entries(reportData.value.violationStats.byType).map(([type, count]) => ({
    type,
    name: VIOLATION_TYPE_NAMES[type] || type,
    count
  }))
})

const punishmentTypeStats = computed(() => {
  if (!reportData.value?.punishmentStats?.byType) return []
  return Object.entries(reportData.value.punishmentStats.byType).map(([type, count]) => ({
    type,
    name: PUNISHMENT_TYPE_NAMES[type] || type,
    count
  }))
})

const handleGenerateReport = async (row: RiskControlLog) => {
  reportLoading.value = true
  reportData.value = null
  reportDialogVisible.value = true
  try {
    reportData.value = await generateReviewReport(row.userId)
  } catch (error) {
    console.error(error)
  } finally {
    reportLoading.value = false
  }
}

const punishmentStatusTagType = (status: number) => {
  switch (status) {
    case PunishmentStatus.ACTIVE: return 'danger'
    case PunishmentStatus.REVOKED: return 'success'
    case PunishmentStatus.EXPIRED: return 'info'
    case PunishmentStatus.APPEALED: return 'warning'
    default: return 'info'
  }
}

const getRowClassName = ({ row }: { row: RiskControlLog }) => {
  if (row.intercepted === 1 && row.riskLevel === RiskLevel.HIGH) return 'risk-row-high'
  if (row.riskLevel === RiskLevel.HIGH) return 'risk-row-high'
  if (row.riskLevel === RiskLevel.MEDIUM) return 'risk-row-medium'
  return ''
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
  }

  .mb-8 {
    margin-bottom: 8px;
  }

  .mb-16 {
    margin-bottom: 16px;
  }

  :deep(.risk-row-high) {
    background: rgba(245, 108, 108, 0.08) !important;

    &:hover > td {
      background: rgba(245, 108, 108, 0.12) !important;
    }
  }

  :deep(.risk-row-medium) {
    background: rgba(230, 162, 60, 0.08) !important;

    &:hover > td {
      background: rgba(230, 162, 60, 0.12) !important;
    }
  }
}
</style>
