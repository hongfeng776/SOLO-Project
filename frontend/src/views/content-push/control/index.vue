<template>
  <div class="page-container" v-loading.fullscreen.lock="batchRunning" element-loading-text="批量操作执行中...">
    <el-row :gutter="16" class="stats-row">
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">推送任务总数</div>
          <div class="stat-value">{{ formatNumber(stats.total) }}</div>
          <div class="stat-sub">今日新增 <span class="sub-val">{{ formatNumber(stats.todayCreated) }}</span></div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card pushing">
          <div class="stat-label">推送中</div>
          <div class="stat-value">{{ formatNumber(stats.statusMap?.[1] || 0) }}</div>
          <div class="progress-ring" :style="{ '--progress': stats.total > 0 ? (stats.statusMap?.[1] || 0) / stats.total * 100 + '%' : '0%' }"></div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card paused">
          <div class="stat-label">已暂停</div>
          <div class="stat-value">{{ formatNumber(stats.statusMap?.[2] || 0) }}</div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card blocked">
          <div class="stat-label">已拦截</div>
          <div class="stat-value">{{ formatNumber(stats.statusMap?.[5] || 0) }}</div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card exposure">
          <div class="stat-label">累计曝光量</div>
          <div class="stat-value number-format">{{ formatNumber(stats.totalExposure) }}</div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card ctr">
          <div class="stat-label">整体点击率</div>
          <div class="stat-value">{{ stats.clickRate }}<span class="unit">%</span></div>
          <el-progress
            :percentage="Math.min(100, stats.clickRate * 5)"
            :stroke-width="6"
            :show-text="false"
            class="ctr-bar"
          />
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" class="mb-20">
      <el-form :model="queryParams" label-width="100px" inline @submit.prevent>
        <el-form-item label="关键词">
          <el-input
            v-model="queryParams.keyword"
            placeholder="任务编号/笔记标题/作者"
            clearable
            style="width: 220px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="推送状态">
          <el-select
            v-model="queryParams.pushStatus"
            placeholder="全部状态"
            clearable
            style="width: 140px"
          >
            <el-option
              v-for="(name, val) in CONTENT_PUSH_STATUS_NAMES"
              :key="val"
              :label="name"
              :value="Number(val)"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="流量池等级">
          <el-select
            v-model="queryParams.poolLevel"
            placeholder="全部等级"
            clearable
            style="width: 120px"
          >
            <el-option
              v-for="(name, val) in TRAFFIC_POOL_LEVEL_NAMES"
              :key="val"
              :label="name"
              :value="Number(val)"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="推送力度">
          <el-select
            v-model="queryParams.pushStrength"
            placeholder="全部力度"
            clearable
            style="width: 110px"
          >
            <el-option
              v-for="(name, val) in CONTENT_PUSH_STRENGTH_NAMES"
              :key="val"
              :label="name"
              :value="Number(val)"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="匹配度">
          <el-input-number
            v-model="queryParams.minMatchScore"
            :min="0" :max="100" :step="5"
            placeholder="最低"
            style="width: 100px"
            controls-position="right"
          />
          <span class="range-split">~</span>
          <el-input-number
            v-model="queryParams.maxMatchScore"
            :min="0" :max="100" :step="5"
            placeholder="最高"
            style="width: 100px"
            controls-position="right"
          />
        </el-form-item>
        <el-form-item label="异常">
          <el-switch
            v-model="queryParams.hasAnomaly"
            active-text="仅异常"
            inactive-text=""
            :active-value="'1'"
            :inactive-value="''"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" :loading="loading" @click="handleSearch">查询</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">推送任务列表</span>
          <div class="header-actions">
            <el-button
              type="primary"
              :icon="Promotion"
              :disabled="!permission.canCreate"
              @click="handleCreate"
            >
              创建推送任务
            </el-button>
            <el-tooltip
              v-if="!permission.canCreate"
              content="您没有创建推送任务的权限"
              placement="top"
            >
              <span></span>
            </el-tooltip>
          </div>
        </div>
      </template>

      <BatchActions
        v-if="permission.canBatch"
        :selected-ids="selectedIds"
        :selected-rows="selectedRows as unknown[]"
        :total="total"
        :allow-delete="false"
        :allow-export="false"
        always-show
        @select-all="handleBatchSelectAll"
        @clear="handleClearSelection"
      >
        <template #default="{ selectedCount }">
          <el-tooltip
            :content="permission.canCreate ? '启动选中任务推送' : '您没有批量启动权限'"
            placement="top"
          >
            <el-button
              type="primary"
              size="small"
              plain
              ripple-btn
              :icon="VideoPlay"
              :disabled="selectedCount === 0 || !permission.canCreate"
              @click="handleBatchStart"
            >
              批量启动
            </el-button>
          </el-tooltip>
          <el-tooltip
            :content="permission.canPause ? '暂停选中的推送任务' : '您没有批量暂停权限'"
            placement="top"
          >
            <el-button
              type="warning"
              size="small"
              plain
              ripple-btn
              :icon="VideoPause"
              :disabled="selectedCount === 0 || !permission.canPause"
              @click="handleBatchPause"
            >
              批量暂停
            </el-button>
          </el-tooltip>
          <el-tooltip
            :content="permission.canTerminate ? '终止选中任务（需高级权限）' : '您没有批量终止权限'"
            placement="top"
          >
            <el-button
              type="danger"
              size="small"
              plain
              ripple-btn
              :icon="CircleClose"
              :disabled="selectedCount === 0 || !permission.canTerminate"
              @click="handleBatchTerminate"
            >
              批量终止
            </el-button>
          </el-tooltip>
          <el-divider direction="vertical" />
          <el-tooltip
            :content="permission.canAdjustStrength ? '加强推送力度' : '您没有调整力度权限'"
            placement="top"
          >
            <el-button
              size="small"
              ripple-btn
              :icon="Top"
              :disabled="selectedCount === 0 || !permission.canAdjustStrength"
              @click="handleBatchStrengthen"
            >
              批量加强
            </el-button>
          </el-tooltip>
          <el-tooltip
            :content="permission.canAdjustStrength ? '激进推送（最大力度）' : '您没有调整力度权限'"
            placement="top"
          >
            <el-button
              type="danger"
              size="small"
              ripple-btn
              :icon="Odometer"
              plain
              :disabled="selectedCount === 0 || !permission.canAdjustStrength"
              @click="handleBatchEnhance"
            >
              优质内容激进推送
            </el-button>
          </el-tooltip>
        </template>
      </BatchActions>

      <div v-if="batchProgress.visible" class="batch-progress-bar">
        <div class="progress-header">
          <span>批量{{ batchProgress.operationName }}执行中</span>
          <span class="progress-num">
            {{ batchProgress.done }} / {{ batchProgress.total }}
            <span class="progress-pct">({{ Math.round(batchProgress.done / batchProgress.total * 100) }}%)</span>
          </span>
        </div>
        <el-progress
          :percentage="Math.round(batchProgress.done / batchProgress.total * 100)"
          :stroke-width="8"
          :status="batchProgress.done === batchProgress.total ? 'success' : undefined"
          striped
          striped-flow
        />
      </div>

      <div class="table-wrapper">
        <el-table
          :data="dataList"
          :loading="loading"
          border
          stripe
          row-key="id"
          @row-dblclick="handleRowDblClick"
          :row-class-name="getRowClassName"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column label="任务信息" min-width="260">
            <template #default="{ row }">
              <div class="task-info-cell">
                <div class="task-top">
                  <span class="task-no" @click="handleCopyTaskNo(row.taskNo)">{{ row.taskNo }}</span>
                  <el-tag
                    class="status-tag"
                    :type="CONTENT_PUSH_STATUS_TAG_TYPES[row.pushStatus]"
                    effect="light"
                    size="small"
                  >
                    {{ CONTENT_PUSH_STATUS_NAMES[row.pushStatus] }}
                  </el-tag>
                </div>
                <el-tooltip :content="row.noteTitle" placement="top" effect="dark">
                  <div class="note-title">{{ row.noteTitle }}</div>
                </el-tooltip>
                <div class="note-meta">
                  <span>作者：{{ row.authorName }}</span>
                  <span class="meta-split">|</span>
                  <span>流量池：{{ row.poolName }}</span>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="推送力度" width="100" align="center">
            <template #default="{ row }">
              <div class="strength-cell">
                <div class="strength-bar">
                  <div
                    class="strength-fill"
                    :class="'s-' + row.pushStrength"
                    :style="{ width: (row.pushStrength / 3 * 100) + '%' }"
                  ></div>
                </div>
                <span class="strength-name" :style="{ color: CONTENT_PUSH_STRENGTH_COLORS[row.pushStrength] }">
                  {{ CONTENT_PUSH_STRENGTH_NAMES[row.pushStrength] }}
                </span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="匹配度" width="150" align="center">
            <template #default="{ row }">
              <div class="match-score-cell">
                <el-progress
                  :percentage="Number(row.matchScore)"
                  :color="getMatchColor(row.matchScore)"
                  :stroke-width="10"
                  :show-text="false"
                />
                <div class="score-row">
                  <span
                    class="score-main"
                    :class="row.matchScore >= 60 ? 'pass' : 'fail'"
                  >{{ Number(row.matchScore).toFixed(1) }}</span>
                  <div class="score-sub">
                    <span title="内容标签">T:{{ row.tagMatchScore }}</span>
                    <span title="兴趣匹配">I:{{ row.interestMatchScore }}</span>
                    <span title="画像匹配">P:{{ row.profileMatchScore }}</span>
                  </div>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="曝光数据" min-width="280">
            <template #default="{ row }">
              <div class="exposure-cell">
                <div class="exposure-row">
                  <div class="exposure-item">
                    <div class="exposure-label">目标曝光</div>
                    <div class="exposure-val number-format">{{ formatNumber(row.targetExposure) }}</div>
                  </div>
                  <div class="exposure-item main" :class="{ 'data-pulse': row.pushStatus === 1 }">
                    <div class="exposure-label">累计曝光</div>
                    <div class="exposure-val number-format big">{{ formatNumber(row.currentExposure) }}</div>
                  </div>
                  <div class="exposure-item">
                    <div class="exposure-label">真实曝光</div>
                    <div class="exposure-val number-format">{{ formatNumber(row.realExposure) }}</div>
                  </div>
                </div>
                <div class="exposure-progress">
                  <el-progress
                    :percentage="row.targetExposure > 0 ? Math.min(100, Math.round(row.currentExposure / row.targetExposure * 100)) : 0"
                    :stroke-width="4"
                    :show-text="true"
                    text-inside
                  />
                </div>
                <div class="interact-row">
                  <span class="interact-item">
                    <el-icon><Pointer /></el-icon>
                    <span class="number-format">{{ formatNumber(row.clickCount) }}</span>
                  </span>
                  <span class="interact-item">
                    <el-icon><Star /></el-icon>
                    <span class="number-format">{{ formatNumber(row.likeCount) }}</span>
                  </span>
                  <span class="interact-item">
                    <el-icon><ChatDotRound /></el-icon>
                    <span class="number-format">{{ formatNumber(row.commentCount) }}</span>
                  </span>
                  <span class="interact-item">
                    <el-icon><Share /></el-icon>
                    <span class="number-format">{{ formatNumber(row.shareCount) }}</span>
                  </span>
                  <span class="interact-item ctr">
                    CTR: {{ row.currentExposure > 0 ? (row.clickCount / row.currentExposure * 100).toFixed(2) : '0.00' }}%
                  </span>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="异常标记" width="100" align="center">
            <template #default="{ row }">
              <template v-if="row.anomalyCount > 0">
                <el-tooltip :content="'异常次数：' + row.anomalyCount" placement="top">
                  <el-tag type="danger" effect="dark" size="small">
                    <el-icon><Warning /></el-icon> {{ row.anomalyCount }}
                  </el-tag>
                </el-tooltip>
              </template>
              <span v-else class="normal-text">-</span>
            </template>
          </el-table-column>

          <el-table-column label="拦截说明" width="160">
            <template #default="{ row }">
              <template v-if="row.pushStatus === 5 || row.blockReason">
                <el-tooltip :content="row.blockDetail || ''" placement="top" effect="dark">
                  <div class="block-cell">
                    <span class="block-reason">{{ PUSH_BLOCK_REASON_NAMES[row.blockReason || ''] || row.blockReason }}</span>
                    <span v-if="row.blockDetail" class="block-detail-link">
                      <el-icon><InfoFilled /></el-icon>
                    </span>
                  </div>
                </el-tooltip>
              </template>
              <span v-else class="normal-text">-</span>
            </template>
          </el-table-column>

          <el-table-column label="创建时间" width="160">
            <template #default="{ row }">
              <span class="time-cell">{{ formatDateTime(row.createTime) }}</span>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="240" align="center" fixed="right">
            <template #default="{ row }">
              <template v-if="row.pushStatus === 0">
                <el-button link type="primary" size="small" :disabled="!permission.canCreate" @click="handleStart(row)">
                  启动
                </el-button>
              </template>
              <template v-if="row.pushStatus === 1">
                <el-button link type="warning" size="small" :disabled="!permission.canPause" @click="handlePause(row)">
                  暂停
                </el-button>
              </template>
              <template v-if="row.pushStatus === 2">
                <el-button link type="primary" size="small" :disabled="!permission.canCreate" @click="handleStart(row)">
                  恢复
                </el-button>
              </template>
              <template v-if="row.pushStatus < 3 || row.pushStatus === 4">
                <el-button link type="danger" size="small" :disabled="!permission.canTerminate" @click="handleTerminate(row)">
                  终止
                </el-button>
              </template>
              <el-dropdown trigger="click" @command="(cmd: any) => handleCommand(cmd, row)" v-if="permission.canAdjustStrength || permission.canViewTrace">
                <el-button link type="primary" size="small">
                  更多 <el-icon><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="refresh" :icon="Refresh">刷新数据</el-dropdown-item>
                    <el-dropdown-item
                      command="strength-up"
                      :icon="Top"
                      :disabled="!permission.canAdjustStrength || row.pushStrength >= 3"
                    >提升力度</el-dropdown-item>
                    <el-dropdown-item
                      command="strength-down"
                      :icon="Bottom"
                      :disabled="!permission.canAdjustStrength || row.pushStrength <= 1"
                    >降低力度</el-dropdown-item>
                    <el-dropdown-item
                      command="chain"
                      :icon="Aim"
                      :disabled="!permission.canViewTrace"
                    >查看全链路</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="queryParams.page"
          v-model:page-size="queryParams.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="fetchData"
          @current-change="fetchData"
        />
      </div>
    </el-card>

    <CreatePushDialog
      v-model="createDialogVisible"
      @created="fetchAll"
    />

    <MatchFailDialog
      v-model="matchFailVisible"
      :validation-result="currentMatchFailResult"
    />

    <FullChainDialog
      v-model="chainDialogVisible"
      :task-id="currentChainTaskId"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import {
  Search, Refresh, Promotion, VideoPlay, VideoPause, CircleClose,
  Top, Odometer, Pointer, Star, ChatDotRound, Share, ArrowDown,
  Aim, InfoFilled, Warning, Bottom
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, ElTooltip } from 'element-plus'
import { useUserStore } from '@stores/modules/user'
import { useFetchList, formatDateTime, formatNumber, useCopy } from '@hooks/index'
import {
  getContentPushList,
  getContentPushStats,
  startContentPush,
  pauseContentPush,
  terminateContentPush,
  adjustContentPushStrength,
  refreshContentPushStats,
  batchContentPushOperation
} from '@api/content-push'
import type {
  ContentPushTask,
  ContentPushPermission,
  PushBatchResult,
  PushCreateValidationResult
} from '@/types/business'
import {
  CONTENT_PUSH_STATUS_NAMES,
  CONTENT_PUSH_STATUS_TAG_TYPES,
  CONTENT_PUSH_STRENGTH_NAMES,
  CONTENT_PUSH_STRENGTH_COLORS,
  PUSH_BLOCK_REASON_NAMES,
  TRAFFIC_POOL_LEVEL_NAMES
} from '@/enums/business'
import BatchActions from '@components/BatchActions/index.vue'
import CreatePushDialog from './components/CreatePushDialog.vue'
import MatchFailDialog from './components/MatchFailDialog.vue'
import FullChainDialog from '../trace/components/FullChainDialog.vue'

