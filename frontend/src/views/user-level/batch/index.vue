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
        <el-form-item label="注册时间">
          <el-date-picker
            v-model="registerDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 260px"
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
        <el-form-item>
          <el-button
            type="primary"
            :icon="Search"
            :loading="loading"
            @click="handleSearch"
            class="ripple-btn"
          >
            查询
          </el-button>
          <el-button :icon="Refresh" @click="handleReset" class="ripple-btn">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">批量等级调整</span>
          <div class="header-actions">
            <el-tag v-if="permission.canBatchUpgrade" type="success" effect="light">可批量升级</el-tag>
            <el-tag v-if="permission.canBatchDowngrade" type="warning" effect="light">可批量降级</el-tag>
          </div>
        </div>
      </template>

      <div class="batch-toolbar">
        <div class="toolbar-left">
          <span class="selected-count">
            已选择 <span class="count">{{ selectedIds.length }}</span> / {{ total }} 项
          </span>
          <el-button
            v-if="selectedIds.length > 0"
            size="small"
            type="primary"
            link
            @click="handleSelectAll"
          >
            全选当前页
          </el-button>
          <el-button
            v-if="selectedIds.length > 0"
            size="small"
            type="info"
            link
            @click="handleClearSelection"
          >
            清空选择
          </el-button>
        </div>
        <div class="toolbar-right">
          <el-tooltip
            v-if="!canBatchUpgrade"
            content="无批量升级权限"
            placement="top"
          >
            <el-button
              type="success"
              :icon="ArrowUp"
              :disabled="selectedIds.length === 0 || !canBatchUpgrade"
              @click="showUpgradeDialog"
              class="ripple-btn"
            >
              批量升级
            </el-button>
          </el-tooltip>
          <el-button
            v-else
            type="success"
            :icon="ArrowUp"
            :disabled="selectedIds.length === 0 || !canBatchUpgrade"
            @click="showUpgradeDialog"
            class="ripple-btn"
          >
            批量升级
          </el-button>
          <el-tooltip
            v-if="!canBatchDowngrade"
            content="无批量降级权限"
            placement="top"
          >
            <el-button
              type="danger"
              :icon="ArrowDown"
              :disabled="selectedIds.length === 0 || !canBatchDowngrade"
              @click="showDowngradeDialog"
              class="ripple-btn"
            >
              批量降级
            </el-button>
          </el-tooltip>
          <el-button
            v-else
            type="danger"
            :icon="ArrowDown"
            :disabled="selectedIds.length === 0 || !canBatchDowngrade"
            @click="showDowngradeDialog"
            class="ripple-btn"
          >
            批量降级
          </el-button>
        </div>
      </div>

      <HtTable
        :data="dataList"
        :loading="loading"
        :total="total"
        v-model:page="queryParams.page"
        v-model:page-size="queryParams.pageSize"
        show-index
        row-key="id"
        @paginate="handlePaginate"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" />

        <el-table-column label="用户信息" min-width="220">
          <template #default="{ row }">
            <div class="user-info">
              <div class="avatar-wrapper">
                <el-avatar :size="44" :src="row.avatar">{{ row.nickname?.charAt(0) }}</el-avatar>
                <el-tag
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

        <el-table-column label="等级分值" min-width="200">
          <template #default="{ row }">
            <div class="score-section">
              <div class="score-header">
                <span class="score-value" :style="{ color: getScoreColor(row.levelScore) }">
                  {{ row.levelScore }}
                </span>
                <span class="score-max">/ 100</span>
              </div>
              <el-progress
                :percentage="row.levelScore || 0"
                :stroke-width="8"
                :color="getScoreColor(row.levelScore)"
              />
            </div>
          </template>
        </el-table-column>

        <el-table-column label="合规指标" min-width="200">
          <template #default="{ row }">
            <div class="compliance-metrics">
              <div class="metric-item">
                <span class="metric-label">活跃度:</span>
                <el-progress
                  :percentage="row.levelScoreDetail?.activity || 0"
                  :stroke-width="6"
                  :show-text="false"
                  style="width: 80px"
                />
                <span class="metric-value">{{ row.levelScoreDetail?.activity || 0 }}</span>
              </div>
              <div class="metric-item">
                <span class="metric-label">内容质量:</span>
                <el-progress
                  :percentage="row.levelScoreDetail?.contentQuality || 0"
                  :stroke-width="6"
                  :show-text="false"
                  style="width: 80px"
                />
                <span class="metric-value">{{ row.levelScoreDetail?.contentQuality || 0 }}</span>
              </div>
              <div class="metric-item">
                <span class="metric-label">合规记录:</span>
                <el-progress
                  :percentage="row.levelScoreDetail?.compliance || 0"
                  :stroke-width="6"
                  :color="row.levelScoreDetail?.compliance >= 20 ? '#67c23a' : '#f56c6c'"
                  :show-text="false"
                  style="width: 80px"
                />
                <span
                  class="metric-value"
                  :style="{ color: row.levelScoreDetail?.compliance >= 20 ? '#67c23a' : '#f56c6c' }"
                >
                  {{ row.levelScoreDetail?.compliance || 0 }}
                </span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="注册时间" width="180">
          <template #default="{ row }">
            <div class="time-column">
              {{ formatDateTime(row.createTime) }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="等级更新" width="180">
          <template #default="{ row }">
            <div class="time-column">
              {{ row.levelLastUpdateTime ? formatDateTime(row.levelLastUpdateTime) : '-' }}
            </div>
          </template>
        </el-table-column>
      </HtTable>
    </el-card>

    <el-dialog
      v-model="adjustDialogVisible"
      :title="adjustDialogTitle"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="adjustForm" label-width="100px">
        <el-form-item label="操作类型">
          <el-tag :type="adjustOperationType === 'upgrade' ? 'success' : 'danger'" effect="light">
            {{ adjustOperationType === 'upgrade' ? '批量升级' : '批量降级' }}
          </el-tag>
        </el-form-item>
        <el-form-item label="目标等级">
          <el-select
            v-model="adjustForm.targetLevel"
            placeholder="请选择目标等级"
            style="width: 200px"
          >
            <el-option
              v-for="level in availableTargetLevels"
              :key="level.value"
              :label="level.label"
              :value="level.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="操作人数">
          <span class="count-highlight">{{ selectedIds.length }}</span> 人
        </el-form-item>
        <el-form-item label="调整原因" required>
          <el-input
            v-model="adjustForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请输入调整原因"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="详细说明">
          <el-input
            v-model="adjustForm.reasonDetail"
            type="textarea"
            :rows="2"
            placeholder="可选，详细说明调整依据"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="adjustDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :disabled="!adjustForm.targetLevel || !adjustForm.reason.trim()"
          @click="handleConfirmAdjust"
          class="ripple-btn"
        >
          确认调整
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="confirmDialogVisible"
      title="二次确认"
      width="420px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div class="confirm-content">
        <el-alert
          :title="confirmWarningTitle"
          type="warning"
          :description="confirmWarningDesc"
          show-icon
          :closable="false"
        />
        <div class="confirm-info">
          <div class="info-item">
            <span class="info-label">操作类型：</span>
            <el-tag :type="adjustOperationType === 'upgrade' ? 'success' : 'danger'" effect="light">
              {{ adjustOperationType === 'upgrade' ? '批量升级' : '批量降级' }}
            </el-tag>
          </div>
          <div class="info-item">
            <span class="info-label">目标等级：</span>
            <span class="info-value" :style="{ color: USER_LEVEL_COLORS[adjustForm.targetLevel] }">
              {{ USER_LEVEL_NAMES[adjustForm.targetLevel] }}
            </span>
          </div>
          <div class="info-item">
            <span class="info-label">操作人数：</span>
            <span class="info-value count-highlight">{{ selectedIds.length }} 人</span>
          </div>
          <div class="info-item">
            <span class="info-label">调整原因：</span>
            <span class="info-value">{{ adjustForm.reason }}</span>
          </div>
        </div>
        <div class="confirm-input">
          <el-form :model="confirmForm" label-width="120px">
            <el-form-item label="请输入操作确认">
              <el-input
                v-model="confirmForm.confirmText"
                placeholder='请输入"确认批量调整"'
              />
            </el-form-item>
          </el-form>
        </div>
      </div>
      <template #footer>
        <el-button @click="confirmDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :disabled="confirmForm.confirmText !== '确认批量调整'"
          @click="handleExecuteBatch"
          class="ripple-btn"
        >
          确定执行
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="progressVisible"
      title="批量操作进度"
      width="500px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div v-if="operating" class="progress-content">
        <div class="progress-header">
          <span class="progress-title">正在执行批量{{ adjustOperationType === 'upgrade' ? '升级' : '降级' }}...</span>
          <span class="progress-percent">{{ progressPercent }}%</span>
        </div>
        <el-progress
          :percentage="progressPercent"
          :stroke-width="12"
          :text-inside="false"
          status="success"
        />
        <div class="progress-info">
          <span>已处理：{{ progressCurrent }} / {{ progressTotal }}</span>
          <span>成功：{{ progressSuccess }}</span>
          <span>失败：{{ progressFail }}</span>
        </div>
        <div class="progress-detail">
          <div
            v-for="result in processedResults"
            :key="result.userId"
            class="result-item"
            :class="{ success: result.success, error: !result.success }"
          >
            <el-icon v-if="result.success" class="result-icon success">
              <CircleCheckFilled />
            </el-icon>
            <el-icon v-else class="result-icon error">
              <CircleCloseFilled />
            </el-icon>
            <span class="result-user">{{ result.userName }} (UID: {{ result.userId }})</span>
            <span v-if="!result.success" class="result-error">{{ result.error }}</span>
          </div>
        </div>
      </div>
      <div v-else class="result-content">
        <div class="result-icon-wrapper" :class="{ success: progressFail === 0, error: progressFail > 0 }">
          <el-icon v-if="progressFail === 0" :size="60" color="#67c23a">
            <CircleCheckFilled />
          </el-icon>
          <el-icon v-else :size="60" color="#f56c6c">
            <WarningFilled />
          </el-icon>
          <div class="result-title">{{ progressFail === 0 ? '操作全部完成' : '操作部分完成' }}</div>
        </div>
        <div class="result-stats">
          <div class="stat-item">
            <div class="stat-value">{{ progressTotal }}</div>
            <div class="stat-label">总计</div>
          </div>
          <div class="stat-item success">
            <div class="stat-value">{{ progressSuccess }}</div>
            <div class="stat-label">成功</div>
          </div>
          <div class="stat-item error">
            <div class="stat-value">{{ progressFail }}</div>
            <div class="stat-label">失败</div>
          </div>
        </div>
        <el-table v-if="progressFail > 0" :data="failResults" max-height="200">
          <el-table-column prop="userId" label="用户ID" width="100" />
          <el-table-column prop="userName" label="用户名" width="120" />
          <el-table-column prop="error" label="失败原因" />
        </el-table>
      </div>
      <template #footer>
        <el-button @click="handleCloseProgress" v-if="!operating">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Search,
  Refresh,
  ArrowUp,
  ArrowDown,
  CircleCheckFilled,
  CircleCloseFilled,
  WarningFilled
} from '@element-plus/icons-vue'
import { useUserStore } from '@stores/modules/user'
import { useFetchList, formatDateTime } from '@hooks/index'
import { getLevelList, batchAdjustLevel } from '@api/user-level'
import type { LevelListUser, UserLevelPermission, BatchLevelAdjustResult } from '@/types/business'
import {
  UserLevel,
  USER_LEVEL_NAMES,
  USER_LEVEL_COLORS,
  LevelAdjustReason
} from '@/enums/business'
import HtTable from '@components/HtTable/index.vue'

