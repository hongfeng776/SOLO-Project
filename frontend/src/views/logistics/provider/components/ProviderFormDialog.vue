<template>
  <el-dialog :model-value="modelValue" @update:model-value="handleDialogVisible"
    :title="dialogTitle" width="960px" :close-on-click-modal="false"
    :before-close="handleBeforeClose" destroy-on-close
    class="provider-form-dialog">
    <div class="dialog-inner-wrap">
      <!-- Step 步骤条 -->
      <el-steps :active="activeStep" finish-status="success" align-center class="step-nav">
        <el-step title="基本信息" description="企业主体信息" />
        <el-step title="企业资质" description="证照有效期校验" />
        <el-step title="服务能力" description="网点覆盖时效承诺" />
        <el-step title="资费标准" description="收费规则权限额度" />
      </el-steps>

      <!-- Tabs 内容 -->
      <el-tabs v-model="activeTab" @tab-change="handleTabChange" class="content-tabs"
        tab-position="left" :type="'card'">
        <el-tab-pane label="① 基本信息" name="basic">
          <el-form ref="basicFormRef" :model="form" :rules="basicRules" label-width="130px" class="form-grid">
            <el-form-item label="服务商编码" prop="providerCode" :error="fieldErrors.providerCode">
              <div class="field-with-actions">
                <el-input v-model="form.providerCode" :disabled="mode === 'edit'" placeholder="系统自动生成/手输(WL+6位数字)"
                  :class="{ 'input-error': fieldErrors.providerCode }" maxlength="8"
                  @blur="validateField('providerCode', form.providerCode)" />
                <el-button link type="primary" @click="generateCode" v-if="mode === 'add'">
                  <el-icon><MagicStick /></el-icon> 生成
                </el-button>
              </div>
              <div class="field-tip error-tip" v-if="fieldErrors.providerCode">{{ fieldErrors.providerCode }}</div>
              <div class="field-tip">格式规则：WL 开头 + 6 位数字，如 WL000001</div>
            </el-form-item>

            <el-form-item label="服务商名称" prop="providerName" :error="fieldErrors.providerName">
              <el-input v-model="form.providerName" placeholder="请输入企业全称"
                :class="{ 'input-error': fieldErrors.providerName }"
                @blur="() => checkDuplicateProvider()" />
              <div class="field-tip error-tip" v-if="fieldErrors.providerName">{{ fieldErrors.providerName }}</div>
            </el-form-item>

            <el-form-item label="服务商等级" prop="level">
              <el-select v-model="form.level">
                <el-option v-for="(item, key) in ProviderLevelMap" :key="key" :label="item.label" :value="Number(key)" />
              </el-select>
            </el-form-item>

            <el-form-item label="启用状态" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio :value="1">启用</el-radio>
                <el-radio :value="2">待审核</el-radio>
                <el-radio :value="0" :disabled="mode === 'add'">禁用</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="合作状态" prop="cooperationStatus">
              <el-radio-group v-model="form.cooperationStatus" :disabled="mode === 'add' && true">
                <el-radio :value="0">未合作</el-radio>
                <el-radio :value="1" :disabled="!canStartCooperation">合作中</el-radio>
                <el-radio :value="2">合作暂停</el-radio>
                <el-radio :value="3">合作终止</el-radio>
              </el-radio-group>
              <div class="field-tip" v-if="mode === 'add'">服务商新增后通过「准入审核」流程设定合作状态</div>
            </el-form-item>

            <el-form-item label="合作生效日期" prop="cooperationEffectiveDate">
              <el-date-picker v-model="form.cooperationEffectiveDate" type="date" placeholder="选择日期"
                value-format="YYYY-MM-DD" style="width: 100%" :disabled="isCooperationLocked" />
              <el-tooltip v-if="isCooperationLocked" content="合作中服务商不可修改合作生效日期" placement="right">
                <el-icon class="locked-icon"><Lock /></el-icon>
              </el-tooltip>
            </el-form-item>

            <el-form-item label="联系人" prop="contactPerson" required>
              <el-input v-model="form.contactPerson" placeholder="请输入联系人姓名" :disabled="isFieldLocked('contactPerson')" />
              <el-tooltip v-if="isFieldLocked('contactPerson')" :content="lockReasonMap['contactPerson'] || '合作中主体字段锁定'" placement="right">
                <el-icon class="locked-icon"><Lock /></el-icon>
              </el-tooltip>
            </el-form-item>

            <el-form-item label="联系电话" prop="contactPhone" required :error="fieldErrors.contactPhone">
              <el-input v-model="form.contactPhone" placeholder="手机号码"
                :class="{ 'input-error': fieldErrors.contactPhone }" @blur="validateField('phone', form.contactPhone)" />
              <div class="field-tip error-tip" v-if="fieldErrors.contactPhone">{{ fieldErrors.contactPhone }}</div>
            </el-form-item>

            <el-form-item label="联系邮箱" prop="contactEmail" :error="fieldErrors.contactEmail">
              <el-input v-model="form.contactEmail" placeholder="邮箱地址"
                :class="{ 'input-error': fieldErrors.contactEmail }" @blur="validateField('email', form.contactEmail)" />
              <div class="field-tip error-tip" v-if="fieldErrors.contactEmail">{{ fieldErrors.contactEmail }}</div>
            </el-form-item>

            <el-form-item label="公司注册地址" prop="registeredAddress">
              <el-input v-model="form.registeredAddress" placeholder="完整注册地址" type="textarea" :rows="2" />
            </el-form-item>

            <el-form-item label="统一社会信用代码" prop="creditCode" required :error="fieldErrors.creditCode">
              <el-input v-model="form.creditCode" placeholder="18位信用代码" :disabled="isFieldLocked('creditCode')"
                maxlength="18" :class="{ 'input-error': fieldErrors.creditCode }"
                @blur="() => { validateField('creditCode', form.creditCode); checkDuplicateProvider(); }" />
              <div class="field-tip error-tip" v-if="fieldErrors.creditCode">{{ fieldErrors.creditCode }}</div>
            </el-form-item>

            <el-form-item label="营业执照注册号" prop="businessLicenseNo" :error="fieldErrors.businessLicenseNo">
              <el-input v-model="form.businessLicenseNo" placeholder="15位注册号" :disabled="isFieldLocked('businessLicenseNo')"
                :class="{ 'input-error': fieldErrors.businessLicenseNo }"
                @blur="() => { validateField('businessLicense', form.businessLicenseNo); checkDuplicateProvider(); }" />
              <div class="field-tip error-tip" v-if="fieldErrors.businessLicenseNo">{{ fieldErrors.businessLicenseNo }}</div>
            </el-form-item>

            <el-form-item label="企业法人" prop="legalPerson">
              <el-input v-model="form.legalPerson" placeholder="法人姓名" :disabled="isFieldLocked('legalPerson')" />
            </el-form-item>

            <el-form-item label="法人身份证号" prop="legalIdCard" :error="fieldErrors.legalIdCard">
              <el-input v-model="form.legalIdCard" placeholder="18位身份证号" :disabled="isFieldLocked('legalIdCard')"
                maxlength="18" :class="{ 'input-error': fieldErrors.legalIdCard }"
                @blur="validateField('idCard', form.legalIdCard)" />
              <div class="field-tip error-tip" v-if="fieldErrors.legalIdCard">{{ fieldErrors.legalIdCard }}</div>
            </el-form-item>

            <el-form-item label="匹配优先级" prop="matchPriority">
              <el-input-number v-model="form.matchPriority" :min="0" :max="999" />
              <div class="field-tip">数值越大优先匹配（0-999）</div>
            </el-form-item>

            <el-form-item label="备注" prop="remark" class="full-width">
              <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="请输入备注" />
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- Tab 2: 企业资质 -->
        <el-tab-pane label="② 企业资质" name="qualification">
          <el-form :model="form" label-width="150px" class="form-grid">
            <el-form-item label="营业执照图片">
              <el-upload class="avatar-uploader" action="#" :auto-upload="false"
                :show-file-list="false" accept="image/*">
                <img v-if="form.businessLicenseUrl" :src="form.businessLicenseUrl" class="avatar" />
                <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
              </el-upload>
              <div class="field-tip">支持 JPG/PNG，建议尺寸 750×460</div>
            </el-form-item>

            <el-form-item label="营业执照有效期" required :error="expireTip">
              <el-date-picker v-model="licenseDateRange" type="daterange" range-separator="至"
                start-placeholder="起始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD"
                style="width: 100%" :class="{ 'input-error': expireTip }" />
              <div class="field-tip error-tip" v-if="expireTip">{{ expireTip }}</div>
            </el-form-item>

            <el-form-item label="道路运输许可证">
              <el-upload class="avatar-uploader" action="#" :auto-upload="false"
                :show-file-list="false" accept="image/*">
                <img v-if="form.roadTransportLicenseUrl" :src="form.roadTransportLicenseUrl" class="avatar" />
                <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
              </el-upload>
            </el-form-item>

            <el-form-item label="道路运输许可证到期日" :error="roadExpireTip">
              <el-date-picker v-model="form.roadTransportValidTo" type="date" value-format="YYYY-MM-DD"
                placeholder="选择到期日" style="width: 100%" :class="{ 'input-error': roadExpireTip }" />
              <div class="field-tip error-tip" v-if="roadExpireTip">{{ roadExpireTip }}</div>
            </el-form-item>

            <el-form-item label="资质详细介绍" class="full-width">
              <div class="qualification-intro-wrap">
                <el-input v-model="form.qualificationIntro" type="textarea" :rows="5"
                  :maxlength="2000" show-word-limit
                  placeholder="请输入企业资质详细介绍，支持超长内容展示" />
                <div class="intro-preview" v-if="form.qualificationIntro?.length > 80">
                  <el-tooltip :content="form.qualificationIntro" placement="top"
                    popper-class="qualification-tooltip">
                    <el-icon><View /></el-icon>
                    <span>悬浮查看完整内容</span>
                  </el-tooltip>
                </div>
              </div>
            </el-form-item>

            <el-form-item label="前置校验结果" class="full-width">
              <div class="precheck-result-wrap" v-if="precheckReport">
                <el-row :gutter="12">
                  <el-col :span="6">
                    <div class="precheck-score" :class="'score-' + precheckReport.level">
                      <span class="num">{{ precheckReport.score }}</span>
                      <span class="label">综合合规分</span>
                    </div>
                  </el-col>
                  <el-col :span="18">
                    <div class="precheck-dimensions">
                      <div v-for="(dim, k) in dimensionLabels" :key="k" class="dim-item">
                        <div class="dim-head">
                          <span class="dim-label">{{ dim.label }}</span>
                          <el-tag size="small" :type="precheckReport.dimensions[k]?.passed ? 'success' : 'danger'">
                            {{ precheckReport.dimensions[k]?.passed ? '达标' : '未达标' }}
                          </el-tag>
                          <span class="dim-score">{{ precheckReport.dimensions[k]?.score }}分</span>
                        </div>
                        <div class="dim-detail">{{ precheckReport.dimensions[k]?.detail }}</div>
                      </div>
                    </div>
                  </el-col>
                </el-row>
                <div class="precheck-block-list" v-if="precheckReport.blockItems?.length">
                  <el-alert v-for="(item, idx) in precheckReport.blockItems" :key="idx"
                    :title="item.message" :type="item.severity === 'error' ? 'error' : 'warning'"
                    :closable="false" show-icon style="margin-top: 8px" />
                </div>
                <div class="precheck-actions">
                  <el-button size="small" @click="runPrecheck">
                    <el-icon><Refresh /></el-icon> 重新运行前置校验
                  </el-button>
                </div>
              </div>
              <div class="run-precheck-placeholder" v-else>
                <el-button type="primary" size="small" @click="runPrecheck">
                  <el-icon><View /></el-icon> 运行前置校验（资质/覆盖/时效/权限）
                </el-button>
              </div>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- Tab 3: 服务能力 -->
        <el-tab-pane label="③ 服务能力" name="capability">
          <el-form :model="form" label-width="150px" class="form-grid">
            <el-form-item label="服务覆盖省份" required>
              <el-select v-model="form.serviceProvince" multiple collapse-tags collapse-tags-tooltip
                placeholder="选择覆盖省份（多选用逗号分隔）" filterable style="width: 100%">
                <el-option v-for="p in provinceOptions" :key="p" :label="p" :value="p" />
              </el-select>
            </el-form-item>

            <el-form-item label="重点服务城市">
              <el-input v-model="form.serviceCities" placeholder="多个城市用逗号分隔" />
              <div class="field-tip">示例：北京,上海,广州,深圳,杭州</div>
            </el-form-item>

            <el-form-item label="网点总数" required>
              <el-input-number v-model="form.branchCount" :min="0" :max="999999" />
              <el-tag v-if="form.branchCount < 10" type="danger" size="small">最低标准≥10个</el-tag>
              <el-tag v-else type="success" size="small">达标 ✓</el-tag>
            </el-form-item>

            <el-form-item label="跨省时效承诺(小时)" required>
              <el-input-number v-model="form.crossProvinceTimeliness" :min="0" :max="720" :step="1" :precision="2" />
              <span class="field-tip">一般要求 ≤72 小时（3天）</span>
            </el-form-item>

            <el-form-item label="省内时效承诺(小时)" required>
              <el-input-number v-model="form.intraProvinceTimeliness" :min="0" :max="360" :step="1" :precision="2" />
              <span class="field-tip">一般要求 ≤48 小时（2天）</span>
            </el-form-item>

            <el-form-item label="日单量合作额度" required>
              <el-input-number v-model="form.dailyOrderLimit" :min="10" :max="9999999" />
              <span class="field-tip">平台分配的最大日单量（个）</span>
            </el-form-item>

            <el-form-item label="服务能力选项">
              <el-checkbox-group v-model="capabilityFlags">
                <el-checkbox :value="1" true-value="cod">支持COD货到付款</el-checkbox>
                <el-checkbox :value="2" true-value="coldChain">支持冷链运输</el-checkbox>
                <el-checkbox :value="3" true-value="oversized">支持大件物流</el-checkbox>
                <el-checkbox :value="4" true-value="pickup">支持上门取件</el-checkbox>
              </el-checkbox-group>
            </el-form-item>

            <el-form-item label="接口地址">
              <el-input v-model="form.apiUrl" placeholder="物流对接API地址" />
            </el-form-item>

            <el-form-item label="API Key">
              <el-input v-model="form.apiKey" placeholder="公钥" show-password />
            </el-form-item>

            <el-form-item label="API Secret">
              <el-input v-model="form.apiSecret" placeholder="私钥" show-password />
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- Tab 4: 资费标准 -->
        <el-tab-pane label="④ 资费标准" name="fee">
          <el-form :model="form" label-width="150px" class="form-grid">
            <el-form-item label="首重资费" required :error="feeErrors.firstWeightFee">
              <el-input-number v-model="form.firstWeightFee" :min="0" :step="0.5" :precision="2"
                :class="{ 'input-error': feeErrors.firstWeightFee }" />
              <span>元/kg</span>
              <div class="field-tip error-tip" v-if="feeErrors.firstWeightFee">{{ feeErrors.firstWeightFee }}</div>
            </el-form-item>

            <el-form-item label="续重资费" required :error="feeErrors.additionalWeightFee">
              <el-input-number v-model="form.additionalWeightFee" :min="0" :step="0.5" :precision="2"
                :class="{ 'input-error': feeErrors.additionalWeightFee }" />
              <span>元/kg</span>
            </el-form-item>

            <el-form-item label="基础服务费" required>
              <el-input-number v-model="form.baseServiceFee" :min="0" :step="0.1" :precision="2" />
              <span>元/单</span>
            </el-form-item>

            <el-form-item label="资费合规性校验" class="full-width">
              <div class="fee-check-wrap">
                <el-button size="small" type="primary" plain @click="checkFeeCompliance">
                  <el-icon><Warning /></el-icon> 检测资费合规性
                </el-button>
                <div class="fee-check-result" v-if="feeCheckResult">
                  <el-tag :type="feeCheckResult.compliant ? 'success' : 'danger'" size="small">
                    {{ feeCheckResult.compliant ? '配置合规' : '存在违规配置' }}
                  </el-tag>
                  <div class="violation-list" v-if="feeCheckResult.violations?.length">
                    <el-alert v-for="(v, i) in feeCheckResult.violations" :key="i"
                      :title="v.message" :type="v.level === 'error' ? 'error' : 'warning'"
                      :closable="false" show-icon style="margin-top: 6px" />
                  </div>
                </div>
              </div>
            </el-form-item>

            <el-divider class="full-width">资费模板预览</el-divider>

            <el-form-item class="full-width">
              <el-table :data="feeTablePreview" border size="small" style="width: 100%">
                <el-table-column label="方案名称" prop="name" width="180" />
                <el-table-column label="首重" prop="first" align="center" />
                <el-table-column label="续重" prop="additional" align="center" />
                <el-table-column label="基础服务费" prop="base" align="center" />
                <el-table-column label="标准时效" prop="timeliness" align="center" />
                <el-table-column label="计费示例 (5kg)" align="center">
                  <template #default="{ row }">
                    <span class="fee-example">¥{{ calcFeeExample(row).toFixed(2) }}</span>
                  </template>
                </el-table-column>
              </el-table>
            </el-form-item>

            <el-alert type="info" :closable="false" class="full-width"
              title="资费规则说明"
              description="首重为基础计费重量，超出部分按续重步长累加计算；最终费用 = max(基础服务费 + 首重费 + 续重费, 最低收费)"
              show-icon />
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handlePrevStep" v-if="activeStep > 0">上一步</el-button>
        <el-button v-if="activeStep < 3" type="primary" @click="handleNextStep" :disabled="!canGoNext">下一步</el-button>
        <el-button v-else type="primary" @click="handleSubmit" :loading="submitting">
          {{ mode === 'add' ? '提交准入审核' : '保存修改' }}
        </el-button>
        <el-button @click="handleCancel">取消</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick, watchEffect } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Plus, MagicStick, Lock, View, Refresh, Warning
} from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { LogisticsProvider, ProviderPreCheckReport } from '@/types/business'
import {
  ProviderLevelMap, CooperationStatus, CooperationStatusMap,
  createProvider, updateProvider, generateProviderCode, getEditPermission,
  type ProviderUpdateData
} from '@/api/logisticsProvider'
import {
  validateProviderCode, validateCreditCode, validateBusinessLicense,
  validatePhone, validateEmail, validateIdCard,
  checkDuplicateProvider as apiCheckDuplicate, checkFeeCompliance as apiCheckFeeCompliance,
  runProviderPreCheck as apiRunPreCheck
} from '@/api/logisticsProviderValidate'
import { checkFeeCompliance } from '@/api/logisticsProviderValidate'