const userStore = useUserStore()
const { handleCopy } = useCopy()

const permission = ref<ContentPushPermission>({
  canView: false, canCreate: false, canEdit: false, canPause: false,
  canTerminate: false, canBatch: false, canViewTrace: false, canAdjustStrength: false
})

const computePermission = () => {
  const hasRole = (r: string) => userStore.hasRole(r)
  permission.value = {
    canView: hasRole('admin') || hasRole('operation_admin') || hasRole('senior_operator') || hasRole('operator') || hasRole('auditor'),
    canCreate: hasRole('admin') || hasRole('operation_admin') || hasRole('senior_operator') || hasRole('operator'),
    canEdit: hasRole('admin') || hasRole('operation_admin') || hasRole('senior_operator'),
    canPause: hasRole('admin') || hasRole('operation_admin') || hasRole('senior_operator') || hasRole('operator'),
    canTerminate: hasRole('admin') || hasRole('operation_admin') || hasRole('senior_operator'),
    canBatch: hasRole('admin') || hasRole('operation_admin') || hasRole('senior_operator'),
    canViewTrace: hasRole('admin') || hasRole('operation_admin') || hasRole('senior_operator') || hasRole('auditor'),
    canAdjustStrength: hasRole('admin') || hasRole('operation_admin') || hasRole('senior_operator')
  }
}

