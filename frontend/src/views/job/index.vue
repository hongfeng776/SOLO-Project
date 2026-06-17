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
        <el-button type="warning" :icon="Edit" class="action-btn" @click="openBatchEditDialog">批量编辑</el-button>
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
        @row-click="handleRowClick"
        :row-class-name="rowClassName"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="title" label="岗位名称" min-width="150" resizable>
          <template #default="{ row }">
            <span class="job-title" :class="{ 'duplicate-job': duplicateJobIds.includes(row.id) }">{{ row.title }}</span>
            <el-tag v-if="duplicateJobIds.includes(row.id)" type="warning" size="small" class="ml-5">重复</el-tag>
            <el-tag v-if="row.abnormalFlag" type="danger" size="small" class="ml-5">异常</el-tag>
            <el-tag v-if="row.status === JobStatus.PUBLISHED && row.pendingChanges" type="warning" size="small" class="ml-5">
              待审核变更
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="岗位类别" width="100" resizable>
          <template #default="{ row }">{{ JobCategoryLabel[row.category as keyof typeof JobCategoryLabel] || '-' }}</template>
        </el-table-column>
        <el-table-column label="所属企业" width="140" resizable>
          <template #default="{ row }">{{ row.company?.name || '-' }}</template>
        </el-table-column>
        <el-table-column label="薪资范围" width="120" resizable>
          <template #default="{ row }">
            <span :class="{ 'text-danger': isSalaryReversed(row) }">
              {{ row.salaryMin ? row.salaryMin + '-' + (row.salaryMax || '') + row.salaryUnit : '面议' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="city" label="工作城市" width="100" resizable />
        <el-table-column prop="department" label="所属部门" width="100" resizable />
        <el-table-column prop="recruitNum" label="招聘人数" width="90" align="center" resizable />
        <el-table-column label="匹配权重" width="90" align="center" resizable>
          <template #default="{ row }">
            <el-tag v-if="row.matchWeight" :type="row.matchWeight >= 80 ? 'success' : row.matchWeight >= 50 ? 'warning' : 'info'" size="small">
              {{ row.matchWeight }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="创建人" width="100" resizable>
          <template #default="{ row }">{{ row.creatorName || '-' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center" resizable>
          <template #default="{ row }">
            <el-tag :type="JobStatusType[row.status]" size="small">
              {{ JobStatusLabel[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="400" fixed="right" align="center" resizable>
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleView(row)">查看</el-button>
            <el-button
              type="primary"
              link
              size="small"
              :disabled="!canEdit(row)"
              @click="handleEdit(row)"
            >
              {{ row.status === JobStatus.PENDING_AUDIT ? '编辑排序' : '编辑' }}
            </el-button>
            <el-button
              v-if="row.pendingChanges"
              type="warning"
              link
              size="small"
              @click="handleCancelChange(row)"
            >
              取消变更
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
              v-if="canApproveChange(row)"
              type="success"
              link
              size="small"
              @click="handleApproveChange(row)"
            >
              通过变更
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
              v-if="canRejectChange(row)"
              type="warning"
              link
              size="small"
              @click="handleRejectChange(row)"
            >
              驳回变更
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

    <el-backtop :visibility-height="500" :bottom="60" />

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
      <transition name="slide-fade">
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
      </transition>

      <transition name="slide-fade">
        <div v-if="isEdit && !canEditCoreFields" class="locked-tip">
          <el-alert type="warning" :closable="false" show-icon>
            <template #title>核心字段已锁定</template>
            <template #default>
              {{ editableFields.includes('sort') ? '当前状态下仅可修改排序字段' : '当前状态下仅可修改排序等非核心字段，如需修改请先撤回或联系管理员' }}
            </template>
          </el-alert>
        </div>
      </transition>

      <transition name="slide-fade">
        <div v-if="isEdit && editCheckResult?.isMajorChange" class="major-change-tip">
          <el-alert type="warning" :closable="false" show-icon>
            <template #title>重大信息变更提示</template>
            <template #default>
              修改薪资、经验、学历、类别、城市、招聘人数等核心信息需要提交审核，审核通过后生效
            </template>
          </el-alert>
        </div>
      </transition>

      <transition name="slide-fade">
        <div v-if="currentMatchWeight" class="match-weight-tip">
          <el-alert type="info" :closable="false" show-icon>
            <template #title>智能匹配权重</template>
            <template #default>
              当前岗位智能匹配权重：<strong>{{ currentMatchWeight }}</strong> 分
            </template>
          </el-alert>
        </div>
      </transition>

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
              :disabled="!canEditField('title')"
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
              :disabled="!canEditField('category')"
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
              :disabled="!canEditField('department')"
              @focus="() => handleFieldFocus('department')"
              @blur="handleFieldBlur"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="工作类型" prop="jobType">
            <el-select v-model="formData.jobType" placeholder="请选择" style="width: 100%" :disabled="!canEditField('jobType')">
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
              :disabled="!canEditField('salaryMin')"
              @change="handleSalaryChange"
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
              :disabled="!canEditField('salaryMax')"
              @change="handleSalaryChange"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="薪资单位" prop="salaryUnit">
            <el-select v-model="formData.salaryUnit" style="width: 100%" :disabled="!canEditField('salaryUnit')">
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
              :disabled="!canEditField('city')"
              @focus="() => handleFieldFocus('city')"
              @blur="handleFieldBlur"
              @input="handleCityChange"
            />
            <div v-if="cityMismatch" class="field-warning">工作城市与企业属地不匹配，请确认</div>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="招聘人数" prop="recruitNum">
            <el-input-number 
              v-model="formData.recruitNum" 
              :min="1" 
              style="width: 100%" 
              :disabled="!canEditField('recruitNum')"
              @change="handleRecruitNumChange"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="经验要求" prop="experience">
            <el-select 
              v-model="formData.experience" 
              placeholder="请选择" 
              style="width: 100%" 
              :disabled="!canEditField('experience')"
              @change="handleExperienceChange"
            >
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
            <el-select 
              v-model="formData.education" 
              placeholder="请选择" 
              style="width: 100%" 
              :disabled="!canEditField('education')"
              @change="handleEducationChange"
            >
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
          :disabled="!canEditField('address')"
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
          :disabled="!canEditField('description')"
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
          :disabled="!canEditField('requirements')"
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
          :disabled="!canEditField('benefits')"
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
            <el-input-number v-model="formData.sort" :min="0" :max="999" style="width: 100%" :disabled="!canEditField('sort')" />
          </el-form-item>
        </el-col>
      </el-row>
    </ModalForm>

    <el-dialog 
      v-model="detailVisible" 
      title="岗位详情" 
      width="900px"
      :close-on-click-modal="false"
    >
      <el-tabs v-model="activeDetailTab">
        <el-tab-pane label="基本信息" name="basic">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="岗位名称">
              <span>{{ detailData.title }}</span>
              <el-tag v-if="detailData.abnormalFlag" type="danger" size="small" class="ml-5">异常</el-tag>
            </el-descriptions-item>
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
            <el-descriptions-item label="匹配权重">
              <el-tag v-if="detailData.matchWeight" :type="detailData.matchWeight >= 80 ? 'success' : detailData.matchWeight >= 50 ? 'warning' : 'info'" size="small">
                {{ detailData.matchWeight }}
              </el-tag>
              <span v-else>-</span>
            </el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="JobStatusType[detailData.status]">{{ JobStatusLabel[detailData.status] }}</el-tag>
              <el-tag v-if="detailData.pendingChanges" type="warning" size="small" class="ml-5">待审核变更</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="创建人">{{ detailData.creatorName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="版本号">v{{ detailData.version || 1 }}</el-descriptions-item>
            <el-descriptions-item label="工作地址" :span="2">{{ detailData.address || '-' }}</el-descriptions-item>
            <el-descriptions-item label="岗位职责" :span="2">{{ detailData.description || '-' }}</el-descriptions-item>
            <el-descriptions-item label="任职要求" :span="2">{{ detailData.requirements || '-' }}</el-descriptions-item>
            <el-descriptions-item label="福利待遇" :span="2">{{ detailData.benefits || '-' }}</el-descriptions-item>
            <el-descriptions-item v-if="detailData.status === JobStatus.REJECTED" label="驳回原因" :span="2">
              <span class="text-danger">{{ detailData.rejectReason }}</span>
            </el-descriptions-item>
            <el-descriptions-item v-if="detailData.abnormalFlag" label="异常原因" :span="2">
              <span class="text-danger">{{ detailData.abnormalReason || '存在异常数据' }}</span>
            </el-descriptions-item>
          </el-descriptions>
          
          <div v-if="detailData.abnormalFlag" class="detail-action-bar">
            <el-button type="warning" @click="handleRollbackVersion(detailData)">回滚上一版本</el-button>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="变更审核" name="changeAudit">
          <div v-if="detailData.pendingChanges" class="change-audit-section">
            <el-alert type="warning" :closable="false" show-icon style="margin-bottom: 16px">
              <template #title>存在待审核的变更</template>
              <template #default>
                提交人：{{ detailData.changeOperatorName || '未知' }}，提交时间：{{ formatTime(detailData.changeSubmitTime) }}
              </template>
            </el-alert>
            
            <el-descriptions :column="2" border title="待审核变更内容">
              <template v-for="item in pendingChangeList" :key="item.field">
                <el-descriptions-item :label="item.label">
                  <div class="change-compare">
                    <span class="old-value">{{ item.oldValue || '-' }}</span>
                    <el-icon><Right /></el-icon>
                    <span class="new-value">{{ item.newValue || '-' }}</span>
                  </div>
                </el-descriptions-item>
              </template>
            </el-descriptions>
            
            <div class="detail-action-bar">
              <el-button type="success" @click="handleApproveChange(detailData)">通过变更</el-button>
              <el-button type="warning" @click="handleRejectChange(detailData)">驳回变更</el-button>
              <el-button @click="handleCancelChange(detailData)">取消变更</el-button>
            </div>
          </div>
          <el-empty v-else description="暂无待审核变更" />
        </el-tab-pane>
        
        <el-tab-pane label="版本对比" name="versionDiff">
          <div v-if="versionDiffLoading" class="loading-wrapper">
            <el-skeleton :rows="8" animated />
          </div>
          <div v-else class="version-diff-section">
            <el-table :data="versionDiffData" border stripe>
              <el-table-column prop="label" label="字段" width="120" />
              <el-table-column label="变更对比">
                <template #default="{ row }">
                  <div v-if="row.changed" class="change-compare">
                    <span class="old-value">{{ formatValue(row.oldValue) }}</span>
                    <el-icon><Right /></el-icon>
                    <span class="new-value">{{ formatValue(row.newValue) }}</span>
                  </div>
                  <span v-else class="no-change">{{ formatValue(row.oldValue) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="changed" label="状态" width="80" align="center">
                <template #default="{ row }">
                  <el-tag v-if="row.changed" type="warning" size="small">已变更</el-tag>
                  <span v-else class="text-secondary">未变更</span>
                </template>
              </el-table-column>
            </el-table>
            
            <div v-if="versionDiffData.length > 0" class="detail-action-bar">
              <el-button type="warning" @click="handleRollbackVersion(detailData)">回滚上一版本</el-button>
            </div>
          </div>
          <el-empty v-if="!versionDiffLoading && versionDiffData.length === 0" description="暂无版本差异数据" />
        </el-tab-pane>
        
        <el-tab-pane label="编辑历史" name="editHistory">
          <div v-if="editHistoryLoading" class="loading-wrapper">
            <el-skeleton :rows="8" animated />
          </div>
          <div v-else class="operation-logs">
            <div v-for="log in editHistoryList" :key="log.id" class="log-item">
              <div class="log-time">{{ formatTime(log.created_at) }}</div>
              <div class="log-content">
                <el-tag type="primary" size="small">{{ log.actionLabel }}</el-tag>
                <span class="log-operator">{{ log.operatorName || '系统' }}</span>
                <span v-if="log.remark" class="log-remark">{{ log.remark }}</span>
              </div>
              <div v-if="log.changedFields" class="log-changes">
                <el-tag type="info" size="small">变更字段：{{ log.changedFields }}</el-tag>
              </div>
            </div>
            <el-empty v-if="editHistoryList.length === 0" description="暂无编辑历史" />
          </div>
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

    <el-dialog v-model="rejectChangeDialogVisible" title="驳回变更" width="500px">
      <el-form :model="rejectChangeForm" label-width="80px">
        <el-form-item label="驳回原因">
          <el-input
            v-model="rejectChangeForm.rejectReason"
            type="textarea"
            :rows="4"
            placeholder="请输入驳回原因"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectChangeDialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!rejectChangeForm.rejectReason" @click="confirmRejectChange">确认驳回</el-button>
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

    <el-dialog 
      v-model="batchEditVisible" 
      title="批量编辑岗位" 
      width="700px"
      :close-on-click-modal="false"
    >
      <el-alert type="info" :closable="false" show-icon style="margin-bottom: 16px">
        <template #title>批量编辑说明</template>
        <template #default>
          已投递简历的岗位仅可更新薪资和招聘人数，其他字段将不会被修改，以避免影响已有简历
        </template>
      </el-alert>

      <el-form :model="batchEditFilterForm" label-width="100px" class="filter-section">
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="岗位类别">
              <el-select v-model="batchEditFilterForm.category" placeholder="全部" clearable style="width: 100%">
                <el-option v-for="(label, key) in JobCategoryLabel" :key="key" :label="label" :value="key" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="发布时间">
              <el-date-picker
                v-model="batchEditFilterForm.publishTimeRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="招聘状态">
              <el-select v-model="batchEditFilterForm.status" placeholder="全部" clearable style="width: 100%">
                <el-option v-for="(label, key) in JobStatusLabel" :key="key" :label="label" :value="key" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item>
          <el-button type="primary" @click="applyBatchEditFilter">应用筛选</el-button>
          <el-button @click="resetBatchEditFilter">重置筛选</el-button>
          <span class="filter-count">已筛选 <strong>{{ batchEditFilteredIds.length }}</strong> 条记录</span>
        </el-form-item>
      </el-form>

      <el-divider content-position="left">编辑字段</el-divider>

      <el-form :model="batchEditForm" label-width="100px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="薪资范围">
              <div class="salary-range-input">
                <el-input-number
                  v-model="batchEditForm.salaryMin"
                  :min="0"
                  :controls="false"
                  placeholder="最低薪资"
                  style="width: 45%"
                />
                <span class="range-separator">-</span>
                <el-input-number
                  v-model="batchEditForm.salaryMax"
                  :min="0"
                  :controls="false"
                  placeholder="最高薪资"
                  style="width: 45%"
                />
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="薪资单位">
              <el-select v-model="batchEditForm.salaryUnit" placeholder="保持不变" clearable style="width: 100%">
                <el-option label="K" value="K" />
                <el-option label="万" value="万" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="招聘人数">
              <el-input-number 
                v-model="batchEditForm.recruitNum" 
                :min="1" 
                placeholder="保持不变" 
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="工作地点">
              <el-input 
                v-model="batchEditForm.city" 
                placeholder="保持不变，留空不修改" 
                clearable
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="岗位状态">
              <el-select v-model="batchEditForm.status" placeholder="保持不变" clearable style="width: 100%">
                <el-option v-for="(label, key) in JobStatusLabel" :key="key" :label="label" :value="key" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <div v-if="batchEditWarning" class="batch-edit-warning">
        <el-alert type="warning" :closable="false" show-icon>
          <template #title>{{ batchEditWarning }}</template>
        </el-alert>
      </div>

      <template #footer>
        <el-button @click="batchEditVisible = false">取消</el-button>
        <el-button 
          type="primary" 
          :loading="batchEditLoading" 
          :disabled="!canSubmitBatchEdit"
          @click="handleBatchEditSubmit"
        >
          确认批量编辑
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue';
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
  Edit,
  Right,
} from '@element-plus/icons-vue';
import { SearchForm, ModalForm } from '@/components';
import { useUserStore } from '@/store/modules/user';
import {
  getJobListApi,
  createJobApi,
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
  checkJobEditPermissionApi,
  updateJobFullApi,
  approveJobChangeApi,
  rejectJobChangeApi,
  cancelJobChangeApi,
  getJobVersionDiffApi,
  getJobEditHistoryApi,
  batchUpdateJobApi,
  rollbackJobVersionApi,
  calculateMatchWeightApi,
  validateIndustryNormApi,
  type JobItem,
  type OperationLogItem,
  type BatchResult,
  type PreCheckResult,
  type EditCheckResult,
  type VersionDiff,
  type BatchEditFilter,
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
const selectedRowId = ref<number | null>(null);

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
const currentMatchWeight = ref<number | null>(null);
const editCheckResult = ref<EditCheckResult | null>(null);
const editableFields = ref<string[]>([]);
const calculatingWeight = ref(false);
const validatingNorm = ref(false);

const MAJOR_CHANGE_FIELDS = ['salaryMin', 'salaryMax', 'experience', 'education', 'category', 'city', 'recruitNum'];

const canEditCoreFields = computed(() => {
  if (!isEdit.value) return true;
  if (editCheckResult.value) {
    return editCheckResult.value.editableFields.some(f => MAJOR_CHANGE_FIELDS.includes(f));
  }
  return formData.status === JobStatus.DRAFT || formData.status === JobStatus.REJECTED;
});

const canEditField = (field: string) => {
  if (!isEdit.value) return true;
  if (editCheckResult.value) {
    return editCheckResult.value.editableFields.includes(field);
  }
  if (field === 'sort') return true;
  return formData.status === JobStatus.DRAFT || formData.status === JobStatus.REJECTED;
};

const detailVisible = ref(false);
const detailData = ref<JobItem>({} as JobItem);
const activeDetailTab = ref('basic');
const operationLogs = ref<OperationLogItem[]>([]);

const versionDiffLoading = ref(false);
const versionDiffData = ref<VersionDiff[]>([]);

const editHistoryLoading = ref(false);
const editHistoryList = ref<OperationLogItem[]>([]);

const pendingChangeList = ref<VersionDiff[]>([]);

const rejectDialogVisible = ref(false);
const rejectTargetId = ref<number | null>(null);
const rejectForm = reactive({
  rejectReason: '',
});

const rejectChangeDialogVisible = ref(false);
const rejectChangeTargetId = ref<number | null>(null);
const rejectChangeForm = reactive({
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

const batchEditVisible = ref(false);
const batchEditLoading = ref(false);
const batchEditWarning = ref('');
const batchEditFilterForm = reactive({
  category: '',
  status: '',
  publishTimeRange: [] as string[],
});
const batchEditForm = reactive<Partial<JobItem>>({
  salaryMin: undefined,
  salaryMax: undefined,
  salaryUnit: undefined,
  recruitNum: undefined,
  city: '',
  status: undefined,
});
const batchEditFilteredIds = ref<number[]>([]);

const canSubmitBatchEdit = computed(() => {
  const hasData = batchEditForm.salaryMin !== undefined ||
    batchEditForm.salaryMax !== undefined ||
    batchEditForm.salaryUnit !== undefined ||
    batchEditForm.recruitNum !== undefined ||
    (batchEditForm.city && batchEditForm.city.trim() !== '') ||
    batchEditForm.status !== undefined;
  return hasData && batchEditFilteredIds.value.length > 0;
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

const handleRowClick = (row: JobItem) => {
  selectedRowId.value = row.id;
};

const rowClassName = ({ row }: { row: JobItem }) => {
  return row.id === selectedRowId.value ? 'row-highlight' : '';
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
  editCheckResult.value = null;
  editableFields.value = [];
  currentMatchWeight.value = null;
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

const handleEdit = async (row: JobItem) => {
  try {
    const checkResult = await checkJobEditPermissionApi(row.id);
    if (!checkResult.canEdit) {
      ElMessage.warning(checkResult.reason || '当前状态下不可编辑');
      return;
    }
    
    editCheckResult.value = checkResult;
    editableFields.value = checkResult.editableFields;
    
    isEdit.value = true;
    dialogTitle.value = '编辑岗位';
    Object.assign(formData, row);
    currentMatchWeight.value = row.matchWeight || null;
    resetValidationState();
    validateAllFields();
    dialogVisible.value = true;
  } catch (error: any) {
    ElMessage.error(error.message || '检查编辑权限失败');
  }
};

const handleView = async (row: JobItem) => {
  try {
    const res = await getJobDetailApi(row.id);
    detailData.value = res;
    activeDetailTab.value = 'basic';
    detailVisible.value = true;
    loadOperationLogs(row.id);
    
    if (res.pendingChanges) {
      parsePendingChanges(res);
    }
    
    loadVersionDiff(row.id);
    loadEditHistory(row.id);
  } catch (error) {
    console.error(error);
  }
};

const parsePendingChanges = (data: JobItem) => {
  try {
    if (data.pendingChanges) {
      const changes = JSON.parse(data.pendingChanges);
      pendingChangeList.value = Object.entries(changes).map(([field, values]: [string, any]) => ({
        field,
        label: getFieldLabel(field),
        oldValue: values.old,
        newValue: values.new,
        changed: true,
      }));
    }
  } catch (e) {
    pendingChangeList.value = [];
  }
};

const getFieldLabel = (field: string): string => {
  const labelMap: Record<string, string> = {
    title: '岗位名称',
    category: '岗位类别',
    department: '所属部门',
    salaryMin: '最低薪资',
    salaryMax: '最高薪资',
    salaryUnit: '薪资单位',
    city: '工作城市',
    recruitNum: '招聘人数',
    experience: '经验要求',
    education: '学历要求',
    address: '工作地址',
    description: '岗位职责',
    requirements: '任职要求',
    benefits: '福利待遇',
    sort: '排序',
  };
  return labelMap[field] || field;
};

const formatValue = (value: any): string => {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'boolean') return value ? '是' : '否';
  return String(value);
};

const loadOperationLogs = async (jobId: number) => {
  try {
    const logs = await getJobOperationLogsApi(jobId);
    operationLogs.value = logs;
  } catch (error) {
    operationLogs.value = [];
  }
};

const loadVersionDiff = async (jobId: number) => {
  versionDiffLoading.value = true;
  try {
    const data = await getJobVersionDiffApi(jobId);
    versionDiffData.value = data;
  } catch (error) {
    versionDiffData.value = [];
  } finally {
    versionDiffLoading.value = false;
  }
};

const loadEditHistory = async (jobId: number) => {
  editHistoryLoading.value = true;
  try {
    const data = await getJobEditHistoryApi(jobId);
    editHistoryList.value = data;
  } catch (error) {
    editHistoryList.value = [];
  } finally {
    editHistoryLoading.value = false;
  }
};

const formatTime = (time: string) => {
  if (!time) return '';
  return new Date(time).toLocaleString('zh-CN');
};

const detectMajorChanges = (): boolean => {
  if (!isEdit.value || !editCheckResult.value) return false;
  if (formData.status !== JobStatus.PUBLISHED) return false;
  return MAJOR_CHANGE_FIELDS.some(field => {
    const originalRow = tableData.value.find(r => r.id === formData.id);
    if (!originalRow) return false;
    return (formData as any)[field] !== (originalRow as any)[field] && 
           editableFields.value.includes(field);
  });
};

const handleSubmit = async () => {
  submitLoading.value = true;
  try {
    if (isEdit.value) {
      const isMajorChange = detectMajorChanges();
      const effectiveMode = isMajorChange ? 'audit' : 'immediate';
      
      const updateData = {
        ...formData,
        isMajorChange,
        effectiveMode,
      };
      
      await updateJobFullApi(formData.id!, updateData);
      
      if (effectiveMode === 'audit') {
        ElMessage.success('已提交审核，审核通过后生效');
      } else {
        ElMessage.success('更新成功');
      }
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

const handleApproveChange = async (row: JobItem) => {
  ElMessageBox.confirm('确定要通过该变更吗？通过后变更将立即生效', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'success',
  })
    .then(async () => {
      try {
        await approveJobChangeApi(row.id);
        ElMessage.success('变更已通过并生效');
        detailVisible.value = false;
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

const handleRejectChange = (row: JobItem) => {
  rejectChangeTargetId.value = row.id;
  rejectChangeForm.rejectReason = '';
  rejectChangeDialogVisible.value = true;
};

const handleCancelChange = async (row: JobItem) => {
  ElMessageBox.confirm('确定要取消该待审核变更吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      try {
        await cancelJobChangeApi(row.id);
        ElMessage.success('已取消变更');
        detailVisible.value = false;
        fetchList(true);
      } catch (error: any) {
        ElMessage.error(error.message || '操作失败');
      }
    })
    .catch(() => {});
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

const confirmRejectChange = async () => {
  if (!rejectChangeTargetId.value || !rejectChangeForm.rejectReason) return;

  try {
    await rejectJobChangeApi(rejectChangeTargetId.value, rejectChangeForm.rejectReason);
    ElMessage.success('已驳回变更');
    rejectChangeDialogVisible.value = false;
    detailVisible.value = false;
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

const handleRollbackVersion = async (row: JobItem) => {
  ElMessageBox.confirm('确定要回滚到上一版本吗？当前版本的修改将会丢失', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      try {
        await rollbackJobVersionApi(row.id);
        ElMessage.success('已回滚到上一版本');
        detailVisible.value = false;
        fetchList(true);
      } catch (error: any) {
        ElMessage.error(error.message || '回滚失败');
      }
    })
    .catch(() => {});
};

const canEdit = (row: JobItem) => {
  if (isAdmin.value) return true;
  if (row.creatorId && userStore.userInfo && row.creatorId !== userStore.userInfo.id) {
    return false;
  }
  if (row.status === JobStatus.PENDING_AUDIT) return true;
  return row.status === JobStatus.DRAFT || row.status === JobStatus.REJECTED || row.status === JobStatus.PUBLISHED;
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
  return isAdmin.value && row.status === JobStatus.PENDING_AUDIT && !row.pendingChanges;
};

const canApproveChange = (row: JobItem) => {
  return isAdmin.value && row.pendingChanges;
};

const canReject = (row: JobItem) => {
  return isAdmin.value && row.status === JobStatus.PENDING_AUDIT && !row.pendingChanges;
};

const canRejectChange = (row: JobItem) => {
  return isAdmin.value && row.pendingChanges;
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

let calculateWeightTimer: any = null;

const debouncedCalculateMatchWeight = () => {
  if (calculatingWeight.value) return;
  
  if (calculateWeightTimer) {
    clearTimeout(calculateWeightTimer);
  }
  
  calculateWeightTimer = setTimeout(async () => {
    calculatingWeight.value = true;
    try {
      const res = await calculateMatchWeightApi({
        salaryMin: formData.salaryMin,
        salaryMax: formData.salaryMax,
        experience: formData.experience,
        education: formData.education,
        category: formData.category,
        city: formData.city,
      });
      currentMatchWeight.value = res.matchWeight;
    } catch (error) {
      console.error('计算匹配权重失败', error);
    } finally {
      calculatingWeight.value = false;
    }
  }, 500);
};

let validateNormTimer: any = null;

const debouncedValidateIndustryNorm = async () => {
  if (validatingNorm.value) return;
  
  if (validateNormTimer) {
    clearTimeout(validateNormTimer);
  }
  
  validateNormTimer = setTimeout(async () => {
    validatingNorm.value = true;
    try {
      const res = await validateIndustryNormApi(
        {
          title: formData.title,
          salaryMin: formData.salaryMin,
          salaryMax: formData.salaryMax,
          description: formData.description,
          requirements: formData.requirements,
        },
        formData.category
      );
      
      const warnings: string[] = [];
      if (!res.valid) {
        res.errors.forEach(err => warnings.push(err));
      }
      res.warnings.forEach(warn => warnings.push(warn));
      
      if (warnings.length > 0) {
        warnings.forEach(w => ElMessage.warning(w));
      }
    } catch (error) {
      console.error('验证行业规范失败', error);
    } finally {
      validatingNorm.value = false;
    }
  }, 800);
};

const handleSalaryChange = () => {
  validateSalary();
  if (isEdit.value && canEditField('salaryMin') && canEditField('salaryMax')) {
    debouncedCalculateMatchWeight();
    debouncedValidateIndustryNorm();
  }
};

const handleExperienceChange = () => {
  if (isEdit.value && canEditField('experience')) {
    debouncedCalculateMatchWeight();
  }
};

const handleEducationChange = () => {
  if (isEdit.value && canEditField('education')) {
    debouncedCalculateMatchWeight();
  }
};

const handleCityChange = () => {
  validateCity();
  if (isEdit.value && canEditField('city')) {
    debouncedCalculateMatchWeight();
    debouncedValidateIndustryNorm();
  }
};

const handleRecruitNumChange = () => {
  if (isEdit.value && canEditField('recruitNum')) {
    debouncedValidateIndustryNorm();
  }
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
    }
  } else if (isEdit.value && canEditField('category')) {
    debouncedCalculateMatchWeight();
    debouncedValidateIndustryNorm();
  }
};

const validateJobTitle = () => {
  const title = formData.title || '';
  titleError.value = '';

  for (const keyword of VIOLATION_KEYWORDS) {
    if (title.includes(keyword)) {
      titleError.value = `岗位名称包含违规关键词：${keyword}`;
      return;
    }
  }

  updateValidationWarnings();
};

const validateSalary = () => {
  salaryError.value = '';

  if (formData.salaryMin !== undefined && formData.salaryMax !== undefined) {
    if (formData.salaryMin > formData.salaryMax) {
      salaryError.value = '薪资区间设置错误：最低薪资不能高于最高薪资';
      return;
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

const openBatchEditDialog = () => {
  batchEditVisible.value = true;
  batchEditWarning.value = '';
  batchEditFilteredIds.value = selectedIds.value.length > 0 ? [...selectedIds.value] : [];
  Object.assign(batchEditFilterForm, {
    category: '',
    status: '',
    publishTimeRange: [],
  });
  Object.assign(batchEditForm, {
    salaryMin: undefined,
    salaryMax: undefined,
    salaryUnit: undefined,
    recruitNum: undefined,
    city: '',
    status: undefined,
  });
};

const applyBatchEditFilter = () => {
  let filtered = [...tableData.value];
  
  if (batchEditFilterForm.category) {
    filtered = filtered.filter(item => item.category === batchEditFilterForm.category);
  }
  
  if (batchEditFilterForm.status) {
    filtered = filtered.filter(item => item.status === batchEditFilterForm.status);
  }
  
  if (batchEditFilterForm.publishTimeRange.length === 2) {
    const [start, end] = batchEditFilterForm.publishTimeRange;
    const startTime = new Date(start as string).getTime();
    const endTime = new Date(end as string).getTime() + 24 * 60 * 60 * 1000;
    filtered = filtered.filter(item => {
      if (!item.publishTime) return false;
      const publishTime = new Date(item.publishTime).getTime();
      return publishTime >= startTime && publishTime < endTime;
    });
  }
  
  batchEditFilteredIds.value = filtered.map(item => item.id);
  
  const hasResumes = filtered.some(item => (item as any).resumeCount > 0);
  if (hasResumes) {
    batchEditWarning.value = '筛选结果中包含已投递简历的岗位，批量编辑时仅薪资和招聘人数会被更新';
  } else {
    batchEditWarning.value = '';
  }
};

const resetBatchEditFilter = () => {
  Object.assign(batchEditFilterForm, {
    category: '',
    status: '',
    publishTimeRange: [],
  });
  batchEditFilteredIds.value = selectedIds.value.length > 0 ? [...selectedIds.value] : [];
  batchEditWarning.value = '';
};

const handleBatchEditSubmit = async () => {
  if (batchEditFilteredIds.value.length === 0) {
    ElMessage.warning('请先选择要编辑的岗位');
    return;
  }
  
  const updateData: Partial<JobItem> = {};
  if (batchEditForm.salaryMin !== undefined) updateData.salaryMin = batchEditForm.salaryMin;
  if (batchEditForm.salaryMax !== undefined) updateData.salaryMax = batchEditForm.salaryMax;
  if (batchEditForm.salaryUnit !== undefined) updateData.salaryUnit = batchEditForm.salaryUnit;
  if (batchEditForm.recruitNum !== undefined) updateData.recruitNum = batchEditForm.recruitNum;
  if (batchEditForm.city && batchEditForm.city.trim() !== '') updateData.city = batchEditForm.city.trim();
  if (batchEditForm.status !== undefined) updateData.status = batchEditForm.status;
  
  const filter: BatchEditFilter = {
    category: batchEditFilterForm.category || undefined,
    status: batchEditFilterForm.status || undefined,
  };
  
  if (batchEditFilterForm.publishTimeRange.length === 2) {
    filter.publishTimeStart = batchEditFilterForm.publishTimeRange[0] as string;
    filter.publishTimeEnd = batchEditFilterForm.publishTimeRange[1] as string;
  }
  
  batchEditLoading.value = true;
  try {
    const result = await batchUpdateJobApi(batchEditFilteredIds.value, updateData, filter);
    batchEditVisible.value = false;
    
    if (result.failed > 0) {
      ElMessage.warning(`批量编辑完成：成功 ${result.success} 个，失败 ${result.failed} 个`);
    } else {
      ElMessage.success('批量编辑成功');
    }
    
    fetchList(true);
  } catch (error: any) {
    ElMessage.error(error.message || '批量编辑失败');
  } finally {
    batchEditLoading.value = false;
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

  :deep(.el-table .row-highlight) {
    background-color: mix($color-primary, #fff, 8%) !important;
    transition: background-color 0.3s ease;
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

  .text-secondary {
    color: $text-secondary;
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

  .slide-fade-enter-active,
  .slide-fade-leave-active {
    transition: all 0.3s ease;
  }

  .slide-fade-enter-from {
    transform: translateY(-10px);
    opacity: 0;
  }

  .slide-fade-leave-to {
    transform: translateY(10px);
    opacity: 0;
  }

  .reject-tip,
  .locked-tip,
  .major-change-tip,
  .match-weight-tip {
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

  .change-compare {
    display: flex;
    align-items: center;
    gap: 8px;

    .old-value {
      color: $text-secondary;
      text-decoration: line-through;
    }

    .new-value {
      color: $color-success;
      font-weight: 500;
    }

    .no-change {
      color: $text-primary;
    }
  }

  .detail-action-bar {
    margin-top: $spacing-base;
    padding-top: $spacing-base;
    border-top: 1px solid $border-color;
    display: flex;
    gap: $spacing-sm;
    justify-content: flex-end;
  }

  .loading-wrapper {
    padding: $spacing-base 0;
  }

  .change-audit-section {
    .el-descriptions {
      margin-bottom: $spacing-base;
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

      .log-changes {
        margin-top: 8px;
      }
    }
  }

  .filter-section {
    background: $bg-light;
    padding: $spacing-base;
    border-radius: $border-radius;
    margin-bottom: $spacing-base;

    .filter-count {
      margin-left: $spacing-sm;
      color: $text-secondary;
      font-size: $font-size-sm;

      strong {
        color: $color-primary;
      }
    }
  }

  .salary-range-input {
    display: flex;
    align-items: center;
    gap: 8px;

    .range-separator {
      color: $text-secondary;
    }
  }

  .batch-edit-warning {
    margin-top: $spacing-base;
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

  .version-diff-section {
    .el-table {
      margin-bottom: $spacing-base;
    }
  }
}
</style>
