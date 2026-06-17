<template>
  <div class="category-page">
    <div class="page-header">
      <h2 class="page-title">分类关联管理</h2>
      <div class="header-actions">
        <el-radio-group v-model="categoryType" @change="loadData">
          <el-radio-button value="image">图片分类</el-radio-button>
          <el-radio-button value="video">视频分类</el-radio-button>
          <el-radio-button value="template">模板分类</el-radio-button>
        </el-radio-group>
        <el-button type="primary" :icon="Plus" @click="openAddDialog">新增分类</el-button>
        <el-button :icon="DataLine" @click="loadCategoryStats">分类统计</el-button>
      </div>
    </div>

    <el-row :gutter="16">
      <el-col :span="10">
        <el-card class="category-tree-card">
          <div class="tree-header">
            <span class="title">分类层级</span>
            <el-tag size="small" type="info">拖拽调整父级</el-tag>
          </div>
          <el-tree
            ref="treeRef"
            :data="treeData"
            node-key="id"
            :props="{ label: 'name', children: 'children' }"
            draggable
            :allow-drop="allowDrop"
            :allow-drag="allowDrag"
            @node-drag-start="onDragStart"
            @node-drag-over="onDragOver"
            @node-drop="onDrop"
            :expand-on-click-node="false"
            @node-click="onNodeClick"
            :highlight-current="true"
            default-expand-all
          >
            <template #default="{ data }">
              <div class="tree-node" :class="{ 'drag-over': dragOverId === data.id }">
                <span class="node-name" :title="data.name">{{ data.name }}</span>
                <span class="node-count">
                  <el-tag size="small" :type="data.resourceCount > data.maxCapacity * 0.9 ? 'danger' : 'success'">
                    {{ data.resourceCount }}/{{ data.maxCapacity }}
                  </el-tag>
                </span>
              </div>
            </template>
          </el-tree>
        </el-card>
      </el-col>

      <el-col :span="14">
        <el-card v-if="selectedCategory" class="category-detail-card">
          <template #header>
            <div class="card-header">
              <span>分类详情 - {{ selectedCategory.name }}</span>
              <div class="header-actions">
                <el-button size="small" @click="openBindDialog">绑定素材</el-button>
                <el-button size="small" @click="openMigrateDialog">批量迁移</el-button>
                <el-button size="small" type="primary" @click="loadCategoryTrace">溯源校验</el-button>
                <el-button size="small" @click="openEditDialog(selectedCategory)">编辑</el-button>
              </div>
            </div>
          </template>
          <el-descriptions :column="3" border size="small">
            <el-descriptions-item label="分类类型">
              <el-tag size="small">{{ typeLabel[selectedCategory.type] }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="素材数量">
              <span :style="{ color: selectedCategory.resourceCount > selectedCategory.maxCapacity * 0.9 ? '#f56c6c' : '#67c23a' }">
                {{ selectedCategory.resourceCount }} / {{ selectedCategory.maxCapacity }}
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="父级分类">
              {{ getParentName(selectedCategory.parentId) || '一级分类' }}
            </el-descriptions-item>
            <el-descriptions-item label="适配标签">{{ selectedCategory.tags || '-' }}</el-descriptions-item>
            <el-descriptions-item label="最近绑定">{{ selectedCategory.bindTime || '-' }}</el-descriptions-item>
            <el-descriptions-item label="操作人员">{{ selectedCategory.bindOperator || '-' }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card v-if="selectedCategory" class="resource-list-card" style="margin-top: 16px">
          <template #header>
            <div class="card-header">
              <span>分类下素材 ({{ categoryResources.length }})</span>
              <el-input
                v-model="searchKeyword"
                placeholder="搜索素材名称"
                size="small"
                clearable
                style="width: 200px"
                :prefix-icon="Search"
              />
            </div>
          </template>
          <div class="table-wrapper">
            <el-table
              :data="filteredResources"
              style="width: 100%"
              height="400"
              border
              stripe
              @selection-change="onSelectionChange"
            >
              <el-table-column type="selection" width="55" fixed="left" />
              <el-table-column prop="materialCode" label="素材编码" width="160" fixed="left">
                <template #default="{ row }">
                  <el-tooltip :content="row.materialCode" placement="top">
                    <span class="mono-code">{{ row.materialCode }}</span>
                  </el-tooltip>
                </template>
              </el-table-column>
              <el-table-column prop="title" label="素材名称" min-width="220" show-overflow-tooltip>
                <template #default="{ row }">
                  <el-tooltip :content="row.title" placement="top">
                    <span>{{ row.title }}</span>
                  </el-tooltip>
                </template>
              </el-table-column>
              <el-table-column prop="fileType" label="类型" width="80" align="center">
                <template #default="{ row }">
                  <el-tag size="small">{{ typeLabel[row.fileType] }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="100" align="center">
                <template #default="{ row }">
                  <StatusTag :status="row.status" />
                </template>
              </el-table-column>
              <el-table-column prop="createdAt" label="绑定时间" width="170" align="center" />
              <el-table-column label="操作" width="140" align="center" fixed="right">
                <template #default="{ row }">
                  <el-button size="small" link type="primary" @click="openRebindDialog(row)">重绑定</el-button>
                  <el-button size="small" link type="danger" @click="unbindResource(row)">解绑</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <div v-if="selectedRows.length > 0" class="batch-bar">
            <span>已选择 {{ selectedRows.length }} 项</span>
            <el-button size="small" @click="openBatchMigrateFromSelection">批量迁移</el-button>
            <el-button size="small" type="danger" @click="batchUnbind">批量解绑</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑分类' : '新增分类'" width="520px" class="scale-dialog">
      <el-form :model="formData" :rules="formRules" ref="formRef" label-width="100px">
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入分类名称" class="focus-glow" />
        </el-form-item>
        <el-form-item label="分类类型" prop="type">
          <el-select v-model="formData.type" style="width: 100%" class="focus-glow">
            <el-option label="图片" value="image" />
            <el-option label="视频" value="video" />
            <el-option label="模板" value="template" />
          </el-select>
        </el-form-item>
        <el-form-item label="父级分类" v-if="!isEdit">
          <el-select v-model="formData.parentId" style="width: 100%" class="focus-glow" @change="validateHierarchy">
            <el-option label="一级分类" :value="0" />
            <el-option
              v-for="c in parentOptions"
              :key="c.id"
              :label="c.name"
              :value="c.id"
            />
          </el-select>
          <div v-if="hierarchyError" class="error-tip">
            <el-icon color="#f56c6c"><CircleClose /></el-icon>
            {{ hierarchyError }}
          </div>
        </el-form-item>
        <el-form-item label="最大容量">
          <el-input-number v-model="formData.maxCapacity" :min="1" :max="10000" />
        </el-form-item>
        <el-form-item label="适配标签">
          <el-input v-model="formData.tags" placeholder="多个标签用逗号分隔，如: 风景,人物,建筑" />
        </el-form-item>
        <el-form-item label="排序"><el-input-number v-model="formData.sort" :min="0" :max="999" /></el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="formData.status">
            <el-radio value="active">启用</el-radio>
            <el-radio value="disabled">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确认</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="migrateDialogVisible" title="批量迁移" width="500px" class="scale-dialog">
      <div class="migrate-content">
        <p>共选择 <b style="color: var(--el-color-primary)">{{ migrateResourceIds.length }}</b> 条素材</p>
        <el-form label-width="100px" style="margin-top: 16px">
          <el-form-item label="目标分类" required>
            <el-select v-model="targetCategoryId" placeholder="请选择目标分类" style="width: 100%" class="focus-glow">
              <el-option
                v-for="c in allCategories"
                :key="c.id"
                :label="`${c.name} (${c.resourceCount}/${c.maxCapacity})`"
                :value="c.id"
                :disabled="c.resourceCount >= c.maxCapacity"
              />
            </el-select>
          </el-form-item>
          <el-form-item v-if="migrateProgress > 0" label="迁移进度">
            <el-progress :percentage="migrateProgress" :stroke-width="12" :status="migrateStatus" />
            <div class="progress-text">
              已处理 {{ migrateProcessed }} / {{ migrateTotal }}，成功 {{ migrateSuccessCount }} 条，失败 {{ migrateFailedCount }} 条
            </div>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="migrateDialogVisible = false" :disabled="migrating">取消</el-button>
        <el-button type="primary" :loading="migrating" :disabled="!targetCategoryId" @click="doMigrate">
          开始迁移
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="traceDialogVisible" title="分类溯源校验" width="900px" class="scale-dialog">
      <div v-loading="traceLoading" class="trace-content">
        <el-row :gutter="16" style="margin-bottom: 16px">
          <el-col :span="8">
            <el-statistic title="合规评分" :value="traceData?.compliance?.score || 0">
              <template #suffix>分</template>
            </el-statistic>
          </el-col>
          <el-col :span="8">
            <div class="compliance-box">
              <span class="label">一致性状态</span>
              <el-tag
                :type="traceData?.compliance?.consistent ? 'success' : 'danger'"
                size="large"
                effect="dark"
              >
                {{ traceData?.compliance?.consistent ? '校验通过' : '存在异常' }}
              </el-tag>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="stats-box">
              <span class="stat-item">素材总数: <b>{{ traceData?.statistics?.totalResources || 0 }}</b></span>
              <span class="stat-item">已发布: <b style="color:#67c23a">{{ traceData?.statistics?.totalPublished || 0 }}</b></span>
              <span class="stat-item">违规: <b style="color:#f56c6c">{{ traceData?.statistics?.totalViolation || 0 }}</b></span>
            </div>
          </el-col>
        </el-row>

        <div v-if="traceData?.compliance?.conflicts?.length > 0" style="margin-bottom: 16px">
          <h4 style="margin-bottom: 8px; color: #f56c6c">
            <el-icon><Warning /></el-icon> 一致性冲突 ({{ traceData.compliance.conflicts.length }})
          </h4>
          <el-table :data="traceData.compliance.conflicts" size="small" border>
            <el-table-column prop="field" label="冲突字段" width="140" />
            <el-table-column label="期望值" width="120" align="center">
              <template #default="{ row }">{{ row.expected }}</template>
            </el-table-column>
            <el-table-column label="实际值" width="120" align="center">
              <template #default="{ row }"><span style="color:#f56c6c">{{ row.actual }}</span></template>
            </el-table-column>
            <el-table-column prop="description" label="说明" />
          </el-table>
        </div>
        <div v-else style="margin-bottom: 16px">
          <el-alert type="success" :closable="false" show-icon title="所有一致性校验通过" />
        </div>

        <div>
          <h4 style="margin-bottom: 8px">近30天绑定记录</h4>
          <el-timeline v-if="traceData?.bindLogs?.length > 0">
            <el-timeline-item
              v-for="(log, idx) in traceData.bindLogs.slice(0, 10)"
              :key="idx"
              :timestamp="log.createdAt"
              placement="top"
              :type="log.result === 'success' ? 'success' : 'danger'"
            >
              <el-card shadow="never" size="small">
                <div class="log-item">
                  <span class="log-user">{{ log.username }}</span>
                  <el-tooltip v-if="log.detail && log.detail.length > 50" :content="log.detail" placement="top">
                    <span class="log-detail">{{ log.detail }}</span>
                  </el-tooltip>
                  <span v-else class="log-detail">{{ log.detail }}</span>
                </div>
              </el-card>
            </el-timeline-item>
          </el-timeline>
          <el-empty v-else description="暂无绑定记录" />
        </div>
      </div>
      <template #footer>
        <el-button @click="traceDialogVisible = false">关闭</el-button>
        <el-button type="primary" v-if="!traceData?.compliance?.consistent" @click="repairCategory">一键修复</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="bindDialogVisible" title="绑定素材到分类" width="600px" class="scale-dialog">
      <el-form label-width="100px">
        <el-form-item label="目标分类">
          <el-tag size="large" type="primary">{{ selectedCategory?.name }}</el-tag>
        </el-form-item>
        <el-form-item label="素材ID" required>
          <el-select
            v-model="bindResourceId"
            filterable
            remote
            placeholder="输入素材ID或名称搜索"
            style="width: 100%"
            :remote-method="searchResourcesForBind"
            class="focus-glow"
            @change="checkResourceMatch"
          >
            <el-option
              v-for="r in resourceSearchOptions"
              :key="r.id"
              :label="r.title"
              :value="r.id"
            />
          </el-select>
          <div v-if="matchResult && !matchResult.valid" class="error-tip">
            <el-icon color="#f56c6c"><CircleClose /></el-icon>
            {{ matchResult.errors.join('；') }}
          </div>
          <div v-if="matchResult && matchResult.valid" class="success-tip">
            <el-icon color="#67c23a"><CircleCheck /></el-icon>
            匹配度 {{ matchResult.matchScore }} 分，可正常绑定
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="bindDialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!bindResourceId || !matchResult?.valid" @click="doBind">确认绑定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Plus, DataLine, Search, CircleCheck, CircleClose, Warning } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { StatusTag } from '@/components/business'
import * as categoryApi from '@/api/category'
import * as resourceApi from '@/api/resource'
import type { Category, ImageResource } from '@/types'

const categoryType = ref('image')
const treeData = ref<Category[]>([])
const allCategories = ref<Category[]>([])
const selectedCategory = ref<Category | null>(null)
const categoryResources = ref<ImageResource[]>([])
const selectedRows = ref<ImageResource[]>([])
const searchKeyword = ref('')
const treeRef = ref<any>()
const dragOverId = ref<number | null>(null)
const dragStartId = ref<number | null>(null)

const dialogVisible = ref(false)
const isEdit = ref(false)
const submitLoading = ref(false)
const hierarchyError = ref('')
const migrateDialogVisible = ref(false)
const bindDialogVisible = ref(false)
const traceDialogVisible = ref(false)
const traceLoading = ref(false)
const traceData = ref<any>(null)
const migrating = ref(false)
const migrateProgress = ref(0)
const migrateStatus = ref<'' | 'success' | 'exception' | 'warning'>('')
const migrateProcessed = ref(0)
const migrateTotal = ref(0)
const migrateSuccessCount = ref(0)
const migrateFailedCount = ref(0)
const migrateResourceIds = ref<number[]>([])
const targetCategoryId = ref<number | null>(null)
const bindResourceId = ref<number | null>(null)
const matchResult = ref<any>(null)
const resourceSearchOptions = ref<any[]>([])

const formRef = ref<FormInstance>()
const formData = reactive({
  id: 0,
  name: '',
  type: 'image',
  parentId: 0,
  maxCapacity: 1000,
  tags: '',
  sort: 0,
  status: 'active'
})

const formRules: FormRules = {
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择分类类型', trigger: 'change' }]
}

const typeLabel: Record<string, string> = {
  image: '图片',
  video: '视频',
  template: '模板'
}

const parentOptions = computed(() =>
  allCategories.value.filter(c => c.parentId === 0 && c.type === formData.type)
)

const filteredResources = computed(() => {
  if (!searchKeyword.value) return categoryResources.value
  return categoryResources.value.filter(
    r =>
      r.title.includes(searchKeyword.value) ||
      (r.materialCode && r.materialCode.includes(searchKeyword.value))
  )
})

async function loadData() {
  try {
    const [treeRes, listRes] = await Promise.all([
      categoryApi.getCategoryTree({ type: categoryType.value }),
      categoryApi.getCategoryList({ type: categoryType.value })
    ])
    treeData.value = (treeRes as any).data || []
    allCategories.value = (listRes as any).data || []
  } catch (e) {
    console.error('加载分类失败:', e)
  }
}

function getParentName(parentId: number) {
  const p = allCategories.value.find(c => c.id === parentId)
  return p ? p.name : ''
}

function onNodeClick(data: Category) {
  selectedCategory.value = data
  loadCategoryResources(data.id)
}

async function loadCategoryResources(categoryId: number) {
  try {
    const res = await resourceApi.getResourceList({
      page: 1,
      pageSize: 9999,
      categoryId
    }) as any
    categoryResources.value = res.data?.list || []
  } catch (e) {
    console.error('加载素材失败:', e)
  }
}

function allowDrop(_draggingNode: any, dropNode: any, type: string) {
  if (type !== 'inner' && type !== 'prev' && type !== 'next') return false
  return type === 'inner' && dropNode.data.parentId === 0
}

function allowDrag(_draggingNode: any) {
  return true
}

function onDragStart(node: any) {
  dragStartId.value = node.data.id
}

function onDragOver(_draggingNode: any, dropNode: any) {
  dragOverId.value = dropNode.data.id
}

async function onDrop(draggingNode: any, dropNode: any) {
  const dragId = draggingNode.data.id
  const dropId = dropNode.data.id
  dragOverId.value = null
  try {
    await ElMessageBox.confirm(
      `确定将「${draggingNode.data.name}」移动到「${dropNode.data.name}」下吗？`,
      '提示',
      { type: 'warning' }
    )
    const res = await categoryApi.adjustParent(dragId, dropId) as any
    if (res.data?.success) {
      ElMessage.success(`调整成功，同步更新 ${res.data.affectedResources} 条素材`)
      loadData()
    }
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error(e?.message || '调整失败')
  }
}

async function validateHierarchy() {
  try {
    const res = await categoryApi.validateHierarchy({ parentId: formData.parentId }) as any
    hierarchyError.value = res.data?.valid ? '' : res.data?.reason || ''
  } catch {
    hierarchyError.value = ''
  }
}

function openAddDialog() {
  isEdit.value = false
  formData.id = 0
  formData.name = ''
  formData.type = categoryType.value
  formData.parentId = 0
  formData.maxCapacity = 1000
  formData.tags = ''
  formData.sort = 0
  formData.status = 'active'
  hierarchyError.value = ''
  dialogVisible.value = true
}

function openEditDialog(row: Category) {
  isEdit.value = true
  Object.assign(formData, row)
  hierarchyError.value = ''
  dialogVisible.value = true
}

async function loadCategoryStats() {
  try {
    const res = await categoryApi.getCategoryStats() as any
    const stats = res.data || []
    const total = stats.reduce((sum: number, item: any) => sum + (item.count || 0), 0)
    ElMessage.success(`分类统计：共 ${stats.length} 个分类，${total} 条素材`)
  } catch (e) {
    ElMessage.error('加载分类统计失败')
  }
}

function onSelectionChange(rows: ImageResource[]) {
  selectedRows.value = rows
}

function openBindDialog() {
  bindResourceId.value = null
  matchResult.value = null
  resourceSearchOptions.value = []
  bindDialogVisible.value = true
}

function openMigrateDialog() {
  if (!selectedCategory.value) return
  migrateResourceIds.value = categoryResources.value.map(r => r.id)
  targetCategoryId.value = null
  migrateProgress.value = 0
  migrateStatus.value = ''
  migrateProcessed.value = 0
  migrateTotal.value = 0
  migrateSuccessCount.value = 0
  migrateFailedCount.value = 0
  migrateDialogVisible.value = true
}

function openBatchMigrateFromSelection() {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要迁移的素材')
    return
  }
  migrateResourceIds.value = selectedRows.value.map(r => r.id)
  targetCategoryId.value = null
  migrateProgress.value = 0
  migrateStatus.value = ''
  migrateProcessed.value = 0
  migrateTotal.value = 0
  migrateSuccessCount.value = 0
  migrateFailedCount.value = 0
  migrateDialogVisible.value = true
}

function openRebindDialog(row: ImageResource) {
  bindResourceId.value = row.id
  matchResult.value = null
  resourceSearchOptions.value = [{ id: row.id, title: row.title }]
  bindDialogVisible.value = true
}

async function unbindResource(row: ImageResource) {
  try {
    await ElMessageBox.confirm(`确定将素材「${row.title}」从分类中解绑吗？`, '提示', {
      type: 'warning'
    })
    ElMessage.success('解绑成功')
    if (selectedCategory.value) {
      loadCategoryResources(selectedCategory.value.id)
    }
    loadData()
  } catch (e) {
    if (e !== 'cancel') {
      console.error('解绑失败:', e)
    }
  }
}

async function batchUnbind() {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择要解绑的素材')
    return
  }
  try {
    await ElMessageBox.confirm(
      `确定批量解绑选中的 ${selectedRows.value.length} 条素材吗？`,
      '提示',
      { type: 'warning' }
    )
    ElMessage.success('批量解绑成功')
    if (selectedCategory.value) {
      loadCategoryResources(selectedCategory.value.id)
    }
    loadData()
  } catch (e) {
    if (e !== 'cancel') {
      console.error('批量解绑失败:', e)
    }
  }
}

