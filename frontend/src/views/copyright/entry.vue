<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
import type { FormInstance, UploadUserFile, UploadProps } from 'element-plus'
import { useUserStore } from '@/stores'
import { COPYRIGHT_TYPE, COPYRIGHT_CONTENT_TYPE, CONTENT_CATEGORY, getEnumOptions, getEnumLabel, getEnumItem } from '@/constants/enums'
import {
  checkCopyrightConflictApi,
  verifyQualificationFilesApi,
  createCopyrightApi,
} from '@/api/copyright'
import { getContentListApi } from '@/api/content'
import type { CopyrightFormData, ContentItem, CopyrightQualificationFile, CopyrightVerifyResult } from '@/types'
import { Plus, UploadFilled, Check, Close, Refresh, Document, File, Search, Edit } from '@element-plus/icons-vue'

const userStore = useUserStore()
const getAuthToken = () => userStore.accessToken

const loading = ref(false)
const submitting = ref(false)
const formRef = ref<FormInstance>()

const contentTypeOptions = computed(() => getEnumOptions(COPYRIGHT_CONTENT_TYPE))
const copyrightTypeOptions = computed(() => getEnumOptions(COPYRIGHT_TYPE))

const formData = reactive<CopyrightFormData>({
  code: '',
  name: '',
  type: 1,
  contentType: 1,
  supplierName: '',
  supplierContact: '',
  supplierPhone: '',
  contractNo: '',
  startDate: '',
  endDate: '',
  territories: '',
  licenseScope: [],
  licenseFee: 0,
  paymentStatus: 0,
  ownershipStatus: 1,
  description: '',
  remark: '',
  copyrightCertificate: '',
  authorizationAgreement: '',
  ownershipProof: '',
  contentIds: [],
  qualificationFiles: [],
})

const selectedContentList = ref<ContentItem[]>([])
const searchContentKeyword = ref('')
const contentSearchLoading = ref(false)
const availableContentList = ref<ContentItem[]>([])

const licenseScopeOptions = computed(() => {
  const ct = getEnumItem(COPYRIGHT_CONTENT_TYPE, formData.contentType) as any
  return ct?.scopeOptions || []
})

watch(() => formData.contentType, (val) => {
  const ct = getEnumItem(COPYRIGHT_CONTENT_TYPE, val) as any
  if (ct && formData.startDate && !formData.endDate) {
    const start = new Date(formData.startDate)
    if (ct.validityUnit === 'year') {
      start.setFullYear(start.getFullYear() + ct.defaultValidity)
    } else {
      start.setMonth(start.getMonth() + ct.defaultValidity)
    }
    formData.endDate = start.toISOString().split('T')[0]
  }
  formData.licenseScope = []
})

const certificateFile = reactive({
  fileList: [] as UploadUserFile[],
  uploadProgress: 0,
  isUploading: false,
  isVerified: false,
  verifyMessage: '',
  verifyStatus: '' as '' | 'success' | 'error' | 'warning',
})

const agreementFile = reactive({
  fileList: [] as UploadUserFile[],
  uploadProgress: 0,
  isUploading: false,
  isVerified: false,
  verifyMessage: '',
  verifyStatus: '' as '' | 'success' | 'error' | 'warning',
})

const ownershipFile = reactive({
  fileList: [] as UploadUserFile[],
  uploadProgress: 0,
  isUploading: false,
  isVerified: false,
  verifyMessage: '',
  verifyStatus: '' as '' | 'success' | 'error' | 'warning',
})

const verifyResult = ref<CopyrightVerifyResult | null>(null)
const conflictCheckResult = ref<{ hasConflict: boolean; conflicts: any[]; canSubmit: boolean } | null>(null)
const conflictCheckLoading = ref(false)

