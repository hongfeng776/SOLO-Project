<template>
  <FinDialog
    v-model:visible="visible"
    title="状态联动锁定结果"
    width="900px"
    :hide-footer="true"
  >
    <div v-if="loading" class="skeleton-wrap">
      <div class="skeleton-header">
        <div class="skeleton-item" style="width: 60%; height: 32px; margin-bottom: 12px"></div>
        <div class="skeleton-item" style="width: 40%; height: 18px"></div>
      </div>
      <div class="skeleton-cards">
        <el-skeleton v-for="i in 3" :key="i" :rows="3" animated />
      </div>
      <div class="skeleton-table">
        <div v-for="i in 6" :key="i" class="skeleton-item"></div>
      </div>
    </div>
    <div v-else-if="lockResult && syncRecord" class="lock-container">
      <div class="profile-header">
        <div class="header-main">
          <div class="sync-code-row">
            <span class="sync-code">{{ syncRecord.syncCode }}</span>
            <el-tag
              :type="syncStatusTagType"
              effect="dark"
              size="small"
              class="status-tag"
            >
              {{ syncStatusLabel }}
            </el-tag>
          </div>
          <div class="stock-subtitle">
            <span class="stock-code">{{ syncRecord.stockCode }}</span>
            <span class="stock-name">{{ syncRecord.stockName }}</span>
          </div>
          <div class="status-transition">
            <el-tag
              :type="STOCK_PRODUCT_STATUS_TAG_TYPES[syncRecord.fromStatus as StockProductStatus] || 'info'"
              effect="light"
              size="default"
            >
              {{ STOCK_PRODUCT_STATUS_LABELS[syncRecord.fromStatus as StockProductStatus] || syncRecord.fromStatus }}
            </el-tag>
            <el-icon class="transition-arrow"><CaretRight /></el-icon>
            <el-tag
              :type="STOCK_PRODUCT_STATUS_TAG_TYPES[syncRecord.toStatus as StockProductStatus] || 'info'"
              effect="dark"
              size="default"
            >
              {{ STOCK_PRODUCT_STATUS_LABELS[syncRecord.toStatus as StockProductStatus] || syncRecord.toStatus }}
            </el-tag>
          </div>
        </div>
        <div class="header-side">
          <div class="side-item">
            <span class="side-label">变更类型</span>
            <el-tag
              :type="STOCK_STATUS_CHANGE_TYPE_TAG_TYPES[syncRecord.changeType as StockStatusChangeType] || 'info'"
              effect="dark"
              size="small"
            >
              {{ STOCK_STATUS_CHANGE_TYPE_LABELS[syncRecord.changeType as StockStatusChangeType] || syncRecord.changeType }}
            </el-tag>
          </div>
          <div class="side-item">
            <span class="side-label">生效时间</span>
            <span class="side-value">{{ formatDateTime(syncRecord.effectiveTime) }}</span>
          </div>
          <div class="side-item">
            <span class="side-label">操作人</span>
            <span class="side-value">{{ syncRecord.operatorName || '--' }}</span>
          </div>
        </div>
      </div>

      <el-alert
        :title="statusRuleText"
        :type="toStatusAlertType"
        :closable="false"
        show-icon
        style="margin-bottom: 20px"
      />

      <div class="permission-cards">
        <div class="perm-card lock-card">
          <div class="card-header">
            <el-icon class="card-icon"><Lock v-if="lockResult.tradingLocked" /><Unlock v-else /></el-icon>
            <span class="card-title">交易权限</span>
          </div>
          <div class="card-body">
            <div class="perm-status">
              <el-tag :type="lockResult.tradingLocked ? 'danger' : 'success'" effect="dark">
                {{ lockResult.tradingLocked ? '新委托禁止' : '新委托开启' }}
              </el-tag>
            </div>
            <div class="perm-stat">
              <span class="stat-label">锁定账户数</span>
              <span class="stat-value">{{ lockResult.lockedAccounts.toLocaleString() }}</span>
            </div>
          </div>
        </div>

        <div class="perm-card holding-card">
          <div class="card-header">
            <el-icon class="card-icon"><Tickets /></el-icon>
            <span class="card-title">持仓管控</span>
          </div>
          <div class="card-body">
            <div class="perm-status">
              <el-tag :type="lockResult.holdingCleared ? 'warning' : 'success'" effect="dark">
                {{ lockResult.holdingCleared ? '持仓清空' : '持仓保留' }}
              </el-tag>
            </div>
            <div class="perm-stat-row">
              <div class="perm-stat">
                <span class="stat-label">平仓数</span>
                <span class="stat-value">{{ lockResult.positionsLiquidated.toLocaleString() }}</span>
              </div>
              <div class="perm-stat">
                <span class="stat-label">涉及持仓数</span>
                <span class="stat-value">{{ syncRecord.affectedHoldings.toLocaleString() }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="perm-card order-card">
          <div class="card-header">
            <el-icon class="card-icon"><Document /></el-icon>
            <span class="card-title">订单处理</span>
          </div>
          <div class="card-body">
            <div class="perm-status">
              <el-tag type="primary" effect="dark">挂单撤销</el-tag>
            </div>
            <div class="perm-stat-row">
              <div class="perm-stat">
                <span class="stat-label">撤单数</span>
                <span class="stat-value">{{ lockResult.pendingOrdersCancelled.toLocaleString() }}</span>
              </div>
              <div class="perm-stat">
                <span class="stat-label">拒绝新单数</span>
                <span class="stat-value">{{ syncRecord.affectedOrders.toLocaleString() }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <el-alert
        type="success"
        :closable="false"
        show-icon
        style="margin: 20px 0"
      >
        <template #title>
          公告信息已推送至 <strong>{{ lockResult.clientNotificationsSent.toLocaleString() }}</strong> 个客户终端
        </template>
      </el-alert>

      <div class="push-channels">
        <div class="section-title">推送渠道统计</div>
        <el-table :data="pushChannels" border size="small">
          <el-table-column prop="channel" label="推送渠道" width="120" align="center">
            <template #default="{ row }">
              <el-tag :type="row.tagType" effect="dark" size="small">{{ row.channel }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="sentCount" label="发送数" align="right">
            <template #default="{ row }">
              {{ row.sentCount.toLocaleString() }}
            </template>
          </el-table-column>
          <el-table-column prop="readCount" label="已读数" align="right">
            <template #default="{ row }">
              {{ row.readCount.toLocaleString() }}
            </template>
          </el-table-column>
          <el-table-column prop="readRate" label="阅读率" align="right" width="120">
            <template #default="{ row }">
              <el-progress :percentage="row.readRate" :stroke-width="6" />
            </template>
          </el-table-column>
        </el-table>
      </div>

      <el-tabs v-model="activeTab" style="margin-top: 20px">
        <el-tab-pane label="权限联动详情" name="detail">
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="股票代码">
              {{ lockResult.stockCode }}
            </el-descriptions-item>
            <el-descriptions-item label="股票名称">
              {{ lockResult.stockName }}
            </el-descriptions-item>
            <el-descriptions-item label="变更前状态">
              <el-tag
                :type="STOCK_PRODUCT_STATUS_TAG_TYPES[lockResult.previousStatus as StockProductStatus] || 'info'"
                effect="light"
                size="small"
              >
                {{ STOCK_PRODUCT_STATUS_LABELS[lockResult.previousStatus as StockProductStatus] || lockResult.previousStatus }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="变更后状态">
              <el-tag
                :type="STOCK_PRODUCT_STATUS_TAG_TYPES[lockResult.newStatus as StockProductStatus] || 'info'"
                effect="dark"
                size="small"
              >
                {{ STOCK_PRODUCT_STATUS_LABELS[lockResult.newStatus as StockProductStatus] || lockResult.newStatus }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="交易锁定">
              <el-tag :type="lockResult.tradingLocked ? 'danger' : 'success'" effect="dark" size="small">
                {{ lockResult.tradingLocked ? '已锁定' : '未锁定' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="持仓清空">
              <el-tag :type="lockResult.holdingCleared ? 'warning' : 'success'" effect="dark" size="small">
                {{ lockResult.holdingCleared ? '已清空' : '保留' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="锁定账户数">
              {{ lockResult.lockedAccounts.toLocaleString() }}
            </el-descriptions-item>
            <el-descriptions-item label="撤销挂单数">
              {{ lockResult.pendingOrdersCancelled.toLocaleString() }}
            </el-descriptions-item>
            <el-descriptions-item label="平仓数">
              {{ lockResult.positionsLiquidated.toLocaleString() }}
            </el-descriptions-item>
            <el-descriptions-item label="通知客户数">
              {{ lockResult.affectedCustomerCount.toLocaleString() }}
            </el-descriptions-item>
            <el-descriptions-item label="推送终端数">
              {{ lockResult.clientNotificationsSent.toLocaleString() }}
            </el-descriptions-item>
            <el-descriptions-item label="同步状态">
              <el-tag :type="syncStatusTagType" effect="dark" size="small">
                {{ syncStatusLabel }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="同步说明" :span="2">
              {{ lockResult.syncMessage || '--' }}
            </el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>

        <el-tab-pane label="受影响客户列表" name="customers">
          <el-alert
            title="以下为受影响客户样例列表，完整清单请通过数据导出功能获取"
            type="info"
            :closable="false"
            show-icon
            style="margin-bottom: 16px"
          />
          <el-table :data="affectedCustomers" border size="small" max-height="360">
            <el-table-column prop="customerCode" label="客户编码" width="120" align="center" />
            <el-table-column prop="customerName" label="客户姓名" width="120" />
            <el-table-column prop="customerType" label="客户类型" width="100" align="center">
              <template #default="{ row }">
                <el-tag size="small" :type="row.customerType === 'institution' ? 'primary' : 'success'">
                  {{ row.customerType === 'institution' ? '机构' : '个人' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="holdingQty" label="持仓数量" align="right">
              <template #default="{ row }">
                {{ row.holdingQty.toLocaleString() }}
              </template>
            </el-table-column>
            <el-table-column prop="pendingOrders" label="挂单数" align="right">
              <template #default="{ row }">
                {{ row.pendingOrders }}
              </template>
            </el-table-column>
            <el-table-column prop="actionTaken" label="管控措施" width="140" align="center">
              <template #default="{ row }">
                <el-tag :type="row.actionType" size="small">{{ row.actionTaken }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="notified" label="通知状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.notified ? 'success' : 'warning'" size="small">
                  {{ row.notified ? '已通知' : '待通知' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </div>
  </FinDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  Loading,
  Lock,
  Unlock,
  CircleCheck,
  Warning,
  CaretRight,
  Tickets,
  Document,
} from '@element-plus/icons-vue'
import FinDialog from '@/components/common/FinDialog.vue'
import {
  STOCK_PRODUCT_STATUS_LABELS,
  STOCK_PRODUCT_STATUS_TAG_TYPES,
  STOCK_STATUS_CHANGE_TYPE_LABELS,
  STOCK_STATUS_CHANGE_TYPE_TAG_TYPES,
} from '@/constants/dictionaries'
import { StockProductStatus, StockStatusChangeType } from '@/enums'
import * as statusSyncApi from '@/api/stockStatusSync'
import type { IStockStatusLockResult, IStockStatusSyncRecord } from '@/types/api'
import { formatDateTime } from '@/utils/format'

interface Props {
  visible: boolean
  syncRecordId: number | null
}

const props = withDefaults(defineProps<Props>(), {
  syncRecordId: null,
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'refresh': []
}>()

const visible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
})

const loading = ref(false)
const activeTab = ref('detail')
const lockResult = ref<IStockStatusLockResult | null>(null)
const syncRecord = ref<IStockStatusSyncRecord | null>(null)

const syncStatusTagType = computed(() => {
  const status = lockResult.value?.syncStatus
  if (status === 'success') return 'success'
  if (status === 'partial') return 'warning'
  if (status === 'failed') return 'danger'
  return 'info'
})

const syncStatusLabel = computed(() => {
  const status = lockResult.value?.syncStatus
  if (status === 'success') return '全部成功'
  if (status === 'partial') return '部分成功'
  if (status === 'failed') return '同步失败'
  return '--'
})

const toStatusAlertType = computed(() => {
  const toStatus = syncRecord.value?.toStatus
  if (toStatus === StockProductStatus.SUSPENDED) return 'warning'
  if (toStatus === StockProductStatus.DELISTED) return 'error'
  if (toStatus === StockProductStatus.NORMAL) return 'success'
  return 'info'
})

const statusRuleText = computed(() => {
  const toStatus = syncRecord.value?.toStatus
  if (toStatus === StockProductStatus.SUSPENDED) return '停牌产品已禁止新开委托'
  if (toStatus === StockProductStatus.DELISTED) return '退市产品已清空持仓管控权限'
  if (toStatus === StockProductStatus.NORMAL) return '复牌产品已恢复全部交易权限'
  return '产品状态变更联动处理已完成'
})

const pushChannels = computed(() => [
  { channel: 'APP', sentCount: Math.floor((lockResult.value?.clientNotificationsSent || 0) * 0.45), readCount: Math.floor((lockResult.value?.clientNotificationsSent || 0) * 0.45 * 0.72), readRate: 72, tagType: 'primary' },
  { channel: 'PC', sentCount: Math.floor((lockResult.value?.clientNotificationsSent || 0) * 0.3), readCount: Math.floor((lockResult.value?.clientNotificationsSent || 0) * 0.3 * 0.85), readRate: 85, tagType: 'success' },
  { channel: 'SMS', sentCount: Math.floor((lockResult.value?.clientNotificationsSent || 0) * 0.15), readCount: Math.floor((lockResult.value?.clientNotificationsSent || 0) * 0.15 * 0.6), readRate: 60, tagType: 'warning' },
  { channel: 'Email', sentCount: Math.floor((lockResult.value?.clientNotificationsSent || 0) * 0.1), readCount: Math.floor((lockResult.value?.clientNotificationsSent || 0) * 0.1 * 0.45), readRate: 45, tagType: 'info' },
])

const affectedCustomers = computed(() => {
  const base = [
    { customerCode: 'C20240001', customerName: '张伟', customerType: 'individual', holdingQty: 12500, pendingOrders: 2, actionTaken: '禁止新委托+保留持仓', actionType: 'warning' as const, notified: true },
    { customerCode: 'C20240002', customerName: '李娜', customerType: 'individual', holdingQty: 8000, pendingOrders: 1, actionTaken: '禁止新委托+保留持仓', actionType: 'warning' as const, notified: true },
    { customerCode: 'C20240003', customerName: '盛远投资', customerType: 'institution', holdingQty: 250000, pendingOrders: 5, actionTaken: '挂单撤销+持仓保留', actionType: 'primary' as const, notified: true },
    { customerCode: 'C20240004', customerName: '王强', customerType: 'individual', holdingQty: 3200, pendingOrders: 0, actionTaken: '禁止新委托+保留持仓', actionType: 'warning' as const, notified: true },
    { customerCode: 'C20240005', customerName: '恒信基金', customerType: 'institution', holdingQty: 580000, pendingOrders: 8, actionTaken: '挂单撤销+强制平仓', actionType: 'danger' as const, notified: true },
    { customerCode: 'C20240006', customerName: '刘洋', customerType: 'individual', holdingQty: 1500, pendingOrders: 0, actionTaken: '禁止新委托+保留持仓', actionType: 'warning' as const, notified: false },
    { customerCode: 'C20240007', customerName: '陈明', customerType: 'individual', holdingQty: 6500, pendingOrders: 1, actionTaken: '挂单撤销+持仓保留', actionType: 'primary' as const, notified: true },
    { customerCode: 'C20240008', customerName: '慧资资产', customerType: 'institution', holdingQty: 120000, pendingOrders: 3, actionTaken: '挂单撤销+持仓保留', actionType: 'primary' as const, notified: true },
  ]
  return base
})

async function fetchData() {
  if (!props.syncRecordId) return
  loading.value = true
  try {
    const recordRes = await statusSyncApi.getSyncRecordById(props.syncRecordId)
    if (recordRes.code === 0) {
      syncRecord.value = recordRes.data
      const lockRes = await statusSyncApi.getLockResult(recordRes.data.syncCode)
      if (lockRes.code === 0) {
        lockResult.value = lockRes.data
      }
    }
  } finally {
    loading.value = false
  }
}

watch(
  () => [props.visible, props.syncRecordId],
  ([visibleVal, id]) => {
    if (visibleVal && id) {
      activeTab.value = 'detail'
      fetchData()
    }
  },
)
</script>

<style lang="scss" scoped>
.skeleton-wrap {
  padding: 8px 0;

  .skeleton-header {
    padding: 20px 24px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 8px;
    margin-bottom: 20px;
  }

  .skeleton-cards {
    display: flex;
    gap: 16px;
    margin-bottom: 20px;

    :deep(.el-skeleton) {
      flex: 1;
      padding: 16px;
      border: 1px solid #e4e9f2;
      border-radius: 8px;
    }
  }

  .skeleton-table {
    border: 1px solid #e4e9f2;
    border-radius: 8px;
    padding: 16px 20px;
  }

  .skeleton-item {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: skeletonShimmer 1.5s infinite;
    border-radius: 4px;
    height: 20px;
    margin: 8px 0;
  }
}

@keyframes skeletonShimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.lock-container {
  .profile-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 20px 24px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 8px;
    margin-bottom: 20px;

    .header-main {
      .sync-code-row {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 8px;

        .sync-code {
          font-family: 'Consolas', 'Monaco', monospace;
          font-size: 28px;
          font-weight: 700;
          color: #fff;
          letter-spacing: 2px;
        }

        .status-tag {
          font-size: 12px;
        }
      }

      .stock-subtitle {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;

        .stock-code {
          font-family: 'Consolas', 'Monaco', monospace;
          font-size: 16px;
          color: rgba(255, 255, 255, 0.95);
          font-weight: 600;
        }

        .stock-name {
          font-size: 16px;
          color: rgba(255, 255, 255, 0.9);
          font-weight: 500;
        }
      }

      .status-transition {
        display: flex;
        align-items: center;
        gap: 10px;

        .transition-arrow {
          color: rgba(255, 255, 255, 0.9);
          font-size: 18px;
        }
      }
    }

    .header-side {
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-width: 200px;

      .side-item {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 10px;

        .side-label {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.75);
        }

        .side-value {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.95);
          font-weight: 500;
        }
      }
    }
  }

  .permission-cards {
    display: flex;
    gap: 16px;

    .perm-card {
      flex: 1;
      border: 1px solid #e4e9f2;
      border-radius: 8px;
      overflow: hidden;
      transition: all 0.3s ease;

      &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
      }

      .card-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 16px;

        .card-icon {
          font-size: 20px;
        }

        .card-title {
          font-size: 14px;
          font-weight: 600;
        }
      }

      .card-body {
        padding: 16px;
        background: #fff;
        border-top: 1px solid #f0f2f5;

        .perm-status {
          margin-bottom: 16px;
        }

        .perm-stat-row {
          display: flex;
          gap: 16px;
        }

        .perm-stat {
          flex: 1;
          text-align: center;
          padding: 8px;
          background: #fafbfc;
          border-radius: 6px;

          .stat-label {
            display: block;
            font-size: 12px;
            color: #909399;
            margin-bottom: 4px;
          }

          .stat-value {
            display: block;
            font-size: 20px;
            font-weight: 700;
            color: #303133;
          }
        }
      }

      &.lock-card {
        .card-header {
          background: rgba(245, 108, 108, 0.1);
          color: #f56c6c;
        }

        .perm-stat .stat-value {
          color: #f56c6c;
        }
      }

      &.holding-card {
        .card-header {
          background: rgba(230, 162, 60, 0.1);
          color: #e6a23c;
        }

        .perm-stat .stat-value {
          color: #e6a23c;
        }
      }

      &.order-card {
        .card-header {
          background: rgba(64, 158, 255, 0.1);
          color: #409eff;
        }

        .perm-stat .stat-value {
          color: #409eff;
        }
      }
    }
  }

  .push-channels {
    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: #303133;
      margin-bottom: 12px;
      padding-left: 8px;
      border-left: 3px solid #409eff;
    }
  }
}
</style>
