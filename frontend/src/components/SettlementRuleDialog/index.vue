<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? '编辑结算规则' : '新建结算规则'"
    width="650px"
    :close-on-click-modal="false"
    @open="handleOpen"
  >
    <el-form :model="ruleForm" label-width="120px" ref="formRef">
      <el-form-item label="规则名称" prop="ruleName" required>
        <el-input v-model="ruleForm.ruleName" placeholder="请输入规则名称" maxlength="100" />
      </el-form-item>

      <el-form-item label="规则类型" prop="ruleType" required>
        <el-select v-model="ruleForm.ruleType" placeholder="请选择规则类型" style="width: 100%" @change="handleRuleTypeChange">
          <el-option
            v-for="(name, key) in SettlementRuleTypeMap"
            :key="key"
            :label="name"
            :value="Number(key)"
          >
            <span :style="{ color: SettlementRuleTypeColorMap[Number(key)] }">
              <el-icon v-if="Number(key) === SettlementRuleType.EXCELLENT_EXCLUSIVE"><Crown /></el-icon>
              {{ name }}
            </span>
          </el-option>
        </el-select>
      </el-form-item>

      <el-form-item label="适用范围" prop="applyScope" required>
        <el-radio-group v-model="ruleForm.applyScope">
          <el-radio :value="1">全部司机</el-radio>
          <el-radio :value="2">按等级</el-radio>
          <el-radio :value="3">按城市</el-radio>
          <el-radio :value="4">按车型</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item v-if="ruleForm.applyScope === 2" label="适用等级">
        <el-checkbox-group v-model="ruleForm.applyDriverLevels">
          <el-checkbox :value="1">优质</el-checkbox>
          <el-checkbox :value="2">普通</el-checkbox>
          <el-checkbox :value="3">待整改</el-checkbox>
          <el-checkbox :value="4">劣质</el-checkbox>
        </el-checkbox-group>
      </el-form-item>

      <el-form-item v-if="ruleForm.applyScope === 3" label="适用城市">
        <el-select v-model="ruleForm.applyCities" multiple placeholder="请选择城市" style="width: 100%">
          <el-option label="北京" value="beijing" />
          <el-option label="上海" value="shanghai" />
          <el-option label="广州" value="guangzhou" />
          <el-option label="深圳" value="shenzhen" />
        </el-select>
      </el-form-item>

      <el-form-item v-if="ruleForm.applyScope === 4" label="适用车型">
        <el-select v-model="ruleForm.applyVehicleTypes" multiple placeholder="请选择车型" style="width: 100%">
          <el-option label="豪华型" value="luxury" />
          <el-option label="舒适型" value="comfort" />
          <el-option label="经济型" value="economy" />
          <el-option label="标准型" value="default" />
        </el-select>
      </el-form-item>

      <el-divider content-position="left">计费配置</el-divider>

      <el-form-item v-if="showCommissionRate" label="分成比例(%)" prop="commissionRate" required>
        <el-input-number
          v-model="ruleForm.commissionRate"
          :min="50"
          :max="100"
          :step="1"
          :precision="2"
          :controls-position="'right'"
          style="width: 200px"
          @change="handleCommissionRateChange"
        />
        <span class="hint" :class="commissionRateHint.class">
          <el-icon><InfoFilled /></el-icon>
          合规区间: {{ ComplianceConfig.minCommissionRate }}% - {{ ComplianceConfig.maxCommissionRate }}%
          {{ commissionRateHint.text }}
        </span>
      </el-form-item>

      <el-form-item label="补贴配置">
        <div class="subsidy-group">
          <el-input-number
            v-model="ruleForm.subsidyPercent"
            :min="0"
            :max="100"
            :precision="2"
            :controls-position="'right'"
            placeholder="比例(%)"
          />
          <span class="divider">或</span>
          <el-input-number
            v-model="ruleForm.subsidyAmount"
            :min="0"
            :precision="2"
            :controls-position="'right'"
            placeholder="固定金额(元)"
          />
        </div>
      </el-form-item>

      <el-form-item v-if="showTimeConfig" label="适用时段">
        <el-time-picker
          v-model="ruleForm.timeStart"
          placeholder="开始时间"
          format="HH:mm"
          value-format="HH:mm"
        />
        <span class="divider">至</span>
        <el-time-picker
          v-model="ruleForm.timeEnd"
          placeholder="结束时间"
          format="HH:mm"
          value-format="HH:mm"
        />
      </el-form-item>

      <el-form-item label="日期条件">
        <el-checkbox v-model="ruleForm.isHoliday">
          <el-icon><Calendar /></el-icon>
          仅节假日适用
        </el-checkbox>
        <el-checkbox v-model="ruleForm.isWeekend">
          <el-icon><Sunny /></el-icon>
          仅周末适用
        </el-checkbox>
      </el-form-item>

      <el-form-item v-if="showRatingConfig" label="最低星级">
        <el-rate v-model="ruleForm.minServiceRating" :max="5" show-score />
      </el-form-item>

      <el-form-item label="互斥设置">
        <el-switch v-model="ruleForm.isExclusive" />
        <span class="hint">启用后与指定规则不可叠加</span>
        <el-tag v-if="exclusiveCheck.isExclusive" type="warning" effect="light">
          检测到互斥冲突
        </el-tag>
      </el-form-item>

      <el-form-item label="优先级">
        <el-input-number v-model="ruleForm.priority" :min="0" :max="100" />
        <span class="hint">数值越大优先级越高</span>
      </el-form-item>

      <el-form-item label="规则状态">
        <el-switch v-model="ruleForm.status" :active-value="1" :inactive-value="0" />
      </el-form-item>

      <el-form-item label="规则描述">
        <el-input v-model="ruleForm.description" type="textarea" :rows="2" maxlength="500" />
      </el-form-item>

      <el-divider content-position="left">校验与预估</el-divider>

      <div v-if="preCheckResult" class="check-result">
        <el-alert
          v-if="!preCheckResult.passed"
          :title="preCheckResult.violations[0]?.message || '规则校验不通过'"
          type="error"
          show-icon
          :closable="false"
          class="mb-10"
        />
        <el-alert
          v-if="preCheckResult.warnings.length > 0"
          :title="preCheckResult.warnings[0]?.message || ''"
          type="warning"
          show-icon
          :closable="false"
          class="mb-10"
        />
      </div>

      <div v-if="exclusiveCheck.isExclusive" class="check-result">
        <el-alert
          :title="`存在互斥规则：${exclusiveCheck.conflicts.join('、')}`"
          type="warning"
          show-icon
          :closable="false"
          class="mb-10"
        >
          <template #default>
            <div class="exclusive-detail">
              <el-icon><Warning /></el-icon>
              <span>优质司机专属补贴与普通司机补贴互斥，不可同时叠加使用</span>
            </div>
          </template>
        </el-alert>
      </div>

      <div class="estimate-box">
        <div class="estimate-title">
          <el-icon><TrendCharts /></el-icon>
          <span>预估今日收益</span>
        </div>
        <div class="estimate-content">
          <div class="estimate-item">
            <div class="label">订单数</div>
            <div class="value">{{ estimatedIncome.totalOrders || 0 }}单</div>
          </div>
          <div class="estimate-item">
            <div class="label">订单金额</div>
            <div class="value">¥{{ estimatedIncome.totalOrderAmount || 0 }}</div>
          </div>
          <div class="estimate-item highlight">
            <div class="label">基础收入</div>
            <div class="value">¥{{ estimatedIncome.baseIncome || 0 }}</div>
          </div>
          <div class="estimate-item total">
            <div class="label">预估总收益</div>
            <div class="value">¥{{ estimatedIncome.estimatedTotal || 0 }}</div>
          </div>
        </div>
      </div>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="handleSave" :loading="saving" class="ripple-btn">
        {{ isEdit ? '保存修改' : '创建规则' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Crown, InfoFilled, Calendar, Sunny, Warning, TrendCharts } from '@element-plus/icons-vue'
import {
  SettlementRuleTypeMap,
  SettlementRuleType,
  SettlementRuleTypeColorMap,
  ComplianceConfig
} from '@/enums/driver'
import {
  preCheckRuleApi,
  checkExclusiveRuleApi,
  estimateIncomeApi,
  createRuleApi,
  updateRuleApi
} from '@/api/settlement'
import type { SettlementRule, SettlementRulePreCheck, ExclusiveRuleCheck, EstimatedIncome } from '@/types/driver'

const props = defineProps<{
  modelValue: boolean
  editRule?: SettlementRule | null
  driverId?: number
}>()

const emit = defineEmits(['update:modelValue', 'success'])

const visible = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val)
})