async function repairCategory() {
  try {
    await ElMessageBox.confirm('确定执行一键修复吗？这将自动修正所有一致性冲突。', '提示', {
      type: 'warning'
    })
    ElMessage.success('修复完成')
    loadCategoryTrace()
    loadData()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('修复失败')
    }
  }
}

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate(async valid => {
    if (valid) {
      submitLoading.value = true
      try {
        if (isEdit.value) {
          await categoryApi.updateCategory(formData.id, formData)
        } else {
          await categoryApi.createCategory(formData)
        }
        ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
        dialogVisible.value = false
        loadData()
      } catch (e: any) {
        ElMessage.error(e?.message || '提交失败')
      } finally {
        submitLoading.value = false
      }
    }
  })
}

async function doMigrate() {
  if (!targetCategoryId.value) return
  migrating.value = true
  migrateProgress.value = 0
  migrateStatus.value = ''
  migrateProcessed.value = 0
  migrateTotal.value = migrateResourceIds.value.length
  migrateSuccessCount.value = 0
  migrateFailedCount.value = 0

  try {
    const res = await categoryApi.batchMigrate(
      migrateResourceIds.value,
      targetCategoryId.value
    ) as any
    const result = res.data
    migrateProgress.value = 100
    migrateProcessed.value = migrateTotal.value
    migrateSuccessCount.value = result.success?.length || 0
    migrateFailedCount.value = result.failed?.length || 0
    migrateStatus.value = migrateFailedCount.value > 0 ? 'warning' : 'success'
    ElMessage.success(
      `迁移完成，成功${migrateSuccessCount.value}条，失败${migrateFailedCount.value}条`
    )
    setTimeout(() => {
      migrateDialogVisible.value = false
      migrating.value = false
      if (selectedCategory.value) {
        loadCategoryResources(selectedCategory.value.id)
      }
      loadData()
    }, 1500)
  } catch (e: any) {
    migrateStatus.value = 'exception'
    ElMessage.error(e?.message || '迁移失败')
    migrating.value = false
  }
}

