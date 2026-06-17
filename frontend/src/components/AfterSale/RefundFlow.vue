<template>
  <div class="refund-flow">
    <h4 class="flow-title">
      <el-icon><Money /></el-icon>
      退款流水
    </h4>
    <el-table
      v-if="flowList && flowList.length > 0"
      :data="flowList"
      size="small"
      border
      stripe
    >
      <el-table-column prop="flowNo" label="退款流水号" min-width="180">
        <template #default="{ row }">
          <el-tooltip :content="row.flowNo" placement="top">
            <span class="flow-no">{{ row.flowNo }}</span>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column label="退款渠道" width="120">
        <template #default="{ row }">
          <el-icon style="vertical-align: middle; margin-right: 4px;">
            <component :is="getChannelIcon(row.channel)" />
          </el-icon>
          {{ getChannelLabel(row.channel) }}
        </template>
      </el-table-column>
      <el-table-column label="退款金额" width="120">
        <template #default="{ row }">
          <span class="refund-amount">-¥{{ formatAmount(row.amount) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag
            :style="{ background: getStatusColor(row.status), borderColor: getStatusColor(row.status) }"
            effect="dark"
            size="small"
          >
            {{ getStatusLabel(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="180" />
      <el-table-column prop="completeTime" label="完成时间" width="180">
        <template #default="{ row }">
          {{ row.completeTime || '-' }}
        </template>
      </el-table-column>
    </el-table>
    <el-empty v-else description="暂无退款流水" :image-size="80" />
  </div>
</template>

<script setup>
import { Money, ChatDotRound, Aim, CreditCard, Wallet } from '@element-plus/icons-vue'
import {
  RefundChannelEnum,
  RefundFlowStatusEnum,
  getEnumLabel,
  getEnumColor
} from '@/utils/enums'
import { formatAmount } from '@/utils/payment'

defineProps({
  flowList: {
    type: Array,
    default: () => []
  }
})

const getChannelLabel = (val) => getEnumLabel(RefundChannelEnum, val)
const getStatusLabel = (val) => getEnumLabel(RefundFlowStatusEnum, val)
const getStatusColor = (val) => getEnumColor(RefundFlowStatusEnum, val)

const getChannelIcon = (val) => {
  const iconMap = { wechat: ChatDotRound, alipay: Aim, unionpay: CreditCard, credit_card: CreditCard, balance: Wallet }
  return iconMap[val] || Wallet
}
</script>

<style lang="scss" scoped>
.refund-flow {
  .flow-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 15px;
    font-weight: 600;
    color: #303133;
    margin: 0 0 16px 0;
    padding-left: 8px;
    border-left: 3px solid #f56c6c;
  }

  :deep(.el-table) {
    .flow-no {
      font-weight: 500;
      color: #303133;
    }

    .refund-amount {
      color: #67c23a;
      font-weight: 600;
    }
  }
}
</style>
