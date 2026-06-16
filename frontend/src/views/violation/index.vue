<template>
  <div class="violation-page">
    <div class="filter-card card-wrapper">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="违规类型">
          <el-select v-model="filterForm.violationType" placeholder="全部" clearable style="width: 140px">
            <el-option
              v-for="item in violationTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="违规等级">
          <el-select v-model="filterForm.violationLevel" placeholder="全部" clearable style="width: 140px">
            <el-option
              v-for="item in violationLevelOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="全部" clearable style="width: 140px">
            <el-option label="待处理" value="pending" />
            <el-option label="已处理" value="processed" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input
            v-model="filterForm.keyword"
            placeholder="资源标题"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-card card-wrapper">
      <BatchOperation :selected-count="selectedRows.length" @clear="handleClearSelection">
        <el-button type="danger" size="small" @click="handleBatchHandle">批量处置</el-button>
      </BatchOperation>

      <DataTable
        ref="tableRef"
        :data="tableData"
        :loading="loading"
        :total="total"
        v-model:page="page"
        v-model:page-size="pageSize"
        :show-selection="true"
        @selection-change="handleSelectionChange"
        @refresh="fetchList"
      >
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column prop="resourceTitle" label="资源标题" min-width="180" show-overflow-tooltip />
        <el-table-column label="违规类型" width="110" align="center">
          <template #default="{ row }">
            <ViolationTag :type="row.violationType" />
          </template>
        </el-table-column>
        <el-table-column label="违规等级" width="100" align="center">
          <template #default="{ row }">
            <ViolationTag :level="row.violationLevel" />
          </template>
        </el-table-column>
        <el-table-column prop="source" label="来源" width="90" align="center">
          <template #default="{ row }">
            {{ row.source === 'system' ? '系统' : row.source === 'report' ? '举报' : row.source }}
          </template>
        </el-table-column>
        <el-table-column label="处置动作" width="100" align="center">
          <template #default="{ row }">
            <span v-if="row.action">{{ violationActionLabel[row.action] || row.action }}</span>
            <span v-else class="text-placeholder">未处置</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <StatusTag :status="row.status" type="resource" />
          </template>
        </el-table-column>
        <el-table-column prop="actionTime" label="操作时间" width="160" align="center">
          <template #default="{ row }">{{ formatDate(row.actionTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'pending'"
              type="primary"
              link
              size="small"
              @click="openHandleDialog(row)"
            >
              处置
            </el-button>
            <el-button type="info" link size="small" @click="handleViewDetail(row)">
              详情
            </el-button>
          </template>
        </el-table-column>
      </DataTable>
    </div>

    <el-dialog v-model="handleDialogVisible" title="违规处置" width="480px">
      <el-form :model="handleForm" label-width="80px">
        <el-form-item label="资源标题">
          <span>{{ currentViolation?.resourceTitle }}</span>
        </el-form-item>
        <el-form-item label="违规类型">
          <ViolationTag :type="currentViolation?.violationType" />
        </el-form-item>
        <el-form-item label="违规等级">
          <ViolationTag :level="currentViolation?.violationLevel" />
        </el-form-item>
        <el-form-item label="处置动作" required>
          <el-select v-model="handleForm.action" placeholder="请选择处置动作" style="width: 100%">
            <el-option label="警告" value="warning" />
            <el-option label="下架" value="removed" />
            <el-option label="封禁" value="banned" />
          </el-select>
        </el-form-item>
        <el-form-item label="处置意见" required>
          <el-input
            v-model="handleForm.opinion"
            type="textarea"
            :rows="3"
            placeholder="请填写处置意见"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmitHandle">确认处置</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="batchDialogVisible" title="批量处置" width="480px">
      <el-form :model="batchForm" label-width="80px">
        <el-form-item label="已选数量">
          <span>{{ selectedRows.length }} 条</span>
        </el-form-item>
        <el-form-item label="处置动作" required>
          <el-select v-model="batchForm.action" placeholder="请选择处置动作" style="width: 100%">
            <el-option label="警告" value="warning" />
            <el-option label="下架" value="removed" />
            <el-option label="封禁" value="banned" />
          </el-select>
        </el-form-item>
        <el-form-item label="处置意见" required>
          <el-input
            v-model="batchForm.opinion"
            type="textarea"
            :rows="3"
            placeholder="请填写处置意见"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmitBatch">确认处置</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Search, Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { DataTable, StatusTag, BatchOperation } from '@/components/business'
