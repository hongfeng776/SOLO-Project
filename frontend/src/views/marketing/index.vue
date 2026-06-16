<template>
  <div class="page-container">
    <ProTable
      :columns="tableColumns"
      :search-columns="searchColumns"
      :request="fetchList"
      @add="handleAdd"
      @edit="handleEdit"
      @delete="handleDelete"
    >
      <template #type="{ row }">
        {{ MarketingTypeMap[row.type] }}
      </template>
      <template #status="{ row }">
        <el-tag :type="row.status === 1 ? 'success' : 'info'">
          {{ row.status === 1 ? '进行中' : '已结束' }}
        </el-tag>
      </template>
    </ProTable>

    <FormDialog
      v-model="dialogVisible"
      :title="dialogTitle"
      :mode="dialogMode"
      :form-items="formItems"
      :initial-data="currentRow"
      @submit="handleSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import ProTable from '@/components/ProTable/index.vue'
import FormDialog from '@/components/FormDialog/index.vue'
import { MarketingTypeMap } from '@/types/business'
import {
  getMarketingList,
  createMarketing,
  updateMarketing,
  deleteMarketing,
  type Marketing
} from '@/api/marketing'
import type { PageResult } from '@/types/api'

const dialogVisible = ref(false)
const dialogMode = ref<'add' | 'edit' | 'view'>('add')
const currentRow = ref<Partial<Marketing>>({})

const dialogTitle = computed(() => dialogMode.value === 'add' ? '新增营销活动' : '编辑营销活动')

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
    { label: '进行中', value: 1 },
    { label: '已结束', value: 0 }
  ]}
] as const

const tableColumns = [
  { prop: 'name', label: '活动名称', minWidth: 180 },
  { prop: 'type', label: '活动类型', width: 120, align: 'center', slot: 'type' },
  { prop: 'minAmount', label: '使用门槛', width: 120, align: 'right', type: 'amount' as const },
  { prop: 'discountValue', label: '优惠力度', width: 120 },
  { prop: 'totalCount', label: '发放数量', width: 100, align: 'center' },
  { prop: 'usedCount', label: '已使用', width: 100, align: 'center' },
  { prop: 'status', label: '状态', width: 100, align: 'center', slot: 'status' },
  { prop: 'startTime', label: '开始时间', width: 160, align: 'center', type: 'datetime' as const },
  { prop: 'endTime', label: '结束时间', width: 160, align: 'center', type: 'datetime' as const }
] as const

const formItems = [
  { prop: 'name', label: '活动名称', placeholder: '请输入活动名称' },
  { prop: 'type', label: '活动类型', type: 'select' as const, options: [
    { label: '优惠券', value: 1 },
    { label: '满减活动', value: 2 },
    { label: '秒杀活动', value: 3 },
    { label: '拼团活动', value: 4 }
  ]},
  { prop: 'minAmount', label: '使用门槛', type: 'number' as const, min: 0, precision: 2, placeholder: '最低消费金额' },
  { prop: 'discountValue', label: '优惠金额', type: 'number' as const, min: 0, precision: 2 },
  { prop: 'totalCount', label: '发放数量', type: 'number' as const, min: 0, precision: 0 },
  { prop: 'perUserLimit', label: '每人限领', type: 'number' as const, min: 1, precision: 0 },
  { prop: 'startTime', label: '开始时间', type: 'datetime' as const },
  { prop: 'endTime', label: '结束时间', type: 'datetime' as const },
  { prop: 'description', label: '活动描述', type: 'textarea' as const, rows: 3 }
] as const

const fetchList = async (params: Record<string, unknown>): Promise<PageResult<Marketing>> => {
  const res = await getMarketingList(params as { pageNum: number; pageSize: number })
  return res.data
}

const handleAdd = () => {
  dialogMode.value = 'add'
  currentRow.value = {}
  dialogVisible.value = true
}

const handleEdit = (row: Record<string, unknown>) => {
  dialogMode.value = 'edit'
  currentRow.value = { ...row } as unknown as Marketing
  dialogVisible.value = true
}

const handleDelete = async (row: Record<string, unknown>) => {
  await deleteMarketing(row.id as number)
}

const handleSubmit = async (data: Record<string, unknown>) => {
  if (dialogMode.value === 'add') {
    await createMarketing(data as Partial<Marketing>)
  } else {
    await updateMarketing(currentRow.value.id!, data as Partial<Marketing>)
  }
}
</script>
