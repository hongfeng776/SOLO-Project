<template>
  <div class="resources-page">
    <div class="page-header">
      <h2 class="page-title">素材资源管理</h2>
    </div>

    <div class="filter-card card-wrapper">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="关键词">
          <el-input
            v-model="filterForm.keyword"
            placeholder="资源标题/描述"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="全部" clearable style="width: 140px">
            <el-option
              v-for="item in statusOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="filterForm.categoryId" placeholder="全部" clearable style="width: 140px">
            <el-option
              v-for="item in categories"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="素材编码">
          <el-input
            v-model="filterForm.materialCode"
            placeholder="素材编码"
            clearable
            style="width: 160px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-card">
      <div class="table-toolbar">
        <div class="toolbar-left">
          <el-button type="primary" :icon="Plus" @click="handleOpenCreate">新增素材</el-button>
          <el-button :icon="Upload" @click="handleUpload">上传资源</el-button>
          <el-dropdown class="dropdown-hover-shadow" trigger="click" @command="handleBatchCommand">
            <el-button :disabled="selectedRows.length === 0">
              批量操作<el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="weight">批量修改权重</el-dropdown-item>
                <el-dropdown-item command="online">批量上架</el-dropdown-item>
                <el-dropdown-item command="offline">批量下架</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button :icon="Search" @click="handleOpenTrace">溯源查询</el-button>
        </div>
      </div>

      <BatchOperation :selected-count="selectedRows.length" @clear="handleClearSelection">
        <el-button size="small" type="danger" @click="handleBatchDelete">批量删除</el-button>
      </BatchOperation>

      <DataTable
        :data="tableData"
        :loading="loading"
        :total="total"
        v-model:page="page"
        v-model:page-size="pageSize"
        show-selection
        @selection-change="handleSelectionChange"
        @refresh="fetchList"
        :row-class-name="rowClassName"
      >
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column prop="materialCode" label="素材编码" width="140" align="center" show-overflow-tooltip />
        <el-table-column prop="title" label="标题" min-width="180" show-overflow-tooltip />
        <el-table-column label="封面" width="90" align="center">
          <template #default="{ row }">
            <el-image
              :src="row.coverUrl"
              :preview-src-list="[row.fileUrl || row.coverUrl]"
              fit="cover"
              style="width: 56px; height: 56px; border-radius: 4px; cursor: pointer"
            />
          </template>
        </el-table-column>
        <el-table-column prop="fileType" label="类型" width="80" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ fileTypeLabel[row.fileType] || row.fileType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="resolution" label="分辨率" width="110" align="center" show-overflow-tooltip>
          <template #default="{ row }">
            <span>{{ row.resolution || (row.width && row.height ? `${row.width}×${row.height}` : '-') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <StatusTag :status="row.status" type="resource" />
          </template>
        </el-table-column>
        <el-table-column prop="sortWeight" label="权重" width="70" align="center" />
        <el-table-column prop="categoryName" label="分类" width="100" align="center" />
        <el-table-column prop="source" label="来源" width="100" align="center" show-overflow-tooltip />
        <el-table-column prop="createdAt" label="创建时间" width="160" align="center">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="160" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" class="btn-hover-scale" @click="handleOpenEdit(row, $event)">编辑</el-button>
            <el-button link type="primary" @click="handlePreview(row)">预览</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
            <el-tag
              v-if="batchFailedMap[row.id]"
              type="danger"
              size="small"
              class="failed-tag"
            >
              {{ batchFailedMap[row.id] }}
            </el-tag>
          </template>
        </el-table-column>
      </DataTable>
    </div>

    <ResourcePreview
      v-model:visible="previewVisible"
      :resource="currentResource"
      @download="handleDownload"
    />

    <FileUpload
      v-model:visible="uploadVisible"
      :multiple="true"
      :limit="10"
      file-type="all"
      drag
      @success="handleUploadSuccess"
    />

    <el-dialog
      v-model="createDialogVisible"
      title="素材录入"
      width="700px"
      :close-on-click-modal="false"
      :class="{ shake: createDialogShaking }"
    >
      <div v-if="validateErrors.length > 0" class="validate-error-area">
        <el-alert
          v-for="(err, idx) in validateErrors"
          :key="idx"
          :title="err"
          type="error"
          :closable="false"
          show-icon
          style="margin-bottom: 8px"
        />
      </div>

      <el-form
        ref="createFormRef"
        :model="createForm"
        :rules="createRules"
        label-width="100px"
        class="create-form"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="标题" prop="title">
              <el-input
                v-model="createForm.title"
                placeholder="请输入素材标题"
                :class="{ shake: titleDuplicate }"
                @input="handleTitleInput"
              />
              <div v-if="titleDuplicate" class="duplicate-hint">该标题已存在，请修改后重试</div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="分类" prop="categoryId">
              <el-select v-model="createForm.categoryId" placeholder="请选择分类" style="width: 100%">
                <el-option
                  v-for="item in categories"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="来源">
              <el-input v-model="createForm.source" placeholder="请输入来源" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="文件类型">
              <el-select v-model="createForm.fileType" placeholder="请选择" style="width: 100%">
                <el-option label="图片" value="image" />
                <el-option label="视频" value="video" />
                <el-option label="音频" value="audio" />
                <el-option label="模板" value="template" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="文件URL">
              <el-input v-model="createForm.fileUrl" placeholder="请输入文件URL" class="upload-focus-glow" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="宽度">
              <el-input-number v-model="createForm.width" :min="0" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="高度">
              <el-input-number v-model="createForm.height" :min="0" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="文件大小">
              <el-input-number v-model="createForm.fileSize" :min="0" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="备注">
              <el-input v-model="createForm.remark" placeholder="请输入备注" type="textarea" :rows="2" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="展示权重">
              <el-input-number v-model="createForm.sortWeight" :min="0" :max="9999" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="标签">
          <el-select
            v-model="createForm.tags"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="输入标签后回车"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="createSubmitting" @click="handleSubmitCreate">确认录入</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="editDialogVisible"
      title="编辑素材"
      width="700px"
      :close-on-click-modal="false"
    >
      <el-alert
        v-if="isApprovedOrPublished"
        title="当前资源已审核，核心参数不可修改"
        type="warning"
        :closable="false"
        show-icon
        style="margin-bottom: 16px"
      />

      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="editRules"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="标题" prop="title">
              <el-input
                v-model="editForm.title"
                :disabled="isApprovedOrPublished"
                :class="{ 'field-readonly': isApprovedOrPublished }"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="分类" prop="categoryId">
              <el-select
                v-model="editForm.categoryId"
                :disabled="isApprovedOrPublished"
                style="width: 100%"
                :class="{ 'field-readonly': isApprovedOrPublished }"
              >
                <el-option
                  v-for="item in categories"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="文件类型">
              <el-select
                v-model="editForm.fileType"
                :disabled="isApprovedOrPublished"
                style="width: 100%"
                :class="{ 'field-readonly': isApprovedOrPublished }"
              >
                <el-option label="图片" value="image" />
                <el-option label="视频" value="video" />
                <el-option label="音频" value="audio" />
                <el-option label="模板" value="template" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="文件URL">
              <el-input
                v-model="editForm.fileUrl"
                :disabled="isApprovedOrPublished"
                :class="{ 'field-readonly': isApprovedOrPublished }"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="宽度">
              <el-input-number
                v-model="editForm.width"
                :disabled="isApprovedOrPublished"
                :min="0"
                controls-position="right"
                style="width: 100%"
                :class="{ 'field-readonly': isApprovedOrPublished }"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="高度">
              <el-input-number
                v-model="editForm.height"
                :disabled="isApprovedOrPublished"
                :min="0"
                controls-position="right"
                style="width: 100%"
                :class="{ 'field-readonly': isApprovedOrPublished }"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="时长">
              <el-input-number
                v-model="editForm.duration"
                :disabled="isApprovedOrPublished"
                :min="0"
                controls-position="right"
                style="width: 100%"
                :class="{ 'field-readonly': isApprovedOrPublished }"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="展示权重">
              <el-input-number v-model="editForm.sortWeight" :min="0" :max="9999" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="来源">
              <el-input v-model="editForm.source" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="描述">
          <el-input v-model="editForm.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="editForm.remark" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="标签">
          <el-select
            v-model="editForm.tags"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="输入标签后回车"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="editSubmitting" @click="handleSubmitEdit">确认修改</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="batchWeightDialogVisible"
      title="批量修改权重"
      width="400px"
      :close-on-click-modal="false"
    >
      <el-form label-width="80px">
        <el-form-item label="新权重值">
          <el-input-number v-model="batchWeightValue" :min="0" :max="9999" controls-position="right" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchWeightDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="batchWeightSubmitting" @click="handleBatchWeight">确认</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="traceDialogVisible"
      title="数据溯源"
      width="900px"
      :close-on-click-modal="false"
    >
      <div class="trace-search-bar">
        <el-input
          v-model="traceKeyword"
          placeholder="输入素材编码或名称"
          clearable
          style="width: 320px"
          @keyup.enter="handleTrace"
        />
        <el-button type="primary" :loading="traceLoading" @click="handleTrace">查询</el-button>
      </div>

      <el-progress
        v-if="traceLoading"
        :percentage="loadingProgress"
        :stroke-width="4"
        style="margin-bottom: 16px"
      />

      <div v-if="traceResult" class="trace-result">
        <div class="trace-section">
          <h4 class="trace-section-title">基础信息</h4>
          <el-descriptions :column="3" border size="small">
            <el-descriptions-item label="素材编码">{{ traceResult.resource.materialCode || '-' }}</el-descriptions-item>
            <el-descriptions-item label="标题">{{ traceResult.resource.title }}</el-descriptions-item>
            <el-descriptions-item label="类型">{{ fileTypeLabel[traceResult.resource.fileType] || '-' }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <StatusTag :status="traceResult.resource.status" type="resource" />
            </el-descriptions-item>
            <el-descriptions-item label="分类">{{ traceResult.resource.categoryName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="来源">{{ traceResult.resource.source || '-' }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="trace-section">
          <h4 class="trace-section-title">编辑记录</h4>
          <el-timeline v-if="traceResult.editLogs.length > 0">
            <el-timeline-item
              v-for="log in traceResult.editLogs"
              :key="log.id"
              :timestamp="formatDate(log.createdAt)"
              placement="top"
            >
              <el-card shadow="never" class="timeline-card">
                <p>{{ log.username }} - {{ log.action }}</p>
                <el-tooltip v-if="log.detail && log.detail.length > 60" :content="log.detail" placement="top">
                  <p class="detail-text">{{ log.detail }}</p>
                </el-tooltip>
                <p v-else class="detail-text">{{ log.detail || '-' }}</p>
              </el-card>
            </el-timeline-item>
          </el-timeline>
          <el-empty v-else description="暂无编辑记录" :image-size="60" />
        </div>

        <div class="trace-section">
          <h4 class="trace-section-title">审核记录</h4>
          <el-table v-if="traceResult.auditRecords.length > 0" :data="traceResult.auditRecords" border size="small">
            <el-table-column prop="auditorName" label="审核人" width="100" />
            <el-table-column prop="auditLevel" label="审核级别" width="100">
              <template #default="{ row }">第{{ row.auditLevel }}级</template>
            </el-table-column>
            <el-table-column prop="auditResult" label="审核结果" width="100" />
            <el-table-column prop="auditOpinion" label="审核意见" min-width="160">
              <template #default="{ row }">
                <el-tooltip v-if="row.auditOpinion && row.auditOpinion.length > 40" :content="row.auditOpinion" placement="top">
                  <span>{{ row.auditOpinion }}</span>
                </el-tooltip>
                <span v-else>{{ row.auditOpinion || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="auditTime" label="审核时间" width="160">
              <template #default="{ row }">{{ formatDate(row.auditTime) }}</template>
            </el-table-column>
          </el-table>
          <el-empty v-else description="暂无审核记录" :image-size="60" />
        </div>

        <div class="trace-section">
          <h4 class="trace-section-title">违规记录</h4>
          <el-table v-if="traceResult.violations.length > 0" :data="traceResult.violations" border size="small">
            <el-table-column prop="violationType" label="违规类型" width="100" />
            <el-table-column prop="violationLevel" label="违规级别" width="100" />
            <el-table-column prop="description" label="描述" min-width="160">
              <template #default="{ row }">
                <el-tooltip v-if="row.description && row.description.length > 40" :content="row.description" placement="top">
                  <span>{{ row.description }}</span>
                </el-tooltip>
                <span v-else>{{ row.description || '-' }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="action" label="处置" width="100" />
            <el-table-column prop="status" label="状态" width="80" />
          </el-table>
          <el-empty v-else description="暂无违规记录" :image-size="60" />
        </div>

        <div class="trace-section">
          <h4 class="trace-section-title">一致性校验</h4>
          <div v-if="traceResult.consistencyCheck.consistent" class="consistency-pass">
            <el-icon color="#67c23a"><CircleCheckFilled /></el-icon>
            <span>数据一致性校验通过</span>
          </div>
          <div v-else class="consistency-fail">
            <div class="consistency-fail-header">
              <el-icon color="#f56c6c"><CircleCloseFilled /></el-icon>
              <span>数据一致性校验未通过</span>
            </div>
            <div
              v-for="(conflict, idx) in traceResult.consistencyCheck.conflicts"
              :key="idx"
              class="conflict-item"
            >
              <span class="conflict-field">{{ conflict.field }}:</span>
              <span class="conflict-values">期望值 {{ conflict.expected }} → 实际值 {{ conflict.actual }}</span>
              <span class="conflict-desc">{{ conflict.description }}</span>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { Search, Refresh, Plus, Upload, ArrowDown, CircleCheckFilled, CircleCloseFilled } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { DataTable, StatusTag, BatchOperation, ResourcePreview, FileUpload } from '@/components/business'
import { ResourceStatusLabel, FileTypeLabel, ResourceStatus } from '@/constants'
import {
  getResourceList,
  batchDeleteResource,
  validateCreate,
  createWithValidation,
  updateWithConstraint,
  batchUpdateWeight,
  batchToggleStatus,
  traceMaterial
} from '@/api/resource'
import type { ImageResource, ValidateResult, TraceResult } from '@/types'

const loading = ref(false)
const tableData = ref<ImageResource[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const selectedRows = ref<ImageResource[]>([])
const batchFailedMap = ref<Record<number, string>>({})

const filterForm = reactive({
  keyword: '',
  status: '',
  categoryId: undefined as number | undefined,
  materialCode: ''
})

const previewVisible = ref(false)
const uploadVisible = ref(false)
const currentResource = ref<ImageResource | null>(null)

const categories = ref<any[]>([])

const statusOptions = Object.entries(ResourceStatusLabel).map(([value, label]) => ({
  value,
  label
}))

const fileTypeLabel = FileTypeLabel as Record<string, string>

const fetchList = async () => {
  loading.value = true
  try {
    const res = await getResourceList({
      page: page.value,
      pageSize: pageSize.value,
      keyword: filterForm.keyword || undefined,
      status: filterForm.status || undefined,
      categoryId: filterForm.categoryId,
      materialCode: filterForm.materialCode || undefined
    })
    tableData.value = res.data.list
    total.value = res.data.total
  } catch (error) {
    console.error('获取资源列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  page.value = 1
  fetchList()
}

const handleReset = () => {
  filterForm.keyword = ''
  filterForm.status = ''
  filterForm.categoryId = undefined
  filterForm.materialCode = ''
  page.value = 1
  fetchList()
}

const handleSelectionChange = (selection: ImageResource[]) => {
  selectedRows.value = selection
}

const handleClearSelection = () => {
  selectedRows.value = []
}

const rowClassName = ({ row }: { row: ImageResource }) => {
  return selectedRows.value.some((s) => s.id === row.id) ? 'row-highlight' : ''
}

const handleUpload = () => {
  uploadVisible.value = true
}

const handleUploadSuccess = () => {
  ElMessage.success('上传成功')
  uploadVisible.value = false
  fetchList()
}

const handlePreview = (row: ImageResource) => {
  currentResource.value = row
  previewVisible.value = true
}

const handleDownload = (resource: ImageResource) => {
  console.log('下载资源:', resource)
}

const handleDelete = async (row: ImageResource) => {
  try {
    await ElMessageBox.confirm(`确定要删除资源「${row.title}」吗？`, '提示', { type: 'warning' })
    const { deleteResource } = await import('@/api/resource')
    await deleteResource(row.id)
    ElMessage.success('删除成功')
    fetchList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
    }
  }
}

const handleBatchDelete = async () => {
  if (selectedRows.value.length === 0) return
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedRows.value.length} 个资源吗？`,
      '提示',
      { type: 'warning' }
    )
    const ids = selectedRows.value.map((item) => item.id)
    await batchDeleteResource(ids)
    ElMessage.success('批量删除成功')
    fetchList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除失败:', error)
    }
  }
}

const formatDate = (date: string) => {
  if (!date) return '-'
  return date.replace('T', ' ').substring(0, 16)
}

const refreshRows = (ids: number[]) => {
  const res = getResourceList({ page: page.value, pageSize: pageSize.value })
  res.then((result) => {
    const updatedMap = new Map(result.data.list.map((r) => [r.id, r]))
    tableData.value = tableData.value.map((row) => {
      if (ids.includes(row.id) && updatedMap.has(row.id)) {
        return updatedMap.get(row.id)!
      }
      return row
    })
  })
}

const createDialogVisible = ref(false)
const createDialogShaking = ref(false)
const createSubmitting = ref(false)
const createFormRef = ref<FormInstance>()
const validateErrors = ref<string[]>([])
const titleDuplicate = ref(false)
let titleDebounceTimer: ReturnType<typeof setTimeout> | null = null

const createForm = reactive({
  title: '',
  categoryId: undefined as number | undefined,
  source: '',
  fileType: 'image',
  fileUrl: '',
  width: 0,
  height: 0,
  fileSize: 0,
  remark: '',
  sortWeight: 0,
  tags: [] as string[]
})

const createRules: FormRules = {
  title: [{ required: true, message: '请输入素材标题', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }]
}

const handleOpenCreate = () => {
  Object.assign(createForm, {
    title: '',
    categoryId: undefined,
    source: '',
    fileType: 'image',
    fileUrl: '',
    width: 0,
    height: 0,
    fileSize: 0,
    remark: '',
    sortWeight: 0,
    tags: []
  })
  validateErrors.value = []
  titleDuplicate.value = false
  createDialogVisible.value = true
}

const handleTitleInput = () => {
  if (titleDebounceTimer) clearTimeout(titleDebounceTimer)
  titleDebounceTimer = setTimeout(async () => {
    if (!createForm.title) {
      titleDuplicate.value = false
      return
    }
    try {
      const res = await validateCreate({ title: createForm.title })
      const result: ValidateResult = res.data
      if (result.duplicate) {
        titleDuplicate.value = true
        createDialogShaking.value = true
        setTimeout(() => { createDialogShaking.value = false }, 300)
      } else {
        titleDuplicate.value = false
      }
    } catch {
      titleDuplicate.value = false
    }
  }, 300)
}

const handleSubmitCreate = async () => {
  if (!createFormRef.value) return
  await createFormRef.value.validate()

  createSubmitting.value = true
  try {
    const validateRes = await validateCreate(createForm)
    const result: ValidateResult = validateRes.data
    if (!result.valid) {
      validateErrors.value = result.errors
      createDialogShaking.value = true
      setTimeout(() => { createDialogShaking.value = false }, 300)
      return
    }
    validateErrors.value = []

    await createWithValidation(createForm)
    ElMessage.success('素材录入成功')
    createDialogVisible.value = false
    fetchList()
  } catch (error) {
    console.error('素材录入失败:', error)
  } finally {
    createSubmitting.value = false
  }
}

const editDialogVisible = ref(false)
const editSubmitting = ref(false)
const editFormRef = ref<FormInstance>()
const editingResourceId = ref<number>(0)
const editingResourceStatus = ref('')

const editForm = reactive({
  title: '',
  categoryId: undefined as number | undefined,
  fileType: 'image',
  fileUrl: '',
  width: 0,
  height: 0,
  duration: 0,
  sortWeight: 0,
  source: '',
  description: '',
  remark: '',
  tags: [] as string[]
})

const editRules: FormRules = {
  title: [{ required: true, message: '请输入素材标题', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }]
}

const isApprovedOrPublished = computed(() => {
  return editingResourceStatus.value === ResourceStatus.APPROVED ||
    editingResourceStatus.value === ResourceStatus.PUBLISHED
})

const handleOpenEdit = (row: ImageResource, event: MouseEvent) => {
  const target = event.currentTarget as HTMLElement
  target.classList.add('ripple')
  setTimeout(() => target.classList.remove('ripple'), 600)

  editingResourceId.value = row.id
  editingResourceStatus.value = row.status
  Object.assign(editForm, {
    title: row.title,
    categoryId: row.categoryId,
    fileType: row.fileType,
    fileUrl: row.fileUrl,
    width: row.width,
    height: row.height,
    duration: row.duration || 0,
    sortWeight: row.sortWeight,
    source: row.source,
    description: row.description,
    remark: row.remark,
    tags: [...(row.tags || [])]
  })
  editDialogVisible.value = true
}

const handleSubmitEdit = async () => {
  if (!editFormRef.value) return
  await editFormRef.value.validate()

  editSubmitting.value = true
  try {
    const data: Partial<ImageResource> = { ...editForm }
    if (isApprovedOrPublished.value) {
      delete (data as any).title
      delete (data as any).fileUrl
      delete (data as any).fileType
      delete (data as any).width
      delete (data as any).height
      delete (data as any).duration
      delete (data as any).categoryId
    }
    await updateWithConstraint(editingResourceId.value, data)
    ElMessage.success('修改成功')
    editDialogVisible.value = false
    refreshRows([editingResourceId.value])
  } catch (error) {
    console.error('修改失败:', error)
  } finally {
    editSubmitting.value = false
  }
}

const batchWeightDialogVisible = ref(false)
const batchWeightValue = ref(0)
const batchWeightSubmitting = ref(false)

const handleBatchCommand = (command: string) => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择素材')
    return
  }
  if (command === 'weight') {
    batchWeightValue.value = 0
    batchWeightDialogVisible.value = true
  } else if (command === 'online') {
    handleBatchToggle('published')
  } else if (command === 'offline') {
    handleBatchToggle('offline')
  }
}

const handleBatchWeight = async () => {
  const ids = selectedRows.value.map((item) => item.id)
  batchWeightSubmitting.value = true
  try {
    const res = await batchUpdateWeight(ids, batchWeightValue.value)
    const result = res.data
    processBatchResult(result, ids)
    batchWeightDialogVisible.value = false
  } catch (error) {
    console.error('批量修改权重失败:', error)
  } finally {
    batchWeightSubmitting.value = false
  }
}

const handleBatchToggle = async (targetStatus: string) => {
  const ids = selectedRows.value.map((item) => item.id)
  try {
    const res = await batchToggleStatus(ids, targetStatus)
    const result = res.data
    processBatchResult(result, ids)
  } catch (error) {
    console.error('批量启停失败:', error)
  }
}

const processBatchResult = (result: { successIds: number[]; failedItems: { id: number; reason: string }[]; updated: number }, ids: number[]) => {
  const newFailedMap: Record<number, string> = {}
  result.failedItems.forEach((item) => {
    newFailedMap[item.id] = item.reason
  })
  batchFailedMap.value = { ...batchFailedMap.value, ...newFailedMap }

  if (result.failedItems.length > 0) {
    ElMessage.warning(`${result.updated} 项操作成功，${result.failedItems.length} 项操作失败`)
  } else {
    ElMessage.success('批量操作成功')
  }

  refreshRows(ids)

  setTimeout(() => {
    const cleanIds = result.successIds
    cleanIds.forEach((id) => {
      delete batchFailedMap.value[id]
    })
  }, 5000)
}

const traceDialogVisible = ref(false)
const traceKeyword = ref('')
const traceLoading = ref(false)
const loadingProgress = ref(0)
const traceResult = ref<TraceResult | null>(null)
let progressTimer: ReturnType<typeof setInterval> | null = null

const handleOpenTrace = () => {
  traceKeyword.value = ''
  traceResult.value = null
  traceDialogVisible.value = true
}

const handleTrace = async () => {
  if (!traceKeyword.value.trim()) {
    ElMessage.warning('请输入素材编码或名称')
    return
  }

  traceLoading.value = true
  loadingProgress.value = 0
  traceResult.value = null

  progressTimer = setInterval(() => {
    if (loadingProgress.value < 90) {
      loadingProgress.value += Math.random() * 15
      if (loadingProgress.value > 90) loadingProgress.value = 90
    }
  }, 200)

  try {
    const res = await traceMaterial(traceKeyword.value.trim())
    traceResult.value = res.data
    loadingProgress.value = 100
  } catch (error) {
    console.error('溯源查询失败:', error)
    ElMessage.error('溯源查询失败')
  } finally {
    if (progressTimer) {
      clearInterval(progressTimer)
      progressTimer = null
    }
    traceLoading.value = false
  }
}

onMounted(() => {
  fetchList()
})

onUnmounted(() => {
  if (progressTimer) {
    clearInterval(progressTimer)
  }
  if (titleDebounceTimer) {
    clearTimeout(titleDebounceTimer)
  }
})
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-6px); }
  75% { transform: translateX(6px); }
}

@keyframes ripple-effect {
  0% {
    width: 0;
    height: 0;
    opacity: 0.5;
  }
  100% {
    width: 200px;
    height: 200px;
    opacity: 0;
  }
}

.resources-page {
  .page-header {
    margin-bottom: 16px;

    .page-title {
      font-size: $font-size-extra-large;
      font-weight: 600;
      color: $text-primary;
    }
  }

  .filter-card {
    margin-bottom: 16px;
  }

  .table-card {
    background: $bg-color-ffffff;
    border-radius: $border-radius-large;
    padding: 20px;

    .table-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;

      .toolbar-left {
        display: flex;
        gap: 8px;
        align-items: center;
      }
    }
  }
}

.btn-hover-scale:hover {
  transform: scale(1.05);
  transition: transform 0.2s;
}

.ripple {
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    animation: ripple-effect 0.6s ease-out;
  }
}

.dropdown-hover-shadow {
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transition: box-shadow 0.2s;
  }
}

.upload-focus-glow {
  &:focus-within {
    border-color: $primary-color;
    box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.2);
  }
}

.shake {
  animation: shake 0.3s;
}

.duplicate-hint {
  color: $danger-color;
  font-size: $font-size-extra-small;
  margin-top: 4px;
}

.validate-error-area {
  margin-bottom: 16px;
}

.field-readonly {
  :deep(.el-input__inner),
  :deep(.el-textarea__inner),
  :deep(.el-select) {
    background-color: #f5f7fa;
    color: $text-secondary;
  }
}

.failed-tag {
  margin-left: 4px;
  vertical-align: middle;
}

.trace-search-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.trace-result {
  .trace-section {
    margin-bottom: 24px;

    .trace-section-title {
      font-size: $font-size-medium;
      font-weight: 600;
      color: $text-primary;
      margin-bottom: 12px;
      padding-left: 10px;
      border-left: 3px solid $primary-color;
    }
  }

  .timeline-card {
    p {
      margin: 0;
      font-size: $font-size-base;
      color: $text-regular;
    }

    .detail-text {
      font-size: $font-size-extra-small;
      color: $text-secondary;
      margin-top: 4px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .consistency-pass {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    background: rgba($success-color, 0.06);
    border: 1px solid rgba($success-color, 0.2);
    border-radius: $border-radius;
    color: $success-color;
    font-size: $font-size-base;
  }

  .consistency-fail {
    .consistency-fail-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      color: $danger-color;
      font-size: $font-size-base;
    }

    .conflict-item {
      display: flex;
      align-items: baseline;
      gap: 8px;
      padding: 8px 12px;
      background: rgba($danger-color, 0.04);
      border-left: 3px solid $danger-color;
      margin-bottom: 6px;
      font-size: $font-size-small;

      .conflict-field {
        font-weight: 600;
        color: $danger-color;
        min-width: 80px;
      }

      .conflict-values {
        color: $text-primary;
      }

      .conflict-desc {
        color: $text-secondary;
      }
    }
  }
}

:deep(.row-highlight) {
  background-color: #ecf5ff !important;
}
</style>
