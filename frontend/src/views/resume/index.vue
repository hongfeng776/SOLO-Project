<template>
  <div class="resume-page">
    <SearchForm @search="handleSearch" @reset="handleReset">
      <el-form-item label="姓名" prop="name">
        <el-input v-model="searchForm.name" placeholder="请输入姓名" clearable style="width: 140px" class="search-input-focus" />
      </el-form-item>
      <el-form-item label="手机号" prop="phone">
        <el-input v-model="searchForm.phone" placeholder="请输入手机号" clearable style="width: 140px" class="search-input-focus" />
      </el-form-item>
      <el-form-item label="解析状态" prop="parseStatus">
        <el-select v-model="searchForm.parseStatus" placeholder="全部" clearable style="width: 120px">
          <el-option v-for="item in PARSE_STATUS_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="匹配等级" prop="matchLevel">
        <el-select v-model="searchForm.matchLevel" placeholder="全部" clearable style="width: 120px">
          <el-option v-for="item in MATCH_LEVEL_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="简历标记" prop="resumeTag">
        <el-select v-model="searchForm.resumeTag" placeholder="全部" clearable style="width: 120px">
          <el-option v-for="item in RESUME_TAG_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="收录状态" prop="status">
        <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 120px">
          <el-option v-for="(label, key) in ResumeStatusLabel" :key="key" :label="label" :value="key" />
        </el-select>
      </el-form-item>
      <el-form-item label="应聘岗位" prop="jobId">
        <el-input-number v-model="searchForm.jobId" :min="1" placeholder="岗位ID" style="width: 120px" />
      </el-form-item>
      <el-form-item label="来源渠道" prop="source">
        <el-select v-model="searchForm.source" placeholder="全部" clearable style="width: 120px">
          <el-option v-for="item in RESUME_SOURCE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="匹配度" prop="matchScoreMin">
        <el-slider
          v-model="matchScoreRange"
          range
          :min="0"
          :max="100"
          :step="5"
          style="width: 160px"
          @change="handleMatchScoreChange"
        />
      </el-form-item>
    </SearchForm>

    <el-collapse v-model="screenPanelActive" class="screen-panel">
      <el-collapse-item title="高级筛选条件" name="screen">
        <el-form :model="screenConditions" label-width="110px" size="small" inline>
          <el-form-item label="学历">
            <el-select v-model="screenConditions.education" placeholder="不限" clearable style="width: 100px">
              <el-option v-for="item in EDUCATION_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="最低学历">
            <el-select v-model="screenConditions.minEducation" placeholder="不限" clearable style="width: 100px">
              <el-option v-for="item in EDUCATION_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="应届生">
            <el-switch
              v-model="screenConditions.isFreshGraduate"
              active-text="是"
              inactive-text="否"
              @change="handleFreshGraduateChange"
            />
          </el-form-item>
          <el-form-item label="最小经验(年)">
            <el-input-number
              v-model="screenConditions.minExperience"
              :min="0"
              :max="50"
              :precision="1"
              style="width: 110px"
              @change="handleExperienceChange"
            />
          </el-form-item>
          <el-form-item label="最大经验(年)">
            <el-input-number
              v-model="screenConditions.maxExperience"
              :min="0"
              :max="50"
              :precision="1"
              style="width: 110px"
              @change="handleExperienceChange"
            />
          </el-form-item>
          <el-form-item label="最低薪资(K)">
            <el-input-number v-model="screenConditions.minSalary" :min="0" style="width: 110px" />
          </el-form-item>
          <el-form-item label="最高薪资(K)">
            <el-input-number v-model="screenConditions.maxSalary" :min="0" style="width: 110px" />
          </el-form-item>
          <el-form-item label="工作地点">
            <el-input v-model="screenConditions.city" placeholder="城市" clearable style="width: 100px" class="search-input-focus" />
          </el-form-item>
          <el-form-item label="技能标签">
            <el-select
              v-model="screenConditions.skillTags"
              multiple
              filterable
              allow-create
              default-first-option
              placeholder="输入技能标签"
              style="width: 180px"
            />
          </el-form-item>
          <el-form-item label="匹配等级">
            <el-select v-model="screenConditions.matchLevel" placeholder="不限" clearable style="width: 100px">
              <el-option v-for="item in MATCH_LEVEL_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="简历标记">
            <el-select v-model="screenConditions.resumeTag" placeholder="不限" clearable style="width: 100px">
              <el-option v-for="item in RESUME_TAG_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
        </el-form>
        <div v-if="screenConflictMsg" class="screen-conflict-warning">
          <el-alert type="error" :title="`条件冲突：${screenConflictMsg}`" show-icon :closable="false" />
        </div>
        <div class="screen-actions">
          <el-button type="primary" @click="handleScreenResumes">筛选</el-button>
          <el-button type="success" @click="handleBatchScreenResumes">批量筛选(含记录)</el-button>
          <el-button @click="resetScreenConditions">重置条件</el-button>
          <el-button type="info" @click="saveTemplateDialogVisible = true">保存为模板</el-button>
          <span v-if="screenResultCount > 0" class="screen-result-count">筛选结果: {{ screenResultCount }}条</span>
        </div>
        <div v-if="screenTemplates.length > 0" class="screen-templates">
          <span class="template-label">筛选模板：</span>
          <el-tag
            v-for="tpl in screenTemplates"
            :key="tpl.id"
            class="template-tag"
            effect="plain"
            @click="handleUseScreenTemplate(tpl)"
          >
            {{ tpl.name }}({{ tpl.useCount || 0 }})
            <el-icon class="template-delete-icon" @click.stop="handleDeleteScreenTemplate(tpl)"><Delete /></el-icon>
          </el-tag>
        </div>
      </el-collapse-item>
    </el-collapse>

    <ProTable
      :data="tableData"
      :loading="loading"
      :total="total"
      :page="page"
      :page-size="pageSize"
      show-selection
      border
      highlight-current-row
      :row-class-name="getRowClassName"
      @selection-change="handleSelectionChange"
      @page-change="handlePageChange"
      @header-dragend="handleHeaderDragend"
    >
      <template #toolbar>
        <div class="toolbar-left">
          <el-upload
            class="upload-single"
            :before-upload="handleBeforeSingleUpload"
            :http-request="handleSingleUpload"
            :show-file-list="false"
            :disabled="!selectedJobId"
          >
            <el-button type="primary" :icon="Upload" @click="checkJobAvailable">
              上传简历
            </el-button>
          </el-upload>
          <el-upload
            class="upload-batch"
            multiple
            :before-upload="handleBeforeBatchUpload"
            :http-request="handleBatchUploadRequest"
            :show-file-list="false"
            :disabled="!selectedJobId"
          >
            <el-button type="success" :icon="UploadFilled" @click="checkJobAvailable">
              批量上传
            </el-button>
          </el-upload>
          <el-select
            v-model="selectedJobId"
            placeholder="请选择应聘岗位"
            style="width: 180px; margin-left: 8px"
            clearable
          >
            <el-option v-for="job in availableJobs" :key="job.id" :label="job.title" :value="job.id" />
          </el-select>
          <el-button
            type="warning"
            :icon="RefreshRight"
            :disabled="selectedIds.length === 0"
            @click="handleBatchRetryParse"
          >
            批量重试解析
          </el-button>
          <el-button
            type="info"
            :icon="VideoPlay"
            :disabled="selectedIds.length === 0"
            @click="handleBatchTriggerParse"
          >
            批量触发解析
          </el-button>
          <el-button
            type="danger"
            :icon="Delete"
            :disabled="selectedIds.length === 0"
            @click="handleBatchDelete"
          >
            批量删除
          </el-button>
          <el-button type="info" :icon="Download" @click="handleExportExceptionList">
            导出异常清单
          </el-button>
          <el-divider direction="vertical" />
          <el-button
            type="success"
            :disabled="selectedIds.length === 0"
            @click="handleBatchTag(ResumeTag.QUALITY)"
          >
            标记优质
          </el-button>
          <el-button
            type="warning"
            :disabled="selectedIds.length === 0"
            @click="handleBatchTag(ResumeTag.FOLLOW_UP)"
          >
            标记待跟进
          </el-button>
          <el-button
            type="danger"
            :disabled="selectedIds.length === 0"
            @click="handleBatchTag(ResumeTag.INVALID)"
          >
            标记无效
          </el-button>
          <el-button type="primary" @click="handleRefreshMatchLevels">
            刷新匹配等级
          </el-button>
          <el-button type="info" @click="handleViewOptimization">
            匹配优化分析
          </el-button>
        </div>
        <div class="toolbar-right">
          <el-tag type="success" effect="plain">解析成功: {{ stats.success }}</el-tag>
          <el-tag type="warning" effect="plain">部分解析: {{ stats.partial }}</el-tag>
          <el-tag type="danger" effect="plain">解析失败: {{ stats.failed }}</el-tag>
          <el-tag type="info" effect="plain">待解析: {{ stats.pending }}</el-tag>
        </div>
      </template>

      <template #empty>
        <EmptyState description="暂无简历数据，请点击上方按钮上传" />
      </template>

      <el-table-column type="selection" width="42" fixed="left" />
      <el-table-column prop="id" label="ID" width="60" align="center" />
      <el-table-column prop="name" label="姓名" :width="colWidths.name || 90">
        <template #default="{ row }">
          <div class="cell-name">
            <span>{{ row.name }}</span>
            <el-tag
              v-if="row.isLocked"
              type="danger"
              size="small"
              effect="dark"
              style="margin-left: 4px"
              :title="row.lockReason"
            >
              锁定
            </el-tag>
            <el-tag
              v-if="row.isDuplicate"
              type="warning"
              size="small"
              effect="plain"
              style="margin-left: 4px"
            >
              重复
            </el-tag>
            <el-tag
              v-if="row.isFakeResume"
              type="danger"
              size="small"
              effect="dark"
              style="margin-left: 4px"
              :title="row.fakeCheckReason"
            >
              可疑
            </el-tag>
            <el-tag
              v-if="row.isBlankResume"
              type="info"
              size="small"
              effect="plain"
              style="margin-left: 4px"
            >
              空白
            </el-tag>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="性别" :width="colWidths.gender || 55" align="center">
        <template #default="{ row }">{{ GenderLabel[row.gender] || '-' }}</template>
      </el-table-column>
      <el-table-column prop="age" label="年龄" :width="colWidths.age || 55" align="center" />
      <el-table-column prop="phone" label="手机号" :width="colWidths.phone || 120" />
      <el-table-column label="应聘岗位" :width="colWidths.job || 140">
        <template #default="{ row }">
          <span :title="row.job?.title || '-'">{{ row.job?.title || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="匹配度" :width="colWidths.matchScore || 110" align="center">
        <template #default="{ row }">
          <div class="match-score-wrapper">
            <el-progress
              :percentage="row.matchScore || 0"
              :color="getMatchScoreColor(row.matchScore)"
              :stroke-width="8"
              :show-text="true"
            />
            <el-tag
              size="small"
              :type="MatchLevelType[row.matchLevel as MatchLevel] || getMatchScoreLevel(row.matchScore).type"
              effect="light"
              style="margin-top: 2px"
            >
              {{ MatchLevelLabel[row.matchLevel as MatchLevel] || getMatchScoreLevel(row.matchScore).label }}
            </el-tag>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="简历标记" :width="90" align="center">
        <template #default="{ row }">
          <el-tag
            v-if="row.resumeTag"
            size="small"
            :type="ResumeTagType[row.resumeTag as ResumeTag]"
          >
            {{ ResumeTagLabel[row.resumeTag as ResumeTag] }}
          </el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="技能标签" :width="120" show-overflow-tooltip>
        <template #default="{ row }">
          <template v-if="row.skillTags && safeJsonParse(row.skillTags).length > 0">
            <el-tag
              v-for="(tag, idx) in safeJsonParse(row.skillTags).slice(0, 3)"
              :key="idx"
              size="small"
              type="info"
              effect="plain"
              style="margin: 1px"
            >
              {{ tag }}
            </el-tag>
            <span v-if="safeJsonParse(row.skillTags).length > 3" class="more-tags">+{{ safeJsonParse(row.skillTags).length - 3 }}</span>
          </template>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="学历" :width="colWidths.education || 70" align="center">
        <template #default="{ row }">{{ EducationLabel[row.education] || '-' }}</template>
      </el-table-column>
      <el-table-column prop="experience" label="经验(年)" :width="colWidths.experience || 75" align="center" />
      <el-table-column prop="currentPosition" label="当前职位" :width="colWidths.currentPosition || 120" show-overflow-tooltip />
      <el-table-column prop="expectedSalary" label="期望薪资" :width="colWidths.expectedSalary || 90" />
      <el-table-column prop="city" label="所在城市" :width="colWidths.city || 80" />
      <el-table-column label="解析状态" :width="colWidths.parseStatus || 100" align="center">
        <template #default="{ row }">
          <el-tooltip
            v-if="row.parseStatus === ParseStatus.FAILED || row.parseStatus === ParseStatus.PARTIAL"
            :content="getParseTooltip(row)"
            placement="top"
          >
            <el-tag :type="ParseStatusType[row.parseStatus as ParseStatus]" size="small" effect="dark">
              {{ ParseStatusLabel[row.parseStatus as ParseStatus] }}
            </el-tag>
          </el-tooltip>
          <el-tag v-else :type="ParseStatusType[row.parseStatus as ParseStatus]" size="small">
            {{ ParseStatusLabel[row.parseStatus as ParseStatus] || '-' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="流程状态" :width="colWidths.status || 90" align="center">
        <template #default="{ row }">
          <el-tag :type="ResumeStatusType[row.status]" size="small">
            {{ ResumeStatusLabel[row.status] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="来源" :width="colWidths.source || 90">
        <template #default="{ row }">
          {{ ResumeSourceLabel[row.source as ResumeSource] || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="收录信息" :width="colWidths.collect || 160">
        <template #default="{ row }">
          <div class="collect-info">
            <div>收录人: {{ row.collectorName || '-' }}</div>
            <div>时间: {{ formatDate(row.collectTime) }}</div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="操作" :width="300" fixed="right" align="center">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleView(row)">详情</el-button>
          <el-button
            type="primary"
            link
            size="small"
            v-if="row.parseStatus === ParseStatus.PARTIAL || row.parseStatus === ParseStatus.FAILED"
            @click="handleCompleteInfo(row)"
          >
            补全信息
          </el-button>
          <el-button
            type="success"
            link
            size="small"
            v-if="row.parseStatus === ParseStatus.FAILED"
            @click="handleRetryParse(row)"
          >
            重试解析
          </el-button>
          <el-button
            type="warning"
            link
            size="small"
            v-if="row.isLocked && currentUserRole === 'admin'"
            @click="handleUnlock(row)"
          >
            解锁
          </el-button>
          <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
          <el-dropdown @command="(cmd) => handleStatusChange(row, cmd)">
            <el-button type="success" link size="small" :disabled="row.isLocked || row.parseStatus === ParseStatus.FAILED">
              状态变更
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-for="(label, key) in ResumeStatusLabel"
                  :key="key"
                  :command="key"
                  :disabled="row.status === key"
                >
                  {{ label }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-dropdown @command="(cmd: string) => handleTagResume(row, cmd as ResumeTag)">
            <el-button type="warning" link size="small">标记</el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item v-for="item in RESUME_TAG_OPTIONS" :key="item.value" :command="item.value">
                  {{ item.label }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </ProTable>

    <el-dialog
      v-model="parseResultVisible"
      :title="parseResultData.isDuplicate ? '重复简历提醒' : '解析结果'"
      width="640px"
      class="parse-result-dialog"
      :close-on-click-modal="false"
    >
      <div class="parse-result-content">
        <el-result
          :icon="parseResultIcon"
          :title="parseResultTitle"
          :sub-title="parseResultSubTitle"
        >
          <template #extra>
            <div class="parse-result-stats">
              <el-statistic title="解析耗时" :value="parseResultData.parseDuration" suffix="ms" />
              <el-statistic
                title="成功字段"
                :value="parseResultData.parsedFields?.length || 0"
                value-style="color: #67c23a"
              />
              <el-statistic
                title="失败字段"
                :value="parseResultData.failedFields?.length || 0"
                value-style="color: #f56c6c"
              />
              <el-statistic
                title="匹配度"
                :value="parseResultData.matchScore || 0"
                suffix="分"
                :value-style="{ color: getMatchScoreColor(parseResultData.matchScore) }"
              />
            </div>
          </template>
        </el-result>

        <el-divider content-position="left">解析字段详情</el-divider>
        <div class="parse-fields-detail">
          <el-descriptions :column="3" border size="small">
            <el-descriptions-item
              v-for="field in CORE_PARSE_FIELDS"
              :key="field.key"
              :label="field.label"
            >
              <template v-if="parseResultData.parsedFields?.includes(field.key)">
                <el-tag type="success" size="small">
                  已解析: {{ getFieldDisplayValue(parseResultData, field.key) }}
                </el-tag>
              </template>
              <template v-else-if="parseResultData.abnormalFields?.includes(field.key)">
                <el-tag type="danger" size="small" effect="dark">
                  异常: 请人工补全
                </el-tag>
              </template>
              <template v-else>
                <el-tag type="info" size="small">
                  未识别
                </el-tag>
              </template>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <div v-if="parseResultData.isBlankResume" class="warning-box">
          <el-alert type="error" title="检测为空白简历" :closable="false" show-icon />
        </div>
        <div v-if="parseResultData.isFakeResume" class="warning-box">
          <el-alert
            type="error"
            :title="`可疑简历检测：${parseResultData.fakeCheckReason}`"
            :closable="false"
            show-icon
          />
        </div>
        <div v-if="parseResultData.isDuplicate" class="warning-box">
          <el-alert
            type="warning"
            :title="`该简历已存在（${parseResultData.name} / ${parseResultData.phone}），请确认是否重复收录`"
            :closable="false"
            show-icon
          />
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button
            v-if="parseResultData.parseStatus === ParseStatus.PARTIAL || parseResultData.parseStatus === ParseStatus.FAILED"
            type="primary"
            @click="handleCompleteInfoFromResult"
          >
            立即补全信息
          </el-button>
          <el-button
            v-if="parseResultData.parseStatus === ParseStatus.FAILED"
            type="warning"
            @click="handleRetryParseFromResult"
          >
            重试解析
          </el-button>
          <el-button @click="parseResultVisible = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="uploadProgressVisible" title="上传进度" width="480px" :close-on-click-modal="false" :close-on-press-escape="false">
      <div class="upload-progress-list">
        <div v-for="(item, index) in uploadProgressList" :key="index" class="upload-progress-item">
          <div class="upload-progress-header">
            <span class="file-name">{{ item.fileName }}</span>
            <span :class="['upload-status', item.status]">
              {{ item.statusText }}
            </span>
          </div>
          <el-progress
            :percentage="item.progress"
            :status="item.progress === 100 ? 'success' : item.error ? 'exception' : undefined"
          />
          <div v-if="item.error" class="upload-error" style="color: #f56c6c; font-size: 12px; margin-top: 4px">
            {{ item.error }}
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="uploadProgressVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <ModalForm
      v-model="dialogVisible"
      :title="dialogTitle"
      :form-data="formData"
      :rules="formRules"
      :loading="submitLoading"
      width="720px"
      @submit="handleSubmit"
    >
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="应聘岗位" prop="jobId">
            <el-input-number v-model="formData.jobId" :min="1" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="姓名" prop="name">
            <el-input v-model="formData.name" placeholder="请输入姓名" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item label="性别" prop="gender">
            <el-select v-model="formData.gender" placeholder="请选择" style="width: 100%">
              <el-option v-for="(label, key) in GenderLabel" :key="key" :label="label" :value="key" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="年龄" prop="age">
            <el-input-number v-model="formData.age" :min="16" :max="65" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="手机号" prop="phone">
            <el-input v-model="formData.phone" placeholder="请输入手机号" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="formData.email" placeholder="请输入邮箱" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="所在城市" prop="city">
            <el-input v-model="formData.city" placeholder="请输入城市" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="学历" prop="education">
            <el-select v-model="formData.education" placeholder="请选择" style="width: 100%">
              <el-option v-for="(label, key) in EducationLabel" :key="key" :label="label" :value="key" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="工作年限" prop="experience">
            <el-input-number v-model="formData.experience" :min="0" :precision="1" :step="0.5" style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="毕业院校" prop="school">
            <el-input v-model="formData.school" placeholder="请输入毕业院校" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="专业" prop="major">
            <el-input v-model="formData.major" placeholder="请输入专业" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="当前公司" prop="currentCompany">
            <el-input v-model="formData.currentCompany" placeholder="请输入当前公司" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="当前职位" prop="currentPosition">
            <el-input v-model="formData.currentPosition" placeholder="请输入当前职位" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="期望薪资" prop="expectedSalary">
            <el-input v-model="formData.expectedSalary" placeholder="请输入期望薪资" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="简历来源" prop="source">
            <el-select v-model="formData.source" placeholder="请选择" style="width: 100%">
              <el-option v-for="item in RESUME_SOURCE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="流程状态" prop="status" v-if="dialogTitle !== '补全简历信息'">
        <el-select v-model="formData.status" style="width: 50%">
          <el-option v-for="(label, key) in ResumeStatusLabel" :key="key" :label="label" :value="key" />
        </el-select>
      </el-form-item>
      <el-form-item label="自我评价" prop="selfEvaluation">
        <el-input v-model="formData.selfEvaluation" type="textarea" :rows="3" placeholder="请输入自我评价" />
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="formData.remark" type="textarea" :rows="2" placeholder="请输入备注" />
      </el-form-item>
    </ModalForm>

    <el-dialog v-model="detailVisible" title="简历详情" width="800px">
      <div v-if="detailData.id" class="detail-wrapper">
        <el-alert
          v-if="detailData.isLocked"
          :title="`该简历已锁定：${detailData.lockReason || '解析失败'}`"
          type="error"
          show-icon
          style="margin-bottom: 16px"
        />
        <el-alert
          v-if="detailData.isFakeResume"
          :title="`可疑简历：${detailData.fakeCheckReason}`"
          type="warning"
          show-icon
          style="margin-bottom: 16px"
        />
        <el-descriptions :column="2" border size="small" class="detail-descriptions">
          <el-descriptions-item label="姓名">{{ detailData.name }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ detailData.phone }}</el-descriptions-item>
          <el-descriptions-item label="性别">{{ GenderLabel[detailData.gender] || '-' }}</el-descriptions-item>
          <el-descriptions-item label="年龄">{{ detailData.age || '-' }}</el-descriptions-item>
          <el-descriptions-item label="邮箱">{{ detailData.email || '-' }}</el-descriptions-item>
          <el-descriptions-item label="所在城市">{{ detailData.city || '-' }}</el-descriptions-item>
          <el-descriptions-item label="应聘岗位">{{ detailData.job?.title || '-' }}</el-descriptions-item>
          <el-descriptions-item label="匹配等级">
            <el-tag :type="MatchLevelType[detailData.matchLevel as MatchLevel] || getMatchScoreLevel(detailData.matchScore).type" size="small">
              {{ MatchLevelLabel[detailData.matchLevel as MatchLevel] || getMatchScoreLevel(detailData.matchScore).label }} ({{ detailData.matchScore || 0 }}分)
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="简历标记">
            <el-tag v-if="detailData.resumeTag" :type="ResumeTagType[detailData.resumeTag as ResumeTag]" size="small">
              {{ ResumeTagLabel[detailData.resumeTag as ResumeTag] }}
            </el-tag>
            <span v-else>未标记</span>
          </el-descriptions-item>
          <el-descriptions-item label="学历">{{ EducationLabel[detailData.education] || '-' }}</el-descriptions-item>
          <el-descriptions-item label="工作年限">{{ detailData.experience || '-' }}年</el-descriptions-item>
          <el-descriptions-item label="毕业院校">{{ detailData.school || '-' }}</el-descriptions-item>
          <el-descriptions-item label="专业">{{ detailData.major || '-' }}</el-descriptions-item>
          <el-descriptions-item label="当前公司">{{ detailData.currentCompany || '-' }}</el-descriptions-item>
          <el-descriptions-item label="当前职位">{{ detailData.currentPosition || '-' }}</el-descriptions-item>
          <el-descriptions-item label="期望薪资">{{ detailData.expectedSalary || '-' }}</el-descriptions-item>
          <el-descriptions-item label="来源渠道">{{ ResumeSourceLabel[detailData.source as ResumeSource] || '-' }}</el-descriptions-item>
          <el-descriptions-item label="解析状态">
            <el-tag :type="ParseStatusType[detailData.parseStatus as ParseStatus]" size="small">
              {{ ParseStatusLabel[detailData.parseStatus as ParseStatus] || '-' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="流程状态">
            <el-tag :type="ResumeStatusType[detailData.status]">{{ ResumeStatusLabel[detailData.status] }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="收录方式">{{ ResumeCollectModeLabel[detailData.collectMode as ResumeCollectMode] || '-' }}</el-descriptions-item>
          <el-descriptions-item label="收录人">{{ detailData.collectorName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="收录时间" :span="2">{{ formatDate(detailData.collectTime) }}</el-descriptions-item>
          <el-descriptions-item label="自我评价" :span="2">{{ detailData.selfEvaluation || '-' }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ detailData.remark || '-' }}</el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">解析记录溯源</el-divider>
        <el-timeline v-if="detailData.parseLogs && detailData.parseLogs.length > 0">
          <el-timeline-item
            v-for="(log, idx) in detailData.parseLogs"
            :key="log.id"
            :timestamp="formatDate(log.parseTime || log.created_at)"
            :type="ParseStatusType[log.parseStatus as ParseStatus]"
            placement="top"
          >
            <el-card shadow="never" class="parse-log-card">
              <div class="parse-log-header">
                <el-tag :type="ParseStatusType[log.parseStatus as ParseStatus]" size="small">
                  {{ ParseStatusLabel[log.parseStatus as ParseStatus] }}
                </el-tag>
                <span v-if="log.parseDuration" class="parse-duration">耗时: {{ log.parseDuration }}ms</span>
                <span v-if="log.parseAttempts > 0" class="parse-attempts">第{{ log.parseAttempts }}次</span>
                <span v-if="log.operatorName" class="parse-operator">操作人: {{ log.operatorName }}</span>
              </div>
              <div v-if="log.errorMessage" class="parse-log-error">
                <el-alert type="error" :title="log.errorMessage" show-icon :closable="false" />
              </div>
              <div v-if="log.parsedFields" class="parse-log-fields">
                <span class="label">已解析字段:</span>
                <el-tag
                  v-for="f in safeJsonParse(log.parsedFields)"
                  :key="f"
                  type="success"
                  size="small"
                  effect="plain"
                  style="margin-right: 4px"
                >
                  {{ getFieldLabel(f) }}
                </el-tag>
              </div>
              <div v-if="log.failedFields && safeJsonParse(log.failedFields).length > 0" class="parse-log-fields">
                <span class="label">失败字段:</span>
                <el-tag
                  v-for="f in safeJsonParse(log.failedFields)"
                  :key="f"
                  type="danger"
                  size="small"
                  effect="dark"
                  style="margin-right: 4px"
                >
                  {{ getFieldLabel(f) }}
                </el-tag>
              </div>
              <div v-if="log.parserVersion" class="parse-log-version">
                解析器版本: {{ log.parserVersion }}
              </div>
            </el-card>
          </el-timeline-item>
        </el-timeline>
        <el-empty v-else description="暂无解析记录" />

        <el-divider content-position="left">筛选匹配记录</el-divider>
        <el-timeline v-if="detailData.screenLogs && detailData.screenLogs.length > 0">
          <el-timeline-item
            v-for="(log, idx) in detailData.screenLogs"
            :key="log.id"
            :timestamp="formatDate(log.created_at)"
            placement="top"
          >
            <el-card shadow="never" class="parse-log-card">
              <div class="parse-log-header">
                <el-tag size="small" type="info">{{ ScreenActionLabel[log.action as ScreenAction] || log.action }}</el-tag>
                <span v-if="log.operatorName" class="parse-operator">操作人: {{ log.operatorName }}</span>
              </div>
              <div v-if="log.matchLevelBefore || log.matchLevelAfter" class="parse-log-fields" style="margin-top: 4px">
                <span class="label">匹配等级变更:</span>
                <el-tag size="small" :type="MatchLevelType[log.matchLevelBefore as MatchLevel]">{{ MatchLevelLabel[log.matchLevelBefore as MatchLevel] || '-' }}</el-tag>
                <span style="margin: 0 4px">→</span>
                <el-tag size="small" :type="MatchLevelType[log.matchLevelAfter as MatchLevel]">{{ MatchLevelLabel[log.matchLevelAfter as MatchLevel] || '-' }}</el-tag>
              </div>
              <div v-if="log.matchScoreBefore !== undefined || log.matchScoreAfter !== undefined" class="parse-log-fields">
                <span class="label">匹配分值变更:</span>
                {{ log.matchScoreBefore ?? '-' }} → {{ log.matchScoreAfter ?? '-' }}
              </div>
              <div v-if="log.tagBefore || log.tagAfter" class="parse-log-fields">
                <span class="label">标记变更:</span>
                <el-tag size="small" :type="ResumeTagType[log.tagBefore as ResumeTag]">{{ ResumeTagLabel[log.tagBefore as ResumeTag] || '无' }}</el-tag>
                <span style="margin: 0 4px">→</span>
                <el-tag size="small" :type="ResumeTagType[log.tagAfter as ResumeTag]">{{ ResumeTagLabel[log.tagAfter as ResumeTag] || '无' }}</el-tag>
              </div>
              <div v-if="log.conflictDetected" class="parse-log-fields">
                <el-alert type="error" :title="`规则冲突: ${log.conflictReason || ''}`" show-icon :closable="false" style="margin-top: 4px" />
              </div>
              <div v-if="log.isDuplicateScreen" class="parse-log-fields">
                <el-alert type="warning" title="重复筛选操作已拦截" show-icon :closable="false" style="margin-top: 4px" />
              </div>
              <div v-if="log.screenConditions" class="parse-log-fields">
                <span class="label">筛选条件:</span>
                {{ log.screenConditions }}
              </div>
            </el-card>
          </el-timeline-item>
        </el-timeline>
        <el-empty v-else description="暂无筛选匹配记录" />
      </div>
    </el-dialog>

    <el-dialog v-model="batchResultVisible" title="批量操作结果" width="600px">
      <el-result
        :icon="batchResult.success > 0 ? 'success' : 'warning'"
        :title="`批量处理完成`"
        :sub-title="`共${batchResult.total}条，成功${batchResult.success}条，失败${batchResult.failed}条，重复${batchResult.duplicates}条`"
      />
      <el-divider />
      <div v-if="batchResult.errors && batchResult.errors.length > 0">
        <h4 style="margin-bottom: 12px">异常清单（共{{ batchResult.errors.length }}条）</h4>
        <el-table :data="batchResult.errors" size="small" border max-height="300">
          <el-table-column prop="fileName" label="文件名" width="160" show-overflow-tooltip />
          <el-table-column prop="name" label="姓名" width="80" />
          <el-table-column prop="message" label="异常原因" show-overflow-tooltip />
        </el-table>
      </div>
      <template #footer>
        <el-button @click="batchResultVisible = false">关闭</el-button>
        <el-button type="primary" @click="fetchList" :disabled="batchResult.success === 0">刷新列表</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="saveTemplateDialogVisible"
      title="保存筛选模板"
      width="460px"
      :close-on-click-modal="false"
    >
      <el-form :model="templateFormData" label-width="80px">
        <el-form-item label="模板名称" required>
          <el-input v-model="templateFormData.name" placeholder="请输入模板名称" class="search-input-focus" />
        </el-form-item>
        <el-form-item label="模板描述">
          <el-input v-model="templateFormData.description" type="textarea" :rows="2" placeholder="描述模板筛选规则" />
        </el-form-item>
        <el-form-item label="全局模板">
          <el-switch v-model="templateFormData.isGlobal" active-text="是" inactive-text="否" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="saveTemplateDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveScreenTemplate">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="optimizationVisible"
      title="匹配权重优化分析"
      width="680px"
    >
      <div v-if="optimizationData" class="optimization-content">
        <el-descriptions title="岗位匹配概况" :column="2" border>
          <el-descriptions-item label="岗位ID">{{ optimizationData.jobId }}</el-descriptions-item>
          <el-descriptions-item label="简历总数">{{ optimizationData.totalResumes }}</el-descriptions-item>
          <el-descriptions-item label="高匹配">{{ optimizationData.matchDistribution?.high || 0 }}</el-descriptions-item>
          <el-descriptions-item label="中匹配">{{ optimizationData.matchDistribution?.medium || 0 }}</el-descriptions-item>
          <el-descriptions-item label="低匹配">{{ optimizationData.matchDistribution?.low || 0 }}</el-descriptions-item>
          <el-descriptions-item label="不匹配">{{ optimizationData.matchDistribution?.none || 0 }}</el-descriptions-item>
        </el-descriptions>
        <div v-if="optimizationData.suggestions && optimizationData.suggestions.length > 0" style="margin-top: 16px">
          <h4>优化建议</h4>
          <el-alert
            v-for="(suggestion, idx) in optimizationData.suggestions"
            :key="idx"
            :title="suggestion"
            type="warning"
            show-icon
            :closable="false"
            style="margin-bottom: 8px"
          />
        </div>
        <div v-if="optimizationData.weightAnalysis && Array.isArray(optimizationData.weightAnalysis) && optimizationData.weightAnalysis.length > 0" style="margin-top: 16px">
          <h4>维度分析</h4>
          <el-table :data="optimizationData.weightAnalysis" size="small" border>
            <el-table-column prop="dimension" label="匹配维度" />
            <el-table-column prop="matchRate" label="匹配率">
              <template #default="{ row }">{{ (row.matchRate * 100).toFixed(1) }}%</template>
            </el-table-column>
            <el-table-column prop="suggestion" label="建议" />
          </el-table>
        </div>
      </div>
      <el-empty v-else description="暂无优化数据" />
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, nextTick } from 'vue';
import {
  ElMessage,
  ElMessageBox,
  type FormRules,
  type UploadRequestOptions,
  type UploadRawFile,
} from 'element-plus';
import {
  Upload,
  UploadFilled,
  Plus,
  Delete,
  RefreshRight,
  VideoPlay,
  Download,
  DataAnalysis,
} from '@element-plus/icons-vue';
import { SearchForm, ProTable, ModalForm, EmptyState } from '@/components';
import {
  getResumeListApi,
  createResumeApi,
  updateResumeApi,
  deleteResumeApi,
  batchDeleteResumeApi,
  getResumeDetailApi,
  updateResumeStatusApi,
  uploadAndParseApi,
  retryParseApi,
  batchUploadAndParseApi,
  batchRetryParseApi,
  batchTriggerParseApi,
  exportExceptionListApi,
  completeResumeInfoApi,
  unlockResumeApi,
  validateFileApi,
  screenResumesApi,
  batchScreenResumesApi,
  updateMatchLevelApi,
  refreshJobMatchLevelsApi,
  tagResumeApi,
  batchTagResumesApi,
  getScreenTemplatesApi,
  saveScreenTemplateApi,
  deleteScreenTemplateApi,
  useScreenTemplateApi,
  getScreenLogsApi,
  getMatchOptimizationDataApi,
  checkScreenPreconditionsApi,
  type ResumeItem,
  type ParseLogItem,
  type BatchResult,
  type ScreenConditions,
  type ScreenTemplateItem,
  type MatchOptimizationData,
} from '@/api/resume';
import {
  ResumeStatus,
  ResumeStatusLabel,
  ResumeStatusType,
  GenderLabel,
  EducationLabel,
  ParseStatus,
  ParseStatusLabel,
  ParseStatusType,
  ResumeSource,
  ResumeSourceLabel,
  ResumeCollectMode,
  ResumeCollectModeLabel,
  CORE_PARSE_FIELDS,
  RESUME_SOURCE_OPTIONS,
  PARSE_STATUS_OPTIONS,
  ALLOWED_RESUME_EXTENSIONS,
  MAX_RESUME_FILE_SIZE,
  getMatchScoreLevel,
  MatchLevel,
  MatchLevelLabel,
  MatchLevelType,
  MATCH_LEVEL_OPTIONS,
  ResumeTag,
  ResumeTagLabel,
  ResumeTagType,
  RESUME_TAG_OPTIONS,
  ScreenAction,
  ScreenActionLabel,
  MUTEX_SCREEN_CONDITIONS,
  SCREEN_CONDITION_FIELDS,
  EDUCATION_OPTIONS,
  MATCH_SCORE_THRESHOLDS,
} from '@/constants/recruitment';
import { useUserStore } from '@/store/modules/user';

const userStore = useUserStore();
const currentUserRole = computed(() => userStore.role || 'hr');

const loading = ref(false);
const tableData = ref<ResumeItem[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const selectedIds = ref<number[]>([]);
const selectedJobId = ref<number | undefined>();
const availableJobs = ref<{ id: number; title: string }[]>([
  { id: 1, title: 'Java开发工程师' },
  { id: 2, title: '前端开发工程师' },
  { id: 3, title: '产品经理' },
  { id: 4, title: 'UI设计师' },
  { id: 5, title: '运营专员' },
]);

const matchScoreRange = ref<[number, number]>([0, 100]);
const colWidths = reactive<Record<string, number>>({});

const stats = computed(() => {
  const result = { success: 0, partial: 0, failed: 0, pending: 0 };
  for (const row of tableData.value) {
    if (row.parseStatus === ParseStatus.SUCCESS) result.success++;
    else if (row.parseStatus === ParseStatus.PARTIAL) result.partial++;
    else if (row.parseStatus === ParseStatus.FAILED) result.failed++;
    else result.pending++;
  }
  return result;
});

const searchForm = reactive({
  name: '',
  status: '',
  phone: '',
  parseStatus: '',
  jobId: undefined as number | undefined,
  source: '',
  matchLevel: '' as string,
  resumeTag: '' as string,
});

const screenConditions = reactive<ScreenConditions>({
  education: undefined,
  minEducation: undefined,
  minExperience: undefined,
  maxExperience: undefined,
  minSalary: undefined,
  maxSalary: undefined,
  skillTags: [],
  city: undefined,
  isFreshGraduate: false,
  matchLevel: undefined,
  resumeTag: undefined,
});

const screenPanelActive = ref<string[]>([]);
const screenResultCount = ref(0);
const screenConflictMsg = ref('');
const screenTemplates = ref<ScreenTemplateItem[]>([]);
const saveTemplateDialogVisible = ref(false);
const templateFormData = reactive({ name: '', description: '', isGlobal: false });
const optimizationVisible = ref(false);
const optimizationData = ref<MatchOptimizationData | null>(null);

const dialogVisible = ref(false);
const dialogTitle = ref('');
const isEdit = ref(false);
const isCompleteInfo = ref(false);
const currentEditingId = ref<number | null>(null);
const submitLoading = ref(false);

const formData = reactive<Partial<ResumeItem>>({
  jobId: undefined,
  name: '',
  gender: undefined,
  age: undefined,
  phone: '',
  email: '',
  education: undefined,
  school: '',
  major: '',
  experience: undefined,
  currentCompany: '',
  currentPosition: '',
  expectedSalary: '',
  city: '',
  selfEvaluation: '',
  status: ResumeStatus.NEW,
  source: undefined,
  remark: '',
});

const formRules: FormRules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
  jobId: [{ required: true, message: '请选择应聘岗位', trigger: 'change' }],
};

const detailVisible = ref(false);
const detailData = ref<ResumeItem>({} as ResumeItem);

const parseResultVisible = ref(false);
const parseResultData = reactive<any>({
  parseStatus: '',
  parsedFields: [],
  failedFields: [],
  abnormalFields: [],
  matchScore: 0,
  parseDuration: 0,
  isBlankResume: false,
  isFakeResume: false,
  isDuplicate: false,
});

const parseResultIcon = computed(() => {
  if (parseResultData.isDuplicate) return 'warning';
  switch (parseResultData.parseStatus) {
    case ParseStatus.SUCCESS:
      return 'success';
    case ParseStatus.PARTIAL:
      return 'warning';
    case ParseStatus.FAILED:
      return 'error';
    default:
      return 'info';
  }
});

const parseResultTitle = computed(() => {
  if (parseResultData.isDuplicate) return '重复简历';
  switch (parseResultData.parseStatus) {
    case ParseStatus.SUCCESS:
      return '解析成功';
    case ParseStatus.PARTIAL:
      return '部分字段解析成功，请人工补全';
    case ParseStatus.FAILED:
      return '解析失败，请重新上传或人工补全';
    default:
      return '解析处理中';
  }
});

const parseResultSubTitle = computed(() => {
  if (parseResultData.errorMessage) return parseResultData.errorMessage;
  if (parseResultData.parseStatus === ParseStatus.SUCCESS) {
    return `已自动匹配岗位，匹配度${parseResultData.matchScore || 0}分，可直接进入筛选流程`;
  }
  if (parseResultData.parseStatus === ParseStatus.PARTIAL) {
    return `${parseResultData.failedFields?.length || 0}个字段解析失败，已锁定异常字段`;
  }
  return '';
});

const uploadProgressVisible = ref(false);
const uploadProgressList = ref<any[]>([]);

const batchResultVisible = ref(false);
const batchResult = ref<BatchResult>({
  total: 0,
  success: 0,
  failed: 0,
  duplicates: 0,
  errors: [],
});

const fetchList = async () => {
  loading.value = true;
  try {
    const params: any = {
      page: page.value,
      pageSize: pageSize.value,
      ...searchForm,
      matchScoreMin: matchScoreRange.value[0],
      matchScoreMax: matchScoreRange.value[1],
    };
    if (!params.status) delete params.status;
    if (!params.parseStatus) delete params.parseStatus;
    if (!params.source) delete params.source;
    if (!params.jobId) delete params.jobId;
    if (!params.name) delete params.name;
    if (!params.phone) delete params.phone;
    if (!params.matchLevel) delete params.matchLevel;
    if (!params.resumeTag) delete params.resumeTag;

    const res = await getResumeListApi(params);
    tableData.value = res.list;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  page.value = 1;
  fetchList();
};

const handleReset = () => {
  page.value = 1;
  matchScoreRange.value = [0, 100];
};

const handlePageChange = (p: number, ps: number) => {
  page.value = p;
  pageSize.value = ps;
  fetchList();
};

const handleSelectionChange = (selection: any[]) => {
  selectedIds.value = selection.map((item) => item.id);
};

const handleMatchScoreChange = () => {
  handleSearch();
};

const handleHeaderDragend = (newWidth: number, oldWidth: number, column: any, event: MouseEvent) => {
  if (column.property) {
    colWidths[column.property] = newWidth;
  }
};

const checkJobAvailable = () => {
  if (!selectedJobId.value) {
    ElMessage.warning('请先选择应聘岗位（岗位需处于上架状态且开启简历收录）');
  }
};

const handleBeforeSingleUpload = async (file: UploadRawFile) => {
  if (!selectedJobId.value) {
    ElMessage.warning('请先选择应聘岗位');
    return false;
  }
  const validate = await validateFileApi(file.name, file.size);
  if (!validate.valid) {
    ElMessage.error(validate.error || '文件校验失败');
    return false;
  }
  return true;
};

const handleBeforeBatchUpload = async (file: UploadRawFile) => {
  if (!selectedJobId.value) {
    ElMessage.warning('请先选择应聘岗位');
    return false;
  }
  const validate = await validateFileApi(file.name, file.size);
  if (!validate.valid) {
    ElMessage.error(`[${file.name}] ${validate.error || '文件校验失败'}`);
    return false;
  }
  return true;
};

const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve(String(e.target?.result || ''));
    };
    reader.onerror = () => {
      resolve(file.name + file.size);
    };
    if (file.type.startsWith('text/') || file.name.endsWith('.txt')) {
      reader.readAsText(file);
    } else {
      resolve(`${file.name} ${file.size} ${file.type}`);
    }
  });
};

const handleSingleUpload = async (options: UploadRequestOptions) => {
  const file = options.file as File;
  const fakeProgress = {
    fileName: file.name,
    progress: 0,
    status: 'uploading',
    statusText: '上传中...',
    error: '',
  };
  uploadProgressList.value = [fakeProgress];
  uploadProgressVisible.value = true;

  const progressInterval = setInterval(() => {
    if (fakeProgress.progress < 90) {
      fakeProgress.progress += Math.random() * 15;
    }
  }, 200);

  try {
    const content = await readFileAsText(file);
    clearInterval(progressInterval);
    fakeProgress.progress = 95;
    fakeProgress.statusText = '解析中...';

    const result = await uploadAndParseApi({
      fileInfo: {
        fileName: file.name,
        fileSize: file.size,
        filePath: `/uploads/resumes/${Date.now()}_${file.name}`,
      },
      jobId: selectedJobId.value!,
      content,
    });

    fakeProgress.progress = 100;
    fakeProgress.status = 'success';
    fakeProgress.statusText = result.isDuplicate ? '重复简历' : '完成';

    Object.assign(parseResultData, {
      ...result,
      ...(result.parseResult || {}),
      parseDuration: result.latestParseLog?.parseDuration || Math.floor(Math.random() * 500 + 100),
    });
    parseResultData.id = result.id;

    setTimeout(() => {
      parseResultVisible.value = true;
    }, 300);

    fetchList();
  } catch (error: any) {
    clearInterval(progressInterval);
    fakeProgress.status = 'error';
    fakeProgress.statusText = '失败';
    fakeProgress.error = error.message || '上传解析失败';
    fakeProgress.progress = 100;
    ElMessage.error(error.message || '上传解析失败');
  }
};

const handleBatchUploadRequest = async (options: UploadRequestOptions) => {
  const file = options.file as File;
  if (!uploadProgressVisible.value) {
    uploadProgressList.value = [];
    uploadProgressVisible.value = true;
  }

  const fakeProgress = {
    fileName: file.name,
    progress: 0,
    status: 'uploading',
    statusText: '上传中...',
    error: '',
    file,
  };
  uploadProgressList.value.push(fakeProgress);

  const idx = uploadProgressList.value.length - 1;
  const progressInterval = setInterval(() => {
    const p = uploadProgressList.value[idx];
    if (p && p.progress < 90) {
      p.progress += Math.random() * 12;
    }
  }, 250);

  try {
    const content = await readFileAsText(file);
    clearInterval(progressInterval);
    fakeProgress.progress = 100;
    fakeProgress.status = 'success';
    fakeProgress.statusText = '排队解析';
  } catch (error: any) {
    clearInterval(progressInterval);
    fakeProgress.status = 'error';
    fakeProgress.statusText = '失败';
    fakeProgress.error = error.message || '读取文件失败';
  }
};

const batchProcessQueue = async () => {
  const pendingItems = uploadProgressList.value.filter(
    (p) => p.status === 'success' && p.file && !p.processed
  );
  if (pendingItems.length === 0) return;

  uploadProgressList.value.forEach((p) => {
    if (p.status === 'success' && p.file) {
      p.status = 'uploading';
      p.statusText = '解析中...';
      p.progress = 90;
    }
  });

  try {
    const fileList = pendingItems.map((p) => ({
      fileName: p.fileName,
      fileSize: p.file.size,
      filePath: `/uploads/resumes/${Date.now()}_${p.fileName}`,
    }));
    const contents = await Promise.all(pendingItems.map((p) => readFileAsText(p.file)));

    const result = await batchUploadAndParseApi({
      fileList,
      jobId: selectedJobId.value!,
      contents,
    });

    uploadProgressList.value.forEach((p, i) => {
      if (pendingItems.includes(uploadProgressList.value[i])) {
        p.progress = 100;
        p.status = 'success';
        p.statusText = '完成';
        p.processed = true;
      }
    });

    batchResult.value = result;
    batchResultVisible.value = true;
    fetchList();
  } catch (error: any) {
    ElMessage.error(error.message || '批量解析失败');
  }
};

const handleBatchRetryParse = async () => {
  if (selectedIds.value.length === 0) return;
  try {
    await ElMessageBox.confirm(
      `确定要对选中的 ${selectedIds.value.length} 条简历重试解析吗？`,
      '提示',
      { type: 'warning' }
    );
    const result = await batchRetryParseApi(selectedIds.value);
    batchResult.value = result;
    batchResultVisible.value = true;
    fetchList();
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error(e.message || '操作失败');
  }
};

const handleBatchTriggerParse = async () => {
  if (selectedIds.value.length === 0) return;
  try {
    await ElMessageBox.confirm(
      `确定要对选中的 ${selectedIds.value.length} 条简历触发解析吗？`,
      '提示',
      { type: 'warning' }
    );
    const result = await batchTriggerParseApi(selectedIds.value);
    batchResult.value = result;
    batchResultVisible.value = true;
    fetchList();
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error(e.message || '操作失败');
  }
};

const handleBatchDelete = () => {
  ElMessageBox.confirm(`确定要删除选中的 ${selectedIds.value.length} 条记录吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      await batchDeleteResumeApi(selectedIds.value);
      ElMessage.success('批量删除成功');
      fetchList();
    })
    .catch(() => {});
};

const handleExportExceptionList = async () => {
  try {
    const list = await exportExceptionListApi();
    if (list.length === 0) {
      ElMessage.info('暂无异常数据');
      return;
    }
    const headers = ['ID', '姓名', '手机号', '应聘岗位', '解析状态', '收录人', '收录时间', '异常原因', '匹配度'];
    const rows = list.map((item) => [
      item.id,
      item.name,
      item.phone,
      item.jobTitle,
      ParseStatusLabel[item.parseStatus as ParseStatus] || '-',
      item.collectorName,
      formatDate(item.collectTime),
      item.exceptionReasons?.join('；') || '-',
      `${item.matchScore || 0}分`,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `简历异常清单_${new Date().getTime()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    ElMessage.success('导出成功');
  } catch (error: any) {
    ElMessage.error(error.message || '导出失败');
  }
};

const handleAdd = () => {
  isEdit.value = false;
  isCompleteInfo.value = false;
  currentEditingId.value = null;
  dialogTitle.value = '添加简历';
  Object.assign(formData, {
    jobId: selectedJobId.value,
    name: '',
    gender: undefined,
    age: undefined,
    phone: '',
    email: '',
    education: undefined,
    school: '',
    major: '',
    experience: undefined,
    currentCompany: '',
    currentPosition: '',
    expectedSalary: '',
    city: '',
    selfEvaluation: '',
    status: ResumeStatus.NEW,
    source: ResumeSource.MANUAL,
    remark: '',
  });
  dialogVisible.value = true;
};

const handleEdit = (row: ResumeItem) => {
  isEdit.value = true;
  isCompleteInfo.value = false;
  currentEditingId.value = row.id;
  dialogTitle.value = '编辑简历';
  Object.assign(formData, row);
  dialogVisible.value = true;
};

const handleCompleteInfo = (row: ResumeItem) => {
  isEdit.value = true;
  isCompleteInfo.value = true;
  currentEditingId.value = row.id;
  dialogTitle.value = '补全简历信息';
  Object.assign(formData, row);
  dialogVisible.value = true;
};

const handleCompleteInfoFromResult = () => {
  parseResultVisible.value = false;
  nextTick(() => {
    isEdit.value = true;
    isCompleteInfo.value = true;
    currentEditingId.value = parseResultData.id;
    dialogTitle.value = '补全简历信息';
    Object.assign(formData, parseResultData);
    dialogVisible.value = true;
  });
};

const handleView = async (row: ResumeItem) => {
  try {
    const res = await getResumeDetailApi(row.id);
    try {
      const logs = await getScreenLogsApi(row.id);
      res.screenLogs = logs;
    } catch {}
    detailData.value = res;
    detailVisible.value = true;
  } catch (error) {
    console.error(error);
  }
};

const handleSubmit = async () => {
  submitLoading.value = true;
  try {
    if (isCompleteInfo.value && currentEditingId.value) {
      await completeResumeInfoApi(currentEditingId.value, formData);
      ElMessage.success('补全信息成功');
    } else if (isEdit.value && currentEditingId.value) {
      await updateResumeApi(currentEditingId.value, formData);
      ElMessage.success('更新成功');
    } else {
      await createResumeApi(formData);
      ElMessage.success('创建成功');
    }
    dialogVisible.value = false;
    fetchList();
  } finally {
    submitLoading.value = false;
  }
};

const handleDelete = (row: ResumeItem) => {
  ElMessageBox.confirm('确定要删除该简历吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      await deleteResumeApi(row.id);
      ElMessage.success('删除成功');
      fetchList();
    })
    .catch(() => {});
};

const handleStatusChange = (row: ResumeItem, status: string) => {
  ElMessageBox.confirm(
    `确定要将状态变更为"${ResumeStatusLabel[status as ResumeStatus]}"吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(async () => {
      await updateResumeStatusApi(row.id, status as ResumeStatus);
      ElMessage.success('状态更新成功');
      fetchList();
    })
    .catch(() => {});
};

const handleRetryParse = async (row: ResumeItem) => {
  try {
    const result = await retryParseApi(row.id);
    Object.assign(parseResultData, {
      ...result,
      ...(result.parseResult || {}),
      parseDuration: result.latestParseLog?.parseDuration || 0,
    });
    parseResultData.id = row.id;
    setTimeout(() => {
      parseResultVisible.value = true;
    }, 300);
    fetchList();
  } catch (error: any) {
    ElMessage.error(error.message || '重试解析失败');
  }
};

const handleRetryParseFromResult = async () => {
  if (!parseResultData.id) return;
  try {
    const result = await retryParseApi(parseResultData.id);
    Object.assign(parseResultData, {
      ...result,
      ...(result.parseResult || {}),
      parseDuration: result.latestParseLog?.parseDuration || 0,
    });
    parseResultData.id = result.id;
    fetchList();
    ElMessage.success('重试解析完成');
  } catch (error: any) {
    ElMessage.error(error.message || '重试解析失败');
  }
};

const handleUnlock = async (row: ResumeItem) => {
  try {
    const { value } = await ElMessageBox.prompt('请输入解锁原因', '解锁简历', {
      confirmButtonText: '确认解锁',
      cancelButtonText: '取消',
      inputValidator: (val) => !!val || '请输入解锁原因',
      inputPlaceholder: '请输入解锁原因',
    });
    await unlockResumeApi(row.id, value);
    ElMessage.success('解锁成功');
    fetchList();
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error(e.message || '解锁失败');
  }
};

const formatDate = (dateStr: string | undefined | null) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getMatchScoreColor = (score: number | undefined) => {
  if (score === undefined || score === null) return '#909399';
  if (score >= 80) return '#67c23a';
  if (score >= 60) return '#409eff';
  if (score >= 40) return '#e6a23c';
  return '#f56c6c';
};

const getParseTooltip = (row: ResumeItem) => {
  const parts: string[] = [];
  if (row.abnormalFields) {
    try {
      const fields = JSON.parse(row.abnormalFields);
      const labels = fields.map((f: string) => getFieldLabel(f));
      if (labels.length > 0) parts.push(`异常字段: ${labels.join('、')}`);
    } catch {}
  }
  if (row.lockReason) parts.push(`原因: ${row.lockReason}`);
  if (row.latestParseLog?.errorMessage) parts.push(row.latestParseLog.errorMessage);
  return parts.join('\n') || '点击详情查看解析记录';
};

const getFieldLabel = (key: string) => {
  const field = CORE_PARSE_FIELDS.find((f) => f.key === key);
  if (field) return field.label;
  const labelMap: Record<string, string> = {
    email: '邮箱',
    school: '毕业院校',
    major: '专业',
    currentCompany: '当前公司',
    age: '年龄',
    gender: '性别',
    selfEvaluation: '自我评价',
  };
  return labelMap[key] || key;
};

const getFieldDisplayValue = (data: any, key: string) => {
  const val = data[key];
  if (val === undefined || val === null || val === '') return '-';
  if (key === 'education') return EducationLabel[val as keyof typeof EducationLabel] || val;
  if (key === 'gender') return GenderLabel[val as keyof typeof GenderLabel] || val;
  if (key === 'experience') return `${val}年`;
  return String(val).length > 15 ? String(val).substring(0, 15) + '...' : String(val);
};

const safeJsonParse = (str: string | undefined) => {
  try {
    return JSON.parse(str || '[]');
  } catch {
    return [];
  }
};

const handleFreshGraduateChange = (val: boolean) => {
  if (val) {
    screenConditions.minExperience = undefined;
    screenConditions.maxExperience = undefined;
  }
};

const handleExperienceChange = () => {
  if (screenConditions.minExperience !== undefined || screenConditions.maxExperience !== undefined) {
    screenConditions.isFreshGraduate = false;
  }
};

const validateScreenConditions = (): string[] => {
  const conflicts: string[] = [];
  if (screenConditions.isFreshGraduate && (screenConditions.minExperience !== undefined || screenConditions.maxExperience !== undefined)) {
    conflicts.push('选择"应届生"后不能设置工作经验范围');
  }
  if (screenConditions.minExperience !== undefined && screenConditions.maxExperience !== undefined && screenConditions.minExperience > screenConditions.maxExperience) {
    conflicts.push('最小工作年限不能大于最大工作年限');
  }
  if (screenConditions.minSalary !== undefined && screenConditions.maxSalary !== undefined && screenConditions.minSalary > screenConditions.maxSalary) {
    conflicts.push('最低薪资不能大于最高薪资');
  }
  return conflicts;
};

const handleScreenResumes = async () => {
  if (!selectedJobId.value) {
    ElMessage.warning('请先选择应聘岗位');
    return;
  }
  const conflicts = validateScreenConditions();
  if (conflicts.length > 0) {
    screenConflictMsg.value = conflicts.join('；');
    ElMessage.error(`筛选条件冲突：${screenConflictMsg.value}`);
    return;
  }
  try {
    const result = await screenResumesApi(selectedJobId.value, { ...screenConditions });
    screenResultCount.value = result.total;
    screenConflictMsg.value = result.conflictReason || '';
    tableData.value = result.filtered;
    total.value = result.total;
    page.value = 1;
    ElMessage.success(`筛选完成，共${result.total}条匹配简历`);
  } catch (error: any) {
    ElMessage.error(error.message || '筛选失败');
  }
};

const handleBatchScreenResumes = async () => {
  if (!selectedJobId.value) {
    ElMessage.warning('请先选择应聘岗位');
    return;
  }
  const conflicts = validateScreenConditions();
  if (conflicts.length > 0) {
    ElMessage.error(`筛选条件冲突：${conflicts.join('；')}`);
    return;
  }
  try {
    const result = await batchScreenResumesApi(selectedJobId.value, { ...screenConditions });
    tableData.value = result.filtered;
    total.value = result.total;
    ElMessage.success(`批量筛选完成，共${result.total}条`);
  } catch (error: any) {
    ElMessage.error(error.message || '批量筛选失败');
  }
};

const handleBatchTag = async (tag: ResumeTag) => {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择简历');
    return;
  }
  try {
    await ElMessageBox.confirm(
      `确定要将选中的 ${selectedIds.value.length} 条简历标记为"${ResumeTagLabel[tag]}"吗？`,
      '批量标记',
      { type: 'warning' }
    );
    const result = await batchTagResumesApi(selectedIds.value, tag);
    batchResult.value = result;
    batchResultVisible.value = true;
    fetchList();
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error(e.message || '操作失败');
  }
};

const handleTagResume = async (row: ResumeItem, tag: ResumeTag) => {
  try {
    await tagResumeApi(row.id, tag);
    ElMessage.success(`已标记为"${ResumeTagLabel[tag]}"`);
    fetchList();
  } catch (error: any) {
    ElMessage.error(error.message || '标记失败');
  }
};

const handleRefreshMatchLevels = async () => {
  if (!selectedJobId.value) {
    ElMessage.warning('请先选择应聘岗位');
    return;
  }
  try {
    await ElMessageBox.confirm(
      '确定要刷新该岗位所有关联简历的匹配等级吗？修改岗位要求后建议执行此操作。',
      '刷新匹配等级',
      { type: 'warning' }
    );
    const result = await refreshJobMatchLevelsApi(selectedJobId.value);
    batchResult.value = result;
    batchResultVisible.value = true;
    fetchList();
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error(e.message || '操作失败');
  }
};

const handleSaveScreenTemplate = async () => {
  if (!templateFormData.name) {
    ElMessage.warning('请输入模板名称');
    return;
  }
  try {
    await saveScreenTemplateApi({
      name: templateFormData.name,
      description: templateFormData.description,
      conditions: { ...screenConditions },
      jobId: selectedJobId.value,
      isGlobal: templateFormData.isGlobal,
    });
    ElMessage.success('模板保存成功');
    saveTemplateDialogVisible.value = false;
    templateFormData.name = '';
    templateFormData.description = '';
    templateFormData.isGlobal = false;
    loadScreenTemplates();
  } catch (error: any) {
    ElMessage.error(error.message || '保存模板失败');
  }
};

const handleUseScreenTemplate = async (template: ScreenTemplateItem) => {
  if (!selectedJobId.value) {
    ElMessage.warning('请先选择应聘岗位');
    return;
  }
  try {
    const conditions = JSON.parse(template.conditions);
    Object.assign(screenConditions, conditions);
    const result = await useScreenTemplateApi(template.id, selectedJobId.value);
    tableData.value = result.filtered;
    total.value = result.total;
    screenResultCount.value = result.total;
    ElMessage.success(`使用模板"${template.name}"筛选完成，共${result.total}条`);
  } catch (error: any) {
    ElMessage.error(error.message || '使用模板失败');
  }
};

const handleDeleteScreenTemplate = async (template: ScreenTemplateItem) => {
  try {
    await ElMessageBox.confirm(`确定删除筛选模板"${template.name}"吗？`, '提示', { type: 'warning' });
    await deleteScreenTemplateApi(template.id);
    ElMessage.success('模板已删除');
    loadScreenTemplates();
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error(e.message || '删除失败');
  }
};

const handleViewOptimization = async () => {
  if (!selectedJobId.value) {
    ElMessage.warning('请先选择应聘岗位');
    return;
  }
  try {
    const data = await getMatchOptimizationDataApi(selectedJobId.value);
    optimizationData.value = data;
    optimizationVisible.value = true;
  } catch (error: any) {
    ElMessage.error(error.message || '获取优化数据失败');
  }
};

const loadScreenTemplates = async () => {
  try {
    const templates = await getScreenTemplatesApi(selectedJobId.value);
    screenTemplates.value = templates;
  } catch {}
};

const resetScreenConditions = () => {
  Object.assign(screenConditions, {
    education: undefined,
    minEducation: undefined,
    minExperience: undefined,
    maxExperience: undefined,
    minSalary: undefined,
    maxSalary: undefined,
    skillTags: [],
    city: undefined,
    isFreshGraduate: false,
    matchLevel: undefined,
    resumeTag: undefined,
  });
  screenConflictMsg.value = '';
  screenResultCount.value = 0;
};

const getRowClassName = ({ row }: { row: ResumeItem }) => {
  const classes: string[] = [];
  if (selectedIds.value.includes(row.id)) classes.push('selected-row');
  if (row.matchLevel === MatchLevel.HIGH) classes.push('high-match-row');
  return classes.join(' ');
};

onMounted(() => {
  fetchList();
  loadScreenTemplates();
});
</script>

<style lang="scss" scoped>
.resume-page {
  .toolbar-left {
    display: flex;
    gap: $spacing-sm;
    flex-wrap: wrap;
    align-items: center;
  }

  .toolbar-right {
    display: flex;
    gap: $spacing-sm;
    align-items: center;
  }

  .cell-name {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
  }

  .match-score-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 4px 0;
  }

  .collect-info {
    font-size: 12px;
    line-height: 1.6;
    color: #606266;
  }

  .parse-result-dialog {
    .el-dialog__body {
      animation: fadeIn 0.3s ease-in;
    }
  }

  .parse-result-stats {
    display: flex;
    justify-content: space-around;
    padding: 16px 0;
  }

  .parse-fields-detail {
    padding: 0 16px;
  }

  .warning-box {
    margin-top: 16px;
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }

  .upload-progress-list {
    max-height: 400px;
    overflow-y: auto;
  }

  .upload-progress-item {
    margin-bottom: 16px;
    padding: 12px;
    background: #f5f7fa;
    border-radius: 4px;

    .upload-progress-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 13px;

      .file-name {
        font-weight: 500;
        max-width: 260px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .upload-status {
        &.uploading {
          color: #409eff;
        }
        &.success {
          color: #67c23a;
        }
        &.error {
          color: #f56c6c;
        }
      }
    }
  }

  .detail-wrapper {
    .detail-descriptions {
      margin-bottom: 16px;
    }
  }

  .parse-log-card {
    margin: 0;
    border: 1px solid #ebeef5;

    :deep(.el-card__body) {
      padding: 12px;
    }

    .parse-log-header {
      display: flex;
      gap: 12px;
      align-items: center;
      margin-bottom: 8px;
      font-size: 12px;
      color: #909399;

      .parse-duration,
      .parse-attempts,
      .parse-operator {
        margin-left: auto;
      }
    }

    .parse-log-error {
      margin: 8px 0;
    }

    .parse-log-fields {
      margin-top: 8px;
      font-size: 12px;

      .label {
        color: #606266;
        margin-right: 6px;
      }
    }

    .parse-log-version {
      margin-top: 8px;
      font-size: 11px;
      color: #c0c4cc;
    }
  }

  .screen-panel {
    margin-bottom: 12px;

    .screen-conflict-warning {
      margin-bottom: 8px;
    }

    .screen-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 8px;
    }

    .screen-result-count {
      font-size: 13px;
      color: #409eff;
      font-weight: 500;
    }

    .screen-templates {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 10px;

      .template-label {
        font-size: 13px;
        color: #606266;
      }

      .template-tag {
        cursor: pointer;

        .template-delete-icon {
          margin-left: 4px;
          cursor: pointer;
        }
      }
    }
  }

  :deep(.el-table) {
    .selected-row {
      background-color: #ecf5ff !important;
    }

    .high-match-row {
      background-color: #f0f9eb !important;
    }

    .el-table__header-wrapper {
      position: sticky;
      top: 0;
      z-index: 10;
    }

    th.el-table__cell {
      background-color: #f5f7fa;
    }
  }

  .search-input-focus {
    :deep(.el-input__wrapper) {
      &:focus-within {
        box-shadow: 0 0 0 2px #409eff inset;
      }
    }
  }

  .more-tags {
    font-size: 11px;
    color: #909399;
  }

  .optimization-content {
    h4 {
      margin: 0 0 8px 0;
      font-size: 14px;
      color: #303133;
    }
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
