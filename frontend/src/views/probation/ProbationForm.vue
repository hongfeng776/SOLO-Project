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
        <div v-if="prerequisiteWarning" class="form-warning-tip">
          <el-icon class="mr-1"><Warning /></el-icon>
          <span>{{ prerequisiteWarning }}</span>
        </div>
        <div v-if="prerequisiteSuccess" class="form-success-tip">
          <el-icon class="mr-1"><CircleCheck /></el-icon>
          <span>{{ prerequisiteSuccess }}</span>
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
                  label="入职人员"
                  prop="onboardId"
                  :class="{ shake: shakeField === 'onboardId' }"
                >
                  <el-select
                    v-model="formData.onboardId"
                    placeholder="请选择入职人员或输入入职记录ID"
                    style="width: 100%"
                    filterable
                    :disabled="onboardSelected"
                    @change="handleOnboardSelect"
                    @blur="handleOnboardIdBlur"
                  >
                    <el-option
                      v-for="item in onboardList"
                      :key="item.id"
                      :label="`${item.name || '未知'} - ${item.department || ''} ${item.position || ''}`"
                      :value="item.id"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="16" v-if="basicInfoFilled">
              <el-col :span="12">
                <el-form-item label="工号">
                  <el-input v-model="formData.employeeNo" placeholder="自动回填，可编辑" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="姓名">
                  <el-input v-model="formData.name" placeholder="自动回填" disabled />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="16" v-if="basicInfoFilled">
              <el-col :span="12">
                <el-form-item label="手机号">
                  <el-input v-model="formData.phone" placeholder="自动回填" disabled />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="部门">
                  <el-input v-model="formData.department" placeholder="自动回填" disabled />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="16" v-if="basicInfoFilled">
              <el-col :span="12">
                <el-form-item label="职位">
                  <el-input v-model="formData.position" placeholder="自动回填" disabled />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="职级">
                  <el-input v-model="formData.jobLevel" placeholder="自动回填" disabled />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="16" v-if="basicInfoFilled">
              <el-col :span="12">
                <el-form-item label="转正薪资">
                  <el-input v-model="formData.salaryRegular" placeholder="自动回填，可编辑" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="导师">
                  <el-input v-model="formData.mentor" placeholder="请输入导师姓名" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="16" v-if="basicInfoFilled">
              <el-col :span="12">
                <el-form-item
                  label="开始日期"
                  prop="startDate"
                  :class="{ shake: shakeField === 'startDate' }"
                >
                  <el-date-picker
                    v-model="formData.startDate"
                    type="date"
                    :format="DATE_FORMAT"
                    :value-format="DATE_FORMAT"
                    placeholder="选择开始日期"
                    style="width: 100%"
                    @change="handleDateChange"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item
                  label="结束日期"
                  prop="endDate"
                  :class="{ shake: shakeField === 'endDate' }"
                >
                  <el-date-picker
                    v-model="formData.endDate"
                    type="date"
                    :format="DATE_FORMAT"
                    :value-format="DATE_FORMAT"
                    placeholder="选择结束日期"
                    style="width: 100%"
                    @change="handleDateChange"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="16" v-if="basicInfoFilled">
              <el-col :span="12">
                <el-form-item
                  label="试用期(月)"
                  prop="duration"
                  :class="['duration-mismatch-wrap', { shake: shakeField === 'duration' }]"
                >
                  <el-input-number
                    v-model="formData.duration"
                    :min="PROBATION_ADJUST_MIN"
                    :max="PROBATION_ADJUST_MAX"
                    :step="1"
                    :precision="0"
                    :class="{ 'duration-mismatch': durationMismatch }"
                    style="width: 100%"
                    @blur="handleDurationValidate"
                    @change="handleDurationChange"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="试用期薪资">
                  <el-input v-model="formData.salaryProbation" placeholder="请输入试用期薪资" />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row v-if="durationMismatch" :gutter="16">
              <el-col :span="24">
                <div class="form-warning-tip" style="margin-top: -8px">
                  <el-icon class="mr-1"><Warning /></el-icon>
                  <span>{{ durationValidationResult?.message || '试用期时长不符合岗位类别建议范围' }}</span>
                  <span v-if="durationValidationResult?.recommendedDuration">
                    （推荐时长：{{ durationValidationResult.recommendedDuration }}个月）
                  </span>
                </div>
              </el-col>
            </el-row>

            <el-row :gutter="16" v-if="showDurationAdjustedReason">
              <el-col :span="24">
                <el-form-item
                  label="调整原因"
                  prop="reasonAdjusted"
                  :class="{ shake: shakeField === 'reasonAdjusted' }"
                >
                  <el-input
                    v-model="formData.reasonAdjusted"
                    type="textarea"
                    :rows="2"
                    :maxlength="500"
                    show-word-limit
                    placeholder="修改试用期时长时必填，请说明调整原因"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </template>

          <template v-if="mode === 'edit-duration'">
            <el-row :gutter="16">
              <el-col :span="24">
                <el-alert
                  :title="`当前人员：${formData.name || '-'} | 部门：${formData.department || '-'} | 职位：${formData.position || '-'}`"
                  type="info"
                  :closable="false"
                  style="margin-bottom: 16px"
                />
              </el-col>
            </el-row>
            <el-row :gutter="16">
              <el-col :span="8">
                <el-form-item label="原时长(月)">
                  <el-input-number
                    v-model="originalDuration"
                    disabled
                    :min="1"
                    :max="6"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item
                  label="新时长(月)"
                  prop="newDuration"
                  :class="['duration-mismatch-wrap', { shake: shakeField === 'newDuration' }]"
                >
                  <el-input-number
                    v-model="formData.newDuration"
                    :min="PROBATION_ADJUST_MIN"
                    :max="PROBATION_ADJUST_MAX"
                    :step="1"
                    :precision="0"
                    :class="{ 'duration-mismatch': durationMismatch }"
                    style="width: 100%"
                    @blur="handleDurationValidate"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="变动(月)">
                  <el-input
                    :value="durationDiffText"
                    disabled
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row v-if="durationMismatch" :gutter="16">
              <el-col :span="24">
                <div class="form-warning-tip" style="margin-top: -8px">
                  <el-icon class="mr-1"><Warning /></el-icon>
                  <span>{{ durationValidationResult?.message || '试用期时长不符合岗位类别建议范围' }}</span>
                </div>
              </el-col>
            </el-row>
            <el-row :gutter="16">
              <el-col :span="24">
                <el-form-item
                  label="调整原因"
                  prop="reason"
                  :class="{ shake: shakeField === 'reason' }"
                >
                  <el-input
                    v-model="formData.reason"
                    type="textarea"
                    :rows="3"
                    :maxlength="500"
                    show-word-limit
                    placeholder="请详细说明调整试用期时长的原因"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </template>

          <template v-if="mode === 'create' || mode === 'set-assessments'">
            <el-divider v-if="mode === 'create' && basicInfoFilled">考核指标配置</el-divider>
            <div
              v-if="mode === 'set-assessments'"
              style="margin-bottom: 12px"
            >
              <el-alert
                :title="`当前人员：${formData.name || '-'} | 部门：${formData.department || '-'} | 职位：${formData.position || '-'}`"
                type="info"
                :closable="false"
                style="margin-bottom: 16px"
              />
            </div>
            <div
              class="weight-summary-bar"
              :class="{ 'weight-error': totalWeight !== 100 }"
            >
              <span>权重合计：</span>
              <strong :class="{ 'text-danger': totalWeight !== 100 }">{{ totalWeight }}%</strong>
              <el-tag
                v-if="totalWeight === 100"
                type="success"
                size="small"
                style="margin-left: 12px"
              >
                权重配置正确
              </el-tag>
              <el-tag
                v-else
                type="danger"
                size="small"
                style="margin-left: 12px"
              >
                权重需合计100%，当前差额：{{ 100 - totalWeight }}%
              </el-tag>
            </div>
            <el-table
              :data="assessmentIndicators"
              border
              stripe
              style="width: 100%; margin-bottom: 8px"
              @cell-click="handleCellClick"
            >
              <el-table-column
                type="index"
                label="序号"
                width="60"
                align="center"
              />
              <el-table-column label="指标名称" min-width="120">
                <template #default="{ row, $index }">
                  <el-form-item
                    :prop="`indicators.${$index}.indicatorName`"
                    :rules="{ required: true, message: '请输入指标名称', trigger: 'blur' }"
                    style="margin-bottom: 0; width: 100%"
                  >
                    <el-input
                      v-model="row.indicatorName"
                      placeholder="请输入指标名称"
                      maxlength="20"
                      show-word-limit
                    />
                  </el-form-item>
                </template>
              </el-table-column>
              <el-table-column label="权重(%)" width="140" align="center">
                <template #default="{ row, $index }">
                  <el-form-item
                    :prop="`indicators.${$index}.indicatorWeight`"
                    :rules="indicatorWeightRule"
                    style="margin-bottom: 0; width: 100%"
                  >
                    <el-input-number
                      v-model="row.indicatorWeight"
                      :min="5"
                      :max="60"
                      :step="5"
                      :precision="0"
                      controls-position="right"
                      style="width: 100%"
                    />
                  </el-form-item>
                </template>
              </el-table-column>
              <el-table-column label="指标描述" min-width="200">
                <template #default="{ row }">
                  <el-input
                    v-model="row.indicatorDesc"
                    placeholder="请输入指标描述"
                    type="textarea"
                    :autosize="{ minRows: 1, maxRows: 2 }"
                    maxlength="200"
                    show-word-limit
                  />
                </template>
              </el-table-column>
              <el-table-column label="目标值" min-width="160">
                <template #default="{ row }">
                  <el-input
                    v-model="row.targetValue"
                    placeholder="请输入考核目标值"
                    maxlength="100"
                    show-word-limit
                  />
                </template>
              </el-table-column>
              <el-table-column
                v-if="mode === 'create'"
                label="操作"
                width="80"
                align="center"
              >
                <template #default="{ $index }">
                  <el-button
                    type="danger"
                    link
                    size="small"
                    :disabled="assessmentIndicators.length <= 5"
                    @click="removeIndicator($index)"
                  >
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
            <div v-if="mode === 'create'" class="add-indicator-row">
              <el-button type="primary" link @click="addIndicator">
                <el-icon><Plus /></el-icon>
                <span>新增考核指标</span>
              </el-button>
            </div>
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
import { ElMessage, type FormInstance, type FormRules, type FormItemRule } from 'element-plus';
import { Warning, CircleCheck, Plus } from '@element-plus/icons-vue';
import dayjs from 'dayjs';
import {
  checkProbationPrerequisitesApi,
  getProbationDefaultMatchingApi,
  validateProbationDurationApi,
  createProbationApi,
  updateProbationDurationApi,
  setProbationAssessmentsApi,
  getOnboardAuditPassedList,
  type ProbationItem,
  type ProbationAssessmentItem,
  type ProbationCreateData,
  type ProbationDurationValidationResult,
  type ProbationDefaultMatchingResult,
  type ProbationPrerequisiteResult,
} from '@/api/probation';
import {
  DATE_FORMAT,
  PROBATION_ADJUST_MIN,
  PROBATION_ADJUST_MAX,
  DEFAULT_ASSESSMENT_INDICATORS,
  JobCategory,
  type AssessmentIndicator,
} from '@/constants/recruitment';

