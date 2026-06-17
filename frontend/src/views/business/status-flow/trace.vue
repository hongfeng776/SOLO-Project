<template>
  <div class="ccb-status-flow-trace">
    <CcbPageHeader
      title="状态变更溯源"
      description="基于开户流水号、操作人员实现状态变更全流程溯源"
      icon="Connection"
    />

    <CcbSearchForm v-model="searchForm" @search="handleSearch" @reset="handleReset">
      <el-form-item label="开户流水号" prop="openingNo">
        <el-input v-model="searchForm.openingNo" placeholder="请输入开户流水号" clearable />
      </el-form-item>
      <el-form-item label="操作人员" prop="operatorName">
        <el-input v-model="searchForm.operatorName" placeholder="请输入操作人员姓名" clearable />
      </el-form-item>
      <el-form-item label="时间范围" prop="timeRange">
        <el-date-picker
          v-model="searchForm.timeRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
        />
      </el-form-item>
    </CcbSearchForm>

    <div v-if="loading" class="trace-skeleton">
      <el-row :gutter="16">
        <el-col :span="6"><el-skeleton :rows="3" animated /></el-col>
        <el-col :span="6"><el-skeleton :rows="3" animated /></el-col>
        <el-col :span="6"><el-skeleton :rows="3" animated /></el-col>
        <el-col :span="6"><el-skeleton :rows="3" animated /></el-col>
      </el-row>
      <el-skeleton :rows="8" animated style="margin-top: 16px" />
    </div>

    <div v-else-if="traceResult" class="trace-result">
      <el-row :gutter="16">
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-icon total"><Clock /></div>
            <div class="stat-info">
              <div class="stat-label">变更总次数</div>
              <div class="stat-num">{{ traceResult.statistics.totalCount }}</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-icon success"><Check /></div>
            <div class="stat-info">
              <div class="stat-label">合规次数</div>
              <div class="stat-num success">{{ traceResult.statistics.complianceCount }}</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-icon" :class="traceResult.statistics.violationCount > 0 ? 'danger' : 'success'">
              <CircleCloseFilled />
            </div>
            <div class="stat-info">
              <div class="stat-label">违规次数</div>
              <div class="stat-num" :class="traceResult.statistics.violationCount > 0 ? 'danger' : 'success'">
                {{ traceResult.statistics.violationCount }}
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-icon" :class="traceResult.statistics.overreachCount > 0 ? 'warning' : 'success'">
              <Warning />
            </div>
            <div class="stat-info">
              <div class="stat-label">越权次数</div>
              <div class="stat-num" :class="traceResult.statistics.overreachCount > 0 ? 'warning' : 'success'">
                {{ traceResult.statistics.overreachCount }}
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-card
        v-if="traceResult.statistics.violationCount > 0 || traceResult.statistics.overreachCount > 0"
        shadow="never"
        class="alert-card"
      >
        <el-alert
          v-if="traceResult.statistics.violationCount > 0"
          :title="`检测到 ${traceResult.statistics.violationCount} 条违规操作记录，请及时核查处理`"
          type="error"
          show-icon
          :closable="false"
          style="margin-bottom: 12px"
        />
        <el-alert
          v-if="traceResult.statistics.overreachCount > 0"
          :title="`检测到 ${traceResult.statistics.overreachCount} 条越权操作记录，存在权限管控风险`"
          type="error"
          show-icon
          :closable="false"
        />
      </el-card>

      <el-card
        v-if="traceResult.violations.length > 0"
        shadow="never"
        class="violation-card"
      >
        <template #header>
          <div class="card-header">
            <span>违规/越权详情</span>
            <el-tag type="danger" effect="dark" size="small">{{ traceResult.violations.length }} 条</el-tag>
          </div>
        </template>
        <el-table :data="traceResult.violations" border stripe size="small" max-height="260">
          <el-table-column prop="openingNo" label="流水号" width="200" show-overflow-tooltip />
          <el-table-column prop="operatorName" label="操作人" width="100" />
          <el-table-column prop="violationDetails" label="违规详情" min-width="240" show-overflow-tooltip />
          <el-table-column prop="createdAt" label="操作时间" width="180" />
        </el-table>
      </el-card>

      <el-card shadow="never" class="log-card">
        <template #header>
          <div class="card-header">
            <span>变更日志</span>
            <el-tag type="primary" effect="plain" size="small">共 {{ traceResult.changeLogs.length }} 条</el-tag>
          </div>
        </template>
        <CcbTable
          v-model:page="page"
          v-model:page-size="pageSize"
          :data="pagedLogs"
          :total="traceResult.changeLogs.length"
          :show-index="true"
          stripe
          row-key="id"
          row-class-name="log-row"
        >
          <el-table-column type="expand">
            <template #default="{ row }">
              <div class="expand-content">
                <el-descriptions :column="2" border size="small">
                  <el-descriptions-item label="变更前状态">
                    <el-tag :type="OpeningStatusTagType[row.statusBefore] || 'info'" effect="light" size="small">
                      {{ OpeningStatusText[row.statusBefore] || '未知' }}
                    </el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="变更后状态">
                    <el-tag :type="OpeningStatusTagType[row.statusAfter] || 'info'" effect="light" size="small">
                      {{ OpeningStatusText[row.statusAfter] || '未知' }}
                    </el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="操作类型">
                    <el-tag :type="OperationTypeTagType[row.operationType] || 'info'" effect="light" size="small">
                      {{ OperationTypeText[row.operationType] || row.operationType }}
                    </el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="合规状态">
                    <el-tag :type="ComplianceCheckTagType[row.complianceCheck] || 'info'" effect="light" size="small">
                      {{ ComplianceCheckText[row.complianceCheck] || '未知' }}
                    </el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item v-if="row.operatorRole" label="操作角色">
                    {{ row.operatorRole }}
                  </el-descriptions-item>
                  <el-descriptions-item v-if="row.operationNode" label="操作节点">
                    {{ row.operationNode }}
                  </el-descriptions-item>
                  <el-descriptions-item v-if="row.violationDetails" label="违规详情" :span="2">
                    <span class="violation-text">{{ row.violationDetails }}</span>
                  </el-descriptions-item>
                  <el-descriptions-item v-if="row.remark" label="备注" :span="2">
                    {{ row.remark }}
                  </el-descriptions-item>
                </el-descriptions>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="openingNo" label="流水号" width="200" show-overflow-tooltip />
          <el-table-column prop="operationType" label="操作类型" width="120">
            <template #default="{ row }">
              <el-tag :type="OperationTypeTagType[row.operationType] || 'info'" effect="light" size="small">
                {{ OperationTypeText[row.operationType] || row.operationType }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="statusBefore" label="变更前状态" width="140">
            <template #default="{ row }">
              <el-tag :type="OpeningStatusTagType[row.statusBefore] || 'info'" effect="light" size="small">
                {{ OpeningStatusText[row.statusBefore] || '未知' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="statusAfter" label="变更后状态" width="140">
            <template #default="{ row }">
              <el-tag :type="OpeningStatusTagType[row.statusAfter] || 'info'" effect="light" size="small">
                {{ OpeningStatusText[row.statusAfter] || '未知' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="operatorName" label="操作人" width="100" show-overflow-tooltip />
          <el-table-column prop="operatorRole" label="操作角色" width="120" show-overflow-tooltip>
            <template #default="{ row }">
              <span v-if="row.operatorRole">{{ row.operatorRole }}</span>
              <span v-else class="empty">-</span>
            </template>
          </el-table-column>
          <el-table-column prop="complianceCheck" label="合规状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="ComplianceCheckTagType[row.complianceCheck] || 'info'" effect="light" size="small">
                {{ ComplianceCheckText[row.complianceCheck] || '未知' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="operationNode" label="操作节点" width="140" show-overflow-tooltip>
            <template #default="{ row }">
              <span v-if="row.operationNode">{{ row.operationNode }}</span>
              <span v-else class="empty">-</span>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="操作时间" width="180" />
        </CcbTable>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { Search, Clock, Warning, CircleCheckFilled, CircleCloseFilled, Connection, Check } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import {
  statusFlowApi,
  OpeningType,
  OpeningTypeText,
  OpeningStatus,
  OpeningStatusText,
  OpeningStatusTagType,
  OperationType,
  OperationTypeText,
  type StatusTraceVO
} from '@/api/statusFlow'

const OperationTypeTagType: Record<string, string> = {
  submit: '',
  review_approve: 'success',
  review_reject: 'danger',
  cancel: 'warning',
  void: 'danger',
  resubmit: 'info',
  supplement: 'warning',
  open_account: 'success'
}

const ComplianceCheckText: Record<number, string> = {
  1: '合规',
  0: '违规',
  2: '越权'
}

const ComplianceCheckTagType: Record<number, string> = {
  1: 'success',
  0: 'danger',
  2: 'warning'
}

const loading = ref(false)
const traceResult = ref<StatusTraceVO | null>(null)
const page = ref(1)
const pageSize = ref(10)

const searchForm = reactive({
  openingNo: '',
  operatorName: '',
  timeRange: null as [string, string] | null
})

const pagedLogs = computed(() => {
  if (!traceResult.value) return []
  const start = (page.value - 1) * pageSize.value
  return traceResult.value.changeLogs.slice(start, start + pageSize.value)
})

const handleSearch = async (form: Record<string, unknown>) => {
  const openingNo = (form.openingNo as string) || ''
  const operatorName = (form.operatorName as string) || ''
  const timeRange = form.timeRange as [string, string] | null

  if (!openingNo && !operatorName && !timeRange) {
    ElMessage.warning('请至少输入一个查询条件')
    return
  }

  loading.value = true
  traceResult.value = null
  try {
    traceResult.value = await statusFlowApi.traceStatusChange({
      openingNo: openingNo || undefined,
      operatorName: operatorName || undefined,
      startTime: timeRange?.[0] || undefined,
      endTime: timeRange?.[1] || undefined
    })
  } catch (e: any) {
    ElMessage.error(e.message || '溯源查询失败')
  } finally {
    loading.value = false
  }
}

const handleReset = () => {
  traceResult.value = null
}
</script>

<style lang="scss" scoped>
.ccb-status-flow-trace {
  .trace-skeleton { padding: 8px 0; }
  .trace-result { display: flex; flex-direction: column; gap: 16px; }

  .stat-card {
    display: flex;
    align-items: center;
    gap: 16px;
    border-radius: 10px;
    overflow: hidden;
  }
  .stat-icon {
    width: 56px;
    height: 56px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    color: #fff;
    flex-shrink: 0;
    &.total { background: linear-gradient(135deg, #1755a3, #2f80ff); }
    &.success { background: linear-gradient(135deg, #67c23a, #95d475); }
    &.danger { background: linear-gradient(135deg, #f56c6c, #ff8f8f); }
    &.warning { background: linear-gradient(135deg, #e6a23c, #f5c94e); }
    & :deep(.el-icon) { font-size: 28px; }
  }
  .stat-info { flex: 1; min-width: 0; }
  .stat-label { color: #909399; font-size: 13px; margin-bottom: 4px; }
  .stat-num {
    font-size: 26px;
    font-weight: 700;
    color: #303133;
    &.success { color: #67c23a; }
    &.danger { color: #f56c6c; }
    &.warning { color: #e6a23c; }
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-weight: 600;
  }

  .alert-card {
    background: #fff1f0;
    border-radius: 10px;
  }

  .violation-card {
    border-radius: 10px;
  }

  .log-card {
    border-radius: 10px;
  }

  .expand-content {
    padding: 12px 20px;
  }

  .violation-text {
    color: #f56c6c;
  }

  .empty { color: #c0c4cc; }

  :deep(.log-row) {
    &:hover {
      background-color: rgba(23, 85, 163, 0.04);
    }
  }
}
</style>
