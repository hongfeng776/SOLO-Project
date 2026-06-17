<template>
  <div class="page-container category-management">
    <el-row :gutter="20" class="stats-row mb-20">
      <el-col :span="6">
        <div class="stat-card stat-total">
          <div class="stat-icon">
            <el-icon :size="24"><Folder /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">总分类数</div>
            <div class="stat-value">{{ stats.totalCount }}</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-core">
          <div class="stat-icon">
            <el-icon :size="24"><Star /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">核心品类</div>
            <div class="stat-value">{{ stats.coreCount }}</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-tags">
          <div class="stat-icon">
            <el-icon :size="24"><PriceTag /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">下属标签总数</div>
            <div class="stat-value">{{ stats.totalTagCount }}</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-today">
          <div class="stat-icon">
            <el-icon :size="24"><Calendar /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">今日新增</div>
            <div class="stat-value">{{ stats.todayNewCount }}</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="main-content">
      <el-col :span="5">
        <el-card shadow="never" class="tree-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">分类树</span>
              <el-button link type="primary" size="small" @click="loadCategoryTree">
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
            </div>
          </template>
          <el-tree
            ref="treeRef"
            :data="categoryTree"
            :props="{ label: 'name', children: 'children' }"
            node-key="id"
            default-expand-all
            highlight-current
            @node-click="handleTreeNodeClick"
          >
            <template #default="{ node, data }">
              <div class="tree-node">
                <el-icon class="node-icon" :color="data.color || '#409eff'">
                  <Folder v-if="node.children?.length" />
                  <Document v-else />
                </el-icon>
                <span class="node-label">{{ data.name }}</span>
                <el-tag v-if="data.isCore === 1" type="warning" size="small" effect="light" class="core-tag">
                  核心
                </el-tag>
              </div>
            </template>
          </el-tree>
        </el-card>
      </el-col>

      <el-col :span="19">
        <el-card shadow="never" class="mb-20">
          <el-form :model="queryParams" label-width="70px" inline @submit.prevent>
            <el-form-item label="关键词">
              <el-input
                v-model="queryParams.keyword"
                placeholder="分类名/编码"
                clearable
                style="width: 180px"
                class="focus-input"
                @keyup.enter="handleSearch"
              />
            </el-form-item>
            <el-form-item label="状态">
              <el-select
                v-model="queryParams.status"
                placeholder="全部状态"
                clearable
                style="width: 120px"
                class="focus-input"
              >
                <el-option label="启用" :value="1" />
                <el-option label="禁用" :value="2" />
              </el-select>
            </el-form-item>
            <el-form-item label="层级">
              <el-select
                v-model="queryParams.level"
                placeholder="全部层级"
                clearable
                style="width: 120px"
                class="focus-input"
              >
                <el-option label="一级分类" :value="1" />
                <el-option label="二级分类" :value="2" />
                <el-option label="三级分类" :value="3" />
              </el-select>
            </el-form-item>
            <el-form-item label="场景">
              <el-select
                v-model="queryParams.scene"
                placeholder="全部场景"
                clearable
                style="width: 140px"
                class="focus-input"
              >
                <el-option
                  v-for="scene in CONTENT_SCENES"
                  :key="scene.value"
                  :label="scene.label"
                  :value="scene.value"
                />
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
              <span class="card-title">分类列表</span>
              <div class="header-actions">
                <el-button type="primary" :icon="Plus" @click="openForm()">新增分类</el-button>
              </div>
            </div>
          </template>

          <BatchActions
            :selected-ids="selectedIds"
            :selected-rows="selectedRows as unknown[]"
            :total="total"
            always-show
            :allow-delete="false"
            :allow-export="false"
          >
            <el-button
              type="success"
              plain
              size="small"
              :icon="CircleCheck"
              :disabled="!hasSelection"
              @click="handleBatchStatusChange(1)"
            >
              批量启用
            </el-button>
            <el-button
              type="danger"
              plain
              size="small"
              :icon="CircleClose"
              :disabled="!hasSelection"
              @click="handleBatchStatusChange(2)"
            >
              批量禁用
            </el-button>
            <el-button
              type="warning"
              plain
              size="small"
              :icon="MagicStick"
              :disabled="!hasSelection"
              @click="openBatchWeightDialog"
            >
              批量修改权重
            </el-button>
          </BatchActions>

          <div ref="tableScrollRef" class="table-scroll-container" @scroll="handleTableScroll">
            <HtTable
              :data="dataList"
              :loading="loading"
              :total="total"
              v-model:page="queryParams.page"
              v-model:page-size="queryParams.pageSize"
              selectable
              show-index
              row-key="id"
              highlight-current-row
              stripe
              :row-class-name="tableRowClassName"
              @selection-change="(rows: unknown[]) => handleSelectionChange(rows as Category[])"
              @paginate="handlePaginate"
            >
              <el-table-column label="名称/编码" min-width="180">
                <template #default="{ row }">
                  <div class="name-cell">
                    <el-icon :color="row.color || '#409eff'">
                      <component :is="row.icon || 'Folder'" />
                    </el-icon>
                    <div class="name-content">
                      <div class="name-text">{{ row.name }}</div>
                      <div class="code-text">{{ row.code }}</div>
                    </div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="层级" width="100" align="center">
                <template #default="{ row }">
                  <el-tag type="info" size="small" effect="light">
                    {{ levelNames[row.level] || `L${row.level}` }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="parentId" label="上级分类" width="120" align="center">
                <template #default="{ row }">
                  <span v-if="row.parentId" class="parent-id">#{{ row.parentId }}</span>
                  <span v-else class="no-parent">顶级</span>
                </template>
              </el-table-column>
              <el-table-column label="适配场景" min-width="200">
                <template #default="{ row }">
                  <div class="scene-tags">
                    <el-tag
                      v-for="scene in row.scenes?.slice(0, 3)"
                      :key="scene"
                      type="primary"
                      size="small"
                      effect="plain"
                    >
                      {{ scene }}
                    </el-tag>
                    <el-tooltip v-if="row.scenes && row.scenes.length > 3">
                      <template #content>
                        <div v-for="scene in row.scenes.slice(3)" :key="scene">{{ scene }}</div>
                      </template>
                      <el-tag size="small" type="info">+{{ row.scenes.length - 3 }}</el-tag>
                    </el-tooltip>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="核心品类" width="100" align="center">
                <template #default="{ row }">
                  <el-icon v-if="row.isCore === 1" class="core-icon" color="#e6a23c" :size="20">
                    <StarFilled />
                  </el-icon>
                  <span v-else class="not-core">-</span>
                </template>
              </el-table-column>
              <el-table-column label="下属标签数" width="110" align="center">
                <template #default="{ row }">
                  <span class="count-num">{{ row.tagCount }}</span>
                </template>
              </el-table-column>
              <el-table-column label="笔记数" width="90" align="center">
                <template #default="{ row }">
                  <span class="count-num">{{ row.noteCount }}</span>
                </template>
              </el-table-column>
              <el-table-column label="状态" width="100" align="center">
                <template #default="{ row }">
                  <el-switch
                    v-model="row.status"
                    :active-value="1"
                    :inactive-value="2"
                    class="status-switch"
                    @change="(val: number) => handleStatusChange(row, val)"
                  />
                </template>
              </el-table-column>
              <el-table-column prop="weight" label="权重" width="80" align="center" />
              <el-table-column label="创建时间" width="160">
                <template #default="{ row }">
                  {{ formatDateTime(row.createTime) }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="220" align="center" fixed="right">
                <template #default="{ row }">
                  <el-button link type="primary" size="small" @click="openDetailDrawer(row)">
                    详情
                  </el-button>
                  <el-button link type="primary" size="small" @click="openForm(row)">
                    编辑
                  </el-button>
                  <el-button link type="danger" size="small" @click="handleDelete(row)">
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </HtTable>
          </div>

          <el-button
            v-show="showBackTop"
            class="back-to-top"
            :icon="Top"
            circle
            @click="scrollToTop"
          />
        </el-card>
      </el-col>
    </el-row>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑分类' : '新增分类'"
      width="640px"
      destroy-on-close
      @close="handleCloseForm"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="90px"
        class="category-form"
      >
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="分类名称" prop="name" :class="{ 'field-error': fieldErrors.name }">
              <el-input
                v-model="formData.name"
                placeholder="请输入分类名称 (2-20字)"
                maxlength="20"
                show-word-limit
                class="focus-input"
                @blur="validateUniqueName"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="分类编码" prop="code" :class="{ 'field-error': fieldErrors.code }">
              <el-input
                v-model="formData.code"
                placeholder="请输入分类编码"
                class="focus-input"
                @blur="validateUniqueCode"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="上级分类" prop="parentId">
              <el-tree-select
                v-model="formData.parentId"
                :data="categoryTree"
                :props="{ label: 'name', value: 'id', children: 'children' }"
                placeholder="顶级分类（不选）"
                clearable
                check-strictly
                class="focus-input"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="层级" prop="level">
              <el-select v-model="formData.level" placeholder="请选择层级" class="focus-input" style="width: 100%">
                <el-option label="一级分类" :value="1" />
                <el-option label="二级分类" :value="2" />
                <el-option label="三级分类" :value="3" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="描述" prop="description">
              <el-input
                v-model="formData.description"
                type="textarea"
                :rows="2"
                placeholder="请输入分类描述"
                maxlength="200"
                show-word-limit
                class="focus-input"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="图标" prop="icon">
              <el-input v-model="formData.icon" placeholder="Icon组件名" class="focus-input" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="颜色" prop="color">
              <el-color-picker v-model="formData.color" show-alpha />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="排序" prop="sort">
              <el-input-number v-model="formData.sort" :min="0" :max="9999" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="权重" prop="weight">
              <el-input-number v-model="formData.weight" :min="0" :max="100" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="核心品类" prop="isCore">
              <el-switch v-model="formData.isCore" :active-value="1" :inactive-value="0" active-text="是" inactive-text="否" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="状态" prop="status">
              <el-switch
                v-model="formData.status"
                :active-value="1"
                :inactive-value="2"
                active-text="启用"
                inactive-text="禁用"
                class="status-switch"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="适配场景" prop="scenes" :class="{ 'field-error': fieldErrors.scenes }">
              <el-checkbox-group v-model="formData.scenes">
                <el-checkbox
                  v-for="scene in CONTENT_SCENES"
                  :key="scene.value"
                  :label="scene.value"
                  :value="scene.value"
                >
                  {{ scene.label }}
                </el-checkbox>
              </el-checkbox-group>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="handleCloseForm">取消</el-button>
        <el-button type="primary" :loading="formLoading" @click="handleSubmitForm">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="batchWeightVisible"
      title="批量修改权重"
      width="400px"
      destroy-on-close
    >
      <el-form label-width="80px">
        <el-form-item label="新权重">
          <el-input-number v-model="batchWeight" :min="0" :max="100" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchWeightVisible = false">取消</el-button>
        <el-button type="primary" @click="handleBatchWeight">确定</el-button>
      </template>
    </el-dialog>

    <el-drawer
      v-model="detailDrawerVisible"
      :title="currentCategory?.name || '分类详情'"
      size="60%"
      destroy-on-close
    >
      <div v-if="currentCategory" ref="drawerScrollRef" class="detail-container" @scroll="handleDrawerScroll">
        <el-descriptions :column="2" border class="mb-20">
          <el-descriptions-item label="分类ID">{{ currentCategory.id }}</el-descriptions-item>
          <el-descriptions-item label="分类编码">{{ currentCategory.code }}</el-descriptions-item>
          <el-descriptions-item label="层级">{{ levelNames[currentCategory.level] }}</el-descriptions-item>
          <el-descriptions-item label="上级ID">{{ currentCategory.parentId || '顶级' }}</el-descriptions-item>
          <el-descriptions-item label="核心品类">
            <el-tag v-if="currentCategory.isCore === 1" type="warning" size="small">是</el-tag>
            <span v-else>否</span>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag v-if="currentCategory.status === 1" type="success" size="small">启用</el-tag>
            <el-tag v-else type="info" size="small">禁用</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="权重">{{ currentCategory.weight }}</el-descriptions-item>
          <el-descriptions-item label="排序">{{ currentCategory.sort }}</el-descriptions-item>
          <el-descriptions-item label="下属标签数">{{ currentCategory.tagCount }}</el-descriptions-item>
          <el-descriptions-item label="笔记数">{{ currentCategory.noteCount }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDateTime(currentCategory.createTime) }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ formatDateTime(currentCategory.updateTime) }}</el-descriptions-item>
          <el-descriptions-item label="适配场景" :span="2">
            <el-tag
              v-for="scene in currentCategory.scenes"
              :key="scene"
              type="primary"
              size="small"
              effect="plain"
              style="margin-right: 6px"
            >
              {{ scene }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="描述" :span="2">{{ currentCategory.description || '-' }}</el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">下属标签</el-divider>
        <div class="tag-list-section">
          <el-empty v-if="!mockTags.length" description="暂无下属标签" />
          <div v-else class="tags-grid">
            <div v-for="tag in mockTags" :key="tag.id" class="tag-card">
              <div class="tag-header">
                <el-tag :type="tag.hotLevel === 2 ? 'danger' : 'primary'" effect="light">
                  {{ tag.name }}
                </el-tag>
                <span class="use-count">使用: {{ tag.useCount }}</span>
              </div>
              <div class="tag-desc">{{ tag.description || '暂无描述' }}</div>
            </div>
          </div>
        </div>

        <el-alert
          v-if="unusedCategorySuggestion > 0"
          type="warning"
          :closable="false"
          class="mb-20"
          show-icon
        >
          检测到 {{ unusedCategorySuggestion }} 个分类下长期无标签，建议清理
          <el-button link type="warning" size="small" style="margin-left: 8px">立即清理</el-button>
        </el-alert>

        <el-divider content-position="left">使用历史</el-divider>
        <div class="usage-logs-table">
          <el-table :data="mockUsageLogs" border stripe height="300">
            <el-table-column prop="noteTitle" label="笔记标题" min-width="200">
              <template #default="{ row }">
                <el-tooltip v-if="row.noteTitle.length > 20" :content="row.noteTitle" placement="top">
                  <span>{{ row.noteTitle }}</span>
                </el-tooltip>
                <span v-else>{{ row.noteTitle }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="userName" label="操作人" width="120" align="center" />
            <el-table-column prop="action" label="操作" width="100" align="center">
              <template #default="{ row }">
                <el-tag size="small" :type="row.action === 'add' ? 'success' : 'info'">
                  {{ row.action === 'add' ? '新增' : '移除' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="时间" width="160">
              <template #default="{ row }">
                {{ formatDateTime(row.createTime) }}
              </template>
            </el-table-column>
          </el-table>
        </div>

        <el-button
          v-show="drawerShowBackTop"
          class="back-to-top"
          :icon="Top"
          circle
          @click="drawerScrollToTop"
        />
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import {
  ElMessage,
  ElMessageBox,
  type FormInstance,
  type FormRules
} from 'element-plus'
import {
  Search,
  Refresh,
  Plus,
  Folder,
  Document,
  Star,
  StarFilled,
  Calendar,
  PriceTag,
  CircleCheck,
  CircleClose,
  MagicStick,
  Top
} from '@element-plus/icons-vue'
import { useFetchList, useSelection, formatDateTime } from '@hooks/index'
import { useUserStore } from '@/stores/modules/user'
import {
  getCategoryList,
  getCategoryTree,
  getCategoryAll,
  getCategoryStats,
  createCategory,
  updateCategory,
  deleteCategory,
  updateCategoryStatus,
  type CategoryListParams
} from '@/api/category'
import { CONTENT_SCENES, CategoryStatus, OperatorRole } from '@enums/business'
import type { Category, TagUsageLog } from '@/types/business'
import HtTable from '@components/HtTable/index.vue'
import BatchActions from '@components/BatchActions/index.vue'

const userStore = useUserStore()

const levelNames: Record<number, string> = {
  1: '一级',
  2: '二级',
  3: '三级'
}

const stats = reactive({
  totalCount: 0,
  coreCount: 0,
  totalTagCount: 0,
  todayNewCount: 0
})

const categoryTree = ref<Category[]>([])
const treeRef = ref()
const tableScrollRef = ref<HTMLElement>()
const drawerScrollRef = ref<HTMLElement>()
const showBackTop = ref(false)
const drawerShowBackTop = ref(false)

const {
  loading,
  dataList,
  total,
  queryParams,
  fetchData,
  handleSearch,
  handleReset,
  handlePaginate
} = useFetchList<Category, CategoryListParams>({
  fetchApi: getCategoryList,
  defaultParams: {
    keyword: '',
    status: undefined,
    level: undefined,
    scene: '',
    parentId: undefined
  } as unknown as CategoryListParams
})

const {
  selectedRows,
  selectedIds,
  hasSelection,
  handleSelectionChange,
  clearSelection
} = useSelection<Category>()

const dialogVisible = ref(false)
const isEdit = ref(false)
const formLoading = ref(false)
const formRef = ref<FormInstance>()
const fieldErrors = reactive({ name: false, code: false, scenes: false })

const defaultFormData = (): Partial<Category> => ({
  name: '',
  code: '',
  parentId: undefined,
  level: 1,
  description: '',
  coverImage: '',
  icon: 'Folder',
  color: '#409eff',
  sort: 0,
  status: 1,
  isCore: 0,
  weight: 50,
  scenes: []
})

const formData = reactive<Partial<Category>>(defaultFormData())

const rules: FormRules = {
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入分类编码', trigger: 'blur' }],
  level: [{ required: true, message: '请选择层级', trigger: 'change' }],
  scenes: [{ required: true, message: '请至少选择一个适配场景', trigger: 'change' }]
}

const batchWeightVisible = ref(false)
const batchWeight = ref(50)

const detailDrawerVisible = ref(false)
const currentCategory = ref<Category | null>(null)
const mockTags = ref<Array<{ id: number; name: string; useCount: number; description: string; hotLevel: number }>>([])
const mockUsageLogs = ref<TagUsageLog[]>([])
const unusedCategorySuggestion = ref(0)

const tableRowClassName = ({ rowIndex }: { rowIndex: number }) => {
  return rowIndex % 2 === 0 ? 'row-even' : 'row-odd'
}

const loadCategoryTree = async () => {
  try {
    categoryTree.value = await getCategoryTree()
  } catch (e) {
    categoryTree.value = []
  }
}

const loadStats = async () => {
  try {
    const data = await getCategoryStats()
    Object.assign(stats, data)
  } catch (e) {
    // ignore
  }
}

const handleTreeNodeClick = (data: Category) => {
  queryParams.parentId = data.id
  queryParams.page = 1
  fetchData()
}

const triggerShake = (field: keyof typeof fieldErrors) => {
  fieldErrors[field] = true
  setTimeout(() => {
    fieldErrors[field] = false
  }, 300)
}

const validateUniqueName = async () => {
  if (!formData.name || formData.name.length < 2) {
    triggerShake('name')
    ElMessage.error('分类名称至少2个字符')
    return false
  }
  if (formData.name.length > 20) {
    triggerShake('name')
    ElMessage.error('分类名称最多20个字符')
    return false
  }
  return true
}

const validateUniqueCode = async () => {
  if (!formData.code) {
    triggerShake('code')
    return false
  }
  return true
}

const openForm = (row?: Category) => {
  isEdit.value = !!row
  if (row) {
    Object.assign(formData, { ...row })
  } else {
    Object.assign(formData, defaultFormData())
  }
  Object.keys(fieldErrors).forEach(k => { fieldErrors[k as keyof typeof fieldErrors] = false })
  dialogVisible.value = true
}

const handleCloseForm = () => {
  dialogVisible.value = false
  formRef.value?.resetFields()
  Object.assign(formData, defaultFormData())
}

const handleSubmitForm = async () => {
  if (!formRef.value) return

  if (!formData.scenes || formData.scenes.length === 0) {
    triggerShake('scenes')
    ElMessage.error('必须至少选择一个适配场景')
    return
  }

  const nameValid = await validateUniqueName()
  const codeValid = await validateUniqueCode()
  if (!nameValid || !codeValid) return

  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  formLoading.value = true
  try {
    if (isEdit.value && formData.id) {
      await updateCategory(formData.id, formData)
      ElMessage.success('更新成功')
    } else {
      await createCategory(formData)
      ElMessage.success('创建成功')
    }
    handleCloseForm()
    await loadCategoryTree()
    fetchData()
    loadStats()
  } catch (e: unknown) {
    const err = e as { errors?: string[] }
    if (err?.errors?.length) {
      ElMessageBox.alert(
        err.errors.join('<br/>'),
        '数据校验不通过',
        { dangerouslyUseHTMLString: true, type: 'error' }
      )
    }
  } finally {
    formLoading.value = false
  }
}

const handleStatusChange = async (row: Category, val: number) => {
  const prevStatus = val === 1 ? 2 : 1
  if (val === 2) {
    try {
      await ElMessageBox.confirm(
        '禁用后新发布笔记无法选择该分类，已有笔记保留展示但不参与流量筛选，确认禁用？',
        '禁用确认',
        { type: 'warning', confirmButtonText: '确认禁用', cancelButtonText: '取消' }
      )
    } catch {
      row.status = prevStatus
      return
    }
  }
  try {
    await updateCategoryStatus(row.id, val)
    ElMessage.success(val === 1 ? '已启用' : '已禁用')
    loadStats()
  } catch (e) {
    console.error(e)
    row.status = prevStatus
    ElMessage.error('操作失败')
  }
}

const checkCorePermission = () => {
  const hasCoreRows = selectedRows.value.some(r => r.isCore === 1)
  if (hasCoreRows && !userStore.hasRole(OperatorRole.ADMIN) && !userStore.hasRole('super_ops')) {
    ElMessageBox.alert('您没有批量操作核心品类的权限', '权限不足', { type: 'error' })
    return false
  }
  return true
}

const handleBatchStatusChange = async (status: number) => {
  if (!selectedIds.value.length) return
  if (!checkCorePermission()) return

  const action = status === 1 ? '启用' : '禁用'
  try {
    await ElMessageBox.confirm(
      `确认${action}选中的 ${selectedIds.value.length} 个分类？`,
      `批量${action}确认`,
      { type: 'warning' }
    )
  } catch {
    return
  }

  try {
    await Promise.all(selectedIds.value.map(id => updateCategoryStatus(id, status)))
    ElMessage.success(`批量${action}成功`)
    clearSelection()
    fetchData()
    loadStats()
  } catch (e) {
    ElMessage.error(`批量${action}失败`)
  }
}

const openBatchWeightDialog = () => {
  if (!checkCorePermission()) return
  batchWeightVisible.value = true
}

const handleBatchWeight = async () => {
  if (!selectedIds.value.length) return
  try {
    await Promise.all(
      selectedIds.value.map(id =>
        updateCategory(id, { weight: batchWeight.value })
      )
    )
    ElMessage.success('批量修改权重成功')
    batchWeightVisible.value = false
    clearSelection()
    fetchData()
  } catch (e) {
    ElMessage.error('批量修改权重失败')
  }
}

const handleDelete = async (row: Category) => {
  try {
    await ElMessageBox.confirm(
      `确认删除分类「${row.name}」吗？删除后下属标签将变为无分类状态，此操作不可恢复。`,
      '删除确认',
      { type: 'warning', confirmButtonText: '确认删除', cancelButtonText: '取消' }
    )
    await deleteCategory(row.id)
    ElMessage.success('删除成功')
    await loadCategoryTree()
    fetchData()
    loadStats()
  } catch {
    // canceled
  }
}

const openDetailDrawer = async (row: Category) => {
  currentCategory.value = row
  detailDrawerVisible.value = true
  mockTags.value = [
    { id: 1, name: '探店好去处', useCount: 234, description: '优质探店地点推荐', hotLevel: 2 },
    { id: 2, name: '美食分享', useCount: 189, description: '用户真实美食体验', hotLevel: 1 },
    { id: 3, name: '网红餐厅', useCount: 156, description: '热门打卡餐厅', hotLevel: 2 },
    { id: 4, name: '地道小吃', useCount: 98, description: '本地特色小吃', hotLevel: 1 }
  ]
  mockUsageLogs.value = [
    { id: 1, tagId: 1, tagName: '探店好去处', noteId: 1001, noteTitle: '北京胡同里的宝藏小店！人均50元吃到撑的地道美食', userId: 1, userName: '张三', action: 'add', reason: '', createTime: '2025-01-15 10:30' },
    { id: 2, tagId: 2, tagName: '美食分享', noteId: 1002, noteTitle: '今日份美食日记', userId: 2, userName: '李四', action: 'add', reason: '', createTime: '2025-01-15 11:20' },
    { id: 3, tagId: 1, tagName: '探店好去处', noteId: 1003, noteTitle: '周末去哪吃？这家店绝了', userId: 3, userName: '王五', action: 'remove', reason: '标签不匹配', createTime: '2025-01-15 14:00' },
    { id: 4, tagId: 3, tagName: '网红餐厅', noteId: 1004, noteTitle: '打卡魔都最火餐厅', userId: 1, userName: '张三', action: 'add', reason: '', createTime: '2025-01-15 15:30' }
  ]
  unusedCategorySuggestion.value = 3
}

const handleTableScroll = (e: Event) => {
  const target = e.target as HTMLElement
  showBackTop.value = target.scrollTop > 500
}

const scrollToTop = () => {
  tableScrollRef.value?.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleDrawerScroll = (e: Event) => {
  const target = e.target as HTMLElement
  drawerShowBackTop.value = target.scrollTop > 500
}

const drawerScrollToTop = () => {
  drawerScrollRef.value?.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  loadCategoryTree()
  loadStats()
})
</script>

<style lang="scss" scoped>
.category-management {
  .stats-row {
    .stat-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      border-radius: $border-radius;
      background: #fff;
      border: 1px solid $border-color-lighter;
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      }

      .stat-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .stat-info {
        flex: 1;

        .stat-label {
          font-size: 13px;
          color: $text-regular;
          margin-bottom: 4px;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 600;
          color: $text-primary;
        }
      }

      &.stat-total .stat-icon {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: #fff;
      }

      &.stat-core .stat-icon {
        background: linear-gradient(135deg, #f6d365 0%, #fda085 100%);
        color: #fff;
      }

      &.stat-tags .stat-icon {
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        color: #fff;
      }

      &.stat-today .stat-icon {
        background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
        color: #fff;
      }
    }
  }

  .main-content {
    .tree-card {
      height: calc(100vh - 320px);
      display: flex;
      flex-direction: column;

      :deep(.el-card__body) {
        flex: 1;
        overflow-y: auto;
      }
    }

    .tree-node {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 2px 0;

      .node-icon {
        font-size: 14px;
      }

      .node-label {
        flex: 1;
        font-size: 14px;
      }

      .core-tag {
        transform: scale(0.85);
      }
    }
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .card-title {
      font-size: 15px;
      font-weight: 600;
      color: $text-primary;
    }

    .header-actions {
      display: flex;
      gap: 8px;
    }
  }

  .table-scroll-container {
    max-height: 600px;
    overflow-y: auto;
    position: relative;
  }

  .name-cell {
    display: flex;
    align-items: center;
    gap: 10px;

    .name-content {
      .name-text {
        font-weight: 500;
        color: $text-primary;
      }

      .code-text {
        font-size: 12px;
        color: $text-secondary;
      }
    }
  }

  .scene-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .core-icon {
    animation: pulse 2s infinite;
  }

  .count-num {
    font-weight: 600;
    color: $color-primary;
  }

  .parent-id {
    color: $text-secondary;
  }

  .no-parent {
    color: $text-placeholder;
    font-size: 12px;
  }

  .back-to-top {
    position: fixed;
    right: 40px;
    bottom: 60px;
    z-index: 100;
    opacity: 0.9;
    animation: fadeInUp 0.3s ease;
  }

  .focus-input {
    :deep(.el-input__wrapper) {
      transition: all 0.25s ease;

      &:focus-within {
        transform: scale(1.01);
        box-shadow: 0 0 0 1px #409eff inset;
        background: #f4faff;
      }
    }
  }

  .field-error {
    animation: fieldShake 0.3s ease;

    :deep(.el-input__wrapper) {
      box-shadow: 0 0 0 1px #f56c6c inset !important;
    }
  }

  @keyframes fieldShake {
    0%,
    100% {
      transform: translateX(0);
    }
    20%,
    60% {
      transform: translateX(-4px);
    }
    40%,
    80% {
      transform: translateX(4px);
    }
  }

  .status-switch {
    transition: all 0.3s ease;

    &:active {
      transform: translate(1px, 1px);
      filter: brightness(0.95);
    }
  }

  .category-form {
    :deep(.el-color-picker) {
      width: 100%;

      .el-color-picker__trigger {
        width: 100%;
      }
    }
  }

  .detail-container {
    max-height: calc(100vh - 120px);
    overflow-y: auto;
    padding-right: 8px;

    .tag-list-section {
      .tags-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
        margin-bottom: 20px;
      }

      .tag-card {
        padding: 12px;
        border: 1px solid $border-color-lighter;
        border-radius: $border-radius;
        transition: all 0.2s ease;

        &:hover {
          border-color: $color-primary;
          background: $color-primary-light;
        }

        .tag-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;

          .use-count {
            font-size: 12px;
            color: $text-secondary;
          }
        }

        .tag-desc {
          font-size: 13px;
          color: $text-regular;
        }
      }
    }
  }

  .row-even {
    background: #fff;
  }

  .row-odd {
    background: #fafbfc;
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 0.9;
    transform: translateY(0);
  }
}
</style>
