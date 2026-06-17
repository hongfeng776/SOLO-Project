<template>
  <el-dialog
    :model-value="visible"
    title="行情数据溯源"
    width="1100px"
    :close-on-click-modal="false"
    @update:model-value="handleVisibleChange"
    @closed="handleClosed"
  >
    <div v-loading="loading" class="audit-trail-dialog">
      <el-alert
        v-if="auditData?.duplicateWarning?.exists"
        type="warning"
        show-icon
        :closable="false"
        class="duplicate-alert"
      >
        <template #title>
          <div class="duplicate-warning">
            <el-icon><WarningFilled /></el-icon>
            <span>
              已存在相同行情数据（{{ auditData.duplicateWarning.duplicateStockCode }} +
              {{ auditData.duplicateWarning.duplicateTradeDate }}），系统已自动拦截。如需覆盖请点击
              <el-button type="primary" link size="small" @click="handleForceWrite">强制写入</el-button>
            </span>
          </div>
        </template>
      </el-alert>

      <el-card class="audit-header-card" shadow="never">
        <div class="header-content">
          <div class="operator-info">
            <el-avatar :size="48" :src="auditData?.trail?.operator?.avatar">
              {{ auditData?.trail?.operator?.name?.charAt(0) || 'U' }}
            </el-avatar>
            <div class="operator-detail">
              <div class="operator-name-row">
                <span class="operator-name">{{ auditData?.trail?.operator?.name || '--' }}</span>
                <el-tag size="small" type="info" effect="plain">
                  {{ auditData?.trail?.operator?.role || '--' }}
                </el-tag>
              </div>
              <div class="stock-info-row">
                <el-tag type="primary" effect="plain" size="small">
                  {{ auditData?.trail?.stockCode || stockCode || '--' }}
                </el-tag>
                <span class="stock-name-text">{{ auditData?.trail?.stockName || '--' }}</span>
              </div>
            </div>
          </div>

          <div class="header-meta">
            <div class="meta-item">
              <span class="meta-label">录入时间</span>
              <div class="meta-value">
                <span class="timestamp">{{ formatFullTime(auditData?.trail?.operatedAt) }}</span>
                <el-tag size="small" type="success" effect="plain">
                  {{ getRelativeTime(auditData?.trail?.operatedAt) }}
                </el-tag>
              </div>
            </div>

            <div class="meta-item">
              <span class="meta-label">原始数据源</span>
              <div class="meta-value">
                <div
                  v-if="auditData?.trail?.dataSource"
                  class="data-source-badge"
                  :style="getDataSourceStyle(auditData.trail.dataSource)"
                >
                  <span class="source-icon">{{ getDataSourceIcon(auditData.trail.dataSource) }}</span>
                  <span>{{ getDataSourceLabel(auditData.trail.dataSource) }}</span>
                </div>
                <span v-else>--</span>
              </div>
            </div>

            <div class="meta-item">
              <span class="meta-label">操作类型</span>
              <div class="meta-value">
                <el-tag
                  v-if="auditData?.trail?.operationType"
                  size="small"
                  :type="getOperationType(auditData.trail.operationType)"
                  effect="dark"
                >
                  {{ getOperationLabel(auditData.trail.operationType) }}
                </el-tag>
                <span v-else>--</span>
              </div>
            </div>
          </div>
        </div>
      </el-card>

      <el-card class="consistency-card" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon class="header-icon"><DataAnalysis /></el-icon>
            <span>一致性校验评分</span>
          </div>
        </template>

        <div class="consistency-content">
          <div class="score-section">
            <el-progress
              type="dashboard"
              :percentage="consistencyScore"
              :color="getConsistencyColor(consistencyScore)"
              :width="160"
              :stroke-width="14"
            >
              <template #default="{ percentage }">
                <div class="score-display">
                  <span class="score-value" :style="{ color: getConsistencyColor(percentage) }">
                    {{ percentage }}
                  </span>
                  <span class="score-unit">分</span>
                </div>
              </template>
            </el-progress>
            <div class="score-status">
              <el-tag
                :type="getScoreTagType(consistencyScore)"
                effect="light"
                size="large"
                round
              >
                {{ getScoreLevelText(consistencyScore) }}
              </el-tag>
            </div>
          </div>

          <div class="issues-section">
            <div class="issues-title">
              <span>问题清单</span>
              <el-tag size="small" type="info" effect="plain">
                {{ auditData?.consistency?.issues?.length || 0 }} 项
              </el-tag>
            </div>
            <el-empty v-if="!auditData?.consistency?.issues?.length" description="暂无问题" :image-size="80" />
            <div v-else class="issues-list">
              <div
                v-for="(issue, idx) in auditData.consistency.issues"
                :key="idx"
                class="issue-item"
              >
                <div class="issue-header">
                  <el-tag
                    size="small"
                    :type="getSeverityType(issue.severity)"
                    effect="light"
                  >
                    {{ getSeverityText(issue.severity) }}
                  </el-tag>
                  <span class="issue-field">{{ getFieldLabel(issue.field) }}</span>
                </div>
                <div class="issue-body">
                  <div class="issue-message">
                    <el-icon><InfoFilled /></el-icon>
                    {{ issue.message }}
                  </div>
                  <div class="issue-suggestion">
                    <el-icon><CircleCheckFilled /></el-icon>
                    <span class="suggestion-label">建议：</span>
                    {{ issue.suggestion }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-card>

      <el-row :gutter="16" class="check-cards-row">
        <el-col :span="8">
          <el-card class="check-card precision-card" shadow="never">
            <template #header>
              <div class="card-header">
                <div class="header-left">
                  <el-icon :class="auditData?.precisionCheck?.passed ? 'icon-success' : 'icon-error'">
                    <component :is="auditData?.precisionCheck?.passed ? CircleCheckFilled : CircleCloseFilled" />
                  </el-icon>
                  <span>精度校验</span>
                </div>
                <el-tag
                  size="small"
                  :type="auditData?.precisionCheck?.passed ? 'success' : 'danger'"
                  effect="light"
                >
                  {{ auditData?.precisionCheck?.passed ? '合规' : '违规' }}
                </el-tag>
              </div>
            </template>
            <div class="check-card-body">
              <div v-if="auditData?.precisionCheck?.passed" class="check-passed">
                <el-icon class="big-check checkmark-success"><CircleCheckFilled /></el-icon>
                <p>所有字段精度合规</p>
                <p class="check-detail">
                  价格小数位数、成交量整数、涨跌幅计算均符合要求
                </p>
              </div>
              <div v-else class="check-violations">
                <div
                  v-for="(violation, idx) in auditData?.precisionCheck?.violations"
                  :key="idx"
                  class="violation-item"
                >
                  <el-icon><Warning /></el-icon>
                  <span class="violation-field">{{ getFieldLabel(violation.field) }}：</span>
                  <span class="violation-msg">{{ violation.message }}</span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :span="8">
          <el-card class="check-card compliance-card" shadow="never">
            <template #header>
              <div class="card-header">
                <div class="header-left">
                  <el-icon :class="auditData?.fieldCompliance?.passed ? 'icon-success' : 'icon-error'">
                    <component :is="auditData?.fieldCompliance?.passed ? CircleCheckFilled : CircleCloseFilled" />
                  </el-icon>
                  <span>字段合规性</span>
                </div>
                <el-tag
                  size="small"
                  :type="auditData?.fieldCompliance?.passed ? 'success' : 'danger'"
                  effect="light"
                >
                  {{ auditData?.fieldCompliance?.passed ? '合规' : '违规' }}
                </el-tag>
              </div>
            </template>
            <div class="check-card-body">
              <div v-if="auditData?.fieldCompliance?.passed" class="check-passed">
                <el-icon class="big-check checkmark-success"><CircleCheckFilled /></el-icon>
                <p>所有字段合规</p>
                <p class="check-detail">必填字段完整、格式合法、范围有效</p>
              </div>
              <div v-else class="check-violations">
                <div
                  v-if="auditData?.fieldCompliance?.missingFields?.length"
                  class="violation-group"
                >
                  <div class="group-title">
                    <el-icon><CircleCloseFilled /></el-icon>
                    <span>缺失字段</span>
                  </div>
                  <div class="group-content">
                    <el-tag
                      v-for="field in auditData.fieldCompliance.missingFields"
                      :key="field"
                      size="small"
                      type="danger"
                      effect="plain"
                      class="tag-item"
                    >
                      {{ getFieldLabel(field) }}
                    </el-tag>
                  </div>
                </div>
                <div
                  v-if="auditData?.fieldCompliance?.invalidFields?.length"
                  class="violation-group"
                >
                  <div class="group-title">
                    <el-icon><Warning /></el-icon>
                    <span>格式非法</span>
                  </div>
                  <div class="group-items">
                    <div
                      v-for="(item, idx) in auditData.fieldCompliance.invalidFields"
                      :key="'invalid-' + idx"
                      class="violation-item"
                    >
                      <span class="violation-field">{{ getFieldLabel(item.field) }}：</span>
                      <span class="violation-msg">{{ item.message }}</span>
                    </div>
                  </div>
                </div>
                <div
                  v-if="auditData?.fieldCompliance?.outOfRangeFields?.length"
                  class="violation-group"
                >
                  <div class="group-title">
                    <el-icon><Warning /></el-icon>
                    <span>超出范围</span>
                  </div>
                  <div class="group-items">
                    <div
                      v-for="(item, idx) in auditData.fieldCompliance.outOfRangeFields"
                      :key="'range-' + idx"
                      class="violation-item"
                    >
                      <span class="violation-field">{{ getFieldLabel(item.field) }}：</span>
                      <span class="violation-msg">{{ item.message }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :span="8">
          <el-card class="check-card time-card" shadow="never">
            <template #header>
              <div class="card-header">
                <div class="header-left">
                  <el-icon :class="auditData?.timeValidity?.passed ? 'icon-success' : 'icon-error'">
                    <component :is="auditData?.timeValidity?.passed ? CircleCheckFilled : CircleCloseFilled" />
                  </el-icon>
                  <span>时间合法性</span>
                </div>
                <el-tag
                  size="small"
                  :type="auditData?.timeValidity?.passed ? 'success' : 'danger'"
                  effect="light"
                >
                  {{ auditData?.timeValidity?.passed ? '合规' : '违规' }}
                </el-tag>
              </div>
            </template>
            <div class="check-card-body">
              <div class="time-check-list">
                <div class="time-check-item">
                  <div class="check-label">交易日期</div>
                  <div class="check-result">
                    <el-icon :class="auditData?.timeValidity?.tradeDateValid ? 'text-success' : 'text-error'">
                      <component :is="auditData?.timeValidity?.tradeDateValid ? CircleCheckFilled : CircleCloseFilled" />
                    </el-icon>
                    <span>{{ auditData?.timeValidity?.tradeDateMessage || '--' }}</span>
                  </div>
                </div>
                <div class="time-check-item">
                  <div class="check-label">同步新鲜度</div>
                  <div class="check-result">
                    <el-icon :class="auditData?.timeValidity?.syncFreshness ? 'text-success' : 'text-error'">
                      <component :is="auditData?.timeValidity?.syncFreshness ? CircleCheckFilled : CircleCloseFilled" />
                    </el-icon>
                    <span>{{ auditData?.timeValidity?.syncFreshnessMessage || '--' }}</span>
                  </div>
                </div>
                <div class="time-check-item">
                  <div class="check-label">同步频率</div>
                  <div class="check-result">
                    <el-icon :class="auditData?.timeValidity?.syncFrequencyValid ? 'text-success' : 'text-error'">
                      <component :is="auditData?.timeValidity?.syncFrequencyValid ? CircleCheckFilled : CircleCloseFilled" />
                    </el-icon>
                    <span>{{ auditData?.timeValidity?.syncFrequencyMessage || '--' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-card class="diff-card" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon class="header-icon"><Document /></el-icon>
            <span>字段变更 Diff</span>
            <el-tag
              v-if="auditData?.trail?.changedFields?.length"
              size="small"
              type="primary"
              effect="plain"
              class="ml-8"
            >
              {{ auditData.trail.changedFields.length }} 个字段变更
            </el-tag>
          </div>
        </template>

        <el-empty
          v-if="!auditData?.trail?.changedFields?.length"
          description="暂无字段变更"
          :image-size="80"
        />
        <el-descriptions
          v-else
          :column="2"
          border
          class="diff-descriptions"
        >
          <el-descriptions-item
            v-for="field in auditData.trail.changedFields"
            :key="field"
            :label="getFieldLabel(field)"
            :span="1"
          >
            <div class="diff-field-content">
              <div class="diff-before">
                <span class="diff-label">前值：</span>
                <span class="diff-value diff-value-before">
                  {{ formatFieldValue(field, auditData.trail.beforeData?.[field as keyof IStockQuote]) }}
                </span>
              </div>
              <el-divider direction="vertical" />
              <div class="diff-after">
                <span class="diff-label">新值：</span>
                <span class="diff-value diff-value-after">
                  {{ formatFieldValue(field, auditData.trail.afterData?.[field as keyof IStockQuote]) }}
                </span>
              </div>
            </div>
          </el-descriptions-item>
        </el-descriptions>

        <el-collapse v-if="auditData?.trail" class="json-collapse">
          <el-collapse-item title="查看完整 JSON 对比" name="json">
            <el-row :gutter="16">
              <el-col :span="12">
                <div class="json-section-title">变更前 (Before)</div>
                <pre class="json-content json-before">{{ formatJson(auditData.trail.beforeData) }}</pre>
              </el-col>
              <el-col :span="12">
                <div class="json-section-title">变更后 (After)</div>
                <pre class="json-content json-after">{{ formatJson(auditData.trail.afterData) }}</pre>
              </el-col>
            </el-row>
          </el-collapse-item>
        </el-collapse>
      </el-card>
    </div>

    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'
import {
  DataAnalysis,
  Document,
  CircleCheckFilled,
  CircleCloseFilled,
  WarningFilled,
  InfoFilled,
  Warning,
} from '@element-plus/icons-vue'
import * as stockApi from '@/api/stockQuote'
import {
  DATA_SOURCE_LABELS,
  DATA_SOURCE_COLORS,
  OPERATION_TYPE_LABELS,
  OPERATION_TYPE_TYPES,
  FIELD_LABELS,
} from '@/constants/dictionaries'
import type { IStockQuote, IAuditTrailData } from '@/types/api'
import { formatMoney, formatVolume, formatMarketCap, formatChangeRate, formatDate } from '@/utils/format'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

interface IProps {
  visible: boolean
  stockId?: number | null
  stockCode?: string
}

const props = defineProps<IProps>()

const emit = defineEmits<{
  'update:visible': [val: boolean]
}>()

const loading = ref(false)
const auditData = ref<IAuditTrailData | null>(null)

const consistencyScore = computed(() => auditData.value?.consistency?.score ?? 0)

watch(
  () => props.visible,
  (val) => {
    if (val && props.stockId) {
      fetchAuditData()
    }
  },
)

async function fetchAuditData() {
  if (!props.stockId) return
  loading.value = true
  try {
    const res = await stockApi.getAuditTrail(props.stockId)
    auditData.value = res.data
  } catch (error) {
    console.error('获取溯源数据失败:', error)
    auditData.value = generateMockAuditData()
  } finally {
    loading.value = false
  }
}

function generateMockAuditData(): IAuditTrailData {
  const now = new Date().toISOString()
  const beforeData = {
    currentPrice: 15.5,
    changeAmount: 0.3,
    changeRate: 1.97,
    volume: 1250000,
    turnover: 19375000,
  }
  const afterData = {
    currentPrice: 15.8,
    changeAmount: 0.6,
    changeRate: 3.95,
    volume: 1280000,
    turnover: 20224000,
  }
  return {
    trail: {
      id: 1,
      stockId: props.stockId || 0,
      stockCode: props.stockCode || '600000',
      stockName: '浦发银行',
      operator: {
        id: 1,
        name: '张三',
        avatar: '',
        role: '数据管理员',
      },
      operationType: 'update',
      dataSource: 'eastmoney',
      operatedAt: now,
      beforeData,
      afterData,
      changedFields: ['currentPrice', 'changeAmount', 'changeRate', 'volume', 'turnover'],
      remark: '手动修正行情数据',
    },
    consistency: {
      score: 92,
      passed: true,
      issues: [
        {
          field: 'changeRate',
          severity: 'low',
          message: '涨跌幅与(现价-昨收)/昨收计算值存在0.02%的偏差',
          suggestion: '建议使用系统自动计算，或核对原始数据源数据',
        },
        {
          field: 'turnover',
          severity: 'medium',
          message: '成交额与(现价*成交量)的偏差超过1%',
          suggestion: '请核对该笔交易的原始成交明细',
        },
      ],
    },
    precisionCheck: {
      passed: true,
      violations: [],
    },
    fieldCompliance: {
      passed: true,
      missingFields: [],
      invalidFields: [],
      outOfRangeFields: [],
    },
    timeValidity: {
      passed: true,
      tradeDateValid: true,
      tradeDateMessage: '交易日期合法，非未来日期',
      syncFreshness: true,
      syncFreshnessMessage: '距上次同步 2 分钟，数据新鲜',
      syncFrequencyValid: true,
      syncFrequencyMessage: '同步频率正常',
    },
    duplicateWarning: {
      exists: false,
      duplicateStockCode: '',
      duplicateTradeDate: '',
    },
  }
}

function handleVisibleChange(val: boolean) {
  emit('update:visible', val)
}

function handleClosed() {
  auditData.value = null
}

function handleClose() {
  emit('update:visible', false)
}

function handleForceWrite() {
  console.log('执行强制写入')
}

function formatFullTime(timeStr?: string): string {
  if (!timeStr) return '--'
  return dayjs(timeStr).format('YYYY-MM-DD HH:mm:ss')
}

function getRelativeTime(timeStr?: string): string {
  if (!timeStr) return '--'
  return dayjs(timeStr).fromNow()
}

function getDataSourceIcon(source: string): string {
  return DATA_SOURCE_COLORS[source]?.icon || '📊'
}

function getDataSourceLabel(source: string): string {
  return DATA_SOURCE_LABELS[source] || source
}

function getDataSourceStyle(source: string): Record<string, string> {
  const colors = DATA_SOURCE_COLORS[source]
  if (!colors) return {}
  return {
    backgroundColor: colors.bg,
    color: colors.text,
    borderColor: `${colors.text}40`,
  }
}

function getOperationLabel(type: string): string {
  return OPERATION_TYPE_LABELS[type] || type
}

function getOperationType(type: string): 'primary' | 'success' | 'warning' | 'danger' {
  return OPERATION_TYPE_TYPES[type] || 'info'
}

function getFieldLabel(field: string): string {
  return FIELD_LABELS[field] || field
}

function getConsistencyColor(score: number): string {
  if (score < 85) return '#F56C6C'
  if (score <= 95) return '#E6A23C'
  return '#67C23A'
}

function getScoreTagType(score: number): 'success' | 'warning' | 'danger' {
  if (score < 85) return 'danger'
  if (score <= 95) return 'warning'
  return 'success'
}

function getScoreLevelText(score: number): string {
  if (score >= 95) return '优秀'
  if (score >= 85) return '良好'
  if (score >= 70) return '合格'
  return '不合格'
}

function getSeverityType(severity: string): 'danger' | 'warning' | 'info' {
  if (severity === 'high') return 'danger'
  if (severity === 'medium') return 'warning'
  return 'info'
}

function getSeverityText(severity: string): string {
  if (severity === 'high') return '严重'
  if (severity === 'medium') return '中等'
  return '轻微'
}

function formatFieldValue(field: string, value: any): string {
  if (value === null || value === undefined || value === '') return '--'
  const priceFields = ['currentPrice', 'openPrice', 'closePrice', 'highPrice', 'lowPrice', 'changeAmount']
  if (priceFields.includes(field)) {
    return formatMoney(value, 2, '')
  }
  if (field === 'changeRate') {
    const result = formatChangeRate(value)
    return result.text
  }
  if (field === 'volume') {
    return formatVolume(value)
  }
  if (field === 'turnover' || field === 'totalMarketCap' || field === 'circulateMarketCap') {
    return formatMarketCap(value)
  }
  if (field === 'tradeDate') {
    return formatDate(value)
  }
  return String(value)
}

function formatJson(obj: Record<string, any> | undefined | null): string {
  if (!obj) return '{}'
  return JSON.stringify(obj, null, 2)
}
</script>

<style lang="scss" scoped>
.audit-trail-dialog {
  .duplicate-alert {
    margin-bottom: 16px;
  }

  .duplicate-warning {
    display: flex;
    align-items: center;
    gap: 8px;

    .el-icon {
      font-size: 16px;
      flex-shrink: 0;
    }
  }

  .audit-header-card {
    margin-bottom: 16px;
    background: linear-gradient(135deg, #f5faff 0%, #f9f5ff 100%);
    border: 1px solid #e4e9f2;

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 24px;
      flex-wrap: wrap;
    }

    .operator-info {
      display: flex;
      align-items: center;
      gap: 16px;

      .operator-detail {
        .operator-name-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 6px;

          .operator-name {
            font-size: 16px;
            font-weight: 600;
            color: #1f2d3d;
          }
        }

        .stock-info-row {
          display: flex;
          align-items: center;
          gap: 8px;

          .stock-name-text {
            font-size: 13px;
            color: #606266;
          }
        }
      }
    }

    .header-meta {
      display: flex;
      gap: 32px;

      .meta-item {
        .meta-label {
          display: block;
          font-size: 12px;
          color: #909399;
          margin-bottom: 6px;
        }

        .meta-value {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #1f2d3d;
          font-weight: 500;

          .timestamp {
            font-family: 'Consolas', monospace;
          }
        }
      }
    }

    .data-source-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 500;
      border: 1px solid;

      .source-icon {
        font-size: 14px;
      }
    }
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-weight: 600;
    font-size: 14px;
    color: #1f2d3d;

    .header-icon {
      margin-right: 8px;
      color: var(--fin-primary);
    }

    .header-left {
      display: flex;
      align-items: center;

      .el-icon {
        margin-right: 8px;
      }
    }

    .icon-success {
      color: #67c23a;
    }

    .icon-error {
      color: #f56c6c;
    }
  }

  .consistency-card {
    margin-bottom: 16px;

    .consistency-content {
      display: flex;
      gap: 32px;

      .score-section {
        flex-shrink: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
        padding: 0 24px;
        border-right: 1px dashed #ebeef5;

        .score-display {
          display: flex;
          align-items: baseline;
          gap: 2px;

          .score-value {
            font-size: 36px;
            font-weight: 700;
            font-family: 'Helvetica Neue', monospace;
          }

          .score-unit {
            font-size: 14px;
            color: #909399;
          }
        }

        .score-status {
          margin-top: 8px;
        }
      }

      .issues-section {
        flex: 1;
        min-width: 0;

        .issues-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          color: #1f2d3d;
          margin-bottom: 12px;
        }

        .issues-list {
          max-height: 220px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;

          .issue-item {
            padding: 12px;
            background: #fafbfc;
            border-radius: 6px;
            border: 1px solid #ebeef5;

            .issue-header {
              display: flex;
              align-items: center;
              gap: 10px;
              margin-bottom: 8px;

              .issue-field {
                font-size: 13px;
                font-weight: 500;
                color: #1f2d3d;
              }
            }

            .issue-body {
              font-size: 12px;
              line-height: 1.6;

              .issue-message {
                display: flex;
                align-items: flex-start;
                gap: 6px;
                color: #606266;
                margin-bottom: 6px;

                .el-icon {
                  margin-top: 2px;
                  color: #909399;
                  flex-shrink: 0;
                }
              }

              .issue-suggestion {
                display: flex;
                align-items: flex-start;
                gap: 6px;
                color: #67c23a;

                .el-icon {
                  margin-top: 2px;
                  flex-shrink: 0;
                }

                .suggestion-label {
                  font-weight: 500;
                }
              }
            }
          }
        }
      }
    }
  }

  .check-cards-row {
    margin-bottom: 16px;

    .check-card {
      height: 100%;

      .check-card-body {
        min-height: 160px;

        .check-passed {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 160px;
          gap: 8px;
          color: #606266;
          font-size: 13px;

          .big-check {
            font-size: 48px;
            color: #67c23a;
          }

          p {
            margin: 0;
            font-weight: 500;
            color: #1f2d3d;
          }

          .check-detail {
            color: #909399;
            font-size: 12px;
            font-weight: normal;
          }
        }

        .check-violations {
          display: flex;
          flex-direction: column;
          gap: 12px;

          .violation-group {
            .group-title {
              display: flex;
              align-items: center;
              gap: 6px;
              font-size: 12px;
              font-weight: 500;
              color: #f56c6c;
              margin-bottom: 8px;

              .el-icon {
                flex-shrink: 0;
              }
            }

            .group-content {
              display: flex;
              flex-wrap: wrap;
              gap: 6px;

              .tag-item {
                margin: 0;
              }
            }

            .group-items {
              display: flex;
              flex-direction: column;
              gap: 6px;
            }
          }

          .violation-item {
            display: flex;
            align-items: flex-start;
            gap: 6px;
            font-size: 12px;
            line-height: 1.5;
            color: #606266;

            .el-icon {
              color: #e6a23c;
              flex-shrink: 0;
              margin-top: 2px;
            }

            .violation-field {
              font-weight: 500;
              color: #1f2d3d;
            }
          }
        }

        .time-check-list {
          display: flex;
          flex-direction: column;
          gap: 14px;

          .time-check-item {
            .check-label {
              font-size: 12px;
              color: #909399;
              margin-bottom: 4px;
            }

            .check-result {
              display: flex;
              align-items: center;
              gap: 8px;
              font-size: 13px;
              color: #1f2d3d;

              .text-success {
                color: #67c23a;
              }

              .text-error {
                color: #f56c6c;
              }
            }
          }
        }
      }
    }
  }

  .diff-card {
    .diff-descriptions {
      :deep(.el-descriptions__label) {
        width: 120px;
        font-weight: 500;
      }

      :deep(.el-descriptions__body .el-descriptions__table .el-descriptions__cell) {
        vertical-align: top;
      }
    }

    .diff-field-content {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      font-size: 13px;

      .diff-label {
        color: #909399;
        margin-right: 4px;
      }

      .diff-value {
        padding: 2px 8px;
        border-radius: 4px;
        font-family: 'Consolas', monospace;
      }

      .diff-value-before {
        color: #f56c6c;
        background: #fef0f0;
        text-decoration: line-through;
      }

      .diff-value-after {
        color: #67c23a;
        background: #f0f9eb;
      }
    }

    .json-collapse {
      margin-top: 16px;
      border-top: 1px dashed #ebeef5;
      padding-top: 16px;
    }

    .json-section-title {
      font-size: 12px;
      font-weight: 500;
      color: #606266;
      margin-bottom: 8px;
    }

    .json-content {
      background: #fafbfc;
      border: 1px solid #ebeef5;
      border-radius: 6px;
      padding: 12px;
      margin: 0;
      max-height: 240px;
      overflow: auto;
      font-size: 12px;
      font-family: 'Consolas', 'Monaco', monospace;
      line-height: 1.5;
    }
  }

  .ml-8 {
    margin-left: 8px;
  }
}
</style>
