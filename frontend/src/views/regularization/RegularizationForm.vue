<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="960px"
    :close-on-click-modal="false"
    append-to-body
    @close="handleClose"
  >
    <transition name="scale-fade" appear>
      <div v-if="dialogVisible">
        <el-alert
          v-if="mode === 'resubmit' && rejectReason"
          :title="`上一次驳回原因：${rejectReason}`"
          type="error"
          :closable="false"
          show-icon
          style="margin-bottom: 16px"
        />

        <div v-if="prerequisiteErrors.length > 0" class="form-warning-tip">
          <el-icon class="mr-1"><Warning /></el-icon>
          <div>
            <div class="warning-title">前置条件校验不通过，无法提交申请：</div>
            <ul class="warning-list">
              <li v-for="(msg, idx) in prerequisiteErrors" :key="idx">{{ msg }}</li>
            </ul>
          </div>
        </div>

        <div v-if="prerequisiteValid && probationSelected" class="form-success-tip">
          <el-icon class="mr-1"><CircleCheck /></el-icon>
          <span>前置条件校验通过，已自动回填员工信息</span>
        </div>

        <el-form
          ref="formRef"
          :model="formData"
          :rules="formRules"
          label-width="110px"
          label-position="right"
        >
          <template v-if="mode === 'create'">
            <el-row :gutter="16">
              <el-col :span="24">
                <el-form-item
                  label="试用期人员"
                  prop="probationId"
                  :class="{ shake: shakeField === 'probationId' }"
                >
                  <el-select
                    v-model="formData.probationId"
                    placeholder="请选择试用期人员"
                    style="width: 100%"
                    filterable
                    :disabled="probationSelected"
                    @change="handleProbationSelect"
                    @blur="handleProbationIdBlur"
                  >
                    <el-option
                      v-for="item in pendingList"
                      :key="item.id"
                      :label="formatPendingOptionLabel(item)"
                      :value="item.probationId"
                      :disabled="!item.canApply"
                    >
                      <span>{{ item.name || '未知' }}</span>
                      <span style="float: right; color: #8492a6; font-size: 12px">
                        {{ item.department || '' }} {{ item.position || '' }}
                        <el-tag
                          v-if="item.expiring"
                          type="warning"
                          size="small"
                          style="margin-left: 6px"
                        >即将到期</el-tag>
                        <el-tag
                          v-if="!item.canApply"
                          type="danger"
                          size="small"
                          style="margin-left: 6px"
                        >暂不可申请</el-tag>
                      </span>
                    </el-option>
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </template>

          <el-row :gutter="16" v-if="basicInfoFilled">
            <el-col :span="12">
              <el-form-item label="工号">
                <el-tooltip v-if="formData.employeeNo && formData.employeeNo.length > 10" :content="formData.employeeNo" placement="top">
                  <el-input v-model="formData.employeeNo" disabled class="text-ellipsis-input" />
                </el-tooltip>
                <el-input v-else v-model="formData.employeeNo" disabled />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="姓名">
                <el-input v-model="formData.name" disabled />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="16" v-if="basicInfoFilled">
            <el-col :span="12">
              <el-form-item label="手机号">
                <el-input v-model="formData.phone" disabled />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="部门">
                <el-tooltip v-if="formData.department && formData.department.length > 10" :content="formData.department" placement="top">
                  <el-input v-model="formData.department" disabled class="text-ellipsis-input" />
                </el-tooltip>
                <el-input v-else v-model="formData.department" disabled />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="16" v-if="basicInfoFilled">
            <el-col :span="12">
              <el-form-item label="职位">
                <el-tooltip v-if="formData.position && formData.position.length > 10" :content="formData.position" placement="top">
                  <el-input v-model="formData.position" disabled class="text-ellipsis-input" />
                </el-tooltip>
                <el-input v-else v-model="formData.position" disabled />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="职级">
                <el-input v-model="formData.jobLevel" disabled />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="16" v-if="basicInfoFilled">
            <el-col :span="12">
              <el-form-item label="入职批次">
                <el-input v-model="formData.onboardBatch" disabled />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="考核综合分">
                <el-input
                  v-model="formData.assessmentFinalScore"
                  disabled
                  :class="{
                    'score-pass': Number(formData.assessmentFinalScore) >= 3,
                    'score-fail': Number(formData.assessmentFinalScore) < 3 && formData.assessmentFinalScore !== undefined
                  }"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="16" v-if="basicInfoFilled">
            <el-col :span="12">
              <el-form-item label="试用期开始">
                <el-input v-model="formData.probationStartDate" disabled />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="试用期结束">
                <el-input v-model="formData.probationEndDate" disabled />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="16" v-if="basicInfoFilled">
            <el-col :span="12">
              <el-form-item label="试用期(月)">
                <el-input v-model="formData.probationDuration" disabled />
              </el-form-item>
            </el-col>
          </el-row>

          <el-divider v-if="basicInfoFilled">审批流程</el-divider>

          <div v-if="basicInfoFilled && approvalFlowNodes.length > 0" class="approval-flow-wrap">
            <el-steps
              :active="activeStepIndex"
              finish-status="success"
              process-status="process"
              align-center
            >
              <el-step
                v-for="(node, idx) in approvalFlowNodes"
                :key="node.nodeKey"
                :title="node.nodeName"
                :status="getNodeStatus(node, idx)"
              >
                <template #icon>
                  <el-icon v-if="getNodeStatus(node, idx) === 'success'" class="step-icon-success">
                    <CircleCheckFilled />
                  </el-icon>
                  <span v-else class="step-icon-default">{{ idx + 1 }}</span>
                </template>
              </el-step>
            </el-steps>
          </div>

          <el-divider v-if="basicInfoFilled">合规校验</el-divider>

          <div v-if="basicInfoFilled" class="compliance-panel">
            <div v-if="complianceLoading" class="compliance-loading">
              <el-icon class="is-loading"><Loading /></el-icon>
              <span>合规校验中...</span>
            </div>
            <div v-else-if="complianceValid" class="compliance-success">
              <el-icon><CircleCheck /></el-icon>
              <span>合规校验通过</span>
            </div>
            <div v-else class="compliance-error-list">
              <div
                v-for="(issue, idx) in complianceIssues"
                :key="idx"
                class="compliance-error-item"
              >
                <el-icon class="error-icon"><CircleClose /></el-icon>
                <span>{{ issue.message }}</span>
              </div>
            </div>
          </div>

          <el-divider v-if="basicInfoFilled">申请信息</el-divider>

          <el-row :gutter="16" v-if="basicInfoFilled">
            <el-col :span="24">
              <el-form-item
                label="申请备注"
                prop="applyRemark"
                :class="{ shake: shakeField === 'applyRemark' }"
              >
                <el-input
                  v-model="formData.applyRemark"
                  type="textarea"
                  :rows="4"
                  :maxlength="500"
                  show-word-limit
                  placeholder="请输入转正申请备注（选填）"
                  :disabled="mode === 'resubmit' ? false : false"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="16" v-if="basicInfoFilled">
            <el-col :span="24">
              <el-form-item label="申请附件">
                <el-upload
                  v-model:file-list="formData.applyAttachments"
                  action="#"
                  multiple
                  :auto-upload="false"
                  :limit="10"
                  :on-exceed="handleFileExceed"
                >
                  <el-button type="primary" size="small">
                    <el-icon><Plus /></el-icon>
                    <span>上传附件</span>
                  </el-button>
                  <template #tip>
                    <div class="el-upload__tip">支持上传多个文件，单个文件不超过10MB</div>
                  </template>
                </el-upload>
              </el-form-item>
            </el-col>
          </el-row>

          <template v-if="isAdmin && basicInfoFilled">
            <el-divider>薪资福利预调整（仅管理员可见）</el-divider>
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item
                  label="新基本工资"
                  prop="newSalaryBase"
                  :class="{ shake: shakeField === 'newSalaryBase' }"
                >
                  <el-input-number
                    v-model="formData.newSalaryBase"
                    :min="0"
                    :precision="2"
                    :step="100"
                    style="width: 100%"
                    placeholder="请输入新基本工资（K）"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item
                  label="新绩效工资"
                  prop="newSalaryPerformance"
                  :class="{ shake: shakeField === 'newSalaryPerformance' }"
                >
                  <el-input-number
                    v-model="formData.newSalaryPerformance"
                    :min="0"
                    :precision="2"
                    :step="100"
                    style="width: 100%"
                    placeholder="请输入新绩效工资（K）"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </template>
        </el-form>
      </div>
    </transition>

    <template #footer>
      <el-button @click="handleClose" v-ripple>取消</el-button>
      <el-button
        type="primary"
        :loading="submitLoading"
        :disabled="isSubmitDisabled"
        @click="handleSubmit"
        v-ripple
      >
        {{ submitButtonText }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick } from 'vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import {
  Warning,
  CircleCheck,
  CircleCheckFilled,
  CircleClose,
  Plus,
  Loading,
} from '@element-plus/icons-vue';
import { debounce } from 'lodash-es';
import { useUserStore } from '@/store/modules/user';
import {
  getRegularizationPendingApi,
  checkRegularizationPrerequisitesApi,
  generateApprovalFlowApi,
  validateRegularizationComplianceApi,
  createRegularizationApi,
  resubmitRegularizationApi,
  type RegularizationItem,
  type ApprovalFlowNode,
  type RegularizationPrerequisiteResult,
  type RegularizationComplianceResult,
  type RegularizationCreateData,
  type RegularizationResubmitData,
} from '@/api/regularization';
import {
  UserRole,
  DEFAULT_APPROVAL_FLOW,
  RegularizationApprovalNodeLabel,
  PROBATION_ASSESSMENT_PASS_SCORE,
} from '@/constants/recruitment';

