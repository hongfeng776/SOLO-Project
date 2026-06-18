<template>
  <div class="ccb-repayment-trace">
    <CcbPageHeader
      title="还款溯源查询"
      description="资金流向追踪，多维度校验，异常自动复核"
      icon="Search"
    />

    <el-card class="search-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>溯源查询</span>
        </div>
      </template>

      <el-form :model="traceForm" inline class="trace-form">
        <el-form-item label="贷款编号">
          <el-input v-model="traceForm.loan_id" placeholder="请输入贷款ID" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="贷款编号">
          <el-input v-model="traceForm.loan_no" placeholder="请输入贷款编号" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="还款ID">
          <el-input v-model="traceForm.repayment_id" placeholder="请输入还款ID" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="交易流水号">
          <el-input v-model="traceForm.transaction_no" placeholder="请输入交易流水号" clearable style="width: 220px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="doTrace" :loading="tracing">溯源查询</el-button>
          <el-button :icon="Refresh" @click="resetTrace">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <div v-if="traceResult" class="trace-result">
      <div class="check-summary">
        <el-row :gutter="16">
          <el-col :span="6">
            <div class="check-card duplicate" :class="{ 'has-issue': traceResult.duplicate_check.has_duplicate }">
              <div class="check-icon">
                <el-icon><CopyDocument /></el-icon>
              </div>
              <div class="check-info">
                <div class="check-title">重复扣款检测</div>
                <div class="check-value">
                  <span v-if="traceResult.duplicate_check.has_duplicate" class="danger">
                    发现 {{ traceResult.duplicate_check.duplicate_count }} 笔
                  </span>
                  <span v-else class="success">正常</span>
                </div>
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="check-card amount" :class="{ 'has-issue': !traceResult.amount_check.passed }">
              <div class="check-icon">
                <el-icon><Money /></el-icon>
              </div>
              <div class="check-info">
                <div class="check-title">金额异常检测</div>
                <div class="check-value">
                  <span v-if="!traceResult.amount_check.passed" class="danger">
                    {{ traceResult.amount_check.abnormal_amount_count }} 笔异常
                  </span>
                  <span v-else class="success">正常</span>
                </div>
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="check-card bill" :class="{ 'has-issue': !traceResult.bill_match_check.passed }">
              <div class="check-icon">
                <el-icon><Tickets /></el-icon>
              </div>
              <div class="check-info">
                <div class="check-title">账单匹配校验</div>
                <div class="check-value">
                  <span v-if="!traceResult.bill_match_check.passed" class="danger">
                    {{ traceResult.bill_match_check.unmatched_count }} 笔不匹配
                  </span>
                  <span v-else class="success">全部匹配</span>
                </div>
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="check-card consistency" :class="{ 'has-issue': !traceResult.consistency_check.passed }">
              <div class="check-icon">
                <el-icon><DataLine /></el-icon>
              </div>
              <div class="check-info">
                <div class="check-title">数据一致性校验</div>
                <div class="check-value">
                  <span v-if="!traceResult.consistency_check.passed" class="danger">
                    {{ traceResult.consistency_check.inconsistent_count }} 项不一致
                  </span>
                  <span v-else class="success">一致</span>
                </div>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>

      <div v-if="traceResult.abnormal_review.has_abnormal" class="abnormal-alert">
        <el-alert
          :title="`检测到 ${traceResult.abnormal_review.abnormal_count} 条异常记录，${traceResult.abnormal_review.need_review_count} 条需人工复核`"
          type="warning"
          show-icon
          :closable="false"
        >
          <template #default>
            <div class="abnormal-items">
              <div v-for="(item, idx) in traceResult.abnormal_review.abnormal_items.slice(0, 5)" :key="idx" class="abnormal-item">
                <el-icon class="warn-icon"><Warning /></el-icon>
                {{ item }}
              </div>
            </div>
          </template>
        </el-alert>
      </div>

      <el-card class="summary-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span>还款汇总</span>
            <span class="loan-no">{{ traceResult.loan_no }}</span>
          </div>
        </template>

        <el-descriptions :column="4" border size="small">
          <el-descriptions-item label="还款笔数">
            <span class="highlight">{{ traceResult.total_repayment_count }}</span> 笔
          </el-descriptions-item>
          <el-descriptions-item label="还款总额">
            <span class="amount">{{ formatThousands(traceResult.total_repayment_amount) }}</span> 元
          </el-descriptions-item>
          <el-descriptions-item label="已还本金">
            <span class="amount">{{ formatThousands(traceResult.total_principal_paid) }}</span> 元
          </el-descriptions-item>
          <el-descriptions-item label="已还利息">
            <span class="amount">{{ formatThousands(traceResult.total_interest_paid) }}</span> 元
          </el-descriptions-item>
          <el-descriptions-item label="已还违约金">
            <span class="amount penalty">{{ formatThousands(traceResult.total_penalty_paid) }}</span> 元
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <el-card class="records-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span>还款流水记录</span>
            <span class="record-count">共 {{ traceResult.repayment_records.length }} 条</span>
          </div>
        </template>

        <el-table :data="traceResult.repayment_records" border stripe>
          <el-table-column prop="repayment_id" label="还款编号" width="180" fixed="left" />
          <el-table-column prop="period_no" label="期数" width="70" align="center">
            <template #default="{ row }">第{{ row.period_no }}期</template>
          </el-table-column>
          <el-table-column prop="repayment_type_text" label="还款类型" width="100" />
          <el-table-column prop="repayment_channel_text" label="还款渠道" width="100" />
          <el-table-column prop="amount" label="还款金额" width="120" align="right">
            <template #default="{ row }">
              <span class="amount-text">{{ formatThousands(row.amount) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="principal" label="本金" width="110" align="right">
            <template #default="{ row }">{{ formatThousands(row.principal) }}</template>
          </el-table-column>
          <el-table-column prop="interest" label="利息" width="100" align="right">
            <template #default="{ row }">{{ formatThousands(row.interest) }}</template>
          </el-table-column>
          <el-table-column prop="penalty" label="违约金" width="100" align="right">
            <template #default="{ row }">
              <span v-if="row.penalty > 0" class="penalty-text">{{ formatThousands(row.penalty) }}</span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="getRepaymentStatusType(row.status)" size="small">
                {{ row.status_text }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="operator_name" label="操作人" width="90" />
          <el-table-column prop="operation_time" label="操作时间" width="160" />
          <el-table-column prop="fund_flow" label="资金流向" width="180" />
          <el-table-column label="账单匹配" width="90" align="center">
            <template #default="{ row }">
              <el-icon v-if="row.bill_matched === 1" class="icon-success"><CircleCheck /></el-icon>
              <el-icon v-else class="icon-error"><CircleClose /></el-icon>
            </template>
          </el-table-column>
          <el-table-column label="异常" width="70" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.abnormal_flag === 1" type="danger" size="small" effect="dark">异常</el-tag>
              <span v-else class="normal-tag">-</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="90" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="showDetail(row)">详情</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <el-card v-if="hasDetailIssue" class="issues-card" shadow="never">
        <template #header>
          <div class="card-header">
            <el-icon class="header-icon warn"><Warning /></el-icon>
            <span>检测发现的问题</span>
          </div>
        </template>

        <el-tabs v-model="issueTab">
          <el-tab-pane :label="`重复扣款 (${traceResult.duplicate_check.duplicate_records.length})`" name="duplicate">
            <ul v-if="traceResult.duplicate_check.duplicate_records.length > 0" class="issue-list">
              <li v-for="(item, idx) in traceResult.duplicate_check.duplicate_records" :key="idx">
                <el-icon class="issue-icon"><CopyDocument /></el-icon>
                {{ item }}
              </li>
            </ul>
            <el-empty v-else description="暂无重复扣款记录" :image-size="80" />
          </el-tab-pane>
          <el-tab-pane :label="`金额异常 (${traceResult.amount_check.abnormal_items.length})`" name="amount">
            <ul v-if="traceResult.amount_check.abnormal_items.length > 0" class="issue-list">
              <li v-for="(item, idx) in traceResult.amount_check.abnormal_items" :key="idx">
                <el-icon class="issue-icon"><Warning /></el-icon>
                {{ item }}
              </li>
            </ul>
            <el-empty v-else description="暂无金额异常" :image-size="80" />
          </el-tab-pane>
          <el-tab-pane :label="`账单不匹配 (${traceResult.bill_match_check.unmatched_items.length})`" name="bill">
            <ul v-if="traceResult.bill_match_check.unmatched_items.length > 0" class="issue-list">
              <li v-for="(item, idx) in traceResult.bill_match_check.unmatched_items" :key="idx">
                <el-icon class="issue-icon"><Tickets /></el-icon>
                {{ item }}
              </li>
            </ul>
            <el-empty v-else description="全部账单匹配" :image-size="80" />
          </el-tab-pane>
          <el-tab-pane :label="`数据不一致 (${traceResult.consistency_check.inconsistent_items.length})`" name="consistency">
            <ul v-if="traceResult.consistency_check.inconsistent_items.length > 0" class="issue-list">
              <li v-for="(item, idx) in traceResult.consistency_check.inconsistent_items" :key="idx">
                <el-icon class="issue-icon"><DataLine /></el-icon>
                {{ item }}
              </li>
            </ul>
            <el-empty v-else description="数据一致性正常" :image-size="80" />
          </el-tab-pane>
        </el-tabs>
      </el-card>
    </div>

    <el-empty
      v-else-if="!tracing && hasSearched"
      description="暂无溯源数据，请输入查询条件"
      :image-size="120"
    />

    <el-dialog v-model="detailDialogVisible" title="还款详情" width="600px" class="detail-dialog">
      <div v-if="currentRecord" class="detail-content">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="还款编号">{{ currentRecord.repayment_id }}</el-descriptions-item>
          <el-descriptions-item label="交易流水号">{{ currentRecord.transaction_no || '-' }}</el-descriptions-item>
          <el-descriptions-item label="还款类型">{{ currentRecord.repayment_type_text }}</el-descriptions-item>
          <el-descriptions-item label="还款渠道">{{ currentRecord.repayment_channel_text }}</el-descriptions-item>
          <el-descriptions-item label="还款金额">
            <span class="amount-text">{{ formatThousands(currentRecord.amount) }}</span> 元
          </el-descriptions-item>
          <el-descriptions-item label="本金">{{ formatThousands(currentRecord.principal) }} 元</el-descriptions-item>
          <el-descriptions-item label="利息">{{ formatThousands(currentRecord.interest) }} 元</el-descriptions-item>
          <el-descriptions-item label="违约金">{{ formatThousands(currentRecord.penalty) }} 元</el-descriptions-item>
          <el-descriptions-item label="期数">第{{ currentRecord.period_no }}期</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getRepaymentStatusType(currentRecord.status)" size="small">
              {{ currentRecord.status_text }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="扣款账户">{{ currentRecord.account_no || '-' }}</el-descriptions-item>
          <el-descriptions-item label="操作人">{{ currentRecord.operator_name || '系统' }}</el-descriptions-item>
          <el-descriptions-item label="操作时间" :span="2">{{ currentRecord.operation_time }}</el-descriptions-item>
          <el-descriptions-item label="资金流向" :span="2">{{ currentRecord.fund_flow || '-' }}</el-descriptions-item>
          <el-descriptions-item label="账单匹配" :span="2">
            <el-tag v-if="currentRecord.bill_matched === 1" type="success" size="small">
              {{ currentRecord.bill_match_result || '匹配成功' }}
            </el-tag>
            <el-tag v-else type="danger" size="small">
              {{ currentRecord.bill_match_result || '匹配失败' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item v-if="currentRecord.before_balance !== undefined" label="扣款前余额">
            {{ formatThousands(currentRecord.before_balance) }} 元
          </el-descriptions-item>
          <el-descriptions-item v-if="currentRecord.after_balance !== undefined" label="扣款后余额">
            {{ formatThousands(currentRecord.after_balance) }} 元
          </el-descriptions-item>
          <el-descriptions-item label="IP地址" :span="2">{{ currentRecord.ip_address || '-' }}</el-descriptions-item>
        </el-descriptions>

        <div v-if="currentRecord.abnormal_flag === 1" class="abnormal-section">
          <el-alert
            :title="`异常类型：${currentRecord.abnormal_type || '未知'}`"
            type="error"
            :closable="false"
            show-icon
          >
            <template #default>
              <p>{{ currentRecord.abnormal_reason || '暂无详细描述' }}</p>
              <p style="margin-top: 8px;">
                复核状态：
                <el-tag v-if="currentRecord.need_review === 1" type="warning" size="small">待人工复核</el-tag>
                <el-tag v-else type="info" size="small">无需复核</el-tag>
              </p>
            </template>
          </el-alert>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Search,
  Refresh,
  CopyDocument,
  Money,
  Tickets,
  DataLine,
  Warning,
  CircleCheck,
  CircleClose
} from '@element-plus/icons-vue'
import {
  traceRepaymentApi,
  formatThousands,
  getRepaymentStatusType,
  type RepaymentTraceRequest,
  type RepaymentTraceResult,
  type RepaymentLogVO
} from '@/api/loanRepayment'

const tracing = ref(false)
const hasSearched = ref(false)
const traceResult = ref<RepaymentTraceResult | null>(null)
const detailDialogVisible = ref(false)
const currentRecord = ref<RepaymentLogVO | null>(null)
const issueTab = ref('duplicate')

const traceForm = reactive<RepaymentTraceRequest>({
  loan_id: '',
  loan_no: '',
  repayment_id: '',
  transaction_no: ''
})

const hasDetailIssue = computed(() => {
  if (!traceResult.value) return false
  return (
    traceResult.value.duplicate_check.duplicate_records.length > 0 ||
    traceResult.value.amount_check.abnormal_items.length > 0 ||
    traceResult.value.bill_match_check.unmatched_items.length > 0 ||
    traceResult.value.consistency_check.inconsistent_items.length > 0
  )
})

async function doTrace() {
  if (!traceForm.loan_id && !traceForm.loan_no && !traceForm.repayment_id && !traceForm.transaction_no) {
    ElMessage.warning('请输入至少一项查询条件')
    return
  }

  tracing.value = true
  hasSearched.value = true
  try {
    const result = await traceRepaymentApi(traceForm)
    traceResult.value = result

    if (result.abnormal_review.has_abnormal) {
      ElMessage.warning(`检测到异常，${result.abnormal_review.need_review_count} 条需人工复核`)
    } else {
      ElMessage.success('溯源查询完成，数据正常')
    }
  } catch (e: any) {
    ElMessage.error(e.message || '查询失败')
    traceResult.value = null
  } finally {
    tracing.value = false
  }
}

function resetTrace() {
  traceForm.loan_id = ''
  traceForm.loan_no = ''
  traceForm.repayment_id = ''
  traceForm.transaction_no = ''
  traceResult.value = null
  hasSearched.value = false
}

function showDetail(row: RepaymentLogVO) {
  currentRecord.value = row
  detailDialogVisible.value = true
}

onMounted(() => {
})
</script>

<style scoped lang="scss">
.ccb-repayment-trace {
  padding: 16px;

  .search-card {
    margin-bottom: 16px;

    .trace-form {
      margin-bottom: 0;
    }
  }

  .trace-result {
    .check-summary {
      margin-bottom: 16px;

      .check-card {
        display: flex;
        align-items: center;
        padding: 20px;
        background: #fff;
        border-radius: 8px;
        border: 1px solid #e4e7ed;
        transition: all 0.3s ease;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .check-icon {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 16px;
          color: #fff;
          font-size: 22px;
        }

        &.duplicate .check-icon {
          background: linear-gradient(135deg, #e6a23c, #ebb563);
        }

        &.amount .check-icon {
          background: linear-gradient(135deg, #f56c6c, #f78989);
        }

        &.bill .check-icon {
          background: linear-gradient(135deg, #409eff, #66b1ff);
        }

        &.consistency .check-icon {
          background: linear-gradient(135deg, #909399, #a6a9ad);
        }

        &.has-issue {
          border-color: #f56c6c;
          background: #fef0f0;

          .check-icon {
            animation: shake 0.5s ease-in-out;
          }
        }

        .check-info {
          .check-title {
            font-size: 14px;
            color: #606266;
            margin-bottom: 6px;
          }

          .check-value {
            font-size: 18px;
            font-weight: 600;

            .success {
              color: #67c23a;
            }

            .danger {
              color: #f56c6c;
            }
          }
        }
      }
    }

    .abnormal-alert {
      margin-bottom: 16px;

      .abnormal-items {
        margin-top: 8px;

        .abnormal-item {
          display: flex;
          align-items: center;
          padding: 4px 0;
          font-size: 13px;
          color: #606266;

          .warn-icon {
            color: #e6a23c;
            margin-right: 6px;
          }
        }
      }
    }

    .summary-card {
      margin-bottom: 16px;

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .loan-no {
          font-size: 13px;
          color: #909399;
        }
      }

      .highlight {
        font-size: 18px;
        font-weight: 600;
        color: #409eff;
      }

      .amount {
        font-weight: 600;
        color: #303133;

        &.penalty {
          color: #f56c6c;
        }
      }
    }

    .records-card {
      margin-bottom: 16px;

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .record-count {
          font-size: 13px;
          color: #909399;
        }
      }

      .amount-text {
        font-weight: 600;
        color: #303133;
      }

      .penalty-text {
        color: #f56c6c;
        font-weight: 500;
      }

      .icon-success {
        color: #67c23a;
        font-size: 18px;
      }

      .icon-error {
        color: #f56c6c;
        font-size: 18px;
      }

      .normal-tag {
        color: #c0c4cc;
      }
    }

    .issues-card {
      .card-header {
        display: flex;
        align-items: center;
        gap: 8px;

        .header-icon {
          font-size: 18px;

          &.warn {
            color: #e6a23c;
          }
        }
      }

      .issue-list {
        list-style: none;
        padding: 0;
        margin: 0;

        li {
          display: flex;
          align-items: center;
          padding: 10px 12px;
          margin-bottom: 8px;
          background: #fdf6ec;
          border-radius: 4px;
          border-left: 3px solid #e6a23c;
          font-size: 13px;
          color: #606266;

          .issue-icon {
            color: #e6a23c;
            margin-right: 8px;
            flex-shrink: 0;
          }
        }
      }
    }
  }

  .detail-dialog {
    .detail-content {
      .amount-text {
        font-size: 16px;
        font-weight: 700;
        color: #409eff;
      }

      .abnormal-section {
        margin-top: 16px;
      }
    }
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}
</style>