const queryParams = reactive({
  page: 1, pageSize: 20,
  keyword: '',
  pushStatus: undefined as number | undefined,
  poolLevel: undefined as number | undefined,
  pushStrength: undefined as number | undefined,
  minMatchScore: undefined as number | undefined,
  maxMatchScore: undefined as number | undefined,
  hasAnomaly: '' as string
})

const {
  loading, dataList, total, fetchData, handleSearch, handleReset
} = useFetchList<ContentPushTask>({
  fetchApi: getContentPushList,
  defaultParams: queryParams,
  immediate: false
})

const stats = ref<any>({
  total: 0, todayCreated: 0, statusMap: {}, totalExposure: 0, totalClick: 0, clickRate: 0
})

const selectedRows = ref<ContentPushTask[]>([])
const selectedIds = computed(() => selectedRows.value.map(r => r.id))
const batchRunning = ref(false)
const batchProgress = reactive({
  visible: false,
  operationName: '',
  total: 0,
  done: 0
})

const createDialogVisible = ref(false)
const matchFailVisible = ref(false)
const currentMatchFailResult = ref<PushCreateValidationResult | null>(null)
const chainDialogVisible = ref(false)
const currentChainTaskId = ref<number | null>(null)

const fetchStats = async () => {
  try {
    stats.value = await getContentPushStats()
  } catch (e) { console.error(e) }
}

