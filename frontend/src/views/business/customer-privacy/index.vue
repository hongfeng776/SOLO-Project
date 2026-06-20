<template>
  <div class="ccb-customer-privacy">
    <CcbPageHeader
      title="客户信息隐私防护"
      description="客户敏感信息权限校验、场景脱敏、实时记录与合规拦截"
      icon="Lock"
    />

    <el-row :gutter="16" class="stat-cards">
      <el-col :span="6">
        <div class="stat-card primary">
          <div class="stat-icon"><el-icon><View /></el-icon></div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.todayViewCount }}</div>
            <div class="stat-label">今日查看数</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card success">
          <div class="stat-icon"><el-icon><Download /></el-icon></div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.todayExportCount }}</div>
            <div class="stat-label">今日导出数</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card warning">
          <div class="stat-icon"><el-icon><Warning /></el-icon></div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.todayBlockedCount }}</div>
            <div class="stat-label">今日拦截数</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card danger">
          <div class="stat-icon"><el-icon><BellFilled /></el-icon></div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.todayRiskAlertCount }}</div>
            <div class="stat-label">风控预警数</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="main-content">
      <el-col :span="8">
        <el-card class="scene-card">
          <template #header>
            <div class="card-header">
              <span>查看场景选择</span>
              <el-tag size="small" type="info">必须选择场景</el-tag>
            </div>
          </template>
          <div class="scene-list">
            <div
              v-for="(scene, key) in sceneOptions"
              :key="key"
              :class="['scene-item', { active: viewForm.sceneType === Number(key) }]"
              @click="handleSceneSelect(Number(key))"
            >
              <div class="scene-icon">
                <el-icon :size="24">
                  <component :is="scene.icon" />
                </el-icon>
              </div>
              <div class="scene-info">
                <div class="scene-name">{{ scene.name }}</div>
                <div class="scene-desc">{{ scene.desc }}</div>
              </div>
              <div class="scene-level">
                <el-tag :type="scene.levelType" size="small">{{ scene.level }}</el-tag>
              </div>
            </div>
          </div>
        </el-card>

        <el-card class="precheck-card" v-if="viewForm.sceneType">
          <template #header>
            <div class="card-header">
              <span>前置校验结果</span>
              <el-tag :type="precheckResult?.passed ? 'success' : 'danger'" size="small">
                {{ precheckResult?.passed ? '校验通过' : '校验未通过' }}
              </el-tag>
            </div>
          </template>
          <div v-if="precheckLoading" class="form-skeleton">
            <el-skeleton :rows="4" animated />
          </div>
          <div v-else-if="precheckResult" class="precheck-result">
            <div class="precheck-status">
              <div class="status-item">
                <el-icon :class="precheckResult.permission_valid ? 'text-success' : 'text-danger'">
                  <CircleCheckFilled v-if="precheckResult.permission_valid" />
                  <CircleCloseFilled v-else />
                </el-icon>
                <span>权限验证</span>
              </div>
              <div class="status-item">
                <el-icon :class="precheckResult.scene_valid ? 'text-success' : 'text-danger'">
                  <CircleCheckFilled v-if="precheckResult.scene_valid" />
                  <CircleCloseFilled v-else />
                </el-icon>
                <span>场景验证</span>
              </div>
              <div class="status-item">
                <el-icon :class="precheckResult.record_complete ? 'text-success' : 'text-warning'">
                  <CircleCheckFilled v-if="precheckResult.record_complete" />
                  <Warning v-else />
                </el-icon>
                <span>备案验证</span>
              </div>
            </div>
            <div v-if="precheckResult.errors && precheckResult.errors.length > 0" class="error-list">
              <div class="error-title">错误信息：</div>
              <div v-for="(err, idx) in precheckResult.errors" :key="idx" class="error-item">
                <el-icon color="#f56c6c"><CircleCloseFilled /></el-icon>
                <span>{{ err.field }}: {{ err.message }}</span>
              </div>
            </div>
            <div v-if="precheckResult.warnings && precheckResult.warnings.length > 0" class="warning-list">
              <div class="warning-title">提示信息：</div>
              <div v-for="(warn, idx) in precheckResult.warnings" :key="idx" class="warning-item">
                <el-icon color="#e6a23c"><Warning /></el-icon>
                <span>{{ warn }}</span>
              </div>
            </div>
            <div v-if="precheckResult.block_reason" class="block-reason">
              <el-alert :title="precheckResult.block_reason" type="error" :closable="false" />
            </div>
            <div class="adapt-info">
              <el-descriptions :column="2" border size="small">
                <el-descriptions-item label="客户等级">
                  {{ customerLevelOptions[precheckResult.customer_level] || '未知' }}
                </el-descriptions-item>
                <el-descriptions-item label="敏感度">
                  {{ sensitivityLevelOptions[precheckResult.sensitivity_level] || '未知' }}
                </el-descriptions-item>
                <el-descriptions-item label="脱敏级别">
                  {{ desensitizationLevelOptions[precheckResult.desensitization_level] || '未知' }}
                </el-descriptions-item>
                <el-descriptions-item label="时效限制">
                  {{ precheckResult.time_limit }} 分钟
                </el-descriptions-item>
              </el-descriptions>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="16">
        <el-card class="view-card">
          <template #header>
            <div class="card-header">
              <span>客户信息查看</span>
              <div class="header-actions">
                <el-tag v-if="viewResult?.log_id" size="small" type="success">
                  日志已记录
                </el-tag>
                <el-tag v-if="viewResult?.desensitization_level" :type="getDesensitizationTagType(viewResult.desensitization_level)" size="small">
                  {{ desensitizationLevelOptions[viewResult.desensitization_level] }}
                </el-tag>
              </div>
            </div>
          </template>

          <el-form ref="viewFormRef" :model="viewForm" :rules="viewRules" label-width="120px" class="view-form">
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item label="客户编号" prop="customerId">
                  <el-input v-model="viewForm.customerId" placeholder="请输入客户编号" clearable />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="操作用途" prop="operationPurpose">
                  <el-input v-model="viewForm.operationPurpose" placeholder="请输入操作用途" clearable />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="备案编号" prop="recordId">
                  <el-input v-model="viewForm.recordId" placeholder="请输入备案编号（如有）" clearable />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="查看原文">
                  <el-switch v-model="viewForm.needOriginal" />
                  <span class="form-tip">（需特殊权限）</span>
                </el-form-item>
              </el-col>
            </el-row>
            <div class="form-actions">
              <el-button type="primary" :icon="Search" @click="handleViewInfo" :loading="viewLoading">
                查看客户信息
              </el-button>
              <el-button type="warning" :icon="Download" @click="handleExportInfo" :loading="exportLoading">
                申请导出
              </el-button>
              <el-button @click="handleClearCache">
                清空缓存
              </el-button>
            </div>
          </el-form>

          <el-divider v-if="viewResult" />

          <div v-if="viewLoading" class="result-skeleton">
            <el-skeleton :rows="8" animated>
              <template #template>
                <el-skeleton-table :rows="6" :columns="2" animated />
              </template>
            </el-skeleton>
          </div>

          <div v-else-if="viewResult && viewResult.allowed && viewResult.customer_info" class="customer-info-display">
            <el-descriptions :column="2" border class="info-descriptions">
              <el-descriptions-item label="客户编号">
                {{ viewResult.customer_info.customer_no }}
              </el-descriptions-item>
              <el-descriptions-item label="客户姓名">
                {{ viewResult.customer_info.customer_name }}
              </el-descriptions-item>
              <el-descriptions-item label="身份证号">
                <span :class="{ 'desensitized-text': viewResult.desensitization_fields?.includes('id_card_no') }">
                  {{ viewResult.customer_info.id_card_no }}
                </span>
                <el-tooltip content="敏感字段已脱敏" v-if="viewResult.desensitization_fields?.includes('id_card_no')">
                  <el-icon class="mask-icon" color="#e6a23c"><Lock /></el-icon>
                </el-tooltip>
              </el-descriptions-item>
              <el-descriptions-item label="手机号码">
                <span :class="{ 'desensitized-text': viewResult.desensitization_fields?.includes('mobile') }">
                  {{ viewResult.customer_info.mobile }}
                </span>
                <el-tooltip content="敏感字段已脱敏" v-if="viewResult.desensitization_fields?.includes('mobile')">
                  <el-icon class="mask-icon" color="#e6a23c"><Lock /></el-icon>
                </el-tooltip>
              </el-descriptions-item>
              <el-descriptions-item label="客户等级">
                <el-tag :type="getCustomerLevelTagType(viewResult.customer_info.customer_level)">
                  {{ customerLevelOptions[viewResult.customer_info.customer_level] }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="客户类型">
                {{ viewResult.customer_info.customer_type_text }}
              </el-descriptions-item>
              <el-descriptions-item label="联系地址" :span="2">
                <span :class="{ 'desensitized-text': viewResult.desensitization_fields?.includes('address') }">
                  {{ viewResult.customer_info.address }}
                </span>
                <el-tooltip content="敏感字段已脱敏" v-if="viewResult.desensitization_fields?.includes('address')">
                  <el-icon class="mask-icon" color="#e6a23c"><Lock /></el-icon>
                </el-tooltip>
              </el-descriptions-item>
              <el-descriptions-item label="电子邮箱" v-if="viewResult.customer_info.email">
                <span :class="{ 'desensitized-text': viewResult.desensitization_fields?.includes('email') }">
                  {{ viewResult.customer_info.email }}
                </span>
              </el-descriptions-item>
              <el-descriptions-item label="开户日期">
                {{ viewResult.customer_info.open_date }}
              </el-descriptions-item>
            </el-descriptions>

            <div v-if="viewResult.time_limit" class="time-limit-tip">
              <el-alert
                :title="`当前查看会话有效期为 ${viewResult.time_limit} 分钟，到期自动失效`"
                type="info"
                :closable="false"
                show-icon
              />
            </div>
          </div>

          <div v-else-if="viewResult && viewResult.blocked" class="blocked-display">
            <el-empty description="操作已被拦截">
              <el-alert
                :title="viewResult.block_reason || '您无权限执行此操作'"
                type="error"
                :closable="false"
                show-icon
              />
              <div class="block-type">
                拦截类型：{{ blockTypeOptions[viewResult.block_type] || '未知' }}
              </div>
            </el-empty>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog
      v-model="exportDialogVisible"
      title="导出申请"
      width="600px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form ref="exportFormRef" :model="exportForm" :rules="exportRules" label-width="120px">
        <el-form-item label="客户编号列表" prop="customerIds">
          <el-input
            v-model="exportCustomerIdsInput"
            type="textarea"
            :rows="3"
            placeholder="请输入客户编号，多个用逗号分隔"
          />
        </el-form-item>
        <el-form-item label="导出场景" prop="sceneType">
          <el-select v-model="exportForm.sceneType" placeholder="请选择导出场景" style="width: 100%">
            <el-option v-for="(t, k) in sceneOptions" :key="k" :label="t.name" :value="Number(k)" />
          </el-select>
        </el-form-item>
        <el-form-item label="导出格式" prop="exportFormat">
          <el-select v-model="exportForm.exportFormat" placeholder="请选择导出格式" style="width: 100%">
            <el-option label="Excel (.xlsx)" :value="1" />
            <el-option label="CSV (.csv)" :value="2" />
            <el-option label="PDF (.pdf)" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="导出字段" prop="exportFields">
          <el-checkbox-group v-model="exportForm.exportFields">
            <el-checkbox label="customer_no">客户编号</el-checkbox>
            <el-checkbox label="customer_name">客户姓名</el-checkbox>
            <el-checkbox label="id_card_no">身份证号</el-checkbox>
            <el-checkbox label="mobile">手机号</el-checkbox>
            <el-checkbox label="address">地址</el-checkbox>
            <el-checkbox label="email">邮箱</el-checkbox>
            <el-checkbox label="customer_level">客户等级</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="导出原因" prop="exportReason">
          <el-input v-model="exportForm.exportReason" type="textarea" :rows="3" placeholder="请详细说明导出原因" />
        </el-form-item>
        <el-form-item label="审批人" prop="approverId">
          <el-input v-model="exportForm.approverId" placeholder="请输入审批人编号" clearable />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="exportDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitExport" :loading="exportLoading">
          提交申请
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="exportResultDialogVisible" title="导出结果" width="500px">
      <el-result
        :icon="exportResult?.allowed ? 'success' : 'error'"
        :title="exportResult?.allowed ? '导出申请已受理' : '导出申请被拦截'"
        :sub-title="exportResult?.block_reason || '请查看详细信息'"
      >
        <template #extra>
          <div v-if="exportResult?.allowed" class="export-success-info">
            <el-descriptions :column="1" border size="small">
              <el-descriptions-item label="导出编号">
                {{ exportResult.export_id }}
              </el-descriptions-item>
              <el-descriptions-item label="导出条数">
                {{ exportResult.export_count }} 条
              </el-descriptions-item>
              <el-descriptions-item label="下载链接">
                <el-link :href="exportResult.file_url" type="primary" target="_blank">
                  点击下载
                </el-link>
              </el-descriptions-item>
            </el-descriptions>
          </div>
          <div v-else class="export-blocked-info">
            <el-alert
              :title="exportResult?.block_reason || '导出操作不符合合规要求'"
              type="error"
              :closable="false"
              show-icon
            />
            <div class="block-type-info">
              拦截类型：{{ blockTypeOptions[exportResult?.block_type] || '未知' }}
            </div>
          </div>
        </template>
      </el-result>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import {
  Search,
  Plus,
  Download,
  View,
  Warning,
  Lock,
  BellFilled,
  CircleCheckFilled,
  CircleCloseFilled,
  Tools,
  Document,
  DataAnalysis,
  Histogram
} from '@element-plus/icons-vue'
import {
  preCheckPrivacyApi,
  viewCustomerPrivacyApi,
  exportCustomerPrivacyApi,
  adaptPrivacySceneApi,
  type PrivacyViewRequest,
  type PrivacyViewResponse,
  type PrivacyExportRequest,
  type PrivacyExportResponse,
  type PrivacyPreCheckResult,
  type PrivacySceneAdaptResult
} from '@api/business'

const listLoading = ref(false)
const precheckLoading = ref(false)
const viewLoading = ref(false)
const exportLoading = ref(false)

const precheckResult = ref<PrivacyPreCheckResult | null>(null)
const viewResult = ref<PrivacyViewResponse | null>(null)
const exportResult = ref<PrivacyExportResponse | null>(null)
const sceneAdaptResult = ref<PrivacySceneAdaptResult | null>(null)

const precheckDialogVisible = ref(false)
const exportDialogVisible = ref(false)
const exportResultDialogVisible = ref(false)

const viewFormRef = ref<FormInstance>()
const exportFormRef = ref<FormInstance>()

const stats = reactive({
  todayViewCount: 0,
  todayExportCount: 0,
  todayBlockedCount: 0,
  todayRiskAlertCount: 0
})

const viewForm = reactive<PrivacyViewRequest>({
  customerId: '',
  sceneType: 0,
  operationPurpose: '',
  recordId: '',
  needOriginal: false
})

const exportForm = reactive<PrivacyExportRequest>({
  customerIds: [],
  sceneType: 0,
  operationPurpose: '',
  exportFormat: 1,
  exportFields: ['customer_no', 'customer_name'],
  exportReason: '',
  approverId: ''
})

const exportCustomerIdsInput = ref('')

const viewRules: FormRules = {
  customerId: [{ required: true, message: '请输入客户编号', trigger: 'blur' }],
  sceneType: [{ required: true, message: '请选择查看场景', trigger: 'change' }],
  operationPurpose: [{ required: true, message: '请输入操作用途', trigger: 'blur' }]
}

const exportRules: FormRules = {
  customerIds: [{ required: true, message: '请输入客户编号', trigger: 'blur' }],
  sceneType: [{ required: true, message: '请选择导出场景', trigger: 'change' }],
  exportReason: [{ required: true, message: '请输入导出原因', trigger: 'blur' }]
}

const sceneOptions: Record<number, { name: string; desc: string; level: string; levelType: string; icon: any }> = {
  1: { name: '日常运维查看', desc: '日常客户信息维护、问题排查', level: '低风险', levelType: 'info', icon: Tools },
  2: { name: '业务审核查看', desc: '业务流程审核、资料核对', level: '中风险', levelType: 'warning', icon: Document },
  3: { name: '风控核查查看', desc: '风险核查、反洗钱调查', level: '高风险', levelType: 'danger', icon: DataAnalysis },
  4: { name: '审计溯源查看', desc: '内部审计、合规检查', level: '极高风险', levelType: 'danger', icon: Histogram }
}

const customerLevelOptions: Record<number, string> = {
  0: '全部',
  1: '普通客户',
  2: '银卡客户',
  3: '金卡客户',
  4: '白金客户',
  5: '钻石客户'
}

const sensitivityLevelOptions: Record<number, string> = {
  1: '低敏感',
  2: '中敏感',
  3: '高敏感',
  4: '极高敏感'
}

const desensitizationLevelOptions: Record<number, string> = {
  1: '不脱敏',
  2: '部分脱敏',
  3: '完全脱敏',
  4: '加密展示'
}

const blockTypeOptions: Record<number, string> = {
  0: '无',
  1: '权限不足',
  2: '未备案',
  3: '违规操作',
  4: '高频访问',
  5: '批量恶意导出'
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

function getDesensitizationTagType(level: number): string {
  const types: Record<number, string> = {
    1: 'success',
    2: 'warning',
    3: 'danger',
    4: 'info'
  }
  return types[level] || 'info'
}

async function loadStats() {
  stats.todayViewCount = Math.floor(Math.random() * 100)
  stats.todayExportCount = Math.floor(Math.random() * 20)
  stats.todayBlockedCount = Math.floor(Math.random() * 10)
  stats.todayRiskAlertCount = Math.floor(Math.random() * 5)
}

async function handleSceneSelect(sceneType: number) {
  viewForm.sceneType = sceneType
  if (viewForm.customerId) {
    await handlePrecheck()
  }
  try {
    const res = await adaptPrivacySceneApi({ scene_type: sceneType, customer_level: 1 })
    sceneAdaptResult.value = res
  } catch (e) {
    console.error('场景适配失败', e)
  }
}

async function handlePrecheck() {
  if (!viewForm.customerId || !viewForm.sceneType) return
  precheckLoading.value = true
  try {
    const res = await preCheckPrivacyApi(viewForm)
    precheckResult.value = res
    if (res.blocked && res.block_reason) {
      ElMessage.warning(res.block_reason)
    }
  } catch (e) {
    console.error('前置校验失败', e)
  } finally {
    precheckLoading.value = false
  }
}

watch(() => viewForm.customerId, () => {
  if (viewForm.sceneType) {
    handlePrecheck()
  }
})

async function handleViewInfo() {
  if (!viewFormRef.value) return
  const valid = await viewFormRef.value.validate().catch(() => false)
  if (!valid) return

  if (precheckResult.value?.blocked) {
    ElMessage.error(precheckResult.value.block_reason || '前置校验未通过，无法查看')
    return
  }

  viewLoading.value = true
  try {
    const res = await viewCustomerPrivacyApi(viewForm)
    viewResult.value = res
    if (res.allowed) {
      ElMessage.success('获取客户信息成功')
    } else {
      ElMessage.error(res.block_reason || '操作已被拦截')
    }
  } catch (e) {
    console.error('查看客户信息失败', e)
  } finally {
    viewLoading.value = false
  }
}

async function handleExportInfo() {
  exportForm.customerIds = []
  exportCustomerIdsInput.value = ''
  exportForm.sceneType = viewForm.sceneType
  exportForm.operationPurpose = viewForm.operationPurpose
  exportDialogVisible.value = true
}

async function handleSubmitExport() {
  if (!exportFormRef.value) return
  const valid = await exportFormRef.value.validate().catch(() => false)
  if (!valid) return

  const ids = exportCustomerIdsInput.value.split(',').map(id => id.trim()).filter(id => id)
  if (ids.length === 0) {
    ElMessage.warning('请输入至少一个客户编号')
    return
  }
  exportForm.customerIds = ids

  if (precheckResult.value?.blocked) {
    ElMessage.error(precheckResult.value.block_reason || '前置校验未通过，无法导出')
    return
  }

  exportLoading.value = true
  try {
    const res = await exportCustomerPrivacyApi(exportForm)
    exportResult.value = res
    exportDialogVisible.value = false
    exportResultDialogVisible.value = true
  } catch (e) {
    console.error('导出申请失败', e)
  } finally {
    exportLoading.value = false
  }
}

function handleClearCache() {
  ElMessageBox.confirm('确定要清空当前页面的临时缓存数据吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    viewResult.value = null
    precheckResult.value = null
    ElMessage.success('缓存已清空')
  }).catch(() => {})
}

onMounted(() => {
  loadStats()
})
</script>

<style scoped lang="scss">
.ccb-customer-privacy {
  padding: 0;
}

.stat-cards {
  margin-bottom: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 20px;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.08);

  &.primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    .stat-value, .stat-label { color: #fff; }
    .stat-icon { background: rgba(255,255,255,0.2); color: #fff; }
  }
  &.success {
    background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
    .stat-value, .stat-label { color: #fff; }
    .stat-icon { background: rgba(255,255,255,0.2); color: #fff; }
  }
  &.warning {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    .stat-value, .stat-label { color: #fff; }
    .stat-icon { background: rgba(255,255,255,0.2); color: #fff; }
  }
  &.danger {
    background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
    .stat-value, .stat-label { color: #fff; }
    .stat-icon { background: rgba(255,255,255,0.2); color: #fff; }
  }
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ecf5ff;
  color: #409eff;
  margin-right: 16px;

  .el-icon { font-size: 28px; }
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  opacity: 0.85;
}

.main-content {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
}

.scene-card {
  margin-bottom: 16px;
}

.scene-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.scene-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #ebeef5;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    border-color: #409eff;
    background: #ecf5ff;
  }

  &.active {
    border-color: #409eff;
    background: #ecf5ff;
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
  }
}

.scene-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  color: #909399;
}

.scene-item.active .scene-icon {
  background: #409eff;
  color: #fff;
}

.scene-info {
  flex: 1;
}

.scene-name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 2px;
}

.scene-desc {
  font-size: 12px;
  color: #909399;
}

.scene-level {
  margin-left: 12px;
}

.precheck-card {
  margin-bottom: 16px;
}

.precheck-result {
  .precheck-status {
    display: flex;
    gap: 16px;
    margin-bottom: 16px;
    padding: 12px;
    background: #f5f7fa;
    border-radius: 6px;

    .status-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
    }
  }

  .error-list, .warning-list {
    margin-bottom: 12px;
    padding: 12px;
    border-radius: 6px;

    .error-title, .warning-title {
      font-weight: 500;
      margin-bottom: 8px;
    }

    .error-item, .warning-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      margin-bottom: 4px;
    }
  }

  .error-list {
    background: #fef0f0;
    .error-title { color: #f56c6c; }
  }

  .warning-list {
    background: #fdf6ec;
    .warning-title { color: #e6a23c; }
  }

  .block-reason {
    margin-bottom: 16px;
  }

  .adapt-info {
    margin-top: 16px;
  }
}

.view-card {
  min-height: 500px;
}

.view-form {
  margin-bottom: 16px;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.form-tip {
  margin-left: 8px;
  color: #909399;
  font-size: 12px;
}

.desensitized-text {
  color: #e6a23c;
  font-family: 'Consolas', monospace;
}

.mask-icon {
  margin-left: 6px;
  vertical-align: middle;
}

.text-success { color: #67c23a; }
.text-warning { color: #e6a23c; }
.text-danger { color: #f56c6c; }

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.customer-info-display {
  margin-top: 16px;

  .info-descriptions {
    margin-bottom: 16px;
  }

  .time-limit-tip {
    margin-top: 16px;
  }
}

.blocked-display {
  padding: 40px 0;

  .block-type {
    margin-top: 16px;
    color: #909399;
  }
}

.skeleton-wrapper,
.form-skeleton,
.result-skeleton {
  padding: 20px 0;
}

.export-success-info {
  width: 100%;
}

.export-blocked-info {
  width: 100%;

  .block-type-info {
    margin-top: 12px;
    text-align: center;
    color: #909399;
  }
}
</style>
