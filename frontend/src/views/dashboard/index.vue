<template>
  <div class="dashboard">
    <el-row :gutter="20" class="stat-cards">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card order-card">
          <div class="stat-icon">
            <el-icon size="32"><Document /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ statistics.todayOrders || 0 }}</div>
            <div class="stat-label">今日订单</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card driver-card">
          <div class="stat-icon">
            <el-icon size="32"><User /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ statistics.onlineDrivers || 0 }}</div>
            <div class="stat-label">在线司机</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card money-card">
          <div class="stat-icon">
            <el-icon size="32"><Money /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">¥{{ statistics.todayRevenue || 0 }}</div>
            <div class="stat-label">今日营收</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card user-card">
          <div class="stat-icon">
            <el-icon size="32"><UserFilled /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ statistics.activeUsers || 0 }}</div>
            <div class="stat-label">活跃用户</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="charts-row">
      <el-col :span="16">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>订单趋势</span>
              <el-radio-group v-model="chartType" size="small">
                <el-radio-button value="day">今日</el-radio-button>
                <el-radio-button value="week">本周</el-radio-button>
                <el-radio-button value="month">本月</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div ref="orderChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="chart-card">
          <template #header>
            <span>运力类型分布</span>
          </template>
          <div ref="capacityChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="bottom-row">
      <el-col :span="12">
        <el-card class="list-card">
          <template #header>
            <div class="card-header">
              <span>最新订单</span>
              <el-button type="primary" link @click="goToOrderList">查看全部</el-button>
            </div>
          </template>
          <el-table :data="recentOrders" size="small">
            <el-table-column prop="orderNo" label="订单号" width="160" />
            <el-table-column prop="passengerName" label="乘客" width="80" />
            <el-table-column prop="startAddress" label="起点" show-overflow-tooltip />
            <el-table-column prop="status" label="状态" width="80">
              <template #default="{ row }">
                <StatusTag
                  :status="row.status"
                  :status-map="OrderStatusMap"
                  :color-map="OrderStatusColorMap"
                />
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="list-card">
          <template #header>
            <div class="card-header">
              <span>待办事项</span>
            </div>
          </template>
          <el-table :data="todos" size="small">
            <el-table-column prop="title" label="事项" />
            <el-table-column prop="count" label="数量" width="80" align="center">
              <template #default="{ row }">
                <el-badge :value="row.count" class="item" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" align="center">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="handleTodo(row)">处理</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import StatusTag from '@/components/StatusTag/index.vue'
import { OrderStatusMap, OrderStatusColorMap } from '@/enums/order'
import { getOrderStatisticsApi } from '@/api/order'

const router = useRouter()

const chartType = ref('day')
const orderChartRef = ref<HTMLDivElement>()
const capacityChartRef = ref<HTMLDivElement>()

let orderChart: echarts.ECharts | null = null
let capacityChart: echarts.ECharts | null = null

const statistics = reactive({
  todayOrders: 128,
  onlineDrivers: 86,
  todayRevenue: 12580,
  activeUsers: 356
})

const recentOrders = ref([
  { id: 1, orderNo: 'DD202401010001', passengerName: '张三', startAddress: '北京市朝阳区望京SOHO', status: 5 },
  { id: 2, orderNo: 'DD202401010002', passengerName: '李四', startAddress: '北京市海淀区中关村', status: 4 },
  { id: 3, orderNo: 'DD202401010003', passengerName: '王五', startAddress: '北京市东城区王府井', status: 3 },
  { id: 4, orderNo: 'DD202401010004', passengerName: '赵六', startAddress: '北京市西城区金融街', status: 2 },
  { id: 5, orderNo: 'DD202401010005', passengerName: '钱七', startAddress: '北京市丰台区丽泽', status: 1 }
])

const todos = ref([
  { id: 1, title: '司机资质审核', count: 12, type: 'driver-audit' },
  { id: 2, title: '车辆资质审核', count: 8, type: 'vehicle-audit' },
  { id: 3, title: '待处理订单', count: 5, type: 'pending-order' },
  { id: 4, title: '财务待结算', count: 3, type: 'finance-settle' }
])

const initCharts = () => {
  if (orderChartRef.value) {
    orderChart = echarts.init(orderChartRef.value)
    const option = {
      tooltip: { trigger: 'axis' },
      legend: { data: ['订单数', '收入'] },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00']
      },
      yAxis: [
        { type: 'value', name: '订单数' },
        { type: 'value', name: '收入(元)' }
      ],
      series: [
        {
          name: '订单数',
          type: 'bar',
          data: [12, 8, 25, 45, 38, 52, 18],
          itemStyle: { color: '#409eff' }
        },
        {
          name: '收入',
          type: 'line',
          yAxisIndex: 1,
          data: [240, 160, 500, 900, 760, 1040, 360],
          itemStyle: { color: '#67c23a' },
          smooth: true
        }
      ]
    }
    orderChart.setOption(option)
  }

  if (capacityChartRef.value) {
    capacityChart = echarts.init(capacityChartRef.value)
    const option = {
      tooltip: { trigger: 'item' },
      legend: { bottom: '5%', left: 'center' },
      series: [
        {
          name: '运力类型',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
          label: { show: false },
          emphasis: {
            label: { show: true, fontSize: 16, fontWeight: 'bold' }
          },
          data: [
            { value: 1048, name: '快车' },
            { value: 735, name: '专车' },
            { value: 580, name: '出租车' },
            { value: 484, name: '拼车' },
            { value: 300, name: '豪华车' }
          ]
        }
      ]
    }
    capacityChart.setOption(option)
  }
}

const goToOrderList = () => {
  router.push('/order/list')
}

const handleTodo = (todo: any) => {
  switch (todo.type) {
    case 'driver-audit':
      router.push('/driver/audit')
      break
    case 'vehicle-audit':
      router.push('/vehicle/audit')
      break
    case 'pending-order':
      router.push('/order/list')
      break
    case 'finance-settle':
      router.push('/finance/settlement')
      break
  }
}

const loadStatistics = async () => {
  try {
    const res = await getOrderStatisticsApi()
    if (res.data) {
      Object.assign(statistics, res.data)
    }
  } catch (e) {
    console.log('statistics mock data')
  }
}

onMounted(() => {
  nextTick(() => {
    initCharts()
  })
  loadStatistics()

  window.addEventListener('resize', () => {
    orderChart?.resize()
    capacityChart?.resize()
  })
})
</script>

<style lang="scss" scoped>
.dashboard {
  .stat-cards {
    margin-bottom: 20px;
  }

  .stat-card {
    display: flex;
    align-items: center;
    padding: 10px;

    .stat-icon {
      width: 60px;
      height: 60px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 20px;
      color: #fff;
    }

    .stat-info {
      .stat-value {
        font-size: 24px;
        font-weight: bold;
        color: #303133;
        margin-bottom: 5px;
      }

      .stat-label {
        font-size: 14px;
        color: #909399;
      }
    }

    &.order-card .stat-icon {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    &.driver-card .stat-icon {
      background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
    }

    &.money-card .stat-icon {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }

    &.user-card .stat-icon {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    }
  }

  .charts-row {
    margin-bottom: 20px;
  }

  .chart-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }

  .chart-container {
    height: 300px;
  }

  .bottom-row {
    .list-card {
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
    }
  }
}
</style>
