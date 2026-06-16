<template>
  <div class="ccb-business-customer">
    <CcbPageHeader
      title="客户管理"
      description="客户信息查询与管理"
      icon="User"
    />

    <CcbSearchForm v-model="searchForm" @search="handleSearch" @reset="handleReset">
      <el-form-item label="客户姓名" prop="customerName">
        <el-input v-model="searchForm.customerName" placeholder="请输入客户姓名" clearable />
      </el-form-item>
      <el-form-item label="客户编号" prop="customerNo">
        <el-input v-model="searchForm.customerNo" placeholder="请输入客户编号" clearable />
      </el-form-item>
      <el-form-item label="证件号码" prop="idCardNo">
        <el-input v-model="searchForm.idCardNo" placeholder="请输入证件号码" clearable />
      </el-form-item>
      <el-form-item label="客户类型" prop="customerType">
        <el-select v-model="searchForm.customerType" placeholder="请选择客户类型" clearable>
          <el-option label="个人客户" :value="1" />
          <el-option label="企业客户" :value="2" />
          <el-option label="VIP客户" :value="3" />
        </el-select>
      </el-form-item>
      <el-form-item label="客户等级" prop="customerLevel">
        <el-select v-model="searchForm.customerLevel" placeholder="请选择客户等级" clearable>
          <el-option label="普通" :value="1" />
          <el-option label="黄金" :value="2" />
          <el-option label="铂金" :value="3" />
          <el-option label="钻石" :value="4" />
        </el-select>
      </el-form-item>
      <el-form-item label="开户时间" prop="timeRange">
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
        <el-button type="primary" :icon="Plus" @click="handleAdd">新增客户</el-button>
        <el-button type="success" :icon="Download" @click="handleExport">导出数据</el-button>
      </div>
      <div class="ccb-table-toolbar-right">
        <el-text type="info">
          客户总数：<el-text type="primary" size="large">{{ total }}</el-text>
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
      @selection-change="handleSelectionChange"
      @change="handlePageChange"
    >
      <el-table-column prop="customerNo" label="客户编号" width="180" />
      <el-table-column prop="customerName" label="客户姓名" width="120" />
      <el-table-column prop="customerTypeName" label="客户类型" width="100" />
      <el-table-column prop="customerLevelName" label="客户等级" width="100" />
      <el-table-column prop="idCardNo" label="证件号码" width="200">
        <template #default="{ row }">
          {{ maskPhone(row.idCardNo) }}
        </template>
      </el-table-column>
      <el-table-column prop="phone" label="联系电话" width="140">
        <template #default="{ row }">
          {{ maskPhone(row.phone) }}
        </template>
      </el-table-column>
      <el-table-column prop="totalAssets" label="总资产(元)" width="140" align="right">
        <template #default="{ row }">
          ¥{{ formatMoneyWithComma(row.totalAssets) }}
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)" effect="light" size="small">
            {{ getStatusLabel(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="开户时间" width="160" />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleView(row)">详情</el-button>
          <el-button type="warning" link size="small" @click="handleEdit(row)">编辑</el-button>
          <el-button v-if="row.status === 1" type="danger" link size="small" @click="handleDisable(row)">
            停用
          </el-button>
        </template>
      </el-table-column>
    </CcbTable>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Plus, Download } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { maskPhone, formatMoneyWithComma } from '@utils'

interface Customer {
  id: number
  customerNo: string
  customerName: string
  customerType: number
  customerTypeName: string
  customerLevel: number
  customerLevelName: string
  idCardNo: string
  phone: string
  totalAssets: number
  status: number
  statusName: string
  createdAt: string
}

const loading = ref<boolean>(false)
const tableData = ref<Customer[]>([])
const total = ref<number>(0)
const selectedRows = ref<Customer[]>([])

const searchForm = reactive({
  customerName: '',
  customerNo: '',
  idCardNo: '',
  customerType: null as number | null,
  customerLevel: null as number | null,
  timeRange: [] as string[]
})

const pageParams = reactive({
  page: 1,
  pageSize: 10
})

const mockCustomers: Customer[] = Array.from({ length: 25 }, (_, i) => ({
  id: i + 1,
  customerNo: `CUS${String(100000 + i).padStart(6, '0')}`,
  customerName: ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十'][i % 8],
  customerType: i % 3 + 1,
  customerTypeName: ['个人客户', '企业客户', 'VIP客户'][i % 3],
  customerLevel: i % 4 + 1,
  customerLevelName: ['普通', '黄金', '铂金', '钻石'][i % 4],
  idCardNo: `110101${1990 + (i % 20)}0101${String(1000 + i).padStart(4, '0')}`,
  phone: `138${String(10000000 + i).padStart(8, '0')}`,
  totalAssets: (i + 1) * 156800.58,
  status: i % 3,
  statusName: ['正常', '冻结', '停用'][i % 3],
  createdAt: `2024-0${(i % 9) + 1}-${String((i % 28) + 1).padStart(2, '0')}`
}))

const getStatusType = (status: number): string => {
  const types: Record<number, string> = {
    0: 'success',
    1: 'warning',
    2: 'danger'
  }
  return types[status] || ''
}

const getStatusLabel = (status: number): string => {
  const labels: Record<number, string> = {
    0: '正常',
    1: '冻结',
    2: '停用'
  }
  return labels[status] || ''
}

const fetchData = (): void => {
  loading.value = true
  setTimeout(() => {
    const start = (pageParams.page - 1) * pageParams.pageSize
    const end = start + pageParams.pageSize
    tableData.value = mockCustomers.slice(start, end)
    total.value = mockCustomers.length
    loading.value = false
  }, 500)
}

const handleSearch = (): void => {
  pageParams.page = 1
  fetchData()
}

const handleReset = (): void => {
  pageParams.page = 1
  fetchData()
}

const handlePageChange = (): void => {
  fetchData()
}

const handleSelectionChange = (val: unknown[]): void => {
  selectedRows.value = val as Customer[]
}

const handleAdd = (): void => {
  ElMessage.info('新增客户')
}

const handleView = (row: Customer): void => {
  ElMessage.info(`查看客户详情：${row.customerName}`)
}

const handleEdit = (row: Customer): void => {
  ElMessage.info(`编辑客户：${row.customerName}`)
}

const handleDisable = (row: Customer): void => {
  ElMessageBox.confirm(`确定要停用客户"${row.customerName}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      ElMessage.success('停用成功')
    })
    .catch(() => {})
}

const handleExport = (): void => {
  ElMessage.success('导出任务已提交，请在任务中心查看')
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.ccb-business-customer {
}
</style>
