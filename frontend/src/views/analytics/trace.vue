<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import QySkeleton from '@/components/QySkeleton/index.vue'
import {
  TRACE_TYPE,
  INTERACTION_TAG,
  getEnumLabel,
  getEnumItem,
  DATE_FORMAT_STRING,
} from '@/constants/enums'
import {
  traceInteractionStatsApi,
  checkDuplicateStatApi,
  validateInteractionConsistencyApi,
} from '@/api/interaction-analytics'
import type {
  InteractionTraceResult,
  InteractionTraceFinding,
  InteractionStatItem,
  DuplicateStatCheckResult,
  ConsistencyValidateResult,
} from '@/types'
import { formatDate, formatNumber, formatPlayCount } from '@/utils'
import {
  Search,
  CircleCheck,
  Warning,
  CircleClose,
  Aim,
  RefreshLeft,
  DataAnalysis,
  Document,
  Bell,
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const traceResult = ref<InteractionTraceResult | null>(null)
const dateRange = ref<[string, string] | null>(null)

const queryParams = reactive({
  statBatch: '' as string,
  contentId: null as number | null,
  startDate: '' as string,
  endDate: '' as string,
  statDate: '' as string,
})

const duplicateCheckResult = ref<DuplicateStatCheckResult | null>(null)
const consistencyCheckResult = ref<ConsistencyValidateResult | null>(null)
const checkingDuplicate = ref(false)
const checkingConsistency = ref(false)

const findings = computed(() => traceResult.value?.findings || [])
const stats = computed(() => traceResult.value?.stats || [])

const traceTypeCards = computed(() => [
  {
    type: 'DUPLICATE_STAT',
    label: getEnumLabel(TRACE_TYPE, 'DUPLICATE_STAT'),
    count: traceResult.value?.duplicateStatCount || 0,
    color: '#909399',
    gradient: 'linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%)',
  },
  {
    type: 'ABNORMAL_FLUCTUATION',
    label: getEnumLabel(TRACE_TYPE, 'ABNORMAL_FLUCTUATION'),
    count: traceResult.value?.abnormalFluctuationCount || 0,
    color: '#E6A23C',
    gradient: 'linear-gradient(135deg, #fdf6ec 0%, #faecd8 100%)',
  },
  {
    type: 'INCONSISTENT_DATA',
    label: getEnumLabel(TRACE_TYPE, 'INCONSISTENT_DATA'),
    count: traceResult.value?.inconsistentDataCount || 0,
    color: '#F56C6C',
    gradient: 'linear-gradient(135deg, #fef0f0 0%, #fde2e2 100%)',
  },
  {
    type: 'FAKE_INTERACTION',
    label: getEnumLabel(TRACE_TYPE, 'FAKE_INTERACTION'),
    count: traceResult.value?.fakeInteractionCount || 0,
    color: '#C0392B',
    gradient: 'linear-gradient(135deg, #fde8e8 0%, #f5c6c6 100%)',
  },
])

const hasQueryInput = computed(() => {
  return (
    queryParams.statBatch.trim() !== '' ||
    queryParams.contentId !== null ||
    (dateRange.value && dateRange.value.length === 2 && dateRange.value[0] && dateRange.value[1])
  )
})

const canCheckDuplicate = computed(() => {
  return (
    queryParams.statBatch.trim() !== '' &&
    queryParams.contentId !== null &&
    queryParams.statDate !== ''
  )
})

const canCheckConsistency = computed(() => {
  return queryParams.contentId !== null && queryParams.statDate !== ''
})

const severityTagType = (severity: number) => {
  if (severity === 1) return 'info'
  if (severity === 2) return 'warning'
  return 'danger'
}

const severityColor = (severity: number) => {
  if (severity === 1) return '#909399'
  if (severity === 2) return '#E6A23C'
  return '#F56C6C'
}

const handleSearch = async () => {
  if (!hasQueryInput.value) {
    ElMessage.warning('请至少输入一个查询条件：统计批次、内容ID或时段维度')
    return
  }

  loading.value = true
  traceResult.value = null
  duplicateCheckResult.value = null
  consistencyCheckResult.value = null

  try {
    const params = {
      statBatch: queryParams.statBatch.trim() || null,
      contentId: queryParams.contentId,
      startDate: dateRange.value?.[0] || null,
      endDate: dateRange.value?.[1] || null,
    }
    const result = await traceInteractionStatsApi(params)
    traceResult.value = result
  } catch (err: any) {
    ElMessage.error(err?.message || '溯源查询失败')
  } finally {
    loading.value = false
  }
}

const handleReset = () => {
  queryParams.statBatch = ''
  queryParams.contentId = null
  queryParams.startDate = ''
  queryParams.endDate = ''
  queryParams.statDate = ''
  dateRange.value = null
  traceResult.value = null
  duplicateCheckResult.value = null
  consistencyCheckResult.value = null
}

const checkDuplicate = async () => {
  if (!canCheckDuplicate.value) return
  checkingDuplicate.value = true
  duplicateCheckResult.value = null
  try {
    const result = await checkDuplicateStatApi({
      statBatch: queryParams.statBatch.trim() || null,
      contentId: queryParams.contentId,
      statDate: queryParams.statDate,
    })
    duplicateCheckResult.value = result
    if (result.isDuplicate) {
      ElMessage.warning('检测到重复统计记录')
    }
  } catch (err: any) {
    ElMessage.error(err?.message || '重复统计校验失败')
  } finally {
    checkingDuplicate.value = false
  }
}

const checkConsistency = async () => {
  if (!canCheckConsistency.value) return
  checkingConsistency.value = true
  consistencyCheckResult.value = null
  try {
    const result = await validateInteractionConsistencyApi({
      contentId: queryParams.contentId,
      statDate: queryParams.statDate,
    })
    consistencyCheckResult.value = result
    if (!result.consistent) {
      ElMessage.warning('检测到互动数据不一致')
    }
  } catch (err: any) {
    ElMessage.error(err?.message || '一致性校验失败')
  } finally {
    checkingConsistency.value = false
  }
}

watch(
  () => [queryParams.statBatch, queryParams.contentId, queryParams.statDate],
  () => {
    if (canCheckDuplicate.value) {
      checkDuplicate()
    } else {
      duplicateCheckResult.value = null
    }
    if (canCheckConsistency.value) {
      checkConsistency()
    } else {
      consistencyCheckResult.value = null
    }
  }
)

const expandRowKeys = ref<number[]>([])

const toggleExpand = (row: InteractionTraceFinding) => {
  const idx = expandRowKeys.value.indexOf(row.id || 0)
  if (idx > -1) {
    expandRowKeys.value.splice(idx, 1)
  } else {
    expandRowKeys.value.push(row.id || 0)
  }
}

const formatInteractionRate = (rate: number) => {
  if (rate === null || rate === undefined) return '-'
  return (rate * 100).toFixed(2) + '%'
}

onMounted(() => {})
</script>

<template>
  <div class="analytics-trace-page">
    <div class="query-panel card-content">
      <div class="panel-header">
        <div class="header-title">
          <el-icon :size="18" color="#409EFF"><DataAnalysis /></el-icon>
          <span>溯源查询</span>
        </div>
        <el-tag type="info" size="small" effect="plain">
          <el-icon style="margin-right: 4px;"><Bell /></el-icon>
          至少输入一项查询条件
        </el-tag>
      </div>

      <el-form :inline="true" :model="queryParams" @submit.prevent class="query-form">
        <el-row :gutter="12" style="width: 100%;">
          <el-col :span="6">
            <el-form-item label="统计批次" style="width: 100%; justify-content: flex-end;">
              <el-input
                v-model="queryParams.statBatch"
                placeholder="请输入统计批次"
                clearable
                style="width: 100%;"
                :prefix-icon="Aim"
                @keyup.enter="handleSearch"
              />
            </el-form-item>
          </el-col>
          <el-col :span="5">
            <el-form-item label="内容ID" style="width: 100%; justify-content: flex-end;">
              <el-input-number
                v-model="queryParams.contentId"
                :min="0"
                :controls="false"
                placeholder="内容ID"
                style="width: 100%;"
              />
            </el-form-item>
          </el-col>
          <el-col :span="7">
            <el-form-item label="时段维度" style="width: 100%; justify-content: flex-end;">
              <el-date-picker
                v-model="dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="YYYY-MM-DD"
                style="width: 100%;"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6" style="display: flex; align-items: center; gap: 8px;">
            <el-form-item style="margin: 0;">
              <el-button type="primary" :icon="Search" round @click="handleSearch" :disabled="loading">
                查询溯源
              </el-button>
            </el-form-item>
            <el-form-item style="margin: 0;">
              <el-button :icon="RefreshLeft" round @click="handleReset" :disabled="loading">
                重置
              </el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <div v-if="canCheckDuplicate || canCheckConsistency" class="auto-check-section">
        <div class="check-title">
          <el-icon :size="14"><Document /></el-icon>
          <span>系统自动校验</span>
        </div>
        <div class="check-items">
          <div v-if="canCheckDuplicate" class="check-item">
            <span class="check-label">重复统计校验：</span>
            <el-icon v-if="checkingDuplicate" class="is-loading" :size="16" color="#409EFF">
              <RefreshLeft />
            </el-icon>
            <template v-else-if="duplicateCheckResult">
              <el-icon v-if="!duplicateCheckResult.isDuplicate" :size="16" color="#67C23A">
                <CircleCheck />
              </el-icon>
              <span v-if="!duplicateCheckResult.isDuplicate" class="check-ok">未检测到重复统计</span>
              <el-icon v-else :size="16" color="#F56C6C"><Warning /></el-icon>
              <span v-else class="check-warn">
                检测到重复统计：内容ID#{{ duplicateCheckResult.existingStat?.contentId }}
                @{{ formatDate(duplicateCheckResult.existingStat?.statDate, DATE_FORMAT_STRING.SHORT) }}
              </span>
            </template>
          </div>
          <div v-if="canCheckConsistency" class="check-item">
            <span class="check-label">互动一致性校验：</span>
            <el-icon v-if="checkingConsistency" class="is-loading" :size="16" color="#409EFF">
              <RefreshLeft />
            </el-icon>
            <template v-else-if="consistencyCheckResult">
              <el-icon v-if="consistencyCheckResult.consistent" :size="16" color="#67C23A">
                <CircleCheck />
              </el-icon>
              <span v-if="consistencyCheckResult.consistent" class="check-ok">互动数据一致</span>
              <el-icon v-else :size="16" color="#E6A23C"><Warning /></el-icon>
              <span v-else class="check-warn">
                检测到
                {{ Object.keys(consistencyCheckResult.differences || {}).length }}
                项数据不一致
              </span>
            </template>
          </div>
        </div>
      </div>
    </div>

    <QySkeleton v-if="loading" :rows="10" animated />

    <template v-else-if="traceResult">
      <div class="summary-cards">
        <div
          v-for="card in traceTypeCards"
          :key="card.type"
          class="trace-card"
          :style="{ background: card.gradient }"
        >
          <div class="card-icon" :style="{ background: card.color }">
            <el-icon :size="22" color="#fff"><Warning /></el-icon>
          </div>
          <div class="card-content">
            <div class="card-count" :style="{ color: card.color }">
              {{ formatNumber(card.count) }}
            </div>
            <div class="card-label">{{ card.label }}</div>
          </div>
        </div>
      </div>

      <div class="card-content findings-section">
        <div class="section-header">
          <div class="header-title">
            <el-icon :size="16" color="#F56C6C"><Warning /></el-icon>
            <span>溯源发现明细</span>
            <el-tag size="small" type="danger" effect="plain" style="margin-left: 8px;">
              共 {{ formatNumber(findings.length) }} 条
            </el-tag>
          </div>
        </div>

        <el-table
          :data="findings"
          border
          stripe
          :max-height="450"
          :expand-row-keys="expandRowKeys"
          @expand-change="(row: any) => toggleExpand(row)"
          :header-cell-style="{ background: '#FAFBFC', fontWeight: 600 }"
        >
          <el-table-column type="expand">
            <template #default="{ row }">
              <div v-if="row.beforeData || row.afterData" class="expand-content">
                <el-descriptions :column="2" border size="small">
                  <el-descriptions-item label="溯源类型" :span="2">
                    <el-tag
                      :color="getEnumItem(TRACE_TYPE, row.traceType)?.color"
                      effect="dark"
                      size="small"
                    >
                      {{ getEnumLabel(TRACE_TYPE, row.traceType) }}
                    </el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="变更前数据" v-if="row.beforeData">
                    <pre class="data-pre">{{ JSON.stringify(row.beforeData, null, 2) }}</pre>
                  </el-descriptions-item>
                  <el-descriptions-item label="变更后数据" v-if="row.afterData">
                    <pre class="data-pre">{{ JSON.stringify(row.afterData, null, 2) }}</pre>
                  </el-descriptions-item>
                </el-descriptions>
              </div>
              <div v-else class="expand-empty">
                <el-empty description="无前后对比数据" :image-size="60" />
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="contentId" label="内容ID" width="100" align="center">
            <template #default="{ row }">
              <span v-if="row.contentId" class="content-id">#{{ row.contentId }}</span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="statBatch" label="统计批次" width="140" show-overflow-tooltip />
          <el-table-column prop="statDate" label="统计日期" width="120" align="center">
            <template #default="{ row }">
              {{ formatDate(row.statDate, DATE_FORMAT_STRING.SHORT) }}
            </template>
          </el-table-column>
          <el-table-column label="溯源类型" width="140" align="center">
            <template #default="{ row }">
              <el-tag
                :color="getEnumItem(TRACE_TYPE, row.traceType)?.color"
                effect="dark"
                size="small"
              >
                {{ getEnumLabel(TRACE_TYPE, row.traceType) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="traceDesc" label="溯源描述" min-width="240" show-overflow-tooltip>
            <template #default="{ row }">
              <el-tooltip
                v-if="row.traceDesc && row.traceDesc.length > 40"
                :content="row.traceDesc"
                placement="top"
              >
                <span>{{ row.traceDesc }}</span>
              </el-tooltip>
              <span v-else>{{ row.traceDesc || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="严重级别" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="severityTagType(row.severity)" size="small" effect="dark">
                {{ row.severity === 1 ? '低' : row.severity === 2 ? '中' : '高' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="处理状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.resolved === 1 ? 'success' : 'warning'" size="small">
                {{ row.resolved === 1 ? '已处理' : '未处理' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="操作时间" width="170" align="center">
            <template #default="{ row }">
              {{ formatDate(row.createdAt, DATE_FORMAT_STRING.FULL) }}
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="card-content stats-section">
        <div class="section-header">
          <div class="header-title">
            <el-icon :size="16" color="#409EFF"><DataAnalysis /></el-icon>
            <span>溯源数据明细</span>
            <el-tag size="small" type="primary" effect="plain" style="margin-left: 8px;">
              共 {{ formatNumber(stats.length) }} 条
            </el-tag>
          </div>
        </div>

        <el-table
          :data="stats"
          border
          stripe
          :max-height="450"
          :header-cell-style="{ background: '#FAFBFC', fontWeight: 600 }"
        >
          <el-table-column label="内容标题" min-width="200" show-overflow-tooltip>
            <template #default="{ row }">
              <span>{{ row.content?.contentTitle || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="statDate" label="统计日期" width="110" align="center">
            <template #default="{ row }">
              {{ formatDate(row.statDate, DATE_FORMAT_STRING.SHORT) }}
            </template>
          </el-table-column>
          <el-table-column label="评论数" width="100" align="right">
            <template #default="{ row }">
              {{ formatNumber(row.commentCount) }}
            </template>
          </el-table-column>
          <el-table-column label="弹幕数" width="100" align="right">
            <template #default="{ row }">
              {{ formatNumber(row.danmakuCount) }}
            </template>
          </el-table-column>
          <el-table-column label="点赞数" width="100" align="right">
            <template #default="{ row }">
              {{ formatNumber(row.likeCount) }}
            </template>
          </el-table-column>
          <el-table-column label="转发数" width="100" align="right">
            <template #default="{ row }">
              {{ formatNumber(row.shareCount) }}
            </template>
          </el-table-column>
          <el-table-column label="收藏数" width="100" align="right">
            <template #default="{ row }">
              {{ formatNumber(row.collectCount) }}
            </template>
          </el-table-column>
          <el-table-column label="播放数" width="110" align="right">
            <template #default="{ row }">
              {{ formatPlayCount(row.playCount) }}
            </template>
          </el-table-column>
          <el-table-column label="总互动" width="110" align="right">
            <template #default="{ row }">
              <strong>{{ formatNumber(row.totalInteractions) }}</strong>
            </template>
          </el-table-column>
          <el-table-column label="互动率" width="100" align="center">
            <template #default="{ row }">
              <span :style="{ color: row.interactionRate > 0.1 ? '#67C23A' : '#909399' }">
                {{ formatInteractionRate(row.interactionRate) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="是否异常" width="90" align="center">
            <template #default="{ row }">
              <el-badge v-if="row.isAnomaly === 1" :value="'异常'" type="danger" />
              <span v-else style="color: #909399;">正常</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </template>

    <div v-else class="empty-state card-content">
      <el-empty description="请输入查询条件进行溯源分析" :image-size="120">
        <template #image>
          <el-icon :size="80" color="#C0C4CC"><DataAnalysis /></el-icon>
        </template>
        <el-button type="primary" round :icon="Search" @click="handleSearch">
          开始溯源查询
        </el-button>
      </el-empty>
    </div>

    <el-backtop :right="40" :bottom="40" />
  </div>
</template>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.analytics-trace-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  position: relative;
}

.card-content {
  background: #fff;
  border-radius: 8px;
  padding: 16px 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.query-panel {
  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid $border-color-lighter;

    .header-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 15px;
      font-weight: 600;
      color: $text-primary;
    }
  }

  .query-form {
    margin-bottom: 0;
  }

  .auto-check-section {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px dashed $border-color-lighter;

    .check-title {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      font-weight: 500;
      color: $text-secondary;
      margin-bottom: 8px;
    }

    .check-items {
      display: flex;
      gap: 32px;
      flex-wrap: wrap;

      .check-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;

        .check-label {
          color: $text-secondary;
        }

        .check-ok {
          color: $success-color;
        }

        .check-warn {
          color: $warning-color;
        }
      }
    }
  }
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;

  .trace-card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px;
    border-radius: 8px;
    transition: transform 0.2s, box-shadow 0.2s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    .card-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .card-content {
      flex: 1;

      .card-count {
        font-size: 28px;
        font-weight: 700;
        line-height: 1.2;
        font-family: 'DIN Alternate', Menlo, Consolas, monospace;
      }

      .card-label {
        font-size: 13px;
        color: $text-secondary;
        margin-top: 4px;
      }
    }
  }
}

.findings-section,
.stats-section {
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    padding-bottom: 10px;
    border-bottom: 1px solid $border-color-lighter;

    .header-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 15px;
      font-weight: 600;
      color: $text-primary;
    }
  }

  .el-table {
    margin-top: 4px;
  }
}

.content-id {
  font-family: Menlo, Consolas, monospace;
  font-weight: 500;
  color: $primary-color;
  background: rgba(64, 158, 255, 0.08);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.expand-content {
  padding: 8px 16px;

  .data-pre {
    margin: 0;
    padding: 8px;
    background: #f5f7fa;
    border-radius: 4px;
    font-family: Menlo, Consolas, monospace;
    font-size: 12px;
    line-height: 1.5;
    max-height: 200px;
    overflow: auto;
    white-space: pre-wrap;
    word-break: break-all;
  }
}

.expand-empty {
  padding: 8px 16px;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.btn-8px {
  border-radius: 8px !important;
}

:deep(.el-button--round) {
  border-radius: 8px;
}

:deep(.el-tag) {
  border-radius: 4px;
}
</style>
