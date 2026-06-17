<template>
  <div class="ccb-business-opening-review-trace">
    <CcbPageHeader
      title="审核溯源"
      description="依托开户流水号、客户证件号实现审核记录全链路溯源与一致性校验"
      icon="Connection"
    />

    <el-card class="trace-search-card" shadow="never">
      <el-form :model="searchForm" inline class="trace-search">
        <el-form-item label="开户流水号" prop="openingNo">
          <el-input
            v-model="searchForm.openingNo"
            placeholder="请输入开户流水号"
            clearable
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item label="客户证件号" prop="idCardNo">
          <el-input
            v-model="searchForm.idCardNo"
            placeholder="身份证号/信用代码"
            clearable
            style="width: 220px"
          />
        </el-form-item>
        <el-form-item label="信用代码" prop="creditCode">
          <el-input
            v-model="searchForm.creditCode"
            placeholder="企业统一社会信用代码"
            clearable
            style="width: 220px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" :loading="loading" @click="handleTrace">
            <span class="ripple-btn" v-ripple>开始溯源</span>
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <div v-if="loading" class="trace-skeleton">
      <el-row :gutter="16">
        <el-col :span="6"><el-skeleton :rows="3" animated /></el-col>
        <el-col :span="6"><el-skeleton :rows="3" animated /></el-col>
        <el-col :span="6"><el-skeleton :rows="3" animated /></el-col>
        <el-col :span="6"><el-skeleton :rows="3" animated /></el-col>
      </el-row>
      <el-skeleton :rows="4" animated style="margin-top: 16px" />
      <el-skeleton :rows="6" animated style="margin-top: 16px" />
    </div>

    <div v-else-if="traceResult" class="trace-result">
      <el-row :gutter="16">
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-icon matched"><Files /></div>
            <div class="stat-info">
              <div class="stat-label">关联开户数</div>
              <div class="stat-num">{{ traceResult.openingList?.length || 0 }}</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-icon review"><Check /></div>
            <div class="stat-info">
              <div class="stat-label">审核记录数</div>
              <div class="stat-num">{{ consistencyReport?.totalReviewCount || 0 }}</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-icon" :class="consistencyReport?.conflictCount > 0 ? 'danger' : 'success'">
              <Warning v-if="consistencyReport?.conflictCount > 0" />
              <CircleCheckFilled v-else />
            </div>
            <div class="stat-info">
              <div class="stat-label">冲突记录数</div>
              <div class="stat-num" :class="consistencyReport?.conflictCount > 0 ? 'danger' : 'success'">
                {{ consistencyReport?.conflictCount || 0 }}
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card">
            <div class="stat-icon" :class="consistencyReport?.infoInconsistencies?.length > 0 ? 'warning' : 'success'">
              <Connection v-if="consistencyReport?.infoInconsistencies?.length > 0" />
              <CircleCheckFilled v-else />
            </div>
            <div class="stat-info">
              <div class="stat-label">一致性问题</div>
              <div class="stat-num" :class="consistencyReport?.infoInconsistencies?.length > 0 ? 'warning' : 'success'">
                {{ consistencyReport?.infoInconsistencies?.length || 0 }}
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-card
        v-if="consistencyReport?.infoInconsistencies?.length > 0 || consistencyReport?.conflictCount > 0"
        shadow="never"
        class="alert-card"
      >
        <el-alert
          v-if="consistencyReport.conflictCount > 0"
          :title="`存在 ${consistencyReport.conflictCount} 条审核意见冲突记录`"
          type="error"
          show-icon
          :closable="false"
          class="trace-alert"
        >
          <template #default>
            <div class="alert-detail">建议立即人工复核，避免逻辑冲突导致业务风险</div>
          </template>
        </el-alert>
        <el-alert
          v-if="consistencyReport.infoInconsistencies?.length > 0"
          title="检测到信息一致性问题"
          type="warning"
          show-icon
          :closable="false"
          class="trace-alert"
        >
          <template #default>
            <ul class="issue-list">
              <li v-for="(issue, i) in consistencyReport.infoInconsistencies" :key="i">
                <el-icon><WarningFilled /></el-icon>
                <span>{{ issue }}</span>
              </li>
            </ul>
          </template>
        </el-alert>
      </el-card>

      <el-card shadow="hover" class="section-card">
        <template #header>
          <div class="card-header">
            <span class="card-title"><el-icon><List /></el-icon> 开户申请列表</span>
            <span class="card-sub">共 {{ traceResult.openingList?.length || 0 }} 条记录</span>
          </div>
        </template>
        <el-table
          :data="traceResult.openingList || []"
          border
          stripe
          style="width: 100%"
          :row-class-name="getOpeningRowClass"
          class="trace-opening-table"
        >
          <el-table-column type="index" label="序号" width="60" />
          <el-table-column prop="openingNo" label="流水号" width="180" show-overflow-tooltip>
            <template #default="{ row }">
              <span class="mono-text">{{ row.openingNo }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="openingType" label="开户类型" width="100">
            <template #default="{ row }">
              <el-tag :type="row.openingType === 1 ? 'primary' : 'success'" size="small" effect="light">
                {{ OpeningTypeText[row.openingType] }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="customerName" label="客户名称" width="140" show-overflow-tooltip />
          <el-table-column prop="idCardNo" label="证件号" width="180" show-overflow-tooltip>
            <template #default="{ row }">
              <span class="mono-text">{{ row.idCardNo }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="accountTypeText" label="账户类型" width="120" show-overflow-tooltip />
          <el-table-column prop="riskLevelText" label="风险等级" width="90" />
          <el-table-column prop="reviewStageText" label="审核阶段" width="110">
            <template #default="{ row }">
              <el-tag :type="ReviewStageType[row.reviewStage] || 'info'" size="small" effect="light">
                {{ row.reviewStageText || '-' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="submitTime" label="提交时间" width="160" />
          <el-table-column prop="hasConflict" label="冲突" width="70" align="center">
            <template #default="{ row }">
              <el-tooltip v-if="row.hasConflict === 1" content="存在审核冲突" placement="top">
                <el-icon class="conflict-icon"><Warning /></el-icon>
              </el-tooltip>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button
                type="primary"
                link
                size="small"
                @click="handleViewDetail(row)"
              >
                查看审核
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <el-card shadow="hover" class="section-card">
        <template #header>
          <div class="card-header">
            <span class="card-title"><el-icon><Clock /></el-icon> 审核记录时间线</span>
            <span class="card-sub">按时间倒序排列</span>
          </div>
        </template>
        <el-timeline v-if="traceResult.reviewLogs?.length > 0" class="review-timeline">
          <el-timeline-item
            v-for="(log, idx) in sortedLogs"
            :key="log.id"
            :timestamp="log.createdAt"
            :type="getTimelineType(log)"
            :icon="getTimelineIcon(log)"
            size="large"
          >
            <el-card
              shadow="never"
              :class="['log-card', log.conflictFlag === 1 ? 'conflict-card' : '']"
            >
              <div class="log-header">
                <div class="log-title">
                  <el-tag :type="getReviewResultType(log.reviewResult)" size="small" effect="dark">
                    {{ log.reviewResultText }}
                  </el-tag>
                  <span class="log-level">{{ log.reviewLevelText }}</span>
                  <span class="log-reviewer">{{ log.reviewerName }}</span>
                </div>
                <div class="log-opening">
                  <el-tag size="small" type="info" effect="plain">
                    {{ log.openingNo }}
                  </el-tag>
                </div>
              </div>

              <el-descriptions :column="2" border size="small" class="log-desc">
                <el-descriptions-item label="审核级别">
                  {{ log.reviewLevelText }}
                </el-descriptions-item>
                <el-descriptions-item label="下一审核级别">
                  {{ log.nextRequiredLevel ? ReviewLevelText[log.nextRequiredLevel] : '无' }}
                </el-descriptions-item>
                <el-descriptions-item label="审核前风险">
                  {{ RiskLevelText[log.riskLevelBefore] || '-' }}
                </el-descriptions-item>
                <el-descriptions-item label="审核后风险">
                  {{ RiskLevelText[log.riskLevelAfter] || '-' }}
                </el-descriptions-item>
                <el-descriptions-item label="一致性校验">
                  <el-tag
                    :type="log.consistencyCheck === 1 ? 'success' : log.consistencyCheck === 0 ? 'danger' : 'info'"
                    size="small"
                  >
                    {{ log.consistencyCheck === 1 ? '一致' : log.consistencyCheck === 0 ? '不一致' : '待核' }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="逻辑冲突">
                  <el-tag :type="log.conflictFlag === 1 ? 'danger' : 'success'" size="small">
                    {{ log.conflictFlag === 1 ? '存在冲突' : '无冲突' }}
                  </el-tag>
                </el-descriptions-item>
              </el-descriptions>

              <div v-if="log.reviewComment" class="log-comment">
                <div class="log-label">审核意见：</div>
                <el-tooltip
                  v-if="log.reviewComment.length > 60"
                  :content="log.reviewComment"
                  placement="top"
                  effect="dark"
                >
                  <div class="log-text truncate-text">{{ log.reviewComment }}</div>
                </el-tooltip>
                <div v-else class="log-text">{{ log.reviewComment }}</div>
              </div>

              <div v-if="log.rejectReason" class="log-reject">
                <div class="log-label">驳回原因：</div>
                <div class="log-text reject-text">{{ log.rejectReason }}</div>
                <div v-if="log.rejectDetails" class="log-details">
                  <div class="log-label">详细说明：</div>
                  <el-tooltip
                    v-if="log.rejectDetails.length > 80"
                    :content="log.rejectDetails"
                    placement="top"
                    effect="dark"
                  >
                    <div class="log-text truncate-text reject-text">{{ log.rejectDetails }}</div>
                  </el-tooltip>
                  <div v-else class="log-text reject-text">{{ log.rejectDetails }}</div>
                </div>
              </div>

              <div v-if="log.supportingFiles && log.supportingFiles.length > 0" class="log-files">
                <div class="log-label">佐证材料：</div>
                <div class="file-list">
                  <span
                    v-for="(file, fi) in log.supportingFiles"
                    :key="fi"
                    class="file-tag"
                  >
                    <el-icon><Files /></el-icon>
                    <el-tooltip :content="file" placement="top">
                      <span class="truncate-text file-name">{{ file }}</span>
                    </el-tooltip>
                  </span>
                </div>
              </div>
            </el-card>
          </el-timeline-item>
        </el-timeline>
        <el-empty v-else description="暂无审核记录" />
      </el-card>

      <el-card v-if="consistencyReport?.suggestions?.length > 0" shadow="hover" class="section-card">
        <template #header>
          <div class="card-header">
            <span class="card-title"><el-icon><Warning /></el-icon> 溯源分析建议</span>
          </div>
        </template>
        <ul class="suggestion-list">
          <li v-for="(sug, i) in consistencyReport.suggestions" :key="i">
            <el-icon class="sug-icon"><CircleCheckFilled /></el-icon>
            <span>{{ sug }}</span>
          </li>
        </ul>
      </el-card>
    </div>

    <el-empty v-else class="empty-trace" description="请输入查询条件开始溯源" />

    <el-dialog
      v-model="detailVisible"
      :title="`审核详情 - ${currentOpening?.openingNo || ''}`"
      width="720px"
      :close-on-click-modal="false"
      class="scale-fade-dialog"
      destroy-on-close
    >
      <div v-if="currentOpening" class="detail-content">
        <el-descriptions :column="2" border size="default">
          <el-descriptions-item label="流水号">
            <span class="mono-text">{{ currentOpening.openingNo }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="开户类型">
            {{ OpeningTypeText[currentOpening.openingType] }}
          </el-descriptions-item>
          <el-descriptions-item label="客户名称">
            {{ currentOpening.customerName }}
          </el-descriptions-item>
          <el-descriptions-item label="证件号">
            <span class="mono-text">{{ currentOpening.idCardNo }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="账户类型">
            {{ currentOpening.accountTypeText }}
          </el-descriptions-item>
          <el-descriptions-item label="风险等级">
            {{ currentOpening.riskLevelText }}
          </el-descriptions-item>
          <el-descriptions-item label="审核阶段">
            <el-tag :type="ReviewStageType[currentOpening.reviewStage] || 'info'" size="small">
              {{ currentOpening.reviewStageText }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="提交时间">
            {{ currentOpening.submitTime }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Search, Clock, Warning, CircleCheckFilled, List, Files, Connection, Check } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import {
  traceReviewApi,
  OpeningTypeText,
  ReviewStageType,
  ReviewLevelText
} from '@api/openingReview'
import type { OpeningReviewItem, ReviewLog, ReviewTraceVO } from '@api/openingReview'

const RiskLevelText: Record<number, string> = {
  0: '无风险',
  1: '低风险',
  2: '中低风险',
  3: '中风险',
  4: '中高风险',
  5: '高风险'
}

const searchForm = ref({
  openingNo: '',
  idCardNo: '',
  creditCode: ''
})

const loading = ref(false)
const traceResult = ref<ReviewTraceVO | null>(null)
const detailVisible = ref(false)
const currentOpening = ref<OpeningReviewItem | null>(null)

const consistencyReport = computed(() => traceResult.value?.consistencyReport)

const sortedLogs = computed(() => {
  const logs = traceResult.value?.reviewLogs || []
  return [...logs].sort((a: any, b: any) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
})

function handleTrace() {
  if (!searchForm.value.openingNo && !searchForm.value.idCardNo && !searchForm.value.creditCode) {
    ElMessage.warning('请至少输入一个查询条件')
    return
  }

  loading.value = true
  traceReviewApi(searchForm.value)
    .then((res: any) => {
      traceResult.value = res.data
      if (!res.data?.openingList?.length) {
        ElMessage.info('未查询到相关记录')
      }
    })
    .catch((err: any) => {
      ElMessage.error(err.message || '溯源查询失败')
    })
    .finally(() => {
      loading.value = false
    })
}

function handleReset() {
  searchForm.value = { openingNo: '', idCardNo: '', creditCode: '' }
  traceResult.value = null
}

function getOpeningRowClass({ rowIndex }: { rowIndex: number }) {
  return rowIndex % 2 === 0 ? 'odd-row' : 'even-row'
}

function getTimelineType(log: ReviewLog) {
  if (log.conflictFlag === 1) return 'danger'
  if (log.reviewResult === 1) return 'success'
  if (log.reviewResult === 2) return 'warning'
  return 'info'
}

function getTimelineIcon(log: ReviewLog) {
  if (log.conflictFlag === 1) return Warning
  if (log.reviewResult === 1) return CircleCheckFilled
  if (log.reviewResult === 2) return Warning
  return Clock
}

function getReviewResultType(result: number) {
  const map: Record<number, string> = {
    1: 'success',
    2: 'danger',
    3: 'info'
  }
  return map[result] || 'info'
}

function handleViewDetail(row: OpeningReviewItem) {
  currentOpening.value = row
  detailVisible.value = true
}
</script>

<style lang="scss" scoped>
.ccb-business-opening-review-trace {
  padding: 16px;

  .trace-search-card {
    margin-bottom: 16px;

    :deep(.el-card__body) {
      padding: 16px 20px;
    }
  }

  .trace-search {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }

  .trace-skeleton {
    padding: 8px 0;
  }

  .trace-result {
    .stat-card {
      :deep(.el-card__body) {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 20px;
      }

      .stat-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        color: #fff;

        &.matched { background: linear-gradient(135deg, #409eff, #66b1ff); }
        &.review { background: linear-gradient(135deg, #67c23a, #85ce61); }
        &.success { background: linear-gradient(135deg, #67c23a, #85ce61); }
        &.warning { background: linear-gradient(135deg, #e6a23c, #f0c37a); }
        &.danger { background: linear-gradient(135deg, #f56c6c, #f89898); }
      }

      .stat-info {
        .stat-label {
          font-size: 13px;
          color: #909399;
          margin-bottom: 4px;
        }
        .stat-num {
          font-size: 24px;
          font-weight: 600;
          color: #303133;

          &.success { color: #67c23a; }
          &.warning { color: #e6a23c; }
          &.danger { color: #f56c6c; }
        }
      }
    }
  }

  .alert-card {
    margin: 16px 0;

    :deep(.el-card__body) {
      padding: 0;
    }

    .trace-alert {
      margin: 0;
      border: none;

      & + .trace-alert {
        border-top: 1px solid rgba(255,255,255,0.2);
      }
    }

    .alert-detail {
      font-size: 13px;
      color: #606266;
      margin-top: 4px;
    }

    .issue-list {
      margin: 8px 0 0;
      padding: 0;
      list-style: none;

      li {
        display: flex;
        align-items: flex-start;
        gap: 6px;
        font-size: 13px;
        color: #606266;
        padding: 3px 0;

        .el-icon {
          color: #e6a23c;
          margin-top: 2px;
          flex-shrink: 0;
        }
      }
    }
  }

  .section-card {
    margin-top: 16px;

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .card-title {
        font-size: 15px;
        font-weight: 600;
        color: #303133;
        display: flex;
        align-items: center;
        gap: 6px;

        .el-icon {
          color: #409eff;
        }
      }

      .card-sub {
        font-size: 12px;
        color: #909399;
      }
    }
  }

  .trace-opening-table {
    .mono-text {
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 12px;
    }

    .conflict-icon {
      color: #f56c6c;
      font-size: 16px;
    }

    :deep(.el-table__row:hover > td) {
      background-color: #ecf5ff !important;
    }
  }

  .review-timeline {
    padding: 8px 0;

    .log-card {
      margin-bottom: 4px;
      border-radius: 8px;

      &.conflict-card {
        border: 1px solid #f56c6c;
        background-color: #fef0f0;
      }

      :deep(.el-card__body) {
        padding: 16px 18px;
      }

      .log-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;

        .log-title {
          display: flex;
          align-items: center;
          gap: 10px;

          .log-level {
            font-size: 14px;
            font-weight: 600;
            color: #303133;
          }

          .log-reviewer {
            font-size: 13px;
            color: #909399;
          }
        }

        .log-opening {
          .el-tag {
            font-family: 'Consolas', monospace;
          }
        }
      }

      .log-desc {
        margin-bottom: 12px;
      }

      .log-comment,
      .log-reject,
      .log-files {
        margin-top: 10px;

        .log-label {
          font-size: 12px;
          color: #909399;
          margin-bottom: 4px;
          font-weight: 500;
        }

        .log-text {
          font-size: 13px;
          color: #606266;
          line-height: 1.6;

          &.reject-text {
            color: #f56c6c;
          }
        }

        .truncate-text {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }

      .log-files {
        .file-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .file-tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          background: #ecf5ff;
          color: #409eff;
          border-radius: 4px;
          font-size: 12px;
          max-width: 200px;

          .el-icon {
            flex-shrink: 0;
          }

          .file-name {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
        }
      }
    }
  }

  .suggestion-list {
    margin: 0;
    padding: 0;
    list-style: none;

    li {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 10px 0;
      border-bottom: 1px dashed #ebeef5;
      font-size: 13px;
      color: #606266;

      &:last-child {
        border-bottom: none;
      }

      .sug-icon {
        color: #67c23a;
        font-size: 16px;
        margin-top: 2px;
        flex-shrink: 0;
      }
    }
  }

  .empty-trace {
    padding: 80px 0;
  }

  .mono-text {
    font-family: 'Consolas', 'Monaco', monospace;
  }

  .detail-content {
    .mono-text {
      font-size: 13px;
    }
  }
}

.scale-fade-dialog {
  :deep(.el-dialog) {
    animation: zoomFadeIn 0.3s ease-out;
  }
}

@keyframes zoomFadeIn {
  from {
    opacity: 0;
    transform: scale(0.85);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
