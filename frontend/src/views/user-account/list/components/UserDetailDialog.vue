<template>
  <el-dialog
    v-model="dialogVisible"
    title="用户详情"
    width="720px"
    destroy-on-close
    @close="handleClose"
  >
    <div v-if="loading" class="skeleton-loading">
      <el-skeleton :rows="8" animated />
    </div>
    <div v-else-if="detail" class="detail-content">
      <div class="user-header">
        <div class="avatar-wrapper">
          <el-avatar :size="80" :src="detail.user.avatar">
            {{ detail.user.nickname?.charAt(0) }}
          </el-avatar>
          <el-tag
            v-if="detail.user.isAbnormal === 1"
            class="abnormal-tag"
            type="danger"
            effect="dark"
            size="small"
          >
            异常
          </el-tag>
        </div>
        <div class="user-basic">
          <div class="user-name">
            {{ detail.user.nickname }}
            <el-tag
              v-if="detail.user.realNameVerified === 2"
              type="success"
              effect="light"
              size="small"
            >
              已实名
            </el-tag>
            <el-tag
              v-if="detail.user.phoneVerified === 1"
              type="primary"
              effect="light"
              size="small"
            >
              已绑手机
            </el-tag>
          </div>
          <div class="user-meta">
            <span>UID: {{ detail.user.id }}</span>
            <span>用户名: {{ detail.user.username }}</span>
            <span>注册来源: {{ REGISTER_SOURCE_NAMES[detail.user.registerSource] || detail.user.registerSource }}</span>
          </div>
          <div class="user-status">
            <div class="status-item">
              <span class="label">信息完整度</span>
              <el-progress
                :percentage="detail.user.infoCompleteness || 0"
                :stroke-width="12"
                :color="getProgressColor(detail.user.infoCompleteness)"
                style="width: 160px"
              />
            </div>
          </div>
        </div>
      </div>

      <el-alert
        v-if="detail.preCheck.issues.length > 0"
        :title="`账号存在 ${detail.preCheck.issues.length} 项待处理问题`"
        type="warning"
        :closable="false"
        show-icon
        class="mb-20"
      >
        <template #default>
          <div class="issues-list">
            <div v-for="(issue, index) in detail.preCheck.issues" :key="index" class="issue-item">
              <el-icon :size="14" color="#e6a23c"><Warning /></el-icon>
              {{ issue }}
            </div>
          </div>
        </template>
      </el-alert>

      <el-tabs v-model="activeTab">
        <el-tab-pane label="基本信息" name="basic">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="用户UID">{{ detail.user.id }}</el-descriptions-item>
            <el-descriptions-item label="用户名">{{ detail.user.username }}</el-descriptions-item>
            <el-descriptions-item label="昵称">{{ detail.user.nickname }}</el-descriptions-item>
            <el-descriptions-item label="账号状态">
              <el-tag :type="detail.user.status === 1 ? 'success' : 'danger'" effect="light">
                {{ detail.user.status === 1 ? '正常' : '禁用' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="注册来源">
              {{ REGISTER_SOURCE_NAMES[detail.user.registerSource] || detail.user.registerSource || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="注册时间">
              {{ formatDateTime(detail.user.createTime) }}
            </el-descriptions-item>
            <el-descriptions-item label="最后活跃">
              {{ detail.user.lastActiveTime ? formatDateTime(detail.user.lastActiveTime) : '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="最后登录">
              {{ detail.user.lastLoginTime ? formatDateTime(detail.user.lastLoginTime) : '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="登录次数">{{ detail.user.loginCount || 0 }}</el-descriptions-item>
            <el-descriptions-item label="实名认证状态">
              <el-tag
                :type="getRealNameTagType(detail.user.realNameVerified)"
                effect="light"
              >
                {{ REAL_NAME_STATUS_NAMES[detail.user.realNameVerified] || '未知' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item v-if="permission.canViewPrivate" label="手机号">
              {{ detail.user.phone || '-' }}
            </el-descriptions-item>
            <el-descriptions-item v-if="permission.canViewPrivate" label="邮箱">
              {{ detail.user.email || '-' }}
            </el-descriptions-item>
            <el-descriptions-item v-if="permission.canViewPrivate" label="真实姓名">
              {{ detail.user.realName || '-' }}
            </el-descriptions-item>
            <el-descriptions-item v-if="permission.canViewPrivate" label="身份证号">
              {{ detail.user.idCard ? maskIdCard(detail.user.idCard) : '-' }}
            </el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>

        <el-tab-pane label="账号日志" name="logs">
          <el-table :data="detail.derivedData.recentAccountLogs" max-height="300">
            <el-table-column prop="createTime" label="时间" width="170">
              <template #default="{ row }">{{ formatDateTime(row.createTime) }}</template>
            </el-table-column>
            <el-table-column label="操作类型" width="120">
              <template #default="{ row }">
                {{ USER_ACCOUNT_LOG_TYPE_NAMES[row.logType] || row.logType }}
              </template>
            </el-table-column>
            <el-table-column prop="fieldName" label="字段" width="100" />
            <el-table-column prop="oldValue" label="旧值" show-overflow-tooltip />
            <el-table-column prop="newValue" label="新值" show-overflow-tooltip />
            <el-table-column prop="operatorName" label="操作人" width="100" />
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="违规记录" name="violations">
          <el-empty
            v-if="detail.derivedData.recentViolations.length === 0"
            description="暂无违规记录"
            :image-size="100"
          />
          <el-table v-else :data="detail.derivedData.recentViolations" max-height="300">
            <el-table-column prop="createTime" label="时间" width="170">
              <template #default="{ row }">{{ formatDateTime(row.createTime) }}</template>
            </el-table-column>
            <el-table-column prop="violationType" label="违规类型" width="120" />
            <el-table-column label="违规等级" width="100">
              <template #default="{ row }">
                <el-tag :type="row.violationLevel >= 2 ? 'danger' : 'warning'" effect="light" size="small">
                  {{ row.violationLevel >= 2 ? '严重' : '一般' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="违规描述" show-overflow-tooltip />
            <el-table-column prop="handleResult" label="处理结果" show-overflow-tooltip />
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </div>

    <template #footer>
      <el-button @click="dialogVisible = false">关闭</el-button>
      <el-tooltip
        v-if="!permission.canEdit"
        content="无权限编辑，请联系高级运营"
        placement="top"
      >
        <el-button type="primary" disabled>编辑信息</el-button>
      </el-tooltip>
      <el-button
        v-else
        type="primary"
        @click="handleEdit"
      >
        编辑信息
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

import { Warning } from '@element-plus/icons-vue'
import { getUserDetail } from '@api/user-account'
import type { UserAccountDetail, UserAccountPermission } from '@/types/business'
import { REGISTER_SOURCE_NAMES, REAL_NAME_STATUS_NAMES, USER_ACCOUNT_LOG_TYPE_NAMES } from '@/enums/business'
import { formatDateTime } from '@hooks/index'

interface Props {
  modelValue: boolean
  userId: number | null
  permission: UserAccountPermission
}

const props = defineProps<Props>()
const emit = defineEmits(['update:modelValue', 'updated'])

const dialogVisible = ref(false)
const loading = ref(false)
const detail = ref<UserAccountDetail | null>(null)
const activeTab = ref('basic')

watch(() => props.modelValue, (val) => {
  dialogVisible.value = val
  if (val && props.userId) {
    fetchDetail()
  }
})

watch(dialogVisible, (val) => {
  emit('update:modelValue', val)
})

const fetchDetail = async () => {
  if (!props.userId) return
  loading.value = true
  try {
    detail.value = await getUserDetail(props.userId)
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const handleClose = () => {
  detail.value = null
  activeTab.value = 'basic'
}

const handleEdit = () => {
  emit('updated')
}

const getProgressColor = (percentage: number) => {
  if (percentage >= 80) return '#67c23a'
  if (percentage >= 60) return '#e6a23c'
  return '#f56c6c'
}

const getRealNameTagType = (status: number) => {
  switch (status) {
    case 2: return 'success'
    case 1: return 'warning'
    case 3: return 'danger'
    default: return 'info'
  }
}

const maskIdCard = (idCard: string) => {
  if (!idCard || idCard.length < 8) return idCard
  return idCard.substring(0, 6) + '********' + idCard.substring(idCard.length - 4)
}
</script>

<style lang="scss" scoped>
.detail-content {
  .user-header {
    display: flex;
    gap: 24px;
    padding: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 8px;
    margin-bottom: 20px;

    .avatar-wrapper {
      position: relative;

      .abnormal-tag {
        position: absolute;
        top: -6px;
        right: -6px;
        animation: glow 1.5s ease-in-out infinite;
      }

      @keyframes glow {
        0%, 100% {
          box-shadow: 0 0 5px rgba(245, 108, 108, 0.5);
        }
        50% {
          box-shadow: 0 0 15px rgba(245, 108, 108, 0.8);
        }
      }
    }

    .user-basic {
      flex: 1;
      color: #fff;

      .user-name {
        font-size: 24px;
        font-weight: 600;
        margin-bottom: 10px;
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .user-meta {
        display: flex;
        gap: 20px;
        font-size: 13px;
        opacity: 0.9;
        margin-bottom: 12px;
      }

      .user-status {
        .status-item {
          display: flex;
          align-items: center;
          gap: 10px;

          .label {
            font-size: 13px;
            opacity: 0.9;
          }

          :deep(.el-progress__text) {
            color: #fff !important;
          }
        }
      }
    }
  }

  .issues-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 8px;

    .issue-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
    }
  }

  .skeleton-loading {
    padding: 20px 0;
  }
}
</style>
