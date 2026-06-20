<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="900px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div v-if="prerequisiteWarning" class="form-warning-tip">
      <el-icon class="mr-1"><Warning /></el-icon>
      {{ prerequisiteWarning }}
    </div>
    <div v-if="prerequisiteSuccess" class="form-success-tip">
      <el-icon class="mr-1"><CircleCheck /></el-icon>
      {{ prerequisiteSuccess }}
    </div>

    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      label-position="right"
    >
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item
            label="简历ID"
            prop="resumeId"
            :class="{ shake: shakeField === 'resumeId' }"
          >
            <el-input-number
              v-model="formData.resumeId"
              :min="1"
              :disabled="mode !== 'create'"
              style="width: 100%"
              @change="handleResumeIdChange"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item
            label="岗位ID"
            prop="jobId"
            :class="{ shake: shakeField === 'jobId' }"
          >
            <el-input-number v-model="formData.jobId" :min="1" style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item
            label="姓名"
            prop="name"
            :class="{ shake: shakeField === 'name' }"
          >
            <el-input v-model="formData.name" placeholder="请输入姓名" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="性别" prop="gender">
            <el-select v-model="formData.gender" placeholder="请选择性别" style="width: 100%">
              <el-option
                v-for="(label, value) in GenderLabel"
                :key="value"
                :label="label"
                :value="value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item
            label="手机号"
            prop="phone"
            :class="{ shake: shakeField === 'phone' }"
          >
            <el-input v-model="formData.phone" placeholder="请输入手机号" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="formData.email" placeholder="请输入邮箱" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="身份证号" prop="idCard">
            <el-input v-model="formData.idCard" placeholder="请输入身份证号" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="年龄" prop="age">
            <el-input-number v-model="formData.age" :min="0" :max="100" style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="学历" prop="education">
            <el-select v-model="formData.education" placeholder="请选择学历" style="width: 100%">
              <el-option
                v-for="item in EDUCATION_OPTIONS"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="学校" prop="school">
            <el-input v-model="formData.school" placeholder="请输入学校" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="专业" prop="major">
            <el-input v-model="formData.major" placeholder="请输入专业" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item
            label="部门"
            prop="department"
            :class="{ shake: shakeField === 'department' }"
          >
            <el-input v-model="formData.department" placeholder="请输入部门" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item
            label="职位"
            prop="position"
            :class="{ shake: shakeField === 'position' }"
          >
            <el-input v-model="formData.position" placeholder="请输入职位" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="职级" prop="jobLevel">
            <el-select
              v-model="formData.jobLevel"
              placeholder="请选择职级"
              style="width: 100%"
              @change="handleSalaryValidate"
            >
              <el-option
                v-for="item in JOB_LEVEL_OPTIONS"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="汇报对象" prop="reportTo">
            <el-input v-model="formData.reportTo" placeholder="请输入汇报对象" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="工作性质" prop="workType">
            <el-select v-model="formData.workType" placeholder="请选择工作性质" style="width: 100%">
              <el-option
                v-for="item in WORK_TYPE_OPTIONS"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item
            label="薪资下限"
            prop="salaryMin"
            :class="['salary-mismatch-wrap', { shake: shakeField === 'salaryMin' }]"
          >
            <el-input-number
              v-model="formData.salaryMin"
              :min="0"
              :step="1"
              :precision="0"
              :class="{ 'salary-mismatch': salaryMismatch }"
              style="width: 100%"
              @change="handleSalaryValidate"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item
            label="薪资上限"
            prop="salaryMax"
            :class="['salary-mismatch-wrap', { shake: shakeField === 'salaryMax' }]"
          >
            <el-input-number
              v-model="formData.salaryMax"
              :min="0"
              :step="1"
              :precision="0"
              :class="{ 'salary-mismatch': salaryMismatch }"
              style="width: 100%"
              @change="handleSalaryValidate"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row v-if="salaryMismatch" :gutter="16">
        <el-col :span="24">
          <div class="form-warning-tip" style="margin-top: -8px">
            <el-icon class="mr-1"><Warning /></el-icon>
            当前薪资与职级{{ salaryValidationResult?.jobLevel }}不匹配，推荐范围：{{ salaryValidationResult?.expectedMin }}K - {{ salaryValidationResult?.expectedMax }}K
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item
            label="Offer薪资"
            prop="offerSalary"
            :class="{ shake: shakeField === 'offerSalary' }"
          >
            <el-input
              v-model="formData.offerSalary"
              placeholder="如：15-25K 或 20K"
              @input="handleOfferSalaryChange"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="基本工资" prop="salaryBase">
            <el-input-number
              v-model="formData.salaryBase"
              :min="0"
              :step="1"
              :precision="0"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="绩效工资" prop="salaryPerformance">
            <el-input-number
              v-model="formData.salaryPerformance"
              :min="0"
              :step="1"
              :precision="0"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="奖金" prop="salaryBonus">
            <el-input v-model="formData.salaryBonus" placeholder="请输入奖金说明" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item
            label="试用期(月)"
            prop="probationPeriod"
            :class="{ shake: shakeField === 'probationPeriod' }"
          >
            <el-input-number
              v-model="formData.probationPeriod"
              :min="0"
              :max="6"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="试用期薪资" prop="probationSalary">
            <el-input v-model="formData.probationSalary" placeholder="请输入试用期薪资" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="合同类型" prop="contractType">
            <el-select v-model="formData.contractType" placeholder="请选择合同类型" style="width: 100%">
              <el-option
                v-for="item in CONTRACT_TYPE_OPTIONS"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="合同期限(年)" prop="contractTerm">
            <el-input-number
              v-model="formData.contractTerm"
              :min="0"
              :step="0.5"
              :precision="1"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item
            label="预计入职"
            prop="expectOnboardDate"
            :class="{ shake: shakeField === 'expectOnboardDate' }"
          >
            <el-date-picker
              v-model="formData.expectOnboardDate"
              type="date"
              :format="DATE_FORMAT"
              :value-format="DATE_FORMAT"
              placeholder="选择日期"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="实际入职" prop="onboardDate">
            <el-date-picker
              v-model="formData.onboardDate"
              type="date"
              :format="DATE_FORMAT"
              :value-format="DATE_FORMAT"
              placeholder="选择日期"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="工作地点" prop="workLocation">
            <el-input v-model="formData.workLocation" placeholder="请输入工作地点" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="候选人确认" prop="candidateConfirmed">
            <el-switch v-model="formData.candidateConfirmed" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="合同已签" prop="contractSigned">
            <el-switch v-model="formData.contractSigned" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="材料齐全" prop="materialsComplete">
            <el-switch v-model="formData.materialsComplete" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="入职备注" prop="onboardRemark">
            <el-tooltip
              v-if="(formData.onboardRemark || '').length > 50"
              :content="formData.onboardRemark"
              placement="top"
              :show-after="300"
            >
              <el-input
                v-model="formData.onboardRemark"
                type="textarea"
                :rows="3"
                :maxlength="2000"
                show-word-limit
                placeholder="请输入入职备注"
              />
            </el-tooltip>
            <el-input
              v-else
              v-model="formData.onboardRemark"
              type="textarea"
              :rows="3"
              :maxlength="2000"
              show-word-limit
              placeholder="请输入入职备注"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="备注" prop="remark">
            <el-input
              v-model="formData.remark"
              type="textarea"
              :rows="3"
              placeholder="请输入备注"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button
        type="primary"
        :loading="submitLoading"
        :disabled="isSubmitDisabled"
        @click="handleSubmit"
      >
        确定
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick } from 'vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { Warning, CircleCheck } from '@element-plus/icons-vue';
import {
  createOnboardApi,
  updateOnboardApi,
  resubmitOnboardApi,
  checkOnboardPrerequisitesApi,
  validateOnboardSalaryApi,
  type OnboardItem,
  type OnboardCreateData,
  type OnboardUpdateData,
  type OnboardPrerequisiteResult,
  type OnboardSalaryValidationResult,
} from '@/api/onboard';
import {
  JOB_LEVEL_OPTIONS,
  WORK_TYPE_OPTIONS,
  CONTRACT_TYPE_OPTIONS,
  OnboardStatus,
  EDUCATION_OPTIONS,
  GenderLabel,
  DATE_FORMAT,
} from '@/constants/recruitment';

