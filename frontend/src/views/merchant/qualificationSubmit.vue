<template>
  <div class="qualification-submit-page">
    <el-card class="section-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="title">
            <el-icon class="header-icon"><OfficeBuilding /></el-icon>
            商家入驻资质提交
          </span>
          <el-tag v-if="currentMerchant?.settle_status !== undefined" :type="settleTagType">
            {{ settleStatusText }}
          </el-tag>
        </div>
      </template>

      <el-form
        ref="merchantFormRef"
        :model="merchantForm"
        :rules="merchantRules"
        label-width="140px"
        class="merchant-form"
      >
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="商家名称" prop="name">
              <el-input v-model="merchantForm.name" placeholder="请输入商家名称" clearable @blur="validateNameUnique" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="行业类型" prop="industry_type">
              <el-select v-model="merchantForm.industry_type" placeholder="请选择行业类型" clearable style="width: 100%">
                <el-option label="食品餐饮" value="食品餐饮" />
                <el-option label="服装鞋帽" value="服装鞋帽" />
                <el-option label="数码电器" value="数码电器" />
                <el-option label="美妆个护" value="美妆个护" />
                <el-option label="家居用品" value="家居用品" />
                <el-option label="母婴用品" value="母婴用品" />
                <el-option label="医疗健康" value="医疗健康" />
                <el-option label="其他" value="其他" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left"><span class="divider-title">法人信息</span></el-divider>

        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="法人姓名" prop="legal_person">
              <el-input v-model="merchantForm.legal_person" placeholder="请输入法人姓名" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="法人身份证号" prop="legal_id_card">
              <el-input
                v-model="merchantForm.legal_id_card"
                placeholder="请输入18位身份证号"
                clearable
                maxlength="18"
                @blur="validateIdCard"
              >
                <template #append>
                  <el-button link type="primary" :loading="idCardValidating" @click="validateIdCard(true)">
                    {{ idCardValidationResult ? (idCardValidationResult.valid ? '✓ 格式正确' : '✗ 格式错误') : '校验' }}
                  </el-button>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="身份证正面照" prop="legal_id_front_url">
              <div class="upload-wrapper">
                <el-upload
                  drag
                  action="#"
                  :auto-upload="false"
                  :show-file-list="false"
                  accept="image/*"
                  :on-change="(file) => handleFileUpload(file, 'legal_id_front_url')"
                >
                  <el-icon class="uploader-icon"><UploadFilled /></el-icon>
                  <div class="el-upload__text">将图片拖到此处，或<em>点击上传</em></div>
                  <template #tip>
                    <div class="el-upload__tip">请上传清晰的身份证正面照，支持JPG/PNG格式</div>
                  </template>
                </el-upload>
                <div v-if="uploadProgress.legal_id_front_url !== undefined || merchantForm.legal_id_front_url" class="upload-preview">
                  <el-progress v-if="uploadProgress.legal_id_front_url !== undefined" :percentage="uploadProgress.legal_id_front_url" :status="uploadProgress.legal_id_front_url === 100 ? 'success' : ''" />
                  <el-image v-if="merchantForm.legal_id_front_url && uploadProgress.legal_id_front_url === 100" :src="merchantForm.legal_id_front_url" fit="cover" class="preview-img" :preview-src-list="[merchantForm.legal_id_front_url]" />
                </div>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="身份证反面照" prop="legal_id_back_url">
              <div class="upload-wrapper">
                <el-upload
                  drag
                  action="#"
                  :auto-upload="false"
                  :show-file-list="false"
                  accept="image/*"
                  :on-change="(file) => handleFileUpload(file, 'legal_id_back_url')"
                >
                  <el-icon class="uploader-icon"><UploadFilled /></el-icon>
                  <div class="el-upload__text">将图片拖到此处，或<em>点击上传</em></div>
                  <template #tip>
                    <div class="el-upload__tip">请上传清晰的身份证反面照</div>
                  </template>
                </el-upload>
                <div v-if="uploadProgress.legal_id_back_url !== undefined || merchantForm.legal_id_back_url" class="upload-preview">
                  <el-progress v-if="uploadProgress.legal_id_back_url !== undefined" :percentage="uploadProgress.legal_id_back_url" :status="uploadProgress.legal_id_back_url === 100 ? 'success' : ''" />
                  <el-image v-if="merchantForm.legal_id_back_url && uploadProgress.legal_id_back_url === 100" :src="merchantForm.legal_id_back_url" fit="cover" class="preview-img" :preview-src-list="[merchantForm.legal_id_back_url]" />
                </div>
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left"><span class="divider-title">营业执照信息</span></el-divider>

        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="统一社会信用代码" prop="credit_code">
              <el-input
                v-model="merchantForm.credit_code"
                placeholder="请输入18位统一社会信用代码"
                clearable
                maxlength="18"
                @blur="validateCreditCode"
              >
                <template #append>
                  <el-button link type="primary" :loading="creditCodeValidating" @click="validateCreditCode(true)">
                    {{ creditCodeValidationResult ? (creditCodeValidationResult.valid ? '✓ 格式正确' : '✗ 格式错误') : '校验' }}
                  </el-button>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="营业执照号" prop="business_license_no">
              <el-input
                v-model="merchantForm.business_license_no"
                placeholder="请输入营业执照号"
                clearable
                @blur="validateBusinessLicense"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="有效期起始" prop="license_valid_from">
              <el-date-picker
                v-model="merchantForm.license_valid_from"
                type="date"
                placeholder="请选择有效期起始日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="有效期终止" prop="license_valid_to">
              <el-date-picker
                v-model="merchantForm.license_valid_to"
                type="date"
                placeholder="请选择有效期终止日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
                :disabled-date="disabledBeforeValidFrom"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="注册资本(万元)" prop="registered_capital">
              <el-input-number v-model="merchantForm.registered_capital" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="成立日期" prop="establish_date">
              <el-date-picker
                v-model="merchantForm.establish_date"
                type="date"
                placeholder="请选择成立日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="24">
          <el-col :span="24">
            <el-form-item label="营业执照图片" prop="license_image_url">
              <div class="upload-wrapper large">
                <el-upload
                  drag
                  action="#"
                  :auto-upload="false"
                  :show-file-list="false"
                  accept="image/*"
                  :on-change="(file) => handleFileUpload(file, 'license_image_url')"
                >
                  <el-icon class="uploader-icon"><UploadFilled /></el-icon>
                  <div class="el-upload__text">将营业执照图片拖到此处，或<em>点击上传</em></div>
                  <template #tip>
                    <div class="el-upload__tip">请上传清晰的营业执照正本扫描件</div>
                  </template>
                </el-upload>
                <div v-if="uploadProgress.license_image_url !== undefined || merchantForm.license_image_url" class="upload-preview">
                  <el-progress v-if="uploadProgress.license_image_url !== undefined" :percentage="uploadProgress.license_image_url" :status="uploadProgress.license_image_url === 100 ? 'success' : ''" />
                  <el-image v-if="merchantForm.license_image_url && uploadProgress.license_image_url === 100" :src="merchantForm.license_image_url" fit="contain" class="preview-img large" :preview-src-list="[merchantForm.license_image_url]" />
                </div>
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="24">
          <el-col :span="24">
            <el-form-item label="经营范围" prop="business_scope">
              <el-input v-model="merchantForm.business_scope" type="textarea" :rows="3" placeholder="请输入营业执照上的经营范围" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left"><span class="divider-title">联系信息</span></el-divider>

        <el-row :gutter="24">
          <el-col :span="8">
            <el-form-item label="联系人" prop="contact">
              <el-input v-model="merchantForm.contact" placeholder="请输入联系人姓名" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="联系电话" prop="phone">
              <el-input v-model="merchantForm.phone" placeholder="请输入手机号码" clearable maxlength="11" @blur="validatePhone" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="注册地址" prop="address">
              <el-input v-model="merchantForm.address" placeholder="请输入注册地址" clearable />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="24">
          <el-col :span="24">
            <el-form-item label="资质备注" prop="qualification_remark">
              <el-input
                v-model="merchantForm.qualification_remark"
                type="textarea"
                :rows="2"
                placeholder="请输入其他需要说明的资质相关信息（选填）"
                maxlength="2000"
                show-word-limit
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <el-card class="section-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="title">
            <el-icon class="header-icon"><Document /></el-icon>
            行业资质与品牌授权材料
          </span>
          <el-button type="primary" link @click="addQualificationItem">
            <el-icon><Plus /></el-icon> 添加资质材料
          </el-button>
        </div>
      </template>

      <div v-for="(item, index) in qualificationList" :key="index" class="qualification-item">
        <el-divider v-if="index > 0" />
        <div class="qualification-header">
          <span class="qualification-index">材料 {{ index + 1 }}</span>
          <el-button link type="danger" @click="removeQualificationItem(index)">
            <el-icon><Delete /></el-icon> 移除
          </el-button>
        </div>
        <el-form :model="item" label-width="140px" class="qualification-form">
          <el-row :gutter="24">
            <el-col :span="8">
              <el-form-item label="资质类型">
                <el-select v-model="item.qualification_type" placeholder="请选择资质类型" style="width: 100%">
                  <el-option v-for="opt in QUALIFICATION_TYPE_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="证件编号">
                <el-input v-model="item.certificate_no" placeholder="请输入证件编号" clearable />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="证件持有人">
                <el-input v-model="item.certificate_holder" placeholder="请输入证件持有人" clearable />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="8">
              <el-form-item label="有效期起始">
                <el-date-picker v-model="item.valid_from" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="有效期终止">
                <el-date-picker v-model="item.expire_date" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="关联类目">
                <el-input-number v-model="item.category_id" :min="0" style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="24">
            <el-col :span="24">
              <el-form-item label="资质材料文件">
                <div class="upload-wrapper">
                  <el-upload
                    drag
                    action="#"
                    :auto-upload="false"
                    :show-file-list="false"
                    accept="image/*,.pdf"
                    :on-change="(file) => handleQualificationFileUpload(file, index)"
                  >
                    <el-icon class="uploader-icon"><UploadFilled /></el-icon>
                    <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
                    <template #tip>
                      <div class="el-upload__tip">支持图片和PDF格式</div>
                    </template>
                  </el-upload>
                  <div v-if="item.uploadProgress !== undefined || item.file_url" class="upload-preview">
                    <el-progress v-if="item.uploadProgress !== undefined" :percentage="item.uploadProgress" :status="item.uploadProgress === 100 ? 'success' : ''" />
                    <div v-if="item.file_url && item.uploadProgress === 100" class="file-display">
                      <el-link type="primary" :href="item.file_url" target="_blank">
                        <el-icon><View /></el-icon> 查看文件
                      </el-link>
                    </div>
                  </div>
                </div>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row v-if="item.verification_status !== undefined" :gutter="24">
            <el-col :span="24">
              <el-alert
                :title="`核验结果：${item.verification_status === 1 ? '核验通过' : item.verification_status === 2 ? '核验不通过' : '核验异常'}`"
                :type="item.verification_status === 1 ? 'success' : item.verification_status === 2 ? 'error' : 'warning'"
                :description="item.verification_remark || ''"
                show-icon
                :closable="false"
              />
            </el-col>
          </el-row>
        </el-form>
      </div>

      <el-empty v-if="qualificationList.length === 0" description="暂无资质材料，请点击右上角添加" />
    </el-card>

    <el-card class="section-card validation-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="title">
            <el-icon class="header-icon"><CircleCheck /></el-icon>
            实时校验结果
          </span>
          <el-button type="primary" size="small" :loading="checkingCompleteness" @click="runFullCheck">
            <el-icon v-if="!checkingCompleteness"><Refresh /></el-icon> 刷新校验
          </el-button>
        </div>
      </template>

      <div class="validation-results">
        <div class="validation-section">
          <div class="section-label">格式校验</div>
          <div class="validation-item" :class="idCardValidationResult?.valid ? 'success' : idCardValidationResult ? 'error' : 'pending'">
            <el-icon><Document /></el-icon>
            <span>法人身份证号：{{ idCardValidationResult?.message || (idCardValidationResult?.valid ? '格式正确' : '等待输入或校验') }}</span>
          </div>
          <div class="validation-item" :class="creditCodeValidationResult?.valid ? 'success' : creditCodeValidationResult ? 'error' : 'pending'">
            <el-icon><Document /></el-icon>
            <span>统一社会信用代码：{{ creditCodeValidationResult?.message || (creditCodeValidationResult?.valid ? '格式正确' : '等待输入或校验') }}</span>
          </div>
          <div class="validation-item" :class="dateValidationResult?.valid ? 'success' : dateValidationResult ? 'error' : 'pending'">
            <el-icon><Calendar /></el-icon>
            <span>营业执照有效期：{{ dateValidationResult?.message || (dateValidationResult?.valid ? '日期范围正确' : '等待选择日期') }}</span>
          </div>
        </div>

        <div class="validation-section">
          <div class="section-label">唯一性校验</div>
          <div v-for="(dup, idx) in uniquenessResult.duplicates" :key="idx" class="validation-item error">
            <el-icon><Warning /></el-icon>
            <span>{{ dup.message }}：已被 {{ dup.merchant_names.join('、') }} 使用</span>
          </div>
          <div v-if="uniquenessResult.duplicates.length === 0 && uniquenessResult.checked" class="validation-item success">
            <el-icon><CircleCheck /></el-icon>
            <span>未检测到重复入驻记录</span>
          </div>
        </div>

        <div class="validation-section">
          <div class="section-label">完整性校验</div>
          <div v-for="(msg, idx) in completenessResult.missing" :key="'m'+idx" class="validation-item error">
            <el-icon><CircleClose /></el-icon>
            <span>缺失材料：{{ msg }}</span>
          </div>
          <div v-for="(msg, idx) in completenessResult.violations" :key="'v'+idx" class="validation-item error">
            <el-icon><Warning /></el-icon>
            <span>违规/过期：{{ msg }}</span>
          </div>
          <div v-if="completenessResult.missing.length === 0 && completenessResult.violations.length === 0 && completenessResult.checked" class="validation-item success">
            <el-icon><CircleCheck /></el-icon>
            <span>材料完整性校验通过</span>
          </div>
        </div>

        <div class="validation-section">
          <div class="section-label">合规性风险检测</div>
          <div v-for="(rp, idx) in fraudResult.risk_points" :key="'rp'+idx" class="validation-item" :class="rp.level === 'high' ? 'error' : rp.level === 'medium' ? 'warning' : 'warning'">
            <el-icon><WarningFilled /></el-icon>
            <span>[{{ rp.level === 'high' ? '高风险' : rp.level === 'medium' ? '中风险' : '低风险' }}] {{ rp.message }}</span>
          </div>
          <div v-if="fraudResult.risk_points.length === 0 && fraudResult.checked" class="validation-item success">
            <el-icon><CircleCheck /></el-icon>
            <span>合规性校验通过：{{ fraudResult.suggestion || '未检测到风险点' }}</span>
          </div>
          <div v-if="fraudResult.suggestion" class="fraud-suggestion">
            <el-icon><InfoFilled /></el-icon>
            <span>建议：{{ fraudResult.suggestion }}</span>
          </div>
        </div>
      </div>
    </el-card>

    <div class="submit-bar">
      <el-button :loading="submitting" type="primary" size="large" @click="handleSubmit">
        <el-icon><Check /></el-icon> 提交资质审核
      </el-button>
      <el-button v-if="isResubmitMode" :loading="submitting" size="large" @click="handleResubmit">
        <el-icon><RefreshRight /></el-icon> 补传材料重新提交
      </el-button>
      <el-button size="large" @click="handleReset">
        <el-icon><RefreshLeft /></el-icon> 重置表单
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  OfficeBuilding, Document, UploadFilled, Plus, Delete, CircleCheck,
  Refresh, Warning, CircleClose, WarningFilled, InfoFilled, Check,
  RefreshRight, RefreshLeft, View, Calendar
} from '@element-plus/icons-vue'
import type { FormInstance, FormRules, UploadFile } from 'element-plus'
import {
  QUALIFICATION_TYPE_OPTIONS, SETTLE_STATUS_OPTIONS,
  validateDocumentFormat, validateDateRange, checkDuplicateMerchant, checkCompleteness,
  submitMerchantQualification, resubmitMerchantQualification, checkUniqueness, checkFraud,
  type QualificationMaterial, type MerchantQualificationSubmitPayload
} from '@/api/merchantQualification'
import type { MerchantAuditSettleItem } from '@/api/merchantQualification'