const props = defineProps<{
  modelValue: boolean
  mode: 'add' | 'edit'
  initialData?: Partial<LogisticsProvider>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'submitted': []
  'core-change-detected': [{ original: any; newData: any; coreFields: string[] }]
}>()

// ========== 响应式 ==========
const activeStep = ref(0)
const activeTab = ref('basic')
const submitting = ref(false)
const basicFormRef = ref<FormInstance>()
const fieldErrors = reactive<Record<string, string>>({})
const feeErrors = reactive<Record<string, string>>({})
const editPermission = ref<any>(null)
const lockReasonMap = reactive<Record<string, string>>({})
const licenseDateRange = ref<string[]>([])
const precheckReport = ref<ProviderPreCheckReport | null>(null)
const feeCheckResult = ref<any>(null)
const capabilityFlags = ref<string[]>([])

const form = reactive<any>({
  providerCode: '', providerName: '', level: 1, status: 2, cooperationStatus: 0,
  cooperationEffectiveDate: '', cooperationTerminateDate: '',
  contactPerson: '', contactPhone: '', contactEmail: '', registeredAddress: '',
  creditCode: '', businessLicenseNo: '', legalPerson: '', legalIdCard: '',
  businessLicenseUrl: '', licenseValidFrom: '', licenseValidTo: '',
  roadTransportLicenseUrl: '', roadTransportValidTo: '',
  serviceProvince: '', serviceCities: '', branchCount: 0,
  crossProvinceTimeliness: 72, intraProvinceTimeliness: 48,
  firstWeightFee: 10, additionalWeightFee: 4, baseServiceFee: 1,
  dailyOrderLimit: 1000, supportCod: 0, supportColdChain: 0, supportOversized: 0, supportPickup: 1,
  matchPriority: 0, apiUrl: '', apiKey: '', apiSecret: '',
  serviceScore: 0, onTimeRate: 0, totalOrders: 0, totalAmount: 0,
  qualificationIntro: '', remark: ''
})

