<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useTable } from '@/composables/useTable'
import { useModal } from '@/composables/useModal'
import { useConfirm } from '@/components/ConfirmDialog'
import type { VocabularyVO } from '@/types/api'
import type { FormInstance, FormRules } from 'element-plus'
import {
  getVocabularyList,
  getVocabularyDetail,
  createVocabulary,
  updateVocabulary,
  removeVocabulary,
  updateVocabularyStatus,
  batchUpdateVocabularyStatus,
  type VocabularyQuery
} from '@/api/vocabulary'

const router = useRouter()
const { confirm, confirmDelete } = useConfirm()

const initialQuery: Partial<VocabularyQuery> = {
  word: '',
  difficulty: undefined,
  bookName: '',
  status: undefined,
  startTime: '',
  endTime: ''
}

const {
  list,
  loading,
  pageNum,
  pageSize,
  total,
  queryForm,
  selectedIds,
  handleSearch,
  handleReset,
  handleRefresh,
  handlePageChange,
  handleSelectionChange
} = useTable<VocabularyVO, VocabularyQuery>(getVocabularyList, initialQuery)

const modal = useModal<{
  id?: number
  word: string
  phonetic: string
  definition: string
  example: string
  difficulty: number
  bookName: string
}>({
  word: '',
  phonetic: '',
  definition: '',
  example: '',
  difficulty: 2,
  bookName: ''
})

const isEdit = ref(false)
const formRef = ref<FormInstance>()

const formRules: FormRules = {
  word: [
    { required: true, message: '请输入单词', trigger: 'blur' },
    { pattern: /^[a-zA-Z\s'-]+$/, message: '单词只能包含英文字母、空格、连字符和撇号', trigger: 'blur' }
  ],
  definition: [{ required: true, message: '请输入释义', trigger: 'blur' }],
  difficulty: [{ required: true, message: '请选择难度', trigger: 'change' }]
}

const submitLoading = ref(false)

const statusOptions = [
  { label: '已上架', value: 1, type: 'success' },
  { label: '待审核', value: 2, type: 'warning' },
  { label: '已下架', value: 0, type: 'info' }
]

const difficultyOptions = [
  { label: '★ 入门', value: 1 },
  { label: '★★ 简单', value: 2 },
  { label: '★★★ 中等', value: 3 },
  { label: '★★★★ 困难', value: 4 },
  { label: '★★★★★ 专家', value: 5 }
]

const bookOptions = [
  { label: '四级核心词汇', value: '四级核心词汇' },
  { label: '六级进阶词汇', value: '六级进阶词汇' },
  { label: '托福基础词汇', value: '托福基础词汇' },
  { label: '托福高阶词汇', value: '托福高阶词汇' },
  { label: '雅思核心词汇', value: '雅思核心词汇' },
  { label: 'GRE核心词汇', value: 'GRE核心词汇' }
]

const selectedCountText = computed(() => {
  if (selectedIds.value.length === 0) return ''
  return `已选择 ${selectedIds.value.length} 项`
})

function getStatusInfo(status: number) {
  const item = statusOptions.find((o) => o.value === status)
  return item || { label: '未知', type: 'info' }
}

function getDifficultyText(level: number) {
  const item = difficultyOptions.find((o) => o.value === level)
  return item ? item.label : '未知'
}

function getDifficultyTagType(level: number): 'primary' | 'success' | 'warning' | 'info' | 'danger' | undefined {
  const types: Record<number, 'primary' | 'success' | 'warning' | 'info' | 'danger' | undefined> = {
    1: 'success',
    2: undefined,
    3: 'warning',
    4: 'danger',
    5: 'info'
  }
  return types[level] || 'info'
}

function getRowClassName(row: VocabularyVO) {
  if (row.status === 0) return 'row-offline'
  if (row.status === 2) return 'row-pending'
  return ''
}

function handleAdd() {
  isEdit.value = false
  modal.open()
}

function handleEdit(row: VocabularyVO) {
  isEdit.value = true
  modal.open({
    id: row.id,
    word: row.word,
    phonetic: row.phonetic || '',
    definition: row.definition,
    example: row.example || '',
    difficulty: row.difficulty || 2,
    bookName: row.bookName || ''
  })
}

function handleRowDblclick(row: VocabularyVO) {
  handleEdit(row)
}

function handleViewDetail(row: VocabularyVO) {
  router.push({
    path: '/biz/vocabulary/detail',
    query: { id: row.id }
  })
}

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    try {
      submitLoading.value = true
      if (isEdit.value) {
        await updateVocabulary(modal.formData)
        ElMessage.success('修改成功')
      } else {
        await createVocabulary(modal.formData)
        ElMessage.success('新增成功，已进入待审核状态')
      }
      modal.close()
      handleRefresh()
    } finally {
      submitLoading.value = false
    }
  })
}

