<template>
  <el-dialog
    v-model="visible"
    title="导出服务数据报表"
    width="600px"
    :close-on-click-modal="false"
    @open="handleOpen"
    @close="handleClose"
  >
    <div class="export-dialog">
      <el-form :model="exportForm" label-width="100px">
        <el-form-item label="统计时段">
          <el-radio-group v-model="exportForm.period" size="default">
            <el-radio value="day">今日</el-radio>
            <el-radio value="week">本周</el-radio>
            <el-radio value="month">本月</el-radio>
            <el-radio value="custom">自定义</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="exportForm.period === 'custom'" label="日期范围">
          <el-date-picker
            v-model="exportForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="司机等级">
          <el-checkbox-group v-model="exportForm.driverLevels">
            <el-checkbox :label="1">优质</el-checkbox>
            <el-checkbox :label="2">普通</el-checkbox>
            <el-checkbox :label="3">待整改</el-checkbox>
            <el-checkbox :label="4">劣质</el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-form-item label="服务城市">
          <el-select v-model="exportForm.city" placeholder="全部城市" clearable style="width: 200px">
            <el-option label="北京" value="beijing" />
            <el-option label="上海" value="shanghai" />
            <el-option label="广州" value="guangzhou" />
            <el-option label="深圳" value="shenzhen" />
          </el-select>
        </el-form-item>

        <el-form-item label="车型分类">
          <el-select v-model="exportForm.vehicleType" placeholder="全部车型" clearable style="width: 200px">
            <el-option label="豪华型" value="luxury" />
            <el-option label="舒适型" value="comfort" />
            <el-option label="经济型" value="economy" />
            <el-option label="标准型" value="default" />
          </el-select>
        </el-form-item>

        <el-form-item label="排序规则">
          <el-select v-model="exportForm.sortField" style="width: 150px; margin-right: 10px">
            <el-option
              v-for="opt in sortOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
          <el-radio-group v-model="exportForm.sortOrder">
            <el-radio-button value="DESC">降序</el-radio-button>
            <el-radio-button value="ASC">升序</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="导出字段">
          <div class="field-categories">
            <div
              v-for="category in fieldCategories"
              :key="category.key"
              class="field-category"
            >
              <div class="category-title">
                <el-checkbox
                  :model-value="isCategoryAllSelected(category)"
                  :indeterminate="isCategoryIndeterminate(category)"
                  @change="handleCategoryChange(category, $event)"
                >
                  {{ category.label }}
                </el-checkbox>
                <el-tag
                  v-if="category.permissionRequired && !hasSensitivePermission"
                  size="small"
                  type="warning"
                  effect="light"
                >
                  权限不足
                </el-tag>
              </div>
              <div class="category-fields">
                <el-checkbox
                  v-for="field in category.fields"
                  :key="field"
                  :label="field"
                  :disabled="category.permissionRequired && !hasSensitivePermission"
                  v-model="exportForm.selectedFields"
                >
                  {{ getFieldLabel(field) }}
                  <span v-if="isFieldDesensitized(field)" class="desensitized-tag">脱敏</span>
                </el-checkbox>
              </div>
            </div>
          </div>
        </el-form-item>
      </el-form>

      <div v-if="exporting" class="export-progress">
        <div class="progress-header">
          <span>导出中...</span>
          <span class="progress-percent">{{ exportProgress.percent }}%</span>
        </div>
        <el-progress
          :percentage="exportProgress.percent"
          :status="exportProgress.status === 'failed' ? 'exception' : ''"
          :stroke-width="8"
        />
        <div class="progress-detail">
          {{ exportProgress.message }}
          <span class="progress-count">
            {{ exportProgress.processed }} / {{ exportProgress.total }} 条
          </span>
        </div>
      </div>

      <div v-if="exportResult" class="export-result">
        <el-alert
          :title="exportResult.hasPermission ? '导出数据生成成功' : '权限校验不通过'"
          :type="exportResult.hasPermission ? 'success' : 'warning'"
          show-icon
          :closable="false"
        >
          <template #default>
            <div>共 {{ exportResult.total }} 条数据</div>
            <div v-if="exportResult.desensitizedFields.length > 0" class="desensitized-info">
              以下字段已自动脱敏：{{ exportResult.desensitizedFields.join('、') }}
            </div>
          </template>
        </el-alert>
      </div>
    </div>

    <template #footer>
      <el-button @click="visible = false" :disabled="exporting">取消</el-button>
      <el-button
        type="primary"
        @click="handleExport"
        :loading="exporting"
        class="ripple-btn"
      >
        {{ exportResult ? '重新导出' : '开始导出' }}
      </el-button>
      <el-button
        v-if="exportResult && exportResult.hasPermission"
        type="success"
        @click="handleDownload"
        class="ripple-btn"
      >
        <el-icon><Download /></el-icon>
        下载文件
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Download } from '@element-plus/icons-vue'
import { exportServiceDataApi } from '@/api/driver'
import { ServiceSortFieldOptions } from '@/enums/driver'
import type { ExportResult, ExportProgress } from '@/types/driver'