const props = defineProps<{
  merchantId?: number
  isResubmitMode?: boolean
  initialData?: MerchantAuditSettleItem | null
}>()

const emit = defineEmits<{
  (e: 'submitted', data: any): void
  (e: 'resubmitted', data: any): void
}>()

const merchantFormRef = ref<FormInstance>()
const submitting = ref(false)
const checkingCompleteness = ref(false)
const idCardValidating = ref(false)
const creditCodeValidating = ref(false)

const merchantForm = reactive({
  name: '',
  legal_person: '',
  legal_id_card: '',
  business_license_no: '',
  credit_code: '',
  license_valid_from: '',
  license_valid_to: '',
  license_image_url: '',
  legal_id_front_url: '',
  legal_id_back_url: '',
  registered_capital: undefined as number | undefined,
  establish_date: '',
  business_scope: '',
  contact: '',
  phone: '',
  address: '',
  industry_type: '',
  qualification_remark: '',
})

const uploadProgress = reactive<Record<string, number>>({})

const qualificationList = ref<QualificationMaterial[]>([])

const idCardValidationResult = ref<{ valid: boolean; message?: string } | null>(null)
const creditCodeValidationResult = ref<{ valid: boolean; message?: string } | null>(null)
const dateValidationResult = ref<{ valid: boolean; message?: string } | null>(null)
const uniquenessResult = reactive<{ checked: boolean; duplicates: any[] }>({ checked: false, duplicates: [] })
const completenessResult = reactive<{ checked: boolean; complete: boolean; missing: string[]; violations: string[] }>({
  checked: false, complete: false, missing: [], violations: []
})
const fraudResult = reactive<{
  checked: boolean; is_fraud: boolean; risk_points: any[]; suggestion: string
}>({ checked: false, is_fraud: false, risk_points: [], suggestion: '' })

