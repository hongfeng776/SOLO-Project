<template>
  <div class="qualification-upload">
    <div class="upload-steps">
      <div
        v-for="(step, index) in uploadSteps"
        :key="step.key"
        class="step-item"
        :class="{
          active: currentStep === index,
          completed: step.status === 'completed',
          error: step.status === 'error'
        }"
      >
        <div class="step-number">{{ index + 1 }}</div>
        <div class="step-info">
          <div class="step-title">{{ step.title }}</div>
          <div class="step-desc">{{ step.desc }}</div>
        </div>
        <el-icon v-if="step.status === 'completed'" class="check-icon"><Check /></el-icon>
        <el-icon v-else-if="step.status === 'error'" class="error-icon"><Close /></el-icon>
      </div>
    </div>

    <div class="upload-progress">
      <div class="progress-info">
        <span class="progress-label">资料上传进度</span>
        <span class="progress-value">{{ uploadProgress }}%</span>
      </div>
      <el-progress
        :percentage="uploadProgress"
        :status="uploadProgress === 100 ? 'success' : uploadProgress > 0 ? '' : ''"
        :stroke-width="8"
        :show-text="false"
      />
    </div>

    <div class="upload-content">
      <div v-if="currentStep === 0" class="step-content">
        <h4>基本身份信息</h4>
        <el-form :model="formData" label-width="100px">
          <el-form-item label="身份证号" :error="errors.idCard">
            <el-input
              v-model="formData.idCard"
              placeholder="请输入身份证号"
              @blur="validateIdCard"
            />
          </el-form-item>
          <el-form-item label="身份证照片" :error="errors.idCardImg">
            <el-upload
              :action="uploadUrl"
              :show-file-list="true"
              :limit="1"
              :on-success="(res, file) => handleUploadSuccess('idCardImg', res, file)"
              :on-progress="(e, file) => handleUploadProgress(e, file, 'idCardImg')"
              accept="image/*"
            >
              <el-button type="primary">
                <el-icon><Upload /></el-icon>
                上传身份证照片
              </el-button>
              <template #tip>
                <div class="el-upload__tip">请上传身份证正反面照片，支持jpg、png格式</div>
              </template>
            </el-upload>
            <div v-if="formData.idCardImg" class="preview-img">
              <el-image :src="formData.idCardImg" style="width: 120px; height: 80px" fit="cover" />
            </div>
          </el-form-item>
          <el-form-item label="有效期" :error="errors.idCardValidDate">
            <el-date-picker
              v-model="formData.idCardValidDate"
              type="date"
              placeholder="请选择身份证有效期"
              style="width: 100%"
            />
          </el-form-item>
        </el-form>
      </div>

      <div v-else-if="currentStep === 1" class="step-content">
        <h4>驾驶资质信息</h4>
        <el-form :model="formData" label-width="100px">
          <el-form-item label="驾驶证号" :error="errors.driverLicenseNo">
            <el-input
              v-model="formData.driverLicenseNo"
              placeholder="请输入驾驶证号"
              @blur="validateDriverLicense"
            />
          </el-form-item>
          <el-form-item label="驾驶证类型">
            <el-select v-model="formData.driverLicenseType" placeholder="请选择驾驶证类型" style="width: 100%">
              <el-option label="C1" value="C1" />
              <el-option label="C2" value="C2" />
              <el-option label="B1" value="B1" />
              <el-option label="B2" value="B2" />
              <el-option label="A1" value="A1" />
              <el-option label="A2" value="A2" />
            </el-select>
          </el-form-item>
          <el-form-item label="驾驶证照片" :error="errors.driverLicenseImg">
            <el-upload
              :action="uploadUrl"
              :show-file-list="true"
              :limit="1"
              :on-success="(res, file) => handleUploadSuccess('driverLicenseImg', res, file)"
              :on-progress="(e, file) => handleUploadProgress(e, file, 'driverLicenseImg')"
              accept="image/*"
            >
              <el-button type="primary">
                <el-icon><Upload /></el-icon>
                上传驾驶证照片
              </el-button>
            </el-upload>
            <div v-if="formData.driverLicenseImg" class="preview-img">
              <el-image :src="formData.driverLicenseImg" style="width: 120px; height: 80px" fit="cover" />
            </div>
          </el-form-item>
          <el-form-item label="有效期" :error="errors.driverLicenseValidDate">
            <el-date-picker
              v-model="formData.driverLicenseValidDate"
              type="date"
              placeholder="请选择驾驶证有效期"
              style="width: 100%"
            />
          </el-form-item>
        </el-form>
      </div>

      <div v-else-if="currentStep === 2" class="step-content">
        <h4>车辆资质信息</h4>
        <el-form :model="formData" label-width="100px">
          <el-form-item label="行驶证号" :error="errors.vehicleLicenseNo">
            <el-input
              v-model="formData.vehicleLicenseNo"
              placeholder="请输入行驶证号"
              @blur="validateVehicleLicense"
            />
          </el-form-item>
          <el-form-item label="行驶证照片" :error="errors.vehicleLicenseImg">
            <el-upload
              :action="uploadUrl"
              :show-file-list="true"
              :limit="1"
              :on-success="(res, file) => handleUploadSuccess('vehicleLicenseImg', res, file)"
              :on-progress="(e, file) => handleUploadProgress(e, file, 'vehicleLicenseImg')"
              accept="image/*"
            >
              <el-button type="primary">
                <el-icon><Upload /></el-icon>
                上传行驶证照片
              </el-button>
            </el-upload>
            <div v-if="formData.vehicleLicenseImg" class="preview-img">
              <el-image :src="formData.vehicleLicenseImg" style="width: 120px; height: 80px" fit="cover" />
            </div>
          </el-form-item>
          <el-form-item label="有效期" :error="errors.vehicleLicenseValidDate">
            <el-date-picker
              v-model="formData.vehicleLicenseValidDate"
              type="date"
              placeholder="请选择行驶证有效期"
              style="width: 100%"
            />
          </el-form-item>
        </el-form>
      </div>

      <div v-else-if="currentStep === 3" class="step-content">
        <h4>人脸核验</h4>
        <div class="face-verify-section">
          <div class="face-capture">
            <div v-if="!formData.faceImg" class="capture-placeholder">
              <el-icon class="camera-icon"><Camera /></el-icon>
              <p>点击拍摄人脸照片</p>
            </div>
            <div v-else class="face-preview">
              <el-image :src="formData.faceImg" style="width: 200px; height: 200px" fit="cover" class="face-img" />
            </div>
            <el-upload
              :action="uploadUrl"
              :show-file-list="false"
              :limit="1"
              :on-success="(res, file) => handleUploadSuccess('faceImg', res, file)"
              :on-progress="(e, file) => handleUploadProgress(e, file, 'faceImg')"
              accept="image/*"
              class="upload-btn"
            >
              <el-button type="primary">
                <el-icon><Camera /></el-icon>
                {{ formData.faceImg ? '重新拍摄' : '拍摄人脸照片' }}
              </el-button>
            </el-upload>
          </div>
          <div v-if="formData.faceImg" class="verify-result">
            <el-tag v-if="formData.faceVerifyResult === 1" type="success" size="large">
              <el-icon><Check /></el-icon>
              人脸核验通过，相似度：{{ formData.faceVerifyScore }}%
            </el-tag>
            <el-tag v-else-if="formData.faceVerifyResult === 2" type="danger" size="large">
              <el-icon><Close /></el-icon>
              人脸核验不通过
            </el-tag>
            <el-tag v-else type="warning" size="large">
              <el-icon><Loading /></el-icon>
              核验中...
            </el-tag>
          </div>
        </div>
      </div>

      <div v-else-if="currentStep === 4" class="step-content">
        <h4>无违法犯罪记录证明</h4>
        <el-form :model="formData" label-width="100px">
          <el-form-item label="证明文件" :error="errors.criminalRecordImg">
            <el-upload
              :action="uploadUrl"
              :show-file-list="true"
              :limit="1"
              :on-success="(res, file) => handleUploadSuccess('criminalRecordImg', res, file)"
              :on-progress="(e, file) => handleUploadProgress(e, file, 'criminalRecordImg')"
              accept="image/*,.pdf"
            >
              <el-button type="primary">
                <el-icon><Upload /></el-icon>
                上传无违法犯罪记录证明
              </el-button>
              <template #tip>
                <div class="el-upload__tip">请上传公安机关出具的无违法犯罪记录证明</div>
              </template>
            </el-upload>
            <div v-if="formData.criminalRecordImg" class="preview-img">
              <el-image :src="formData.criminalRecordImg" style="width: 120px; height: 80px" fit="cover" />
            </div>
          </el-form-item>
          <el-form-item label="有效期" :error="errors.criminalRecordValidDate">
            <el-date-picker
              v-model="formData.criminalRecordValidDate"
              type="date"
              placeholder="请选择证明有效期"
              style="width: 100%"
            />
          </el-form-item>
        </el-form>
      </div>

      <div v-else-if="currentStep === 5" class="step-content">
        <h4>基础信息确认</h4>
        <el-form :model="formData" label-width="100px">
          <el-form-item label="入驻城市" required>
            <el-select v-model="formData.city" placeholder="请选择入驻城市" style="width: 100%">
              <el-option label="北京" value="beijing" />
              <el-option label="上海" value="shanghai" />
              <el-option label="广州" value="guangzhou" />
              <el-option label="深圳" value="shenzhen" />
              <el-option label="其他城市" value="default" />
            </el-select>
          </el-form-item>
          <el-form-item label="车型类别" required>
            <el-select v-model="formData.vehicleType" placeholder="请选择车型类别" style="width: 100%">
              <el-option label="豪华型" value="luxury" />
              <el-option label="舒适型" value="comfort" />
              <el-option label="经济型" value="economy" />
              <el-option label="标准型" value="default" />
            </el-select>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <div class="abnormal-items" v-if="abnormalItems.length > 0">
      <h4 class="abnormal-title">
        <el-icon><Warning /></el-icon>
        异常/缺失资料项 ({{ abnormalItems.length }})
      </h4>
      <div class="abnormal-list">
        <div
          v-for="item in abnormalItems"
          :key="item.field"
          class="abnormal-item"
          :class="'severity-' + item.severity"
        >
          <el-icon class="abnormal-icon">
            <Warning v-if="item.severity === 'high'" />
            <InfoFilled v-else />
          </el-icon>
          <div class="abnormal-info">
            <div class="abnormal-name">{{ item.name }}</div>
            <div class="abnormal-message">{{ item.message }}</div>
          </div>
          <el-button type="primary" size="small" link @click="jumpToStep(item.step)">
            去补全
          </el-button>
        </div>
      </div>
    </div>

    <div class="step-actions">
      <el-button v-if="currentStep > 0" @click="prevStep">上一步</el-button>
      <el-button v-if="currentStep < uploadSteps.length - 1" type="primary" @click="nextStep">
        下一步
      </el-button>
      <el-button
        v-if="currentStep === uploadSteps.length - 1"
        type="success"
        :loading="submitting"
        @click="handleSubmit"
      >
        提交审核
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Check, Close, Upload, Camera, Loading, Warning, InfoFilled } from '@element-plus/icons-vue'
import { updateUploadProgressApi, createDriverApi } from '@/api/driver'
import type { Driver } from '@/types/driver'