const originalDataSnapshot = ref<any>({})

const provinceOptions = ['北京', '上海', '广东', '江苏', '浙江', '四川', '湖北', '陕西', '山东', '福建', '河南', '湖南', '安徽', '河北', '辽宁', '吉林', '黑龙江', '江西', '山西', '云南', '贵州', '广西', '甘肃', '海南', '重庆', '天津', '内蒙古', '新疆', '宁夏', '青海', '西藏']

const dimensionLabels: Record<string, { label: string }> = {
  qualification: { label: '企业资质' },
  coverage: { label: '网点覆盖' },
  timeliness: { label: '时效承诺' },
  permission: { label: '合作权限' },
}

const basicRules: FormRules = {
  providerName: [{ required: true, message: '请输入服务商名称', trigger: 'blur' }],
  contactPerson: [{ required: true, message: '请输入联系人', trigger: 'blur' }],
  contactPhone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }],
  creditCode: [{ required: true, message: '请输入统一社会信用代码', trigger: 'blur' }],
}

// ========== 计算属性 ==========
const dialogTitle = computed(() => props.mode === 'add' ? '新增物流服务商 - 准入审核' : '编辑物流服务商 - 参数维护')
const tabToStep: Record<string, number> = { basic: 0, qualification: 1, capability: 2, fee: 3 }

