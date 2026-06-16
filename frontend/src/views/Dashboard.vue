<template>
  <div class="dashboard">
    <el-row :gutter="20" class="mb-20">
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #e6f7ff"><el-icon :size="28" color="#1890ff"><ShoppingCart /></el-icon></div>
          <div class="stat-content">
            <div class="stat-label">今日订单数</div>
            <div class="stat-value">{{ todayOrders }}<span class="stat-unit">单</span></div>
            <div class="stat-trend" :class="trendClass(orderTrend)">
              <el-icon><CaretTop v-if="orderTrend >= 0" /><CaretBottom v-else /></el-icon>
              <span>{{ Math.abs(orderTrend) }}%</span>
            </div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #f6ffed"><el-icon :size="28" color="#52c41a"><Money /></el-icon></div>
          <div class="stat-content">
            <div class="stat-label">今日销售额</div>
            <div class="stat-value">¥{{ todaySales }}<span class="stat-unit">元</span></div>
            <div class="stat-trend" :class="trendClass(salesTrend)">
              <el-icon><CaretTop v-if="salesTrend >= 0" /><CaretBottom v-else /></el-icon>
              <span>{{ Math.abs(salesTrend) }}%</span>
            </div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #fff7e6"><el-icon :size="28" color="#faad14"><Shop /></el-icon></div>
          <div class="stat-content">
            <div class="stat-label">活跃商家数</div>
            <div class="stat-value">{{ activeMerchants }}<span class="stat-unit">家</span></div>
            <div class="stat-trend" :class="trendClass(merchantTrend)">
              <el-icon><CaretTop v-if="merchantTrend >= 0" /><CaretBottom v-else /></el-icon>
              <span>{{ Math.abs(merchantTrend) }}%</span>
            </div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-icon" style="background: #fff1f0"><el-icon :size="28" color="#ff4d4f"><WarningFilled /></el-icon></div>
          <div class="stat-content">
            <div class="stat-label">库存预警数</div>
            <div class="stat-value" style="color: #ff4d4f">{{ inventoryWarnings }}<span class="stat-unit">项</span></div>
            <div class="stat-trend trend-warning">
              <el-icon><Warning /></el-icon>
              <span>需关注</span>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mb-20">
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
            <LineChart :labels="salesTrendLabels" :datasets="salesTrendDatasets" :height="320" />
          </div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="chart-card">
          <div class="chart-header">
            <h3>品类销售占比</h3>
          </div>
          <div class="chart-container" style="flex-direction: column; height: auto">
            <PieChart :data="categoryPieData" :height="220" />
            <div class="category-list">
              <div class="category-item" v-for="item in categoryData" :key="item.name">
                <div class="category-info">
                  <span class="category-dot" :style="{ backgroundColor: item.color }"></span>
                  <span class="category-name">{{ item.name }}</span>
                </div>
                <span class="category-value">¥{{ item.amount }}</span>
              </div>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mb-20">
      <el-col :span="12">
        <div class="chart-card">
          <div class="chart-header">
            <h3>订单状态分布</h3>
          </div>
          <div class="chart-container" style="height: auto; gap: 20px">
            <div style="width: 45%">
              <RingChart :data="orderStatusData" :height="200" title="总订单" :total="orderTotal" />
            </div>
            <div class="status-list" style="width: 50%">
              <div class="status-item" v-for="item in orderStatusList" :key="item.name">
                <div class="status-info">
                  <span class="status-dot" :style="{ backgroundColor: item.color }"></span>
                  <span>{{ item.name }}</span>
                </div>
                <span class="status-count">{{ item.value }}</span>
              </div>
            </div>
          </div>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="chart-card">
          <div class="chart-header">
            <h3>商家运营概览</h3>
          </div>
          <div style="display: flex; gap: 20px">
            <div style="flex: 1">
              <h4 class="section-subtitle">TOP5 商家排名</h4>
              <div class="rank-list">
                <div class="rank-item" v-for="(item, idx) in topMerchants" :key="item.name">
                  <span class="rank-no" :class="{ 'rank-top': idx < 3 }">{{ idx + 1 }}</span>
                  <span class="rank-name">{{ item.name }}</span>
                  <span class="rank-amount">¥{{ item.amount }}</span>
                </div>
              </div>
            </div>
            <div style="flex: 1">
              <h4 class="section-subtitle">违规统计</h4>
              <div class="violation-list">
                <div class="violation-item" v-for="item in violationStats" :key="item.label">
                  <span class="violation-label">{{ item.label }}</span>
                  <span class="violation-count" :style="{ color: item.color }">{{ item.count }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mb-20">
      <el-col :span="12">
        <div class="chart-card">
          <div class="chart-header">
            <h3>库存预警</h3>
          </div>
          <el-table :data="inventoryWarningList" size="small" style="width: 100%">
            <el-table-column prop="name" label="出行资源" min-width="140" show-overflow-tooltip />
            <el-table-column prop="category" label="品类" width="80" />
            <el-table-column prop="stock" label="当前库存" width="90">
              <template #default="{ row }">
                <span style="color: #ff4d4f; font-weight: 600">{{ row.stock }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="threshold" label="预警阈值" width="90" />
            <el-table-column label="状态" width="80">
              <template #default>
                <el-tag type="danger" size="small">预警</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="chart-card">
          <div class="chart-header">
            <h3>优惠券核销概况</h3>
          </div>
          <div class="coupon-stats">
            <div class="coupon-stat-row">
              <span class="coupon-label">发放总量</span>
              <span class="coupon-val">{{ couponStats.issued }}</span>
            </div>
            <div class="coupon-stat-row">
              <span class="coupon-label">已核销</span>
              <span class="coupon-val" style="color: #52c41a">{{ couponStats.redeemed }}</span>
            </div>
            <div class="coupon-stat-row">
              <span class="coupon-label">已过期</span>
              <span class="coupon-val" style="color: #faad14">{{ couponStats.expired }}</span>
            </div>
            <ProgressBar
              label="核销率"
              :percentage="couponRedeemRate"
              color="#1890ff"
              :value="couponRedeemRate + '%'"
            />
            <ProgressBar
              label="过期率"
              :percentage="couponExpireRate"
              color="#faad14"
              :value="couponExpireRate + '%'"
            />
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <div class="chart-card">
          <div class="chart-header">
            <h3>最新审批</h3>
            <el-button type="primary" link @click="goToApproval">查看全部</el-button>
          </div>
          <div class="approval-list">
            <div class="approval-item" v-for="item in pendingApprovals" :key="item.id">
              <div class="approval-info">
                <div class="approval-title">{{ item.title }}</div>
                <div class="approval-meta">{{ item.applicant }} · {{ item.createTime }}</div>
              </div>
              <div class="approval-actions">
                <el-button type="success" size="small" @click="handleQuickApprove(item)">通过</el-button>
                <el-button type="danger" size="small" @click="handleQuickReject(item)">拒绝</el-button>
              </div>
            </div>
            <el-empty v-if="!pendingApprovals.length" description="暂无待审批" :image-size="60" />
          </div>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="chart-card">
          <div class="chart-header">
            <h3>系统通知</h3>
            <el-button type="primary" link @click="goToNotifications">查看全部</el-button>
          </div>
          <div class="notification-list">
            <div class="notification-item" v-for="item in recentNotifications" :key="item.id" :class="{ unread: !item.read }">
              <div class="notification-type">
                <el-tag :type="item.typeTag" size="small">{{ item.typeLabel }}</el-tag>
              </div>
              <div class="notification-content">
                <div class="notification-text">{{ item.content }}</div>
                <div class="notification-time">{{ item.time }}</div>
              </div>
            </div>
            <el-empty v-if="!recentNotifications.length" description="暂无通知" :image-size="60" />
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ShoppingCart,
  Money,
  Shop,
  WarningFilled,
  Warning,
  CaretTop,
  CaretBottom
} from '@element-plus/icons-vue'
import { getEnumLabel, getEnumType, OrderStatusEnum, NotificationTypeEnum } from '@/utils/enums'
import LineChart from '@/components/Charts/LineChart.vue'
import PieChart from '@/components/Charts/PieChart.vue'
import RingChart from '@/components/Charts/RingChart.vue'
import ProgressBar from '@/components/Charts/ProgressBar.vue'

const router = useRouter()
const chartPeriod = ref('week')

const todayOrders = ref(128)
const todaySales = ref(25680)
const activeMerchants = ref(56)
const inventoryWarnings = ref(5)

const orderTrend = ref(12.5)
const salesTrend = ref(8.3)
const merchantTrend = ref(5.2)

const trendClass = (value) => (value >= 0 ? 'trend-up' : 'trend-down')

const salesTrendLabels = computed(() => {
  if (chartPeriod.value === 'week') return ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  if (chartPeriod.value === 'month') return ['1周', '2周', '3周', '4周']
  return ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
})

const salesTrendDatasets = computed(() => {
  const orderData = chartPeriod.value === 'week'
    ? [18, 22, 15, 28, 35, 42, 38]
    : chartPeriod.value === 'month'
      ? [85, 120, 95, 110]
      : [680, 750, 820, 900, 780, 860, 920, 880, 950, 1020, 980, 1050]
  const salesData = chartPeriod.value === 'week'
    ? [3200, 4100, 2800, 5600, 7200, 8900, 7800]
    : chartPeriod.value === 'month'
      ? [18000, 25000, 21000, 23000]
      : [156000, 178000, 195000, 210000, 185000, 198000, 220000, 205000, 230000, 258000, 240000, 265000]

  return [
    { label: '订单数', data: orderData, color: '#1890ff' },
    { label: '销售额', data: salesData, color: '#52c41a' }
  ]
})

const categoryData = ref([
  { name: '机票', value: 35, color: '#1890ff', amount: 128000 },
  { name: '酒店', value: 30, color: '#52c41a', amount: 98000 },
  { name: '租车', value: 20, color: '#faad14', amount: 56000 },
  { name: '文旅票务', value: 15, color: '#722ed1', amount: 32000 }
])

const categoryPieData = computed(() =>
  categoryData.value.map((d) => ({ name: d.name, value: d.value, color: d.color }))
)

const orderTotal = ref(1280)
const orderStatusList = ref([
  { name: '待支付', value: 120, color: '#faad14' },
  { name: '已支付', value: 280, color: '#1890ff' },
  { name: '已完成', value: 750, color: '#52c41a' },
  { name: '已取消', value: 80, color: '#909399' },
  { name: '退款中', value: 20, color: '#e6a23c' },
  { name: '已退款', value: 30, color: '#ff4d4f' }
])

const orderStatusData = computed(() =>
  orderStatusList.value.map((d) => ({ name: d.name, value: d.value, color: d.color }))
)

const topMerchants = ref([
  { name: '中国国航旗舰店', amount: 89600 },
  { name: '希尔顿酒店旗舰店', amount: 67200 },
  { name: '神州租车', amount: 45800 },
  { name: '故宫博物院', amount: 32100 },
  { name: '东方航空', amount: 28500 }
])

const violationStats = ref([
  { label: '正常', count: 42, color: '#52c41a' },
  { label: '轻微', count: 8, color: '#1890ff' },
  { label: '一般', count: 4, color: '#faad14' },
  { label: '严重', count: 2, color: '#ff4d4f' }
])

const inventoryWarningList = ref([
  { name: '北京-三亚 机票', category: '机票', stock: 5, threshold: 20 },
  { name: '三亚希尔顿 海景房', category: '酒店', stock: 3, threshold: 10 },
  { name: '丽江古城 门票', category: '文旅', stock: 8, threshold: 30 },
  { name: '北京-成都 机票', category: '机票', stock: 2, threshold: 15 },
  { name: '厦门鼓浪屿 门票', category: '文旅', stock: 10, threshold: 25 }
])

const couponStats = ref({ issued: 3500, redeemed: 2100, expired: 480 })
const couponRedeemRate = computed(() =>
  ((couponStats.value.redeemed / couponStats.value.issued) * 100).toFixed(1)
)
const couponExpireRate = computed(() =>
  ((couponStats.value.expired / couponStats.value.issued) * 100).toFixed(1)
)

const pendingApprovals = ref([
  { id: 1, title: '希尔顿酒店旗舰店入驻审核', applicant: '李经理', createTime: '10:00' },
  { id: 2, title: '2024年度商务考察团方案审批', applicant: '王专员', createTime: '11:30' },
  { id: 3, title: '订单ORD退款审批', applicant: '张三', createTime: '14:20' }
])

const recentNotifications = ref([
  { id: 1, type: 'order', typeLabel: '订单通知', typeTag: 'primary', content: '订单ORD202401150001已支付', time: '5分钟前', read: false },
  { id: 2, type: 'merchant', typeLabel: '商家通知', typeTag: 'warning', content: '神州租车违规等级已更新', time: '1小时前', read: false },
  { id: 3, type: 'system', typeLabel: '系统通知', typeTag: 'info', content: '系统将于今晚22:00进行维护', time: '2小时前', read: true },
  { id: 4, type: 'approval', typeLabel: '审批通知', typeTag: 'success', content: '商家审核已通过', time: '3小时前', read: true }
])

const handleQuickApprove = (item) => {
  ElMessageBox.confirm(`确定通过 "${item.title}" 的审批吗？`, '快速审批', {
    confirmButtonText: '通过',
    cancelButtonText: '取消',
    type: 'success'
  }).then(() => {
    ElMessage.success('审批通过')
    pendingApprovals.value = pendingApprovals.value.filter((a) => a.id !== item.id)
  }).catch(() => {})
}

const handleQuickReject = (item) => {
  ElMessageBox.prompt('请输入拒绝原因', '快速拒绝', {
    confirmButtonText: '拒绝',
    cancelButtonText: '取消',
    inputPattern: /.+/,
    inputErrorMessage: '拒绝原因不能为空',
    type: 'warning'
  }).then(({ value }) => {
    ElMessage.success('审批拒绝')
    pendingApprovals.value = pendingApprovals.value.filter((a) => a.id !== item.id)
  }).catch(() => {})
}

const goToApproval = () => {
  router.push('/approval/index')
}

const goToNotifications = () => {
  ElMessage.info('查看全部通知')
}

onMounted(() => {})
</script>

<style lang="scss" scoped>
.dashboard {
  .stat-card {
    padding: 20px;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    display: flex;
    align-items: center;
    gap: 16px;
    transition: all 0.3s;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    }

    .stat-icon {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .stat-content {
      flex: 1;

      .stat-label {
        font-size: 13px;
        color: #999;
        margin-bottom: 6px;
      }

      .stat-value {
        font-size: 26px;
        font-weight: 700;
        color: #333;
        margin-bottom: 4px;

        .stat-unit {
          font-size: 13px;
          color: #999;
          font-weight: normal;
          margin-left: 2px;
        }
      }

      .stat-trend {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;

        &.trend-up { color: #52c41a; }
        &.trend-down { color: #ff4d4f; }
        &.trend-warning { color: #faad14; }
      }
    }
  }

  .chart-card {
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    padding: 20px;

    .chart-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;

      h3 {
        font-size: 16px;
        font-weight: 600;
        margin: 0;
      }
    }

    .chart-container {
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .category-list {
    width: 100%;
    margin-top: 16px;

    .category-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 0;

      .category-info {
        display: flex;
        align-items: center;
        gap: 8px;

        .category-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .category-name {
          font-size: 13px;
          color: #666;
        }
      }

      .category-value {
        font-size: 13px;
        font-weight: 600;
        color: #333;
      }
    }
  }

  .section-subtitle {
    font-size: 14px;
    font-weight: 600;
    color: #333;
    margin: 0 0 12px;
  }

  .status-list {
    .status-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 0;

      .status-info {
        display: flex;
        align-items: center;
        gap: 8px;

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
      }

      .status-count {
        font-weight: 600;
        font-size: 14px;
      }
    }
  }

  .rank-list {
    .rank-item {
      display: flex;
      align-items: center;
      padding: 8px 0;
      gap: 10px;

      .rank-no {
        width: 22px;
        height: 22px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        color: #999;
        background: #f5f5f5;

        &.rank-top {
          background: #ff4d4f;
          color: #fff;
        }
      }

      .rank-name {
        flex: 1;
        font-size: 13px;
        color: #333;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .rank-amount {
        font-size: 13px;
        font-weight: 600;
        color: #333;
      }
    }
  }

  .violation-list {
    .violation-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 0;

      .violation-label {
        font-size: 13px;
        color: #666;
      }

      .violation-count {
        font-size: 14px;
        font-weight: 600;
      }
    }
  }

  .coupon-stats {
    .coupon-stat-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #f5f5f5;

      .coupon-label {
        color: #666;
        font-size: 13px;
      }

      .coupon-val {
        font-weight: 600;
        font-size: 14px;
        color: #333;
      }
    }

    .progress-bar {
      margin-top: 12px;
    }
  }

  .approval-list {
    .approval-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #f5f5f5;

      &:last-child { border-bottom: none; }

      .approval-info {
        flex: 1;
        min-width: 0;

        .approval-title {
          font-size: 14px;
          color: #333;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .approval-meta {
          font-size: 12px;
          color: #999;
          margin-top: 4px;
        }
      }

      .approval-actions {
        display: flex;
        gap: 8px;
        flex-shrink: 0;
        margin-left: 12px;
      }
    }
  }

  .notification-list {
    .notification-item {
      display: flex;
      gap: 12px;
      padding: 10px 0;
      border-bottom: 1px solid #f5f5f5;

      &:last-child { border-bottom: none; }

      &.unread {
        .notification-text { font-weight: 600; }
      }

      .notification-content {
        flex: 1;
        min-width: 0;

        .notification-text {
          font-size: 13px;
          color: #333;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .notification-time {
          font-size: 12px;
          color: #999;
          margin-top: 4px;
        }
      }
    }
  }
}
</style>