interface Props {
  driverId?: number
  initialData?: Partial<Driver>
}

const props = withDefaults(defineProps<Props>(), {})

const emit = defineEmits(['success', 'cancel'])

const uploadUrl = '/api/upload'
const currentStep = ref(0)
const uploadProgress = ref(0)
const submitting = ref(false)

const uploadSteps = ref([
  { key: 'idCard', title: '身份信息', desc: '上传身份证', status: 'pending' },
  { key: 'driverLicense', title: '驾驶资质', desc: '上传驾驶证', status: 'pending' },
  { key: 'vehicleLicense', title: '车辆资质', desc: '上传行驶证', status: 'pending' },
  { key: 'faceVerify', title: '人脸核验', desc: '完成人脸比对', status: 'pending' },
  { key: 'criminalRecord', title: '无犯罪记录', desc: '上传证明', status: 'pending' },
  { key: 'confirm', title: '确认信息', desc: '提交审核', status: 'pending' }
])

const formData = reactive<Partial<Driver>>({
  name: '',
  phone: '',
  idCard: '',
  idCardImg: '',
  idCardValidDate: '',
  driverLicenseNo: '',
  driverLicenseType: '',
  driverLicenseImg: '',
  driverLicenseValidDate: '',
  vehicleLicenseNo: '',
  vehicleLicenseImg: '',
  vehicleLicenseValidDate: '',
  faceImg: '',
  faceVerifyResult: 0,
  faceVerifyScore: 0,
  criminalRecordImg: '',
  criminalRecordValidDate: '',
  city: '',
  vehicleType: ''
})

