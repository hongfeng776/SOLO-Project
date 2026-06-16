<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import QyDataTable from '@/components/QyDataTable/index.vue'
import QyTableToolbar from '@/components/QyTableToolbar/index.vue'
import { OPERATION_TYPE, OPERATION_MODULE, getEnumOptions, getEnumLabel, getEnumItem } from '@/constants/enums'
import {
  getOperationLogListApi,
  getOperationLogDetailApi,
  exportOperationLogsApi,
} from '@/api/operationLog'
import type { OperationLogItem } from '@/types'
import { formatDate } from '@/utils'

const loading = ref(false)
const listData = ref<OperationLogItem[]>([])
const total = ref(0)

const queryParams = reactive({
  page: 1,
  pageSize: 10,
  operatorName: '',
  operationType: null as string | null,
  operationModule: null as string | null,
  isSuccess: null as number | null,
  startDate: '',
  endDate: '',
})

const dateRange = ref<[string, string] | null>(null)

const loadData = async () => {
  loading.value = true
  try {
    const params: Record<string, any> = { ...queryParams }
    if (dateRange.value) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }
    const result = await getOperationLogListApi(params)
    listData.value = result.list
    total.value = result.pagination.total
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  queryParams.page = 1
  loadData()
}

const handleReset = () => {
  queryParams.operatorName = ''
  queryParams.operationType = null
  queryParams.operationModule = null
  queryParams.isSuccess = null
  dateRange.value = null
  handleSearch()
}

const handlePageChange = (page: number) => {
  queryParams.page = page
  loadData()
}

const handleSizeChange = (pageSize: number) => {
  queryParams.pageSize = pageSize
  queryParams.page = 1
  loadData()
}

const handleExport = async () => {
  loading.value = true
  try {
    const params: Record<string, any> = { ...queryParams }
    if (dateRange.value) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }
    await exportOperationLogsApi(params)
    ElMessage.success('导出成功')
  } catch {
    ElMessage.error('导出失败')
  } finally {
    loading.value = false
  }
}

const detailVisible = ref(false)
const currentLog = ref<OperationLogItem | null>(null)
const detailLoading = ref(false)

const openDetail = async (row: OperationLogItem) => {
  detailLoading.value = true
  try {
    const detail = await getOperationLogDetailApi(row.id)
    currentLog.value = detail
    detailVisible.value = true
  } finally {
    detailLoading.value = false
  }
}

const changedFields = computed(() => {
  if (!currentLog.value?.beforeData || !currentLog.value?.afterData) return []
  const before = currentLog.value.beforeData
  const after = currentLog.value.afterData
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)])
  return Array.from(allKeys).map((key) => ({
    field: key,
    before: before[key] ?? '-',
    after: after[key] ?? '-',
  }))
})

const operationTypeOptions = computed(() => getEnumOptions(OPERATION_TYPE))
const operationModuleOptions = computed(() => getEnumOptions(OPERATION_MODULE))

