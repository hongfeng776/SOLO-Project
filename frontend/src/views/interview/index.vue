<template>
  <div class="interview-page">
    <el-row :gutter="16" class="stats-row">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-label">总场次</div>
          <div class="stat-value">{{ stats.total }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card success">
          <div class="stat-label">预约成功</div>
          <div class="stat-value">{{ stats.successCount }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card warning">
          <div class="stat-label">待预约</div>
          <div class="stat-value">{{ stats.pendingCount }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card rate">
          <div class="stat-label">预约成功率</div>
          <div class="stat-value">{{ stats.successRate }}%</div>
          <el-progress
            :percentage="stats.successRate"
            :show-text="false"
            :stroke-width="4"
            :color="stats.successRate >= 80 ? '#67c23a' : stats.successRate >= 60 ? '#409eff' : '#e6a23c'"
          />
        </el-card>
      </el-col>
    </el-row>

    <el-tabs v-model="activeTab" class="status-tabs" @tab-change="handleTabChange">
      <el-tab-pane label="全部" name="" />
      <el-tab-pane
        v-for="(label, key) in InterviewSessionStatusLabel"
        :key="key"
        :name="key"
      >
        <span class="tab-label">
          {{ label }}
          <el-tag size="small" :type="InterviewSessionStatusType[key as InterviewSessionStatus]" effect="plain" class="tab-count">
            {{ getTabCount(key as InterviewSessionStatus) }}
          </el-tag>
        </span>
      </el-tab-pane>
    </el-tabs>

    <SearchForm @search="handleSearch" @reset="handleReset">
      <el-form-item label="场次状态" prop="sessionStatus">
        <el-select v-model="searchForm.sessionStatus" placeholder="全部" clearable style="width: 140px">
          <el-option v-for="opt in INTERVIEW_SESSION_STATUS_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="面试阶段" prop="stage">
        <el-select v-model="searchForm.stage" placeholder="全部" clearable style="width: 140px">
          <el-option v-for="(label, key) in InterviewStageLabel" :key="key" :label="label" :value="key" />
        </el-select>
      </el-form-item>
      <el-form-item label="面试结果" prop="result">
        <el-select v-model="searchForm.result" placeholder="全部" clearable style="width: 140px">
          <el-option v-for="(label, key) in InterviewResultLabel" :key="key" :label="label" :value="key" />
        </el-select>
      </el-form-item>
      <el-form-item label="面试官" prop="interviewer">
        <el-input v-model="searchForm.interviewer" placeholder="请输入" clearable style="width: 140px" />
      </el-form-item>
      <el-form-item label="候选人" prop="keyword">
        <el-input v-model="searchForm.keyword" placeholder="姓名" clearable style="width: 140px" />
      </el-form-item>
    </SearchForm>

    <ProTable
      :data="tableData"
      :loading="loading"
      :total="total"
      :page="page"
      :page-size="pageSize"
      show-selection
      border
      :row-class-name="rowClassName"
      @selection-change="handleSelectionChange"
      @page-change="handlePageChange"
    >
      <template #toolbar>
        <div class="toolbar-left">
          <el-button type="primary" :icon="Plus" @click="handleAdd">
            发起预约
          </el-button>
          <el-button
            type="success"
            :icon="Tickets"
            :disabled="!canBatchOperate"
            :loading="batchAppointLoading"
            @click="handleBatchAppointOpen"
          >
            批量预约
          </el-button>
          <el-button
            type="warning"
            :icon="Clock"
            :disabled="!canBatchOperate"
            :loading="batchCancelLoading"
            @click="handleBatchCancelOverdue"
          >
            批量取消逾期
          </el-button>
          <el-button
            :type="'primary'"
            plain
            :icon="Sort"
            :disabled="selectedIds.length === 0 || !canBatchOperate"
            :loading="batchSortLoading"
            @click="handleBatchSortOpen"
          >
            批量排序
          </el-button>
          <el-button
            type="danger"
            :icon="Delete"
            :disabled="selectedIds.length === 0"
            @click="handleBatchDelete"
          >
            批量删除
          </el-button>
          <el-divider direction="vertical" />
          <el-button
            type="success"
            plain
            :icon="DocumentAdd"
            :loading="batchSupplementLoading"
            @click="handleBatchSupplementOpen"
          >
            批量补录逾期
          </el-button>
          <el-button
            type="warning"
            plain
            :icon="EditPen"
            :loading="batchModifyPendingLoading"
            @click="handleBatchModifyPendingOpen"
          >
            批量修改待定结果
          </el-button>
          <el-divider direction="vertical" />
          <el-button
            type="primary"
            plain
            :icon="UserFilled"
            @click="handleAllocateDialogOpen"
          >
            调配面试官
          </el-button>
          <el-button
            type="success"
            plain
            :icon="Refresh"
            :loading="batchScheduleLoading"
            @click="handleBatchScheduleOpen"
          >
            排班优化
          </el-button>
          <el-button
            type="info"
            plain
            :icon="DataLine"
            @click="handleWorkloadDialogOpen"
          >
            工作量统计
          </el-button>
          <el-divider direction="vertical" />
          <el-button
            type="danger"
            plain
            :icon="AlarmClock"
            @click="handleWarningListOpen"
          >
            逾期预警
          </el-button>
          <el-button
            type="warning"
            plain
            :icon="Warning"
            :loading="checkWarningLoading"
            @click="handleCheckWarnings"
          >
            检查预警
          </el-button>
        </div>
        <div class="toolbar-right">
          <el-progress
            v-if="globalProgress > 0"
            :percentage="globalProgress"
            :stroke-width="6"
            style="width: 200px"
          />
        </div>
      </template>

      <el-table-column label="场次状态" width="120" align="center" fixed="left" :resizable="true">
        <template #default="{ row }">
          <el-space direction="vertical" size="2">
            <el-tag :type="InterviewSessionStatusType[row.sessionStatus]" size="small" effect="dark">
              {{ InterviewSessionStatusLabel[row.sessionStatus] }}
            </el-tag>
            <el-tooltip v-if="row.isLocked" content="场次信息已锁定，不可修改" placement="top">
              <el-icon color="#e6a23c" size="14"><Lock /></el-icon>
            </el-tooltip>
          </el-space>
        </template>
      </el-table-column>

      <el-table-column label="候选人" width="110" :resizable="true">
        <template #default="{ row }">
          <el-space direction="vertical" size="0">
            <span>{{ row.resume?.name || '-' }}</span>
            <el-link v-if="row.matchScoreSnapshot !== undefined" type="primary" :underline="false" size="small">
              匹配度：{{ row.matchScoreSnapshot }}分
            </el-link>
          </el-space>
        </template>
      </el-table-column>

      <el-table-column label="应聘岗位" width="130" :resizable="true">
        <template #default="{ row }">
          <el-space direction="vertical" size="0">
            <span>{{ row.job?.title || '-' }}</span>
            <el-link v-if="row.jobUrgencySnapshot !== undefined" type="warning" :underline="false" size="small">
              紧急度：{{ row.jobUrgencySnapshot }}
            </el-link>
          </el-space>
        </template>
      </el-table-column>

      <el-table-column label="面试阶段" width="90" align="center" :resizable="true">
        <template #default="{ row }">{{ InterviewStageLabel[row.stage] }}</template>
      </el-table-column>

      <el-table-column prop="interviewer" label="面试官" width="100" :resizable="true" />

      <el-table-column label="面试时间" width="170" :resizable="true">
        <template #default="{ row }">
          <el-space direction="vertical" size="0">
            <span>{{ formatDateTime(row.interviewTime) }}</span>
            <span class="sub-info" v-if="row.endTime">至 {{ formatTime(row.endTime) }}</span>
          </el-space>
        </template>
      </el-table-column>

      <el-table-column prop="location" label="地点" min-width="100" show-overflow-tooltip :resizable="true" />

      <el-table-column label="面试结果" width="100" align="center" :resizable="true">
        <template #default="{ row }">
          <el-space direction="vertical" size="2">
            <el-tag :type="InterviewResultType[row.result]" size="small">
              {{ InterviewResultLabel[row.result] }}
            </el-tag>
            <el-tag v-if="row.isSupplementary" type="info" size="small" effect="plain">补录</el-tag>
          </el-space>
        </template>
      </el-table-column>

      <el-table-column label="预警状态" width="110" align="center" :resizable="true">
        <template #default="{ row }">
          <template v-if="row.warningStatus && row.warningStatus !== WarningStatus.NORMAL">
            <el-space direction="vertical" size="2">
              <el-tag :type="WarningStatusType[row.warningStatus as WarningStatus]" size="small" effect="dark">
                {{ WarningStatusLabel[row.warningStatus as WarningStatus] }}
              </el-tag>
              <el-tag v-if="row.warningLevel" :type="WarningLevelType[row.warningLevel as WarningLevel]" size="small" effect="plain">
                {{ WarningLevelLabel[row.warningLevel as WarningLevel] }}
              </el-tag>
            </el-space>
          </template>
          <span v-else class="sub-info">-</span>
        </template>
      </el-table-column>

      <el-table-column label="评分" width="90" align="center" :resizable="true">
        <template #default="{ row }">
          <div v-if="row.score === undefined || row.score === null" class="score-empty">-</div>
          <template v-else>
            <el-space direction="vertical" size="2">
              <span
                class="score-value"
                :style="{ color: getAbnormalScoreColor(row) }"
              >
                <strong>{{ row.score }}</strong>
                <el-icon v-if="row.abnormalScoreType && row.abnormalScoreType !== InterviewAbnormalScoreType.NONE" size="14"><WarningFilled /></el-icon>
              </span>
              <el-tooltip v-if="row.abnormalScoreType && row.abnormalScoreType !== InterviewAbnormalScoreType.NONE" :content="row.abnormalScoreReason" placement="top">
                <el-tag size="small" type="warning" effect="plain" style="margin-top: 2px">异常</el-tag>
              </el-tooltip>
            </el-space>
          </template>
        </template>
      </el-table-column>

      <el-table-column label="备注" width="150" :resizable="true" min-width="120">
        <template #default="{ row }">
          <el-tooltip
            v-if="row.remark && row.remark.length > REMARK_MAX_LENGTH"
            :content="row.remark"
            placement="top"
            popper-class="remark-tooltip"
          >
            <span class="remark-text">{{ row.remark.slice(0, REMARK_MAX_LENGTH) }}...</span>
          </el-tooltip>
          <span v-else>{{ row.remark || '-' }}</span>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="310" fixed="right" align="center" :resizable="true">
        <template #default="{ row }">
          <el-space wrap size="0">
            <el-button type="primary" link size="small" @click="handleView(row)">溯源</el-button>

            <template v-if="row.sessionStatus === InterviewSessionStatus.PENDING_APPOINT">
              <el-button type="success" link size="small" @click="handleConfirmAppoint(row)">确认预约</el-button>
              <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
            </template>

            <template v-else-if="row.sessionStatus === InterviewSessionStatus.APPOINTED">
              <el-button type="success" link size="small" @click="handleInterviewerConfirm(row)">面试官确认</el-button>
              <el-tooltip content="面试场次已预约，可录入面试记录" placement="top">
                <el-button type="warning" link size="small" @click="handleComplete(row)">录入记录</el-button>
              </el-tooltip>
            </template>

            <template v-else-if="row.sessionStatus === InterviewSessionStatus.PENDING_INTERVIEW">
              <el-tooltip content="场次待面试中，录入完整面试记录" placement="top">
                <el-button type="success" link size="small" @click="handleComplete(row)">录入记录</el-button>
              </el-tooltip>
            </template>

            <template v-else-if="row.sessionStatus === InterviewSessionStatus.COMPLETED && row.result === InterviewResult.PENDING_DECISION">
              <el-button type="warning" link size="small" @click="handleComplete(row)">修改待定结果</el-button>
            </template>

            <template v-if="[InterviewSessionStatus.APPOINTED, InterviewSessionStatus.PENDING_INTERVIEW].includes(row.sessionStatus)">
              <el-button type="primary" link size="small" @click="handleAllocateRow(row)">调配</el-button>
            </template>

            <template v-if="row.warningStatus === WarningStatus.OVERDUE">
              <el-button type="danger" link size="small" @click="handleOverdueRow(row)">处理逾期</el-button>
            </template>
            <template v-if="row.warningStatus && row.warningStatus !== WarningStatus.NORMAL">
              <el-button type="warning" link size="small" @click="handleViewWarningLogs(row)">预警记录</el-button>
            </template>

            <template v-if="row.sessionStatus !== InterviewSessionStatus.COMPLETED && row.sessionStatus !== InterviewSessionStatus.CANCELLED">
              <el-button type="danger" link size="small" @click="handleCancel(row)">取消</el-button>
            </template>

            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </el-space>
        </template>
      </el-table-column>
    </ProTable>

    <el-dialog
      v-model="appointDialogVisible"
      :title="isEdit ? '编辑面试场次' : '发起面试预约'"
      width="720px"
      destroy-on-close
      @close="handleFormClose"
    >
      <el-form
        ref="appointFormRef"
        :model="appointForm"
        :rules="appointFormRules"
        label-width="100px"
      >
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="简历ID" prop="resumeId">
              <el-input-number v-model="appointForm.resumeId" :min="1" style="width: 100%" :disabled="isEdit" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="岗位ID" prop="jobId">
              <el-input-number v-model="appointForm.jobId" :min="1" style="width: 100%" :disabled="isEdit" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="面试阶段" prop="stage">
              <el-select v-model="appointForm.stage" style="width: 100%">
                <el-option v-for="(label, key) in InterviewStageLabel" :key="key" :label="label" :value="key" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="面试官" prop="interviewer">
              <el-input
                v-model="appointForm.interviewer"
                placeholder="请输入面试官姓名"
                :class="{ 'shake-error': shakeField === 'interviewer' }"
                @blur="checkTimeConflict"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="面试时间" prop="interviewTime">
              <el-date-picker
                v-model="appointForm.interviewTime"
                type="datetime"
                placeholder="选择开始时间"
                style="width: 100%"
                value-format="YYYY-MM-DD HH:mm:ss"
                :class="{ 'shake-error': shakeField === 'interviewTime' }"
                @change="checkTimeConflict"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束时间" prop="endTime">
              <el-date-picker
                v-model="appointForm.endTime"
                type="datetime"
                placeholder="选择结束时间"
                style="width: 100%"
                value-format="YYYY-MM-DD HH:mm:ss"
                :class="{ 'shake-error': shakeField === 'endTime' }"
                @change="checkTimeConflict"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="面试地点" prop="location">
              <el-input v-model="appointForm.location" placeholder="请输入地点" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="面试方式" prop="type">
              <el-select v-model="appointForm.type" style="width: 100%">
                <el-option label="现场面试" value="onsite" />
                <el-option label="视频面试" value="video" />
                <el-option label="电话面试" value="phone" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="appointForm.remark"
            type="textarea"
            :rows="3"
            :maxlength="500"
            show-word-limit
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="appointDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleAppointSubmit">
          {{ isEdit ? '保存修改' : '提交预约' }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="cancelDialogVisible" title="取消面试" width="520px" destroy-on-close>
      <el-alert
        :title="`确定要取消候选人【${cancelTarget?.resume?.name}】的面试吗？`"
        type="warning"
        show-icon
        :closable="false"
        style="margin-bottom: 16px"
      />
      <el-form
        ref="cancelFormRef"
        :model="cancelForm"
        :rules="cancelFormRules"
        label-width="100px"
      >
        <el-form-item label="取消原因" prop="reasonType">
          <el-select v-model="cancelForm.reasonType" style="width: 100%" placeholder="请选择">
            <el-option v-for="opt in CANCEL_REASON_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="详细说明" prop="reasonDetail">
          <el-input
            v-model="cancelForm.reasonDetail"
            type="textarea"
            :rows="4"
            :minlength="5"
            maxlength="500"
            show-word-limit
            placeholder="请详细说明取消原因（至少5个字符）"
          />
        </el-form-item>
        <el-form-item label="候选人发起">
          <el-switch v-model="cancelForm.cancelledByCandidate" />
          <span class="form-tip">开启表示此取消由候选人主动发起</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancelDialogVisible = false">返回</el-button>
        <el-button type="danger" :loading="cancelLoading" @click="handleCancelSubmit">确认取消</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="completeDialogVisible" title="完成面试 - 面试过程记录管控" width="760px" destroy-on-close class="complete-interview-dialog">
      <el-alert
        v-if="completeValidateResult.conflicts && completeValidateResult.conflicts.length > 0"
        title="检测到候选人已有其他场次面试记录"
        type="warning"
        :closable="false"
        show-icon
        style="margin-bottom: 12px"
      >
        <template #default>
          <span v-for="(c, i) in completeValidateResult.conflicts" :key="i" style="margin-right: 12px">
            <el-tag size="small" :type="InterviewResultType[c.result as InterviewResult]">
              {{ c.jobTitle || ('岗位#' + c.jobId) }} - {{ InterviewResultLabel[c.result as InterviewResult] }}
              <span v-if="c.score" style="margin-left: 4px">({{ c.score }}分)</span>
            </el-tag>
          </span>
        </template>
      </el-alert>
      <el-alert
        v-if="completeValidateResult.abnormal && completeValidateResult.abnormal.type !== InterviewAbnormalScoreType.NONE"
        :title="completeValidateResult.abnormal.reason"
        type="error"
        :closable="false"
        show-icon
        style="margin-bottom: 12px"
      >
        <template #default>
          同岗位平均分：<strong>{{ completeValidateResult.abnormal.jobAvg }}分</strong>
          （样本量：{{ completeValidateResult.abnormal.jobCount }}场）
        </template>
      </el-alert>
      <el-alert
        v-if="completeValidateResult.warnings && completeValidateResult.warnings.length > 0"
        :title="completeValidateResult.warnings.join('；')"
        type="info"
        :closable="false"
        show-icon
        style="margin-bottom: 12px"
      />
      <el-form
        ref="completeFormRef"
        :model="completeForm"
        :rules="completeFormRules"
        label-width="100px"
        class="complete-form"
      >
        <el-divider content-position="left">多维度评分明细</el-divider>
        <el-row :gutter="12">
          <el-col :span="12" v-for="(label, key) in InterviewScoreDimensionLabel" :key="key">
            <el-form-item
              :label="label"
              :class="{ 'field-error': scoreDimensionErrors[key as InterviewScoreDimension], 'field-focused': focusedField === 'dim_' + key }"
            >
              <el-input-number
                v-model="scoreDimensionForm[key as InterviewScoreDimension]"
                :min="0"
                :max="100"
                :precision="1"
                :step="5"
                style="width: 100%"
                @focus="focusedField = 'dim_' + key"
                @blur="focusedField = ''; handleDimensionChange()"
                @change="handleDimensionChange"
                :class="{ 'scale-focus': focusedField === 'dim_' + key }"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">综合评分与结果</el-divider>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item
              label="综合评分"
              prop="score"
              :class="{
                'shake-error': shakeField === 'score' || completeErrorFields.has('score'),
                'field-focused': focusedField === 'score',
                'field-error': completeErrorFields.has('score')
              }"
            >
              <el-input-number
                v-model="completeForm.score"
                :min="INTERVIEW_SCORE_RANGE.MIN"
                :max="INTERVIEW_SCORE_RANGE.MAX"
                :precision="1"
                :step="1"
                style="width: 100%"
                @focus="focusedField = 'score'"
                @blur="focusedField = ''; handleScoreChange()"
                @change="handleScoreChange"
                :class="{ 'scale-focus': focusedField === 'score' }"
              />
              <div class="score-rule-tip">
                <span v-if="Number(completeForm.score) >= INTERVIEW_SCORE_RANGE.EXCELLENT_THRESHOLD" class="tag-pass">优秀 ≥80</span>
                <span v-else-if="Number(completeForm.score) >= INTERVIEW_SCORE_RANGE.PASS_THRESHOLD" class="tag-warn">及格 ≥60</span>
                <span v-else class="tag-fail">不及格 ＜60</span>
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item
              label="面试结果"
              prop="result"
              :class="{
                'shake-error': shakeField === 'result' || completeErrorFields.has('result'),
                'field-focused': focusedField === 'result',
                'field-error': completeErrorFields.has('result')
              }"
            >
              <el-radio-group
                v-model="completeForm.result"
                @focus="focusedField = 'result'"
                @blur="focusedField = ''"
                :class="{ 'scale-focus': focusedField === 'result' }"
                style="width: 100%"
              >
                <el-radio-button
                  v-for="opt in INTERVIEW_RESULT_OPTIONS"
                  :key="opt.value"
                  :value="opt.value"
                  :disabled="!completeValidateResult.allowedResults.includes(opt.value)"
                  :style="{
                    borderColor: completeForm.result === opt.value ? 'var(--el-color-' + opt.type + ')' : undefined
                  }"
                >
                  <span :style="{ color: completeForm.result === opt.value ? 'var(--el-color-' + opt.type + ')' : undefined }">
                    {{ opt.label }}
                  </span>
                </el-radio-button>
              </el-radio-group>
              <div class="score-rule-tip">
                当前评分允许：
                <span v-for="(r, i) in completeValidateResult.allowedResults" :key="r" class="allowed-result">
                  {{ InterviewResultLabel[r as InterviewResult] }}
                  <span v-if="i < completeValidateResult.allowedResults.length - 1">、</span>
                </span>
              </div>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="下一轮" prop="nextStage">
              <el-select v-model="completeForm.nextStage" placeholder="请选择" style="width: 100%" clearable>
                <el-option v-for="(label, key) in InterviewStageLabel" :key="key" :label="label" :value="key" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="下轮时间" prop="nextTime">
              <el-date-picker
                v-model="completeForm.nextTime"
                type="datetime"
                placeholder="选择时间"
                style="width: 100%"
                value-format="YYYY-MM-DD HH:mm:ss"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">评价与反馈</el-divider>
        <el-form-item
          label="综合评价"
          prop="evaluation"
          :class="{
            'shake-error': shakeField === 'evaluation' || completeErrorFields.has('evaluation'),
            'field-focused': focusedField === 'evaluation',
            'field-error': completeErrorFields.has('evaluation')
          }"
        >
          <el-input
            v-model="completeForm.evaluation"
            type="textarea"
            :rows="3"
            :minlength="INTERVIEW_RECORD_VALIDATION_RULES.MIN_EVALUATION_LENGTH"
            :maxlength="1000"
            show-word-limit
            placeholder="候选人综合评价（不少于10字）"
            @focus="focusedField = 'evaluation'"
            @blur="focusedField = ''"
            :class="{ 'scale-focus': focusedField === 'evaluation' }"
          />
        </el-form-item>
        <el-form-item
          label="详细反馈"
          prop="feedback"
          :class="{ 'field-focused': focusedField === 'feedback' }"
        >
          <el-input
            v-model="completeForm.feedback"
            type="textarea"
            :rows="4"
            :maxlength="2000"
            show-word-limit
            placeholder="面试详细反馈意见，建议不少于5字"
            @focus="focusedField = 'feedback'"
            @blur="focusedField = ''"
            :class="{ 'scale-focus': focusedField === 'feedback' }"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="completeDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="completeLoading"
          :disabled="completeSubmitLocked"
          @click="handleCompleteSubmit"
        >
          {{ completeSubmitLocked ? '提交中...' : '提交结果' }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="batchAppointDialogVisible" title="批量预约面试（同时间段、同岗位）" width="720px" destroy-on-close>
      <el-alert type="info" :closable="false" show-icon>
        批量预约：为多位候选人同时预约同一岗位、同一时间段、同一面试官的面试场次
      </el-alert>
      <el-form
        ref="batchAppointFormRef"
        :model="batchAppointForm"
        :rules="batchAppointFormRules"
        label-width="100px"
        style="margin-top: 16px"
      >
        <el-form-item label="候选人ID" prop="resumeIds">
          <el-select
            v-model="batchAppointForm.resumeIds"
            multiple
            filterable
            allow-create
            placeholder="请输入多个简历ID，回车确认"
            style="width: 100%"
          >
            <el-option
              v-for="id in batchAppointForm.resumeIds"
              :key="'sel-' + id"
              :label="String(id)"
              :value="id"
            />
          </el-select>
          <div class="form-tip">当前已选择 {{ batchAppointForm.resumeIds?.length || 0 }} 位候选人</div>
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="岗位ID" prop="jobId">
              <el-input-number v-model="batchAppointForm.jobId" :min="1" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="面试阶段" prop="stage">
              <el-select v-model="batchAppointForm.stage" style="width: 100%">
                <el-option v-for="(label, key) in InterviewStageLabel" :key="key" :label="label" :value="key" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="面试官" prop="interviewer">
              <el-input v-model="batchAppointForm.interviewer" placeholder="请输入面试官" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="开始时间" prop="interviewTime">
              <el-date-picker
                v-model="batchAppointForm.interviewTime"
                type="datetime"
                style="width: 100%"
                value-format="YYYY-MM-DD HH:mm:ss"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="结束时间" prop="endTime">
              <el-date-picker
                v-model="batchAppointForm.endTime"
                type="datetime"
                style="width: 100%"
                value-format="YYYY-MM-DD HH:mm:ss"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="面试方式" prop="type">
              <el-select v-model="batchAppointForm.type" style="width: 100%">
                <el-option label="现场面试" value="onsite" />
                <el-option label="视频面试" value="video" />
                <el-option label="电话面试" value="phone" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="面试地点" prop="location">
              <el-input v-model="batchAppointForm.location" placeholder="请输入地点" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="batchAppointDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="batchAppointLoading" @click="handleBatchAppointSubmit">
          提交批量预约
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="batchSortDialogVisible" title="批量排序面试场次" width="480px" destroy-on-close>
      <el-form
        ref="batchSortFormRef"
        :model="batchSortForm"
        :rules="batchSortFormRules"
        label-width="100px"
      >
        <el-form-item label="排序方式" prop="sortType">
          <el-radio-group v-model="batchSortForm.sortType">
            <el-radio
              v-for="opt in BATCH_SORT_OPTIONS"
              :key="opt.value"
              :label="opt.value"
              border
            >
              {{ opt.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-alert type="info" :closable="false" show-icon style="margin-top: 8px">
          当前已选择 {{ selectedIds.length }} 条面试场次
        </el-alert>
      </el-form>
      <template #footer>
        <el-button @click="batchSortDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="batchSortLoading" @click="handleBatchSortSubmit">
          确认排序
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="batchSupplementDialogVisible" title="批量补录逾期面试记录" width="720px" destroy-on-close>
      <el-alert type="info" :closable="false" show-icon style="margin-bottom: 12px">
        批量补录：对已过面试时间但未录入记录的场次统一补录结果，状态自动同步更新简历流转
      </el-alert>
      <el-form
        ref="batchSupplementFormRef"
        :model="batchSupplementForm"
        :rules="batchSupplementFormRules"
        label-width="100px"
      >
        <el-divider content-position="left">筛选条件</el-divider>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="逾期天数" prop="days">
              <el-input-number v-model="batchSupplementForm.days" :min="1" :max="365" style="width: 100%" />
              <div class="form-tip">距今日超过N天未面试</div>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="岗位ID">
              <el-input-number v-model="batchSupplementForm.jobId" :min="1" style="width: 100%" controls-position="right" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="面试官">
              <el-input v-model="batchSupplementForm.interviewer" placeholder="可选，按面试官筛选" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="开始时间">
              <el-date-picker
                v-model="batchSupplementForm.startTime"
                type="date"
                style="width: 100%"
                value-format="YYYY-MM-DD"
                placeholder="可选，面试起始日期"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束时间">
              <el-date-picker
                v-model="batchSupplementForm.endTime"
                type="date"
                style="width: 100%"
                value-format="YYYY-MM-DD"
                placeholder="可选，面试截止日期"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-alert type="warning" :closable="false" show-icon>
          <template #title>
            <span>
              优先使用表格中已勾选的 {{ selectedIds.length }} 条记录；未勾选时按上述条件全量筛选
            </span>
          </template>
        </el-alert>
        <el-divider content-position="left">补录内容</el-divider>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="默认分数" prop="defaultScore">
              <el-input-number v-model="batchSupplementForm.defaultScore" :min="0" :max="100" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="默认结果" prop="defaultResult">
              <el-select v-model="batchSupplementForm.defaultResult" style="width: 100%">
                <el-option v-for="opt in INTERVIEW_RESULT_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="流转说明">
              <el-tag v-if="batchSupplementForm.defaultResult === InterviewResult.PASS" type="success">简历→待入职</el-tag>
              <el-tag v-else-if="batchSupplementForm.defaultResult === InterviewResult.FAIL" type="danger">简历→已淘汰</el-tag>
              <el-tag v-else type="warning">简历→保留待面试</el-tag>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="默认评价" prop="defaultEvaluation">
          <el-input v-model="batchSupplementForm.defaultEvaluation" type="textarea" :rows="2" maxlength="500" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchSupplementDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="batchSupplementLoading" @click="handleBatchSupplementSubmit">
          确认批量补录
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="batchModifyPendingDialogVisible" title="批量修改待定面试结果" width="720px" destroy-on-close>
      <el-alert type="warning" :closable="false" show-icon style="margin-bottom: 12px">
        仅对结果为【待定】的场次生效；系统自动校验同一候选人多场次结果一致性，避免冲突
      </el-alert>
      <el-form
        ref="batchModifyPendingFormRef"
        :model="batchModifyPendingForm"
        :rules="batchModifyPendingFormRules"
        label-width="100px"
      >
        <el-divider content-position="left">筛选条件</el-divider>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="岗位ID">
              <el-input-number v-model="batchModifyPendingForm.jobId" :min="1" style="width: 100%" controls-position="right" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="面试官">
              <el-input v-model="batchModifyPendingForm.interviewer" placeholder="可选，按面试官筛选" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="开始时间">
              <el-date-picker
                v-model="batchModifyPendingForm.startTime"
                type="date"
                style="width: 100%"
                value-format="YYYY-MM-DD"
                placeholder="可选，面试起始日期"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束时间">
              <el-date-picker
                v-model="batchModifyPendingForm.endTime"
                type="date"
                style="width: 100%"
                value-format="YYYY-MM-DD"
                placeholder="可选，面试截止日期"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-alert type="info" :closable="false" show-icon>
          <template #title>
            <span>
              优先使用表格中已勾选的 {{ selectedIds.length }} 条记录；未勾选时按上述条件全量筛选 PENDING_DECISION 场次
            </span>
          </template>
        </el-alert>
        <el-divider content-position="left">目标结果</el-divider>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="目标结果" prop="targetResult">
              <el-radio-group v-model="batchModifyPendingForm.targetResult">
                <el-radio-button
                  v-for="opt in INTERVIEW_RESULT_OPTIONS.filter(o => o.value !== InterviewResult.PENDING_DECISION)"
                  :key="opt.value"
                  :value="opt.value"
                >
                  <span :style="{ color: 'var(--el-color-' + opt.type + ')' }">
                    {{ opt.label }}
                  </span>
                </el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="目标分数">
              <el-input-number v-model="batchModifyPendingForm.targetScore" :min="0" :max="100" :precision="1" style="width: 100%" />
              <div class="form-tip">可选，留空则不修改现有评分</div>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="流转说明">
          <el-tag v-if="batchModifyPendingForm.targetResult === InterviewResult.PASS" type="success">简历→待入职（OFFER）</el-tag>
          <el-tag v-else-if="batchModifyPendingForm.targetResult === InterviewResult.FAIL" type="danger">简历→已淘汰（REJECTED）</el-tag>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchModifyPendingDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="batchModifyPendingLoading" @click="handleBatchModifyPendingSubmit">
          确认批量修改
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailVisible" title="面试详情&操作溯源" width="900px" destroy-on-close>
      <el-descriptions :column="2" border v-if="detailData.id">
        <el-descriptions-item label="场次状态" :span="2">
          <el-tag :type="InterviewSessionStatusType[detailData.sessionStatus]" effect="dark">
            {{ InterviewSessionStatusLabel[detailData.sessionStatus] }}
          </el-tag>
          <el-icon v-if="detailData.isLocked" style="margin-left: 8px; color: #e6a23c"><Lock /></el-icon>
        </el-descriptions-item>
        <el-descriptions-item label="候选人">{{ detailData.resume?.name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="应聘岗位">{{ detailData.job?.title || '-' }}</el-descriptions-item>
        <el-descriptions-item label="匹配度">{{ detailData.matchScoreSnapshot }}分</el-descriptions-item>
        <el-descriptions-item label="岗位紧急度">{{ detailData.jobUrgencySnapshot }}</el-descriptions-item>
        <el-descriptions-item label="面试阶段">{{ InterviewStageLabel[detailData.stage] }}</el-descriptions-item>
        <el-descriptions-item label="面试官">{{ detailData.interviewer || '-' }}</el-descriptions-item>
        <el-descriptions-item label="面试时间">{{ formatDateTime(detailData.interviewTime) }}</el-descriptions-item>
        <el-descriptions-item label="结束时间">{{ formatDateTime(detailData.endTime) }}</el-descriptions-item>
        <el-descriptions-item label="面试地点">{{ detailData.location || '-' }}</el-descriptions-item>
        <el-descriptions-item label="面试方式">{{ detailData.type || '-' }}</el-descriptions-item>
        <el-descriptions-item label="面试结果">
          <el-tag :type="InterviewResultType[detailData.result]">{{ InterviewResultLabel[detailData.result] }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="评分">{{ detailData.score || '-' }}</el-descriptions-item>
        <el-descriptions-item label="预约人">{{ detailData.appointOperatorName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="预约时间">{{ formatDateTime(detailData.appointTime) }}</el-descriptions-item>
        <el-descriptions-item label="完成时间">{{ formatDateTime(detailData.completeTime) }}</el-descriptions-item>
        <el-descriptions-item label="取消时间">{{ formatDateTime(detailData.cancelTime) }}</el-descriptions-item>
        <el-descriptions-item label="综合评价" :span="2">{{ detailData.evaluation || '-' }}</el-descriptions-item>
        <el-descriptions-item label="面试反馈" :span="2">{{ detailData.feedback || '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ detailData.remark || '-' }}</el-descriptions-item>
      </el-descriptions>

      <el-divider>取消记录</el-divider>
      <el-descriptions v-if="detailData.cancelRecord" :column="2" border size="small">
        <el-descriptions-item label="取消原因类型">
          {{ InterviewCancelReasonTypeLabel[detailData.cancelRecord.reasonType as InterviewCancelReasonType] || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="取消人">{{ detailData.cancelRecord.cancellerName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="候选人发起">
          {{ detailData.cancelRecord.cancelledByCandidate ? '是' : '否' }}
        </el-descriptions-item>
        <el-descriptions-item label="取消时间">
          {{ formatDateTime(detailData.cancelRecord.created_at) }}
        </el-descriptions-item>
        <el-descriptions-item label="详细原因" :span="2">
          {{ detailData.cancelRecord.reasonDetail }}
        </el-descriptions-item>
      </el-descriptions>
      <el-empty v-else description="无取消记录" :image-size="60" />

      <el-divider>操作溯源记录</el-divider>
      <el-table :data="operationLogs" size="small" stripe>
        <el-table-column prop="created_at" label="时间" width="170">
          <template #default="{ row }">{{ formatDateTime(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="140">
          <template #default="{ row }">{{ InterviewActionLabel[row.action as InterviewAction] || row.action }}</template>
        </el-table-column>
        <el-table-column label="状态变更" width="180">
          <template #default="{ row }">
            <el-space>
              <el-tag size="small" v-if="row.beforeStatus" :type="InterviewSessionStatusType[row.beforeStatus as InterviewSessionStatus]">
                {{ InterviewSessionStatusLabel[row.beforeStatus as InterviewSessionStatus] }}
              </el-tag>
              <el-icon><ArrowRight /></el-icon>
              <el-tag size="small" v-if="row.afterStatus" :type="InterviewSessionStatusType[row.afterStatus as InterviewSessionStatus]">
                {{ InterviewSessionStatusLabel[row.afterStatus as InterviewSessionStatus] }}
              </el-tag>
            </el-space>
          </template>
        </el-table-column>
        <el-table-column prop="operatorName" label="操作人" width="110" />
        <el-table-column prop="remark" label="备注" min-width="200" show-overflow-tooltip />
      </el-table>
    </el-dialog>

    <el-dialog
      v-model="timeConflictDialogVisible"
      title="时间冲突提醒"
      width="480px"
      :close-on-click-modal="false"
    >
      <el-alert type="error" :closable="false" show-icon>
        <template #title>面试官与以下场次时间冲突，请调整时间或面试官</template>
        <ul class="conflict-list">
          <li v-for="(item, idx) in conflictInfos" :key="idx">
            <span>第{{ idx + 1 }}场：</span>
            {{ formatDateTime(item.interviewTime) }} ~ {{ formatTime(item.endTime) }}
          </li>
        </ul>
      </el-alert>
    </el-dialog>

    <el-dialog v-model="allocateDialogVisible" :title="allocateTarget ? '调配面试官' : '批量替换面试官'" width="750px" destroy-on-close class="fade-dialog">
      <el-alert
        v-if="allocateTarget"
        type="info"
        :closable="false"
        show-icon
        style="margin-bottom: 12px"
      >
        当前场次：{{ allocateTarget.resume?.name || '-' }} - {{ allocateTarget.job?.title || '-' }}，原面试官：{{ allocateTarget.interviewer || '未分配' }}
      </el-alert>
      <el-alert
        v-else
        type="info"
        :closable="false"
        show-icon
        style="margin-bottom: 12px"
      >
        将为已勾选的 {{ selectedIds.length }} 条场次批量替换面试官
      </el-alert>
      <el-alert
        v-if="allocateValidationResult.warnings.length > 0"
        type="warning"
        :closable="false"
        show-icon
        style="margin-bottom: 12px"
      >
        {{ allocateValidationResult.warnings.join('；') }}
      </el-alert>
      <el-alert
        v-if="allocateValidationResult.errors.length > 0"
        type="error"
        :closable="false"
        show-icon
        style="margin-bottom: 12px"
      >
        {{ allocateValidationResult.errors.join('；') }}
      </el-alert>
      <el-form label-width="100px">
        <el-form-item label="目标面试官">
          <el-select
            v-model="allocateForm.targetInterviewerId"
            placeholder="请选择面试官"
            style="width: 100%"
            filterable
            @change="handleInterviewerSelect"
          >
            <el-option
              v-for="item in availableInterviewers"
              :key="item.id"
              :label="`${item.name} - ${item.department || ''} ${item.position || ''} (${InterviewerStatusLabel[item.interviewerStatus as InterviewerStatus]}，今日${item.dailyWorkload}场)`"
              :value="item.id"
              :disabled="[InterviewerStatus.BUSY, InterviewerStatus.ON_LEAVE].includes(item.interviewerStatus)"
            >
              <div style="display: flex; justify-content: space-between; align-items: center">
                <span>{{ item.name }} - {{ item.department || '' }}</span>
                <el-space size="4">
                  <el-tag :type="InterviewerStatusType[item.interviewerStatus as InterviewerStatus]" size="small">
                    {{ InterviewerStatusLabel[item.interviewerStatus as InterviewerStatus] }}
                  </el-tag>
                  <el-tag v-if="item.interviewerDomain" size="small" effect="plain">
                    {{ InterviewerDomainLabel[item.interviewerDomain as InterviewerDomain] }}
                  </el-tag>
                  <el-tag size="small" type="info">今日{{ item.dailyWorkload }}场</el-tag>
                </el-space>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        <template v-if="selectedInterviewerInfo">
          <el-descriptions :column="3" border size="small">
            <el-descriptions-item label="姓名">{{ selectedInterviewerInfo.name }}</el-descriptions-item>
            <el-descriptions-item label="部门">{{ selectedInterviewerInfo.department || '-' }}</el-descriptions-item>
            <el-descriptions-item label="职位">{{ selectedInterviewerInfo.position || '-' }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="InterviewerStatusType[selectedInterviewerInfo.interviewerStatus as InterviewerStatus]" size="small">
                {{ InterviewerStatusLabel[selectedInterviewerInfo.interviewerStatus as InterviewerStatus] }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="擅长领域">
              <el-tag v-if="selectedInterviewerInfo.interviewerDomain" size="small">
                {{ InterviewerDomainLabel[selectedInterviewerInfo.interviewerDomain as InterviewerDomain] }}
              </el-tag>
              <span v-else>-</span>
            </el-descriptions-item>
            <el-descriptions-item label="工作量">
              今日 {{ selectedInterviewerInfo.dailyWorkload }}/{{ INTERVIEWER_ALLOCATION_RULES.MAX_DAILY_INTERVIEWS }}场
              <el-progress
                :percentage="Number((selectedInterviewerInfo.dailyWorkload / INTERVIEWER_ALLOCATION_RULES.MAX_DAILY_INTERVIEWS * 100).toFixed(0))"
                :stroke-width="6"
                :color="selectedInterviewerInfo.dailyWorkload >= INTERVIEWER_ALLOCATION_RULES.MAX_DAILY_INTERVIEWS * INTERVIEWER_ALLOCATION_RULES.OVERLOAD_THRESHOLD ? '#e6a23c' : '#67c23a'"
                style="width: 100px; display: inline-block; margin-left: 8px"
              />
            </el-descriptions-item>
          </el-descriptions>
          <el-alert
            v-if="!allocateValidationResult.domainMatched"
            type="warning"
            :closable="false"
            show-icon
            style="margin-top: 12px"
          >
            面试官擅长领域与岗位领域不匹配，跨领域调配需二次确认
          </el-alert>
        </template>
        <el-form-item v-if="allocateValidationResult.crossDomain" label="跨领域确认" style="margin-top: 16px">
          <el-switch v-model="allocateForm.crossDomainConfirmed" active-text="已确认" inactive-text="未确认" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="allocateDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="allocateLoading" @click="handleAllocateSubmit">
          {{ allocateTarget ? '确认调配' : '批量替换' }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="batchScheduleDialogVisible" title="批量排班优化" width="800px" destroy-on-close class="fade-dialog">
      <el-form label-width="100px">
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="优化策略">
              <el-select v-model="batchScheduleForm.optimizeBy" style="width: 100%">
                <el-option label="工作量均衡" value="workload" />
                <el-option label="领域匹配优先" value="domain" />
                <el-option label="综合可用性" value="availability" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="岗位ID">
              <el-input-number v-model="batchScheduleForm.jobId" :min="1" style="width: 100%" controls-position="right" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="面试官ID">
              <el-input-number v-model="batchScheduleForm.interviewerId" :min="1" style="width: 100%" controls-position="right" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-alert type="info" :closable="false" show-icon>
          <template #title>已勾选 {{ selectedIds.length }} 条记录优先参与优化</template>
        </el-alert>
      </el-form>
      <el-table
        v-if="scheduleSuggestions.length > 0"
        :data="scheduleSuggestions"
        border
        style="margin-top: 16px"
        max-height="400"
      >
        <el-table-column prop="interviewId" label="场次ID" width="80" />
        <el-table-column prop="currentInterviewer" label="当前面试官" width="120" />
        <el-table-column prop="suggestedInterviewer" label="建议面试官" width="120" />
        <el-table-column prop="reason" label="优化原因" min-width="200" show-overflow-tooltip />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleApplySuggestion(row)">应用</el-button>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="batchScheduleDialogVisible = false">关闭</el-button>
        <el-button type="primary" :loading="batchScheduleLoading" @click="handleBatchScheduleSubmit">生成优化建议</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="workloadDialogVisible" title="面试官工作量统计" width="900px" destroy-on-close class="fade-dialog">
      <el-form :inline="true" style="margin-bottom: 16px">
        <el-form-item label="面试官ID">
          <el-input-number v-model="workloadInterviewerId" :min="1" style="width: 160px" controls-position="right" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="workloadLoading" @click="handleWorkloadSearch">查询</el-button>
        </el-form-item>
      </el-form>
      <template v-if="workloadData">
        <el-descriptions :column="3" border size="small" style="margin-bottom: 16px">
          <el-descriptions-item label="姓名">{{ workloadData.interviewer?.name }}</el-descriptions-item>
          <el-descriptions-item label="部门">{{ workloadData.interviewer?.department || '-' }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="InterviewerStatusType[workloadData.interviewer?.interviewerStatus as InterviewerStatus]" size="small">
              {{ InterviewerStatusLabel[workloadData.interviewer?.interviewerStatus as InterviewerStatus] }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="擅长领域">{{ InterviewerDomainLabel[workloadData.interviewer?.interviewerDomain as InterviewerDomain] || '-' }}</el-descriptions-item>
          <el-descriptions-item label="每日上限">{{ workloadData.interviewer?.maxDailyInterviews || INTERVIEWER_ALLOCATION_RULES.MAX_DAILY_INTERVIEWS }}场</el-descriptions-item>
          <el-descriptions-item label="通过率">
            <span :style="{ color: workloadData.workload?.passRate >= 60 ? '#67c23a' : '#f56c6c' }">
              {{ workloadData.workload?.passRate || 0 }}%
            </span>
          </el-descriptions-item>
        </el-descriptions>
        <el-row :gutter="16" style="margin-bottom: 16px">
          <el-col :span="6"><el-statistic title="今日面试" :value="workloadData.workload?.daily || 0" suffix="场" /></el-col>
          <el-col :span="6"><el-statistic title="本周面试" :value="workloadData.workload?.weekly || 0" suffix="场" /></el-col>
          <el-col :span="6"><el-statistic title="本月面试" :value="workloadData.workload?.monthly || 0" suffix="场" /></el-col>
          <el-col :span="6"><el-statistic title="累计完成" :value="workloadData.workload?.completedCount || 0" suffix="场" /></el-col>
        </el-row>
        <el-divider content-position="left">待面试场次</el-divider>
        <el-table :data="workloadData.upcomingSessions || []" border size="small" max-height="200">
          <el-table-column prop="interviewTime" label="面试时间" width="160">
            <template #default="{ row }">{{ formatDateTime(row.interviewTime) }}</template>
          </el-table-column>
          <el-table-column prop="stage" label="阶段" width="80" />
          <el-table-column prop="resumeName" label="候选人" width="100" />
          <el-table-column prop="jobTitle" label="岗位" min-width="120" show-overflow-tooltip />
        </el-table>
      </template>
      <el-empty v-else description="请输入面试官ID查询工作量统计" />
    </el-dialog>

    <el-dialog v-model="allocationLogDialogVisible" title="调配记录溯源" width="800px" destroy-on-close class="fade-dialog">
      <el-table :data="allocationLogs" v-loading="allocationLogLoading" border size="small" max-height="500">
        <el-table-column prop="action" label="动作" width="120">
          <template #default="{ row }">{{ AllocationActionLabel[row.action as AllocationAction] || row.action }}</template>
        </el-table-column>
        <el-table-column prop="interviewerName" label="目标面试官" width="100" />
        <el-table-column prop="previousInterviewerName" label="原面试官" width="100" />
        <el-table-column prop="remark" label="备注" min-width="200" show-overflow-tooltip />
        <el-table-column prop="operatorName" label="操作人" width="80" />
        <el-table-column prop="created_at" label="时间" width="160">
          <template #default="{ row }">{{ formatDateTime(row.created_at) }}</template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <el-dialog v-model="warningListDialogVisible" title="逾期预警列表" width="1100px" destroy-on-close class="fade-dialog zoom-fade-dialog">
      <el-row :gutter="16" style="margin-bottom: 16px">
        <el-col :span="6">
          <el-select v-model="warningListFilter.warningStatus" placeholder="预警状态" clearable style="width: 100%" @change="fetchWarningList">
            <el-option v-for="opt in WARNING_STATUS_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-select v-model="warningListFilter.warningLevel" placeholder="预警等级" clearable style="width: 100%" @change="fetchWarningList">
            <el-option v-for="opt in WARNING_LEVEL_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-select v-model="warningListFilter.sortBy" placeholder="排序方式" style="width: 100%" @change="fetchWarningList">
            <el-option label="面试时间" value="interviewTime" />
            <el-option label="预警等级" value="warningLevel" />
            <el-option label="岗位紧急度" value="jobUrgency" />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-space>
            <el-button type="primary" :loading="warningListLoading" @click="fetchWarningList">查询</el-button>
            <el-button type="success" @click="handleBatchHandleOverdueOpen" :disabled="warningSelectedIds.length === 0">批量处理</el-button>
            <el-button type="warning" @click="handleBatchPostponeOpen" :disabled="warningSelectedIds.length === 0">批量延后</el-button>
          </el-space>
        </el-col>
      </el-row>
      <el-row :gutter="16" style="margin-bottom: 12px">
        <el-col :span="24">
          <el-space>
            <el-tag type="danger">即将逾期：{{ warningStats.approachingCount || 0 }}</el-tag>
            <el-tag type="danger" effect="dark">已逾期：{{ warningStats.overdueCount || 0 }}</el-tag>
            <el-tag type="info">已处理：{{ warningStats.handledCount || 0 }}</el-tag>
            <el-tag type="success">正常：{{ warningStats.normalCount || 0 }}</el-tag>
          </el-space>
        </el-col>
      </el-row>
      <el-table
        :data="warningListData"
        v-loading="warningListLoading"
        border
        size="small"
        max-height="450"
        :row-class-name="warningRowClassName"
        @selection-change="handleWarningSelectionChange"
      >
        <el-table-column type="selection" width="40" />
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column label="预警状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="WarningStatusType[row.warningStatus as WarningStatus]" size="small" effect="dark">
              {{ WarningStatusLabel[row.warningStatus as WarningStatus] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="预警等级" width="110" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.warningLevel && row.warningLevel !== 'normal'" :type="WarningLevelType[row.warningLevel as WarningLevel]" size="small">
              {{ WarningLevelLabel[row.warningLevel as WarningLevel] }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="候选人" width="90">
          <template #default="{ row }">{{ row.resume?.name || '-' }}</template>
        </el-table-column>
        <el-table-column label="岗位" width="120" show-overflow-tooltip>
          <template #default="{ row }">{{ row.job?.title || '-' }}</template>
        </el-table-column>
        <el-table-column prop="interviewer" label="面试官" width="80" />
        <el-table-column label="面试时间" width="160">
          <template #default="{ row }">{{ formatDateTime(row.interviewTime) }}</template>
        </el-table-column>
        <el-table-column label="倒计时" width="100" align="center">
          <template #default="{ row }">
            <span v-if="row.countdownMs !== null && row.countdownMs !== undefined" :style="{ color: row.countdownMs <= 0 ? '#f56c6c' : row.countdownMs <= 3600000 ? '#e6a23c' : '#67c23a' }">
              {{ formatCountdown(row.countdownMs) }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="逾期原因" min-width="120" show-overflow-tooltip>
          <template #default="{ row }">{{ row.overdueReasonType ? OverdueReasonTypeLabel[row.overdueReasonType as OverdueReasonType] : '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.warningStatus === WarningStatus.OVERDUE" type="danger" link size="small" @click="handleOverdueRow(row)">处理</el-button>
            <el-button v-if="row.warningStatus !== WarningStatus.NORMAL && row.warningStatus !== WarningStatus.HANDLED" type="warning" link size="small" @click="handleDismissWarning(row)">解除</el-button>
            <el-button v-if="row.warningStatus !== WarningStatus.NORMAL" type="info" link size="small" @click="handleMarkFalseAlarm(row)">误报</el-button>
            <el-button type="primary" link size="small" @click="handleViewWarningLogs(row)">溯源</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <el-dialog v-model="handleOverdueDialogVisible" title="处理逾期面试" width="600px" destroy-on-close class="fade-dialog zoom-fade-dialog">
      <el-alert v-if="overdueTarget" type="error" :closable="false" show-icon style="margin-bottom: 12px">
        逾期场次：{{ overdueTarget.resume?.name || '-' }} - {{ overdueTarget.job?.title || '-' }}，面试官：{{ overdueTarget.interviewer || '-' }}
      </el-alert>
      <el-form :model="handleOverdueForm" label-width="100px" :rules="handleOverdueFormRules" ref="handleOverdueFormRef">
        <el-form-item label="逾期原因" prop="overdueReasonType">
          <el-select v-model="handleOverdueForm.overdueReasonType" placeholder="请选择逾期原因类型" style="width: 100%">
            <el-option v-for="opt in OVERDUE_REASON_TYPE_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="原因说明" prop="overdueReason">
          <el-input v-model="handleOverdueForm.overdueReason" type="textarea" :rows="3" placeholder="请详细说明逾期原因" maxlength="500" show-word-limit />
        </el-form-item>
        <el-form-item label="补救方案" prop="remedyPlan">
          <el-input v-model="handleOverdueForm.remedyPlan" type="textarea" :rows="3" placeholder="请填写补救方案" maxlength="500" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleOverdueDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="handleOverdueLoading" @click="handleOverdueSubmit">确认处理</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="batchHandleOverdueDialogVisible" title="批量处理逾期面试" width="600px" destroy-on-close class="fade-dialog">
      <el-alert type="info" :closable="false" show-icon style="margin-bottom: 12px">
        将批量处理选中的 {{ warningSelectedIds.length }} 条逾期/即将逾期场次
      </el-alert>
      <el-form :model="batchHandleOverdueForm" label-width="100px">
        <el-form-item label="逾期原因">
          <el-select v-model="batchHandleOverdueForm.overdueReasonType" placeholder="请选择" style="width: 100%">
            <el-option v-for="opt in OVERDUE_REASON_TYPE_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="原因说明">
          <el-input v-model="batchHandleOverdueForm.overdueReason" type="textarea" :rows="3" placeholder="逾期原因说明" maxlength="500" show-word-limit />
        </el-form-item>
        <el-form-item label="补救方案">
          <el-input v-model="batchHandleOverdueForm.remedyPlan" type="textarea" :rows="3" placeholder="补救方案" maxlength="500" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchHandleOverdueDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="batchHandleOverdueLoading" @click="handleBatchHandleOverdueSubmit">确认批量处理</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="batchPostponeDialogVisible" title="批量延后面试时间" width="500px" destroy-on-close class="fade-dialog">
      <el-alert type="info" :closable="false" show-icon style="margin-bottom: 12px">
        将为选中的 {{ warningSelectedIds.length }} 条场次延后面试时间
      </el-alert>
      <el-form label-width="100px">
        <el-form-item label="延后时长">
          <el-input-number v-model="batchPostponeHours" :min="1" :max="72" style="width: 200px" controls-position="right" />
          <span style="margin-left: 8px">小时</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchPostponeDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="batchPostponeLoading" @click="handleBatchPostponeSubmit">确认延后</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="warningLogDialogVisible" title="预警记录溯源" width="900px" destroy-on-close class="fade-dialog">
      <el-table :data="warningLogs" v-loading="warningLogLoading" border size="small" max-height="500" :row-class-name="warningLogRowClassName">
        <el-table-column prop="action" label="动作" width="140">
          <template #default="{ row }">{{ WarningActionLabel[row.action as WarningAction] || row.action }}</template>
        </el-table-column>
        <el-table-column label="预警状态" width="100">
          <template #default="{ row }">
            <el-tag :type="WarningStatusType[row.warningStatus as WarningStatus]" size="small">
              {{ WarningStatusLabel[row.warningStatus as WarningStatus] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="预警等级" width="110">
          <template #default="{ row }">
            <el-tag v-if="row.warningLevel && row.warningLevel !== 'normal'" :type="WarningLevelType[row.warningLevel as WarningLevel]" size="small">
              {{ WarningLevelLabel[row.warningLevel as WarningLevel] }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="overdueReason" label="逾期原因" min-width="150" show-overflow-tooltip />
        <el-table-column prop="remedyPlan" label="补救方案" min-width="150" show-overflow-tooltip />
        <el-table-column prop="handlerName" label="处理人" width="80" />
        <el-table-column prop="operatorName" label="操作人" width="80" />
        <el-table-column prop="created_at" label="时间" width="160">
          <template #default="{ row }">{{ formatDateTime(row.created_at) }}</template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <el-backtop :right="40" :bottom="40" v-if="showBackToTop">
      <el-icon><Top /></el-icon>
    </el-backtop>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue';
import {
  ElMessage, ElMessageBox, type FormInstance, type FormRules, type FormItemProp,
} from 'element-plus';
import {
  Plus, Delete, Tickets, Clock, Sort, Lock, ArrowRight, DocumentAdd, EditPen, WarningFilled, UserFilled, Refresh, DataLine, Top, AlarmClock, Warning,
} from '@element-plus/icons-vue';
import dayjs from 'dayjs';
import { SearchForm, ProTable } from '@/components';
import {
  getInterviewListApi,
  createInterviewApi,
  updateInterviewApi,
  deleteInterviewApi,
  batchDeleteInterviewApi,
  getInterviewDetailApi,
  getInterviewOperationLogsApi,
  getInterviewStatsApi,
  confirmAppointmentApi,
  confirmByInterviewerApi,
  completeInterviewApi,
  cancelInterviewApi,
  validateTimeConflictApi,
  batchAppointApi,
  batchCancelOverdueApi,
  batchSortApi,
  validateInterviewRecordApi,
  batchSupplementOverdueApi,
  batchUpdatePendingResultsApi,
  allocateInterviewerApi,
  updateInterviewerStatusApi,
  getAvailableInterviewersApi,
  batchReplaceInterviewerApi,
  batchScheduleOptimizeApi,
  getInterviewerWorkloadApi,
  getAllocationLogsApi,
  checkWarningsApi,
  getWarningListApi,
  getWarningStatsApi,
  handleOverdueInterviewApi,
  batchHandleOverdueApi,
  batchPostponeInterviewsApi,
  dismissWarningApi,
  markFalseAlarmApi,
  getWarningLogsApi,
  getOverdueRateStatsApi,
  sortWarningListApi,
  type InterviewItem,
  type CancelInterviewParams,
  type BatchAppointItem,
} from '@/api/interview';
import {
  InterviewStage,
  InterviewStageLabel,
  InterviewResult,
  InterviewResultLabel,
  InterviewResultType,
  DATETIME_FORMAT,
  InterviewSessionStatus,
  InterviewSessionStatusLabel,
  InterviewSessionStatusType,
  INTERVIEW_SESSION_STATUS_OPTIONS,
  InterviewActionLabel,
  InterviewCancelReasonType,
  InterviewCancelReasonTypeLabel,
  CANCEL_REASON_OPTIONS,
  InterviewBatchSortType,
  BATCH_SORT_OPTIONS,
  REMARK_MAX_LENGTH,
  UserRole,
  InterviewScoreDimension,
  InterviewScoreDimensionLabel,
  INTERVIEW_SCORE_RANGE,
  SCORE_RESULT_MATCH_RULES,
  INTERVIEW_RECORD_VALIDATION_RULES,
  InterviewAbnormalScoreType,
  InterviewAbnormalScoreColor,
  INTERVIEW_RESULT_OPTIONS,
  InterviewerStatus,
  InterviewerStatusLabel,
  InterviewerStatusType,
  INTERVIEWER_STATUS_OPTIONS,
  InterviewerDomain,
  InterviewerDomainLabel,
  INTERVIEWER_DOMAIN_OPTIONS,
  JOB_CATEGORY_DOMAIN_MAP,
  AllocationAction,
  AllocationActionLabel,
  INTERVIEWER_ALLOCATION_RULES,
  WarningStatus,
  WarningStatusLabel,
  WarningStatusType,
  WARNING_STATUS_OPTIONS,
  WarningLevel,
  WarningLevelLabel,
  WarningLevelType,
  WARNING_LEVEL_OPTIONS,
  OverdueReasonType,
  OverdueReasonTypeLabel,
  OVERDUE_REASON_TYPE_OPTIONS,
  WarningAction,
  WarningActionLabel,
  INTERVIEW_WARNING_RULES,
  WARNING_SORT_STRATEGIES,
} from '@/constants/recruitment';
import { useUserStore } from '@/store/modules/user';

const userStore = useUserStore();
const canBatchOperate = computed(() => {
  const role = userStore.user?.role;
  return role === UserRole.ADMIN || role === UserRole.HR;
});

const loading = ref(false);
const tableData = ref<InterviewItem[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const selectedIds = ref<number[]>([]);
const selectedRows = ref<InterviewItem[]>([]);

const stats = ref({ total: 0, successCount: 0, cancelledCount: 0, pendingCount: 0, successRate: 0 });
const activeTab = ref('');

const searchForm = reactive({
  sessionStatus: '',
  stage: '',
  result: '',
  interviewer: '',
  keyword: '',
});

const globalProgress = ref(0);
const shakeField = ref<string>('');

const appointDialogVisible = ref(false);
const isEdit = ref(false);
const submitLoading = ref(false);
const appointFormRef = ref<FormInstance>();
const appointForm = reactive<Partial<InterviewItem>>({
  resumeId: undefined,
  jobId: undefined,
  stage: InterviewStage.FIRST,
  interviewer: '',
  interviewTime: undefined,
  endTime: undefined,
  location: '',
  type: 'onsite',
  remark: '',
});
const appointFormRules: FormRules = {
  resumeId: [{ required: true, message: '请输入简历ID', trigger: 'blur' }],
  jobId: [{ required: true, message: '请输入岗位ID', trigger: 'blur' }],
  stage: [{ required: true, message: '请选择面试阶段', trigger: 'change' }],
  interviewer: [{ required: true, message: '请输入面试官', trigger: 'blur' }],
  interviewTime: [{ required: true, message: '请选择面试时间', trigger: 'change' }],
  endTime: [{ required: true, message: '请选择结束时间', trigger: 'change' }],
};

const cancelDialogVisible = ref(false);
const cancelTarget = ref<InterviewItem | null>(null);
const cancelLoading = ref(false);
const cancelFormRef = ref<FormInstance>();
const cancelForm = reactive<CancelInterviewParams>({
  reasonType: InterviewCancelReasonType.OTHER,
  reasonDetail: '',
  cancelledByCandidate: false,
});
const cancelFormRules: FormRules = {
  reasonType: [{ required: true, message: '请选择取消原因类型', trigger: 'change' }],
  reasonDetail: [
    { required: true, message: '请填写详细取消原因', trigger: 'blur' },
    { min: 5, message: '至少5个字符', trigger: 'blur' },
  ],
};

const completeDialogVisible = ref(false);
const completeTarget = ref<InterviewItem | null>(null);
const completeLoading = ref(false);
const completeFormRef = ref<FormInstance>();
const completeSubmitLocked = ref(false);
const completeValidateResult = reactive({
  valid: true,
  errors: [] as string[],
  warnings: [] as string[],
  allowedResults: Object.values(InterviewResult),
  abnormal: undefined as any,
  conflicts: [] as any[],
});
const scoreDimensionForm = reactive<Record<string, number>>({});
const scoreDimensionErrors = reactive<Record<string, boolean>>({});
const focusedField = ref<string>('');
const completeErrorFields = reactive<Set<string>>(new Set());
const completeForm = reactive({
  result: InterviewResult.PENDING as InterviewResult,
  score: undefined as number | undefined,
  evaluation: '',
  feedback: '',
  nextStage: '',
  nextTime: undefined as string | undefined,
  scoreDetail: undefined as string | undefined,
});
const completeFormRules: FormRules = {
  result: [{ required: true, message: '请选择面试结果', trigger: 'change' }],
  evaluation: [{ required: true, min: INTERVIEW_RECORD_VALIDATION_RULES.MIN_EVALUATION_LENGTH, message: `综合评价不少于${INTERVIEW_RECORD_VALIDATION_RULES.MIN_EVALUATION_LENGTH}字`, trigger: 'blur' }],
};

const batchAppointDialogVisible = ref(false);
const batchAppointLoading = ref(false);
const batchAppointFormRef = ref<FormInstance>();
const batchAppointForm = reactive({
  resumeIds: [] as number[],
  jobId: undefined as number | undefined,
  stage: InterviewStage.FIRST,
  interviewer: '',
  interviewTime: undefined as string | undefined,
  endTime: undefined as string | undefined,
  type: 'onsite',
  location: '',
});
const batchAppointFormRules: FormRules = {
  resumeIds: [{ required: true, type: 'array', min: 1, message: '请至少选择1位候选人', trigger: 'change' }],
  jobId: [{ required: true, message: '请输入岗位ID', trigger: 'blur' }],
  stage: [{ required: true, message: '请选择面试阶段', trigger: 'change' }],
  interviewer: [{ required: true, message: '请输入面试官', trigger: 'blur' }],
  interviewTime: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  endTime: [{ required: true, message: '请选择结束时间', trigger: 'change' }],
};

const batchSortDialogVisible = ref(false);
const batchSortLoading = ref(false);
const batchCancelLoading = ref(false);
const batchSortFormRef = ref<FormInstance>();
const batchSortForm = reactive({
  sortType: InterviewBatchSortType.MATCH_AND_URGENCY,
});
const batchSortFormRules: FormRules = {
  sortType: [{ required: true, message: '请选择排序方式', trigger: 'change' }],
};

const batchSupplementDialogVisible = ref(false);
const batchSupplementLoading = ref(false);
const batchSupplementFormRef = ref<FormInstance>();
const batchSupplementOverdueCount = ref(0);
const batchSupplementForm = reactive({
  days: INTERVIEW_RECORD_VALIDATION_RULES.SUPPLEMENT_DAYS_LIMIT,
  jobId: undefined as number | undefined,
  interviewer: '',
  startTime: undefined as string | undefined,
  endTime: undefined as string | undefined,
  defaultScore: 75,
  defaultResult: InterviewResult.FAIL as InterviewResult,
  defaultEvaluation: '逾期未面试，批量补录',
  ids: [] as number[],
});
const batchSupplementFormRules: FormRules = {
  days: [{ required: true, type: 'number', min: 1, message: '请输入逾期天数', trigger: 'blur' }],
  defaultScore: [{ required: true, type: 'number', min: 0, max: 100, message: '请输入默认分数(0-100)', trigger: 'blur' }],
  defaultResult: [{ required: true, message: '请选择默认结果', trigger: 'change' }],
  defaultEvaluation: [{ required: true, min: 10, message: '评价至少10字', trigger: 'blur' }],
};

const batchModifyPendingDialogVisible = ref(false);
const batchModifyPendingLoading = ref(false);
const batchModifyPendingFormRef = ref<FormInstance>();
const batchModifyPendingCount = ref(0);
const batchModifyPendingForm = reactive({
  targetResult: InterviewResult.FAIL as InterviewResult,
  targetScore: undefined as number | undefined,
  jobId: undefined as number | undefined,
  interviewer: '',
  startTime: undefined as string | undefined,
  endTime: undefined as string | undefined,
  ids: [] as number[],
});
const batchModifyPendingFormRules: FormRules = {
  targetResult: [{ required: true, message: '请选择目标结果', trigger: 'change' }],
};

const allocateDialogVisible = ref(false);
const allocateLoading = ref(false);
const allocateTarget = ref<InterviewItem | null>(null);
const availableInterviewers = ref<any[]>([]);
const allocateFormRef = ref<FormInstance>();
const allocateForm = reactive({
  targetInterviewerId: undefined as number | undefined,
  crossDomainConfirmed: false,
  jobCategory: '',
});
const allocateValidationResult = reactive({
  errors: [] as string[],
  warnings: [] as string[],
  crossDomain: false,
  domainMatched: true,
});
const selectedInterviewerInfo = ref<any>(null);

const batchScheduleDialogVisible = ref(false);
const batchScheduleLoading = ref(false);
const batchScheduleFormRef = ref<FormInstance>();
const batchScheduleForm = reactive({
  optimizeBy: 'workload' as 'workload' | 'domain' | 'availability',
  jobId: undefined as number | undefined,
  interviewerId: undefined as number | undefined,
});
const scheduleSuggestions = ref<any[]>([]);

const workloadDialogVisible = ref(false);
const workloadLoading = ref(false);
const workloadData = ref<any>(null);
const workloadInterviewerId = ref<number | undefined>(undefined);

const allocationLogDialogVisible = ref(false);
const allocationLogs = ref<any[]>([]);
const allocationLogLoading = ref(false);

const showBackToTop = ref(false);
const pageScrollRef = ref<HTMLElement | null>(null);

const handleScroll = () => {
  showBackToTop.value = window.scrollY > 500;
};
const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const detailVisible = ref(false);
const detailData = ref<InterviewItem>({} as InterviewItem);
const operationLogs = ref<any[]>([]);

const timeConflictDialogVisible = ref(false);
const conflictInfos = ref<any[]>([]);

const formatDateTime = (val: string | Date | undefined) => {
  if (!val) return '-';
  return dayjs(val).format(DATETIME_FORMAT);
};
const formatTime = (val: string | Date | undefined) => {
  if (!val) return '-';
  return dayjs(val).format('HH:mm');
};

const getTabCount = (status: InterviewSessionStatus): number => {
  return tableData.value.filter((item) => item.sessionStatus === status).length;
};

const rowClassName = ({ row }: { row: InterviewItem }) => {
  if (row.sessionStatus === InterviewSessionStatus.CANCELLED) return 'row-cancelled';
  if (row.sessionStatus === InterviewSessionStatus.COMPLETED) return 'row-completed';
  return '';
};

const triggerShake = (field: FormItemProp | string) => {
  shakeField.value = field as string;
  setTimeout(() => {
    shakeField.value = '';
  }, 800);
};

const fetchStats = async () => {
  try {
    stats.value = await getInterviewStatsApi();
  } catch (e) {
    console.error(e);
  }
};

const fetchList = async () => {
  loading.value = true;
  try {
    const params: any = {
      page: page.value,
      pageSize: pageSize.value,
      ...searchForm,
    };
    if (activeTab.value) params.sessionStatus = activeTab.value;
    Object.keys(params).forEach((k) => {
      if (!params[k] && params[k] !== 0) delete params[k];
    });
    const res = await getInterviewListApi(params);
    tableData.value = res.list;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
};

const handleTabChange = () => {
  page.value = 1;
  fetchList();
};

const handleSearch = () => {
  page.value = 1;
  fetchList();
};

const handleReset = () => {
  page.value = 1;
  activeTab.value = '';
  fetchList();
};

const handlePageChange = (p: number, ps: number) => {
  page.value = p;
  pageSize.value = ps;
  fetchList();
};

const handleSelectionChange = (selection: any[]) => {
  selectedRows.value = selection;
  selectedIds.value = selection.map((item) => item.id);
};

const handleAdd = () => {
  isEdit.value = false;
  Object.assign(appointForm, {
    resumeId: undefined,
    jobId: undefined,
    stage: InterviewStage.FIRST,
    interviewer: '',
    interviewTime: undefined,
    endTime: undefined,
    location: '',
    type: 'onsite',
    remark: '',
  });
  appointDialogVisible.value = true;
};

const handleEdit = (row: InterviewItem) => {
  isEdit.value = true;
  Object.assign(appointForm, {
    id: row.id,
    resumeId: row.resumeId,
    jobId: row.jobId,
    stage: row.stage,
    interviewer: row.interviewer,
    interviewTime: row.interviewTime,
    endTime: row.endTime,
    location: row.location,
    type: row.type,
    remark: row.remark,
  });
  appointDialogVisible.value = true;
};

const handleFormClose = () => {
  appointFormRef.value?.resetFields();
};

const checkTimeConflict = async () => {
  if (!appointForm.interviewer || !appointForm.interviewTime || !appointForm.endTime) return;
  try {
    const res = await validateTimeConflictApi({
      interviewer: appointForm.interviewer,
      interviewTime: appointForm.interviewTime as string,
      endTime: appointForm.endTime as string,
      excludeId: isEdit.value ? appointForm.id : undefined,
    });
    if (res.conflict) {
      conflictInfos.value = res.conflicts;
      triggerShake('interviewer');
      triggerShake('interviewTime');
      triggerShake('endTime');
      timeConflictDialogVisible.value = true;
    }
  } catch (e) {
    console.error(e);
  }
};

const handleAppointSubmit = async () => {
  if (!appointFormRef.value) return;
  try {
    await appointFormRef.value.validate();
  } catch (e: any) {
    if (e?.fields) {
      Object.keys(e.fields).forEach((k) => triggerShake(k));
    }
    return;
  }
  const start = new Date(appointForm.interviewTime as string);
  const end = new Date(appointForm.endTime as string);
  if (start >= end) {
    ElMessage.error('结束时间必须晚于开始时间');
    triggerShake('endTime');
    return;
  }
  submitLoading.value = true;
  try {
    if (isEdit.value) {
      await updateInterviewApi(appointForm.id!, appointForm);
      ElMessage.success('修改成功');
    } else {
      await createInterviewApi(appointForm);
      ElMessage.success('创建成功，已进入待预约状态');
    }
    appointDialogVisible.value = false;
    fetchList();
    fetchStats();
  } catch (err: any) {
    const msg = err?.message || '操作失败';
    ElMessage.error(msg);
    if (err?.code === 'INTERVIEWER_TIME_CONFLICT' || err?.details?.length) {
      conflictInfos.value = err?.details || [];
      timeConflictDialogVisible.value = true;
    }
  } finally {
    submitLoading.value = false;
  }
};

const handleConfirmAppoint = (row: InterviewItem) => {
  ElMessageBox.confirm('确认将该场次标记为预约成功？锁定后不可随意修改', '确认预约', {
    type: 'warning', confirmButtonText: '确认', cancelButtonText: '取消',
  }).then(async () => {
    try {
      await confirmAppointmentApi(row.id);
      ElMessage.success('预约成功，已通知候选人与面试官');
      fetchList();
      fetchStats();
    } catch (err: any) {
      ElMessage.error(err?.message || '操作失败');
    }
  }).catch(() => {});
};

const handleInterviewerConfirm = (row: InterviewItem) => {
  ElMessageBox.confirm('面试官确认参加该场次面试吗？', '面试官确认', {
    type: 'info', confirmButtonText: '确认', cancelButtonText: '取消',
  }).then(async () => {
    try {
      await confirmByInterviewerApi(row.id);
      ElMessage.success('已确认');
      fetchList();
    } catch (err: any) {
      ElMessage.error(err?.message || '操作失败');
    }
  }).catch(() => {});
};

const initScoreDimensions = () => {
  Object.values(InterviewScoreDimension).forEach((dim) => {
    if (!(dim in scoreDimensionForm)) {
      scoreDimensionForm[dim] = 75;
    }
    scoreDimensionErrors[dim] = false;
  });
};

const calcAverageFromDimensions = (): number => {
  const dims = Object.values(InterviewScoreDimension);
  if (dims.length === 0) return 0;
  const sum = dims.reduce((acc, d) => acc + (Number(scoreDimensionForm[d]) || 0), 0);
  return Number((sum / dims.length).toFixed(1));
};

const matchRuleByScore = (score: number) => {
  return SCORE_RESULT_MATCH_RULES.find((r) => score >= r.minScore && score <= r.maxScore) || SCORE_RESULT_MATCH_RULES[0];
};

const validateCompleteForm = async () => {
  completeErrorFields.clear();
  completeValidateResult.errors = [];
  completeValidateResult.warnings = [];

  if (completeForm.result !== InterviewResult.PENDING_DECISION && (completeForm.score === undefined || completeForm.score === null)) {
    completeValidateResult.errors.push('请填写面试评分');
    completeErrorFields.add('score');
  } else if (completeForm.score !== undefined) {
    const s = Number(completeForm.score);
    if (isNaN(s) || s < 0 || s > 100) {
      completeValidateResult.errors.push('面试评分必须在0-100分之间');
      completeErrorFields.add('score');
    } else {
      const { allowed } = matchRuleByScore(s);
      if (!allowed.includes(completeForm.result)) {
        completeValidateResult.errors.push(`评分${s}分不允许选择结果【${InterviewResultLabel[completeForm.result]}】`);
        completeErrorFields.add('result');
        completeErrorFields.add('score');
      }
    }
  }

  if (completeForm.result === InterviewResult.PASS && Number(completeForm.score) < INTERVIEW_SCORE_RANGE.PASS_THRESHOLD) {
    completeValidateResult.errors.push(`评分低于${INTERVIEW_SCORE_RANGE.PASS_THRESHOLD}分，无法判定为【通过】`);
    completeErrorFields.add('result');
    completeErrorFields.add('score');
  }

  if (!completeForm.evaluation || completeForm.evaluation.trim().length < INTERVIEW_RECORD_VALIDATION_RULES.MIN_EVALUATION_LENGTH) {
    completeValidateResult.errors.push(`综合评价不少于${INTERVIEW_RECORD_VALIDATION_RULES.MIN_EVALUATION_LENGTH}字`);
    completeErrorFields.add('evaluation');
  }

  if (!completeForm.feedback || completeForm.feedback.trim().length < INTERVIEW_RECORD_VALIDATION_RULES.MIN_FEEDBACK_LENGTH) {
    completeValidateResult.warnings.push(`建议填写面试反馈（不少于${INTERVIEW_RECORD_VALIDATION_RULES.MIN_FEEDBACK_LENGTH}字）`);
  }

  if (completeTarget.value && (completeForm.score !== undefined || completeForm.result)) {
    try {
      const res = await validateInterviewRecordApi(completeTarget.value.id, { ...completeForm });
      completeValidateResult.valid = res.valid;
      if (res.errors?.length) completeValidateResult.errors.push(...res.errors);
      if (res.warnings?.length) completeValidateResult.warnings.push(...res.warnings);
      completeValidateResult.allowedResults = res.allowedResults;
      completeValidateResult.abnormal = res.abnormal;
      completeValidateResult.conflicts = res.conflicts || [];
    } catch {}
  }

  completeValidateResult.valid = completeValidateResult.errors.length === 0;
  return completeValidateResult.valid;
};

const handleComplete = (row: InterviewItem) => {
  completeTarget.value = row;
  completeSubmitLocked.value = false;
  completeErrorFields.clear();
  completeValidateResult.errors = [];
  completeValidateResult.warnings = [];
  completeValidateResult.abnormal = undefined;
  completeValidateResult.conflicts = [];
  initScoreDimensions();

  const existingDetail = row.scoreDetail;
  if (existingDetail) {
    try {
      const parsed = typeof existingDetail === 'string' ? JSON.parse(existingDetail) : existingDetail;
      Object.keys(parsed).forEach((k) => {
        if (k in scoreDimensionForm) {
          scoreDimensionForm[k] = Number(parsed[k]) || 75;
        }
      });
    } catch {}
  }

  Object.assign(completeForm, {
    result: row.result && row.result !== InterviewResult.PENDING ? row.result : InterviewResult.PENDING,
    score: row.score !== undefined ? row.score : (row.result === InterviewResult.PENDING ? undefined : calcAverageFromDimensions()),
    evaluation: row.evaluation || '',
    feedback: row.feedback || '',
    nextStage: row.nextStage || '',
    nextTime: row.nextTime,
    scoreDetail: row.scoreDetail,
  });

  if (completeForm.score === undefined) {
    completeForm.score = calcAverageFromDimensions();
  }

  completeDialogVisible.value = true;
  nextTick(() => {
    if (completeForm.score !== undefined) {
      const { defaultResult, allowed } = matchRuleByScore(Number(completeForm.score));
      completeValidateResult.allowedResults = allowed;
      if (completeForm.result === InterviewResult.PENDING) {
        completeForm.result = defaultResult;
      }
    }
  });
};

const handleScoreChange = () => {
  if (completeForm.score === undefined) return;
  const s = Number(completeForm.score);
  const { defaultResult, allowed } = matchRuleByScore(s);
  completeValidateResult.allowedResults = allowed;
  if (!allowed.includes(completeForm.result) || completeForm.result === InterviewResult.PENDING) {
    completeForm.result = defaultResult;
  }
  validateCompleteForm();
};

const handleDimensionChange = () => {
  const avg = calcAverageFromDimensions();
  completeForm.score = avg;
  handleScoreChange();
};

const handleCompleteSubmit = async () => {
  if (completeSubmitLocked.value) return;

  if (!completeFormRef.value) return;
  try {
    await completeFormRef.value.validate();
  } catch {
    return;
  }

  const valid = await validateCompleteForm();
  if (!valid) {
    if (completeErrorFields.has('score')) triggerShake('score');
    if (completeErrorFields.has('evaluation')) triggerShake('evaluation');
    if (completeErrorFields.has('result')) triggerShake('result');
    ElMessageBox.alert(
      completeValidateResult.errors.map((e, i) => `${i + 1}. ${e}`).join('\n'),
      '填写内容不合规',
      { confirmButtonText: '好的', type: 'error' }
    );
    return;
  }

  if (completeValidateResult.conflicts && completeValidateResult.conflicts.length > 0) {
    const hasFail = completeValidateResult.conflicts.some((c: any) => c.result === InterviewResult.FAIL);
    if (hasFail && completeForm.result === InterviewResult.PASS) {
      try {
        await ElMessageBox.confirm(
          `该候选人已存在淘汰记录，确定要判定为【通过】吗？\n冲突记录：${completeValidateResult.conflicts.map((c: any) => c.jobTitle).join('、')}`,
          '候选人结果冲突',
          { confirmButtonText: '继续通过', cancelButtonText: '取消', type: 'warning' }
        );
      } catch { return; }
    }
  }

  if (completeValidateResult.abnormal && completeValidateResult.abnormal.type !== InterviewAbnormalScoreType.NONE) {
    try {
      await ElMessageBox.confirm(
        `检测到异常评分：${completeValidateResult.abnormal.reason}\n是否继续提交？`,
        '异常评分提醒',
        { confirmButtonText: '确认提交', cancelButtonText: '修改评分', type: 'warning' }
      );
    } catch { return; }
  }

  completeSubmitLocked.value = true;
  completeLoading.value = true;

  const dimKeys = Object.values(InterviewScoreDimension);
  const scoreDetailObj: Record<string, number> = {};
  dimKeys.forEach((k) => { scoreDetailObj[k] = Number(scoreDimensionForm[k]) || 0; });

  setTimeout(async () => {
    try {
      await completeInterviewApi(completeTarget.value!.id, {
        ...completeForm,
        scoreDetail: JSON.stringify(scoreDetailObj),
      });
      ElMessage.success('面试记录已提交');
      completeDialogVisible.value = false;
      fetchList();
      fetchStats();
    } catch (err: any) {
      const msg = err?.message || '操作失败';
      ElMessage.error(msg);
    } finally {
      completeLoading.value = false;
      completeSubmitLocked.value = false;
    }
  }, INTERVIEW_RECORD_VALIDATION_RULES.ANTI_DUPLICATE_SUBMIT_MS);
};

const handleCancel = (row: InterviewItem) => {
  cancelTarget.value = row;
  Object.assign(cancelForm, {
    reasonType: InterviewCancelReasonType.OTHER,
    reasonDetail: '',
    cancelledByCandidate: false,
  });
  cancelDialogVisible.value = true;
};

const handleCancelSubmit = async () => {
  if (!cancelFormRef.value) return;
  try {
    await cancelFormRef.value.validate();
  } catch {
    return;
  }
  cancelLoading.value = true;
  try {
    await cancelInterviewApi(cancelTarget.value!.id, { ...cancelForm });
    ElMessage.success('已取消面试，相关人员已通知');
    cancelDialogVisible.value = false;
    fetchList();
    fetchStats();
  } catch (err: any) {
    ElMessage.error(err?.message || '操作失败');
  } finally {
    cancelLoading.value = false;
  }
};

const handleDelete = (row: InterviewItem) => {
  ElMessageBox.confirm('确定要删除该面试记录吗？', '提示', {
    confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning',
  }).then(async () => {
    await deleteInterviewApi(row.id);
    ElMessage.success('删除成功');
    fetchList();
    fetchStats();
  }).catch(() => {});
};

const handleBatchDelete = () => {
  ElMessageBox.confirm(`确定要删除选中的 ${selectedIds.value.length} 条记录吗？`, '提示', {
    confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning',
  }).then(async () => {
    await batchDeleteInterviewApi(selectedIds.value);
    ElMessage.success('批量删除完成');
    fetchList();
    fetchStats();
  }).catch(() => {});
};

const handleView = async (row: InterviewItem) => {
  try {
    const [detail, logs] = await Promise.all([
      getInterviewDetailApi(row.id),
      getInterviewOperationLogsApi(row.id),
    ]);
    detailData.value = detail;
    operationLogs.value = logs;
    detailVisible.value = true;
  } catch (err: any) {
    ElMessage.error(err?.message || '加载失败');
  }
};

const handleBatchAppointOpen = () => {
  Object.assign(batchAppointForm, {
    resumeIds: [],
    jobId: undefined,
    stage: InterviewStage.FIRST,
    interviewer: '',
    interviewTime: undefined,
    endTime: undefined,
    type: 'onsite',
    location: '',
  });
  batchAppointDialogVisible.value = true;
};

const handleBatchAppointSubmit = async () => {
  if (!batchAppointFormRef.value) return;
  try {
    await batchAppointFormRef.value.validate();
  } catch {
    return;
  }
  batchAppointLoading.value = true;
  globalProgress.value = 5;
  try {
    const items: BatchAppointItem[] = batchAppointForm.resumeIds.map((rid) => ({
      resumeId: rid,
      jobId: batchAppointForm.jobId!,
      stage: batchAppointForm.stage,
      interviewer: batchAppointForm.interviewer,
      interviewTime: batchAppointForm.interviewTime!,
      endTime: batchAppointForm.endTime!,
      location: batchAppointForm.location,
      type: batchAppointForm.type,
    }));
    globalProgress.value = 30;
    await nextTick();
    const result = await batchAppointApi(items);
    globalProgress.value = 100;
    batchAppointDialogVisible.value = false;
    if (result.failedCount > 0) {
      const failMsgs = result.results
        .filter((r: any) => !r.success)
        .map((r: any) => `简历ID ${r.item?.resumeId}: ${r.error}`)
        .join('\n');
      ElMessageBox.alert(
        `${result.message}\n\n失败详情：\n${failMsgs}`,
        '批量预约完成',
        { type: result.successCount === 0 ? 'error' : 'warning', dangerouslyUseHTMLString: false }
      );
    } else {
      ElMessage.success(result.message);
    }
    fetchList();
    fetchStats();
  } catch (err: any) {
    ElMessage.error(err?.message || '批量预约失败');
  } finally {
    batchAppointLoading.value = false;
    setTimeout(() => { globalProgress.value = 0; }, 1000);
  }
};

const handleBatchCancelOverdue = async () => {
  ElMessageBox.confirm('将自动扫描并取消所有逾期超过1小时仍未进行的待面试场次，确定执行吗？', '批量取消逾期', {
    type: 'warning', confirmButtonText: '执行', cancelButtonText: '取消',
  }).then(async () => {
    batchCancelLoading.value = true;
    globalProgress.value = 20;
    try {
      await nextTick();
      const result = await batchCancelOverdueApi();
      globalProgress.value = 100;
      ElMessage.success(result.message);
      fetchList();
      fetchStats();
    } catch (err: any) {
      ElMessage.error(err?.message || '操作失败');
    } finally {
      batchCancelLoading.value = false;
      setTimeout(() => { globalProgress.value = 0; }, 1000);
    }
  }).catch(() => {});
};

const handleBatchSortOpen = () => {
  batchSortForm.sortType = InterviewBatchSortType.MATCH_AND_URGENCY;
  batchSortDialogVisible.value = true;
};

const handleBatchSortSubmit = async () => {
  batchSortLoading.value = true;
  globalProgress.value = 30;
  try {
    await nextTick();
    const result = await batchSortApi(selectedIds.value, batchSortForm.sortType);
    globalProgress.value = 100;
    batchSortDialogVisible.value = false;
    ElMessage.success(result.message);
    fetchList();
  } catch (err: any) {
    ElMessage.error(err?.message || '操作失败');
  } finally {
    batchSortLoading.value = false;
    setTimeout(() => { globalProgress.value = 0; }, 1000);
  }
};

const getAbnormalScoreColor = (row: InterviewItem): string => {
  if (!row.abnormalScoreType || row.abnormalScoreType === InterviewAbnormalScoreType.NONE) {
    return 'var(--el-text-color-primary)';
  }
  return InterviewAbnormalScoreColor[row.abnormalScoreType as InterviewAbnormalScoreType] || 'var(--el-text-color-primary)';
};

const handleBatchSupplementOpen = async () => {
  batchSupplementForm.days = INTERVIEW_RECORD_VALIDATION_RULES.SUPPLEMENT_DAYS_LIMIT;
  batchSupplementForm.defaultScore = 75;
  batchSupplementForm.defaultResult = InterviewResult.FAIL;
  batchSupplementForm.defaultEvaluation = '逾期未面试，批量补录';
  batchSupplementForm.jobId = undefined;
  batchSupplementForm.interviewer = '';
  batchSupplementForm.startTime = undefined;
  batchSupplementForm.endTime = undefined;
  batchSupplementOverdueCount.value = 0;
  batchSupplementDialogVisible.value = true;
};

const handleBatchSupplementSubmit = async () => {
  if (!batchSupplementFormRef.value) return;
  try {
    await batchSupplementFormRef.value.validate();
  } catch {
    return;
  }
  const { defaultResult, defaultScore } = batchSupplementForm;
  const { allowed } = matchRuleByScore(Number(defaultScore));
  if (!allowed.includes(defaultResult)) {
    ElMessage.warning(`分数${defaultScore}不允许选择结果【${InterviewResultLabel[defaultResult]}】`);
    return;
  }

  batchSupplementLoading.value = true;
  globalProgress.value = 20;
  try {
    const params: any = {
      days: batchSupplementForm.days,
      defaultResult,
      defaultScore: Number(defaultScore),
      defaultEvaluation: batchSupplementForm.defaultEvaluation,
    };
    if (batchSupplementForm.jobId) params.jobId = batchSupplementForm.jobId;
    if (batchSupplementForm.interviewer) params.interviewer = batchSupplementForm.interviewer;
    if (batchSupplementForm.startTime) params.startTime = batchSupplementForm.startTime;
    if (batchSupplementForm.endTime) params.endTime = batchSupplementForm.endTime;
    if (selectedIds.value.length > 0) params.ids = selectedIds.value;
    const result = await batchSupplementOverdueApi(params);
    batchSupplementOverdueCount.value = result.total || 0;
    globalProgress.value = 100;
    if (batchSupplementOverdueCount.value > 0) {
      await ElMessageBox.alert(
        `成功补录 ${result.success || 0} 条面试记录${result.failed > 0 ? `，失败 ${result.failed} 条` : ''}`,
        '批量补录完成',
        { confirmButtonText: '好的', type: 'success' }
      );
      batchSupplementDialogVisible.value = false;
      fetchList();
      fetchStats();
    } else {
      ElMessage.info('暂无可补录的逾期场次');
    }
  } catch (err: any) {
    ElMessage.error(err?.message || '操作失败');
  } finally {
    batchSupplementLoading.value = false;
    setTimeout(() => { globalProgress.value = 0; }, 1000);
  }
};

const handleBatchModifyPendingOpen = async () => {
  batchModifyPendingForm.targetResult = InterviewResult.FAIL;
  batchModifyPendingForm.targetScore = 59;
  batchModifyPendingForm.jobId = undefined;
  batchModifyPendingForm.interviewer = '';
  batchModifyPendingForm.startTime = undefined;
  batchModifyPendingForm.endTime = undefined;
  batchModifyPendingCount.value = 0;
  batchModifyPendingDialogVisible.value = true;
};

const handleBatchModifyPendingSubmit = async () => {
  if (!batchModifyPendingFormRef.value) return;
  try {
    await batchModifyPendingFormRef.value.validate();
  } catch {
    return;
  }
  const { targetResult, targetScore } = batchModifyPendingForm;
  if (targetScore !== undefined) {
    const { allowed } = matchRuleByScore(Number(targetScore));
    if (!allowed.includes(targetResult)) {
      ElMessage.warning(`分数${targetScore}不允许选择结果【${InterviewResultLabel[targetResult]}】`);
      return;
    }
  }
  batchModifyPendingLoading.value = true;
  globalProgress.value = 20;
  try {
    const params: any = { targetResult };
    if (targetScore !== undefined) params.targetScore = Number(targetScore);
    if (batchModifyPendingForm.jobId) params.jobId = batchModifyPendingForm.jobId;
    if (batchModifyPendingForm.interviewer) params.interviewer = batchModifyPendingForm.interviewer;
    if (batchModifyPendingForm.startTime) params.startTime = batchModifyPendingForm.startTime;
    if (batchModifyPendingForm.endTime) params.endTime = batchModifyPendingForm.endTime;
    if (selectedIds.value.length > 0) params.ids = selectedIds.value;
    const result = await batchUpdatePendingResultsApi(params);
    batchModifyPendingCount.value = result.total || 0;
    globalProgress.value = 100;
    if (batchModifyPendingCount.value > 0) {
      const msgs: string[] = [`成功处理 ${result.success || 0} 条记录`];
      if (result.failed > 0) msgs.push(`失败 ${result.failed} 条（结果冲突或不符合条件`);
      if (result.conflicts?.length) msgs.push(`检测到 ${result.conflicts.length} 条冲突`);
      await ElMessageBox.alert(msgs.join('\n'), '批量修改待定结果完成', { confirmButtonText: '好的', type: result.success > 0 ? 'success' : 'info' });
      batchModifyPendingDialogVisible.value = false;
      fetchList();
      fetchStats();
    } else {
      ElMessage.info('暂无可修改的待定结果场次');
    }
  } catch (err: any) {
    ElMessage.error(err?.message || '操作失败');
  } finally {
    batchModifyPendingLoading.value = false;
    setTimeout(() => { globalProgress.value = 0; }, 1000);
  }
};

const handleAllocateRow = (row: InterviewItem) => {
  allocateTarget.value = row;
  allocateForm.targetInterviewerId = undefined;
  allocateForm.crossDomainConfirmed = false;
  allocateForm.jobCategory = row.job?.category || '';
  allocateValidationResult.errors = [];
  allocateValidationResult.warnings = [];
  allocateValidationResult.crossDomain = false;
  allocateValidationResult.domainMatched = true;
  selectedInterviewerInfo.value = null;
  allocateDialogVisible.value = true;
  fetchAvailableInterviewers(allocateForm.jobCategory);
};

const handleAllocateDialogOpen = () => {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先在表格中勾选需要调配面试官的场次');
    return;
  }
  allocateTarget.value = null;
  allocateForm.targetInterviewerId = undefined;
  allocateForm.crossDomainConfirmed = false;
  allocateForm.jobCategory = '';
  allocateValidationResult.errors = [];
  allocateValidationResult.warnings = [];
  selectedInterviewerInfo.value = null;
  allocateDialogVisible.value = true;
  fetchAvailableInterviewers();
};

const fetchAvailableInterviewers = async (jobCategory?: string) => {
  try {
    const result = await getAvailableInterviewersApi({ jobCategory });
    availableInterviewers.value = result || [];
  } catch {}
};

const handleInterviewerSelect = (id: number) => {
  const interviewer = availableInterviewers.value.find((i: any) => i.id === id);
  selectedInterviewerInfo.value = interviewer || null;
  allocateValidationResult.crossDomain = interviewer?.domainMatchInfo?.crossDomain || false;
  allocateValidationResult.domainMatched = interviewer?.domainMatchInfo?.matched ?? true;
  if (interviewer?.domainMatchInfo && !interviewer.domainMatchInfo.matched) {
    allocateValidationResult.warnings = [`面试官擅长领域与岗位领域不匹配，跨领域调配需二次确认`];
  } else {
    allocateValidationResult.warnings = [];
  }
  if (interviewer && interviewer.interviewerStatus !== InterviewerStatus.IDLE && interviewer.interviewerStatus !== InterviewerStatus.INTERVIEWING) {
    allocateValidationResult.errors = [`面试官当前状态为【${InterviewerStatusLabel[interviewer.interviewerStatus as InterviewerStatus]}】，无法调配`];
  } else {
    allocateValidationResult.errors = [];
  }
};

const handleAllocateSubmit = async () => {
  if (!allocateForm.targetInterviewerId) {
    ElMessage.warning('请选择目标面试官');
    return;
  }
  if (allocateValidationResult.errors.length > 0) {
    ElMessage.error(allocateValidationResult.errors.join('；'));
    return;
  }
  if (allocateValidationResult.crossDomain && !allocateForm.crossDomainConfirmed) {
    try {
      await ElMessageBox.confirm(
        '面试官擅长领域与岗位领域不匹配，确认进行跨领域调配？',
        '跨领域调配确认',
        { confirmButtonText: '确认调配', cancelButtonText: '取消', type: 'warning' }
      );
      allocateForm.crossDomainConfirmed = true;
    } catch { return; }
  }
  allocateLoading.value = true;
  try {
    if (allocateTarget.value) {
      const result = await allocateInterviewerApi(allocateTarget.value.id, {
        targetInterviewerId: allocateForm.targetInterviewerId,
        crossDomainConfirmed: allocateForm.crossDomainConfirmed,
      });
      ElMessage.success(result.message || '面试官调配成功');
    } else {
      const result = await batchReplaceInterviewerApi({
        ids: selectedIds.value,
        targetInterviewerId: allocateForm.targetInterviewerId,
        crossDomainConfirmed: allocateForm.crossDomainConfirmed,
      });
      await ElMessageBox.alert(
        `批量替换完成：成功${result.success}条，失败${result.failed}条`,
        '批量替换面试官',
        { confirmButtonText: '好的', type: result.success > 0 ? 'success' : 'info' }
      );
    }
    allocateDialogVisible.value = false;
    fetchList();
    fetchStats();
  } catch (err: any) {
    const code = err?.code;
    if (code === 'CROSS_DOMAIN_CONFIRM_REQUIRED') {
      try {
        await ElMessageBox.confirm(
          err.message || '跨领域调配需二次确认',
          '跨领域调配确认',
          { confirmButtonText: '确认调配', cancelButtonText: '取消', type: 'warning' }
        );
        allocateForm.crossDomainConfirmed = true;
        allocateLoading.value = false;
        handleAllocateSubmit();
        return;
      } catch { allocateLoading.value = false; return; }
    }
    ElMessage.error(err?.message || '调配失败');
  } finally {
    allocateLoading.value = false;
  }
};

const handleBatchScheduleOpen = () => {
  batchScheduleForm.optimizeBy = 'workload';
  batchScheduleForm.jobId = undefined;
  batchScheduleForm.interviewerId = undefined;
  scheduleSuggestions.value = [];
  batchScheduleDialogVisible.value = true;
};

const handleBatchScheduleSubmit = async () => {
  batchScheduleLoading.value = true;
  try {
    const params: any = { optimizeBy: batchScheduleForm.optimizeBy };
    if (batchScheduleForm.jobId) params.jobId = batchScheduleForm.jobId;
    if (batchScheduleForm.interviewerId) params.interviewerId = batchScheduleForm.interviewerId;
    if (selectedIds.value.length > 0) params.ids = selectedIds.value;
    const result = await batchScheduleOptimizeApi(params);
    scheduleSuggestions.value = result.suggestions || [];
    if (scheduleSuggestions.value.length === 0) {
      ElMessage.info(result.message || '暂无优化建议');
    }
  } catch (err: any) {
    ElMessage.error(err?.message || '排班优化失败');
  } finally {
    batchScheduleLoading.value = false;
  }
};

const handleApplySuggestion = async (suggestion: any) => {
  try {
    await ElMessageBox.confirm(
      `确认将场次#${suggestion.interviewId}的面试官从【${suggestion.currentInterviewer}】替换为【${suggestion.suggestedInterviewer}】？\n${suggestion.reason}`,
      '确认替换',
      { confirmButtonText: '确认', cancelButtonText: '取消', type: 'info' }
    );
    await allocateInterviewerApi(suggestion.interviewId, {
      targetInterviewerId: suggestion.suggestedInterviewerId,
      crossDomainConfirmed: true,
    });
    ElMessage.success('替换成功');
    scheduleSuggestions.value = scheduleSuggestions.value.filter((s: any) => s.interviewId !== suggestion.interviewId);
    fetchList();
  } catch (err: any) {
    if (err !== 'cancel') ElMessage.error(err?.message || '替换失败');
  }
};

const handleWorkloadDialogOpen = () => {
  workloadDialogVisible.value = true;
  workloadData.value = null;
  workloadInterviewerId.value = undefined;
};

const handleWorkloadSearch = async () => {
  if (!workloadInterviewerId.value) {
    ElMessage.warning('请输入面试官ID');
    return;
  }
  workloadLoading.value = true;
  try {
    workloadData.value = await getInterviewerWorkloadApi(workloadInterviewerId.value);
  } catch (err: any) {
    ElMessage.error(err?.message || '获取工作量统计失败');
  } finally {
    workloadLoading.value = false;
  }
};

const handleViewAllocationLogs = async (interviewId: number) => {
  allocationLogDialogVisible.value = true;
  allocationLogLoading.value = true;
  try {
    allocationLogs.value = await getAllocationLogsApi({ interviewId });
  } catch {
    allocationLogs.value = [];
  } finally {
    allocationLogLoading.value = false;
  }
};

const checkWarningLoading = ref(false);
const warningListDialogVisible = ref(false);
const warningListLoading = ref(false);
const warningListData = ref<any[]>([]);
const warningListFilter = reactive({ warningStatus: '', warningLevel: '', sortBy: 'interviewTime' });
const warningStats = ref<any>({});
const warningSelectedIds = ref<number[]>([]);
const handleOverdueDialogVisible = ref(false);
const handleOverdueLoading = ref(false);
const overdueTarget = ref<any>(null);
const handleOverdueFormRef = ref<FormInstance>();
const handleOverdueForm = reactive({ overdueReasonType: '', overdueReason: '', remedyPlan: '' });
const handleOverdueFormRules: FormRules = {
  overdueReasonType: [{ required: true, message: '请选择逾期原因类型', trigger: 'change' }],
  overdueReason: [{ required: true, message: '请填写逾期原因说明', trigger: 'blur' }],
  remedyPlan: [{ required: true, message: '请填写补救方案', trigger: 'blur' }],
};
const batchHandleOverdueDialogVisible = ref(false);
const batchHandleOverdueLoading = ref(false);
const batchHandleOverdueForm = reactive({ overdueReasonType: '', overdueReason: '', remedyPlan: '' });
const batchPostponeDialogVisible = ref(false);
const batchPostponeLoading = ref(false);
const batchPostponeHours = ref(2);
const warningLogDialogVisible = ref(false);
const warningLogLoading = ref(false);
const warningLogs = ref<any[]>([]);

const formatCountdown = (ms: number): string => {
  if (ms <= 0) return '已逾期';
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  if (hours > 24) return `${Math.floor(hours / 24)}天${hours % 24}时`;
  if (hours > 0) return `${hours}时${minutes}分`;
  return `${minutes}分`;
};

const warningRowClassName = ({ row }: { row: any }): string => {
  if (row.warningStatus === WarningStatus.OVERDUE) return 'warning-row-overdue';
  if (row.warningLevel === WarningLevel.APPROACHING_1H) return 'warning-row-critical';
  if (row.warningStatus === WarningStatus.APPROACHING) return 'warning-row-approaching';
  if (row.warningStatus === WarningStatus.HANDLED) return 'warning-row-handled';
  return '';
};

const warningLogRowClassName = ({ rowIndex }: { rowIndex: number }): string => {
  return rowIndex % 2 === 0 ? 'stripe-even' : 'stripe-odd';
};

const handleWarningSelectionChange = (rows: any[]) => {
  warningSelectedIds.value = rows.map((r: any) => r.id);
};

const handleCheckWarnings = async () => {
  checkWarningLoading.value = true;
  try {
    const result = await checkWarningsApi();
    ElMessage.success(result.message || `预警检查完成：触发${result.triggered}条`);
    fetchList();
  } catch (err: any) {
    ElMessage.error(err?.message || '预警检查失败');
  } finally {
    checkWarningLoading.value = false;
  }
};

const handleWarningListOpen = async () => {
  warningListDialogVisible.value = true;
  await fetchWarningList();
  await fetchWarningStats();
};

const fetchWarningList = async () => {
  warningListLoading.value = true;
  try {
    const params: any = {};
    if (warningListFilter.warningStatus) params.warningStatus = warningListFilter.warningStatus;
    if (warningListFilter.warningLevel) params.warningLevel = warningListFilter.warningLevel;
    if (warningListFilter.sortBy) params.sortBy = warningListFilter.sortBy;
    const result = await getWarningListApi(params);
    warningListData.value = result.rows || [];
  } catch {
    warningListData.value = [];
  } finally {
    warningListLoading.value = false;
  }
};

const fetchWarningStats = async () => {
  try {
    warningStats.value = await getWarningStatsApi();
  } catch {}
};

const handleOverdueRow = (row: any) => {
  overdueTarget.value = row;
  handleOverdueForm.overdueReasonType = '';
  handleOverdueForm.overdueReason = '';
  handleOverdueForm.remedyPlan = '';
  handleOverdueDialogVisible.value = true;
};

const handleOverdueSubmit = async () => {
  if (handleOverdueFormRef.value) {
    const valid = await handleOverdueFormRef.value.validate().catch(() => false);
    if (!valid) return;
  }
  handleOverdueLoading.value = true;
  try {
    const result = await handleOverdueInterviewApi(overdueTarget.value.id, {
      overdueReasonType: handleOverdueForm.overdueReasonType,
      overdueReason: handleOverdueForm.overdueReason,
      remedyPlan: handleOverdueForm.remedyPlan,
    });
    ElMessage.success(result.message || '逾期面试处理成功');
    handleOverdueDialogVisible.value = false;
    fetchWarningList();
    fetchList();
  } catch (err: any) {
    ElMessage.error(err?.message || '处理失败');
  } finally {
    handleOverdueLoading.value = false;
  }
};

const handleBatchHandleOverdueOpen = () => {
  if (warningSelectedIds.value.length === 0) {
    ElMessage.warning('请先勾选需要处理的逾期场次');
    return;
  }
  batchHandleOverdueForm.overdueReasonType = '';
  batchHandleOverdueForm.overdueReason = '';
  batchHandleOverdueForm.remedyPlan = '';
  batchHandleOverdueDialogVisible.value = true;
};

const handleBatchHandleOverdueSubmit = async () => {
  if (!batchHandleOverdueForm.overdueReasonType || !batchHandleOverdueForm.overdueReason || !batchHandleOverdueForm.remedyPlan) {
    ElMessage.warning('逾期原因类型、原因说明和补救方案为必填项');
    return;
  }
  batchHandleOverdueLoading.value = true;
  try {
    const result = await batchHandleOverdueApi({
      ids: warningSelectedIds.value,
      ...batchHandleOverdueForm,
    });
    ElMessage.success(result.message || '批量处理完成');
    batchHandleOverdueDialogVisible.value = false;
    fetchWarningList();
    fetchList();
  } catch (err: any) {
    ElMessage.error(err?.message || '批量处理失败');
  } finally {
    batchHandleOverdueLoading.value = false;
  }
};

const handleBatchPostponeOpen = () => {
  if (warningSelectedIds.value.length === 0) {
    ElMessage.warning('请先勾选需要延后的场次');
    return;
  }
  batchPostponeHours.value = 2;
  batchPostponeDialogVisible.value = true;
};

const handleBatchPostponeSubmit = async () => {
  batchPostponeLoading.value = true;
  try {
    const result = await batchPostponeInterviewsApi({
      ids: warningSelectedIds.value,
      postponeHours: batchPostponeHours.value,
    });
    await ElMessageBox.alert(result.message, '批量延后结果', { type: 'info' });
    batchPostponeDialogVisible.value = false;
    fetchWarningList();
    fetchList();
  } catch (err: any) {
    if (err !== 'cancel') ElMessage.error(err?.message || '批量延后失败');
  } finally {
    batchPostponeLoading.value = false;
  }
};

const handleDismissWarning = async (row: any) => {
  try {
    await ElMessageBox.confirm('确认解除该场次的预警状态？', '解除预警', { type: 'warning' });
    const result = await dismissWarningApi(row.id);
    ElMessage.success(result.message || '预警已解除');
    fetchWarningList();
    fetchList();
  } catch (err: any) {
    if (err !== 'cancel') ElMessage.error(err?.message || '解除失败');
  }
};

const handleMarkFalseAlarm = async (row: any) => {
  try {
    const { value } = await ElMessageBox.prompt('请填写误预警原因', '标记误预警', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      inputPattern: /.+/,
      inputErrorMessage: '误预警原因不能为空',
    });
    const result = await markFalseAlarmApi(row.id, { falseAlarmReason: value });
    ElMessage.success(result.message || '已标记为误预警');
    fetchWarningList();
    fetchList();
  } catch (err: any) {
    if (err !== 'cancel') ElMessage.error(err?.message || '标记失败');
  }
};

const handleViewWarningLogs = async (row: any) => {
  warningLogDialogVisible.value = true;
  warningLogLoading.value = true;
  try {
    warningLogs.value = await getWarningLogsApi({ interviewId: row.id });
  } catch {
    warningLogs.value = [];
  } finally {
    warningLogLoading.value = false;
  }
};

onMounted(() => {
  window.addEventListener('scroll', handleScroll);
});

watch(
  [() => appointForm.interviewer, () => appointForm.interviewTime, () => appointForm.endTime],
  () => {
    if (appointForm.interviewer && appointForm.interviewTime && appointForm.endTime) {
      checkTimeConflict();
    }
  }
);

onMounted(() => {
  fetchList();
  fetchStats();
});
</script>

<style lang="scss" scoped>
.interview-page {
  .stats-row {
    margin-bottom: 16px;
    .stat-card {
      text-align: center;
      .stat-label {
        font-size: 13px;
        color: #909399;
        margin-bottom: 8px;
      }
      .stat-value {
        font-size: 26px;
        font-weight: 600;
        color: #303133;
      }
      :deep(.el-card__body) {
        padding: 16px;
      }
      &.success .stat-value { color: #409eff; }
      &.warning .stat-value { color: #e6a23c; }
      &.rate .stat-value { color: #67c23a; }
    }
  }

  .status-tabs {
    margin-bottom: 4px;
    .tab-count {
      margin-left: 6px;
    }
  }

  .toolbar-left {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .toolbar-right {
    display: flex;
    align-items: center;
  }

  .sub-info {
    font-size: 12px;
    color: #909399;
  }

  .remark-text {
    color: #409eff;
    cursor: pointer;
  }

  .form-tip {
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
  }

  .shake-error {
    :deep(.el-input__wrapper) {
      animation: shake 0.5s ease-in-out;
      box-shadow: 0 0 0 1px #f56c6c inset !important;
      border-color: #f56c6c !important;
    }
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
    20%, 40%, 60%, 80% { transform: translateX(4px); }
  }

  .conflict-list {
    padding-left: 20px;
    margin: 8px 0 0;
    li {
      line-height: 1.8;
      font-size: 13px;
    }
  }

  :deep(.row-cancelled) {
    background-color: #fef0f0 !important;
    td { color: #909399; text-decoration: line-through; }
  }
  :deep(.row-completed) {
    background-color: #f0f9eb !important;
  }

  .score-value {
    font-size: 15px;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .score-empty {
    color: #909399;
    font-size: 13px;
  }

  .field-error {
    :deep(.el-input__wrapper),
    :deep(.el-textarea__inner),
    :deep(.el-input-number .el-input__wrapper) {
      box-shadow: 0 0 0 1px #f56c6c inset !important;
      border-color: #f56c6c !important;
      transition: box-shadow 0.2s ease, border-color 0.2s ease;
    }
    :deep(.el-form-item__label) {
      color: #f56c6c !important;
    }
  }

  .field-focused {
    z-index: 5;
    position: relative;
  }

  .scale-focus {
    :deep(.el-input__wrapper),
    :deep(.el-textarea__inner),
    :deep(.el-input-number),
    :deep(.el-radio-group) {
      transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
      transform-origin: center;
      transform: scale(1.02);
    }
    :deep(.el-input-number) {
      width: calc(100% + 10px);
      margin-left: -5px;
    }
    :deep(.el-input__wrapper) {
      box-shadow: 0 4px 16px rgba(64, 158, 255, 0.18) !important;
      border-color: #409eff !important;
    }
    :deep(.el-textarea__inner) {
      box-shadow: 0 4px 16px rgba(64, 158, 255, 0.18) !important;
      border-color: #409eff !important;
    }
  }

  .score-rule-tip {
    margin-top: 6px;
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
    color: #909399;
    .tag-pass { color: #67c23a; font-weight: 600; }
    .tag-warn { color: #e6a23c; font-weight: 600; }
    .tag-fail { color: #f56c6c; font-weight: 600; }
    .allowed-result {
      color: #409eff;
      font-weight: 500;
    }
  }
}

.complete-interview-dialog {
  :deep(.el-dialog__body) {
    padding-top: 12px;
    max-height: 72vh;
    overflow-y: auto;
  }
  .form-tip {
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
  }
  .shake-error {
    :deep(.el-input__wrapper),
    :deep(.el-textarea__inner),
    :deep(.el-input-number .el-input__wrapper) {
      animation: shake 0.5s ease-in-out;
      box-shadow: 0 0 0 1px #f56c6c inset !important;
      border-color: #f56c6c !important;
    }
  }
}

:deep(.remark-tooltip) {
  max-width: 400px;
  word-break: break-all;
}

.fade-dialog {
  :deep(.el-dialog) {
    transition: opacity 0.3s ease, transform 0.3s ease;
  }
  :deep(.el-overlay) {
    transition: opacity 0.3s ease;
  }
  :deep(.v-enter-from) {
    opacity: 0;
    transform: translateY(20px);
  }
  :deep(.v-leave-to) {
    opacity: 0;
    transform: translateY(20px);
  }
}

.zoom-fade-dialog {
  :deep(.el-dialog) {
    transition: opacity 0.35s ease, transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  :deep(.v-enter-from) {
    opacity: 0;
    transform: scale(0.85);
  }
  :deep(.v-leave-to) {
    opacity: 0;
    transform: scale(0.85);
  }
}

:deep(.warning-row-overdue) {
  background-color: #fef0f0 !important;
}
:deep(.warning-row-critical) {
  background-color: #fdf6ec !important;
}
:deep(.warning-row-approaching) {
  background-color: #fefcf0 !important;
}
:deep(.warning-row-handled) {
  background-color: #f4f4f5 !important;
}

:deep(.stripe-even) {
  background-color: #fafafa;
}
:deep(.stripe-odd) {
  background-color: #ffffff;
}

.el-backtop {
  :deep(.el-backtop__inner) {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--el-bg-color-overlay);
    box-shadow: var(--el-box-shadow-lighter);
    transition: background-color 0.3s;
    &:hover {
      background-color: var(--el-color-primary-light-9);
    }
  }
}
</style>
