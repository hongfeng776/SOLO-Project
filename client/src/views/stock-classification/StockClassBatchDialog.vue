<template>
  <FinDialog
    v-model:visible="visible"
    title="批量调整股票产品分类"
    width="960px"
    :close-on-click-modal="false"
    @closed="handleClosed"
  >
    <div class="batch-container">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="批量迁移" name="migrate">
          <el-form :model="migrateForm" label-width="120px" class="batch-form">
            <el-form-item label="源分类">
              <el-select
                v-model="migrateForm.sourceClassIds"
                multiple
                collapse-tags
                collapse-tags-tooltip
                placeholder="请选择源分类"
                style="width: 100%"
              >
                <el-option
                  v-for="item in classOptions"
                  :key="item.id"
                  :label="`${item.className}（${item.classCode}）`"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="目标分类">
              <el-select
                v-model="migrateForm.targetClassId"
                placeholder="请选择目标分类"
                style="width: 100%"
              >
                <el-option
                  v-for="item in classOptions"
                  :key="item.id"
                  :label="`${item.className}（${item.classCode}）`"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
          </el-form>
          <div v-if="migratePreview.length > 0" class="preview-section">
            <div class="preview-title">待迁移产品预览</div>
            <el-table
              :data="migratePreview"
              border
              max-height="260"
              class="resizable-table"
            >
              <el-table-column prop="classCode" label="分类编码" width="140" />
              <el-table-column prop="className" label="分类名称" width="140" />
              <el-table-column prop="classLevel" label="分类层级" width="120">
                <template #default="{ row }">
                  {{ STOCK_CLASS_LEVEL_LABELS[row.classLevel as keyof typeof STOCK_CLASS_LEVEL_LABELS] || row.classLevel }}
                </template>
              </el-table-column>
              <el-table-column prop="productCount" label="关联产品数" width="110" align="center" />
              <el-table-column prop="classStatus" label="分类状态">
                <template #default="{ row }">
                  {{ STOCK_CLASS_STATUS_LABELS[row.classStatus as keyof typeof STOCK_CLASS_STATUS_LABELS] || row.classStatus }}
                </template>
              </el-table-column>
            </el-table>
          </div>
          <div class="submit-row">
            <el-button
              type="primary"
              :loading="migrateLoading"
              :disabled="migrateForm.sourceClassIds.length === 0 || !migrateForm.targetClassId"
              @click="handleMigrate"
            >
              <el-icon v-if="!migrateLoading"><Loading /></el-icon>
              执行迁移
            </el-button>
          </div>
        </el-tab-pane>

        <el-tab-pane label="批量新增标签" name="addTags">
          <el-form :model="addTagsForm" label-width="120px" class="batch-form">
            <el-form-item label="选择分类">
              <el-select
                v-model="addTagsForm.classIds"
                multiple
                collapse-tags
                collapse-tags-tooltip
                placeholder="请选择分类"
                style="width: 100%"
              >
                <el-option
                  v-for="item in classOptions"
                  :key="item.id"
                  :label="`${item.className}（${item.classCode}）`"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="风险标签">
              <el-select
                v-model="addTagsForm.tags"
                multiple
                collapse-tags
                collapse-tags-tooltip
                placeholder="请选择标签"
                style="width: 100%"
              >
                <el-option
                  v-for="tag in STOCK_CLASS_RISK_TAG_LIST"
                  :key="tag"
                  :label="tag"
                  :value="tag"
                />
              </el-select>
            </el-form-item>
          </el-form>
          <div v-if="addTagsPreview.length > 0" class="preview-section">
            <div class="preview-title">选中分类预览</div>
            <el-table
              :data="addTagsPreview"
              border
              max-height="260"
              class="resizable-table"
            >
              <el-table-column prop="classCode" label="分类编码" width="140" />
              <el-table-column prop="className" label="分类名称" width="140" />
              <el-table-column prop="riskTag" label="当前标签" width="120">
                <template #default="{ row }">
                  <el-tag v-if="row.riskTag" size="small">{{ row.riskTag }}</el-tag>
                  <span v-else class="text-muted">无</span>
                </template>
              </el-table-column>
              <el-table-column prop="productCount" label="关联产品数" width="110" align="center" />
              <el-table-column prop="classStatus" label="分类状态">
                <template #default="{ row }">
                  {{ STOCK_CLASS_STATUS_LABELS[row.classStatus as keyof typeof STOCK_CLASS_STATUS_LABELS] || row.classStatus }}
                </template>
              </el-table-column>
            </el-table>
          </div>
          <div class="submit-row">
            <el-button
              type="primary"
              :loading="addTagsLoading"
              :disabled="addTagsForm.classIds.length === 0 || addTagsForm.tags.length === 0"
              @click="handleAddTags"
            >
              <el-icon v-if="!addTagsLoading"><Loading /></el-icon>
              新增标签
            </el-button>
          </div>
        </el-tab-pane>

        <el-tab-pane label="批量作废" name="invalidate">
          <el-alert
            title="作废操作不可恢复，作废后分类下产品将失去归类"
            type="warning"
            :closable="false"
            show-icon
            class="invalidate-alert"
          />
          <el-form :model="invalidateForm" label-width="120px" class="batch-form">
            <el-form-item label="选择分类">
              <el-select
                v-model="invalidateForm.classIds"
                multiple
                collapse-tags
                collapse-tags-tooltip
                placeholder="请选择需作废的分类"
                style="width: 100%"
              >
                <el-option
                  v-for="item in classOptions"
                  :key="item.id"
                  :label="`${item.className}（${item.classCode}）`"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
          </el-form>
          <div v-if="invalidatePreview.length > 0" class="preview-section">
            <div class="preview-title">待作废分类预览</div>
            <el-table
              :data="invalidatePreview"
              border
              max-height="260"
              class="resizable-table"
            >
              <el-table-column prop="classCode" label="分类编码" width="140" />
              <el-table-column prop="className" label="分类名称" width="140" />
              <el-table-column prop="classLevel" label="分类层级" width="120">
                <template #default="{ row }">
                  {{ STOCK_CLASS_LEVEL_LABELS[row.classLevel as keyof typeof STOCK_CLASS_LEVEL_LABELS] || row.classLevel }}
                </template>
              </el-table-column>
              <el-table-column prop="productCount" label="关联产品数" width="110" align="center">
                <template #default="{ row }">
                  <span :class="{ 'text-danger': row.productCount > 0 }">{{ row.productCount }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="classStatus" label="分类状态">
                <template #default="{ row }">
                  {{ STOCK_CLASS_STATUS_LABELS[row.classStatus as keyof typeof STOCK_CLASS_STATUS_LABELS] || row.classStatus }}
                </template>
              </el-table-column>
            </el-table>
          </div>
          <div class="submit-row">
            <el-button
              type="danger"
              :loading="invalidateLoading"
              :disabled="invalidateForm.classIds.length === 0"
              @click="handleInvalidate"
            >
              <el-icon v-if="!invalidateLoading"><Loading /></el-icon>
              确认作废
            </el-button>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </FinDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import FinDialog from '@/components/common/FinDialog.vue'
import * as stockClassApi from '@/api/stockClassification'
import type { IStockClassification } from '@/types/api'
import { STOCK_CLASS_LEVEL_LABELS, STOCK_CLASS_STATUS_LABELS, STOCK_CLASS_RISK_TAG_LIST } from '@/constants/dictionaries'

interface Props {
  visible: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'success': []
}>()

const visible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
})

