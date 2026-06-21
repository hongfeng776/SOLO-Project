<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? '编辑营销活动' : '创建营销活动'"
    width="1100px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    custom-class="marketing-dialog"
    :before-close="handleBeforeClose"
    destroy-on-close
  >
    <div class="dialog-content">
      <div class="validate-sidebar">
        <div class="validate-header">
          <div class="validate-icon" :class="riskStatusClass">
            <el-icon>
              <CircleCheck v-if="validateResult?.valid" />
              <Warning v-else-if="validateResult?.summary.warningCount > 0" />
              <CircleClose v-else />
            </el-icon>
          </div>
          <div class="validate-info">
            <h4>{{ validateResult?.valid ? '配置校验通过' : '存在配置异常' }}</h4>
            <p v-if="validateResult" class="validate-summary">
              通过<em class="pass">{{ validateResult.summary.passCount }}</em>
              警告<em class="warn">{{ validateResult.summary.warningCount }}</em>
              错误<em class="error">{{ validateResult.summary.errorCount }}</em>
            </p>
          </div>
          <el-button size="small" :loading="validating" @click="runValidate">
            <el-icon><Refresh /></el-icon>
            重新校验
          </el-button>
        </div>

        <div class="validate-progress">
          <div
            class="progress-bar"
            :style="{ width: validateProgress + '%' }"
            :class="riskStatusClass"
          />
        </div>

        <div class="validate-list" v-if="validateResult">
          <div v-if="blockingErrors.length > 0" class="validate-section">
            <div class="section-header error">
              <el-icon><CircleClose /></el-icon>
              <span>阻断错误 ({{ blockingErrors.length }})</span>
            </div>
            <div
              v-for="(err, idx) in blockingErrors"
              :key="'e-' + idx"
              class="validate-item error"
              :class="{ shake: shakingField === err.field }"
              @click="scrollToField(err.field)"
            >
              <div class="item-icon"><el-icon><CircleClose /></el-icon></div>
              <div class="item-content">
                <span class="item-field">{{ getFieldLabel(err.field) }}</span>
                <p class="item-msg">{{ err.message }}</p>
                <ul v-if="err.detail && err.detail.length" class="item-detail">
                  <li v-for="(d, di) in err.detail" :key="di">{{ d }}</li>
                </ul>
              </div>
            </div>
          </div>

          <div v-if="validateResult.warnings.length > 0" class="validate-section">
            <div class="section-header warning">
              <el-icon><Warning /></el-icon>
              <span>风险提示 ({{ validateResult.warnings.length }})</span>
            </div>
            <div
              v-for="(warn, idx) in validateResult.warnings"
              :key="'w-' + idx"
              class="validate-item warning"
              @click="scrollToField(warn.field)"
            >
              <div class="item-icon"><el-icon><Warning /></el-icon></div>
              <div class="item-content">
                <span class="item-field">{{ getFieldLabel(warn.field) }}</span>
                <p class="item-msg">{{ warn.message }}</p>
                <ul v-if="warn.detail && warn.detail.length" class="item-detail">
                  <li v-for="(d, di) in warn.detail" :key="di">{{ d }}</li>
                </ul>
              </div>
            </div>
          </div>

          <div v-if="validateResult.passed.length > 0" class="validate-section">
            <div class="section-header pass">
              <el-icon><CircleCheck /></el-icon>
              <span>通过项 ({{ validateResult.passed.length }})</span>
            </div>
            <div
              v-for="(p, idx) in validateResult.passed"
              :key="'p-' + idx"
              class="validate-item pass"
            >
              <div class="item-icon"><el-icon><CircleCheck /></el-icon></div>
              <div class="item-content">
                <span class="item-field">{{ getFieldLabel(p.field) }}</span>
                <p class="item-msg">{{ p.message }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="form-main" ref="formMainRef">
        <el-tabs v-model="activeTab" class="campaign-tabs">
          <el-tab-pane label="基础参数" name="basic">
            <el-form
              ref="formRef"
              :model="formData"
              :rules="formRules"
              label-width="110px"
              class="campaign-form"
              size="default"
            >
              <div class="form-section">
                <div class="section-title">
                  <el-icon><Document /></el-icon>
                  活动基本信息
                </div>
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="活动名称" prop="name" :class="{ 'error-field': isFieldError('name') }">
                      <el-input
                        v-model="formData.name"
                        placeholder="请输入活动名称（2-50字）"
                        maxlength="50"
                        show-word-limit
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="活动编码" prop="code" :class="{ 'error-field': isFieldError('code') }">
                      <el-input
                        v-model="formData.code"
                        placeholder="3-30位大写字母、数字或下划线"
                        maxlength="30"
                      />
                      <template #append>
                        <el-button @click="generateCode">
                          <el-icon><MagicStick /></el-icon>
                          生成
                        </el-button>
                      </template>
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="20">
                  <el-col :span="24">
                    <el-form-item label="活动类型" prop="type">
                      <el-radio-group v-model="formData.type">
                        <el-radio :value="1">新用户</el-radio>
                        <el-radio :value="2">节日</el-radio>
                        <el-radio :value="3">高峰补贴</el-radio>
                        <el-radio :value="4">会员专享</el-radio>
                      </el-radio-group>
                    </el-form-item>
                  </el-col>
                </el-row>
              </div>

              <div class="form-section" ref="timeSectionRef">
                <div class="section-title">
                  <el-icon><Calendar /></el-icon>
                  活动时段与预算
                </div>
                <el-row :gutter="20">
                  <el-col :span="24">
                    <el-form-item
                      label="活动时间"
                      prop="timeRange"
                      :class="{ 'error-field': isFieldError('timeRange') }"
                    >
                      <el-date-picker
                        v-model="timeRange"
                        type="datetimerange"
                        range-separator="至"
                        start-placeholder="开始时间"
                        end-placeholder="结束时间"
                        :shortcuts="timeShortcuts"
                        value-format="YYYY-MM-DD HH:mm:ss"
                        style="width: 100%"
                      />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="20">
                  <el-col :span="8">
                    <el-form-item label="活动预算" prop="budget" :class="{ 'error-field': isFieldError('budget') }">
                      <el-input-number
                        v-model="formData.budget"
                        :min="0"
                        :precision="2"
                        :step="1000"
                        controls-position="right"
                        style="width: 100%"
                      />
                      <span class="form-unit">元</span>
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="每日预算" prop="dailyBudget" :class="{ 'error-field': isFieldError('dailyBudget') }">
                      <el-input-number
                        v-model="formData.dailyBudget"
                        :min="0"
                        :precision="2"
                        :step="100"
                        controls-position="right"
                        style="width: 100%"
                      />
                      <span class="form-unit">元</span>
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="活动状态">
                      <el-select v-model="formData.status" style="width: 100%">
                        <el-option label="保存为草稿" :value="0" />
                        <el-option label="提交待生效" :value="1" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                </el-row>
              </div>
            </el-form>
          </el-tab-pane>

          <el-tab-pane label="场景与规则" name="rules">
            <CampaignSceneRules v-model="formData" @scene-change="handleSceneChange" />
          </el-tab-pane>

          <el-tab-pane label="人群定向" name="audience" ref="audienceTabRef">
            <AudienceTargetingConfig
              v-model="formData"
              :campaign-id="editData?.id as number"
              @warnings="handleAudienceWarnings"
            />
          </el-tab-pane>

          <el-tab-pane label="活动描述" name="desc">
            <el-form label-width="110px" size="default">
              <el-form-item label="活动描述">
                <el-input
                  v-model="formData.description"
                  type="textarea"
                  :rows="8"
                  placeholder="请输入活动详细描述，用于后台管理说明"
                  maxlength="500"
                  show-word-limit
                />
              </el-form-item>
              <el-form-item label="扩展规则(JSON)">
                <el-input
                  v-model="rulesJsonText"
                  type="textarea"
                  :rows="10"
                  placeholder='可选，示例：{"peakHours":["07:00-09:00"]}'
                  @blur="parseRulesJson"
                />
              </el-form-item>
            </el-form>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <div class="footer-left">
          <el-tag
            v-if="validateResult?.riskLevel === 3"
            type="danger"
            effect="dark"
          >
            <el-icon><WarningFilled /></el-icon>
            高风险配置，已阻断提交
          </el-tag>
          <el-tag
            v-else-if="validateResult?.riskLevel === 2"
            type="warning"
            effect="light"
          >
            <el-icon><Warning /></el-icon>
            中风险，请确认后提交
          </el-tag>
          <el-tag
            v-else-if="validateResult?.riskLevel === 1"
            type="info"
          >
            <el-icon><InfoFilled /></el-icon>
            低风险提示
          </el-tag>
          <el-tag
            v-else
            type="success"
            effect="dark"
          >
            <el-icon><CircleCheck /></el-icon>
            配置合规
          </el-tag>
        </div>
        <div class="footer-right">
          <el-button @click="handleBeforeClose">取消</el-button>
          <el-button @click="saveDraft" :loading="submitting">
            保存草稿
          </el-button>
          <el-button
            type="primary"
            :loading="submitting"
            :disabled="!canSubmit"
            @click="handleSubmit"
          >
            <el-icon><Check /></el-icon>
            {{ isEdit ? '保存修改' : '确认创建' }}
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  CircleCheck, CircleClose, Warning, Refresh, Document, Calendar,
  Check, WarningFilled, InfoFilled, MagicStick
} from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import CampaignSceneRules from '@/components/CampaignSceneRules/index.vue'
import AudienceTargetingConfig from '@/components/AudienceTargetingConfig/index.vue'
import {
  validateCampaignApi,
  createMarketingApi,
  updateMarketingApi,
  getSceneConfigApi
} from '@/api/marketing'
import {
  CampaignScene,
  CampaignStatus,
  SceneDefaultConfig
} from '@/enums/marketing'
import type {
  MarketingCampaign,
  ValidateResult,
  ValidateError,
  SceneConfig
} from '@/types/marketing'

