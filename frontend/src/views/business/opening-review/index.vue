<template>
  <div class="ccb-business-opening-review">
    <CcbPageHeader
      title="开户审核工作台"
      description="个人/对公账户开户三级审核与管理"
      icon="CircleCheck"
    />

    <CcbSearchForm v-model="searchForm" @search="handleSearch" @reset="handleReset">
      <el-form-item label="渠道" prop="channelCode">
        <el-select v-model="searchForm.channelCode" placeholder="请选择渠道" clearable>
          <el-option label="柜面" value="counter" />
          <el-option label="手机银行" value="mobile" />
          <el-option label="网上银行" value="ebank" />
          <el-option label="智慧柜员" value="smart" />
          <el-option label="POS终端" value="pos" />
        </el-select>
      </el-form-item>
      <el-form-item label="账户类型" prop="accountType">
        <el-select v-model="searchForm.accountType" placeholder="请选择账户类型" clearable>
          <el-option v-for="(t, k) in accountTypeOptions" :key="k" :label="t" :value="Number(k)" />
        </el-select>
      </el-form-item>
      <el-form-item label="审核阶段" prop="reviewStage">
        <el-select v-model="searchForm.reviewStage" placeholder="请选择审核阶段" clearable>
          <el-option v-for="(t, k) in stageOptions" :key="k" :label="t" :value="Number(k)" />
        </el-select>
      </el-form-item>
      <el-form-item label="开户类型" prop="openingType">
        <el-select v-model="searchForm.openingType" placeholder="请选择开户类型" clearable>
          <el-option label="个人开户" :value="1" />
          <el-option label="对公开户" :value="2" />
        </el-select>
      </el-form-item>
      <el-form-item label="提交时间" prop="timeRange">
        <el-date-picker
          v-model="searchForm.timeRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
        />
      </el-form-item>
      <el-form-item label="关键词" prop="keyword">
        <el-input v-model="searchForm.keyword" placeholder="流水号/客户名/证件号" clearable />
      </el-form-item>
    </CcbSearchForm>

    <div class="stats-cards">
      <div class="stat-card pending" @click="quickFilter(0)">
        <div class="stat-icon"><el-icon><Clock /></el-icon></div>
        <div class="stat-info">
          <div class="stat-num">{{ stats.pending }}</div>
          <div class="stat-label">待审核</div>
        </div>
      </div>
      <div class="stat-card in-review" @click="quickFilter(1)">
        <div class="stat-icon"><el-icon><Loading /></el-icon></div>
        <div class="stat-info">
          <div class="stat-num">{{ stats.inReview }}</div>
          <div class="stat-label">审核中</div>
        </div>
      </div>
      <div class="stat-card passed" @click="quickFilter(4)">
        <div class="stat-icon"><el-icon><CircleCheckFilled /></el-icon></div>
        <div class="stat-info">
          <div class="stat-num">{{ stats.passed }}</div>
          <div class="stat-label">已通过</div>
        </div>
      </div>
      <div class="stat-card rejected" @click="quickFilter(5)">
        <div class="stat-icon"><el-icon><CircleCloseFilled /></el-icon></div>
        <div class="stat-info">
          <div class="stat-num">{{ stats.rejected }}</div>
          <div class="stat-label">已驳回</div>
        </div>
      </div>
    </div>

    <div class="ccb-table-toolbar">
      <div class="ccb-table-toolbar-left">
        <el-button
          v-if="hasRole(['admin', 'manager'])"
          type="success"
          :icon="Check"
          :disabled="selectedRows.length === 0"
          @click="handleBatchApprove"
        >
          <span class="ripple-btn" v-ripple>批量通过</span>
        </el-button>
        <el-button
          v-if="hasRole(['admin', 'manager'])"
          type="danger"
          :icon="Close"
          :disabled="selectedRows.length === 0"
          @click="handleBatchReject"
        >
          <span class="ripple-btn" v-ripple>批量驳回</span>
        </el-button>
        <el-button
          v-if="hasPermission('opening:review:cancel')"
          type="warning"
          :icon="Warning"
          :disabled="selectedRows.length === 0"
          @click="handleBatchCancel"
        >
          <span class="ripple-btn" v-ripple>批量取消</span>
        </el-button>
      </div>
      <div class="ccb-table-toolbar-right">
        <el-button :icon="Refresh" circle @click="fetchData">
          <span v-ripple />
        </el-button>
      </div>
    </div>

    <CcbTable
      v-model:page="pageParams.page"
      v-model:pageSize="pageParams.pageSize"
      :loading="loading"
      :data="tableData"
      :total="total"
      :show-selection="true"
      :show-index="true"
      :highlight-current-row="true"
      row-class-name="review-row"
      @selection-change="handleSelectionChange"
      @row-click="handleRowClick"
      @change="handlePageChange"
    >
      <el-table-column type="selection" width="50" resizable />
      <el-table-column prop="openingNo" label="流水号" width="180" resizable show-overflow-tooltip />
      <el-table-column prop="openingType" label="开户类型" width="100" resizable>
        <template #default="{ row }">
          <el-tag :type="row.openingType === 1 ? 'primary' : 'success'" effect="light" size="small">
            {{ OpeningTypeText[row.openingType] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="customerName" label="客户名称" width="140" resizable show-overflow-tooltip />
      <el-table-column prop="idCardNo" label="证件号" width="180" resizable show-overflow-tooltip />
      <el-table-column prop="accountTypeText" label="账户类型" width="120" resizable />
      <el-table-column prop="channelCode" label="渠道" width="90" resizable>
        <template #default="{ row }">{{ ChannelText[row.channelCode] || row.channelCode }}</template>
      </el-table-column>
      <el-table-column prop="riskLevelText" label="风险等级" width="90" resizable />
      <el-table-column prop="submitTime" label="提交时间" width="160" resizable />
      <el-table-column prop="submitterName" label="提交人" width="90" resizable />
      <el-table-column prop="reviewStage" label="审核阶段" width="100" resizable>
        <template #default="{ row }">
          <el-tag :type="ReviewStageType[row.reviewStage] || 'info'" effect="light" size="small">
            {{ row.reviewStageText || ReviewStageText[row.reviewStage] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="missingMaterials" label="缺失资料" width="90" align="center" resizable>
        <template #default="{ row }">
          <el-tooltip
            v-if="row.missingMaterials && row.missingMaterials.length > 0"
            effect="dark"
            placement="top"
          >
            <template #content>
              <div class="missing-tooltip">
                <div class="missing-title">缺失资料清单：</div>
                <div v-for="(item, i) in row.missingMaterials" :key="i" class="missing-item">
                  <el-icon><WarningFilled /></el-icon>
                  <span>{{ item }}</span>
                </div>
              </div>
            </template>
            <el-badge :value="row.missingMaterials.length" class="missing-badge" />
          </el-tooltip>
          <span v-else class="no-missing">-</span>
        </template>
      </el-table-column>
      <el-table-column prop="hasConflict" label="冲突" width="60" align="center" resizable>
        <template #default="{ row }">
          <el-tooltip
            v-if="row.hasConflict === 1"
            effect="dark"
            content="检测到信息冲突，请重点审核"
            placement="top"
          >
            <el-icon class="conflict-icon"><Warning /></el-icon>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column prop="currentLevel" label="当前级别" width="80" resizable>
        <template #default="{ row }">
          {{ row.reviewStage === 0 || row.reviewStage === 5 || row.reviewStage === 6
            ? '-'
            : ReviewLevelText[row.currentLevel] || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right" resizable>
        <template #default="{ row }">
          <el-button
            type="primary"
            link
            size="small"
            :disabled="row.reviewStage === 4 || row.reviewStage === 5 || row.reviewStage === 6"
            @click.stop="handleOpenReview(row)"
          >
            审核
          </el-button>
          <el-button type="info" link size="small" @click.stop="handleViewDetail(row)">详情</el-button>
        </template>
      </el-table-column>
    </CcbTable>

    <el-drawer
      v-model="drawerVisible"
      :title="drawerTitle"
      size="720px"
      :close-on-click-modal="false"
      destroy-on-close
      class="review-drawer"
    >
      <el-tabs v-model="activeTab" class="drawer-tabs">
        <el-tab-pane label="客户基础信息" name="basic">
          <div v-if="reviewDetail.basicInfo" class="basic-info-panel">
            <el-descriptions :column="2" border size="default">
              <el-descriptions-item
                v-for="(value, key) in displayBasicInfo"
                :key="key"
                :label="getBasicInfoLabel(key as string)"
              >
                {{ formatBasicInfoValue(key as string, value) }}
              </el-descriptions-item>
            </el-descriptions>
          </div>
          <el-empty v-else description="暂无基础信息" />
        </el-tab-pane>

        <el-tab-pane label="资料清单" name="materials">
          <el-table
            :data="reviewDetail.materialsList || []"
            border
            stripe
            :row-class-name="getMaterialRowClass"
            class="materials-table"
          >
            <el-table-column type="index" label="序号" width="60" />
            <el-table-column prop="name" label="资料名称" min-width="200" />
            <el-table-column prop="required" label="是否必需" width="90" align="center">
              <template #default="{ row }">
                <el-tag :type="row.required === 1 ? 'danger' : 'info'" size="small">
                  {{ row.required === 1 ? '必需' : '可选' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="provided" label="是否提供" width="90" align="center">
              <template #default="{ row }">
                <el-icon :class="row.provided === 1 ? 'status-ok' : 'status-fail'">
                  <CircleCheckFilled v-if="row.provided === 1" />
                  <CircleCloseFilled v-else />
                </el-icon>
              </template>
            </el-table-column>
            <el-table-column prop="passed" label="验真结果" width="90" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.provided === 1" :type="row.passed === 1 ? 'success' : 'danger'" size="small">
                  {{ row.passed === 1 ? '通过' : '未通过' }}
                </el-tag>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column prop="message" label="备注说明" min-width="180" show-overflow-tooltip />
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="历史审核日志" name="logs">
          <el-timeline v-if="reviewDetail.reviewLogs && reviewDetail.reviewLogs.length > 0">
            <el-timeline-item
              v-for="(log, idx) in reviewDetail.reviewLogs"
              :key="log.id"
              :timestamp="log.reviewTime"
              :type="getLogTimelineType(log.reviewResult)"
              :hollow="idx === reviewDetail.reviewLogs.length - 1"
            >
              <el-card class="log-card" shadow="never">
                <div class="log-header">
                  <el-tag :type="getLogTagType(log.reviewResult)" effect="dark">
                    {{ log.reviewResultText }}
                  </el-tag>
                  <el-tag type="primary" effect="plain" size="small">
                    {{ log.reviewLevelText }}
                  </el-tag>
                  <span class="log-reviewer">{{ log.reviewerName }}</span>
                </div>
                <div class="log-body">
                  <div v-if="log.reviewComment" class="log-item">
                    <span class="log-label">审核意见：</span>
                    <span>{{ log.reviewComment }}</span>
                  </div>
                  <div v-if="log.rejectReason" class="log-item">
                    <span class="log-label">驳回原因：</span>
                    <el-tag type="danger" effect="plain" size="small">
                      {{ RejectReasonOptions[log.rejectReason] || log.rejectReason }}
                    </el-tag>
                  </div>
                  <div v-if="log.rejectDetails" class="log-item">
                    <span class="log-label">详细说明：</span>
                    <span>{{ log.rejectDetails }}</span>
                  </div>
                  <div v-if="log.supportingFiles" class="log-item">
                    <span class="log-label">佐证文件：</span>
                    <el-link
                      v-for="(f, i) in parseSupportingFiles(log.supportingFiles)"
                      :key="i"
                      type="primary"
                      :href="f"
                      target="_blank"
                      style="margin-right: 8px"
                    >
                      文件{{ i + 1 }}
                    </el-link>
                  </div>
                </div>
              </el-card>
            </el-timeline-item>
          </el-timeline>
          <el-empty v-else description="暂无审核日志" />
        </el-tab-pane>

        <el-tab-pane label="预审结果" name="precheck">
          <div v-if="reviewDetail.precheckResult" class="precheck-panel">
            <el-alert
              :title="reviewDetail.precheckResult.canEnter ? '预审通过，可进入人工审核流程' : '预审未通过'"
              :type="reviewDetail.precheckResult.canEnter ? 'success' : 'error'"
              :closable="false"
              show-icon
              class="precheck-alert"
            />
            <div v-if="reviewDetail.precheckResult.checklist && reviewDetail.precheckResult.checklist.length > 0" class="precheck-list">
              <div class="precheck-list-title">预审检查项：</div>
              <div
                v-for="(item, i) in reviewDetail.precheckResult.checklist"
                :key="i"
                class="precheck-item"
                :class="item.passed ? 'passed' : 'failed'"
              >
                <el-icon>
                  <CircleCheckFilled v-if="item.passed" />
                  <CircleCloseFilled v-else />
                </el-icon>
                <span class="precheck-item-name">{{ item.name }}</span>
                <span class="precheck-item-msg">{{ item.message }}</span>
              </div>
            </div>
            <div v-if="reviewDetail.precheckResult.reasons && reviewDetail.precheckResult.reasons.length > 0" class="precheck-reasons">
              <div class="precheck-reasons-title">未通过原因：</div>
              <el-alert
                v-for="(reason, i) in reviewDetail.precheckResult.reasons"
                :key="i"
                type="error"
                :closable="false"
                class="reason-alert"
                style="margin-bottom: 8px"
              >
                {{ reason }}
              </el-alert>
            </div>
          </div>
          <el-empty v-else description="暂无预审结果" />
        </el-tab-pane>
      </el-tabs>

      <template #footer>
        <div class="drawer-footer">
          <el-tabs v-model="currentLevel" class="level-tabs" tab-position="left">
            <el-tab-pane
              label="初审"
              :name="String(ReviewLevel.FIRST)"
              :disabled="!canReviewAtLevel(ReviewLevel.FIRST)"
            />
            <el-tab-pane
              label="复审"
              :name="String(ReviewLevel.SECOND)"
              :disabled="!canReviewAtLevel(ReviewLevel.SECOND)"
            />
            <el-tab-pane
              label="终审"
              :name="String(ReviewLevel.FINAL)"
              :disabled="!canReviewAtLevel(ReviewLevel.FINAL)"
            />
          </el-tabs>
          <div class="footer-actions">
            <el-button
              type="primary"
              :icon="Check"
              class="btn-click-feedback"
              :loading="submitLocked"
              :disabled="!canApprove"
              @click="handleApprove"
            >
              <span class="ripple-btn" v-ripple>通过</span>
            </el-button>
            <el-button
              type="danger"
              :icon="Close"
              class="btn-click-feedback"
              :disabled="!canReject"
              @click="openRejectDialog"
            >
              <span class="ripple-btn" v-ripple>驳回</span>
            </el-button>
            <el-button
              type="warning"
              :icon="Warning"
              class="btn-click-feedback"
              :disabled="!canCancel"
              @click="handleCancelReview"
            >
              <span class="ripple-btn" v-ripple>取消</span>
            </el-button>
            <el-button @click="drawerVisible = false">关闭</el-button>
          </div>
        </div>
      </template>
    </el-drawer>

    <el-dialog
      v-model="rejectDialogVisible"
      title="审核驳回"
      width="560px"
      class="reject-dialog scale-fade-dialog"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form
        ref="rejectFormRef"
        :model="rejectForm"
        :rules="rejectRules"
        label-width="100px"
        class="ccb-form focus-glow-form"
      >
        <el-form-item label="驳回原因" prop="rejectReason">
          <el-select v-model="rejectForm.rejectReason" placeholder="请选择驳回原因" style="width: 100%">
            <el-option
              v-for="(label, value) in RejectReasonOptions"
              :key="value"
              :label="label"
              :value="value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="详细说明" prop="rejectDetails">
          <el-input
            v-model="rejectForm.rejectDetails"
            type="textarea"
            :rows="4"
            placeholder="请输入驳回的详细说明，便于后续整改参考"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="佐证文件" prop="supportingFiles">
          <el-upload
            v-model:file-list="rejectFileList"
            action="#"
            :auto-upload="false"
            multiple
            :limit="5"
            list-type="picture-card"
            :on-preview="handleFilePreview"
            :on-remove="handleFileRemove"
            :on-change="handleFileChange"
            class="upload-area"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
          <div class="upload-tip">支持 jpg/png/pdf 格式，最多5个文件，单个不超过10MB</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button
          type="danger"
          :loading="submitLocked"
          class="btn-click-feedback"
          @click="submitReject"
        >
          确认驳回
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Check, Close, Warning, Refresh, Clock, Loading,
  CircleCheckFilled, CircleCloseFilled, WarningFilled,
  Plus, CircleCheck, Search
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules, type UploadFile, ElUpload } from 'element-plus'
import {
  getReviewListApi, getReviewDetailApi, submitReviewApi, batchReviewApi,
  preCheckReviewApi,
  OpeningTypeText, ReviewStageText, ReviewStageType,
  ReviewLevelText, ReviewLevel, ReviewResult,
  RejectReasonOptions,
  type OpeningReviewItem, type OpeningReviewDetail, type ReviewSubmitForm,
  type BatchReviewForm, type OpeningReviewQueryParams
} from '@api/openingReview'

const ChannelText: Record<string, string> = {
  counter: '柜面',
  mobile: '手机银行',
  ebank: '网上银行',
  smart: '智慧柜员',
  pos: 'POS终端'
}

const router = useRouter()
const loading = ref<boolean>(false)
const tableData = ref<OpeningReviewItem[]>([])
const total = ref<number>(0)
const selectedRows = ref<OpeningReviewItem[]>([])
const currentRow = ref<OpeningReviewItem | null>(null)

const searchForm = reactive<OpeningReviewQueryParams & { timeRange?: string[] }>({
  channelCode: '',
  accountType: null as unknown as number,
  reviewStage: null as unknown as number,
  openingType: null as unknown as number,
  keyword: '',
  timeRange: [] as string[]
})

const pageParams = reactive({
  page: 1,
  pageSize: 10
})

const stats = reactive({
  pending: 0,
  inReview: 0,
  passed: 0,
  rejected: 0
})

const accountTypeOptions: Record<number, string> = {
  1: '基本存款账户',
  2: '一般存款账户',
  3: '专用存款账户',
  4: '临时存款账户',
  11: '个人结算账户',
  12: '个人储蓄账户'
}

const stageOptions: Record<number, string> = { ...ReviewStageText }

const drawerVisible = ref(false)
const drawerTitle = ref('开户审核详情')
const activeTab = ref('basic')
const currentLevel = ref(String(ReviewLevel.FIRST))
const reviewDetail = ref<OpeningReviewDetail>({
  basicInfo: {},
  materialsList: [],
  precheckResult: null,
  reviewLogs: []
})
const currentReviewRow = ref<OpeningReviewItem | null>(null)
const submitLocked = ref(false)

const rejectDialogVisible = ref(false)
const rejectFormRef = ref<FormInstance>()
const rejectFileList = ref<UploadFile[]>([])
const rejectForm = reactive({
  rejectReason: '',
  rejectDetails: '',
  supportingFiles: ''
})

const rejectRules: FormRules = {
  rejectReason: [{ required: true, message: '请选择驳回原因', trigger: 'change' }],
  rejectDetails: [{ required: true, message: '请输入详细说明', trigger: 'blur' }]
}

const userInfo = computed(() => {
  try {
    const store = (window as any).__USER_STORE__ || {}
    return store.userInfo || JSON.parse(localStorage.getItem('userInfo') || '{}')
  } catch { return {} }
})

const userRoles = computed<string[]>(() => userInfo.value.roles || [])
const userPermissions = computed<string[]>(() => userInfo.value.permissions || [])

const hasRole = (roles: string[]) => roles.some(r => userRoles.value.includes(r))
const hasPermission = (perm: string) => userPermissions.value.includes(perm) || hasRole(['admin'])

const canReviewAtLevel = (level: number) => {
  if (!currentReviewRow.value) return false
  const row = currentReviewRow.value
  if (row.reviewStage === 4 || row.reviewStage === 5 || row.reviewStage === 6) return false
  if (Number(currentLevel.value) !== level) return false
  if (level === ReviewLevel.FIRST) return hasRole(['admin', 'manager', 'operator', 'auditor'])
  if (level === ReviewLevel.SECOND) return hasRole(['admin', 'manager', 'auditor'])
  if (level === ReviewLevel.FINAL) return hasRole(['admin', 'manager'])
  return false
}

const canApprove = computed(() => canReviewAtLevel(Number(currentLevel.value)) && !submitLocked.value)
const canReject = computed(() => canReviewAtLevel(Number(currentLevel.value)) && !submitLocked.value)
const canCancel = computed(() => {
  if (!currentReviewRow.value) return false
  const stage = currentReviewRow.value.reviewStage
  return (stage === 0 || stage === 1 || stage === 2 || stage === 3) &&
    hasPermission('opening:review:cancel') && !submitLocked.value
})

const displayBasicInfo = computed(() => {
  const info = reviewDetail.value.basicInfo || {}
  const keys = [
    'openingNo', 'openingType', 'customerName', 'idCardNo', 'accountTypeText',
    'enterpriseName', 'creditCode', 'legalRepresentative', 'legalIdCardNo',
    'channelCode', 'riskLevelText', 'submitTime', 'submitterName', 'submitOrgName',
    'mobile', 'address', 'industryType', 'registeredCapital', 'openPurpose'
  ]
  const result: Record<string, any> = {}
  keys.forEach(k => { if (info[k] !== undefined && info[k] !== null && info[k] !== '') result[k] = info[k] })
  return result
})

const getBasicInfoLabel = (key: string): string => {
  const labels: Record<string, string> = {
    openingNo: '申请流水号', openingType: '开户类型', customerName: '客户姓名',
    idCardNo: '证件号码', accountTypeText: '账户类型', enterpriseName: '企业名称',
    creditCode: '统一社会信用代码', legalRepresentative: '法人代表',
    legalIdCardNo: '法人身份证号', channelCode: '申请渠道', riskLevelText: '风险等级',
    submitTime: '提交时间', submitterName: '提交人', submitOrgName: '提交机构',
    mobile: '联系电话', address: '联系地址', industryType: '行业类型',
    registeredCapital: '注册资本', openPurpose: '开户用途'
  }
  return labels[key] || key
}

const formatBasicInfoValue = (key: string, value: any): string => {
  if (key === 'openingType') return OpeningTypeText[value] || value
  if (key === 'channelCode') return ChannelText[value] || value
  return String(value)
}

const getMaterialRowClass = ({ row }: { row: any }) => {
  if (row.required === 1 && row.provided !== 1) return 'material-missing-row'
  return ''
}

const getLogTimelineType = (result: number) => {
  if (result === ReviewResult.APPROVED) return 'success'
  if (result === ReviewResult.REJECTED) return 'danger'
  return 'warning'
}

const getLogTagType = (result: number) => {
  if (result === ReviewResult.APPROVED) return 'success'
  if (result === ReviewResult.REJECTED) return 'danger'
  return 'info'
}

const parseSupportingFiles = (files: string): string[] => {
  if (!files) return []
  try { return JSON.parse(files) } catch { return files.split(',').filter(Boolean) }
}

const fetchData = async () => {
  loading.value = true
  try {
    const params: OpeningReviewQueryParams = {
      page: pageParams.page,
      pageSize: pageParams.pageSize,
      keyword: searchForm.keyword || undefined,
      channelCode: searchForm.channelCode || undefined,
      accountType: searchForm.accountType ?? undefined,
      reviewStage: searchForm.reviewStage ?? undefined,
      openingType: searchForm.openingType ?? undefined,
      startTime: searchForm.timeRange?.[0],
      endTime: searchForm.timeRange?.[1]
    }
    const res = await getReviewListApi(params)
    tableData.value = res.list || []
    total.value = res.total || 0
    calculateStats(res.list || [])
  } catch (e: any) {
    ElMessage.error(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

const calculateStats = (list: OpeningReviewItem[]) => {
  stats.pending = list.filter(r => r.reviewStage === 0).length
  stats.inReview = list.filter(r => r.reviewStage === 1 || r.reviewStage === 2 || r.reviewStage === 3).length
  stats.passed = list.filter(r => r.reviewStage === 4).length
  stats.rejected = list.filter(r => r.reviewStage === 5).length
}

const handleSearch = () => { pageParams.page = 1; fetchData() }
const handleReset = () => {
  Object.assign(searchForm, {
    channelCode: '', accountType: null, reviewStage: null,
    openingType: null, keyword: '', timeRange: []
  })
  pageParams.page = 1
  fetchData()
}
const handlePageChange = () => fetchData()
const handleSelectionChange = (val: unknown[]) => { selectedRows.value = val as OpeningReviewItem[] }

const quickFilter = (stage: number) => {
  searchForm.reviewStage = stage
  pageParams.page = 1
  fetchData()
}

const handleRowClick = (row: OpeningReviewItem) => {
  currentRow.value = row
}

const handleOpenReview = async (row: OpeningReviewItem) => {
  try {
    const precheck = await preCheckReviewApi(row.openingType, row.id)
    if (!precheck.canEnter) {
      const reasons = precheck.reasons?.join('\n') || '不满足审核条件'
      ElMessageBox.alert(reasons, '无法进入审核', { type: 'warning' })
      return
    }
  } catch (e: any) {
    ElMessage.warning('预审检查失败，继续加载详情...')
  }
  await loadDetail(row)
}

const handleViewDetail = async (row: OpeningReviewItem) => {
  await loadDetail(row, true)
}

const loadDetail = async (row: OpeningReviewItem, viewOnly = false) => {
  currentReviewRow.value = row
  drawerTitle.value = viewOnly ? `审核详情 - ${row.openingNo}` : `审核处理 - ${row.openingNo}`
  currentLevel.value = String(row.currentLevel || ReviewLevel.FIRST)
  activeTab.value = 'basic'
  drawerVisible.value = true
  try {
    const detail = await getReviewDetailApi(row.openingType, row.id)
    reviewDetail.value = detail
  } catch (e: any) {
    ElMessage.error(e.message || '加载详情失败')
  }
}

const lockSubmit = () => {
  submitLocked.value = true
  setTimeout(() => { submitLocked.value = false }, 300)
}

const handleApprove = async () => {
  if (submitLocked.value || !currentReviewRow.value) return
  try {
    await ElMessageBox.confirm(
      `确认在【${ReviewLevelText[Number(currentLevel.value)]}】通过申请 ${currentReviewRow.value.openingNo}？`,
      '确认通过',
      { type: 'success' }
    )
  } catch { return }

  lockSubmit()
  try {
    const data: ReviewSubmitForm = {
      openingType: currentReviewRow.value.openingType,
      openingId: currentReviewRow.value.id,
      level: Number(currentLevel.value),
      result: ReviewResult.APPROVED,
      comment: `${ReviewLevelText[Number(currentLevel.value)]}通过`
    }
    await submitReviewApi(data)
    ElMessage.success('审核通过成功')
    drawerVisible.value = false
    fetchData()
  } catch (e: any) {
    ElMessage.error(e.message || '操作失败')
  }
}

const openRejectDialog = () => {
  rejectForm.rejectReason = ''
  rejectForm.rejectDetails = ''
  rejectForm.supportingFiles = ''
  rejectFileList.value = []
  rejectDialogVisible.value = true
}

const handleFilePreview = (file: UploadFile) => {
  if (file.url) window.open(file.url, '_blank')
}
const handleFileRemove = (file: UploadFile) => {
  rejectFileList.value = rejectFileList.value.filter(f => f.uid !== file.uid)
}
const handleFileChange = (_file: UploadFile, list: UploadFile[]) => {
  rejectFileList.value = list
}

const submitReject = async () => {
  if (submitLocked.value || !currentReviewRow.value) return
  try {
    await rejectFormRef.value?.validate()
  } catch { return }

  if (rejectFileList.value.length === 0) {
    ElMessage.warning('请至少上传一份佐证文件')
    return
  }

  lockSubmit()
  try {
    const fileUrls = rejectFileList.value.map(f => f.url || f.name).join(',')
    const data: ReviewSubmitForm = {
      openingType: currentReviewRow.value.openingType,
      openingId: currentReviewRow.value.id,
      level: Number(currentLevel.value),
      result: ReviewResult.REJECTED,
      comment: rejectForm.rejectDetails,
      rejectReason: rejectForm.rejectReason,
      rejectDetails: rejectForm.rejectDetails,
      supportingFiles: fileUrls
    }
    await submitReviewApi(data)
    ElMessage.success('驳回成功')
    rejectDialogVisible.value = false
    drawerVisible.value = false
    fetchData()
  } catch (e: any) {
    ElMessage.error(e.message || '操作失败')
  }
}

const handleCancelReview = async () => {
  if (submitLocked.value || !currentReviewRow.value) return
  try {
    await ElMessageBox.confirm(
      `确认取消申请 ${currentReviewRow.value.openingNo} 的审核？取消后将恢复待审核状态。`,
      '确认取消',
      { type: 'warning' }
    )
  } catch { return }

  lockSubmit()
  try {
    const data: ReviewSubmitForm = {
      openingType: currentReviewRow.value.openingType,
      openingId: currentReviewRow.value.id,
      level: Number(currentLevel.value),
      result: ReviewResult.CANCELLED,
      comment: '取消本次审核'
    }
    await submitReviewApi(data)
    ElMessage.success('已取消，恢复待审核状态')
    drawerVisible.value = false
    fetchData()
  } catch (e: any) {
    ElMessage.error(e.message || '操作失败')
  }
}

const handleBatchApprove = async () => {
  if (selectedRows.value.length === 0) return
  try {
    await ElMessageBox.confirm(
      `确认批量通过 ${selectedRows.value.length} 条申请？将在当前可操作级别执行通过。`,
      '批量通过确认',
      { type: 'success' }
    )
  } catch { return }

  lockSubmit()
  try {
    const data: BatchReviewForm = {
      ids: selectedRows.value.map(r => r.id),
      openingType: selectedRows.value[0]?.openingType || 1,
      level: ReviewLevel.FIRST,
      result: ReviewResult.APPROVED,
      comment: '批量审核通过'
    }
    const res = await batchReviewApi(data)
    ElMessage.success(`批量完成：成功${res.successCount}条，失败${res.failCount}条`)
    fetchData()
  } catch (e: any) {
    ElMessage.error(e.message || '批量操作失败')
  }
}

const handleBatchReject = async () => {
  if (selectedRows.value.length === 0) return
  try {
    const { value } = await ElMessageBox.prompt(
      `请输入批量驳回原因（${selectedRows.value.length}条）`,
      '批量驳回确认',
      { confirmButtonText: '确定', cancelButtonText: '取消', inputPlaceholder: '请输入驳回原因' }
    )
    lockSubmit()
    const data: BatchReviewForm = {
      ids: selectedRows.value.map(r => r.id),
      openingType: selectedRows.value[0]?.openingType || 1,
      level: ReviewLevel.FIRST,
      result: ReviewResult.REJECTED,
      comment: value,
      rejectReason: 'OTHER'
    }
    const res = await batchReviewApi(data)
    ElMessage.success(`批量完成：成功${res.successCount}条，失败${res.failCount}条`)
    fetchData()
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error(e.message || '批量操作失败')
  }
}

const handleBatchCancel = async () => {
  if (selectedRows.value.length === 0) return
  try {
    await ElMessageBox.confirm(
      `确认批量取消 ${selectedRows.value.length} 条申请的审核？`,
      '批量取消确认',
      { type: 'warning' }
    )
    lockSubmit()
    const data: BatchReviewForm = {
      ids: selectedRows.value.map(r => r.id),
      openingType: selectedRows.value[0]?.openingType || 1,
      level: ReviewLevel.FIRST,
      result: ReviewResult.CANCELLED,
      comment: '批量取消审核'
    }
    const res = await batchReviewApi(data)
    ElMessage.success(`批量完成：成功${res.successCount}条，失败${res.failCount}条`)
    fetchData()
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error(e.message || '批量操作失败')
  }
}

onMounted(() => fetchData())
</script>

<style lang="scss" scoped>
.ccb-business-opening-review {
  .stats-cards {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 16px;
    .stat-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px 24px;
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      cursor: pointer;
      transition: all 0.3s ease;
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
      }
      .stat-icon {
        width: 52px;
        height: 52px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28px;
      }
      .stat-info {
        .stat-num {
          font-size: 28px;
          font-weight: 700;
          line-height: 1.2;
        }
        .stat-label {
          font-size: 13px;
          color: #909399;
          margin-top: 4px;
        }
      }
      &.pending {
        .stat-icon { background: #ecf5ff; color: #409eff; }
        .stat-num { color: #409eff; }
      }
      &.in-review {
        .stat-icon { background: #fdf6ec; color: #e6a23c; }
        .stat-num { color: #e6a23c; }
      }
      &.passed {
        .stat-icon { background: #f0f9eb; color: #67c23a; }
        .stat-num { color: #67c23a; }
      }
      &.rejected {
        .stat-icon { background: #fef0f0; color: #f56c6c; }
        .stat-num { color: #f56c6c; }
      }
    }
  }

  .missing-badge {
    :deep(.el-badge__content) {
      background-color: #f56c6c;
    }
  }
  .conflict-icon { color: #e6a23c; font-size: 16px; }
  .no-missing { color: #c0c4cc; }

  .missing-tooltip {
    max-width: 280px;
    .missing-title { font-weight: 600; margin-bottom: 6px; }
    .missing-item {
      display: flex; align-items: center; gap: 4px;
      font-size: 12px; line-height: 1.8;
    }
  }

  :deep(.review-row) {
    transition: all 0.25s ease;
    cursor: pointer;
    &:hover {
      background-color: rgba(23, 85, 163, 0.04) !important;
    }
  }
  :deep(.el-table__body tr.current-row > td) {
    background-color: rgba(64, 158, 255, 0.12) !important;
  }

  .drawer-tabs {
    margin-bottom: 20px;
  }
  .basic-info-panel { padding: 8px 0; }
  .materials-table { margin-top: 8px; }

  :deep(.material-missing-row > td) {
    background-color: #fef0f0 !important;
    color: #f56c6c;
  }

  .status-ok { color: #67c23a; font-size: 16px; }
  .status-fail { color: #f56c6c; font-size: 16px; }

  .log-card {
    border: 1px solid #ebeef5;
    border-radius: 6px;
    padding: 12px 16px;
    .log-header {
      display: flex; align-items: center; gap: 8px;
      margin-bottom: 10px;
      .log-reviewer {
        margin-left: auto;
        font-size: 12px;
        color: #909399;
      }
    }
    .log-body {
      .log-item {
        font-size: 13px;
        line-height: 1.8;
        display: flex;
        gap: 6px;
        .log-label {
          color: #909399;
          flex-shrink: 0;
        }
      }
    }
  }

  .precheck-panel {
    .precheck-alert { margin-bottom: 16px; }
    .precheck-list-title,
    .precheck-reasons-title {
      font-weight: 600;
      margin: 16px 0 10px;
      color: #303133;
    }
    .precheck-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .precheck-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      border-radius: 6px;
      font-size: 13px;
      &.passed {
        background: #f0f9eb;
        color: #67c23a;
      }
      &.failed {
        background: #fef0f0;
        color: #f56c6c;
      }
      .precheck-item-name {
        font-weight: 500;
        min-width: 120px;
      }
      .precheck-item-msg {
        flex: 1;
        opacity: 0.85;
      }
    }
  }

  .drawer-footer {
    display: flex;
    align-items: flex-start;
    gap: 20px;
    border-top: 1px solid #ebeef5;
    padding-top: 16px;
    .level-tabs {
      :deep(.el-tabs__item) {
        height: 40px;
        line-height: 40px;
      }
    }
    .footer-actions {
      flex: 1;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding-top: 8px;
    }
  }

  .upload-area {
    :deep(.el-upload--picture-card) {
      width: 90px;
      height: 90px;
      line-height: 90px;
    }
  }
  .upload-tip {
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
  }

  .btn-click-feedback {
    transition: all 0.15s ease;
    &:active {
      transform: translateY(2px);
      filter: brightness(0.9);
    }
  }
  .ripple-btn {
    position: relative;
    overflow: hidden;
    display: inline-block;
  }

  :deep(.focus-glow-form) {
    .el-input__wrapper,
    .el-textarea__inner,
    .el-select__wrapper,
    .el-date-editor.el-input,
    .el-date-editor.el-input__wrapper {
      transition: box-shadow 0.3s ease, border-color 0.3s ease;
    }
    .el-input__wrapper.is-focus,
    .el-input__wrapper:focus-within {
      box-shadow: 0 0 0 2px rgba(23, 85, 163, 0.25), 0 0 12px rgba(23, 85, 163, 0.15) !important;
      border-color: #1755a3 !important;
    }
    .el-textarea__inner:focus {
      box-shadow: 0 0 0 2px rgba(23, 85, 163, 0.25), 0 0 12px rgba(23, 85, 163, 0.15) !important;
      border-color: #1755a3 !important;
    }
    .el-select__wrapper.is-focused,
    .el-select__wrapper:focus-within {
      box-shadow: 0 0 0 2px rgba(23, 85, 163, 0.25), 0 0 12px rgba(23, 85, 163, 0.15) !important;
      border-color: #1755a3 !important;
    }
  }

  :deep(.scale-fade-dialog) {
    .el-dialog {
      animation: dialogScaleFadeIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
      transform-origin: center center;
    }
    .v-enter-active .el-dialog,
    .v-leave-active .el-dialog {
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .v-enter-from .el-dialog {
      opacity: 0;
      transform: scale(0.7);
    }
    .v-leave-to .el-dialog {
      opacity: 0;
      transform: scale(0.85);
    }
  }

  @keyframes dialogScaleFadeIn {
    0% {
      opacity: 0;
      transform: scale(0.6) translateY(20px);
    }
    60% {
      opacity: 0.9;
      transform: scale(1.03) translateY(-2px);
    }
    100% {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
}

@media (max-width: 1200px) {
  .ccb-business-opening-review {
    .stats-cards {
      grid-template-columns: repeat(2, 1fr);
    }
  }
}
@media (max-width: 768px) {
  .ccb-business-opening-review {
    .stats-cards {
      grid-template-columns: 1fr;
    }
  }
}
</style>