type FormMode = 'create' | 'edit-duration' | 'set-assessments';

interface Props {
  visible: boolean;
  mode: FormMode;
  initialData?: Partial<ProbationItem>;
}

const props = withDefaults(defineProps<Props>(), {
  initialData: () => ({}),
});

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'success', data: ProbationItem): void;
}>();

const dialogVisible = ref(props.visible);
const formRef = ref<FormInstance>();
const submitLoading = ref(false);
const shakeField = ref('');

const prerequisiteWarning = ref('');
const prerequisiteSuccess = ref('');
const prerequisiteValid = ref(true);
const onboardSelected = ref(false);

const durationMismatch = ref(false);
const durationValidationResult = ref<ProbationDurationValidationResult | null>(null);

const onboardList = ref<Array<{
  id: number;
  resumeId: number;
  jobId: number;
  name?: string;
  phone?: string;
  department?: string;
  position?: string;
  jobLevel?: string;
  salaryBase?: number;
  reportTo?: string;
  onboardDate?: string;
}>>([]);

interface FormDataType {
  onboardId?: number;
  resumeId?: number;
  jobId?: number;
  employeeNo?: string;
  name?: string;
  phone?: string;
  department?: string;
  position?: string;
  jobLevel?: string;
  startDate?: string;
  endDate?: string;
  duration?: number;
  salaryProbation?: string;
  salaryRegular?: string;
  mentor?: string;
  reasonAdjusted?: string;
  newDuration?: number;
  reason?: string;
  jobCategory?: string;
}