const props = defineProps<{
  modelValue: boolean
  selectedIds?: number[]
  userRole?: string
}>()

const emit = defineEmits(['update:modelValue', 'success'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const exporting = ref(false)
const exportResult = ref<ExportResult | null>(null)
const exportProgress = reactive<ExportProgress>({
  percent: 0,
  status: 'pending',
  message: '准备导出...',
  total: 0,
  processed: 0
})

const sortOptions = ServiceSortFieldOptions

const fieldCategories = [
  { key: 'basic', label: '基础信息', fields: ['name', 'phone', 'city', 'vehicleType'] },
  { key: 'service', label: '服务数据', fields: ['totalOrders', 'completedOrders', 'completionRate', 'serviceScore', 'complaintRate', 'onlineHours'] },
  { key: 'finance', label: '财务数据', fields: ['totalIncome', 'avgOrderAmount'] },
  { key: 'sensitive', label: '敏感信息', fields: ['idCard', 'driverLicenseNo'], permissionRequired: true }
]

const fieldLabels: Record<string, string> = {
  name: '姓名',
  phone: '手机号',
  city: '城市',
  vehicleType: '车型',
  totalOrders: '接单量',
  completedOrders: '完单量',
  completionRate: '完单率',
  serviceScore: '服务评分',
  complaintRate: '投诉率',
  onlineHours: '在线时长',
  totalIncome: '总收入',
  avgOrderAmount: '平均客单价',
  idCard: '身份证号',
  driverLicenseNo: '驾驶证号'
}

const hasSensitivePermission = computed(() => {
  return props.userRole === 'super_admin' || props.userRole === 'finance_admin'
})

const exportForm = reactive({
  period: 'month',
  dateRange: null as [Date, Date] | null,
  driverLevels: [] as number[],
  city: '',
  vehicleType: '',
  sortField: 'totalOrders',
  sortOrder: 'DESC',
  selectedFields: ['name', 'phone', 'totalOrders', 'serviceScore', 'complaintRate', 'totalIncome']
})

const getFieldLabel = (key: string) => {
  return fieldLabels[key] || key
}

const isFieldDesensitized = (field: string) => {
  const sensitiveFields = ['idCard', 'driverLicenseNo']
  return sensitiveFields.includes(field) && !hasSensitivePermission.value
}

const isCategoryAllSelected = (category: any) => {
  return category.fields.every((f: string) => exportForm.selectedFields.includes(f))
}

const isCategoryIndeterminate = (category: any) => {
  const selected = category.fields.filter((f: string) => exportForm.selectedFields.includes(f))
  return selected.length > 0 && selected.length < category.fields.length
}

const handleCategoryChange = (category: any, checked: boolean) => {
  if (checked) {
    category.fields.forEach((f: string) => {
      if (!exportForm.selectedFields.includes(f)) {
        exportForm.selectedFields.push(f)
      }
    })
  } else {
    exportForm.selectedFields = exportForm.selectedFields.filter(
      (f: string) => !category.fields.includes(f)
    )
  }
}

const simulateProgress = () => {
  exportProgress.status = 'processing'
  exportProgress.percent = 0
  exportProgress.message = '正在校验数据权限...'

  const timer = setInterval(() => {
    if (exportProgress.percent >= 100) {
      clearInterval(timer)
      exportProgress.status = 'completed'
      exportProgress.message = '导出完成'
      return
    }

    exportProgress.percent += Math.random() * 15
    if (exportProgress.percent > 100) exportProgress.percent = 100

    if (exportProgress.percent < 30) {
      exportProgress.message = '正在校验数据权限...'
    } else if (exportProgress.percent < 60) {
      exportProgress.message = '正在生成数据报表...'
      exportProgress.processed = Math.floor((exportProgress.percent / 100) * exportProgress.total)
    } else if (exportProgress.percent < 90) {
      exportProgress.message = '正在处理敏感字段脱敏...'
    } else {
      exportProgress.message = '正在生成导出文件...'
    }
  }, 200)
}

const handleExport = async () => {
  if (exportForm.selectedFields.length === 0) {
    ElMessage.warning('请至少选择一个导出字段')
    return
  }

  exporting.value = true
  exportResult.value = null
  exportProgress.total = 0
  exportProgress.processed = 0

  try {
    simulateProgress()

    let startDate, endDate
    if (exportForm.period === 'custom' && exportForm.dateRange) {
      startDate = exportForm.dateRange[0].toISOString().split('T')[0]
      endDate = exportForm.dateRange[1].toISOString().split('T')[0]
    }

    const res = await exportServiceDataApi({
      period: exportForm.period,
      startDate,
      endDate,
      driverIds: props.selectedIds,
      city: exportForm.city || undefined,
      vehicleType: exportForm.vehicleType || undefined,
      fields: exportForm.selectedFields,
      sortField: exportForm.sortField,
      sortOrder: exportForm.sortOrder
    })

    setTimeout(() => {
      exportResult.value = res.data
      exportProgress.total = res.data.total
      exportProgress.processed = res.data.total
      exportProgress.percent = 100
      exportProgress.status = 'completed'
      exportProgress.message = '导出数据生成成功'

      if (res.data.desensitizedFields.length > 0) {
        ElMessage.warning(`部分字段因权限不足已自动脱敏：${res.data.desensitizedFields.join('、')}`)
      }

      emit('success', res.data)
    }, 1500)
  } catch (error: any) {
    exportProgress.status = 'failed'
    exportProgress.message = error.message || '导出失败'
    ElMessage.error('导出失败')
  } finally {
    setTimeout(() => {
      exporting.value = false
    }, 1500)
  }
}

const handleDownload = () => {
  if (!exportResult.value) return

  const data = exportResult.value.data
  const headers = exportForm.selectedFields.map(f => getFieldLabel(f))
  const csvContent = [
    headers.join(','),
    ...data.map((row: any) =>
      exportForm.selectedFields.map(f => `"${row[f] || ''}"`).join(',')
    )
  ].join('\n')

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `司机服务数据报表_${new Date().toISOString().split('T')[0]}.csv`
  link.click()

  ElMessage.success('文件下载成功')
}

const handleOpen = () => {
  exportResult.value = null
  exportProgress.percent = 0
  exportProgress.status = 'pending'
}

const handleClose = () => {
  if (exporting.value) return
}
</script>

<style scoped>
.export-dialog {
  padding: 10px 0;
}

.field-categories {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.field-category {
  border: 1px solid #ebeef5;
  border-radius: 6px;
  padding: 12px;
}

.category-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-weight: 500;
}

.category-fields {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.desensitized-tag {
  margin-left: 4px;
  font-size: 11px;
  color: #e6a23c;
}

.export-progress {
  margin-top: 20px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 14px;
  color: #606266;
}

.progress-percent {
  font-weight: 600;
  color: #409eff;
}

.progress-detail {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
  display: flex;
  justify-content: space-between;
}

.progress-count {
  color: #606266;
}

.export-result {
  margin-top: 20px;
}

.desensitized-info {
  font-size: 12px;
  color: #e6a23c;
  margin-top: 4px;
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
</style>
