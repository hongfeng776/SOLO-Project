<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import QyDataTable from '@/components/QyDataTable/index.vue'
import QyTableToolbar from '@/components/QyTableToolbar/index.vue'
import QySkeleton from '@/components/QySkeleton/index.vue'
import { COMMENT_STATUS, VIOLATION_LEVEL, COMMENT_AUDIT_STATUS, CONTENT_CATEGORY, getEnumOptions, getEnumLabel, getEnumItem } from '@/constants/enums'
import { COMMENT_OPERATE_TYPE, COMMENT_USER_LEVEL, COMMENT_SORT_FIELD } from '@/constants/enums'
import { getCommentManageListApi, operateCommentApi, validateOperationApi, checkDuplicateOperationApi } from '@/api/comment-manage'
import type { CommentManageItem, CommentManageQueryParams } from '@/types'
import { formatDate } from '@/utils'
import { Search, RefreshLeft, Top, Star, Hide, Delete, Check, CircleCheck, Warning } from '@element-plus/icons-vue'

const loading = ref(false)
const listData = ref<CommentManageItem[]>([])
const total = ref(0)

const queryParams = reactive<CommentManageQueryParams>({
  page: 1,
  pageSize: 10,
  contentCategory: null,
  startDate: '',
  endDate: '',
  userLevel: null,
  violationStatus: null,
  auditStatus: null,
  commentStatus: null,
  isTop: null,
  isEssence: null,
  minReportCount: null,
  maxReportCount: null,
  minLikeCount: null,
  maxLikeCount: null,
})

const dateRange = ref<[string, string] | null>(null)

