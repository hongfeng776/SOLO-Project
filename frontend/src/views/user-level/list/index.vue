<template>
  <div class="page-container">
    <el-card shadow="never" class="mb-20">
      <el-form :model="queryParams" label-width="100px" inline @submit.prevent>
        <el-form-item label="用户UID">
          <el-input
            v-model="queryParams.uid"
            placeholder="请输入用户UID"
            clearable
            style="width: 160px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="昵称">
          <el-input
            v-model="queryParams.nickname"
            placeholder="请输入昵称"
            clearable
            style="width: 160px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="等级">
          <el-select
            v-model="queryParams.userLevel"
            placeholder="全部等级"
            clearable
            style="width: 140px"
          >
            <el-option
              v-for="(name, value) in USER_LEVEL_NAMES"
              :key="value"
              :label="name"
              :value="Number(value)"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="分值区间">
          <el-input
            v-model="queryParams.minScore"
            placeholder="最低分"
            clearable
            style="width: 100px"
            type="number"
          />
          <span style="margin: 0 8px">-</span>
          <el-input
            v-model="queryParams.maxScore"
            placeholder="最高分"
            clearable
            style="width: 100px"
            type="number"
          />
        </el-form-item>
        <el-form-item label="账号状态">
          <el-select
            v-model="queryParams.status"
            placeholder="全部状态"
            clearable
            style="width: 140px"
          >
            <el-option label="正常" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="永久封禁">
          <el-select
            v-model="queryParams.isPermanentBanned"
            placeholder="全部"
            clearable
            style="width: 120px"
          >
            <el-option label="是" :value="1" />
            <el-option label="否" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="更新时间">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 260px"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            :icon="Search"
            :loading="loading"
            @click="handleSearch"
          >
            查询
          </el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">用户等级列表</span>
          <div class="header-actions">
            <el-tag v-if="permission.canBatchUpgrade" type="success" effect="light">可批量升级</el-tag>
            <el-tag v-if="permission.canBatchDowngrade" type="warning" effect="light">可批量降级</el-tag>
          </div>
        </div>
      </template>

      <HtTable
        :data="dataList"
        :loading="loading"
        :total="total"
        v-model:page="queryParams.page"
        v-model:page-size="queryParams.pageSize"
        show-index
        row-key="id"
        @paginate="handlePaginate"
      >
        <el-table-column label="用户信息" min-width="220">
          <template #default="{ row }">
            <div class="user-info">
              <div class="avatar-wrapper">
                <el-avatar :size="44" :src="row.avatar">{{ row.nickname?.charAt(0) }}</el-avatar>
                <el-tag
                  v-if="row.userLevel === UserLevel.RESTRICTED"
                  class="level-tag restricted-tag"
                  :color="USER_LEVEL_COLORS[row.userLevel]"
                  size="small"
                  effect="dark"
                >
                  {{ USER_LEVEL_NAMES[row.userLevel] }}
                </el-tag>
                <el-tag
                  v-else
                  class="level-tag"
                  :color="USER_LEVEL_COLORS[row.userLevel]"
                  size="small"
                  effect="dark"
                >
                  {{ USER_LEVEL_NAMES[row.userLevel] }}
                </el-tag>
              </div>
              <div class="info-text">
                <div class="user-name">
                  {{ row.nickname }}
                  <span class="user-uid">UID: {{ row.id }}</span>
                </div>
                <div class="user-extra">
                  <span>{{ row.username }}</span>
                  <el-tag
                    v-if="row.isPermanentBanned === 1"
                    type="danger"
                    size="small"
                    effect="plain"
                  >
                    永久封禁
                  </el-tag>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="等级分值" min-width="280">
          <template #default="{ row }">
            <div class="score-section">
              <div class="score-header">
                <span class="score-label">总分：</span>
                <span class="score-value" :style="{ color: getScoreColor(row.levelScore) }">
                  {{ row.levelScore }}
                </span>
                <span class="score-max">/ 100</span>
                <el-tooltip
                  placement="top"
                  :show-after="300"
                >
                  <template #content>
                    <div class="score-tooltip">
                      <div class="tooltip-title">分值明细</div>
                      <div
                        v-for="(factor, key) in LevelScoreFactor"
                        :key="key"
                        class="score-item"
                      >
                        <span class="factor-name">{{ LEVEL_SCORE_FACTOR_NAMES[factor] }}</span>
                        <span class="factor-score">{{ row.levelScoreDetail?.[factor] || 0 }}</span>
                        <span class="factor-weight">({{ LEVEL_SCORE_FACTOR_WEIGHTS[factor] }}%)</span>
                      </div>
                      <div class="tooltip-footer">
                        <el-divider style="margin: 8px 0" />
                        <div class="threshold-info">
                          <div v-if="row.userLevel < UserLevel.PREMIUM">
                            下一等级({{ USER_LEVEL_NAMES[row.userLevel + 1] }})需要
                            <span class="highlight">{{ LEVEL_SCORE_THRESHOLDS[row.userLevel + 1] }}</span>分
                          </div>
                          <div v-else>已达最高等级</div>
                        </div>
                      </div>
                    </div>
                  </template>
                  <el-icon class="info-icon"><InfoFilled /></el-icon>
                </el-tooltip>
              </div>
              <el-progress
                :percentage="row.levelScore || 0"
                :stroke-width="10"
                :color="getScoreColor(row.levelScore)"
              />
              <div class="threshold-markers">
                <span
                  v-for="(threshold, level) in LEVEL_SCORE_THRESHOLDS"
                  :key="level"
                  class="threshold-marker"
                  :style="{ left: threshold + '%' }"
                >
                  <span class="threshold-line"></span>
                  <span class="threshold-label">{{ USER_LEVEL_NAMES[level] }} {{ threshold }}分</span>
                </span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="权益配置" min-width="200">
          <template #default="{ row }">
            <div class="benefits-section">
              <div class="benefits-list">
                <el-tooltip
                  v-for="benefit in USER_LEVEL_BENEFITS[row.userLevel]?.slice(0, 4) || []"
                  :key="benefit"
                  :content="USER_BENEFIT_NAMES[benefit]"
                  placement="top"
                >
                  <el-tag
                    type="success"
                    effect="light"
                    size="small"
                    class="benefit-tag"
                  >
                    {{ USER_BENEFIT_NAMES[benefit] }}
                  </el-tag>
                </el-tooltip>
                <el-tooltip
                  v-if="(USER_LEVEL_BENEFITS[row.userLevel]?.length || 0) > 4"
                  placement="top"
                >
                  <template #content>
                    <div class="more-benefits">
                      <div
                        v-for="benefit in USER_LEVEL_BENEFITS[row.userLevel]?.slice(4)"
                        :key="benefit"
                        class="benefit-item"
                      >
                        {{ USER_BENEFIT_NAMES[benefit] }}
                      </div>
                    </div>
                  </template>
                  <el-tag type="info" effect="light" size="small">
                    +{{ (USER_LEVEL_BENEFITS[row.userLevel]?.length || 0) - 4 }}
                  </el-tag>
                </el-tooltip>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="更新时间" width="180">
          <template #default="{ row }">
            <div class="time-column">
              <div class="time-item">
                {{ row.levelLastUpdateTime ? formatDateTime(row.levelLastUpdateTime) : '-' }}
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="260" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              size="small"
              @click="handleViewDetail(row)"
            >
              详情
            </el-button>

            <el-tooltip
              v-if="!canAdjustLevel(row, UserLevel.ACTIVE) && permission.canUpgrade"
              placement="top"
              :show-after="200"
            >
              <template #content>
                <div class="adjust-tooltip">
                  <div class="tooltip-title">升级到活跃用户</div>
                  <div class="tooltip-content">
                    <div class="requirement">需要分值：{{ LEVEL_SCORE_THRESHOLDS[UserLevel.ACTIVE] }}分</div>
                    <div class="current">当前分值：{{ row.levelScore }}分</div>
                    <div class="gap">还差：{{ LEVEL_SCORE_THRESHOLDS[UserLevel.ACTIVE] - row.levelScore }}分</div>
                  </div>
                </div>
              </template>
              <el-button link type="success" size="small" disabled>升级</el-button>
            </el-tooltip>
            <el-button
              v-else-if="permission.canUpgrade && row.userLevel < UserLevel.PREMIUM"
              link
              type="success"
              size="small"
              @click="handleAdjustLevel(row, row.userLevel + 1)"
            >
              升级
            </el-button>

            <el-tooltip
              v-if="!canAdjustLevel(row, UserLevel.PREMIUM) && permission.canUpgrade && row.userLevel === UserLevel.ACTIVE"
              placement="top"
              :show-after="200"
            >
              <template #content>
                <div class="adjust-tooltip">
                  <div class="tooltip-title">升级到优质用户</div>
                  <div class="tooltip-content">
                    <div class="requirement">需要分值：{{ LEVEL_SCORE_THRESHOLDS[UserLevel.PREMIUM] }}分</div>
                    <div class="current">当前分值：{{ row.levelScore }}分</div>
                    <div class="gap">还差：{{ LEVEL_SCORE_THRESHOLDS[UserLevel.PREMIUM] - row.levelScore }}分</div>
                  </div>
                </div>
              </template>
              <el-button link type="warning" size="small" disabled>优质</el-button>
            </el-tooltip>
            <el-button
              v-else-if="permission.canUpgrade && row.userLevel === UserLevel.ACTIVE"
              link
              type="warning"
              size="small"
              @click="handleAdjustLevel(row, UserLevel.PREMIUM)"
            >
              优质
            </el-button>

            <el-button
              v-if="permission.canDowngrade && row.userLevel > UserLevel.RESTRICTED"
              link
              type="danger"
              size="small"
              @click="handleAdjustLevel(row, row.userLevel - 1)"
            >
              降级
            </el-button>
          </template>
        </el-table-column>
      </HtTable>
    </el-card>

    <LevelAdjustDialog
      v-model="adjustDialogVisible"
      :user-id="currentUserId"
      :target-level="targetLevel"
      :current-level="currentLevel"
      @adjusted="handleDataUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Search, Refresh, InfoFilled } from '@element-plus/icons-vue'
