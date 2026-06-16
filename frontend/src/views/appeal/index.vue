<template>
  <div class="appeal-page">
    <div class="filter-card card-wrapper">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="全部" clearable style="width: 140px">
            <el-option
              v-for="item in appealStatusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input
            v-model="filterForm.keyword"
            placeholder="资源标题/申诉人"
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
      <DataTable
        :data="tableData"
        :loading="loading"
        :total="total"
        v-model:page="page"
        v-model:page-size="pageSize"
        @refresh="fetchList"
      >
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column prop="resourceTitle" label="资源标题" min-width="160" show-overflow-tooltip />
        <el-table-column prop="appellantName" label="申诉人" width="100" align="center" />
        <el-table-column prop="reason" label="申诉理由" min-width="180" show-overflow-tooltip />
        <el-table-column label="复核结果" width="100" align="center">
          <template #default="{ row }">
            <span v-if="row.reviewResult">{{ reviewResultLabel[row.reviewResult] || row.reviewResult }}</span>
            <span v-else class="text-placeholder">待复核</span>
          </template>
        </el-table-column>
        <el-table-column prop="reviewOpinion" label="复核意见" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.reviewOpinion || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <StatusTag :status="row.status" type="resource" />
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="160" align="center">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'pending'"
              type="primary"
              link
              size="small"
              @click="openReviewDialog(row)"
            >
              复核
            </el-button>
            <el-button type="info" link size="small" @click="handleViewDetail(row)">
              详情
            </el-button>
          </template>
        </el-table-column>
      </DataTable>
    </div>

    <el-dialog v-model="reviewDialogVisible" title="申诉复核" width="480px">
      <el-form :model="reviewForm" label-width="80px">
        <el-form-item label="资源标题">
          <span>{{ currentAppeal?.resourceTitle }}</span>
        </el-form-item>
        <el-form-item label="申诉人">
          <span>{{ currentAppeal?.appellantName }}</span>
        </el-form-item>
        <el-form-item label="申诉理由">
          <span>{{ currentAppeal?.reason }}</span>
        </el-form-item>
        <el-form-item label="复核结果" required>
          <el-select v-model="reviewForm.reviewResult" placeholder="请选择复核结果" style="width: 100%">
            <el-option label="维持" value="upheld" />
            <el-option label="推翻" value="overturned" />
            <el-option label="部分维持" value="partial" />
          </el-select>
        </el-form-item>
        <el-form-item label="复核意见" required>
          <el-input
            v-model="reviewForm.reviewOpinion"
            type="textarea"
            :rows="3"
            placeholder="请填写复核意见"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reviewDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmitReview">确认复核</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Search, Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { DataTable, StatusTag } from '@/components/business'
import { AppealStatusLabel } from '@/constants'
import { getAppealList, reviewAppeal } from '@/api/appeal'
import type { Appeal } from '@/types'

const loading = ref(false)
const submitLoading = ref(false)
const tableData = ref<Appeal[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const reviewDialogVisible = ref(false)
const currentAppeal = ref<Appeal | null>(null)

const filterForm = reactive({
  keyword: '',
  status: ''
})

const reviewForm = reactive({
  reviewResult: '',
  reviewOpinion: ''
})

const appealStatusOptions = Object.entries(AppealStatusLabel).map(([value, label]) => ({ value, label }))

const reviewResultLabel: Record<string, string> = {
  upheld: '维持',
  overturned: '推翻',
  partial: '部分维持'
}

const fetchList = async () => {
  loading.value = true
  try {
    const res = await getAppealList({
      page: page.value,
      pageSize: pageSize.value,
      keyword: filterForm.keyword || undefined,
      status: filterForm.status || undefined
    })
    tableData.value = res.data.list
    total.value = res.data.total
  } catch (error) {
    console.error('获取申诉列表失败:', error)
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
  filterForm.status = ''
  page.value = 1
  fetchList()
}

const openReviewDialog = (row: Appeal) => {
  currentAppeal.value = row
  reviewForm.reviewResult = ''
  reviewForm.reviewOpinion = ''
  reviewDialogVisible.value = true
}

const handleSubmitReview = async () => {
  if (!reviewForm.reviewResult) {
    ElMessage.warning('请选择复核结果')
    return
  }
  if (!reviewForm.reviewOpinion) {
    ElMessage.warning('请填写复核意见')
    return
  }
  submitLoading.value = true
  try {
    await reviewAppeal(currentAppeal.value!.id, {
      reviewResult: reviewForm.reviewResult,
      reviewOpinion: reviewForm.reviewOpinion
    })
    ElMessage.success('复核成功')
    reviewDialogVisible.value = false
    fetchList()
  } catch (error) {
    console.error('复核失败:', error)
  } finally {
    submitLoading.value = false
  }
}

const handleViewDetail = (row: Appeal) => {
  ElMessage.info(`查看申诉详情 #${row.id}`)
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

.appeal-page {
  .filter-card {
    margin-bottom: 16px;
  }

  .text-placeholder {
    color: $text-placeholder;
  }
}
</style>