const currentMerchant = ref<MerchantAuditSettleItem | null>(props.initialData || null)

const settleStatusText = computed(() => {
  if (currentMerchant.value?.settle_status === undefined) return ''
  const opt = SETTLE_STATUS_OPTIONS.find(o => o.value === currentMerchant.value?.settle_status)
  return opt?.label || ''
})

type TagType = 'primary' | 'success' | 'warning' | 'info' | 'danger' | undefined;
const settleTagType = computed((): TagType => {
  if (currentMerchant.value?.settle_status === undefined) return 'info'
  const opt = SETTLE_STATUS_OPTIONS.find(o => o.value === currentMerchant.value?.settle_status)
  return (opt?.type as TagType) || 'info'
})

const merchantRules: FormRules = {
  name: [{ required: true, message: '请输入商家名称', trigger: 'blur' }],
  legal_person: [{ required: true, message: '请输入法人姓名', trigger: 'blur' }],
  legal_id_card: [
    { required: true, message: '请输入法人身份证号', trigger: 'blur' },
    { pattern: /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/, message: '身份证号格式不正确', trigger: 'blur' },
  ],
  credit_code: [
    { required: true, message: '请输入统一社会信用代码', trigger: 'blur' },
  ],
  license_valid_from: [{ required: true, message: '请选择有效期起始', trigger: 'change' }],
  license_valid_to: [{ required: true, message: '请选择有效期终止', trigger: 'change' }],
  license_image_url: [{ required: true, message: '请上传营业执照图片', trigger: 'change' }],
  legal_id_front_url: [{ required: true, message: '请上传身份证正面照', trigger: 'change' }],
  legal_id_back_url: [{ required: true, message: '请上传身份证反面照', trigger: 'change' }],
  phone: [{ pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }],
}