import { useUserStore } from '@stores/modules/user'
import { useFetchList, formatDateTime } from '@hooks/index'
import { getLevelList } from '@api/user-level'
import type { LevelListUser, UserLevelPermission } from '@/types/business'
import {
  UserLevel,
  USER_LEVEL_NAMES,
  USER_LEVEL_COLORS,
  USER_BENEFIT_NAMES,
  USER_LEVEL_BENEFITS,
  LevelScoreFactor,
  LEVEL_SCORE_FACTOR_NAMES,
  LEVEL_SCORE_FACTOR_WEIGHTS,
  LEVEL_SCORE_THRESHOLDS
} from '@/enums/business'
import HtTable from '@components/HtTable/index.vue'
import LevelAdjustDialog from './components/LevelAdjustDialog.vue'

const userStore = useUserStore()

const canView = computed(() => {
  return userStore.hasRole('admin') ||
    userStore.hasRole('senior_operator') ||
    userStore.hasRole('operator') ||
    userStore.hasPermission('user:level:view')
})

const permission = ref<UserLevelPermission>({
  canView: false,
  canEdit: false,
  canUpgrade: false,
  canDowngrade: false,
  canBatchUpgrade: false,
  canBatchDowngrade: false,
  maxAdjustLevel: UserLevel.NORMAL
})

