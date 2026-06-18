<template>
  <div class="passenger-operation-trace">
    <div class="trace-header">
      <h3>
        <el-icon><DataAnalysis /></el-icon>
        乘客账号溯源
      </h3>
      <el-button type="primary" :loading="loading" @click="refreshData">
        <el-icon><Refresh /></el-icon>
        刷新
      </el-button>
    </div>

    <el-tabs v-model="activeTab" type="card" class="trace-tabs">
      <el-tab-pane label="操作溯源" name="operation">
        <div class="filter-bar">
          <el-select v-model="filters.operationType" placeholder="操作类型" clearable style="width: 140px">
            <el-option
              v-for="(label, value) in OperationTypeMap"
              :key="value"
              :label="label"
              :value="Number(value)"
            />
          </el-select>
          <el-select v-model="filters.riskLevel" placeholder="风险等级" clearable style="width: 140px">
            <el-option
              v-for="(label, value) in RiskSeverityMap"
              :key="value"
              :label="label"
              :value="Number(value)"
            />
          </el-select>
          <el-select v-model="filters.isBlocked" placeholder="是否被拦截" clearable style="width: 140px">
            <el-option label="已拦截" :value="true" />
            <el-option label="未拦截" :value="false" />
          </el-select>
          <el-button type="primary" @click="loadOperationLogs">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
          <el-button @click="resetFilters">重置</el-button>
        </div>

        <div v-loading="operationLoading" class="table-container">
          <el-table
            :data="operationLogs"
            border
            stripe
            @row-mouseenter="handleRowMouseEnter"
            @row-mouseleave="handleRowMouseLeave"
            :row-class-name="getRowClassName"
          >
            <el-table-column prop="createTime" label="操作时间" width="180">
              <template #default="{ row }">
                {{ formatDate(row.createTime) }}
              </template>
            </el-table-column>
            <el-table-column prop="operationType" label="操作类型" width="120">
              <template #default="{ row }">
                <el-tag :color="getOperationTypeColor(row.operationType)" effect="dark" size="small">
                  {{ getOperationTypeName(row.operationType) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="beforeValue" label="操作前值" min-width="150">
              <template #default="{ row }">
                <span class="value-text">{{ formatValue(row.beforeValue) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="afterValue" label="操作后值" min-width="150">
              <template #default="{ row }">
                <span class="value-text">{{ formatValue(row.afterValue) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="operatorType" label="操作人类型" width="100">
              <template #default="{ row }">
                <el-tag :type="getOperatorTagType(row.operatorType)" size="small">
                  {{ getOperatorTypeName(row.operatorType) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="operatorId" label="操作人" width="100">
              <template #default="{ row }">
                {{ row.operatorId || '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="ip" label="IP" width="130">
              <template #default="{ row }">
                <span class="ip-text">{{ row.ip || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="riskLevel" label="风险等级" width="90">
              <template #default="{ row }">
                <el-tag :color="getRiskLevelColor(row.riskLevel)" effect="dark" size="small">
                  {{ getRiskLevelName(row.riskLevel) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="isBlocked" label="是否被拦截" width="100">
              <template #default="{ row }">
                <el-badge
                  :is-dot="row.isBlocked"
                  :type="row.isBlocked ? 'danger' : 'success'"
                >
                  {{ row.isBlocked ? '已拦截' : '正常' }}
                </el-badge>
              </template>
            </el-table-column>
            <el-table-column prop="blockReason" label="拦截原因" min-width="150">
              <template #default="{ row }">
                <span v-if="row.isBlocked" class="block-reason">{{ row.blockReason || '-' }}</span>
                <span v-else class="text-muted">-</span>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-container">
            <el-pagination
              v-model:current-page="pagination.page"
              v-model:page-size="pagination.pageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="pagination.total"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="风险监控" name="risk">
        <div v-loading="riskLoading" class="risk-container">
          <div class="risk-overview-cards">
            <el-card class="overview-card">
              <div class="card-content">
                <div class="card-icon warning">
                  <el-icon><Warning /></el-icon>
                </div>
                <div class="card-info">
                  <div class="card-value">{{ riskOverview?.pendingRiskCount || 0 }}</div>
                  <div class="card-label">待处理风险数</div>
                </div>
              </div>
            </el-card>
            <el-card class="overview-card">
              <div class="card-content">
                <div class="card-icon danger">
                  <el-icon><CircleClose /></el-icon>
                </div>
                <div class="card-info">
                  <div class="card-value">{{ riskOverview?.highRiskCount || 0 }}</div>
                  <div class="card-label">高风险记录数</div>
                </div>
              </div>
            </el-card>
            <el-card class="overview-card">
              <div class="card-content">
                <div class="card-icon info">
                  <el-icon><DataLine /></el-icon>
                </div>
                <div class="card-info">
                  <div class="card-value">{{ riskOverview?.abnormalOperations || 0 }}</div>
                  <div class="card-label">异常操作数</div>
                </div>
              </div>
            </el-card>
            <el-card class="overview-card">
              <div class="card-content">
                <div class="card-icon success">
                  <el-icon><Lightbulb /></el-icon>
                </div>
                <div class="card-info">
                  <div class="card-label risk-suggestion">{{ getRiskSuggestion() }}</div>
                  <div class="card-sub-label">风险建议</div>
                </div>
              </div>
            </el-card>
          </div>

          <div class="detection-results">
            <el-card class="detection-card" :class="{ 'has-risk': riskOverview?.hasDuplicateRealName }">
              <div class="detection-header">
                <el-icon :class="riskOverview?.hasDuplicateRealName ? 'text-danger' : 'text-success'">
                  <CircleCheck v-if="!riskOverview?.hasDuplicateRealName" />
                  <CircleClose v-else />
                </el-icon>
                <span class="detection-title">重复实名检测</span>
              </div>
              <div class="detection-content">
                <p v-if="riskOverview?.hasDuplicateRealName" class="risk-text">
                  检测到该身份证已绑定 {{ riskOverview?.duplicateAccountCount || 0 }} 个账号，存在重复实名风险
                </p>
                <p v-else class="safe-text">该身份证仅绑定当前账号，无重复实名</p>
              </div>
            </el-card>
            <el-card class="detection-card" :class="{ 'has-risk': riskOverview?.hasFakeRealName }">
              <div class="detection-header">
                <el-icon :class="riskOverview?.hasFakeRealName ? 'text-danger' : 'text-success'">
                  <CircleCheck v-if="!riskOverview?.hasFakeRealName" />
                  <CircleClose v-else />
                </el-icon>
                <span class="detection-title">虚假实名检测</span>
              </div>
              <div class="detection-content">
                <p v-if="riskOverview?.hasFakeRealName" class="risk-text">
                  身份证与姓名不匹配，疑似虚假实名
                </p>
                <p v-else class="safe-text">身份证与姓名匹配，实名信息真实有效</p>
              </div>
            </el-card>
            <el-card class="detection-card" :class="{ 'has-risk': riskOverview?.hasMaliciousPhoneChange }">
              <div class="detection-header">
                <el-icon :class="riskOverview?.hasMaliciousPhoneChange ? 'text-danger' : 'text-success'">
                  <CircleCheck v-if="!riskOverview?.hasMaliciousPhoneChange" />
                  <CircleClose v-else />
                </el-icon>
                <span class="detection-title">恶意改号检测</span>
              </div>
              <div class="detection-content">
                <p v-if="riskOverview?.hasMaliciousPhoneChange" class="risk-text">
                  近24小时内修改手机号 {{ riskOverview?.recentPhoneChangeCount || 0 }} 次，疑似恶意改号
                </p>
                <p v-else class="safe-text">手机号修改频率正常，无恶意改号行为</p>
              </div>
            </el-card>
          </div>

          <div class="risk-lists">
            <el-card class="list-card">
              <template #header>
                <div class="card-header">
                  <el-icon><Document /></el-icon>
                  <span>风险记录（最近10条）</span>
                </div>
              </template>
              <el-timeline v-if="riskOverview?.riskRecords?.length" class="risk-timeline">
                <el-timeline-item
                  v-for="record in riskOverview.riskRecords.slice(0, 10)"
                  :key="record.id"
                  :timestamp="formatDate(record.createTime)"
                  :type="getRiskTimelineType(record.riskLevel)"
                >
                  <div class="timeline-item-content">
                    <div class="timeline-item-header">
                      <el-tag :color="getRiskLevelColor(record.riskLevel)" effect="dark" size="small">
                        {{ getRiskLevelName(record.riskLevel) }}
                      </el-tag>
                      <span class="risk-title">{{ record.title }}</span>
                    </div>
                    <p class="risk-description">{{ record.description }}</p>
                    <div class="risk-meta">
                      <span v-if="record.ruleName" class="meta-item">规则: {{ record.ruleName }}</span>
                      <span class="meta-item">状态: {{ getRiskRecordStatusName(record.status) }}</span>
                    </div>
                  </div>
                </el-timeline-item>
              </el-timeline>
              <el-empty v-else description="暂无风险记录" />
            </el-card>

            <el-card class="list-card">
              <template #header>
                <div class="card-header">
                  <el-icon><Warning /></el-icon>
                  <span>异常操作列表</span>
                </div>
              </template>
              <div v-if="abnormalOperations?.length" class="abnormal-list">
                <div
                  v-for="(item, index) in abnormalOperations"
                  :key="index"
                  class="abnormal-item"
                >
                  <div class="abnormal-icon">
                    <el-icon :color="getRiskLevelColor(item.riskLevel)"><Warning /></el-icon>
                  </div>
                  <div class="abnormal-content">
                    <div class="abnormal-title">
                      {{ getOperationTypeName(item.operationType) }}
                      <el-tag size="small" :color="getRiskLevelColor(item.riskLevel)" effect="dark">
                        {{ getRiskLevelName(item.riskLevel) }}
                      </el-tag>
                    </div>
                    <p class="abnormal-desc">{{ item.blockReason || item.description }}</p>
                    <span class="abnormal-time">{{ formatDate(item.createTime) }}</span>
                  </div>
                </div>
              </div>
              <el-empty v-else description="暂无异常操作" />
            </el-card>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <div
      ref="riskOverviewCard"
      class="risk-overview-popover"
      :style="{ left: popoverPosition.x + 'px', top: popoverPosition.y + 'px', display: popoverVisible ? 'block' : 'none' }"
    >
      <el-card shadow="always" class="popover-card">
        <div class="popover-header">
          <el-icon><User /></el-icon>
          <span>账号风险概况</span>
        </div>
        <div class="popover-content">
          <div class="info-row">
            <span class="info-label">风险标记：</span>
            <el-tag :type="passenger?.isRisk ? 'danger' : 'success'" size="small">
              {{ passenger?.isRisk ? '有风险' : '正常' }}
            </el-tag>
          </div>
          <div class="info-row">
            <span class="info-label">安全等级：</span>
            <el-tag :color="getSecurityLevelColor(passenger?.securityLevel)" effect="dark" size="small">
              {{ getSecurityLevelName(passenger?.securityLevel) }}
            </el-tag>
          </div>
          <div class="info-row">
            <span class="info-label">信誉评分：</span>
            <el-rate
              :model-value="Math.round((passenger?.reputationScore || 0) / 20)"
              disabled
              size="small"
            />
            <span class="score-text">{{ passenger?.reputationScore || 0 }}分</span>
          </div>
          <div class="info-row">
            <span class="info-label">待处理风险：</span>
            <span class="info-value pending">{{ riskOverview?.pendingRiskCount || 0 }} 项</span>
          </div>
          <div class="info-row">
            <span class="info-label">最近异常操作：</span>
            <span class="info-value">{{ riskOverview?.recentEditCount || 0 }} 次</span>
          </div>
          <div class="detection-summary">
            <div class="detection-item" :class="{ 'has-risk': riskOverview?.hasDuplicateRealName }">
              <el-icon><CircleCheck v-if="!riskOverview?.hasDuplicateRealName" /><CircleClose v-else /></el-icon>
              <span>重复实名</span>
            </div>
            <div class="detection-item" :class="{ 'has-risk': riskOverview?.hasFakeRealName }">
              <el-icon><CircleCheck v-if="!riskOverview?.hasFakeRealName" /><CircleClose v-else /></el-icon>
              <span>虚假实名</span>
            </div>
            <div class="detection-item" :class="{ 'has-risk': riskOverview?.hasMaliciousPhoneChange }">
              <el-icon><CircleCheck v-if="!riskOverview?.hasMaliciousPhoneChange" /><CircleClose v-else /></el-icon>
              <span>恶意改号</span>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Refresh,
  DataAnalysis,
  Search,
  Warning,
  CircleClose,
  DataLine,
  Lightbulb,
  CircleCheck,
  Document,
  User
} from '@element-plus/icons-vue'
import { getOperationLogsApi, getRiskOverviewApi } from '@/api/passenger'
import {
  OperationTypeMap,
  OperationTypeColorMap,
  OperatorTypeMap,
  OperatorType,
  SecurityLevelMap,
  SecurityLevelColorMap
} from '@/enums/passenger'
import {
  RiskSeverityMap,
  RiskSeverityColorMap,
  RiskSeverity,
  RiskRecordStatus,
  RiskRecordStatusMap
} from '@/enums/risk'
import { formatDate } from '@/utils/format'
import type { Passenger, PassengerOperationLog, RiskOverview } from '@/types/passenger'

interface Props {
  passengerId: number
  passenger?: Passenger
}

const props = defineProps<Props>()

const activeTab = ref('operation')
const loading = ref(false)
const operationLoading = ref(false)
const riskLoading = ref(false)

const operationLogs = ref<PassengerOperationLog[]>([])
const riskOverview = ref<RiskOverview | null>(null)

const filters = reactive({
  operationType: null as number | null,
  riskLevel: null as number | null,
  isBlocked: null as boolean | null
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const popoverVisible = ref(false)
const popoverPosition = reactive({ x: 0, y: 0 })
const riskOverviewCard = ref<HTMLElement | null>(null)

const abnormalOperations = ref<PassengerOperationLog[]>([])

const loadOperationLogs = async () => {
  operationLoading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      operationType: filters.operationType,
      riskLevel: filters.riskLevel,
      isBlocked: filters.isBlocked
    }
    const res = await getOperationLogsApi(props.passengerId, params)
    operationLogs.value = res.data?.list || res.data || []
    pagination.total = res.data?.total || res.data?.length || 0
  } catch (error: any) {
    ElMessage.error(error.message || '加载操作记录失败')
  } finally {
    operationLoading.value = false
  }
}

const loadRiskOverview = async () => {
  riskLoading.value = true
  try {
    const res = await getRiskOverviewApi(props.passengerId)
    riskOverview.value = res.data
    abnormalOperations.value = operationLogs.value.filter(log => log.riskLevel === RiskSeverity.HIGH || log.isBlocked)
  } catch (error: any) {
    ElMessage.error(error.message || '加载风险概览失败')
  } finally {
    riskLoading.value = false
  }
}

const refreshData = () => {
  if (activeTab.value === 'operation') {
    loadOperationLogs()
  } else {
    loadRiskOverview()
  }
}

const resetFilters = () => {
  filters.operationType = null
  filters.riskLevel = null
  filters.isBlocked = null
  pagination.page = 1
  loadOperationLogs()
}

const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
  loadOperationLogs()
}

const handleCurrentChange = (page: number) => {
  pagination.page = page
  loadOperationLogs()
}

const handleRowMouseEnter = (row: PassengerOperationLog, event: MouseEvent) => {
  showRiskOverview(event.clientX + 10, event.clientY + 10)
}

const handleRowMouseLeave = () => {
  hideRiskOverview()
}

const showRiskOverview = (x: number, y: number) => {
  popoverPosition.x = x
  popoverPosition.y = y
  popoverVisible.value = true
}

const hideRiskOverview = () => {
  popoverVisible.value = false
}

defineExpose({
  showRiskOverview,
  hideRiskOverview
})

const getOperationTypeName = (type: number | string) => {
  return OperationTypeMap[type] || type || '未知'
}

const getOperationTypeColor = (type: number | string) => {
  return OperationTypeColorMap[type] || '#909399'
}

const getOperatorTypeName = (type: number) => {
  return OperatorTypeMap[type] || '未知'
}

const getOperatorTagType = (type: number) => {
  const typeMap: Record<number, string> = {
    [OperatorType.USER]: 'primary',
    [OperatorType.ADMIN]: 'warning',
    [OperatorType.SYSTEM]: 'info'
  }
  return typeMap[type] || ''
}

const getRiskLevelName = (level: number) => {
  return RiskSeverityMap[level] || '未知'
}

const getRiskLevelColor = (level: number) => {
  return RiskSeverityColorMap[level] || '#909399'
}

const getSecurityLevelName = (level: number | undefined) => {
  if (level === undefined) return '未知'
  return SecurityLevelMap[level] || '未知'
}

const getSecurityLevelColor = (level: number | undefined) => {
  if (level === undefined) return '#909399'
  return SecurityLevelColorMap[level] || '#909399'
}

const getRiskRecordStatusName = (status: number) => {
  return RiskRecordStatusMap[status] || '未知'
}

const getRiskTimelineType = (level: number) => {
  const typeMap: Record<number, string> = {
    [RiskSeverity.LOW]: 'success',
    [RiskSeverity.MEDIUM]: 'warning',
    [RiskSeverity.HIGH]: 'danger'
  }
  return typeMap[level] || 'primary'
}

const getRowClassName = ({ row }: { row: PassengerOperationLog }) => {
  return row.isBlocked ? 'blocked-row' : ''
}

const formatValue = (value: any) => {
  if (value === null || value === undefined || value === '') return '-'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

const getRiskSuggestion = () => {
  if (riskOverview.value?.hasDuplicateRealName || riskOverview.value?.hasFakeRealName) {
    return '建议立即人工核验实名信息'
  }
  if (riskOverview.value?.hasMaliciousPhoneChange) {
    return '建议限制账号修改功能'
  }
  if (riskOverview.value?.pendingRiskCount && riskOverview.value.pendingRiskCount > 0) {
    return '建议及时处理待处理风险'
  }
  if (riskOverview.value?.highRiskCount && riskOverview.value.highRiskCount > 0) {
    return '建议关注高风险记录'
  }
  return '账号状态良好，继续保持'
}

watch(() => activeTab.value, (newVal) => {
  if (newVal === 'risk') {
    loadRiskOverview()
  }
})

onMounted(() => {
  loadOperationLogs()
  loadRiskOverview()
})
</script>

<style lang="scss" scoped>
.passenger-operation-trace {
  .trace-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h3 {
      margin: 0;
      font-size: 16px;
      color: #303133;
      display: flex;
      align-items: center;
      gap: 8px;

      .el-icon {
        color: #409eff;
      }
    }
  }

  .trace-tabs {
    :deep(.el-tabs__item.is-active) {
      background: #409eff;
      color: #fff;
      border-color: #409eff;
    }
  }

  .filter-bar {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
    padding: 16px;
    background: #f5f7fa;
    border-radius: 8px;
  }

  .table-container {
    .value-text {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      color: #606266;
    }

    .ip-text {
      font-family: 'Courier New', monospace;
      color: #909399;
    }

    .block-reason {
      color: #f56c6c;
      font-weight: 500;
    }

    .text-muted {
      color: #c0c4cc;
    }

    :deep(.blocked-row) {
      background-color: #fef0f0 !important;

      td {
        background-color: #fef0f0 !important;
      }
    }

    :deep(.el-table__row:hover) {
      cursor: help;
    }
  }

  .pagination-container {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }

  .risk-container {
    .risk-overview-cards {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 20px;

      .overview-card {
        :deep(.el-card__body) {
          padding: 20px;
        }

        .card-content {
          display: flex;
          align-items: center;
          gap: 16px;

          .card-icon {
            width: 56px;
            height: 56px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            color: #fff;

            &.warning {
              background: linear-gradient(135deg, #e6a23c, #f5a623);
            }

            &.danger {
              background: linear-gradient(135deg, #f56c6c, #e74c3c);
            }

            &.info {
              background: linear-gradient(135deg, #409eff, #3498db);
            }

            &.success {
              background: linear-gradient(135deg, #67c23a, #27ae60);
            }
          }

          .card-info {
            flex: 1;

            .card-value {
              font-size: 28px;
              font-weight: 700;
              color: #303133;
              line-height: 1.2;
            }

            .card-label {
              font-size: 13px;
              color: #909399;
              margin-top: 4px;

              &.risk-suggestion {
                font-size: 13px;
                font-weight: 500;
                color: #606266;
                line-height: 1.4;
              }
            }

            .card-sub-label {
              font-size: 12px;
              color: #c0c4cc;
              margin-top: 2px;
            }
          }
        }
      }
    }

    .detection-results {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 20px;

      .detection-card {
        transition: all 0.3s;

        &.has-risk {
          border-color: #f56c6c;

          :deep(.el-card__body) {
            background-color: #fef0f0;
          }
        }

        .detection-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;

          .detection-title {
            font-size: 15px;
            font-weight: 600;
            color: #303133;
          }

          .text-success {
            color: #67c23a;
            font-size: 20px;
          }

          .text-danger {
            color: #f56c6c;
            font-size: 20px;
          }
        }

        .detection-content {
          .risk-text {
            color: #f56c6c;
            margin: 0;
            font-size: 13px;
            line-height: 1.5;
          }

          .safe-text {
            color: #67c23a;
            margin: 0;
            font-size: 13px;
            line-height: 1.5;
          }
        }
      }
    }

    .risk-lists {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;

      .list-card {
        .card-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          color: #303133;

          .el-icon {
            color: #409eff;
          }
        }

        .risk-timeline {
          max-height: 400px;
          overflow-y: auto;
          padding-right: 8px;

          :deep(.el-timeline-item__content) {
            padding-left: 8px;
          }

          .timeline-item-content {
            .timeline-item-header {
              display: flex;
              align-items: center;
              gap: 8px;
              margin-bottom: 6px;

              .risk-title {
                font-size: 14px;
                font-weight: 500;
                color: #303133;
              }
            }

            .risk-description {
              font-size: 13px;
              color: #606266;
              margin: 0 0 6px 0;
              line-height: 1.5;
            }

            .risk-meta {
              display: flex;
              gap: 16px;
              font-size: 12px;
              color: #909399;

              .meta-item {
                display: flex;
                align-items: center;
                gap: 4px;
              }
            }
          }
        }

        .abnormal-list {
          max-height: 400px;
          overflow-y: auto;

          .abnormal-item {
            display: flex;
            gap: 12px;
            padding: 12px;
            margin-bottom: 8px;
            background: #f5f7fa;
            border-radius: 8px;
            transition: all 0.2s;

            &:last-child {
              margin-bottom: 0;
            }

            &:hover {
              background: #ebeef5;
            }

            .abnormal-icon {
              flex-shrink: 0;
              width: 32px;
              height: 32px;
              border-radius: 50%;
              background: #fff;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 18px;
            }

            .abnormal-content {
              flex: 1;
              min-width: 0;

              .abnormal-title {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 4px;
                font-size: 14px;
                font-weight: 500;
                color: #303133;
              }

              .abnormal-desc {
                font-size: 13px;
                color: #606266;
                margin: 0 0 4px 0;
                line-height: 1.4;
              }

              .abnormal-time {
                font-size: 12px;
                color: #909399;
              }
            }
          }
        }
      }
    }
  }

  .risk-overview-popover {
    position: fixed;
    z-index: 3000;
    pointer-events: none;

    .popover-card {
      width: 320px;

      :deep(.el-card__body) {
        padding: 0;
      }

      .popover-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 16px;
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: #fff;
        font-weight: 600;
        border-radius: 8px 8px 0 0;
      }

      .popover-content {
        padding: 16px;

        .info-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;

          &:last-child {
            margin-bottom: 0;
          }

          .info-label {
            font-size: 13px;
            color: #909399;
            min-width: 90px;
            flex-shrink: 0;
          }

          .info-value {
            font-size: 14px;
            font-weight: 500;
            color: #303133;

            &.pending {
              color: #e6a23c;
            }
          }

          .score-text {
            margin-left: 8px;
            font-size: 13px;
            color: #606266;
          }
        }

        .detection-summary {
          display: flex;
          justify-content: space-around;
          margin-top: 16px;
          padding-top: 12px;
          border-top: 1px solid #ebeef5;

          .detection-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            font-size: 12px;
            color: #67c23a;

            .el-icon {
              font-size: 20px;
            }

            &.has-risk {
              color: #f56c6c;
            }
          }
        }
      }
    }
  }
}
</style>