const formData = reactive<FormDataType>({
  onboardId: undefined,
  resumeId: undefined,
  jobId: undefined,
  employeeNo: '',
  name: '',
  phone: '',
  department: '',
  position: '',
  jobLevel: '',
  startDate: '',
  endDate: '',
  duration: undefined,
  salaryProbation: '',
  salaryRegular: '',
  mentor: '',
  reasonAdjusted: '',
  newDuration: undefined,
  reason: '',
  jobCategory: '',
});

const originalDuration = ref<number | undefined>(undefined);
const originalStartDate = ref<string>('');
const defaultDurationFromMatching = ref<number>(3);
const assessmentIndicators = ref<(AssessmentIndicator & { id?: string })[]>([]);

const dialogTitle = computed(() => {
  const titleMap: Record<FormMode, string> = {
    create: '创建试用期记录',
    'edit-duration': '调整试用期时长',
    'set-assessments': '设置考核指标',
  };
  return titleMap[props.mode];
});

const submitButtonText = computed(() => {
  const textMap: Record<FormMode, string> = {
    create: '创建',
    'edit-duration': '确认调整',
    'set-assessments': '保存指标',
  };
  return textMap[props.mode];
});

const basicInfoFilled = computed(() => {
  return !!formData.onboardId && onboardSelected.value;
});

