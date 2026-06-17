<template>
  <div class="page-container">
    <el-card shadow="never" class="mb-20">
      <el-form :model="formData" label-width="100px" inline @submit.prevent>
        <el-form-item label="操作类型">
          <el-radio-group v-model="operationType">
            <el-radio-button value="update">完善信息</el-radio-button>
            <el-radio-button value="reset">重置配置</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="筛选条件">
          <el-select
            v-model="formData.filterType"
            placeholder="选择用户群体"
            clearable
            style="width: 160px"
          >
            <el-option
              v-for="(name, value) in USER_FILTER_TYPE_NAMES"
              :key="value"
              :label="name"
              :value="value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="操作范围">
          <el-radio-group v-model="formData.scope">
            <el-radio
              v-for="(name, value) in BATCH_OPERATION_SCOPE_NAMES"
              :key="value"
              :value="value"
            >
              {{ name }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="mb-20" v-if="operationType === 'update'">
      <template #header>
        <span class="card-title">完善信息</span>
      </template>

      <el-form :model="formData.updates" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="默认昵称">
              <div class="form-item-with-validate">
                <el-input
                  v-model="formData.updates.nickname"
                  placeholder="留空则不修改"
                  @blur="validateField('nickname')"
                >
                  <template #append>
                    <el-icon
                      v-if="fieldValidation.nickname.validating"
                      class="valid-icon"
                    >
                      <Loading />
                    </el-icon>
                    <el-icon
                      v-else-if="fieldValidation.nickname.valid"
                      class="valid-icon success"
                    >
                      <CircleCheckFilled />
                    </el-icon>
                    <el-icon
                      v-else-if="fieldValidation.nickname.message"
                      class="valid-icon error"
                    >
                      <CircleCloseFilled />
                    </el-icon>
                  </template>
                </el-input>
                <div v-if="fieldValidation.nickname.message" class="error-message">
                  {{ fieldValidation.nickname.message }}
                </div>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="默认头像">
              <div class="form-item-with-validate">
                <el-input
                  v-model="formData.updates.avatar"
                  placeholder="留空则不修改"
                  @blur="validateField('avatar')"
                >
                  <template #append>
                    <el-icon
                      v-if="fieldValidation.avatar.validating"
                      class="valid-icon"
                    >
                      <Loading />
                    </el-icon>
                    <el-icon
                      v-else-if="fieldValidation.avatar.valid"
                      class="valid-icon success"
                    >
                      <CircleCheckFilled />
                    </el-icon>
                    <el-icon
                      v-else-if="fieldValidation.avatar.message"
                      class="valid-icon error"
                    >
                      <CircleCloseFilled />
                    </el-icon>
                  </template>
                </el-input>
                <div v-if="fieldValidation.avatar.message" class="error-message">
                  {{ fieldValidation.avatar.message }}
                </div>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="默认邮箱">
              <div class="form-item-with-validate">
                <el-input
                  v-model="formData.updates.email"
                  placeholder="留空则不修改"
                  @blur="validateField('email')"
                >
                  <template #append>
                    <el-icon
                      v-if="fieldValidation.email.validating"
                      class="valid-icon"
                    >
                      <Loading />
                    </el-icon>
                    <el-icon
                      v-else-if="fieldValidation.email.valid"
                      class="valid-icon success"
                    >
                      <CircleCheckFilled />
                    </el-icon>
                    <el-icon
                      v-else-if="fieldValidation.email.message"
                      class="valid-icon error"
                    >
                      <CircleCloseFilled />
                    </el-icon>
                  </template>
                </el-input>
                <div v-if="fieldValidation.email.message" class="error-message">
                  {{ fieldValidation.email.message }}
                </div>
              </div>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <el-card shadow="never" class="mb-20" v-else>
      <template #header>
        <span class="card-title">重置配置</span>
      </template>

      <el-form label-width="100px">
        <el-form-item label="重置项">
          <el-checkbox-group v-model="formData.resetItems">
            <el-checkbox value="avatar">重置头像</el-checkbox>
            <el-checkbox value="email">重置邮箱</el-checkbox>
            <el-checkbox value="reviewLevel">重置审核等级</el-checkbox>
            <el-checkbox value="reviewCount">重置审核计数</el-checkbox>
            <el-checkbox value="opsCount">重置运维计数</el-checkbox>
            <el-checkbox value="isSeniorReviewer">取消高级审核员</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <template #header>
      <div class="card-header">
        <span class="card-title">操作原因</span>
      </div>
      </template>

      <el-form label-width="100px">
        <el-form-item label="操作原因">
          <el-input
            v-model="formData.reason"
            type="textarea"
            :rows="2"
            placeholder="请输入操作原因"
            maxlength="200"
            show-word-limit
            style="width: 600px"
          />
        </el-form-item>
        <el-form-item>
          <el-tooltip
            v-if="!canOperate"
            content="无权限执行批量操作，请联系高级运营"
            placement="top"
          >
            <el-button type="primary" :icon="Operation" disabled>执行批量操作</el-button>
          </el-tooltip>
          <el-button
            v-else
            type="primary"
            :icon="Operation"
            :loading="operating"
            :disabled="!canSubmit"
            @click="handleOperate"
          >
            执行批量操作
          </el-button>
          <el-button :icon="Refresh" @click="handleReset">重置表单</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-dialog
      v-model="progressVisible"
      title="批量操作进度"
      width="500px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div v-if="operating" class="progress-content">
        <div class="progress-header">
          <span class="progress-title">正在执行批量操作...</span>
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
        <div class="skeleton-list">
          <el-skeleton
            v-for="i in Math.min(5, progressTotal - progressCurrent + 1)"
            :key="i"
            :rows="1"
            animated
          />
        </div>
      </div>
      <div v-else class="result-content">
        <div class="result-icon success">
          <el-icon :size="60" color="#67c23a">
            <CircleCheckFilled />
          </el-icon>
          <div class="result-title">操作完成</div>
          <div class="result-stats">
            <div class="stat-item">
              <div class="stat-value">{{ progressTotal }}</div>
              <div class="stat-label">总计</div>
            </div>
            <div class="stat-item success">
              <div class="stat-value">{{ progressSuccess }}</div>
              <div class="result-label">成功</div>
            </div>
            <div class="stat-item error">
              <div class="stat-value">{{ progressFail }}</div>
              <div class="stat-label">失败</div>
            </div>
          </div>
        </div>
        <el-table v-if="progressFail > 0" :data="failResults" max-height="200">
          <el-table-column prop="userId" label="用户ID" width="100" />
          <el-table-column prop="error" label="失败原因" />
        </el-table>
      </div>
      <template #footer>
        <el-button @click="progressVisible = false" v-if="!operating">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Operation,
  Refresh,
  Loading,
  CircleCheckFilled,
  CircleCloseFilled
} from '@element-plus/icons-vue'
import { useUserStore } from '@stores/modules/user'
import {
  validatePhone,
  validateNickname,
  validateAvatar,
  batchUpdateUsers,
  batchResetConfig
} from '@api/user-account'
import {
  USER_FILTER_TYPE_NAMES,
  BATCH_OPERATION_SCOPE_NAMES
} from '@/enums/business'

