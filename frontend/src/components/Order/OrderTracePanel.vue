<template>
  <div class="order-trace-panel">
    <div class="search-section">
      <div class="search-input-wrapper">
        <el-select
          v-model="searchType"
          class="search-type-select"
          placeholder="请选择检索类型"
        >
          <el-option
            v-for="type in searchTypes"
            :key="type.value"
            :label="type.label"
            :value="type.value"
          />
        </el-select>
        <el-input
          v-model="searchKeyword"
          :placeholder="getPlaceholder()"
          class="input-glow-focus search-input"
          @keyup.enter="handleSearch"
          @clear="handleClear"
          clearable
        >
          <template #prepend>
            <el-icon><Search /></el-icon>
          </template>
          <template #append>
            <el-button :loading="loading" @click="handleSearch">检索</el-button>
          </template>
        </el-input>
      </div>
      <div v-if="errorTip" class="error-tip">
        <el-icon><Warning /></el-icon>
        <span>{{ errorTip }}</span>
      </div>
    </div>

    <div v-if="loading" class="loading-section">
      <SkeletonLoader
        :rows="8"
        :row-height="24"
        :widths="['100%', '85%', '95%', '75%', '100%', '90%', '80%', '95%']"
      />
    </div>

    <div v-else-if="traceResults.length > 0" class="results-section">
      <div class="results-header">
        <span class="results-count">共找到 <em>{{ traceResults.length }}</em> 条相关订单</span>
      </div>
      <div class="trace-results">
        <div
          v-for="order in traceResults"
          :key="order.id"
          class="trace-item"
        >
          <div class="trace-item-header">
            <div class="order-basic">
              <el-tooltip :content="order.orderNo" placement="top">
                <span class="order-no">{{ order.orderNo }}</span>
              </el-tooltip>
              <el-tag
                :style="{ background: getEnumColor(OrderStatusEnum, order.status), borderColor: getEnumColor(OrderStatusEnum, order.status) }"
                effect="dark"
                size="small"
              >
                {{ getEnumLabel(OrderStatusEnum, order.status) }}
              </el-tag>
              <span class="order-amount">¥{{ order.amount }}</span>
            </div>
            <div class="order-time">{{ order.createTime }}</div>
          </div>

          <div class="trace-timeline">
            <el-steps :active="getCompletedStep(order)" finish-status="success" class="trace-steps">
              <el-step title="创建订单">
                <template #icon>
                  <div :class="{ 'data-gap-marker': !order.timeline.create }">
                    <el-icon v-if="order.timeline.create"><CircleCheckFilled /></el-icon>
                    <el-tooltip v-else content="数据断层：订单创建信息缺失" placement="top">
                      <el-icon class="warning-icon"><WarningFilled /></el-icon>
                    </el-tooltip>
                  </div>
                </template>
                <template #description>
                  <span v-if="order.timeline.create">{{ order.timeline.create.time }}</span>
                  <span v-else class="gap-text">数据缺失</span>
                </template>
              </el-step>

              <el-step title="支付完成">
                <template #icon>
                  <div :class="{ 'data-gap-marker': !order.timeline.pay }">
                    <el-icon v-if="order.timeline.pay"><CircleCheckFilled /></el-icon>
                    <el-tooltip v-else content="数据断层：支付信息缺失" placement="top">
                      <el-icon class="warning-icon"><WarningFilled /></el-icon>
                    </el-tooltip>
                  </div>
                </template>
                <template #description>
                  <span v-if="order.timeline.pay">{{ order.timeline.pay.time }}</span>
                  <span v-else class="gap-text">数据缺失</span>
                </template>
              </el-step>

              <el-step title="履约完成">
                <template #icon>
                  <div :class="{ 'data-gap-marker': !order.timeline.fulfill }">
                    <el-icon v-if="order.timeline.fulfill"><CircleCheckFilled /></el-icon>
                    <el-tooltip v-else content="数据断层：履约信息缺失" placement="top">
                      <el-icon class="warning-icon"><WarningFilled /></el-icon>
                    </el-tooltip>
                  </div>
                </template>
                <template #description>
                  <span v-if="order.timeline.fulfill">{{ order.timeline.fulfill.time }}</span>
                  <span v-else class="gap-text">数据缺失</span>
                </template>
              </el-step>

              <el-step title="售后完成">
                <template #icon>
                  <div :class="{ 'data-gap-marker': order.needAfterSale && !order.timeline.afterSale }">
                    <el-icon v-if="order.timeline.afterSale"><CircleCheckFilled /></el-icon>
                    <el-icon v-else-if="!order.needAfterSale"><CircleCloseFilled /></el-icon>
                    <el-tooltip v-else content="数据断层：售后信息缺失" placement="top">
                      <el-icon class="warning-icon"><WarningFilled /></el-icon>
                    </el-tooltip>
                  </div>
                </template>
                <template #description>
                  <span v-if="order.timeline.afterSale">{{ order.timeline.afterSale.time }}</span>
                  <span v-else-if="!order.needAfterSale">无需售后</span>
                  <span v-else class="gap-text">数据缺失</span>
                </template>
              </el-step>
            </el-steps>
          </div>

          <div class="trace-item-footer">
            <el-tooltip :content="order.productName" placement="top">
              <span class="product-name">{{ order.productName }}</span>
            </el-tooltip>
            <span class="buyer-info">{{ order.buyer }} ({{ order.phone }})</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="hasSearched" class="empty-section">
      <el-empty description="未找到相关订单，请检查检索条件" />
    </div>

    <div v-else class="initial-section">
      <el-empty description="请输入关键词进行订单溯源" :image-size="80" />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Search,
  Warning,
  CircleCheckFilled,
  WarningFilled,
  CircleCloseFilled
} from '@element-plus/icons-vue'
import { traceOrder } from '@/api/order'
import {
  OrderStatusEnum,
  TravelCategoryEnum,
  getEnumLabel,
  getEnumType,
  getEnumColor
} from '@/utils/enums'
import SkeletonLoader from '@/components/Common/SkeletonLoader.vue'