type FormMode = 'create' | 'resubmit';

interface Props {
  visible: boolean;
  mode: FormMode;
  initialData?: Partial<RegularizationItem>;
  probationId?: number;
}

const props = withDefaults(defineProps<Props>(), {
  initialData: () => ({}),
  probationId: undefined,
});

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'success', data: RegularizationItem): void;
}>();

const userStore = useUserStore();

const dialogVisible = ref(props.visible);
const formRef = ref<FormInstance>();
const submitLoading = ref(false);
const submitButtonDisabled = ref(false);
const shakeField = ref('');

const prerequisiteErrors = ref<string[]>([]);
const prerequisiteValid = ref(false);
const probationSelected = ref(false);
const complianceLoading = ref(false);
const complianceValid = ref(false);
const complianceIssues = ref<Array<{ type: string; level: string; message: string }>>([]);

const pendingList = ref<Array<{
  id: number;
  probationId: number;
  onboardId: number;
  resumeId: number;
  jobId: number;
  employeeNo?: string;
  name?: string;
  phone?: string;
  department?: string;
  position?: string;
  jobLevel?: string;
  probationStartDate?: string;
  probationEndDate?: string;
  probationDuration?: number;
  assessmentFinalScore?: number;
  daysRemaining?: number;
  canApply?: boolean;
  expiring?: boolean;
}>>([]);

