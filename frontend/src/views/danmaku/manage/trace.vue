<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import QySkeleton from '@/components/QySkeleton/index.vue'
import {
  DANMAKU_STATUS,
  DANMAKU_OPERATE_TYPE,
  DANMAKU_TYPE,
  VIOLATION_LEVEL,
  getEnumLabel,
  getEnumItem,
} from '@/constants/enums'
import { traceDanmakuApi } from '@/api/danmaku-manage'
import type { DanmakuTraceResult, DanmakuTraceDanmaku } from '@/types'
import { formatDate, formatNumber } from '@/utils'
import { Search, CircleCheck, Warning, CircleClose, VideoPlay, User, Clock, Aim } from '@element-plus/icons-vue'

const loading = ref(false)
const traceResult = ref<DanmakuTraceResult | null>(null)
const submitAttempted = ref(false)

const queryParams = reactive({
  danmakuId: '' as number | string,
  contentId: '' as number | string,
  userUid: '',
})

const danmakuIdValid = computed(() => Number(queryParams.danmakuId) > 0)
const contentIdValid = computed(() => Number(queryParams.contentId) > 0)
const userUidValid = computed(() => queryParams.userUid.trim().length > 0)
const canSearch = computed(() => danmakuIdValid.value || contentIdValid.value || userUidValid.value)

const tableMaxHeight = ref(600)

const calcTableMaxHeight = () => {
  tableMaxHeight.value = window.innerHeight - 360
}

const formatPlayTime = (seconds: number | undefined | null): string => {
  if (seconds === undefined || seconds === null) return '-'
  const s = Math.floor(seconds)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const pad = (n: number) => n.toString().padStart(2, '0')
  if (h > 0) return `${h}:${pad(m)}:${pad(sec)}`
  return `${pad(m)}:${pad(sec)}`
}

const handleSearch = async () => {
  submitAttempted.value = true
  if (!canSearch.value) {
    return
  }
  loading.value = true
  traceResult.value = null
  try {
    const params: { danmakuId?: number; contentId?: number; userUid?: string } = {}
    if (danmakuIdValid.value) params.danmakuId = Number(queryParams.danmakuId)
    if (contentIdValid.value) params.contentId = Number(queryParams.contentId)
    if (userUidValid.value) params.userUid = queryParams.userUid.trim()
    const result = await traceDanmakuApi(params)
    traceResult.value = result
  } catch (err: any) {
    ElMessage.error(err?.message || '溯源查询失败')
  } finally {
    loading.value = false
  }
}

const handleReset = () => {
  queryParams.danmakuId = ''
  queryParams.contentId = ''
  queryParams.userUid = ''
  traceResult.value = null
  submitAttempted.value = false
}

const getTimelineType = (operationType: string) => {
  const map: Record<string, string> = {
    APPROVE: 'success',
    TEMP_BLOCK: 'warning',
    PERMA_BAN: 'danger',
    UNBLOCK: 'primary',
    DELETE: 'danger',
    BATCH_APPROVE: 'info',
    BATCH_BLOCK: 'info',
    BATCH_CLEAN: 'info',
    BATCH_ARCHIVE: 'info',
  }
  return map[operationType] || 'info'
}

const getSeverityColor = (severity: string) => {
  const map: Record<string, string> = {
    high: '#F56C6C',
    medium: '#E6A23C',
    low: '#409EFF',
  }
  return map[severity] || '#909399'
}

const getSeverityLabel = (severity: string) => {
  const map: Record<string, string> = {
    high: '高风险',
    medium: '中风险',
    low: '低风险',
  }
  return map[severity] || severity
}

const truncateContent = (content: string, maxLen = 50) => {
  if (!content) return '-'
  return content.length > maxLen ? content.slice(0, maxLen) + '...' : content
}

const getInputClass = (valid: boolean) => {
  if (!submitAttempted.value) return ''
  return valid ? '' : 'input-shake'
}

onMounted(() => {
  calcTableMaxHeight()
  window.addEventListener('resize', calcTableMaxHeight)
})

onUnmounted(() => {
  window.removeEventListener('resize', calcTableMaxHeight)
})
</script>