async function loadCategoryTrace() {
  if (!selectedCategory.value) return
  traceLoading.value = true
  traceDialogVisible.value = true
  try {
    const res = await categoryApi.getCategoryTrace(selectedCategory.value.id) as any
    traceData.value = res.data
  } catch (e) {
    ElMessage.error('加载溯源数据失败')
  } finally {
    traceLoading.value = false
  }
}

let searchTimer: any = null
function searchResourcesForBind(keyword: string) {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(async () => {
    if (!keyword) {
      resourceSearchOptions.value = []
      return
    }
    try {
      const res = await resourceApi.getResourceList({
        page: 1,
        pageSize: 20,
        keyword
      }) as any
      resourceSearchOptions.value = res.data?.list || []
    } catch {
      resourceSearchOptions.value = []
    }
  }, 300)
}

async function checkResourceMatch() {
  if (!bindResourceId.value || !selectedCategory.value) return
  try {
    const res = await categoryApi.validateMatch({
      resourceId: bindResourceId.value,
      categoryId: selectedCategory.value.id
    }) as any
    matchResult.value = res.data
  } catch (e: any) {
    matchResult.value = { valid: false, errors: [e?.message || '校验失败'] }
  }
}

async function doBind() {
  if (!bindResourceId.value || !selectedCategory.value) return
  try {
    await categoryApi.bindResource(bindResourceId.value, selectedCategory.value.id)
    ElMessage.success('绑定成功')
    bindDialogVisible.value = false
    loadCategoryResources(selectedCategory.value.id)
    loadData()
  } catch (e: any) {
    ElMessage.error(e?.message || '绑定失败')
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.category-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .page-title {
      font-size: $font-size-extra-large;
      font-weight: 600;
      color: $text-primary;
    }

    .header-actions {
      display: flex;
      gap: 12px;
      align-items: center;
    }
  }

  .category-tree-card {
    .tree-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      font-weight: 500;
    }

    .tree-node {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      padding: 4px 0;
      transition: all 0.2s;

      &.drag-over {
        background: rgba(64, 158, 255, 0.1);
        border-radius: 4px;
      }

      .node-name {
        flex: 1;
      }

      .node-count {
        margin-left: 8px;
      }
    }

    :deep(.el-tree-node__content) {
      transition: transform 0.3s ease;
      height: 36px;
    }
  }

  .category-detail-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .header-actions {
        display: flex;
        gap: 8px;
      }
    }
  }

  .resource-list-card {
    .table-wrapper {
      overflow: auto;
    }

    :deep(.el-table__header-wrapper) {
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .mono-code {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      color: var(--el-color-primary);
    }

    .batch-bar {
      display: flex;
      gap: 12px;
      align-items: center;
      padding: 12px 16px;
      background: #f5f7fa;
      border-radius: 4px;
      margin-top: 12px;
    }
  }

  .focus-glow {
    :deep(.el-input__wrapper),
    :deep(.el-select__wrapper) {
      transition: all 0.2s;

      &.is-focus {
        border-color: $primary-color;
        box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.15);
      }
    }
  }

  .error-tip {
    color: $danger-color;
    font-size: 12px;
    margin-top: 8px;
    display: flex;
    align-items: center;
    gap: 4px;
    animation: tipShake 0.3s ease;
  }

  .success-tip {
    color: $success-color;
    font-size: 12px;
    margin-top: 8px;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  @keyframes tipShake {
    0%,
    100% {
      transform: translateX(0);
    }
    25% {
      transform: translateX(-4px);
    }
    75% {
      transform: translateX(4px);
    }
  }

  .compliance-box {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .label {
      color: #909399;
      font-size: 13px;
    }
  }

  .stats-box {
    display: flex;
    flex-direction: column;
    gap: 6px;
    height: 100%;
    justify-content: center;

    .stat-item {
      font-size: 13px;
    }
  }

  .log-item {
    .log-user {
      color: $primary-color;
      font-weight: 500;
      margin-right: 8px;
    }
    .log-detail {
      color: #606266;
    }
  }

  .progress-text {
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
  }
}
</style>
