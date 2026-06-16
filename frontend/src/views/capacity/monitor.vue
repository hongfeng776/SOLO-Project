<template>
  <div class="capacity-monitor">
    <el-row :gutter="20" class="stat-cards">
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card online-card">
          <div class="stat-icon">
            <el-icon size="28"><Connection /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ monitorData.totalOnline || 0 }}</div>
            <div class="stat-label">在线司机</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card order-card">
          <div class="stat-icon">
            <el-icon size="28"><Van /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ monitorData.totalInOrder || 0 }}</div>
            <div class="stat-label">接单中</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card idle-card">
          <div class="stat-icon">
            <el-icon size="28"><Clock /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ monitorData.totalIdle || 0 }}</div>
            <div class="stat-label">空闲运力</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="charts-row">
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <span>运力类型分布</span>
          </template>
          <div ref="typeChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <span>热门区域</span>
          </template>
          <el-table :data="hotAreas" size="small">
            <el-table-column prop="area" label="区域" />
            <el-table-column prop="orderCount" label="订单数" width="100" align="right" />
            <el-table-column prop="driverCount" label="司机数" width="100" align="right" />
            <el-table-column label="供需比" width="120" align="center">
              <template #default="{ row }">
                <el-progress
                  :percentage="Math.round((row.driverCount / row.orderCount) * 100)"
                  :stroke-width="10"
                  :color="getSupplyColor(row)"
                />
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
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import { getCapacityMonitorApi } from '@/api/capacity'

const typeChartRef = ref<HTMLDivElement>()
let typeChart: echarts.ECharts | null = null

const monitorData = reactive({
  totalOnline: 0,
  totalInOrder: 0,
  totalIdle: 0,
  typeDistribution: [] as any[],
  hotAreas: [] as any[]
})

const hotAreas = ref([
  { area: '朝阳区望京', orderCount: 156, driverCount: 45 },
  { area: '海淀区中关村', orderCount: 128, driverCount: 38 },
  { area: '东城区王府井', orderCount: 98, driverCount: 32 },
  { area: '西城区金融街', orderCount: 87, driverCount: 28 },
  { area: '丰台区丽泽', orderCount: 76, driverCount: 25 }
])

const getSupplyColor = (row: any) => {
  const ratio = row.driverCount / row.orderCount
  if (ratio >= 0.5) return '#67c23a'
  if (ratio >= 0.3) return '#e6a23c'
  return '#f56c6c'
}

const initChart = () => {
  if (typeChartRef.value) {
    typeChart = echarts.init(typeChartRef.value)
    const option = {
      tooltip: { trigger: 'item' },
      legend: { bottom: '5%', left: 'center' },
      series: [{
        name: '运力类型',
        type: 'pie',
        radius: ['40%', '70%'],
        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
        data: [
          { value: 45, name: '快车' },
          { value: 25, name: '专车' },
          { value: 20, name: '出租车' },
          { value: 15, name: '拼车' },
          { value: 10, name: '豪华车' }
        ]
      }]
    }
    typeChart.setOption(option)
  }
}

const loadData = async () => {
  try {
    const res = await getCapacityMonitorApi()
    Object.assign(monitorData, res.data)
    if (res.data.hotAreas) {
      hotAreas.value = res.data.hotAreas
    }
  } catch (e: any) {
    ElMessage.error(e.message || '获取运力数据失败')
  }
}

onMounted(() => {
  nextTick(() => {
    initChart()
  })
  loadData()
})
</script>

<style lang="scss" scoped>
.capacity-monitor {
  .stat-cards {
    margin-bottom: 20px;
  }

  .stat-card {
    display: flex;
    align-items: center;
    padding: 10px;

    .stat-icon {
      width: 50px;
      height: 50px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 15px;
      color: #fff;
    }

    .stat-info {
      .stat-value {
        font-size: 20px;
        font-weight: bold;
        color: #303133;
      }

      .stat-label {
        font-size: 13px;
        color: #909399;
        margin-top: 4px;
      }
    }

    &.online-card .stat-icon {
      background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
    }

    &.order-card .stat-icon {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    &.idle-card .stat-icon {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }
  }

  .charts-row {
    .chart-container {
      height: 300px;
    }
  }
}
</style>