const userStore = useUserStore()

const canView = computed(() => {
  return userStore.hasRole('admin') ||
    userStore.hasRole('senior_operator') ||
    userStore.hasRole('operator') ||
    userStore.hasPermission('user:level:view')
})

const canBatchUpgrade = computed(() => {
  return permission.value.canBatchUpgrade &&
    (userStore.hasRole('admin') ||
    userStore.hasRole('senior_operator') ||
    userStore.hasPermission('user:level:batch:upgrade'))
})

const canBatchDowngrade = computed(() => {
  return permission.value.canBatchDowngrade &&
    (userStore.hasRole('admin') ||
    userStore.hasRole('senior_operator') ||
    userStore.hasPermission('user:level:batch:downgrade'))
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

const registerDateRange = ref<string[]>([])
const selectedIds = ref<number[]>([])

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
    registerStartDate: '',
    registerEndDate: ''
  }
})

watch(registerDateRange, (newVal) => {
  if (newVal && newVal.length === 2) {
    queryParams.registerStartDate = newVal[0]
    queryParams.registerEndDate = newVal[1]
  } else {
    queryParams.registerStartDate = ''
    queryParams.registerEndDate = ''
  }
})

const adjustDialogVisible = ref(false)
const confirmDialogVisible = ref(false)
const adjustOperationType = ref<'upgrade' | 'downgrade'>('upgrade')