const fetchAll = async () => {
  await Promise.all([fetchData(), fetchStats()])
}

const getMatchColor = (score: number) => {
  if (score >= 80) return '#67c23a'
  if (score >= 60) return '#409eff'
  if (score >= 40) return '#e6a23c'
  return '#f56c6c'
}

const getRowClassName = ({ row }: { row: ContentPushTask }) => {
  if (selectedIds.value.includes(row.id)) return 'row-selected-highlight'
  if (row.pushStatus === 5) return 'row-blocked'
  if (row.anomalyCount > 0) return 'row-anomaly'
  return ''
}

const handleSelectionChange = (rows: unknown[]) => {
  selectedRows.value = rows as ContentPushTask[]
  nextTick(() => {})
}

const handleBatchSelectAll = (val: boolean) => {
  if (!val) return
  selectedRows.value = [...dataList.value]
}

const handleClearSelection = () => {
  selectedRows.value = []
}

const handleCreate = () => { createDialogVisible.value = true }

const handleCopyTaskNo = (no: string) => handleCopy(no, '任务编号已复制')

const statusTransitions: Record<number, Set<number>> = {
  0: new Set([1, 4]),
  1: new Set([2, 3, 4]),
  2: new Set([1, 4]),
  3: new Set(),
  4: new Set(),
  5: new Set()
}