const userStore = useUserStore()

const canOperate = computed(() => {
  return userStore.hasRole('admin') ||
    userStore.hasRole('senior_operator') ||
    userStore.hasPermission('user:account:batch')
})

const operationType = ref<'update' | 'reset'>('update')
const operating = ref(false)
const progressVisible = ref(false)
const progressPercent = ref(0)
const progressCurrent = ref(0)
const progressTotal = ref(0)
const progressSuccess = ref(0)
const progressFail = ref(0)
const failResults = ref<Array<{ userId: number; error: string }>>([])

const formData = reactive({
  filterType: '',
  scope: 'filtered',
  updates: {
    nickname: '',
    avatar: '',
    phone: '',
    email: '',
    realName: ''
  },
  resetItems: [] as string[],
  reason: ''
})

const fieldValidation = reactive({
  nickname: { validating: false, valid: true, message: '' },
  avatar: { validating: false, valid: true, message: '' },
  phone: { validating: false, valid: true, message: '' },
  email: { validating: false, valid: true, message: '' }
})

const canSubmit = computed(() => {
  if (formData.scope === 'filtered' && !formData.filterType) {
    return false
  }

  if (operationType.value === 'update') {
    const hasUpdates = Object.values(formData.updates).some(v => v !== '')
    const allValid = Object.values(fieldValidation).every(v => v.valid)
    return hasUpdates && allValid && formData.reason.trim() !== ''
  } else {
    return formData.resetItems.length > 0 && formData.reason.trim() !== ''
  }
})

