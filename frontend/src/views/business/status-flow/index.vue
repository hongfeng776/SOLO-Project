<template>
  <div class="ccb-status-flow">
    <CcbPageHeader
      title="状态流转管控"
      description="开户申请全流程状态管理与流转控制"
      icon="Switch"
    />

    <CcbSearchForm v-model="searchForm" @search="handleSearch" @reset="handleReset">
      <el-form-item label="开户类型" prop="openingType">
        <el-select v-model="searchForm.openingType" placeholder="请选择开户类型" clearable>
          <el-option v-for="(t, k) in OpeningTypeText" :key="k" :label="t" :value="Number(k)" />
        </el-select>
      </el-form-item>
      <el-form-item label="当前状态" prop="currentStatus">
        <el-select v-model="searchForm.currentStatus" placeholder="请选择状态" clearable>
          <el-option v-for="(t, k) in OpeningStatusText" :key="k" :label="t" :value="Number(k)" />
        </el-select>
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
      <el-form-item label="关键词" prop="keyword">
        <el-input v-model="searchForm.keyword" placeholder="流水号/客户名/证件号" clearable />
      </el-form-item>
    </CcbSearchForm>

    <div class="stats-cards">
      <div class="stat-card pending" @click="quickFilter('pending')">
        <div class="stat-icon"><el-icon><Clock /></el-icon></div>
        <div class="stat-info">
          <div class="stat-num">{{ stats.pending }}</div>
          <div class="stat-label">待处理</div>
        </div>
      </div>
      <div class="stat-card reviewing" @click="quickFilter('reviewing')">
        <div class="stat-icon"><el-icon><Loading /></el-icon></div>
        <div class="stat-info">
          <div class="stat-num">{{ stats.reviewing }}</div>
          <div class="stat-label">审核中</div>
        </div>
      </div>
      <div class="stat-card passed" @click="quickFilter('passed')">
        <div class="stat-icon"><el-icon><CircleCheckFilled /></el-icon></div>
        <div class="stat-info">
          <div class="stat-num">{{ stats.passed }}</div>
          <div class="stat-label">已通过</div>
        </div>
      </div>
      <div class="stat-card rejected" @click="quickFilter('rejected')">
        <div class="stat-icon"><el-icon><CircleCloseFilled /></el-icon></div>
        <div class="stat-info">
          <div class="stat-num">{{ stats.rejected }}</div>
          <div class="stat-label">已驳回</div>
        </div>
      </div>
    </div>

    <el-table
      v-loading="loading"
      :data="tableData"
      highlight-current-row
      stripe
      row-class-name="flow-row"
      @row-click="handleRowClick"
      class="flow-table"
    >
      <el-table-column type="index" label="序号" width="60" />
      <el-table-column prop="openingNo" label="流水号" width="180" show-overflow-tooltip />
      <el-table-column prop="openingType" label="开户类型" width="100">
        <template #default="{ row }">
          <el-tag :type="row.openingType === OpeningType.PERSONAL ? 'primary' : 'success'" effect="light" size="small">
            {{ OpeningTypeText[row.openingType] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="customerName" label="客户名" width="120" show-overflow-tooltip />
      <el-table-column prop="idCardNo" label="证件号" width="180" show-overflow-tooltip />
      <el-table-column prop="accountTypeText" label="账户类型" width="120" />
      <el-table-column prop="riskLevelText" label="风险等级" width="90" />
      <el-table-column prop="currentStatus" label="当前状态" width="140">
        <template #default="{ row }">
          <div class="status-tag-area" :class="getRowSlideClass(row)">
            <el-tag
              :type="OpeningStatusTagType[row.currentStatus] || 'info'"
              :effect="OpeningStatusColor[row.currentStatus] === 'primary' ? 'dark' : 'light'"
              size="small"
              :class="['status-tag', `status-${OpeningStatusColor[row.currentStatus] || 'info'}`]"
            >
              {{ OpeningStatusText[row.currentStatus] }}
            </el-tag>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="materialsComplete" label="资料完整性" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.materialsComplete ? 'success' : 'warning'" effect="light" size="small">
            {{ row.materialsComplete ? '完整' : '不完整' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="reviewProgress" label="审核进度" width="120">
        <template #default="{ row }">
          <el-progress
            :percentage="parseProgress(row.reviewProgress)"
            :status="getProgressStatus(row.currentStatus)"
            :stroke-width="14"
            :text-inside="true"
          />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="280" fixed="right">
        <template #default="{ row }">
          <el-button
            v-if="row.canSubmit"
            type="primary" link size="small"
            class="btn-click-feedback"
            @click.stop="handleAction(row, OperationType.SUBMIT)"
          >
            <span class="ripple-btn" v-ripple>提交</span>
          </el-button>
          <el-button
            v-if="row.canReview"
            type="success" link size="small"
            class="btn-click-feedback"
            @click.stop="handleAction(row, OperationType.REVIEW_APPROVE)"
          >
            <span class="ripple-btn" v-ripple>审核</span>
          </el-button>
          <el-button
            v-if="row.canReview"
            type="danger" link size="small"
            class="btn-click-feedback"
            @click.stop="handleAction(row, OperationType.REVIEW_REJECT)"
          >
            <span class="ripple-btn" v-ripple>驳回</span>
          </el-button>
          <el-button
            v-if="row.canCancel"
            type="warning" link size="small"
            class="btn-click-feedback"
            @click.stop="handleAction(row, OperationType.CANCEL)"
          >
            <span class="ripple-btn" v-ripple>取消</span>
          </el-button>
          <el-button
            v-if="row.canVoid"
            type="danger" link size="small"
            class="btn-click-feedback"
            @click.stop="handleAction(row, OperationType.VOID)"
          >
            <span class="ripple-btn" v-ripple>作废</span>
          </el-button>
          <el-button
            v-if="row.canResubmit"
            type="primary" link size="small"
            class="btn-click-feedback"
            @click.stop="handleAction(row, OperationType.RESUBMIT)"
          >
            <span class="ripple-btn" v-ripple>重新提交</span>
          </el-button>
          <el-button
            v-if="row.canSupplement"
            type="info" link size="small"
            class="btn-click-feedback"
            @click.stop="handleAction(row, OperationType.SUPPLEMENT)"
          >
            <span class="ripple-btn" v-ripple>补充资料</span>
          </el-button>
          <el-button type="info" link size="small" @click.stop="openDetail(row)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="ccb-pagination">
      <el-pagination
        v-model:current-page="pageParams.page"
        v-model:page-size="pageParams.pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @size-change="fetchData"
        @current-change="fetchData"
      />
    </div>

    <el-drawer
      v-model="drawerVisible"
      :title="`状态流转详情 - ${currentRow?.openingNo || ''}`"
      size="680px"
      :close-on-click-modal="false"
      destroy-on-close
      class="flow-drawer"
    >
      <el-tabs v-model="activeTab">
        <el-tab-pane label="基础信息" name="basic">
          <el-descriptions :column="2" border size="default" v-if="currentRow">
            <el-descriptions-item label="流水号">{{ currentRow.openingNo }}</el-descriptions-item>
            <el-descriptions-item label="开户类型">{{ OpeningTypeText[currentRow.openingType] }}</el-descriptions-item>
            <el-descriptions-item label="客户名">{{ currentRow.customerName }}</el-descriptions-item>
            <el-descriptions-item label="证件号">{{ currentRow.idCardNo }}</el-descriptions-item>
            <el-descriptions-item label="账户类型">{{ currentRow.accountTypeText }}</el-descriptions-item>
            <el-descriptions-item label="风险等级">{{ currentRow.riskLevelText }}</el-descriptions-item>
            <el-descriptions-item label="当前状态">
              <el-tag
                :type="OpeningStatusTagType[currentRow.currentStatus] || 'info'"
                :effect="OpeningStatusColor[currentRow.currentStatus] === 'primary' ? 'dark' : 'light'"
                size="small"
              >
                {{ OpeningStatusText[currentRow.currentStatus] }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="资料完整性">
              <el-tag :type="currentRow.materialsComplete ? 'success' : 'warning'" effect="light" size="small">
                {{ currentRow.materialsComplete ? '完整' : '不完整' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="审核进度" :span="2">
              <el-progress
                :percentage="parseProgress(currentRow.reviewProgress)"
                :status="getProgressStatus(currentRow.currentStatus)"
                :stroke-width="16"
                :text-inside="true"
              />
            </el-descriptions-item>
            <el-descriptions-item v-if="currentRow.lastOperationTime" label="最后操作时间">
              {{ currentRow.lastOperationTime }}
            </el-descriptions-item>
            <el-descriptions-item v-if="currentRow.lastOperator" label="最后操作人">
              {{ currentRow.lastOperator }}
            </el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>

        <el-tab-pane label="状态变更记录" name="timeline">
          <el-timeline v-if="changeLogs.length > 0">
            <el-timeline-item
              v-for="log in changeLogs"
              :key="log.id"
              :timestamp="log.createdAt"
              :type="getTimelineType(log.operationType)"
              :hollow="false"
            >
              <el-card shadow="never" class="log-card">
                <div class="log-header">
                  <el-tag :type="getLogTagType(log.operationType)" effect="dark" size="small">
                    {{ log.operationTypeText }}
                  </el-tag>
                  <span class="log-operator">{{ log.operatorName }}</span>
                  <el-tag v-if="log.operatorRole" type="info" effect="plain" size="small">
                    {{ log.operatorRole }}
                  </el-tag>
                </div>
                <div class="log-body">
                  <div class="log-status-change">
                    <span class="status-from">{{ log.statusBeforeText }}</span>
                    <el-icon class="arrow-icon"><Right /></el-icon>
                    <span class="status-to">{{ log.statusAfterText }}</span>
                  </div>
                  <div v-if="log.remark" class="log-remark">备注：{{ log.remark }}</div>
                  <div v-if="log.complianceCheck === 2" class="log-violation">
                    <el-tag type="danger" effect="light" size="small">合规违规</el-tag>
                    <span>{{ log.violationDetails }}</span>
                  </div>
                </div>
              </el-card>
            </el-timeline-item>
          </el-timeline>
          <el-empty v-else description="暂无状态变更记录" />
        </el-tab-pane>

        <el-tab-pane label="同步结果" name="sync">
          <template v-if="latestTransition && latestTransition.syncResult">
            <el-descriptions :column="1" border size="default">
              <el-descriptions-item label="客户状态同步">
                <el-tag :type="latestTransition.syncResult.customerStatusSynced ? 'success' : 'danger'" effect="light" size="small">
                  {{ latestTransition.syncResult.customerStatusSynced ? '已同步' : '未同步' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="账户状态同步">
                <el-tag :type="latestTransition.syncResult.accountStatusSynced ? 'success' : 'danger'" effect="light" size="small">
                  {{ latestTransition.syncResult.accountStatusSynced ? '已同步' : '未同步' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="风险备案同步">
                <el-tag :type="latestTransition.syncResult.riskFilingSynced ? 'success' : 'danger'" effect="light" size="small">
                  {{ latestTransition.syncResult.riskFilingSynced ? '已同步' : '未同步' }}
                </el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </template>
          <el-empty v-else description="暂无同步结果" />
        </el-tab-pane>
      </el-tabs>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import {
  Clock, Loading, CircleCheckFilled, CircleCloseFilled, Right
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  statusFlowApi,
  OpeningType, OpeningTypeText, OpeningStatus, OpeningStatusText,
  OpeningStatusColor, OpeningStatusTagType, OperationType, OperationTypeText,
  type StatusFlowItem, type StatusChangeLogVO, type StatusTransitionResult
} from '@/api/statusFlow'

const loading = ref(false)
const tableData = ref<StatusFlowItem[]>([])
const total = ref(0)
const currentRow = ref<StatusFlowItem | null>(null)

const searchForm = reactive({
  openingType: null as number | null,
  currentStatus: null as number | null,
  statuses: null as number[] | null,
  timeRange: [] as string[],
  keyword: ''
})

const pageParams = reactive({
  page: 1,
  pageSize: 10
})

const stats = reactive({
  pending: 0,
  reviewing: 0,
  passed: 0,
  rejected: 0
})

const rowSlideMap = reactive<Record<string, string>>({})

const drawerVisible = ref(false)
const activeTab = ref('basic')
const changeLogs = ref<StatusChangeLogVO[]>([])
const latestTransition = ref<StatusTransitionResult | null>(null)

const userInfo = computed(() => {
  try {
    const store = (window as any).__USER_STORE__ || {}
    return store.userInfo || JSON.parse(localStorage.getItem('userInfo') || '{}')
  } catch { return {} }
})

const userRoles = computed<string[]>(() => userInfo.value.roles || [])
const userPermissions = computed<string[]>(() => userInfo.value.permissions || [])

const hasRole = (roles: string[]) => roles.some(r => userRoles.value.includes(r))
const hasPermission = (perm: string) => userPermissions.value.includes(perm) || hasRole(['admin'])

const getRowSlideClass = (row: StatusFlowItem): string => {
  return rowSlideMap[row.id] || ''
}

const triggerSlideAnimation = (rowId: string, direction: 'left' | 'right') => {
  rowSlideMap[rowId] = direction === 'left' ? 'slide-left' : 'slide-right'
  setTimeout(() => {
    rowSlideMap[rowId] = ''
  }, 400)
}

const parseProgress = (val: string | undefined): number => {
  if (!val) return 0
  const n = parseInt(val, 10)
  return isNaN(n) ? 0 : Math.min(100, Math.max(0, n))
}

const getProgressStatus = (status: number): '' | 'success' | 'warning' | 'exception' => {
  if (status === OpeningStatus.OPENED) return 'success'
  if (status === OpeningStatus.REJECTED || status === OpeningStatus.DENIED) return 'exception'
  if (status === OpeningStatus.CANCELLED) return 'warning'
  return ''
}

const getTimelineType = (op: string): string => {
  if (op === OperationType.REVIEW_APPROVE || op === OperationType.OPEN_ACCOUNT) return 'success'
  if (op === OperationType.REVIEW_REJECT || op === OperationType.VOID) return 'danger'
  if (op === OperationType.CANCEL) return 'warning'
  return 'primary'
}

const getLogTagType = (op: string): string => {
  if (op === OperationType.REVIEW_APPROVE || op === OperationType.OPEN_ACCOUNT) return 'success'
  if (op === OperationType.REVIEW_REJECT || op === OperationType.VOID) return 'danger'
  if (op === OperationType.CANCEL) return 'warning'
  return 'primary'
}

const calculateStats = (list: StatusFlowItem[]) => {
  stats.pending = list.filter(r =>
    r.currentStatus === OpeningStatus.PENDING_PRECHECK ||
    r.currentStatus === OpeningStatus.PRECHECK_PASSED
  ).length
  stats.reviewing = list.filter(r =>
    r.currentStatus === OpeningStatus.FILLING ||
    r.currentStatus === OpeningStatus.PENDING_REVIEW
  ).length
  stats.passed = list.filter(r =>
    r.currentStatus === OpeningStatus.REVIEW_PASSED ||
    r.currentStatus === OpeningStatus.OPENED
  ).length
  stats.rejected = list.filter(r =>
    r.currentStatus === OpeningStatus.REJECTED ||
    r.currentStatus === OpeningStatus.DENIED
  ).length
}

const fetchData = async () => {
  loading.value = true
  try {
    const params: any = {
      page: pageParams.page,
      pageSize: pageParams.pageSize,
      openingType: searchForm.openingType ?? undefined,
      status: searchForm.currentStatus ?? undefined,
      statuses: searchForm.statuses && searchForm.statuses.length > 0 ? searchForm.statuses.join(',') : undefined,
      keyword: searchForm.keyword || undefined,
      startTime: searchForm.timeRange?.[0] || undefined,
      endTime: searchForm.timeRange?.[1] || undefined
    }
    const res = await statusFlowApi.getFlowList(params)
    tableData.value = res.list || []
    total.value = res.total || 0
    if (res.statistics) {
      stats.pending = res.statistics.pending ?? 0
      stats.reviewing = res.statistics.reviewing ?? 0
      stats.passed = res.statistics.passed ?? 0
      stats.rejected = res.statistics.rejected ?? 0
    }
  } catch (e: any) {
    ElMessage.error(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pageParams.page = 1
  fetchData()
}

const handleReset = () => {
  Object.assign(searchForm, {
    openingType: null,
    currentStatus: null,
    statuses: null,
    timeRange: [],
    keyword: ''
  })
  pageParams.page = 1
  fetchData()
}

const handleRowClick = (row: StatusFlowItem) => {
  currentRow.value = row
}

const quickFilter = (category: string) => {
  const statusMap: Record<string, number[]> = {
    pending: [OpeningStatus.PENDING_PRECHECK, OpeningStatus.PRECHECK_PASSED],
    reviewing: [OpeningStatus.FILLING, OpeningStatus.PENDING_REVIEW],
    passed: [OpeningStatus.REVIEW_PASSED, OpeningStatus.OPENED],
    rejected: [OpeningStatus.REJECTED, OpeningStatus.DENIED]
  }
  const statuses = statusMap[category]
  if (!statuses) return
  if (statuses.length === 1) {
    searchForm.currentStatus = statuses[0]
    searchForm.statuses = null
  } else {
    searchForm.currentStatus = null
    searchForm.statuses = [...statuses]
  }
  pageParams.page = 1
  fetchData()
}

const getTargetStatus = (row: StatusFlowItem, op: string): number => {
  const map: Record<string, number> = {
    [OperationType.SUBMIT]: OpeningStatus.PRECHECK_PASSED,
    [OperationType.REVIEW_APPROVE]: OpeningStatus.REVIEW_PASSED,
    [OperationType.REVIEW_REJECT]: OpeningStatus.REJECTED,
    [OperationType.CANCEL]: OpeningStatus.CANCELLED,
    [OperationType.VOID]: OpeningStatus.CANCELLED,
    [OperationType.RESUBMIT]: OpeningStatus.PENDING_PRECHECK,
    [OperationType.SUPPLEMENT]: row.currentStatus,
    [OperationType.OPEN_ACCOUNT]: OpeningStatus.OPENED
  }
  return map[op] ?? row.currentStatus
}

const handleAction = async (row: StatusFlowItem, op: string) => {
  const targetStatus = getTargetStatus(row, op)
  const opText = OperationTypeText[op] || op

  try {
    const checkResult = await statusFlowApi.checkTransition({
      openingType: row.openingType,
      openingId: row.id,
      targetStatus,
      operationType: op
    })

    if (!checkResult.canTransition) {
      const reasons = checkResult.reasons.length > 0
        ? checkResult.reasons.join('；')
        : '不满足流转条件'
      ElMessage.warning(reasons)
      return
    }

    await ElMessageBox.confirm(
      `确认对申请 ${row.openingNo} 执行【${opText}】操作？\n状态变更：${checkResult.currentStatusText} → ${checkResult.targetStatusText}`,
      '确认操作',
      { type: 'warning', confirmButtonText: '确认', cancelButtonText: '取消' }
    )

    const isForward = targetStatus > row.currentStatus
    triggerSlideAnimation(row.id, isForward ? 'left' : 'right')

    const remark = await promptRemarkIfNeeded(op)
    if (needsRemarkButCancelled(op, remark)) {
      return
    }

    const result = await statusFlowApi.executeTransition({
      openingType: row.openingType,
      openingId: row.id,
      targetStatus,
      operationType: op,
      remark
    })

    if (result.success) {
      ElMessage.success(`${opText}成功：${result.statusBeforeText} → ${result.statusAfterText}`)
      if (result.syncResult) {
        latestTransition.value = result
      }
      fetchData()
    } else {
      ElMessage.error(`${opText}失败`)
    }
  } catch (e: any) {
    if (e !== 'cancel' && e?.toString() !== 'cancel') {
      ElMessage.error(e.message || '操作失败')
    }
  }
}

const promptRemarkIfNeeded = async (op: string): Promise<string | undefined> => {
  const needsRemark = [
    OperationType.REVIEW_REJECT,
    OperationType.CANCEL,
    OperationType.VOID
  ]
  if (!needsRemark.includes(op as OperationType)) return undefined

  try {
    const { value } = await ElMessageBox.prompt(
      '请输入操作原因',
      OperationTypeText[op],
      { confirmButtonText: '确定', cancelButtonText: '取消', inputPlaceholder: '请输入原因' }
    )
    return value
  } catch {
    return undefined
  }
}

const needsRemarkButCancelled = (op: string, remark: string | undefined): boolean => {
  const needsRemark = [
    OperationType.REVIEW_REJECT,
    OperationType.CANCEL,
    OperationType.VOID
  ]
  if (!needsRemark.includes(op as OperationType)) return false
  return remark === undefined
}

const openDetail = async (row: StatusFlowItem) => {
  currentRow.value = row
  activeTab.value = 'basic'
  drawerVisible.value = true
  changeLogs.value = []
  latestTransition.value = null

  try {
    const traceResult = await statusFlowApi.traceStatusChange({
      openingNo: row.openingNo
    })
    changeLogs.value = traceResult.changeLogs || []
  } catch (e: any) {
    ElMessage.error(e.message || '加载变更记录失败')
  }
}

onMounted(() => fetchData())
</script>

<style lang="scss" scoped>
.ccb-status-flow {
  .stats-cards {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 16px;

    .stat-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px 24px;
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
      }

      .stat-icon {
        width: 52px;
        height: 52px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28px;
      }

      .stat-info {
        .stat-num {
          font-size: 28px;
          font-weight: 700;
          line-height: 1.2;
        }
        .stat-label {
          font-size: 13px;
          color: #909399;
          margin-top: 4px;
        }
      }

      &.pending {
        .stat-icon { background: #ecf5ff; color: #409eff; }
        .stat-num { color: #409eff; }
      }
      &.reviewing {
        .stat-icon { background: #fdf6ec; color: #e6a23c; }
        .stat-num { color: #e6a23c; }
      }
      &.passed {
        .stat-icon { background: #f0f9eb; color: #67c23a; }
        .stat-num { color: #67c23a; }
      }
      &.rejected {
        .stat-icon { background: #fef0f0; color: #f56c6c; }
        .stat-num { color: #f56c6c; }
      }
    }
  }

  .flow-table {
    :deep(.flow-row) {
      transition: all 0.25s ease;
      cursor: pointer;

      &:hover {
        background-color: rgba(23, 85, 163, 0.04) !important;
      }
    }

    :deep(.el-table__body tr.current-row > td) {
      background-color: rgba(64, 158, 255, 0.12) !important;
    }
  }

  .status-tag-area {
    display: inline-flex;
    align-items: center;
    transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.35s ease;

    &.slide-left {
      animation: slideLeft 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }
    &.slide-right {
      animation: slideRight 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }
  }

  @keyframes slideLeft {
    0% { transform: translateX(20px); opacity: 0; }
    100% { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideRight {
    0% { transform: translateX(-20px); opacity: 0; }
    100% { transform: translateX(0); opacity: 1; }
  }

  .status-tag {
    &.status-info {
      color: #909399;
    }
    &.status-warning {
      color: #e6a23c;
    }
    &.status-primary {
      color: #1755a3;
    }
    &.status-success {
      color: #67c23a;
    }
    &.status-danger {
      color: #f56c6c;
    }
  }

  .btn-click-feedback {
    transition: all 0.15s ease;

    &:active {
      transform: translateY(2px);
      filter: brightness(0.9);
    }
  }

  .ripple-btn {
    position: relative;
    overflow: hidden;
    display: inline-block;
  }

  .ccb-pagination {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }

  .flow-drawer {
    .log-card {
      border: 1px solid #ebeef5;
      border-radius: 6px;
      padding: 12px 16px;

      .log-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 10px;

        .log-operator {
          margin-left: auto;
          font-size: 12px;
          color: #909399;
        }
      }

      .log-body {
        .log-status-change {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          font-size: 13px;

          .status-from {
            color: #909399;
          }
          .arrow-icon {
            color: #c0c4cc;
          }
          .status-to {
            color: #303133;
            font-weight: 500;
          }
        }

        .log-remark {
          font-size: 13px;
          color: #606266;
          margin-bottom: 6px;
        }

        .log-violation {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #f56c6c;
        }
      }
    }
  }
}

@media (max-width: 1200px) {
  .ccb-status-flow .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 768px) {
  .ccb-status-flow .stats-cards {
    grid-template-columns: 1fr;
  }
}
</style>