const errors = reactive<Record<string, string>>({})

const abnormalItems = computed(() => {
  const items: Array<{ field: string; name: string; message: string; severity: 'high' | 'medium'; step: number }> = []

  if (!formData.idCard) {
    items.push({ field: 'idCard', name: '身份证号', message: '请输入身份证号', severity: 'high', step: 0 })
  } else if (!/^\d{17}[\dXx]$/.test(formData.idCard)) {
    items.push({ field: 'idCard', name: '身份证号', message: '身份证号格式不正确', severity: 'high', step: 0 })
  }
  if (!formData.idCardImg) {
    items.push({ field: 'idCardImg', name: '身份证照片', message: '请上传身份证照片', severity: 'high', step: 0 })
  }
  if (!formData.idCardValidDate) {
    items.push({ field: 'idCardValidDate', name: '身份证有效期', message: '请选择身份证有效期', severity: 'high', step: 0 })
  } else if (new Date(formData.idCardValidDate) < new Date()) {
    items.push({ field: 'idCardValidDate', name: '身份证有效期', message: '身份证已过期', severity: 'high', step: 0 })
  }

  if (!formData.driverLicenseNo) {
    items.push({ field: 'driverLicenseNo', name: '驾驶证号', message: '请输入驾驶证号', severity: 'high', step: 1 })
  }
  if (!formData.driverLicenseImg) {
    items.push({ field: 'driverLicenseImg', name: '驾驶证照片', message: '请上传驾驶证照片', severity: 'high', step: 1 })
  }
  if (!formData.driverLicenseValidDate) {
    items.push({ field: 'driverLicenseValidDate', name: '驾驶证有效期', message: '请选择驾驶证有效期', severity: 'high', step: 1 })
  } else if (new Date(formData.driverLicenseValidDate) < new Date()) {
    items.push({ field: 'driverLicenseValidDate', name: '驾驶证有效期', message: '驾驶证已过期', severity: 'high', step: 1 })
  }

  if (!formData.vehicleLicenseNo) {
    items.push({ field: 'vehicleLicenseNo', name: '行驶证号', message: '请输入行驶证号', severity: 'high', step: 2 })
  }
  if (!formData.vehicleLicenseImg) {
    items.push({ field: 'vehicleLicenseImg', name: '行驶证照片', message: '请上传行驶证照片', severity: 'high', step: 2 })
  }
  if (!formData.vehicleLicenseValidDate) {
    items.push({ field: 'vehicleLicenseValidDate', name: '行驶证有效期', message: '请选择行驶证有效期', severity: 'high', step: 2 })
  } else if (new Date(formData.vehicleLicenseValidDate) < new Date()) {
    items.push({ field: 'vehicleLicenseValidDate', name: '行驶证有效期', message: '行驶证已过期', severity: 'high', step: 2 })
  }

  if (!formData.faceImg) {
    items.push({ field: 'faceImg', name: '人脸照片', message: '请上传人脸照片', severity: 'high', step: 3 })
  } else if (formData.faceVerifyResult === 2) {
    items.push({ field: 'faceVerify', name: '人脸核验', message: '人脸核验不通过', severity: 'high', step: 3 })
  } else if (formData.faceVerifyResult === 0) {
    items.push({ field: 'faceVerify', name: '人脸核验', message: '人脸核验中，请稍候', severity: 'medium', step: 3 })
  }

  if (!formData.criminalRecordImg) {
    items.push({ field: 'criminalRecordImg', name: '无犯罪记录证明', message: '请上传无违法犯罪记录证明', severity: 'high', step: 4 })
  }
  if (!formData.criminalRecordValidDate) {
    items.push({ field: 'criminalRecordValidDate', name: '证明有效期', message: '请选择证明有效期', severity: 'high', step: 4 })
  } else if (new Date(formData.criminalRecordValidDate) < new Date()) {
    items.push({ field: 'criminalRecordValidDate', name: '证明有效期', message: '证明已过期', severity: 'high', step: 4 })
  }

  if (!formData.city) {
    items.push({ field: 'city', name: '入驻城市', message: '请选择入驻城市', severity: 'medium', step: 5 })
  }
  if (!formData.vehicleType) {
    items.push({ field: 'vehicleType', name: '车型类别', message: '请选择车型类别', severity: 'medium', step: 5 })
  }

  return items
})

