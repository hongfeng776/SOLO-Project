<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import type { FormInstance } from 'element-plus'
import QyDataTable from '@/components/QyDataTable/index.vue'
import QyTableToolbar from '@/components/QyTableToolbar/index.vue'
import { MEMBER_LEVEL, MEMBER_STATUS, getEnumOptions, getEnumLabel, getEnumItem } from '@/constants/enums'
import {
  getMemberListApi,
  createMemberApi,
  renewMemberApi,
  upgradeMemberApi,
  freezeMemberApi,
  unfreezeMemberApi,
  getMemberStatsApi,
} from '@/api/member'
import type { MemberItem, MemberStatsResult } from '@/types'
import { formatDate, formatNumber } from '@/utils'

const loading = ref(false)
const listData = ref<MemberItem[]>([])
const total = ref(0)

const queryParams = reactive({
  page: 1,
  pageSize: 10,
  memberNo: '',
  memberLevel: null as number | null,
  memberStatus: null as number | null,
  keyword: '',
})

const loadData = async () => {
  loading.value = true
  try {
    const result = await getMemberListApi({ ...queryParams })
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
  queryParams.memberNo = ''
  queryParams.memberLevel = null
  queryParams.memberStatus = null
  queryParams.keyword = ''
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

const memberStats = ref<MemberStatsResult | null>(null)

const loadMemberStats = async () => {
  try {
    memberStats.value = await getMemberStatsApi()
  } catch {
    memberStats.value = null
  }
}

const getStatCount = (level: number): number => {
  if (!memberStats.value) return 0
  const item = memberStats.value.byLevel.find((b) => b.level === level)
  return item?.count || 0
}

const totalMembers = computed(() => {
  if (!memberStats.value) return 0
  return memberStats.value.byLevel.reduce((sum, b) => sum + b.count, 0)
})

const createDialogVisible = ref(false)
const createFormRef = ref<FormInstance>()
const createFormData = reactive({
  userId: null as number | null,
  memberLevel: 1,
  currentPlan: '',
  planPrice: 0,
  planDuration: 12,
})
const createFormRules = {
  userId: [{ required: true, message: '请选择平台用户', trigger: 'change' }],
  memberLevel: [{ required: true, message: '请选择会员等级', trigger: 'change' }],
  planDuration: [{ required: true, message: '请选择套餐时长', trigger: 'change' }],
}

const handleCreateSubmit = async () => {
  await createFormRef.value?.validate()
  loading.value = true
  try {
    await createMemberApi(createFormData)
    ElMessage.success('创建会员成功')
    createDialogVisible.value = false
    loadData()
    loadMemberStats()
  } finally {
    loading.value = false
  }
}

const openCreateDialog = () => {
  Object.assign(createFormData, {
    userId: null,
    memberLevel: 1,
    currentPlan: '',
    planPrice: 0,
    planDuration: 12,
  })
  createDialogVisible.value = true
}

const renewDialogVisible = ref(false)
const currentRenewId = ref<number | null>(null)
const renewFormRef = ref<FormInstance>()
const renewFormData = reactive({
  planDuration: 12,
  planPrice: 0,
  currentPlan: '',
})
const renewFormRules = {
  planDuration: [{ required: true, message: '请选择续费时长', trigger: 'change' }],
  planPrice: [{ required: true, message: '请输入续费价格', trigger: 'blur' }],
}

const openRenewDialog = (row: MemberItem) => {
  currentRenewId.value = row.id
  Object.assign(renewFormData, {
    planDuration: 12,
    planPrice: row.planPrice || 0,
    currentPlan: row.currentPlan || '',
  })
  renewDialogVisible.value = true
}

const handleRenewSubmit = async () => {
  await renewFormRef.value?.validate()
  loading.value = true
  try {
    await renewMemberApi(currentRenewId.value!, renewFormData)
    ElMessage.success('续费成功')
    renewDialogVisible.value = false
    loadData()
    loadMemberStats()
  } finally {
    loading.value = false
  }
}

const upgradeDialogVisible = ref(false)
const currentUpgradeId = ref<number | null>(null)
const upgradeFormRef = ref<FormInstance>()
const upgradeFormData = reactive({
  newLevel: null as number | null,
})
const upgradeFormRules = {
  newLevel: [{ required: true, message: '请选择新等级', trigger: 'change' }],
}

const openUpgradeDialog = (row: MemberItem) => {
  currentUpgradeId.value = row.id
  upgradeFormData.newLevel = null
  upgradeDialogVisible.value = true
}

const handleUpgradeSubmit = async () => {
  await upgradeFormRef.value?.validate()
  loading.value = true
  try {
    await upgradeMemberApi(currentUpgradeId.value!, { newLevel: upgradeFormData.newLevel! })
    ElMessage.success('升级成功')
    upgradeDialogVisible.value = false
    loadData()
    loadMemberStats()
  } finally {
    loading.value = false
  }
}

const handleFreezeToggle = async (row: MemberItem) => {
  const isFrozen = row.memberStatus === 2
  const action = isFrozen ? '解冻' : '冻结'
  await ElMessageBox.confirm(`确定要${action}该会员吗？`, '提示', { type: 'warning' })
  loading.value = true
  try {
    if (isFrozen) {
      await unfreezeMemberApi(row.id)
    } else {
      await freezeMemberApi(row.id)
    }
    ElMessage.success(`${action}成功`)
    loadData()
  } finally {
    loading.value = false
  }
}

const detailVisible = ref(false)
const currentMember = ref<MemberItem | null>(null)

const openDetail = (row: MemberItem) => {
  currentMember.value = row
  detailVisible.value = true
}

const tableColumns = [
  { type: 'selection', width: 50 },
  { prop: 'memberNo', label: '会员编号', minWidth: 130, showOverflowTooltip: true },
  { prop: 'userId', label: '关联用户', minWidth: 120, slot: 'user' },
  { prop: 'memberLevel', label: '会员等级', width: 110, align: 'center', slot: 'memberLevel' },
  { prop: 'memberStatus', label: '状态', width: 100, align: 'center', slot: 'memberStatus' },
  { prop: 'expireDate', label: '到期日期', width: 120, align: 'center', slot: 'expireDate' },
  { prop: 'balance', label: '余额', width: 100, align: 'right', slot: 'balance' },
  { prop: 'points', label: '积分', width: 90, align: 'right' },
  { prop: 'totalSpent', label: '消费总额', width: 110, align: 'right', slot: 'totalSpent' },
  { label: '操作', width: 260, fixed: 'right', align: 'center', slot: 'actions' },
]

const memberLevelOptions = computed(() => getEnumOptions(MEMBER_LEVEL))
const memberStatusOptions = computed(() => getEnumOptions(MEMBER_STATUS))

const statCards = computed(() => [
  { label: '总会员', count: totalMembers.value, color: '#409EFF', icon: 'User' },
  { label: 'VIP会员', count: getStatCount(1), color: '#E6A23C', icon: 'Star' },
  { label: 'SVIP会员', count: getStatCount(2), color: '#F56C6C', icon: 'Medal' },
  { label: '年度VIP', count: getStatCount(3), color: '#409EFF', icon: 'Trophy' },
  { label: '终身会员', count: getStatCount(4), color: '#67C23A', icon: 'Crown' },
])

onMounted(() => {
  loadData()
  loadMemberStats()
})
</script>

<template>
  <div class="member-page">
    <div class="stat-cards">
      <div v-for="card in statCards" :key="card.label" class="stat-card">
        <div class="stat-icon" :style="{ backgroundColor: card.color + '20', color: card.color }">
          <el-icon :size="24"><component :is="card.icon" /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-count">{{ formatNumber(card.count) }}</div>
          <div class="stat-label">{{ card.label }}</div>
        </div>
      </div>
    </div>

    <div class="filter-bar">
      <el-form :inline="true" :model="queryParams" @submit.prevent>
        <el-form-item label="会员编号">
          <el-input
            v-model="queryParams.memberNo"
            placeholder="请输入会员编号"
            clearable
            style="width: 180px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="会员等级">
          <el-select
            v-model="queryParams.memberLevel"
            placeholder="全部等级"
            clearable
            style="width: 150px"
          >
            <el-option
              v-for="item in memberLevelOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="会员状态">
          <el-select
            v-model="queryParams.memberStatus"
            placeholder="全部状态"
            clearable
            style="width: 150px"
          >
            <el-option
              v-for="item in memberStatusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input
            v-model="queryParams.keyword"
            placeholder="用户名/手机号"
            clearable
            style="width: 180px"
            @keyup.enter="handleSearch"
          />
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
        create-text="新增会员"
        @create="openCreateDialog"
        @refresh="loadData"
      />

      <QyDataTable
        :columns="tableColumns"
        :data="listData"
        :loading="loading"
        :total="total"
        :page="queryParams.page"
        :page-size="queryParams.pageSize"
        :selection="false"
        :index="true"
        @page-change="handlePageChange"
        @size-change="handleSizeChange"
      >
        <template #user="{ row }">
          <span v-if="row.user">{{ row.user.realName || row.user.username }}</span>
          <span v-else style="color: #909399">-</span>
        </template>

        <template #memberLevel="{ row }">
          <el-tag
            :type="getEnumItem(MEMBER_LEVEL, row.memberLevel)?.type || 'info'"
            size="small"
          >
            {{ getEnumLabel(MEMBER_LEVEL, row.memberLevel) }}
          </el-tag>
        </template>

        <template #memberStatus="{ row }">
          <el-tag
            :type="getEnumItem(MEMBER_STATUS, row.memberStatus)?.type || 'info'"
            size="small"
          >
            {{ getEnumLabel(MEMBER_STATUS, row.memberStatus) }}
          </el-tag>
        </template>

        <template #expireDate="{ row }">
          <span :class="{ 'text-danger': row.memberStatus === 0 }">
            {{ formatDate(row.expireDate, 'YYYY-MM-DD') }}
          </span>
        </template>

        <template #balance="{ row }">
          {{ formatNumber(row.balance, 2) }}
        </template>

        <template #totalSpent="{ row }">
          {{ formatNumber(row.totalSpent, 2) }}
        </template>

        <template #actions="{ row }">
          <el-button type="primary" link :icon="Refresh" @click="openRenewDialog(row)">续费</el-button>
          <el-button type="warning" link :icon="Top" @click="openUpgradeDialog(row)">升级</el-button>
          <el-button
            :type="row.memberStatus === 2 ? 'success' : 'danger'"
            link
            :icon="row.memberStatus === 2 ? Unlock : Lock"
            @click="handleFreezeToggle(row)"
          >
            {{ row.memberStatus === 2 ? '解冻' : '冻结' }}
          </el-button>
          <el-button type="primary" link :icon="View" @click="openDetail(row)">详情</el-button>
        </template>
      </QyDataTable>
    </div>

    <el-dialog
      v-model="createDialogVisible"
      title="新增会员"
      width="560px"
      :close-on-click-modal="false"
    >
      <el-form ref="createFormRef" :model="createFormData" :rules="createFormRules" label-width="100px">
        <el-form-item label="平台用户" prop="userId">
          <el-input-number
            v-model="createFormData.userId"
            placeholder="请输入用户ID"
            :min="1"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="会员等级" prop="memberLevel">
          <el-select v-model="createFormData.memberLevel" placeholder="请选择会员等级" style="width: 100%">
            <el-option
              v-for="item in memberLevelOptions.filter((i) => i.value !== 0)"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="套餐名称" prop="currentPlan">
          <el-input v-model="createFormData.currentPlan" placeholder="请输入套餐名称" />
        </el-form-item>
        <el-form-item label="套餐时长" prop="planDuration">
          <el-select v-model="createFormData.planDuration" placeholder="请选择套餐时长" style="width: 100%">
            <el-option label="1个月" :value="1" />
            <el-option label="3个月" :value="3" />
            <el-option label="6个月" :value="6" />
            <el-option label="12个月" :value="12" />
            <el-option label="终身" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="套餐价格" prop="planPrice">
          <el-input-number
            v-model="createFormData.planPrice"
            :min="0"
            :precision="2"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleCreateSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="renewDialogVisible"
      title="会员续费"
      width="480px"
      :close-on-click-modal="false"
    >
      <el-form ref="renewFormRef" :model="renewFormData" :rules="renewFormRules" label-width="100px">
        <el-form-item label="续费时长" prop="planDuration">
          <el-select v-model="renewFormData.planDuration" placeholder="请选择续费时长" style="width: 100%">
            <el-option label="1个月" :value="1" />
            <el-option label="3个月" :value="3" />
            <el-option label="6个月" :value="6" />
            <el-option label="12个月" :value="12" />
          </el-select>
        </el-form-item>
        <el-form-item label="续费价格" prop="planPrice">
          <el-input-number
            v-model="renewFormData.planPrice"
            :min="0"
            :precision="2"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="套餐名称">
          <el-input v-model="renewFormData.currentPlan" placeholder="请输入套餐名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="renewDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleRenewSubmit">确认续费</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="upgradeDialogVisible"
      title="会员升级"
      width="480px"
      :close-on-click-modal="false"
    >
      <el-form ref="upgradeFormRef" :model="upgradeFormData" :rules="upgradeFormRules" label-width="100px">
        <el-form-item label="新等级" prop="newLevel">
          <el-select v-model="upgradeFormData.newLevel" placeholder="请选择新等级" style="width: 100%">
            <el-option
              v-for="item in memberLevelOptions.filter((i) => i.value !== 0)"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="upgradeDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleUpgradeSubmit">确认升级</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="detailVisible"
      title="会员详情"
      width="650px"
      destroy-on-close
    >
      <template v-if="currentMember">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="会员编号">{{ currentMember.memberNo }}</el-descriptions-item>
          <el-descriptions-item label="关联用户">
            {{ currentMember.user?.realName || currentMember.user?.username || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="会员等级">
            <el-tag :type="getEnumItem(MEMBER_LEVEL, currentMember.memberLevel)?.type || 'info'" size="small">
              {{ getEnumLabel(MEMBER_LEVEL, currentMember.memberLevel) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getEnumItem(MEMBER_STATUS, currentMember.memberStatus)?.type || 'info'" size="small">
              {{ getEnumLabel(MEMBER_STATUS, currentMember.memberStatus) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="到期日期">{{ formatDate(currentMember.expireDate, 'YYYY-MM-DD') }}</el-descriptions-item>
          <el-descriptions-item label="自动续费">
            <el-tag :type="currentMember.autoRenew ? 'success' : 'info'" size="small">
              {{ currentMember.autoRenew ? '是' : '否' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="余额">{{ formatNumber(currentMember.balance, 2) }}</el-descriptions-item>
          <el-descriptions-item label="积分">{{ formatNumber(currentMember.points) }}</el-descriptions-item>
          <el-descriptions-item label="消费总额">{{ formatNumber(currentMember.totalSpent, 2) }}</el-descriptions-item>
          <el-descriptions-item label="当前套餐">{{ currentMember.currentPlan || '-' }}</el-descriptions-item>
          <el-descriptions-item label="注册时间">{{ formatDate(currentMember.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="最后活跃">{{ formatDate(currentMember.lastActiveAt) }}</el-descriptions-item>
        </el-descriptions>
      </template>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.member-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stat-cards {
  display: flex;
  gap: 16px;
  background: #fff;
  padding: 16px;
  border-radius: 6px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.stat-card {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 6px;
  background: #f8f9fb;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-info {
  min-width: 0;
}

.stat-count {
  font-size: 20px;
  font-weight: 700;
  color: #303133;
  line-height: 1.2;
}

.stat-label {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.text-danger {
  color: #F56C6C;
}
</style>
