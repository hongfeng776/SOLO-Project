<template>
  <div class="qualification-page">
    <SearchForm @search="handleSearch" @reset="handleReset">
      <el-form-item label="企业名称" prop="companyName">
        <el-input v-model="searchForm.companyName" placeholder="请输入" clearable style="width: 180px" />
      </el-form-item>
      <el-form-item label="信用代码" prop="unifiedCreditCode">
        <el-input v-model="searchForm.unifiedCreditCode" placeholder="请输入" clearable style="width: 180px" />
      </el-form-item>
      <el-form-item label="审核状态" prop="auditStatus">
        <el-select v-model="searchForm.auditStatus" placeholder="全部" clearable style="width: 140px">
          <el-option
            v-for="(label, key) in QualificationAuditStatusLabel"
            :key="key"
            :label="label"
            :value="key"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="注册时间" prop="registerDateRange">
        <el-date-picker
          v-model="registerDateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始"
          end-placeholder="结束"
          value-format="YYYY-MM-DD"
          style="width: 240px"
          @change="handleDateChange"
        />
      </el-form-item>
    </SearchForm>

    <ProTable
      :data="tableData"
      :loading="loading"
      :total="total"
      :page="page"
      :page-size="pageSize"
      show-selection
      @selection-change="handleSelectionChange"
      @page-change="handlePageChange"
    >
      <template #toolbar>
        <div class="toolbar-left">
          <el-button type="primary" :icon="Plus" @click="handleAdd">录入资质</el-button>
          <el-button type="success" :icon="Upload" @click="batchImportVisible = true">批量导入</el-button>
          <el-button type="danger" :icon="Delete" :disabled="selectedIds.length === 0" @click="handleBatchDelete">
            批量删除
          </el-button>
        </div>
      </template>

      <el-table-column prop="companyName" label="企业名称" min-width="180" show-overflow-tooltip />
      <el-table-column prop="unifiedCreditCode" label="统一社会信用代码" width="200" />
      <el-table-column prop="legalPerson" label="法定代表人" width="100" />
      <el-table-column label="行业分类" width="100">
        <template #default="{ row }">{{ row.industryCategory || '-' }}</template>
      </el-table-column>
      <el-table-column label="经营状态" width="80" align="center">
        <template #default="{ row }">
          <el-tag :type="row.businessStatus === 'active' ? 'success' : 'danger'" size="small">
            {{ BusinessStatusLabel[row.businessStatus as BusinessStatus] || row.businessStatus }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="contactPerson" label="联系人" width="90" />
      <el-table-column prop="contactPhone" label="联系电话" width="120" />
      <el-table-column label="审核状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="QualificationAuditStatusType[row.auditStatus as QualificationAuditStatus]" size="small">
            {{ QualificationAuditStatusLabel[row.auditStatus as QualificationAuditStatus] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="280" fixed="right" align="center">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleView(row)">查看</el-button>
          <el-button
            type="primary" link size="small"
            :disabled="row.auditStatus === QualificationAuditStatus.APPROVED"
            @click="handleEdit(row)"
          >编辑</el-button>
          <el-button
            type="success" link size="small"
            :disabled="row.auditStatus !== QualificationAuditStatus.PENDING || !isAdmin"
            @click="handleApprove(row)"
          >通过</el-button>
          <el-button
            type="warning" link size="small"
            :disabled="row.auditStatus !== QualificationAuditStatus.PENDING || !isAdmin"
            @click="handleReject(row)"
          >驳回</el-button>
          <el-button
            type="info" link size="small"
            :disabled="!isAdmin"
            @click="handleInvalidate(row)"
          >作废</el-button>
          <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </ProTable>

    <!-- 录入/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="800px"
      :close-on-click-modal="false"
      @close="handleDialogClose"
    >
      <div v-if="!preConditionPassed && !isEdit" class="pre-condition-block">
        <el-alert title="前置条件未满足，请先完成以下项目" type="warning" :closable="false" show-icon>
          <template #default>
            <div class="condition-list">
              <div
                v-for="item in missingConditions"
                :key="item.key"
                class="condition-item"
                :class="{ passed: item.passed }"
              >
                <el-icon><component :is="item.passed ? 'CircleCheckFilled' : 'CircleCloseFilled'" /></el-icon>
                <span>{{ item.label }}</span>
              </div>
            </div>
          </template>
        </el-alert>
      </div>

      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="140px"
        :class="{ 'form-shake': isShaking }"
        :disabled="!preConditionPassed && !isEdit"
      >
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="企业名称" prop="companyName">
              <el-input
                v-model="formData.companyName"
                placeholder="请输入企业名称"
                :class="{ 'input-error': nameCodeMismatch }"
                @blur="validateNameCodeMatch"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="统一社会信用代码" prop="unifiedCreditCode">
              <el-input
                v-model="formData.unifiedCreditCode"
                placeholder="请输入18位信用代码"
                maxlength="18"
                :class="{ 'input-error': nameCodeMismatch || !creditCodeValid }"
                @blur="validateCreditCodeLive"
              >
                <template #suffix>
                  <el-icon v-if="creditCodeValidating" class="is-loading"><Loading /></el-icon>
                  <el-icon v-else-if="creditCodeValid" style="color: #10b981"><CircleCheckFilled /></el-icon>
                  <el-icon v-else-if="formData.unifiedCreditCode && !creditCodeValid" style="color: #ef4444"><CircleCloseFilled /></el-icon>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-alert
          v-if="nameCodeMismatch"
          title="企业名称与信用代码不匹配，提交按钮已锁定"
          type="error"
          :closable="false"
          show-icon
          class="mb-base"
        />

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="注册地址" prop="registeredAddress">
              <el-input v-model="formData.registeredAddress" placeholder="请输入注册地址" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="法定代表人" prop="legalPerson">
              <el-input v-model="formData.legalPerson" placeholder="请输入法定代表人" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="法人身份证号" prop="legalPersonIdCard">
              <el-input v-model="formData.legalPersonIdCard" placeholder="请输入法人身份证号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="行业分类" prop="industryCategory">
              <el-select v-model="formData.industryCategory" placeholder="请选择" style="width: 100%">
                <el-option v-for="item in INDUSTRY_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="经营状态" prop="businessStatus">
              <el-select v-model="formData.businessStatus" placeholder="请选择" style="width: 100%">
                <el-option
                  v-for="(label, key) in BusinessStatusLabel"
                  :key="key"
                  :label="label"
                  :value="key"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="注册资本" prop="registeredCapital">
              <el-input v-model="formData.registeredCapital" placeholder="请输入注册资本" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="成立日期" prop="establishedDate">
              <el-date-picker v-model="formData.establishedDate" type="date" placeholder="选择日期" style="width: 100%" value-format="YYYY-MM-DD" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="营业执照编号" prop="businessLicenseNo">
              <el-input v-model="formData.businessLicenseNo" placeholder="请输入" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="执照有效期起" prop="businessLicenseStart">
              <el-date-picker v-model="formData.businessLicenseStart" type="date" placeholder="选择日期" style="width: 100%" value-format="YYYY-MM-DD" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="执照有效期止" prop="businessLicenseEnd">
              <el-date-picker
                v-model="formData.businessLicenseEnd"
                type="date"
                placeholder="选择日期"
                style="width: 100%"
                value-format="YYYY-MM-DD"
                :class="{ 'input-error': licenseExpired }"
              />
              <div v-if="licenseExpired" class="error-hint">营业执照已过期</div>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="联系人" prop="contactPerson">
              <el-input v-model="formData.contactPerson" placeholder="请输入联系人" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="contactPhone">
              <el-input v-model="formData.contactPhone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="经营范围" prop="businessScope">
          <el-input v-model="formData.businessScope" type="textarea" :rows="2" placeholder="请输入经营范围" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="formData.remark" type="textarea" :rows="2" placeholder="请输入备注" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="实名认证" prop="isRealNameVerified">
              <el-switch v-model="formData.isRealNameVerified" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="联系邮箱" prop="contactEmail">
              <el-input v-model="formData.contactEmail" placeholder="请输入" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="submitLoading"
          :disabled="nameCodeMismatch || (!preConditionPassed && !isEdit)"
          @click="handleSubmit"
        >
          {{ isEdit ? '更新' : '提交审核' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" title="企业资质详情" width="750px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="企业名称" :span="2">{{ detailData.companyName }}</el-descriptions-item>
        <el-descriptions-item label="统一社会信用代码" :span="2">{{ detailData.unifiedCreditCode }}</el-descriptions-item>
        <el-descriptions-item label="注册地址" :span="2">{{ detailData.registeredAddress }}</el-descriptions-item>
        <el-descriptions-item label="法定代表人">{{ detailData.legalPerson }}</el-descriptions-item>
        <el-descriptions-item label="法人身份证号">{{ detailData.legalPersonIdCard || '-' }}</el-descriptions-item>
        <el-descriptions-item label="行业分类">{{ detailData.industryCategory }}</el-descriptions-item>
        <el-descriptions-item label="经营状态">
          <el-tag :type="detailData.businessStatus === 'active' ? 'success' : 'danger'" size="small">
            {{ BusinessStatusLabel[detailData.businessStatus as BusinessStatus] || detailData.businessStatus }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="注册资本">{{ detailData.registeredCapital || '-' }}</el-descriptions-item>
        <el-descriptions-item label="成立日期">{{ detailData.establishedDate || '-' }}</el-descriptions-item>
        <el-descriptions-item label="营业执照编号">{{ detailData.businessLicenseNo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="执照有效期">
          {{ detailData.businessLicenseStart || '-' }} 至 {{ detailData.businessLicenseEnd || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="联系人">{{ detailData.contactPerson }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ detailData.contactPhone }}</el-descriptions-item>
        <el-descriptions-item label="联系邮箱">{{ detailData.contactEmail || '-' }}</el-descriptions-item>
        <el-descriptions-item label="实名认证">
          <el-tag :type="detailData.isRealNameVerified ? 'success' : 'danger'" size="small">
            {{ detailData.isRealNameVerified ? '已认证' : '未认证' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="审核状态">
          <el-tag :type="QualificationAuditStatusType[detailData.auditStatus as QualificationAuditStatus]">
            {{ QualificationAuditStatusLabel[detailData.auditStatus as QualificationAuditStatus] }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="驳回原因" :span="2" v-if="detailData.rejectReason">
          <span style="color: #ef4444">{{ detailData.rejectReason }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="经营范围" :span="2">{{ detailData.businessScope || '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">
          <el-tooltip v-if="(detailData.remark || '').length > 50" :content="detailData.remark" placement="top">
            {{ (detailData.remark || '').substring(0, 50) }}...
          </el-tooltip>
          <span v-else>{{ detailData.remark || '-' }}</span>
        </el-descriptions-item>
      </el-descriptions>

      <div v-if="detailData.auditLogs && detailData.auditLogs.length > 0" class="audit-log-section">
        <h4 class="audit-log-title">审核日志</h4>
        <el-timeline>
          <el-timeline-item
            v-for="log in detailData.auditLogs"
            :key="log.id"
            :timestamp="log.created_at"
            placement="top"
          >
            <div class="log-content">
              <span class="log-action">{{ getActionLabel(log.action) }}</span>
              <span class="log-operator">{{ log.operatorName || '系统' }}</span>
              <span v-if="log.remark" class="log-remark">{{ log.remark }}</span>
            </div>
          </el-timeline-item>
        </el-timeline>
      </div>
    </el-dialog>

    <!-- 驳回弹窗 -->
    <el-dialog v-model="rejectVisible" title="审核驳回" width="500px">
      <el-form ref="rejectFormRef" :model="rejectForm" :rules="rejectRules" label-width="80px">
        <el-form-item label="驳回原因" prop="rejectReason">
          <el-input v-model="rejectForm.rejectReason" type="textarea" :rows="4" placeholder="请输入驳回原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectVisible = false">取消</el-button>
        <el-button type="danger" :loading="rejectLoading" @click="confirmReject">确认驳回</el-button>
      </template>
    </el-dialog>

    <!-- 批量导入弹窗 -->
    <el-dialog v-model="batchImportVisible" title="批量导入企业资质" width="700px">
      <el-alert
        title="导入说明"
        type="info"
        :closable="false"
        class="mb-base"
        description="支持批量导入企业资质信息，系统将自动区分新增、更新、无效三类数据。仅管理员可执行全局操作，普通HR仅可操作本人创建的数据。"
      />
      <div class="import-template mb-base">
        <el-button type="primary" link @click="downloadTemplate">下载导入模板</el-button>
      </div>
      <el-input
        v-model="importJson"
        type="textarea"
        :rows="8"
        placeholder='请粘贴JSON格式数据，例如：[{"companyName":"企业A","unifiedCreditCode":"91110108MA01ABCDEF","registeredAddress":"北京市","legalPerson":"张三","industryCategory":"信息技术","contactPerson":"李四","contactPhone":"13800138000"}]'
      />
      <div v-if="importResult" class="import-result mt-base">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="总计">{{ importResult.total }}</el-descriptions-item>
          <el-descriptions-item label="新增">
            <span style="color: #10b981">{{ importResult.added }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="更新">
            <span style="color: #3b82f6">{{ importResult.updated }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="无效">
            <span style="color: #ef4444">{{ importResult.invalid }}</span>
          </el-descriptions-item>
        </el-descriptions>
        <div v-if="importResult.errors.length > 0" class="import-errors mt-sm">
          <h4>异常清单：</h4>
          <div v-for="(err, idx) in importResult.errors" :key="idx" class="error-item">
            第{{ err.row }}行 - {{ err.field }}: {{ err.message }}
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="batchImportVisible = false; importResult = null; importJson = ''">关闭</el-button>
        <el-button type="primary" :loading="importLoading" @click="handleBatchImport">
          {{ importLoading ? `导入中 ${importProgress}%` : '开始导入' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 重复检测确认弹窗 -->
    <el-dialog v-model="duplicateVisible" title="重复资质检测" width="500px">
      <el-alert type="warning" :closable="false" show-icon>
        <template #title>检测到相似企业资质信息</template>
        <template #default>
          <p>近30天内已存在相同信用代码的资质记录，请确认是否继续提交？</p>
        </template>
      </el-alert>
      <div v-if="duplicateInfo.existingRecords.length > 0" class="mt-base">
        <div v-for="record in duplicateInfo.existingRecords" :key="record.id" class="duplicate-item">
          <span>{{ record.companyName }}</span>
          <el-tag size="small" :type="QualificationAuditStatusType[record.auditStatus as QualificationAuditStatus]">
            {{ QualificationAuditStatusLabel[record.auditStatus as QualificationAuditStatus] }}
          </el-tag>
        </div>
      </div>
      <template #footer>
        <el-button @click="duplicateVisible = false">取消</el-button>
        <el-button type="primary" @click="forceSubmit">确认提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { Plus, Delete, Upload, Loading, CircleCheckFilled, CircleCloseFilled } from '@element-plus/icons-vue';
import dayjs from 'dayjs';
import { SearchForm, ProTable } from '@/components';
import { useUserStore } from '@/store/modules/user';
import {
  getQualificationListApi,
  createQualificationApi,
  updateQualificationApi,
  deleteQualificationApi,
  batchDeleteQualificationApi,
  approveQualificationApi,
  rejectQualificationApi,
  invalidateQualificationApi,
  batchImportQualificationApi,
  checkQualificationDuplicateApi,
  validateCreditCodeApi,
  type QualificationItem,
  type BatchImportResult,
  type DuplicateCheckResult,
} from '@/api/qualification';
import {
  QualificationAuditStatus,
  QualificationAuditStatusLabel,
  QualificationAuditStatusType,
  BusinessStatus,
  BusinessStatusLabel,
  INDUSTRY_OPTIONS,
  DATETIME_FORMAT,
} from '@/constants/recruitment';

const userStore = useUserStore();
const isAdmin = computed(() => userStore.userInfo?.role === 'admin');

const loading = ref(false);
const tableData = ref<QualificationItem[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const selectedIds = ref<number[]>([]);
const registerDateRange = ref<string[]>([]);

const searchForm = reactive({
  companyName: '',
  unifiedCreditCode: '',
  auditStatus: '',
  registerDateStart: '',
  registerDateEnd: '',
});

const dialogVisible = ref(false);
const dialogTitle = ref('');
const isEdit = ref(false);
const submitLoading = ref(false);
const formRef = ref<FormInstance>();

const formData = reactive<any>({
  companyName: '',
  unifiedCreditCode: '',
  registeredAddress: '',
  legalPerson: '',
  legalPersonIdCard: '',
  businessStatus: 'active',
  industryCategory: '',
  businessScope: '',
  registeredCapital: '',
  establishedDate: '',
  businessLicenseNo: '',
  businessLicenseStart: '',
  businessLicenseEnd: '',
  contactPerson: '',
  contactPhone: '',
  contactEmail: '',
  isRealNameVerified: false,
  remark: '',
});

const formRules: FormRules = {
  companyName: [{ required: true, message: '请输入企业名称', trigger: 'blur' }],
  unifiedCreditCode: [{ required: true, message: '请输入统一社会信用代码', trigger: 'blur' }],
  registeredAddress: [{ required: true, message: '请输入注册地址', trigger: 'blur' }],
  legalPerson: [{ required: true, message: '请输入法定代表人', trigger: 'blur' }],
  industryCategory: [{ required: true, message: '请选择行业分类', trigger: 'change' }],
  contactPerson: [{ required: true, message: '请输入联系人', trigger: 'blur' }],
  contactPhone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }],
};

const preConditionPassed = computed(() => {
  return formData.isRealNameVerified && !!formData.industryCategory && !!formData.businessStatus;
});

const missingConditions = computed(() => [
  { key: 'isRealNameVerified', label: '账号实名认证', passed: formData.isRealNameVerified },
  { key: 'industryCategory', label: '行业分类选择', passed: !!formData.industryCategory },
  { key: 'businessStatus', label: '经营状态填报', passed: !!formData.businessStatus },
]);

const nameCodeMismatch = ref(false);
const creditCodeValid = ref(false);
const creditCodeValidating = ref(false);
const isShaking = ref(false);

const licenseExpired = computed(() => {
  if (!formData.businessLicenseEnd) return false;
  return dayjs(formData.businessLicenseEnd).isBefore(dayjs());
});

const detailVisible = ref(false);
const detailData = ref<any>({});

const rejectVisible = ref(false);
const rejectLoading = ref(false);
const rejectFormRef = ref<FormInstance>();
const currentRejectId = ref(0);
const rejectForm = reactive({ rejectReason: '' });
const rejectRules: FormRules = {
  rejectReason: [{ required: true, message: '请输入驳回原因', trigger: 'blur' }],
};

const batchImportVisible = ref(false);
const importLoading = ref(false);
const importProgress = ref(0);
const importJson = ref('');
const importResult = ref<BatchImportResult | null>(null);

const duplicateVisible = ref(false);
const duplicateInfo = reactive<DuplicateCheckResult>({
  isDuplicate: false,
  existingRecords: [],
  isRecentDuplicate: false,
});

const fetchList = async () => {
  loading.value = true;
  try {
    const res = await getQualificationListApi({
      page: page.value,
      pageSize: pageSize.value,
      ...searchForm,
    });
    tableData.value = res.list;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => { page.value = 1; fetchList(); };
const handleReset = () => { page.value = 1; registerDateRange.value = []; searchForm.registerDateStart = ''; searchForm.registerDateEnd = ''; };
const handlePageChange = (p: number, ps: number) => { page.value = p; pageSize.value = ps; fetchList(); };
const handleSelectionChange = (selection: any[]) => { selectedIds.value = selection.map((i) => i.id); };

const handleDateChange = (val: string[]) => {
  searchForm.registerDateStart = val?.[0] || '';
  searchForm.registerDateEnd = val?.[1] || '';
};

const triggerShake = () => {
  isShaking.value = true;
  setTimeout(() => { isShaking.value = false; }, 200);
};

const validateCreditCodeLive = async () => {
  if (!formData.unifiedCreditCode || formData.unifiedCreditCode.length !== 18) {
    creditCodeValid.value = false;
    if (formData.unifiedCreditCode && formData.unifiedCreditCode.length > 0) {
      triggerShake();
    }
    return;
  }
  creditCodeValidating.value = true;
  try {
    const res = await validateCreditCodeApi(formData.unifiedCreditCode);
    creditCodeValid.value = res.valid;
    if (!res.valid) {
      triggerShake();
    }
  } finally {
    creditCodeValidating.value = false;
  }
};

const validateNameCodeMatch = () => {
  if (formData.companyName && formData.unifiedCreditCode) {
    nameCodeMismatch.value = formData.companyName.length < 2 || formData.unifiedCreditCode.length !== 18;
    if (nameCodeMismatch.value) {
      triggerShake();
    }
  } else {
    nameCodeMismatch.value = false;
  }
};

const resetFormData = () => {
  Object.assign(formData, {
    companyName: '', unifiedCreditCode: '', registeredAddress: '',
    legalPerson: '', legalPersonIdCard: '', businessStatus: 'active',
    industryCategory: '', businessScope: '', registeredCapital: '',
    establishedDate: '', businessLicenseNo: '', businessLicenseStart: '',
    businessLicenseEnd: '', contactPerson: '', contactPhone: '',
    contactEmail: '', isRealNameVerified: false, remark: '',
  });
  nameCodeMismatch.value = false;
  creditCodeValid.value = false;
};

const handleAdd = () => {
  isEdit.value = false;
  dialogTitle.value = '录入企业资质';
  resetFormData();
  dialogVisible.value = true;
};

const handleEdit = (row: QualificationItem) => {
  isEdit.value = true;
  dialogTitle.value = '编辑企业资质';
  Object.assign(formData, row);
  nameCodeMismatch.value = false;
  creditCodeValid.value = true;
  dialogVisible.value = true;
};

const handleView = async (row: QualificationItem) => {
  try {
    const res = await getQualificationDetailApi(row.id);
    detailData.value = res;
    detailVisible.value = true;
  } catch (error) {
    console.error(error);
  }
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    if (!isEdit.value) {
      try {
        const dup = await checkQualificationDuplicateApi(formData.unifiedCreditCode, formData.id);
        if (dup.isDuplicate && dup.isRecentDuplicate) {
          Object.assign(duplicateInfo, dup);
          duplicateVisible.value = true;
          return;
        }
      } catch (e) { /* ignore */ }
    }

    await doSubmit();
  });
};

const forceSubmit = async () => {
  duplicateVisible.value = false;
  await doSubmit();
};

const doSubmit = async () => {
  submitLoading.value = true;
  try {
    if (isEdit.value) {
      await updateQualificationApi(formData.id, formData);
      ElMessage.success('更新成功');
    } else {
      await createQualificationApi(formData);
      ElMessage.success('提交成功');
    }
    dialogVisible.value = false;
    fetchList();
  } finally {
    submitLoading.value = false;
  }
};

const handleApprove = (row: QualificationItem) => {
  ElMessageBox.confirm('确定审核通过该资质吗？', '审核确认', {
    confirmButtonText: '通过',
    cancelButtonText: '取消',
    type: 'success',
  }).then(async () => {
    await approveQualificationApi(row.id, '审核通过');
    ElMessage.success('审核通过');
    fetchList();
  }).catch(() => {});
};

const handleReject = (row: QualificationItem) => {
  currentRejectId.value = row.id;
  rejectForm.rejectReason = '';
  rejectVisible.value = true;
};

const confirmReject = async () => {
  if (!rejectFormRef.value) return;
  await rejectFormRef.value.validate(async (valid) => {
    if (!valid) return;
    rejectLoading.value = true;
    try {
      await rejectQualificationApi(currentRejectId.value, rejectForm.rejectReason);
      ElMessage.success('已驳回');
      rejectVisible.value = false;
      fetchList();
    } finally {
      rejectLoading.value = false;
    }
  });
};

const handleInvalidate = (row: QualificationItem) => {
  ElMessageBox.confirm('确定作废该资质吗？', '作废确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    await invalidateQualificationApi(row.id);
    ElMessage.success('已作废');
    fetchList();
  }).catch(() => {});
};

const handleDelete = (row: QualificationItem) => {
  ElMessageBox.confirm('确定删除该资质吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    await deleteQualificationApi(row.id);
    ElMessage.success('删除成功');
    fetchList();
  }).catch(() => {});
};

const handleBatchDelete = () => {
  ElMessageBox.confirm(`确定删除选中的 ${selectedIds.value.length} 条记录吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    await batchDeleteQualificationApi(selectedIds.value);
    ElMessage.success('批量删除成功');
    fetchList();
  }).catch(() => {});
};

const handleBatchImport = async () => {
  if (!importJson.value.trim()) {
    ElMessage.warning('请输入导入数据');
    return;
  }

  let dataList: any[];
  try {
    dataList = JSON.parse(importJson.value);
    if (!Array.isArray(dataList)) {
      ElMessage.error('数据格式错误，请输入数组格式');
      return;
    }
  } catch {
    ElMessage.error('JSON格式解析失败');
    return;
  }

  importLoading.value = true;
  importProgress.value = 0;

  const timer = setInterval(() => {
    if (importProgress.value < 90) {
      importProgress.value += Math.floor(Math.random() * 15) + 5;
    }
  }, 200);

  try {
    const res = await batchImportQualificationApi(dataList);
    importResult.value = res;
    importProgress.value = 100;
    ElMessage.success(`导入完成：新增${res.added}，更新${res.updated}，无效${res.invalid}`);
    fetchList();
  } catch (error) {
    console.error(error);
  } finally {
    clearInterval(timer);
    importLoading.value = false;
  }
};

const downloadTemplate = () => {
  const template = [{
    companyName: '企业名称',
    unifiedCreditCode: '91110108MA01ABCDEF',
    registeredAddress: '注册地址',
    legalPerson: '法定代表人',
    industryCategory: '信息技术',
    contactPerson: '联系人',
    contactPhone: '13800138000',
  }];
  const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'qualification_import_template.json';
  a.click();
  URL.revokeObjectURL(url);
};

const handleDialogClose = () => {
  formRef.value?.resetFields();
  resetFormData();
};

const getActionLabel = (action: string) => {
  const labels: Record<string, string> = {
    submit: '提交审核', approve: '审核通过', reject: '审核驳回',
    invalidate: '资质作废', resubmit: '重新提交', update: '更新信息',
    batch_create: '批量新增', batch_update: '批量更新',
  };
  return labels[action] || action;
};

onMounted(() => { fetchList(); });
</script>

<style lang="scss" scoped>
.qualification-page {
  .toolbar-left {
    display: flex;
    gap: $spacing-sm;
  }
}

.pre-condition-block {
  margin-bottom: $spacing-base;

  .condition-list {
    display: flex;
    gap: $spacing-lg;
    margin-top: $spacing-sm;
  }

  .condition-item {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    font-size: $font-size-sm;

    &.passed { color: $success-color; }
    &:not(.passed) { color: $danger-color; }
  }
}

.form-shake {
  animation: shake 0.2s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}

:deep(.input-error) {
  :deep(.el-input__wrapper) {
    border-color: $danger-color !important;
    box-shadow: 0 0 0 1px $danger-color inset !important;
  }
}

.input-error {
  :deep(.el-input__wrapper) {
    border-color: $danger-color !important;
    box-shadow: 0 0 0 1px $danger-color inset !important;
  }
}

.error-hint {
  font-size: $font-size-xs;
  color: $danger-color;
  margin-top: 2px;
}

.audit-log-section {
  margin-top: $spacing-lg;
  border-top: 1px solid $border-color;
  padding-top: $spacing-base;

  .audit-log-title {
    font-size: $font-size-base;
    font-weight: 600;
    margin-bottom: $spacing-base;
    color: $text-primary;
  }

  .log-content {
    .log-action {
      font-weight: 500;
      margin-right: $spacing-sm;
    }

    .log-operator {
      color: $text-secondary;
      margin-right: $spacing-sm;
    }

    .log-remark {
      color: $text-secondary;
      font-size: $font-size-sm;
    }
  }
}

.import-template {
  display: flex;
  justify-content: flex-end;
}

.import-result {
  .import-errors {
    h4 {
      font-size: $font-size-sm;
      color: $danger-color;
      margin-bottom: $spacing-xs;
    }

    .error-item {
      font-size: $font-size-xs;
      color: $text-secondary;
      padding: 2px 0;
    }
  }
}

.duplicate-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-xs $spacing-sm;
  background: $bg-light;
  border-radius: $border-radius-sm;
  margin-bottom: $spacing-xs;
}
</style>