const disabledBeforeValidFrom = (date: Date) => {
  if (!merchantForm.license_valid_from) return false
  return date.getTime() < new Date(merchantForm.license_valid_from).getTime()
}

const addQualificationItem = () => {
  qualificationList.value.push({
    qualification_type: 'industry_qualification',
    certificate_no: '',
    certificate_holder: '',
    file_url: '',
    valid_from: '',
    expire_date: '',
    category_id: 0,
    material_order: qualificationList.value.length,
  })
}

const removeQualificationItem = (index: number) => {
  qualificationList.value.splice(index, 1)
}

const simulateUploadProgress = (onProgress: (p: number) => void, onComplete: () => void) => {
  let p = 0
  const timer = setInterval(() => {
    p += Math.floor(Math.random() * 15) + 5
    if (p >= 100) {
      p = 100
      clearInterval(timer)
      onProgress(p)
      setTimeout(onComplete, 200)
    } else {
      onProgress(p)
    }
  }, 150)
}

const generateMockFileUrl = (fileName: string) => {
  return `/uploads/qualifications/${Date.now()}_${Math.random().toString(36).slice(2)}_${fileName}`
}

const handleFileUpload = (file: UploadFile, field: keyof typeof merchantForm) => {
  if (!file.raw) return
  uploadProgress[field] = 0
  simulateUploadProgress(
    (p) => { uploadProgress[field] = p },
    () => {
      ;(merchantForm as any)[field] = generateMockFileUrl(file.name)
      ElMessage.success('文件上传成功')
    }
  )
}

