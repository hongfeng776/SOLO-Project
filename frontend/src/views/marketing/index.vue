<template>
  <div class="page-container">
    <ProTable
      ref="proTableRef"
      :columns="tableColumns"
      :search-columns="searchColumns"
      :request="fetchList"
      :stripe="true"
      :show-batch-delete="false"
      :actions-width="240"
      @add="handleAdd"
      @edit="handleEdit"
      @delete="handleDelete"
    >
      <template #toolbar-left>
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>新增活动
        </el-button>
        <el-button type="success" @click="handleBatchOnlinePending">
          <el-icon><VideoPlay /></el-icon>批量上线待启动
        </el-button>
        <el-button type="warning" @click="handleBatchOfflineExpired">
          <el-icon><VideoPause /></el-icon>批量下架过期
        </el-button>
      </template>

      <template #batch-actions="{ rows }">
        <el-button link type="success" @click="handleBatchOnline(rows)">
          <el-icon><VideoPlay /></el-icon>批量上线
        </el-button>
        <el-button link type="warning" @click="handleBatchOffline(rows)">
          <el-icon><VideoPause /></el-icon>批量下架
        </el-button>
        <el-button link type="danger" @click="handleBatchPause(rows)">
          <el-icon><Warning /></el-icon>批量暂停
        </el-button>
      </template>

      <template #type="{ row }">
        {{ MarketingTypeMap[row.type] }}
      </template>

      <template #status="{ row }">
        <el-tag :type="MarketingStatusMap[row.status]?.type">
          {{ MarketingStatusMap[row.status]?.label }}
        </el-tag>
      </template>

      <template #discountType="{ row }">
        <el-tag :type="DiscountTypeMap[row.discountType]?.type">
          {{ DiscountTypeMap[row.discountType]?.label }}
        </el-tag>
      </template>

      <template #discountValue="{ row }">
        <span v-if="row.discountType === 2">{{ (row.discountValue * 10).toFixed(1) }}折</span>
        <span v-else>¥{{ row.discountValue }}</span>
      </template>

      <template #isViolation="{ row }">
        <el-tag v-if="row.isViolation === 1" type="danger">违规</el-tag>
        <span v-else>-</span>
      </template>

      <template #description="{ row }">
        <el-tooltip v-if="row.description && row.description.length > 20" :content="row.description" placement="top">
          <span>{{ row.description.substring(0, 20) }}...</span>
        </el-tooltip>
        <span v-else>{{ row.description || '-' }}</span>
      </template>

      <template #actions="{ row }">
        <el-button link type="primary" @click="handleView(row)">查看</el-button>
        <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
        <el-button link type="info" @click="handleTrace(row)">溯源</el-button>
        <el-dropdown v-if="row.status === 0" @command="(cmd) => handleStatusChange(row, cmd)">
          <el-button link type="success">更多<el-icon><ArrowDown /></el-icon></el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item :command="1">上线</el-dropdown-item>
              <el-dropdown-item :command="3">下架</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-dropdown v-else-if="row.status === 1" @command="(cmd) => handleStatusChange(row, cmd)">
          <el-button link type="warning">更多<el-icon><ArrowDown /></el-icon></el-button>
          <template #dropdown>
            <el-dropdown-item :command="2">结束</el-dropdown-item>
            <el-dropdown-item :command="3">下架</el-dropdown-item>
          </template>
        </el-dropdown>
      </template>
    </ProTable>

    <MarketingFormDialog
      v-model="formDialogVisible"
      :mode="dialogMode"
      :initial-data="currentRow"
      @success="handleFormSuccess"
    />

    <MarketingTraceDialog
      v-model="traceDialogVisible"
      :marketing-id="currentTraceId"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, VideoPlay, VideoPause, Warning, ArrowDown } from '@element-plus/icons-vue'
