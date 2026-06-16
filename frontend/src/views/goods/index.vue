<template>
  <div class="page-container">
    <ProTable
      :columns="tableColumns"
      :search-columns="searchColumns"
      :request="fetchGoodsList"
      @add="handleAdd"
      @edit="handleEdit"
      @delete="handleDelete"
      @batch-delete="handleBatchDelete"
    >
      <template #cover="{ row }">
        <el-image
          v-if="row.coverImage"
          :src="row.coverImage"
          :preview-src-list="[row.coverImage]"
          fit="cover"
          style="width: 48px; height: 48px; border-radius: 4px;"
        />
        <span v-else>-</span>
      </template>
    </ProTable>

    <FormDialog
      v-model="dialogVisible"
      :title="dialogTitle"
      :mode="dialogMode"
      :form-items="formItems"
      :initial-data="currentRow"
      :rules="formRules"
      @submit="handleSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { FormRules } from 'element-plus'
import ProTable from '@/components/ProTable/index.vue'
import FormDialog from '@/components/FormDialog/index.vue'
import { GoodsStatusMap } from '@/types/business'
import {
  getGoodsList,
  createGoods,
  updateGoods,
  deleteGoods,
  batchDeleteGoods,
  type Goods
} from '@/api/goods'
import type { PageResult } from '@/types/api'

const dialogVisible = ref(false)
const dialogMode = ref<'add' | 'edit' | 'view'>('add')
const currentRow = ref<Partial<Goods>>({})

const dialogTitle = computed(() => {
  const map = { add: '新增商品', edit: '编辑商品', view: '查看商品' }
  return map[dialogMode.value]
})

const searchColumns = [
  { prop: 'name', label: '商品名称', type: 'input' as const },
  { prop: 'status', label: '商品状态', type: 'select' as const, options: [
    { label: '全部', value: '' },
    { label: '上架', value: 1 },
    { label: '下架', value: 0 }
  ]}
] as const

const tableColumns = [
  { prop: 'coverImage', label: '商品图片', width: 80, align: 'center', slot: 'cover' },
  { prop: 'name', label: '商品名称', minWidth: 200 },
  { prop: 'categoryName', label: '所属分类', width: 120 },
  { prop: 'merchantName', label: '所属商家', width: 120 },
  { prop: 'price', label: '售价', width: 100, align: 'right', type: 'amount' as const },
  { prop: 'stock', label: '库存', width: 80, align: 'center' },
  { prop: 'sales', label: '销量', width: 80, align: 'center' },
  { prop: 'status', label: '状态', width: 80, align: 'center', type: 'status' as const, statusMap: GoodsStatusMap },
  { prop: 'createdAt', label: '创建时间', width: 180, align: 'center', type: 'datetime' as const }
] as const

const formItems = [
  { prop: 'name', label: '商品名称', placeholder: '请输入商品名称' },
  { prop: 'categoryId', label: '商品分类', type: 'select' as const, options: [
    { label: '数码电器', value: 1 },
    { label: '服装鞋帽', value: 2 },
    { label: '食品生鲜', value: 3 },
    { label: '美妆个护', value: 4 }
  ]},
  { prop: 'merchantId', label: '所属商家', type: 'select' as const, options: [
    { label: '自营旗舰店', value: 1 },
    { label: '官方旗舰店', value: 2 }
  ]},
  { prop: 'price', label: '售价', type: 'number' as const, min: 0, precision: 2 },
  { prop: 'originalPrice', label: '原价', type: 'number' as const, min: 0, precision: 2 },
  { prop: 'stock', label: '库存', type: 'number' as const, min: 0, precision: 0 },
  { prop: 'coverImage', label: '商品图片', type: 'upload' as const },
  { prop: 'status', label: '商品状态', type: 'radio' as const, options: [
    { label: '上架', value: 1 },
    { label: '下架', value: 0 }
  ]},
  { prop: 'description', label: '商品描述', type: 'textarea' as const, rows: 4 }
] as const

const formRules: FormRules = {
  name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择商品分类', trigger: 'change' }],
  price: [{ required: true, message: '请输入售价', trigger: 'blur' }]
}

const fetchGoodsList = async (params: Record<string, unknown>): Promise<PageResult<Goods>> => {
  const res = await getGoodsList(params as { pageNum: number; pageSize: number })
  return res.data
}

const handleAdd = () => {
  dialogMode.value = 'add'
  currentRow.value = {}
  dialogVisible.value = true
}

const handleEdit = (row: Record<string, unknown>) => {
  dialogMode.value = 'edit'
  currentRow.value = { ...row } as unknown as Goods
  dialogVisible.value = true
}

const handleDelete = async (row: Record<string, unknown>) => {
  await deleteGoods(row.id as number)
}

const handleBatchDelete = async (ids: (string | number)[]) => {
  await batchDeleteGoods(ids as number[])
}

const handleSubmit = async (data: Record<string, unknown>) => {
  if (dialogMode.value === 'add') {
    await createGoods(data as Partial<Goods>)
  } else if (dialogMode.value === 'edit') {
    await updateGoods(currentRow.value.id!, data as Partial<Goods>)
  }
}
</script>
