<template>
  <div class="pending-audit">
    <div class="filter-card card-wrapper">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="资源类型">
          <el-select v-model="filterForm.resourceType" placeholder="全部" clearable style="width: 140px">
            <el-option label="全部" :value="undefined" />
            <el-option label="图片" value="image" />
            <el-option label="视频" value="video" />
            <el-option label="模板" value="template" />
          </el-select>
        </el-form-item>
        <el-form-item label="风控拦截">
          <el-select v-model="filterForm.isBlocked" placeholder="全部" clearable style="width: 140px">
            <el-option label="全部" :value="undefined" />
            <el-option label="已拦截" :value="true" />
            <el-option label="未拦截" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item label="审核层级">
          <el-select v-model="filterForm.auditLevel" placeholder="全部" clearable style="width: 140px">
            <el-option label="全部" :value="undefined" />
            <el-option
              v-for="(label, key) in auditLevelLabel"
              :key="key"
              :label="label"
              :value="Number(key)"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-card card-wrapper">
      <div class="table-toolbar">
        <div class="toolbar-left">
          <span class="pending-count">待审核：<em>{{ total }}</em> 条</span>
        </div>
        <div class="toolbar-right">
          <el-button
            type="success"
            :icon="Check"
            :disabled="selectedRows.length === 0"
            @click="handleBatchAudit('approved')"
          >
            批量通过
          </el-button>
          <el-button
            type="danger"
            :icon="Close"
            :disabled="selectedRows.length === 0"
            @click="handleBatchAudit('rejected')"
          >
            批量拒绝
          </el-button>
        </div>
      </div>

      <DataTable
        :data="tableData"
        :loading="loading"
        :total="total"
        v-model:page="page"
        v-model:page-size="pageSize"
        show-selection
        @selection-change="handleSelectionChange"
        @refresh="fetchList"
      >
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="resourceTitle" label="资源标题" min-width="200" show-overflow-tooltip />
        <el-table-column label="封面" width="100" align="center">
          <template #default="{ row }">
            <el-image
              :src="row.coverUrl"
              fit="cover"
              style="width: 60px; height: 60px; border-radius: 4px; cursor: pointer"
              @click="handlePreview(row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="fileType" label="类型" width="80" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ fileTypeLabel[row.fileType] || row.fileType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="authorName" label="提交者" width="100" align="center" />
        <el-table-column label="审核层级" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="row.auditLevel === 1 ? 'info' : row.auditLevel === 2 ? 'warning' : 'danger'">
              {{ auditLevelLabel[row.auditLevel] || `第${row.auditLevel}级` }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="风控状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.isBlocked" type="danger" size="small">风控拦截</el-tag>
            <el-tag v-else type="success" size="small">正常</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="违规次数" width="90" align="center">
          <template #default="{ row }">
            <span :class="{ 'violation-highlight': row.violationCount > 0 }">{{ row.violationCount || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="提交时间" width="160" align="center">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="220" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleAudit(row)">审核</el-button>
            <el-button type="success" link size="small" @click="handleQuickAudit(row, 'approved')">通过</el-button>
            <el-button type="danger" link size="small" @click="handleQuickAudit(row, 'rejected')">拒绝</el-button>
            <el-button
              v-if="row.violationCount > 0"
              type="warning"
              link
              size="small"
              @click="handleViolationManage(row)"
            >
              处置违规
            </el-button>
          </template>
        </el-table-column>
      </DataTable>
    </div>

    <AuditPanel
      v-model:visible="auditDialogVisible"
      :resource="currentResource"
      :loading="auditLoading"
      @submit="handleAuditSubmit"
      @close="auditDialogVisible = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Refresh, Check, Close } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { DataTable, AuditPanel } from '@/components/business'
import { FileTypeLabel, AuditLevelLabel } from '@/constants'
import { auditResource } from '@/api/audit'

const router = useRouter()

const loading = ref(false)
const tableData = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const selectedRows = ref<any[]>([])
const auditDialogVisible = ref(false)
const auditLoading = ref(false)
const currentResource = ref<any>(null)

const filterForm = reactive({
  resourceType: undefined as string | undefined,
  isBlocked: undefined as boolean | undefined,
  auditLevel: undefined as number | undefined
})

const fileTypeLabel = FileTypeLabel as Record<string, string>
const auditLevelLabel = AuditLevelLabel as Record<string, string>

const fetchList = async () => {
  loading.value = true
  try {
    tableData.value = []
    total.value = 0
  } catch (error) {
    console.error('获取待审核列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  page.value = 1
  fetchList()
}

const handleReset = () => {
  filterForm.resourceType = undefined
  filterForm.isBlocked = undefined
  filterForm.auditLevel = undefined
  page.value = 1
  fetchList()
}

const handleSelectionChange = (selection: any[]) => {
  selectedRows.value = selection
}

const handlePreview = (row: any) => {
  currentResource.value = row
}

const handleAudit = (row: any) => {
  currentResource.value = row
  auditDialogVisible.value = true
}

const handleQuickAudit = (row: any, _result: string) => {
  currentResource.value = row
  auditDialogVisible.value = true
}

const handleAuditSubmit = async (data: any) => {
  auditLoading.value = true
  try {
    await auditResource(currentResource.value.id, data)
    ElMessage.success('审核成功')
    auditDialogVisible.value = false
    fetchList()
  } catch (error) {
    console.error('审核失败:', error)
  } finally {
    auditLoading.value = false
  }
}

const handleViolationManage = (row: any) => {
  router.push({ name: 'ViolationManage', query: { resourceId: row.id } })
}

const handleBatchAudit = async (result: string) => {
  if (selectedRows.value.length === 0) return

  try {
    await ElMessageBox.confirm(
      `确定要${result === 'approved' ? '通过' : '拒绝'}选中的 ${selectedRows.value.length} 条审核吗？`,
      '提示',
      { type: 'warning' }
    )
    ElMessage.success('批量审核成功')
    fetchList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量审核失败:', error)
    }
  }
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

.pending-audit {
  .filter-card {
    margin-bottom: 16px;
  }

  .table-card {
    .table-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;

      .pending-count {
        font-size: $font-size-base;
        color: $text-regular;

        em {
          color: $danger-color;
          font-style: normal;
          font-weight: 600;
          margin: 0 2px;
        }
      }

      .toolbar-right {
        display: flex;
        gap: 8px;
      }
    }
  }

  .violation-highlight {
    color: $danger-color;
    font-weight: 600;
  }
}
</style>
