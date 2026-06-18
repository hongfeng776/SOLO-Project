<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    width="560px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div v-if="currentDriver" class="status-dialog">
      <div class="driver-info-card">
        <el-avatar :size="56" :src="currentDriver.avatar">
          {{ currentDriver.name?.charAt(0) }}
        </el-avatar>
        <div class="info">
          <div class="name">{{ currentDriver.name }}</div>
          <div class="phone">{{ formatPhone(currentDriver.phone) }}</div>
        </div>
        <el-tag
          :type="DriverStatusTypeMap[currentDriver.status]"
          size="large"
          effect="dark"
        >
          {{ DriverStatusMap[currentDriver.status] }}
        </el-tag>
      </div>

      <div class="section-title">选择目标状态</div>
      <div class="status-options">
        <div
          v-for="opt in statusOptions"
          :key="opt.value"
          class="status-option"
          :class="{
            active: targetStatus === opt.value,
            disabled: opt.value === 0 && currentDriver.status === 3
          }"
          @click="handleSelectStatus(opt.value)"
        >
          <div class="status-icon" :style="{ backgroundColor: opt.color }">
            <el-icon><component :is="opt.icon" /></el-icon>
          </div>
          <div class="status-info">
            <div class="status-name">{{ opt.label }}</div>
            <div class="status-desc">{{ opt.desc }}</div>
          </div>
        </div>
      </div>

      <div v-if="targetStatus === 2" class="form-item">
        <label class="form-label">封禁结束时间 <span class="required">*</span></label>
        <el-date-picker
          v-model="banEndTime"
          type="datetime"
          placeholder="请选择封禁结束时间"
          style="width: 100%"
          :disabled-date="disabledDate"
        />
      </div>

      <div class="form-item">
        <label class="form-label">变更原因 <span class="required">*</span></label>
        <el-input
          v-model="changeReason"
          type="textarea"
          :rows="3"
          placeholder="请详细说明变更原因..."
          maxlength="500"
          show-word-limit
        />
      </div>

      <div v-if="preCheckResult" class="pre-check-section">
        <div class="section-title">前置校验结果</div>
        <div class="check-summary">
          <el-icon v-if="preCheckResult.passed" class="success"><CircleCheck /></el-icon>
          <el-icon v-else class="danger"><CircleClose /></el-icon>
          <span :class="preCheckResult.passed ? 'text-success' : 'text-danger'">
            {{ preCheckResult.passed ? '校验通过' : `存在${preCheckResult.violationCount}项违规` }}
          </span>
        </div>

        <div class="check-stats">
          <div class="stat-item">
            <div class="stat-label">违规次数</div>
            <div
              class="stat-value"
              :class="{ 'text-danger': preCheckResult.violationCount >= 10, 'text-warning': preCheckResult.violationCount >= 5 }"
            >
              {{ currentDriver.violationCount || 0 }}次
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-label">投诉率</div>
            <div
              class="stat-value"
              :class="{ 'text-danger': parseFloat(preCheckResult.complaintRate) >= 5, 'text-warning': parseFloat(preCheckResult.complaintRate) >= 3 }"
            >
              {{ preCheckResult.complaintRate }}%
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-label">服务评分</div>
            <div
              class="stat-value"
              :class="{ 'text-danger': parseFloat(preCheckResult.serviceScore) < 3.5, 'text-warning': parseFloat(preCheckResult.serviceScore) < 4.0 }"
            >
              {{ preCheckResult.serviceScore }}分
            </div>
          </div>
        </div>

        <el-alert
          v-if="preCheckResult.violations.length > 0"
          type="error"
          :closable="false"
          class="check-alert"
        >
          <template #title>
            <div class="alert-title">
              <el-icon><Warning /></el-icon>
              违规项
            </div>
          </template>
          <div class="violation-list">
            <div v-for="(v, idx) in preCheckResult.violations" :key="idx" class="violation-item danger">
              <span class="violation-dot"></span>
              {{ v.message }}
            </div>
          </div>
        </el-alert>

        <el-alert
          v-if="preCheckResult.warnings.length > 0"
          type="warning"
          :closable="false"
          class="check-alert"
        >
          <template #title>
            <div class="alert-title">
              <el-icon><InfoFilled /></el-icon>
              预警项
            </div>
          </template>
          <div class="violation-list">
            <div v-for="(v, idx) in preCheckResult.warnings" :key="idx" class="violation-item warning">
              <span class="violation-dot warning"></span>
              {{ v.message }}
            </div>
          </div>
        </el-alert>
      </div>

      <div class="permission-section">
        <div class="section-title">权限变更预览</div>
        <div class="permission-grid">
          <div class="permission-item">
            <div class="perm-label">接单权限</div>
            <div class="perm-value">
              <el-tag v-if="getPermPreview(targetStatus).canAcceptOrder" type="success" size="small">开启</el-tag>
              <el-tag v-else type="danger" size="small">关闭</el-tag>
            </div>
          </div>
          <div class="permission-item">
            <div class="perm-label">提现权限</div>
            <div class="perm-value">
              <el-tag v-if="getPermPreview(targetStatus).canWithdraw" type="success" size="small">开启</el-tag>
              <el-tag v-else type="danger" size="small">关闭</el-tag>
            </div>
          </div>
          <div class="permission-item">
            <div class="perm-label">上线权限</div>
            <div class="perm-value">
              <el-tag v-if="getPermPreview(targetStatus).canGoOnline" type="success" size="small">开启</el-tag>
              <el-tag v-else type="danger" size="small">关闭</el-tag>
            </div>
          </div>
          <div class="permission-item">
            <div class="perm-label">流量权重</div>
            <div class="perm-value">
              <el-tag type="primary" size="small">{{ getPermPreview(targetStatus).trafficWeight }}x</el-tag>
            </div>
          </div>
        </div>
      </div>

      <div v-if="confirmStep" class="confirm-section">
        <el-alert type="warning" :closable="false">
          <template #title>
            <div class="confirm-title">
              <el-icon><Warning /></el-icon>
              请确认以下操作
            </div>
          </template>
          <div class="confirm-content">
            <p>确定要将司机 <strong>{{ currentDriver.name }}</strong> 的状态从</p>
            <p>
              <el-tag :type="DriverStatusTypeMap[currentDriver.status]" effect="dark">
                {{ DriverStatusMap[currentDriver.status] }}
              </el-tag>
              <el-icon class="arrow"><Right /></el-icon>
              <el-tag :type="DriverStatusTypeMap[targetStatus]" effect="dark">
                {{ DriverStatusMap[targetStatus] }}
              </el-tag>
            </p>
            <p class="confirm-reason">变更原因：{{ changeReason }}</p>
          </div>
        </el-alert>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <template v-if="!confirmStep">
        <el-button
          type="primary"
          :disabled="!canSubmit"
          :loading="checking"
          class="ripple-btn"
          @click="handleFirstConfirm"
        >
          <el-icon><Check /></el-icon>
          下一步
        </el-button>
      </template>
      <template v-else>
        <el-button @click="confirmStep = false">返回修改</el-button>
        <el-button
          type="primary"
          :loading="submitting"
          class="ripple-btn confirm-btn"
          @click="handleSubmit"
        >
          <el-icon><Check /></el-icon>
          确认变更
        </el-button>
      </template>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  CircleCheck,
  CircleClose,
  Warning,
  InfoFilled,
  Check,
  Right,
  SuccessFilled,
  WarningFilled,
  CloseBold,
  Lock
} from '@element-plus/icons-vue'
import {
  preCheckStatusChangeApi,
  changeAccountStatusApi
} from '@/api/driver'
import {
  DriverStatus,
  DriverStatusMap,
  DriverStatusTypeMap
} from '@/enums/driver'
import { formatPhone } from '@/utils/format'
import type { Driver, PreCheckResult } from '@/types/driver'

