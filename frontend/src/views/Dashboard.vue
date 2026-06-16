<template>
  <div class="dashboard">
    <el-row :gutter="20" class="mb-20">
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-label">今日订单数</div>
          <div class="stat-value">{{ todayOrders }}<span class="stat-unit">单</span></div>
          <div class="stat-trend" :class="trendClass(orderTrend)">
            <el-icon><TrendCharts /></el-icon>
            <span>{{ orderTrend }}%</span>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-label">今日销售额</div>
          <div class="stat-value">¥{{ todaySales }}<span class="stat-unit">元</span></div>
          <div class="stat-trend" :class="trendClass(salesTrend)">
            <el-icon><TrendCharts /></el-icon>
            <span>{{ salesTrend }}%</span>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-label">用户总数</div>
          <div class="stat-value">{{ totalUsers }}<span class="stat-unit">人</span></div>
          <div class="stat-trend" :class="trendClass(userTrend)">
            <el-icon><TrendCharts /></el-icon>
            <span>{{ userTrend }}%</span>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-label">商品总数</div>
          <div class="stat-value">{{ totalProducts }}<span class="stat-unit">件</span></div>
          <div class="stat-trend" :class="trendClass(productTrend)">
            <el-icon><TrendCharts /></el-icon>
            <span>{{ productTrend }}%</span>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="16">
        <div class="chart-card">
          <div class="chart-header">
          <h3>销售趋势</h3>
            <el-radio-group v-model="chartPeriod" size="small">
              <el-radio-button value="week">本周</el-radio-button>
              <el-radio-button value="month">本月</el-radio-button>
              <el-radio-button value="year">本年</el-radio-button>
            </el-radio-group>
          </div>
          <div class="chart-container">
            <div v-loading="loading" class="chart-placeholder">
              <el-icon class="loading-icon"><DataLine /></el-icon>
              <p>销售趋势图表</p>
            </div>
          </div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="chart-card">
          <div class="chart-header">
            <h3>品类销售占比</h3>
          </div>
          <div class="chart-container">
            <div class="category-list">
              <div class="category-item" v-for="item in categoryData" :key="item.name">
                <div class="category-info">
                  <span class="category-dot" :style="{ backgroundColor: item.color }"></span>
                  <span class="category-name">{{ item.name }}</span>
                </div>
                <span class="category-value">{{ item.value }}%</span>
              </div>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mt-20">
      <el-col :span="12">
        <div class="table-card">
          <div class="table-header">
            <h3>最新订单</h3>
            <el-button type="primary" link @click="goToOrders">查看全部</el-button>
          </div>
          <el-table :data="recentOrders" style="width: 100%">
            <el-table-column prop="orderNo" label="订单号" />
            <el-table-column prop="productName" label="商品名称" />
            <el-table-column prop="amount" label="金额">
              <template #default="{ row }">¥{{ row.amount }}</template>
            </el-table-column>
            <el-table-column prop="status" label="状态">
              <template #default="{ row }">
                <el-tag :type="getOrderStatusType(row.status)">{{ getOrderStatusLabel(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="创建时间" />
          </el-table>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="table-card">
          <div class="table-header">
            <h3>热门商品</h3>
          </div>
          <el-table :data="hotProducts" style="width: 100%">
            <el-table-column prop="rank" label="排名" width="60">
              <template #default="{ $index }">
                <el-tag :type="$index < 3 ? 'danger' : 'info'" size="small">{{ $index + 1 }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="name" label="商品名称" />
            <el-table-column prop="sales" label="销量" />
            <el-table-column prop="amount" label="销售额">
              <template #default="{ row }">¥{{ row.amount }}</template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { TrendCharts, DataLine } from '@element-plus/icons-vue'
import { OrderStatusEnum, getEnumLabel, getEnumType } from '@/utils/enums'

const router = useRouter()
const loading = ref(false)
const chartPeriod = ref('week')

const todayOrders = ref(128)
const todaySales = ref(25680)
const totalUsers = ref(5680)
const totalProducts = ref(328)

const orderTrend = ref(12.5)
const salesTrend = ref(8.3)
const userTrend = ref(5.2)
const productTrend = ref(3.1)

const categoryData = ref([
  { name: '机票', value: 35, color: '#1890ff' },
  { name: '酒店', value: 30, color: '#52c41a' },
  { name: '租车', value: 20, color: '#faad14' },
  { name: '文旅票务', value: 15, color: '#722ed1' }
])

const recentOrders = ref([
  { orderNo: 'ORD202401150001', productName: '北京-上海 机票', amount: 1280, status: 2, createTime: '2024-01-15 14:30' },
  { orderNo: 'ORD202401150002', productName: '希尔顿酒店 豪华房', amount: 888, status: 3, createTime: '2024-01-15 12:15' },
  { orderNo: 'ORD202401150003', productName: '租车 丰田凯美瑞', amount: 399, status: 1, createTime: '2024-01-15 10:20' },
  { orderNo: 'ORD202401150004', productName: '故宫门票 成人票', amount: 60, status: 2, createTime: '2024-01-15 09:45' },
  { orderNo: 'ORD202401150005', productName: '上海-深圳 机票', amount: 980, status: 4, createTime: '2024-01-15 09:00' }
])

const hotProducts = ref([
  { name: '北京-上海 经济舱', sales: 156, amount: 199680 },
  { name: '希尔顿酒店 标准房', sales: 128, amount: 113664 },
  { name: '故宫门票 成人票', sales: 320, amount: 19200 },
  { name: '丰田凯美瑞 日租', sales: 89, amount: 35511 },
  { name: '上海-广州 商务舱', sales: 67, amount: 134000 }
])

const trendClass = (value) => {
  return value >= 0 ? 'trend-up' : 'trend-down'
}

const getOrderStatusLabel = (status) => {
  return getEnumLabel(OrderStatusEnum, status)
}

const getOrderStatusType = (status) => {
  return getEnumType(OrderStatusEnum, status)
}

const goToOrders = () => {
  router.push('/order/index')
}

onMounted(() => {
  fetchDashboardData()
})

const fetchDashboardData = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
  }, 1000)
}
</script>

<style lang="scss" scoped>
.dashboard {
  .stat-card {
    padding: 24px;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    transition: all 0.3s;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    }

    .stat-label {
      font-size: 14px;
      color: #666;
      margin-bottom: 12px;
    }

    .stat-value {
      font-size: 32px;
      font-weight: 600;
      color: #333;
      margin-bottom: 8px;

      .stat-unit {
        font-size: 14px;
        color: #999;
        margin-left: 4px;
        font-weight: normal;
      }
    }

    .stat-trend {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;

      &.trend-up {
        color: #52c41a;
      }

      &.trend-down {
        color: #ff4d4f;
      }
    }
  }

  .chart-card,
  .table-card {
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    padding: 20px;

    .chart-header,
    .table-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;

      h3 {
        font-size: 16px;
        font-weight: 600;
        margin: 0;
      }
    }

    .chart-container {
      height: 300px;
      display: flex;
      align-items: center;
      justify-content: center;

      .chart-placeholder {
        text-align: center;
        color: #999;

        .loading-icon {
          font-size: 48px;
          margin-bottom: 12px;
          color: #1890ff;
        }
      }
    }

    .category-list {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 16px;

      .category-item {
        display: flex;
        align-items: center;
        justify-content: space-between;

        .category-info {
          display: flex;
          align-items: center;
          gap: 8px;

          .category-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
          }

          .category-name {
            font-size: 14px;
            color: #333;
          }
        }

        .category-value {
          font-size: 14px;
          font-weight: 600;
          color: #333;
        }
      }
    }
  }
}
</style>
