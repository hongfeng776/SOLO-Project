<template>
  <div class="detail-drawer">
    <div v-if="loading" class="loading-container">
      <el-loading text="加载中..." />
    </div>

    <div v-else-if="detail">
      <div class="score-card">
        <div class="score-info">
          <div class="score-value" :class="getScoreClass(detail.total_score)">
            {{ detail.total_score }}
          </div>
          <div class="score-label">综合评分</div>
        </div>
        <div class="level-info">
          <el-tag :type="getRiskLevelType(detail.risk_level)" effect="dark" size="large" class="level-tag">
            {{ detail.risk_level_text }}
          </el-tag>
          <div class="level-desc">{{ getRiskLevelDesc(detail.risk_level) }}</div>
        </div>
      </div>

      <el-descriptions :column="2" border class="info-descriptions">
        <el-descriptions-item label="评定编号">
          {{ detail.assessment_no }}
        </el-descriptions-item>
        <el-descriptions-item label="客户编号">
          {{ detail.customer_no }}
        </el-descriptions-item>
        <el-descriptions-item label="客户姓名">
          {{ detail.customer_name }}
        </el-descriptions-item>
        <el-descriptions-item label="评定类型">
          {{ detail.assessment_type_text }}
        </el-descriptions-item>
        <el-descriptions-item label="评定状态">
          <el-tag :type="getStatusType(detail.status)" effect="light" size="small">
            {{ detail.status_text }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="数据同步">
          <el-tag :type="getSyncStatusType(detail.data_sync_status)" effect="light" size="small">
            {{ detail.data_sync_status_text }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="操作人">
          {{ detail.operator_name || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="评定时间">
          {{ detail.assessment_time || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="下次复评">
          {{ detail.next_review_time || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="关联批次">
          {{ detail.batch_no || '-' }}
        </el-descriptions-item>
      </el-descriptions>

      <div v-if="detail.previous_risk_level" class="level-change">
        <div class="level-change-title">等级变更记录</div>
        <div class="level-change-content">
          <el-tag :type="getRiskLevelType(detail.previous_risk_level)" effect="light" size="small">
            {{ detail.previous_risk_level_text }}
          </el-tag>
          <el-icon class="arrow-icon"><ArrowRight /></el-icon>
          <el-tag :type="getRiskLevelType(detail.risk_level)" effect="dark" size="small">
            {{ detail.risk_level_text }}
          </el-tag>
          <el-tag v-if="detail.is_illegal_downgrade === 1" type="danger" effect="dark" size="small" class="ml-8">
            违规调低
          </el-tag>
        </div>
        <div v-if="detail.block_reason" class="block-reason">
          拦截原因：{{ detail.block_reason }}
        </div>
      </div>

      <el-tabs v-model="activeTab" class="detail-tabs">
        <el-tab-pane label="多维度数据" name="multiData">
          <div v-if="detail.multi_dimensional_data" class="multi-data-section">
            <div class="data-category">
              <div class="category-title">
                <el-icon><CreditCard /></el-icon>
                <span>征信数据</span>
              </div>
              <el-descriptions :column="2" size="small" border>
                <el-descriptions-item label="征信评分">
                  {{ detail.multi_dimensional_data.credit_data?.credit_score || '-' }}
                </el-descriptions-item>
                <el-descriptions-item label="信用等级">
                  {{ detail.multi_dimensional_data.credit_data?.credit_level || '-' }}
                </el-descriptions-item>
                <el-descriptions-item label="逾期次数">
                  {{ detail.multi_dimensional_data.credit_data?.overdue_count || 0 }}
                </el-descriptions-item>
                <el-descriptions-item label="逾期金额">
                  ¥{{ formatMoney(detail.multi_dimensional_data.credit_data?.overdue_amount) }}
                </el-descriptions-item>
                <el-descriptions-item label="近30天查询次数">
                  {{ detail.multi_dimensional_data.credit_data?.query_count_30d || 0 }}
                </el-descriptions-item>
                <el-descriptions-item label="数据来源">
                  {{ detail.multi_dimensional_data.credit_data?.data_source || '-' }}
                </el-descriptions-item>
              </el-descriptions>
            </div>

            <div class="data-category">
              <div class="category-title">
                <el-icon><Money /></el-icon>
                <span>交易数据</span>
              </div>
              <el-descriptions :column="2" size="small" border>
                <el-descriptions-item label="近30天交易笔数">
                  {{ detail.multi_dimensional_data.transaction_data?.transaction_count_30d || 0 }}
                </el-descriptions-item>
                <el-descriptions-item label="近30天交易金额">
                  ¥{{ formatMoney(detail.multi_dimensional_data.transaction_data?.transaction_amount_30d) }}
                </el-descriptions-item>
                <el-descriptions-item label="平均交易金额">
                  ¥{{ formatMoney(detail.multi_dimensional_data.transaction_data?.avg_transaction_amount) }}
                </el-descriptions-item>
                <el-descriptions-item label="异常交易笔数">
                  {{ detail.multi_dimensional_data.transaction_data?.abnormal_transaction_count || 0 }}
                </el-descriptions-item>
                <el-descriptions-item label="高频交易笔数">
                  {{ detail.multi_dimensional_data.transaction_data?.high_frequency_count || 0 }}
                </el-descriptions-item>
                <el-descriptions-item label="夜间交易笔数">
                  {{ detail.multi_dimensional_data.transaction_data?.night_transaction_count || 0 }}
                </el-descriptions-item>
              </el-descriptions>
            </div>

            <div class="data-category">
              <div class="category-title">
                <el-icon><Wallet /></el-icon>
                <span>负债数据</span>
              </div>
              <el-descriptions :column="2" size="small" border>
                <el-descriptions-item label="贷款余额">
                  ¥{{ formatMoney(detail.multi_dimensional_data.debt_data?.total_loan_balance) }}
                </el-descriptions-item>
                <el-descriptions-item label="负债率">
                  {{ detail.multi_dimensional_data.debt_data?.debt_ratio || 0 }}%
                </el-descriptions-item>
                <el-descriptions-item label="逾期贷款笔数">
                  {{ detail.multi_dimensional_data.debt_data?.overdue_loan_count || 0 }}
                </el-descriptions-item>
                <el-descriptions-item label="信用卡余额">
                  ¥{{ formatMoney(detail.multi_dimensional_data.debt_data?.credit_card_balance) }}
                </el-descriptions-item>
              </el-descriptions>
            </div>

            <div class="data-category">
              <div class="category-title">
                <el-icon><Document /></el-icon>
                <span>涉诉数据</span>
              </div>
              <el-descriptions :column="2" size="small" border>
                <el-descriptions-item label="涉诉次数">
                  {{ detail.multi_dimensional_data.lawsuit_data?.lawsuit_count || 0 }}
                </el-descriptions-item>
                <el-descriptions-item label="未结案数">
                  {{ detail.multi_dimensional_data.lawsuit_data?.pending_lawsuit_count || 0 }}
                </el-descriptions-item>
                <el-descriptions-item label="被执行次数">
                  {{ detail.multi_dimensional_data.lawsuit_data?.executed_count || 0 }}
                </el-descriptions-item>
                <el-descriptions-item label="失信次数">
                  {{ detail.multi_dimensional_data.lawsuit_data?.dishonest_count || 0 }}
                </el-descriptions-item>
              </el-descriptions>
            </div>

            <div class="data-category">
              <div class="category-title">
                <el-icon><User /></el-icon>
                <span>开户行为数据</span>
              </div>
              <el-descriptions :column="2" size="small" border>
                <el-descriptions-item label="开户天数">
                  {{ detail.multi_dimensional_data.account_behavior_data?.account_open_days || 0 }}天
                </el-descriptions-item>
                <el-descriptions-item label="近30天登录次数">
                  {{ detail.multi_dimensional_data.account_behavior_data?.login_count_30d || 0 }}
                </el-descriptions-item>
                <el-descriptions-item label="渠道多样性">
                  {{ detail.multi_dimensional_data.account_behavior_data?.channel_diversity || 0 }}
                </el-descriptions-item>
                <el-descriptions-item label="地址变更次数">
                  {{ detail.multi_dimensional_data.account_behavior_data?.address_change_count || 0 }}
                </el-descriptions-item>
              </el-descriptions>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="指标评分详情" name="indicators">
          <div class="indicators-section">
            <el-table :data="detail.indicator_scores || []" stripe>
              <el-table-column prop="indicator_name" label="指标名称" width="160" />
              <el-table-column label="类别" width="100">
                <template #default="{ row }">
                  <el-tag size="small">{{ getCategoryText(row.category) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="raw_value" label="原始值" width="100" align="center" />
              <el-table-column prop="weight" label="权重(%)" width="80" align="center" />
              <el-table-column label="得分情况" width="200">
                <template #default="{ row }">
                  <el-progress
                    :percentage="Math.round((row.score / row.max_score) * 100)"
                    :color="getProgressColor(row.score / row.max_score)"
                    :stroke-width="8"
                  />
                </template>
              </el-table-column>
              <el-table-column prop="score" label="得分" width="80" align="center" />
              <el-table-column prop="weighted_score" label="加权得分" width="100" align="center" />
              <el-table-column prop="scoring_details" label="评分说明" />
            </el-table>

            <div class="score-summary">
              <div class="summary-item">
                <span class="summary-label">总权重</span>
                <span class="summary-value">{{ totalWeight }}%</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">理论最高分</span>
                <span class="summary-value">{{ maxTotalScore }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">实际得分</span>
                <span class="summary-value text-primary">{{ detail.total_score }}</span>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="业务权限更新" name="permissions">
          <div class="permissions-section">
            <div v-if="permissionUpdateResult" class="permissions-card">
              <div class="permissions-header">
                <el-icon :class="permissionUpdateResult.success ? 'text-success' : 'text-danger'">
                  <CircleCheck v-if="permissionUpdateResult.success" />
                  <CircleClose v-else />
                </el-icon>
                <span>{{ permissionUpdateResult.success ? '业务权限更新成功' : '业务权限更新失败' }}</span>
              </div>

              <div class="permissions-content">
                <div class="permissions-title">已更新的业务模块：</div>
                <div class="permissions-list">
                  <el-tag
                    v-for="(module, index) in permissionUpdateResult.updated_modules"
                    :key="index"
                    type="success"
                    effect="light"
                    size="small"
                  >
                    {{ module }}
                  </el-tag>
                </div>

                <el-descriptions :column="1" border class="permissions-desc">
                  <el-descriptions-item label="更新前权限">
                    <pre>{{ JSON.stringify(permissionUpdateResult.previous_permissions, null, 2) }}</pre>
                  </el-descriptions-item>
                  <el-descriptions-item label="更新后权限">
                    <pre>{{ JSON.stringify(permissionUpdateResult.new_permissions, null, 2) }}</pre>
                  </el-descriptions-item>
                </el-descriptions>
              </div>
            </div>
            <div v-else class="empty-state">
              <el-empty description="暂无业务权限更新记录" />
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="风险标签与备注" name="remarks">
          <div class="remarks-section">
            <div class="risk-tags">
              <div class="section-title">风险标签</div>
              <div v-if="detail.risk_tag_list && detail.risk_tag_list.length > 0" class="tag-list">
                <el-tag
                  v-for="(tag, index) in detail.risk_tag_list"
                  :key="index"
                  type="danger"
                  effect="light"
                  size="large"
                  class="risk-tag"
                >
                  {{ tag }}
                </el-tag>
              </div>
              <div v-else class="empty-tags">
                <el-text type="info">暂无风险标签</el-text>
              </div>
            </div>

            <div class="remarks">
              <div class="section-title">备注信息</div>
              <div v-if="detail.remark" class="remark-content">
                {{ detail.remark }}
              </div>
              <div v-else class="empty-tags">
                <el-text type="info">暂无备注信息</el-text>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed, onMounted } from 'vue'
import { ArrowRight, CreditCard, Money, Wallet, Document, User, CircleCheck, CircleClose } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import {
  getRiskAssessmentDetailApi,
  RiskLevelOptions,
  AssessmentStatusOptions,
  DataSyncStatusOptions,
  IndicatorCategoryOptions,
  type RiskAssessment,
  type BusinessPermissionUpdateResult
} from '@api/riskAssessment'
import { formatMoney } from '@utils'

const props = defineProps<{
  assessmentId: string
}>()

const loading = ref<boolean>(false)
const detail = ref<RiskAssessment | null>(null)
const activeTab = ref<string>('multiData')
const permissionUpdateResult = ref<BusinessPermissionUpdateResult | null>(null)

const totalWeight = computed(() => {
  if (!detail.value?.indicator_scores) return 0
  return detail.value.indicator_scores.reduce((sum, item) => sum + item.weight, 0)
})

const maxTotalScore = computed(() => {
  if (!detail.value?.indicator_scores) return 0
  return detail.value.indicator_scores.reduce((sum, item) => sum + (item.weight * item.max_score / 100), 0).toFixed(0)
})

const fetchDetail = async () => {
  if (!props.assessmentId) return

  loading.value = true
  try {
    const res = await getRiskAssessmentDetailApi(props.assessmentId)
    detail.value = res.data

    if (res.data.risk_level) {
      permissionUpdateResult.value = {
        success: true,
        updated_modules: ['交易限额', '业务权限', '审核标准', '产品准入'],
        previous_permissions: {
          transaction_limit: 1000000,
          allowed_products: ['定期存款', '活期存款', '理财'],
          audit_level: 1
        },
        new_permissions: getPermissionsByRiskLevel(res.data.risk_level)
      }
    }
  } catch (error: any) {
    ElMessage.error(error.message || '获取详情失败')
  } finally {
    loading.value = false
  }
}

const getPermissionsByRiskLevel = (level: number) => {
  const permissions: any = {
    transaction_limit: 0,
    allowed_products: [] as string[],
    audit_level: 1
  }

  switch (level) {
    case 1:
      permissions.transaction_limit = 1000000
      permissions.allowed_products = ['定期存款', '活期存款', '理财', '贷款', '信用卡']
      permissions.audit_level = 1
      break
    case 2:
      permissions.transaction_limit = 500000
      permissions.allowed_products = ['定期存款', '活期存款', '理财']
      permissions.audit_level = 2
      break
    case 3:
      permissions.transaction_limit = 100000
      permissions.allowed_products = ['定期存款', '活期存款']
      permissions.audit_level = 3
      break
    case 4:
      permissions.transaction_limit = 10000
      permissions.allowed_products = ['活期存款']
      permissions.audit_level = 4
      break
  }

  return permissions
}

const getRiskLevelType = (level: number) => {
  const option = RiskLevelOptions.find(item => item.value === level)
  return option?.color || 'info'
}

const getRiskLevelDesc = (level: number) => {
  const descs: Record<number, string> = {
    1: '客户信用良好，风险极低，可享受全部金融服务',
    2: '客户信用较好，风险可控，需适当关注交易行为',
    3: '客户存在一定风险因素，需加强监控，限制部分业务',
    4: '客户存在重大风险因素，需严格限制业务办理'
  }
  return descs[level] || ''
}

const getSyncStatusType = (status: number) => {
  const option = DataSyncStatusOptions.find(item => item.value === status)
  return option?.color || 'info'
}

const getStatusType = (status: number) => {
  const option = AssessmentStatusOptions.find(item => item.value === status)
  return option?.color || 'info'
}

const getCategoryText = (category: number) => {
  const option = IndicatorCategoryOptions.find(item => item.value === category)
  return option?.label || '-'
}

const getScoreClass = (score: number) => {
  if (score >= 70) return 'score-high'
  if (score >= 50) return 'score-medium'
  if (score >= 30) return 'score-low-medium'
  return 'score-low'
}

const getProgressColor = (ratio: number) => {
  if (ratio >= 0.7) return '#67c23a'
  if (ratio >= 0.5) return '#e6a23c'
  if (ratio >= 0.3) return '#f56c6c'
  return '#f56c6c'
}

watch(() => props.assessmentId, (val) => {
  if (val) {
    fetchDetail()
  }
})

onMounted(() => {
  if (props.assessmentId) {
    fetchDetail()
  }
})
</script>

<style scoped lang="scss">
.detail-drawer {
  padding: 16px;
}

.loading-container {
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.score-card {
  display: flex;
  align-items: center;
  gap: 32px;
  padding: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  margin-bottom: 20px;
  color: #fff;

  .score-info {
    text-align: center;

    .score-value {
      font-size: 48px;
      font-weight: 700;
      line-height: 1;
      margin-bottom: 8px;

      &.score-high {
        color: #67c23a;
      }

      &.score-medium {
        color: #e6a23c;
      }

      &.score-low-medium {
        color: #f56c6c;
      }

      &.score-low {
        color: #f56c6c;
      }
    }

    .score-label {
      font-size: 14px;
      opacity: 0.9;
    }
  }

  .level-info {
    flex: 1;

    .level-tag {
      font-size: 16px;
      padding: 8px 16px;
      margin-bottom: 12px;
    }

    .level-desc {
      font-size: 13px;
      opacity: 0.9;
    }
  }
}

.info-descriptions {
  margin-bottom: 20px;
}

.level-change {
  margin-bottom: 20px;
  padding: 16px;
  background: var(--el-bg-color-page);
  border-radius: 8px;

  .level-change-title {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 12px;
  }

  .level-change-content {
    display: flex;
    align-items: center;
    gap: 12px;

    .arrow-icon {
      font-size: 16px;
      color: var(--el-text-color-secondary);
    }

    .ml-8 {
      margin-left: 8px;
    }
  }

  .block-reason {
    margin-top: 12px;
    padding: 12px;
    background: rgba(245, 108, 108, 0.1);
    border-radius: 6px;
    font-size: 13px;
    color: var(--el-color-danger);
  }
}

.detail-tabs {
  .multi-data-section {
    .data-category {
      margin-bottom: 20px;

      .category-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 12px;
        color: var(--el-color-primary);
      }
    }
  }

  .indicators-section {
    .score-summary {
      display: flex;
      justify-content: space-around;
      padding: 20px;
      background: var(--el-bg-color-page);
      border-radius: 8px;
      margin-top: 20px;

      .summary-item {
        text-align: center;

        .summary-label {
          display: block;
          font-size: 13px;
          color: var(--el-text-color-secondary);
          margin-bottom: 8px;
        }

        .summary-value {
          font-size: 24px;
          font-weight: 700;

          &.text-primary {
            color: var(--el-color-primary);
          }
        }
      }
    }
  }

  .permissions-section {
    .permissions-card {
      padding: 20px;
      background: var(--el-bg-color-page);
      border-radius: 8px;

      .permissions-header {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 16px;
        font-weight: 600;
        margin-bottom: 20px;

        .el-icon {
          font-size: 24px;
        }
      }

      .permissions-title {
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 12px;
      }

      .permissions-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 20px;
      }

      pre {
        margin: 0;
        padding: 12px;
        background: #f5f7fa;
        border-radius: 6px;
        font-size: 12px;
        max-height: 150px;
        overflow-y: auto;
      }
    }

    .empty-state {
      padding: 40px 0;
    }
  }

  .remarks-section {
    .section-title {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 12px;
    }

    .risk-tags,
    .remarks {
      margin-bottom: 24px;
      padding: 16px;
      background: var(--el-bg-color-page);
      border-radius: 8px;
    }

    .tag-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .risk-tag {
      margin: 0;
    }

    .empty-tags {
      padding: 12px 0;
    }

    .remark-content {
      padding: 12px;
      background: #fff;
      border-radius: 6px;
      font-size: 13px;
      line-height: 1.6;
      border: 1px solid var(--el-border-color-lighter);
    }
  }
}

.text-success {
  color: var(--el-color-success);
}

.text-danger {
  color: var(--el-color-danger);
}

.text-primary {
  color: var(--el-color-primary);
}

.ml-8 {
  margin-left: 8px;
}
</style>
