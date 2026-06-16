<template>
  <div class="audit-records">
    <div class="filter-card card-wrapper">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="关键词">
          <el-input
            v-model="filterForm.keyword"
            placeholder="资源标题"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="审核结果">
          <el-select v-model="filterForm.auditResult" placeholder="全部" clearable style="width: 140px">
            <el-option label="通过" value="approved" />
            <el-option label="拒绝" value="rejected" />
          </el-select>
        </el-form-item>
        <el-form-item label="资源类型">
          <el-select v-model="filterForm.resourceType" placeholder="全部" clearable style="width: 140px">
            <el-option label="图片" value="image" />
            <el-option label="视频" value="video" />
            <el-option label="模板" value="template" />
          </el-select>
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
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="resourceTitle" label="资源标题" min-width="200" show-overflow-tooltip />
        <el-table-column prop="resourceType" label="类型" width="80" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ fileTypeLabel[row.resourceType] || row.resourceType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="审核结果" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.auditResult === 'approved' ? 'success' : 'danger'" size="small">
              {{ row.auditResult === 'approved' ? '通过' : '拒绝' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="审核层级" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="row.auditLevel === 1 ? 'info' : row.auditLevel === 2 ? 'warning' : 'danger'">
              {{ auditLevelLabel[row.auditLevel] || `第${row.auditLevel}级` }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="auditorName" label="审核人" width="100" align="center" />
        <el-table-column prop="auditOpinion" label="审核意见" min-width="150" show-overflow-tooltip />
        <el-table-column prop="auditTime" label="审核时间" width="160" align="center">
          <template #default="{ row }">{{ formatDate(row.auditTime) }}</template>
        </el-table-column>
      </DataTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Search, Refresh } from '@element-plus/icons-vue'
import { DataTable } from '@/components/business'
import { FileTypeLabel, AuditLevelLabel } from '@/constants'
import { getAuditRecords } from '@/api/audit'

const loading = ref(false)
const tableData = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)

const filterForm = reactive({
  keyword: '',
  auditResult: '',
  resourceType: ''
})

const fileTypeLabel = FileTypeLabel as Record<string, string>
const auditLevelLabel = AuditLevelLabel as Record<string, string>

const fetchList = async () => {
  loading.value = true
  try {
    const res = await getAuditRecords({
      page: page.value,
      pageSize: pageSize.value,
      keyword: filterForm.keyword || undefined,
      auditResult: filterForm.auditResult || undefined,
      resourceType: filterForm.resourceType || undefined
    })
    tableData.value = res.data.list
    total.value = res.data.total
  } catch (error) {
    console.error('获取审核记录失败:', error)
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
  filterForm.auditResult = ''
  filterForm.resourceType = ''
  page.value = 1
  fetchList()
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

.audit-records {
  .filter-card {
    margin-bottom: 16px;
  }

  .table-card {
  }
}
</style>