const approvalFlowNodes = ref<ApprovalFlowNode[]>([]);

interface FormDataType {
  probationId?: number;
  employeeNo?: string;
  name?: string;
  phone?: string;
  department?: string;
  position?: string;
  jobLevel?: string;
  onboardBatch?: string;
  probationStartDate?: string;
  probationEndDate?: string;
  probationDuration?: number;
  assessmentFinalScore?: number;
  applyRemark?: string;
  applyAttachments: Array<{ name: string; url: string; size?: number; raw?: File; uid?: number }>;
  newSalaryBase?: number;
  newSalaryPerformance?: number;
}

const formData = reactive<FormDataType>({
  probationId: undefined,
  employeeNo: '',
  name: '',
  phone: '',
  department: '',
  position: '',
  jobLevel: '',
  onboardBatch: '',
  probationStartDate: '',
  probationEndDate: '',
  probationDuration: undefined,
  assessmentFinalScore: undefined,
  applyRemark: '',
  applyAttachments: [],
  newSalaryBase: undefined,
  newSalaryPerformance: undefined,
});

const rejectReason = computed(() => {
  if (props.mode !== 'resubmit') return '';
  return props.initialData?.finalApprovalRemark || '';
});

const dialogTitle = computed(() => {
  const titleMap: Record<FormMode, string> = {
    create: '发起转正申请',
    resubmit: '重新提交转正申请',
  };
  return titleMap[props.mode];
});

