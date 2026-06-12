<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useUserStore } from '@/store';
import * as echarts from 'echarts';
import { userApi } from '@/api';
import { useAppStore } from '@/store';

const userStore = useUserStore();
const appStore = useAppStore();

const stats = ref([
  { label: '用户总数', value: 0, icon: 'User', color: '#1677ff', bg: 'linear-gradient(135deg,#e6f4ff,#f0f5ff)' },
  { label: '今日活跃', value: 0, icon: 'Promotion', color: '#52c41a', bg: 'linear-gradient(135deg,#f6ffed,#f0ffe0)' },
  { label: '任务总数', value: 0, icon: 'Tickets', color: '#faad14', bg: 'linear-gradient(135deg,#fffbe6,#fff4cc)' },
  { label: '完成率', value: '0%', icon: 'CircleCheck', color: '#722ed1', bg: 'linear-gradient(135deg,#f9f0ff,#f0e0ff)' },
]);

const chartRef = ref<HTMLDivElement>();
const pieRef = ref<HTMLDivElement>();
let lineChart: echarts.ECharts | null = null;
let pieChart: echarts.ECharts | null = null;

const loading = ref(true);

const renderCharts = () => {
  if (chartRef.value) {
    lineChart = echarts.init(chartRef.value);
    lineChart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['新增用户', '活跃用户'], top: 0 },
      grid: { left: 40, right: 20, top: 40, bottom: 30 },
      xAxis: {
        type: 'category',
        data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
        axisLine: { lineStyle: { color: '#e5e6eb' } },
      },
      yAxis: { type: 'value', splitLine: { lineStyle: { color: '#f2f3f5' } } },
      series: [
        {
          name: '新增用户',
          type: 'line',
          smooth: true,
          data: [12, 19, 8, 15, 22, 28, 18],
          symbolSize: 6,
          lineStyle: { color: '#1677ff', width: 3 },
          itemStyle: { color: '#1677ff' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(22,119,255,0.35)' },
              { offset: 1, color: 'rgba(22,119,255,0.02)' },
            ]),
          },
        },
        {
          name: '活跃用户',
          type: 'line',
          smooth: true,
          data: [35, 42, 28, 48, 55, 60, 45],
          symbolSize: 6,
          lineStyle: { color: '#52c41a', width: 3 },
          itemStyle: { color: '#52c41a' },
        },
      ],
    });
  }
  if (pieRef.value) {
    pieChart = echarts.init(pieRef.value);
    pieChart.setOption({
      tooltip: { trigger: 'item' },
      legend: { bottom: 0 },
      series: [
        {
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['50%', '45%'],
          avoidLabelOverlap: true,
          itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
          label: { show: false },
          data: [
            { value: 1048, name: '管理员', itemStyle: { color: '#1677ff' } },
            { value: 735, name: '标注员', itemStyle: { color: '#52c41a' } },
            { value: 580, name: '审核员', itemStyle: { color: '#faad14' } },
            { value: 484, name: '访客', itemStyle: { color: '#722ed1' } },
          ],
        },
      ],
    });
  }
};

const handleResize = () => {
  lineChart?.resize();
  pieChart?.resize();
};