const handleQualificationFileUpload = (file: UploadFile, index: number) => {
  if (!file.raw) return
  qualificationList.value[index].uploadProgress = 0
  simulateUploadProgress(
    (p) => { qualificationList.value[index].uploadProgress = p },
    async () => {
      qualificationList.value[index].file_url = generateMockFileUrl(file.name)
      const qual = qualificationList.value[index]
      if (qual.certificate_no) {
        try {
          const res = await validateDocumentFormat({ type: 'credit_code', value: qual.certificate_no })
          if (res.data) {
            const indRes = await checkDuplicateMerchant({ credit_code: qual.certificate_no })
            qual.verification_status = res.data.valid ? (indRes.data.valid ? 1 : 3) : 2
            qual.verification_remark = res.data.valid ? (indRes.data.valid ? '系统核验通过' : '检测到重复使用') : '证件格式错误'
            qual.verification_source = 'industry'
          }
        } catch (_e) {}
      }
      ElMessage.success('文件上传成功')
    }
  )
}

const validateIdCard = async (forceOrEvent?: boolean | Event) => {
  const force = typeof forceOrEvent === 'boolean' ? forceOrEvent : false;
  if (!merchantForm.legal_id_card) {
    idCardValidationResult.value = null
    return
  }
  if (!force && idCardValidationResult.value) return
  idCardValidating.value = true
  try {
    const res = await validateDocumentFormat({ type: 'id_card', value: merchantForm.legal_id_card })
    idCardValidationResult.value = res.data
    if (!res.data?.valid) {
      ElMessage.warning(res.data?.message || '身份证号格式错误')
    }
  } finally {
    idCardValidating.value = false
  }
}

