<template>
  <div class="redemption-batch-operation">
    <el-tabs v-model="activeTab" type="border-card">
      <el-tab-pane label="批量复核" name="review">
        <div class="tab-content">
          <div class="filter-bar">
            <el-select v-model="reviewFilter.scene" placeholder="活动场景" clearable style="width: 160px">
              <el-option
                v-for="(label, value) in CampaignSceneMap"
                :key="value"
                :label="label"
                :value="Number(value)"
              />
            </el-select>
            <el-date-picker
              v-model="reviewFilter.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              style="width: 280px"
            />
            <el-button type="primary" :loading="reviewLoading" @click="loadPendingCount">
              查询
            </el-button>
          </div>

          <div class="pending-summary">
            <div class="summary-card">
              <div class="summary-icon">
                <el-icon :size="28"><Clock /></el-icon>
              </div>
              <div class="summary-info">
                <span class="count">{{ pendingCount }}</span>
                <span class="label">待复核记录</span>
              </div>
            </div>
          </div>

          <div class="action-buttons">
            <el-button
              type="success"
              :loading="reviewLoading"
              :disabled="pendingCount === 0"
              @click="handleBatchReview('approve')"
            >
              <el-icon><CircleCheck /></el-icon>
              批量通过
            </el-button>
            <el-button
              type="danger"
              :loading="reviewLoading"
              :disabled="pendingCount === 0"
              @click="handleBatchReview('reject')"
            >
              <el-icon><CircleClose /></el-icon>
              批量驳回
            </el-button>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="违规驳回" name="violation">
        <div class="tab-content">
          <div class="violation-stats">
            <div class="stat-chip">
              <el-icon><Warning /></el-icon>
              <span>违规总数：<b>{{ violationStats.totalViolations }}</b></span>
            </div>
            <div class="stat-chip savings">
              <el-icon><Coin /></el-icon>
              <span>预估节省：<b>¥{{ violationStats.estimatedSavings }}</b></span>
            </div>
          </div>

          <el-table
            :data="violationList"
            v-loading="violationLoading"
            @selection-change="handleViolationSelect"
            stripe
            border
            style="width: 100%"
          >
            <el-table-column type="selection" width="50" align="center" />
            <el-table-column prop="id" label="ID" width="70" align="center" />
            <el-table-column prop="campaignName" label="活动名称" min-width="140" show-overflow-tooltip />
            <el-table-column prop="userPhone" label="用户手机" width="130" align="center" />
            <el-table-column prop="violationType" label="违规类型" width="120" align="center">
              <template #default="{ row }">
                <el-tag :type="ViolationTypeTagType[row.violationType] || 'info'" size="small">
                  {{ ViolationTypeMap[row.violationType] || row.violationType }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="violationLabel" label="违规描述" min-width="120" show-overflow-tooltip />
            <el-table-column prop="redemptionAmount" label="核销金额" width="100" align="center">
              <template #default="{ row }">
                ¥{{ row.redemptionAmount }}
              </template>
            </el-table-column>
            <el-table-column prop="complianceScore" label="合规分" width="90" align="center">
              <template #default="{ row }">
                <span :class="getScoreClass(row.complianceScore)">{{ row.complianceScore }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="RedemptionStatusTagType[row.status] || 'info'" size="small">
                  {{ RedemptionStatusMap[row.status] || '未知' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>

          <div class="violation-action">
            <el-button
              type="danger"
              :loading="rejectLoading"
              :disabled="selectedViolationIds.length === 0"
              @click="handleBatchReject"
            >
              <el-icon><CircleClose /></el-icon>
              批量驳回选中（{{ selectedViolationIds.length }}）
            </el-button>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="核销统计" name="statistics">
        <div class="tab-content">
          <div v-loading="statsLoading" class="statistics-content">
            <div class="compliance-overview">
              <div class="circular-progress">
                <el-progress
                  type="circle"
                  :percentage="complianceData.complianceScore"
                  :width="140"
                  :stroke-width="10"
                  :color="getScoreColor(complianceData.complianceScore)"
                >
                  <template #default>
                    <div class="progress-inner">
                      <span class="score-value">{{ complianceData.complianceScore }}</span>
                      <span class="score-label">合规分</span>
                    </div>
                  </template>
                </el-progress>
              </div>
              <div class="overview-info">
                <h3>合规总览</h3>
                <p>核销总数：<b>{{ complianceData.total }}</b></p>
              </div>
            </div>

            <div class="check-dimensions">
              <div class="dimension-title">校验维度详情</div>
              <div
                v-for="check in complianceData.checks"
                :key="check.type"
                class="dimension-row"
              >
                <div class="dimension-name">
                  {{ ComplianceCheckTypeMap[check.type] || check.name }}
                </div>
                <div class="dimension-counts">
                  <span class="pass">通过 {{ check.passCount }}</span>
                  <span class="fail">未通过 {{ check.failCount }}</span>
                </div>
                <div class="dimension-progress">
                  <el-progress
                    :percentage="check.passRate"
                    :stroke-width="12"
                    :color="getRateColor(check.passRate)"
                    :format="(p: number) => p + '%'"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Clock, CircleCheck, CircleClose, Warning, Coin } from '@element-plus/icons-vue'
import {
  batchReviewPendingApi,
  getViolationListApi,
  batchRejectViolationsApi,
  getComplianceOverviewApi,
  getRedemptionStatsApi
} from '@/api/marketing'
import {
  CampaignSceneMap,
  ViolationTypeMap,
  ViolationTypeTagType,
  ComplianceCheckTypeMap,
  RedemptionStatusMap,
  RedemptionStatusTagType
} from '@/enums/marketing'
import type { BatchReviewResult, ViolationPageResult, ComplianceOverviewResult } from '@/types/marketing'

interface Props {
  campaignId: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'success', action: string): void
}>()

const activeTab = ref('review')
const reviewLoading = ref(false)
const violationLoading = ref(false)
const rejectLoading = ref(false)
const statsLoading = ref(false)
const pendingCount = ref(0)

const reviewFilter = reactive({
  scene: undefined as number | undefined,
  dateRange: null as [string, string] | null
})

const violationList = ref<ViolationPageResult['list']>([])
const violationStats = reactive({
  totalViolations: 0,
  estimatedSavings: 0
})
const selectedViolationIds = ref<number[]>([])

const complianceData = reactive<ComplianceOverviewResult>({
  total: 0,
  complianceScore: 0,
  checks: []
})

const getFilterParams = () => {
  const params: Record<string, any> = {}
  if (reviewFilter.scene !== undefined) params.scene = reviewFilter.scene
  if (reviewFilter.dateRange && reviewFilter.dateRange.length === 2) {
    params.startDate = reviewFilter.dateRange[0]
    params.endDate = reviewFilter.dateRange[1]
  }
  return params
}

const loadPendingCount = async () => {
  reviewLoading.value = true
  try {
    const res = await getRedemptionStatsApi(props.campaignId)
    pendingCount.value = res.data?.manualReviewCount ?? 0
  } catch (e: any) {
    ElMessage.error(e.message || '查询失败')
  } finally {
    reviewLoading.value = false
  }
}

const handleBatchReview = async (action: string) => {
  const actionLabel = action === 'approve' ? '批量通过' : '批量驳回'
  try {
    await ElMessageBox.confirm(
      `确定对当前筛选条件下的 ${pendingCount.value} 条待复核记录执行"${actionLabel}"操作？`,
      '操作确认',
      { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
    )
  } catch {
    return
  }

  reviewLoading.value = true
  try {
    const params = getFilterParams()
    await batchReviewPendingApi(props.campaignId, { action, ...params })
    ElMessage.success(`${actionLabel}操作成功`)
    emit('success', `batch_review_${action}`)
    pendingCount.value = 0
  } catch (e: any) {
    ElMessage.error(e.message || `${actionLabel}操作失败`)
  } finally {
    reviewLoading.value = false
  }
}

const loadViolationList = async () => {
  violationLoading.value = true
  try {
    const res = await getViolationListApi({ campaignId: props.campaignId })
    const data = res.data as ViolationPageResult
    violationList.value = data.list
    violationStats.totalViolations = data.stats.totalViolations
    violationStats.estimatedSavings = data.stats.estimatedSavings
  } catch (e: any) {
    ElMessage.error(e.message || '获取违规列表失败')
  } finally {
    violationLoading.value = false
  }
}

const handleViolationSelect = (rows: any[]) => {
  selectedViolationIds.value = rows.map(r => r.id)
}

const handleBatchReject = async () => {
  let reason = ''
  try {
    reason = await ElMessageBox.confirm(
      `确定驳回选中的 ${selectedViolationIds.value.length} 条违规记录？`,
      '操作确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
        inputPlaceholder: '请输入驳回原因（可选）',
        showInput: true,
        inputType: 'textarea'
      }
    ) as unknown as string
  } catch {
    return
  }

  rejectLoading.value = true
  try {
    await batchRejectViolationsApi({
      ids: selectedViolationIds.value,
      reason: reason || undefined
    })
    ElMessage.success('批量驳回操作成功')
    emit('success', 'batch_reject_violations')
    selectedViolationIds.value = []
    await loadViolationList()
  } catch (e: any) {
    ElMessage.error(e.message || '批量驳回操作失败')
  } finally {
    rejectLoading.value = false
  }
}

const loadComplianceOverview = async () => {
  statsLoading.value = true
  try {
    const res = await getComplianceOverviewApi(props.campaignId)
    const data = res.data as ComplianceOverviewResult
    complianceData.total = data.total
    complianceData.complianceScore = data.complianceScore
    complianceData.checks = data.checks
  } catch (e: any) {
    ElMessage.error(e.message || '获取合规总览失败')
  } finally {
    statsLoading.value = false
  }
}

const getScoreClass = (score: number) => {
  if (score >= 90) return 'score-high'
  if (score >= 70) return 'score-mid'
  return 'score-low'
}

const getScoreColor = (score: number) => {
  if (score >= 90) return '#67c23a'
  if (score >= 70) return '#e6a23c'
  return '#f56c6c'
}

const getRateColor = (rate: number) => {
  if (rate >= 90) return '#67c23a'
  if (rate >= 70) return '#e6a23c'
  return '#f56c6c'
}

watch(activeTab, (val) => {
  if (val === 'violation' && violationList.value.length === 0) {
    loadViolationList()
  }
  if (val === 'statistics' && complianceData.checks.length === 0) {
    loadComplianceOverview()
  }
}, { immediate: false })
</script>

<style lang="scss" scoped>
.redemption-batch-operation {
  :deep(.el-tabs--border-card) {
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    border: none;
    overflow: hidden;

    > .el-tabs__header {
      background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
      border-bottom: none;

      .el-tabs__item {
        font-weight: 600;
        font-size: 14px;

        &.is-active {
          background: #fff;
          color: #409eff;
        }
      }
    }
  }

  .tab-content {
    padding: 20px;
  }

  .filter-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
  }

  .pending-summary {
    margin-bottom: 24px;

    .summary-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px 24px;
      background: linear-gradient(135deg, #ecf5ff 0%, #ffffff 100%);
      border-radius: 12px;
      border: 1px solid #d9ecff;

      .summary-icon {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
        color: #fff;
      }

      .summary-info {
        .count {
          display: block;
          font-size: 32px;
          font-weight: 700;
          color: #409eff;
          line-height: 1.2;
        }

        .label {
          font-size: 14px;
          color: #909399;
        }
      }
    }
  }

  .action-buttons {
    display: flex;
    gap: 12px;
  }

  .violation-stats {
    display: flex;
    gap: 16px;
    margin-bottom: 20px;

    .stat-chip {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      background: linear-gradient(135deg, #fef0f0 0%, #ffffff 100%);
      border-radius: 8px;
      border: 1px solid #fbc4c4;
      font-size: 14px;
      color: #606266;

      .el-icon {
        font-size: 18px;
        color: #f56c6c;
      }

      b {
        color: #f56c6c;
        font-size: 16px;
      }

      &.savings {
        background: linear-gradient(135deg, #f0f9eb 0%, #ffffff 100%);
        border-color: #e1f3d8;

        .el-icon {
          color: #67c23a;
        }

        b {
          color: #67c23a;
        }
      }
    }
  }

  .violation-action {
    margin-top: 16px;
    display: flex;
    justify-content: flex-end;
  }

  .statistics-content {
    .compliance-overview {
      display: flex;
      align-items: center;
      gap: 32px;
      padding: 24px;
      background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%);
      border-radius: 12px;
      margin-bottom: 24px;

      .circular-progress {
        .progress-inner {
          text-align: center;

          .score-value {
            display: block;
            font-size: 28px;
            font-weight: 700;
            color: #303133;
          }

          .score-label {
            display: block;
            font-size: 12px;
            color: #909399;
          }
        }
      }

      .overview-info {
        h3 {
          margin: 0 0 8px 0;
          font-size: 18px;
          color: #303133;
        }

        p {
          margin: 0;
          font-size: 14px;
          color: #606266;

          b {
            color: #409eff;
            font-size: 18px;
          }
        }
      }
    }

    .check-dimensions {
      background: #fff;
      border-radius: 12px;
      border: 1px solid #ebeef5;
      overflow: hidden;

      .dimension-title {
        padding: 14px 20px;
        background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%);
        border-bottom: 1px solid #ebeef5;
        font-size: 15px;
        font-weight: 600;
        color: #303133;
      }

      .dimension-row {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px 20px;
        border-bottom: 1px solid #f5f7fa;

        &:last-child {
          border-bottom: none;
        }

        .dimension-name {
          width: 140px;
          font-size: 14px;
          font-weight: 500;
          color: #303133;
          flex-shrink: 0;
        }

        .dimension-counts {
          width: 160px;
          display: flex;
          gap: 16px;
          font-size: 13px;
          flex-shrink: 0;

          .pass {
            color: #67c23a;
          }

          .fail {
            color: #f56c6c;
          }
        }

        .dimension-progress {
          flex: 1;

          :deep(.el-progress-bar__outer) {
            border-radius: 6px;
          }

          :deep(.el-progress-bar__inner) {
            border-radius: 6px;
          }
        }
      }
    }
  }

  .score-high {
    color: #67c23a;
    font-weight: 600;
  }

  .score-mid {
    color: #e6a23c;
    font-weight: 600;
  }

  .score-low {
    color: #f56c6c;
    font-weight: 600;
  }
}
</style>