const transitionStatusLocally = async (id: number, newStatus: number, beforeDelay = 300) => {
  const row = dataList.value.find(r => r.id === id)
  if (!row) return
  const oldStatus = row.pushStatus
  if (!statusTransitions[oldStatus]?.has(newStatus)) return

  row.pushStatus = -1
  await nextTick()
  setTimeout(() => {
    row.pushStatus = newStatus
  }, beforeDelay)
}

const handleStart = async (row: ContentPushTask) => {
  try {
    transitionStatusLocally(row.id, 1)
    await startContentPush(row.id)
    ElMessage.success('已启动推送')
    fetchStats()
  } catch (e: any) {
    if (e?.message?.includes('403')) {
      ElMessage.warning('您没有启动推送的权限')
    } else {
      if (e?.message) {
        currentMatchFailResult.value = {
          valid: false,
          errors: [e.message],
          blockDetail: e.message
        }
        matchFailVisible.value = true
      }
      ElMessage.error(e?.message || '启动失败')
    }
    fetchData()
  }
}

const handlePause = async (row: ContentPushTask) => {
  try {
    transitionStatusLocally(row.id, 2)
    await pauseContentPush(row.id)
    ElMessage.success('已暂停推送，数据已冻结')
    fetchStats()
  } catch (e: any) {
    ElMessage.error(e?.message || '暂停失败')
    fetchData()
  }
}

