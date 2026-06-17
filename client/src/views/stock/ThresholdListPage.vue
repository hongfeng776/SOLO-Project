<template>
  <el-dialog
    v-model="visible"
    title="阈值配置管理"
    width="1100px"
    :close-on-click-modal="false"
    append-to-body
    @open="handleOpen"
  >
    <div class="threshold-list-page">
      <div class="filter-bar">
        <el-select v-model="filterParams.scopeType" placeholder="范围类型" clearable style="width: 140px">
          <el-option label="全局" value="global" />
          <el-option label="板块" value="sector" />
        </el-select>
        <el-select v-model="filterParams.sector" placeholder="板块" clearable style="width: 140px">
          <el-option v-for="s in MARKET_SECTOR_LIST" :key="s" :label="s" :value="s" />
        </el-select>
        <el-select v-model="filterParams.thresholdType" placeholder="阈值类型" clearable style="width: 140px">
          <el-option label="涨跌幅" value="change_rate" />
          <el-option label="成交量" value="volume" />
          <el-option label="成交额" value="turnover" />
        </el-select>
        <el-select v-model="filterParams.configStatus" placeholder="状态" clearable style="width: 140px">
          <el-option label="永久" value="permanent" />
          <el-option label="临时" value="temporary" />
          <el-option label="已过期" value="expired" />
        </el-select>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>

      <div class="toolbar">
        <el-button
          v-if="hasPerm('stock:threshold:manage')"
          type="primary"
          :icon="Plus"
          @click="handleCreate"
        >
          新增阈值
        </el-button>
        <el-button
          v-if="hasPerm('stock:threshold:manage')"
          type="warning"
          :icon="Clock"
          @click="handleExpireTemporary"
        >
          清理过期临时配置
        </el-button>
      </div>

      <el-table
        v-loading="loading"
        :data="tableData"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="getThresholdTypeTag(row.thresholdType)">
              {{ THRESHOLD_TYPE_LABELS[row.thresholdType] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="范围" width="90">
          <template #default="{ row }">
            <el-tag size="small" effect="plain">
              {{ SCOPE_TYPE_LABELS[row.scopeType] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="板块" width="100">
          <template #default="{ row }">
            <el-tag
              v-if="row.sector"
              size="small"
              effect="plain"
              :style="getSectorTagStyle(row.sector)"
            >
              {{ row.sector }}
            </el-tag>
            <span v-else>全局</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag size="small" :type="getStatusTagType(row.configStatus)">
              {{ STATUS_LABELS[row.configStatus] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="阈值区间" width="160">
          <template #default="{ row }">
            <span>[{{ row.minValue }}, {{ row.maxValue }}]</span>
          </template>
        </el-table-column>
        <el-table-column label="预警阈值" width="100">
          <template #default="{ row }">
            <span style="color: #E6A23C; font-weight: 500">{{ row.warningThreshold }}%</span>
          </template>
        </el-table-column>
        <el-table-column label="触发阈值" width="100">
          <template #default="{ row }">
            <span style="color: #F56C6C; font-weight: 500">{{ row.triggerThreshold }}%</span>
          </template>
        </el-table-column>
        <el-table-column prop="version" label="版本" width="70" align="center" />
        <el-table-column label="有效期" width="200">
          <template #default="{ row }">
            <div class="effective-period">
              <span>{{ formatDate(row.effectiveStart) }}</span>
              <span v-if="row.effectiveEnd"> ~ {{ formatDate(row.effectiveEnd) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="createdByName" label="创建人" width="100" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              :icon="Tickets"
              @click="handleHistory(row)"
            >
              溯源
            </el-button>
            <el-button
              v-if="hasPerm('stock:threshold:manage') && row.configStatus !== 'expired'"
              type="primary"
              link
              :icon="Edit"
              @click="handleEdit(row)"
            >
              编辑
            </el-button>
            <el-button
              v-if="hasPerm('stock:threshold:manage')"
              type="danger"
              link
              :icon="Delete"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchList"
          @current-change="fetchList"
        />
      </div>
    </div>

    <el-dialog
      v-model="formDialogVisible"
      :title="formDialogTitle"
      width="640px"
      :close-on-click-modal="false"
      append-to-body
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="110px"
      >
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="阈值类型" prop="thresholdType">
              <el-select v-model="formData.thresholdType" style="width: 100%">
                <el-option label="涨跌幅" value="change_rate" />
                <el-option label="成交量" value="volume" />
                <el-option label="成交额" value="turnover" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="范围类型" prop="scopeType">
              <el-select v-model="formData.scopeType" style="width: 100%">
                <el-option label="全局" value="global" />
                <el-option label="板块" value="sector" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="板块" prop="sector">
              <el-select
                v-model="formData.sector"
                placeholder="范围类型为板块时必填"
                :disabled="formData.scopeType === 'global'"
                clearable
                style="width: 100%"
              >
                <el-option v-for="s in MARKET_SECTOR_LIST" :key="s" :label="s" :value="s" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="配置状态" prop="configStatus">
              <el-select v-model="formData.configStatus" style="width: 100%">
                <el-option label="永久" value="permanent" />
                <el-option label="临时" value="temporary" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="最小值" prop="minValue">
              <el-input-number
                v-model="formData.minValue"
                :precision="2"
                :controls="false"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="最大值" prop="maxValue">
              <el-input-number
                v-model="formData.maxValue"
                :precision="2"
                :controls="false"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="预警阈值(%)" prop="warningThreshold">
              <el-input-number
                v-model="formData.warningThreshold"
                :precision="2"
                :controls="false"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="触发阈值(%)" prop="triggerThreshold">
              <el-input-number
                v-model="formData.triggerThreshold"
                :precision="2"
                :controls="false"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="生效开始" prop="effectiveStart">
              <el-date-picker
                v-model="formData.effectiveStart"
                type="date"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="生效结束">
              <el-date-picker
                v-model="formData.effectiveEnd"
                type="date"
                value-format="YYYY-MM-DD"
                :disabled="formData.configStatus === 'permanent'"
                clearable
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input v-model="formData.remark" type="textarea" :rows="2" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-alert
          v-if="conflictCheckResult && conflictCheckResult.hasConflict"
          type="warning"
          show-icon
          :closable="false"
          style="margin-top: 12px"
        >
          <template #title>
            <span>⚠️ 检测到 {{ conflictCheckResult.conflicts.length }} 处配置冲突</span>
          </template>
          <div style="margin-top: 8px">
            <el-tag
              v-for="(c, idx) in conflictCheckResult.conflicts"
              :key="idx"
              size="small"
              :class="`conflict-badge-${c.type}`"
              style="margin-right: 6px; margin-bottom: 4px"
            >
              {{ CONFLICT_TYPE_LABELS[c.type] }}：{{ c.message }}
            </el-tag>
          </div>
        </el-alert>
      </el-form>

      <template #footer>
        <el-button @click="formDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="formSubmitting" @click="handleFormSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>

    <ThresholdHistoryDialog
      v-model="historyDialogVisible"
      :threshold-id="currentHistoryThresholdId"
    />
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import {
  Plus,
  Edit,
  Delete,
  Clock,
  Tickets,
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import dayjs from 'dayjs'
import { usePermission } from '@/hooks/usePermission'
import { MARKET_SECTOR_LIST, SECTOR_COLORS } from '@/constants/dictionaries'
import * as thresholdApi from '@/api/threshold'
import ThresholdHistoryDialog from './ThresholdHistoryDialog.vue'
import type {
  IQuoteThreshold,
  IThresholdListParams,
  IThresholdCreateData,
  IThresholdUpdateData,
  IThresholdConflictCheckResult,
  ThresholdType,
  ScopeType,
  ConfigStatus,
} from '@/types/api'

const { hasPerm } = usePermission()

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  refresh: []
}>()

const visible = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val),
})

const loading = ref(false)
const tableData = ref<IQuoteThreshold[]>([])
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
})

const filterParams = reactive<Partial<IThresholdListParams>>({
  scopeType: undefined,
  sector: undefined,
  thresholdType: undefined,
  configStatus: undefined,
})

const THRESHOLD_TYPE_LABELS: Record<ThresholdType, string> = {
  change_rate: '涨跌幅',
  volume: '成交量',
  turnover: '成交额',
}

const SCOPE_TYPE_LABELS: Record<ScopeType, string> = {
  global: '全局',
  sector: '板块',
}

const STATUS_LABELS: Record<ConfigStatus, string> = {
  permanent: '永久',
  temporary: '临时',
  expired: '已过期',
}

const CONFLICT_TYPE_LABELS: Record<string, string> = {
  logic: '逻辑矛盾',
  extreme: '数值极值',
  drift: '配置漂移',
  overlap: '区间重叠',
}

const formDialogVisible = ref(false)
const formSubmitting = ref(false)
const formType = ref<'create' | 'edit'>('create')
const formRef = ref<FormInstance>()
const currentEditId = ref<number | null>(null)
const conflictCheckResult = ref<IThresholdConflictCheckResult | null>(null)

const formDialogTitle = computed(() => (formType.value === 'create' ? '新增阈值' : '编辑阈值'))

const formData = reactive<Partial<IThresholdCreateData>>({
  thresholdType: 'change_rate',
  sector: '',
  scopeType: 'global',
  configStatus: 'permanent',
  minValue: -10,
  maxValue: 10,
  warningThreshold: 5,
  triggerThreshold: 7,
  remark: '',
  effectiveStart: dayjs().format('YYYY-MM-DD'),
  effectiveEnd: '',
})

const formRules: FormRules = {
  thresholdType: [{ required: true, message: '请选择阈值类型', trigger: 'change' }],
  scopeType: [{ required: true, message: '请选择范围类型', trigger: 'change' }],
  configStatus: [{ required: true, message: '请选择配置状态', trigger: 'change' }],
  minValue: [{ required: true, message: '请输入最小值', trigger: 'blur' }],
  maxValue: [{ required: true, message: '请输入最大值', trigger: 'blur' }],
  warningThreshold: [{ required: true, message: '请输入预警阈值', trigger: 'blur' }],
  triggerThreshold: [{ required: true, message: '请输入触发阈值', trigger: 'blur' }],
  effectiveStart: [{ required: true, message: '请选择生效开始时间', trigger: 'change' }],
  sector: [
    {
      validator: (_rule, value, callback) => {
        if (formData.scopeType === 'sector' && !value) {
          callback(new Error('板块范围时请选择板块'))
        } else {
          callback()
        }
      },
      trigger: 'change',
    },
  ],
}

const historyDialogVisible = ref(false)
const currentHistoryThresholdId = ref<number | null>(null)

function getThresholdTypeTag(type: ThresholdType): 'primary' | 'success' | 'warning' {
  const map: Record<ThresholdType, 'primary' | 'success' | 'warning'> = {
    change_rate: 'primary',
    volume: 'success',
    turnover: 'warning',
  }
  return map[type]
}

function getStatusTagType(status: ConfigStatus): 'success' | 'warning' | 'info' {
  const map: Record<ConfigStatus, 'success' | 'warning' | 'info'> = {
    permanent: 'success',
    temporary: 'warning',
    expired: 'info',
  }
  return map[status]
}

function getSectorTagStyle(sector: string) {
  const color = SECTOR_COLORS[sector] || '#909399'
  return {
    borderColor: `${color}50`,
    color,
  }
}

function formatDate(value: string): string {
  if (!value) return ''
  return dayjs(value).format('YYYY-MM-DD')
}

async function fetchList() {
  loading.value = true
  try {
    const params: IThresholdListParams = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...filterParams,
    }
    const res = await thresholdApi.getThresholdList(params)
    tableData.value = res.data.list || []
    pagination.total = res.data.total || 0
  } catch (error) {
    console.error('获取阈值列表失败:', error)
    ElMessage.error('获取阈值列表失败')
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.page = 1
  fetchList()
}

function handleReset() {
  filterParams.scopeType = undefined
  filterParams.sector = undefined
  filterParams.thresholdType = undefined
  filterParams.configStatus = undefined
  pagination.page = 1
  fetchList()
}

function resetForm() {
  Object.assign(formData, {
    thresholdType: 'change_rate',
    sector: '',
    scopeType: 'global',
    configStatus: 'permanent',
    minValue: -10,
    maxValue: 10,
    warningThreshold: 5,
    triggerThreshold: 7,
    remark: '',
    effectiveStart: dayjs().format('YYYY-MM-DD'),
    effectiveEnd: '',
  })
  conflictCheckResult.value = null
  currentEditId.value = null
  formRef.value?.resetFields()
}

function handleCreate() {
  formType.value = 'create'
  resetForm()
  formDialogVisible.value = true
}

function handleEdit(row: IQuoteThreshold) {
  formType.value = 'edit'
  currentEditId.value = row.id
  conflictCheckResult.value = null
  Object.assign(formData, {
    thresholdType: row.thresholdType,
    sector: row.sector,
    scopeType: row.scopeType,
    configStatus: row.configStatus,
    minValue: row.minValue,
    maxValue: row.maxValue,
    warningThreshold: row.warningThreshold,
    triggerThreshold: row.triggerThreshold,
    remark: row.remark,
    effectiveStart: row.effectiveStart,
    effectiveEnd: row.effectiveEnd,
  })
  formDialogVisible.value = true
}

async function checkConflict() {
  try {
    const res = await thresholdApi.checkConflict(formData as Partial<IQuoteThreshold>)
    conflictCheckResult.value = res.data
  } catch {
    conflictCheckResult.value = null
  }
}

watch(
  () => [formData.thresholdType, formData.sector, formData.scopeType, formData.warningThreshold, formData.triggerThreshold],
  () => {
    if (formDialogVisible.value) {
      checkConflict()
    }
  },
)

async function handleFormSubmit() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  formSubmitting.value = true
  try {
    if (formType.value === 'create') {
      await thresholdApi.createThreshold(formData as IThresholdCreateData)
      ElMessage.success('新增成功')
    } else if (currentEditId.value) {
      const updateData: IThresholdUpdateData = {
        ...formData,
      }
      await thresholdApi.updateThreshold(currentEditId.value, updateData)
      ElMessage.success('编辑成功')
    }
    formDialogVisible.value = false
    await fetchList()
    emit('refresh')
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error('提交失败')
  } finally {
    formSubmitting.value = false
  }
}

async function handleDelete(row: IQuoteThreshold) {
  try {
    await ElMessageBox.confirm(`确定要删除该阈值配置吗？`, '删除确认', {
      type: 'warning',
    })
    await thresholdApi.deleteThreshold(row.id)
    ElMessage.success('删除成功')
    await fetchList()
    emit('refresh')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
    }
  }
}

async function handleExpireTemporary() {
  try {
    await ElMessageBox.confirm('确定要清理所有过期的临时配置吗？', '清理确认', {
      type: 'warning',
    })
    const res = await thresholdApi.expireTemporary()
    ElMessage.success(`已清理 ${res.data.expiredCount} 条过期临时配置`)
    await fetchList()
    emit('refresh')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('清理失败:', error)
    }
  }
}

function handleHistory(row: IQuoteThreshold) {
  currentHistoryThresholdId.value = row.id
  historyDialogVisible.value = true
}

function handleOpen() {
  fetchList()
}
</script>

<style lang="scss" scoped>
.threshold-list-page {
  .filter-bar {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }

  .toolbar {
    margin-bottom: 12px;
    display: flex;
    gap: 8px;
  }

  .pagination {
    margin-top: 16px;
    display: flex;
    justify-content: flex-end;
  }

  .effective-period {
    font-size: 12px;
    color: #606266;
  }
}
</style>