const adjustForm = reactive({
  targetLevel: UserLevel.NORMAL,
  reason: '',
  reasonDetail: ''
})

const confirmForm = reactive({
  confirmText: ''
})

const adjustDialogTitle = computed(() => {
  return adjustOperationType.value === 'upgrade' ? '批量升级用户' : '批量降级用户'
})

const availableTargetLevels = computed(() => {
  const levels: Array<{ value: number; label: string }> = []
  const maxLevel = permission.value.maxAdjustLevel

  if (adjustOperationType.value === 'upgrade') {
    if (UserLevel.ACTIVE <= maxLevel) {
      levels.push({ value: UserLevel.ACTIVE, label: USER_LEVEL_NAMES[UserLevel.ACTIVE] })
    }
    if (UserLevel.PREMIUM <= maxLevel) {
      levels.push({ value: UserLevel.PREMIUM, label: USER_LEVEL_NAMES[UserLevel.PREMIUM] })
    }
  } else {
    if (UserLevel.NORMAL >= UserLevel.RESTRICTED) {
      levels.push({ value: UserLevel.NORMAL, label: USER_LEVEL_NAMES[UserLevel.NORMAL] })
    }
    if (UserLevel.RESTRICTED >= UserLevel.RESTRICTED) {
      levels.push({ value: UserLevel.RESTRICTED, label: USER_LEVEL_NAMES[UserLevel.RESTRICTED] })
    }
  }

  return levels
})

