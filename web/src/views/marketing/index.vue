<template>
  <div class="page-container">
    <el-card shadow="never">
      <el-form :inline="true" :model="queryParams" class="search-form">
        <el-form-item label="活动名称">
          <el-input
            v-model="queryParams.name"
            placeholder="请输入活动名称"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="活动类型">
          <el-select
            v-model="queryParams.type"
            placeholder="请选择"
            clearable
            style="width: 150px"
          >
            <el-option
              v-for="item in MARKETING_TYPE_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="活动状态">
          <el-select
            v-model="queryParams.status"
            placeholder="请选择"
            clearable
            style="width: 150px"
          >
            <el-option
              v-for="item in MARKETING_STATUS_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="RefreshRight" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" style="margin-top: 20px">
      <BaseTable
        :data="dataList"
        :loading="loading"
        :total="total"
        :page="pagination.page"
        :page-size="pagination.pageSize"
        @page-change="handlePageChange"
        @size-change="handleSizeChange"
      >
        <template #toolbar>
          <div class="table-toolbar">
            <el-button type="primary" :icon="Plus" @click="handleAdd">新增活动</el-button>
          </div>
        </template>
        <el-table-column prop="name" label="活动名称" min-width="180" show-overflow-tooltip />
        <el-table-column label="类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small">{{ MARKETING_TYPE_MAP[(row as MarketingItem).type as any]?.label || (row as MarketingItem).type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="MARKETING_STATUS_MAP[(row as MarketingItem).status as any]?.type || 'info'">
              {{ MARKETING_STATUS_MAP[(row as MarketingItem).status as any]?.label || (row as MarketingItem).status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="开始时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime((row as MarketingItem).startTime) }}
          </template>
        </el-table-column>
        <el-table-column label="结束时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime((row as MarketingItem).endTime) }}
          </template>
        </el-table-column>
        <el-table-column label="预算/已用" width="160" align="right">
          <template #default="{ row }">
            <div>
              <div>预算: ¥{{ formatMoney((row as MarketingItem).totalBudget ?? 0) }}</div>
              <div class="used-row">
                <span>已用: ¥{{ formatMoney((row as MarketingItem).usedBudget ?? 0) }}</span>
                <el-progress
                  :percentage="getBudgetPercent(row as MarketingItem)"
                  :stroke-width="6"
                  :show-text="false"
                  style="width: 80px; display: inline-block; margin-left: 8px"
                />
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="最高佣金率" width="120" align="center">
          <template #default="{ row }">
            <span class="text-primary">
              {{ getMaxCommissionRate(row as MarketingItem) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="260" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link :icon="View" @click="handleDetail(row as MarketingItem)">详情</el-button>
            <el-button type="primary" link :icon="Edit" @click="handleEdit(row as MarketingItem)">编辑</el-button>
            <el-dropdown trigger="click" @command="(val: number) => handleStatusChange(row as MarketingItem, val)">
              <el-button type="warning" link>
                修改状态
                <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :command="0">草稿</el-dropdown-item>
                  <el-dropdown-item :command="1">进行中</el-dropdown-item>
                  <el-dropdown-item :command="2">已结束</el-dropdown-item>
                  <el-dropdown-item :command="3" divided>已取消</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <BaseConfirm @confirm="handleDelete((row as MarketingItem).id)">
              <el-button type="danger" link :icon="Delete">删除</el-button>
            </BaseConfirm>
          </template>
        </el-table-column>
      </BaseTable>
    </el-card>

    <BaseDialog
      v-model="dialogVisible"
      :title="dialogTitle"
      :loading="dialogLoading"
      width="700px"
      @confirm="handleSubmit"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="110px"
      >
        <el-row :gutter="16">
          <el-col :span="24">
            <el-form-item label="活动名称" prop="name">
              <el-input v-model="formData.name" placeholder="请输入活动名称" maxlength="50" show-word-limit />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="活动类型" prop="type">
              <el-select v-model="formData.type" placeholder="请选择活动类型" style="width: 100%">
                <el-option
                  v-for="item in MARKETING_TYPE_OPTIONS"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="活动状态" prop="status">
              <el-select v-model="formData.status" placeholder="请选择状态" style="width: 100%">
                <el-option
                  v-for="item in MARKETING_STATUS_OPTIONS"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="活动渠道">
              <el-select v-model="formData.channelId" placeholder="全渠道" clearable style="width: 100%">
                <el-option
                  v-for="item in channelOptions"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="预算金额" prop="totalBudget">
              <el-input-number v-model="formData.totalBudget" :min="0" :precision="2" :step="100" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="活动时间" prop="timeRange">
              <el-date-picker
                v-model="formData.timeRange"
                type="datetimerange"
                range-separator="至"
                start-placeholder="开始时间"
                end-placeholder="结束时间"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="折扣比例">
              <el-input-number v-model="formData.discountRate" :min="0" :max="1" :precision="2" :step="0.05" style="width: 100%" />
              <div class="form-tip">0.01 ~ 1，0.8 表示 8 折</div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="减免金额">
              <el-input-number v-model="formData.discountAmount" :min="0" :precision="2" :step="10" style="width: 100%" />
              <div class="form-tip">与折扣比例二选一</div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="最低门槛金额">
              <el-input-number v-model="formData.minAmount" :min="0" :precision="2" :step="10" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="发放总量">
              <el-input-number v-model="formData.totalCount" :min="0" :step="100" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="活动描述">
              <el-input
                v-model="formData.description"
                type="textarea"
                :rows="3"
                placeholder="请输入活动描述"
                maxlength="200"
                show-word-limit
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="活动规则">
              <el-input
                v-model="formData.rules"
                type="textarea"
                :rows="4"
                placeholder="请输入详细的活动规则"
                maxlength="1000"
                show-word-limit
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </BaseDialog>

    <BaseDialog
      v-model="detailVisible"
      title="活动详情"
      width="700px"
      :show-footer="false"
    >
      <el-descriptions v-if="detailData" :column="2" border size="small">
        <el-descriptions-item label="活动名称" :span="2">{{ detailData.name }}</el-descriptions-item>
        <el-descriptions-item label="活动类型">
          <el-tag>{{ MARKETING_TYPE_MAP[detailData.type as any]?.label || detailData.type }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="活动状态">
          <el-tag :type="MARKETING_STATUS_MAP[detailData.status as any]?.type || 'info'">
            {{ MARKETING_STATUS_MAP[detailData.status as any]?.label || detailData.status }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="活动渠道">{{ detailData.channelName || '全渠道' }}</el-descriptions-item>
        <el-descriptions-item label="预算金额">¥{{ formatMoney(detailData.totalBudget as any) }}</el-descriptions-item>
        <el-descriptions-item label="已用金额">
          <span :class="getBudgetPercent(detailData) > 90 ? 'text-danger' : ''">
            ¥{{ formatMoney(detailData.usedBudget as any) }} ({{ getBudgetPercent(detailData) }}%)
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="发放总量">{{ detailData.totalCount }}</el-descriptions-item>
        <el-descriptions-item label="已领取">{{ detailData.usedCount }}</el-descriptions-item>
        <el-descriptions-item label="开始时间" :span="2">{{ formatDateTime(detailData.startTime) }}</el-descriptions-item>
        <el-descriptions-item label="结束时间" :span="2">{{ formatDateTime(detailData.endTime) }}</el-descriptions-item>
        <el-descriptions-item label="折扣比例">{{ detailData.discountRate ? `${(detailData.discountRate * 100).toFixed(0)}%` : '-' }}</el-descriptions-item>
        <el-descriptions-item label="减免金额">{{ detailData.discountAmount ? `¥${formatMoney(detailData.discountAmount)}` : '-' }}</el-descriptions-item>
        <el-descriptions-item label="最低门槛">{{ detailData.minAmount ? `¥${formatMoney(detailData.minAmount)}` : '无限制' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatDateTime(detailData.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="活动描述" :span="2">{{ detailData.description || '-' }}</el-descriptions-item>
        <el-descriptions-item label="活动规则" :span="2">
          <div style="white-space: pre-wrap">{{ detailData.rules || '-' }}</div>
        </el-descriptions-item>
      </el-descriptions>
    </BaseDialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import {
  Search,
  RefreshRight,
  Plus,
  Edit,
  Delete,
  View,
  ArrowDown,
} from '@element-plus/icons-vue'
import BaseTable from '@/components/common/BaseTable.vue'
import BaseDialog from '@/components/common/BaseDialog.vue'
import BaseConfirm from '@/components/common/BaseConfirm.vue'
import { useTable } from '@/composables/useTable'
import { useDialog } from '@/composables/useDialog'
import {
  MARKETING_TYPE_OPTIONS,
  MARKETING_TYPE_MAP,
  MARKETING_STATUS_OPTIONS,
  MARKETING_STATUS_MAP,
} from '@/constants'
import { formatDateTime } from '@/utils/date'
import { formatMoney } from '@/utils/money'
import { getChannelList } from '@/api/channel'
import {
  getMarketingList,
  createMarketing,
  updateMarketing,
  deleteMarketing,
  updateMarketingStatus,
  getMarketing,
  type MarketingItem,
  type MarketingQueryParams,
} from '@/api/marketing'

const channelOptions = ref<Array<{ id: number | string; name: string }>>([])

async function fetchChannelOptions() {
  try {
    const res = await getChannelList({ page: 1, pageSize: 999, status: 1 as any })
    channelOptions.value = res.list.map((item) => ({ id: item.id, name: item.name }))
  } catch (error) {
    console.error('Fetch channels error:', error)
  }
}

onMounted(() => {
  fetchChannelOptions()
})

const {
  loading,
  dataList,
  total,
  pagination,
  queryParams,
  handleSearch,
  handleReset,
  handlePageChange,
  handleSizeChange,
  handleDelete: doDelete,
  fetchData,
} = useTable<MarketingItem, MarketingQueryParams>({
  fetchApi: getMarketingList,
  deleteApi: deleteMarketing,
})

const {
  visible: dialogVisible,
  loading: dialogLoading,
  dialogData,
  open: openDialog,
} = useDialog()

const formRef = ref<FormInstance>()
const isEdit = computed(() => !!dialogData.id)
const dialogTitle = computed(() => (isEdit.value ? '编辑活动' : '新增活动'))

const formData = reactive<any>({
  name: '',
  type: '',
  status: 0,
  channelId: undefined,
  totalBudget: 0,
  discountRate: undefined,
  discountAmount: undefined,
  minAmount: undefined,
  totalCount: undefined,
  timeRange: [],
  description: '',
  rules: '',
})

const formRules: FormRules = {
  name: [{ required: true, message: '请输入活动名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择活动类型', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
  totalBudget: [{ required: true, message: '请输入预算金额', trigger: 'blur' }],
  timeRange: [{ required: true, message: '请选择活动时间', trigger: 'change' }],
}

const detailVisible = ref(false)
const detailData = ref<MarketingItem | null>(null)

function handleAdd() {
  Object.assign(formData, {
    name: '',
    type: '',
    status: 0,
    channelId: undefined,
    totalBudget: 0,
    discountRate: undefined,
    discountAmount: undefined,
    minAmount: undefined,
    totalCount: undefined,
    timeRange: [],
    description: '',
    rules: '',
  })
  openDialog()
}

function handleEdit(row: MarketingItem) {
  Object.assign(formData, row, {
    timeRange: [row.startTime, row.endTime],
  })
  openDialog(row)
}

async function handleDetail(row: MarketingItem) {
  try {
    detailData.value = await getMarketing(row.id)
    detailVisible.value = true
  } catch (error) {
    console.error(error)
  }
}

function handleDelete(id: string | number) {
  doDelete(id)
}

async function handleStatusChange(row: MarketingItem, status: number) {
  try {
    await ElMessageBox.confirm(
      `确定要将活动【${row.name}】状态修改为【${MARKETING_STATUS_MAP[status]?.label}】吗？`,
      '状态确认',
      { type: 'warning' }
    )
    await updateMarketingStatus(row.id, status as any)
    ElMessage.success('状态修改成功')
    fetchData()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error(error)
    }
  }
}

function getBudgetPercent(row: MarketingItem): number {
  if (!row.totalBudget) return 0
  return Math.min(100, Math.round(((row.usedBudget || 0) / row.totalBudget) * 100))
}

function getMaxCommissionRate(row: MarketingItem): string {
  if (row.discountRate) {
    return `${((1 - row.discountRate) * 100).toFixed(0)}%`
  }
  return '-'
}

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    dialogLoading.value = true
    try {
      const submitData = { ...formData }
      if (submitData.timeRange?.length === 2) {
        submitData.startTime = submitData.timeRange[0]
        submitData.endTime = submitData.timeRange[1]
      }
      delete submitData.timeRange

      if (isEdit.value) {
        await updateMarketing(dialogData.id, submitData)
        ElMessage.success('编辑成功')
      } else {
        await createMarketing(submitData)
        ElMessage.success('新增成功')
      }
      dialogVisible.value = false
      handleSearch()
    } catch (error) {
      console.error(error)
    } finally {
      dialogLoading.value = false
    }
  })
}
</script>

<style scoped lang="scss">
.page-container {
  .search-form {
    margin-bottom: 0;
  }

  .table-toolbar {
    display: flex;
    gap: 12px;
  }
}

.used-row {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

.text-primary {
  color: var(--el-color-primary);
  font-weight: 600;
}

.text-danger {
  color: var(--el-color-danger);
  font-weight: 600;
}

.form-tip {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}
</style>
