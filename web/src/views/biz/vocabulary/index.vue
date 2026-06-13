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
  updateVocabularyStatus,
  batchUpdateVocabularyStatus,
  type VocabularyQuery
} from '@/api/vocabulary'

const { confirm, confirmDelete } = useConfirm()

const initialQuery: Partial<VocabularyQuery> = {
  word: '',
  partOfSpeech: undefined,
  status: undefined,
  creatorId: undefined,
  keyword: ''
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
  partOfSpeech: string
  definition: string
  example: string
  translation: string
  status: number
}>({
  word: '',
  phonetic: '',
  partOfSpeech: '',
  definition: '',
  example: '',
  translation: '',
  status: 1
})

const isEdit = ref(false)
const formRef = ref<FormInstance>()

const formRules: FormRules = {
  word: [{ required: true, message: '请输入单词', trigger: 'blur' }],
  partOfSpeech: [{ required: true, message: '请选择词性', trigger: 'change' }],
  definition: [{ required: true, message: '请输入释义', trigger: 'blur' }]
}

const submitLoading = ref(false)

const partOfSpeechOptions = [
  { label: '名词 (n.)', value: 'noun' },
  { label: '动词 (v.)', value: 'verb' },
  { label: '形容词 (adj.)', value: 'adjective' },
  { label: '副词 (adv.)', value: 'adverb' },
  { label: '介词 (prep.)', value: 'preposition' },
  { label: '连词 (conj.)', value: 'conjunction' },
  { label: '代词 (pron.)', value: 'pronoun' },
  { label: '数词 (num.)', value: 'numeral' },
  { label: '冠词 (art.)', value: 'article' },
  { label: '感叹词 (int.)', value: 'interjection' }
]

function handleAdd() {
  isEdit.value = false
  modal.open()
}

async function handleEdit(row: VocabularyVO) {
  isEdit.value = true
  modal.open({
    id: row.id,
    word: row.word,
    phonetic: row.phonetic,
    partOfSpeech: row.partOfSpeech,
    definition: row.definition,
    example: row.example,
    translation: row.translation,
    status: row.status
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
    message: `删除词汇「${row.word}」后将同步校验关联数据，确认继续？`,
    type: 'warning',
    confirmButtonText: '确认删除'
  })
  if (!ok) return
  await removeVocabulary([row.id])
  ElMessage.success('删除成功')
  handleRefresh()
}

async function handleBatchDelete() {
  if (selectedIds.value.length === 0) return
  const ok = await confirm({
    title: '删除确认',
    message: `删除选中的 ${selectedIds.value.length} 条词汇后将同步校验关联数据，确认继续？`,
    type: 'warning',
    confirmButtonText: '确认删除'
  })
  if (!ok) return
  await removeVocabulary(selectedIds.value)
  ElMessage.success('批量删除成功')
  handleRefresh()
}

async function handleStatusChange(row: VocabularyVO, status: number) {
  const action = status === 1 ? '上架' : '下架'
  const ok = await confirm(`确定要${action}词汇「${row.word}」吗？`, '状态确认')
  if (!ok) return
  await updateVocabularyStatus(row.id, status)
  ElMessage.success(`${action}成功`)
  handleRefresh()
}

async function handleBatchStatus(status: number) {
  if (selectedIds.value.length === 0) return
  const action = status === 1 ? '上架' : '下架'
  const ok = await confirm(`确定要${action}选中的 ${selectedIds.value.length} 条词汇吗？`, '批量操作确认')
  if (!ok) return
  await batchUpdateVocabularyStatus(selectedIds.value, status)
  ElMessage.success(`批量${action}成功`)
  handleRefresh()
}
</script>

