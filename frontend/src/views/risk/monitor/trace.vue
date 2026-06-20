<template>
  <div class="ccb-monitor-trace">
    <CcbPageHeader
      title="告警追踪记录"
      description="查看异常交易告警的追踪与处理记录"
      icon="Clock"
    >
      <template #extra>
        <el-button type="primary" :icon="ArrowLeft" @click="goBack">
          返回列表
        </el-button>
      </template>
    </CcbPageHeader>

    <CcbSearchForm v-model="searchForm" @search="handleSearch" @reset="handleReset">
      <el-form-item label="告警编号" prop="alert_no">
        <el-input v-model="searchForm.alert_no" placeholder="请输入告警编号" clearable />
      </el-form-item>
      <el-form-item label="追踪类型" prop="trace_type">
        <el-select v-model="searchForm.trace_type" placeholder="请选择追踪类型" clearable>
          <el-option v-for="item in TraceTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="追踪时间" prop="timeRange">
        <el-date-picker
          v-model="searchForm.timeRange"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          value-format="YYYY-MM-DD HH:mm:ss"
        />
      </el-form-item>
    </CcbSearchForm>

    <div class="ccb-table-toolbar">
      <div class="ccb-table-toolbar-left">
        <CcbPermissionButton
          label="刷新"
          type="success"
          :icon="Refresh"
          @click="handleRefresh"
        />
      </div>
    </div>

    <CcbTable
      v-model:page="pageParams.page"
      v-model:pageSize="pageParams.pageSize"
      :loading="loading"
      :data="tableData"
      :total="total"
      :show-selection="false"
      :show-index="true"
      @change="handlePageChange"
    >
      <el-table-column prop="alert_no" label="告警编号" width="180" />
      <el-table-column prop="trace_type_text" label="追踪类型" width="100">
        <template #default="{ row }">
          <el-tag :type="getTraceTypeTag(row.trace_type)" effect="light" size="small">
            {{ row.trace_type_text }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="customer_no" label="客户编号" width="140" />
      <el-table-column prop="customer_name" label="客户姓名" width="100" />
      <el-table-column prop="content" label="追踪内容" min-width="250" show-overflow-tooltip />
      <el-table-column prop="operator_name" label="操作人" width="100">
        <template #default="{ row }">
          {{ row.operator_name || '系统自动' }}
        </template>
      </el-table-column>
      <el-table-column prop="trace_time" label="追踪时间" width="160" />
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleViewAlert(row)">查看告警</el-button>
        </template>
      </el-table-column>
    </CcbTable>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import {
  getTraceListApi,
  TraceTypeOptions,
  type MonitorTraceVO,
  type MonitorTraceQueryParams
} from '@api/abnormalMonitor'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const tableData = ref<MonitorTraceVO[]>([])
const total = ref(0)

const searchForm = reactive({
  alert_no: '',
  trace_type: undefined as number | undefined,
  timeRange: [] as string[]
})

const pageParams = reactive({ page: 1, pageSize: 20 })

async function loadList() {
  loading.value = true
  try {
    const params: MonitorTraceQueryParams = {
      page: pageParams.page,
      pageSize: pageParams.pageSize,
      alert_no: searchForm.alert_no || undefined,
      trace_type: searchForm.trace_type,
      start_time: searchForm.timeRange?.[0],
      end_time: searchForm.timeRange?.[1]
    }

    const result = await getTraceListApi(params)
    tableData.value = result.list
    total.value = result.total
  } catch (e: any) {
    ElMessage.error(e.message || '获取数据失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pageParams.page = 1
  loadList()
}

function handleReset() {
  searchForm.alert_no = ''
  searchForm.trace_type = undefined
  searchForm.timeRange = []
  pageParams.page = 1
  loadList()
}

function handlePageChange() {
  loadList()
}

function handleRefresh() {
  loadList()
  ElMessage.success('刷新成功')
}

function goBack() {
  router.push('/risk/monitor')
}

function handleViewAlert(row: MonitorTraceVO) {
  router.push({
    path: '/risk/monitor',
    query: { alertId: row.alert_id }
  })
}

function getTraceTypeTag(traceType: number): string {
  const tagMap: Record<number, string> = {
    1: 'danger',
    2: 'warning',
    3: 'primary',
    4: 'success',
    5: 'danger',
    6: 'danger',
    7: 'success'
  }
  return tagMap[traceType] || 'info'
}

onMounted(() => {
  const alertId = route.query.alertId as string
  if (alertId) {
    searchForm.alert_no = alertId
  }
  loadList()
})
</script>

<style lang="scss" scoped>
.ccb-monitor-trace {
}
</style>