const submitButtonText = computed(() => {
  const textMap: Record<FormMode, string> = {
    create: '提交申请',
    resubmit: '重新提交',
  };
  return textMap[props.mode];
});

const basicInfoFilled = computed(() => {
  if (props.mode === 'resubmit') return true;
  return !!formData.probationId && probationSelected.value;
});

const isAdmin = computed(() => {
  return userStore.userInfo?.role === UserRole.ADMIN;
});

const activeStepIndex = computed(() => {
  if (approvalFlowNodes.value.length === 0) return 0;
  const activeIdx = approvalFlowNodes.value.findIndex((n) => n.nodeStatus === 'active');
  return activeIdx >= 0 ? activeIdx : 0;
});

const isSubmitDisabled = computed(() => {
  if (submitLoading.value) return true;
  if (submitButtonDisabled.value) return true;
  if (props.mode === 'create') {
    if (!prerequisiteValid.value) return true;
    if (!formData.probationId) return true;
  }
  if (!complianceValid.value && complianceIssues.value.length > 0) {
    const hasBlockingIssue = complianceIssues.value.some((i) => i.level === 'error');
    if (hasBlockingIssue) return true;
  }
  return false;
});

const triggerShake = (fieldName: string) => {
  shakeField.value = fieldName;
  setTimeout(() => {
    shakeField.value = '';
  }, 500);
};

const formRules: FormRules = {
  probationId: [
    {
      required: true,
      message: '请选择试用期人员',
      trigger: 'change',
      validator: (_rule, value, callback) => {
        if (!value || value <= 0) {
          triggerShake('probationId');
          callback(new Error('请选择试用期人员'));
        } else {
          callback();
        }
      },
    },
  ],
  applyRemark: [
    {
      max: 500,
      message: '申请备注不能超过500字',
      trigger: 'blur',
    },
  ],
  newSalaryBase: [
    {
      type: 'number',
      min: 0,
      message: '基本工资不能小于0',
      trigger: 'blur',
    },
  ],
  newSalaryPerformance: [
    {
      type: 'number',
      min: 0,
      message: '绩效工资不能小于0',
      trigger: 'blur',
    },
  ],
};

const formatPendingOptionLabel = (item: any) => {
  const parts = [];
  if (item.name) parts.push(item.name);
  if (item.department) parts.push(item.department);
  if (item.position) parts.push(item.position);
  return parts.join(' - ');
};

const getNodeStatus = (_node: ApprovalFlowNode, idx: number) => {
  if (idx < activeStepIndex.value) return 'success';
  if (idx === activeStepIndex.value) return 'process';
  return '';
};

const handleFileExceed = () => {
  ElMessage.warning('最多上传10个附件');
};