const showDurationAdjustedReason = computed(() => {
  if (props.mode !== 'create') return false;
  if (formData.duration === undefined || defaultDurationFromMatching.value === undefined) return false;
  return formData.duration !== defaultDurationFromMatching.value;
});

const totalWeight = computed(() => {
  return assessmentIndicators.value.reduce((sum, item) => sum + (item.indicatorWeight || 0), 0);
});

const durationDiffText = computed(() => {
  if (originalDuration.value === undefined || formData.newDuration === undefined) return '-';
  const diff = formData.newDuration - originalDuration.value;
  if (diff > 0) return `+${diff}`;
  return diff.toString();
});

const isSubmitDisabled = computed(() => {
  if (submitLoading.value) return true;
  if (props.mode === 'create') {
    if (!prerequisiteValid.value) return true;
    if (!formData.onboardId) return true;
    if (totalWeight.value !== 100) return true;
    if (assessmentIndicators.value.length < 5) return true;
  }
  if (props.mode === 'set-assessments') {
    if (totalWeight.value !== 100) return true;
    if (assessmentIndicators.value.length < 5) return true;
  }
  return false;
});

const indicatorWeightRule: FormItemRule[] = [
  {
    required: true,
    message: '请输入权重',
    trigger: 'blur',
  },
  {
    type: 'number',
    min: 5,
    max: 60,
    message: '权重应在5%-60%之间',
    trigger: 'blur',
  },
];

const triggerShake = (fieldName: string) => {
  shakeField.value = fieldName;
  setTimeout(() => {
    shakeField.value = '';
  }, 500);
};

