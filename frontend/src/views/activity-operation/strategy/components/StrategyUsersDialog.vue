<template>
  <el-dialog
    :model-value="modelValue"
    :title="`策略关联用户 - ${strategy?.strategyName || ''}`"
    width="860px"
    :close-on-click-modal="false"
    @update:model-value="handleVisibleChange"
  >
    <div v-if="strategy" class="strategy-header">
      <div class="strategy-basic">
        <el-tag
          :type="getStrategyTagType(strategy.strategyType)"
          effect="light"
          size="default"
        >
          {{ OPERATION_STRATEGY_NAMES[strategy.strategyType] || strategy.strategyType }}
        </el-tag>
        <el-tag
          :color="ACTIVITY_LEVEL_COLORS[Number(strategy.targetActivityLevel)]"
          effect="dark"
          size="small"
        >
          目标：{{ ACTIVITY_LEVEL_NAMES[Number(strategy.targetActivityLevel)] }}
        </el-tag>
        <el-tag
          :type="strategy.status === 1 ? 'success' : 'info'"
          effect="plain"
          size="small"
        >
          {{ strategy.status === 1 ? '已启用' : '已停用' }}
        </el-tag>
      </div>
      <div class="strategy-stats">
        <div class="stat-item">
          <span class="stat-label">累计应用</span>
          <span class="stat-value">{{ strategy.applyCount || 0 }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">成功数</span>
          <span class="stat-value success">{{ strategy.successCount || 0 }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">失败数</span>
          <span class="stat-value danger">{{ strategy.failCount || 0 }}</span>
        </div>
      </div>
    </div>

    <el-divider style="margin: 16px 0" />

    <div class="user-search-bar">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索用户昵称或UID"
        clearable
        style="width: 240px"
        :prefix-icon="Search"
        @keyup.enter="handleSearch"
      />
      <el-select
        v-model="filterLevel"
        placeholder="用户等级"
        clearable
        style="width: 140px"
      >
        <el-option
          v-for="(name, value) in ACTIVITY_LEVEL_NAMES"
          :key="value"
          :label="name"
          :value="Number(value)"
        />
      </el-select>
      <el-button type="primary" @click="handleSearch">查询</el-button>
      <el-button @click="handleResetFilter">重置</el-button>
      <div class="user-count">
        共 <span class="count-num">{{ filteredUsers.length }}</span> 位用户
      </div>
    </div>

    <div v-if="loading" class="skeleton-area">
      <el-skeleton :rows="5" animated />
    </div>

    <template v-else>
      <el-table
        :data="paginatedUsers"
        height="400"
        max-height="400"
        stripe
        row-key="id"
      >
        <el-table-column label="用户信息" min-width="220">
          <template #default="{ row }">
            <div class="user-cell">
              <el-avatar :size="40" :src="row.avatar">
                {{ row.nickname?.charAt(0) }}
              </el-avatar>
              <div class="user-detail">
                <div class="user-name">
                  {{ row.nickname }}
                  <el-tag
                    :color="ACTIVITY_LEVEL_COLORS[row.activityLevel]"
                    effect="dark"
                    size="small"
                    class="level-tag"
                  >
                    {{ ACTIVITY_LEVEL_NAMES[row.activityLevel] }}
                  </el-tag>
                </div>
                <div class="user-sub">
                  <span>UID: {{ row.id }}</span>
                  <span v-if="row.username">{{ row.username }}</span>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="活跃分值" width="140">
          <template #default="{ row }">
            <div class="score-cell">
              <el-progress
                :percentage="row.activityScore || 0"
                :stroke-width="8"
                :color="ACTIVITY_LEVEL_COLORS[row.activityLevel]"
                :show-text="true"
              />
            </div>
          </template>
        </el-table-column>

        <el-table-column label="策略应用时间" width="180">
          <template #default="{ row }">
            <div class="time-cell">
              <div class="time-main">{{ formatDateTime(row.applyTime) }}</div>
              <div class="time-type">
                <el-tag
                  :type="row.applyType === 'auto' ? 'warning' : 'primary'"
                  effect="light"
                  size="small"
                >
                  {{ row.applyType === 'auto' ? '自动适配' : '手动应用' }}
                </el-tag>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="策略状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag
              :type="row.strategyStatus === 'active' ? 'success' : 'info'"
              size="small"
            >
              {{ row.strategyStatus === 'active' ? '生效中' : '已失效' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="上次活动" width="160">
          <template #default="{ row }">
            <div class="last-activity">
              <div class="activity-time">
                {{ row.lastActiveTime ? formatDateTime(row.lastActiveTime) : '-' }}
              </div>
              <div class="activity-days" v-if="row.inactiveDays !== undefined">
                <el-tag
                  v-if="row.inactiveDays >= 7"
                  type="danger"
                  effect="light"
                  size="small"
                >
                  沉睡 {{ row.inactiveDays }} 天
                </el-tag>
                <el-tag
                  v-else-if="row.inactiveDays >= 3"
                  type="warning"
                  effect="light"
                  size="small"
                >
                  低活跃 {{ row.inactiveDays }} 天
                </el-tag>
                <el-tag
                  v-else
                  type="success"
                  effect="light"
                  size="small"
                >
                  活跃
                </el-tag>
              </div>
            </div>
          </template>
        </el-table-column>

        <template #empty>
          <div class="empty-tip">
            <el-empty description="暂无关联用户" />
          </div>
        </template>
      </el-table>

      <div v-if="filteredUsers.length > 0" class="pagination-area">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50]"
          :total="filteredUsers.length"
          :background="true"
          layout="total, sizes, prev, pager, next, jumper"
        />
      </div>
    </template>

    <template #footer>
      <div class="footer-actions">
        <el-tag type="info" effect="plain" size="small">
          等级变更后自动联动适配策略
        </el-tag>
        <div>
          <el-button @click="handleVisibleChange(false)">关闭</el-button>
          <el-button type="primary" @click="handleRefresh">
            <el-icon style="margin-right: 4px"><Refresh /></el-icon>
            刷新数据
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { Search, Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { formatDateTime } from '@hooks/index'
import type { ActivityStrategy } from '@/types/business'
import {
  OperationStrategyType,
  OPERATION_STRATEGY_NAMES,
  ActivityLevel,
  ACTIVITY_LEVEL_NAMES,
  ACTIVITY_LEVEL_COLORS
} from '@/enums/business'

interface StrategyUser {
  id: number
  nickname: string
  avatar: string
  username: string
  activityLevel: number
  activityScore: number
  applyTime: string
  applyType: 'auto' | 'manual'
  strategyStatus: 'active' | 'expired'
  lastActiveTime: string
  inactiveDays: number
}

interface Props {
  modelValue: boolean
  strategy: ActivityStrategy | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
}>()

const loading = ref(false)
const searchKeyword = ref('')
const filterLevel = ref<number | undefined>(undefined)
const currentPage = ref(1)
const pageSize = ref(10)

const mockUsers = reactive<StrategyUser[]>(generateMockUsers())

const filteredUsers = computed(() => {
  return mockUsers.filter(user => {
    if (searchKeyword.value) {
      const kw = searchKeyword.value.toLowerCase()
      if (!user.nickname.toLowerCase().includes(kw) && !String(user.id).includes(kw)) {
        return false
      }
    }
    if (filterLevel.value !== undefined && user.activityLevel !== filterLevel.value) {
      return false
    }
    return true
  })
})

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredUsers.value.slice(start, start + pageSize.value)
})

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    handleRefresh()
  }
})

