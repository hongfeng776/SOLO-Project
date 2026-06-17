<template>
  <div class="page-container">
    <el-row :gutter="20" class="stats-row mb-20">
      <el-col :span="8">
        <div class="stat-card stat-pending">
          <div class="stat-icon"><el-icon :size="24"><Timer /></el-icon></div>
          <div class="stat-info">
            <div class="stat-label">待审核</div>
            <div class="stat-value">{{ total }}</div>
          </div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="stat-card stat-risk">
          <div class="stat-icon"><el-icon :size="24"><Warning /></el-icon></div>
          <div class="stat-info">
            <div class="stat-label">高风险</div>
            <div class="stat-value">
              {{ riskCount }}
              <el-badge v-if="riskCount > 0" :value="riskCount" class="risk-badge" />
            </div>
          </div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="stat-card stat-today">
          <div class="stat-icon"><el-icon :size="24"><CircleCheck /></el-icon></div>
          <div class="stat-info">
            <div class="stat-label">今日审核</div>
            <div class="stat-value">{{ todayReviewed }}</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-card shadow="never" class="mb-20">
      <el-form :model="queryParams" label-width="80px" inline @submit.prevent>
        <el-form-item label="标题">
          <el-input
            v-model="queryParams.keyword"
            placeholder="请输入内容标题"
            clearable
            style="width: 220px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="审核层级">
          <el-select
            v-model="queryParams.reviewLevel"
            placeholder="全部层级"
            clearable
            style="width: 140px"
          >
            <el-option label="一级审核" :value="1" />
            <el-option label="二级审核" :value="2" />
            <el-option label="三级审核" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="内容类型">
          <el-select
            v-model="queryParams.noteType"
            placeholder="全部类型"
            clearable
            style="width: 140px"
          >
            <el-option label="图文" :value="1" />
            <el-option label="视频" :value="2" />
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
          <div class="header-left">
          <span class="card-title">内容审核</span>
            <el-tabs v-model="activeTab" class="review-tabs" @tab-change="handleTabChange">
              <el-tab-pane label="待审核" name="pending" />
              <el-tab-pane label="已通过" name="passed" />
              <el-tab-pane label="已拒绝" name="rejected" />
            </el-tabs>
          </div>
        </div>
      </template>

      <BatchActions
        :selected-ids="selectedIds"
        :selected-rows="selectedRows"
        :total="total"
        always-show
        :allow-delete="false"
        :allow-export="false"
      >
        <el-button
          type="success"
          plain
          size="small"
          :icon="CircleCheck"
          :disabled="!hasSelection"
          class="batch-btn"
          @click="handleBatchReview(ReviewAction.APPROVE)"
        >
          批量通过
        </el-button>
        <el-button
          v-if="isSeniorReviewer"
          type="danger"
          plain
          size="small"
          :icon="CircleClose"
          :disabled="!hasSelection"
          class="batch-btn"
          @click="openBatchReject"
        >
          批量拒绝
        </el-button>
        <el-button
          type="warning"
          plain
          size="small"
          :icon="Clock"
          :disabled="!hasSelection"
          class="batch-btn"
          @click="openBatchPostpone"
        >
          批量暂缓
        </el-button>
      </BatchActions>

      <HtTable
        :data="dataList"
        :loading="loading"
        :total="total"
        v-model:page="queryParams.page"
        v-model:page-size="queryParams.pageSize"
        selectable
        show-index
        row-key="id"
        :row-class-name="tableRowClassName"
        @selection-change="(rows: unknown[]) => handleSelectionChange(rows as Note[])"
        @row-dblclick="handleRowDblclick"
        @paginate="handlePaginate"
      >
        <el-table-column label="封面" width="100" align="center" resizable>
          <template #default="{ row }">
            <el-image
              v-if="row.coverImage"
              :src="row.coverImage"
              fit="cover"
              style="width: 60px; height: 60px; border-radius: 4px"
              :preview-src-list="[row.coverImage]"
            />
            <span v-else class="no-cover">无</span>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="内容标题" min-width="220" show-overflow-tooltip resizable>
          <template #default="{ row }">
            <div class="title-cell">
              <span>{{ row.title }}</span>
              <el-icon v-if="row.flowUnlocked === 1" class="unlock-icon" :size="14" color="#67c23a"><Unlock /></el-icon>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="审核权重" width="100" align="center" resizable>
          <template #default="{ row }">
            <span :class="getWeightClass(row.reviewWeight)">
              {{ row.reviewWeight ?? '-' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="审核层级" width="100" align="center" resizable>
          <template #default="{ row }">
            <transition name="status-transition" mode="out-in">
              <el-tag
              :key="row.status"
              :type="getStatusTagType(row)"
              size="small"
              effect="plain"
              class="status-tag"
              >
                {{ levelMap[row.reviewLevel] || '-' }}
              </el-tag>
            </transition>
          </template>
        </el-table-column>
        <el-table-column prop="authorName" label="作者" width="120" resizable />
        <el-table-column label="状态" width="100" align="center" resizable>
          <template #default="{ row }">
            <transition name="status-transition" mode="out-in">
              <el-tag :key="row.status" :type="getStatusType(row.status)" size="small">
                {{ statusMap[row.status] || '-' }}
              </el-tag>
            </transition>
          </template>
        </el-table-column>
        <el-table-column label="提交时间" width="160" resizable>
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="上次审核" width="140" resizable>
          <template #default="{ row }">
            <div v-if="row.lastReviewerName" class="last-review">
              <div>{{ row.lastReviewerName }}</div>
              <div class="last-review-time">{{ formatDateTime(row.lastReviewTime) }}</div>
            </div>
            <span v-else class="text-empty">-</span>
          </template>
        </el-table-column>
        <el-table-column label="拒绝/暂缓原因" min-width="160" show-overflow-tooltip resizable>
          <template #default="{ row }">
            <div v-if="row.status === 3 || row.status === 5" class="reason-cell">
              <el-icon v-if="row.isAbnormal === 1" class="abnormal-icon" :size="14" color="#e6a23c"><WarningFilled /></el-icon>
              <span :class="row.status === 3 ? 'reject-reason' : 'postpone-reason'">
                {{ row.rejectReason || row.postponeReason || '-' }}
              </span>
            </div>
            <span v-else class="text-empty">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="260" align="center" fixed="right" resizable>
          <template #default="{ row }">
            <el-button link type="primary" size="small" class="action-btn" @click="openPreview(row)">预览</el-button>
            <el-button
              v-if="row.status === 1"
              link
              type="success"
              size="small"
              class="action-btn"
              @click="handleQuickReview(row, ReviewAction.APPROVE)"
            >
              通过
            </el-button>
            <el-button
              v-if="row.status === 1"
              link
              type="danger"
              size="small"
              class="action-btn"
              @click="openAudit(row, ReviewAction.REJECT)"
            >
              拒绝
            </el-button>
            <el-button
              v-if="row.status === 1"
              link
              type="warning"
              size="small"
              class="action-btn"
              @click="openAudit(row, ReviewAction.POSTPONE)"
            >
              暂缓
            </el-button>
          </template>
        </el-table-column>
      </HtTable>
    </el-card>

    <ContentPreview v-model="previewVisible" :data="previewData">
      <template #actions="{ data }">
        <el-button
          v-if="data?.status === 1"
          type="success"
          @click="openAudit(data, ReviewAction.APPROVE)"
        >
          通过审核
        </el-button>
        <el-button
          v-if="data?.status === 1"
          type="danger"
          @click="openAudit(data, ReviewAction.REJECT)"
        >
          拒绝
        </el-button>
        <el-button
          v-if="data?.status === 1"
          type="warning"
          @click="openAudit(data, ReviewAction.POSTPONE)"
        >
          暂缓
        </el-button>
      </template>
    </ContentPreview>

    <ReviewDialog
      v-model="auditVisible"
      :data-id="currentId"
      :data-title="currentTitle"
      :data-author="currentAuthor"
      :data-time="currentTime"
      :data-level="currentLevel"
      :fast-review="fastReviewMode"
      :default-action="defaultAction"
      @submit="handleAuditSubmit"
    />

    <el-dialog
      v-model="batchRejectVisible"
      title="批量拒绝"
      width="480px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form ref="batchRejectFormRef" :model="batchRejectForm" :rules="batchRejectRules" label-width="100px">
        <el-form-item label="违规类型" prop="violationType">
          <el-select
            v-model="batchRejectForm.violationType"
            placeholder="请选择违规类型"
            style="width: 100%"
          >
            <el-option label="色情低俗" value="sexual" />
            <el-option label="虚假广告" value="false_advertising" />
            <el-option label="侵权抄袭" value="infringement" />
            <el-option label="违法违规" value="illegal" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="拒绝原因" prop="reason">
          <el-input
            v-model="batchRejectForm.reason"
            type="textarea"
            :rows="4"
            placeholder="请输入拒绝原因"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchRejectVisible = false">取消</el-button>
        <el-button type="danger" :loading="batchLoading" @click="confirmBatchReject">确认拒绝</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="batchPostponeVisible"
      title="批量暂缓"
      width="480px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form ref="batchPostponeFormRef" :model="batchPostponeForm" :rules="batchPostponeRules" label-width="100px">
        <el-form-item label="暂缓原因" prop="reason">
          <el-input
            v-model="batchPostponeForm.reason"
            type="textarea"
            :rows="4"
            placeholder="请输入暂缓原因"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchPostponeVisible = false">取消</el-button>
        <el-button type="warning" :loading="batchLoading" @click="confirmBatchPostpone">确认暂缓</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import {
  Search,
  Refresh,
  CircleCheck,
  CircleClose,
  Clock,
  Timer,
  Warning,
  Unlock,
  WarningFilled
} from '@element-plus/icons-vue'
import { useFetchList, useSelection, formatDateTime } from '@hooks/index'
import {
  getReviewQueue,
  getHighRiskCount,
  executeReview,
  batchReview
} from '@api/review'
import { getReviewerStats } from '@api/review-log'
import { NoteStatus, ReviewLevel, ReviewAction, ReviewPermission } from '@enums/business'
import type { Note } from '@/types/business'
import type { PageResult } from '@/types/api'
import { useUserStore } from '@/stores/modules/user'
import HtTable from '@components/HtTable/index.vue'
import BatchActions from '@components/BatchActions/index.vue'
import ContentPreview from '@components/ContentPreview/index.vue'
import ReviewDialog from '@components/ReviewDialog/index.vue'

const userStore = useUserStore()

const levelMap: Record<number, string> = {
  [ReviewLevel.LEVEL_1]: '一级',
  [ReviewLevel.LEVEL_2]: '二级',
  [ReviewLevel.LEVEL_3]: '三级'
}

const statusMap: Record<number, string> = {
  [NoteStatus.DRAFT]: '草稿',
  [NoteStatus.PENDING_REVIEW]: '待审核',
  [NoteStatus.PUBLISHED]: '已通过',
  [NoteStatus.REJECTED]: '已拒绝',
  [NoteStatus.OFF_SHELF]: '已下架',
  [NoteStatus.SCHEDULED]: '已暂缓'
}

const activeTab = ref('pending')
const riskCount = ref(0)
const todayReviewed = ref(0)
const fastReviewMode = ref(false)
const defaultAction = ref(ReviewAction.APPROVE)

const tabStatusMap: Record<string, number> = {
  pending: NoteStatus.PENDING_REVIEW,
  passed: NoteStatus.PUBLISHED,
  rejected: NoteStatus.REJECTED
}

const isSeniorReviewer = computed(() => {
  return (userStore.userInfo?.reviewerLevel ?? 1) >= ReviewPermission.SENIOR
})

const baseParams = computed(() => ({
  keyword: '',
  reviewLevel: undefined as number | undefined,
  noteType: undefined as number | undefined,
  status: tabStatusMap[activeTab.value]
}))

const {
  loading,
  dataList,
  total,
  queryParams,
  fetchData,
  handleSearch,
  handlePaginate
} = useFetchList<Note, {
  keyword?: string
  status?: number
  reviewLevel?: number
  noteType?: number
}>({
  fetchApi: getReviewQueue as unknown as (params: Record<string, unknown>) => Promise<PageResult<Note>>,
  defaultParams: baseParams.value
})

const handleReset = () => {
  Object.assign(queryParams, { page: 1, pageSize: 10, ...baseParams.value })
  fetchData()
  fetchRiskCount()
}

const handleTabChange = () => {
  queryParams.page = 1
  queryParams.status = tabStatusMap[activeTab.value]
  fetchData()
  fetchRiskCount()
}

const fetchRiskCount = async () => {
  try {
    const res = await getHighRiskCount(queryParams.reviewLevel as number | undefined)
    riskCount.value = res.highRisk
  } catch (error) {
    console.error(error)
  }
}

const fetchTodayStats = async () => {
  if (!userStore.userInfo?.id) return
  try {
    const res = await getReviewerStats(userStore.userInfo.id, 1)
    todayReviewed.value = res.totalReviewed
  } catch (error) {
    console.error(error)
  }
}

const { selectedRows, selectedIds, hasSelection, handleSelectionChange, clearSelection } = useSelection<Note>()

const previewVisible = ref(false)
const previewData = ref<Note | null>(null)

const auditVisible = ref(false)
const currentId = ref<number | null>(null)
const currentTitle = ref('')
const currentAuthor = ref('')
const currentTime = ref('')
const currentLevel = ref<number | undefined>(undefined)

const batchRejectVisible = ref(false)
const batchPostponeVisible = ref(false)
const batchLoading = ref(false)
const batchRejectFormRef = ref<FormInstance>()
const batchPostponeFormRef = ref<FormInstance>()

const batchRejectForm = ref({
  violationType: '',
  reason: ''
})

const batchPostponeForm = ref({
  reason: ''
})

const batchRejectRules: FormRules = {
  violationType: [{ required: true, message: '请选择违规类型', trigger: 'change' }],
  reason: [{ required: true, message: '请输入拒绝原因', trigger: 'blur' }]
}

const batchPostponeRules: FormRules = {
  reason: [{ required: true, message: '请输入暂缓原因', trigger: 'blur' }]
}

const tableRowClassName = ({ row }: { row: Note }) => {
  const classes: string[] = []
  if ((row.reviewWeight ?? 0) > 60) {
    classes.push('high-risk-row')
  }
  return classes.join(' ')
}

const getWeightClass = (weight?: number) => {
  const w = weight ?? 0
  if (w > 60) return 'weight-high'
  if (w >= 30) return 'weight-medium'
  return 'weight-low'
}

const getStatusTagType = (row: Note) => {
  return row.reviewLevel === 3 ? 'danger' : row.reviewLevel === 2 ? 'warning' : 'primary'
}

const getStatusType = (status: number) => {
  switch (status) {
    case NoteStatus.PUBLISHED:
      return 'success'
    case NoteStatus.REJECTED:
      return 'danger'
    case NoteStatus.PENDING_REVIEW:
      return 'warning'
    case NoteStatus.SCHEDULED:
      return 'info'
    default:
      return 'info'
  }
}

const openPreview = (row: Note) => {
  previewData.value = row
  previewVisible.value = true
}

const openAudit = (row: Note, action: number) => {
  currentId.value = row.id
  currentTitle.value = row.title
  currentAuthor.value = row.authorName
  currentTime.value = row.createTime
  currentLevel.value = row.reviewLevel || ReviewLevel.LEVEL_1
  defaultAction.value = action
  fastReviewMode.value = false
  auditVisible.value = true
}

const handleRowDblclick = (row: unknown) => {
  const note = row as Note
  if (note.status !== NoteStatus.PENDING_REVIEW) return
  currentId.value = note.id
  currentTitle.value = note.title
  currentAuthor.value = note.authorName
  currentTime.value = note.createTime
  currentLevel.value = note.reviewLevel || ReviewLevel.LEVEL_1
  defaultAction.value = ReviewAction.APPROVE
  fastReviewMode.value = true
  auditVisible.value = true
}

const handleQuickReview = async (row: Note, action: number) => {
  try {
    await executeReview({
      noteId: row.id,
      action,
      reviewLevel: row.reviewLevel
    })
    ElMessage.success(action === ReviewAction.APPROVE ? '审核通过' : action === ReviewAction.REJECT ? '已拒绝' : '已暂缓')
    fetchData()
    fetchTodayStats()
  } catch (error) {
    console.error(error)
  }
}

const handleAuditSubmit = async (data: { id: number; action: number; violationType?: string; reason?: string }) => {
  try {
    const result = await executeReview({
      noteId: data.id,
      action: data.action,
      violationType: data.violationType,
      reason: data.reason,
      reviewLevel: currentLevel.value
    })
    const messages: Record<number, string> = {
      [ReviewAction.APPROVE]: '审核通过',
      [ReviewAction.REJECT]: '已拒绝',
      [ReviewAction.POSTPONE]: '已暂缓'
    }
    ElMessage.success(messages[data.action] || '操作成功')
    if (result.flowUnlocked) {
      ElMessage.info('流量已解锁')
    }
    fetchData()
    fetchRiskCount()
    fetchTodayStats()
  } catch (error) {
    console.error(error)
  }
}

const handleBatchReview = async (action: number) => {
  if (action === ReviewAction.APPROVE) {
    try {
      batchLoading.value = true
      await batchReview({
        ids: selectedIds.value,
        action
      })
      ElMessage.success('批量通过成功')
      clearSelection()
      fetchData()
      fetchRiskCount()
      fetchTodayStats()
    } catch (error) {
      console.error(error)
    } finally {
      batchLoading.value = false
    }
  }
}

const openBatchReject = () => {
  batchRejectForm.value = { violationType: '', reason: '' }
  batchRejectVisible.value = true
}

const confirmBatchReject = async () => {
  if (!batchRejectFormRef.value) return
  const valid = await batchRejectFormRef.value.validate().catch(() => false)
  if (!valid) return
  try {
    batchLoading.value = true
    await batchReview({
      ids: selectedIds.value,
      action: ReviewAction.REJECT,
      violationType: batchRejectForm.value.violationType,
      reason: batchRejectForm.value.reason
    })
    ElMessage.success('批量拒绝成功')
    batchRejectVisible.value = false
    clearSelection()
    fetchData()
    fetchRiskCount()
    fetchTodayStats()
  } catch (error) {
    console.error(error)
  } finally {
    batchLoading.value = false
  }
}

const openBatchPostpone = () => {
  batchPostponeForm.value = { reason: '' }
  batchPostponeVisible.value = true
}

const confirmBatchPostpone = async () => {
  if (!batchPostponeFormRef.value) return
  const valid = await batchPostponeFormRef.value.validate().catch(() => false)
  if (!valid) return
  try {
    batchLoading.value = true
    await batchReview({
      ids: selectedIds.value,
      action: ReviewAction.POSTPONE,
      reason: batchPostponeForm.value.reason
    })
    ElMessage.success('批量暂缓成功')
    batchPostponeVisible.value = false
    clearSelection()
    fetchData()
    fetchRiskCount()
    fetchTodayStats()
  } catch (error) {
    console.error(error)
  } finally {
    batchLoading.value = false
  }
}

onMounted(() => {
  fetchRiskCount()
  fetchTodayStats()
})
</script>

<style lang="scss" scoped>
.page-container {
  .stats-row {
    .stat-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .stat-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
      }

      .stat-info {
        .stat-label {
          font-size: 13px;
          color: $text-secondary;
          margin-bottom: 4px;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 600;
          color: $text-primary;
          position: relative;

          .risk-badge {
            position: absolute;
            top: -8px;
            right: -24px;
          }
        }
      }

      &.stat-pending {
        .stat-icon {
          background: linear-gradient(135deg, #409eff, #66b1ff);
        }
      }

      &.stat-risk {
        .stat-icon {
          background: linear-gradient(135deg, #f56c6c, #f78989);
        }
      }

      &.stat-today {
        .stat-icon {
          background: linear-gradient(135deg, #67c23a, #85ce61);
        }
      }
    }
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 24px;
  }

  .card-title {
    font-size: 15px;
    font-weight: 600;
    color: $text-primary;
  }

  .review-tabs {
    margin: -12px 0;

    :deep(.el-tabs__header) {
      margin: 0;
      border: none;
    }

    :deep(.el-tabs__item) {
      height: 40px;
      line-height: 40px;
    }
  }

  .batch-btn {
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transform: translateY(-1px);
    }

    &:active {
      animation: ripple 0.6s ease-out;
    }
  }

  @keyframes ripple {
    0% {
      box-shadow: 0 0 0 0 rgba(64, 158, 255, 0.4);
    }
    100% {
      box-shadow: 0 0 0 10px rgba(64, 158, 255, 0);
    }
  }

  .title-cell {
    display: flex;
    align-items: center;
    gap: 6px;

    .unlock-icon {
      flex-shrink: 0;
    }
  }

  .no-cover {
    color: $text-placeholder;
    font-size: 12px;
  }

  .weight-low {
    color: #67c23a;
    font-weight: 600;
  }

  .weight-medium {
    color: #e6a23c;
    font-weight: 600;
  }

  .weight-high {
    color: #f56c6c;
    font-weight: 600;
  }

  .status-tag {
    transition: all 0.3s ease;
  }

  .last-review {
    font-size: 12px;

    .last-review-time {
      color: $text-placeholder;
      font-size: 11px;
    }
  }

  .reason-cell {
    display: flex;
    align-items: center;
    gap: 4px;

    .abnormal-icon {
      flex-shrink: 0;
    }
  }

  .reject-reason {
    color: $color-danger;
  }

  .postpone-reason {
    color: #e6a23c;
  }

  .text-empty {
    color: $text-placeholder;
  }

  .action-btn {
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transform: translateY(-1px);
    }
  }

  :deep(.high-risk-row) {
    background-color: rgba(245, 108, 108, 0.08) !important;

    &:hover {
      background-color: rgba(245, 108, 108, 0.15) !important;
    }
  }

  :deep(.el-table__body tr.current-row > td) {
    background-color: rgba(64, 158, 255, 0.08) !important;
  }

  :deep(.el-table__row.selected-row) {
    background-color: rgba(64, 158, 255, 0.05) !important;
  }

  .status-transition-enter-active,
  .status-transition-leave-active {
    transition: all 0.3s ease;
  }

  .status-transition-enter-from,
  .status-transition-leave-to {
    opacity: 0;
    transform: scale(0.95);
  }

  .mb-20 {
    margin-bottom: 20px;
  }
}
</style>