const tableColumns = [
  { prop: 'operatorName', label: '操作人', width: 110, align: 'center' },
  { prop: 'operationType', label: '操作类型', width: 100, align: 'center', slot: 'operationType' },
  { prop: 'operationModule', label: '操作模块', width: 110, align: 'center', slot: 'operationModule' },
  { prop: 'operationDesc', label: '操作描述', minWidth: 200, showOverflowTooltip: true },
  { prop: 'targetName', label: '目标对象', minWidth: 130, showOverflowTooltip: true, slot: 'target' },
  { prop: 'ipAddress', label: 'IP地址', width: 130, align: 'center' },
  { prop: 'duration', label: '耗时(ms)', width: 90, align: 'center', slot: 'duration' },
  { prop: 'isSuccess', label: '状态', width: 80, align: 'center', slot: 'isSuccess' },
  { prop: 'createdAt', label: '时间', width: 170, align: 'center', slot: 'createdAt' },
  { label: '操作', width: 100, fixed: 'right', align: 'center', slot: 'actions' },
]

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="log-page">
    <div class="filter-bar">
      <el-form :inline="true" :model="queryParams" @submit.prevent>
        <el-form-item label="操作人">
          <el-input
            v-model="queryParams.operatorName"
            placeholder="操作人姓名"
            clearable
            style="width: 160px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="操作类型">
          <el-select
            v-model="queryParams.operationType"
            placeholder="全部类型"
            clearable
            style="width: 150px"
          >
            <el-option
              v-for="item in operationTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="操作模块">
          <el-select
            v-model="queryParams.operationModule"
            placeholder="全部模块"
            clearable
            style="width: 150px"
          >
            <el-option
              v-for="item in operationModuleOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="是否成功">
          <el-select
            v-model="queryParams.isSuccess"
            placeholder="全部"
            clearable
            style="width: 120px"
          >
            <el-option label="成功" :value="1" />
            <el-option label="失败" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="dateRange"
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
          <el-button :icon="RefreshLeft" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="card-content">
      <QyTableToolbar
        :loading="loading"
        :show-create="false"
        :show-export="true"
        @refresh="loadData"
        @export="handleExport"
      />

      <QyDataTable
        :columns="tableColumns"
        :data="listData"
        :loading="loading"
        :total="total"
        :page="queryParams.page"
        :page-size="queryParams.pageSize"
        :selection="false"
        :index="true"
        @page-change="handlePageChange"
        @size-change="handleSizeChange"
      >
        <template #operationType="{ row }">
          <el-tag size="small">
            {{ getEnumLabel(OPERATION_TYPE, row.operationType) }}
          </el-tag>
        </template>

        <template #operationModule="{ row }">
          <el-tag size="small" type="info">
            {{ getEnumLabel(OPERATION_MODULE, row.operationModule) }}
          </el-tag>
        </template>

        <template #target="{ row }">
          <span v-if="row.targetName">{{ row.targetName }}</span>
          <span v-else style="color: #909399">-</span>
        </template>

        <template #duration="{ row }">
          <span :class="{ 'text-warning': row.duration > 1000 }">
            {{ row.duration ?? '-' }}
          </span>
        </template>

        <template #isSuccess="{ row }">
          <el-tag :type="row.isSuccess === 1 ? 'success' : 'danger'" size="small">
            {{ row.isSuccess === 1 ? '成功' : '失败' }}
          </el-tag>
        </template>

        <template #createdAt="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>

        <template #actions="{ row }">
          <el-button type="primary" link :icon="View" @click="openDetail(row)">详情</el-button>
        </template>
      </QyDataTable>
    </div>

    <el-dialog
      v-model="detailVisible"
      title="日志详情"
      width="700px"
      destroy-on-close
    >
      <template v-if="currentLog">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="操作人">{{ currentLog.operatorName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="IP地址">{{ currentLog.ipAddress || '-' }}</el-descriptions-item>
          <el-descriptions-item label="操作类型">
            <el-tag size="small">
              {{ getEnumLabel(OPERATION_TYPE, currentLog.operationType) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="操作模块">
            <el-tag size="small" type="info">
              {{ getEnumLabel(OPERATION_MODULE, currentLog.operationModule) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="操作描述" :span="2">{{ currentLog.operationDesc || '-' }}</el-descriptions-item>
          <el-descriptions-item label="目标对象" :span="2">
            <span v-if="currentLog.targetName">{{ currentLog.targetType }} / {{ currentLog.targetName }}</span>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="请求方式">{{ currentLog.requestMethod || '-' }}</el-descriptions-item>
          <el-descriptions-item label="请求URL">{{ currentLog.requestUrl || '-' }}</el-descriptions-item>
          <el-descriptions-item label="耗时">{{ currentLog.duration ?? '-' }}ms</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="currentLog.isSuccess === 1 ? 'success' : 'danger'" size="small">
              {{ currentLog.isSuccess === 1 ? '成功' : '失败' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item v-if="currentLog.errorMessage" label="错误信息" :span="2">
            <span class="text-danger">{{ currentLog.errorMessage }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="操作时间" :span="2">{{ formatDate(currentLog.createdAt) }}</el-descriptions-item>
        </el-descriptions>

        <div v-if="changedFields.length > 0" class="data-compare">
          <div class="compare-title">变更数据对比</div>
          <el-table :data="changedFields" border size="small">
            <el-table-column prop="field" label="字段" width="150" />
            <el-table-column prop="before" label="变更前" min-width="200">
              <template #default="{ row }">
                <span class="compare-old">{{ row.before }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="after" label="变更后" min-width="200">
              <template #default="{ row }">
                <span class="compare-new">{{ row.after }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </template>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.log-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.text-warning {
  color: #E6A23C;
}

.text-danger {
  color: #F56C6C;
}

.data-compare {
  margin-top: 16px;
}

.compare-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.compare-old {
  color: #F56C6C;
}

.compare-new {
  color: #67C23A;
}
</style>