const isEdit = computed(() => !!props.editRule)
const formRef = ref()
const saving = ref(false)

const ruleForm = reactive<Partial<SettlementRule>>({
  ruleName: '',
  ruleType: 1,
  applyScope: 1,
  applyDriverLevels: [],
  applyCities: [],
  applyVehicleTypes: [],
  applyOrderTypes: [],
  commissionRate: 80,
  minCommissionRate: 70,
  maxCommissionRate: 90,
  subsidyAmount: 0,
  subsidyPercent: 0,
  timeStart: undefined,
  timeEnd: undefined,
  isHoliday: 0,
  isWeekend: 0,
  minServiceRating: 0,
  isExclusive: 0,
  exclusiveRuleIds: [],
  priority: 0,
  status: 1,
  description: ''
})

const preCheckResult = ref<SettlementRulePreCheck | null>(null)
const exclusiveCheck = ref<ExclusiveRuleCheck>({
  isExclusive: false,
  conflicts: [],
  conflictRules: []
})
const estimatedIncome = ref<EstimatedIncome>({
  totalOrders: 0,
  totalOrderAmount: 0,
  baseIncome: 0,
  estimatedTotal: 0
})

const showCommissionRate = computed(() => {
  return [
    SettlementRuleType.BASE_COMMISSION,
    SettlementRuleType.PREMIUM_COMMISSION
  ].includes(ruleForm.ruleType as number)
})

