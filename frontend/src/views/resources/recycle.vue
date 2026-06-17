<template>
  <div class="recycle-page">
    <div class="page-header">
      <h2 class="page-title">回收站管理</h2>
    </div>

    <div class="filter-card card-wrapper">
      <el-form inline :model="filterForm" class="filter-form">
        <el-form-item label="关键词">
          <el-input
            v-model="filterForm.keyword"
            placeholder="素材名称/编码"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="审核状态">
          <el-select v-model="filterForm.reviewStatus" placeholder="全部" clearable style="width: 140px">
            <el-option
              v-for="item in reviewStatusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="素材类型">
          <el-select v-model="filterForm.resourceType" placeholder="全部" clearable style="width: 120px">
            <el-option
              v-for="item in typeOptions"
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
    </div>

    <div class="table-card">
      <div class="toolbar">
        <el-tag type="warning" effect="dark">待审核：{{ pendingCount }}</el-tag>
        <div class="actions">
          <el-button
            size="small"
            :disabled="selectedIds.length === 0"
            type="success"
            @click="openBatchRestore"
          >
            批量恢复
          </el-button>
        </div>
      </div>

      <el-table
        :data="tableData"
        border
        stripe
        :resizable="true"
        @selection-change="onSelectionChange"
        @row-dblclick="openDetail"
        :row-style="getRowStyle"
        :header-cell-style="{ background: '#fafafa', position: 'sticky', top: 0, zIndex: 10 }"
        height="600"
        v-loading="loading"
      >
        <el-table-column type="selection" width="55" fixed="left" />
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column prop="resourceTitle" label="素材名称" min-width="200" :show-overflow-tooltip="true">
          <template #default="{ row }">
            <span class="dblclick-hint" @dblclick="openDetail(row)">{{ row.resourceTitle }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="materialCode" label="素材编码" width="160">
          <template #default="{ row }">
            <el-tooltip :content="row.materialCode" placement="top">
              <span class="mono-code">{{ row.materialCode }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="素材类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small">{{ typeLabel[row.resourceType] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="原始状态" width="100" align="center">
          <template #default="{ row }">
            <StatusTag :status="row.originalStatus" />
          </template>
        </el-table-column>
        <el-table-column
          prop="originalCategoryName"
          label="原始分类"
          width="120"
          :show-overflow-tooltip="true"
        />
        <el-table-column label="审核状态" width="110" align="center">
          <template #default="{ row }">
            <div class="review-status">
              <span class="status-dot" :class="row.reviewStatus"></span>
              <span class="review-label" :class="row.reviewStatus">
                {{ reviewLabel[row.reviewStatus] }}
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="applicantName" label="申请人" width="100" />
        <el-table-column prop="applyTime" label="申请时间" width="160" />
        <el-table-column prop="expireAt" label="销毁时间" width="160">
          <template #default="{ row }">
            <el-tooltip v-if="isExpiring(row)" content="即将到期" placement="top">
              <span class="expire-warning">{{ row.expireAt }}</span>
            </el-tooltip>
            <span v-else>{{ row.expireAt }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              v-if="row.reviewStatus === 'pending'"
              size="small"
              link
              type="success"
              @click="openReview(row, 'approved')"
            >通过</el-button>
            <el-button
              v-if="row.reviewStatus === 'pending'"
              size="small"
              link
              type="danger"
              @click="openReview(row, 'rejected')"
            >驳回</el-button>
            <el-button
              v-if="row.reviewStatus === 'approved' && !row.isDestroyed"
              size="small"
              link
              type="primary"
              @click="restoreItem(row)"
            >恢复</el-button>
            <el-button size="small" link @click="openDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="selectedIds.length > 0" class="batch-bar">
        已选择 <b>{{ selectedIds.length }}</b> 项
        <el-button
          size="small"
          type="success"
          @click="batchApproveSelected"
        >批量通过</el-button>
        <el-button
          size="small"
          type="danger"
          @click="batchRejectSelected"
        >批量驳回</el-button>
      </div>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchList"
          @current-change="fetchList"
        />
      </div>
    </div>

    <el-dialog
      v-model="reviewDialogVisible"
      :title="`审核废弃申请 - ${reviewResult === 'approved' ? '通过' : '驳回'}`"
      width="520px"
      :close-on-click-modal="false"
    >
      <div v-if="currentReviewItem" class="review-dialog">
        <el-descriptions :column="1" border size="small" style="margin-bottom: 16px">
          <el-descriptions-item label="素材名称">
            <span class="review-res-title">{{ currentReviewItem.resourceTitle }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="素材编码">{{ currentReviewItem.materialCode }}</el-descriptions-item>
          <el-descriptions-item label="废弃原因">
            <span style="color: #606266">{{ currentReviewItem.discardReason }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="申请人">{{ currentReviewItem.applicantName }}</el-descriptions-item>
          <el-descriptions-item label="申请时间">{{ currentReviewItem.applyTime }}</el-descriptions-item>
        </el-descriptions>
        <el-form label-width="80px">
          <el-form-item label="审核意见">
            <el-input
              v-model="reviewOpinion"
              type="textarea"
              :rows="3"
              :placeholder="reviewResult === 'approved' ? '请输入通过意见（选填）' : '请输入驳回原因（必填）'"
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="reviewDialogVisible = false">取消</el-button>
        <el-button
          :type="reviewResult === 'approved' ? 'success' : 'danger'"
          :loading="reviewSubmitting"
          @click="submitReview"
        >
          确认{{ reviewResult === 'approved' ? '通过' : '驳回' }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="detailDialogVisible"
      title="回收站详情"
      width="720px"
      :close-on-click-modal="false"
    >
      <div v-if="currentDetailItem" class="detail-dialog" v-loading="detailLoading">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="素材名称" :span="2">
            {{ currentDetailItem.resourceTitle }}
          </el-descriptions-item>
          <el-descriptions-item label="素材编码">{{ currentDetailItem.materialCode }}</el-descriptions-item>
          <el-descriptions-item label="素材类型">{{ typeLabel[currentDetailItem.resourceType] }}</el-descriptions-item>
          <el-descriptions-item label="原始状态">
            <StatusTag :status="currentDetailItem.originalStatus" />
          </el-descriptions-item>
          <el-descriptions-item label="原始分类">{{ currentDetailItem.originalCategoryName }}</el-descriptions-item>
          <el-descriptions-item label="作者">{{ currentDetailItem.authorName }}</el-descriptions-item>
          <el-descriptions-item label="关联作品数">{{ currentDetailItem.relatedWorks }}</el-descriptions-item>
          <el-descriptions-item label="申请时间">{{ currentDetailItem.applyTime }}</el-descriptions-item>
          <el-descriptions-item label="销毁时间">
            <span v-if="isExpiring(currentDetailItem)" class="expire-warning">
              {{ currentDetailItem.expireAt }}
            </span>
            <span v-else>{{ currentDetailItem.expireAt }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="是否已销毁">
            <el-tag :type="currentDetailItem.isDestroyed ? 'danger' : 'info'" size="small">
              {{ currentDetailItem.isDestroyed ? '已销毁' : '未销毁' }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <div class="detail-section">
          <h4 class="detail-section-title">
            <el-icon style="color: #f56c6c"><Warning /></el-icon>
            废弃原因
          </h4>
          <div class="detail-section-content">
            {{ currentDetailItem.discardReason }}
          </div>
        </div>

        <div class="detail-section">
          <h4 class="detail-section-title">
            <el-icon style="color: #409eff"><Document /></el-icon>
            审核记录
          </h4>
          <div v-if="currentDetailItem.reviewStatus !== 'pending'" class="review-record">
            <div class="review-status-line">
              <span class="status-dot" :class="currentDetailItem.reviewStatus"></span>
              <span class="review-label" :class="currentDetailItem.reviewStatus">
                {{ reviewLabel[currentDetailItem.reviewStatus] }}
              </span>
            </div>
            <div class="review-info">
              <span>审核人：{{ currentDetailItem.reviewerName }}</span>
              <span style="margin-left: 16px">审核时间：{{ currentDetailItem.reviewTime }}</span>
            </div>
            <div v-if="currentDetailItem.reviewOpinion" class="review-opinion">
              审核意见：{{ currentDetailItem.reviewOpinion }}
            </div>
          </div>
          <el-empty v-else description="暂无审核记录" :image-size="60" />
        </div>

        <div v-if="currentDetailItem.snapshot" class="detail-section">
          <h4 class="detail-section-title">
            <el-icon style="color: #67c23a"><DataLine /></el-icon>
            原始信息快照
          </h4>
          <pre class="snapshot-content">{{ formatSnapshot(currentDetailItem.snapshot) }}</pre>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button
          v-if="currentDetailItem?.reviewStatus === 'approved' && !currentDetailItem?.isDestroyed"
          type="primary"
          @click="restoreFromDetail"
        >
          恢复素材
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="batchRestoreDialogVisible"
      title="批量恢复确认"
      width="480px"
      :close-on-click-modal="false"
    >
      <el-alert
        type="warning"
        :closable="false"
        show-icon
        :title="`即将恢复 ${selectedIds.length} 项素材，恢复后将返回原始状态`"
        style="margin-bottom: 16px"
      />
      <p style="color: #606266; margin-bottom: 16px">
        系统将自动执行分类适配校验，不符合要求的素材将被单独列出。
      </p>
      <template #footer>
        <el-button @click="batchRestoreDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="batchRestoreSubmitting" @click="doBatchRestore">
          确认恢复
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="batchResultDialogVisible"
      title="批量操作结果"
      width="560px"
    >
      <div class="batch-result-summary">
        <div class="result-item success">
          <el-icon color="#67c23a"><CircleCheck /></el-icon>
          <span>合规：{{ batchResult.successCount }} 项</span>
        </div>
        <div class="result-item danger">
          <el-icon color="#f56c6c"><CircleClose /></el-icon>
          <span>不合规：{{ batchResult.failedCount }} 项</span>
        </div>
      </div>
      <div v-if="batchResult.failedItems.length > 0" class="failed-list">
        <h4 style="margin: 16px 0 8px; color: #f56c6c">不合规素材列表：</h4>
        <el-table :data="batchResult.failedItems" border size="small" max-height="300">
          <el-table-column prop="title" label="素材名称" min-width="160" show-overflow-tooltip />
          <el-table-column prop="reason" label="原因" min-width="200" show-overflow-tooltip />
        </el-table>
      </div>
      <template #footer>
        <el-button type="primary" @click="batchResultDialogVisible = false">知道了</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import {
  Search,
  Refresh,
  Warning,
  Document,
  DataLine,
  CircleCheck,
  CircleClose
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { StatusTag } from '@/components/business'
import { FileTypeLabel } from '@/constants'
import * as recycleApi from '@/api/recycle'
import type { RecycleItem } from '@/types'

const loading = ref(false)
const detailLoading = ref(false)
const tableData = ref<RecycleItem[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const pendingCount = ref(0)

const selectedRows = ref<RecycleItem[]>([])
const selectedIds = ref<number[]>([])

const filterForm = reactive({
  keyword: '',
  reviewStatus: '',
  resourceType: ''
})

const reviewStatusOptions = [
  { value: 'pending', label: '待审核' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已驳回' }
]

const typeOptions = Object.entries(FileTypeLabel).map(([value, label]) => ({ value, label }))
const typeLabel = FileTypeLabel as Record<string, string>

const reviewLabel: Record<string, string> = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已驳回'
}

const reviewDialogVisible = ref(false)
const reviewResult = ref('approved')
const reviewOpinion = ref('')
const reviewSubmitting = ref(false)
const currentReviewItem = ref<RecycleItem | null>(null)

const detailDialogVisible = ref(false)
const currentDetailItem = ref<RecycleItem | null>(null)

const batchRestoreDialogVisible = ref(false)
const batchRestoreSubmitting = ref(false)

const batchResultDialogVisible = ref(false)
const batchResult = reactive({
  successCount: 0,
  failedCount: 0,
  failedItems: [] as { title: string; reason: string }[]
})

const fetchPendingCount = async () => {
  try {
    const res = await recycleApi.getPendingCount()
    pendingCount.value = res.data ?? 0
  } catch (e) {
    console.error('获取待审核数失败:', e)
  }
}

const fetchList = async () => {
  loading.value = true
  try {
    const res = await recycleApi.getRecycleList({
      page: page.value,
      pageSize: pageSize.value,
      keyword: filterForm.keyword || undefined,
      reviewStatus: filterForm.reviewStatus || undefined,
      resourceType: filterForm.resourceType || undefined
    })
    tableData.value = res.data.list
    total.value = res.data.total
  } catch (error) {
    console.error('获取回收站列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  page.value = 1
  fetchList()
}

const handleReset = () => {
  filterForm.keyword = ''
  filterForm.reviewStatus = ''
  filterForm.resourceType = ''
  page.value = 1
  fetchList()
}

const onSelectionChange = (rows: RecycleItem[]) => {
  selectedRows.value = rows
  selectedIds.value = rows.map((r) => r.id)
}

const getRowStyle = ({ row }: { row: RecycleItem }) => {
  if (selectedIds.value.includes(row.id)) {
    return { backgroundColor: '#e1f3d8', fontWeight: '500' }
  }
  return {}
}

const isExpiring = (row: RecycleItem) => {
  if (!row.expireAt || row.isDestroyed) return false
  const expire = new Date(row.expireAt).getTime()
  const now = Date.now()
  const threeDays = 3 * 24 * 60 * 60 * 1000
  return expire - now < threeDays && expire > now
}

const formatSnapshot = (snapshot: string) => {
  try {
    return JSON.stringify(JSON.parse(snapshot), null, 2)
  } catch {
    return snapshot
  }
}

const openReview = (row: RecycleItem, result: string) => {
  currentReviewItem.value = row
  reviewResult.value = result
  reviewOpinion.value = ''
  reviewDialogVisible.value = true
}

const submitReview = async () => {
  if (!currentReviewItem.value) return
  if (reviewResult.value === 'rejected' && !reviewOpinion.value.trim()) {
    ElMessage.warning('请输入驳回原因')
    return
  }
  reviewSubmitting.value = true
  try {
    await recycleApi.reviewDiscard(
      currentReviewItem.value.id,
      reviewResult.value,
      reviewOpinion.value
    )
    ElMessage.success(reviewResult.value === 'approved' ? '审核通过成功' : '审核驳回成功')
    reviewDialogVisible.value = false
    fetchList()
    fetchPendingCount()
  } catch (e: any) {
    ElMessage.error(e?.message || '审核操作失败')
  } finally {
    reviewSubmitting.value = false
  }
}

const restoreItem = async (row: RecycleItem) => {
  if (row.isDestroyed) {
    ElMessage.warning('该素材已销毁，无法恢复')
    return
  }
  try {
    const validateRes = await recycleApi.validateRestore(row.id)
    const validateData: any = validateRes.data
    if (!validateData.valid && validateData.errors && validateData.errors.length > 0) {
      ElMessageBox.alert(
        `<div>恢复校验失败：<br/>${validateData.errors.map((e: string) => `• ${e}`).join('<br/>')}</div>`,
        '校验不通过',
        { dangerouslyUseHTMLString: true, type: 'error', confirmButtonText: '知道了' }
      )
      return
    }

    let confirmMessage = `确定要恢复素材「${row.resourceTitle}」吗？`
    if (validateData.warnings && validateData.warnings.length > 0) {
      confirmMessage += `<br/><br/><b style="color: #e6a23c">注意：</b><br/>${validateData.warnings.map((w: string) => `• ${w}`).join('<br/>')}`
    }

    await ElMessageBox.confirm(confirmMessage, '恢复确认', {
      dangerouslyUseHTMLString: true,
      type: 'warning',
      confirmButtonText: '确认恢复',
      cancelButtonText: '取消'
    })

    await recycleApi.restoreResource(row.id)
    ElMessage.success('恢复成功')
    fetchList()
    fetchPendingCount()
    if (detailDialogVisible.value) {
      detailDialogVisible.value = false
    }
  } catch (e: any) {
    if (e !== 'cancel') {
      ElMessage.error(e?.message || '恢复失败')
    }
  }
}

const restoreFromDetail = () => {
  if (currentDetailItem.value) {
    restoreItem(currentDetailItem.value)
  }
}

const openDetail = async (row: RecycleItem) => {
  currentDetailItem.value = row
  detailDialogVisible.value = true
  detailLoading.value = true
  try {
    const res = await recycleApi.getRecycleDetail(row.id)
    currentDetailItem.value = res.data
  } catch (e) {
    console.error('获取详情失败:', e)
  } finally {
    detailLoading.value = false
  }
}

const batchApproveSelected = async () => {
  const pendingItems = selectedRows.value.filter((r) => r.reviewStatus === 'pending')
  if (pendingItems.length === 0) {
    ElMessage.warning('请选择待审核的记录')
    return
  }
  try {
    await ElMessageBox.confirm(
      `确定要批量通过选中的 ${pendingItems.length} 项废弃申请吗？`,
      '批量通过确认',
      { type: 'warning' }
    )
    let successCount = 0
    let failedItems: { title: string; reason: string }[] = []
    for (const item of pendingItems) {
      try {
        await recycleApi.reviewDiscard(item.id, 'approved', '批量审核通过')
        successCount++
      } catch (e: any) {
        failedItems.push({ title: item.resourceTitle, reason: e?.message || '操作失败' })
      }
    }
    showBatchResult(successCount, failedItems)
    fetchList()
    fetchPendingCount()
  } catch (e) {
    if (e !== 'cancel') {
      console.error(e)
    }
  }
}

const batchRejectSelected = async () => {
  const pendingItems = selectedRows.value.filter((r) => r.reviewStatus === 'pending')
  if (pendingItems.length === 0) {
    ElMessage.warning('请选择待审核的记录')
    return
  }
  try {
    const { value: opinion } = await ElMessageBox.prompt(
      `即将批量驳回 ${pendingItems.length} 项废弃申请，请输入驳回原因：`,
      '批量驳回确认',
      {
        confirmButtonText: '确认驳回',
        cancelButtonText: '取消',
        inputPlaceholder: '请输入驳回原因',
        inputValidator: (v: string) => !!v?.trim() || '请输入驳回原因'
      }
    )
    let successCount = 0
    let failedItems: { title: string; reason: string }[] = []
    for (const item of pendingItems) {
      try {
        await recycleApi.reviewDiscard(item.id, 'rejected', opinion)
        successCount++
      } catch (e: any) {
        failedItems.push({ title: item.resourceTitle, reason: e?.message || '操作失败' })
      }
    }
    showBatchResult(successCount, failedItems)
    fetchList()
    fetchPendingCount()
  } catch (e) {
    if (e !== 'cancel') {
      console.error(e)
    }
  }
}

const openBatchRestore = () => {
  batchRestoreDialogVisible.value = true
}

const doBatchRestore = async () => {
  if (selectedIds.value.length === 0) return
  batchRestoreSubmitting.value = true
  try {
    const res = await recycleApi.batchRestore(selectedIds.value)
    const data: any = res.data
    batchResult.successCount = data?.successCount ?? data?.successIds?.length ?? 0
    batchResult.failedCount = data?.failedCount ?? data?.failedItems?.length ?? 0
    batchResult.failedItems = data?.failedItems ?? []
    batchRestoreDialogVisible.value = false
    batchResultDialogVisible.value = true
    fetchList()
    fetchPendingCount()
  } catch (e: any) {
    ElMessage.error(e?.message || '批量恢复失败')
  } finally {
    batchRestoreSubmitting.value = false
  }
}

const showBatchResult = (success: number, failed: { title: string; reason: string }[]) => {
  batchResult.successCount = success
  batchResult.failedCount = failed.length
  batchResult.failedItems = failed
  batchResultDialogVisible.value = true
}

onMounted(() => {
  fetchList()
  fetchPendingCount()
})
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.recycle-page {
  .page-header {
    margin-bottom: 16px;

    .page-title {
      font-size: $font-size-extra-large;
      font-weight: 600;
      color: $text-primary;
    }
  }

  .filter-card {
    margin-bottom: 16px;
  }

  .table-card {
    background: $bg-color-ffffff;
    border-radius: $border-radius-large;
    padding: 20px;

    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;

      .actions {
        display: flex;
        gap: 8px;
      }
    }

    .batch-bar {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 16px;
      padding: 12px 16px;
      background: #f5f7fa;
      border-radius: $border-radius;
      font-size: $font-size-small;

      b {
        color: $primary-color;
      }
    }

    .pagination-wrapper {
      margin-top: 16px;
      display: flex;
      justify-content: flex-end;
    }
  }
}

.mono-code {
  font-family: 'Courier New', monospace;
  color: $primary-color;
  font-size: 12px;
}

.dblclick-hint {
  cursor: pointer;
  &:hover {
    color: $primary-color;
    text-decoration: underline;
  }
}

.review-status {
  display: flex;
  align-items: center;
  justify-content: center;

  .status-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 6px;
    animation: pulse 2s ease-in-out infinite;

    &.pending {
      background: #e6a23c;
    }
    &.approved {
      background: #67c23a;
    }
    &.rejected {
      background: #f56c6c;
    }
  }

  .review-label {
    font-size: $font-size-extra-small;

    &.pending {
      color: #e6a23c;
    }
    &.approved {
      color: #67c23a;
    }
    &.rejected {
      color: #f56c6c;
    }
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}

.expire-warning {
  color: #f56c6c;
  font-weight: 500;
  animation: blink 1.5s ease-in-out infinite;
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.review-dialog {
  .review-res-title {
    font-weight: 500;
    color: $text-primary;
  }
}

.detail-dialog {
  .detail-section {
    margin-top: 20px;

    .detail-section-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: $font-size-medium;
      font-weight: 600;
      color: $text-primary;
      margin-bottom: 10px;
      padding-left: 10px;
      border-left: 3px solid $primary-color;
    }

    .detail-section-content {
      padding: 12px 16px;
      background: rgba($danger-color, 0.04);
      border-left: 3px solid $danger-color;
      border-radius: 0 $border-radius $border-radius 0;
      color: $text-regular;
      line-height: 1.6;
    }
  }

  .review-record {
    padding: 12px 16px;
    background: #f5f7fa;
    border-radius: $border-radius;

    .review-status-line {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
    }

    .review-info {
      font-size: $font-size-extra-small;
      color: $text-secondary;
      margin-bottom: 8px;
    }

    .review-opinion {
      padding: 8px 12px;
      background: $bg-color-ffffff;
      border-radius: $border-radius;
      font-size: $font-size-small;
      color: $text-regular;
    }
  }

  .snapshot-content {
    padding: 12px 16px;
    background: #2d2d2d;
    color: #e6e6e6;
    border-radius: $border-radius;
    font-family: 'Courier New', monospace;
    font-size: $font-size-extra-small;
    max-height: 300px;
    overflow: auto;
    margin: 0;
  }
}

.batch-result-summary {
  display: flex;
  gap: 24px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: $border-radius;

  .result-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: $font-size-base;
    font-weight: 500;

    &.success {
      color: #67c23a;
    }
    &.danger {
      color: #f56c6c;
    }
  }
}

.failed-list {
  h4 {
    font-size: $font-size-small;
  }
}

:deep(.el-table__row.selected-row) {
  background-color: #e1f3d8 !important;
  font-weight: 500;
}
</style>
