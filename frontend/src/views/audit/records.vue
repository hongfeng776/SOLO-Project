<template>
  <div class="audit-records">
    <div class="stats-area">
      <div class="stat-card card-wrapper">
        <div class="stat-item">
          <span class="stat-value">{{ stats.totalCount }}</span>
          <span class="stat-label">总审核数</span>
        </div>
        <div class="stat-item stat-approved">
          <span class="stat-value">{{ stats.approvedCount }}</span>
          <span class="stat-label">通过数</span>
        </div>
        <div class="stat-item stat-rejected">
          <span class="stat-value">{{ stats.rejectedCount }}</span>
          <span class="stat-label">拒绝数</span>
        </div>
        <div class="stat-item stat-today">
          <span class="stat-value">{{ stats.todayCount }}</span>
          <span class="stat-label">今日审核数</span>
        </div>
      </div>
    </div>

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
        <el-form-item label="审核层级">
          <el-select v-model="filterForm.auditLevel" placeholder="全部" clearable style="width: 140px">
            <el-option
              v-for="(label, key) in auditLevelLabel"
              :key="key"
              :label="label"
              :value="Number(key)"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="审核时间">
          <el-date-picker
            v-model="filterForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 260px"
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
import { getAuditRecords, getAuditStats } from '@/api/audit'

const loading = ref(false)
const tableData = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)

const stats = reactive({
  totalCount: 0,
  approvedCount: 0,
  rejectedCount: 0,
  todayCount: 0
})

const filterForm = reactive({
  keyword: '',
  auditResult: '',
  resourceType: '',
  auditLevel: undefined as number | undefined,
  dateRange: null as [string, string] | null
})

const fileTypeLabel = FileTypeLabel as Record<string, string>
const auditLevelLabel = AuditLevelLabel as Record<string, string>

const fetchStats = async () => {
  try {
    const res = await getAuditStats()
    stats.totalCount = res.data.totalCount
    stats.approvedCount = res.data.approvedCount
    stats.rejectedCount = res.data.rejectedCount
    stats.todayCount = res.data.todayCount
  } catch (error) {
    console.error('获取审核统计失败:', error)
  }
}

const fetchList = async () => {
  loading.value = true
  try {
    const params: any = {
      page: page.value,
      pageSize: pageSize.value,
      keyword: filterForm.keyword || undefined,
      auditResult: filterForm.auditResult || undefined,
      resourceType: filterForm.resourceType || undefined,
      auditLevel: filterForm.auditLevel || undefined,
      startDate: filterForm.dateRange?.[0] || undefined,
      endDate: filterForm.dateRange?.[1] || undefined
    }
    const res = await getAuditRecords(params)
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
  filterForm.auditLevel = undefined
  filterForm.dateRange = null
  page.value = 1
  fetchList()
}

const formatDate = (date: string) => {
  if (!date) return '-'
  return date.replace('T', ' ').substring(0, 16)
}

onMounted(() => {
  fetchStats()
  fetchList()
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.audit-records {
  .stats-area {
    margin-bottom: 16px;

    .stat-card {
      display: flex;
      justify-content: space-around;
      padding: 20px;

      .stat-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;

        .stat-value {
          font-size: $font-size-extra-large;
          font-weight: 600;
          color: $text-primary;
        }

        .stat-label {
          font-size: $font-size-small;
          color: $text-secondary;
        }

        &.stat-approved .stat-value {
          color: $success-color;
        }

        &.stat-rejected .stat-value {
          color: $danger-color;
        }

        &.stat-today .stat-value {
          color: $primary-color;
        }
      }
    }
  }

  .filter-card {
    margin-bottom: 16px;
  }

  .table-card {
  }
}
</style>