const emit = defineEmits(['close'])

const searchType = ref('orderNo')
const searchKeyword = ref('')
const loading = ref(false)
const errorTip = ref('')
const hasSearched = ref(false)
const traceResults = ref([])
const lastRequestTime = ref(0)

const searchTypes = [
  { value: 'orderNo', label: '订单编号' },
  { value: 'phone', label: '用户手机号' },
  { value: 'merchantId', label: '商家ID' },
  { value: 'category', label: '出行品类' }
]

const getPlaceholder = () => {
  const type = searchTypes.find(t => t.value === searchType.value)
  return `请输入${type ? type.label : '关键词'}`
}

const validateKeyword = () => {
  const keyword = searchKeyword.value.trim()
  if (!keyword) {
    errorTip.value = '请输入有效的检索关键词'
    return false
  }
  if (keyword.length < 2) {
    errorTip.value = '请输入有效的检索关键词'
    return false
  }
  errorTip.value = ''
  return true
}

const checkRequestFrequency = () => {
  const now = Date.now()
  if (now - lastRequestTime.value < 5000) {
    errorTip.value = '请求过于频繁，请稍后再试'
    return false
  }
  lastRequestTime.value = now
  errorTip.value = ''
  return true
}

const handleSearch = async () => {
  if (!validateKeyword()) return
  if (!checkRequestFrequency()) return

  hasSearched.value = true
  loading.value = true
  try {
    let keyword = searchKeyword.value.trim()
    if (searchType.value === 'category') {
      const categoryMap = {
        '机票': 1,
        '酒店': 2,
        '租车': 3,
        '文旅票务': 4
      }
      keyword = categoryMap[keyword] || keyword
    }

    const data = await traceOrder(`${searchType.value}:${keyword}`)
    traceResults.value = Array.isArray(data) ? data : generateMockResults()
  } catch (err) {
    ElMessage.error(err.message || '检索失败')
    traceResults.value = generateMockResults()
  } finally {
    loading.value = false
  }
}

const handleClear = () => {
  searchKeyword.value = ''
  errorTip.value = ''
  hasSearched.value = false
  traceResults.value = []
}

const getCompletedStep = (order) => {
  let step = 0
  if (order.timeline.create) step = 1
  if (order.timeline.pay) step = 2
  if (order.timeline.fulfill) step = 3
  if (order.timeline.afterSale || !order.needAfterSale) step = 4
  return step
}