async function handleDelete(row: VocabularyVO) {
  const ok = await confirmDelete(`确定要删除词汇「${row.word}」吗？此操作不可恢复。`)
  if (!ok) return
  await removeVocabulary([row.id])
  ElMessage.success('删除成功')
  handleRefresh()
}

async function handleBatchDelete() {
  if (selectedIds.value.length === 0) return
  const ok = await confirmDelete(`确定要删除选中的 ${selectedIds.value.length} 条词汇吗？此操作不可恢复。`)
  if (!ok) return
  await removeVocabulary(selectedIds.value)
  ElMessage.success('批量删除成功')
  handleRefresh()
}

async function handleStatusChange(row: VocabularyVO, status: number) {
  if (row.status === status) return
  const statusInfo = getStatusInfo(status)
  const ok = await confirm(`确定要将词汇「${row.word}」${statusInfo.label}吗？`, '状态确认')
  if (!ok) return
  await updateVocabularyStatus(row.id, status)
  ElMessage.success(`${statusInfo.label}成功`)
  handleRefresh()
}

async function handleBatchOnline() {
  if (selectedIds.value.length === 0) return
  const ok = await confirm(`确定要将选中的 ${selectedIds.value.length} 条词汇上架吗？`, '批量上架确认')
  if (!ok) return
  await batchUpdateVocabularyStatus(selectedIds.value, 1)
  ElMessage.success('批量上架成功')
  handleRefresh()
}

async function handleBatchOffline() {
  if (selectedIds.value.length === 0) return
  const ok = await confirm(`确定要将选中的 ${selectedIds.value.length} 条词汇下架吗？`, '批量下架确认')
  if (!ok) return
  await batchUpdateVocabularyStatus(selectedIds.value, 0)
  ElMessage.success('批量下架成功')
  handleRefresh()
}

async function handleBatchPending() {
  if (selectedIds.value.length === 0) return
  const ok = await confirm(`确定要将选中的 ${selectedIds.value.length} 条词汇置为待审核吗？`, '批量操作确认')
  if (!ok) return
  await batchUpdateVocabularyStatus(selectedIds.value, 2)
  ElMessage.success('操作成功')
  handleRefresh()
}

function formatDate(dateStr: string) {
  if (!dateStr) return '-'
  return dateStr.replace('T', ' ').substring(0, 19)
}
</script>