<template>
  <div class="page-container">
    <el-card shadow="never">
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
            placeholder="请输入单词"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="词性">
          <el-select
            v-model="queryForm.partOfSpeech"
            placeholder="请选择词性"
            clearable
            style="width: 180px"
          >
            <el-option
              v-for="opt in partOfSpeechOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="queryForm.status"
            placeholder="请选择状态"
            clearable
            style="width: 160px"
          >
            <el-option label="已上架" :value="1" />
            <el-option label="已下架" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="创建人ID">
          <el-input
            v-model="queryForm.creatorId"
            placeholder="请输入创建人ID"
            clearable
            style="width: 160px"
          />
        </el-form-item>
        <el-form-item label="关键词">
          <el-input
            v-model="queryForm.keyword"
            placeholder="请输入关键词"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>筛选
          </el-button>
          <el-button @click="handleReset">
            <el-icon><RefreshLeft /></el-icon>重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" style="margin-top: 16px">
      <div class="table-toolbar">
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>新增词汇
        </el-button>
      </div>

      <BatchToolbar
        v-if="selectedIds.length > 0"
        :selected-count="selectedIds.length"
        :total-count="total"
      >
        <el-button type="success" plain @click="handleBatchStatus(1)">
          批量上架
        </el-button>
        <el-button type="warning" plain @click="handleBatchStatus(0)">
          批量下架
        </el-button>
        <el-button type="danger" plain @click="handleBatchDelete">
          批量删除
        </el-button>
      </BatchToolbar>

      <TableSkeleton v-if="loading" :row-count="5" :col-count="12" />
      <template v-else>
        <EmptyState v-if="list.length === 0" />
        <el-table
          v-else
          :data="list"
          v-loading="loading"
          style="width: 100%"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" :reserve-selection="false" />
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="word" label="单词" width="140" />
          <el-table-column prop="phonetic" label="音标" width="140" />
          <el-table-column label="词性" width="120">
            <template #default="{ row }">
              <el-tag size="small">{{
                partOfSpeechOptions.find((o) => o.value === row.partOfSpeech)?.label ||
                row.partOfSpeech
              }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="definition" label="释义" min-width="200" show-overflow-tooltip />
          <el-table-column prop="translation" label="翻译" min-width="160" show-overflow-tooltip />
          <el-table-column prop="creatorName" label="创建人" width="120" />
          <el-table-column prop="materialCount" label="素材数" width="80" />
          <el-table-column prop="commentCount" label="评论数" width="80" />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
                {{ row.status === 1 ? '已上架' : '已下架' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" width="180" />
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link @click="handleEdit(row as VocabularyVO)">编辑</el-button>
              <el-button
                :type="(row as VocabularyVO).status === 1 ? 'warning' : 'success'"
                link
                @click="handleStatusChange(row as VocabularyVO, (row as VocabularyVO).status === 1 ? 0 : 1)"
              >
                {{ (row as VocabularyVO).status === 1 ? '下架' : '上架' }}
              </el-button>
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
      width="600px"
      @confirm="handleSubmit"
    >
      <el-form
        ref="formRef"
        :model="modal.formData"
        :rules="formRules"
        label-width="80px"
        :disabled="submitLoading"
      >
        <el-form-item label="单词" prop="word">
          <el-input v-model="modal.formData.word" placeholder="请输入单词" />
        </el-form-item>
        <el-form-item label="音标">
          <el-input v-model="modal.formData.phonetic" placeholder="请输入音标" />
        </el-form-item>
        <el-form-item label="词性" prop="partOfSpeech">
          <el-select v-model="modal.formData.partOfSpeech" placeholder="请选择词性" style="width: 100%">
            <el-option
              v-for="opt in partOfSpeechOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="释义" prop="definition">
          <el-input
            v-model="modal.formData.definition"
            type="textarea"
            :rows="3"
            placeholder="请输入英文释义"
          />
        </el-form-item>
        <el-form-item label="翻译">
          <el-input
            v-model="modal.formData.translation"
            type="textarea"
            :rows="2"
            placeholder="请输入中文翻译"
          />
        </el-form-item>
        <el-form-item label="例句">
          <el-input
            v-model="modal.formData.example"
            type="textarea"
            :rows="2"
            placeholder="请输入例句"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="modal.formData.status">
            <el-radio :value="1">上架</el-radio>
            <el-radio :value="0">下架</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
    </ModalDialog>
  </div>
</template>

<style lang="scss" scoped>
.search-form {
  :deep(.el-form-item) {
    margin-bottom: 0;
  }
}

.table-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
}
</style>