const generateMockResults = () => {
  const keyword = searchKeyword.value.trim().toLowerCase()
  const mockData = [
    {
      id: 1,
      orderNo: 'ORD202401150001',
      amount: 1280,
      status: 2,
      createTime: '2024-01-15 14:30:00',
      productName: '北京-上海 经济舱 往返机票',
      buyer: '张三',
      phone: '13800138000',
      needAfterSale: false,
      timeline: {
        create: { time: '2024-01-15 14:30:00' },
        pay: { time: '2024-01-15 14:35:00' },
        fulfill: { time: '2024-01-16 08:00:00' },
        afterSale: null
      }
    },
    {
      id: 2,
      orderNo: 'ORD202401150002',
      amount: 888,
      status: 3,
      createTime: '2024-01-15 12:15:00',
      productName: '希尔顿酒店 豪华大床房 含双早',
      buyer: '李四',
      phone: '13800138001',
      needAfterSale: false,
      timeline: {
        create: { time: '2024-01-15 12:15:00' },
        pay: { time: '2024-01-15 12:20:00' },
        fulfill: { time: '2024-01-16 14:00:00' },
        afterSale: null
      }
    },
    {
      id: 3,
      orderNo: 'ORD202401140003',
      amount: 399,
      status: 5,
      createTime: '2024-01-14 10:20:00',
      productName: '丰田凯美瑞 舒适版 日租',
      buyer: '王五',
      phone: '13800138002',
      needAfterSale: true,
      timeline: {
        create: { time: '2024-01-14 10:20:00' },
        pay: null,
        fulfill: null,
        afterSale: null
      }
    },
    {
      id: 4,
      orderNo: 'ORD202401140004',
      amount: 980,
      status: 6,
      createTime: '2024-01-14 16:00:00',
      productName: '上海-深圳 商务舱 单程机票',
      buyer: '赵六',
      phone: '13800138003',
      needAfterSale: true,
      timeline: {
        create: { time: '2024-01-14 16:00:00' },
        pay: { time: '2024-01-14 16:05:00' },
        fulfill: null,
        afterSale: { time: '2024-01-15 10:30:00' }
      }
    },
    {
      id: 5,
      orderNo: 'ORD202401130005',
      amount: 120,
      status: 3,
      createTime: '2024-01-13 09:00:00',
      productName: '故宫博物院 成人门票',
      buyer: '钱七',
      phone: '13800138004',
      needAfterSale: false,
      timeline: {
        create: { time: '2024-01-13 09:00:00' },
        pay: { time: '2024-01-13 09:02:00' },
        fulfill: { time: '2024-01-13 14:00:00' },
        afterSale: null
      }
    }
  ]

  return mockData.filter(item => {
    if (searchType.value === 'orderNo') {
      return item.orderNo.toLowerCase().includes(keyword)
    }
    if (searchType.value === 'phone') {
      return item.phone.includes(keyword)
    }
    return true
  })
}
</script>

<style lang="scss" scoped>
.order-trace-panel {
  padding: 16px;
  min-height: 400px;

  .search-section {
    margin-bottom: 20px;

    .search-input-wrapper {
      display: flex;
      gap: 12px;
      align-items: stretch;

      .search-type-select {
        width: 150px;
      }

      .search-input {
        flex: 1;
      }
    }

    .error-tip {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 8px;
      color: #f56c6c;
      font-size: 13px;
    }
  }

  .loading-section {
    background: #fff;
    border-radius: 8px;
  }

  .results-section {
    .results-header {
      margin-bottom: 16px;

      .results-count {
        font-size: 14px;
        color: #606266;

        em {
          color: #409eff;
          font-style: normal;
          font-weight: 600;
          margin: 0 4px;
        }
      }
    }

    .trace-results {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .trace-item {
      background: #fff;
      border: 1px solid #e4e7ed;
      border-radius: 8px;
      padding: 16px;
      transition: all 0.3s ease;

      &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      }

      .trace-item-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;

        .order-basic {
          display: flex;
          align-items: center;
          gap: 12px;

          .order-no {
            font-weight: 600;
            color: #303133;
            font-size: 15px;
          }

          .order-amount {
            color: #f56c6c;
            font-weight: 600;
          }
        }

        .order-time {
          font-size: 13px;
          color: #909399;
        }
      }

      .trace-timeline {
        margin-bottom: 16px;

        :deep(.el-step__icon.is-text) {
          width: 36px;
          height: 36px;
          border-radius: 50%;
        }

        .warning-icon {
          color: #f56c6c;
          font-size: 20px;
        }

        .gap-text {
          color: #f56c6c;
        }

        .data-gap-marker {
          padding: 4px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      }

      .trace-item-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 12px;
        border-top: 1px dashed #e4e7ed;
        font-size: 13px;
        color: #606266;

        .product-name {
          max-width: 300px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .buyer-info {
          color: #909399;
        }
      }
    }
  }

  .initial-section,
  .empty-section {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 300px;
  }
}
</style>
