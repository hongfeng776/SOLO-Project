<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import QySkeleton from '@/components/QySkeleton/index.vue'
import { COMMENT_STATUS, VIOLATION_LEVEL, COMMENT_OPERATE_TYPE, getEnumLabel, getEnumItem } from '@/constants/enums'
import { traceCommentApi } from '@/api/comment-manage'
import type { CommentTraceResult, CommentTraceComment } from '@/types'
import { formatDate } from '@/utils'
import { Search, CircleCheck, Warning, CircleClose, Top, Star, Hide, Delete, Aim } from '@element-plus/icons-vue'

const loading = ref(false)
const traceResult = ref<CommentTraceResult | null>(null)

const queryParams = reactive({
  commentId: '' as number | string,
  contentId: '' as number | string,
  userUid: '',
})

const commentIdValid = computed(() => Number(queryParams.commentId) > 0)
const contentIdValid = computed(() => Number(queryParams.contentId) > 0)
const userUidValid = computed(() => queryParams.userUid.trim().length > 0)
const canSearch = computed(() => commentIdValid.value || contentIdValid.value || userUidValid.value)

const tableMaxHeight = ref(600)

const calcTableMaxHeight = () => {
  tableMaxHeight.value = window.innerHeight - 360
}

const handleSearch = async () => {
  if (!canSearch.value) {
    ElMessage.warning('请至少填写一个查询条件')
    return
  }
  loading.value = true
  traceResult.value = null
  try {
    const params: { commentId?: number; contentId?: number; userUid?: string } = {}
    if (commentIdValid.value) params.commentId = Number(queryParams.commentId)
    if (contentIdValid.value) params.contentId = Number(queryParams.contentId)
    if (userUidValid.value) params.userUid = queryParams.userUid.trim()
    const result = await traceCommentApi(params)
    traceResult.value = result
  } catch (err: any) {
    ElMessage.error(err?.message || '溯源查询失败')
  } finally {
    loading.value = false
  }
}

const handleReset = () => {
  queryParams.commentId = ''
  queryParams.contentId = ''
  queryParams.userUid = ''
  traceResult.value = null
}

