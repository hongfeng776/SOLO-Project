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
          <el-button :icon="UploadFilled" @click="handleUpload">上传资源</el-button>
          <el-dropdown class="dropdown-hover-shadow" trigger="click" @command="handleBatchCommand">
            <el-button :disabled="selectedRows.length === 0">
              批量操作<el-icon class="el-icon--right"><MoreFilled /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="weight">批量修改权重</el-dropdown-item>
                <el-dropdown-item command="online">批量上架</el-dropdown-item>
                <el-dropdown-item command="offline">批量下架</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button :icon="DataAnalysis" @click="handleOpenTrace">溯源查询</el-button>
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
        <el-table-column prop="materialCode" label="素材编码" width="150">
          <template #default="{ row }">
            <el-tooltip v-if="row.materialCode" :content="row.materialCode" placement="top">
              <span class="material-code">{{ row.materialCode || '-' }}</span>
            </el-tooltip>
            <span v-else>-</span>
          </template>
        </el-table-column>
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
        <el-table-column label="上架控制" width="130" align="center">
          <template #default="{ row }">
            <el-tooltip
              v-if="!canEditRow(row)"
              :content="permissionFilter.canHandleViolation ? '当前状态不可操作' : '无权限操作此状态素材'"
              placement="top"
            >
              <span
                class="state-toggle-btn disabled-state"
                :class="{ shake: shakingBtnId === row.id }"
                @click="triggerShake(row.id)"
              >
                <el-switch :model-value="row.status === 'published'" disabled />
              </span>
            </el-tooltip>
            <span v-else class="state-toggle-wrapper" @click.stop>
              <el-switch
                :model-value="row.status === 'published'"
                :loading="stateSwitchLoadingId === row.id"
                :disabled="row.status === 'violation' || row.status === 'blocked' ? !permissionFilter.canHandleViolation : false"
                inline-prompt
                active-text="上架"
                inactive-text="下架"
                style="--el-switch-on-color: #67c23a; --el-switch-off-color: #909399"
                class="state-switch slide-transition"
                @change="(v: boolean) => handleInlineToggle(row, v)"
              />
            </span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="110" align="center">
          <template #default="{ row }">
            <div class="status-cell">
              <StatusTag :status="row.status" type="resource" />
              <el-tag
                v-if="rowErrors.has(row.id)"
                type="danger"
                size="small"
                effect="dark"
                class="error-tag"
              >
                异常
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="sortWeight" label="权重" width="70" align="center" sortable />
        <el-table-column prop="categoryName" label="分类" width="100" align="center" />
        <el-table-column prop="source" label="来源" width="100" align="center" show-overflow-tooltip />
        <el-table-column prop="createdAt" label="创建时间" width="160" align="center">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="360" fixed="right" align="center">
          <template #default="{ row }">
            <el-tooltip v-if="!canEditRow(row)" content="无权限编辑" placement="top">
              <el-button
                link
                type="primary"
                size="small"
                class="state-action-btn disabled-btn"
                :class="{ 'btn-shake': shakingBtnId === row.id * 10 + 1 }"
                @click="triggerShake(row.id * 10 + 1)"
              >
                <el-icon><Edit /></el-icon>编辑
              </el-button>
            </el-tooltip>
            <el-tooltip v-else content="分步编辑" placement="top">
              <el-button
                link
                type="primary"
                size="small"
                class="state-action-btn ripple btn-hover-scale"
                @click="openEditDialog(row)"
              >
                <el-icon><Edit /></el-icon>编辑
              </el-button>
            </el-tooltip>

            <el-button
              v-if="row.status === 'pending' && permissionFilter.allowedStatuses.includes('pending')"
              link
              type="success"
              size="small"
              class="state-action-btn ripple btn-hover-scale"
              @click="onStateToggle(row, 'approved')"
            >
              <el-icon><CircleCheck /></el-icon>审核
            </el-button>

            <el-button
              v-if="row.status === 'offline' && permissionFilter.allowedStatuses.includes('offline')"
              link
              type="warning"
              size="small"
              class="state-action-btn ripple btn-hover-scale"
              @click="onStateToggle(row, 'published')"
            >
              <el-icon><Top /></el-icon>上架申请
            </el-button>

            <el-button
              v-if="row.status === 'published' && permissionFilter.allowedStatuses.includes('published')"
              link
              type="info"
              size="small"
              class="state-action-btn ripple btn-hover-scale"
              @click="onStateToggle(row, 'offline')"
            >
              <el-icon><Bottom /></el-icon>下架
            </el-button>

            <el-tooltip content="状态溯源" placement="top">
              <el-button
                link
                size="small"
                class="state-action-btn ripple btn-hover-scale"
                style="color: #909399"
                @click="openStateHistory(row)"
              >
                <el-icon><Clock /></el-icon>溯源
              </el-button>
            </el-tooltip>
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
            <el-icon color="#67c23a"><CircleCheck /></el-icon>
            <span>数据一致性校验通过</span>
          </div>
          <div v-else class="consistency-fail">
            <div class="consistency-fail-header">
              <el-icon color="#f56c6c"><CircleClose /></el-icon>
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

    <el-dialog
      v-model="stateDialogVisible"
      title="状态变更"
      width="520px"
      class="state-dialog scale-dialog"
      :close-on-click-modal="false"
    >
      <div v-loading="stateDialogLoading" class="state-dialog-content">
        <div v-if="stateChangeTarget" class="state-info">
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="素材名称">
              <el-tooltip v-if="stateChangeTarget.title.length > 20" :content="stateChangeTarget.title" placement="top">
                <span>{{ stateChangeTarget.title }}</span>
              </el-tooltip>
              <span v-else>{{ stateChangeTarget.title }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="目标状态">
              <StatusTag :status="stateChangeTarget.status" type="resource" />
            </el-descriptions-item>
          </el-descriptions>
        </div>
        <el-alert
          style="margin-top: 16px"
          type="warning"
          :closable="false"
          show-icon
          title="请确认状态变更是否正确，操作将联动更新展示权重并写入日志"
        />
      </div>
      <template #footer>
        <el-button @click="stateDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="stateDialogLoading" @click="confirmStateChange(false)">
          确认变更
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="confirmDialogVisible"
      title="二次确认"
      width="480px"
      class="scale-dialog"
      type="warning"
    >
      <div v-if="confirmDialogData">
        <template v-if="confirmDialogData.frequentWarning">
          <el-alert type="error" :closable="false" show-icon
            :title="`近1小时内已变更${confirmDialogData.recentChanges}次状态，操作过于频繁`" />
          <p style="margin: 12px 0; color: #606266">是否仍然继续执行本次状态变更？</p>
        </template>
        <template v-else-if="confirmDialogData.relatedWorks">
          <el-alert type="warning" :closable="false" show-icon title="该素材存在关联使用作品" />
          <el-descriptions :column="1" size="small" style="margin-top: 12px" border>
            <el-descriptions-item label="引用作品数">{{ confirmDialogData.relatedWorks.referencedWorks }}</el-descriptions-item>
            <el-descriptions-item label="累计下载量">{{ confirmDialogData.relatedWorks.activeDownloads }}</el-descriptions-item>
          </el-descriptions>
          <p style="margin: 12px 0; color: #606266">下架将影响关联作品展示，是否确认继续？</p>
        </template>
      </div>
      <template #footer>
        <el-button @click="confirmDialogVisible = false">取消</el-button>
        <el-button type="warning" @click="proceedAfterConfirm">确认执行</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="batchStateDialogVisible" title="批量状态变更" width="460px" class="scale-dialog">
      <div class="batch-state-content" v-loading="batchStateLoading">
        <p>已选择 <b style="color: var(--el-color-primary)">{{ selectedRows.length }}</b> 条素材</p>
        <p>目标状态：<StatusTag :status="batchTargetStatus" type="resource" /></p>
        <el-alert type="info" :closable="false" show-icon
          title="系统将自动按权限过滤可操作素材，异常素材将单独标注" style="margin-top: 12px" />
      </div>
      <template #footer>
        <el-button @click="batchStateDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="batchStateLoading" @click="doBatchChangeState">
          确认批量变更
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="historyDialogVisible" title="素材状态变更溯源" width="820px" class="scale-dialog">
      <div v-loading="skeletonLoading" class="history-content">
        <template v-if="!skeletonLoading">
          <el-row :gutter="16" style="margin-bottom: 16px">
            <el-col :span="8">
              <el-statistic title="近30天变更次数" :value="historyData.totalChanges" />
            </el-col>
            <el-col :span="8">
              <div class="compliance-box">
                <span class="label">合规等级</span>
                <el-tag
                  :type="historyData.complianceLevel === 'A' ? 'success'
                    : historyData.complianceLevel === 'B' ? 'warning'
                    : historyData.complianceLevel === 'C' ? 'danger' : 'info'"
                  size="large" effect="dark"
                >
                  {{ historyData.complianceLevel }}级
                </el-tag>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="warning-box">
                <el-icon v-if="historyData.warnings.length === 0" color="#67c23a"><CircleCheck /></el-icon>
                <el-icon v-else color="#e6a23c"><Warning /></el-icon>
                <span style="margin-left: 6px">
                  {{ historyData.warnings.length === 0 ? '校验通过' : historyData.warnings.length + '项异常' }}
                </span>
              </div>
            </el-col>
          </el-row>

          <el-alert
            v-if="historyData.warnings.length > 0"
            v-for="(w, i) in historyData.warnings"
            :key="i"
            type="error"
            style="margin-bottom: 8px"
            :closable="false"
            show-icon
            :title="w"
          />

          <div class="history-timeline">
            <h4 style="margin: 16px 0 8px">状态变更记录</h4>
            <el-timeline v-if="historyData.history.length > 0">
              <el-timeline-item
                v-for="(log, idx) in historyData.history"
                :key="idx"
                :type="log.result === 'success' ? 'success' : 'danger'"
                :timestamp="log.createdAt"
                placement="top"
              >
                <el-card shadow="never" size="small">
                  <div class="log-item">
                    <div class="log-header">
                      <span class="log-action">{{ log.action }}</span>
                      <span class="log-user" v-if="log.username">{{ log.username }}</span>
                    </div>
                    <el-tooltip
                      v-if="log.detail && log.detail.length > 80"
                      :content="log.detail"
                      placement="top"
                    >
                      <div class="log-detail">{{ parseLogDetail(log.detail) }}</div>
                    </el-tooltip>
                    <div v-else class="log-detail">{{ parseLogDetail(log.detail) }}</div>
                  </div>
                </el-card>
              </el-timeline-item>
            </el-timeline>
            <el-empty v-else description="暂无变更记录" />
          </div>
        </template>

        <template v-else>
          <el-skeleton :rows="8" animated />
        </template>
      </div>
      <template #footer>
        <el-button @click="historyDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import { Search, Refresh, Plus, UploadFilled, DataAnalysis,
  Edit, MoreFilled, Top, Bottom, CircleCheck,
  CircleClose, Warning, Clock } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { DataTable, StatusTag, BatchOperation, FileUpload, ResourcePreview } from '@/components/business'