const isCooperationLocked = computed(() =>
  props.mode === 'edit' && form.cooperationStatus === CooperationStatus.COOPERATING
)

const canStartCooperation = computed(() =>
  props.mode === 'edit' && form.status === 1
)

const expireTip = computed(() => {
  if (!licenseDateRange.value?.length) return ''
  const end = licenseDateRange.value[1]
  if (!end) return ''
  const days = (new Date(end).getTime() - Date.now()) / 86400000
  if (days < 0) return '⚠️ 营业执照已过期'
  if (days < 90) return `⚠️ 营业执照仅剩 ${Math.ceil(days)} 天到期`
  return ''
})

const roadExpireTip = computed(() => {
  if (!form.roadTransportValidTo) return ''
  const days = (new Date(form.roadTransportValidTo).getTime() - Date.now()) / 86400000
  if (days < 0) return '⚠️ 道路运输许可证已过期'
  if (days < 90) return `⚠️ 仅剩 ${Math.ceil(days)} 天到期`
  return ''
})

const canGoNext = computed(() => {
  if (activeStep.value === 0) {
    return !!(form.providerCode && form.providerName && form.creditCode &&
      form.contactPerson && form.contactPhone && !hasBlockingErrors())
  }
  if (activeStep.value === 1) {
    return !!(licenseDateRange.value?.length)
  }
  if (activeStep.value === 2) {
    return !!(form.branchCount >= 10)
  }
  return true
})