const validateField = async (field: 'nickname' | 'avatar' | 'phone' | 'email') => {
  const value = formData.updates[field]
  if (!value) {
    fieldValidation[field].valid = true
    fieldValidation[field].message = ''
    return
  }

  fieldValidation[field].validating = true
  fieldValidation[field].message = ''

  try {
    let result: { valid: boolean; message?: string } = { valid: true }

    switch (field) {
      case 'nickname':
        result = await validateNickname({ nickname: value })
        break
      case 'avatar':
        result = await validateAvatar({ avatar: value })
        break
      case 'phone':
        result = await validatePhone({ phone: value })
        break
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        result = {
          valid: emailRegex.test(value),
          message: emailRegex.test(value) ? '' : '邮箱格式不正确'
        }
        break
    }

    fieldValidation[field].valid = result.valid
    fieldValidation[field].message = result.message || ''
  } catch (error: any) {
    fieldValidation[field].valid = false
    fieldValidation[field].message = error.message || '校验失败'
  } finally {
    fieldValidation[field].validating = false
  }
}

const handleReset = () => {
  formData.filterType = ''
  formData.scope = 'filtered'
  formData.updates = {
    nickname: '',
    avatar: '',
    phone: '',
    email: '',
    realName: ''
  }
  formData.resetItems = []
  formData.reason = ''
  Object.keys(fieldValidation).forEach(key => {
    fieldValidation[key as keyof typeof fieldValidation] = {
      validating: false,
      valid: true,
      message: ''
    }
  })
}

const handleOperate = async () => {
  ElMessageBox.confirm(
    `确定要对${BATCH_OPERATION_SCOPE_NAMES[formData.scope]}执行${operationType.value === 'update' ? '批量完善信息' : '批量重置配置'}操作吗？`,
    '确认操作',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
      progressVisible.value = true
      operating.value = true
      progressPercent.value = 0
      progressCurrent.value = 0
      progressSuccess.value = 0
      progressFail.value = 0
      failResults.value = []

      try {
        let result: any

        if (operationType.value === 'update') {
          result = await batchUpdateUsers({
            filterType: formData.filterType || undefined,
            scope: formData.scope,
            updates: formData.updates,
            reason: formData.reason
          })
        } else {
          result = await batchResetConfig({
            filterType: formData.filterType || undefined,
            scope: formData.scope,
            resetItems: formData.resetItems,
            reason: formData.reason
          })
        }

        progressTotal.value = result.total
        progressSuccess.value = result.success
        progressFail.value = result.fail
        progressPercent.value = 100
        failResults.value = result.results.filter((r: any) => !r.success).map((r: any) => ({
          userId: r.userId,
          error: r.error
        }))

        ElMessage.success('批量操作完成')
        handleReset()
      } catch (error: any) {
        ElMessage.error(error.message || '操作失败')
      } finally {
        operating.value = false
      }
    }).catch(() => {})
}
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

  .form-item-with-validate {
    width: 100%;

    .valid-icon {
      font-size: 16px;
      color: #c0c4cc;
      animation: spin 1s linear infinite;

      &.success {
        color: #67c23a;
        animation: none;
      }

      &.error {
        color: #f56c6c;
        animation: none;
      }
    }

    .error-message {
      color: #f56c6c;
      font-size: 12px;
      margin-top: 4px;
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
    margin-top: 16px 0;
    font-size: 13px;
    color: $text-secondary;
  }

  .skeleton-list {
    margin-top: 20px;

    :deep(.el-skeleton) {
      margin-bottom: 8px;
    }
  }

  .result-icon {
    text-align: center;
    margin-bottom: 20px;

    &.success {
      color: #67c23a;
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

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
}
</style>