const validateCreditCode = async (forceOrEvent?: boolean | Event) => {
  const force = typeof forceOrEvent === 'boolean' ? forceOrEvent : false;
  if (!merchantForm.credit_code) {
    creditCodeValidationResult.value = null
    return
  }
  if (!force && creditCodeValidationResult.value) return
  creditCodeValidating.value = true
  try {
    const res = await validateDocumentFormat({ type: 'credit_code', value: merchantForm.credit_code })
    creditCodeValidationResult.value = res.data
    if (!res.data?.valid) {
      ElMessage.warning(res.data?.message || '信用代码格式错误')
    }
    await validateUniqueness()
  } finally {
    creditCodeValidating.value = false
  }
}

const validateBusinessLicense = async () => {
  if (merchantForm.business_license_no) {
    const res = await validateDocumentFormat({ type: 'business_license', value: merchantForm.business_license_no })
    if (!res.data?.valid) ElMessage.warning(res.data?.message)
    await validateUniqueness()
  }
}

const validatePhone = async () => {
  if (merchantForm.phone) {
    const res = await validateDocumentFormat({ type: 'phone', value: merchantForm.phone })
    if (!res.data?.valid) ElMessage.warning(res.data?.message)
  }
}

const validateNameUnique = async () => {
  if (merchantForm.name) await validateUniqueness()
}