const resetForm = () => {
  Object.assign(formData, {
    probationId: undefined,
    employeeNo: '',
    name: '',
    phone: '',
    department: '',
    position: '',
    jobLevel: '',
    onboardBatch: '',
    probationStartDate: '',
    probationEndDate: '',
    probationDuration: undefined,
    assessmentFinalScore: undefined,
    applyRemark: '',
    applyAttachments: [],
    newSalaryBase: undefined,
    newSalaryPerformance: undefined,
  });

  prerequisiteErrors.value = [];
  prerequisiteValid.value = false;
  probationSelected.value = false;
  complianceLoading.value = false;
  complianceValid.value = false;
  complianceIssues.value = [];
  approvalFlowNodes.value = [];
  submitButtonDisabled.value = false;

  formRef.value?.resetFields();
};

const initFormData = () => {
  if (!props.initialData || Object.keys(props.initialData).length === 0) return;

  const data = props.initialData;

  if (props.mode === 'resubmit') {
    Object.assign(formData, {
      probationId: data.probationId,
      employeeNo: data.employeeNo || '',
      name: data.name || '',
      phone: data.phone || '',
      department: data.department || '',
      position: data.position || '',
      jobLevel: data.jobLevel || '',
      onboardBatch: data.onboardBatch || '',
      probationStartDate: data.probationStartDate || '',
      probationEndDate: data.probationEndDate || '',
      probationDuration: data.probationDuration,
      assessmentFinalScore: data.assessmentFinalScore,
      applyRemark: data.applyRemark || '',
      applyAttachments: data.applyAttachments ? [...data.applyAttachments] : [],
      newSalaryBase: data.newSalaryBase,
      newSalaryPerformance: data.newSalaryPerformance,
    });
    probationSelected.value = true;
    prerequisiteValid.value = true;
  }
};

const loadPendingList = async () => {
  try {
    pendingList.value = await getRegularizationPendingApi();
  } catch {
    pendingList.value = [];
  }
};

const handleProbationSelect = async (probationId: number) => {
  if (!probationId || probationId <= 0) {
    prerequisiteErrors.value = [];
    prerequisiteValid.value = false;
    probationSelected.value = false;
    complianceIssues.value = [];
    complianceValid.value = false;
    approvalFlowNodes.value = [];
    return;
  }
  await checkPrerequisites(probationId);
};

const handleProbationIdBlur = async () => {
  if (props.mode !== 'create') return;
  if (!formData.probationId || formData.probationId <= 0) return;
  if (probationSelected.value) return;
  await checkPrerequisites(formData.probationId);
};

const checkPrerequisites = async (probationId: number) => {
  try {
    const result: RegularizationPrerequisiteResult = await checkRegularizationPrerequisitesApi(
      probationId
    );
    if (!result.valid || !result.canApply) {
      prerequisiteValid.value = false;
      prerequisiteErrors.value = result.messages?.length > 0
        ? result.messages
        : ['前置条件不满足，无法发起转正申请'];
      probationSelected.value = false;
      complianceIssues.value = [];
      complianceValid.value = false;
      approvalFlowNodes.value = [];
    } else {
      prerequisiteValid.value = true;
      prerequisiteErrors.value = [];
      probationSelected.value = true;

      if (result.probationData) {
        const pb = result.probationData;
        formData.employeeNo = pb.employeeNo || formData.employeeNo;
        formData.name = pb.name || formData.name;
        formData.phone = pb.phone || formData.phone;
        formData.department = pb.department || formData.department;
        formData.position = pb.position || formData.position;
        formData.jobLevel = pb.jobLevel || formData.jobLevel;
        formData.onboardBatch = pb.onboardBatch || formData.onboardBatch;
        formData.probationStartDate = pb.probationStartDate || formData.probationStartDate;
        formData.probationEndDate = pb.probationEndDate || formData.probationEndDate;
        formData.probationDuration = pb.probationDuration ?? formData.probationDuration;
        formData.assessmentFinalScore = pb.assessmentFinalScore ?? formData.assessmentFinalScore;

        if (formData.jobLevel) {
          await loadApprovalFlow(formData.jobLevel, formData.department);
        }
        await validateCompliance(probationId);
      }
    }
  } catch (error: any) {
    prerequisiteValid.value = false;
    prerequisiteErrors.value = [error?.message || '前置条件校验失败'];
    probationSelected.value = false;
    complianceIssues.value = [];
    complianceValid.value = false;
    approvalFlowNodes.value = [];
  }
};