import ProTable from '@/components/ProTable/index.vue'
import MarketingFormDialog from './components/MarketingFormDialog.vue'
import MarketingTraceDialog from './components/MarketingTraceDialog.vue'
import {
  MarketingTypeMap,
  MarketingStatusMap,
  DiscountTypeMap,
  MarketingStatus
} from '@/types/business'
import {
  getMarketingList,
  deleteMarketing,
  updateMarketingStatus,
  batchOnlineMarketing,
  batchOfflineMarketing,
  batchPauseMarketing,
  batchOfflineExpired,
  batchOnlinePending,
  type MarketingQueryParams
} from '@/api/marketing'
import type { Marketing } from '@/types/business'
import type { PageResult } from '@/types/api'

const proTableRef = ref<InstanceType<typeof ProTable>>()
const formDialogVisible = ref(false)
const traceDialogVisible = ref(false)
const dialogMode = ref<'add' | 'edit' | 'view'>('add')
const currentRow = ref<Partial<Marketing>>({})
const currentTraceId = ref<number>(0)

const searchColumns = [
  { prop: 'name', label: '活动名称', type: 'input' as const },
  { prop: 'type', label: '活动类型', type: 'select' as const, options: [
    { label: '全部', value: '' },
    { label: '优惠券', value: 1 },
    { label: '满减活动', value: 2 },
    { label: '秒杀活动', value: 3 },
    { label: '拼团活动', value: 4 }
  ]},
  { prop: 'status', label: '活动状态', type: 'select' as const, options: [
    { label: '全部', value: '' },
    { label: '未开始', value: 0 },
    { label: '进行中', value: 1 },
    { label: '已结束', value: 2 },
    { label: '已下架', value: 3 }
  ]},
  { prop: 'discountType', label: '优惠类型', type: 'select' as const, options: [
    { label: '全部', value: '' },
    { label: '满减', value: 1 },
    { label: '折扣', value: 2 },
    { label: '优惠券', value: 3 }
  ]},
  { prop: 'startTime', label: '开始时间', type: 'daterange' as const },
  { prop: 'endTime', label: '结束时间', type: 'daterange' as const },
  { prop: 'minDiscount', label: '最低优惠力度', type: 'number' as const, min: 0, precision: 2 },
  { prop: 'maxDiscount', label: '最高优惠力度', type: 'number' as const, min: 0, precision: 2 }
] as const

const tableColumns = [
  { prop: 'name', label: '活动名称', minWidth: 180, slot: 'name' },
  { prop: 'type', label: '活动类型', width: 100, align: 'center', slot: 'type' },
  { prop: 'status', label: '状态', width: 90, align: 'center', slot: 'status' },
  { prop: 'discountType', label: '优惠类型', width: 90, align: 'center', slot: 'discountType' },
  { prop: 'minAmount', label: '使用门槛', width: 100, align: 'right', type: 'amount' as const },
  { prop: 'discountValue', label: '优惠力度', width: 100, align: 'center', slot: 'discountValue' },
  { prop: 'totalCount', label: '发放数量', width: 90, align: 'center' },
  { prop: 'usedCount', label: '已使用', width: 80, align: 'center' },
  { prop: 'isViolation', label: '违规', width: 70, align: 'center', slot: 'isViolation' },
  { prop: 'description', label: '活动规则', minWidth: 150, slot: 'description' },
  { prop: 'startTime', label: '开始时间', width: 160, align: 'center', type: 'datetime' as const },
  { prop: 'endTime', label: '结束时间', width: 160, align: 'center', type: 'datetime' as const }
] as const

const fetchList = async (params: Record<string, unknown>): Promise<PageResult<Marketing>> => {
  const queryParams = { ...params } as unknown as MarketingQueryParams
  const paramsRecord = params as Record<string, unknown>
  if (params.startTime && Array.isArray(params.startTime)) {
    queryParams.startTimeStart = params.startTime[0] as string
    queryParams.startTimeEnd = params.startTime[1] as string
    const { startTime, ...rest } = paramsRecord
    Object.assign(queryParams, rest)
  }
  if (params.endTime && Array.isArray(params.endTime)) {
    queryParams.endTimeStart = params.endTime[0] as string
    queryParams.endTimeEnd = params.endTime[1] as string
    const { endTime, ...rest } = paramsRecord
    Object.assign(queryParams, rest)
  }
  const res = await getMarketingList(queryParams)
  return res.data
}

const handleAdd = () => {
  dialogMode.value = 'add'
  currentRow.value = {}
  formDialogVisible.value = true
}