const confirmWarningTitle = computed(() => {
  return adjustOperationType.value === 'upgrade'
    ? '您即将执行批量升级操作'
    : '您即将执行批量降级操作'
})

const confirmWarningDesc = computed(() => {
  const count = selectedIds.value.length
  const levelName = USER_LEVEL_NAMES[adjustForm.targetLevel]
  if (adjustOperationType.value === 'upgrade') {
    return `将 ${count} 名用户升级为 ${levelName}，此操作将影响用户权益和权限，请谨慎操作。`
  } else {
    return `将 ${count} 名用户降级为 ${levelName}，降级可能导致用户权益受损，请务必确认操作理由充分。`
  }
})

const operating = ref(false)
const progressVisible = ref(false)
const progressPercent = ref(0)
const progressCurrent = ref(0)
const progressTotal = ref(0)
const progressSuccess = ref(0)
const progressFail = ref(0)
const processedResults = ref<BatchLevelAdjustResult['results']>([])
const failResults = ref<BatchLevelAdjustResult['results']>([])

const getScoreColor = (score: number) => {
  if (score >= 85) return '#e6a23c'
  if (score >= 60) return '#409eff'
  if (score >= 0) return '#909399'
  return '#f56c6c'
}

const handleSelectionChange = (selection: unknown[]) => {
  selectedIds.value = (selection as LevelListUser[]).map(item => item.id)
}