const createFileUploadHandler = (fileObj: any, fieldKey: 'copyrightCertificate' | 'authorizationAgreement' | 'ownershipProof'): Partial<UploadProps> => {
  let progressTimer: any = null
  return {
    beforeUpload: (file: File) => {
      const isLt20M = file.size / 1024 / 1024 < 20
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
      const isTypeOk = allowedTypes.includes(file.type)
      if (!isTypeOk) {
        ElMessage.error('仅支持 PDF、JPG、PNG 格式的文件!')
        return false
      }
      if (!isLt20M) {
        ElMessage.error('文件大小不能超过 20MB!')
        return false
      }
      fileObj.isUploading = true
      fileObj.uploadProgress = 0
      fileObj.verifyStatus = ''
      fileObj.isVerified = false
      progressTimer = setInterval(() => {
        if (fileObj.uploadProgress < 90) {
          fileObj.uploadProgress += Math.floor(Math.random() * 15) + 5
        }
      }, 200)
      return true
    },
    onProgress: (evt: any) => {
      if (evt.percent) {
        fileObj.uploadProgress = Math.min(Math.floor(evt.percent), 99)
      }
    },
    onSuccess: (response: any) => {
      clearInterval(progressTimer)
      fileObj.uploadProgress = 100
      const url = response.data?.url || response.data
      if (url) {
        ;(formData as any)[fieldKey] = url
        fileObj.isVerified = true
        fileObj.verifyStatus = 'success'
        fileObj.verifyMessage = '文件上传成功，已通过合规校验'
        ElMessage.success('文件上传成功')
        setTimeout(() => {
          fileObj.isUploading = false
          runQualificationVerify()
          checkConflict()
        }, 300)
      }
    },
    onError: () => {
      clearInterval(progressTimer)
      fileObj.isUploading = false
      fileObj.verifyStatus = 'error'
      fileObj.verifyMessage = '文件上传失败，请重试'
      ElMessage.error('文件上传失败')
    },
    onRemove: () => {
      ;(formData as any)[fieldKey] = ''
      fileObj.isVerified = false
      fileObj.verifyStatus = ''
      fileObj.verifyMessage = ''
      fileObj.fileList = []
      runQualificationVerify()
    },
  }
}

const certificateHandlers = createFileUploadHandler(certificateFile, 'copyrightCertificate')
const agreementHandlers = createFileUploadHandler(agreementFile, 'authorizationAgreement')
const ownershipHandlers = createFileUploadHandler(ownershipFile, 'ownershipProof')

const runQualificationVerify = async () => {
  if (!formData.copyrightCertificate && !formData.authorizationAgreement && !formData.ownershipProof && !formData.startDate && !formData.endDate) {
    verifyResult.value = null
    return
  }
  try {
    const result = await verifyQualificationFilesApi({
      copyrightCertificate: formData.copyrightCertificate,
      authorizationAgreement: formData.authorizationAgreement,
      ownershipProof: formData.ownershipProof,
      startDate: formData.startDate,
      endDate: formData.endDate,
    })
    verifyResult.value = result
    if (result.issues.length > 0) {
      const hasError = result.issues.some((i) => i.level === 'error')
      if (hasError) {
        result.issues.filter((i) => i.level === 'error').forEach((i) => {
          ElMessage.error(i.message)
        })
      }
    }
  } catch (e) {
    console.error(e)
  }
}

const checkConflict = async () => {
  if (!formData.code && (!formData.contentIds || formData.contentIds.length === 0)) {
    conflictCheckResult.value = null
    return
  }
  conflictCheckLoading.value = true
  try {
    const result = await checkCopyrightConflictApi({
      code: formData.code,
      contentIds: formData.contentIds,
    })
    conflictCheckResult.value = result
    if (result.hasConflict && result.conflicts.length > 0) {
      const highConflicts = result.conflicts.filter((c) => c.level === 'high')
      if (highConflicts.length > 0) {
        highConflicts.forEach((c) => ElMessage.error(c.message))
      }
    }
  } finally {
    conflictCheckLoading.value = false
  }
}

let codeCheckTimer: any = null
watch(() => formData.code, () => {
  if (codeCheckTimer) clearTimeout(codeCheckTimer)
  codeCheckTimer = setTimeout(() => checkConflict(), 500)
})

watch([() => formData.startDate, () => formData.endDate], () => {
  runQualificationVerify()
})

watch(() => formData.contentIds, () => {
  checkConflict()
}, { deep: true })

const searchAvailableContent = async () => {
  contentSearchLoading.value = true
  try {
    const result = await getContentListApi({
      keyword: searchContentKeyword.value,
      page: 1,
      pageSize: 50,
    })
    availableContentList.value = result.list.filter((c: any) => !c.copyrightId)
  } finally {
    contentSearchLoading.value = false
  }
}

