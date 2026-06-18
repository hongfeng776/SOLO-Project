<template>
  <div class="qualification-page page-container">
    <el-card shadow="never" class="stats-card mb-20">
      <div class="stats-row">
        <div class="stat-item" v-for="stat in statItems" :key="stat.key">
          <div class="stat-value" :style="{ color: stat.color }">
            <span class="number">{{ statsData[stat.key] || 0 }}</span>
          </div>
          <div class="stat-label">{{ stat.label }}</div>
        </div>
      </div>
    </el-card>

    <el-card shadow="never" class="mb-20">
      <el-form :model="queryParams" label-width="80px" inline @submit.prevent>
        <el-form-item label="申请编号">
          <el-input
            v-model="queryParams.keyword"
            placeholder="请输入申请编号/姓名"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="资质状态">
          <el-select
            v-model="queryParams.status"
            placeholder="全部状态"
            clearable
            style="width: 140px"
          >
            <el-option
              v-for="item in statusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="资质类型">
          <el-select
            v-model="queryParams.qualificationType"
            placeholder="全部类型"
            clearable
            style="width: 140px"
          >
            <el-option
              v-for="item in typeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="过期预警">
          <el-select
            v-model="queryParams.isExpiringSoon"
            placeholder="全部"
            clearable
            style="width: 120px"
          >
            <el-option label="即将过期" :value="1" />
            <el-option label="正常" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">达人资质审核</span>
          <div class="header-actions">
            <div class="batch-actions" v-show="selectedIds.length > 0">
              <span class="selected-count">已选 {{ selectedIds.length }} 项</span>
              <el-button
                type="success"
                size="small"
                :icon="Check"
                :disabled="!hasBatchPermission"
                @click="handleBatchPass"
              >
                批量通过
              </el-button>
              <el-button
                type="danger"
                size="small"
                :icon="Close"
                :disabled="!hasBatchPermission"
                @click="handleBatchReject"
              >
                批量驳回
              </el-button>
              <el-button size="small" @click="clearSelection">取消选择</el-button>
            </div>
            <el-tooltip
              v-if="!hasBatchPermission"
              content="仅商家运营权限账号可执行批量审核"
              placement="top"
            >
              <el-icon class="help-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </div>
      </template>

      <HtTable
        :data="dataList"
        :loading="loading"
        :total="total"
        v-model:page="queryParams.page"
        v-model:page-size="queryParams.pageSize"
        selectable
        show-index
        row-key="id"
        stripe
        class="qualification-table"
        @selection-change="handleSelectionChange"
        @paginate="handlePaginate"
        @row-dblclick="handleRowDblclick"
      >
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column label="申请编号" width="160" prop="applyNo">
          <template #default="{ row }">
            <span class="apply-no">{{ row.applyNo }}</span>
            <el-tag
              v-if="row.isExpiringSoon === 1"
              type="warning"
              size="small"
              effect="dark"
              class="expire-tag blink-tag"
            >
              即将过期
            </el-tag>
            <el-tag
              v-if="row.isFake === 1"
              type="danger"
              size="small"
              effect="dark"
              class="fake-tag"
            >
              虚假资质
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="达人信息" min-width="200">
          <template #default="{ row }">
            <div class="creator-info">
              <el-avatar :size="40" :src="row.creator?.avatar" shape="square">
                {{ row.creator?.name?.charAt(0) }}
              </el-avatar>
              <div class="info-text">
                <div class="creator-name">{{ row.creator?.name }}</div>
                <div class="creator-meta">
                  <span>{{ row.creator?.platform }}</span>
                  <span class="dot">·</span>
                  <span>{{ formatNumber(row.creator?.followers || 0) }} 粉丝</span>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="真实姓名" width="100" prop="realName" />
        <el-table-column label="资质类型" width="120">
          <template #default="{ row }">
            {{ QUALIFICATION_TYPE_NAMES[row.qualificationType] || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="资质状态" width="100" align="center">
          <template #default="{ row }">
            <div class="status-transition">
              <el-tag
                :type="QUALIFICATION_APPLY_TAG_TYPES[row.status]"
                size="small"
                effect="light"
              >
                {{ QUALIFICATION_APPLY_STATUS_NAMES[row.status] }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="前置校验" width="100" align="center">
          <template #default="{ row }">
            <div class="precheck-status">
              <el-icon
                v-if="row.preCheckPassed === 1"
                class="check-icon success"
              >
                <CircleCheckFilled />
              </el-icon>
              <el-icon v-else class="check-icon error">
                <CircleCloseFilled />
              </el-icon>
              <span>{{ row.preCheckPassed === 1 ? '通过' : '未通过' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="提交时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.submitTime || row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="到期时间" width="160">
          <template #default="{ row }">
            <span :class="{ 'expire-soon': row.isExpiringSoon === 1 }">
              {{ row.expireTime ? formatDateTime(row.expireTime) : '-' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === QualificationApplyStatus.UNDER_REVIEW"
              link
              type="success"
              size="small"
              @click.stop="handleAudit(row, 2)"
            >
              通过
            </el-button>
            <el-button
              v-if="row.status === QualificationApplyStatus.UNDER_REVIEW"
              link
              type="danger"
              size="small"
              @click.stop="handleAudit(row, 3)"
            >
              驳回
            </el-button>
            <el-button link type="primary" size="small" @click.stop="openDetail(row)">
              详情
            </el-button>
            <el-button link type="info" size="small" @click.stop="openTrace(row)">
              溯源
            </el-button>
          </template>
        </el-table-column>
      </HtTable>
    </el-card>

    <QualificationDetailDialog
      v-model="detailDialogVisible"
      :apply-id="currentApplyId"
      @refresh="fetchData"
    />

    <AuditDialog
      v-model="auditDialogVisible"
      :apply-id="currentApplyId"
      :audit-type="currentAuditType"
      @success="handleAuditSuccess"
    />

    <BatchAuditDialog
      v-model="batchAuditDialogVisible"
      :ids="selectedIds"
      :audit-type="currentAuditType"
      @success="handleBatchAuditSuccess"
    />

    <TraceDialog v-model="traceDialogVisible" :creator-id="currentCreatorId" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search,
  Refresh,
  Check,
  Close,
  QuestionFilled,
  CircleCheckFilled,
  CircleCloseFilled
} from '@element-plus/icons-vue'
import { useFetchList, useSelection, formatDateTime } from '@hooks/index'
import { useNumberFormat } from '@hooks/useFormat'
import {
  getQualificationList,
  getQualificationStats,
  auditQualification,
  batchAuditQualification
} from '@api/creator-qualification'
import {
  QualificationApplyStatus,
  QUALIFICATION_APPLY_STATUS_NAMES,
  QUALIFICATION_APPLY_TAG_TYPES,
  QUALIFICATION_TYPE_NAMES
} from '@enums/business'
import type { QualificationApply } from '@api/creator-qualification'
import HtTable from '@components/HtTable/index.vue'
import QualificationDetailDialog from './components/QualificationDetailDialog.vue'
import AuditDialog from './components/AuditDialog.vue'
import BatchAuditDialog from './components/BatchAuditDialog.vue'
import TraceDialog from './components/TraceDialog.vue'
import { useUserStore } from '@/stores/modules/user'

const { formatNumber } = useNumberFormat()
const userStore = useUserStore()

const hasBatchPermission = computed(() => {
  return ['admin', 'operation_manager'].some(role => userStore.hasRole(role))
})

const statItems = [
  { key: 'underReview', label: '待审核', color: '#e6a23c' },
  { key: 'approved', label: '已通过', color: '#67c23a' },
  { key: 'rejected', label: '已驳回', color: '#f56c6c' },
  { key: 'expiringSoon', label: '即将过期', color: '#e6a23c' },
  { key: 'fakeCount', label: '虚假资质', color: '#f56c6c' },
  { key: 'total', label: '申请总数', color: '#409eff' }
]

const statusOptions = [
  { value: 0, label: '待提交' },
  { value: 1, label: '审核中' },
  { value: 2, label: '已通过' },
  { value: 3, label: '已驳回' },
  { value: 4, label: '已过期' }
]

const typeOptions = [
  { value: 'id_card', label: '身份证件' },
  { value: 'business_license', label: '营业执照' },
  { value: 'industry_cert', label: '行业资质证' },
  { value: 'other', label: '其他材料' }
]

const statsData = ref<Record<string, number>>({})

const {
  loading,
  dataList,
  total,
  queryParams,
  fetchData,
  handleSearch,
  handleReset,
  handlePaginate
} = useFetchList<QualificationApply, {
  keyword?: string
  status?: number
  qualificationType?: string
  isExpiringSoon?: number
}>({
  fetchApi: getQualificationList,
  defaultParams: {
    keyword: '',
    status: undefined,
    qualificationType: undefined,
    isExpiringSoon: undefined
  }
})

const { selectedList, selectedIds, handleSelectionChange, clearSelection } =
  useSelection<QualificationApply>()

const detailDialogVisible = ref(false)
const auditDialogVisible = ref(false)
const batchAuditDialogVisible = ref(false)
const traceDialogVisible = ref(false)
const currentApplyId = ref<number>(0)
const currentCreatorId = ref<number>(0)
const currentAuditType = ref<'pass' | 'reject'>('pass')

const loadStats = async () => {
  try {
    const data = await getQualificationStats()
    statsData.value = data as unknown as Record<string, number>
  } catch (error) {
    console.error('获取统计数据失败', error)
  }
}

const openDetail = (row: QualificationApply) => {
  currentApplyId.value = row.id
  detailDialogVisible.value = true
}

const openTrace = (row: QualificationApply) => {
  currentCreatorId.value = row.creatorId
  traceDialogVisible.value = true
}

const handleRowDblclick = (row: QualificationApply) => {
  currentCreatorId.value = row.creatorId
  traceDialogVisible.value = true
}

const handleAudit = (row: QualificationApply, type: number) => {
  if (type === 2) {
    currentAuditType.value = 'pass'
  } else {
    currentAuditType.value = 'reject'
  }
  currentApplyId.value = row.id
  auditDialogVisible.value = true
}

const handleAuditSuccess = () => {
  ElMessage.success('审核完成')
  fetchData()
  loadStats()
}

const handleBatchPass = () => {
  if (!hasBatchPermission.value) {
    ElMessage.warning('仅商家运营权限账号可执行批量审核')
    return
  }
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择要审核的申请')
    return
  }
  currentAuditType.value = 'pass'
  batchAuditDialogVisible.value = true
}

const handleBatchReject = () => {
  if (!hasBatchPermission.value) {
    ElMessage.warning('仅商家运营权限账号可执行批量审核')
    return
  }
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择要审核的申请')
    return
  }
  currentAuditType.value = 'reject'
  batchAuditDialogVisible.value = true
}

const handleBatchAuditSuccess = () => {
  ElMessage.success('批量审核完成')
  clearSelection()
  fetchData()
  loadStats()
}

onMounted(() => {
  loadStats()
})
</script>

<style lang="scss" scoped>
.qualification-page {
  .stats-card {
    .stats-row {
      display: flex;
      gap: 20px;
    }

    .stat-item {
      flex: 1;
      padding: 16px 20px;
      background: #f5f7fa;
      border-radius: 8px;
      text-align: center;

      .stat-value {
        font-size: 28px;
        font-weight: 600;
        line-height: 1.2;

        .number {
          transition: transform 0.3s ease;

          &:hover {
            transform: scale(1.1);
          }
        }
      }

      .stat-label {
        margin-top: 8px;
        font-size: 13px;
        color: #909399;
      }
    }
  }

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

  .header-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .batch-actions {
    display: flex;
    align-items: center;
    gap: 8px;

    .selected-count {
      font-size: 13px;
      color: #606266;
      margin-right: 8px;
    }
  }

  .help-icon {
    color: #909399;
    font-size: 16px;
    cursor: help;
  }

  .qualification-table {
    :deep(.el-table__row) {
      transition: background-color 0.2s ease;

      &:hover {
        background-color: #f5f7fa !important;
      }
    }

    :deep(.el-table__row--striped) {
      &:nth-child(even) {
        background-color: #fafafa;

        &:hover {
          background-color: #f5f7fa !important;
        }
      }
    }

    :deep(.el-checkbox__inner:hover) {
      border-color: #409eff;
    }

    :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
      background-color: #409eff;
      border-color: #409eff;
    }
  }

  .apply-no {
    font-family: 'Courier New', monospace;
    font-size: 12px;
    color: #606266;
  }

  .expire-tag {
    margin-left: 8px;
    animation: blink 1.5s infinite;
  }

  .fake-tag {
    margin-left: 8px;
  }

  .blink-tag {
    animation: blink-animation 1.5s ease-in-out infinite;
  }

  @keyframes blink-animation {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  .creator-info {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .info-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .creator-name {
    font-size: 14px;
    font-weight: 500;
    color: $text-primary;
  }

  .creator-meta {
    font-size: 12px;
    color: $text-secondary;

    .dot {
      margin: 0 6px;
      color: #dcdfe6;
    }
  }

  .precheck-status {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    font-size: 12px;

    .check-icon {
      font-size: 16px;

      &.success {
        color: #67c23a;
      }

      &.error {
        color: #f56c6c;
      }
    }
  }

  .status-transition {
    transition: transform 0.3s ease;

    &:hover {
      transform: scale(1.05);
    }
  }

  .expire-soon {
    color: #e6a23c;
    font-weight: 500;
  }
}
</style>
