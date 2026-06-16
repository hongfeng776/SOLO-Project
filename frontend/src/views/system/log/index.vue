<template>
  <div class="page-container">
    <el-card shadow="never" class="mb-20">
      <el-form :model="queryParams" label-width="80px" inline @submit.prevent>
        <el-form-item label="模块">
          <el-select
            v-model="queryParams.module"
            placeholder="全部模块"
            clearable
            style="width: 140px"
          >
            <el-option v-for="(label, value) in moduleOptions" :key="value" :label="label" :value="value" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作">
          <el-select
            v-model="queryParams.action"
            placeholder="全部操作"
            clearable
            style="width: 140px"
          >
            <el-option v-for="(label, value) in actionOptions" :key="value" :label="label" :value="value" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作人">
          <el-input
            v-model="queryParams.userName"
            placeholder="用户名"
            clearable
            style="width: 160px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="queryParams.status"
            placeholder="全部状态"
            clearable
            style="width: 120px"
          >
            <el-option label="成功" :value="1" />
            <el-option label="失败" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作时间">
          <el-date-picker
            v-model="queryParams.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
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
            <span class="card-title">操作日志</span>
            <span class="total-count">共 {{ total }} 条</span>
          </div>
          <div class="header-actions">
            <el-button type="danger" plain :icon="Delete" @click="handleCleanLogs">清理旧日志</el-button>
          </div>
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
        @selection-change="(rows: unknown[]) => handleSelectionChange(rows as OperationLog[])"
        @paginate="handlePaginate"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="userName" label="操作人" width="120" />
        <el-table-column label="模块" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" effect="plain">
              {{ moduleOptions[row.module] || row.module }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="primary" effect="plain">
              {{ actionOptions[row.action] || row.action }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="targetName" label="操作对象" min-width="180" show-overflow-tooltip />
        <el-table-column prop="ip" label="IP" width="140" />
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="耗时" width="100" align="center">
          <template #default="{ row }">
            <span>{{ row.duration }}ms</span>
          </template>
        </el-table-column>
        <el-table-column label="操作时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleViewDetail(row)">查看详情</el-button>
          </template>
        </el-table-column>
      </HtTable>
    </el-card>

    <el-dialog
      v-model="detailDialogVisible"
      title="日志详情"
      width="720px"
      destroy-on-close
    >
      <el-descriptions :column="2" border v-if="currentLog">
        <el-descriptions-item label="ID">{{ currentLog.id }}</el-descriptions-item>
        <el-descriptions-item label="操作人">{{ currentLog.userName }}</el-descriptions-item>
        <el-descriptions-item label="模块">{{ moduleOptions[currentLog.module] || currentLog.module }}</el-descriptions-item>
        <el-descriptions-item label="操作类型">{{ actionOptions[currentLog.action] || currentLog.action }}</el-descriptions-item>
        <el-descriptions-item label="操作对象" :span="2">{{ currentLog.targetName }}</el-descriptions-item>
        <el-descriptions-item label="IP">{{ currentLog.ip }}</el-descriptions-item>
        <el-descriptions-item label="耗时">{{ currentLog.duration }}ms</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="currentLog.status === 1 ? 'success' : 'danger'" size="small">
            {{ currentLog.status === 1 ? '成功' : '失败' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="操作时间">{{ formatDateTime(currentLog.createTime) }}</el-descriptions-item>
        <el-descriptions-item v-if="currentLog.errorMsg" label="错误信息" :span="2">
          <span class="error-msg">{{ currentLog.errorMsg }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="请求参数" :span="2">
          <div class="json-block">
            <pre>{{ formatJson(currentLog.params) }}</pre>
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="返回结果" :span="2">
          <div class="json-block">
            <pre>{{ formatJson(currentLog.result) }}</pre>
          </div>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Delete } from '@element-plus/icons-vue'
import { useFetchList, useSelection, formatDateTime } from '@hooks/index'
import {
  getOperationLogList,
  getOperationLogDetail,
  batchDeleteOperationLogs,
  cleanOperationLogs
} from '@api/operation-log'
import { LogModule, LogAction } from '@enums/business'
import type { OperationLog } from '@/types/business'
import HtTable from '@components/HtTable/index.vue'
import BatchActions from '@components/BatchActions/index.vue'

const moduleOptions: Record<string, string> = {
  [LogModule.CONTENT]: '内容',
  [LogModule.CREATOR]: '创作者',
  [LogModule.ACTIVITY]: '活动',
  [LogModule.ORDER]: '订单',
  [LogModule.SYSTEM]: '系统',
  [LogModule.RISK]: '风控'
}

const actionOptions: Record<string, string> = {
  [LogAction.CREATE]: '创建',
  [LogAction.UPDATE]: '更新',
  [LogAction.DELETE]: '删除',
  [LogAction.AUDIT]: '审核',
  [LogAction.PUBLISH]: '发布',
  [LogAction.EXPORT]: '导出',
  [LogAction.IMPORT]: '导入'
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
} = useFetchList<OperationLog, { module?: string; action?: string; userName?: string; status?: number; dateRange?: string[] }>({
  fetchApi: getOperationLogList,
  defaultParams: { module: undefined, action: undefined, userName: '', status: undefined, dateRange: [] },
  immediate: false
})

const { selectedRows, selectedIds, handleSelectionChange, clearSelection } = useSelection<OperationLog>()

const detailDialogVisible = ref(false)
const currentLog = ref<OperationLog | null>(null)

const formatJson = (jsonStr?: string): string => {
  if (!jsonStr) return '-'
  try {
    return JSON.stringify(JSON.parse(jsonStr), null, 2)
  } catch {
    return jsonStr
  }
}

const handleViewDetail = async (row: OperationLog) => {
  try {
    const detail = await getOperationLogDetail(row.id)
    currentLog.value = detail
    detailDialogVisible.value = true
  } catch (error) {
    console.error(error)
  }
}

const handleCleanLogs = async () => {
  try {
    await ElMessageBox.confirm('确认清理30天前的日志吗？此操作不可恢复。', '清理确认', {
      confirmButtonText: '确定清理',
      cancelButtonText: '取消',
      type: 'warning',
      dangerouslyUseHTMLString: true
    })
    await cleanOperationLogs({ days: 30 })
    ElMessage.success('清理成功')
    fetchData()
  } catch {
    // canceled
  }
}

const handleSelectAll = (val: boolean) => {
  console.log('select all', val)
}

const handleBatchDeleteApi = (ids: number[]) => {
  return batchDeleteOperationLogs(ids)
}

const handleBatchDeleted = () => {
  clearSelection()
  fetchData()
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.page-container {
  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .card-title {
    font-size: 15px;
    font-weight: 600;
    color: $text-primary;
  }

  .total-count {
    font-size: 13px;
    color: $text-secondary;
  }

  .json-block {
    max-height: 200px;
    overflow-y: auto;
    background: #f5f7fa;
    padding: 12px;
    border-radius: 4px;

    pre {
      margin: 0;
      font-size: 12px;
      color: $text-secondary;
      white-space: pre-wrap;
      word-break: break-all;
    }
  }

  .error-msg {
    color: $color-danger;
  }

  .mb-20 {
    margin-bottom: 20px;
  }
}
</style>