const formRules: FormRules = {
  onboardId: [
    {
      required: true,
      message: '请选择入职人员',
      trigger: 'change',
      validator: (_rule, value, callback) => {
        if (!value || value <= 0) {
          triggerShake('onboardId');
          callback(new Error('请选择入职人员'));
        } else {
          callback();
        }
      },
    },
  ],
  startDate: [
    {
      required: true,
      message: '请选择开始日期',
      trigger: 'change',
      validator: (_rule, value, callback) => {
        if (!value) {
          triggerShake('startDate');
          callback(new Error('请选择开始日期'));
        } else if (formData.endDate && dayjs(value).isAfter(formData.endDate)) {
          triggerShake('startDate');
          callback(new Error('开始日期不能晚于结束日期'));
        } else {
          callback();
        }
      },
    },
  ],
  endDate: [
    {
      required: true,
      message: '请选择结束日期',
      trigger: 'change',
      validator: (_rule, value, callback) => {
        if (!value) {
          triggerShake('endDate');
          callback(new Error('请选择结束日期'));
        } else if (formData.startDate && dayjs(value).isBefore(formData.startDate)) {
          triggerShake('endDate');
          callback(new Error('结束日期不能早于开始日期'));
        } else {
          callback();
        }
      },
    },
  ],
  duration: [
    {
      required: true,
      message: '请输入试用期时长',
      trigger: 'blur',
      validator: (_rule, value, callback) => {
        if (value === undefined || value === null || value === '') {
          triggerShake('duration');
          callback(new Error('请输入试用期时长'));
        } else if (value < PROBATION_ADJUST_MIN || value > PROBATION_ADJUST_MAX) {
          triggerShake('duration');
          callback(new Error(`试用期应在${PROBATION_ADJUST_MIN}-${PROBATION_ADJUST_MAX}个月之间`));
        } else {
          callback();
        }
      },
    },
  ],
  reasonAdjusted: [
    {
      validator: (_rule, value, callback) => {
        if (showDurationAdjustedReason.value && (!value || !value.trim())) {
          triggerShake('reasonAdjusted');
          callback(new Error('修改试用期时长时必须填写调整原因'));
        } else {
          callback();
        }
      },
      trigger: 'blur',
    },
  ],
  newDuration: [
    {
      required: true,
      message: '请输入新的试用期时长',
      trigger: 'blur',
      validator: (_rule, value, callback) => {
        if (value === undefined || value === null || value === '') {
          triggerShake('newDuration');
          callback(new Error('请输入新的试用期时长'));
        } else if (value < PROBATION_ADJUST_MIN || value > PROBATION_ADJUST_MAX) {
          triggerShake('newDuration');
          callback(new Error(`试用期应在${PROBATION_ADJUST_MIN}-${PROBATION_ADJUST_MAX}个月之间`));
        } else {
          callback();
        }
      },
    },
  ],
  reason: [
    {
      required: true,
      message: '请填写调整原因',
      trigger: 'blur',
      validator: (_rule, value, callback) => {
        if (!value || !value.trim()) {
          triggerShake('reason');
          callback(new Error('请填写调整原因'));
        } else if (value.trim().length < 5) {
          triggerShake('reason');
          callback(new Error('调整原因至少5个字'));
        } else {
          callback();
        }
      },
    },
  ],
};

const loadOnboardList = async () => {
  try {
    onboardList.value = await getOnboardAuditPassedList();
  } catch {
    onboardList.value = [];
  }
};

const resetForm = () => {
  Object.assign(formData, {
    onboardId: undefined,
    resumeId: undefined,
    jobId: undefined,
    employeeNo: '',
    name: '',
    phone: '',
    department: '',
    position: '',
    jobLevel: '',
    startDate: '',
    endDate: '',
    duration: undefined,
    salaryProbation: '',
    salaryRegular: '',
    mentor: '',
    reasonAdjusted: '',
    newDuration: undefined,
    reason: '',
    jobCategory: '',
  });

  originalDuration.value = undefined;
  originalStartDate.value = '';
  defaultDurationFromMatching.value = 3;

  prerequisiteWarning.value = '';
  prerequisiteSuccess.value = '';
  prerequisiteValid.value = true;
  onboardSelected.value = false;

  durationMismatch.value = false;
  durationValidationResult.value = null;

  assessmentIndicators.value = DEFAULT_ASSESSMENT_INDICATORS.map((item, idx) => ({
    ...item,
    id: `indicator-${Date.now()}-${idx}`,
  }));

  formRef.value?.resetFields();
};

