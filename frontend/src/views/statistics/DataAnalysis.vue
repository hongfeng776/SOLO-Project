<template>
  <div class="data-analysis">
    <div class="page-header">
      <h2>数据分析</h2>
    </div>

    <el-tabs v-model="activeTab" type="border-card">
      <el-tab-pane label="订单交易分析" name="order">
        <div class="filter-bar">
          <el-date-picker v-model="orderFilter.dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" />
          <el-select v-model="orderFilter.category" placeholder="品类" clearable style="width: 120px; margin-left: 12px">
            <el-option v-for="item in getEnumOptions(TravelCategoryEnum)" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
          <el-button type="primary" style="margin-left: 12px" @click="fetchOrderData">查询</el-button>
        </div>
        <el-row :gutter="20" class="mb-20">
          <el-col :span="16">
            <div class="chart-card">
              <h3 class="chart-title">销售趋势</h3>
              <LineChart :labels="orderTrendLabels" :datasets="orderTrendDatasets" :height="300" />
            </div>
          </el-col>
          <el-col :span="8">
            <div class="chart-card">
              <h3 class="chart-title">品类对比</h3>
              <PieChart :data="categoryCompareData" :height="300" />
            </div>
          </el-col>
        </el-row>
        <div class="chart-card">
          <h3 class="chart-title">订单明细</h3>
          <el-table :data="orderDetailData" border stripe size="small">
            <el-table-column prop="date" label="日期" width="120" />
            <el-table-column prop="orderCount" label="订单数" />
            <el-table-column prop="salesAmount" label="销售额" />
            <el-table-column prop="avgAmount" label="客单价" />
            <el-table-column prop="refundCount" label="退款数" />
            <el-table-column prop="refundRate" label="退款率" />
          </el-table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="商家运营分析" name="merchant">
        <div class="filter-bar">
          <el-date-picker v-model="merchantFilter.dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" />
          <el-button type="primary" style="margin-left: 12px">查询</el-button>
        </div>
        <el-row :gutter="20" class="mb-20">
          <el-col :span="12">
            <div class="chart-card">
              <h3 class="chart-title">商家销售额排名</h3>
              <div class="rank-list">
                <div class="rank-item" v-for="(item, idx) in merchantRankData" :key="item.name">
                  <span class="rank-no" :class="{ top: idx < 3 }">{{ idx + 1 }}</span>
                  <span class="rank-name">{{ item.name }}</span>
                  <div class="rank-bar-wrap">
                    <div class="rank-bar" :style="{ width: item.percent + '%' }"></div>
                  </div>
                  <span class="rank-amount">¥{{ item.amount }}</span>
                </div>
              </div>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="chart-card">
              <h3 class="chart-title">违规分布</h3>
              <RingChart :data="violationDistData" :height="250" title="商家数" :total="56" />
              <div class="violation-detail mt-20">
                <div v-for="item in violationDistData" :key="item.name" class="violation-row">
                  <span class="violation-dot" :style="{ backgroundColor: item.color }"></span>
                  <span>{{ item.name }}</span>
                  <span style="margin-left: auto; font-weight: 600">{{ item.value }}家</span>
                </div>
              </div>
            </div>
          </el-col>
        </el-row>
        <div class="chart-card">
          <h3 class="chart-title">审核统计</h3>
          <el-table :data="auditStatsData" border stripe size="small">
            <el-table-column prop="type" label="审核类型" />
            <el-table-column prop="total" label="总数" />
            <el-table-column prop="approved" label="已通过" />
            <el-table-column prop="rejected" label="已拒绝" />
            <el-table-column prop="pending" label="待审批" />
            <el-table-column prop="approveRate" label="通过率" />
          </el-table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="库存分析" name="inventory">
        <el-row :gutter="20" class="mb-20">
          <el-col :span="12">
            <div class="chart-card">
              <h3 class="chart-title">各品类库存概览</h3>
              <PieChart :data="inventoryOverviewData" :height="280" />
            </div>
          </el-col>
          <el-col :span="12">
            <div class="chart-card">
              <h3 class="chart-title">出行资源使用率</h3>
              <div class="usage-list">
                <ProgressBar v-for="item in resourceUsageData" :key="item.label" :label="item.label" :percentage="item.rate" :color="item.color" :value="item.rate + '%'" />
              </div>
            </div>
          </el-col>
        </el-row>
        <div class="chart-card">
          <h3 class="chart-title">低库存预警</h3>
          <el-table :data="lowInventoryData" border stripe size="small">
            <el-table-column prop="name" label="资源名称" min-width="150" show-overflow-tooltip />
            <el-table-column prop="category" label="品类" width="80" />
            <el-table-column prop="stock" label="当前库存" width="100">
              <template #default="{ row }">
                <span style="color: #ff4d4f; font-weight: 600">{{ row.stock }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="threshold" label="预警阈值" width="100" />
            <el-table-column label="缺口" width="80">
              <template #default="{ row }">
                <span style="color: #ff4d4f">{{ row.threshold - row.stock }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="权益转化分析" name="coupon">
        <el-row :gutter="20" class="mb-20">
          <el-col :span="12">
            <div class="chart-card">
              <h3 class="chart-title">优惠券核销率</h3>
              <div class="coupon-rate-list">
                <ProgressBar v-for="item in couponRedeemData" :key="item.label" :label="item.label" :percentage="item.rate" :color="item.color" :value="item.rate + '%'" />
              </div>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="chart-card">
              <h3 class="chart-title">各品类效果对比</h3>
              <PieChart :data="couponEffectData" :height="280" />
            </div>
          </el-col>
        </el-row>
        <div class="chart-card">
          <h3 class="chart-title">转化趋势</h3>
          <LineChart :labels="conversionLabels" :datasets="conversionDatasets" :height="300" />
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { TravelCategoryEnum, getEnumOptions } from '@/utils/enums'
import LineChart from '@/components/Charts/LineChart.vue'
import PieChart from '@/components/Charts/PieChart.vue'
import RingChart from '@/components/Charts/RingChart.vue'
import ProgressBar from '@/components/Charts/ProgressBar.vue'

const activeTab = ref('order')

const orderFilter = reactive({ dateRange: [], category: null })
const merchantFilter = reactive({ dateRange: [] })

const orderTrendLabels = ref(['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'])
const orderTrendDatasets = ref([
  { label: '订单数', data: [680, 750, 820, 900, 780, 860, 920, 880, 950, 1020, 980, 1050], color: '#1890ff' },
  { label: '销售额(百)', data: [1560, 1780, 1950, 2100, 1850, 1980, 2200, 2050, 2300, 2580, 2400, 2650], color: '#52c41a' }
])

const categoryCompareData = ref([
  { name: '机票', value: 38, color: '#1890ff' },
  { name: '酒店', value: 28, color: '#52c41a' },
  { name: '租车', value: 18, color: '#faad14' },
  { name: '文旅票务', value: 16, color: '#722ed1' }
])

const orderDetailData = ref([
  { date: '2024-01', orderCount: 680, salesAmount: '¥156,000', avgAmount: '¥229', refundCount: 28, refundRate: '4.1%' },
  { date: '2024-02', orderCount: 750, salesAmount: '¥178,000', avgAmount: '¥237', refundCount: 32, refundRate: '4.3%' },
  { date: '2024-03', orderCount: 820, salesAmount: '¥195,000', avgAmount: '¥238', refundCount: 25, refundRate: '3.0%' },
  { date: '2024-04', orderCount: 900, salesAmount: '¥210,000', avgAmount: '¥233', refundCount: 35, refundRate: '3.9%' }
])

const merchantRankData = ref([
  { name: '中国国航旗舰店', amount: 89600, percent: 100 },
  { name: '希尔顿酒店旗舰店', amount: 67200, percent: 75 },
  { name: '神州租车', amount: 45800, percent: 51 },
  { name: '故宫博物院', amount: 32100, percent: 36 },
  { name: '东方航空', amount: 28500, percent: 32 }
])

const violationDistData = ref([
  { name: '正常', value: 42, color: '#52c41a' },
  { name: '轻微', value: 8, color: '#1890ff' },
  { name: '一般', value: 4, color: '#faad14' },
  { name: '严重', value: 2, color: '#ff4d4f' }
])

const auditStatsData = ref([
  { type: '商家入驻审核', total: 28, approved: 22, rejected: 3, pending: 3, approveRate: '78.6%' },
  { type: '商旅方案审批', total: 15, approved: 12, rejected: 2, pending: 1, approveRate: '80.0%' },
  { type: '退款审批', total: 45, approved: 38, rejected: 5, pending: 2, approveRate: '84.4%' }
])

const inventoryOverviewData = ref([
  { name: '机票', value: 3200, color: '#1890ff' },
  { name: '酒店', value: 2800, color: '#52c41a' },
  { name: '租车', value: 1500, color: '#faad14' },
  { name: '文旅票务', value: 2100, color: '#722ed1' }
])

const resourceUsageData = ref([
  { label: '机票资源', rate: 82, color: '#1890ff' },
  { label: '酒店资源', rate: 68, color: '#52c41a' },
  { label: '租车资源', rate: 55, color: '#faad14' },
  { label: '文旅票务', rate: 73, color: '#722ed1' }
])

const lowInventoryData = ref([
  { name: '北京-三亚 机票', category: '机票', stock: 5, threshold: 20 },
  { name: '三亚希尔顿 海景房', category: '酒店', stock: 3, threshold: 10 },
  { name: '丽江古城 门票', category: '文旅', stock: 8, threshold: 30 },
  { name: '北京-成都 机票', category: '机票', stock: 2, threshold: 15 },
  { name: '厦门鼓浪屿 门票', category: '文旅', stock: 10, threshold: 25 }
])

const couponRedeemData = ref([
  { label: '满减券核销率', rate: 65, color: '#1890ff' },
  { label: '折扣券核销率', rate: 58, color: '#52c41a' },
  { label: '立减券核销率', rate: 72, color: '#faad14' },
  { label: '整体核销率', rate: 63, color: '#722ed1' }
])

const couponEffectData = ref([
  { name: '机票', value: 35, color: '#1890ff' },
  { name: '酒店', value: 30, color: '#52c41a' },
  { name: '租车', value: 15, color: '#faad14' },
  { name: '文旅票务', value: 20, color: '#722ed1' }
])

const conversionLabels = ref(['1月', '2月', '3月', '4月', '5月', '6月'])
const conversionDatasets = ref([
  { label: '发放量', data: [500, 600, 550, 700, 650, 800], color: '#1890ff' },
  { label: '核销量', data: [300, 380, 350, 450, 420, 520], color: '#52c41a' }
])

const fetchOrderData = () => {}
</script>

<style lang="scss" scoped>
.data-analysis {
  .filter-bar {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
    padding: 16px;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  .chart-card {
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    padding: 20px;

    .chart-title {
      font-size: 15px;
      font-weight: 600;
      margin: 0 0 16px;
    }
  }

  .rank-list {
    .rank-item {
      display: flex;
      align-items: center;
      padding: 10px 0;
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
        flex-shrink: 0;

        &.top {
          background: #ff4d4f;
          color: #fff;
        }
      }

      .rank-name {
        width: 120px;
        font-size: 13px;
        color: #333;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        flex-shrink: 0;
      }

      .rank-bar-wrap {
        flex: 1;
        height: 8px;
        background: #f0f0f0;
        border-radius: 4px;
        overflow: hidden;

        .rank-bar {
          height: 100%;
          background: #1890ff;
          border-radius: 4px;
          transition: width 0.6s;
        }
      }

      .rank-amount {
        width: 80px;
        text-align: right;
        font-size: 13px;
        font-weight: 600;
        color: #333;
        flex-shrink: 0;
      }
    }
  }

  .violation-detail {
    .violation-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 0;
      font-size: 13px;
      color: #666;

      .violation-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
      }
    }
  }

  .usage-list,
  .coupon-rate-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
}
</style>