const feeTablePreview = computed(() => ([
  { name: '省内标快', first: `${form.firstWeightFee || 0}元/kg`, additional: `${form.additionalWeightFee || 0}元/kg`, base: `${form.baseServiceFee || 0}元/单`, timeliness: `${form.intraProvinceTimeliness || '-'}小时`, data: { fw: form.firstWeightFee, aw: form.additionalWeightFee, bs: form.baseServiceFee } },
  { name: '跨省标快', first: `${(form.firstWeightFee || 0) * 1.5}元/kg`, additional: `${(form.additionalWeightFee || 0) * 1.3}元/kg`, base: `${form.baseServiceFee || 0}元/单`, timeliness: `${form.crossProvinceTimeliness || '-'}小时`, data: { fw: (form.firstWeightFee || 0) * 1.5, aw: (form.additionalWeightFee || 0) * 1.3, bs: form.baseServiceFee } },
  { name: '加急特快', first: `${(form.firstWeightFee || 0) * 2}元/kg`, additional: `${(form.additionalWeightFee || 0) * 1.8}元/kg`, base: `${(form.baseServiceFee || 0) * 2}元/单`, timeliness: `${(form.intraProvinceTimeliness || 24) / 2}小时`, data: { fw: (form.firstWeightFee || 0) * 2, aw: (form.additionalWeightFee || 0) * 1.8, bs: (form.baseServiceFee || 0) * 2 } },
]))

