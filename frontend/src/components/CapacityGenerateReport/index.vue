<template>
  <el-dialog
    v-model="visible"
    title="生成运力分析报表"
    width="680px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="generate-report">
      <el-alert
        title="报表说明"
        type="info"
        :closable="false"
        show-icon
        class="info-alert"
      >
        <template #default>
          <ul class="info-list">
            <li>报表包含<strong class="text-primary">运力数据校验</strong>、<strong class="text-primary">缺口分析</strong>、<strong class="text-primary">冗余定位</strong>等多维度分析</li>
            <li>系统将自动<strong class="text-warning">拦截虚假运力数据</strong>和<strong class="text-warning">异常在线司机数据</strong></li>
            <li>报表生成后可下载，数据准确性可达<strong class="text-success">98%以上</strong></li>
          </ul>
        </template>
      </el-alert>

      <el-form :model="reportForm" label-width="100px" class="report-form">
        <el-form-item label="报表类型" required>
          <el-radio-group v-model="reportForm.reportType">
            <el-radio value="comprehensive">
              <el-icon><DataAnalysis /></el-icon>
              综合分析报告
            </el-radio>
            <el-radio value="shortage">
              <el-icon><TrendCharts /></el-icon>
              运力缺口报告
            </el-radio>
            <el-radio value="surplus">
              <el-icon><Histogram /></el-icon>
              运力冗余报告
            </el-radio>
            <el-radio value="trend">
              <el-icon><LineChart /></el-icon>
              趋势分析报告
            </el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="时间范围" required>
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 100%"
            value-format="YYYY-MM-DD"
            :shortcuts="dateShortcuts"
          />
        </el-form-item>

        <el-form-item label="目标城市">
          <el-select
            v-model="reportForm.city"
            placeholder="选择城市，不选则为全域"
            clearable
            style="width: 100%"
          >
            <el-option
              v-for="city in cityOptions"
              :key="city"
              :label="city"
              :value="city"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="数据校验">
          <div class="validation-options">
            <el-checkbox v-model="validationOptions.checkFakeData">
              拦截虚假运力数据
            </el-checkbox>
            <el-checkbox v-model="validationOptions.checkAbnormalDrivers">
              拦截异常在线司机
            </el-checkbox>
            <el-checkbox v-model="validationOptions.checkContinuity">
              时空连续性校验
            </el-checkbox>
            <el-checkbox v-model="validationOptions.checkRatio">
              供需比合理性校验
            </el-checkbox>
          </div>
        </el-form-item>
      </el-form>

      <div class="preview-section" v-if="validationResult">
        <div class="preview-header">
          <span class="preview-title">
            <el-icon><DataLine /></el-icon>
            数据预校验结果
          </span>
          <el-tag
            :type="validationResult.validationPassed ? 'success' : 'warning'"
            size="small"
          >
            {{ validationResult.validationPassed ? '校验通过' : '存在异常' }}
          </el-tag>
        </div>
        <div class="validation-stats">
          <div class="stat-item">
            <div class="stat-label">总记录数</div>
            <div class="stat-value">{{ validationResult.totalRecords }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">可疑记录</div>
            <div class="stat-value" :class="{ 'text-warning': validationResult.suspiciousRecords > 0 }">
              {{ validationResult.suspiciousRecords }}
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-label">异常司机</div>
            <div class="stat-value" :class="{ 'text-warning': validationResult.abnormalDrivers > 0 }">
              {{ validationResult.abnormalDrivers }}
            </div>
          </div>
        </div>
        <div class="validation-checks">
          <div
            v-for="(check, index) in validationResult.checks"
            :key="index"
            class="check-item"
          >
            <el-icon :class="check.passed ? 'text-success' : 'text-danger'">
              <CircleCheck v-if="check.passed" />
              <CircleClose v-else />
            </el-icon>
            <span>{{ check.name }}</span>
          </div>
        </div>
      </div>

      <div class="suspicious-list" v-if="suspiciousData.length > 0">
        <div class="list-header">
          <el-icon class="warning-icon"><Warning /></el-icon>
          <span>可疑数据记录（前10条）</span>
        </div>
        <el-table :data="suspiciousData.slice(0, 10)" size="small" max-height="200">
          <el-table-column label="时间" width="160">
            <template #default="{ row }">{{ formatDateTime(row.timestamp) }}</template>
          </el-table-column>
          <el-table-column prop="city" label="城市" width="100" />
          <el-table-column prop="onlineCount" label="在线司机" width="90" align="right" />
          <el-table-column prop="orderCount" label="订单数" width="80" align="right" />
          <el-table-column label="问题" min-width="150">
            <template #default="{ row }">
              <el-tag
                v-for="(issue, idx) in row.issues"
                :key="idx"
                size="small"
                type="warning"
                style="margin-right: 4px"
              >
                {{ issue }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="preview-content" v-if="reportPreview">
        <div class="preview-header">
          <el-icon><Document /></el-icon>
          报表预览
        </div>
        <div class="report-preview">
          <div class="report-header">
            <div class="report-title">{{ getReportTypeName(reportForm.reportType) }}</div>
            <div class="report-meta">
              <span>报告编号：{{ reportPreview.reportNo }}</span>
              <span>生成时间：{{ formatDateTime(reportPreview.generatedAt) }}</span>
              <span>生成人：{{ reportPreview.generatedBy }}</span>
            </div>
          </div>

          <div class="report-summary">
            <div class="summary-title">一、运力概览</div>
            <div class="summary-grid">
              <div class="summary-item">
                <span class="item-label">在线司机总数</span>
                <span class="item-value">{{ reportPreview.summary.totalOnlineDrivers }}</span>
              </div>
              <div class="summary-item">
                <span class="item-label">订单总数</span>
                <span class="item-value">{{ reportPreview.summary.totalOrders }}</span>
              </div>
              <div class="summary-item">
                <span class="item-label">完成订单</span>
                <span class="item-value">{{ reportPreview.summary.completedOrders }}</span>
              </div>
              <div class="summary-item">
                <span class="item-label">完成率</span>
                <span class="item-value text-primary">{{ reportPreview.summary.completionRate }}%</span>
              </div>
              <div class="summary-item">
                <span class="item-label">平均利用率</span>
                <span class="item-value">{{ reportPreview.summary.avgUtilizationRate }}%</span>
              </div>
              <div class="summary-item">
                <span class="item-label">整体状态</span>
                <el-tag
                  size="small"
                  :type="getStatusSeverity(reportPreview.summary.overallStatus.code)"
                >
                  {{ reportPreview.summary.overallStatus.label }}
                </el-tag>
              </div>
            </div>
          </div>

          <div class="report-section">
            <div class="section-title">二、城市运力分布</div>
            <el-table :data="reportPreview.cityBreakdown" size="small">
              <el-table-column prop="city" label="城市" width="100" />
              <el-table-column prop="onlineCount" label="在线司机" width="90" align="right" />
              <el-table-column prop="orderCount" label="订单数" width="80" align="right" />
              <el-table-column prop="completionRate" label="完成率" width="90" align="right">
                <template #default="{ row }">{{ row.completionRate }}%</template>
              </el-table-column>
              <el-table-column prop="avgResponseTime" label="响应时长" width="90" align="right">
                <template #default="{ row }">{{ row.avgResponseTime }}分钟</template>
              </el-table-column>
              <el-table-column label="状态" width="100" align="center">
                <template #default="{ row }">
                  <el-tag size="small" :type="getStatusSeverity(row.status)">
                    {{ getStatusLabel(row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <div class="report-section">
            <div class="section-title">三、调度建议</div>
            <div class="recommendations">
              <div
                v-for="(rec, index) in reportPreview.recommendations"
                :key="index"
                class="recommendation-item"
                :class="`priority-${rec.priority}`"
              >
                <el-tag size="small" :type="getPriorityType(rec.priority)">
                  {{ rec.priority === 'high' ? '高优先级' : rec.priority === 'medium' ? '中优先级' : '低优先级' }}
                </el-tag>
                <span class="rec-content">{{ rec.content }}</span>
              </div>
            </div>
          </div>

          <div class="report-footer">
            <span>数据来源：{{ reportPreview.appendices.dataSource }}</span>
            <span>数据准确率：{{ reportPreview.appendices.dataAccuracy }}</span>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button
        type="primary"
        :icon="Refresh"
        :loading="validating"
        @click="handleValidate"
      >
        预校验数据
      </el-button>
      <el-button
        type="success"
        :icon="Download"
        :loading="generating"
        :disabled="!canGenerate"
        @click="handleGenerate"
      >
        生成并下载
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  DataAnalysis,
  TrendCharts,
  Histogram,
  LineChart,
  DataLine,
  Document,
  Warning,
  CircleCheck,
  CircleClose,
  Refresh,
  Download
} from '@element-plus/icons-vue'
import { generateReportApi, getCapacityTrendApi } from '@/api/capacity'
import { CITY_OPTIONS, CapacityStatusLabelMap } from '@/enums/capacity'
import { formatDateTime } from '@/utils/format'
import type {
  ReportParams,
  CapacityReport,
  ValidationResult,
  SuspiciousDataPoint
} from '@/types/capacity'

interface Props {
  modelValue: boolean
  canExport: boolean
}

const props = withDefaults(defineProps<Props>(), {
  canExport: false
})

const emit = defineEmits(['update:modelValue', 'success'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const validating = ref(false)
const generating = ref(false)
const validationResult = ref<ValidationResult | null>(null)
const suspiciousData = ref<SuspiciousDataPoint[]>([])
const reportPreview = ref<CapacityReport | null>(null)

const dateRange = ref<string[]>([])

const reportForm = reactive<ReportParams>({
  reportType: 'comprehensive',
  city: '',
  startDate: '',
  endDate: ''
})

const validationOptions = reactive({
  checkFakeData: true,
  checkAbnormalDrivers: true,
  checkContinuity: true,
  checkRatio: true
})

const cityOptions = CITY_OPTIONS

const dateShortcuts = [
  {
    text: '近7天',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 6)
      return [start, end]
    }
  },
  {
    text: '近30天',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 29)
      return [start, end]
    }
  },
  {
    text: '本月',
    value: () => {
      const end = new Date()
      const start = new Date(end.getFullYear(), end.getMonth(), 1)
      return [start, end]
    }
  }
]

const canGenerate = computed(() => {
  return dateRange.value?.length === 2
    && reportForm.reportType
    && props.canExport
})

const getReportTypeName = (type: string) => {
  const typeMap: Record<string, string> = {
    comprehensive: '综合分析报告',
    shortage: '运力缺口分析报告',
    surplus: '运力冗余分析报告',
    trend: '趋势分析报告'
  }
  return typeMap[type] || '运力分析报告'
}

const getStatusSeverity = (status: string) => {
  const severityMap: Record<string, any> = {
    normal: 'success',
    saturated: 'warning',
    shortage: 'danger',
    surplus: 'info'
  }
  return severityMap[status] || 'info'
}

const getStatusLabel = (status: string) => CapacityStatusLabelMap[status] || status

const getPriorityType = (priority: string) => {
  const typeMap: Record<string, any> = {
    high: 'danger',
    medium: 'warning',
    low: 'info'
  }
  return typeMap[priority] || 'info'
}

const handleValidate = async () => {
  if (dateRange.value?.length !== 2) {
    ElMessage.warning('请先选择时间范围')
    return
  }

  validating.value = true
  try {
    const res = await getCapacityTrendApi({
      city: reportForm.city || undefined,
      timeRange: '30d'
    })

    validationResult.value = res.data.validationResult
    suspiciousData.value = res.data.suspiciousData

    if (validationResult.value.validationPassed) {
      ElMessage.success('数据校验通过，可正常生成报表')
    } else {
      ElMessage.warning('检测到异常数据，生成报表时将自动过滤')
    }
  } catch (e: any) {
    ElMessage.error(e.message || '数据校验失败')
  } finally {
    validating.value = false
  }
}

const handleGenerate = async () => {
  if (!canGenerate.value) return

  generating.value = true
  try {
    reportForm.startDate = dateRange.value[0]
    reportForm.endDate = dateRange.value[1]

    const res = await generateReportApi(reportForm)
    reportPreview.value = res.data

    ElMessage.success('报表生成成功')
    emit('success')
  } catch (e: any) {
    ElMessage.error(e.message || '报表生成失败')
  } finally {
    generating.value = false
  }
}

const handleClose = () => {
  if (!generating.value && !validating.value) {
    visible.value = false
  }
}

const resetForm = () => {
  reportForm.reportType = 'comprehensive'
  reportForm.city = ''
  reportForm.startDate = ''
  reportForm.endDate = ''
  dateRange.value = []
  validationResult.value = null
  suspiciousData.value = []
  reportPreview.value = null
}

watch(visible, (val) => {
  if (!val) {
    resetForm()
  }
})
</script>

<style lang="scss" scoped>
.generate-report {
  .info-alert {
    margin-bottom: 20px;

    .info-list {
      margin: 8px 0 0 0;
      padding-left: 20px;

      li {
        margin-bottom: 4px;
        font-size: 13px;
        color: #606266;
      }
    }
  }

  .report-form {
    .validation-options {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
    }
  }

  .preview-section {
    margin-top: 24px;
    padding: 16px;
    background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
    border-radius: 8px;

    .preview-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;

      .preview-title {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 15px;
        font-weight: 500;
        color: #303133;
      }
    }

    .validation-stats {
      display: flex;
      gap: 24px;
      margin-bottom: 16px;

      .stat-item {
        text-align: center;

        .stat-label {
          font-size: 12px;
          color: #909399;
          margin-bottom: 4px;
        }

        .stat-value {
          font-size: 20px;
          font-weight: bold;
          color: #303133;
        }
      }
    }

    .validation-checks {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;

      .check-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        color: #606266;
      }
    }
  }

  .suspicious-list {
    margin-top: 20px;

    .list-header {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      font-weight: 500;
      color: #e6a23c;
      margin-bottom: 12px;

      .warning-icon {
        font-size: 16px;
      }
    }
  }

  .preview-content {
    margin-top: 24px;

    .preview-header {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 15px;
      font-weight: 500;
      color: #303133;
      margin-bottom: 16px;
    }

    .report-preview {
      background: #fff;
      border: 1px solid #ebeef5;
      border-radius: 8px;
      padding: 20px;
      max-height: 500px;
      overflow-y: auto;

      .report-header {
        text-align: center;
        margin-bottom: 24px;
        padding-bottom: 16px;
        border-bottom: 1px solid #ebeef5;

        .report-title {
          font-size: 20px;
          font-weight: bold;
          color: #303133;
          margin-bottom: 12px;
        }

        .report-meta {
          display: flex;
          justify-content: center;
          gap: 24px;
          font-size: 12px;
          color: #909399;
        }
      }

      .report-summary {
        margin-bottom: 24px;

        .summary-title,
        .section-title {
          font-size: 16px;
          font-weight: 500;
          color: #303133;
          margin-bottom: 16px;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;

          .summary-item {
            display: flex;
            flex-direction: column;
            gap: 4px;
            padding: 12px;
            background: #f5f7fa;
            border-radius: 6px;

            .item-label {
              font-size: 12px;
              color: #909399;
            }

            .item-value {
              font-size: 18px;
              font-weight: 500;
              color: #303133;
            }
          }
        }
      }

      .report-section {
        margin-bottom: 24px;
      }

      .recommendations {
        .recommendation-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 8px;

          &:last-child {
            margin-bottom: 0;
          }

          &.priority-high {
            background: #fef0f0;
          }

          &.priority-medium {
            background: #fdf6ec;
          }

          &.priority-low {
            background: #f4f4f5;
          }

          .rec-content {
            font-size: 13px;
            color: #606266;
          }
        }
      }

      .report-footer {
        display: flex;
        justify-content: space-between;
        padding-top: 16px;
        border-top: 1px solid #ebeef5;
        font-size: 12px;
        color: #909399;
      }
    }
  }
}

.text-primary {
  color: #409eff;
}

.text-success {
  color: #67c23a;
}

.text-warning {
  color: #e6a23c;
}

.text-danger {
  color: #f56c6c;
}
</style>
