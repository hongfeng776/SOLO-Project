<template>
  <el-dialog
    :model-value="modelValue"
    :title="isEdit ? '编辑运营策略' : '新增运营策略'"
    width="680px"
    :close-on-click-modal="false"
    @update:model-value="handleVisibleChange"
    @closed="handleClosed"
  >
    <el-form
      ref="formRef"
      :model="localFormModel"
      :rules="rules"
      label-width="110px"
      label-position="right"
    >
      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="策略名称" prop="strategyName">
            <el-input
              v-model="localFormModel.strategyName"
              placeholder="请输入策略名称"
              maxlength="50"
              show-word-limit
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="策略类型" prop="strategyType">
            <el-select
              v-model="localFormModel.strategyType"
              placeholder="请选择策略类型"
              style="width: 100%"
            >
              <el-option
                v-for="(name, value) in OPERATION_STRATEGY_NAMES"
                :key="value"
                :label="name"
                :value="value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="目标等级" prop="targetActivityLevel">
            <el-select
              v-model="localFormModel.targetActivityLevel"
              placeholder="请选择目标活跃度等级"
              style="width: 100%"
            >
              <el-option
                v-for="(name, value) in ACTIVITY_LEVEL_NAMES"
                :key="value"
                :label="name"
                :value="String(value)"
              >
                <span style="float: left">{{ name }}</span>
                <span style="float: right; color: #8492a6; font-size: 13px">
                  <el-tag
                    :color="ACTIVITY_LEVEL_COLORS[Number(value)]"
                    effect="dark"
                    size="small"
                  >
                    {{ ACTIVITY_LEVEL_STRATEGY_MAP[Number(value)]?.length || 0 }}个默认策略
                  </el-tag>
                </span>
              </el-option>
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="触发方式" prop="triggerMode">
            <el-radio-group v-model="localFormModel.triggerMode">
              <el-radio :value="OperationExecuteType.IMMEDIATE">
                <el-icon style="vertical-align: -2px; color: #e6a23c"><Lightning /></el-icon>
                即时生效
              </el-radio>
              <el-radio :value="OperationExecuteType.SCHEDULED">
                <el-icon style="vertical-align: -2px; color: #409eff"><Clock /></el-icon>
                定时生效
              </el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="定时时间" v-if="localFormModel.triggerMode === OperationExecuteType.SCHEDULED">
            <el-date-picker
              v-model="localFormModel.triggerTime"
              type="datetime"
              placeholder="选择执行时间"
              value-format="YYYY-MM-DD HH:mm:ss"
              style="width: 100%"
              :disabled-date="disabledDate"
            />
          </el-form-item>
          <el-form-item label="策略状态" v-else prop="status">
            <el-switch
              v-model="localFormModel.status"
              :active-value="1"
              :inactive-value="0"
              active-text="启用"
              inactive-text="停用"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="优先级" prop="priority">
            <el-input-number
              v-model="localFormModel.priority"
              :min="1"
              :max="10"
              style="width: 100%"
              controls-position="right"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="自动适配" prop="autoApply">
            <el-switch
              v-model="localFormModel.autoApply"
              :active-value="1"
              :inactive-value="0"
              active-text="开启"
              inactive-text="关闭"
            />
            <el-tooltip content="等级变更时是否自动应用该策略" placement="top">
              <el-icon class="tip-icon"><Warning /></el-icon>
            </el-tooltip>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="策略描述">
            <el-input
              v-model="localFormModel.content"
              type="textarea"
              :rows="3"
              placeholder="请输入策略描述内容"
              maxlength="500"
              show-word-limit
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="权益配置">
            <el-input
              v-model="localFormModel.benefits"
              type="textarea"
              :rows="2"
              placeholder="请输入该策略关联的权益，多个权益用逗号分隔"
              maxlength="300"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="适用条件" v-if="showConditionHint">
            <div class="condition-hint">
              <el-alert
                :title="conditionHint"
                type="info"
                :closable="false"
                show-icon
              />
            </div>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="24">
          <el-form-item label="备注说明">
            <el-input
              v-model="localFormModel.remark"
              type="textarea"
              :rows="2"
              placeholder="请输入备注信息"
              maxlength="200"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">
        {{ isEdit ? '保存修改' : '确认创建' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { Lightning, Clock, Warning } from '@element-plus/icons-vue'
import type { ActivityStrategy } from '@/types/business'
import {
  OperationStrategyType,
  OPERATION_STRATEGY_NAMES,
  OperationExecuteType,
  ActivityLevel,
  ACTIVITY_LEVEL_NAMES,
  ACTIVITY_LEVEL_COLORS,
  ACTIVITY_LEVEL_STRATEGY_MAP
} from '@/enums/business'

interface Props {
  modelValue: boolean
  formModel: Partial<ActivityStrategy>
  isEdit: boolean
  strategyTypeDict: Record<string, string>
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'submit', data: Partial<ActivityStrategy>): void
}>()

const formRef = ref<FormInstance>()
const submitting = ref(false)

const localFormModel = reactive<Partial<ActivityStrategy>>({
  strategyName: '',
  strategyType: OperationStrategyType.FLOW_BOOST,
  targetActivityLevel: String(ActivityLevel.NORMAL),
  content: '',
  benefits: '',
  triggerMode: OperationExecuteType.IMMEDIATE,
  triggerTime: '',
  status: 1,
  priority: 1,
  autoApply: 1,
  remark: ''
})

const rules: FormRules = {
  strategyName: [
    { required: true, message: '请输入策略名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  strategyType: [
    { required: true, message: '请选择策略类型', trigger: 'change' }
  ],
  targetActivityLevel: [
    { required: true, message: '请选择目标等级', trigger: 'change' }
  ],
  triggerMode: [
    { required: true, message: '请选择触发方式', trigger: 'change' }
  ],
  priority: [
    { required: true, message: '请设置优先级', trigger: 'blur' }
  ]
}

const showConditionHint = computed(() => {
  return localFormModel.strategyType === OperationStrategyType.FLOW_BOOST ||
    localFormModel.strategyType === OperationStrategyType.WAKEUP_MESSAGE ||
    localFormModel.strategyType === OperationStrategyType.ACTIVITY_PRIORITY
})

const conditionHint = computed(() => {
  const level = Number(localFormModel.targetActivityLevel)
  const strategies = ACTIVITY_LEVEL_STRATEGY_MAP[level] || []
  const typeName = OPERATION_STRATEGY_NAMES[localFormModel.strategyType as string] || ''
  const levelName = ACTIVITY_LEVEL_NAMES[level] || ''
  
  if (localFormModel.strategyType === OperationStrategyType.FLOW_BOOST) {
    return `流量扶持策略：${levelName}用户将获得额外曝光权重，内容推荐量提升30%-50%`
  }
  if (localFormModel.strategyType === OperationStrategyType.WAKEUP_MESSAGE) {
    return `唤醒推送策略：向${levelName}用户发送个性化推送消息，包含专属优惠券或召回内容`
  }
  if (localFormModel.strategyType === OperationStrategyType.ACTIVITY_PRIORITY) {
    return `活动优先策略：${levelName}用户享有活动报名优先权，可提前24小时参与限量活动`
  }
  return `当前${levelName}等级默认适配策略：${strategies.map(s => OPERATION_STRATEGY_NAMES[s]).join('、') || '无'}`
})

watch(() => props.formModel, (newVal) => {
  if (newVal) {
    Object.assign(localFormModel, newVal)
  }
}, { deep: true, immediate: true })

watch(() => props.modelValue, (newVal) => {
  if (newVal && props.formModel) {
    nextTick(() => {
      Object.assign(localFormModel, props.formModel)
      formRef.value?.clearValidate()
    })
  }
})

const handleVisibleChange = (val: boolean) => {
  emit('update:modelValue', val)
}

const handleClosed = () => {
  submitting.value = false
  formRef.value?.clearValidate()
}

const disabledDate = (time: Date) => {
  return time.getTime() < Date.now() - 8.64e7
}

const handleCancel = () => {
  emit('update:modelValue', false)
}

const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
  } catch (error) {
    ElMessage.warning('请检查表单填写是否完整')
    return
  }

  if (localFormModel.triggerMode === OperationExecuteType.SCHEDULED && !localFormModel.triggerTime) {
    ElMessage.warning('请选择定时执行时间')
    return
  }

  submitting.value = true
  try {
    const submitData: Partial<ActivityStrategy> = {
      strategyName: localFormModel.strategyName,
      strategyType: localFormModel.strategyType,
      targetActivityLevel: localFormModel.targetActivityLevel,
      content: localFormModel.content,
      benefits: localFormModel.benefits,
      triggerMode: localFormModel.triggerMode,
      status: localFormModel.status,
      priority: localFormModel.priority,
      autoApply: localFormModel.autoApply,
      remark: localFormModel.remark
    }

    if (localFormModel.triggerMode === OperationExecuteType.SCHEDULED) {
      submitData.triggerTime = localFormModel.triggerTime
    }

    emit('submit', submitData)
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.tip-icon {
  margin-left: 6px;
  color: #e6a23c;
  cursor: help;
  vertical-align: -2px;
}

.condition-hint {
  width: 100%;
}
</style>