const handleSelectAll = () => {
  selectedIds.value = dataList.value.map(item => item.id)
}

const handleClearSelection = () => {
  selectedIds.value = []
}

const handleReset = () => {
  registerDateRange.value = []
  selectedIds.value = []
  baseHandleReset()
}

const showUpgradeDialog = () => {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择要操作的用户')
    return
  }
  adjustOperationType.value = 'upgrade'
  adjustForm.targetLevel = availableTargetLevels.value[0]?.value || UserLevel.ACTIVE
  adjustForm.reason = LevelAdjustReason.COMPLIANCE_REWARD
  adjustForm.reasonDetail = ''
  adjustDialogVisible.value = true
}

const showDowngradeDialog = () => {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择要操作的用户')
    return
  }
  adjustOperationType.value = 'downgrade'
  adjustForm.targetLevel = availableTargetLevels.value[0]?.value || UserLevel.NORMAL
  adjustForm.reason = LevelAdjustReason.VIOLATION_PENALTY
  adjustForm.reasonDetail = ''
  adjustDialogVisible.value = true
}

const handleConfirmAdjust = () => {
  if (!adjustForm.targetLevel) {
    ElMessage.warning('请选择目标等级')
    return
  }
  if (!adjustForm.reason.trim()) {
    ElMessage.warning('请输入调整原因')
    return
  }
  adjustDialogVisible.value = false
  confirmForm.confirmText = ''
  confirmDialogVisible.value = true
}

const handleExecuteBatch = async () => {
  confirmDialogVisible.value = false
  progressVisible.value = true
  operating.value = true
  progressPercent.value = 0
  progressCurrent.value = 0
  progressTotal.value = selectedIds.value.length
  progressSuccess.value = 0
  progressFail.value = 0
  processedResults.value = []
  failResults.value = []

  try {
    const result = await batchAdjustLevel({
      userIds: selectedIds.value,
      targetLevel: adjustForm.targetLevel,
      reason: adjustForm.reason,
      reasonDetail: adjustForm.reasonDetail || undefined
    })

    await simulateProgress(result)

    ElMessage.success('批量操作完成')
    handleReset()
    fetchData()
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  } finally {
    operating.value = false
  }
}

const simulateProgress = (result: BatchLevelAdjustResult) => {
  return new Promise<void>((resolve) => {
    let index = 0
    const total = result.results.length
    const interval = setInterval(() => {
      if (index < total) {
        const item = result.results[index]
        processedResults.value.push(item)
        progressCurrent.value = index + 1
        if (item.success) {
          progressSuccess.value++
        } else {
          progressFail.value++
          failResults.value.push(item)
        }
        progressPercent.value = Math.round(((index + 1) / total) * 100)
        index++
      } else {
        clearInterval(interval)
        resolve()
      }
    }, 200)
  })
}

