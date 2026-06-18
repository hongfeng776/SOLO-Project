<template>
  <div class="page-container">
    <el-card shadow="never" class="mb-20">
      <el-form :model="queryForm" label-width="100px" inline @submit.prevent>
        <el-form-item label="用户UID">
          <el-input
            v-model="queryForm.uid"
            placeholder="请输入用户UID"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-tooltip
            v-if="!canQuery"
            content="无权限查询用户等级，请联系管理员"
            placement="top"
          >
            <el-button type="primary" :icon="Search" disabled>查询</el-button>
          </el-tooltip>
          <el-button
            v-else
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

    <div v-if="!canQuery" class="permission-denied">
      <el-empty description="无权限查询用户等级，请联系管理员开通权限">
        <template #image>
          <el-icon :size="80" color="#c0c4cc"><Lock /></el-icon>
        </template>
      </el-empty>
    </div>

    <template v-else-if="userDetail">
      <el-card shadow="never" class="mb-20">
        <template #header>
          <div class="card-header">
            <span class="card-title">用户等级信息</span>
            <div class="header-actions">
              <el-tag v-if="permission.canEdit" type="success" effect="light">可调整等级</el-tag>
              <el-tag v-else type="info" effect="light">仅查看</el-tag>
            </div>
          </div>
        </template>

        <div class="user-level-info">
          <div class="user-basic">
            <div class="avatar-wrapper">
              <el-avatar :size="64" :src="userDetail.user.avatar">
                {{ userDetail.user.nickname?.charAt(0) }}
              </el-avatar>
              <el-tag
                class="level-tag"
                :color="USER_LEVEL_COLORS[userDetail.user.userLevel]"
                size="small"
                effect="dark"
              >
                {{ USER_LEVEL_NAMES[userDetail.user.userLevel] }}
              </el-tag>
            </div>
            <div class="user-info">
              <div class="user-name">
                {{ userDetail.user.nickname }}
                <span class="user-uid">UID: {{ userDetail.user.id }}</span>
              </div>
              <div class="user-extra">
                <span>{{ userDetail.user.username }}</span>
                <el-tag
                  v-if="userDetail.user.isPermanentBanned === 1"
                  type="danger"
                  size="small"
                  effect="plain"
                >
                  永久封禁
                </el-tag>
              </div>
            </div>
          </div>

          <el-divider />

          <div class="level-score-section">
            <div class="section-title">等级分值</div>
            <div class="score-display">
              <div class="score-main">
                <span class="score-label">当前分值</span>
                <span class="score-value" :style="{ color: getScoreColor(userDetail.user.levelScore) }">
                  {{ userDetail.user.levelScore }}
                </span>
                <span class="score-max">/ 100</span>
              </div>
              <el-progress
                :percentage="userDetail.user.levelScore || 0"
                :stroke-width="12"
                :color="getScoreColor(userDetail.user.levelScore)"
                style="flex: 1; max-width: 400px"
              />
            </div>
            <div class="score-detail">
              <div
                v-for="(factor, key) in LevelScoreFactor"
                :key="key"
                class="score-item"
              >
                <span class="factor-name">{{ LEVEL_SCORE_FACTOR_NAMES[factor] }}</span>
                <span class="factor-score">{{ getScoreDetailValue(factor) || 0 }}</span>
                <span class="factor-weight">({{ LEVEL_SCORE_FACTOR_WEIGHTS[factor] }}%)</span>
              </div>
            </div>
            <div v-if="userDetail.levelInfo.nextLevel" class="next-level-info">
              <el-alert
                :title="`距离下一等级「${userDetail.levelInfo.nextLevel}」还需 ${userDetail.levelInfo.scoreToNextLevel} 分`"
                type="info"
                :closable="false"
                show-icon
              />
            </div>
          </div>

          <el-divider />

          <div class="benefits-section">
            <div class="section-title">当前权益</div>
            <div class="benefits-list">
              <div
                v-for="benefit in userDetail.benefits"
                :key="benefit.key"
                class="benefit-item"
                :class="{ disabled: !benefit.enabled }"
              >
                <el-icon :class="benefit.enabled ? 'enabled' : 'disabled'">
                  <Check v-if="benefit.enabled" />
                  <Close v-else />
                </el-icon>
                <div class="benefit-info">
                  <span class="benefit-name">{{ benefit.name }}</span>
                  <span class="benefit-desc">{{ benefit.description }}</span>
                </div>
              </div>
            </div>
          </div>

          <el-divider />

          <div class="action-section">
            <el-tooltip
              v-if="!permission.canEdit"
              content="无权限调整等级，请联系管理员"
              placement="top"
            >
              <el-button type="primary" :icon="Edit" disabled>手动调整等级</el-button>
            </el-tooltip>
            <el-button
              v-else
              type="primary"
              :icon="Edit"
              @click="handleManualAdjust"
            >
              手动调整等级
            </el-button>

            <el-tooltip
              v-if="!permission.canEdit"
              content="无权限自动计算等级，请联系管理员"
              placement="top"
            >
              <el-button type="success" :icon="MagicStick" disabled>自动计算等级</el-button>
            </el-tooltip>
            <el-button
              v-else
              type="success"
              :icon="MagicStick"
              :loading="autoCalculating"
              @click="handleAutoCalculate"
            >
              自动计算等级
            </el-button>

            <el-button
              type="info"
              :icon="Refresh"
              @click="handleSearch"
            >
              刷新数据
            </el-button>
          </div>
        </div>
      </el-card>

      <el-card shadow="never">
        <template #header>
          <div class="card-header">
            <span class="card-title">等级变更历史</span>
          </div>
        </template>

        <HtTable
          :data="logList"
          :loading="logsLoading"
          :total="logsTotal"
          v-model:page="logsQuery.page"
          v-model:page-size="logsQuery.pageSize"
          show-index
          row-key="id"
          @paginate="handleLogsPaginate"
        >
          <el-table-column label="操作类型" width="120">
            <template #default="{ row }">
              <el-tag
                :type="getOperationType(row.operationType)"
                effect="light"
                size="small"
              >
                {{ LEVEL_ADJUST_REASON_NAMES[row.operationType] || row.operationType }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="等级变更" width="200">
            <template #default="{ row }">
              <div class="level-change">
                <span class="old-level" :style="{ color: USER_LEVEL_COLORS[row.oldLevel] }">
                  {{ USER_LEVEL_NAMES[row.oldLevel] }}
                </span>
                <el-icon :color="row.newLevel > row.oldLevel ? '#67c23a' : '#f56c6c'">
                  <ArrowRight v-if="row.newLevel !== row.oldLevel" />
                  <Minus v-else />
                </el-icon>
                <span class="new-level" :style="{ color: USER_LEVEL_COLORS[row.newLevel] }">
                  {{ USER_LEVEL_NAMES[row.newLevel] }}
                </span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="分值变更" width="160">
            <template #default="{ row }">
              <div class="score-change">
                <span>{{ row.oldScore }}</span>
                <el-icon :color="row.newScore > row.oldScore ? '#67c23a' : row.newScore < row.oldScore ? '#f56c6c' : '#909399'">
                  <ArrowRight v-if="row.newScore !== row.oldScore" />
                  <Minus v-else />
                </el-icon>
                <span>{{ row.newScore }}</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="变更原因">
            <template #default="{ row }">
              <div class="reason-info">
                <div class="reason-main">{{ row.reason }}</div>
                <div v-if="row.reasonDetail" class="reason-detail">{{ row.reasonDetail }}</div>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="权益变更" min-width="200">
            <template #default="{ row }">
              <div v-if="row.benefitsChanged" class="benefits-changed">
                <el-tag
                  v-for="benefit in row.benefitsChanged.added"
                  :key="`add-${benefit}`"
                  type="success"
                  effect="light"
                  size="small"
                  class="mr-4"
                >
                  +{{ USER_BENEFIT_NAMES[benefit] || benefit }}
                </el-tag>
                <el-tag
                  v-for="benefit in row.benefitsChanged.removed"
                  :key="`remove-${benefit}`"
                  type="danger"
                  effect="light"
                  size="small"
                  class="mr-4"
                >
                  -{{ USER_BENEFIT_NAMES[benefit] || benefit }}
                </el-tag>
                <span v-if="!row.benefitsChanged.added.length && !row.benefitsChanged.removed.length" class="no-change">
                  无变化
                </span>
              </div>
              <span v-else class="no-change">无变化</span>
            </template>
          </el-table-column>

          <el-table-column label="操作人" width="120">
            <template #default="{ row }">
              <span>{{ row.operatorName || (row.isAutoAdjust === 1 ? '系统' : '-') }}</span>
            </template>
          </el-table-column>

          <el-table-column label="操作时间" width="180">
            <template #default="{ row }">
              {{ formatDateTime(row.createTime) }}
            </template>
          </el-table-column>
        </HtTable>
      </el-card>
    </template>

    <el-empty
      v-else-if="searched && !loading"
      description="未查询到用户信息，请检查UID是否正确"
    />

    <LevelAdjustDialog
      v-model="adjustDialogVisible"
      :user-id="currentUserId"
      :target-level="targetLevel"
      :current-level="currentLevel"
      @adjusted="handleAdjusted"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search,
  Refresh,
  Lock,
  Edit,
  MagicStick,
  Check,
  Close,
  ArrowRight,
  Minus
} from '@element-plus/icons-vue'
import { useUserStore } from '@stores/modules/user'
import { formatDateTime } from '@hooks/index'
import {
  getUserLevelDetail,
  autoCalculateLevel,
  getLevelLogs
} from '@api/user-level'
import type {
  UserLevelDetail,
  UserLevelPermission,
  UserLevelLog
} from '@/types/business'
import {
  UserLevel,
  USER_LEVEL_NAMES,
  USER_LEVEL_COLORS,
  USER_BENEFIT_NAMES,
  LevelScoreFactor,
  LEVEL_SCORE_FACTOR_NAMES,
  LEVEL_SCORE_FACTOR_WEIGHTS,
  LEVEL_ADJUST_REASON_NAMES
} from '@/enums/business'
import HtTable from '@components/HtTable/index.vue'
import LevelAdjustDialog from '../list/components/LevelAdjustDialog.vue'

