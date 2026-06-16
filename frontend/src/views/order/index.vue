<template>
  <div class="page-container">
    <ProTable
      :columns="tableColumns"
      :search-columns="searchColumns"
      :request="fetchOrderList"
      :show-add="false"
      :show-batch-delete="false"
      :show-delete="false"
      @edit="handleView"
    >
      <template #status="{ row }">
        <el-tag :type="OrderStatusMap[row.status]?.type">
          {{ OrderStatusMap[row.status]?.label }}
        </el-tag>
      </template>
      <template #logistics="{ row }">
        <el-tag :type="LogisticsStatusMap[row.logisticsStatus]?.type">
          {{ LogisticsStatusMap[row.logisticsStatus]?.label }}
        </el-tag>
      </template>
      <template #actions="{ row }">
        <el-button link type="primary" @click="handleView(row)">查看</el-button>
        <el-button link type="primary" @click="handleShip(row)" v-if="row.status === 2">发货</el-button>
        <el-button link type="danger" @click="handleRefund(row)" v-if="row.status === 2 || row.status === 3">退款</el-button>
      </template>
    </ProTable>

    <el-dialog v-model="detailVisible" title="订单详情" width="800px">
      <el-descriptions :column="2" border v-if="currentOrder">
        <el-descriptions-item label="订单号">{{ currentOrder.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="订单状态">
          <el-tag :type="OrderStatusMap[currentOrder.status]?.type">
            {{ OrderStatusMap[currentOrder.status]?.label }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="下单用户">{{ currentOrder.username }}</el-descriptions-item>
        <el-descriptions-item label="所属商家">{{ currentOrder.merchantName }}</el-descriptions-item>
        <el-descriptions-item label="商品金额">
          <span class="amount-text">{{ formatAmount(currentOrder.totalAmount) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="实付金额">
          <span class="amount-text">{{ formatAmount(currentOrder.payAmount) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="收货人">{{ currentOrder.receiverName }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ currentOrder.receiverPhone }}</el-descriptions-item>
        <el-descriptions-item label="收货地址" :span="2">{{ currentOrder.receiverAddress }}</el-descriptions-item>
        <el-descriptions-item label="下单时间">{{ formatDateTime(currentOrder.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="支付时间">{{ formatDateTime(currentOrder.payTime!) }}</el-descriptions-item>
      </el-descriptions>

      <el-divider>商品信息</el-divider>
      <el-table :data="currentOrder?.items || []" stripe>
        <el-table-column label="商品图片" width="80" align="center">
          <template #default="{ row }">
            <el-image :src="row.goodsImage" fit="cover" style="width: 48px; height: 48px; border-radius: 4px;" />
          </template>
        </el-table-column>
        <el-table-column prop="goodsName" label="商品名称" show-overflow-tooltip />
        <el-table-column prop="specInfo" label="规格" width="120" />
        <el-table-column label="单价" width="100" align="right">
          <template #default="{ row }">
            <span class="amount-text">{{ formatAmount(row.price) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="quantity" label="数量" width="80" align="center" />
        <el-table-column label="小计" width="120" align="right">
          <template #default="{ row }">
            <span class="amount-text">{{ formatAmount(row.subtotal) }}</span>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ProTable from '@/components/ProTable/index.vue'
import { OrderStatusMap, LogisticsStatusMap } from '@/types/business'
import { getOrderList, type Order } from '@/api/order'
import { formatAmount } from '@/utils/amount'
import { formatDateTime } from '@/utils/date'
import type { PageResult } from '@/types/api'

const detailVisible = ref(false)
const currentOrder = ref<Order | null>(null)

const searchColumns = [
  { prop: 'orderNo', label: '订单编号', type: 'input' as const },
  { prop: 'status', label: '订单状态', type: 'select' as const, options: [
    { label: '全部', value: '' },
    { label: '待付款', value: 1 },
    { label: '已付款', value: 2 },
    { label: '已发货', value: 3 },
    { label: '已完成', value: 4 },
    { label: '已取消', value: 5 }
  ]},
  { prop: 'daterange', label: '下单时间', type: 'daterange' as const }
] as const

const tableColumns = [
  { prop: 'orderNo', label: '订单编号', minWidth: 180 },
  { prop: 'username', label: '下单用户', width: 120 },
  { prop: 'totalAmount', label: '订单金额', width: 120, align: 'right', type: 'amount' as const },
  { prop: 'status', label: '订单状态', width: 100, align: 'center', slot: 'status' },
  { prop: 'logisticsStatus', label: '物流状态', width: 100, align: 'center', slot: 'logistics' },
  { prop: 'createdAt', label: '下单时间', width: 180, align: 'center', type: 'datetime' as const }
] as const

const fetchOrderList = async (params: Record<string, unknown>): Promise<PageResult<Order>> => {
  const res = await getOrderList(params as { pageNum: number; pageSize: number })
  return res.data
}

const handleView = (row: Record<string, unknown>) => {
  currentOrder.value = row as unknown as Order
  detailVisible.value = true
}

const handleShip = (_row: Record<string, unknown>) => {}
const handleRefund = (_row: Record<string, unknown>) => {}
</script>