const dateRange = ref<string[]>([])

const {
  loading,
  dataList,
  total,
  queryParams,
  fetchData,
  handleSearch,
  handleReset: baseHandleReset,
  handlePaginate
} = useFetchList<LevelListUser, Record<string, unknown>>({
  fetchApi: async (params) => {
    const result = await getLevelList(params)
    permission.value = result.permission
    return {
      list: result.list,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize
    }
  },
  defaultParams: {
    uid: undefined,
    nickname: '',
    userLevel: undefined,
    minScore: undefined,
    maxScore: undefined,
    status: undefined,
    isPermanentBanned: undefined,
    updateStartDate: '',
    updateEndDate: ''
  }
})

watch(dateRange, (newVal) => {
  if (newVal && newVal.length === 2) {
    queryParams.updateStartDate = newVal[0]
    queryParams.updateEndDate = newVal[1]
  } else {
    queryParams.updateStartDate = ''
    queryParams.updateEndDate = ''
  }
})

const adjustDialogVisible = ref(false)
const currentUserId = ref<number | null>(null)
const targetLevel = ref<number>(UserLevel.NORMAL)
const currentLevel = ref<number>(UserLevel.NORMAL)

const getScoreColor = (score: number) => {
  if (score >= 85) return '#e6a23c'
  if (score >= 60) return '#409eff'
  if (score >= 0) return '#909399'
  return '#f56c6c'
}