const activeTab = ref('migrate')
const classOptions = ref<IStockClassification[]>([])

const migrateForm = ref<{ sourceClassIds: number[]; targetClassId: number | null }>({
  sourceClassIds: [],
  targetClassId: null,
})
const migrateLoading = ref(false)

const addTagsForm = ref<{ classIds: number[]; tags: string[] }>({
  classIds: [],
  tags: [],
})
const addTagsLoading = ref(false)

const invalidateForm = ref<{ classIds: number[] }>({
  classIds: [],
})
const invalidateLoading = ref(false)

const migratePreview = computed(() => {
  return classOptions.value.filter((c) => migrateForm.value.sourceClassIds.includes(c.id))
})

const addTagsPreview = computed(() => {
  return classOptions.value.filter((c) => addTagsForm.value.classIds.includes(c.id))
})

const invalidatePreview = computed(() => {
  return classOptions.value.filter((c) => invalidateForm.value.classIds.includes(c.id))
})

async function loadClassOptions() {
  try {
    const res = await stockClassApi.getList({ page: 1, pageSize: 9999 })
    if (res.code === 0) {
      classOptions.value = res.data.list
    }
  } catch {
    classOptions.value = []
  }
}

watch(
  () => props.visible,
  (val) => {
    if (val) {
      loadClassOptions()
    }
  },
)

