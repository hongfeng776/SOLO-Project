<template>
  <div class="ccb-business-account">
    <CcbPageHeader
      title="账户管理"
      description="银行账户信息查询与状态管理"
      icon="Wallet"
    />

    <CcbSearchForm v-model="searchForm" @search="handleSearch" @reset="handleReset">
      <el-form-item label="账户号" prop="keyword">
        <el-input v-model="searchForm.keyword" placeholder="请输入账户号" clearable />
      </el-form-item>
      <el-form-item label="账户类型" prop="accountType">
        <el-select v-model="searchForm.accountType" placeholder="全部" clearable>
          <el-option label="一类账户" :value="1" />
          <el-option label="二类账户" :value="2" />
          <el-option label="三类账户" :value="3" />
        </el-select>
      </el-form-item>
      <el-form-item label="账户状态" prop="status">
        <el-select v-model="searchForm.status" placeholder="全部" clearable>
          <el-option label="正常" :value="1" />
          <el-option label="冻结" :value="2" />
          <el-option label="挂失" :value="3" />
          <el-option label="休眠" :value="4" />
          <el-option label="已注销" :value="0" />
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
        <el-tag type="primary" effect="dark">账户总数：{{ total }}</el-tag>
        <el-tag type="success" effect="light" style="margin-left: 8px">
          正常：{{ tableData.filter(r => r.status === 1).length }}
        </el-tag>
        <el-tag type="danger" effect="light" style="margin-left: 8px">
          异常：{{ tableData.filter(r => r.status !== 1).length }}
        </el-tag>
      </div>
      <div class="ccb-table-toolbar-right">
        <el-button type="success" :icon="Download">导出数据</el-button>
      </div>
    </div>

    <CcbTable
      v-model:page="pageParams.page"
      v-model:page-size="pageParams.pageSize"
      :loading="loading"
      :data="tableData"
      :total="total"
      :show-index="true"
      row-class-name="account-row"
      @change="handlePageChange"
    >
      <el-table-column prop="accountNo" label="账户号" width="220">
        <template #default="{ row }">
          <span class="acct-no">{{ row.accountNo }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="alias" label="账户别名" width="140" />
      <el-table-column prop="customerName" label="客户姓名" width="100" />
      <el-table-column prop="customerNo" label="客户编号" width="180" />
      <el-table-column prop="accountTypeText" label="账户类型" width="140" />
      <el-table-column prop="currency" label="币种" width="80" />
      <el-table-column prop="balance" label="余额(元)" width="140" align="right">
        <template #default="{ row }">
          <span class="balance">{{ formatMoney(row.balance) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="availableBalance" label="可用余额(元)" width="140" align="right">
        <template #default="{ row }">
          {{ formatMoney(row.availableBalance) }}
        </template>
      </el-table-column>
      <el-table-column prop="frozenAmount" label="冻结金额(元)" width="120" align="right">
        <template #default="{ row }">
          <span v-if="Number(row.frozenAmount) > 0" class="frozen">{{ formatMoney(row.frozenAmount) }}</span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="dailyLimit" label="日限额(元)" width="120" align="right">
        <template #default="{ row }">{{ formatMoney(row.dailyLimit) }}</template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)" effect="light" size="small">
            {{ getStatusLabel(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="openOrgName" label="开户机构" width="140" />
      <el-table-column prop="openOperatorName" label="开户操作员" width="110" />
      <el-table-column prop="openDate" label="开户时间" width="160" />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleView(row)">详情</el-button>
          <el-button v-if="row.status === 1" type="warning" link size="small" @click="handleStatus(row, 2)">冻结</el-button>
          <el-button v-if="row.status === 2" type="success" link size="small" @click="handleStatus(row, 1)">解冻</el-button>
          <el-button v-if="row.status !== 0" type="danger" link size="small" @click="handleStatus(row, 0)">注销</el-button>
        </template>
      </el-table-column>
    </CcbTable>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Download } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getAccountListApi, updateAccountStatusApi,
  type Account
} from '@api/account'

const loading = ref<boolean>(false)
const tableData = ref<Account[]>([])
const total = ref<number>(0)

const searchForm = reactive({
  keyword: '',
  accountType: null as number | null,
  status: null as number | null,
  timeRange: [] as string[]
})

const pageParams = reactive({ page: 1, pageSize: 10 })

const statusOptions: Record<number, string> = {
  0: '已注销', 1: '正常', 2: '冻结', 3: '挂失', 4: '休眠'
}

const formatMoney = (v: number): string => Number(v || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const getStatusType = (s: number): string => {
  if (s === 1) return 'success'
  if (s === 0) return 'info'
  return 'warning'
}
const getStatusLabel = (s: number) => statusOptions[s] || '未知'

const fetchData = async () => {
  loading.value = true
  try {
    const params: any = {
      page: pageParams.page,
      pageSize: pageParams.pageSize,
      keyword: searchForm.keyword || undefined,
      account_type: searchForm.accountType ?? undefined,
      status: searchForm.status ?? undefined,
      start_time: searchForm.timeRange?.[0],
      end_time: searchForm.timeRange?.[1]
    }
    const res = await getAccountListApi(params)
    tableData.value = res.list || []
    total.value = res.total || 0
  } catch (e: any) {
    ElMessage.error(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => { pageParams.page = 1; fetchData() }
const handleReset = () => { pageParams.page = 1; fetchData() }
const handlePageChange = () => fetchData()

const handleView = (row: Account) => {
  ElMessage.info(`查看账户详情：${row.accountNo}`)
}

const handleStatus = async (row: Account, targetStatus: number) => {
  const label = statusOptions[targetStatus] || ''
  try {
    let remark: string | undefined
    if (targetStatus === 0) {
      remark = (await ElMessageBox.prompt(`注销前请确认账户余额为0。请输入注销原因：`, `确认${label}`, {
        confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
      })).value
    } else {
      await ElMessageBox.confirm(`确定要将账户 ${row.accountNo} ${label}？`, '确认', { type: 'warning' })
    }
    await updateAccountStatusApi(row.id, targetStatus, remark)
    ElMessage.success('操作成功')
    fetchData()
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error(e.message || '操作失败')
  }
}

onMounted(() => fetchData())
</script>

<style lang="scss" scoped>
.ccb-business-account {
  :deep(.account-row) {
    transition: box-shadow 0.3s ease, background 0.3s ease;
    &:hover {
      box-shadow: inset 3px 0 0 #1755a3;
      background-color: rgba(23, 85, 163, 0.03);
    }
  }
  .acct-no {
    font-family: monospace;
    font-weight: 600;
    color: #1755a3;
    letter-spacing: 0.5px;
  }
  .balance {
    font-weight: 700;
    color: #303133;
  }
  .frozen {
    color: #e6a23c;
    font-weight: 600;
  }
}
</style>