const toggleContentSelection = (content: ContentItem) => {
  const idx = formData.contentIds?.indexOf(content.id) ?? -1
  if (idx >= 0) {
    formData.contentIds?.splice(idx, 1)
    selectedContentList.value = selectedContentList.value.filter((c) => c.id !== content.id)
  } else {
    formData.contentIds?.push(content.id)
    selectedContentList.value.push(content)
  }
}

const removeSelectedContent = (content: ContentItem) => {
  const idx = formData.contentIds?.indexOf(content.id) ?? -1
  if (idx >= 0) {
    formData.contentIds?.splice(idx, 1)
  }
  selectedContentList.value = selectedContentList.value.filter((c) => c.id !== content.id)
}

const canSubmit = computed(() => {
  if (!formData.code || !formData.name || !formData.supplierName || !formData.startDate || !formData.endDate) {
    return false
  }
  if (!formData.copyrightCertificate || !formData.authorizationAgreement || !formData.ownershipProof) {
    return false
  }
  if (verifyResult.value && verifyResult.value.issues.some((i) => i.level === 'error')) {
    return false
  }
  if (conflictCheckResult.value && !conflictCheckResult.value.canSubmit) {
    return false
  }
  if (certificateFile.isUploading || agreementFile.isUploading || ownershipFile.isUploading) {
    return false
  }
  return true
})

const formRules = {
  code: [{ required: true, message: '请输入版权编号', trigger: 'blur' }],
  name: [{ required: true, message: '请输入版权名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择版权类型', trigger: 'change' }],
  contentType: [{ required: true, message: '请选择内容类型', trigger: 'change' }],
  supplierName: [{ required: true, message: '请输入供应方名称', trigger: 'blur' }],
  startDate: [{ required: true, message: '请选择授权开始日期', trigger: 'change' }],
  endDate: [{ required: true, message: '请选择授权结束日期', trigger: 'change' }],
}

const resetForm = () => {
  Object.assign(formData, {
    code: '',
    name: '',
    type: 1,
    contentType: 1,
    supplierName: '',
    supplierContact: '',
    supplierPhone: '',
    contractNo: '',
    startDate: '',
    endDate: '',
    territories: '',
    licenseScope: [],
    licenseFee: 0,
    paymentStatus: 0,
    ownershipStatus: 1,
    description: '',
    remark: '',
    copyrightCertificate: '',
    authorizationAgreement: '',
    ownershipProof: '',
    contentIds: [],
    qualificationFiles: [],
  })
  certificateFile.fileList = []
  agreementFile.fileList = []
  ownershipFile.fileList = []
  certificateFile.isVerified = false
  agreementFile.isVerified = false
  ownershipFile.isVerified = false
  certificateFile.verifyStatus = ''
  agreementFile.verifyStatus = ''
  ownershipFile.verifyStatus = ''
  certificateFile.verifyMessage = ''
  agreementFile.verifyMessage = ''
  ownershipFile.verifyMessage = ''
  selectedContentList.value = []
  verifyResult.value = null
  conflictCheckResult.value = null
  formRef.value?.resetFields()
}

const handleSubmit = async () => {
  await formRef.value?.validate()
  if (!canSubmit.value) {
    ElMessage.warning('请先完成所有必填项并通过合规校验')
    return
  }
  submitting.value = true
  try {
    await createCopyrightApi({
      ...formData,
      status: 1,
    })
    ElMessage.success('版权录入成功，已自动同步至内容审核与风控模块')
    resetForm()
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  searchAvailableContent()
})
</script>

