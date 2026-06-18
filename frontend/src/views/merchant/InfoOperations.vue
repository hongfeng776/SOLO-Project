<template>
  <div class="merchant-info-ops">
    <div class="stats-cards" v-if="stats">
      <el-row :gutter="16">
        <el-col :span="4" v-for="card in statCards" :key="card.key">
          <div class="stat-card" :style="{ background: card.gradient }" v-ripple>
            <div class="stat-icon" :style="{ background: card.iconBg }">
              <el-icon><component :is="card.icon" /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-label">{{ card.label }}</div>
              <div class="stat-value">{{ stats[card.key] || 0 }}</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <div class="search-bar">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="商家名称/联系人/电话"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="业务品类">
          <el-select v-model="searchForm.businessType" placeholder="全部" clearable style="width: 140px">
            <el-option
              v-for="item in getEnumOptions(MerchantBusinessTypeEnum)"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="经营状态">
          <el-select v-model="searchForm.businessStatus" placeholder="全部" clearable style="width: 140px">
            <el-option
              v-for="item in getEnumOptions(BusinessStatusEnum)"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="运营状态">
          <el-select v-model="searchForm.operationStatus" placeholder="全部" clearable style="width: 140px">
            <el-option
              v-for="item in getEnumOptions(OperationStatusEnum)"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="商家星级">
          <el-select v-model="searchForm.merchantLevel" placeholder="全部" clearable style="width: 120px">
            <el-option
              v-for="item in getEnumOptions(MerchantLevelEnum)"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="商家类型">
          <el-select v-model="searchForm.merchantCategory" placeholder="全部" clearable style="width: 140px">
            <el-option
              v-for="item in getEnumOptions(MerchantCategoryEnum)"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleSearch" v-ripple>搜索</el-button>
          <el-button icon="Refresh" @click="handleReset" v-ripple>重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="batch-action-bar" v-show="selectedIds.length > 0" :class="{ 'bar-visible': selectedIds.length > 0 }">
      <div class="batch-info">
        <el-icon><Check /></el-icon>
        <span>已选择 <strong>{{ selectedIds.length }}</strong> 家商家</span>
        <el-tag v-if="hasHighRiskSelected" type="danger" size="small" class="high-risk-tag">
          <el-icon><WarningFilled /></el-icon> 含高危商家，部分操作受限
        </el-tag>
      </div>
      <div class="batch-buttons">
        <el-button
          type="primary"
          icon="PriceTag"
          :disabled="!permissions.canBatch || hasHighRiskSelected"
          @click="openBatchTagsDialog"
          v-ripple
        >批量更新标签</el-button>
        <el-button
          type="success"
          icon="Edit"
          :disabled="!permissions.canBatch || hasHighRiskSelected"
          @click="openBatchNoticeDialog"
          v-ripple
        >批量修正公示</el-button>
        <el-button
          type="danger"
          icon="Lock"
          :disabled="!permissions.canEditHighRisk"
          @click="openBatchLockDialog"
          v-ripple
        >批量锁定账号</el-button>
        <el-button icon="Close" @click="clearSelection" v-ripple>取消选择</el-button>
      </div>
    </div>

    <div class="main-table-container" ref="tableContainer">
      <el-table
        :data="tableData"
        v-loading="loading"
        @selection-change="handleSelectionChange"
        @row-dblclick="handleRowDblclick"
        stripe
        style="width: 100%"
        :row-class-name="tableRowClassName"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="name" label="商家名称" min-width="180">
          <template #default="{ row }">
            <div class="merchant-name-cell">
              <el-avatar :size="36" :src="row.logoUrl" class="merchant-avatar">
                {{ row.name?.charAt(0) }}
              </el-avatar>
              <div class="merchant-info">
                <div class="name-text" :class="{ 'high-risk-name': row.merchantCategory === 2 }">
                  {{ row.name }}
                  <el-tag v-if="row.merchantCategory === 2" type="danger" size="small" effect="dark">高危</el-tag>
                </div>
                <div class="sub-info">
                  <el-icon :size="12"><StarFilled /></el-icon>
                  <span v-for="n in row.merchantLevel" :key="n" class="star-icon">★</span>
                  <span v-for="n in (5 - row.merchantLevel)" :key="'e'+n" class="star-empty">☆</span>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="businessType" label="业务品类" width="110">
          <template #default="{ row }">
            <el-tag :style="{ background: getEnumColor(MerchantBusinessTypeEnum, row.businessType) }" effect="dark" size="small">
              {{ getEnumLabel(MerchantBusinessTypeEnum, row.businessType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="businessStatus" label="经营状态" width="100">
          <template #default="{ row }">
            <div
              class="status-tag-animated"
              :class="`status-${row.businessStatus}`"
              :key="row.id + '-bs-' + row.businessStatus"
            >
              {{ getEnumLabel(BusinessStatusEnum, row.businessStatus) }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="operationStatus" label="运营状态" width="100">
          <template #default="{ row }">
            <div
              class="status-tag-animated"
              :class="`op-status-${row.operationStatus}`"
              :key="row.id + '-os-' + row.operationStatus"
            >
              {{ getEnumLabel(OperationStatusEnum, row.operationStatus) }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="merchantTags" label="商家标签" min-width="150">
          <template #default="{ row }">
            <div class="tags-container">
              <el-tag
                v-for="tag in (row.merchantTags || []).slice(0, 3)"
                :key="tag"
                size="small"
                class="merchant-tag"
              >{{ getTagLabel(tag) }}</el-tag>
              <el-tag v-if="(row.merchantTags || []).length > 3" size="small" type="info">+{{ (row.merchantTags || []).length - 3 }}</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="contact" label="联系人" width="90" />
        <el-table-column prop="phone" label="联系电话" width="130">
          <template #default="{ row }">
            <span class="long-text" v-tooltip:top="row.phone">{{ row.phone }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="settleCycle" label="结算周期" width="90">
          <template #default="{ row }">{{ getEnumLabel(SettleCycleEnum, row.settleCycle) }}</template>
        </el-table-column>
        <el-table-column prop="commissionRate" label="佣金比例" width="90">
          <template #default="{ row }">{{ (row.commissionRate * 100).toFixed(2) }}%</template>
        </el-table-column>
        <el-table-column prop="infoUpdateTime" label="最近更新" width="160">
          <template #default="{ row }">{{ formatDate(row.infoUpdateTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" icon="Edit" @click="openEditPanel(row)" v-ripple>编辑</el-button>
            <el-button type="success" size="small" icon="View" @click="openTraceDialog(row)" v-ripple>溯源</el-button>
            <el-dropdown trigger="click" @command="(cmd) => handleMoreAction(cmd, row)">
              <el-button size="small" icon="MoreFilled">更多</el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    command="status"
                    :disabled="!permissions.canEditStatus || row.operationStatus === 3"
                  ><el-icon><Clock /></el-icon> 经营状态</el-dropdown-item>
                  <el-dropdown-item
                    command="lock"
                    :disabled="!permissions.canEditStatus"
                  ><el-icon><Lock /></el-icon> 运营锁定</el-dropdown-item>
                  <el-dropdown-item command="detail"><el-icon><Document /></el-icon> 查看详情</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.pageNum"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchData"
          @current-change="fetchData"
        />
      </div>
    </div>

    <info-edit-panel
      v-model="editPanelVisible"
      :merchant-id="currentMerchantId"
      :permissions="permissions"
      @success="handleEditSuccess"
    />

    <info-trace-dialog
      v-model="traceDialogVisible"
      :merchant-id="currentMerchantId"
    />

    <el-dialog
      v-model="statusDialogVisible"
      title="经营状态变更"
      width="500px"
      :close-on-click-modal="false"
      class="center-zoom-dialog"
    >
      <el-form :model="statusForm" :rules="statusRules" ref="statusFormRef" label-width="100px">
        <el-form-item label="当前商家">
          <span>{{ currentMerchant?.name }}</span>
        </el-form-item>
        <el-form-item label="经营状态" prop="status">
          <el-radio-group v-model="statusForm.status">
            <el-radio
              v-for="item in getEnumOptions(BusinessStatusEnum)"
              :key="item.value"
              :value="item.value"
            >{{ item.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="变更原因" prop="reason" v-if="statusForm.status === 2 || statusForm.status === 3 || statusForm.status === 0 || statusForm.status === 4">
          <el-input
            v-model="statusForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请填写状态变更原因"
            class="focus-glow-input"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="statusDialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="submitDisabled" @click="submitStatusChange" v-ripple>确认</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="lockDialogVisible"
      title="运营状态变更"
      width="500px"
      :close-on-click-modal="false"
      class="center-zoom-dialog"
    >
      <el-form :model="lockForm" :rules="lockRules" ref="lockFormRef" label-width="100px">
        <el-form-item label="当前商家">
          <span>{{ currentMerchant?.name }}</span>
        </el-form-item>
        <el-form-item label="运营状态" prop="status">
          <el-radio-group v-model="lockForm.status">
            <el-radio :value="1">正常运营</el-radio>
            <el-radio :value="2">临时锁定</el-radio>
            <el-radio :value="3" :disabled="!permissions.canEditHighRisk">永久锁定</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="锁定原因" prop="reason" v-if="lockForm.status === 2 || lockForm.status === 3">
          <el-input
            v-model="lockForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请填写锁定原因"
            class="focus-glow-input"
          />
        </el-form-item>
        <el-form-item label="预计解锁时间" v-if="lockForm.status === 2">
          <el-date-picker
            v-model="lockForm.unlockTime"
            type="datetime"
            placeholder="选择预计解锁时间"
            style="width: 100%"
            class="focus-glow-input"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="lockDialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="submitDisabled" @click="submitLockChange" v-ripple>确认</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="batchTagsDialogVisible"
      title="批量更新商家标签"
      width="500px"
      :close-on-click-modal="false"
      class="center-zoom-dialog"
    >
      <el-form :model="batchTagsForm" ref="batchTagsFormRef" label-width="100px">
        <el-form-item label="选中商家">
          <el-tag type="info">{{ selectedIds.length }} 家</el-tag>
          <span v-if="batchProgress > 0" class="progress-text">
            进度：{{ batchProgress }}%
          </span>
        </el-form-item>
        <el-form-item label="选择标签">
          <el-checkbox-group v-model="batchTagsForm.tags">
            <el-checkbox
              v-for="tag in MerchantTagOptions"
              :key="tag.value"
              :label="tag.value"
              :style="{ color: tag.color }"
            >{{ tag.label }}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-progress v-if="batchProgress > 0" :percentage="batchProgress" :status="batchProgress === 100 ? 'success' : undefined" />
      </el-form>
      <template #footer>
        <el-button @click="batchTagsDialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="submitDisabled || batchTagsForm.tags.length === 0" @click="submitBatchTags" v-ripple>确认更新</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="batchNoticeDialogVisible"
      title="批量修正公示信息"
      width="600px"
      :close-on-click-modal="false"
      class="center-zoom-dialog"
    >
      <el-form :model="batchNoticeForm" ref="batchNoticeFormRef" :rules="batchNoticeRules" label-width="100px">
        <el-form-item label="选中商家">
          <el-tag type="info">{{ selectedIds.length }} 家</el-tag>
          <span v-if="batchProgress > 0" class="progress-text">
            进度：{{ batchProgress }}%
          </span>
        </el-form-item>
        <el-form-item label="公示信息" prop="notice">
          <el-input
            v-model="batchNoticeForm.notice"
            type="textarea"
            :rows="5"
            placeholder="请输入要修正的公示信息内容"
            class="focus-glow-input"
          />
        </el-form-item>
        <el-progress v-if="batchProgress > 0" :percentage="batchProgress" :status="batchProgress === 100 ? 'success' : undefined" />
      </el-form>
      <template #footer>
        <el-button @click="batchNoticeDialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="submitDisabled" @click="submitBatchNotice" v-ripple>确认修正</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="batchLockDialogVisible"
      title="批量锁定商家账号"
      width="500px"
      :close-on-click-modal="false"
      class="center-zoom-dialog"
    >
      <el-form :model="batchLockForm" ref="batchLockFormRef" :rules="batchLockRules" label-width="100px">
        <el-form-item label="选中商家">
          <el-tag type="info">{{ selectedIds.length }} 家</el-tag>
          <span v-if="batchProgress > 0" class="progress-text">
            进度：{{ batchProgress }}%
          </span>
        </el-form-item>
        <el-form-item label="锁定原因" prop="reason">
          <el-input
            v-model="batchLockForm.reason"
            type="textarea"
            :rows="4"
            placeholder="请填写锁定原因（必填）"
            class="focus-glow-input"
          />
        </el-form-item>
        <el-alert
          title="高危商家将被自动跳过，请人工专项核验"
          type="warning"
          :closable="false"
          show-icon
          style="margin-top: 10px"
        />
        <el-progress v-if="batchProgress > 0" :percentage="batchProgress" :status="batchProgress === 100 ? 'success' : undefined" />
      </el-form>
      <template #footer>
        <el-button @click="batchLockDialogVisible = false">取消</el-button>
        <el-button type="danger" :disabled="submitDisabled" @click="submitBatchLock" v-ripple>确认锁定</el-button>
      </template>
    </el-dialog>

    <result-dialog
      v-model="resultDialogVisible"
      :result="operationResult"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import {
  getOpsStats,
  getOpsMerchantList,
  updateBusinessStatus,
  updateOperationStatus,
  batchUpdateTags,
  batchUpdateNotice,
  batchLockAccounts
} from '@/api/merchant'
import {
  MerchantBusinessTypeEnum,
  BusinessStatusEnum,
  OperationStatusEnum,
  MerchantLevelEnum,
  MerchantCategoryEnum,
  SettleCycleEnum,
  MerchantTagOptions
} from '@/utils/enums'
import { getEnumLabel, getEnumOptions, getEnumColor } from '@/utils/enums'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Check, WarningFilled, PriceTag, Edit, Lock, Close, MoreFilled, Clock, View, Document, StarFilled } from '@element-plus/icons-vue'
import InfoEditPanel from '@/components/Merchant/InfoEditPanel.vue'
import InfoTraceDialog from '@/components/Merchant/InfoTraceDialog.vue'
import ResultDialog from '@/components/Merchant/ResultDialog.vue'

const loading = ref(false)
const stats = ref(null)
const tableData = ref([])
const selectedIds = ref([])
const selectedRows = ref([])
const submitDisabled = ref(false)
const batchProgress = ref(0)

const permissions = reactive({
  canEditBasic: true,
  canEditBusiness: true,
  canEditContact: true,
  canEditSettlement: true,
  canEditStatus: true,
  canBatch: true,
  canEditHighRisk: true
})

const searchForm = reactive({
  keyword: '',
  businessType: '',
  businessStatus: '',
  operationStatus: '',
  merchantLevel: '',
  merchantCategory: ''
})

const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0
})

const editPanelVisible = ref(false)
const traceDialogVisible = ref(false)
const statusDialogVisible = ref(false)
const lockDialogVisible = ref(false)
const batchTagsDialogVisible = ref(false)
const batchNoticeDialogVisible = ref(false)
const batchLockDialogVisible = ref(false)
const resultDialogVisible = ref(false)

const currentMerchantId = ref(null)
const currentMerchant = ref(null)
const operationResult = ref(null)

const statusFormRef = ref(null)
const lockFormRef = ref(null)
const batchTagsFormRef = ref(null)
const batchNoticeFormRef = ref(null)
const batchLockFormRef = ref(null)

const statusForm = reactive({
  status: 1,
  reason: ''
})

const lockForm = reactive({
  status: 1,
  reason: '',
  unlockTime: null
})

const batchTagsForm = reactive({
  tags: []
})

const batchNoticeForm = reactive({
  notice: ''
})

const batchLockForm = reactive({
  reason: ''
})

const statusRules = {
  status: [{ required: true, message: '请选择经营状态', trigger: 'change' }],
  reason: [{ required: true, message: '请填写变更原因', trigger: 'blur' }]
}

const lockRules = {
  status: [{ required: true, message: '请选择运营状态', trigger: 'change' }],
  reason: [{ required: true, message: '请填写锁定原因', trigger: 'blur' }]
}

const batchNoticeRules = {
  notice: [{ required: true, message: '请填写公示信息', trigger: 'blur' }]
}

const batchLockRules = {
  reason: [{ required: true, message: '请填写锁定原因', trigger: 'blur' }]
}

const statCards = computed(() => [
  { key: 'total', label: '商家总数', icon: 'Shop', gradient: 'linear-gradient(135deg, #667eea, #764ba2)', iconBg: 'rgba(255,255,255,0.2)' },
  { key: 'normal', label: '正常运营', icon: 'CircleCheck', gradient: 'linear-gradient(135deg, #52c41a, #95de64)', iconBg: 'rgba(255,255,255,0.2)' },
  { key: 'tempLocked', label: '临时锁定', icon: 'Lock', gradient: 'linear-gradient(135deg, #faad14, #ffd666)', iconBg: 'rgba(255,255,255,0.2)' },
  { key: 'permanentlyLocked', label: '永久锁定', icon: 'Warning', gradient: 'linear-gradient(135deg, #ff4d4f, #ff7875)', iconBg: 'rgba(255,255,255,0.2)' },
  { key: 'highRisk', label: '高危商家', icon: 'WarningFilled', gradient: 'linear-gradient(135deg, #f5222d, #ff4d4f)', iconBg: 'rgba(255,255,255,0.2)' },
  { key: 'todayChanges', label: '今日变更', icon: 'Edit', gradient: 'linear-gradient(135deg, #1890ff, #69c0ff)', iconBg: 'rgba(255,255,255,0.2)' }
])

const hasHighRiskSelected = computed(() => {
  return selectedRows.value.some(row => row.merchantCategory === 2)
})

const fetchStats = async () => {
  try {
    const res = await getOpsStats()
    stats.value = res.data
  } catch (e) {
    console.error(e)
  }
}

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getOpsMerchantList({
      ...searchForm,
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize
    })
    tableData.value = res.rows || res.data?.list || []
    pagination.total = res.total || res.data?.total || 0
    await nextTick()
    triggerSlideRefresh()
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const triggerSlideRefresh = () => {
  const container = document.querySelector('.main-table-container')
  if (container) {
    container.classList.remove('slide-refresh')
    void container.offsetWidth
    container.classList.add('slide-refresh')
  }
}

const handleSearch = () => {
  pagination.pageNum = 1
  fetchData()
  fetchStats()
}

const handleReset = () => {
  Object.keys(searchForm).forEach(key => {
    searchForm[key] = ''
  })
  handleSearch()
}

const handleSelectionChange = (selection) => {
  selectedRows.value = selection
  selectedIds.value = selection.map(item => item.id)
}

const tableRowClassName = ({ row }) => {
  const classes = []
  if (selectedIds.value.includes(row.id)) {
    classes.push('row-selected-anim')
  }
  if (row.merchantCategory === 2) {
    classes.push('row-high-risk')
  }
  if (row.operationStatus === 2) {
    classes.push('row-locked')
  }
  if (row.operationStatus === 3) {
    classes.push('row-perm-locked')
  }
  return classes.join(' ')
}

const handleRowDblclick = (row) => {
  openEditPanel(row)
}

const openEditPanel = (row) => {
  currentMerchantId.value = row.id
  currentMerchant.value = row
  editPanelVisible.value = true
}

const openTraceDialog = (row) => {
  currentMerchantId.value = row.id
  currentMerchant.value = row
  traceDialogVisible.value = true
}

const handleMoreAction = (cmd, row) => {
  currentMerchantId.value = row.id
  currentMerchant.value = row
  if (cmd === 'status') {
    statusForm.status = row.businessStatus
    statusForm.reason = ''
    statusDialogVisible.value = true
  } else if (cmd === 'lock') {
    lockForm.status = row.operationStatus
    lockForm.reason = ''
    lockForm.unlockTime = null
    lockDialogVisible.value = true
  } else if (cmd === 'detail') {
    openTraceDialog(row)
  }
}

const handleSubmitting = () => {
  submitDisabled.value = true
  setTimeout(() => {
    submitDisabled.value = false
  }, 300)
}

const submitStatusChange = async () => {
  if (!statusFormRef.value) return
  const valid = await statusFormRef.value.validate().catch(() => false)
  if (!valid) return
  handleSubmitting()
  try {
    await updateBusinessStatus(currentMerchantId.value, {
      status: statusForm.status,
      reason: statusForm.reason
    })
    operationResult.value = { type: 'pass', message: '经营状态更新成功' }
    resultDialogVisible.value = true
    statusDialogVisible.value = false
    handleEditSuccess()
  } catch (e) {
    submitDisabled.value = false
    ElMessage.error(e.message)
  }
}

const submitLockChange = async () => {
  if (!lockFormRef.value) return
  const valid = await lockFormRef.value.validate().catch(() => false)
  if (!valid) return
  handleSubmitting()
  try {
    await updateOperationStatus(currentMerchantId.value, {
      status: lockForm.status,
      reason: lockForm.reason,
      unlockTime: lockForm.unlockTime
    })
    const messages = {
      1: '商家已解锁，恢复正常运营',
      2: '商家已临时锁定，资源已下架',
      3: '商家已永久锁定'
    }
    operationResult.value = { type: lockForm.status === 1 ? 'pass' : 'reject', message: messages[lockForm.status] }
    resultDialogVisible.value = true
    lockDialogVisible.value = false
    handleEditSuccess()
  } catch (e) {
    submitDisabled.value = false
    ElMessage.error(e.message)
  }
}

const openBatchTagsDialog = () => {
  batchTagsForm.tags = []
  batchProgress.value = 0
  batchTagsDialogVisible.value = true
}

const openBatchNoticeDialog = () => {
  batchNoticeForm.notice = ''
  batchProgress.value = 0
  batchNoticeDialogVisible.value = true
}

const openBatchLockDialog = () => {
  batchLockForm.reason = ''
  batchProgress.value = 0
  batchLockDialogVisible.value = true
}

const simulateProgress = (duration = 2000) => {
  batchProgress.value = 0
  const interval = duration / 100
  const timer = setInterval(() => {
    batchProgress.value += 1
    if (batchProgress.value >= 100) {
      clearInterval(timer)
    }
  }, interval)
  return timer
}

const submitBatchTags = async () => {
  handleSubmitting()
  const timer = simulateProgress()
  try {
    const res = await batchUpdateTags({
      ids: selectedIds.value,
      tags: batchTagsForm.tags
    })
    clearInterval(timer)
    batchProgress.value = 100
    setTimeout(() => {
      operationResult.value = {
        type: 'pass',
        message: `批量更新标签完成：成功${res.data.success}条，失败${res.data.failed}条，跳过${res.data.skipped}条`
      }
      resultDialogVisible.value = true
      batchTagsDialogVisible.value = false
      clearSelection()
      handleEditSuccess()
    }, 300)
  } catch (e) {
    clearInterval(timer)
    submitDisabled.value = false
    ElMessage.error(e.message)
  }
}

const submitBatchNotice = async () => {
  if (!batchNoticeFormRef.value) return
  const valid = await batchNoticeFormRef.value.validate().catch(() => false)
  if (!valid) return
  handleSubmitting()
  const timer = simulateProgress()
  try {
    const res = await batchUpdateNotice({
      ids: selectedIds.value,
      notice: batchNoticeForm.notice
    })
    clearInterval(timer)
    batchProgress.value = 100
    setTimeout(() => {
      operationResult.value = {
        type: 'pass',
        message: `批量修正公示完成：成功${res.data.success}条，失败${res.data.failed}条`
      }
      resultDialogVisible.value = true
      batchNoticeDialogVisible.value = false
      clearSelection()
      handleEditSuccess()
    }, 300)
  } catch (e) {
    clearInterval(timer)
    submitDisabled.value = false
    ElMessage.error(e.message)
  }
}

const submitBatchLock = async () => {
  if (!batchLockFormRef.value) return
  const valid = await batchLockFormRef.value.validate().catch(() => false)
  if (!valid) return
  handleSubmitting()
  const timer = simulateProgress(3000)
  try {
    const res = await batchLockAccounts({
      ids: selectedIds.value,
      reason: batchLockForm.reason
    })
    clearInterval(timer)
    batchProgress.value = 100
    setTimeout(() => {
      operationResult.value = {
        type: 'reject',
        message: `批量锁定完成：成功${res.data.success}条，失败${res.data.failed}条，跳过${res.data.skipped}条`
      }
      resultDialogVisible.value = true
      batchLockDialogVisible.value = false
      clearSelection()
      handleEditSuccess()
    }, 300)
  } catch (e) {
    clearInterval(timer)
    submitDisabled.value = false
    ElMessage.error(e.message)
  }
}

const clearSelection = () => {
  selectedIds.value = []
  selectedRows.value = []
  const table = document.querySelector('.el-table')
  if (table) {
    const checkboxes = table.querySelectorAll('.el-checkbox__input.is-checked')
    checkboxes.forEach(cb => cb.classList.remove('is-checked'))
  }
}

const handleEditSuccess = () => {
  batchProgress.value = 0
  fetchData()
  fetchStats()
}

const getTagLabel = (value) => {
  const tag = MerchantTagOptions.find(t => t.value === value)
  return tag ? tag.label : value
}

const formatDate = (date) => {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleString('zh-CN', { hour12: false })
}

onMounted(() => {
  fetchStats()
  fetchData()
})
</script>

<style lang="scss">
.long-text {
  display: inline-block;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
}
</style>
