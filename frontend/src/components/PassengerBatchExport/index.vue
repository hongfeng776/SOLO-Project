<template>
  <el-dialog
    v-model="visible"
    title="乘客数据批量导出"
    width="1100px"
    :close-on-click-modal="false"
    @open="handleOpen"
    @close="handleClose"
  >
    <div class="passenger-batch-export">
      <div class="export-main">
        <div class="config-panel">
          <el-form ref="formRef" :model="exportForm" :rules="formRules" label-width="110px">
            <el-form-item label="任务名称" prop="taskName">
              <el-input
                v-model="exportForm.taskName"
                placeholder="请输入导出任务名称"
                maxlength="50"
                show-word-limit
                clearable
              />
            </el-form-item>

            <el-form-item label="导出类型">
              <el-radio-group v-model="exportForm.exportType">
                <el-radio
                  v-for="type in exportTypeList"
                  :key="type.value"
                  :value="type.value"
                  :style="{ color: type.color }"
                >
                  {{ type.label }}
                </el-radio>
              </el-radio-group>
            </el-form-item>

            <el-divider content-position="left">
              <span class="section-title">
                <el-icon><Filter /></el-icon>
                筛选范围
              </span>
            </el-divider>

            <el-form-item label="风险等级">
              <el-select
                v-model="exportForm.filterParams.travelRiskLevels"
                multiple
                collapse-tags
                collapse-tags-tooltip
                placeholder="全部风险等级"
                clearable
                style="width: 100%"
              >
                <el-option
                  v-for="level in travelRiskLevelList"
                  :key="level.value"
                  :label="level.label"
                  :value="level.value"
                >
                  <span :style="{ color: level.color }">{{ level.label }}</span>
                </el-option>
              </el-select>
            </el-form-item>

            <el-form-item label="活跃度">
              <el-select
                v-model="exportForm.filterParams.activityLevels"
                multiple
                collapse-tags
                collapse-tags-tooltip
                placeholder="全部活跃度"
                clearable
                style="width: 100%"
              >
                <el-option
                  v-for="level in activityLevelList"
                  :key="level.value"
                  :label="level.label"
                  :value="level.value"
                >
                  <span :style="{ color: level.color }">{{ level.label }}</span>
                </el-option>
              </el-select>
            </el-form-item>

            <el-form-item label="消费层级">
              <el-select
                v-model="exportForm.filterParams.consumptionLevels"
                multiple
                collapse-tags
                collapse-tags-tooltip
                placeholder="全部消费层级"
                clearable
                style="width: 100%"
              >
                <el-option
                  v-for="level in consumptionLevelList"
                  :key="level.value"
                  :label="level.label"
                  :value="level.value"
                >
                  <span :style="{ color: level.color }">{{ level.label }}</span>
                </el-option>
              </el-select>
            </el-form-item>

            <el-form-item label="用户等级">
              <el-select
                v-model="exportForm.filterParams.passengerLevels"
                multiple
                collapse-tags
                collapse-tags-tooltip
                placeholder="全部用户等级"
                clearable
                style="width: 100%"
              >
                <el-option
                  v-for="level in passengerLevelList"
                  :key="level.value"
                  :label="level.label"
                  :value="level.value"
                >
                  <span :style="{ color: level.color }">{{ level.label }}</span>
                </el-option>
              </el-select>
            </el-form-item>

            <el-form-item label="风险账号">
              <el-switch
                v-model="exportForm.filterParams.isRisk"
                active-text="仅风险账号"
                inactive-text="不限"
              />
            </el-form-item>

            <el-divider content-position="left">
              <span class="section-title">
                <el-icon><Sort /></el-icon>
                排序规则
              </span>
            </el-divider>

            <el-form-item label="排序字段">
              <div class="sort-rules">
                <div
                  v-for="(rule, index) in exportForm.sortRules"
                  :key="index"
                  class="sort-rule-item"
                >
                  <el-select v-model="rule.field" placeholder="选择字段" style="width: 160px">
                    <el-option
                      v-for="field in sortFieldOptions"
                      :key="field.value"
                      :label="field.label"
                      :value="field.value"
                    />
                  </el-select>
                  <el-radio-group v-model="rule.order" size="default">
                    <el-radio-button value="asc">升序</el-radio-button>
                    <el-radio-button value="desc">降序</el-radio-button>
                  </el-radio-group>
                  <el-button
                    v-if="exportForm.sortRules.length > 1"
                    type="danger"
                    text
                    :icon="Delete"
                    @click="removeSortRule(index)"
                  >
                    删除
                  </el-button>
                </div>
                <el-button
                  type="primary"
                  text
                  :icon="Plus"
                  @click="addSortRule"
                  class="add-sort-btn"
                >
                  添加排序规则
                </el-button>
              </div>
            </el-form-item>

            <el-divider content-position="left">
              <span class="section-title">
                <el-icon><Lock /></el-icon>
                隐私脱敏
              </span>
            </el-divider>

            <el-form-item label="脱敏开关">
              <el-switch
                v-model="exportForm.isDesensitized"
                active-text="开启"
                inactive-text="关闭"
              />
            </el-form-item>
            <el-form-item v-if="exportForm.isDesensitized" label="">
              <el-alert
                type="info"
                :closable="false"
                show-icon
                title="脱敏规则"
              >
                <template #default>
                  <ul class="desensitize-rules">
                    <li>手机号中间4位替换为 ****</li>
                    <li>身份证号中间8位替换为 ********</li>
                    <li>姓名仅显示姓氏，名字用 * 代替</li>
                    <li>地址信息部分字段脱敏处理</li>
                  </ul>
                </template>
              </el-alert>
            </el-form-item>
          </el-form>
        </div>

        <div class="preview-panel">
          <div class="preview-header">
            <el-icon><Document /></el-icon>
            <span>导出预览</span>
          </div>

          <div class="field-section">
            <div class="field-header">
              <span class="field-title">导出字段列表</span>
              <div class="field-actions">
                <el-checkbox
                  :model-value="isAllFieldsSelected"
                  :indeterminate="isFieldsIndeterminate"
                  @change="handleSelectAllFields"
                >
                  全选
                </el-checkbox>
              </div>
            </div>
            <div class="field-list">
              <el-checkbox
                v-for="field in currentFieldList"
                :key="field.value"
                :label="field.value"
                v-model="exportForm.fieldList"
              >
                {{ field.label }}
                <el-tag
                  v-if="field.sensitive && exportForm.isDesensitized"
                  size="small"
                  type="warning"
                  effect="light"
                  class="sensitive-tag"
                >
                  脱敏
                </el-tag>
              </el-checkbox>
            </div>
          </div>

          <div class="stats-section">
            <div class="stats-title">
              <el-icon><DataAnalysis /></el-icon>
              预览统计
            </div>
            <div class="stats-grid">
              <div class="stats-item">
                <div class="stats-label">预计导出条数</div>
                <div class="stats-value primary">{{ previewStats.estimatedCount }}</div>
              </div>
              <div class="stats-item">
                <div class="stats-label">文件大小估算</div>
                <div class="stats-value success">{{ previewStats.estimatedSize }}</div>
              </div>
              <div class="stats-item">
                <div class="stats-label">脱敏状态</div>
                <div class="stats-value">
                  <el-tag
                    :type="exportForm.isDesensitized ? 'success' : 'info'"
                    effect="light"
                  >
                    {{ exportForm.isDesensitized ? '已开启脱敏' : '未脱敏' }}
                  </el-tag>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <el-collapse class="history-collapse">
        <el-collapse-item name="history">
          <template #title>
            <div class="history-title">
              <el-icon><Clock /></el-icon>
              历史导出任务
              <el-tag size="small" type="info" effect="plain">{{ historyList.length }}</el-tag>
            </div>
          </template>
          <el-table :data="historyList" v-loading="historyLoading" size="small" stripe>
            <el-table-column prop="taskName" label="任务名称" min-width="160" show-overflow-tooltip />
            <el-table-column label="导出类型" width="120">
              <template #default="{ row }">
                <el-tag
                  size="small"
                  effect="light"
                  :style="{
                    backgroundColor: ExportTypeColorMap[row.exportType] + '20',
                    color: ExportTypeColorMap[row.exportType],
                    borderColor: ExportTypeColorMap[row.exportType] + '50'
                  }"
                >
                  {{ ExportTypeMap[row.exportType] }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="90">
              <template #default="{ row }">
                <el-tag
                  size="small"
                  effect="light"
                  :style="{
                    backgroundColor: ExportStatusColorMap[row.status] + '20',
                    color: ExportStatusColorMap[row.status],
                    borderColor: ExportStatusColorMap[row.status] + '50'
                  }"
                >
                  {{ ExportStatusMap[row.status] }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="totalCount" label="总条数" width="80" align="center" />
            <el-table-column prop="fileName" label="文件名" min-width="160" show-overflow-tooltip />
            <el-table-column label="文件大小" width="90" align="center">
              <template #default="{ row }">
                {{ formatFileSize(row.fileSize) }}
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="创建时间" width="160" />
            <el-table-column label="操作" width="90" fixed="right" align="center">
              <template #default="{ row }">
                <el-button
                  v-if="row.status === ExportStatus.COMPLETED"
                  type="success"
                  text
                  size="small"
                  :icon="Download"
                  @click="handleDownload(row)"
                >
                  下载
                </el-button>
                <span v-else class="text-disabled">-</span>
              </template>
            </el-table-column>
          </el-table>
        </el-collapse-item>
      </el-collapse>
    </div>

    <template #footer>
      <el-button @click="visible = false" :disabled="exporting">取消</el-button>
      <el-button
        type="primary"
        :loading="exporting"
        @click="handleConfirmExport"
        class="ripple-btn"
      >
        <el-icon><Download /></el-icon>
        确认导出
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import {
  Filter,
  Sort,
  Lock,
  Document,
  DataAnalysis,
  Clock,
  Download,
  Plus,
  Delete
} from '@element-plus/icons-vue'
import { createExportTaskApi, getExportTaskListApi } from '@/api/passenger'
import {
  ExportType,
  ExportTypeMap,
  ExportTypeColorMap,
  TravelRiskLevel,
  TravelRiskLevelMap,
  TravelRiskLevelColorMap,
  ActivityLevel,
  ActivityLevelMap,
  ActivityLevelColorMap,
  ConsumptionLevel,
  ConsumptionLevelMap,
  ConsumptionLevelColorMap,
  PassengerLevel,
  PassengerLevelMap,
  PassengerLevelColorMap,
  ExportStatus,
  ExportStatusMap,
  ExportStatusColorMap
} from '@/enums/passenger'
import type { SortRule, ExportTaskCreateParams, PassengerExportTask } from '@/types/passenger'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits(['update:modelValue', 'success'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const formRef = ref<FormInstance>()
const exporting = ref(false)
const historyLoading = ref(false)
const historyList = ref<PassengerExportTask[]>([])

const exportTypeList = computed(() => Object.entries(ExportTypeMap).map(([value, label]) => ({
  value: Number(value),
  label,
  color: ExportTypeColorMap[Number(value)]
})))

const travelRiskLevelList = computed(() => Object.entries(TravelRiskLevelMap).map(([value, label]) => ({
  value: Number(value),
  label,
  color: TravelRiskLevelColorMap[Number(value)]
})))

const activityLevelList = computed(() => Object.entries(ActivityLevelMap).map(([value, label]) => ({
  value: Number(value),
  label,
  color: ActivityLevelColorMap[Number(value)]
})))

const consumptionLevelList = computed(() => Object.entries(ConsumptionLevelMap).map(([value, label]) => ({
  value: Number(value),
  label,
  color: ConsumptionLevelColorMap[Number(value)]
})))

const passengerLevelList = computed(() => Object.entries(PassengerLevelMap).map(([value, label]) => ({
  value: Number(value),
  label,
  color: PassengerLevelColorMap[Number(value)]
})))

const sortFieldOptions = [
  { value: 'registerTime', label: '注册时间' },
  { value: 'totalOrders', label: '订单总数' },
  { value: 'totalSpend', label: '消费总额' },
  { value: 'cancelRate', label: '取消率' },
  { value: 'reputationScore', label: '信誉评分' },
  { value: 'travelRiskScore', label: '风险评分' }
]

const fieldListMap: Record<number, Array<{ value: string; label: string; sensitive?: boolean }>> = {
  [ExportType.TRAVEL_BEHAVIOR]: [
    { value: 'passengerId', label: '用户ID' },
    { value: 'realName', label: '姓名', sensitive: true },
    { value: 'phone', label: '手机号', sensitive: true },
    { value: 'orderNo', label: '订单号' },
    { value: 'orderTime', label: '下单时间' },
    { value: 'travelCity', label: '出行城市' },
    { value: 'startAddress', label: '出发地址', sensitive: true },
    { value: 'endAddress', label: '到达地址', sensitive: true },
    { value: 'orderAmount', label: '订单金额' },
    { value: 'orderStatus', label: '订单状态' },
    { value: 'cancelReason', label: '取消原因' },
    { value: 'travelDistance', label: '行驶里程' },
    { value: 'travelDuration', label: '行驶时长' }
  ],
  [ExportType.RISK_RECORD]: [
    { value: 'passengerId', label: '用户ID' },
    { value: 'realName', label: '姓名', sensitive: true },
    { value: 'phone', label: '手机号', sensitive: true },
    { value: 'riskType', label: '风险类型' },
    { value: 'riskLevel', label: '风险等级' },
    { value: 'riskScore', label: '风险评分' },
    { value: 'description', label: '风险描述' },
    { value: 'triggerTime', label: '触发时间' },
    { value: 'orderNo', label: '关联订单' },
    { value: 'status', label: '处理状态' },
    { value: 'handleTime', label: '处理时间' },
    { value: 'handlerName', label: '处理人' }
  ],
  [ExportType.USER_PROFILE]: [
    { value: 'passengerId', label: '用户ID' },
    { value: 'nickname', label: '昵称' },
    { value: 'realName', label: '姓名', sensitive: true },
    { value: 'phone', label: '手机号', sensitive: true },
    { value: 'idCard', label: '身份证号', sensitive: true },
    { value: 'gender', label: '性别' },
    { value: 'province', label: '省份', sensitive: true },
    { value: 'city', label: '城市', sensitive: true },
    { value: 'level', label: '用户等级' },
    { value: 'activityLevel', label: '活跃度' },
    { value: 'consumptionLevel', label: '消费层级' },
    { value: 'totalOrders', label: '订单总数' },
    { value: 'totalSpend', label: '消费总额' },
    { value: 'cancelRate', label: '取消率' },
    { value: 'reputationScore', label: '信誉评分' },
    { value: 'travelRiskLevel', label: '风险等级' },
    { value: 'registerTime', label: '注册时间' },
    { value: 'lastLoginTime', label: '最近登录' }
  ]
}

const defaultFieldMap: Record<number, string[]> = {
  [ExportType.TRAVEL_BEHAVIOR]: ['passengerId', 'realName', 'phone', 'orderNo', 'orderTime', 'orderAmount', 'orderStatus'],
  [ExportType.RISK_RECORD]: ['passengerId', 'realName', 'phone', 'riskType', 'riskLevel', 'description', 'triggerTime', 'status'],
  [ExportType.USER_PROFILE]: ['passengerId', 'nickname', 'realName', 'phone', 'level', 'activityLevel', 'totalOrders', 'totalSpend', 'registerTime']
}

const currentFieldList = computed(() => fieldListMap[exportForm.exportType] || [])

const isAllFieldsSelected = computed(() => {
  const fields = currentFieldList.value.map(f => f.value)
  return fields.length > 0 && fields.every(f => exportForm.fieldList.includes(f))
})

const isFieldsIndeterminate = computed(() => {
  const fields = currentFieldList.value.map(f => f.value)
  const selectedCount = fields.filter(f => exportForm.fieldList.includes(f)).length
  return selectedCount > 0 && selectedCount < fields.length
})

const previewStats = computed(() => {
  const baseCount = 1000 + Math.floor(Math.random() * 4000)
  const fieldMultiplier = exportForm.fieldList.length * 0.05
  const estimatedSize = (baseCount * fieldMultiplier * 0.1).toFixed(2)
  return {
    estimatedCount: baseCount.toLocaleString(),
    estimatedSize: `${estimatedSize} MB`
  }
})

interface ExportForm {
  taskName: string
  exportType: number
  filterParams: {
    travelRiskLevels: number[]
    activityLevels: number[]
    consumptionLevels: number[]
    passengerLevels: number[]
    isRisk: boolean | null
  }
  sortRules: SortRule[]
  fieldList: string[]
  isDesensitized: boolean
}

const createDefaultForm = (): ExportForm => ({
  taskName: '',
  exportType: ExportType.TRAVEL_BEHAVIOR,
  filterParams: {
    travelRiskLevels: [],
    activityLevels: [],
    consumptionLevels: [],
    passengerLevels: [],
    isRisk: null
  },
  sortRules: [{ field: 'registerTime', order: 'desc' }],
  fieldList: [...defaultFieldMap[ExportType.TRAVEL_BEHAVIOR]],
  isDesensitized: true
})

const exportForm = reactive<ExportForm>(createDefaultForm())

const formRules: FormRules = {
  taskName: [
    { required: true, message: '请输入任务名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ]
}

const addSortRule = () => {
  exportForm.sortRules.push({ field: 'registerTime', order: 'desc' })
}

const removeSortRule = (index: number) => {
  if (exportForm.sortRules.length > 1) {
    exportForm.sortRules.splice(index, 1)
  }
}

const handleSelectAllFields = (checked: boolean) => {
  const fields = currentFieldList.value.map(f => f.value)
  if (checked) {
    exportForm.fieldList = [...fields]
  } else {
    exportForm.fieldList = []
  }
}

const formatFileSize = (bytes: number): string => {
  if (!bytes) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

const fetchHistoryList = async () => {
  historyLoading.value = true
  try {
    const res = await getExportTaskListApi({ page: 1, pageSize: 10 })
    historyList.value = res.data.list || []
  } catch (error: any) {
    ElMessage.error(error.message || '获取历史任务失败')
  } finally {
    historyLoading.value = false
  }
}

const handleConfirmExport = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return

    if (exportForm.fieldList.length === 0) {
      ElMessage.warning('请至少选择一个导出字段')
      return
    }

    exporting.value = true
    try {
      const params: ExportTaskCreateParams = {
        taskName: exportForm.taskName,
        exportType: exportForm.exportType,
        filterParams: exportForm.filterParams,
        sortRules: exportForm.sortRules,
        fieldList: exportForm.fieldList,
        isDesensitized: exportForm.isDesensitized
      }
      await createExportTaskApi(params)
      ElMessage.success('导出任务创建成功，请在历史任务中查看进度')
      emit('success')
      await fetchHistoryList()
      visible.value = false
    } catch (error: any) {
      ElMessage.error(error.message || '导出任务创建失败')
    } finally {
      exporting.value = false
    }
  })
}

const handleDownload = (row: PassengerExportTask) => {
  if (!row.filePath) {
    ElMessage.warning('文件不存在')
    return
  }
  const link = document.createElement('a')
  link.href = row.filePath
  link.download = row.fileName || `export_${row.id}.xlsx`
  link.click()
  ElMessage.success('开始下载')
}

const handleOpen = () => {
  Object.assign(exportForm, createDefaultForm())
  formRef.value?.resetFields()
  fetchHistoryList()
}

const handleClose = () => {
  if (exporting.value) return
}

watch(() => exportForm.exportType, (newType) => {
  exportForm.fieldList = [...defaultFieldMap[newType]]
})
</script>

<style lang="scss" scoped>
.passenger-batch-export {
  .export-main {
    display: flex;
    gap: 20px;
    margin-bottom: 16px;
  }

  .config-panel {
    flex: 1;
    min-width: 0;
    padding-right: 20px;
    border-right: 1px solid #ebeef5;
    max-height: 520px;
    overflow-y: auto;

    :deep(.el-form-item) {
      margin-bottom: 16px;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 4px;
      font-weight: 500;
      color: #303133;
      font-size: 14px;
    }

    .sort-rules {
      display: flex;
      flex-direction: column;
      gap: 10px;
      width: 100%;

      .sort-rule-item {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .add-sort-btn {
        align-self: flex-start;
      }
    }

    .desensitize-rules {
      margin: 0;
      padding-left: 18px;
      font-size: 12px;
      color: #606266;
      line-height: 1.8;
    }
  }

  .preview-panel {
    width: 360px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 16px;

    .preview-header {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 600;
      font-size: 15px;
      color: #303133;
      padding-bottom: 10px;
      border-bottom: 1px solid #ebeef5;
    }

    .field-section {
      .field-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;

        .field-title {
          font-weight: 500;
          font-size: 13px;
          color: #606266;
        }
      }

      .field-list {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px 12px;
        padding: 12px;
        background: #f5f7fa;
        border-radius: 6px;
        max-height: 280px;
        overflow-y: auto;

        :deep(.el-checkbox) {
          font-size: 13px;

          .sensitive-tag {
            margin-left: 4px;
            transform: scale(0.85);
          }
        }
      }
    }

    .stats-section {
      .stats-title {
        display: flex;
        align-items: center;
        gap: 4px;
        font-weight: 500;
        font-size: 13px;
        color: #606266;
        margin-bottom: 10px;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;

        .stats-item {
          padding: 12px 8px;
          background: #f5f7fa;
          border-radius: 6px;
          text-align: center;

          .stats-label {
            font-size: 12px;
            color: #909399;
            margin-bottom: 6px;
          }

          .stats-value {
            font-size: 14px;
            font-weight: 600;
            color: #303133;

            &.primary {
              color: #409eff;
            }

            &.success {
              color: #67c23a;
            }
          }
        }
      }
    }
  }

  .history-collapse {
    border: 1px solid #ebeef5;
    border-radius: 6px;
    overflow: hidden;

    :deep(.el-collapse-item__header) {
      padding: 0 16px;
      background: #fafafa;
      border-bottom: none;
    }

    :deep(.el-collapse-item__wrap) {
      border-bottom: none;
    }

    :deep(.el-collapse-item__content) {
      padding: 12px 16px 16px;
    }

    .history-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 500;
      color: #303133;

      :deep(.el-tag) {
        margin-left: 6px;
      }
    }

    .text-disabled {
      color: #c0c4cc;
    }
  }

  .ripple-btn {
    position: relative;
    overflow: hidden;

    &::after {
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

    &:active::after {
      width: 200px;
      height: 200px;
    }
  }
}
</style>