const handleCloseProgress = () => {
  progressVisible.value = false
  processedResults.value = []
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

  .batch-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid $border-color-lighter;
    margin-bottom: 16px;

    .toolbar-left {
      display: flex;
      align-items: center;
      gap: 16px;

      .selected-count {
        font-size: 13px;
        color: $text-secondary;

        .count {
          font-size: 16px;
          font-weight: 600;
          color: $color-primary;
          margin: 0 4px;
        }
      }
    }

    .toolbar-right {
      display: flex;
      gap: 12px;
    }
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
    .score-header {
      display: flex;
      align-items: baseline;
      gap: 4px;
      margin-bottom: 6px;

      .score-value {
        font-size: 18px;
        font-weight: 600;
      }

      .score-max {
        font-size: 12px;
        color: $text-placeholder;
      }
    }
  }

  .compliance-metrics {
    display: flex;
    flex-direction: column;
    gap: 6px;

    .metric-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;

      .metric-label {
        color: $text-secondary;
        width: 60px;
        flex-shrink: 0;
      }

      .metric-value {
        font-weight: 600;
        color: $text-primary;
        width: 24px;
        text-align: right;
      }
    }
  }

  .time-column {
    font-size: 12px;
    color: $text-secondary;
  }

  .count-highlight {
    font-size: 18px;
    font-weight: 600;
    color: $color-primary;
  }

  .confirm-content {
    .confirm-info {
      margin-top: 16px;
      padding: 16px;
      background: #f5f7fa;
      border-radius: 8px;

      .info-item {
        display: flex;
        align-items: center;
        padding: 6px 0;
        font-size: 13px;

        .info-label {
          color: $text-secondary;
          width: 80px;
          flex-shrink: 0;
        }

        .info-value {
          color: $text-primary;
          font-weight: 500;
        }
      }
    }

    .confirm-input {
      margin-top: 16px;
    }
  }

  .progress-content,
  .result-content {
    padding: 20px 0;
  }

  .progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    .progress-title {
      font-size: 16px;
      font-weight: 600;
      color: $text-primary;
    }

    .progress-percent {
      font-size: 20px;
      font-weight: 600;
      color: #67c23a;
    }
  }

  .progress-info {
    display: flex;
    justify-content: space-around;
    margin: 16px 0;
    font-size: 13px;
    color: $text-secondary;
  }

  .progress-detail {
    max-height: 200px;
    overflow-y: auto;
    padding-right: 8px;

    .result-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      margin-bottom: 6px;
      background: #f5f7fa;
      border-radius: 4px;
      font-size: 12px;

      &.success {
        border-left: 3px solid #67c23a;
      }

      &.error {
        border-left: 3px solid #f56c6c;
      }

      .result-icon {
        font-size: 16px;
        flex-shrink: 0;

        &.success {
          color: #67c23a;
        }

        &.error {
          color: #f56c6c;
        }
      }

      .result-user {
        color: $text-primary;
        font-weight: 500;
      }

      .result-error {
        color: #f56c6c;
        margin-left: auto;
      }
    }
  }

  .result-icon-wrapper {
    text-align: center;
    margin-bottom: 20px;

    &.success {
      color: #67c23a;
    }

    &.error {
      color: #f56c6c;
    }

    .result-title {
      font-size: 18px;
      font-weight: 600;
      margin-top: 12px;
      color: $text-primary;
    }
  }

  .result-stats {
    display: flex;
    justify-content: space-around;
    margin: 24px 0;
    padding: 16px 0;
    background: #f5f7fa;
    border-radius: 8px;

    .stat-item {
      text-align: center;

      .stat-value {
        font-size: 24px;
        font-weight: 600;
        color: $text-primary;
      }

      .stat-label {
        font-size: 13px;
        color: $text-secondary;
        margin-top: 4px;
      }

      &.success .stat-value {
        color: #67c23a;
      }

      &.error .stat-value {
        color: #f56c6c;
      }
    }
  }
}

.ripple-btn {
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.4);
    transform: translate(-50%, -50%);
    pointer-events: none;
  }

  &:active::after {
    width: 200px;
    height: 200px;
    animation: ripple-animation 0.6s ease-out;
  }
}

@keyframes ripple-animation {
  0% {
    width: 0;
    height: 0;
    opacity: 0.6;
  }
  100% {
    width: 200px;
    height: 200px;
    opacity: 0;
  }
}
</style>
