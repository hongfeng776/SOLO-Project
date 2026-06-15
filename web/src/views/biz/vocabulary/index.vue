<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useTable } from '@/composables/useTable'
import { useModal } from '@/composables/useModal'
import { useConfirm } from '@/components/ConfirmDialog'
import type { VocabularyVO } from '@/types/api'
import type { FormInstance, FormRules } from 'element-plus'
import {
  getVocabularyList,
  createVocabulary,
  updateVocabulary,
  removeVocabulary,
  type VocabularyQuery
} from '@/api/vocabulary'

const { confirm } = useConfirm()

const initialQuery: Partial<VocabularyQuery> = {
  word: '',
  difficulty: undefined,
  bookName: '',
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
  handleSearch,
  handleReset,
  handleRefresh,
  handlePageChange
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
        ElMessage.success('新增成功')
      }
      modal.close()
      handleRefresh()
    } finally {
      submitLoading.value = false
    }
  })
}

async function handleDelete(row: VocabularyVO) {
  const ok = await confirm({
    title: '删除确认',
    message: `确定要删除词汇「${row.word}」吗？此操作不可恢复。`,
    type: 'warning',
    confirmButtonText: '确认删除'
  })
  if (!ok) return
  await removeVocabulary([row.id])
  ElMessage.success('删除成功')
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
        <h3 class="table-title">词汇资源台账</h3>
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>新增词汇
        </el-button>
      </div>

      <TableSkeleton v-if="loading" :row-count="8" :col-count="8" />
      <template v-else>
        <EmptyState v-if="list.length === 0" />
        <el-table
          v-else
          :data="list"
          stripe
          class="vocabulary-table"
          @row-dblclick="handleRowDblclick"
        >
          <el-table-column prop="id" label="ID" width="70" align="center" />
          <el-table-column prop="word" label="单词" width="160">
            <template #default="{ row }">
              <span class="word-text">{{ row.word }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="phonetic" label="音标" width="160">
            <template #default="{ row }">
              <span class="phonetic-text">{{ row.phonetic || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="definition" label="释义" min-width="220" show-overflow-tooltip />
          <el-table-column prop="example" label="例句" min-width="240" show-overflow-tooltip>
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
          <el-table-column prop="createTime" label="创建时间" width="180" align="center">
            <template #default="{ row }">
              <span class="create-time">{{ formatDate(row.createTime) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right" align="center">
            <template #default="{ row }">
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
      width: 160px;

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

    .table-title {
      font-size: 16px;
      font-weight: 600;
      color: #303133;
      margin: 0;
    }
  }

  .vocabulary-table {
    :deep(.el-table__row) {
      cursor: pointer;
      transition: background-color 0.2s ease;

      &:hover {
        background-color: #ecf5ff !important;
      }

      &.el-table__row--striped {
        background-color: #fafafa;
      }
    }

    :deep(.el-table__header th) {
      background-color: #f5f7fa;
      font-weight: 600;
      color: #303133;
    }
  }

  .word-text {
    font-weight: 600;
    color: #303133;
    font-size: 14px;
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
