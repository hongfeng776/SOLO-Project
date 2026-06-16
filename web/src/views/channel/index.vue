<template>
  <div class="page-container">
    <el-card shadow="never">
      <el-form :inline="true" :model="queryParams" class="search-form">
        <el-form-item label="关键词">
          <el-input
            v-model="queryParams.keyword"
            placeholder="请输入渠道名称/编码"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="渠道类型">
          <el-select
            v-model="queryParams.type"
            placeholder="请选择"
            clearable
            style="width: 150px"
          >
            <el-option
              v-for="item in CHANNEL_TYPE_OPTIONS"
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
              v-for="item in STATUS_OPTIONS"
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
            <el-button type="primary" :icon="Plus" @click="handleAdd">新增渠道</el-button>
            <el-button :icon="Download" @click="handleExport">导出</el-button>
          </div>
        </template>
        <el-table-column prop="code" label="渠道编码" width="140" />
        <el-table-column prop="name" label="渠道名称" min-width="150" />
        <el-table-column label="渠道类型" width="120" align="center">
          <template #default="{ row }">
            <span>{{ getChannelTypeLabel((row as ChannelItem).type) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="contactName" label="联系人" width="120" />
        <el-table-column prop="contactPhone" label="联系电话" width="140" />
        <el-table-column prop="commissionRate" label="佣金比例(%)" width="120" align="right">
          <template #default="{ row }">
            {{ formatDecimal((row as ChannelItem).commissionRate) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="STATUS_MAP[(row as ChannelItem).status]?.type || 'info'">
              {{ STATUS_MAP[(row as ChannelItem).status]?.label || (row as ChannelItem).status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime((row as ChannelItem).createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link :icon="Edit" @click="handleEdit(row as ChannelItem)">编辑</el-button>
            <BaseConfirm @confirm="handleDelete((row as ChannelItem).id)">
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
        <el-form-item label="渠道名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入渠道名称" />
        </el-form-item>
        <el-form-item label="渠道编码" prop="code">
          <el-input v-model="formData.code" placeholder="请输入渠道编码" />
        </el-form-item>
        <el-form-item label="渠道类型" prop="type">
          <el-select v-model="formData.type" placeholder="请选择渠道类型" style="width: 100%">
            <el-option
              v-for="item in CHANNEL_TYPE_OPTIONS"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="联系人" prop="contactName">
              <el-input v-model="formData.contactName" placeholder="请输入联系人" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="contactPhone">
              <el-input v-model="formData.contactPhone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="联系邮箱" prop="contactEmail">
          <el-input v-model="formData.contactEmail" placeholder="请输入联系邮箱" />
        </el-form-item>
        <el-form-item label="佣金比例(%)" prop="commissionRate">
          <el-input-number
            v-model="formData.commissionRate"
            :min="0"
            :max="100"
            :precision="4"
            :step="0.1"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="formData.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注"
          />
        </el-form-item>
      </el-form>
    </BaseDialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Search, RefreshRight, Plus, Edit, Delete, Download } from '@element-plus/icons-vue'
import BaseTable from '@/components/common/BaseTable.vue'
import BaseDialog from '@/components/common/BaseDialog.vue'
import BaseConfirm from '@/components/common/BaseConfirm.vue'
import BaseBatchOperation from '@/components/common/BaseBatchOperation.vue'
import { useTable } from '@/composables/useTable'
import { useDialog } from '@/composables/useDialog'
import { STATUS_OPTIONS, STATUS_MAP, CHANNEL_TYPE_OPTIONS } from '@/constants'
import { formatDateTime, formatDecimal } from '@/utils/date'
import {
  getChannelList,
  createChannel,
  updateChannel,
  deleteChannel,
  batchDeleteChannels,
  type ChannelItem,
  type ChannelQueryParams,
  type ChannelType,
} from '@/api/channel'

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
} = useTable<ChannelItem, ChannelQueryParams>({
  fetchApi: getChannelList,
  deleteApi: deleteChannel,
  batchDeleteApi: batchDeleteChannels,
})

const {
  visible: dialogVisible,
  loading: dialogLoading,
  dialogData,
  open: openDialog,
} = useDialog()

const formRef = ref<FormInstance>()
const isEdit = computed(() => !!dialogData.id)
const dialogTitle = computed(() => (isEdit.value ? '编辑渠道' : '新增渠道'))

const formData = reactive<Partial<ChannelItem>>({
  name: '',
  code: '',
  type: 'other',
  contactName: '',
  contactPhone: '',
  contactEmail: '',
  commissionRate: 0,
  status: 1,
  remark: '',
})

const formRules: FormRules = {
  name: [{ required: true, message: '请输入渠道名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入渠道编码', trigger: 'blur' }],
  type: [{ required: true, message: '请选择渠道类型', trigger: 'change' }],
  commissionRate: [{ required: true, message: '请输入佣金比例', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
}

function getChannelTypeLabel(type: ChannelType): string {
  const option = CHANNEL_TYPE_OPTIONS.find(o => o.value === type)
  return option?.label || type
}

function handleClearSelection() {
  clearSelection()
}

function handleAdd() {
  Object.assign(formData, {
    name: '',
    code: '',
    type: 'other',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    commissionRate: 0,
    status: 1,
    remark: '',
  })
  openDialog()
}

function handleEdit(row: ChannelItem) {
  Object.assign(formData, row)
  openDialog(row)
}

function handleDelete(id: string | number) {
  doDelete(id)
}

function handleBatchDelete() {
  doBatchDelete()
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
        await updateChannel(dialogData.id, formData)
        ElMessage.success('编辑成功')
      } else {
        await createChannel(formData as any)
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
</style>