const validateDateRangeField = async () => {
  if (merchantForm.license_valid_from && merchantForm.license_valid_to) {
    const res = await validateDateRange({ valid_from: merchantForm.license_valid_from, expire_date: merchantForm.license_valid_to })
    dateValidationResult.value = res.data
  }
}

const validateUniqueness = async () => {
  const res = await checkUniqueness({
    credit_code: merchantForm.credit_code,
    business_license_no: merchantForm.business_license_no,
    legal_id_card: merchantForm.legal_id_card,
    phone: merchantForm.phone,
    name: merchantForm.name,
    exclude_merchant_id: props.merchantId,
  })
  uniquenessResult.checked = true
  uniquenessResult.duplicates = res.data?.duplicates || []
}

const runFullCheck = async () => {
  checkingCompleteness.value = true
  try {
    await validateIdCard(true)
    await validateCreditCode(true)
    await validateDateRangeField()
    await validateUniqueness()

    const payload: MerchantQualificationSubmitPayload = buildSubmitPayload()
    const res = await checkCompleteness(payload)
    completenessResult.checked = true
    completenessResult.complete = res.data?.complete || false
    completenessResult.missing = res.data?.missing || []
    completenessResult.violations = res.data?.violations || []

    const fraudRes = await checkFraud({
      merchant_id: props.merchantId,
      credit_code: merchantForm.credit_code,
      business_license_no: merchantForm.business_license_no,
      certificate_nos: qualificationList.value.map(q => q.certificate_no).filter(Boolean) as string[],
    })
    fraudResult.checked = true
    fraudResult.is_fraud = fraudRes.data?.is_fraud || false
    fraudResult.risk_points = fraudRes.data?.risk_points || []
    fraudResult.suggestion = fraudRes.data?.suggestion || ''
  } finally {
    checkingCompleteness.value = false
  }
}

const buildSubmitPayload = (): MerchantQualificationSubmitPayload => {
  const qualifications: QualificationMaterial[] = [
    {
      qualification_type: 'business_license',
      certificate_no: merchantForm.credit_code,
      certificate_holder: merchantForm.name,
      file_url: merchantForm.license_image_url,
      valid_from: merchantForm.license_valid_from,
      expire_date: merchantForm.license_valid_to,
      category_id: 0,
      material_order: 0,
    },
    {
      qualification_type: 'legal_id_card',
      certificate_no: merchantForm.legal_id_card,
      certificate_holder: merchantForm.legal_person,
      file_url: merchantForm.legal_id_front_url || merchantForm.legal_id_back_url,
      category_id: 0,
      material_order: 1,
    },
    ...qualificationList.value.map((q, i) => ({ ...q, material_order: i + 2 })),
  ].filter(q => q.file_url)

  return {
    merchant_id: props.merchantId || 0,
    merchant_info: { ...merchantForm },
    qualifications,
  }
}

const handleSubmit = async () => {
  if (!merchantFormRef.value) return
  try {
    await merchantFormRef.value.validate()
  } catch (_e) {
    ElMessage.warning('请完善基础信息表单')
    return
  }
  if (!props.merchantId) {
    ElMessage.warning('缺少商家ID，请先创建商家基础信息')
    return
  }
  try {
    submitting.value = true
    await runFullCheck()
    if (!completenessResult.complete) {
      await ElMessageBox.confirm(
        `检测到 ${completenessResult.missing.length} 项缺失，${completenessResult.violations.length} 项问题。是否仍要提交？`,
        '校验不完整',
        { type: 'warning', confirmButtonText: '继续提交', cancelButtonText: '返回修改' }
      )
    }
    if (fraudResult.is_fraud) {
      await ElMessageBox.confirm(
        '检测到高风险点，提交后将进入严格人工审核流程。是否继续？',
        '风险提示',
        { type: 'error', confirmButtonText: '继续提交', cancelButtonText: '返回修改' }
      )
    }
    const payload = buildSubmitPayload()
    const res = await submitMerchantQualification(payload)
    ElMessage.success(res.message || '提交成功')
    emit('submitted', res.data)
  } catch (err: any) {
    if (err !== 'cancel') {
      ElMessage.error(err?.message || '提交失败')
    }
  } finally {
    submitting.value = false
  }
}