const getTimelineType = (operationType: string) => {
  const map: Record<string, string> = {
    PIN: 'primary',
    CANCEL_PIN: 'primary',
    ESSENCE: 'warning',
    CANCEL_ESSENCE: 'warning',
    BLOCK: 'danger',
    DELETE: 'danger',
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

const getSeverityType = (severity: string) => {
  const map: Record<string, string> = {
    high: 'danger',
    medium: 'warning',
    low: '',
  }
  return map[severity] || 'info'
}

const truncateContent = (content: string, maxLen = 50) => {
  if (!content) return '-'
  return content.length > maxLen ? content.slice(0, maxLen) + '...' : content
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
  <div class="comment-trace-page">
    <div class="filter-bar">
      <el-form :inline="true" :model="queryParams" @submit.prevent>
        <el-row :gutter="8" style="width: 100%;">
          <el-col :span="6">
            <el-form-item label="评论ID" style="width: 100%; justify-content: flex-end;">
              <div style="display: flex; align-items: center; gap: 4px;">
                <el-input
                  v-model="queryParams.commentId"
                  type="number"
                  :min="1"
                  placeholder="输入评论ID"
                  clearable
                  style="width: 160px;"
                  :prefix-icon="Aim"
                  @keyup.enter="handleSearch"
                />
                <el-icon v-if="commentIdValid" color="#67C23A" :size="18"><CircleCheck /></el-icon>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="内容ID" style="width: 100%; justify-content: flex-end;">
              <div style="display: flex; align-items: center; gap: 4px;">
                <el-input
                  v-model="queryParams.contentId"
                  type="number"
                  :min="1"
                  placeholder="输入内容ID"
                  clearable
                  style="width: 160px;"
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
          <el-tag type="warning" size="small">{{ traceResult.duplicateOperations.length }} 条</el-tag>
        </div>
        <el-alert type="warning" :closable="false" show-icon>
          <template #title>
            检测到 {{ traceResult.duplicateOperations.length }} 条重复操作，系统已自动拦截
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
          <el-table-column prop="operationType" label="操作类型" width="140" align="center">
            <template #default="{ row }">
              <el-tag :type="getEnumItem(COMMENT_OPERATE_TYPE, row.operationType)?.type || 'info'" size="small">
                {{ getEnumLabel(COMMENT_OPERATE_TYPE, row.operationType) || row.operationType }}
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
          <el-tag type="danger" size="small">{{ traceResult.abnormalOperations.length }} 条</el-tag>
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
              <div style="display: flex; align-items: center; gap: 8px;">
                <span>评论ID: #{{ item.commentId }}</span>
                <el-tag :type="getEnumItem(COMMENT_OPERATE_TYPE, item.operationType)?.type || 'info'" size="small">
                  {{ getEnumLabel(COMMENT_OPERATE_TYPE, item.operationType) || item.operationType }}
                </el-tag>
                <el-tag :color="getSeverityColor(item.severity)" size="small" style="color: #fff; border: none;">
                  {{ item.severity === 'high' ? '高风险' : item.severity === 'medium' ? '中风险' : '低风险' }}
                </el-tag>
              </div>
            </template>
            <template #default>
              <span style="font-size: 12px; color: #606266;">原因：{{ item.reason }}</span>
            </template>
          </el-alert>
        </div>
      </div>

      <div v-if="traceResult.misjudgedComments?.length" class="result-section">
        <div class="section-header">
          <h4><el-icon style="margin-right: 4px;"><CircleClose /></el-icon>违规判定准确性检查</h4>
          <el-tag type="danger" size="small">{{ traceResult.misjudgedComments.length }} 条误判</el-tag>
        </div>
        <el-table
          :data="traceResult.misjudgedComments"
          border
          stripe
          size="small"
          :max-height="300"
          :header-cell-style="{ background: '#FAFBFC', fontWeight: 600 }"
        >
          <el-table-column type="index" label="序号" width="55" align="center" />
          <el-table-column prop="commentId" label="评论ID" width="90" align="center">
            <template #default="{ row }">
              <span class="comment-id-cell">#{{ row.commentId }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="commentContent" label="评论内容" min-width="180" show-overflow-tooltip>
            <template #default="{ row }">{{ truncateContent(row.commentContent) }}</template>
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

      <div v-if="traceResult.comments?.length" class="result-section">
        <div class="section-header">
          <h4>评论操作溯源时间线</h4>
          <el-tag type="info" size="small">{{ traceResult.comments.length }} 条评论</el-tag>
        </div>

        <div v-for="comment in traceResult.comments" :key="comment.id" class="comment-trace-card">
          <div class="comment-basic-info">
            <div class="info-row">
              <span class="comment-id-cell">#{{ comment.id }}</span>
              <el-tag
                :type="getEnumItem(COMMENT_STATUS, comment.commentStatus)?.type || 'info'"
                size="small"
                style="margin-left: 8px;"
              >
                {{ getEnumLabel(COMMENT_STATUS, comment.commentStatus) }}
              </el-tag>
              <el-tag
                v-if="comment.isTop"
                type="primary"
                size="small"
                style="margin-left: 4px;"
              >
                置顶
              </el-tag>
              <el-tag
                v-if="comment.isEssence"
                type="warning"
                size="small"
                style="margin-left: 4px;"
              >
                精华
              </el-tag>
              <el-tag
                v-if="comment.isHot"
                type="danger"
                size="small"
                style="margin-left: 4px;"
              >
                热门
              </el-tag>
              <el-tag
                :type="getEnumItem(VIOLATION_LEVEL, comment.violationLevel)?.type || 'info'"
                size="small"
                style="margin-left: 4px;"
              >
                {{ getEnumLabel(VIOLATION_LEVEL, comment.violationLevel) }}
              </el-tag>
            </div>
            <div class="info-row" style="margin-top: 6px;">
              <span class="info-label">内容ID:</span>
              <span style="color: #409EFF;">{{ comment.contentId }}</span>
              <span v-if="comment.contentInfo" style="margin-left: 8px; color: #606266;">
                {{ comment.contentInfo.title }}
              </span>
              <span style="margin-left: 12px;" class="info-label">用户:</span>
              <span style="color: #606266;">{{ comment.userInfo?.username || '-' }}</span>
              <span style="margin-left: 12px;" class="info-label">发布时间:</span>
              <span style="color: #909399;">{{ formatDate(comment.createdAt) }}</span>
            </div>
            <div class="info-row" style="margin-top: 6px;">
              <span class="info-label">评论内容:</span>
              <span style="color: #303133;">{{ truncateContent(comment.commentContent, 100) }}</span>
            </div>
          </div>

          <div v-if="comment.manageLogs?.length" class="comment-timeline">
            <el-timeline>
              <el-timeline-item
                v-for="(log, idx) in comment.manageLogs"
                :key="idx"
                :timestamp="formatDate(log.createdAt)"
                :type="getTimelineType(log.operationType)"
                placement="top"
              >
                <div class="timeline-action">
                  <el-tag
                    :type="getEnumItem(COMMENT_OPERATE_TYPE, log.operationType)?.type || 'info'"
                    size="small"
                    style="margin-right: 6px;"
                  >
                    {{ getEnumLabel(COMMENT_OPERATE_TYPE, log.operationType) || log.operationType }}
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

      <div v-if="!traceResult.duplicateOperations?.length && !traceResult.abnormalOperations?.length && !traceResult.misjudgedComments?.length && !traceResult.comments?.length" class="card-content">
        <el-empty description="未查询到相关溯源信息" />
      </div>
    </div>

    <div v-else class="card-content">
      <el-empty description="请输入查询条件进行评论操作溯源" />
    </div>

    <el-backtop :right="40" :bottom="40" />
  </div>
</template>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.comment-trace-page {
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

.comment-id-cell {
  font-family: Menlo, Consolas, monospace;
  font-weight: 500;
  color: $primary-color;
  background: rgba(64, 158, 255, 0.06);
  padding: 1px 6px;
  border-radius: 3px;
}

.comment-trace-card {
  background: $bg-white;
  border-radius: $radius-base;
  padding: 16px;
  border: 1px solid $border-lighter;
  margin-bottom: 12px;

  &:last-child {
    margin-bottom: 0;
  }

  .comment-basic-info {
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

.comment-timeline {
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
</style>