const userStore = useUserStore()

const canQuery = computed(() => {
  return userStore.hasRole('admin') ||
    userStore.hasRole('senior_operator') ||
    userStore.hasRole('operator') ||
    userStore.hasPermission('user:level:view')
})

const loading = ref(false)
const autoCalculating = ref(false)
const searched = ref(false)
const userDetail = ref<UserLevelDetail | null>(null)
const permission = ref<UserLevelPermission>({
  canView: false,
  canEdit: false,
  canUpgrade: false,
  canDowngrade: false,
  canBatchUpgrade: false,
  canBatchDowngrade: false,
  maxAdjustLevel: UserLevel.NORMAL
})

const queryForm = ref({
  uid: ''
})

const logsQuery = ref({
  page: 1,
  pageSize: 10
})

const logsLoading = ref(false)
const logList = ref<UserLevelLog[]>([])
const logsTotal = ref(0)

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

const getOperationType = (type: string) => {
  if (type === 'auto_calculate' || type.includes('upgrade') || type.includes('reward')) {
    return 'success'
  }
  if (type.includes('downgrade') || type.includes('penalty')) {
    return 'danger'
  }
  return 'info'
}

const getScoreDetailValue = (factor: string) => {
  if (!userDetail.value?.user.levelScoreDetail) return 0
  const keyMap: Record<string, string> = {
    activity: 'activity',
    content_quality: 'contentQuality',
    compliance: 'compliance',
    account_age: 'accountAge',
    real_name: 'realName',
    phone_verified: 'phoneVerified'
  }
  const key = keyMap[factor] || factor
  return userDetail.value.user.levelScoreDetail[key as keyof typeof userDetail.value.user.levelScoreDetail]
}