const loadApprovalFlow = async (jobLevel: string, department?: string) => {
  try {
    const result = await generateApprovalFlowApi(jobLevel, department);
    approvalFlowNodes.value = result.nodes || [];
  } catch {
    approvalFlowNodes.value = DEFAULT_APPROVAL_FLOW.map((key, idx) => ({
      nodeKey: key,
      nodeName: RegularizationApprovalNodeLabel[key],
      nodeIndex: idx,
      nodeStatus: idx === 0 ? 'active' : 'pending',
    }));
  }
};

const validateCompliance = async (probationId: number) => {
  complianceLoading.value = true;
  try {
    const result: RegularizationComplianceResult = await validateRegularizationComplianceApi(
      probationId
    );
    complianceValid.value = result.valid;
    complianceIssues.value = result.issues || [];
  } catch {
    complianceValid.value = false;
    complianceIssues.value = [];
  } finally {
    complianceLoading.value = false;
  }
};

const handleClose = () => {
  emit('update:visible', false);
};

const doSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
  } catch {
    return;
  }

  if (props.mode === 'create' && !prerequisiteValid.value) {
    ElMessage.error('前置条件不满足，无法提交');
    return;
  }

  submitLoading.value = true;
  submitButtonDisabled.value = true;

  try {
    let result: RegularizationItem;

    if (props.mode === 'create') {
      const attachments = formData.applyAttachments
        .filter((f) => f.url || f.name)
        .map((f) => ({
          name: f.name,
          url: f.url || '',
          size: f.size,
        }));

      const submitData: RegularizationCreateData = {
        probationId: formData.probationId!,
        applyRemark: formData.applyRemark || undefined,
        applyAttachments: attachments.length > 0 ? attachments : undefined,
        newSalaryBase: formData.newSalaryBase,
        newSalaryPerformance: formData.newSalaryPerformance,
        salaryAdjusted: !!(formData.newSalaryBase || formData.newSalaryPerformance),
        complianceChecked: true,
      };

      Object.keys(submitData).forEach((key) => {
        const val = (submitData as any)[key];
        if (val === undefined || val === null || val === '') {
          delete (submitData as any)[key];
        }
      });

      result = await createRegularizationApi(submitData);
      ElMessage.success('转正申请提交成功');
    } else {
      if (!props.initialData?.id) {
        throw new Error('缺少转正申请ID');
      }

      const attachments = formData.applyAttachments
        .filter((f) => f.url || f.name)
        .map((f) => ({
          name: f.name,
          url: f.url || '',
          size: f.size,
        }));

      const submitData: RegularizationResubmitData = {
        applyRemark: formData.applyRemark || undefined,
        applyAttachments: attachments.length > 0 ? attachments : undefined,
      };

      Object.keys(submitData).forEach((key) => {
        const val = (submitData as any)[key];
        if (val === undefined || val === null || val === '') {
          delete (submitData as any)[key];
        }
      });

      result = await resubmitRegularizationApi(props.initialData.id, submitData);
      ElMessage.success('转正申请重新提交成功');
    }

    emit('success', result);
    emit('update:visible', false);
  } catch (error: any) {
    ElMessage.error(error?.message || '提交失败，请重试');
  } finally {
    submitLoading.value = false;
    setTimeout(() => {
      submitButtonDisabled.value = false;
    }, 300);
  }
};

const handleSubmit = debounce(doSubmit, 300, { leading: true, trailing: false });

