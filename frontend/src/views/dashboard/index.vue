<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { formatPlayCount, formatNumber } from '@/utils'
import { CONTENT_AUDIT_STATUS, getEnumLabel, CONTENT_CATEGORY, getEnumOptions } from '@/constants/enums'
import { useUserStore } from '@/stores'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)

const quickActions = [
  { label: '内容管理', icon: 'Film', path: '/contents', color: '#409EFF', count: 12586, desc: '全部内容' },
  { label: '内容审核', icon: 'Checked', path: '/content-audit', color: '#E6A23C', count: 328, desc: '待审核' },
  { label: '版权管理', icon: 'Document', path: '/copyrights', color: '#67C23A', count: 486, desc: '有效版权' },
  { label: '广告投放', icon: 'Promotion', path: '/advertisements', color: '#722ed1', count: 68, desc: '进行中' },
  { label: '活动运营', icon: 'Present', path: '/activities', color: '#F56C6C', count: 12, desc: '进行中' },
  { label: '用户管理', icon: 'User', path: '/system/users', color: '#13c2c2', count: 156, desc: '活跃用户' },
]

const todayStats = [
  { title: '今日新增内容', value: '126', icon: 'DocumentAdd', color: '#409EFF', trend: '+12.5%', trendType: 'success' },
  { title: '审核通过', value: '89', icon: 'CircleCheck', color: '#67C23A', trend: '+8.3%', trendType: 'success' },
  { title: '审核驳回', value: '15', icon: 'CircleClose', color: '#F56C6C', trend: '-5.2%', trendType: 'success' },
  { title: '总播放量', value: '856.2万', icon: 'View', color: '#722ed1', trend: '+15.8%', trendType: 'success' },
]

const recentContents = ref([
  { id: 1, title: '流浪地球3', category: 1, auditStatus: 2, playCount: 12586000, rating: 9.5, createdAt: '2024-01-15 10:30:00' },
  { id: 2, title: '狂飙（第二季）', category: 2, auditStatus: 1, playCount: 8523000, rating: 9.2, createdAt: '2024-01-15 09:20:00' },
  { id: 3, title: '极限挑战 第12季', category: 3, auditStatus: 2, playCount: 6325000, rating: 8.8, createdAt: '2024-01-14 18:45:00' },
  { id: 4, title: '斗罗大陆', category: 4, auditStatus: 3, playCount: 15689000, rating: 9.1, createdAt: '2024-01-14 15:30:00' },
  { id: 5, title: '航拍中国 第四季', category: 5, auditStatus: 0, playCount: 2536000, rating: 9.6, createdAt: '2024-01-14 12:00:00' },
])

const auditProgress = computed(() => [
  { type: 'success', label: '审核通过', value: 6852, percent: 68, color: '#67C23A' },
  { type: 'warning', label: '待审核', value: 1856, percent: 19, color: '#E6A23C' },
  { type: 'primary', label: '审核中', value: 623, percent: 6, color: '#409EFF' },
  { type: 'danger', label: '已驳回', value: 755, percent: 7, color: '#F56C6C' },
])

const categoryDist = computed(() => [
  { label: '电影', value: 3580, color: '#409EFF' },
  { label: '电视剧', value: 4820, color: '#67C23A' },
  { label: '综艺', value: 1250, color: '#E6A23C' },
  { label: '动漫', value: 1860, color: '#F56C6C' },
  { label: '纪录片', value: 680, color: '#722ed1' },
  { label: '其他', value: 396, color: '#909399' },
])

const totalCategory = computed(() => categoryDist.value.reduce((sum, item) => sum + item.value, 0))

const handleAction = (path: string) => {
  router.push(path)
}

const goContent = (id: number) => {
  router.push('/contents')
}

onMounted(() => {
})
</script>