// ========== 方法 ==========
const hasBlockingErrors = () =>
  Object.entries(fieldErrors).some(([, v]) => v && v.includes('格式错误') || v.includes('已存在'))

const emitClose = () => emit('update:modelValue', false)
const handleDialogVisible = (v: boolean) => emit('update:modelValue', v)

const handleBeforeClose = (done: any) => {
  if (submitting.value) return
  done()
}

const generateCode = async () => {
  try {
    const res = await generateProviderCode()
    if (res.data?.code) {
      form.providerCode = res.data.code
      await validateField('providerCode', form.providerCode)
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '生成失败')
  }
}

const validateField = async (type: string, value: string) => {
  if (!value) { fieldErrors[type === 'phone' ? 'contactPhone' : type === 'email' ? 'contactEmail' : type] = ''; return }
  const map: Record<string, any> = {
    providerCode: validateProviderCode, phone: validatePhone, email: validateEmail,
    creditCode: validateCreditCode, businessLicense: validateBusinessLicense, idCard: validateIdCard
  }
  const fn = map[type]
  if (!fn) return
  try {
    const res = await fn(value as any)
    const err = res.data?.valid ? '' : (res.data?.errorMessage || '校验失败')
    if (type === 'phone') fieldErrors.contactPhone = err
    else if (type === 'email') fieldErrors.contactEmail = err
    else if (type === 'businessLicense') fieldErrors.businessLicenseNo = err
    else if (type === 'idCard') fieldErrors.legalIdCard = err
    else fieldErrors[type] = err
  } catch {
    // 忽略
  }
}

const checkDuplicateProvider = async () => {
  if (!form.providerName && !form.creditCode && !form.businessLicenseNo) return
  try {
    const res = await apiCheckDuplicate({
      providerName: form.providerName, creditCode: form.creditCode,
      businessLicenseNo: form.businessLicenseNo, excludeId: props.initialData?.id
    })
    if (res.data?.hasDuplicate) {
      res.data.duplicateFields.forEach((d: any) => {
        const field = d.field === 'providerName' ? 'providerName' : d.field === 'creditCode' ? 'creditCode' : 'businessLicenseNo'
        fieldErrors[field] = `${d.message}（已被：${d.existingProvider?.providerName || '其他服务商'}占用）`
      })
    }
  } catch {}
}

const isFieldLocked = (field: string): boolean => {
  return editPermission.value?.lockedFields?.includes(field) || false
}

const loadEditPermission = async (id: number) => {
  try {
    const res = await getEditPermission(id)
    editPermission.value = res.data
    const reasons = res.data?.lockedFieldsReason || {}
    Object.keys(reasons).forEach(k => { lockReasonMap[k] = reasons[k] })
  } catch {}
}

const handleTabChange = (tab: string) => {
  activeStep.value = tabToStep[tab] ?? 0
}
const handlePrevStep = () => {
  activeStep.value--
  activeTab.value = Object.keys(tabToStep).find(k => tabToStep[k] === activeStep.value) || 'basic'
}
const handleNextStep = async () => {
  if (activeStep.value === 0) {
    try {
      await basicFormRef.value?.validate()
    } catch {
      ElMessage.warning('请检查基本信息是否完整填写')
      return
    }
  }
  if (activeStep.value === 1) {
    // 资质校验：必须有营业执照有效期
    if (!licenseDateRange.value?.length) {
      ElMessage.warning('请上传营业执照并填写有效期')
      return
    }
  }
  if (activeStep.value === 2 && form.branchCount < 10) {
    ElMessage.warning('网点数量不达标（最少10个），无法通过准入审核')
  }
  activeStep.value++
  activeTab.value = Object.keys(tabToStep).find(k => tabToStep[k] === activeStep.value) || 'basic'
}

const calcFeeExample = (row: any) => {
  const d = row.data || {}
  const weight = 5
  const first = d.fw || 0
  const add = d.aw || 0
  const base = d.bs || 0
  return base + first + Math.max(0, weight - 1) * add
}

const runPrecheck = async () => {
  if (props.mode === 'add') {
    ElMessage.info('保存后可运行完整前置校验，当前为模拟结果')
    // 模拟一个预检查报告
    precheckReport.value = {
      passed: form.branchCount >= 10, score: form.branchCount >= 10 ? 88 : 55,
      level: form.branchCount >= 10 ? 'good' : 'danger',
      blockItems: form.branchCount < 10 ? [{ field: 'branchCount', message: '网点数量不足：当前 ' + form.branchCount + ' / 最低10', severity: 'error' }] : [],
      dimensions: {
        qualification: { passed: !!licenseDateRange.value?.length, score: !!licenseDateRange.value?.length ? 85 : 40, detail: !!licenseDateRange.value?.length ? '营业执照有效' : '缺少营业执照信息' },
        coverage: { passed: form.branchCount >= 10, score: Math.min(100, (form.branchCount || 0) * 2), detail: `当前网点 ${form.branchCount || 0} 个，覆盖城市 0 个` },
        timeliness: { passed: !!(form.crossProvinceTimeliness && form.intraProvinceTimeliness), score: 80, detail: `跨省${form.crossProvinceTimeliness || '-'}h / 省内${form.intraProvinceTimeliness || '-'}h` },
        permission: { passed: (form.dailyOrderLimit || 0) >= 100, score: 90, detail: `日额度 ${form.dailyOrderLimit || 0} 单` },
      },
      blockEnabled: form.branchCount < 10,
      blockReason: form.branchCount < 10 ? '网点覆盖不足，启用将被拦截' : undefined,
    } as any
    return
  }
  try {
    const res = await apiRunPreCheck(form.id)
    precheckReport.value = res.data
  } catch (e: any) {
    ElMessage.error(e?.message || '前置校验失败')
  }
}