const showTimeConfig = computed(() => {
  return ruleForm.ruleType === SettlementRuleType.HOUR_SURCHARGE
})

const showRatingConfig = computed(() => {
  return ruleForm.ruleType === SettlementRuleType.RATING_SUBSIDY
})

const commissionRateHint = computed(() => {
  const rate = ruleForm.commissionRate || 0
  if (rate < ComplianceConfig.minCommissionRate) {
    return { class: 'hint-danger', text: ' (低于合规下限)' }
  }
  if (rate > ComplianceConfig.maxCommissionRate) {
    return { class: 'hint-danger', text: ' (超出合规上限)' }
  }
  return { class: 'hint-ok', text: '' }
})

const runPreCheck = async () => {
  try {
    const res = await preCheckRuleApi(ruleForm as SettlementRule, props.driverId)
    preCheckResult.value = res.data

    if (!res.data.passed) {
      ElMessage.error(res.data.violations[0]?.message || '规则校验不通过')
    }
  } catch (e) {}
}

const runExclusiveCheck = async () => {
  if (props.driverId && ruleForm.ruleType) {
    try {
      const res = await checkExclusiveRuleApi(props.driverId, ruleForm.ruleType as number)
      exclusiveCheck.value = res.data
    } catch (e) {}
  }
}

const runEstimate = async () => {
  if (props.driverId) {
    try {
      const res = await estimateIncomeApi(props.driverId, {
        commissionRate: ruleForm.commissionRate
      })
      estimatedIncome.value = res.data
    } catch (e) {}
  }
}

