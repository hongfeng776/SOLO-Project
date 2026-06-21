<template>
  <FinDialog
    v-model:visible="visible"
    title="产品档案详情"
    width="960px"
    :hide-footer="true"
  >
    <div v-if="loading" class="loading-wrap">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>加载中...</span>
    </div>
    <div v-else-if="productData" class="profile-container">
      <div class="profile-header">
        <div class="product-code-section">
          <span class="code-label">产品唯一编码</span>
          <span class="code-value">{{ productData.productCode }}</span>
          <el-tag
            :type="STOCK_PRODUCT_STATUS_TAG_TYPES[productData.productStatus as StockProductStatus] || 'info'"
            effect="dark"
            size="small"
          >
            {{ STOCK_PRODUCT_STATUS_LABELS[productData.productStatus as StockProductStatus] || productData.productStatus }}
          </el-tag>
        </div>
        <div class="status-change-section">
          <span class="change-label">变更产品状态：</span>
          <el-dropdown trigger="click" @command="handleStatusChange">
            <el-button
              type="primary"
              size="small"
              class="ripple-btn"
              :class="{ 'ripple-active': rippleActive }"
              @click="rippleActive = true"
            >
              {{ STOCK_PRODUCT_STATUS_LABELS[productData.productStatus as StockProductStatus] || '当前状态' }}
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-for="(label, value) in STOCK_PRODUCT_STATUS_LABELS"
                  :key="value"
                  :command="value"
                  :disabled="value === productData.productStatus"
                >
                  <el-tag
                    :type="STOCK_PRODUCT_STATUS_TAG_TYPES[value as StockProductStatus]"
                    effect="light"
                    size="small"
                    style="margin-right: 8px"
                  >
                    {{ label }}
                  </el-tag>
                  {{ value === productData.productStatus ? '（当前）' : '' }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>

      <el-tabs v-model="activeTab">
        <el-tab-pane label="基本信息" name="basic">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="产品编码">
              <span class="code-text">{{ productData.productCode }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="股票代码">
              <span class="code-text">{{ productData.stockCode }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="股票名称">
              {{ productData.stockName }}
            </el-descriptions-item>
            <el-descriptions-item label="产品类型">
              <el-tag
                :color="STOCK_PRODUCT_TYPE_COLORS[productData.productType as StockProductType]"
                effect="dark"
                size="small"
              >
                {{ STOCK_PRODUCT_TYPE_LABELS[productData.productType as StockProductType] || productData.productType }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="市场">
              {{ MARKET_LABELS[productData.market as MarketType] || productData.market }}
            </el-descriptions-item>
            <el-descriptions-item label="板块">
              <el-tag
                v-if="productData.sector"
                size="small"
                effect="plain"
                :style="{ borderColor: `${SECTOR_COLORS[productData.sector] || '#909399'}50`, color: SECTOR_COLORS[productData.sector] || '#909399' }"
              >
                {{ productData.sector }}
              </el-tag>
              <span v-else>--</span>
            </el-descriptions-item>
            <el-descriptions-item label="板块类型">
              {{ productData.board || '--' }}
            </el-descriptions-item>
            <el-descriptions-item label="产品状态">
              <el-tag
                :type="STOCK_PRODUCT_STATUS_TAG_TYPES[productData.productStatus as StockProductStatus] || 'info'"
                effect="light"
              >
                {{ STOCK_PRODUCT_STATUS_LABELS[productData.productStatus as StockProductStatus] || productData.productStatus }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="建档状态">
              <el-tag
                :type="(STOCK_PRODUCT_ARCHIVE_STATUS_COLORS[productData.archiveStatus as StockProductArchiveStatus] as any) || 'info'"
                effect="light"
              >
                {{ STOCK_PRODUCT_ARCHIVE_STATUS_LABELS[productData.archiveStatus as StockProductArchiveStatus] || productData.archiveStatus }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="备案状态">
              <el-tag
                :type="(STOCK_PRODUCT_FILING_STATUS_COLORS[productData.filingStatus as StockProductFilingStatus] as any) || 'info'"
                effect="light"
              >
                {{ STOCK_PRODUCT_FILING_STATUS_LABELS[productData.filingStatus as StockProductFilingStatus] || productData.filingStatus }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="上市日期">
              {{ productData.listingDate || '--' }}
            </el-descriptions-item>
            <el-descriptions-item label="面值">
              {{ formatMoney(productData.faceValue, 2, '') }}
            </el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>

        <el-tab-pane label="板块&交易规则" name="rules">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="所属板块">
              <el-tag
                v-if="productData.sector"
                size="small"
                effect="plain"
                :style="{ borderColor: `${SECTOR_COLORS[productData.sector] || '#909399'}50`, color: SECTOR_COLORS[productData.sector] || '#909399' }"
              >
                {{ productData.sector }}
              </el-tag>
              <span v-else>--</span>
            </el-descriptions-item>
            <el-descriptions-item label="板块类型">
              {{ productData.board || '--' }}
            </el-descriptions-item>
            <el-descriptions-item label="交易规则">
              <el-tag type="primary" effect="light">{{ productData.tradingRule || '--' }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="结算规则">
              {{ productData.settlementRule || '--' }}
            </el-descriptions-item>
            <el-descriptions-item label="费率标准">
              <span class="fee-highlight">{{ productData.feeStandard || '--' }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="最小交易单位">
              {{ productData.minTradeUnit || '--' }} 股
            </el-descriptions-item>
            <el-descriptions-item label="涨跌停限制">
              {{ productData.priceLimit ? `${productData.priceLimit}%` : '--' }}
            </el-descriptions-item>
            <el-descriptions-item label="最小价格变动">
              {{ productData.tickSize || '--' }}
            </el-descriptions-item>
          </el-descriptions>

          <div class="linked-info">
            <h4>联动绑定信息</h4>
            <el-alert
              title="产品编码已自动关联板块交易规则与费率标准，状态变更将同步更新行情与交易系统数据"
              type="info"
              :closable="false"
              show-icon
            />
          </div>
        </el-tab-pane>

        <el-tab-pane label="备案信息" name="filing">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="备案编号">
              <span class="code-text">{{ productData.filingNo || '--' }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="备案日期">
              {{ productData.filingDate || '--' }}
            </el-descriptions-item>
            <el-descriptions-item label="备案机构">
              {{ productData.filingInstitution || '--' }}
            </el-descriptions-item>
            <el-descriptions-item label="交易所代码">
              <span class="code-text">{{ productData.exchangeCode || '--' }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="备案状态">
              <el-tag
                :type="(STOCK_PRODUCT_FILING_STATUS_COLORS[productData.filingStatus as StockProductFilingStatus] as any) || 'info'"
                effect="light"
              >
                {{ STOCK_PRODUCT_FILING_STATUS_LABELS[productData.filingStatus as StockProductFilingStatus] || productData.filingStatus }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="建档状态">
              <el-tag
                :type="(STOCK_PRODUCT_ARCHIVE_STATUS_COLORS[productData.archiveStatus as StockProductArchiveStatus] as any) || 'info'"
                effect="light"
              >
                {{ STOCK_PRODUCT_ARCHIVE_STATUS_LABELS[productData.archiveStatus as StockProductArchiveStatus] || productData.archiveStatus }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>

        <el-tab-pane label="股本信息" name="shares">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="面值">
              {{ formatMoney(productData.faceValue, 2, '') }}
            </el-descriptions-item>
            <el-descriptions-item label="总股本">
              {{ formatVolume(productData.totalShares) }}
            </el-descriptions-item>
            <el-descriptions-item label="流通股本">
              {{ formatVolume(productData.circulatingShares) }}
            </el-descriptions-item>
            <el-descriptions-item label="上市日期">
              {{ productData.listingDate || '--' }}
            </el-descriptions-item>
            <el-descriptions-item v-if="productData.suspendDate" label="停牌日期">
              {{ productData.suspendDate }}
            </el-descriptions-item>
            <el-descriptions-item v-if="productData.resumeDate" label="复牌日期">
              {{ productData.resumeDate }}
            </el-descriptions-item>
            <el-descriptions-item v-if="productData.delistingDate" label="退市日期">
              {{ productData.delistingDate }}
            </el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>
      </el-tabs>
    </div>
  </FinDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Loading, ArrowDown } from '@element-plus/icons-vue'
import FinDialog from '@/components/common/FinDialog.vue'
import * as stockProductApi from '@/api/stockProduct'
import { formatMoney, formatVolume } from '@/utils/format'
import {
  MARKET_LABELS,
  STOCK_PRODUCT_TYPE_LABELS,
  STOCK_PRODUCT_TYPE_COLORS,
  STOCK_PRODUCT_STATUS_LABELS,
  STOCK_PRODUCT_STATUS_TAG_TYPES,
  STOCK_PRODUCT_ARCHIVE_STATUS_LABELS,
  STOCK_PRODUCT_ARCHIVE_STATUS_COLORS,
  STOCK_PRODUCT_FILING_STATUS_LABELS,
  STOCK_PRODUCT_FILING_STATUS_COLORS,
  SECTOR_COLORS,
} from '@/constants/dictionaries'
import { StockProductStatus, StockProductArchiveStatus, StockProductFilingStatus, StockProductType, MarketType } from '@/enums'
import type { IStockProduct } from '@/types/api'

interface Props {
  visible: boolean
  productId: number | null
}

const props = withDefaults(defineProps<Props>(), {
  productId: null,
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
const activeTab = ref('basic')
const productData = ref<IStockProduct | null>(null)
const rippleActive = ref(false)

async function fetchData() {
  if (!props.productId) return
  loading.value = true
  try {
    const res = await stockProductApi.getById(props.productId)
    if (res.code === 0) {
      productData.value = res.data
    }
  } finally {
    loading.value = false
  }
}

async function handleStatusChange(status: string) {
  if (!productData.value || status === productData.value.productStatus) return

  const statusLabel = STOCK_PRODUCT_STATUS_LABELS[status as StockProductStatus]
  try {
    await ElMessageBox.confirm(
      `确定将产品状态变更为"${statusLabel}"吗？状态变更将同步更新行情与交易系统数据。`,
      '状态变更确认',
      { type: 'warning' },
    )
    const res = await stockProductApi.updateStatus(productData.value.id, status)
    if (res.code === 0) {
      ElMessage.success(`产品状态已变更为"${statusLabel}"，行情与交易系统数据已同步更新`)
      productData.value = { ...productData.value, productStatus: status }
      emit('refresh')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('状态变更失败')
    }
  }
}

watch(
  () => [props.visible, props.productId],
  ([visibleVal, id]) => {
    if (visibleVal && id) {
      activeTab.value = 'basic'
      fetchData()
    }
  },
)
</script>

<style lang="scss" scoped>
.loading-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 300px;
  gap: 8px;
  color: #909399;
}

.profile-container {
  .profile-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    background: linear-gradient(135deg, #f0f7ff 0%, #f5f0ff 100%);
    border-radius: 8px;
    margin-bottom: 20px;
    border: 1px solid #e4e9f2;

    .product-code-section {
      display: flex;
      align-items: center;
      gap: 12px;

      .code-label {
        font-size: 13px;
        color: #909399;
        font-weight: 500;
      }

      .code-value {
        font-family: 'Consolas', 'Monaco', monospace;
        font-size: 20px;
        font-weight: 700;
        color: #409EFF;
        letter-spacing: 1px;
      }
    }

    .status-change-section {
      display: flex;
      align-items: center;
      gap: 8px;

      .change-label {
        font-size: 13px;
        color: #606266;
        font-weight: 500;
      }
    }
  }

  .code-text {
    font-family: monospace;
    color: #409eff;
  }

  .fee-highlight {
    font-weight: 600;
    color: #E6A23C;
  }

  .linked-info {
    margin-top: 20px;

    h4 {
      margin-bottom: 8px;
      font-size: 14px;
      color: #303133;
    }
  }
}

.ripple-btn {
  &.ripple-active {
    animation: ripple 0.6s ease-out;
  }
}

@keyframes ripple {
  0% {
    box-shadow: 0 0 0 0 rgba(64, 158, 255, 0.4);
  }
  100% {
    box-shadow: 0 0 0 12px rgba(64, 158, 255, 0);
  }
}
</style>
