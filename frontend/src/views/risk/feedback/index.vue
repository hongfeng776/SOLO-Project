<template>
  <div class="page-container">
    <el-row :gutter="16" class="mb-20">
      <el-col :xs="12" :sm="6" v-for="item in statCards" :key="item.key">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" :style="{ background: item.color + '15', color: item.color }">
            <el-icon :size="28"><component :is="item.icon" /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ formatCompact(item.value) }}</div>
            <div class="stat-label">{{ item.label }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" class="mb-20">
      <el-form :model="queryParams" label-width="80px" inline @submit.prevent>
        <el-form-item label="关键词">
          <el-input
            v-model="queryParams.keyword"
            placeholder="搜索标题/内容"
            clearable
            style="width: 220px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="类型">
          <el-select
            v-model="queryParams.type"
            placeholder="全部类型"
            clearable
            style="width: 140px"
          >
            <el-option v-for="(label, value) in typeOptions" :key="value" :label="label" :value="value" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="queryParams.status"
            placeholder="全部状态"
            clearable
            style="width: 140px"
          >
            <el-option v-for="(label, value) in statusOptions" :key="value" :label="label" :value="Number(value)" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级">
          <el-select
            v-model="queryParams.priority"
            placeholder="全部优先级"
            clearable
            style="width: 140px"
          >
            <el-option v-for="(label, value) in priorityOptions" :key="value" :label="label" :value="Number(value)" />
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
          <span class="card-title">反馈列表</span>
        </div>
      </template>

      <BatchActions
        v-model:selected-ids="selectedIds"
        :selected-rows="selectedRows"
        :total="total"
        :delete-api="handleBatchDeleteApi"
        :allow-delete="false"
        @select-all="handleSelectAll"
        @clear="clearSelection"
        @delete="handleBatchDeleted"
      >
        <el-button type="primary" plain size="small" :icon="Operation" :disabled="!hasSelection" @click="handleBatchHandle">
          批量处理
        </el-button>
        <el-button type="info" plain size="small" :icon="Close" :disabled="!hasSelection" @click="handleBatchClose">
          批量关闭
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
        @selection-change="(rows: unknown[]) => handleSelectionChange(rows as Feedback[])"
        @paginate="handlePaginate"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="userName" label="反馈用户" width="120" />
        <el-table-column label="类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" effect="plain">
              {{ typeOptions[row.type] || row.type }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
        <el-table-column label="优先级" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="priorityTagMap[row.priority] || 'info'" size="small">
              {{ priorityOptions[row.priority] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTagMap[row.status] || 'info'" size="small">
              {{ statusOptions[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="handlerName" label="处理人" width="100" />
        <el-table-column label="提交时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleViewDetail(row)">查看详情</el-button>
            <el-button
              v-if="row.status !== 3 && row.status !== 4"
              link
              type="primary"
              size="small"
              @click="openHandleDialog(row)"
            >
              处理
            </el-button>
            <el-button
              v-if="row.status !== 4"
              link
              type="info"
              size="small"
              @click="handleClose(row)"
            >
              关闭
            </el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </HtTable>
    </el-card>

    <el-dialog
      v-model="handleDialogVisible"
      title="处理反馈"
      width="560px"
      destroy-on-close
      @close="handleDialogClose"
    >
      <el-form ref="handleFormRef" :model="handleFormData" :rules="handleRules" label-width="100px">
        <el-form-item label="反馈标题">
          <span>{{ currentFeedback?.title }}</span>
        </el-form-item>
        <el-form-item label="反馈类型">
          <el-tag size="small" effect="plain">
            {{ currentFeedback ? typeOptions[currentFeedback.type] || currentFeedback.type : '' }}
          </el-tag>
        </el-form-item>
        <el-form-item label="处理结果" prop="handleResult">
          <el-input
            v-model="handleFormData.handleResult"
            type="textarea"
            :rows="6"
            placeholder="请输入处理结果"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleDialogClose">取消</el-button>
        <el-button type="primary" :loading="handleLoading" @click="submitHandle">提交处理</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="detailDialogVisible"
      title="反馈详情"
      width="640px"
      destroy-on-close
    >
      <el-descriptions :column="2" border v-if="currentFeedback">
        <el-descriptions-item label="ID">{{ currentFeedback.id }}</el-descriptions-item>
        <el-descriptions-item label="反馈用户">{{ currentFeedback.userName }}</el-descriptions-item>
        <el-descriptions-item label="类型">
          <el-tag size="small" effect="plain">
            {{ typeOptions[currentFeedback.type] || currentFeedback.type }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="优先级">
          <el-tag :type="priorityTagMap[currentFeedback.priority] || 'info'" size="small">
            {{ priorityOptions[currentFeedback.priority] }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="标题" :span="2">{{ currentFeedback.title }}</el-descriptions-item>
        <el-descriptions-item label="反馈内容" :span="2">
          <div class="feedback-content">{{ currentFeedback.content }}</div>
        </el-descriptions-item>
        <el-descriptions-item label="联系方式" :span="2">{{ currentFeedback.contact || '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusTagMap[currentFeedback.status] || 'info'" size="small">
            {{ statusOptions[currentFeedback.status] }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="处理人">{{ currentFeedback.handlerName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="提交时间">{{ formatDateTime(currentFeedback.createTime) }}</el-descriptions-item>
        <el-descriptions-item label="处理时间">{{ currentFeedback.handleTime ? formatDateTime(currentFeedback.handleTime) : '-' }}</el-descriptions-item>
        <el-descriptions-item v-if="currentFeedback.handleResult" label="处理结果" :span="2">
          <div class="handle-result">{{ currentFeedback.handleResult }}</div>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import {
  Search,
  Refresh,
  Message,
  Operation,
  Close
} from '@element-plus/icons-vue'
import { useFetchList, useSelection, formatDateTime } from '@hooks/index'
import { useNumberFormat } from '@hooks/useFormat'
import {
  getFeedbackList,
  getFeedbackDetail,
  handleFeedback,
  batchHandleFeedbacks,
  closeFeedback,
  deleteFeedback,
  getFeedbackStats
} from '@api/feedback'
import { FeedbackType, FeedbackStatus, FeedbackPriority } from '@enums/business'
import type { Feedback } from '@/types/business'
import HtTable from '@components/HtTable/index.vue'
import BatchActions from '@components/BatchActions/index.vue'

const { formatCompact } = useNumberFormat()

const typeOptions: Record<string, string> = {
  [FeedbackType.BUG]: 'Bug反馈',
  [FeedbackType.SUGGESTION]: '功能建议',
  [FeedbackType.COMPLAINT]: '投诉',
  [FeedbackType.OTHER]: '其他'
}

const statusOptions: Record<number, string> = {
  [FeedbackStatus.PENDING]: '待处理',
  [FeedbackStatus.PROCESSING]: '处理中',
  [FeedbackStatus.RESOLVED]: '已解决',
  [FeedbackStatus.CLOSED]: '已关闭'
}

const statusTagMap: Record<number, string> = {
  [FeedbackStatus.PENDING]: 'warning',
  [FeedbackStatus.PROCESSING]: 'primary',
  [FeedbackStatus.RESOLVED]: 'success',
  [FeedbackStatus.CLOSED]: 'info'
}

const priorityOptions: Record<number, string> = {
  [FeedbackPriority.URGENT]: '紧急',
  [FeedbackPriority.NORMAL]: '普通',
  [FeedbackPriority.LOW]: '低'
}

const priorityTagMap: Record<number, string> = {
  [FeedbackPriority.URGENT]: 'danger',
  [FeedbackPriority.NORMAL]: 'primary',
  [FeedbackPriority.LOW]: 'info'
}

const {
  loading,
  dataList,
  total,
  queryParams,
  fetchData,
  handleSearch,
  handleReset,
  handlePaginate
} = useFetchList<Feedback, { keyword?: string; type?: string; status?: number; priority?: number }>({
  fetchApi: getFeedbackList,
  defaultParams: { keyword: '', type: undefined, status: undefined, priority: undefined },
  immediate: false
})

const { selectedRows, selectedIds, hasSelection, handleSelectionChange, clearSelection } = useSelection<Feedback>()

const statCards = ref([
  { key: 'total', label: '反馈总数', value: 0, icon: Message, color: '#409eff' },
  { key: 'pending', label: '待处理', value: 0, icon: Message, color: '#e6a23c' },
  { key: 'processing', label: '处理中', value: 0, icon: Operation, color: '#67c23a' },
  { key: 'resolved', label: '已解决', value: 0, icon: Message, color: '#909399' }
])

const loadStats = async () => {
  try {
    const stats = await getFeedbackStats()
    statCards.value.forEach((item) => {
      if (stats[item.key] != null) {
        item.value = stats[item.key]
      }
    })
  } catch (error) {
    console.error(error)
  }
}

const currentFeedback = ref<Feedback | null>(null)

const detailDialogVisible = ref(false)

const handleViewDetail = async (row: Feedback) => {
  try {
    const detail = await getFeedbackDetail(row.id)
    currentFeedback.value = detail
    detailDialogVisible.value = true
  } catch (error) {
    console.error(error)
  }
}

const handleDialogVisible = ref(false)
const handleFormRef = ref<FormInstance>()
const handleLoading = ref(false)
const handleFormData = reactive({
  handleResult: ''
})

const handleRules: FormRules = {
  handleResult: [{ required: true, message: '请输入处理结果', trigger: 'blur' }]
}

const openHandleDialog = (row: Feedback) => {
  currentFeedback.value = row
  handleFormData.handleResult = ''
  handleDialogVisible.value = true
}

const handleDialogClose = () => {
  handleDialogVisible.value = false
  handleFormRef.value?.resetFields()
}

const submitHandle = async () => {
  if (!handleFormRef.value || !currentFeedback.value) return
  const valid = await handleFormRef.value.validate().catch(() => false)
  if (!valid) return

  handleLoading.value = true
  try {
    await handleFeedback(currentFeedback.value.id, {
      handleResult: handleFormData.handleResult,
      status: FeedbackStatus.RESOLVED
    })
    ElMessage.success('处理成功')
    handleDialogVisible.value = false
    fetchData()
    loadStats()
  } catch (error) {
    console.error(error)
  } finally {
    handleLoading.value = false
  }
}

const handleClose = async (row: Feedback) => {
  try {
    await ElMessageBox.confirm('确认关闭该反馈吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await closeFeedback(row.id)
    ElMessage.success('已关闭')
    fetchData()
    loadStats()
  } catch {
    // canceled
  }
}

const handleDelete = async (row: Feedback) => {
  try {
    await ElMessageBox.confirm('确认删除该反馈吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deleteFeedback(row.id)
    ElMessage.success('删除成功')
    fetchData()
    loadStats()
  } catch {
    // canceled
  }
}

const handleBatchHandle = async () => {
  try {
    await ElMessageBox.confirm(`确认批量处理选中的 ${selectedIds.value.length} 条反馈吗？`, '批量处理确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await batchHandleFeedbacks(selectedIds.value, {
      handleResult: '批量处理',
      status: FeedbackStatus.RESOLVED
    })
    ElMessage.success('批量处理成功')
    clearSelection()
    fetchData()
    loadStats()
  } catch {
    // canceled
  }
}

const handleBatchClose = async () => {
  try {
    await ElMessageBox.confirm(`确认批量关闭选中的 ${selectedIds.value.length} 条反馈吗？`, '批量关闭确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await Promise.all(selectedIds.value.map((id) => closeFeedback(id)))
    ElMessage.success('批量关闭成功')
    clearSelection()
    fetchData()
    loadStats()
  } catch {
    // canceled
  }
}

const handleSelectAll = (val: boolean) => {
  console.log('select all', val)
}

const handleBatchDeleteApi = (ids: number[]) => {
  return Promise.all(ids.map((id) => deleteFeedback(id)))
}

const handleBatchDeleted = () => {
  clearSelection()
  fetchData()
  loadStats()
}

onMounted(() => {
  fetchData()
  loadStats()
})
</script>

<style lang="scss" scoped>
.page-container {
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

  .feedback-content {
    line-height: 1.6;
    color: $text-secondary;
  }

  .handle-result {
    line-height: 1.6;
    color: $text-primary;
    background: $color-primary-light;
    padding: 12px;
    border-radius: 4px;
  }

  .mb-20 {
    margin-bottom: 20px;
  }
}
</style>