const handleSearch = async () => {
  if (!queryForm.value.uid) {
    ElMessage.warning('请输入用户UID')
    return
  }

  const uid = Number(queryForm.value.uid)
  if (isNaN(uid) || uid <= 0) {
    ElMessage.warning('请输入有效的用户UID')
    return
  }

  loading.value = true
  searched.value = true
  try {
    userDetail.value = await getUserLevelDetail(uid)
    permission.value = userDetail.value.permission
    currentUserId.value = uid
    currentLevel.value = userDetail.value.user.userLevel
    targetLevel.value = userDetail.value.user.userLevel
    await fetchLogs()
  } catch (error) {
    userDetail.value = null
    logList.value = []
    logsTotal.value = 0
    ElMessage.error('查询失败，请检查UID是否正确')
  } finally {
    loading.value = false
  }
}

const handleReset = () => {
  queryForm.value.uid = ''
  userDetail.value = null
  searched.value = false
  logList.value = []
  logsTotal.value = 0
  logsQuery.value.page = 1
}

const handleManualAdjust = () => {
  if (!userDetail.value) return
  targetLevel.value = userDetail.value.user.userLevel
  adjustDialogVisible.value = true
}

const handleAutoCalculate = async () => {
  if (!userDetail.value) return

  try {
    await ElMessageBox.confirm(
      `确定要为用户「${userDetail.value.user.nickname}」自动计算等级吗？系统将根据用户行为数据重新计算分值并调整等级。`,
      '确认自动计算',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
  } catch {
    return
  }

  autoCalculating.value = true
  try {
    const result = await autoCalculateLevel(userDetail.value.user.id)
    if (result.success) {
      ElMessage.success(result.message)
      await handleSearch()
    } else {
      ElMessage.error(result.message)
    }
  } catch (error) {
    ElMessage.error('自动计算失败，请重试')
  } finally {
    autoCalculating.value = false
  }
}

const handleAdjusted = () => {
  handleSearch()
}

const fetchLogs = async () => {
  if (!currentUserId.value) return

  logsLoading.value = true
  try {
    const result = await getLevelLogs({
      userId: currentUserId.value,
      page: logsQuery.value.page,
      pageSize: logsQuery.value.pageSize
    })
    logList.value = result.list
    logsTotal.value = result.total
  } catch (error) {
    logList.value = []
    logsTotal.value = 0
  } finally {
    logsLoading.value = false
  }
}

const handleLogsPaginate = () => {
  fetchLogs()
}

onMounted(() => {
  if (canQuery.value && queryForm.value.uid) {
    handleSearch()
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

  .permission-denied {
    padding: 60px 0;
  }

  .user-level-info {
    .user-basic {
      display: flex;
      align-items: center;
      gap: 20px;

      .avatar-wrapper {
        position: relative;

        .level-tag {
          position: absolute;
          top: -6px;
          right: -6px;
        }
      }

      .user-info {
        .user-name {
          font-size: 18px;
          font-weight: 600;
          color: $text-primary;
          margin-bottom: 4px;
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

    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: $text-primary;
      margin-bottom: 16px;
    }

    .level-score-section {
      .score-display {
        display: flex;
        align-items: center;
        gap: 24px;
        margin-bottom: 20px;

        .score-main {
          display: flex;
          align-items: baseline;
          gap: 4px;

          .score-label {
            font-size: 14px;
            color: $text-placeholder;
          }

          .score-value {
            font-size: 32px;
            font-weight: 600;
          }

          .score-max {
            font-size: 14px;
            color: $text-placeholder;
          }
        }
      }

      .score-detail {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
        margin-bottom: 16px;

        .score-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background-color: $bg-color-page;
          border-radius: 6px;
          font-size: 13px;

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
      }
    }

    .benefits-section {
      .benefits-list {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;

        .benefit-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background-color: $bg-color-page;
          border-radius: 8px;

          .el-icon {
            font-size: 20px;
            flex-shrink: 0;

            &.enabled {
              color: #67c23a;
            }

            &.disabled {
              color: $text-placeholder;
            }
          }

          .benefit-info {
            display: flex;
            flex-direction: column;
            gap: 2px;

            .benefit-name {
              font-weight: 500;
              color: $text-primary;
            }

            .benefit-desc {
              font-size: 12px;
              color: $text-placeholder;
            }
          }

          &.disabled {
            opacity: 0.6;
          }
        }
      }
    }

    .action-section {
      display: flex;
      gap: 12px;
      justify-content: center;
      padding-top: 8px;
    }
  }

  .level-change {
    display: flex;
    align-items: center;
    gap: 8px;

    .old-level,
    .new-level {
      font-weight: 500;
    }
  }

  .score-change {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: monospace;
  }

  .reason-info {
    .reason-main {
      color: $text-primary;
      font-weight: 500;
      margin-bottom: 2px;
    }

    .reason-detail {
      font-size: 12px;
      color: $text-secondary;
    }
  }

  .benefits-changed {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .no-change {
    color: $text-placeholder;
    font-size: 12px;
  }

  .mr-4 {
    margin-right: 4px;
  }
}
</style>