watch(() => formData, () => {
  const totalSteps = uploadSteps.value.length
  const completedSteps = uploadSteps.value.filter(s => s.status === 'completed').length
  const stepProgress = Math.round((completedSteps / totalSteps) * 100)
  uploadProgress.value = Math.max(stepProgress, uploadProgress.value)
}, { deep: true })

const validateIdCard = () => {
  errors.idCard = ''
  if (!formData.idCard) {
    errors.idCard = '请输入身份证号'
  } else if (!/^\d{17}[\dXx]$/.test(formData.idCard)) {
    errors.idCard = '身份证号格式不正确'
  }
}

const validateDriverLicense = () => {
  errors.driverLicenseNo = ''
  if (!formData.driverLicenseNo) {
    errors.driverLicenseNo = '请输入驾驶证号'
  }
}

const validateVehicleLicense = () => {
  errors.vehicleLicenseNo = ''
  if (!formData.vehicleLicenseNo) {
    errors.vehicleLicenseNo = '请输入行驶证号'
  }
}

const handleUploadSuccess = (field: keyof typeof formData, res: any, file: any) => {
  ;(formData as any)[field] = res.data?.url || URL.createObjectURL(file.raw)

  if (field === 'faceImg') {
    formData.faceVerifyResult = 0
    simulateFaceVerify()
  }

  updateProgress()
}

