<template>
  <div class="page-container">
    <el-card shadow="never" class="mb-20">
      <el-form :model="queryParams" label-width="100px" inline @submit.prevent>
        <el-form-item label="用户UID">
          <el-input
            v-model="formModel.userId"
            placeholder="请输入用户UID"
            clearable
            style="width: 160px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="用户名">
          <el-input
            v-model="formModel.userName"
            placeholder="请输入用户名"
            clearable
            style="width: 160px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="风险等级">
          <el-select
            v-model="formModel.riskLevel"
            placeholder="全部等级"
            clearable
            style="width: 140px"
          >
            <el-option
              v-for="(name, value) in RISK_LEVEL_NAMES"
              :key="value"
              :label="name"
              :value="Number(value)"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="处罚类型">
          <el-select
            v-model="queryParams.punishmentType"
            placeholder="全部类型"
            clearable
            style="width: 140px"
          >
            <el-option
              v-for="(name, value) in PUNISHMENT_TYPE_NAMES"
              :key="value"
              :label="name"
              :value="value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="违规类型">
          <el-select
            v-model="queryParams.violationType"
            placeholder="全部类型"
            clearable
            style="width: 140px"
          >
            <el-option
              v-for="(name, value) in VIOLATION_TYPE_NAMES"
              :key="value"
              :label="name"
              :value="value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="处罚状态">
          <el-select
            v-model="formModel.status"
            placeholder="全部状态"
            clearable
            style="width: 140px"
          >
            <el-option
              v-for="(name, value) in PUNISHMENT_STATUS_NAMES"
              :key="value"
              :label="name"
              :value="Number(value)"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="创建时间">
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
          <span class="card-title">用户处罚记录</span>
          <div class="header-actions">
            <el-tag v-if="permission.canRevoke" type="success" effect="light">可解除处罚</el-tag>
            <el-tag v-if="permission.canHandle" type="warning" effect="light">可执行处罚</el-tag>
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
        <el-table-column label="用户信息" min-width="160">
          <template #default="{ row }">
            <div class="user-info">
              <div class="info-text">
                <div class="user-name">
                  {{ row.userName }}
                  <span class="user-uid">UID: {{ row.userId }}</span>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="风险等级" width="120" align="center">
          <template #default="{ row }">
            <el-tag
              class="risk-tag"
              :color="RISK_LEVEL_COLORS[row.riskLevel]"
              size="small"
              effect="dark"
            >
              {{ RISK_LEVEL_NAMES[row.riskLevel] }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="违规类型" min-width="120">
          <template #default="{ row }">
            <span class="violation-text">{{ VIOLATION_TYPE_NAMES[row.violationType] || row.violationType }}</span>
          </template>
        </el-table-column>

        <el-table-column label="处罚类型" min-width="120">
          <template #default="{ row }">
            <el-tag
              :type="getPunishmentTagType(row.punishmentType)"
              effect="light"
              size="small"
              class="punishment-tag"
            >
              {{ PUNISHMENT_TYPE_NAMES[row.punishmentType] || row.punishmentType }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="处罚状态" width="120" align="center">
          <template #default="{ row }">
            <div class="status-cell">
              <span
                class="status-dot"
                :class="`status-dot--${getStatusDotClass(row.status)}`"
              ></span>
              <span class="status-text" :class="`status-text--${getStatusDotClass(row.status)}`">
                {{ PUNISHMENT_STATUS_NAMES[row.status] }}
              </span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="处罚原因" min-width="180">
          <template #default="{ row }">
            <el-tooltip
              v-if="row.reason && row.reason.length > 30"
              placement="top"
              :show-after="300"
            >
              <template #content>{{ row.reason }}</template>
              <span class="reason-text">{{ row.reason.slice(0, 30) }}...</span>
            </el-tooltip>
            <span v-else class="reason-text">{{ row.reason || '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="处罚时长" width="100" align="center">
          <template #default="{ row }">
            <span v-if="row.duration">{{ row.duration }}小时</span>
            <span v-else>-</span>
          </template>
        </el-table-column>

        <el-table-column label="时间信息" width="200">
          <template #default="{ row }">
            <div class="time-column">
              <div class="time-item">
                <span class="time-label">开始：</span>
                {{ row.startTime ? formatDateTime(row.startTime) : '-' }}
              </div>
              <div class="time-item">
                <span class="time-label">结束：</span>
                {{ row.endTime ? formatDateTime(row.endTime) : '-' }}
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="操作人" width="120">
          <template #default="{ row }">
            <span class="operator-text">{{ row.operatorName || '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="160" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="permission.canRevoke && row.status === PunishmentStatus.ACTIVE"
              link
              type="warning"
              size="small"
              @click="handleRevoke(row)"
            >
              解除处罚
            </el-button>
            <el-button
              link
              type="primary"
              size="small"
              @click="handleViewRiskMap(row)"
            >
              风险联动
            </el-button>
          </template>
        </el-table-column>
      </HtTable>
    </el-card>

    <el-dialog
      v-model="revokeDialogVisible"
      title="解除处罚"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="revokeFormRef"
        :model="revokeForm"
        :rules="revokeRules"
        label-width="100px"
      >
        <el-form-item label="处罚记录">
          <span>{{ currentRecord?.userName }} - {{ currentRecord ? PUNISHMENT_TYPE_NAMES[currentRecord.punishmentType] : '' }}</span>
        </el-form-item>
        <el-form-item label="风险等级">
          <el-tag
            v-if="currentRecord"
            :color="RISK_LEVEL_COLORS[currentRecord.riskLevel]"
            size="small"
            effect="dark"
          >
            {{ currentRecord ? RISK_LEVEL_NAMES[currentRecord.riskLevel] : '' }}
          </el-tag>
        </el-form-item>
        <el-form-item label="联动处罚">
          <div v-if="linkedPunishments.length" class="linked-punishments">
            <el-tag
              v-for="p in linkedPunishments"
              :key="p"
              type="warning"
              effect="light"
              size="small"
              class="linked-tag"
            >
              {{ PUNISHMENT_TYPE_NAMES[p] }}
            </el-tag>
          </div>
          <span v-else class="no-linked">无联动处罚</span>
        </el-form-item>
        <el-form-item label="解除原因" prop="reason">
          <el-input
            v-model="revokeForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请输入解除处罚的原因"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="revokeDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="revokeLoading"
          @click="confirmRevoke"
        >
          确认解除
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="riskMapDialogVisible"
      title="风险等级联动处罚"
      width="560px"
    >
      <div class="risk-map-content">
        <div
          v-for="(punishments, level) in RISK_PUNISHMENT_MAP"
          :key="level"
          class="risk-map-item"
          :class="{ 'risk-map-item--active': currentRecord && Number(level) === currentRecord.riskLevel }"
        >
          <div class="risk-map-header">
            <el-tag
              :color="RISK_LEVEL_COLORS[Number(level)]"
              size="small"
              effect="dark"
            >
              {{ RISK_LEVEL_NAMES[Number(level)] }}
            </el-tag>
            <span class="risk-map-desc">{{ getRiskDesc(Number(level)) }}</span>
          </div>
          <div class="risk-map-punishments">
            <el-tag
              v-for="p in punishments"
              :key="p"
              :type="getPunishmentTagType(p)"
              effect="light"
              size="small"
              class="punishment-map-tag"
            >
              {{ PUNISHMENT_TYPE_NAMES[p] }}
            </el-tag>
            <span v-if="!punishments.length" class="no-punishment">无处罚</span>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="riskMapDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'
import { useUserStore } from '@stores/modules/user'
import { useFetchList, formatDateTime } from '@hooks/index'
import { getPunishmentList, revokePunishment } from '@api/risk-control'
import type { PunishmentRecord, RiskControlPermission } from '@/types/business'
import {
  PunishmentType,
  PUNISHMENT_TYPE_NAMES,
  RiskLevel,
  RISK_LEVEL_NAMES,
  RISK_LEVEL_COLORS,
  PunishmentStatus,
  PUNISHMENT_STATUS_NAMES,
  VIOLATION_TYPE_NAMES,
  RISK_PUNISHMENT_MAP
} from '@/enums/business'
import HtTable from '@components/HtTable/index.vue'

const userStore = useUserStore()

const canView = computed(() => {
  return userStore.hasRole('admin') ||
    userStore.hasRole('senior_operator') ||
    userStore.hasRole('operator') ||
    userStore.hasPermission('risk:control:view')
})

const permission = ref<RiskControlPermission>({
  canView: false,
  canHandle: false,
  canBatchHandle: false,
  canIntercept: false,
  canRevoke: false
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
} = useFetchList<PunishmentRecord>({
  fetchApi: async (params) => {
    const result = await getPunishmentList(params)
    return {
      list: result.list,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize
    }
  },
  defaultParams: {
    userId: '',
    userName: '',
    riskLevel: undefined as number | undefined,
    punishmentType: '' as string | undefined,
    violationType: '' as string | undefined,
    status: undefined as number | undefined,
    startStartDate: '',
    startEndDate: ''
  }
})

watch(dateRange, (newVal) => {
  if (newVal && newVal.length === 2) {
    queryParams.startStartDate = newVal[0]
    queryParams.startEndDate = newVal[1]
  } else {
    queryParams.startStartDate = ''
    queryParams.startEndDate = ''
  }
})

const formModel = computed({
  get: () => queryParams as Record<string, any>,
  set: () => {}
})

const handleReset = () => {
  dateRange.value = []
  baseHandleReset()
}

const getPunishmentTagType = (type: string) => {
  if (type === PunishmentType.WARNING || type === PunishmentType.TEMP_RESTRICT) return 'warning'
  if (type === PunishmentType.FLOW_LIMIT || type === PunishmentType.CONTENT_DOWNGRADE) return 'danger'
  if (type === PunishmentType.TEMP_BAN || type === PunishmentType.PERMANENT_BAN) return 'danger'
  return 'info'
}

const getStatusDotClass = (status: number) => {
  if (status === PunishmentStatus.ACTIVE) return 'active'
  if (status === PunishmentStatus.REVOKED) return 'revoked'
  if (status === PunishmentStatus.EXPIRED) return 'expired'
  if (status === PunishmentStatus.APPEALED) return 'appealed'
  return ''
}

const getRiskDesc = (level: number) => {
  if (level === RiskLevel.NONE) return '正常行为，无处罚'
  if (level === RiskLevel.LOW) return '弹窗预警+限制短时操作'
  if (level === RiskLevel.MEDIUM) return '账号限流+内容降权'
  if (level === RiskLevel.HIGH) return '账号临时封禁'
  return ''
}

const revokeDialogVisible = ref(false)
const revokeLoading = ref(false)
const currentRecord = ref<PunishmentRecord | null>(null)
const revokeFormRef = ref()
const revokeForm = ref({ reason: '' })

const revokeRules = {
  reason: [
    { required: true, message: '请输入解除原因', trigger: 'blur' },
    { min: 5, message: '解除原因至少5个字符', trigger: 'blur' }
  ]
}

const linkedPunishments = computed(() => {
  if (!currentRecord.value) return []
  return RISK_PUNISHMENT_MAP[currentRecord.value.riskLevel] || []
})

const handleRevoke = (row: PunishmentRecord) => {
  currentRecord.value = row
  revokeForm.value.reason = ''
  revokeDialogVisible.value = true
}

const confirmRevoke = async () => {
  const valid = await revokeFormRef.value?.validate().catch(() => false)
  if (!valid) return

  revokeLoading.value = true
  try {
    const result = await revokePunishment(currentRecord.value!.id, {
      reason: revokeForm.value.reason
    })
    if (result.success) {
      ElMessage.success('处罚已解除')
      revokeDialogVisible.value = false
      fetchData()
    } else {
      ElMessage.error(result.message || '解除失败')
    }
  } catch {
    ElMessage.error('操作失败')
  } finally {
    revokeLoading.value = false
  }
}

const riskMapDialogVisible = ref(false)

const handleViewRiskMap = (row: PunishmentRecord) => {
  currentRecord.value = row
  riskMapDialogVisible.value = true
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
    }
  }

  .risk-tag {
    transition: all 0.3s ease;
  }

  .violation-text {
    font-size: 13px;
    color: $text-primary;
  }

  .punishment-tag {
    transition: all 0.3s ease;
  }

  .status-cell {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      transition: all 0.3s ease;

      &--active {
        background-color: #f56c6c;
        box-shadow: 0 0 6px rgba(245, 108, 108, 0.5);
      }

      &--revoked {
        background-color: #67c23a;
      }

      &--expired {
        background-color: #909399;
      }

      &--appealed {
        background-color: #e6a23c;
        box-shadow: 0 0 6px rgba(230, 162, 60, 0.5);
      }
    }

    .status-text {
      font-size: 12px;
      font-weight: 500;
      transition: color 0.3s ease;

      &--active { color: #f56c6c; }
      &--revoked { color: #67c23a; }
      &--expired { color: #909399; }
      &--appealed { color: #e6a23c; }
    }
  }

  .reason-text {
    font-size: 12px;
    color: $text-secondary;
  }

  .time-column {
    font-size: 12px;
    color: $text-secondary;

    .time-item {
      display: flex;
      align-items: center;

      .time-label {
        color: $text-placeholder;
        min-width: 36px;
      }
    }
  }

  .operator-text {
    font-size: 12px;
    color: $text-secondary;
  }

  .linked-punishments {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;

    .linked-tag {
      transition: all 0.3s ease;
    }
  }

  .no-linked {
    font-size: 12px;
    color: $text-placeholder;
  }

  .risk-map-content {
    .risk-map-item {
      padding: 16px;
      border-radius: 8px;
      border: 1px solid $border-color-lighter;
      margin-bottom: 12px;
      transition: all 0.3s ease;

      &--active {
        border-color: $color-primary;
        background-color: rgba(64, 158, 255, 0.04);
        box-shadow: 0 0 0 1px rgba(64, 158, 255, 0.2);
      }

      .risk-map-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 10px;

        .risk-map-desc {
          font-size: 13px;
          color: $text-secondary;
        }
      }

      .risk-map-punishments {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        padding-left: 4px;

        .punishment-map-tag {
          transition: all 0.3s ease;
        }

        .no-punishment {
          font-size: 12px;
          color: $text-placeholder;
        }
      }
    }
  }
}
</style>