const initFormData = () => {
  if (!props.initialData || Object.keys(props.initialData).length === 0) return;

  const data = props.initialData;

  if (props.mode === 'create') {
    Object.assign(formData, {
      onboardId: data.onboardId,
      resumeId: data.resumeId,
      jobId: data.jobId,
      employeeNo: data.employeeNo || '',
      name: data.name || '',
      phone: data.phone || '',
      department: data.department || '',
      position: data.position || '',
      jobLevel: data.jobLevel || '',
      startDate: data.startDate || '',
      endDate: data.endDate || '',
      duration: data.duration,
      salaryProbation: data.salaryProbation || '',
      salaryRegular: data.salaryRegular || '',
      mentor: data.mentor || '',
    });
  }

  if (props.mode === 'edit-duration') {
    Object.assign(formData, {
      name: data.name || '',
      department: data.department || '',
      position: data.position || '',
      newDuration: data.duration,
      jobCategory: data.jobCategory || JobCategory.OTHER,
    });
    originalDuration.value = data.duration;
    originalStartDate.value = data.startDate || '';
  }

  if (props.mode === 'set-assessments') {
    Object.assign(formData, {
      name: data.name || '',
      department: data.department || '',
      position: data.position || '',
    });
  }

  if (data.assessments && data.assessments.length > 0) {
    assessmentIndicators.value = data.assessments.map((item, idx) => ({
      indicatorName: item.indicatorName,
      indicatorWeight: item.indicatorWeight,
      indicatorDesc: item.indicatorDesc || '',
      targetValue: item.targetValue || '',
      id: `indicator-${Date.now()}-${idx}`,
    }));
  }
};

const handleOnboardSelect = async (onboardId: number) => {
  if (!onboardId || onboardId <= 0) {
    prerequisiteWarning.value = '';
    prerequisiteSuccess.value = '';
    prerequisiteValid.value = true;
    onboardSelected.value = false;
    return;
  }
  await checkPrerequisites(onboardId);
};

const handleOnboardIdBlur = async () => {
  if (props.mode !== 'create') return;
  if (!formData.onboardId || formData.onboardId <= 0) return;
  if (onboardSelected.value) return;
  await checkPrerequisites(formData.onboardId);
};

const checkPrerequisites = async (onboardId: number) => {
  try {
    const result: ProbationPrerequisiteResult = await checkProbationPrerequisitesApi(onboardId);
    if (!result.valid) {
      prerequisiteValid.value = false;
      prerequisiteWarning.value = result.messages?.[0] || '前置条件不满足，无法创建试用期记录';
      prerequisiteSuccess.value = '';
      onboardSelected.value = false;
    } else {
      prerequisiteValid.value = true;
      prerequisiteWarning.value = '';
      prerequisiteSuccess.value = '前置条件校验通过，已自动回填入职信息';
      onboardSelected.value = true;

      if (result.onboardData) {
        const ob = result.onboardData;
        formData.resumeId = ob.resumeId;
        formData.jobId = ob.jobId;
        formData.name = ob.name || formData.name;
        formData.phone = ob.phone || formData.phone;
        formData.department = ob.department || formData.department;
        formData.position = ob.position || formData.position;
        formData.jobLevel = ob.jobLevel || formData.jobLevel;
        formData.salaryRegular = ob.salaryRegular || (ob as any).salaryBase ? `${(ob as any).salaryBase}K` : formData.salaryRegular;
        formData.mentor = (ob as any).reportTo || formData.mentor;
        formData.startDate = ob.startDate || (ob as any).onboardDate || formData.startDate;
        formData.jobCategory = (ob as any).jobCategory || formData.jobCategory;

        if (!formData.employeeNo && ob.name) {
          const dept = ob.department?.substring(0, 2) || 'EM';
          const rand = Math.floor(1000 + Math.random() * 9000);
          formData.employeeNo = `${dept.toUpperCase()}${rand}`;
        }

        if (formData.jobId) {
          await loadDefaultMatching(formData.jobId);
        }

        if (formData.startDate && formData.duration) {
          autoCalculateEndDate();
        }
      }
    }
  } catch (error: any) {
    prerequisiteValid.value = false;
    prerequisiteWarning.value = error?.message || '前置条件校验失败';
    prerequisiteSuccess.value = '';
    onboardSelected.value = false;
  }
};

