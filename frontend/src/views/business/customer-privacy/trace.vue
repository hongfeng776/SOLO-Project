<template>
  <div class="ccb-customer-privacy-trace">
    <CcbPageHeader
      title="隐私操作溯源审计"
      description="溯源所有客户隐私信息查看、导出、操作记录，拦截违规行为"
      icon="DataAnalysis"
    />

    <el-row :gutter="16" class="trace-stat-cards">
      <el-col :span="4">
        <div class="trace-stat-card">
          <div class="trace-stat-icon primary"><el-icon><View /></el-icon></div>
          <div class="trace-stat-value">{{ traceResult?.statistics?.view_count || 0 }}</div>
          <div class="trace-stat-label">查看次数</div>
        </div>
      </el-col>
      <el-col :span="4">
        <div class="trace-stat-card">
          <div class="trace-stat-icon success"><el-icon><Download /></el-icon></div>
          <div class="trace-stat-value">{{ traceResult?.statistics?.export_count || 0 }}</div>
          <div class="trace-stat-label">导出次数</div>
        </div>
      </el-col>
      <el-col :span="4">
        <div class="trace-stat-card">
          <div class="trace-stat-icon warning"><el-icon><Warning /></el-icon></div>
          <div class="trace-stat-value">{{ traceResult?.statistics?.blocked_count || 0 }}</div>
          <div class="trace-stat-label">拦截次数</div>
        </div>
      </el-col>
      <el-col :span="4">
        <div class="trace-stat-card">
          <div class="trace-stat-icon danger"><el-icon><Lock /></el-icon></div>
          <div class="trace-stat-value">{{ traceResult?.statistics?.unauthorized_count || 0 }}</div>
          <div class="trace-stat-label">越权操作</div>
        </div>
      </el-col>
      <el-col :span="4">
        <div class="trace-stat-card">
          <div class="trace-stat-icon danger"><el-icon><CircleCloseFilled /></el-icon></div>
          <div class="trace-stat-value">{{ traceResult?.statistics?.violation_count || 0 }}</div>
          <div class="trace-stat-label">违规操作</div>
        </div>
      </el-col>
      <el-col :span="4">
        <div class="trace-stat-card">
          <div class="trace-stat-icon danger"><el-icon><BellFilled /></el-icon></div>
          <div class="trace-stat-value">{{ traceResult?.statistics?.risk_alert_count || 0 }}</div>
          <div class="trace-stat-label">风控预警</div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="trace-content">
      <el-col :span="8">
        <el-card class="trace-search-card">
          <template #header>
            <div class="card-header">
              <span>溯源查询</span>
              <el-tag size="small" type="info">支持多维度溯源</el-tag>
            </div>
          </template>
          <el-form ref="traceFormRef" :model="traceForm" :rules="traceFormRules" label-width="110px">
            <el-form-item label="客户编号" prop="customerNo">
              <el-input v-model="traceForm.customerNo" placeholder="请输入客户编号" clearable />
            </el-form-item>
            <el-form-item label="客户姓名" prop="customerName">
              <el-input v-model="traceForm.customerName" placeholder="请输入客户姓名" clearable />
            </el-form-item>
            <el-form-item label="身份证号" prop="idCardNo">
              <el-input v-model="traceForm.idCardNo" placeholder="请输入身份证号" clearable />
            </el-form-item>
            <el-form-item label="操作员编号" prop="operatorId">
              <el-input v-model="traceForm.operatorId" placeholder="请输入操作员编号" clearable />
            </el-form-item>
            <el-form-item label="操作员姓名" prop="operatorName">
              <el-input v-model="traceForm.operatorName" placeholder="请输入操作员姓名" clearable />
            </el-form-item>
            <el-form-item label="开始时间" prop="startTime">
              <el-date-picker
                v-model="traceForm.startTime"
                type="datetime"
                placeholder="选择开始时间"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item label="结束时间" prop="endTime">
              <el-date-picker
                v-model="traceForm.endTime"
                type="datetime"
                placeholder="选择结束时间"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%"
              />
            </el-form-item>
            <div class="trace-risk-flags">
              <div class="flags-title">风险标记：</div>
              <div class="flags-list">
                <el-checkbox v-model="traceForm.includeUnauthorized">
                  <span class="text-danger">越权操作</span>
                </el-checkbox>
                <el-checkbox v-model="traceForm.includeViolation">
                  <span class="text-danger">违规操作</span>
                </el-checkbox>
                <el-checkbox v-model="traceForm.includeHighFrequency">
                  <span class="text-warning">高频访问</span>
                </el-checkbox>
                <el-checkbox v-model="traceForm.includeMaliciousExport">
                  <span class="text-danger">恶意导出</span>
                </el-checkbox>
                <el-checkbox v-model="traceForm.includeRiskAlert">
                  <span class="text-warning">风控预警</span>
                </el-checkbox>
              </div>
            </div>
            <div class="trace-form-actions">
              <el-button type="primary" :icon="Search" @click="handleTrace" :loading="traceLoading">
                执行溯源
              </el-button>
              <el-button @click="handleResetTrace">
                重置
              </el-button>
            </div>
          </el-form>

          <el-divider content-position="left" v-if="traceResult">
            风险提示
          </el-divider>

          <div v-if="traceResult && traceResult.risk_prompts && traceResult.risk_prompts.length > 0" class="risk-prompts">
            <el-alert
              v-for="(prompt, idx) in traceResult.risk_prompts"
              :key="idx"
              :title="prompt"
              type="warning"
              :closable="false"
              show-icon
              class="risk-prompt-item"
            />
          </div>

          <el-divider content-position="left" v-if="traceResult">
            风险标记检测
          </el-divider>

          <div v-if="traceResult" class="risk-detection">
            <div class="detection-item">
              <el-icon :class="traceResult.has_unauthorized ? 'text-danger' : 'text-success'">
                <CircleCheckFilled v-if="!traceResult.has_unauthorized" />
                <CircleCloseFilled v-else />
              </el-icon>
              <span>越权操作</span>
              <el-tag :type="traceResult.has_unauthorized ? 'danger' : 'success'" size="small">
                {{ traceResult.has_unauthorized ? '检测到' : '未检测到' }}
              </el-tag>
            </div>
            <div class="detection-item">
              <el-icon :class="traceResult.has_violation ? 'text-danger' : 'text-success'">
                <CircleCheckFilled v-if="!traceResult.has_violation" />
                <CircleCloseFilled v-else />
              </el-icon>
              <span>违规操作</span>
              <el-tag :type="traceResult.has_violation ? 'danger' : 'success'" size="small">
                {{ traceResult.has_violation ? '检测到' : '未检测到' }}
              </el-tag>
            </div>
            <div class="detection-item">
              <el-icon :class="traceResult.has_high_frequency ? 'text-warning' : 'text-success'">
                <CircleCheckFilled v-if="!traceResult.has_high_frequency" />
                <CircleCloseFilled v-else />
              </el-icon>
              <span>高频访问</span>
              <el-tag :type="traceResult.has_high_frequency ? 'warning' : 'success'" size="small">
                {{ traceResult.has_high_frequency ? '检测到' : '未检测到' }}
              </el-tag>
            </div>
            <div class="detection-item">
              <el-icon :class="traceResult.has_malicious_export ? 'text-danger' : 'text-success'">
                <CircleCheckFilled v-if="!traceResult.has_malicious_export" />
                <CircleCloseFilled v-else />
              </el-icon>
              <span>恶意导出</span>
              <el-tag :type="traceResult.has_malicious_export ? 'danger' : 'success'" size="small">
                {{ traceResult.has_malicious_export ? '检测到' : '未检测到' }}
              </el-tag>
            </div>
            <div class="detection-item">
              <el-icon :class="traceResult.has_risk_alert ? 'text-warning' : 'text-success'">
                <CircleCheckFilled v-if="!traceResult.has_risk_alert" />
                <CircleCloseFilled v-else />
              </el-icon>
              <span>风控预警</span>
              <el-tag :type="traceResult.has_risk_alert ? 'warning' : 'success'" size="small">
                {{ traceResult.has_risk_alert ? '检测到' : '未检测到' }}
              </el-tag>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="16">
        <el-card class="log-list-card">
          <template #header>
            <div class="card-header">
              <span>操作日志列表</span>
              <div class="header-tags">
                <el-tag v-if="traceResult?.has_unauthorized" type="danger" effect="dark" size="small">
                  含越权操作
                </el-tag>
                <el-tag v-if="traceResult?.has_violation" type="danger" effect="dark" size="small">
                  含违规操作
                </el-tag>
                <el-tag v-if="traceResult?.has_high_frequency" type="warning" effect="dark" size="small">
                  含高频访问
                </el-tag>
                <el-tag v-if="traceResult?.has_malicious_export" type="danger" effect="dark" size="small">
                  含恶意导出
                </el-tag>
                <el-tag v-if="traceResult?.has_risk_alert" type="warning" effect="dark" size="small">
                  含风控预警
                </el-tag>
              </div>
            </div>
          </template>

          <CcbSearchForm v-model="searchForm" @search="handleSearch" @reset="handleReset" inline>
            <el-form-item label="日志编号" prop="logNo">
              <el-input v-model="searchForm.logNo" placeholder="请输入" clearable />
            </el-form-item>
            <el-form-item label="客户姓名" prop="customerName">
              <el-input v-model="searchForm.customerName" placeholder="请输入" clearable />
            </el-form-item>
            <el-form-item label="操作员" prop="operatorName">
              <el-input v-model="searchForm.operatorName" placeholder="请输入" clearable />
            </el-form-item>
            <el-form-item label="场景" prop="sceneType">
              <el-select v-model="searchForm.sceneType" placeholder="请选择" clearable style="width: 140px">
                <el-option v-for="(t, k) in sceneOptions" :key="k" :label="t.name" :value="Number(k)" />
              </el-select>
            </el-form-item>
            <el-form-item label="操作类型" prop="operationType">
              <el-select v-model="searchForm.operationType" placeholder="请选择" clearable style="width: 120px">
                <el-option v-for="(t, k) in operationTypeOptions" :key="k" :label="t" :value="Number(k)" />
              </el-select>
            </el-form-item>
            <el-form-item label="是否拦截" prop="isBlocked">
              <el-select v-model="searchForm.isBlocked" placeholder="请选择" clearable style="width: 100px">
                <el-option label="已拦截" :value="1" />
                <el-option label="未拦截" :value="0" />
              </el-select>
            </el-form-item>
            <el-form-item label="拦截类型" prop="blockType">
              <el-select v-model="searchForm.blockType" placeholder="请选择" clearable style="width: 120px">
                <el-option v-for="(t, k) in blockTypeOptions" :key="k" :label="t" :value="Number(k)" />
              </el-select>
            </el-form-item>
            <el-form-item label="风险预警" prop="isRiskAlert">
              <el-select v-model="searchForm.isRiskAlert" placeholder="请选择" clearable style="width: 100px">
                <el-option label="有预警" :value="1" />
                <el-option label="无预警" :value="0" />
              </el-select>
            </el-form-item>
          </CcbSearchForm>

          <div v-if="listLoading" class="skeleton-wrapper">
            <el-skeleton :rows="8" animated :throttle="200">
              <template #template>
                <el-skeleton-table :rows="8" :columns="10" animated />
              </template>
            </el-skeleton>
          </div>

          <el-table
            v-else
            v-loading="listLoading"
            :data="tableData"
            :stripe="true"
            border
            style="width: 100%"
          >
            <el-table-column type="index" label="#" width="50" />
            <el-table-column prop="logNo" label="日志编号" width="160" />
            <el-table-column prop="operationTime" label="操作时间" width="160" />
            <el-table-column prop="operatorName" label="操作员" width="100" />
            <el-table-column prop="operatorPosition" label="岗位" width="90">
              <template #default="{ row }">
                {{ operatorPositionOptions[row.operatorPosition] || '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="customerName" label="客户姓名" width="100" />
            <el-table-column prop="customerLevel" label="客户等级" width="90">
              <template #default="{ row }">
                <el-tag :type="getCustomerLevelTagType(row.customerLevel)" effect="light" size="small">
                  {{ customerLevelOptions[row.customerLevel] || '-' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="sceneType" label="场景" width="110">
              <template #default="{ row }">
                <el-tag effect="plain" size="small">
                  {{ sceneOptions[row.sceneType]?.name || '-' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="operationType" label="操作类型" width="90">
              <template #default="{ row }">
                <el-tag :type="getOperationTypeTagType(row.operationType)" effect="light" size="small">
                  {{ operationTypeOptions[row.operationType] || '-' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="风险标记" width="140">
              <template #default="{ row }">
                <div class="risk-tags">
                  <el-tag v-if="row.isBlocked === 1" type="danger" effect="dark" size="small">已拦截</el-tag>
                  <el-tag v-if="row.isUnauthorized === 1" type="danger" effect="dark" size="small">越权</el-tag>
                  <el-tag v-if="row.isViolation === 1" type="danger" effect="dark" size="small">违规</el-tag>
                  <el-tag v-if="row.isRiskAlert === 1" type="warning" effect="dark" size="small">预警</el-tag>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="blockType" label="拦截类型" width="100">
              <template #default="{ row }">
                <span v-if="row.isBlocked === 1" :class="getBlockTypeClass(row.blockType)">
                  {{ blockTypeOptions[row.blockType] || '-' }}
                </span>
                <span v-else class="text-success">-</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="handleViewLogDetail(row)">
                  详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-wrapper">
            <el-pagination
              v-model:current-page="pageParams.page"
              v-model:page-size="pageParams.pageSize"
              :total="total"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              background
              @size-change="handlePageChange"
              @current-change="handlePageChange"
            />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog
      v-model="logDetailDialogVisible"
      title="操作日志详情"
      width="700px"
      :close-on-click-modal="false"
    >
      <div v-if="logDetailLoading" class="form-skeleton">
        <el-skeleton :rows="10" animated />
      </div>
      <div v-else-if="currentLog" class="log-detail">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="日志编号" :span="2">
            {{ currentLog.log_no }}
          </el-descriptions-item>
          <el-descriptions-item label="操作时间">
            {{ currentLog.operation_time }}
          </el-descriptions-item>
          <el-descriptions-item label="操作时长">
            {{ currentLog.operation_duration || '-' }} 秒
          </el-descriptions-item>
          <el-descriptions-item label="操作员">
            {{ currentLog.operator_name }}
          </el-descriptions-item>
          <el-descriptions-item label="操作岗位">
            {{ operatorPositionOptions[currentLog.operator_position] || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="所属机构">
            {{ currentLog.operator_org_name || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="操作IP">
            {{ currentLog.operation_ip || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="操作设备">
            {{ currentLog.operation_device || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="客户姓名">
            {{ currentLog.customer_name || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="客户等级">
            <el-tag :type="getCustomerLevelTagType(currentLog.customer_level)">
              {{ customerLevelOptions[currentLog.customer_level] || '-' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="查看场景">
            {{ sceneOptions[currentLog.scene_type]?.name || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="操作类型">
            {{ operationTypeOptions[currentLog.operation_type] || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="脱敏级别">
            {{ desensitizationLevelOptions[currentLog.desensitization_level] || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="查看次数">
            {{ currentLog.view_count || 0 }} 次
          </el-descriptions-item>
          <el-descriptions-item label="导出数量">
            {{ currentLog.export_count || 0 }} 条
          </el-descriptions-item>
          <el-descriptions-item label="是否被拦截" :span="2">
            <el-tag :type="currentLog.is_blocked === 1 ? 'danger' : 'success'">
              {{ currentLog.is_blocked === 1 ? '是' : '否' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item v-if="currentLog.is_blocked === 1" label="拦截类型">
            <span :class="getBlockTypeClass(currentLog.block_type)">
              {{ blockTypeOptions[currentLog.block_type] || '-' }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item v-if="currentLog.is_blocked === 1" label="拦截原因" :span="1">
            {{ currentLog.block_reason || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="越权操作">
            <el-tag :type="currentLog.is_unauthorized === 1 ? 'danger' : 'success'">
              {{ currentLog.is_unauthorized === 1 ? '是' : '否' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="违规操作">
            <el-tag :type="currentLog.is_violation === 1 ? 'danger' : 'success'">
              {{ currentLog.is_violation === 1 ? '是' : '否' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="风控预警">
            <el-tag :type="currentLog.is_risk_alert === 1 ? 'warning' : 'success'">
              {{ currentLog.is_risk_alert === 1 ? '是' : '否' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="匹配规则">
            {{ currentLog.rule_code || '-' }}
          </el-descriptions-item>
          <el-descriptions-item v-if="currentLog.is_risk_alert === 1" label="预警信息" :span="2">
            <el-alert
              :title="currentLog.risk_alert_info || '存在风控风险'"
              type="warning"
              :closable="false"
              show-icon
            />
          </el-descriptions-item>
          <el-descriptions-item v-if="currentLog.record_content" label="操作内容" :span="2">
            <pre class="record-content">{{ currentLog.record_content }}</pre>
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import {
  Search,
  View,
  Download,
  Warning,
  Lock,
  BellFilled,
  CircleCheckFilled,
  CircleCloseFilled,
  DataAnalysis
} from '@element-plus/icons-vue'
import {
  getPrivacyLogListApi,
  getPrivacyLogDetailApi,
  tracePrivacyApi,
  type CustomerPrivacyLog,
  type PrivacyLogQueryParams,
  type PrivacyTraceRequest,
  type PrivacyTraceResponse
} from '@api/business'

const listLoading = ref(false)
const traceLoading = ref(false)
const logDetailLoading = ref(false)
const logDetailDialogVisible = ref(false)

const total = ref(0)
const tableData = ref<CustomerPrivacyLog[]>([])
const traceResult = ref<PrivacyTraceResponse | null>(null)
const currentLog = ref<CustomerPrivacyLog | null>(null)

const traceFormRef = ref<FormInstance>()

const searchForm = reactive<PrivacyLogQueryParams>({
  page: 1,
  pageSize: 10,
  keyword: '',
  logNo: '',
  customerName: '',
  operatorName: '',
  sceneType: undefined,
  operationType: undefined,
  isBlocked: undefined,
  blockType: undefined,
  isRiskAlert: undefined
})

const pageParams = reactive({
  page: 1,
  pageSize: 10
})

const traceForm = reactive<any>({
  customerNo: '',
  customerName: '',
  idCardNo: '',
  operatorId: '',
  operatorName: '',
  startTime: '',
  endTime: '',
  includeUnauthorized: false,
  includeViolation: false,
  includeHighFrequency: false,
  includeMaliciousExport: false,
  includeRiskAlert: false
})

const traceFormRules: FormRules = {}

const customerLevelOptions: Record<number, string> = {
  1: '普通客户',
  2: '银卡客户',
  3: '金卡客户',
  4: '白金客户',
  5: '钻石客户'
}

const operatorPositionOptions: Record<number, string> = {
  1: '柜员',
  2: '客户经理',
  3: '风控专员',
  4: '审计人员',
  5: '系统管理员'
}

const sceneOptions: Record<number, { name: string; desc: string }> = {
  1: { name: '日常运维查看', desc: '日常客户信息维护' },
  2: { name: '业务审核查看', desc: '业务流程审核' },
  3: { name: '风控核查查看', desc: '风险核查调查' },
  4: { name: '审计溯源查看', desc: '内部审计检查' }
}

const operationTypeOptions: Record<number, string> = {
  1: '查看',
  2: '导出',
  3: '修改',
  4: '删除',
  5: '批量查看',
  6: '批量导出'
}

const blockTypeOptions: Record<number, string> = {
  0: '无',
  1: '权限不足',
  2: '未备案',
  3: '违规操作',
  4: '高频访问',
  5: '批量恶意导出'
}

const desensitizationLevelOptions: Record<number, string> = {
  1: '不脱敏',
  2: '部分脱敏',
  3: '完全脱敏',
  4: '加密展示'
}

function getCustomerLevelTagType(level: number): string {
  const types: Record<number, string> = {
    1: 'info',
    2: '',
    3: 'warning',
    4: 'danger',
    5: 'danger'
  }
  return types[level] || 'info'
}

function getOperationTypeTagType(type: number): string {
  const types: Record<number, string> = {
    1: 'primary',
    2: 'success',
    3: 'warning',
    4: 'danger',
    5: 'warning',
    6: 'danger'
  }
  return types[type] || 'info'
}

function getBlockTypeClass(type: number): string {
  const classes: Record<number, string> = {
    1: 'text-danger',
    2: 'text-warning',
    3: 'text-danger',
    4: 'text-warning',
    5: 'text-danger'
  }
  return classes[type] || 'text-info'
}

async function loadList() {
  listLoading.value = true
  try {
    const params: PrivacyLogQueryParams = {
      ...searchForm,
      page: pageParams.page,
      pageSize: pageParams.pageSize
    }
    const res = await getPrivacyLogListApi(params)
    tableData.value = res.list
    total.value = res.total
  } catch (e) {
    console.error('加载日志列表失败', e)
  } finally {
    listLoading.value = false
  }
}

function handleSearch() {
  pageParams.page = 1
  loadList()
}

function handleReset() {
  searchForm.logNo = ''
  searchForm.customerName = ''
  searchForm.operatorName = ''
  searchForm.sceneType = undefined
  searchForm.operationType = undefined
  searchForm.isBlocked = undefined
  searchForm.blockType = undefined
  searchForm.isRiskAlert = undefined
  pageParams.page = 1
  loadList()
}

function handlePageChange() {
  loadList()
}

async function handleTrace() {
  const params: PrivacyTraceRequest = {
    customer_no: traceForm.customerNo || undefined,
    customer_name: traceForm.customerName || undefined,
    id_card_no: traceForm.idCardNo || undefined,
    operator_id: traceForm.operatorId || undefined,
    operator_name: traceForm.operatorName || undefined,
    start_time: traceForm.startTime || undefined,
    end_time: traceForm.endTime || undefined
  }

  if (!params.customer_no && !params.customer_name && !params.id_card_no && !params.operator_id && !params.operator_name) {
    ElMessage.warning('请至少输入一个查询条件')
    return
  }

  traceLoading.value = true
  try {
    const res = await tracePrivacyApi(params)
    traceResult.value = res
    ElMessage.success('溯源查询完成')

    searchForm.customerName = params.customer_name || ''
    searchForm.operatorName = params.operator_name || ''
    pageParams.page = 1
    loadList()
  } catch (e) {
    console.error('溯源查询失败', e)
  } finally {
    traceLoading.value = false
  }
}

function handleResetTrace() {
  traceForm.customerNo = ''
  traceForm.customerName = ''
  traceForm.idCardNo = ''
  traceForm.operatorId = ''
  traceForm.operatorName = ''
  traceForm.startTime = ''
  traceForm.endTime = ''
  traceForm.includeUnauthorized = false
  traceForm.includeViolation = false
  traceForm.includeHighFrequency = false
  traceForm.includeMaliciousExport = false
  traceForm.includeRiskAlert = false
  traceResult.value = null
}

async function handleViewLogDetail(row: CustomerPrivacyLog) {
  logDetailLoading.value = true
  try {
    const detail = await getPrivacyLogDetailApi(row.id)
    currentLog.value = detail
    logDetailDialogVisible.value = true
  } catch (e) {
    console.error('获取日志详情失败', e)
    ElMessage.error('获取日志详情失败')
  } finally {
    logDetailLoading.value = false
  }
}

onMounted(() => {
  loadList()
})
</script>

<style scoped lang="scss">
.ccb-customer-privacy-trace {
  padding: 0;
}

.trace-stat-cards {
  margin-bottom: 16px;
}

.trace-stat-card {
  display: flex;
  align-items: center;
  padding: 16px;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.08);
}

.trace-stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;

  &.primary { background: #ecf5ff; color: #409eff; }
  &.success { background: #f0f9eb; color: #67c23a; }
  &.warning { background: #fdf6ec; color: #e6a23c; }
  &.danger { background: #fef0f0; color: #f56c6c; }

  .el-icon { font-size: 24px; }
}

.trace-stat-value {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 2px;
}

.trace-stat-label {
  font-size: 12px;
  color: #909399;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
}

.header-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.trace-content {
  margin-bottom: 20px;
}

.trace-search-card {
  margin-bottom: 16px;
}

.trace-form-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.trace-risk-flags {
  margin-top: 8px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;

  .flags-title {
    font-weight: 500;
    margin-bottom: 8px;
    font-size: 14px;
  }

  .flags-list {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }
}

.risk-prompts {
  .risk-prompt-item {
    margin-bottom: 8px;

    &:last-child {
      margin-bottom: 0;
    }
  }
}

.risk-detection {
  .detection-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: #f5f7fa;
    border-radius: 6px;
    margin-bottom: 8px;

    &:last-child {
      margin-bottom: 0;
    }

    span {
      flex: 1;
      font-size: 14px;
    }
  }
}

.log-list-card {
  min-height: 600px;
}

.risk-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.text-success { color: #67c23a; }
.text-warning { color: #e6a23c; }
.text-danger { color: #f56c6c; }
.text-info { color: #909399; }

.skeleton-wrapper,
.form-skeleton {
  padding: 20px 0;
}

.log-detail {
  .record-content {
    background: #f5f7fa;
    padding: 12px;
    border-radius: 4px;
    white-space: pre-wrap;
    word-break: break-all;
    margin: 0;
    font-family: 'Consolas', monospace;
    font-size: 13px;
  }
}
</style>