const handleUploadProgress = (event: any, file: any, field: string) => {
  if (event.percent) {
    const baseProgress = currentStep.value * (100 / uploadSteps.value.length)
    const stepProgress = (event.percent / 100) * (100 / uploadSteps.value.length)
    uploadProgress.value = Math.min(99, Math.round(baseProgress + stepProgress))

    if (props.driverId) {
      updateUploadProgressApi(props.driverId, uploadProgress.value)
    }
  }
}

const simulateFaceVerify = () => {
  setTimeout(() => {
    const score = Math.floor(Math.random() * 30) + 70
    formData.faceVerifyScore = score
    formData.faceVerifyResult = score >= 80 ? 1 : 2
    updateProgress()
  }, 2000)
}

const updateProgress = () => {
  const stepFields = [
    ['idCard', 'idCardImg', 'idCardValidDate'],
    ['driverLicenseNo', 'driverLicenseImg', 'driverLicenseValidDate'],
    ['vehicleLicenseNo', 'vehicleLicenseImg', 'vehicleLicenseValidDate'],
    ['faceImg', 'faceVerifyResult'],
    ['criminalRecordImg', 'criminalRecordValidDate'],
    ['city', 'vehicleType']
  ]

  for (let i = 0; i < stepFields.length; i++) {
    const fields = stepFields[i]
    const allCompleted = fields.every(f => {
      const val = (formData as any)[f]
      if (f === 'faceVerifyResult') return val === 1
      return !!val
    })
    const hasError = fields.some(f => errors[f])
    uploadSteps.value[i].status = allCompleted && !hasError ? 'completed' : hasError ? 'error' : 'pending'
  }

  const completedCount = uploadSteps.value.filter(s => s.status === 'completed').length
  uploadProgress.value = Math.round((completedCount / uploadSteps.value.length) * 100)

  if (props.driverId) {
    updateUploadProgressApi(props.driverId, uploadProgress.value)
  }
}

const nextStep = () => {
  if (currentStep.value < uploadSteps.value.length - 1) {
    if (uploadSteps.value[currentStep.value].status === 'error') {
      ElMessage.warning('请先完成当前步骤的资料填写')
      return
    }
    currentStep.value++
  }
}

const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

const jumpToStep = (step: number) => {
  currentStep.value = step
}

