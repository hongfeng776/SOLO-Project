<template>
  <Transition name="scale-fade">
    <el-dialog
      v-model="visible"
      :title="dialogTitle"
      width="600px"
      :close-on-click-modal="false"
      @closed="handleClosed"
    >
      <div v-if="loading" class="loading-wrapper">
        <el-skeleton :rows="8" animated />
      </div>

      <div v-else-if="userDetail" class="dialog-content">
        <div class="user-info-section">
          <div class="user-avatar-wrapper">
            <el-avatar :size="64" :src="userDetail.user.avatar">
              {{ userDetail.user.nickname?.charAt(0) }}
            </el-avatar>
            <el-tag
              class="current-level-tag"
              :color="USER_LEVEL_COLORS[userDetail.user.userLevel]"
              effect="dark"
              size="small"
            >
              {{ USER_LEVEL_NAMES[userDetail.user.userLevel] }}
            </el-tag>
          </div>
          <div class="user-basic-info">
            <div class="user-name">
              {{ userDetail.user.nickname }}
              <span class="user-uid">UID: {{ userDetail.user.id }}</span>
            </div>
            <div class="user-score">
              <span class="score-label">当前分值：</span>
              <span class="score-value" :style="{ color: getScoreColor(userDetail.user.levelScore) }">
                {{ userDetail.user.levelScore }}
              </span>
              <span class="score-max">/ 100</span>
            </div>
          </div>
        </div>

        <el-divider style="margin: 16px 0" />

        <div class="adjust-section">
          <div class="section-title">等级调整</div>

          <div class="level-selector">
            <div
              v-for="level in availableLevels"
              :key="level.value"
              class="level-option"
              :class="{
                active: selectedLevel === level.value,
                disabled: !level.allowed,
                current: userDetail.user.userLevel === level.value
              }"
              @click="level.allowed && handleSelectLevel(level.value)"
            >
              <div
                class="level-indicator"
                :style="{ backgroundColor: USER_LEVEL_COLORS[level.value] }"
              ></div>
              <div class="level-info">
                <div class="level-name">{{ USER_LEVEL_NAMES[level.value] }}</div>
                <div class="level-requirement">
                  {{ level.value === UserLevel.RESTRICTED ? '手动设置' : `需要 ${LEVEL_SCORE_THRESHOLDS[level.value]} 分` }}
                </div>
              </div>
              <el-icon v-if="userDetail.user.userLevel === level.value" class="current-icon">
                <CircleCheckFilled />
              </el-icon>
              <el-icon v-else-if="!level.allowed" class="locked-icon">
                <Lock />
              </el-icon>
            </div>
          </div>

          <div v-if="validationResult" class="validation-result">
            <el-alert
              v-if="!validationResult.allowed"
              :title="validationResult.reason || '调整不允许'"
              type="error"
              :closable="false"
              show-icon
            />
            <el-alert
              v-else-if="validationResult.isCrossLevel"
              :title="validationResult.crossLevelWarning || '越级调整警告'"
              type="warning"
              :closable="false"
              show-icon
            />
          </div>
        </div>

        <el-divider style="margin: 16px 0" />

        <div v-if="selectedLevel !== userDetail.user.userLevel" class="benefits-change-section">
          <div class="section-title">权益变更预览</div>

          <div class="benefits-compare">
            <div class="benefits-column old-benefits">
              <div class="column-title">当前权益</div>
              <div class="benefits-list">
                <div
                  v-for="benefit in currentBenefits"
                  :key="benefit.key"
                  class="benefit-item old"
                >
                  <el-icon><Check /></el-icon>
                  <span>{{ benefit.name }}</span>
                </div>
                <div
                  v-for="benefit in removedBenefits"
                  :key="benefit.key"
                  class="benefit-item removed"
                >
                  <el-icon><Close /></el-icon>
                  <span>{{ benefit.name }}</span>
                </div>
              </div>
            </div>

            <div class="benefits-arrow">
              <el-icon :size="24" color="#409eff"><Right /></el-icon>
            </div>

            <div class="benefits-column new-benefits">
              <div class="column-title">调整后权益</div>
              <div class="benefits-list">
                <div
                  v-for="benefit in currentBenefits.filter(b => newBenefitKeys.includes(b.key))"
                  :key="benefit.key"
                  class="benefit-item unchanged"
                >
                  <el-icon><Check /></el-icon>
                  <span>{{ benefit.name }}</span>
                </div>
                <div
                  v-for="benefit in addedBenefits"
                  :key="benefit.key"
                  class="benefit-item added"
                >
                  <el-icon><Plus /></el-icon>
                  <span>{{ benefit.name }}</span>
                </div>
              </div>
            </div>
          </div>

          <TransitionGroup name="float-up" tag="div" class="floating-benefits">
            <div
              v-for="benefit in addedBenefits"
              :key="benefit.key"
              class="floating-item add"
            >
              + {{ benefit.name }}
            </div>
            <div
              v-for="benefit in removedBenefits"
              :key="benefit.key"
              class="floating-item remove"
            >
              - {{ benefit.name }}
            </div>
          </TransitionGroup>
        </div>

        <div class="reason-section">
          <el-form :model="formData" label-width="80px">
            <el-form-item label="调整原因" required>
              <el-select
                v-model="formData.reason"
                placeholder="请选择调整原因"
                style="width: 100%"
              >
                <el-option
                  v-for="(name, value) in LEVEL_ADJUST_REASON_NAMES"
                  :key="value"
                  :label="name"
                  :value="value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="详细说明">
              <el-input
                v-model="formData.reasonDetail"
                type="textarea"
                :rows="3"
                placeholder="请输入详细说明（可选）"
                maxlength="500"
                show-word-limit
              />
            </el-form-item>
          </el-form>
        </div>
      </div>

      <template #footer>
        <el-button @click="handleCancel">取消</el-button>
        <el-button
          type="primary"
          :loading="submitting"
          :disabled="!canSubmit"
          @click="handleSubmit"
        >
          确认调整
        </el-button>
      </template>
    </el-dialog>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  CircleCheckFilled,
  Lock,
  Check,
  Close,
  Right,
  Plus
} from '@element-plus/icons-vue'
import {
  getUserLevelDetail,
  validateLevelAdjustment,
  adjustLevel
} from '@api/user-level'
import type {
  UserLevelDetail,
  LevelAdjustValidationResult,
  UserBenefit as UserBenefitType
} from '@/types/business'
import {
  UserLevel,
  USER_LEVEL_NAMES,
  USER_LEVEL_COLORS,
  USER_BENEFIT_NAMES,
  USER_LEVEL_BENEFITS,
  LEVEL_SCORE_THRESHOLDS,
  LEVEL_ADJUST_REASON_NAMES
} from '@/enums/business'