<template>
  <div class="dashboard-page">
    <div class="welcome-banner card-content">
      <div class="banner-left">
        <h2 class="welcome-title">
          👋 欢迎回来，{{ userStore.userInfo?.realName || userStore.username }}
        </h2>
        <p class="welcome-desc">
          今天是个好日子，系统中共有 <b style="color: #409EFF">12,586</b> 条内容，
          待审核 <b style="color: #E6A23C">328</b> 条，
          快去处理吧！
        </p>
      </div>
      <div class="banner-right">
        <el-button type="primary" :icon="Plus" size="large" @click="$router.push('/contents')">
          新增内容
        </el-button>
        <el-button :icon="Checked" size="large" @click="$router.push('/content-audit')">
          去审核
        </el-button>
      </div>
    </div>

    <div class="quick-grid">
      <div
        v-for="(action, index) in quickActions"
        :key="index"
        class="quick-card card-content"
        :style="{ borderTopColor: action.color }"
        @click="handleAction(action.path)"
      >
        <div class="quick-icon" :style="{ backgroundColor: action.color + '15', color: action.color }">
          <el-icon :size="28"><component :is="action.icon" /></el-icon>
        </div>
        <div class="quick-info">
          <div class="quick-label">{{ action.label }}</div>
          <div class="quick-count" :style="{ color: action.color }">{{ formatNumber(action.count) }}</div>
          <div class="quick-desc">{{ action.desc }}</div>
        </div>
        <el-icon class="quick-arrow"><ArrowRight /></el-icon>
      </div>
    </div>

    <div class="stats-grid">
      <div
        v-for="(stat, index) in todayStats"
        :key="index"
        class="stat-card card-content"
      >
        <div class="stat-header">
          <span class="stat-title">{{ stat.title }}</span>
          <div class="stat-icon" :style="{ backgroundColor: stat.color + '15', color: stat.color }">
            <el-icon :size="20"><component :is="stat.icon" /></el-icon>
          </div>
        </div>
        <div class="stat-value" :style="{ color: stat.color }">{{ stat.value }}</div>
        <div class="stat-trend" :class="stat.trendType">
          <el-icon><component :is="stat.trend.startsWith('+') ? 'Top' : 'Bottom'" /></el-icon>
          <span>{{ stat.trend }} 较昨日</span>
        </div>
      </div>
    </div>

    <el-row :gutter="16">
      <el-col :xs="24" :sm="24" :md="12">
        <div class="chart-card card-content">
          <div class="card-header flex-between">
            <span class="card-title">审核进度统计</span>
            <el-tag size="small" type="info">累计: {{ formatNumber(10086) }}</el-tag>
          </div>
          <div class="progress-list">
            <div v-for="item in auditProgress" :key="item.type" class="progress-item">
              <div class="progress-label-row">
                <el-tag size="small" :color="item.color + '15'" :style="{ color: item.color, borderColor: 'transparent' }">
                  {{ item.label }}
                </el-tag>
                <span class="progress-value">{{ formatNumber(item.value) }} ({{ item.percent }}%)</span>
              </div>
              <el-progress
                :percentage="item.percent"
                :color="item.color"
                :stroke-width="10"
                :show-text="false"
              />
            </div>
          </div>
        </div>
      </el-col>

      <el-col :xs="24" :sm="24" :md="12">
        <div class="chart-card card-content">
          <div class="card-header flex-between">
            <span class="card-title">内容分类分布</span>
            <el-tag size="small" type="info">总计: {{ formatNumber(totalCategory) }}</el-tag>
          </div>
          <div class="category-list">
            <div v-for="item in categoryDist" :key="item.label" class="category-item">
              <div class="category-left">
                <span class="category-dot" :style="{ backgroundColor: item.color }"></span>
                <span class="category-label">{{ item.label }}</span>
              </div>
              <div class="category-right">
                <span class="category-count">{{ formatNumber(item.value) }}</span>
                <span class="category-percent">
                  {{ ((item.value / totalCategory) * 100).toFixed(1) }}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <div class="recent-section card-content">
      <div class="card-header flex-between">
        <span class="card-title">最新内容</span>
        <el-button type="primary" link :icon="ArrowRight" @click="$router.push('/contents')">
          查看全部
        </el-button>
      </div>
      <el-table :data="recentContents" stripe style="width: 100%">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="title" label="内容标题" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="table-link" @click="goContent(row.id)">{{ row.title }}</span>
          </template>
        </el-table-column>
        <el-table-column label="分类" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small">{{ getEnumLabel(CONTENT_CATEGORY, row.category) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="评分" width="100" align="center">
          <template #default="{ row }">
            <span style="color: #E6A23C; font-weight: 600">★ {{ row.rating }}</span>
          </template>
        </el-table-column>
        <el-table-column label="播放量" width="120" align="center">
          <template #default="{ row }">
            {{ formatPlayCount(row.playCount) }}
          </template>
        </el-table-column>
        <el-table-column label="审核状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag
              :type="row.auditStatus === 2 ? 'success' : row.auditStatus === 0 ? 'warning' : row.auditStatus === 1 ? 'primary' : 'danger'"
              size="small"
            >
              {{ getEnumLabel(CONTENT_AUDIT_STATUS, row.auditStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="提交时间" width="180" align="center" />
      </el-table>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.welcome-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.08) 0%, rgba(103, 194, 58, 0.08) 100%);
  border-left: 4px solid $primary-color;
}