const handleResubmit = async () => {
  if (!props.merchantId) {
    ElMessage.warning('缺少商家ID')
    return
  }
  try {
    submitting.value = true
    const payload = buildSubmitPayload()
    const res = await resubmitMerchantQualification(payload)
    ElMessage.success(res.message || '补传成功')
    emit('resubmitted', res.data)
  } catch (err: any) {
    ElMessage.error(err?.message || '补传失败')
  } finally {
    submitting.value = false
  }
}

const handleReset = () => {
  Object.keys(merchantForm).forEach(k => {
    ;(merchantForm as any)[k] = typeof (merchantForm as any)[k] === 'number' ? undefined : ''
  })
  qualificationList.value = []
  idCardValidationResult.value = null
  creditCodeValidationResult.value = null
  dateValidationResult.value = null
  uniquenessResult.checked = false
  uniquenessResult.duplicates = []
  completenessResult.checked = false
  completenessResult.complete = false
  completenessResult.missing = []
  completenessResult.violations = []
  fraudResult.checked = false
  fraudResult.is_fraud = false
  fraudResult.risk_points = []
  fraudResult.suggestion = ''
}

const initFromData = () => {
  if (!props.initialData) return
  const d = props.initialData
  merchantForm.name = d.name || ''
  merchantForm.contact = d.contact || ''
  merchantForm.phone = d.phone || ''
  merchantForm.industry_type = d.industry_type || ''
  merchantForm.credit_code = d.credit_code || ''
  merchantForm.business_license_no = d.business_license_no || ''
  merchantForm.license_valid_from = d.license_valid_from || ''
  merchantForm.license_valid_to = d.license_valid_to || ''
  merchantForm.qualification_remark = d.qualification_remark || ''
}

onMounted(() => {
  initFromData()
})
</script>

<style lang="scss" scoped>
.qualification-submit-page {
  padding-bottom: 100px;

  .section-card {
    margin-bottom: 20px;
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .title {
      display: flex;
      align-items: center;
      font-size: 16px;
      font-weight: 600;

      .header-icon {
        margin-right: 8px;
        color: var(--el-color-primary);
      }
    }
  }

  .divider-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .upload-wrapper {
    display: flex;
    gap: 16px;
    align-items: flex-start;

    :deep(.el-upload-dragger) {
      width: 240px;
      padding: 16px;
    }

    &.large {
      :deep(.el-upload-dragger) {
        width: 320px;
        padding: 24px;
      }
    }

    .uploader-icon {
      font-size: 28px;
      color: var(--el-color-primary);
    }

    .upload-preview {
      flex: 1;
      min-width: 200px;

      .preview-img {
        margin-top: 8px;
        width: 200px;
        height: 140px;
        border-radius: 4px;
        border: 1px solid var(--el-border-color-lighter);

        &.large {
          width: 320px;
          height: 200px;
        }
      }

      .file-display {
        margin-top: 8px;
      }
    }
  }

  .qualification-item {
    padding: 8px 0;

    .qualification-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;

      .qualification-index {
        font-weight: 600;
        color: var(--el-color-primary);
      }
    }
  }

  .validation-card {
    background: #fafcff;

    .validation-results {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;

      .validation-section {
        .section-label {
          font-weight: 600;
          margin-bottom: 10px;
          color: var(--el-text-color-primary);
        }

        .validation-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 0;
          font-size: 13px;
          color: var(--el-text-color-regular);

          &.success { color: var(--el-color-success); }
          &.error { color: var(--el-color-danger); }
          &.warning { color: var(--el-color-warning); }
          &.pending { color: var(--el-text-color-secondary); }
        }

        .fraud-suggestion {
          margin-top: 8px;
          padding: 10px;
          background: #ecf5ff;
          border-radius: 4px;
          color: var(--el-color-primary);
          display: flex;
          gap: 6px;
          align-items: flex-start;
        }
      }
    }
  }

  .submit-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 16px 24px;
    background: #fff;
    border-top: 1px solid var(--el-border-color-lighter);
    display: flex;
    gap: 12px;
    justify-content: center;
    z-index: 100;
  }
}
</style>
