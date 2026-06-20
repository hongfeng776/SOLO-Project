<template>
  <div class="ccb-risk-trace">
    <CcbPageHeader
      title="客户风险等级溯源"
      description="查看客户历次风险评定记录，追溯等级变更历史"
      icon="Clock"
    >
      <template #extra>
        <el-button type="primary" :icon="ArrowLeft" @click="goBack">
          返回列表
        </el-button>
      </template>
    </CcbPageHeader>

    <div class="search-section">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="客户编号">
          <el-input v-model="searchForm.customerId" placeholder="请输入客户ID" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div v-if="loading" class="loading-container">
      <el-loading text="加载中..." />
    </div>

    <div v-else-if="traceList.length > 0">
      <div class="customer-info-card">
        <el-descriptions :column="3" border>
          <el-descriptions-item label="客户编号">
            {{ currentCustomer.customer_no }}
          </el-descriptions-item>
          <el-descriptions-item label="客户姓名">
            {{ currentCustomer.customer_name }}
          </el-descriptions-item>
          <el-descriptions-item label="当前风险等级">
            <el-tag :type="getRiskLevelType(currentCustomer.risk_level)" effect="dark" size="large">
              {{ currentCustomer.risk_level_text }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="评定次数">
            {{ traceList.length }} 次
          </el-descriptions-item>
          <el-descriptions-item label="首次评定时间">
            {{ firstAssessmentTime }}
          </el-descriptions-item>
          <el-descriptions-item label="最近评定时间">
            {{ lastAssessmentTime }}
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <el-divider content-position="left">等级变更时间线</el-divider>

      <el-timeline class="trace-timeline">
        <el-timeline-item
          v-for="(record, index) in sortedTraceList"
          :key="record.id"
          :timestamp="record.assessment_time"
          :type="getTimelineType(record.risk_level)"
          :color="getTimelineColor(record.risk_level)"
          placement="top"
        >
          <el-card shadow="hover" class="timeline-card">
            <template #header>
              <div class="card-header">
                <div class="header-left">
                  <el-tag :type="getRiskLevelType(record.risk_level)" effect="dark" size="large">
                    {{ record.risk_level_text }}
                  </el-tag>
                  <el-tag size="small" class="ml-8">{{ record.assessment_type_text }}</el-tag>
                  <el-tag
                    v-if="record.is_illegal_downgrade === 1"
                    type="danger"
                    effect="dark"
                    size="small"
                    class="ml-8"
                  >
                    违规调低
                  </el-tag>
                </div>
                <div class="header-right">
                  <span class="score-text">
                    综合评分：<span :class="getScoreClass(record.total_score)">{{ record.total_score }}</span>
                  </span>
                </div>
              </div>
            </template>

            <div v-if="index < sortedTraceList.length - 1" class="level-change">
              <span>
                <el-tag :type="getRiskLevelType(sortedTraceList[index + 1].risk_level)" effect="light" size="small">
                  {{ sortedTraceList[index + 1].risk_level_text }}
                </el-tag>
                <el-icon class="arrow-icon"><ArrowDown /></el-icon>
                <el-tag :type="getRiskLevelType(record.risk_level)" effect="dark" size="small">
                  {{ record.risk_level_text }}
                </el-tag>
              </span>
            </div>

            <div class="card-content">
              <div class="content-row">
                <span class="label">评定编号：</span>
                <span class="value">{{ record.assessment_no }}</span>
              </div>
              <div class="content-row">
                <span class="label">操作人：</span>
                <span class="value">{{ record.operator_name || '系统自动' }}</span>
              </div>
              <div v-if="record.block_reason" class="content-row block-reason">
                <el-alert
                  :title="'拦截原因：' + record.block_reason"
                  type="error"
                  :closable="false"
                  show-icon
                  size="small"
                />
              </div>
              <div v-if="record.risk_tags && record.risk_tags.length > 0" class="content-row">
                <span class="label">风险标签：</span>
                <el-tag
                  v-for="(tag, tagIndex) in record.risk_tags"
                  :key="tagIndex"
                  type="danger"
                  effect="light"
                  size="small"
                  class="mr-4"
                >
                  {{ tag }}
                </el-tag>
              </div>
              <div v-if="record.remark" class="content-row">
                <span class="label">备注：</span>
                <span class="value">{{ record.remark }}</span>
              </div>
            </div>

            <el-divider>指标详情</el-divider>

            <el-table :data="record.indicator_scores || []" size="small" max-height="200">
              <el-table-column prop="indicator_name" label="指标名称" width="140" />
              <el-table-column prop="category" label="类别" width="80">
                <template #default="{ row }">
                  <el-tag size="small">{{ getCategoryText(row.category) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="raw_value" label="原始值" width="100" align="center" />
              <el-table-column prop="weight" label="权重(%)" width="80" align="center" />
              <el-table-column prop="score" label="得分" width="80" align="center" />
              <el-table-column prop="weighted_score" label="加权得分" width="100" align="center" />
              <el-table-column prop="scoring_details" label="评分说明" />
            </el-table>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </div>

    <el-empty v-else description="请输入客户ID查询风险溯源记录" class="empty-state" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, ArrowDown } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import {
  getCustomerRiskTraceApi,
  RiskLevelOptions,
  IndicatorCategoryOptions,
  type TraceRecord
} from '@api/riskAssessment'

const route = useRoute()
const router = useRouter()

const loading = ref<boolean>(false)
const traceList = ref<TraceRecord[]>([])

const searchForm = reactive({
  customerId: ''
})

const currentCustomer = reactive({
  customer_no: '',
  customer_name: '',
  risk_level: 1,
  risk_level_text: ''
})

const sortedTraceList = computed(() => {
  return [...traceList.value].sort((a, b) => {
    return new Date(b.assessment_time!).getTime() - new Date(a.assessment_time!).getTime()
  })
})

const firstAssessmentTime = computed(() => {
  if (traceList.value.length === 0) return '-'
  const sorted = [...traceList.value].sort((a, b) => {
    return new Date(a.assessment_time!).getTime() - new Date(b.assessment_time!).getTime()
  })
  return sorted[0].assessment_time || '-'
})

const lastAssessmentTime = computed(() => {
  if (sortedTraceList.value.length === 0) return '-'
  return sortedTraceList.value[0].assessment_time || '-'
})

const fetchTraceData = async () => {
  if (!searchForm.customerId) {
    ElMessage.warning('请输入客户ID')
    return
  }

  loading.value = true
  try {
    const res = await getCustomerRiskTraceApi(searchForm.customerId)
    traceList.value = res.data

    if (traceList.value.length > 0) {
      const latest = sortedTraceList.value[0]
      currentCustomer.customer_no = searchForm.customerId
      currentCustomer.customer_name = '客户' + searchForm.customerId.slice(-6)
      currentCustomer.risk_level = latest.risk_level
      currentCustomer.risk_level_text = latest.risk_level_text
    }
  } catch (error: any) {
    ElMessage.error(error.message || '获取溯源数据失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  fetchTraceData()
}

const handleReset = () => {
  searchForm.customerId = ''
  traceList.value = []
}

const goBack = () => {
  router.push('/risk/assessment')
}

const getRiskLevelType = (level: number) => {
  const option = RiskLevelOptions.find(item => item.value === level)
  return option?.color || 'info'
}

const getCategoryText = (category: number) => {
  const option = IndicatorCategoryOptions.find(item => item.value === category)
  return option?.label || '-'
}

const getTimelineType = (level: number) => {
  const types: Record<number, string> = {
    1: 'success',
    2: 'warning',
    3: 'danger',
    4: 'danger'
  }
  return types[level] || 'primary'
}

const getTimelineColor = (level: number) => {
  const colors: Record<number, string> = {
    1: '#67c23a',
    2: '#e6a23c',
    3: '#f56c6c',
    4: '#f56c6c'
  }
  return colors[level] || '#409eff'
}

const getScoreClass = (score: number) => {
  if (score >= 70) return 'text-success font-bold'
  if (score >= 50) return 'text-warning font-bold'
  if (score >= 30) return 'text-orange font-bold'
  return 'text-danger font-bold'
}

onMounted(() => {
  const customerId = route.query.customerId as string
  if (customerId) {
    searchForm.customerId = customerId
    fetchTraceData()
  }
})
</script>

<style scoped lang="scss">
.ccb-risk-trace {
  .search-section {
    margin-bottom: 20px;
    padding: 20px;
    background: var(--el-bg-color-page);
    border-radius: 8px;
  }

  .search-form {
    margin: 0;
  }

  .loading-container {
    min-height: 300px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .customer-info-card {
    margin-bottom: 24px;
  }

  .trace-timeline {
    padding: 20px;
    background: var(--el-bg-color-page);
    border-radius: 8px;
  }

  .timeline-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .header-left {
        display: flex;
        align-items: center;
      }

      .score-text {
        font-size: 14px;
        color: var(--el-text-color-secondary);
      }
    }

    .level-change {
      display: flex;
      align-items: center;
      margin-bottom: 16px;
      padding: 12px;
      background: var(--el-fill-color-lighter);
      border-radius: 6px;

      .arrow-icon {
        margin: 0 8px;
        color: var(--el-color-primary);
      }
    }

    .card-content {
      .content-row {
        display: flex;
        align-items: flex-start;
        margin-bottom: 12px;

        .label {
          flex-shrink: 0;
          width: 80px;
          color: var(--el-text-color-secondary);
        }

        .value {
          flex: 1;
          color: var(--el-text-color-regular);
        }

        &.block-reason {
          display: block;
        }
      }
    }
  }

  .empty-state {
    padding: 60px 0;
  }

  .ml-8 {
    margin-left: 8px;
  }

  .mr-4 {
    margin-right: 4px;
  }

  .text-success {
    color: var(--el-color-success);
  }

  .text-warning {
    color: var(--el-color-warning);
  }

  .text-orange {
    color: var(--el-color-warning);
  }

  .text-danger {
    color: var(--el-color-danger);
  }

  .font-bold {
    font-weight: 600;
  }
}
</style>
