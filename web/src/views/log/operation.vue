<template>
  <div class="page-container">
    <el-card shadow="never">
      <el-form :inline="true" :model="queryParams" class="search-form">
        <el-form-item label="操作模块">
          <el-select
            v-model="queryParams.module"
            placeholder="请选择"
            clearable
            style="width: 150px"
          >
            <el-option
              v-for="item in MODULE_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="操作类型">
          <el-select
            v-model="queryParams.action"
            placeholder="请选择"
            clearable
            style="width: 150px"
          >
            <el-option
              v-for="item in ACTION_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="操作人">
          <el-input
            v-model="queryParams.userId"
            placeholder="请输入操作人ID"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="操作时间">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="RefreshRight" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" style="margin-top: 20px">
      <BaseTable
        :data="dataList"
        :loading="loading"
        :total="total"
        :page="pagination.page"
        :page-size="pagination.pageSize"
        @page-change="handlePageChange"
        @size-change="handleSizeChange"
      >
        <el-table-column prop="userName" label="操作人" width="120" />
        <el-table-column prop="module" label="模块" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small">{{ MODULE_LABEL_MAP[(row as OperationLogItem).module] || (row as OperationLogItem).module }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="action" label="操作类型" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="ACTION_TYPE_MAP[(row as OperationLogItem).action]?.type || 'info'" size="small">
              {{ ACTION_TYPE_MAP[(row as OperationLogItem).action]?.label || (row as OperationLogItem).action }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="targetType" label="操作对象" width="100" align="center">
          <template #default="{ row }">
            {{ MODULE_LABEL_MAP[(row as OperationLogItem).targetType ?? ''] || (row as OperationLogItem).targetType || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="ip" label="IP" width="140" />
        <el-table-column prop="duration" label="耗时" width="90" align="right">
          <template #default="{ row }">
            {{ (row as OperationLogItem).duration }}ms
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="(row as OperationLogItem).status === 1 ? 'success' : 'danger'" size="small">
              {{ (row as OperationLogItem).status === 1 ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime((row as OperationLogItem).createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link :icon="View" @click="handleDetail(row as OperationLogItem)">详情</el-button>
          </template>
        </el-table-column>
      </BaseTable>
    </el-card>

    <BaseDialog
      v-model="detailVisible"
      title="操作日志详情"
      width="650px"
      :show-footer="false"
    >
      <el-descriptions v-if="detailData" :column="2" border size="small">
        <el-descriptions-item label="操作人">{{ detailData.userName }}</el-descriptions-item>
        <el-descriptions-item label="IP">{{ detailData.ip }}</el-descriptions-item>
        <el-descriptions-item label="模块">
          <el-tag size="small">{{ MODULE_LABEL_MAP[detailData.module] || detailData.module }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="操作类型">
          <el-tag :type="ACTION_TYPE_MAP[detailData.action]?.type || 'info'" size="small">
            {{ ACTION_TYPE_MAP[detailData.action]?.label || detailData.action }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="操作对象">{{ detailData.targetType || '-' }}</el-descriptions-item>
        <el-descriptions-item label="对象ID">{{ detailData.targetId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="耗时">{{ detailData.duration }}ms</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="detailData.status === 1 ? 'success' : 'danger'" size="small">
            {{ detailData.status === 1 ? '成功' : '失败' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item v-if="detailData.errorMessage" label="错误信息" :span="2">
          <span class="text-danger">{{ detailData.errorMessage }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="User-Agent" :span="2">{{ detailData.userAgent || '-' }}</el-descriptions-item>
        <el-descriptions-item label="操作时间" :span="2">{{ formatDateTime(detailData.createdAt) }}</el-descriptions-item>
        <el-descriptions-item v-if="detailData.detail" label="请求详情" :span="2">
          <pre class="detail-json">{{ formatJson(detailData.detail) }}</pre>
        </el-descriptions-item>
      </el-descriptions>
    </BaseDialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Search, RefreshRight, View } from '@element-plus/icons-vue'
import BaseTable from '@/components/common/BaseTable.vue'
import BaseDialog from '@/components/common/BaseDialog.vue'
import { useTable } from '@/composables/useTable'
import { formatDateTime } from '@/utils/date'
import {
  getOperationLogList,
  type OperationLogItem,
  type OperationLogQueryParams,
} from '@/api/operation-log'

const MODULE_OPTIONS = [
  { label: '渠道', value: 'channel' },
  { label: '推客', value: 'promoter' },
  { label: '订单', value: 'order' },
  { label: '佣金', value: 'commission' },
  { label: '营销', value: 'marketing' },
  { label: '提现', value: 'withdraw' },
  { label: '角色', value: 'role' },
  { label: '权限', value: 'permission' },
  { label: '用户', value: 'user' },
]

const ACTION_OPTIONS = [
  { label: '创建', value: 'create' },
  { label: '更新', value: 'update' },
  { label: '删除', value: 'delete' },
  { label: '审核通过', value: 'approve' },
  { label: '审核拒绝', value: 'reject' },
  { label: '状态变更', value: 'updateStatus' },
  { label: '结算', value: 'settle' },
  { label: '扣除', value: 'deduct' },
  { label: '批量操作', value: 'bulkAction' },
]

const MODULE_LABEL_MAP: Record<string, string> = {
  channel: '渠道',
  promoter: '推客',
  order: '订单',
  commission: '佣金',
  marketing: '营销',
  withdraw: '提现',
  role: '角色',
  permission: '权限',
  user: '用户',
  unknown: '未知',
}

const ACTION_TYPE_MAP: Record<string, { label: string; type: 'success' | 'warning' | 'danger' | 'info' | 'primary' }> = {
  create: { label: '创建', type: 'success' },
  update: { label: '更新', type: 'primary' },
  delete: { label: '删除', type: 'danger' },
  approve: { label: '审核通过', type: 'success' },
  reject: { label: '审核拒绝', type: 'danger' },
  updateStatus: { label: '状态变更', type: 'warning' },
  settle: { label: '结算', type: 'primary' },
  deduct: { label: '扣除', type: 'danger' },
  bulkAction: { label: '批量操作', type: 'warning' },
}

const dateRange = ref<string[]>([])

const {
  loading,
  dataList,
  total,
  pagination,
  queryParams,
  handlePageChange,
  handleSizeChange,
  fetchData,
} = useTable<OperationLogItem, OperationLogQueryParams>({
  fetchApi: getOperationLogList,
})

function handleSearch() {
  if (dateRange.value?.length === 2) {
    queryParams.startTime = dateRange.value[0]
    queryParams.endTime = dateRange.value[1]
  } else {
    queryParams.startTime = undefined
    queryParams.endTime = undefined
  }
  pagination.page = 1
  fetchData()
}

function handleReset() {
  Object.keys(queryParams).forEach((key) => {
    if (key !== 'page' && key !== 'pageSize') {
      ;(queryParams as any)[key] = undefined
    }
  })
  dateRange.value = []
  handleSearch()
}

const detailVisible = ref(false)
const detailData = ref<OperationLogItem | null>(null)

function handleDetail(row: OperationLogItem) {
  detailData.value = row
  detailVisible.value = true
}

function formatJson(data: any): string {
  try {
    return JSON.stringify(data, null, 2)
  } catch {
    return String(data)
  }
}
</script>

<style scoped lang="scss">
.page-container {
  .search-form {
    margin-bottom: 0;
  }
}

.detail-json {
  margin: 0;
  padding: 8px;
  max-height: 300px;
  overflow: auto;
  background-color: var(--el-fill-color-light);
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
}

.text-danger {
  color: var(--el-color-danger);
}
</style>