<template>
  <div class="page-container vocabulary-page">
    <el-card shadow="never" class="search-card">
      <el-form
        :model="queryForm"
        label-width="80px"
        inline
        class="search-form"
        @submit.prevent="handleSearch"
      >
        <el-form-item label="单词">
          <el-input
            v-model="queryForm.word"
            placeholder="请输入单词关键词"
            clearable
            class="search-input"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="queryForm.status"
            placeholder="请选择状态"
            clearable
            class="search-select"
          >
            <el-option
              v-for="opt in statusOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="难度">
          <el-select
            v-model="queryForm.difficulty"
            placeholder="请选择难度"
            clearable
            class="search-select"
          >
            <el-option
              v-for="opt in difficultyOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="所属词书">
          <el-select
            v-model="queryForm.bookName"
            placeholder="请选择词书"
            clearable
            filterable
            class="search-select book-select"
          >
            <el-option
              v-for="opt in bookOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="创建时间">
          <el-date-picker
            v-model="queryForm.startTime"
            type="date"
            placeholder="开始日期"
            value-format="YYYY-MM-DD"
            class="search-date"
          />
          <span class="date-separator">至</span>
          <el-date-picker
            v-model="queryForm.endTime"
            type="date"
            placeholder="结束日期"
            value-format="YYYY-MM-DD"
            class="search-date"
          />
        </el-form-item>
        <el-form-item class="search-actions">
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>筛选
          </el-button>
          <el-button @click="handleReset">
            <el-icon><RefreshLeft /></el-icon>重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="table-card">
      <div class="table-toolbar">
        <div class="toolbar-left">
          <h3 class="table-title">词汇资源台账</h3>
          <span v-if="selectedCountText" class="selected-count">{{ selectedCountText }}</span>
        </div>
        <div class="toolbar-right">
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>新增词汇
          </el-button>
        </div>
      </div>

      <BatchToolbar
        v-if="selectedIds.length > 0"
        :selected-count="selectedIds.length"
        :total-count="total"
      >
        <el-button type="success" @click="handleBatchOnline">
          <el-icon><Top /></el-icon>批量上架
        </el-button>
        <el-button type="warning" @click="handleBatchPending">
          <el-icon><Clock /></el-icon>批量待审核
        </el-button>
        <el-button type="info" @click="handleBatchOffline">
          <el-icon><Bottom /></el-icon>批量下架
        </el-button>
        <el-button type="danger" @click="handleBatchDelete">
          <el-icon><Delete /></el-icon>批量删除
        </el-button>
      </BatchToolbar>

      <TableSkeleton v-if="loading" :row-count="8" :col-count="10" />
      <template v-else>
        <EmptyState v-if="list.length === 0" />
        <el-table
          v-else
          :data="list"
          stripe
          :row-class-name="({ row }) => getRowClassName(row as VocabularyVO)"
          class="vocabulary-table"
          @selection-change="handleSelectionChange"
          @row-dblclick="handleRowDblclick"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="id" label="ID" width="70" align="center" />
          <el-table-column label="单词" width="160">
            <template #default="{ row }">
              <span class="word-text" @click.stop="handleViewDetail(row as VocabularyVO)">{{ row.word }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="phonetic" label="音标" width="160">
            <template #default="{ row }">
              <span class="phonetic-text">{{ row.phonetic || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="definition" label="释义" min-width="220" show-overflow-tooltip />
          <el-table-column prop="example" label="例句" min-width="200" show-overflow-tooltip>
            <template #default="{ row }">
              <span class="example-text">{{ row.example || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="难度" width="120" align="center">
            <template #default="{ row }">
              <el-tag :type="getDifficultyTagType(row.difficulty)" size="small" effect="light">
                {{ getDifficultyText(row.difficulty) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="bookName" label="所属词书" width="140" show-overflow-tooltip>
            <template #default="{ row }">
              <span class="book-name">{{ row.bookName || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="110" align="center">
            <template #default="{ row }">
              <el-tag
                :type="getStatusInfo(row.status).type as any"
                size="small"
                effect="light"
                class="status-tag"
              >
                {{ getStatusInfo(row.status).label }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" width="180" align="center">
            <template #default="{ row }">
              <span class="create-time">{{ formatDate(row.createTime) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="240" fixed="right" align="center">
            <template #default="{ row }">
              <el-button type="primary" link @click="handleViewDetail(row as VocabularyVO)">详情</el-button>
              <el-dropdown
                trigger="click"
                @command="(cmd: number) => handleStatusChange(row as VocabularyVO, cmd)"
              >
                <el-button type="primary" link>
                  状态
                  <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item
                      v-for="opt in statusOptions"
                      :key="opt.value"
                      :command="opt.value"
                      :disabled="(row as VocabularyVO).status === opt.value"
                    >
                      <span :class="`text-${opt.type}`">{{ opt.label }}</span>
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <el-button type="primary" link @click="handleEdit(row as VocabularyVO)">编辑</el-button>
              <el-button type="danger" link @click="handleDelete(row as VocabularyVO)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <Pagination
          v-model:page-num="pageNum"
          v-model:page-size="pageSize"
          :total="total"
          @change="handlePageChange"
        />
      </template>
    </el-card>

    <ModalDialog
      v-model="modal.visible"
      :title="isEdit ? '编辑词汇' : '新增词汇'"
      :loading="submitLoading"
      width="560px"
      custom-class="vocabulary-modal"
      @confirm="handleSubmit"
    >
      <el-form
        ref="formRef"
        :model="modal.formData"
        :rules="formRules"
        label-width="80px"
        :disabled="submitLoading"
        class="vocabulary-form"
      >
        <el-form-item label="单词" prop="word">
          <el-input v-model="modal.formData.word" placeholder="请输入英文单词" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="音标">
          <el-input v-model="modal.formData.phonetic" placeholder="请输入音标，如 /ˈæpl/" />
        </el-form-item>
        <el-form-item label="释义" prop="definition">
          <el-input
            v-model="modal.formData.definition"
            type="textarea"
            :rows="3"
            placeholder="请输入英文释义"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="例句">
          <el-input
            v-model="modal.formData.example"
            type="textarea"
            :rows="2"
            placeholder="请输入例句"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="难度" prop="difficulty">
          <el-select v-model="modal.formData.difficulty" placeholder="请选择难度" style="width: 100%">
            <el-option
              v-for="opt in difficultyOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="所属词书">
          <el-select
            v-model="modal.formData.bookName"
            placeholder="请选择或输入词书名称"
            filterable
            allow-create
            default-first-option
            style="width: 100%"
          >
            <el-option
              v-for="opt in bookOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
      </el-form>
    </ModalDialog>
  </div>
</template>

<style lang="scss" scoped>
.vocabulary-page {
  padding: 16px;

  .search-card {
    :deep(.el-card__body) {
      padding: 20px 20px 4px;
    }
  }

  .search-form {
    display: flex;
    flex-wrap: wrap;
    gap: 0 16px;

    :deep(.el-form-item) {
      margin-bottom: 16px;
    }

    .search-input {
      width: 200px;
    }

    .search-select {
      width: 140px;

      &.book-select {
        width: 180px;
      }
    }

    .search-date {
      width: 140px;
    }

    .date-separator {
      margin: 0 8px;
      color: #909399;
    }

    .search-actions {
      margin-left: auto;
    }
  }

  .table-card {
    margin-top: 16px;

    :deep(.el-card__body) {
      padding: 20px;
    }
  }

  .table-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .toolbar-left {
      display: flex;
      align-items: center;
      gap: 12px;

      .table-title {
        font-size: 16px;
        font-weight: 600;
        color: #303133;
        margin: 0;
      }

      .selected-count {
        font-size: 13px;
        color: #409eff;
        background: #ecf5ff;
        padding: 2px 10px;
        border-radius: 12px;
      }
    }
  }

  .vocabulary-table {
    :deep(.el-table__row) {
      cursor: pointer;
      transition: all 0.25s ease;

      &.row-offline {
        :deep(.el-table__cell) {
          color: #c0c4cc !important;
        }

        &:hover {
          :deep(.el-table__cell) {
            background-color: #f5f7fa !important;
            box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.03);
          }
        }
      }

      &.row-pending {
        :deep(.el-table__cell) {
          background-color: #fdf6ec;
        }

        &:hover {
          :deep(.el-table__cell) {
            background-color: #faecd8 !important;
          }
        }
      }

      &:not(.row-offline):not(.row-pending):hover {
        :deep(.el-table__cell) {
          background-color: #ecf5ff !important;
        }
      }

      &.el-table__row--striped {
        &.row-offline :deep(.el-table__cell) {
          background-color: #fafafa;
        }
        &.row-pending :deep(.el-table__cell) {
          background-color: #fdf6ec;
        }
      }
    }

    :deep(.el-table__header th) {
      background-color: #f5f7fa;
      font-weight: 600;
      color: #303133;
    }

    .status-tag {
      min-width: 70px;
    }
  }

  .word-text {
    font-weight: 600;
    color: #409eff;
    cursor: pointer;
    transition: color 0.2s;

    &:hover {
      color: #66b1ff;
      text-decoration: underline;
    }
  }

  .phonetic-text {
    color: #606266;
    font-family: 'Lucida Sans Unicode', 'Arial Unicode MS', sans-serif;
  }

  .example-text {
    color: #606266;
    font-style: italic;
  }

  .book-name {
    color: #409eff;
  }

  .create-time {
    color: #909399;
    font-size: 13px;
  }

  .text-success {
    color: #67c23a;
  }

  .text-warning {
    color: #e6a23c;
  }

  .text-info {
    color: #909399;
  }

  .text-danger {
    color: #f56c6c;
  }
}

.vocabulary-modal {
  :deep(.el-dialog__body) {
    padding: 20px 24px;
  }
}

.vocabulary-form {
  :deep(.el-textarea__inner) {
    resize: vertical;
  }
}
</style>
