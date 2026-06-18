<template>
  <div class="page-container">
    <ProTable
      :columns="tableColumns"
      :search-columns="searchColumns"
      :request="fetchList"
      :show-add="false"
      :show-batch-delete="false"
      :show-delete="false"
    >
      <template #type="{ row }">
        {{ row.type === 1 ? '仅退款' : '退货退款' }}
      </template>
      <template #status="{ row }">
        <el-tag :type="AfterSaleStatusMap[row.status]?.type">
          {{ AfterSaleStatusMap[row.status]?.label }}
        </el-tag>
      </template>
      <template #actions="{ row }">
        <el-button link type="primary" @click="handleView(row)">查看</el-button>
        <el-button link type="success" @click="handleApprove(row)" v-if="row.status === 1">通过</el-button>
        <el-button link type="danger" @click="handleReject(row)" v-if="row.status === 1">拒绝</el-button>
      </template>
    </ProTable>

    <el-dialog v-model="detailVisible" title="售后详情" width="600px">
      <el-descriptions :column="2" border v-if="currentRow">
        <el-descriptions-item label="售后单号">{{ currentRow.afterSaleNo }}</el-descriptions-item>
        <el-descriptions-item label="关联订单">{{ currentRow.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="申请用户ID">{{ currentRow.userId }}</el-descriptions-item>
        <el-descriptions-item label="售后类型">
          {{ currentRow.type === 1 ? '退款' : currentRow.type === 2 ? '退货退款' : currentRow.type === 3 ? '换货' : '维修' }}
        </el-descriptions-item>
        <el-descriptions-item label="申请金额">
          <span class="amount-text">{{ formatAmount(currentRow.amount ?? 0) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="退款金额">
          <span class="amount-text">{{ formatAmount(currentRow.amount ?? 0) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="申请原因" :span="2">{{ currentRow.reason || '-' }}</el-descriptions-item>
        <el-descriptions-item label="处理备注" :span="2">{{ currentRow.handleRemark || '-' }}</el-descriptions-item>
        <el-descriptions-item label="申请时间">{{ formatDateTime(currentRow.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="处理时间">{{ formatDateTime(currentRow.completedAt ?? currentRow.updatedAt) }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ProTable from '@/components/ProTable/index.vue'
import { AfterSaleStatusMap } from '@/types/business'
import {
  getAfterSaleList,
  processAfterSale,
  type AfterSaleRecord as AfterSale
} from '@/api/aftersale'
import { formatAmount } from '@/utils/amount'
import { formatDateTime } from '@/utils/date'
import type { PageResult } from '@/types/api'

const detailVisible = ref(false)
const currentRow = ref<AfterSale | null>(null)

const searchColumns = [
  { prop: 'orderNo', label: '订单编号', type: 'input' as const },
  { prop: 'status', label: '售后状态', type: 'select' as const, options: [
    { label: '全部', value: '' },
    { label: '待处理', value: 1 },
    { label: '处理中', value: 2 },
    { label: '已完成', value: 3 },
    { label: '已拒绝', value: 4 },
    { label: '已取消', value: 5 }
  ]},
  { prop: 'type', label: '售后类型', type: 'select' as const, options: [
    { label: '全部', value: '' },
    { label: '仅退款', value: 1 },
    { label: '退货退款', value: 2 }
  ]}
] as const

const tableColumns = [
  { prop: 'id', label: '售后单号', width: 100 },
  { prop: 'orderNo', label: '关联订单', width: 180 },
  { prop: 'username', label: '申请用户', width: 120 },
  { prop: 'type', label: '售后类型', width: 100, align: 'center', slot: 'type' },
  { prop: 'applyAmount', label: '申请金额', width: 120, align: 'right', type: 'amount' as const },
  { prop: 'status', label: '状态', width: 100, align: 'center', slot: 'status' },
  { prop: 'reason', label: '原因', minWidth: 150, showOverflowTooltip: true },
  { prop: 'createdAt', label: '申请时间', width: 180, align: 'center', type: 'datetime' as const }
] as const

const fetchList = async (params: Record<string, unknown>): Promise<PageResult<AfterSale>> => {
  const res = await getAfterSaleList(params as { pageNum: number; pageSize: number })
  return res.data
}

const handleView = (row: Record<string, unknown>) => {
  currentRow.value = row as unknown as AfterSale
  detailVisible.value = true
}

const handleApprove = async (row: Record<string, unknown>) => {
  await processAfterSale({ afterSaleId: row.id as number, action: 'audit_pass', status: 1, handleRemark: '审核通过' })
}

const handleReject = async (row: Record<string, unknown>) => {
  await processAfterSale({ afterSaleId: row.id as number, action: 'audit_reject', status: 4, handleRemark: '不符合售后条件' })
}
</script>
