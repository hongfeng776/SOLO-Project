<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import type { FormInstance } from 'element-plus'
import QyDataTable from '@/components/QyDataTable/index.vue'
import QyTableToolbar from '@/components/QyTableToolbar/index.vue'
import { COPYRIGHT_TYPE, getEnumOptions, getEnumLabel, getEnumItem } from '@/constants/enums'
import {
  getCopyrightListApi,
  createCopyrightApi,
  updateCopyrightApi,
  deleteCopyrightApi,
} from '@/api/copyright'
import type { CopyrightItem } from '@/types'
import { formatDate } from '@/utils'

const loading = ref(false)
const listData = ref<CopyrightItem[]>([])
const total = ref(0)

const queryParams = reactive({
  page: 1,
  pageSize: 10,
  keyword: '',
  type: null as number | null,
  status: null as number | null,
})

const loadData = async () => {
  loading.value = true
  try {
    const result = await getCopyrightListApi({ ...queryParams })
    listData.value = result.list
    total.value = result.pagination.total
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  queryParams.page = 1
  loadData()
}

const handleReset = () => {
  queryParams.keyword = ''
  queryParams.type = null
  queryParams.status = null
  handleSearch()
}

const handlePageChange = (page: number) => {
  queryParams.page = page
  loadData()
}

const handleSizeChange = (pageSize: number) => {
  queryParams.pageSize = pageSize
  queryParams.page = 1
  loadData()
}

const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit' | 'view'>('create')
const formRef = ref<FormInstance>()

const formData = reactive<Partial<CopyrightItem>>({
  code: '',
  name: '',
  type: 1,
  supplierName: '',
  supplierContact: '',
  supplierPhone: '',
  contractNo: '',
  startDate: '',
  endDate: '',
  territories: '',
  licenseFee: 0,
  paymentStatus: 0,
  description: '',
  status: 1,
  remark: '',
})

const formRules = {
  code: [{ required: true, message: '请输入版权编号', trigger: 'blur' }],
  name: [{ required: true, message: '请输入版权名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择版权类型', trigger: 'change' }],
  supplierName: [{ required: true, message: '请输入供应方名称', trigger: 'blur' }],
  startDate: [{ required: true, message: '请选择授权开始日期', trigger: 'change' }],
  endDate: [{ required: true, message: '请选择授权结束日期', trigger: 'change' }],
}

const openDialog = (mode: 'create' | 'edit' | 'view', row?: CopyrightItem) => {
  dialogMode.value = mode
  if (row) {
    Object.assign(formData, row)
  } else {
    Object.assign(formData, {
      code: '',
      name: '',
      type: 1,
      supplierName: '',
      supplierContact: '',
      supplierPhone: '',
      contractNo: '',
      startDate: '',
      endDate: '',
      territories: '',
      licenseFee: 0,
      paymentStatus: 0,
      description: '',
      status: 1,
      remark: '',
    })
  }
  dialogVisible.value = true
}

const handleSubmit = async () => {
  await formRef.value?.validate()
  loading.value = true
  try {
    if (dialogMode.value === 'create') {
      await createCopyrightApi(formData)
      ElMessage.success('创建成功')
    } else {
      await updateCopyrightApi(formData.id!, formData)
      ElMessage.success('更新成功')
    }
    dialogVisible.value = false
    loadData()
  } finally {
    loading.value = false
  }
}

const handleDelete = async (row: CopyrightItem) => {
  await ElMessageBox.confirm('确定要删除该版权信息吗？', '提示', { type: 'warning' })
  loading.value = true
  try {
    await deleteCopyrightApi(row.id)
    ElMessage.success('删除成功')
    loadData()
  } finally {
    loading.value = false
  }
}

const tableColumns = [
  { prop: 'id', label: 'ID', width: 70, align: 'center' },
  { prop: 'code', label: '版权编号', width: 140 },
  { prop: 'name', label: '版权名称', minWidth: 180, showOverflowTooltip: true },
  {
    prop: 'type',
    label: '版权类型',
    width: 110,
    align: 'center',
    slot: 'type',
  },
  { prop: 'supplierName', label: '供应方', minWidth: 150, showOverflowTooltip: true },
  {
    label: '授权期限',
    width: 260,
    align: 'center',
    slot: 'period',
  },
  {
    prop: 'contentCount',
    label: '关联内容',
    width: 100,
    align: 'center',
  },
  {
    prop: 'status',
    label: '状态',
    width: 90,
    align: 'center',
    slot: 'status',
  },
  { label: '操作', width: 200, fixed: 'right', align: 'center', slot: 'actions' },
]

const typeOptions = computed(() => getEnumOptions(COPYRIGHT_TYPE))

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="copyright-page">
    <div class="filter-bar">
      <el-form :inline="true" :model="queryParams" @submit.prevent>
        <el-form-item label="关键词">
          <el-input
            v-model="queryParams.keyword"
            placeholder="编号/名称/供应方/合同号"
            clearable
            style="width: 220px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="版权类型">
          <el-select
            v-model="queryParams.type"
            placeholder="全部类型"
            clearable
            style="width: 160px"
          >
            <el-option
              v-for="item in typeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="queryParams.status"
            placeholder="全部状态"
            clearable
            style="width: 140px"
          >
            <el-option label="生效中" :value="1" />
            <el-option label="已失效" :value="0" />
            <el-option label="即将到期" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="RefreshLeft" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="card-content">
      <QyTableToolbar
        :loading="loading"
        :show-batch-actions="false"
        @create="openDialog('create')"
        @refresh="loadData"
        create-text="新增版权"
      />

      <QyDataTable
        :columns="tableColumns"
        :data="listData"
        :loading="loading"
        :total="total"
        :page="queryParams.page"
        :page-size="queryParams.pageSize"
        :index="true"
        @page-change="handlePageChange"
        @size-change="handleSizeChange"
      >
        <template #type="{ row }">
          <el-tag
            :type="getEnumItem(COPYRIGHT_TYPE, row.type)?.type || 'info'"
            size="small"
          >
            {{ getEnumLabel(COPYRIGHT_TYPE, row.type) }}
          </el-tag>
        </template>

        <template #period="{ row }">
          <div style="font-size: 12px;">
            <div>{{ formatDate(row.startDate, 'YYYY-MM-DD') }}</div>
            <div style="color: #909399">至 {{ formatDate(row.endDate, 'YYYY-MM-DD') }}</div>
          </div>
        </template>

        <template #status="{ row }">
          <el-tag
            :type="row.status === 1 ? 'success' : row.status === 2 ? 'warning' : 'info'"
            size="small"
          >
            {{ row.status === 1 ? '生效中' : row.status === 2 ? '即将到期' : '已失效' }}
          </el-tag>
        </template>

        <template #actions="{ row }">
          <el-button type="primary" link :icon="View" @click="openDialog('view', row)">查看</el-button>
          <el-button type="primary" link :icon="Edit" @click="openDialog('edit', row)">编辑</el-button>
          <el-button type="danger" link :icon="Delete" @click="handleDelete(row)">删除</el-button>
        </template>
      </QyDataTable>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '新增版权' : dialogMode === 'edit' ? '编辑版权' : '版权详情'"
      width="720px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
        :disabled="dialogMode === 'view'"
      >
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="版权编号" prop="code">
              <el-input v-model="formData.code" placeholder="请输入版权编号" maxlength="50" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="版权类型" prop="type">
              <el-select v-model="formData.type" placeholder="请选择" style="width: 100%">
                <el-option
                  v-for="item in typeOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="版权名称" prop="name">
              <el-input v-model="formData.name" placeholder="请输入版权名称" maxlength="255" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="供应方名称" prop="supplierName">
              <el-input v-model="formData.supplierName" placeholder="请输入供应方名称" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="联系人">
              <el-input v-model="formData.supplierContact" placeholder="联系人" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="联系电话">
              <el-input v-model="formData.supplierPhone" placeholder="电话" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="合同编号">
              <el-input v-model="formData.contractNo" placeholder="请输入合同编号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="授权地区">
              <el-input v-model="formData.territories" placeholder="如：中国大陆、港澳台" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="授权开始" prop="startDate">
              <el-date-picker
                v-model="formData.startDate"
                type="date"
                placeholder="选择日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="授权结束" prop="endDate">
              <el-date-picker
                v-model="formData.endDate"
                type="date"
                placeholder="选择日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="授权费用">
              <el-input-number v-model="formData.licenseFee" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="付款状态">
              <el-select v-model="formData.paymentStatus" style="width: 100%">
                <el-option label="未支付" :value="0" />
                <el-option label="部分支付" :value="1" />
                <el-option label="已支付" :value="2" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="状态">
              <el-radio-group v-model="formData.status">
                <el-radio :value="1">生效</el-radio>
                <el-radio :value="0">失效</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
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
              <el-input v-model="formData.remark" placeholder="备注信息" maxlength="500" show-word-limit />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ dialogMode === 'view' ? '关闭' : '取消' }}</el-button>
        <el-button v-if="dialogMode !== 'view'" type="primary" :loading="loading" @click="handleSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.copyright-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