const handleSubmit = async () => {
  if (abnormalItems.value.length > 0) {
    ElMessage.warning(`还有 ${abnormalItems.value.length} 项资料异常，请先补全`)
    return
  }

  submitting.value = true
  try {
    formData.uploadProgress = 100
    await createDriverApi(formData)
    uploadProgress.value = 100
    ElMessage.success('资料提交成功，等待审核')
    emit('success')
  } catch (error: any) {
    ElMessage.error(error.message || '提交失败')
  } finally {
    submitting.value = false
  }
}

watch(() => props.initialData, (val) => {
  if (val) {
    Object.assign(formData, val)
    updateProgress()
  }
}, { immediate: true })
</script>

<style lang="scss" scoped>
.qualification-upload {
  padding: 20px;

  .upload-steps {
    display: flex;
    justify-content: space-between;
    margin-bottom: 30px;
    padding: 20px;
    background: #f5f7fa;
    border-radius: 8px;

    .step-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;
      position: relative;

      &:not(:last-child)::after {
        content: '';
        position: absolute;
        top: 20px;
        left: 50%;
        width: 100%;
        height: 2px;
        background: #dcdfe6;
        z-index: 0;
      }

      .step-number {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: #dcdfe6;
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        z-index: 1;
        margin-bottom: 10px;
      }

      .step-info {
        text-align: center;

        .step-title {
          font-size: 14px;
          color: #303133;
          font-weight: 500;
        }

        .step-desc {
          font-size: 12px;
          color: #909399;
          margin-top: 4px;
        }
      }

      .check-icon {
        position: absolute;
        top: 8px;
        color: #67c23a;
        font-size: 24px;
      }

      .error-icon {
        position: absolute;
        top: 8px;
        color: #f56c6c;
        font-size: 24px;
      }

      &.active .step-number {
        background: #409eff;
      }

      &.completed .step-number {
        background: #67c23a;
        color: transparent;
      }

      &.error .step-number {
        background: #f56c6c;
        color: transparent;
      }

      &.completed:not(:last-child)::after,
      &.active:not(:last-child)::after {
        background: #67c23a;
      }
    }
  }

  .upload-progress {
    margin-bottom: 30px;

    .progress-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;

      .progress-label {
        font-size: 14px;
        color: #303133;
      }

      .progress-value {
        font-size: 14px;
        font-weight: bold;
        color: #409eff;
      }
    }
  }

  .step-content {
    padding: 20px;
    background: #fff;
    border-radius: 8px;
    margin-bottom: 20px;

    h4 {
      margin: 0 0 20px 0;
      font-size: 16px;
      color: #303133;
    }

    .preview-img {
      margin-top: 10px;
    }

    .face-verify-section {
      display: flex;
      gap: 40px;
      align-items: flex-start;

      .face-capture {
        text-align: center;

        .capture-placeholder {
          width: 200px;
          height: 200px;
          border: 2px dashed #dcdfe6;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #909399;
          margin-bottom: 15px;

          .camera-icon {
            font-size: 48px;
            margin-bottom: 10px;
          }
        }

        .face-preview {
          margin-bottom: 15px;

          .face-img {
            border-radius: 50%;
          }
        }
      }

      .verify-result {
        margin-top: 20px;
      }
    }
  }

  .abnormal-items {
    background: #fef0f0;
    border: 1px solid #fbc4c4;
    border-radius: 8px;
    padding: 15px;
    margin-bottom: 20px;

    .abnormal-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 15px 0;
      font-size: 14px;
      color: #f56c6c;
    }

    .abnormal-list {
      .abnormal-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        background: #fff;
        border-radius: 6px;
        margin-bottom: 10px;

        &:last-child {
          margin-bottom: 0;
        }

        .abnormal-icon {
          font-size: 20px;
        }

        .abnormal-info {
          flex: 1;

          .abnormal-name {
            font-size: 14px;
            color: #303133;
            font-weight: 500;
          }

          .abnormal-message {
            font-size: 12px;
            color: #909399;
            margin-top: 4px;
          }
        }

        &.severity-high {
          border-left: 3px solid #f56c6c;

          .abnormal-icon {
            color: #f56c6c;
          }
        }

        &.severity-medium {
          border-left: 3px solid #e6a23c;

          .abnormal-icon {
            color: #e6a23c;
          }
        }
      }
    }
  }

  .step-actions {
    display: flex;
    justify-content: center;
    gap: 20px;
  }
}
</style>