const handleTerminate = async (row: ContentPushTask) => {
  try {
    await ElMessageBox.confirm('确认终止此推送任务？终止后不可恢复。', '终止确认', {
      type: 'warning', confirmButtonText: '确认终止', cancelButtonText: '取消'
    })
    transitionStatusLocally(row.id, 4)
    await terminateContentPush(row.id)
    ElMessage.success('已终止推送')
    fetchStats()
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error(e?.message || '终止失败')
    fetchData()
  }
}

const handleCommand = async (cmd: string, row: ContentPushTask) => {
  switch (cmd) {
    case 'refresh':
      try {
        const res = await refreshContentPushStats(row.id)
        if (!res.skipped) {
          ElMessage.success(`刷新完成：新增曝光${res.exposed || 0}、点击${res.clicks || 0}、互动${res.interacts || 0}`)
        }
        fetchData()
      } catch (e: any) { ElMessage.error(e?.message || '刷新失败') }
      break
    case 'strength-up':
      try {
        await adjustContentPushStrength(row.id, row.pushStrength + 1)
        ElMessage.success('推送力度已提升')
        fetchData()
      } catch (e: any) { ElMessage.error(e?.message || '调整失败') }
      break
    case 'strength-down':
      try {
        await adjustContentPushStrength(row.id, row.pushStrength - 1)
        ElMessage.success('推送力度已降低')
        fetchData()
      } catch (e: any) { ElMessage.error(e?.message || '调整失败') }
      break
    case 'chain':
      currentChainTaskId.value = row.id
      chainDialogVisible.value = true
      break
  }
}

const handleRowDblClick = (row: ContentPushTask) => {
  if (!permission.value.canViewTrace) return
  currentChainTaskId.value = row.id
  chainDialogVisible.value = true
}

const runBatchOperation = async (
  operation: 'start' | 'pause' | 'terminate' | 'strengthen' | 'downgrade' | 'enhance',
  opName: string,
  tip?: string
) => {
  if (selectedIds.value.length === 0) return
  try {
    if (tip) {
      await ElMessageBox.confirm(tip.replace('{N}', String(selectedIds.value.length)), `${opName}确认`, {
        type: 'warning', confirmButtonText: '确认', cancelButtonText: '取消'
      })
    }
    batchRunning.value = true
    batchProgress.visible = true
    batchProgress.operationName = opName
    batchProgress.total = selectedIds.value.length
    batchProgress.done = 0

    const result: PushBatchResult = await batchContentPushOperation({
      operation, ids: [...selectedIds.value]
    })

    let finished = 0
    const timer = setInterval(() => {
      finished = Math.min(result.total, finished + Math.max(1, Math.ceil(result.total / 20)))
      batchProgress.done = finished
      if (finished >= result.total) clearInterval(timer)
    }, 120)

    await new Promise(r => setTimeout(r, 1500))
    clearInterval(timer)
    batchProgress.done = result.total

    setTimeout(() => {
      batchProgress.visible = false
      batchRunning.value = false
      ElMessage.success(`${opName}完成：成功${result.success}，失败${result.fail}`)
      fetchAll()
    }, 500)
  } catch (e: any) {
    batchRunning.value = false
    batchProgress.visible = false
    if (e !== 'cancel') ElMessage.error(e?.message || '批量操作失败')
  }
}