const activeFilterCount = computed(() => {
  let count = 0
  if (queryParams.contentCategory !== null) count++
  if (dateRange.value) count++
  if (queryParams.userLevel !== null) count++
  if (queryParams.violationStatus !== null) count++
  if (queryParams.auditStatus !== null) count++
  if (queryParams.commentStatus !== null) count++
  if (queryParams.isTop !== null) count++
  if (queryParams.isEssence !== null) count++
  if (queryParams.minReportCount !== null || queryParams.maxReportCount !== null) count++
  if (queryParams.minLikeCount !== null || queryParams.maxLikeCount !== null) count++
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
    const result = await getCommentManageListApi(params)
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
  queryParams.contentCategory = null
  queryParams.userLevel = null
  queryParams.violationStatus = null
  queryParams.auditStatus = null
  queryParams.commentStatus = null
  queryParams.isTop = null
  queryParams.isEssence = null
  queryParams.minReportCount = null
  queryParams.maxReportCount = null
  queryParams.minLikeCount = null
  queryParams.maxLikeCount = null
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

const selectedRows = ref<CommentManageItem[]>([])
const handleSelectionChange = (rows: CommentManageItem[]) => {
  selectedRows.value = rows
}

const contentCategoryOptions = computed(() => getEnumOptions(CONTENT_CATEGORY))
const userLevelOptions = computed(() => getEnumOptions(COMMENT_USER_LEVEL))
const violationLevelOptions = computed(() => getEnumOptions(VIOLATION_LEVEL))
const auditStatusOptions = computed(() => getEnumOptions(COMMENT_AUDIT_STATUS))
const commentStatusOptions = computed(() => getEnumOptions(COMMENT_STATUS))
const yesNoOptions = [
  { value: 1, label: '是' },
  { value: 0, label: '否' },
]

const operating = ref<number | null>(null)
const operateDialogVisible = ref(false)
const currentOperateRow = ref<CommentManageItem | null>(null)
const currentOperateType = ref<string>('')
const operateRemark = ref('')
const validateResult = ref<{ valid: boolean; reasons: string[] } | null>(null)
const duplicateResult = ref<{ isDuplicate: boolean; lastOperation?: any } | null>(null)

const operateTypeLabel = computed(() => {
  const item = getEnumItem(COMMENT_OPERATE_TYPE, currentOperateType.value)
  return item?.label || ''
})

const operateTypeIcon = computed(() => {
  const item = getEnumItem(COMMENT_OPERATE_TYPE, currentOperateType.value)
  return item?.type || 'primary'
})

const openOperateDialog = async (row: CommentManageItem, type: string) => {
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
    await operateCommentApi(currentOperateRow.value.id, {
      operationType: currentOperateType.value as any,
      remark: operateRemark.value || undefined,
    })
    ElMessage.success(`${operateTypeLabel.value}操作成功`)
    const row = listData.value.find((r) => r.id === currentOperateRow.value!.id)
    if (row) {
      const type = currentOperateType.value
      if (type === 'PIN') {
        Object.assign(row, { isTop: 1, topTime: new Date().toISOString() })
      } else if (type === 'CANCEL_PIN') {
        Object.assign(row, { isTop: 0, topTime: undefined })
      } else if (type === 'ESSENCE') {
        Object.assign(row, { isEssence: 1, essenceTime: new Date().toISOString() })
      } else if (type === 'CANCEL_ESSENCE') {
        Object.assign(row, { isEssence: 0, essenceTime: undefined })
      } else if (type === 'BLOCK') {
        Object.assign(row, { commentStatus: 2 })
      } else if (type === 'DELETE') {
        const idx = listData.value.findIndex((r) => r.id === currentOperateRow.value!.id)
        if (idx !== -1) {
          listData.value.splice(idx, 1)
          total.value--
        }
      }
    }
    operateDialogVisible.value = false
  } finally {
    operating.value = null
  }
}

const tableColumns = [
  { prop: 'commentContent', label: '评论正文', minWidth: 220, showOverflowTooltip: true, slot: 'commentContent' },
  { prop: 'contentId', label: '关联内容', minWidth: 160, showOverflowTooltip: true, slot: 'contentInfo' },
  { prop: 'userId', label: '评论人', width: 120, align: 'center', slot: 'userInfo' },
  { prop: 'createdAt', label: '发布时间', width: 170, align: 'center', slot: 'createdAt' },
  { prop: 'likeCount', label: '点赞数', width: 90, align: 'center' },
  { prop: 'reportCount', label: '举报数', width: 90, align: 'center' },
  { prop: 'auditStatus', label: '审核状态', width: 110, align: 'center', slot: 'auditStatus' },
  { prop: 'commentStatus', label: '评论状态', width: 110, align: 'center', slot: 'commentStatus' },
  { prop: 'violationLevel', label: '违规等级', width: 100, align: 'center', slot: 'violationLevel' },
  { prop: 'isTop', label: '是否置顶', width: 100, align: 'center', slot: 'isTop' },
  { prop: 'isEssence', label: '是否精华', width: 100, align: 'center', slot: 'isEssence' },
  { label: '操作', width: 240, fixed: 'right', align: 'center', slot: 'actions' },
]

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="comment-manage-page">
    <div class="filter-bar">
      <el-form :inline="true" :model="queryParams" @submit.prevent>
        <el-form-item label="内容品类">
          <div class="filter-input-wrap">
            <el-select
              v-model="queryParams.contentCategory"
              placeholder="全部品类"
              clearable
              style="width: 140px"
            >
              <el-option
                v-for="item in contentCategoryOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
            <el-icon v-if="queryParams.contentCategory !== null" color="#67C23A" class="filter-check"><CircleCheck /></el-icon>
          </div>
        </el-form-item>
        <el-form-item label="评论时段">
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
        <el-form-item label="用户层级">
          <div class="filter-input-wrap">
            <el-select
              v-model="queryParams.userLevel"
              placeholder="全部层级"
              clearable
              style="width: 140px"
            >
              <el-option
                v-for="item in userLevelOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
            <el-icon v-if="queryParams.userLevel !== null" color="#67C23A" class="filter-check"><CircleCheck /></el-icon>
          </div>
        </el-form-item>
        <el-form-item label="违规状态">
          <div class="filter-input-wrap">
            <el-select
              v-model="queryParams.violationStatus"
              placeholder="全部等级"
              clearable
              style="width: 140px"
            >
              <el-option
                v-for="item in violationLevelOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
            <el-icon v-if="queryParams.violationStatus !== null" color="#67C23A" class="filter-check"><CircleCheck /></el-icon>
          </div>
        </el-form-item>
        <el-form-item label="审核状态">
          <div class="filter-input-wrap">
            <el-select
              v-model="queryParams.auditStatus"
              placeholder="全部状态"
              clearable
              style="width: 140px"
            >
              <el-option
                v-for="item in auditStatusOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
            <el-icon v-if="queryParams.auditStatus !== null" color="#67C23A" class="filter-check"><CircleCheck /></el-icon>
          </div>
        </el-form-item>
        <el-form-item label="评论状态">
          <div class="filter-input-wrap">
            <el-select
              v-model="queryParams.commentStatus"
              placeholder="全部状态"
              clearable
              style="width: 140px"
            >
              <el-option
                v-for="item in commentStatusOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
            <el-icon v-if="queryParams.commentStatus !== null" color="#67C23A" class="filter-check"><CircleCheck /></el-icon>
          </div>
        </el-form-item>
        <el-form-item label="举报数范围">
          <div class="filter-input-wrap">
            <div class="range-input">
              <el-input-number
                v-model="queryParams.minReportCount"
                :min="0"
                controls-position="right"
                placeholder="最小"
                style="width: 100px"
              />
              <span class="range-separator">-</span>
              <el-input-number
                v-model="queryParams.maxReportCount"
                :min="0"
                controls-position="right"
                placeholder="最大"
                style="width: 100px"
              />
            </div>
            <el-icon v-if="queryParams.minReportCount !== null || queryParams.maxReportCount !== null" color="#67C23A" class="filter-check"><CircleCheck /></el-icon>
          </div>
        </el-form-item>
        <el-form-item label="点赞数范围">
          <div class="filter-input-wrap">
            <div class="range-input">
              <el-input-number
                v-model="queryParams.minLikeCount"
                :min="0"
                controls-position="right"
                placeholder="最小"
                style="width: 100px"
              />
              <span class="range-separator">-</span>
              <el-input-number
                v-model="queryParams.maxLikeCount"
                :min="0"
                controls-position="right"
                placeholder="最大"
                style="width: 100px"
              />
            </div>
            <el-icon v-if="queryParams.minLikeCount !== null || queryParams.maxLikeCount !== null" color="#67C23A" class="filter-check"><CircleCheck /></el-icon>
          </div>
        </el-form-item>
        <el-form-item label="是否置顶">
          <div class="filter-input-wrap">
            <el-select
              v-model="queryParams.isTop"
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
            <el-icon v-if="queryParams.isTop !== null" color="#67C23A" class="filter-check"><CircleCheck /></el-icon>
          </div>
        </el-form-item>
        <el-form-item label="是否精华">
          <div class="filter-input-wrap">
            <el-select
              v-model="queryParams.isEssence"
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
            <el-icon v-if="queryParams.isEssence !== null" color="#67C23A" class="filter-check"><CircleCheck /></el-icon>
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
      />

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
          <template #commentContent="{ row }">
            <div class="comment-content-cell">
              <span class="comment-text">{{ row.commentContent }}</span>
              <div class="comment-badges" v-if="row.isTop === 1 || row.isEssence === 1">
                <el-tag v-if="row.isTop === 1" type="danger" size="small" effect="dark" class="badge-tag">置顶</el-tag>
                <el-tag v-if="row.isEssence === 1" type="warning" size="small" effect="dark" class="badge-tag">精华</el-tag>
              </div>
            </div>
          </template>

          <template #contentInfo="{ row }">
            <span v-if="row.contentInfo">{{ row.contentInfo.title }}</span>
            <span v-else style="color: #909399">-</span>
          </template>

          <template #userInfo="{ row }">
            <span v-if="row.userInfo">{{ row.userInfo.nickname || row.userInfo.username }}</span>
            <span v-else style="color: #909399">-</span>
          </template>

          <template #createdAt="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>

          <template #auditStatus="{ row }">
            <el-tag
              :type="getEnumItem(COMMENT_AUDIT_STATUS, row.auditStatus)?.type || 'info'"
              size="small"
            >
              {{ getEnumLabel(COMMENT_AUDIT_STATUS, row.auditStatus) }}
            </el-tag>
          </template>

          <template #commentStatus="{ row }">
            <el-tag
              :type="getEnumItem(COMMENT_STATUS, row.commentStatus)?.type || 'info'"
              size="small"
            >
              {{ getEnumLabel(COMMENT_STATUS, row.commentStatus) }}
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

          <template #isTop="{ row }">
            <el-tag v-if="row.isTop === 1" type="danger" size="small" effect="dark">置顶</el-tag>
            <span v-else style="color: #909399">-</span>
          </template>

          <template #isEssence="{ row }">
            <el-tag v-if="row.isEssence === 1" type="warning" size="small" effect="dark">精华</el-tag>
            <span v-else style="color: #909399">-</span>
          </template>

          <template #actions="{ row }">
            <el-button
              v-if="row.isTop !== 1"
              type="primary"
              link
              :icon="Top"
              :loading="operating === row.id"
              @click="openOperateDialog(row, 'PIN')"
            >置顶</el-button>
            <el-button
              v-else
              type="info"
              link
              :icon="Top"
              :loading="operating === row.id"
              @click="openOperateDialog(row, 'CANCEL_PIN')"
            >取消置顶</el-button>
            <el-button
              v-if="row.isEssence !== 1"
              type="warning"
              link
              :icon="Star"
              :loading="operating === row.id"
              @click="openOperateDialog(row, 'ESSENCE')"
            >精华</el-button>
            <el-button
              v-else
              type="info"
              link
              :icon="Star"
              :loading="operating === row.id"
              @click="openOperateDialog(row, 'CANCEL_ESSENCE')"
            >取消精华</el-button>
            <el-button
              type="danger"
              link
              :icon="Hide"
              :loading="operating === row.id"
              @click="openOperateDialog(row, 'BLOCK')"
            >屏蔽</el-button>
            <el-button
              type="danger"
              link
              :icon="Delete"
              :loading="operating === row.id"
              @click="openOperateDialog(row, 'DELETE')"
            >删除</el-button>
          </template>
        </QyDataTable>
      </QySkeleton>
    </div>

    <el-dialog
      v-model="operateDialogVisible"
      :title="operateTypeLabel + '操作'"
      width="500px"
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
            <span class="operate-label">评论预览：</span>
            <div class="preview-content">{{ currentOperateRow.commentContent }}</div>
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
          @click="handleOperateSubmit"
        >确认{{ operateTypeLabel }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.comment-manage-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
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

.comment-content-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.comment-text {
  color: var(--el-color-primary);
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
}

.comment-badges {
  display: flex;
  gap: 4px;
}

.badge-tag {
  flex-shrink: 0;
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
