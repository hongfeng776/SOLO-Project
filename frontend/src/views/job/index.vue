<template>
  <div class="job-page">
    <SearchForm @search="handleSearch" @reset="handleReset">
      <el-form-item label="岗位名称" prop="title">
        <el-input v-model="searchForm.title" placeholder="请输入岗位名称" clearable style="width: 200px" />
      </el-form-item>
      <el-form-item label="岗位类别" prop="category">
        <el-select v-model="searchForm.category" placeholder="全部" clearable style="width: 140px">
          <el-option v-for="(label, key) in JobCategoryLabel" :key="key" :label="label" :value="key" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 140px">
          <el-option v-for="(label, key) in JobStatusLabel" :key="key" :label="label" :value="key" />
        </el-select>
      </el-form-item>
      <el-form-item label="工作城市" prop="city">
        <el-input v-model="searchForm.city" placeholder="请输入城市" clearable style="width: 140px" />
      </el-form-item>
    </SearchForm>

    <div class="toolbar">
      <div class="toolbar-left">
        <el-button type="primary" :icon="Plus" class="action-btn" @click="handleAdd">新增岗位</el-button>
        <el-button type="success" :icon="DocumentAdd" class="action-btn" @click="handleBatchCreate">批量新增</el-button>
        <el-dropdown v-if="isAdmin" @command="handleBatchCommand">
          <el-button type="primary" plain class="action-btn">
            批量操作<el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="submit" :disabled="selectedIds.length === 0">
                批量提交审核
              </el-dropdown-item>
              <el-dropdown-item command="approve" :disabled="selectedIds.length === 0">
                批量审核通过
              </el-dropdown-item>
              <el-dropdown-item command="delete" :disabled="selectedIds.length === 0">
                批量删除
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button
          v-else
          type="success"
          plain
          class="action-btn"
          :disabled="selectedIds.length === 0"
          @click="handleBatchSubmit"
        >
          批量提交审核
        </el-button>
      </div>
      <div class="toolbar-right">
        <span class="stat-text">共 {{ total }} 条记录</span>
      </div>
    </div>

    <div class="table-wrapper">
      <div v-if="tableLoading" class="skeleton-wrapper">
        <div v-for="i in 5" :key="i" class="skeleton-row">
          <div class="skeleton-cell w-10"></div>
          <div class="skeleton-cell w-20"></div>
          <div class="skeleton-cell w-15"></div>
          <div class="skeleton-cell w-15"></div>
          <div class="skeleton-cell w-10"></div>
          <div class="skeleton-cell w-10"></div>
          <div class="skeleton-cell w-10"></div>
          <div class="skeleton-cell w-10"></div>
          <div class="skeleton-cell w-20"></div>
        </div>
      </div>

      <el-table
        v-show="!tableLoading"
        v-loading="loading"
        :data="tableData"
        border
        stripe
        resizable
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="title" label="岗位名称" min-width="150">
          <template #default="{ row }">
            <span class="job-title" :class="{ 'duplicate-job': duplicateJobIds.includes(row.id) }">{{ row.title }}</span>
            <el-tag v-if="duplicateJobIds.includes(row.id)" type="warning" size="small" class="ml-5">重复</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="岗位类别" width="100">
          <template #default="{ row }">{{ JobCategoryLabel[row.category as keyof typeof JobCategoryLabel] || '-' }}</template>
        </el-table-column>
        <el-table-column label="所属企业" width="140">
          <template #default="{ row }">{{ row.company?.name || '-' }}</template>
        </el-table-column>
        <el-table-column label="薪资范围" width="120">
          <template #default="{ row }">
            <span :class="{ 'text-danger': isSalaryReversed(row) }">
              {{ row.salaryMin ? row.salaryMin + '-' + (row.salaryMax || '') + row.salaryUnit : '面议' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="city" label="工作城市" width="100" />
        <el-table-column prop="department" label="所属部门" width="100" />
        <el-table-column prop="recruitNum" label="招聘人数" width="90" align="center" />
        <el-table-column label="创建人" width="100">
          <template #default="{ row }">{{ row.creatorName || '-' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="JobStatusType[row.status]" size="small">
              {{ JobStatusLabel[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="320" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleView(row)">查看</el-button>
            <el-button
              type="primary"
              link
              size="small"
              :disabled="!canEdit(row)"
              @click="handleEdit(row)"
            >
              编辑
            </el-button>
            <el-button
              v-if="canSubmitAudit(row)"
              type="success"
              link
              size="small"
              class="action-btn"
              @click="handleSubmitAudit(row)"
            >
              提交审核
            </el-button>
            <el-button
              v-if="canApprove(row)"
              type="success"
              link
              size="small"
              @click="handleApprove(row)"
            >
              审核通过
            </el-button>
            <el-button
              v-if="canReject(row)"
              type="warning"
              link
              size="small"
              @click="handleReject(row)"
            >
              驳回
            </el-button>
            <el-button
              v-if="row.status === JobStatus.PUBLISHED"
              type="warning"
              link
              size="small"
              @click="handleClose(row)"
            >
              关闭
            </el-button>
            <el-button
              type="danger"
              link
              size="small"
              :disabled="!canDelete(row)"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="table-pagination">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>

      <div v-if="!loading && tableData.length === 0" class="table-empty">
        <el-empty description="暂无数据" />
      </div>
    </div>

    <div v-if="preCheckVisible" class="pre-check-dialog">
      <el-dialog v-model="preCheckVisible" title="新增岗位前置检查" width="500px" :close-on-click-modal="false">
        <el-result :icon="preCheckResult.passed ? 'success' : 'warning'" :title="preCheckResult.passed ? '检查通过' : '检查未通过'">
          <template #sub-title>
            <div v-if="!preCheckResult.passed">以下条件未满足，无法新增岗位</div>
            <div v-else>所有前置条件已满足，可以新增岗位</div>
          </template>
          <template #extra>
            <div class="pre-check-list">
              <div
                v-for="item in preCheckItems"
                :key="item.key"
                class="pre-check-item"
                :class="{ passed: !isItemFailed(item.key) }"
              >
                <el-icon :class="isItemFailed(item.key) ? 'text-danger' : 'text-success'">
                  <CircleCheckFilled v-if="!isItemFailed(item.key)" />
                  <CircleCloseFilled v-else />
                </el-icon>
                <span class="item-label">{{ item.label }}</span>
                <span v-if="isItemFailed(item.key)" class="item-reason">{{ getFailedReason(item.key) }}</span>
              </div>
            </div>
          </template>
        </el-result>
        <template #footer>
          <el-button v-if="!preCheckResult.passed" @click="preCheckVisible = false">我知道了</el-button>
          <el-button v-else type="primary" @click="confirmAddJob">开始新增</el-button>
        </template>
      </el-dialog>
    </div>

    <ModalForm
      v-model="dialogVisible"
      :title="dialogTitle"
      :form-data="formData"
      :rules="formRules"
      :loading="submitLoading"
      width="760px"
      @submit="handleSubmit"
    >
      <div v-if="isEdit && formData.status === JobStatus.REJECTED" class="reject-tip">
        <el-alert type="error" :closable="false" show-icon>
          <template #title>
            <span>该岗位已被驳回</span>
          </template>
          <template #default>
            <span>驳回原因：{{ formData.rejectReason }}</span>
          </template>
        </el-alert>
      </div>

      <div v-if="isEdit && !canEditCoreFields" class="locked-tip">
        <el-alert type="warning" :closable="false" show-icon>
          <template #title>核心字段已锁定</template>
          <template #default>
            当前状态下仅可修改排序等非核心字段，如需修改请先撤回或联系管理员
          </template>
        </el-alert>
      </div>

      <div v-if="validationWarnings.length > 0" class="validation-warnings">
        <el-alert v-for="(warning, index) in validationWarnings" :key="index" type="warning" :closable="false" show-icon>
          <template #title>{{ warning }}</template>
        </el-alert>
      </div>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="岗位名称" prop="title">
            <el-input
              v-model="formData.title"
              placeholder="请输入岗位名称"
              :class="{ 'form-input-focus': isFieldFocused('title') }"
              :disabled="!canEditCoreFields"
              @focus="() => handleFieldFocus('title')"
              @blur="handleFieldBlur"
              @input="validateJobTitle"
            />
            <div v-if="titleError" class="field-error">{{ titleError }}</div>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="岗位类别" prop="category">
            <el-select
              v-model="formData.category"
              placeholder="请选择岗位类别"
              style="width: 100%"
              :class="{ 'form-select-focus': isFieldFocused('category') }"
              :disabled="!canEditCoreFields"
              @focus="() => handleFieldFocus('category')"
              @blur="handleFieldBlur"
              @change="handleCategoryChange"
            >
              <el-option v-for="(label, key) in JobCategoryLabel" :key="key" :label="label" :value="key" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="所属部门" prop="department">
            <el-input
              v-model="formData.department"
              placeholder="请输入部门"
              :class="{ 'form-input-focus': isFieldFocused('department') }"
              :disabled="!canEditCoreFields"
              @focus="() => handleFieldFocus('department')"
              @blur="handleFieldBlur"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="工作类型" prop="jobType">
            <el-select v-model="formData.jobType" placeholder="请选择" style="width: 100%" :disabled="!canEditCoreFields">
              <el-option label="全职" value="全职" />
              <el-option label="兼职" value="兼职" />
              <el-option label="实习" value="实习" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item label="最低薪资" prop="salaryMin">
            <el-input-number
              v-model="formData.salaryMin"
              :min="0"
              :controls="false"
              style="width: 100%"
              :disabled="!canEditCoreFields"
              @change="validateSalary"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="最高薪资" prop="salaryMax">
            <el-input-number
              v-model="formData.salaryMax"
              :min="0"
              :controls="false"
              style="width: 100%"
              :disabled="!canEditCoreFields"
              @change="validateSalary"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="薪资单位" prop="salaryUnit">
            <el-select v-model="formData.salaryUnit" style="width: 100%" :disabled="!canEditCoreFields">
              <el-option label="K" value="K" />
              <el-option label="万" value="万" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <div v-if="salaryError" class="salary-error">
        <el-icon><WarningFilled /></el-icon>
        <span>{{ salaryError }}</span>
      </div>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="工作城市" prop="city">
            <el-input
              v-model="formData.city"
              placeholder="请输入城市"
              :class="{ 'city-mismatch': cityMismatch, 'form-input-focus': isFieldFocused('city') }"
              :disabled="!canEditCoreFields"
              @focus="() => handleFieldFocus('city')"
              @blur="handleFieldBlur"
              @input="validateCity"
            />
            <div v-if="cityMismatch" class="field-warning">工作城市与企业属地不匹配，请确认</div>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="招聘人数" prop="recruitNum">
            <el-input-number v-model="formData.recruitNum" :min="1" style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="经验要求" prop="experience">
            <el-select v-model="formData.experience" placeholder="请选择" style="width: 100%" :disabled="!canEditCoreFields">
              <el-option label="不限" value="不限" />
              <el-option label="应届生" value="应届生" />
              <el-option label="1年以内" value="1年以内" />
              <el-option label="1-3年" value="1-3年" />
              <el-option label="3-5年" value="3-5年" />
              <el-option label="5-10年" value="5-10年" />
              <el-option label="10年以上" value="10年以上" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="学历要求" prop="education">
            <el-select v-model="formData.education" placeholder="请选择" style="width: 100%" :disabled="!canEditCoreFields">
              <el-option label="不限" value="不限" />
              <el-option label="大专" value="大专" />
              <el-option label="本科" value="本科" />
              <el-option label="硕士" value="硕士" />
              <el-option label="博士" value="博士" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="工作地址" prop="address">
        <el-input
          v-model="formData.address"
          placeholder="请输入工作地址"
          :class="{ 'form-input-focus': isFieldFocused('address') }"
          :disabled="!canEditCoreFields"
          @focus="() => handleFieldFocus('address')"
          @blur="handleFieldBlur"
        />
      </el-form-item>

      <el-form-item label="岗位职责" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="3"
          placeholder="请输入岗位职责"
          :class="{ 'form-textarea-focus': isFieldFocused('description') }"
          :disabled="!canEditCoreFields"
          @focus="() => handleFieldFocus('description')"
          @blur="handleFieldBlur"
        />
      </el-form-item>

      <el-form-item label="任职要求" prop="requirements">
        <el-input
          v-model="formData.requirements"
          type="textarea"
          :rows="3"
          placeholder="请输入任职要求（核心任职要求不能为空）"
          :class="{ 'form-textarea-focus': isFieldFocused('requirements') }"
          :disabled="!canEditCoreFields"
          @focus="() => handleFieldFocus('requirements')"
          @blur="handleFieldBlur"
          @input="validateRequirements"
        />
        <div v-if="requirementsError" class="field-error">{{ requirementsError }}</div>
        <div class="char-count">{{ (formData.requirements || '').length }}字</div>
      </el-form-item>

      <el-form-item label="福利待遇" prop="benefits">
        <el-input
          v-model="formData.benefits"
          type="textarea"
          :rows="2"
          placeholder="请输入福利待遇"
          :class="{ 'form-textarea-focus': isFieldFocused('benefits') }"
          :disabled="!canEditCoreFields"
          @focus="() => handleFieldFocus('benefits')"
          @blur="handleFieldBlur"
        />
      </el-form-item>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="状态" prop="status">
            <el-select v-model="formData.status" style="width: 100%" disabled>
              <el-option v-for="(label, key) in JobStatusLabel" :key="key" :label="label" :value="key" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="排序" prop="sort">
            <el-input-number v-model="formData.sort" :min="0" :max="999" style="width: 100%" />
          </el-form-item>
        </el-col>
      </el-row>
    </ModalForm>

    <el-dialog v-model="detailVisible" title="岗位详情" width="800px">
      <el-tabs v-model="activeDetailTab">
        <el-tab-pane label="基本信息" name="basic">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="岗位名称">{{ detailData.title }}</el-descriptions-item>
            <el-descriptions-item label="岗位类别">
              {{ JobCategoryLabel[detailData.category as keyof typeof JobCategoryLabel] || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="所属企业">{{ detailData.company?.name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="所属部门">{{ detailData.department || '-' }}</el-descriptions-item>
            <el-descriptions-item label="薪资范围">
              <span :class="{ 'text-danger': isSalaryReversed(detailData) }">
                {{ detailData.salaryMin ? detailData.salaryMin + '-' + (detailData.salaryMax || '') + detailData.salaryUnit : '面议' }}
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="招聘人数">{{ detailData.recruitNum }}人</el-descriptions-item>
            <el-descriptions-item label="工作城市">{{ detailData.city || '-' }}</el-descriptions-item>
            <el-descriptions-item label="工作类型">{{ detailData.jobType || '-' }}</el-descriptions-item>
            <el-descriptions-item label="经验要求">{{ detailData.experience || '-' }}</el-descriptions-item>
            <el-descriptions-item label="学历要求">{{ detailData.education || '-' }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="JobStatusType[detailData.status]">{{ JobStatusLabel[detailData.status] }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="创建人">{{ detailData.creatorName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="工作地址" :span="2">{{ detailData.address || '-' }}</el-descriptions-item>
            <el-descriptions-item label="岗位职责" :span="2">{{ detailData.description || '-' }}</el-descriptions-item>
            <el-descriptions-item label="任职要求" :span="2">{{ detailData.requirements || '-' }}</el-descriptions-item>
            <el-descriptions-item label="福利待遇" :span="2">{{ detailData.benefits || '-' }}</el-descriptions-item>
            <el-descriptions-item v-if="detailData.status === JobStatus.REJECTED" label="驳回原因" :span="2">
              <span class="text-danger">{{ detailData.rejectReason }}</span>
            </el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>
        <el-tab-pane label="操作记录" name="logs">
          <div class="operation-logs">
            <div v-for="log in operationLogs" :key="log.id" class="log-item">
              <div class="log-time">{{ formatTime(log.created_at) }}</div>
              <div class="log-content">
                <el-tag type="primary" size="small">{{ log.actionLabel }}</el-tag>
                <span class="log-operator">{{ log.operatorName || '系统' }}</span>
                <span v-if="log.remark" class="log-remark">{{ log.remark }}</span>
              </div>
            </div>
            <el-empty v-if="operationLogs.length === 0" description="暂无操作记录" />
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>

    <el-dialog v-model="rejectDialogVisible" title="驳回岗位" width="500px">
      <el-form :model="rejectForm" label-width="80px">
        <el-form-item label="驳回原因">
          <el-input
            v-model="rejectForm.rejectReason"
            type="textarea"
            :rows="4"
            placeholder="请输入驳回原因"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!rejectForm.rejectReason" @click="confirmReject">确认驳回</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="batchDialogVisible" :title="batchDialogTitle" width="500px">
      <template v-if="batchType === 'create'">
        <el-alert type="info" :closable="false" show-icon style="margin-bottom: 16px">
          <template #title>批量新增同类岗位</template>
          <template #default>
            选择岗位类别和部门，系统将自动填充基础配置，您可以在创建后逐个编辑
          </template>
        </el-alert>
        <el-form :model="batchForm" label-width="100px">
          <el-form-item label="岗位类别" required>
            <el-select v-model="batchForm.category" placeholder="请选择" style="width: 100%" @change="handleBatchCategoryChange">
              <el-option v-for="(label, key) in JobCategoryLabel" :key="key" :label="label" :value="key" />
            </el-select>
          </el-form-item>
          <el-form-item label="招聘部门">
            <el-input v-model="batchForm.department" placeholder="请输入部门" />
          </el-form-item>
          <el-form-item label="新增数量">
            <el-input-number v-model="batchForm.count" :min="1" :max="20" />
            <span class="tip-text">（最多20个）</span>
          </el-form-item>
        </el-form>
      </template>

      <template v-else-if="batchType === 'submit'">
        <div class="batch-summary">
          <p>已选择 <strong class="text-primary">{{ selectedIds.length }}</strong> 个岗位提交审核</p>
          <p class="text-warning">
            提示：非本人创建的岗位将被跳过
          </p>
        </div>
      </template>

      <template v-else-if="batchType === 'approve'">
        <div class="batch-summary">
          <p>已选择 <strong class="text-primary">{{ selectedIds.length }}</strong> 个待审核岗位</p>
        </div>
        <el-form :model="batchForm" label-width="80px" style="margin-top: 16px">
          <el-form-item label="审核备注">
            <el-input
              v-model="batchForm.remark"
              type="textarea"
              :rows="3"
              placeholder="请输入审核备注（可选）"
            />
          </el-form-item>
        </el-form>
      </template>

      <div v-if="batchResult" class="batch-result">
        <el-alert :type="batchResult.failed > 0 ? 'warning' : 'success'" :closable="false" show-icon>
          <template #title>
            批量操作完成：成功 {{ batchResult.success }} 个，失败 {{ batchResult.failed }} 个
          </template>
          <template #default>
            <div v-if="batchResult.errors.length > 0" class="error-list">
              <div v-for="(err, index) in batchResult.errors" :key="index" class="error-item">
                <span>{{ err.title || ('岗位ID:' + err.jobId) }}：</span>
                <span class="text-danger">{{ err.message }}</span>
              </div>
            </div>
          </template>
        </el-alert>
      </div>

      <template #footer>
        <el-button @click="batchDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="batchLoading" @click="handleBatchConfirm">
          {{ batchResult ? '关闭' : '确认' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import {
  ElMessage,
  ElMessageBox,
  type FormRules,
} from 'element-plus';
import {
  Plus,
  Delete,
  DocumentAdd,
  ArrowDown,
  WarningFilled,
  CircleCheckFilled,
  CircleCloseFilled,
} from '@element-plus/icons-vue';
import { SearchForm, ModalForm } from '@/components';
import { useUserStore } from '@/store/modules/user';
import {
  getJobListApi,
  createJobApi,
  updateJobApi,
  deleteJobApi,
  batchDeleteJobApi,
  getJobDetailApi,
  submitJobAuditApi,
  approveJobApi,
  rejectJobApi,
  closeJobApi,
  batchCreateJobApi,
  batchSubmitJobAuditApi,
  batchApproveJobApi,
  getJobOperationLogsApi,
  getJobPreCheckInfoApi,
  getBatchFillConfigApi,
  type JobItem,
  type OperationLogItem,
  type BatchResult,
  type PreCheckResult,
} from '@/api/job';
import {
  JobStatus,
  JobStatusLabel,
  JobStatusType,
  JobCategoryLabel,
  VIOLATION_KEYWORDS,
  FALSE_RECRUITMENT_KEYWORDS,
  UserRole,
} from '@/constants/recruitment';

const userStore = useUserStore();

const loading = ref(false);
const tableLoading = ref(false);
const tableData = ref<JobItem[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const selectedIds = ref<number[]>([]);
const selectedRows = ref<JobItem[]>([]);
const duplicateJobIds = ref<number[]>([]);

const isAdmin = computed(() => userStore.userInfo?.role === UserRole.ADMIN);

const searchForm = reactive({
  title: '',
  status: '',
  city: '',
  category: '',
});

const dialogVisible = ref(false);
const dialogTitle = ref('');
const isEdit = ref(false);
const submitLoading = ref(false);

const formData = reactive<Partial<JobItem>>({
  companyId: 1,
  title: '',
  category: '',
  department: '',
  jobType: '全职',
  salaryMin: undefined,
  salaryMax: undefined,
  salaryUnit: 'K',
  city: '',
  address: '',
  experience: '不限',
  education: '不限',
  recruitNum: 1,
  description: '',
  requirements: '',
  benefits: '',
  status: JobStatus.DRAFT,
  sort: 0,
  rejectReason: '',
});

const formRules: FormRules = {
  title: [{ required: true, message: '请输入岗位名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择岗位类别', trigger: 'change' }],
  salaryMin: [{ required: true, message: '请输入最低薪资', trigger: 'change' }],
  salaryMax: [{ required: true, message: '请输入最高薪资', trigger: 'change' }],
  city: [{ required: true, message: '请输入工作城市', trigger: 'blur' }],
  requirements: [{ required: true, message: '请输入任职要求', trigger: 'blur' }],
};

const titleError = ref('');
const salaryError = ref('');
const cityMismatch = ref(false);
const requirementsError = ref('');
const validationWarnings = ref<string[]>([]);

const canEditCoreFields = computed(() => {
  if (!isEdit.value) return true;
  return formData.status === JobStatus.DRAFT || formData.status === JobStatus.REJECTED;
});

const detailVisible = ref(false);
const detailData = ref<JobItem>({} as JobItem);
const activeDetailTab = ref('basic');
const operationLogs = ref<OperationLogItem[]>([]);

const rejectDialogVisible = ref(false);
const rejectTargetId = ref<number | null>(null);
const rejectForm = reactive({
  rejectReason: '',
});

const preCheckVisible = ref(false);
const preCheckResult = ref<PreCheckResult>({
  passed: false,
  failedItems: [],
});

const preCheckItems = [
  { key: 'qualification', label: '企业资质审核' },
  { key: 'recruitmentConfig', label: '招聘配置启用' },
  { key: 'permission', label: '岗位发布权限' },
];

const batchDialogVisible = ref(false);
const batchType = ref<'create' | 'submit' | 'approve'>('create');
const batchLoading = ref(false);
const batchResult = ref<BatchResult | null>(null);
const batchForm = reactive({
  category: '',
  department: '',
  count: 3,
  remark: '',
});

const batchDialogTitle = computed(() => {
  const titles: Record<string, string> = {
    create: '批量新增岗位',
    submit: '批量提交审核',
    approve: '批量审核通过',
  };
  return titles[batchType.value] || '批量操作';
});

const fetchList = async (showSkeleton = false) => {
  if (showSkeleton) {
    tableLoading.value = true;
  } else {
    loading.value = true;
  }
  try {
    const params = {
      page: page.value,
      pageSize: pageSize.value,
      ...searchForm,
    };
    if (!params.status) delete (params as any).status;
    if (!params.category) delete (params as any).category;
    const res = await getJobListApi(params);
    tableData.value = res.list;
    total.value = res.total;
    checkDuplicateJobs();
  } finally {
    loading.value = false;
    tableLoading.value = false;
  }
};

const checkDuplicateJobs = () => {
  const titleMap = new Map<string, number[]>();
  tableData.value.forEach((job) => {
    const key = `${job.companyId}-${job.title}`;
    if (!titleMap.has(key)) {
      titleMap.set(key, []);
    }
    titleMap.get(key)!.push(job.id);
  });

  const duplicates: number[] = [];
  titleMap.forEach((ids) => {
    if (ids.length > 1) {
      duplicates.push(...ids);
    }
  });
  duplicateJobIds.value = duplicates;
};

const handleSearch = () => {
  page.value = 1;
  fetchList(true);
};

const handleReset = () => {
  page.value = 1;
  searchForm.title = '';
  searchForm.status = '';
  searchForm.city = '';
  searchForm.category = '';
  fetchList(true);
};

const handlePageChange = (p: number) => {
  page.value = p;
  fetchList(true);
};

const handleSizeChange = (size: number) => {
  pageSize.value = size;
  page.value = 1;
  fetchList(true);
};

const handleSelectionChange = (selection: any[]) => {
  selectedRows.value = selection;
  selectedIds.value = selection.map((item) => item.id);
};

const handleAdd = async () => {
  try {
    const result = await getJobPreCheckInfoApi(1);
    preCheckResult.value = result;

    if (!result.passed) {
      preCheckVisible.value = true;
      return;
    }

    openAddDialog();
  } catch (error: any) {
    ElMessage.error(error.message || '检查失败');
  }
};

const openAddDialog = () => {
  isEdit.value = false;
  dialogTitle.value = '新增岗位';
  Object.assign(formData, {
    companyId: 1,
    title: '',
    category: '',
    department: '',
    jobType: '全职',
    salaryMin: undefined,
    salaryMax: undefined,
    salaryUnit: 'K',
    city: '',
    address: '',
    experience: '不限',
    education: '不限',
    recruitNum: 1,
    description: '',
    requirements: '',
    benefits: '',
    status: JobStatus.DRAFT,
    sort: 0,
    rejectReason: '',
  });
  resetValidationState();
  dialogVisible.value = true;
};

const confirmAddJob = () => {
  preCheckVisible.value = false;
  openAddDialog();
};

const isItemFailed = (key: string) => {
  return preCheckResult.value.failedItems.some((item) => item.key === key);
};

const getFailedReason = (key: string) => {
  const item = preCheckResult.value.failedItems.find((i) => i.key === key);
  return item?.reason || '';
};

const handleEdit = (row: JobItem) => {
  isEdit.value = true;
  dialogTitle.value = '编辑岗位';
  Object.assign(formData, row);
  resetValidationState();
  validateAllFields();
  dialogVisible.value = true;
};

const handleView = async (row: JobItem) => {
  try {
    const res = await getJobDetailApi(row.id);
    detailData.value = res;
    activeDetailTab.value = 'basic';
    detailVisible.value = true;
    loadOperationLogs(row.id);
  } catch (error) {
    console.error(error);
  }
};

const loadOperationLogs = async (jobId: number) => {
  try {
    const logs = await getJobOperationLogsApi(jobId);
    operationLogs.value = logs;
  } catch (error) {
    operationLogs.value = [];
  }
};

const formatTime = (time: string) => {
  if (!time) return '';
  return new Date(time).toLocaleString('zh-CN');
};

const handleSubmit = async () => {
  submitLoading.value = true;
  try {
    if (isEdit.value) {
      await updateJobApi(formData.id!, formData);
      ElMessage.success('更新成功');
    } else {
      await createJobApi(formData);
      ElMessage.success('创建成功');
    }
    dialogVisible.value = false;
    fetchList(true);
  } finally {
    submitLoading.value = false;
  }
};

const handleDelete = (row: JobItem) => {
  ElMessageBox.confirm('确定要删除该岗位吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      await deleteJobApi(row.id);
      ElMessage.success('删除成功');
      fetchList(true);
    })
    .catch(() => {});
};

const handleBatchDelete = () => {
  ElMessageBox.confirm(`确定要删除选中的 ${selectedIds.value.length} 条记录吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      await batchDeleteJobApi(selectedIds.value);
      ElMessage.success('批量删除成功');
      fetchList(true);
    })
    .catch(() => {});
};

const handleSubmitAudit = async (row: JobItem) => {
  try {
    await submitJobAuditApi(row.id);
    ElMessage.success('提交审核成功');
    fetchList(true);
  } catch (error: any) {
    ElMessage.error(error.message || '提交失败');
  }
};

const handleApprove = async (row: JobItem) => {
  ElMessageBox.confirm('确定要审核通过该岗位吗？审核通过后将自动发布', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'success',
  })
    .then(async () => {
      try {
        await approveJobApi(row.id);
        ElMessage.success('审核通过，岗位已发布');
        fetchList(true);
      } catch (error: any) {
        ElMessage.error(error.message || '操作失败');
      }
    })
    .catch(() => {});
};

const handleReject = (row: JobItem) => {
  rejectTargetId.value = row.id;
  rejectForm.rejectReason = '';
  rejectDialogVisible.value = true;
};

const confirmReject = async () => {
  if (!rejectTargetId.value || !rejectForm.rejectReason) return;

  try {
    await rejectJobApi(rejectTargetId.value, rejectForm.rejectReason);
    ElMessage.success('已驳回');
    rejectDialogVisible.value = false;
    fetchList(true);
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败');
  }
};

const handleClose = (row: JobItem) => {
  ElMessageBox.confirm('确定要关闭该岗位吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      try {
        await closeJobApi(row.id);
        ElMessage.success('已关闭');
        fetchList(true);
      } catch (error: any) {
        ElMessage.error(error.message || '操作失败');
      }
    })
    .catch(() => {});
};

const canEdit = (row: JobItem) => {
  if (isAdmin.value) return true;
  if (row.creatorId && userStore.userInfo && row.creatorId !== userStore.userInfo.id) {
    return false;
  }
  return row.status === JobStatus.DRAFT || row.status === JobStatus.REJECTED;
};

const canSubmitAudit = (row: JobItem) => {
  if (row.status !== JobStatus.DRAFT && row.status !== JobStatus.REJECTED) return false;
  if (isAdmin.value) return true;
  if (row.creatorId && userStore.userInfo && row.creatorId !== userStore.userInfo.id) {
    return false;
  }
  return true;
};

const canApprove = (row: JobItem) => {
  return isAdmin.value && row.status === JobStatus.PENDING_AUDIT;
};

const canReject = (row: JobItem) => {
  return isAdmin.value && row.status === JobStatus.PENDING_AUDIT;
};

const canDelete = (row: JobItem) => {
  if (row.status === JobStatus.PUBLISHED) return false;
  if (isAdmin.value) return true;
  if (row.creatorId && userStore.userInfo && row.creatorId !== userStore.userInfo.id) {
    return false;
  }
  return true;
};

const isSalaryReversed = (row: JobItem | Partial<JobItem>) => {
  if (row.salaryMin === undefined || row.salaryMax === undefined) return false;
  return row.salaryMin > row.salaryMax;
};

const resetValidationState = () => {
  titleError.value = '';
  salaryError.value = '';
  cityMismatch.value = false;
  requirementsError.value = '';
  validationWarnings.value = [];
};

const validateAllFields = () => {
  validateJobTitle();
  validateSalary();
  validateCity();
  validateRequirements();
};

const focusedField = ref<string>('');

const handleFieldFocus = (field: string) => {
  focusedField.value = field;
};

const handleFieldBlur = () => {
  focusedField.value = '';
};

const isFieldFocused = (field: string) => {
  return focusedField.value === field;
};

const validateJobTitle = () => {
  const title = formData.title || '';
  titleError.value = '';
  const warnings: string[] = [];

  for (const keyword of VIOLATION_KEYWORDS) {
    if (title.includes(keyword)) {
      titleError.value = `岗位名称包含违规关键词：${keyword}`;
      return;
    }
  }

  for (const keyword of FALSE_RECRUITMENT_KEYWORDS) {
    if (title.includes(keyword)) {
      warnings.push(`岗位名称包含疑似虚假招聘描述：${keyword}`);
    }
  }

  updateValidationWarnings();
};

const validateSalary = () => {
  salaryError.value = '';
  const warnings: string[] = [];

  if (formData.salaryMin !== undefined && formData.salaryMax !== undefined) {
    if (formData.salaryMin > formData.salaryMax) {
      salaryError.value = '薪资区间设置错误：最低薪资不能高于最高薪资';
      return;
    }

    if (formData.salaryMax > 0 && formData.salaryMin > 0) {
      const ratio = formData.salaryMax / formData.salaryMin;
      if (ratio > 5) {
        warnings.push('薪资区间过大，可能存在虚假薪资风险，请核实');
      }
    }
  }

  updateValidationWarnings();
};

const validateCity = () => {
  cityMismatch.value = false;
};

const validateRequirements = () => {
  requirementsError.value = '';
  const req = formData.requirements || '';
  if (req.trim().length < 20 && req.trim().length > 0) {
    // 仅提示，不拦截
  }
};

const updateValidationWarnings = () => {
  const warnings: string[] = [];
  const title = formData.title || '';

  for (const keyword of FALSE_RECRUITMENT_KEYWORDS) {
    if (title.includes(keyword) && !warnings.includes(`岗位名称包含疑似虚假招聘描述：${keyword}`)) {
      warnings.push(`岗位名称包含疑似虚假招聘描述：${keyword}`);
    }
  }

  if (formData.salaryMin !== undefined && formData.salaryMax !== undefined) {
    if (formData.salaryMax > 0 && formData.salaryMin > 0) {
      const ratio = formData.salaryMax / formData.salaryMin;
      if (ratio > 5) {
        warnings.push('薪资区间过大，可能存在虚假薪资风险，请核实');
      }
    }
  }

  validationWarnings.value = warnings;
};

const handleCategoryChange = async (category: string) => {
  if (!isEdit.value && category) {
    try {
      const config = await getBatchFillConfigApi(category, formData.department);
      Object.assign(formData, {
        jobType: config.jobType || formData.jobType,
        experience: config.experience || formData.experience,
        education: config.education || formData.education,
        salaryUnit: config.salaryUnit || formData.salaryUnit,
        salaryMin: config.salaryMin || formData.salaryMin,
        salaryMax: config.salaryMax || formData.salaryMax,
      });
      validateSalary();
    } catch (error) {
      // 忽略错误
    }
  }
};

const handleBatchCreate = () => {
  batchType.value = 'create';
  batchResult.value = null;
  batchForm.category = '';
  batchForm.department = '';
  batchForm.count = 3;
  batchDialogVisible.value = true;
};

const handleBatchSubmit = () => {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择要提交的岗位');
    return;
  }
  batchType.value = 'submit';
  batchResult.value = null;
  batchDialogVisible.value = true;
};

const handleBatchCommand = (command: string) => {
  if (command === 'submit') {
    handleBatchSubmit();
  } else if (command === 'approve') {
    if (selectedIds.value.length === 0) {
      ElMessage.warning('请先选择要审核的岗位');
      return;
    }
    batchType.value = 'approve';
    batchResult.value = null;
    batchForm.remark = '';
    batchDialogVisible.value = true;
  } else if (command === 'delete') {
    handleBatchDelete();
  }
};

const handleBatchCategoryChange = async (category: string) => {
  if (category) {
    try {
      await getBatchFillConfigApi(category, batchForm.department);
    } catch (error) {
      // 忽略错误
    }
  }
};

const handleBatchConfirm = async () => {
  if (batchResult.value) {
    batchDialogVisible.value = false;
    batchResult.value = null;
    fetchList(true);
    return;
  }

  batchLoading.value = true;
  try {
    if (batchType.value === 'create') {
      if (!batchForm.category) {
        ElMessage.warning('请选择岗位类别');
        return;
      }

      const jobs: Partial<JobItem>[] = [];
      for (let i = 0; i < batchForm.count; i++) {
        jobs.push({
          companyId: 1,
          title: `${JobCategoryLabel[batchForm.category as keyof typeof JobCategoryLabel] || batchForm.category}岗位${i + 1}`,
          category: batchForm.category,
          department: batchForm.department,
          jobType: '全职',
          salaryMin: undefined,
          salaryMax: undefined,
          salaryUnit: 'K',
          city: '',
          experience: '不限',
          education: '不限',
          recruitNum: 1,
          description: '',
          requirements: '',
          benefits: '',
          status: JobStatus.DRAFT,
          sort: 0,
        });
      }

      const result = await batchCreateJobApi(jobs);
      batchResult.value = result;
    } else if (batchType.value === 'submit') {
      const result = await batchSubmitJobAuditApi(selectedIds.value);
      batchResult.value = result;
    } else if (batchType.value === 'approve') {
      const result = await batchApproveJobApi(selectedIds.value, batchForm.remark);
      batchResult.value = result;
    }
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败');
  } finally {
    batchLoading.value = false;
  }
};

onMounted(() => {
  fetchList();
});
</script>

<style lang="scss" scoped>
.job-page {
  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-base;
    padding: $spacing-base;
    background: $bg-white;
    border-radius: $border-radius;

    .toolbar-left {
      display: flex;
      gap: $spacing-sm;
    }

    .stat-text {
      color: $text-secondary;
      font-size: $font-size-sm;
    }
  }

  .table-wrapper {
    background: $bg-white;
    border-radius: $border-radius;
    padding: $spacing-base;
    position: relative;

    .skeleton-wrapper {
      padding: $spacing-base 0;

      .skeleton-row {
        display: flex;
        gap: $spacing-sm;
        margin-bottom: $spacing-base;

        .skeleton-cell {
          height: 32px;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: skeleton-loading 1.5s infinite;
          border-radius: 4px;
        }

        .w-10 { width: 10%; }
        .w-15 { width: 15%; }
        .w-20 { width: 20%; }
      }
    }

    @keyframes skeleton-loading {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .table-pagination {
      margin-top: $spacing-base;
      display: flex;
      justify-content: flex-end;
    }

    .table-empty {
      padding: $spacing-2xl 0;
    }
  }

  .job-title {
    &.duplicate-job {
      color: $color-warning;
    }
  }

  .ml-5 {
    margin-left: 5px;
  }

  .text-danger {
    color: $color-danger;
  }

  .text-primary {
    color: $color-primary;
  }

  .text-warning {
    color: $color-warning;
  }

  .text-success {
    color: $color-success;
  }

  .action-btn {
    transition: all 0.15s ease;

    &:active {
      transform: translateX(2px) translateY(2px);
      opacity: 0.85;
      filter: brightness(0.95);
    }
  }

  .form-input-focus {
    :deep(.el-input__wrapper) {
      transition: all 0.2s ease;
      box-shadow: 0 0 0 1px $color-primary inset !important;
      background-color: mix($color-primary, #fff, 2%) !important;
    }
  }

  .form-textarea-focus {
    :deep(.el-textarea__inner) {
      transition: all 0.2s ease;
      box-shadow: 0 0 0 1px $color-primary inset !important;
      background-color: mix($color-primary, #fff, 2%) !important;
    }
  }

  .form-select-focus {
    :deep(.el-select__wrapper) {
      transition: all 0.2s ease;
      box-shadow: 0 0 0 1px $color-primary inset !important;
      background-color: mix($color-primary, #fff, 2%) !important;
    }
  }

  .reject-tip,
  .locked-tip {
    margin-bottom: $spacing-base;
  }

  .validation-warnings {
    margin-bottom: $spacing-base;

    .el-alert {
      margin-bottom: $spacing-xs;
    }
  }

  .field-error {
    color: $color-danger;
    font-size: $font-size-sm;
    margin-top: 4px;
  }

  .field-warning {
    color: $color-warning;
    font-size: $font-size-sm;
    margin-top: 4px;
  }

  .salary-error {
    display: flex;
    align-items: center;
    gap: 6px;
    color: $color-danger;
    font-size: $font-size-sm;
    margin-bottom: $spacing-base;
    padding: 8px 12px;
    background: rgba(#f56c6c, 0.1);
    border-radius: 4px;
  }

  .city-mismatch {
    :deep(.el-input__wrapper) {
      box-shadow: 0 0 0 1px $color-warning inset;
    }
  }

  .char-count {
    text-align: right;
    color: $text-placeholder;
    font-size: $font-size-xs;
    margin-top: 4px;
  }

  .pre-check-list {
    text-align: left;
    padding: 0 40px;

    .pre-check-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 0;

      .item-label {
        font-weight: 500;
        min-width: 100px;
      }

      .item-reason {
        color: $text-secondary;
        font-size: $font-size-sm;
      }
    }
  }

  .operation-logs {
    max-height: 400px;
    overflow-y: auto;

    .log-item {
      position: relative;
      padding-left: 20px;
      padding-bottom: $spacing-base;
      border-left: 2px solid $border-color;
      margin-left: 10px;

      &:last-child {
        border-left-color: transparent;
      }

      &::before {
        content: '';
        position: absolute;
        left: -6px;
        top: 4px;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: $color-primary;
      }

      .log-time {
        font-size: $font-size-sm;
        color: $text-secondary;
        margin-bottom: 6px;
      }

      .log-content {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;

        .log-operator {
          color: $text-primary;
        }

        .log-remark {
          color: $text-secondary;
          font-size: $font-size-sm;
        }
      }
    }
  }

  .batch-summary {
    text-align: center;
    padding: $spacing-xl 0;

    p {
      margin: 0 0 $spacing-sm;
      font-size: $font-size-lg;
    }
  }

  .batch-result {
    margin-top: $spacing-base;
  }

  .error-list {
    max-height: 200px;
    overflow-y: auto;
    margin-top: 8px;

    .error-item {
      font-size: $font-size-sm;
      padding: 4px 0;
    }
  }

  .tip-text {
    color: $text-secondary;
    font-size: $font-size-sm;
    margin-left: 8px;
  }
}
</style>