const props = defineProps<{
  modelValue: boolean
  userId: number | null
  targetLevel: number
  currentLevel: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'adjusted': []
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const loading = ref(false)
const submitting = ref(false)
const userDetail = ref<UserLevelDetail | null>(null)
const selectedLevel = ref(props.targetLevel)
const validationResult = ref<LevelAdjustValidationResult | null>(null)

const formData = ref({
  reason: '',
  reasonDetail: ''
})

const dialogTitle = computed(() => {
  if (!userDetail.value) return '等级调整'
  if (selectedLevel.value > userDetail.value.user.userLevel) {
    return `升级到${USER_LEVEL_NAMES[selectedLevel.value]}用户`
  } else if (selectedLevel.value < userDetail.value.user.userLevel) {
    return `降级到${USER_LEVEL_NAMES[selectedLevel.value]}用户`
  }
  return '用户等级详情'
})

const canSubmit = computed(() => {
  if (!userDetail.value) return false
  if (selectedLevel.value === userDetail.value.user.userLevel) return false
  if (!formData.value.reason) return false
  if (validationResult.value && !validationResult.value.allowed) return false
  return true
})

const availableLevels = computed(() => {
  if (!userDetail.value) return []

  const levels = [
    UserLevel.RESTRICTED,
    UserLevel.NORMAL,
    UserLevel.ACTIVE,
    UserLevel.PREMIUM
  ]

  return levels.map(level => {
    if (level === UserLevel.RESTRICTED) {
      return {
        value: level,
        allowed: true
      }
    }
    const requiredScore = LEVEL_SCORE_THRESHOLDS[level] || 0
    const currentScore = userDetail.value?.user.levelScore || 0
    return {
      value: level,
      allowed: currentScore >= requiredScore
    }
  })
})

const currentBenefits = computed<UserBenefitType[]>(() => {
  if (!userDetail.value) return []
  const benefitKeys = USER_LEVEL_BENEFITS[userDetail.value.user.userLevel] || []
  return benefitKeys.map(key => ({
    key,
    name: USER_BENEFIT_NAMES[key] || key,
    enabled: true,
    description: ''
  }))
})

const newBenefitKeys = computed(() => {
  return USER_LEVEL_BENEFITS[selectedLevel.value] || []
})

const addedBenefits = computed<UserBenefitType[]>(() => {
  if (!userDetail.value) return []
  const currentKeys = USER_LEVEL_BENEFITS[userDetail.value.user.userLevel] || []
  const newKeys = newBenefitKeys.value
  return newKeys
    .filter(key => !currentKeys.includes(key))
    .map(key => ({
      key,
      name: USER_BENEFIT_NAMES[key] || key,
      enabled: true,
      description: ''
    }))
})

const removedBenefits = computed<UserBenefitType[]>(() => {
  if (!userDetail.value) return []
  const currentKeys = USER_LEVEL_BENEFITS[userDetail.value.user.userLevel] || []
  const newKeys = newBenefitKeys.value
  return currentKeys
    .filter(key => !newKeys.includes(key))
    .map(key => ({
      key,
      name: USER_BENEFIT_NAMES[key] || key,
      enabled: false,
      description: ''
    }))
})

const getScoreColor = (score: number) => {
  if (score >= 85) return '#e6a23c'
  if (score >= 60) return '#409eff'
  if (score >= 0) return '#909399'
  return '#f56c6c'
}

const loadUserDetail = async () => {
  if (!props.userId) return

  loading.value = true
  try {
    userDetail.value = await getUserLevelDetail(props.userId)
    selectedLevel.value = props.targetLevel

    if (selectedLevel.value !== userDetail.value.user.userLevel) {
      await validateAdjustment()
    }
  } catch (error) {
    ElMessage.error('加载用户详情失败')
  } finally {
    loading.value = false
  }
}

const validateAdjustment = async () => {
  if (!props.userId) return

  try {
    validationResult.value = await validateLevelAdjustment(props.userId, {
      targetLevel: selectedLevel.value
    })
  } catch (error) {
    validationResult.value = null
  }
}

const handleSelectLevel = async (level: number) => {
  if (!userDetail.value) return
  if (level === userDetail.value.user.userLevel) {
    selectedLevel.value = level
    validationResult.value = null
    return
  }

  selectedLevel.value = level
  await validateAdjustment()
}

const handleSubmit = async () => {
  if (!props.userId || !userDetail.value) return

  try {
    await ElMessageBox.confirm(
      `确定将用户「${userDetail.value.user.nickname}」从「${USER_LEVEL_NAMES[userDetail.value.user.userLevel]}」调整为「${USER_LEVEL_NAMES[selectedLevel.value]}」吗？`,
      '确认调整',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: selectedLevel.value > userDetail.value.user.userLevel ? 'warning' : 'info'
      }
    )
  } catch {
    return
  }

  submitting.value = true
  try {
    const result = await adjustLevel(props.userId, {
      targetLevel: selectedLevel.value,
      reason: formData.value.reason,
      reasonDetail: formData.value.reasonDetail
    })

    if (result.success) {
      ElMessage.success(result.message)
      emit('adjusted')
      visible.value = false
    } else {
      ElMessage.error(result.message)
    }
  } catch (error) {
    ElMessage.error('调整失败，请重试')
  } finally {
    submitting.value = false
  }
}

