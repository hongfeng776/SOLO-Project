<template>
  <div class="page-container">
    <el-row :gutter="20" class="stats-row mb-20">
      <el-col :span="6">
        <div class="stat-card stat-published">
          <div class="stat-icon"><el-icon :size="24"><CircleCheck /></el-icon></div>
          <div class="stat-info">
            <div class="stat-label">已发布</div>
            <div class="stat-value">{{ publishedCount }}</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-offshelf">
          <div class="stat-icon"><el-icon :size="24"><Box /></el-icon></div>
          <div class="stat-info">
            <div class="stat-label">已下架</div>
            <div class="stat-value">{{ offShelfCount }}</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-limited">
          <div class="stat-icon"><el-icon :size="24"><Timer /></el-icon></div>
          <div class="stat-info">
            <div class="stat-label">限流中</div>
            <div class="stat-value">
              {{ flowLimitedCount }}
            </div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-today">
          <div class="stat-icon"><el-icon :size="24"><Operation /></el-icon></div>
          <div class="stat-info">
            <div class="stat-label">今日运维次数</div>
            <div class="stat-value">{{ todayOpsCount }}</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-card shadow="never" class="mb-20">
      <el-form :model="queryParams" label-width="80px" inline @submit.prevent>
        <el-form-item label="标题">
          <el-input
            v-model="queryParams.keyword"
            placeholder="请输入内容标题"
            clearable
            style="width: 220px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="queryParams.status"
            placeholder="全部状态"
            clearable
            style="width: 140px"
          >
            <el-option label="已发布" :value="NoteStatus.PUBLISHED" />
            <el-option label="已下架" :value="NoteStatus.OFF_SHELF" />
            <el-option label="限流" :value="NoteStatus.FLOW_LIMITED" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-select
            v-model="queryParams.noteType"
            placeholder="全部类型"
            clearable
            style="width: 120px"
          >
            <el-option label="图文" :value="1" />
            <el-option label="视频" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="发布时间">
          <el-date-picker
            v-model="queryParams.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="分类标签">
          <el-select
            v-model="queryParams.tagId"
            placeholder="全部标签"
            clearable
            style="width: 140px"
          >
            <el-option
              v-for="tag in tagList"
              :key="tag.id"
              :label="tag.name"
              :value="tag.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="违规状态">
          <el-select
            v-model="queryParams.violationStatus"
            placeholder="全部"
            clearable
            style="width: 140px"
          >
            <el-option label="正常" :value="1" />
            <el-option label="违规过期" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="流量等级">
          <el-select
            v-model="queryParams.flowLevel"
            placeholder="全部等级"
            clearable
            style="width: 140px"
          >
            <el-option label="普通" :value="FlowLevel.NORMAL" />
            <el-option label="优质" :value="FlowLevel.PREMIUM" />
            <el-option label="热门" :value="FlowLevel.HOT" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span class="card-title">笔记运维</span>
          </div>
        </div>
      </template>

      <BatchActions
        :selected-ids="selectedIds"
        :selected-rows="selectedRows"
        :total="total"
        always-show
        :allow-delete="false"
        :allow-export="false"
      >
        <div class="batch-area" :class="{ 'batch-loading': batchLoading }">
          <el-icon v-if="batchLoading" class="loading-spinner" :size="16"><Loading /></el-icon>
          <el-button
            type="success"
            plain
            size="small"
            :icon="RefreshRight"
            :disabled="!hasSelection"
            class="batch-btn"
            @click="handleBatchRestore"
          >
            批量恢复
          </el-button>
          <el-button
            type="danger"
            plain
            size="small"
            :icon="Box"
            :disabled="!hasSelection || !canBatchOffShelf"
            class="batch-btn"
            @click="handleBatchOffShelf"
          >
            批量下架
          </el-button>
          <el-button
            type="warning"
            plain
            size="small"
            :icon="Timer"
            :disabled="!hasSelection || !canBatchFlowLimit"
            class="batch-btn"
            @click="handleBatchFlowLimit"
          >
            批量限流
          </el-button>
        </div>
      </BatchActions>

      <HtTable
        :data="dataList"
        :loading="loading"
        :total="total"
        v-model:page="queryParams.page"
        v-model:page-size="queryParams.pageSize"
        selectable
        show-index
        row-key="id"
        :row-class-name="tableRowClassName"
        @selection-change="(rows: unknown[]) => handleSelectionChange(rows as Note[])"
        @paginate="handlePaginate"
      >
        <el-table-column label="封面" width="100" align="center" resizable>
          <template #default="{ row }">
            <el-image
              v-if="row.coverImage"
              :src="row.coverImage"
              fit="cover"
              style="width: 60px; height: 60px; border-radius: 4px"
              :preview-src-list="[row.coverImage]"
            />
            <span v-else class="no-cover">无</span>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="内容标题" min-width="220" show-overflow-tooltip resizable>
          <template #default="{ row }">
            <div class="title-cell">
              <span>{{ row.title }}</span>
              <el-icon v-if="row.isPinned === 1" class="pin-icon" :size="14" color="#e6a23c"><Top /></el-icon>
              <el-icon v-if="row.isHot === 1" class="hot-icon" :size="14" color="#f56c6c"><StarFilled /></el-icon>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="authorName" label="作者" width="120" resizable />
        <el-table-column label="笔记类型" width="80" align="center" resizable>
          <template #default="{ row }">
            <el-tag v-if="row.noteType === 1" type="primary" size="small" effect="plain">图文</el-tag>
            <el-tag v-else-if="row.noteType === 2" type="success" size="small" effect="plain">视频</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center" resizable>
          <template #default="{ row }">
            <transition name="status-transition" mode="out-in">
              <el-tag
                :key="`${row.id}-${row.status}`"
                :type="getStatusType(row.status)"
                size="small"
                :class="{ 'status-highlight': highlightedRows.has(row.id) }"
              >
                {{ statusMap[row.status] || '-' }}
              </el-tag>
            </transition>
          </template>
        </el-table-column>
        <el-table-column label="流量等级" width="100" align="center" resizable>
          <template #default="{ row }">
            <el-tag
              v-if="row.flowLevel"
              :type="getFlowLevelTagType(row.flowLevel)"
              size="small"
              effect="light"
            >
              {{ FLOW_LEVEL_NAMES[row.flowLevel] || '-' }}
            </el-tag>
            <span v-else class="text-empty">-</span>
          </template>
        </el-table-column>
        <el-table-column label="是否热门" width="80" align="center" resizable>
          <template #default="{ row }">
            <el-icon v-if="row.isHot === 1" :size="20" color="#f56c6c"><StarFilled /></el-icon>
            <span v-else class="text-empty">-</span>
          </template>
        </el-table-column>
        <el-table-column label="互动数据" width="160" align="center" resizable>
          <template #default="{ row }">
            <div class="interaction-data">
              <span><el-icon><View /></el-icon>{{ formatCompact(row.viewCount) }}</span>
              <span><el-icon><Star /></el-icon>{{ formatCompact(row.likeCount) }}</span>
              <span><el-icon><ChatDotRound /></el-icon>{{ formatCompact(row.commentCount) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="发布时间" width="160" resizable>
          <template #default="{ row }">
            {{ formatDateTime(row.publishTime || row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="最后运维" width="160" resizable>
          <template #default="{ row }">
            <div v-if="row.lastOpsUserName" class="last-ops">
              <div>{{ row.lastOpsUserName }}</div>
              <div class="last-ops-time">{{ formatDateTime(row.lastOpsTime) }}</div>
            </div>
            <span v-else class="text-empty">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" align="center" fixed="right" resizable>
          <template #default="{ row }">
            <el-button
              v-if="row.status === NoteStatus.PUBLISHED"
              link
              type="danger"
              size="small"
              class="action-btn"
              :class="{ 'btn-temp-disabled': disabledButtons.has(`${row.id}-off`) }"
              :disabled="disabledButtons.has(`${row.id}-off`)"
              @click="handleOffShelf(row)"
            >
              下架
            </el-button>
            <el-button
              v-if="row.status === NoteStatus.PUBLISHED"
              link
              type="warning"
              size="small"
              class="action-btn"
              :class="{ 'btn-temp-disabled': disabledButtons.has(`${row.id}-limit`) }"
              :disabled="disabledButtons.has(`${row.id}-limit`)"
              @click="handleFlowLimit(row)"
            >
              限流
            </el-button>
            <el-button
              v-if="row.status === NoteStatus.OFF_SHELF || row.status === NoteStatus.FLOW_LIMITED"
              link
              type="success"
              size="small"
              class="action-btn"
              :class="{ 'btn-temp-disabled': disabledButtons.has(`${row.id}-restore`) }"
              :disabled="disabledButtons.has(`${row.id}-restore`)"
              @click="handleRestore(row)"
            >
              恢复
            </el-button>
            <el-button link type="primary" size="small" class="action-btn" @click="openOpsLog(row)">
              运维日志
            </el-button>
          </template>
        </el-table-column>
      </HtTable>
    </el-card>

    <el-dialog
      v-model="resultDialogVisible"
      :title="resultDialogTitle"
      width="480px"
      center
      :close-on-click-modal="false"
      class="center-dialog"
      destroy-on-close
    >
      <div class="result-content">
        <div v-if="resultData" class="result-comparison">
          <div class="comparison-row">
            <div class="comparison-item">
              <div class="comparison-label">变更前状态</div>
              <el-tag :type="getStatusType(resultData.previousStatus)" size="small">
                {{ statusMap[resultData.previousStatus] }}
              </el-tag>
            </div>
            <el-icon :size="24" color="#409eff" class="arrow-icon"><Right /></el-icon>
            <div class="comparison-item">
              <div class="comparison-label">变更后状态</div>
              <el-tag :type="getStatusType(resultData.newStatus)" size="small">
                {{ statusMap[resultData.newStatus] }}
              </el-tag>
            </div>
          </div>
          <div v-if="resultData.message" class="result-message">
            <el-alert :title="resultData.message" type="info" show-icon :closable="false" />
          </div>
        </div>
        <div v-else-if="batchResultData" class="batch-result">
          <el-row :gutter="20">
            <el-col :span="8">
              <div class="result-stat total">
                <div class="stat-num">{{ batchResultData.total }}</div>
                <div class="stat-label">总数</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="result-stat success">
                <div class="stat-num">{{ batchResultData.success }}</div>
                <div class="stat-label">成功</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="result-stat fail">
                <div class="stat-num">{{ batchResultData.fail }}</div>
                <div class="stat-label">失败</div>
              </div>
            </el-col>
          </el-row>
          <div v-if="batchResultData.results?.length" class="result-detail-list">
            <div class="detail-title">操作详情</div>
            <div v-for="(item, index) in batchResultData.results.slice(0, 5)" :key="index" class="detail-item">
              <span class="detail-id">#{{ item.noteId }}</span>
              <el-tag :type="item.success ? 'success' : 'danger'" size="small">
                {{ item.success ? '成功' : '失败' }}
              </el-tag>
              <span v-if="item.message" class="detail-msg">{{ item.message }}</span>
            </div>
            <div v-if="batchResultData.results.length > 5" class="detail-more">
              还有 {{ batchResultData.results.length - 5 }} 条记录...
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button type="primary" @click="resultDialogVisible = false">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="opsLogVisible"
      title="运维日志"
      width="720px"
      class="center-dialog"
      destroy-on-close
    >
      <div v-if="currentOpsNote" class="ops-log-header">
        <span class="log-note-title">笔记标题：{{ currentOpsNote.title }}</span>
      </div>
      <el-table :data="opsLogList" v-loading="opsLogLoading" size="small">
        <el-table-column label="操作人" width="100">
          <template #default="{ row }">
            <div class="operator-info">
              <span>{{ row.operatorName }}</span>
              <el-tag size="small" type="info" effect="plain">
                {{ OPERATOR_ROLE_NAMES[row.operatorRole] || row.operatorRole }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态变更" width="200">
          <template #default="{ row }">
            <div class="status-change">
              <el-tag :type="getStatusType(row.previousStatus)" size="small">
                {{ statusMap[row.previousStatus] }}
              </el-tag>
              <el-icon :size="14" color="#409eff"><Right /></el-icon>
              <el-tag :type="getStatusType(row.newStatus)" size="small">
                {{ statusMap[row.newStatus] }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="原因" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="reason-cell">
              <el-tooltip v-if="row.isAbnormal === 1" content="异常操作" placement="top">
                <el-icon class="abnormal-icon" :size="14" color="#f56c6c"><WarningFilled /></el-icon>
              </el-tooltip>
              <el-tooltip v-if="row.reason" :content="row.reason" placement="top">
                <span>{{ row.reason || '-' }}</span>
              </el-tooltip>
              <span v-else>-</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="异常原因" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">
            <el-tooltip v-if="row.abnormalReason" :content="row.abnormalReason" placement="top">
              <span class="abnormal-reason">{{ row.abnormalReason || '-' }}</span>
            </el-tooltip>
            <span v-else class="text-empty">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作时间" width="150">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>
      </el-table>
      <div v-if="opsLogList.length > 0" class="log-pagination">
        <el-pagination
          v-model:current-page="opsLogPage"
          v-model:page-size="opsLogPageSize"
          :total="opsLogTotal"
          :page-sizes="[10, 20, 50]"
          layout="total, prev, pager, next"
          background
          @current-change="fetchOpsLog"
          @size-change="fetchOpsLog"
        />
      </div>
    </el-dialog>

    <el-dialog
      v-model="permissionWarningVisible"
      title="权限提示"
      width="420px"
      center
      class="center-dialog"
      destroy-on-close
    >
      <el-alert
        type="warning"
        show-icon
        :closable="false"
        title="您没有操作热门内容权限，请联系超级运营"
        description="普通运营角色无法对热门内容或执行限流操作，需要超级运营或管理员权限。"
      />
      <template #footer>
        <el-button type="primary" @click="permissionWarningVisible = false">知道了</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Search,
  Refresh,
  CircleCheck,
  Box,
  Timer,
  Operation,
  RefreshRight,
  View,
  Star,
  ChatDotRound,
  Top,
  StarFilled,
  Right,
  Loading,
  WarningFilled
} from '@element-plus/icons-vue'
import { useFetchList, useSelection, formatDateTime } from '@hooks/index'
import { useNumberFormat } from '@hooks/useFormat'
import {
  executeNoteOps,
  batchNoteOps,
  validateBeforeOps,
  getNoteOpsHistory
} from '@api/note-ops'
import { getNoteOpsStats } from '@api/note-ops-log'
import { getNoteList, getAllTags, getNoteStats as fetchContentNoteStats } from '@api/content'
import {
  NoteStatus,
  FlowLevel,
  OperatorRole,
  FLOW_LEVEL_NAMES,
  OPERATOR_ROLE_NAMES
} from '@enums/business'
import type {
  Note,
  NoteOpsResult,
  BatchNoteOpsResult,
  NoteOpsLog,
  Tag
} from '@/types/business'
import type { PageResult } from '@/types/api'
import { useUserStore } from '@/stores/modules/user'
import HtTable from '@components/HtTable/index.vue'
import BatchActions from '@components/BatchActions/index.vue'

const userStore = useUserStore()
const { formatCompact } = useNumberFormat()

const statusMap: Record<number, string> = {
  [NoteStatus.DRAFT]: '草稿',
  [NoteStatus.PENDING_REVIEW]: '待审核',
  [NoteStatus.PUBLISHED]: '已发布',
  [NoteStatus.REJECTED]: '已拒绝',
  [NoteStatus.OFF_SHELF]: '已下架',
  [NoteStatus.SCHEDULED]: '已暂缓',
  [NoteStatus.FLOW_LIMITED]: '限流中'
}

const publishedCount = ref(0)
const offShelfCount = ref(0)
const flowLimitedCount = ref(0)
const todayOpsCount = ref(0)

const tagList = ref<Tag[]>([])

const highlightedRows = reactive(new Set<number>())
const disabledButtons = reactive(new Set<string>())

const baseParams = computed(() => ({
  keyword: '',
  status: undefined as number | undefined,
  noteType: undefined as number | undefined,
  dateRange: [] as string[],
  tagId: undefined as number | undefined,
  violationStatus: undefined as number | undefined,
  flowLevel: undefined as number | undefined
}))

const {
  loading,
  dataList,
  total,
  queryParams,
  fetchData,
  handleSearch,
  handlePaginate
} = useFetchList<Note, {
  keyword?: string
  status?: number
  noteType?: number
  dateRange?: string[]
  tagId?: number
  violationStatus?: number
  flowLevel?: number
}>({
  fetchApi: getNoteList as unknown as (params: Record<string, unknown>) => Promise<PageResult<Note>>,
  defaultParams: baseParams.value
})

const handleReset = () => {
  Object.assign(queryParams, { page: 1, pageSize: 10, ...baseParams.value })
  fetchData()
}

const { selectedRows, selectedIds, hasSelection, handleSelectionChange, clearSelection } = useSelection<Note>()

const isNormalOps = computed(() => userStore.roles.includes(OperatorRole.NORMAL_OPS))

const canBatchFlowLimit = computed(() => !isNormalOps.value)

const canBatchOffShelf = computed(() => {
  if (isNormalOps.value) {
    return !selectedRows.value.some((row) => row.flowLevel === FlowLevel.HOT)
  }
  return true
})

const resultDialogVisible = ref(false)
const resultDialogTitle = ref('')
const resultData = ref<NoteOpsResult | null>(null)
const batchResultData = ref<BatchNoteOpsResult | null>(null)

const batchLoading = ref(false)

const opsLogVisible = ref(false)
const opsLogLoading = ref(false)
const opsLogList = ref<NoteOpsLog[]>([])
const opsLogTotal = ref(0)
const opsLogPage = ref(1)
const opsLogPageSize = ref(10)
const currentOpsNote = ref<Note | null>(null)

const permissionWarningVisible = ref(false)

const tableRowClassName = ({ row }: { row: Note }) => {
  const classes: string[] = []
  if (highlightedRows.has(row.id)) {
    classes.push('highlight-row')
  }
  return classes.join(' ')
}

const getStatusType = (status: number) => {
  switch (status) {
    case NoteStatus.PUBLISHED:
      return 'success'
    case NoteStatus.OFF_SHELF:
      return 'info'
    case NoteStatus.FLOW_LIMITED:
      return 'warning'
    case NoteStatus.REJECTED:
      return 'danger'
    case NoteStatus.PENDING_REVIEW:
      return 'warning'
    case NoteStatus.SCHEDULED:
      return ''
    default:
      return 'info'
  }
}

const getFlowLevelTagType = (level: number) => {
  switch (level) {
    case FlowLevel.HOT:
      return 'danger'
    case FlowLevel.PREMIUM:
      return 'warning'
    case FlowLevel.NORMAL:
      return 'info'
    default:
      return 'info'
  }
}

const tempDisableButton = (key: string) => {
  disabledButtons.add(key)
  setTimeout(() => {
    disabledButtons.delete(key)
  }, 300)
}

const highlightRow = (noteId: number) => {
  highlightedRows.add(noteId)
  setTimeout(() => {
    highlightedRows.delete(noteId)
  }, 1500)
}

const checkHotProtection = (row: Note, targetStatus: number): boolean => {
  if (row.isHot === 1 && (targetStatus === NoteStatus.OFF_SHELF || targetStatus === NoteStatus.FLOW_LIMITED)) {
    ElMessage.error('该笔记处于热门流量推送中，请先取消热门推送再操作')
    return false
  }
  return true
}

const checkPermissionForHot = (row: Note): boolean => {
  if (isNormalOps.value && row.flowLevel === FlowLevel.HOT) {
    permissionWarningVisible.value = true
    return false
  }
  return true
}

const validateAndExecute = async (row: Note, targetStatus: number, btnKey: string) => {
  if (!checkHotProtection(row, targetStatus)) {
    tempDisableButton(btnKey)
    return
  }
  if (!checkPermissionForHot(row)) {
    tempDisableButton(btnKey)
    return
  }

  try {
    const validation = await validateBeforeOps({
      noteId: row.id,
      newStatus: targetStatus
    })

    if (!validation.allowed) {
      ElMessage.error(validation.blockedReason || '操作不被允许')
      tempDisableButton(btnKey)
      return
    }

    const result = await executeNoteOps({
      noteId: row.id,
      newStatus: targetStatus
    })

    resultDialogTitle.value = result.success ? '操作成功' : '操作失败'
    resultData.value = result
    batchResultData.value = null
    resultDialogVisible.value = true

    if (result.success) {
      highlightRow(row.id)
      fetchData()
      fetchStats()
    }
  } catch (error) {
    console.error(error)
    tempDisableButton(btnKey)
  }
}

const handleOffShelf = (row: Note) => {
  validateAndExecute(row, NoteStatus.OFF_SHELF, `${row.id}-off`)
}

const handleFlowLimit = (row: Note) => {
  if (isNormalOps.value) {
    permissionWarningVisible.value = true
    tempDisableButton(`${row.id}-limit`)
    return
  }
  validateAndExecute(row, NoteStatus.FLOW_LIMITED, `${row.id}-limit`)
}

const handleRestore = (row: Note) => {
  validateAndExecute(row, NoteStatus.PUBLISHED, `${row.id}-restore`)
}

const handleBatchRestore = async () => {
  const hotSelected = selectedRows.value.some((row) => row.flowLevel === FlowLevel.HOT)
  if (isNormalOps.value && hotSelected) {
    permissionWarningVisible.value = true
    return
  }

  try {
    batchLoading.value = true
    const result = await batchNoteOps({
      ids: selectedIds.value,
      newStatus: NoteStatus.PUBLISHED
    })

    resultDialogTitle.value = '批量恢复结果'
    resultData.value = null
    batchResultData.value = result
    resultDialogVisible.value = true

    clearSelection()
    fetchData()
    fetchStats()
  } catch (error) {
    console.error(error)
  } finally {
    batchLoading.value = false
  }
}

const handleBatchOffShelf = async () => {
  if (!canBatchOffShelf.value) {
    permissionWarningVisible.value = true
    return
  }

  const hasHot = selectedRows.value.some((row) => row.isHot === 1)
  if (hasHot) {
    ElMessage.error('选中内容包含处于热门流量推送的笔记，请先取消热门推送再操作')
    return
  }

  try {
    batchLoading.value = true
    const result = await batchNoteOps({
      ids: selectedIds.value,
      newStatus: NoteStatus.OFF_SHELF
    })

    resultDialogTitle.value = '批量下架结果'
    resultData.value = null
    batchResultData.value = result
    resultDialogVisible.value = true

    clearSelection()
    fetchData()
    fetchStats()
  } catch (error) {
    console.error(error)
  } finally {
    batchLoading.value = false
  }
}

const handleBatchFlowLimit = async () => {
  if (!canBatchFlowLimit.value) {
    permissionWarningVisible.value = true
    return
  }

  const hasHot = selectedRows.value.some((row) => row.isHot === 1)
  if (hasHot) {
    ElMessage.error('选中内容包含处于热门流量推送的笔记，请先取消热门推送再操作')
    return
  }

  try {
    batchLoading.value = true
    const result = await batchNoteOps({
      ids: selectedIds.value,
      newStatus: NoteStatus.FLOW_LIMITED
    })

    resultDialogTitle.value = '批量限流结果'
    resultData.value = null
    batchResultData.value = result
    resultDialogVisible.value = true

    clearSelection()
    fetchData()
    fetchStats()
  } catch (error) {
    console.error(error)
  } finally {
    batchLoading.value = false
  }
}

const openOpsLog = async (row: Note) => {
  currentOpsNote.value = row
  opsLogPage.value = 1
  opsLogPageSize.value = 10
  opsLogVisible.value = true
  await fetchOpsLog()
}

const fetchOpsLog = async () => {
  if (!currentOpsNote.value) return
  opsLogLoading.value = true
  try {
    const res = await getNoteOpsHistory(currentOpsNote.value.id, {
      page: opsLogPage.value,
      pageSize: opsLogPageSize.value
    })
    opsLogList.value = res.list
    opsLogTotal.value = res.total
  } catch (error) {
    console.error(error)
  } finally {
    opsLogLoading.value = false
  }
}

const fetchStats = async () => {
  try {
    const res = await getNoteOpsStats()
    todayOpsCount.value = res.totalToday
  } catch (error) {
    console.error(error)
  }
  try {
    const noteStats = await fetchContentNoteStats()
    publishedCount.value = noteStats.published || 0
    offShelfCount.value = noteStats.offShelf || 0
    flowLimitedCount.value = noteStats.flowLimited || 0
  } catch (error) {
    console.error(error)
  }
}

const fetchTagList = async () => {
  try {
    const res = await getAllTags()
    tagList.value = res
  } catch (error) {
    console.error(error)
  }
}

onMounted(() => {
  fetchStats()
  fetchTagList()
})
</script>

<style lang="scss" scoped>
.page-container {
  .stats-row {
    .stat-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .stat-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
      }

      .stat-info {
        .stat-label {
          font-size: 13px;
          color: $text-secondary;
          margin-bottom: 4px;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 600;
          color: $text-primary;
        }
      }

      &.stat-published {
        .stat-icon {
          background: linear-gradient(135deg, #67c23a, #85ce61);
        }
      }

      &.stat-offshelf {
        .stat-icon {
          background: linear-gradient(135deg, #909399, #a6a9ad);
        }
      }

      &.stat-limited {
        .stat-icon {
          background: linear-gradient(135deg, #e6a23c, #ebb563);
        }
      }

      &.stat-today {
        .stat-icon {
          background: linear-gradient(135deg, #409eff, #66b1ff);
        }
      }
    }
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 24px;
  }

  .card-title {
    font-size: 15px;
    font-weight: 600;
    color: $text-primary;
  }

  .batch-area {
    display: flex;
    align-items: center;
    gap: 8px;
    position: relative;

    &.batch-loading {
      pointer-events: none;
      opacity: 0.7;
    }

    .loading-spinner {
      animation: rotate 1s linear infinite;
    }

    @keyframes rotate {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }
  }

  .batch-btn {
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transform: translateY(-1px);
    }
  }

  .title-cell {
    display: flex;
    align-items: center;
    gap: 6px;

    .pin-icon,
    .hot-icon {
      flex-shrink: 0;
    }
  }

  .no-cover {
    color: $text-placeholder;
    font-size: 12px;
  }

  .interaction-data {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 12px;
    color: $text-secondary;
    align-items: flex-start;

    span {
      display: inline-flex;
      align-items: center;
      gap: 4px;

      .el-icon {
        font-size: 12px;
      }
    }
  }

  .last-ops {
    font-size: 12px;

    .last-ops-time {
      color: $text-placeholder;
      font-size: 11px;
    }
  }

  .text-empty {
    color: $text-placeholder;
  }

  .action-btn {
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transform: translateY(-1px);
    }
  }

  .status-highlight {
    animation: statusFloat 1.5s ease;
  }

  @keyframes statusFloat {
    0% {
      transform: translateY(0);
      color: inherit;
    }
    30% {
      transform: translateY(-4px);
      color: #409eff;
      font-weight: bold;
    }
    100% {
      transform: translateY(0);
      color: inherit;
      font-weight: normal;
    }
  }

  .btn-temp-disabled {
    opacity: 0.6;
    cursor: not-allowed !important;
    animation: btnShake 0.3s ease;
  }

  @keyframes btnShake {
    0%,
    100% {
      transform: translateX(0);
    }
    25% {
      transform: translateX(-3px);
    }
    75% {
      transform: translateX(3px);
    }
  }

  :deep(.highlight-row) {
    background-color: rgba(64, 158, 255, 0.08) !important;

    &:hover {
      background-color: rgba(64, 158, 255, 0.12) !important;
    }
  }

  .mb-20 {
    margin-bottom: 20px;
  }

  .result-content {
    .result-comparison {
      .comparison-row {
        display: flex;
        align-items: center;
        justify-content: space-around;
        padding: 20px 0;

        .comparison-item {
          text-align: center;

          .comparison-label {
            font-size: 13px;
            color: $text-secondary;
            margin-bottom: 8px;
          }
        }

        .arrow-icon {
          flex-shrink: 0;
        }
      }

      .result-message {
        margin-top: 16px;
      }
    }

    .batch-result {
      .result-stat {
        text-align: center;
        padding: 16px;
        border-radius: 8px;

        &.total {
          background: rgba(64, 158, 255, 0.1);
        }

        &.success {
          background: rgba(103, 194, 58, 0.1);
        }

        &.fail {
          background: rgba(245, 108, 108, 0.1);
        }

        .stat-num {
          font-size: 28px;
          font-weight: 600;
          line-height: 1.2;
        }

        .stat-label {
          font-size: 13px;
          color: $text-secondary;
          margin-top: 4px;
        }

        &.total .stat-num {
          color: #409eff;
        }

        &.success .stat-num {
          color: #67c23a;
        }

        &.fail .stat-num {
          color: #f56c6c;
        }
      }

      .result-detail-list {
        margin-top: 20px;
        padding-top: 16px;
        border-top: 1px solid $border-color-lighter;

        .detail-title {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 12px;
          color: $text-primary;
        }

        .detail-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 0;
          font-size: 13px;

          .detail-id {
            color: $text-secondary;
            font-family: monospace;
          }

          .detail-msg {
            color: $text-secondary;
            font-size: 12px;
          }
        }

        .detail-more {
          font-size: 12px;
          color: $text-placeholder;
          text-align: center;
          padding: 8px 0;
        }
      }
    }
  }

  .ops-log-header {
    margin-bottom: 16px;

    .log-note-title {
      font-size: 14px;
      color: $text-primary;
      font-weight: 500;
    }
  }

  .operator-info {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }

  .status-change {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .reason-cell {
    display: flex;
    align-items: center;
    gap: 4px;

    .abnormal-icon {
      flex-shrink: 0;
    }
  }

  .abnormal-reason {
    color: #f56c6c;
  }

  .log-pagination {
    margin-top: 16px;
    display: flex;
    justify-content: center;
  }

  .center-dialog {
    :deep(.el-dialog) {
      animation: dialogZoomIn 0.25s ease;
    }
  }

  @keyframes dialogZoomIn {
    from {
      transform: scale(0.8);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }

  .status-transition-enter-active,
  .status-transition-leave-active {
    transition: all 0.3s ease;
  }

  .status-transition-enter-from,
  .status-transition-leave-to {
    opacity: 0;
    transform: scale(0.95);
  }

  :deep(.el-table__body tr.current-row > td) {
    background-color: rgba(64, 158, 255, 0.08) !important;
  }

  :deep(.el-table__row.selected-row) {
    background-color: rgba(64, 158, 255, 0.05) !important;
  }
}
</style>
