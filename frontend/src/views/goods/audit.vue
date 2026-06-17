<template>
  <div class="page-container">
    <div class="pro-table audit-manage audit-table">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="待审核" name="pending" />
        <el-tab-pane label="已通过" name="approved" />
        <el-tab-pane label="已驳回" name="rejected" />
        <el-tab-pane label="已冻结" name="frozen" />
        <el-tab-pane label="全部" name="all" />
      </el-tabs>

      <div class="search-section">
        <el-form
          ref="searchFormRef"
          :model="searchForm"
          :inline="true"
          label-width="auto"
          @submit.prevent="handleSearch"
        >
          <el-form-item label="商家ID">
            <el-input v-model="searchForm.merchantId" placeholder="请输入商家ID" clearable />
          </el-form-item>
          <el-form-item label="风险等级">
            <el-select v-model="searchForm.riskLevel" placeholder="请选择" clearable>
              <el-option
                v-for="(item, key) in RiskLevelMap"
                :key="key"
                :label="item.label"
                :value="Number(key)"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="提交时间">
            <el-date-picker
              v-model="searchForm.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>
          <el-form-item label="超时标记">
            <el-select v-model="searchForm.timeoutFlag" placeholder="请选择" clearable>
              <el-option label="已超时" :value="true" />
              <el-option label="未超时" :value="false" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">
              <el-icon><Search /></el-icon>搜索
            </el-button>
            <el-button @click="handleReset">
              <el-icon><Refresh /></el-icon>重置
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <div class="toolbar-section">
        <div class="toolbar-left">
          <el-button type="primary" @click="handleSubmitAudit">
            <el-icon><Upload /></el-icon>提交审核
          </el-button>
          <el-button
            v-if="batchScope.canFreeze"
            type="success"
            :disabled="!selectedRows.length"
            @click="handleBatchApprove"
          >
            <el-icon><CircleCheck /></el-icon>批量通过
          </el-button>
          <el-button
            type="danger"
            :disabled="!selectedRows.length"
            @click="handleBatchReject"
          >
            <el-icon><CircleClose /></el-icon>批量驳回
          </el-button>
          <el-button
            v-if="batchScope.canSupplement"
            type="warning"
            :disabled="!selectedRows.length"
            @click="handleBatchSupplement"
          >
            <el-icon><EditPen /></el-icon>批量补充材料
          </el-button>
        </div>
        <div class="toolbar-right">
          <el-badge :value="timeoutAlertCount" :hidden="timeoutAlertCount === 0" :max="99">
            <el-button @click="handleCheckTimeout" :loading="timeoutChecking">
              <span v-if="timeoutAlertCount > 0" class="timeout-bell">🔔</span>
              超时预警
            </el-button>
          </el-badge>
        </div>
      </div>

      <div v-if="selectedRows.length" class="batch-actions">
        <span class="batch-info">已选择 {{ selectedRows.length }} 项</span>
        <el-button link type="primary" @click="handleClearSelection">取消选择</el-button>
      </div>

      <el-table
        ref="tableRef"
        :data="tableData"
        :loading="loading"
        v-loading="loading"
        stripe
        highlight-current-row
        :row-class-name="getRowClassName"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column type="index" label="序号" width="60" align="center">
          <template #default="{ $index }">
            {{ (pagination.currentPage - 1) * pagination.pageSize + $index + 1 }}
          </template>
        </el-table-column>
        <el-table-column prop="auditNo" label="审核单号" width="160" />
        <el-table-column prop="goodsId" label="商品ID" width="90" align="center" />
        <el-table-column prop="merchantId" label="商家ID" width="90" align="center" />
        <el-table-column prop="riskLevel" label="风险等级" width="100" align="center">
          <template #default="{ row }">
            <el-tag
              :type="RiskLevelMap[row.riskLevel as RiskLevel]?.type"
              class="audit-status-tag"
              :class="{ 'is-updating': updatingRows.has(row.id) }"
            >
              {{ RiskLevelMap[row.riskLevel as RiskLevel]?.label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="merchantCreditScore" label="商家信用分" width="110" align="center" />
        <el-table-column prop="status" label="审核状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag
              :type="AuditStatusMap[row.status]?.type"
              class="audit-status-tag"
              :class="{ 'is-updating': updatingRows.has(row.id) }"
            >
              <span v-if="row.timeoutFlag && row.status !== AuditStatus.APPROVED && row.status !== AuditStatus.FROZEN">⚠️</span>
              {{ AuditStatusMap[row.status]?.label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="submitAt" label="提交时间" width="180" align="center">
          <template #default="{ row }">
            {{ formatDateTime(row.submitAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="timeoutHours" label="时效(h)" width="90" align="center" />
        <el-table-column prop="supplementCount" label="补充次数" width="90" align="center" />
        <el-table-column prop="rejectReasons" label="驳回理由" min-width="180">
          <template #default="{ row }">
            <template v-if="row.rejectReasons && row.rejectReasons.length">
              <el-tooltip
                v-if="row.rejectReasons.join('；').length > 50"
                effect="dark"
                placement="top"
                :show-after="200"
              >
                <template #content>
                  <div v-for="(r, i) in row.rejectReasons" :key="i">{{ i + 1 }}. {{ r }}</div>
                </template>
                <span class="reject-reason-text">{{ row.rejectReasons.join('；').slice(0, 50) }}...</span>
              </el-tooltip>
              <span v-else class="reject-reason-text">{{ row.rejectReasons.join('；') }}</span>
            </template>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="260" fixed="right" align="center">
          <template #default="{ row }">
            <template v-if="abilityMap[row.id]">
              <el-button
                v-if="row.status === AuditStatus.PENDING_INITIAL && abilityMap[row.id].canApprove"
                link type="primary" @click="handleInitialReview(row as AuditMainInfo)"
              >初审</el-button>
              <el-button
                v-if="row.status === AuditStatus.PENDING_FINAL && abilityMap[row.id].canApprove"
                link type="primary" @click="handleFinalReview(row as AuditMainInfo)"
              >复审</el-button>
              <el-button
                v-if="abilityMap[row.id].canFreeze && row.status !== AuditStatus.FROZEN"
                link type="warning" @click="handleFreeze(row as AuditMainInfo)"
              >冻结</el-button>
              <el-button
                v-if="row.status === AuditStatus.FROZEN"
                link type="success" @click="handleUnfreeze(row as AuditMainInfo)"
              >解冻</el-button>
            </template>
            <el-button link type="primary" @click="handleTrace(row as AuditMainInfo)">溯源</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="tableData.length === 0 && !loading" class="empty-state">
        <el-icon class="empty-icon"><DataLine /></el-icon>
        <div class="empty-text">暂无数据</div>
      </div>

      <div v-if="total > 0" class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="handlePageChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <el-dialog
      v-model="preCheckDialogVisible"
      title="提交审核 - 前置校验"
      width="680px"
      :close-on-click-modal="false"
      class="form-dialog"
    >
      <div v-loading="preCheckLoading">
        <el-steps :active="preCheckStep" align-center class="audit-steps">
          <el-step title="信息完整性" :status="getPreCheckStepStatus('info_complete')" />
          <el-step title="资质有效性" :status="getPreCheckStepStatus('qualification')" />
          <el-step title="类目合规" :status="getPreCheckStepStatus('category_compliance')" />
          <el-step title="图片文案" :status="getPreCheckStepStatus('image_text_compliance')" />
        </el-steps>
        <div class="pre-check-detail">
          <template v-for="condition in preCheckResult?.conditions" :key="condition.category">
            <div
              v-if="preCheckStep >= getConditionIndex(condition.category)"
              class="condition-block"
              :class="{ 'is-failed': !condition.passed }"
            >
              <h4>
                <el-icon v-if="condition.passed" class="condition-icon success"><CircleCheck /></el-icon>
                <el-icon v-else class="condition-icon danger"><CircleClose /></el-icon>
                {{ getConditionTitle(condition.category) }}
              </h4>
              <div v-if="!condition.passed && condition.items.length" class="failed-items">
                <div v-for="item in condition.items" :key="item.itemCode" class="failed-item">
                  <el-tag type="danger" size="small">{{ item.itemName }}</el-tag>
                  <span v-if="item.suggestion" class="suggestion">{{ item.suggestion }}</span>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
      <template #footer>
        <el-button @click="preCheckDialogVisible = false">关闭</el-button>
        <el-button
          type="primary"
          :disabled="!preCheckResult?.canSubmit"
          :loading="submitAuditLoading"
          @click="confirmSubmitAudit"
        >
          {{ preCheckResult?.canSubmit ? '确认提交' : '校验未通过' }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="initialReviewVisible"
      title="初审操作"
      width="500px"
      :close-on-click-modal="false"
      class="form-dialog"
    >
      <el-form :model="reviewForm" label-width="80px">
        <el-form-item label="审核结果">
          <el-radio-group v-model="reviewForm.result">
            <el-radio value="pass">通过</el-radio>
            <el-radio value="reject">驳回</el-radio>
            <el-radio value="manual">转人工</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="reviewForm.remark" type="textarea" :rows="3" placeholder="请输入审核备注" />
        </el-form-item>
        <el-form-item v-if="reviewForm.result === 'reject'" label="驳回原因" required>
          <el-input v-model="reviewForm.rejectReasonInput" type="textarea" :rows="2" placeholder="请输入驳回原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="initialReviewVisible = false">取消</el-button>
        <el-button type="primary" :loading="reviewSubmitting" @click="confirmInitialReview">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="finalReviewVisible"
      title="复审操作"
      width="500px"
      :close-on-click-modal="false"
      class="form-dialog"
    >
      <el-form :model="reviewForm" label-width="80px">
        <el-form-item label="审核结果">
          <el-radio-group v-model="reviewForm.result">
            <el-radio value="pass">通过</el-radio>
            <el-radio value="reject">驳回</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="reviewForm.remark" type="textarea" :rows="3" placeholder="请输入审核备注" />
        </el-form-item>
        <el-form-item v-if="reviewForm.result === 'reject'" label="驳回原因" required>
          <el-input v-model="reviewForm.rejectReasonInput" type="textarea" :rows="2" placeholder="请输入驳回原因（必填）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="finalReviewVisible = false">取消</el-button>
        <el-button type="primary" :loading="reviewSubmitting" @click="confirmFinalReview">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="freezeVisible"
      title="冻结审核"
      width="480px"
      :close-on-click-modal="false"
    >
      <el-form :model="freezeForm" label-width="80px">
        <el-form-item label="冻结原因" required>
          <el-input v-model="freezeForm.reason" type="textarea" :rows="3" placeholder="请输入冻结原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="freezeVisible = false">取消</el-button>
        <el-button type="primary" :loading="freezeSubmitting" @click="confirmFreeze">确认冻结</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="batchRejectVisible"
      title="批量驳回"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="batchRejectForm" label-width="80px">
        <el-form-item label="驳回原因" required>
          <el-input v-model="batchRejectForm.rejectReasons" type="textarea" :rows="3" placeholder="请输入驳回原因" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="batchRejectForm.remark" type="textarea" :rows="2" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchRejectVisible = false">取消</el-button>
        <el-button type="primary" :loading="batchSubmitting" @click="confirmBatchReject">确认驳回</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="batchSupplementVisible"
      title="批量补充材料"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="batchSupplementForm" label-width="100px">
        <el-form-item label="补充截止时间" required>
          <el-date-picker
            v-model="batchSupplementForm.deadline"
            type="datetime"
            placeholder="请选择截止时间"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="备注" required>
          <el-input v-model="batchSupplementForm.remark" type="textarea" :rows="3" placeholder="请输入补充材料要求说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchSupplementVisible = false">取消</el-button>
        <el-button type="primary" :loading="batchSubmitting" @click="confirmBatchSupplement">确认发送</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="submitGoodsIdVisible"
      title="提交审核 - 输入商品ID"
      width="400px"
      :close-on-click-modal="false"
    >
      <el-form label-width="80px">
        <el-form-item label="商品ID" required>
          <el-input-number v-model="submitGoodsId" :min="1" style="width: 100%" placeholder="请输入商品ID" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="submitGoodsIdVisible = false">取消</el-button>
        <el-button type="primary" @click="doPreCheck">开始校验</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="traceDialogVisible"
      title="审核全链路溯源"
      width="820px"
      :close-on-click-modal="false"
      class="trace-dialog"
    >
      <div v-loading="traceLoading">
        <el-tabs v-model="traceActiveTab">
          <el-tab-pane label="提交信息" name="submit">
            <el-descriptions v-if="traceData.submitInfo" :column="2" border>
              <el-descriptions-item label="审核单号">{{ traceData.submitInfo.auditNo }}</el-descriptions-item>
              <el-descriptions-item label="提交人ID">{{ traceData.submitInfo.submitterId }}</el-descriptions-item>
              <el-descriptions-item label="提交时间">{{ traceData.submitInfo.submitAt }}</el-descriptions-item>
              <el-descriptions-item label="风险等级">
                <el-tag :type="RiskLevelMap[traceData.submitInfo.riskLevel]?.type">
                  {{ RiskLevelMap[traceData.submitInfo.riskLevel]?.label }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="商家信用分">{{ traceData.submitInfo.merchantCreditScore }}</el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>
          <el-tab-pane label="初审结果" name="initial">
            <template v-if="traceData.initialReview">
              <el-descriptions :column="2" border>
                <el-descriptions-item label="初审人ID">{{ traceData.initialReview.reviewerId }}</el-descriptions-item>
                <el-descriptions-item label="初审时间">{{ traceData.initialReview.reviewedAt }}</el-descriptions-item>
                <el-descriptions-item label="初审结果">
                  <el-tag :type="traceData.initialReview.result === '通过' ? 'success' : 'danger'">
                    {{ traceData.initialReview.result }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="备注">{{ traceData.initialReview.remark || '-' }}</el-descriptions-item>
              </el-descriptions>
            </template>
            <div v-else class="empty-state py-10">
              <div class="empty-text">暂无初审记录</div>
            </div>
          </el-tab-pane>
          <el-tab-pane label="复审结果" name="final">
            <template v-if="traceData.finalReview">
              <el-descriptions :column="2" border>
                <el-descriptions-item label="复审人ID">{{ traceData.finalReview.reviewerId }}</el-descriptions-item>
                <el-descriptions-item label="复审时间">{{ traceData.finalReview.reviewedAt }}</el-descriptions-item>
                <el-descriptions-item label="复审结果">
                  <el-tag :type="traceData.finalReview.result === '通过' ? 'success' : 'danger'">
                    {{ traceData.finalReview.result }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="备注">{{ traceData.finalReview.remark || '-' }}</el-descriptions-item>
              </el-descriptions>
              <h4 v-if="traceData.finalReview.rejectReasons?.length" class="mt-3 mb-2">驳回原因明细</h4>
              <el-table
                v-if="traceData.finalReview.rejectReasons?.length"
                :data="traceData.finalReview.rejectReasons.map((r, i) => ({ index: i + 1, reason: r }))"
                border
                size="small"
              >
                <el-table-column prop="index" label="序号" width="70" align="center" />
                <el-table-column prop="reason" label="驳回原因" />
              </el-table>
            </template>
            <div v-else class="empty-state py-10">
              <div class="empty-text">暂无复审记录</div>
            </div>
          </el-tab-pane>
          <el-tab-pane label="重提记录" name="resubmit">
            <div class="timeline-section">
              <el-timeline v-if="traceData.resubmitTimeline?.length">
                <el-timeline-item
                  v-for="item in traceData.resubmitTimeline"
                  :key="item.id"
                  :timestamp="item.submitAt"
                  placement="top"
                  type="warning"
                >
                  <el-card shadow="hover">
                    <h4>第{{ item.resubmitNo }}次重提</h4>
                    <p><span class="text-muted">修改字段：</span>{{ item.changeFields.join('、') || '无' }}</p>
                    <p><span class="text-muted">补充材料：</span>{{ item.supplementMaterials.join('、') || '无' }}</p>
                    <p class="text-muted text-sm">提交人ID：{{ item.submitterId }}</p>
                  </el-card>
                </el-timeline-item>
              </el-timeline>
              <div v-else class="empty-state py-10">
                <div class="empty-text">暂无重提记录</div>
              </div>
            </div>
          </el-tab-pane>
          <el-tab-pane label="超时预警" name="timeout">
            <el-table
              v-if="traceData.timeoutAlerts?.length"
              :data="traceData.timeoutAlerts"
              border
              size="small"
            >
              <el-table-column prop="timeoutType" label="超时类型" width="120" />
              <el-table-column prop="deadline" label="截止时间" width="180" />
              <el-table-column prop="actualTime" label="实际时间" width="180">
                <template #default="{ row }">{{ row.actualTime || '-' }}</template>
              </el-table-column>
              <el-table-column label="处理状态" width="100" align="center">
                <template #default="{ row }">
                  <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
                    {{ row.status === 1 ? '已处理' : '未处理' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="handleRemark" label="处理备注">
                <template #default="{ row }">{{ row.handleRemark || '-' }}</template>
              </el-table-column>
            </el-table>
            <div v-else class="empty-state py-10">
              <div class="empty-text">暂无超时预警</div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
      <template #footer>
        <el-button type="primary" @click="traceDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search,
  Refresh,
  Upload,
  CircleCheck,
  CircleClose,
  EditPen,
  DataLine
} from '@element-plus/icons-vue'
import { formatDateTime } from '@/utils/date'
import {
  AuditStatusMap,
  RiskLevelMap,
  type RiskLevel,
  type AuditMainInfo,
  type AuditFullTrace,
  type AuditCondition,
  type BatchAuditScope,
  type AuditAbility,
  type PreSubmitResult
} from '@/types/business'
import { AuditStatus } from '@/types/business'
import {
  getAuditList,
  validatePreSubmit,
  submitAudit,
  autoInitialReview,
  executeInitialReview,
  executeFinalReview,
  freezeAudit,
  unfreezeAudit,
  checkAuditTimeout,
  batchApprove,
  batchReject,
  batchRequestSupplement,
  getBatchScope,
  getAbilityMap,
  getAuditFullTrace,
  checkDuplicateSubmit,
  checkAuditTimeliness,
  getTimeoutAlerts,
  getAuditStats,
  type AuditQueryParams
} from '@/api/goodsAudit'

const tableRef = ref()
const loading = ref(false)
const tableData = ref<AuditMainInfo[]>([])
const selectedRows = ref<AuditMainInfo[]>([])
const total = ref(0)
const activeTab = ref('pending')
const updatingRows = ref<Set<number>>(new Set())

const searchForm = reactive<Record<string, any>>({
  merchantId: '',
  riskLevel: '',
  dateRange: null,
  timeoutFlag: ''
})

const pagination = reactive({
  currentPage: 1,
  pageSize: 10
})

const abilityMap = ref<Record<number, AuditAbility>>({})
const batchScope = reactive<BatchAuditScope>({
  scope: 'limited',
  maxRiskLevel: 2,
  canFreeze: false,
  canSupplement: false
})

const timeoutAlertCount = ref(0)
const timeoutChecking = ref(false)
let timeoutTimer: ReturnType<typeof setInterval> | null = null

const submitGoodsIdVisible = ref(false)
const submitGoodsId = ref(1)
const preCheckDialogVisible = ref(false)
const preCheckLoading = ref(false)
const preCheckResult = ref<PreSubmitResult | null>(null)
const preCheckStep = ref(0)
const submitAuditLoading = ref(false)
const currentAuditId = ref<number>(0)

const initialReviewVisible = ref(false)
const finalReviewVisible = ref(false)
const reviewSubmitting = ref(false)
const reviewForm = reactive({
  result: 'pass' as 'pass' | 'reject' | 'manual',
  remark: '',
  rejectReasonInput: ''
})
const currentReviewRow = ref<AuditMainInfo | null>(null)

const freezeVisible = ref(false)
const freezeSubmitting = ref(false)
const freezeForm = reactive({ reason: '' })
const currentFreezeRow = ref<AuditMainInfo | null>(null)

const batchRejectVisible = ref(false)
const batchSubmitting = ref(false)
const batchRejectForm = reactive({ rejectReasons: '', remark: '' })

const batchSupplementVisible = ref(false)
const batchSupplementForm = reactive({ deadline: '', remark: '' })

const traceDialogVisible = ref(false)
const traceActiveTab = ref('submit')
const traceLoading = ref(false)
const traceData = reactive<Partial<AuditFullTrace>>({
  submitInfo: undefined,
  initialReview: undefined,
  finalReview: undefined,
  resubmitTimeline: [],
  timeoutAlerts: []
})

const getTabStatuses = (): number[] | undefined => {
  switch (activeTab.value) {
    case 'pending': return [AuditStatus.PENDING_INITIAL, AuditStatus.PENDING_FINAL]
    case 'approved': return [AuditStatus.APPROVED]
    case 'rejected': return [AuditStatus.INITIAL_REJECTED, AuditStatus.FINAL_REJECTED]
    case 'frozen': return [AuditStatus.FROZEN]
    default: return undefined
  }
}

const fetchData = async () => {
  loading.value = true
  try {
    const statuses = getTabStatuses()
    const params: AuditQueryParams = {
      pageNum: pagination.currentPage,
      pageSize: pagination.pageSize,
      merchantId: searchForm.merchantId || undefined,
      riskLevel: searchForm.riskLevel || undefined,
      timeoutFlag: searchForm.timeoutFlag === '' ? undefined : searchForm.timeoutFlag,
      startTime: searchForm.dateRange?.[0] || undefined,
      endTime: searchForm.dateRange?.[1] || undefined
    } as AuditQueryParams
    if (statuses) {
      (params as any).statusList = statuses
    }
    const res = await getAuditList(params)
    tableData.value = res.data.list
    total.value = res.data.total
    if (tableData.value.length) {
      loadAbilityMap()
    }
  } finally {
    loading.value = false
  }
}

const loadAbilityMap = async () => {
  const ids = tableData.value.map((r) => r.id)
  if (!ids.length) return
  try {
    const res = await getAbilityMap(ids)
    abilityMap.value = res.data
  } catch {}
}

const loadBatchScope = async () => {
  try {
    const res = await getBatchScope()
    Object.assign(batchScope, res.data)
  } catch {}
}

const loadTimeoutAlerts = async () => {
  try {
    const res = await getTimeoutAlerts()
    timeoutAlertCount.value = res.data.length
  } catch {}
}

const handleTabChange = () => {
  pagination.currentPage = 1
  fetchData()
}

const handleSearch = () => {
  pagination.currentPage = 1
  fetchData()
}

const handleReset = () => {
  searchForm.merchantId = ''
  searchForm.riskLevel = ''
  searchForm.dateRange = null
  searchForm.timeoutFlag = ''
  pagination.currentPage = 1
  fetchData()
}

const handlePageChange = () => {
  fetchData()
}

const handleSelectionChange = async (rows: AuditMainInfo[]) => {
  selectedRows.value = rows
}

const handleClearSelection = () => {
  tableRef.value?.clearSelection()
}

const getRowClassName = ({ row }: { row: AuditMainInfo }): string => {
  const classes: string[] = []
  if (selectedRows.value.some((r) => r.id === row.id)) {
    classes.push('checked-row')
  }
  return classes.join(' ')
}

const handleSubmitAudit = () => {
  submitGoodsId.value = 1
  submitGoodsIdVisible.value = true
}

const doPreCheck = async () => {
  if (!submitGoodsId.value) {
    ElMessage.warning('请输入商品ID')
    return
  }
  try {
    const dupRes = await checkDuplicateSubmit(submitGoodsId.value)
    if (dupRes.data.hasDuplicate) {
      await ElMessageBox.alert(
        `该商品存在待审核单（审核单ID: ${dupRes.data.auditId}），请勿重复提交`,
        '重复提交拦截',
        { type: 'warning', confirmButtonText: '我知道了' }
      )
      return
    }
  } catch {}

  submitGoodsIdVisible.value = false
  preCheckLoading.value = true
  preCheckDialogVisible.value = true
  preCheckResult.value = null
  preCheckStep.value = 0

  try {
    const res = await validatePreSubmit(submitGoodsId.value)
    preCheckResult.value = res.data
    animatePreCheckSteps(res.data.conditions)
  } finally {
    preCheckLoading.value = false
  }
}

const animatePreCheckSteps = (conditions: AuditCondition[]) => {
  const order: AuditCondition['category'][] = [
    'info_complete', 'qualification', 'category_compliance', 'image_text_compliance'
  ]
  let step = 0
  const timer = setInterval(() => {
    step++
    preCheckStep.value = step
    if (step >= order.length) {
      clearInterval(timer)
    }
  }, 400)
}

const getPreCheckStepStatus = (category: AuditCondition['category']): string => {
  if (!preCheckResult.value) return 'wait'
  const condition = preCheckResult.value.conditions.find((c) => c.category === category)
  if (!condition) return 'wait'
  const idx = getConditionIndex(category)
  if (preCheckStep.value < idx) return 'wait'
  return condition.passed ? 'success' : 'error'
}

const getConditionIndex = (category: AuditCondition['category']): number => {
  const order: AuditCondition['category'][] = [
    'info_complete', 'qualification', 'category_compliance', 'image_text_compliance'
  ]
  return order.indexOf(category)
}

const getConditionTitle = (category: AuditCondition['category']): string => {
  const map: Record<string, string> = {
    info_complete: '信息完整性',
    qualification: '资质有效性',
    category_compliance: '类目合规',
    image_text_compliance: '图片文案合规'
  }
  return map[category] || category
}

const confirmSubmitAudit = async () => {
  if (!submitGoodsId.value) return
  submitAuditLoading.value = true
  try {
    const res = await submitAudit(submitGoodsId.value)
    currentAuditId.value = res.data.id
    const autoRes = await autoInitialReview(res.data.id)
    if (autoRes.data.skipped) {
      ElMessage.success('低风险商品已自动通过初审，进入待复审')
    } else {
      ElMessage.success('审核提交成功，等待初审')
    }
    preCheckDialogVisible.value = false
    fetchData()
  } finally {
    submitAuditLoading.value = false
  }
}

const handleInitialReview = (row: AuditMainInfo) => {
  currentReviewRow.value = row
  reviewForm.result = 'pass'
  reviewForm.remark = ''
  reviewForm.rejectReasonInput = ''
  initialReviewVisible.value = true
}

const confirmInitialReview = async () => {
  if (!currentReviewRow.value) return
  if (reviewForm.result === 'reject' && !reviewForm.rejectReasonInput.trim()) {
    ElMessage.warning('请输入驳回原因')
    return
  }
  reviewSubmitting.value = true
  try {
    const data = {
      auditId: currentReviewRow.value.id,
      result: reviewForm.result,
      remark: reviewForm.remark,
      rejectReasons: reviewForm.result === 'reject' ? [reviewForm.rejectReasonInput] : undefined
    }
    await executeInitialReview(data)
    if (reviewForm.result === 'pass') {
      ElMessage({ message: '初审通过，商品暂不开放展示', type: 'success' })
    } else if (reviewForm.result === 'reject') {
      ElMessage({ message: '初审驳回，商家信用分-5', type: 'error' })
    } else {
      ElMessage({ message: '已转人工处理', type: 'info' })
    }
    animateRowUpdate(currentReviewRow.value.id)
    initialReviewVisible.value = false
    fetchData()
  } finally {
    reviewSubmitting.value = false
  }
}

const handleFinalReview = (row: AuditMainInfo) => {
  currentReviewRow.value = row
  reviewForm.result = 'pass'
  reviewForm.remark = ''
  reviewForm.rejectReasonInput = ''
  finalReviewVisible.value = true
}

const confirmFinalReview = async () => {
  if (!currentReviewRow.value) return
  if (reviewForm.result === 'reject' && !reviewForm.rejectReasonInput.trim()) {
    ElMessage.warning('驳回时必须填写驳回原因')
    return
  }
  reviewSubmitting.value = true
  try {
    const data = {
      auditId: currentReviewRow.value.id,
      result: reviewForm.result,
      remark: reviewForm.remark,
      rejectReasons: reviewForm.result === 'reject' ? [reviewForm.rejectReasonInput] : undefined
    }
    await executeFinalReview(data)
    if (reviewForm.result === 'pass') {
      ElMessage({ message: '复审通过，商品已开放前台展示，商家信用分+2', type: 'success' })
    } else {
      ElMessage({ message: '复审驳回，商家信用分-10', type: 'error' })
    }
    animateRowUpdate(currentReviewRow.value.id)
    finalReviewVisible.value = false
    fetchData()
  } finally {
    reviewSubmitting.value = false
  }
}

const handleFreeze = (row: AuditMainInfo) => {
  currentFreezeRow.value = row
  freezeForm.reason = ''
  freezeVisible.value = true
}

const confirmFreeze = async () => {
  if (!currentFreezeRow.value) return
  if (!freezeForm.reason.trim()) {
    ElMessage.warning('请输入冻结原因')
    return
  }
  freezeSubmitting.value = true
  try {
    await freezeAudit(currentFreezeRow.value.id, freezeForm.reason)
    ElMessage.success('审核已冻结')
    animateRowUpdate(currentFreezeRow.value.id)
    freezeVisible.value = false
    fetchData()
  } finally {
    freezeSubmitting.value = false
  }
}

const handleUnfreeze = async (row: AuditMainInfo) => {
  try {
    await ElMessageBox.confirm('确定要解冻该审核单吗？', '解冻确认', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
    await unfreezeAudit(row.id)
    ElMessage.success('审核已解冻')
    animateRowUpdate(row.id)
    fetchData()
  } catch {}
}

const handleBatchApprove = async () => {
  if (!selectedRows.value.length) return
  try {
    await ElMessageBox.confirm(
      `确定要批量通过选中的 ${selectedRows.value.length} 条审核吗？`,
      '批量通过确认',
      { type: 'warning', confirmButtonText: '确定', cancelButtonText: '取消' }
    )
    const ids = selectedRows.value.map((r) => r.id)
    const res = await batchApprove({ auditIds: ids })
    const { successCount, failCount } = res.data
    ElMessage.success(`批量通过完成：成功${successCount}条/失败${failCount}条`)
    handleClearSelection()
    fetchData()
  } catch {}
}

const handleBatchReject = () => {
  batchRejectForm.rejectReasons = ''
  batchRejectForm.remark = ''
  batchRejectVisible.value = true
}

const confirmBatchReject = async () => {
  if (!batchRejectForm.rejectReasons.trim()) {
    ElMessage.warning('请输入驳回原因')
    return
  }
  batchSubmitting.value = true
  try {
    const ids = selectedRows.value.map((r) => r.id)
    const res = await batchReject({
      auditIds: ids,
      result: 'reject',
      rejectReasons: [batchRejectForm.rejectReasons],
      remark: batchRejectForm.remark
    })
    const { successCount, failCount } = res.data
    ElMessage.success(`批量驳回完成：成功${successCount}条/失败${failCount}条`)
    batchRejectVisible.value = false
    handleClearSelection()
    fetchData()
  } finally {
    batchSubmitting.value = false
  }
}

const handleBatchSupplement = () => {
  batchSupplementForm.deadline = ''
  batchSupplementForm.remark = ''
  batchSupplementVisible.value = true
}

const confirmBatchSupplement = async () => {
  if (!batchSupplementForm.deadline) {
    ElMessage.warning('请选择补充截止时间')
    return
  }
  if (!batchSupplementForm.remark.trim()) {
    ElMessage.warning('请输入备注说明')
    return
  }
  batchSubmitting.value = true
  try {
    const ids = selectedRows.value.map((r) => r.id)
    const res = await batchRequestSupplement({
      auditIds: ids,
      deadline: batchSupplementForm.deadline,
      remark: batchSupplementForm.remark
    })
    const { successCount, failCount } = res.data
    ElMessage.success(`批量补充材料请求已发送：成功${successCount}条/失败${failCount}条`)
    batchSupplementVisible.value = false
    handleClearSelection()
    fetchData()
  } finally {
    batchSubmitting.value = false
  }
}

const handleCheckTimeout = async () => {
  timeoutChecking.value = true
  try {
    await checkAuditTimeout()
    await loadTimeoutAlerts()
    ElMessage.info(`当前超时预警：${timeoutAlertCount.value}条`)
    fetchData()
  } finally {
    timeoutChecking.value = false
  }
}

const handleTrace = async (row: AuditMainInfo) => {
  traceActiveTab.value = 'submit'
  traceDialogVisible.value = true
  traceLoading.value = true
  Object.assign(traceData, {
    submitInfo: undefined,
    initialReview: undefined,
    finalReview: undefined,
    resubmitTimeline: [],
    timeoutAlerts: []
  })

  try {
    const [traceRes] = await Promise.all([
      getAuditFullTrace(row.id),
      checkAuditTimeliness(row.id).catch(() => null)
    ])
    Object.assign(traceData, traceRes.data)
  } finally {
    traceLoading.value = false
  }
}

const animateRowUpdate = (id: number) => {
  updatingRows.value.add(id)
  setTimeout(() => {
    updatingRows.value.delete(id)
  }, 500)
}

onMounted(() => {
  fetchData()
  loadBatchScope()
  loadTimeoutAlerts()
  timeoutTimer = setInterval(() => {
    loadTimeoutAlerts()
  }, 60000)
})

onUnmounted(() => {
  if (timeoutTimer) {
    clearInterval(timeoutTimer)
    timeoutTimer = null
  }
})
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.audit-manage {
  background: #fff;
  border-radius: $radius-md;
  padding: $spacing-base;
  box-shadow: $shadow-light;

  .search-section {
    margin-bottom: $spacing-base;
    padding-bottom: $spacing-base;
    border-bottom: 1px solid $border-color-lighter;
  }

  .toolbar-section {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: $spacing-base;

    .toolbar-left {
      display: flex;
      align-items: center;
      gap: $spacing-sm;
    }

    .toolbar-right {
      display: flex;
      align-items: center;
      gap: $spacing-sm;
    }
  }

  .pagination-wrapper {
    margin-top: $spacing-base;
    display: flex;
    justify-content: flex-end;
  }
}

.pre-check-detail {
  margin-top: $spacing-lg;
}

.condition-block {
  padding: $spacing-base;
  margin-bottom: $spacing-sm;
  border-radius: $radius-base;
  background: #f0f9eb;

  &.is-failed {
    background: #fef0f0;
  }

  h4 {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: $spacing-sm;
  }

  .condition-icon {
    font-size: 18px;

    &.success { color: $success-color; }
    &.danger { color: $danger-color; }
  }
}

.failed-items {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-left: 24px;
}

.failed-item {
  display: flex;
  align-items: center;
  gap: 8px;

  .suggestion {
    font-size: 12px;
    color: $warning-color;
  }
}

.reject-reason-text {
  color: $danger-color;
  font-size: 13px;
}

.mt-3 { margin-top: 12px; }
.mb-2 { margin-bottom: 8px; }
.py-10 { padding-top: 40px; padding-bottom: 40px; }
.text-muted { color: #909399; }
.text-sm { font-size: 12px; }
</style>