const checkFeeComplianceFn = async () => {
  if (props.mode === 'add') {
    feeCheckResult.value = {
      compliant: form.firstWeightFee >= 0 && form.additionalWeightFee >= 0,
      violations: [
        ...(form.firstWeightFee > 50 ? [{ type: 'price_high', message: `首重资费${form.firstWeightFee}元偏高，建议≤50元`, level: 'warning' as const }] : []),
        ...(form.additionalWeightFee > 20 ? [{ type: 'price_high', message: `续重资费${form.additionalWeightFee}元偏高，建议≤20元`, level: 'warning' as const }] : []),
        ...(form.firstWeightFee < 2 ? [{ type: 'price_low', message: `首重资费${form.firstWeightFee}元过低，可能为违规配置`, level: 'error' as const }] : []),
      ]
    }
    return
  }
  try {
    const res = await checkFeeCompliance(form.id, {
      firstWeightFee: form.firstWeightFee, additionalWeightFee: form.additionalWeightFee,
      baseServiceFee: form.baseServiceFee
    })
    feeCheckResult.value = res.data
  } catch (e: any) { ElMessage.error(e?.message || '合规性检测失败') }
}
const checkFeeCompliance = checkFeeComplianceFn

const detectCoreChanges = (): { changed: boolean; fields: string[] } => {
  const coreFieldList = ['firstWeightFee', 'additionalWeightFee', 'baseServiceFee',
    'cooperationStatus', 'level', 'matchPriority', 'serviceProvince', 'dailyOrderLimit']
  const changes: string[] = []
  const before = originalDataSnapshot.value
  coreFieldList.forEach(k => {
    if (JSON.stringify(form[k]) !== JSON.stringify(before[k])) changes.push(k)
  })
  return { changed: changes.length > 0, fields: changes }
}

const handleSubmit = async () => {
  try {
    await basicFormRef.value?.validate()
  } catch {
    ElMessage.warning('请检查必填项是否正确填写')
    return
  }
  if (!licenseDateRange.value?.length && props.mode === 'add') {
    ElMessage.warning('请填写营业执照有效期')
    return
  }
  form.licenseValidFrom = licenseDateRange.value?.[0] || form.licenseValidFrom
  form.licenseValidTo = licenseDateRange.value?.[1] || form.licenseValidTo

  const capFlagMap: Record<string, string> = { cod: 'supportCod', coldChain: 'supportColdChain', oversized: 'supportOversized', pickup: 'supportPickup' }
  capabilityFlags.value.forEach(f => { const k = capFlagMap[f]; if (k) form[k] = 1 })

  submitting.value = true
  try {
    if (props.mode === 'add') {
      const res = await createProvider(form)
      ElMessage.success(`服务商「${res.data?.providerName || ''}」已提交准入审核，待审核通过后生效`)
      emit('submitted')
      emitClose()
    } else {
      // 合作中修改核心参数 -> 触发二次确认
      if (form.cooperationStatus === CooperationStatus.COOPERATING) {
        const det = detectCoreChanges()
        if (det.changed) {
          emit('core-change-detected', {
            original: { ...originalDataSnapshot.value },
            newData: { ...form },
            coreFields: det.fields
          })
          submitting.value = false
          return
        }
      }
      const payload: ProviderUpdateData = { id: form.id, data: { ...form } }
      await updateProvider(payload)
      ElMessage.success('服务商信息已更新')
      emit('submitted')
      emitClose()
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '保存失败')
  } finally {
    submitting.value = false
  }
}

const handleCancel = () => {
  emitClose()
}

// ========== 初始化 ==========
const initForm = async () => {
  if (!props.modelValue) return
  await nextTick()
  if (props.initialData && Object.keys(props.initialData).length) {
    Object.assign(form, props.initialData)
    originalDataSnapshot.value = { ...props.initialData }
    if (form.licenseValidFrom && form.licenseValidTo) {
      licenseDateRange.value = [form.licenseValidFrom, form.licenseValidTo]
    }
    capabilityFlags.value = []
    if (form.supportCod) capabilityFlags.value.push('cod')
    if (form.supportColdChain) capabilityFlags.value.push('coldChain')
    if (form.supportOversized) capabilityFlags.value.push('oversized')
    if (form.supportPickup) capabilityFlags.value.push('pickup')
    if (props.mode === 'edit' && form.id) await loadEditPermission(form.id)
  } else {
    // add mode
    await generateCode()
  }
  activeStep.value = 0
  activeTab.value = 'basic'
  precheckReport.value = null
  feeCheckResult.value = null
}