const handleRuleTypeChange = async () => {
  if (ruleForm.ruleType === SettlementRuleType.HOUR_SURCHARGE) {
    ruleForm.timeStart = ruleForm.timeStart || '07:00'
    ruleForm.timeEnd = ruleForm.timeEnd || '09:00'
  }
  if (ruleForm.ruleType === SettlementRuleType.RATING_SUBSIDY) {
    ruleForm.minServiceRating = ruleForm.minServiceRating || 4.5
  }
  if (ruleForm.ruleType === SettlementRuleType.HOLIDAY_SUBSIDY) {
    ruleForm.isHoliday = 1
  }
  if (ruleForm.ruleType === SettlementRuleType.EXCELLENT_EXCLUSIVE) {
    ruleForm.applyScope = 2
    ruleForm.applyDriverLevels = [1]
    ruleForm.isExclusive = 1
  }

  await runPreCheck()
  await runExclusiveCheck()
  await runEstimate()
}

const handleCommissionRateChange = async () => {
  await runPreCheck()
  await runEstimate()
}

const handleSave = async () => {
  try {
    await formRef.value.validate()
  } catch (e) {
    return
  }

  if (preCheckResult.value && !preCheckResult.value.passed) {
    ElMessage.error('请先修正校验不通过项')
    return
  }

  saving.value = true
  try {
    if (isEdit.value && props.editRule) {
      await updateRuleApi(props.editRule.id, ruleForm)
      ElMessage.success('规则更新成功')
    } else {
      await createRuleApi(ruleForm as SettlementRule)
      ElMessage.success('规则创建成功')
    }
    emit('success')
    visible.value = false
  } catch (error: any) {
    if (error.validation) {
      ElMessage.error(error.validation.violations[0]?.message || '校验不通过')
    } else {
      ElMessage.error(error.message || '操作失败')
    }
  } finally {
    saving.value = false
  }
}

const handleOpen = () => {
  if (props.editRule) {
    Object.assign(ruleForm, props.editRule)
  } else {
    Object.assign(ruleForm, {
      ruleName: '',
      ruleType: 1,
      applyScope: 1,
      applyDriverLevels: [],
      applyCities: [],
      applyVehicleTypes: [],
      commissionRate: 80,
      subsidyAmount: 0,
      subsidyPercent: 0,
      isExclusive: 0,
      priority: 0,
      status: 1,
      description: ''
    })
  }

  nextTick(() => {
    runPreCheck()
    runExclusiveCheck()
    runEstimate()
  })
}

watch(
  () => [ruleForm.applyScope, ruleForm.isHoliday, ruleForm.isWeekend],
  () => {
    runPreCheck()
  },
  { deep: true }
)
</script>

<style scoped>
.hint {
  margin-left: 10px;
  font-size: 12px;
  color: #909399;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.hint-danger {
  color: #f56c6c;
}

.hint-ok {
  color: #67c23a;
}

.divider {
  margin: 0 10px;
  color: #909399;
}

.subsidy-group {
  display: flex;
  align-items: center;
  gap: 0;
}

.check-result {
  margin-bottom: 16px;
}

.exclusive-detail {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #e6a23c;
}

.estimate-box {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #bae6fd;
}

.estimate-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #0369a1;
  margin-bottom: 12px;
}

.estimate-content {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.estimate-item {
  background: #fff;
  border-radius: 6px;
  padding: 10px;
  text-align: center;
}

.estimate-item .label {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 4px;
}

.estimate-item .value {
  font-size: 16px;
  font-weight: 600;
  color: #334155;
}

.estimate-item.highlight .value {
  color: #0284c7;
}

.estimate-item.total {
  background: #fef3c7;
}

.estimate-item.total .label {
  color: #92400e;
}

.estimate-item.total .value {
  color: #d97706;
  font-size: 18px;
}

.ripple-btn {
  position: relative;
  overflow: hidden;
}

.ripple-btn::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.4s, height 0.4s;
}

.ripple-btn:active::after {
  width: 300px;
  height: 300px;
}

.mb-10 {
  margin-bottom: 10px;
}
</style>