const canAdjustLevel = (row: LevelListUser, target: number) => {
  if (row.isPermanentBanned === 1) return false
  if (target > UserLevel.PREMIUM || target < UserLevel.RESTRICTED) return false
  if (target === UserLevel.RESTRICTED) return true
  const requiredScore = LEVEL_SCORE_THRESHOLDS[target] || 0
  return (row.levelScore || 0) >= requiredScore
}

const handleReset = () => {
  dateRange.value = []
  baseHandleReset()
}

const handleViewDetail = (row: LevelListUser) => {
  currentUserId.value = row.id
  targetLevel.value = row.userLevel
  currentLevel.value = row.userLevel
  adjustDialogVisible.value = true
}

const handleAdjustLevel = (row: LevelListUser, target: number) => {
  currentUserId.value = row.id
  targetLevel.value = target
  currentLevel.value = row.userLevel
  adjustDialogVisible.value = true
}

const handleDataUpdated = () => {
  fetchData()
}

onMounted(() => {
  if (canView.value) {
    fetchData()
  }
})
</script>

<style lang="scss" scoped>
.page-container {
  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .card-title {
    font-size: 15px;
    font-weight: 600;
    color: $text-primary;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 12px;

    .avatar-wrapper {
      position: relative;

      .level-tag {
        position: absolute;
        top: -6px;
        right: -6px;

        &.restricted-tag {
          animation: restricted-glow 1.5s ease-in-out infinite;
        }

        @keyframes restricted-glow {
          0%, 100% {
            box-shadow: 0 0 5px rgba(245, 108, 108, 0.5);
          }
          50% {
            box-shadow: 0 0 15px rgba(245, 108, 108, 0.8);
          }
        }
      }
    }

    .info-text {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .user-name {
        font-weight: 600;
        color: $text-primary;
        display: flex;
        align-items: center;
        gap: 8px;

        .user-uid {
          font-size: 12px;
          color: $text-secondary;
          font-weight: normal;
        }
      }

      .user-extra {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        color: $text-secondary;
      }
    }
  }

  .score-section {
    position: relative;

    .score-header {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 8px;

      .score-label {
        font-size: 12px;
        color: $text-placeholder;
      }

      .score-value {
        font-size: 18px;
        font-weight: 600;
      }

      .score-max {
        font-size: 12px;
        color: $text-placeholder;
      }

      .info-icon {
        cursor: help;
        color: $text-placeholder;
        font-size: 14px;
      }
    }

    .threshold-markers {
      position: relative;
      height: 20px;
      margin-top: 4px;

      .threshold-marker {
        position: absolute;
        transform: translateX(-50%);
        display: flex;
        flex-direction: column;
        align-items: center;

        .threshold-line {
          width: 1px;
          height: 8px;
          background-color: $border-color-lighter;
        }

        .threshold-label {
          font-size: 10px;
          color: $text-placeholder;
          white-space: nowrap;
        }
      }
    }
  }

  .score-tooltip {
    min-width: 220px;

    .tooltip-title {
      font-weight: 600;
      color: $text-primary;
      margin-bottom: 8px;
    }

    .score-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 4px 0;
      font-size: 12px;

      .factor-name {
        color: $text-secondary;
      }

      .factor-score {
        font-weight: 600;
        color: $text-primary;
      }

      .factor-weight {
        color: $text-placeholder;
        font-size: 11px;
      }
    }

    .threshold-info {
      font-size: 12px;
      color: $text-secondary;

      .highlight {
        color: $color-primary;
        font-weight: 600;
      }
    }
  }

  .adjust-tooltip {
    min-width: 180px;

    .tooltip-title {
      font-weight: 600;
      color: $text-primary;
      margin-bottom: 8px;
    }

    .tooltip-content {
      font-size: 12px;

      .requirement,
      .current,
      .gap {
        display: flex;
        justify-content: space-between;
        padding: 2px 0;
        color: $text-secondary;
      }

      .gap {
        color: $color-danger;
        font-weight: 600;
      }
    }
  }

  .benefits-section {
    .benefits-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;

      .benefit-tag {
        max-width: 80px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }

  .more-benefits {
    .benefit-item {
      padding: 4px 0;
      font-size: 12px;
      color: $text-secondary;
    }
  }

  .time-column {
    font-size: 12px;
    color: $text-secondary;
  }
}
</style>