const props = defineProps<{
  modelValue: boolean
  driver: Driver | null
}>()

const emit = defineEmits(['update:modelValue', 'success'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const targetStatus = ref<number>(0)
const changeReason = ref('')
const banEndTime = ref('')
const checking = ref(false)
const submitting = ref(false)
const confirmStep = ref(false)
const preCheckResult = ref<PreCheckResult | null>(null)

const currentDriver = computed(() => props.driver)

const dialogTitle = computed(() => {
  if (!currentDriver.value) return '账号状态变更'
  return `${currentDriver.value.name} - 账号状态变更`
})

const statusOptions = [
  {
    value: DriverStatus.NORMAL,
    label: '正常',
    desc: '所有权限正常',
    color: '#67c23a',
    icon: SuccessFilled
  },
  {
    value: DriverStatus.RESTRICTED,
    label: '限制接单',
    desc: '禁止接单，可上线和提现',
    color: '#e6a23c',
    icon: WarningFilled
  },
  {
    value: DriverStatus.TEMP_BAN,
    label: '临时封禁',
    desc: '禁止所有操作，到期自动恢复',
    color: '#f56c6c',
    icon: CloseBold
  },
  {
    value: DriverStatus.PERMANENT_BAN,
    label: '永久封禁',
    desc: '永久禁止所有操作',
    color: '#909399',
    icon: Lock
  }
]

const canSubmit = computed(() => {
  if (targetStatus.value === undefined || targetStatus.value === null) return false
  if (!changeReason.value.trim()) return false
  if (targetStatus.value === DriverStatus.TEMP_BAN && !banEndTime.value) return false
  if (currentDriver.value && currentDriver.value.status === targetStatus.value) return false
  return true
})

const handleSelectStatus = async (status: number) => {
  if (status === DriverStatus.NORMAL && currentDriver.value?.status === DriverStatus.PERMANENT_BAN) {
    ElMessage.warning('永久封禁账号禁止解封，需走特殊审批流程')
    return
  }
  targetStatus.value = status
  confirmStep.value = false
  preCheckResult.value = null

  if (currentDriver.value) {
    checking.value = true
    try {
      const res = await preCheckStatusChangeApi(currentDriver.value.id, status)
      preCheckResult.value = res.data
    } catch (error: any) {
      ElMessage.error(error.message || '前置校验失败')
    } finally {
      checking.value = false
    }
  }
}

const disabledDate = (time: Date) => {
  return time.getTime() < Date.now()
}

const getPermPreview = (status: number) => {
  const rules: Record<number, { canAcceptOrder: boolean; canWithdraw: boolean; canGoOnline: boolean; trafficWeight: number }> = {
    [DriverStatus.NORMAL]: { canAcceptOrder: true, canWithdraw: true, canGoOnline: true, trafficWeight: 1.0 },
    [DriverStatus.RESTRICTED]: { canAcceptOrder: false, canWithdraw: true, canGoOnline: true, trafficWeight: 0.3 },
    [DriverStatus.TEMP_BAN]: { canAcceptOrder: false, canWithdraw: false, canGoOnline: false, trafficWeight: 0 },
    [DriverStatus.PERMANENT_BAN]: { canAcceptOrder: false, canWithdraw: false, canGoOnline: false, trafficWeight: 0 }
  }
  return rules[status] || rules[0]
}

const handleFirstConfirm = () => {
  if (!canSubmit.value) return
  if (!preCheckResult.value || preCheckResult.value.violations.length > 0) {
    ElMessageBox.confirm(
      '当前存在违规项，是否仍要继续执行操作？',
      '违规提醒',
      { type: 'warning' }
    ).then(() => {
      confirmStep.value = true
    }).catch(() => {})
  } else {
    confirmStep.value = true
  }
}

const handleSubmit = async () => {
  if (!currentDriver.value) return
  submitting.value = true
  try {
    await changeAccountStatusApi(
      currentDriver.value.id,
      targetStatus.value,
      changeReason.value,
      targetStatus.value === DriverStatus.TEMP_BAN ? banEndTime.value : undefined
    )
    ElMessage.success('状态变更成功')
    emit('success')
    handleClose()
  } catch (error: any) {
    ElMessage.error(error.message || '状态变更失败')
  } finally {
    submitting.value = false
  }
}

const handleClose = () => {
  visible.value = false
  nextTick(() => {
    targetStatus.value = 0
    changeReason.value = ''
    banEndTime.value = ''
    confirmStep.value = false
    preCheckResult.value = null
  })
}

watch(() => props.driver, (newDriver) => {
  if (newDriver) {
    targetStatus.value = newDriver.status
    confirmStep.value = false
    preCheckResult.value = null
  }
})
</script>

<style lang="scss" scoped>
.status-dialog {
  .driver-info-card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf3 100%);
    border-radius: 8px;
    margin-bottom: 20px;

    .info {
      flex: 1;
      .name {
        font-size: 16px;
        font-weight: 600;
        color: #303133;
      }
      .phone {
        font-size: 13px;
        color: #909399;
        margin-top: 4px;
      }
    }
  }

  .section-title {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 12px;
  }

  .status-options {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-bottom: 20px;

    .status-option {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px;
      border: 2px solid #e4e7ed;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.25s;

      &:hover {
        border-color: #409eff;
        background: #ecf5ff;
      }

      &.active {
        border-color: #409eff;
        background: #ecf5ff;
        box-shadow: 0 2px 8px rgba(64, 158, 255, 0.15);
      }

      &.disabled {
        opacity: 0.5;
        cursor: not-allowed;
        &:hover {
          border-color: #e4e7ed;
          background: #fff;
        }
      }

      .status-icon {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-size: 20px;
        flex-shrink: 0;
      }

      .status-info {
        .status-name {
          font-size: 14px;
          font-weight: 600;
          color: #303133;
        }
        .status-desc {
          font-size: 12px;
          color: #909399;
          margin-top: 2px;
        }
      }
    }
  }

  .form-item {
    margin-bottom: 16px;

    .form-label {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: #303133;
      margin-bottom: 8px;

      .required {
        color: #f56c6c;
        margin-left: 4px;
      }
    }
  }

  .pre-check-section {
    background: #fafafa;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 16px;

    .check-summary {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      font-size: 15px;
      font-weight: 600;

      .success {
        color: #67c23a;
        font-size: 20px;
      }
      .danger {
        color: #f56c6c;
        font-size: 20px;
      }
      .text-success {
        color: #67c23a;
      }
      .text-danger {
        color: #f56c6c;
      }
    }

    .check-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-bottom: 12px;

      .stat-item {
        background: #fff;
        padding: 10px;
        border-radius: 6px;
        text-align: center;

        .stat-label {
          font-size: 12px;
          color: #909399;
        }
        .stat-value {
          font-size: 18px;
          font-weight: 600;
          color: #303133;
          margin-top: 4px;
        }
        .text-danger {
          color: #f56c6c;
        }
        .text-warning {
          color: #e6a23c;
        }
      }
    }

    .check-alert {
      margin-bottom: 8px;

      .alert-title {
        display: flex;
        align-items: center;
        gap: 6px;
        font-weight: 600;
      }

      .violation-list {
        margin-top: 8px;

        .violation-item {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 13px;
          padding: 4px 0;

          &.danger {
            color: #f56c6c;
          }
          &.warning {
            color: #e6a23c;
          }

          .violation-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #f56c6c;
            margin-top: 7px;
            flex-shrink: 0;

            &.warning {
              background: #e6a23c;
            }
          }
        }
      }
    }
  }

  .permission-section {
    margin-bottom: 16px;

    .permission-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;

      .permission-item {
        background: #f5f7fa;
        padding: 12px;
        border-radius: 6px;
        text-align: center;

        .perm-label {
          font-size: 12px;
          color: #909399;
          margin-bottom: 6px;
        }
      }
    }
  }

  .confirm-section {
    .confirm-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 600;
    }

    .confirm-content {
      margin-top: 8px;
      font-size: 14px;
      color: #303133;

      p {
        margin: 8px 0;
      }

      .arrow {
        color: #909399;
        margin: 0 8px;
      }

      .confirm-reason {
        color: #606266;
      }
    }
  }
}

.ripple-btn {
  position: relative;
  overflow: hidden;
  transition: all 0.3s;

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.5);
    transform: translate(-50%, -50%);
    transition: width 0.4s, height 0.4s;
    pointer-events: none;
  }

  &:active::after {
    width: 300px;
    height: 300px;
  }

  &.confirm-btn {
    background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
    border: none;

    &:hover {
      background: linear-gradient(135deg, #66b1ff 0%, #409eff 100%);
      box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
    }
  }
}
</style>