watch([searchKeyword, filterLevel], () => {
  currentPage.value = 1
})

function generateMockUsers(): StrategyUser[] {
  const levels = [ActivityLevel.SLEEPER, ActivityLevel.LOW, ActivityLevel.NORMAL, ActivityLevel.HIGH]
  const names = [
    '小明同学', '张三', '李四', '王五', '赵六', '钱七', '孙八', '周九',
    '吴十', '郑十一', '王小明', '李小红', '张三丰', '刘小华', '陈大伟',
    '杨晓峰', '黄志强', '周建国', '吴美玲', '郑凯文', '李思思', '王婷婷',
    '赵子龙', '孙悟空', '猪八戒', '沙和尚', '唐三藏', '贾宝玉', '林黛玉',
    '薛宝钗', '王熙凤', '史湘云', '秦可卿', '妙玉', '李纨', '贾探春'
  ]
  
  const users: StrategyUser[] = []
  for (let i = 0; i < 24; i++) {
    const level = levels[Math.floor(Math.random() * levels.length)]
    const scoreMap: Record<number, [number, number]> = {
      [ActivityLevel.SLEEPER]: [0, 19],
      [ActivityLevel.LOW]: [20, 49],
      [ActivityLevel.NORMAL]: [50, 79],
      [ActivityLevel.HIGH]: [80, 100]
    }
    const [minScore, maxScore] = scoreMap[level]
    const score = Math.floor(Math.random() * (maxScore - minScore + 1)) + minScore
    const daysAgo = Math.floor(Math.random() * 30)
    const applyDaysAgo = Math.floor(Math.random() * 60)
    const inactiveDays = level === ActivityLevel.SLEEPER 
      ? Math.floor(Math.random() * 20) + 8 
      : level === ActivityLevel.LOW 
        ? Math.floor(Math.random() * 5) + 3 
        : Math.floor(Math.random() * 3)

    users.push({
      id: 10000 + i,
      nickname: names[i % names.length] + (i >= names.length ? i : ''),
      avatar: '',
      username: `user_${10000 + i}`,
      activityLevel: level,
      activityScore: score,
      applyTime: new Date(Date.now() - applyDaysAgo * 86400000 - Math.random() * 86400000).toISOString(),
      applyType: Math.random() > 0.3 ? 'auto' : 'manual',
      strategyStatus: daysAgo < 30 ? 'active' : 'expired',
      lastActiveTime: new Date(Date.now() - daysAgo * 86400000).toISOString(),
      inactiveDays
    })
  }
  return users.sort((a, b) => new Date(b.applyTime).getTime() - new Date(a.applyTime).getTime())
}