.welcome-title {
  font-size: $font-xl;
  font-weight: 600;
  color: $text-primary;
  margin: 0 0 8px;
}

.welcome-desc {
  font-size: $font-sm;
  color: $text-secondary;
  margin: 0;
  line-height: 1.6;
}

.banner-right {
  display: flex;
  gap: 12px;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.quick-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  cursor: pointer;
  border-top: 3px solid;
  transition: $transition-base;

  &:hover {
    transform: translateY(-2px);
    box-shadow: $shadow-base;
  }
}

.quick-icon {
  width: 56px;
  height: 56px;
  border-radius: $radius-md;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.quick-info {
  flex: 1;
  min-width: 0;
}

.quick-label {
  font-size: $font-sm;
  color: $text-secondary;
  margin-bottom: 4px;
}

.quick-count {
  font-size: $font-2xl;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 4px;
}

.quick-desc {
  font-size: $font-xs;
  color: $text-placeholder;
}

.quick-arrow {
  color: $text-placeholder;
  transition: $transition-base;
}

.quick-card:hover .quick-arrow {
  color: $primary-color;
  transform: translateX(4px);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.stat-card {
  padding: 20px;
}

.stat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.stat-title {
  font-size: $font-sm;
  color: $text-secondary;
}

.stat-icon {
  width: 36px;
  height: 36px;
  border-radius: $radius-sm;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 8px;
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: $font-xs;

  &.success {
    color: $success-color;
  }
  &.danger {
    color: $danger-color;
  }
}

.card-header {
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid $border-lighter;
}

.card-title {
  font-size: $font-md;
  font-weight: 600;
  color: $text-primary;
}

.chart-card {
  min-height: 320px;
  margin-bottom: 16px;
}

.progress-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.progress-item {
  .progress-label-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }
  .progress-value {
    font-size: $font-sm;
    font-weight: 500;
    color: $text-primary;
  }
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.category-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 12px;
  border-bottom: 1px dashed $border-light;

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
}

.category-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.category-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.category-label {
  font-size: $font-sm;
  color: $text-regular;
}

.category-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.category-count {
  font-size: $font-sm;
  font-weight: 600;
  color: $text-primary;
}

.category-percent {
  font-size: $font-xs;
  color: $text-secondary;
  min-width: 50px;
  text-align: right;
}

.recent-section {
  min-height: 300px;
}

.table-link {
  color: $primary-color;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
}

.flex-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