interface Props {
  visible: boolean;
  mode: 'create' | 'edit' | 'resubmit';
  initialData?: Partial<OnboardItem>;
}

const props = withDefaults(defineProps<Props>(), {
  initialData: () => ({}),
});

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'success', data: OnboardItem): void;
}>();

const dialogVisible = ref(props.visible);
const formRef = ref<FormInstance>();
const submitLoading = ref(false);
const shakeField = ref('');

const prerequisiteWarning = ref('');
const prerequisiteSuccess = ref('');
const prerequisiteValid = ref(true);
const salaryMismatch = ref(false);
const salaryValidationResult = ref<OnboardSalaryValidationResult | null>(null);

const formData = reactive<Partial<OnboardCreateData> & { remark?: string }>({
  resumeId: undefined,
  jobId: undefined,
  name: '',
  gender: '',
  phone: '',
  email: '',
  idCard: '',
  age: undefined,
  education: '',
  school: '',
  major: '',
  department: '',
  position: '',
  jobLevel: '',
  reportTo: '',
  workType: '',
  salaryMin: undefined,
  salaryMax: undefined,
  offerSalary: '',
  salaryBase: undefined,
  salaryPerformance: undefined,
  salaryBonus: '',
  probationPeriod: 3,
  probationSalary: '',
  contractType: '',
  contractTerm: undefined,
  expectOnboardDate: '',
  onboardDate: '',
  workLocation: '',
  candidateConfirmed: false,
  contractSigned: false,
  materialsComplete: false,
  onboardRemark: '',
  remark: '',
});

