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
            placeholder="搜索标题/描述"
            clearable
            style="width: 220px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="对象类型">
          <el-select
            v-model="queryParams.targetType"
            placeholder="全部类型"
            clearable
            style="width: 140px"
          >
            <el-option v-for="(label, value) in targetTypeOptions" :key="value" :label="label" :value="value" />
          </el-select>
        </el-form-item>
        <el-form-item label="违规等级">
          <el-select
            v-model="queryParams.violationLevel"
            placeholder="全部等级"
            clearable
            style="width: 140px"
          >
            <el-option v-for="(label, value) in levelOptions" :key="value" :label="label" :value="Number(value)" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="queryParams.status"
            placeholder="全部状态"
            clearable
            style="width: 140px"
          >
            <el-option label="待处理" :value="0" />
            <el-option label="已处理" :value="1" />
            <el-option label="已申诉" :value="2" />
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
          <span class="card-title">违规记录</span>
        </div>
      </template>

      <BatchActions
        v-model:selected-ids="selectedIds"
        :selected-rows="selectedRows"
        :total="total"
        :delete-api="handleBatchDeleteApi"
        @select-all="handleSelectAll"
        @clear="clearSelection"
        @delete="handleBatchDeleted"
      >
        <el-button type="primary" plain size="small" :icon="Operation" :disabled="!hasSelection" @click="handleBatchHandle">
          批量处理
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
        @selection-change="(rows: unknown[]) => handleSelectionChange(rows as ViolationRecord[])"
        @paginate="handlePaginate"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="对象类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" effect="plain">
              {{ targetTypeOptions[row.targetType] || row.targetType }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="targetTitle" label="对象标题" min-width="180" show-overflow-tooltip />
        <el-table-column prop="violationType" label="违规类型" width="120" />
        <el-table-column label="违规等级" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="levelTagMap[row.violationLevel] || 'info'" size="small">
              {{ levelOptions[row.violationLevel] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="handlerName" label="处理人" width="100" />
        <el-table-column label="处理结果" width="120">
          <template #default="{ row }">
            <span v-if="row.handleResult">{{ handleResultOptions[row.handleResult] || '-' }}</span>
            <span v-else class="text-empty">-</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTagMap[row.status] || 'info'" size="small">
              {{ statusOptions[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="300" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleView(row)">查看详情</el-button>
            <el-button
              v-if="row.status === 0"
              link
              type="primary"
              size="small"
              @click="openHandleDialog(row)"
            >
              处理
            </el-button>
            <el-button
              v-if="row.status === 1"
              link
              type="warning"
              size="small"
              @click="openAppealDialog(row)"
            >
              申诉
            </el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </HtTable>
    </el-card>

    <el-dialog
      v-model="handleDialogVisible"
      title="处理违规"
      width="560px"
      destroy-on-close
      @close="handleDialogClose"
    >
      <el-form ref="handleFormRef" :model="handleFormData" :rules="handleRules" label-width="100px">
        <el-form-item label="违规对象">
          <span>{{ currentViolation?.targetTitle }}</span>
        </el-form-item>
        <el-form-item label="违规类型">
          <span>{{ currentViolation?.violationType }}</span>
        </el-form-item>
        <el-form-item label="处理结果" prop="handleResult">
          <el-select v-model="handleFormData.handleResult" placeholder="请选择处理结果" style="width: 100%">
            <el-option v-for="(label, value) in handleResultOptions" :key="value" :label="label" :value="Number(value)" />
          </el-select>
        </el-form-item>
        <el-form-item label="处理备注" prop="handleNote">
          <el-input
            v-model="handleFormData.handleNote"
            type="textarea"
            :rows="4"
            placeholder="请输入处理备注"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleDialogClose">取消</el-button>
        <el-button type="primary" :loading="handleLoading" @click="submitHandle">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="appealDialogVisible"
      title="申诉"
      width="560px"
      destroy-on-close
      @close="appealDialogClose"
    >
      <el-form ref="appealFormRef" :model="appealFormData" :rules="appealRules" label-width="100px">
        <el-form-item label="违规对象">
          <span>{{ currentViolation?.targetTitle }}</span>
        </el-form-item>
        <el-form-item label="申诉内容" prop="appealContent">
          <el-input
            v-model="appealFormData.appealContent"
            type="textarea"
            :rows="6"
            placeholder="请输入申诉内容"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="appealDialogClose">取消</el-button>
        <el-button type="primary" :loading="appealLoading" @click="submitAppeal">提交申诉</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="detailDialogVisible"
      title="违规详情"
      width="640px"
      destroy-on-close
    >
      <el-descriptions :column="2" border v-if="currentViolation">
        <el-descriptions-item label="ID">{{ currentViolation.id }}</el-descriptions-item>
        <el-descriptions-item label="对象类型">{{ targetTypeOptions[currentViolation.targetType] || currentViolation.targetType }}</el-descriptions-item>
        <el-descriptions-item label="对象标题" :span="2">{{ currentViolation.targetTitle }}</el-descriptions-item>
        <el-descriptions-item label="违规类型">{{ currentViolation.violationType }}</el-descriptions-item>
        <el-descriptions-item label="违规等级">
          <el-tag :type="levelTagMap[currentViolation.violationLevel] || 'info'" size="small">
            {{ levelOptions[currentViolation.violationLevel] }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="违规描述" :span="2">{{ currentViolation.description }}</el-descriptions-item>
        <el-descriptions-item label="处理人">{{ currentViolation.handlerName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="处理结果">{{ handleResultOptions[currentViolation.handleResult] || '-' }}</el-descriptions-item>
        <el-descriptions-item label="处理备注" :span="2">{{ currentViolation.handleNote || '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusTagMap[currentViolation.status] || 'info'" size="small">
            {{ statusOptions[currentViolation.status] }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDateTime(currentViolation.createTime) }}</el-descriptions-item>
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
  Warning,
  Operation
} from '@element-plus/icons-vue'
import { useFetchList, useSelection, formatDateTime } from '@hooks/index'
import { useNumberFormat } from '@hooks/useFormat'
import {
  getViolationList,
  handleViolation,
  batchHandleViolations,
  appealViolation,
  deleteViolation,
  getViolationStats
} from '@api/violation'
import { ViolationLevel, ViolationTargetType, HandleResult } from '@enums/business'
import type { ViolationRecord } from '@/types/business'
import HtTable from '@components/HtTable/index.vue'
import BatchActions from '@components/BatchActions/index.vue'

const { formatCompact } = useNumberFormat()

const targetTypeOptions: Record<string, string> = {
  [ViolationTargetType.NOTE]: '笔记',
  [ViolationTargetType.COMMENT]: '评论',
  [ViolationTargetType.USER]: '用户',
  [ViolationTargetType.CREATOR]: '创作者',
  [ViolationTargetType.ACTIVITY]: '活动',
  [ViolationTargetType.ORDER]: '订单'
}

const levelOptions: Record<number, string> = {
  [ViolationLevel.MILD]: '轻微',
  [ViolationLevel.MODERATE]: '一般',
  [ViolationLevel.SEVERE]: '严重',
  [ViolationLevel.EXTREME]: '极其严重'
}

const levelTagMap: Record<number, string> = {
  [ViolationLevel.MILD]: 'success',
  [ViolationLevel.MODERATE]: 'warning',
  [ViolationLevel.SEVERE]: 'warning',
  [ViolationLevel.EXTREME]: 'danger'
}

const handleResultOptions: Record<number, string> = {
  [HandleResult.WARNING]: '警告',
  [HandleResult.REMOVE]: '删除内容',
  [HandleResult.LIMIT_FLOW]: '限流',
  [HandleResult.BAN_7D]: '封禁7天',
  [HandleResult.BAN_30D]: '封禁30天',
  [HandleResult.BAN_PERMANENT]: '永久封禁'
}

const statusOptions: Record<number, string> = {
  0: '待处理',
  1: '已处理',
  2: '已申诉'
}

const statusTagMap: Record<number, string> = {
  0: 'warning',
  1: 'success',
  2: 'info'
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
} = useFetchList<ViolationRecord, { keyword?: string; targetType?: string; violationLevel?: number; status?: number }>({
  fetchApi: getViolationList,
  defaultParams: { keyword: '', targetType: undefined, violationLevel: undefined, status: undefined },
  immediate: false
})

const { selectedRows, selectedIds, hasSelection, handleSelectionChange, clearSelection } = useSelection<ViolationRecord>()

const statCards = ref([
  { key: 'total', label: '违规总数', value: 0, icon: Warning, color: '#f56c6c' },
  { key: 'pending', label: '待处理', value: 0, icon: Warning, color: '#e6a23c' },
  { key: 'handled', label: '已处理', value: 0, icon: Operation, color: '#67c23a' },
  { key: 'appealed', label: '已申诉', value: 0, icon: Warning, color: '#909399' }
])

const loadStats = async () => {
  try {
    const stats = await getViolationStats()
    statCards.value.forEach((item) => {
      if (stats[item.key] != null) {
        item.value = stats[item.key]
      }
    })
  } catch (error) {
    console.error(error)
  }
}

const currentViolation = ref<ViolationRecord | null>(null)

const handleDialogVisible = ref(false)
const handleFormRef = ref<FormInstance>()
const handleLoading = ref(false)
const handleFormData = reactive({
  handleResult: undefined as number | undefined,
  handleNote: ''
})

const handleRules: FormRules = {
  handleResult: [{ required: true, message: '请选择处理结果', trigger: 'change' }]
}

const openHandleDialog = (row: ViolationRecord) => {
  currentViolation.value = row
  handleFormData.handleResult = undefined
  handleFormData.handleNote = ''
  handleDialogVisible.value = true
}

const handleDialogClose = () => {
  handleDialogVisible.value = false
  handleFormRef.value?.resetFields()
}

const submitHandle = async () => {
  if (!handleFormRef.value || !currentViolation.value) return
  const valid = await handleFormRef.value.validate().catch(() => false)
  if (!valid) return

  handleLoading.value = true
  try {
    await handleViolation(currentViolation.value.id, {
      handleResult: handleFormData.handleResult!,
      handleNote: handleFormData.handleNote
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

const appealDialogVisible = ref(false)
const appealFormRef = ref<FormInstance>()
const appealLoading = ref(false)
const appealFormData = reactive({
  appealContent: ''
})

const appealRules: FormRules = {
  appealContent: [{ required: true, message: '请输入申诉内容', trigger: 'blur' }]
}

const openAppealDialog = (row: ViolationRecord) => {
  currentViolation.value = row
  appealFormData.appealContent = ''
  appealDialogVisible.value = true
}

const appealDialogClose = () => {
  appealDialogVisible.value = false
  appealFormRef.value?.resetFields()
}

const submitAppeal = async () => {
  if (!appealFormRef.value || !currentViolation.value) return
  const valid = await appealFormRef.value.validate().catch(() => false)
  if (!valid) return

  appealLoading.value = true
  try {
    await appealViolation(currentViolation.value.id, {
      appealContent: appealFormData.appealContent
    })
    ElMessage.success('申诉已提交')
    appealDialogVisible.value = false
    fetchData()
    loadStats()
  } catch (error) {
    console.error(error)
  } finally {
    appealLoading.value = false
  }
}

const detailDialogVisible = ref(false)

const handleView = (row: ViolationRecord) => {
  currentViolation.value = row
  detailDialogVisible.value = true
}

const handleDelete = async (row: ViolationRecord) => {
  try {
    await ElMessageBox.confirm('确认删除该违规记录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deleteViolation(row.id)
    ElMessage.success('删除成功')
    fetchData()
    loadStats()
  } catch {
    // canceled
  }
}

const handleBatchHandle = async () => {
  try {
    await ElMessageBox.confirm(`确认批量处理选中的 ${selectedIds.value.length} 条违规记录吗？`, '批量处理确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await batchHandleViolations(selectedIds.value, { handleResult: HandleResult.WARNING })
    ElMessage.success('批量处理成功')
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
  return Promise.all(ids.map((id) => deleteViolation(id)))
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

  .text-empty {
    color: $text-placeholder;
  }

  .mb-20 {
    margin-bottom: 20px;
  }
}
</style>
