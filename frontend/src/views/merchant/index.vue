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
      <template #status="{ row }">
        <el-tag :type="MerchantStatusMap[row.status]?.type">
          {{ MerchantStatusMap[row.status]?.label }}
        </el-tag>
      </template>
      <template #settle_status="{ row }">
        <el-tag :type="getSettleTagType(row.settle_status)">
          {{ getSettleLabel(row.settle_status) }}
        </el-tag>
      </template>
      <template #actions="{ row }">
        <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
        <el-button link type="warning" @click="handleOpenQualification(row)">
          <el-icon><Document /></el-icon> 资质
        </el-button>
        <el-button link type="success" @click="handleOpenAudit(row)">
          <el-icon><Stamp /></el-icon> 审核
        </el-button>
        <el-button link type="info" @click="handleOpenTrace(row)">
          <el-icon><View /></el-icon> 溯源
        </el-button>
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

    <QualificationSubmitDialog
      v-model="qualDialogVisible"
      :merchant-id="currentMerchantId"
      :initial-data="currentMerchantData"
      @submitted="onQualSubmitted"
      @resubmitted="onQualSubmitted"
    />

    <QualificationTraceDialog
      v-model="traceDialogVisible"
      :merchant-id="currentMerchantId"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Document, Stamp, View } from '@element-plus/icons-vue'
import ProTable from '@/components/ProTable/index.vue'
import FormDialog from '@/components/FormDialog/index.vue'
import { MerchantStatusMap } from '@/types/business'
import {
  getMerchantList,
  createMerchant,
  updateMerchant,
  deleteMerchant,
  type Merchant
} from '@/api/merchant'
import { SETTLE_STATUS_OPTIONS, type MerchantAuditSettleItem } from '@/api/merchantQualification'
import type { PageResult } from '@/types/api'
import QualificationSubmitDialog from './components/QualificationSubmitDialog.vue'
import QualificationTraceDialog from './components/QualificationTraceDialog.vue'

const router = useRouter()

const dialogVisible = ref(false)
const dialogMode = ref<'add' | 'edit' | 'view'>('add')
const currentRow = ref<Partial<Merchant>>({})

const qualDialogVisible = ref(false)
const traceDialogVisible = ref(false)
const currentMerchantId = ref<number | undefined>(undefined)
const currentMerchantData = ref<MerchantAuditSettleItem | null>(null)

const dialogTitle = computed(() => dialogMode.value === 'add' ? '新增商家' : '编辑商家')

const getSettleTagType = (status?: number): 'primary' | 'success' | 'warning' | 'info' | 'danger' => {
  const o = SETTLE_STATUS_OPTIONS.find(x => x.value === status)
  return (o?.type as 'primary' | 'success' | 'warning' | 'info' | 'danger') || 'info'
}
const getSettleLabel = (status?: number) => {
  const o = SETTLE_STATUS_OPTIONS.find(x => x.value === status)
  return o?.label || (status === undefined ? '未提交' : `状态(${status})`)
}

const searchColumns = [
  { prop: 'name', label: '商家名称', type: 'input' as const },
  { prop: 'phone', label: '联系电话', type: 'input' as const },
  { prop: 'status', label: '启用状态', type: 'select' as const, options: [
    { label: '全部', value: '' },
    { label: '禁用', value: 0 },
    { label: '启用', value: 1 }
  ]}
] as const

const tableColumns = [
  { prop: 'name', label: '商家名称', minWidth: 180 },
  { prop: 'contact', label: '联系人', width: 100 },
  { prop: 'phone', label: '联系电话', width: 130 },
  { prop: 'address', label: '地址', minWidth: 200, showOverflowTooltip: true },
  { prop: 'settle_status', label: '入驻状态', width: 110, align: 'center', slot: 'settle_status' },
  { prop: 'status', label: '启用状态', width: 100, align: 'center', slot: 'status' },
  { prop: 'credit_score', label: '信用分', width: 90, align: 'center' },
  { prop: 'created_at', label: '创建时间', width: 180, align: 'center', type: 'datetime' as const },
  { prop: 'actions', label: '操作', width: 280, align: 'center', fixed: 'right' as const, slot: 'actions' }
] as const

const formItems = [
  { prop: 'name', label: '商家名称', placeholder: '请输入商家名称', required: true },
  { prop: 'contact', label: '联系人', placeholder: '请输入联系人姓名' },
  { prop: 'phone', label: '联系电话', placeholder: '请输入联系电话' },
  { prop: 'address', label: '地址', placeholder: '请输入地址' },
  { prop: 'status', label: '启用状态', type: 'select' as const, options: [
    { label: '禁用', value: 0 },
    { label: '启用', value: 1 }
  ]}
] as const

const fetchList = async (params: Record<string, unknown>): Promise<PageResult<Merchant>> => {
  const res = await getMerchantList(params as { pageNum: number; pageSize: number })
  return res.data
}

const handleAdd = () => {
  dialogMode.value = 'add'
  currentRow.value = { status: 1 }
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

const handleSubmit = async (data: Record<string, unknown>) => {
  if (dialogMode.value === 'add') {
    const result = await createMerchant(data as Partial<Merchant>)
    if (result?.data?.id) {
      currentMerchantId.value = result.data.id
      qualDialogVisible.value = true
    }
  } else {
    await updateMerchant(currentRow.value.id!, data as Partial<Merchant>)
  }
}

const buildMerchantData = (row: Record<string, unknown>): MerchantAuditSettleItem => {
  return {
    id: row.id as number,
    name: (row.name as string) || '',
    contact: row.contact as string,
    phone: row.phone as string,
    legal_person: (row as any).legal_person,
    credit_code: (row as any).credit_code,
    business_license_no: (row as any).business_license_no,
    license_valid_from: (row as any).license_valid_from,
    license_valid_to: (row as any).license_valid_to,
    industry_type: (row as any).industry_type,
    settle_status: (row as any).settle_status ?? 0,
    shop_open_status: (row as any).shop_open_status,
    goods_publish_permission: (row as any).goods_publish_permission,
    qualification_remark: (row as any).qualification_remark,
    audit_reason: (row as any).audit_reason,
    last_audit_time: (row as any).last_audit_time,
  }
}

const handleOpenQualification = (row: Record<string, unknown>) => {
  currentMerchantId.value = row.id as number
  currentMerchantData.value = buildMerchantData(row)
  qualDialogVisible.value = true
}

const handleOpenAudit = (row: Record<string, unknown>) => {
  router.push({ path: '/merchant/audit', query: { merchant_id: row.id as number } })
}

const handleOpenTrace = (row: Record<string, unknown>) => {
  currentMerchantId.value = row.id as number
  traceDialogVisible.value = true
}

const onQualSubmitted = () => {
  qualDialogVisible.value = false
}
</script>