import { ResourceStatusLabel, FileTypeLabel, ResourceStatus } from '@/constants'
import * as resourceApi from '@/api/resource'
import type { ImageResource, ValidateResult, TraceResult } from '@/types'

const permissionFilter = ref<any>({ allowedStatuses: [], editableStatuses: [], isAdmin: false, canHandleViolation: false })
const stateSwitchLoadingId = ref<number | null>(null)
const stateDialogVisible = ref(false)
const stateDialogLoading = ref(false)
const stateChangeTarget = ref<{ id: number; status: string; title: string } | null>(null)
const confirmDialogVisible = ref(false)
const confirmDialogData = ref<any>(null)
const historyDialogVisible = ref(false)
const historyDialogLoading = ref(false)
const historyData = ref<any>({ history: [], complianceLevel: '', warnings: [], totalChanges: 0 })
const historyTargetId = ref<number | null>(null)
const skeletonLoading = ref(false)
const batchStateDialogVisible = ref(false)
const batchTargetStatus = ref('')
const batchStateLoading = ref(false)
const disabledRowIds = ref<Set<number>>(new Set())
const shakingBtnId = ref<number | null>(null)
const rowErrors = ref<Map<number, string>>(new Map())

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
    const res = await resourceApi.getResourceList({
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

const loadList = fetchList

const loadCategories = async () => {
  try {
    const res = await resourceApi.getCategoryList() as any
    categories.value = res.data || []
  } catch (e) {
    console.error('加载分类失败:', e)
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

const handleDownload = (resource: ImageResource) => {
  console.log('下载资源:', resource)
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
    await resourceApi.batchDeleteResource(ids)
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

const refreshRow = (id: number, newData?: any) => {
  if (newData) {
    const idx = tableData.value.findIndex(r => r.id === id)
    if (idx !== -1) {
      tableData.value[idx] = { ...tableData.value[idx], ...newData }
    }
  } else {
    refreshRows([id])
  }
}

const refreshRows = (ids: number[]) => {
  const res = resourceApi.getResourceList({ page: page.value, pageSize: pageSize.value })
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
      const res = await resourceApi.validateCreate({ title: createForm.title })
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
    const validateRes = await resourceApi.validateCreate(createForm)
    const result: ValidateResult = validateRes.data
    if (!result.valid) {
      validateErrors.value = result.errors
      createDialogShaking.value = true
      setTimeout(() => { createDialogShaking.value = false }, 300)
      return
    }
    validateErrors.value = []

    await resourceApi.createWithValidation(createForm)
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

const openEditDialog = (row: ImageResource) => {
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
    await resourceApi.updateWithConstraint(editingResourceId.value, data)
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
    openBatchStateChange('published')
  } else if (command === 'offline') {
    openBatchStateChange('offline')
  }
}

const handleBatchWeight = async () => {
  const ids = selectedRows.value.map((item) => item.id)
  batchWeightSubmitting.value = true
  try {
    const res = await resourceApi.batchUpdateWeight(ids, batchWeightValue.value)
    const result = res.data
    processBatchResult(result, ids)
    batchWeightDialogVisible.value = false
  } catch (error) {
    console.error('批量修改权重失败:', error)
  } finally {
    batchWeightSubmitting.value = false
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
    const res = await resourceApi.traceMaterial(traceKeyword.value.trim())
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

async function loadPermissionFilter() {
  try {
    const res = await resourceApi.getPermissionFilter() as any
    permissionFilter.value = res.data || permissionFilter.value
  } catch (e) { /* ignore */ }
}

function canEditRow(row: ImageResource): boolean {
  return permissionFilter.value.allowedStatuses.includes(row.status)
}

function triggerShake(id: number) {
  shakingBtnId.value = id
  setTimeout(() => shakingBtnId.value = null, 300)
}

async function onStateToggle(row: ImageResource, targetStatus: string) {
  if (!canEditRow(row)) {
    triggerShake(row.id)
    ElMessage.warning('无权限操作此状态的素材')
    return
  }
  if (row.status === 'violation' || row.status === 'blocked') {
    if (!permissionFilter.value.canHandleViolation) {
      triggerShake(row.id)
      ElMessage.warning(`${row.status === 'violation' ? '违规' : '风控'}状态素材禁止编辑上架操作`)
      return
    }
  }
  stateChangeTarget.value = { id: row.id, status: targetStatus, title: row.title }
  stateDialogVisible.value = true
}

async function confirmStateChange(skipConfirm = false) {
  if (!stateChangeTarget.value) return
  stateDialogLoading.value = true
  try {
    const res = await resourceApi.changeStateWithValidation(
      stateChangeTarget.value.id,
      stateChangeTarget.value.status,
      skipConfirm
    ) as any
    const data = res.data
    if (data.needConfirm) {
      confirmDialogData.value = data
      confirmDialogVisible.value = true
      stateDialogLoading.value = false
      return
    }
    if (data.success) {
      ElMessage({ type: 'success', message: '状态变更成功', duration: 2000 })
      refreshRow(stateChangeTarget.value.id, data.resource)
      stateDialogVisible.value = false
      stateChangeTarget.value = null
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '状态变更失败')
  } finally {
    stateDialogLoading.value = false
  }
}

async function proceedAfterConfirm() {
  confirmDialogVisible.value = false
  if (!stateChangeTarget.value) return
  stateDialogLoading.value = true
  try {
    const res = await resourceApi.changeStateWithValidation(
      stateChangeTarget.value.id,
      stateChangeTarget.value.status,
      true
    ) as any
    if (res.data?.success) {
      ElMessage({ type: 'success', message: '状态变更成功', duration: 2000 })
      refreshRow(stateChangeTarget.value.id, res.data.resource)
      stateDialogVisible.value = false
      stateChangeTarget.value = null
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '状态变更失败')
  } finally {
    stateDialogLoading.value = false
  }
}

function openBatchStateChange(targetStatus: string) {
  batchTargetStatus.value = targetStatus
  batchStateDialogVisible.value = true
}

async function doBatchChangeState() {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请先选择素材')
    return
  }
  batchStateLoading.value = true
  rowErrors.value.clear()
  disabledRowIds.value.clear()
  try {
    const res = await resourceApi.batchChangeState(
      selectedRows.value.map(r => r.id),
      batchTargetStatus.value
    ) as any
    const data = res.data
    if (data.updated > 0) {
      ElNotification({
        type: 'success',
        title: '批量操作完成',
        message: `成功${data.updated}条，失败${data.failedItems.length}条`,
        duration: 3000
      })
      for (const id of data.successIds) refreshRow(id)
      for (const item of data.failedItems) {
        rowErrors.value.set(item.id, item.reason)
      }
      for (const id of data.permissionBlockedIds || []) {
        disabledRowIds.value.add(id)
      }
      refreshRows(data.successIds)
    } else if (data.failedItems.length > 0) {
      const firstReason = data.failedItems[0]?.reason
      ElMessageBox.alert(
        `<div>批量操作全部失败，共 ${data.failedItems.length} 条异常。<br/>首条原因：${firstReason}</div>`,
        '批量操作失败',
        { dangerouslyUseHTMLString: true, type: 'error', confirmButtonText: '知道了' }
      )
      for (const item of data.failedItems) {
        rowErrors.value.set(item.id, item.reason)
      }
    }
    batchStateDialogVisible.value = false
  } catch (e: any) {
    ElMessage.error(e?.message || '批量操作失败')
  } finally {
    batchStateLoading.value = false
  }
}

async function openStateHistory(row: ImageResource) {
  historyTargetId.value = row.id
  historyDialogVisible.value = true
  historyDialogLoading.value = true
  skeletonLoading.value = true
  try {
    const res = await resourceApi.getStateChangeHistory(row.id, 30) as any
    historyData.value = res.data || { history: [], complianceLevel: '', warnings: [], totalChanges: 0 }
  } catch (e) {
    ElMessage.error('加载历史记录失败')
  } finally {
    await new Promise(r => setTimeout(r, 600))
    skeletonLoading.value = false
    historyDialogLoading.value = false
  }
}

function handleInlineToggle(row: ImageResource, checked: boolean) {
  const target = checked ? 'published' : 'offline'
  onStateToggle(row, target)
}

function parseLogDetail(detail: string | undefined | null): string {
  if (!detail) return '-'
  try {
    const parsed = JSON.parse(detail)
    if (parsed.from || parsed.to) {
      return `${parsed.from || ''} → ${parsed.to || ''}`
    }
    return detail
  } catch {
    return detail
  }
}

onMounted(() => {
  loadPermissionFilter()
  loadList()
  loadCategories()
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

.state-switch {
  &.slide-transition {
    transition: all 0.3s ease;
    :deep(.el-switch__core) {
      transition: all 0.3s ease;
    }
    :deep(.el-switch__action) {
      transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
  }
}
.state-toggle-wrapper { display: inline-block; cursor: pointer; }
.state-toggle-btn.disabled-state {
  cursor: not-allowed;
  opacity: 0.5;
}

.scale-dialog {
  :deep(.el-dialog) {
    animation: dialog-zoom-in 0.25s cubic-bezier(0.4, 0, 0.2, 1) both;
    transform-origin: center center;
  }
  :deep(.el-dialog__wrapper) {
    &.dialog-fade-leave-active .el-dialog {
      animation: dialog-slide-down 0.2s ease-out both !important;
    }
  }
}
@keyframes dialog-zoom-in {
  0% { opacity: 0; transform: scale(0.85); }
  100% { opacity: 1; transform: scale(1); }
}
@keyframes dialog-slide-down {
  0% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(30px); }
}

.btn-shake, .shake, .state-action-btn {
  &.shake, &.btn-shake {
    animation: btn-shake 0.3s ease-in-out !important;
  }
}
@keyframes btn-shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}

.ripple { position: relative; overflow: hidden; }
.btn-hover-scale {
  transition: transform 0.15s ease;
  &:hover { transform: scale(1.08); }
  &:active { transform: scale(0.95); }
}

.status-cell { display: flex; align-items: center; justify-content: center; gap: 4px; }
.error-tag { animation: tag-pulse 0.6s ease infinite alternate; }
@keyframes tag-pulse { from { transform: scale(1); } to { transform: scale(1.08); } }

.material-code { font-family: 'Courier New', monospace; color: var(--el-color-primary); font-size: 12px; }

.compliance-box { display: flex; flex-direction: column; gap: 4px; .label { color: #909399; font-size: 13px; } }
.warning-box { display: flex; align-items: center; height: 100%; }
.state-action-btn { position: relative; margin: 0 2px; }
.disabled-btn { opacity: 0.4; cursor: not-allowed; text-decoration: none !important; }

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

.state-dialog-content {
  .state-info {
    margin-bottom: 12px;
  }
}

.history-content {
  .log-item {
    .log-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;

      .log-action {
        font-weight: 600;
        color: $text-primary;
      }

      .log-user {
        font-size: $font-size-extra-small;
        color: $text-secondary;
      }
    }

    .log-detail {
      font-size: $font-size-small;
      color: $text-regular;
      word-break: break-all;
    }
  }
}

:deep(.row-highlight) {
  background-color: #ecf5ff !important;
}
</style>