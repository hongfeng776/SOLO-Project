<template>
  <div class="filter-page">
    <div class="page-header">
      <h2 class="page-title">特效滤镜素材录入</h2>
    </div>

    <el-tabs v-model="activeTab" class="filter-tabs">
      <el-tab-pane label="滤镜录入" name="entry">
        <div class="filter-card card-wrapper">
          <div class="card-title">滤镜信息录入</div>
          <el-form
            ref="entryFormRef"
            :model="entryForm"
            :rules="entryRules"
            label-width="120px"
            class="entry-form"
            :class="{ 'form-shake': formShake }"
          >
            <el-row :gutter="24">
              <el-col :span="12">
                <el-form-item label="滤镜名称" prop="name">
                  <el-input
                    v-model="entryForm.name"
                    placeholder="请输入滤镜名称"
                    :class="{ 'input-error': fieldErrors.name }"
                    @focus="handleFieldFocus('name')"
                    @blur="handleFieldBlur('name')"
                  />
                  <div v-if="fieldErrors.name" class="field-error-tip">{{ fieldErrors.name }}</div>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="标签" prop="tags">
                  <el-select
                    v-model="entryForm.tags"
                    multiple
                    filterable
                    allow-create
                    placeholder="输入标签"
                    :class="{ 'input-error': fieldErrors.tags }"
                    @focus="handleFieldFocus('tags')"
                    @blur="handleFieldBlur('tags')"
                  >
                    <el-option v-for="tag in tagOptions" :key="tag" :label="tag" :value="tag" />
                  </el-select>
                  <div v-if="fieldErrors.tags" class="field-error-tip">{{ fieldErrors.tags }}</div>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="24">
              <el-col :span="12">
                <el-form-item label="适配机型" prop="adaptDevice">
                  <el-select
                    v-model="entryForm.adaptDevice"
                    multiple
                    filterable
                    allow-create
                    placeholder="输入适配机型"
                    :class="{ 'input-error': fieldErrors.adaptDevice }"
                    @focus="handleFieldFocus('adaptDevice')"
                    @blur="handleFieldBlur('adaptDevice')"
                  >
                    <el-option v-for="d in deviceOptions" :key="d" :label="d" :value="d" />
                  </el-select>
                  <div v-if="fieldErrors.adaptDevice" class="field-error-tip">{{ fieldErrors.adaptDevice }}</div>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="适配场景" prop="adaptScene">
                  <el-select
                    v-model="entryForm.adaptScene"
                    multiple
                    placeholder="选择适配场景"
                    :class="{ 'input-error': fieldErrors.adaptScene }"
                  >
                    <el-option
                      v-for="item in FILTER_ADAPT_SCENE_OPTIONS"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                  <div v-if="fieldErrors.adaptScene" class="field-error-tip">{{ fieldErrors.adaptScene }}</div>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="24">
              <el-col :span="12">
                <el-form-item label="文件格式" prop="fileFormat">
                  <el-select v-model="entryForm.fileFormat" placeholder="选择文件格式">
                    <el-option
                      v-for="item in FILTER_FILE_FORMAT_OPTIONS.filter(i => i.value)"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="分辨率" prop="resolution">
                  <el-select v-model="entryForm.resolution" placeholder="选择分辨率">
                    <el-option
                      v-for="item in FILTER_RESOLUTION_OPTIONS"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="24">
              <el-col :span="12">
                <el-form-item label="版权资质" prop="copyrightLicense">
                  <el-input
                    v-model="entryForm.copyrightLicense"
                    placeholder="请输入版权资质信息"
                    :class="{ 'input-error': fieldErrors.copyrightLicense }"
                  />
                  <div v-if="fieldErrors.copyrightLicense" class="field-error-tip">{{ fieldErrors.copyrightLicense }}</div>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="版权过期时间">
                  <el-date-picker
                    v-model="entryForm.copyrightExpiredAt"
                    type="date"
                    placeholder="选择版权过期时间"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="24">
              <el-col :span="12">
                <el-form-item label="特效文件" prop="fileUrl">
                  <div class="upload-area" :class="{ 'upload-focused': uploadFocused }">
                    <el-upload
                      :auto-upload="false"
                      :show-file-list="true"
                      :limit="1"
                      :on-change="handleFileChange"
                      :on-remove="handleFileRemove"
                      drag
                    >
                      <el-icon class="upload-icon"><UploadFilled /></el-icon>
                      <p class="upload-text">将特效文件拖到此处，或<em>点击上传</em></p>
                    </el-upload>
                  </div>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="分类">
                  <el-select v-model="entryForm.categoryId" placeholder="选择分类" clearable>
                    <el-option
                      v-for="cat in categoryList"
                      :key="cat.id"
                      :label="cat.name"
                      :value="cat.id"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item label="介绍文案">
              <el-input
                v-model="entryForm.description"
                type="textarea"
                :rows="3"
                placeholder="请输入介绍文案"
              />
            </el-form-item>

            <el-form-item label="备注">
              <el-input v-model="entryForm.remark" placeholder="请输入备注" />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="handleSubmitEntry" :loading="entryLoading">
                提交录入
              </el-button>
              <el-button @click="handleResetEntry">重置</el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-tab-pane>

      <el-tab-pane label="滤镜编辑" name="edit">
        <div class="filter-card card-wrapper">
          <div class="card-title">滤镜列表</div>
          <el-form :inline="true" :model="editFilterForm" class="filter-form">
            <el-form-item label="关键词">
              <el-input v-model="editFilterForm.keyword" placeholder="名称/描述" clearable style="width: 200px" />
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="editFilterForm.status" placeholder="全部" clearable style="width: 140px">
                <el-option v-for="item in FILTER_STATUS_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="Search" @click="fetchFilterList">搜索</el-button>
              <el-button :icon="Refresh" @click="handleResetEditFilter">重置</el-button>
            </el-form-item>
          </el-form>

          <DataTable
            :data="filterList"
            :loading="filterLoading"
            :total="filterTotal"
            v-model:page="filterPage"
            v-model:page-size="filterPageSize"
            @refresh="fetchFilterList"
          >
            <el-table-column prop="filterCode" label="滤镜编码" width="160" show-overflow-tooltip />
            <el-table-column prop="name" label="名称" min-width="160" show-overflow-tooltip />
            <el-table-column label="文件格式" width="110" align="center">
              <template #default="{ row }">
                {{ FilterFileFormatLabel[row.fileFormat] || row.fileFormat }}
              </template>
            </el-table-column>
            <el-table-column label="适配场景" width="120" align="center">
              <template #default="{ row }">
                <el-tooltip :content="(row.adaptScene || []).join('、')" placement="top" :show-after="300">
                  <span class="text-ellipsis">{{ (row.adaptScene || []).join('、') || '-' }}</span>
                </el-tooltip>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="FilterStatusTagType[row.status]" size="small">
                  {{ FilterStatusLabel[row.status] }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="sortWeight" label="权重" width="80" align="center" />
            <el-table-column prop="authorName" label="录入人" width="90" align="center" />
            <el-table-column label="创建时间" width="160" align="center">
              <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="220" align="center" fixed="right">
              <template #default="{ row }">
                <el-button
                  size="small"
                  type="primary"
                  link
                  class="ripple-btn"
                  @click="handleEditFilter(row)"
                >
                  编辑
                </el-button>
                <el-button
                  size="small"
                  type="info"
                  link
                  @click="handleViewEditLogs(row)"
                >
                  日志
                </el-button>
                <el-button
                  v-if="row.status === 'approved'"
                  size="small"
                  type="success"
                  link
                  @click="handlePublishFilter(row)"
                >
                  上架
                </el-button>
                <el-button
                  v-if="row.status === 'published'"
                  size="small"
                  type="warning"
                  link
                  @click="handleOfflineFilter(row)"
                >
                  下架
                </el-button>
              </template>
            </el-table-column>
          </DataTable>
        </div>
      </el-tab-pane>

      <el-tab-pane label="批量录入" name="batch">
        <div class="filter-card card-wrapper">
          <div class="card-title">批量滤镜素材录入</div>
          <div class="batch-upload-area">
            <el-upload
              :auto-upload="false"
              :show-file-list="false"
              :on-change="handleBatchFileChange"
              multiple
              drag
            >
              <el-icon class="upload-icon"><UploadFilled /></el-icon>
              <p class="upload-text">将多个滤镜素材文件拖到此处，或<em>点击上传</em></p>
            </el-upload>
          </div>

          <div v-if="batchProgress.active" class="batch-progress">
            <el-progress
              :percentage="batchProgress.percentage"
              :status="batchProgress.status"
              :stroke-width="20"
              :text-inside="true"
            />
            <p class="progress-text">{{ batchProgress.message }}</p>
          </div>

          <div v-if="batchItems.length > 0" class="batch-list">
            <div class="batch-list-header">
              <span>共 {{ batchItems.length }} 个素材</span>
              <el-button type="primary" size="small" @click="handleBatchSubmit" :loading="batchSubmitting">
                批量提交
              </el-button>
            </div>

            <el-table :data="batchItems" border size="small" class="batch-table">
              <el-table-column prop="name" label="名称" min-width="140">
                <template #default="{ row }">
                  <el-input v-model="row.name" placeholder="滤镜名称" size="small" />
                </template>
              </el-table-column>
              <el-table-column label="格式" width="120">
                <template #default="{ row }">
                  <el-select v-model="row.fileFormat" size="small" style="width: 100%">
                    <el-option v-for="item in FILTER_FILE_FORMAT_OPTIONS.filter(i => i.value)" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="场景" width="160">
                <template #default="{ row }">
                  <el-select v-model="row.adaptScene" multiple size="small" style="width: 100%" placeholder="选择">
                    <el-option v-for="item in FILTER_ADAPT_SCENE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column label="版权" width="130">
                <template #default="{ row }">
                  <el-input v-model="row.copyrightLicense" placeholder="版权信息" size="small" />
                </template>
              </el-table-column>
              <el-table-column label="校验状态" width="100" align="center">
                <template #default="{ row }">
                  <el-tag v-if="row._valid" type="success" size="small">合规</el-tag>
                  <el-tag v-else-if="row._valid === false" type="danger" size="small">不合格</el-tag>
                  <el-tag v-else type="info" size="small">待校验</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="校验结果" min-width="180">
                <template #default="{ row }">
                  <div v-if="row._validation && row._validation.errors.length" class="batch-errors">
                    <div v-for="(err, i) in row._validation.errors" :key="i" class="error-item">
                      {{ err }}
                    </div>
                  </div>
                  <span v-else-if="row._valid" class="green-text">通过校验</span>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="70" align="center">
                <template #default="{ $index }">
                  <el-button type="danger" link size="small" @click="batchItems.splice($index, 1)">移除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="素材溯源" name="trace">
        <div class="filter-card card-wrapper">
          <div class="card-title">录入素材溯源校验</div>
          <el-form :inline="true" class="trace-form">
            <el-form-item>
              <el-input
                v-model="traceKeyword"
                placeholder="输入滤镜编码/名称/适配场景"
                clearable
                style="width: 360px"
                @keyup.enter="handleTrace"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleTrace" :loading="traceLoading">溯源查询</el-button>
            </el-form-item>
          </el-form>

          <div v-if="traceLoading" class="skeleton-container">
            <div v-for="i in 3" :key="i" class="skeleton-item">
              <div class="skeleton-line long" />
              <div class="skeleton-line medium" />
              <div class="skeleton-line short" />
            </div>
          </div>

          <div v-else-if="traceResults.length > 0" class="trace-results">
            <div v-for="(item, idx) in traceResults" :key="idx" class="trace-result-card">
              <div class="trace-header">
                <div class="trace-info">
                  <span class="trace-code">{{ item.filter.filterCode }}</span>
                  <span class="trace-name">{{ item.filter.name }}</span>
                  <el-tag :type="FilterStatusTagType[item.filter.status]" size="small">
                    {{ FilterStatusLabel[item.filter.status] }}
                  </el-tag>
                </div>
                <div class="trace-badges">
                  <el-tag v-if="item.overallCheck.passed" type="success" size="small">校验通过</el-tag>
                  <el-tag v-else type="danger" size="small">
                    {{ item.overallCheck.isBlocked ? '已拦截' : '存在风险' }}
                  </el-tag>
                </div>
              </div>

              <el-descriptions :column="3" border size="small" class="trace-desc">
                <el-descriptions-item label="文件格式">{{ FilterFileFormatLabel[item.filter.fileFormat] }}</el-descriptions-item>
                <el-descriptions-item label="分辨率">{{ item.filter.resolution || '-' }}</el-descriptions-item>
                <el-descriptions-item label="录入人">{{ item.filter.authorName || '-' }}</el-descriptions-item>
                <el-descriptions-item label="版权资质">
                  <el-tooltip :content="item.filter.copyrightLicense || '-'" placement="top" :show-after="300">
                    <span class="text-ellipsis">{{ item.filter.copyrightLicense || '-' }}</span>
                  </el-tooltip>
                </el-descriptions-item>
                <el-descriptions-item label="完整性">{{ item.integrityCheck.passed ? '完整' : '异常' }}</el-descriptions-item>
                <el-descriptions-item label="版权合规">{{ item.copyrightCheck.passed ? '合规' : '不合规' }}</el-descriptions-item>
              </el-descriptions>

              <div v-if="item.overallCheck.issues.length" class="trace-issues">
                <div class="issues-title">检出问题：</div>
                <div v-for="(issue, i) in item.overallCheck.issues" :key="i" class="issue-item">
                  <el-tag :type="FILTER_TRACE_SEVERITY_TAG_TYPE[issue.severity]" size="small">
                    {{ issue.severity }}
                  </el-tag>
                  <span class="issue-message">{{ issue.message }}</span>
                </div>
              </div>

              <div class="trace-edit-logs">
                <el-collapse>
                  <el-collapse-item>
                    <template #title>
                      <span class="logs-title">编辑日志（{{ item.editLogs.length }}条）</span>
                    </template>
                    <el-table :data="item.editLogs" size="small" border>
                      <el-table-column prop="changeType" label="类型" width="100">
                        <template #default="{ row }">
                          <el-tag :type="FILTER_CHANGE_TYPE_TAG_TYPE[row.changeType]" size="small">
                            {{ FILTER_CHANGE_TYPE_LABEL[row.changeType] }}
                          </el-tag>
                        </template>
                      </el-table-column>
                      <el-table-column prop="operatorName" label="操作人" width="90" />
                      <el-table-column prop="changedFields" label="变更字段" min-width="160">
                        <template #default="{ row }">
                          <el-tooltip :content="(row.changedFields || []).join('、')" placement="top" :show-after="300">
                            <span class="text-ellipsis">{{ (row.changedFields || []).join('、') }}</span>
                          </el-tooltip>
                        </template>
                      </el-table-column>
                      <el-table-column prop="reason" label="原因" min-width="140">
                        <template #default="{ row }">
                          <el-tooltip :content="row.reason || '-'" placement="top" :show-after="300">
                            <span class="text-ellipsis">{{ row.reason || '-' }}</span>
                          </el-tooltip>
                        </template>
                      </el-table-column>
                      <el-table-column label="时间" width="160">
                        <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
                      </el-table-column>
                    </el-table>
                  </el-collapse-item>
                </el-collapse>
              </div>
            </div>
          </div>

          <EmptyState v-else-if="traceSearched && !traceLoading" description="未找到匹配的滤镜素材" />
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog
      v-model="editDialogVisible"
      :title="isPublishedEdit ? '编辑滤镜（上架状态-有限编辑）' : '编辑滤镜'"
      width="680px"
      :close-on-click-modal="false"
    >
      <el-alert
        v-if="isPublishedEdit"
        title="当前滤镜已上架，仅可调整展示权重、介绍文案，禁止修改核心特效参数"
        type="warning"
        :closable="false"
        show-icon
        class="edit-warning"
      />
      <el-form ref="editFormRef" :model="editForm" label-width="120px">
        <el-form-item label="滤镜编码">
          <el-input :model-value="editForm.filterCode" disabled />
        </el-form-item>
        <el-form-item label="滤镜名称">
          <el-input v-model="editForm.name" :disabled="isPublishedEdit" />
        </el-form-item>
        <el-form-item label="展示权重">
          <el-input-number v-model="editForm.sortWeight" :min="0" :max="9999" />
        </el-form-item>
        <el-form-item label="介绍文案">
          <el-input v-model="editForm.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item v-if="!isPublishedEdit" label="适配场景">
          <el-select v-model="editForm.adaptScene" multiple placeholder="选择场景">
            <el-option v-for="item in FILTER_ADAPT_SCENE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="!isPublishedEdit" label="适配机型">
          <el-select v-model="editForm.adaptDevice" multiple filterable allow-create placeholder="输入机型">
            <el-option v-for="d in deviceOptions" :key="d" :label="d" :value="d" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="!isPublishedEdit" label="标签">
          <el-select v-model="editForm.tags" multiple filterable allow-create placeholder="输入标签">
            <el-option v-for="tag in tagOptions" :key="tag" :label="tag" :value="tag" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="editForm.remark" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveEdit" :loading="editSaving">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="editLogDialogVisible" title="编辑日志" width="800px">
      <DataTable
        :data="editLogList"
        :loading="editLogLoading"
        :total="editLogTotal"
        v-model:page="editLogPage"
        v-model:page-size="editLogPageSize"
        @refresh="fetchEditLogs"
        :show-pagination="true"
      >
        <el-table-column prop="changeType" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="FILTER_CHANGE_TYPE_TAG_TYPE[row.changeType]" size="small">
              {{ FILTER_CHANGE_TYPE_LABEL[row.changeType] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="editStep" label="步骤" width="70" align="center" />
        <el-table-column prop="operatorName" label="操作人" width="90" align="center" />
        <el-table-column label="变更字段" min-width="160">
          <template #default="{ row }">
            <el-tooltip :content="(row.changedFields || []).join('、')" placement="top" :show-after="300">
              <span class="text-ellipsis">{{ (row.changedFields || []).join('、') }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="原因" min-width="140" show-overflow-tooltip />
        <el-table-column label="时间" width="160">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
      </DataTable>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Search, Refresh, UploadFilled } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { DataTable, EmptyState } from '@/components/business'
import {
  FilterStatusLabel,
  FilterStatusTagType,
  FilterFileFormatLabel,
  FILTER_FILE_FORMAT_OPTIONS,
  FILTER_STATUS_OPTIONS,
  FILTER_ADAPT_SCENE_OPTIONS,
  FILTER_RESOLUTION_OPTIONS,
  FILTER_CHANGE_TYPE_LABEL,
  FILTER_CHANGE_TYPE_TAG_TYPE,
  FILTER_TRACE_SEVERITY_TAG_TYPE
} from '@/constants'
import {
  getFilterList,
  getFilterDetail,
  validateFilterCreate,
  createFilterWithValidation,
  updateFilterWithConstraint,
  getFilterEditLogs,
  batchValidateAndSubmit,
  traceFilter,
  updateFilterStatus
} from '@/api/filter'
import type {
  FilterEffect,
  FilterEditLog,
  FilterTraceResultItem
} from '@/types'

const activeTab = ref('entry')

const tagOptions = ['人像', '风景', '美食', '复古', '夜景', '潮流', '自然', '艺术', 'HDR', '胶片']
const deviceOptions = ['iPhone 15 Pro', 'iPhone 15', 'iPhone 14', 'Pixel 8', 'Samsung S24', 'Huawei Mate60', 'Xiaomi 14', 'OPPO Find X7', '通用']
const categoryList = ref<{ id: number; name: string }[]>([])

const formatDate = (date: string) => {
  if (!date) return '-'
  return date.replace('T', ' ').substring(0, 16)
}

// ================ 功能点1：滤镜录入 ================

const entryFormRef = ref()
const entryLoading = ref(false)
const formShake = ref(false)
const uploadFocused = ref(false)
const fieldErrors = reactive<Record<string, string>>({})

const entryForm = reactive<Partial<FilterEffect>>({
  name: '',
  tags: [],
  adaptDevice: [],
  adaptScene: [],
  fileFormat: 'glsl',
  resolution: '',
  copyrightLicense: '',
  copyrightExpiredAt: '',
  fileUrl: '',
  categoryId: undefined,
  description: '',
  remark: ''
})

const entryRules = {
  name: [{ required: true, message: '请输入滤镜名称', trigger: 'blur' }],
  fileFormat: [{ required: true, message: '请选择文件格式', trigger: 'change' }],
  copyrightLicense: [{ required: true, message: '请输入版权资质', trigger: 'blur' }],
  tags: [{ required: true, type: 'array' as const, message: '请添加至少一个标签', trigger: 'change' }],
  adaptDevice: [{ required: true, type: 'array' as const, message: '请添加适配机型', trigger: 'change' }]
}

const handleFieldFocus = (field: string) => {
  delete fieldErrors[field]
}

const handleFieldBlur = (field: string) => {
  if (field === 'name' && !entryForm.name?.trim()) {
    fieldErrors.name = '滤镜名称不能为空'
  }
}

const handleFileChange = (file: any) => {
  entryForm.fileUrl = file.name
  uploadFocused.value = true
}

const handleFileRemove = () => {
  entryForm.fileUrl = ''
  uploadFocused.value = false
}

const triggerShake = () => {
  formShake.value = true
  setTimeout(() => { formShake.value = false }, 600)
}

const handleSubmitEntry = async () => {
  try {
    await entryFormRef.value?.validate()

    const valRes = await validateFilterCreate(entryForm)
    if (!valRes.data.valid) {
      valRes.data.errors.forEach((err: string) => {
        if (err.includes('名称')) fieldErrors.name = err
        if (err.includes('标签')) fieldErrors.tags = err
        if (err.includes('机型')) fieldErrors.adaptDevice = err
        if (err.includes('场景')) fieldErrors.adaptScene = err
        if (err.includes('版权')) fieldErrors.copyrightLicense = err
      })
      triggerShake()
      ElMessage.error(valRes.data.errors.join('；'))
      return
    }

    entryLoading.value = true
    const res = await createFilterWithValidation(entryForm)
    ElMessage.success(`录入成功，滤镜编码：${res.data.filterCode}`)
    handleResetEntry()
  } catch (err: any) {
    if (err?.message) {
      triggerShake()
    }
  } finally {
    entryLoading.value = false
  }
}

const handleResetEntry = () => {
  entryFormRef.value?.resetFields()
  Object.keys(fieldErrors).forEach(k => delete fieldErrors[k])
  entryForm.name = ''
  entryForm.tags = []
  entryForm.adaptDevice = []
  entryForm.adaptScene = []
  entryForm.fileFormat = 'glsl'
  entryForm.resolution = ''
  entryForm.copyrightLicense = ''
  entryForm.copyrightExpiredAt = ''
  entryForm.fileUrl = ''
  entryForm.categoryId = undefined
  entryForm.description = ''
  entryForm.remark = ''
}

// ================ 功能点2：滤镜编辑 ================

const editFilterForm = reactive({
  keyword: '',
  status: ''
})
const filterList = ref<FilterEffect[]>([])
const filterTotal = ref(0)
const filterPage = ref(1)
const filterPageSize = ref(20)
const filterLoading = ref(false)

const editDialogVisible = ref(false)
const editLogDialogVisible = ref(false)
const editSaving = ref(false)
const currentEditId = ref(0)
const isPublishedEdit = ref(false)

const editForm = reactive<Partial<FilterEffect>>({
  filterCode: '',
  name: '',
  sortWeight: 0,
  description: '',
  adaptScene: [],
  adaptDevice: [],
  tags: [],
  remark: ''
})

const editLogList = ref<FilterEditLog[]>([])
const editLogTotal = ref(0)
const editLogPage = ref(1)
const editLogPageSize = ref(10)
const editLogLoading = ref(false)

const fetchFilterList = async () => {
  filterLoading.value = true
  try {
    const res = await getFilterList({
      page: filterPage.value,
      pageSize: filterPageSize.value,
      keyword: editFilterForm.keyword || undefined,
      status: editFilterForm.status || undefined
    })
    filterList.value = res.data.list
    filterTotal.value = res.data.total
  } catch {
    console.error('获取滤镜列表失败')
  } finally {
    filterLoading.value = false
  }
}

const handleResetEditFilter = () => {
  editFilterForm.keyword = ''
  editFilterForm.status = ''
  filterPage.value = 1
  fetchFilterList()
}

const handleEditFilter = async (row: FilterEffect) => {
  currentEditId.value = row.id
  isPublishedEdit.value = row.status === 'published'

  try {
    const res = await getFilterDetail(row.id)
    const d = res.data
    editForm.filterCode = d.filterCode
    editForm.name = d.name
    editForm.sortWeight = d.sortWeight
    editForm.description = d.description
    editForm.adaptScene = d.adaptScene || []
    editForm.adaptDevice = d.adaptDevice || []
    editForm.tags = d.tags || []
    editForm.remark = d.remark
    editDialogVisible.value = true
  } catch {
    ElMessage.error('获取滤镜详情失败')
  }
}

const handleSaveEdit = async () => {
  editSaving.value = true
  try {
    const updateData: any = {
      sortWeight: editForm.sortWeight,
      description: editForm.description,
      remark: editForm.remark
    }
    if (!isPublishedEdit.value) {
      updateData.name = editForm.name
      updateData.adaptScene = editForm.adaptScene
      updateData.adaptDevice = editForm.adaptDevice
      updateData.tags = editForm.tags
    }
    await updateFilterWithConstraint(currentEditId.value, updateData)
    ElMessage.success('编辑成功，已自动同步展示效果')
    editDialogVisible.value = false
    fetchFilterList()
  } catch (err: any) {
    ElMessage.error(err?.message || '编辑失败')
  } finally {
    editSaving.value = false
  }
}

const handlePublishFilter = async (row: FilterEffect) => {
  try {
    await ElMessageBox.confirm(`确定上架滤镜「${row.name}」？`, '上架确认', { type: 'info' })
    await updateFilterStatus(row.id, 'published')
    ElMessage.success('上架成功')
    fetchFilterList()
  } catch { }
}

const handleOfflineFilter = async (row: FilterEffect) => {
  try {
    await ElMessageBox.confirm(`确定下架滤镜「${row.name}」？`, '下架确认', { type: 'warning' })
    await updateFilterStatus(row.id, 'offline')
    ElMessage.success('下架成功')
    fetchFilterList()
  } catch { }
}

const handleViewEditLogs = (row: FilterEffect) => {
  currentEditId.value = row.id
  editLogPage.value = 1
  editLogDialogVisible.value = true
  fetchEditLogs()
}

const fetchEditLogs = async () => {
  editLogLoading.value = true
  try {
    const res = await getFilterEditLogs(currentEditId.value, {
      page: editLogPage.value,
      pageSize: editLogPageSize.value
    })
    editLogList.value = res.data.list
    editLogTotal.value = res.data.total
  } catch {
    console.error('获取编辑日志失败')
  } finally {
    editLogLoading.value = false
  }
}

// ================ 功能点3：批量录入 ================

interface BatchItem extends Partial<FilterEffect> {
  _valid?: boolean
  _validation?: { valid: boolean; errors: string[] }
}

const batchItems = ref<BatchItem[]>([])
const batchSubmitting = ref(false)
const batchProgress = reactive({
  active: false,
  percentage: 0,
  status: '' as '' | 'success' | 'exception' | 'warning',
  message: ''
})

const handleBatchFileChange = (file: any) => {
  const fileName = file.name.replace(/\.[^/.]+$/, '')
  batchItems.value.push({
    name: fileName,
    fileFormat: 'glsl',
    adaptScene: [],
    adaptDevice: [],
    copyrightLicense: '',
    fileUrl: file.name,
    tags: [],
    _valid: undefined,
    _validation: undefined
  })
}

const handleBatchSubmit = async () => {
  if (batchItems.value.length === 0) {
    ElMessage.warning('请先添加素材')
    return
  }

  batchSubmitting.value = true
  batchProgress.active = true
  batchProgress.percentage = 10
  batchProgress.status = ''
  batchProgress.message = '正在校验素材合规性...'

  try {
    for (let i = 0; i < batchItems.value.length; i++) {
      const item = batchItems.value[i]
      try {
        const valRes = await validateFilterCreate(item as any)
        item._valid = valRes.data.valid
        item._validation = valRes.data
      } catch {
        item._valid = false
        item._validation = { valid: false, errors: ['校验失败'] }
      }
      batchProgress.percentage = Math.round(10 + (i + 1) / batchItems.value.length * 50)
    }

    batchProgress.message = '校验完成，正在提交合规素材...'

    const validItems = batchItems.value.filter(i => i._valid)
    const invalidCount = batchItems.value.filter(i => !i._valid).length

    if (validItems.length === 0) {
      batchProgress.percentage = 100
      batchProgress.status = 'exception'
      batchProgress.message = '所有素材均不合格'
      ElMessage.error('所有素材均未通过校验')
      return
    }

    batchProgress.percentage = 70

    const res = await batchValidateAndSubmit(validItems as Partial<FilterEffect>[])
    batchProgress.percentage = 100
    batchProgress.status = 'success'
    batchProgress.message = `提交完成：${res.data.submitted.length}个成功，${invalidCount}个不合格被拦截`

    ElMessage.success(`批量录入完成：${res.data.submitted.length}个成功，${invalidCount}个不合格`)

    batchItems.value = batchItems.value.filter(i => !i._valid)
  } catch (err: any) {
    batchProgress.status = 'exception'
    batchProgress.message = '批量提交失败'
    ElMessage.error('批量提交失败')
  } finally {
    batchSubmitting.value = false
    setTimeout(() => {
      batchProgress.active = false
    }, 3000)
  }
}

// ================ 功能点4：素材溯源 ================

const traceKeyword = ref('')
const traceLoading = ref(false)
const traceSearched = ref(false)
const traceResults = ref<FilterTraceResultItem[]>([])

const handleTrace = async () => {
  if (!traceKeyword.value.trim()) {
    ElMessage.warning('请输入溯源关键词')
    return
  }

  traceLoading.value = true
  traceSearched.value = true
  traceResults.value = []

  try {
    const res = await traceFilter(traceKeyword.value.trim())
    traceResults.value = res.data
    if (res.data.length === 0) {
      ElMessage.info('未找到匹配的滤镜素材')
    }
  } catch (err: any) {
    ElMessage.error(err?.message || '溯源查询失败')
  } finally {
    traceLoading.value = false
  }
}

onMounted(() => {
  fetchFilterList()
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.filter-page {
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

  .card-title {
    font-size: $font-size-medium;
    font-weight: 600;
    color: $text-primary;
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 1px solid $border-color-lighter;
  }

  .filter-tabs {
    :deep(.el-tabs__header) {
      margin-bottom: 16px;
    }
  }

  .entry-form {
    :deep(.el-form-item__content) {
      .input-error {
        :deep(.el-input__wrapper) {
          border-color: $danger-color !important;
          box-shadow: 0 0 0 1px $danger-color !important;
        }
      }
    }
  }

  .field-error-tip {
    font-size: $font-size-extra-small;
    color: $danger-color;
    line-height: 1.2;
    padding-top: 4px;
    animation: shake 0.3s ease-in-out;
  }

  .upload-area {
    width: 100%;

    &.upload-focused {
      :deep(.el-upload-dragger) {
        border-color: $primary-color;
        background: rgba($primary-color, 0.04);
      }
    }
  }

  .upload-icon {
    font-size: 40px;
    color: $primary-color;
    margin-bottom: 8px;
  }

  .upload-text {
    font-size: $font-size-base;
    color: $text-regular;

    em {
      color: $primary-color;
      font-style: normal;
    }
  }

  .batch-upload-area {
    margin-bottom: 20px;

    :deep(.el-upload-dragger) {
      width: 100%;
      padding: 30px;
    }
  }

  .batch-progress {
    margin-bottom: 20px;

    .progress-text {
      font-size: $font-size-extra-small;
      color: $text-secondary;
      margin-top: 8px;
    }
  }

  .batch-list {
    .batch-list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      font-size: $font-size-base;
      color: $text-regular;
    }
  }

  .batch-errors {
    .error-item {
      font-size: $font-size-extra-small;
      color: $danger-color;
      line-height: 1.6;
    }
  }

  .green-text {
    color: $success-color;
    font-size: $font-size-extra-small;
  }

  .skeleton-container {
    .skeleton-item {
      padding: 16px 0;
      border-bottom: 1px solid $border-color-lighter;
    }

    .skeleton-line {
      height: 16px;
      background: linear-gradient(90deg, $border-color-lighter 25%, $border-color-extra-light 50%, $border-color-lighter 75%);
      background-size: 200% 100%;
      animation: skeleton-loading 1.5s ease-in-out infinite;
      border-radius: 4px;
      margin-bottom: 10px;

      &.long { width: 80%; }
      &.medium { width: 60%; }
      &.short { width: 30%; }
    }
  }

  .trace-results {
    .trace-result-card {
      background: $bg-color-ffffff;
      border: 1px solid $border-color-lighter;
      border-radius: $border-radius-large;
      padding: 20px;
      margin-bottom: 16px;

      .trace-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;

        .trace-info {
          display: flex;
          align-items: center;
          gap: 12px;

          .trace-code {
            font-family: monospace;
            font-size: $font-size-base;
            color: $primary-color;
            font-weight: 600;
          }

          .trace-name {
            font-size: $font-size-medium;
            font-weight: 600;
            color: $text-primary;
          }
        }
      }

      .trace-desc {
        margin-bottom: 16px;
      }

      .trace-issues {
        margin-bottom: 16px;

        .issues-title {
          font-size: $font-size-small;
          font-weight: 600;
          color: $danger-color;
          margin-bottom: 8px;
        }

        .issue-item {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;

          .issue-message {
            font-size: $font-size-extra-small;
            color: $text-regular;
          }
        }
      }

      .trace-edit-logs {
        .logs-title {
          font-size: $font-size-base;
          color: $text-regular;
        }
      }
    }
  }

  .edit-warning {
    margin-bottom: 16px;
  }

  .ripple-btn {
    position: relative;
    overflow: hidden;
    transition: transform 0.2s ease;

    &:hover {
      transform: scale(1.1);
    }

    &:active::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 30px;
      height: 30px;
      background: rgba($primary-color, 0.3);
      border-radius: 50%;
      transform: translate(-50%, -50%) scale(0);
      animation: ripple 0.4s ease-out;
    }
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  50% { transform: translateX(4px); }
  75% { transform: translateX(-4px); }
}

@keyframes ripple {
  0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(4); opacity: 0; }
}

@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
