<template>
  <div class="ccb-customer-profile">
    <CcbPageHeader
      title="个人客户建档管控"
      description="客户实名建档、等级判定、批量导入与溯源管理"
      icon="UserFilled"
    />

    <CcbSearchForm v-model="searchForm" @search="handleSearch" @reset="handleReset">
      <el-form-item label="客户姓名" prop="customerName">
        <el-input v-model="searchForm.customerName" placeholder="请输入客户姓名" clearable />
      </el-form-item>
      <el-form-item label="档案编号" prop="profileNo">
        <el-input v-model="searchForm.profileNo" placeholder="请输入档案编号" clearable />
      </el-form-item>
      <el-form-item label="证件号码" prop="idCardNo">
        <el-input v-model="searchForm.idCardNo" placeholder="请输入证件号码" clearable />
      </el-form-item>
      <el-form-item label="手机号" prop="mobile">
        <el-input v-model="searchForm.mobile" placeholder="请输入手机号" clearable />
      </el-form-item>
      <el-form-item label="客户等级" prop="customerLevel">
        <el-select v-model="searchForm.customerLevel" placeholder="请选择等级" clearable>
          <el-option label="普通客户" :value="1" />
          <el-option label="优质客户" :value="2" />
          <el-option label="贵宾客户" :value="3" />
          <el-option label="潜力客户" :value="4" />
        </el-select>
      </el-form-item>
      <el-form-item label="档案状态" prop="status">
        <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
          <el-option label="已建档" :value="1" />
          <el-option label="已变更" :value="2" />
          <el-option label="已销户" :value="3" />
          <el-option label="锁定待复核" :value="4" />
        </el-select>
      </el-form-item>
      <el-form-item label="标记筛选" prop="needComplete">
        <el-select v-model="searchForm.needComplete" placeholder="请选择" clearable>
          <el-option label="待完善" :value="1" />
          <el-option label="异常锁定" :value="2" />
        </el-select>
      </el-form-item>
    </CcbSearchForm>

    <div class="ccb-table-toolbar">
      <div class="ccb-table-toolbar-left">
        <CcbPermissionButton permission="customer:profile:create">
          <el-button type="primary" :icon="Plus" @click="handleAdd">
            新建客户建档
          </el-button>
        </CcbPermissionButton>
        <CcbPermissionButton permission="customer:profile:batch">
          <el-button type="success" :icon="Upload" @click="handleGoBatch">
            批量建档导入
          </el-button>
        </CcbPermissionButton>
        <CcbPermissionButton permission="customer:profile:trace">
          <el-button type="warning" :icon="Search" @click="handleGoTrace">
            客户溯源查询
          </el-button>
        </CcbPermissionButton>
      </div>
      <div class="ccb-table-toolbar-right">
        <el-text type="info">档案总数：</el-text>
        <el-text type="primary" size="large" bold>{{ total }}</el-text>
        <el-divider direction="vertical" />
        <el-tag type="success" effect="plain">已建档 {{ stats.normal }}</el-tag>
        <el-tag type="warning" effect="plain">待完善 {{ stats.needComplete }}</el-tag>
        <el-tag type="danger" effect="plain">待复核 {{ stats.abnormal }}</el-tag>
      </div>
    </div>

    <div v-if="listLoading" class="skeleton-wrapper">
      <el-skeleton :rows="8" animated :throttle="200">
        <template #template>
          <el-skeleton-table :rows="8" :columns="8" animated />
        </template>
      </el-skeleton>
    </div>

    <CcbTable
      v-else
      v-model:page="pageParams.page"
      v-model:pageSize="pageParams.pageSize"
      :loading="listLoading"
      :data="tableData"
      :total="total"
      :show-selection="true"
      :show-index="true"
      :stripe="true"
      @selection-change="handleSelectionChange"
      @change="handlePageChange"
    >
      <el-table-column prop="profileNo" label="档案编号" width="200" />
      <el-table-column prop="customerName" label="客户姓名" width="100" />
      <el-table-column prop="genderText" label="性别" width="70" />
      <el-table-column prop="idCardNo" label="证件号码" width="200">
        <template #default="{ row }">
          {{ maskIdCard(row.idCardNo) }}
        </template>
      </el-table-column>
      <el-table-column prop="mobile" label="手机号" width="130">
        <template #default="{ row }">
          {{ maskPhone(row.mobile) }}
        </template>
      </el-table-column>
      <el-table-column prop="totalAssets" label="资产规模(元)" width="140" align="right">
        <template #default="{ row }">
          {{ formatMoney(row.totalAssets) }}
        </template>
      </el-table-column>
      <el-table-column prop="customerLevelText" label="客户等级" width="100">
        <template #default="{ row }">
          <el-tag :type="getLevelTagType(row.customerLevel)" effect="light" size="small">
            {{ row.customerLevelText }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="校验状态" width="180">
        <template #default="{ row }">
          <div class="verify-status-group">
            <el-tooltip content="实名证件校验" placement="top">
              <el-icon :class="['verify-icon', getStatusClass(row.idVerifyStatus)]">
                <CircleCheckFilled v-if="row.idVerifyStatus === 1" />
                <CircleCloseFilled v-else-if="row.idVerifyStatus === 2" />
                <QuestionFilled v-else />
              </el-icon>
            </el-tooltip>
            <el-tooltip content="人脸核验" placement="top">
              <el-icon :class="['verify-icon', getStatusClass(row.faceVerifyStatus)]">
                <CircleCheckFilled v-if="row.faceVerifyStatus === 1" />
                <CircleCloseFilled v-else-if="row.faceVerifyStatus === 2" />
                <QuestionFilled v-else />
              </el-icon>
            </el-tooltip>
            <el-tooltip content="手机号校验" placement="top">
              <el-icon :class="['verify-icon', getStatusClass(row.mobileVerifyStatus)]">
                <CircleCheckFilled v-if="row.mobileVerifyStatus === 1" />
                <CircleCloseFilled v-else-if="row.mobileVerifyStatus === 2" />
                <QuestionFilled v-else />
              </el-icon>
            </el-tooltip>
            <el-tooltip :content="row.policeVerifyReason || '公安备案校验'" placement="top">
              <el-icon :class="['verify-icon', getStatusClass(row.policeVerifyStatus)]">
                <CircleCheckFilled v-if="row.policeVerifyStatus === 1" />
                <CircleCloseFilled v-else-if="row.policeVerifyStatus === 2" />
                <QuestionFilled v-else />
              </el-icon>
            </el-tooltip>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="标记" width="140">
        <template #default="{ row }">
          <div class="tag-group">
            <el-tag v-if="row.needComplete === 1" type="warning" effect="dark" size="small" round>
              待完善
            </el-tag>
            <el-tag v-if="row.isAbnormal === 1" type="danger" effect="dark" size="small" round>
              异常
            </el-tag>
            <el-tag v-if="row.infoCompleteness === 0" type="info" size="small" round>
              信息缺失
            </el-tag>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="statusText" label="状态" width="110">
        <template #default="{ row }">
          <el-tag :type="getStatusTagType(row.status)" effect="light" size="small">
            {{ row.statusText }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="creatorName" label="建档人" width="90" />
      <el-table-column prop="profileTime" label="建档时间" width="160" />
      <el-table-column label="操作" width="260" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleView(row)">
            详情
          </el-button>
          <el-button
            v-if="row.status !== 3 && row.status !== 4"
            type="warning"
            link
            size="small"
            @click="handleEdit(row)"
          >
            编辑
          </el-button>
          <el-button
            v-if="row.status === 4"
            type="danger"
            link
            size="small"
            @click="handleReview(row)"
          >
            复核
          </el-button>
          <el-button type="success" link size="small" @click="handleViewLogs(row)">
            日志
          </el-button>
        </template>
      </el-table-column>
    </CcbTable>

    <el-dialog
      v-model="formDialogVisible"
      :title="isEdit ? '编辑客户档案' : '新建客户建档'"
      width="920px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <div v-if="formLoading" class="form-skeleton">
        <el-skeleton :rows="10" animated />
      </div>
      <el-form
        v-else
        ref="profileFormRef"
        :model="profileForm"
        :rules="formRules"
        label-width="110px"
        class="profile-form"
      >
        <el-divider content-position="left">基础信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="客户姓名" prop="customerName">
              <el-input
                v-model="profileForm.customerName"
                placeholder="请输入客户姓名"
                :class="{ 'shake-error': shakeField === 'customerName' }"
                @blur="triggerFieldPrecheck('customerName')"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="证件号码" prop="idCardNo">
              <el-input
                v-model="profileForm.idCardNo"
                placeholder="请输入身份证号码"
                maxlength="18"
                :class="{ 'shake-error': shakeField === 'idCardNo' }"
                @blur="triggerFieldPrecheck('idCardNo')"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="证件类型" prop="idType">
              <el-select v-model="profileForm.idType" placeholder="请选择" style="width: 100%">
                <el-option label="身份证" :value="1" />
                <el-option label="护照" :value="2" />
                <el-option label="军官证" :value="3" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="性别" prop="gender">
              <el-radio-group v-model="profileForm.gender">
                <el-radio value="M">男</el-radio>
                <el-radio value="F">女</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="出生日期" prop="birthDate">
              <el-date-picker
                v-model="profileForm.birthDate"
                type="date"
                placeholder="选择日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号" prop="mobile">
              <el-input
                v-model="profileForm.mobile"
                placeholder="请输入手机号"
                maxlength="11"
                :class="{ 'shake-error': shakeField === 'mobile' }"
                @blur="triggerFieldPrecheck('mobile')"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="电子邮箱" prop="email">
              <el-input v-model="profileForm.email" placeholder="请输入邮箱" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">地址信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="户籍地址" prop="registeredAddress">
              <el-input
                v-model="profileForm.registeredAddress"
                type="textarea"
                :rows="2"
                placeholder="请输入户籍地址"
                :class="{ 'shake-error': shakeField === 'registeredAddress' }"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="居住地址" prop="residentialAddress">
              <el-input
                v-model="profileForm.residentialAddress"
                type="textarea"
                :rows="2"
                placeholder="请输入居住地址"
                :class="{ 'shake-error': shakeField === 'residentialAddress' }"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">职业信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="职业" prop="occupation">
              <el-input v-model="profileForm.occupation" placeholder="请输入职业" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="工作单位" prop="employer">
              <el-input v-model="profileForm.employer" placeholder="请输入工作单位" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="职位" prop="position">
              <el-input v-model="profileForm.position" placeholder="请输入职位" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="学历" prop="education">
              <el-select v-model="profileForm.education" placeholder="请选择" style="width: 100%" clearable>
                <el-option label="小学" value="小学" />
                <el-option label="初中" value="初中" />
                <el-option label="高中" value="高中" />
                <el-option label="大专" value="大专" />
                <el-option label="本科" value="本科" />
                <el-option label="硕士" value="硕士" />
                <el-option label="博士" value="博士" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="婚姻状况" prop="maritalStatus">
              <el-select v-model="profileForm.maritalStatus" placeholder="请选择" style="width: 100%" clearable>
                <el-option label="未婚" value="未婚" />
                <el-option label="已婚" value="已婚" />
                <el-option label="离异" value="离异" />
                <el-option label="丧偶" value="丧偶" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">资产与等级判定</el-divider>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="资产规模(元)" prop="totalAssets">
              <el-input-number
                v-model="profileForm.totalAssets"
                :min="0"
                :precision="2"
                :step="10000"
                :max="999999999.99"
                controls-position="right"
                style="width: 100%"
                @change="judgeLevel"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="月均交易(笔)" prop="monthlyTransactionCount">
              <el-input-number
                v-model="profileForm.monthlyTransactionCount"
                :min="0"
                :max="99999"
                controls-position="right"
                style="width: 100%"
                @change="judgeLevel"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="留存天数" prop="retentionDays">
              <el-input-number
                v-model="profileForm.retentionDays"
                :min="0"
                :max="99999"
                controls-position="right"
                style="width: 100%"
                @change="judgeLevel"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <div v-if="levelJudged" class="level-preview">
          <el-descriptions :column="3" border size="small">
            <el-descriptions-item label="判定等级">
              <el-tag :type="getLevelTagType(levelResult.customer_level)" effect="dark" size="large">
                {{ levelResult.customer_level_text }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="客户标签">
              <div class="tag-group">
                <el-tag
                  v-for="tag in levelResult.customer_tags"
                  :key="tag"
                  type="success"
                  effect="plain"
                  size="small"
                  style="margin-right: 4px"
                >
                  {{ tag }}
                </el-tag>
              </div>
            </el-descriptions-item>
            <el-descriptions-item label="判定依据">
              <div class="judge-rules">
                <div v-for="rule in levelResult.judge_rules" :key="rule" class="rule-item">
                  <el-icon color="#67c23a"><Check /></el-icon>
                  <span>{{ rule }}</span>
                </div>
              </div>
            </el-descriptions-item>
            <el-descriptions-item label="服务权限" :span="3">
              <div class="tag-group">
                <el-tag
                  v-for="perm in levelResult.service_permissions"
                  :key="perm"
                  type="primary"
                  effect="plain"
                  size="small"
                  style="margin-right: 4px; margin-bottom: 4px"
                >
                  {{ perm }}
                </el-tag>
              </div>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <el-divider v-if="precheckResult && (precheckResult.errors.length > 0 || precheckResult.warnings.length > 0)" content-position="left">
          前置校验结果
        </el-divider>
        <div v-if="precheckResult" class="precheck-result">
          <el-alert
            v-if="precheckResult.blocked"
            :title="precheckResult.block_reason || '存在严重校验错误，已被拦截'"
            type="error"
            :closable="false"
            show-icon
            style="margin-bottom: 12px"
          />
          <el-alert
            v-for="(err, idx) in precheckResult.errors"
            :key="'err-' + idx"
            :title="err.message"
            type="error"
            :closable="false"
            show-icon
            style="margin-bottom: 8px"
          />
          <el-alert
            v-for="(warn, idx) in precheckResult.warnings"
            :key="'warn-' + idx"
            :title="warn"
            type="warning"
            :closable="false"
            show-icon
            style="margin-bottom: 8px"
          />
          <el-row v-if="precheckResult.missing_fields.length > 0" :gutter="12" class="missing-fields">
            <el-col :span="24">
              <el-text type="warning">缺失信息项：</el-text>
              <el-tag
                v-for="f in precheckResult.missing_fields"
                :key="f"
                type="warning"
                effect="dark"
                size="small"
                style="margin-left: 6px"
              >
                {{ getFieldLabel(f) }}
              </el-tag>
            </el-col>
          </el-row>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="formDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
          提交建档
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailDialogVisible" title="客户档案详情" width="900px">
      <CcbDetailPanel v-if="currentProfile" :data="currentProfile" type="customer-profile" />
    </el-dialog>

    <el-dialog v-model="logsDialogVisible" title="档案变更日志" width="800px">
      <el-timeline>
        <el-timeline-item
          v-for="log in profileLogs"
          :key="log.id"
          :timestamp="log.operateTime"
          :type="getLogTimelineType(log.changeType)"
          :hollow="log.changeType === '7'"
        >
          <el-card shadow="never" class="log-card">
            <div class="log-header">
              <el-tag :type="getLogTagType(log.changeType)" effect="light">
                {{ log.changeTypeName }}
              </el-tag>
              <span class="log-operator">
                {{ log.operatorName || '系统' }}
                <span v-if="log.operatorOrgName">@{{ log.operatorOrgName }}</span>
              </span>
            </div>
            <div v-if="log.changeRemark" class="log-remark">{{ log.changeRemark }}</div>
            <div v-if="log.beforeContent || log.afterContent" class="log-detail">
              <div v-if="log.reviewerName" class="review-info">
                <el-icon color="#e6a23c"><Stamp /></el-icon>
                复核人：{{ log.reviewerName }}，复核时间：{{ log.reviewTime }}
              </div>
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </el-dialog>

    <el-dialog v-model="reviewDialogVisible" title="异常档案复核" width="600px">
      <el-form :model="reviewForm" label-width="100px">
        <el-form-item label="档案编号">
          <el-text>{{ currentProfile?.profileNo }}</el-text>
        </el-form-item>
        <el-form-item label="客户姓名">
          <el-text>{{ currentProfile?.customerName }}</el-text>
        </el-form-item>
        <el-form-item label="异常原因">
          <el-text type="danger">{{ currentProfile?.abnormalReason }}</el-text>
        </el-form-item>
        <el-form-item label="复核结果" prop="passed">
          <el-radio-group v-model="reviewForm.passed">
            <el-radio :value="true">
              <el-icon color="#67c23a"><CircleCheckFilled /></el-icon>
              复核通过，解除锁定
            </el-radio>
            <el-radio :value="false">
              <el-icon color="#f56c6c"><CircleCloseFilled /></el-icon>
              复核不通过，予以销户
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="复核意见" prop="reviewRemark">
          <el-input
            v-model="reviewForm.reviewRemark"
            type="textarea"
            :rows="3"
            placeholder="请输入复核意见"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reviewDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmitReview">
          提交复核
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Upload,
  Search,
  CircleCheckFilled,
  CircleCloseFilled,
  QuestionFilled,
  Check,
  Stamp
} from '@element-plus/icons-vue'
import {
  getCustomerProfileListApi,
  getCustomerProfileDetailApi,
  createCustomerProfileApi,
  updateCustomerProfileApi,
  preCheckCustomerProfileApi,
  getCustomerProfileLogsApi,
  reviewAbnormalProfileApi,
  type CustomerProfile,
  type CustomerProfileForm,
  type CustomerProfileLog,
  type PreCheckResult,
  type ReviewAbnormalRequest
} from '@api/business'
import { maskPhone, maskIdCard, formatMoney } from '@utils'

const router = useRouter()

const listLoading = ref<boolean>(false)
const formLoading = ref<boolean>(false)
const submitLoading = ref<boolean>(false)
const tableData = ref<CustomerProfile[]>([])
const total = ref<number>(0)
const selectedRows = ref<CustomerProfile[]>([])
const shakeField = ref<string>('')

const searchForm = reactive({
  customerName: '',
  profileNo: '',
  idCardNo: '',
  mobile: '',
  customerLevel: null as number | null,
  status: null as number | null,
  needComplete: null as number | null
})

const pageParams = reactive({
  page: 1,
  pageSize: 10
})

const stats = computed(() => {
  const result = { normal: 0, needComplete: 0, abnormal: 0 }
  tableData.value.forEach(row => {
    if (row.status === 1 || row.status === 2) result.normal++
    if (row.needComplete === 1) result.needComplete++
    if (row.isAbnormal === 1) result.abnormal++
  })
  return result
})

const formDialogVisible = ref<boolean>(false)
const detailDialogVisible = ref<boolean>(false)
const logsDialogVisible = ref<boolean>(false)
const reviewDialogVisible = ref<boolean>(false)

const isEdit = ref<boolean>(false)
const currentProfile = ref<CustomerProfile | null>(null)
const profileLogs = ref<CustomerProfileLog[]>([])
const precheckResult = ref<PreCheckResult | null>(null)
const levelJudged = ref<boolean>(false)
const levelResult = reactive({
  customer_level: 1,
  customer_level_text: '普通客户',
  customer_tags: ['普通客户', '新客'],
  service_permissions: ['基础查询', '基础存取款', '基础转账'],
  judge_factors: { total_assets: 0, monthly_transaction_count: 0, retention_days: 0 },
  judge_rules: ['未达到升级条件，默认为普通客户']
})

const profileFormRef = ref<FormInstance>()
const profileForm = reactive<CustomerProfileForm>({
  customer_name: '',
  id_card_no: '',
  id_type: 1,
  gender: 'M',
  birth_date: '',
  nation: '',
  mobile: '',
  email: '',
  registered_address: '',
  residential_address: '',
  occupation: '',
  employer: '',
  position: '',
  education: '',
  marital_status: '',
  total_assets: 0,
  monthly_transaction_count: 0,
  retention_days: 0
})

const reviewForm = reactive<ReviewAbnormalRequest>({
  profile_id: '',
  passed: true,
  review_remark: ''
})

const fieldLabelMap: Record<string, string> = {
  customer_name: '客户姓名',
  id_card_no: '证件号码',
  gender: '性别',
  mobile: '手机号',
  registered_address: '户籍地址',
  residential_address: '居住地址',
  occupation: '职业',
  employer: '工作单位'
}

const formRules: FormRules = {
  customerName: [{ required: true, message: '请输入客户姓名', trigger: 'blur' }],
  idCardNo: [
    { required: true, message: '请输入证件号码', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value && !/^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/.test(value)) {
          callback(new Error('身份证号码格式不正确'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  mobile: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ],
  registeredAddress: [{ required: true, message: '请输入户籍地址', trigger: 'blur' }],
  residentialAddress: [{ required: true, message: '请输入居住地址', trigger: 'blur' }]
}

const fetchData = async (): Promise<void> => {
  listLoading.value = true
  try {
    const params: any = {
      page: pageParams.page,
      pageSize: pageParams.pageSize,
      customer_name: searchForm.customerName || undefined,
      profile_no: searchForm.profileNo || undefined,
      id_card_no: searchForm.idCardNo || undefined,
      mobile: searchForm.mobile || undefined,
      customer_level: searchForm.customerLevel ?? undefined,
      status: searchForm.status ?? undefined
    }
    if (searchForm.needComplete === 1) {
      params.need_complete = 1
    } else if (searchForm.needComplete === 2) {
      params.is_abnormal = 1
    }
    const res = await getCustomerProfileListApi(params)
    tableData.value = res.data.list.map((item: any) => transformKeys(item))
    total.value = res.data.total
  } catch (_e) {
  } finally {
    listLoading.value = false
  }
}

const transformKeys = (obj: any): any => {
  const result: any = {}
  for (const key of Object.keys(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
    result[camelKey] = obj[key]
  }
  return result
}

const handleSearch = (): void => {
  pageParams.page = 1
  fetchData()
}

const handleReset = (): void => {
  searchForm.customerName = ''
  searchForm.profileNo = ''
  searchForm.idCardNo = ''
  searchForm.mobile = ''
  searchForm.customerLevel = null
  searchForm.status = null
  searchForm.needComplete = null
  pageParams.page = 1
  fetchData()
}

const handlePageChange = (): void => {
  fetchData()
}

const handleSelectionChange = (val: unknown[]): void => {
  selectedRows.value = val as CustomerProfile[]
}

const handleAdd = (): void => {
  isEdit.value = false
  currentProfile.value = null
  resetProfileForm()
  precheckResult.value = null
  levelJudged.value = false
  judgeLevel()
  formDialogVisible.value = true
}

const handleEdit = (row: CustomerProfile): void => {
  isEdit.value = true
  currentProfile.value = row
  formLoading.value = true
  formDialogVisible.value = true
  precheckResult.value = null
  setTimeout(async () => {
    try {
      const res = await getCustomerProfileDetailApi(row.id)
      const data = transformKeys(res.data)
      Object.assign(profileForm, {
        id: data.id,
        org_id: data.orgId,
        customer_name: data.customerName,
        id_card_no: data.idCardNo,
        id_type: data.idType || 1,
        gender: data.gender || 'M',
        birth_date: data.birthDate || '',
        nation: data.nation || '',
        mobile: data.mobile,
        email: data.email || '',
        registered_address: data.registeredAddress,
        residential_address: data.residentialAddress,
        occupation: data.occupation || '',
        employer: data.employer || '',
        position: data.position || '',
        education: data.education || '',
        marital_status: data.maritalStatus || '',
        total_assets: data.totalAssets || 0,
        monthly_transaction_count: data.monthlyTransactionCount || 0,
        retention_days: data.retentionDays || 0
      })
      levelJudged.value = true
      const levelMap: Record<number, string> = {
        1: '普通客户', 2: '优质客户', 3: '贵宾客户', 4: '潜力客户'
      }
      levelResult.customer_level = data.customerLevel
      levelResult.customer_level_text = levelMap[data.customerLevel] || '普通客户'
      levelResult.customer_tags = data.customerTagList || []
      levelResult.service_permissions = data.servicePermissionList || []
      levelResult.judge_factors = {
        total_assets: data.totalAssets || 0,
        monthly_transaction_count: data.monthlyTransactionCount || 0,
        retention_days: data.retentionDays || 0
      }
      levelResult.judge_rules = [`当前等级：${levelMap[data.customerLevel]}`]
    } catch (_e) {
    } finally {
      formLoading.value = false
    }
  }, 300)
}

const handleView = async (row: CustomerProfile): Promise<void> => {
  currentProfile.value = row
  detailDialogVisible.value = true
}

const handleViewLogs = async (row: CustomerProfile): Promise<void> => {
  currentProfile.value = row
  try {
    const res = await getCustomerProfileLogsApi(row.id)
    profileLogs.value = res.data.map((item: any) => transformKeys(item))
    logsDialogVisible.value = true
  } catch (_e) {
    ElMessage.error('获取日志失败')
  }
}

const handleReview = (row: CustomerProfile): void => {
  currentProfile.value = row
  reviewForm.profile_id = row.id
  reviewForm.passed = true
  reviewForm.review_remark = ''
  reviewDialogVisible.value = true
}

const handleSubmitReview = async (): Promise<void> => {
  if (!reviewForm.review_remark.trim()) {
    ElMessage.warning('请输入复核意见')
    return
  }
  submitLoading.value = true
  try {
    await reviewAbnormalProfileApi(reviewForm)
    ElMessage.success('复核成功')
    reviewDialogVisible.value = false
    fetchData()
  } catch (_e) {
  } finally {
    submitLoading.value = false
  }
}

const handleGoBatch = (): void => {
  router.push('/business/customer-profile/batch')
}

const handleGoTrace = (): void => {
  router.push('/business/customer-profile/trace')
}

const resetProfileForm = (): void => {
  profileForm.id = undefined
  profileForm.customer_name = ''
  profileForm.id_card_no = ''
  profileForm.id_type = 1
  profileForm.gender = 'M'
  profileForm.birth_date = ''
  profileForm.nation = ''
  profileForm.mobile = ''
  profileForm.email = ''
  profileForm.registered_address = ''
  profileForm.residential_address = ''
  profileForm.occupation = ''
  profileForm.employer = ''
  profileForm.position = ''
  profileForm.education = ''
  profileForm.marital_status = ''
  profileForm.total_assets = 0
  profileForm.monthly_transaction_count = 0
  profileForm.retention_days = 0
  profileForm.skip_precheck = false
  profileFormRef.value?.resetFields()
}

const triggerShake = (field: string): void => {
  const fieldMap: Record<string, string> = {
    customer_name: 'customerName',
    id_card_no: 'idCardNo',
    mobile: 'mobile',
    registered_address: 'registeredAddress',
    residential_address: 'residentialAddress'
  }
  shakeField.value = fieldMap[field] || field
  setTimeout(() => {
    shakeField.value = ''
  }, 600)
}

const triggerFieldPrecheck = async (_field: string): Promise<void> => {
  if (!isEdit.value && profileForm.customer_name && profileForm.id_card_no && profileForm.mobile) {
    try {
      const res = await preCheckCustomerProfileApi({ ...profileForm })
      precheckResult.value = res.data
      for (const err of res.data.errors) {
        triggerShake(err.field)
      }
    } catch (_e) {
    }
  }
}

const judgeLevel = (): void => {
  const assets = Number(profileForm.total_assets) || 0
  const transactions = Number(profileForm.monthly_transaction_count) || 0
  const retention = Number(profileForm.retention_days) || 0
  levelResult.judge_factors = {
    total_assets: assets,
    monthly_transaction_count: transactions,
    retention_days: retention
  }

  const rules: string[] = []
  let level = 1

  if (assets >= 1000000 && transactions >= 30 && retention >= 365) {
    level = 3
    rules.push(`资产规模≥100万元（${assets.toLocaleString()}元）`)
    rules.push(`月交易频次≥30笔（${transactions}笔）`)
    rules.push(`留存时长≥365天（${retention}天）`)
  } else if (assets >= 100000 && transactions >= 10 && retention >= 90) {
    level = 2
    rules.push(`资产规模≥10万元（${assets.toLocaleString()}元）`)
    rules.push(`月交易频次≥10笔（${transactions}笔）`)
    rules.push(`留存时长≥90天（${retention}天）`)
  } else if (assets >= 50000 && retention >= 180) {
    level = 4
    rules.push(`资产规模≥5万元（${assets.toLocaleString()}元）`)
    rules.push(`留存时长≥180天（${retention}天）`)
  } else {
    level = 1
    rules.push('未达到升级条件，默认为普通客户')
  }

  const levelConfig: Record<number, { name: string; tags: string[]; perms: string[] }> = {
    1: { name: '普通客户', tags: ['普通客户', '新客'], perms: ['基础查询', '基础存取款', '基础转账'] },
    2: { name: '优质客户', tags: ['优质客户', '活跃客户'], perms: ['基础查询', '基础存取款', '基础转账', '理财产品购买', '小额贷款'] },
    3: { name: '贵宾客户', tags: ['贵宾客户', '高净值客户', '专属服务'], perms: ['基础查询', '基础存取款', '基础转账', '理财产品购买', '大额贷款', '私人银行服务', '专属理财顾问'] },
    4: { name: '潜力客户', tags: ['潜力客户', '成长型客户'], perms: ['基础查询', '基础存取款', '基础转账', '理财产品推荐', '信用卡升级'] }
  }

  levelResult.customer_level = level
  levelResult.customer_level_text = levelConfig[level].name
  levelResult.customer_tags = levelConfig[level].tags
  levelResult.service_permissions = levelConfig[level].perms
  levelResult.judge_rules = rules
  levelJudged.value = true
}

const handleSubmit = async (): Promise<void> => {
  if (!profileFormRef.value) return
  try {
    await profileFormRef.value.validate()
  } catch (_e) {
    ElMessage.warning('请完善必填项')
    return
  }

  if (!isEdit.value) {
    submitLoading.value = true
    try {
      const res = await preCheckCustomerProfileApi({ ...profileForm })
      precheckResult.value = res.data
      for (const err of res.data.errors) {
        triggerShake(err.field)
      }
      if (res.data.blocked) {
        ElMessage.error(res.data.block_reason || '前置校验拦截，无法建档')
        submitLoading.value = false
        return
      }
      if (res.data.errors.length > 0) {
        ElMessageBox.confirm(
          `存在${res.data.errors.length}项校验错误，是否强制提交建档？`,
          '校验警告',
          {
            confirmButtonText: '强制提交',
            cancelButtonText: '返回修改',
            type: 'warning'
          }
        )
          .then(async () => {
            profileForm.skip_precheck = true
            await doSubmit()
          })
          .catch(() => {
            submitLoading.value = false
          })
        return
      }
    } catch (_e) {
      submitLoading.value = false
      return
    }
  }

  await doSubmit()
}

const doSubmit = async (): Promise<void> => {
  submitLoading.value = true
  try {
    if (isEdit.value) {
      await updateCustomerProfileApi(profileForm)
      ElMessage.success('档案更新成功')
    } else {
      await createCustomerProfileApi(profileForm)
      ElMessage.success('客户建档成功')
    }
    formDialogVisible.value = false
    fetchData()
  } catch (_e) {
  } finally {
    submitLoading.value = false
  }
}

const getLevelTagType = (level: number): string => {
  const map: Record<number, string> = { 1: 'info', 2: 'success', 3: 'warning', 4: 'primary' }
  return map[level] || 'info'
}

const getStatusClass = (status: number): string => {
  if (status === 1) return 'status-pass'
  if (status === 2) return 'status-fail'
  return 'status-unknown'
}

const getStatusTagType = (status: number): string => {
  const map: Record<number, string> = { 0: 'info', 1: 'success', 2: 'warning', 3: 'info', 4: 'danger' }
  return map[status] || 'info'
}

const getFieldLabel = (key: string): string => fieldLabelMap[key] || key

const getLogTimelineType = (changeType: string): string => {
  const map: Record<string, string> = {
    '1': 'primary', '2': 'warning', '3': 'success', '4': 'info',
    '5': 'danger', '6': 'warning', '7': 'success'
  }
  return map[changeType] || 'primary'
}

const getLogTagType = (changeType: string): string => {
  const map: Record<string, string> = {
    '1': 'primary', '2': 'warning', '3': 'success', '4': 'info',
    '5': 'danger', '6': '', '7': 'success'
  }
  return map[changeType] || ''
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.ccb-customer-profile {
  .skeleton-wrapper {
    padding: 20px;
    background: #fff;
    border-radius: 4px;
  }

  .verify-status-group {
    display: flex;
    gap: 6px;

    .verify-icon {
      font-size: 16px;

      &.status-pass {
        color: #67c23a;
      }
      &.status-fail {
        color: #f56c6c;
      }
      &.status-unknown {
        color: #c0c4cc;
      }
    }
  }

  .tag-group {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .profile-form {
    :deep(.el-form-item) {
      margin-bottom: 14px;
    }
  }

  .shake-error {
    animation: shakeRed 0.5s;

    :deep(.el-input__wrapper),
    :deep(.el-textarea__inner) {
      border-color: #f56c6c !important;
      box-shadow: 0 0 0 1px #f56c6c inset !important;
      background-color: #fef0f0 !important;
    }
  }

  .level-preview {
    padding: 12px 0;

    .judge-rules {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .rule-item {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: #606266;
      }
    }
  }

  .precheck-result {
    margin-bottom: 10px;

    .missing-fields {
      padding: 10px;
      background: #fdf6ec;
      border-radius: 4px;
    }
  }

  .log-card {
    border: none;
    padding: 8px 0;

    :deep(.el-card__body) {
      padding: 12px;
    }

    .log-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;

      .log-operator {
        font-size: 12px;
        color: #909399;
      }
    }

    .log-remark {
      font-size: 13px;
      color: #606266;
      margin-bottom: 6px;
    }

    .log-detail {
      .review-info {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        color: #e6a23c;
        padding: 6px;
        background: #fdf6ec;
        border-radius: 4px;
      }
    }
  }

  .form-skeleton {
    padding: 20px 0;
  }
}

@keyframes shakeRed {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}
</style>