const getStrategyTagType = (type: string): 'primary' | 'success' | 'warning' | 'danger' | 'info' => {
  const map: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'info'> = {
    [OperationStrategyType.FLOW_BOOST]: 'primary',
    [OperationStrategyType.ACTIVITY_PRIORITY]: 'success',
    [OperationStrategyType.WAKEUP_MESSAGE]: 'warning',
    [OperationStrategyType.BENEFIT_GRANT]: 'success',
    [OperationStrategyType.FOCUS_MAINTENANCE]: 'danger',
    [OperationStrategyType.CUSTOM]: 'info'
  }
  return map[type] || 'info'
}

const handleVisibleChange = (val: boolean) => {
  emit('update:modelValue', val)
}

const handleSearch = () => {
  currentPage.value = 1
}

const handleResetFilter = () => {
  searchKeyword.value = ''
  filterLevel.value = undefined
  currentPage.value = 1
}

const handleRefresh = async () => {
  loading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 600))
    Object.assign(mockUsers, generateMockUsers())
    ElMessage.success('数据已刷新')
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.strategy-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;

  .strategy-basic {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .strategy-stats {
    display: flex;
    gap: 24px;

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 60px;

      .stat-label {
        font-size: 12px;
        color: $text-placeholder;
        margin-bottom: 4px;
      }

      .stat-value {
        font-size: 20px;
        font-weight: 700;
        color: $text-primary;

        &.success {
          color: #67c23a;
        }

        &.danger {
          color: #f56c6c;
        }
      }
    }
  }
}

.user-search-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;

  .user-count {
    margin-left: auto;
    font-size: 13px;
    color: $text-secondary;

    .count-num {
      font-weight: 600;
      color: $color-primary;
      font-size: 15px;
    }
  }
}

.skeleton-area {
  padding: 16px 0;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 10px;

  .user-detail {
    .user-name {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 600;
      color: $text-primary;
      margin-bottom: 2px;

      .level-tag {
        font-size: 11px;
      }
    }

    .user-sub {
      display: flex;
      gap: 10px;
      font-size: 12px;
      color: $text-placeholder;
    }
  }
}

.score-cell {
  padding: 4px 0;
}

.time-cell {
  .time-main {
    font-size: 12px;
    color: $text-secondary;
    margin-bottom: 4px;
  }
}

.last-activity {
  .activity-time {
    font-size: 12px;
    color: $text-secondary;
    margin-bottom: 4px;
  }
}

.empty-tip {
  padding: 40px 0;
}

.pagination-area {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.footer-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}
</style>
