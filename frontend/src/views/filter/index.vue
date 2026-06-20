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

      <el-tab-pane label="状态管控" name="status">
        <div class="filter-card card-wrapper">
          <div class="card-title">滤镜状态统计概览</div>
          <div class="status-overview-row">
            <div
              v-for="s in FILTER_FOUR_MUTEX_STATUSES"
              :key="s"
              class="status-card"
              @click="handleFilterByStatus(s)"
            >
              <div class="status-card-inner" :class="FILTER_STATUS_GLOW_CLASS[s]">
                <div class="status-label">
                  <el-tag :type="FilterStatusTagType[s]" size="small" class="glow-tag">
                    {{ FilterStatusLabel[s] }}
                  </el-tag>
                </div>
                <div class="status-count">{{ statusOverview ? (statusOverview as any)[s] : 0 }}</div>
                <div class="status-pct">
                  {{ statusOverview && statusOverview.total
                    ? Math.round(((statusOverview as any)[s] / statusOverview.total) * 1000) / 10 : 0 }}%
                </div>
              </div>
            </div>
            <div class="status-card">
              <div class="status-card-inner glow-success">
                <div class="status-label">
                  <el-tag type="success" size="small" class="glow-tag">总数</el-tag>
                </div>
                <div class="status-count">{{ statusOverview?.total || 0 }}</div>
                <div class="status-pct">上架率 {{ statusOverview?.publishRate || 0 }}%</div>
              </div>
            </div>
          </div>

          <div class="status-toolbar">
            <el-form :inline="true" :model="statusFilterForm" class="filter-form">
              <el-form-item label="关键词">
                <el-input v-model="statusFilterForm.keyword" placeholder="名称/编码" clearable style="width: 180px" />
              </el-form-item>
              <el-form-item label="状态">
                <el-select v-model="statusFilterForm.status" placeholder="全部" clearable style="width: 130px">
                  <el-option v-for="item in FILTER_STATUS_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" :icon="Search" @click="fetchStatusList">搜索</el-button>
                <el-button :icon="Refresh" @click="handleResetStatusFilter">重置</el-button>
              </el-form-item>
            </el-form>
            <div class="batch-toolbar">
              <el-select
                v-model="batchTargetStatus"
                placeholder="选择批量操作"
                style="width: 150px; margin-right: 10px"
                :disabled="statusSelectedIds.length === 0"
              >
                <el-option v-for="item in FILTER_BATCH_STATUS_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
              <el-button
                type="warning"
                :disabled="!batchTargetStatus || statusSelectedIds.length === 0"
                @click="handleBatchStatus"
                :loading="batchStatusLoading"
              >
                执行({{ statusSelectedIds.length }})
              </el-button>
            </div>
          </div>

          <el-table
            ref="statusTableRef"
            :data="statusList"
            :loading="statusLoading"
            border
            highlight-current-row
            stripe
            class="status-table status-transition-table"
            @selection-change="handleStatusSelectionChange"
            @row-style="handleStatusRowStyle"
          >
            <el-table-column type="selection" width="45" align="center" :selectable="checkRowSelectable" />
            <el-table-column prop="filterCode" label="滤镜编码" width="150" show-overflow-tooltip />
            <el-table-column prop="name" label="名称" min-width="140" show-overflow-tooltip />
            <el-table-column label="状态" width="110" align="center">
              <template #default="{ row }">
                <el-tag
                  :type="FilterStatusTagType[row.status]"
                  size="small"
                  effect="dark"
                  :class="['status-tag-anim', FILTER_STATUS_GLOW_CLASS[row.status] + '-tag']"
                >
                  {{ FilterStatusLabel[row.status] }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="useHeat" label="热度" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="row.useHeat > 500 ? 'danger' : row.useHeat > 100 ? 'warning' : 'info'" size="small">
                  {{ row.useHeat || 0 }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="inUseCount" label="在用" width="70" align="center" />
            <el-table-column prop="recommendWeight" label="推荐权重" width="90" align="center" />
            <el-table-column label="可使用" width="70" align="center">
              <template #default="{ row }">
                <el-tag :type="row.canUserUse ? 'success' : 'info'" size="small">
                  {{ row.canUserUse ? '是' : '否' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="statusChangeCount" label="变更频次" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="row.statusChangeCount >= 5 ? 'danger' : 'info'" size="small">
                  {{ row.statusChangeCount || 0 }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="最近变更" width="150" align="center">
              <template #default="{ row }">
                <div>
                  <div>{{ row.lastStatusChangeAt ? formatDate(row.lastStatusChangeAt) : '-' }}</div>
                  <div class="operator-text">{{ row.lastStatusChangeOperator || '-' }}</div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="220" align="center" fixed="right">
              <template #default="{ row }">
                <el-dropdown trigger="click" @command="(cmd) => handleChangeStatus(row, cmd)">
                  <el-button size="small" type="primary" link :disabled="row.status === 'violation'">
                    变更状态<el-icon class="el-icon--right"><Refresh /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item
                        v-for="s in (FILTER_STATUS_TRANSITIONS[row.status] || [])"
                        :key="s"
                        :command="s"
                        :disabled="row.status === 'violation'"
                      >
                        → {{ FilterStatusLabel[s] }}
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </template>
            </el-table-column>
          </el-table>

          <div class="status-pagination-row">
            <el-pagination
              v-model:current-page="statusPage"
              v-model:page-size="statusPageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="statusTotal"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="fetchStatusList"
              @current-change="fetchStatusList"
            />
          </div>
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

    <el-dialog
      v-model="statusConfirmVisible"
      :title="statusConfirmMode === 'violation' ? '违规禁用确认' : '状态变更二次确认'"
      width="560px"
      :close-on-click-modal="false"
      custom-class="status-dialog-zoom"
    >
      <el-alert
        v-if="statusConfirmMode === 'usage'"
        :title="statusConfirmInfo?.message || '存在在用作品，是否继续？'"
        type="warning"
        :closable="false"
        show-icon
        class="confirm-alert"
      >
        <template #default>
          <div class="confirm-info">
            <p>在用作品数：<strong>{{ statusConfirmInfo?.inUseCount || 0 }}</strong></p>
            <p>使用热度：<strong>{{ statusConfirmInfo?.useHeat || 0 }}</strong></p>
            <p>目标状态：<strong>{{ statusConfirmInfo?.targetStatus ? FilterStatusLabel[statusConfirmInfo.targetStatus] : '-' }}</strong></p>
          </div>
        </template>
      </el-alert>

      <el-form v-if="statusConfirmMode === 'violation'" label-width="100px" class="confirm-form">
        <el-form-item label="违规原因" required>
          <el-input
            v-model="violationReasonInput"
            type="textarea"
            :rows="3"
            placeholder="请输入违规禁用原因"
          />
        </el-form-item>
        <el-form-item label="当前滤镜">
          <el-tag type="danger" size="small">{{ statusConfirmInfo?.filterName || '-' }}</el-tag>
          <span class="ml-10">{{ statusConfirmInfo?.filterCode || '' }}</span>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="statusConfirmVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmStatusChange" :loading="statusConfirmLoading">
          确认{{ statusConfirmMode === 'violation' ? '禁用' : '变更' }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="hfBlockedVisible"
      title="高频操作已拦截"
      width="460px"
      :close-on-click-modal="false"
      custom-class="status-dialog-shake"
    >
      <el-alert
        title="短时间内变更频次过高，为防止误操作已自动拦截"
        type="error"
        :closable="false"
        show-icon
      >
        <template #default>
          <div class="hf-info">
            <p>提示：请 <strong>{{ hfBlockedInfo?.seconds || 60 }}</strong> 秒后再试</p>
            <p>变更频次：<strong>{{ hfBlockedInfo?.recentChanges || 0 }}</strong> 次/分钟（阈值5次）</p>
            <p>相关滤镜：{{ hfBlockedInfo?.filterName || '' }}（{{ hfBlockedInfo?.filterCode || '' }}）</p>
          </div>
        </template>
      </el-alert>
      <template #footer>
        <el-button type="primary" @click="hfBlockedVisible = false">知道了</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="batchResultVisible"
      title="批量状态操作结果"
      width="720px"
      :close-on-click-modal="false"
    >
      <div class="batch-result-summary">
        <el-descriptions :column="4" border size="small">
          <el-descriptions-item label="总数">{{ batchResult?.total || 0 }}</el-descriptions-item>
          <el-descriptions-item label="成功">
            <el-tag type="success">{{ batchResult?.success?.length || 0 }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="过滤">
            <el-tag type="info">{{ batchResult?.filtered?.length || 0 }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="失败">
            <el-tag type="danger">{{ batchResult?.failed?.length || 0 }}</el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <el-tabs v-model="batchResultTab" class="mt-15">
        <el-tab-pane label="成功" name="success">
          <el-table v-if="batchResult?.success?.length" :data="batchResult.success" size="small" border>
            <el-table-column prop="filterCode" label="编码" width="150" />
            <el-table-column prop="name" label="名称" min-width="160" />
            <el-table-column label="新状态" width="110" align="center">
              <template #default="{ row }">
                <el-tag :type="FilterStatusTagType[row.status]" size="small">
                  {{ FilterStatusLabel[row.status] }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
          <EmptyState v-else description="暂无成功记录" />
        </el-tab-pane>
        <el-tab-pane label="已过滤" name="filtered">
          <el-table v-if="batchResult?.filtered?.length" :data="batchResult.filtered" size="small" border>
            <el-table-column prop="filterCode" label="编码" width="150" />
            <el-table-column prop="name" label="名称" min-width="160" />
            <el-table-column label="原状态" width="110" align="center">
              <template #default="{ row }">
                <el-tag :type="FilterStatusTagType[row.status]" size="small">
                  {{ FilterStatusLabel[row.status] }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="reason" label="过滤原因" min-width="180" />
          </el-table>
          <EmptyState v-else description="无过滤记录" />
        </el-tab-pane>
        <el-tab-pane label="失败" name="failed">
          <el-table v-if="batchResult?.failed?.length" :data="batchResult.failed" size="small" border>
            <el-table-column label="编码" width="150">
              <template #default="{ row }">{{ row.filterCode || row.id }}</template>
            </el-table-column>
            <el-table-column prop="name" label="名称" min-width="160" />
            <el-table-column prop="reason" label="失败原因" min-width="180" />
          </el-table>
          <EmptyState v-else description="无失败记录" />
        </el-tab-pane>
      </el-tabs>

      <template #footer>
        <el-button @click="batchResultVisible = false; fetchStatusList()">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
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
  FILTER_TRACE_SEVERITY_TAG_TYPE,
  FILTER_FOUR_MUTEX_STATUSES,
  FILTER_STATUS_GLOW_CLASS,
  FILTER_BATCH_STATUS_OPTIONS,
  FILTER_STATUS_TRANSITIONS
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
  updateFilterStatus,
  batchUpdateFilterStatus,
  getFilterStatusOverview,
  deleteFilter
} from '@/api/filter'
import type {
  FilterEffect,
  FilterEditLog,
  FilterTraceResultItem,
  FilterStatusOverview,
  FilterStatusUpdateResult,
  BatchStatusResult
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

// ================ 功能点5：特效滤镜状态管控 ================

const statusTableRef = ref<any>(null)
const statusLoading = ref(false)
const statusList = ref<FilterEffect[]>([])
const statusTotal = ref(0)
const statusPage = ref(1)
const statusPageSize = ref(20)

const statusOverview = ref<FilterStatusOverview | null>(null)
const statusOverviewLoading = ref(false)

const statusFilterForm = reactive({
  keyword: '',
  status: ''
})

const statusSelectedIds = ref<number[]>([])
const batchTargetStatus = ref('')
const batchStatusLoading = ref(false)
const batchResult = ref<BatchStatusResult | null>(null)
const batchResultVisible = ref(false)
const batchResultTab = ref('success')

const statusConfirmVisible = ref(false)
const statusConfirmLoading = ref(false)
const statusConfirmMode = ref<'usage' | 'violation'>('usage')
const statusConfirmInfo = ref<{
  filterId?: number
  filterCode?: string
  filterName?: string
  targetStatus?: string
  needSecondConfirm?: boolean
  inUseCount?: number
  useHeat?: number
  message?: string
} | null>(null)
const violationReasonInput = ref('')

const hfBlockedVisible = ref(false)
const hfBlockedInfo = ref<{
  filterId?: number
  filterCode?: string
  filterName?: string
  recentChanges?: number
  seconds?: number
} | null>(null)

const pendingStatusChangeQueue = reactive<Record<number, {
  targetStatus: string
  skipSecondConfirm: boolean
  operatorName: string
  violationReason: string
}>>({})

const statusBtnDisabled = reactive<Record<number, boolean>>({})

const fetchStatusOverview = async () => {
  statusOverviewLoading.value = true
  try {
    const res = await getFilterStatusOverview()
    statusOverview.value = res.data
  } catch (err: any) {
    console.error('获取概览失败', err)
  } finally {
    statusOverviewLoading.value = false
  }
}

const fetchStatusList = async () => {
  statusLoading.value = true
  try {
    const res = await getFilterList({
      page: statusPage.value,
      pageSize: statusPageSize.value,
      keyword: statusFilterForm.keyword || undefined,
      status: statusFilterForm.status || undefined
    })
    statusList.value = res.data.list
    statusTotal.value = res.data.total
    nextTick(() => {
      statusSelectedIds.value.forEach(id => {
        const row = statusList.value.find(r => r.id === id)
        if (row && statusTableRef.value) {
          statusTableRef.value.toggleRowSelection(row, true)
        }
      })
    })
  } catch {
    ElMessage.error('获取状态列表失败')
  } finally {
    statusLoading.value = false
  }
}

const handleResetStatusFilter = () => {
  statusFilterForm.keyword = ''
  statusFilterForm.status = ''
  statusPage.value = 1
  fetchStatusList()
}

const handleFilterByStatus = (status: string) => {
  statusFilterForm.status = status
  statusPage.value = 1
  activeTab.value = 'status'
  fetchStatusList()
}

const handleStatusSelectionChange = (rows: FilterEffect[]) => {
  statusSelectedIds.value = rows.map(r => r.id)
}

const checkRowSelectable = (row: FilterEffect) => {
  return row.status !== 'violation'
}

const handleStatusRowStyle = ({ row, rowIndex }: { row: FilterEffect; rowIndex: number }) => {
  const isSelected = statusSelectedIds.value.includes(row.id)
  if (isSelected) {
    return { background: 'rgba(var(--el-color-primary-rgb), 0.12)' }
  }
  if (row.status === 'violation') {
    return { background: 'rgba(var(--el-color-danger-rgb), 0.06)' }
  }
  return {}
}

const handleChangeStatus = async (row: FilterEffect, targetStatus: string) => {
  if (statusBtnDisabled[row.id]) return

  statusBtnDisabled[row.id] = true
  setTimeout(() => { statusBtnDisabled[row.id] = false }, 300)

  pendingStatusChangeQueue[row.id] = {
    targetStatus,
    skipSecondConfirm: false,
    operatorName: '',
    violationReason: ''
  }

  if (targetStatus === 'violation') {
    statusConfirmMode.value = 'violation'
    statusConfirmInfo.value = {
      filterId: row.id,
      filterCode: row.filterCode,
      filterName: row.name,
      targetStatus
    }
    violationReasonInput.value = ''
    statusConfirmVisible.value = true
    return
  }

  await executeStatusChange(row.id, row)
}

const executeStatusChange = async (filterId: number, row?: FilterEffect) => {
  const pending = pendingStatusChangeQueue[filterId]
  if (!pending) return

  statusConfirmLoading.value = true
  try {
    const res = await updateFilterStatus(
      filterId,
      pending.targetStatus,
      {
        skipSecondConfirm: pending.skipSecondConfirm,
        violationReason: pending.violationReason,
        operatorName: pending.operatorName
      }
    )

    const data = res.data
    if (data.needSecondConfirm) {
      statusConfirmMode.value = 'usage'
      statusConfirmInfo.value = {
        filterId,
        filterCode: data.usingWorks?.[0]?.filterCode || (row?.filterCode),
        filterName: data.usingWorks?.[0]?.filterName || (row?.name),
        targetStatus: pending.targetStatus,
        inUseCount: data.inUseCount,
        useHeat: data.useHeat,
        message: data.message
      }
      pendingStatusChangeQueue[filterId].skipSecondConfirm = true
      statusConfirmVisible.value = true
      return
    }

    if (data.heatWarnings && data.heatWarnings.length > 0) {
      ElMessage.warning(data.heatWarnings.map(w => w.message).join('；'))
    }

    ElMessage.success('状态变更成功，已同步前端展示效果')
    statusConfirmVisible.value = false
    fetchStatusList()
    fetchStatusOverview()
  } catch (err: any) {
    const msg = err?.message || '状态变更失败'
    if (msg.includes('频次过高') || msg.includes('高频')) {
      hfBlockedInfo.value = {
        filterId,
        filterCode: row?.filterCode,
        filterName: row?.name,
        recentChanges: 5,
        seconds: 60
      }
      hfBlockedVisible.value = true
    } else {
      ElMessage.error(msg)
    }
  } finally {
    statusConfirmLoading.value = false
    delete pendingStatusChangeQueue[filterId]
  }
}

const confirmStatusChange = async () => {
  const filterId = statusConfirmInfo.value?.filterId
  if (!filterId) return

  if (statusConfirmMode.value === 'violation') {
    if (!violationReasonInput.value.trim()) {
      ElMessage.warning('请输入违规禁用原因')
      return
    }
    if (pendingStatusChangeQueue[filterId]) {
      pendingStatusChangeQueue[filterId].violationReason = violationReasonInput.value
    }
  }

  if (pendingStatusChangeQueue[filterId]) {
    pendingStatusChangeQueue[filterId].skipSecondConfirm = true
  }

  const row = statusList.value.find(r => r.id === filterId)
  await executeStatusChange(filterId, row)
}

const handleBatchStatus = async () => {
  if (statusSelectedIds.value.length === 0 || !batchTargetStatus.value) {
    ElMessage.warning('请选择素材并指定目标状态')
    return
  }
  batchStatusLoading.value = true
  try {
    const res = await batchUpdateFilterStatus(
      statusSelectedIds.value,
      batchTargetStatus.value
    )
    batchResult.value = res.data
    batchResultTab.value = 'success'
    batchResultVisible.value = true
    statusTableRef.value?.clearSelection()
  } catch (err: any) {
    ElMessage.error(err?.message || '批量操作失败')
  } finally {
    batchStatusLoading.value = false
    batchTargetStatus.value = ''
  }
}

watch(activeTab, (tab) => {
  if (tab === 'status') {
    fetchStatusOverview()
    if (!statusList.value.length) {
      fetchStatusList()
    }
  }
})

onMounted(() => {
  fetchFilterList()
  fetchStatusOverview()
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

@keyframes status-card-glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(var(--glow-color), 0); }
  50% { box-shadow: 0 0 20px 2px rgba(var(--glow-color), 0.35); }
}

@keyframes dialog-zoom-in {
  0% { opacity: 0; transform: scale(0.85) translateY(-20px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}

@keyframes dialog-slide-out {
  0% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(30px); }
}

@keyframes status-tag-pulse {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.35); }
}

@keyframes tag-shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-3px); }
  75% { transform: translateX(3px); }
}

  .status-overview-row {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 16px;
    margin-bottom: 24px;

    .status-card {
      cursor: pointer;
      transition: transform 0.25s ease;

      &:hover {
        transform: translateY(-3px);
      }

      .status-card-inner {
        --glow-color: var(--el-color-info-rgb, 144, 147, 153);
        padding: 20px;
        border-radius: $border-radius-large;
        background: $bg-color-ffffff;
        border: 1px solid $border-color-lighter;
        position: relative;
        overflow: hidden;

        &.glow-primary {
          --glow-color: var(--el-color-primary-rgb, 64, 158, 255);
          border-color: rgba(var(--glow-color), 0.35);
          animation: status-card-glow 2.8s ease-in-out infinite;
        }
        &.glow-success {
          --glow-color: var(--el-color-success-rgb, 103, 194, 58);
          border-color: rgba(var(--glow-color), 0.35);
          animation: status-card-glow 3s ease-in-out infinite;
        }
        &.glow-warning {
          --glow-color: var(--el-color-warning-rgb, 230, 162, 60);
          border-color: rgba(var(--glow-color), 0.35);
          animation: status-card-glow 2.6s ease-in-out infinite;
        }
        &.glow-danger {
          --glow-color: var(--el-color-danger-rgb, 245, 108, 108);
          border-color: rgba(var(--glow-color), 0.35);
          animation: status-card-glow 2.2s ease-in-out infinite;
        }
        &.glow-info {
          --glow-color: var(--el-color-info-rgb, 144, 147, 153);
          border-color: rgba(var(--glow-color), 0.25);
          animation: status-card-glow 3.2s ease-in-out infinite;
        }

        .status-label {
          margin-bottom: 10px;

          .glow-tag {
            font-weight: 500;
            padding: 0 10px;
            height: 24px;
            line-height: 22px;
          }
        }

        .status-count {
          font-size: 28px;
          font-weight: 700;
          color: $text-primary;
          margin-bottom: 6px;
          font-family: 'DIN', monospace;
        }

        .status-pct {
          font-size: $font-size-extra-small;
          color: $text-secondary;
        }
      }
    }
  }

  .status-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
    flex-wrap: wrap;
    gap: 12px;

    .batch-toolbar {
      display: flex;
      align-items: center;
    }
  }

  .status-table {
    .operator-text {
      font-size: $font-size-extra-small;
      color: $text-secondary;
    }

    :deep(.el-table__row) {
      transition: background-color 0.3s ease, transform 0.2s ease;

      &:hover {
        background-color: rgba(var(--el-color-primary-rgb), 0.05) !important;
      }
    }

    :deep(.el-table__body tr.current-row > td.el-table__cell) {
      background-color: rgba(var(--el-color-primary-rgb), 0.08) !important;
    }
  }

  .status-tag-anim {
    animation: status-tag-pulse 3s ease-in-out infinite;
    transition: all 0.3s ease;
    position: relative;

    &.glow-primary-tag {
      box-shadow: 0 0 8px rgba(var(--el-color-primary-rgb), 0.6);
    }
    &.glow-success-tag {
      box-shadow: 0 0 8px rgba(var(--el-color-success-rgb), 0.6);
    }
    &.glow-warning-tag {
      box-shadow: 0 0 8px rgba(var(--el-color-warning-rgb), 0.6);
    }
    &.glow-danger-tag {
      box-shadow: 0 0 10px rgba(var(--el-color-danger-rgb), 0.7);
      animation: status-tag-pulse 2s ease-in-out infinite, tag-shake 5s ease-in-out infinite;
    }
    &.glow-info-tag {
      box-shadow: 0 0 6px rgba(var(--el-color-info-rgb), 0.5);
    }
  }

  .status-transition-table {
    :deep(.el-table__row.animation-row td.el-table__cell) {
      transition: background-color 0.4s ease;
    }
  }

  .status-pagination-row {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }

  .confirm-alert {
    margin-bottom: 20px;

    .confirm-info {
      margin-top: 8px;

      p {
        margin: 4px 0;
        font-size: $font-size-extra-small;
        color: $text-regular;
      }

      strong {
        color: $danger-color;
      }
    }
  }

  .confirm-form {
    .ml-10 {
      margin-left: 10px;
    }
  }

  .hf-info {
    margin-top: 8px;

    p {
      margin: 4px 0;
      font-size: $font-size-extra-small;
    }

    strong {
      color: $danger-color;
    }
  }

  .batch-result-summary {
    margin-bottom: 16px;
  }

  .mt-15 {
    margin-top: 15px;
  }

  :deep(.status-dialog-zoom) {
    animation: dialog-zoom-in 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);

    .el-dialog__headerbtn {
      transition: transform 0.2s ease;

      &:hover {
        transform: rotate(90deg);
      }
    }

    &.dialog-leave-active {
      animation: dialog-slide-out 0.22s ease-in forwards;
    }
  }

  :deep(.status-dialog-shake) {
    animation: dialog-zoom-in 0.25s ease-out, tag-shake 0.4s ease 0.2s;
  }
</style>