async function handleMigrate() {
  if (migrateForm.value.sourceClassIds.length === 0) {
    ElMessage.warning('请选择源分类')
    return
  }
  if (!migrateForm.value.targetClassId) {
    ElMessage.warning('请选择目标分类')
    return
  }
  migrateLoading.value = true
  try {
    const res = await stockClassApi.batchMigrate({
      sourceClassIds: migrateForm.value.sourceClassIds,
      targetClassId: migrateForm.value.targetClassId,
    })
    if (res.code === 0) {
      ElMessage.success('批量迁移完成，分类列表与产品归类结果已局部刷新')
      emit('success')
      resetMigrateForm()
    } else {
      ElMessage.error(res.message || '批量迁移失败')
    }
  } catch (err: any) {
    ElMessage.error(err.message || '批量迁移失败')
  } finally {
    migrateLoading.value = false
  }
}

async function handleAddTags() {
  if (addTagsForm.value.classIds.length === 0) {
    ElMessage.warning('请选择分类')
    return
  }
  if (addTagsForm.value.tags.length === 0) {
    ElMessage.warning('请选择标签')
    return
  }
  addTagsLoading.value = true
  try {
    const res = await stockClassApi.batchAddTags({
      classIds: addTagsForm.value.classIds,
      tags: addTagsForm.value.tags,
    })
    if (res.code === 0) {
      ElMessage.success('批量标签新增完成')
      emit('success')
      resetAddTagsForm()
    } else {
      ElMessage.error(res.message || '批量标签新增失败')
    }
  } catch (err: any) {
    ElMessage.error(err.message || '批量标签新增失败')
  } finally {
    addTagsLoading.value = false
  }
}

async function handleInvalidate() {
  if (invalidateForm.value.classIds.length === 0) {
    ElMessage.warning('请选择需作废的分类')
    return
  }
  invalidateLoading.value = true
  try {
    const res = await stockClassApi.batchInvalidate(invalidateForm.value.classIds)
    if (res.code === 0) {
      ElMessage.success('批量作废完成')
      emit('success')
      resetInvalidateForm()
    } else {
      ElMessage.error(res.message || '批量作废失败')
    }
  } catch (err: any) {
    ElMessage.error(err.message || '批量作废失败')
  } finally {
    invalidateLoading.value = false
  }
}

function resetMigrateForm() {
  migrateForm.value = { sourceClassIds: [], targetClassId: null }
}

function resetAddTagsForm() {
  addTagsForm.value = { classIds: [], tags: [] }
}

function resetInvalidateForm() {
  invalidateForm.value = { classIds: [] }
}

function handleClosed() {
  activeTab.value = 'migrate'
  resetMigrateForm()
  resetAddTagsForm()
  resetInvalidateForm()
}
</script>

<style lang="scss" scoped>
.batch-container {
  min-height: 400px;
}

.batch-form {
  margin-top: 16px;
}

.invalidate-alert {
  margin-top: 12px;
}

.preview-section {
  margin-top: 20px;

  .preview-title {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 12px;
  }
}

.resizable-table {
  :deep(.el-table__body-wrapper) {
    overflow-x: auto;
  }

  :deep(.el-table__header th .cell) {
    cursor: col-resize;
  }
}

.submit-row {
  margin-top: 20px;
  text-align: right;
}

.text-muted {
  color: #c0c4cc;
}

.text-danger {
  color: #f56c6c;
  font-weight: 600;
}
</style>
