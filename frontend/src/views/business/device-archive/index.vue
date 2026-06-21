<template>
  <div class="ccb-business-device-archive">
    <CcbPageHeader
      title="设备档案管理"
      description="全品类线下终端设备统一档案底座"
      icon="Monitor"
    />

    <CcbSearchForm v-model="searchForm" @search="handleSearch" @reset="handleReset">
      <el-form-item label="档案编号" prop="archive_no">
        <el-input v-model="searchForm.archive_no" placeholder="请输入档案编号" clearable />
      </el-form-item>
      <el-form-item label="SN码" prop="sn_code">
        <el-input v-model="searchForm.sn_code" placeholder="请输入SN码" clearable />
      </el-form-item>
      <el-form-item label="设备类型" prop="device_type">
        <el-select v-model="searchForm.device_type" placeholder="请选择设备类型" clearable>
          <el-option v-for="item in DEVICE_TYPE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
          <el-option v-for="item in DEVICE_STATUS_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="管控等级" prop="control_level">
        <el-select v-model="searchForm.control_level" placeholder="请选择管控等级" clearable>
          <el-option v-for="item in CONTROL_LEVEL_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="采购批次" prop="purchase_batch">
        <el-input v-model="searchForm.purchase_batch" placeholder="请输入采购批次" clearable />
      </el-form-item>
      <el-form-item label="办理时间" prop="timeRange">
        <el-date-picker
          v-model="searchForm.timeRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
        />
      </el-form-item>
    </CcbSearchForm>

    <div class="ccb-table-toolbar">
      <div class="ccb-table-toolbar-left">
        <el-button type="primary" :icon="Plus" @click="openCreate" v-permission="'business:device-archive:create'">
          <span class="ripple-btn">新建设备</span>
        </el-button>
        <el-button type="success" :icon="Files" @click="goBatch" v-permission="'business:device-archive:batch'">批量建档</el-button>
        <el-button type="info" :icon="Search" @click="goTrace" v-permission="'business:device-archive:trace'">设备溯源</el-button>
      </div>
      <div class="ccb-table-toolbar-right">
        <el-text type="info">
          设备总数：<el-text type="primary" size="large">{{ total }}</el-text>
        </el-text>
      </div>
    </div>

    <CcbTable
      v-model:page="pageParams.page"
      v-model:pageSize="pageParams.pageSize"
      :loading="loading"
      :data="tableData"
      :total="total"
      :show-selection="true"
      :show-index="true"
      row-class-name="deposit-row"
      @selection-change="handleSelectionChange"
      @change="handlePageChange"
    >
      <el-table-column prop="archive_no" label="档案编号" width="200" />
      <el-table-column prop="sn_code" label="SN码" width="160" />
      <el-table-column prop="device_type_text" label="设备类型" width="110" />
      <el-table-column prop="device_model" label="设备型号" width="150" />
      <el-table-column prop="manufacturer" label="生产厂家" width="120" />
      <el-table-column label="归属网点" width="120">
        <template #default="{ row }">
          {{ row.org_name_resolved || row.org_name }}
        </template>
      </el-table-column>
      <el-table-column prop="install_location" label="安装位置" width="120" />
      <el-table-column label="管控等级" width="100">
        <template #default="{ row }">
          <el-tag :type="getControlLevelType(row.control_level)" effect="light" size="small">
            {{ row.control_level_text || getControlLevelLabel(row.control_level) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="老旧设备" width="90">
        <template #default="{ row }">
          <el-tag :type="row.is_old_device ? 'danger' : 'success'" effect="light" size="small">
            {{ row.is_old_device ? '是' : '否' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)" effect="light" size="small">
            {{ getStatusLabel(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="creator_name" label="建档人" width="100" />
      <el-table-column prop="createdAt" label="建档时间" width="160" />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleDetail(row)">详情</el-button>
          <el-button
            v-if="row.status === 1"
            type="success" link size="small"
            @click="handleClaim(row)"
            v-permission="'business:device-archive:claim'"
          >领用</el-button>
          <el-button
            v-if="row.status === 2 || row.status === 3"
            type="warning" link size="small"
            @click="handleMaintain(row)"
            v-permission="'business:device-archive:maintain'"
          >维护</el-button>
        </template>
      </el-table-column>
    </CcbTable>

    <el-dialog
      v-model="showCreate"
      title="新建设备档案"
      width="780px"
      class="deposit-dialog"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-alert
        v-if="preCheckResult && !preCheckResult.passed"
        :title="preCheckResult.block_reason || '前置校验未通过'"
        type="error"
        show-icon
        class="mb15"
        :closable="false"
      />
      <el-alert
        v-if="preCheckResult && preCheckResult.warnings && preCheckResult.warnings.length > 0"
        :title="preCheckResult.warnings[0]"
        type="warning"
        show-icon
        class="mb15"
        :closable="false"
      />

      <el-form
        ref="deviceArchiveFormRef"
        :model="deviceArchiveForm"
        :rules="deviceArchiveRules"
        label-width="120px"
        class="ccb-form"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="设备SN码" prop="sn_code">
              <el-input
                v-model="deviceArchiveForm.sn_code"
                placeholder="请输入设备SN码"
                @blur="runPreCheck"
                :class="{ 'shake-error': shakeError }"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="设备类型" prop="device_type">
              <el-select
                v-model="deviceArchiveForm.device_type"
                placeholder="请选择设备类型"
                style="width: 100%"
                @change="runPreCheck"
              >
                <el-option
                  v-for="item in DEVICE_TYPE_OPTIONS"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="设备型号" prop="device_model">
              <el-input
                v-model="deviceArchiveForm.device_model"
                placeholder="请输入设备型号"
                @blur="runPreCheck"
                :class="{ 'shake-error': shakeError }"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="生产厂家" prop="manufacturer">
              <el-input
                v-model="deviceArchiveForm.manufacturer"
                placeholder="请输入生产厂家"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="采购日期" prop="procurement_date">
              <el-date-picker
                v-model="deviceArchiveForm.procurement_date"
                type="date"
                placeholder="请选择采购日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="采购批次" prop="purchase_batch">
              <el-input
                v-model="deviceArchiveForm.purchase_batch"
                placeholder="请输入采购批次"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="归属网点" prop="org_id">
              <el-input
                v-model="deviceArchiveForm.org_id"
                placeholder="请输入归属网点"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="安装位置" prop="install_location">
              <el-input
                v-model="deviceArchiveForm.install_location"
                placeholder="请输入安装位置"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="使用场景" prop="usage_scene">
              <el-select
                v-model="deviceArchiveForm.usage_scene"
                placeholder="请选择使用场景"
                style="width: 100%"
              >
                <el-option
                  v-for="item in USAGE_SCENE_OPTIONS"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="备注">
          <el-input
            v-model="deviceArchiveForm.remark"
            type="textarea"
            :rows="2"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showCreate = false">取消</el-button>
        <el-button
          type="primary"
          :loading="submitting"
          :disabled="!canSubmit"
          @click="handleSubmit"
        >
          <i v-if="submitting" class="el-icon-loading"></i>
          {{ submitting ? '建档中...' : '确认建档' }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showDetail" title="设备详情" width="680px" destroy-on-close>
      <el-descriptions :column="2" border v-if="currentDetail">
        <el-descriptions-item label="档案编号">{{ currentDetail.archive_no }}</el-descriptions-item>
        <el-descriptions-item label="SN码">{{ currentDetail.sn_code }}</el-descriptions-item>
        <el-descriptions-item label="设备类型">{{ currentDetail.device_type_text }}</el-descriptions-item>
        <el-descriptions-item label="设备型号">{{ currentDetail.device_model }}</el-descriptions-item>
        <el-descriptions-item label="生产厂家">{{ currentDetail.manufacturer }}</el-descriptions-item>
        <el-descriptions-item label="归属网点">{{ currentDetail.org_name }}</el-descriptions-item>
        <el-descriptions-item label="安装位置">{{ currentDetail.install_location || '-' }}</el-descriptions-item>
        <el-descriptions-item label="使用场景">{{ currentDetail.usage_scene_text || '-' }}</el-descriptions-item>
        <el-descriptions-item label="管控等级">
          <el-tag :type="getControlLevelType(currentDetail.control_level)" effect="light" size="small">
            {{ currentDetail.control_level_text || getControlLevelLabel(currentDetail.control_level) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="老旧设备">
          <el-tag :type="currentDetail.is_old_device ? 'danger' : 'success'" effect="light" size="small">
            {{ currentDetail.is_old_device ? '是' : '否' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentDetail.status)" effect="light" size="small">
            {{ getStatusLabel(currentDetail.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="采购批次">{{ currentDetail.purchase_batch || '-' }}</el-descriptions-item>
        <el-descriptions-item label="采购日期">{{ currentDetail.procurement_date || '-' }}</el-descriptions-item>
        <el-descriptions-item label="供应商">{{ currentDetail.supplier || '-' }}</el-descriptions-item>
        <el-descriptions-item label="建档人">{{ currentDetail.operator_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="建档时间">{{ currentDetail.createdAt }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentDetail.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Files, Search } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import {
  DEVICE_TYPE_OPTIONS,
  DEVICE_STATUS_OPTIONS,
  CONTROL_LEVEL_OPTIONS,
  USAGE_SCENE_OPTIONS,
  type DeviceArchive,
  type DeviceArchiveQueryParams,
  type DevicePreCheckResult,
  type CreateDeviceArchiveRequest,
  getDeviceArchiveListApi,
  preCheckDeviceApi,
  createDeviceArchiveApi,
  formatThousands
} from '@api/deviceArchive'

const router = useRouter()

const loading = ref(false)
const submitting = ref(false)
const shakeError = ref(false)
const showCreate = ref(false)
const showDetail = ref(false)
const isEditing = ref(false)
const preCheckResult = ref<DevicePreCheckResult | null>(null)
const deviceArchiveFormRef = ref<FormInstance>()
const currentDetail = ref<DeviceArchive | null>(null)

const tableData = ref<DeviceArchive[]>([])
const total = ref(0)
const selection = ref<DeviceArchive[]>([])

const searchForm = reactive<DeviceArchiveQueryParams & { archive_no?: string; timeRange?: string[] }>({
  page: 1,
  pageSize: 10,
  archive_no: '',
  sn_code: '',
  device_type: undefined,
  status: undefined,
  control_level: undefined,
  purchase_batch: '',
  timeRange: undefined
})

const pageParams = reactive({
  page: 1,
  pageSize: 10
})

const deviceArchiveForm = reactive<CreateDeviceArchiveRequest>({
  sn_code: '',
  device_type: 1,
  device_model: '',
  manufacturer: '',
  procurement_date: '',
  purchase_batch: '',
  org_id: '',
  install_location: '',
  usage_scene: '',
  remark: ''
})

const deviceArchiveRules: FormRules = {
  sn_code: [{ required: true, message: '请输入设备SN码', trigger: 'blur' }],
  device_type: [{ required: true, message: '请选择设备类型', trigger: 'change' }],
  device_model: [{ required: true, message: '请输入设备型号', trigger: 'blur' }]
}

const canSubmit = computed(() => {
  return preCheckResult.value?.passed === true && !submitting.value
})

const fetchData = async () => {
  loading.value = true
  try {
    const params: DeviceArchiveQueryParams = {
      ...searchForm,
      page: pageParams.page,
      pageSize: pageParams.pageSize
    }
    if (searchForm.timeRange && searchForm.timeRange.length === 2) {
      params.start_time = searchForm.timeRange[0]
      params.end_time = searchForm.timeRange[1]
    }
    const res = await getDeviceArchiveListApi(params)
    tableData.value = res.data.list
    total.value = res.data.total
  } catch (e) {
    console.error('Failed to fetch device archive list:', e)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pageParams.page = 1
  fetchData()
}

const handleReset = () => {
  searchForm.archive_no = ''
  searchForm.sn_code = ''
  searchForm.device_type = undefined
  searchForm.status = undefined
  searchForm.control_level = undefined
  searchForm.purchase_batch = ''
  searchForm.timeRange = undefined
  pageParams.page = 1
  fetchData()
}

const handlePageChange = () => {
  fetchData()
}

const handleSelectionChange = (val: DeviceArchive[]) => {
  selection.value = val
}

const openCreate = () => {
  isEditing.value = false
  preCheckResult.value = null
  shakeError.value = false
  deviceArchiveForm.sn_code = ''
  deviceArchiveForm.device_type = 1
  deviceArchiveForm.device_model = ''
  deviceArchiveForm.manufacturer = ''
  deviceArchiveForm.procurement_date = ''
  deviceArchiveForm.purchase_batch = ''
  deviceArchiveForm.org_id = ''
  deviceArchiveForm.install_location = ''
  deviceArchiveForm.usage_scene = ''
  deviceArchiveForm.remark = ''
  showCreate.value = true
}

const runPreCheck = async () => {
  if (!deviceArchiveForm.sn_code || !deviceArchiveForm.device_type || !deviceArchiveForm.device_model) {
    preCheckResult.value = null
    return
  }
  try {
    const res = await preCheckDeviceApi({
      sn_code: deviceArchiveForm.sn_code,
      device_type: deviceArchiveForm.device_type,
      device_model: deviceArchiveForm.device_model,
      org_id: deviceArchiveForm.org_id || undefined,
      install_location: deviceArchiveForm.install_location || undefined,
      usage_scene: deviceArchiveForm.usage_scene || undefined,
      purchase_batch: deviceArchiveForm.purchase_batch || undefined,
      procurement_date: deviceArchiveForm.procurement_date || undefined
    })
    preCheckResult.value = res.data
    if (!res.data.passed) {
      triggerShake()
    }
  } catch (e: any) {
    preCheckResult.value = {
      passed: false,
      blocked: true,
      block_reason: e?.message || '校验失败',
      warnings: [],
      sn_unique: false,
      model_compliant: false,
      qualification_complete: false,
      missing_qualifications: [],
      org_matched: false,
      location_matched: false,
      scene_matched: false,
      is_old_device: false,
      control_level: 1,
      control_level_text: '一般管控'
    }
    triggerShake()
  }
}

const triggerShake = () => {
  shakeError.value = true
  setTimeout(() => {
    shakeError.value = false
  }, 500)
}

const handleSubmit = async () => {
  if (!deviceArchiveFormRef.value) return
  const valid = await deviceArchiveFormRef.value.validate().catch(() => false)
  if (!valid) return
  if (!preCheckResult.value?.passed) {
    ElMessage.error('前置校验未通过，无法建档')
    return
  }
  submitting.value = true
  try {
    await createDeviceArchiveApi(deviceArchiveForm)
    ElMessage.success('设备建档成功')
    showCreate.value = false
    fetchData()
  } catch (e) {
    console.error('Failed to create device archive:', e)
  } finally {
    submitting.value = false
  }
}

const handleDetail = (row: DeviceArchive) => {
  currentDetail.value = row
  showDetail.value = true
}

const handleClaim = async (row: DeviceArchive) => {
  try {
    await ElMessageBox.confirm('确认领用该设备？', '确认领用', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })
    ElMessage.success('设备领用成功')
    fetchData()
  } catch (e) {
    console.error('Failed to claim device:', e)
  }
}

const handleMaintain = async (row: DeviceArchive) => {
  try {
    await ElMessageBox.confirm('确认对该设备进行维护？', '确认维护', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })
    ElMessage.success('设备维护登记成功')
    fetchData()
  } catch (e) {
    console.error('Failed to maintain device:', e)
  }
}

const goBatch = () => {
  router.push('/device-archive/batch')
}

const goTrace = () => {
  router.push('/device-archive/trace')
}

const getStatusType = (status: number) => {
  const opt = DEVICE_STATUS_OPTIONS.find(o => o.value === status)
  return opt?.type || ''
}

const getStatusLabel = (status: number) => {
  const opt = DEVICE_STATUS_OPTIONS.find(o => o.value === status)
  return opt?.label || '未知'
}

const getControlLevelType = (level: number) => {
  const opt = CONTROL_LEVEL_OPTIONS.find(o => o.value === level)
  return opt?.type || ''
}

const getControlLevelLabel = (level: number) => {
  const opt = CONTROL_LEVEL_OPTIONS.find(o => o.value === level)
  return opt?.label || '未知'
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.deposit-row:hover {
  transform: scale(1.01);
  transition: transform 0.2s ease;
  cursor: pointer;
}

.amount-positive {
  color: #67c23a;
  font-weight: 600;
}

.shake-error {
  animation: shake 0.4s ease-in-out;
  border-color: #f56c6c !important;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-5px); }
  40%, 80% { transform: translateX(5px); }
}

.limit-info {
  margin-top: 8px;
  line-height: 1.6;
}

.ripple-btn {
  position: relative;
  overflow: hidden;
}

.mb15 {
  margin-bottom: 15px;
}
</style>