import ViolationTag from '@/components/business/ViolationTag/index.vue'
import { ViolationTypeLabel, ViolationLevelLabel, ViolationActionLabel } from '@/constants'
import { getViolationList, handleViolation, batchHandleViolation } from '@/api/violation'
import type { Violation } from '@/types'

const loading = ref(false)
const submitLoading = ref(false)
const tableData = ref<Violation[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const selectedRows = ref<Violation[]>([])
const tableRef = ref<any>(null)
const handleDialogVisible = ref(false)
const batchDialogVisible = ref(false)
const currentViolation = ref<Violation | null>(null)

const filterForm = reactive({
  keyword: '',
  violationType: '',
  violationLevel: '',
  status: ''
})

const handleForm = reactive({
  action: '',
  opinion: ''
})

const batchForm = reactive({
  action: '',
  opinion: ''
})

const violationTypeOptions = Object.entries(ViolationTypeLabel).map(([value, label]) => ({ value, label }))
const violationLevelOptions = Object.entries(ViolationLevelLabel).map(([value, label]) => ({ value, label }))
const violationActionLabel = ViolationActionLabel as Record<string, string>

const fetchList = async () => {
  loading.value = true
  try {
    const res = await getViolationList({
      page: page.value,
      pageSize: pageSize.value,
      keyword: filterForm.keyword || undefined,
      violationType: filterForm.violationType || undefined,
      violationLevel: filterForm.violationLevel || undefined,
      status: filterForm.status || undefined
    })
    tableData.value = res.data.list
    total.value = res.data.total
  } catch (error) {
    console.error('获取违规列表失败:', error)
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
  filterForm.violationType = ''
  filterForm.violationLevel = ''
  filterForm.status = ''
  page.value = 1
  fetchList()
}

const handleSelectionChange = (selection: Violation[]) => {
  selectedRows.value = selection
}

const handleClearSelection = () => {
  tableRef.value?.clearSelection()
}

const openHandleDialog = (row: Violation) => {
  currentViolation.value = row
  handleForm.action = ''
  handleForm.opinion = ''
  handleDialogVisible.value = true
}

const handleSubmitHandle = async () => {
  if (!handleForm.action) {
    ElMessage.warning('请选择处置动作')
    return
  }
  if (!handleForm.opinion) {
    ElMessage.warning('请填写处置意见')
    return
  }
  submitLoading.value = true
  try {
    await handleViolation(currentViolation.value!.id, {
      action: handleForm.action,
      opinion: handleForm.opinion
    })
    ElMessage.success('处置成功')
    handleDialogVisible.value = false
    fetchList()
  } catch (error) {
    console.error('处置失败:', error)
  } finally {
    submitLoading.value = false
  }
}

const handleBatchHandle = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要处置的记录')
    return
  }
  batchForm.action = ''
  batchForm.opinion = ''
  batchDialogVisible.value = true
}

const handleSubmitBatch = async () => {
  if (!batchForm.action) {
    ElMessage.warning('请选择处置动作')
    return
  }
  if (!batchForm.opinion) {
    ElMessage.warning('请填写处置意见')
    return
  }
  submitLoading.value = true
  try {
    await batchHandleViolation({
      ids: selectedRows.value.map((row) => row.id),
      action: batchForm.action,
      opinion: batchForm.opinion
    })
    ElMessage.success('批量处置成功')
    batchDialogVisible.value = false
    handleClearSelection()
    fetchList()
  } catch (error) {
    console.error('批量处置失败:', error)
  } finally {
    submitLoading.value = false
  }
}

const handleViewDetail = (row: Violation) => {
  ElMessage.info(`查看违规详情 #${row.id}`)
}

const formatDate = (date: string) => {
  if (!date) return '-'
  return date.replace('T', ' ').substring(0, 16)
}

onMounted(() => {
  fetchList()
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.violation-page {
  .filter-card {
    margin-bottom: 16px;
  }

  .text-placeholder {
    color: $text-placeholder;
  }
}
</style>