<template>
  <div class="danmaku-trace-page">
    <div class="filter-bar">
      <el-form :inline="true" :model="queryParams" @submit.prevent>
        <el-row :gutter="8" style="width: 100%;">
          <el-col :span="6">
            <el-form-item label="弹幕ID" style="width: 100%; justify-content: flex-end;">
              <div style="display: flex; align-items: center; gap: 4px;">
                <el-input
                  v-model="queryParams.danmakuId"
                  type="number"
                  :min="1"
                  placeholder="输入弹幕ID"
                  clearable
                  style="width: 160px;"
                  :class="getInputClass(danmakuIdValid)"
                  :prefix-icon="Aim"
                  @keyup.enter="handleSearch"
                />
                <el-icon v-if="danmakuIdValid" color="#67C23A" :size="18"><CircleCheck /></el-icon>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="视频ID" style="width: 100%; justify-content: flex-end;">
              <div style="display: flex; align-items: center; gap: 4px;">
                <el-input
                  v-model="queryParams.contentId"
                  type="number"
                  :min="1"
                  placeholder="输入视频ID"
                  clearable
                  style="width: 160px;"
                  :class="getInputClass(contentIdValid)"
                  @keyup.enter="handleSearch"
                />
                <el-icon v-if="contentIdValid" color="#67C23A" :size="18"><CircleCheck /></el-icon>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="用户UID" style="width: 100%; justify-content: flex-end;">
              <div style="display: flex; align-items: center; gap: 4px;">
                <el-input
                  v-model="queryParams.userUid"
                  placeholder="输入用户UID"
                  clearable
                  style="width: 160px;"
                  :class="getInputClass(userUidValid)"
                  @keyup.enter="handleSearch"
                />
                <el-icon v-if="userUidValid" color="#67C23A" :size="18"><CircleCheck /></el-icon>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="6" style="display: flex; align-items: center;">
            <el-form-item style="margin: 0;">
              <el-button type="primary" :icon="Search" @click="handleSearch">溯源查询</el-button>
              <el-button @click="handleReset">重置</el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <div v-if="loading" class="card-content">
      <QySkeleton :rows="6" />
    </div>

    <div v-else-if="traceResult" class="trace-result-sections">
      <div v-if="traceResult.duplicateOperations?.length" class="result-section">
        <div class="section-header">
          <h4><el-icon style="margin-right: 4px;"><Warning /></el-icon>重复操作拦截</h4>
          <el-tag type="warning" size="small">{{ formatNumber(traceResult.duplicateOperations.length) }} 条</el-tag>
        </div>
        <el-alert type="warning" :closable="false" show-icon>
          <template #title>
            检测到 {{ formatNumber(traceResult.duplicateOperations.length) }} 条重复操作，系统已自动拦截
          </template>
        </el-alert>
        <el-table
          :data="traceResult.duplicateOperations"
          border
          stripe
          size="small"
          :max-height="240"
          style="margin-top: 10px;"
          :header-cell-style="{ background: '#FAFBFC', fontWeight: 600 }"
        >
          <el-table-column type="index" label="序号" width="55" align="center" />
          <el-table-column prop="id" label="弹幕ID" width="90" align="center">
            <template #default="{ row }">
              <span class="danmaku-id-cell">#{{ row.id }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="operationType" label="操作类型" width="140" align="center">
            <template #default="{ row }">
              <el-tag :type="getEnumItem(DANMAKU_OPERATE_TYPE, row.operationType)?.type || 'info'" size="small">
                {{ getEnumLabel(DANMAKU_OPERATE_TYPE, row.operationType) || row.operationType }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="operatorName" label="操作人" width="120" align="center" />
          <el-table-column prop="createdAt" label="操作时间" width="180" align="center">
            <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
          </el-table-column>
        </el-table>
      </div>

      <div v-if="traceResult.abnormalOperations?.length" class="result-section">
        <div class="section-header">
          <h4><el-icon style="margin-right: 4px;"><CircleClose /></el-icon>操作合理性异常</h4>
          <el-tag type="danger" size="small">{{ formatNumber(traceResult.abnormalOperations.length) }} 条</el-tag>
        </div>
        <div class="abnormal-list">
          <el-alert
            v-for="(item, idx) in traceResult.abnormalOperations"
            :key="idx"
            :type="item.severity === 'high' ? 'error' : 'warning'"
            :closable="false"
            show-icon
            style="margin-bottom: 8px;"
          >
            <template #title>
              <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                <span>弹幕ID: #{{ item.danmakuId }}</span>
                <el-tag :type="getEnumItem(DANMAKU_OPERATE_TYPE, item.operationType)?.type || 'info'" size="small">
                  {{ getEnumLabel(DANMAKU_OPERATE_TYPE, item.operationType) || item.operationType }}
                </el-tag>
                <el-tag :color="getSeverityColor(item.severity)" size="small" style="color: #fff; border: none;">
                  {{ getSeverityLabel(item.severity) }}
                </el-tag>
              </div>
            </template>
            <template #default>
              <el-tooltip :content="item.reason" placement="top">
                <span style="font-size: 12px; color: #606266;">原因：{{ truncateContent(item.reason, 80) }}</span>
              </el-tooltip>
            </template>
          </el-alert>
        </div>
      </div>

      <div v-if="traceResult.misjudgedDanmakus?.length" class="result-section">
        <div class="section-header">
          <h4><el-icon style="margin-right: 4px;"><CircleClose /></el-icon>违规判定准确性检查</h4>
          <el-tag type="danger" size="small">{{ formatNumber(traceResult.misjudgedDanmakus.length) }} 条误判</el-tag>
        </div>
        <el-table
          :data="traceResult.misjudgedDanmakus"
          border
          stripe
          size="small"
          :max-height="300"
          :header-cell-style="{ background: '#FAFBFC', fontWeight: 600 }"
        >
          <el-table-column type="index" label="序号" width="55" align="center" />
          <el-table-column prop="danmakuId" label="弹幕ID" width="90" align="center">
            <template #default="{ row }">
              <span class="danmaku-id-cell">#{{ row.danmakuId }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="danmakuContent" label="弹幕内容" min-width="180" show-overflow-tooltip>
            <template #default="{ row }">{{ truncateContent(row.danmakuContent) }}</template>
          </el-table-column>
          <el-table-column prop="violationLevel" label="违规等级" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="getEnumItem(VIOLATION_LEVEL, row.violationLevel)?.type || 'info'" size="small">
                {{ getEnumLabel(VIOLATION_LEVEL, row.violationLevel) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="expectedAction" label="应执行操作" width="120" align="center">
            <template #default="{ row }">
              <el-tag type="success" size="small" effect="plain">{{ row.expectedAction }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="actualAction" label="实际操作" width="120" align="center">
            <template #default="{ row }">
              <el-tag type="danger" size="small" effect="plain">{{ row.actualAction }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="reason" label="误判原因" min-width="160" show-overflow-tooltip />
        </el-table>
      </div>

      <div v-if="traceResult.danmakus?.length" class="result-section">
        <div class="section-header">
          <h4>弹幕操作溯源时间线</h4>
          <el-tag type="info" size="small">{{ formatNumber(traceResult.danmakus.length) }} 条弹幕</el-tag>
        </div>

        <div v-for="danmaku in traceResult.danmakus" :key="danmaku.id" class="danmaku-trace-card">
          <div class="danmaku-basic-info">
            <div class="info-row">
              <span class="danmaku-id-cell">#{{ danmaku.id }}</span>
              <el-tag
                :type="getEnumItem(DANMAKU_STATUS, danmaku.danmakuStatus)?.type || 'info'"
                size="small"
                style="margin-left: 8px;"
              >
                {{ getEnumLabel(DANMAKU_STATUS, danmaku.danmakuStatus) }}
              </el-tag>
              <el-tag
                v-if="danmaku.isHighRisk"
                type="danger"
                size="small"
                style="margin-left: 4px;"
              >
                高危
              </el-tag>
              <el-tag
                :type="getEnumItem(VIOLATION_LEVEL, danmaku.violationLevel)?.type || 'info'"
                size="small"
                style="margin-left: 4px;"
              >
                {{ getEnumLabel(VIOLATION_LEVEL, danmaku.violationLevel) }}
              </el-tag>
              <el-tag
                v-if="danmaku.isArchived"
                type="info"
                size="small"
                style="margin-left: 4px;"
              >
                已归档
              </el-tag>
            </div>
            <div class="info-row" style="margin-top: 6px;">
              <el-icon style="color: #909399; margin-right: 2px;"><VideoPlay /></el-icon>
              <span class="info-label">视频:</span>
              <span style="color: #409EFF;">{{ danmaku.contentId }}</span>
              <span v-if="danmaku.content" style="margin-left: 8px; color: #606266;">
                {{ danmaku.content.contentTitle }}
              </span>
              <span style="margin-left: 12px;" class="info-label">
                <el-icon style="vertical-align: -2px; margin-right: 2px;"><Clock /></el-icon>
                播放时间:
              </span>
              <span style="color: #606266;">{{ formatPlayTime(danmaku.playTime) }}</span>
            </div>
            <div class="info-row" style="margin-top: 6px;">
              <el-icon style="color: #909399; margin-right: 2px;"><User /></el-icon>
              <span class="info-label">用户:</span>
              <span style="color: #606266;">{{ danmaku.user?.username || '-' }}</span>
              <span v-if="danmaku.user?.uid" style="margin-left: 8px; color: #909399;">
                ({{ danmaku.user.uid }})
              </span>
              <span style="margin-left: 12px;" class="info-label">发布时间:</span>
              <span style="color: #909399;">{{ formatDate(danmaku.createdAt) }}</span>
            </div>
            <div class="info-row" style="margin-top: 6px;">
              <span class="info-label">弹幕内容:</span>
              <el-tooltip :content="danmaku.danmakuContent" placement="top">
                <span :style="{ color: (danmaku as any).danmakuColor || '#303133' }">
                  {{ truncateContent(danmaku.danmakuContent, 100) }}
                </span>
              </el-tooltip>
            </div>
          </div>

          <div v-if="danmaku.manageLogs?.length" class="danmaku-timeline">
            <el-timeline>
              <el-timeline-item
                v-for="(log, idx) in danmaku.manageLogs"
                :key="idx"
                :timestamp="formatDate(log.createdAt)"
                :type="getTimelineType(log.operationType)"
                placement="top"
              >
                <div class="timeline-action">
                  <el-tag
                    :type="getEnumItem(DANMAKU_OPERATE_TYPE, log.operationType)?.type || 'info'"
                    size="small"
                    style="margin-right: 6px;"
                  >
                    {{ getEnumLabel(DANMAKU_OPERATE_TYPE, log.operationType) || log.operationType }}
                  </el-tag>
                  <span class="operator-name">{{ log.operatorName || '系统' }}</span>
                </div>
                <div v-if="log.operationDesc" class="timeline-detail">{{ log.operationDesc }}</div>
                <div v-if="log.remark" class="timeline-remark">备注：{{ log.remark }}</div>
              </el-timeline-item>
            </el-timeline>
          </div>
          <el-empty v-else description="暂无操作记录" :image-size="60" />
        </div>
      </div>

      <div
        v-if="
          !traceResult.duplicateOperations?.length &&
          !traceResult.abnormalOperations?.length &&
          !traceResult.misjudgedDanmakus?.length &&
          !traceResult.danmakus?.length
        "
        class="card-content"
      >
        <el-empty description="未查询到相关溯源信息" />
      </div>
    </div>

    <div v-else class="card-content">
      <el-empty description="请输入查询条件进行弹幕操作溯源" />
    </div>

    <el-backtop :right="40" :bottom="40" />
  </div>
</template>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.danmaku-trace-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
}

.trace-result-sections {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.result-section {
  background: $bg-white;
  border-radius: $radius-base;
  padding: 16px;
  border: 1px solid $border-lighter;

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid $border-lighter;

    h4 {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: $text-primary;
      display: flex;
      align-items: center;
    }
  }
}

.danmaku-id-cell {
  font-family: Menlo, Consolas, monospace;
  font-weight: 500;
  color: $primary-color;
  background: rgba(64, 158, 255, 0.06);
  padding: 1px 6px;
  border-radius: 3px;
}

.danmaku-trace-card {
  background: $bg-white;
  border-radius: $radius-base;
  padding: 16px;
  border: 1px solid $border-lighter;
  margin-bottom: 12px;

  &:last-child {
    margin-bottom: 0;
  }

  .danmaku-basic-info {
    margin-bottom: 12px;
    padding-bottom: 10px;
    border-bottom: 1px dashed $border-lighter;

    .info-row {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 2px;
      font-size: $font-sm;
      line-height: 1.6;
    }

    .info-label {
      color: $text-secondary;
      font-size: $font-xs;
      margin-right: 4px;
    }
  }
}

.danmaku-timeline {
  padding: 4px 0 0 4px;

  .timeline-action {
    display: flex;
    align-items: center;
    font-weight: 600;
    font-size: 13px;
    margin-bottom: 2px;

    .operator-name {
      color: $text-regular;
      font-weight: 400;
    }
  }

  .timeline-detail {
    font-size: 12px;
    color: $text-secondary;
    line-height: 1.5;
    margin-top: 2px;
  }

  .timeline-remark {
    font-size: 12px;
    color: $text-placeholder;
    font-style: italic;
    margin-top: 2px;
  }
}

.abnormal-list {
  display: flex;
  flex-direction: column;
}

.input-shake {
  animation: shake 0.4s ease-in-out;

  :deep(.el-input__wrapper) {
    box-shadow: 0 0 0 1px #F56C6C inset;
  }
}

@keyframes shake {
  0%, 100% {
    transform: translateX(0);
  }
  20% {
    transform: translateX(-4px);
  }
  40% {
    transform: translateX(4px);
  }
  60% {
    transform: translateX(-4px);
  }
  80% {
    transform: translateX(4px);
  }
}
</style>