const props = defineProps<{
  modelValue: boolean
  editData?: Partial<MarketingCampaign> | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void
  (e: 'success', data: MarketingCampaign): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const isEdit = computed(() => !!props.editData?.id)

const formRef = ref<FormInstance>()
const formMainRef = ref<HTMLElement>()
const timeSectionRef = ref<HTMLElement>()
const audienceTabRef = ref<any>(null)
const audienceWarnings = ref<string[]>([])

const defaultFormData = (): Partial<MarketingCampaign> => ({
  name: '',
  code: '',
  scene: CampaignScene.NEW_USER_GIFT,
  type: 1,
  couponId: null,
  subsidyAmount: 10,
  maxSubsidyPerOrder: 10,
  discountRate: 0,
  budget: 0,
  usedBudget: 0,
  dailyBudget: 0,
  startTime: '',
  endTime: '',
  targetUser: 2,
  userLevelMin: 0,
  registerDaysMin: 0,
  registerDaysMax: 0,
  inactiveDays: 0,
  cities: null,
  cityTierConfig: null,
  vehicleTypes: null,
  minOrderAmount: 0,
  perUserLimit: 1,
  perDayLimit: 0,
  totalCount: 0,
  mutuallyExclusive: 1,
  exclusiveScenes: null,
  rules: null,
  status: CampaignStatus.DRAFT,
  description: '',
  campaignPurpose: 0,
  audiencePurpose: 0,
  audienceVersion: 0,
  userTags: [],
  excludeUserTags: [],
  activityLevels: [],
  consumptionLevels: [],
  userLevels: [],
  userLevelsMin: 0,
  userLevelsMax: 0,
  excludeHighRisk: 1,
  excludeBlocked: 1,
  excludeInactive: 0,
  registerChannels: null,
  provinces: null,
  audienceCityTiers: null,
  audienceRules: null,
  userWeights: null,
  targetedUserIds: null,
  excludedUserIds: null,
  audienceCoverage: null
})

const formData = reactive<Partial<MarketingCampaign>>(defaultFormData())
const timeRange = ref<string[]>([])
const rulesJsonText = ref('')
const activeTab = ref('basic')
const validating = ref(false)
const submitting = ref(false)
const validateResult = ref<ValidateResult | null>(null)
const shakingField = ref('')
const sceneConfigs = ref<SceneConfig[]>([])

const formRules: FormRules = {
  name: [
    { required: true, message: '请输入活动名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在2到50个字符', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入活动编码', trigger: 'blur' },
    { pattern: /^[A-Z0-9_]{3,30}$/, message: '3-30位大写字母、数字或下划线', trigger: 'blur' }
  ],
  type: [{ required: true, message: '请选择活动类型', trigger: 'change' }],
  budget: [{ required: true, message: '请输入活动预算', trigger: 'blur' }]
}

const timeShortcuts = [
  { text: '未来7天', value: () => {
    const start = new Date()
    const end = new Date(start.getTime() + 7 * 24 * 3600 * 1000)
    return [start, end]
  }},
  { text: '未来30天', value: () => {
    const start = new Date()
    const end = new Date(start.getTime() + 30 * 24 * 3600 * 1000)
    return [start, end]
  }},
  { text: '本月剩余时间', value: () => {
    const start = new Date()
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59)
    return [start, end]
  }}
]

const blockingErrors = computed<ValidateError[]>(() =>
  validateResult.value?.errors.filter(e => e.blocking) || []
)

const canSubmit = computed(() => {
  return validateResult.value?.valid && !submitting.value
})

const riskStatusClass = computed(() => {
  if (!validateResult.value) return 'pending'
  if (validateResult.value.riskLevel === 3) return 'error'
  if (validateResult.value.riskLevel === 2) return 'warning'
  if (validateResult.value.riskLevel === 1) return 'info'
  return 'pass'
})

const validateProgress = computed(() => {
  if (!validateResult.value) return 0
  const { totalChecks, errorCount } = validateResult.value.summary
  if (totalChecks === 0) return 0
  return Math.round(((totalChecks - errorCount) / totalChecks) * 100)
})

const isFieldError = (field: string) => {
  return blockingErrors.value.some(e => e.field === field)
}

const getFieldLabel = (field: string) => {
  const map: Record<string, string> = {
    name: '活动名称',
    code: '活动编码',
    scene: '活动场景',
    timeRange: '活动时段',
    startTime: '开始时间',
    endTime: '结束时间',
    budget: '活动预算',
    dailyBudget: '每日预算',
    targetUser: '目标人群',
    subsidyAmount: '补贴金额',
    maxSubsidyPerOrder: '单笔最高补贴',
    discountRate: '折扣率',
    minOrderAmount: '使用门槛',
    perUserLimit: '每人限领次数',
    perDayLimit: '每日限领次数',
    totalCount: '活动总名额',
    mutuallyExclusive: '权益互斥',
    cities: '适用城市',
    vehicleTypes: '适用车型',
    exclusiveScenes: '互斥场景',
    inactiveDays: '流失天数',
    duplicate: '活动重复性',
    benefit: '权益合理性',
    userTags: '用户标签',
    excludeUserTags: '排除标签',
    activityLevels: '活跃度分层',
    consumptionLevels: '消费能力分层',
    userLevels: '用户等级',
    audiencePurpose: '人群策略',
    excludeHighRisk: '排除高风险',
    excludeBlocked: '排除封禁用户',
    excludeInactive: '排除超90天未登录',
    targetedUserIds: '定向用户名单',
    excludedUserIds: '排除用户名单',
    registerDaysMax: '新用户注册天数',
    audience: '人群定向配置'
  }
  return map[field] || field
}

const scrollToField = (field: string) => {
  const audienceFields = [
    'userTags', 'excludeUserTags', 'activityLevels', 'consumptionLevels',
    'userLevels', 'audiencePurpose', 'excludeHighRisk', 'excludeBlocked',
    'excludeInactive', 'targetedUserIds', 'excludedUserIds', 'registerDaysMax',
    'audience'
  ]
  if (audienceFields.includes(field)) {
    activeTab.value = 'audience'
  } else if (field === 'cities' || field === 'vehicleTypes' || field === 'mutuallyExclusive'
    || field === 'exclusiveScenes' || field === 'inactiveDays' || field === 'targetUser'
    || field === 'subsidyAmount' || field === 'discountRate' || field === 'perUserLimit') {
    activeTab.value = 'rules'
  } else {
    activeTab.value = 'basic'
  }

  nextTick(() => {
    shakingField.value = field
    setTimeout(() => { shakingField.value = '' }, 500)
  })
}

const handleAudienceWarnings = (w: string[]) => {
  audienceWarnings.value = w
}

const generateCode = () => {
  const prefixMap: Record<number, string> = { 1: 'NEW', 2: 'HOL', 3: 'SUB', 4: 'REC' }
  const prefix = prefixMap[formData.scene as number] || 'MK'
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  formData.code = `${prefix}_${timestamp}${random}`
}

const handleSceneChange = () => {
  runValidate()
}

const parseRulesJson = () => {
  if (!rulesJsonText.value.trim()) {
    formData.rules = null
    return
  }
  try {
    formData.rules = JSON.parse(rulesJsonText.value)
  } catch {
    ElMessage.warning('扩展规则JSON格式不正确')
  }
}

const buildSubmitData = () => {
  const data = { ...formData }
  if (timeRange.value.length === 2) {
    data.startTime = timeRange.value[0]
    data.endTime = timeRange.value[1]
  }
  return data
}

const runValidate = async () => {
  validating.value = true
  try {
    const data = buildSubmitData()
    const res = await validateCampaignApi(data, props.editData?.id)
    validateResult.value = res.data as ValidateResult
  } catch (e: any) {
    ElMessage.error(e.message || '校验失败')
  } finally {
    validating.value = false
  }
}

let validateTimer: any = null

const debouncedValidate = () => {
  if (validateTimer) clearTimeout(validateTimer)
  validateTimer = setTimeout(() => {
    runValidate()
  }, 800)
}

const handleBeforeClose = () => {
  if (submitting.value) return
  const hasContent = formData.name || formData.code || formData.budget
  if (hasContent) {
    ElMessageBox.confirm('确定要关闭吗？未保存的内容将丢失', '提示', {
      type: 'warning',
      confirmButtonText: '确定关闭',
      cancelButtonText: '继续编辑'
    }).then(() => {
      visible.value = false
    }).catch(() => {})
  } else {
    visible.value = false
  }
}

const saveDraft = async () => {
  formData.status = CampaignStatus.DRAFT
  await submitForm(true)
}

const handleSubmit = async () => {
  if (!validateResult.value?.valid) {
    ElMessage.error('请先修正校验错误后再提交')
    return
  }
  await submitForm(false)
}

const submitForm = async (isDraft: boolean) => {
  if (!isDraft) {
    await formRef.value?.validate()
  }
  submitting.value = true
  try {
    const data = buildSubmitData()
    const res = isEdit
      ? await updateMarketingApi(props.editData!.id as number, data)
      : await createMarketingApi(data)

    ElMessage.success(isEdit ? '修改成功' : '创建成功')
    emit('success', res.data as MarketingCampaign)
    visible.value = false
  } catch (e: any) {
    ElMessage.error(e.message || (isEdit ? '修改失败' : '创建失败'))
  } finally {
    submitting.value = false
  }
}

const loadSceneConfigs = async () => {
  try {
    const res = await getSceneConfigApi()
    sceneConfigs.value = res.data as SceneConfig[]
  } catch (e) {}
}

const initForm = () => {
  Object.assign(formData, defaultFormData())
  if (props.editData) {
    Object.assign(formData, props.editData)
    if (props.editData.startTime && props.editData.endTime) {
      timeRange.value = [props.editData.startTime, props.editData.endTime]
    }
    if (props.editData.rules) {
      rulesJsonText.value = JSON.stringify(props.editData.rules, null, 2)
    }
  } else {
    const scene = formData.scene || CampaignScene.NEW_USER_GIFT
    const defaults = SceneDefaultConfig[scene as number] || {}
    Object.keys(defaults).forEach(key => {
      (formData as any)[key] = defaults[key]
    })
  }
  validateResult.value = null
  activeTab.value = 'basic'
}

watch(() => [
  formData.name, formData.code, formData.budget, formData.dailyBudget,
  formData.subsidyAmount, formData.minOrderAmount
], () => {
  if (visible.value) debouncedValidate()
}, { deep: true })

watch(timeRange, () => {
  if (timeRange.value.length === 2) {
    formData.startTime = timeRange.value[0]
    formData.endTime = timeRange.value[1]
    if (visible.value) debouncedValidate()
  }
}, { deep: true })

watch(visible, async (val) => {
  if (val) {
    initForm()
    loadSceneConfigs()
    await nextTick()
    setTimeout(() => runValidate(), 300)
  }
}, { immediate: true })

onMounted(() => {
  loadSceneConfigs()
})
</script>

<style lang="scss" scoped>
.marketing-dialog {
  :deep(.el-dialog) {
    border-radius: 16px;
    overflow: hidden;
    background: #f5f7fa;
    animation: dialogZoomIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  :deep(.el-dialog__header) {
    padding: 20px 24px;
    background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
    margin: 0;

    .el-dialog__title {
      color: #fff;
      font-size: 18px;
      font-weight: 600;
    }

    .el-dialog__headerbtn .el-dialog__close {
      color: #fff;
      font-size: 20px;
    }
  }

  :deep(.el-dialog__body) {
    padding: 0;
    max-height: 68vh;
  }

  :deep(.el-dialog__footer) {
    padding: 16px 24px;
    background: #fff;
    border-top: 1px solid #ebeef5;
  }
}

@keyframes dialogZoomIn {
  0% {
    opacity: 0;
    transform: scale(0.85);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.dialog-content {
  display: flex;
  height: 68vh;
}

.validate-sidebar {
  width: 320px;
  background: #fff;
  border-right: 1px solid #ebeef5;
  overflow-y: auto;
  flex-shrink: 0;
  padding: 20px;

  .validate-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;

    .validate-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      color: #fff;
      flex-shrink: 0;

      &.pass { background: linear-gradient(135deg, #67c23a, #85ce61); }
      &.warning { background: linear-gradient(135deg, #e6a23c, #f0c78a); }
      &.error { background: linear-gradient(135deg, #f56c6c, #f78989); }
      &.info { background: linear-gradient(135deg, #909399, #a6a9ad); }
      &.pending { background: linear-gradient(135deg, #c0c4cc, #d3d4d6); }
    }

    .validate-info {
      flex: 1;
      h4 {
        margin: 0 0 4px 0;
        font-size: 15px;
        color: #303133;
      }
      .validate-summary {
        margin: 0;
        font-size: 12px;
        color: #909399;
        em {
          font-style: normal;
          font-weight: 600;
          margin: 0 2px;

          &.pass { color: #67c23a; }
          &.warn { color: #e6a23c; }
          &.error { color: #f56c6c; }
        }
      }
    }
  }

  .validate-progress {
    height: 6px;
    background: #f2f6fc;
    border-radius: 3px;
    margin-bottom: 16px;
    overflow: hidden;

    .progress-bar {
      height: 100%;
      border-radius: 3px;
      transition: all 0.5s;

      &.pass { background: linear-gradient(90deg, #67c23a, #85ce61); }
      &.warning { background: linear-gradient(90deg, #e6a23c, #f0c78a); }
      &.error { background: linear-gradient(90deg, #f56c6c, #f78989); }
      &.info { background: linear-gradient(90deg, #909399, #a6a9ad); }
    }
  }

  .validate-list {
    .validate-section {
      margin-bottom: 16px;

      .section-header {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 10px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        margin-bottom: 8px;

        &.error {
          background: #fef0f0;
          color: #f56c6c;
        }
        &.warning {
          background: #fdf6ec;
          color: #e6a23c;
        }
        &.pass {
          background: #f0f9eb;
          color: #67c23a;
        }
      }
    }

    .validate-item {
      display: flex;
      gap: 8px;
      padding: 10px;
      border-radius: 8px;
      margin-bottom: 6px;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        transform: translateX(4px);
      }

      &.error {
        background: #fef0f0;
        border-left: 3px solid #f56c6c;

        .item-icon { color: #f56c6c; background: #fff; }
        .item-field { color: #f56c6c; }
      }

      &.warning {
        background: #fdf6ec;
        border-left: 3px solid #e6a23c;

        .item-icon { color: #e6a23c; background: #fff; }
        .item-field { color: #e6a23c; }
      }

      &.pass {
        background: #f0f9eb;
        border-left: 3px solid #67c23a;

        .item-icon { color: #67c23a; background: #fff; }
        .item-field { color: #67c23a; }
      }

      &.shake {
        animation: fieldShake 0.4s ease-in-out;
      }

      .item-icon {
        width: 22px;
        height: 22px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        flex-shrink: 0;
      }

      .item-content {
        flex: 1;
        min-width: 0;

        .item-field {
          display: block;
          font-size: 11px;
          font-weight: 600;
          margin-bottom: 2px;
        }

        .item-msg {
          margin: 0;
          font-size: 12px;
          color: #606266;
          line-height: 1.5;
        }

        .item-detail {
          margin: 6px 0 0 0;
          padding: 6px 8px;
          background: rgba(255, 255, 255, 0.7);
          border-radius: 4px;
          list-style: none;

          li {
            font-size: 11px;
            color: #909399;
            line-height: 1.6;

            &::before {
              content: '· ';
            }
          }
        }
      }
    }
  }
}

@keyframes fieldShake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-6px); }
  20%, 40%, 60%, 80% { transform: translateX(6px); }
}

.form-main {
  flex: 1;
  overflow-y: auto;
  background: #f5f7fa;

  .campaign-tabs {
    :deep(.el-tabs__header) {
      margin: 0;
      padding: 0 24px;
      background: #fff;
    }
    :deep(.el-tabs__content) {
      padding: 20px 24px;
    }
  }

  .campaign-form {
    .form-section {
      background: #fff;
      border-radius: 10px;
      padding: 20px;
      margin-bottom: 16px;

      .section-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 600;
        color: #303133;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid #f2f6fc;

        .el-icon {
          color: #409eff;
        }
      }
    }

    .form-unit {
      margin-left: 8px;
      color: #909399;
      font-size: 13px;
    }

    .error-field {
      :deep(.el-input__wrapper),
      :deep(.el-textarea__inner),
      :deep(.el-select__wrapper),
      :deep(.el-date-editor) {
        box-shadow: 0 0 0 1px #f56c6c inset;

        &.is-focus {
          box-shadow: 0 0 0 1px #f56c6c inset, 0 0 0 3px rgba(245, 108, 108, 0.2) !important;
        }
      }
    }
  }
}

.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;

  .footer-right {
    display: flex;
    gap: 8px;
  }
}
</style>