const dialogTitle = computed(() => {
  const titleMap: Record<string, string> = {
    create: '入职登记',
    edit: '编辑入职',
    resubmit: '重新提交入职',
  };
  return titleMap[props.mode] || '入职登记';
});

const isSubmitDisabled = computed(() => {
  if (props.mode === 'create' && !prerequisiteValid.value) {
    return true;
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
  resumeId: [
    {
      required: true,
      message: '请输入简历ID',
      trigger: 'blur',
      validator: (_rule, value, callback) => {
        if (!value || value <= 0) {
          triggerShake('resumeId');
          callback(new Error('请输入简历ID'));
        } else {
          callback();
        }
      },
    },
  ],
  jobId: [
    {
      required: true,
      message: '请输入岗位ID',
      trigger: 'blur',
      validator: (_rule, value, callback) => {
        if (!value || value <= 0) {
          triggerShake('jobId');
          callback(new Error('请输入岗位ID'));
        } else {
          callback();
        }
      },
    },
  ],
  name: [
    {
      required: true,
      message: '请输入姓名',
      trigger: 'blur',
      validator: (_rule, value, callback) => {
        if (!value || !value.trim()) {
          triggerShake('name');
          callback(new Error('请输入姓名'));
        } else {
          callback();
        }
      },
    },
  ],
  phone: [
    {
      required: true,
      message: '请输入手机号',
      trigger: 'blur',
    },
    {
      pattern: /^1[3-9]\d{9}$/,
      message: '请输入正确的手机号',
      trigger: 'blur',
      validator: (_rule, value, callback) => {
        if (value && !/^1[3-9]\d{9}$/.test(value)) {
          triggerShake('phone');
          callback(new Error('请输入正确的手机号'));
        } else {
          callback();
        }
      },
    },
  ],
  email: [
    {
      type: 'email',
      message: '请输入正确的邮箱格式',
      trigger: 'blur',
    },
  ],
  department: [
    {
      required: true,
      message: '请输入部门',
      trigger: 'blur',
      validator: (_rule, value, callback) => {
        if (!value || !value.trim()) {
          triggerShake('department');
          callback(new Error('请输入部门'));
        } else {
          callback();
        }
      },
    },
  ],
  position: [
    {
      required: true,
      message: '请输入职位',
      trigger: 'blur',
      validator: (_rule, value, callback) => {
        if (!value || !value.trim()) {
          triggerShake('position');
          callback(new Error('请输入职位'));
        } else {
          callback();
        }
      },
    },
  ],
  salaryMin: [
    {
      required: true,
      message: '请输入薪资下限',
      trigger: 'blur',
      validator: (_rule, value, callback) => {
        if (value === undefined || value === null || value === '') {
          triggerShake('salaryMin');
          callback(new Error('请输入薪资下限'));
        } else {
          callback();
        }
      },
    },
  ],
  salaryMax: [
    {
      required: true,
      message: '请输入薪资上限',
      trigger: 'blur',
      validator: (_rule, value, callback) => {
        if (value === undefined || value === null || value === '') {
          triggerShake('salaryMax');
          callback(new Error('请输入薪资上限'));
        } else if (formData.salaryMin && value < formData.salaryMin) {
          triggerShake('salaryMax');
          callback(new Error('薪资上限不能低于下限'));
        } else {
          callback();
        }
      },
    },
  ],
  offerSalary: [
    {
      required: true,
      message: '请输入Offer薪资',
      trigger: 'blur',
      validator: (_rule, value, callback) => {
        if (!value || !value.trim()) {
          triggerShake('offerSalary');
          callback(new Error('请输入Offer薪资'));
        } else {
          callback();
        }
      },
    },
  ],
  probationPeriod: [
    {
      required: true,
      message: '请输入试用期时长',
      trigger: 'blur',
      validator: (_rule, value, callback) => {
        if (value === undefined || value === null || value === '') {
          triggerShake('probationPeriod');
          callback(new Error('请输入试用期时长'));
        } else if (value < 0 || value > 6) {
          triggerShake('probationPeriod');
          callback(new Error('试用期应在0-6个月之间'));
        } else {
          callback();
        }
      },
    },
  ],
  expectOnboardDate: [
    {
      required: true,
      message: '请选择预计入职日期',
      trigger: 'change',
      validator: (_rule, value, callback) => {
        if (!value) {
          triggerShake('expectOnboardDate');
          callback(new Error('请选择预计入职日期'));
        } else {
          callback();
        }
      },
    },
  ],
};

const resetForm = () => {
  Object.assign(formData, {
    resumeId: undefined,
    jobId: undefined,
    name: '',
    gender: '',
    phone: '',
    email: '',
    idCard: '',
    age: undefined,
    education: '',
    school: '',
    major: '',
    department: '',
    position: '',
    jobLevel: '',
    reportTo: '',
    workType: '',
    salaryMin: undefined,
    salaryMax: undefined,
    offerSalary: '',
    salaryBase: undefined,
    salaryPerformance: undefined,
    salaryBonus: '',
    probationPeriod: 3,
    probationSalary: '',
    contractType: '',
    contractTerm: undefined,
    expectOnboardDate: '',
    onboardDate: '',
    workLocation: '',
    candidateConfirmed: false,
    contractSigned: false,
    materialsComplete: false,
    onboardRemark: '',
    remark: '',
  });
  prerequisiteWarning.value = '';
  prerequisiteSuccess.value = '';
  prerequisiteValid.value = true;
  salaryMismatch.value = false;
  salaryValidationResult.value = null;
  formRef.value?.resetFields();
};

const initFormData = () => {
  if (props.initialData && Object.keys(props.initialData).length > 0) {
    Object.assign(formData, props.initialData);
  }
};

const handleResumeIdChange = async (val: number | undefined) => {
  if (props.mode !== 'create') return;
  if (!val || val <= 0) {
    prerequisiteWarning.value = '';
    prerequisiteSuccess.value = '';
    prerequisiteValid.value = true;
    return;
  }

  try {
    const result: OnboardPrerequisiteResult = await checkOnboardPrerequisitesApi(val);
    if (!result.valid) {
      prerequisiteValid.value = false;
      prerequisiteWarning.value = result.messages?.[0] || '前置条件不满足，无法提交';
      prerequisiteSuccess.value = '';
    } else {
      prerequisiteValid.value = true;
      prerequisiteWarning.value = '';
      prerequisiteSuccess.value = '前置条件校验通过，已自动回填简历信息';
      if (result.resumeExists && (result as any).resume) {
        const resume = (result as any).resume;
        formData.name = resume.name || formData.name;
        formData.phone = resume.phone || formData.phone;
        formData.email = resume.email || formData.email;
        formData.gender = resume.gender || formData.gender;
        formData.age = resume.age || formData.age;
        formData.education = resume.education || formData.education;
        formData.school = resume.school || formData.school;
        formData.major = resume.major || formData.major;
      }
    }
  } catch (error: any) {
    prerequisiteValid.value = false;
    prerequisiteWarning.value = error?.message || '前置条件校验失败';
    prerequisiteSuccess.value = '';
  }
};

const handleSalaryValidate = async () => {
  if (!formData.jobLevel || formData.salaryMin === undefined || formData.salaryMax === undefined) {
    salaryMismatch.value = false;
    salaryValidationResult.value = null;
    return;
  }

  try {
    const result = await validateOnboardSalaryApi(
      formData.jobLevel,
      formData.salaryMin,
      formData.salaryMax
    );
    salaryValidationResult.value = result;
    salaryMismatch.value = !result.valid;
  } catch {
    salaryMismatch.value = false;
    salaryValidationResult.value = null;
  }
};

const handleOfferSalaryChange = (val: string) => {
  if (!val) {
    return;
  }

  const cleaned = val.toUpperCase().replace(/\s+/g, '');

  const rangeMatch = cleaned.match(/^(\d+(?:\.\d+)?)K?-(\d+(?:\.\d+)?)K?$/);
  if (rangeMatch) {
    formData.salaryMin = parseFloat(rangeMatch[1]);
    formData.salaryMax = parseFloat(rangeMatch[2]);
    nextTick(() => handleSalaryValidate());
    return;
  }

  const singleMatch = cleaned.match(/^(\d+(?:\.\d+)?)K?$/);
  if (singleMatch) {
    const value = parseFloat(singleMatch[1]);
    formData.salaryMin = value;
    formData.salaryMax = value;
    nextTick(() => handleSalaryValidate());
    return;
  }
};

const handleClose = () => {
  emit('update:visible', false);
};

const handleSubmit = async () => {
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
  try {
    let result: OnboardItem;
    const submitData = { ...formData } as any;

    Object.keys(submitData).forEach((key) => {
      if (submitData[key] === undefined || submitData[key] === null || submitData[key] === '') {
        delete submitData[key];
      }
    });

    if (props.mode === 'create') {
      result = await createOnboardApi(submitData as OnboardCreateData);
      ElMessage.success('入职登记创建成功');
    } else if (props.mode === 'edit') {
      result = await updateOnboardApi(props.initialData?.id!, submitData as OnboardUpdateData);
      ElMessage.success('入职信息更新成功');
    } else {
      result = await resubmitOnboardApi(props.initialData?.id!, submitData as OnboardUpdateData);
      ElMessage.success('重新提交成功');
    }

    emit('success', result);
    emit('update:visible', false);
  } catch (error: any) {
    ElMessage.error(error?.message || '提交失败，请重试');
  } finally {
    submitLoading.value = false;
  }
};

watch(
  () => props.visible,
  (val) => {
    dialogVisible.value = val;
    if (val) {
      resetForm();
      nextTick(() => {
        initFormData();
        if (props.mode === 'create' && formData.resumeId && formData.resumeId > 0) {
          handleResumeIdChange(formData.resumeId);
        }
        if (formData.jobLevel && formData.salaryMin !== undefined && formData.salaryMax !== undefined) {
          handleSalaryValidate();
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
.salary-mismatch {
  :deep(.el-input__wrapper) {
    border: 1px solid #f56c6c;
    box-shadow: 0 0 0 1px #f56c6c inset;
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

.form-warning-tip {
  color: #f56c6c;
  font-size: 12px;
  padding: 8px 12px;
  background: #fef0f0;
  border-radius: 4px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;

  .mr-1 {
    margin-right: 6px;
  }
}

.form-success-tip {
  color: #67c23a;
  font-size: 12px;
  padding: 8px 12px;
  background: #f0f9eb;
  border-radius: 4px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;

  .mr-1 {
    margin-right: 6px;
  }
}

.salary-mismatch-wrap {
  :deep(.el-form-item__content) {
    .salary-mismatch {
      .el-input__wrapper {
        border: 1px solid #f56c6c;
        box-shadow: 0 0 0 1px #f56c6c inset;
      }
    }
  }
}
</style>
