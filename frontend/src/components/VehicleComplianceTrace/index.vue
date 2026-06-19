<template>
  <div class="vehicle-compliance-trace" v-loading="loading">
    <div class="stats-cards">
      <div class="stat-card success">
        <div class="stat-icon"><el-icon><Document /></el-icon></div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.totalChecks }}</div>
          <div class="stat-label">校验总次数</div>
        </div>
      </div>
      <div class="stat-card warning">
        <div class="stat-icon"><el-icon><Warning /></el-icon></div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.abnormalCount }}</div>
          <div class="stat-label">异常检测次数</div>
        </div>
      </div>
      <div class="stat-card info">
        <div class="stat-icon"><el-icon><Edit /></el-icon></div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.rectificationCount }}</div>
          <div class="stat-label">整改记录数</div>
        </div>
      </div>
      <div class="stat-card danger">
        <div class="stat-icon"><el-icon><WarningFilled /></el-icon></div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.fakeDetected ? '是' : '否' }}</div>
          <div class="stat-label">虚假合规</div>
        </div>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="trace-tabs">
      <el-tab-pane label="校验记录" name="checks">
        <div class="filter-bar">
          <el-select v-model="filterForm.checkType" placeholder="校验类型" clearable size="small" style="width: 120px">
            <el-option v-for="(label, value) in ComplianceCheckTypeMap" :key="value" :label="label" :value="Number(value)" />
          </el-select>
          <el-select v-model="filterForm.checkStatus" placeholder="校验状态" clearable size="small" style="width: 120px">
            <el-option v-for="(label, value) in ComplianceCheckStatusMap" :key="value" :label="label" :value="Number(value)" />
          </el-select>
          <el-select v-model="filterForm.complianceLevel" placeholder="合规等级" clearable size="small" style="width: 100px">
            <el-option v-for="(label, value) in ComplianceLevelMap" :key="value" :label="label" :value="Number(value)" />
          </el-select>
          <el-button size="small" type="primary" @click="loadChecks">查询</el-button>
          <el-button size="small" @click="resetFilter">重置</el-button>
        </div>

        <div class="check-timeline">
          <el-timeline>
            <el-timeline-item
              v-for="check in checkRecords"
              :key="check.id"
              :timestamp="formatDate(check.createTime)"
              :type="getCheckTimelineType(check)"
              placement="top"
            >
              <div class="timeline-card">
                <div class="card-header">
                  <el-tag :type="getCheckStatusTagType(check.checkStatus)" size="small">
                    {{ ComplianceCheckStatusMap[check.checkStatus as keyof typeof ComplianceCheckStatusMap] }}
                  </el-tag>
                  <span class="check-type">{{ ComplianceCheckTypeMap[check.checkType as keyof typeof ComplianceCheckTypeMap] }}</span>
                  <span class="check-score" :style="{ color: getScoreColor(check.complianceScore) }">
                    {{ Number(check.complianceScore).toFixed(1) }} 分
                  </span>
                </div>
                <div class="card-body">
                  <div class="info-row" v-if="check.riskItems && check.riskItems.length > 0">
                    <span class="label">风险项：</span>
                    <span class="value text-danger">{{ check.riskItems.length }} 项</span>
                  </div>
                  <div class="info-row" v-if="check.highlightedFields && check.highlightedFields.length > 0">
                    <span class="label">高亮字段：</span>
                    <div class="highlighted-fields">
                      <el-tag
                        v-for="(field, idx) in check.highlightedFields"
                        :key="idx"
                        type="warning"
                        size="small"
                        effect="plain"
                      >
                        {{ field }}
                      </el-tag>
                    </div>
                  </div>
                  <div class="info-row">
                    <span class="label">交管核验：</span>
                    <el-tag
                      :type="check.syncFromTraffic === 1 ? 'success' : check.syncFromTraffic === 2 ? 'danger' : 'info'"
                      size="small"
                    >
                      {{ check.syncFromTraffic === 1 ? '一致' : check.syncFromTraffic === 2 ? '不一致' : '未核验' }}
                    </el-tag>
                  </div>
                </div>
                <div class="card-footer">
                  <el-button type="primary" link size="small" @click="viewCheckDetail(check)">查看详情</el-button>
                  <el-button
                    v-if="check.checkStatus === 3 || check.rectificationRequired === 1"
                    type="warning"
                    link
                    size="small"
                    @click="createRectification(check)"
                  >
                    创建整改
                  </el-button>
                </div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </div>

        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="checkQuery.page"
            v-model:page-size="checkQuery.pageSize"
            :total="checkTotal"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            @current-change="loadChecks"
            @size-change="loadChecks"
          />
        </div>
      </el-tab-pane>

      <el-tab-pane label="整改记录" name="rectifications">
        <el-table :data="rectificationRecords" stripe v-loading="rectLoading">
          <el-table-column prop="rectificationType" label="整改类型" width="120">
            <template #default="{ row }">
              {{ RectificationTypeMap[row.rectificationType as keyof typeof RectificationTypeMap] }}
            </template>
          </el-table-column>
          <el-table-column prop="rectificationStatus" label="整改状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="getRectificationTagType(row.rectificationStatus)" size="small">
                {{ RectificationStatusMap[row.rectificationStatus as keyof typeof RectificationStatusMap] }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="violationType" label="违规类型" width="120" show-overflow-tooltip />
          <el-table-column prop="rectificationDeadline" label="整改截止" width="120">
            <template #default="{ row }">{{ formatDate(row.rectificationDeadline, 'YYYY-MM-DD') }}</template>
          </el-table-column>
          <el-table-column prop="remindCount" label="提醒次数" width="80" align="center" />
          <el-table-column prop="penaltyAmount" label="处罚金额" width="100" align="right">
            <template #default="{ row }">
              <span v-if="row.penaltyAmount">¥{{ Number(row.penaltyAmount).toFixed(2) }}</span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="operatorName" label="操作人" width="90" />
          <el-table-column label="操作" width="160" fixed="right" align="center">
            <template #default="{ row }">
              <el-button
                v-if="row.rectificationStatus === 0 || row.rectificationStatus === 1"
                type="primary"
                link
                size="small"
                @click="handleSubmitRectification(row)"
              >
                提交复核
              </el-button>
              <el-button type="info" link size="small">详情</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="rectQuery.page"
            v-model:page-size="rectQuery.pageSize"
            :total="rectTotal"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            @current-change="loadRectifications"
            @size-change="loadRectifications"
          />
        </div>
      </el-tab-pane>

      <el-tab-pane label="风险分析" name="risk">
        <div class="risk-analysis">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="当前合规等级">
              <el-tag :type="getComplianceTagType(vehicle?.complianceLevel)" effect="dark">
                {{ ComplianceLevelMap[vehicle?.complianceLevel as keyof typeof ComplianceLevelMap] }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="合规状态">
              {{ ComplianceStatusMap[vehicle?.complianceStatus as keyof typeof ComplianceStatusMap] }}
            </el-descriptions-item>
            <el-descriptions-item label="合规得分">
              <span :style="{ color: getScoreColor(vehicle?.complianceScore) }">
                {{ Number(vehicle?.complianceScore || 0).toFixed(1) }} 分
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="风险等级">
              <el-tag :type="getRiskTagType(vehicle?.riskLevel)">
                {{ vehicle?.riskLevel === 1 ? '低风险' : vehicle?.riskLevel === 2 ? '中风险' : '高风险' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="漏审次数">
              <span :class="{ 'text-danger': (vehicle?.missedCheckCount || 0) > 0 }">
                {{ vehicle?.missedCheckCount || 0 }} 次
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="虚假合规检测">
              <el-tag :type="vehicle?.fakeComplianceDetected === 0 ? 'success' : 'danger'">
                {{ FakeComplianceStatusMap[vehicle?.fakeComplianceDetected as keyof typeof FakeComplianceStatusMap] }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="待整改项">
              <span :class="{ 'text-warning': (vehicle?.pendingRectificationCount || 0) > 0 }">
                {{ vehicle?.pendingRectificationCount || 0 }} 项
              </span>
            </el-descriptions-item>
          </el-descriptions>

          <div class="trend-chart mt-20">
            <div class="chart-title">合规得分趋势</div>
            <div class="chart-placeholder">
              <el-empty description="趋势图表" :image-size="100">
                <template #description>
                  <span>合规得分趋势图（近10次校验）</span>
                </template>
              </el-empty>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="detailDialogVisible" title="校验详情" width="700px">
      <div v-if="currentCheck" class="check-detail">
        <div class="detail-header">
          <el-tag :type="getCheckStatusTagType(currentCheck.checkStatus)" effect="dark" size="large">
            {{ ComplianceCheckStatusMap[currentCheck.checkStatus as keyof typeof ComplianceCheckStatusMap] }}
          </el-tag>
          <span class="score-display">
            得分：<span :style="{ color: getScoreColor(currentCheck.complianceScore) }">{{ Number(currentCheck.complianceScore).toFixed(1) }}</span> / 100
          </span>
        </div>

        <el-tabs v-model="detailTab">
          <el-tab-pane label="保险校验" name="insurance">
            <ResultDisplay :data="currentCheck.insuranceCheckResult" />
          </el-tab-pane>
          <el-tab-pane label="年检校验" name="inspection">
            <ResultDisplay :data="currentCheck.inspectionCheckResult" />
          </el-tab-pane>
          <el-tab-pane label="违章校验" name="violation">
            <ResultDisplay :data="currentCheck.violationCheckResult" />
          </el-tab-pane>
          <el-tab-pane label="数据比对" name="comparison">
            <ResultDisplay :data="currentCheck.trafficDataCompare" />
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, defineComponent, h } from 'vue'
import { ElMessage } from 'element-plus'
import { Document, Warning, Edit, WarningFilled } from '@element-plus/icons-vue'
import { getComplianceChecksApi } from '@/api/vehicle'
import {
  ComplianceLevelMap,
  ComplianceCheckTypeMap,
  ComplianceCheckStatusMap,
  ComplianceStatusMap,
  RectificationTypeMap,
  RectificationStatusMap,
  FakeComplianceStatusMap
} from '@/enums/vehicle'
import { formatDate } from '@/utils/format'
import type { Vehicle, VehicleComplianceCheck, VehicleRectification } from '@/types/vehicle'

const props = defineProps<{
  vehicleId: number
  vehicle: Vehicle | null
}>()

const loading = ref(false)
const rectLoading = ref(false)
const activeTab = ref('checks')
const detailTab = ref('insurance')
const detailDialogVisible = ref(false)
const currentCheck = ref<VehicleComplianceCheck | null>(null)

const checkRecords = ref<VehicleComplianceCheck[]>([])
const checkTotal = ref(0)
const rectificationRecords = ref<VehicleRectification[]>([])
const rectTotal = ref(0)

const checkQuery = reactive({ page: 1, pageSize: 10 })
const rectQuery = reactive({ page: 1, pageSize: 10 })

const filterForm = reactive({
  checkType: undefined as number | undefined,
  checkStatus: undefined as number | undefined,
  complianceLevel: undefined as number | undefined
})

const ResultDisplay = defineComponent({
  props: ['data'],
  setup(props) {
    const items = computed(() => {
      if (!props.data || typeof props.data !== 'object') return []
      return Object.entries(props.data).map(([key, value]) => ({
        label: key,
        value: typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value)
      }))
    })
    return () => h('div', { class: 'result-display' },
      items.value.map(item => h('div', { class: 'result-row' }, [
        h('span', { class: 'row-label' }, item.label + '：'),
        h('span', { class: 'row-value' }, item.value)
      ]))
    )
  }
})

const stats = computed(() => {
  return {
    totalChecks: checkTotal.value,
    abnormalCount: checkRecords.value.filter(c => c.checkStatus === 4).length,
    rectificationCount: rectTotal.value,
    fakeDetected: props.vehicle?.fakeComplianceDetected === 2
  }
})

const getCheckTimelineType = (check: VehicleComplianceCheck) => {
  if (check.checkStatus === 2) return 'success'
  if (check.checkStatus === 3 || check.checkStatus === 4) return 'danger'
  if (check.checkStatus === 1) return 'warning'
  return 'primary'
}

const getCheckStatusTagType = (status: number | undefined) => {
  const map: Record<number, string> = {
    0: 'info', 1: 'warning', 2: 'success', 3: 'danger', 4: 'danger'
  }
  return map[status || 0] || 'info'
}

const getRectificationTagType = (status: number | undefined) => {
  const map: Record<number, string> = {
    0: 'warning', 1: 'primary', 2: '', 3: 'success', 4: 'danger'
  }
  return map[status || 0] || ''
}

const getScoreColor = (score: number | undefined) => {
  if (!score) return '#909399'
  if (score >= 90) return '#67c23a'
  if (score >= 75) return '#409eff'
  if (score >= 60) return '#e6a23c'
  return '#f56c6c'
}

const getComplianceTagType = (level: number | undefined) => {
  const map: Record<number, string> = { 1: 'success', 2: '', 3: 'warning', 4: 'danger', 0: 'info' }
  return map[level || 0] || 'info'
}

const getRiskTagType = (level: number | undefined) => {
  const map: Record<number, string> = { 1: 'success', 2: 'warning', 3: 'danger' }
  return map[level || 2] || 'warning'
}

const loadChecks = async () => {
  if (!props.vehicleId) return
  loading.value = true
  try {
    const res = await getComplianceChecksApi(props.vehicleId, { ...checkQuery, ...filterForm })
    checkRecords.value = res.data.list
    checkTotal.value = res.data.total
  } catch (error: any) {
    ElMessage.error(error.message || '获取校验记录失败')
  } finally {
    loading.value = false
  }
}

const loadRectifications = async () => {
  if (!props.vehicleId) return
  rectLoading.value = true
  try {
    rectificationRecords.value = []
    rectTotal.value = 0
  } catch (error: any) {
    ElMessage.error(error.message || '获取整改记录失败')
  } finally {
    rectLoading.value = false
  }
}

const viewCheckDetail = (check: VehicleComplianceCheck) => {
  currentCheck.value = check
  detailDialogVisible.value = true
}

const createRectification = (check: VehicleComplianceCheck) => {
  ElMessage.info('创建整改功能开发中')
}

const handleSubmitRectification = (row: VehicleRectification) => {
  ElMessage.info('提交复核功能开发中')
}

const resetFilter = () => {
  filterForm.checkType = undefined
  filterForm.checkStatus = undefined
  filterForm.complianceLevel = undefined
  checkQuery.page = 1
  loadChecks()
}

watch(() => props.vehicleId, (val) => {
  if (val) {
    checkQuery.page = 1
    rectQuery.page = 1
    loadChecks()
    loadRectifications()
  }
})

onMounted(() => {
  if (props.vehicleId) {
    loadChecks()
    loadRectifications()
  }
})
</script>

<style lang="scss" scoped>
.vehicle-compliance-trace {
  .stats-cards {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 16px;

    .stat-card {
      display: flex;
      align-items: center;
      padding: 16px;
      border-radius: 8px;
      background: #fff;
      border: 1px solid #ebeef5;

      &.success { border-left: 4px solid #67c23a; }
      &.warning { border-left: 4px solid #e6a23c; }
      &.info { border-left: 4px solid #409eff; }
      &.danger { border-left: 4px solid #f56c6c; }

      .stat-icon {
        font-size: 28px;
        margin-right: 12px;
      }

      .stat-content {
        .stat-value {
          font-size: 22px;
          font-weight: 700;
          color: #303133;
        }

        .stat-label {
          font-size: 12px;
          color: #909399;
          margin-top: 2px;
        }
      }
    }
  }

  .filter-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
  }

  .timeline-card {
    background: #fafafa;
    border: 1px solid #ebeef5;
    border-radius: 8px;
    padding: 12px 16px;

    .card-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;

      .check-type {
        font-size: 13px;
        color: #606266;
        font-weight: 500;
      }

      .check-score {
        margin-left: auto;
        font-weight: 600;
        font-size: 14px;
      }
    }

    .card-body {
      margin-bottom: 8px;

      .info-row {
        display: flex;
        align-items: flex-start;
        margin-bottom: 4px;
        font-size: 13px;

        .label {
          color: #909399;
          min-width: 70px;
        }

        .value {
          flex: 1;
        }

        .highlighted-fields {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }
      }
    }

    .card-footer {
      display: flex;
      gap: 12px;
      border-top: 1px solid #ebeef5;
      padding-top: 8px;
    }
  }

  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 12px;
  }

  .risk-analysis {
    .trend-chart {
      .chart-title {
        font-size: 15px;
        font-weight: 600;
        margin-bottom: 12px;
        color: #303133;
      }

      .chart-placeholder {
        height: 200px;
        background: #f5f7fa;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }
  }

  .check-detail {
    .detail-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      background: #f5f7fa;
      border-radius: 8px;
      margin-bottom: 16px;

      .score-display {
        font-size: 14px;
        color: #606266;

        span {
          font-size: 24px;
          font-weight: 700;
        }
      }
    }

    .result-display {
      .result-row {
        display: flex;
        padding: 8px 12px;
        border-bottom: 1px solid #f0f0f0;

        .row-label {
          min-width: 140px;
          color: #606266;
        }

        .row-value {
          flex: 1;
          color: #303133;
        }
      }
    }
  }

  .text-danger { color: #f56c6c; }
  .text-warning { color: #e6a23c; }
  .mt-20 { margin-top: 20px; }
}
</style>
