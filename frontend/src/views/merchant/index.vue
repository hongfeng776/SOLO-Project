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
      <template #logo="{ row }">
        <el-avatar :src="row.logo" :size="36" shape="square" />
      </template>
      <template #status="{ row }">
        <el-tag :type="MerchantStatusMap[row.status]?.type">
          {{ MerchantStatusMap[row.status]?.label }}
        </el-tag>
      </template>
      <template #actions="{ row }">
        <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
        <el-button link type="success" @click="handleApprove(row)" v-if="row.status === 0">审核通过</el-button>
        <el-button link type="danger" @click="handleReject(row)" v-if="row.status === 0">拒绝</el-button>
        <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
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
import { MerchantStatusMap } from '@/types/business'
import {
  getMerchantList,
  createMerchant,
  updateMerchant,
  deleteMerchant,
  approveMerchant,
  rejectMerchant,
  type Merchant
} from '@/api/merchant'
import type { PageResult } from '@/types/api'

const dialogVisible = ref(false)
const dialogMode = ref<'add' | 'edit' | 'view'>('add')
const currentRow = ref<Partial<Merchant>>({})

const dialogTitle = computed(() => dialogMode.value === 'add' ? '新增商家' : '编辑商家')

const searchColumns = [
  { prop: 'name', label: '商家名称', type: 'input' as const },
  { prop: 'status', label: '入驻状态', type: 'select' as const, options: [
    { label: '全部', value: '' },
    { label: '待审核', value: 0 },
    { label: '已入驻', value: 1 },
    { label: '已拒绝', value: 2 },
    { label: '已禁用', value: 3 }
  ]}
] as const

const tableColumns = [
  { prop: 'logo', label: '店铺Logo', width: 80, align: 'center', slot: 'logo' },
  { prop: 'name', label: '商家名称', minWidth: 180 },
  { prop: 'contactName', label: '联系人', width: 100 },
  { prop: 'contactPhone', label: '联系电话', width: 130 },
  { prop: 'rating', label: '评分', width: 80, align: 'center' },
  { prop: 'totalOrders', label: '订单数', width: 100, align: 'center' },
  { prop: 'totalSales', label: '销售额', width: 130, align: 'right', type: 'amount' as const },
  { prop: 'status', label: '状态', width: 100, align: 'center', slot: 'status' },
  { prop: 'createdAt', label: '入驻时间', width: 180, align: 'center', type: 'datetime' as const }
] as const

const formItems = [
  { prop: 'name', label: '商家名称', placeholder: '请输入商家名称' },
  { prop: 'logo', label: '店铺Logo', type: 'upload' as const },
  { prop: 'contactName', label: '联系人', placeholder: '请输入联系人姓名' },
  { prop: 'contactPhone', label: '联系电话', placeholder: '请输入联系电话' },
  { prop: 'contactEmail', label: '联系邮箱', placeholder: '请输入联系邮箱' },
  { prop: 'address', label: '店铺地址', placeholder: '请输入店铺地址' },
  { prop: 'businessLicense', label: '营业执照', type: 'upload' as const },
  { prop: 'description', label: '店铺简介', type: 'textarea' as const, rows: 3 }
] as const

const fetchList = async (params: Record<string, unknown>): Promise<PageResult<Merchant>> => {
  const res = await getMerchantList(params as { pageNum: number; pageSize: number })
  return res.data
}

const handleAdd = () => {
  dialogMode.value = 'add'
  currentRow.value = {}
  dialogVisible.value = true
}

const handleEdit = (row: Record<string, unknown>) => {
  dialogMode.value = 'edit'
  currentRow.value = { ...row } as unknown as Merchant
  dialogVisible.value = true
}

const handleDelete = async (row: Record<string, unknown>) => {
  await deleteMerchant(row.id as number)
}

const handleApprove = async (row: Record<string, unknown>) => {
  await approveMerchant(row.id as number)
}

const handleReject = async (row: Record<string, unknown>) => {
  await rejectMerchant(row.id as number, '资质不符合要求')
}

const handleSubmit = async (data: Record<string, unknown>) => {
  if (dialogMode.value === 'add') {
    await createMerchant(data as Partial<Merchant>)
  } else {
    await updateMerchant(currentRow.value.id!, data as Partial<Merchant>)
  }
}
</script>