watch(
  () => props.visible,
  (val) => {
    dialogVisible.value = val;
    if (val) {
      resetForm();
      nextTick(async () => {
        initFormData();
        if (props.mode === 'create') {
          await loadPendingList();
          if (props.probationId && props.probationId > 0) {
            formData.probationId = props.probationId;
            await checkPrerequisites(props.probationId);
          }
        }
        if (props.mode === 'resubmit' && formData.jobLevel) {
          await loadApprovalFlow(formData.jobLevel, formData.department);
          if (formData.probationId) {
            await validateCompliance(formData.probationId);
          }
        }
      });
    }
  },
  { immediate: true }
);

watch(dialogVisible, (val) => {
  if (val !== props.visible) {
    emit('update:visible', val);
  }
});
</script>

<style lang="scss" scoped>
@keyframes scale-fade-in {
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  20%,
  60% {
    transform: translateX(-6px);
  }
  40%,
  80% {
    transform: translateX(6px);
  }
}

.shake {
  animation: shake 0.4s ease-in-out;
}

.scale-fade-enter-active,
.scale-fade-leave-active {
  animation: scale-fade-in 0.3s ease-in-out;
}

.scale-fade-leave-active {
  animation-direction: reverse;
}

.form-warning-tip {
  color: #f56c6c;
  font-size: 12px;
  padding: 10px 14px;
  background: #fef0f0;
  border-radius: 4px;
  margin-bottom: 16px;
  display: flex;
  align-items: flex-start;

  .mr-1 {
    margin-right: 8px;
    flex-shrink: 0;
    margin-top: 1px;
  }

  .warning-title {
    font-weight: 500;
    margin-bottom: 4px;
  }

  .warning-list {
    margin: 0;
    padding-left: 18px;
    list-style: disc;

    li {
      line-height: 1.8;
    }
  }
}

.form-success-tip {
  color: #67c23a;
  font-size: 12px;
  padding: 8px 12px;
  background: #f0f9eb;
  border-radius: 4px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;

  .mr-1 {
    margin-right: 6px;
    flex-shrink: 0;
  }
}

.text-ellipsis-input {
  :deep(.el-input__inner) {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.score-pass {
  :deep(.el-input__inner) {
    color: #67c23a;
    font-weight: 500;
  }
}

.score-fail {
  :deep(.el-input__inner) {
    color: #f56c6c;
    font-weight: 500;
  }
}

.approval-flow-wrap {
  padding: 12px 8px 20px 8px;
  background: #fafafa;
  border-radius: 6px;
  margin-bottom: 8px;

  .step-icon-success {
    color: #67c23a;
    font-size: 22px;
  }

  .step-icon-default {
    display: inline-block;
    width: 22px;
    height: 22px;
    line-height: 22px;
    text-align: center;
    background: #c0c4cc;
    color: #fff;
    border-radius: 50%;
    font-size: 12px;
  }

  :deep(.el-step.is-process .el-step__icon) {
    background-color: #409eff;
    border-color: #409eff;
  }
}

.compliance-panel {
  padding: 14px 16px;
  border-radius: 6px;
  margin-bottom: 8px;
  min-height: 56px;
  display: flex;
  align-items: center;

  &.compliance-loading {
    background: #f4f4f5;
    color: #909399;
    justify-content: center;
    gap: 8px;
    font-size: 13px;
  }

  &.compliance-success {
    background: #f0f9eb;
    color: #67c23a;
    justify-content: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 500;
  }
}

.compliance-error-list {
  background: #fef0f0;
  width: 100%;
}

.compliance-error-item {
  display: flex;
  align-items: flex-start;
  color: #f56c6c;
  font-size: 13px;
  line-height: 1.6;
  margin-bottom: 6px;

  &:last-child {
    margin-bottom: 0;
  }

  .error-icon {
    margin-right: 6px;
    flex-shrink: 0;
    margin-top: 2px;
  }
}

.el-divider {
  margin: 16px 0 12px 0;
}

.el-upload__tip {
  font-size: 12px;
  color: #909399;
  margin-top: 6px;
}
</style>