const loadDefaultMatching = async (jobId: number) => {
  try {
    const result: ProbationDefaultMatchingResult = await getProbationDefaultMatchingApi(jobId);
    defaultDurationFromMatching.value = result.defaultDuration || 3;

    if (!formData.duration) {
      formData.duration = result.defaultDuration;
    }

    if (result.defaultIndicators && result.defaultIndicators.length > 0 && assessmentIndicators.value.length === DEFAULT_ASSESSMENT_INDICATORS.length) {
      const isDefault = assessmentIndicators.value.every((item, idx) => {
        const def = DEFAULT_ASSESSMENT_INDICATORS[idx];
        return def && item.indicatorName === def.indicatorName;
      });
      if (isDefault) {
        assessmentIndicators.value = result.defaultIndicators.map((item, idx) => ({
          ...item,
          id: `indicator-${Date.now()}-${idx}`,
        }));
      }
    }
  } catch {
    defaultDurationFromMatching.value = PROBATION_DURATION_BY_CATEGORY_DEFAULT(formData.jobCategory);
  }
};

const PROBATION_DURATION_BY_CATEGORY_DEFAULT = (category?: string): number => {
  const map: Record<string, number> = {
    tech: 3,
    product: 3,
    design: 2,
    operations: 2,
    marketing: 2,
    hr: 2,
    finance: 3,
    admin: 1,
    sales: 3,
    other: 2,
  };
  return map[category || 'other'] || 2;
};

const handleDurationValidate = async () => {
  const jobCategory = formData.jobCategory || JobCategory.OTHER;
  let duration: number | undefined;

  if (props.mode === 'create') {
    duration = formData.duration;
  } else if (props.mode === 'edit-duration') {
    duration = formData.newDuration;
  }

  if (duration === undefined || duration <= 0 || !jobCategory) {
    durationMismatch.value = false;
    durationValidationResult.value = null;
    return;
  }

  try {
    const result = await validateProbationDurationApi(jobCategory, duration);
    durationValidationResult.value = result;
    durationMismatch.value = !result.valid;
  } catch {
    durationMismatch.value = false;
    durationValidationResult.value = null;
  }
};

const handleDurationChange = () => {
  if (formData.startDate && formData.duration) {
    autoCalculateEndDate();
  }
};

const handleDateChange = () => {
  if (formData.startDate && formData.endDate) {
    const start = dayjs(formData.startDate);
    const end = dayjs(formData.endDate);
    const months = Math.max(1, Math.ceil(end.diff(start, 'month', true)));
    if (months !== formData.duration) {
      formData.duration = months;
    }
  }
};

const autoCalculateEndDate = () => {
  if (!formData.startDate || !formData.duration) return;
  const end = dayjs(formData.startDate).add(formData.duration, 'month').subtract(1, 'day');
  formData.endDate = end.format(DATE_FORMAT);
};

const addIndicator = () => {
  assessmentIndicators.value.push({
    indicatorName: '',
    indicatorWeight: 10,
    indicatorDesc: '',
    targetValue: '',
    id: `indicator-${Date.now()}-${assessmentIndicators.value.length}`,
  });
};

const removeIndicator = (index: number) => {
  if (assessmentIndicators.value.length <= 5) {
    ElMessage.warning('考核指标至少5项');
    return;
  }
  assessmentIndicators.value.splice(index, 1);
};

const handleCellClick = (_row: any, _column: any) => {
  // cell click handler if needed
};