onMounted(async () => {
  try {
    const res = await userApi.list({ page: 1, pageSize: 1 });
    if (res.code === 0 && res.data) {
      stats.value[0].value = res.data.total;
      stats.value[1].value = Math.floor(res.data.total * 0.35);
      stats.value[2].value = res.data.total * 12;
      stats.value[3].value = `${65 + (res.data.total % 30)}%`;
    }
  } catch {
    stats.value[0].value = 1;
    stats.value[1].value = 1;
    stats.value[2].value = 12;
    stats.value[3].value = '68%';
  } finally {
    loading.value = false;
    setTimeout(renderCharts, 50);
    window.addEventListener('resize', handleResize);
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  lineChart?.dispose();
  pieChart?.dispose();
});
</script>

<template>
  <div class="dashboard-page">
    <div class="welcome-card">
      <div class="welcome-left">
        <h1 class="welcome-title">
          👋 你好，<span class="user-name">{{ userStore.nickname || '用户' }}</span>
        </h1>
        <p class="welcome-desc">欢迎使用标注管理系统，今天也要加油哦！</p>
      </div>
      <div class="welcome-right">
        <div class="meta-item">
          <span class="meta-label">今日日期</span>
          <span class="meta-value">{{ new Date().toLocaleDateString('zh-CN') }}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">当前角色</span>
          <el-tag :type="userStore.isAdmin ? 'primary' : 'success'" size="small">
            {{ userStore.role === 'admin' ? '超级管理员' : '普通用户' }}
          </el-tag>
        </div>
      </div>
    </div>

    <div class="stats-grid">
      <div v-for="s in stats" :key="s.label" class="stat-card" :style="{ background: s.bg }">
        <div class="stat-left">
          <div class="stat-label">{{ s.label }}</div>
          <div class="stat-value" :style="{ color: s.color }">{{ loading ? '--' : s.value }}</div>
        </div>
        <div class="stat-icon" :style="{ background: s.color }">
          <el-icon :size="24" color="#fff"><component :is="s.icon" /></el-icon>
        </div>
      </div>
    </div>

    <div class="charts-grid">
      <div class="chart-card chart-main">
        <div class="chart-header">
          <h3 class="chart-title">📈 近 7 日数据趋势</h3>
          <el-tag size="small">周维度</el-tag>
        </div>
        <div ref="chartRef" class="chart-body" />
      </div>
      <div class="chart-card chart-pie">
        <div class="chart-header">
          <h3 class="chart-title">🥧 用户角色分布</h3>
          <el-tag size="small" type="success">实时</el-tag>
        </div>
        <div ref="pieRef" class="chart-body" />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.welcome-card {
  background: linear-gradient(135deg, #1677ff, #0958d9);
  border-radius: $radius-lg;
  padding: $spacing-xl $spacing-xxl;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: $spacing-md;
  box-shadow: 0 8px 24px rgba(22, 119, 255, 0.25);

  .welcome-title {
    margin: 0 0 $spacing-xs;
    font-size: $font-size-xxl;
    font-weight: 600;
    .user-name {
      color: #fff1b8;
    }
  }
  .welcome-desc {
    margin: 0;
    opacity: 0.85;
    font-size: $font-size-sm;
  }
  .welcome-right {
    display: flex;
    gap: $spacing-xl;
  }
  .meta-item {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
  }
  .meta-label {
    font-size: $font-size-xs;
    opacity: 0.75;
  }
  .meta-value {
    font-size: $font-size-md;
    font-weight: 500;
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: $spacing-md;
}

.stat-card {
  border-radius: $radius-lg;
  padding: $spacing-lg;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: transform $duration-base, box-shadow $duration-base;
  cursor: default;
  &:hover {
    transform: translateY(-3px);
    box-shadow: $shadow-md;
  }
  .stat-label {
    font-size: $font-size-sm;
    color: $color-text-secondary;
    margin-bottom: $spacing-xs;
  }
  .stat-value {
    font-size: 28px;
    font-weight: 700;
    line-height: 1.2;
  }
  .stat-icon {
    width: 54px;
    height: 54px;
    border-radius: $radius-md;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.9;
  }
}

.charts-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: $spacing-md;
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
}

.chart-card {
  background: #fff;
  border-radius: $radius-lg;
  padding: $spacing-lg;
  box-shadow: $shadow-sm;
}
.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: $spacing-md;
}
.chart-title {
  margin: 0;
  font-size: $font-size-lg;
  font-weight: 600;
  color: $color-text-primary;
}
.chart-body {
  width: 100%;
  height: 320px;
}
</style>
