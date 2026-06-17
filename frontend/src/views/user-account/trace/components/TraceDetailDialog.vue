<template>
  <el-dialog
    v-model="dialogVisible"
    title="账号溯源详情"
    width="800px"
    destroy-on-close
    @close="handleClose"
  >
    <div v-if="loading" class="skeleton-loading">
      <el-skeleton :rows="10" animated />
    </div>
    <div v-else-if="traceData" class="trace-content">
      <div class="user-header">
        <div class="avatar-wrapper">
          <el-avatar :size="64" :src="traceData.user.avatar">
            {{ traceData.user.nickname?.charAt(0) }}
          </el-avatar>
          <el-tag
            v-if="traceData.user.isAbnormal === 1"
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
            {{ traceData.user.nickname }}
            <span class="user-uid">UID: {{ traceData.user.id }}</span>
          </div>
          <div class="user-meta">
            <span>注册时间: {{ formatDateTime(traceData.user.createTime) }}</span>
            <span>注册来源: {{ REGISTER_SOURCE_NAMES[traceData.user.registerSource] || traceData.user.registerSource }}</span>
          </div>
        </div>
      </div>

      <div v-if="traceData.anomalies.length > 0" class="anomaly-section">
        <h4 class="section-title">
          <el-icon :size="18" color="#f56c6c"><Warning /></el-icon>
          检测到 {{ traceData.anomalies.length }} 项异常
        </h4>
        <div class="anomaly-list">
          <div
            v-for="(anomaly, index) in traceData.anomalies"
            :key="index"
            class="anomaly-item"
            :class="`severity-${anomaly.severity}`"
          >
            <div class="anomaly-header">
              <el-tag
                :type="anomaly.severity === 3 ? 'danger' : anomaly.severity === 2 ? 'warning' : 'info'"
                effect="dark"
                size="small"
              >
                {{ anomaly.severity === 3 ? '高危' : anomaly.severity === 2 ? '中危' : '低危' }}
              </el-tag>
              <span class="anomaly-title">{{ anomaly.title }}</span>
              <span class="anomaly-type">{{ USER_ABNORMAL_TYPE_NAMES[anomaly.type] || anomaly.type }}</span>
            </div>
            <div class="anomaly-detail">{{ anomaly.detail }}</div>
            <div v-if="anomaly.relatedUsers?.length" class="related-users">
              <span class="label">关联账号：</span>
              <el-tag
                v-for="user in anomaly.relatedUsers"
                :key="user.id"
                size="small"
                type="danger"
                effect="plain"
              >
                {{ user.username }} (UID: {{ user.id }})
              </el-tag>
            </div>
            <div v-if="anomaly.missingFields?.length" class="missing-fields">
              <span class="label">缺失字段：</span>
              <el-tag
                v-for="field in anomaly.missingFields"
                :key="field"
                size="small"
                type="info"
                effect="plain"
              >
                {{ field }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>

      <div class="integrity-section">
        <h4 class="section-title">
          <el-icon :size="18" color="#409eff"><DataAnalysis /></el-icon>
          完整性校验
        </h4>
        <el-descriptions :column="3" border size="small">
          <el-descriptions-item
            v-for="check in traceData.integrityCheck.checks"
            :key="check.name"
            :label="check.name"
          >
            <template #default>
              <el-icon v-if="check.passed" color="#67c23a"><CircleCheckFilled /></el-icon>
              <el-icon v-else color="#f56c6c"><CircleCloseFilled /></el-icon>
              <span :class="{ 'text-danger': !check.passed }">
                {{ check.passed ? '通过' : check.message }}
              </span>
            </template>
          </el-descriptions-item>
        </el-descriptions>
        <div class="completeness-bar">
          <span class="label">信息完整度</span>
          <el-progress
            :percentage="traceData.integrityCheck.completeness"
            :stroke-width="12"
            :color="traceData.integrityCheck.completeness >= 80 ? '#67c23a' : traceData.integrityCheck.completeness >= 60 ? '#e6a23c' : '#f56c6c'"
            style="flex: 1; margin: 0 16px"
          />
          <span class="value">{{ traceData.integrityCheck.completeness }}%</span>
        </div>
      </div>

      <div class="timeline-section">
        <h4 class="section-title">
          <el-icon :size="18" color="#909399"><Clock /></el-icon>
          账号全轨迹溯源
        </h4>
        <el-timeline>
          <el-timeline-item
            v-for="(trace, index) in traceData.traces"
            :key="index"
            :timestamp="formatDateTime(trace.time)"
            :type="getTimelineType(trace.type)"
            :icon="getTimelineIcon(trace.type)"
          >
            <div class="trace-item">
              <div class="trace-title">{{ trace.title }}</div>
              <div class="trace-type">{{ trace.type }}</div>
              <div class="trace-data" v-if="Object.keys(trace.data).length > 0">
                <el-descriptions :column="2" border size="mini">
                  <el-descriptions-item
                    v-for="(value, key) in trace.data"
                    :key="key"
                    :label="key"
                  >
                    {{ typeof value === 'object' ? JSON.stringify(value) : value || '-' }}
                  </el-descriptions-item>
                </el-descriptions>
              </div>
            </div>
          </el-timeline-item>
        </el-timeline>
      </div>
    </div>

    <template #footer>
      <el-button @click="dialogVisible = false">关闭</el-button>
      <el-tooltip
        v-if="!traceData?.permission.canEdit"
        content="无权限处理，请联系高级运营"
        placement="top"
      >
        <el-button type="primary" disabled>标记已处理</el-button>
      </el-tooltip>
      <el-button
        v-else
        type="primary"
        @click="handleMarkHandled"
      >
        标记已处理
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Warning,
  DataAnalysis,
  Clock,
  CircleCheckFilled,
  CircleCloseFilled,
  User,
  Edit,
  WarningFilled
} from '@element-plus/icons-vue'
import { traceUserAccount, handleAbnormalLog } from '@api/user-account'
import type { UserTraceResult } from '@/types/business'
import { REGISTER_SOURCE_NAMES, USER_ABNORMAL_TYPE_NAMES } from '@/enums/business'
import { formatDateTime } from '@hooks/index'