watch(() => props.modelValue, v => { if (v) initForm() }, { immediate: true })
watchEffect(() => {
  if (Array.isArray(form.serviceProvince)) {
    form.serviceProvince = form.serviceProvince.join(',')
  }
})
</script>

<style lang="scss" scoped>
.provider-form-dialog {
  :deep(.el-dialog) {
    animation: zoomFadeIn 0.32s cubic-bezier(0.3, 0, 0.7, 1);
    border-radius: 10px;
    overflow: hidden;
  }
  @keyframes zoomFadeIn {
    0% { opacity: 0; transform: scale(0.9) translateY(-20px); }
    100% { opacity: 1; transform: scale(1) translateY(0); }
  }

  .dialog-inner-wrap { padding: 0 4px 0 0; }

  .step-nav {
    margin: 8px 24px 24px;
    :deep(.el-step__title) { font-size: 13px; font-weight: 600; }
  }

  .content-tabs {
    :deep(.el-tabs__item) {
      height: 44px; line-height: 44px; font-size: 13px; font-weight: 500;
    }
    :deep(.el-tab-pane) { padding: 4px 12px 8px 20px; }
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px 24px;
    .full-width { grid-column: 1 / -1; }
  }

  .field-with-actions { display: flex; gap: 8px; align-items: center; }

  .field-tip {
    font-size: 11px; color: #909399; margin-top: 4px; line-height: 1.5;
    &.error-tip { color: #f56c6c; font-weight: 500; }
  }

  .locked-icon { color: #f56c6c; margin-left: 6px; }

  .input-error {
    :deep(.el-input__wrapper) {
      box-shadow: 0 0 0 1px #f56c6c inset !important;
    }
  }

  .avatar-uploader {
    :deep(.el-upload) {
      border: 1px dashed #d9d9d9; border-radius: 6px; cursor: pointer;
      width: 160px; height: 96px; overflow: hidden;
      display: flex; align-items: center; justify-content: center;
      transition: border-color .2s;
      &:hover { border-color: #409EFF; }
    }
    .avatar-uploader-icon { font-size: 28px; color: #8c939d; }
    .avatar { width: 100%; height: 100%; object-fit: cover; display: block; }
  }

  .qualification-intro-wrap {
    width: 100%; position: relative;
    .intro-preview {
      position: absolute; right: 12px; bottom: -4px;
      display: flex; align-items: center; gap: 4px;
      font-size: 12px; color: #409EFF; cursor: pointer;
    }
  }

  :deep(.qualification-tooltip) {
    max-width: 520px !important;
    .el-tooltip__popper-inner {
      max-height: 400px; overflow-y: auto; font-size: 13px; line-height: 1.7;
    }
  }

  .precheck-result-wrap {
    width: 100%;
    padding: 14px 16px;
    background: linear-gradient(135deg, #f5f9ff, #f0f9ff);
    border-radius: 8px; border: 1px solid #e4eaf2;

    .precheck-score {
      text-align: center; padding: 16px 8px;
      border-radius: 8px; background: #fff;
      box-shadow: 0 2px 6px rgba(0,0,0,0.04);
      .num { display: block; font-size: 36px; font-weight: 700; line-height: 1.2; }
      .label { font-size: 12px; color: #909399; margin-top: 4px; display: block; }

      &.score-excellent .num { color: #67c23a; }
      &.score-good .num { color: #409EFF; }
      &.score-pass .num { color: #e6a23c; }
      &.score-danger .num { color: #f56c6c; }
    }

    .precheck-dimensions {
      display: flex; flex-direction: column; gap: 8px;
      .dim-item {
        padding: 8px 12px; background: #fff; border-radius: 6px;
        border: 1px solid #ebeef5;
      }
      .dim-head {
        display: flex; align-items: center; gap: 10px; font-size: 13px;
        .dim-label { font-weight: 600; color: #303133; }
        .dim-score { margin-left: auto; font-weight: 600; color: #606266; }
      }
      .dim-detail { font-size: 12px; color: #606266; margin-top: 4px; }
    }

    .precheck-actions {
      margin-top: 12px; padding-top: 12px; border-top: 1px dashed #e4e7ed;
      display: flex; justify-content: flex-end;
    }
  }

  .run-precheck-placeholder {
    padding: 20px;
    background: linear-gradient(135deg, #fafcff, #f4faff);
    border: 1px dashed #c0d5ff;
    border-radius: 8px;
    display: flex; justify-content: center; align-items: center;
  }

  .fee-check-wrap {
    width: 100%;
    .fee-check-result { margin-top: 10px; display: flex; flex-direction: column; gap: 6px; }
  }

  .fee-example { font-weight: 700; color: #f56c6c; }

  .dialog-footer {
    display: flex; justify-content: flex-end; gap: 8px; padding: 4px 20px 12px;
  }
}
</style>