const validateAssessmentIndicators = (): boolean => {
  if (assessmentIndicators.value.length < 5) {
    ElMessage.error('考核指标不能少于5项');
    return false;
  }

  for (let i = 0; i < assessmentIndicators.value.length; i++) {
    const item = assessmentIndicators.value[i];
    if (!item.indicatorName || !item.indicatorName.trim()) {
      ElMessage.error(`第${i + 1}项指标名称不能为空`);
      return false;
    }
    if (!item.indicatorWeight || item.indicatorWeight < 5 || item.indicatorWeight > 60) {
      ElMessage.error(`第${i + 1}项权重应在5%-60%之间`);
      return false;
    }
  }

  if (totalWeight.value !== 100) {
    ElMessage.error(`考核指标权重合计必须为100%，当前为${totalWeight.value}%`);
    return false;
  }

  return true;
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

  if ((props.mode === 'create' || props.mode === 'set-assessments') && !validateAssessmentIndicators()) {
    return;
  }

  submitLoading.value = true;
  try {
    let result: ProbationItem;

    if (props.mode === 'create') {
      const submitData: ProbationCreateData = {
        onboardId: formData.onboardId!,
        resumeId: formData.resumeId,
        jobId: formData.jobId,
        startDate: formData.startDate!,
        endDate: formData.endDate!,
        duration: formData.duration,
        salaryProbation: formData.salaryProbation,
        salaryRegular: formData.salaryRegular,
        department: formData.department,
        position: formData.position,
        jobLevel: formData.jobLevel,
        mentor: formData.mentor,
        reasonAdjusted: formData.reasonAdjusted,
        indicators: assessmentIndicators.value.map(item => ({
          indicatorName: item.indicatorName,
          indicatorWeight: item.indicatorWeight,
          indicatorDesc: item.indicatorDesc,
          targetValue: item.targetValue,
        })),
      };

      Object.keys(submitData).forEach((key) => {
        const val = (submitData as any)[key];
        if (val === undefined || val === null || val === '') {
          delete (submitData as any)[key];
        }
      });

      result = await createProbationApi(submitData);
      ElMessage.success('试用期记录创建成功');
    } else if (props.mode === 'edit-duration') {
      if (!props.initialData?.id) {
        throw new Error('缺少试用期记录ID');
      }
      result = await updateProbationDurationApi(props.initialData.id, {
        newDuration: formData.newDuration!,
        reason: formData.reason!,
      });
      ElMessage.success('试用期时长调整成功');
    } else {
      if (!props.initialData?.id) {
        throw new Error('缺少试用期记录ID');
      }
      const indicators: ProbationAssessmentItem[] = assessmentIndicators.value.map(item => ({
        probationId: props.initialData!.id!,
        indicatorName: item.indicatorName,
        indicatorWeight: item.indicatorWeight,
        indicatorDesc: item.indicatorDesc,
        targetValue: item.targetValue,
      }));
      result = await setProbationAssessmentsApi(props.initialData.id, indicators);
      ElMessage.success('考核指标保存成功');
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
      nextTick(async () => {
        initFormData();
        if (props.mode === 'create') {
          await loadOnboardList();
          if (formData.onboardId && formData.onboardId > 0) {
            await checkPrerequisites(formData.onboardId);
          }
        }
        if (props.mode === 'edit-duration') {
          handleDurationValidate();
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
.duration-mismatch {
  :deep(.el-input__wrapper) {
    border: 1px solid #f56c6c;
    box-shadow: 0 0 0 1px #f56c6c inset;
  }
}

.duration-mismatch-wrap {
  :deep(.el-form-item__content) {
    .duration-mismatch {
      .el-input__wrapper {
        border: 1px solid #f56c6c;
        box-shadow: 0 0 0 1px #f56c6c inset;
      }
    }
  }
}

@keyframes scale {
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
  animation: scale 0.3s ease-in-out;
}

.scale-fade-leave-active {
  animation-direction: reverse;
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
    flex-shrink: 0;
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
    flex-shrink: 0;
  }
}

.weight-summary-bar {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  background: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 12px;
  font-size: 13px;

  strong {
    margin-left: 4px;
    font-size: 16px;
  }

  .text-danger {
    color: #f56c6c;
  }

  &.weight-error {
    background: #fef0f0;
  }
}

.add-indicator-row {
  padding: 8px 0;
  text-align: right;
}

.el-divider {
  margin: 16px 0 12px 0;
}
</style>