interface Props {
  modelValue: boolean
  logId: number | null
}

const props = defineProps<Props>()
const emit = defineEmits(['update:modelValue', 'handled'])

const dialogVisible = ref(false)
const loading = ref(false)
const traceData = ref<UserTraceResult | null>(null)

watch(() => props.modelValue, (val) => {
  dialogVisible.value = val
  if (val && props.logId) {
    fetchTraceData()
  }
})

watch(dialogVisible, (val) => {
  emit('update:modelValue', val)
})

const fetchTraceData = async () => {
  if (!props.logId) return
  loading.value = true
  try {
    traceData.value = await traceUserAccount(props.logId)
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const getTimelineType = (type: string) => {
  if (type.includes('violation') || type.includes('abnormal')) return 'danger'
  if (type.includes('update') || type.includes('change')) return 'warning'
  if (type.includes('create') || type.includes('login')) return 'primary'
  return 'info'
}

const getTimelineIcon = (type: string) => {
  if (type.includes('violation')) return WarningFilled
  if (type.includes('update') || type.includes('change')) return Edit
  if (type.includes('create') || type.includes('login')) return User
  return DataAnalysis
}

const handleMarkHandled = async () => {
  if (!props.logId) return
  try {
    await handleAbnormalLog(props.logId, { handleResult: '已核实并处理' })
    ElMessage.success('标记成功')
    emit('handled')
    dialogVisible.value = false
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  }
}

const handleClose = () => {
  traceData.value = null
}
</script>

<style lang="scss" scoped>
.trace-content {
  .user-header {
    display: flex;
    gap: 20px;
    padding: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 8px;
    margin-bottom: 20px;
    color: #fff;

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

      .user-name {
        font-size: 20px;
        font-weight: 600;
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        gap: 10px;

        .user-uid {
          font-size: 13px;
          opacity: 0.8;
          font-weight: normal;
        }
      }

      .user-meta {
        display: flex;
        gap: 20px;
        font-size: 13px;
        opacity: 0.9;
      }
    }
  }

  .section-title {
    font-size: 16px;
    font-weight: 600;
    color: $text-primary;
    margin: 24px 0 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .anomaly-list {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .anomaly-item {
      padding: 16px;
      border-radius: 8px;
      border-left: 4px solid;

      &.severity-3 {
        background: rgba(245, 108, 108, 0.08);
        border-color: #f56c6c;
      }

      &.severity-2 {
        background: rgba(230, 162, 60, 0.08);
        border-color: #e6a23c;
      }

      &.severity-1 {
        background: rgba(64, 158, 255, 0.08);
        border-color: #409eff;
      }

      .anomaly-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 8px;

        .anomaly-title {
          font-weight: 600;
          color: $text-primary;
        }

        .anomaly-type {
          font-size: 12px;
          color: $text-secondary;
          margin-left: auto;
        }
      }

      .anomaly-detail {
        font-size: 13px;
        color: $text-secondary;
        margin-bottom: 8px;
      }

      .related-users,
      .missing-fields {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;
        margin-top: 8px;

        .label {
          font-size: 12px;
          color: $text-placeholder;
        }
      }
    }
  }

  .completeness-bar {
    display: flex;
    align-items: center;
    margin-top: 16px;
    padding: 12px 16px;
    background: #f5f7fa;
    border-radius: 8px;

    .label {
      font-size: 13px;
      color: $text-secondary;
      white-space: nowrap;
    }

    .value {
      font-size: 18px;
      font-weight: 600;
      color: $text-primary;
    }
  }

  .text-danger {
    color: #f56c6c;
  }

  .skeleton-loading {
    padding: 20px 0;
  }

  .trace-item {
    .trace-title {
      font-weight: 600;
      color: $text-primary;
      margin-bottom: 4px;
    }

    .trace-type {
      font-size: 12px;
      color: $text-placeholder;
      margin-bottom: 8px;
    }

    .trace-data {
      margin-top: 8px;
    }
  }
}
</style>