<template>
  <div class="copyright-entry-page">
    <el-card shadow="never" class="form-card">
      <template #header>
        <div class="card-header">
          <div class="header-title">
            <el-icon :size="20" color="#409EFF"><Document /></el-icon>
            <span>版权资源录入</span>
          </div>
          <el-tag size="small" type="info">需上传版权证书、授权协议、权属证明三类资质文件</el-tag>
        </div>
      </template>

      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
        label-position="right"
        class="entry-form"
      >
        <el-divider content-position="left">
          <span class="divider-title"><el-icon><Edit /></el-icon> 基础信息</span>
        </el-divider>

        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="版权编号" prop="code">
              <el-input
                v-model="formData.code"
                placeholder="请输入版权编号，系统自动校验重复"
                maxlength="50"
                clearable
              >
                <template #append>
                  <el-icon
                    v-if="!conflictCheckLoading && formData.code && !conflictCheckResult?.conflicts?.some((c: any) => c.type === 'duplicate_code')"
                    color="#67C23A"
                  ><Check /></el-icon>
                  <el-icon
                    v-else-if="conflictCheckResult?.conflicts?.some((c: any) => c.type === 'duplicate_code')"
                    color="#F56C6C"
                  ><Close /></el-icon>
                  <el-icon v-else-if="conflictCheckLoading" class="is-loading"><Refresh /></el-icon>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="版权名称" prop="name">
              <el-input v-model="formData.name" placeholder="请输入版权名称" maxlength="255" clearable />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="版权类型" prop="type">
              <el-select v-model="formData.type" placeholder="请选择" style="width: 100%">
                <el-option
                  v-for="item in copyrightTypeOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="内容类型" prop="contentType">
              <el-select
                v-model="formData.contentType"
                placeholder="请选择内容类型，联动匹配有效期/授权范围"
                style="width: 100%"
              >
                <el-option
                  v-for="item in contentTypeOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="权属状态">
              <el-select v-model="formData.ownershipStatus" placeholder="请选择" style="width: 100%">
                <el-option label="权属清晰" :value="1" />
                <el-option label="权属争议中" :value="2" />
                <el-option label="权属待核实" :value="3" />
                <el-option label="已转让" :value="4" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="供应方名称" prop="supplierName">
              <el-input v-model="formData.supplierName" placeholder="请输入供应方/版权方名称" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="联系人">
              <el-input v-model="formData.supplierContact" placeholder="联系人姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="联系电话">
              <el-input v-model="formData.supplierPhone" placeholder="联系电话" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="合同编号">
              <el-input v-model="formData.contractNo" placeholder="请输入合同编号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="授权地区">
              <el-input v-model="formData.territories" placeholder="如：中国大陆、港澳台、全球" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="授权开始" prop="startDate">
              <el-date-picker
                v-model="formData.startDate"
                type="date"
                placeholder="选择开始日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="授权结束" prop="endDate">
              <el-date-picker
                v-model="formData.endDate"
                type="date"
                placeholder="选择结束日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="授权费用">
              <el-input-number v-model="formData.licenseFee" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="授权范围">
              <el-checkbox-group v-model="formData.licenseScope">
                <el-checkbox
                  v-for="scope in licenseScopeOptions"
                  :key="scope"
                  :value="scope"
                  :label="scope"
                />
              </el-checkbox-group>
              <div v-if="licenseScopeOptions.length === 0" class="empty-tip">请先选择内容类型，系统将联动匹配对应授权范围</div>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="付款状态">
              <el-select v-model="formData.paymentStatus" style="width: 100%">
                <el-option label="未支付" :value="0" />
                <el-option label="部分支付" :value="1" />
                <el-option label="已支付" :value="2" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">
          <span class="divider-title"><el-icon><File /></el-icon> 资质文件上传（前置必传）</span>
        </el-divider>

        <el-row :gutter="24">
          <el-col :span="8">
            <div class="upload-section">
              <div class="upload-section-title">
                <span class="required-mark">*</span>版权证书
                <el-tag v-if="certificateFile.verifyStatus === 'success'" size="small" type="success" effect="light">
                  <el-icon><Check /></el-icon> 校验通过
                </el-tag>
                <el-tag v-else-if="certificateFile.verifyStatus === 'error'" size="small" type="danger" effect="light">
                  <el-icon><Close /></el-icon> 校验失败
                </el-tag>
              </div>
              <div class="upload-wrapper">
                <el-upload
                  v-model:file-list="certificateFile.fileList"
                  action="/api/v1/upload"
                  :headers="{ Authorization: `Bearer ${getAuthToken()}` }"
                  :limit="1"
                  accept=".pdf,.jpg,.jpeg,.png"
                  :before-upload="certificateHandlers.beforeUpload"
                  :on-progress="certificateHandlers.onProgress"
                  :on-success="certificateHandlers.onSuccess"
                  :on-error="certificateHandlers.onError"
                  :on-remove="certificateHandlers.onRemove"
                  :auto-upload="true"
                >
                  <el-button type="primary" :icon="UploadFilled" :loading="certificateFile.isUploading">
                    上传版权证书
                  </el-button>
                  <template #tip>
                    <div class="upload-tip">支持 PDF/JPG/PNG，最大 20MB</div>
                  </template>
                </el-upload>
                <div v-if="certificateFile.isUploading" class="progress-wrapper">
                  <el-progress :percentage="certificateFile.uploadProgress" :stroke-width="6" status="success" />
                  <div class="progress-text">上传中 {{ certificateFile.uploadProgress }}%</div>
                </div>
                <div v-if="certificateFile.verifyMessage" class="verify-message" :class="certificateFile.verifyStatus">
                  {{ certificateFile.verifyMessage }}
                </div>
              </div>
            </div>
          </el-col>

          <el-col :span="8">
            <div class="upload-section">
              <div class="upload-section-title">
                <span class="required-mark">*</span>授权协议
                <el-tag v-if="agreementFile.verifyStatus === 'success'" size="small" type="success" effect="light">
                  <el-icon><Check /></el-icon> 校验通过
                </el-tag>
                <el-tag v-else-if="agreementFile.verifyStatus === 'error'" size="small" type="danger" effect="light">
                  <el-icon><Close /></el-icon> 校验失败
                </el-tag>
              </div>
              <div class="upload-wrapper">
                <el-upload
                  v-model:file-list="agreementFile.fileList"
                  action="/api/v1/upload"
                  :headers="{ Authorization: `Bearer ${getAuthToken()}` }"
                  :limit="1"
                  accept=".pdf,.jpg,.jpeg,.png"
                  :before-upload="agreementHandlers.beforeUpload"
                  :on-progress="agreementHandlers.onProgress"
                  :on-success="agreementHandlers.onSuccess"
                  :on-error="agreementHandlers.onError"
                  :on-remove="agreementHandlers.onRemove"
                  :auto-upload="true"
                >
                  <el-button type="primary" :icon="UploadFilled" :loading="agreementFile.isUploading">
                    上传授权协议
                  </el-button>
                  <template #tip>
                    <div class="upload-tip">支持 PDF/JPG/PNG，最大 20MB</div>
                  </template>
                </el-upload>
                <div v-if="agreementFile.isUploading" class="progress-wrapper">
                  <el-progress :percentage="agreementFile.uploadProgress" :stroke-width="6" status="success" />
                  <div class="progress-text">上传中 {{ agreementFile.uploadProgress }}%</div>
                </div>
                <div v-if="agreementFile.verifyMessage" class="verify-message" :class="agreementFile.verifyStatus">
                  {{ agreementFile.verifyMessage }}
                </div>
              </div>
            </div>
          </el-col>

          <el-col :span="8">
            <div class="upload-section">
              <div class="upload-section-title">
                <span class="required-mark">*</span>权属证明
                <el-tag v-if="ownershipFile.verifyStatus === 'success'" size="small" type="success" effect="light">
                  <el-icon><Check /></el-icon> 校验通过
                </el-tag>
                <el-tag v-else-if="ownershipFile.verifyStatus === 'error'" size="small" type="danger" effect="light">
                  <el-icon><Close /></el-icon> 校验失败
                </el-tag>
              </div>
              <div class="upload-wrapper">
                <el-upload
                  v-model:file-list="ownershipFile.fileList"
                  action="/api/v1/upload"
                  :headers="{ Authorization: `Bearer ${getAuthToken()}` }"
                  :limit="1"
                  accept=".pdf,.jpg,.jpeg,.png"
                  :before-upload="ownershipHandlers.beforeUpload"
                  :on-progress="ownershipHandlers.onProgress"
                  :on-success="ownershipHandlers.onSuccess"
                  :on-error="ownershipHandlers.onError"
                  :on-remove="ownershipHandlers.onRemove"
                  :auto-upload="true"
                >
                  <el-button type="primary" :icon="UploadFilled" :loading="ownershipFile.isUploading">
                    上传权属证明
                  </el-button>
                  <template #tip>
                    <div class="upload-tip">支持 PDF/JPG/PNG，最大 20MB</div>
                  </template>
                </el-upload>
                <div v-if="ownershipFile.isUploading" class="progress-wrapper">
                  <el-progress :percentage="ownershipFile.uploadProgress" :stroke-width="6" status="success" />
                  <div class="progress-text">上传中 {{ ownershipFile.uploadProgress }}%</div>
                </div>
                <div v-if="ownershipFile.verifyMessage" class="verify-message" :class="ownershipFile.verifyStatus">
                  {{ ownershipFile.verifyMessage }}
                </div>
              </div>
            </div>
          </el-col>
        </el-row>

        <el-alert
          v-if="verifyResult && verifyResult.issues.length > 0"
          :title="verifyResult.isValid ? '校验提示' : '校验未通过，请修复以下问题'"
          :type="verifyResult.isValid ? 'warning' : 'error'"
          :closable="false"
          show-icon
          class="verify-alert"
        >
          <ul class="issue-list">
            <li v-for="(issue, idx) in verifyResult.issues" :key="idx" :class="issue.level">
              <span class="level-label">[{{ issue.level === 'error' ? '错误' : issue.level === 'warning' ? '警告' : '提示' }}]</span>
              {{ issue.message }}
            </li>
          </ul>
        </el-alert>

        <el-divider content-position="left">
          <span class="divider-title"><el-icon><Plus /></el-icon> 绑定内容资源（可选）</span>
        </el-divider>

        <div class="content-bind-section">
          <div class="search-bar">
            <el-input
              v-model="searchContentKeyword"
              placeholder="搜索未绑定版权的内容（标题/ID）"
              clearable
              style="width: 320px"
              @keyup.enter="searchAvailableContent"
            >
              <template #append>
                <el-button :icon="Search" @click="searchAvailableContent" :loading="contentSearchLoading">搜索</el-button>
              </template>
            </el-input>
          </div>

          <div class="selected-contents" v-if="selectedContentList.length > 0">
            <div class="section-label">已选内容 ({{ selectedContentList.length }})：</div>
            <div class="content-tags">
              <el-tag
                v-for="content in selectedContentList"
                :key="content.id"
                closable
                type="success"
                effect="light"
                style="margin: 4px"
                @close="removeSelectedContent(content)"
              >
                [{{ getEnumLabel(CONTENT_CATEGORY, content.category) }}] {{ content.title }}
              </el-tag>
            </div>
          </div>

          <el-table
            :data="availableContentList"
            v-loading="contentSearchLoading"
            size="small"
            max-height="320"
            border
            class="content-table"
            @selection-change="() => {}"
          >
            <el-table-column width="60" align="center">
              <template #default="{ row }">
                <el-checkbox
                  :model-value="formData.contentIds?.includes(row.id)"
                  @change="toggleContentSelection(row)"
                />
              </template>
            </el-table-column>
            <el-table-column prop="id" label="ID" width="80" align="center" />
            <el-table-column prop="title" label="内容标题" min-width="220" show-overflow-tooltip />
            <el-table-column label="分类" width="100" align="center">
              <template #default="{ row }">
                {{ getEnumLabel(CONTENT_CATEGORY, row.category) }}
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.auditStatus === 2" type="success" size="small">已审核</el-tag>
                <el-tag v-else type="warning" size="small">待审核</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <el-divider content-position="left">
          <span class="divider-title"><el-icon><Document /></el-icon> 补充信息</span>
        </el-divider>

        <el-row :gutter="24">
          <el-col :span="24">
            <el-form-item label="版权说明">
              <el-input
                v-model="formData.description"
                type="textarea"
                :rows="3"
                placeholder="请输入版权说明"
                maxlength="2000"
                show-word-limit
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input
                v-model="formData.remark"
                placeholder="备注信息"
                maxlength="500"
                show-word-limit
              />
            </el-form-item>
          </el-col>
        </el-row>

        <div class="form-actions">
          <el-button @click="resetForm" :icon="Refresh">重置</el-button>
          <el-button
            type="primary"
            :icon="Check"
            :loading="submitting"
            :disabled="!canSubmit"
            @click="handleSubmit"
          >
            提交录入
          </el-button>
          <div v-if="!canSubmit" class="submit-hint">
            <span v-if="!formData.code || !formData.name || !formData.supplierName || !formData.startDate || !formData.endDate">
              请填写所有必填项
            </span>
            <span v-else-if="!formData.copyrightCertificate || !formData.authorizationAgreement || !formData.ownershipProof">
              请上传全部三类资质文件
            </span>
            <span v-else-if="verifyResult?.issues.some((i) => i.level === 'error')">
              存在校验错误，请修复后提交
            </span>
            <span v-else-if="conflictCheckResult?.hasConflict">
              存在版权冲突，请处理后提交
            </span>
            <span v-else-if="certificateFile.isUploading || agreementFile.isUploading || ownershipFile.isUploading">
              文件上传中，请稍候
            </span>
          </div>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<style lang="scss" scoped>
