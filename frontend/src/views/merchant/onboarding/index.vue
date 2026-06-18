<template>
  <div class="onboarding-page page-container">
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
        <el-form-item label="关键词">
          <el-input
            v-model="queryParams.keyword"
            placeholder="申请编号/商家名"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="申请状态">
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
        <el-form-item label="商家类型">
          <el-select
            v-model="queryParams.merchantType"
            placeholder="全部类型"
            clearable
            style="width: 140px"
          >
            <el-option
              v-for="item in merchantTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="风险等级">
          <el-select
            v-model="queryParams.riskLevel"
            placeholder="全部等级"
            clearable
            style="width: 120px"
          >
            <el-option
              v-for="item in riskLevelOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
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
          <span class="card-title">商家入驻审核</span>
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
              <el-button
                size="small"
                :icon="RefreshLeft"
                :disabled="!hasBatchPermission"
                @click="handleBatchReturn"
              >
                批量退回
              </el-button>
              <el-button size="small" @click="clearSelection">取消选择</el-button>
            </div>
            <el-tooltip
              v-if="!hasBatchPermission"
              content="仅管理员/运营主管可执行批量审核"
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
        class="onboarding-table"
        @selection-change="handleSelectionChange as any"
        @paginate="handlePaginate"
        @row-dblclick="handleRowDblclick as any"
      >
        <el-table-column label="申请编号" width="160" prop="applyNo">
          <template #default="{ row }">
            <span class="apply-no">{{ row.applyNo }}</span>
            <el-tag
              v-if="row.isDuplicate === 1"
              type="warning"
              size="small"
              effect="dark"
              class="tag-margin"
            >
              重复
            </el-tag>
            <el-tag
              v-if="row.isFakeQualification === 1"
              type="danger"
              size="small"
              effect="dark"
              class="tag-margin"
            >
              虚假
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="商家信息" min-width="200">
          <template #default="{ row }">
            <div class="merchant-info">
              <div class="merchant-name">{{ row.merchantName }}</div>
              <div class="merchant-meta">
                <el-tag size="small" :type="row.merchantType === MerchantType.BRAND ? 'warning' : 'info'" effect="plain">
                  {{ MERCHANT_TYPE_NAMES[row.merchantType as MerchantType] || '-' }}
                </el-tag>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="店铺名称" min-width="150" prop="storeName">
          <template #default="{ row }">
            <span class="text-ellipsis">{{ row.storeName || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="行业类目" width="120" prop="industryCategory">
          <template #default="{ row }">
            {{ row.industryCategory || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="申请状态" width="110" align="center">
          <template #default="{ row }">
            <div class="status-transition">
              <el-tag
                :type="MERCHANT_APPLY_STATUS_TAG_TYPES[row.status] as any"
                size="small"
                effect="light"
              >
                {{ MERCHANT_APPLY_STATUS_NAMES[row.status] }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="风险等级" width="100" align="center">
          <template #default="{ row }">
            <div class="risk-level">
              <span
                class="risk-dot"
                :style="{ backgroundColor: MERCHANT_RISK_LEVEL_COLORS[row.riskLevel as MerchantRiskLevel] || '#909399' }"
              />
              <span class="risk-text">{{ MERCHANT_RISK_LEVEL_NAMES[row.riskLevel as MerchantRiskLevel] || '-' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="信用评分" width="100" align="right">
          <template #default="{ row }">
            <span class="credit-score">{{ formatCreditScore(row.creditScore) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="提交时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.submitTime || row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === MerchantApplyStatus.PENDING_INITIAL"
              link
              type="success"
              size="small"
              @click.stop="handleAudit(row, 'pass', 'initial')"
            >
              初审通过
            </el-button>
            <el-button
              v-if="row.status === MerchantApplyStatus.PENDING_INITIAL"
              link
              type="danger"
              size="small"
              @click.stop="handleAudit(row, 'reject', 'initial')"
            >
              初审驳回
            </el-button>
            <el-button
              v-if="row.status === MerchantApplyStatus.PENDING_FINAL"
              link
              type="success"
              size="small"
              @click.stop="handleAudit(row, 'pass', 'final')"
            >
              终审通过
            </el-button>
            <el-button
              v-if="row.status === MerchantApplyStatus.PENDING_FINAL"
              link
              type="danger"
              size="small"
              @click.stop="handleAudit(row, 'reject', 'final')"
            >
              终审驳回
            </el-button>
            <el-button
              v-if="[MerchantApplyStatus.PENDING_INITIAL, MerchantApplyStatus.PENDING_FINAL].includes(row.status)"
              link
              type="warning"
              size="small"
              @click.stop="handleReturn(row)"
            >
              退回
            </el-button>
            <el-button link type="primary" size="small" @click.stop="openDetail(row)">
              详情
            </el-button>
            <el-button link type="info" size="small" @click.stop="openCreditArchive(row)">
              信用
            </el-button>
          </template>
        </el-table-column>
      </HtTable>
    </el-card>

    <OnboardingDetailDialog
      v-model="detailDialogVisible"
      :apply-id="currentApplyId"
      @refresh="handleRefresh"
    />

    <MerchantAuditDialog
      v-model="auditDialogVisible"
      :apply-id="currentApplyId"
      :audit-type="currentAuditType"
      @success="handleAuditSuccess"
    />

    <BatchAuditDialog
      v-model="batchAuditDialogVisible"
      :ids="selectedIds"
      :action="currentBatchAction"
      @success="handleBatchAuditSuccess"
    />

    <CreditArchiveDialog
      v-model="creditArchiveDialogVisible"
      :apply-id="currentApplyId"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Search,
  Refresh,
  Check,
  Close,
  RefreshLeft,
  QuestionFilled
} from '@element-plus/icons-vue'
import { useFetchList, useSelection, formatDateTime } from '@hooks/index'
import { useNumberFormat } from '@hooks/useFormat'
import {
  getMerchantOnboardingList,
  getMerchantOnboardingStats
} from '@api/merchant-onboarding'
import {
  MerchantApplyStatus,
  MERCHANT_APPLY_STATUS_NAMES,
  MERCHANT_APPLY_STATUS_TAG_TYPES,
  MerchantType,
  MERCHANT_TYPE_NAMES,
  MerchantRiskLevel,
  MERCHANT_RISK_LEVEL_NAMES,
  MERCHANT_RISK_LEVEL_COLORS
} from '@enums/business'
import type { MerchantOnboardingApply } from '@api/merchant-onboarding'
import HtTable from '@components/HtTable/index.vue'
import OnboardingDetailDialog from './components/OnboardingDetailDialog.vue'
import MerchantAuditDialog from './components/MerchantAuditDialog.vue'
import BatchAuditDialog from './components/BatchAuditDialog.vue'
import CreditArchiveDialog from './components/CreditArchiveDialog.vue'
import { useUserStore } from '@/stores/modules/user'

const { formatNumber } = useNumberFormat()
const userStore = useUserStore()

const hasBatchPermission = computed(() => {
  return ['admin', 'operation_manager'].some(role => userStore.hasRole(role))
})

const statItems = [
  { key: 'pendingInitial', label: '待初审', color: '#e6a23c' },
  { key: 'pendingFinal', label: '待终审', color: '#f56c6c' },
  { key: 'approved', label: '已通过', color: '#67c23a' },
  { key: 'rejected', label: '已驳回', color: '#909399' },
  { key: 'duplicateCount', label: '重复', color: '#e6a23c' },
  { key: 'fakeCount', label: '虚假', color: '#f56c6c' }
]

const statusOptions = [
  { value: 0, label: '草稿' },
  { value: 1, label: '待初审' },
  { value: 2, label: '待终审' },
  { value: 3, label: '初审通过' },
  { value: 4, label: '终审通过' },
  { value: 5, label: '已驳回' },
  { value: 6, label: '已退回' }
]

const merchantTypeOptions = [
  { value: 'normal', label: '普通商家' },
  { value: 'brand', label: '品牌商家' }
]

const riskLevelOptions = [
  { value: 'low', label: '低风险' },
  { value: 'medium', label: '中风险' },
  { value: 'high', label: '高风险' }
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
} = useFetchList<MerchantOnboardingApply, {
  keyword?: string
  status?: number
  merchantType?: string
  riskLevel?: string
}>({
  fetchApi: getMerchantOnboardingList,
  defaultParams: {
    keyword: '',
    status: undefined,
    merchantType: undefined,
    riskLevel: undefined
  }
})

const { selectedIds, handleSelectionChange, clearSelection } = useSelection<MerchantOnboardingApply>()

const detailDialogVisible = ref(false)
const auditDialogVisible = ref(false)
const batchAuditDialogVisible = ref(false)
const creditArchiveDialogVisible = ref(false)
const currentApplyId = ref<number>(0)
const currentAuditType = ref<'initial_pass' | 'initial_reject' | 'final_pass' | 'final_reject' | 'return'>('initial_pass')
const currentBatchAction = ref<'pass' | 'reject' | 'return'>('pass')

const formatCreditScore = (score: number | null | undefined): string => {
  if (score == null) return '-'
  return formatNumber(score)
}

const loadStats = async () => {
  try {
    const data = await getMerchantOnboardingStats()
    statsData.value = data as unknown as Record<string, number>
  } catch (error) {
    console.error('获取统计数据失败', error)
  }
}

const openDetail = (row: MerchantOnboardingApply) => {
  currentApplyId.value = row.id
  detailDialogVisible.value = true
}

const openCreditArchive = (row: MerchantOnboardingApply) => {
  currentApplyId.value = row.id
  creditArchiveDialogVisible.value = true
}

const handleRowDblclick = (row: MerchantOnboardingApply) => {
  currentApplyId.value = row.id
  detailDialogVisible.value = true
}

const handleAudit = (row: MerchantOnboardingApply, type: 'pass' | 'reject', stage: 'initial' | 'final') => {
  currentAuditType.value = `${stage}_${type}` as any
  currentApplyId.value = row.id
  auditDialogVisible.value = true
}

const handleReturn = (row: MerchantOnboardingApply) => {
  currentAuditType.value = 'return'
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
    ElMessage.warning('仅管理员/运营主管可执行批量审核')
    return
  }
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择要审核的申请')
    return
  }
  currentBatchAction.value = 'pass'
  batchAuditDialogVisible.value = true
}

const handleBatchReject = () => {
  if (!hasBatchPermission.value) {
    ElMessage.warning('仅管理员/运营主管可执行批量审核')
    return
  }
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择要审核的申请')
    return
  }
  currentBatchAction.value = 'reject'
  batchAuditDialogVisible.value = true
}

const handleBatchReturn = () => {
  if (!hasBatchPermission.value) {
    ElMessage.warning('仅管理员/运营主管可执行批量审核')
    return
  }
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择要审核的申请')
    return
  }
  currentBatchAction.value = 'return'
  batchAuditDialogVisible.value = true
}

const handleBatchAuditSuccess = () => {
  ElMessage.success('批量审核完成')
  clearSelection()
  fetchData()
  loadStats()
}

const handleRefresh = () => {
  fetchData()
  loadStats()
}

onMounted(() => {
  loadStats()
})
</script>

<style lang="scss" scoped>
.onboarding-page {
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
        color: $text-secondary;
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
      color: $text-regular;
      margin-right: 8px;
    }
  }

  .help-icon {
    color: $text-secondary;
    font-size: 16px;
    cursor: help;
  }

  .onboarding-table {
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
      border-color: $theme-color;
    }

    :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
      background-color: $theme-color;
      border-color: $theme-color;
    }
  }

  .apply-no {
    font-family: 'Courier New', monospace;
    font-size: 12px;
    color: $text-regular;
  }

  .tag-margin {
    margin-left: 6px;
  }

  .merchant-info {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .merchant-name {
      font-size: 14px;
      font-weight: 500;
      color: $text-primary;
    }

    .merchant-meta {
      display: flex;
      align-items: center;
      gap: 6px;
    }
  }

  .status-transition {
    transition: transform 0.3s ease;

    &:hover {
      transform: scale(1.05);
    }
  }

  .risk-level {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;

    .risk-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      display: inline-block;
    }

    .risk-text {
      font-size: 12px;
      color: $text-regular;
    }
  }

  .credit-score {
    font-weight: 600;
    color: $text-primary;
    font-variant-numeric: tabular-nums;
  }
}
</style>