const handleBatchStart = () => runBatchOperation('start', '批量启动', '确认启动选中的{N}个推送任务？')
const handleBatchPause = () => runBatchOperation('pause', '批量暂停', '确认暂停选中的{N}个推送任务？数据将冻结。')
const handleBatchTerminate = () => runBatchOperation('terminate', '批量终止', '确认终止选中的{N}个推送任务？此操作不可恢复！')
const handleBatchStrengthen = () => runBatchOperation('strengthen', '批量加强', '确认提升选中{N}个任务的推送力度？')
const handleBatchEnhance = () => runBatchOperation('enhance', '批量激进推送', '确认对选中的{N}个优质内容执行激进推送？')

onMounted(() => {
  computePermission()
  if (permission.value.canView) fetchAll()
})
</script>

<style lang="scss" scoped>
.page-container {
  .stats-row {
    margin-bottom: 16px;

    .stat-card {
      border-radius: 8px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover {
        transform: translateY(-2px);
      }

      .stat-label {
        font-size: 12px;
        color: $text-secondary;
        margin-bottom: 6px;
      }

      .stat-value {
        font-size: 26px;
        font-weight: 700;
        color: $text-primary;
        font-family: 'DIN', monospace;
        line-height: 1.2;

        .unit {
          font-size: 14px;
          font-weight: 500;
          margin-left: 2px;
          color: $text-secondary;
        }
      }

      .stat-sub {
        font-size: 11px;
        color: $text-secondary;
        margin-top: 6px;

        .sub-val {
          color: #409eff;
          font-weight: 600;
          font-family: 'DIN', monospace;
        }
      }

      &.pushing .stat-value { color: #409eff; }
      &.paused .stat-value { color: #e6a23c; }
      &.blocked .stat-value { color: #9c27b0; }
      &.exposure .stat-value { color: #67c23a; }
      &.ctr .stat-value { color: #f56c6c; }

      .progress-ring {
        --progress: 0%;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        position: absolute;
        top: 16px;
        right: 16px;
        background: conic-gradient(#409eff var(--progress), rgba(64, 158, 255, 0.1) 0);
        opacity: 0.3;
      }

      .ctr-bar {
        margin-top: 8px;
      }
    }
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .card-title {
    font-size: 15px;
    font-weight: 600;
    color: $text-primary;
  }

  .range-split {
    margin: 0 6px;
    color: $text-placeholder;
  }

  .batch-progress-bar {
    margin-bottom: 16px;
    padding: 14px 16px;
    background: linear-gradient(90deg, rgba(64,158,255,0.06), rgba(103,194,58,0.06));
    border-radius: 8px;
    border: 1px solid rgba(64,158,255,0.2);

    .progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      font-size: 13px;
      color: $text-primary;
      font-weight: 500;

      .progress-num {
        color: $text-secondary;
        font-family: 'DIN', monospace;

        .progress-pct {
          color: #409eff;
          font-weight: 600;
        }
      }
    }
  }

  .ripple-btn {
    position: relative;
    overflow: hidden;

    &::after {
      content: '';
      position: absolute;
      top: 50%; left: 50%;
      width: 0; height: 0;
      background: rgba(64, 158, 255, 0.3);
      border-radius: 50%;
      transform: translate(-50%, -50%);
      transition: width 0.5s, height 0.5s;
    }
    &:active::after {
      width: 300px; height: 300px;
    }
  }

  .table-wrapper {
    :deep(.el-table) {
      .task-info-cell {
        .task-top {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
          .task-no {
            font-family: 'Consolas', monospace;
            font-size: 12px;
            color: #409eff;
            cursor: pointer;
            text-decoration: underline dotted;
          }
          .status-tag {
            transition: all 0.3s ease;
          }
        }
        .note-title {
          font-weight: 500;
          color: $text-primary;
          font-size: 13px;
          line-height: 1.4;
          margin-bottom: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
        }
        .note-meta {
          font-size: 12px;
          color: $text-secondary;
          display: flex;
          gap: 8px;
          align-items: center;

          .meta-split {
            color: $border-color-dark;
          }
        }
      }

      .strength-cell {
        .strength-bar {
          width: 60px;
          height: 6px;
          background: #f0f2f5;
          border-radius: 3px;
          margin: 0 auto 4px;
          overflow: hidden;

          .strength-fill {
            height: 100%;
            border-radius: 3px;
            transition: width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);

            &.s-1 { background: #909399; }
            &.s-2 { background: #409eff; }
            &.s-3 { background: linear-gradient(90deg, #e6a23c, #f56c6c); }
          }
        }
        .strength-name {
          font-size: 12px;
          font-weight: 600;
        }
      }

      .match-score-cell {
        .score-row {
          margin-top: 4px;
          display: flex;
          align-items: center;
          justify-content: space-around;
          gap: 6px;

          .score-main {
            font-size: 18px;
            font-weight: 700;
            font-family: 'DIN', monospace;

            &.pass { color: #67c23a; }
            &.fail { color: #f56c6c; }
          }

          .score-sub {
            font-size: 10px;
            color: $text-secondary;
            font-family: 'Consolas', monospace;
            display: flex;
            flex-direction: column;
            line-height: 1.4;
          }
        }
      }

      .exposure-cell {
        padding: 4px 0;

        .exposure-row {
          display: flex;
          gap: 12px;
          margin-bottom: 6px;

          .exposure-item {
            flex: 1;
            text-align: center;
            padding: 4px;
            background: #fafbfc;
            border-radius: 4px;
            transition: all 0.3s ease;

            &.main {
              background: linear-gradient(135deg, rgba(64,158,255,0.12), rgba(103,194,58,0.08));
              border: 1px solid rgba(64,158,255,0.2);
            }

            &.data-pulse {
              animation: pulse-glow 2s ease-in-out infinite;
            }

            .exposure-label {
              font-size: 10px;
              color: $text-secondary;
              margin-bottom: 2px;
            }
            .exposure-val {
              font-weight: 600;
              color: $text-primary;
              font-size: 13px;

              &.big {
                font-size: 15px;
                color: #409eff;
              }
            }
          }
        }

        .exposure-progress {
          margin-bottom: 6px;
        }

        .interact-row {
          display: flex;
          gap: 10px;
          font-size: 11px;
          color: $text-secondary;
          align-items: center;

          .interact-item {
            display: flex;
            align-items: center;
            gap: 2px;

            .el-icon {
              font-size: 12px;
            }

            &.ctr {
              margin-left: auto;
              color: #409eff;
              font-weight: 600;
              font-family: 'DIN', monospace;
            }
          }
        }
      }

      .block-cell {
        display: flex;
        align-items: center;
        gap: 4px;

        .block-reason {
          font-size: 12px;
          color: #f56c6c;
        }
        .block-detail-link {
          color: #409eff;
        }
      }

      .time-cell {
        font-size: 12px;
        color: $text-secondary;
      }

      .normal-text {
        color: $text-placeholder;
      }
    }

    :deep(.row-selected-highlight) {
      background-color: rgba(64, 158, 255, 0.08) !important;
      td { background-color: transparent !important; }
    }
    :deep(.row-blocked) {
      background-color: rgba(245, 108, 108, 0.06) !important;
      td { background-color: transparent !important; }
    }
    :deep(.row-anomaly) {
      background-color: rgba(230, 162, 60, 0.05) !important;
      td { background-color: transparent !important; }
    }
  }

  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }

  .number-format {
    font-family: 'DIN', monospace;
  }
}

@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(64, 158, 255, 0);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(64, 158, 255, 0.25);
  }
}
</style>