const handleEdit = (row: Record<string, unknown>) => {
  dialogMode.value = 'edit'
  currentRow.value = { ...row } as unknown as Marketing
  formDialogVisible.value = true
}

const handleView = (row: Record<string, unknown>) => {
  dialogMode.value = 'view'
  currentRow.value = { ...row } as unknown as Marketing
  formDialogVisible.value = true
}

const handleDelete = async (row: Record<string, unknown>) => {
  await deleteMarketing(row.id as number)
}

const handleTrace = (row: Record<string, unknown>) => {
  currentTraceId.value = row.id as number
  traceDialogVisible.value = true
}

const handleStatusChange = async (row: Record<string, unknown>, status: number) => {
  const statusText = MarketingStatusMap[status]?.label || ''
  try {
    await ElMessageBox.confirm(`确定要将活动"${row.name}"${statusText}吗？`, '提示', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
    await updateMarketingStatus(row.id as number, status)
    ElMessage.success(`操作成功，活动已${statusText}`)
    proTableRef.value?.fetchData()
  } catch {
  }
}

const handleBatchOnline = (rows: Record<string, unknown>[]) => {
  const ids = rows.filter(r => r.status === MarketingStatus.PENDING).map(r => r.id as number)
  if (ids.length === 0) {
    ElMessage.warning('请选择未开始的活动')
    return
  }
  ElMessageBox.confirm(`确定要上线选中的 ${ids.length} 个活动吗？`, '提示', {
    type: 'warning',
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  }).then(async () => {
    const res = await batchOnlineMarketing(ids)
    ElMessage.success(`批量上线成功：${res.data.success}个成功，${res.data.failed}个失败`)
    proTableRef.value?.handleClearSelection()
    proTableRef.value?.fetchData()
  }).catch(() => {})
}

const handleBatchOffline = (rows: Record<string, unknown>[]) => {
  const ids = rows.filter(r => r.status === MarketingStatus.ONGOING || r.status === MarketingStatus.PENDING).map(r => r.id as number)
  if (ids.length === 0) {
    ElMessage.warning('请选择未开始或进行中的活动')
    return
  }
  ElMessageBox.confirm(`确定要下架选中的 ${ids.length} 个活动吗？`, '提示', {
    type: 'warning',
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  }).then(async () => {
    const res = await batchOfflineMarketing(ids)
    ElMessage.success(`批量下架成功：${res.data.success}个成功，${res.data.failed}个失败`)
    proTableRef.value?.handleClearSelection()
    proTableRef.value?.fetchData()
  }).catch(() => {})
}

const handleBatchPause = (rows: Record<string, unknown>[]) => {
  const ids = rows.filter(r => r.status === MarketingStatus.ONGOING).map(r => r.id as number)
  if (ids.length === 0) {
    ElMessage.warning('请选择进行中的活动')
    return
  }
  ElMessageBox.confirm(`确定要暂停选中的 ${ids.length} 个违规活动吗？`, '提示', {
    type: 'warning',
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  }).then(async () => {
    const res = await batchPauseMarketing(ids)
    ElMessage.success(`批量暂停成功：${res.data.success}个成功，${res.data.failed}个失败`)
    proTableRef.value?.handleClearSelection()
    proTableRef.value?.fetchData()
  }).catch(() => {})
}

const handleBatchOnlinePending = async () => {
  try {
    await ElMessageBox.confirm('确定要批量上线所有待启动的活动吗？', '提示', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
    const res = await batchOnlinePending()
    ElMessage.success(`批量上线成功：${res.data.success}个成功，${res.data.failed}个失败`)
    proTableRef.value?.fetchData()
  } catch {
  }
}

const handleBatchOfflineExpired = async () => {
  try {
    await ElMessageBox.confirm('确定要批量下架所有过期的活动吗？', '提示', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
    const res = await batchOfflineExpired()
    ElMessage.success(`批量下架成功：${res.data.success}个成功，${res.data.failed}个失败`)
    proTableRef.value?.fetchData()
  } catch {
  }
}

const handleFormSuccess = () => {
  proTableRef.value?.fetchData()
}
</script>