const handleCancel = () => {
  visible.value = false
}

const handleClosed = () => {
  userDetail.value = null
  validationResult.value = null
  formData.value = {
    reason: '',
    reasonDetail: ''
  }
}

watch(
  () => [props.modelValue, props.userId],
  ([newVisible, userId]) => {
    if (newVisible && userId) {
      nextTick(() => {
        loadUserDetail()
      })
    }
  }
)
</script>

<style lang="scss" scoped>
.scale-fade-enter-active,
.scale-fade-leave-active {
  transition: all 0.3s ease;
}

.scale-fade-enter-from,
.scale-fade-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

.float-up-enter-active {
  transition: all 0.5s ease-out;
}

.float-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.loading-wrapper {
  padding: 20px 0;
}

.dialog-content {
  .user-info-section {
    display: flex;
    align-items: center;
    gap: 20px;

    .user-avatar-wrapper {
      position: relative;

      .current-level-tag {
        position: absolute;
        top: -6px;
        right: -6px;
      }
    }

    .user-basic-info {
      .user-name {
        font-size: 18px;
        font-weight: 600;
        color: $text-primary;
        margin-bottom: 8px;

        .user-uid {
          font-size: 12px;
          color: $text-secondary;
          font-weight: normal;
          margin-left: 8px;
        }
      }

      .user-score {
        display: flex;
        align-items: center;
        gap: 4px;

        .score-label {
          font-size: 14px;
          color: $text-placeholder;
        }

        .score-value {
          font-size: 24px;
          font-weight: 600;
        }

        .score-max {
          font-size: 14px;
          color: $text-placeholder;
        }
      }
    }
  }

  .section-title {
    font-size: 14px;
    font-weight: 600;
    color: $text-primary;
    margin-bottom: 12px;
  }

  .level-selector {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .level-option {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border: 1px solid $border-color-lighter;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover:not(.disabled) {
        border-color: $color-primary;
        background-color: rgba(64, 158, 255, 0.05);
      }

      &.active {
        border-color: $color-primary;
        background-color: rgba(64, 158, 255, 0.1);
      }

      &.disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .level-indicator {
        width: 12px;
        height: 12px;
        border-radius: 50%;
      }

      .level-info {
        flex: 1;

        .level-name {
          font-weight: 600;
          color: $text-primary;
          margin-bottom: 2px;
        }

        .level-requirement {
          font-size: 12px;
          color: $text-placeholder;
        }
      }

      .current-icon {
        color: #67c23a;
        font-size: 20px;
      }

      .locked-icon {
        color: $text-placeholder;
        font-size: 20px;
      }
    }
  }

  .validation-result {
    margin-top: 12px;
  }

  .benefits-change-section {
    position: relative;

    .benefits-compare {
      display: flex;
      align-items: stretch;
      gap: 16px;

      .benefits-column {
        flex: 1;
        padding: 16px;
        background-color: $bg-color-page;
        border-radius: 8px;

        .column-title {
          font-size: 13px;
          font-weight: 600;
          color: $text-secondary;
          margin-bottom: 12px;
        }

        .benefits-list {
          display: flex;
          flex-direction: column;
          gap: 8px;

          .benefit-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 13px;

            &.old {
              color: $text-secondary;
              background-color: rgba(144, 147, 153, 0.1);
            }

            &.unchanged {
              color: $text-secondary;
              background-color: rgba(144, 147, 153, 0.1);
            }

            &.added {
              color: #67c23a;
              background-color: rgba(103, 194, 58, 0.1);
            }

            &.removed {
              color: #f56c6c;
              background-color: rgba(245, 108, 108, 0.1);
              text-decoration: line-through;
            }
          }
        }
      }

      .benefits-arrow {
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }

    .floating-benefits {
      position: absolute;
      top: 50%;
      right: 20px;
      transform: translateY(-50%);
      pointer-events: none;

      .floating-item {
        padding: 6px 12px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 600;
        margin-bottom: 8px;

        &.add {
          color: #67c23a;
          background-color: rgba(103, 194, 58, 0.2);
        }

        &.remove {
          color: #f56c6c;
          background-color: rgba(245, 108, 108, 0.2);
        }
      }
    }
  }

  .reason-section {
    margin-top: 20px;
  }
}
</style>
