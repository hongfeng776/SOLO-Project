<template>
  <div class="page-container">
    <el-card shadow="never">
      <el-form :inline="true" :model="queryParams" class="search-form">
        <el-form-item label="推客编号/姓名/手机号">
          <el-input
            v-model="queryParams.keyword"
            placeholder="请输入关键词"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="渠道">
          <el-select
            v-model="queryParams.channelId"
            placeholder="请选择"
            clearable
            style="width: 150px"
          >
            <el-option
              v-for="item in channelOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="等级">
          <el-select
            v-model="queryParams.level"
            placeholder="请选择"
            clearable
            style="width: 150px"
          >
            <el-option
              v-for="item in PROMOTER_LEVEL_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="queryParams.status"
            placeholder="请选择"
            clearable
            style="width: 150px"
          >
            <el-option
              v-for="item in PROMOTER_STATUS_OPTIONS"
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
      <BaseBatchOperation
        :selected-count="selectedIds.length"
        @clear="handleClearSelection"
      >
        <BaseConfirm title="确定删除选中数据吗？" @confirm="handleBatchDelete">
          <el-button type="danger" size="small" :icon="Delete">批量删除</el-button>
        </BaseConfirm>
        <el-button
          type="primary"
          size="small"
          :icon="Switch"
          :disabled="selectedIds.length === 0"
          @click="handleBatchStatus(1)"
        >
          批量启用
        </el-button>
        <el-button
          type="warning"
          size="small"
          :icon="Switch"
          :disabled="selectedIds.length === 0"
          @click="handleBatchStatus(0)"
        >
          批量冻结
        </el-button>
      </BaseBatchOperation>

      <BaseTable
        :data="dataList"
        :loading="loading"
        :total="total"
        :page="pagination.page"
        :page-size="pagination.pageSize"
        show-selection
        @selection-change="handleSelectionChange"
        @page-change="handlePageChange"
        @size-change="handleSizeChange"
      >
        <template #toolbar>
          <div class="table-toolbar">
            <el-button type="primary" :icon="Plus" @click="handleAdd">新增推客</el-button>
            <el-button :icon="Download" @click="handleExport">导出</el-button>
          </div>
        </template>
        <el-table-column prop="id" label="编号" width="80" align="center" />
        <el-table-column prop="name" label="姓名" min-width="120" />
        <el-table-column label="头像" width="80" align="center">
          <template #default="{ row }">
            <el-avatar :size="32" :src="(row as PromoterItem).avatar || undefined">
              {{ (row as PromoterItem).name?.charAt(0) || 'U' }}
            </el-avatar>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="channelName" label="渠道" width="120" />
        <el-table-column label="等级" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="PROMOTER_LEVEL_MAP[(row as PromoterItem).level]?.type || 'info'">
              {{ PROMOTER_LEVEL_MAP[(row as PromoterItem).level]?.label || 'L1 初级' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="totalOrders" label="总订单数" width="100" align="right">
          <template #default="{ row }">
            {{ (row as PromoterItem).totalOrders || 0 }}
          </template>
        </el-table-column>
        <el-table-column prop="totalAmount" label="累计金额" width="120" align="right">
          <template #default="{ row }">
            ¥{{ formatMoney((row as PromoterItem).totalAmount ?? 0) }}
          </template>
        </el-table-column>
        <el-table-column prop="totalCommission" label="累计佣金" width="120" align="right">
          <template #default="{ row }">
            ¥{{ formatMoney((row as PromoterItem).totalCommission) }}
          </template>
        </el-table-column>
        <el-table-column prop="availableCommission" label="可用佣金" width="120" align="right">
          <template #default="{ row }">
            <span class="text-success">¥{{ formatMoney((row as PromoterItem).availableCommission ?? 0) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="PROMOTER_STATUS_MAP[(row as PromoterItem).status as number]?.type || 'info'">
              {{ PROMOTER_STATUS_MAP[(row as PromoterItem).status as number]?.label || (row as PromoterItem).status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="注册时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime((row as PromoterItem).createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="340" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link :icon="View" @click="handleDetail(row as PromoterItem)">详情</el-button>
            <el-button type="primary" link :icon="Edit" @click="handleEdit(row as PromoterItem)">编辑</el-button>
            <el-button
              v-if="(row as PromoterItem).status === 2"
              type="success"
              link
              @click="handleApprove(row as PromoterItem)"
            >审核</el-button>
            <el-dropdown
              v-if="(row as PromoterItem).status !== -1"
              trigger="click"
              @command="(val: number) => handleStatusChange(row as PromoterItem, val)"
            >
              <el-button type="warning" link>
                启停用
                <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :command="1">启用</el-dropdown-item>
                  <el-dropdown-item :command="0">冻结</el-dropdown-item>
                  <el-dropdown-item :command="-1" divided>注销</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <BaseConfirm @confirm="handleDelete((row as PromoterItem).id)">
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
      width="600px"
      @confirm="handleSubmit"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="姓名" prop="name">
          <el-input v-model="formData.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="formData.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="头像">
          <el-upload
            :auto-upload="false"
            :show-file-list="false"
            @change="handleAvatarChange"
          >
            <el-avatar :size="64" :src="formData.avatar || undefined">
              {{ formData.name?.charAt(0) || 'U' }}
            </el-avatar>
          </el-upload>
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="formData.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="微信号">
          <el-input v-model="formData.wechat" placeholder="请输入微信号" />
        </el-form-item>
        <el-form-item label="渠道" prop="channelId">
          <el-select v-model="formData.channelId" placeholder="请选择渠道" style="width: 100%">
            <el-option
              v-for="item in channelOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="等级" prop="level">
          <el-radio-group v-model="formData.level">
            <el-radio v-for="item in PROMOTER_LEVEL_OPTIONS" :key="item.value" :value="item.value">
              {{ item.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio :value="1">正常</el-radio>
            <el-radio :value="0">冻结</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
    </BaseDialog>

    <BaseDialog
      v-model="detailVisible"
      title="推客详情"
      width="600px"
      :show-footer="false"
    >
      <el-descriptions v-if="detailData" :column="2" border>
        <el-descriptions-item label="推客编号">{{ detailData.id }}</el-descriptions-item>
        <el-descriptions-item label="姓名">{{ detailData.name }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ detailData.phone }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ detailData.email || '-' }}</el-descriptions-item>
        <el-descriptions-item label="微信号">{{ detailData.wechat || '-' }}</el-descriptions-item>
        <el-descriptions-item label="渠道">{{ detailData.channelName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="等级">
          <el-tag :type="PROMOTER_LEVEL_MAP[detailData.level]?.type || 'info'">
            {{ PROMOTER_LEVEL_MAP[detailData.level]?.label || 'L1 初级' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="PROMOTER_STATUS_MAP[detailData.status as number]?.type || 'info'">
              {{ PROMOTER_STATUS_MAP[detailData.status as number]?.label || detailData.status }}
            </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="总订单数">{{ detailData.totalOrders || 0 }}</el-descriptions-item>
        <el-descriptions-item label="累计金额">¥{{ formatMoney(detailData.totalAmount as any) }}</el-descriptions-item>
        <el-descriptions-item label="累计佣金">¥{{ formatMoney(detailData.totalCommission) }}</el-descriptions-item>
        <el-descriptions-item label="可用佣金">
          <span class="text-success">¥{{ formatMoney(detailData.availableCommission as any) }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="注册时间">{{ formatDateTime(detailData.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ formatDateTime(detailData.updatedAt) }}</el-descriptions-item>
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
  Download,
  View,
  Switch,
  ArrowDown,
} from '@element-plus/icons-vue'
import BaseTable from '@/components/common/BaseTable.vue'
import BaseDialog from '@/components/common/BaseDialog.vue'
import BaseConfirm from '@/components/common/BaseConfirm.vue'
import BaseBatchOperation from '@/components/common/BaseBatchOperation.vue'
import { useTable } from '@/composables/useTable'
import { useDialog } from '@/composables/useDialog'
import {
  PROMOTER_LEVEL_OPTIONS,
  PROMOTER_LEVEL_MAP,
  PROMOTER_STATUS_OPTIONS,
  PROMOTER_STATUS_MAP,
} from '@/constants'
import { formatDateTime } from '@/utils/date'
import { formatMoney } from '@/utils/money'
import { getChannelList } from '@/api/channel'
import {
  getPromoterList,
  createPromoter,
  updatePromoter,
  deletePromoter,
  batchDeletePromoters,
  updatePromoterStatus,
  batchUpdatePromoterStatus,
  approvePromoter,
  rejectPromoter,
  getPromoter,
  type PromoterItem,
  type PromoterQueryParams,
} from '@/api/promoter'

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
  selectedIds,
  pagination,
  queryParams,
  handleSearch,
  handleReset,
  handlePageChange,
  handleSizeChange,
  handleSelectionChange,
  handleDelete: doDelete,
  handleBatchDelete: doBatchDelete,
  clearSelection,
  fetchData,
} = useTable<PromoterItem, PromoterQueryParams>({
  fetchApi: getPromoterList,
  deleteApi: deletePromoter,
  batchDeleteApi: batchDeletePromoters,
})

const {
  visible: dialogVisible,
  loading: dialogLoading,
  dialogData,
  open: openDialog,
} = useDialog()

const formRef = ref<FormInstance>()
const isEdit = computed(() => !!dialogData.id)
const dialogTitle = computed(() => (isEdit.value ? '编辑推客' : '新增推客'))

const formData = reactive<any>({
  name: '',
  phone: '',
  avatar: '',
  email: '',
  wechat: '',
  channelId: undefined,
  level: 1,
  status: 1,
})

const formRules: FormRules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' },
  ],
  channelId: [{ required: true, message: '请选择渠道', trigger: 'change' }],
  level: [{ required: true, message: '请选择等级', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
}

const detailVisible = ref(false)
const detailData = ref<PromoterItem | null>(null)

function handleClearSelection() {
  clearSelection()
}

function handleAvatarChange(file: any) {
  if (file?.raw) {
    const reader = new FileReader()
    reader.onload = (e) => {
      formData.avatar = e.target?.result as string
    }
    reader.readAsDataURL(file.raw)
  }
}

function handleAdd() {
  Object.assign(formData, {
    name: '',
    phone: '',
    avatar: '',
    email: '',
    wechat: '',
    channelId: undefined,
    level: 1,
    status: 1,
  })
  openDialog()
}

function handleEdit(row: PromoterItem) {
  Object.assign(formData, row)
  openDialog(row)
}

async function handleDetail(row: PromoterItem) {
  try {
    detailData.value = await getPromoter(row.id)
    detailVisible.value = true
  } catch (error) {
    console.error(error)
  }
}

function handleDelete(id: string | number) {
  doDelete(id)
}

function handleBatchDelete() {
  doBatchDelete()
}

async function handleStatusChange(row: PromoterItem, status: number) {
  try {
    await ElMessageBox.confirm(
      `确定要将推客【${row.name}】状态修改为【${PROMOTER_STATUS_MAP[status]?.label}】吗？`,
      '状态确认',
      { type: 'warning' }
    )
    await updatePromoterStatus(row.id, status as any)
    ElMessage.success('状态修改成功')
    fetchData()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error(error)
    }
  }
}

async function handleApprove(row: PromoterItem) {
  try {
    await ElMessageBox.confirm(
      `请选择对推客【${row.name}】的审核结果`,
      '推客审核',
      {
        distinguishCancelAndClose: true,
        confirmButtonText: '审核通过',
        cancelButtonText: '审核拒绝',
        type: 'warning',
      }
    )
    await approvePromoter(row.id)
    ElMessage.success('审核通过成功')
    fetchData()
  } catch (action: any) {
    if (action === 'cancel') {
      try {
        const { value } = await ElMessageBox.prompt('请输入拒绝原因', '审核拒绝', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          inputValidator: (val: string) => (val ? true : '请输入拒绝原因'),
        })
        await rejectPromoter(row.id, value)
        ElMessage.success('审核拒绝成功')
        fetchData()
      } catch (innerError: any) {
        if (innerError !== 'cancel' && innerError !== 'close') {
          console.error(innerError)
        }
      }
    } else if (action !== 'close') {
      console.error(action)
    }
  }
}

async function handleBatchStatus(status: number) {
  if (selectedIds.value.length === 0) return
  try {
    await ElMessageBox.confirm(
      `确定要将选中的 ${selectedIds.value.length} 条数据状态修改为【${PROMOTER_STATUS_MAP[status]?.label}】吗？`,
      '批量状态确认',
      { type: 'warning' }
    )
    const loadingInstance = ElMessage({
      message: `正在批量更新 ${selectedIds.value.length} 条数据状态...`,
      type: 'info',
      duration: 0,
    })
    try {
      await batchUpdatePromoterStatus(selectedIds.value, status as any)
      loadingInstance.close()
      ElMessage.success('批量状态修改成功')
      selectedIds.value = []
      fetchData()
    } catch (error) {
      loadingInstance.close()
      throw error
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error(error)
    }
  }
}

function handleExport() {
  ElMessage.info('导出功能开发中')
}

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    dialogLoading.value = true
    try {
      if (isEdit.value) {
        await updatePromoter(dialogData.id, formData)
        ElMessage.success('编辑成功')
      } else {
        await createPromoter(formData as any)
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

.text-success {
  color: var(--el-color-success);
  font-weight: 600;
}
</style>
