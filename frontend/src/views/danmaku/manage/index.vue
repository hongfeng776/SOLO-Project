<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import QyDataTable from '@/components/QyDataTable/index.vue'
import QyTableToolbar from '@/components/QyTableToolbar/index.vue'
import QySkeleton from '@/components/QySkeleton/index.vue'
import {
  DANMAKU_STATUS,
  DANMAKU_OPERATE_TYPE,
  DANMAKU_TYPE,
  DANMAKU_VIOLATION_TYPE,
  VIOLATION_LEVEL,
  getEnumOptions,
  getEnumLabel,
  getEnumItem,
} from '@/constants/enums'
import {
  getDanmakuManageListApi,
  operateDanmakuApi,
  validateOperationApi,
  checkDuplicateOperationApi,
  archiveDanmakusByContentApi,
} from '@/api/danmaku-manage'
import type { DanmakuItem, DanmakuManageQueryParams } from '@/types'
import { formatDate } from '@/utils'
import { Search, RefreshLeft, Check, Hide, CircleClose, View, Delete, CircleCheck, Warning, VideoPlay, Clock, FolderOpened } from '@element-plus/icons-vue'

const formatPlayTime = (seconds: number) => {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const loading = ref(false)
const listData = ref<DanmakuItem[]>([])
const total = ref(0)

const queryParams = reactive<DanmakuManageQueryParams>({
  page: 1,
  pageSize: 10,
  contentId: null,
  startDate: '',
  endDate: '',
  userId: null,
  danmakuStatus: null,
  violationLevel: null,
  isHighRisk: null,
  isRealTime: null,
  isArchived: null,
  violationType: null,
  playTimeStart: null,
  playTimeEnd: null,
  isHotVideo: null,
})

const dateRange = ref<[string, string] | null>(null)

const contentIdError = ref(false)
const userIdError = ref(false)
const playTimeStartError = ref(false)
const playTimeEndError = ref(false)

const validateNumberInput = (value: number | null, field: string) => {
  if (value === null || value === undefined) return true
  if (typeof value !== 'number' || value < 0 || !Number.isInteger(value)) {
    if (field === 'contentId') {
      contentIdError.value = true
      setTimeout(() => { contentIdError.value = false }, 300)
    } else if (field === 'userId') {
      userIdError.value = true
      setTimeout(() => { userIdError.value = false }, 300)
    } else if (field === 'playTimeStart') {
      playTimeStartError.value = true
      setTimeout(() => { playTimeStartError.value = false }, 300)
    } else if (field === 'playTimeEnd') {
      playTimeEndError.value = true
      setTimeout(() => { playTimeEndError.value = false }, 300)
    }
    return false
  }
  return true
}

const activeFilterCount = computed(() => {
  let count = 0
  if (queryParams.contentId !== null) count++
  if (dateRange.value) count++
  if (queryParams.userId !== null) count++
  if (queryParams.danmakuStatus !== null) count++
  if (queryParams.violationLevel !== null) count++
  if (queryParams.isHighRisk !== null) count++
  if (queryParams.isRealTime !== null) count++
  if (queryParams.isArchived !== null) count++
  if (queryParams.violationType !== null) count++
  if (queryParams.playTimeStart !== null || queryParams.playTimeEnd !== null) count++
  if (queryParams.isHotVideo !== null) count++
  return count
})

const loadData = async () => {
  loading.value = true
  try {
    const params: Record<string, any> = { ...queryParams }
    if (dateRange.value) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    } else {
      params.startDate = ''
      params.endDate = ''
    }
    const result = await getDanmakuManageListApi(params)
    if (activeFilterCount.value >= 6 && result.list.length === 0) {
      ElMessage.warning('筛选条件超限，请缩小查询范围')
    }
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
  queryParams.contentId = null
  queryParams.userId = null
  queryParams.danmakuStatus = null
  queryParams.violationLevel = null
  queryParams.isHighRisk = null
  queryParams.isRealTime = null
  queryParams.isArchived = null
  queryParams.violationType = null
  queryParams.playTimeStart = null
  queryParams.playTimeEnd = null
  queryParams.isHotVideo = null
  dateRange.value = null
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

const selectedRows = ref<DanmakuItem[]>([])
const handleSelectionChange = (rows: DanmakuItem[]) => {
  selectedRows.value = rows
}

const danmakuStatusOptions = computed(() => getEnumOptions(DANMAKU_STATUS))
const violationLevelOptions = computed(() => getEnumOptions(VIOLATION_LEVEL))
const danmakuTypeOptions = computed(() => getEnumOptions(DANMAKU_TYPE))
const violationTypeOptions = computed(() => getEnumOptions(DANMAKU_VIOLATION_TYPE))
const yesNoOptions = [
  { value: 1, label: '是' },
  { value: 0, label: '否' },
]
const realTimeOptions = [
  { value: 1, label: '实时' },
  { value: 0, label: '历史' },
]

const operating = ref<number | null>(null)
const operateDialogVisible = ref(false)
const currentOperateRow = ref<DanmakuItem | null>(null)
const currentOperateType = ref<string>('')
const operateRemark = ref('')
const validateResult = ref<{ valid: boolean; reasons: string[] } | null>(null)
const duplicateResult = ref<{ isDuplicate: boolean; lastOperation?: any } | null>(null)

const operateTypeLabel = computed(() => {
  const item = getEnumItem(DANMAKU_OPERATE_TYPE, currentOperateType.value)
  return item?.label || ''
})

const operateTypeIcon = computed(() => {
  const item = getEnumItem(DANMAKU_OPERATE_TYPE, currentOperateType.value)
  return item?.type || 'primary'
})

const targetStatusLabel = computed(() => {
  const item = getEnumItem(DANMAKU_OPERATE_TYPE, currentOperateType.value)
  if (!item || !item.nextStatus) return ''
  return getEnumLabel(DANMAKU_STATUS, item.nextStatus)
})

const openOperateDialog = async (row: DanmakuItem, type: string) => {
  currentOperateRow.value = row
  currentOperateType.value = type
  operateRemark.value = ''
  validateResult.value = null
  duplicateResult.value = null
  operating.value = row.id

  try {
    const validate = await validateOperationApi(row.id, type)
    validateResult.value = validate
    if (!validate.valid) {
      operateDialogVisible.value = true
      operating.value = null
      return
    }
    const duplicate = await checkDuplicateOperationApi(row.id, type)
    duplicateResult.value = duplicate
    operateDialogVisible.value = true
  } catch {
    operateDialogVisible.value = true
  } finally {
    operating.value = null
  }
}

const handleOperateSubmit = async () => {
  if (!currentOperateRow.value) return
  operating.value = currentOperateRow.value.id
  try {
    await operateDanmakuApi(currentOperateRow.value.id, {
      operationType: currentOperateType.value as any,
      remark: operateRemark.value || undefined,
    })
    ElMessage.success(`${operateTypeLabel.value}操作成功`)
    const row = listData.value.find((r) => r.id === currentOperateRow.value!.id)
    if (row) {
      const type = currentOperateType.value
      const opItem = getEnumItem(DANMAKU_OPERATE_TYPE, type)
      if (type === 'DELETE') {
        const idx = listData.value.findIndex((r) => r.id === currentOperateRow.value!.id)
        if (idx !== -1) {
          listData.value.splice(idx, 1)
          total.value--
        }
      } else if (opItem && opItem.nextStatus !== undefined) {
        Object.assign(row, { danmakuStatus: opItem.nextStatus })
      }
    }
    operateDialogVisible.value = false
  } finally {
    operating.value = null
  }
}

const archiveDialogVisible = ref(false)
const archiveContentId = ref<number | null>(null)
const archiving = ref(false)

const openArchiveDialog = () => {
  archiveContentId.value = null
  archiveDialogVisible.value = true
}

const handleArchiveSubmit = async () => {
  if (!archiveContentId.value) {
    ElMessage.warning('请输入视频ID')
    return
  }
  archiving.value = true
  try {
    await archiveDanmakusByContentApi(archiveContentId.value)
    ElMessage.success('归档操作成功')
    archiveDialogVisible.value = false
    loadData()
  } finally {
    archiving.value = false
  }
}

const tableColumns = [
  { prop: 'danmakuContent', label: '弹幕内容', minWidth: 200, showOverflowTooltip: true, slot: 'danmakuContent', className: getHighRiskCellClass },
  { prop: 'contentId', label: '关联视频', minWidth: 160, showOverflowTooltip: true, slot: 'contentInfo', className: getHighRiskCellClass },
  { prop: 'userId', label: '发送用户', width: 140, align: 'center', slot: 'userInfo', className: getHighRiskCellClass },
  { prop: 'playTime', label: '出现时间', width: 90, align: 'center', slot: 'playTime', className: getHighRiskCellClass },
  { prop: 'createdAt', label: '发送时间', width: 170, align: 'center', slot: 'createdAt', className: getHighRiskCellClass },
  { prop: 'danmakuType', label: '弹幕类型', width: 100, align: 'center', slot: 'danmakuType', className: getHighRiskCellClass },
  { prop: 'likeCount', label: '点赞数', width: 80, align: 'center', className: getHighRiskCellClass },
  { prop: 'reportCount', label: '举报数', width: 80, align: 'center', className: getHighRiskCellClass },
  { prop: 'violationLevel', label: '违规等级', width: 100, align: 'center', slot: 'violationLevel', className: getHighRiskCellClass },
  { prop: 'violationType', label: '违规类型', width: 110, align: 'center', slot: 'violationType', className: getHighRiskCellClass },
  { prop: 'danmakuStatus', label: '弹幕状态', width: 100, align: 'center', slot: 'danmakuStatus', className: getHighRiskCellClass },
  { label: '操作', width: 260, fixed: 'right', align: 'center', slot: 'actions', className: getHighRiskCellClass },
]

const getRowClass = (row: DanmakuItem) => {
  if (row.isHighRisk === 1) {
    return 'high-risk-row'
  }
  return ''
}

const getHighRiskCellClass = ({ row }: { row: DanmakuItem }) => {
  return row.isHighRisk === 1 ? 'high-risk-cell' : ''
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="danmaku-manage-page">
    <div class="filter-bar danmaku-filter">
      <el-form :inline="true" :model="queryParams" @submit.prevent>
        <el-form-item label="关联视频">
          <div class="filter-input-wrap">
            <el-input-number
              v-model="queryParams.contentId"
              :min="0"
              :controls="false"
              placeholder="视频ID"
              style="width: 120px"
              :class="{ 'input-error': contentIdError }"
              @change="validateNumberInput($event, 'contentId')"
            />
            <el-icon v-if="queryParams.contentId !== null" color="#67C23A" class="filter-check"><CircleCheck /></el-icon>
          </div>
        </el-form-item>
        <el-form-item label="发送时段">
          <div class="filter-input-wrap">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              style="width: 260px"
            />
            <el-icon v-if="dateRange" color="#67C23A" class="filter-check"><CircleCheck /></el-icon>
          </div>
        </el-form-item>
        <el-form-item label="发送用户">
          <div class="filter-input-wrap">
            <el-input-number
              v-model="queryParams.userId"
              :min="0"
              :controls="false"
              placeholder="用户ID"
              style="width: 120px"
              :class="{ 'input-error': userIdError }"
              @change="validateNumberInput($event, 'userId')"
            />
            <el-icon v-if="queryParams.userId !== null" color="#67C23A" class="filter-check"><CircleCheck /></el-icon>
          </div>
        </el-form-item>
        <el-form-item label="弹幕状态">
          <div class="filter-input-wrap">
            <el-select
              v-model="queryParams.danmakuStatus"
              placeholder="全部状态"
              clearable
              style="width: 120px"
            >
              <el-option
                v-for="item in danmakuStatusOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
            <el-icon v-if="queryParams.danmakuStatus !== null" color="#67C23A" class="filter-check"><CircleCheck /></el-icon>
          </div>
        </el-form-item>
        <el-form-item label="违规等级">
          <div class="filter-input-wrap">
            <el-select
              v-model="queryParams.violationLevel"
              placeholder="全部等级"
              clearable
              style="width: 120px"
            >
              <el-option
                v-for="item in violationLevelOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
            <el-icon v-if="queryParams.violationLevel !== null" color="#67C23A" class="filter-check"><CircleCheck /></el-icon>
          </div>
        </el-form-item>
        <el-form-item label="是否高危">
          <div class="filter-input-wrap">
            <el-select
              v-model="queryParams.isHighRisk"
              placeholder="全部"
              clearable
              style="width: 100px"
            >
              <el-option
                v-for="item in yesNoOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
            <el-icon v-if="queryParams.isHighRisk !== null" color="#67C23A" class="filter-check"><CircleCheck /></el-icon>
          </div>
        </el-form-item>
        <el-form-item label="是否实时弹幕">
          <div class="filter-input-wrap">
            <el-select
              v-model="queryParams.isRealTime"
              placeholder="全部"
              clearable
              style="width: 100px"
            >
              <el-option
                v-for="item in realTimeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
            <el-icon v-if="queryParams.isRealTime !== null" color="#67C23A" class="filter-check"><CircleCheck /></el-icon>
          </div>
        </el-form-item>
        <el-form-item label="是否归档">
          <div class="filter-input-wrap">
            <el-select
              v-model="queryParams.isArchived"
              placeholder="全部"
              clearable
              style="width: 100px"
            >
              <el-option
                v-for="item in yesNoOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
            <el-icon v-if="queryParams.isArchived !== null" color="#67C23A" class="filter-check"><CircleCheck /></el-icon>
          </div>
        </el-form-item>
        <el-form-item label="违规类型">
          <div class="filter-input-wrap">
            <el-select
              v-model="queryParams.violationType"
              placeholder="全部类型"
              clearable
              style="width: 120px"
            >
              <el-option
                v-for="item in violationTypeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
            <el-icon v-if="queryParams.violationType !== null" color="#67C23A" class="filter-check"><CircleCheck /></el-icon>
          </div>
        </el-form-item>
        <el-form-item label="播放时段">
          <div class="filter-input-wrap">
            <div class="range-input">
              <el-input-number
                v-model="queryParams.playTimeStart"
                :min="0"
                :controls="false"
                placeholder="起始秒"
                style="width: 90px"
                :class="{ 'input-error': playTimeStartError }"
                @change="validateNumberInput($event, 'playTimeStart')"
              />
              <span class="range-separator">-</span>
              <el-input-number
                v-model="queryParams.playTimeEnd"
                :min="0"
                :controls="false"
                placeholder="结束秒"
                style="width: 90px"
                :class="{ 'input-error': playTimeEndError }"
                @change="validateNumberInput($event, 'playTimeEnd')"
              />
            </div>
            <el-icon v-if="queryParams.playTimeStart !== null || queryParams.playTimeEnd !== null" color="#67C23A" class="filter-check"><CircleCheck /></el-icon>
          </div>
        </el-form-item>
        <el-form-item label="是否热门视频弹幕">
          <div class="filter-input-wrap">
            <el-select
              v-model="queryParams.isHotVideo"
              placeholder="全部"
              clearable
              style="width: 100px"
            >
              <el-option
                v-for="item in yesNoOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
            <el-icon v-if="queryParams.isHotVideo !== null" color="#67C23A" class="filter-check"><CircleCheck /></el-icon>
          </div>
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
        :show-create="false"
        :show-batch-actions="false"
        :show-refresh="true"
        @refresh="loadData"
      >
        <template #left>
          <el-button type="info" :icon="FolderOpened" @click="openArchiveDialog">归档视频弹幕</el-button>
        </template>
      </QyTableToolbar>

      <QySkeleton :loading="loading" variant="table">
        <QyDataTable
          :columns="tableColumns"
          :data="listData"
          :loading="loading"
          :total="total"
          :page="queryParams.page"
          :page-size="queryParams.pageSize"
          :selection="true"
          :index="true"
          @selection-change="handleSelectionChange"
          @page-change="handlePageChange"
          @size-change="handleSizeChange"
        >
          <template #danmakuContent="{ row }">
            <div class="danmaku-content-cell status-transition">
              <span class="danmaku-text" :style="{ color: row.danmakuColor || '#ffffff' }">{{ row.danmakuContent }}</span>
              <div class="danmaku-badges">
                <el-tag v-if="row.isHighRisk === 1" type="danger" size="small" effect="dark" class="badge-tag">高危</el-tag>
                <el-tag v-if="row.danmakuStatus === 0" type="warning" size="small" effect="light" class="badge-tag">待审核</el-tag>
              </div>
            </div>
          </template>

          <template #contentInfo="{ row }">
            <div class="content-info-cell">
              <span v-if="row.content" class="content-title">
                <el-icon><VideoPlay /></el-icon>
                {{ row.content.contentTitle }}
              </span>
              <span v-else style="color: #909399">-</span>
              <el-tag v-if="row.content?.isHot === 1" type="danger" size="small" effect="dark" class="hot-tag">热门</el-tag>
            </div>
          </template>

          <template #userInfo="{ row }">
            <div class="user-info-cell">
              <span v-if="row.user">{{ row.user.nickname || row.user.username }}</span>
              <span v-else style="color: #909399">-</span>
              <el-tag v-if="row.user?.userLevel" type="primary" size="small" class="level-tag">
                Lv.{{ row.user.userLevel }}
              </el-tag>
              <span v-if="row.user?.danmakuViolationCount" class="violation-count">
                违规{{ row.user.danmakuViolationCount }}次
              </span>
            </div>
          </template>

          <template #playTime="{ row }">
            <span class="play-time">
              <el-icon><Clock /></el-icon>
              {{ formatPlayTime(row.playTime) }}
            </span>
          </template>

          <template #createdAt="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>

          <template #danmakuType="{ row }">
            <el-tag size="small" :color="getEnumItem(DANMAKU_TYPE, row.danmakuType)?.color" effect="plain">
              {{ getEnumLabel(DANMAKU_TYPE, row.danmakuType) }}
            </el-tag>
          </template>

          <template #violationLevel="{ row }">
            <el-tag
              :type="getEnumItem(VIOLATION_LEVEL, row.violationLevel)?.type || 'info'"
              size="small"
            >
              {{ getEnumLabel(VIOLATION_LEVEL, row.violationLevel) }}
            </el-tag>
          </template>

          <template #violationType="{ row }">
            <span v-if="row.violationType">
              {{ getEnumLabel(DANMAKU_VIOLATION_TYPE, row.violationType) }}
            </span>
            <span v-else style="color: #909399">-</span>
          </template>

          <template #danmakuStatus="{ row }">
            <el-tag
              :type="getEnumItem(DANMAKU_STATUS, row.danmakuStatus)?.type || 'info'"
              size="small"
              class="status-transition"
            >
              {{ getEnumLabel(DANMAKU_STATUS, row.danmakuStatus) }}
            </el-tag>
          </template>

          <template #actions="{ row }">
            <template v-if="row.danmakuStatus === 0">
              <el-button
                type="success"
                link
                :icon="Check"
                :loading="operating === row.id"
                class="ripple-btn"
                @click="openOperateDialog(row, 'APPROVE')"
              >审核通过</el-button>
              <el-button
                type="warning"
                link
                :icon="Hide"
                :loading="operating === row.id"
                class="ripple-btn"
                @click="openOperateDialog(row, 'TEMP_BLOCK')"
              >临时屏蔽</el-button>
              <el-button
                type="danger"
                link
                :icon="CircleClose"
                :loading="operating === row.id"
                class="ripple-btn"
                @click="openOperateDialog(row, 'PERMA_BAN')"
              >永久封禁</el-button>
            </template>
            <template v-else-if="row.danmakuStatus === 1">
              <el-button
                type="warning"
                link
                :icon="Hide"
                :loading="operating === row.id"
                class="ripple-btn"
                @click="openOperateDialog(row, 'TEMP_BLOCK')"
              >临时屏蔽</el-button>
              <el-button
                type="danger"
                link
                :icon="CircleClose"
                :loading="operating === row.id"
                class="ripple-btn"
                @click="openOperateDialog(row, 'PERMA_BAN')"
              >永久封禁</el-button>
              <el-button
                type="danger"
                link
                :icon="Delete"
                :loading="operating === row.id"
                class="ripple-btn"
                @click="openOperateDialog(row, 'DELETE')"
              >删除</el-button>
            </template>
            <template v-else-if="row.danmakuStatus === 2">
              <el-button
                type="primary"
                link
                :icon="View"
                :loading="operating === row.id"
                class="ripple-btn"
                @click="openOperateDialog(row, 'UNBLOCK')"
              >恢复展示</el-button>
              <el-button
                type="danger"
                link
                :icon="CircleClose"
                :loading="operating === row.id"
                class="ripple-btn"
                @click="openOperateDialog(row, 'PERMA_BAN')"
              >永久封禁</el-button>
              <el-button
                type="danger"
                link
                :icon="Delete"
                :loading="operating === row.id"
                class="ripple-btn"
                @click="openOperateDialog(row, 'DELETE')"
              >删除</el-button>
            </template>
            <template v-else-if="row.danmakuStatus === 3">
              <el-button
                type="danger"
                link
                :icon="Delete"
                :loading="operating === row.id"
                class="ripple-btn"
                @click="openOperateDialog(row, 'DELETE')"
              >删除</el-button>
            </template>
            <template v-else-if="row.danmakuStatus === 4">
              <el-button
                type="primary"
                link
                :icon="View"
                :loading="operating === row.id"
                class="ripple-btn"
                @click="openOperateDialog(row, 'UNBLOCK')"
              >恢复</el-button>
              <el-button
                type="danger"
                link
                :icon="Delete"
                :loading="operating === row.id"
                class="ripple-btn"
                @click="openOperateDialog(row, 'DELETE')"
              >删除</el-button>
            </template>
          </template>
        </QyDataTable>
      </QySkeleton>
    </div>

    <el-dialog
      v-model="operateDialogVisible"
      :title="operateTypeLabel + '操作'"
      width="520px"
      custom-class="operate-dialog"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <template v-if="currentOperateRow">
        <div class="operate-info">
          <div class="operate-type-row">
            <span class="operate-label">操作类型：</span>
            <el-tag :type="operateTypeIcon" size="small">{{ operateTypeLabel }}</el-tag>
          </div>
          <div class="operate-preview">
            <span class="operate-label">弹幕预览：</span>
            <div class="preview-content danmaku-preview" :style="{ color: currentOperateRow.danmakuColor || '#ffffff' }">
              {{ currentOperateRow.danmakuContent }}
            </div>
          </div>
          <div class="operate-status-compare">
            <div class="status-item">
              <span class="status-label">当前状态</span>
              <el-tag
                :type="getEnumItem(DANMAKU_STATUS, currentOperateRow.danmakuStatus)?.type || 'info'"
                size="small"
                class="status-transition"
              >
                {{ getEnumLabel(DANMAKU_STATUS, currentOperateRow.danmakuStatus) }}
              </el-tag>
            </div>
            <el-icon class="arrow-icon"><VideoPlay /></el-icon>
            <div class="status-item">
              <span class="status-label">目标状态</span>
              <el-tag
                :type="operateTypeIcon"
                size="small"
                class="status-transition"
              >
                {{ targetStatusLabel || '已删除' }}
              </el-tag>
            </div>
          </div>
          <div v-if="currentOperateRow.user?.danmakuViolationCount !== undefined" class="user-violation-info">
            <el-icon color="#E6A23C"><Warning /></el-icon>
            <span>用户当前弹幕违规次数：<strong>{{ currentOperateRow.user.danmakuViolationCount }}</strong> 次</span>
          </div>
        </div>

        <div v-if="validateResult && !validateResult.valid" class="validate-warning">
          <el-alert type="error" :closable="false">
            <template #title>
              <div>操作不可执行，原因如下：</div>
            </template>
            <ul class="validate-reasons">
              <li v-for="(reason, idx) in validateResult.reasons" :key="idx">{{ reason }}</li>
            </ul>
          </el-alert>
        </div>

        <div v-if="duplicateResult && duplicateResult.isDuplicate" class="duplicate-warning">
          <el-alert type="warning" :closable="false">
            <template #title>
              <div>检测到重复操作</div>
            </template>
            <div v-if="duplicateResult.lastOperation">
              上次操作：{{ duplicateResult.lastOperation.operationType }}，
              操作人：{{ duplicateResult.lastOperation.operatorName || '系统' }}，
              时间：{{ formatDate(duplicateResult.lastOperation.createdAt) }}
            </div>
            <div style="margin-top: 4px">是否仍要继续操作？</div>
          </el-alert>
        </div>

        <el-form v-if="!validateResult || validateResult.valid" label-position="top" style="margin-top: 16px">
          <el-form-item label="操作备注">
            <el-input
              v-model="operateRemark"
              type="textarea"
              :rows="3"
              placeholder="请输入操作备注（选填）"
            />
          </el-form-item>
        </el-form>
      </template>

      <template #footer>
        <el-button @click="operateDialogVisible = false">取消</el-button>
        <el-button
          v-if="!validateResult || validateResult.valid"
          type="primary"
          :loading="operating !== null"
          class="ripple-btn"
          @click="handleOperateSubmit"
        >确认{{ operateTypeLabel }}</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="archiveDialogVisible"
      title="归档视频弹幕"
      width="420px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form label-position="top">
        <el-form-item label="视频ID">
          <el-input-number
            v-model="archiveContentId"
            :min="1"
            :controls="false"
            placeholder="请输入视频ID"
            style="width: 100%"
          />
        </el-form-item>
        <el-alert type="info" :closable="false">
          归档后该视频的所有弹幕将被移至归档状态，不再参与实时展示。
        </el-alert>
      </el-form>
      <template #footer>
        <el-button @click="archiveDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="archiving" @click="handleArchiveSubmit">确认归档</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.danmaku-manage-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.danmaku-filter {
  .el-input__wrapper:focus-within {
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
    border-color: #409EFF;
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}

.input-error {
  animation: shake 0.3s ease-in-out;
}

.filter-input-wrap {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.filter-check {
  flex-shrink: 0;
}

.range-input {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.range-separator {
  color: #909399;
}

.ripple-btn {
  position: relative;
  overflow: hidden;
}

.ripple-btn::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.3s, height 0.3s;
}

.ripple-btn:active::after {
  width: 200%;
  height: 200%;
}

.status-transition {
  transition: all 0.3s ease;
}

.danmaku-content-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.danmaku-text {
  background: #303133;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 13px;
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.danmaku-badges {
  display: flex;
  gap: 4px;
}

.badge-tag {
  flex-shrink: 0;
}

.content-info-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.content-title {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--el-color-primary);
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
}

.hot-tag {
  flex-shrink: 0;
}

.user-info-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: center;
}

.level-tag {
  flex-shrink: 0;
}

.violation-count {
  font-size: 12px;
  color: #E6A23C;
}

.play-time {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: monospace;
}

.operate-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.operate-type-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.operate-label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.operate-preview {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.preview-content {
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 4px;
  font-size: 13px;
  color: #303133;
  line-height: 1.5;
  max-height: 100px;
  overflow-y: auto;
}

.danmaku-preview {
  background: #303133;
  color: #ffffff;
  font-weight: 500;
}

.operate-status-compare {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
}

.status-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.status-label {
  font-size: 12px;
  color: #909399;
}

.arrow-icon {
  color: #909399;
  font-size: 20px;
}

.user-violation-info {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: #fdf6ec;
  border-radius: 4px;
  font-size: 13px;
  color: #e6a23c;

  strong {
    color: #e6a23c;
  }
}

.validate-warning {
  margin-top: 12px;
}

.validate-reasons {
  margin: 4px 0 0;
  padding-left: 16px;
  font-size: 13px;
  line-height: 1.6;
}

.duplicate-warning {
  margin-top: 12px;
}

:deep(.high-risk-cell) {
  background-color: rgba(245, 108, 108, 0.08) !important;
}

:deep(.el-table__row:hover .high-risk-cell) {
  background-color: rgba(245, 108, 108, 0.12) !important;
}

:deep(.high-risk-row) {
  background-color: rgba(245, 108, 108, 0.08) !important;
}

:deep(.high-risk-row:hover) {
  background-color: rgba(245, 108, 108, 0.12) !important;
}
</style>

<style lang="scss">
.operate-dialog {
  --el-dialog-transition-duration: 0.3s;

  &.el-dialog {
    transition: all 0.3s ease;
  }

  .el-overlay-dialog .el-dialog {
    transform: scale(1);
    opacity: 1;
  }
}

.el-overlay-dialog .operate-dialog {
  transition: transform 0.3s ease, opacity 0.3s ease;
}
</style>