@import '@/styles/variables.scss';

.copyright-entry-page {
  padding: 16px;

  .form-card {
    border-radius: 8px;

    :deep(.el-card__header) {
      padding: 16px 20px;
      border-bottom: 1px solid $border-color-lighter;
    }
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .header-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: $font-lg;
      font-weight: 600;
      color: $text-primary;
    }
  }

  .entry-form {
    padding: 8px 0;
  }

  .divider-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: $font-base;
    font-weight: 600;
    color: $text-primary;
  }

  .required-mark {
    color: #F56C6C;
    margin-right: 4px;
  }

  .empty-tip {
    color: $text-secondary;
    font-size: $font-xs;
    margin-top: 4px;
  }

  .upload-section {
    background: #FAFBFC;
    border-radius: 8px;
    padding: 16px;
    border: 1px solid $border-color-lighter;
    transition: all 0.3s;

    &:hover {
      border-color: $primary-color;
      box-shadow: 0 2px 8px rgba(64, 158, 255, 0.08);
    }
  }

  .upload-section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    font-weight: 500;
    color: $text-primary;
  }

  .upload-wrapper {
    .upload-tip {
      margin-top: 8px;
      color: $text-secondary;
      font-size: $font-xs;
    }
  }

  .progress-wrapper {
    margin-top: 12px;

    .progress-text {
      margin-top: 4px;
      font-size: $font-xs;
      color: $text-secondary;
      text-align: center;
    }
  }

  .verify-message {
    margin-top: 8px;
    padding: 6px 10px;
    border-radius: 4px;
    font-size: $font-xs;

    &.success {
      background: rgba(103, 194, 58, 0.1);
      color: $success-color;
    }

    &.error {
      background: rgba(245, 108, 108, 0.1);
      color: $danger-color;
    }

    &.warning {
      background: rgba(230, 162, 60, 0.1);
      color: $warning-color;
    }
  }

  .verify-alert {
    margin: 16px 0;

    .issue-list {
      margin: 8px 0 0 0;
      padding-left: 20px;

      li {
        line-height: 1.8;
        font-size: $font-xs;

        &.error {
          color: $danger-color;
          .level-label { color: $danger-color; }
        }
        &.warning {
          color: $warning-color;
          .level-label { color: $warning-color; }
        }
        &.info {
          color: $primary-color;
          .level-label { color: $primary-color; }
        }
      }
    }
  }

  .content-bind-section {
    padding: 8px 0;

    .search-bar {
      margin-bottom: 16px;
    }

    .section-label {
      font-size: $font-sm;
      color: $text-secondary;
      margin-bottom: 8px;
    }

    .content-tags {
      margin-bottom: 16px;
    }

    .content-table {
      margin-top: 12px;
    }
  }

  .form-actions {
    display: flex;
    align-items: center;
    gap: 12px;
    padding-top: 24px;
    border-top: 1px solid $border-color-lighter;
    margin-top: 8px;

    .submit-hint {
      margin-left: 12px;
      padding: 6px 12px;
      background: rgba(230, 162, 60, 0.1);
      color: $warning-color;
      border-radius: 4px;
      font-size: $font-xs;
    }
  }
}
</style>
